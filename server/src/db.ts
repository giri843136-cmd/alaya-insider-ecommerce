/**
 * ALAYA INSIDER — Backend Database with Persistent Storage (LEGACY)
 * --------------------------------------------------------------------------
 * @deprecated This module is the legacy JSON-file-based store.
 * New code should use the PostgreSQL connection pool and repository
 * pattern in `./db/index.ts` and `./db/repositories/`.
 *
 * This file remains active because several services (downloader,
 * notificationEngine, webhooks) still depend on getStore()/persistStore()
 * for in-memory data that hasn't been migrated to PostgreSQL yet.
 *
 * Planned migration: Move notification engine, downloader DAM storage,
 * and webhook delivery records to PostgreSQL tables.
 *
 * Start:  npm run dev  (or: tsx watch src/index.ts)
 * Port:   3001 (configurable via PORT env var)
 * Health: GET /api/v1/system/health
 */

import { v4 } from "uuid";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedData } from "./seed/index.js";

/* ================================================================== */
/*  PERSISTENCE CONFIG                                                 */
/* ================================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "store.json");

// Debounce handle to batch rapid saves
let _saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Persist the store to disk as JSON (debounced). */
export function persistStore(data: StoreData): void {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      console.error("[DB] Failed to persist store to disk");
    }
    _saveTimer = null;
  }, 100);
}

/** Load the store from disk, returning null if no file exists. */
function loadPersistedStore(): StoreData | null {
  try {
    if (!existsSync(DB_PATH)) return null;
    const raw = readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    console.warn("[DB] Failed to read persisted store, falling back to seed data");
    return null;
  }
}

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
}

export interface Review { id: string; author: string; rating: number; title: string; body: string; date: string; verified?: boolean; helpful?: number; pinned?: boolean; }

export interface SpecRow { label: string; value: string; }

export interface Category { id: string; name: string; tagline: string; description: string; image: string; }

export interface Brand { id: string; name: string; slug: string; tagline: string; description: string; image: string; logo?: string; website?: string; instagram?: string; country: string; featured?: boolean; }

export interface Order { id: string; number: string; items: OrderItem[]; subtotal: number; discount: number; shipping: number; tax: number; total: number; currency: string; couponCode?: string; paymentMethod?: string; notes?: string; giftMessage?: string; trackingNumber?: string; courier?: string; customer: { id?: string; name: string; email: string; phone?: string; address?: string; city?: string; country?: string; zip?: string; }; status: string; createdAt: number; }

export interface OrderItem { productId: string; name: string; image: string; variant?: Record<string, string>; price: number; qty: number; }

export interface Coupon { id: string; code: string; type: string; value: number; minSpend: number; active: boolean; description: string; expiresAt?: number; usageLimit?: number; usedCount: number; }

export interface Article { id: string; slug: string; title: string; excerpt: string; body: string[]; cover: string; author: string; authorRole: string; category: string; tags: string[]; readMinutes: number; publishedAt: number; featured?: boolean; }

export interface Customer { id: string; name: string; email: string; password: string; phone?: string; country?: string; createdAt: number; lastLogin?: number; status: string; addresses: Address[]; newsletter: boolean; timeline: TimelineEvent[]; notes: CustomerNote[]; tasks: CustomerTask[]; preferences?: Record<string, unknown>; loyaltyPoints?: number; storeCredit?: number; referralCode?: string; }

export interface Address { id: string; label: string; name: string; line1: string; city: string; country: string; zip: string; phone?: string; }

export interface TimelineEvent { id: string; type: string; label: string; ts: number; meta?: string; }

export interface CustomerNote { id: string; author: string; body: string; pinned: boolean; ts: number; }

export interface CustomerTask { id: string; title: string; type: string; assignee: string; dueDate?: number; priority: string; done: boolean; ts: number; }

export interface Question { id: string; productId: string; author: string; question: string; answer?: string; answeredBy?: string; helpful: number; date: string; pinned?: boolean; }

export interface Supplier { id: string; name: string; email: string; country: string; priority: number; active: boolean; handlingDays: number; notes?: string; }

export interface PaymentGateway { id: string; name: string; code: string; mode: string; active: boolean; countries: string[]; }

export interface ReturnRequest { id: string; number: string; orderId: string; orderNumber: string; customer: { name: string; email: string; }; type: string; reason: string; comment?: string; status: string; refundAmount?: number; createdAt: number; }

export interface Redirect { id: string; from: string; to: string; type: number; active: boolean; hits: number; createdAt: number; }

export interface Popup { id: string; name: string; type: string; trigger: string; headline: string; body: string; ctaLabel: string; ctaLink?: string; couponCode?: string; triggerValue?: number; active: boolean; views: number; conversions: number; }

export interface AffPartner { id: string; name: string; url: string; commission: number; active: boolean; }

export interface LoyaltyTier { id: string; name: string; minPoints: number; perk: string; }

export interface LiveSale { id: string; customerName: string; city: string; country: string; productId: string; minutesAgo: number; }

export interface AbandonedCart { id: string; email?: string; items: number; value: number; stage: string; recovered: boolean; createdAt: number; }

export interface Referral { id: string; code: string; customerName: string; clicks: number; signups: number; purchases: number; rewardEarned: number; }

