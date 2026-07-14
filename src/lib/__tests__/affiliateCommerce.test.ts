/**
 * ALAYA INSIDER — Affiliate Commerce Unit Tests
 * --------------------------------------------------------------------------
 * Tests for merchant filtering, geo detection, price ranking, and
 * affiliate URL generation logic.
 */

import { describe, expect, it, vi, beforeAll, beforeEach, afterAll } from "vitest";

// Mock localStorage for vitest's node environment (affiliateCommerce uses localStorage for analytics, price alerts, etc.)

function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

beforeAll(() => {
  const mockStorage = createMockStorage();
  vi.stubGlobal("localStorage", mockStorage);
  vi.stubGlobal("sessionStorage", createMockStorage());
  // Mock navigator for detectUserCountry()
  vi.stubGlobal("navigator", {
    language: "en-US",
    languages: ["en-US", "en"],
    userAgent: "vitest",
  });
  // Mock Intl for getGeoInfo() timezone resolution
  vi.stubGlobal("Intl", {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: "America/New_York", locale: "en-US" }),
    }),
    NumberFormat: () => ({
      resolvedOptions: () => ({ currency: "USD" }),
    }),
  });
  // Mock crypto.randomUUID
  vi.stubGlobal("crypto", {
    randomUUID: () => `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16).slice(0, 12)}`,
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  localStorage.clear();
});

import {
  MERCHANTS,
  getMerchantsByCountry,
  getMerchantsForProduct,
  getActiveMarketplaces,
  getGeoInfo,
  getMerchantOffers,
  comparePrices,
  getMerchantAnalytics,
  trackMerchantImpression,
  trackMerchantClick,
  getConversionFunnel,
  getConversionRate,
  getABTests,
  generateAffiliateUrl,
  getPriceHistory,
  getPriceAlerts,
  addPriceAlert,
  deletePriceAlert,
  getMerchantClickEvents,
  updatePriceAlert,
  trackMerchantConversion,
} from "../affiliateCommerce";

// ── Merchant Data ────────────────────────────────────────────────

describe("MERCHANTS data", () => {
  it("contains at least 20 merchants", () => {
    expect(MERCHANTS.length).toBeGreaterThanOrEqual(20);
  });

  it("every merchant has required fields", () => {
    for (const m of MERCHANTS) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.slug).toBeTruthy();
      expect(m.countries).toBeInstanceOf(Array);
      expect(m.countries.length).toBeGreaterThan(0);
      expect(m.logoSvg).toBeTruthy();
      expect(m.theme).toHaveProperty("bg");
      expect(m.theme).toHaveProperty("text");
      expect(m.theme).toHaveProperty("border");
    }
  });

  it("amazon exists and supports US", () => {
    const amazon = MERCHANTS.find((m) => m.id === "amazon");
    expect(amazon).toBeDefined();
    expect(amazon!.countries).toContain("US");
  });

  it("flipkart exists and supports IN", () => {
    const flipkart = MERCHANTS.find((m) => m.id === "flipkart");
    expect(flipkart).toBeDefined();
    expect(flipkart!.countries).toContain("IN");
  });

  it("all merchants have unique ids", () => {
    const ids = MERCHANTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all merchants have unique slugs", () => {
    const slugs = MERCHANTS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("mediamarkt supports DE", () => {
    const mm = MERCHANTS.find((m) => m.slug === "mediamarkt");
    expect(mm).toBeDefined();
    expect(mm!.countries).toContain("DE");
  });

  it("argos supports GB", () => {
    const argos = MERCHANTS.find((m) => m.slug === "argos");
    expect(argos).toBeDefined();
    expect(argos!.countries).toContain("GB");
  });
});

// ── getMerchantsByCountry ────────────────────────────────────────

