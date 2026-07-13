/**
 * ALAYA INSIDER — CDN Edge Cache Headers (PR-11)
 * --------------------------------------------------------------------------
 * Configurable cache header generation for CDN delivery via Cloudflare,
 * BunnyCDN, CloudFront, and Fastly. Provides per-route cache control,
 * edge TTL configuration, and surrogate-key-based purging.
 */

/* ================================================================== */
/*  CACHE HEADER CONFIGURATION                                         */
/* ================================================================== */

export interface CachePolicy {
  /** Browser max-age in seconds */
  browserTTL: number;
  /** CDN edge max-age in seconds */
  edgeTTL: number;
  /** CDN stale-while-revalidate in seconds */
  staleWhileRevalidate: number;
  /** CDN stale-if-error in seconds */
  staleIfError: number;
  /** Whether to enable CDN caching */
  cdnEnabled: boolean;
  /** Surrogate keys for targeted purging */
  surrogateKeys: string[];
  /** Whether to vary by the Accept header (for WebP/AVIF) */
  varyAccept: boolean;
  /** Whether to vary by the Accept-Encoding header */
  varyEncoding: boolean;
  /** Whether to vary by language/country */
  varyGeo: boolean;
  /** Public/private directive */
  scope: "public" | "private";
}

const SECOND = 1;
const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;

/** Predefined cache policies for different content types */
export const CACHE_POLICIES: Record<string, CachePolicy> = {
  /** Static assets: JS, CSS, fonts, icons — long-lived, public */
  static: {
    browserTTL: MONTH,
    edgeTTL: MONTH,
    staleWhileRevalidate: WEEK,
    staleIfError: MONTH,
    cdnEnabled: true,
    surrogateKeys: ["static"],
    varyAccept: false,
    varyEncoding: true,
    varyGeo: false,
    scope: "public",
  },
  /** Images — long-lived, vary by accept for WebP/AVIF */
  images: {
    browserTTL: WEEK,
    edgeTTL: MONTH,
    staleWhileRevalidate: DAY,
    staleIfError: WEEK,
    cdnEnabled: true,
    surrogateKeys: ["images", "media"],
    varyAccept: true,
    varyEncoding: true,
    varyGeo: false,
    scope: "public",
  },
  /** API product/search data — short-lived */
  apiProducts: {
    browserTTL: MINUTE * 5,
    edgeTTL: MINUTE * 5,
    staleWhileRevalidate: MINUTE,
    staleIfError: HOUR,
    cdnEnabled: true,
    surrogateKeys: ["api", "products"],
    varyAccept: false,
    varyEncoding: true,
    varyGeo: false,
    scope: "public",
  },
  /** API dynamic data (orders, auth, cart) — no CDN caching */
  apiDynamic: {
    browserTTL: 0,
    edgeTTL: 0,
    staleWhileRevalidate: 0,
    staleIfError: 0,
    cdnEnabled: false,
    surrogateKeys: ["api-dynamic"],
    varyAccept: false,
    varyEncoding: false,
    varyGeo: false,
    scope: "private",
  },
  /** HTML pages — moderate edge caching */
  html: {
    browserTTL: MINUTE * 10,
    edgeTTL: HOUR,
    staleWhileRevalidate: MINUTE * 5,
    staleIfError: HOUR,
    cdnEnabled: true,
    surrogateKeys: ["html"],
    varyAccept: false,
    varyEncoding: true,
    varyGeo: true,
    scope: "public",
  },
  /** Search results — short edge cache, client-side invalidation */
  search: {
    browserTTL: MINUTE,
    edgeTTL: MINUTE * 2,
    staleWhileRevalidate: MINUTE,
    staleIfError: MINUTE * 10,
    cdnEnabled: true,
    surrogateKeys: ["search", "api"],
    varyAccept: false,
    varyEncoding: true,
    varyGeo: true,
    scope: "public",
  },
  /** Recommendations — moderate cache */
  recommendations: {
    browserTTL: MINUTE * 10,
    edgeTTL: MINUTE * 30,
    staleWhileRevalidate: MINUTE * 5,
    staleIfError: HOUR,
    cdnEnabled: true,
    surrogateKeys: ["recommendations", "api"],
    varyAccept: false,
    varyEncoding: true,
    varyGeo: true,
    scope: "public",
  },
  /** Affiliate links — moderate cache */
  affiliate: {
    browserTTL: MINUTE * 15,
    edgeTTL: HOUR,
    staleWhileRevalidate: MINUTE * 5,
    staleIfError: HOUR,
    cdnEnabled: true,
    surrogateKeys: ["affiliate", "api"],
    varyAccept: false,
    varyEncoding: true,
    varyGeo: true,
    scope: "public",
  },
};

