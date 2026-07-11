/**
 * ALAYA INSIDER — Enterprise Affiliate Engine (PR-3)
 * --------------------------------------------------------------------------
 * Production-grade affiliate platform with multi-network support, geo routing,
 * deep link generation, commission engine, price intelligence, and health monitoring.
 *
 * Architecture:
 *  - Provider adapters (pluggable network connectors)
 *  - Geo-aware link routing with failover
 *  - Commission engine (percentage, fixed, tiered, recurring, hybrid)
 *  - Deep link generator with UTM tracking
 *  - Link health checker
 *  - Price intelligence with history tracking
 */

import { query, queryOne, queryAll } from "../db/index.js";
import {
  affiliateNetworks, affiliateAccounts, affiliateProducts, affiliateLinks,
  affiliateClicks, affiliateConversions, affiliateCommissions, affiliateCampaigns,
  affiliateMarketplaces, affiliateHealthLogs, affiliatePriceHistory,
} from "../db/repositories/index.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type AffiliateProvider =
  | "amazon_associates" | "impact" | "cj" | "shareasale"
  | "rakuten" | "awin" | "partnerize" | "custom";

export type CommissionType = "percentage" | "fixed" | "tiered" | "recurring" | "hybrid";

export type CommissionStatus = "pending" | "approved" | "paid" | "rejected";

export type LinkType = "smart" | "cloaked" | "short" | "direct";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

/* ================================================================== */
/*  PROVIDER DEFS                                                      */
/* ================================================================== */

interface NetworkDefinition {
  provider: AffiliateProvider;
  name: string;
  website: string;
  docsUrl: string;
  supportsCountries: string[];
  cookieDays: number;
  urlTemplate: (trackingId: string, productId: string, params?: Record<string, string>) => string;
}

const NETWORK_DEFINITIONS: Record<string, NetworkDefinition> = {
  amazon_associates: {
    provider: "amazon_associates", name: "Amazon Associates", website: "https://associates.amazon.com",
    docsUrl: "https://developer.amazon.com/paapi",
    supportsCountries: ["US", "GB", "DE", "FR", "JP", "CA", "IN", "IT", "ES", "AU", "BR", "MX"],
    cookieDays: 24,
    urlTemplate: (trackingId, productId, params) => {
      const base = `https://www.amazon.com/dp/${productId}/?tag=${trackingId}`;
      const search = params?.search ? `&keywords=${encodeURIComponent(params.search)}` : "";
      return `${base}${search}`;
    },
  },
  impact: {
    provider: "impact", name: "Impact Radius", website: "https://impact.com",
    docsUrl: "https://developer.impact.com",
    supportsCountries: ["US", "GB", "CA", "AU", "DE", "FR"],
    cookieDays: 30,
    urlTemplate: (trackingId, productId, params) => {
      return `https://${trackingId}.impact.com/product/${productId}`;
    },
  },
  cj: {
    provider: "cj", name: "CJ Affiliate", website: "https://www.cj.com",
    docsUrl: "https://developers.cj.com",
    supportsCountries: ["US", "GB", "CA", "DE", "FR", "AU"],
    cookieDays: 30,
    urlTemplate: (trackingId, productId, params) => {
      return `https://www.jdoqocy.com/click-${trackingId}-${productId}`;
    },
  },
  shareasale: {
    provider: "shareasale", name: "ShareASale", website: "https://www.shareasale.com",
    docsUrl: "https://wiki.shareasale.com",
    supportsCountries: ["US", "GB", "CA", "AU"],
    cookieDays: 30,
    urlTemplate: (trackingId, productId, params) => {
      return `https://www.shareasale.com/r.cfm?b=${productId}&u=${trackingId}`;
    },
  },
  rakuten: {
    provider: "rakuten", name: "Rakuten Advertising", website: "https://rakutenadvertising.com",
    docsUrl: "https://rakutenadvertising.com/developers",
    supportsCountries: ["US", "JP", "GB", "DE", "FR"],
    cookieDays: 30,
    urlTemplate: (trackingId, productId, params) => {
      return `https://click.linksynergy.com/link?id=${trackingId}&offerid=${productId}`;
    },
  },
  awin: {
    provider: "awin", name: "Awin", website: "https://www.awin.com",
    docsUrl: "https://wiki.awin.com",
    supportsCountries: ["US", "GB", "DE", "FR", "ES", "IT", "NL", "SE", "AU"],
    cookieDays: 30,
    urlTemplate: (trackingId, productId, params) => {
      return `https://www.awin1.com/cread.php?awinmid=${productId}&awinaffid=${trackingId}`;
    },
  },
  partnerize: {
    provider: "partnerize", name: "Partnerize", website: "https://partnerize.com",
    docsUrl: "https://developer.partnerize.com",
    supportsCountries: ["US", "GB", "DE", "FR", "AU"],
    cookieDays: 30,
    urlTemplate: (trackingId, productId, params) => {
      return `https://prf.hn/click/camref:${trackingId}/pubref:${productId}`;
    },
  },
};

