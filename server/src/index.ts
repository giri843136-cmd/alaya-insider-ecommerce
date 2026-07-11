/**
 * ALAYA INSIDER — Backend REST API Server
 * ============================================================================
 * Production-ready Hono server that serves the API defined in src/lib/api-endpoints.ts.
 *
 * Usage
 * -----
 *   npm run dev       — Start with tsx watch
 *   npm start         — Start with tsx
 *   npm run build     — Compile with tsc
 *
 * Environment variables
 * ---------------------
 *   PORT    — Server port (default 3001)
 *   HOST    — Listen address (default "0.0.0.0")
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import { routes } from "./routes/index.js";

const app = new Hono();

/* ------------------------------------------------------------------ */
/*  Global middleware                                                   */
/* ------------------------------------------------------------------ */

app.use("*", cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:4173",
    "https://alayainsider.com",
  ],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-API-Key"],
  credentials: true,
}));

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", prettyJSON());

/* Inject a unique request ID for every request */
app.use("*", async (c, next) => {
  c.header("X-Request-Id", crypto.randomUUID());
  await next();
});

/* ------------------------------------------------------------------ */
/*  System endpoints (health & info)                                    */
/* ------------------------------------------------------------------ */

const startTime = Date.now();

app.get("/api/v1/system/health", (c) =>
  c.json({
    status: "healthy",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  }),
);

app.get("/api/v1/system/info", (c) =>
  c.json({
    environment: process.env.NODE_ENV ?? "development",
    node: process.version,
    platform: process.platform,
    endpoints: "/api/v1/*",
  }),
);

/* ------------------------------------------------------------------ */
/*  Application routes                                                  */
/* ------------------------------------------------------------------ */

app.route("/api/v1", routes);

/* ------------------------------------------------------------------ */
/*  Global error handler & 404                                          */
/* ------------------------------------------------------------------ */

app.onError((err, c) => {
  console.error(err.message);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

/* ------------------------------------------------------------------ */
/*  Start server                                                        */
/* ------------------------------------------------------------------ */

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

serve({ fetch: app.fetch, port, hostname: host });
