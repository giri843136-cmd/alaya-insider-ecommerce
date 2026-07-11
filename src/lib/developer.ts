/**
 * ALAYA INSIDER — Developer Platform Engine
 * -----------------------------------------------------------------
 * Extension registry, event bus, webhook platform, feature flags,
 * API health, and version management. The platform's extensibility layer.
 */

/* ----------------------------- Versions -------------------------------- */

export const CORE_VERSION = "1.0.0";
export const FRAMEWORK_VERSION = "React 19 + Vite 7";
export const DB_VERSION = "v10";

export interface VersionInfo {
  core: string;
  framework: string;
  database: string;
  schema: string;
  build: string;
}

export const versionInfo: VersionInfo = {
  core: CORE_VERSION,
  framework: FRAMEWORK_VERSION,
  database: DB_VERSION,
  schema: "schema-2026-01",
  build: `build.${Date.now().toString(36)}`,
};

/* --------------------------- Extension types --------------------------- */

export type ExtensionCategory =
  | "payment" | "shipping" | "affiliate" | "ai" | "analytics"
  | "marketing" | "email" | "sms" | "search" | "theme" | "language" | "integration" | "widget";

export type ExtensionStatus = "active" | "disabled" | "error";

export interface Extension {
  id: string;
  name: string;
  description: string;
  category: ExtensionCategory;
  version: string;
  author: string;
  status: ExtensionStatus;
  official: boolean;
  installedAt: number;
  config?: Record<string, string>;
}

/* ------------------------- Seeded extensions --------------------------- */

export const seedExtensions: Extension[] = [
  { id: "ext_stripe", name: "Stripe Payments", description: "Card payments via Stripe with 3DS support.", category: "payment", version: "2.4.1", author: "ALAYA Official", status: "active", official: true, installedAt: Date.now() - 90 * 86400000, config: { mode: "live", webhook_secret: "whsec_••••" } },
  { id: "ext_paypal", name: "PayPal Checkout", description: "PayPal & Pay Later integration.", category: "payment", version: "1.8.0", author: "ALAYA Official", status: "active", official: true, installedAt: Date.now() - 90 * 86400000 },
  { id: "ext_razorpay", name: "Razorpay UPI", description: "UPI & wallet payments for India.", category: "payment", version: "1.2.0", author: "ALAYA Official", status: "active", official: true, installedAt: Date.now() - 30 * 86400000, config: { mode: "sandbox" } },
  { id: "ext_dhl", name: "DHL Express", description: "Real-time DHL shipping rates & tracking.", category: "shipping", version: "3.1.0", author: "DHL", status: "active", official: false, installedAt: Date.now() - 60 * 86400000 },
  { id: "ext_fedex", name: "FedEx Shipping", description: "FedEx ground & express rates.", category: "shipping", version: "2.0.3", author: "FedEx", status: "disabled", official: false, installedAt: Date.now() - 60 * 86400000 },
  { id: "ext_amazon_aff", name: "Amazon Associates", description: "Affiliate product sync & tracking.", category: "affiliate", version: "1.5.2", author: "ALAYA Official", status: "active", official: true, installedAt: Date.now() - 120 * 86400000 },
  { id: "ext_impact", name: "Impact Network", description: "Impact affiliate tracking & reporting.", category: "affiliate", version: "1.1.0", author: "Impact", status: "active", official: false, installedAt: Date.now() - 45 * 86400000 },
  { id: "ext_openai", name: "OpenAI Provider", description: "GPT-4 for content generation & SEO.", category: "ai", version: "1.0.0", author: "ALAYA Official", status: "disabled", official: true, installedAt: Date.now() - 14 * 86400000, config: { api_key: "sk-••••" } },
  { id: "ext_ga4", name: "Google Analytics 4", description: "GA4 event tracking & ecommerce.", category: "analytics", version: "2.2.0", author: "Google", status: "active", official: false, installedAt: Date.now() - 100 * 86400000 },
  { id: "ext_mailgun", name: "Mailgun Email", description: "Transactional & marketing email.", category: "email", version: "1.9.0", author: "Mailgun", status: "active", official: false, installedAt: Date.now() - 80 * 86400000 },
  { id: "ext_algolia", name: "Algolia Search", description: "Instant search with typo tolerance.", category: "search", version: "1.3.1", author: "Algolia", status: "disabled", official: false, installedAt: Date.now() - 20 * 86400000 },
  { id: "ext_dark_theme", name: "Midnight Theme", description: "Premium dark theme pack.", category: "theme", version: "1.0.0", author: "ALAYA Official", status: "active", official: true, installedAt: Date.now() - 200 * 86400000 },
  { id: "ext_fr_pack", name: "Français Language Pack", description: "Complete French translations.", category: "language", version: "1.0.0", author: "ALAYA Official", status: "active", official: true, installedAt: Date.now() - 50 * 86400000 },
  { id: "ext_twilio", name: "Twilio SMS", description: "SMS notifications & OTP.", category: "sms", version: "1.1.0", author: "Twilio", status: "disabled", official: false, installedAt: Date.now() - 10 * 86400000 },
];

