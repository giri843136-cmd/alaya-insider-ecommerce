/**
 * ALAYA INSIDER — Backend In-Memory Database
 * --------------------------------------------------------------------------
 * In-memory data store that mirrors the frontend StoreData types.
 * All CRUD operations are implemented as pure functions on a mutable store.
 *
 * To swap to PostgreSQL later: replace the store with a Prisma/Kysely client.
 */

import { v4 } from "uuid";

/* ================================================================== */
/*  TYPES (mirrored from src/lib/types.ts for backend independence)     */
/* ================================================================== */

export interface Product {
  id: string; slug: string; name: string; brand?: string; brandId?: string;
  category: string; type: string; price: number; salePrice?: number | null;
  rating: number; reviewCount: number; images: string[];
  shortDescription: string; description: string; features: string[];
  variants?: { name: string; options: string[] }[];
  stock: number; sku: string; tags: string[];
  barcode?: string; gtin?: string; asin?: string; supplierId?: string;
  costPrice?: number; affiliate?: boolean; affiliateUrl?: string;
  affiliatePartner?: string; affiliateNetwork?: string;
  affiliateCommission?: number; featured?: boolean; bestSeller?: boolean;
  isNew?: boolean; comingSoon?: boolean; preorder?: boolean;
  status?: string; reviews: Review[]; specs?: SpecRow[];
  createdAt: number;
  /** @deprecated Use images field */
  image?: string;
}

export interface Review {
  id: string; productId: string; customerId: string; author: string;
  rating: number; title: string; body: string; verified: boolean;
  helpful: number; createdAt: number;
}

export interface Category {
  id: string; slug: string; name: string; description: string;
  image?: string; tagline?: string; parentId?: string; order: number;
}

export interface Brand {
  id: string; slug: string; name: string; description: string;
  logo?: string; image?: string; tagline?: string; country?: string;
  featured?: boolean; website?: string; affiliateNetwork?: string;
  affiliateId?: string;
}

export interface Order {
  id: string; orderNumber: string; customerId: string;
  number?: string;
  status: string; items: OrderItem[]; shipping: ShippingInfo;
  payment: PaymentInfo; subtotal: number; shippingCost: number;
  tax: number; discount: number; total: number; currency: string;
  notes?: string; couponId?: string; createdAt: number;
  paymentMethod?: string;
  customer?: { name: string; email: string; address?: string; city?: string; country?: string; zip?: string };
}

export interface OrderItem {
  productId: string; name: string; sku: string; price: number;
  quantity: number; image: string;
}

export interface ShippingInfo {
  address: string; city: string; state: string; zip: string;
  country: string; method: string; trackingNumber?: string;
}

export interface PaymentInfo {
  method: string; status: string; transactionId?: string;
  paidAt?: number;
}

export interface Customer {
  id: string; email: string; name: string; passwordHash: string;
  password?: string; role: string; avatar?: string; phone?: string;
  addresses: Address[]; orders: string[]; wishlist: string[];
  compare: string[]; recentlyViewed: string[];
  status?: string; newsletter?: boolean;
  notes?: { id: string; author: string; body: string; pinned: boolean; ts: number }[];
  tasks?: { id: string; title: string; type: string; assignee: string; priority: string; done: boolean; ts: number }[];
  timeline?: { id: string; type: string; label: string; ts: number; meta?: string }[];
  preferences?: { favoriteBrands: string[]; favoriteCategories: string[]; preferredTheme: string; marketingOptIn: boolean };
  loyaltyPoints?: number; storeCredit?: number; referralCode?: string;
  lastLogin?: number;
  createdAt: number;
}

export interface Address {
  id: string; label: string; line1: string; line2?: string;
  city: string; state: string; zip: string; country: string;
  isDefault: boolean;
}

export interface Article {
  id: string; slug: string; title: string; excerpt: string;
  content: string; body?: string[]; cover?: string;
  author: string; authorRole?: string; category: string; tags: string[];
  image: string; readMinutes?: number;
  published: boolean; publishedAt?: number; featured?: boolean;
  createdAt: number;
}

