/**
 * ALAYA INSIDER — Enterprise Administration Portal (PART 3.6)
 * ------------------------------------------------------------------
 * Central command center for platform operations, workspace management,
 * notifications, reporting, AI administration, and developer tools.
 *
 * Modules:
 *  1. Workspace Engine       — workspaces, departments, navigation
 *  2. Notifications Center   — alerts, incidents, tasks, approvals
 *  3. Operations Center      — platform health, business overview
 *  4. Reporting Platform     — executive & custom reports, schedule, export
 *  5. AI Administration      — models, agents, prompts, usage, governance
 *  6. Developer Tools        — API explorer, webhooks, queues, storage
 *  7. Administration         — users, roles, permissions, feature flags
 */
import { uid } from "./utils";
import type { AuditLog } from "./types";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const ADMIN_PORTAL_KEY = "alaya_admin_portal_v1";
export const MAX_RECENT_ACTIONS = 100;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type WorkspaceType =
  | "executive" | "marketing" | "affiliate" | "commerce" | "editorial"
  | "seo" | "developer" | "support" | "finance" | "supplier" | "administration";

export type NotificationType =
  | "info" | "success" | "warning" | "error" | "critical";

export type NotificationCategory =
  | "order" | "product" | "customer" | "affiliate" | "system" | "security"
  | "marketing" | "content" | "workflow" | "revenue" | "inventory";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type ReportType = "executive" | "department" | "custom" | "scheduled";
export type ReportFormat = "pdf" | "csv" | "excel" | "html";

export type FeatureFlagStatus = "enabled" | "disabled" | "beta" | "deprecated";

/* ================================================================== */
/*  INTERFACES — Workspace Engine                                      */
/* ================================================================== */

export interface Workspace {
  id: string;
  type: WorkspaceType;
  name: string;
  description: string;
  icon: string;
  pages: WorkspacePage[];
  pinned: boolean;
  order: number;
}

export interface WorkspacePage {
  id: string;
  label: string;
  path: string;
  icon: string;
  group: string;
}

/* ================================================================== */
/*  INTERFACES — Notifications Center                                  */
/* ================================================================== */

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  dismissed: boolean;
  createdAt: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: "detected" | "investigating" | "resolved" | "monitoring";
  affectedSystems: string[];
  detectedAt: number;
  resolvedAt?: number;
  assignedTo?: string;
  timeline: { ts: number; message: string }[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: number;
  category: string;
  createdAt: number;
  completedAt?: number;
}

export interface Approval {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  type: "publish" | "product" | "order_refund" | "coupon" | "content" | "affiliate" | "settings";
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: number;
  createdAt: number;
}

/* ================================================================== */
/*  INTERFACES — Operations Center                                     */
/* ================================================================== */

export interface PlatformHealth {
  status: "healthy" | "degraded" | "down";
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  lastIncident: number | null;
  services: { name: string; status: string; latency: number }[];
}

export interface BusinessOverview {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  totalProducts: number;
  activeProducts: number;
  avgOrderValue: number;
  conversionRate: number;
  totalAffiliateRevenue: number;
  affiliateRevenueGrowth: number;
}

/* ================================================================== */
/*  INTERFACES — Reporting Platform                                    */
/* ================================================================== */

export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  department?: string;
  metrics: string[];
  filters: Record<string, string>;
  schedule?: { frequency: "daily" | "weekly" | "monthly" | "quarterly"; recipients: string[] };
  lastGenerated?: number;
  nextScheduled?: number;
  createdAt: number;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  status: "running" | "completed" | "failed";
  outputUrl?: string;
  rowCount: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

/* ================================================================== */
/*  INTERFACES — AI Administration                                     */
/* ================================================================== */

export interface AiAdminModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  capabilities: string[];
  status: "active" | "inactive" | "error";
  costPerToken: number;
  tokensUsed: number;
  lastUsed: number;
}

export interface AiAdminAgent {
  id: string;
  name: string;
  description: string;
  modelId: string;
  capabilities: string[];
  systemPrompt: string;
  status: "active" | "paused" | "error";
  totalRequests: number;
  totalTokens: number;
  successRate: number;
}

export interface AiAdminPrompt {
  id: string;
  name: string;
  template: string;
  category: string;
  version: number;
  usageCount: number;
  avgTokens: number;
}

