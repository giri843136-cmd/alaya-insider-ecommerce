/**
 * ALAYA INSIDER — Affiliate Platform Routes (PR-3)
 * --------------------------------------------------------------------------
 * Complete REST API for the Enterprise Affiliate Platform.
 * All endpoints are mounted under /affiliates relative to the API prefix.
 */

import { Hono } from "hono";
import {
  affiliateNetworks, affiliateAccounts, affiliateProducts, affiliateLinks,
  affiliateClicks, affiliateConversions, affiliateCommissions, affiliateCampaigns,
  affiliateMarketplaces, affiliateHealthLogs, affiliatePriceHistory,
} from "../db/repositories/index.js";
import {
  generateDeepLink, resolveDeepLink, runLinkHealthCheck, runBulkHealthCheck,
  trackClick, recordConversion, recordPrice, calculateCommission,
  resolveGeoRouting, getAffiliateAnalytics, bulkImportProducts,
} from "../services/affiliateEngine.js";

const affiliate = new Hono();

/* ================================================================== */
/*  DASHBOARD / ANALYTICS                                              */
/* ================================================================== */

affiliate.get("/analytics", async (c) => {
  const days = Number(c.req.query("days")) || 30;
  try {
    const analytics = await getAffiliateAnalytics(days);
    return c.json(analytics);
  } catch (err: any) {
    return c.json({ code: "ANALYTICS_ERROR", message: err.message }, 500);
  }
});

affiliate.get("/stats", async (c) => {
  const days = Number(c.req.query("days")) || 30;
  const clickStats = await affiliateClicks.getStats(days);
  const convStats = await affiliateConversions.getStats(days);
  const commissionSummary = await affiliateCommissions.getSummary();
  return c.json({ clicks: clickStats, conversions: convStats, commissions: commissionSummary });
});

/* ================================================================== */
/*  NETWORKS (Provider Definitions)                                    */
/* ================================================================== */

affiliate.get("/networks", async (c) => {
  const result = await affiliateNetworks.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/networks/active", async (c) => {
  const result = await affiliateNetworks.getActive();
  return c.json(result);
});

affiliate.get("/networks/:id", async (c) => {
  const item = await affiliateNetworks.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Network not found" }, 404);
  return c.json(item);
});

affiliate.post("/networks", async (c) => {
  const body = await c.req.json<any>();
  const network = await affiliateNetworks.create({
    provider: body.provider,
    name: body.name || body.provider,
    description: body.description || "",
    website: body.website || "",
    docs_url: body.docsUrl,
    logo: body.logo,
    active: body.active ?? true,
    cookie_days: body.cookieDays ?? 30,
    min_commission: body.minCommission ?? 0,
    max_commission: body.maxCommission ?? 20,
    payment_threshold: body.paymentThreshold ?? 50,
    payment_frequency: body.paymentFrequency || "monthly",
    supports_countries: JSON.stringify(body.supportsCountries || []),
    supports_currencies: JSON.stringify(body.supportsCurrencies || []),
    supports_verticals: JSON.stringify(body.supportsVerticals || []),
    failover_priority: body.failoverPriority ?? 10,
    config: JSON.stringify(body.config || {}),
  } as any);
  return c.json(network, 201);
});

affiliate.patch("/networks/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliateNetworks.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Network not found" }, 404);
  return c.json(updated);
});

