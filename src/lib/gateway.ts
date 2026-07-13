/**
 * ALAYA INSIDER — Enterprise API Gateway & Integration Platform
 * ------------------------------------------------------------------
 * Central API gateway: registry, rate limiting, validation, webhook platform,
 * circuit breakers, analytics, documentation, and lifecycle management.
 *
 * Serves as the communication backbone for all services, microservices,
 * third-party integrations, AI agents, and external consumers.
 */
import { uid } from "./utils";
import { generateToken } from "./security";
import { pushLog } from "./devops";
import { getStore as getIdentityStore } from "./identity";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const GATEWAY_STORAGE_KEY = "alaya_gateway_store";
export const API_VERSION = "v1";
export const DEFAULT_RATE_LIMIT = 60; // requests per minute
export const DEFAULT_RATE_BURST = 20;
export const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10 MB
export const CACHE_TTL_DEFAULT = 300; // 5 minutes

/* ================================================================== */
/*  ENUMS & TYPES                                                      */
/* ================================================================== */

export type ApiProtocol = "rest" | "graphql" | "websocket" | "sse" | "grpc";
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type ApiScope = "public" | "internal" | "partner" | "admin" | "supplier" | "affiliate" | "ai" | "system";
export type ApiStatus = "active" | "deprecated" | "sunset" | "beta" | "alpha";
export type AuthScheme = "api_key" | "jwt" | "oauth2" | "basic" | "mutual_tls" | "none";
export type RatelimitPeriod = "second" | "minute" | "hour" | "day";

export type GatewayEventType =
  | "request_received" | "request_completed" | "request_failed" | "request_blocked"
  | "rate_limit_exceeded" | "auth_failed" | "validation_failed" | "circuit_opened"
  | "circuit_closed" | "webhook_delivered" | "webhook_failed" | "webhook_retried"
  | "endpoint_registered" | "endpoint_deprecated" | "endpoint_sunset"
  | "api_key_created" | "api_key_revoked";

export type CircuitState = "closed" | "open" | "half_open";

/* ================================================================== */
/*  INTERFACES                                                         */
/* ================================================================== */

export interface ApiEndpoint {
  id: string;
  path: string;
  method: ApiMethod;
  protocol: ApiProtocol;
  scope: ApiScope;
  version: string;
  status: ApiStatus;
  summary: string;
  description: string;
  tags: string[];
  auth: AuthScheme[];
  rateLimit: { limit: number; period: RatelimitPeriod; burst: number };
  cacheTtl: number;
  payloadValidation: boolean;
  requiresMfa: boolean;
  deprecatedAt?: number;
  sunsetAt?: number;
  replacedBy?: string;
  requestSchema?: object;
  responseSchema?: object;
  exampleResponse?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiVersion {
  id: string;
  version: string;
  status: "active" | "beta" | "deprecated" | "sunset";
  basePath: string;
  releaseDate: number;
  sunsetDate?: number;
  changelog: string;
  backwardCompatible: boolean;
}

export interface InternalApi extends ApiEndpoint {
  service: string;
  timeout: number;
  retryCount: number;
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenMaxRequests: number;
}

export interface RateLimitState {
  windowStart: number;
  count: number;
  burstUsed: number;
}

export interface GatewayRequest {
  id: string;
  correlationId: string;
  timestamp: number;
  method: ApiMethod;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
  ip: string;
  userAgent: string;
  apiKey?: string;
  userId?: string;
  durationMs: number;
  statusCode: number;
  cached: boolean;
  error?: string;
}

export interface GatewayEvent {
  id: string;
  ts: number;
  type: GatewayEventType;
  detail: string;
  endpoint?: string;
  method?: ApiMethod;
  ip?: string;
  userId?: string;
  metadata?: Record<string, string>;
}

export interface GatewayAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  blockedRequests: number;
  cachedResponses: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  rateLimitExceeded: number;
  authFailures: number;
  validationFailures: number;
  circuitBreakerTrips: number;
  activeEndpoints: number;
  deprecatedEndpoints: number;
}

/* ================================================================== */
/*  WEBHOOK PLATFORM (ENHANCED)                                        */
/* ================================================================== */

