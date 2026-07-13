/**
 * ALAYA INSIDER — Order Orchestration Routes (PR-6)
 * --------------------------------------------------------------------------
 * Complete REST API for the Enterprise Order Orchestration Platform.
 * Mounted at /api/v1/orchestrator
 */

import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../db/index.js";
import {
  workflowDefinitions, workflowInstances, workflowSteps,
  workflowEvents, workflowQueue, workflowHistory,
  workflowFailures, workflowCompensation,
} from "../db/repositories/index.js";
import {
  emitEvent, startWorkflow, enqueue, dequeue, retryDeadLetter,
  recoverWorkflow, runOrderFulfillmentSaga, executeSaga,
  transitionOrderState, getValidNextStates,
  DEFAULT_WORKFLOW_DEFINITIONS, ORDER_STATES,
} from "../services/orchestratorEngine.js";

const orchestrator = new Hono();

/* ================================================================== */
/*  WORKFLOW DEFINITIONS                                              */
/* ================================================================== */

orchestrator.get("/definitions", async (c) => {
  const result = await workflowDefinitions.list(c.req.query() as any);
  return c.json(result);
});

orchestrator.get("/definitions/published", async (c) => {
  const result = await workflowDefinitions.getPublished();
  return c.json(result);
});

orchestrator.get("/definitions/:id", async (c) => {
  const item = await workflowDefinitions.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Workflow definition not found" }, 404);
  return c.json(item);
});

orchestrator.post("/definitions", async (c) => {
  const body = await c.req.json<any>();
  const item = await workflowDefinitions.create(body as any, "api");
  return c.json(item, 201);
});

orchestrator.patch("/definitions/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await workflowDefinitions.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Workflow definition not found" }, 404);
  return c.json(updated);
});

orchestrator.delete("/definitions/:id", async (c) => {
  const ok = await workflowDefinitions.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Workflow definition not found" }, 404);
  return c.json({ success: true });
});