affiliate.delete("/networks/:id", async (c) => {
  const ok = await affiliateNetworks.delete(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Network not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  ACCOUNTS (Credentials per Provider)                                */
/* ================================================================== */

affiliate.get("/accounts", async (c) => {
  const result = await affiliateAccounts.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/accounts/active", async (c) => {
  const result = await affiliateAccounts.getActive();
  return c.json(result);
});

affiliate.get("/accounts/by-network/:networkId", async (c) => {
  const result = await affiliateAccounts.getByNetwork(c.req.param("networkId"));
  return c.json(result);
});

affiliate.get("/accounts/:id", async (c) => {
  const item = await affiliateAccounts.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Account not found" }, 404);
  return c.json(item);
});

affiliate.post("/accounts", async (c) => {
  const body = await c.req.json<any>();
  const account = await affiliateAccounts.create({
    network_id: body.networkId,
    label: body.label || "Default",
    account_id: body.accountId || "",
    tracking_id: body.trackingId || null,
    store_id: body.storeId || null,
    api_key_encrypted: body.apiKey ? `enc:${body.apiKey}` : "",
    api_secret_encrypted: body.apiSecret ? `enc:${body.apiSecret}` : "",
    access_token_encrypted: body.accessToken ? `enc:${body.accessToken}` : "",
    marketplace: body.marketplace || "US",
    country: body.country || "US",
    language: body.language || "en",
    commission_rules: JSON.stringify(body.commissionRules || []),
    status: body.status || "connected",
    health_score: body.healthScore ?? 100,
    sync_interval_minutes: body.syncIntervalMinutes ?? 60,
    active: body.active ?? true,
  } as any);
  return c.json(account, 201);
});

affiliate.patch("/accounts/:id", async (c) => {
  const patch = await c.req.json();
  // Handle credential fields
  const credentialFields = ["apiKey", "apiSecret", "accessToken", "refreshToken"];
  for (const field of credentialFields) {
    if (patch[field]) {
      patch[`${field}_encrypted`] = `enc:${patch[field]}`;
      delete patch[field];
    }
  }
  const updated = await affiliateAccounts.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Account not found" }, 404);
  return c.json(updated);
});

affiliate.delete("/accounts/:id", async (c) => {
  const ok = await affiliateAccounts.delete(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Account not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  PRODUCT AFFILIATE MAPPING                                          */
/* ================================================================== */

affiliate.get("/products", async (c) => {
  const result = await affiliateProducts.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/products/by-product/:productId", async (c) => {
  const result = await affiliateProducts.getByProduct(c.req.param("productId"));
  return c.json(result);
});

affiliate.get("/products/:id", async (c) => {
  const item = await affiliateProducts.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Affiliate product not found" }, 404);
  return c.json(item);
});

affiliate.post("/products", async (c) => {
  const body = await c.req.json<any>();
  const ap = await affiliateProducts.create({
    product_id: body.productId,
    account_id: body.accountId,
    network_id: body.networkId,
    provider_product_id: body.providerProductId || null,
    affiliate_url: body.affiliateUrl || "",
    deep_link_url: body.deepLinkUrl || null,
    short_url: body.shortUrl || null,
    price: body.price ?? 0,
    currency: body.currency || "USD",
    commission_rate: body.commissionRate ?? 0,
    commission_type: body.commissionType || "percentage",
    cookie_days: body.cookieDays ?? 30,
    in_stock: body.inStock ?? true,
    priority: body.priority ?? 5,
    is_primary: body.isPrimary ?? false,
    active: body.active ?? true,
  } as any);
  return c.json(ap, 201);
});

affiliate.patch("/products/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliateProducts.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Affiliate product not found" }, 404);
  return c.json(updated);
});

affiliate.delete("/products/:id", async (c) => {
  const ok = await affiliateProducts.delete(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Affiliate product not found" }, 404);
  return c.json({ success: true });
});

affiliate.post("/products/bulk-import", async (c) => {
  const body = await c.req.json<{ accountId: string; networkId: string; products: any[] }>();
  const result = await bulkImportProducts(body.accountId, body.networkId, body.products);
  return c.json(result, 201);
});

/* ================================================================== */
/*  DEEP LINKS                                                         */
/* ================================================================== */

affiliate.get("/links", async (c) => {
  const result = await affiliateLinks.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/links/by-product/:productId", async (c) => {
  const result = await affiliateLinks.getByProduct(c.req.param("productId"));
  return c.json(result);
});

affiliate.get("/links/:id", async (c) => {
  const item = await affiliateLinks.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);
  return c.json(item);
});

affiliate.post("/links", async (c) => {
  const body = await c.req.json<any>();
  const enhanced = generateDeepLink({
    originalUrl: body.originalUrl || body.url,
    productId: body.productId,
    accountId: body.accountId,
    networkId: body.networkId,
    utmSource: body.utmSource || "alaya",
    utmMedium: body.utmMedium || "affiliate",
    utmCampaign: body.utmCampaign,
    utmContent: body.utmContent,
    utmTerm: body.utmTerm,
    geoRules: body.geoRules,
    deviceRules: body.deviceRules,
    languageRules: body.languageRules,
  });

  const link = await affiliateLinks.create({
    product_id: body.productId || null,
    account_id: body.accountId || null,
    network_id: body.networkId || null,
    original_url: body.originalUrl || body.url,
    cloaked_url: body.cloakedUrl || null,
    short_url: body.shortUrl || null,
    type: body.type || "smart",
    default_url: enhanced.url,
    geo_rules: JSON.stringify(body.geoRules || []),
    device_rules: JSON.stringify(body.deviceRules || []),
    language_rules: JSON.stringify(body.languageRules || []),
    currency_rules: JSON.stringify(body.currencyRules || []),
    utm_source: body.utmSource || "alaya",
    utm_medium: body.utmMedium || "affiliate",
    utm_campaign: body.utmCampaign || null,
    utm_content: body.utmContent || null,
    utm_term: body.utmTerm || null,
    active: body.active ?? true,
  } as any);
  return c.json(link, 201);
});

affiliate.patch("/links/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliateLinks.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);
  return c.json(updated);
});

affiliate.delete("/links/:id", async (c) => {
  const ok = await affiliateLinks.delete(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);
  return c.json({ success: true });
});

affiliate.post("/links/generate", async (c) => {
  const body = await c.req.json<any>();
  const result = generateDeepLink({
    originalUrl: body.url,
    productId: body.productId,
    accountId: body.accountId,
    networkId: body.networkId,
    utmSource: body.utmSource || "alaya",
    utmMedium: body.utmMedium || "affiliate",
    utmCampaign: body.utmCampaign,
    utmContent: body.utmContent,
    utmTerm: body.utmTerm,
  });
  return c.json(result);
});

affiliate.post("/links/resolve", async (c) => {
  const body = await c.req.json<{ linkId: string; country?: string; device?: string; language?: string }>();
  const link = await affiliateLinks.getById(body.linkId);
  if (!link) return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);

  const resolvedUrl = resolveDeepLink(link, {
    country: body.country,
    device: body.device,
    language: body.language,
  });
  return c.json({ url: resolvedUrl });
});

/* ================================================================== */
/*  LINK HEALTH                                                        */
/* ================================================================== */

affiliate.get("/health", async (c) => {
  const result = await affiliateHealthLogs.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/health/stats", async (c) => {
  const stats = await affiliateHealthLogs.getStats();
  return c.json(stats);
});

affiliate.post("/health/check-link/:linkId", async (c) => {
  try {
    const result = await runLinkHealthCheck(c.req.param("linkId"));
    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "HEALTH_CHECK_ERROR", message: err.message }, 400);
  }
});