export type WebhookStatus = "active" | "paused" | "disabled" | "error";
export type WebhookEvent =
  | "order.created" | "order.paid" | "order.shipped" | "order.cancelled" | "order.refunded"
  | "product.created" | "product.updated" | "product.deleted" | "product.stock_changed"
  | "customer.registered" | "customer.updated" | "review.submitted"
  | "payment.completed" | "payment.failed"
  | "affiliate.conversion" | "affiliate.commission"
  | "supplier.order" | "supplier.shipment"
  | "inventory.low_stock" | "inventory.out_of_stock" | "product.low_stock"
  | "workflow.completed" | "workflow.failed"
  | "backup.completed" | "security.incident"
  | "*"; // wildcard

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: WebhookStatus;
  headers: Record<string, string>;
  retryConfig: WebhookRetryConfig;
  rateLimit: number;
  timeout: number;
  filter?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookRetryConfig {
  enabled: boolean;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  url: string;
  payload: string;
  statusCode?: number;
  success: boolean;
  attempt: number;
  durationMs: number;
  error?: string;
  responseBody?: string;
  ts: number;
}

export interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  retriedDeliveries: number;
  avgLatencyMs: number;
  successRate: number;
}

/* ================================================================== */
/*  API DOCUMENTATION                                                  */
/* ================================================================== */

export interface ApiDocSection {
  id: string;
  title: string;
  description: string;
  endpoints: string[];
  order: number;
}

export interface ApiDocSpec {
  id: string;
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  sections: ApiDocSection[];
  authDescription: string;
}

/* ================================================================== */
/*  API STORE (persisted)                                              */
/* ================================================================== */

interface GatewayStore {
  endpoints: ApiEndpoint[];
  versions: ApiVersion[];
  internalApis: InternalApi[];
  webhooks: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
  requests: GatewayRequest[];
  events: GatewayEvent[];
  rateLimitStates: Record<string, RateLimitState>;
  circuitStates: Record<string, CircuitState>;
}

function getStore(): GatewayStore {
  try {
    const raw = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GatewayStore;
  } catch { /* ignore */ }
  return {
    endpoints: [], versions: [], internalApis: [], webhooks: [],
    deliveries: [], requests: [], events: [],
    rateLimitStates: {}, circuitStates: {},
  };
}