/* ================================================================== */
/*  1. PROVIDER MANAGEMENT                                             */
/* ================================================================== */

export function getNetworkDefinitions() {
  return NETWORK_DEFINITIONS;
}

export function getNetworkDefinition(provider: string): NetworkDefinition | undefined {
  return NETWORK_DEFINITIONS[provider];
}

export async function createAccount(
  networkId: string,
  input: {
    label: string;
    accountId: string;
    trackingId?: string;
    marketplace?: string;
    country?: string;
    credentials?: Record<string, string>;
  },
) {
  return affiliateAccounts.create({
    network_id: networkId,
    label: input.label,
    account_id: input.accountId,
    tracking_id: input.trackingId || null,
    marketplace: input.marketplace || "US",
    country: input.country || "US",
    credentials: JSON.stringify(input.credentials || {}),
    status: "connected",
    health_score: 100,
  });
}

/* ================================================================== */
/*  2. COMMISSION ENGINE                                               */
/* ================================================================== */

export interface CommissionRule {
  id: string;
  name: string;
  type: CommissionType;
  value: number;
  tiers?: { minRevenue: number; rate: number }[];
  capAmount?: number;
  minOrderValue: number;
  maxOrderValue?: number;
  cookieDays: number;
  recurringMonths?: number;
  partnerId?: string;
  networkId?: string;
  category?: string;
  priority: number;
}

export function calculateCommission(
  saleAmount: number,
  rules: CommissionRule[],
): { rule: CommissionRule; amount: number; rate: number } | null {
  const sorted = rules
    .filter((r) => saleAmount >= r.minOrderValue && (!r.maxOrderValue || saleAmount <= r.maxOrderValue))
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    let amount = 0;
    let rate = rule.value;

    switch (rule.type) {
      case "percentage": {
        amount = saleAmount * (rule.value / 100);
        break;
      }
      case "fixed": {
        amount = rule.value;
        rate = (rule.value / saleAmount) * 100;
        break;
      }
      case "tiered": {
        if (rule.tiers) {
          const matched = [...rule.tiers].sort((a, b) => b.minRevenue - a.minRevenue)
            .find((t) => saleAmount >= t.minRevenue);
          if (matched) {
            amount = saleAmount * (matched.rate / 100);
            rate = matched.rate;
          } else {
            amount = saleAmount * (rule.value / 100);
          }
        } else {
          amount = saleAmount * (rule.value / 100);
        }
        break;
      }
      case "recurring": {
        const months = rule.recurringMonths || 1;
        amount = saleAmount * (rule.value / 100) * months;
        break;
      }
      case "hybrid": {
        const baseCommission = saleAmount * (rule.value / 100);
        const tiers = rule.tiers || [];
        const bonus = tiers.reduce((sum, t) => saleAmount >= t.minRevenue ? sum + (saleAmount * (t.rate / 100)) : sum, 0);
        amount = baseCommission + bonus;
        rate = (amount / saleAmount) * 100;
        break;
      }
    }

    if (rule.capAmount) amount = Math.min(amount, rule.capAmount);
    return { rule, amount: Math.round(amount * 100) / 100, rate: Math.round(rate * 100) / 100 };
  }

  return null;
}

