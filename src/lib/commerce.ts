/**
 * ALAYA INSIDER — Enterprise Commerce Engine (PART 2.10)
 * ------------------------------------------------------------------
 * Central commerce orchestration layer powering all shopping operations.
 * Sits atop Parts 2.1–2.9 and integrates with every existing subsystem.
 *
 * Modules:
 *  1. Checkout Pipeline Engine    — multi-step checkout, validation, order creation
 *  2. Pricing & Promotions Engine  — dynamic pricing, promotions, coupons, tiered pricing
 *  3. Fulfillment Engine           — order routing, supplier assignment, shipping, tracking
 *  4. Tax Engine                   — jurisdiction tax calculation, exempt products
 *  5. Payment Orchestrator         — payment routing, transactions, refunds, partial captures
 *  6. Cart Engine                  — cart validation, pricing, shipping estimates
 *  7. Gift Card & Store Credit     — gift card lifecycle, store credit, loyalty redemption
 *  8. Subscription Engine          — recurring orders, plans, billing cycles
 *  9. Multi-Currency Engine        — conversion, formatting, localization
 * 10. Returns & Refunds Engine     — policy evaluation, refund calculation, restocking
 */
import { uid } from "./utils";
import { pushLog } from "./devops";
import { writeAuditEntry } from "./observability";
import type {
  Order, CartLine, Product, Coupon, Customer,
  Supplier, ReturnRequest, ReturnType,
} from "./types";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const COMMERCE_ENGINE_KEY = "alaya_commerce_engine_store";
export const MAX_CHECKOUT_STEPS = 6;
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;
export const DEFAULT_FLAT_RATE = 12;
export const DEFAULT_TAX_RATE = 0.08;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type CheckoutStep =
  | "cart" | "information" | "shipping" | "payment" | "review" | "confirmation";

export type PromotionType =
  | "percentage_off" | "fixed_amount" | "buy_x_get_y" | "free_shipping"
  | "tiered_pricing" | "bundle_discount" | "volume_discount" | "loyalty_reward";

export type ShippingMethod = "standard" | "express" | "overnight" | "pickup";
export type FulfillmentStatus = "unfulfilled" | "processing" | "partially_shipped" | "shipped" | "delivered";
export type PaymentStatus = "pending" | "authorized" | "captured" | "partially_refunded" | "refunded" | "failed";
export type SubscriptionInterval = "weekly" | "monthly" | "quarterly" | "biannual" | "annual";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired" | "trial";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "AUD" | "CAD" | "JPY" | "SGD";

/* ================================================================== */
/*  INTERFACES — Checkout Pipeline                                     */
/* ================================================================== */

export interface CheckoutSession {
  id: string;
  orderId?: string;
  cartId: string;
  step: CheckoutStep;
  customer: CheckoutCustomer;
  shipping: CheckoutShipping;
  payment: CheckoutPayment;
  review: CheckoutReview;
  metadata: Record<string, string>;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CheckoutCustomer {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  company?: string;
  notes?: string;
  marketingOptIn: boolean;
  createAccount: boolean;
}

export interface CheckoutShipping {
  address: CheckoutAddress;
  method: ShippingMethod;
  estimatedDays: number;
  cost: number;
  trackingNumber?: string;
  carrier?: string;
}

export interface CheckoutPayment {
  method: string;
  gatewayId: string;
  transactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  billingAddress: CheckoutAddress;
  saveForFuture: boolean;
}

export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface CheckoutReview {
  subtotal: number;
  discount: number;
  discountLabel?: string;
  shipping: number;
  tax: number;
  total: number;
  currency: CurrencyCode;
  itemsCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

/* ================================================================== */
/*  INTERFACES — Pricing & Promotions                                  */
/* ================================================================== */

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: PromotionType;
  value: number;
  conditions: PromotionCondition[];
  stackable: boolean;
  priority: number;
  active: boolean;
  startsAt?: number;
  endsAt?: number;
  usageLimit?: number;
  usedCount: number;
  applicableProducts: string[];
  applicableCategories: string[];
  applicableBrands: string[];
  excludedProducts: string[];
  minSpend: number;
  maxSpend?: number;
  minQuantity: number;
  maxQuantity?: number;
  createdAt: number;
}

export interface PromotionCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between";
  value: string | number | string[];
}

export interface PricingContext {
  product: Product;
  quantity: number;
  customerId?: string;
  customerGroup?: string;
  couponCode?: string;
  cartTotal?: number;
  currency: CurrencyCode;
}

export interface PriceBreakdown {
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  quantity: number;
  lineTotal: number;
  discountAmount: number;
  discountLabel: string;
  promotionsApplied: string[];
  tier: string;
}

export interface TieredPricingTier {
  id: string;
  name: string;
  minQuantity: number;
  discountPercent: number;
  customerGroups: string[];
}

export interface BundleDefinition {
  id: string;
  name: string;
  description: string;
  products: { productId: string; quantity: number; discountPercent: number }[];
  totalDiscountPercent: number;
  active: boolean;
  startsAt?: number;
  endsAt?: number;
}

export interface VolumeDiscountRule {
  id: string;
  name: string;
  tiers: { minQty: number; discountPercent: number }[];
  applicableProducts: string[];
  applicableCategories: string[];
  active: boolean;
}

/* ================================================================== */
/*  INTERFACES — Fulfillment Engine                                    */
/* ================================================================== */

export interface FulfillmentOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  status: FulfillmentStatus;
  items: FulfillmentLine[];
  supplierId?: string;
  supplierName?: string;
  shippingMethod: ShippingMethod;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: number;
  actualDelivery?: number;
  shippedAt?: number;
  deliveredAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FulfillmentLine {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  fulfilled: number;
}

export interface ShippingRate {
  method: ShippingMethod;
  label: string;
  cost: number;
  estimatedDays: number;
  carrier: string;
  description: string;
  available: boolean;
}

export interface SupplierAssignment {
  supplierId: string;
  supplierName: string;
  items: { productId: string; quantity: number }[];
  score: number;
  estimatedHandlingDays: number;
}

export interface TrackingEvent {
  id: string;
  fulfillmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: number;
}

/* ================================================================== */
/*  INTERFACES — Tax Engine                                            */
/* ================================================================== */

export interface TaxRule {
  id: string;
  name: string;
  country: string;
  state?: string;
  rate: number;
  type: "percentage" | "fixed";
  appliesTo: ("product" | "shipping" | "digital")[];
  exemptCategories: string[];
  exemptProducts: string[];
  thresholdAmount?: number;
  active: boolean;
  priority: number;
  createdAt: number;
}

export interface TaxBreakdown {
  jurisdiction: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  type: string;
}

export interface TaxCalculation {
  totalTax: number;
  breakdown: TaxBreakdown[];
  appliedRules: string[];
  currency: CurrencyCode;
}

/* ================================================================== */
/*  INTERFACES — Payment Orchestrator                                  */
/* ================================================================== */

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  gatewayId: string;
  gatewayName: string;
  type: "authorization" | "capture" | "sale" | "refund" | "void";
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata: Record<string, string>;
  createdAt: number;
  processedAt?: number;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  available: boolean;
  countries: string[];
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  estimatedTime: string;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  reason: string;
  items: { productId: string; quantity: number; amount: number }[];
  status: "pending" | "approved" | "processing" | "completed" | "rejected";
  createdAt: number;
  completedAt?: number;
}

/* ================================================================== */
/*  INTERFACES — Gift Card & Store Credit                              */
/* ================================================================== */

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  balance: number;
  currency: CurrencyCode;
  senderEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  designTemplate: string;
  active: boolean;
  expiresAt?: number | null;
  createdAt: number;
  usedTransactions: { orderId: string; amount: number; at: number }[];
}

export interface StoreCreditAccount {
  id: string;
  customerId: string;
  customerName: string;
  balance: number;
  currency: CurrencyCode;
  lifetimeCredited: number;
  lifetimeDebited: number;
  transactions: StoreCreditTransaction[];
  createdAt: number;
  updatedAt: number;
}

export interface StoreCreditTransaction {
  id: string;
  type: "credit" | "debit" | "expiry";
  amount: number;
  balance: number;
  reason: string;
  orderId?: string;
  referenceId?: string;
  createdAt: number;
}

export interface LoyaltyPointsAccount {
  id: string;
  customerId: string;
  customerName: string;
  points: number;
  lifetimePoints: number;
  tier: string;
  tierProgress: number;
  nextTierPoints: number;
  transactions: LoyaltyTransaction[];
  createdAt: number;
  updatedAt: number;
}

export interface LoyaltyTransaction {
  id: string;
  type: "earn" | "redeem" | "bonus" | "expiry" | "adjustment";
  points: number;
  balance: number;
  reason: string;
  orderId?: string;
  rate: number;
  createdAt: number;
}

