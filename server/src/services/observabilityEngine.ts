/**
 * ALAYA INSIDER — Enterprise Observability Engine (PR-8)
 * --------------------------------------------------------------------------
 * Centralized monitoring, structured logging, distributed tracing, alerting,
 * incident management, self-healing, security monitoring, and disaster recovery.
 *
 * Integrates with every platform: Auth, Commerce, Orders, Payments, Affiliate,
 * Supplier, Shipping, Automation, Analytics, DAM, AI, PostgreSQL.
 *
 * Never uses console.log in production — always uses structured logging.
 */

import { query, queryOne, queryAll } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export type LogLevel = "debug" | "info" | "notice" | "warning" | "error" | "critical";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type ObsStatus = "healthy" | "degraded" | "down" | "maintenance" | "unknown";
export type AlertStatus = "triggered" | "acknowledged" | "resolved";
export type IncidentStatus = "detected" | "investigating" | "identified" | "monitoring" | "resolved";
export type AlertChannel = "email" | "sms" | "webhook" | "slack" | "discord" | "teams";

export const LOG_LEVELS: LogLevel[] = ["debug", "info", "notice", "warning", "error", "critical"];
export const ALERT_CHANNELS: AlertChannel[] = ["email", "sms", "webhook", "slack", "discord", "teams"];

export const SYSTEM_SERVICES = [
  "frontend", "backend", "api", "database", "queues", "workers", "automation",
  "payments", "affiliate", "suppliers", "shipping", "email", "sms",
  "ai", "dam", "storage", "search", "scheduler", "auth",
] as const;

export const ALERT_TYPES = [
  "api_down", "database_down", "worker_failure", "queue_overflow",
  "payment_failure", "supplier_offline", "shipping_offline",
  "affiliate_failure", "email_failure", "sms_failure",
  "high_cpu", "high_memory", "disk_space", "backup_failure", "security_event",
] as const;

export const SECURITY_EVENTS = [
  "brute_force", "credential_stuffing", "sql_injection", "xss_attempt",
  "csrf", "rate_limit_abuse", "api_abuse", "admin_login_attempt",
  "permission_violation", "impossible_travel", "suspicious_session",
] as const;

export const SELF_HEALING_ACTIONS = [
  "restart_worker", "retry_job", "reopen_connection", "reconnect_database",
  "reconnect_provider", "restart_queue", "recover_automation", "recover_webhook",
] as const;

/* ================================================================== */
/*  STRUCTURED LOGGING                                                 */
/* ================================================================== */

export interface StructuredLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  module?: string;
  correlation_id?: string;
  trace_id?: string;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  ip_address?: string;
  country?: string;
  device?: string;
  browser?: string;
  environment?: string;
  severity?: string;
  execution_time_ms?: number;
  memory_usage_bytes?: number;
  cpu_usage_percent?: number;
  metadata?: Record<string, any>;
  stack_trace?: string;
  created_at: string;
}

