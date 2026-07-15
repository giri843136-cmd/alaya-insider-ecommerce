/**
 * ALAYA INSIDER — DevOps & Site Reliability Engine
 * -----------------------------------------------------------------
 * Environment management, health monitoring, caching, deployment tracking,
 * performance metrics, maintenance mode, and disaster recovery.
 */

/* --------------------------- Environments ------------------------------ */

export type EnvName = "development" | "staging" | "production";

export interface Environment {
  name: EnvName;
  label: string;
  url: string;
  branch: string;
  status: "healthy" | "degraded" | "down";
  lastDeploy?: number;
  version: string;
  secrets: { key: string; label: string; configured: boolean }[];
}

export const environments: Environment[] = [
  {
    name: "production", label: "Production", url: "https://alayainsider.com", branch: "main",
    status: "healthy", lastDeploy: Date.now() - 2 * 86400000, version: "1.0.0",
    secrets: [
      { key: "STRIPE_SECRET_KEY", label: "Stripe Secret", configured: true },
      { key: "PAYPAL_CLIENT_SECRET", label: "PayPal Secret", configured: true },
      { key: "MAILGUN_API_KEY", label: "Mailgun API Key", configured: true },
      { key: "OPENAI_API_KEY", label: "OpenAI API Key", configured: false },
      { key: "ALGOLIA_API_KEY", label: "Algolia Search Key", configured: false },
      { key: "CDN_ORIGIN_KEY", label: "CDN Origin Key", configured: true },
    ],
  },
  {
    name: "staging", label: "Staging", url: "https://staging.alayainsider.com", branch: "develop",
    status: "healthy", lastDeploy: Date.now() - 6 * 3600000, version: "1.1.0-beta",
    secrets: [
      { key: "STRIPE_SECRET_KEY", label: "Stripe Secret", configured: true },
      { key: "PAYPAL_CLIENT_SECRET", label: "PayPal Secret", configured: false },
      { key: "MAILGUN_API_KEY", label: "Mailgun API Key", configured: true },
    ],
  },
  {
    name: "development", label: "Development", url: "http://localhost:5173", branch: "feature/devops",
    status: "healthy", version: "1.1.0-dev",
    secrets: [
      { key: "STRIPE_SECRET_KEY", label: "Stripe Secret", configured: false },
    ],
  },
];

/* ----------------------------- Health checks --------------------------- */

export interface HealthCheck {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  detail: string;
  category: "app" | "db" | "cache" | "search" | "queue" | "cdn" | "email";
}

export function runHealthChecks(): HealthCheck[] {
  const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));
  return [
    { id: "app", name: "Application", status: "healthy", latencyMs: rnd(20, 60), detail: "All routes responding", category: "app" },
    { id: "db", name: "Database", status: "healthy", latencyMs: rnd(2, 12), detail: "Connection pool optimal", category: "db" },
    { id: "cache", name: "Object Cache", status: "healthy", latencyMs: rnd(0, 3), detail: "248 keys · 98.2% hit rate", category: "cache" },
    { id: "search", name: "Search Index", status: "healthy", latencyMs: rnd(8, 25), detail: "24 products indexed", category: "search" },
    { id: "queue", name: "Job Queue", status: "healthy", latencyMs: rnd(1, 5), detail: "0 jobs pending · 0 failed", category: "queue" },
    { id: "cdn", name: "CDN / Edge", status: "healthy", latencyMs: rnd(10, 30), detail: "Global edge cache active", category: "cdn" },
    { id: "email", name: "Email Delivery", status: "healthy", latencyMs: rnd(100, 300), detail: "Mailgun connected", category: "email" },
    { id: "storage", name: "Storage", status: "healthy", latencyMs: rnd(5, 15), detail: "1.2 MB used of unlimited", category: "app" },
  ];
}

/* --------------------------- Performance metrics ----------------------- */

export interface PerfMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  status: "pass" | "warn" | "fail";
  description: string;
}

export function perfMetrics(): PerfMetric[] {
  return [
    { name: "Page Load", value: 0.9, unit: "s", target: 2.0, status: "pass", description: "Full page load time" },
    { name: "LCP", value: 1.4, unit: "s", target: 2.5, status: "pass", description: "Largest Contentful Paint" },
    { name: "INP", value: 120, unit: "ms", target: 200, status: "pass", description: "Interaction to Next Paint" },
    { name: "CLS", value: 0.02, unit: "", target: 0.1, status: "pass", description: "Cumulative Layout Shift" },
    { name: "FCP", value: 0.6, unit: "s", target: 1.8, status: "pass", description: "First Contentful Paint" },
    { name: "TTFB", value: 180, unit: "ms", target: 600, status: "pass", description: "Time to First Byte" },
    { name: "API Response", value: 45, unit: "ms", target: 300, status: "pass", description: "Avg API latency" },
    { name: "DB Query", value: 8, unit: "ms", target: 50, status: "pass", description: "Avg query time" },
  ];
}

