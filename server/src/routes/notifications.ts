/**
 * ALAYA INSIDER — Enterprise Notification Routes (Backend API)
 * --------------------------------------------------------------------------
 * RESTful endpoints for the Notification Engine: send, queue, schedule,
 * templates, campaigns, delivery tracking, analytics, and preferences.
 *
 * Integrates with the existing Integrations Center for provider credentials
 * and the Notification Engine for queue/delivery persistence.
 */

import { Hono } from "hono";
import {
  createNotification, getNotifications, getNotification,
  retryNotification, cancelNotification, updateNotification,
  getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, renderTemplate,
  getDeliveryRecords, getNotifStats, getRecentNotifications,
  moveToDeadLetter, getDeadLetterQueue, retryFromDeadLetter, cleanupOldNotifications,
  trackOpen, trackClick, reportBounce,
  type BackendNotification, type NotifChannel, type NotifCategory, type NotifPriority, type NotifStatus,
} from "../services/notificationEngine.js";

const notifications = new Hono();

/* ================================================================== */
/*  NOTIFICATIONS CRUD                                                 */
/* ================================================================== */

/** Send a new notification */
notifications.post("/notifications", async (c) => {
  const body = await c.req.json<{
    userId?: string; email?: string; phone?: string;
    channels: NotifChannel[]; category: NotifCategory; priority?: NotifPriority;
    subject: string; body: string; htmlBody?: string; templateId?: string;
    metadata?: Record<string, string>; scheduledAt?: number; maxRetries?: number;
  }>();

  if (!body.channels?.length || !body.subject || !body.body) {
    return c.json({ code: "VALIDATION_ERROR", message: "channels, subject, and body are required" }, 400);
  }

  const notif = createNotification({
    userId: body.userId,
    email: body.email,
    phone: body.phone,
    channels: body.channels,
    category: body.category || "system",
    priority: body.priority || "normal",
    subject: body.subject,
    body: body.body,
    htmlBody: body.htmlBody,
    templateId: body.templateId,
    metadata: body.metadata || {},
    scheduledAt: body.scheduledAt,
    maxRetries: body.maxRetries ?? 3,
  });

  return c.json({ success: true, data: notif }, 201);
});

/** List notifications (newest first, with optional status filter) */
notifications.get("/notifications", (c) => {
  const limit = Math.min(100, parseInt(c.req.query("limit") || "50"));
  const status = c.req.query("status") as NotifStatus | undefined;
  const list = getNotifications(limit, status);
  return c.json({ success: true, data: list, total: list.length });
});

/** Get a single notification */
notifications.get("/notifications/:id", (c) => {
  const notif = getNotification(c.req.param("id"));
  if (!notif) return c.json({ code: "NOT_FOUND", message: "Notification not found" }, 404);
  return c.json({ success: true, data: notif });
});

/** Update a notification (e.g. reschedule) */
notifications.patch("/notifications/:id", async (c) => {
  const patch = await c.req.json<Partial<BackendNotification>>();
  const updated = updateNotification(c.req.param("id"), patch);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Notification not found" }, 404);
  return c.json({ success: true, data: updated });
});

/** Retry a failed notification */
notifications.post("/notifications/:id/retry", (c) => {
  const ok = retryNotification(c.req.param("id"));
  if (!ok) return c.json({ code: "FAILED", message: "Cannot retry — notification not found or max retries reached" }, 400);
  const notif = getNotification(c.req.param("id"));
  return c.json({ success: true, data: notif });
});