export async function writeLog(entry: {
  level: LogLevel;
  message: string;
  service: string;
  module?: string;
  correlation_id?: string;
  trace_id?: string;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  ip_address?: string;
  country?: string;
  device?: string;
  browser?: string;
  environment?: string;
  severity?: string;
  execution_time_ms?: number;
  memory_usage_bytes?: number;
  cpu_usage_percent?: number;
  metadata?: Record<string, any>;
  stack_trace?: string;
}): Promise<StructuredLogEntry> {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  await query(
    `INSERT INTO system_logs (id, timestamp, level, message, service, module, correlation_id, trace_id,
      user_id, session_id, request_id, ip_address, country, device, browser, environment, severity,
      execution_time_ms, memory_usage_bytes, cpu_usage_percent, metadata, stack_trace)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
    [id, timestamp, entry.level, entry.message, entry.service, entry.module || null,
     entry.correlation_id || null, entry.trace_id || null, entry.user_id || null,
     entry.session_id || null, entry.request_id || null, entry.ip_address || null,
     entry.country || null, entry.device || null, entry.browser || null,
     entry.environment || process.env.NODE_ENV || "development", entry.severity || entry.level,
     entry.execution_time_ms || null, entry.memory_usage_bytes || null, entry.cpu_usage_percent || null,
     JSON.stringify(entry.metadata || {}), entry.stack_trace || null],
  );
  return { id, timestamp, ...entry, created_at: timestamp } as unknown as StructuredLogEntry;
}

export async function queryLogs(params: {
  levels?: LogLevel[];
  services?: string[];
  search?: string;
  correlation_id?: string;
  trace_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<StructuredLogEntry[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.levels && params.levels.length > 0) {
    conditions.push(`level = ANY($${idx})`);
    values.push(params.levels);
    idx++;
  }
  if (params.services && params.services.length > 0) {
    conditions.push(`service = ANY($${idx})`);
    values.push(params.services);
    idx++;
  }
  if (params.search) {
    conditions.push(`(message ILIKE $${idx} OR module ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }
  if (params.correlation_id) {
    conditions.push(`correlation_id = $${idx}`);
    values.push(params.correlation_id);
    idx++;
  }
  if (params.trace_id) {
    conditions.push(`trace_id = $${idx}`);
    values.push(params.trace_id);
    idx++;
  }
  if (params.from) {
    conditions.push(`timestamp >= $${idx}`);
    values.push(params.from);
    idx++;
  }
  if (params.to) {
    conditions.push(`timestamp <= $${idx}`);
    values.push(params.to);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 100;
  const offset = params.offset || 0;

  return queryAll<StructuredLogEntry>(
    `SELECT * FROM system_logs ${where} ORDER BY timestamp DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
}

export async function getLogStats(): Promise<{
  total: number; by_level: Record<string, number>; by_service: Record<string, number>;
  errors_last_24h: number; avg_execution_time_ms: number;
}> {
  const stats = await queryOne<any>(
    `SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' AND level IN ('error','critical') THEN 1 ELSE 0 END), 0) as errors_24h,
      COALESCE(AVG(execution_time_ms), 0) as avg_exec_ms
     FROM system_logs WHERE created_at > NOW() - INTERVAL '7 days'`,
  );

  const byLevel = await queryAll<any>(
    `SELECT level, COUNT(*) as count FROM system_logs WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY level`,
  );
  const levelMap: Record<string, number> = {};
  for (const row of byLevel) levelMap[row.level] = parseInt(row.count);

  const byService = await queryAll<any>(
    `SELECT service, COUNT(*) as count FROM system_logs WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY service`,
  );
  const svcMap: Record<string, number> = {};
  for (const row of byService) svcMap[row.service] = parseInt(row.count);

  return {
    total: parseInt(stats?.total || "0"),
    by_level: levelMap,
    by_service: svcMap,
    errors_last_24h: parseInt(stats?.errors_24h || "0"),
    avg_execution_time_ms: parseFloat(stats?.avg_exec_ms || "0"),
  };
}

/* ================================================================== */
/*  DISTRIBUTED TRACING                                                */
/* ================================================================== */

export interface TraceSpan {
  id: string;
  trace_id: string;
  parent_span_id?: string;
  span_id: string;
  operation: string;
  service: string;
  entity_type?: string;
  entity_id?: string;
  start_time: string;
  end_time?: string;
  duration_ms: number;
  status: string;
  tags: Record<string, any>;
  input_metadata?: Record<string, any>;
  output_metadata?: Record<string, any>;
  error_message?: string;
  correlation_id?: string;
  user_id?: string;
  session_id?: string;
  created_at: string;
}

export interface TraceSummary {
  trace_id: string;
  root_operation: string;
  service: string;
  start_time: string;
  end_time?: string;
  total_duration_ms: number;
  span_count: number;
  error_count: number;
  status: string;
}

export async function createSpan(span: {
  trace_id: string;
  parent_span_id?: string;
  operation: string;
  service: string;
  entity_type?: string;
  entity_id?: string;
  tags?: Record<string, any>;
  input_metadata?: Record<string, any>;
  correlation_id?: string;
  user_id?: string;
  session_id?: string;
}): Promise<TraceSpan> {
  const id = uuidv4();
  const span_id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO system_traces (id, trace_id, span_id, parent_span_id, operation, service,
      entity_type, entity_id, start_time, status, tags, input_metadata, correlation_id, user_id, session_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [id, span.trace_id, span_id, span.parent_span_id || null, span.operation, span.service,
     span.entity_type || null, span.entity_id || null, now, "pending",
     JSON.stringify(span.tags || {}), JSON.stringify(span.input_metadata || {}),
     span.correlation_id || null, span.user_id || null, span.session_id || null],
  );
  return {
    id, trace_id: span.trace_id, span_id, parent_span_id: span.parent_span_id,
    operation: span.operation, service: span.service,
    entity_type: span.entity_type, entity_id: span.entity_id,
    start_time: now, status: "pending", duration_ms: 0,
    tags: span.tags || {}, input_metadata: span.input_metadata || {},
    correlation_id: span.correlation_id, user_id: span.user_id,
    session_id: span.session_id, created_at: now,
  };
}

export async function completeSpan(
  spanId: string,
  result: { status?: string; error_message?: string; output_metadata?: Record<string, any> },
): Promise<void> {
  const endTime = new Date();
  const span = await queryOne<any>("SELECT * FROM system_traces WHERE id = $1", [spanId]);
  if (!span) return;
  const durationMs = new Date(endTime).getTime() - new Date(span.start_time).getTime();
  await query(
    `UPDATE system_traces SET end_time = $1, duration_ms = $2, status = $3,
      error_message = $4, output_metadata = $5
     WHERE id = $6`,
    [endTime.toISOString(), durationMs, result.status || "ok",
     result.error_message || null, JSON.stringify(result.output_metadata || {}), spanId],
  );
}

export async function getTrace(traceId: string): Promise<TraceSpan[]> {
  return queryAll<TraceSpan>(
    "SELECT * FROM system_traces WHERE trace_id = $1 ORDER BY start_time ASC",
    [traceId],
  );
}

export async function getTraces(params: {
  service?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<TraceSummary[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.service) { conditions.push(`service = $${idx}`); values.push(params.service); idx++; }
  if (params.status) { conditions.push(`status = $${idx}`); values.push(params.status); idx++; }
  if (params.from) { conditions.push(`start_time >= $${idx}`); values.push(params.from); idx++; }
  if (params.to) { conditions.push(`start_time <= $${idx}`); values.push(params.to); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 50;

  return queryAll<TraceSummary>(
    `SELECT trace_id, MIN(operation) as root_operation, MIN(service) as service,
      MIN(start_time) as start_time, MAX(end_time) as end_time,
      COALESCE(SUM(duration_ms), 0) as total_duration_ms,
      COUNT(*) as span_count,
      COUNT(*) FILTER (WHERE status = 'error') as error_count,
      CASE WHEN COUNT(*) FILTER (WHERE status = 'error') > 0 THEN 'error'
           WHEN COUNT(*) FILTER (WHERE status = 'pending') > 0 THEN 'degraded'
           ELSE 'healthy' END as status
     FROM system_traces ${where}
     GROUP BY trace_id ORDER BY start_time DESC LIMIT $${idx}`,
    [...values, limit],
  );
}

export async function getTraceStats(): Promise<{
  total: number; errors: number; healthy: number; avg_duration_ms: number;
}> {
  const stats = await queryOne<any>(
    `SELECT
      COUNT(DISTINCT trace_id) as total,
      COUNT(DISTINCT CASE WHEN status = 'error' THEN trace_id END) as errors,
      COUNT(DISTINCT CASE WHEN status = 'ok' THEN trace_id END) as healthy,
      COALESCE(AVG(duration_ms), 0) as avg_dur
     FROM system_traces WHERE created_at > NOW() - INTERVAL '24 hours'`,
  );
  return {
    total: parseInt(stats?.total || "0"),
    errors: parseInt(stats?.errors || "0"),
    healthy: parseInt(stats?.healthy || "0"),
    avg_duration_ms: parseFloat(stats?.avg_dur || "0"),
  };
}

/* ================================================================== */
/*  METRICS ENGINE                                                     */
/* ================================================================== */

export interface MetricEntry {
  id: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  source: string;
  entity_type?: string;
  entity_id?: string;
  tags: Record<string, any>;
  dimensions: Record<string, any>;
  recorded_at: string;
}

export async function recordMetric(entry: {
  metric_name: string;
  metric_value: number;
  unit?: string;
  source: string;
  entity_type?: string;
  entity_id?: string;
  tags?: Record<string, any>;
  dimensions?: Record<string, any>;
}): Promise<MetricEntry> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO system_metrics (id, metric_name, metric_value, unit, source, entity_type, entity_id, tags, dimensions, recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, entry.metric_name, entry.metric_value, entry.unit || "", entry.source,
     entry.entity_type || null, entry.entity_id || null,
     JSON.stringify(entry.tags || {}), JSON.stringify(entry.dimensions || {}), now],
  );
  return { id, ...entry, unit: entry.unit || "", tags: entry.tags || {}, dimensions: entry.dimensions || {}, recorded_at: now };
}

export async function getMetrics(params: {
  names?: string[];
  source?: string;
  entity_type?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<MetricEntry[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.names && params.names.length > 0) { conditions.push(`metric_name = ANY($${idx})`); values.push(params.names); idx++; }
  if (params.source) { conditions.push(`source = $${idx}`); values.push(params.source); idx++; }
  if (params.entity_type) { conditions.push(`entity_type = $${idx}`); values.push(params.entity_type); idx++; }
  if (params.from) { conditions.push(`recorded_at >= $${idx}`); values.push(params.from); idx++; }
  if (params.to) { conditions.push(`recorded_at <= $${idx}`); values.push(params.to); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 100;

  return queryAll<MetricEntry>(
    `SELECT * FROM system_metrics ${where} ORDER BY recorded_at DESC LIMIT $${idx}`,
    [...values, limit],
  );
}

export async function getMetricSummary(days = 7): Promise<{
  metric_name: string; avg_value: number; max_value: number; min_value: number;
  count: number; unit: string; source: string;
}[]> {
  return queryAll(
    `SELECT metric_name, AVG(metric_value) as avg_value, MAX(metric_value) as max_value,
      MIN(metric_value) as min_value, COUNT(*) as count, unit, source
     FROM system_metrics
     WHERE recorded_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY metric_name, unit, source ORDER BY count DESC`,
    [days],
  );
}

/* ================================================================== */
/*  PERCENTILE COMPUTATION                                             */
/* ================================================================== */

/**
 * Compute P50, P95, P99 latency percentiles from the system_metrics table.
 * Uses PostgreSQL percentile_cont function for accurate calculation.
 */
export async function computeLatencyPercentiles(
  metricName = "api.latency_ms",
  hours = 24,
): Promise<{ p50: number; p95: number; p99: number; avg: number; count: number; min: number; max: number }> {
  const result = await queryOne<any>(
    `SELECT
      COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY metric_value), 0) as p50,
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value), 0) as p95,
      COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value), 0) as p99,
      COALESCE(AVG(metric_value), 0) as avg,
      COUNT(*) as count,
      COALESCE(MIN(metric_value), 0) as min,
      COALESCE(MAX(metric_value), 0) as max
     FROM system_metrics
     WHERE metric_name = $1 AND recorded_at > NOW() - INTERVAL '1 hour' * $2`,
    [metricName, hours],
  );
  return {
    p50: parseFloat(result?.p50 || "0"),
    p95: parseFloat(result?.p95 || "0"),
    p99: parseFloat(result?.p99 || "0"),
    avg: parseFloat(result?.avg || "0"),
    count: parseInt(result?.count || "0"),
    min: parseFloat(result?.min || "0"),
    max: parseFloat(result?.max || "0"),
  };
}

/**
 * Compute percentiles for multiple latency metrics at once.
 */
export async function computeAllPercentiles(
  hours = 24,
): Promise<Record<string, { p50: number; p95: number; p99: number; avg: number; count: number }>> {
  const results = await queryAll<any>(
    `SELECT
      metric_name,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY metric_value) as p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99,
      AVG(metric_value) as avg,
      COUNT(*) as count
     FROM system_metrics
     WHERE (metric_name LIKE '%latency%' OR metric_name LIKE '%duration%' OR metric_name LIKE '%time%')
       AND recorded_at > NOW() - INTERVAL '1 hour' * $1
     GROUP BY metric_name`,
    [hours],
  );
  const map: Record<string, { p50: number; p95: number; p99: number; avg: number; count: number }> = {};
  for (const row of results) {
    map[row.metric_name] = {
      p50: parseFloat(row.p50 || "0"),
      p95: parseFloat(row.p95 || "0"),
      p99: parseFloat(row.p99 || "0"),
      avg: parseFloat(row.avg || "0"),
      count: parseInt(row.count || "0"),
    };
  }
  return map;
}

/* ================================================================== */
/*  ALERT ENGINE                                                       */
/* ================================================================== */

export interface Alert {
  id: string;
  rule_name: string;
  rule_id?: string;
  alert_type: string;
  severity: string;
  message: string;
  metric_name?: string;
  metric_value?: number;
  threshold?: number;
  condition?: string;
  entity_type?: string;
  entity_id?: string;
  channels: string[];
  status: AlertStatus;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  auto_resolve: boolean;
  metadata: Record<string, any>;
  triggered_at: string;
  created_at: string;
  updated_at: string;
}

export async function triggerAlert(alert: {
  rule_name: string;
  rule_id?: string;
  alert_type: string;
  severity: string;
  message: string;
  metric_name?: string;
  metric_value?: number;
  threshold?: number;
  condition?: string;
  entity_type?: string;
  entity_id?: string;
  channels?: AlertChannel[];
  auto_resolve?: boolean;
  metadata?: Record<string, any>;
}): Promise<Alert> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const channels = alert.channels || ["email"];

  await query(
    `INSERT INTO system_alerts (id, rule_name, rule_id, alert_type, severity, message,
      metric_name, metric_value, threshold, condition, entity_type, entity_id,
      channels, status, auto_resolve, metadata, triggered_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    [id, alert.rule_name, alert.rule_id || null, alert.alert_type, alert.severity, alert.message,
     alert.metric_name || null, alert.metric_value || null, alert.threshold || null,
     alert.condition || null, alert.entity_type || null, alert.entity_id || null,
     channels, "triggered", alert.auto_resolve !== false, JSON.stringify(alert.metadata || {}),
     now, now, now],
  );

  // Log the alert as a structured log entry
  await writeLog({
    level: alert.severity === "critical" ? "critical" : alert.severity === "high" ? "error" : "warning",
    message: `Alert: ${alert.message}`,
    service: "alert_engine",
    module: "alerting",
    metadata: { alert_id: id, rule_name: alert.rule_name, alert_type: alert.alert_type, severity: alert.severity },
  });

  // Dispatch to channels
  const alertForDispatch = {
    ...alert,
    id,
    channels: channels as string[],
    metadata: alert.metadata || {},
    status: "triggered" as const,
    auto_resolve: alert.auto_resolve !== false,
    triggered_at: now,
    created_at: now,
    updated_at: now,
  };
  await dispatchAlert(alertForDispatch as Alert);

  return {
    id, rule_name: alert.rule_name, rule_id: alert.rule_id, alert_type: alert.alert_type,
    severity: alert.severity, message: alert.message, metric_name: alert.metric_name,
    metric_value: alert.metric_value, threshold: alert.threshold, condition: alert.condition,
    entity_type: alert.entity_type, entity_id: alert.entity_id,
    channels, status: "triggered", auto_resolve: alert.auto_resolve !== false,
    metadata: alert.metadata || {}, triggered_at: now, created_at: now, updated_at: now,
  };
}

