/**
 * ALAYA INSIDER — Payment Domain Types
 * --------------------------------------------------------------------------
 * All payment-related types used across the platform.
 * Providers implement the PaymentProvider interface.
 */

import type Stripe from "stripe";

/* ================================================================== */
/*  PAYMENT STATES                                                     */
/* ================================================================== */

export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "captured"
  | "paid"
  | "partially_paid"
  | "refund_pending"
  | "refunded"
  | "partially_refunded"
  | "chargeback"
  | "disputed"
  | "failed"
  | "cancelled"
  | "expired";

export type RefundStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled";

export type DisputeStatus =
  | "warning_needs_response"
  | "warning_under_review"
  | "warning_closed"
  | "needs_response"
  | "under_review"
  | "won"
  | "lost";

/* ================================================================== */
/*  PAYMENT PROVIDER TYPES                                             */
/* ================================================================== */

export type PaymentProviderType = "stripe" | "paypal" | "apple_pay" | "google_pay";

export interface PaymentProviderConfig {
  type: PaymentProviderType;
  enabled: boolean;
  environment: "test" | "live";
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  clientId?: string; // PayPal
}

/* ================================================================== */
/*  PAYMENT INTENT                                                     */
/* ================================================================== */

export interface PaymentIntent {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: PaymentProviderType;
  providerPaymentId: string; // Stripe pi_xxx or PayPal order ID
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string; // For frontend confirmation
  metadata: Record<string, string>;
  idempotencyKey?: string;
  authorizedAt?: number;
  capturedAt?: number;
  paidAt?: number;
  failedAt?: number;
  failureReason?: string;
  refundedAmount: number;
  processorFees: number;
  netAmount: number;
  paymentMethodType?: string;
  paymentMethodDetails?: Record<string, unknown>;
  billingDetails?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  createdAt: number;
  updatedAt: number;
}

/* ================================================================== */
/*  TRANSACTION                                                       */
/* ================================================================== */

export interface PaymentTransaction {
  id: string;
  paymentIntentId: string;
  orderId: string;
  orderNumber: string;
  provider: PaymentProviderType;
  providerTransactionId: string;
  type: "authorization" | "capture" | "sale" | "refund" | "chargeback" | "fee";
  amount: number;
  currency: string;
  status: PaymentStatus;
  processorResponse?: string;
  processorFee?: number;
  netAmount?: number;
  description?: string;
  metadata: Record<string, string>;
  createdAt: number;
}

/* ================================================================== */
/*  WEBHOOK EVENT                                                      */
/* ================================================================== */

export interface WebhookEvent {
  id: string;
  provider: PaymentProviderType;
  providerEventId: string;
  type: string;
  status: "received" | "processing" | "processed" | "failed" | "replayed";
  payload: unknown;
  signatureValid: boolean;
  idempotent: boolean;
  processedAt?: number;
  failureReason?: string;
  retryCount: number;
  createdAt: number;
}

/* ================================================================== */
/*  PAYMENT PROVIDER INTERFACE                                         */
/* ================================================================== */

export interface PaymentProvider {
  /** Provider type identifier */
  readonly type: PaymentProviderType;

  /** Initialize the provider with config */
  initialize(config: PaymentProviderConfig): void;

  /** Create a payment intent for an order */
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;

  /** Confirm a payment intent (for server-side confirmation) */
  confirmPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult>;

  /** Capture an authorized payment */
  capturePaymentIntent(providerPaymentId: string, amount?: number): Promise<PaymentIntentResult>;

  /** Cancel / void a payment */
  cancelPaymentIntent(providerPaymentId: string, reason?: string): Promise<PaymentIntentResult>;

  /** Process a refund (full or partial) */
  refund(params: RefundParams): Promise<RefundResult>;

  /** Get payment intent status from provider */
  getPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult>;

  /** Process an incoming webhook event */
  processWebhook(payload: unknown, signature: string): Promise<WebhookProcessResult>;

  /** Verify webhook signature */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<boolean>;

  /** Health check - verify provider credentials are valid */
  healthCheck(): Promise<{ healthy: boolean; message: string }>;
}

/* ================================================================== */
/*  PARAMETER TYPES                                                    */
/* ================================================================== */

export interface CreatePaymentIntentParams {
  orderId: string;
  orderNumber: string;
  amount: number; // In cents for Stripe, dollars for PayPal
  currency: string;
  customerEmail?: string;
  customerName?: string;
  billingDetails?: PaymentIntent["billingDetails"];
  metadata?: Record<string, string>;
  idempotencyKey?: string;
  description?: string;
  /** For Apple Pay / Google Pay - the payment method token */
  paymentMethod?: string;
  /** Return URL for redirect-based payments (PayPal, some cards) */
  returnUrl?: string;
  /** Cancel URL for redirect-based payments */
  cancelUrl?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  clientSecret?: string;
  requiresAction?: boolean;
  nextAction?: {
    type: "redirect" | "3ds" | "otp";
    url?: string;
    data?: Record<string, unknown>;
  };
  providerPaymentId?: string;
  error?: string;
  errorCode?: string;
}

export interface RefundParams {
  providerPaymentId: string;
  amount?: number; // Partial refund: amount in cents/dollars
  reason?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  providerRefundId?: string;
  amount: number;
  status: RefundStatus;
  error?: string;
}

export interface WebhookProcessResult {
  success: boolean;
  eventType?: string;
  paymentIntentId?: string;
  orderId?: string;
  action?: string;
  error?: string;
}

/* ================================================================== */
/*  PROVIDER CONFIG STORAGE                                            */
/* ================================================================== */

export interface ProviderCredentials {
  stripe?: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    webhookId: string;
  };
}

/* ================================================================== */
/*  IDEMPOTENCY                                                        */
/* ================================================================== */

export interface IdempotencyRecord {
  key: string;
  result: unknown;
  expiresAt: number;
  createdAt: number;
}
