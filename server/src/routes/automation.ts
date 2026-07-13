/**
 * ALAYA INSIDER — Enterprise Automation Routes (PR-7)
 * --------------------------------------------------------------------------
 * Complete REST API for the Enterprise Automation Platform.
 * Built on top of the Order Orchestrator (PR-6).
 * Mounted at /api/v1/automation
 */

import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../db/index.js";
import {
  automationRules, automationTriggers, automationConditions,
  automationActions, automationRuns, automationJobs,
  automationLogs, automationWorkers, automationSchedules,
  automationMetrics,
} from "../db/repositories/index.js";
import {
  runAutomationRule, simulateAutomationRule, evaluateConditions,
  executeAction, processEventTrigger, checkScheduledRules,
  registerWorker, workerHeartbeat, claimJobs,
  parseCronExpression, getAutomationStats, generateAIContent,
  TRIGGER_TYPES, ACTION_TYPES, COMPARATORS, checkCircuitBreaker,
} from "../services/automationEngine.js";

const automation = new Hono();

/* ================================================================== */
/*  RULES                                                              */
/* ================================================================== */

automation.get("/rules", async (c) => {
  const result = await automationRules.list(c.req.query() as any);
  return c.json(result);
});

automation.get("/rules/enabled", async (c) => {
  const result = await automationRules.getEnabled();
  return c.json(result);
});

automation.get("/rules/by-trigger/:event", async (c) => {
  const result = await automationRules.getByTrigger(c.req.param("event"));
  return c.json(result);
});

automation.get("/rules/:id", async (c) => {
  const item = await automationRules.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Rule not found" }, 404);
  return c.json(item);
});

automation.post("/rules", async (c) => {
  const body = await c.req.json<any>();
  const item = await automationRules.create(body as any, "api");
  return c.json(item, 201);
});

automation.patch("/rules/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await automationRules.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Rule not found" }, 404);
  return c.json(updated);
});

automation.delete("/rules/:id", async (c) => {
  const ok = await automationRules.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Rule not found" }, 404);
  return c.json({ success: true });
});

automation.post("/rules/:id/run", async (c) => {
  const body = await c.req.json<any>();
  try {
    const result = await runAutomationRule(c.req.param("id"), body.context || {}, { dryRun: body.dry_run || false });
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
});

automation.post("/rules/:id/simulate", async (c) => {
  const body = await c.req.json<any>();
  try {
    const result = await simulateAutomationRule(c.req.param("id"), body.context || {});
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
});

/* ================================================================== */
/*  TRIGGERS                                                           */
/* ================================================================== */

automation.get("/triggers/types", async (c) => {
  return c.json(TRIGGER_TYPES);
});

automation.get("/triggers/:ruleId", async (c) => {
  const result = await automationTriggers.getByRule(c.req.param("ruleId"));
  return c.json(result);
});

automation.post("/triggers/:ruleId", async (c) => {
  const body = await c.req.json<any>();
  const item = await automationTriggers.create({ ...body, rule_id: c.req.param("ruleId") } as any, "api");
  return c.json(item, 201);
});

automation.delete("/triggers/:id", async (c) => {
  const ok = await automationTriggers.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Trigger not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  CONDITIONS                                                         */
/* ================================================================== */

automation.get("/conditions/:ruleId", async (c) => {
  const result = await automationConditions.getByRule(c.req.param("ruleId"));
  return c.json(result);
});

automation.post("/conditions/:ruleId", async (c) => {
  const body = await c.req.json<any>();
  const item = await automationConditions.create({ ...body, rule_id: c.req.param("ruleId") } as any, "api");
  return c.json(item, 201);
});

automation.patch("/conditions/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await automationConditions.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Condition not found" }, 404);
  return c.json(updated);
});

automation.delete("/conditions/:id", async (c) => {
  const ok = await automationConditions.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Condition not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  ACTIONS                                                            */
/* ================================================================== */

automation.get("/actions/types", async (c) => {
  return c.json(ACTION_TYPES);
});

automation.get("/actions/:ruleId", async (c) => {
  const result = await automationActions.getByRule(c.req.param("ruleId"));
  return c.json(result);
});

automation.post("/actions/:ruleId", async (c) => {
  const body = await c.req.json<any>();
  const item = await automationActions.create({ ...body, rule_id: c.req.param("ruleId") } as any, "api");
  return c.json(item, 201);
});

automation.patch("/actions/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await automationActions.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Action not found" }, 404);
  return c.json(updated);
});

automation.delete("/actions/:id", async (c) => {
  const ok = await automationActions.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Action not found" }, 404);
  return c.json({ success: true });
});

automation.post("/actions/:id/execute", async (c) => {
  const action = await automationActions.getById(c.req.param("id"));
  if (!action) return c.json({ code: "NOT_FOUND", message: "Action not found" }, 404);
  const body = await c.req.json<any>();
  const result = await executeAction(action, body.context || {});
  return c.json(result);
});

/* ================================================================== */
/*  RUNS                                                               */
/* ================================================================== */

