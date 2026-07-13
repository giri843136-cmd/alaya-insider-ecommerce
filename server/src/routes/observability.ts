/**
 * ALAYA INSIDER — Enterprise Observability Platform Routes (PR-8)
 * --------------------------------------------------------------------------
 * REST API endpoints for the centralized observability platform.
 * Mounted at /api/v1/observability in routes/index.ts
 *
 * Sections:
 *   /logs          — Structured logging (write, query, stats)
 *   /traces        — Distributed tracing (create span, complete, query)
 *   /metrics       — Metrics engine (record, query, summary)
 *   /alerts        — Alert engine (trigger, acknowledge, resolve, query)
 *   /incidents     — Incident management (create, update, query)
 *   /services      — Service health (record, query, map)
 *   /workers       — Worker health (record, query)
 *   /queues        — Queue health (record, query)
 *   /self-healing  — Self-healing engine (execute)
 *   /security      — Security monitoring (detect events)
 *   /backups       — Disaster recovery (backups, restores)
 *   /dashboard     — Aggregated stats
 */

import { Hono } from "hono";
import {
  writeLog, queryLogs, getLogStats,
  createSpan, completeSpan, getTrace, getTraces, getTraceStats,
  recordMetric, getMetrics, getMetricSummary,
  computeLatencyPercentiles, computeAllPercentiles,
  triggerAlert, acknowledgeAlert, resolveAlert, getAlerts, getAlertStats,
  createIncident, updateIncident, getIncidents, getIncidentStats,
  recordServiceHealth, getServiceHealth, getUnhealthyServices, getServiceMap,
  recordWorkerHealth, getWorkerHealth,
  recordQueueHealth, getQueueHealth,
  executeSelfHealing,
  detectSecurityEvent, checkBruteForce, checkSqlInjection, checkXss,
  checkCredentialStuffing, checkCsrf, checkRateLimitAbuse, checkApiAbuse,
  checkAdminLoginAttempt, checkPermissionViolation, checkImpossibleTravel, checkSuspiciousSession,
  createBackupRecord, completeBackup, verifyBackup,
  createRestoreRecord, completeRestore,
  restoreDatabase, restoreMedia, restoreSettings, restoreConfiguration, restoreEnvironment, performRestore,
  getBackups, getBackupStats,
  getDashboardStats,
} from "../services/observabilityEngine.js";
import { cacheManager, invalidateEntity as invalidateCacheEntity } from "../services/cache.js";

const observability = new Hono();

/* ================================================================== */
/*  LOGS                                                               */
/* ================================================================== */

