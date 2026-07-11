/**
 * ALAYA INSIDER — Audit Log Repository
 * --------------------------------------------------------------------------
 * Tracks every database mutation with who, when, before, after, IP, and session.
 * Audit logs are append-only and never deleted.
 */

import { query, queryOne, buildPaginatedQuery, getTotalCount, type PaginatedResult, type ListParams } from "../index.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  meta: string | null;
  ip_address: string | null;
  session_id: string | null;
  created_at: string;
}

export interface CreateAuditInput {
  actor: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  meta?: string;
  ip_address?: string;
  session_id?: string;
}

/* ================================================================== */
/*  CREATE AUDIT LOG                                                   */
/* ================================================================== */

let _auditBuffer: CreateAuditInput[] = [];
let _auditTimer: ReturnType<typeof setTimeout> | null = null;
const AUDIT_BATCH_SIZE = 50;

/**
 * Create an audit log entry. Buffers and batch-inserts for performance.
 */
export async function createAuditLog(input: CreateAuditInput): Promise<void> {
  _auditBuffer.push(input);

  if (_auditBuffer.length >= AUDIT_BATCH_SIZE) {
    await flushAuditLogs();
    return;
  }

  if (!_auditTimer) {
    _auditTimer = setTimeout(() => flushAuditLogs(), 500);
  }
}

async function flushAuditLogs(): Promise<void> {
  if (_auditTimer) {
    clearTimeout(_auditTimer);
    _auditTimer = null;
  }

  const batch = _auditBuffer.splice(0, AUDIT_BATCH_SIZE);
  if (batch.length === 0) return;

  try {
    const values: any[] = [];
    const placeholders: string[] = [];

    batch.forEach((entry, i) => {
      const base = i * 9;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`,
      );
      values.push(
        entry.actor || "system",
        entry.action,
        entry.entity_type,
        entry.entity_id || null,
        entry.before_data ? JSON.stringify(entry.before_data) : null,
        entry.after_data ? JSON.stringify(entry.after_data) : null,
        entry.meta || null,
        entry.ip_address || null,
        entry.session_id || null,
      );
    });

    await query(
      `INSERT INTO audit_logs (actor, action, entity_type, entity_id, before_data, after_data, meta, ip_address, session_id) VALUES ${placeholders.join(", ")}`,
      values,
    );
  } catch (err) {
    console.error("[AUDIT] Failed to flush audit logs:", err);
    // Re-queue on failure to prevent data loss
    _auditBuffer.unshift(...batch);
  }
}

/* ================================================================== */
/*  QUERY AUDIT LOGS                                                   */
/* ================================================================== */

export async function listAuditLogs(params: ListParams = {}): Promise<PaginatedResult<AuditEntry>> {
  return query<AuditEntry>(
    "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [params.pageSize || 50, ((params.page || 1) - 1) * (params.pageSize || 50)],
  ).then((result) => ({
    data: result.rows,
    total: result.rows.length,
    page: params.page || 1,
    pageSize: params.pageSize || 50,
    hasMore: result.rows.length === (params.pageSize || 50),
  }));
}

export async function getAuditLogsForEntity(
  entityType: string,
  entityId: string,
  limit = 50,
): Promise<AuditEntry[]> {
  const result = await query<AuditEntry>(
    "SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT $3",
    [entityType, entityId, limit],
  );
  return result.rows;
}

export async function getAuditLogsByActor(
  actor: string,
  limit = 50,
): Promise<AuditEntry[]> {
  const result = await query<AuditEntry>(
    "SELECT * FROM audit_logs WHERE actor = $1 ORDER BY created_at DESC LIMIT $2",
    [actor, limit],
  );
  return result.rows;
}

export async function getAuditStats(): Promise<{
  totalLogs: number;
  uniqueActors: number;
  uniqueActions: number;
  last24h: number;
  topActions: { action: string; count: number }[];
}> {
  const [total, actors, actions, last24h, topActions] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM audit_logs"),
    queryOne<{ count: string }>("SELECT COUNT(DISTINCT actor) as count FROM audit_logs"),
    queryOne<{ count: string }>("SELECT COUNT(DISTINCT action) as count FROM audit_logs"),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours'"),
    query<{ action: string; count: number }>(
      "SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 20",
    ),
  ]);

  return {
    totalLogs: Number(total?.count ?? 0),
    uniqueActors: Number(actors?.count ?? 0),
    uniqueActions: Number(actions?.count ?? 0),
    last24h: Number(last24h?.count ?? 0),
    topActions: topActions.rows,
  };
}

/* ================================================================== */
/*  FLUSH ON SHUTDOWN                                                  */
/* ================================================================== */

export async function flushAuditLogsSync(): Promise<void> {
  await flushAuditLogs();
}
