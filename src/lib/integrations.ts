/**
 * ALAYA INSIDER — Enterprise Integration Platform
 * ------------------------------------------------------------------
 * Third-party connector framework, connector SDK, plugin SDK,
 * integration marketplace, event-driven integration, and message queue.
 */
import { uid } from "./utils";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const INTEGRATION_STORAGE_KEY = "alaya_integration_store";
export const MAX_RETRY_DELAY_MS = 300000;
export const MESSAGE_TTL_MS = 86400000;

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type ConnectorStatus = "active" | "inactive" | "error" | "configuring";
export type ConnectorAuthType = "api_key" | "oauth2" | "basic" | "jwt" | "mutual_tls";
export type IntegrationCategory =
  | "affiliate" | "payment" | "shipping" | "email" | "sms" | "search"
  | "analytics" | "crm" | "erp" | "social" | "marketplace" | "tax"
  | "fraud" | "reviews" | "loyalty" | "translation" | "cdn" | "other";

export type MessagePriority = "high" | "normal" | "low";
export type MessageStatus = "pending" | "processing" | "completed" | "failed" | "retrying";

/* ================================================================== */
/*  INTERFACES                                                         */
/* ================================================================== */

export interface ConnectorProvider {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  website: string;
  docsUrl: string;
  authType: ConnectorAuthType;
  version: string;
  author: string;
  official: boolean;
  configFields: ConnectorConfigField[];
  events: string[];
  actions: string[];
  capabilities: string[];
  pricing: "free" | "freemium" | "paid" | "enterprise";
  installed: boolean;
  status: ConnectorStatus;
}

export interface ConnectorConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "boolean";
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

export interface ConnectorInstance {
  id: string;
  providerId: string;
  name: string;
  config: Record<string, string>;
  status: ConnectorStatus;
  lastSync?: number;
  syncInterval: number;
  errorCount: number;
  lastError?: string;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface IntegrationEvent {
  id: string;
  source: string;
  type: string;
  payload: string;
  ts: number;
  processed: boolean;
}

export interface IntegrationFlow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  lastRun?: number;
  runCount: number;
}

export interface ConnectorSdkPackage {
  id: string;
  name: string;
  description: string;
  language: string;
  version: string;
  install: string;
  status: "stable" | "beta" | "alpha";
  docs: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  hooks: string[];
  permissions: string[];
  settings: Record<string, string>;
}

export interface QueueMessage {
  id: string;
  queue: string;
  payload: string;
  priority: MessagePriority;
  status: MessageStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  processedAt?: number;
  error?: string;
}

/* ================================================================== */
/*  INTEGRATION STORE                                                  */
/* ================================================================== */

interface IntegrationStore {
  connectors: ConnectorProvider[];
  instances: ConnectorInstance[];
  events: IntegrationEvent[];
  flows: IntegrationFlow[];
  messages: QueueMessage[];
  plugins: PluginManifest[];
}

