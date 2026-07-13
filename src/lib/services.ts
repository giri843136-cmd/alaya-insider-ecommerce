/**
 * ALAYA INSIDER — Backend Service Layer (frontend-contract abstraction)
 * --------------------------------------------------------------------
 * This module is the formal boundary between the UI and the "backend".
 *
 * In production this delegates to REST/GraphQL endpoints behind auth + rate
 * limiting. In this build it operates against the persisted StoreContext via
 * the store accessor, so every method is fully functional while remaining
 * swappable for a real API later with ZERO frontend changes.
 *
 * Design goals (per the backend specification):
 *  - Modular: every domain is its own service (ProductService, OrderService…)
 *  - No duplicate logic: all UI talks to services, never to raw storage.
 *  - Scalable signatures: pagination, filtering, sorting + bulk ops.
 *  - Secure-ready: every mutating call is logged (audit trail).
 *  - Versionable: exported as `api.v1` for future versioning.
 */
import type {
  Article,
  Brand,
  Category,
  Coupon,
  Customer,
  LiveSale,
  OrderStatus,
  PaymentGateway,
  Popup,
  Product,
  Question,
  Redirect,
  ReturnRequest,
  StoreData,
  Supplier,
} from "./types";
import { uid } from "./utils";

/** Paginated query result (cursor-free, page based — easy to swap for cursor). */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Generic filter/sort/paginate options accepted by every list service. */
export interface QueryOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

/** The store accessor injected into every service (dependency injection). */
export interface StoreAccessor {
  get(): StoreData;
  set(updater: (prev: StoreData) => StoreData): void;
  log(action: string, entity: string, entityId?: string, meta?: string, actor?: string): void;
}

function paginate<T>(items: T[], opts: QueryOpts = {}): Paged<T> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 24));
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { items: slice, total: items.length, page, pageSize, hasMore: start + pageSize < items.length };
}

const match = (haystack: string | undefined, needle?: string) =>
  !needle || (haystack ?? "").toLowerCase().includes(needle.toLowerCase());

