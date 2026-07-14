/**
 * ALAYA INSIDER — Affiliate API Client (V6)
 * --------------------------------------------------------------------------
 * Consumes the backend affiliate REST API with localStorage fallbacks.
 * All merchant data, click tracking, analytics, and price history
 * flows through this client to the backend when available.
 */

import { MERCHANTS, type MerchantConfig } from "./affiliateCommerce";

/* ================================================================== */
/*  API BASE URL                                                       */
/* ================================================================== */

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api/v1/affiliates`
  : `${window.location.protocol}//${window.location.hostname}:3001/api/v1/affiliates`;

// Outbound redirect uses the same base as the affiliate API
const API_OUT_BASE = API_BASE;

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

/* ================================================================== */
/*  GENERIC API HELPERS                                                */
/* ================================================================== */

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  try {
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      return { error: body.message || res.statusText, code: String(res.status) };
    }
    const data = await res.json();
    return { data };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { error: "timeout", code: "TIMEOUT" };
    }
    return { error: err.message, code: "NETWORK" };
  }
}

async function apiPost<T>(path: string, body?: any): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      return { error: errBody.message || res.statusText, code: String(res.status) };
    }
    const data = await res.json();
    return { data };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { error: "timeout", code: "TIMEOUT" };
    }
    return { error: err.message, code: "NETWORK" };
  }
}

async function apiPatch<T>(path: string, body?: any): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      return { error: errBody.message || res.statusText, code: String(res.status) };
    }
    const data = await res.json();
    return { data };
  } catch (err: any) {
    return { error: err.message, code: "NETWORK" };
  }
}

async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      return { error: errBody.message || res.statusText, code: String(res.status) };
    }
    const data = await res.json();
    return { data };
  } catch (err: any) {
    return { error: err.message, code: "NETWORK" };
  }
}

/* ================================================================== */
/*  MERCHANT API                                                       */
/* ================================================================== */

/**
 * Fetch merchants from backend. Falls back to hardcoded MERCHANTS array.
 * Merges backend data (which has proper IDs and configurations) with
 * the frontend SVGs and theme data.
 */
export async function fetchMerchants(): Promise<MerchantConfig[]> {
  // Try backend first
  const result = await apiGet<any[]>("/networks");
  if (result.data && Array.isArray(result.data) && result.data.length > 0) {
    // Map backend data to MerchantConfig format, merging with frontend SVGs
    return result.data.map((n: any) => {
      const existing = MERCHANTS.find((m) => m.id === n.provider || m.slug === n.provider);
      return {
        id: n.provider || n.id,
        name: n.name,
        slug: n.provider || n.id,
        logoSvg: existing?.logoSvg || "",
        domains: existing?.domains || [n.website || ""],
        countries: n.supports_countries || existing?.countries || [],
        currencies: n.supports_currencies || existing?.currencies || ["USD"],
        networks: [n.provider || "direct"],
        commissionRate: Number(n.max_commission) || existing?.commissionRate || 3,
        cookieDays: n.cookie_days || existing?.cookieDays || 30,
        active: n.active !== false,
        priority: n.failover_priority || existing?.priority || 50,
        isAffiliate: n.provider !== "direct",
        minPrice: existing?.minPrice,
        maxPrice: existing?.maxPrice,
        supportsDigital: existing?.supportsDigital || false,
        shipsGlobal: existing?.shipsGlobal || false,
        returnDays: existing?.returnDays || 30,
        trustScore: existing?.trustScore || 70,
        verified: existing?.verified || false,
        theme: existing?.theme || { bg: "#333", text: "#FFF", border: "#555" },
        cta: existing?.cta || `Shop on ${n.name}`,
      };
    });
  }

  // Fallback: use hardcoded merchants
  return MERCHANTS;
}

/**
 * Create a merchant on the backend.
 */