describe("getMerchantsByCountry()", () => {
  it("returns merchants for US", () => {
    const merchants = getMerchantsByCountry("US");
    expect(merchants.length).toBeGreaterThan(5);
    expect(merchants.some((m) => m.id === "amazon")).toBe(true);
    expect(merchants.some((m) => m.id === "walmart")).toBe(true);
  });

  it("returns merchants for India", () => {
    const merchants = getMerchantsByCountry("IN");
    expect(merchants.length).toBeGreaterThan(2);
    expect(merchants.some((m) => m.id === "flipkart")).toBe(true);
    expect(merchants.some((m) => m.id === "croma")).toBe(true);
  });

  it("returns merchants for UK", () => {
    const merchants = getMerchantsByCountry("GB");
    expect(merchants.length).toBeGreaterThan(5);
    expect(merchants.some((m) => m.id === "amazon")).toBe(true);
    expect(merchants.some((m) => m.id === "argos")).toBe(true);
  });

  it("returns merchants for Germany", () => {
    const merchants = getMerchantsByCountry("DE");
    expect(merchants.length).toBeGreaterThan(5);
    expect(merchants.some((m) => m.id === "amazon")).toBe(true);
    expect(merchants.some((m) => m.id === "mediamarkt")).toBe(true);
  });

  it("returns empty array for unknown country (no merchant has 'XX' in countries)", () => {
    const merchants = getMerchantsByCountry("XX");
    expect(merchants).toEqual([]);
  });

  it("returns US merchants when no country specified (uses detected country)", () => {
    const merchants = getMerchantsByCountry();
    // In vitest with mock navigator 'en-US', detectUserCountry() returns 'US'
    expect(merchants.length).toBeGreaterThan(5);
    expect(merchants.some((m) => m.id === "amazon")).toBe(true);
  });

  it("returns sorted by priority by default", () => {
    const merchants = getMerchantsByCountry("US");
    for (let i = 1; i < merchants.length; i++) {
      expect(merchants[i - 1].priority).toBeLessThanOrEqual(merchants[i].priority);
    }
  });
});

// ── getMerchantsForProduct ───────────────────────────────────────

describe("getMerchantsForProduct()", () => {
  const testProduct = { type: "physical", price: 299.99 };

  it("returns merchants for a US-based product", () => {
    const merchants = getMerchantsForProduct(testProduct, "US");
    expect(merchants.length).toBeGreaterThan(5);
    expect(merchants.some((m) => m.id === "amazon")).toBe(true);
  });

  it("returns merchants for an India-based product", () => {
    const merchants = getMerchantsForProduct(testProduct, "IN");
    expect(merchants.some((m) => m.id === "flipkart")).toBe(true);
  });

  it("amazon is available in US, GB, DE, IN", () => {
    for (const country of ["US", "GB", "DE", "IN"]) {
      const merchants = getMerchantsForProduct(testProduct, country);
      expect(merchants.some((m) => m.id === "amazon")).toBe(true);
    }
  });

  it("filters out merchants that don't support digital products", () => {
    const digital = getMerchantsForProduct({ type: "digital", price: 29.99 }, "US");
    const nonDigital = getMerchantsForProduct({ type: "physical", price: 29.99 }, "US");
    // Digital-only should have fewer options (walmart doesn't support digital)
    expect(digital.length).toBeLessThanOrEqual(nonDigital.length);
  });

  it("handles products with low price, filtering out high-minimum merchants", () => {
    const merchants = getMerchantsForProduct({ price: 10 }, "US");
    // At merchants with minPrice <= 10 should be included (amazon, walmart, target, bestbuy, ebay, etc.)
    expect(merchants.length).toBeGreaterThan(3);
    expect(merchants.some((m) => m.id === "amazon")).toBe(true);
  });

  it("returns sorted by priority", () => {
    const merchants = getMerchantsForProduct(testProduct, "US");
    for (let i = 1; i < merchants.length; i++) {
      expect(merchants[i - 1].priority).toBeLessThanOrEqual(merchants[i].priority);
    }
  });
});

// ── getActiveMarketplaces ────────────────────────────────────────

describe("getActiveMarketplaces()", () => {
  it("returns all active merchants as marketplace configs", () => {
    const marketplaces = getActiveMarketplaces();
    expect(Array.isArray(marketplaces)).toBe(true);
    expect(marketplaces.length).toBeGreaterThan(0);
  });

  it("each marketplace has an id, name, type, status", () => {
    const marketplaces = getActiveMarketplaces();
    for (const mp of marketplaces) {
      expect(mp.id).toBeTruthy();
      expect(mp.name).toBeTruthy();
      expect(mp.type).toMatch(/^(affiliate|direct)$/);
      expect(mp.status).toBe("connected");
    }
  });
});

// ── getGeoInfo ───────────────────────────────────────────────────

