/**
 * ALAYA INSIDER — Enterprise Observability Platform
 * ------------------------------------------------------------------
 * Centralized operational intelligence: structured logging, distributed
 * tracing, health monitoring, incident management, audit platform,
 * live dashboards, alerting, performance analytics, and service topology.
 *
 * Extends the existing DevOps/SRE infrastructure from devops.ts with
 * enterprise-grade observability capabilities.
 */
import { uid } from "./utils";
import { pushLog, type LogLevel, type LogSource } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const OBSERVABILITY_KEY = "alaya_observability_store";
export const MAX_DASHBOARDS = 50;
export const MAX_WIDGETS = 200;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type ObsEntityType =
  | "application" | "api" | "database" | "cache" | "queue" | "storage" | "cdn"
  | "media" | "email" | "notification" | "workflow" | "ai" | "search" | "seo"
  | "affiliate" | "supplier" | "payment" | "auth" | "authorization" | "infrastructure";

export type ObsSeverity = "critical" | "high" | "medium" | "low" | "info";
export type ObsStatus = "healthy" | "degraded" | "down" | "maintenance" | "unknown";

/* ================================================================== */
/*  STRUCTURED LOGGING                                                 */
/* ================================================================== */

export interface StructuredLogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  context?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  tags: Record<string, string>;
  metadata: Record<string, string>;
  stackTrace?: string;
  retentionDays: number;
}

export interface LogQuery {
  levels?: LogLevel[];
  sources?: LogSource[];
  search?: string;
  from?: number;
  to?: number;
  tags?: Record<string, string>;
  correlationId?: string;
  limit?: number;
}

export function queryStructuredLogs(query: LogQuery): StructuredLogEntry[] {
  let logs = getAllStructuredLogs();
  if (query.levels) logs = logs.filter((l) => query.levels!.includes(l.level));
  if (query.sources) logs = logs.filter((l) => query.sources!.includes(l.source));
  if (query.search) { const s = query.search.toLowerCase(); logs = logs.filter((l) => l.message.toLowerCase().includes(s) || l.context?.toLowerCase().includes(s)); }
  if (query.from) logs = logs.filter((l) => l.ts >= query.from!);
  if (query.to) logs = logs.filter((l) => l.ts <= query.to!);
  if (query.correlationId) logs = logs.filter((l) => l.correlationId === query.correlationId);
  if (query.tags) logs = logs.filter((l) => Object.entries(query.tags!).every(([k, v]) => l.tags[k] === v));
  return logs.slice(0, query.limit || 100);
}

export function getAllStructuredLogs(): StructuredLogEntry[] {
  try { return JSON.parse(localStorage.getItem(`${OBSERVABILITY_KEY}_logs`) || "[]"); } catch { return []; }
}

export function writeStructuredLog(entry: Omit<StructuredLogEntry, "id" | "ts">): StructuredLogEntry {
  const log: StructuredLogEntry = { ...entry, id: uid("obslog"), ts: Date.now() };
  const all = [log, ...getAllStructuredLogs()].slice(0, 1000);
  try { localStorage.setItem(`${OBSERVABILITY_KEY}_logs`, JSON.stringify(all)); } catch { /* ignore */ }
  pushLog(entry.level, entry.source, entry.message, entry.context);
  return log;
}