observability.post("/logs", async (c) => {
  try {
    const body = await c.req.json();
    const log = await writeLog(body);
    return c.json({ success: true, data: log }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/logs", async (c) => {
  const levels = c.req.query("levels")?.split(",") as any[];
  const services = c.req.query("services")?.split(",");
  const logs = await queryLogs({
    levels: levels?.length ? levels : undefined,
    services: services?.length ? services : undefined,
    search: c.req.query("search"),
    correlation_id: c.req.query("correlation_id"),
    trace_id: c.req.query("trace_id"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: logs });
});

observability.get("/logs/stats", async (c) => {
  const stats = await getLogStats();
  return c.json({ success: true, data: stats });
});

/* ================================================================== */
/*  TRACES                                                             */
/* ================================================================== */

observability.post("/traces/spans", async (c) => {
  try {
    const body = await c.req.json();
    const span = await createSpan(body);
    return c.json({ success: true, data: span }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/traces/spans/:id/complete", async (c) => {
  try {
    const body = await c.req.json();
    await completeSpan(c.req.param("id"), body);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/traces/:traceId", async (c) => {
  const spans = await getTrace(c.req.param("traceId"));
  return c.json({ success: true, data: spans });
});

observability.get("/traces", async (c) => {
  const traces = await getTraces({
    service: c.req.query("service"),
    status: c.req.query("status"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: traces });
});

observability.get("/traces/stats", async (c) => {
  const stats = await getTraceStats();
  return c.json({ success: true, data: stats });
});

/* ================================================================== */
/*  METRICS                                                            */
/* ================================================================== */

observability.post("/metrics", async (c) => {
  try {
    const body = await c.req.json();
    const metric = await recordMetric(body);
    return c.json({ success: true, data: metric }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/metrics", async (c) => {
  const metrics = await getMetrics({
    names: c.req.query("names")?.split(","),
    source: c.req.query("source"),
    entity_type: c.req.query("entity_type"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: metrics });
});

observability.get("/metrics/summary", async (c) => {
  const days = c.req.query("days") ? parseInt(c.req.query("days")!) : 7;
  const summary = await getMetricSummary(days);
  return c.json({ success: true, data: summary });
});

/* ================================================================== */
/*  ALERTS                                                             */
/* ================================================================== */

observability.post("/alerts", async (c) => {
  try {
    const body = await c.req.json();
    const alert = await triggerAlert(body);
    return c.json({ success: true, data: alert }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/alerts/:id/acknowledge", async (c) => {
  const userId = c.req.query("user_id") || "system";
  const alert = await acknowledgeAlert(c.req.param("id"), userId);
  if (!alert) return c.json({ success: false, error: "Alert not found" }, 404);
  return c.json({ success: true, data: alert });
});

observability.post("/alerts/:id/resolve", async (c) => {
  const resolvedBy = c.req.query("resolved_by") || "system";
  const alert = await resolveAlert(c.req.param("id"), resolvedBy);
  if (!alert) return c.json({ success: false, error: "Alert not found" }, 404);
  return c.json({ success: true, data: alert });
});

observability.get("/alerts", async (c) => {
  const alerts = await getAlerts({
    status: c.req.query("status") as any,
    severity: c.req.query("severity"),
    alert_type: c.req.query("alert_type"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: alerts });
});

observability.get("/alerts/stats", async (c) => {
  const stats = await getAlertStats();
  return c.json({ success: true, data: stats });
});

/* ================================================================== */
/*  INCIDENTS                                                          */
/* ================================================================== */

observability.post("/incidents", async (c) => {
  try {
    const body = await c.req.json();
    const incident = await createIncident(body);
    return c.json({ success: true, data: incident }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.patch("/incidents/:id", async (c) => {
  try {
    const body = await c.req.json();
    const incident = await updateIncident(c.req.param("id"), body);
    if (!incident) return c.json({ success: false, error: "Incident not found" }, 404);
    return c.json({ success: true, data: incident });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/incidents", async (c) => {
  const incidents = await getIncidents({
    status: c.req.query("status") as any,
    severity: c.req.query("severity"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: incidents });
});

observability.get("/incidents/stats", async (c) => {
  const stats = await getIncidentStats();
  return c.json({ success: true, data: stats });
});

/* ================================================================== */
/*  SERVICE HEALTH                                                     */
/* ================================================================== */

observability.post("/services/health", async (c) => {
  try {
    const body = await c.req.json();
    const entry = await recordServiceHealth(body);
    return c.json({ success: true, data: entry }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/services/health", async (c) => {
  const serviceName = c.req.query("service_name") || undefined;
  const health = await getServiceHealth(serviceName);
  return c.json({ success: true, data: health });
});

observability.get("/services/unhealthy", async (c) => {
  const services = await getUnhealthyServices();
  return c.json({ success: true, data: services });
});

observability.get("/services/map", async (c) => {
  const map = await getServiceMap();
  return c.json({ success: true, data: map });
});

/* ================================================================== */
/*  WORKER HEALTH                                                      */
/* ================================================================== */

observability.post("/workers/health", async (c) => {
  try {
    const body = await c.req.json();
    const entry = await recordWorkerHealth(body);
    return c.json({ success: true, data: entry }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/workers/health", async (c) => {
  const health = await getWorkerHealth();
  return c.json({ success: true, data: health });
});

/* ================================================================== */
/*  QUEUE HEALTH                                                       */
/* ================================================================== */

observability.post("/queues/health", async (c) => {
  try {
    const body = await c.req.json();
    const entry = await recordQueueHealth(body);
    return c.json({ success: true, data: entry }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.get("/queues/health", async (c) => {
  const health = await getQueueHealth();
  return c.json({ success: true, data: health });
});

/* ================================================================== */
/*  SELF-HEALING                                                       */
/* ================================================================== */

observability.post("/self-healing", async (c) => {
  const actions = await executeSelfHealing();
  return c.json({ success: true, data: actions });
});

/* ================================================================== */
/*  SECURITY MONITORING                                                */
/* ================================================================== */

observability.post("/security/detect", async (c) => {
  try {
    const body = await c.req.json();
    await detectSecurityEvent(body);
    return c.json({ success: true }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/brute-force", async (c) => {
  try {
    const { ip, threshold, window_minutes } = await c.req.json();
    const detected = await checkBruteForce(ip, threshold, window_minutes);
    return c.json({ success: true, data: { detected, ip } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/sql-injection", async (c) => {
  try {
    const { input, source_ip } = await c.req.json();
    const detected = await checkSqlInjection(input, source_ip);
    return c.json({ success: true, data: { detected } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/xss", async (c) => {
  try {
    const { input, source_ip } = await c.req.json();
    const detected = await checkXss(input, source_ip);
    return c.json({ success: true, data: { detected } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/credential-stuffing", async (c) => {
  try {
    const { ip, threshold, window_minutes } = await c.req.json();
    const detected = await checkCredentialStuffing(ip, threshold, window_minutes);
    return c.json({ success: true, data: { detected, ip } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/csrf", async (c) => {
  try {
    const body = await c.req.json();
    const detected = await checkCsrf(body);
    return c.json({ success: true, data: { detected } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/rate-limit-abuse", async (c) => {
  try {
    const { ip, threshold, window_minutes } = await c.req.json();
    const detected = await checkRateLimitAbuse(ip, threshold, window_minutes);
    return c.json({ success: true, data: { detected, ip } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/api-abuse", async (c) => {
  try {
    const { ip, threshold, window_minutes } = await c.req.json();
    const detected = await checkApiAbuse(ip, threshold, window_minutes);
    return c.json({ success: true, data: { detected, ip } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/admin-login-attempt", async (c) => {
  try {
    const { ip, email, threshold, window_minutes } = await c.req.json();
    const detected = await checkAdminLoginAttempt(ip, email, threshold, window_minutes);
    return c.json({ success: true, data: { detected, ip } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/permission-violation", async (c) => {
  try {
    const { user_id, resource, action, source_ip } = await c.req.json();
    const detected = await checkPermissionViolation(user_id, resource, action, source_ip);
    return c.json({ success: true, data: { detected } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/impossible-travel", async (c) => {
  try {
    const { user_id, ip, country, lat, lng } = await c.req.json();
    const detected = await checkImpossibleTravel(user_id, ip, country, lat, lng);
    return c.json({ success: true, data: { detected } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/security/check/suspicious-session", async (c) => {
  try {
    const { user_id, session_id, ip, user_agent } = await c.req.json();
    const detected = await checkSuspiciousSession(user_id, session_id, ip, user_agent);
    return c.json({ success: true, data: { detected } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  BACKUPS & DISASTER RECOVERY                                        */
/* ================================================================== */

observability.post("/backups", async (c) => {
  try {
    const body = await c.req.json();
    const backup = await createBackupRecord(body);
    return c.json({ success: true, data: backup }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/backups/:id/complete", async (c) => {
  try {
    const body = await c.req.json();
    await completeBackup(c.req.param("id"), body);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/backups/:id/verify", async (c) => {
  const result = await verifyBackup(c.req.param("id"));
  return c.json({ success: true, data: { verified: result } });
});

observability.get("/backups", async (c) => {
  const backups = await getBackups({
    type: c.req.query("type"),
    status: c.req.query("status"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: backups });
});

observability.get("/backups/stats", async (c) => {
  const stats = await getBackupStats();
  return c.json({ success: true, data: stats });
});

observability.post("/restores", async (c) => {
  try {
    const body = await c.req.json();
    const restore = await createRestoreRecord(body);
    return c.json({ success: true, data: restore }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/restores/:id/complete", async (c) => {
  try {
    const body = await c.req.json();
    await completeRestore(c.req.param("id"), body);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* Dedicated restore type endpoints */
observability.post("/restores/database/:backupId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await restoreDatabase(c.req.param("backupId"), body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/restores/media/:backupId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await restoreMedia(c.req.param("backupId"), body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/restores/settings/:backupId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await restoreSettings(c.req.param("backupId"), body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/restores/configuration/:backupId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await restoreConfiguration(c.req.param("backupId"), body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/restores/environment/:backupId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await restoreEnvironment(c.req.param("backupId"), body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

observability.post("/restores/perform/:backupId", async (c) => {
  try {
    const body = await c.req.json();
    const result = await performRestore(c.req.param("backupId"), body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  PERCENTILES                                                        */
/* ================================================================== */

observability.get("/metrics/percentiles", async (c) => {
  const metricName = c.req.query("metric_name");
  const rawHours = parseInt(c.req.query("hours") || "24");
  const hours = Math.max(1, Math.min(720, isNaN(rawHours) ? 24 : rawHours));
  if (metricName) {
    const p = await computeLatencyPercentiles(metricName, hours);
    return c.json({ success: true, data: p });
  }
  const all = await computeAllPercentiles(hours);
  return c.json({ success: true, data: all });
});

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

/* ================================================================== */
/*  CACHE METRICS — PR-11 Performance Integration                      */
/* ================================================================== */

observability.get("/cache/metrics", async (c) => {
  try {
    const stats = cacheManager.getStats();
    return c.json({ success: true, data: stats });
  } catch (err: any) {
    return c.json({ success: false, error: "Cache service not available" }, 503);
  }
});

observability.post("/cache/metrics/record", async (c) => {
  try {
    const body = await c.req.json();
    if (body.action === "clear_all") {
      cacheManager.clearAll();
    } else if (body.action === "invalidate" && body.entity_type) {
      invalidateCacheEntity(body.entity_type, body.entity_id);
    }
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

observability.get("/dashboard", async (c) => {
  const stats = await getDashboardStats();
  return c.json({ success: true, data: stats });
});

export { observability };
