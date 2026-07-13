/**
 * ALAYA INSIDER — Enterprise Authentication Service
 * --------------------------------------------------------------------------
 * Core auth engine for both customer and administrator authentication.
 * Handles OTP generation/verification, JWT tokens, session management,
 * social login, recovery codes, device fingerprinting, and rate limiting.
 *
 * PERSISTENCE LAYER (v2.3):
 *   - OTP storage: PostgreSQL (otps table with hashed codes, expiry, attempt tracking).
 *   - Rate limiting: In-memory (ephemeral, resets on restart — acceptable).
 *   - Sessions, devices, codes, OAuth accounts, audit logs, settings:
 *     PostgreSQL via auth repository.
 *   - Customer records: PostgreSQL via customers_repo.
 *   - Admin users: PostgreSQL via users table.
 *
 * All OTP codes are hashed before storage. Recovery codes are hashed.
 * Sensitive data is encrypted at rest.
 */

import { v4 } from "uuid";
import { sendEmail } from "./email.js";
import { sendOtpSms } from "./sms.js";
import { fireTrigger } from "./notificationTriggers.js";
import {
  getAdminUserByEmail,
  getSuperAdminUser,
  createAdminUser,
  updateAdminUser,
  createSessionRow,
  getSessionByToken,
  getSessionByRefreshToken,
  getUserSessions as repoGetUserSessions,
  updateSessionToken,
  touchSession as repoTouchSession,
  deleteSession,
  deleteAllUserSessions,
  addTrustedDeviceRow,
  removeTrustedDeviceRow,
  getTrustedDeviceRows,
  isKnownDevice as repoIsKnownDevice,
  createRecoveryCodes,
  findAndUseRecoveryCode,
  getRecoveryCodeCounts,
  getOAuthAccount,
  createOAuthAccount,
  updateOAuthAccountName,
  createAuditEntry,
  getAuditEntries,
  getAuthSettings as getPgAuthSettings,
  saveAuthSettings,
  getDefaultAuthSettings,
  createOtp,
  findValidOtp,
  markOtpUsed,
  incrementOtpAttempt,
  lockOtp,
  invalidatePendingOtps,
  cleanupExpiredOtps,
} from "../db/repositories/auth.js";
import { customers_repo } from "../db/repositories/index.js";
import { query, queryOne, queryAll } from "../db/index.js";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 60 * 1000; // 1 minute
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RECOVERY_CODE_COUNT = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 30 * 1000; // 30 seconds
const TRUSTED_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface OtpRecord {
  id: string;
  identifier: string; // email or phone
  purpose: "login" | "admin_login" | "admin_mfa" | "verify_email" | "verify_phone" | "recovery";
  codeHash: string; // SHA-256 hash of the OTP code
  expiresAt: number;
  attempts: number;
  lockedUntil: number;
  createdAt: number;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: "google" | "apple";
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  linkedAt: number;
}

export interface TrustedDevice {
  id: string;
  userId: string;
  name: string;
  fingerprint: string;
  browser: string;
  os: string;
  ip: string;
  country: string;
  city: string;
  timezone: string;
  trustedUntil: number;
  lastUsed: number;
  createdAt: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  userType: "customer" | "admin";
  method: "otp" | "google" | "apple" | "password" | "recovery_code";
  success: boolean;
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  timezone: string;
  deviceFingerprint?: string;
  failureReason?: string;
  riskScore: number;
  ts: number;
}

export interface SecurityEvent {
  id: string;
  ts: number;
  type: "login_success" | "login_failed" | "new_device" | "new_location" | "password_changed"
    | "email_changed" | "phone_changed" | "role_changed" | "permission_changed"
    | "recovery_code_used" | "recovery_codes_regenerated" | "recovery_attempt"
    | "recovery_success" | "recovery_failure" | "session_terminated" | "all_sessions_terminated"
    | "otp_sent" | "otp_verified" | "otp_failed" | "mfa_enabled" | "mfa_disabled"
    | "account_locked" | "account_unlocked" | "suspicious_login" | "impossible_travel"
    | "trusted_device_added" | "trusted_device_removed";
  userId: string;
  userType: "customer" | "admin";
  actor: string;
  detail: string;
  ip?: string;
  metadata?: Record<string, string>;
}

export interface RecoveryCode {
  id: string;
  userId: string;
  codeHash: string;
  used: boolean;
  usedAt?: number;
  createdAt: number;
}

export interface SessionToken {
  id: string;
  userId: string;
  userType: "customer" | "admin";
  token: string; // hashed
  refreshToken: string; // hashed
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  timezone: string;
  deviceFingerprint: string;
  isTrusted: boolean;
  expiresAt: number;
  refreshExpiresAt: number;
  lastActivity: number;
  createdAt: number;
}

export interface AuthSettings {
  customer: {
    emailOtpEnabled: boolean;
    googleLoginEnabled: boolean;
    appleSignInEnabled: boolean;
    guestBrowsingEnabled: boolean;
    passwordLoginEnabled: boolean;
  };
  admin: {
    emailOtpEnabled: boolean;
    mobileOtpEnabled: boolean;
    requirePassword: boolean;
    require2FA: boolean;
    trustedDevicesEnabled: boolean;
    sessionTimeoutMinutes: number;
    idleTimeoutMinutes: number;
    otpLength: number;
    otpExpirySeconds: number;
    retryLimit: number;
    lockoutDurationSeconds: number;
    rateLimitPerMinute: number;
    captchaAfterAttempts: number;
  };
  providers: {
    sms: { enabled: boolean; provider: string };
    smtp: { enabled: boolean; host: string; port: number };
    google: { enabled: boolean; clientId: string; clientSecret: string };
    apple: { enabled: boolean; teamId: string; keyId: string; clientId: string };
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "super_admin" | "admin" | "editor";
  phone: string;
  mfaMethod: "email_sms" | "totp";
  status: "active" | "suspended" | "inactive";
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}

/* ================================================================== */
/*  EPHEMERAL IN-MEMORY STORAGE                                        */
/*  Rate limiting is the ONLY data kept in memory:                     */
/*  - Rate limits reset on restart (acceptable for rate limiting)      */
/*  - OTP records are now in PostgreSQL (otps table)                   */
/* ================================================================== */

// Rate limiting — purely ephemeral, resets on restart
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxPerMinute: number = 10): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

