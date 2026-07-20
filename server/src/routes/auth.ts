/**
 * ALAYA INSIDER — Enterprise Authentication Routes
 * --------------------------------------------------------------------------
 * Complete authentication API for both customer and administrator flows.
 *
 * Customer Auth:
 *   POST /auth/customer/send-otp       — Send email OTP
 *   POST /auth/customer/verify-otp     — Verify email OTP
 *   POST /auth/customer/google         — Google OAuth login
 *   POST /auth/customer/apple          — Apple Sign In
 *   POST /auth/customer/guest          — Guest browsing token
 *
 * Admin Auth:
 *   POST /auth/admin/login             — Email + password verification
 *   POST /auth/admin/send-email-otp    — Send email OTP for admin 2FA
 *   POST /auth/admin/send-mobile-otp   — Send mobile OTP for admin 2FA
 *   POST /auth/admin/verify-otp        — Verify OTP (email or mobile)
 *
 * Session Management:
 *   POST /auth/refresh                 — Refresh session token
 *   POST /auth/logout                  — Terminate session
 *   POST /auth/logout-all              — Terminate all sessions
 *   GET  /auth/sessions                — List active sessions
 *   DELETE /auth/sessions/:id          — Terminate specific session
 *
 * Trusted Devices:
 *   POST /auth/devices                 — Add trusted device
 *   DELETE /auth/devices/:id           — Remove trusted device
 *   GET  /auth/devices                 — List trusted devices
 *
 * Recovery:
 *   POST /auth/recovery/codes          — Generate recovery codes
 *   POST /auth/recovery/verify         — Verify recovery code
 *   GET  /auth/recovery/status         — Recovery codes status
 *
 * Security Events & Login History:
 *   GET  /auth/security/events         — Security events
 *   GET  /auth/security/login-history  — Login history
 *   GET  /auth/security/stats          — Auth statistics
 *
 * Auth Settings:
 *   GET  /auth/settings                — Get auth settings
 *   PUT  /auth/settings                — Update auth settings
 */

import { Hono } from "hono";
import { v4 } from "uuid";
import { getSession, setSession, errorEnvelope } from "../lib/context.js";
import {
  sendOtp, verifyOtp,
  createSession, validateSession, refreshSession,
  terminateSession, terminateAllSessions, getUserSessions, touchSession,
  recordLogin, getLoginHistory,
  logSecurityEvent, getSecurityEvents,
  addTrustedDevice, removeTrustedDevice, getTrustedDevices,
  generateRecoveryCodes, verifyRecoveryCode, getRecoveryCodesInfo,
  handleGoogleLogin, handleAppleLogin,
  generateDeviceFingerprint,
  getAuthSettings, updateAuthSettings,
  getAuthStatistics,
  validateAdminPassword, updateAdminProfile, getAdminUser, initAdminUser,
  generateSecureCode,
  OTP_LENGTH,
} from "../services/auth.js";
import { customers_repo } from "../db/repositories/index.js";
import { queryOne } from "../db/index.js";

const auth = new Hono();

/* ================================================================== */
/*  MIDDLEWARE: Auth token validation                                   */
/* ================================================================== */

/**
 * Middleware to require a valid auth token.
 * Returns the session if valid, otherwise sends an error response.
 */
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "Missing or invalid auth token."), 401);
  }
  const token = authHeader.slice(7);
  const session = await validateSession(token);
  if (!session) {
    return c.json(errorEnvelope(c, 401, "SESSION_EXPIRED", "Session expired or invalid. Please sign in again."), 401);
  }
  setSession(c, session);
  await touchSession(token);
  await next();
}

/**
 * Middleware to require a valid admin auth token.
 */
async function requireAdminAuth(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "Missing or invalid auth token."), 401);
  }
  const token = authHeader.slice(7);
  const session = await validateSession(token, "admin");
  if (!session) {
    return c.json(errorEnvelope(c, 401, "SESSION_EXPIRED", "Admin session expired or invalid."), 401);
  }
  setSession(c, session);
  await touchSession(token);
  await next();
}

/* ================================================================== */
/*  CUSTOMER AUTHENTICATION                                            */
/* ================================================================== */

/**
 * POST /auth/customer/send-otp — Send email OTP to customer
 */