export interface SupportTicket { id: string; number: string; customerId: string; subject: string; status: string; priority: string; messages: { author: string; body: string; ts: number }[]; createdAt: number; }

export interface AuditLog { id: string; ts: number; actor: string; action: string; entity: string; entityId?: string; meta?: string; }

export interface Settings { storeName: string; storeShort: string; tagline: string; description: string; defaultTheme: string; defaultLanguage: string; accentLight: string; accentDark: string; currency: { code: string; symbol: string; rate: number }; announcement: { enabled: boolean; text: string; link?: string }; announcements: Record<string, unknown>[]; heroSlides: Record<string, unknown>[]; homeSections: Record<string, unknown>[]; design: Record<string, unknown>; header: Record<string, unknown>; footer: Record<string, unknown>; shipping: { freeOver: number; flatRate: number }; taxRate: number; contactEmail: string; supportEmail: string; contactPhone: string; adminEmail: string; adminPhone: string; address: string; social: Record<string, string>; seo: Record<string, string>; features: Record<string, boolean>; adminPassword: string; mfaMethod: string; totpSecret: string; totpVerified: boolean; totpBackupCodes: string[]; }

export interface StoreData {
  version: number; products: Product[]; categories: Category[]; brands: Brand[];
  orders: Order[]; coupons: Coupon[]; articles: Article[]; customers: Customer[];
  questions: Question[]; suppliers: Supplier[]; paymentGateways: PaymentGateway[];
  returns: ReturnRequest[]; redirects: Redirect[]; popups: Popup[];
  abandonedCarts: AbandonedCart[]; referrals: Referral[]; loyaltyTiers: LoyaltyTier[];
  liveSales: LiveSale[]; supportTickets: SupportTicket[]; affiliates: AffPartner[];
  auditLogs: AuditLog[]; settings: Settings;
  // Auth store — managed by the auth service, persisted for data integrity
  _auth?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[]; total: number; page: number; pageSize: number; hasMore: boolean;
}

export interface ListParams {
  page?: number; pageSize?: number; search?: string; sort?: string; order?: string;
  [key: string]: string | number | undefined;
}

/* ================================================================== */
/*  SEED DATA (imported from ./seed/index.ts)                          */
/* ================================================================== */

/* ================================================================== */
/*  DATABASE INSTANCE                                                  */
/* ================================================================== */

const SEED_VERSION = 11;

let store: StoreData =
  (() => {
    const persisted = loadPersistedStore();
    if (persisted) {
      if (persisted.version !== SEED_VERSION) {
        console.log(`[DB] Seed version mismatch (stored: ${persisted.version}, latest: ${SEED_VERSION}) — re-seeding`);
        const fresh = createSeedData();
        return fresh;
      }
      console.log(`[DB] Loaded persisted store from ${DB_PATH} (${persisted.products.length} products, ${persisted.orders.length} orders)`);
      return persisted;
    }
    console.log("[DB] No persisted store found — seeding fresh data");
    return createSeedData();
  })();

// Persist the initial seed data immediately
persistStore(store);

/** Flush any pending save and exit cleanly. */
function shutdown() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    try {
      writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
      console.log("[DB] Persisted data before exit");
    } catch { /* ignore */ }
  }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export function getStore(): StoreData {
  return store;
}

export function resetStore(): void {
  store = createSeedData();
  persistStore(store);
}

/* ================================================================== */
/*  GENERIC HELPERS                                                    */
/* ================================================================== */

export function paginate<T>(items: T[], params: ListParams = {}): PaginatedResult<T> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { data: slice, total: items.length, page, pageSize, hasMore: start + pageSize < items.length };
}

const match = (haystack: string | undefined, needle?: string) =>
  !needle || (haystack ?? "").toLowerCase().includes(needle.toLowerCase());

export function searchItems<T>(
  items: T[],
  params: ListParams,
  searchFields: (keyof T)[],
): T[] {
  let filtered = items;
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = items.filter((item) => searchFields.some((f) => match(String(item[f] ?? ""), q)));
  }
  if (params.sort) {
    const key = params.sort as keyof T;
    const dir = params.order === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const va = a[key]; const vb = b[key];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
  }
  return filtered;
}

export function genId(prefix = "id"): string { return `${prefix}_${v4().slice(0, 8)}${Date.now().toString(36).slice(-4)}`; }

/* ================================================================== */
/*  CRUD HELPERS                                                       */
/* ================================================================== */

export const CRUD = {
  list: <T extends Record<string, unknown>>(items: T[], params: ListParams, searchFields: (keyof T)[]): PaginatedResult<T> =>
    paginate(searchItems(items, params, searchFields), params),

  get: <T extends { id: string }>(items: T[], id: string): T | undefined =>
    items.find((i) => i.id === id),

  create: <T extends { id: string }>(items: T[], input: T): T => {
    items.push(input);
    persistStore(store);
    return input;
  },

  update: <T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T | null => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch };
    persistStore(store);
    return items[idx];
  },

  remove: <T extends { id: string }>(items: T[], id: string): boolean => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    persistStore(store);
    return true;
  },
};

/* ================================================================== */
/*  EXPORT FOR SEEDING                                                 */
/* ================================================================== */

export { createSeedData };
