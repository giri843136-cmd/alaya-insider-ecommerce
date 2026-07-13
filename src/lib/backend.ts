/**
 * ALAYA INSIDER — Backend Adapter (API ↔ StoreContext Bridge)
 * --------------------------------------------------------------------------
 * This module adapts between the StoreContext (which manages in-memory state
 * + localStorage persistence) and the remote REST API.
 *
 * Architecture:
 *   StoreContext <──> BackendAdapter <──> api-client <──> REST API
 *                         │
 *                         └──> localStorage (fallback when offline)
 *
 * Every CRUD operation performed through StoreContext:
 *   1. Attempts the API call first
 *   2. On success, updates StoreContext in-memory state
 *   3. On failure (with localStorageFallback enabled), falls back to
 *      StoreContext's own localStorage persistence
 *
 * When the backend is not configured at all, the adapter is a no-op pass-through
 * and StoreContext operates in offline/localStorage mode exclusively.
 */

import type { ApiResponse } from "./api-client";
import { isApiConfigured, getApiConfig } from "./api-config";

export { isApiConfigured };
import { api, ApiHttpError } from "./api-client";
import { ENDPOINTS, type ListParams, type PaginatedResponse } from "./api-endpoints";
import { pushLog } from "./devops";

import type {
  AffPartner,
  Article,
  Brand,
  Category,
  Coupon,
  Customer,
  LiveSale,
  LoyaltyTier,
  Order,
  OrderStatus,
  PaymentGateway,
  Popup,
  Product,
  Question,
  Redirect,
  ReturnRequest,
  Settings,
  Supplier,
  SupportTicket,
} from "./types";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type BackendMode = "online" | "offline" | "hybrid";

export interface BackendStatus {
  mode: BackendMode;
  configured: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
  healthUrl: string;
}

/* ================================================================== */
/*  STATE                                                              */
/* ================================================================== */

let _lastSyncAt: number | null = null;
let _lastError: string | null = null;
let _mode: BackendMode = "offline";

function determineMode(): BackendMode {
  const cfg = getApiConfig();
  if (!cfg.apiUrl) return "offline";
  return cfg.localStorageFallback ? "hybrid" : "online";
}

/* ================================================================== */
/*  HEALTH CHECK                                                       */
/* ================================================================== */

/**
 * Ping the backend health endpoint to verify connectivity.
 * Returns true if the backend is reachable and healthy.
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (!isApiConfigured()) {
    _mode = "offline";
    return false;
  }

  try {
    const res = await api.get<{ status: string }>(
      ENDPOINTS.system.health(),
      { timeout: 5_000, noAuth: true },
    );
    const healthy = res.data?.status === "healthy" || res.data?.status === "ok";
    if (healthy) {
      _mode = determineMode();
      _lastSyncAt = Date.now();
      _lastError = null;
      pushLog("info", "system", "Backend health check passed");
    } else {
      _lastError = `Backend status: ${res.data?.status}`;
    }
    return healthy;
  } catch (err) {
    _lastError = err instanceof ApiHttpError ? err.message : "Connection failed";
    _mode = determineMode();
    pushLog("warning", "system", `Backend health check failed: ${_lastError}`);
    return false;
  }
}

/**
 * Get the current backend connection status.
 */
export function getBackendStatus(): BackendStatus {
  const cfg = getApiConfig();
  return {
    mode: _mode,
    configured: Boolean(cfg.apiUrl),
    lastSyncAt: _lastSyncAt,
    lastError: _lastError,
    healthUrl: cfg.apiUrl ? `${cfg.apiUrl}/system/health` : "",
  };
}

/* ================================================================== */
/*  SYNC HELPERS                                                       */
/* ================================================================== */

/**
 * Attempt a backend call. On success returns the data.
 * On failure, returns null (the caller should fall back to local state).
 * Logs errors once to avoid log spam.
 */
async function tryCall<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!isApiConfigured()) {
    return { ok: false, error: "Backend not configured" };
  }

  try {
    const result = await fn();
    _lastError = null;
    return { ok: true, data: result };
  } catch (err) {
    const message =
      err instanceof ApiHttpError ? err.message : (err as Error).message ?? "Unknown error";
    _lastError = message;
    pushLog("warning", "api", `Backend ${label} failed: ${message}`);
    return { ok: false, error: message };
  }
}