function getStore(): IntegrationStore {
  try {
    const raw = localStorage.getItem(INTEGRATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IntegrationStore;
  } catch { /* ignore */ }
  return { connectors: [], instances: [], events: [], flows: [], messages: [], plugins: [] };
}

function saveStore(store: IntegrationStore) {
  try { localStorage.setItem(INTEGRATION_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA: CONNECTOR PROVIDERS                                     */
/* ================================================================== */

function seedIntegrationData() {
  const store = getStore();
  if (store.connectors.length > 0) return;

  const connectors: ConnectorProvider[] = [
    {
      id: "conn_amazon", name: "Amazon Associates", description: "Product catalog sync, affiliate link generation, and commission tracking via Amazon's PA-API.",
      category: "affiliate", website: "https://affiliate-program.amazon.com", docsUrl: "https://webservices.amazon.com/paapi5/documentation/",
      authType: "api_key", version: "5.0.0", author: "Amazon", official: true,
      configFields: [
        { key: "api_key", label: "API Key", type: "password", required: true },
        { key: "associate_tag", label: "Associate Tag", type: "text", required: true },
        { key: "marketplace", label: "Marketplace", type: "select", required: true, options: ["US", "UK", "DE", "FR", "JP", "CA"], defaultValue: "US" },
      ],
      events: ["product.synced", "commission.earned", "link.clicked"],
      actions: ["search_products", "generate_link", "get_commission_report"],
      capabilities: ["Product search", "Commission tracking", "Link generation", "Category browsing"],
      pricing: "free", installed: false, status: "inactive",
    },
    {
      id: "conn_impact", name: "Impact Network", description: "Enterprise affiliate partnership management with real-time tracking and reporting.",
      category: "affiliate", website: "https://impact.com", docsUrl: "https://developer.impact.com/",
      authType: "oauth2", version: "2.0.0", author: "Impact", official: false,
      configFields: [
        { key: "client_id", label: "Client ID", type: "text", required: true },
        { key: "client_secret", label: "Client Secret", type: "password", required: true },
        { key: "account_id", label: "Account SID", type: "text", required: true },
      ],
      events: ["conversion.tracked", "commission.paid", "partner.joined"],
      actions: ["track_conversion", "get_partners", "get_commissions"],
      capabilities: ["Partner management", "Conversion tracking", "Commission reports", "Creative management"],
      pricing: "paid", installed: false, status: "inactive",
    },
    {
      id: "conn_cj", name: "CJ Affiliate", description: "Commission Junction affiliate network with thousands of advertisers and automated link management.",
      category: "affiliate", website: "https://www.cj.com", docsUrl: "https://developers.cj.com/",
      authType: "api_key", version: "3.0.0", author: "CJ Affiliate", official: false,
      configFields: [
        { key: "api_key", label: "API Key", type: "password", required: true },
        { key: "website_id", label: "Website ID", type: "text", required: true },
      ],
      events: ["commission.posted", "advertiser.approved", "link.clicked"],
      actions: ["search_advertisers", "get_commissions", "get_links"],
      capabilities: ["Advertiser search", "Link management", "Commission data", "Performance reports"],
      pricing: "free", installed: false, status: "inactive",
    },
    {
      id: "conn_awin", name: "Awin", description: "Global affiliate network connecting advertisers with publishers across 200+ markets.",
      category: "affiliate", website: "https://www.awin.com", docsUrl: "https://wiki.awin.com/",
      authType: "api_key", version: "3.0.0", author: "Awin", official: false,
      configFields: [
        { key: "api_token", label: "API Token", type: "password", required: true },
        { key: "publisher_id", label: "Publisher ID", type: "text", required: true },
      ],
      events: ["commission.pending", "sale.confirmed", "click.recorded"],
      actions: ["get_transactions", "get_programmes", "get_commission_groups"],
      capabilities: ["Transaction reporting", "Programme search", "Commission groups", "Deep linking"],
      pricing: "free", installed: false, status: "inactive",
    },
    {
      id: "conn_shareasale", name: "ShareASale", description: "Performance-based affiliate marketing network with 3,900+ merchants.",
      category: "affiliate", website: "https://www.shareasale.com", docsUrl: "https://www.shareasale.com/shareasale_api.cfm",
      authType: "api_key", version: "2.0.0", author: "ShareASale", official: false,
      configFields: [
        { key: "api_token", label: "API Token", type: "password", required: true },
        { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
      ],
      events: ["commission.credited", "sale.voided", "merchant.joined"],
      actions: ["get_activity", "get_merchants", "get_commissions"],
      capabilities: ["Activity reporting", "Merchant directory", "Commission history", "Creative library"],
      pricing: "free", installed: false, status: "inactive",
    },
    {
      id: "conn_stripe", name: "Stripe", description: "Payment processing platform with support for 135+ currencies, subscriptions, and real-time reporting.",
      category: "payment", website: "https://stripe.com", docsUrl: "https://stripe.com/docs/api",
      authType: "api_key", version: "2024-01", author: "Stripe", official: true,
      configFields: [
        { key: "secret_key", label: "Secret Key", type: "password", required: true },
        { key: "publishable_key", label: "Publishable Key", type: "text", required: true },
        { key: "webhook_secret", label: "Webhook Secret", type: "password", required: false },
        { key: "mode", label: "Mode", type: "select", required: true, options: ["live", "test"], defaultValue: "test" },
      ],
      events: ["payment.succeeded", "payment.failed", "charge.refunded", "subscription.updated"],
      actions: ["create_payment", "refund_charge", "create_subscription", "list_transactions"],
      capabilities: ["Card payments", "Subscriptions", "Refunds", "Dispute management", "Invoicing"],
      pricing: "freemium", installed: true, status: "active",
    },
    {
      id: "conn_paypal", name: "PayPal", description: "Global payment platform with PayPal Checkout, Venmo, Pay Later, and merchant services.",
      category: "payment", website: "https://paypal.com", docsUrl: "https://developer.paypal.com/docs/api/",
      authType: "oauth2", version: "2.0.0", author: "PayPal", official: true,
      configFields: [
        { key: "client_id", label: "Client ID", type: "text", required: true },
        { key: "client_secret", label: "Client Secret", type: "password", required: true },
        { key: "mode", label: "Mode", type: "select", required: true, options: ["live", "sandbox"], defaultValue: "sandbox" },
      ],
      events: ["payment.completed", "payment.denied", "subscription.cancelled", "dispute.opened"],
      actions: ["create_order", "capture_payment", "create_subscription", "get_transaction"],
      capabilities: ["PayPal Checkout", "Venmo", "Pay Later", "Subscription billing", "Dispute resolution"],
      pricing: "freemium", installed: true, status: "active",
    },
    {
      id: "conn_mailchimp", name: "Mailchimp", description: "Email marketing automation platform with audience management, campaigns, and analytics.",
      category: "email", website: "https://mailchimp.com", docsUrl: "https://mailchimp.com/developer/",
      authType: "api_key", version: "3.0.0", author: "Mailchimp", official: false,
      configFields: [
        { key: "api_key", label: "API Key", type: "password", required: true },
        { key: "server_prefix", label: "Server Prefix", type: "text", required: true, placeholder: "us1" },
        { key: "audience_id", label: "Audience ID", type: "text", required: false },
      ],
      events: ["subscriber.added", "campaign.sent", "email.opened", "link.clicked"],
      actions: ["add_subscriber", "create_campaign", "send_email", "get_reports"],
      capabilities: ["Audience management", "Email campaigns", "Automation", "Analytics", "Segmentation"],
      pricing: "freemium", installed: false, status: "inactive",
    },
    {
      id: "conn_shopify", name: "Shopify", description: "List products on Shopify marketplace and sync inventory, orders, and fulfillment.",
      category: "marketplace", website: "https://shopify.com", docsUrl: "https://shopify.dev/docs/api",
      authType: "oauth2", version: "2024-01", author: "Shopify", official: false,
      configFields: [
        { key: "store_url", label: "Store URL", type: "text", required: true, placeholder: "mystore.myshopify.com" },
        { key: "access_token", label: "Access Token", type: "password", required: true },
        { key: "api_version", label: "API Version", type: "select", required: true, options: ["2024-01", "2023-10", "2023-07"], defaultValue: "2024-01" },
      ],
      events: ["order.created", "product.synced", "fulfillment.created", "inventory.updated"],
      actions: ["sync_products", "get_orders", "update_inventory", "create_fulfillment"],
      capabilities: ["Product sync", "Order management", "Inventory sync", "Fulfillment"],
      pricing: "paid", installed: false, status: "inactive",
    },
    {
      id: "conn_google_analytics", name: "Google Analytics 4", description: "Web and app analytics with ecommerce tracking, user behavior, and conversion analysis.",
      category: "analytics", website: "https://analytics.google.com", docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
      authType: "oauth2", version: "1.0.0", author: "Google", official: false,
      configFields: [
        { key: "measurement_id", label: "Measurement ID", type: "text", required: true, placeholder: "G-XXXXXXXXXX" },
        { key: "api_secret", label: "API Secret", type: "password", required: true },
      ],
      events: ["page_view", "purchase.tracked", "conversion.recorded"],
      actions: ["track_event", "get_report", "get_realtime"],
      capabilities: ["Event tracking", "Ecommerce tracking", "Real-time analytics", "Audience reports"],
      pricing: "free", installed: true, status: "active",
    },
    {
      id: "conn_twilio", name: "Twilio SendGrid", description: "Email delivery and SMS platform for transactional and marketing communications.",
      category: "email", website: "https://sendgrid.com", docsUrl: "https://docs.sendgrid.com/api-reference",
      authType: "api_key", version: "3.0.0", author: "Twilio", official: false,
      configFields: [
        { key: "api_key", label: "API Key", type: "password", required: true },
        { key: "from_email", label: "From Email", type: "text", required: true },
        { key: "from_name", label: "From Name", type: "text", required: false },
      ],
      events: ["email.sent", "email.delivered", "email.opened", "email.bounced"],
      actions: ["send_email", "send_template", "get_stats", "manage_lists"],
      capabilities: ["Email send", "Template engine", "Delivery analytics", "List management"],
      pricing: "freemium", installed: false, status: "inactive",
    },
    {
      id: "conn_algolia", name: "Algolia", description: "AI-powered search and discovery platform with typo tolerance, faceting, and personalization.",
      category: "search", website: "https://algolia.com", docsUrl: "https://www.algolia.com/doc/",
      authType: "api_key", version: "1.0.0", author: "Algolia", official: false,
      configFields: [
        { key: "app_id", label: "Application ID", type: "text", required: true },
        { key: "admin_api_key", label: "Admin API Key", type: "password", required: true },
        { key: "search_api_key", label: "Search API Key", type: "password", required: true },
        { key: "index_name", label: "Index Name", type: "text", required: true },
      ],
      events: ["index.updated", "search.quota_warning"],
      actions: ["index_products", "update_settings", "clear_index", "get_logs"],
      capabilities: ["Full-text search", "Faceting", "Typo tolerance", "Personalization", "Analytics"],
      pricing: "freemium", installed: false, status: "inactive",
    },
  ];

  const flows: IntegrationFlow[] = [
    { id: "flow_1", name: "Sync Products to Shopify", description: "Automatically sync new and updated products to Shopify marketplace.", trigger: "product.created", actions: ["conn_shopify"], enabled: false, runCount: 0 },
    { id: "flow_2", name: "Send Welcome Email", description: "Send welcome email via Mailchimp when customer registers.", trigger: "customer.registered", actions: ["conn_mailchimp"], enabled: false, runCount: 0 },
    { id: "flow_3", name: "Update Affiliate Networks", description: "Update product feed to all affiliate networks on price change.", trigger: "price.changed", actions: ["conn_amazon", "conn_cj", "conn_awin"], enabled: false, runCount: 0 },
    { id: "flow_4", name: "Track Purchase in GA4", description: "Send purchase event to Google Analytics 4 on order completion.", trigger: "order.paid", actions: ["conn_google_analytics"], enabled: true, runCount: 142, lastRun: Date.now() - 3600000 },
  ];

  store.connectors = connectors;
  store.flows = flows;
  saveStore(store);
}

seedIntegrationData();

/* ================================================================== */
/*  CONNECTOR MANAGEMENT                                               */
/* ================================================================== */

export function getConnectors(): ConnectorProvider[] {
  return getStore().connectors;
}

export function getConnector(id: string): ConnectorProvider | undefined {
  return getStore().connectors.find((c) => c.id === id);
}

export function getConnectorInstances(): ConnectorInstance[] {
  return getStore().instances;
}

export function installConnector(providerId: string, name: string, config: Record<string, string>): ConnectorInstance | null {
  const provider = getConnector(providerId);
  if (!provider) return null;

  const store = getStore();
  const instance: ConnectorInstance = {
    id: uid("conn_inst"),
    providerId,
    name,
    config,
    status: "active",
    syncInterval: 3600,
    errorCount: 0,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.instances.push(instance);
  provider.installed = true;
  provider.status = "active";
  saveStore(store);
  return instance;
}

export function uninstallConnector(instanceId: string): boolean {
  const store = getStore();
  const idx = store.instances.findIndex((i) => i.id === instanceId);
  if (idx === -1) return false;
  const instance = store.instances[idx];
  store.instances.splice(idx, 1);

  // Reset provider status if no more instances
  const remaining = store.instances.filter((i) => i.providerId === instance.providerId);
  if (remaining.length === 0) {
    const provider = store.connectors.find((c) => c.id === instance.providerId);
    if (provider) { provider.installed = false; provider.status = "inactive"; }
  }

  saveStore(store);
  return true;
}

export function updateConnectorInstance(id: string, patch: Partial<ConnectorInstance>): ConnectorInstance | null {
  const store = getStore();
  const idx = store.instances.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  store.instances[idx] = { ...store.instances[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.instances[idx];
}

/* ================================================================== */
/*  INTEGRATION FLOWS                                                  */
/* ================================================================== */

export function getIntegrationFlows(): IntegrationFlow[] {
  return getStore().flows;
}

export function createIntegrationFlow(input: Omit<IntegrationFlow, "id" | "runCount">): IntegrationFlow {
  const store = getStore();
  const flow: IntegrationFlow = { ...input, id: uid("flow"), runCount: 0 };
  store.flows.push(flow);
  saveStore(store);
  return flow;
}

export function toggleFlow(id: string): boolean {
  const store = getStore();
  const flow = store.flows.find((f) => f.id === id);
  if (!flow) return false;
  flow.enabled = !flow.enabled;
  saveStore(store);
  return true;
}

export function deleteFlow(id: string): boolean {
  const store = getStore();
  store.flows = store.flows.filter((f) => f.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  MESSAGE QUEUE                                                      */
/* ================================================================== */

export function getQueueMessages(queue?: string): QueueMessage[] {
  const store = getStore();
  let msgs = [...store.messages].reverse();
  if (queue) msgs = msgs.filter((m) => m.queue === queue);
  return msgs.slice(0, 100);
}

export function enqueueMessage(queue: string, payload: string, priority: MessagePriority = "normal", maxRetries = 3): QueueMessage {
  const store = getStore();
  const msg: QueueMessage = {
    id: uid("qmsg"),
    queue,
    payload,
    priority,
    status: "pending",
    retryCount: 0,
    maxRetries,
    createdAt: Date.now(),
  };
  store.messages.push(msg);
  saveStore(store);
  return msg;
}

export function processMessage(id: string, success: boolean, error?: string): boolean {
  const store = getStore();
  const msg = store.messages.find((m) => m.id === id);
  if (!msg) return false;

  if (success) {
    msg.status = "completed";
    msg.processedAt = Date.now();
  } else {
    msg.retryCount++;
    if (msg.retryCount >= msg.maxRetries) {
      msg.status = "failed";
      msg.error = error || "Max retries exceeded";
    } else {
      msg.status = "retrying";
      msg.error = error;
    }
  }

  saveStore(store);
  return true;
}

/* ================================================================== */
/*  SDK & PLUGIN MANAGEMENT                                            */
/* ================================================================== */

export function getSdkPackages(): ConnectorSdkPackage[] {
  return [
    { id: "sdk_js", name: "ALAYA Connector SDK (JavaScript)", description: "Build custom connectors using JavaScript/TypeScript.", language: "JavaScript", version: "1.0.0", install: "npm install @alaya/connector-sdk", status: "stable", docs: "https://developers.alayainsider.com/connector-sdk/js" },
    { id: "sdk_py", name: "ALAYA Connector SDK (Python)", description: "Python SDK for building data connectors.", language: "Python", version: "0.9.0", install: "pip install alaya-connector-sdk", status: "beta", docs: "https://developers.alayainsider.com/connector-sdk/python" },
    { id: "sdk_fs", name: "ALAYA Plugin API", description: "Build plugins that hook into core platform events.", language: "TypeScript", version: "1.0.0", install: "npm install @alaya/plugin-api", status: "stable", docs: "https://developers.alayainsider.com/plugin-api" },
    { id: "sdk_webhook", name: "Webhook SDK", description: "Send and receive webhooks with signature verification.", language: "TypeScript", version: "1.0.0", install: "npm install @alaya/webhook-sdk", status: "stable", docs: "https://developers.alayainsider.com/webhooks" },
  ];
}

export function getInstalledPlugins(): PluginManifest[] {
  return getStore().plugins;
}

export function registerPlugin(manifest: Omit<PluginManifest, "id">): PluginManifest {
  const store = getStore();
  const plugin: PluginManifest = { ...manifest, id: uid("plugin") };
  store.plugins.push(plugin);
  saveStore(store);
  return plugin;
}

export function uninstallPlugin(id: string): boolean {
  const store = getStore();
  store.plugins = store.plugins.filter((p) => p.id !== id);
  saveStore(store);
  return true;
}