export async function createMerchant(merchant: MerchantConfig): Promise<boolean> {
  const result = await apiPost("/networks", {
    provider: merchant.id,
    name: merchant.name,
    description: `${merchant.name} — ${merchant.countries.length} countries`,
    website: merchant.domains[0] || "",
    logo: merchant.logoSvg ? "inline-svg" : "",
    active: merchant.active,
    cookieDays: merchant.cookieDays,
    minCommission: merchant.commissionRate * 0.5,
    maxCommission: merchant.commissionRate,
    paymentThreshold: 50,
    paymentFrequency: "monthly",
    supportsCountries: merchant.countries,
    supportsCurrencies: merchant.currencies,
    failoverPriority: merchant.priority,
  });
  return !result.error;
}

/**
 * Update a merchant on the backend.
 */
export async function updateMerchant(id: string, patch: Partial<MerchantConfig>): Promise<boolean> {
  const body: Record<string, any> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.active !== undefined) body.active = patch.active;
  if (patch.commissionRate !== undefined) {
    body.minCommission = patch.commissionRate * 0.5;
    body.maxCommission = patch.commissionRate;
  }
  if (patch.priority !== undefined) body.failoverPriority = patch.priority;
  if (patch.countries !== undefined) body.supportsCountries = patch.countries;
  if (patch.currencies !== undefined) body.supportsCurrencies = patch.currencies;
  if (patch.cookieDays !== undefined) body.cookieDays = patch.cookieDays;
  if (patch.trustScore !== undefined) body.healthScore = patch.trustScore;

  const result = await apiPatch(`/networks/${id}`, body);
  return !result.error;
}

/**
 * Delete a merchant on the backend.
 */
export async function deleteMerchant(id: string): Promise<boolean> {
  const result = await apiDelete(`/networks/${id}`);
  return !result.error;
}

/* ================================================================== */
/*  CLICK TRACKING — Route through /api/v1/out                         */
/* ================================================================== */

/**
 * Generate a click-tracked affiliate URL that routes through the backend.
 * If the backend is unreachable, falls back to direct URL generation.
 */
export function buildTrackedUrl(params: {
  merchantId: string;
  productId?: string;
  url: string;
  country?: string;
  sessionId?: string;
  campaign?: string;
}): string {
  const outUrl = new URL(`${API_OUT_BASE}/out`);
  outUrl.searchParams.set("url", params.url);
  outUrl.searchParams.set("linkId", params.merchantId);
  if (params.productId) outUrl.searchParams.set("productId", params.productId);
  if (params.country) outUrl.searchParams.set("country", params.country);
  if (params.sessionId) outUrl.searchParams.set("sessionId", params.sessionId);
  if (params.campaign) outUrl.searchParams.set("campaign", params.campaign);
  outUrl.searchParams.set("device", /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop");
  return outUrl.toString();
}

/* ================================================================== */
/*  ANALYTICS API                                                      */
/* ================================================================== */

/**
 * Fetch affiliate analytics from the backend.
 */
export async function fetchAffiliateAnalytics(days = 30) {
  const result = await apiGet("/analytics", { days: String(days) });
  if (result.data) return result.data;
  return null;
}

/**
 * Fetch click stats from the backend.
 */
export async function fetchClickStats(days = 30) {
  const result = await apiGet("/clicks/stats", { days: String(days) });
  if (result.data) return result.data;
  return null;
}

/* ================================================================== */
/*  PRICE HISTORY API                                                  */
/* ================================================================== */

/**
 * Fetch price history from the backend.
 */
export async function fetchPriceHistory(productId: string, days = 90) {
  const result = await apiGet(`/prices/by-product/${productId}`, { days: String(days) });
  if (result.data) return result.data;
  return null;
}

/**
 * Record a price snapshot on the backend.
 */
export async function recordPriceSnapshot(params: {
  productId: string;
  price: number;
  currency?: string;
  inStock?: boolean;
  url?: string;
}) {
  return apiPost("/prices", params);
}

/**
 * Fetch price alerts from the backend.
 */
export async function fetchPriceAlerts(productId?: string) {
  const path = productId ? `/prices/alerts?productId=${productId}` : "/prices/alerts";
  const result = await apiGet(path);
  if (result.data) return result.data;
  return [];
}
