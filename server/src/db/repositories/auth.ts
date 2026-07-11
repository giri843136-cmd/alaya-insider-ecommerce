/**
 * ALAYA INSIDER — Auth Repository
 * --------------------------------------------------------------------------
 * PostgreSQL-backed persistence for the authentication service.
 * Replaces the legacy in-memory getStore()._auth pattern.
 *
 * OTP storage remains in-memory (intentional ephemeral cache, 5-min TTL).
 * All other auth data (users, sessions, devices, recovery codes,
 * OAuth accounts, login history, security events, settings) is stored
 * in PostgreSQL tables.
 */

import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../index.js";

/* ================================================================== */
/*  ADMIN USERS (table: users)                                         */
/* ================================================================== */

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  phone: string;
  mfa_method: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUserRow | null> {
  return queryOne<AdminUserRow>(
    "SELECT * FROM users WHERE email ILIKE $1 AND role IN ('super_admin','admin') LIMIT 1",
    [email],
  );
}

export async function getSuperAdminUser(): Promise<AdminUserRow | null> {
  return queryOne<AdminUserRow>(
    "SELECT * FROM users WHERE role = 'super_admin' LIMIT 1",
  );
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  password_hash: string;
  role: string;
  phone: string;
  mfa_method: string;
  permissions: string[];
}): Promise<AdminUserRow> {
  const id = uuidv4();
  return queryOne<AdminUserRow>(
    `INSERT INTO users (id, email, name, password_hash, role, phone, mfa_method, is_active, permissions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
     RETURNING *`,
    [id, input.email, input.name, input.password_hash, input.role, input.phone, input.mfa_method,
     JSON.stringify(input.permissions)],
  ) as Promise<AdminUserRow>;
}

export async function updateAdminUser(
  id: string,
  patch: { email?: string; name?: string; password_hash?: string; phone?: string; mfa_method?: string },
): Promise<AdminUserRow | null> {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (patch.email !== undefined) { sets.push(`email = $${idx++}`); values.push(patch.email); }
  if (patch.name !== undefined) { sets.push(`name = $${idx++}`); values.push(patch.name); }
  if (patch.password_hash !== undefined) { sets.push(`password_hash = $${idx++}`); values.push(patch.password_hash); }
  if (patch.phone !== undefined) { sets.push(`phone = $${idx++}`); values.push(patch.phone); }
  if (patch.mfa_method !== undefined) { sets.push(`mfa_method = $${idx++}`); values.push(patch.mfa_method); }

  if (sets.length === 0) return getAdminUserById(id);
  sets.push(`updated_at = NOW()`);
  values.push(id);

  return queryOne<AdminUserRow>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
}

async function getAdminUserById(id: string): Promise<AdminUserRow | null> {
  return queryOne<AdminUserRow>("SELECT * FROM users WHERE id = $1", [id]);
}

/* ================================================================== */
/*  SESSIONS (table: sessions)                                         */
/* ================================================================== */

export interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  refresh_token: string;
  ip_address: string;
  user_agent: string;
  device_info: Record<string, unknown> | null;
  expires_at: string;
  created_at: string;
}

export async function createSessionRow(input: {
  user_id: string;
  token: string;
  refresh_token: string;
  ip_address: string;
  user_agent: string;
  device_info: Record<string, unknown>;
  expires_at: string;
}): Promise<SessionRow> {
  const id = uuidv4();
  return queryOne<SessionRow>(
    `INSERT INTO sessions (id, user_id, token, refresh_token, ip_address, user_agent, device_info, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [id, input.user_id, input.token, input.refresh_token, input.ip_address, input.user_agent,
     JSON.stringify(input.device_info), input.expires_at],
  ) as Promise<SessionRow>;
}

export async function getSessionByToken(token: string): Promise<SessionRow | null> {
  return queryOne<SessionRow>(
    "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
    [token],
  );
}

export async function getSessionByRefreshToken(refreshToken: string): Promise<SessionRow | null> {
  return queryOne<SessionRow>(
    "SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()",
    [refreshToken],
  );
}

export async function getUserSessions(userId: string): Promise<SessionRow[]> {
  return queryAll<SessionRow>(
    "SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC",
    [userId],
  );
}

export async function updateSessionToken(sessionId: string, newToken: string, newRefreshToken: string, expiresAt: string): Promise<void> {
  await query(
    `UPDATE sessions SET token = $1, refresh_token = $2, expires_at = $3 WHERE id = $4`,
    [newToken, newRefreshToken, expiresAt, sessionId],
  );
}

export async function touchSession(sessionId: string): Promise<void> {
  await query(
    "UPDATE sessions SET expires_at = NOW() + INTERVAL '8 hours' WHERE id = $1",
    [sessionId],
  );
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const result = await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  return result.rowCount ?? 0;
}

export async function cleanupExpiredSessions(): Promise<void> {
  await query("DELETE FROM sessions WHERE expires_at < NOW()");
}

/* ================================================================== */
/*  TRUSTED DEVICES (table: trusted_devices)                           */
/* ================================================================== */

export interface TrustedDeviceRow {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string;
  last_used_at: string;
  created_at: string;
}

export async function addTrustedDeviceRow(input: {
  user_id: string;
  device_fingerprint: string;
  device_name: string;
}): Promise<TrustedDeviceRow> {
  // Remove old device with same fingerprint
  await query(
    "DELETE FROM trusted_devices WHERE user_id = $1 AND device_fingerprint = $2",
    [input.user_id, input.device_fingerprint],
  );

  const id = uuidv4();
  return queryOne<TrustedDeviceRow>(
    `INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_name, last_used_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [id, input.user_id, input.device_fingerprint, input.device_name],
  ) as Promise<TrustedDeviceRow>;
}