export interface Coupon {
  id: string; code: string; type: string; value: number;
  minOrder: number; minSpend?: number; description?: string;
  usageLimit: number; usedCount: number;
  expiresAt: number; active: boolean;
}

export interface Supplier {
  id: string; name: string; contactName: string; email: string;
  phone: string; status: string; leadTime: number;
  rating: number; products: string[];
}

export interface SupportTicket {
  id: string; customerId: string; subject: string; message: string;
  number?: string; messages?: { author: string; body: string; ts: number }[];
  status: string; priority: string; createdAt: number;
}

export interface SpecRow {
  label: string; value: string;
}

export interface Settings {
  storeName: string; storeShort?: string; tagline: string; description?: string;
  logo: string; favicon: string;
  currency: string; locale: string; timezone: string;
  taxRate: number; freeShippingThreshold: number;
  shippingMethods: { name: string; price: number; estimatedDays: string }[];
  socialLinks: { platform: string; url: string }[];
  contactEmail: string; supportEmail: string; phone: string;
  address: string; theme: { primaryColor: string; font: string };
  features: Record<string, boolean>;
  defaultTheme?: string; defaultLanguage?: string;
  accentLight?: string; accentDark?: string;
  announcement?: { enabled: boolean; text: string; link?: string };
  announcements?: Record<string, unknown>[];
  heroSlides?: { id: string; eyebrow: string; title: string; highlight?: string; description: string; image: string; ctaLabel: string; ctaLink: string; cta2Label?: string; cta2Link?: string; align?: string }[];
  homeSections?: { id: string; label: string; enabled: boolean }[];
  design?: Record<string, unknown>;
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  shipping?: { freeOver: number; flatRate: number };
  contactPhone?: string;
  adminEmail?: string; adminPhone?: string;
  mfaMethod?: string; totpSecret?: string; totpVerified?: boolean; totpBackupCodes?: string[];
  social?: Record<string, string>;
  seo?: Record<string, string>;
  adminPassword?: string;
}

/* ================================================================== */
/*  Extended content/marketing types (routes/content.ts)                 */
/* ================================================================== */

export interface Question {
  id: string; productId: string; author: string; question: string;
  answer?: string; answeredBy?: string; helpful: number; date: string;
}

export interface Redirect {
  id: string; from: string; to: string; type: number;
  active: boolean; hits: number; createdAt: number;
}

export interface Popup {
  id: string; name: string; type: string; trigger: string;
  headline: string; body: string; ctaLabel: string; ctaLink?: string;
  triggerValue: number; active: boolean; views: number; conversions: number;
}

export interface AffPartner {
  id: string; name: string; url: string; commission: number; active: boolean;
}

export interface LoyaltyTier {
  id: string; name: string; minPoints: number; perk: string;
}

export interface LiveSale {
  id: string; productId: string; productName: string; buyerName: string;
  amount: number; currency: string; timestamp: number;
}

/* ================================================================== */
/*  Commerce types (routes/commerce.ts)                                  */
/* ================================================================== */

export interface PaymentGateway {
  id: string; name: string; provider: string; active: boolean;
  config: Record<string, string>; supportedCurrencies: string[];
}

export interface ReturnRequest {
  id: string; orderId: string; orderNumber: string;
  customer: { name: string; email: string };
  type: string; reason: string; number: string;
  status: string; createdAt: number;
}

/* ================================================================== */
/*  Customer types (routes/customers.ts)                                  */
/* ================================================================== */

export interface Referral {
  id: string; code: string; customerName: string;
  clicks: number; signups: number; purchases: number; rewardEarned: number;
}

export interface AbandonedCart {
  id: string; customerId: string; customerName: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number; recovered: boolean; createdAt: number;
}