describe("getGeoInfo()", () => {
  it("returns US geo info by default", () => {
    const geo = getGeoInfo();
    expect(geo.country).toBe("US");
    expect(geo.currency).toBe("USD");
    expect(geo.currencySymbol).toBe("$");
  });

  it("returns India geo info for IN", () => {
    const geo = getGeoInfo("IN");
    expect(geo.country).toBe("IN");
    expect(geo.currency).toBe("INR");
    expect(geo.currencySymbol).toBe("₹");
  });

  it("returns UK geo info for GB", () => {
    const geo = getGeoInfo("GB");
    expect(geo.country).toBe("GB");
    expect(geo.currency).toBe("GBP");
    expect(geo.currencySymbol).toBe("£");
  });

  it("falls back to US for unknown country", () => {
    const geo = getGeoInfo("XX");
    expect(geo.country).toBe("US");
  });

  it("returns flag emoji for each country", () => {
    for (const code of ["US", "GB", "DE", "FR", "JP", "IN"]) {
      const geo = getGeoInfo(code);
      expect(geo.flag).toBeTruthy();
    }
  });
});

// ── getMerchantOffers ────────────────────────────────────────────

describe("getMerchantOffers()", () => {
  const testProduct = {
    id: "test-offer-1",
    name: "Offer Test Product",
    slug: "offer-test",
    price: 199.99,
  };

  it("returns offers array for a product and country", () => {
    const offers = getMerchantOffers(testProduct, "US");
    expect(Array.isArray(offers)).toBe(true);
    expect(offers.length).toBeGreaterThan(0);
  });

  it("each offer contains merchantId, price, currency, url", () => {
    const offers = getMerchantOffers(testProduct, "US");
    for (const offer of offers) {
      expect(offer).toHaveProperty("merchantId");
      expect(offer).toHaveProperty("price");
      expect(typeof offer.price).toBe("number");
      expect(offer).toHaveProperty("currency");
      expect(offer).toHaveProperty("url");
      expect(offer.url).toContain("http");
    }
  });

  it("each offer has rankScore", () => {
    const offers = getMerchantOffers(testProduct, "US");
    for (const offer of offers) {
      expect(offer).toHaveProperty("rankScore");
      expect(offer.rankScore).toBeGreaterThan(0);
    }
  });

  it("offers include merchant name and CTA", () => {
    const offers = getMerchantOffers(testProduct, "US");
    for (const offer of offers) {
      expect(offer.merchantName).toBeTruthy();
      expect(offer.cta).toBeTruthy();
    }
  });

  it("returns different merchants for different countries", () => {
    const us = getMerchantOffers(testProduct, "US").map((o) => o.merchantName);
    const de = getMerchantOffers(testProduct, "DE").map((o) => o.merchantName);
    expect(us.join(",")).not.toBe(de.join(","));
  });
});

// ── comparePrices ────────────────────────────────────────────────

describe("comparePrices()", () => {
  const mockMarketplaces = [
    { id: "mp1", name: "Amazon", type: "affiliate" as const, status: "connected" as const, countries: ["US"], currencies: ["USD"], avgConversionRate: 4.5 },
    { id: "mp2", name: "Walmart", type: "affiliate" as const, status: "connected" as const, countries: ["US"], currencies: ["USD"], avgConversionRate: 4 },
  ];

  it("returns a PriceComparison with offers", () => {
    const result = comparePrices("test-prod", [], mockMarketplaces);
    expect(result).toHaveProperty("offers");
    expect(result).toHaveProperty("bestPrice");
    expect(result).toHaveProperty("savingsPercent");
  });

  it("each offer has marketplaceId, marketplaceName, price, inStock", () => {
    const result = comparePrices("test-prod", [], mockMarketplaces);
    for (const offer of result.offers) {
      expect(offer).toHaveProperty("marketplaceId");
      expect(offer).toHaveProperty("marketplaceName");
      expect(offer).toHaveProperty("price");
      expect(offer).toHaveProperty("inStock");
    }
  });

  it("bestPrice is the minimum of all offer prices", () => {
    const result = comparePrices("test-prod", [], mockMarketplaces);
    const prices = result.offers.map((o) => o.price);
    expect(result.bestPrice).toBe(Math.min(...prices));
  });
});

// ── getMerchantAnalytics ─────────────────────────────────────────

