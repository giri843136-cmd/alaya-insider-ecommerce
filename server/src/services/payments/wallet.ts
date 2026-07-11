/**
 * ALAYA INSIDER — Apple Pay & Google Pay (Wallet) Provider
 * --------------------------------------------------------------------------
 * Apple Pay and Google Pay are processed through Stripe's Payment Request API
 * or Stripe Elements. These providers delegate to the Stripe provider
 * with wallet-specific configuration.
 *
 * Apple Pay requires:
 *  - Verified domain in Stripe Dashboard
 *  - Apple Merchant ID
 *  - `.well-known/apple-developer-merchantid-domain-association` file
 *
 * Google Pay requires:
 *  - Google Pay Merchant ID (optional - Stripe handles this)
 */

import type {
  PaymentProvider,
  PaymentProviderConfig,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  RefundParams,
  RefundResult,
  WebhookProcessResult,
} from "./types.js";
import type { PaymentProviderType } from "./types.js";
import { paymentRegistry } from "./registry.js";

/* ================================================================== */
/*  APPLE PAY PROVIDER                                                 */
/* ================================================================== */

export class ApplePayProvider implements PaymentProvider {
  readonly type: PaymentProviderType = "apple_pay";
  private config: PaymentProviderConfig | null = null;

  initialize(config: PaymentProviderConfig): void {
    this.config = config;
    // Apple Pay requires the Stripe provider to be initialized
    const stripeConfig = paymentRegistry.getConfig("stripe");
    if (stripeConfig) {
      paymentRegistry.configure("stripe", stripeConfig);
    }
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    try {
      const stripeProvider = paymentRegistry.getProvider("stripe");

      // Add Apple Pay specific metadata
      const appleParams: CreatePaymentIntentParams = {
        ...params,
        metadata: {
          ...params.metadata,
          payment_method_type: "apple_pay",
        },
      };

      return stripeProvider.createPaymentIntent(appleParams);
    } catch (err: any) {
      return { success: false, error: err.message || "Apple Pay processing failed" };
    }
  }

  async confirmPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").confirmPaymentIntent(providerPaymentId);
  }

  async capturePaymentIntent(providerPaymentId: string, amount?: number): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").capturePaymentIntent(providerPaymentId, amount);
  }

  async cancelPaymentIntent(providerPaymentId: string, reason?: string): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").cancelPaymentIntent(providerPaymentId, reason);
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    return paymentRegistry.getProvider("stripe").refund(params);
  }

  async getPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").getPaymentIntent(providerPaymentId);
  }

  async processWebhook(payload: unknown, signature: string): Promise<WebhookProcessResult> {
    return paymentRegistry.getProvider("stripe").processWebhook(payload, signature);
  }

  async verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<boolean> {
    return paymentRegistry.getProvider("stripe").verifyWebhookSignature(payload, signature);
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return {
      healthy: paymentRegistry.isProviderActive("stripe"),
      message: paymentRegistry.isProviderActive("stripe")
        ? "Apple Pay available via Stripe"
        : "Apple Pay requires Stripe to be configured",
    };
  }
}

/* ================================================================== */
/*  GOOGLE PAY PROVIDER                                                */
/* ================================================================== */

export class GooglePayProvider implements PaymentProvider {
  readonly type: PaymentProviderType = "google_pay";
  private config: PaymentProviderConfig | null = null;

  initialize(config: PaymentProviderConfig): void {
    this.config = config;
    const stripeConfig = paymentRegistry.getConfig("stripe");
    if (stripeConfig) {
      paymentRegistry.configure("stripe", stripeConfig);
    }
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    try {
      const stripeProvider = paymentRegistry.getProvider("stripe");

      const googleParams: CreatePaymentIntentParams = {
        ...params,
        metadata: {
          ...params.metadata,
          payment_method_type: "google_pay",
        },
      };

      // For Google Pay, the payment method token comes from the frontend
      // We pass it through as the payment_method parameter
      if (params.paymentMethod) {
        googleParams.paymentMethod = params.paymentMethod;
      }

      return stripeProvider.createPaymentIntent(googleParams);
    } catch (err: any) {
      return { success: false, error: err.message || "Google Pay processing failed" };
    }
  }

  async confirmPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").confirmPaymentIntent(providerPaymentId);
  }

  async capturePaymentIntent(providerPaymentId: string, amount?: number): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").capturePaymentIntent(providerPaymentId, amount);
  }

  async cancelPaymentIntent(providerPaymentId: string, reason?: string): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").cancelPaymentIntent(providerPaymentId, reason);
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    return paymentRegistry.getProvider("stripe").refund(params);
  }

  async getPaymentIntent(providerPaymentId: string): Promise<PaymentIntentResult> {
    return paymentRegistry.getProvider("stripe").getPaymentIntent(providerPaymentId);
  }

  async processWebhook(payload: unknown, signature: string): Promise<WebhookProcessResult> {
    return paymentRegistry.getProvider("stripe").processWebhook(payload, signature);
  }

  async verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<boolean> {
    return paymentRegistry.getProvider("stripe").verifyWebhookSignature(payload, signature);
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return {
      healthy: paymentRegistry.isProviderActive("stripe"),
      message: paymentRegistry.isProviderActive("stripe")
        ? "Google Pay available via Stripe"
        : "Google Pay requires Stripe to be configured",
    };
  }
}