export function getLogStats(): { totalLogs: number; byLevel: Record<string, number>; bySource: Record<string, number>; errorsLast24h: number } {
  const logs = getAllStructuredLogs();
  const byLevel: Record<string, number> = {}; const bySource: Record<string, number> = {};
  const dayAgo = Date.now() - 86400000;
  let errors24h = 0;
  logs.forEach((l) => {
    byLevel[l.level] = (byLevel[l.level] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    if (l.ts >= dayAgo && (l.level === "error" || l.level === "warning")) errors24h++;
  });
  return { totalLogs: logs.length, byLevel, bySource, errorsLast24h: errors24h };
}

/* ================================================================== */
/*  DISTRIBUTED TRACING (enhanced)                                     */
/* ================================================================== */

export type TraceEntityType =
  | "http_request" | "api_call" | "database_query" | "graphql_query"
  | "webhook" | "queue_job" | "background_job" | "ai_inference"
  | "search_query" | "auth_flow" | "workflow_execution" | "cache_operation"
  | "file_upload" | "email_send" | "notification_delivery";

export interface ObsSpan {
  id: string;
  traceId: string;
  parentSpanId?: string;
  operation: string;
  entityType: TraceEntityType;
  service: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "ok" | "error" | "pending";
  tags: Record<string, string>;
  error?: string;
  input?: string;
  output?: string;
}

export interface ObsTrace {
  id: string;
  name: string;
  rootOperation: string;
  entityType: TraceEntityType;
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  spanCount: number;
  errorCount: number;
  status: "healthy" | "degraded" | "error";
  userId?: string;
  correlationId?: string;
  tags: Record<string, string>;
}

const TRACE_STORE_KEY = `${OBSERVABILITY_KEY}_traces`;

export function getObsTraces(limit = 50): ObsTrace[] {
  try { return JSON.parse(localStorage.getItem(TRACE_STORE_KEY) || "[]").slice(0, limit); } catch { return []; }
}

export function getObsSpans(traceId: string): ObsSpan[] {
  try { return JSON.parse(localStorage.getItem(`${OBSERVABILITY_KEY}_spans_${traceId}`) || "[]"); } catch { return []; }
}

export function createObsTrace(name: string, rootOperation: string, entityType: TraceEntityType, tags?: Record<string, string>): ObsTrace {
  const trace: ObsTrace = {
    id: uid("obstrace"), name, rootOperation, entityType,
    startTime: Date.now(), spanCount: 0, errorCount: 0, status: "healthy",
    tags: tags || {}, correlationId: uid("corr"),
  };
  const all = [trace, ...getObsTraces(200)].slice(0, 200);
  try { localStorage.setItem(TRACE_STORE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return trace;
}

export function createObsSpan(traceId: string, operation: string, entityType: TraceEntityType, service: string, parentSpanId?: string): ObsSpan {
  return { id: uid("obsspan"), traceId, parentSpanId, operation, entityType, service, startTime: Date.now(), status: "pending", tags: {} };
}

export function completeObsSpan(span: ObsSpan, error?: string, output?: string): ObsSpan {
  const endTime = Date.now();
  const completed: ObsSpan = { ...span, endTime, durationMs: endTime - span.startTime, status: error ? "error" : "ok", error, output };
  const spans = [completed, ...getObsSpans(span.traceId)].slice(0, 100);
  try { localStorage.setItem(`${OBSERVABILITY_KEY}_spans_${span.traceId}`, JSON.stringify(spans)); } catch { /* ignore */ }

  const traces = getObsTraces(200);
  const tIdx = traces.findIndex((t) => t.id === span.traceId);
  if (tIdx !== -1) {
    traces[tIdx] = { ...traces[tIdx], endTime, totalDurationMs: endTime - traces[tIdx].startTime, spanCount: traces[tIdx].spanCount + 1, errorCount: traces[tIdx].errorCount + (error ? 1 : 0), status: error ? "error" : traces[tIdx].errorCount > 0 ? "degraded" : "healthy" };
    try { localStorage.setItem(TRACE_STORE_KEY, JSON.stringify(traces.slice(0, 200))); } catch { /* ignore */ }
  }
  return completed;
}

export function getTraceStats(): { total: number; errors: number; healthy: number; avgDurationMs: number } {
  const traces = getObsTraces(200);
  const total = traces.length; const errors = traces.filter((t) => t.status === "error").length;
  const healthy = traces.filter((t) => t.status === "healthy").length;
  const avgDuration = total > 0 ? Math.round(traces.reduce((s, t) => s + (t.totalDurationMs || 0), 0) / total) : 0;
  return { total, errors, healthy, avgDurationMs: avgDuration };
}

/* ================================================================== */
/*  SEED TRACE DATA                                                    */
/* ================================================================== */

(function seedObsTraces() {
  if (getObsTraces(1).length > 0) return;
  const entities: TraceEntityType[] = ["http_request", "api_call", "database_query", "webhook", "queue_job", "background_job", "ai_inference", "search_query", "auth_flow", "workflow_execution"];
  entities.forEach((type, i) => {
    const trace = createObsTrace(
      ["Product API", "Order Checkout", "Search Index", "Email Send", "AI Content Gen", "Webhook Delivery", "Auth Login", "Cache Warm", "Affiliate Sync", "Backup Job"][i],
      ["GET /api/v1/products", "POST /api/v1/checkout", "POST /api/v1/search/index", "POST /api/v1/email/send", "POST /api/v1/ai/generate", "POST /webhooks/deliver", "POST /api/v1/auth/login", "POST /api/v1/cache/warm", "POST /api/v1/affiliates/sync (legacy)", "POST /api/v1/backup/run"][i],
      type,
      { source: ["catalog", "checkout", "search", "notifications", "ai", "webhooks", "auth", "cache", "affiliates", "backup"][i] }
    );
    // Create a few spans for each trace
    const span1 = createObsSpan(trace.id, "parse request", type, trace.tags.source || "unknown");
    completeObsSpan(span1);
    const span2 = createObsSpan(trace.id, "process", type, trace.tags.source || "unknown", span1.id);
    completeObsSpan(span2, i === 3 ? "Timeout exceeded" : undefined);
    if (i % 3 === 0) {
      const span3 = createObsSpan(trace.id, "persist result", type, trace.tags.source || "unknown", span2.id);
      completeObsSpan(span3);
    }
  });
})();

/* ================================================================== */
/*  HEALTH CHECK FRAMEWORK (enhanced)                                  */
/* ================================================================== */

export interface DeepHealthCheck {
  id: string;
  name: string;
  entityType: ObsEntityType;
  status: ObsStatus;
  latencyMs: number;
  lastChecked: number;
  lastSuccess: number;
  lastFailure?: number;
  consecutiveFailures: number;
  detail: string;
  dependencies: string[];
  metadata: Record<string, string>;
}

export function runDeepHealthChecks(): DeepHealthCheck[] {
  const now = Date.now();
  const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));
  const healthy = (id: string, name: string, type: ObsEntityType, deps: string[] = [], detail = "Operational", metadata: Record<string, string> = {}) => ({
    id, name, entityType: type, status: "healthy" as ObsStatus, latencyMs: rnd(1, 50), lastChecked: now, lastSuccess: now, consecutiveFailures: 0, detail, dependencies: deps, metadata,
  });
  const degraded = (id: string, name: string, type: ObsEntityType, detail: string) => ({
    id, name, entityType: type, status: "degraded" as ObsStatus, latencyMs: rnd(200, 500), lastChecked: now, lastSuccess: now - 60000, lastFailure: now - 30000, consecutiveFailures: 2, detail, dependencies: [], metadata: {},
  });

  return [
    healthy("hc_app", "Application Server", "application", [], "All routes responding · 420ms uptime"),
    healthy("hc_api", "API Gateway", "api", ["hc_app"], "15 endpoints registered · 45ms avg latency"),
    healthy("hc_db", "Primary Database", "database", [], "Connection pool: 12/20 active · 8ms avg query"),
    healthy("hc_cache", "Redis Cache", "cache", ["hc_db"], "248 keys · 98.2% hit rate · 2ms latency"),
    healthy("hc_queue", "Job Queue", "queue", ["hc_db"], "0 pending · 0 failed · RabbitMQ connected"),
    healthy("hc_search", "Search Index", "search", ["hc_db"], "24 products indexed · Algolia connected"),
    healthy("hc_storage", "Object Storage", "storage", [], "1.2 GB used of 5 GB · S3 reachable"),
    healthy("hc_cdn", "CDN Edge", "cdn", ["hc_api"], "320 edge locations · Cloudflare active"),
    healthy("hc_email", "Email Provider", "email", [], "Mailgun connected · 340ms avg delivery"),
    healthy("hc_notification", "Notification Engine", "notification", ["hc_queue"], "WebSocket active · FCM connected"),
    healthy("hc_workflow", "Workflow Engine", "workflow", ["hc_db", "hc_queue"], "6 workflows active · 0 stuck"),
    healthy("hc_ai", "AI Inference", "ai", ["hc_api"], "GPT-4 ready · 1.2s avg inference"),
    healthy("hc_seo", "SEO Engine", "seo", ["hc_search"], "Sitemap generated · 34 URLs indexed"),
    healthy("hc_affiliate", "Affiliate Network", "affiliate", ["hc_api"], "4 networks connected · 1,240 links verified"),
    healthy("hc_supplier", "Supplier API", "supplier", ["hc_api"], "8 suppliers · EDI connected"),
    healthy("hc_payment", "Payment Gateway", "payment", ["hc_api"], "Stripe + PayPal · 180ms avg"),
    healthy("hc_auth", "Auth Service", "auth", ["hc_db"], "JWT + OAuth2 · 15ms avg"),
    healthy("hc_media", "Media Server", "media", ["hc_storage"], "48 assets · thumbnails generated"),
    degraded("hc_integration", "Third-Party Sync", "infrastructure", "High latency on CJ Affiliate API (820ms)"),
  ];
}

export function getHealthSummary(checks: DeepHealthCheck[]): { total: number; healthy: number; degraded: number; down: number; overall: ObsStatus; avgLatency: number } {
  const healthy = checks.filter((c) => c.status === "healthy").length;
  const degraded = checks.filter((c) => c.status === "degraded").length;
  const down = checks.filter((c) => c.status === "down").length;
  return {
    total: checks.length, healthy, degraded, down,
    overall: down > 0 ? "down" : degraded > 0 ? "degraded" : "healthy",
    avgLatency: Math.round(checks.reduce((s, c) => s + c.latencyMs, 0) / checks.length),
  };
}

/* ================================================================== */
/*  INCIDENT MANAGEMENT                                                */
/* ================================================================== */

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: ObsSeverity;
  status: "detected" | "investigating" | "identified" | "monitoring" | "resolved";
  entityType: ObsEntityType;
  source: string;
  detectedAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  timeline: IncidentEvent[];
  assignedTo?: string;
  tags: Record<string, string>;
}

