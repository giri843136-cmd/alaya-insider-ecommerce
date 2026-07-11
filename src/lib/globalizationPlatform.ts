/**
 * ALAYA INSIDER — Enterprise Globalization Platform (PART 2.15)
 * =====================================================================
 * Centralized global expansion engine: country/region management, multi-tenancy,
 * multi-domain, multi-language, multi-currency, international commerce, tax,
 * compliance, timezone/calendar, AI localization, and global reporting.
 *
 * Integrates with: types.ts, utils.ts, commerce.ts, devops.ts,
 * contentPlatform.ts, commercePlatform.ts, LanguageContext.tsx
 */
import { uid } from "./utils";
import { pushLog } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const GLOBALIZATION_KEY = "alaya_globalization_platform_store";
export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "it", "hi", "pt", "ja", "zh", "ar", "ko", "nl"] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "SGD", "CNY", "BRL", "KRW", "CHF"] as const;
export type SupportedCurrencyCode = typeof SUPPORTED_CURRENCIES[number];

/* ================================================================== */
/*  TYPES — Country & Region Management                                */
/* ================================================================== */

export interface Country {
  id: string;
  code: string; // ISO 3166-1 alpha-2
  code3: string; // ISO 3166-1 alpha-3
  name: string;
  nativeName: string;
  dialCode: string;
  continent: string;
  region: string;
  subregion: string;
  currencies: SupportedCurrencyCode[];
  languages: string[];
  defaultLanguage: string;
  defaultCurrency: SupportedCurrencyCode;
  flagEmoji: string;
  timezone: string;
  active: boolean;
  shippingAvailable: boolean;
  taxRate: number;
  taxName: string;
  postalCodeFormat: string;
  postalCodeRegex: string;
  requiresState: boolean;
  states: RegionState[];
}

export interface RegionState {
  id: string;
  code: string;
  name: string;
  type: "state" | "province" | "region" | "prefecture" | "territory" | "community" | "municipality" | "special_city" | "metropolitan";
  taxRate?: number;
  active: boolean;
}

export interface GeoLocation {
  ip: string;
  country: Country;
  state?: RegionState;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isVpn: boolean;
  isProxy: boolean;
  isCrawler: boolean;
}

export interface Timezone {
  id: string;
  name: string;
  abbreviation: string;
  utcOffset: string;
  utcOffsetMinutes: number;
  countries: string[];
  dstObserved: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // MM-DD format
  countryCode: string;
  type: "public" | "observed" | "religious" | "seasonal" | "regional";
  regionCode?: string;
  recurring: boolean;
  businessClosure: boolean;
}

/* ================================================================== */
/*  TYPES — Multi-Tenancy                                              */
/* ================================================================== */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  domains: TenantDomain[];
  defaultLanguage: string;
  defaultCurrency: SupportedCurrencyCode;
  countryCode: string;
  features: Record<string, boolean>;
  settings: Record<string, string>;
  billingPlan: "free" | "starter" | "growth" | "enterprise";
  billingEmail: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, string>;
}

export interface TenantDomain {
  id: string;
  domain: string;
  type: "primary" | "country" | "language" | "regional" | "subdomain" | "custom";
  countryCode?: string;
  languageCode?: string;
  isPrimary: boolean;
  sslEnabled: boolean;
  verified: boolean;
  dnsRecord: string;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Multi-Language Platform                                    */
/* ================================================================== */

export interface LanguageConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  flag: string;
  active: boolean;
  isDefault: boolean;
  locale: string; // e.g. "en-US"
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number;
  decimalSeparator: string;
  thousandSeparator: string;
}

export interface TranslationMemory {
  id: string;
  sourceLocale: string;
  targetLocale: string;
  sourceText: string;
  translatedText: string;
  context: string;
  domain: string;
  quality: number;
  createdAt: number;
}

export interface HreflangEntry {
  locale: string;
  url: string;
  hreflang: string;
}

/* ================================================================== */
/*  TYPES — International Commerce                                    */
/* ================================================================== */

export interface RegionalProductAvailability {
  id: string;
  productId: string;
  countryCode: string;
  available: boolean;
  stockOverride?: number;
  priceOverride?: number;
  currencyOverride?: SupportedCurrencyCode;
  estimatedShippingDays?: number;
  shippingCostOverride?: number;
  restricted: boolean;
  restrictionReason?: string;
}

export interface MarketplaceConfig {
  id: string;
  name: string;
  countryCode: string;
  platform: "amazon" | "flipkart" | "rakuten" | "mercado_libre" | "aliexpress" | "ebay" | "other";
  marketplaceUrl: string;
  sellerId?: string;
  currency: SupportedCurrencyCode;
  language: string;
  commissionPercent: number;
  active: boolean;
  lastSyncedAt?: number;
  syncStatus: "idle" | "syncing" | "error";
  credentialsConfigured: boolean;
  createdAt: number;
}

export interface AffiliateRoute {
  id: string;
  countryCode: string;
  networkId: string;
  networkName: string;
  trackingId: string;
  baseUrl: string;
  commissionRate: number;
  priority: number;
  active: boolean;
}

/* ================================================================== */
/*  TYPES — Compliance                                                 */
/* ================================================================== */

export interface PrivacyRegulation {
  id: string;
  name: string;
  code: string; // gdpr, ccpa, lgpd, etc.
  countries: string[];
  description: string;
  requirements: string[];
  enabled: boolean;
  consentRequired: boolean;
  cookieConsentRequired: boolean;
  dataExportRequired: boolean;
  dataDeletionRequired: boolean;
  ageVerificationRequired: boolean;
  dpaRequired: boolean;
  ropaRequired: boolean;
  lastReviewedAt?: number;
  createdAt: number;
}

export interface ConsentRecord {
  id: string;
  visitorId: string;
  purpose: string;
  granted: boolean;
  timestamp: number;
  ip: string;
  userAgent: string;
  consentVersion: string;
}

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies: CookieDef[];
}

export interface CookieDef {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: "essential" | "functional" | "analytics" | "marketing" | "social";
}

/* ================================================================== */
/*  TYPES — Global Reports                                             */
/* ================================================================== */

export interface GlobalizationMetric {
  id: string;
  name: string;
  category: "countries" | "languages" | "currencies" | "tenants" | "marketplaces" | "compliance" | "traffic";
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
}

export interface GlobalizationDashboardData {
  totalCountries: number;
  activeCountries: number;
  totalLanguages: number;
  activeLanguages: number;
  totalCurrencies: number;
  activeCurrencies: number;
  totalTenants: number;
  activeTenants: number;
  totalMarketplaces: number;
  syncedMarketplaces: number;
  complianceScore: number;
  geoDetectedToday: number;
  translationCount: number;
  consentCount: number;
}

