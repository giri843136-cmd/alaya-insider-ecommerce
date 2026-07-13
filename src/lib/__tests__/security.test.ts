/**
 * ALAYA INSIDER — Security Module Unit Tests
 * --------------------------------------------------------------------------
 * Tests for the OTP/TOTP authentication functions.
 * Functions requiring crypto.subtle (verifyTOTP) are tested via pattern
 * validation rather than live HMAC computation in the Node test runner.
 */

import { describe, expect, it } from "vitest";
import {
  generate2FASecret,
  backupCodes,
  buildOTPAuthURI,
  generateTOTPCode,
  verifyTOTP,
} from "../security";

// ── generate2FASecret ───────────────────────────────────────────────

describe("generate2FASecret()", () => {
  it("generates a 32-character secret", () => {
    const secret = generate2FASecret();
    expect(secret).toHaveLength(32);
  });

  it("generates a base32-encoded string (uppercase A-Z, 2-7)", () => {
    const secret = generate2FASecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it("generates unique secrets on each call", () => {
    const s1 = generate2FASecret();
    const s2 = generate2FASecret();
    expect(s1).not.toBe(s2);
  });

  it("does not contain padding characters", () => {
    const secret = generate2FASecret();
    expect(secret).not.toContain("=");
  });
});

// ── backupCodes ─────────────────────────────────────────────────────

describe("backupCodes()", () => {
  it("generates the requested number of codes", () => {
    const codes = backupCodes(8);
    expect(codes).toHaveLength(8);
  });

  it("each code follows the XXXX-XXXX-XXXX-XXXX format", () => {
    const codes = backupCodes(8);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
  });

  it("generates unique codes", () => {
    const codes = backupCodes(8);
    const unique = new Set(codes);
    expect(unique.size).toBe(8);
  });

  it("defaults to 8 codes when count is omitted", () => {
    const codes = backupCodes();
    expect(codes).toHaveLength(8);
  });

  it("generates different codes on each call", () => {
    const c1 = backupCodes(8);
    const c2 = backupCodes(8);
    expect(c1).not.toEqual(c2);
  });

  it("generates 0 codes when count is 0", () => {
    const codes = backupCodes(0);
    expect(codes).toEqual([]);
  });

  it("generates a single valid code when count is 1", () => {
    const codes = backupCodes(1);
    expect(codes).toHaveLength(1);
    expect(codes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("handles large counts without errors", () => {
    const codes = backupCodes(100);
    expect(codes).toHaveLength(100);
    const unique = new Set(codes);
    expect(unique.size).toBe(100);
  });
});

// ── buildOTPAuthURI ─────────────────────────────────────────────────

describe("buildOTPAuthURI()", () => {
  const testSecret = "JBSWY3DPEHPK3PXP";
  const defaultLabel = "admin";
  const defaultIssuer = "ALAYA INSIDER";

  it("starts with otpauth://totp/", () => {
    const uri = buildOTPAuthURI(testSecret);
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
  });

  it("includes the encoded issuer label", () => {
    const uri = buildOTPAuthURI(testSecret);
    expect(uri).toContain(encodeURIComponent(`${defaultIssuer}:${defaultLabel}`));
  });

  it("includes the secret parameter", () => {
    const uri = buildOTPAuthURI(testSecret);
    expect(uri).toContain(`secret=${testSecret}`);
  });

  it("includes the issuer parameter", () => {
    const uri = buildOTPAuthURI(testSecret);
    expect(uri).toContain(`issuer=${encodeURIComponent(defaultIssuer)}`);
  });

  it("includes algorithm, digits, and period parameters", () => {
    const uri = buildOTPAuthURI(testSecret);
    expect(uri).toContain("algorithm=SHA1");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("accepts a custom label and issuer", () => {
    const uri = buildOTPAuthURI(testSecret, "custom-user", "MyApp");
    expect(uri).toContain(encodeURIComponent("MyApp:custom-user"));
    expect(uri).toContain("issuer=MyApp");
  });

  it("produces a valid URI scheme", () => {
    const uri = buildOTPAuthURI(testSecret);
    // Verify all required TOTP URI components are present
    expect(uri).toContain("otpauth://");
    expect(uri).toContain("?secret=");
    expect(uri).toContain("&issuer=");
  });
});

// ── generateTOTPCode & verifyTOTP (requires crypto.subtle — Node 19+) ─

describe("generateTOTPCode()", () => {
  it("produces a 6-digit code for a valid secret", async () => {
    const { code, remaining } = await generateTOTPCode("JBSWY3DPEHPK3PXP");
    expect(code).toMatch(/^\d{6}$/);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(30);
  });

  it("produces different codes for different secrets", async () => {
    const r1 = await generateTOTPCode("JBSWY3DPEHPK3PXP");
    const r2 = await generateTOTPCode("K5X2IL4TMVWGYTLO");
    expect(r1.code).not.toBe(r2.code);
  });

  it("remaining decreases over time (called twice)", async () => {
    const r1 = await generateTOTPCode("JBSWY3DPEHPK3PXP");
    const r2 = await generateTOTPCode("JBSWY3DPEHPK3PXP");
    expect(r1.code).toBe(r2.code); // same 30-second window
    expect(r2.remaining).toBeLessThanOrEqual(r1.remaining);
  });
});

describe("verifyTOTP()", () => {
  const secret = "JBSWY3DPEHPK3PXP";

  it("accepts the correct code", async () => {
    const { code } = await generateTOTPCode(secret);
    const ok = await verifyTOTP(secret, code);
    expect(ok).toBe(true);
  });

  it("rejects an incorrect code", async () => {
    // Use a code from a different secret
    const { code } = await generateTOTPCode("K5X2IL4TMVWGYTLO");
    const ok = await verifyTOTP(secret, code);
    expect(ok).toBe(false);
  });

  it("rejects an empty secret", async () => {
    const ok = await verifyTOTP("", "123456");
    expect(ok).toBe(false);
  });

  it("rejects a non-numeric code", async () => {
    const ok = await verifyTOTP(secret, "ABCDEF");
    expect(ok).toBe(false);
  });

  it("rejects a short code", async () => {
    const ok = await verifyTOTP(secret, "12345");
    expect(ok).toBe(false);
  });

  it("rejects a long code", async () => {
    const ok = await verifyTOTP(secret, "1234567");
    expect(ok).toBe(false);
  });

  it("rejects empty user code", async () => {
    const ok = await verifyTOTP(secret, "");
    expect(ok).toBe(false);
  });

  it("accepts a code generated from the current time window", async () => {
    // Verifies the TOTP implementation correctly computes HMAC-SHA1
    // and matches within the current 30-second window
    const { code } = await generateTOTPCode(secret);
    const ok = await verifyTOTP(secret, code);
    expect(ok).toBe(true);
  });
});

// ── generate2FASecret + buildOTPAuthURI integration ─────────────────

describe("TOTP integration", () => {
  it("a generated secret produces a valid otpauth URI", () => {
    const secret = generate2FASecret();
    const uri = buildOTPAuthURI(secret);
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain(`secret=${secret}`);
  });

  it("a generated secret works with verifyTOTP end-to-end", async () => {
    const secret = generate2FASecret();
    const { code } = await generateTOTPCode(secret);
    const ok = await verifyTOTP(secret, code);
    expect(ok).toBe(true);
  });

  it("a valid otpauth URI is generated from a real secret", async () => {
    const secret = generate2FASecret();
    const uri = buildOTPAuthURI(secret);
    // The URI should be parseable and contain all required params
    const url = new URL(uri);
    expect(url.protocol).toBe("otpauth:");
    expect(url.host).toBe("totp");
    expect(url.searchParams.get("secret")).toBe(secret);
    expect(url.searchParams.get("issuer")).toBe("ALAYA INSIDER");
  });
});
