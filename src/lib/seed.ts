/**
 * ALAYA INSIDER — Seed (EMPTY — production mode)
 * --------------------------------------------------------------------------
 * All demo/seed data has been removed per LP1 Phase 1 requirements.
 * Data is loaded exclusively via the import pipeline (CSV/JSON/API).
 * Store pages display "No Data Available" when empty.
 */

import type { StoreData } from "../lib/types";
import type { Settings } from "../lib/types";

/** Minimal settings — matches DEFAULT_SETTINGS in StoreContext. */
const MINIMAL_SETTINGS: Settings = {
  storeName: "ALAYA INSIDER",
  storeShort: "ALAYA",
  tagline: "Enterprise Affiliate Platform",
  description: "Premium global affiliate platform.",
  defaultTheme: "light",
  defaultLanguage: "en",
  accentLight: "#9c7a4b",
  accentDark: "#c9a876",
  currency: { code: "USD", symbol: "$", rate: 1 },
  announcement: { enabled: false, text: "", link: "" },
  announcements: [],
  heroSlides: [],
  homeSections: [{ id: "sec_hero", label: "Hero Slider", enabled: true }],
  design: { primary: "#211c15", secondary: "#6e6356", accent: "#9c7a4b", success: "#4b7a52", warning: "#b9802f", danger: "#b14b46", info: "#4f6da3", fontHeading: "Playfair Display", fontBody: "Inter", radiusSm: 8, radiusMd: 14, radiusLg: 20, shadowSoft: true, animationSpeed: "normal" },
  header: { sticky: true, transparent: true, showAnnouncement: true, showMegaMenu: true, showSearch: true, showWishlist: true, showCompare: true, showNotifications: true, showAccount: true, showDarkMode: true, showLanguage: true, showCurrency: true },
  footer: { showNewsletter: true, showSocial: true, showPolicies: true, showPayments: true, showTrustBadges: true, showAffiliateDisclosure: true },
  shipping: { freeOver: 150, flatRate: 12 },
  taxRate: 0.08,
  contactEmail: "hello@alayainsider.com",
  supportEmail: "support@alayainsider.com",
  contactPhone: "+1 (212) 555-0198",
  address: "200 Park Avenue South, Suite 1500, New York, NY 10003",
  social: { instagram: "https://instagram.com/alayainsider", pinterest: "https://pinterest.com/alayainsider", tiktok: "https://tiktok.com/@alayainsider", youtube: "https://youtube.com/@alayainsider", x: "https://x.com/alayainsider" },
  seo: { title: "ALAYA INSIDER — Premium Editorial Shopping", description: "Discover the finest curated products from around the world.", keywords: "premium shopping, curated products, ALAYA INSIDER", ogImage: "", twitterHandle: "@alayainsider" },
  features: { wishlist: true, compare: true, recentlyViewed: true, darkMode: true, affiliate: true, reviews: true, digital: true, coupons: true, brands: true, journal: true, accounts: true, multiLanguage: true },
  adminEmail: "alayainsider@gmail.com",
  adminPhone: "+91 8431364706",
  adminPassword: "Alaya@1923",
  mfaMethod: "email_sms",
  totpSecret: "",
  totpVerified: false,
  totpBackupCodes: [],
};

export const STORE_VERSION = 0;

export const SEED_STORE: StoreData = {
  version: 0,
  products: [],
  categories: [],
  brands: [],
  orders: [],
  coupons: [],
  articles: [],
  customers: [],
  questions: [],
  suppliers: [],
  paymentGateways: [],
  returns: [],
  redirects: [],
  popups: [],
  abandonedCarts: [],
  referrals: [],
  loyaltyTiers: [],
  liveSales: [],
  supportTickets: [],
  affiliates: [],
  auditLogs: [],
  settings: MINIMAL_SETTINGS,
};
