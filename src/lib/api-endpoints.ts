/**
 * ALAYA INSIDER — API Endpoint Definitions
 * --------------------------------------------------------------------------
 * Typed RESTful endpoint definitions for every entity in the platform.
 *
 * These are the contract between the frontend SPA and the backend API.
 * Each entity follows a consistent CRUD pattern:
 *
 *   GET    /api/v1/{entity}          → List (paginated, filtered, sorted)
 *   GET    /api/v1/{entity}/:id      → Get single
 *   POST   /api/v1/{entity}          → Create
 *   PUT    /api/v1/{entity}/:id      → Update (full replace)
 *   PATCH  /api/v1/{entity}/:id      → Partial update
 *   DELETE /api/v1/{entity}/:id      → Delete
 *   POST   /api/v1/{entity}/bulk     → Bulk operations
 *
 * Usage:
 *   import { ENDPOINTS } from "./api-endpoints";
 *   const products = await api.get<Product[]>(ENDPOINTS.products.list());
 *   const product  = await api.get<Product>(ENDPOINTS.products.get("prod_1"));
 */

// Types imported for documentation reference — these are the entities
// that the endpoint definitions produce/consume.
// No explicit type usage is required since ENDPOINTS returns plain strings.

/* ================================================================== */
/*  VERSION PREFIX                                                     */
/* ================================================================== */

// V1 prefix is handled by the apiUrl in api-config (which already includes /api/v1).
// Keeping this empty prevents double /api/v1 when the API client combines apiUrl + path.
const V1 = "";

/* ================================================================== */
/*  PAGINATION & FILTERING                                             */
/* ================================================================== */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: string | number | undefined;
}

/* ================================================================== */
/*  ENDPOINT FACTORIES                                                 */
/* ================================================================== */

function list(path: string, params?: ListParams): string {
  if (!params) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      qs.set(k, String(v));
    }
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

function detail(path: string, id: string): string {
  return `${path}/${encodeURIComponent(id)}`;
}

/* ================================================================== */
/*  ENDPOINT DEFINITIONS                                               */
/* ================================================================== */