export async function removeTrustedDeviceRow(userId: string, deviceId: string): Promise<boolean> {
  const result = await query(
    "DELETE FROM trusted_devices WHERE id = $1 AND user_id = $2",
    [deviceId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getTrustedDeviceRows(userId: string): Promise<TrustedDeviceRow[]> {
  return queryAll<TrustedDeviceRow>(
    "SELECT * FROM trusted_devices WHERE user_id = $1 ORDER BY last_used_at DESC",
    [userId],
  );
}

export async function isKnownDevice(userId: string, fingerprint: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM trusted_devices WHERE user_id = $1 AND device_fingerprint = $2",
    [userId, fingerprint],
  );
  return row !== null;
}

/* ================================================================== */
/*  RECOVERY CODES (table: recovery_codes)                             */
/* ================================================================== */

export interface RecoveryCodeRow {
  id: string;
  user_id: string;
  code_hash: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export async function createRecoveryCodes(userId: string, codes: { hash: string; expiresAt: string }[]): Promise<void> {
  // Remove existing unused codes
  await query("DELETE FROM recovery_codes WHERE user_id = $1 AND used = false", [userId]);

  // Insert new codes
  for (const code of codes) {
    const id = uuidv4();
    await query(
      `INSERT INTO recovery_codes (id, user_id, code_hash, used, expires_at)
       VALUES ($1, $2, $3, false, $4)`,
      [id, userId, code.hash, code.expiresAt],
    );
  }
}

export async function findAndUseRecoveryCode(userId: string, codeHash: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM recovery_codes
     WHERE user_id = $1 AND code_hash = $2 AND used = false AND expires_at > NOW()
     LIMIT 1`,
    [userId, codeHash],
  );
  if (!row) return false;

  await query(
    "UPDATE recovery_codes SET used = true, used_at = NOW() WHERE id = $1",
    [row.id],
  );
  return true;
}

export async function getRecoveryCodeCounts(userId: string): Promise<{ total: number; used: number; remaining: number }> {
  const row = await queryOne<{ total: string; used: string }>(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE used = true) as used
     FROM recovery_codes WHERE user_id = $1`,
    [userId],
  );
  const total = Number(row?.total ?? 0);
  const used = Number(row?.used ?? 0);
  return { total, used, remaining: total - used };
}

/* ================================================================== */
/*  OAUTH ACCOUNTS (table: oauth_accounts)                             */
/* ================================================================== */

export interface OAuthAccountRow {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
  email: string;
  name: string;
  avatar: string;
  linked_at: string;
}

export async function getOAuthAccount(provider: string, providerId: string): Promise<OAuthAccountRow | null> {
  return queryOne<OAuthAccountRow>(
    "SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_id = $2",
    [provider, providerId],
  );
}

export async function createOAuthAccount(input: {
  user_id: string;
  provider: string;
  provider_id: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<OAuthAccountRow> {
  const id = uuidv4();
  return queryOne<OAuthAccountRow>(
    `INSERT INTO oauth_accounts (id, user_id, provider, provider_id, email, name, avatar)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, input.user_id, input.provider, input.provider_id, input.email, input.name, input.avatar || ""],
  ) as Promise<OAuthAccountRow>;
}

export async function updateOAuthAccountName(id: string, name: string, avatar?: string): Promise<void> {
  if (avatar !== undefined) {
    await query(
      "UPDATE oauth_accounts SET name = $1, avatar = $2 WHERE id = $3",
      [name, avatar, id],
    );
  } else {
    await query(
      "UPDATE oauth_accounts SET name = $1 WHERE id = $2",
      [name, id],
    );
  }
}

/* ================================================================== */
/*  OTPS (table: otps)                                                  */
/* ================================================================== */

export interface OtpRow {
  id: string;
  user_id: string;
  email: string;
  mobile: string;
  otp_hash: string;
  channel: string;
  purpose: string;
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
  used: boolean;
  verified_at: string | null;
  ip_address: string;
  user_agent: string;
  locked_until: string | null;
  created_at: string;
}

/**
 * Create a new OTP record in PostgreSQL.
 * The OTP code is hashed — never stored in plaintext.
 */
export async function createOtp(input: {
  email?: string;
  mobile?: string;
  otp_hash: string;
  channel: "email" | "sms";
  purpose: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  max_attempts?: number;
}): Promise<OtpRow> {
  const id = uuidv4();
  return queryOne<OtpRow>(
    `INSERT INTO otps (id, email, mobile, otp_hash, channel, purpose, expires_at, ip_address, user_agent, max_attempts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      input.email || "",
      input.mobile || "",
      input.otp_hash,
      input.channel,
      input.purpose,
      input.expires_at,
      input.ip_address || "",
      input.user_agent || "",
      input.max_attempts || 5,
    ],
  ) as Promise<OtpRow>;
}

/**
 * Find a valid, unexpired, unused OTP for the given identifier and purpose.
 * Returns the most recent matching OTP.
 */
export async function findValidOtp(
  identifier: string,
  purpose: string,
): Promise<OtpRow | null> {
  return queryOne<OtpRow>(
    `SELECT * FROM otps
     WHERE (email = $1 OR mobile = $1)
     AND purpose = $2
     AND used = false
     AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [identifier, purpose],
  );
}

/**
 * Mark an OTP as used (successful verification).
 */
export async function markOtpUsed(id: string): Promise<void> {
  await query(
    "UPDATE otps SET used = true, verified_at = NOW() WHERE id = $1",
    [id],
  );
}

/**
 * Increment the attempt counter for an OTP.
 */
export async function incrementOtpAttempt(id: string): Promise<void> {
  await query(
    "UPDATE otps SET attempt_count = attempt_count + 1 WHERE id = $1",
    [id],
  );
}

/**
 * Lock an OTP (too many failed attempts).
 */
export async function lockOtp(id: string, lockedUntil: string): Promise<void> {
  await query(
    "UPDATE otps SET locked_until = $1 WHERE id = $2",
    [lockedUntil, id],
  );
}

/**
 * Clean up expired OTPs that are past their expiry.
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await query("DELETE FROM otps WHERE expires_at < NOW()");
  return result.rowCount ?? 0;
}

/**
 * Invalidate all pending (unused, unexpired) OTPs for an identifier.
 * Called before issuing a new OTP to prevent multiple valid OTPs.
 */
export async function invalidatePendingOtps(identifier: string): Promise<void> {
  await query(
    `UPDATE otps SET used = true
     WHERE (email = $1 OR mobile = $1)
     AND used = false
     AND expires_at > NOW()`,
    [identifier],
  );
}

/* ================================================================== */
/*  AUDIT LOGS (login history + security events via audit_logs table)  */
/* ================================================================== */

export async function createAuditEntry(input: {
  actor: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  meta?: string;
  ip_address?: string;
  session_id?: string;
}): Promise<void> {
  await query(
    `INSERT INTO audit_logs (actor, action, entity_type, entity_id, before_data, after_data, meta, ip_address, session_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.actor || "system",
      input.action,
      input.entity_type,
      input.entity_id || null,
      input.before_data ? JSON.stringify(input.before_data) : null,
      input.after_data ? JSON.stringify(input.after_data) : null,
      input.meta || null,
      input.ip_address || null,
      input.session_id || null,
    ],
  );
}

export async function getAuditEntries(
  entityType: string,
  entityId?: string,
  limit = 100,
): Promise<any[]> {
  if (entityId) {
    return queryAll(
      "SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT $3",
      [entityType, entityId, limit],
    );
  }
  return queryAll(
    "SELECT * FROM audit_logs WHERE entity_type = $1 ORDER BY created_at DESC LIMIT $2",
    [entityType, limit],
  );
}

/* ================================================================== */
/*  AUTH SETTINGS (table: settings, key: 'auth_settings')              */
/* ================================================================== */

const AUTH_SETTINGS_KEY = "auth_settings";

export async function getAuthSettings(): Promise<any> {
  const row = await queryOne<{ value: any }>(
    "SELECT value FROM settings WHERE key = $1",
    [AUTH_SETTINGS_KEY],
  );
  return row?.value || getDefaultAuthSettings();
}

export async function saveAuthSettings(settings: any): Promise<void> {
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM settings WHERE key = $1",
    [AUTH_SETTINGS_KEY],
  );
  if (existing) {
    await query(
      "UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2",
      [JSON.stringify(settings), AUTH_SETTINGS_KEY],
    );
  } else {
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2)",
      [AUTH_SETTINGS_KEY, JSON.stringify(settings)],
    );
  }
}

export function getDefaultAuthSettings(): any {
  return {
    customer: {
      emailOtpEnabled: true,
      googleLoginEnabled: true,
      appleSignInEnabled: true,
      guestBrowsingEnabled: true,
      passwordLoginEnabled: false,
    },
    admin: {
      emailOtpEnabled: true,
      mobileOtpEnabled: true,
      requirePassword: true,
      require2FA: true,
      trustedDevicesEnabled: true,
      sessionTimeoutMinutes: 480,
      idleTimeoutMinutes: 30,
      otpLength: 6,
      otpExpirySeconds: 300,
      retryLimit: 5,
      lockoutDurationSeconds: 60,
      rateLimitPerMinute: 10,
      captchaAfterAttempts: 3,
    },
    providers: {
      sms: { enabled: false, provider: "twilio" },
      smtp: { enabled: false, host: "", port: 587 },
      google: { enabled: false, clientId: "", clientSecret: "" },
      apple: { enabled: false, teamId: "", keyId: "", clientId: "" },
    },
  };
}
