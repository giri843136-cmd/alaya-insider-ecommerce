/**
 * ALAYA INSIDER — Automated Notification Triggers
 * --------------------------------------------------------------------------
 * Listens for events across the platform (auth, workflows, AI, affiliates,
 * system) and dispatches notifications through the Notification Engine.
 *
 * Each trigger maps an event type to a template + channel routing.
 * This service is called by other services when significant events occur.
 */

import { createNotification, getTemplates, getTemplate, renderTemplate } from "./notificationEngine.js";
import type { NotifChannel, NotifCategory } from "./notificationEngine.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type TriggerEvent =
  // Auth events
  | "auth:password_changed"
  | "auth:login_success"
  | "auth:login_failed"
  | "auth:new_device"
  | "auth:suspicious_login"
  | "auth:impossible_travel"
  | "auth:recovery_used"
  | "auth:account_locked"
  | "auth:otp_sent"
  | "auth:mfa_disabled"
  // System events
  | "system:backup_completed"
  | "system:backup_failed"
  | "system:integration_disconnected"
  | "system:storage_warning"
  | "system:performance_warning"
  | "system:security_warning"
  // Workflow events
  | "workflow:started"
  | "workflow:completed"
  | "workflow:failed"
  // AI events
  | "ai:generation_complete"
  | "ai:generation_failed"
  | "ai:approval_required"
  // Affiliate events
  | "affiliate:commission_earned"
  | "affiliate:broken_links"
  | "affiliate:marketplace_issue"
  // Content events
  | "content:article_published"
  | "content:review_published"
  | "content:guide_published"
  // Customer events
  | "customer:welcome"
  | "customer:price_drop"
  | "customer:back_in_stock"
  | "customer:recommendation"
  // Integration events
  | "integration:connection_success"
  | "integration:connection_failed"
  | "integration:error"
  // Security events
  | "security:warning"
  | "security:incident";

export interface TriggerPayload {
  event: TriggerEvent;
  userId?: string;
  email?: string;
  phone?: string;
  metadata: Record<string, string>;
}

/* ================================================================== */
/*  EVENT → TEMPLATE MAPPING                                          */
/* ================================================================== */

interface TriggerConfig {
  templateName: string;
  channels: NotifChannel[];
  category: NotifCategory;
  priority: "critical" | "high" | "normal" | "low";
}