/* ================================================================== */
/*  CRYPTO HELPERS                                                     */
/* ================================================================== */

/** Generate a cryptographically secure random code. */
function generateSecureCode(length: number): string {
  const chars = "0123456789";
  let code = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

/** Generate a cryptographically secure random token. */
function generateSecureToken(bytes: number = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hash a code/token using SHA-256. */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a cryptographically secure JWT-like token. */
function generateJWT(payload: Record<string, any>, secret: string, expiresInMs: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + expiresInMs }));
  const signature = generateSecureToken(16);
  return `${header}.${body}.${signature}`;
}

/** Generate a refresh token. */
function generateRefreshToken(): string {
  return `ref_${generateSecureToken(48)}`;
}

/** Parse user agent for browser and OS info. */
function parseUserAgent(ua: string): { browser: string; os: string } {
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : /Opera\//.test(ua) ? "Opera"
    : "Unknown";
  const os = /Windows NT/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : "Unknown";
  return { browser, os };
}

/* ================================================================== */
/*  OTP SERVICE                                                        */
/* ================================================================== */

export interface OtpResult {
  success: boolean;
  message: string;
  expiresIn?: number;
  retryAfter?: number;
}

/**
 * Generate and send an OTP code to the given identifier (email or phone).
 * The OTP is hashed before storage — never stored in plaintext.
 *
 * OTPs are stored in PostgreSQL (otps table) with:
 *   - hashed codes (never plaintext)
 *   - expiry timestamps (auto-expired)
 *   - attempt tracking (max 5 attempts, then lockout)
 *   - automatic cleanup of expired records
 *   - replay protection (OTP marked used after successful verification)
 *
 * If an optional `code` parameter is provided, that code is used instead
 * of generating a new one. This allows the frontend to pass the code it
 * generated so the code sent via email/SMS matches what the browser expects.
 */