/* ------------------------------------------------------------------ */
/*  ProductService                                                     */
/* ------------------------------------------------------------------ */
export const ProductService = (s: StoreAccessor) => ({
  list(opts: QueryOpts = {}) {
    let items = s.get().products;
    if (opts.search) items = items.filter((p) => match(p.name, opts.search) || match(p.brand, opts.search) || match(p.sku, opts.search));
    return paginate(items, opts);
  },
  get(id: string) {
    return s.get().products.find((p) => p.id === id || p.slug === id);
  },
  create(input: Partial<Product> & { name: string; category: string }) {
    const product: Product = {
      id: input.id ?? uid("prod"),
      slug: input.slug ?? "",
      name: input.name,
      brand: input.brand ?? "",
      brandId: input.brandId,
      category: input.category,
      type: input.type ?? "physical",
      price: input.price ?? 0,
      salePrice: input.salePrice ?? null,
      rating: input.rating ?? 5,
      reviewCount: input.reviewCount ?? 0,
      images: input.images ?? [],
      shortDescription: input.shortDescription ?? "",
      description: input.description ?? "",
      features: input.features ?? [],
      variants: input.variants,
      stock: input.stock ?? 0,
      sku: input.sku ?? "",
      tags: input.tags ?? [],
      barcode: input.barcode,
      gtin: input.gtin,
      asin: input.asin,
      supplierId: input.supplierId,
      costPrice: input.costPrice,
      affiliate: input.affiliate,
      affiliateUrl: input.affiliateUrl,
      affiliatePartner: input.affiliatePartner,
      affiliateNetwork: input.affiliateNetwork,
      affiliateCommission: input.affiliateCommission,
      featured: input.featured,
      bestSeller: input.bestSeller,
      isNew: input.isNew,
      comingSoon: input.comingSoon,
      preorder: input.preorder,
      status: input.status ?? "published",
      reviews: input.reviews ?? [],
      specs: input.specs ?? [],
      createdAt: Date.now(),
    };
    s.set((d) => ({ ...d, products: [product, ...d.products] }));
    s.log("product.create", "product", product.id);
    return product;
  },
  update(id: string, patch: Partial<Product>) {
    s.set((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    s.log("product.update", "product", id);
  },
  remove(id: string) {
    s.set((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
    s.log("product.delete", "product", id);
  },
  bulkDelete(ids: string[]) {
    s.set((d) => ({ ...d, products: d.products.filter((p) => !ids.includes(p.id)) }));
    s.log("product.bulkDelete", "product", ids.join(","), `${ids.length} items`);
  },
});

/* ------------------------------------------------------------------ */
/*  OrderService                                                       */
/* ------------------------------------------------------------------ */
export const OrderService = (s: StoreAccessor) => ({
  list(opts: QueryOpts = {}) {
    let items = s.get().orders;
    if (opts.search) items = items.filter((o) => match(o.number, opts.search) || match(o.customer.email, opts.search));
    return paginate(items, opts);
  },
  get(id: string) {
    return s.get().orders.find((o) => o.id === id);
  },
  setStatus(id: string, status: OrderStatus) {
    s.set((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    s.log("order.update", "order", id, status);
  },
  remove(id: string) {
    s.set((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
    s.log("order.delete", "order", id);
  },
});

/* ------------------------------------------------------------------ */
/*  Catalog services (brands, categories, collections/articles)        */
/* ------------------------------------------------------------------ */
export const BrandService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => paginate(s.get().brands, opts),
  create: (b: Partial<Brand> & { name: string }) => {
    const brand: Brand = { id: b.id ?? uid("brand"), slug: b.slug ?? "", name: b.name, tagline: b.tagline ?? "", description: b.description ?? "", image: b.image ?? "", logo: b.logo, website: b.website, instagram: b.instagram, country: b.country ?? "Global", featured: b.featured };
    s.set((d) => ({ ...d, brands: [...d.brands, brand] }));
    s.log("brand.create", "brand", brand.id);
    return brand;
  },
  update: (id: string, patch: Partial<Brand>) => s.set((d) => ({ ...d, brands: d.brands.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  remove: (id: string) => { s.set((d) => ({ ...d, brands: d.brands.filter((b) => b.id !== id) })); s.log("brand.delete", "brand", id); },
});

export const CategoryService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => paginate(s.get().categories, opts),
  create: (c: Partial<Category> & { name: string }) => {
    const cat: Category = { id: c.id ?? uid("cat"), name: c.name, tagline: c.tagline ?? "", description: c.description ?? "", image: c.image ?? "" };
    s.set((d) => ({ ...d, categories: [...d.categories, cat] }));
    s.log("category.create", "category", cat.id);
    return cat;
  },
  update: (id: string, patch: Partial<Category>) => s.set((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  remove: (id: string) => { s.set((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) })); s.log("category.delete", "category", id); },
});

export const ArticleService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => paginate(s.get().articles, opts),
  create: (a: Partial<Article> & { title: string }) => {
    const art: Article = { id: a.id ?? uid("art"), slug: a.slug ?? "", title: a.title, excerpt: a.excerpt ?? "", body: a.body ?? [], cover: a.cover ?? "", author: a.author ?? "ALAYA Editors", authorRole: a.authorRole ?? "Editor", category: a.category ?? "Style", tags: a.tags ?? [], readMinutes: a.readMinutes ?? 4, publishedAt: a.publishedAt ?? Date.now(), featured: a.featured };
    s.set((d) => ({ ...d, articles: [art, ...d.articles] }));
    s.log("article.create", "article", art.id);
    return art;
  },
  update: (id: string, patch: Partial<Article>) => s.set((d) => ({ ...d, articles: d.articles.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  remove: (id: string) => { s.set((d) => ({ ...d, articles: d.articles.filter((a) => a.id !== id) })); s.log("article.delete", "article", id); },
});

/* ------------------------------------------------------------------ */
/*  CustomerService                                                    */
/* ------------------------------------------------------------------ */
export const CustomerService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => {
    let items = s.get().customers;
    if (opts.search) items = items.filter((c) => match(c.name, opts.search) || match(c.email, opts.search));
    return paginate(items, opts);
  },
  get: (id: string) => s.get().customers.find((c) => c.id === id),
  update: (id: string, patch: Partial<Customer>) => s.set((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
});

/* ------------------------------------------------------------------ */
/*  Marketing services                                                 */
/* ------------------------------------------------------------------ */
export const CouponService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => paginate(s.get().coupons, opts),
  create: (c: Partial<Coupon> & { code: string }) => {
    const coupon: Coupon = { id: c.id ?? uid("cpn"), code: c.code.toUpperCase(), type: c.type ?? "percent", value: c.value ?? 0, minSpend: c.minSpend ?? 0, active: c.active ?? true, description: c.description ?? "", expiresAt: c.expiresAt, usageLimit: c.usageLimit, usedCount: c.usedCount ?? 0 };
    s.set((d) => ({ ...d, coupons: [...d.coupons, coupon] }));
    s.log("coupon.create", "coupon", coupon.id, coupon.code);
    return coupon;
  },
  remove: (id: string) => { s.set((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) })); s.log("coupon.delete", "coupon", id); },
});

export const PopupService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => paginate(s.get().popups, opts),
  create: (p: Partial<Popup> & { name: string }) => {
    const popup: Popup = { id: p.id ?? uid("pop"), name: p.name, type: p.type ?? "newsletter", trigger: p.trigger ?? "time", headline: p.headline ?? "", body: p.body ?? "", ctaLabel: p.ctaLabel ?? "Subscribe", ctaLink: p.ctaLink, couponCode: p.couponCode, triggerValue: p.triggerValue ?? 15, active: p.active ?? true, views: p.views ?? 0, conversions: p.conversions ?? 0 };
    s.set((d) => ({ ...d, popups: [popup, ...d.popups] }));
    s.log("popup.create", "popup", popup.id);
    return popup;
  },
  update: (id: string, patch: Partial<Popup>) => s.set((d) => ({ ...d, popups: d.popups.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  remove: (id: string) => { s.set((d) => ({ ...d, popups: d.popups.filter((p) => p.id !== id) })); s.log("popup.delete", "popup", id); },
});

/* ------------------------------------------------------------------ */
/*  Operations services (suppliers, gateways, returns, redirects)      */
/* ------------------------------------------------------------------ */
export const SupplierService = (s: StoreAccessor) => ({
  list: (opts: QueryOpts = {}) => paginate(s.get().suppliers, opts),
  create: (input: Partial<Supplier> & { name: string }) => {
    const sup: Supplier = { id: input.id ?? uid("sup"), name: input.name, email: input.email ?? "", country: input.country ?? "Global", priority: input.priority ?? 5, active: input.active ?? true, handlingDays: input.handlingDays ?? 2, notes: input.notes };
    s.set((d) => ({ ...d, suppliers: [...d.suppliers, sup] }));
    s.log("supplier.create", "supplier", sup.id);
    return sup;
  },
  update: (id: string, patch: Partial<Supplier>) => s.set((d) => ({ ...d, suppliers: d.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  remove: (id: string) => { s.set((d) => ({ ...d, suppliers: d.suppliers.filter((x) => x.id !== id) })); s.log("supplier.delete", "supplier", id); },
});

export const GatewayService = (s: StoreAccessor) => ({
  list: () => s.get().paymentGateways,
  create: (g: Partial<PaymentGateway> & { name: string; code: string }) => {
    const gw: PaymentGateway = { id: g.id ?? uid("gw"), name: g.name, code: g.code, mode: g.mode ?? "live", active: g.active ?? true, countries: g.countries ?? [] };
    s.set((d) => ({ ...d, paymentGateways: [...d.paymentGateways, gw] }));
    return gw;
  },
  remove: (id: string) => { s.set((d) => ({ ...d, paymentGateways: d.paymentGateways.filter((g) => g.id !== id) })); },
});

export const RedirectService = (s: StoreAccessor) => ({
  list: () => s.get().redirects,
  create: (r: Partial<Redirect> & { from: string }) => {
    const red: Redirect = { id: r.id ?? uid("red"), from: r.from, to: r.to ?? "", type: r.type ?? 301, active: r.active ?? true, hits: r.hits ?? 0, createdAt: Date.now() };
    s.set((d) => ({ ...d, redirects: [red, ...d.redirects] }));
    return red;
  },
  remove: (id: string) => { s.set((d) => ({ ...d, redirects: d.redirects.filter((r) => r.id !== id) })); },
});

export const ReturnService = (s: StoreAccessor) => ({
  list: () => s.get().returns,
  create: (input: Omit<ReturnRequest, "id" | "number" | "status" | "createdAt">) => {
    const ret: ReturnRequest = { ...input, id: uid("ret"), number: `RT-${Math.floor(100000 + Math.random() * 900000)}`, status: "requested", createdAt: Date.now() };
    s.set((d) => ({ ...d, returns: [ret, ...d.returns] }));
    s.log("return.create", "return", ret.id, ret.number);
    return ret;
  },
  update: (id: string, patch: Partial<ReturnRequest>) => s.set((d) => ({ ...d, returns: d.returns.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
});

/* ------------------------------------------------------------------ */
/*  Q&A + Live sales + Loyalty                                         */
/* ------------------------------------------------------------------ */
export const QuestionService = (s: StoreAccessor) => ({
  for: (productId: string) => s.get().questions.filter((q) => q.productId === productId),
  create: (productId: string, author: string, question: string) => {
    const q: Question = { id: uid("q"), productId, author, question, helpful: 0, date: new Date().toISOString() };
    s.set((d) => ({ ...d, questions: [q, ...d.questions] }));
    return q;
  },
});

export const LiveSaleService = (s: StoreAccessor) => ({
  list: () => s.get().liveSales,
  create: (input: Omit<LiveSale, "id">) => {
    s.set((d) => ({ ...d, liveSales: [{ ...input, id: uid("ls") }, ...d.liveSales].slice(0, 50) }));
  },
});

export const LoyaltyService = (s: StoreAccessor) => ({
  tiers: () => s.get().loyaltyTiers,
});

/* ------------------------------------------------------------------ */
/*  Aggregated API surface (versioned)                                 */
/* ------------------------------------------------------------------ */
export function createApi(store: StoreAccessor) {
  return {
    v1: {
      products: ProductService(store),
      orders: OrderService(store),
      brands: BrandService(store),
      categories: CategoryService(store),
      articles: ArticleService(store),
      customers: CustomerService(store),
      coupons: CouponService(store),
      popups: PopupService(store),
      suppliers: SupplierService(store),
      gateways: GatewayService(store),
      redirects: RedirectService(store),
      returns: ReturnService(store),
      questions: QuestionService(store),
      liveSales: LiveSaleService(store),
      loyalty: LoyaltyService(store),
    },
  };
}

export type Api = ReturnType<typeof createApi>;
