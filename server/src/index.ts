/**
 * ALAYA INSIDER — Backend REST API Server
 * --------------------------------------------------------------------------
 * Hono server implementing all endpoints from src/lib/api-endpoints.ts.
 * Uses PostgreSQL for persistent storage with connection pooling,
 * automatic migration, seed data migration, and backup scheduling.
 *
 * Start:  npm run dev  (or: tsx watch src/index.ts)
 * Port:   3001 (configurable via PORT env var)
 * Health: GET /api/v1/system/health
 */

import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import { csrf } from "hono/csrf";
import { limiter } from "./middleware/rateLimiter.js";
import { validateEnv } from "./middleware/validateEnv.js";
import { routes } from "./routes/index.js";
import { errorEnvelope, type Variables } from "./lib/context.js";

// PostgreSQL Database
import { checkDbHealth, waitForDatabase, closePool, ENV } from "./db/index.js";
import { runMigrations } from "./db/migrate.js";
import { runSeedMigration } from "./db/seed.js";
import { initRepositories } from "./db/repositories/init.js";

// Payment Platform
import { initPaymentProviders } from "./services/payments/registry.js";

// Observability
import { writeLog } from "./services/observabilityEngine.js";

// Background Job Queue
import { startDefaultWorker, scheduleJob, registerHandler } from "./services/jobQueue.js";

// Validate environment variables on startup
validateEnv();

/* ================================================================== */
/*  HONO VARIABLE TYPES (imported from lib/context.ts)                */
/* ================================================================== */

type AppType = { Variables: Variables };