/* ----------------------------- Cache layers ---------------------------- */

export interface CacheLayer {
  id: string;
  name: string;
  keys: number;
  hitRate: number;
  sizeMb: number;
  enabled: boolean;
}

export const cacheLayers: CacheLayer[] = [
  { id: "page", name: "Full Page Cache", keys: 48, hitRate: 94.2, sizeMb: 12.4, enabled: true },
  { id: "object", name: "Object Cache", keys: 248, hitRate: 98.1, sizeMb: 3.2, enabled: true },
  { id: "query", name: "Query Cache", keys: 156, hitRate: 96.5, sizeMb: 1.8, enabled: true },
  { id: "fragment", name: "Fragment Cache", keys: 89, hitRate: 91.0, sizeMb: 2.1, enabled: true },
  { id: "api", name: "API Response Cache", keys: 312, hitRate: 87.3, sizeMb: 4.6, enabled: true },
  { id: "media", name: "Media Cache", keys: 184, hitRate: 99.2, sizeMb: 8.9, enabled: true },
  { id: "search", name: "Search Cache", keys: 67, hitRate: 85.1, sizeMb: 1.2, enabled: false },
];

/* --------------------------- Deployment history ------------------------ */

export interface Deployment {
  id: string;
  version: string;
  environment: EnvName;
  status: "success" | "failed" | "in_progress" | "rolled_back";
  deployedBy: string;
  commit: string;
  ts: number;
  durationMs: number;
  notes: string;
}

export const deploymentHistory: Deployment[] = [
  { id: "dep_1", version: "1.0.0", environment: "production", status: "success", deployedBy: "CI/CD Pipeline", commit: "a4f8c2e", ts: Date.now() - 2 * 86400000, durationMs: 184000, notes: "Initial production release — full platform launch" },
  { id: "dep_2", version: "1.0.1", environment: "staging", status: "success", deployedBy: "CI/CD Pipeline", commit: "b7e3d91", ts: Date.now() - 6 * 3600000, durationMs: 142000, notes: "CRM + DAM modules added" },
  { id: "dep_3", version: "0.9.8", environment: "production", status: "rolled_back", deployedBy: "admin", commit: "c2a1f44", ts: Date.now() - 5 * 86400000, durationMs: 98000, notes: "Rolled back due to cache invalidation issue" },
  { id: "dep_4", version: "0.9.7", environment: "production", status: "success", deployedBy: "CI/CD Pipeline", commit: "d9b8e33", ts: Date.now() - 7 * 86400000, durationMs: 165000, notes: "Security hardening + 2FA" },
];

/* ----------------------------- Migration log --------------------------- */

export interface Migration {
  id: string;
  version: string;
  name: string;
  status: "applied" | "pending" | "rolled_back";
  appliedAt?: number;
}

export const migrations: Migration[] = [
  { id: "mig_001", version: "v1", name: "initial_schema", status: "applied", appliedAt: Date.now() - 90 * 86400000 },
  { id: "mig_002", version: "v2", name: "add_brands_coupons_articles", status: "applied", appliedAt: Date.now() - 60 * 86400000 },
  { id: "mig_003", version: "v3", name: "add_questions_specs", status: "applied", appliedAt: Date.now() - 40 * 86400000 },
  { id: "mig_004", version: "v4", name: "add_suppliers_gateways_returns", status: "applied", appliedAt: Date.now() - 25 * 86400000 },
  { id: "mig_005", version: "v5", name: "add_hero_slides_homepage_builder", status: "applied", appliedAt: Date.now() - 18 * 86400000 },
  { id: "mig_006", version: "v6", name: "add_redirects_seo_studio", status: "applied", appliedAt: Date.now() - 12 * 86400000 },
  { id: "mig_007", version: "v7", name: "add_marketing_popups_referrals_loyalty", status: "applied", appliedAt: Date.now() - 8 * 86400000 },
  { id: "mig_008", version: "v8", name: "add_design_tokens_header_footer", status: "applied", appliedAt: Date.now() - 4 * 86400000 },
  { id: "mig_009", version: "v9", name: "add_crm_timeline_notes_tasks_tickets", status: "applied", appliedAt: Date.now() - 2 * 86400000 },
  { id: "mig_010", version: "v10", name: "add_support_tickets_dam_indexing", status: "applied", appliedAt: Date.now() - 1 * 86400000 },
  { id: "mig_011", version: "v11", name: "add_developer_extensions_webhooks", status: "pending" },
];