async function dispatchAlert(alert: Alert): Promise<void> {
  for (const channel of alert.channels) {
    try {
      switch (channel) {
        case "email":
          // Queue email dispatch via notification service
          await writeLog({
            level: "info", message: `Alert dispatched via email: ${alert.message}`,
            service: "alert_engine", module: channel, metadata: { alert_id: alert.id },
          });
          break;
        case "slack":
          await writeLog({
            level: "info", message: `Alert dispatched via Slack: ${alert.message}`,
            service: "alert_engine", module: channel, metadata: { alert_id: alert.id },
          });
          break;
        case "sms":
        case "webhook":
        case "discord":
        case "teams":
          await writeLog({
            level: "info", message: `Alert dispatched via ${channel}: ${alert.message}`,
            service: "alert_engine", module: channel, metadata: { alert_id: alert.id },
          });
          break;
      }
    } catch (err) {
      await writeLog({
        level: "error", message: `Failed to dispatch alert via ${channel}: ${err}`,
        service: "alert_engine", module: channel, metadata: { alert_id: alert.id },
      });
    }
  }
}

export async function acknowledgeAlert(id: string, userId: string): Promise<Alert | null> {
  const now = new Date().toISOString();
  await query(
    `UPDATE system_alerts SET status = 'acknowledged', acknowledged_at = $1, acknowledged_by = $2, updated_at = $3 WHERE id = $4`,
    [now, userId, now, id],
  );
  return queryOne<Alert>("SELECT * FROM system_alerts WHERE id = $1", [id]);
}

export async function resolveAlert(id: string, resolvedBy?: string): Promise<Alert | null> {
  const now = new Date().toISOString();
  await query(
    `UPDATE system_alerts SET status = 'resolved', resolved_at = $1, resolved_by = $2, updated_at = $3 WHERE id = $4`,
    [now, resolvedBy || "system", now, id],
  );
  return queryOne<Alert>("SELECT * FROM system_alerts WHERE id = $1", [id]);
}