function saveStore(store: GatewayStore) {
  try { localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedGatewayData() {
  const store = getStore();
  if (store.endpoints.length > 0) return;

  const now = Date.now();
  const versions: ApiVersion[] = [
    { id: "ver_1", version: "v1", status: "active", basePath: "/api/v1", releaseDate: now - 90 * 86400000, changelog: "Initial API release", backwardCompatible: true },
    { id: "ver_2", version: "v2", status: "beta", basePath: "/api/v2", releaseDate: now - 7 * 86400000, changelog: "GraphQL, streaming, enhanced webhooks", backwardCompatible: false },
  ];

  const endpoints: ApiEndpoint[] = [
    { id: "ep_prod_list", path: "/api/v1/products", method: "GET", protocol: "rest", scope: "public", version: "v1", status: "active", summary: "List products", description: "Paginated, filterable product listing", tags: ["Products", "Catalog"], auth: ["none"], rateLimit: { limit: 120, period: "minute", burst: 30 }, cacheTtl: 60, payloadValidation: false, requiresMfa: false, createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_prod_get", path: "/api/v1/products/:slug", method: "GET", protocol: "rest", scope: "public", version: "v1", status: "active", summary: "Get product", description: "Single product by slug", tags: ["Products", "Catalog"], auth: ["none"], rateLimit: { limit: 120, period: "minute", burst: 30 }, cacheTtl: 120, payloadValidation: false, requiresMfa: false, createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_prod_create", path: "/api/v1/products", method: "POST", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Create product", description: "Create a new product catalog entry", tags: ["Products", "Admin"], auth: ["api_key", "jwt"], rateLimit: { limit: 30, period: "minute", burst: 10 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_prod_update", path: "/api/v1/products/:id", method: "PUT", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Update product", description: "Update existing product fields", tags: ["Products", "Admin"], auth: ["api_key", "jwt"], rateLimit: { limit: 30, period: "minute", burst: 10 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_prod_delete", path: "/api/v1/products/:id", method: "DELETE", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Delete product", description: "Remove product from catalog", tags: ["Products", "Admin"], auth: ["api_key", "jwt"], rateLimit: { limit: 20, period: "minute", burst: 5 }, cacheTtl: 0, payloadValidation: false, requiresMfa: true, createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_order_list", path: "/api/v1/orders", method: "GET", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "List orders", description: "Paginated order listing", tags: ["Orders", "Commerce"], auth: ["api_key", "jwt"], rateLimit: { limit: 60, period: "minute", burst: 15 }, cacheTtl: 30, payloadValidation: false, requiresMfa: false, createdAt: now - 85 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_order_create", path: "/api/v1/orders", method: "POST", protocol: "rest", scope: "public", version: "v1", status: "active", summary: "Create order", description: "Place a new order", tags: ["Orders", "Commerce"], auth: ["none"], rateLimit: { limit: 10, period: "minute", burst: 3 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 85 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_customer_list", path: "/api/v1/customers", method: "GET", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "List customers", description: "Customer management", tags: ["Customers", "CRM"], auth: ["api_key", "jwt"], rateLimit: { limit: 60, period: "minute", burst: 15 }, cacheTtl: 30, payloadValidation: false, requiresMfa: false, createdAt: now - 80 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_search", path: "/api/v1/search", method: "GET", protocol: "rest", scope: "public", version: "v1", status: "active", summary: "Search catalog", description: "Full-text product search", tags: ["Search", "Catalog"], auth: ["none"], rateLimit: { limit: 60, period: "minute", burst: 10 }, cacheTtl: 30, payloadValidation: false, requiresMfa: false, createdAt: now - 75 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_webhook_sub", path: "/api/v1/webhooks/subscribe", method: "POST", protocol: "rest", scope: "partner", version: "v1", status: "active", summary: "Subscribe webhook", description: "Register a webhook endpoint", tags: ["Webhooks", "Integration"], auth: ["api_key"], rateLimit: { limit: 10, period: "minute", burst: 3 }, cacheTtl: 0, payloadValidation: true, requiresMfa: true, createdAt: now - 70 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_analytics", path: "/api/v1/analytics/overview", method: "GET", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Analytics overview", description: "Dashboard analytics data", tags: ["Analytics", "Admin"], auth: ["api_key", "jwt"], rateLimit: { limit: 30, period: "minute", burst: 5 }, cacheTtl: 120, payloadValidation: false, requiresMfa: false, createdAt: now - 65 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_import", path: "/api/v1/import/products", method: "POST", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Import products", description: "Bulk CSV product import", tags: ["Import", "Products", "Admin"], auth: ["api_key"], rateLimit: { limit: 5, period: "hour", burst: 1 }, cacheTtl: 0, payloadValidation: true, requiresMfa: true, createdAt: now - 60 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_export", path: "/api/v1/export/:type", method: "GET", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Export data", description: "Export data as CSV/JSON", tags: ["Export", "Admin"], auth: ["api_key", "jwt"], rateLimit: { limit: 10, period: "hour", burst: 2 }, cacheTtl: 0, payloadValidation: false, requiresMfa: true, createdAt: now - 60 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: "ep_supplier_products", path: "/api/v1/supplier/products", method: "GET", protocol: "rest", scope: "supplier", version: "v1", status: "active", summary: "Supplier products", description: "Supplier's own product listing", tags: ["Supplier", "Products"], auth: ["api_key"], rateLimit: { limit: 60, period: "minute", burst: 10 }, cacheTtl: 60, payloadValidation: false, requiresMfa: false, createdAt: now - 50 * 86400000, updatedAt: now - 20 * 86400000 },
    { id: "ep_affiliate_links", path: "/api/v1/affiliate/links", method: "GET", protocol: "rest", scope: "affiliate", version: "v1", status: "active", summary: "Affiliate links", description: "Affiliate link management", tags: ["Affiliate", "Marketing"], auth: ["api_key"], rateLimit: { limit: 60, period: "minute", burst: 10 }, cacheTtl: 60, payloadValidation: false, requiresMfa: false, createdAt: now - 50 * 86400000, updatedAt: now - 20 * 86400000 },
    { id: "ep_ai_generate", path: "/api/v1/ai/generate", method: "POST", protocol: "rest", scope: "ai", version: "v1", status: "beta", summary: "AI generation", description: "AI content generation endpoint", tags: ["AI", "Content"], auth: ["api_key", "jwt"], rateLimit: { limit: 20, period: "minute", burst: 5 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 14 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: "ep_media_upload", path: "/api/v1/media/upload", method: "POST", protocol: "rest", scope: "admin", version: "v1", status: "active", summary: "Upload media", description: "Upload product images & assets", tags: ["Media", "DAM"], auth: ["api_key"], rateLimit: { limit: 20, period: "minute", burst: 5 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 50 * 86400000, updatedAt: now - 20 * 86400000 },
    { id: "ep_webhook_events", path: "/api/v1/webhooks/events", method: "GET", protocol: "rest", scope: "partner", version: "v2", status: "beta", summary: "List webhook events", description: "Available webhook event types", tags: ["Webhooks", "Integration"], auth: ["api_key"], rateLimit: { limit: 30, period: "minute", burst: 10 }, cacheTtl: 300, payloadValidation: false, requiresMfa: false, createdAt: now - 7 * 86400000, updatedAt: now - 7 * 86400000 },
  ];

  const internalApis: InternalApi[] = [
    { id: "int_inventory", path: "/internal/inventory/check", method: "POST", protocol: "rest", scope: "internal", version: "v1", status: "active", summary: "Check inventory", description: "Real-time inventory check across warehouses", tags: ["Internal", "Inventory"], auth: ["mutual_tls"], rateLimit: { limit: 1000, period: "minute", burst: 100 }, cacheTtl: 5, payloadValidation: true, requiresMfa: false, createdAt: now - 80 * 86400000, updatedAt: now - 30 * 86400000, service: "inventory-service", timeout: 5000, retryCount: 3, circuitBreaker: { enabled: true, failureThreshold: 5, successThreshold: 3, timeoutMs: 10000, halfOpenMaxRequests: 3 } },
    { id: "int_pricing", path: "/internal/pricing/calculate", method: "POST", protocol: "rest", scope: "internal", version: "v1", status: "active", summary: "Calculate pricing", description: "Dynamic pricing engine with rules", tags: ["Internal", "Pricing"], auth: ["mutual_tls"], rateLimit: { limit: 500, period: "minute", burst: 50 }, cacheTtl: 10, payloadValidation: true, requiresMfa: false, createdAt: now - 80 * 86400000, updatedAt: now - 30 * 86400000, service: "pricing-service", timeout: 3000, retryCount: 2, circuitBreaker: { enabled: true, failureThreshold: 5, successThreshold: 3, timeoutMs: 8000, halfOpenMaxRequests: 3 } },
    { id: "int_search_index", path: "/internal/search/index", method: "POST", protocol: "rest", scope: "internal", version: "v1", status: "active", summary: "Rebuild search index", description: "Full search index rebuild", tags: ["Internal", "Search"], auth: ["api_key"], rateLimit: { limit: 10, period: "hour", burst: 1 }, cacheTtl: 0, payloadValidation: false, requiresMfa: false, createdAt: now - 70 * 86400000, updatedAt: now - 30 * 86400000, service: "search-service", timeout: 30000, retryCount: 1, circuitBreaker: { enabled: true, failureThreshold: 3, successThreshold: 2, timeoutMs: 60000, halfOpenMaxRequests: 2 } },
    { id: "int_sync", path: "/internal/sync/affiliate", method: "POST", protocol: "rest", scope: "internal", version: "v1", status: "active", summary: "Sync affiliate data", description: "Synchronize affiliate network data", tags: ["Internal", "Affiliate"], auth: ["api_key"], rateLimit: { limit: 30, period: "minute", burst: 5 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 60 * 86400000, updatedAt: now - 20 * 86400000, service: "affiliate-sync-service", timeout: 15000, retryCount: 3, circuitBreaker: { enabled: true, failureThreshold: 5, successThreshold: 3, timeoutMs: 30000, halfOpenMaxRequests: 2 } },
    { id: "int_notify", path: "/internal/notifications/send", method: "POST", protocol: "rest", scope: "internal", version: "v1", status: "active", summary: "Send notification", description: "Multi-channel notification dispatch", tags: ["Internal", "Notifications"], auth: ["api_key", "mutual_tls"], rateLimit: { limit: 200, period: "minute", burst: 30 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 50 * 86400000, updatedAt: now - 15 * 86400000, service: "notification-service", timeout: 5000, retryCount: 3, circuitBreaker: { enabled: true, failureThreshold: 5, successThreshold: 3, timeoutMs: 10000, halfOpenMaxRequests: 3 } },
    { id: "int_workflow", path: "/internal/workflows/execute", method: "POST", protocol: "rest", scope: "internal", version: "v1", status: "active", summary: "Execute workflow", description: "Trigger workflow execution", tags: ["Internal", "Workflows"], auth: ["api_key"], rateLimit: { limit: 100, period: "minute", burst: 20 }, cacheTtl: 0, payloadValidation: true, requiresMfa: false, createdAt: now - 40 * 86400000, updatedAt: now - 10 * 86400000, service: "workflow-engine", timeout: 10000, retryCount: 2, circuitBreaker: { enabled: true, failureThreshold: 4, successThreshold: 2, timeoutMs: 20000, halfOpenMaxRequests: 2 } },
  ];

  const webhooks: WebhookEndpoint[] = [
    { id: "wh_orders", url: "https://api.partner.com/orders", events: ["order.created", "order.paid", "order.shipped"], secret: `whsec_${generateToken(16)}`, status: "active", headers: { "X-Source": "alaya-insider" }, retryConfig: { enabled: true, maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 60000, exponentialBackoff: true }, rateLimit: 100, timeout: 10000, createdAt: now - 80 * 86400000, updatedAt: now - 10 * 86400000 },
    { id: "wh_inventory", url: "https://erp.company.com/stock", events: ["product.stock_changed", "product.low_stock", "inventory.out_of_stock"], secret: `whsec_${generateToken(16)}`, status: "active", headers: {}, retryConfig: { enabled: true, maxRetries: 3, baseDelayMs: 2000, maxDelayMs: 30000, exponentialBackoff: true }, rateLimit: 50, timeout: 15000, createdAt: now - 70 * 86400000, updatedAt: now - 5 * 86400000 },
    { id: "wh_crm", url: "https://crm.example.com/hooks", events: ["customer.registered", "customer.updated", "review.submitted"], secret: `whsec_${generateToken(16)}`, status: "paused", headers: {}, retryConfig: { enabled: true, maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, exponentialBackoff: true }, rateLimit: 30, timeout: 10000, createdAt: now - 60 * 86400000, updatedAt: now - 20 * 86400000 },
    { id: "wh_affiliate", url: "https://affiliate-network.com/conversions", events: ["affiliate.conversion", "affiliate.commission"], secret: `whsec_${generateToken(16)}`, status: "active", headers: {}, retryConfig: { enabled: true, maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 120000, exponentialBackoff: true }, rateLimit: 200, timeout: 5000, createdAt: now - 50 * 86400000, updatedAt: now - 5 * 86400000 },
    { id: "wh_supplier", url: "https://supplier-portal.com/shipments", events: ["supplier.order", "supplier.shipment"], secret: `whsec_${generateToken(16)}`, status: "disabled", headers: {}, retryConfig: { enabled: false, maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0, exponentialBackoff: false }, rateLimit: 20, timeout: 30000, createdAt: now - 40 * 86400000, updatedAt: now - 10 * 86400000 },
  ];

  const deliveries: WebhookDelivery[] = [
    { id: "del_1", webhookId: "wh_orders", event: "order.created", url: "https://api.partner.com/orders", payload: '{"orderId":"AL-123456","total":299.99}', statusCode: 200, success: true, attempt: 1, durationMs: 342, ts: now - 60000 },
    { id: "del_2", webhookId: "wh_orders", event: "order.paid", url: "https://api.partner.com/orders", payload: '{"orderId":"AL-123456","paid":true}', statusCode: 200, success: true, attempt: 1, durationMs: 289, ts: now - 30000 },
    { id: "del_3", webhookId: "wh_inventory", event: "product.stock_changed", url: "https://erp.company.com/stock", payload: '{"productId":"prod_abc","stock":12}', statusCode: 502, success: false, attempt: 2, durationMs: 5200, error: "Gateway Timeout", ts: now - 120000 },
    { id: "del_4", webhookId: "wh_affiliate", event: "affiliate.conversion", url: "https://affiliate-network.com/conversions", payload: '{"clickId":"clk_xyz","commission":12.50}', statusCode: 200, success: true, attempt: 1, durationMs: 156, ts: now - 5000 },
  ];

  store.versions = versions;
  store.endpoints = endpoints;
  store.internalApis = internalApis;
  store.webhooks = webhooks;
  store.deliveries = deliveries;
  saveStore(store);
}

seedGatewayData();

/* ================================================================== */
/*  ENDPOINT MANAGEMENT                                                */
/* ================================================================== */

export function getEndpoints(): ApiEndpoint[] {
  return getStore().endpoints;
}

export function getEndpoint(id: string): ApiEndpoint | undefined {
  return getStore().endpoints.find((ep) => ep.id === id);
}

export function getEndpointsByScope(scope: ApiScope): ApiEndpoint[] {
  return getStore().endpoints.filter((ep) => ep.scope === scope);
}

export function getInternalApis(): InternalApi[] {
  return getStore().internalApis;
}

export function getVersions(): ApiVersion[] {
  return getStore().versions;
}

export function registerEndpoint(input: Omit<ApiEndpoint, "id" | "createdAt" | "updatedAt">): ApiEndpoint {
  const store = getStore();
  const ep: ApiEndpoint = { ...input, id: uid("ep"), createdAt: Date.now(), updatedAt: Date.now() };
  store.endpoints.push(ep);
  saveStore(store);
  logGatewayEvent("endpoint_registered", `Endpoint ${ep.method} ${ep.path} registered`, ep.id, ep.method);
  return ep;
}

export function updateEndpoint(id: string, patch: Partial<ApiEndpoint>): ApiEndpoint | null {
  const store = getStore();
  const idx = store.endpoints.findIndex((ep) => ep.id === id);
  if (idx === -1) return null;
  store.endpoints[idx] = { ...store.endpoints[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.endpoints[idx];
}

export function deprecateEndpoint(id: string, replacementId?: string): boolean {
  const ep = updateEndpoint(id, { status: "deprecated", deprecatedAt: Date.now(), replacedBy: replacementId });
  if (!ep) return false;
  logGatewayEvent("endpoint_deprecated", `Endpoint ${ep.method} ${ep.path} deprecated`, id, ep.method);
  return true;
}

export function sunsetEndpoint(id: string): boolean {
  const ep = updateEndpoint(id, { status: "sunset", sunsetAt: Date.now() + 90 * 86400000 });
  if (!ep) return false;
  logGatewayEvent("endpoint_sunset", `Endpoint ${ep.method} ${ep.path} sunset scheduled`, id, ep.method);
  return true;
}

/* ================================================================== */
/*  RATE LIMITING                                                      */
/* ================================================================== */

export function checkRateLimit(key: string, limit: number, period: RatelimitPeriod, burst: number): { allowed: boolean; remaining: number; resetAt: number } {
  const store = getStore();
  const now = Date.now();
  let state = store.rateLimitStates[key];

  const windowMs = period === "second" ? 1000 : period === "minute" ? 60000 : period === "hour" ? 3600000 : 86400000;

  if (!state || now - state.windowStart > windowMs) {
    state = { windowStart: now, count: 0, burstUsed: 0 };
  }

  state.count++;

  if (state.count > limit + burst) {
    store.rateLimitStates[key] = state;
    saveStore(store);
    logGatewayEvent("rate_limit_exceeded", `Rate limit exceeded for ${key}`, undefined, undefined, undefined, undefined, { key, limit: String(limit) });
    return { allowed: false, remaining: 0, resetAt: state.windowStart + windowMs };
  }

  store.rateLimitStates[key] = state;
  saveStore(store);
  return { allowed: true, remaining: Math.max(0, limit + burst - state.count), resetAt: state.windowStart + windowMs };
}

/* ================================================================== */
/*  CIRCUIT BREAKER                                                    */
/* ================================================================== */

export function getCircuitState(serviceId: string): CircuitState {
  return getStore().circuitStates[serviceId] || "closed";
}

export function recordCircuitFailure(serviceId: string): CircuitState {
  const store = getStore();
  let state = store.circuitStates[serviceId] || "closed";
  // Simplified: open circuit on failure
  if (state === "closed") {
    state = "open";
    store.circuitStates[serviceId] = state;
    saveStore(store);
    logGatewayEvent("circuit_opened", `Circuit opened for service ${serviceId}`);
  }
  return state;
}

export function recordCircuitSuccess(serviceId: string): CircuitState {
  const store = getStore();
  store.circuitStates[serviceId] = "closed";
  saveStore(store);
  logGatewayEvent("circuit_closed", `Circuit closed for service ${serviceId}`);
  return "closed";
}

/* ================================================================== */
/*  GATEWAY EVENTS & ANALYTICS                                         */
/* ================================================================== */

export function logGatewayEvent(type: GatewayEventType, detail: string, endpoint?: string, method?: ApiMethod, ip?: string, userId?: string, metadata?: Record<string, string>) {
  const store = getStore();
  const event: GatewayEvent = { id: uid("gev"), ts: Date.now(), type, detail, endpoint, method, ip, userId, metadata };
  store.events.push(event);
  if (store.events.length > 500) store.events = store.events.slice(-500);
  saveStore(store);
  pushLog(type.startsWith("request") || type.startsWith("rate") || type.startsWith("auth") ? "info" : "warning", "api", detail);
}

export function logGatewayRequest(req: Omit<GatewayRequest, "id" | "timestamp">) {
  const store = getStore();
  const request: GatewayRequest = { ...req, id: uid("greq"), timestamp: Date.now() };
  store.requests.push(request);
  if (store.requests.length > 1000) store.requests = store.requests.slice(-1000);
  saveStore(store);
}

export function getGatewayEvents(limit = 100): GatewayEvent[] {
  return [...getStore().events].reverse().slice(0, limit);
}

export function getGatewayRequests(limit = 100): GatewayRequest[] {
  return [...getStore().requests].reverse().slice(0, limit);
}

export function getGatewayAnalytics(): GatewayAnalytics {
  const store = getStore();
  const requests = store.requests;
  const total = requests.length;
  if (total === 0) return { totalRequests: 0, successfulRequests: 0, failedRequests: 0, blockedRequests: 0, cachedResponses: 0, avgLatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, rateLimitExceeded: 0, authFailures: 0, validationFailures: 0, circuitBreakerTrips: 0, activeEndpoints: store.endpoints.filter((e) => e.status === "active").length, deprecatedEndpoints: store.endpoints.filter((e) => e.status === "deprecated" || e.status === "sunset").length };

  const latencies = requests.map((r) => r.durationMs).sort((a, b) => a - b);
  const success = requests.filter((r) => r.statusCode < 400).length;
  const failed = requests.filter((r) => r.statusCode >= 400 && r.statusCode < 500).length;
  const blocked = requests.filter((r) => r.statusCode >= 500).length;

  return {
    totalRequests: total,
    successfulRequests: success,
    failedRequests: failed,
    blockedRequests: blocked,
    cachedResponses: requests.filter((r) => r.cached).length,
    avgLatencyMs: Math.round(latencies.reduce((a, b) => a + b, 0) / total),
    p95LatencyMs: latencies[Math.floor(total * 0.95)] || 0,
    p99LatencyMs: latencies[Math.floor(total * 0.99)] || 0,
    rateLimitExceeded: store.events.filter((e) => e.type === "rate_limit_exceeded").length,
    authFailures: store.events.filter((e) => e.type === "auth_failed").length,
    validationFailures: store.events.filter((e) => e.type === "validation_failed").length,
    circuitBreakerTrips: store.events.filter((e) => e.type === "circuit_opened").length,
    activeEndpoints: store.endpoints.filter((e) => e.status === "active").length,
    deprecatedEndpoints: store.endpoints.filter((e) => e.status === "deprecated" || e.status === "sunset").length,
  };
}

/* ================================================================== */
/*  WEBHOOK MANAGEMENT (ENHANCED)                                      */
/* ================================================================== */

export function getWebhooks(): WebhookEndpoint[] {
  return getStore().webhooks;
}

export function createWebhook(input: Omit<WebhookEndpoint, "id" | "createdAt" | "updatedAt">): WebhookEndpoint {
  const store = getStore();
  const wh: WebhookEndpoint = { ...input, id: uid("wh"), createdAt: Date.now(), updatedAt: Date.now() };
  store.webhooks.push(wh);
  saveStore(store);
  return wh;
}

export function updateWebhook(id: string, patch: Partial<WebhookEndpoint>): WebhookEndpoint | null {
  const store = getStore();
  const idx = store.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  store.webhooks[idx] = { ...store.webhooks[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.webhooks[idx];
}

export function deleteWebhook(id: string): boolean {
  const store = getStore();
  store.webhooks = store.webhooks.filter((w) => w.id !== id);
  saveStore(store);
  return true;
}

export function deliverWebhook(webhookId: string, event: WebhookEvent, payload: string): WebhookDelivery | null {
  const store = getStore();
  const wh = store.webhooks.find((w) => w.id === webhookId);
  if (!wh || wh.status !== "active") return null;

  const t0 = performance.now();
  const success = Math.random() > 0.15; // Simulate 85% success rate
  const durationMs = Math.round(performance.now() - t0) || Math.floor(100 + Math.random() * 400);

  const delivery: WebhookDelivery = {
    id: uid("wdel"),
    webhookId,
    event,
    url: wh.url,
    payload,
    statusCode: success ? 200 : 502,
    success,
    attempt: 1,
    durationMs,
    error: success ? undefined : "Simulated delivery failure",
    ts: Date.now(),
  };

  store.deliveries.push(delivery);
  saveStore(store);
  logGatewayEvent(success ? "webhook_delivered" : "webhook_failed",
    `Webhook ${wh.url} ${success ? "delivered" : "failed"} for ${event}`, undefined, undefined, undefined, undefined,
    { webhookId, event });

  return delivery;
}

export function replayWebhook(deliveryId: string): WebhookDelivery | null {
  const store = getStore();
  const original = store.deliveries.find((d) => d.id === deliveryId);
  if (!original) return null;

  const wh = store.webhooks.find((w) => w.id === original.webhookId);
  if (!wh) return null;

  const delivery: WebhookDelivery = {
    ...original,
    id: uid("wdel"),
    attempt: original.attempt + 1,
    ts: Date.now(),
  };

  store.deliveries.push(delivery);
  saveStore(store);
  logGatewayEvent("webhook_retried", `Webhook ${wh.url} replayed (attempt ${delivery.attempt})`);
  return delivery;
}

export function getWebhookDeliveries(webhookId?: string, limit = 100): WebhookDelivery[] {
  const store = getStore();
  let deliveries = [...store.deliveries].reverse();
  if (webhookId) deliveries = deliveries.filter((d) => d.webhookId === webhookId);
  return deliveries.slice(0, limit);
}

export function getWebhookStats(): WebhookStats {
  const store = getStore();
  const deliveries = store.deliveries;
  const total = deliveries.length;
  if (total === 0) return { totalDeliveries: 0, successfulDeliveries: 0, failedDeliveries: 0, retriedDeliveries: 0, avgLatencyMs: 0, successRate: 0 };

  const successful = deliveries.filter((d) => d.success).length;
  const retried = deliveries.filter((d) => d.attempt > 1).length;
  const avgLatency = Math.round(deliveries.reduce((s, d) => s + d.durationMs, 0) / total);

  return {
    totalDeliveries: total,
    successfulDeliveries: successful,
    failedDeliveries: total - successful,
    retriedDeliveries: retried,
    avgLatencyMs: avgLatency,
    successRate: Math.round((successful / total) * 100),
  };
}

/* ================================================================== */
/*  API DOCUMENTATION GENERATOR                                        */
/* ================================================================== */

export function generateApiDoc(spec: ApiDocSpec): string {
  const store = getStore();
  const lines: string[] = [];
  lines.push(`# ${spec.title} v${spec.version}`);
  lines.push("");
  lines.push(spec.description);
  lines.push("");
  lines.push(`**Base URL:** \`${spec.baseUrl}\``);
  lines.push("");
  lines.push("## Authentication");
  lines.push("");
  lines.push(spec.authDescription);
  lines.push("");

  for (const section of spec.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(section.description);
    lines.push("");

    for (const epId of section.endpoints) {
      const ep = store.endpoints.find((e) => e.id === epId) || store.internalApis.find((e) => e.id === epId);
      if (!ep) continue;

      lines.push(`### \`${ep.method}\` ${ep.path}`);
      lines.push("");
      lines.push(ep.description);
      lines.push("");
      lines.push(`- **Status:** ${ep.status}`);
      lines.push(`- **Scope:** ${ep.scope}`);
      lines.push(`- **Auth:** ${ep.auth.join(", ") || "None"}`);
      lines.push(`- **Rate Limit:** ${ep.rateLimit.limit}/${ep.rateLimit.period} (burst: ${ep.rateLimit.burst})`);
      if (ep.cacheTtl > 0) lines.push(`- **Cache TTL:** ${ep.cacheTtl}s`);
      lines.push(`- **Tags:** ${ep.tags.join(", ")}`);
      lines.push("");

      if ("service" in ep && (ep as InternalApi).service) {
        const int = ep as InternalApi;
        lines.push(`- **Service:** ${int.service}`);
        lines.push(`- **Timeout:** ${int.timeout}ms`);
        lines.push(`- **Retries:** ${int.retryCount}`);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

export function getApiDocSpec(): ApiDocSpec {
  const store = getStore();
  return {
    id: "api_doc_v1",
    title: "ALAYA INSIDER API",
    version: "v1",
    description: "Enterprise commerce platform API. Access products, orders, customers, analytics, and more.",
    baseUrl: "https://api.alayainsider.com",
    sections: [
      { id: "sec_products", title: "Products", description: "Product catalog management APIs.", endpoints: store.endpoints.filter((e) => e.tags.includes("Products")).map((e) => e.id), order: 1 },
      { id: "sec_orders", title: "Orders", description: "Order management and processing APIs.", endpoints: store.endpoints.filter((e) => e.tags.includes("Orders")).map((e) => e.id), order: 2 },
      { id: "sec_customers", title: "Customers", description: "Customer management and CRM APIs.", endpoints: store.endpoints.filter((e) => e.tags.includes("Customers")).map((e) => e.id), order: 3 },
      { id: "sec_search", title: "Search", description: "Full-text search and catalog discovery.", endpoints: store.endpoints.filter((e) => e.tags.includes("Search")).map((e) => e.id), order: 4 },
      { id: "sec_webhooks", title: "Webhooks", description: "Webhook subscription and management APIs.", endpoints: store.endpoints.filter((e) => e.tags.includes("Webhooks")).map((e) => e.id), order: 5 },
      { id: "sec_internal", title: "Internal APIs", description: "Internal microservice communication APIs (mTLS required).", endpoints: store.internalApis.map((e) => e.id), order: 6 },
    ],
    authDescription: "Public endpoints require no authentication. Admin/partner endpoints require either an API key (via `X-API-Key` header) or a JWT bearer token (via `Authorization: Bearer <token>` header). Internal endpoints require mutual TLS (mTLS) client certificates.",
  };
}

/* ================================================================== */
/*  AUTH VALIDATION                                                    */
/* ================================================================== */

export function validateApiKey(apiKey: string): { valid: boolean; userId?: string; type?: string } {
  const identity = getIdentityStore();
  const key = identity.apiKeys.find((k) => k.key === apiKey && k.active);
  if (!key) return { valid: false };
  if (key.expiresAt && key.expiresAt < Date.now()) return { valid: false };
  return { valid: true, userId: key.userId, type: key.type };
}

export function validateJwt(token: string): { valid: boolean; userId?: string; email?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return { valid: false };
    return { valid: true, userId: payload.sub, email: payload.email };
  } catch {
    return { valid: false };
  }
}

/* ================================================================== */
/*  CORRELATION ID                                                     */
/* ================================================================== */

export function generateCorrelationId(): string {
  return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