auth.post("/auth/customer/send-otp", async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ code: "INVALID_EMAIL", message: "Please provide a valid email address." }, 400);
    }

    const result = await sendOtp(email, "login", "email");
    // Never expose otpId or sensitive data to the client
    return c.json({
      success: result.success,
      message: result.message,
      expiresIn: result.expiresIn,
      retryAfter: result.retryAfter,
    }, result.success ? 200 : 429);
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Failed to send OTP." }, 500);
  }
});

/**
 * POST /auth/customer/verify-otp — Verify email OTP and login
 */
auth.post("/auth/customer/verify-otp", async (c) => {
  try {
    const { email, code, deviceFingerprint: deviceData } = await c.req.json<{
      email: string; code: string; deviceFingerprint?: Record<string, string>;
    }>();

    if (!email || !code) {
      return c.json({ code: "MISSING_FIELDS", message: "Email and code are required." }, 400);
    }

    // Verify OTP
    const verification = await verifyOtp(email, code, "login");
    if (!verification.success) {
      return c.json({ code: "INVALID_OTP", message: verification.message }, 400);
    }

    // Find or create customer via PostgreSQL
    let customer = await customers_repo.findByEmail(email);

    if (!customer) {
      // Auto-create customer account on first login
      customer = await customers_repo.create({
        name: email.split("@")[0],
        email,
        password_hash: "",
        phone: "",
        status: "active",
        newsletter: true,
        referral_code: `ALAYA-${email.split("@")[0].toUpperCase().slice(0, 8)}`,
        preferences: {
          favoriteBrands: [],
          favoriteCategories: [],
          preferredTheme: "light",
          marketingOptIn: true,
        },
        loyalty_points: 0,
        store_credit: 0,
      } as any, "api");
    }

    // Update last_login timestamp
    if (customer && customer.id) {
      await queryOne(
        "UPDATE customers SET last_login = NOW() WHERE id = $1",
        [customer.id],
      );
    }

    // Generate device fingerprint
    const fp = deviceData ? generateDeviceFingerprint({
      browser: deviceData.browser,
      os: deviceData.os,
      screenResolution: deviceData.screenResolution,
      timezone: deviceData.timezone,
      language: deviceData.language,
      platform: deviceData.platform,
    }) : "";

    // Create session
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "";
    const session = await createSession(customer.id, "customer", ip, userAgent, fp);

    if (!session.success) {
      return c.json({ code: "SESSION_ERROR", message: "Failed to create session." }, 500);
    }

    // Record login
    await recordLogin(customer.id, "customer", "otp", true, ip, userAgent, fp);

    return c.json({
      success: true,
      token: session.token,
      refreshToken: session.refreshToken,
      user: { id: customer.id, name: customer.name, email: customer.email },
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Verification failed." }, 500);
  }
});

/**
 * POST /auth/customer/google — Google OAuth login
 */
auth.post("/auth/customer/google", async (c) => {
  try {
    const { googleId, email, name, avatar } = await c.req.json<{
      googleId: string; email: string; name: string; avatar?: string;
    }>();

    if (!googleId || !email) {
      return c.json({ code: "MISSING_FIELDS", message: "Google ID and email are required." }, 400);
    }

    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "";
    const result = await handleGoogleLogin(googleId, email, name, avatar, ip, userAgent);

    if (!result.success) {
      return c.json({ code: "LOGIN_FAILED", message: result.message || "Google login failed." }, 400);
    }

    return c.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
      userId: result.userId,
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Google login failed." }, 500);
  }
});

/**
 * POST /auth/customer/apple — Apple Sign In
 */
auth.post("/auth/customer/apple", async (c) => {
  try {
    const { appleId, email, name } = await c.req.json<{
      appleId: string; email: string; name: string;
    }>();

    if (!appleId || !email) {
      return c.json({ code: "MISSING_FIELDS", message: "Apple ID and email are required." }, 400);
    }

    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "";
    const result = await handleAppleLogin(appleId, email, name, ip, userAgent);

    if (!result.success) {
      return c.json({ code: "LOGIN_FAILED", message: result.message || "Apple login failed." }, 400);
    }

    return c.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
      userId: result.userId,
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Apple login failed." }, 500);
  }
});

/**
 * POST /auth/customer/guest — Guest browsing (no account)
 */
auth.post("/auth/customer/guest", async (c) => {
  try {
    const guestId = v4();
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "";
    const { query } = await import("../db/index.js");
    // Create a guest user in the users table to satisfy FK constraint
    await query(
      `INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [guestId, `guest_${guestId.slice(0, 8)}@alayainsider.com`, "guest", "Guest", "customer", true],
    );
    const session = await createSession(guestId, "customer", ip, userAgent, "guest");

    if (!session.success) {
      return c.json({ code: "SESSION_ERROR", message: "Failed to create guest session." }, 500);
    }

    return c.json({
      success: true,
      token: session.token,
      refreshToken: session.refreshToken,
      isGuest: true,
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Guest session failed." }, 500);
  }
});

/* ================================================================== */
/*  ADMIN AUTHENTICATION                                               */
/* ================================================================== */

/**
 * POST /auth/admin/login — Verify admin email + password (Step 1)
 */
auth.post("/auth/admin/login", async (c) => {
  try {
    const { email, password } = await c.req.json<{ email: string; password: string }>();

    if (!email || !password) {
      return c.json({ code: "MISSING_FIELDS", message: "Email and password are required." }, 400);
    }

    const authCfg = await getAuthSettings();

    // Ensure admin user exists in database-driven auth store
    await initAdminUser();

    // Rate limiting check
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

    // Look up admin email from PostgreSQL settings
    const adminEmailRow = await queryOne<{ value: any }>(
      "SELECT value FROM settings WHERE key = 'admin_email'",
    );
    const adminEmail = typeof adminEmailRow?.value === 'string' ? adminEmailRow.value : "alayainsider@gmail.com";

    const passwordValid = await validateAdminPassword(email, password);
    if (!passwordValid) {
      await recordLogin(adminEmail, "admin", "password", false, ip, c.req.header("user-agent") || "", "", "Invalid credentials");
      return c.json({ code: "UNAUTHORIZED", message: "Invalid admin credentials." }, 401);
    }

    // Password verified — return success, frontend proceeds to 2FA
    await recordLogin(adminEmail, "admin", "password", true, ip, c.req.header("user-agent") || "");

    await logSecurityEvent("login_success", email, "admin",
      "Admin password verified — 2FA required", adminEmail, ip);

    return c.json({
      success: true,
      message: "Password verified. Proceed with two-factor authentication.",
      requires2FA: authCfg.admin.require2FA,
      mfaMethods: {
        email: authCfg.admin.emailOtpEnabled,
        mobile: authCfg.admin.mobileOtpEnabled,
      },
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Login failed." }, 500);
  }
});

/**
 * POST /auth/admin/send-email-otp — Send email OTP for admin 2FA
 *
 * SECURITY: The OTP code is ALWAYS generated server-side. The frontend NEVER
 * generates or knows the OTP code. No code parameter is accepted from the client.
 *
 * The SAME code is sent via BOTH email and SMS (if phone is configured) so the
 * user receives a single code on both channels and can enter either one.
 */
auth.post("/auth/admin/send-email-otp", async (c) => {
  try {
    const adminEmailRow = await queryOne<{ value: any }>(
      "SELECT value FROM settings WHERE key = 'admin_email'",
    );
    const adminEmail = typeof adminEmailRow?.value === 'string' ? adminEmailRow.value : "alayainsider@gmail.com";

    if (!adminEmail) {
      return c.json({ code: "NO_EMAIL", message: "No admin email configured." }, 400);
    }

    // Generate ONE code for both channels — same code delivered via email + SMS
    const code = generateSecureCode(OTP_LENGTH);

    // Send via email (primary channel)
    const result = await sendOtp(adminEmail, "admin_mfa", "email", code);

    // ALSO send via SMS with the EXACT SAME code (secondary channel)
    // Fire-and-forget: SMS delivery failure should not block the response
    const adminPhoneRow = await queryOne<{ value: any }>(
      "SELECT value FROM settings WHERE key = 'admin_phone'",
    );
    const adminPhone = typeof adminPhoneRow?.value === 'string' ? adminPhoneRow.value : "";
    if (adminPhone) {
      sendOtp(adminPhone, "admin_mfa", "sms", code).catch(() => {});
    }

    return c.json({
      success: result.success,
      message: result.success ? "Verification code sent." : result.message,
      expiresIn: result.expiresIn,
      retryAfter: result.retryAfter,
    }, result.success ? 200 : 429);
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Failed to send email OTP." }, 500);
  }
});

/**
 * POST /auth/admin/send-mobile-otp — Send mobile OTP for admin 2FA
 *
 * SECURITY: The OTP code is ALWAYS generated server-side. The frontend NEVER
 * generates or knows the OTP code. No code parameter is accepted from the client.
 */
auth.post("/auth/admin/send-mobile-otp", async (c) => {
  try {
    let phone: string | undefined;
    try {
      const body = await c.req.json<{ phone?: string }>();
      phone = body.phone;
    } catch {
      // No body or invalid JSON
    }

    const adminPhoneRow = await queryOne<{ value: any }>(
      "SELECT value FROM settings WHERE key = 'admin_phone'",
    );
    const adminPhone = phone || (typeof adminPhoneRow?.value === 'string' ? adminPhoneRow.value : "");

    if (!adminPhone) {
      return c.json({ code: "NO_PHONE", message: "No admin phone number configured." }, 400);
    }

    // OTP is generated server-side (no code passed from frontend)
    const result = await sendOtp(adminPhone, "admin_mfa", "sms");
    return c.json({
      success: result.success,
      message: result.success ? "Verification code sent." : result.message,
      expiresIn: result.expiresIn,
      retryAfter: result.retryAfter,
    }, result.success ? 200 : 429);
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Failed to send mobile OTP." }, 500);
  }
});

/**
 * POST /auth/admin/verify-otp — Verify OTP and complete admin login
 */
auth.post("/auth/admin/verify-otp", async (c) => {
  try {
    const { identifier, code, type, deviceData } = await c.req.json<{
      identifier: string; code: string; type: "email" | "sms"; deviceData?: Record<string, string>;
    }>();

    if (!identifier || !code) {
      return c.json({ code: "MISSING_FIELDS", message: "Identifier and code are required." }, 400);
    }

    const verification = await verifyOtp(identifier, code, "admin_mfa");
    if (!verification.success) {
      return c.json({ code: "INVALID_OTP", message: verification.message }, 400);
    }

    const adminEmailRow = await queryOne<{ value: any }>(
      "SELECT value FROM settings WHERE key = 'admin_email'",
    );
    const adminId = typeof adminEmailRow?.value === 'string' ? adminEmailRow.value : "admin";

    // Generate device fingerprint
    const fp = deviceData ? generateDeviceFingerprint({
      browser: deviceData.browser,
      os: deviceData.os,
      screenResolution: deviceData.screenResolution,
      timezone: deviceData.timezone,
      language: deviceData.language,
      platform: deviceData.platform,
    }) : "";

    // Create admin session
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "";
    const session = await createSession(adminId, "admin", ip, userAgent, fp);

    if (!session.success) {
      return c.json({ code: "SESSION_ERROR", message: "Failed to create session." }, 500);
    }

    await recordLogin(adminId, "admin", type === "email" ? "otp" : "otp", true, ip, userAgent, fp);

    return c.json({
      success: true,
      token: session.token,
      refreshToken: session.refreshToken,
      user: { id: adminId, email: adminId, name: "Admin" },
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Verification failed." }, 500);
  }
});

/* ================================================================== */
/*  SESSION MANAGEMENT                                                 */
/* ================================================================== */

/**
 * POST /auth/refresh — Refresh session token
 */
auth.post("/auth/refresh", async (c) => {
  try {
    const { refreshToken } = await c.req.json<{ refreshToken: string }>();
    if (!refreshToken) {
      return c.json({ code: "MISSING_TOKEN", message: "Refresh token required." }, 400);
    }

    const result = await refreshSession(refreshToken);
    if (!result.success) {
      return c.json({ code: "INVALID_TOKEN", message: result.message || "Invalid refresh token." }, 401);
    }

    return c.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    return c.json({ code: "INTERNAL_ERROR", message: "Token refresh failed." }, 500);
  }
});

/* ================================================================== */
/*  AUTHENTICATED ROUTES (require valid session)                       */
/* ================================================================== */

// Use Hono middleware groups for protected routes
const authenticated = new Hono();
authenticated.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ code: "UNAUTHORIZED", message: "Missing or invalid auth token." }, 401);
  }
  const token = authHeader.slice(7);
  const session = await validateSession(token);
  if (!session) {
    return c.json({ code: "SESSION_EXPIRED", message: "Session expired or invalid." }, 401);
  }
  setSession(c, session);
  await touchSession(token);
  await next();
});

authenticated.post("/logout", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  await terminateSession(session.id);
  return c.json({ success: true, message: "Session terminated." });
});

authenticated.post("/logout-all", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const count = await terminateAllSessions(session.userId);
  return c.json({ success: true, message: `${count} sessions terminated.` });
});

authenticated.get("/sessions", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const sessions = await getUserSessions(session.userId);
  return c.json({
    sessions: sessions.map((s) => ({
      id: s.id, browser: s.browser, os: s.os, country: s.country, city: s.city,
      ip: s.ip, isTrusted: s.isTrusted, lastActivity: s.lastActivity,
      createdAt: s.createdAt, expiresAt: s.expiresAt,
      current: s.id === session.id,
    })),
  });
});

authenticated.delete("/sessions/:id", async (c) => {
  const ok = await terminateSession(c.req.param("id"));
  if (!ok) return c.json(errorEnvelope(c, 404, "NOT_FOUND", "Session not found."), 404);
  return c.json({ success: true, message: "Session terminated." });
});

authenticated.post("/devices", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const { name, fingerprint } = await c.req.json<{ name: string; fingerprint: string }>();
  if (!name || !fingerprint) {
    return c.json(errorEnvelope(c, 400, "MISSING_FIELDS", "Device name and fingerprint required."), 400);
  }
  const device = await addTrustedDevice(session.userId, name, fingerprint, session.browser, session.os, session.ip);
  return c.json({ success: true, device });
});

authenticated.delete("/devices/:id", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const ok = await removeTrustedDevice(session.userId, c.req.param("id"));
  if (!ok) return c.json(errorEnvelope(c, 404, "NOT_FOUND", "Device not found."), 404);
  return c.json({ success: true });
});

authenticated.get("/devices", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const devices = await getTrustedDevices(session.userId);
  return c.json({ devices });
});

authenticated.get("/security/events", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const limit = Number(c.req.query("limit")) || 50;
  return c.json({ events: await getSecurityEvents(session.userId, undefined, limit) });
});

authenticated.get("/security/login-history", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const limit = Number(c.req.query("limit")) || 50;
  return c.json({ history: await getLoginHistory(session.userId, undefined, limit) });
});

// Mount authenticated routes
auth.route("/", authenticated);

/* ================================================================== */
/*  ADMIN-ONLY ROUTES                                                 */
/* ================================================================== */

const adminAuth = new Hono();
adminAuth.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ code: "UNAUTHORIZED", message: "Missing or invalid auth token." }, 401);
  }
  const token = authHeader.slice(7);
  const session = await validateSession(token, "admin");
  if (!session) {
    return c.json({ code: "SESSION_EXPIRED", message: "Admin session expired or invalid." }, 401);
  }
  setSession(c, session);
  await touchSession(token);
  await next();
});

adminAuth.post("/recovery/codes", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  const result = await generateRecoveryCodes(session.userId);
  if (!result.success) return c.json({ code: "ERROR", message: result.message }, 500);
  return c.json(result);
});

adminAuth.get("/recovery/status", async (c) => {
  const session = getSession(c);
  if (!session) return c.json(errorEnvelope(c, 401, "UNAUTHORIZED", "No session"), 401);
  return c.json({ status: await getRecoveryCodesInfo(session.userId) });
});

adminAuth.get("/settings", async (c) => {
  return c.json({ settings: await getAuthSettings() });
});

adminAuth.put("/settings", async (c) => {
  const patch = await c.req.json();
  const settings = await updateAuthSettings(patch);
  return c.json({ success: true, settings });
});

// Mount admin-only routes
auth.route("/", adminAuth);

/* ================================================================== */
/*  PUBLIC ROUTES (no auth required)                                   */
/* ================================================================== */

/**
 * GET /auth/security/stats — Get auth statistics
 */
auth.get("/security/stats", async (c) => {
  return c.json({ stats: await getAuthStatistics() });
});

export { auth };