automation.get("/runs", async (c) => {
  const status = c.req.query("status");
  if (status) {
    const result = await automationRuns.getByStatus(status);
    return c.json(result);
  }
  const result = await automationRuns.getRecent(Number(c.req.query("limit")) || 20);
  return c.json(result);
});

automation.get("/runs/:id", async (c) => {
  const item = await automationRuns.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Run not found" }, 404);
  return c.json(item);
});

automation.get("/runs/:id/jobs", async (c) => {
  const result = await automationJobs.getByRun(c.req.param("id"));
  return c.json(result);
});

automation.get("/runs/:id/logs", async (c) => {
  const result = await automationLogs.getByRun(c.req.param("id"));
  return c.json(result);
});

/* ================================================================== */
/*  JOBS                                                               */
/* ================================================================== */

automation.get("/jobs", async (c) => {
  const status = c.req.query("status");
  if (status) {
    const result = await automationJobs.getByStatus(status);
    return c.json(result);
  }
  const result = await automationJobs.list(c.req.query() as any);
  return c.json(result);
});

automation.get("/jobs/queued", async (c) => {
  const result = await automationJobs.getQueued();
  return c.json(result);
});

automation.get("/jobs/failed", async (c) => {
  const result = await automationJobs.getFailed();
  return c.json(result);
});

automation.get("/jobs/:id", async (c) => {
  const item = await automationJobs.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Job not found" }, 404);
  return c.json(item);
});

automation.post("/jobs/:id/retry", async (c) => {
  const job = await automationJobs.getById(c.req.param("id"));
  if (!job) return c.json({ code: "NOT_FOUND", message: "Job not found" }, 404);
  const updated = await automationJobs.update(c.req.param("id"), {
    status: "queued",
    retry_count: 0,
    error_message: null,
  } as any, "api");
  return c.json(updated);
});

automation.post("/jobs/:id/cancel", async (c) => {
  const updated = await automationJobs.update(c.req.param("id"), { status: "cancelled" } as any, "api");
  return c.json(updated);
});

/* ================================================================== */
/*  WORKERS                                                            */
/* ================================================================== */

automation.get("/workers", async (c) => {
  const result = await automationWorkers.list(c.req.query() as any);
  return c.json(result);
});

automation.get("/workers/active", async (c) => {
  const result = await automationWorkers.getActive();
  return c.json(result);
});

automation.get("/workers/healthy", async (c) => {
  const result = await automationWorkers.getHealthy();
  return c.json(result);
});

automation.get("/workers/:id", async (c) => {
  const item = await automationWorkers.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Worker not found" }, 404);
  return c.json(item);
});

automation.post("/workers/register", async (c) => {
  const body = await c.req.json<any>();
  const worker = await registerWorker(body.name, body.worker_type, body.queues, body.max_concurrent_jobs);
  return c.json(worker, 201);
});

automation.post("/workers/:id/heartbeat", async (c) => {
  const body = await c.req.json<any>();
  await workerHeartbeat(c.req.param("id"), body);
  return c.json({ success: true });
});

automation.post("/workers/:id/claim", async (c) => {
  const body = await c.req.json<any>();
  const jobs = await claimJobs(c.req.param("id"), body.queue_name || "automation", body.limit || 5);
  return c.json(jobs);
});

automation.delete("/workers/:id", async (c) => {
  const ok = await automationWorkers.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Worker not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SCHEDULES                                                          */
/* ================================================================== */

automation.get("/schedules", async (c) => {
  const result = await automationSchedules.list(c.req.query() as any);
  return c.json(result);
});

automation.get("/schedules/due", async (c) => {
  const result = await automationSchedules.getDue();
  return c.json(result);
});

automation.get("/schedules/:id", async (c) => {
  const item = await automationSchedules.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Schedule not found" }, 404);
  return c.json(item);
});

automation.post("/schedules", async (c) => {
  const body = await c.req.json<any>();
  // Parse cron expression
  const parsed = parseCronExpression(body.cron_expression, body.timezone);
  if (!parsed.valid) return c.json({ code: "INVALID_CRON", message: parsed.error }, 400);

  const item = await automationSchedules.create({
    ...body,
    next_run_at: parsed.nextRun?.toISOString(),
  } as any, "api");
  return c.json(item, 201);
});

automation.patch("/schedules/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await automationSchedules.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Schedule not found" }, 404);
  return c.json(updated);
});

automation.delete("/schedules/:id", async (c) => {
  const ok = await automationSchedules.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Schedule not found" }, 404);
  return c.json({ success: true });
});

automation.post("/schedules/check", async (c) => {
  const triggered = await checkScheduledRules();
  return c.json({ triggered });
});

/* ================================================================== */
/*  EVENTS (trigger automation from events)                           */
/* ================================================================== */

automation.post("/events/process", async (c) => {
  const body = await c.req.json<any>();
  const results = await processEventTrigger(body.eventType, body.payload || {});
  return c.json({ triggered: results.length, results });
});