/* --------------------------- Category labels --------------------------- */

export const CATEGORY_LABELS: Record<ExtensionCategory, string> = {
  payment: "Payment Gateway",
  shipping: "Shipping Provider",
  affiliate: "Affiliate Network",
  ai: "AI Provider",
  analytics: "Analytics",
  marketing: "Marketing",
  email: "Email Service",
  sms: "SMS Service",
  search: "Search Engine",
  theme: "Theme",
  language: "Language Pack",
  integration: "Integration",
  widget: "Widget",
};

/* --------------------------- Feature flags ----------------------------- */

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: "commerce" | "content" | "marketing" | "developer" | "experimental";
}

export const seedFlags: FeatureFlag[] = [
  { key: "headless_api", label: "Headless API", description: "Full REST/GraphQL access", enabled: true, category: "developer" },
  { key: "webhooks", label: "Webhook Platform", description: "Outgoing webhook delivery", enabled: true, category: "developer" },
  { key: "ai_workspace", label: "AI Workspace", description: "AI content generation", enabled: true, category: "developer" },
  { key: "workflows", label: "Workflow Engine", description: "Automation builder", enabled: true, category: "developer" },
  { key: "multi_vendor", label: "Multi-vendor", description: "Marketplace mode (future)", enabled: false, category: "experimental" },
  { key: "subscriptions", label: "Subscriptions", description: "Recurring billing (future)", enabled: false, category: "experimental" },
  { key: "visual_search", label: "Visual Search", description: "Image-based search (future)", enabled: false, category: "experimental" },
  { key: "ar_tryon", label: "AR Try-On", description: "Augmented reality (future)", enabled: false, category: "experimental" },
];

/* --------------------------- Webhook platform -------------------------- */

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastDelivery?: number;
  lastStatus?: "success" | "failed";
  deliveries: number;
  failures: number;
}

export const seedWebhooks: Webhook[] = [
  { id: "wh_orders", url: "https://api.partner.com/orders", events: ["order.created", "order.paid", "order.shipped"], secret: "whsec_••••", active: true, lastDelivery: Date.now() - 3600000, lastStatus: "success", deliveries: 1248, failures: 3 },
  { id: "wh_inventory", url: "https://erp.company.com/stock", events: ["product.stock_changed", "product.low_stock"], secret: "whsec_••••", active: true, lastDelivery: Date.now() - 7200000, lastStatus: "success", deliveries: 892, failures: 1 },
  { id: "wh_crm", url: "https://crm.example.com/hooks", events: ["customer.registered", "review.submitted"], secret: "whsec_••••", active: false, deliveries: 0, failures: 0 },
];

/* --------------------------- Event bus --------------------------------- */

export interface BusEvent {
  id: string;
  name: string;
  payload: string;
  ts: number;
  subscribers: number;
}

const busLog: BusEvent[] = [];

export function publishEvent(name: string, payload: string, subscribers = 0): BusEvent {
  const evt: BusEvent = { id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, payload, ts: Date.now(), subscribers };
  busLog.unshift(evt);
  if (busLog.length > 100) busLog.pop();
  return evt;
}

export function getBusEvents(): BusEvent[] {
  return [...busLog];
}

/* --------------------------- API health -------------------------------- */

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  rateLimited: boolean;
}

export const apiEndpoints: ApiEndpoint[] = [
  { method: "GET", path: "/api/v1/products", description: "List products (paginated, filterable)", auth: false, rateLimited: true },
  { method: "GET", path: "/api/v1/products/:slug", description: "Get a single product", auth: false, rateLimited: true },
  { method: "POST", path: "/api/v1/products", description: "Create a product", auth: true, rateLimited: true },
  { method: "PUT", path: "/api/v1/products/:id", description: "Update a product", auth: true, rateLimited: true },
  { method: "DELETE", path: "/api/v1/products/:id", description: "Delete a product", auth: true, rateLimited: true },
  { method: "GET", path: "/api/v1/orders", description: "List orders", auth: true, rateLimited: true },
  { method: "POST", path: "/api/v1/orders", description: "Create an order", auth: false, rateLimited: true },
  { method: "GET", path: "/api/v1/customers", description: "List customers", auth: true, rateLimited: true },
  { method: "GET", path: "/api/v1/brands", description: "List brands", auth: false, rateLimited: true },
  { method: "GET", path: "/api/v1/articles", description: "List articles", auth: false, rateLimited: true },
  { method: "GET", path: "/api/v1/search", description: "Search across catalogue", auth: false, rateLimited: true },
  { method: "POST", path: "/api/v1/webhooks/subscribe", description: "Subscribe to webhooks", auth: true, rateLimited: false },
  { method: "GET", path: "/api/v1/analytics/overview", description: "Analytics dashboard data", auth: true, rateLimited: true },
  { method: "POST", path: "/api/v1/import/products", description: "Bulk import products (CSV)", auth: true, rateLimited: false },
  { method: "GET", path: "/api/v1/export/:type", description: "Export data (CSV/JSON)", auth: true, rateLimited: false },
];