export interface IncidentEvent {
  ts: number;
  action: string;
  by: string;
  detail: string;
}

const INCIDENT_KEY = `${OBSERVABILITY_KEY}_incidents`;

export function getIncidents(): Incident[] {
  try { return JSON.parse(localStorage.getItem(INCIDENT_KEY) || "[]"); } catch { return []; }
}

export function createIncident(input: Omit<Incident, "id" | "detectedAt" | "status" | "timeline">): Incident {
  const incident: Incident = { ...input, id: uid("inc"), detectedAt: Date.now(), status: "detected", timeline: [{ ts: Date.now(), action: "detected", by: "system", detail: "Incident automatically detected" }] };
  const all = [incident, ...getIncidents()].slice(0, 200);
  try { localStorage.setItem(INCIDENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  pushLog("error", "system", `Incident created: ${incident.title} (${incident.severity})`);
  return incident;
}

export function updateIncident(id: string, patch: Partial<Incident> & { action?: string; by?: string; detail?: string }): Incident | null {
  const all = getIncidents();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const { action, by, detail, ...rest } = patch;
  all[idx] = { ...all[idx], ...rest };
  if (action) all[idx].timeline.push({ ts: Date.now(), action, by: by || "system", detail: detail || action });
  try { localStorage.setItem(INCIDENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getIncidentStats(): { total: number; open: number; critical: number; avgResolutionMs: number } {
  const incidents = getIncidents();
  const total = incidents.length;
  const open = incidents.filter((i) => i.status !== "resolved").length;
  const critical = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length;
  const resolved = incidents.filter((i) => i.status === "resolved" && i.resolvedAt && i.detectedAt);
  const avgResolution = resolved.length > 0 ? Math.round(resolved.reduce((s, i) => s + (i.resolvedAt! - i.detectedAt), 0) / resolved.length) : 0;
  return { total, open, critical, avgResolutionMs: avgResolution };
}

/* Seed incidents */
(function seedIncidents() {
  if (getIncidents().length > 0) return;
  [
    { title: "Payment Gateway Latency Spike", description: "Stripe API latency exceeded 2s threshold for 5 minutes", severity: "high" as ObsSeverity, entityType: "payment" as ObsEntityType, source: "Monitoring Rule", tags: { service: "stripe" } },
    { title: "CDN Edge Node Failure", description: "eu-west-1 edge node reporting 40% packet loss", severity: "critical" as ObsSeverity, entityType: "cdn" as ObsEntityType, source: "Heartbeat Monitor", tags: { region: "eu-west-1" } },
    { title: "Database Connection Pool Exhaustion", description: "Connection pool reached 95% capacity", severity: "medium" as ObsSeverity, entityType: "database" as ObsEntityType, source: "Threshold Alert", tags: { pool: "primary" } },
  ].forEach((inc) => {
    const incident = createIncident(inc as any);
    // Simulate timeline progression
    setTimeout(() => updateIncident(incident.id, { status: "investigating", action: "investigating", by: "auto-responder", detail: "Auto-assigned to on-call engineer" }), 100);
  });
})();

/* ================================================================== */
/*  AUDIT PLATFORM                                                     */
/* ================================================================== */

export type AuditAction =
  | "create" | "update" | "delete" | "read" | "login" | "logout" | "export"
  | "import" | "approve" | "reject" | "assign" | "transfer" | "archive"
  | "restore" | "permission_change" | "config_change" | "password_change"
  | "mfa_enable" | "mfa_disable" | "api_key_create" | "api_key_revoke"
  | "impersonate" | "break_glass" | "workflow_execute" | "deploy";

export type AuditEntityType =
  | "user" | "role" | "permission" | "product" | "order" | "customer"
  | "coupon" | "article" | "brand" | "category" | "supplier" | "affiliate"
  | "gateway" | "return" | "workflow" | "notification" | "media" | "seo"
  | "analytics" | "setting" | "api_key" | "webhook" | "extension"
  | "environment" | "deployment" | "migration" | "backup" | "report";

export interface AuditEntry {
  id: string;
  ts: number;
  actor: string;
  actorType: "user" | "admin" | "system" | "ai" | "api";
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  detail: string;
  changes?: { field: string; from?: string; to?: string }[];
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  severity: "info" | "warning" | "critical";
  metadata: Record<string, string>;
}

const AUDIT_KEY = `${OBSERVABILITY_KEY}_audit`;

export function getAuditEntries(limit = 200): AuditEntry[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]").slice(0, limit); } catch { return []; }
}

export function writeAuditEntry(entry: Omit<AuditEntry, "id" | "ts">): AuditEntry {
  const audit: AuditEntry = { ...entry, id: uid("audit"), ts: Date.now() };
  const all = [audit, ...getAuditEntries(1000)].slice(0, 1000);
  try { localStorage.setItem(AUDIT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  if (entry.severity !== "info") pushLog(entry.severity === "critical" ? "error" : "warning", "system", `Audit: ${entry.actor} ${entry.action} ${entry.entityType}`, entry.detail);
  return audit;
}

export function getAuditStats(): { total: number; byAction: Record<string, number>; byEntity: Record<string, number>; byActor: Record<string, number>; criticalCount: number } {
  const entries = getAuditEntries(1000);
  const byAction: Record<string, number> = {}; const byEntity: Record<string, number> = {}; const byActor: Record<string, number> = {};
  let criticalCount = 0;
  entries.forEach((e) => {
    byAction[e.action] = (byAction[e.action] || 0) + 1;
    byEntity[e.entityType] = (byEntity[e.entityType] || 0) + 1;
    byActor[e.actor] = (byActor[e.actor] || 0) + 1;
    if (e.severity === "critical") criticalCount++;
  });
  return { total: entries.length, byAction, byEntity, byActor, criticalCount };
}

/* ================================================================== */
/*  DASHBOARDS & WIDGETS                                               */
/* ================================================================== */

export type WidgetType =
  | "stat" | "timeseries" | "bar" | "pie" | "table" | "heatmap"
  | "service_map" | "alert_list" | "log_list" | "trace_list"
  | "incident_list" | "sparkline" | "gauge" | "geo_map";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  entityType?: ObsEntityType;
  metric?: string;
  width: 1 | 2 | 3 | 4;
  height: 1 | 2;
  config: Record<string, string>;
  position: { x: number; y: number };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: "executive" | "operations" | "security" | "performance" | "business" | "custom";
  widgets: DashboardWidget[];
  starred: boolean;
  refreshInterval: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
}

const DASHBOARD_KEY = `${OBSERVABILITY_KEY}_dashboards`;

export function getDashboards(): Dashboard[] {
  try { return JSON.parse(localStorage.getItem(DASHBOARD_KEY) || "[]"); } catch { return []; }
}

export function createDashboard(input: Omit<Dashboard, "id" | "createdAt" | "updatedAt">): Dashboard {
  const dash: Dashboard = { ...input, id: uid("dash"), createdAt: Date.now(), updatedAt: Date.now() };
  const all = [dash, ...getDashboards()].slice(0, MAX_DASHBOARDS);
  try { localStorage.setItem(DASHBOARD_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return dash;
}

export function updateDashboard(id: string, patch: Partial<Dashboard>): Dashboard | null {
  const all = getDashboards();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
  try { localStorage.setItem(DASHBOARD_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function deleteDashboard(id: string): boolean {
  const all = getDashboards().filter((d) => d.id !== id);
  try { localStorage.setItem(DASHBOARD_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return true;
}

/* Seed dashboards */
(function seedDashboards() {
  if (getDashboards().length > 0) return;
  createDashboard({
    name: "Executive Overview", description: "High-level business and infrastructure metrics", category: "executive",
    widgets: [
      { id: uid("w"), type: "stat", title: "System Health", width: 1, height: 1, config: { metric: "health" }, position: { x: 0, y: 0 } },
      { id: uid("w"), type: "stat", title: "Uptime (30d)", width: 1, height: 1, config: { metric: "uptime" }, position: { x: 1, y: 0 } },
      { id: uid("w"), type: "sparkline", title: "Request Rate", width: 2, height: 1, config: { metric: "requests" }, position: { x: 2, y: 0 } },
      { id: uid("w"), type: "incident_list", title: "Active Incidents", width: 2, height: 2, config: {}, position: { x: 0, y: 1 } },
      { id: uid("w"), type: "stat", title: "Avg Latency", width: 1, height: 1, config: { metric: "latency" }, position: { x: 2, y: 1 } },
      { id: uid("w"), type: "stat", title: "Error Rate", width: 1, height: 1, config: { metric: "errors" }, position: { x: 3, y: 1 } },
    ],
    starred: true, refreshInterval: 30000, createdBy: "system", tags: ["executive", "overview"],
  });
  createDashboard({
    name: "Operations Dashboard", description: "Real-time operational metrics and health", category: "operations",
    widgets: [
      { id: uid("w"), type: "service_map", title: "Service Topology", width: 2, height: 2, config: {}, position: { x: 0, y: 0 } },
      { id: uid("w"), type: "alert_list", title: "Active Alerts", width: 2, height: 1, config: {}, position: { x: 2, y: 0 } },
      { id: uid("w"), type: "log_list", title: "Recent Errors", width: 2, height: 1, config: { level: "error" }, position: { x: 2, y: 1 } },
    ],
    starred: false, refreshInterval: 15000, createdBy: "system", tags: ["operations"],
  });
  createDashboard({
    name: "Security Dashboard", description: "Security events, incidents, and audit trail", category: "security",
    widgets: [
      { id: uid("w"), type: "incident_list", title: "Security Incidents", width: 2, height: 2, config: { severity: "critical" }, position: { x: 0, y: 0 } },
      { id: uid("w"), type: "stat", title: "Failed Auth", width: 1, height: 1, config: { metric: "auth_failures" }, position: { x: 2, y: 0 } },
      { id: uid("w"), type: "stat", title: "Blocked IPs", width: 1, height: 1, config: { metric: "blocked_ips" }, position: { x: 3, y: 0 } },
    ],
    starred: false, refreshInterval: 10000, createdBy: "system", tags: ["security"],
  });
})();

/* ================================================================== */
/*  MONITORING RULES                                                   */
/* ================================================================== */

export type RuleCondition = "gt" | "lt" | "gte" | "lte" | "eq" | "neq";
export type RuleFrequency = "realtime" | "every_minute" | "every_5m" | "every_15m" | "hourly" | "daily";

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  entityType: ObsEntityType;
  metric: string;
  condition: RuleCondition;
  threshold: number;
  unit: string;
  frequency: RuleFrequency;
  severity: ObsSeverity;
  enabled: boolean;
  channels: ("email" | "slack" | "sms" | "dashboard")[];
  autoResolve: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  entityType: ObsEntityType;
  severity: ObsSeverity;
  value: number;
  threshold: number;
  condition: string;
  unit: string;
  triggeredAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  status: "triggered" | "acknowledged" | "resolved";
}

const RULE_KEY = `${OBSERVABILITY_KEY}_rules`;
const ALERT_EVENT_KEY = `${OBSERVABILITY_KEY}_alert_events`;

export function getMonitoringRules(): MonitoringRule[] {
  try { return JSON.parse(localStorage.getItem(RULE_KEY) || "[]"); } catch { return []; }
}

export function createMonitoringRule(input: Omit<MonitoringRule, "id" | "createdAt" | "updatedAt">): MonitoringRule {
  const rule: MonitoringRule = { ...input, id: uid("rule"), createdAt: Date.now(), updatedAt: Date.now() };
  const all = [rule, ...getMonitoringRules()];
  try { localStorage.setItem(RULE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return rule;
}

export function updateMonitoringRule(id: string, patch: Partial<MonitoringRule>): MonitoringRule | null {
  const all = getMonitoringRules(); const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
  try { localStorage.setItem(RULE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function deleteMonitoringRule(id: string): boolean {
  const all = getMonitoringRules().filter((r) => r.id !== id);
  try { localStorage.setItem(RULE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return true;
}

export function getAlertEvents(limit = 100): AlertEvent[] {
  try { return JSON.parse(localStorage.getItem(ALERT_EVENT_KEY) || "[]").slice(0, limit); } catch { return []; }
}

export function triggerAlert(rule: MonitoringRule, value: number): AlertEvent {
  const event: AlertEvent = {
    id: uid("alert"), ruleId: rule.id, ruleName: rule.name,
    entityType: rule.entityType, severity: rule.severity,
    value, threshold: rule.threshold, condition: rule.condition, unit: rule.unit,
    triggeredAt: Date.now(), status: "triggered",
  };
  const all = [event, ...getAlertEvents(500)].slice(0, 500);
  try { localStorage.setItem(ALERT_EVENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  writeAuditEntry({ actor: "monitoring", actorType: "system", action: "create", entityType: "setting", entityId: event.id, entityName: `Alert: ${rule.name}`, detail: `Alert triggered: ${rule.metric} ${rule.condition} ${rule.threshold} (current: ${value})`, severity: rule.severity === "critical" ? "critical" : "warning", metadata: { ruleId: rule.id } });
  return event;
}

export function acknowledgeAlert(id: string, userId: string): boolean {
  const all = getAlertEvents(500); const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], acknowledgedAt: Date.now(), acknowledgedBy: userId, status: "acknowledged" };
  try { localStorage.setItem(ALERT_EVENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return true;
}

export function resolveAlert(id: string): boolean {
  const all = getAlertEvents(500); const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], resolvedAt: Date.now(), status: "resolved" };
  try { localStorage.setItem(ALERT_EVENT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return true;
}

/* Seed monitoring rules */
(function seedRules() {
  if (getMonitoringRules().length > 0) return;
  [
    { name: "High Error Rate", description: "Application error rate exceeds 1%", entityType: "application" as ObsEntityType, metric: "error_rate", condition: "gt" as RuleCondition, threshold: 1, unit: "%", frequency: "every_minute" as RuleFrequency, severity: "critical" as ObsSeverity, enabled: true, channels: ["email", "slack"] as const, autoResolve: true },
    { name: "API Latency Warning", description: "P95 API latency exceeds 500ms", entityType: "api" as ObsEntityType, metric: "p95_latency", condition: "gt" as RuleCondition, threshold: 500, unit: "ms", frequency: "every_5m" as RuleFrequency, severity: "high" as ObsSeverity, enabled: true, channels: ["slack"] as const, autoResolve: true },
    { name: "Database Connection Pool", description: "Database connections exceed 80%", entityType: "database" as ObsEntityType, metric: "connection_usage", condition: "gt" as RuleCondition, threshold: 80, unit: "%", frequency: "every_minute" as RuleFrequency, severity: "high" as ObsSeverity, enabled: true, channels: ["email", "slack"] as const, autoResolve: true },
    { name: "Cache Hit Rate Low", description: "Cache hit rate drops below 85%", entityType: "cache" as ObsEntityType, metric: "hit_rate", condition: "lt" as RuleCondition, threshold: 85, unit: "%", frequency: "every_5m" as RuleFrequency, severity: "medium" as ObsSeverity, enabled: true, channels: ["dashboard"] as const, autoResolve: true },
    { name: "Disk Usage Warning", description: "Storage exceeds 90% capacity", entityType: "infrastructure" as ObsEntityType, metric: "disk_usage", condition: "gt" as RuleCondition, threshold: 90, unit: "%", frequency: "hourly" as RuleFrequency, severity: "high" as ObsSeverity, enabled: true, channels: ["email"] as const, autoResolve: false },
    { name: "Queue Backlog", description: "Queue depth exceeds 100 messages", entityType: "queue" as ObsEntityType, metric: "queue_depth", condition: "gt" as RuleCondition, threshold: 100, unit: "messages", frequency: "every_5m" as RuleFrequency, severity: "medium" as ObsSeverity, enabled: true, channels: ["slack", "dashboard"] as const, autoResolve: true },
    { name: "Payment Failure Rate", description: "Payment failure rate exceeds 2%", entityType: "payment" as ObsEntityType, metric: "failure_rate", condition: "gt" as RuleCondition, threshold: 2, unit: "%", frequency: "every_5m" as RuleFrequency, severity: "critical" as ObsSeverity, enabled: true, channels: ["email", "sms", "slack"] as const, autoResolve: true },
    { name: "Search Index Health", description: "Search index sync latency exceeds 5s", entityType: "search" as ObsEntityType, metric: "sync_latency", condition: "gt" as RuleCondition, threshold: 5000, unit: "ms", frequency: "every_15m" as RuleFrequency, severity: "medium" as ObsSeverity, enabled: true, channels: ["dashboard"] as const, autoResolve: true },
  ].forEach((r) => createMonitoringRule(r as any));
})();

/* ================================================================== */
/*  OPERATIONAL METRICS                                                */
/* ================================================================== */

export interface OperationalMetric {
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  sparkline: number[];
  description: string;
}

export function getOperationalMetrics(): OperationalMetric[] {
  const rnd = () => Math.random();
  return [
    { name: "Uptime (30d)", value: 99.99, unit: "%", previousValue: 99.97, changePercent: 0.02, trend: "up", status: "good", sparkline: [99.99, 99.98, 99.99, 99.97, 99.99, 99.99, 99.99, 99.98, 99.99], description: "Service availability SLA" },
    { name: "Request Rate", value: Math.round(1200 + rnd() * 300), unit: "req/min", previousValue: 1100, changePercent: 12, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(800 + rnd() * 600)), description: "Incoming request volume" },
    { name: "Avg Response Time", value: Math.round(120 + rnd() * 40), unit: "ms", previousValue: 145, changePercent: -11, trend: "down", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(100 + rnd() * 100)), description: "Average API response time" },
    { name: "P95 Latency", value: Math.round(250 + rnd() * 80), unit: "ms", previousValue: 280, changePercent: -7, trend: "down", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(200 + rnd() * 150)), description: "95th percentile latency" },
    { name: "Error Rate", value: parseFloat((rnd() * 0.5).toFixed(2)), unit: "%", previousValue: 0.03, changePercent: -40, trend: "down", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((rnd() * 0.8).toFixed(2))), description: "Percentage of failed requests" },
    { name: "Cache Hit Rate", value: parseFloat((94 + rnd() * 4).toFixed(1)), unit: "%", previousValue: 93.2, changePercent: 1.8, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((90 + rnd() * 8).toFixed(1))), description: "Overall cache effectiveness" },
    { name: "Active Users", value: Math.round(180 + rnd() * 40), unit: "users", previousValue: 165, changePercent: 9, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(120 + rnd() * 100)), description: "Concurrent active users" },
    { name: "CPU Utilization", value: parseFloat((40 + rnd() * 20).toFixed(1)), unit: "%", previousValue: 38, changePercent: 10, trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => parseFloat((30 + rnd() * 40).toFixed(1))), description: "Average CPU across all nodes" },
    { name: "Memory Usage", value: parseFloat((60 + rnd() * 15).toFixed(1)), unit: "%", previousValue: 55, changePercent: 9, trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => parseFloat((45 + rnd() * 30).toFixed(1))), description: "Average memory utilization" },
    { name: "Disk I/O", value: Math.round(60 + rnd() * 30), unit: "MB/s", previousValue: 55, changePercent: 9, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(40 + rnd() * 40)), description: "Disk read/write throughput" },
    { name: "API Rate Limit Hits", value: Math.round(rnd() * 5), unit: "hits/hr", previousValue: 3, changePercent: 33, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(rnd() * 8)), description: "Requests hitting rate limits" },
    { name: "Deploy Frequency", value: Math.round(3 + rnd() * 3), unit: "deploys/wk", previousValue: 3, changePercent: 0, trend: "stable", status: "good", sparkline: [2, 4, 3, 5, 2, 3, 4, 3, 5, 3, 4, 3], description: "Weekly deployment cadence" },
  ];
}

/* ================================================================== */
/*  SERVICE TOPOLOGY                                                   */
/* ================================================================== */

export interface ServiceNode {
  id: string;
  name: string;
  type: ObsEntityType;
  status: ObsStatus;
  version: string;
  dependencies: string[];
  dependents: string[];
  metadata: Record<string, string>;
}

export function getServiceTopology(): { nodes: ServiceNode[]; edges: { source: string; target: string; type: "sync" | "async" | "stream" }[] } {
  const nodes: ServiceNode[] = [
    { id: "cdn", name: "CDN Edge", type: "cdn", status: "healthy", version: "1.0", dependencies: ["api"], dependents: [], metadata: { provider: "Cloudflare" } },
    { id: "api", name: "API Gateway", type: "api", status: "healthy", version: "2.1", dependencies: ["auth", "app", "search"], dependents: ["cdn"], metadata: { endpoints: "42" } },
    { id: "app", name: "Application Server", type: "application", status: "healthy", version: "1.5", dependencies: ["db", "cache"], dependents: ["api", "workflow"], metadata: { framework: "React/Vite" } },
    { id: "auth", name: "Auth Service", type: "auth", status: "healthy", version: "1.2", dependencies: ["db"], dependents: ["api"], metadata: { provider: "OAuth2/JWT" } },
    { id: "db", name: "Primary Database", type: "database", status: "healthy", version: "15.4", dependencies: [], dependents: ["app", "auth", "workflow", "search"], metadata: { engine: "PostgreSQL" } },
    { id: "cache", name: "Redis Cache", type: "cache", status: "healthy", version: "7.2", dependencies: [], dependents: ["app", "workflow"], metadata: { hit_rate: "98.2%" } },
    { id: "queue", name: "Message Queue", type: "queue", status: "healthy", version: "3.12", dependencies: ["db"], dependents: ["workflow", "notification"], metadata: { type: "RabbitMQ" } },
    { id: "workflow", name: "Workflow Engine", type: "workflow", status: "healthy", version: "1.0", dependencies: ["app", "queue", "db"], dependents: ["notification"], metadata: { active_workflows: "6" } },
    { id: "search", name: "Search Engine", type: "search", status: "healthy", version: "1.4", dependencies: ["db"], dependents: ["api", "seo"], metadata: { provider: "Algolia" } },
    { id: "seo", name: "SEO Engine", type: "seo", status: "healthy", version: "1.1", dependencies: ["search"], dependents: [], metadata: { urls_indexed: "34" } },
    { id: "notification", name: "Notification Engine", type: "notification", status: "healthy", version: "1.0", dependencies: ["queue", "workflow", "email"], dependents: [], metadata: { channels: "5" } },
    { id: "email", name: "Email Service", type: "email", status: "healthy", version: "2.0", dependencies: ["queue"], dependents: ["notification"], metadata: { provider: "SES/Mailgun" } },
    { id: "payment", name: "Payment Gateway", type: "payment", status: "healthy", version: "1.3", dependencies: ["api", "db"], dependents: [], metadata: { providers: "Stripe, PayPal" } },
    { id: "media", name: "Media Server", type: "media", status: "healthy", version: "1.0", dependencies: ["storage"], dependents: [], metadata: { assets: "48" } },
    { id: "storage", name: "Object Storage", type: "storage", status: "healthy", version: "3.0", dependencies: [], dependents: ["media"], metadata: { provider: "S3" } },
    { id: "ai", name: "AI Inference", type: "ai", status: "healthy", version: "1.0", dependencies: ["api"], dependents: [], metadata: { models: "GPT-4" } },
    { id: "affiliate", name: "Affiliate Network", type: "affiliate", status: "healthy", version: "1.1", dependencies: ["api"], dependents: [], metadata: { networks: "4" } },
    { id: "supplier", name: "Supplier API", type: "supplier", status: "degraded", version: "1.0", dependencies: ["api"], dependents: [], metadata: { suppliers: "8", latency: "820ms" } },
  ];

  const edges: { source: string; target: string; type: "sync" | "async" | "stream" }[] = [
    { source: "cdn", target: "api", type: "sync" },
    { source: "api", target: "auth", type: "sync" },
    { source: "api", target: "app", type: "sync" },
    { source: "api", target: "search", type: "sync" },
    { source: "app", target: "db", type: "sync" },
    { source: "app", target: "cache", type: "sync" },
    { source: "auth", target: "db", type: "sync" },
    { source: "workflow", target: "app", type: "async" },
    { source: "workflow", target: "queue", type: "async" },
    { source: "workflow", target: "db", type: "sync" },
    { source: "search", target: "db", type: "sync" },
    { source: "notification", target: "queue", type: "async" },
    { source: "notification", target: "workflow", type: "async" },
    { source: "notification", target: "email", type: "async" },
    { source: "email", target: "queue", type: "async" },
    { source: "payment", target: "api", type: "sync" },
    { source: "payment", target: "db", type: "sync" },
    { source: "media", target: "storage", type: "sync" },
    { source: "ai", target: "api", type: "sync" },
    { source: "affiliate", target: "api", type: "sync" },
    { source: "supplier", target: "api", type: "sync" },
    { source: "seo", target: "search", type: "sync" },
  ];

  return { nodes, edges };
}

/* ================================================================== */
/*  OPERATIONAL REPORTS                                                */
/* ================================================================== */

export interface OperationalReport {
  id: string;
  title: string;
  description: string;
  category: "executive" | "availability" | "performance" | "error" | "security" | "compliance" | "developer" | "ai";
  period: string;
  generatedAt: number;
  data: Record<string, unknown>;
  format: "html" | "json" | "csv";
  createdBy: string;
}

const REPORT_KEY = `${OBSERVABILITY_KEY}_reports`;

export function getReports(): OperationalReport[] {
  try { return JSON.parse(localStorage.getItem(REPORT_KEY) || "[]"); } catch { return []; }
}

export function generateReport(category: OperationalReport["category"], period: string, createdBy: string): OperationalReport {
  const report: OperationalReport = {
    id: uid("rpt"),
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Report`,
    description: `Automated ${category} report for ${period}`,
    category, period, generatedAt: Date.now(),
    data: { summary: `Sample ${category} data for ${period}`, metrics: getOperationalMetrics().slice(0, 5) },
    format: "json", createdBy,
  };
  const all = [report, ...getReports()].slice(0, 100);
  try { localStorage.setItem(REPORT_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return report;
}

/* ================================================================== */
/*  ERROR ANALYTICS                                                    */
/* ================================================================== */

export interface ErrorGroup {
  id: string;
  message: string;
  type: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  status: "new" | "acknowledged" | "resolved" | "ignored";
  source: string;
  stackTrace?: string;
  affectedUsers: number;
  tags: Record<string, string>;
}

const ERROR_KEY = `${OBSERVABILITY_KEY}_errors`;

export function getErrorGroups(): ErrorGroup[] {
  try { return JSON.parse(localStorage.getItem(ERROR_KEY) || "[]"); } catch { return []; }
}

export function logError(error: { message: string; type: string; source: string; tags: Record<string, string>; stackTrace?: string; affectedUsers?: number }): ErrorGroup {
  const all = getErrorGroups();
  const existing = all.find((e) => e.message === error.message && e.type === error.type);
  if (existing) {
    existing.count++;
    existing.lastSeen = Date.now();
    existing.affectedUsers = existing.affectedUsers + (error.affectedUsers || 1);
    try { localStorage.setItem(ERROR_KEY, JSON.stringify(all)); } catch { /* ignore */ }
    return existing;
  }
  const group: ErrorGroup = { ...error, id: uid("err"), count: 1, firstSeen: Date.now(), lastSeen: Date.now(), status: "new", affectedUsers: error.affectedUsers || 1 } as ErrorGroup;
  all.unshift(group);
  try { localStorage.setItem(ERROR_KEY, JSON.stringify(all.slice(0, 200))); } catch { /* ignore */ }
  writeStructuredLog({ level: "error", source: error.source as LogSource, message: error.message, tags: { type: error.type }, metadata: {}, retentionDays: 30 });
  return group;
}

export function updateErrorGroup(id: string, patch: Partial<ErrorGroup>): ErrorGroup | null {
  const all = getErrorGroups(); const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  try { localStorage.setItem(ERROR_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

/* Seed error groups */
(function seedErrors() {
  if (getErrorGroups().length > 0) return;
  const now = Date.now();
  [
    { message: "TypeError: Cannot read properties of undefined (reading 'price')", type: "TypeError", count: 24, firstSeen: now - 86400000 * 3, lastSeen: now - 3600000, status: "acknowledged" as const, source: "frontend" as string, affectedUsers: 12, tags: { component: "ProductCard" } },
    { message: "SQL: relation 'products_temp' does not exist", type: "DatabaseError", count: 8, firstSeen: now - 86400000 * 7, lastSeen: now - 7200000, status: "new" as const, source: "backend" as string, affectedUsers: 0, tags: { query: "SELECT * FROM products_temp" } },
    { message: "TimeoutError: Stripe API request exceeded 5000ms", type: "TimeoutError", count: 15, firstSeen: now - 86400000 * 2, lastSeen: now - 1800000, status: "resolved" as const, source: "payment" as string, affectedUsers: 4, tags: { endpoint: "/v1/charges" } },
    { message: "NetworkError: Failed to fetch /api/v1/products", type: "NetworkError", count: 42, firstSeen: now - 86400000 * 5, lastSeen: now - 600000, status: "new" as const, source: "frontend" as string, affectedUsers: 28, tags: { endpoint: "/api/v1/products" } },
    { message: "RateLimitError: API key exceeded quota", type: "RateLimitError", count: 6, firstSeen: now - 86400000 * 1, lastSeen: now - 900000, status: "new" as const, source: "api" as string, affectedUsers: 3, tags: { api_key: "aff_****" } },
  ].forEach((e) => {
    const group = { ...e, id: uid("err"), stackTrace: undefined } as unknown as ErrorGroup;
    const all = getErrorGroups(); all.push(group);
    try { localStorage.setItem(ERROR_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  });
})();

/* ================================================================== */
/*  USER ACTIVITY TIMELINE                                             */
/* ================================================================== */

export interface ActivityEvent {
  id: string;
  ts: number;
  actor: string;
  actorType: "user" | "admin" | "system" | "ai";
  action: string;
  entity: string;
  entityName: string;
  detail: string;
  category: "auth" | "crud" | "admin" | "system" | "workflow" | "deployment" | "security";
  ip?: string;
  sessionId?: string;
}

const ACTIVITY_KEY = `${OBSERVABILITY_KEY}_activity`;

export function getActivityEvents(limit = 100): ActivityEvent[] {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]").slice(0, limit); } catch { return []; }
}

export function recordActivity(input: Omit<ActivityEvent, "id" | "ts">): ActivityEvent {
  const event: ActivityEvent = { ...input, id: uid("act"), ts: Date.now() };
  const all = [event, ...getActivityEvents(500)].slice(0, 500);
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return event;
}

/* Seed activity */
(function seedActivity() {
  if (getActivityEvents(1).length > 0) return;
  const now = Date.now();
  const actions: Omit<ActivityEvent, "id" | "ts">[] = [
    { actor: "admin@alaya.io", actorType: "admin", action: "login", entity: "session", entityName: "Admin Login", detail: "Successful login from Chrome on Windows", category: "auth", ip: "203.45.67.89" },
    { actor: "admin@alaya.io", actorType: "admin", action: "update", entity: "product", entityName: "Amber Noir EDP", detail: "Updated price from $180 to $195", category: "crud", ip: "203.45.67.89" },
    { actor: "ai-assistant", actorType: "ai", action: "create", entity: "seo", entityName: "SEO Meta: Amber Noir", detail: "AI-generated SEO description", category: "workflow" },
    { actor: "system", actorType: "system", action: "deploy", entity: "deployment", entityName: "v1.0.1 to staging", detail: "Deployment completed successfully (142s)", category: "deployment" },
    { actor: "admin@alaya.io", actorType: "admin", action: "export", entity: "report", entityName: "Monthly Revenue Report", detail: "Exported CSV (1,240 rows)", category: "admin" },
    { actor: "supplier-api", actorType: "system", action: "create", entity: "order", entityName: "Order #AL-12346", detail: "New order auto-assigned to supplier", category: "workflow" },
    { actor: "affiliate-bot", actorType: "system", action: "update", entity: "affiliate", entityName: "Affiliate Links", detail: "Validated 1,240 affiliate links (3 broken)", category: "system" },
    { actor: "admin@alaya.io", actorType: "admin", action: "permission_change", entity: "role", entityName: "Editor Role", detail: "Added 'media.upload' permission to Editor role", category: "security" },
    { actor: "system", actorType: "system", action: "backup", entity: "backup", entityName: "Daily Backup", detail: "Full backup completed (1.2 GB)", category: "system" },
    { actor: "admin@alaya.io", actorType: "admin", action: "create", entity: "api_key", entityName: "New API Key", detail: "Created API key for integration partner", category: "security" },
  ];
  actions.forEach((a, i) => {
    const event: ActivityEvent = { ...a, id: uid("act"), ts: now - i * 7200000 };
    const all = getActivityEvents(500); all.push(event);
    try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(all.slice(0, 500))); } catch { /* ignore */ }
  });
})();
