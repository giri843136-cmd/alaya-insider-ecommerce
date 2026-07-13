/**
 * ALAYA INSIDER — Enterprise Affiliate Commerce Engine (PART 3.5)
 * ------------------------------------------------------------------
 * Central orchestration for marketplace intelligence, commission management,
 * price monitoring, revenue tracking, conversion optimization, and deep linking.
 *
 * Modules:
 *  1. Marketplace Registry       — network config, status, failover, sync
 *  2. Commission Engine          — rules, categories, forecasting, attribution
 *  3. Price Intelligence         — monitoring, history, alerts, comparison
 *  4. Revenue Intelligence       — dashboards, forecasting, attribution, AI
 *  5. Conversion Platform        — click tracking, attribution, funnels, A/B testing
 *  6. Deep Link Engine           — smart links, geo/device/language routing, cloaking
 *  7. Offer Intelligence         — best offer, coupons, deals, promotions
 *  8. Inventory Intelligence     — availability, restock alerts, forecasting
 */
import { uid } from "./utils";
import type { Product } from "./types";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const AFFILIATE_COMMERCE_KEY = "alaya_affiliate_commerce_v1";
export const DEFAULT_COMMISSION_RATE = 0.05;
export const DEFAULT_COOKIE_DAYS = 30;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type MarketplaceNetwork =
  | "amazon_associates" | "impact" | "cj_affiliate" | "awin"
  | "rakuten" | "shareasale" | "partnerstack" | "clickbank"
  | "custom" | "direct";

export type MarketplaceStatus =
  | "connected" | "disconnected" | "syncing" | "error" | "paused";

export type CommissionType = "percentage" | "fixed" | "tiered" | "performance";

export type DeepLinkType = "smart" | "universal" | "short" | "cloaked";

export type ConversionEvent =
  | "click" | "outbound_click" | "add_to_cart" | "checkout_start"
  | "purchase" | "lead" | "signup" | "install";

export type ABTestVariant = "a" | "b" | "c";

/* ================================================================== */
/*  INTERFACES — Marketplace Registry                                  */
/* ================================================================== */

export interface MarketplaceConfig {
  id: string;
  network: MarketplaceNetwork;
  name: string;
  description: string;
  status: MarketplaceStatus;
  apiEndpoint?: string;
  apiKey?: string;
  apiSecret?: string;
  affiliateId?: string;
  /** Geo availability */
  countries: string[];
  currencies: string[];
  /** Categories / verticals supported */
  verticals: string[];
  /** Commission range */
  minCommission: number;
  maxCommission: number;
  /** Cookie duration in days */
  cookieDays: number;
  /** Payment terms */
  paymentThreshold: number;
  paymentFrequency: "monthly" | "biweekly" | "weekly" | "net_30" | "net_60" | "net_90";
  /** Performance */
  avgConversionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  /** Sync state */
  lastSyncAt?: number;
  lastSyncResult?: string;
  syncIntervalMinutes: number;
  /** Failover */
  failoverPriority: number;
  active: boolean;
  createdAt: number;
}

export interface MarketplaceSyncLog {
  id: string;
  marketplaceId: string;
  marketplaceName: string;
  action: "sync_products" | "sync_orders" | "sync_commissions" | "validate_links";
  status: "running" | "success" | "failed";
  itemsProcessed: number;
  itemsFailed: number;
  message: string;
  startedAt: number;
  completedAt?: number;
}

export interface MarketplaceFailoverRule {
  id: string;
  name: string;
  primaryMarketplaceId: string;
  failoverMarketplaceId: string;
  condition: "timeout" | "error_rate" | "manual" | "region_unavailable";
  threshold: number;
  active: boolean;
  lastTriggeredAt?: number;
}

/* ================================================================== */
/*  INTERFACES — Commission Engine                                     */
/* ================================================================== */

export interface CommissionRule {
  id: string;
  name: string;
  description: string;
  type: CommissionType;
  value: number; // % or fixed amount
  category?: string; // product category filter
  partnerId?: string; // specific partner filter
  minOrderValue: number;
  maxOrderValue?: number;
  /** Tiered commission */
  tiers?: { minRevenue: number; rate: number }[];
  /** Performance bonuses */
  bonusOnConversions?: number; // extra % after N conversions
  bonusThreshold?: number;
  cookieDays: number;
  capAmount?: number; // max commission per sale
  active: boolean;
  priority: number;
  startsAt?: number;
  endsAt?: number;
  createdAt: number;
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  partnerId: string;
  partnerName: string;
  marketplaceId: string;
  marketplaceName: string;
  ruleId?: string;
  ruleName: string;
  saleAmount: number;
  commissionAmount: number;
  commissionRate: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "reversed" | "contested";
  paidAt?: number;
  createdAt: number;
}

export interface CommissionForecast {
  period: string;
  projectedRevenue: number;
  projectedCommission: number;
  projectedOrders: number;
  avgCommissionRate: number;
  confidence: number; // 0-1
  breakdown: { partnerId: string; partnerName: string; revenue: number; commission: number }[];
}

export interface CommissionAnalytics {
  totalCommissionEarned: number;
  totalCommissionPending: number;
  totalCommissionPaid: number;
  avgCommissionRate: number;
  topPerformingPartner: string;
  commissionByPartner: { partnerId: string; partnerName: string; earned: number; paid: number; pending: number }[];
  commissionByCategory: { category: string; earned: number; orderCount: number }[];
  commissionTrend: { date: string; earned: number }[];
}

/* ================================================================== */
/*  INTERFACES — Price Intelligence                                    */
/* ================================================================== */

export interface PriceRecord {
  id: string;
  productId: string;
  productName: string;
  marketplaceId: string;
  marketplaceName: string;
  price: number;
  currency: string;
  inStock: boolean;
  url: string;
  recordedAt: number;
}

export interface PriceHistory {
  productId: string;
  productName: string;
  records: { date: string; price: number; marketplaceId: string }[];
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceChangePercent: number;
  lastUpdated: number;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  type: "price_drop" | "price_increase" | "restock" | "deal_expiry";
  threshold?: number; // price threshold for drop/increase
  active: boolean;
  triggered: boolean;
  triggeredAt?: number;
  emailNotify: boolean;
  createdAt: number;
}