affiliate.post("/health/bulk-check", async (c) => {
  const body = await c.req.json<any>().catch(() => ({} as any));
  const result = await runBulkHealthCheck(body?.accountId);
  return c.json(result);
});

affiliate.get("/health/latest/:linkId", async (c) => {
  const result = await affiliateHealthLogs.getLatestByLink(c.req.param("linkId"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "No health check found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  CLICK TRACKING                                                     */
/* ================================================================== */

affiliate.get("/clicks", async (c) => {
  const result = await affiliateClicks.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/clicks/stats", async (c) => {
  const days = Number(c.req.query("days")) || 30;
  const stats = await affiliateClicks.getStats(days);
  const byCountry = await affiliateClicks.getByCountry(days);
  const byDevice = await affiliateClicks.getByDevice(days);
  return c.json({ stats, byCountry, byDevice });
});

affiliate.get("/clicks/:id", async (c) => {
  const item = await affiliateClicks.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Click not found" }, 404);
  return c.json(item);
});

affiliate.post("/clicks/track", async (c) => {
  const body = await c.req.json<any>();
  const click = await trackClick({
    linkId: body.linkId,
    productId: body.productId,
    accountId: body.accountId,
    networkId: body.networkId,
    customerId: body.customerId,
    sessionId: body.sessionId,
    ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || body.ip,
    country: body.country,
    deviceType: body.deviceType,
    browser: body.browser,
    os: body.os,
    referrer: body.referrer || c.req.header("referer"),
    utmSource: body.utmSource,
    utmMedium: body.utmMedium,
    utmCampaign: body.utmCampaign,
    utmContent: body.utmContent,
    utmTerm: body.utmTerm,
    userAgent: body.userAgent || c.req.header("user-agent"),
  });
  return c.json(click, 201);
});

/* ================================================================== */
/*  CONVERSIONS                                                        */
/* ================================================================== */

affiliate.get("/conversions", async (c) => {
  const result = await affiliateConversions.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/conversions/daily", async (c) => {
  const days = Number(c.req.query("days")) || 30;
  const result = await affiliateConversions.getDaily(days);
  return c.json(result);
});

affiliate.get("/conversions/top-products", async (c) => {
  const limit = Number(c.req.query("limit")) || 10;
  const result = await affiliateConversions.getTopProducts(limit);
  return c.json(result);
});

affiliate.get("/conversions/:id", async (c) => {
  const item = await affiliateConversions.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Conversion not found" }, 404);
  return c.json(item);
});

affiliate.post("/conversions", async (c) => {
  const body = await c.req.json<any>();
  const conversion = await recordConversion({
    clickId: body.clickId,
    linkId: body.linkId,
    productId: body.productId,
    accountId: body.accountId,
    networkId: body.networkId,
    customerId: body.customerId,
    orderId: body.orderId,
    orderNumber: body.orderNumber,
    saleAmount: body.saleAmount,
    commissionAmount: body.commissionAmount,
    commissionRate: body.commissionRate,
    commissionType: body.commissionType || "percentage",
    currency: body.currency || "USD",
    status: body.status || "pending",
    metadata: body.metadata,
  });
  return c.json(conversion, 201);
});

affiliate.patch("/conversions/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: string }>();
  const updated = await affiliateConversions.update(c.req.param("id"), { status } as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Conversion not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  COMMISSIONS                                                        */
/* ================================================================== */

affiliate.get("/commissions", async (c) => {
  const result = await affiliateCommissions.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/commissions/summary", async (c) => {
  const summary = await affiliateCommissions.getSummary();
  return c.json(summary);
});

affiliate.get("/commissions/by-account/:accountId", async (c) => {
  const status = c.req.query("status");
  const result = await affiliateCommissions.getByAccount(c.req.param("accountId"), status);
  return c.json(result);
});

affiliate.get("/commissions/:id", async (c) => {
  const item = await affiliateCommissions.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Commission not found" }, 404);
  return c.json(item);
});

affiliate.patch("/commissions/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliateCommissions.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Commission not found" }, 404);
  return c.json(updated);
});

affiliate.post("/commissions/calculate", async (c) => {
  const body = await c.req.json<{ saleAmount: number; rules: any[] }>();
  const result = calculateCommission(body.saleAmount, body.rules);
  return c.json(result);
});

/* ================================================================== */
/*  CAMPAIGNS                                                          */
/* ================================================================== */

affiliate.get("/campaigns", async (c) => {
  const result = await affiliateCampaigns.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/campaigns/active", async (c) => {
  const result = await affiliateCampaigns.getActive();
  return c.json(result);
});

affiliate.get("/campaigns/:id", async (c) => {
  const item = await affiliateCampaigns.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Campaign not found" }, 404);
  return c.json(item);
});

affiliate.post("/campaigns", async (c) => {
  const body = await c.req.json<any>();
  const campaign = await affiliateCampaigns.create({
    name: body.name || "New Campaign",
    description: body.description || "",
    account_id: body.accountId || null,
    network_id: body.networkId || null,
    type: body.type || "standard",
    budget: body.budget ?? 0,
    spent: body.spent ?? 0,
    click_goal: body.clickGoal ?? 1000,
    conversion_goal: body.conversionGoal ?? 50,
    revenue_goal: body.revenueGoal ?? 10000,
    utm_campaign: body.utmCampaign || null,
    starts_at: body.startsAt || null,
    ends_at: body.endsAt || null,
    status: body.status || "draft",
    active: body.active ?? false,
  } as any);
  return c.json(campaign, 201);
});

affiliate.patch("/campaigns/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliateCampaigns.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Campaign not found" }, 404);
  return c.json(updated);
});

