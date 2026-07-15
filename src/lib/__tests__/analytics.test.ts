import { describe, expect, it, vi, beforeAll, afterAll, beforeEach } from "vitest";

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
  vi.stubGlobal("localStorage", createMockStorage());
  vi.stubGlobal("sessionStorage", createMockStorage());
  vi.stubGlobal("navigator", { language: "en-US", userAgent: "vitest" });
  vi.stubGlobal("crypto", { randomUUID: () => `test-uuid-${Date.now()}` });
});

afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(() => { localStorage.clear(); });

import {
  getMerchantAnalytics,
  trackMerchantImpression,
  trackMerchantClick,
  trackMerchantConversion,
  getMerchantClickEvents,
  getConversionFunnel,
  getConversionRate,
  getRevenueForecast,
  getRevenueAttribution,
  getCommissionAnalytics,
} from "../affiliateCommerce";

describe("trackMerchantImpression", () => {
  it("records impressions and they appear in analytics", () => {
    trackMerchantImpression("amazon", "prod-1", "US");
    trackMerchantImpression("walmart", "prod-1", "US");
    trackMerchantImpression("amazon", "prod-2", "GB");
    const analytics = getMerchantAnalytics();
    expect(analytics.totalImpressions).toBeGreaterThanOrEqual(3);
  });

  it("handles missing country gracefully", () => {
    expect(() => trackMerchantImpression("amazon", "prod-1")).not.toThrow();
  });
});

describe("trackMerchantClick", () => {
  it("click appears in click events", () => {
    const id = trackMerchantClick({
      merchantId: "amazon", merchantName: "Amazon",
      productId: "prod-1", productName: "Test",
      price: 100, commission: 5,
    });
    const events = getMerchantClickEvents();
    expect(events.some((e) => e.id === id)).toBe(true);
  });

  it("multiple clicks increment totalClicks", () => {
    trackMerchantClick({ merchantId: "walmart", merchantName: "Walmart", productId: "p1", productName: "P1", price: 50, commission: 2 });
    trackMerchantClick({ merchantId: "target", merchantName: "Target", productId: "p2", productName: "P2", price: 30, commission: 1 });
    const analytics = getMerchantAnalytics();
    expect(analytics.totalClicks).toBeGreaterThanOrEqual(2);
  });
});

describe("trackMerchantConversion", () => {
  it("returns false for non-existent click ID", () => {
    expect(trackMerchantConversion("nonexistent-id", 100)).toBe(false);
  });

  it("conversion updates analytics revenue", () => {
    const id = trackMerchantClick({
      merchantId: "amazon", merchantName: "Amazon",
      productId: "conv-prod", productName: "Conv Test",
      price: 200, commission: 9,
    });
    trackMerchantConversion(id, 200);
    const analytics = getMerchantAnalytics();
    expect(analytics.totalRevenue).toBeGreaterThanOrEqual(200);
    expect(analytics.conversionRate).toBeGreaterThan(0);
  });
});

describe("getMerchantAnalytics", () => {
  it("returns valid analytics structure", () => {
    const a = getMerchantAnalytics();
    expect(a).toHaveProperty("totalImpressions");
    expect(a).toHaveProperty("totalClicks");
    expect(a).toHaveProperty("overallCTR");
    expect(a).toHaveProperty("totalRevenue");
    expect(a).toHaveProperty("totalCommission");
    expect(a).toHaveProperty("conversionRate");
    expect(a).toHaveProperty("topMerchants");
    expect(a).toHaveProperty("topCountries");
    expect(Array.isArray(a.topMerchants)).toBe(true);
    expect(Array.isArray(a.topCountries)).toBe(true);
  });

  it("topMerchants have all required fields", () => {
    trackMerchantClick({ merchantId: "amazon", merchantName: "Amazon", productId: "p1", productName: "P1", price: 100, commission: 4.5 });
    const a = getMerchantAnalytics();
    for (const m of a.topMerchants) {
      expect(m).toHaveProperty("merchantId");
      expect(m).toHaveProperty("merchantName");
      expect(m).toHaveProperty("clicks");
      expect(m).toHaveProperty("impressions");
      expect(m).toHaveProperty("revenue");
      expect(m).toHaveProperty("commission");
      expect(m).toHaveProperty("ctr");
      expect(m).toHaveProperty("epc");
    }
  });

  it("CTR is between 0 and 100", () => {
    trackMerchantImpression("amazon", "p1", "US");
    trackMerchantClick({ merchantId: "amazon", merchantName: "Amazon", productId: "p1", productName: "P1", price: 100, commission: 4.5 });
    const a = getMerchantAnalytics();
    expect(a.overallCTR).toBeGreaterThanOrEqual(0);
    expect(a.overallCTR).toBeLessThanOrEqual(100);
  });
});

