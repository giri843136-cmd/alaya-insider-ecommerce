/**
 * ALAYA INSIDER — Integrations Repository
 * --------------------------------------------------------------------------
 * PostgreSQL-backed persistence for the Enterprise Integrations Center.
 * Replaces the legacy in-memory getStore()._integrations pattern.
 *
 * Tables:
 *   integration_configs   — Encrypted credential storage per provider
 *   integration_logs       — Audit trail for integration operations
 *   integration_backups    — Encrypted config snapshots for restore
 */

import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../index.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface IntegrationConfigRow {
  id: string;
  module: string;
  provider: string;
  label: string;
  enabled: boolean;
  environment: string;
  settings: Record<string, string>;
  connection_status: string;
  last_tested_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  last_success_at: string | null;
  last_sync_at: string | null;
  metadata: Record<string, any> | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLogRow {
  id: string;
  integration_id: string;
  type: string;
  status: string;
  message: string;
  details: string | null;
  actor: string;
  actor_role: string | null;
  actor_ip: string | null;
  actor_user_agent: string | null;
  actor_device: string | null;
  actor_country: string | null;
  created_at: string;
}

export interface IntegrationBackupRow {
  id: string;
  label: string;
  environment: string;
  integration_count: number;
  checksum: string;
  data: Record<string, any>;
  created_by: string;
  created_at: string;
}

/* ================================================================== */
/*  INTEGRATION CONFIGS                                                */
/* ================================================================== */

export async function getAllConfigs(): Promise<IntegrationConfigRow[]> {
  return queryAll<IntegrationConfigRow>(
    "SELECT * FROM integration_configs ORDER BY module, provider ASC",
  );
}

export async function getConfig(id: string): Promise<IntegrationConfigRow | null> {
  return queryOne<IntegrationConfigRow>(
    "SELECT * FROM integration_configs WHERE id = $1",
    [id],
  );
}

export async function getConfigByModuleProvider(
  module: string,
  provider: string,
): Promise<IntegrationConfigRow | null> {
  return queryOne<IntegrationConfigRow>(
    "SELECT * FROM integration_configs WHERE module = $1 AND provider = $2",
    [module, provider],
  );
}

export async function getConfigsByModule(module: string): Promise<IntegrationConfigRow[]> {
  return queryAll<IntegrationConfigRow>(
    "SELECT * FROM integration_configs WHERE module = $1 ORDER BY provider ASC",
    [module],
  );
}

export async function getConfigsByEnvironment(env: string): Promise<IntegrationConfigRow[]> {
  return queryAll<IntegrationConfigRow>(
    "SELECT * FROM integration_configs WHERE environment = $1 ORDER BY module, provider ASC",
    [env],
  );
}

export async function createConfig(input: {
  id: string;
  module: string;
  provider: string;
  label: string;
  enabled: boolean;
  environment: string;
  settings: Record<string, string>;
  metadata: Record<string, any>;
  version?: number;
}): Promise<IntegrationConfigRow> {
  return queryOne<IntegrationConfigRow>(
    `INSERT INTO integration_configs (id, module, provider, label, enabled, environment,
      settings, connection_status, metadata, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.id,
      input.module,
      input.provider,
      input.label,
      input.enabled,
      input.environment,
      JSON.stringify(input.settings),
      "unknown",
      JSON.stringify(input.metadata),
      input.version || 1,
    ],
  ) as Promise<IntegrationConfigRow>;
}

export async function updateConfig(
  id: string,
  patch: {
    label?: string;
    enabled?: boolean;
    environment?: string;
    settings?: Record<string, string>;
    connection_status?: string;
    last_tested_at?: string;
    last_error?: string | null;
    last_error_at?: string | null;
    last_success_at?: string | null;
    last_sync_at?: string | null;
    metadata?: Record<string, any>;
    version?: number;
  },
): Promise<IntegrationConfigRow | null> {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (patch.label !== undefined) { sets.push(`label = $${idx++}`); values.push(patch.label); }
  if (patch.enabled !== undefined) { sets.push(`enabled = $${idx++}`); values.push(patch.enabled); }
  if (patch.environment !== undefined) { sets.push(`environment = $${idx++}`); values.push(patch.environment); }
  if (patch.settings !== undefined) { sets.push(`settings = $${idx++}`); values.push(JSON.stringify(patch.settings)); }
  if (patch.connection_status !== undefined) { sets.push(`connection_status = $${idx++}`); values.push(patch.connection_status); }
  if (patch.last_tested_at !== undefined) { sets.push(`last_tested_at = $${idx++}`); values.push(patch.last_tested_at); }
  if (patch.last_error !== undefined) { sets.push(`last_error = $${idx++}`); values.push(patch.last_error); }
  if (patch.last_error_at !== undefined) { sets.push(`last_error_at = $${idx++}`); values.push(patch.last_error_at); }
  if (patch.last_success_at !== undefined) { sets.push(`last_success_at = $${idx++}`); values.push(patch.last_success_at); }
  if (patch.last_sync_at !== undefined) { sets.push(`last_sync_at = $${idx++}`); values.push(patch.last_sync_at); }
  if (patch.metadata !== undefined) { sets.push(`metadata = $${idx++}`); values.push(JSON.stringify(patch.metadata)); }
  if (patch.version !== undefined) { sets.push(`version = $${idx++}`); values.push(patch.version); }

  if (sets.length === 0) return getConfig(id);

  sets.push(`updated_at = NOW()`);
  values.push(id);

  return queryOne<IntegrationConfigRow>(
    `UPDATE integration_configs SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
}

export async function deleteConfig(id: string): Promise<boolean> {
  const result = await query("DELETE FROM integration_configs WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

/* ================================================================== */
/*  INTEGRATION LOGS                                                   */
/* ================================================================== */

export async function createLog(input: {
  integration_id: string;
  type: string;
  status: string;
  message: string;
  details?: string;
  actor: string;
  actor_role?: string;
  actor_ip?: string;
  actor_user_agent?: string;
  actor_device?: string;
  actor_country?: string;
}): Promise<void> {
  const id = uuidv4();
  await query(
    `INSERT INTO integration_logs (id, integration_id, type, status, message, details,
      actor, actor_role, actor_ip, actor_user_agent, actor_device, actor_country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      input.integration_id,
      input.type,
      input.status,
      input.message,
      input.details || null,
      input.actor || "system",
      input.actor_role || "super_admin",
      input.actor_ip || null,
      input.actor_user_agent || null,
      input.actor_device || null,
      input.actor_country || null,
    ],
  );
}

export async function getLogsForIntegration(
  integrationId: string,
  limit = 50,
): Promise<IntegrationLogRow[]> {
  return queryAll<IntegrationLogRow>(
    "SELECT * FROM integration_logs WHERE integration_id = $1 ORDER BY created_at DESC LIMIT $2",
    [integrationId, limit],
  );
}

export async function getAllLogs(limit = 100): Promise<IntegrationLogRow[]> {
  return queryAll<IntegrationLogRow>(
    "SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
}

/* ================================================================== */
/*  INTEGRATION BACKUPS                                                */
/* ================================================================== */

export async function createBackup(input: {
  id: string;
  label: string;
  environment: string;
  integration_count: number;
  checksum: string;
  data: Record<string, any>;
  created_by: string;
}): Promise<void> {
  await query(
    `INSERT INTO integration_backups (id, label, environment, integration_count, checksum, data, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.id,
      input.label,
      input.environment,
      input.integration_count,
      input.checksum,
      JSON.stringify(input.data),
      input.created_by,
    ],
  );
}

export async function listBackups(): Promise<IntegrationBackupRow[]> {
  return queryAll<IntegrationBackupRow>(
    "SELECT * FROM integration_backups ORDER BY created_at DESC",
  );
}

export async function getBackup(id: string): Promise<IntegrationBackupRow | null> {
  return queryOne<IntegrationBackupRow>(
    "SELECT * FROM integration_backups WHERE id = $1",
    [id],
  );
}

export async function deleteOldBackups(maxCount: number): Promise<void> {
  // Keep only the latest maxCount backups
  await query(
    `DELETE FROM integration_backups WHERE id NOT IN (
      SELECT id FROM integration_backups ORDER BY created_at DESC LIMIT $1
    )`,
    [maxCount],
  );
}