/* --------------------------- System events ----------------------------- */

export interface SystemEvent {
  id: string;
  ts: number;
  level: "info" | "warning" | "error";
  source: string;
  message: string;
}

const sysLog: SystemEvent[] = [];

export function logSystem(level: SystemEvent["level"], source: string, message: string): SystemEvent {
  const evt: SystemEvent = { id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ts: Date.now(), level, source, message };
  sysLog.unshift(evt);
  if (sysLog.length > 100) sysLog.pop();
  return evt;
}

export function getSystemEvents(): SystemEvent[] {
  return [...sysLog];
}

/** Seed a few initial system events. */
[
  { level: "info", source: "system", message: "Application started successfully" },
  { level: "info", source: "database", message: "Database connection established (v10)" },
  { level: "info", source: "cache", message: "Object cache primed — 248 keys" },
  { level: "info", source: "search", message: "Search index built — 24 products indexed" },
  { level: "warning", source: "extension", message: "Twilio SMS extension disabled — API key not configured" },
].forEach((e) => logSystem(e.level as SystemEvent["level"], e.source, e.message));

/* --------------------------- Cron jobs --------------------------------- */

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun?: number;
  nextRun?: number;
  status: "running" | "idle" | "error";
}

export const cronJobs: CronJob[] = [
  { id: "cron_sitemap", name: "Generate sitemap", schedule: "Daily · 02:00", lastRun: Date.now() - 20 * 3600000, nextRun: Date.now() + 4 * 3600000, status: "idle" },
  { id: "cron_backup", name: "Automatic backup", schedule: "Daily · 03:00", lastRun: Date.now() - 20 * 3600000, nextRun: Date.now() + 4 * 3600000, status: "idle" },
  { id: "cron_index", name: "Rebuild search index", schedule: "Hourly", lastRun: Date.now() - 30 * 60000, nextRun: Date.now() + 30 * 60000, status: "idle" },
  { id: "cron_seo", name: "SEO score recalculation", schedule: "Weekly · Sun 01:00", lastRun: Date.now() - 3 * 86400000, nextRun: Date.now() + 4 * 86400000, status: "idle" },
  { id: "cron_aff", name: "Affiliate link validation", schedule: "Daily · 04:00", lastRun: Date.now() - 20 * 3600000, nextRun: Date.now() + 4 * 3600000, status: "idle" },
  { id: "cron_email", name: "Send scheduled emails", schedule: "Every 5 min", lastRun: Date.now() - 3 * 60000, nextRun: Date.now() + 2 * 60000, status: "running" },
];

/* --------------------------- SDK info ---------------------------------- */

export const sdks = [
  { name: "JavaScript", version: "1.0.0", status: "stable", install: "npm install @alaya/sdk-js" },
  { name: "TypeScript", version: "1.0.0", status: "stable", install: "npm install @alaya/sdk-ts" },
  { name: "PHP", version: "0.9.0", status: "beta", install: "composer require alaya/sdk-php" },
  { name: "Python", version: "0.9.0", status: "beta", install: "pip install alaya-sdk" },
];

/* --------------------------- Persistence ------------------------------- */

const EXT_KEY = "alaya_extensions";
const FLAG_KEY = "alaya_feature_flags";
const WH_KEY = "alaya_webhooks";

export function loadExtensions(): Extension[] {
  try {
    const raw = localStorage.getItem(EXT_KEY);
    if (!raw) { localStorage.setItem(EXT_KEY, JSON.stringify(seedExtensions)); return seedExtensions; }
    return JSON.parse(raw);
  } catch { return seedExtensions; }
}
export function saveExtensions(list: Extension[]) {
  try { localStorage.setItem(EXT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function loadFlags(): FeatureFlag[] {
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    if (!raw) { localStorage.setItem(FLAG_KEY, JSON.stringify(seedFlags)); return seedFlags; }
    return JSON.parse(raw);
  } catch { return seedFlags; }
}
export function saveFlags(list: FeatureFlag[]) {
  try { localStorage.setItem(FLAG_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function loadWebhooks(): Webhook[] {
  try {
    const raw = localStorage.getItem(WH_KEY);
    if (!raw) { localStorage.setItem(WH_KEY, JSON.stringify(seedWebhooks)); return seedWebhooks; }
    return JSON.parse(raw);
  } catch { return seedWebhooks; }
}
export function saveWebhooks(list: Webhook[]) {
  try { localStorage.setItem(WH_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
