import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AbandonedCart,
  Address,
  AffPartner,
  Article,
  AuditLog,
  Brand,
  Category,
  Coupon,
  Customer,
  LiveSale,
  LoyaltyTier,
  Order,
  OrderItem,
  OrderStatus,
  PaymentGateway,
  Popup,
  Product,
  Question,
  Redirect,
  Referral,
  ReturnRequest,
  Settings,
  StoreData,
  Supplier,
  SupportTicket,
  TimelineEvent,
  CustomerNote,
  CustomerTask,
} from "../lib/types";
import { CURRENCIES, orderNumber, slugify, uid } from "../lib/utils";
import { isApiConfigured } from "../lib/api-config";
import type { BackendType } from "../lib/backend";

/** Lazy-loaded Backend adapter — avoids pulling in api-client + api-endpoints + devops into the main chunk.
 *  The module is imported once on first `sync()` call (or `fetchAll`). */
let _Backend: BackendType | null = null;
let _backendPromise: Promise<void> | null = null;

async function ensureBackend(): Promise<void> {
  if (_Backend) return;
  if (_backendPromise) return _backendPromise;
  _backendPromise = import("../lib/backend").then((mod) => {
    _Backend = mod.Backend;
  }).catch(() => {
    _backendPromise = null; // allow retry on next call
  });
  return _backendPromise;
}

const STORAGE_KEY = "alaya_store_v11";
const STORE_VERSION = 11;

/** Inline default settings — avoids pulling in 89 KB seed-data.ts on first load. */
const DEFAULT_SETTINGS: Settings = {
  storeName: "ALAYA INSIDER", storeShort: "ALAYA",
  tagline: "Premium Editorial Shopping — Curated by Experts",
  description: "ALAYA INSIDER discovers and curates the finest products from around the world.",
  defaultTheme: "light", defaultLanguage: "en", accentLight: "#9c7a4b", accentDark: "#c9a876",
  currency: { code: "USD", symbol: "$", rate: 1 },
  announcement: { enabled: true, text: "Free shipping on orders over $150 | Use code INSIDER15 for 15% off orders $200+", link: "/shop" },
  announcements: [],
  heroSlides: [],
  homeSections: [
    { id: "sec_hero", label: "Hero Slider", enabled: true },
    { id: "sec_featured", label: "Featured Products", enabled: true },
  ],
  design: { primary: "#211c15", secondary: "#6e6356", accent: "#9c7a4b", success: "#4b7a52", warning: "#b9802f", danger: "#b14b46", info: "#4f6da3", fontHeading: "Playfair Display", fontBody: "Inter", radiusSm: 8, radiusMd: 14, radiusLg: 20, shadowSoft: true, animationSpeed: "normal" },
  header: { sticky: true, transparent: true, showAnnouncement: true, showMegaMenu: true, showSearch: true, showWishlist: true, showCompare: true, showNotifications: true, showAccount: true, showDarkMode: true, showLanguage: true, showCurrency: true },
  footer: { showNewsletter: true, showSocial: true, showPolicies: true, showPayments: true, showTrustBadges: true, showAffiliateDisclosure: true },
  shipping: { freeOver: 150, flatRate: 12 },
  taxRate: 0.08, contactEmail: "hello@alayainsider.com", supportEmail: "support@alayainsider.com",
  contactPhone: "+1 (212) 555-0198", address: "200 Park Avenue South, Suite 1500, New York, NY 10003",
  social: { instagram: "https://instagram.com/alayainsider", pinterest: "https://pinterest.com/alayainsider", tiktok: "https://tiktok.com/@alayainsider", youtube: "https://youtube.com/@alayainsider", x: "https://x.com/alayainsider" },
  seo: { title: "ALAYA INSIDER — Premium Editorial Shopping", description: "Discover the finest curated products from around the world.", keywords: "premium shopping, curated products, ALAYA INSIDER", ogImage: "", twitterHandle: "@alayainsider" },
  features: { wishlist: true, compare: true, recentlyViewed: true, darkMode: true, affiliate: true, reviews: true, digital: true, coupons: true, brands: true, journal: true, accounts: true, multiLanguage: true },
  adminEmail: "alayainsider@gmail.com", adminPhone: "+91 8431364706", adminPassword: "Alaya@1923",
  mfaMethod: "email_sms", totpSecret: "", totpVerified: false, totpBackupCodes: [],
};

const EMPTY_STORE: StoreData = {
  version: STORE_VERSION,
  products: [], categories: [], brands: [], orders: [], coupons: [], articles: [], customers: [],
  questions: [], suppliers: [], paymentGateways: [], returns: [], redirects: [], popups: [],
  abandonedCarts: [], referrals: [], loyaltyTiers: [], liveSales: [], supportTickets: [],
  affiliates: [], auditLogs: [], settings: DEFAULT_SETTINGS,
};

function loadStore(): StoreData {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || parsed.version !== STORE_VERSION) return EMPTY_STORE;
    // merge-proof: ensure newer arrays exist on older persisted blobs
    const merged: StoreData = {
      ...parsed,
      brands: parsed.brands ?? [],
      coupons: parsed.coupons ?? [],
      articles: parsed.articles ?? [],
      customers: parsed.customers ?? [],
      questions: parsed.questions ?? [],
      redirects: parsed.redirects ?? [],
      popups: parsed.popups ?? [],
      abandonedCarts: parsed.abandonedCarts ?? [],
      referrals: parsed.referrals ?? [],
      loyaltyTiers: parsed.loyaltyTiers ?? [],
      liveSales: parsed.liveSales ?? [],
      supportTickets: parsed.supportTickets ?? [],
      auditLogs: parsed.auditLogs ?? [],
    };
    // backfill newer settings arrays without clobbering existing values
    merged.settings = {
      ...DEFAULT_SETTINGS,
      ...parsed.settings,
      announcements: parsed.settings.announcements ?? DEFAULT_SETTINGS.announcements,
      heroSlides: parsed.settings.heroSlides?.length ? parsed.settings.heroSlides : DEFAULT_SETTINGS.heroSlides,
      homeSections: parsed.settings.homeSections?.length ? parsed.settings.homeSections : DEFAULT_SETTINGS.homeSections,
      design: parsed.settings.design ?? DEFAULT_SETTINGS.design,
      header: parsed.settings.header ?? DEFAULT_SETTINGS.header,
      footer: parsed.settings.footer ?? DEFAULT_SETTINGS.footer,
    };
    return merged;
  } catch {
    return EMPTY_STORE;
  }
}

