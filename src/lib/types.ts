/**
 * ALAYA INSIDER — Domain model types
 * Single source of truth for the storefront + admin data shapes.
 *
 * Entities (normalized, relation-backed):
 *  Product ─┬─ Brand (brandId)
 *           ├─ Category (category)
 *           ├─ Variant[] / Review[] / Tag[]
 *  Order ──── OrderItem[]
 *  Coupon, AffPartner, Article (Journal), Customer, AuditLog
 */

export type Theme = "light" | "dark";

export type Language = "en" | "es" | "fr" | "de" | "it" | "hi";

/** physical = stocked goods · variable = has options · digital = downloadable · external = affiliate/dropship link */
export type ProductType = "physical" | "digital" | "variable" | "external";

export interface Variant {
  name: string; // e.g. "Size", "Shade", "Colour"
  options: string[]; // e.g. ["S", "M", "L"]
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1–5
  title: string;
  body: string;
  date: string; // ISO date
  verified?: boolean;
  helpful?: number;
  pinned?: boolean;
}

/** A customer question on a product (Q&A module). */
export interface Question {
  id: string;
  productId: string;
  author: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  helpful: number;
  date: string; // ISO date
  pinned?: boolean;
}

/** Spec row for the Amazon-style information table. */
export interface SpecRow {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand?: string; // display label
  brandId?: string; // relation to Brand
  category: string; // category id/slug
  type: ProductType;
  price: number; // base price in USD
  salePrice?: number | null;
  rating: number;
  reviewCount: number;
  images: string[];
  shortDescription: string;
  description: string;
  features: string[];
  variants?: Variant[];
  stock: number;
  sku: string;
  tags: string[];
  /** PIM identifiers */
  barcode?: string;
  gtin?: string;
  asin?: string;
  supplierId?: string;
  costPrice?: number;
  /** Affiliate engine */
  affiliate?: boolean;
  affiliateUrl?: string;
  affiliatePartner?: string;
  affiliateNetwork?: string;
  affiliateCommission?: number;
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  comingSoon?: boolean;
  preorder?: boolean;
  /** Approval workflow */
  status?: ProductStatus;
  reviews: Review[];
  specs?: SpecRow[];
  createdAt: number;
}

/** Product publishing/approval lifecycle. */
export type ProductStatus = "draft" | "review" | "published" | "archived";

export interface Category {
  id: string; // slug
  name: string;
  tagline: string;
  description: string;
  image: string;
}

/** A curated brand / label carried by the store. */
export interface Brand {
  id: string; // slug
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  logo?: string;
  website?: string;
  instagram?: string;
  country: string;
  featured?: boolean;
}

export interface AffPartner {
  id: string;
  name: string;
  url: string;
  commission: number; // %
  active: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  variant?: Record<string, string>;
  price: number; // unit price in USD
  qty: number;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  country: string;
  zip: string;
  phone?: string;
}

/** A fulfilment supplier (dropshipping partner or warehouse). */
export interface Supplier {
  id: string;
  name: string;
  email: string;
  country: string;
  priority: number; // lower = higher priority
  active: boolean;
  handlingDays: number;
  notes?: string;
}

/** A configurable payment gateway. */
export interface PaymentGateway {
  id: string;
  name: string;
  code: string; // stripe | paypal | razorpay | cod | bank | upi | applepay | googlepay
  mode: "live" | "sandbox";
  active: boolean;
  countries: string[]; // empty = all
}

export interface Order {
  id: string;
  number: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  couponCode?: string;
  paymentMethod?: string;
  notes?: string;
  giftMessage?: string;
  supplierId?: string;
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery?: number;
  customer: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    zip?: string;
  };
  status: OrderStatus;
  createdAt: number;
}

/** A redeemable discount code. */
export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number; // % or USD
  minSpend: number; // USD subtotal required
  active: boolean;
  description: string;
  expiresAt?: number; // epoch ms (optional)
  usageLimit?: number; // total redemptions allowed
  usedCount: number;
}

/** Journal / editorial article for SEO + engagement. */
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[]; // paragraphs
  cover: string;
  author: string;
  authorRole: string;
  category: string;
  tags: string[];
  readMinutes: number;
  publishedAt: number;
  featured?: boolean;
}

/** A customer timeline event (the customer journey). */
export interface TimelineEvent {
  id: string;
  type: "account_created" | "login" | "viewed_product" | "wishlist_add" | "compare_add" | "cart_add" | "checkout_start" | "purchase" | "refund" | "review" | "coupon_used" | "newsletter_signup" | "support_ticket" | "email_open";
  label: string;
  ts: number;
  meta?: string;
}

/** An admin note on a customer profile. */
export interface CustomerNote {
  id: string;
  author: string;
  body: string;
  pinned: boolean;
  private: boolean;
  ts: number;
}

/** A CRM task attached to a customer. */
export interface CustomerTask {
  id: string;
  title: string;
  type: "follow_up" | "marketing" | "support" | "sales" | "reminder";
  assignee: string;
  dueDate?: number;
  priority: "low" | "medium" | "high";
  done: boolean;
  ts: number;
}

/** A support ticket. */
export interface SupportTicket {
  id: string;
  number: string;
  customerId: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  messages: { author: string; body: string; ts: number }[];
  createdAt: number;
}