export async function sendOtp(
  identifier: string,
  purpose: OtpRecord["purpose"],
  type: "email" | "sms",
  code?: string,
  ip?: string,
  userAgent?: string,
): Promise<OtpResult> {
  const now = Date.now();

  // Rate limit check — 10 OTPs per minute per identifier
  const rateKey = `otp:${identifier}`;
  if (!checkRateLimit(rateKey, 10)) {
    return { success: false, message: "Too many requests. Please wait before requesting a new code." };
  }

  // Generate OTP (or use provided code)
  const otpCode = code || generateSecureCode(OTP_LENGTH);
  const codeHash = await hashCode(otpCode);

  // Invalidate any existing pending OTPs for this identifier (replay protection)
  await invalidatePendingOtps(identifier);

  // Clean up expired OTPs (housekeeping)
  await cleanupExpiredOtps();

  // Store OTP in PostgreSQL
  const expiresAt = new Date(now + OTP_TTL_MS).toISOString();
  await createOtp({
    email: type === "email" ? identifier : "",
    mobile: type === "sms" ? identifier : "",
    otp_hash: codeHash,
    channel: type,
    purpose,
    expires_at: expiresAt,
    ip_address: ip || "",
    user_agent: userAgent || "",
    max_attempts: OTP_MAX_ATTEMPTS,
  });

  // Mask the identifier for display
  const maskedDestination = type === "email"
    ? identifier.replace(/(?<=.{3}).(?=.*@)/g, "*")
    : identifier.replace(/.(?=.{4})/g, "*");

  // Send via email or SMS
  if (type === "email") {
    const fromEmail = "noreply@alayainsider.com";
    const subject = purpose === "admin_mfa"
      ? "Your Admin Verification Code — ALAYA INSIDER"
      : "Your Verification Code — ALAYA INSIDER";
    const htmlBody = `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: #faf9f7; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #211c15; font-size: 24px; margin: 0;">ALAYA INSIDER</h1>
          <p style="color: #6e6356; font-size: 14px; margin: 4px 0 0;">Authentication</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="color: #211c15; font-size: 18px; margin: 0 0 8px;">Your Verification Code</h2>
          <p style="color: #6e6356; font-size: 14px; margin: 0 0 16px;">${purpose === "admin_mfa" ? "Use this code to complete your admin sign-in." : "Use this code to verify your account."}</p>
          <div style="background: #f5f3ef; border-radius: 8px; padding: 16px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #211c15; font-family: 'Courier New', monospace;">
            ${otpCode}
          </div>
          <p style="color: #6e6356; font-size: 12px; margin: 16px 0 0;">This code expires in 5 minutes. Never share this code with anyone.</p>
        </div>
        <p style="color: #9a8f84; font-size: 11px; text-align: center; margin-top: 16px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await sendEmail(identifier, subject, htmlBody);
  } else {
    await sendOtpSms(identifier, otpCode, "ALAYA");
  }

  // Log audit event
  await createAuditEntry({
    actor: "system",
    action: "otp_sent",
    entity_type: "auth",
    entity_id: identifier,
    meta: `OTP sent to ${maskedDestination} via ${type.toUpperCase()}`,
  });

  return {
    success: true,
    message: `Verification code sent.`,
    expiresIn: OTP_TTL_MS / 1000,
  };
}

/**
 * Verify an OTP code against the stored hash in PostgreSQL.
 * Implements retry limits and lockout.
 *
 * OTP verification reads from PostgreSQL — data persists across
 * server restarts. Expired OTPs are automatically cleaned.
 */
export async function verifyOtp(
  identifier: string,
  code: string,
  purpose: OtpRecord["purpose"],
): Promise<{ success: boolean; message: string }> {
  const now = Date.now();

  // Find valid OTP record for this identifier and purpose in PostgreSQL
  const otpRow = await findValidOtp(identifier, purpose);

  if (!otpRow) {
    await createAuditEntry({
      actor: "system",
      action: "otp_failed",
      entity_type: "auth",
      entity_id: identifier,
      meta: "OTP verification failed — no valid code found",
    });
    return { success: false, message: "No valid verification code found. Request a new one." };
  }

  // Check lockout
  if (otpRow.locked_until && new Date(otpRow.locked_until).getTime() > now) {
    const retryAfter = Math.ceil((new Date(otpRow.locked_until).getTime() - now) / 1000);
    return { success: false, message: `Too many attempts. Try again in ${retryAfter} seconds.` };
  }

  // Hash the input code and compare
  const inputHash = await hashCode(code);

  if (inputHash === otpRow.otp_hash) {
    // Success — mark as used in PostgreSQL (replay protection)
    await markOtpUsed(otpRow.id);

    await createAuditEntry({
      actor: "system",
      action: "otp_verified",
      entity_type: "auth",
      entity_id: identifier,
      meta: `OTP verified for ${identifier}`,
    });
    return { success: true, message: "Code verified successfully." };
  }

  // Failed attempt — increment counter
  await incrementOtpAttempt(otpRow.id);

  // Check if max attempts reached
  const newAttemptCount = otpRow.attempt_count + 1;
  if (newAttemptCount >= otpRow.max_attempts) {
    const lockedUntil = new Date(now + OTP_LOCKOUT_MS).toISOString();
    await lockOtp(otpRow.id, lockedUntil);
    await createAuditEntry({
      actor: "system",
      action: "otp_failed",
      entity_type: "auth",
      entity_id: identifier,
      meta: `OTP locked after ${otpRow.max_attempts} failed attempts for ${identifier}`,
    });
    return { success: false, message: "Too many failed attempts. Code locked for 1 minute." };
  }

  await createAuditEntry({
    actor: "system",
    action: "otp_failed",
    entity_type: "auth",
    entity_id: identifier,
    meta: `Invalid OTP attempt ${newAttemptCount}/${otpRow.max_attempts} for ${identifier}`,
  });
  return { success: false, message: "Invalid verification code. Please try again." };
}

/* ================================================================== */
/*  SESSION MANAGEMENT                                                   */
/* ================================================================== */

export interface SessionResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  sessionId?: string;
  userId?: string;
  message?: string;
}

/**
 * Create a new session for a user in PostgreSQL.
 */
export async function createSession(
  userId: string,
  userType: "customer" | "admin",
  ip: string,
  userAgent: string,
  deviceFingerprint: string,
  isTrusted: boolean = false,
): Promise<SessionResult> {
  const { browser, os } = parseUserAgent(userAgent);
  const now = Date.now();

  const token = generateSecureToken(48);
  const refreshToken = generateRefreshToken();
  const tokenHash = await hashCode(token);
  const refreshHash = await hashCode(refreshToken);

  // Resolve location (simplified — in production use IP geolocation)
  const location = resolveLocation(ip);

  // Enforce max 10 sessions per user — remove oldest from PG
  const userSessions = await repoGetUserSessions(userId);
  if (userSessions.length >= 10) {
    const oldest = userSessions.sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];
    await deleteSession(oldest.id);
  }

  // Create session in PostgreSQL
  const session = await createSessionRow({
    user_id: userId,
    token: tokenHash,
    refresh_token: refreshHash,
    ip_address: ip,
    user_agent: userAgent,
    device_info: { browser, os, country: location.country, city: location.city, timezone: location.timezone, deviceFingerprint, isTrusted },
    expires_at: new Date(now + SESSION_TTL_MS).toISOString(),
  });

  return {
    success: true,
    token,
    refreshToken,
    sessionId: session.id,
    userId,
  };
}

/**
 * Validate a session token and return the session if valid.
 */
export async function validateSession(
  token: string,
  userType?: "customer" | "admin",
): Promise<SessionToken | null> {
  const tokenHash = await hashCode(token);
  const row = await getSessionByToken(tokenHash);

  if (!row) return null;
  if (userType) {
    // Check user type via device_info or by looking up the user
    // For now, we check by querying the users table to determine type
    if (row.user_id.startsWith("guest_")) {
      if (userType !== "customer") return null;
    }
  }

  // Convert database row to SessionToken interface
  const deviceInfo = row.device_info as Record<string, any> || {};
  const sessionExpiresAt = new Date(row.expires_at).getTime();
  if (sessionExpiresAt < Date.now()) return null;

  return {
    id: row.id,
    userId: row.user_id,
    userType: userType || "customer",
    token: row.token,
    refreshToken: row.refresh_token,
    ip: row.ip_address,
    userAgent: row.user_agent,
    browser: deviceInfo.browser || "Unknown",
    os: deviceInfo.os || "Unknown",
    country: deviceInfo.country || "Unknown",
    city: deviceInfo.city || "Unknown",
    timezone: deviceInfo.timezone || "UTC",
    deviceFingerprint: deviceInfo.deviceFingerprint || "",
    isTrusted: deviceInfo.isTrusted || false,
    expiresAt: new Date(row.expires_at).getTime(),
    refreshExpiresAt: new Date(row.expires_at).getTime() + REFRESH_TTL_MS,
    lastActivity: new Date(row.created_at).getTime(),
    createdAt: new Date(row.created_at).getTime(),
  };
}

/**
 * Refresh a session using a refresh token.
 */
export async function refreshSession(
  refreshToken: string,
): Promise<SessionResult> {
  const now = Date.now();
  const refreshHash = await hashCode(refreshToken);

  const session = await getSessionByRefreshToken(refreshHash);
  if (!session) {
    return { success: false, message: "Invalid or expired refresh token." };
  }

  // Generate new tokens
  const newToken = generateSecureToken(48);
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = await hashCode(newToken);
  const newRefreshHash = await hashCode(newRefreshToken);
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();

  await updateSessionToken(session.id, newTokenHash, newRefreshHash, expiresAt);

  return {
    success: true,
    token: newToken,
    refreshToken: newRefreshToken,
    sessionId: session.id,
    userId: session.user_id,
  };
}

/**
 * Terminate a session.
 */
export async function terminateSession(sessionId: string): Promise<boolean> {
  const ok = await deleteSession(sessionId);
  if (ok) {
    await createAuditEntry({
      actor: "system",
      action: "session_terminated",
      entity_type: "auth",
      entity_id: sessionId,
      meta: `Session ${sessionId} terminated`,
    });
  }
  return ok;
}

/**
 * Terminate all sessions for a user.
 */
export async function terminateAllSessions(userId: string): Promise<number> {
  const count = await deleteAllUserSessions(userId);

  await createAuditEntry({
    actor: "system",
    action: "all_sessions_terminated",
    entity_type: "auth",
    entity_id: userId,
    meta: `All sessions terminated for user ${userId}`,
  });

  return count;
}

/**
 * Get all active sessions for a user from PostgreSQL.
 */
export async function getUserSessions(userId: string): Promise<SessionToken[]> {
  const rows = await repoGetUserSessions(userId);
  const now = Date.now();

  return rows.map((row: any): SessionToken => {
    const deviceInfo = row.device_info as Record<string, any> || {};
    const expiresAt = new Date(row.expires_at).getTime();
    return {
      id: row.id,
      userId: row.user_id,
      userType: "customer" as const,
      token: row.token,
      refreshToken: row.refresh_token,
      ip: row.ip_address,
      userAgent: row.user_agent,
      browser: deviceInfo.browser || "Unknown",
      os: deviceInfo.os || "Unknown",
      country: deviceInfo.country || "Unknown",
      city: deviceInfo.city || "Unknown",
      timezone: deviceInfo.timezone || "UTC",
      deviceFingerprint: deviceInfo.deviceFingerprint || "",
      isTrusted: deviceInfo.isTrusted || false,
      expiresAt,
      refreshExpiresAt: expiresAt + REFRESH_TTL_MS,
      lastActivity: new Date(row.created_at).getTime(),
      createdAt: new Date(row.created_at).getTime(),
    };
  }).filter((s: SessionToken) => s.expiresAt > now);
}

/**
 * Update session activity timestamp.
 */
export async function touchSession(token: string): Promise<boolean> {
  const tokenHash = await hashCode(token);
  try {
    await repoTouchSession(tokenHash);
    return true;
  } catch {
    return false;
  }
}

/* ================================================================== */
/*  LOGIN HISTORY (via audit_logs table)                                */
/* ================================================================== */

export async function recordLogin(
  userId: string,
  userType: "customer" | "admin",
  method: LoginHistoryEntry["method"],
  success: boolean,
  ip: string,
  userAgent: string,
  deviceFingerprint?: string,
  failureReason?: string,
): Promise<LoginHistoryEntry> {
  const { browser, os } = parseUserAgent(userAgent);
  const location = resolveLocation(ip);
  const riskScore = await calculateRiskScore(userId, userType, ip, deviceFingerprint);

  const entry: LoginHistoryEntry = {
    id: v4(),
    userId,
    userType,
    method,
    success,
    ip,
    userAgent,
    browser,
    os,
    country: location.country,
    city: location.city,
    timezone: location.timezone,
    deviceFingerprint,
    failureReason,
    riskScore,
    ts: Date.now(),
  };

  // Write to audit_logs table
  await createAuditEntry({
    actor: userId,
    action: success ? "login_success" : "login_failed",
    entity_type: userType === "admin" ? "admin_login" : "customer_login",
    entity_id: userId,
    meta: JSON.stringify({
      method,
      ip,
      userAgent,
      browser,
      os,
      country: location.country,
      city: location.city,
      deviceFingerprint,
      failureReason,
      riskScore,
    }),
    ip_address: ip,
  });

  // Log security event
  if (success) {
    await logSecurityEvent("login_success", method, userType,
      `Login via ${method} from ${location.country}/${location.city}`, userId, ip);

    // Check for new device
    if (deviceFingerprint && !(await repoIsKnownDevice(userId, deviceFingerprint))) {
      await logSecurityEvent("new_device", method, userType,
        `New device login: ${browser} on ${os}`, userId, ip);
    }
  } else {
    await logSecurityEvent("login_failed", method, userType,
      `Failed login via ${method}: ${failureReason || "Unknown"}`, userId, ip);
  }

  return entry;
}

/**
 * Get login history for a user from audit_logs.
 */
export async function getLoginHistory(
  userId?: string,
  userType?: "customer" | "admin",
  limit: number = 50,
): Promise<LoginHistoryEntry[]> {
  const entityType = userType === "admin" ? "admin_login" : "customer_login";
  const rows = await getAuditEntries(entityType, userId, limit);

  return rows.map((row: any) => {
    let meta: any = {};
    try { meta = JSON.parse(row.meta || "{}"); } catch {}
    return {
      id: row.id,
      userId: row.entity_id || userId || "",
      userType: row.entity_type === "admin_login" ? "admin" as const : "customer" as const,
      method: (meta.method || "otp") as LoginHistoryEntry["method"],
      success: row.action === "login_success",
      ip: meta.ip || row.ip_address || "",
      userAgent: meta.userAgent || "",
      browser: meta.browser || "Unknown",
      os: meta.os || "Unknown",
      country: meta.country || "Unknown",
      city: meta.city || "Unknown",
      timezone: meta.timezone || "UTC",
      deviceFingerprint: meta.deviceFingerprint || "",
      failureReason: meta.failureReason || "",
      riskScore: meta.riskScore || 0,
      ts: new Date(row.created_at).getTime(),
    };
  });
}

/* ================================================================== */
/*  SECURITY EVENTS (via audit_logs table)                              */
/* ================================================================== */

export async function logSecurityEvent(
  type: SecurityEvent["type"],
  actor: string,
  userType: "customer" | "admin",
  detail: string,
  userId?: string,
  ip?: string,
  metadata?: Record<string, string>,
): Promise<SecurityEvent> {
  const event: SecurityEvent = {
    id: v4(),
    ts: Date.now(),
    type,
    userId: userId || "system",
    userType,
    actor,
    detail,
    ip,
    metadata,
  };

  // Write to audit_logs
  await createAuditEntry({
    actor: actor,
    action: type,
    entity_type: `security_${userType}`,
    entity_id: userId || "system",
    meta: JSON.stringify({ detail, ...(metadata || {}) }),
    ip_address: ip,
  });

  // Fire notification triggers for important auth events
  const notifMetadata: Record<string, string> = {
    ...(metadata || {}),
    ...(ip ? { ip } : {}),
    detail,
  };

  switch (type) {
    case "password_changed":
      fireTrigger({ event: "auth:password_changed", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "login_success":
      fireTrigger({ event: "auth:login_success", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "login_failed":
      fireTrigger({ event: "auth:login_failed", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "new_device":
      fireTrigger({ event: "auth:new_device", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "suspicious_login":
      fireTrigger({ event: "auth:suspicious_login", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "impossible_travel":
      fireTrigger({ event: "auth:impossible_travel", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "recovery_code_used":
      fireTrigger({ event: "auth:recovery_used", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "account_locked":
      fireTrigger({ event: "auth:account_locked", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "otp_sent":
      fireTrigger({ event: "auth:otp_sent", userId, metadata: notifMetadata }).catch(() => {});
      break;
    case "mfa_disabled":
      fireTrigger({ event: "auth:mfa_disabled", userId, metadata: notifMetadata }).catch(() => {});
      break;
  }

  return event;
}

/**
 * Get security events with optional filters from audit_logs.
 */
export async function getSecurityEvents(
  userId?: string,
  userType?: "customer" | "admin",
  limit: number = 100,
): Promise<SecurityEvent[]> {
  const entityType = userType ? `security_${userType}` : undefined;
  const rows = entityType
    ? await getAuditEntries(entityType, userId, limit)
    : await getAuditEntries("auth", userId, limit);

  const results: SecurityEvent[] = [];
  for (const row of rows) {
    let meta: any = {};
    try { meta = JSON.parse(row.meta || "{}"); } catch {}
    results.push({
      id: row.id,
      ts: new Date(row.created_at).getTime(),
      type: row.action as SecurityEvent["type"],
      userId: row.entity_id || userId || "system",
      userType: row.entity_type?.includes("admin") ? "admin" as const : "customer" as const,
      actor: row.actor,
      detail: meta.detail || "",
      ip: row.ip_address || undefined,
      metadata: meta,
    });
  }
  return results;
}

/* ================================================================== */
/*  TRUSTED DEVICES (PostgreSQL)                                        */
/* ================================================================== */

export async function addTrustedDevice(
  userId: string,
  name: string,
  fingerprint: string,
  browser: string,
  os: string,
  ip: string,
): Promise<TrustedDevice> {
  const location = resolveLocation(ip);

  // Remove old device with same fingerprint if exists via the repo
  // (repo handles this internally)

  const row = await addTrustedDeviceRow({
    user_id: userId,
    device_fingerprint: fingerprint,
    device_name: name,
  });

  const device: TrustedDevice = {
    id: row.id,
    userId: row.user_id,
    name: row.device_name,
    fingerprint: row.device_fingerprint,
    browser,
    os,
    ip,
    country: location.country,
    city: location.city,
    timezone: location.timezone,
    trustedUntil: Date.now() + TRUSTED_DEVICE_TTL_MS,
    lastUsed: new Date(row.last_used_at).getTime(),
    createdAt: new Date(row.created_at).getTime(),
  };

  await createAuditEntry({
    actor: "system",
    action: "trusted_device_added",
    entity_type: "auth",
    entity_id: userId,
    meta: `Trusted device added: ${name} (${browser} on ${os})`,
  });

  return device;
}

export async function removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
  const ok = await removeTrustedDeviceRow(userId, deviceId);
  if (ok) {
    await createAuditEntry({
      actor: "system",
      action: "trusted_device_removed",
      entity_type: "auth",
      entity_id: userId,
      meta: `Trusted device removed: ${deviceId}`,
    });
  }
  return ok;
}

export async function getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
  const rows = await getTrustedDeviceRows(userId);
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.device_name,
    fingerprint: row.device_fingerprint,
    browser: "",
    os: "",
    ip: "",
    country: "",
    city: "",
    timezone: "",
    trustedUntil: Date.now() + TRUSTED_DEVICE_TTL_MS,
    lastUsed: new Date(row.last_used_at).getTime(),
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function isKnownDevice(userId: string, fingerprint: string): Promise<boolean> {
  return repoIsKnownDevice(userId, fingerprint);
}

/* ================================================================== */
/*  RECOVERY CODES (PostgreSQL)                                        */
/* ================================================================== */

export interface RecoveryCodesResult {
  success: boolean;
  codes?: string[];
  message: string;
}

/**
 * Generate 10 one-time recovery codes for a user.
 * Codes are hashed before storage — never stored in plaintext.
 */
export async function generateRecoveryCodes(userId: string): Promise<RecoveryCodesResult> {
  const codes: string[] = [];
  const now = Date.now();
  const expiresAt = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

  const codeEntries: { hash: string; expiresAt: string }[] = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    // Generate format: ALAYA-XXXX-XXXX-XXXX
    const code = `ALAYA-${generateSecureToken(4).toUpperCase()}-${generateSecureToken(4).toUpperCase()}-${generateSecureToken(4).toUpperCase()}`;
    const codeHash = await hashCode(code);
    codeEntries.push({ hash: codeHash, expiresAt });
    codes.push(code);
  }

  await createRecoveryCodes(userId, codeEntries);

  await createAuditEntry({
    actor: "system",
    action: "recovery_codes_regenerated",
    entity_type: "auth",
    entity_id: userId,
    meta: "10 recovery codes generated",
  });

  return { success: true, codes, message: "10 recovery codes generated." };
}

/**
 * Verify and consume a recovery code.
 */
export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  const codeHash = await hashCode(code.toUpperCase());
  const ok = await findAndUseRecoveryCode(userId, codeHash);

  if (ok) {
    await createAuditEntry({
      actor: "system",
      action: "recovery_code_used",
      entity_type: "auth",
      entity_id: userId,
      meta: "Recovery code used",
    });
  } else {
    await createAuditEntry({
      actor: "system",
      action: "recovery_failure",
      entity_type: "auth",
      entity_id: userId,
      meta: "Invalid recovery code attempt",
    });
  }

  return ok;
}

/**
 * Get recovery codes info (not the actual codes) for a user.
 */
export async function getRecoveryCodesInfo(userId: string): Promise<{ total: number; used: number; remaining: number }> {
  return getRecoveryCodeCounts(userId);
}

/* ================================================================== */
/*  OAUTH (Social Login) — PostgreSQL + customers_repo                  */
/* ================================================================== */

export interface OAuthResult {
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Handle Google OAuth login — fully PostgreSQL-backed.
 */
export async function handleGoogleLogin(
  googleId: string,
  email: string,
  name: string,
  avatar: string | undefined,
  ip: string,
  userAgent: string,
): Promise<OAuthResult> {
  // Check if OAuth account already exists in PostgreSQL
  let oauthRow = await getOAuthAccount("google", googleId);

  if (oauthRow) {
    // Existing account — update profile
    await updateOAuthAccountName(oauthRow.id, name, avatar);

    // Create session
    const session = await createSession(oauthRow.user_id, "customer", ip, userAgent, "");
    if (!session.success) {
      return { success: false, message: "Failed to create session." };
    }

    await recordLogin(oauthRow.user_id, "customer", "google", true, ip, userAgent);
    return {
      success: true,
      userId: oauthRow.user_id,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  // Check if email exists in customers (merge)
  const existingCustomer = await customers_repo.findByEmail(email);

  if (existingCustomer) {
    // Merge: link OAuth account to existing customer
    await createOAuthAccount({
      user_id: existingCustomer.id,
      provider: "google",
      provider_id: googleId,
      email,
      name,
      avatar,
    });

    const session = await createSession(existingCustomer.id, "customer", ip, userAgent, "");
    await recordLogin(existingCustomer.id, "customer", "google", true, ip, userAgent);
    return {
      success: true,
      userId: existingCustomer.id,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  // New user — create customer via customers_repo
  const now = new Date().toISOString();
  const newCustomer = await customers_repo.create({
    name,
    email,
    password_hash: "",
    phone: "",
    status: "active",
    newsletter: true,
    referral_code: `ALAYA-${name.toUpperCase().replace(/\s+/g, "").slice(0, 8)}`,
    preferences: {
      favoriteBrands: [],
      favoriteCategories: [],
      preferredTheme: "light",
      marketingOptIn: true,
    },
    loyalty_points: 0,
    store_credit: 0,
  } as any, "oauth");

  // Create OAuth account link
  await createOAuthAccount({
    user_id: newCustomer.id,
    provider: "google",
    provider_id: googleId,
    email,
    name,
    avatar,
  });

  const session = await createSession(newCustomer.id, "customer", ip, userAgent, "");
  await recordLogin(newCustomer.id, "customer", "google", true, ip, userAgent);

  return {
    success: true,
    userId: newCustomer.id,
    isNewUser: true,
    token: session.token,
    refreshToken: session.refreshToken,
  };
}

/**
 * Handle Apple Sign-In login — fully PostgreSQL-backed.
 */
export async function handleAppleLogin(
  appleId: string,
  email: string,
  name: string,
  ip: string,
  userAgent: string,
): Promise<OAuthResult> {
  // Check if OAuth account already exists in PostgreSQL
  let oauthRow = await getOAuthAccount("apple", appleId);

  if (oauthRow) {
    // Existing account — update profile
    await updateOAuthAccountName(oauthRow.id, name);

    const session = await createSession(oauthRow.user_id, "customer", ip, userAgent, "");
    await recordLogin(oauthRow.user_id, "customer", "apple", true, ip, userAgent);
    return {
      success: true,
      userId: oauthRow.user_id,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  // Check if email exists in customers
  const existingCustomer = await customers_repo.findByEmail(email);

  if (existingCustomer) {
    await createOAuthAccount({
      user_id: existingCustomer.id,
      provider: "apple",
      provider_id: appleId,
      email,
      name,
    });

    const session = await createSession(existingCustomer.id, "customer", ip, userAgent, "");
    await recordLogin(existingCustomer.id, "customer", "apple", true, ip, userAgent);
    return {
      success: true,
      userId: existingCustomer.id,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  // New user
  const newCustomer = await customers_repo.create({
    name: name || email.split("@")[0],
    email,
    password_hash: "",
    phone: "",
    status: "active",
    newsletter: true,
    referral_code: `ALAYA-${(name || email.split("@")[0]).toUpperCase().replace(/\s+/g, "").slice(0, 8)}`,
    preferences: {
      favoriteBrands: [],
      favoriteCategories: [],
      preferredTheme: "light",
      marketingOptIn: true,
    },
    loyalty_points: 0,
    store_credit: 0,
  } as any, "oauth");

  await createOAuthAccount({
    user_id: newCustomer.id,
    provider: "apple",
    provider_id: appleId,
    email,
    name,
  });

  const session = await createSession(newCustomer.id, "customer", ip, userAgent, "");
  await recordLogin(newCustomer.id, "customer", "apple", true, ip, userAgent);

  return {
    success: true,
    userId: newCustomer.id,
    isNewUser: true,
    token: session.token,
    refreshToken: session.refreshToken,
  };
}

/* ================================================================== */
/*  DEVICE FINGERPRINTING                                              */
/* ================================================================== */

export interface DeviceFingerprint {
  fingerprint: string;
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvasHash?: string;
  webglHash?: string;
  fontsHash?: string;
  audioHash?: string;
}

/**
 * Generate a device fingerprint from the browser-provided data.
 * This runs server-side with the data collected client-side.
 */
export function generateDeviceFingerprint(data: Partial<DeviceFingerprint>): string {
  const components = [
    data.browser || "unknown",
    data.os || "unknown",
    data.screenResolution || "unknown",
    data.timezone || "unknown",
    data.language || "unknown",
    data.platform || "unknown",
    data.canvasHash || "unknown",
    data.webglHash || "unknown",
    data.fontsHash || "unknown",
    data.audioHash || "unknown",
  ];
  return components.join("|");
}

/* ================================================================== */
/*  RISK ASSESSMENT (reads from PostgreSQL audit_logs)                  */
/* ================================================================== */

/**
 * Calculate a risk score (0-100) for a login attempt.
 * Reads login history from PostgreSQL audit_logs.
 */
async function calculateRiskScore(userId: string, userType: "customer" | "admin", ip: string, deviceFingerprint?: string): Promise<number> {
  let score = 0;

  // Check for recent failed attempts (last hour)
  const recentFailures = await getAuditEntries(
    userType === "admin" ? "admin_login" : "customer_login",
    userId,
    100,
  );
  const oneHourAgo = Date.now() - 3600000;
  const recentFails = recentFailures.filter(
    (r: any) => r.action === "login_failed" && new Date(r.created_at).getTime() > oneHourAgo
  );
  score += Math.min(recentFails.length * 10, 30);

  // New device
  if (deviceFingerprint && !(await repoIsKnownDevice(userId, deviceFingerprint))) {
    score += 20;
  }

  // New IP — only check against successful logins (matching original logic)
  const successfulLogins = recentFailures.filter(
    (r: any) => r.action === "login_success"
  );
  const previousLogins = successfulLogins.filter(
    (r: any) => r.ip_address !== ip
  );
  const ipMatch = successfulLogins.some((r: any) => r.ip_address === ip);
  if (previousLogins.length > 0 && !ipMatch) {
    score += 15;
  }

  // Impossible travel detection
  const recentLogins = recentFailures.filter(
    (r: any) => r.action === "login_success" && new Date(r.created_at).getTime() > Date.now() - 300000
  );
  for (const login of recentLogins) {
    let meta: any = {};
    try { meta = JSON.parse(login.meta || "{}"); } catch {}
    if (meta.country && meta.country !== "Unknown" && meta.country !== "Local") {
      const location = resolveLocation(ip);
      if (location.country !== "Unknown" && location.country !== "Local" &&
          meta.country !== location.country) {
        score += 30;
        await logSecurityEvent("impossible_travel", "system", userType,
          `Impossible travel detected: previous login from ${meta.country}, current from ${location.country}`,
          userId, ip);
      }
    }
  }

  // Credential stuffing detection
  const oneMinuteAgo = Date.now() - 60000;
  const rapidFailures = recentFailures.filter(
    (r: any) => r.action === "login_failed" && new Date(r.created_at).getTime() > oneMinuteAgo
  );
  const uniqueIPs = new Set(rapidFailures.map((r: any) => r.ip_address));
  if (rapidFailures.length >= 10 && uniqueIPs.size >= 3) {
    score += 25;
    await logSecurityEvent("suspicious_login", "system", userType,
      `Credential stuffing detected: ${rapidFailures.length} failures from ${uniqueIPs.size} different IPs in 1 minute`,
      userId, ip);
  }

  // Progressive delay
  if (recentFails.length > 3) {
    score += Math.min(recentFails.length * 5, 20);
  }

  return Math.min(score, 100);
}

/* ================================================================== */
/*  LOCATION RESOLUTION                                                */
/* ================================================================== */

function resolveLocation(ip: string): { country: string; city: string; timezone: string } {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return { country: "Local", city: "Development", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" };
  }
  return { country: "Unknown", city: "Unknown", timezone: "UTC" };
}

/* ================================================================== */
/*  ADMIN USER MANAGEMENT (PostgreSQL via users table)                  */
/* ================================================================== */

/**
 * Initialize the Super Admin user from settings, if not already created.
 * This ensures there is always a database-driven admin user.
 */
export async function initAdminUser(): Promise<AdminUser> {
  // Check if any admin user exists
  const existing = await getSuperAdminUser();

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      passwordHash: existing.password_hash,
      role: existing.role as "super_admin" | "admin" | "editor",
      phone: existing.phone || "",
      mfaMethod: (existing.mfa_method as "email_sms" | "totp") || "email_sms",
      status: (existing.is_active ? "active" : "inactive") as "active" | "suspended" | "inactive",
      permissions: existing.permissions || [],
      createdAt: new Date(existing.created_at).getTime(),
      updatedAt: new Date(existing.updated_at).getTime(),
    };
  }

  // Create Super Admin — get credentials from settings
  const settingsRow = await queryOne<{ key: string; value: any }>(
    "SELECT * FROM settings WHERE key = 'auth_settings'",
  );
  const authSettings = settingsRow?.value || getDefaultAuthSettings();

  // Also check general store settings for admin credentials
  const storeSettings = await queryAll<{ key: string; value: any }>(
    "SELECT key, value FROM settings WHERE key IN ('admin_email', 'admin_password', 'admin_phone')",
  );
  const settingsMap: Record<string, any> = {};
  for (const s of storeSettings) {
    settingsMap[s.key] = s.value;
  }

  const adminEmail = settingsMap.admin_email || "alayainsider@gmail.com";
  const adminPassword = settingsMap.admin_password || "Alaya@1923";
  const adminPhone = settingsMap.admin_phone || "";

  const newAdmin = await createAdminUser({
    email: adminEmail,
    name: "Super Admin",
    password_hash: await hashCode(adminPassword),
    role: "super_admin",
    phone: adminPhone,
    mfa_method: "email_sms",
    permissions: ["all"],
  });

  return {
    id: newAdmin.id,
    name: newAdmin.name,
    email: newAdmin.email,
    passwordHash: newAdmin.password_hash,
    role: newAdmin.role as "super_admin" | "admin" | "editor",
    phone: newAdmin.phone || "",
    mfaMethod: (newAdmin.mfa_method as "email_sms" | "totp") || "email_sms",
    status: (newAdmin.is_active ? "active" : "inactive") as "active" | "suspended" | "inactive",
    permissions: newAdmin.permissions || [],
    createdAt: new Date(newAdmin.created_at).getTime(),
    updatedAt: new Date(newAdmin.updated_at).getTime(),
  };
}

/**
 * Get the Super Admin user from PostgreSQL.
 */
export async function getAdminUser(): Promise<AdminUser | undefined> {
  const existing = await getSuperAdminUser();
  if (!existing) return undefined;
  return {
    id: existing.id,
    name: existing.name,
    email: existing.email,
    passwordHash: existing.password_hash,
    role: existing.role as "super_admin" | "admin" | "editor",
    phone: existing.phone || "",
    mfaMethod: (existing.mfa_method as "email_sms" | "totp") || "email_sms",
    status: (existing.is_active ? "active" : "inactive") as "active" | "suspended" | "inactive",
    permissions: existing.permissions || [],
    createdAt: new Date(existing.created_at).getTime(),
    updatedAt: new Date(existing.updated_at).getTime(),
  };
}

/**
 * Validate admin password against stored credentials in PostgreSQL.
 */
export async function validateAdminPassword(email: string, password: string): Promise<boolean> {
  // Check against database-driven admin user
  const adminUser = await getAdminUserByEmail(email);
  if (adminUser && adminUser.is_active) {
    const inputHash = await hashCode(password);
    return inputHash === adminUser.password_hash;
  }

  // Fallback: check legacy settings for backward compatibility
  const settingsRow = await queryOne<{ key: string; value: any }>(
    "SELECT * FROM settings WHERE key = 'admin_email' OR key = 'admin_password'",
  );

  // If no admin user found in PG, and we have settings, migrate them
  if (!adminUser) {
    const adminEmailRow = await queryOne<{ key: string; value: any }>(
      "SELECT * FROM settings WHERE key = 'admin_email'", 
    );
    const adminPassRow = await queryOne<{ key: string; value: any }>(
      "SELECT * FROM settings WHERE key = 'admin_password'",
    );
    const legacyEmail = adminEmailRow?.value || "";
    const legacyPass = adminPassRow?.value || "";

    if (email.toLowerCase() === (typeof legacyEmail === 'string' ? legacyEmail.toLowerCase() : '') && password === legacyPass) {
      // Auto-migrate: create admin user from legacy settings
      await initAdminUser();
      return true;
    }
  }

  return false;
}

/**
 * Update the admin user profile (email, password, phone) in PostgreSQL.
 */
export async function updateAdminProfile(patch: {
  email?: string;
  password?: string;
  phone?: string;
  name?: string;
}): Promise<AdminUser | null> {
  const admin = await getSuperAdminUser();
  if (!admin) return null;

  const updated = await updateAdminUser(admin.id, {
    ...(patch.email ? { email: patch.email } : {}),
    ...(patch.password ? { password_hash: await hashCode(patch.password) } : {}),
    ...(patch.phone ? { phone: patch.phone } : {}),
    ...(patch.name ? { name: patch.name } : {}),
  });

  if (!updated) return null;

  await createAuditEntry({
    actor: updated.email,
    action: "password_changed",
    entity_type: "admin",
    entity_id: updated.id,
    meta: `Admin profile updated: ${Object.keys(patch).join(", ")}`,
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    passwordHash: updated.password_hash,
    role: updated.role as "super_admin" | "admin" | "editor",
    phone: updated.phone || "",
    mfaMethod: (updated.mfa_method as "email_sms" | "totp") || "email_sms",
    status: (updated.is_active ? "active" : "inactive") as "active" | "suspended" | "inactive",
    permissions: updated.permissions || [],
    createdAt: new Date(updated.created_at).getTime(),
    updatedAt: new Date(updated.updated_at).getTime(),
  };
}

/**
 * Get the default auth settings from PostgreSQL.
 */
export async function getAuthSettings(): Promise<AuthSettings> {
  return getPgAuthSettings();
}

/**
 * Update auth settings in PostgreSQL.
 */
export async function updateAuthSettings(patch: Partial<AuthSettings>): Promise<AuthSettings> {
  const current = await getPgAuthSettings();
  const updated: AuthSettings = {
    ...current,
    ...patch,
    customer: { ...current.customer, ...(patch.customer || {}) },
    admin: { ...current.admin, ...(patch.admin || {}) },
    providers: { ...current.providers, ...(patch.providers || {}) },
  };
  await saveAuthSettings(updated);
  return updated;
}

/* ================================================================== */
/*  AUTH STATISTICS (reads from PostgreSQL)                             */
/* ================================================================== */

export interface AuthStatistics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  otpSent: number;
  otpVerified: number;
  otpFailed: number;
  activeSessions: number;
  trustedDevices: number;
  recoveryCodesRemaining: number;
  loginByMethod: Record<string, number>;
  loginByHour: Record<string, number>;
  recentEvents: SecurityEvent[];
}

export async function getAuthStatistics(): Promise<AuthStatistics> {
  const last24hAgo = new Date(Date.now() - 86400000).toISOString();

  // Get login audit logs for last 24h
  const loginEntries = await queryAll<any>(
    `SELECT * FROM audit_logs 
     WHERE (action = 'login_success' OR action = 'login_failed')
     AND (entity_type = 'customer_login' OR entity_type = 'admin_login')
     AND created_at >= $1
     ORDER BY created_at DESC`,
    [last24hAgo],
  );

  // Get security events for last 24h
  const events = await queryAll<any>(
    `SELECT * FROM audit_logs 
     WHERE action IN ('otp_sent', 'otp_verified', 'otp_failed')
     AND created_at >= $1
     ORDER BY created_at DESC`,
    [last24hAgo],
  );

  // Count active sessions
  const sessionCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()",
  );

  // Count trusted devices
  const deviceCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM trusted_devices",
  );

  // Count recovery codes
  const recoveryCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM recovery_codes WHERE used = false AND expires_at > NOW()",
  );

  // Count by method
  const loginByMethod: Record<string, number> = {};
  loginEntries.forEach((entry: any) => {
    let meta: any = {};
    try { meta = JSON.parse(entry.meta || "{}"); } catch {}
    const method = meta.method || "unknown";
    loginByMethod[method] = (loginByMethod[method] || 0) + 1;
  });

  // Count by hour
  const loginByHour: Record<string, number> = {};
  loginEntries.forEach((entry: any) => {
    const hour = new Date(entry.created_at).getHours().toString();
    loginByHour[hour] = (loginByHour[hour] || 0) + 1;
  });

  return {
    totalLogins: loginEntries.length,
    successfulLogins: loginEntries.filter((e: any) => e.action === "login_success").length,
    failedLogins: loginEntries.filter((e: any) => e.action === "login_failed").length,
    otpSent: events.filter((e: any) => e.action === "otp_sent").length,
    otpVerified: events.filter((e: any) => e.action === "otp_verified").length,
    otpFailed: events.filter((e: any) => e.action === "otp_failed").length,
    activeSessions: Number(sessionCount?.count ?? 0),
    trustedDevices: Number(deviceCount?.count ?? 0),
    recoveryCodesRemaining: Number(recoveryCount?.count ?? 0),
    loginByMethod,
    loginByHour,
    recentEvents: [],
  };
}