/* ================================================================== */
/*  INTERFACES — Subscription Engine                                   */
/* ================================================================== */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  productId: string;
  interval: SubscriptionInterval;
  intervalCount: number;
  price: number;
  trialDays: number;
  setupFee: number;
  maxBillingCycles?: number;
  cancelAtPeriodEnd?: boolean;
  active: boolean;
  createdAt: number;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  customerId: string;
  customerEmail: string;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialEnd?: number;
  cancelledAt?: number;
  pauseResumesAt?: number;
  billingCycles: number;
  lastOrderId?: string;
  nextOrderDate?: number;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionOrder {
  id: string;
  subscriptionId: string;
  orderId: string;
  orderNumber: string;
  periodStart: number;
  periodEnd: number;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
}

/* ================================================================== */
/*  INTERFACES — Multi-Currency Engine                                 */
/* ================================================================== */

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number;
  decimals: number;
  format: string;
  symbolPosition: "before" | "after";
  thousandSeparator: string;
  decimalSeparator: string;
  active: boolean;
  isDefault: boolean;
}

export interface CurrencyConversion {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  originalAmount: number;
  convertedAmount: number;
  fee: number;
  feePercent: number;
  timestamp: number;
}

/* ================================================================== */
/*  INTERFACES — Returns & Refunds                                     */
/* ================================================================== */

export interface ReturnPolicy {
  id: string;
  name: string;
  description: string;
  returnWindowDays: number;
  condition: "new" | "unused" | "any" | "damaged";
  refundMethod: "original_payment" | "store_credit" | "exchange";
  restockingFeePercent: number;
  returnShippingPaidBy: "customer" | "store";
  excludesCategories: string[];
  excludesProducts: string[];
  active: boolean;
  createdAt: number;
}