/* ----------------------------- Alert config ---------------------------- */

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: string;
  channel: "email" | "sms" | "dashboard";
  enabled: boolean;
}

export const alertRules: AlertRule[] = [
  { id: "alert_errors", name: "Application errors", metric: "error_rate", threshold: "> 1%", channel: "email", enabled: true },
  { id: "alert_latency", name: "High response time", metric: "p95_latency", threshold: "> 500ms", channel: "email", enabled: true },
  { id: "alert_jobs", name: "Failed background jobs", metric: "job_failures", threshold: "> 0", channel: "dashboard", enabled: true },
  { id: "alert_payment", name: "Payment failures", metric: "payment_error_rate", threshold: "> 2%", channel: "email", enabled: true },
  { id: "alert_aff", name: "Broken affiliate links", metric: "broken_links", threshold: "> 5", channel: "dashboard", enabled: true },
  { id: "alert_backup", name: "Backup failures", metric: "backup_failed", threshold: "> 0", channel: "email", enabled: true },
  { id: "alert_storage", name: "Storage limit", metric: "disk_usage", threshold: "> 90%", channel: "email", enabled: true },
  { id: "alert_security", name: "Security incidents", metric: "security_events", threshold: "> 0", channel: "sms", enabled: true },
];

/* --------------------------- Maintenance mode -------------------------- */

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  endTime?: number;
  allowAdmins: boolean;
}

export const defaultMaintenance: MaintenanceConfig = {
  enabled: false,
  message: "We're performing scheduled maintenance to improve your experience. We'll be back shortly.",
  allowAdmins: true,
};

/* --------------------------- Centralized logs -------------------------- */

export type LogLevel = "info" | "warning" | "error" | "debug";
export type LogSource = "application" | "security" | "api" | "job" | "email" | "payment" | "affiliate" | "order" | "seo" | "media" | "system";

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  context?: string;
}

const LOG_KEY = "alaya_devops_logs";

export function getDevOpsLogs(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}

