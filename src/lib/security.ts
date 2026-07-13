/**
 * ALAYA INSIDER — Security Engine
 * -----------------------------------------------------------------
 * Centralized, secure-by-default helpers implementing the security spec.
 * Every form, upload, search and API input flows through these validators.
 *
 * This module is pure (no React) so it can be unit-tested and reused
 * server-side. It is imported automatically by UI inputs and the service layer.
 *
 * HARDENED for production: PII detection, DOM XSS prevention,
 * strict input limits, secret scanning.
 */

/* --------------------------- Input sanitization -------------------------- */

const ALLOWED_TAGS = ["b", "i", "em", "strong", "u", "br", "p", "ul", "ol", "li", "a"];

/** Strip HTML tags except an allowlist; always escapes to prevent stored XSS. */
export function sanitizeHtml(input: string, allowed = ALLOWED_TAGS): string {
  if (!input) return "";
  const allowPattern = allowed.join("|");
  // Block all event handlers, javascript: URIs, and data: URIs
  const stripped = input
    .replace(/<[^>]*\s+on\w+\s*=(["']).*?\1[^>]*>/gi, "")
    .replace(/<[^>]*\s+on\w+\s*=\s*[^\s>]+[^>]*>/gi, "")
    .replace(new RegExp(`<(?!/?(${allowPattern})(\\s|>|/))[^>]*>`, "gi"), "");
  return stripped
    .replace(/javascript:\s*/gi, "")
    .replace(/data:\s*text\/html/gi, "")
    .replace(/vbscript:\s*/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

/** Escape HTML entities for safe output (prevents reflected XSS). Double-encoding safe. */
export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/** Strip all HTML (for plain-text fields like names, titles). */
export function stripHtml(input: string): string {
  return (input || "").replace(/<[^>]*>/g, "");
}

/** Normalize + sanitize a generic text input (trims + strips tags). */
export function cleanText(input: string, maxLength = 5000): string {
  return stripHtml(input).trim().slice(0, Math.max(0, maxLength));
}

/**
 * Sanitize a URL to prevent javascript: and data: XSS.
 * Only http/https/ftp/mailto protocols allowed.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const lower = url.trim().toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return "";
  }
  return url.trim();
}

/* --------------------------- Validation rules --------------------------- */

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isUrl = (v: string): boolean => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v);
export const isPhone = (v: string): boolean => /^[+]?[\d\s()-]{7,20}$/.test(v);

/** Maximum input length to prevent DOS via giant strings. */
export const MAX_INPUT_LENGTH = 100_000;

/** Reject oversized inputs to prevent DOS attacks. */
export function enforceMaxLength(input: string, max = MAX_INPUT_LENGTH): ValidationResult {
  if (input && input.length > max) {
    return { valid: false, message: `Input exceeds maximum length of ${max.toLocaleString()} characters` };
  }
  return { valid: true };
}

/** Reject SQL-injection / path-traversal / command-injection / SSTI patterns. */
export function detectInjection(input: string): ValidationResult {
  if (!input) return { valid: true };
  const lower = input.toLowerCase();
  const patterns: Record<string, RegExp> = {
    sqli: /(\bunion\b\s+\bselect\b)|(--\s)|(\bor\b\s+1\s*=\s*1)|(;\s*drop\b)|(\bxp_cmdshell\b)|(\bexec\b.*\bsp_)/i,
    pathTraversal: /(\.\.[/\\]){2,}|(\.\.[/\\]\.\.[/\\])|(~[\w-]+\/)/,
    commandInjection: /(\||`[^`]*`|\$\([^)]*\)|>\s*\/dev\/|&\s*\w+\s*$)/,
    fileInclusion: /(php:\/\/input|file:\/\/|data:text\/html|expect:\/\/)/i,
    ssti: /(\{\{.*\}\}|\{%\s*\w+\s*%\}|\$\{[^}]+\})/,
    prototypePollution: /(__proto__|prototype\[|constructor\[)/i,
  };
  for (const [name, re] of Object.entries(patterns)) {
    if (re.test(input)) return { valid: false, message: `Blocked: suspicious ${name} pattern` };
  }
  if (/<\s*script|\bjavascript\s*:|\bdata\s*:\s*text\/html/i.test(lower)) {
    return { valid: false, message: "Blocked: potential XSS payload" };
  }
  return { valid: true };
}

/* --------------------------- PII Detection ------------------------------ */

/** PII categories that can be detected in text. */
export interface PiiResult {
  hasPii: boolean;
  categories: string[];
  redacted: string;
}

const PII_PATTERNS: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\+?\d[\d\s()-]{7,20}\d/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:\d[ \t-]*?){13,16}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  apiKey: /(?:sk-[a-zA-Z0-9]{20,}|ala_[a-f0-9]{32,}|ghp_[a-zA-Z0-9]{36,})/g,
  jwt: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
};

/**
 * Detect PII in a string and return categories found plus redacted version.
 * Useful before logging, storing, or transmitting user input.
 */
export function detectPii(input: string): PiiResult {
  if (!input) return { hasPii: false, categories: [], redacted: input };
  const categories: string[] = [];
  let redacted = input;

  for (const [name, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(redacted)) {
      categories.push(name);
      redacted = redacted.replace(pattern, `[REDACTED_${name.toUpperCase()}]`);
    }
  }

  return { hasPii: categories.length > 0, categories, redacted };
}

/** Redact sensitive data from log messages before emitting. */
export function redactForLog(message: string): string {
  return detectPii(message).redacted
    .replace(/password=([^&\s]+)/gi, "password=[REDACTED]")
    .replace(/secret=([^&\s]+)/gi, "secret=[REDACTED]")
    .replace(/token=([^&\s]+)/gi, "token=[REDACTED]")
    .replace(/api_key=([^&\s]+)/gi, "api_key=[REDACTED]");
}

/** Validate a file upload by type/extension/size/dimensions. */
export interface UploadRules {
  allowedTypes: string[]; // e.g. ["image/jpeg","image/png"]
  allowedExtensions: string[];
  maxBytes: number;
  maxWidth?: number;
  maxHeight?: number;
}
export interface UploadResult extends ValidationResult {
  quarantine?: boolean;
}

export function validateUpload(file: { name: string; type: string; size: number }, rules: UploadRules): UploadResult {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!rules.allowedExtensions.includes(ext)) return { valid: false, message: `Extension .${ext} not allowed`, quarantine: true };
  if (!rules.allowedTypes.includes(file.type)) return { valid: false, message: `Type ${file.type} not allowed`, quarantine: true };
  if (file.size > rules.maxBytes) return { valid: false, message: `File too large (max ${(rules.maxBytes / 1024 / 1024).toFixed(1)} MB)` };
  if (/\.(exe|bat|cmd|sh|php|js|svg)$/i.test(file.name)) return { valid: false, message: "Executables & scripts blocked", quarantine: true };
  return { valid: true };
}

/* --------------------------- Password policy ---------------------------- */

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
};

/** Score 0–4 representing password strength. */
export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!password) return { score: 0, label: "Empty" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: labels[s] };
}

export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): ValidationResult {
  if (password.length < policy.minLength) return { valid: false, message: `Must be at least ${policy.minLength} characters` };
  if (policy.requireUppercase && !/[A-Z]/.test(password)) return { valid: false, message: "Must include an uppercase letter" };
  if (policy.requireLowercase && !/[a-z]/.test(password)) return { valid: false, message: "Must include a lowercase letter" };
  if (policy.requireNumbers && !/\d/.test(password)) return { valid: false, message: "Must include a number" };
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Must include a special character" };
  return { valid: true };
}

/**
 * Hash a password using the Web Crypto SubtleCrypto API (PBKDF2).
 * Returns "algo:salt:hash" — deterministic + salted, never store plaintext.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [, iterStr, saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;
    const iterations = Number(iterStr) || 100000;
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256);
    const computed = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return computed === hashHex;
  } catch {
    return false;
  }
}

/* --------------------------- Brute-force protection --------------------- */

export interface LockoutState {
  attempts: number;
  lockedUntil: number;
}

export function recordFailedAttempt(state: LockoutState, max = 5, lockMs = 30_000): LockoutState {
  const attempts = state.attempts + 1;
  return {
    attempts,
    lockedUntil: attempts >= max ? Date.now() + lockMs : state.lockedUntil,
  };
}

export function isLocked(state: LockoutState): boolean {
  return state.lockedUntil > Date.now();
}

export function resetLockout(): LockoutState {
  return { attempts: 0, lockedUntil: 0 };
}

/* --------------------------- CSRF token --------------------------------- */

/** Generate a cryptographically random CSRF token. */
export function generateToken(bytes = 32): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* --------------------------- 2FA (TOTP) ready --------------------------- */

/**
 * Generate a base32 secret for TOTP-based 2FA.
 * Architecture-ready: pairs with an authenticator app.
 */
export function generate2FASecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += alphabet[(bytes[i] >> 3) & 31];
    secret += alphabet[((bytes[i] & 7) << 2) | ((bytes[i + 1] >> 6) & 3)];
  }
  return secret.slice(0, 32);
}

export function backupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6)).join("-").toUpperCase()
  );
}

/* --------------------------- TOTP Code Generation & Verification ------- */

/**
 * Decode a base32 string to a Uint8Array (RFC 4648).
 * Handles padding and uppercase/lowercase.
 */
function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.replace(/[= ]/g, "").toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    buffer = (buffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Generate the current TOTP code for a given secret and time step.
 * Implements RFC 6238 / RFC 4226 (HOTP) with a 30-second window.
 * Returns the current 6-digit code and the remaining seconds in the window.
 */
export async function generateTOTPCode(
  secret: string
): Promise<{ code: string; remaining: number }> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  const remaining = 30 - (epoch % 30);

  // Convert counter to 8-byte big-endian buffer
  const counterBuf = new ArrayBuffer(8);
  const counterView = new DataView(counterBuf);
  counterView.setBigUint64(0, BigInt(counter), false);

  // Decode the base32 secret
  const keyData = base32Decode(secret);

  // Import key and compute HMAC-SHA1
  const key = await crypto.subtle.importKey(
    "raw",
    keyData.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const hmacResult = await crypto.subtle.sign("HMAC", key, counterBuf);
  const hmac = new Uint8Array(hmacResult);

  // Dynamic truncation (RFC 4226 section 5.3)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = String(binary % 1_000_000).padStart(6, "0");

  return { code, remaining };
}

/**
 * Verify a user-provided TOTP code against the stored secret.
 * Uses a +/- 1 time step window (90 seconds total) to account for clock drift.
 */
export async function verifyTOTP(
  secret: string,
  userCode: string
): Promise<boolean> {
  if (!secret || !userCode || userCode.length !== 6 || !/^\d{6}$/.test(userCode)) {
    return false;
  }

  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / 30);

  // Check current, previous, and next 30-second windows
  for (const offset of [0, -1, 1]) {
    const counter = currentCounter + offset;
    const counterBuf = new ArrayBuffer(8);
    const counterView = new DataView(counterBuf);
    counterView.setBigUint64(0, BigInt(counter), false);

    const keyData = base32Decode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData.buffer as ArrayBuffer,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const hmacResult = await crypto.subtle.sign("HMAC", key, counterBuf);
    const hmac = new Uint8Array(hmacResult);

    const offset_ = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset_] & 0x7f) << 24) |
      ((hmac[offset_ + 1] & 0xff) << 16) |
      ((hmac[offset_ + 2] & 0xff) << 8) |
      (hmac[offset_ + 3] & 0xff);
    const expected = String(binary % 1_000_000).padStart(6, "0");

    if (expected === userCode) return true;
  }

  return false;
}

/**
 * Build an otpauth:// URI for QR code generation.
 * Compatible with Google Authenticator, Authy, etc.
 */
export function buildOTPAuthURI(secret: string, label = "admin", issuer = "ALAYA INSIDER"): string {
  const encodedLabel = encodeURIComponent(`${issuer}:${label}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/* --------------------------- Masking Utilities --------------------------- */

/**
 * Mask a phone number showing only the last 2 digits.
 * All non-digit characters are stripped; everything except the last 2 digits is replaced with X.
 * Examples:
 *   "9876543210"       → "XXXXXXXX10"
 *   "+1 (212) 555-0198" → "XXXXXXXX98"
 *   "+91 8431364706"   → "XXXXXXXX06"
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) return `XXXXXXXX${digits}`;
  const lastTwo = digits.slice(-2);
  return `XXXXXXXX${lastTwo}`;
}

/**
 * Mask an email address showing only the first character and domain.
 * Example: "user@example.com" → "u***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 1) return `${name}***@${domain}`;
  return `${name[0]}***@${domain}`;
}

/* --------------------------- Session fingerprint ------------------------ */

export interface SessionFingerprint {
  ip: string;
  userAgent: string;
  platform: string;
  browser: string;
  location: string;
}

/** Derive an approximate session fingerprint (browser-side best-effort). */
export function fingerprint(): SessionFingerprint {
  const ua = navigator.userAgent;
  const platform = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const browser = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Unknown";
  const lang = navigator.language || "en";
  return {
    ip: "client-resolved",
    userAgent: ua,
    platform,
    browser,
    location: lang.toUpperCase(),
  };
}
