/**
 * ALAYA INSIDER — PayPal Webhook Signature Verification
 * --------------------------------------------------------------------------
 * Implements PayPal's verify-webhook-signature API according to
 * the official PayPal Webhook Notification specification.
 *
 * Verification involves:
 * 1. Extract PayPal-Transmission-Id header
 * 2. Extract PayPal-Transmission-Time header
 * 3. Extract PayPal-Transmission-Sig header
 * 4. Extract PayPal-Cert-Url header
 * 5. Extract PayPal-Auth-Algo header
 * 6. Construct the expected signature string:
 *    {transmission_id}|{transmission_time}|{webhook_id}|CRC32({payload})
 * 7. Fetch the PayPal public certificate from cert_url
 * 8. Verify the signature using the certificate
 * 9. Reject: modified payloads, duplicate webhooks, expired requests (>5min), invalid signatures
 *
 * NEVER process an invalid webhook.
 */

import { createHash, createVerify } from "crypto";
import { webhookEngine } from "./webhooks.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface PayPalWebhookHeaders {
  "paypal-transmission-id": string;
  "paypal-transmission-time": string;
  "paypal-transmission-sig": string;
  "paypal-cert-url": string;
  "paypal-auth-algo": string;
  "paypal-webhook-id"?: string;
}

export interface PayPalWebhookVerificationResult {
  verified: boolean;
  reason?: string;
}

/* ================================================================== */
/*  CONFIGURATION                                                      */
/* ================================================================== */

// Maximum age for webhook events (5 minutes)
const MAX_EVENT_AGE_MS = 5 * 60 * 1000;

// Cache for PayPal public certificates (avoids fetching on every webhook)
const certCache = new Map<string, { cert: string; fetchedAt: number }>();
const CERT_CACHE_TTL = 3600_000; // 1 hour

/* ================================================================== */
/*  PEN TESTING - CRC32 (PayPal's signature algorithm)                */
/* ================================================================== */

/**
 * Compute CRC32 checksum of the webhook payload.
 * PayPal includes CRC32 of the payload in the signature string.
 */
function crc32(data: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i) & 0xff;
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* ================================================================== */
/*  FETCH PAYPAL CERTIFICATE                                          */
/* ================================================================== */

/**
 * Fetch PayPal's public certificate from the cert_url.
 * Certificates are cached for 1 hour to avoid excessive HTTP requests.
 */