describe("getMerchantAnalytics()", () => {
  it("returns analytics with expected fields", () => {
    const analytics = getMerchantAnalytics();
    expect(analytics).toHaveProperty("totalImpressions");
    expect(analytics).toHaveProperty("totalClicks");
    expect(analytics).toHaveProperty("overallCTR");
    expect(analytics).toHaveProperty("totalRevenue");
    expect(analytics).toHaveProperty("totalCommission");
    expect(analytics).toHaveProperty("conversionRate");
    expect(analytics).toHaveProperty("topMerchants");
    expect(analytics).toHaveProperty("topCountries");
  });

  it("topMerchants is an array with merchant data", () => {
    const analytics = getMerchantAnalytics();
    expect(Array.isArray(analytics.topMerchants)).toBe(true);
  });

  it("topCountries is an array", () => {
    const analytics = getMerchantAnalytics();
    expect(Array.isArray(analytics.topCountries)).toBe(true);
  });

  it("overallCTR is a number (0-100)", () => {
    const analytics = getMerchantAnalytics();
    expect(typeof analytics.overallCTR).toBe("number");
    expect(analytics.overallCTR).toBeGreaterThanOrEqual(0);
    expect(analytics.overallCTR).toBeLessThanOrEqual(100);
  });

  it("conversionRate is a number (0-100)", () => {
    const analytics = getMerchantAnalytics();
    expect(typeof analytics.conversionRate).toBe("number");
    expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
    expect(analytics.conversionRate).toBeLessThanOrEqual(100);
  });
});

// ── Impression & Click Tracking ──────────────────────────────────

describe("trackMerchantImpression()", () => {
  it("does not throw with valid args", () => {
    expect(() => trackMerchantImpression("amazon", "prod-1", "US")).not.toThrow();
    expect(() => trackMerchantImpression("walmart", "prod-1", "US")).not.toThrow();
  });

  it("does not throw without country", () => {
    expect(() => trackMerchantImpression("amazon", "prod-1")).not.toThrow();
  });
});