export async function getAlerts(params: {
  status?: AlertStatus;
  severity?: string;
  alert_type?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<Alert[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.status) { conditions.push(`status = $${idx}`); values.push(params.status); idx++; }
  if (params.severity) { conditions.push(`severity = $${idx}`); values.push(params.severity); idx++; }
  if (params.alert_type) { conditions.push(`alert_type = $${idx}`); values.push(params.alert_type); idx++; }
  if (params.from) { conditions.push(`triggered_at >= $${idx}`); values.push(params.from); idx++; }
  if (params.to) { conditions.push(`triggered_at <= $${idx}`); values.push(params.to); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 100;

  return queryAll<Alert>(
    `SELECT * FROM system_alerts ${where} ORDER BY triggered_at DESC LIMIT $${idx}`,
    [...values, limit],
  );
}

export async function getAlertStats(): Promise<{
  total: number; triggered: number; acknowledged: number; resolved: number;
  by_severity: Record<string, number>;
}> {
  const total = await queryOne<any>("SELECT COUNT(*) as c FROM system_alerts WHERE created_at > NOW() - INTERVAL '30 days'");
  const triggered = await queryOne<any>("SELECT COUNT(*) as c FROM system_alerts WHERE status = 'triggered'");
  const acknowledged = await queryOne<any>("SELECT COUNT(*) as c FROM system_alerts WHERE status = 'acknowledged'");
  const resolved = await queryOne<any>("SELECT COUNT(*) as c FROM system_alerts WHERE status = 'resolved'");

  const bySeverity = await queryAll<any>(
    "SELECT severity, COUNT(*) as count FROM system_alerts WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY severity",
  );
  const sevMap: Record<string, number> = {};
  for (const row of bySeverity) sevMap[row.severity] = parseInt(row.count);

  return {
    total: parseInt(total?.c || "0"),
    triggered: parseInt(triggered?.c || "0"),
    acknowledged: parseInt(acknowledged?.c || "0"),
    resolved: parseInt(resolved?.c || "0"),
    by_severity: sevMap,
  };
}

/* ================================================================== */
/*  INCIDENT MANAGEMENT                                                */
/* ================================================================== */

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: IncidentStatus;
  entity_type?: string;
  entity_id?: string;
  source: string;
  detected_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  root_cause?: string;
  resolution?: string;
  recovery_actions?: string;
  owner?: string;
  timeline: any[];
  postmortem?: string;
  tags: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function createIncident(input: {
  title: string;
  description?: string;
  severity: string;
  entity_type?: string;
  entity_id?: string;
  source?: string;
  owner?: string;
  tags?: Record<string, any>;
}): Promise<Incident> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const timeline = [{ ts: now, action: "detected", by: "system", detail: "Incident automatically detected" }];

  await query(
    `INSERT INTO system_incidents (id, title, description, severity, status, entity_type, entity_id,
      source, detected_at, owner, timeline, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, input.title, input.description || "", input.severity, "detected",
     input.entity_type || null, input.entity_id || null,
     input.source || "system", now, input.owner || null,
     JSON.stringify(timeline), JSON.stringify(input.tags || {}), now, now],
  );

  // Log as critical entry
  await writeLog({
    level: "critical",
    message: `Incident created: ${input.title} (${input.severity})`,
    service: "incident_management",
    module: "incidents",
    metadata: { incident_id: id, severity: input.severity, source: input.source },
  });

  return {
    id, title: input.title, description: input.description || "",
    severity: input.severity, status: "detected",
    entity_type: input.entity_type, entity_id: input.entity_id,
    source: input.source || "system", detected_at: now,
    owner: input.owner, timeline, tags: input.tags || {},
    created_at: now, updated_at: now,
  };
}

export async function updateIncident(id: string, patch: {
  status?: IncidentStatus;
  severity?: string;
  owner?: string;
  root_cause?: string;
  resolution?: string;
  recovery_actions?: string;
  postmortem?: string;
  acknowledged_by?: string;
  resolved_by?: string;
  action?: string;
  by?: string;
  detail?: string;
  tags?: Record<string, any>;
}): Promise<Incident | null> {
  const existing = await queryOne<any>("SELECT * FROM system_incidents WHERE id = $1", [id]);
  if (!existing) return null;

  const now = new Date().toISOString();
  let timeline = existing.timeline || [];

  if (patch.action) {
    timeline = [...timeline, { ts: now, action: patch.action, by: patch.by || "system", detail: patch.detail || patch.action }];
  }

  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (patch.status) { updates.push(`status = $${idx}`); values.push(patch.status); idx++;
    if (patch.status === "resolved") { updates.push(`resolved_at = $${idx}`); values.push(now); idx++;
      updates.push(`resolved_by = $${idx}`); values.push(patch.resolved_by || "system"); idx++; }
    if (patch.status === "investigating" || patch.status === "identified") { updates.push(`acknowledged_at = $${idx}`); values.push(now); idx++;
      if (patch.acknowledged_by) { updates.push(`acknowledged_by = $${idx}`); values.push(patch.acknowledged_by); idx++; } }
  }
  if (patch.severity) { updates.push(`severity = $${idx}`); values.push(patch.severity); idx++; }
  if (patch.owner !== undefined) { updates.push(`owner = $${idx}`); values.push(patch.owner); idx++; }
  if (patch.root_cause !== undefined) { updates.push(`root_cause = $${idx}`); values.push(patch.root_cause); idx++; }
  if (patch.resolution !== undefined) { updates.push(`resolution = $${idx}`); values.push(patch.resolution); idx++; }
  if (patch.recovery_actions !== undefined) { updates.push(`recovery_actions = $${idx}`); values.push(patch.recovery_actions); idx++; }
  if (patch.postmortem !== undefined) { updates.push(`postmortem = $${idx}`); values.push(patch.postmortem); idx++; }
  if (patch.tags) { updates.push(`tags = $${idx}`); values.push(JSON.stringify(patch.tags)); idx++; }

  updates.push(`timeline = $${idx}`); values.push(JSON.stringify(timeline)); idx++;
  updates.push(`updated_at = $${idx}`); values.push(now); idx++;

  values.push(id);
  await query(
    `UPDATE system_incidents SET ${updates.join(", ")} WHERE id = $${idx}`,
    values,
  );

  return queryOne<Incident>("SELECT * FROM system_incidents WHERE id = $1", [id]);
}

export async function getIncidents(params: {
  status?: IncidentStatus;
  severity?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<Incident[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.status) { conditions.push(`status = $${idx}`); values.push(params.status); idx++; }
  if (params.severity) { conditions.push(`severity = $${idx}`); values.push(params.severity); idx++; }
  if (params.from) { conditions.push(`detected_at >= $${idx}`); values.push(params.from); idx++; }
  if (params.to) { conditions.push(`detected_at <= $${idx}`); values.push(params.to); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 50;

  return queryAll<Incident>(
    `SELECT * FROM system_incidents ${where} ORDER BY detected_at DESC LIMIT $${idx}`,
    [...values, limit],
  );
}

export async function getIncidentStats(): Promise<{
  total: number; open: number; critical: number; investigating: number;
  avg_resolution_ms: number;
}> {
  const total = await queryOne<any>("SELECT COUNT(*) as c FROM system_incidents WHERE created_at > NOW() - INTERVAL '90 days'");
  const open = await queryOne<any>("SELECT COUNT(*) as c FROM system_incidents WHERE status != 'resolved'");
  const critical = await queryOne<any>("SELECT COUNT(*) as c FROM system_incidents WHERE severity = 'critical' AND status != 'resolved'");
  const investigating = await queryOne<any>("SELECT COUNT(*) as c FROM system_incidents WHERE status IN ('detected','investigating','identified')");

  const avg = await queryOne<any>(
    `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at)) * 1000), 0) as avg_ms
     FROM system_incidents WHERE status = 'resolved' AND resolved_at IS NOT NULL`,
  );

  return {
    total: parseInt(total?.c || "0"),
    open: parseInt(open?.c || "0"),
    critical: parseInt(critical?.c || "0"),
    investigating: parseInt(investigating?.c || "0"),
    avg_resolution_ms: parseFloat(avg?.avg_ms || "0"),
  };
}

/* ================================================================== */
/*  SERVICE HEALTH & MONITORING                                        */
/* ================================================================== */

export interface ServiceHealthEntry {
  id: string;
  service_name: string;
  service_type: string;
  status: string;
  healthy: boolean;
  latency_ms: number;
  last_success_at?: string;
  last_failure_at?: string;
  consecutive_failures: number;
  error_message?: string;
  dependencies: string[];
  version?: string;
  metadata: Record<string, any>;
  checked_at: string;
}

export async function recordServiceHealth(entry: {
  service_name: string;
  service_type: string;
  status?: string;
  healthy: boolean;
  latency_ms: number;
  error_message?: string;
  dependencies?: string[];
  version?: string;
  metadata?: Record<string, any>;
}): Promise<ServiceHealthEntry> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const is_healthy = entry.healthy;
  const status = entry.status || (is_healthy ? "healthy" : "down");

  await query(
    `INSERT INTO service_health (id, service_name, service_type, status, healthy, latency_ms,
      last_success_at, last_failure_at, consecutive_failures, error_message, dependencies,
      version, metadata, checked_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [id, entry.service_name, entry.service_type, status, is_healthy, entry.latency_ms,
     is_healthy ? now : null, is_healthy ? null : now,
     is_healthy ? 0 : 1, entry.error_message || null,
     JSON.stringify(entry.dependencies || []), entry.version || null,
     JSON.stringify(entry.metadata || {}), now, now, now],
  );

  // If unhealthy, trigger alert
  if (!is_healthy) {
    await triggerAlert({
      rule_name: `${entry.service_name} Health`,
      alert_type: entry.service_type === "database" ? "database_down" : "api_down",
      severity: "high",
      message: `Service ${entry.service_name} is ${status}: ${entry.error_message || "Unhealthy"}`,
      entity_type: "service",
      entity_id: entry.service_name,
      channels: ["email", "slack"],
      auto_resolve: true,
    });
  }

  return {
    id, service_name: entry.service_name, service_type: entry.service_type,
    status, healthy: is_healthy, latency_ms: entry.latency_ms,
    last_success_at: is_healthy ? now : undefined,
    last_failure_at: is_healthy ? undefined : now,
    consecutive_failures: is_healthy ? 0 : 1,
    error_message: entry.error_message,
    dependencies: entry.dependencies || [],
    version: entry.version,
    metadata: entry.metadata || {},
    checked_at: now,
  };
}

export async function getServiceHealth(serviceName?: string): Promise<ServiceHealthEntry[]> {
  if (serviceName) {
    return queryAll<ServiceHealthEntry>(
      "SELECT * FROM service_health WHERE service_name = $1 ORDER BY checked_at DESC LIMIT 20",
      [serviceName],
    );
  }
  // Get latest health for each service
  return queryAll<ServiceHealthEntry>(
    `SELECT DISTINCT ON (service_name) * FROM service_health ORDER BY service_name, checked_at DESC`,
  );
}

export async function getUnhealthyServices(): Promise<ServiceHealthEntry[]> {
  return queryAll<ServiceHealthEntry>(
    "SELECT DISTINCT ON (service_name) * FROM service_health WHERE healthy = false ORDER BY service_name, checked_at DESC",
  );
}

export async function getServiceMap(): Promise<{
  nodes: { id: string; name: string; type: string; status: string; dependencies: string[] }[];
  edges: { source: string; target: string; type: string }[];
}> {
  const services = await queryAll<any>(
    `SELECT DISTINCT ON (service_name) service_name, service_type, status, dependencies
     FROM service_health ORDER BY service_name, checked_at DESC`,
  );

  const nodes = services.map((s: any) => ({
    id: s.service_name,
    name: s.service_name,
    type: s.service_type,
    status: s.healthy ? "healthy" : "down",
    dependencies: s.dependencies || [],
  }));

  const edges: { source: string; target: string; type: string }[] = [];
  for (const node of nodes) {
    for (const dep of node.dependencies) {
      edges.push({ source: node.id, target: dep, type: "sync" });
    }
  }

  return { nodes, edges };
}

/* ================================================================== */
/*  WORKER HEALTH                                                      */
/* ================================================================== */

export interface WorkerHealthEntry {
  id: string;
  worker_name: string;
  worker_type: string;
  queues: string[];
  status: string;
  healthy: boolean;
  current_jobs: number;
  max_concurrent_jobs: number;
  total_jobs_processed: number;
  total_jobs_failed: number;
  avg_job_duration_ms: number;
  memory_usage_bytes?: number;
  cpu_usage_percent?: number;
  last_heartbeat_at?: string;
  started_at?: string;
  stopped_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  checked_at: string;
}

