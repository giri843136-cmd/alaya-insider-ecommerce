/**
 * ALAYA INSIDER — Payment Routes
 * --------------------------------------------------------------------------
 * REST API endpoints for the Enterprise Payment Platform.
 * All routes are mounted at /api/v1/payments and /api/v1/webhooks.
 *
 * Payment Intents:
 *   POST /payments/intent          — Create payment intent
 *   POST /payments/intent/:id/confirm  — Confirm payment intent
 *   POST /payments/intent/:id/capture  — Capture payment intent
 *   POST /payments/intent/:id/cancel   — Cancel payment intent
 *   GET  /payments/intent/:id      — Get payment intent
 *
 * Webhooks:
 *   POST /webhooks/stripe          — Stripe webhook receiver
 *   POST /webhooks/paypal          — PayPal webhook receiver
 *   GET  /webhooks/deliveries      — List webhook deliveries
 *   GET  /webhooks/dead-letter     — Dead letter queue
 *   POST /webhooks/dead-letter/:id/retry — Retry dead letter
 *   GET  /webhooks/stats           — Webhook statistics
 *
 * Refunds:
 *   POST /payments/refund          — Process refund
 *   GET  /payments/refunds         — List refunds
 *
 * Disputes:
 *   GET  /payments/disputes        — List disputes
 *   POST /payments/disputes/:id/evidence — Upload evidence
 *
 * Provider Status:
 *   GET  /payments/providers       — Provider status/health
 *   POST /payments/providers/configure — Configure provider credentials
 *
 * Finance:
 *   GET  /payments/finance/reconciliation — Finance reconciliation
 *   GET  /payments/finance/settlements    — Settlement reports
 *   GET  /payments/finance/payouts       — Payout reports
 */

import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { paymentRegistry, initPaymentProviders, loadPaymentCredentials } from "../services/payments/registry.js";
import { webhookEngine } from "../services/payments/webhooks.js";
import type { PaymentProviderType, CreatePaymentIntentParams, RefundParams } from "../services/payments/types.js";
import { createAuditLog } from "../db/repositories/audit.js";
import { assessFraudRisk } from "../services/payments/fraud.js";
import { runReconciliation, listReconciliations } from "../services/payments/payment-persistence.js";

const payments = new Hono();

/* ================================================================== */
/*  MIDDLEWARE                                                         */
/* ================================================================== */

/** Get payment provider from request header or param. */
function getProvider(c: any): PaymentProviderType {
  const type = c.req.header("X-Payment-Provider") || c.req.query("provider") || "stripe";
  if (!["stripe", "paypal", "apple_pay", "google_pay"].includes(type)) {
    return "stripe";
  }
  return type as PaymentProviderType;
}

/** Get client IP for audit logging. */
function getClientIp(c: any): string {
  return c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
}

/* ================================================================== */
/*  PAYMENT INTENTS                                                    */
/* ================================================================== */

/**
 * POST /payments/intent — Create a payment intent.
 */