export function pushLog(level: LogLevel, source: LogSource, message: string, context?: string): LogEntry {
  const entry: LogEntry = { id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ts: Date.now(), level, source, message, context };
  const all = [entry, ...getDevOpsLogs()].slice(0, 300);
  try { localStorage.setItem(LOG_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return entry;
}

/** Seed initial DevOps logs. */
[
  { level: "info", source: "system", message: "DevOps monitoring initialized" },
  { level: "info", source: "application", message: "Application bootstrapped in 420ms" },
  { level: "info", source: "api", message: "API gateway started — 15 endpoints registered" },
  { level: "info", source: "system", message: "Cache layers primed — 7 active" },
  { level: "warning", source: "email", message: "Mailgun rate limit at 78% — within threshold" },
  { level: "info", source: "payment", message: "Stripe webhook verified — signature valid" },
  { level: "info", source: "affiliate", message: "Affiliate link validator: 24/24 links healthy" },
  { level: "info", source: "job", message: "Background job queue: 0 pending, 0 failed" },
  { level: "debug", source: "seo", message: "Sitemap generated — 34 URLs" },
  { level: "info", source: "media", message: "DAM indexer: 48 assets indexed, 0 duplicates" },
].forEach((e) => pushLog(e.level as LogLevel, e.source as LogSource, e.message));

/* ================================================================== */
/*  SECTION: Distributed Tracing                                       */
/* ================================================================== */

export interface Span {
  id: string;
  traceId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "ok" | "error" | "pending";
  tags: Record<string, string>;
  error?: string;
}

export interface Trace {
  id: string;
  name: string;
  rootOperation: string;
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  spanCount: number;
  errorCount: number;
  status: "healthy" | "degraded" | "error";
}

const TRACE_KEY = "alaya_devops_traces";

export function generateTrace(name: string, rootOperation: string): Trace {
  const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return { id, name, rootOperation, startTime: Date.now(), spanCount: 0, errorCount: 0, status: "healthy" };
}

export function createSpan(traceId: string, operation: string, service: string, parentSpanId?: string): Span {
  return {
    id: `span_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    traceId,
    parentSpanId,
    operation,
    service,
    startTime: Date.now(),
    status: "pending",
    tags: {},
  };
}

export function completeSpan(span: Span, error?: string): Span {
  const endTime = Date.now();
  const completed: Span = { ...span, endTime, durationMs: endTime - span.startTime, status: error ? "error" : "ok", error };
  const all = getTraces();
  const traceIdx = all.findIndex((t) => t.id === span.traceId);
  if (traceIdx !== -1) {
    const t = all[traceIdx];
    all[traceIdx] = {
      ...t,
      endTime,
      totalDurationMs: endTime - t.startTime,
      spanCount: t.spanCount + 1,
      errorCount: t.errorCount + (error ? 1 : 0),
      status: error ? "error" : t.errorCount > 0 ? "degraded" : "healthy",
    };
    saveTraces(all);
  }
  return completed;
}

export function saveTraces(traces: Trace[]) {
  try { localStorage.setItem(TRACE_KEY, JSON.stringify(traces.slice(0, 100))); } catch { /* ignore */ }
}

export function getTraces(): Trace[] {
  try { return JSON.parse(localStorage.getItem(TRACE_KEY) || "[]"); } catch { return []; }
}

export function getSpansForTrace(traceId: string): Span[] {
  try {
    const key = `alaya_spans_${traceId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch { return []; }
}

export function saveSpans(traceId: string, spans: Span[]) {
  try { localStorage.setItem(`alaya_spans_${traceId}`, JSON.stringify(spans)); } catch { /* ignore */ }
}

/** Seed initial traces for demo. */
(function seedTraces() {
  if (getTraces().length > 0) return;
  const recent: Trace[] = [
    { id: "trace_req_1", name: "Product page load", rootOperation: "GET /api/v1/products/amber-noir-01", startTime: Date.now() - 120000, endTime: Date.now() - 119200, totalDurationMs: 800, spanCount: 4, errorCount: 0, status: "healthy" },
    { id: "trace_req_2", name: "Order checkout", rootOperation: "POST /api/v1/orders", startTime: Date.now() - 300000, endTime: Date.now() - 298500, totalDurationMs: 1500, spanCount: 6, errorCount: 0, status: "healthy" },
    { id: "trace_req_3", name: "Search query", rootOperation: "GET /api/v1/search?q=gold", startTime: Date.now() - 600000, endTime: Date.now() - 599200, totalDurationMs: 800, spanCount: 3, errorCount: 0, status: "healthy" },
    { id: "trace_req_4", name: "Image upload", rootOperation: "POST /api/v1/media/upload", startTime: Date.now() - 900000, endTime: Date.now() - 897000, totalDurationMs: 3000, spanCount: 5, errorCount: 1, status: "degraded" },
    { id: "trace_req_5", name: "Affiliate sync", rootOperation: "POST /api/v1/affiliates/sync (legacy)", startTime: Date.now() - 1800000, endTime: Date.now() - 1797000, totalDurationMs: 3000, spanCount: 7, errorCount: 0, status: "healthy" },
  ];
  saveTraces(recent);
})();

/* ================================================================== */
/*  SECTION: Rollback & Release Management                             */
/* ================================================================== */

export interface Release {
  id: string;
  version: string;
  name: string;
  environment: EnvName;
  status: "draft" | "deploying" | "live" | "rolled_back" | "failed";
  deployedBy: string;
  commit: string;
  branch: string;
  artifacts: string[];
  changelog: string;
  ts: number;
  completedAt?: number;
  rollbackTarget?: string;
  rollbackReason?: string;
  rollbackedAt?: number;
}

export const releases: Release[] = [
  { id: "rel_1", version: "1.0.0", name: "Platform Launch", environment: "production", status: "live", deployedBy: "CI/CD Pipeline", commit: "a4f8c2e", branch: "main", artifacts: ["alaya-bundle.js", "alaya-styles.css", "alaya-assets.zip"], changelog: "Full platform launch with commerce, CMS, PIM, affiliate modules.", ts: Date.now() - 2 * 86400000, completedAt: Date.now() - 2 * 86400000 + 184000 },
  { id: "rel_2", version: "1.0.1", name: "CRM + DAM Update", environment: "staging", status: "live", deployedBy: "CI/CD Pipeline", commit: "b7e3d91", branch: "develop", artifacts: ["alaya-bundle.js", "alaya-styles.css"], changelog: "Added CRM timeline, DAM indexing, support tickets.", ts: Date.now() - 6 * 3600000, completedAt: Date.now() - 6 * 3600000 + 142000 },
  { id: "rel_3", version: "0.9.8", name: "Cache Fix Rollback Target", environment: "production", status: "rolled_back", deployedBy: "admin", commit: "c2a1f44", branch: "hotfix/cache", artifacts: ["alaya-bundle.js"], changelog: "Hotfix for cache invalidation — rolled back due to side effects.", ts: Date.now() - 5 * 86400000, rollbackReason: "Cache invalidation caused stale product data", rollbackedAt: Date.now() - 5 * 86400000 + 98000 },
  { id: "rel_4", version: "0.9.7", name: "Security Hardening", environment: "production", status: "rolled_back", deployedBy: "CI/CD Pipeline", commit: "d9b8e33", branch: "main", artifacts: ["alaya-bundle.js", "alaya-styles.css"], changelog: "2FA, CSRF, input sanitization, brute-force protection.", ts: Date.now() - 7 * 86400000, completedAt: Date.now() - 7 * 86400000 + 165000, rollbackTarget: "rel_1", rollbackReason: "Superseded by v1.0.0" },
];

export function performRollback(releaseId: string, reason: string): Release | null {
  const idx = releases.findIndex((r) => r.id === releaseId);
  if (idx === -1) return null;
  const rolled: Release = { ...releases[idx], status: "rolled_back", rollbackReason: reason, rollbackedAt: Date.now() };
  releases[idx] = rolled;
  pushLog("warning", "system", `Rollback executed: ${rolled.version} — ${reason}`);
  return rolled;
}

export function deployRelease(version: string, name: string, env: EnvName, commit: string): Release {
  const rel: Release = {
    id: `rel_${Date.now().toString(36)}`,
    version,
    name,
    environment: env,
    status: "deploying",
    deployedBy: "Manual",
    commit,
    branch: env === "production" ? "main" : "develop",
    artifacts: ["alaya-bundle.js", "alaya-styles.css"],
    changelog: name,
    ts: Date.now(),
  };
  releases.unshift(rel);
  pushLog("info", "system", `Release ${version} deploying to ${env}`);
  return rel;
}

/* ================================================================== */
/*  SECTION: CDN Integration & Edge Management                         */
/* ================================================================== */

export interface CdnConfig {
  provider: string;
  zoneId: string;
  domain: string;
  originUrl: string;
  active: boolean;
  sslEnabled: boolean;
  cachingRules: CdnCacheRule[];
  wafEnabled: boolean;
  ddosProtection: boolean;
  edgeLocations: number;
  monthlyBandwidthGb: number;
  bandwidthUsedGb: number;
}

export interface CdnCacheRule {
  path: string;
  ttl: number;
  bypassCookies: boolean;
  enabled: boolean;
}

export const cdnConfig: CdnConfig = {
  provider: "Cloudflare",
  zoneId: "z_abc123def",
  domain: "alayainsider.com",
  originUrl: "https://origin.alayainsider.com",
  active: true,
  sslEnabled: true,
  cachingRules: [
    { path: "/assets/*", ttl: 31536000, bypassCookies: true, enabled: true },
    { path: "/api/*", ttl: 0, bypassCookies: false, enabled: true },
    { path: "/media/*", ttl: 604800, bypassCookies: true, enabled: true },
    { path: "/", ttl: 300, bypassCookies: false, enabled: true },
  ],
  wafEnabled: true,
  ddosProtection: true,
  edgeLocations: 320,
  monthlyBandwidthGb: 500,
  bandwidthUsedGb: 247,
};

/* ================================================================== */
/*  SECTION: Image & Asset Optimization                                 */
/* ================================================================== */

export interface ImageOptimizationConfig {
  autoFormat: boolean;
  quality: number;
  responsiveImages: boolean;
  lazyLoad: boolean;
  webpEnabled: boolean;
  avifEnabled: boolean;
  maxWidth: number;
  maxHeight: number;
  compressionLevel: "lossless" | "lossy" | "auto";
}

export const defaultImageOptimization: ImageOptimizationConfig = {
  autoFormat: true,
  quality: 82,
  responsiveImages: true,
  lazyLoad: true,
  webpEnabled: true,
  avifEnabled: false,
  maxWidth: 1920,
  maxHeight: 1080,
  compressionLevel: "auto",
};

export interface AssetOptimizationStats {
  totalAssets: number;
  totalSizeKb: number;
  optimizedSizeKb: number;
  savedKb: number;
  savedPercent: number;
  cssSizeKb: number;
  jsSizeKb: number;
  fontSizeKb: number;
  imageSizeKb: number;
}

export function getAssetOptimizationStats(): AssetOptimizationStats {
  return {
    totalAssets: 42,
    totalSizeKb: 1234,
    optimizedSizeKb: 876,
    savedKb: 358,
    savedPercent: 29,
    cssSizeKb: 48,
    jsSizeKb: 312,
    fontSizeKb: 124,
    imageSizeKb: 750,
  };
}

export interface ImageBreakpoint {
  width: number;
  label: string;
  suffix: string;
}

export const imageBreakpoints: ImageBreakpoint[] = [
  { width: 320, label: "Mobile S", suffix: "-xs" },
  { width: 640, label: "Mobile L", suffix: "-sm" },
  { width: 768, label: "Tablet", suffix: "-md" },
  { width: 1024, label: "Desktop", suffix: "-lg" },
  { width: 1920, label: "Retina", suffix: "-xl" },
];

/* ================================================================== */
/*  SECTION: Worker Pools & Management                                 */
/* ================================================================== */

export type WorkerStatus = "running" | "idle" | "paused" | "error" | "terminated";

export interface WorkerPool {
  id: string;
  name: string;
  queue: string;
  concurrency: number;
  activeWorkers: number;
  status: WorkerStatus;
  jobsProcessed: number;
  jobsFailed: number;
  avgProcessingMs: number;
  uptimeHours: number;
  lastHeartbeat?: number;
}

export const workerPools: WorkerPool[] = [
  { id: "pool_email", name: "Email Workers", queue: "email", concurrency: 5, activeWorkers: 3, status: "running", jobsProcessed: 12480, jobsFailed: 12, avgProcessingMs: 340, uptimeHours: 720, lastHeartbeat: Date.now() - 3000 },
  { id: "pool_image", name: "Image Processors", queue: "image_optimization", concurrency: 3, activeWorkers: 2, status: "running", jobsProcessed: 8720, jobsFailed: 8, avgProcessingMs: 1200, uptimeHours: 720, lastHeartbeat: Date.now() - 5000 },
  { id: "pool_affiliate", name: "Affiliate Validators", queue: "affiliate", concurrency: 2, activeWorkers: 1, status: "running", jobsProcessed: 4290, jobsFailed: 3, avgProcessingMs: 580, uptimeHours: 480, lastHeartbeat: Date.now() - 2000 },
  { id: "pool_search", name: "Search Indexers", queue: "search_indexing", concurrency: 2, activeWorkers: 0, status: "idle", jobsProcessed: 1560, jobsFailed: 1, avgProcessingMs: 2200, uptimeHours: 240, lastHeartbeat: Date.now() - 60000 },
  { id: "pool_report", name: "Report Generators", queue: "report_generation", concurrency: 1, activeWorkers: 1, status: "running", jobsProcessed: 890, jobsFailed: 2, avgProcessingMs: 4500, uptimeHours: 120, lastHeartbeat: Date.now() - 4000 },
];

export interface JobSchedule {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  queue: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  avgDurationMs: number;
  status: "idle" | "running" | "error";
}

export const jobSchedules: JobSchedule[] = [
  { id: "sched_sitemap", name: "Sitemap Generation", description: "Generate XML sitemap for search engines", cronExpression: "0 2 * * *", queue: "report_generation", enabled: true, lastRun: Date.now() - 20 * 3600000, nextRun: Date.now() + 4 * 3600000, avgDurationMs: 3200, status: "idle" },
  { id: "sched_backup", name: "Daily Backup", description: "Full store data snapshot", cronExpression: "0 3 * * *", queue: "backup", enabled: true, lastRun: Date.now() - 20 * 3600000, nextRun: Date.now() + 4 * 3600000, avgDurationMs: 8400, status: "idle" },
  { id: "sched_index", name: "Search Index Rebuild", description: "Rebuild search index hourly", cronExpression: "0 * * * *", queue: "search_indexing", enabled: true, lastRun: Date.now() - 30 * 60000, nextRun: Date.now() + 30 * 60000, avgDurationMs: 2200, status: "running" },
  { id: "sched_seo", name: "SEO Recalculation", description: "Recalculate SEO scores weekly", cronExpression: "0 1 * * 0", queue: "seo_generation", enabled: true, lastRun: Date.now() - 3 * 86400000, nextRun: Date.now() + 4 * 86400000, avgDurationMs: 5600, status: "idle" },
  { id: "sched_aff", name: "Affiliate Link Validation", description: "Validate all affiliate links daily", cronExpression: "0 4 * * *", queue: "affiliate_link_validation", enabled: true, lastRun: Date.now() - 20 * 3600000, nextRun: Date.now() + 4 * 3600000, avgDurationMs: 4100, status: "idle" },
  { id: "sched_email", name: "Scheduled Email Dispatch", description: "Send queued marketing & transactional emails", cronExpression: "*/5 * * * *", queue: "email_send", enabled: true, lastRun: Date.now() - 3 * 60000, nextRun: Date.now() + 2 * 60000, avgDurationMs: 1800, status: "running" },
];

/* ================================================================== */
/*  SECTION: Disaster Recovery & Observability                          */
/* ================================================================== */

export interface DrPlan {
  id: string;
  name: string;
  type: "backup" | "replication" | "failover" | "multi_region";
  status: "active" | "inactive" | "testing";
  rpo: string;
  rto: string;
  lastTested?: number;
  lastTestResult?: "pass" | "fail" | "pending";
  regions: string[];
  procedures: string[];
}

export const drPlans: DrPlan[] = [
  {
    id: "dr_backup", name: "Automated Backup Recovery", type: "backup", status: "active",
    rpo: "24 hours", rto: "1 hour", lastTested: Date.now() - 14 * 86400000, lastTestResult: "pass",
    regions: ["us-east-1"],
    procedures: ["Verify backup integrity", "Restore from latest snapshot", "Run health checks", "Verify data consistency"],
  },
  {
    id: "dr_replica", name: "Read Replica Failover", type: "replication", status: "active",
    rpo: "5 minutes", rto: "5 minutes", lastTested: Date.now() - 7 * 86400000, lastTestResult: "pass",
    regions: ["us-east-1", "us-west-2"],
    procedures: ["Detect primary failure", "Promote replica", "Update connection strings", "Verify replication lag"],
  },
  {
    id: "dr_multiregion", name: "Multi-Region Failover", type: "multi_region", status: "testing",
    rpo: "15 minutes", rto: "15 minutes", lastTested: Date.now() - 30 * 86400000, lastTestResult: "pending",
    regions: ["us-east-1", "eu-west-1", "ap-southeast-1"],
    procedures: ["Health check failure detected", "Route53 failover", "Spin up standby region", "Sync latest data", "Verify traffic shift"],
  },
  {
    id: "dr_cdn", name: "CDN Failover", type: "failover", status: "active",
    rpo: "0 minutes", rto: "1 minute", lastTested: Date.now() - 3 * 86400000, lastTestResult: "pass",
    regions: ["global"],
    procedures: ["Edge failure detected", "Failover to secondary CDN", "Verify edge health", "Monitor traffic shift"],
  },
];

export interface ObservabilityMetric {
  name: string;
  value: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
  unit: string;
  sparkline: number[];
}

export function getObservabilityMetrics(): ObservabilityMetric[] {
  return [
    { name: "Request Rate", value: "1,247", trend: "up", changePercent: 12.3, unit: "req/min", sparkline: [980, 1050, 1120, 1080, 1150, 1200, 1247] },
    { name: "Error Rate", value: "0.02", trend: "down", changePercent: 5.1, unit: "%", sparkline: [0.08, 0.06, 0.04, 0.05, 0.03, 0.02, 0.02] },
    { name: "P95 Latency", value: "245", trend: "down", changePercent: 8.2, unit: "ms", sparkline: [320, 290, 280, 270, 260, 250, 245] },
    { name: "P99 Latency", value: "890", trend: "stable", changePercent: 1.5, unit: "ms", sparkline: [920, 910, 880, 900, 870, 885, 890] },
    { name: "CPU Usage", value: "42", trend: "up", changePercent: 3.7, unit: "%", sparkline: [38, 40, 39, 41, 40, 43, 42] },
    { name: "Memory Usage", value: "1.8", trend: "up", changePercent: 2.1, unit: "GB", sparkline: [1.6, 1.7, 1.7, 1.8, 1.7, 1.9, 1.8] },
    { name: "Disk IO", value: "64", trend: "stable", changePercent: 0.5, unit: "MB/s", sparkline: [60, 62, 65, 63, 64, 66, 64] },
    { name: "Active Connections", value: "182", trend: "up", changePercent: 6.8, unit: "conn", sparkline: [140, 150, 160, 155, 170, 175, 182] },
  ];
}

/* ================================================================== */
/*  SECTION: Security Monitoring                                       */
/* ================================================================== */

export interface SecurityIncident {
  id: string;
  ts: number;
  severity: "critical" | "high" | "medium" | "low";
  type: "brute_force" | "xss_attempt" | "sql_injection" | "unauthorized_access" | "rate_limit" | "suspicious_ip" | "file_upload" | "token_breach";
  source: string;
  detail: string;
  ip: string;
  blocked: boolean;
  resolved: boolean;
}

const INCIDENT_KEY = "alaya_devops_security_incidents";

export function getSecurityIncidents(): SecurityIncident[] {
  try { return JSON.parse(localStorage.getItem(INCIDENT_KEY) || "[]"); } catch { return []; }
}

export function logSecurityIncident(incident: Omit<SecurityIncident, "id" | "ts">): SecurityIncident {
  const entry: SecurityIncident = {
    ...incident,
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
  };
  const all = [entry, ...getSecurityIncidents()].slice(0, 200);
  try { localStorage.setItem(INCIDENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  pushLog("warning", "security", `Security incident: ${entry.type} — ${entry.detail}`, entry.ip);
  return entry;
}

export const SEVERITY_CONFIG = {
  critical: { color: "bg-danger/15 text-danger", label: "Critical", icon: "alert" },
  high: { color: "bg-warning/15 text-warning", label: "High", icon: "warning" },
  medium: { color: "bg-accent-soft text-accent", label: "Medium", icon: "info" },
  low: { color: "bg-success/15 text-success", label: "Low", icon: "check" },
} as const;

/* Seed initial incidents */
(function seedIncidents() {
  if (getSecurityIncidents().length > 0) return;
  const now = Date.now();
  [
    { severity: "medium" as const, type: "brute_force" as const, source: "Auth", detail: "Multiple failed login attempts from same IP", ip: "185.234.78.12", blocked: true, resolved: true },
    { severity: "high" as const, type: "sql_injection" as const, source: "WAF", detail: "SQL injection pattern blocked on /api/v1/products", ip: "91.203.45.67", blocked: true, resolved: true },
    { severity: "low" as const, type: "rate_limit" as const, source: "API Gateway", detail: "Client exceeded rate limit on /api/v1/search", ip: "78.145.32.90", blocked: false, resolved: true },
    { severity: "critical" as const, type: "unauthorized_access" as const, source: "Admin", detail: "Unauthorized attempt to access /admin/system", ip: "203.45.67.89", blocked: true, resolved: false },
    { severity: "medium" as const, type: "xss_attempt" as const, source: "Input Filter", detail: "XSS payload detected in product review", ip: "156.78.90.12", blocked: true, resolved: false },
  ].forEach((inc, i) => {
    const entry: SecurityIncident = { ...inc, id: `sec_seed_${i}`, ts: now - (i * 7200000) };
    const all = getSecurityIncidents();
    all.push(entry);
    try { localStorage.setItem(INCIDENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  });
})();

/* ================================================================== */
/*  SECTION: Operational Analytics                                     */
/* ================================================================== */

export interface OpsAnalytic {
  metric: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  period: string;
  status: "good" | "warning" | "critical";
}

export function getOperationalAnalytics(): OpsAnalytic[] {
  return [
    { metric: "Uptime (30d)", value: 99.99, unit: "%", previousValue: 99.97, changePercent: 0.02, period: "30 days", status: "good" },
    { metric: "Avg Response Time", value: 128, unit: "ms", previousValue: 145, changePercent: -11.7, period: "7 days", status: "good" },
    { metric: "Cache Hit Rate", value: 94.8, unit: "%", previousValue: 93.2, changePercent: 1.7, period: "24 hours", status: "good" },
    { metric: "Error Rate", value: 0.03, unit: "%", previousValue: 0.05, changePercent: -40.0, period: "24 hours", status: "good" },
    { metric: "Deploy Frequency", value: 4, unit: "deploys/wk", previousValue: 3, changePercent: 33.3, period: "7 days", status: "good" },
    { metric: "MTTR", value: 12, unit: "min", previousValue: 18, changePercent: -33.3, period: "30 days", status: "good" },
    { metric: "MTBF", value: 168, unit: "hours", previousValue: 144, changePercent: 16.7, period: "30 days", status: "good" },
    { metric: "Change Failure Rate", value: 2.5, unit: "%", previousValue: 4.0, changePercent: -37.5, period: "30 days", status: "good" },
  ];
}

/* ================================================================== */
/*  SECTION: Alert Trigger Engine (simulated)                          */
/* ================================================================== */

export function evaluateAlertRules(): { rule: AlertRule; triggered: boolean; currentValue: string }[] {
  const rnd = () => Math.random();
  return alertRules.map((rule) => {
    const r = rnd();
    const triggered = rule.enabled && r < 0.08;
    const currentValue = triggered ? `EXCEEDED ${rule.threshold}` : `${(r * 100).toFixed(1)}%${rule.metric === "disk_usage" ? "" : ""}`;
    return { rule, triggered, currentValue };
  });
}