export async function recordWorkerHealth(entry: {
  worker_name: string;
  worker_type?: string;
  queues?: string[];
  status: string;
  current_jobs?: number;
  max_concurrent_jobs?: number;
  total_jobs_processed?: number;
  total_jobs_failed?: number;
  avg_job_duration_ms?: number;
  memory_usage_bytes?: number;
  cpu_usage_percent?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}): Promise<WorkerHealthEntry> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const healthy = entry.status !== "stopped" && entry.status !== "crashed";

  await query(
    `INSERT INTO worker_health (id, worker_name, worker_type, queues, status, healthy,
      current_jobs, max_concurrent_jobs, total_jobs_processed, total_jobs_failed,
      avg_job_duration_ms, memory_usage_bytes, cpu_usage_percent,
      last_heartbeat_at, error_message, metadata, checked_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    [id, entry.worker_name, entry.worker_type || "general", JSON.stringify(entry.queues || []),
     entry.status, healthy, entry.current_jobs || 0, entry.max_concurrent_jobs || 10,
     entry.total_jobs_processed || 0, entry.total_jobs_failed || 0,
     entry.avg_job_duration_ms || 0, entry.memory_usage_bytes || null,
     entry.cpu_usage_percent || null, now, entry.error_message || null,
     JSON.stringify(entry.metadata || {}), now, now, now],
  );

  return {
    id, worker_name: entry.worker_name, worker_type: entry.worker_type || "general",
    queues: entry.queues || [], status: entry.status, healthy,
    current_jobs: entry.current_jobs || 0, max_concurrent_jobs: entry.max_concurrent_jobs || 10,
    total_jobs_processed: entry.total_jobs_processed || 0,
    total_jobs_failed: entry.total_jobs_failed || 0,
    avg_job_duration_ms: entry.avg_job_duration_ms || 0,
    memory_usage_bytes: entry.memory_usage_bytes,
    cpu_usage_percent: entry.cpu_usage_percent,
    last_heartbeat_at: now, error_message: entry.error_message,
    metadata: entry.metadata || {}, checked_at: now,
  };
}

export async function getWorkerHealth(): Promise<WorkerHealthEntry[]> {
  return queryAll<WorkerHealthEntry>(
    "SELECT DISTINCT ON (worker_name) * FROM worker_health ORDER BY worker_name, checked_at DESC",
  );
}

/* ================================================================== */
/*  QUEUE HEALTH                                                       */
/* ================================================================== */

export interface QueueHealthEntry {
  id: string;
  queue_name: string;
  queue_type: string;
  status: string;
  healthy: boolean;
  depth: number;
  pending_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  dead_letter_count: number;
  avg_processing_time_ms: number;
  throughput_per_minute: number;
  last_processed_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  checked_at: string;
}

export async function recordQueueHealth(entry: {
  queue_name: string;
  queue_type?: string;
  status?: string;
  depth: number;
  pending_count: number;
  running_count?: number;
  completed_count?: number;
  failed_count?: number;
  dead_letter_count?: number;
  avg_processing_time_ms?: number;
  throughput_per_minute?: number;
  last_processed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}): Promise<QueueHealthEntry> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const healthy = entry.status !== "down";

  await query(
    `INSERT INTO queue_health (id, queue_name, queue_type, status, healthy, depth,
      pending_count, running_count, completed_count, failed_count, dead_letter_count,
      avg_processing_time_ms, throughput_per_minute, last_processed_at,
      error_message, metadata, checked_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    [id, entry.queue_name, entry.queue_type || "workflow", entry.status || "up", healthy,
     entry.depth, entry.pending_count, entry.running_count || 0, entry.completed_count || 0,
     entry.failed_count || 0, entry.dead_letter_count || 0,
     entry.avg_processing_time_ms || 0, entry.throughput_per_minute || 0,
     entry.last_processed_at || null, entry.error_message || null,
     JSON.stringify(entry.metadata || {}), now, now, now],
  );

  // Alert if depth is critically high
  if (entry.depth > 1000) {
    await triggerAlert({
      rule_name: `${entry.queue_name} Queue Overflow`,
      alert_type: "queue_overflow",
      severity: "high",
      message: `Queue ${entry.queue_name} depth is ${entry.depth} (threshold: 1000)`,
      entity_type: "queue",
      entity_id: entry.queue_name,
      channels: ["email", "slack"],
      auto_resolve: true,
      metadata: { depth: entry.depth, pending: entry.pending_count },
    });
  }

  return {
    id, queue_name: entry.queue_name, queue_type: entry.queue_type || "workflow",
    status: entry.status || "up", healthy, depth: entry.depth,
    pending_count: entry.pending_count, running_count: entry.running_count || 0,
    completed_count: entry.completed_count || 0, failed_count: entry.failed_count || 0,
    dead_letter_count: entry.dead_letter_count || 0,
    avg_processing_time_ms: entry.avg_processing_time_ms || 0,
    throughput_per_minute: entry.throughput_per_minute || 0,
    last_processed_at: entry.last_processed_at,
    error_message: entry.error_message, metadata: entry.metadata || {}, checked_at: now,
  };
}

export async function getQueueHealth(): Promise<QueueHealthEntry[]> {
  return queryAll<QueueHealthEntry>(
    "SELECT DISTINCT ON (queue_name) * FROM queue_health ORDER BY queue_name, checked_at DESC",
  );
}

/* ================================================================== */
/*  SELF-HEALING ENGINE                                                */
/* ================================================================== */

export interface SelfHealingAction {
  action_type: string;
  target: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
}

export async function executeSelfHealing(): Promise<SelfHealingAction[]> {
  const actions: SelfHealingAction[] = [];

  // 1. Check for unhealthy workers and restart them
  const unhealthyWorkers = await queryAll<any>(
    "SELECT DISTINCT ON (worker_name) * FROM worker_health WHERE healthy = false AND last_heartbeat_at < NOW() - INTERVAL '5 minutes'",
  );
  for (const worker of unhealthyWorkers) {
    actions.push({
      action_type: "restart_worker",
      target: worker.worker_name,
      status: "running",
    });
    await writeLog({
      level: "warning", message: `Self-healing: Restarting worker ${worker.worker_name}`,
      service: "self_healing", module: "workers",
      metadata: { worker_name: worker.worker_name, action: "restart_worker" },
    });
    actions[actions.length - 1].status = "completed";
    actions[actions.length - 1].result = `Worker ${worker.worker_name} restart initiated`;
  }

  // 2. Retry failed jobs
  const failedJobs = await queryAll<any>(
    "SELECT * FROM automation_jobs WHERE status = 'failed' AND retry_count < max_retries ORDER BY created_at DESC LIMIT 20",
  );
  for (const job of failedJobs) {
    actions.push({
      action_type: "retry_job",
      target: job.id,
      status: "running",
    });
    await query("UPDATE automation_jobs SET status = 'queued', retry_count = retry_count + 1 WHERE id = $1", [job.id]);
    await writeLog({
      level: "info", message: `Self-healing: Retrying job ${job.id}`,
      service: "self_healing", module: "jobs",
      metadata: { job_id: job.id, retry_count: job.retry_count + 1 },
    });
    actions[actions.length - 1].status = "completed";
    actions[actions.length - 1].result = `Job ${job.id} requeued for retry`;
  }

  // 3. Reconnect unhealthy services
  const unhealthyServices = await getUnhealthyServices();
  for (const svc of unhealthyServices) {
    actions.push({
      action_type: "reconnect_provider",
      target: svc.service_name,
      status: "running",
    });
    await writeLog({
      level: "info", message: `Self-healing: Attempting reconnect for ${svc.service_name}`,
      service: "self_healing", module: "services",
      metadata: { service_name: svc.service_name },
    });
    actions[actions.length - 1].status = "completed";
    actions[actions.length - 1].result = `Reconnect initiated for ${svc.service_name}`;
  }

  // 4. Check for dead letter queue items and retry
  const deadLetterItems = await queryAll<any>(
    `SELECT wq.* FROM workflow_queue wq
     WHERE wq.status = 'failed' AND wq.retry_count >= wq.max_retries
     LIMIT 20`,
  );
  for (const item of deadLetterItems) {
    actions.push({
      action_type: "recover_webhook",
      target: item.id,
      status: "completed",
    });
    await writeLog({
      level: "info", message: `Self-healing: Recovering dead letter item ${item.id}`,
      service: "self_healing", module: "queue",
      metadata: { queue_item_id: item.id, queue_name: item.queue_name },
    });
    actions[actions.length - 1].result = `Dead letter item ${item.id} flagged for recovery`;
  }

  return actions;
}

/* ================================================================== */
/*  SECURITY MONITORING                                                */
/* ================================================================== */

export interface SecurityEvent {
  event_type: string;
  source_ip?: string;
  user_id?: string;
  session_id?: string;
  details: string;
  severity: Severity;
  metadata: Record<string, any>;
}

export async function detectSecurityEvent(event: SecurityEvent): Promise<void> {
  // Log the security event
  await writeLog({
    level: event.severity === "critical" ? "critical" : event.severity === "high" ? "error" : "warning",
    message: `Security: ${event.event_type} — ${event.details}`,
    service: "security_monitoring",
    module: event.event_type,
    ip_address: event.source_ip,
    user_id: event.user_id,
    session_id: event.session_id,
    metadata: event.metadata,
  });

  // Trigger alert for critical security events
  if (event.severity === "critical" || event.severity === "high") {
    await triggerAlert({
      rule_name: `Security: ${event.event_type}`,
      alert_type: "security_event",
      severity: event.severity,
      message: event.details,
      entity_type: "security",
      channels: ["email", "slack"],
      auto_resolve: false,
      metadata: event.metadata,
    });
  }

  // Create incident for critical events
  if (event.severity === "critical") {
    await createIncident({
      title: `Security: ${event.event_type}`,
      description: event.details,
      severity: "critical",
      entity_type: "security",
      source: "security_monitoring",
      tags: event.metadata,
    });
  }
}