/* ================================================================== */
/*  3. DEEP LINK GENERATOR                                             */
/* ================================================================== */

export interface DeepLinkInput {
  originalUrl: string;
  productId?: string;
  accountId?: string;
  networkId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  geoRules?: { country: string; url: string }[];
  deviceRules?: { device: "mobile" | "desktop" | "tablet"; url: string }[];
  languageRules?: { language: string; url: string }[];
}

export function generateDeepLink(input: DeepLinkInput): {
  url: string;
  utmString: string;
  params: Record<string, string>;
} {
  const utmParams: Record<string, string> = {};
  if (input.utmSource) utmParams.utm_source = input.utmSource;
  if (input.utmMedium) utmParams.utm_medium = input.utmMedium;
  else utmParams.utm_medium = "affiliate";
  if (input.utmCampaign) utmParams.utm_campaign = input.utmCampaign;
  if (input.utmContent) utmParams.utm_content = input.utmContent;
  if (input.utmTerm) utmParams.utm_term = input.utmTerm;

  const baseUrl = input.originalUrl;
  const urlObj = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
  for (const [k, v] of Object.entries(utmParams)) {
    urlObj.searchParams.set(k, v);
  }

  return {
    url: urlObj.toString(),
    utmString: Object.entries(utmParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&"),
    params: utmParams,
  };
}

export function resolveDeepLink(
  link: { default_url: string; geo_rules?: any[]; device_rules?: any[]; language_rules?: any[] },
  context: { country?: string; device?: string; language?: string },
): string {
  const { country, device, language } = context;

  // Geo routing
  if (country && link.geo_rules) {
    const rules = typeof link.geo_rules === "string" ? JSON.parse(link.geo_rules) : link.geo_rules;
    if (Array.isArray(rules)) {
      const match = rules.find((r: any) => r.country === country);
      if (match?.url) return match.url;
    }
  }

  // Device routing
  if (device && link.device_rules) {
    const rules = typeof link.device_rules === "string" ? JSON.parse(link.device_rules) : link.device_rules;
    if (Array.isArray(rules)) {
      const match = rules.find((r: any) => r.device === device);
      if (match?.url) return match.url;
    }
  }

  // Language routing
  if (language && link.language_rules) {
    const rules = typeof link.language_rules === "string" ? JSON.parse(link.language_rules) : link.language_rules;
    if (Array.isArray(rules)) {
      const match = rules.find((r: any) => r.language === language);
      if (match?.url) return match.url;
    }
  }

  return link.default_url;
}

/* ================================================================== */
/*  4. LINK HEALTH CHECKER                                             */
/* ================================================================== */

export interface HealthCheckResult {
  url: string;
  statusCode: number;
  healthy: boolean;
  responseTimeMs: number;
  redirectChain: string[];
  sslValid: boolean;
  error?: string;
}

export async function checkLinkHealth(url: string, timeout = 10000): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const redirectChain: string[] = [url];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "manual",
      headers: { "User-Agent": "ALAYA-Affiliate-Health-Checker/1.0" },
    });

    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    let statusCode = response.status;
    let finalUrl = url;

    // Follow redirects manually
    let currentResponse = response;
    let redirectCount = 0;
    while ((currentResponse.status === 301 || currentResponse.status === 302 || currentResponse.status === 303 || currentResponse.status === 307 || currentResponse.status === 308) && redirectCount < 10) {
      const location = currentResponse.headers.get("location");
      if (!location) break;
      redirectChain.push(location);
      redirectCount++;
      const nextController = new AbortController();
      const nextTimer = setTimeout(() => nextController.abort(), timeout);
      currentResponse = await fetch(location, {
        method: "HEAD",
        signal: nextController.signal,
        redirect: "manual",
        headers: { "User-Agent": "ALAYA-Affiliate-Health-Checker/1.0" },
      });
      clearTimeout(nextTimer);
      statusCode = currentResponse.status;
      finalUrl = location;
    }

    // SSL check
    let sslValid = false;
    try {
      const urlObj = new URL(finalUrl);
      if (urlObj.protocol === "https:") {
        sslValid = true;
      } else {
        sslValid = false; // non-HTTPS
      }
    } catch { sslValid = false; }

    const healthy = statusCode >= 200 && statusCode < 400;

    return {
      url,
      statusCode,
      healthy,
      responseTimeMs,
      redirectChain,
      sslValid,
    };
  } catch (err: any) {
    return {
      url,
      statusCode: 0,
      healthy: false,
      responseTimeMs: Date.now() - startTime,
      redirectChain,
      sslValid: false,
      error: err.name === "AbortError" ? "Timeout" : err.message,
    };
  }
}

