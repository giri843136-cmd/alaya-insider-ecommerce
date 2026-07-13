/**
 * ALAYA INSIDER — Enterprise Notification Engine (Backend)
 * --------------------------------------------------------------------------
 * Server-side notification queue, delivery tracking, template rendering,
 * and provider routing. Integrates with the existing Integrations Center
 * for provider credentials (FCM, OneSignal, Pusher, SMTP, etc.).
 *
 * Persists notification data in the main store so it survives restarts.
 */

import { getStore, persistStore, genId } from "../db.js";
import { sendEmail } from "./email.js";
import { sendOtpSms } from "./sms.js";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const MAX_QUEUE_SIZE = 1000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const DEAD_LETTER_MAX = 200;

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type NotifChannel = "email" | "sms" | "push" | "in_app" | "webhook";
export type NotifPriority = "critical" | "high" | "normal" | "low";
export type NotifStatus = "queued" | "sending" | "sent" | "delivered" | "failed" | "bounced" | "cancelled";
export type NotifCategory =
  | "transactional" | "marketing" | "system" | "security" | "workflow"
  | "affiliate" | "supplier" | "customer" | "admin" | "ai" | "auth";

export interface BackendNotification {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  channels: NotifChannel[];
  category: NotifCategory;
  priority: NotifPriority;
  status: NotifStatus;
  subject: string;
  body: string;
  htmlBody?: string;
  templateId?: string;
  metadata: Record<string, string>;
  scheduledAt?: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  failedAt?: number;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  trackingId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BackendTemplate {
  id: string;
  name: string;
  category: NotifCategory;
  channels: NotifChannel[];
  subject: string;
  body: string;
  htmlBody?: string;
  variables: string[];
  version: string;
  status: "active" | "draft" | "archived";
  usageCount: number;
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotifChannel;
  provider: string;
  status: NotifStatus;
  messageId?: string;
  opened: boolean;
  openedAt?: number;
  clicked: boolean;
  clickedUrls: string[];
  bounced: boolean;
  bounceReason?: string;
  complained: boolean;
  complainedAt?: number;
  error?: string;
  latencyMs?: number;
  ts: number;
}

export interface NotifStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  totalOpened: number;
  totalClicked: number;
  byChannel: Record<string, { sent: number; delivered: number; failed: number }>;
  byCategory: Record<string, number>;
  byHour: Record<string, number>;
}

/* ================================================================== */
/*  INTERNAL STORAGE KEY                                               */
/* ================================================================== */

const NOTIF_KEY = "_notifications" as const;

interface NotificationStore {
  notifications: BackendNotification[];
  templates: BackendTemplate[];
  deliveryRecords: DeliveryRecord[];
  deadLetterQueue: BackendNotification[];
}

function getNotifStore(): NotificationStore {
  const s = getStore() as any;
  if (!s[NOTIF_KEY]) {
    s[NOTIF_KEY] = { notifications: [], templates: [], deliveryRecords: [], deadLetterQueue: [] };
  }
  return s[NOTIF_KEY];
}

function save() {
  persistStore(getStore());
}

/* ================================================================== */
/*  SEED DEFAULT TEMPLATES                                             */
/* ================================================================== */