interface NewOrderInput {
  items: OrderItem[];
  customer: Order["customer"];
  discount?: number;
  shipping?: number;
  tax?: number;
  couponCode?: string;
  couponId?: string;
  paymentMethod?: string;
  notes?: string;
  giftMessage?: string;
}

export interface CouponResult {
  ok: boolean;
  coupon?: Coupon;
  discount: number;
  message: string;
}

interface StoreContextValue {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  coupons: Coupon[];
  articles: Article[];
  customers: Customer[];
  questions: Question[];
  suppliers: Supplier[];
  paymentGateways: PaymentGateway[];
  returns: ReturnRequest[];
  redirects: Redirect[];
  popups: Popup[];
  abandonedCarts: AbandonedCart[];
  referrals: Referral[];
  loyaltyTiers: LoyaltyTier[];
  liveSales: LiveSale[];
  supportTickets: SupportTicket[];
  affiliates: AffPartner[];
  auditLogs: AuditLog[];
  settings: Settings;

  getProduct: (slugOrId: string) => Product | undefined;
  getBrand: (id: string) => Brand | undefined;
  getArticle: (slugOrId: string) => Article | undefined;
  productsByCategory: (categoryId: string) => Product[];
  productsByBrand: (brandId: string) => Product[];

  addProduct: (p: Partial<Product> & { name: string; category: string }) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  cloneProduct: (id: string) => Product | undefined;
  bulkUpdateProducts: (ids: string[], patch: Partial<Product>) => void;
  bulkDeleteProducts: (ids: string[]) => void;

  addCategory: (c: Partial<Category> & { name: string }) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBrand: (b: Partial<Brand> & { name: string }) => Brand;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;