export interface PriceComparison {
  productId: string;
  productName: string;
  offers: {
    marketplaceId: string;
    marketplaceName: string;
    price: number;
    currency: string;
    inStock: boolean;
    url: string;
    shipping?: number;
    totalPrice: number;
    rating?: number;
  }[];
  bestPrice: number;
  bestMarketplace: string;
  savingsPercent: number;
}

/* ================================================================== */
/*  INTERFACES — Revenue Intelligence                                  */
/* ================================================================== */

export interface RevenueRecord {
  id: string;
  date: string;
  source: "affiliate" | "direct" | "referral" | "marketplace";
  marketplaceId?: string;
  partnerId?: string;
  amount: number;
  currency: string;
  orderCount: number;
  orderIds: string[];
}

export interface RevenueForecast {
  currentMonth: number;
  nextMonth: number;
  thisQuarter: number;
  nextQuarter: number;
  growthRate: number;
  confidence: number; // 0-1
}

export interface RevenueAttribution {
  channel: string;
  revenue: number;
  orders: number;
  conversionRate: number;
  attributedTo: "direct" | "affiliate" | "organic_search" | "social" | "email" | "referral";
  touchpoints: number;
  lastClick: boolean;
}

/* ================================================================== */
/*  INTERFACES — Conversion Platform                                   */
/* ================================================================== */

export interface ClickEvent {
  id: string;
  productId: string;
  productName: string;
  partnerId?: string;
  marketplaceId?: string;
  linkType: DeepLinkType;
  url: string;
  referrer?: string;
  country?: string;
  deviceType?: "mobile" | "desktop" | "tablet";
  converted: boolean;
  conversionValue?: number;
  timestamp: number;
}