payments.post("/intent", async (c) => {
  try {
    const body = await c.req.json<CreatePaymentIntentParams>();
    const provider = getProvider(c);

    if (!body.amount || body.amount <= 0) {
      return c.json({ code: "INVALID_AMOUNT", message: "Amount must be greater than 0" }, 400);
    }
    if (!body.orderId || !body.orderNumber) {
      return c.json({ code: "MISSING_ORDER", message: "Order ID and number are required" }, 400);
    }

    // Fraud assessment
    const fraudResult = assessFraudRisk({
      ipAddress: getClientIp(c),
      email: body.metadata?.customer_email,
      amount: body.amount,
      currency: body.currency,
      customerId: body.metadata?.customer_id,
      userAgent: c.req.header("user-agent") || "",
    });

    if (fraudResult.autoReject) {
      await createAuditLog({
        actor: "fraud_engine",
        action: "payment.rejected",
        entity_type: "payment_intent",
        meta: `Order ${body.orderNumber}: Fraud score ${fraudResult.score} (${fraudResult.level}) — auto-rejected`,
      });
      return c.json({
        code: "FRAUD_REJECTED",
        message: "This transaction could not be processed.",
        fraudScore: fraudResult.score,
        fraudLevel: fraudResult.level,
      }, 402);
    }

    // Generate idempotency key for duplicate payment protection
    const idempotencyKey = `pi_${body.orderId}_${uuidv4().slice(0, 12)}`;

    const providerInstance = paymentRegistry.getProvider(provider);
    const result = await providerInstance.createPaymentIntent({
      ...body,
      idempotencyKey,
      metadata: {
        ...body.metadata,
        provider,
        created_from: "api",
        fraud_score: String(fraudResult.score),
        fraud_level: fraudResult.level,
      },
    });

    if (!result.success) {
      return c.json({
        code: "PAYMENT_FAILED",
        message: result.error || "Payment intent creation failed",
        errorCode: result.errorCode,
      }, 402);
    }

    // Audit log
    await createAuditLog({
      actor: "system",
      action: "payment.intent.created",
      entity_type: "payment_intent",
      entity_id: result.providerPaymentId,
      meta: `Order: ${body.orderNumber}, Amount: ${body.amount}, Provider: ${provider}`,
    });

    return c.json(result, 201);
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Payment intent creation failed" }, 500);
  }
});

/**
 * POST /payments/intent/:id/confirm — Confirm a payment intent.
 */
payments.post("/intent/:id/confirm", async (c) => {
  try {
    const provider = getProvider(c);
    const intentId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));

    const providerInstance = paymentRegistry.getProvider(provider);

    // If a payment method is provided, create and confirm in one step
    if (body.payment_method) {
      const result = await providerInstance.createPaymentIntent({
        orderId: body.order_id || "",
        orderNumber: body.order_number || "",
        amount: body.amount || 0,
        currency: body.currency || "USD",
        paymentMethod: body.payment_method,
        returnUrl: body.return_url,
        metadata: { provider, confirmed: "true" },
      });
      return c.json(result);
    }

    const result = await providerInstance.confirmPaymentIntent(intentId);
    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Confirmation failed" }, 500);
  }
});

/**
 * POST /payments/intent/:id/capture — Capture an authorized payment.
 */
payments.post("/intent/:id/capture", async (c) => {
  try {
    const provider = getProvider(c);
    const intentId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));

    const providerInstance = paymentRegistry.getProvider(provider);
    const result = await providerInstance.capturePaymentIntent(intentId, body.amount);

    if (result.success) {
      await createAuditLog({
        actor: "system",
        action: "payment.intent.captured",
        entity_type: "payment_intent",
        entity_id: intentId,
        meta: `Captured amount: ${body.amount || "full"}`,
      });
    }

    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Capture failed" }, 500);
  }
});

/**
 * POST /payments/intent/:id/cancel — Cancel/void a payment.
 */
payments.post("/intent/:id/cancel", async (c) => {
  try {
    const provider = getProvider(c);
    const intentId = c.req.param("id");
    const { reason } = await c.req.json().catch(() => ({}));

    const providerInstance = paymentRegistry.getProvider(provider);
    const result = await providerInstance.cancelPaymentIntent(intentId, reason);
    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Cancel failed" }, 500);
  }
});

/**
 * GET /payments/intent/:id — Get payment intent details.
 */
payments.get("/intent/:id", async (c) => {
  try {
    const provider = getProvider(c);
    const intentId = c.req.param("id");

    const providerInstance = paymentRegistry.getProvider(provider);
    const result = await providerInstance.getPaymentIntent(intentId);
    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Retrieval failed" }, 500);
  }
});

/* ================================================================== */
/*  WEBHOOKS                                                          */
/* ================================================================== */

/**
 * POST /webhooks/stripe — Stripe webhook receiver.
 * Stripe sends events to this endpoint after a checkout.
 */