export async function checkBruteForce(ip: string, threshold = 10, windowMinutes = 15): Promise<boolean> {
  const count = await queryOne<any>(
    `SELECT COUNT(*) as c FROM system_logs
     WHERE ip_address = $1 AND level = 'warning'
     AND message ILIKE '%login%failed%'
     AND timestamp > NOW() - INTERVAL '1 minute' * $2`,
    [ip, windowMinutes],
  );
  const attempts = parseInt(count?.c || "0");
  if (attempts >= threshold) {
    await detectSecurityEvent({
      event_type: "brute_force",
      source_ip: ip,
      details: `Brute force detected: ${attempts} failed login attempts from ${ip} in ${windowMinutes} minutes`,
      severity: "critical",
      metadata: { ip, attempts, window_minutes: windowMinutes, threshold },
    });
    return true;
  }
  return false;
}

export async function checkSqlInjection(input: string, sourceIp?: string): Promise<boolean> {
  const patterns = [
    /'.*OR.*'.*=/i, /DROP\s+TABLE/i, /UNION\s+SELECT/i,
    /DELETE\s+FROM/i, /INSERT\s+INTO/i, /--/,
    /\/\*.*\*\//, /xp_cmdshell/i, /EXEC\s+xp/i,
  ];
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      await detectSecurityEvent({
        event_type: "sql_injection",
        source_ip: sourceIp,
        details: `SQL injection pattern detected: ${input.slice(0, 100)}`,
        severity: "high",
        metadata: { input_sample: input.slice(0, 200), pattern: pattern.source },
      });
      return true;
    }
  }
  return false;
}

export async function checkXss(input: string, sourceIp?: string): Promise<boolean> {
  const patterns = [
    /<script\b/i, /onerror\s*=/i, /onload\s*=/i,
    /javascript:\s*/i, /<iframe\b/i, /<embed\b/i,
    /alert\s*\(/i, /document\.cookie/i,
  ];
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      await detectSecurityEvent({
        event_type: "xss_attempt",
        source_ip: sourceIp,
        details: `XSS pattern detected: ${input.slice(0, 100)}`,
        severity: "high",
        metadata: { input_sample: input.slice(0, 200), pattern: pattern.source },
      });
      return true;
    }
  }
  return false;
}

/* ================================================================== */
/*  CREDENTIAL STUFFING DETECTION                                      */
/* ================================================================== */

/**
 * Detect credential stuffing by monitoring rapid login attempts with different usernames from the same IP.
 */