/* ================================================================== */
/*  INTERFACES — Developer Tools                                       */
/* ================================================================== */

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: number;
  expiresAt?: number;
  active: boolean;
  createdAt: number;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  lastTriggered?: number;
  lastResponse?: number;
  active: boolean;
  createdAt: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  status: "delivered" | "failed" | "pending";
  responseCode?: number;
  createdAt: number;
}

/* ================================================================== */
/*  INTERFACES — Administration                                       */
/* ================================================================== */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  lastLogin?: number;
  active: boolean;
  createdAt: number;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  status: FeatureFlagStatus;
  enabledFor: string[]; // user IDs or roles
  enabledPercent: number;
  updatedAt: number;
  createdAt: number;
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface AdminPortalStore {
  recentActions: AuditLog[];
  notifications: Notification[];
  incidents: Incident[];
  tasks: Task[];
  approvals: Approval[];
  workspaces: Workspace[];
  activeWorkspace: WorkspaceType;
  reports: Report[];
  reportExecutions: ReportExecution[];
  aiModels: AiAdminModel[];
  aiAgents: AiAdminAgent[];
  aiPrompts: AiAdminPrompt[];
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  webhookEvents: WebhookEvent[];
  adminUsers: AdminUser[];
  adminRoles: AdminRole[];
  featureFlags: FeatureFlag[];
}

function getStore(): AdminPortalStore {
  try {
    const raw = localStorage.getItem(ADMIN_PORTAL_KEY);
    if (raw) return JSON.parse(raw) as AdminPortalStore;
  } catch { /* ignore */ }
  return {
    recentActions: [], notifications: [], incidents: [], tasks: [],
    approvals: [], workspaces: [], activeWorkspace: "executive",
    reports: [], reportExecutions: [], aiModels: [], aiAgents: [],
    aiPrompts: [], apiKeys: [], webhooks: [], webhookEvents: [],
    adminUsers: [], adminRoles: [], featureFlags: [],
  };
}

