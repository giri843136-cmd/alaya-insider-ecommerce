/**
 * ALAYA INSIDER — Stripe Payment Provider
 * --------------------------------------------------------------------------
 * Production-ready Stripe integration with:
 *  - Payment Intents API with automatic payment methods
 *  - Webhook processing with signature validation
 *  - Full/partial refunds
 *  - Dispute/chargeback management
 *  - Apple Pay & Google Pay via Payment Request
 *  - Idempotency for duplicate payment protection
 *  - Comprehensive error handling
 */

import Stripe from "stripe";
import type {
  PaymentProvider,
  PaymentProviderConfig,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  RefundParams,
  RefundResult,
  WebhookProcessResult,
} from "./types.js";
import type { PaymentProviderType, PaymentIntent } from "./types.js";
import { v4 as uuidv4 } from "uuid";

/* ================================================================== */
/*  STRIPE PROVIDER                                                    */
/* ================================================================== */

export class StripeProvider implements PaymentProvider {
  readonly type: PaymentProviderType = "stripe";
  private client: Stripe | null = null;
  private config: PaymentProviderConfig | null = null;

  /* ============================================================== */
  /*  INITIALIZE                                                     */
  /* ============================================================== */

  initialize(config: PaymentProviderConfig): void {
    this.config = config;
    if (config.secretKey) {
      this.client = new Stripe(config.secretKey, {
        apiVersion: undefined as any,
        typescript: true,
        maxNetworkRetries: 3,
        appInfo: {
          name: "ALAYA INSIDER",
          version: "1.0.0",
        },
      });
    }
  }