automation.post("/events/process-batch", async (c) => {
  const body = await c.req.json<any>();
  const events = body.events || [];
  const allResults: any[] = [];
  for (const evt of events) {
    const results = await processEventTrigger(evt.eventType, evt.payload || {});
    allResults.push({ eventType: evt.eventType, triggered: results.length });
  }
  return c.json({ processed: events.length, results: allResults });
});

/* ================================================================== */
/*  LOGS                                                               */
/* ================================================================== */

automation.get("/logs", async (c) => {
  const limit = Number(c.req.query("limit")) || 100;
  const level = c.req.query("level");
  let sql = "SELECT * FROM automation_logs";
  const params: any[] = [];
  if (level) {
    sql += " WHERE level = $1";
    params.push(level);
  }
  sql += " ORDER BY created_at DESC LIMIT $2";
  params.push(limit);
  const result = await queryAll(sql, params);
  return c.json(result);
});

automation.get("/logs/:ruleId", async (c) => {
  const result = await automationLogs.getByRule(c.req.param("ruleId"));
  return c.json(result);
});

/* ================================================================== */
/*  METRICS                                                            */
/* ================================================================== */

automation.get("/metrics", async (c) => {
  const name = c.req.query("name");
  if (name) {
    const result = await automationMetrics.getByName(name, c.req.query("since"));
    return c.json(result);
  }
  const result = await automationMetrics.getSummary();
  return c.json(result);
});

automation.get("/metrics/:ruleId", async (c) => {
  const result = await automationMetrics.getByRule(c.req.param("ruleId"));
  return c.json(result);
});

/* ================================================================== */
/*  DASHBOARD / STATS                                                 */
/* ================================================================== */

automation.get("/stats", async (c) => {
  const stats = await getAutomationStats();
  return c.json(stats);
});

/* ================================================================== */
/*  AI AUTOMATION                                                     */
/* ================================================================== */

automation.post("/ai/generate", async (c) => {
  const body = await c.req.json<any>();
  const result = await generateAIContent(
    body.type as any,
    body.context || {},
  );
  return c.json(result);
});

/* ================================================================== */
/*  RETRY ENGINE                                                      */
/* ================================================================== */

automation.get("/retry/circuit-breaker/:actionId", async (c) => {
  const allowed = await checkCircuitBreaker(c.req.param("actionId"));
  return c.json({ allowed, actionId: c.req.param("actionId") });
});

/* ================================================================== */
/*  SEED                                                              */
/* ================================================================== */

automation.post("/seed", async (c) => {
  let seeded = 0;

  const defaultRules = [
    {
      name: "Low Stock Alert",
      description: "Notify admin when product stock falls below threshold",
      trigger_event: "low.stock",
      priority: 10,
      enabled: true,
    },
    {
      name: "Order Confirmation Email",
      description: "Send order confirmation email to customer",
      trigger_event: "order.created",
      priority: 5,
      enabled: true,
    },
    {
      name: "Daily Backup",
      description: "Automatic database backup every night",
      trigger_event: "scheduled.time",
      priority: 1,
      enabled: true,
    },
    {
      name: "Broken Affiliate Link Alert",
      description: "Alert when an affiliate link is detected as broken",
      trigger_event: "broken.affiliate.link",
      priority: 8,
      enabled: true,
    },
    {
      name: "New Review Notification",
      description: "Notify admin when a new review is submitted",
      trigger_event: "review.submitted",
      priority: 6,
      enabled: true,
    },
    {
      name: "Price Change Alert",
      description: "Monitor and log competitor price changes",
      trigger_event: "price.change",
      priority: 7,
      enabled: true,
    },
    {
      name: "Welcome Email Series",
      description: "Send welcome email when customer registers",
      trigger_event: "customer.registered",
      priority: 4,
      enabled: true,
    },
  ];

  for (const rule of defaultRules) {
    const existing = await queryOne(
      "SELECT id FROM automation_rules WHERE name = $1",
      [rule.name],
    );
    if (!existing) {
      await automationRules.create(rule as any, "system");
      seeded++;
    }
  }

  // Seed default schedules
  const schedules = [
    { name: "Hourly Health Check", cron_expression: "0 * * * *", timezone: "UTC" },
    { name: "Daily Report Generation", cron_expression: "0 6 * * *", timezone: "UTC" },
    { name: "Weekly Analytics Summary", cron_expression: "0 8 * * 1", timezone: "UTC" },
    { name: "Monthly Backup Verification", cron_expression: "0 2 1 * *", timezone: "UTC" },
  ];

  // Try to link schedules to rules
  const hourlyRule = await queryOne("SELECT id FROM automation_rules WHERE name LIKE '%Backup%' LIMIT 1");
  for (const sched of schedules) {
    const existing = await queryOne(
      "SELECT id FROM automation_schedules WHERE name = $1",
      [sched.name],
    );
    if (!existing) {
      const parsed = parseCronExpression(sched.cron_expression, sched.timezone);
      await automationSchedules.create({
        ...sched,
        rule_id: hourlyRule?.id || null,
        next_run_at: parsed.nextRun?.toISOString(),
      } as any, "system");
      seeded++;
    }
  }

  return c.json({ seeded, total: defaultRules.length + schedules.length });
});

export { automation };