function saveStore(store: AdminPortalStore) {
  try { localStorage.setItem(ADMIN_PORTAL_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedAdminPortal() {
  const store = getStore();
  if (store.workspaces.length > 0) return;

  const now = Date.now();

  /* ---- Workspaces ---- */
  const workspaces: Workspace[] = [
    { id: "ws_exec", type: "executive", name: "Executive", description: "High-level business overview & strategic metrics", icon: "LayoutDashboard", pinned: true, order: 0, pages: [] },
    { id: "ws_commerce", type: "commerce", name: "Commerce", description: "Orders, products, inventory, pricing", icon: "ShoppingBag", pinned: true, order: 1, pages: [] },
    { id: "ws_marketing", type: "marketing", name: "Marketing", description: "Campaigns, automation, audience", icon: "Megaphone", pinned: true, order: 2, pages: [] },
    { id: "ws_editorial", type: "editorial", name: "Editorial", description: "Content, journal, articles, reviews", icon: "Newspaper", pinned: true, order: 3, pages: [] },
    { id: "ws_affiliate", type: "affiliate", name: "Affiliate", description: "Partners, commissions, marketplace", icon: "Handshake", pinned: true, order: 4, pages: [] },
    { id: "ws_seo", type: "seo", name: "SEO", description: "Search optimization, analytics, content", icon: "Search", pinned: false, order: 5, pages: [] },
    { id: "ws_developer", type: "developer", name: "Developer", description: "API keys, webhooks, SDKs, deployments", icon: "Code2", pinned: false, order: 6, pages: [] },
    { id: "ws_support", type: "support", name: "Support", description: "Tickets, customers, returns", icon: "Smile", pinned: false, order: 7, pages: [] },
    { id: "ws_finance", type: "finance", name: "Finance", description: "Revenue, commissions, forecasts", icon: "DollarSign", pinned: false, order: 8, pages: [] },
    { id: "ws_admin", type: "administration", name: "Administration", description: "Settings, users, security, system", icon: "Settings", pinned: false, order: 9, pages: [] },
  ];

  /* ---- Seed Notifications ---- */
  const notifications: Notification[] = [
    { id: "notif_1", type: "success", category: "order", title: "Order #AL-482890 completed", message: "Order for 'Silk Evening Dress' has been delivered successfully.", read: false, dismissed: false, createdAt: now - 3600000 },
    { id: "notif_2", type: "warning", category: "inventory", title: "Low stock alert: 3 products", message: "Cashmere Scarf (2 left), Leather Tote (4 left), Gold Earrings (1 left)", link: "/admin/products", read: false, dismissed: false, createdAt: now - 7200000 },
    { id: "notif_3", type: "info", category: "affiliate", title: "Commission earned: $71.20", message: "Commission from NET-A-PORTER for Italian Leather Tote has been approved.", read: true, dismissed: false, createdAt: now - 14400000 },
    { id: "notif_4", type: "critical", category: "system", title: "Marketplace sync failure", message: "Rakuten marketplace sync has failed 3 consecutive times. Manual intervention required.", link: "/admin/marketplace-registry", read: false, dismissed: false, createdAt: now - 28800000 },
    { id: "notif_5", type: "info", category: "revenue", title: "Revenue milestone: $10K+", message: "Monthly affiliate revenue has exceeded $10,000 for the first time.", read: true, dismissed: false, createdAt: now - 86400000 },
  ];

  /* ---- Seed Incidents ---- */
  const incidents: Incident[] = [
    { id: "inc_1", title: "Rakuten API connectivity issues", description: "Rakuten Advertising API has been returning 503 errors. Auto-failover to Amazon Associates initiated.", severity: "high", status: "investigating", affectedSystems: ["Rakuten Marketplace", "Commission Sync"], detectedAt: now - 28800000, timeline: [{ ts: now - 28800000, message: "Incident detected: Rakuten API returning 503" }, { ts: now - 28400000, message: "Failover to Amazon Associates initiated" }, { ts: now - 14400000, message: "Investigation ongoing — vendor contacted" }] },
    { id: "inc_2", title: "Price sync delayed for SSENSE", description: "Price intelligence for SSENSE marketplace has not updated in 6+ hours.", severity: "medium", status: "monitoring", affectedSystems: ["SSENSE Marketplace", "Price Intelligence"], detectedAt: now - 43200000, timeline: [{ ts: now - 43200000, message: "Price sync delay detected" }, { ts: now - 21600000, message: "Manual sync triggered, awaiting completion" }] },
  ];

  /* ---- Seed AI Models & Agents ---- */
  const aiModels: AiAdminModel[] = [
    { id: "aim_1", name: "OpenAI GPT-4o", provider: "openai", modelId: "gpt-4o", capabilities: ["text", "code", "analysis"], status: "active", costPerToken: 0.00001, tokensUsed: 245000, lastUsed: now - 3600000 },
    { id: "aim_2", name: "Claude 3.5 Sonnet", provider: "anthropic", modelId: "claude-3-5-sonnet-20240620", capabilities: ["text", "analysis", "code"], status: "active", costPerToken: 0.000008, tokensUsed: 120000, lastUsed: now - 7200000 },
    { id: "aim_3", name: "Local ALAYA Model", provider: "local", modelId: "alaya-on-device", capabilities: ["text", "tags", "summary"], status: "active", costPerToken: 0, tokensUsed: 890000, lastUsed: now - 600000 },
  ];

  const aiAgents: AiAdminAgent[] = [
    { id: "aia_1", name: "ALAYA Copilot", description: "General assistant for admin tasks and queries", modelId: "aim_3", capabilities: ["text", "analysis"], systemPrompt: "You are an AI assistant for the ALAYA INSIDER platform...", status: "active", totalRequests: 1250, totalTokens: 340000, successRate: 0.97 },
    { id: "aia_2", name: "Content Generator", description: "Generates product descriptions and SEO metadata", modelId: "aim_1", capabilities: ["text"], systemPrompt: "You generate luxury editorial content...", status: "active", totalRequests: 430, totalTokens: 210000, successRate: 0.95 },
  ];

  const aiPrompts: AiAdminPrompt[] = [
    { id: "aip_1", name: "Product Description", template: "Write a premium product description for {product_name}...", category: "product", version: 3, usageCount: 215, avgTokens: 180 },
    { id: "aip_2", name: "SEO Meta Title", template: "Generate an SEO meta title under 60 chars for {product_name}...", category: "seo", version: 2, usageCount: 340, avgTokens: 45 },
  ];

  /* ---- Seed Feature Flags ---- */
  const featureFlags: FeatureFlag[] = [
    { id: "ff_1", name: "AI Product Descriptions", key: "ai_product_descriptions", description: "Enable AI-generated product descriptions in the product editor", status: "enabled", enabledFor: [], enabledPercent: 100, updatedAt: now - 30 * 86400000, createdAt: now - 60 * 86400000 },
    { id: "ff_2", name: "Dynamic Collections", key: "dynamic_collections", description: "Enable smart collection builder with auto-updating rules", status: "beta", enabledFor: ["admin"], enabledPercent: 25, updatedAt: now - 14 * 86400000, createdAt: now - 45 * 86400000 },
    { id: "ff_3", name: "Affiliate Marketplace Sync", key: "affiliate_marketplace_sync", description: "Auto-sync product data with affiliate marketplaces", status: "enabled", enabledFor: [], enabledPercent: 100, updatedAt: now - 7 * 86400000, createdAt: now - 30 * 86400000 },
    { id: "ff_4", name: "Customer Journey Tracking", key: "customer_journey", description: "Track customer journey across touchpoints with analytics", status: "beta", enabledFor: [], enabledPercent: 50, updatedAt: now - 5 * 86400000, createdAt: now - 20 * 86400000 },
    { id: "ff_5", name: "Multi-Currency Checkout", key: "multi_currency", description: "Allow customers to checkout in their local currency", status: "disabled", enabledFor: [], enabledPercent: 0, updatedAt: now - 86400000, createdAt: now - 10 * 86400000 },
    { id: "ff_6", name: "Advanced Reporting", key: "advanced_reports", description: "Enable custom report builder with scheduled exports", status: "enabled", enabledFor: [], enabledPercent: 100, updatedAt: now - 3 * 86400000, createdAt: now - 15 * 86400000 },
    { id: "ff_7", name: "New Checkout Flow", key: "new_checkout", description: "Use the redesigned checkout with one-click buy", status: "disabled", enabledFor: [], enabledPercent: 0, updatedAt: now - 86400000, createdAt: now - 7 * 86400000 },
  ];

  /* ---- Seed Admin Users & Roles ---- */
  const adminUsers: AdminUser[] = [
    { id: "au_1", name: "Admin", email: "alayainsider@gmail.com", role: "Super Admin", department: "Administration", lastLogin: now - 3600000, active: true, createdAt: now - 180 * 86400000 },
    { id: "au_2", name: "Editor", email: "editor@alayainsider.com", role: "Editor", department: "Editorial", lastLogin: now - 86400000, active: true, createdAt: now - 90 * 86400000 },
    { id: "au_3", name: "Marketing Manager", email: "marketing@alayainsider.com", role: "Marketing Manager", department: "Marketing", lastLogin: now - 172800000, active: true, createdAt: now - 60 * 86400000 },
    { id: "au_4", name: "Affiliate Manager", email: "affiliates@alayainsider.com", role: "Affiliate Manager", department: "Affiliates", active: true, createdAt: now - 45 * 86400000 },
  ];

  const adminRoles: AdminRole[] = [
    { id: "ar_1", name: "Super Admin", description: "Full system access with all permissions", permissions: ["*"], userCount: 1 },
    { id: "ar_2", name: "Editor", description: "Content creation and publishing", permissions: ["content.read", "content.write", "content.publish", "media.read", "media.write"], userCount: 1 },
    { id: "ar_3", name: "Marketing Manager", description: "Marketing campaigns and analytics", permissions: ["marketing.read", "marketing.write", "analytics.read", "content.read"], userCount: 1 },
    { id: "ar_4", name: "Affiliate Manager", description: "Affiliate partner and commission management", permissions: ["affiliates.read", "affiliates.write", "affiliates.commissions", "marketplace.read", "marketplace.write"], userCount: 1 },
  ];

  /* ---- Seed Reports ---- */
  const reports: Report[] = [
    { id: "rpt_1", name: "Monthly Executive Summary", description: "High-level business metrics for executive team", type: "executive", format: "pdf", metrics: ["revenue", "orders", "customers", "aov"], filters: {}, schedule: { frequency: "monthly", recipients: ["executive@alayainsider.com"] }, lastGenerated: now - 7 * 86400000, nextScheduled: now + 23 * 86400000, createdAt: now - 90 * 86400000 },
    { id: "rpt_2", name: "Affiliate Performance", description: "Affiliate partner performance and commission breakdown", type: "department", format: "excel", department: "Affiliates", metrics: ["clicks", "conversions", "revenue", "commissions"], filters: {}, schedule: { frequency: "weekly", recipients: ["affiliates@alayainsider.com"] }, lastGenerated: now - 3 * 86400000, nextScheduled: now + 4 * 86400000, createdAt: now - 60 * 86400000 },
  ];

  store.workspaces = workspaces;
  store.notifications = notifications;
  store.incidents = incidents;
  store.aiModels = aiModels;
  store.aiAgents = aiAgents;
  store.aiPrompts = aiPrompts;
  store.featureFlags = featureFlags;
  store.adminUsers = adminUsers;
  store.adminRoles = adminRoles;
  store.reports = reports;
  saveStore(store);
}

seedAdminPortal();

/* ================================================================== */
/*  MODULE 1: WORKSPACE ENGINE                                         */
/* ================================================================== */

export function getWorkspaces(): Workspace[] {
  return getStore().workspaces;
}

export function getWorkspace(type: WorkspaceType): Workspace | undefined {
  return getStore().workspaces.find((w) => w.type === type);
}

export function getActiveWorkspace(): WorkspaceType {
  return getStore().activeWorkspace;
}

export function setActiveWorkspace(type: WorkspaceType) {
  const store = getStore();
  store.activeWorkspace = type;
  saveStore(store);
}

export function toggleWorkspacePin(id: string) {
  const store = getStore();
  const ws = store.workspaces.find((w) => w.id === id);
  if (ws) { ws.pinned = !ws.pinned; saveStore(store); }
}

/* ================================================================== */
/*  MODULE 2: NOTIFICATIONS CENTER                                     */
/* ================================================================== */

export function getNotifications(): Notification[] {
  return getStore().notifications;
}

export function getUnreadCount(): number {
  return getStore().notifications.filter((n) => !n.read && !n.dismissed).length;
}

export function markNotificationRead(id: string) {
  const store = getStore();
  const n = store.notifications.find((n) => n.id === id);
  if (n) { n.read = true; saveStore(store); }
}

export function markAllNotificationsRead() {
  const store = getStore();
  store.notifications.forEach((n) => { n.read = true; });
  saveStore(store);
}

export function dismissNotification(id: string) {
  const store = getStore();
  const n = store.notifications.find((n) => n.id === id);
  if (n) { n.dismissed = true; saveStore(store); }
}

export function addNotification(input: Omit<Notification, "id" | "read" | "dismissed" | "createdAt">): Notification {
  const store = getStore();
  const notif: Notification = { ...input, id: uid("notif"), read: false, dismissed: false, createdAt: Date.now() };
  store.notifications.unshift(notif);
  if (store.notifications.length > 100) store.notifications = store.notifications.slice(0, 100);
  saveStore(store);
  return notif;
}

export function getIncidents(): Incident[] {
  return getStore().incidents;
}

export function updateIncident(id: string, patch: Partial<Incident>): Incident | null {
  const store = getStore();
  const idx = store.incidents.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  store.incidents[idx] = { ...store.incidents[idx], ...patch };
  saveStore(store);
  return store.incidents[idx];
}

export function getTasks(): Task[] {
  return getStore().tasks;
}

export function addTask(input: Omit<Task, "id" | "createdAt">): Task {
  const store = getStore();
  const task: Task = { ...input, id: uid("task"), createdAt: Date.now() };
  store.tasks.push(task);
  saveStore(store);
  return task;
}

export function completeTask(id: string): Task | null {
  const store = getStore();
  const idx = store.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.tasks[idx].status = "completed";
  store.tasks[idx].completedAt = Date.now();
  saveStore(store);
  return store.tasks[idx];
}

export function getApprovals(): Approval[] {
  return getStore().approvals;
}

export function addApproval(input: Omit<Approval, "id" | "createdAt">): Approval {
  const store = getStore();
  const approval: Approval = { ...input, id: uid("appr"), createdAt: Date.now() };
  store.approvals.push(approval);
  saveStore(store);
  return approval;
}

export function reviewApproval(id: string, status: "approved" | "rejected", reviewedBy: string): Approval | null {
  const store = getStore();
  const idx = store.approvals.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.approvals[idx] = { ...store.approvals[idx], status, reviewedBy, reviewedAt: Date.now() };
  saveStore(store);
  return store.approvals[idx];
}

/* ================================================================== */
/*  MODULE 3: OPERATIONS CENTER                                        */
/* ================================================================== */

export function getPlatformHealth(): PlatformHealth {
  return {
    status: "healthy",
    uptime: 99.97,
    responseTime: 142,
    errorRate: 0.02,
    activeUsers: 4,
    lastIncident: Date.now() - 28800000,
    services: [
      { name: "Storefront", status: "operational", latency: 85 },
      { name: "Admin Panel", status: "operational", latency: 120 },
      { name: "API Gateway", status: "operational", latency: 45 },
      { name: "Marketplace Sync", status: "degraded", latency: 3400 },
      { name: "AI Services", status: "operational", latency: 320 },
      { name: "Search Index", status: "operational", latency: 65 },
      { name: "Analytics Pipeline", status: "operational", latency: 180 },
    ],
  };
}

export function getBusinessOverview(orders: any[], products: any[], customers: any[], affiliateProducts: any[], affiliates: any[]): BusinessOverview {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalProducts = products.length;
  const activeProducts = products.filter((p: any) => p.status === "published" || !p.status).length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
  const affiliateRevenue = affiliateProducts.reduce((s: number, p: any) => {
    const partner = affiliates.find((a: any) => a.name === p.affiliatePartner);
    return s + (partner ? (p.price * partner.commission) / 100 : 0);
  }, 0);

  return {
    totalRevenue, revenueGrowth: 12.5, totalOrders, orderGrowth: 8.3,
    totalCustomers, customerGrowth: 15.2, totalProducts, activeProducts,
    avgOrderValue: aov, conversionRate, totalAffiliateRevenue: affiliateRevenue, affiliateRevenueGrowth: 18.7,
  };
}

/* ================================================================== */
/*  MODULE 4: REPORTING PLATFORM                                       */
/* ================================================================== */

export function getReports(): Report[] {
  return getStore().reports;
}

export function addReport(input: Omit<Report, "id" | "createdAt">): Report {
  const store = getStore();
  const report: Report = { ...input, id: uid("rpt"), createdAt: Date.now() };
  store.reports.push(report);
  saveStore(store);
  return report;
}

export function deleteReport(id: string): boolean {
  const store = getStore();
  store.reports = store.reports.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

export function generateReport(reportId: string): ReportExecution {
  const store = getStore();
  const report = store.reports.find((r) => r.id === reportId);
  const execution: ReportExecution = {
    id: uid("rpe"), reportId,
    status: "running", rowCount: 0, startedAt: Date.now(),
  };
  store.reportExecutions.push(execution);
  report!.lastGenerated = Date.now();
  saveStore(store);

  // Simulate completion
  setTimeout(() => {
    const current = getStore();
    const exec = current.reportExecutions.find((e) => e.id === execution.id);
    if (exec) { exec.status = "completed"; exec.rowCount = Math.floor(Math.random() * 500) + 50; exec.completedAt = Date.now(); }
    saveStore(current);
  }, 2000);

  return execution;
}

/* ================================================================== */
/*  MODULE 5: AI ADMINISTRATION                                        */
/* ================================================================== */

export function getAiModels(): AiAdminModel[] {
  return getStore().aiModels;
}

export function getAiAgents(): AiAdminAgent[] {
  return getStore().aiAgents;
}

export function updateAiAgent(id: string, patch: Partial<AiAdminAgent>): AiAdminAgent | null {
  const store = getStore();
  const idx = store.aiAgents.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.aiAgents[idx] = { ...store.aiAgents[idx], ...patch };
  saveStore(store);
  return store.aiAgents[idx];
}

export function getAiPrompts(): AiAdminPrompt[] {
  return getStore().aiPrompts;
}

export function getAiUsage(): { totalTokens: number; totalCost: number; requestsByDay: { date: string; count: number }[] } {
  const models = getStore().aiModels;
  return {
    totalTokens: models.reduce((s, m) => s + m.tokensUsed, 0),
    totalCost: models.reduce((s, m) => s + m.tokensUsed * m.costPerToken, 0),
    requestsByDay: [
      { date: "Mon", count: 145 }, { date: "Tue", count: 230 }, { date: "Wed", count: 198 },
      { date: "Thu", count: 312 }, { date: "Fri", count: 176 }, { date: "Sat", count: 89 }, { date: "Sun", count: 67 },
    ],
  };
}

/* ================================================================== */
/*  MODULE 6: DEVELOPER TOOLS                                          */
/* ================================================================== */

export function getApiKeys(): ApiKey[] {
  return getStore().apiKeys;
}

export function addApiKey(input: Omit<ApiKey, "id" | "key" | "createdAt">): ApiKey {
  const store = getStore();
  const key = `ala_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("")}`;
  const apiKey: ApiKey = { ...input, id: uid("apik"), key, createdAt: Date.now() };
  store.apiKeys.push(apiKey);
  saveStore(store);
  return apiKey;
}

export function deleteApiKey(id: string): boolean {
  const store = getStore();
  store.apiKeys = store.apiKeys.filter((k) => k.id !== id);
  saveStore(store);
  return true;
}

export function getWebhooks(): Webhook[] {
  return getStore().webhooks;
}

export function addWebhook(input: Omit<Webhook, "id" | "createdAt">): Webhook {
  const store = getStore();
  const webhook: Webhook = { ...input, id: uid("wh"), createdAt: Date.now() };
  store.webhooks.push(webhook);
  saveStore(store);
  return webhook;
}

export function deleteWebhook(id: string): boolean {
  const store = getStore();
  store.webhooks = store.webhooks.filter((w) => w.id !== id);
  saveStore(store);
  return true;
}

export function getWebhookEvents(webhookId?: string): WebhookEvent[] {
  const all = getStore().webhookEvents;
  return webhookId ? all.filter((e) => e.webhookId === webhookId) : all;
}

/* ================================================================== */
/*  MODULE 7: ADMINISTRATION                                           */
/* ================================================================== */

export function getAdminUsers(): AdminUser[] {
  return getStore().adminUsers;
}

export function getAdminRoles(): AdminRole[] {
  return getStore().adminRoles;
}

export function addAdminUser(input: Omit<AdminUser, "id" | "createdAt">): AdminUser {
  const store = getStore();
  const user: AdminUser = { ...input, id: uid("au"), createdAt: Date.now() };
  store.adminUsers.push(user);
  saveStore(store);
  return user;
}

export function updateAdminUser(id: string, patch: Partial<AdminUser>): AdminUser | null {
  const store = getStore();
  const idx = store.adminUsers.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store.adminUsers[idx] = { ...store.adminUsers[idx], ...patch };
  saveStore(store);
  return store.adminUsers[idx];
}

export function getFeatureFlags(): FeatureFlag[] {
  return getStore().featureFlags;
}

export function updateFeatureFlag(id: string, patch: Partial<FeatureFlag>): FeatureFlag | null {
  const store = getStore();
  const idx = store.featureFlags.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  store.featureFlags[idx] = { ...store.featureFlags[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.featureFlags[idx];
}

export function getRecentActions(limit = 20): AuditLog[] {
  return getStore().recentActions.slice(0, limit);
}

export function recordAction(input: Omit<AuditLog, "id" | "ts">) {
  const store = getStore();
  const entry: AuditLog = { ...input, id: uid("act"), ts: Date.now() };
  store.recentActions.unshift(entry);
  if (store.recentActions.length > MAX_RECENT_ACTIONS) store.recentActions = store.recentActions.slice(0, MAX_RECENT_ACTIONS);
  saveStore(store);
}

/* ================================================================== */
/*  ADMIN PORTAL STATS                                                 */
/* ================================================================== */

export interface AdminPortalStats {
  totalNotifications: number;
  unreadNotifications: number;
  activeIncidents: number;
  pendingTasks: number;
  pendingApprovals: number;
  activeWorkspaces: number;
  totalReports: number;
  activeAiModels: number;
  activeAiAgents: number;
  totalApiKeys: number;
  activeWebhooks: number;
  totalAdminUsers: number;
  featureFlagsEnabled: number;
}

export function getAdminPortalStats(): AdminPortalStats {
  const store = getStore();
  return {
    totalNotifications: store.notifications.length,
    unreadNotifications: store.notifications.filter((n) => !n.read && !n.dismissed).length,
    activeIncidents: store.incidents.filter((i) => i.status !== "resolved").length,
    pendingTasks: store.tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
    pendingApprovals: store.approvals.filter((a) => a.status === "pending").length,
    activeWorkspaces: store.workspaces.filter((w) => w.pinned).length,
    totalReports: store.reports.length,
    activeAiModels: store.aiModels.filter((m) => m.status === "active").length,
    activeAiAgents: store.aiAgents.filter((a) => a.status === "active").length,
    totalApiKeys: store.apiKeys.filter((k) => k.active).length,
    activeWebhooks: store.webhooks.filter((w) => w.active).length,
    totalAdminUsers: store.adminUsers.filter((u) => u.active).length,
    featureFlagsEnabled: store.featureFlags.filter((f) => f.status === "enabled").length,
  };
}
