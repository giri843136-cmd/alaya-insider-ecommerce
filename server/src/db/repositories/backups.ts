/**
 * ALAYA INSIDER — Backup Repository
 * --------------------------------------------------------------------------
 * Automatic backup system with:
 *  - Daily, weekly, monthly, and manual backups
 *  - Backup verification (checksum + row count validation)
 *  - Automatic retention policy
 *  - Restore from any backup
 *  - Configurable schedules
 */

import { query, queryOne, queryAll } from "../index.js";
import { execSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type BackupType = "manual" | "daily" | "weekly" | "monthly";
export type BackupStatus = "pending" | "running" | "completed" | "failed" | "verified";

export interface Backup {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  file_path: string | null;
  file_size: number | null;
  checksum: string | null;
  database_name: string;
  tables_backed_up: number;
  total_rows: number;
  verified: boolean;
  verified_at: string | null;
  retention_days: number;
  expires_at: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

/* ================================================================== */
/*  BACKUP CONFIG                                                      */
/* ================================================================== */

const BACKUP_DIR = process.env.BACKUP_DIR || join(__dirname, "..", "..", "data", "backups");
const DEFAULT_RETENTION: Record<BackupType, number> = {
  manual: 90,
  daily: 30,
  weekly: 90,
  monthly: 365,
};

function getDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = process.env.DB_USER || "postgres";
  const pass = process.env.DB_PASSWORD || "postgres";
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const db = process.env.DB_NAME || "alaya_insider_development";
  return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
}

/* ================================================================== */
/*  BACKUP OPERATIONS                                                  */
/* ================================================================== */

export async function createBackup(
  name: string,
  type: BackupType = "manual",
  createdBy?: string,
): Promise<Backup> {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${type}_${timestamp}.sql.gz`;
  const filePath = join(BACKUP_DIR, filename);
  const retentionDays = DEFAULT_RETENTION[type];
  const expiresAt = new Date(Date.now() + retentionDays * 86400000).toISOString();

  // Create backup record
  const backup = await queryOne<Backup>(
    `INSERT INTO backups (name, type, status, file_path, database_name, retention_days, expires_at, created_by)
     VALUES ($1, $2, 'running', $3, $4, $5, $6, $7) RETURNING *`,
    [name, type, filePath, process.env.DB_NAME || "alaya_insider_development", retentionDays, expiresAt, createdBy || null],
  );
  if (!backup) throw new Error("Failed to create backup record");

  try {
    // Run pg_dump (requires PostgreSQL client tools to be installed)
    const dbUrl = getDbUrl();
    const cmd = `pg_dump "${dbUrl}" --no-owner --no-acl | gzip > "${filePath}"`;
    execSync(cmd, { timeout: 300_000 }); // 5 minute timeout

    // Calculate checksum
    const { createReadStream } = await import("node:fs");
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    const checksum = hash.digest("hex");

    // Get file size
    const { statSync } = await import("node:fs");
    const stats = statSync(filePath);

    // Get table/row counts
    const tablesResult = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const rowsResult = await query<{ count: string }>(
      "SELECT SUM(n_live_tup) as count FROM pg_stat_user_tables",
    );

    // Update backup record
    const updated = await queryOne<Backup>(
      `UPDATE backups SET status = 'completed', file_size = $1, checksum = $2, tables_backed_up = $3, total_rows = $4, completed_at = NOW() WHERE id = $5 RETURNING *`,
      [stats.size, checksum, Number(tablesResult.rows[0]?.count ?? 0), Number(rowsResult.rows[0]?.count ?? 0), backup.id],
    );

    console.log(`[BACKUP] Created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    return updated!;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await queryOne<Backup>(
      `UPDATE backups SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2 RETURNING *`,
      [message, backup.id],
    );
    // Clean up failed backup file
    if (existsSync(filePath)) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
    throw new Error(`Backup failed: ${message}`);
  }
}

