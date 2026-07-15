/**
 * ALAYA INSIDER — Enterprise Communication Platform
 * ------------------------------------------------------------------
 * Centralized communication engine powering all messaging: email, SMS,
 * push, in-app, real-time, announcements, webhook notifications, and
 * external channel integrations (Slack, Discord, Teams, etc.).
 *
 * Every email, notification, alert, system event, AI event, workflow
 * message, affiliate/supplier/customer communication flows through here.
 */
import { uid } from "./utils";
import { pushLog } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const COMMS_STORAGE_KEY = "alaya_communications_store";
export const MAX_QUEUE_SIZE = 500;
export const MAX_INBOX_SIZE = 1000;

/* ================================================================== */
/*  ENUMS & TYPES — Channels                                           */
/* ================================================================== */

export type CommsChannel =
  | "email" | "sms" | "push" | "in_app" | "webhook"
  | "slack" | "discord" | "teams" | "telegram" | "whatsapp";

export type MessagePriority = "critical" | "high" | "normal" | "low";
export type MessageStatus = "draft" | "queued" | "sending" | "sent" | "delivered" | "failed" | "bounced" | "cancelled";
export type NotificationCategory =
  | "transactional" | "marketing" | "system" | "security" | "workflow"
  | "affiliate" | "supplier" | "customer" | "admin" | "ai" | "event";

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export interface Notification {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  channels: CommsChannel[];
  category: NotificationCategory;
  priority: MessagePriority;
  status: MessageStatus;
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

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  channels: CommsChannel[];
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

export interface Campaign {
  id: string;
  name: string;
  description: string;
  channels: CommsChannel[];
  category: NotificationCategory;
  templateId?: string;
  targetAudience: string;
  scheduleType: "immediate" | "scheduled" | "drip";
  scheduledAt?: number;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  complainedCount: number;
  unsubscribedCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface DripSequence {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: DripStep[];
  enabled: boolean;
  subscriberCount: number;
  createdAt: number;
}

export interface DripStep {
  id: string;
  delayDays: number;
  subject: string;
  body: string;
  templateId?: string;
}

/* ================================================================== */
/*  TYPES — Email                                                      */
/* ================================================================== */

export type EmailProvider = "smtp" | "amazon_ses" | "mailgun" | "sendgrid" | "postmark" | "resend";

export interface EmailProviderConfig {
  id: string;
  provider: EmailProvider;
  label: string;
  configured: boolean;
  dailyLimit: number;
  dailyUsed: number;
  priority: number;
  active: boolean;
  config: Record<string, string>;
}

export interface EmailTracking {
  id: string;
  notificationId: string;
  email: string;
  opens: number;
  openTimestamps: number[];
  clicks: number;
  clickUrls: string[];
  clickTimestamps: number[];
  bounced: boolean;
  bounceReason?: string;
  complained: boolean;
  complaintType?: string;
  unsubscribed: boolean;
  unsubscribedAt?: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  preheader?: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  version: string;
  status: "active" | "draft" | "archived";
}

/* ================================================================== */
/*  TYPES — SMS & Push                                                 */
/* ================================================================== */

export interface SmsMessage {
  id: string;
  notificationId: string;
  phone: string;
  body: string;
  status: MessageStatus;
  provider: string;
  segments: number;
  cost?: number;
  sentAt?: number;
  deliveredAt?: number;
  failedAt?: number;
  failureReason?: string;
}

export interface PushNotification {
  id: string;
  notificationId: string;
  userId?: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  data: Record<string, string>;
  actions: PushAction[];
  status: MessageStatus;
  scheduledAt?: number;
  sentAt?: number;
  clickedAt?: number;
  dismissedAt?: number;
}

export interface PushAction {
  id: string;
  label: string;
  action: string;
  url?: string;
}

/* ================================================================== */
/*  TYPES — In-App Notification                                        */
/* ================================================================== */

export type InAppType = "toast" | "banner" | "persistent" | "modal" | "badge";
export type InAppPriority = "urgent" | "high" | "normal" | "low";

export interface InAppNotification {
  id: string;
  notificationId: string;
  userId: string;
  type: InAppType;
  priority: InAppPriority;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  imageUrl?: string;
  persistent: boolean;
  read: boolean;
  dismissed: boolean;
  expiresAt?: number;
  createdAt: number;
  readAt?: number;
  dismissedAt?: number;
}

export interface InAppInbox {
  total: number;
  unread: number;
  notifications: InAppNotification[];
}

/* ================================================================== */
/*  TYPES — Real-Time & Presence                                       */
/* ================================================================== */

export interface PresenceState {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: number;
  device: string;
  sessionId: string;
}

export interface InternalMessage {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId?: string;
  toDepartment?: string;
  toTeam?: string;
  subject: string;
  body: string;
  priority: MessagePriority;
  read: boolean;
  readAt?: number;
  archived: boolean;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Announcements & System Alerts                              */
/* ================================================================== */

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "critical" | "maintenance";
  channels: CommsChannel[];
  targetAudience: "all" | "admins" | "customers" | "suppliers" | "affiliates" | "staff";
  scheduledAt?: number;
  expiresAt?: number;
  status: "draft" | "active" | "expired";
  createdAt: number;
  publishedAt?: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  body: string;
  type: "maintenance" | "incident" | "security" | "update" | "outage";
  severity: "info" | "warning" | "critical";
  channels: CommsChannel[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — External Channel Integrations                              */
/* ================================================================== */

export interface ChannelIntegration {
  id: string;
  channel: CommsChannel;
  name: string;
  description: string;
  webhookUrl: string;
  configured: boolean;
  active: boolean;
  config: Record<string, string>;
  lastSent?: number;
  lastError?: string;
  createdAt: number;
}

export interface WebhookNotificationConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  retryConfig: { enabled: boolean; maxRetries: number; baseDelayMs: number };
  signingEnabled: boolean;
  active: boolean;
  lastDelivery?: number;
  lastSuccess?: boolean;
}

/* ================================================================== */
/*  TYPES — Analytics & Reports                                        */
/* ================================================================== */

export interface CommsAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  totalOpened: number;
  totalClicked: number;
  totalComplained: number;
  totalUnsubscribed: number;
  overallDeliveryRate: number;
  overallOpenRate: number;
  overallClickRate: number;
  emailsSent: number;
  emailsDelivered: number;
  smsSent: number;
  smsDelivered: number;
  pushSent: number;
  pushDelivered: number;
  inAppSent: number;
  inAppRead: number;
}

export interface ChannelAnalytics {
  channel: CommsChannel;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  avgLatencyMs: number;
}

export interface ProviderAnalytics {
  provider: string;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  deliveryRate: number;
  avgLatencyMs: number;
}

/* ================================================================== */
/*  TYPES — Preferences & Compliance                                   */
/* ================================================================== */

export interface CommunicationPreference {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  categories: Record<NotificationCategory, boolean>;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  doNotDisturb: boolean;
  dndUntil?: number;
  timezone: string;
  locale: string;
  subscribed: boolean;
  unsubscribedAt?: number;
  updatedAt: number;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: "email" | "sms" | "push" | "marketing" | "analytics";
  granted: boolean;
  source: string;
  ip: string;
  ts: number;
}

/* ================================================================== */
/*  STORE                                                              */
/* ================================================================== */

interface CommsStore {
  notifications: Notification[];
  templates: NotificationTemplate[];
  campaigns: Campaign[];
  dripSequences: DripSequence[];
  emailProviderConfigs: EmailProviderConfig[];
  emailTracking: EmailTracking[];
  smsMessages: SmsMessage[];
  pushNotifications: PushNotification[];
  inAppNotifications: InAppNotification[];
  presenceStates: PresenceState[];
  internalMessages: InternalMessage[];
  announcements: Announcement[];
  systemAlerts: SystemAlert[];
  channelIntegrations: ChannelIntegration[];
  webhookNotificationConfigs: WebhookNotificationConfig[];
  preferences: CommunicationPreference[];
  consentRecords: ConsentRecord[];
  queues: Record<string, Notification[]>;
  deadLetterQueue: Notification[];
}

function getStore(): CommsStore {
  try {
    const raw = localStorage.getItem(COMMS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CommsStore;
  } catch { /* ignore */ }
  return {
    notifications: [], templates: [], campaigns: [], dripSequences: [],
    emailProviderConfigs: [], emailTracking: [], smsMessages: [],
    pushNotifications: [], inAppNotifications: [], presenceStates: [],
    internalMessages: [], announcements: [], systemAlerts: [],
    channelIntegrations: [], webhookNotificationConfigs: [],
    preferences: [], consentRecords: [],
    queues: {}, deadLetterQueue: [],
  };
}

function saveStore(store: CommsStore) {
  try { localStorage.setItem(COMMS_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedCommsData() {
  const store = getStore();
  if (store.notifications.length > 0) return;

  const now = Date.now();
  const providers: EmailProviderConfig[] = [
    { id: "prov_smtp", provider: "smtp", label: "SMTP Relay", configured: true, dailyLimit: 5000, dailyUsed: 1248, priority: 4, active: true, config: { host: "smtp.alayainsider.com", port: "587", username: "smtp_user", encryption: "TLS" } },
    { id: "prov_ses", provider: "amazon_ses", label: "Amazon SES", configured: true, dailyLimit: 50000, dailyUsed: 8900, priority: 1, active: true, config: { region: "us-east-1", access_key: "AKIA****", verified_domain: "alayainsider.com" } },
    { id: "prov_mailgun", provider: "mailgun", label: "Mailgun", configured: true, dailyLimit: 25000, dailyUsed: 5600, priority: 2, active: true, config: { domain: "mg.alayainsider.com", api_key: "key-****" } },
    { id: "prov_sendgrid", provider: "sendgrid", label: "SendGrid", configured: true, dailyLimit: 10000, dailyUsed: 3200, priority: 3, active: true, config: { api_key: "SG.****" } },
    { id: "prov_postmark", provider: "postmark", label: "Postmark", configured: false, dailyLimit: 10000, dailyUsed: 0, priority: 5, active: false, config: { server_token: "" } },
    { id: "prov_resend", provider: "resend", label: "Resend", configured: false, dailyLimit: 3000, dailyUsed: 0, priority: 6, active: false, config: { api_key: "" } },
  ];

  const templates: NotificationTemplate[] = [
    { id: "tpl_welcome", name: "Welcome Email", category: "transactional", channels: ["email"], subject: "Welcome to {{store_name}}, {{name}}!", body: "Hi {{name}},\n\nWelcome to {{store_name}}! We're thrilled to have you on board.\n\nStart shopping: {{shop_url}}\n\nBest,\nThe {{store_name}} Team", htmlBody: "<h1>Welcome!</h1><p>Hi {{name}},</p><p>Welcome to {{store_name}}!</p>", variables: ["store_name", "name", "shop_url"], version: "1.0", status: "active", usageCount: 482, lastUsed: now - 86400000, createdAt: now - 90 * 86400000, updatedAt: now - 10 * 86400000 },
    { id: "tpl_order", name: "Order Confirmation", category: "transactional", channels: ["email"], subject: "Order #{{order_number}} Confirmed", body: "Hi {{name}},\n\nYour order #{{order_number}} has been confirmed.\n\nTotal: {{total}}\n\nTrack your order: {{track_url}}\n\nThanks for shopping with us!", variables: ["name", "order_number", "total", "track_url"], version: "1.2", status: "active", usageCount: 1280, lastUsed: now - 3600000, createdAt: now - 85 * 86400000, updatedAt: now - 5 * 86400000 },
    { id: "tpl_shipped", name: "Order Shipped", category: "transactional", channels: ["email", "sms"], subject: "Your Order Has Shipped!", body: "Hi {{name}}, your order #{{order_number}} has shipped!", variables: ["name", "order_number"], version: "1.0", status: "active", usageCount: 960, createdAt: now - 80 * 86400000, updatedAt: now - 10 * 86400000 },
    { id: "tpl_password", name: "Password Reset", category: "transactional", channels: ["email"], subject: "Reset Your Password", body: "Click here to reset your password: {{reset_url}}", variables: ["reset_url"], version: "1.0", status: "active", usageCount: 124, createdAt: now - 75 * 86400000, updatedAt: now - 10 * 86400000 },
    { id: "tpl_newsletter", name: "Weekly Newsletter", category: "marketing", channels: ["email"], subject: "{{store_name}} Weekly — {{topic}}", body: "This week at {{store_name}}: {{content}}", variables: ["store_name", "topic", "content"], version: "2.0", status: "active", usageCount: 24, lastUsed: now - 3 * 86400000, createdAt: now - 60 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: "tpl_abandoned", name: "Abandoned Cart", category: "marketing", channels: ["email", "push"], subject: "You left something behind!",    body: "Hi {{name}}, your cart is waiting. See the latest prices and compare merchants.", variables: ["name", "cart_url"], version: "1.1", status: "draft", usageCount: 0, createdAt: now - 30 * 86400000, updatedAt: now - 2 * 86400000 },
    { id: "tpl_security", name: "Security Alert", category: "security", channels: ["email", "sms"], subject: "Security Alert: {{alert_type}}", body: "We detected {{alert_type}} on your account. If this was you, ignore this message.", variables: ["alert_type"], version: "1.0", status: "active", usageCount: 56, createdAt: now - 70 * 86400000, updatedAt: now - 10 * 86400000 },
    { id: "tpl_affiliate", name: "Affiliate Commission", category: "affiliate", channels: ["email"], subject: "New Commission Earned!", body: "Hi {{name}}, you earned {{commission}} from a sale!", variables: ["name", "commission"], version: "1.0", status: "active", usageCount: 890, createdAt: now - 50 * 86400000, updatedAt: now - 5 * 86400000 },
    { id: "tpl_supplier", name: "Supplier Notification", category: "supplier", channels: ["email"], subject: "New Order: #{{order_number}}", body: "A new order has been assigned to you. Please process promptly.", variables: ["order_number", "supplier_name"], version: "1.0", status: "active", usageCount: 340, createdAt: now - 40 * 86400000, updatedAt: now - 5 * 86400000 },
    { id: "tpl_review", name: "Review Request", category: "customer", channels: ["email"], subject: "How was your {{product_name}}?", body: "Hi {{name}}, we'd love your feedback on {{product_name}}.", variables: ["name", "product_name", "review_url"], version: "1.0", status: "active", usageCount: 420, createdAt: now - 45 * 86400000, updatedAt: now - 5 * 86400000 },
  ];

  const campaigns: Campaign[] = [
    { id: "camp_1", name: "Summer Sale Announcement", description: "Email blast for summer collection launch", channels: ["email"], category: "marketing", targetAudience: "all_subscribers", scheduleType: "immediate", status: "completed", sentCount: 15000, deliveredCount: 14780, openedCount: 5200, clickedCount: 1890, bouncedCount: 220, complainedCount: 5, unsubscribedCount: 45, createdAt: now - 14 * 86400000, updatedAt: now - 12 * 86400000 },
    { id: "camp_2", name: "Abandoned Cart Recovery", description: "Re-engage customers who left items in cart", channels: ["email", "push"], category: "marketing", templateId: "tpl_abandoned", targetAudience: "abandoned_carts", scheduleType: "drip", status: "active", sentCount: 3200, deliveredCount: 3100, openedCount: 1240, clickedCount: 560, bouncedCount: 100, complainedCount: 2, unsubscribedCount: 18, createdAt: now - 7 * 86400000, updatedAt: now - 1 * 86400000 },
    { id: "camp_3", name: "New Customer Welcome Series", description: "5-email drip sequence for new signups", channels: ["email"], category: "transactional", targetAudience: "new_customers", scheduleType: "drip", status: "active", sentCount: 480, deliveredCount: 475, openedCount: 320, clickedCount: 180, bouncedCount: 5, complainedCount: 0, unsubscribedCount: 3, createdAt: now - 30 * 86400000, updatedAt: now - 1 * 86400000 },
  ];

  const inAppNotifs: InAppNotification[] = [
    { id: "ia_1", notificationId: "n1", userId: "admin_1", type: "toast", priority: "normal", title: "New Order", body: "Order #AL-12345 has been placed", icon: "shopping-cart", persistent: false, read: false, dismissed: false, createdAt: now - 60000 },
    { id: "ia_2", notificationId: "n2", userId: "admin_1", type: "banner", priority: "high", title: "Low Stock Alert", body: "Product 'Amber Noir' is running low (3 remaining)", icon: "alert-triangle", actionUrl: "/admin/products", persistent: true, read: false, dismissed: false, createdAt: now - 120000 },
    { id: "ia_3", notificationId: "n3", userId: "admin_1", type: "persistent", priority: "urgent", title: "Security Incident", body: "Critical security alert detected — review immediately", icon: "shield-alert", persistent: true, read: false, dismissed: false, createdAt: now - 300000 },
    { id: "ia_4", notificationId: "n4", userId: "admin_1", type: "toast", priority: "normal", title: "Backup Complete", body: "Daily backup completed successfully", icon: "check-circle", persistent: false, read: true, dismissed: true, createdAt: now - 3600000, readAt: now - 3500000, dismissedAt: now - 3400000 },
    { id: "ia_5", notificationId: "n5", userId: "admin_1", type: "banner", priority: "low", title: "New Review", body: "Customer left a 5-star review on 'Gold Cascade'", persistent: false, read: true, dismissed: true, createdAt: now - 7200000, readAt: now - 7000000, dismissedAt: now - 6800000 },
    { id: "ia_6", notificationId: "n6", userId: "admin_1", type: "persistent", priority: "high", title: "Workflow Failed", body: "Supplier notification workflow encountered an error", icon: "alert-circle", persistent: true, read: false, dismissed: false, createdAt: now - 1800000 },
    { id: "ia_7", notificationId: "n7", userId: "admin_1", type: "toast", priority: "normal", title: "Affiliate Commission", body: "New affiliate commission of $45.20 earned", icon: "dollar-sign", persistent: false, read: true, dismissed: false, createdAt: now - 900000, readAt: now - 800000 },
  ];

  const announcements: Announcement[] = [
    { id: "ann_1", title: "Scheduled Maintenance", body: "Platform will be under maintenance on Sunday, 2:00-4:00 AM EST. Expected downtime: <30 minutes.", type: "maintenance", channels: ["email", "in_app"], targetAudience: "all", scheduledAt: now + 2 * 86400000, expiresAt: now + 3 * 86400000, status: "active", createdAt: now - 86400000, publishedAt: now - 43200000 },
    { id: "ann_2", title: "New Feature: AI Product Descriptions", body: "You can now generate AI-powered product descriptions from the Products page. Learn more in the docs.", type: "info", channels: ["email", "in_app"], targetAudience: "admins", status: "active", createdAt: now - 3 * 86400000, publishedAt: now - 3 * 86400000 },
    { id: "ann_3", title: "Summer Collection Launch", body: "The new summer collection is now live across all stores.", type: "info", channels: ["email"], targetAudience: "customers", scheduledAt: now + 5 * 86400000, status: "draft", createdAt: now - 86400000 },
  ];

  const systemAlerts: SystemAlert[] = [
    { id: "sa_1", title: "SSL Certificate Expiring", body: "SSL certificate for alayainsider.com expires in 14 days. Renew now.", type: "security", severity: "warning", channels: ["email", "slack"], acknowledged: false, createdAt: now - 86400000 },
    { id: "sa_2", title: "CDN Edge Node Degraded", body: "One CDN edge node is reporting higher-than-normal latency (eu-west-2).", type: "incident", severity: "info", channels: ["slack"], acknowledged: true, acknowledgedBy: "admin", acknowledgedAt: now - 7200000, createdAt: now - 14400000 },
    { id: "sa_3", title: "Database Connection Pool High", body: "Database connection pool at 82% capacity. Consider scaling.", type: "incident", severity: "warning", channels: ["slack", "email"], acknowledged: false, createdAt: now - 3600000 },
    { id: "sa_4", title: "Payment Gateway Outage Resolved", body: "Stripe API latency issue has been resolved. All systems normal.", type: "outage", severity: "info", channels: ["slack", "email"], acknowledged: true, acknowledgedBy: "system", acknowledgedAt: now - 300000, resolvedAt: now - 300000, createdAt: now - 7200000 },
  ];

  const preferences: CommunicationPreference[] = [
    { userId: "user_1", email: true, sms: true, push: true, inApp: true, categories: { transactional: true, marketing: true, system: true, security: true, workflow: true, affiliate: true, supplier: false, customer: true, admin: true, ai: true, event: true }, doNotDisturb: false, timezone: "America/New_York", locale: "en", subscribed: true, updatedAt: now - 30 * 86400000 },
    { userId: "user_2", email: true, sms: false, push: true, inApp: true, categories: { transactional: true, marketing: false, system: true, security: true, workflow: true, affiliate: false, supplier: false, customer: true, admin: false, ai: false, event: true }, doNotDisturb: true, dndUntil: now + 28800000, timezone: "Europe/London", locale: "en-GB", subscribed: true, updatedAt: now - 7 * 86400000 },
    { userId: "user_3", email: true, sms: true, push: false, inApp: false, categories: { transactional: true, marketing: true, system: true, security: true, workflow: false, affiliate: false, supplier: false, customer: true, admin: false, ai: false, event: false }, doNotDisturb: false, timezone: "Asia/Tokyo", locale: "ja", subscribed: true, updatedAt: now - 14 * 86400000 },
  ];

  const channelIntegrations: ChannelIntegration[] = [
    { id: "ci_slack", channel: "slack", name: "Slack #alerts", description: "System alerts and monitoring notifications", webhookUrl: "https://hooks.slack.com/services/T00/B00/xxxx", configured: true, active: true, config: { channel: "#alerts", username: "ALAYA Bot", icon_emoji: ":alaya:" }, lastSent: now - 600000, createdAt: now - 60 * 86400000 },
    { id: "ci_discord", channel: "discord", name: "Discord Operations", description: "Order and affiliate notifications", webhookUrl: "https://discord.com/api/webhooks/xxxx/yyyy", configured: true, active: true, config: { channel: "operations", username: "ALAYA" }, lastSent: now - 3600000, createdAt: now - 45 * 86400000 },
    { id: "ci_teams", channel: "teams", name: "MS Teams - Admin", description: "Admin notifications to Microsoft Teams", webhookUrl: "https://outlook.office.com/webhook/xxxx", configured: false, active: false, config: {}, createdAt: now - 30 * 86400000 },
    { id: "ci_telegram", channel: "telegram", name: "Telegram Bot", description: "Security alerts via Telegram bot", webhookUrl: "https://api.telegram.org/botxxxx/sendMessage", configured: false, active: false, config: { chat_id: "" }, createdAt: now - 15 * 86400000 },
    { id: "ci_whatsapp", channel: "whatsapp", name: "WhatsApp Business", description: "Order updates via WhatsApp Business API", webhookUrl: "", configured: false, active: false, config: { phone_number_id: "", access_token: "" }, createdAt: now - 7 * 86400000 },
  ];

  store.emailProviderConfigs = providers;
  store.templates = templates;
  store.campaigns = campaigns;
  store.inAppNotifications = inAppNotifs;
  store.announcements = announcements;
  store.systemAlerts = systemAlerts;
  store.preferences = preferences;
  store.channelIntegrations = channelIntegrations;

  // Seed recent notifications
  const notifBase: Partial<Notification>[] = [
    { userId: "admin_1", channels: ["email"], category: "transactional", priority: "normal", status: "sent", subject: "Order #AL-12345 Confirmed", body: "Your order has been confirmed.", metadata: {}, retryCount: 0, maxRetries: 3, sentAt: now - 60000 },
    { userId: "admin_1", channels: ["email", "sms"], category: "security", priority: "high", status: "sent", subject: "Security Alert: New Login", body: "New login from Chrome on Windows.", metadata: {}, retryCount: 0, maxRetries: 3, sentAt: now - 300000 },
    { userId: "admin_1", channels: ["push"], category: "system", priority: "normal", status: "delivered", subject: "Daily Backup Complete", body: "Backup completed successfully.", metadata: {}, retryCount: 0, maxRetries: 2, sentAt: now - 3600000, deliveredAt: now - 3580000 },
    { userId: "admin_1", channels: ["email"], category: "affiliate", priority: "normal", status: "failed", subject: "Affiliate Report Failed", body: "Monthly affiliate report generation failed.", metadata: {}, retryCount: 2, maxRetries: 3, failedAt: now - 7200000, failureReason: "Data source unavailable" },
    { userId: "admin_1", channels: ["in_app"], category: "workflow", priority: "normal", status: "sent", subject: "Workflow: Supplier Notification", body: "Supplier notification workflow executed successfully.", metadata: {}, retryCount: 0, maxRetries: 2, sentAt: now - 1800000 },
  ];
  notifBase.forEach((n) => {
    const notif: Notification = { ...n as Notification, id: uid("notif"), createdAt: (n as any).sentAt || Date.now(), updatedAt: (n as any).sentAt || Date.now() };
    store.notifications.push(notif);
  });

  saveStore(store);
}

seedCommsData();

/* ================================================================== */
/*  NOTIFICATION ENGINE                                                */
/* ================================================================== */

export function sendNotification(input: Omit<Notification, "id" | "createdAt" | "updatedAt" | "status" | "retryCount">): Notification {
  const store = getStore();
  const notif: Notification = {
    ...input,
    id: uid("notif"),
    status: "queued",
    retryCount: 0,
    maxRetries: input.maxRetries || 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.notifications.push(notif);
  if (store.notifications.length > MAX_QUEUE_SIZE) store.notifications = store.notifications.slice(-MAX_QUEUE_SIZE);
  saveStore(store);
  routeNotification(notif);
  return notif;
}

export function getNotifications(limit = 50): Notification[] {
  return [...getStore().notifications].reverse().slice(0, limit);
}

export function getNotification(id: string): Notification | undefined {
  return getStore().notifications.find((n) => n.id === id);
}

export function retryNotification(id: string): boolean {
  const store = getStore();
  const idx = store.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  store.notifications[idx] = { ...store.notifications[idx], status: "queued", retryCount: 0, failureReason: undefined, failedAt: undefined, updatedAt: Date.now() };
  saveStore(store);
  return true;
}

export function cancelNotification(id: string): boolean {
  const store = getStore();
  const idx = store.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  store.notifications[idx] = { ...store.notifications[idx], status: "cancelled", updatedAt: Date.now() };
  saveStore(store);
  return true;
}

function routeNotification(notif: Notification) {
  // Simulate routing: mark as sent with a delay
  setTimeout(() => {
    const store = getStore();
    const idx = store.notifications.findIndex((n) => n.id === notif.id);
    if (idx === -1) return;
    const success = Math.random() > 0.08; // 92% success rate
    store.notifications[idx] = {
      ...store.notifications[idx],
      status: success ? "sent" : "failed",
      sentAt: success ? Date.now() : undefined,
      failedAt: success ? undefined : Date.now(),
      failureReason: success ? undefined : "Simulated delivery failure",
      updatedAt: Date.now(),
    };
    saveStore(store);
    pushLog(success ? "info" : "warning", "email", `Notification ${notif.id}: ${success ? "sent" : "failed"} via ${notif.channels.join(", ")}`);
  }, 500);
}

/* ================================================================== */
/*  TEMPLATES                                                          */
/* ================================================================== */

export function getTemplates(): NotificationTemplate[] {
  return getStore().templates;
}

export function getTemplate(id: string): NotificationTemplate | undefined {
  return getStore().templates.find((t) => t.id === id);
}

export function createTemplate(input: Omit<NotificationTemplate, "id" | "usageCount" | "createdAt" | "updatedAt">): NotificationTemplate {
  const store = getStore();
  const tpl: NotificationTemplate = { ...input, id: uid("tpl"), usageCount: 0, createdAt: Date.now(), updatedAt: Date.now() };
  store.templates.push(tpl);
  saveStore(store);
  return tpl;
}

export function updateTemplate(id: string, patch: Partial<NotificationTemplate>): NotificationTemplate | null {
  const store = getStore();
  const idx = store.templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.templates[idx] = { ...store.templates[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.templates[idx];
}

export function deleteTemplate(id: string): boolean {
  const store = getStore();
  store.templates = store.templates.filter((t) => t.id !== id);
  saveStore(store);
  return true;
}

export function renderTemplate(templateId: string, variables: Record<string, string>): { subject: string; body: string; htmlBody?: string } | null {
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
/*  CAMPAIGNS                                                          */
/* ================================================================== */

export function getCampaigns(): Campaign[] {
  return getStore().campaigns;
}

export function createCampaign(input: Omit<Campaign, "id" | "sentCount" | "deliveredCount" | "openedCount" | "clickedCount" | "bouncedCount" | "complainedCount" | "unsubscribedCount" | "createdAt" | "updatedAt">): Campaign {
  const store = getStore();
  const camp: Campaign = { ...input, id: uid("camp"), sentCount: 0, deliveredCount: 0, openedCount: 0, clickedCount: 0, bouncedCount: 0, complainedCount: 0, unsubscribedCount: 0, createdAt: Date.now(), updatedAt: Date.now() };
  store.campaigns.push(camp);
  saveStore(store);
  return camp;
}

export function updateCampaign(id: string, patch: Partial<Campaign>): Campaign | null {
  const store = getStore();
  const idx = store.campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.campaigns[idx] = { ...store.campaigns[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.campaigns[idx];
}

export function deleteCampaign(id: string): boolean {
  const store = getStore();
  store.campaigns = store.campaigns.filter((c) => c.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  EMAIL PLATFORM                                                     */
/* ================================================================== */

export function getEmailProviders(): EmailProviderConfig[] {
  return getStore().emailProviderConfigs;
}

export function updateEmailProvider(id: string, patch: Partial<EmailProviderConfig>): EmailProviderConfig | null {
  const store = getStore();
  const idx = store.emailProviderConfigs.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.emailProviderConfigs[idx] = { ...store.emailProviderConfigs[idx], ...patch };
  saveStore(store);
  return store.emailProviderConfigs[idx];
}

export function sendEmail(input: { to: string; subject: string; body: string; htmlBody?: string; templateId?: string; tracking?: boolean }): Notification {
  return sendNotification({
    userId: undefined,
    email: input.to,
    channels: ["email"],
    category: "transactional",
    priority: "normal",
    subject: input.subject,
    body: input.body,
    htmlBody: input.htmlBody,
    templateId: input.templateId,
    metadata: input.tracking ? { tracking_enabled: "true" } : {},
    maxRetries: 3,
    scheduledAt: undefined,
  });
}

/* ================================================================== */
/*  SMS PLATFORM                                                       */
/* ================================================================== */

export function sendSms(input: { to: string; body: string; priority?: MessagePriority }): Notification {
  return sendNotification({
    userId: undefined,
    phone: input.to,
    channels: ["sms"],
    category: "transactional",
    priority: input.priority || "normal",
    subject: "SMS Message",
    body: input.body,
    metadata: {},
    maxRetries: 2,
    scheduledAt: undefined,
  });
}

/* ================================================================== */
/*  PUSH NOTIFICATION PLATFORM                                         */
/* ================================================================== */

export function sendPush(input: { userId?: string; title: string; body: string; icon?: string; image?: string; data?: Record<string, string>; actions?: PushAction[]; scheduledAt?: number }): Notification {
  const notif = sendNotification({
    userId: input.userId,
    channels: ["push"],
    category: "system",
    priority: "normal",
    subject: input.title,
    body: input.body,
    metadata: { ...input.data, icon: input.icon || "", image: input.image || "" },
    maxRetries: 2,
    scheduledAt: input.scheduledAt,
  });
  // Also create push notification record
  const store = getStore();
  const push: PushNotification = {
    id: uid("push"),
    notificationId: notif.id,
    userId: input.userId,
    title: input.title,
    body: input.body,
    icon: input.icon,
    image: input.image,
    data: input.data || {},
    actions: input.actions || [],
    status: "queued",
    scheduledAt: input.scheduledAt,
    sentAt: undefined,
  };
  store.pushNotifications.push(push);
  saveStore(store);
  return notif;
}

export function getPushNotifications(limit = 50): PushNotification[] {
  return [...getStore().pushNotifications].reverse().slice(0, limit);
}

/* ================================================================== */
/*  IN-APP NOTIFICATION PLATFORM                                       */
/* ================================================================== */

export function getInAppNotifications(userId?: string): InAppInbox {
  const store = getStore();
  let notifs = [...store.inAppNotifications].reverse();
  if (userId) notifs = notifs.filter((n) => n.userId === userId);
  return {
    total: notifs.length,
    unread: notifs.filter((n) => !n.read).length,
    notifications: notifs.slice(0, MAX_INBOX_SIZE),
  };
}

export function createInAppNotification(input: Omit<InAppNotification, "id" | "createdAt" | "read" | "dismissed">): InAppNotification {
  const store = getStore();
  const notif: InAppNotification = {
    ...input,
    id: uid("ia"),
    read: false,
    dismissed: false,
    createdAt: Date.now(),
  };
  store.inAppNotifications.unshift(notif);
  if (store.inAppNotifications.length > MAX_INBOX_SIZE) store.inAppNotifications = store.inAppNotifications.slice(0, MAX_INBOX_SIZE);
  saveStore(store);
  return notif;
}

export function markInAppRead(id: string): boolean {
  const store = getStore();
  const notif = store.inAppNotifications.find((n) => n.id === id);
  if (!notif) return false;
  notif.read = true;
  notif.readAt = Date.now();
  saveStore(store);
  return true;
}

export function markAllInAppRead(userId: string): boolean {
  const store = getStore();
  let updated = false;
  store.inAppNotifications.forEach((n) => {
    if (n.userId === userId && !n.read) { n.read = true; n.readAt = Date.now(); updated = true; }
  });
  if (updated) saveStore(store);
  return updated;
}

export function dismissInApp(id: string): boolean {
  const store = getStore();
  const notif = store.inAppNotifications.find((n) => n.id === id);
  if (!notif) return false;
  notif.dismissed = true;
  notif.dismissedAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  ANNOUNCEMENTS                                                      */
/* ================================================================== */

export function getAnnouncements(): Announcement[] {
  return getStore().announcements;
}

export function createAnnouncement(input: Omit<Announcement, "id" | "createdAt">): Announcement {
  const store = getStore();
  const ann: Announcement = { ...input, id: uid("ann"), createdAt: Date.now() };
  store.announcements.push(ann);
  saveStore(store);
  return ann;
}

export function updateAnnouncement(id: string, patch: Partial<Announcement>): Announcement | null {
  const store = getStore();
  const idx = store.announcements.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.announcements[idx] = { ...store.announcements[idx], ...patch };
  saveStore(store);
  return store.announcements[idx];
}

export function deleteAnnouncement(id: string): boolean {
  const store = getStore();
  store.announcements = store.announcements.filter((a) => a.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  SYSTEM ALERTS                                                      */
/* ================================================================== */

export function getSystemAlerts(): SystemAlert[] {
  return [...getStore().systemAlerts].reverse();
}

export function createSystemAlert(input: Omit<SystemAlert, "id" | "acknowledged" | "createdAt">): SystemAlert {
  const store = getStore();
  const alert: SystemAlert = { ...input, id: uid("sa"), acknowledged: false, createdAt: Date.now() };
  store.systemAlerts.push(alert);
  saveStore(store);
  return alert;
}

export function acknowledgeAlert(id: string, userId: string): boolean {
  const store = getStore();
  const alert = store.systemAlerts.find((a) => a.id === id);
  if (!alert) return false;
  alert.acknowledged = true;
  alert.acknowledgedBy = userId;
  alert.acknowledgedAt = Date.now();
  saveStore(store);
  return true;
}

export function resolveAlert(id: string): boolean {
  const store = getStore();
  const alert = store.systemAlerts.find((a) => a.id === id);
  if (!alert) return false;
  alert.resolvedAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  EXTERNAL CHANNEL INTEGRATIONS                                      */
/* ================================================================== */

export function getChannelIntegrations(): ChannelIntegration[] {
  return getStore().channelIntegrations;
}

export function updateChannelIntegration(id: string, patch: Partial<ChannelIntegration>): ChannelIntegration | null {
  const store = getStore();
  const idx = store.channelIntegrations.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.channelIntegrations[idx] = { ...store.channelIntegrations[idx], ...patch };
  saveStore(store);
  return store.channelIntegrations[idx];
}

/* ================================================================== */
/*  PREFERENCES & CONSENT                                              */
/* ================================================================== */

export function getPreferences(): CommunicationPreference[] {
  return getStore().preferences;
}

export function getPreference(userId: string): CommunicationPreference | undefined {
  return getStore().preferences.find((p) => p.userId === userId);
}

export function upsertPreference(pref: CommunicationPreference): CommunicationPreference {
  const store = getStore();
  const idx = store.preferences.findIndex((p) => p.userId === pref.userId);
  const updated = { ...pref, updatedAt: Date.now() };
  if (idx === -1) store.preferences.push(updated);
  else store.preferences[idx] = updated;
  saveStore(store);
  return updated;
}

export function unsubscribe(userId: string): boolean {
  const pref = getPreference(userId);
  if (!pref) return false;
  pref.subscribed = false;
  pref.unsubscribedAt = Date.now();
  pref.email = false;
  pref.sms = false;
  pref.push = false;
  pref.inApp = false;
  Object.keys(pref.categories).forEach((k) => { pref.categories[k as NotificationCategory] = false; });
  return upsertPreference(pref) !== null;
}

/* ================================================================== */
/*  ANALYTICS                                                          */
/* ================================================================== */

export function getCommsAnalytics(): CommsAnalytics {
  const store = getStore();
  const notifs = store.notifications;
  const emailNotifs = notifs.filter((n) => n.channels.includes("email"));
  const smsNotifs = notifs.filter((n) => n.channels.includes("sms"));
  const pushNotifs = notifs.filter((n) => n.channels.includes("push"));
  const inAppNotifs = notifs.filter((n) => n.channels.includes("in_app"));

  const total = notifs.length || 1;
  const sent = notifs.filter((n) => n.status === "sent" || n.status === "delivered").length;
  const failed = notifs.filter((n) => n.status === "failed").length;
  const bounced = notifs.filter((n) => n.status === "bounced").length;

  // Simulated tracking stats
  const openRate = total > 10 ? 42 : 0;
  const clickRate = total > 10 ? 18 : 0;

  return {
    totalSent: total,
    totalDelivered: sent,
    totalFailed: failed,
    totalBounced: bounced,
    totalOpened: Math.round(sent * openRate / 100),
    totalClicked: Math.round(sent * clickRate / 100),
    totalComplained: Math.round(bounced * 0.02),
    totalUnsubscribed: Math.round(sent * 0.003),
    overallDeliveryRate: Math.round((sent / total) * 100),
    overallOpenRate: openRate,
    overallClickRate: clickRate,
    emailsSent: emailNotifs.length,
    emailsDelivered: emailNotifs.filter((n) => n.status === "delivered").length,
    smsSent: smsNotifs.length,
    smsDelivered: smsNotifs.filter((n) => n.status === "delivered").length,
    pushSent: pushNotifs.length,
    pushDelivered: pushNotifs.filter((n) => n.status === "delivered").length,
    inAppSent: inAppNotifs.length,
    inAppRead: inAppNotifs.filter((n) => n.status === "delivered").length,
  };
}

export function getChannelAnalytics(): ChannelAnalytics[] {
  const store = getStore();
  const channels: CommsChannel[] = ["email", "sms", "push", "in_app", "slack", "discord", "teams", "telegram", "whatsapp"];
  return channels.map((ch) => {
    const notifs = store.notifications.filter((n) => n.channels.includes(ch));
    const sent = notifs.length;
    const delivered = notifs.filter((n) => n.status === "delivered" || n.status === "sent").length;
    return {
      channel: ch,
      sent,
      delivered,
      failed: notifs.filter((n) => n.status === "failed").length,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      avgLatencyMs: Math.floor(100 + Math.random() * 900),
    };
  });
}

export function getProviderAnalytics(): ProviderAnalytics[] {
  return getStore().emailProviderConfigs.map((p) => ({
    provider: p.provider,
    sent: p.dailyUsed,
    delivered: Math.round(p.dailyUsed * 0.97),
    failed: Math.round(p.dailyUsed * 0.02),
    bounced: Math.round(p.dailyUsed * 0.01),
    deliveryRate: 97,
    avgLatencyMs: Math.floor(50 + Math.random() * 200),
  }));
}

/* ================================================================== */
/*  INTERNAL MESSAGING                                                 */
/* ================================================================== */

export function getInternalMessages(userId?: string): InternalMessage[] {
  const store = getStore();
  let msgs = [...store.internalMessages].reverse();
  if (userId) msgs = msgs.filter((m) => m.toUserId === userId || m.fromUserId === userId);
  return msgs;
}

export function sendInternalMessage(input: Omit<InternalMessage, "id" | "read" | "archived" | "createdAt">): InternalMessage {
  const store = getStore();
  const msg: InternalMessage = { ...input, id: uid("imsg"), read: false, archived: false, createdAt: Date.now() };
  store.internalMessages.push(msg);
  saveStore(store);
  return msg;
}

export function markInternalMessageRead(id: string): boolean {
  const store = getStore();
  const msg = store.internalMessages.find((m) => m.id === id);
  if (!msg) return false;
  msg.read = true;
  msg.readAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  PRESENCE                                                           */
/* ================================================================== */

export function getPresenceStates(): PresenceState[] {
  return getStore().presenceStates;
}

export function updatePresence(userId: string, status: PresenceState["status"], device: string, sessionId: string): PresenceState {
  const store = getStore();
  const idx = store.presenceStates.findIndex((p) => p.userId === userId);
  const state: PresenceState = { userId, status, device, sessionId, lastSeen: Date.now() };
  if (idx === -1) store.presenceStates.push(state);
  else store.presenceStates[idx] = state;
  saveStore(store);
  return state;
}