payments.post("/webhooks/stripe", async (c) => {
  try {
    const payload = await c.req.text();
    const signature = c.req.header("stripe-signature") || "";

    // Extract headers for webhook processing
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(c.req.header())) {
      headers[key] = value as string;
    }

    const result = await webhookEngine.processWebhook("stripe", payload, signature, headers);

    // Return 200 to acknowledge receipt (Stripe expects 2xx)
    const statusCode = result.statusCode as any;
    return c.json(
      { received: true, status: result.delivery?.status },
      statusCode,
    );
  } catch (err: any) {
    console.error("[WEBHOOK] Stripe webhook error:", err.message);
    return c.json({ received: true }, 200); // Always return 200 to prevent retry storms
  }
});

/**
 * POST /webhooks/paypal — PayPal webhook receiver.
 * Extracts all 5 PayPal verification headers and passes them to the webhook engine.
 */
payments.post("/webhooks/paypal", async (c) => {
  try {
    const payload = await c.req.text();

    // Extract all 5 PayPal webhook verification headers
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(c.req.header())) {
      headers[key] = value as string;
    }

    // Build a combined signature string from all PayPal headers
    const transmissionId = c.req.header("paypal-transmission-id") || c.req.header("PAYPAL-TRANSMISSION-ID") || "";
    const transmissionTime = c.req.header("paypal-transmission-time") || c.req.header("PAYPAL-TRANSMISSION-TIME") || "";
    const certUrl = c.req.header("paypal-cert-url") || c.req.header("PAYPAL-CERT-URL") || "";
    const authAlgo = c.req.header("paypal-auth-algo") || c.req.header("PAYPAL-AUTH-ALGO") || "";
    const transmissionSig = c.req.header("paypal-transmission-sig") || c.req.header("PAYPAL-TRANSMISSION-SIG") || "";

    // Build signature string (transmission-id used as primary for processWebhook call)
    const signature = transmissionId || transmissionSig || "";

    // Verify using PayPal's dedicated verification module with all headers
    const { verifyPayPalWebhook } = await import("../services/payments/paypal-webhook-verify.js");
    const isVerified = await verifyPayPalWebhook(payload, {
      "paypal-transmission-id": transmissionId,
      "paypal-transmission-time": transmissionTime,
      "paypal-cert-url": certUrl,
      "paypal-auth-algo": authAlgo,
      "paypal-transmission-sig": transmissionSig,
    });

    if (!isVerified) {
      console.warn("[PAYPAL] Webhook signature verification failed");
    }

    const result = await webhookEngine.processWebhook("paypal", payload, signature, headers);
    const statusCode = result.statusCode as any;
    return c.json(
      { received: true, status: result.delivery?.status, signatureVerified: isVerified },
      statusCode,
    );
  } catch (err: any) {
    console.error("[PAYPAL] Webhook error:", err.message);
    return c.json({ received: true }, 200);
  }
});

/**
 * GET /webhooks/deliveries — List recent webhook deliveries.
 */
payments.get("/webhooks/deliveries", async (c) => {
  const limit = Number(c.req.query("limit")) || 50;
  return c.json({ deliveries: webhookEngine.getDeliveries(limit) });
});

/**
 * GET /webhooks/deliveries/:id — Get a specific delivery.
 */
payments.get("/webhooks/deliveries/:id", async (c) => {
  const delivery = webhookEngine.getDelivery(c.req.param("id"));
  if (!delivery) return c.json({ code: "NOT_FOUND", message: "Delivery not found" }, 404);
  return c.json({ delivery });
});

/**
 * GET /webhooks/dead-letter — Get dead letter queue.
 */
payments.get("/webhooks/dead-letter", async (c) => {
  return c.json({ deadLetter: webhookEngine.getDeadLetterQueue() });
});

/**
 * POST /webhooks/dead-letter/:id/retry — Retry a dead letter webhook.
 */