affiliate.delete("/campaigns/:id", async (c) => {
  const ok = await affiliateCampaigns.delete(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Campaign not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  MARKETPLACES (Geo Routing)                                         */
/* ================================================================== */

affiliate.get("/marketplaces", async (c) => {
  const result = await affiliateMarketplaces.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/marketplaces/by-country/:country", async (c) => {
  const result = await affiliateMarketplaces.getByCountry(c.req.param("country"));
  return c.json(result);
});

affiliate.get("/marketplaces/by-network/:networkId", async (c) => {
  const result = await affiliateMarketplaces.getByNetwork(c.req.param("networkId"));
  return c.json(result);
});

affiliate.get("/marketplaces/resolve-geo/:country", async (c) => {
  const country = c.req.param("country");
  const productId = c.req.query("productId");
  const result = await resolveGeoRouting(country, productId);
  return c.json(result);
});

affiliate.post("/marketplaces", async (c) => {
  const body = await c.req.json<any>();
  const mp = await affiliateMarketplaces.create({
    network_id: body.networkId,
    account_id: body.accountId || null,
    country: body.country || "US",
    language: body.language || "en",
    marketplace_code: body.marketplaceCode || body.country,
    marketplace_url: body.marketplaceUrl || "",
    tracking_id: body.trackingId || null,
    currency: body.currency || "USD",
    commission_rate: body.commissionRate || null,
    is_primary: body.isPrimary ?? false,
    active: body.active ?? true,
  } as any);
  return c.json(mp, 201);
});

affiliate.patch("/marketplaces/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliateMarketplaces.update(c.req.param("id"), patch as any);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Marketplace not found" }, 404);
  return c.json(updated);
});