export async function runLinkHealthCheck(linkId: string): Promise<HealthCheckResult> {
  const link = await affiliateLinks.getById(linkId);
  if (!link) throw new Error("Link not found");

  const url = link.cloaked_url || link.original_url || link.default_url;
  const result = await checkLinkHealth(url);

  await affiliateHealthLogs.create({
    link_id: linkId,
    url,
    status_code: result.statusCode,
    healthy: result.healthy,
    response_time_ms: result.responseTimeMs,
    redirect_chain: result.redirectChain,
    ssl_valid: result.sslValid,
    error_message: result.error || null,
    checked_at: new Date().toISOString(),
  });

  return result;
}

export async function runBulkHealthCheck(accountId?: string): Promise<{ checked: number; healthy: number; broken: number }> {
  let links: any[];
  if (accountId) {
    links = await affiliateLinks.getByAccount(accountId);
  } else {
    const result = await affiliateLinks.list({ pageSize: 500 });
    links = result.data;
  }

  let healthy = 0;
  let broken = 0;

  for (const link of links) {
    const url = link.cloaked_url || link.original_url || link.default_url;
    const result = await checkLinkHealth(url, 5000);
    await affiliateHealthLogs.create({
      link_id: link.id,
      url,
      status_code: result.statusCode,
      healthy: result.healthy,
      response_time_ms: result.responseTimeMs,
      redirect_chain: result.redirectChain,
      ssl_valid: result.sslValid,
      error_message: result.error || null,
      checked_at: new Date().toISOString(),
    });
    if (result.healthy) healthy++;
    else broken++;
  }

  return { checked: links.length, healthy, broken };
}

/* ================================================================== */
/*  5. CLICK TRACKING                                                  */
/* ================================================================== */

export async function trackClick(input: {
  linkId: string;
  productId?: string;
  accountId?: string;
  networkId?: string;
  customerId?: string;
  sessionId?: string;
  ip?: string;
  country?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  userAgent?: string;
}) {
  const click = await affiliateClicks.create({
    link_id: input.linkId,
    product_id: input.productId || null,
    account_id: input.accountId || null,
    network_id: input.networkId || null,
    customer_id: input.customerId || null,
    session_id: input.sessionId || null,
    ip_address: input.ip || null,
    country: input.country || null,
    device_type: input.deviceType || null,
    browser: input.browser || null,
    os: input.os || null,
    referrer: input.referrer || null,
    utm_source: input.utmSource || null,
    utm_medium: input.utmMedium || null,
    utm_campaign: input.utmCampaign || null,
    utm_content: input.utmContent || null,
    utm_term: input.utmTerm || null,
    user_agent: input.userAgent || null,
    clicked_at: new Date().toISOString(),
  });

  // Increment link click counter
  await affiliateLinks.incrementClick(input.linkId);

  return click;
}

/* ================================================================== */
/*  6. CONVERSION TRACKING                                             */
/* ================================================================== */