orchestrator.post("/definitions/:id/publish", async (c) => {
  const updated = await workflowDefinitions.update(c.req.param("id"), { status: "published", published_at: new Date().toISOString() } as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Workflow definition not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  WORKFLOW INSTANCES                                                */
/* ================================================================== */

orchestrator.get("/instances", async (c) => {
  const query = c.req.query();
  if (query.status) {
    const result = await workflowInstances.getByStatus(query.status);
    return c.json(result);
  }
  if (query.running === "true") {
    const result = await workflowInstances.getRunning();
    return c.json(result);
  }
  const result = await workflowInstances.list(query as any);
  return c.json(result);
});

orchestrator.get("/instances/recent", async (c) => {
  const limit = Number(c.req.query("limit")) || 20;
  const result = await workflowInstances.getRecent(limit);
  return c.json(result);
});

orchestrator.get("/instances/:id", async (c) => {
  const item = await workflowInstances.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Instance not found" }, 404);
  return c.json(item);
});

orchestrator.post("/instances/start", async (c) => {
  const body = await c.req.json<any>();
  try {
    const instance = await startWorkflow(body.workflowId, {
      orderId: body.orderId,
      orderNumber: body.orderNumber,
      payload: body.context,
      correlationId: body.correlationId,
      createdBy: body.createdBy || "api",
    });
    return c.json(instance, 201);
  } catch (err) {
    return c.json({ code: "ERROR", message: err instanceof Error ? err.message : String(err) }, 400);
  }
});

orchestrator.post("/instances/:id/recover", async (c) => {
  const result = await recoverWorkflow(c.req.param("id"));
  if (!result.success) return c.json(result, 400);
  return c.json(result);
});

orchestrator.get("/instances/:id/steps", async (c) => {
  const result = await workflowSteps.getByInstance(c.req.param("id"));
  return c.json(result);
});

orchestrator.get("/instances/:id/events", async (c) => {
  const result = await workflowEvents.getByInstance(c.req.param("id"));
  return c.json(result);
});

/* ================================================================== */
/*  EVENTS                                                             */
/* ================================================================== */

orchestrator.post("/events/emit", async (c) => {
  const body = await c.req.json<any>();
  try {
    const eventId = await emitEvent({
      instanceId: body.instanceId,
      workflowId: body.workflowId,
      orderId: body.orderId,
      eventType: body.eventType as any,
      payload: body.payload || {},
      source: body.source || "api",
      correlationId: body.correlationId,
      causationId: body.causationId,
    });
    return c.json({ id: eventId, success: true }, 201);
  } catch (err) {
    return c.json({ code: "ERROR", message: err instanceof Error ? err.message : String(err) }, 400);
  }
});

orchestrator.get("/events", async (c) => {
  const limit = Number(c.req.query("limit")) || 100;
  const result = await queryAll(
    "SELECT * FROM workflow_events ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return c.json(result);
});

orchestrator.get("/events/:id", async (c) => {
  const result = await queryOne(
    "SELECT * FROM workflow_events WHERE id = $1",
    [c.req.param("id")],
  );
  if (!result) return c.json({ code: "NOT_FOUND", message: "Event not found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  STATE MACHINE                                                     */
/* ================================================================== */

orchestrator.get("/states", async (c) => {
  const states = Object.values(ORDER_STATES);
  return c.json(states.map(s => ({
    state: s,
    validTransitions: getValidNextStates(s as any),
  })));
});

orchestrator.post("/states/transition", async (c) => {
  const body = await c.req.json<any>();
  const result = await transitionOrderState(
    body.orderId,
    body.fromState as any,
    body.toState as any,
    body.actor || "api",
  );
  if (!result.success) return c.json(result, 400);
  return c.json(result);
});

/* ================================================================== */
/*  QUEUES                                                             */
/* ================================================================== */

orchestrator.get("/queues", async (c) => {
  const result = await workflowQueue.getQueueStats();
  return c.json(result);
});

orchestrator.get("/queues/:name/pending", async (c) => {
  const result = await workflowQueue.getPending(c.req.param("name"));
  return c.json(result);
});

orchestrator.get("/queues/dead-letter", async (c) => {
  const result = await workflowQueue.getDeadLetter();
  return c.json(result);
});

orchestrator.post("/queues/enqueue", async (c) => {
  const body = await c.req.json<any>();
  const id = await enqueue({
    queueName: body.queueName,
    instanceId: body.instanceId,
    stepId: body.stepId,
    action: body.action,
    payload: body.payload || {},
    maxRetries: body.maxRetries,
    priority: body.priority,
    timeoutMs: body.timeoutMs,
  });
  return c.json({ id, success: true }, 201);
});

orchestrator.post("/queues/dequeue/:name", async (c) => {
  const result = await dequeue(c.req.param("name"));
  return c.json(result || { empty: true });
});

orchestrator.post("/queues/retry/:id", async (c) => {
  const ok = await retryDeadLetter(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Queue item not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SAGA / FULFILLMENT PIPELINE                                       */
/* ================================================================== */

orchestrator.post("/fulfill/:orderId", async (c) => {
  try {
    const result = await runOrderFulfillmentSaga(
      c.req.param("orderId"),
      c.req.query("orderNumber") || "",
    );
    return c.json(result);
  } catch (err) {
    return c.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});

/* ================================================================== */
/*  FAILURES                                                          */
/* ================================================================== */

orchestrator.get("/failures", async (c) => {
  const result = await workflowFailures.list(c.req.query() as any);
  return c.json(result);
});

orchestrator.get("/failures/unresolved", async (c) => {
  const result = await workflowFailures.getUnresolved();
  return c.json(result);
});

orchestrator.get("/failures/:id", async (c) => {
  const result = await workflowFailures.getById(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Failure not found" }, 404);
  return c.json(result);
});

orchestrator.post("/failures/:id/resolve", async (c) => {
  const result = await workflowFailures.markRecovered(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Failure not found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  COMPENSATIONS                                                     */
/* ================================================================== */

orchestrator.get("/compensations", async (c) => {
  const result = await workflowCompensation.list(c.req.query() as any);
  return c.json(result);
});

orchestrator.get("/compensations/pending", async (c) => {
  const result = await workflowCompensation.getPending();
  return c.json(result);
});

orchestrator.get("/compensations/:id", async (c) => {
  const result = await workflowCompensation.getById(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Compensation not found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  HISTORY                                                            */
/* ================================================================== */

orchestrator.get("/history", async (c) => {
  const limit = Number(c.req.query("limit")) || 50;
  const result = await workflowHistory.getRecent(limit);
  return c.json(result);
});

orchestrator.get("/history/:id", async (c) => {
  const result = await workflowHistory.getById(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "History not found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  DASHBOARD / STATS                                                 */
/* ================================================================== */

orchestrator.get("/stats", async (c) => {
  const instanceStats = await workflowInstances.getStats();
  const queueStats = await workflowQueue.getQueueStats();
  const failureCount = await queryOne(
    "SELECT COUNT(*) as count FROM workflow_failures WHERE recovered = false AND compensated = false",
  );
  const recentInstances = await workflowInstances.getRecent(5);

  return c.json({
    instances: instanceStats,
    queues: queueStats,
    unresolvedFailures: Number(failureCount?.count || 0),
    recentInstances,
  });
});

/* ================================================================== */
/*  SEED DEFAULT WORKFLOWS                                            */
/* ================================================================== */

orchestrator.post("/seed", async (c) => {
  let seeded = 0;
  for (const def of DEFAULT_WORKFLOW_DEFINITIONS) {
    const existing = await queryOne(
      "SELECT id FROM workflow_definitions WHERE name = $1",
      [def.name],
    );
    if (!existing) {
      await workflowDefinitions.create({
        ...def,
        status: "published",
        published_at: new Date().toISOString(),
        steps: JSON.stringify(def.steps),
        trigger_config: JSON.stringify(def.trigger_config),
        tags: JSON.stringify(def.tags),
      } as any, "system");
      seeded++;
    }
  }
  return c.json({ seeded, total: DEFAULT_WORKFLOW_DEFINITIONS.length });
});

export { orchestrator };