affiliate.delete("/marketplaces/:id", async (c) => {
  const ok = await affiliateMarketplaces.delete(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Marketplace not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  PRICE INTELLIGENCE                                                 */
/* ================================================================== */

affiliate.get("/prices", async (c) => {
  const result = await affiliatePriceHistory.list(c.req.query() as any);
  return c.json(result);
});

affiliate.get("/prices/by-product/:productId", async (c) => {
  const days = Number(c.req.query("days")) || 90;
  const result = await affiliatePriceHistory.getByProduct(c.req.param("productId"), days);
  return c.json(result);
});

affiliate.get("/prices/latest/:productId", async (c) => {
  const result = await affiliatePriceHistory.getLatestByProduct(c.req.param("productId"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "No price data found" }, 404);
  return c.json(result);
});

affiliate.get("/prices/alerts", async (c) => {
  const productId = c.req.query("productId");
  const alerts = await affiliatePriceHistory.getAlerts(productId);
  return c.json(alerts);
});

affiliate.post("/prices", async (c) => {
  const body = await c.req.json<any>();
  const record = await recordPrice({
    productId: body.productId,
    accountId: body.accountId,
    networkId: body.networkId,
    price: body.price,
    currency: body.currency || "USD",
    inStock: body.inStock ?? true,
    stockLevel: body.stockLevel,
    url: body.url,
  });
  return c.json(record, 201);
});

export { affiliate };