/* ================================================================== */
/*  HEADER GENERATION                                                   */
/* ================================================================== */

/**
 * Generate cache-control header value string from a CachePolicy.
 */
export function buildCacheControl(policy: CachePolicy): string {
  const parts: string[] = [policy.scope];

  if (policy.browserTTL > 0) {
    parts.push(`max-age=${policy.browserTTL}`);
  } else {
    parts.push("no-cache");
  }

  if (policy.staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
  }

  if (policy.staleIfError > 0) {
    parts.push(`stale-if-error=${policy.staleIfError}`);
  }

  if (!policy.cdnEnabled) {
    parts.push("no-store");
  }

  return parts.join(", ");
}

/**
 * Generate CDN-specific headers (Cloudflare, BunnyCDN, CloudFront, Fastly).
 */
export function buildCDNHeaders(policy: CachePolicy): Record<string, string> {
  const headers: Record<string, string> = {};

  // CDN-Cache-Control — tells CDN how long to cache (separate from browser)
  if (policy.cdnEnabled && policy.edgeTTL > 0) {
    headers["CDN-Cache-Control"] = `max-age=${policy.edgeTTL}`;
  } else {
    headers["CDN-Cache-Control"] = "no-cache";
  }

  // Surrogate-Control — Fastly/BunnyCDN edge directive
  if (policy.cdnEnabled && policy.edgeTTL > 0) {
    headers["Surrogate-Control"] = `max-age=${policy.edgeTTL}`;
  }

  // Surrogate-Key — for purging by content type
  if (policy.surrogateKeys.length > 0) {
    headers["Surrogate-Key"] = policy.surrogateKeys.join(" ");
  }

  // Cloudflare specific
  if (policy.cdnEnabled && policy.edgeTTL > 0) {
    headers["CF-Cache-Status"] = "DYNAMIC"; // lets Cloudflare decide
  }

  return headers;
}

/**
 * Generate Vary header value from policy configuration.
 */
export function buildVaryHeader(policy: CachePolicy): string {
  const vary: string[] = [];

  if (policy.varyAccept) vary.push("Accept");
  if (policy.varyEncoding) vary.push("Accept-Encoding");
  if (policy.varyGeo) vary.push("CloudFront-Viewer-Country", "CF-IPCountry");

  return vary.length > 0 ? vary.join(", ") : "";
}

/**
 * Generate complete set of cache headers for a given policy name.
 */
export function getCacheHeaders(policyName: string): Record<string, string> {
  const policy = CACHE_POLICIES[policyName];
  if (!policy) return {};

  const headers: Record<string, string> = {};

  // Cache-Control
  headers["Cache-Control"] = buildCacheControl(policy);

  // CDN-specific headers
  const cdnHeaders = buildCDNHeaders(policy);
  Object.assign(headers, cdnHeaders);

  // Vary
  const vary = buildVaryHeader(policy);
  if (vary) headers["Vary"] = vary;

  // Expires (legacy, for HTTP/1.0 compat)
  if (policy.browserTTL > 0) {
    headers["Expires"] = new Date(Date.now() + policy.browserTTL * 1000).toUTCString();
  }

  // Pragma (legacy)
  if (policy.scope === "public" && policy.browserTTL > 0) {
    headers["Pragma"] = "cache";
  } else {
    headers["Pragma"] = "no-cache";
  }

  return headers;
}

/**
 * Generate headers for purging CDN cache for given surrogate keys.
 * Used when content is updated and CDN cache needs invalidation.
 */
export function getPurgeHeaders(keys: string[]): Record<string, string> {
  return {
    "Cache-Tag": keys.join(","),
    "Surrogate-Key": keys.join(" "),
    "CDN-Tag": keys.join(","),
  };
}

/**
 * Quick lookup: get cache-control string by policy name.
 */
export function getCacheControl(policyName: string): string {
  const policy = CACHE_POLICIES[policyName];
  if (!policy) return "no-cache";
  return buildCacheControl(policy);
}