  placeOrder: (input: NewOrderInput) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  addCoupon: (c: Partial<Coupon> & { code: string }) => Coupon;
  updateCoupon: (id: string, patch: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  validateCoupon: (code: string, subtotal: number) => CouponResult;

  addArticle: (a: Partial<Article> & { title: string }) => Article;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  addQuestion: (productId: string, author: string, question: string) => Question;
  answerQuestion: (id: string, answer: string, answeredBy?: string) => void;
  voteQuestion: (id: string) => void;
  questionsFor: (productId: string) => Question[];

  addRedirect: (r: Partial<Redirect> & { from: string }) => Redirect;
  updateRedirect: (id: string, patch: Partial<Redirect>) => void;
  deleteRedirect: (id: string) => void;
  wouldCreateLoop: (from: string, to: string) => boolean;

  addPopup: (p: Partial<Popup> & { name: string }) => Popup;
  updatePopup: (id: string, patch: Partial<Popup>) => void;
  deletePopup: (id: string) => void;
  trackPopup: (id: string, converted: boolean) => void;

  addAbandonedCart: (input: Omit<AbandonedCart, "id" | "recovered" | "createdAt">) => AbandonedCart;
  recoverAbandonedCart: (id: string) => void;
  deleteAbandonedCart: (id: string) => void;

  addReferral: (customerName: string) => Referral;
  deleteReferral: (id: string) => void;

  addTier: (t: Partial<LoyaltyTier> & { name: string }) => LoyaltyTier;
  updateTier: (id: string, patch: Partial<LoyaltyTier>) => void;
  deleteTier: (id: string) => void;

  addLiveSale: (s: Omit<LiveSale, "id">) => void;

  addCustomerNote: (customerId: string, author: string, body: string, pinned?: boolean, isPrivate?: boolean) => void;
  deleteCustomerNote: (customerId: string, noteId: string) => void;
  addCustomerTask: (customerId: string, task: Omit<CustomerTask, "id" | "ts">) => void;
  toggleCustomerTask: (customerId: string, taskId: string) => void;
  addTimelineEvent: (customerId: string, type: TimelineEvent["type"], label: string, meta?: string) => void;
  replyTicket: (id: string, author: string, body: string) => void;
  updateTicketStatus: (id: string, status: SupportTicket["status"]) => void;

  addSupplier: (s: Partial<Supplier> & { name: string }) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  resolveSupplier: (country?: string) => Supplier | undefined;

  addGateway: (g: Partial<PaymentGateway> & { name: string; code: string }) => PaymentGateway;
  updateGateway: (id: string, patch: Partial<PaymentGateway>) => void;
  deleteGateway: (id: string) => void;
  gatewaysFor: (country?: string) => PaymentGateway[];

  createReturn: (input: Omit<ReturnRequest, "id" | "number" | "status" | "createdAt">) => ReturnRequest;
  updateReturn: (id: string, patch: Partial<ReturnRequest>) => void;
  sendEmail: (template: string, to: string, meta?: string) => void;
  screenFraud: (input: { email: string; total: number }) => { flagged: boolean; reasons: string[] };

  registerCustomer: (name: string, email: string, password: string) => Customer | null;
  authenticateCustomer: (email: string, password: string) => Customer | null;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCustomerAddress: (id: string, address: Omit<Address, "id">) => void;

  addAffiliate: (a: Partial<AffPartner> & { name: string; url: string }) => AffPartner;
  updateAffiliate: (id: string, patch: Partial<AffPartner>) => void;
  deleteAffiliate: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  setCurrency: (code: string) => void;

  log: (action: string, entity: string, entityId?: string, meta?: string, actor?: string) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(loadStore);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }, [data]);

  /* -------------------------- Audit log helper ------------------------- */
  const log = useCallback(
    (action: string, entity: string, entityId?: string, meta?: string, actor = "admin") => {
      const entry: AuditLog = { id: uid("log"), ts: Date.now(), actor, action, entity, entityId, meta };
      setData((d) => ({ ...d, auditLogs: [entry, ...d.auditLogs].slice(0, 500) }));
    },
    []
  );

  /* ============================================================== */
  /*  BACKEND SYNC                                                   */
  /* ============================================================== */

  // On mount, hydrate seed data if store is empty (first visit — localStorage was empty)
  useEffect(() => {
    if (data.products.length > 0) return; // Already has data from localStorage
    let cancelled = false;
    (async () => {
      try {
        const { SEED_STORE } = await import("../lib/seed");
        if (cancelled) return;
        setData((prev) => {
          // Only seed if still empty
          if (prev.products.length > 0) return prev;
          return { ...SEED_STORE, settings: { ...SEED_STORE.settings, ...prev.settings } };
        });
      } catch {
        // Seed data failed to load — app will show empty state
      }
    })();
    return () => { cancelled = true; };
  }, [data.products.length]);

  // On mount, hydrate from backend if configured
  useEffect(() => {
    if (!isApiConfigured()) return;
    let cancelled = false;
    (async () => {
      await ensureBackend();
      if (!_Backend) return;
      const remote = await _Backend.fetchAll();
      if (cancelled || !remote) return;
      setData((prev) => ({
        ...prev,
        products: remote.products.length ? remote.products : prev.products,
        categories: remote.categories.length ? remote.categories : prev.categories,
        brands: remote.brands.length ? remote.brands : prev.brands,
        orders: remote.orders.length ? remote.orders : prev.orders,
        coupons: remote.coupons.length ? remote.coupons : prev.coupons,
        articles: remote.articles.length ? remote.articles : prev.articles,
        customers: remote.customers.length ? remote.customers : prev.customers,
        suppliers: remote.suppliers.length ? remote.suppliers : prev.suppliers,
        paymentGateways: remote.paymentGateways.length ? remote.paymentGateways : prev.paymentGateways,
        returns: remote.returns.length ? remote.returns : prev.returns,
        redirects: remote.redirects.length ? remote.redirects : prev.redirects,
        popups: remote.popups.length ? remote.popups : prev.popups,
        affiliates: remote.affiliates.length ? remote.affiliates : prev.affiliates,
        loyaltyTiers: remote.loyaltyTiers.length ? remote.loyaltyTiers : prev.loyaltyTiers,
        liveSales: remote.liveSales.length ? remote.liveSales : prev.liveSales,
        settings: remote.settings ? { ...prev.settings, ...remote.settings } : prev.settings,
      }));
    })();
    return () => { cancelled = true; };
  }, []);

  /** Fire-and-forget sync helper — calls Backend after local state is updated.
   *  Backend is dynamically imported on first call to keep the main chunk lean. */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  const sync = useCallback(<T extends unknown>(fn: (backend: BackendType) => Promise<T>) => {
    if (!isApiConfigured()) return;
    (async () => {
      await ensureBackend();
      if (_Backend) {
        fn(_Backend).catch(() => {});
      }
    })();
  }, []);

  /* ----------------------------- Lookups ------------------------------ */
  const getProduct = useCallback(
    (slugOrId: string) => data.products.find((p) => p.slug === slugOrId || p.id === slugOrId),
    [data.products]
  );
  const getBrand = useCallback((id: string) => data.brands.find((b) => b.id === id), [data.brands]);
  const getArticle = useCallback(
    (slugOrId: string) => data.articles.find((a) => a.slug === slugOrId || a.id === slugOrId),
    [data.articles]
  );
  const productsByCategory = useCallback(
    (categoryId: string) => data.products.filter((p) => p.category === categoryId),
    [data.products]
  );
  const productsByBrand = useCallback(
    (brandId: string) => data.products.filter((p) => p.brandId === brandId),
    [data.products]
  );

  /* ----------------------------- Products ----------------------------- */
  const addProduct: StoreContextValue["addProduct"] = useCallback((p) => {
    const product: Product = {
      id: p.id ?? uid("prod"),
      slug: p.slug ?? slugify(p.name),
      name: p.name,
      brand: p.brand ?? "",
      brandId: p.brandId ?? (p.brand ? slugify(p.brand) : undefined),
      category: p.category,
      type: p.type ?? "physical",
      price: p.price ?? 0,
      salePrice: p.salePrice ?? null,
      barcode: p.barcode,
      gtin: p.gtin,
      asin: p.asin,
      supplierId: p.supplierId,
      costPrice: p.costPrice,
      affiliateNetwork: p.affiliateNetwork,
      affiliateCommission: p.affiliateCommission,
      status: p.status ?? "published",
      rating: p.rating ?? 5,
      reviewCount: p.reviewCount ?? 0,
      images: p.images?.length ? p.images : [],
      shortDescription: p.shortDescription ?? "",
      description: p.description ?? "",
      features: p.features ?? [],
      variants: p.variants,
      stock: p.stock ?? 0,
      sku: p.sku ?? "",
      tags: p.tags ?? [],
      affiliate: p.affiliate,
      affiliateUrl: p.affiliateUrl,
      affiliatePartner: p.affiliatePartner,
      featured: p.featured,
      bestSeller: p.bestSeller,
      isNew: p.isNew,
      reviews: p.reviews ?? [],
      createdAt: Date.now(),
    };
    setData((d) => ({ ...d, products: [product, ...d.products] }));
    log("product.create", "product", product.id);
    sync((backend) => backend.createProduct({ ...p, id: product.id }));
    return product;
  }, [log, sync]);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setData((d) => ({
      ...d,
      products: d.products.map((p) =>
        p.id === id
          ? { ...p, ...patch, slug: patch.name ? patch.slug ?? slugify(patch.name) : p.slug }
          : p
      ),
    }));
    log("product.update", "product", id);
    sync((backend) => backend.updateProduct(id, patch));
  }, [log, sync]);

  const deleteProduct = useCallback((id: string) => {
    setData((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
    log("product.delete", "product", id);
    sync((backend) => backend.deleteProduct(id));
  }, [log, sync]);

  const cloneProduct = useCallback(
    (id: string): Product | undefined => {
      const source = data.products.find((p) => p.id === id);
      if (!source) return undefined;
      const clone: Product = {
        ...source,
        id: uid("prod"),
        name: `${source.name} (Copy)`,
        slug: slugify(`${source.name}-copy`),
        status: "draft",
        reviews: [],
        createdAt: Date.now(),
      };
      setData((d) => ({ ...d, products: [clone, ...d.products] }));
      log("product.clone", "product", clone.id, source.id);
      return clone;
    },
    [data.products, log]
  );

  const bulkUpdateProducts = useCallback((ids: string[], patch: Partial<Product>) => {
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)),
    }));
    log("product.bulkUpdate", "product", ids.join(","), `${ids.length} items`);
  }, [log]);

  const bulkDeleteProducts = useCallback((ids: string[]) => {
    setData((d) => ({ ...d, products: d.products.filter((p) => !ids.includes(p.id)) }));
    log("product.bulkDelete", "product", ids.join(","), `${ids.length} items`);
    sync((backend) => backend.bulkDeleteProducts(ids));
  }, [log, sync]);

  /* ---------------------------- Categories ---------------------------- */
  const addCategory: StoreContextValue["addCategory"] = useCallback((c) => {
    const category: Category = {
      id: c.id ?? slugify(c.name),
      name: c.name,
      tagline: c.tagline ?? "",
      description: c.description ?? "",
      image: c.image ?? "",
    };
    setData((d) => ({ ...d, categories: [...d.categories, category] }));
    log("category.create", "category", category.id);
    sync((backend) => backend.createCategory({ ...c, id: category.id }));
    return category;
  }, [log, sync]);

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    log("category.update", "category", id);
    sync((backend) => backend.updateCategory(id, patch));
  }, [log, sync]);

  const deleteCategory = useCallback((id: string) => {
    setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
    log("category.delete", "category", id);
    sync((backend) => backend.deleteCategory(id));
  }, [log, sync]);

  /* ------------------------------ Brands ------------------------------ */
  const addBrand: StoreContextValue["addBrand"] = useCallback((b) => {
    const brand: Brand = {
      id: b.id ?? slugify(b.name),
      slug: b.slug ?? slugify(b.name),
      name: b.name,
      tagline: b.tagline ?? "",
      description: b.description ?? "",
      image: b.image ?? "",
      country: b.country ?? "Global",
      featured: b.featured,
    };
    setData((d) => ({ ...d, brands: [...d.brands, brand] }));
    log("brand.create", "brand", brand.id);
    sync((backend) => backend.createBrand({ ...b, id: brand.id }));
    return brand;
  }, [log, sync]);

  const updateBrand = useCallback((id: string, patch: Partial<Brand>) => {
    setData((d) => ({ ...d, brands: d.brands.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
    log("brand.update", "brand", id);
    sync((backend) => backend.updateBrand(id, patch));
  }, [log, sync]);

  const deleteBrand = useCallback((id: string) => {
    setData((d) => ({ ...d, brands: d.brands.filter((b) => b.id !== id) }));
    log("brand.delete", "brand", id);
    sync((backend) => backend.deleteBrand(id));
  }, [log, sync]);

  /* ------------------------------ Orders ------------------------------ */
  const placeOrder: StoreContextValue["placeOrder"] = useCallback((input) => {
    const subtotal = input.items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = input.discount ?? 0;
    const shipping = input.shipping ?? 0;
    const tax = input.tax ?? 0;
    const total = Math.max(0, subtotal - discount + shipping + tax);
    const order: Order = {
      id: uid("ord"),
      number: orderNumber(),
      items: input.items,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      currency: "USD",
      couponCode: input.couponCode,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      giftMessage: input.giftMessage,
      customer: input.customer,
      status: "paid",
      createdAt: Date.now(),
    };
    setData((d) => {
      const coupons = input.couponId
        ? d.coupons.map((c) => (c.id === input.couponId ? { ...c, usedCount: c.usedCount + 1 } : c))
        : d.coupons;
      return { ...d, orders: [order, ...d.orders], coupons };
    });
    log("order.create", "order", order.id, order.number, order.customer.email || "customer");
    sync((backend) => backend.createOrder({
      items: input.items,
      customer: input.customer,
      discount: input.discount,
      shipping: input.shipping,
      tax: input.tax,
      couponCode: input.couponCode,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    }));
    return order;
  }, [log, sync]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    log("order.update", "order", id, status);
    sync((backend) => backend.updateOrderStatus(id, status));
  }, [log, sync]);

  const deleteOrder = useCallback((id: string) => {
    setData((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
    log("order.delete", "order", id);
    sync((backend) => backend.deleteOrder(id));
  }, [log, sync]);

  /* ------------------------------ Coupons ----------------------------- */
  const addCoupon: StoreContextValue["addCoupon"] = useCallback((c) => {
    const coupon: Coupon = {
      id: c.id ?? uid("cpn"),
      code: c.code.toUpperCase(),
      type: c.type ?? "percent",
      value: c.value ?? 0,
      minSpend: c.minSpend ?? 0,
      active: c.active ?? true,
      description: c.description ?? "",
      expiresAt: c.expiresAt,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount ?? 0,
    };
    setData((d) => ({ ...d, coupons: [...d.coupons, coupon] }));
    log("coupon.create", "coupon", coupon.id, coupon.code);
    sync((backend) => backend.createCoupon({ ...c, id: coupon.id }));
    return coupon;
  }, [log, sync]);

  const updateCoupon = useCallback((id: string, patch: Partial<Coupon>) => {
    setData((d) => ({ ...d, coupons: d.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    log("coupon.update", "coupon", id);
    sync((backend) => backend.updateCoupon(id, patch));
  }, [log, sync]);

  const deleteCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
    log("coupon.delete", "coupon", id);
    sync((backend) => backend.deleteCoupon(id));
  }, [log, sync]);

  const validateCoupon = useCallback(
    (code: string, subtotal: number): CouponResult => {
      const coupon = data.coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
      if (!coupon) return { ok: false, discount: 0, message: "Invalid code." };
      if (!coupon.active) return { ok: false, discount: 0, message: "This code is no longer active." };
      if (coupon.expiresAt && coupon.expiresAt < Date.now())
        return { ok: false, discount: 0, message: "This code has expired." };
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
        return { ok: false, discount: 0, message: "This code has reached its limit." };
      if (subtotal < coupon.minSpend)
        return { ok: false, discount: 0, message: `Spend $${coupon.minSpend} to use this code.` };
      const discount =
        coupon.type === "percent" ? (subtotal * coupon.value) / 100 : Math.min(coupon.value, subtotal);
      return { ok: true, coupon, discount: Math.round(discount * 100) / 100, message: "Code applied." };
    },
    [data.coupons]
  );

  /* ----------------------------- Articles ----------------------------- */
  const addArticle: StoreContextValue["addArticle"] = useCallback((a) => {
    const article: Article = {
      id: a.id ?? uid("art"),
      slug: a.slug ?? slugify(a.title),
      title: a.title,
      excerpt: a.excerpt ?? "",
      body: a.body ?? [],
      cover: a.cover ?? "",
      author: a.author ?? "ALAYA Editors",
      authorRole: a.authorRole ?? "Editor",
      category: a.category ?? "Style",
      tags: a.tags ?? [],
      readMinutes: a.readMinutes ?? 4,
      publishedAt: a.publishedAt ?? Date.now(),
      featured: a.featured,
    };
    setData((d) => ({ ...d, articles: [article, ...d.articles] }));
    log("article.create", "article", article.id);
    sync((backend) => backend.createArticle({ ...a, id: article.id }));
    return article;
  }, [log, sync]);

  const updateArticle = useCallback((id: string, patch: Partial<Article>) => {
    setData((d) => ({ ...d, articles: d.articles.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    log("article.update", "article", id);
    sync((backend) => backend.updateArticle(id, patch));
  }, [log, sync]);

  const deleteArticle = useCallback((id: string) => {
    setData((d) => ({ ...d, articles: d.articles.filter((a) => a.id !== id) }));
    log("article.delete", "article", id);
    sync((backend) => backend.deleteArticle(id));
  }, [log, sync]);

  /* ----------------------------- Questions ---------------------------- */
  const addQuestion = useCallback(
    (productId: string, author: string, question: string): Question => {
      const q: Question = {
        id: uid("q"),
        productId,
        author,
        question,
        helpful: 0,
        date: new Date().toISOString(),
      };
      setData((d) => ({ ...d, questions: [q, ...d.questions] }));
      sync((backend) => backend.createQuestion(productId, author, question));
      return q;
    },
    [sync]
  );

  const answerQuestion = useCallback((id: string, answer: string, answeredBy = "ALAYA Care") => {
    setData((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, answer, answeredBy } : q)),
    }));
    log("question.answer", "question", id);
    sync((backend) => backend.answerQuestion(id, answer, answeredBy));
  }, [log, sync]);

  const voteQuestion = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, helpful: q.helpful + 1 } : q)),
    }));
  }, []);

  const questionsFor = useCallback(
    (productId: string) => data.questions.filter((q) => q.productId === productId),
    [data.questions]
  );

  /* ----------------------------- Redirects ---------------------------- */
  const addRedirect = useCallback((r: Partial<Redirect> & { from: string }) => {
    const redirect: Redirect = {
      id: r.id ?? uid("red"),
      from: r.from,
      to: r.to ?? "",
      type: r.type ?? 301,
      active: r.active ?? true,
      hits: r.hits ?? 0,
      createdAt: Date.now(),
    };
    setData((d) => ({ ...d, redirects: [redirect, ...d.redirects] }));
    sync((backend) => backend.createRedirect({ ...r, id: redirect.id }));
    return redirect;
  }, [sync]);

  const updateRedirect = useCallback((id: string, patch: Partial<Redirect>) => {
    setData((d) => ({ ...d, redirects: d.redirects.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    sync((backend) => backend.updateRedirect(id, patch));
  }, [sync]);

  const deleteRedirect = useCallback((id: string) => {
    setData((d) => ({ ...d, redirects: d.redirects.filter((r) => r.id !== id) }));
    sync((backend) => backend.deleteRedirect(id));
  }, [sync]);

  /** Loop detection: returns true if following `to` chains back to `from`. */
  const wouldCreateLoop = useCallback(
    (from: string, to: string): boolean => {
      if (!to) return false;
      let current = to;
      const seen = new Set<string>();
      while (current && !seen.has(current)) {
        if (current === from) return true;
        seen.add(current);
        const next = data.redirects.find((r) => r.from === current);
        current = next ? next.to : "";
      }
      return false;
    },
    [data.redirects]
  );

  /* ------------------------------- Popups ----------------------------- */
  const addPopup = useCallback((p: Partial<Popup> & { name: string }) => {
    const popup: Popup = {
      id: p.id ?? uid("pop"),
      name: p.name,
      type: p.type ?? "newsletter",
      trigger: p.trigger ?? "time",
      headline: p.headline ?? "",
      body: p.body ?? "",
      ctaLabel: p.ctaLabel ?? "Subscribe",
      ctaLink: p.ctaLink,
      couponCode: p.couponCode,
      triggerValue: p.triggerValue ?? 15,
      active: p.active ?? true,
      views: p.views ?? 0,
      conversions: p.conversions ?? 0,
    };
    setData((d) => ({ ...d, popups: [popup, ...d.popups] }));
    sync((backend) => backend.createPopup({ ...p, id: popup.id }));
    return popup;
  }, [sync]);

  const updatePopup = useCallback((id: string, patch: Partial<Popup>) => {
    setData((d) => ({ ...d, popups: d.popups.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    sync((backend) => backend.updatePopup(id, patch));
  }, [sync]);

  const deletePopup = useCallback((id: string) => {
    setData((d) => ({ ...d, popups: d.popups.filter((p) => p.id !== id) }));
    sync((backend) => backend.deletePopup(id));
  }, [sync]);

  /** Records a popup impression/conversion (analytics). */
  const trackPopup = useCallback((id: string, converted: boolean) => {
    setData((d) => ({
      ...d,
      popups: d.popups.map((p) =>
        p.id === id ? { ...p, views: p.views + 1, conversions: p.conversions + (converted ? 1 : 0) } : p
      ),
    }));
    sync((backend) => backend.trackPopup(id, converted));
  }, [sync]);

  /* -------------------------- Abandoned carts ------------------------- */
  const addAbandonedCart = useCallback((input: Omit<AbandonedCart, "id" | "recovered" | "createdAt">) => {
    const cart: AbandonedCart = { ...input, id: uid("ab"), recovered: false, createdAt: Date.now() };
    setData((d) => ({ ...d, abandonedCarts: [cart, ...d.abandonedCarts].slice(0, 200) }));
    return cart;
  }, []);

  const recoverAbandonedCart = useCallback((id: string) => {
    setData((d) => ({ ...d, abandonedCarts: d.abandonedCarts.map((c) => (c.id === id ? { ...c, recovered: true } : c)) }));
    log("cart.recover", "abandoned_cart", id);
  }, [log]);

  const deleteAbandonedCart = useCallback((id: string) => {
    setData((d) => ({ ...d, abandonedCarts: d.abandonedCarts.filter((c) => c.id !== id) }));
  }, []);

  /* ------------------------------ Referrals --------------------------- */
  const addReferral = useCallback((customerName: string): Referral => {
    const ref: Referral = {
      id: uid("ref"),
      code: `ALAYA-${slugify(customerName).toUpperCase().slice(0, 12)}`,
      customerName,
      clicks: 0,
      signups: 0,
      purchases: 0,
      rewardEarned: 0,
    };
    setData((d) => ({ ...d, referrals: [ref, ...d.referrals] }));
    return ref;
  }, []);

  const deleteReferral = useCallback((id: string) => {
    setData((d) => ({ ...d, referrals: d.referrals.filter((r) => r.id !== id) }));
  }, []);

  /* --------------------------- Loyalty tiers -------------------------- */
  const updateTier = useCallback((id: string, patch: Partial<LoyaltyTier>) => {
    setData((d) => ({ ...d, loyaltyTiers: d.loyaltyTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    sync((backend) => backend.updateLoyaltyTier(id, patch));
  }, [sync]);

  const addTier = useCallback((t: Partial<LoyaltyTier> & { name: string }) => {
    const tier: LoyaltyTier = { id: t.id ?? uid("tier"), name: t.name, minPoints: t.minPoints ?? 0, perk: t.perk ?? "" };
    setData((d) => ({ ...d, loyaltyTiers: [...d.loyaltyTiers, tier] }));
    sync((backend) => backend.createLoyaltyTier({ ...t, id: tier.id }));
    return tier;
  }, [sync]);

  const deleteTier = useCallback((id: string) => {
    setData((d) => ({ ...d, loyaltyTiers: d.loyaltyTiers.filter((t) => t.id !== id) }));
    sync((backend) => backend.deleteLoyaltyTier(id));
  }, [sync]);

  /* ------------------------------ Live sales -------------------------- */
  const addLiveSale = useCallback((s: Omit<LiveSale, "id">) => {
    setData((d) => ({ ...d, liveSales: [{ ...s, id: uid("ls") }, ...d.liveSales].slice(0, 50) }));
    sync((backend) => backend.createLiveSale(s));
  }, [sync]);

  /* ----------------------------- Suppliers ---------------------------- */
  const addSupplier = useCallback((s: Partial<Supplier> & { name: string }) => {
    const supplier: Supplier = {
      id: s.id ?? uid("sup"),
      name: s.name,
      email: s.email ?? "",
      country: s.country ?? "Global",
      priority: s.priority ?? 5,
      active: s.active ?? true,
      handlingDays: s.handlingDays ?? 2,
      notes: s.notes,
    };
    setData((d) => ({ ...d, suppliers: [...d.suppliers, supplier] }));
    log("supplier.create", "supplier", supplier.id);
    sync((backend) => backend.createSupplier({ ...s, id: supplier.id }));
    return supplier;
  }, [log, sync]);

  const updateSupplier = useCallback((id: string, patch: Partial<Supplier>) => {
    setData((d) => ({ ...d, suppliers: d.suppliers.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
    sync((backend) => backend.updateSupplier(id, patch));
  }, [sync]);

  const deleteSupplier = useCallback((id: string) => {
    setData((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.id !== id) }));
    log("supplier.delete", "supplier", id);
    sync((backend) => backend.deleteSupplier(id));
  }, [log, sync]);

  /** Auto-determines the best active supplier by priority (with fallback). */
  const resolveSupplier = useCallback(
    (country?: string): Supplier | undefined => {
      const active = data.suppliers.filter((s) => s.active);
      if (active.length === 0) return undefined;
      const byCountry = country
        ? active.filter((s) => s.country.toLowerCase() === country.toLowerCase())
        : active;
      const pool = byCountry.length ? byCountry : active;
      return [...pool].sort((a, b) => a.priority - b.priority)[0];
    },
    [data.suppliers]
  );

  /* -------------------------- Payment gateways ------------------------ */
  const addGateway = useCallback((g: Partial<PaymentGateway> & { name: string; code: string }) => {
    const gateway: PaymentGateway = {
      id: g.id ?? uid("gw"),
      name: g.name,
      code: g.code,
      mode: g.mode ?? "live",
      active: g.active ?? true,
      countries: g.countries ?? [],
    };
    setData((d) => ({ ...d, paymentGateways: [...d.paymentGateways, gateway] }));
    sync((backend) => backend.createGateway({ ...g, id: gateway.id }));
    return gateway;
  }, [sync]);

  const updateGateway = useCallback((id: string, patch: Partial<PaymentGateway>) => {
    setData((d) => ({ ...d, paymentGateways: d.paymentGateways.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    sync((backend) => backend.updateGateway(id, patch));
  }, [sync]);

  const deleteGateway = useCallback((id: string) => {
    setData((d) => ({ ...d, paymentGateways: d.paymentGateways.filter((g) => g.id !== id) }));
    sync((backend) => backend.deleteGateway(id));
  }, [sync]);

  /** Returns active gateways valid for a given destination country. */
  const gatewaysFor = useCallback(
    (country?: string): PaymentGateway[] =>
      data.paymentGateways.filter(
        (g) => g.active && (g.countries.length === 0 || !country || g.countries.includes(country))
      ),
    [data.paymentGateways]
  );

  /* ------------------------------ Returns ----------------------------- */
  const createReturn = useCallback(
    (input: Omit<ReturnRequest, "id" | "number" | "status" | "createdAt">): ReturnRequest => {
      const ret: ReturnRequest = {
        ...input,
        id: uid("ret"),
        number: `RT-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "requested",
        createdAt: Date.now(),
      };
      setData((d) => ({ ...d, returns: [ret, ...d.returns] }));
      log("return.create", "return", ret.id, ret.number);
      sync((backend) => backend.createReturn(input));
      return ret;
    },
    [log, sync]
  );

  const updateReturn = useCallback((id: string, patch: Partial<ReturnRequest>) => {
    setData((d) => ({ ...d, returns: d.returns.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    log("return.update", "return", id);
    sync((backend) => backend.updateReturn(id, patch));
  }, [log, sync]);

  /* --------------------------- Email logging -------------------------- */
  /** Records that an automated email was "sent" (audit trail). */
  const sendEmail = useCallback(
    (template: string, to: string, meta?: string) => {
      log(`email.${template}`, "email", undefined, `${to} · ${meta || ""}`, "system");
    },
    [log]
  );

  /* -------------------------- Fraud screening ------------------------- */
  const screenFraud = useCallback(
    (input: { email: string; total: number; }): { flagged: boolean; reasons: string[] } => {
      const reasons: string[] = [];
      // High value
      if (input.total >= 2000) reasons.push("High-value order — review recommended");
      // Velocity: multiple recent orders from same email
      const recent = data.orders.filter(
        (o) => o.customer.email.toLowerCase() === input.email.toLowerCase() && Date.now() - o.createdAt < 10 * 60 * 1000
      );
      if (recent.length >= 2) reasons.push(`${recent.length} orders in 10 minutes — velocity check`);
      // Duplicate exact total within an hour
      const dup = data.orders.find(
        (o) => o.customer.email.toLowerCase() === input.email.toLowerCase() &&
          Math.abs(o.total - input.total) < 0.01 &&
          Date.now() - o.createdAt < 3600000
      );
      if (dup) reasons.push("Possible duplicate order detected");
      return { flagged: reasons.length > 0, reasons };
    },
    [data.orders]
  );

  /* ----------------------------- Customers ---------------------------- */
  const registerCustomer = useCallback(
    (name: string, email: string, password: string): Customer | null => {
      const exists = data.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (exists) return null;
      const customer: Customer = {
        id: uid("cust"),
        name,
        email,
        password,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        status: "active",
        addresses: [],
        newsletter: true,
        timeline: [{ id: uid("tl"), type: "account_created", label: "Account created", ts: Date.now() }],
        notes: [],
        tasks: [],
        preferences: { favoriteBrands: [], favoriteCategories: [], preferredTheme: "light", marketingOptIn: true },
        loyaltyPoints: 0,
        storeCredit: 0,
        referralCode: `ALAYA-${name.toUpperCase().replace(/\s+/g, "").slice(0, 8)}`,
      };
      setData((d) => ({ ...d, customers: [...d.customers, customer] }));
      log("customer.register", "customer", customer.id, email, email);
      sync((backend) => backend.registerCustomer(name, email, password));
      return customer;
    },
    [data.customers, log, sync]
  );

  const authenticateCustomer = useCallback(
    (email: string, password: string): Customer | null =>
      data.customers.find(
        (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
      ) ?? null,
    [data.customers]
  );

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setData((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    sync((backend) => backend.updateCustomer(id, patch));
  }, [sync]);

  const deleteCustomer = useCallback((id: string) => {
    setData((d) => ({ ...d, customers: d.customers.filter((c) => c.id !== id) }));
    log("customer.delete", "customer", id);
    sync((backend) => backend.deleteCustomer(id));
  }, [log, sync]);

  const addCustomerAddress = useCallback((id: string, address: Omit<Address, "id">) => {
    setData((d) => ({
      ...d,
      customers: d.customers.map((c) =>
        c.id === id ? { ...c, addresses: [...c.addresses, { ...address, id: uid("addr") }] } : c
      ),
    }));
  }, []);

  /* ---------------------------- Affiliates ---------------------------- */
  const addAffiliate: StoreContextValue["addAffiliate"] = useCallback((a) => {
    const affiliate: AffPartner = {
      id: a.id ?? uid("aff"),
      name: a.name,
      url: a.url,
      commission: a.commission ?? 5,
      active: a.active ?? true,
    };
    setData((d) => ({ ...d, affiliates: [...d.affiliates, affiliate] }));
    log("affiliate.create", "affiliate", affiliate.id);
    sync((backend) => backend.createAffiliate({ ...a, id: affiliate.id }));
    return affiliate;
  }, [log, sync]);

  const updateAffiliate = useCallback((id: string, patch: Partial<AffPartner>) => {
    setData((d) => ({ ...d, affiliates: d.affiliates.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    log("affiliate.update", "affiliate", id);
    sync((backend) => backend.updateAffiliate(id, patch));
  }, [log, sync]);

  const deleteAffiliate = useCallback((id: string) => {
    setData((d) => ({ ...d, affiliates: d.affiliates.filter((a) => a.id !== id) }));
    log("affiliate.delete", "affiliate", id);
    sync((backend) => backend.deleteAffiliate(id));
  }, [log, sync]);

  /* ------------------------------- CRM ------------------------------- */
  const addCustomerNote = useCallback((customerId: string, author: string, body: string, pinned = false, isPrivate = false) => {
    const note: CustomerNote = { id: uid("note"), author, body, pinned, private: isPrivate, ts: Date.now() };
    setData((d) => ({ ...d, customers: d.customers.map((c) => c.id === customerId ? { ...c, notes: [note, ...c.notes] } : c) }));
    sync((backend) => backend.addCustomerNote(customerId, author, body, pinned));
  }, [sync]);

  const deleteCustomerNote = useCallback((customerId: string, noteId: string) => {
    setData((d) => ({ ...d, customers: d.customers.map((c) => c.id === customerId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c) }));
  }, []);

  const addCustomerTask = useCallback((customerId: string, task: Omit<CustomerTask, "id" | "ts">) => {
    const t: CustomerTask = { ...task, id: uid("task"), ts: Date.now() };
    setData((d) => ({ ...d, customers: d.customers.map((c) => c.id === customerId ? { ...c, tasks: [...c.tasks, t] } : c) }));
    sync((backend) => backend.addCustomerTask(customerId, { title: task.title, type: task.type, assignee: task.assignee, priority: task.priority }));
  }, [sync]);

  const toggleCustomerTask = useCallback((customerId: string, taskId: string) => {
    setData((d) => ({ ...d, customers: d.customers.map((c) => c.id === customerId ? { ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) } : c) }));
  }, []);

  const addTimelineEvent = useCallback((customerId: string, type: TimelineEvent["type"], label: string, meta?: string) => {
    const evt: TimelineEvent = { id: uid("tl"), type, label, ts: Date.now(), meta };
    setData((d) => ({ ...d, customers: d.customers.map((c) => c.id === customerId ? { ...c, timeline: [evt, ...c.timeline] } : c) }));
    sync((backend) => backend.addTimelineEvent(customerId, type, label, meta));
  }, [sync]);

  const replyTicket = useCallback((id: string, author: string, body: string) => {
    setData((d) => ({ ...d, supportTickets: d.supportTickets.map((t) => t.id === id ? { ...t, messages: [...t.messages, { author, body, ts: Date.now() }], status: "pending" } : t) }));
    log("ticket.reply", "support_ticket", id);
    sync((backend) => backend.replyToTicket(id, author, body));
  }, [log, sync]);

  const updateTicketStatus = useCallback((id: string, status: SupportTicket["status"]) => {
    setData((d) => ({ ...d, supportTickets: d.supportTickets.map((t) => t.id === id ? { ...t, status } : t) }));
    sync((backend) => backend.updateTicketStatus(id, status));
  }, [sync]);

  /* ----------------------------- Settings ----------------------------- */
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    log("settings.update", "settings");
    sync((backend) => backend.updateSettings(patch));
  }, [log, sync]);

  const setCurrency = useCallback((code: string) => {
    const next = CURRENCIES[code] ?? CURRENCIES.USD;
    setData((d) => ({ ...d, settings: { ...d.settings, currency: next } }));
  }, []);

  const resetData = useCallback(() => {
    import("../lib/seed").then(({ SEED_STORE }) => setData(SEED_STORE)).catch(() => {});
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      products: data.products,
      categories: data.categories,
      brands: data.brands,
      orders: data.orders,
      coupons: data.coupons,
      articles: data.articles,
      customers: data.customers,
      questions: data.questions,
      suppliers: data.suppliers,
      paymentGateways: data.paymentGateways,
      returns: data.returns,
      redirects: data.redirects,
      popups: data.popups,
      abandonedCarts: data.abandonedCarts,
      referrals: data.referrals,
      loyaltyTiers: data.loyaltyTiers,
      liveSales: data.liveSales,
      supportTickets: data.supportTickets,
      affiliates: data.affiliates,
      auditLogs: data.auditLogs,
      settings: data.settings,
      getProduct,
      getBrand,
      getArticle,
      productsByCategory,
      productsByBrand,
      addProduct,
      updateProduct,
      deleteProduct,
      cloneProduct,
      bulkUpdateProducts,
      bulkDeleteProducts,
      addCategory,
      updateCategory,
      deleteCategory,
      addBrand,
      updateBrand,
      deleteBrand,
      placeOrder,
      updateOrderStatus,
      deleteOrder,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      validateCoupon,
      addArticle,
      updateArticle,
      deleteArticle,
      addQuestion,
      answerQuestion,
      voteQuestion,
      questionsFor,
      addRedirect,
      updateRedirect,
      deleteRedirect,
      wouldCreateLoop,
      addPopup,
      updatePopup,
      deletePopup,
      trackPopup,
      addAbandonedCart,
      recoverAbandonedCart,
      deleteAbandonedCart,
      addReferral,
      deleteReferral,
      addTier,
      updateTier,
      deleteTier,
      addLiveSale,
      addCustomerNote,
      deleteCustomerNote,
      addCustomerTask,
      toggleCustomerTask,
      addTimelineEvent,
      replyTicket,
      updateTicketStatus,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      resolveSupplier,
      addGateway,
      updateGateway,
      deleteGateway,
      gatewaysFor,
      createReturn,
      updateReturn,
      sendEmail,
      screenFraud,
      registerCustomer,
      authenticateCustomer,
      updateCustomer,
      deleteCustomer,
      addCustomerAddress,
      addAffiliate,
      updateAffiliate,
      deleteAffiliate,
      updateSettings,
      setCurrency,
      log,
      resetData,
    }),
    [
      data,
      getProduct,
      getBrand,
      getArticle,
      productsByCategory,
      productsByBrand,
      addProduct,
      updateProduct,
      deleteProduct,
      cloneProduct,
      bulkUpdateProducts,
      bulkDeleteProducts,
      addCategory,
      updateCategory,
      deleteCategory,
      addBrand,
      updateBrand,
      deleteBrand,
      placeOrder,
      updateOrderStatus,
      deleteOrder,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      validateCoupon,
      addArticle,
      updateArticle,
      deleteArticle,
      addQuestion,
      answerQuestion,
      voteQuestion,
      questionsFor,
      addRedirect,
      updateRedirect,
      deleteRedirect,
      wouldCreateLoop,
      addPopup,
      updatePopup,
      deletePopup,
      trackPopup,
      addAbandonedCart,
      recoverAbandonedCart,
      deleteAbandonedCart,
      addReferral,
      deleteReferral,
      addTier,
      updateTier,
      deleteTier,
      addLiveSale,
      addCustomerNote,
      deleteCustomerNote,
      addCustomerTask,
      toggleCustomerTask,
      addTimelineEvent,
      replyTicket,
      updateTicketStatus,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      resolveSupplier,
      addGateway,
      updateGateway,
      deleteGateway,
      gatewaysFor,
      createReturn,
      updateReturn,
      sendEmail,
      screenFraud,
      registerCustomer,
      authenticateCustomer,
      updateCustomer,
      deleteCustomer,
      addCustomerAddress,
      addAffiliate,
      updateAffiliate,
      deleteAffiliate,
      updateSettings,
      setCurrency,
      log,
      resetData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
