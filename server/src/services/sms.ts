/**
 * ALAYA INSIDER — SMS Service (Twilio)
 * --------------------------------------------------------------------------
 * Handles sending SMS messages via Twilio with latency tracking.
 * Supports both direct SMS via Twilio Messaging API and Twilio Verify API.
 *
 * Environment:
 *   TWILIO_ACCOUNT_SID   — Twilio Account SID (optional in dev)
 *   TWILIO_AUTH_TOKEN    — Twilio Auth Token   (optional in dev)
 *   TWILIO_PHONE_NUMBER  — Twilio phone number to send FROM (optional in dev)
 *   TWILIO_VERIFY_SID    — Twilio Verify Service SID (optional, uses Verify API if set)
 */

import Twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER ?? "";
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID ?? "";

export interface SmsResult {
  success: boolean;
  messageId?: string;
  status: string;
  error?: string;
  /** Latency in milliseconds (time from call to successful send). */
  latencyMs?: number;
  /** Which API was used to send the SMS. */
  method?: "verify" | "messaging" | "dev_mode";
}

/**
 * Shared Twilio client instance — created lazily so the module can be imported
 * before the env vars are loaded (dotenv runs at server startup).
 */
let _twilio: Twilio.Twilio | null = null;

function getTwilioClient(): Twilio.Twilio {
  if (!_twilio) {
    _twilio = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return _twilio;
}

/**
 * Send an OTP verification code via SMS.
 *
 * Production modes (in order of preference):
 *   1. Twilio Verify API — if TWILIO_VERIFY_SID is set (fastest delivery, offloads OTP logic)
 *   2. Twilio Messaging API — direct SMS via TWILIO_PHONE_NUMBER
 *   3. Dev mode — no SMS sent, OTP logged server-side
 *
 * All timing is logged to help diagnose delivery delays.
 */
export async function sendOtpSms(
  phone: string,
  otpCode: string,
  brandName = "ALAYA",
): Promise<SmsResult> {
  const startTime = performance.now();

  // Normalize phone number — ensure it starts with +
  const normalizedPhone = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;

  // --- MODE 1: Twilio Verify API ---
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SID) {
    try {
      const client = getTwilioClient();

      const verification = await client.verify.v2
        .services(TWILIO_VERIFY_SID)
        .verifications.create({
          to: normalizedPhone,
          channel: "sms",
          locale: "en",
        });

      const latencyMs = Math.round(performance.now() - startTime);
      console.log(
        `[SMS] Verify API → ${normalizedPhone} | SID: ${verification.sid} | Status: ${verification.status} | Latency: ${latencyMs}ms`,
      );

      return {
        success: true,
        messageId: verification.sid,
        status: verification.status ?? "pending",
        latencyMs,
        method: "verify",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Verify API error";
      console.error(`[SMS] Verify API failed for ${normalizedPhone}: ${message}`);
      // Fall through to messaging API
    }
  }

  // --- MODE 2: Twilio Messaging API (direct SMS) ---
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      const client = getTwilioClient();

      const message = await client.messages.create({
        from: TWILIO_PHONE_NUMBER,
        to: normalizedPhone,
        body: `Your ${brandName} verification code is: ${otpCode}. Valid for 5 minutes.`,
      });

      const latencyMs = Math.round(performance.now() - startTime);
      console.log(
        `[SMS] Messaging API → ${normalizedPhone} | SID: ${message.sid} | Status: ${message.status} | Latency: ${latencyMs}ms`,
      );

      return {
        success: true,
        messageId: message.sid,
        status: message.status ?? "sent",
        latencyMs,
        method: "messaging",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown SMS error";
      console.error(`[SMS] Failed to send OTP to ${normalizedPhone}: ${message}`);
      return {
        success: false,
        status: "failed",
        error: message,
        latencyMs: Math.round(performance.now() - startTime),
        method: "messaging",
      };
    }
  }

  // --- MODE 3: Dev mode (no Twilio credentials) ---
  const latencyMs = Math.round(performance.now() - startTime);
  console.log(`[SMS] Dev mode — OTP for ${normalizedPhone}: ${otpCode} (latency: ${latencyMs}ms)`);
  return {
    success: false,
    status: "dev_mode",
    error: "SMS provider not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and one of TWILIO_PHONE_NUMBER or TWILIO_VERIFY_SID.",
    latencyMs,
    method: "dev_mode",
  };
}

/**
 * Verify an OTP code using the Twilio Verify API.
 * Only works if TWILIO_VERIFY_SID is configured.
 */
export async function verifyOtpViaTwilio(
  phone: string,
  code: string,
): Promise<{ success: boolean; message: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    return { success: false, message: "Twilio Verify API not configured." };
  }

  const startTime = performance.now();
  const normalizedPhone = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;

  try {
    const client = getTwilioClient();
    const verificationCheck = await client.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: normalizedPhone,
        code,
      });

    const latencyMs = Math.round(performance.now() - startTime);
    console.log(
      `[SMS] Verify check → ${normalizedPhone} | Status: ${verificationCheck.status} | Valid: ${verificationCheck.valid} | Latency: ${latencyMs}ms`,
    );

    if (verificationCheck.valid) {
      return { success: true, message: "Code verified via Twilio Verify." };
    }
    return { success: false, message: "Invalid verification code." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Verify check error";
    console.error(`[SMS] Verify check failed for ${normalizedPhone}: ${message}`);
    return { success: false, message: "Verification check failed." };
  }
}