export interface ReturnEvaluation {
  eligible: boolean;
  refundAmount: number;
  restockingFee: number;
  returnShipping: number;
  totalRefund: number;
  refundMethod: string;
  policyApplied: string;
  reasons: string[];
  notes: string[];
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface CommerceEngineStore {
  checkoutSessions: CheckoutSession[];
  promotions: Promotion[];
  tieredPricing: TieredPricingTier[];
  bundles: BundleDefinition[];
  volumeDiscounts: VolumeDiscountRule[];
  fulfillmentOrders: FulfillmentOrder[];
  trackingEvents: TrackingEvent[];
  shippingRates: ShippingRate[];
  taxRules: TaxRule[];
  paymentTransactions: PaymentTransaction[];
  refundRequests: RefundRequest[];
  paymentMethodOptions: PaymentMethodOption[];
  giftCards: GiftCard[];
  storeCreditAccounts: StoreCreditAccount[];
  loyaltyAccounts: LoyaltyPointsAccount[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptions: Subscription[];
  subscriptionOrders: SubscriptionOrder[];
  currencies: CurrencyConfig[];
  returnPolicies: ReturnPolicy[];
}

function getStore(): CommerceEngineStore {
  try {
    const raw = localStorage.getItem(COMMERCE_ENGINE_KEY);
    if (raw) return JSON.parse(raw) as CommerceEngineStore;
  } catch { /* ignore */ }
  return {
    checkoutSessions: [], promotions: [], tieredPricing: [], bundles: [],
    volumeDiscounts: [], fulfillmentOrders: [], trackingEvents: [],
    shippingRates: [], taxRules: [], paymentTransactions: [],
    refundRequests: [], paymentMethodOptions: [], giftCards: [],
    storeCreditAccounts: [], loyaltyAccounts: [], subscriptionPlans: [],
    subscriptions: [], subscriptionOrders: [], currencies: [], returnPolicies: [],
  };
}

function saveStore(store: CommerceEngineStore) {
  try { localStorage.setItem(COMMERCE_ENGINE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedCommerceEngine() {
  const store = getStore();
  if (store.currencies.length > 0) return;

  const now = Date.now();

  /* ---- Currencies ---- */
  const currencies: CurrencyConfig[] = [
    { code: "USD", symbol: "$", name: "US Dollar", rate: 1, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: true, isDefault: true },
    { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ".", decimalSeparator: ",", active: true, isDefault: false },
    { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: true, isDefault: false },
    { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.2, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: true, isDefault: false },
    { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.54, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: true, isDefault: false },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.37, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: true, isDefault: false },
    { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 149.5, decimals: 0, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: true, isDefault: false },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar", rate: 1.34, decimals: 2, format: "{{symbol}}{{amount}}", symbolPosition: "before", thousandSeparator: ",", decimalSeparator: ".", active: false, isDefault: false },
  ];

  /* ---- Promotions ---- */
  const promotions: Promotion[] = [
    { id: "promo_summer", name: "Summer Sale 15% Off", description: "15% off all fragrance and home products", type: "percentage_off", value: 15, conditions: [], stackable: false, priority: 10, active: true, startsAt: now - 7 * 86400000, endsAt: now + 23 * 86400000, usedCount: 42, applicableProducts: [], applicableCategories: ["home"], applicableBrands: [], excludedProducts: [], minSpend: 0, minQuantity: 1, createdAt: now - 30 * 86400000 },
    { id: "promo_welcome", name: "Welcome 10% Off", description: "10% off first order for new customers", type: "percentage_off", value: 10, conditions: [{ field: "customer.isNew", operator: "eq", value: "true" as any }], stackable: true, priority: 5, active: true, usedCount: 86, applicableProducts: [], applicableCategories: [], applicableBrands: [], excludedProducts: [], minSpend: 0, minQuantity: 1, createdAt: now - 90 * 86400000 },
    { id: "promo_freeship", name: "Free Shipping Over $150", description: "Complimentary standard shipping on orders over $150", type: "free_shipping", value: 12, conditions: [{ field: "cart.total", operator: "gte", value: "150" as any }], stackable: true, priority: 1, active: true, usedCount: 240, applicableProducts: [], applicableCategories: [], applicableBrands: [], excludedProducts: [], minSpend: 150, minQuantity: 1, createdAt: now - 180 * 86400000 },
    { id: "promo_bundle", name: "Skincare Bundle 20% Off", description: "20% off when you buy any 3 skincare products", type: "bundle_discount", value: 20, conditions: [{ field: "cart.category.quantity.beauty", operator: "gte", value: "3" as any }], stackable: false, priority: 15, active: true, usedCount: 18, applicableProducts: [], applicableCategories: ["beauty"], applicableBrands: [], excludedProducts: [], minSpend: 0, minQuantity: 3, createdAt: now - 45 * 86400000 },
    { id: "promo_vip", name: "VIP Exclusive 20% Off", description: "Exclusive 20% discount for VIP Atelier members", type: "percentage_off", value: 20, conditions: [{ field: "customer.tier", operator: "eq", value: "vip" as any }], stackable: true, priority: 20, active: true, usedCount: 12, applicableProducts: [], applicableCategories: [], applicableBrands: [], excludedProducts: [], minSpend: 0, minQuantity: 1, createdAt: now - 60 * 86400000 },
  ];

  /* ---- Tiered Pricing ---- */
  const tieredPricing: TieredPricingTier[] = [
    { id: "tier_wholesale_1", name: "Wholesale Starter", minQuantity: 10, discountPercent: 5, customerGroups: ["wholesale", "retailer"] },
    { id: "tier_wholesale_2", name: "Wholesale Pro", minQuantity: 25, discountPercent: 10, customerGroups: ["wholesale", "retailer"] },
    { id: "tier_wholesale_3", name: "Wholesale Enterprise", minQuantity: 50, discountPercent: 15, customerGroups: ["wholesale", "retailer", "enterprise"] },
    { id: "tier_vip", name: "VIP Pricing", minQuantity: 1, discountPercent: 20, customerGroups: ["vip"] },
    { id: "tier_affiliate", name: "Affiliate Pricing", minQuantity: 1, discountPercent: 10, customerGroups: ["affiliate"] },
  ];

  /* ---- Volume Discounts ---- */
  const volumeDiscounts: VolumeDiscountRule[] = [
    { id: "vd_all", name: "Volume Discount", tiers: [{ minQty: 2, discountPercent: 5 }, { minQty: 5, discountPercent: 10 }, { minQty: 10, discountPercent: 15 }], applicableProducts: [], applicableCategories: [], active: true },
  ];

  /* ---- Bundles ---- */
  const bundles: BundleDefinition[] = [
    { id: "bundle_skincare_trio", name: "Skincare Starter Trio", description: "Cleanser + serum + moisturizer — 20% off", products: [{ productId: "prod_3", quantity: 1, discountPercent: 20 }, { productId: "prod_1", quantity: 1, discountPercent: 20 }, { productId: "prod_2", quantity: 1, discountPercent: 20 }], totalDiscountPercent: 20, active: true },
    { id: "bundle_fragrance_duo", name: "Fragrance & Candle Duo", description: "Your signature scent + matching candle — 15% off", products: [{ productId: "prod_17", quantity: 1, discountPercent: 15 }, { productId: "prod_18", quantity: 1, discountPercent: 15 }], totalDiscountPercent: 15, active: true },
  ];

  /* ---- Tax Rules ---- */
  const taxRules: TaxRule[] = [
    { id: "tax_us_default", name: "US Standard", country: "United States", rate: 0.08, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: ["digital"], exemptProducts: [], active: true, priority: 10, createdAt: now - 180 * 86400000 },
    { id: "tax_us_ca", name: "California", country: "United States", state: "CA", rate: 0.0875, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: ["digital"], exemptProducts: [], active: true, priority: 20, createdAt: now - 180 * 86400000 },
    { id: "tax_us_ny", name: "New York", country: "United States", state: "NY", rate: 0.08875, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: ["digital", "jewelry"], exemptProducts: [], active: true, priority: 20, createdAt: now - 180 * 86400000 },
    { id: "tax_uk_vat", name: "UK VAT", country: "United Kingdom", rate: 0.20, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: ["digital"], exemptProducts: [], active: true, priority: 10, createdAt: now - 180 * 86400000 },
    { id: "tax_eu_vat", name: "EU VAT", country: "Germany", rate: 0.19, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: ["digital"], exemptProducts: [], active: true, priority: 10, createdAt: now - 180 * 86400000 },
    { id: "tax_in_gst", name: "India GST", country: "India", rate: 0.18, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: [], exemptProducts: [], active: true, priority: 10, createdAt: now - 180 * 86400000 },
    { id: "tax_au_gst", name: "Australia GST", country: "Australia", rate: 0.10, type: "percentage", appliesTo: ["product", "shipping"], exemptCategories: [], exemptProducts: [], active: true, priority: 10, createdAt: now - 180 * 86400000 },
    { id: "tax_no_charge", name: "No Tax (Digital)", country: "*", rate: 0, type: "percentage", appliesTo: ["product"], exemptCategories: ["digital"], exemptProducts: [], active: true, priority: 1, createdAt: now - 180 * 86400000 },
  ];

  /* ---- Shipping Rates ---- */
  const shippingRates: ShippingRate[] = [
    { method: "standard", label: "Standard Shipping", cost: 12, estimatedDays: 5, carrier: "Global Express", description: "5-8 business days", available: true },
    { method: "express", label: "Express Shipping", cost: 24, estimatedDays: 3, carrier: "Global Express", description: "2-3 business days", available: true },
    { method: "overnight", label: "Overnight Shipping", cost: 48, estimatedDays: 1, carrier: "Priority Logistics", description: "Next business day", available: true },
    { method: "pickup", label: "Local Pickup", cost: 0, estimatedDays: 0, carrier: "In-Store", description: "Pick up from our NYC location", available: true },
  ];

  /* ---- Payment Method Options ---- */
  const paymentMethodOptions: PaymentMethodOption[] = [
    { id: "pm_card", name: "Credit / Debit Card", code: "stripe", description: "Visa, Mastercard, Amex, Discover", icon: "credit-card", available: true, countries: [], minAmount: 0, maxAmount: 50000, processingFee: 0, estimatedTime: "Instant" },
    { id: "pm_paypal", name: "PayPal", code: "paypal", description: "Pay with your PayPal account", icon: "paypal", available: true, countries: [], minAmount: 0, maxAmount: 50000, processingFee: 0, estimatedTime: "Instant" },
    { id: "pm_applepay", name: "Apple Pay", code: "applepay", description: "Fast checkout with Apple Pay", icon: "apple", available: true, countries: ["United States", "United Kingdom", "Canada", "Australia"], minAmount: 0, maxAmount: 50000, processingFee: 0, estimatedTime: "Instant" },
    { id: "pm_googlepay", name: "Google Pay", code: "googlepay", description: "Fast checkout with Google Pay", icon: "google", available: true, countries: ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain"], minAmount: 0, maxAmount: 50000, processingFee: 0, estimatedTime: "Instant" },
    { id: "pm_upi", name: "UPI (India)", code: "razorpay", description: "Pay via Google Pay, PhonePe, Paytm", icon: "smartphone", available: true, countries: ["India"], minAmount: 0, maxAmount: 20000, processingFee: 0, estimatedTime: "Instant" },
    { id: "pm_cod", name: "Cash on Delivery", code: "cod", description: "Pay when you receive", icon: "banknote", available: false, countries: ["India"], minAmount: 0, maxAmount: 5000, processingFee: 0, estimatedTime: "At delivery" },
    { id: "pm_bank", name: "Bank Transfer", code: "bank", description: "Direct bank transfer (may take 1-3 days)", icon: "building", available: false, countries: [], minAmount: 50, maxAmount: 50000, processingFee: 0, estimatedTime: "1-3 business days" },
    { id: "pm_giftcard", name: "Gift Card", code: "giftcard", description: "Redeem your ALAYA gift card", icon: "gift", available: true, countries: [], minAmount: 0, maxAmount: 1000, processingFee: 0, estimatedTime: "Instant" },
  ];

  /* ---- Return Policies ---- */
  const returnPolicies: ReturnPolicy[] = [
    { id: "rp_standard", name: "Standard Returns", description: "30-day return window for unused items in original condition", returnWindowDays: 30, condition: "unused", refundMethod: "original_payment", restockingFeePercent: 0, returnShippingPaidBy: "customer", excludesCategories: ["digital"], excludesProducts: [], active: true, createdAt: now - 180 * 86400000 },
    { id: "rp_luxury", name: "Luxury Returns", description: "14-day return for fine jewelry and premium leather", returnWindowDays: 14, condition: "new", refundMethod: "original_payment", restockingFeePercent: 5, returnShippingPaidBy: "customer", excludesCategories: ["digital"], excludesProducts: [], active: true, createdAt: now - 180 * 86400000 },
    { id: "rp_digital", name: "Digital Products", description: "Digital guides and courses are non-returnable", returnWindowDays: 0, condition: "any", refundMethod: "store_credit", restockingFeePercent: 0, returnShippingPaidBy: "store", excludesCategories: [], excludesProducts: [], active: true, createdAt: now - 180 * 86400000 },
    { id: "rp_vip", name: "VIP Atelier Returns", description: "Extended 60-day returns for VIP members", returnWindowDays: 60, condition: "any", refundMethod: "original_payment", restockingFeePercent: 0, returnShippingPaidBy: "store", excludesCategories: ["digital"], excludesProducts: [], active: true, createdAt: now - 180 * 86400000 },
  ];

  /* ---- Subscription Plans ---- */
  const subscriptionPlans: SubscriptionPlan[] = [
    { id: "plan_skincare", name: "Skincare Monthly", description: "Monthly replenishment of your favourite skincare essentials", productId: "prod_1", interval: "monthly", intervalCount: 1, price: 54, trialDays: 7, setupFee: 0, maxBillingCycles: 12, cancelAtPeriodEnd: true, active: true, createdAt: now - 90 * 86400000 },
    { id: "plan_fragrance", name: "Fragrance Quarterly", description: "A new signature scent delivered every season", productId: "prod_17", interval: "quarterly", intervalCount: 1, price: 130, trialDays: 0, setupFee: 0, cancelAtPeriodEnd: true, maxBillingCycles: undefined, active: true, createdAt: now - 60 * 86400000 },
    { id: "plan_candle", name: "Candle Club", description: "Hand-poured candle every month", productId: "prod_18", interval: "monthly", intervalCount: 1, price: 58, trialDays: 0, setupFee: 10, maxBillingCycles: 6, cancelAtPeriodEnd: true, active: true, createdAt: now - 45 * 86400000 },
    { id: "plan_wardrobe", name: "Capsule Wardrobe Annual", description: "Annual wardrobe refresh guide", productId: "prod_21", interval: "annual", intervalCount: 1, price: 39, trialDays: 0, setupFee: 0, cancelAtPeriodEnd: true, maxBillingCycles: undefined, active: true, createdAt: now - 30 * 86400000 },
  ];

  /* ---- Seed Gift Cards ---- */
  const giftCards: GiftCard[] = [
    { id: "gc_001", code: "GIFT-ALAYA-001", initialBalance: 100, balance: 100, currency: "USD", senderEmail: "eleanor@example.com", recipientEmail: "sophie@example.com", recipientName: "Sophie", message: "Happy birthday! Treat yourself to something beautiful.", designTemplate: "classic", active: true, expiresAt: now + 365 * 86400000, createdAt: now - 7 * 86400000, usedTransactions: [] },
    { id: "gc_002", code: "GIFT-ALAYA-002", initialBalance: 250, balance: 85, currency: "USD", senderEmail: "marc@example.com", message: "Congratulations on your new home!", designTemplate: "premium", active: true, expiresAt: now + 180 * 86400000, createdAt: now - 30 * 86400000, usedTransactions: [{ orderId: "ord_1", amount: 165, at: now - 25 * 86400000 }] },
    { id: "gc_003", code: "GIFT-ALAYA-003", initialBalance: 50, balance: 50, currency: "USD", designTemplate: "minimal", active: true,  expiresAt: now + 365 * 86400000, createdAt: now - 14 * 86400000, usedTransactions: [] } as GiftCard,
  ];

  /* ---- Seed Loyalty Accounts ---- */
  const loyaltyAccounts: LoyaltyPointsAccount[] = [
    { id: "loyal_1", customerId: "cust_isabella", customerName: "Isabella Moreau", points: 1840, lifetimePoints: 2200, tier: "gold", tierProgress: 1840, nextTierPoints: 4000, transactions: [{ id: "lt_1", type: "earn", points: 420, balance: 420, reason: "Order #AL-481203", orderId: "ord_seed_1", rate: 1, createdAt: now - 6 * 86400000 }, { id: "lt_2", type: "bonus", points: 500, balance: 920, reason: "Welcome bonus", rate: 0, createdAt: now - 40 * 86400000 }, { id: "lt_3", type: "earn", points: 380, balance: 1300, reason: "Gold tier monthly bonus", rate: 2, createdAt: now - 14 * 86400000 }], createdAt: now - 40 * 86400000, updatedAt: now - 86400000 },
    { id: "loyal_2", customerId: "cust_meera", customerName: "Meera Iyer", points: 420, lifetimePoints: 420, tier: "insider", tierProgress: 420, nextTierPoints: 500, transactions: [{ id: "lt_4", type: "earn", points: 420, balance: 420, reason: "Order #AL-481488", orderId: "ord_seed_2", rate: 1, createdAt: now - 2 * 86400000 }], createdAt: now - 65 * 86400000, updatedAt: now - 2 * 86400000 },
  ];

  store.currencies = currencies;
  store.promotions = promotions;
  store.tieredPricing = tieredPricing;
  store.volumeDiscounts = volumeDiscounts;
  store.bundles = bundles;
  store.taxRules = taxRules;
  store.shippingRates = shippingRates;
  store.paymentMethodOptions = paymentMethodOptions;
  store.returnPolicies = returnPolicies;
  store.subscriptionPlans = subscriptionPlans;
  store.giftCards = giftCards;
  store.loyaltyAccounts = loyaltyAccounts;
  saveStore(store);
}

seedCommerceEngine();

/* ================================================================== */
/*  MODULE 1: CHECKOUT PIPELINE ENGINE                                 */
/* ================================================================== */

export function createCheckoutSession(cartId: string, customer?: Partial<CheckoutCustomer>): CheckoutSession {
  const store = getStore();
  const session: CheckoutSession = {
    id: uid("chk"),
    cartId,
    step: "information",
    customer: {
      email: customer?.email || "",
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      marketingOptIn: customer?.marketingOptIn ?? true,
      createAccount: customer?.createAccount ?? false,
      phone: customer?.phone,
    },
    shipping: {
      address: { line1: "", city: "", country: "United States", zip: "" },
      method: "standard",
      estimatedDays: 5,
      cost: 12,
    },
    payment: {
      method: "",
      gatewayId: "",
      billingAddress: { line1: "", city: "", country: "United States", zip: "" },
      saveForFuture: false,
    },
    review: {
      subtotal: 0, discount: 0, shipping: 12, tax: 0, total: 0,
      currency: "USD", itemsCount: 0,
    },
    metadata: {},
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.checkoutSessions.push(session);
  saveStore(store);
  pushLog("info", "order", `Checkout session created: ${session.id}`);
  return session;
}

export function getCheckoutSession(id: string): CheckoutSession | undefined {
  return getStore().checkoutSessions.find((s) => s.id === id);
}

export function updateCheckoutSession(id: string, patch: Partial<CheckoutSession>): CheckoutSession | null {
  const store = getStore();
  const idx = store.checkoutSessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.checkoutSessions[idx] = { ...store.checkoutSessions[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.checkoutSessions[idx];
}

export function advanceCheckoutStep(id: string, step: CheckoutStep): CheckoutSession | null {
  const session = updateCheckoutSession(id, { step });
  if (session) pushLog("info", "order", `Checkout ${id} advanced to step: ${step}`);
  return session;
}

export function validateCheckoutStep(
  session: CheckoutSession,
  products: Product[],
  _coupons: Coupon[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  switch (session.step) {
    case "information":
      if (!session.customer.email) errors.push({ field: "email", code: "required", message: "Email is required" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.customer.email))
        errors.push({ field: "email", code: "invalid", message: "Invalid email format" });
      if (!session.customer.firstName) errors.push({ field: "firstName", code: "required", message: "First name is required" });
      if (!session.customer.lastName) errors.push({ field: "lastName", code: "required", message: "Last name is required" });
      // Check for existing customer
      break;

    case "shipping":
      if (!session.shipping.address.line1) errors.push({ field: "address.line1", code: "required", message: "Address is required" });
      if (!session.shipping.address.city) errors.push({ field: "address.city", code: "required", message: "City is required" });
      if (!session.shipping.address.country) errors.push({ field: "address.country", code: "required", message: "Country is required" });
      if (!session.shipping.address.zip) errors.push({ field: "address.zip", code: "required", message: "ZIP code is required" });
      break;

    case "payment":
      if (!session.payment.method) errors.push({ field: "payment.method", code: "required", message: "Payment method is required" });
      if (!session.payment.gatewayId) errors.push({ field: "payment.gatewayId", code: "required", message: "Payment gateway is required" });
      break;

    case "review":
      // Validate stock availability
      for (const line of getCartLines(session.cartId, products)) {
        const product = products.find((p) => p.id === line.productId);
        if (product && product.type !== "digital" && !product.affiliate && product.stock < line.qty) {
          errors.push({
            field: `items.${line.productId}.stock`,
            code: "insufficient_stock",
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
        }
      }
      break;
  }

  return { valid: errors.length === 0, errors, warnings };
}

function getCartLines(_cartId: string, _products: Product[]): { productId: string; qty: number }[] {
  try {
    const raw = localStorage.getItem("alaya_cart_v1");
    if (!raw) return [];
    const cart: CartLine[] = JSON.parse(raw);
    return cart.map((l) => ({ productId: l.productId, qty: l.qty }));
  } catch { return []; }
}

export function calculateCheckoutReview(
  session: CheckoutSession,
  products: Product[],
  _customers: Customer[],
  coupons: Coupon[]
): CheckoutReview {
  const cartLines = getCartLines(session.cartId, products);
  let subtotal = 0;
  let discount = 0;
  let discountLabel = "";

  for (const line of cartLines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) continue;
    const price = product.salePrice ?? product.price;
    subtotal += price * line.qty;
  }

  // Apply coupon
  const activeCoupon = coupons.find((c) => {
    if (!c.active) return false;
    if (c.expiresAt && c.expiresAt < Date.now()) return false;
    if (c.usageLimit && c.usedCount >= c.usageLimit) return false;
    return true;
  });

  if (activeCoupon) {
    let couponDisc = 0;
    if (activeCoupon.type === "percent") {
      couponDisc = subtotal * (activeCoupon.value / 100);
      discountLabel = `${activeCoupon.code} (${activeCoupon.value}% off)`;
    } else {
      couponDisc = Math.min(activeCoupon.value, subtotal);
      discountLabel = `Code ${activeCoupon.code}`;
    }
    if (subtotal >= activeCoupon.minSpend) {
      discount = couponDisc;
    }
  }

  const isFreeShipping = subtotal >= DEFAULT_FREE_SHIPPING_THRESHOLD || discount > 0;
  const shipping = isFreeShipping ? 0 : session.shipping.cost;

  // Tax calculation
  const tax = calculateTax(subtotal + shipping, session.shipping.address.country, session.shipping.address.state, products);

  const total = subtotal - discount + shipping + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    discountLabel,
    shipping: Math.round(shipping * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: "USD",
    itemsCount: cartLines.reduce((s, l) => s + l.qty, 0),
  };
}

export function completeCheckout(sessionId: string, products: Product[], customers: Customer[], coupons: Coupon[]): { order: Partial<Order> | null; session: CheckoutSession | null } {
  const session = getCheckoutSession(sessionId);
  if (!session) return { order: null, session: null };

  const review = calculateCheckoutReview(session, products, customers, coupons);

  const orderItems = getCartLines(session.cartId, products).map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      productId: line.productId,
      name: product?.name || "",
      image: product?.images?.[0] || "",
      price: product ? (product.salePrice ?? product.price) : 0,
      qty: line.qty,
    };
  });

  const orderNumber = `AL-${String(Math.floor(100000 + Math.random() * 900000))}`;
  const order: Partial<Order> = {
    id: uid("ord"),
    number: orderNumber,
    items: orderItems,
    subtotal: review.subtotal,
    discount: review.discount,
    shipping: review.shipping,
    tax: review.tax,
    total: review.total,
    currency: "USD",
    couponCode: review.discountLabel ? "APPLIED" : undefined,
    paymentMethod: session.payment.method,
    customer: {
      name: `${session.customer.firstName} ${session.customer.lastName}`,
      email: session.customer.email,
      phone: session.customer.phone,
      address: session.shipping.address.line1,
      city: session.shipping.address.city,
      country: session.shipping.address.country,
      zip: session.shipping.address.zip,
    },
    status: "pending",
    createdAt: Date.now(),
  };

  const updated = updateCheckoutSession(sessionId, {
    orderId: order.id,
    step: "confirmation",
    completed: true,
    review,
  });

  pushLog("info", "order", `Order ${orderNumber} completed via checkout ${sessionId}`);
  writeAuditEntry({
    actor: session.customer.email, actorType: "user", action: "create",
    entityType: "order", entityId: order.id || "", entityName: `Order ${orderNumber}`,
    detail: `Checkout completed. Total: $${review.total}`,
    severity: "info", metadata: { checkoutId: sessionId },
  });

  return { order, session: updated };
}

/* ================================================================== */
/*  MODULE 2: PRICING & PROMOTIONS ENGINE                              */
/* ================================================================== */

export function getPromotions(): Promotion[] {
  return getStore().promotions;
}

export function createPromotion(input: Omit<Promotion, "id" | "usedCount" | "createdAt">): Promotion {
  const store = getStore();
  const promo: Promotion = { ...input, id: uid("promo"), usedCount: 0, createdAt: Date.now() };
  store.promotions.push(promo);
  saveStore(store);
  writeAuditEntry({ actor: "admin", actorType: "admin", action: "create", entityType: "setting", entityId: promo.id, entityName: `Promotion: ${promo.name}`, detail: `Created promotion: ${promo.name}`, severity: "info", metadata: {} });
  return promo;
}

export function updatePromotion(id: string, patch: Partial<Promotion>): Promotion | null {
  const store = getStore();
  const idx = store.promotions.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.promotions[idx] = { ...store.promotions[idx], ...patch };
  saveStore(store);
  return store.promotions[idx];
}

export function deletePromotion(id: string): boolean {
  const store = getStore();
  store.promotions = store.promotions.filter((p) => p.id !== id);
  saveStore(store);
  return true;
}

export function calculatePrice(ctx: PricingContext): PriceBreakdown {
  const { product, quantity, customerGroup, cartTotal } = ctx;
  const basePrice = product.price;
  const salePrice = product.salePrice;
  let effectivePrice = salePrice ?? basePrice;
  let discountAmount = 0;
  let discountLabel = "";
  const promotionsApplied: string[] = [];
  let tier = "standard";

  // Apply tiered pricing
  const tiers = getStore().tieredPricing;
  if (customerGroup) {
    const applicableTiers = tiers
      .filter((t) => t.customerGroups.includes(customerGroup) && quantity >= t.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity);

    if (applicableTiers.length > 0) {
      const bestTier = applicableTiers[0];
      tier = bestTier.name;
      const tierDiscount = effectivePrice * (bestTier.discountPercent / 100);
      discountAmount += tierDiscount;
      discountLabel = `${bestTier.name} (-${bestTier.discountPercent}%)`;
      promotionsApplied.push(bestTier.name);
    }
  }

  // Apply volume discounts
  const volumeRules = getStore().volumeDiscounts;
  for (const rule of volumeRules) {
    if (!rule.active) continue;
    const applicableProducts = rule.applicableProducts.length === 0 || rule.applicableProducts.includes(product.id);
    const applicableCategories = rule.applicableCategories.length === 0 || rule.applicableCategories.includes(product.category);
    if (!applicableProducts || !applicableCategories) continue;

    const bestTier = [...rule.tiers].sort((a, b) => b.minQty - a.minQty).find((t) => quantity >= t.minQty);
    if (bestTier) {
      const volDiscount = effectivePrice * (bestTier.discountPercent / 100);
      discountAmount += volDiscount;
      discountLabel = `${discountLabel ? `${discountLabel} + ` : ""}Volume (-${bestTier.discountPercent}%)`;
      promotionsApplied.push(`Volume: ${bestTier.minQty}+`);
    }
  }

  // Apply active promotions
  const activePromos = getStore().promotions.filter((p) => {
    if (!p.active) return false;
    if (p.startsAt && p.startsAt > Date.now()) return false;
    if (p.endsAt && p.endsAt < Date.now()) return false;
    if (p.usageLimit && p.usedCount >= p.usageLimit) return false;
    if (p.minSpend > 0 && (cartTotal ?? 0) < p.minSpend) return false;
    if (p.applicableProducts.length > 0 && !p.applicableProducts.includes(product.id)) return false;
    if (p.applicableCategories.length > 0 && !p.applicableCategories.includes(product.category)) return false;
    if (p.excludedProducts.includes(product.id)) return false;
    return true;
  });

  for (const promo of activePromos) {
    if (!promo.stackable && promotionsApplied.length > 0) continue;
    if (promo.type === "percentage_off") {
      const promoDisc = effectivePrice * (promo.value / 100);
      discountAmount += promoDisc;
      discountLabel = `${discountLabel ? `${discountLabel} + ` : ""}${promo.name}`;
      promotionsApplied.push(promo.name);
      // Increment usage count
      promo.usedCount++;
    } else if (promo.type === "fixed_amount" && promo.value <= effectivePrice) {
      discountAmount += promo.value;
      discountLabel = `${discountLabel ? `${discountLabel} + ` : ""}${promo.name}`;
      promotionsApplied.push(promo.name);
      promo.usedCount++;
    }
  }

  // Clamp discount to not exceed price
  discountAmount = Math.min(discountAmount, effectivePrice - 0.01);
  const finalPrice = effectivePrice - discountAmount;
  const lineTotal = finalPrice * quantity;

  return {
    basePrice,
    salePrice: salePrice ?? null,
    effectivePrice,
    quantity,
    lineTotal: Math.round(lineTotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountLabel,
    promotionsApplied,
    tier,
  };
}

export function validateCoupon(
  code: string,
  cartSubtotal: number,
  _customerEmail?: string
): { valid: boolean; coupon?: Coupon; message: string } {
  const store = getStore().promotions;
  // Check against promotions first
  const promo = store.find((p) => p.name.toLowerCase().includes(code.toLowerCase()));
  if (promo) {
    if (!promo.active) return { valid: false, message: "This promotion is no longer active" };
    if (promo.usedCount >= (promo.usageLimit || Infinity)) return { valid: false, message: "This promotion has reached its usage limit" };
    if (promo.minSpend > 0 && cartSubtotal < promo.minSpend) return { valid: false, message: `Minimum spend of $${promo.minSpend} required` };
    return { valid: true, message: `Promotion "${promo.name}" applied!` };
  }

  // Check against seed coupons
  const couponMap: Record<string, { type: "percent" | "fixed"; value: number; minSpend: number }> = {
    "WELCOME10": { type: "percent", value: 10, minSpend: 0 },
    "INSIDER15": { type: "percent", value: 15, minSpend: 200 },
    "FREESHIP": { type: "fixed", value: 12, minSpend: 75 },
  };

  const match = Object.entries(couponMap).find(([key]) => key === code.toUpperCase());
  if (match) {
    const [, config] = match;
    if (cartSubtotal < config.minSpend) {
      return { valid: false, message: `Minimum spend of $${config.minSpend} required for code ${match[0]}` };
    }
    return {
      valid: true,
      message: `Code ${match[0]} applied! ${config.type === "percent" ? `${config.value}% off` : `$${config.value} off`}`,
      coupon: { id: `cpn_${code}`, code: match[0], type: config.type, value: config.value, minSpend: config.minSpend, active: true, description: "", usedCount: 0 } as Coupon,
    };
  }

  return { valid: false, message: "Invalid or expired coupon code" };
}

/* ================================================================== */
/*  MODULE 3: FULFILLMENT ENGINE                                       */
/* ================================================================== */

export function assignFulfillment(order: Partial<Order>, suppliers: Supplier[]): FulfillmentOrder {
  const store = getStore();

  // Score suppliers for each item
  const bestSupplier = [...suppliers]
    .filter((s) => s.active)
    .sort((a, b) => a.priority - b.priority || a.handlingDays - b.handlingDays)[0];

  const items: FulfillmentLine[] = (order.items || []).map((item) => ({
    productId: item.productId,
    name: item.name,
    sku: "",
    quantity: item.qty,
    fulfilled: 0,
  }));

  const fulfillment: FulfillmentOrder = {
    id: uid("ful"),
    orderId: order.id || "",
    orderNumber: order.number || "",
    status: "unfulfilled",
    items,
    supplierId: bestSupplier?.id,
    supplierName: bestSupplier?.name,
    shippingMethod: "standard",
    estimatedDelivery: Date.now() + (bestSupplier?.handlingDays || 5) * 86400000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.fulfillmentOrders.push(fulfillment);
  saveStore(store);
  pushLog("info", "order", `Fulfillment created for order ${order.number}, assigned to ${bestSupplier?.name || "auto"}`);
  return fulfillment;
}

export function getFulfillmentOrders(orderId?: string): FulfillmentOrder[] {
  const all = getStore().fulfillmentOrders;
  return orderId ? all.filter((f) => f.orderId === orderId) : all;
}

export function updateFulfillmentStatus(id: string, status: FulfillmentStatus, trackingNumber?: string): FulfillmentOrder | null {
  const store = getStore();
  const idx = store.fulfillmentOrders.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const patch: Partial<FulfillmentOrder> = { status, updatedAt: Date.now() };
  if (trackingNumber) patch.trackingNumber = trackingNumber;
  if (status === "shipped") patch.shippedAt = Date.now();
  if (status === "delivered") patch.deliveredAt = Date.now();
  store.fulfillmentOrders[idx] = { ...store.fulfillmentOrders[idx], ...patch };
  saveStore(store);
  pushLog("info", "order", `Fulfillment ${id} updated to ${status}`);
  return store.fulfillmentOrders[idx];
}

export function addTrackingEvent(fulfillmentId: string, status: string, location: string, description: string): TrackingEvent | null {
  const store = getStore();
  const fulfillment = store.fulfillmentOrders.find((f) => f.id === fulfillmentId);
  if (!fulfillment) return null;

  const event: TrackingEvent = {
    id: uid("trk"),
    fulfillmentId,
    status,
    location,
    description,
    timestamp: Date.now(),
  };
  store.trackingEvents.push(event);
  saveStore(store);
  return event;
}

export function getTrackingEvents(fulfillmentId: string): TrackingEvent[] {
  return getStore().trackingEvents.filter((e) => e.fulfillmentId === fulfillmentId);
}

export function getShippingRates(): ShippingRate[] {
  return getStore().shippingRates;
}

export function calculateShipping(_country: string, subtotal: number, method: ShippingMethod = "standard"): ShippingRate | null {
  const rates = getStore().shippingRates;
  const rate = rates.find((r) => r.method === method);
  if (!rate) return null;

  const isFree = subtotal >= DEFAULT_FREE_SHIPPING_THRESHOLD;
  return {
    ...rate,
    cost: isFree ? 0 : rate.cost,
    available: true,
  };
}

/* ================================================================== */
/*  MODULE 4: TAX ENGINE                                               */
/* ================================================================== */

export function getTaxRules(): TaxRule[] {
  return getStore().taxRules;
}

export function createTaxRule(input: Omit<TaxRule, "id" | "createdAt">): TaxRule {
  const store = getStore();
  const rule: TaxRule = { ...input, id: uid("tax"), createdAt: Date.now() };
  store.taxRules.push(rule);
  saveStore(store);
  return rule;
}

export function updateTaxRule(id: string, patch: Partial<TaxRule>): TaxRule | null {
  const store = getStore();
  const idx = store.taxRules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.taxRules[idx] = { ...store.taxRules[idx], ...patch };
  saveStore(store);
  return store.taxRules[idx];
}

export function deleteTaxRule(id: string): boolean {
  const store = getStore();
  store.taxRules = store.taxRules.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

export function calculateTax(
  taxableAmount: number,
  country: string,
  state?: string,
  products?: Product[]
): number {
  const rules = getStore().taxRules;
  let effectiveRate = 0;
  const appliedRules: string[] = [];

  // Find best matching rule
  const matchingRules = rules
    .filter((r) => r.active && (r.country === country || r.country === "*"))
    .sort((a, b) => b.priority - a.priority);

  for (const rule of matchingRules) {
    if (rule.state && rule.state !== state) continue;
    if (rule.type === "percentage") {
      effectiveRate = rule.rate;
      appliedRules.push(rule.name);
      break;
    }
  }

  // Check for exempt categories in products
  const hasExemptProducts = products?.some((p) =>
    matchingRules.some((r) => r.exemptCategories.includes(p.category) || r.exemptProducts.includes(p.id))
  );

  if (hasExemptProducts) {
    // Calculate tax only on non-exempt portion
    // For simplicity, apply full rate if any non-exempt products exist
  }

  return Math.round(taxableAmount * effectiveRate * 100) / 100;
}

export function calculateTaxBreakdown(
  subtotal: number,
  shipping: number,
  country: string,
  state?: string,
  products?: Product[]
): TaxCalculation {
  const totalTaxable = subtotal + shipping;
  const totalTax = calculateTax(totalTaxable, country, state, products);

  return {
    totalTax,
    breakdown: [{
      jurisdiction: state ? `${country} (${state})` : country,
      rate: totalTaxable > 0 ? totalTax / totalTaxable : 0,
      taxableAmount: totalTaxable,
      taxAmount: totalTax,
      type: "sales_tax",
    }],
    appliedRules: [],
    currency: "USD",
  };
}

/* ================================================================== */
/*  MODULE 5: PAYMENT ORCHESTRATOR                                     */
/* ================================================================== */

export function getPaymentMethods(country?: string): PaymentMethodOption[] {
  const methods = getStore().paymentMethodOptions;
  return country
    ? methods.filter((m) => m.available && (m.countries.length === 0 || m.countries.includes(country)))
    : methods.filter((m) => m.available);
}

export function authorizePayment(orderId: string, orderNumber: string, gatewayId: string, amount: number, currency: CurrencyCode): PaymentTransaction {
  const store = getStore();
  const gateway = getGatewayName(gatewayId);
  const tx: PaymentTransaction = {
    id: uid("pctx"),
    orderId, orderNumber,
    gatewayId, gatewayName: gateway,
    type: "authorization",
    amount, currency,
    status: "authorized",
    gatewayTransactionId: `gtx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    metadata: {},
    createdAt: Date.now(),
    processedAt: Date.now(),
  };
  store.paymentTransactions.push(tx);
  saveStore(store);
  pushLog("info", "payment", `Payment authorized: $${amount} for order ${orderNumber} via ${gateway}`);
  return tx;
}

export function capturePayment(transactionId: string): PaymentTransaction | null {
  const store = getStore();
  const idx = store.paymentTransactions.findIndex((t) => t.id === transactionId);
  if (idx === -1) return null;
  store.paymentTransactions[idx] = {
    ...store.paymentTransactions[idx],
    type: "capture",
    status: "captured",
    processedAt: Date.now(),
  };
  saveStore(store);
  pushLog("info", "payment", `Payment captured: ${store.paymentTransactions[idx].amount} for transaction ${transactionId}`);
  return store.paymentTransactions[idx];
}

export function processRefund(
  orderId: string,
  orderNumber: string,
  amount: number,
  reason: string,
  items?: { productId: string; quantity: number; amount: number }[]
): { transaction: PaymentTransaction; refund: RefundRequest } {
  const store = getStore();

  const refundReq: RefundRequest = {
    id: uid("ref"),
    transactionId: "",
    orderId, amount, reason,
    items: items || [],
    status: "approved",
    createdAt: Date.now(),
  };

  const refundTx: PaymentTransaction = {
    id: uid("pctx"),
    orderId, orderNumber,
    gatewayId: "stripe",
    gatewayName: "Stripe",
    type: "refund",
    amount: -amount,
    currency: "USD",
    status: "refunded",
    gatewayTransactionId: `rf_${Date.now()}`,
    metadata: { refundRequestId: refundReq.id },
    createdAt: Date.now(),
    processedAt: Date.now(),
  };

  refundReq.transactionId = refundTx.id;
  store.paymentTransactions.push(refundTx);
  store.refundRequests.push(refundReq);
  saveStore(store);
  pushLog("info", "payment", `Refund of $${amount} processed for order ${orderNumber}`);
  return { transaction: refundTx, refund: refundReq };
}

export function getPaymentTransactions(orderId?: string): PaymentTransaction[] {
  const all = getStore().paymentTransactions;
  return orderId ? all.filter((t) => t.orderId === orderId) : all;
}

export function getRefundRequests(orderId?: string): RefundRequest[] {
  const all = getStore().refundRequests;
  return orderId ? all.filter((r) => r.orderId === orderId) : all;
}

function getGatewayName(gatewayId: string): string {
  const map: Record<string, string> = {
    stripe: "Stripe", paypal: "PayPal", applepay: "Apple Pay",
    googlepay: "Google Pay", razorpay: "Razorpay", cod: "Cash on Delivery",
    bank: "Bank Transfer", giftcard: "Gift Card",
  };
  const code = gatewayId.replace("gw_", "");
  return map[code] || gatewayId;
}

/* ================================================================== */
/*  MODULE 6: CART ENGINE                                              */
/* ================================================================== */

export function estimateCartTotals(
  lines: CartLine[],
  products: Product[],
  country: string,
  state?: string,
  couponCode?: string
): {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  isFreeShipping: boolean;
  appliedPromotions: string[];
} {
  let subtotal = 0;
  const appliedPromotions: string[] = [];
  let discount = 0;

  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) continue;
    const price = product.salePrice ?? product.price;
    const lineTotal = price * line.qty;
    subtotal += lineTotal;
  }

  // Validate coupon
  if (couponCode) {
    const result = validateCoupon(couponCode, subtotal);
    if (result.valid && result.coupon) {
      if (result.coupon.type === "percent") {
        discount = subtotal * (result.coupon.value / 100);
      } else {
        discount = result.coupon.value;
      }
      appliedPromotions.push(`Coupon: ${couponCode}`);
    }
  }

  const isFreeShipping = subtotal >= DEFAULT_FREE_SHIPPING_THRESHOLD;
  const shipping = isFreeShipping ? 0 : DEFAULT_FLAT_RATE;
  const tax = calculateTax(subtotal + shipping, country, state);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal - discount + shipping + tax) * 100) / 100,
    isFreeShipping,
    appliedPromotions,
  };
}

/* ================================================================== */
/*  MODULE 7: GIFT CARD & STORE CREDIT                                 */
/* ================================================================== */

export function getGiftCards(): GiftCard[] {
  return getStore().giftCards;
}

export function createGiftCard(input: {
  amount: number;
  currency?: CurrencyCode;
  senderEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  designTemplate?: string;
}): GiftCard {
  const store = getStore();
  const code = `GIFT-ALAYA-${String(store.giftCards.length + 1).padStart(3, "0")}`;
  const gc: GiftCard = {
    id: uid("gc"),
    code,
    initialBalance: input.amount,
    balance: input.amount,
    currency: input.currency || "USD",
    senderEmail: input.senderEmail,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    message: input.message,
    designTemplate: input.designTemplate || "classic",
    active: true,
    expiresAt: Date.now() + 365 * 86400000,
    createdAt: Date.now(),
    usedTransactions: [],
  };
  store.giftCards.push(gc);
  saveStore(store);
  pushLog("info", "payment", `Gift card created: ${code} ($${input.amount})`);
  return gc;
}

export function redeemGiftCard(code: string, amount: number, orderId: string): { success: boolean; remainingBalance: number; message: string } {
  const store = getStore();
  const gc = store.giftCards.find((g) => g.code === code && g.active);
  if (!gc) return { success: false, remainingBalance: 0, message: "Invalid gift card code" };
  if (gc.expiresAt && gc.expiresAt < Date.now()) return { success: false, remainingBalance: 0, message: "Gift card has expired" };
  if (gc.balance <= 0) return { success: false, remainingBalance: 0, message: "Gift card balance is depleted" };

  const redeemAmount = Math.min(amount, gc.balance);
  gc.balance -= redeemAmount;
  gc.usedTransactions.push({ orderId, amount: redeemAmount, at: Date.now() });
  saveStore(store);
  pushLog("info", "payment", `Gift card ${code} redeemed: $${redeemAmount} on order ${orderId}`);
  return { success: true, remainingBalance: gc.balance, message: `$${redeemAmount} redeemed from gift card` };
}

/* ---- Store Credit ---- */

export function getStoreCreditAccount(customerId: string): StoreCreditAccount | undefined {
  return getStore().storeCreditAccounts.find((a) => a.customerId === customerId);
}

export function createStoreCreditAccount(customerId: string, customerName: string, initialCredit = 0): StoreCreditAccount {
  const store = getStore();
  const account: StoreCreditAccount = {
    id: uid("sca"),
    customerId, customerName,
    balance: initialCredit,
    currency: "USD",
    lifetimeCredited: initialCredit,
    lifetimeDebited: 0,
    transactions: initialCredit > 0 ? [{ id: uid("sct"), type: "credit", amount: initialCredit, balance: initialCredit, reason: "Initial credit", createdAt: Date.now() }] : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.storeCreditAccounts.push(account);
  saveStore(store);
  return account;
}

export function addStoreCredit(customerId: string, amount: number, reason: string, orderId?: string): StoreCreditAccount | null {
  const store = getStore();
  let account = store.storeCreditAccounts.find((a) => a.customerId === customerId);
  if (!account) account = createStoreCreditAccount(customerId, customerId);
  account.balance += amount;
  account.lifetimeCredited += amount;
  account.transactions.push({ id: uid("sct"), type: "credit", amount, balance: account.balance, reason, orderId, createdAt: Date.now() });
  account.updatedAt = Date.now();
  saveStore(store);
  return account;
}

export function deductStoreCredit(customerId: string, amount: number, reason: string, orderId?: string): { success: boolean; account?: StoreCreditAccount; message: string } {
  const store = getStore();
  const account = store.storeCreditAccounts.find((a) => a.customerId === customerId);
  if (!account) return { success: false, message: "No store credit account found" };
  if (account.balance < amount) return { success: false, message: `Insufficient credit. Available: $${account.balance}` };

  account.balance -= amount;
  account.lifetimeDebited += amount;
  account.transactions.push({ id: uid("sct"), type: "debit", amount: -amount, balance: account.balance, reason, orderId, createdAt: Date.now() });
  account.updatedAt = Date.now();
  saveStore(store);
  return { success: true, account, message: `$${amount} deducted from store credit` };
}

/* ---- Loyalty Points ---- */

export function getLoyaltyAccount(customerId: string): LoyaltyPointsAccount | undefined {
  return getStore().loyaltyAccounts.find((a) => a.customerId === customerId);
}

export function earnLoyaltyPoints(customerId: string, customerName: string, amount: number, orderId: string, rate: number = 1): LoyaltyPointsAccount {
  const store = getStore();
  let account = store.loyaltyAccounts.find((a) => a.customerId === customerId);
  if (!account) {
    account = {
      id: uid("loyal"), customerId, customerName,
      points: 0, lifetimePoints: 0, tier: "insider",
      tierProgress: 0, nextTierPoints: 500,
      transactions: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    store.loyaltyAccounts.push(account);
  }

  const pointsEarned = Math.round(amount * rate);
  account.points += pointsEarned;
  account.lifetimePoints += pointsEarned;
  account.tierProgress = account.points;
  account.transactions.push({ id: uid("lt"), type: "earn", points: pointsEarned, balance: account.points, reason: `Order ${orderId}`, orderId, rate, createdAt: Date.now() });
  account.updatedAt = Date.now();

  // Update tier based on points
  const tiers = [
    { name: "Insider", minPoints: 0, nextTier: 500 },
    { name: "Silver", minPoints: 500, nextTier: 1500 },
    { name: "Gold", minPoints: 1500, nextTier: 4000 },
    { name: "VIP Atelier", minPoints: 4000, nextTier: Infinity },
  ];

  const currentTier = [...tiers].reverse().find((t) => account!.points >= t.minPoints);
  if (currentTier) {
    account.tier = currentTier.name;
    const nextTierData = tiers.find((t) => t.name === currentTier.name);
    account.nextTierPoints = nextTierData ? nextTierData.nextTier : Infinity;
  }

  saveStore(store);
  return account;
}

export function redeemLoyaltyPoints(customerId: string, points: number, orderId: string): { success: boolean; creditAmount: number; message: string } {
  const account = getLoyaltyAccount(customerId);
  if (!account) return { success: false, creditAmount: 0, message: "No loyalty account found" };
  if (account.points < points) return { success: false, creditAmount: 0, message: `Insufficient points. You have ${account.points} points` };

  const redemptionRate = 0.01; // 100 points = $1
  const creditAmount = Math.round(points * redemptionRate * 100) / 100;

  const store = getStore();
  const idx = store.loyaltyAccounts.findIndex((a) => a.customerId === customerId);
  if (idx === -1) return { success: false, creditAmount: 0, message: "Account not found" };

  store.loyaltyAccounts[idx].points -= points;
  store.loyaltyAccounts[idx].transactions.push({ id: uid("lt"), type: "redeem", points: -points, balance: store.loyaltyAccounts[idx].points, reason: `Redeemed for order ${orderId}`, orderId, rate: redemptionRate, createdAt: Date.now() });
  store.loyaltyAccounts[idx].updatedAt = Date.now();
  saveStore(store);

  // Also award store credit for the redemption
  addStoreCredit(customerId, creditAmount, `Loyalty points redemption (${points} pts)`, orderId);

  return { success: true, creditAmount, message: `Redeemed ${points} points for $${creditAmount} store credit` };
}

/* ================================================================== */
/*  MODULE 8: SUBSCRIPTION ENGINE                                      */
/* ================================================================== */

export function getSubscriptionPlans(): SubscriptionPlan[] {
  return getStore().subscriptionPlans;
}

export function getSubscriptions(customerId?: string): Subscription[] {
  const all = getStore().subscriptions;
  return customerId ? all.filter((s) => s.customerId === customerId) : all;
}

export function createSubscription(planId: string, customerId: string, customerEmail: string): Subscription | null {
  const store = getStore();
  const plan = store.subscriptionPlans.find((p) => p.id === planId && p.active);
  if (!plan) return null;

  const now = Date.now();
  const intervalMs = getIntervalMs(plan.interval, plan.intervalCount);
  const trialEnd = plan.trialDays > 0 ? now + plan.trialDays * 86400000 : undefined;

  const sub: Subscription = {
    id: uid("sub"),
    planId, planName: plan.name,
    customerId, customerEmail,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd || (now + intervalMs),
    trialEnd,
    billingCycles: 0,
    nextOrderDate: trialEnd || (now + intervalMs),
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  store.subscriptions.push(sub);
  saveStore(store);
  pushLog("info", "order", `Subscription created: ${plan.name} for ${customerEmail}`);
  return sub;
}

export function cancelSubscription(id: string, atPeriodEnd = true): Subscription | null {
  const store = getStore();
  const idx = store.subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.subscriptions[idx] = {
    ...store.subscriptions[idx],
    status: atPeriodEnd ? store.subscriptions[idx].status : "cancelled",
    cancelledAt: Date.now(),
    metadata: { ...store.subscriptions[idx].metadata, cancelAtPeriodEnd: String(atPeriodEnd) },
    updatedAt: Date.now(),
  };
  if (!atPeriodEnd) store.subscriptions[idx].nextOrderDate = undefined;
  saveStore(store);
  pushLog("info", "order", `Subscription ${id} ${atPeriodEnd ? "will cancel at period end" : "cancelled immediately"}`);
  return store.subscriptions[idx];
}

export function pauseSubscription(id: string, resumeAt?: number): Subscription | null {
  const store = getStore();
  const idx = store.subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.subscriptions[idx] = {
    ...store.subscriptions[idx],
    status: "paused",
    pauseResumesAt: resumeAt,
    updatedAt: Date.now(),
  };
  saveStore(store);
  return store.subscriptions[idx];
}

export function resumeSubscription(id: string): Subscription | null {
  const store = getStore();
  const idx = store.subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.subscriptions[idx] = {
    ...store.subscriptions[idx],
    status: "active",
    pauseResumesAt: undefined,
    updatedAt: Date.now(),
  };
  saveStore(store);
  return store.subscriptions[idx];
}

function getIntervalMs(interval: SubscriptionInterval, count: number): number {
  const base = interval === "weekly" ? 7 : interval === "monthly" ? 30 : interval === "quarterly" ? 90 : interval === "biannual" ? 180 : 365;
  return base * count * 86400000;
}

/* ================================================================== */
/*  MODULE 9: MULTI-CURRENCY ENGINE                                    */
/* ================================================================== */

export function getCurrencies(): CurrencyConfig[] {
  return getStore().currencies;
}

export function getActiveCurrencies(): CurrencyConfig[] {
  return getStore().currencies.filter((c) => c.active);
}

export function getDefaultCurrency(): CurrencyConfig {
  return getStore().currencies.find((c) => c.isDefault) || getStore().currencies[0];
}

export function convertCurrency(config: Omit<CurrencyConversion, "timestamp">): CurrencyConversion {
  const currencies = getStore().currencies;
  const fromCurrency = currencies.find((c) => c.code === config.from);
  const toCurrency = currencies.find((c) => c.code === config.to);
  if (!fromCurrency || !toCurrency) throw new Error(`Unsupported currency pair: ${config.from} -> ${config.to}`);

  const rate = toCurrency.rate / fromCurrency.rate;
  const convertedAmount = Math.round(config.originalAmount * rate * 100) / 100;
  const feePercent = 0.015; // 1.5% conversion fee
  const fee = Math.round(convertedAmount * feePercent * 100) / 100;

  return {
    ...config,
    rate,
    convertedAmount: convertedAmount + fee,
    fee,
    feePercent,
    timestamp: Date.now(),
  };
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode): string {
  const currencies = getStore().currencies;
  const config = currencies.find((c) => c.code === currencyCode);
  if (!config) return `$${amount.toFixed(2)}`;

  const formatted = amount.toFixed(config.decimals);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator);
  const amountStr = parts.join(config.decimalSeparator);

  return config.symbolPosition === "before"
    ? `${config.symbol}${amountStr}`
    : `${amountStr}${config.symbol}`;
}

/* ================================================================== */
/*  MODULE 10: RETURNS & REFUNDS ENGINE                                */
/* ================================================================== */

export function getReturnPolicies(): ReturnPolicy[] {
  return getStore().returnPolicies;
}

export function createReturnPolicy(input: Omit<ReturnPolicy, "id" | "createdAt">): ReturnPolicy {
  const store = getStore();
  const policy: ReturnPolicy = { ...input, id: uid("rp"), createdAt: Date.now() };
  store.returnPolicies.push(policy);
  saveStore(store);
  return policy;
}

export function evaluateReturn(
  order: Order,
  customer: Customer,
  products: Product[]
): ReturnEvaluation {
  const policies = getStore().returnPolicies;
  const daysSinceDelivery = order.status === "delivered"
    ? Math.floor((Date.now() - order.createdAt) / 86400000)
    : Math.floor((Date.now() - order.createdAt) / 86400000);

  // Determine customer tier for policy selection
  const isVip = customer.status === "vip" || (customer.loyaltyPoints || 0) >= 1500;
  const applicablePolicy = policies.find((p) => {
    if (!p.active) return false;
    // Match VIP or standard
    if (isVip && p.name.toLowerCase().includes("vip")) return true;
    if (!isVip && p.name.toLowerCase().includes("vip")) return false;
    // Match category
    const hasExcludedCategory = order.items.some((item) => {
      const product = products.find((pr) => pr.id === item.productId);
      return product ? p.excludesCategories.includes(product.category) : false;
    });
    if (hasExcludedCategory && p.excludesCategories.length > 0) return false;
    return daysSinceDelivery <= p.returnWindowDays;
  });

  if (!applicablePolicy) {
    return {
      eligible: false, refundAmount: 0, restockingFee: 0, returnShipping: 0,
      totalRefund: 0, refundMethod: "original_payment", policyApplied: "None",
      reasons: ["Return window has expired"], notes: [],
    };
  }

  const refundAmount = order.total;
  const restockingFee = refundAmount * (applicablePolicy.restockingFeePercent / 100);
  const returnShipping = applicablePolicy.returnShippingPaidBy === "customer" ? 15 : 0;
  const totalRefund = Math.round((refundAmount - restockingFee - returnShipping) * 100) / 100;

  return {
    eligible: true,
    refundAmount: Math.round(refundAmount * 100) / 100,
    restockingFee: Math.round(restockingFee * 100) / 100,
    returnShipping,
    totalRefund,
    refundMethod: applicablePolicy.refundMethod,
    policyApplied: applicablePolicy.name,
    reasons: ["Customer requested return"],
    notes: [`Policy: ${applicablePolicy.name} (${applicablePolicy.returnWindowDays}-day window)`, `Restocking fee: ${applicablePolicy.restockingFeePercent}%`],
  };
}

export function processReturnRequest(
  order: Order,
  customer: Customer,
  products: Product[],
  type: ReturnType,
  reason: string,
  comment?: string
): { evaluation: ReturnEvaluation; returnRequest: ReturnRequest } {
  const evaluation = evaluateReturn(order, customer, products);

  const returnRequest: ReturnRequest = {
    id: uid("ret"),
    number: `RT-${Math.floor(100000 + Math.random() * 900000)}`,
    orderId: order.id,
    orderNumber: order.number,
    customer: { name: customer.name, email: customer.email },
    type,
    reason,
    comment,
    status: evaluation.eligible ? "requested" : "rejected",
    refundAmount: evaluation.eligible ? evaluation.totalRefund : 0,
    createdAt: Date.now(),
  };

  writeAuditEntry({
    actor: customer.email, actorType: "user", action: "create",
    entityType: "return", entityId: returnRequest.id, entityName: returnRequest.number,
    detail: `Return ${evaluation.eligible ? "requested" : "rejected"}: ${reason} ($${evaluation.totalRefund})`,
    severity: evaluation.eligible ? "info" : "warning",
    metadata: { orderId: order.id, type },
  });

  return { evaluation, returnRequest };
}

/* ================================================================== */
/*  COMMERCE ENGINE ANALYTICS & STATS                                  */
/* ================================================================== */

export interface CommerceEngineStats {
  activeCheckouts: number;
  activePromotions: number;
  activeSubscriptions: number;
  pendingFulfillments: number;
  totalGiftCards: number;
  giftCardValue: number;
  totalStoreCredit: number;
  totalLoyaltyPoints: number;
  currenciesActive: number;
  taxRulesActive: number;
  paymentTransactions: number;
  refundsProcessed: number;
}

export function getCommerceEngineStats(): CommerceEngineStats {
  const store = getStore();
  return {
    activeCheckouts: store.checkoutSessions.filter((s) => !s.completed).length,
    activePromotions: store.promotions.filter((p) => p.active).length,
    activeSubscriptions: store.subscriptions.filter((s) => s.status === "active").length,
    pendingFulfillments: store.fulfillmentOrders.filter((f) => f.status === "unfulfilled" || f.status === "processing").length,
    totalGiftCards: store.giftCards.filter((g) => g.active).length,
    giftCardValue: store.giftCards.reduce((s, g) => s + g.balance, 0),
    totalStoreCredit: store.storeCreditAccounts.reduce((s, a) => s + a.balance, 0),
    totalLoyaltyPoints: store.loyaltyAccounts.reduce((s, a) => s + a.points, 0),
    currenciesActive: store.currencies.filter((c) => c.active).length,
    taxRulesActive: store.taxRules.filter((r) => r.active).length,
    paymentTransactions: store.paymentTransactions.length,
    refundsProcessed: store.refundRequests.filter((r) => r.status === "completed").length,
  };
}