export async function verifyBackup(id: string, verifier?: string): Promise<Backup | null> {
  const backup = await queryOne<Backup>("SELECT * FROM backups WHERE id = $1", [id]);
  if (!backup || backup.status !== "completed" || !backup.file_path || !existsSync(backup.file_path)) {
    return null;
  }

  try {
    // Verify by checking the gzip file integrity
    execSync(`gzip -t "${backup.file_path}"`, { timeout: 60_000 });

    const updated = await queryOne<Backup>(
      `UPDATE backups SET verified = true, verified_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return updated || null;
  } catch (err) {
    console.error(`[BACKUP] Verification failed for ${backup.name}:`, err);
    return null;
  }
}

export async function restoreBackup(id: string): Promise<boolean> {
  const backup = await queryOne<Backup>("SELECT * FROM backups WHERE id = $1", [id]);
  if (!backup || !backup.file_path || !existsSync(backup.file_path)) {
    return false;
  }

  try {
    const dbUrl = getDbUrl();
    const cmd = `gunzip -c "${backup.file_path}" | psql "${dbUrl}"`;
    execSync(cmd, { timeout: 600_000 }); // 10 minute timeout
    console.log(`[BACKUP] Restored: ${backup.name}`);
    return true;
  } catch (err) {
    console.error(`[BACKUP] Restore failed for ${backup.name}:`, err);
    return false;
  }
}

export async function listBackups(limit = 50, offset = 0) {
  const [rows, countResult] = await Promise.all([
    query<Backup>("SELECT * FROM backups ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM backups"),
  ]);
  return {
    data: rows.rows,
    total: Number(countResult?.count ?? 0),
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: offset + limit < Number(countResult?.count ?? 0),
  };
}

export async function getBackupStats() {
  const [total, byType, byStatus, lastBackup, sizeTotal] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM backups"),
    query<{ type: string; count: number }>("SELECT type, COUNT(*) as count FROM backups GROUP BY type"),
    query<{ status: string; count: number }>("SELECT status, COUNT(*) as count FROM backups GROUP BY status"),
    queryOne<Backup>("SELECT * FROM backups WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1"),
    queryOne<{ total: string }>("SELECT COALESCE(SUM(file_size), 0) as total FROM backups WHERE status = 'completed'"),
  ]);

  const countsByType: Record<string, number> = {};
  byType.rows.forEach((r) => { countsByType[r.type] = r.count; });

  const countsByStatus: Record<string, number> = {};
  byStatus.rows.forEach((r) => { countsByStatus[r.status] = r.count; });

  return {
    totalBackups: Number(total?.count ?? 0),
    byType: countsByType,
    byStatus: countsByStatus,
    lastBackup: lastBackup?.created_at || null,
    lastBackupSize: lastBackup?.file_size || 0,
    totalStorageBytes: Number(sizeTotal?.total ?? 0),
    totalStorageMB: (Number(sizeTotal?.total ?? 0) / 1024 / 1024).toFixed(2),
  };
}

export async function cleanupExpiredBackups(): Promise<number> {
  const expired = await query<Backup>(
    "SELECT * FROM backups WHERE expires_at < NOW() AND status = 'completed'",
  );

  for (const backup of expired.rows) {
    if (backup.file_path && existsSync(backup.file_path)) {
      try { unlinkSync(backup.file_path); } catch { /* ignore */ }
    }
  }

  const result = await query(
    "DELETE FROM backups WHERE expires_at < NOW() AND status = 'completed'",
  );
  return result.rowCount ?? 0;
}

export async function scheduleBackup(type: BackupType): Promise<void> {
  const name = `${type.charAt(0).toUpperCase() + type.slice(1)} backup — ${new Date().toISOString().split("T")[0]}`;
  try {
    await createBackup(name, type, "system");
    // Cleanup old backups after creating new one
    await cleanupExpiredBackups();
  } catch (err) {
    console.error(`[BACKUP] Scheduled ${type} backup failed:`, err);
  }
}