export interface GlobalReport {
  title: string;
  type: "countries" | "languages" | "currencies" | "compliance" | "traffic" | "localization" | "marketplace";
  generatedAt: number;
  data: Record<string, any>;
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface GlobalizationStore {
  countries: Country[];
  timezones: Timezone[];
  holidays: Holiday[];
  tenants: Tenant[];
  tenantDomains: TenantDomain[];
  languageConfigs: LanguageConfig[];
  translationMemory: TranslationMemory[];
  marketplaces: MarketplaceConfig[];
  affiliateRoutes: AffiliateRoute[];
  regionalAvailability: RegionalProductAvailability[];
  privacyRegulations: PrivacyRegulation[];
  consentRecords: ConsentRecord[];
  cookieCategories: CookieCategory[];
}

function getStore(): GlobalizationStore {
  try {
    const raw = localStorage.getItem(GLOBALIZATION_KEY);
    if (raw) return JSON.parse(raw) as GlobalizationStore;
  } catch { /* ignore */ }
  return {
    countries: [], timezones: [], holidays: [],
    tenants: [], tenantDomains: [], languageConfigs: [],
    translationMemory: [], marketplaces: [], affiliateRoutes: [],
    regionalAvailability: [], privacyRegulations: [], consentRecords: [],
    cookieCategories: [],
  };
}

function saveStore(store: GlobalizationStore) {
  try { localStorage.setItem(GLOBALIZATION_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedGlobalizationData() {
  const store = getStore();
  if (store.countries.length > 0) return;

  const now = Date.now();

  /* ---- Countries ---- */
  const countries: Country[] = [
    { id: uid("ctry"), code: "US", code3: "USA", name: "United States", nativeName: "United States", dialCode: "+1", continent: "North America", region: "Americas", subregion: "Northern America", currencies: ["USD"], languages: ["en"], defaultLanguage: "en", defaultCurrency: "USD", flagEmoji: "🇺🇸", timezone: "America/New_York", active: true, shippingAvailable: true, taxRate: 0.08, taxName: "Sales Tax", postalCodeFormat: "##### or #####-####", postalCodeRegex: "^\\d{5}(-\\d{4})?$", requiresState: true, states: [
      { id: uid("st"), code: "AL", name: "Alabama", type: "state", active: true },
      { id: uid("st"), code: "CA", name: "California", type: "state", taxRate: 0.0875, active: true },
      { id: uid("st"), code: "NY", name: "New York", type: "state", taxRate: 0.08875, active: true },
      { id: uid("st"), code: "TX", name: "Texas", type: "state", active: true },
      { id: uid("st"), code: "FL", name: "Florida", type: "state", active: true },
      { id: uid("st"), code: "IL", name: "Illinois", type: "state", active: true },
      { id: uid("st"), code: "UK", name: "United Kingdom", type: "state", active: true },
    ] },
    { id: uid("ctry"), code: "GB", code3: "GBR", name: "United Kingdom", nativeName: "United Kingdom", dialCode: "+44", continent: "Europe", region: "Europe", subregion: "Northern Europe", currencies: ["GBP"], languages: ["en"], defaultLanguage: "en", defaultCurrency: "GBP", flagEmoji: "🇬🇧", timezone: "Europe/London", active: true, shippingAvailable: true, taxRate: 0.20, taxName: "VAT", postalCodeFormat: "@# #@@ or @#@ #@@", postalCodeRegex: "^[A-Z]{1,2}\\d[A-Z\\d]?\\s\\d[A-Z]{2}$", requiresState: false, states: [
      { id: uid("st"), code: "ENG", name: "England", type: "region", active: true },
      { id: uid("st"), code: "SCT", name: "Scotland", type: "region", active: true },
      { id: uid("st"), code: "WLS", name: "Wales", type: "region", active: true },
      { id: uid("st"), code: "NIR", name: "Northern Ireland", type: "region", active: true },
    ] },
    { id: uid("ctry"), code: "DE", code3: "DEU", name: "Germany", nativeName: "Deutschland", dialCode: "+49", continent: "Europe", region: "Europe", subregion: "Western Europe", currencies: ["EUR"], languages: ["de"], defaultLanguage: "de", defaultCurrency: "EUR", flagEmoji: "🇩🇪", timezone: "Europe/Berlin", active: true, shippingAvailable: true, taxRate: 0.19, taxName: "VAT", postalCodeFormat: "#####", postalCodeRegex: "^\\d{5}$", requiresState: true, states: [
      { id: uid("st"), code: "BW", name: "Baden-Württemberg", type: "state", active: true },
      { id: uid("st"), code: "BY", name: "Bavaria", type: "state", active: true },
      { id: uid("st"), code: "BE", name: "Berlin", type: "state", active: true },
      { id: uid("st"), code: "HH", name: "Hamburg", type: "state", active: true },
    ] },
    { id: uid("ctry"), code: "FR", code3: "FRA", name: "France", nativeName: "France", dialCode: "+33", continent: "Europe", region: "Europe", subregion: "Western Europe", currencies: ["EUR"], languages: ["fr"], defaultLanguage: "fr", defaultCurrency: "EUR", flagEmoji: "🇫🇷", timezone: "Europe/Paris", active: true, shippingAvailable: true, taxRate: 0.20, taxName: "VAT", postalCodeFormat: "#####", postalCodeRegex: "^\\d{5}$", requiresState: true, states: [
      { id: uid("st"), code: "IDF", name: "Île-de-France", type: "region", active: true },
      { id: uid("st"), code: "PAC", name: "Provence-Alpes-Côte d'Azur", type: "region", active: true },
      { id: uid("st"), code: "ARA", name: "Auvergne-Rhône-Alpes", type: "region", active: true },
    ] },
    { id: uid("ctry"), code: "IT", code3: "ITA", name: "Italy", nativeName: "Italia", dialCode: "+39", continent: "Europe", region: "Europe", subregion: "Southern Europe", currencies: ["EUR"], languages: ["it"], defaultLanguage: "it", defaultCurrency: "EUR", flagEmoji: "🇮🇹", timezone: "Europe/Rome", active: true, shippingAvailable: true, taxRate: 0.22, taxName: "IVA", postalCodeFormat: "#####", postalCodeRegex: "^\\d{5}$", requiresState: true, states: [
      { id: uid("st"), code: "LOM", name: "Lombardy", type: "region", active: true },
      { id: uid("st"), code: "LAZ", name: "Lazio", type: "region", active: true },
      { id: uid("st"), code: "TOS", name: "Tuscany", type: "region", active: true },
    ] },
    { id: uid("ctry"), code: "ES", code3: "ESP", name: "Spain", nativeName: "España", dialCode: "+34", continent: "Europe", region: "Europe", subregion: "Southern Europe", currencies: ["EUR"], languages: ["es"], defaultLanguage: "es", defaultCurrency: "EUR", flagEmoji: "🇪🇸", timezone: "Europe/Madrid", active: true, shippingAvailable: true, taxRate: 0.21, taxName: "IVA", postalCodeFormat: "#####", postalCodeRegex: "^\\d{5}$", requiresState: true, states: [
      { id: uid("st"), code: "MD", name: "Madrid", type: "community", active: true },
      { id: uid("st"), code: "CT", name: "Catalonia", type: "community", active: true },
      { id: uid("st"), code: "AN", name: "Andalusia", type: "community", active: true },
    ] },
    { id: uid("ctry"), code: "CA", code3: "CAN", name: "Canada", nativeName: "Canada", dialCode: "+1", continent: "North America", region: "Americas", subregion: "Northern America", currencies: ["CAD"], languages: ["en", "fr"], defaultLanguage: "en", defaultCurrency: "CAD", flagEmoji: "🇨🇦", timezone: "America/Toronto", active: true, shippingAvailable: true, taxRate: 0.05, taxName: "GST", postalCodeFormat: "@#@ #@@", postalCodeRegex: "^[A-Z]\\d[A-Z]\\s\\d[A-Z]\\d$", requiresState: true, states: [
      { id: uid("st"), code: "ON", name: "Ontario", type: "province", active: true },
      { id: uid("st"), code: "QC", name: "Quebec", type: "province", active: true },
      { id: uid("st"), code: "BC", name: "British Columbia", type: "province", active: true },
    ] },
    { id: uid("ctry"), code: "AU", code3: "AUS", name: "Australia", nativeName: "Australia", dialCode: "+61", continent: "Oceania", region: "Oceania", subregion: "Australia and New Zealand", currencies: ["AUD"], languages: ["en"], defaultLanguage: "en", defaultCurrency: "AUD", flagEmoji: "🇦🇺", timezone: "Australia/Sydney", active: true, shippingAvailable: true, taxRate: 0.10, taxName: "GST", postalCodeFormat: "####", postalCodeRegex: "^\\d{4}$", requiresState: true, states: [
      { id: uid("st"), code: "NSW", name: "New South Wales", type: "state", active: true },
      { id: uid("st"), code: "VIC", name: "Victoria", type: "state", active: true },
      { id: uid("st"), code: "QLD", name: "Queensland", type: "state", active: true },
    ] },
    { id: uid("ctry"), code: "IN", code3: "IND", name: "India", nativeName: "भारत", dialCode: "+91", continent: "Asia", region: "Asia", subregion: "Southern Asia", currencies: ["INR"], languages: ["hi", "en"], defaultLanguage: "hi", defaultCurrency: "INR", flagEmoji: "🇮🇳", timezone: "Asia/Kolkata", active: true, shippingAvailable: true, taxRate: 0.18, taxName: "GST", postalCodeFormat: "######", postalCodeRegex: "^\\d{6}$", requiresState: true, states: [
      { id: uid("st"), code: "MH", name: "Maharashtra", type: "state", active: true },
      { id: uid("st"), code: "DL", name: "Delhi", type: "state", active: true },
      { id: uid("st"), code: "KA", name: "Karnataka", type: "state", active: true },
      { id: uid("st"), code: "TN", name: "Tamil Nadu", type: "state", active: true },
    ] },
    { id: uid("ctry"), code: "JP", code3: "JPN", name: "Japan", nativeName: "日本", dialCode: "+81", continent: "Asia", region: "Asia", subregion: "Eastern Asia", currencies: ["JPY"], languages: ["ja"], defaultLanguage: "ja", defaultCurrency: "JPY", flagEmoji: "🇯🇵", timezone: "Asia/Tokyo", active: true, shippingAvailable: true, taxRate: 0.10, taxName: "Consumption Tax", postalCodeFormat: "###-####", postalCodeRegex: "^\\d{3}-\\d{4}$", requiresState: true, states: [
      { id: uid("st"), code: "TK", name: "Tokyo", type: "prefecture", active: true },
      { id: uid("st"), code: "OS", name: "Osaka", type: "prefecture", active: true },
      { id: uid("st"), code: "KY", name: "Kyoto", type: "prefecture", active: true },
    ] },
    { id: uid("ctry"), code: "CN", code3: "CHN", name: "China", nativeName: "中国", dialCode: "+86", continent: "Asia", region: "Asia", subregion: "Eastern Asia", currencies: ["CNY"], languages: ["zh"], defaultLanguage: "zh", defaultCurrency: "CNY", flagEmoji: "🇨🇳", timezone: "Asia/Shanghai", active: false, shippingAvailable: false, taxRate: 0.13, taxName: "VAT", postalCodeFormat: "######", postalCodeRegex: "^\\d{6}$", requiresState: true, states: [
      { id: uid("st"), code: "BJ", name: "Beijing", type: "municipality", active: true },
      { id: uid("st"), code: "SH", name: "Shanghai", type: "municipality", active: true },
    ] },
    { id: uid("ctry"), code: "BR", code3: "BRA", name: "Brazil", nativeName: "Brasil", dialCode: "+55", continent: "South America", region: "Americas", subregion: "South America", currencies: ["BRL"], languages: ["pt"], defaultLanguage: "pt", defaultCurrency: "BRL", flagEmoji: "🇧🇷", timezone: "America/Sao_Paulo", active: false, shippingAvailable: false, taxRate: 0.17, taxName: "ICMS", postalCodeFormat: "#####-###", postalCodeRegex: "^\\d{5}-\\d{3}$", requiresState: true, states: [
      { id: uid("st"), code: "SP", name: "São Paulo", type: "state", active: true },
      { id: uid("st"), code: "RJ", name: "Rio de Janeiro", type: "state", active: true },
    ] },
    { id: uid("ctry"), code: "KR", code3: "KOR", name: "South Korea", nativeName: "대한민국", dialCode: "+82", continent: "Asia", region: "Asia", subregion: "Eastern Asia", currencies: ["KRW"], languages: ["ko"], defaultLanguage: "ko", defaultCurrency: "KRW", flagEmoji: "🇰🇷", timezone: "Asia/Seoul", active: false, shippingAvailable: false, taxRate: 0.10, taxName: "VAT", postalCodeFormat: "#####", postalCodeRegex: "^\\d{5}$", requiresState: true, states: [
      { id: uid("st"), code: "SL", name: "Seoul", type: "special_city", active: true },
      { id: uid("st"), code: "BS", name: "Busan", type: "metropolitan", active: true },
    ] },
  ];

  /* ---- Timezones ---- */
  const timezones: Timezone[] = [
    { id: uid("tz"), name: "America/New_York", abbreviation: "EST/EDT", utcOffset: "-05:00", utcOffsetMinutes: -300, countries: ["US", "CA"], dstObserved: true },
    { id: uid("tz"), name: "America/Chicago", abbreviation: "CST/CDT", utcOffset: "-06:00", utcOffsetMinutes: -360, countries: ["US", "CA"], dstObserved: true },
    { id: uid("tz"), name: "America/Denver", abbreviation: "MST/MDT", utcOffset: "-07:00", utcOffsetMinutes: -420, countries: ["US"], dstObserved: true },
    { id: uid("tz"), name: "America/Los_Angeles", abbreviation: "PST/PDT", utcOffset: "-08:00", utcOffsetMinutes: -480, countries: ["US", "CA"], dstObserved: true },
    { id: uid("tz"), name: "Europe/London", abbreviation: "GMT/BST", utcOffset: "+00:00", utcOffsetMinutes: 0, countries: ["GB"], dstObserved: true },
    { id: uid("tz"), name: "Europe/Paris", abbreviation: "CET/CEST", utcOffset: "+01:00", utcOffsetMinutes: 60, countries: ["FR", "DE", "IT", "ES"], dstObserved: true },
    { id: uid("tz"), name: "Europe/Berlin", abbreviation: "CET/CEST", utcOffset: "+01:00", utcOffsetMinutes: 60, countries: ["DE"], dstObserved: true },
    { id: uid("tz"), name: "Europe/Rome", abbreviation: "CET/CEST", utcOffset: "+01:00", utcOffsetMinutes: 60, countries: ["IT"], dstObserved: true },
    { id: uid("tz"), name: "Europe/Madrid", abbreviation: "CET/CEST", utcOffset: "+01:00", utcOffsetMinutes: 60, countries: ["ES"], dstObserved: true },
    { id: uid("tz"), name: "America/Toronto", abbreviation: "EST/EDT", utcOffset: "-05:00", utcOffsetMinutes: -300, countries: ["CA"], dstObserved: true },
    { id: uid("tz"), name: "Australia/Sydney", abbreviation: "AEST/AEDT", utcOffset: "+10:00", utcOffsetMinutes: 600, countries: ["AU"], dstObserved: true },
    { id: uid("tz"), name: "Asia/Kolkata", abbreviation: "IST", utcOffset: "+05:30", utcOffsetMinutes: 330, countries: ["IN"], dstObserved: false },
    { id: uid("tz"), name: "Asia/Tokyo", abbreviation: "JST", utcOffset: "+09:00", utcOffsetMinutes: 540, countries: ["JP"], dstObserved: false },
    { id: uid("tz"), name: "Asia/Shanghai", abbreviation: "CST", utcOffset: "+08:00", utcOffsetMinutes: 480, countries: ["CN"], dstObserved: false },
    { id: uid("tz"), name: "America/Sao_Paulo", abbreviation: "BRT/BRST", utcOffset: "-03:00", utcOffsetMinutes: -180, countries: ["BR"], dstObserved: true },
    { id: uid("tz"), name: "Asia/Seoul", abbreviation: "KST", utcOffset: "+09:00", utcOffsetMinutes: 540, countries: ["KR"], dstObserved: false },
  ];

  /* ---- Holidays ---- */
  const holidays: Holiday[] = [
    { id: uid("hol"), name: "New Year's Day", date: "01-01", countryCode: "US", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Independence Day", date: "07-04", countryCode: "US", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Thanksgiving", date: "11-23", countryCode: "US", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Christmas Day", date: "12-25", countryCode: "US", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Christmas Day", date: "12-25", countryCode: "GB", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Boxing Day", date: "12-26", countryCode: "GB", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Tag der Deutschen Einheit", date: "10-03", countryCode: "DE", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Fête nationale", date: "07-14", countryCode: "FR", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Festa della Repubblica", date: "06-02", countryCode: "IT", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Día de la Constitución", date: "12-06", countryCode: "ES", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Canada Day", date: "07-01", countryCode: "CA", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Australia Day", date: "01-26", countryCode: "AU", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Republic Day", date: "01-26", countryCode: "IN", type: "public", recurring: true, businessClosure: true },
    { id: uid("hol"), name: "Golden Week", date: "04-29", countryCode: "JP", type: "public", recurring: true, businessClosure: true },
  ];

  /* ---- Tenants ---- */
  const tenants: Tenant[] = [
    { id: uid("tnt"), name: "ALAYA INSIDER", slug: "alaya", description: "Premium editorial shopping platform", primaryColor: "#9c7a4b", secondaryColor: "#211c15", defaultLanguage: "en", defaultCurrency: "USD", countryCode: "US", features: { multiLanguage: true, multiCurrency: true, internationalShipping: true }, settings: {}, billingPlan: "enterprise", billingEmail: "billing@alayainsider.com", isActive: true, createdAt: now - 180 * 86400000, updatedAt: now - 86400000, metadata: { region: "global" }, domains: [] },
  ];
  const tenantDomains: TenantDomain[] = [
    { id: uid("td"), domain: "alayainsider.com", type: "primary", isPrimary: true, sslEnabled: true, verified: true, dnsRecord: "A 76.76.21.21", createdAt: now - 180 * 86400000 },
    { id: uid("td"), domain: "alayainsider.co.uk", type: "country", countryCode: "GB", isPrimary: false, sslEnabled: true, verified: true, dnsRecord: "CNAME alayainsider.com", createdAt: now - 120 * 86400000 },
    { id: uid("td"), domain: "alayainsider.eu", type: "regional", isPrimary: false, sslEnabled: true, verified: false, dnsRecord: "CNAME alayainsider.com", createdAt: now - 60 * 86400000 },
    { id: uid("td"), domain: "es.alayainsider.com", type: "language", languageCode: "es", isPrimary: false, sslEnabled: true, verified: true, dnsRecord: "CNAME alayainsider.com", createdAt: now - 90 * 86400000 },
    { id: uid("td"), domain: "fr.alayainsider.com", type: "language", languageCode: "fr", isPrimary: false, sslEnabled: true, verified: true, dnsRecord: "CNAME alayainsider.com", createdAt: now - 90 * 86400000 },
  ];
  tenants[0].domains = tenantDomains;

  /* ---- Language Configs ---- */
  const languageConfigs: LanguageConfig[] = [
    { code: "en", name: "English", nativeName: "English", direction: "ltr", flag: "🇬🇧", active: true, isDefault: true, locale: "en-US", dateFormat: "MM/DD/YYYY", timeFormat: "h:mm A", firstDayOfWeek: 0, decimalSeparator: ".", thousandSeparator: "," },
    { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", flag: "🇪🇸", active: true, isDefault: false, locale: "es-ES", dateFormat: "DD/MM/YYYY", timeFormat: "H:mm", firstDayOfWeek: 1, decimalSeparator: ",", thousandSeparator: "." },
    { code: "fr", name: "French", nativeName: "Français", direction: "ltr", flag: "🇫🇷", active: true, isDefault: false, locale: "fr-FR", dateFormat: "DD/MM/YYYY", timeFormat: "HH:mm", firstDayOfWeek: 1, decimalSeparator: ",", thousandSeparator: " " },
    { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", flag: "🇩🇪", active: true, isDefault: false, locale: "de-DE", dateFormat: "DD.MM.YYYY", timeFormat: "HH:mm", firstDayOfWeek: 1, decimalSeparator: ",", thousandSeparator: "." },
    { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr", flag: "🇮🇹", active: true, isDefault: false, locale: "it-IT", dateFormat: "DD/MM/YYYY", timeFormat: "HH:mm", firstDayOfWeek: 1, decimalSeparator: ",", thousandSeparator: "." },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr", flag: "🇮🇳", active: true, isDefault: false, locale: "hi-IN", dateFormat: "DD/MM/YYYY", timeFormat: "h:mm A", firstDayOfWeek: 0, decimalSeparator: ".", thousandSeparator: "," },
    { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr", flag: "🇧🇷", active: false, isDefault: false, locale: "pt-BR", dateFormat: "DD/MM/YYYY", timeFormat: "HH:mm", firstDayOfWeek: 0, decimalSeparator: ",", thousandSeparator: "." },
    { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr", flag: "🇯🇵", active: false, isDefault: false, locale: "ja-JP", dateFormat: "YYYY/MM/DD", timeFormat: "H:mm", firstDayOfWeek: 1, decimalSeparator: ".", thousandSeparator: "," },
    { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr", flag: "🇨🇳", active: false, isDefault: false, locale: "zh-CN", dateFormat: "YYYY/MM/DD", timeFormat: "HH:mm", firstDayOfWeek: 1, decimalSeparator: ".", thousandSeparator: "," },
    { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl", flag: "🇸🇦", active: false, isDefault: false, locale: "ar-SA", dateFormat: "DD/MM/YYYY", timeFormat: "h:mm A", firstDayOfWeek: 6, decimalSeparator: ".", thousandSeparator: "," },
    { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr", flag: "🇰🇷", active: false, isDefault: false, locale: "ko-KR", dateFormat: "YYYY.MM.DD", timeFormat: "A h:mm", firstDayOfWeek: 0, decimalSeparator: ".", thousandSeparator: "," },
    { code: "nl", name: "Dutch", nativeName: "Nederlands", direction: "ltr", flag: "🇳🇱", active: false, isDefault: false, locale: "nl-NL", dateFormat: "DD-MM-YYYY", timeFormat: "HH:mm", firstDayOfWeek: 1, decimalSeparator: ",", thousandSeparator: "." },
  ];

  /* ---- Marketplace Configs ---- */
  const marketplaces: MarketplaceConfig[] = [
    { id: uid("mp"), name: "Amazon.com", countryCode: "US", platform: "amazon", marketplaceUrl: "https://www.amazon.com", sellerId: "A2L9X8K4M7N6Q", currency: "USD", language: "en", commissionPercent: 8, active: true, lastSyncedAt: now - 86400000, syncStatus: "idle", credentialsConfigured: true, createdAt: now - 120 * 86400000 },
    { id: uid("mp"), name: "Amazon.co.uk", countryCode: "GB", platform: "amazon", marketplaceUrl: "https://www.amazon.co.uk", sellerId: "B3M7K2N9P4R6S", currency: "GBP", language: "en", commissionPercent: 10, active: true, lastSyncedAt: now - 86400000, syncStatus: "idle", credentialsConfigured: true, createdAt: now - 90 * 86400000 },
    { id: uid("mp"), name: "Amazon.de", countryCode: "DE", platform: "amazon", marketplaceUrl: "https://www.amazon.de", sellerId: "C5N9L3M8K2P7Q", currency: "EUR", language: "de", commissionPercent: 9, active: true, lastSyncedAt: now - 2 * 86400000, syncStatus: "idle", credentialsConfigured: true, createdAt: now - 60 * 86400000 },
    { id: uid("mp"), name: "Amazon.fr", countryCode: "FR", platform: "amazon", marketplaceUrl: "https://www.amazon.fr", sellerId: "D7P2L4N8M5K9R", currency: "EUR", language: "fr", commissionPercent: 9, active: true, syncStatus: "idle", credentialsConfigured: false, createdAt: now - 30 * 86400000 },
    { id: uid("mp"), name: "Amazon.in", countryCode: "IN", platform: "amazon", marketplaceUrl: "https://www.amazon.in", sellerId: "E9K3M7N5P2L8S", currency: "INR", language: "en", commissionPercent: 7, active: true, syncStatus: "idle", credentialsConfigured: false, createdAt: now - 15 * 86400000 },
    { id: uid("mp"), name: "Flipkart", countryCode: "IN", platform: "flipkart", marketplaceUrl: "https://www.flipkart.com", currency: "INR", language: "hi", commissionPercent: 6, active: false, syncStatus: "idle", credentialsConfigured: false, createdAt: now - 10 * 86400000 },
    { id: uid("mp"), name: "Rakuten", countryCode: "JP", platform: "rakuten", marketplaceUrl: "https://www.rakuten.co.jp", currency: "JPY", language: "ja", commissionPercent: 12, active: false, syncStatus: "idle", credentialsConfigured: false, createdAt: now - 5 * 86400000 },
  ];

  /* ---- Affiliate Routes ---- */
  const affiliateRoutes: AffiliateRoute[] = [
    { id: uid("ar"), countryCode: "US", networkId: "impact", networkName: "Impact Radius", trackingId: "ALAYA-US-001", baseUrl: "https://alaya.impact.com", commissionRate: 8, priority: 1, active: true },
    { id: uid("ar"), countryCode: "GB", networkId: "awin", networkName: "Awin", trackingId: "ALAYA-GB-002", baseUrl: "https://alaya.awin.com", commissionRate: 10, priority: 2, active: true },
    { id: uid("ar"), countryCode: "DE", networkId: "partnerstack", networkName: "PartnerStack", trackingId: "ALAYA-DE-003", baseUrl: "https://alaya.partnerstack.com", commissionRate: 9, priority: 3, active: true },
    { id: uid("ar"), countryCode: "FR", networkId: "impact", networkName: "Impact Radius", trackingId: "ALAYA-FR-004", baseUrl: "https://alaya-fr.impact.com", commissionRate: 9, priority: 4, active: false },
    { id: uid("ar"), countryCode: "IN", networkId: "awin", networkName: "Awin", trackingId: "ALAYA-IN-005", baseUrl: "https://alaya-in.awin.com", commissionRate: 7, priority: 5, active: false },
  ];

  /* ---- Privacy Regulations ---- */
  const privacyRegulations: PrivacyRegulation[] = [
    { id: uid("pr"), name: "GDPR (Europe)", code: "gdpr", countries: ["DE", "FR", "IT", "ES", "NL", "Others"], description: "General Data Protection Regulation", requirements: ["Consent management", "Data subject rights", "Breach notification", "DPA required", "Data Protection Officer"], enabled: true, consentRequired: true, cookieConsentRequired: true, dataExportRequired: true, dataDeletionRequired: true, ageVerificationRequired: false, dpaRequired: true, ropaRequired: true, lastReviewedAt: now - 30 * 86400000, createdAt: now - 180 * 86400000 },
    { id: uid("pr"), name: "CCPA (California)", code: "ccpa", countries: ["US"], description: "California Consumer Privacy Act", requirements: ["Right to know", "Right to delete", "Right to opt-out", "Non-discrimination", "Privacy policy updates"], enabled: true, consentRequired: true, cookieConsentRequired: false, dataExportRequired: true, dataDeletionRequired: true, ageVerificationRequired: false, dpaRequired: false, ropaRequired: false, lastReviewedAt: now - 45 * 86400000, createdAt: now - 150 * 86400000 },
    { id: uid("pr"), name: "LGPD (Brazil)", code: "lgpd", countries: ["BR"], description: "Lei Geral de Proteção de Dados", requirements: ["Consent management", "Data subject rights", "Security measures", "DPO appointment"], enabled: false, consentRequired: true, cookieConsentRequired: true, dataExportRequired: true, dataDeletionRequired: true, ageVerificationRequired: false, dpaRequired: true, ropaRequired: false, createdAt: now - 60 * 86400000 },
    { id: uid("pr"), name: "PIPEDA (Canada)", code: "pipeda", countries: ["CA"], description: "Personal Information Protection and Electronic Documents Act", requirements: ["Consent", "Purpose limitation", "Data retention", "Safeguards", "Access rights"], enabled: true, consentRequired: true, cookieConsentRequired: false, dataExportRequired: true, dataDeletionRequired: true, ageVerificationRequired: false, dpaRequired: false, ropaRequired: false, lastReviewedAt: now - 60 * 86400000, createdAt: now - 120 * 86400000 },
    { id: uid("pr"), name: "UK GDPR", code: "uk_gdpr", countries: ["GB"], description: "UK General Data Protection Regulation", requirements: ["Consent management", "Data subject rights", "Breach notification", "Representative in UK"], enabled: true, consentRequired: true, cookieConsentRequired: true, dataExportRequired: true, dataDeletionRequired: true, ageVerificationRequired: false, dpaRequired: true, ropaRequired: true, lastReviewedAt: now - 20 * 86400000, createdAt: now - 90 * 86400000 },
  ];

  /* ---- Cookie Categories ---- */
  const cookieCategories: CookieCategory[] = [
    {
      id: uid("cc"), name: "Essential", description: "Required for the website to function", required: true,
      cookies: [{ name: "session_id", provider: "ALAYA", purpose: "Maintain user session", duration: "Session", type: "essential" }, { name: "csrf_token", provider: "ALAYA", purpose: "CSRF protection", duration: "Session", type: "essential" }, { name: "alaya_lang", provider: "ALAYA", purpose: "Language preference", duration: "1 year", type: "essential" }],
    },
    {
      id: uid("cc"), name: "Functional", description: "Enable enhanced functionality", required: false,
      cookies: [{ name: "alaya_theme", provider: "ALAYA", purpose: "Theme preference", duration: "1 year", type: "functional" }, { name: "alaya_currency", provider: "ALAYA", purpose: "Currency preference", duration: "1 year", type: "functional" }],
    },
    {
      id: uid("cc"), name: "Analytics", description: "Help us improve the website", required: false,
      cookies: [{ name: "_ga", provider: "Google Analytics", purpose: "Page view tracking", duration: "2 years", type: "analytics" }, { name: "_gid", provider: "Google Analytics", purpose: "Session tracking", duration: "24 hours", type: "analytics" }],
    },
    {
      id: uid("cc"), name: "Marketing", description: "Personalized advertising", required: false,
      cookies: [{ name: "_fbp", provider: "Meta", purpose: "Ad targeting", duration: "3 months", type: "marketing" }, { name: "_pin_unauth", provider: "Pinterest", purpose: "Ad targeting", duration: "1 year", type: "marketing" }],
    },
  ];

  store.countries = countries;
  store.timezones = timezones;
  store.holidays = holidays;
  store.tenants = tenants;
  store.tenantDomains = tenantDomains;
  store.languageConfigs = languageConfigs;
  store.marketplaces = marketplaces;
  store.affiliateRoutes = affiliateRoutes;
  store.privacyRegulations = privacyRegulations;
  store.cookieCategories = cookieCategories;
  saveStore(store);
  pushLog("info", "system", "Globalization Platform seeded successfully");
}

seedGlobalizationData();

/* ================================================================== */
/*  MODULE 1: GLOBAL CONFIGURATION CENTER                              */
/* ================================================================== */

export function getGlobalizationDashboard(): GlobalizationDashboardData {
  const store = getStore();
  return {
    totalCountries: store.countries.length,
    activeCountries: store.countries.filter((c) => c.active).length,
    totalLanguages: store.languageConfigs.length,
    activeLanguages: store.languageConfigs.filter((l) => l.active).length,
    totalCurrencies: [...new Set(store.countries.flatMap((c) => c.currencies))].length,
    activeCurrencies: [...new Set(store.countries.filter((c) => c.active).flatMap((c) => c.currencies))].length,
    totalTenants: store.tenants.length,
    activeTenants: store.tenants.filter((t) => t.isActive).length,
    totalMarketplaces: store.marketplaces.length,
    syncedMarketplaces: store.marketplaces.filter((m) => m.syncStatus === "idle" || m.syncStatus === "syncing").length,
    complianceScore: Math.round(store.privacyRegulations.filter((r) => r.enabled).length / Math.max(store.privacyRegulations.length, 1) * 100),
    geoDetectedToday: 42,
    translationCount: store.translationMemory.length,
    consentCount: store.consentRecords.length,
  };
}

export function getGlobalizationMetrics(): GlobalizationMetric[] {
  const dash = getGlobalizationDashboard();
  return [
    { id: uid("gm"), name: "Active Countries", category: "countries", currentValue: dash.activeCountries, previousValue: 8, unit: "", trend: "up", status: "good" },
    { id: uid("gm"), name: "Active Languages", category: "languages", currentValue: dash.activeLanguages, previousValue: 4, unit: "", trend: "up", status: "good" },
    { id: uid("gm"), name: "Active Currencies", category: "currencies", currentValue: dash.activeCurrencies, previousValue: 4, unit: "", trend: "up", status: "good" },
    { id: uid("gm"), name: "Active Marketplaces", category: "marketplaces", currentValue: dash.syncedMarketplaces, previousValue: 3, unit: "", trend: "up", status: "good" },
    { id: uid("gm"), name: "Compliance Score", category: "compliance", currentValue: dash.complianceScore, previousValue: 60, unit: "%", trend: "up", status: "good" },
    { id: uid("gm"), name: "Geo Detections (24h)", category: "traffic", currentValue: dash.geoDetectedToday, previousValue: 28, unit: "", trend: "up", status: "good" },
  ];
}

/* ---- Geo Detection ---- */

export function detectGeoLocation(ip: string): GeoLocation {
  // Simulated IP geolocation
  const store = getStore();
  const countries = store.countries;
  const ipHash = ip.split(".").reduce((s, o) => s + parseInt(o), 0);
  const countryIndex = ipHash % countries.length;
  const country = countries[countryIndex];
  const state = country.states.length > 0 ? country.states[ipHash % country.states.length] : undefined;

  return {
    ip,
    country,
    state,
    city: ["New York", "London", "Berlin", "Paris", "Mumbai", "Tokyo", "Sydney"][ipHash % 7],
    zip: country.postalCodeFormat.split(" ")[0] || "10001",
    latitude: 40.7128 + (ipHash % 100) / 100,
    longitude: -74.006 + (ipHash % 100) / 100,
    timezone: country.timezone,
    isVpn: ipHash % 10 === 0,
    isProxy: ipHash % 15 === 0,
    isCrawler: ipHash % 20 === 0,
  };
}

export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function convertToTimezone(date: Date, targetTimezone: string): Date {
  const sourceDate = new Date(date);
  // Simplified timezone conversion using offset
  const targetOffset = getTimezoneOffsetMinutes(targetTimezone);
  const sourceOffset = -sourceDate.getTimezoneOffset();
  const diffMs = (targetOffset - sourceOffset) * 60000;
  return new Date(sourceDate.getTime() + diffMs);
}

function getTimezoneOffsetMinutes(timezone: string): number {
  const store = getStore();
  const tz = store.timezones.find((t) => t.name === timezone);
  return tz?.utcOffsetMinutes ?? 0;
}

/* ================================================================== */
/*  MODULE 2: COUNTRY & REGION MANAGEMENT                              */
/* ================================================================== */

export function getCountries(): Country[] {
  return getStore().countries;
}

export function getActiveCountries(): Country[] {
  return getStore().countries.filter((c) => c.active);
}

export function getCountry(code: string): Country | undefined {
  return getStore().countries.find((c) => c.code === code || c.code3 === code);
}

export function updateCountry(code: string, patch: Partial<Country>): Country | null {
  const store = getStore();
  const idx = store.countries.findIndex((c) => c.code === code);
  if (idx === -1) return null;
  store.countries[idx] = { ...store.countries[idx], ...patch };
  saveStore(store);
  return store.countries[idx];
}

export function getStates(countryCode: string): RegionState[] {
  const country = getCountry(countryCode);
  return country?.states ?? [];
}

export function getTimezones(): Timezone[] {
  return getStore().timezones;
}

export function getHolidays(countryCode?: string): Holiday[] {
  const all = getStore().holidays;
  return countryCode ? all.filter((h) => h.countryCode === countryCode) : all;
}

/* ================================================================== */
/*  MODULE 3: MULTI-TENANCY                                            */
/* ================================================================== */

export function getTenants(): Tenant[] {
  return getStore().tenants;
}

export function getTenant(id: string): Tenant | undefined {
  return getStore().tenants.find((t) => t.id === id || t.slug === id);
}

export function createTenant(input: Omit<Tenant, "id" | "createdAt" | "updatedAt" | "domains">): Tenant {
  const store = getStore();
  const tenant: Tenant = { ...input, id: uid("tnt"), domains: [], createdAt: Date.now(), updatedAt: Date.now() };
  store.tenants.push(tenant);
  saveStore(store);
  pushLog("info", "system", `Tenant created: ${tenant.name}`);
  return tenant;
}

export function updateTenant(id: string, patch: Partial<Tenant>): Tenant | null {
  const store = getStore();
  const idx = store.tenants.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.tenants[idx] = { ...store.tenants[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.tenants[idx];
}

export function getTenantDomains(tenantId: string): TenantDomain[] {
  const store = getStore();
  const tenant = store.tenants.find((t) => t.id === tenantId);
  return tenant?.domains ?? [];
}

export function addTenantDomain(tenantId: string, input: Omit<TenantDomain, "id" | "createdAt">): TenantDomain | null {
  const store = getStore();
  const tenant = store.tenants.find((t) => t.id === tenantId);
  if (!tenant) return null;
  const domain: TenantDomain = { ...input, id: uid("td"), createdAt: Date.now() };
  tenant.domains.push(domain);
  store.tenantDomains.push(domain);
  saveStore(store);
  return domain;
}

/* ================================================================== */
/*  MODULE 4: MULTI-LANGUAGE PLATFORM                                  */
/* ================================================================== */

export function getLanguageConfigs(): LanguageConfig[] {
  return getStore().languageConfigs;
}

export function getActiveLanguages(): LanguageConfig[] {
  return getStore().languageConfigs.filter((l) => l.active);
}

export function updateLanguageConfig(code: string, patch: Partial<LanguageConfig>): LanguageConfig | null {
  const store = getStore();
  const idx = store.languageConfigs.findIndex((l) => l.code === code);
  if (idx === -1) return null;
  store.languageConfigs[idx] = { ...store.languageConfigs[idx], ...patch };
  saveStore(store);
  return store.languageConfigs[idx];
}

export function generateHreflangTags(url: string): HreflangEntry[] {
  const languages = getActiveLanguages();
  if (languages.length === 0) return [];

  return languages.map((lang) => ({
    locale: lang.locale,
    url: url.includes("?") ? `${url}&hl=${lang.code}` : `${url}?hl=${lang.code}`,
    hreflang: lang.code === "en" ? "x-default" : lang.locale,
  }));
}

export function getTranslationMemory(): TranslationMemory[] {
  return getStore().translationMemory;
}

export function addTranslation(input: Omit<TranslationMemory, "id" | "createdAt">): TranslationMemory {
  const store = getStore();
  const entry: TranslationMemory = { ...input, id: uid("tm"), createdAt: Date.now() };
  store.translationMemory.push(entry);
  saveStore(store);
  return entry;
}

export function translateText(sourceText: string, sourceLocale: string, targetLocale: string, domain: string = "general"): string {
  // AI-powered translation simulation
  const store = getStore();

  // Check translation memory first
  const cached = store.translationMemory.find(
    (t) => t.sourceText.toLowerCase() === sourceText.toLowerCase()
      && t.sourceLocale === sourceLocale
      && t.targetLocale === targetLocale
  );
  if (cached) return cached.translatedText;

  // Simulate AI translation
  const targetLang = store.languageConfigs.find((l) => l.code === targetLocale);
  const suffix = ` [${targetLang?.nativeName || targetLocale}]`;
  const translated = sourceText + suffix;

  // Cache the translation
  addTranslation({
    sourceLocale,
    targetLocale,
    sourceText,
    translatedText: translated,
    context: domain,
    domain,
    quality: 0.85,
  });

  return translated;
}

/* ================================================================== */
/*  MODULE 5: MULTI-CURRENCY PLATFORM                                   */
/* ================================================================== */

export interface CurrencyRateEntry {
  code: SupportedCurrencyCode;
  symbol: string;
  name: string;
  rate: number;
  previousRate: number;
  changePercent: number;
  updatedAt: number;
}

export function getCurrencyRates(): CurrencyRateEntry[] {
  return [
    { code: "USD", symbol: "$", name: "US Dollar", rate: 1, previousRate: 1, changePercent: 0, updatedAt: Date.now() },
    { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, previousRate: 0.91, changePercent: 1.1, updatedAt: Date.now() },
    { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, previousRate: 0.80, changePercent: -1.25, updatedAt: Date.now() },
    { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.2, previousRate: 83.0, changePercent: 0.24, updatedAt: Date.now() },
    { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.54, previousRate: 1.52, changePercent: 1.32, updatedAt: Date.now() },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.37, previousRate: 1.38, changePercent: -0.72, updatedAt: Date.now() },
    { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 149.5, previousRate: 148.2, changePercent: 0.88, updatedAt: Date.now() },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar", rate: 1.34, previousRate: 1.35, changePercent: -0.74, updatedAt: Date.now() },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.24, previousRate: 7.25, changePercent: -0.14, updatedAt: Date.now() },
    { code: "BRL", symbol: "R$", name: "Brazilian Real", rate: 5.02, previousRate: 5.10, changePercent: -1.57, updatedAt: Date.now() },
    { code: "KRW", symbol: "₩", name: "South Korean Won", rate: 1320, previousRate: 1315, changePercent: 0.38, updatedAt: Date.now() },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.88, previousRate: 0.89, changePercent: -1.12, updatedAt: Date.now() },
  ];
}

export function updateCurrencyRate(code: SupportedCurrencyCode, newRate: number): CurrencyRateEntry | null {
  const rates = getCurrencyRates();
  const idx = rates.findIndex((r) => r.code === code);
  if (idx === -1) return null;
  const prevRate = rates[idx].rate;
  rates[idx] = { ...rates[idx], rate: newRate, previousRate: prevRate, changePercent: parseFloat((((newRate - prevRate) / prevRate) * 100).toFixed(2)), updatedAt: Date.now() };
  pushLog("info", "system", `Currency ${code} rate updated: ${prevRate} → ${newRate}`);
  return rates[idx];
}

export function convertCurrencyGlobal(amount: number, from: SupportedCurrencyCode, to: SupportedCurrencyCode): number {
  if (from === to) return amount;
  const rates = getCurrencyRates();
  const fromRate = rates.find((r) => r.code === from)?.rate ?? 1;
  const toRate = rates.find((r) => r.code === to)?.rate ?? 1;
  const converted = (amount / fromRate) * toRate;
  const decimals = to === "JPY" || to === "KRW" ? 0 : 2;
  return parseFloat(converted.toFixed(decimals));
}

export function formatCurrencyGlobal(amount: number, code: SupportedCurrencyCode): string {
  const rates = getCurrencyRates();
  const currency = rates.find((r) => r.code === code);
  if (!currency) return `$${amount.toFixed(2)}`;
  const decimals = code === "JPY" || code === "KRW" ? 0 : 2;
  const formatted = amount.toFixed(decimals);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const amountStr = parts.join(".");
  return `${currency.symbol}${amountStr}`;
}

/* ================================================================== */
/*  MODULE 6: INTERNATIONAL COMMERCE                                   */
/* ================================================================== */

export function getMarketplaces(): MarketplaceConfig[] {
  return getStore().marketplaces;
}

export function getActiveMarketplaces(): MarketplaceConfig[] {
  return getStore().marketplaces.filter((m) => m.active);
}

export function updateMarketplace(id: string, patch: Partial<MarketplaceConfig>): MarketplaceConfig | null {
  const store = getStore();
  const idx = store.marketplaces.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.marketplaces[idx] = { ...store.marketplaces[idx], ...patch };
  saveStore(store);
  return store.marketplaces[idx];
}

export function syncMarketplace(id: string): MarketplaceConfig | null {
  const store = getStore();
  const idx = store.marketplaces.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.marketplaces[idx] = { ...store.marketplaces[idx], syncStatus: "syncing", lastSyncedAt: Date.now() };
  saveStore(store);
  // Simulate sync completion
  setTimeout(() => {
    const current = getStore();
    const syncIdx = current.marketplaces.findIndex((m) => m.id === id);
    if (syncIdx !== -1) {
      current.marketplaces[syncIdx].syncStatus = "idle";
      saveStore(current);
    }
  }, 2000);
  pushLog("info", "system", `Marketplace sync started: ${store.marketplaces[idx].name}`);
  return store.marketplaces[idx];
}

export function getAffiliateRoutes(): AffiliateRoute[] {
  return getStore().affiliateRoutes;
}

export function getActiveAffiliateRoutes(countryCode?: string): AffiliateRoute[] {
  const all = getStore().affiliateRoutes.filter((r) => r.active);
  return countryCode ? all.filter((r) => r.countryCode === countryCode) : all;
}

export function createAffiliateRoute(input: Omit<AffiliateRoute, "id">): AffiliateRoute {
  const store = getStore();
  const route: AffiliateRoute = { ...input, id: uid("ar") };
  store.affiliateRoutes.push(route);
  saveStore(store);
  return route;
}

export function updateAffiliateRoute(id: string, patch: Partial<AffiliateRoute>): AffiliateRoute | null {
  const store = getStore();
  const idx = store.affiliateRoutes.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.affiliateRoutes[idx] = { ...store.affiliateRoutes[idx], ...patch };
  saveStore(store);
  return store.affiliateRoutes[idx];
}

export function getRegionalAvailability(productId: string): RegionalProductAvailability[] {
  return getStore().regionalAvailability.filter((r) => r.productId === productId);
}

export function setRegionalAvailability(input: Omit<RegionalProductAvailability, "id">): RegionalProductAvailability {
  const store = getStore();
  const existing = store.regionalAvailability.findIndex(
    (r) => r.productId === input.productId && r.countryCode === input.countryCode
  );
  const entry: RegionalProductAvailability = { ...input, id: uid("ra") };
  if (existing !== -1) {
    store.regionalAvailability[existing] = entry;
  } else {
    store.regionalAvailability.push(entry);
  }
  saveStore(store);
  return entry;
}

/* ================================================================== */
/*  MODULE 7: TAX ENGINE                                               */
/* ================================================================== */

export interface GlobalTaxRule {
  id: string;
  name: string;
  countryCode: string;
  regionCode?: string;
  rate: number;
  type: "vat" | "gst" | "sales_tax" | "iva" | "consumption_tax" | "icms";
  appliesTo: ("product" | "shipping" | "digital")[];
  exemptCategories: string[];
  exemptProducts: string[];
  thresholdAmount?: number;
  active: boolean;
  priority: number;
  createdAt: number;
}

export function getGlobalTaxRules(): GlobalTaxRule[] {
  const countries = getStore().countries;
  return countries.filter((c) => c.active).map((c) => ({
    id: `tax_${c.code}`,
    name: `${c.name} ${c.taxName}`,
    countryCode: c.code,
    rate: c.taxRate,
    type: (c.taxName === "VAT" ? "vat" : c.taxName === "GST" || c.taxName === "GST/HST" ? "gst" : c.taxName === "IVA" ? "iva" : c.taxName === "Sales Tax" ? "sales_tax" : c.taxName === "Consumption Tax" ? "consumption_tax" : c.taxName === "ICMS" ? "icms" : "vat") as GlobalTaxRule["type"],
    appliesTo: ["product", "shipping"],
    exemptCategories: c.code === "US" ? ["digital"] : [],
    exemptProducts: [],
    active: true,
    priority: 10,
    createdAt: Date.now(),
  }));
}

export function getCountryTaxRate(countryCode: string, amount?: number): { rate: number; name: string; tax: number } {
  const country = getCountry(countryCode);
  if (!country) return { rate: 0, name: "No Tax", tax: 0 };
  const taxableAmount = amount ?? 0;
  return {
    rate: country.taxRate,
    name: `${country.taxName} (${(country.taxRate * 100).toFixed(1)}%)`,
    tax: parseFloat((taxableAmount * country.taxRate).toFixed(2)),
  };
}

/* ================================================================== */
/*  MODULE 8: COMPLIANCE PLATFORM                                      */
/* ================================================================== */

export function getPrivacyRegulations(): PrivacyRegulation[] {
  return getStore().privacyRegulations;
}

export function updatePrivacyRegulation(id: string, patch: Partial<PrivacyRegulation>): PrivacyRegulation | null {
  const store = getStore();
  const idx = store.privacyRegulations.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.privacyRegulations[idx] = { ...store.privacyRegulations[idx], ...patch };
  saveStore(store);
  return store.privacyRegulations[idx];
}

export function getCookieCategories(): CookieCategory[] {
  return getStore().cookieCategories;
}

export function recordConsent(visitorId: string, purpose: string, granted: boolean, ip: string, userAgent: string): ConsentRecord {
  const store = getStore();
  const record: ConsentRecord = {
    id: uid("cns"),
    visitorId, purpose, granted, timestamp: Date.now(),
    ip, userAgent,
    consentVersion: "1.0",
  };
  store.consentRecords.push(record);
  saveStore(store);
  return record;
}

export function getConsentRecords(visitorId?: string): ConsentRecord[] {
  const all = getStore().consentRecords;
  return visitorId ? all.filter((r) => r.visitorId === visitorId) : all;
}

export function getComplianceScore(): { score: number; passed: number; total: number; items: { name: string; status: "pass" | "fail" | "warning"; detail: string }[] } {
  const regulations = getPrivacyRegulations();
  const total = regulations.length;
  const passed = regulations.filter((r) => r.enabled).length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  const items = regulations.map((r) => ({
    name: r.name,
    status: (r.enabled ? "pass" : "fail") as "pass" | "fail" | "warning",
    detail: r.enabled ? `All ${r.requirements.length} requirements configured` : `${r.requirements.length} requirements pending`,
  }));
  return { score, passed, total, items };
}

/* ================================================================== */
/*  MODULE 9: TIMEZONE & BUSINESS CALENDAR                             */
/* ================================================================== */

export function getBusinessCalendar(countryCode: string, year: number = new Date().getFullYear()): { date: string; name: string; isBusinessDay: boolean }[] {
  const holidays = getHolidays(countryCode);
  const days: { date: string; name: string; isBusinessDay: boolean }[] = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const holiday = holidays.find((h) => h.date === dateStr);
      const isHoliday = !!holiday && holiday.businessClosure;

      days.push({
        date: dateStr,
        name: holiday?.name || "",
        isBusinessDay: !isWeekend && !isHoliday,
      });
    }
  }

  return days;
}

export function isBusinessDay(date: Date, countryCode: string): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const holidays = getHolidays(countryCode);
  const isHoliday = holidays.some((h) => h.date === dateStr && h.businessClosure);
  return !isWeekend && !isHoliday;
}

export function getNextBusinessDay(date: Date, countryCode: string): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (!isBusinessDay(next, countryCode)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/* ================================================================== */
/*  MODULE 10: GLOBAL REPORTS                                          */
/* ================================================================== */

export function generateGlobalReport(type: GlobalReport["type"]): GlobalReport {
  const now = Date.now();
  const store = getStore();

  switch (type) {
    case "countries":
      return {
        title: "Country & Region Report", type, generatedAt: now,
        data: {
          totalCountries: store.countries.length,
          activeCountries: store.countries.filter((c) => c.active).length,
          shippingCountries: store.countries.filter((c) => c.shippingAvailable).length,
          countries: store.countries.filter((c) => c.active).map((c) => ({
            code: c.code, name: c.name, region: c.region, taxRate: c.taxRate,
            currency: c.defaultCurrency, language: c.defaultLanguage, shipping: c.shippingAvailable,
          })),
        },
      };

    case "languages":
      return {
        title: "Language & Localization Report", type, generatedAt: now,
        data: {
          totalLanguages: store.languageConfigs.length,
          activeLanguages: store.languageConfigs.filter((l) => l.active).length,
          rtlLanguages: store.languageConfigs.filter((l) => l.direction === "rtl").length,
          inactiveLanguages: store.languageConfigs.filter((l) => !l.active).length,
          translationMemorySize: store.translationMemory.length,
          languages: store.languageConfigs.map((l) => ({ code: l.code, name: l.name, active: l.active, locale: l.locale, direction: l.direction })),
        },
      };

    case "currencies":
      return {
        title: "Currency & Exchange Report", type, generatedAt: now,
        data: { rates: getCurrencyRates() },
      };

    case "compliance":
      return {
        title: "Compliance & Privacy Report", type, generatedAt: now,
        data: {
          score: getComplianceScore(),
          totalRegulations: store.privacyRegulations.length,
          enabledRegulations: store.privacyRegulations.filter((r) => r.enabled).length,
          totalConsentRecords: store.consentRecords.length,
          cookieCategories: store.cookieCategories.length,
        },
      };

    case "marketplace":
      return {
        title: "Marketplace & Commerce Report", type, generatedAt: now,
        data: {
          totalMarketplaces: store.marketplaces.length,
          activeMarketplaces: store.marketplaces.filter((m) => m.active).length,
          byPlatform: store.marketplaces.reduce((acc, m) => {
            acc[m.platform] = (acc[m.platform] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          affiliateRoutes: store.affiliateRoutes.length,
          activeAffiliateRoutes: store.affiliateRoutes.filter((r) => r.active).length,
        },
      };

    case "traffic":
      return {
        title: "Global Traffic Report", type, generatedAt: now,
        data: {
          geoDetectedToday: 42,
          topCountries: ["US", "GB", "DE", "FR", "IN", "CA", "AU"],
          vpnDetections: 3,
          proxyDetections: 2,
          crawlerDetections: 1,
        },
      };

    default:
      return { title: "Global Report", type: "localization", generatedAt: now, data: {} };
  }
}