const TRIGGER_MAP: Record<string, TriggerConfig> = {
  "auth:password_changed":    { templateName: "Password Changed",    channels: ["email"],       category: "security",    priority: "high" },
  "auth:login_success":       { templateName: "New Login Alert",     channels: ["email"],       category: "security",    priority: "normal" },
  "auth:login_failed":        { templateName: "Failed Login Attempt", channels: ["email"],      category: "security",    priority: "high" },
  "auth:new_device":          { templateName: "New Login Alert",     channels: ["email"],       category: "security",    priority: "high" },
  "auth:suspicious_login":    { templateName: "Security Warning",    channels: ["email", "sms"], category: "security",    priority: "critical" },
  "auth:impossible_travel":   { templateName: "Security Warning",    channels: ["email", "sms"], category: "security",    priority: "critical" },
  "auth:recovery_used":       { templateName: "Recovery Code Used",  channels: ["email"],       category: "security",    priority: "high" },
  "auth:account_locked":      { templateName: "Security Warning",    channels: ["email"],       category: "security",    priority: "high" },
  "auth:otp_sent":            { templateName: "OTP Sent",            channels: ["email"],       category: "auth",        priority: "normal" },
  "auth:mfa_disabled":        { templateName: "Security Warning",    channels: ["email"],       category: "security",    priority: "critical" },
  "system:backup_completed":  { templateName: "",                    channels: ["email"],       category: "system",      priority: "normal" },
  "system:backup_failed":     { templateName: "Backup Failed",       channels: ["email"],       category: "system",      priority: "high" },
  "system:integration_disconnected": { templateName: "Integration Disconnected", channels: ["email"], category: "system", priority: "high" },
  "system:storage_warning":   { templateName: "",                    channels: ["email"],       category: "system",      priority: "normal" },
  "system:performance_warning": { templateName: "",                  channels: ["email"],       category: "system",      priority: "normal" },
  "system:security_warning":  { templateName: "Security Warning",    channels: ["email", "sms"], category: "security",    priority: "critical" },
  "workflow:started":         { templateName: "",                    channels: ["email"],       category: "workflow",    priority: "normal" },
  "workflow:completed":       { templateName: "",                    channels: ["email"],       category: "workflow",    priority: "normal" },
  "workflow:failed":          { templateName: "Workflow Failed",     channels: ["email"],       category: "workflow",    priority: "high" },
  "ai:generation_complete":   { templateName: "",                    channels: ["email"],       category: "ai",          priority: "normal" },
  "ai:generation_failed":     { templateName: "",                    channels: ["email"],       category: "ai",          priority: "normal" },
  "ai:approval_required":     { templateName: "",                    channels: ["email"],       category: "ai",          priority: "high" },
  "affiliate:commission_earned": { templateName: "Commission Earned", channels: ["email"],       category: "affiliate",   priority: "normal" },
  "affiliate:broken_links":   { templateName: "",                    channels: ["email"],       category: "affiliate",   priority: "normal" },
  "affiliate:marketplace_issue": { templateName: "",                channels: ["email"],       category: "affiliate",   priority: "high" },
  "content:article_published": { templateName: "Article Published",  channels: ["email"],       category: "customer",    priority: "normal" },
  "content:review_published": { templateName: "Review Published",    channels: ["email"],       category: "customer",    priority: "normal" },
  "content:guide_published":  { templateName: "",                    channels: ["email"],       category: "customer",    priority: "normal" },
  "customer:welcome":         { templateName: "Welcome Email",      channels: ["email"],       category: "customer",    priority: "normal" },
  "customer:price_drop":      { templateName: "Price Drop Alert",    channels: ["email", "push"], category: "customer",  priority: "normal" },
  "customer:back_in_stock":   { templateName: "Back in Stock",       channels: ["email", "push"], category: "customer",  priority: "normal" },
  "customer:recommendation":  { templateName: "",                    channels: ["email"],       category: "customer",    priority: "low" },
  "integration:connection_success":  { templateName: "",                channels: ["email"],       category: "system",      priority: "normal" },
  "integration:connection_failed":   { templateName: "Integration Failed", channels: ["email"],     category: "system",      priority: "high" },
  "integration:error":               { templateName: "",                channels: ["email"],       category: "system",      priority: "high" },
  "security:warning":         { templateName: "Security Warning",    channels: ["email", "sms"], category: "security",    priority: "critical" },
  "security:incident":        { templateName: "Security Warning",    channels: ["email", "sms"], category: "security",    priority: "critical" },
};

/* ================================================================== */
/*  PUBLIC API                                                         */
/* ================================================================== */

/**
 * Fire a notification trigger event.
 * This is called by other services (auth, workflows, AI, etc.) when
 * significant events occur. The trigger system looks up the appropriate
 * template, renders it with the provided metadata, and queues a notification.
 *
 * @example
 *   import { fireTrigger } from "./services/notificationTriggers.js";
 *   await fireTrigger({
 *     event: "auth:password_changed",
 *     email: "user@example.com",
 *     metadata: { name: "Alice" },
 *   });
 */
export async function fireTrigger(payload: TriggerPayload): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const config = TRIGGER_MAP[payload.event];
  if (!config) {
    return { success: false, error: `No trigger configured for event: ${payload.event}` };
  }

  // If there's no template name, generate a default subject/body from the event
  let subject = `Notification: ${payload.event}`;
  let body = `Event: ${payload.event}\n\n${Object.entries(payload.metadata).map(([k, v]) => `${k}: ${v}`).join("\n")}`;

  // Try to find and render a template
  if (config.templateName) {
    const templates = getTemplates();
    const tpl = templates.find((t) => t.name === config.templateName);
    if (tpl) {
      const rendered = renderTemplate(tpl.id, payload.metadata);
      if (rendered) {
        subject = rendered.subject;
        body = rendered.body;
      }
    }
  }

  // Create and queue the notification
  const notif = createNotification({
    userId: payload.userId,
    email: payload.email,
    phone: payload.phone,
    channels: config.channels,
    category: config.category,
    priority: config.priority,
    subject,
    body,
    metadata: payload.metadata,
    maxRetries: 3,
  });

  return { success: true, notificationId: notif.id };
}

/**
 * Get all available trigger events with their config.
 */
export function getTriggerConfigs(): Record<string, TriggerConfig> {
  return { ...TRIGGER_MAP };
}