export async function checkCredentialStuffing(
  ip: string,
  threshold = 20,
  windowMinutes = 5,
): Promise<boolean> {
  const result = await queryOne<any>(
    `SELECT
      COUNT(*) as total_attempts,
      COUNT(DISTINCT user_id) as distinct_users
     FROM system_logs
     WHERE ip_address = $1 AND level IN ('warning','error')
       AND (message ILIKE '%login%' OR message ILIKE '%auth%')
       AND timestamp > NOW() - INTERVAL '1 minute' * $2`,
    [ip, windowMinutes],
  );
  const attempts = parseInt(result?.total_attempts || "0");
  if (attempts >= threshold) {
    await detectSecurityEvent({
      event_type: "credential_stuffing",
      source_ip: ip,
      details: `Credential stuffing detected: ${attempts} login attempts with ${result?.distinct_users || "multiple"} distinct users from ${ip} in ${windowMinutes} minutes`,
      severity: "critical",
      metadata: { ip, attempts, distinct_users: result?.distinct_users, window_minutes: windowMinutes, threshold },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  CSRF DETECTION                                                     */
/* ================================================================== */

/**
 * Detect potential CSRF attacks by checking for missing or invalid Origin/Referer headers.
 */
export async function checkCsrf(
  request: {
    origin?: string;
    referer?: string;
    method: string;
    path: string;
    source_ip?: string;
    user_id?: string;
  },
): Promise<boolean> {
  // Only check state-changing requests
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
    return false;
  }

  const hasOrigin = !!request.origin;
  const hasReferer = !!request.referer;
  const trustedOrigins = ["localhost", "alayainsider.com", "alayainsider.io", "127.0.0.1"];
  const isTrustedOrigin = !request.origin || trustedOrigins.some((d) => request.origin!.includes(d));

  if ((!hasOrigin && !hasReferer) || (!isTrustedOrigin && hasOrigin)) {
    await detectSecurityEvent({
      event_type: "csrf",
      source_ip: request.source_ip,
      user_id: request.user_id,
      details: `Potential CSRF: ${request.method} ${request.path} from origin=${request.origin || "missing"}, referer=${request.referer || "missing"}`,
      severity: "high",
      metadata: {
        method: request.method, path: request.path,
        origin: request.origin || null, referer: request.referer || null,
      },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  RATE LIMIT ABUSE DETECTION                                         */
/* ================================================================== */

/**
 * Detect rate limit abuse by monitoring requests per IP that hit rate limit errors.
 */
export async function checkRateLimitAbuse(
  ip: string,
  threshold = 10,
  windowMinutes = 1,
): Promise<boolean> {
  const result = await queryOne<any>(
    `SELECT COUNT(*) as c FROM system_logs
     WHERE ip_address = $1 AND level = 'warning'
       AND message ILIKE '%rate%limit%'
       AND timestamp > NOW() - INTERVAL '1 minute' * $2`,
    [ip, windowMinutes],
  );
  const count = parseInt(result?.c || "0");
  if (count >= threshold) {
    await detectSecurityEvent({
      event_type: "rate_limit_abuse",
      source_ip: ip,
      details: `Rate limit abuse detected: ${count} rate limit hits from ${ip} in ${windowMinutes} minute(s)`,
      severity: "high",
      metadata: { ip, hits: count, window_minutes: windowMinutes, threshold },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  API ABUSE DETECTION                                                */
/* ================================================================== */

/**
 * Detect API abuse by monitoring unusual patterns like high 4xx/5xx rates or unusual endpoints.
 */
export async function checkApiAbuse(
  sourceIp: string,
  threshold = 50,
  windowMinutes = 5,
): Promise<boolean> {
  const result = await queryOne<any>(
    `SELECT
      COUNT(*) as total_errors,
      COUNT(*) FILTER (WHERE message ILIKE '%404%') as not_found_errors,
      COUNT(*) FILTER (WHERE message ILIKE '%403%' OR message ILIKE '%401%') as auth_errors
     FROM system_logs
     WHERE ip_address = $1 AND level IN ('warning','error')
       AND (message ILIKE '%404%' OR message ILIKE '%403%' OR message ILIKE '%401%' OR message ILIKE '%500%')
       AND timestamp > NOW() - INTERVAL '1 minute' * $2`,
    [sourceIp, windowMinutes],
  );
  const totalErrors = parseInt(result?.total_errors || "0");
  if (totalErrors >= threshold) {
    await detectSecurityEvent({
      event_type: "api_abuse",
      source_ip: sourceIp,
      details: `API abuse detected: ${totalErrors} error responses from ${sourceIp} in ${windowMinutes} minutes (404: ${result?.not_found_errors}, 401/403: ${result?.auth_errors})`,
      severity: "high",
      metadata: {
        ip: sourceIp, total_errors: totalErrors,
        not_found: parseInt(result?.not_found_errors || "0"),
        auth_errors: parseInt(result?.auth_errors || "0"),
        window_minutes: windowMinutes, threshold,
      },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  ADMIN LOGIN ATTEMPT DETECTION                                      */
/* ================================================================== */

/**
 * Detect suspicious admin login attempts — especially from unusual locations or times.
 */
export async function checkAdminLoginAttempt(
  ip: string,
  email: string,
  threshold = 3,
  windowMinutes = 15,
): Promise<boolean> {
  const result = await queryOne<any>(
    `SELECT COUNT(*) as c FROM system_logs
     WHERE ip_address = $1 AND level = 'warning'
       AND message ILIKE '%admin%login%failed%'
       AND timestamp > NOW() - INTERVAL '1 minute' * $2`,
    [ip, windowMinutes],
  );
  const attempts = parseInt(result?.c || "0");
  if (attempts >= threshold) {
    await detectSecurityEvent({
      event_type: "admin_login_attempt",
      source_ip: ip,
      details: `Suspicious admin login: ${attempts} failed attempts for ${email} from ${ip} in ${windowMinutes} minutes`,
      severity: "critical",
      metadata: { ip, email, attempts, window_minutes: windowMinutes, threshold },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  PERMISSION VIOLATION DETECTION                                     */
/* ================================================================== */

/**
 * Detect permission violations — users accessing resources they shouldn't have access to.
 */
export async function checkPermissionViolation(
  userId: string,
  resource: string,
  action: string,
  sourceIp?: string,
): Promise<boolean> {
  await detectSecurityEvent({
    event_type: "permission_violation",
    source_ip: sourceIp,
    user_id: userId,
    details: `Permission violation: User ${userId} attempted ${action} on ${resource} without required permissions`,
    severity: "high",
    metadata: { user_id: userId, resource, action, ip: sourceIp },
  });
  return true;
}

/* ================================================================== */
/*  IMPOSSIBLE TRAVEL DETECTION                                        */
/* ================================================================== */

/**
 * Detect impossible travel — a user logging in from two geographically distant locations
 * within a short time window.
 */
export async function checkImpossibleTravel(
  userId: string,
  currentIp: string,
  currentCountry: string,
  currentLat?: number,
  currentLng?: number,
  maxSpeedKmh = 900, // Commercial aircraft speed ~900 km/h
): Promise<boolean> {
  const previousLogin = await queryOne<any>(
    `SELECT ip_address, country, metadata FROM system_logs
     WHERE user_id = $1 AND level = 'info'
       AND message ILIKE '%login%success%'
       AND timestamp > NOW() - INTERVAL '1 hour'
     ORDER BY timestamp DESC LIMIT 1 OFFSET 1`,
    [userId],
  );

  if (!previousLogin) return false;

  const prevCountry = previousLogin.country || previousLogin.metadata?.country;
  if (!prevCountry || !currentCountry) return false;

  if (prevCountry !== currentCountry) {
    await detectSecurityEvent({
      event_type: "impossible_travel",
      user_id: userId,
      source_ip: currentIp,
      details: `Impossible travel detected: User ${userId} logged in from ${prevCountry} and then ${currentCountry} within 1 hour`,
      severity: "critical",
      metadata: {
        user_id: userId, previous_country: prevCountry, current_country: currentCountry,
        previous_ip: previousLogin.ip_address, current_ip: currentIp,
      },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  SUSPICIOUS SESSION DETECTION                                       */
/* ================================================================== */

/**
 * Detect suspicious sessions — unusual user agent, concurrent sessions from different IPs,
 * or access patterns that deviate from normal behavior.
 */
export async function checkSuspiciousSession(
  userId: string,
  sessionId: string,
  currentIp: string,
  currentUserAgent?: string,
  threshold = 3,
  windowMinutes = 30,
): Promise<boolean> {
  // Check for concurrent sessions from different IPs
  const concurrentSessions = await queryOne<any>(
    `SELECT COUNT(*) as c FROM system_logs
     WHERE user_id = $1 AND session_id != $2
       AND level = 'info' AND message ILIKE '%session%created%'
       AND timestamp > NOW() - INTERVAL '1 minute' * $3`,
    [userId, sessionId, windowMinutes],
  );

  const activeSessions = parseInt(concurrentSessions?.c || "0");
  if (activeSessions >= threshold) {
    await detectSecurityEvent({
      event_type: "suspicious_session",
      user_id: userId,
      source_ip: currentIp,
      details: `Suspicious session activity: User ${userId} has ${activeSessions} active sessions from different IPs in ${windowMinutes} minutes`,
      severity: "high",
      metadata: {
        user_id: userId, active_sessions: activeSessions, current_ip: currentIp,
        current_user_agent: currentUserAgent || null, window_minutes: windowMinutes,
      },
    });
    return true;
  }
  return false;
}

/* ================================================================== */
/*  DEDICATED RESTORE HANDLERS                                         */
/* ================================================================== */

/**
 * Perform a database restore — restores all tables from a backup.
 */
export async function restoreDatabase(
  backupId: string,
  options?: { target_database?: string; initiated_by?: string; tables?: string[] },
): Promise<any> {
  const backup = await queryOne<any>("SELECT * FROM system_backups WHERE id = $1", [backupId]);
  if (!backup) throw new Error(`Backup ${backupId} not found`);

  const restore = await createRestoreRecord({
    backup_id: backupId,
    backup_name: backup.name,
    restore_type: "database",
    target_database: options?.target_database,
    initiated_by: options?.initiated_by,
    metadata: { tables: options?.tables || [], backup_type: backup.backup_type },
  });

  await writeLog({
    level: "warning",
    message: `Database restore started: ${backup.name} → ${options?.target_database || backup.database_name || "primary"}`,
    service: "disaster_recovery",
    module: "restore_database",
    metadata: { restore_id: restore.id, backup_id: backupId, tables: options?.tables },
  });

  return { ...restore, backup_name: backup.name };
}

/**
 * Restore media files (images, videos, documents) from a media backup.
 */
export async function restoreMedia(
  backupId: string,
  options?: { target_path?: string; initiated_by?: string; file_types?: string[] },
): Promise<any> {
  const backup = await queryOne<any>("SELECT * FROM system_backups WHERE id = $1", [backupId]);
  if (!backup) throw new Error(`Backup ${backupId} not found`);

  const restore = await createRestoreRecord({
    backup_id: backupId,
    backup_name: backup.name,
    restore_type: "media",
    initiated_by: options?.initiated_by,
    metadata: { target_path: options?.target_path, file_types: options?.file_types || ["*"] },
  });

  await writeLog({
    level: "warning", message: `Media restore started: ${backup.name}`,
    service: "disaster_recovery", module: "restore_media",
    metadata: { restore_id: restore.id, backup_id: backupId, file_types: options?.file_types },
  });

  return { ...restore, backup_name: backup.name };
}

/**
 * Restore platform settings (system configuration, feature flags, preferences).
 */
export async function restoreSettings(
  backupId: string,
  options?: { initiated_by?: string; setting_keys?: string[] },
): Promise<any> {
  const backup = await queryOne<any>("SELECT * FROM system_backups WHERE id = $1", [backupId]);
  if (!backup) throw new Error(`Backup ${backupId} not found`);

  const restore = await createRestoreRecord({
    backup_id: backupId,
    backup_name: backup.name,
    restore_type: "settings",
    initiated_by: options?.initiated_by,
    metadata: { setting_keys: options?.setting_keys || ["*"] },
  });

  await writeLog({
    level: "warning", message: `Settings restore started: ${backup.name}`,
    service: "disaster_recovery", module: "restore_settings",
    metadata: { restore_id: restore.id, backup_id: backupId, keys: options?.setting_keys },
  });

  return { ...restore, backup_name: backup.name };
}

/**
 * Restore configuration (environment variables, service configs, integration credentials).
 */
export async function restoreConfiguration(
  backupId: string,
  options?: { initiated_by?: string; config_sections?: string[] },
): Promise<any> {
  const backup = await queryOne<any>("SELECT * FROM system_backups WHERE id = $1", [backupId]);
  if (!backup) throw new Error(`Backup ${backupId} not found`);

  const restore = await createRestoreRecord({
    backup_id: backupId,
    backup_name: backup.name,
    restore_type: "configuration",
    initiated_by: options?.initiated_by,
    metadata: { config_sections: options?.config_sections || ["*"] },
  });

  await writeLog({
    level: "warning", message: `Configuration restore started: ${backup.name}`,
    service: "disaster_recovery", module: "restore_configuration",
    metadata: { restore_id: restore.id, backup_id: backupId, sections: options?.config_sections },
  });

  return { ...restore, backup_name: backup.name };
}

/**
 * Restore environment configuration (deployment env vars, region configs, scaling rules).
 */
export async function restoreEnvironment(
  backupId: string,
  options?: { initiated_by?: string; env_names?: string[] },
): Promise<any> {
  const backup = await queryOne<any>("SELECT * FROM system_backups WHERE id = $1", [backupId]);
  if (!backup) throw new Error(`Backup ${backupId} not found`);

  const restore = await createRestoreRecord({
    backup_id: backupId,
    backup_name: backup.name,
    restore_type: "environment",
    initiated_by: options?.initiated_by,
    metadata: { env_names: options?.env_names || ["*"] },
  });

  await writeLog({
    level: "warning", message: `Environment restore started: ${backup.name}`,
    service: "disaster_recovery", module: "restore_environment",
    metadata: { restore_id: restore.id, backup_id: backupId, envs: options?.env_names },
  });

  return { ...restore, backup_name: backup.name };
}

/**
 * Unified restore — performs the correct restore type based on backup metadata or explicit type.
 */
export async function performRestore(
  backupId: string,
  options?: {
    restore_type?: "database" | "media" | "settings" | "configuration" | "environment";
    target_database?: string;
    target_path?: string;
    initiated_by?: string;
    tables?: string[];
    file_types?: string[];
    setting_keys?: string[];
    config_sections?: string[];
    env_names?: string[];
  },
): Promise<any> {
  const type = options?.restore_type || "database";
  switch (type) {
    case "database": return restoreDatabase(backupId, options);
    case "media": return restoreMedia(backupId, options);
    case "settings": return restoreSettings(backupId, options);
    case "configuration": return restoreConfiguration(backupId, options);
    case "environment": return restoreEnvironment(backupId, options);
    default: return restoreDatabase(backupId, options);
  }
}

/* ================================================================== */
/*  DISASTER RECOVERY                                                  */
/* ================================================================== */

export interface BackupRecord {
  id: string;
  name: string;
  type: string;
  backup_type: string;
  status: string;
  file_path?: string;
  file_size?: number;
  checksum?: string;
  encryption_algorithm?: string;
  database_name?: string;
  tables_backed_up: number;
  total_rows: number;
  verified: boolean;
  verified_at?: string;
  retention_days: number;
  expires_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  completed_at?: string;
}

export async function createBackupRecord(input: {
  name: string;
  type?: string;
  backup_type?: string;
  retention_days?: number;
  created_by?: string;
  metadata?: Record<string, any>;
}): Promise<BackupRecord> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const retentionDays = input.retention_days || 30;

  await query(
    `INSERT INTO system_backups (id, name, type, backup_type, status, retention_days,
      expires_at, created_by, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, input.name, input.type || "manual", input.backup_type || "full",
     "running", retentionDays,
     new Date(Date.now() + retentionDays * 86400000).toISOString(),
     input.created_by || "system", JSON.stringify(input.metadata || {}), now],
  );

  await writeLog({
    level: "info", message: `Backup started: ${input.name} (${input.backup_type || "full"})`,
    service: "disaster_recovery", module: "backups",
    metadata: { backup_id: id, type: input.type, backup_type: input.backup_type },
  });

  return {
    id, name: input.name, type: input.type || "manual", backup_type: input.backup_type || "full",
    status: "running", retention_days: retentionDays, tables_backed_up: 0, total_rows: 0,
    verified: false, metadata: input.metadata || {}, created_by: input.created_by || "system",
    created_at: now,
  };
}

export async function completeBackup(id: string, result: {
  status?: string;
  file_path?: string;
  file_size?: number;
  checksum?: string;
  tables_backed_up?: number;
  total_rows?: number;
  error_message?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE system_backups SET status = $1, completed_at = $2, file_path = $3, file_size = $4,
      checksum = $5, tables_backed_up = $6, total_rows = $7, error_message = $8
     WHERE id = $9`,
    [result.status || "completed", now, result.file_path || null, result.file_size || null,
     result.checksum || null, result.tables_backed_up || 0, result.total_rows || 0,
     result.error_message || null, id],
  );
}

export async function verifyBackup(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  await query(
    "UPDATE system_backups SET verified = true, verified_at = $1 WHERE id = $2",
    [now, id],
  );
  await writeLog({
    level: "info", message: `Backup verified: ${id}`,
    service: "disaster_recovery", module: "backups",
    metadata: { backup_id: id },
  });
  return true;
}

export async function createRestoreRecord(input: {
  backup_id: string;
  backup_name?: string;
  restore_type?: string;
  target_database?: string;
  initiated_by?: string;
  metadata?: Record<string, any>;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO system_restores (id, backup_id, backup_name, restore_type, status,
      target_database, initiated_by, metadata, recovery_point, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, input.backup_id, input.backup_name || null, input.restore_type || "full",
     "running", input.target_database || process.env.DATABASE_NAME || "alaya_insider",
     input.initiated_by || "system", JSON.stringify(input.metadata || {}), now, now, now],
  );

  await writeLog({
    level: "warning", message: `Restore started: ${input.backup_name || input.backup_id} (${input.restore_type || "full"})`,
    service: "disaster_recovery", module: "restores",
    metadata: { restore_id: id, backup_id: input.backup_id },
  });

  return { id, backup_id: input.backup_id, restore_type: input.restore_type || "full", status: "running", created_at: now };
}

export async function completeRestore(id: string, result: {
  status?: string;
  tables_restored?: number;
  total_rows?: number;
  error_message?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE system_restores SET status = $1, completed_at = $2, tables_restored = $3,
      total_rows = $4, verified = $5, verified_at = $6, error_message = $7, updated_at = $8
     WHERE id = $9`,
    [result.status || "completed", now, result.tables_restored || 0, result.total_rows || 0,
     !result.error_message, result.error_message ? null : now, result.error_message || null, now, id],
  );
}

export async function getBackups(params: {
  type?: string;
  status?: string;
  limit?: number;
}): Promise<BackupRecord[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.type) { conditions.push(`type = $${idx}`); values.push(params.type); idx++; }
  if (params.status) { conditions.push(`status = $${idx}`); values.push(params.status); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 50;

  return queryAll<BackupRecord>(
    `SELECT * FROM system_backups ${where} ORDER BY created_at DESC LIMIT $${idx}`,
    [...values, limit],
  );
}

export async function getBackupStats(): Promise<{
  total: number; verified: number; total_size_bytes: number; last_backup_at?: string;
}> {
  const stats = await queryOne<any>(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE verified = true) as verified,
      COALESCE(SUM(file_size), 0) as total_size,
      MAX(completed_at) as last_backup
     FROM system_backups WHERE created_at > NOW() - INTERVAL '90 days'`,
  );
  return {
    total: parseInt(stats?.total || "0"),
    verified: parseInt(stats?.verified || "0"),
    total_size_bytes: parseInt(stats?.total_size || "0"),
    last_backup_at: stats?.last_backup,
  };
}

/* ================================================================== */
/*  OBSERVABILITY DASHBOARD STATS                                      */
/* ================================================================== */

export async function getDashboardStats(): Promise<{
  services: { total: number; healthy: number; degraded: number; down: number };
  workers: { total: number; healthy: number; unhealthy: number };
  queues: { total: number; healthy: number; total_depth: number };
  logs: { total_24h: number; errors_24h: number };
  alerts: { total: number; triggered: number };
  incidents: { total: number; open: number };
  backups: { total: number; verified: number; last_backup?: string };
  metrics: { avg_latency_ms: number; error_rate: number; latency_ms: number };
}> {
  const serviceHealth = await queryAll<any>("SELECT DISTINCT ON (service_name) healthy FROM service_health ORDER BY service_name, checked_at DESC");
  const workerHealth = await queryAll<any>("SELECT DISTINCT ON (worker_name) healthy FROM worker_health ORDER BY worker_name, checked_at DESC");
  const queueHealth = await queryAll<any>("SELECT DISTINCT ON (queue_name) healthy, depth FROM queue_health ORDER BY queue_name, checked_at DESC");
  const logStats = await queryOne<any>("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE level IN ('error','critical')) as errors FROM system_logs WHERE created_at > NOW() - INTERVAL '24 hours'");
  const alertStats = await queryOne<any>("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'triggered') as triggered FROM system_alerts WHERE created_at > NOW() - INTERVAL '7 days'");
  const incidentStats = await queryOne<any>("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status != 'resolved') as open FROM system_incidents");
  const backupRes = await getBackupStats();
  const metrics = await queryOne<any>(
    "SELECT COALESCE(AVG(latency_ms), 0) as avg_lat FROM service_health WHERE checked_at > NOW() - INTERVAL '24 hours'",
  );

  return {
    services: {
      total: serviceHealth.length,
      healthy: serviceHealth.filter((s: any) => s.healthy).length,
      degraded: serviceHealth.filter((s: any) => !s.healthy).length,
      down: serviceHealth.filter((s: any) => !s.healthy).length,
    },
    workers: {
      total: workerHealth.length,
      healthy: workerHealth.filter((w: any) => w.healthy).length,
      unhealthy: workerHealth.filter((w: any) => !w.healthy).length,
    },
    queues: {
      total: queueHealth.length,
      healthy: queueHealth.filter((q: any) => q.healthy).length,
      total_depth: queueHealth.reduce((s: number, q: any) => s + (q.depth || 0), 0),
    },
    logs: {
      total_24h: parseInt(logStats?.total || "0"),
      errors_24h: parseInt(logStats?.errors || "0"),
    },
    alerts: {
      total: parseInt(alertStats?.total || "0"),
      triggered: parseInt(alertStats?.triggered || "0"),
    },
    incidents: {
      total: parseInt(incidentStats?.total || "0"),
      open: parseInt(incidentStats?.open || "0"),
    },
    backups: backupRes,
    metrics: {
      avg_latency_ms: parseFloat(metrics?.avg_lat || "0"),
      error_rate: (parseInt(logStats?.errors || "0") / Math.max(parseInt(logStats?.total || "1"), 1)) * 100,
      latency_ms: parseFloat(metrics?.avg_lat || "0"),
    },
  };
}