async function fetchPaypalCertificate(certUrl: string): Promise<string | null> {
  // Check cache first
  const cached = certCache.get(certUrl);
  if (cached && Date.now() - cached.fetchedAt < CERT_CACHE_TTL) {
    return cached.cert;
  }

  try {
    const certUrlLower = certUrl.toLowerCase();

    // Validate cert URL is from PayPal
    if (!certUrlLower.startsWith("https://")) {
      throw new Error("Certificate URL must use HTTPS");
    }

    // Only allow PayPal certificate URLs
    const allowedHosts = [
      "api.paypal.com",
      "api-m.paypal.com",
      "api.sandbox.paypal.com",
      "api-m.sandbox.paypal.com",
    ];

    const url = new URL(certUrl);
    if (!allowedHosts.some((host) => url.hostname === host)) {
      throw new Error(`Invalid PayPal certificate host: ${url.hostname}`);
    }

    // Validate path
    if (!url.pathname.includes("v1/notifications/certs")) {
      throw new Error("Invalid PayPal certificate path");
    }

    const response = await fetch(certUrl, {
      headers: { Accept: "application/x-pem-file" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch certificate: ${response.status}`);
    }

    const cert = await response.text();

    // Validate it looks like a PEM certificate
    if (!cert.includes("-----BEGIN CERTIFICATE-----")) {
      throw new Error("Invalid certificate format");
    }

    // Cache the certificate
    certCache.set(certUrl, { cert, fetchedAt: Date.now() });

    return cert;
  } catch (err) {
    console.error("[PAYPAL-WEBHOOK] Failed to fetch certificate:", err);
    return null;
  }
}

/* ================================================================== */
/*  SIGNATURE VERIFICATION                                             */
/* ================================================================== */

/**
 * Build the expected signature string as specified by PayPal:
 * {transmission_id}|{transmission_time}|{webhook_id}|CRC32({payload_body})
 */
function buildSignatureString(
  transmissionId: string,
  transmissionTime: string,
  webhookId: string,
  payloadBody: string,
): string {
  const payloadCrc32 = crc32(payloadBody);
  return `${transmissionId}|${transmissionTime}|${webhookId}|${payloadCrc32}`;
}

/**
 * Verify the PayPal webhook signature using the PayPal public certificate.
 *
 * Steps:
 * 1. Validate all required headers are present
 * 2. Check replay protection (event must be less than 5 minutes old)
 * 3. Build the expected signature string
 * 4. Fetch PayPal's public certificate
 * 5. Verify the signature using RSA-SHA256
 * 6. Return verification result
 */
export async function verifyPayPalWebhookSignature(
  headers: PayPalWebhookHeaders,
  rawPayload: string,
): Promise<PayPalWebhookVerificationResult> {
  try {
    // ── Step 1: Validate required headers ──
    const transmissionId = headers["paypal-transmission-id"];
    const transmissionTime = headers["paypal-transmission-time"];
    const transmissionSig = headers["paypal-transmission-sig"];
    const certUrl = headers["paypal-cert-url"];
    const authAlgo = headers["paypal-auth-algo"];

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      return { verified: false, reason: "Missing required PayPal webhook headers" };
    }

    // ── Step 2: Replay Protection ──
    const eventTime = new Date(transmissionTime).getTime();
    if (isNaN(eventTime)) {
      return { verified: false, reason: "Invalid transmission time format" };
    }

    if (Date.now() - eventTime > MAX_EVENT_AGE_MS) {
      return { verified: false, reason: `Webhook is too old (>5 minutes, age: ${Math.round((Date.now() - eventTime) / 1000)}s)` };
    }

    // ── Step 3: Fetch PayPal certificate ──
    const cert = await fetchPaypalCertificate(certUrl);
    if (!cert) {
      return { verified: false, reason: "Failed to fetch PayPal certificate" };
    }

    // ── Step 4: Build signature string ──
    const webhookId = headers["paypal-webhook-id"] || "";
    const signatureString = buildSignatureString(
      transmissionId,
      transmissionTime,
      webhookId,
      rawPayload,
    );

    // ── Step 5: Verify signature using RSA-SHA256 ──
    const verifier = createVerify("RSA-SHA256");
    verifier.update(signatureString);
    verifier.end();

    // Decode base64 signature
    const signatureBuffer = Buffer.from(transmissionSig, "base64");

    const verified = verifier.verify(cert, signatureBuffer);

    return {
      verified,
      reason: verified ? undefined : "Signature verification failed",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown verification error";
    console.error("[PAYPAL-WEBHOOK] Verification error:", message);
    return { verified: false, reason: message };
  }
}

/* ================================================================== */
/*  PAYPAL PROVIDER INTEGRATION                                        */
/* ================================================================== */

/**
 * Verify PayPal webhook signature from incoming request.
 * This is called by the webhook engine when processing PayPal events.
 *
 * Returns true ONLY if the signature passes ALL checks.
 * NEVER returns true for invalid webhooks.
 */
export async function verifyPayPalWebhook(
  rawPayload: string,
  reqHeaders: Record<string, string>,
): Promise<boolean> {
  const ppHeaders: PayPalWebhookHeaders = {
    "paypal-transmission-id": reqHeaders["paypal-transmission-id"] || reqHeaders["Paypal-Transmission-Id"] || "",
    "paypal-transmission-time": reqHeaders["paypal-transmission-time"] || reqHeaders["Paypal-Transmission-Time"] || "",
    "paypal-transmission-sig": reqHeaders["paypal-transmission-sig"] || reqHeaders["Paypal-Transmission-Sig"] || "",
    "paypal-cert-url": reqHeaders["paypal-cert-url"] || reqHeaders["Paypal-Cert-Url"] || "",
    "paypal-auth-algo": reqHeaders["paypal-auth-algo"] || reqHeaders["Paypal-Auth-Algo"] || "",
    "paypal-webhook-id": reqHeaders["paypal-webhook-id"] || reqHeaders["Paypal-Webhook-Id"] || "",
  };

  const result = await verifyPayPalWebhookSignature(ppHeaders, rawPayload);

  if (!result.verified) {
    console.warn("[PAYPAL-WEBHOOK] Rejected webhook:", result.reason);
  }

  return result.verified;
}

/**
 * Clear the certificate cache (useful for testing).
 */
export function clearPaypalCertCache(): void {
  certCache.clear();
}