function seedTemplates() {
  const store = getNotifStore();
  if (store.templates.length > 0) return;
  const now = Date.now();
  store.templates.push(
    { id: genId("tpl"), name: "Welcome Email", category: "customer", channels: ["email"], subject: "Welcome to ALAYA INSIDER, {{name}}!", body: "Hi {{name}},\n\nWelcome to ALAYA INSIDER! We're thrilled to have you.\n\nStart shopping: {{shop_url}}\n\nBest,\nThe ALAYA Team", htmlBody: "<h1>Welcome!</h1><p>Hi {{name}},</p><p>Welcome to ALAYA INSIDER!</p>", variables: ["name", "shop_url"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Order Confirmation", category: "transactional", channels: ["email"], subject: "Order #{{order_number}} Confirmed", body: "Hi {{name}},\n\nYour order #{{order_number}} has been confirmed.\n\nTotal: {{total}}\n\nTrack: {{track_url}}", variables: ["name", "order_number", "total", "track_url"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Password Changed", category: "security", channels: ["email"], subject: "Your Password Has Been Changed", body: "Hi {{name}},\n\nYour account password was changed successfully.\n\nIf you didn't make this change, please contact support immediately.", variables: ["name"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "New Login Alert", category: "security", channels: ["email"], subject: "New Login to Your Account", body: "Hi {{name}},\n\nA new login was detected on your account.\n\nDevice: {{device}}\nLocation: {{location}}\nTime: {{time}}\n\nIf this was you, no action needed.", variables: ["name", "device", "location", "time"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Failed Login Attempt", category: "security", channels: ["email"], subject: "Failed Login Attempt Detected", body: "Hi {{name}},\n\nThere was a failed login attempt on your account.\n\nIf this wasn't you, please secure your account.", variables: ["name"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Recovery Code Used", category: "security", channels: ["email"], subject: "Recovery Code Used — Account Access", body: "Hi {{name}},\n\nA recovery code was used to access your account.\n\nIf this wasn't you, contact support immediately.", variables: ["name"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "OTP Sent", category: "auth", channels: ["email"], subject: "Your Verification Code", body: "Your verification code is: {{otp_code}}\n\nThis code expires in 5 minutes.", variables: ["otp_code"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Price Drop Alert", category: "customer", channels: ["email", "push"], subject: "Price Drop: {{product_name}}", body: "Great news! {{product_name}} has dropped in price.\n\nWas: {{old_price}}\nNow: {{new_price}}\n\nShop now: {{product_url}}", variables: ["product_name", "old_price", "new_price", "product_url"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Back in Stock", category: "customer", channels: ["email", "push"], subject: "{{product_name}} is Back in Stock!", body: "Hi {{name}},\n\n{{product_name}} is back in stock. Grab it before it sells out again!", variables: ["name", "product_name", "product_url"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Workflow Failed", category: "workflow", channels: ["email"], subject: "Workflow Failed: {{workflow_name}}", body: "Workflow {{workflow_name}} failed during execution.\n\nError: {{error}}\n\nView details: {{workflow_url}}", variables: ["workflow_name", "error", "workflow_url"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Integration Disconnected", category: "system", channels: ["email"], subject: "Integration Disconnected: {{provider_name}}", body: "The {{provider_name}} integration has been disconnected.\n\nLast successful connection: {{last_success}}\n\nPlease reconfigure in Integrations Center.", variables: ["provider_name", "last_success"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Backup Failed", category: "system", channels: ["email"], subject: "Backup Failed — {{environment}}", body: "System backup for {{environment}} failed.\n\nError: {{error}}\n\nPlease investigate and retry.", variables: ["environment", "error"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Commission Earned", category: "affiliate", channels: ["email"], subject: "New Commission Earned!", body: "Hi {{name}},\n\nYou earned a commission of {{amount}} from a referral sale.\n\nKeep sharing your affiliate link!", variables: ["name", "amount"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Article Published", category: "customer", channels: ["email"], subject: "New Article: {{article_title}}", body: "Hi {{name}},\n\nWe just published: {{article_title}}\n\nRead the full story: {{article_url}}", variables: ["name", "article_title", "article_url"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Review Published", category: "customer", channels: ["email"], subject: "Your Review is Live!", body: "Hi {{name}},\n\nYour review for {{product_name}} is now live.\n\nThank you for sharing your feedback!", variables: ["name", "product_name"], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    { id: genId("tpl"), name: "Security Warning", category: "security", channels: ["email", "sms"], subject: "Security Warning — Suspicious Activity", body: "Suspicious activity detected on your account.\n\nPlease review your recent login activity and secure your account if needed.", variables: [], version: "1.0", status: "active", usageCount: 0, createdAt: now, updatedAt: now },
  );
  save();
}
seedTemplates();

/* ================================================================== */
/*  TEMPLATE ENGINE                                                    */
/* ================================================================== */

export function getTemplates(): BackendTemplate[] {
  return getNotifStore().templates;
}

export function getTemplate(id: string): BackendTemplate | undefined {
  return getNotifStore().templates.find((t) => t.id === id);
}

export function createTemplate(
  input: Omit<BackendTemplate, "id" | "usageCount" | "createdAt" | "updatedAt">,
): BackendTemplate {
  const store = getNotifStore();
  const tpl: BackendTemplate = {
    ...input,
    id: genId("tpl"),
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.templates.push(tpl);
  save();
  return tpl;
}

export function updateTemplate(id: string, patch: Partial<BackendTemplate>): BackendTemplate | null {
  const store = getNotifStore();
  const idx = store.templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.templates[idx] = { ...store.templates[idx], ...patch, updatedAt: Date.now() };
  save();
  return store.templates[idx];
}

export function deleteTemplate(id: string): boolean {
  const store = getNotifStore();
  store.templates = store.templates.filter((t) => t.id !== id);
  save();
  return true;
}

export function renderTemplate(
  templateId: string,
  variables: Record<string, string>,
): { subject: string; body: string; htmlBody?: string } | null {
  const tpl = getTemplate(templateId);
  if (!tpl) return null;
  let subject = tpl.subject;
  let body = tpl.body;
  let htmlBody = tpl.htmlBody;
  for (const [key, val] of Object.entries(variables)) {
    const re = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(re, val);
    body = body.replace(re, val);
    if (htmlBody) htmlBody = htmlBody.replace(re, val);
  }
  return { subject, body, htmlBody };
}

/* ================================================================== */
/*  NOTIFICATION CRUD                                                  */
/* ================================================================== */

export function createNotification(
  input: Omit<BackendNotification, "id" | "status" | "retryCount" | "createdAt" | "updatedAt">,
): BackendNotification {
  const store = getNotifStore();
  const notif: BackendNotification = {
    ...input,
    id: genId("notif"),
    status: "queued",
    retryCount: 0,
    maxRetries: input.maxRetries || MAX_RETRIES,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.notifications.push(notif);
  if (store.notifications.length > MAX_QUEUE_SIZE) {
    store.notifications = store.notifications.slice(-MAX_QUEUE_SIZE);
  }
  save();
  // Attempt delivery asynchronously
  processNotification(notif).catch(() => {});
  return notif;
}

export function getNotifications(limit = 50, status?: NotifStatus): BackendNotification[] {
  const store = getNotifStore();
  let list = [...store.notifications].reverse();
  if (status) list = list.filter((n) => n.status === status);
  return list.slice(0, limit);
}

export function getNotification(id: string): BackendNotification | undefined {
  return getNotifStore().notifications.find((n) => n.id === id);
}

export function updateNotification(id: string, patch: Partial<BackendNotification>): BackendNotification | null {
  const store = getNotifStore();
  const idx = store.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  store.notifications[idx] = { ...store.notifications[idx], ...patch, updatedAt: Date.now() };
  save();
  return store.notifications[idx];
}

export function retryNotification(id: string): boolean {
  const store = getNotifStore();
  const idx = store.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  const notif = store.notifications[idx];
  if (notif.retryCount >= notif.maxRetries) return false;
  store.notifications[idx] = {
    ...notif,
    status: "queued",
    retryCount: notif.retryCount + 1,
    failureReason: undefined,
    failedAt: undefined,
    updatedAt: Date.now(),
  };
  save();
  processNotification(store.notifications[idx]).catch(() => {});
  return true;
}

export function cancelNotification(id: string): boolean {
  const store = getNotifStore();
  const idx = store.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  store.notifications[idx] = { ...store.notifications[idx], status: "cancelled", updatedAt: Date.now() };
  save();
  return true;
}

/* ================================================================== */
/*  DELIVERY PROCESSING                                                */
/* ================================================================== */

async function processNotification(notif: BackendNotification): Promise<void> {
  // Update to sending
  updateNotification(notif.id, { status: "sending" });

  for (const channel of notif.channels) {
    try {
      const result = await deliverViaChannel(notif, channel);
      recordDelivery(notif.id, channel, result);
      if (!result.success) {
        throw new Error(result.error || `Delivery failed via ${channel}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Unknown delivery error";
      recordDelivery(notif.id, channel, { success: false, error: errorMsg });

      if (notif.retryCount < notif.maxRetries) {
        // Schedule retry with exponential backoff
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, notif.retryCount);
        setTimeout(() => {
          retryNotification(notif.id);
        }, delay);
        return; // Don't mark as failed yet — retry will handle it
      }
    }
  }

  // All channels processed — mark as sent
  const store = getNotifStore();
  const idx = store.notifications.findIndex((n) => n.id === notif.id);
  if (idx !== -1) {
    store.notifications[idx].status = "sent";
    store.notifications[idx].sentAt = Date.now();
    store.notifications[idx].updatedAt = Date.now();
  }
  save();
}

interface DeliveryResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  latencyMs?: number;
  error?: string;
}

async function deliverViaChannel(
  notif: BackendNotification,
  channel: NotifChannel,
): Promise<DeliveryResult> {
  const start = Date.now();

  switch (channel) {
    case "email": {
      if (!notif.email) return { success: false, error: "No email address" };
      const emailResult = await sendEmail(
        notif.email,
        notif.subject,
        notif.htmlBody || notif.body,
        undefined,
      );
      return {
        success: emailResult.success,
        provider: "bird",
        messageId: emailResult.messageId,
        latencyMs: Date.now() - start,
        error: emailResult.error,
      };
    }

    case "sms": {
      if (!notif.phone) return { success: false, error: "No phone number" };
      // Max 160 chars for SMS
      const smsBody = notif.body.length > 160 ? notif.body.slice(0, 157) + "..." : notif.body;
      const smsResult = await sendOtpSms(notif.phone, smsBody, "ALAYA");
      return {
        success: smsResult.success,
        provider: "twilio",
        messageId: smsResult.messageId,
        latencyMs: Date.now() - start,
        error: smsResult.error,
      };
    }

    case "push":
      // Push is handled by the server/src/services/notifications.ts service
      // which reads from the Integrations Center. We log the intent.
      return {
        success: true,
        provider: "push_queue",
        latencyMs: Date.now() - start,
      };

    case "in_app":
      // In-app notifications are stored for the client to poll
      return {
        success: true,
        provider: "in_app_store",
        latencyMs: Date.now() - start,
      };

    default:
      return { success: false, error: `Unsupported channel: ${channel}` };
  }
}

/* ================================================================== */
/*  DELIVERY TRACKING                                                  */
/* ================================================================== */

function recordDelivery(
  notificationId: string,
  channel: NotifChannel,
  result: DeliveryResult,
): DeliveryRecord {
  const store = getNotifStore();
  const record: DeliveryRecord = {
    id: genId("del"),
    notificationId,
    channel,
    provider: result.provider || channel,
    status: result.success ? "delivered" : "failed",
    messageId: result.messageId,
    opened: false,
    clicked: false,
    clickedUrls: [],
    bounced: false,
    complained: false,
    complainedAt: undefined,
    error: result.error,
    latencyMs: result.latencyMs,
    ts: Date.now(),
  };
  store.deliveryRecords.push(record);
  if (store.deliveryRecords.length > 5000) {
    store.deliveryRecords = store.deliveryRecords.slice(-5000);
  }
  save();
  return record;
}

export function getDeliveryRecords(notificationId?: string): DeliveryRecord[] {
  const store = getNotifStore();
  let records = [...store.deliveryRecords].reverse();
  if (notificationId) records = records.filter((r) => r.notificationId === notificationId);
  return records;
}

export function trackOpen(trackingId: string): boolean {
  const store = getNotifStore();
  const record = store.deliveryRecords.find((r) => r.messageId === trackingId);
  if (!record) return false;
  record.opened = true;
  record.openedAt = Date.now();
  save();
  return true;
}

export function trackClick(trackingId: string, url: string): boolean {
  const store = getNotifStore();
  const record = store.deliveryRecords.find((r) => r.messageId === trackingId);
  if (!record) return false;
  record.clicked = true;
  record.clickedUrls.push(url);
  save();
  return true;
}

export function reportBounce(trackingId: string, reason: string): boolean {
  const store = getNotifStore();
  const record = store.deliveryRecords.find((r) => r.messageId === trackingId);
  if (!record) return false;
  record.bounced = true;
  record.bounceReason = reason;
  // Also update the parent notification
  const notif = store.notifications.find((n) => n.id === record.notificationId);
  if (notif) {
    notif.status = "bounced";
    notif.updatedAt = Date.now();
  }
  save();
  return true;
}

/* ================================================================== */
/*  STATISTICS                                                         */
/* ================================================================== */

export function getNotifStats(): NotifStats {
  const store = getNotifStore();
  const notifs = store.notifications;

  const totalSent = notifs.length;
  const totalDelivered = notifs.filter((n) => n.status === "delivered" || n.status === "sent").length;
  const totalFailed = notifs.filter((n) => n.status === "failed").length;
  const totalBounced = notifs.filter((n) => n.status === "bounced").length;
  const totalOpened = store.deliveryRecords.filter((r) => r.opened).length;
  const totalClicked = store.deliveryRecords.filter((r) => r.clicked).length;

  const byChannel: Record<string, { sent: number; delivered: number; failed: number }> = {};
  const channelList: NotifChannel[] = ["email", "sms", "push", "in_app", "webhook"];
  for (const ch of channelList) {
    const chNotifs = notifs.filter((n) => n.channels.includes(ch));
    byChannel[ch] = {
      sent: chNotifs.length,
      delivered: chNotifs.filter((n) => n.status === "delivered" || n.status === "sent").length,
      failed: chNotifs.filter((n) => n.status === "failed").length,
    };
  }

  const byCategory: Record<string, number> = {};
  notifs.forEach((n) => { byCategory[n.category] = (byCategory[n.category] || 0) + 1; });

  const byHour: Record<string, number> = {};
  notifs.forEach((n) => {
    const hour = new Date(n.createdAt).getHours().toString();
    byHour[hour] = (byHour[hour] || 0) + 1;
  });

  return {
    totalSent,
    totalDelivered,
    totalFailed,
    totalBounced,
    totalOpened,
    totalClicked,
    byChannel,
    byCategory,
    byHour,
  };
}

/* ================================================================== */
/*  DEAD LETTER QUEUE                                                  */
/* ================================================================== */

export function moveToDeadLetter(notifId: string): boolean {
  const store = getNotifStore();
  const idx = store.notifications.findIndex((n) => n.id === notifId);
  if (idx === -1) return false;
  const notif = store.notifications[idx];
  notif.status = "failed";
  notif.failureReason = "Moved to dead letter queue after exhausting retries";
  notif.updatedAt = Date.now();
  store.deadLetterQueue.push(notif);
  if (store.deadLetterQueue.length > DEAD_LETTER_MAX) {
    store.deadLetterQueue = store.deadLetterQueue.slice(-DEAD_LETTER_MAX);
  }
  save();
  return true;
}

export function getDeadLetterQueue(): BackendNotification[] {
  return [...getNotifStore().deadLetterQueue].reverse();
}

export function retryFromDeadLetter(id: string): boolean {
  const store = getNotifStore();
  const idx = store.deadLetterQueue.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  const notif = store.deadLetterQueue[idx];
  store.deadLetterQueue.splice(idx, 1);
  notif.status = "queued";
  notif.retryCount = 0;
  notif.failureReason = undefined;
  notif.failedAt = undefined;
  notif.updatedAt = Date.now();
  store.notifications.push(notif);
  save();
  processNotification(notif).catch(() => {});
  return true;
}

/* ================================================================== */
/*  CLEANUP                                                            */
/* ================================================================== */

export function cleanupOldNotifications(olderThanDays = 90): number {
  const store = getNotifStore();
  const cutoff = Date.now() - olderThanDays * 86400000;
  const before = store.notifications.length;
  store.notifications = store.notifications.filter((n) => n.createdAt > cutoff);
  store.deliveryRecords = store.deliveryRecords.filter((r) => r.ts > cutoff);
  const removed = before - store.notifications.length;
  if (removed > 0) save();
  return removed;
}

/* ================================================================== */
/*  RECENT NOTIFICATIONS (for admin dashboard)                         */
/* ================================================================== */

export function getRecentNotifications(limit = 10): BackendNotification[] {
  return getNotifStore().notifications.slice(-limit).reverse();
}
