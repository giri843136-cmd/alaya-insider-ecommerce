/**
 * ALAYA INSIDER — Payment Provider Registry
 * --------------------------------------------------------------------------
 * Manages all payment providers (Stripe, PayPal, Apple Pay, Google Pay).
 * Provides credential management, health checks, and provider lookup.
 */

import type { PaymentProvider, PaymentProviderConfig, PaymentProviderType, ProviderCredentials } from "./types.js";

/* ================================================================== */
/*  PROVIDER REGISTRY                                                  */
/* ================================================================== */

class PaymentProviderRegistry {
  private providers: Map<PaymentProviderType, PaymentProvider> = new Map();
  private configs: Map<PaymentProviderType, PaymentProviderConfig> = new Map();
  private credentials: ProviderCredentials = {};

  /**
   * Register a payment provider.
   */
  register(provider: PaymentProvider): void {
    this.providers.set(provider.type, provider);
  }

  /**
   * Get a registered provider by type.
   */
  getProvider(type: PaymentProviderType): PaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Payment provider "${type}" is not registered`);
    }
    return provider;
  }

  /**
   * Configure a provider with its settings.
   */
  configure(type: PaymentProviderType, config: PaymentProviderConfig): void {
    this.configs.set(type, config);
    const provider = this.providers.get(type);
    if (provider) {
      provider.initialize(config);
    }
  }

  /**
   * Get provider configuration.
   */
  getConfig(type: PaymentProviderType): PaymentProviderConfig | undefined {
    return this.configs.get(type);
  }

  /**
   * Store credentials (from integrations center).
   */
  setCredentials(creds: ProviderCredentials): void {
    this.credentials = creds;

    // Auto-configure providers when credentials are set
    if (creds.stripe) {
      this.configure("stripe", {
        type: "stripe",
        enabled: true,
        environment: "live",
        publishableKey: creds.stripe.publishableKey,
        secretKey: creds.stripe.secretKey,
        webhookSecret: creds.stripe.webhookSecret,
      });
    }

    if (creds.paypal) {
      this.configure("paypal", {
        type: "paypal",
        enabled: true,
        environment: "live",
        clientId: creds.paypal.clientId,
        secretKey: creds.paypal.clientSecret,
        webhookSecret: creds.paypal.webhookId,
      });
    }
  }

  /**
   * Get configured credentials (masked for UI).
   */
  getCredentials(): ProviderCredentials {
    return this.credentials;
  }

  /**
   * Get all configured providers that are enabled.
   */
  getActiveProviders(): PaymentProviderType[] {
    const active: PaymentProviderType[] = [];
    for (const [type, config] of this.configs) {
      if (config.enabled) {
        active.push(type);
      }
    }
    return active;
  }

  /**
   * Check if a provider is configured and enabled.
   */
  isProviderActive(type: PaymentProviderType): boolean {
    const config = this.configs.get(type);
    return config?.enabled ?? false;
  }

  /**
   * Run health checks on all configured providers.
   */
  async healthCheckAll(): Promise<Record<PaymentProviderType, { healthy: boolean; message: string }>> {
    const results: Record<PaymentProviderType, { healthy: boolean; message: string }> = {} as any;

    for (const [type, provider] of this.providers) {
      if (this.isProviderActive(type)) {
        try {
          results[type] = await provider.healthCheck();
        } catch (err) {
          results[type] = {
            healthy: false,
            message: err instanceof Error ? err.message : "Health check failed",
          };
        }
      } else {
        results[type] = { healthy: false, message: "Provider not configured" };
      }
    }

    return results;
  }

  /**
   * Get all registered providers (for admin UI).
   */
  getAllProviders(): Array<{ type: PaymentProviderType; configured: boolean; enabled: boolean }> {
    const allTypes: PaymentProviderType[] = ["stripe", "paypal", "apple_pay", "google_pay"];
    return allTypes.map((type) => {
      const config = this.configs.get(type);
      return {
        type,
        configured: !!config,
        enabled: config?.enabled ?? false,
      };
    });
  }
}

// Singleton instance
export const paymentRegistry = new PaymentProviderRegistry();

/* ================================================================== */
/*  CREDENTIAL LOADER                                                  */
/* ================================================================== */

/**
 * Load payment credentials from environment variables or integrations store.
 */
export function loadPaymentCredentials(): ProviderCredentials {
  const credentials: ProviderCredentials = {};

  // Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    credentials.stripe = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    };
  }

  // PayPal
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    credentials.paypal = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      webhookId: process.env.PAYPAL_WEBHOOK_ID || "",
    };
  }

  // Auto-configure if credentials are available
  if (credentials.stripe || credentials.paypal) {
    paymentRegistry.setCredentials(credentials);
  }

  return credentials;
}

/**
 * Initialize all payment providers.
 */
export async function initPaymentProviders(): Promise<void> {
  const { StripeProvider } = await import("./stripe.js");
  const { PayPalProvider } = await import("./paypal.js");
  const { ApplePayProvider, GooglePayProvider } = await import("./wallet.js");

  // Register all providers
  paymentRegistry.register(new StripeProvider());
  paymentRegistry.register(new PayPalProvider());
  paymentRegistry.register(new ApplePayProvider());
  paymentRegistry.register(new GooglePayProvider());

  // Load credentials from env
  loadPaymentCredentials();

  console.log("[PAYMENTS] Payment providers initialized");
}