  /* ============================================================== */
  /*  CREATE PAYMENT INTENT                                          */
  /* ============================================================== */

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    if (!this.client) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const paymentMethodTypes = this.resolvePaymentMethods(params);

      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(params.amount), // Already in cents
        currency: params.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_id: params.orderId,
          order_number: params.orderNumber,
          ...params.metadata,
        },
        description: params.description || `Order ${params.orderNumber}`,
      };

      // Add billing details if provided
      if (params.billingDetails) {
        intentParams.receipt_email = params.billingDetails.email;
      }

      // Add customer email for receipt
      if (params.customerEmail) {
        intentParams.receipt_email = params.customerEmail;
      }

      // Add return URL for redirect-based payment methods
      if (params.returnUrl) {
        intentParams.return_url = params.returnUrl;
      }

      // If a payment method is provided (for Apple Pay / Google Pay)
      if (params.paymentMethod) {
        intentParams.payment_method = params.paymentMethod;
        intentParams.confirm = true;
        intentParams.return_url = params.returnUrl || "https://alayainsider.com/checkout/complete";
      }

      // Set idempotency key for duplicate payment protection
      const idempotencyKey = params.idempotencyKey || `pi_${params.orderId}_${uuidv4().slice(0, 8)}`;

      const intent = await this.client.paymentIntents.create(intentParams, {
        idempotencyKey,
      });

      return this.mapIntentResult(intent);
    } catch (err) {
      return this.handleError(err);
    }
  }

  /* ============================================================== */
  /*  CONFIRM PAYMENT INTENT                                        */
  /* ============================================================== */

  async confirmPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult> {
    if (!this.client) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const intent = await this.client.paymentIntents.confirm(providerPaymentId);
      return this.mapIntentResult(intent);
    } catch (err) {
      return this.handleError(err);
    }
  }

  /* ============================================================== */
  /*  CAPTURE PAYMENT INTENT                                        */
  /* ============================================================== */

  async capturePaymentIntent(providerPaymentId: string, amount?: number): Promise<PaymentIntentResult> {
    if (!this.client) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const params: Stripe.PaymentIntentCaptureParams = {};
      if (amount) {
        params.amount_to_capture = Math.round(amount);
      }

      const intent = await this.client.paymentIntents.capture(providerPaymentId, params);
      return this.mapIntentResult(intent);
    } catch (err) {
      return this.handleError(err);
    }
  }

  /* ============================================================== */
  /*  CANCEL PAYMENT INTENT                                         */
  /* ============================================================== */

  async cancelPaymentIntent(providerPaymentId: string, reason?: string): Promise<PaymentIntentResult> {
    if (!this.client) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const params: Stripe.PaymentIntentCancelParams = {};
      if (reason) {
        params.cancellation_reason = reason as Stripe.PaymentIntentCancelParams.CancellationReason;
      }

      const intent = await this.client.paymentIntents.cancel(providerPaymentId, params);
      return this.mapIntentResult(intent);
    } catch (err) {
      return this.handleError(err);
    }
  }

  /* ============================================================== */
  /*  REFUND                                                        */
  /* ============================================================== */

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!this.client) {
      return { success: false, amount: 0, status: "failed", error: "Stripe not initialized" };
    }

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.providerPaymentId,
        reason: params.reason as Stripe.RefundCreateParams.Reason || undefined,
        metadata: params.metadata,
      };

      if (params.amount) {
        refundParams.amount = Math.round(params.amount);
      }

      const idempotencyKey = params.idempotencyKey || `ref_${params.providerPaymentId}_${uuidv4().slice(0, 8)}`;

      const refund = await this.client.refunds.create(refundParams, {
        idempotencyKey,
      });

      return {
        success: refund.status === "succeeded",
        providerRefundId: refund.id,
        amount: refund.amount,
        status: refund.status === "succeeded" ? "succeeded" : refund.status === "pending" ? "pending" : "failed",
        error: refund.failure_reason || undefined,
      };
    } catch (err) {
      const message = err instanceof Stripe.errors.StripeError ? err.message : "Refund failed";
      return { success: false, amount: params.amount || 0, status: "failed", error: message };
    }
  }

  /* ============================================================== */
  /*  GET PAYMENT INTENT                                            */
  /* ============================================================== */

  async getPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult> {
    if (!this.client) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const intent = await this.client.paymentIntents.retrieve(providerPaymentId);
      return this.mapIntentResult(intent);
    } catch (err) {
      return this.handleError(err);
    }
  }

  /* ============================================================== */
  /*  PROCESS WEBHOOK                                               */
  /* ============================================================== */

  async processWebhook(payload: unknown, signature: string): Promise<WebhookProcessResult> {
    if (!this.client) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const webhookSecret = this.config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return { success: false, error: "Webhook secret not configured" };
      }

      const event = this.client.webhooks.constructEvent(
        payload as string | Buffer,
        signature,
        webhookSecret,
      );

      return this.handleWebhookEvent(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook processing failed";
      return { success: false, error: message };
    }
  }

  /* ============================================================== */
  /*  VERIFY WEBHOOK SIGNATURE                                      */
  /* ============================================================== */

  async verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const webhookSecret = this.config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return false;

      this.client.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  /* ============================================================== */
  /*  HEALTH CHECK                                                  */
  /* ============================================================== */

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.client) {
      return { healthy: false, message: "Stripe client not initialized" };
    }

    try {
      // Fetch balance as a lightweight health check
      await this.client.balance.retrieve();
      return { healthy: true, message: "Stripe API is reachable" };
    } catch (err) {
      return {
        healthy: false,
        message: err instanceof Error ? err.message : "Stripe health check failed",
      };
    }
  }

  /* ============================================================== */
  /*  WEBHOOK EVENT HANDLER                                         */
  /* ============================================================== */

  private async handleWebhookEvent(event: Stripe.Event): Promise<WebhookProcessResult> {
    const baseResult = {
      success: true,
      eventType: event.type,
    };

    switch (event.type) {
      // ── Payment Intents ──
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          ...baseResult,
          paymentIntentId: intent.id,
          orderId: intent.metadata?.order_id,
          action: "payment.succeeded",
        };
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          ...baseResult,
          paymentIntentId: intent.id,
          orderId: intent.metadata?.order_id,
          action: "payment.failed",
        };
      }

      case "payment_intent.amount_capturable_updated": {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          ...baseResult,
          paymentIntentId: intent.id,
          orderId: intent.metadata?.order_id,
          action: "payment.authorized",
        };
      }

      // ── Charges ──
      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        return {
          ...baseResult,
          paymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id,
          action: "charge.succeeded",
        };
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        return {
          ...baseResult,
          paymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id,
          action: "charge.refunded",
        };
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeObj = dispute.charge as any;
        const piId = typeof chargeObj === "string" ? chargeObj : chargeObj?.payment_intent;
        return {
          ...baseResult,
          paymentIntentId: typeof piId === "string" ? piId : piId?.id,
          action: "dispute.created",
        };
      }

      // ── Disputes ──
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        return {
          ...baseResult,
          action: `dispute.${dispute.status}`,
        };
      }

      // ── Refunds ──
      case "charge.refund.updated": {
        return {
          ...baseResult,
          action: "refund.updated",
        };
      }

      // ── Checkout Sessions ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          ...baseResult,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          orderId: session.metadata?.order_id,
          action: "checkout.completed",
        };
      }

      // ── Payment Methods ──
      case "payment_method.attached":
        return { ...baseResult, action: "payment_method.attached" };

      default:
        return { ...baseResult, action: event.type };
    }
  }

  /* ============================================================== */
  /*  MAP STRIPE INTENT TO RESULT                                   */
  /* ============================================================== */

  private mapIntentResult(intent: Stripe.PaymentIntent): PaymentIntentResult {
    const status = this.mapStatus(intent.status);
    const requiresAction = intent.status === "requires_action" || intent.status === "requires_confirmation";

    const result: PaymentIntentResult = {
      success: status === "paid" || status === "authorized" || status === "captured",
      clientSecret: intent.client_secret || undefined,
      providerPaymentId: intent.id,
      requiresAction,
      paymentIntent: {
        id: `pi_${intent.id}`,
        orderId: intent.metadata?.order_id || "",
        orderNumber: intent.metadata?.order_number || "",
        provider: "stripe",
        providerPaymentId: intent.id,
        amount: intent.amount,
        currency: intent.currency.toUpperCase(),
        status,
        clientSecret: intent.client_secret || undefined,
        metadata: intent.metadata || {},
        idempotencyKey: undefined,
        refundedAmount: intent.amount_received > 0 ? intent.amount - intent.amount_received : 0,
        processorFees: 0,
        netAmount: 0,
        paymentMethodType: intent.payment_method_types?.[0],
        createdAt: intent.created * 1000,
        updatedAt: Date.now(),
      },
    };

    // Add next action for 3D Secure / redirects
    if (requiresAction && intent.next_action) {
      result.nextAction = {
        type: intent.next_action.type === "redirect_to_url" ? "redirect" : "3ds",
        url: intent.next_action.redirect_to_url?.url || undefined,
        data: intent.next_action as unknown as Record<string, unknown>,
      };
    }

    return result;
  }

  /* ============================================================== */
  /*  MAP STATUS                                                     */
  /* ============================================================== */

  private mapStatus(stripeStatus: string): PaymentIntent["status"] {
    switch (stripeStatus) {
      case "requires_payment_method": return "pending";
      case "requires_confirmation": return "requires_action";
      case "requires_action": return "requires_action";
      case "processing": return "pending";
      case "succeeded": return "paid";
      case "canceled": return "cancelled";
      default: return "pending";
    }
  }

  /* ============================================================== */
  /*  RESOLVE PAYMENT METHODS                                       */
  /* ============================================================== */

  private resolvePaymentMethods(params: CreatePaymentIntentParams): string[] {
    const methods = ["card"]; // Card is always available

    // Apple Pay is available via card with payment_method_data
    // Google Pay is available via card with payment_method_data
    // We use automatic_payment_methods: { enabled: true } instead

    return methods;
  }

  /* ============================================================== */
  /*  ERROR HANDLER                                                  */
  /* ============================================================== */

  private handleError(err: unknown): PaymentIntentResult {
    if (err instanceof Stripe.errors.StripeCardError) {
      return {
        success: false,
        error: err.message,
        errorCode: "card_error",
        requiresAction: err.code === "authentication_required",
        nextAction: err.code === "authentication_required"
          ? { type: "3ds", data: { error_code: err.code } }
          : undefined,
      };
    }

    if (err instanceof Stripe.errors.StripeRateLimitError) {
      return { success: false, error: "Rate limit exceeded. Please try again.", errorCode: "rate_limit" };
    }

    if (err instanceof Stripe.errors.StripeInvalidRequestError) {
      return { success: false, error: err.message, errorCode: "invalid_request" };
    }

    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      return { success: false, error: "Authentication failed. Check API keys.", errorCode: "auth_error" };
    }

    if (err instanceof Stripe.errors.StripeAPIError) {
      return { success: false, error: "Stripe API error. Please try again.", errorCode: "api_error" };
    }

    const message = err instanceof Error ? err.message : "Unknown payment error";
    return { success: false, error: message, errorCode: "unknown" };
  }
}
