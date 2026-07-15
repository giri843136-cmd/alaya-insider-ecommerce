/**
 * ALAYA INSIDER — Feature Flag System (v2.0)
 * ============================================================================
 * Global feature flag system for the enterprise affiliate platform.
 * All flags default to affiliate-only mode (ENABLE_ECOMMERCE = false).
 *
 * Usage:
 *   import { flags } from "../lib/featureFlags";
 *   if (flags.ENABLE_ECOMMERCE) { ... }
 *
 * To enable e-commerce features (not recommended for production):
 *   flags.ENABLE_ECOMMERCE = true;          // runtime override
 *   localStorage.setItem("FF_ECOMMERCE", "true");  // persistent override
 */

export interface FeatureFlags {
  /** Enable legacy e-commerce (cart, checkout, payments, orders) */
  ENABLE_ECOMMERCE: boolean;
  /** Enable merchant comparison tables */
  ENABLE_MERCHANT_COMPARISON: boolean;
  /** Enable geo-routing for affiliate links */
  ENABLE_GEO_ROUTING: boolean;
  /** Enable price intelligence history and charts */
  ENABLE_PRICE_INTELLIGENCE: boolean;
  /** Enable price drop alerts */
  ENABLE_PRICE_ALERTS: boolean;
  /** Enable coupon tracking display */
  ENABLE_COUPON_TRACKING: boolean;
  /** Enable availability tracking */
  ENABLE_AVAILABILITY_TRACKING: boolean;
  /** Enable merchant health scoring */
  ENABLE_MERCHANT_HEALTH: boolean;
  /** Enable editorial AI content */
  ENABLE_AI_CONTENT: boolean;
  /** Enable affiliate analytics dashboard */
  ENABLE_AFFILIATE_ANALYTICS: boolean;
  /** Enable performance monitoring (Lighthouse) */
  ENABLE_PERFORMANCE_MONITORING: boolean;
}

const DEFAULTS: FeatureFlags = {
  ENABLE_ECOMMERCE: false,
  ENABLE_MERCHANT_COMPARISON: true,
  ENABLE_GEO_ROUTING: true,
  ENABLE_PRICE_INTELLIGENCE: true,
  ENABLE_PRICE_ALERTS: true,
  ENABLE_COUPON_TRACKING: true,
  ENABLE_AVAILABILITY_TRACKING: true,
  ENABLE_MERCHANT_HEALTH: true,
  ENABLE_AI_CONTENT: true,
  ENABLE_AFFILIATE_ANALYTICS: true,
  ENABLE_PERFORMANCE_MONITORING: true,
};

function loadFlags(): FeatureFlags {
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ALAYA_FEATURE_FLAGS") : null;
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveFlags(flags: FeatureFlags) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("ALAYA_FEATURE_FLAGS", JSON.stringify(flags));
    }
  } catch { /* ignore */ }
}

class FlagsManager {
  private _flags: FeatureFlags;

  constructor() {
    this._flags = loadFlags();
  }

  get flags(): Readonly<FeatureFlags> {
    return this._flags;
  }

  get ENABLE_ECOMMERCE() { return this._flags.ENABLE_ECOMMERCE; }
  get ENABLE_MERCHANT_COMPARISON() { return this._flags.ENABLE_MERCHANT_COMPARISON; }
  get ENABLE_GEO_ROUTING() { return this._flags.ENABLE_GEO_ROUTING; }
  get ENABLE_PRICE_INTELLIGENCE() { return this._flags.ENABLE_PRICE_INTELLIGENCE; }
  get ENABLE_PRICE_ALERTS() { return this._flags.ENABLE_PRICE_ALERTS; }
  get ENABLE_COUPON_TRACKING() { return this._flags.ENABLE_COUPON_TRACKING; }
  get ENABLE_AVAILABILITY_TRACKING() { return this._flags.ENABLE_AVAILABILITY_TRACKING; }
  get ENABLE_MERCHANT_HEALTH() { return this._flags.ENABLE_MERCHANT_HEALTH; }
  get ENABLE_AI_CONTENT() { return this._flags.ENABLE_AI_CONTENT; }
  get ENABLE_AFFILIATE_ANALYTICS() { return this._flags.ENABLE_AFFILIATE_ANALYTICS; }
  get ENABLE_PERFORMANCE_MONITORING() { return this._flags.ENABLE_PERFORMANCE_MONITORING; }

  set<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) {
    this._flags[key] = value;
    saveFlags(this._flags);
  }
}

export const flags = new FlagsManager();

/**
 * Hook to check if affiliate-only mode is active.
 * When false, all e-commerce features (cart, checkout, payments) are hidden.
 */
export function isAffiliateOnly(): boolean {
  return !flags.ENABLE_ECOMMERCE;
}

/**
 * Check if a product should show "Buy" buttons or "View on Merchant" links.
 * Affiliate products always redirect to merchant. Non-affiliate products
 * only show direct purchase if e-commerce is enabled.
 */
export function shouldShowDirectPurchase(product?: { affiliate?: boolean }): boolean {
  if (product?.affiliate) return false;
  return flags.ENABLE_ECOMMERCE;
}