/** A local customer account (auth handled client-side for the demo). */
export interface Customer {
  id: string;
  name: string;
  email: string;
  password: string; // stored opaque token (demo only)
  phone?: string;
  country?: string;
  language?: string;
  createdAt: number;
  lastLogin?: number;
  status: "active" | "inactive" | "vip" | "blocked";
  addresses: Address[];
  newsletter: boolean;
  // CRM enrichment
  timeline: TimelineEvent[];
  notes: CustomerNote[];
  tasks: CustomerTask[];
  preferences?: {
    favoriteBrands: string[];
    favoriteCategories: string[];
    preferredTheme: "light" | "dark";
    marketingOptIn: boolean;
  };
  loyaltyPoints?: number;
  storeCredit?: number;
  referralCode?: string;
}

/** A customer return / refund request. */
export type ReturnType = "refund" | "replacement" | "exchange";
export type ReturnStatus = "requested" | "approved" | "rejected" | "completed";

export interface ReturnRequest {
  id: string;
  number: string; // RT-xxxxxx
  orderId: string;
  orderNumber: string;
  customer: { name: string; email: string };
  type: ReturnType;
  reason: string;
  comment?: string;
  status: ReturnStatus;
  refundAmount?: number;
  createdAt: number;
}

/** A URL redirect rule. */
export type RedirectType = 301 | 302 | 307 | 410;
export interface Redirect {
  id: string;
  from: string;
  to: string;
  type: RedirectType;
  active: boolean;
  hits: number;
  createdAt: number;
}

/** Marketing popup (newsletter, coupon, exit-intent, etc). */
export type PopupTrigger = "exit_intent" | "scroll" | "time" | "click" | "welcome";
export type PopupType = "newsletter" | "coupon" | "promo" | "announcement";
export interface Popup {
  id: string;
  name: string;
  type: PopupType;
  trigger: PopupTrigger;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaLink?: string;
  couponCode?: string;
  triggerValue?: number; // seconds for time, percent for scroll
  active: boolean;
  views: number;
  conversions: number;
}

/** A live sales notification entry. */
export interface LiveSale {
  id: string;
  customerName: string;
  city: string;
  country: string;
  productId: string;
  minutesAgo: number;
}

/** An abandoned cart recovery record. */
export interface AbandonedCart {
  id: string;
  email?: string;
  items: number;
  value: number;
  stage: "cart" | "checkout";
  recovered: boolean;
  createdAt: number;
}

/** A referral record. */
export interface Referral {
  id: string;
  code: string;
  customerName: string;
  clicks: number;
  signups: number;
  purchases: number;
  rewardEarned: number;
}

/** Loyalty tier definition. */
export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  perk: string;
}

/** Append-only audit/activity log entry (security + admin visibility). */
export interface AuditLog {
  id: string;
  ts: number;
  actor: string; // "admin" | "system" | email
  action: string; // e.g. "product.create"
  entity: string; // "product" | "order" ...
  entityId?: string;
  meta?: string;
}

/** A rotating announcement message in the top bar. */
export interface Announcement {
  id: string;
  text: string;
  link?: string;
  /** optional countdown end (epoch ms) shown inline */
  endsAt?: number;
}

/** A hero slider slide. */
export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  highlight?: string; // accent-coloured word within title
  description: string;
  image: string;
  ctaLabel: string;
  ctaLink: string;
  cta2Label?: string;
  cta2Link?: string;
  align?: "left" | "center" | "right";
}

/** Homepage section visibility/order configuration. */
export interface HomeSection {
  id: string;
  label: string;
  enabled: boolean;
}

export interface CurrencySetting {
  code: string; // "USD"
  symbol: string; // "$"
  rate: number; // multiplier from base USD
}

/** Global design tokens (managed from the Design Studio). */
export interface DesignTokens {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  fontHeading: string;
  fontBody: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  shadowSoft: boolean;
  animationSpeed: "slow" | "normal" | "fast";
}

export interface HeaderConfig {
  sticky: boolean;
  transparent: boolean;
  showAnnouncement: boolean;
  showMegaMenu: boolean;
  showSearch: boolean;
  showWishlist: boolean;
  showCompare: boolean;
  showNotifications: boolean;
  showAccount: boolean;
  showDarkMode: boolean;
  showLanguage: boolean;
  showCurrency: boolean;
}

export interface FooterConfig {
  showNewsletter: boolean;
  showSocial: boolean;
  showPolicies: boolean;
  showPayments: boolean;
  showTrustBadges: boolean;
  showAffiliateDisclosure: boolean;
}

export interface Settings {
  storeName: string;
  storeShort: string;
  tagline: string;
  description: string;
  defaultTheme: Theme;
  defaultLanguage: Language;
  accentLight: string;
  accentDark: string;
  currency: CurrencySetting;
  announcement: { enabled: boolean; text: string; link?: string };
  announcements: Announcement[];
  heroSlides: HeroSlide[];
  homeSections: HomeSection[];
  design: DesignTokens;
  header: HeaderConfig;
  footer: FooterConfig;
  shipping: { freeOver: number; flatRate: number };
  taxRate: number;
  contactEmail: string;
  supportEmail: string;
  contactPhone: string;
  address: string;
  social: {
    instagram: string;
    pinterest: string;
    tiktok: string;
    youtube: string;
    x: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
    twitterHandle: string;
  };
  features: {
    wishlist: boolean;
    compare: boolean;
    recentlyViewed: boolean;
    darkMode: boolean;
    affiliate: boolean;
    reviews: boolean;
    digital: boolean;
    coupons: boolean;
    brands: boolean;
    journal: boolean;
    accounts: boolean;
    multiLanguage: boolean;
  };
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  mfaMethod: "email_sms" | "totp";
  totpSecret: string;
  totpVerified: boolean;
  totpBackupCodes: string[];
}

export interface StoreData {
  version: number;
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
}

export interface CartLine {
  productId: string;
  variantKey: string; // "" when no variants
  variantLabel: string; // human readable
  qty: number;
}