/** Cancel a queued notification */
notifications.post("/notifications/:id/cancel", (c) => {
  const ok = cancelNotification(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Notification not found" }, 404);
  return c.json({ success: true, message: "Cancelled" });
});

/** Move to dead letter queue */
notifications.post("/notifications/:id/dead-letter", (c) => {
  const ok = moveToDeadLetter(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Notification not found" }, 404);
  return c.json({ success: true, message: "Moved to dead letter queue" });
});

/* ================================================================== */
/*  DEAD LETTER QUEUE                                                  */
/* ================================================================== */

notifications.get("/notifications/dead-letter", (c) => {
  const queue = getDeadLetterQueue();
  return c.json({ success: true, data: queue, total: queue.length });
});

notifications.post("/notifications/dead-letter/:id/retry", (c) => {
  const ok = retryFromDeadLetter(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Notification not found in dead letter queue" }, 404);
  return c.json({ success: true, message: "Moved back to notification queue" });
});

/* ================================================================== */
/*  DELIVERY TRACKING                                                  */
/* ================================================================== */

/** Get delivery records for a notification */
notifications.get("/notifications/:id/delivery", (c) => {
  const records = getDeliveryRecords(c.req.param("id"));
  return c.json({ success: true, data: records });
});

/** Webhook: track open (email tracking pixel) */
notifications.post("/notifications/track/open", async (c) => {
  const { trackingId } = await c.req.json<{ trackingId: string }>();
  if (!trackingId) return c.json({ code: "VALIDATION_ERROR", message: "trackingId required" }, 400);
  trackOpen(trackingId);
  // Return 1x1 transparent pixel for email tracking
  c.header("Content-Type", "image/gif");
  return c.body(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
});

/** Webhook: track click */
notifications.post("/notifications/track/click", async (c) => {
  const { trackingId, url } = await c.req.json<{ trackingId: string; url: string }>();
  if (!trackingId || !url) return c.json({ code: "VALIDATION_ERROR", message: "trackingId and url required" }, 400);
  const ok = trackClick(trackingId, url);
  return c.json({ success: ok });
});

/** Webhook: report bounce */
notifications.post("/notifications/track/bounce", async (c) => {
  const { trackingId, reason } = await c.req.json<{ trackingId: string; reason: string }>();
  if (!trackingId || !reason) return c.json({ code: "VALIDATION_ERROR", message: "trackingId and reason required" }, 400);
  const ok = reportBounce(trackingId, reason);
  return c.json({ success: ok });
});

/* ================================================================== */
/*  STATISTICS                                                         */
/* ================================================================== */

notifications.get("/notifications/stats", (c) => {
  const stats = getNotifStats();
  return c.json({ success: true, data: stats });
});

notifications.get("/notifications/recent", (c) => {
  const limit = Math.min(50, parseInt(c.req.query("limit") || "10"));
  const recent = getRecentNotifications(limit);
  return c.json({ success: true, data: recent });
});

/* ================================================================== */
/*  ADMIN — Cleanup                                                    */
/* ================================================================== */

notifications.post("/notifications/cleanup", async (c) => {
  let olderThanDays: number | undefined;
  try {
    const body = await c.req.json<{ olderThanDays?: number }>();
    olderThanDays = body.olderThanDays;
  } catch { /* no body */ }
  const removed = cleanupOldNotifications(olderThanDays || 90);
  return c.json({ success: true, message: `Cleaned up ${removed} old notifications` });
});

/* ================================================================== */
/*  TEMPLATES                                                          */
/* ================================================================== */

notifications.get("/notifications/templates", (c) => {
  return c.json({ success: true, data: getTemplates() });
});

notifications.get("/notifications/templates/:id", (c) => {
  const tpl = getTemplate(c.req.param("id"));
  if (!tpl) return c.json({ code: "NOT_FOUND", message: "Template not found" }, 404);
  return c.json({ success: true, data: tpl });
});

notifications.post("/notifications/templates", async (c) => {
  const body = await c.req.json<Omit<Parameters<typeof createTemplate>[0], "id" | "usageCount" | "createdAt" | "updatedAt">>();
  if (!body.name || !body.subject || !body.body) {
    return c.json({ code: "VALIDATION_ERROR", message: "name, subject, and body are required" }, 400);
  }
  const tpl = createTemplate({
    name: body.name,
    category: body.category || "transactional",
    channels: body.channels || ["email"],
    subject: body.subject,
    body: body.body,
    htmlBody: body.htmlBody,
    variables: body.variables || [],
    version: body.version || "1.0",
    status: body.status || "draft",
  });
  return c.json({ success: true, data: tpl }, 201);
});

notifications.put("/notifications/templates/:id", async (c) => {
  const patch = await c.req.json<Partial<Parameters<typeof updateTemplate>[1]>>();
  const updated = updateTemplate(c.req.param("id"), patch);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Template not found" }, 404);
  return c.json({ success: true, data: updated });
});

notifications.delete("/notifications/templates/:id", (c) => {
  const ok = deleteTemplate(c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Template not found" }, 404);
  return c.json({ success: true, message: "Deleted" });
});

notifications.post("/notifications/templates/:id/render", async (c) => {
  const { variables } = await c.req.json<{ variables: Record<string, string> }>();
  const rendered = renderTemplate(c.req.param("id"), variables || {});
  if (!rendered) return c.json({ code: "NOT_FOUND", message: "Template not found" }, 404);
  return c.json({ success: true, data: rendered });
});

export { notifications };