/* ================================================================== */
/*  HELPER: Generate request & trace IDs                               */
/* ================================================================== */

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateTraceId(): string {
  return `trace_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ================================================================== */
/*  DATABASE INITIALIZATION                                            */
/* ================================================================== */

async function initializeDatabase(): Promise<void> {
  const connected = await waitForDatabase();
  if (!connected) {
    await writeLog({ level: "warning", message: "Could not connect to PostgreSQL — database unavailable", service: "server", module: "database" }).catch(() => {});
    return;
  }

  // Run migrations
  try {
    await runMigrations();
    await writeLog({ level: "info", message: "Schema migrations applied successfully", service: "server", module: "database" }).catch(() => {});
  } catch (err) {
    await writeLog({ level: "error", message: `Migration failed: ${err}`, service: "server", module: "database" }).catch(() => {});
    return;
  }

  // Initialize repositories
  try {
    await initRepositories();
    await writeLog({ level: "info", message: "Repositories initialized", service: "server", module: "database" }).catch(() => {});
  } catch (err) {
    await writeLog({ level: "warning", message: `Repository initialization: ${err}`, service: "server", module: "database" }).catch(() => {});
  }

  // Seed data migration — gated behind SEED_ON_STARTUP env var for production deployments
  if (process.env.SEED_ON_STARTUP !== "false") {
    try {
      const { createSeedData } = await import("./seed/index.js");
      const store = createSeedData();
      const result = await runSeedMigration({
        products: store.products,
        categories: store.categories,
        brands: store.brands,
        orders: store.orders,
        coupons: store.coupons,
        articles: store.articles,
        customers: store.customers,
        suppliers: store.suppliers,
        paymentGateways: store.paymentGateways,
        returns: store.returns,
        redirects: store.redirects,
        popups: store.popups,
        affiliates: store.affiliates,
        loyaltyTiers: store.loyaltyTiers,
        liveSales: store.liveSales,
        settings: store.settings,
      });
      if (result.totalRowsMigrated > 0) {
        await writeLog({ level: "info", message: `Migrated ${result.totalRowsMigrated} rows from seed data`, service: "server", module: "seed" }).catch(() => {});
      }
    } catch (err) {
      await writeLog({ level: "warning", message: `Seed migration skipped: ${err instanceof Error ? err.message : err}`, service: "server", module: "seed" }).catch(() => {});
    }
  }

  // Initialize payment providers
  try {
    await initPaymentProviders();
    await writeLog({ level: "info", message: "Payment providers initialized", service: "server", module: "payments" }).catch(() => {});
  } catch (err) {
    await writeLog({ level: "warning", message: `Payment provider initialization skipped: ${err instanceof Error ? err.message : err}`, service: "server", module: "payments" }).catch(() => {});
  }

  // Start background job worker
  try {
    startDefaultWorker();
    await writeLog({ level: "info", message: "Background job worker started", service: "server", module: "jobs" }).catch(() => {});
  } catch (err) {
    await writeLog({ level: "warning", message: `Background worker start skipped: ${err instanceof Error ? err.message : err}`, service: "server", module: "jobs" }).catch(() => {});
  }

  // Register merchant sync job handlers
  try {
    const { registerMerchantSyncHandlers } = await import("./services/merchantSyncEngine.js");
    await registerMerchantSyncHandlers();
    await writeLog({ level: "info", message: "Merchant sync handlers registered", service: "server", module: "jobs" }).catch(() => {});
  } catch (err) {
    await writeLog({ level: "warning", message: `Merchant sync handler registration skipped: ${err instanceof Error ? err.message : err}`, service: "server", module: "jobs" }).catch(() => {});
  }

  // Schedule recurring maintenance jobs
  // These run in the background after server starts, no blocking needed
  // scheduleJob returns a cleanup function (() => void), not a Promise, so no .catch() is needed
  scheduleJob("affiliate-price-refresh", "affiliate-price", 3600000, () => ({}), { priority: 3 });
  scheduleJob("affiliate-health-check", "affiliate-health", 86400000, () => ({}), { priority: 2 });
  // merchant-sync-full requires admin to configure provider credentials first
  // The placeholder job runs daily but will only produce results when a provider is configured
  scheduleJob("merchant-sync-full", "affiliate-price", 86400000, () => ({ provider: "amazon_associates" }), { priority: 3 });
  scheduleJob("cleanup-otp", "cleanup", 3600000, () => ({}), { priority: 1 });
  scheduleJob("cleanup-sessions", "cleanup", 3600000, () => ({}), { priority: 1 });
  scheduleJob("search-reindex", "search-reindex", 86400000, () => ({ entity: "products" }), { priority: 2 });
}

// Initialize DB on startup
initializeDatabase().catch((err) => {
  writeLog({ level: "error", message: `Database initialization failed: ${err}`, service: "server", module: "database" }).catch(() => {});
});

const app = new Hono<AppType>();

/* ================================================================== */
/*  REQUEST ID & TRACE ID (before all other middleware)                */
/* ================================================================== */

app.use("*", async (c, next) => {
  const requestId = generateRequestId();
  const traceId = generateTraceId();
  c.set("requestId", requestId);
  c.set("traceId", traceId);
  c.header("X-Request-Id", requestId);
  c.header("X-Trace-Id", traceId);
  await next();
});

/* ================================================================== */
/*  GLOBAL MIDDLEWARE                                                  */
/* ================================================================== */

// Determine allowed origins based on environment
const isProduction = ENV === "production";
const allowedOrigins = isProduction
  ? [
      "https://alayainsider.com",
      "https://www.alayainsider.com",
    ]
  : [
      "http://localhost:5173",
      "http://localhost:4173",
      // Allow production origins even in dev for testing
      "https://alayainsider.com",
      "https://www.alayainsider.com",
    ];

app.use("*", cors({
  origin: allowedOrigins,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Client-Version", "X-Client-Platform"],
  exposeHeaders: ["X-Request-Id", "X-Trace-Id", "X-Cache"],
  maxAge: 86400,
  credentials: true,
}));

app.use("*", logger());
app.use("*", secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    // 'unsafe-inline' required by React for style injection during hydration
    // 'unsafe-eval' removed — no dynamic eval usage in production code
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://*.alayainsider.com", "https://*.amazon.com", "https://*.amazonaws.com"],
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "https://*.alayainsider.com", "https://api.stripe.com", "https://hooks.stripe.com"],
    frameSrc: ["'self'", "https://*.stripe.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },
  // COEP is intentionally disabled (cross-origin resources needed for Amazon images, Google Fonts, Stripe)
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: "same-origin",
  crossOriginOpenerPolicy: "same-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
}));

// Security hardening headers
app.use("*", async (c, next) => {
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  c.header("Origin-Agent-Cluster", "?1");
  await next();
});

app.use("*", csrf({
  origin: allowedOrigins,
}));
app.use("*", prettyJSON());

/* ================================================================== */
/*  HEALTH CHECK & SYSTEM ENDPOINTS (registered before rate limiter)   */
/* ================================================================== */

app.get("/api/v1/system/health", async (c) => {
  // Check PostgreSQL health
  let dbHealth = null;
  try {
    dbHealth = await checkDbHealth();
  } catch {
    dbHealth = { status: "unhealthy", poolTotal: 0, poolActive: 0, poolIdle: 0, poolWaiting: 0, latencyMs: 0, env: ENV, database: "unknown" };
  }

  return c.json({
    status: dbHealth.status === "healthy" ? "healthy" : "degraded",
    version: "2.0.0",
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: ENV,
    database: {
      status: dbHealth.status,
      poolTotal: dbHealth.poolTotal,
      poolActive: dbHealth.poolActive,
      poolIdle: dbHealth.poolIdle,
      latencyMs: dbHealth.latencyMs,
    },
  });
});

app.get("/api/v1/system/info", (c) => {
  return c.json({
    name: "ALAYA INSIDER API",
    version: "2.0.0",
    environment: ENV,
    nodeVersion: process.version,
    platform: process.platform,
    database: "PostgreSQL",
    supportedEndpoints: 60,
  });
});

/* ================================================================== */
/*  RATE LIMITING (after health routes so Railway health checks pass)   */
/* ================================================================== */

app.use("/api/v1/auth/*", limiter.auth);
app.use("/api/v1/search/*", limiter.search);
app.use("/api/v1/*", limiter.api);

/* ================================================================== */
/*  ALL ROUTES                                                         */
/* ================================================================== */

app.route("/api/v1", routes);

/* ================================================================== */
/*  STATIC FILE SERVING (Frontend SPA + Uploads)                       */
/* ================================================================== */

app.use("/uploads/*", serveStatic({ root: "./data" }));

/* Serve frontend static assets */
app.use("/assets/*", serveStatic({ root: "./public" }));

/* SPA fallback — serves index.html for all non-API, non-upload routes */
app.get("/*", async (c, next) => {
  const path = c.req.path;
  // Let API and upload routes pass through to their handlers or 404
  if (path.startsWith("/api/") || path.startsWith("/uploads/")) {
    return next();
  }
  // Serve index.html for SPA client-side routing
  return serveStatic({ path: "./public/index.html" })(c, next);
});

/* ================================================================== */
/*  STANDARDISED ERROR RESPONSE (imported from lib/context.ts)       */
/* ================================================================== */

app.onError((err, c) => {
  const requestId = c.get?.("requestId") || "unknown";
  const traceId = c.get?.("traceId") || "unknown";
  writeLog({
    level: "error",
    message: `Unhandled error [${requestId}]: ${err.message}`,
    service: "server",
    module: "error_handler",
    metadata: { requestId, traceId, error: err.stack },
  }).catch(() => {});

  return c.json(errorEnvelope(c, 500, "INTERNAL_ERROR", err.message || "Internal server error"), 500);
});

app.notFound((c) => {
  writeLog({
    level: "warning",
    message: `Route not found: ${c.req.method} ${c.req.path}`,
    service: "server",
    module: "router",
    metadata: { method: c.req.method, path: c.req.path },
  }).catch(() => {});

  return c.json(
    errorEnvelope(c, 404, "NOT_FOUND", `Route not found: ${c.req.method} ${c.req.path}`),
    404,
  );
});

/* ================================================================== */
/*  GRACEFUL SHUTDOWN                                                  */
/* ================================================================== */

process.on("SIGINT", async () => {
  await writeLog({ level: "info", message: "Shutting down gracefully (SIGINT)", service: "server", module: "shutdown" }).catch(() => {});
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await writeLog({ level: "info", message: "Shutting down gracefully (SIGTERM)", service: "server", module: "shutdown" }).catch(() => {});
  await closePool();
  process.exit(0);
});

/* ================================================================== */
/*  START SERVER                                                       */
/* ================================================================== */

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

writeLog({ level: "info", message: `Server started on port ${port} (${ENV})`, service: "server", module: "startup" }).catch(() => {});

serve({ fetch: app.fetch, port, hostname: host });