describe("getMerchantClickEvents", () => {
  it("returns events sorted by timestamp descending", () => {
    trackMerchantClick({ merchantId: "amazon", merchantName: "Amazon", productId: "p1", productName: "P1", price: 100, commission: 4.5 });
    trackMerchantClick({ merchantId: "walmart", merchantName: "Walmart", productId: "p2", productName: "P2", price: 80, commission: 3 });
    const events = getMerchantClickEvents();
    expect(events.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < events.length; i++) {
      expect(events[i - 1].timestamp).toBeGreaterThanOrEqual(events[i].timestamp);
    }
  });
});

describe("getConversionFunnel", () => {
  it("returns stages in logical order", () => {
    const funnel = getConversionFunnel();
    expect(funnel.length).toBeGreaterThanOrEqual(5);
    const stages = funnel.map((s) => s.stage);
    expect(stages).toContain("viewed");
    expect(stages).toContain("clicked");
    expect(stages).toContain("purchased");
    expect(stages.indexOf("viewed")).toBeLessThan(stages.indexOf("purchased"));
  });

  it("counts decrease at each stage", () => {
    const funnel = getConversionFunnel();
    for (let i = 1; i < funnel.length; i++) {
      expect(funnel[i].count).toBeLessThanOrEqual(funnel[i - 1].count);
    }
  });

  it("each stage has rate and dropOff", () => {
    const funnel = getConversionFunnel();
    for (const stage of funnel) {
      expect(typeof stage.rate).toBe("number");
      expect(typeof stage.dropOff).toBe("number");
      expect(stage.rate).toBeGreaterThanOrEqual(0);
      expect(stage.rate).toBeLessThanOrEqual(1);
    }
  });
});

describe("getConversionRate", () => {
  it("returns a number between 0 and 100", () => {
    const rate = getConversionRate();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });
});

describe("getRevenueForecast", () => {
  it("returns forecast with expected fields", () => {
    const forecast = getRevenueForecast();
    expect(forecast).toHaveProperty("currentMonth");
    expect(forecast).toHaveProperty("growthRate");
    expect(forecast).toHaveProperty("nextQuarter");
    expect(forecast).toHaveProperty("nextMonth");
    expect(forecast).toHaveProperty("thisQuarter");
    expect(typeof forecast.currentMonth).toBe("number");
    expect(forecast.currentMonth).toBeGreaterThan(0);
  });
});

describe("getRevenueAttribution", () => {
  it("returns array of attribution entries", () => {
    const attrib = getRevenueAttribution();
    expect(Array.isArray(attrib)).toBe(true);
    if (attrib.length > 0) {
      expect(attrib[0]).toHaveProperty("channel");
      expect(attrib[0]).toHaveProperty("revenue");
      expect(attrib[0]).toHaveProperty("orders");
    }
  });
});

describe("getCommissionAnalytics", () => {
  it("returns commission analytics structure", () => {
    const ca = getCommissionAnalytics();
    expect(ca).toHaveProperty("totalCommissionEarned");
    expect(ca).toHaveProperty("totalCommissionPending");
    expect(ca).toHaveProperty("totalCommissionPaid");
    expect(ca).toHaveProperty("avgCommissionRate");
    expect(ca).toHaveProperty("topPerformingPartner");
    expect(ca).toHaveProperty("commissionByPartner");
    expect(Array.isArray(ca.commissionByPartner)).toBe(true);
  });
});