export interface ConversionFunnel {
  stage: "impression" | "click" | "outbound" | "cart_add" | "checkout" | "purchase";
  count: number;
  rate: number; // conversion rate from previous stage
  dropOff: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  elementType: "cta" | "button" | "layout" | "recommendation" | "marketplace";
  variants: {
    id: ABTestVariant;
    label: string;
    config: Record<string, string>;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
  status: "draft" | "running" | "paused" | "completed";
  winner?: ABTestVariant;
  confidenceLevel?: number;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

/* ================================================================== */
/*  INTERFACES — Deep Link Engine                                      */
/* ================================================================== */

export interface DeepLink {
  id: string;
  originalUrl: string;
  cloakedUrl?: string;
  shortUrl?: string;
  type: DeepLinkType;
  productId?: string;
  marketplaceId?: string;
  partnerId?: string;
  geoRules: { country: string; url: string }[];
  deviceRules: { device: "mobile" | "desktop" | "tablet"; url: string }[];
  languageRules: { language: string; url: string }[];
  currencyRules: { currency: string; url: string }[];
  defaultUrl: string;
  clicks: number;
  conversions: number;
  active: boolean;
  createdAt: number;
}

export interface LinkHealth {
  id: string;
  url: string;
  statusCode: number;
  lastChecked: number;
  healthy: boolean;
  responseTime: number;
  error?: string;
}

/* ================================================================== */
/*  INTERFACES — Offer Intelligence                                    */
/* ================================================================== */

export interface Offer {
  id: string;
  productId: string;
  marketplaceId: string;
  type: "coupon" | "promotion" | "deal" | "lightning_deal" | "limited_time" | "bundle";
  title: string;
  description: string;
  discountPercent?: number;
  discountFixed?: number;
  couponCode?: string;
  minSpend?: number;
  startsAt: number;
  endsAt: number;
  active: boolean;
  claimedCount: number;
  maxClaims?: number;
}

/* ================================================================== */
/*  INTERFACES — Inventory Intelligence                                */
/* ================================================================== */

export interface InventorySnapshot {
  productId: string;
  productName: string;
  marketplaceId: string;
  inStock: boolean;
  stockLevel?: number;
  price: number;
  currency: string;
  lastChecked: number;
}

export interface RestockAlert {
  id: string;
  productId: string;
  productName: string;
  marketplaceId: string;
  email: string;
  notified: boolean;
  createdAt: number;
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface AffiliateCommerceStore {
  marketplaces: MarketplaceConfig[];
  syncLogs: MarketplaceSyncLog[];
  failoverRules: MarketplaceFailoverRule[];
  commissionRules: CommissionRule[];
  commissionRecords: CommissionRecord[];
  commissionAnalytics: CommissionAnalytics;
  priceHistory: PriceHistory[];
  priceAlerts: PriceAlert[];
  clickEvents: ClickEvent[];
  abTests: ABTest[];
  deepLinks: DeepLink[];
  offers: Offer[];
  restockAlerts: RestockAlert[];
  revenueRecords: RevenueRecord[];
}

function getStore(): AffiliateCommerceStore {
  try {
    const raw = localStorage.getItem(AFFILIATE_COMMERCE_KEY);
    if (raw) return JSON.parse(raw) as AffiliateCommerceStore;
  } catch { /* ignore */ }
  return {
    marketplaces: [], syncLogs: [], failoverRules: [],
    commissionRules: [], commissionRecords: [], commissionAnalytics: {
      totalCommissionEarned: 0, totalCommissionPending: 0, totalCommissionPaid: 0,
      avgCommissionRate: 0, topPerformingPartner: "", commissionByPartner: [],
      commissionByCategory: [], commissionTrend: [],
    },
    priceHistory: [], priceAlerts: [], clickEvents: [], abTests: [],
    deepLinks: [], offers: [], restockAlerts: [], revenueRecords: [],
  };
}

function saveStore(store: AffiliateCommerceStore) {
  try { localStorage.setItem(AFFILIATE_COMMERCE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedAffiliateCommerce() {
  const store = getStore();
  if (store.marketplaces.length > 0) return;

  const now = Date.now();

  /* ---- Marketplaces ---- */
  const marketplaces: MarketplaceConfig[] = [
    { id: "mp_amazon", network: "amazon_associates", name: "Amazon Associates", description: "Global marketplace with extensive product catalogue", status: "connected", countries: ["United States", "Canada", "United Kingdom", "Germany", "France", "Italy", "Spain", "Australia", "India", "Japan"], currencies: ["USD", "CAD", "GBP", "EUR", "AUD", "INR", "JPY"], verticals: ["all"], minCommission: 0.01, maxCommission: 0.10, cookieDays: 24, paymentThreshold: 10, paymentFrequency: "monthly", avgConversionRate: 0.042, totalClicks: 2840, totalConversions: 142, totalRevenue: 42680, syncIntervalMinutes: 60, failoverPriority: 1, active: true, createdAt: now - 180 * 86400000 },
    { id: "mp_farfetch", network: "custom", name: "Farfetch", description: "Luxury fashion marketplace with global delivery", status: "connected", countries: ["United States", "United Kingdom", "European Union", "Australia", "Canada"], currencies: ["USD", "GBP", "EUR", "AUD", "CAD"], verticals: ["fashion", "accessories", "footwear"], minCommission: 0.03, maxCommission: 0.08, cookieDays: 30, paymentThreshold: 50, paymentFrequency: "net_60", avgConversionRate: 0.045, totalClicks: 1950, totalConversions: 88, totalRevenue: 23400, syncIntervalMinutes: 120, failoverPriority: 2, active: true, createdAt: now - 120 * 86400000 },
    { id: "mp_ssense", network: "custom", name: "SSENSE", description: "Luxury streetwear and contemporary fashion", status: "connected", countries: ["United States", "Canada"], currencies: ["USD", "CAD"], verticals: ["fashion", "streetwear", "accessories"], minCommission: 0.02, maxCommission: 0.07, cookieDays: 30, paymentThreshold: 50, paymentFrequency: "net_30", avgConversionRate: 0.042, totalClicks: 1240, totalConversions: 52, totalRevenue: 12460, syncIntervalMinutes: 120, failoverPriority: 3, active: true, createdAt: now - 90 * 86400000 },
    { id: "mp_mytheresa", network: "custom", name: "MyTheresa", description: "Premium luxury fashion and lifestyle", status: "connected", countries: ["United States", "United Kingdom", "European Union"], currencies: ["USD", "GBP", "EUR"], verticals: ["fashion", "accessories", "footwear", "beauty"], minCommission: 0.03, maxCommission: 0.08, cookieDays: 30, paymentThreshold: 100, paymentFrequency: "net_60", avgConversionRate: 0.042, totalClicks: 980, totalConversions: 41, totalRevenue: 9430, syncIntervalMinutes: 120, failoverPriority: 4, active: true, createdAt: now - 60 * 86400000 },
    { id: "mp_netaporter", network: "custom", name: "NET-A-PORTER", description: "Curated luxury fashion destination", status: "syncing", countries: ["United States", "United Kingdom", "European Union", "Australia", "China"], currencies: ["USD", "GBP", "EUR", "AUD", "CNY"], verticals: ["fashion", "accessories", "beauty", "home"], minCommission: 0.03, maxCommission: 0.09, cookieDays: 30, paymentThreshold: 50, paymentFrequency: "net_60", avgConversionRate: 0.05, totalClicks: 2340, totalConversions: 117, totalRevenue: 35100, syncIntervalMinutes: 60, failoverPriority: 1, active: true, createdAt: now - 150 * 86400000 },
    { id: "mp_rakuten", network: "rakuten", name: "Rakuten Advertising", description: "Global affiliate network with diverse merchant base", status: "disconnected", countries: ["United States", "Japan", "European Union"], currencies: ["USD", "JPY", "EUR"], verticals: ["all"], minCommission: 0.01, maxCommission: 0.20, cookieDays: 30, paymentThreshold: 50, paymentFrequency: "monthly", avgConversionRate: 0.035, totalClicks: 0, totalConversions: 0, totalRevenue: 0, syncIntervalMinutes: 240, failoverPriority: 10, active: false, createdAt: now - 30 * 86400000 },
  ];

  /* ---- Commission Rules ---- */
  const commissionRules: CommissionRule[] = [
    { id: "cr_standard", name: "Standard Commission", description: "Standard 5% commission on all product sales", type: "percentage", value: 5, minOrderValue: 0, cookieDays: 30, active: true, priority: 10, createdAt: now - 180 * 86400000 },
    { id: "cr_luxury", name: "Luxury Premium", description: "8% commission on luxury category products", type: "percentage", value: 8, category: "luxury", minOrderValue: 200, cookieDays: 45, active: true, priority: 20, createdAt: now - 180 * 86400000 },
    { id: "cr_volume", name: "Volume Performer", description: "Tiered commission up to 12% for high-volume partners", type: "tiered", value: 7, tiers: [{ minRevenue: 5000, rate: 7 }, { minRevenue: 15000, rate: 10 }, { minRevenue: 30000, rate: 12 }], minOrderValue: 0, cookieDays: 30, active: true, priority: 15, createdAt: now - 150 * 86400000 },
    { id: "cr_fixed", name: "Fixed Fee Campaign", description: "Fixed $15 per qualifying sale for select partners", type: "fixed", value: 15, minOrderValue: 100, maxOrderValue: 500, cookieDays: 30, active: true, priority: 25, createdAt: now - 120 * 86400000 },
    { id: "cr_new_partner", name: "New Partner Boost", description: "10% commission for first 30 days", type: "percentage", value: 10, minOrderValue: 0, cookieDays: 30, active: true, priority: 30, createdAt: now - 90 * 86400000 },
  ];

  /* ---- Commission Records ---- */
  const commissionRecords: CommissionRecord[] = [
    { id: "cm_1", orderId: "ord_1", orderNumber: "AL-481203", productId: "prod_17", productName: "Amber Oud Eau de Parfum", partnerId: "aff_1", partnerName: "NET-A-PORTER", marketplaceId: "mp_netaporter", marketplaceName: "NET-A-PORTER", ruleId: "cr_standard", ruleName: "Standard Commission", saleAmount: 245, commissionAmount: 12.25, commissionRate: 5, currency: "USD", status: "paid", paidAt: now - 5 * 86400000, createdAt: now - 30 * 86400000 },
    { id: "cm_2", orderId: "ord_2", orderNumber: "AL-481488", productId: "prod_18", productName: "Velvet Tuberose Candle", partnerId: "aff_2", partnerName: "Farfetch", marketplaceId: "mp_farfetch", marketplaceName: "Farfetch", ruleId: "cr_standard", ruleName: "Standard Commission", saleAmount: 98, commissionAmount: 4.90, commissionRate: 5, currency: "USD", status: "paid", paidAt: now - 2 * 86400000, createdAt: now - 25 * 86400000 },
    { id: "cm_3", orderId: "ord_3", orderNumber: "AL-482134", productId: "prod_19", productName: "Italian Leather Tote", partnerId: "aff_1", partnerName: "NET-A-PORTER", marketplaceId: "mp_netaporter", marketplaceName: "NET-A-PORTER", ruleId: "cr_luxury", ruleName: "Luxury Premium", saleAmount: 890, commissionAmount: 71.20, commissionRate: 8, currency: "USD", status: "approved", createdAt: now - 14 * 86400000 },
    { id: "cm_4", orderId: "ord_4", orderNumber: "AL-482567", productId: "prod_20", productName: "Cashmere Oversized Scarf", partnerId: "aff_3", partnerName: "SSENSE", marketplaceId: "mp_ssense", marketplaceName: "SSENSE", ruleId: "cr_standard", ruleName: "Standard Commission", saleAmount: 145, commissionAmount: 7.25, commissionRate: 5, currency: "USD", status: "pending", createdAt: now - 7 * 86400000 },
    { id: "cm_5", orderId: "ord_5", orderNumber: "AL-482890", productId: "prod_21", productName: "Silk Evening Dress", partnerId: "aff_4", partnerName: "MyTheresa", marketplaceId: "mp_mytheresa", marketplaceName: "MyTheresa", ruleId: "cr_standard", ruleName: "Standard Commission", saleAmount: 520, commissionAmount: 26.00, commissionRate: 5, currency: "USD", status: "pending", createdAt: now - 3 * 86400000 },
  ];

  /* ---- Price History ---- */
  const priceHistory: PriceHistory[] = [
    {
      productId: "prod_17", productName: "Amber Oud Eau de Parfum",
      records: [
        { date: new Date(now - 90 * 86400000).toISOString().slice(0, 10), price: 260, marketplaceId: "mp_netaporter" },
        { date: new Date(now - 60 * 86400000).toISOString().slice(0, 10), price: 250, marketplaceId: "mp_netaporter" },
        { date: new Date(now - 30 * 86400000).toISOString().slice(0, 10), price: 245, marketplaceId: "mp_netaporter" },
        { date: new Date(now).toISOString().slice(0, 10), price: 245, marketplaceId: "mp_netaporter" },
      ],
      currentPrice: 245, lowestPrice: 235, highestPrice: 260, averagePrice: 248, priceChangePercent: -5.8, lastUpdated: now,
    },
    {
      productId: "prod_19", productName: "Italian Leather Tote",
      records: [
        { date: new Date(now - 120 * 86400000).toISOString().slice(0, 10), price: 950, marketplaceId: "mp_netaporter" },
        { date: new Date(now - 60 * 86400000).toISOString().slice(0, 10), price: 920, marketplaceId: "mp_netaporter" },
        { date: new Date(now - 30 * 86400000).toISOString().slice(0, 10), price: 890, marketplaceId: "mp_netaporter" },
        { date: new Date(now).toISOString().slice(0, 10), price: 890, marketplaceId: "mp_netaporter" },
      ],
      currentPrice: 890, lowestPrice: 850, highestPrice: 950, averagePrice: 905, priceChangePercent: -6.3, lastUpdated: now,
    },
  ];

  /* ---- A/B Tests ---- */
  const abTests: ABTest[] = [
    {
      id: "ab_cta_btn", name: "CTA Button Colour Test", description: "Testing dark vs accent CTA buttons on affiliate cards",
      elementType: "button", variants: [
        { id: "a", label: "Dark button", config: { style: "btn-dark" }, impressions: 1240, clicks: 186, conversions: 28, revenue: 4200 },
        { id: "b", label: "Accent button", config: { style: "btn-accent" }, impressions: 1180, clicks: 212, conversions: 34, revenue: 5100 },
      ], status: "running", startedAt: now - 14 * 86400000, createdAt: now - 14 * 86400000,
    },
    {
      id: "ab_layout", name: "Product Card Layout Test", description: "Testing vertical vs horizontal product cards in affiliate feed",
      elementType: "layout", variants: [
        { id: "a", label: "Vertical cards", config: { layout: "vertical" }, impressions: 890, clicks: 107, conversions: 14, revenue: 2100 },
        { id: "b", label: "Horizontal cards", config: { layout: "horizontal" }, impressions: 920, clicks: 138, conversions: 19, revenue: 2850 },
      ], status: "completed", winner: "b", confidenceLevel: 0.95, startedAt: now - 30 * 86400000, completedAt: now - 7 * 86400000, createdAt: now - 30 * 86400000,
    },
  ];

  /* ---- Deep Links ---- */
  const deepLinks: DeepLink[] = [
    {
      id: "dl_1", originalUrl: "https://www.net-a-porter.com/product/amber-oud", cloakedUrl: "https://go.alayainsider.com/nap/amber-oud",
      shortUrl: "https://alya.ai/nap-ao", type: "cloaked", productId: "prod_17", marketplaceId: "mp_netaporter",
      geoRules: [{ country: "US", url: "https://www.net-a-porter.com/us/en/product/amber-oud" }, { country: "GB", url: "https://www.net-a-porter.com/gb/en/product/amber-oud" }],
      deviceRules: [], languageRules: [], currencyRules: [],
      defaultUrl: "https://www.net-a-porter.com/product/amber-oud", clicks: 245, conversions: 12, active: true, createdAt: now - 45 * 86400000,
    },
  ];

  /* ---- Offers ---- */
  const offers: Offer[] = [
    { id: "off_1", productId: "prod_17", marketplaceId: "mp_netaporter", type: "limited_time", title: "Luxury Fragrance Event", description: "20% off select luxury fragrances for a limited time", discountPercent: 20, startsAt: now - 5 * 86400000, endsAt: now + 25 * 86400000, active: true, claimedCount: 34, maxClaims: 200 },
    { id: "off_2", productId: "prod_19", marketplaceId: "mp_farfetch", type: "lightning_deal", title: "Lightning Deal: Italian Leather", description: "Flash sale on Italian leather handbags — while stock lasts", discountPercent: 15, startsAt: now - 2 * 86400000, endsAt: now + 86400000, active: true, claimedCount: 18, maxClaims: 50 },
    { id: "off_3", productId: "prod_18", marketplaceId: "mp_ssense", type: "coupon", title: "First Order Discount", description: "10% off your first SSENSE order", discountPercent: 10, couponCode: "ALAYA10", minSpend: 100, startsAt: now - 90 * 86400000, endsAt: now + 270 * 86400000, active: true, claimedCount: 47 },
  ];

  store.marketplaces = marketplaces;
  store.commissionRules = commissionRules;
  store.commissionRecords = commissionRecords;
  store.priceHistory = priceHistory;
  store.abTests = abTests;
  store.deepLinks = deepLinks;
  store.offers = offers;
  saveStore(store);
}

seedAffiliateCommerce();

/* ================================================================== */
/*  MODULE 1: MARKETPLACE REGISTRY                                     */
/* ================================================================== */

export function getMarketplaces(): MarketplaceConfig[] {
  return getStore().marketplaces;
}

export function getActiveMarketplaces(): MarketplaceConfig[] {
  return getStore().marketplaces.filter((m) => m.active && m.status !== "disconnected");
}

export function getMarketplace(id: string): MarketplaceConfig | undefined {
  return getStore().marketplaces.find((m) => m.id === id);
}

export function addMarketplace(input: Omit<MarketplaceConfig, "id" | "createdAt" | "totalClicks" | "totalConversions" | "totalRevenue">): MarketplaceConfig {
  const store = getStore();
  const mp: MarketplaceConfig = { ...input, id: uid("mp"), totalClicks: 0, totalConversions: 0, totalRevenue: 0, createdAt: Date.now() };
  store.marketplaces.push(mp);
  saveStore(store);
  return mp;
}

export function updateMarketplace(id: string, patch: Partial<MarketplaceConfig>): MarketplaceConfig | null {
  const store = getStore();
  const idx = store.marketplaces.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.marketplaces[idx] = { ...store.marketplaces[idx], ...patch };
  saveStore(store);
  return store.marketplaces[idx];
}

export function deleteMarketplace(id: string): boolean {
  const store = getStore();
  store.marketplaces = store.marketplaces.filter((m) => m.id !== id);
  saveStore(store);
  return true;
}

export function syncMarketplace(id: string): MarketplaceSyncLog {
  const store = getStore();
  const mp = store.marketplaces.find((m) => m.id === id);
  const log: MarketplaceSyncLog = {
    id: uid("sync"), marketplaceId: id, marketplaceName: mp?.name || "Unknown",
    action: "sync_products", status: "running", itemsProcessed: 0, itemsFailed: 0,
    message: "Sync started", startedAt: Date.now(),
  };
  store.syncLogs.push(log);
  if (mp) {
    mp.status = "syncing";
    mp.lastSyncAt = Date.now();
  }
  saveStore(store);

  // Simulate sync completion
  setTimeout(() => {
    const current = getStore();
    const logIdx = current.syncLogs.findIndex((l) => l.id === log.id);
    if (logIdx !== -1) {
      current.syncLogs[logIdx].status = "success";
      current.syncLogs[logIdx].itemsProcessed = Math.floor(Math.random() * 50) + 10;
      current.syncLogs[logIdx].message = "Sync completed successfully";
      current.syncLogs[logIdx].completedAt = Date.now();
    }
    const mpIdx = current.marketplaces.findIndex((m) => m.id === id);
    if (mpIdx !== -1) {
      current.marketplaces[mpIdx].status = "connected";
      current.marketplaces[mpIdx].lastSyncResult = "success";
    }
    saveStore(current);
  }, 2000);

  return log;
}

export function getSyncLogs(limit = 20): MarketplaceSyncLog[] {
  return getStore().syncLogs.slice(0, limit);
}

export function getFailoverRules(): MarketplaceFailoverRule[] {
  return getStore().failoverRules;
}

export function addFailoverRule(input: Omit<MarketplaceFailoverRule, "id">): MarketplaceFailoverRule {
  const store = getStore();
  const rule: MarketplaceFailoverRule = { ...input, id: uid("fo") };
  store.failoverRules.push(rule);
  saveStore(store);
  return rule;
}

export function deleteFailoverRule(id: string): boolean {
  const store = getStore();
  store.failoverRules = store.failoverRules.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  MODULE 2: COMMISSION ENGINE                                        */
/* ================================================================== */

export function getCommissionRules(): CommissionRule[] {
  return getStore().commissionRules;
}

export function addCommissionRule(input: Omit<CommissionRule, "id" | "createdAt">): CommissionRule {
  const store = getStore();
  const rule: CommissionRule = { ...input, id: uid("cr"), createdAt: Date.now() };
  store.commissionRules.push(rule);
  saveStore(store);
  return rule;
}

export function updateCommissionRule(id: string, patch: Partial<CommissionRule>): CommissionRule | null {
  const store = getStore();
  const idx = store.commissionRules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.commissionRules[idx] = { ...store.commissionRules[idx], ...patch };
  saveStore(store);
  return store.commissionRules[idx];
}

export function deleteCommissionRule(id: string): boolean {
  const store = getStore();
  store.commissionRules = store.commissionRules.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

export function calculateCommission(
  saleAmount: number,
  product: Product,
  partnerId?: string,
  _marketplaceId?: string
): { rule: CommissionRule; commissionAmount: number } | null {
  const rules = getStore().commissionRules
    .filter((r) => r.active && (!r.endsAt || r.endsAt > Date.now()))
    .sort((a, b) => b.priority - a.priority);

  for (const rule of rules) {
    if (rule.minOrderValue > saleAmount) continue;
    if (rule.maxOrderValue && saleAmount > rule.maxOrderValue) continue;
    if (rule.partnerId && rule.partnerId !== partnerId) continue;
    if (rule.category && rule.category !== product.category) continue;

    let commissionAmount = 0;
    if (rule.type === "percentage") {
      commissionAmount = saleAmount * (rule.value / 100);
    } else if (rule.type === "fixed") {
      commissionAmount = rule.value;
    } else if (rule.type === "tiered" && rule.tiers) {
      const matchingTier = [...rule.tiers].sort((a, b) => b.minRevenue - a.minRevenue)
        .find((t) => saleAmount >= t.minRevenue);
      if (matchingTier) {
        commissionAmount = saleAmount * (matchingTier.rate / 100);
      } else {
        commissionAmount = saleAmount * (rule.value / 100);
      }
    }

    if (rule.capAmount) commissionAmount = Math.min(commissionAmount, rule.capAmount);
    return { rule, commissionAmount: Math.round(commissionAmount * 100) / 100 };
  }
  return null;
}

export function recordCommission(input: Omit<CommissionRecord, "id" | "createdAt">): CommissionRecord {
  const store = getStore();
  const record: CommissionRecord = { ...input, id: uid("cm"), createdAt: Date.now() };
  store.commissionRecords.push(record);
  saveStore(store);
  return record;
}

export function getCommissionRecords(partnerId?: string, status?: CommissionRecord["status"]): CommissionRecord[] {
  let records = getStore().commissionRecords;
  if (partnerId) records = records.filter((r) => r.partnerId === partnerId);
  if (status) records = records.filter((r) => r.status === status);
  return records;
}

export function updateCommissionStatus(id: string, status: CommissionRecord["status"], paidAt?: number): CommissionRecord | null {
  const store = getStore();
  const idx = store.commissionRecords.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.commissionRecords[idx] = { ...store.commissionRecords[idx], status, paidAt: paidAt || store.commissionRecords[idx].paidAt };
  saveStore(store);
  return store.commissionRecords[idx];
}

export function getCommissionForecast(): CommissionForecast {
  const records = getStore().commissionRecords;
  const totalRevenue = records.reduce((s, r) => s + r.saleAmount, 0);
  const totalCommission = records.reduce((s, r) => s + r.commissionAmount, 0);
  const avgRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

  // Group by partner
  const byPartner = new Map<string, { name: string; revenue: number; commission: number }>();
  records.forEach((r) => {
    const existing = byPartner.get(r.partnerId) || { name: r.partnerName, revenue: 0, commission: 0 };
    existing.revenue += r.saleAmount;
    existing.commission += r.commissionAmount;
    byPartner.set(r.partnerId, existing);
  });

  return {
    period: "next_30_days",
    projectedRevenue: Math.round(totalRevenue * 1.15),
    projectedCommission: Math.round(totalCommission * 1.15 * 100) / 100,
    projectedOrders: records.length + Math.round(records.length * 0.15),
    avgCommissionRate: Math.round(avgRate * 10) / 10,
    confidence: 0.72,
    breakdown: Array.from(byPartner.entries()).map(([partnerId, data]) => ({
      partnerId, partnerName: (data as any).name, revenue: data.revenue, commission: data.commission,
    } as { partnerId: string; partnerName: string; revenue: number; commission: number })),
  };
}

export function getCommissionAnalytics(): CommissionAnalytics {
  const store = getStore();
  const records = store.commissionRecords;

  const byPartner = new Map<string, { name: string; earned: number; paid: number; pending: number }>();
  records.forEach((r) => {
    const existing = byPartner.get(r.partnerId) || { name: r.partnerName, earned: 0, paid: 0, pending: 0 };
    existing.earned += r.commissionAmount;
    if (r.status === "paid") existing.paid += r.commissionAmount;
    if (r.status === "pending" || r.status === "approved") existing.pending += r.commissionAmount;
    byPartner.set(r.partnerId, existing);
  });

  const byCategory = new Map<string, { earned: number; orderCount: number }>();
  records.forEach((r) => {
    const existing = byCategory.get(r.ruleName) || { earned: 0, orderCount: 0 };
    existing.earned += r.commissionAmount;
    existing.orderCount += 1;
    byCategory.set(r.ruleName, existing);
  });

  const totalEarned = records.reduce((s, r) => s + r.commissionAmount, 0);
  const totalPending = records.filter((r) => r.status === "pending" || r.status === "approved").reduce((s, r) => s + r.commissionAmount, 0);
  const totalPaid = records.filter((r) => r.status === "paid").reduce((s, r) => s + r.commissionAmount, 0);

  return {
    totalCommissionEarned: totalEarned,
    totalCommissionPending: totalPending,
    totalCommissionPaid: totalPaid,
    avgCommissionRate: totalEarned > 0 ? Math.round((totalEarned / records.length) * 10) / 10 : 0,
    topPerformingPartner: records.length > 0 ? records.sort((a, b) => b.commissionAmount - a.commissionAmount)[0].partnerName : "",
    commissionByPartner: Array.from(byPartner.entries()).map(([partnerId, data]) => ({
      partnerId,
      partnerName: data.name,
      earned: data.earned,
      paid: data.paid,
      pending: data.pending,
    })),
    commissionByCategory: Array.from(byCategory.entries()).map(([category, data]) => ({ category, ...data })),
    commissionTrend: [],
  };
}

/* ================================================================== */
/*  MODULE 3: PRICE INTELLIGENCE                                       */
/* ================================================================== */

export function getPriceHistory(productId?: string): PriceHistory[] {
  const all = getStore().priceHistory;
  return productId ? all.filter((p) => p.productId === productId) : all;
}

export function recordPrice(productId: string, productName: string, marketplaceId: string, marketplaceName: string, price: number, currency: string, inStock: boolean, url: string): PriceRecord {
  const store = getStore();
  const record: PriceRecord = { id: uid("prc"), productId, productName, marketplaceId, marketplaceName, price, currency, inStock, url, recordedAt: Date.now() };
  const existing = store.priceHistory.find((p: { productId: string }) => p.productId === productId);
  if (existing) {
    existing.records.push({ date: new Date().toISOString().slice(0, 10), price, marketplaceId });
    existing.currentPrice = price;
    existing.priceChangePercent = Math.round(((price - existing.records[0].price) / existing.records[0].price) * 100 * 10) / 10;
    existing.lastUpdated = Date.now();
  } else {
    const newEntry: { date: string; price: number; marketplaceId: string }[] = [{ date: new Date().toISOString().slice(0, 10), price, marketplaceId }];
    store.priceHistory.push({
      productId, productName,
      records: newEntry,
      currentPrice: price, lowestPrice: price, highestPrice: price, averagePrice: price,
      priceChangePercent: 0, lastUpdated: Date.now(),
    });
  }
  saveStore(store);
  return record;
}

export function comparePrices(productId: string, products: Product[], marketplaces: MarketplaceConfig[]): PriceComparison {
  const product = products.find((p) => p.id === productId);
  const offers = marketplaces
    .filter((m) => m.active)
    .map((m) => ({
      marketplaceId: m.id,
      marketplaceName: m.name,
      price: product ? product.salePrice ?? product.price : 0,
      currency: m.currencies[0] || "USD",
      inStock: product ? product.stock > 0 || !!product.affiliate : false,
      url: product?.affiliateUrl || "#",
      totalPrice: product ? (product.salePrice ?? product.price) : 0,
    }));

  const bestOffer = offers.length > 0 ? offers.reduce((best, o) => o.price < best.price ? o : best, offers[0]) : null;
  const bestPrice = bestOffer?.price || 0;
  const avgPrice = offers.length > 0 ? offers.reduce((s, o) => s + o.price, 0) / offers.length : 0;

  return {
    productId,
    productName: product?.name || "",
    offers,
    bestPrice,
    bestMarketplace: bestOffer?.marketplaceName || "",
    savingsPercent: avgPrice > 0 ? Math.round(((avgPrice - bestPrice) / avgPrice) * 100) : 0,
  };
}

export function getPriceAlerts(): PriceAlert[] {
  return getStore().priceAlerts;
}

export function addPriceAlert(input: Omit<PriceAlert, "id" | "triggered" | "createdAt">): PriceAlert {
  const store = getStore();
  const alert: PriceAlert = { ...input, id: uid("pal"), triggered: false, createdAt: Date.now() };
  store.priceAlerts.push(alert);
  saveStore(store);
  return alert;
}

export function deletePriceAlert(id: string): boolean {
  const store = getStore();
  store.priceAlerts = store.priceAlerts.filter((a) => a.id !== id);
  saveStore(store);
  return true;
}

export function checkPriceAlerts(productId: string, currentPrice: number): PriceAlert[] {
  const store = getStore();
  const triggered: PriceAlert[] = [];
  for (const alert of store.priceAlerts) {
    if (alert.productId !== productId || !alert.active || alert.triggered) continue;
    if (alert.type === "price_drop" && currentPrice <= (alert.threshold || 0)) {
      alert.triggered = true;
      alert.triggeredAt = Date.now();
      triggered.push(alert);
    }
    if (alert.type === "price_increase" && currentPrice >= (alert.threshold || Infinity)) {
      alert.triggered = true;
      alert.triggeredAt = Date.now();
      triggered.push(alert);
    }
  }
  saveStore(store);
  return triggered;
}

/* ================================================================== */
/*  MODULE 4: REVENUE INTELLIGENCE                                     */
/* ================================================================== */

export function getRevenueRecords(): RevenueRecord[] {
  return getStore().revenueRecords;
}

export function addRevenueRecord(input: Omit<RevenueRecord, "id">): RevenueRecord {
  const store = getStore();
  const record: RevenueRecord = { ...input, id: uid("rev") };
  store.revenueRecords.push(record);
  saveStore(store);
  return record;
}

export function getRevenueForecast(): RevenueForecast {
  const records = getStore().revenueRecords;
  const totalRevenue = records.reduce((s, r) => s + r.amount, 0);
  const monthlyAvg = records.length > 0 ? totalRevenue / Math.max(1, Math.ceil(records.length / 30)) : 0;
  return {
    currentMonth: Math.round(monthlyAvg),
    nextMonth: Math.round(monthlyAvg * 1.1),
    thisQuarter: Math.round(monthlyAvg * 3),
    nextQuarter: Math.round(monthlyAvg * 3 * 1.12),
    growthRate: 12,
    confidence: 0.68,
  };
}

export function getRevenueAttribution(): RevenueAttribution[] {
  return [
    { channel: "Direct Affiliate Links", revenue: 52300, orders: 195, conversionRate: 0.048, attributedTo: "affiliate", touchpoints: 1, lastClick: true },
    { channel: "Organic Search", revenue: 28400, orders: 112, conversionRate: 0.035, attributedTo: "organic_search", touchpoints: 3, lastClick: false },
    { channel: "Email Campaigns", revenue: 15800, orders: 68, conversionRate: 0.062, attributedTo: "email", touchpoints: 2, lastClick: true },
    { channel: "Social Media", revenue: 12400, orders: 45, conversionRate: 0.028, attributedTo: "social", touchpoints: 4, lastClick: false },
    { channel: "Referral Program", revenue: 8900, orders: 32, conversionRate: 0.072, attributedTo: "referral", touchpoints: 1, lastClick: true },
  ];
}

/* ================================================================== */
/*  MODULE 5: CONVERSION PLATFORM                                      */
/* ================================================================== */

export function trackClick(input: Omit<ClickEvent, "id" | "timestamp">): ClickEvent {
  const store = getStore();
  const event: ClickEvent = { ...input, id: uid("clk"), timestamp: Date.now() };
  store.clickEvents.push(event);
  saveStore(store);
  return event;
}

export function getClickEvents(limit = 100): ClickEvent[] {
  return getStore().clickEvents.slice(0, limit);
}

export function getConversionFunnel(): ConversionFunnel[] {
  return [
    { stage: "impression", count: 10000, rate: 1, dropOff: 0 },
    { stage: "click", count: 1240, rate: 0.124, dropOff: 8760 },
    { stage: "outbound", count: 890, rate: 0.718, dropOff: 350 },
    { stage: "cart_add", count: 520, rate: 0.584, dropOff: 370 },
    { stage: "checkout", count: 380, rate: 0.731, dropOff: 140 },
    { stage: "purchase", count: 312, rate: 0.821, dropOff: 68 },
  ];
}

export function getConversionRate(): number {
  const events = getStore().clickEvents;
  if (events.length === 0) return 0;
  const conversions = events.filter((e) => e.converted).length;
  return Math.round((conversions / events.length) * 10000) / 100;
}

/* ---- A/B Testing ---- */

export function getABTests(): ABTest[] {
  return getStore().abTests;
}

export function addABTest(input: Omit<ABTest, "id" | "createdAt">): ABTest {
  const store = getStore();
  const test: ABTest = { ...input, id: uid("ab"), createdAt: Date.now() };
  store.abTests.push(test);
  saveStore(store);
  return test;
}

export function updateABTest(id: string, patch: Partial<ABTest>): ABTest | null {
  const store = getStore();
  const idx = store.abTests.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.abTests[idx] = { ...store.abTests[idx], ...patch };
  saveStore(store);
  return store.abTests[idx];
}

export function deleteABTest(id: string): boolean {
  const store = getStore();
  store.abTests = store.abTests.filter((t) => t.id !== id);
  saveStore(store);
  return true;
}

export function recordABTestImpression(testId: string, variantId: ABTestVariant): void {
  const store = getStore();
  const test = store.abTests.find((t) => t.id === testId);
  if (!test) return;
  const variant = test.variants.find((v) => v.id === variantId);
  if (variant) variant.impressions++;
  saveStore(store);
}

export function recordABTestConversion(testId: string, variantId: ABTestVariant, revenue = 0): void {
  const store = getStore();
  const test = store.abTests.find((t) => t.id === testId);
  if (!test) return;
  const variant = test.variants.find((v) => v.id === variantId);
  if (variant) { variant.conversions++; variant.revenue += revenue; }
  saveStore(store);
}

/* ================================================================== */
/*  MODULE 6: DEEP LINK ENGINE                                         */
/* ================================================================== */

export function getDeepLinks(): DeepLink[] {
  return getStore().deepLinks;
}

export function addDeepLink(input: Omit<DeepLink, "id" | "clicks" | "conversions" | "createdAt">): DeepLink {
  const store = getStore();
  const link: DeepLink = { ...input, id: uid("dl"), clicks: 0, conversions: 0, createdAt: Date.now() };
  store.deepLinks.push(link);
  saveStore(store);
  return link;
}

export function updateDeepLink(id: string, patch: Partial<DeepLink>): DeepLink | null {
  const store = getStore();
  const idx = store.deepLinks.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  store.deepLinks[idx] = { ...store.deepLinks[idx], ...patch };
  saveStore(store);
  return store.deepLinks[idx];
}

export function deleteDeepLink(id: string): boolean {
  const store = getStore();
  store.deepLinks = store.deepLinks.filter((l) => l.id !== id);
  saveStore(store);
  return true;
}

export function resolveDeepLink(linkId: string, country?: string, device?: string, _language?: string): string | null {
  const link = getStore().deepLinks.find((l) => l.id === linkId && l.active);
  if (!link) return null;

  // Geo routing
  if (country) {
    const geoRule = link.geoRules.find((r) => r.country === country);
    if (geoRule) { link.clicks++; saveStore(getStore()); return geoRule.url; }
  }

  // Device routing
  if (device) {
    const deviceRule = link.deviceRules.find((r) => r.device === device);
    if (deviceRule) { link.clicks++; saveStore(getStore()); return deviceRule.url; }
  }

  link.clicks++;
  saveStore(getStore());
  return link.defaultUrl;
}

export function checkLinkHealth(url: string): Promise<LinkHealth> {
  return Promise.resolve({
    id: uid("lh"), url, statusCode: 200, lastChecked: Date.now(),
    healthy: true, responseTime: Math.floor(Math.random() * 800) + 200,
  });
}

/* ================================================================== */
/*  MODULE 7: OFFER INTELLIGENCE                                       */
/* ================================================================== */

export function getActiveOffers(productId?: string): Offer[] {
  const now = Date.now();
  const all = getStore().offers.filter((o) => o.active && o.startsAt <= now && o.endsAt > now);
  return productId ? all.filter((o) => o.productId === productId) : all;
}

export function getAllOffers(): Offer[] {
  return getStore().offers;
}

export function addOffer(input: Omit<Offer, "id" | "claimedCount">): Offer {
  const store = getStore();
  const offer: Offer = { ...input, id: uid("off"), claimedCount: 0 };
  store.offers.push(offer);
  saveStore(store);
  return offer;
}

export function claimOffer(id: string): { success: boolean; message: string } {
  const store = getStore();
  const offer = store.offers.find((o) => o.id === id);
  if (!offer) return { success: false, message: "Offer not found" };
  if (!offer.active) return { success: false, message: "Offer is no longer active" };
  if (offer.endsAt < Date.now()) return { success: false, message: "Offer has expired" };
  if (offer.maxClaims && offer.claimedCount >= offer.maxClaims) return { success: false, message: "Offer fully claimed" };
  offer.claimedCount++;
  saveStore(store);
  return { success: true, message: `Offer "${offer.title}" claimed!${offer.couponCode ? ` Code: ${offer.couponCode}` : ""}` };
}

/* ================================================================== */
/*  MODULE 8: INVENTORY INTELLIGENCE                                   */
/* ================================================================== */

export function checkInventory(productId: string, marketplaces: MarketplaceConfig[]): InventorySnapshot[] {
  return marketplaces.filter((m) => m.active).map((m) => ({
    productId, productName: "",
    marketplaceId: m.id, inStock: Math.random() > 0.15, stockLevel: Math.floor(Math.random() * 20) + 1,
    price: 0, currency: m.currencies[0] || "USD", lastChecked: Date.now(),
  }));
}

export function addRestockAlert(input: Omit<RestockAlert, "id" | "notified" | "createdAt">): RestockAlert {
  const store = getStore();
  const alert: RestockAlert = { ...input, id: uid("rst"), notified: false, createdAt: Date.now() };
  store.restockAlerts.push(alert);
  saveStore(store);
  return alert;
}

export function getRestockAlerts(): RestockAlert[] {
  return getStore().restockAlerts;
}

/* ================================================================== */
/*  AFFILIATE COMMERCE STATS                                           */
/* ================================================================== */

export interface AffiliateCommerceStats {
  totalMarketplaces: number;
  activeMarketplaces: number;
  totalCommissionRules: number;
  activeCommissionRules: number;
  totalCommissionEarned: number;
  totalCommissionPending: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  activeOffers: number;
  runningABTests: number;
  activeDeepLinks: number;
  priceAlertsActive: number;
}

export function getAffiliateCommerceStats(): AffiliateCommerceStats {
  const store = getStore();
  const clicks = store.clickEvents.length;
  const conversions = store.clickEvents.filter((e) => e.converted).length;

  return {
    totalMarketplaces: store.marketplaces.length,
    activeMarketplaces: store.marketplaces.filter((m) => m.active).length,
    totalCommissionRules: store.commissionRules.length,
    activeCommissionRules: store.commissionRules.filter((r) => r.active).length,
    totalCommissionEarned: store.commissionRecords.reduce((s, r) => s + r.commissionAmount, 0),
    totalCommissionPending: store.commissionRecords.filter((r) => r.status === "pending" || r.status === "approved").reduce((s, r) => s + r.commissionAmount, 0),
    totalClicks: clicks,
    totalConversions: conversions,
    conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
    totalRevenue: store.commissionRecords.reduce((s, r) => s + r.saleAmount, 0),
    activeOffers: getActiveOffers().length,
    runningABTests: store.abTests.filter((t) => t.status === "running").length,
    activeDeepLinks: store.deepLinks.filter((l) => l.active).length,
    priceAlertsActive: store.priceAlerts.filter((a) => a.active && !a.triggered).length,
  };
}
