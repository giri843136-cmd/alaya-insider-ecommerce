/**
 * ALAYA INSIDER — Background Jobs Repository
 * --------------------------------------------------------------------------
 * Persistent job queue with PostgreSQL storage.
 * Supports pending, running, completed, failed, retry, cancelled, and scheduled states.
 */

import { query, queryOne, queryAll, type PaginatedResult } from "../index.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type JobStatus = "pending" | "running" | "completed" | "failed" | "retry" | "cancelled" | "scheduled";
export type JobType = 
  | "image_optimization"
  | "supplier_sync"
  | "affiliate_sync"
  | "analytics"
  | "email"
  | "sms"
  | "report"
  | "ai"
  | "backup"
  | "data_migration"
  | "import"
  | "export";

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  type: JobType;
  priority?: number;
  payload?: Record<string, unknown>;
  max_retries?: number;
  scheduled_at?: string;
}

/* ================================================================== */
/*  CRUD OPERATIONS                                                    */
/* ================================================================== */

export async function createJob(input: CreateJobInput): Promise<Job> {
  const result = await query<Job>(
    `INSERT INTO jobs (type, status, priority, payload, max_retries, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      input.type,
      input.scheduled_at ? "scheduled" : "pending",
      input.priority || 0,
      JSON.stringify(input.payload || {}),
      input.max_retries || 3,
      input.scheduled_at || null,
    ],
  );
  return result.rows[0];
}

export async function getJob(id: string): Promise<Job | null> {
  return queryOne<Job>("SELECT * FROM jobs WHERE id = $1", [id]);
}

export async function listJobs(
  status?: JobStatus,
  type?: JobType,
  limit = 50,
  offset = 0,
): Promise<PaginatedResult<Job>> {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (type) {
    conditions.push(`type = $${idx++}`);
    params.push(type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs ${where}`, params);
  const total = Number(countResult.rows[0]?.count ?? 0);

  params.push(limit);
  params.push(offset);

  const dataResult = await query<Job>(
    `SELECT * FROM jobs ${where} ORDER BY priority DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  return {
    data: dataResult.rows,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: offset + limit < total,
  };
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  result?: Record<string, unknown>,
  errorMessage?: string,
): Promise<Job | null> {
  const now = new Date().toISOString();
  const updates: string[] = [`status = $2`, `updated_at = $3`];
  const params: any[] = [id, status, now];

  if (status === "running") {
    updates.push(`started_at = $${params.length + 1}`);
    params.push(now);
  }
  if (status === "completed") {
    updates.push(`completed_at = $${params.length + 1}`);
    params.push(now);
    if (result) {
      updates.push(`result = $${params.length + 1}`);
      params.push(JSON.stringify(result));
    }
  }
  if (status === "failed" && errorMessage) {
    updates.push(`error_message = $${params.length + 1}`);
    params.push(errorMessage);
    updates.push(`retry_count = retry_count + 1`);
  }
  if (status === "retry") {
    updates.push(`retry_count = retry_count + 1`);
  }

  const result_query = await query<Job>(
    `UPDATE jobs SET ${updates.join(", ")} WHERE id = $1 RETURNING *`,
    params,
  );
  return result_query.rows[0] || null;
}

export async function claimNextJob(): Promise<Job | null> {
  // Atomically claim the next pending or scheduled job
  const result = await query<Job>(`
    UPDATE jobs
    SET status = 'running', started_at = NOW(), updated_at = NOW()
    WHERE id = (
      SELECT id FROM jobs
      WHERE (status = 'pending' OR (status = 'scheduled' AND scheduled_at <= NOW()))
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);
  return result.rows[0] || null;
}

export async function retryFailedJob(id: string): Promise<Job | null> {
  const job = await getJob(id);
  if (!job || job.status !== "failed") return null;
  if (job.retry_count >= job.max_retries) return null;

  return updateJobStatus(id, "retry");
}

export async function cancelJob(id: string): Promise<Job | null> {
  return updateJobStatus(id, "cancelled");
}

export async function getJobStats(): Promise<{
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  scheduled: number;
  byType: { type: string; count: number }[];
}> {
  const [total, byStatus, byType] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM jobs"),
    query<{ status: string; count: number }>(
      "SELECT status, COUNT(*) as count FROM jobs GROUP BY status",
    ),
    query<{ type: string; count: number }>(
      "SELECT type, COUNT(*) as count FROM jobs GROUP BY type ORDER BY count DESC",
    ),
  ]);

  const counts: Record<string, number> = {};
  byStatus.rows.forEach((r: { status: string; count: number }) => { counts[r.status] = r.count; });

  return {
    total: Number(total?.count ?? 0),
    pending: counts.pending || 0,
    running: counts.running || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    scheduled: counts.scheduled || 0,
    byType: byType.rows,
  };
}

export async function cleanupOldJobs(retentionDays = 30): Promise<number> {
  const result = await query(
    `DELETE FROM jobs WHERE created_at < NOW() - INTERVAL '${retentionDays} days' AND status IN ('completed', 'cancelled')`,
  );
  return result.rowCount ?? 0;
}