/* ================================================================== */
/*  BACKEND FACADE                                                     */
/* ================================================================== */

/**
 * The Backend object mirrors the StoreContext CRUD interface.
 * Each method attempts the API first, with graceful local fallback.
 *
 * Methods return { synced: boolean } to indicate whether the change
 * was successfully persisted to the backend.
 */

export const Backend = {
  /* ============================================================== */
  /*  PRODUCTS                                                       */
  /* ============================================================== */

  async listProducts(params?: ListParams) {
    return tryCall("listProducts", () =>
      api.get<PaginatedResponse<Product>>(ENDPOINTS.products.list(params)),
    );
  },

  async getProduct(id: string) {
    return tryCall("getProduct", () =>
      api.get<Product>(ENDPOINTS.products.get(id)),
    );
  },

  async getProductBySlug(slug: string) {
    return tryCall("getProductBySlug", () =>
      api.get<Product>(ENDPOINTS.products.bySlug(slug)),
    );
  },

  async createProduct(input: Partial<Product> & { name: string; category: string }) {
    return tryCall("createProduct", () =>
      api.post<Product>(ENDPOINTS.products.create(), input),
    );
  },

  async updateProduct(id: string, patch: Partial<Product>) {
    return tryCall("updateProduct", () =>
      api.patch<Product>(ENDPOINTS.products.update(id), patch),
    );
  },

  async deleteProduct(id: string) {
    return tryCall("deleteProduct", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.products.delete(id)),
    );
  },

  async bulkDeleteProducts(ids: string[]) {
    return tryCall("bulkDeleteProducts", () =>
      api.post<{ success: boolean }>(ENDPOINTS.products.bulk(), {
        action: "delete",
        ids,
      }),
    );
  },

  /* ============================================================== */
  /*  ORDERS                                                         */
  /* ============================================================== */

  async listOrders(params?: ListParams) {
    return tryCall("listOrders", () =>
      api.get<PaginatedResponse<Order>>(ENDPOINTS.orders.list(params)),
    );
  },

  async getOrder(id: string) {
    return tryCall("getOrder", () =>
      api.get<Order>(ENDPOINTS.orders.get(id)),
    );
  },

  async createOrder(input: {
    items: Order["items"];
    customer: Order["customer"];
    discount?: number;
    shipping?: number;
    tax?: number;
    couponCode?: string;
    paymentMethod?: string;
    notes?: string;
  }) {
    return tryCall("createOrder", () =>
      api.post<Order>(ENDPOINTS.orders.create(), input),
    );
  },

  async updateOrderStatus(id: string, status: OrderStatus) {
    return tryCall("updateOrderStatus", () =>
      api.patch<Order>(ENDPOINTS.orders.updateStatus(id), { status }),
    );
  },

  async deleteOrder(id: string) {
    return tryCall("deleteOrder", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.orders.delete(id)),
    );
  },

  /* ============================================================== */
  /*  CATEGORIES                                                     */
  /* ============================================================== */

  async listCategories(params?: ListParams) {
    return tryCall("listCategories", () =>
      api.get<PaginatedResponse<Category>>(ENDPOINTS.categories.list(params)),
    );
  },

  async createCategory(input: Partial<Category> & { name: string }) {
    return tryCall("createCategory", () =>
      api.post<Category>(ENDPOINTS.categories.create(), input),
    );
  },

  async updateCategory(id: string, patch: Partial<Category>) {
    return tryCall("updateCategory", () =>
      api.patch<Category>(ENDPOINTS.categories.update(id), patch),
    );
  },

  async deleteCategory(id: string) {
    return tryCall("deleteCategory", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.categories.delete(id)),
    );
  },

  /* ============================================================== */
  /*  BRANDS                                                         */
  /* ============================================================== */

  async listBrands(params?: ListParams) {
    return tryCall("listBrands", () =>
      api.get<PaginatedResponse<Brand>>(ENDPOINTS.brands.list(params)),
    );
  },

  async createBrand(input: Partial<Brand> & { name: string }) {
    return tryCall("createBrand", () =>
      api.post<Brand>(ENDPOINTS.brands.create(), input),
    );
  },

  async updateBrand(id: string, patch: Partial<Brand>) {
    return tryCall("updateBrand", () =>
      api.patch<Brand>(ENDPOINTS.brands.update(id), patch),
    );
  },

  async deleteBrand(id: string) {
    return tryCall("deleteBrand", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.brands.delete(id)),
    );
  },

  /* ============================================================== */
  /*  COUPONS                                                        */
  /* ============================================================== */

  async listCoupons(params?: ListParams) {
    return tryCall("listCoupons", () =>
      api.get<PaginatedResponse<Coupon>>(ENDPOINTS.coupons.list(params)),
    );
  },

  async createCoupon(input: Partial<Coupon> & { code: string }) {
    return tryCall("createCoupon", () =>
      api.post<Coupon>(ENDPOINTS.coupons.create(), input),
    );
  },

  async updateCoupon(id: string, patch: Partial<Coupon>) {
    return tryCall("updateCoupon", () =>
      api.patch<Coupon>(ENDPOINTS.coupons.update(id), patch),
    );
  },

  async deleteCoupon(id: string) {
    return tryCall("deleteCoupon", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.coupons.delete(id)),
    );
  },

  async validateCoupon(code: string, subtotal: number) {
    return tryCall("validateCoupon", () =>
      api.post<{ valid: boolean; coupon?: Coupon; discount: number; message: string }>(
        ENDPOINTS.coupons.validate(),
        { code, subtotal },
      ),
    );
  },

  /* ============================================================== */
  /*  ARTICLES / JOURNAL                                             */
  /* ============================================================== */

  async listArticles(params?: ListParams) {
    return tryCall("listArticles", () =>
      api.get<PaginatedResponse<Article>>(ENDPOINTS.articles.list(params)),
    );
  },

  async getArticle(id: string) {
    return tryCall("getArticle", () =>
      api.get<Article>(ENDPOINTS.articles.get(id)),
    );
  },

  async createArticle(input: Partial<Article> & { title: string }) {
    return tryCall("createArticle", () =>
      api.post<Article>(ENDPOINTS.articles.create(), input),
    );
  },

  async updateArticle(id: string, patch: Partial<Article>) {
    return tryCall("updateArticle", () =>
      api.patch<Article>(ENDPOINTS.articles.update(id), patch),
    );
  },

  async deleteArticle(id: string) {
    return tryCall("deleteArticle", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.articles.delete(id)),
    );
  },

  /* ============================================================== */
  /*  CUSTOMERS & AUTH                                               */
  /* ============================================================== */

  async listCustomers(params?: ListParams) {
    return tryCall("listCustomers", () =>
      api.get<PaginatedResponse<Customer>>(ENDPOINTS.customers.list(params)),
    );
  },

  async getCustomer(id: string) {
    return tryCall("getCustomer", () =>
      api.get<Customer>(ENDPOINTS.customers.get(id)),
    );
  },

  async registerCustomer(name: string, email: string, password: string) {
    return tryCall("registerCustomer", () =>
      api.post<Customer>(ENDPOINTS.customers.register(), { name, email, password }),
    );
  },

  async loginCustomer(email: string, password: string) {
    return tryCall("loginCustomer", () =>
      api.post<{ customer: Customer; token: string }>(ENDPOINTS.customers.login(), {
        email,
        password,
      }),
    );
  },

  async updateCustomer(id: string, patch: Partial<Customer>) {
    return tryCall("updateCustomer", () =>
      api.patch<Customer>(ENDPOINTS.customers.update(id), patch),
    );
  },

  async deleteCustomer(id: string) {
    return tryCall("deleteCustomer", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.customers.delete(id)),
    );
  },

  /* ============================================================== */
  /*  CUSTOMER CRM (notes, tasks, timeline, tickets)                 */
  /* ============================================================== */

  async addCustomerNote(customerId: string, author: string, body: string, pinned?: boolean) {
    return tryCall("addCustomerNote", () =>
      api.post(ENDPOINTS.customers.notes(customerId), { author, body, pinned }),
    );
  },

  async addCustomerTask(
    customerId: string,
    task: { title: string; type: string; assignee: string; priority: string },
  ) {
    return tryCall("addCustomerTask", () =>
      api.post(ENDPOINTS.customers.tasks(customerId), task),
    );
  },

  async addTimelineEvent(
    customerId: string,
    type: string,
    label: string,
    meta?: string,
  ) {
    return tryCall("addTimelineEvent", () =>
      api.post(ENDPOINTS.customers.timeline(customerId), { type, label, meta }),
    );
  },

  /* ============================================================== */
  /*  QUESTIONS                                                      */
  /* ============================================================== */

  async questionsFor(productId: string) {
    return tryCall("questionsFor", () =>
      api.get<Question[]>(ENDPOINTS.questions.forProduct(productId)),
    );
  },

  async createQuestion(productId: string, author: string, question: string) {
    return tryCall("createQuestion", () =>
      api.post<Question>(ENDPOINTS.questions.create(productId), { author, question }),
    );
  },

  async answerQuestion(id: string, answer: string, answeredBy?: string) {
    return tryCall("answerQuestion", () =>
      api.patch<Question>(ENDPOINTS.questions.answer(id), { answer, answeredBy }),
    );
  },

  /* ============================================================== */
  /*  SUPPLIERS                                                      */
  /* ============================================================== */

  async listSuppliers(params?: ListParams) {
    return tryCall("listSuppliers", () =>
      api.get<PaginatedResponse<Supplier>>(ENDPOINTS.suppliers.list(params)),
    );
  },

  async createSupplier(input: Partial<Supplier> & { name: string }) {
    return tryCall("createSupplier", () =>
      api.post<Supplier>(ENDPOINTS.suppliers.create(), input),
    );
  },

  async updateSupplier(id: string, patch: Partial<Supplier>) {
    return tryCall("updateSupplier", () =>
      api.patch<Supplier>(ENDPOINTS.suppliers.update(id), patch),
    );
  },

  async deleteSupplier(id: string) {
    return tryCall("deleteSupplier", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.suppliers.delete(id)),
    );
  },

  /* ============================================================== */
  /*  PAYMENT GATEWAYS                                               */
  /* ============================================================== */

  async listGateways(params?: ListParams) {
    return tryCall("listGateways", () =>
      api.get<PaginatedResponse<PaymentGateway>>(ENDPOINTS.gateways.list(params)),
    );
  },

  async createGateway(input: Partial<PaymentGateway> & { name: string; code: string }) {
    return tryCall("createGateway", () =>
      api.post<PaymentGateway>(ENDPOINTS.gateways.create(), input),
    );
  },

  async updateGateway(id: string, patch: Partial<PaymentGateway>) {
    return tryCall("updateGateway", () =>
      api.patch<PaymentGateway>(ENDPOINTS.gateways.update(id), patch),
    );
  },

  async deleteGateway(id: string) {
    return tryCall("deleteGateway", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.gateways.delete(id)),
    );
  },

  /* ============================================================== */
  /*  RETURNS                                                        */
  /* ============================================================== */

  async listReturns(params?: ListParams) {
    return tryCall("listReturns", () =>
      api.get<PaginatedResponse<ReturnRequest>>(ENDPOINTS.returns.list(params)),
    );
  },

  async createReturn(
    input: Omit<ReturnRequest, "id" | "number" | "status" | "createdAt">,
  ) {
    return tryCall("createReturn", () =>
      api.post<ReturnRequest>(ENDPOINTS.returns.create(), input),
    );
  },

  async updateReturn(id: string, patch: Partial<ReturnRequest>) {
    return tryCall("updateReturn", () =>
      api.patch<ReturnRequest>(ENDPOINTS.returns.update(id), patch),
    );
  },

  /* ============================================================== */
  /*  REDIRECTS                                                      */
  /* ============================================================== */

  async listRedirects() {
    return tryCall("listRedirects", () =>
      api.get<Redirect[]>(ENDPOINTS.redirects.list()),
    );
  },

  async createRedirect(input: Partial<Redirect> & { from: string }) {
    return tryCall("createRedirect", () =>
      api.post<Redirect>(ENDPOINTS.redirects.create(), input),
    );
  },

  async updateRedirect(id: string, patch: Partial<Redirect>) {
    return tryCall("updateRedirect", () =>
      api.patch<Redirect>(ENDPOINTS.redirects.update(id), patch),
    );
  },

  async deleteRedirect(id: string) {
    return tryCall("deleteRedirect", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.redirects.delete(id)),
    );
  },

  /* ============================================================== */
  /*  POPUPS                                                         */
  /* ============================================================== */

  async listPopups(params?: ListParams) {
    return tryCall("listPopups", () =>
      api.get<PaginatedResponse<Popup>>(ENDPOINTS.popups.list(params)),
    );
  },

  async createPopup(input: Partial<Popup> & { name: string }) {
    return tryCall("createPopup", () =>
      api.post<Popup>(ENDPOINTS.popups.create(), input),
    );
  },

  async updatePopup(id: string, patch: Partial<Popup>) {
    return tryCall("updatePopup", () =>
      api.patch<Popup>(ENDPOINTS.popups.update(id), patch),
    );
  },

  async deletePopup(id: string) {
    return tryCall("deletePopup", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.popups.delete(id)),
    );
  },

  async trackPopup(id: string, converted: boolean) {
    return tryCall("trackPopup", () =>
      api.post<Popup>(ENDPOINTS.popups.track(id), { converted }),
    );
  },

  /* ============================================================== */
  /*  AFFILIATES                                                     */
  /* ============================================================== */

  async listAffiliates() {
    return tryCall("listAffiliates", () =>
      api.get<AffPartner[]>(ENDPOINTS.affiliates.list()),
    );
  },

  async createAffiliate(input: Partial<AffPartner> & { name: string; url: string }) {
    return tryCall("createAffiliate", () =>
      api.post<AffPartner>(ENDPOINTS.affiliates.create(), input),
    );
  },

  async updateAffiliate(id: string, patch: Partial<AffPartner>) {
    return tryCall("updateAffiliate", () =>
      api.patch<AffPartner>(ENDPOINTS.affiliates.update(id), patch),
    );
  },

  async deleteAffiliate(id: string) {
    return tryCall("deleteAffiliate", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.affiliates.delete(id)),
    );
  },

  /* ============================================================== */
  /*  LOYALTY TIERS                                                  */
  /* ============================================================== */

  async listLoyaltyTiers() {
    return tryCall("listLoyaltyTiers", () =>
      api.get<LoyaltyTier[]>(ENDPOINTS.loyalty.tiers()),
    );
  },

  async createLoyaltyTier(input: Partial<LoyaltyTier> & { name: string }) {
    return tryCall("createLoyaltyTier", () =>
      api.post<LoyaltyTier>(ENDPOINTS.loyalty.createTier(), input),
    );
  },

  async updateLoyaltyTier(id: string, patch: Partial<LoyaltyTier>) {
    return tryCall("updateLoyaltyTier", () =>
      api.patch<LoyaltyTier>(ENDPOINTS.loyalty.updateTier(id), patch),
    );
  },

  async deleteLoyaltyTier(id: string) {
    return tryCall("deleteLoyaltyTier", () =>
      api.delete<{ success: boolean }>(ENDPOINTS.loyalty.deleteTier(id)),
    );
  },

  /* ============================================================== */
  /*  LIVE SALES                                                     */
  /* ============================================================== */

  async listLiveSales() {
    return tryCall("listLiveSales", () =>
      api.get<LiveSale[]>(ENDPOINTS.liveSales.list()),
    );
  },

  async createLiveSale(sale: Omit<LiveSale, "id">) {
    return tryCall("createLiveSale", () =>
      api.post<LiveSale>(ENDPOINTS.liveSales.create(), sale),
    );
  },

  /* ============================================================== */
  /*  SETTINGS                                                       */
  /* ============================================================== */

  async getSettings() {
    return tryCall("getSettings", () =>
      api.get<Settings>(ENDPOINTS.settings.get()),
    );
  },

  async updateSettings(patch: Partial<Settings>) {
    return tryCall("updateSettings", () =>
      api.patch<Settings>(ENDPOINTS.settings.update(), patch),
    );
  },

  /* ============================================================== */
  /*  SUPPORT TICKETS                                                */
  /* ============================================================== */

  async listTickets(params?: ListParams) {
    return tryCall("listTickets", () =>
      api.get<PaginatedResponse<SupportTicket>>(ENDPOINTS.tickets.list(params)),
    );
  },

  async replyToTicket(id: string, author: string, body: string) {
    return tryCall("replyToTicket", () =>
      api.post<SupportTicket>(ENDPOINTS.tickets.reply(id), { author, body }),
    );
  },

  async updateTicketStatus(id: string, status: SupportTicket["status"]) {
    return tryCall("updateTicketStatus", () =>
      api.patch<SupportTicket>(ENDPOINTS.tickets.updateStatus(id), { status }),
    );
  },

  /* ============================================================== */
  /*  SEARCH                                                         */
  /* ============================================================== */

  async search(query: string, params?: ListParams) {
    return tryCall("search", () =>
      api.get<PaginatedResponse<Product>>(ENDPOINTS.search.query(query, params)),
    );
  },

  /* ============================================================== */
  /*  INITIAL SYNC                                                   */
  /* ============================================================== */

  /**
   * Perform an initial full data sync from the backend.
   * Called once when the app boots (if backend is configured).
   * Returns all entities that should be hydrated into StoreContext.
   */
  /**
   * Perform an initial full data sync from the backend.
   * Each backend method returns `{ ok: true; data: ApiResponse<T> }` via `tryCall`,
   * so we unwrap `ApiResponse.data` to get the inner payload.
   */
  async fetchAll(): Promise<{
    products: Product[];
    categories: Category[];
    brands: Brand[];
    orders: Order[];
    coupons: Coupon[];
    articles: Article[];
    customers: Customer[];
    suppliers: Supplier[];
    paymentGateways: PaymentGateway[];
    returns: ReturnRequest[];
    redirects: Redirect[];
    popups: Popup[];
    affiliates: AffPartner[];
    loyaltyTiers: LoyaltyTier[];
    liveSales: LiveSale[];
    settings: Settings | null;
  } | null> {
    if (!isApiConfigured()) return null;

    const healthy = await checkBackendHealth();
    if (!healthy) return null;

    // Fetch in parallel for speed — each returns tryCall wrapper
    const results = await Promise.allSettled([
      this.listProducts({ pageSize: 200 }),
      this.listCategories({ pageSize: 100 }),
      this.listBrands({ pageSize: 100 }),
      this.listOrders({ pageSize: 200 }),
      this.listCoupons({ pageSize: 100 }),
      this.listArticles({ pageSize: 100 }),
      this.listCustomers({ pageSize: 200 }),
      this.listSuppliers({ pageSize: 100 }),
      this.listGateways({ pageSize: 100 }),
      this.listReturns({ pageSize: 100 }),
      this.listRedirects(),
      this.listPopups({ pageSize: 100 }),
      this.listAffiliates(),
      this.listLoyaltyTiers(),
      this.listLiveSales(),
      this.getSettings(),
    ]);

    // Helper: extract from paginated endpoints where data is ApiResponse<PaginatedResponse<T>>
    const extractPaginated = <T>(
      result: (typeof results)[number],
    ): T[] => {
      if (result.status !== "fulfilled" || !result.value.ok) return [];
      const apiResp = result.value.data as ApiResponse<PaginatedResponse<T>>;
      const paginated = apiResp.data;
      if (paginated && Array.isArray(paginated.data)) return paginated.data;
      return [];
    };

    // Helper: extract from non-paginated endpoints where data is ApiResponse<T[]>
    const extractList = <T>(
      result: (typeof results)[number],
    ): T[] => {
      if (result.status !== "fulfilled" || !result.value.ok) return [];
      const apiResp = result.value.data as ApiResponse<T[]>;
      if (Array.isArray(apiResp.data)) return apiResp.data;
      return [];
    };

    // Helper: extract single entity (settings)
    const extractSingle = <T>(
      result: (typeof results)[number],
    ): T | null => {
      if (result.status !== "fulfilled" || !result.value.ok) return null;
      const apiResp = result.value.data as ApiResponse<T>;
      return apiResp.data ?? null;
    };

    return {
      products: extractPaginated<Product>(results[0]),
      categories: extractPaginated<Category>(results[1]),
      brands: extractPaginated<Brand>(results[2]),
      orders: extractPaginated<Order>(results[3]),
      coupons: extractPaginated<Coupon>(results[4]),
      articles: extractPaginated<Article>(results[5]),
      customers: extractPaginated<Customer>(results[6]),
      suppliers: extractPaginated<Supplier>(results[7]),
      paymentGateways: extractPaginated<PaymentGateway>(results[8]),
      returns: extractPaginated<ReturnRequest>(results[9]),
      redirects: extractList<Redirect>(results[10]),
      popups: extractPaginated<Popup>(results[11]),
      affiliates: extractList<AffPartner>(results[12]),
      loyaltyTiers: extractList<LoyaltyTier>(results[13]),
      liveSales: extractList<LiveSale>(results[14]),
      settings: extractSingle<Settings>(results[15]),
    };
  },
} as const;

export type BackendType = typeof Backend;