export async function recordConversion(input: {
  clickId?: string;
  linkId?: string;
  productId?: string;
  accountId?: string;
  networkId?: string;
  customerId?: string;
  orderId?: string;
  orderNumber?: string;
  saleAmount: number;
  commissionAmount: number;
  commissionRate: number;
  commissionType?: string;
  currency?: string;
  status?: string;
  metadata?: Record<string, any>;
}) {
  const conversion = await affiliateConversions.create({
    click_id: input.clickId || null,
    link_id: input.linkId || null,
    product_id: input.productId || null,
    account_id: input.accountId || null,
    network_id: input.networkId || null,
    customer_id: input.customerId || null,
    order_id: input.orderId || null,
    order_number: input.orderNumber || null,
    sale_amount: input.saleAmount,
    commission_amount: input.commissionAmount,
    commission_rate: input.commissionRate,
    commission_type: input.commissionType || "percentage",
    currency: input.currency || "USD",
    status: input.status || "pending",
    epc: input.saleAmount > 0 ? Math.round((input.commissionAmount / input.saleAmount) * 10000) / 100 : 0,
    aov: input.saleAmount,
    metadata: input.metadata ? JSON.stringify(input.metadata) : "{}",
    converted_at: new Date().toISOString(),
  });

  // Create commission record
  await affiliateCommissions.create({
    conversion_id: conversion.id,
    account_id: input.accountId || null,
    network_id: input.networkId || null,
    product_id: input.productId || null,
    order_id: input.orderId || null,
    order_number: input.orderNumber || null,
    sale_amount: input.saleAmount,
    commission_amount: input.commissionAmount,
    commission_rate: input.commissionRate,
    commission_type: input.commissionType || "percentage",
    status: "pending",
  });

  // Mark click as converted
  if (input.clickId) {
    await affiliateClicks.update(input.clickId, {
      converted: true,
      conversion_id: conversion.id,
      conversion_value: input.saleAmount,
    });
  }

  return conversion;
}

/* ================================================================== */
/*  7. PRICE INTELLIGENCE                                              */
/* ================================================================== */

export async function recordPrice(input: {
  productId: string;
  accountId?: string;
  networkId?: string;
  price: number;
  currency?: string;
  inStock?: boolean;
  stockLevel?: number;
  url?: string;
}) {
  // Get latest price for comparison
  const latest = await affiliatePriceHistory.getLatestByProduct(input.productId);
  const previousPrice = latest?.price || null;
  const priceChange = previousPrice !== null ? input.price - previousPrice : null;
  const priceChangePercent = previousPrice && previousPrice > 0
    ? Math.round(((input.price - previousPrice) / previousPrice) * 10000) / 100
    : null;

  return affiliatePriceHistory.create({
    product_id: input.productId,
    account_id: input.accountId || null,
    network_id: input.networkId || null,
    price: input.price,
    currency: input.currency || "USD",
    previous_price: previousPrice,
    price_change: priceChange,
    price_change_percent: priceChangePercent,
    in_stock: input.inStock ?? true,
    stock_level: input.stockLevel || null,
    url: input.url || null,
    recorded_at: new Date().toISOString(),
  });
}

/* ================================================================== */
/*  8. GEO ROUTING                                                     */
/* ================================================================== */

export interface GeoRoute {
  country: string;
  networkId: string;
  networkName: string;
  provider: string;
  accountId: string;
  trackingId: string;
  marketplaceUrl: string;
  url: string;
  priority: number;
  isPrimary: boolean;
}

export async function resolveGeoRouting(
  country: string,
  productId?: string,
): Promise<GeoRoute[]> {
  // Get marketplaces for the country
  const marketplaces = await affiliateMarketplaces.getByCountry(country);

  if (marketplaces.length === 0) {
    // Fallback: get all active accounts ordered by failover priority
    const accounts = await affiliateAccounts.getActive();
    return accounts.map((a: any) => ({
      country,
      networkId: a.network_id,
      networkName: a.network_name || a.label,
      provider: a.provider || "custom",
      accountId: a.id,
      trackingId: a.tracking_id || "",
      marketplaceUrl: "",
      url: "",
      priority: 999,
      isPrimary: false,
    }));
  }

  return marketplaces.map((m: any) => ({
    country,
    networkId: m.network_id,
    networkName: m.network_name,
    provider: m.provider,
    accountId: m.account_id,
    trackingId: m.tracking_id || "",
    marketplaceUrl: m.marketplace_url || "",
    url: "",
    priority: m.failover_priority || 10,
    isPrimary: m.is_primary || false,
  }));
}

