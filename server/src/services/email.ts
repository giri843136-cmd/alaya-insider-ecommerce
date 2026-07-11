/**
 * ALAYA INSIDER — Email Service (Bird SDK)
 * --------------------------------------------------------------------------
 * Handles sending transactional emails via the Bird API (https://bird.com).
 * Falls back gracefully when no API key is configured (logs instead).
 *
 * Environment:
 *   BIRD_API_KEY          — API key from Bird dashboard (required for production)
 *                          Format: bk_{region}_{token}
 *   BIRD_EMAIL_FROM       — Default sender email address (required for production)
 */
import { BirdClient, BirdAPIError } from "@messagebird/sdk";

const BIRD_API_KEY = process.env.BIRD_API_KEY ?? "";
const BIRD_EMAIL_FROM = process.env.BIRD_EMAIL_FROM ?? "";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  status: string;
  error?: string;
}

/**
 * Shared BirdClient instance — created lazily.
 */
let _bird: BirdClient | null = null;

function getBirdClient(): BirdClient {
  if (!_bird) {
    _bird = new BirdClient({ apiKey: BIRD_API_KEY });
  }
  return _bird;
}

/**
 * Send a transactional email via Bird.
 *
 * In production (BIRD_API_KEY and BIRD_EMAIL_FROM set): sends real email via Bird API.
 * In development (missing credentials): logs the email for testing.
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  from?: string,
): Promise<EmailResult> {
  if (!BIRD_API_KEY || !BIRD_EMAIL_FROM) {
    console.log(`[Email] Dev mode — would send to ${to}: "${subject}"`);
    console.log(`[Email] Body preview: ${htmlBody.slice(0, 200)}...`);
    return { success: true, status: "dev_mode" };
  }

  try {
    const bird = getBirdClient();

    const result = await bird.email.send({
      from: from ?? BIRD_EMAIL_FROM,
      to: [to],
      subject,
      html: htmlBody,
      text: textBody,
      category: "transactional",
    });

    console.log(`[Email] Sent to ${to} — ID: ${result.id}, Status: ${result.status}`);
    return {
      success: true,
      messageId: result.id,
      status: result.status,
    };
  } catch (error) {
    const message =
      error instanceof BirdAPIError
        ? `${error.code} — ${error.message}`
        : error instanceof Error
          ? error.message
          : "Unknown email error";

    console.error(`[Email] Failed to send to ${to}: ${message}`);
    return { success: false, status: "failed", error: message };
  }
}