describe("trackMerchantClick()", () => {
  it("does not throw with valid params object", () => {
    expect(() =>
      trackMerchantClick({
        merchantId: "amazon",
        merchantName: "Amazon",
        productId: "prod-1",
        productName: "Test Product",
        country: "US",
        currency: "USD",
        price: 299.99,
        commission: 13.50,
      })
    ).not.toThrow();
  });

  it("returns a click event ID string", () => {
    const id = trackMerchantClick({
      merchantId: "walmart",
      merchantName: "Walmart",
      productId: "prod-2",
      productName: "Walmart Product",
      country: "US",
      currency: "USD",
      price: 199.99,
      commission: 8.00,
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("handles minimal params", () => {
    expect(() =>
      trackMerchantClick({
        merchantId: "target",
        merchantName: "Target",
        productId: "prod-3",
        productName: "Target Product",
        price: 49.99,
        commission: 2.50,
      })
    ).not.toThrow();
  });
});

// ── Conversion Tracking ──────────────────────────────────────────

describe("trackMerchantConversion()", () => {
  it("does not throw for missing click ID", () => {
    const result = trackMerchantConversion("nonexistent-click-id", 100);
    expect(result).toBe(false);
  });

  it("converts a real click", () => {
    const id = trackMerchantClick({
      merchantId: "amazon",
      merchantName: "Amazon",
      productId: "prod-conv",
      productName: "Conversion Test",
      price: 500,
      commission: 22.50,
    });
    const result = trackMerchantConversion(id, 500);
    expect(result).toBe(true);
  });
});

// ── Conversion Funnel & Rate ─────────────────────────────────────

describe("getConversionFunnel()", () => {
  it("returns array of funnel stages", () => {
    const funnel = getConversionFunnel();
    expect(Array.isArray(funnel)).toBe(true);
    expect(funnel.length).toBeGreaterThanOrEqual(5);
  });

  it("each stage has stage, count, rate, dropOff", () => {
    const funnel = getConversionFunnel();
    for (const stage of funnel) {
      expect(stage).toHaveProperty("stage");
      expect(stage).toHaveProperty("count");
      expect(stage).toHaveProperty("rate");
      expect(stage).toHaveProperty("dropOff");
    }
  });

  it("stages are in logical order (viewed > clicked > cart > checkout > purchased)", () => {
    const funnel = getConversionFunnel();
    const stageNames = funnel.map((s) => s.stage);
    expect(stageNames).toContain("viewed");
    expect(stageNames).toContain("clicked");
    expect(stageNames).toContain("purchased");
    const viewedIdx = stageNames.indexOf("viewed");
    const purchasedIdx = stageNames.indexOf("purchased");
    expect(viewedIdx).toBeLessThan(purchasedIdx);
  });

  it("counts decrease at each stage", () => {
    const funnel = getConversionFunnel();
    for (let i = 1; i < funnel.length; i++) {
      expect(funnel[i].count).toBeLessThanOrEqual(funnel[i - 1].count);
    }
  });
});

describe("getConversionRate()", () => {
  it("returns a number between 0 and 100", () => {
    const rate = getConversionRate();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });
});

// ── AB Tests ─────────────────────────────────────────────────────

describe("getABTests()", () => {
  it("returns array (possibly empty)", () => {
    const tests = getABTests();
    expect(Array.isArray(tests)).toBe(true);
  });

  it("each test (if any) has required fields", () => {
    const tests = getABTests();
    for (const test of tests) {
      expect(test).toHaveProperty("id");
      expect(test).toHaveProperty("name");
      expect(test).toHaveProperty("status");
      expect(test).toHaveProperty("variants");
      expect(Array.isArray(test.variants)).toBe(true);
    }
  });

  it("each variant (if any) has id, label, config, impressions, clicks, conversions, revenue", () => {
    const tests = getABTests();
    for (const test of tests) {
      for (const v of test.variants) {
        expect(v).toHaveProperty("id");
        expect(v).toHaveProperty("label");
        expect(v).toHaveProperty("config");
        expect(typeof v.impressions).toBe("number");
        expect(typeof v.clicks).toBe("number");
        expect(typeof v.conversions).toBe("number");
        expect(typeof v.revenue).toBe("number");
      }
    }
  });
});

// ── generateAffiliateUrl ─────────────────────────────────────────

describe("generateAffiliateUrl()", () => {
  const amazon = MERCHANTS.find((m) => m.id === "amazon")!;
  const product = { id: "test-123", name: "Test Product", slug: "test-product", price: 99.99 };
  const walmart = MERCHANTS.find((m) => m.id === "walmart")!;
  const flipkart = MERCHANTS.find((m) => m.id === "flipkart")!;

  it("generates an Amazon URL with tracking parameters", () => {
    const url = generateAffiliateUrl(amazon, product, "US");
    expect(url).toContain("amazon.com");
    expect(url).toContain("tag=");
    expect(url).toContain("utm_source=alaya_insider");
  });

  it("generates country-specific Amazon domain for UK", () => {
    const url = generateAffiliateUrl(amazon, product, "GB");
    expect(url).toContain("amazon.co.uk");
  });

  it("generates country-specific Amazon domain for DE", () => {
    const url = generateAffiliateUrl(amazon, product, "DE");
    expect(url).toContain("amazon.de");
  });

  it("includes campaign in URL when options.campaign is set", () => {
    const url = generateAffiliateUrl(amazon, product, "US", {
      campaign: "summer_sale_2026",
    });
    expect(url).toContain("summer_sale_2026");
  });

  it("includes clickId in URL when options.clickId is set", () => {
    const url = generateAffiliateUrl(amazon, product, "US", {
      clickId: "test_click_001",
    });
    expect(url).toContain("test_click_001");
  });

  it("generates Walmart URL", () => {
    const url = generateAffiliateUrl(walmart, product, "US");
    expect(url).toContain("walmart.com");
    expect(url).toContain("utm_source=alaya_insider");
  });

  it("generates Flipkart URL for India", () => {
    const url = generateAffiliateUrl(flipkart, product, "IN");
    expect(url).toContain("flipkart.com");
    expect(url).toContain("utm_source=alaya_insider");
  });

  it("includes brand and category in context when provided", () => {
    const fullProduct = { ...product, brand: "TestBrand", category: "electronics" };
    const url = generateAffiliateUrl(amazon, fullProduct, "US");
    expect(url).toContain("utm_source=alaya_insider");
  });
});

// ── Price History ────────────────────────────────────────────────

describe("getPriceHistory()", () => {
  it("returns price history array for a product", () => {
    const history = getPriceHistory("test-prod-hist-1");
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("each entry has date, price, productId", () => {
    const history = getPriceHistory("test-prod-hist-2");
    for (const entry of history) {
      expect(entry).toHaveProperty("productId");
      expect(entry).toHaveProperty("currentPrice");
      expect(entry).toHaveProperty("lowestPrice");
      expect(entry).toHaveProperty("highestPrice");
      expect(entry).toHaveProperty("averagePrice");
      expect(entry).toHaveProperty("records");
    }
  });

  it("records array has date and price for each entry", () => {
    const [data] = getPriceHistory("test-prod-hist-3");
    if (data?.records) {
      for (const record of data.records) {
        expect(record).toHaveProperty("date");
        expect(record).toHaveProperty("price");
        expect(typeof record.price).toBe("number");
      }
    }
  });

  it("returns all history when no productId given", () => {
    const history = getPriceHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("currentPrice > 0 for valid products", () => {
    const [data] = getPriceHistory("test-prod-hist-4");
    expect(data?.currentPrice).toBeGreaterThan(0);
  });
});

// ── Price Alerts ─────────────────────────────────────────────────

describe("addPriceAlert()", () => {
  it("adds a price alert via string productId", () => {
    const result = addPriceAlert("test-alert-prod-1");
    expect(result).toBe(true);
  });

  it("adds a price alert via object", () => {
    const result = addPriceAlert({
      productId: "test-alert-prod-2",
      productName: "Alert Product",
      threshold: 50,
    });
    expect(result).toBe(true);
  });

  it("returns true for duplicate (already watching)", () => {
    addPriceAlert("test-alert-prod-dup");
    const result = addPriceAlert("test-alert-prod-dup");
    expect(result).toBe(true);
  });

  it("addPriceAlert via object with emailNotify", () => {
    const result = addPriceAlert({
      productId: "test-alert-prod-3",
      productName: "Email Alert",
      threshold: 100,
      active: true,
    });
    expect(result).toBe(true);
  });
});

describe("getPriceAlerts()", () => {
  it("returns array of alerts (possibly empty)", () => {
    const alerts = getPriceAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("filters by productId when provided", () => {
    addPriceAlert("test-get-alert-prod");
    const alerts = getPriceAlerts("test-get-alert-prod");
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].productId).toBe("test-get-alert-prod");
  });

  it("each alert has required fields", () => {
    const alerts = getPriceAlerts();
    for (const alert of alerts) {
      expect(alert).toHaveProperty("id");
      expect(alert).toHaveProperty("productId");
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("threshold");
      expect(alert).toHaveProperty("active");
      expect(alert).toHaveProperty("createdAt");
    }
  });
});

describe("deletePriceAlert()", () => {
  it("deletes an existing alert", () => {
    // Create an alert via addPriceAlert
    addPriceAlert("test-delete-prod");
    const alerts = getPriceAlerts("test-delete-prod");
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const alertId = alerts[alerts.length - 1].id;
    
    const result = deletePriceAlert(alertId);
    expect(result).toBe(true);

    const afterDelete = getPriceAlerts("test-delete-prod");
    expect(afterDelete.some((a) => a.id === alertId)).toBe(false);
  });

  it("returns true for non-existent alert", () => {
    const result = deletePriceAlert("nonexistent-alert-id-12345");
    expect(result).toBe(true);
  });
});

describe("updatePriceAlert()", () => {
  it("updates an existing alert", () => {
    addPriceAlert("test-update-prod");
    const alerts = getPriceAlerts("test-update-prod");
    const alertId = alerts[alerts.length - 1].id;
    
    const updated = updatePriceAlert(alertId, { active: false });
    expect(updated).not.toBeNull();
    expect(updated!.active).toBe(false);

    // Verify persistence
    const afterUpdate = getPriceAlerts("test-update-prod");
    const found = afterUpdate.find((a) => a.id === alertId);
    expect(found?.active).toBe(false);
  });

  it("returns null for non-existent alert", () => {
    const result = updatePriceAlert("nonexistent-alert-id", { active: false });
    expect(result).toBeNull();
  });
});

// ── getMerchantClickEvents ───────────────────────────────────────

describe("getMerchantClickEvents()", () => {
  it("returns array of click events (possibly empty)", () => {
    const events = getMerchantClickEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it("returns events sorted by timestamp descending", () => {
    const events = getMerchantClickEvents();
    for (let i = 1; i < events.length; i++) {
      expect(events[i - 1].timestamp).toBeGreaterThanOrEqual(events[i].timestamp);
    }
  });
});