/* ================================================================== */
/*  9. ANALYTICS                                                       */
/* ================================================================== */

export async function getAffiliateAnalytics(days = 30) {
  const clickStats = await affiliateClicks.getStats(days);
  const conversionStats = await affiliateConversions.getStats(days);
  const commissionSummary = await affiliateCommissions.getSummary();
  const dailyConversions = await affiliateConversions.getDaily(days);
  const topProducts = await affiliateConversions.getTopProducts(10);
  const clicksByCountry = await affiliateClicks.getByCountry(days);
  const clicksByDevice = await affiliateClicks.getByDevice(days);
  const healthStats = await affiliateHealthLogs.getStats();
  const totalLinks = await affiliateLinks.count({ active: true });
  const totalAccounts = await affiliateAccounts.count({ active: true });
  const totalNetworks = await affiliateNetworks.count({ active: true });

  return {
    clicks: clickStats || { total_clicks: 0, conversions: 0, total_revenue: 0, countries: 0, device_types: 0 },
    conversions: conversionStats || { total_conversions: 0, total_sales: 0, total_commission: 0, avg_order_value: 0, avg_commission_rate: 0 },
    commissions: commissionSummary || { pending: 0, approved: 0, paid: 0, rejected: 0, total_records: 0 },
    daily: dailyConversions || [],
    topProducts: topProducts || [],
    byCountry: clicksByCountry || [],
    byDevice: clicksByDevice || [],
    health: healthStats || { total_checks: 0, healthy_count: 0, broken_count: 0, avg_response_time: 0 },
    totals: {
      totalLinks,
      totalAccounts,
      totalNetworks,
    },
  };
}

/* ================================================================== */
/*  10. COUNTRY MAPPING                                                */
/* ================================================================== */

const COUNTRY_MARKETPLACE_MAP: Record<string, string> = {
  US: "US", GB: "UK", DE: "DE", FR: "FR", JP: "JP", CA: "CA",
  IN: "IN", IT: "IT", ES: "ES", AU: "AU", BR: "BR", MX: "MX",
  NL: "NL", SE: "SE", CN: "CN", KR: "KR", SG: "SG", AE: "AE",
};

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: "USD", GB: "GBP", DE: "EUR", FR: "EUR", JP: "JPY", CA: "CAD",
  IN: "INR", IT: "EUR", ES: "EUR", AU: "AUD", BR: "BRL", MX: "MXN",
  NL: "EUR", SE: "SEK", CN: "CNY", KR: "KRW", SG: "SGD", AE: "AED",
};

export function getMarketplaceCode(country: string): string {
  return COUNTRY_MARKETPLACE_MAP[country] || country;
}

export function getCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY_MAP[country] || "USD";
}

/* ================================================================== */
/*  11. BULK IMPORT                                                    */
/* ================================================================== */

export async function bulkImportProducts(
  accountId: string,
  networkId: string,
  products: Array<{
    productId: string;
    providerProductId?: string;
    affiliateUrl: string;
    price?: number;
    currency?: string;
    commissionRate?: number;
    inStock?: boolean;
  }>,
) {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of products) {
    try {
      const existing = await affiliateProducts.getPrimary(p.productId);
      if (existing) {
        skipped++;
        continue;
      }

      await affiliateProducts.create({
        product_id: p.productId,
        account_id: accountId,
        network_id: networkId,
        provider_product_id: p.providerProductId || null,
        affiliate_url: p.affiliateUrl,
        price: p.price || 0,
        currency: p.currency || "USD",
        commission_rate: p.commissionRate || 0,
        in_stock: p.inStock ?? true,
        is_primary: true,
        active: true,
      });
      imported++;
    } catch {
      errors++;
    }
  }

  return { imported, skipped, errors };
}