export const ENDPOINTS = {
  /* ---- Products ---- */
  products: {
    list: (params?: ListParams) => list(`${V1}/products`, params),
    get: (id: string) => detail(`${V1}/products`, id),
    bySlug: (slug: string) => `${V1}/products/slug/${encodeURIComponent(slug)}`,
    create: () => `${V1}/products`,
    update: (id: string) => detail(`${V1}/products`, id),
    delete: (id: string) => detail(`${V1}/products`, id),
    bulk: () => `${V1}/products/bulk`,
  },

  /* ---- Categories ---- */
  categories: {
    list: (params?: ListParams) => list(`${V1}/categories`, params),
    get: (id: string) => detail(`${V1}/categories`, id),
    create: () => `${V1}/categories`,
    update: (id: string) => detail(`${V1}/categories`, id),
    delete: (id: string) => detail(`${V1}/categories`, id),
  },

  /* ---- Brands ---- */
  brands: {
    list: (params?: ListParams) => list(`${V1}/brands`, params),
    get: (id: string) => detail(`${V1}/brands`, id),
    create: () => `${V1}/brands`,
    update: (id: string) => detail(`${V1}/brands`, id),
    delete: (id: string) => detail(`${V1}/brands`, id),
  },

  /* ---- Orders ---- */
  orders: {
    list: (params?: ListParams) => list(`${V1}/orders`, params),
    get: (id: string) => detail(`${V1}/orders`, id),
    create: () => `${V1}/orders`,
    updateStatus: (id: string) => detail(`${V1}/orders/${id}`, "status"),
    delete: (id: string) => detail(`${V1}/orders`, id),
  },

  /* ---- Coupons ---- */
  coupons: {
    list: (params?: ListParams) => list(`${V1}/coupons`, params),
    get: (id: string) => detail(`${V1}/coupons`, id),
    create: () => `${V1}/coupons`,
    update: (id: string) => detail(`${V1}/coupons`, id),
    delete: (id: string) => detail(`${V1}/coupons`, id),
    validate: () => `${V1}/coupons/validate`,
  },

  /* ---- Articles / Journal ---- */
  articles: {
    list: (params?: ListParams) => list(`${V1}/articles`, params),
    get: (id: string) => detail(`${V1}/articles`, id),
    bySlug: (slug: string) => `${V1}/articles/slug/${encodeURIComponent(slug)}`,
    create: () => `${V1}/articles`,
    update: (id: string) => detail(`${V1}/articles`, id),
    delete: (id: string) => detail(`${V1}/articles`, id),
  },

  /* ---- Customers ---- */
  customers: {
    list: (params?: ListParams) => list(`${V1}/customers`, params),
    get: (id: string) => detail(`${V1}/customers`, id),
    create: () => `${V1}/customers`,
    update: (id: string) => detail(`${V1}/customers`, id),
    delete: (id: string) => detail(`${V1}/customers`, id),
    login: () => `${V1}/customers/login`,
    register: () => `${V1}/customers/register`,
    notes: (id: string) => detail(`${V1}/customers/${id}`, "notes"),
    tasks: (id: string) => detail(`${V1}/customers/${id}`, "tasks"),
    timeline: (id: string) => detail(`${V1}/customers/${id}`, "timeline"),
  },

  /* ---- Questions & Answers ---- */
  questions: {
    forProduct: (productId: string) => `${V1}/products/${productId}/questions`,
    create: (productId: string) => `${V1}/products/${productId}/questions`,
    answer: (id: string) => detail(`${V1}/questions`, `${id}/answer`),
    vote: (id: string) => detail(`${V1}/questions`, `${id}/vote`),
  },

  /* ---- Suppliers ---- */
  suppliers: {
    list: (params?: ListParams) => list(`${V1}/suppliers`, params),
    get: (id: string) => detail(`${V1}/suppliers`, id),
    create: () => `${V1}/suppliers`,
    update: (id: string) => detail(`${V1}/suppliers`, id),
    delete: (id: string) => detail(`${V1}/suppliers`, id),
  },

  /* ---- Payment Gateways ---- */
  gateways: {
    list: (params?: ListParams) => list(`${V1}/gateways`, params),
    get: (id: string) => detail(`${V1}/gateways`, id),
    create: () => `${V1}/gateways`,
    update: (id: string) => detail(`${V1}/gateways`, id),
    delete: (id: string) => detail(`${V1}/gateways`, id),
  },

  /* ---- Returns ---- */
  returns: {
    list: (params?: ListParams) => list(`${V1}/returns`, params),
    get: (id: string) => detail(`${V1}/returns`, id),
    create: () => `${V1}/returns`,
    update: (id: string) => detail(`${V1}/returns`, id),
  },

  /* ---- Redirects ---- */
  redirects: {
    list: (params?: ListParams) => list(`${V1}/redirects`, params),
    get: (id: string) => detail(`${V1}/redirects`, id),
    create: () => `${V1}/redirects`,
    update: (id: string) => detail(`${V1}/redirects`, id),
    delete: (id: string) => detail(`${V1}/redirects`, id),
  },

  /* ---- Popups ---- */
  popups: {
    list: (params?: ListParams) => list(`${V1}/popups`, params),
    get: (id: string) => detail(`${V1}/popups`, id),
    create: () => `${V1}/popups`,
    update: (id: string) => detail(`${V1}/popups`, id),
    delete: (id: string) => detail(`${V1}/popups`, id),
    track: (id: string) => detail(`${V1}/popups/${id}`, "track"),
  },

  /* ---- Affiliates ---- */
  affiliates: {
    list: (params?: ListParams) => list(`${V1}/affiliates`, params),
    get: (id: string) => detail(`${V1}/affiliates`, id),
    create: () => `${V1}/affiliates`,
    update: (id: string) => detail(`${V1}/affiliates`, id),
    delete: (id: string) => detail(`${V1}/affiliates`, id),
  },

  /* ---- Loyalty ---- */
  loyalty: {
    tiers: () => `${V1}/loyalty/tiers`,
    createTier: () => `${V1}/loyalty/tiers`,
    updateTier: (id: string) => detail(`${V1}/loyalty/tiers`, id),
    deleteTier: (id: string) => detail(`${V1}/loyalty/tiers`, id),
  },

  /* ---- Live Sales ---- */
  liveSales: {
    list: () => `${V1}/live-sales`,
    create: () => `${V1}/live-sales`,
  },

  /* ---- Support Tickets ---- */
  tickets: {
    list: (params?: ListParams) => list(`${V1}/support-tickets`, params),
    get: (id: string) => detail(`${V1}/support-tickets`, id),
    create: () => `${V1}/support-tickets`,
    reply: (id: string) => detail(`${V1}/support-tickets/${id}`, "reply"),
    updateStatus: (id: string) => detail(`${V1}/support-tickets/${id}`, "status"),
  },

  /* ---- Referrals ---- */
  referrals: {
    list: () => `${V1}/referrals`,
    create: () => `${V1}/referrals`,
    delete: (id: string) => detail(`${V1}/referrals`, id),
  },

  /* ---- Abandoned Carts ---- */
  abandonedCarts: {
    list: () => `${V1}/abandoned-carts`,
    create: () => `${V1}/abandoned-carts`,
    recover: (id: string) => detail(`${V1}/abandoned-carts/${id}`, "recover"),
    delete: (id: string) => detail(`${V1}/abandoned-carts`, id),
  },

  /* ---- Settings ---- */
  settings: {
    get: () => `${V1}/settings`,
    update: () => `${V1}/settings`,
    currency: () => `${V1}/settings/currency`,
  },

  /* ---- Search ---- */
  search: {
    query: (q: string, params?: ListParams) => list(`${V1}/search`, { q, ...params }),
  },

  /* ---- Media ---- */
  media: {
    upload: () => `${V1}/media/upload`,
    list: () => `${V1}/media`,
    delete: (id: string) => detail(`${V1}/media`, id),
    importUrl: () => `${V1}/media/import-url`,
    importProductImages: () => `${V1}/media/import-product-images`,
    importBulk: () => `${V1}/media/import-bulk`,
    importProgress: (batchId: string) => detail(`${V1}/media/import-progress`, batchId),
  },

  /* ---- Analytics ---- */
  analytics: {
    overview: () => `${V1}/analytics/overview`,
    sales: (period?: string) => list(`${V1}/analytics/sales`, { period }),
    products: () => `${V1}/analytics/products`,
    customers: () => `${V1}/analytics/customers`,
  },

  /* ---- Webhooks ---- */
  webhooks: {
    list: () => `${V1}/webhooks`,
    create: () => `${V1}/webhooks`,
    update: (id: string) => detail(`${V1}/webhooks`, id),
    delete: (id: string) => detail(`${V1}/webhooks`, id),
    deliveries: (id?: string) =>
      id ? detail(`${V1}/webhooks/${id}`, "deliveries") : `${V1}/webhooks/deliveries`,
  },

  /* ---- Auth ---- */
  auth: {
    login: () => `${V1}/auth/login`,
    logout: () => `${V1}/auth/logout`,
    me: () => `${V1}/auth/me`,
    refresh: () => `${V1}/auth/refresh`,
    /* Customer Auth */
    customerSendOtp: () => `${V1}/auth/customer/send-otp`,
    customerVerifyOtp: () => `${V1}/auth/customer/verify-otp`,
    customerGoogle: () => `${V1}/auth/customer/google`,
    customerApple: () => `${V1}/auth/customer/apple`,
    customerGuest: () => `${V1}/auth/customer/guest`,
    /* Admin Auth */
    adminLogin: () => `${V1}/auth/admin/login`,
    adminSendEmailOtp: () => `${V1}/auth/admin/send-email-otp`,
    adminSendMobileOtp: () => `${V1}/auth/admin/send-mobile-otp`,
    adminVerifyOtp: () => `${V1}/auth/admin/verify-otp`,
    /* Session Management */
    sessions: () => `${V1}/auth/sessions`,
    session: (id: string) => detail(`${V1}/auth/sessions`, id),
    logoutAll: () => `${V1}/auth/logout-all`,
    /* Trusted Devices */
    devices: () => `${V1}/auth/devices`,
    device: (id: string) => detail(`${V1}/auth/devices`, id),
    /* Recovery */
    recoveryCodes: () => `${V1}/auth/recovery/codes`,
    recoveryVerify: () => `${V1}/auth/recovery/verify`,
    recoveryStatus: () => `${V1}/auth/recovery/status`,
    /* Security */
    securityEvents: () => `${V1}/auth/security/events`,
    loginHistory: () => `${V1}/auth/security/login-history`,
    securityStats: () => `${V1}/auth/security/stats`,
    /* Auth Settings */
    authSettings: () => `${V1}/auth/settings`,
  },

  /* ---- AI ---- */
  ai: {
    generate: () => `${V1}/ai/generate`,
    agents: () => `${V1}/ai/agents`,
    agent: (id: string) => detail(`${V1}/ai/agents`, id),
    tasks: () => `${V1}/ai/tasks`,
    task: (id: string) => detail(`${V1}/ai/tasks`, id),
    knowledge: () => `${V1}/ai/knowledge`,
    models: () => `${V1}/ai/models`,
  },

  /* ---- System / Health ---- */
  system: {
    health: () => `${V1}/system/health`,
    info: () => `${V1}/system/info`,
    metrics: () => `${V1}/system/metrics`,
    logs: () => `${V1}/system/logs`,
  },

  /* ---- Import / Export ---- */
  import: {
    products: () => `${V1}/import/products`,
    categories: () => `${V1}/import/categories`,
    customers: () => `${V1}/import/customers`,
  },

  export_: {
    products: (format?: string) => list(`${V1}/export/products`, { format }),
    orders: (format?: string) => list(`${V1}/export/orders`, { format }),
    customers: (format?: string) => list(`${V1}/export/customers`, { format }),
  },
} as const;

export type Endpoints = typeof ENDPOINTS;