payments.post("/webhooks/dead-letter/:id/retry", async (c) => {
  const ok = await webhookEngine.retryDeadLetter(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Entry not found in dead letter queue" }, 404);
  return c.json({ success: true, message: "Retry queued" });
});

/**
 * GET /webhooks/stats — Webhook statistics.
 */
payments.get("/webhooks/stats", async (c) => {
  return c.json({ stats: webhookEngine.getStats() });
});

/* ================================================================== */
/*  REFUNDS                                                           */
/* ================================================================== */

/**
 * POST /payments/refund — Process a refund (full or partial).
 */
payments.post("/refund", async (c) => {
  try {
    const body = await c.req.json<RefundParams & { provider?: PaymentProviderType }>();
    const provider = body.metadata?.provider as PaymentProviderType || getProvider(c);

    if (!body.providerPaymentId) {
      return c.json({ code: "MISSING_ID", message: "Provider payment ID is required" }, 400);
    }

    const providerInstance = paymentRegistry.getProvider(provider);
    const result = await providerInstance.refund({
      providerPaymentId: body.providerPaymentId,
      amount: body.amount,
      reason: body.reason,
      metadata: body.metadata,
      idempotencyKey: body.idempotencyKey || `ref_${body.providerPaymentId}_${uuidv4().slice(0, 8)}`,
    });

    if (result.success || result.status === "pending") {
      await createAuditLog({
        actor: "admin",
        action: "payment.refund.created",
        entity_type: "refund",
        entity_id: result.providerRefundId,
        meta: `Payment: ${body.providerPaymentId}, Amount: ${result.amount}${body.amount ? ` (partial: ${body.amount})` : " (full)"}`,
      });
    }

    return c.json(result, result.success ? 200 : 400);
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Refund failed" }, 500);
  }
});

/* ================================================================== */
/*  PROVIDER STATUS & CONFIGURATION                                   */
/* ================================================================== */

/**
 * GET /payments/providers — Get status of all payment providers.
 */
payments.get("/providers", async (c) => {
  const providers = paymentRegistry.getAllProviders();
  const health = await paymentRegistry.healthCheckAll();
  return c.json({ providers, health });
});

/**
 * POST /payments/providers/configure — Configure provider credentials.
 */
payments.post("/providers/configure", async (c) => {
  try {
    const body = await c.req.json<{
      stripe?: { publishableKey: string; secretKey: string; webhookSecret: string };
      paypal?: { clientId: string; clientSecret: string; webhookId: string };
    }>();

    // Update credentials
    const current = paymentRegistry.getCredentials();
    if (body.stripe) {
      current.stripe = body.stripe;
    }
    if (body.paypal) {
      current.paypal = body.paypal;
    }
    paymentRegistry.setCredentials(current);

    await createAuditLog({
      actor: "admin",
      action: "payment.providers.configured",
      entity_type: "payment_config",
      meta: `Providers: ${Object.keys(body).join(", ")}`,
    });

    return c.json({ success: true, message: "Providers configured" });
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message || "Configuration failed" }, 500);
  }
});

/**
 * GET /payments/health — Health check for all payment providers.
 */
payments.get("/health", async (c) => {
  const health = await paymentRegistry.healthCheckAll();
  const allHealthy = Object.values(health).every((h) => h.healthy);
  return c.json({
    status: allHealthy ? "healthy" : "degraded",
    providers: health,
  });
});

/* ================================================================== */
/*  FINANCE & RECONCILIATION                                          */
/* ================================================================== */

/**
 * GET /payments/finance/reconciliation — Finance reconciliation data.
 * Calls runReconciliation() to compare provider data vs database.
 */
payments.get("/finance/reconciliation", async (c) => {
  try {
    // Determine period
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7); // Default: last 7 days

    // Run reconciliation
    const result = await runReconciliation(periodStart, periodEnd);

    // Get recent reconciliation history
    const history = await listReconciliations(10);

    return c.json({
      reconciliation: result,
      history,
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      generatedAt: Date.now(),
    });
  } catch (err: any) {
    return c.json({ code: "INTERNAL_ERROR", message: err.message }, 500);
  }
});

export { payments };
