/**
 * ALAYA INSIDER — Rate Limiting Middleware (PR-12 Production Hardening)
 * --------------------------------------------------------------------------
 * Simple in-memory rate limiter for API protection.
 * Limits requests per IP within a rolling time window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

export interface RateLimitOptions {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Route pattern to apply this limit to */
  pathPattern?: RegExp;
  /** Whether to apply only to authenticated routes */
  authenticatedOnly?: boolean;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 100,
  windowMs: 60_000, // 1 minute
};

export function createRateLimiter(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (c: any, next: () => Promise<void>) => {
    // Skip if path doesn't match pattern
    if (opts.pathPattern && !opts.pathPattern.test(c.req.path)) {
      await next();
      return;
    }

    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
      || c.req.header("x-real-ip")
      || c.req.header("cf-connecting-ip")
      || "unknown";
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    c.header("X-RateLimit-Limit", String(opts.maxRequests));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.maxRequests - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > opts.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json({
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        status: 429,
      }, 429);
    }

    await next();
  };
}

// Pre-configured limiters for different route types
export const limiter = {
  /** General API: 100 req/min (excludes system/health routes) */
  api: createRateLimiter({ maxRequests: 100, windowMs: 60_000, pathPattern: /^(?!.*\/system\/)/ }),
  /** Auth endpoints: 10 req/min (stricter to prevent brute force) */
  auth: createRateLimiter({ maxRequests: 10, windowMs: 60_000, pathPattern: /\/auth\// }),
  /** Search endpoints: 60 req/min */
  search: createRateLimiter({ maxRequests: 60, windowMs: 60_000, pathPattern: /\/search\// }),
  /** Static assets: 300 req/min */
  static: createRateLimiter({ maxRequests: 300, windowMs: 60_000 }),
};