export interface StoreData {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  customers: Customer[];
  articles: Article[];
  coupons: Coupon[];
  suppliers: Supplier[];
  supportTickets: SupportTicket[];
  questions: Question[];
  redirects: Redirect[];
  popups: Popup[];
  affiliates: AffPartner[];
  loyaltyTiers: LoyaltyTier[];
  liveSales: LiveSale[];
  paymentGateways: PaymentGateway[];
  returns: ReturnRequest[];
  referrals: Referral[];
  abandonedCarts: AbandonedCart[];
  auditLogs?: { id: string; action: string; actor: string; entityType: string; entityId: string; meta: string; createdAt: number }[];
  settings: Settings;
}

/* ================================================================== */
/*  Default settings                                                    */
/* ================================================================== */

const DEFAULT_SETTINGS: Settings = {
  storeName: "ALAYA INSIDER",
  tagline: "Premium Curated Products",
  logo: "/images/logo.svg",
  favicon: "/favicon.ico",
  currency: "USD",
  locale: "en-US",
  timezone: "UTC",
  taxRate: 0,
  freeShippingThreshold: 100,
  shippingMethods: [
    { name: "Standard", price: 5.99, estimatedDays: "5-8" },
    { name: "Express", price: 14.99, estimatedDays: "2-3" },
  ],
  socialLinks: [],
  contactEmail: "hello@alayainsider.com",
  supportEmail: "support@alayainsider.com",
  phone: "",
  address: "",
  theme: { primaryColor: "#000000", font: "Inter" },
  features: {
    reviews: true,
    wishlist: true,
    compare: true,
    affiliate: true,
  },
};

/* ================================================================== */
/*  Initial empty store state                                           */
/* ================================================================== */

function createEmptyStore(): StoreData {
  return {
    products: [],
    categories: [],
    brands: [],
    orders: [],
    customers: [],
    articles: [],
    coupons: [],
    suppliers: [],
    supportTickets: [],
    questions: [],
    redirects: [],
    popups: [],
    affiliates: [],
    loyaltyTiers: [],
    liveSales: [],
    paymentGateways: [],
    returns: [],
    referrals: [],
    abandonedCarts: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/* ================================================================== */
/*  Store management                                                    */
/* ================================================================== */

let store: StoreData = createEmptyStore();

export function getStore(): StoreData {
  return store;
}

export function resetStore(): void {
  store = createEmptyStore();
}

/** Persist the store to durable storage. */
export function persistStore(data: StoreData): void {
  store = data;
}

/* ================================================================== */
/*  Utility helpers                                                     */
/* ================================================================== */

export function genId(prefix = "gen"): string {
  return `${prefix}_${v4().slice(0, 8)}`;
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, total, page, totalPages };
}

export function paginateFromParams<T>(items: T[], params?: Record<string, string | undefined>) {
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 20;
  return paginate(items, page, limit);
}

export interface ListParams {
  page?: number; limit?: number; sort?: string;
  order?: "asc" | "desc"; search?: string;
}

export function searchItems<T extends Record<string, any>>(
  items: T[], params: ListParams, searchFields: (keyof T)[],
) {
  let filtered = items;

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = items.filter((item) =>
      searchFields.some((field) =>
        String(item[field] ?? "").toLowerCase().includes(q),
      ),
    );
  }

  if (params.sort) {
    const dir = params.order === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[params.sort!];
      const bVal = b[params.sort!];
      return aVal > bVal ? dir : aVal < bVal ? -dir : 0;
    });
  }

  return paginate(filtered, params.page ?? 1, params.limit ?? 20);
}

/* ================================================================== */
/*  Generic CRUD helpers                                                */
/* ================================================================== */

export const CRUD = {
  list: <T>(items: T[], params: ListParams) =>
    paginate(items, params.page ?? 1, params.limit ?? 20),

  get: <T extends { id: string }>(items: T[], id: string): T | undefined =>
    items.find((item) => item.id === id),

  create: <T extends { id: string }>(items: T[], item: T): T => {
    items.push(item);
    return item;
  },

  update: <T extends { id: string }>(items: T[], id: string, updates: Partial<T>): T | null => {
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    return items[idx];
  },

  remove: <T extends { id: string }>(items: T[], id: string): boolean => {
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },
};
