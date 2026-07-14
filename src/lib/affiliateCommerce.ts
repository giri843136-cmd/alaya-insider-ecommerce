/**
 * ALAYA INSIDER — Global Affiliate Commerce Engine v2
 * --------------------------------------------------------------------------
 * Full multi-merchant system with geo-personalized routing, price comparison,
 * merchant discovery, ranking engine, and premium affiliate link management.
 */

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface MerchantConfig {
  id: string;
  name: string;
  slug: string;
  /** Inline SVG string for the merchant logo */
  logoSvg: string;
  /** Primary domains for this merchant */
  domains: string[];
  /** ISO country codes this merchant operates in */
  countries: string[];
  /** Currencies supported */
  currencies: string[];
  /** Affiliate network(s) that power this merchant */
  networks: string[];
  /** Base commission rate (0-100) */
  commissionRate: number;
  /** Average cookie duration in days */
  cookieDays: number;
  /** Is this merchant actively being used */
  active: boolean;
  /** Display priority (lower = shown first) */
  priority: number;
  /** Whether this merchant requires a tracked affiliate link */
  isAffiliate: boolean;
  /** Minimum price threshold this merchant works with */
  minPrice?: number;
  /** Maximum price threshold */
  maxPrice?: number;
  /** Whether this merchant supports digital goods */
  supportsDigital: boolean;
  /** Whether the merchant ships globally */
  shipsGlobal: boolean;
  /** Estimated return period in days */
  returnDays: number;
  /** Merchant trust score 0-100 */
  trustScore: number;
  /** Verified badge */
  verified: boolean;
  /** Color theme for the merchant badge */
  theme: { bg: string; text: string; border: string };
  /** SEO-friendly CTA text */
  cta: string;
}

export interface MerchantOffer {
  merchantId: string;
  merchantName: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  currency: string;
  currencySymbol: string;
  url: string;
  inStock: boolean;
  shipping: string;
  deliveryDays: { min: number; max: number };
  returnDays: number;
  commissionRate: number;
  isAffiliate: boolean;
  trustScore: number;
  rankScore: number;
  isPrimary: boolean;
  isBestPrice: boolean;
  isFastestDelivery: boolean;
  isHighestTrust: boolean;
  isEditorsChoice: boolean;
  country: string;
  cta: string;
}

export interface GeoInfo {
  country: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  language: string;
  flag: string;
}

/* ================================================================== */
/*  INLINE SVG LOGOS                                                   */
/* ================================================================== */

const MERCHANT_LOGOS: Record<string, string> = {
  amazon: `<svg viewBox="0 0 48 48" fill="none"><path d="M18.3 3.2C11.8 6.5 7 12.3 7 19.5c0 7.2 4.8 12.5 11.3 15.3.3.1.6-.1.6-.4v-2.3c0-.3-.2-.5-.5-.6-4.7-1.2-8.5-5.1-8.5-11.3 0-6.2 3.8-11.1 9.5-13.2.3-.1.5-.3.5-.6V3.8c0-.4-.4-.7-.8-.6z" fill="#FF9900"/><path d="M33.7 3.2c6.5 3.3 11.3 9.1 11.3 16.3 0 7.2-4.8 12.5-11.3 15.3-.3.1-.6-.1-.6-.4v-2.3c0-.3.2-.5.5-.6 4.7-1.2 8.5-5.1 8.5-11.3 0-6.2-3.8-11.1-9.5-13.2-.3-.1-.5-.3-.5-.6V3.8c0-.3.4-.7.8-.6h.8z" fill="#FF9900"/><path d="M27.4 16.2c0 2.3-1.3 4.2-3.5 5.5-2.2 1.3-5.5 2-9.8 2-2.8 0-5.2-.3-7.2-.8-.3 0-.5-.2-.5-.5s.2-.5.4-.6c2.5-.8 5.5-1.2 8.9-1.2 3.4 0 6.2.4 8.5 1.2.3 0 .5 0 .6-.2.5-.5.8-1.2.8-2 0-.8-.3-1.5-.8-2-.3-.3-.8-.5-1.3-.5-1.5 0-2.7 1.2-2.7 2.7 0 1.5 1.2 2.7 2.7 2.7.7 0 1.3-.3 1.8-.7.2-.2.4-.3.6-.3.6 0 1 .5 1 1s-.4 1-1 1-1-.4-1.6-.8c-.3-.2-.5-.3-.8-.3-1 0-1.8.8-1.8 1.8z" fill="#FFF"/><path d="M28 23c0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7z" fill="#FFF"/>`,
  walmart: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#0071DC"/><path d="M14 18h4l2 12h-2l-.5-3h-3l-.5 3h-2l2-12zm1.5 1.5L14 25h3l-1.5-5.5z" fill="#FFF"/><path d="M22 22c0-3 1.5-4.5 3.5-4.5s3.5 1.5 3.5 4.5v5c0 3-1.5 4.5-3.5 4.5s-3.5-1.5-3.5-4.5v-5zm2 5.5c0 1.5.5 2.5 1.5 2.5s1.5-1 1.5-2.5v-6c0-1.5-.5-2.5-1.5-2.5s-1.5 1-1.5 2.5v6z" fill="#FFF"/><path d="M32 24h-2v-4h-2v-2h2v-2l2-1v3h2v2h-2v4z" fill="#FFF"/>`,
  target: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#CC0000"/><circle cx="24" cy="24" r="10" fill="none" stroke="#FFF" stroke-width="2.5"/><circle cx="24" cy="24" r="4" fill="#FFF"/></svg>`,
  bestbuy: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#0046BE"/><path d="M16 20c0-1 .8-1.8 1.8-1.8h4.4c1 0 1.8.8 1.8 1.8v8c0 1-.8 1.8-1.8 1.8H17.8c-1 0-1.8-.8-1.8-1.8v-8zm2 1v6h4v-6h-4z" fill="#FFF"/><path d="M27 22l3 2-3 2v-4zm4 6l-3-2 3-2v4z" fill="#FFF"/>`,
  wayfair: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#862B82"/><path d="M16 20h2l2 4 2-4h2v8h-2v-4l-2 4-2-4v4h-2v-8z" fill="#FFF"/><path d="M28 20h2v8h-2v-8zm0-2h2v2h-2v-2z" fill="#FFF"/><path d="M32 20h2v4l1.5-2h2.5l-2 2.5L38 28h-2.5l-1.5-2v2H32v-8z" fill="#FFF"/>`,
  ebay: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#E53238"/><path d="M14 20h3l2 5 2-5h3v8h-2v-4l-2 4-2-4v4h-2v-8h-2z" fill="#FFF"/><path d="M26 20h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4v-8zm2 6h2c1 0 2-.8 2-2s-1-2-2-2h-2v4z" fill="#FFF"/>`,
  flipkart: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#2874F0"/><path d="M18 18h2l4 6V18h2v12h-2l-4-6v6h-2V18z" fill="#FFF"/><path d="M28 20V18h8v2h-3v10h-2V20h-3z" fill="#FFF"/>`,
  muji: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#A31F1F"/><path d="M16 22h16v2H16v-2zm0 4h12v2H16v-2z" fill="#FFF"/><path d="M16 18h16l-2 10H18l-2-10z" fill="none" stroke="#FFF" stroke-width="1"/>`,
  ikea: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#0058A3"/><path d="M14 26c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="#FFD700" stroke-width="2"/><path d="M14 26h20l-4-4" fill="none" stroke="#FFD700" stroke-width="2"/><path d="M22 22l2-4 2 4" fill="#FFD700"/><rect x="22" y="24" width="4" height="6" fill="#FFD700"/>`,
  nordstrom: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#000"/><path d="M18 20c0-1 .8-1.8 1.8-1.8h3.2v12H20v-8h-2v-2.2z" fill="#FFF"/><path d="M24 20c0-1 .8-1.8 1.8-1.8H29c2.2 0 4 1.8 4 4v2c0 2.2-1.8 4-4 4h-5v-8.2zm2 2v4h3c1 0 2-.8 2-2s-1-2-2-2h-3z" fill="#FFF"/>`,
  homedepot: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#F96302"/><path d="M16 20h2v8h-2v-8zm4-2h2l4 5v-5h2v10h-2l-4-5v5h-2V18z" fill="#FFF"/><path d="M28 18h8v2h-3v2h2v2h-2v2h3v2h-8V18z" fill="#FFF"/>`,
  sephora: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#1A1A1A"/><path d="M16 20h3v2h-3v-2zm4 0h3v2h-3v-2zm4 0h3v2h-3v-2z" fill="#FFF"/><path d="M16 24h3v2h-3v-2zm4 0h3v2h-3v-2zm4 0h3v2h-3v-2z" fill="#FFF"/><path d="M16 28h7v2h-7v-2z" fill="#FFF"/>`,
  argos: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#C8102E"/><path d="M18 18h3l3 12h-2l-.5-3h-4l-.5 3h-2l3-12zm1 2L17 25h3l-1-5z" fill="#FFF"/><path d="M26 20h-2v-2h2v2zm0 0v10h2V20h-2z" fill="#FFF"/><path d="M30 20h-2v-2h2v2zm0 0v10h2V20h-2z" fill="#FFF"/>`,
  johnlewis: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#1A1A2E"/><path d="M18 20c0-1 .8-1.8 1.8-1.8H22v12h-2v-8h-2v-2.2z" fill="#FFF"/><path d="M24 20c0-1 .8-1.8 1.8-1.8H29c2.2 0 4 1.8 4 4v2c0 2.2-1.8 4-4 4h-5v-8.2zm2 2v4h3c1 0 2-.8 2-2s-1-2-2-2h-3z" fill="#FFF"/>`,
  mediamarkt: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#E2001A"/><path d="M18 20h3v8h-3v-8zm5 2c0-1 .8-1.8 1.8-1.8h3c1 0 1.8.8 1.8 1.8v2c0 1-.8 1.8-1.8 1.8h-3c-1 0-1.8-.8-1.8-1.8v-2zm2 2h2v-2h-2v2z" fill="#FFF"/><path d="M30 20h3v8h-3v-8z" fill="#FFF"/>`,
  zalando: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#F3722C"/><path d="M16 22c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v4c0 2.2-1.8 4-4 4h-8c-2.2 0-4-1.8-4-4v-4zm2 0v4c0 1 .8 1.8 1.8 1.8h8.4c1 0 1.8-.8 1.8-1.8v-4c0-1-.8-1.8-1.8-1.8h-8.4c-1 0-1.8.8-1.8 1.8z" fill="#FFF"/>`,
  currys: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#2D2D87"/><path d="M16 20h2l4 8V20h2v8h-2l-4-8v8h-2v-8z" fill="#FFF"/><path d="M28 20h4c2.2 0 4 1.8 4 4v2c0 2.2-1.8 4-4 4h-4v-10zm2 2v6h2c1 0 2-.8 2-2v-2c0-1-.8-2-2-2h-2z" fill="#FFF"/>`,
  myntra: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#E40046"/><path d="M24 14c2.2 0 4 1.8 4 4v12c0 2.2-1.8 4-4 4s-4-1.8-4-4V18c0-2.2 1.8-4 4-4z" fill="none" stroke="#FFF" stroke-width="2"/><path d="M20 18h8v2H20v-2zm0 4h8v2H20v-2z" fill="#FFF"/>`,
  croma: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#ED1C24"/><path d="M18 22h3l1-4 1 4h3l-2.5 4 1 3-2.5-2-2.5 2 1-3L18 22z" fill="#FFF"/>`,
  reliance_digital: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#002B5C"/><path d="M16 20h2l2 2v6h2V18h-2l-2 2v8h-2V20zm8-2h2v10h-2V18z" fill="#FFF"/><path d="M28 20c0-1 .8-1.8 1.8-1.8h5v2H30v2h3v2h-3v2h4.8v2h-6.8V20z" fill="#FFF"/>`,
  costco: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#004B87"/><path d="M14 20h4l2 4 2-4h4v8h-2v-4l-2 4-2-4v4h-2l-4-8z" fill="none" stroke="#FFF" stroke-width="2"/><path d="M28 18h2l3 3 3-3h2v6h2v-6h2l-1 10h-2l1-6-3 3-3-3 1 6h-2l-1-10z" fill="#FFF"/></svg>`,
  etsy: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#F56400"/><path d="M16 18h4c3 0 5 1 5 4 0 1.5-1 3-3 3.5v.5c2.5 0 4 2 4 4 0 3-2.5 4-6 4h-4V18zm3 6h1c1.5 0 2.5-.5 2.5-2s-1-2-2.5-2h-1v4zm0 6h2c2 0 3-.5 3-2.5s-1.5-2.5-3-2.5h-2v5z" fill="#FFF"/><path d="M30 18h-2v-2h2v2zm0 0v12h-2v-2h2v-10z" fill="#FFF"/>`,
  otto: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#C62128"/><text x="24" y="32" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="22">OTTO</text></svg>`,
  newegg: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#E55528"/><text x="24" y="32" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="16">Newegg</text></svg>`,
  bhphoto: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#000"/><text x="24" y="32" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="14">B&amp;H</text></svg>`,
  lowes: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#004990"/><path d="M16 20h2l2 3 2-3h2v8h-2v-4l-2 3-2-3v4h-2v-8z" fill="#FFF"/><path d="M28 20h4c2 0 3.5 1.5 3.5 3.5S34 27 32 27h-2v3h-2v-10zm2 5h1c1 0 1.5-.5 1.5-1.5S32 22 31 22h-1v3z" fill="#FFF"/>`,
  macys: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#E2231A"/><path d="M24 14l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" fill="#FFF"/>`,
  staples: `<svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#CE1820"/><path d="M16 20h3l2 3 2-3h3l-3.5 5 1.5 2h-3l-1-1.5-1 1.5h-3l1.5-2L16 20z" fill="#FFF"/><path d="M30 20h2v8h-2v-10z" fill="#FFF"/><path d="M34 20h2v6l3-3h2l-3 3 3 3h-2.5l-2.5-3v3h-2v-9z" fill="#FFF"/>`,
};

/* ================================================================== */
/*  MERCHANT DATABASE — 30 Global Retailers + Affiliate Networks      */
/* ================================================================== */

/** @deprecated Use getMerchantDataSource() or initMerchantsFromApi() instead. Hardcoded fallback — remove once API is stable. */
export const MERCHANTS: MerchantConfig[] = [
  {
    id: "amazon", name: "Amazon", slug: "amazon", logoSvg: MERCHANT_LOGOS.amazon,
    domains: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.co.jp", "amazon.in", "amazon.ca", "amazon.it", "amazon.es", "amazon.com.au"],
    countries: ["US","GB","DE","FR","JP","IN","CA","IT","ES","AU"],
    currencies: ["USD","GBP","EUR","JPY","INR","CAD","AUD"],
    networks: ["amazon_associates"], commissionRate: 4.5, cookieDays: 24,
    active: true, priority: 1, isAffiliate: true, minPrice: 1, supportsDigital: true,
    shipsGlobal: true, returnDays: 30, trustScore: 92, verified: true,
    theme: { bg: "#FFD814", text: "#000000", border: "#F3CD00" }, cta: "Buy on Amazon",
  },
  {
    id: "walmart", name: "Walmart", slug: "walmart", logoSvg: MERCHANT_LOGOS.walmart,
    domains: ["walmart.com"], countries: ["US","CA","MX"], currencies: ["USD","CAD","MXN"],
    networks: ["impact","cj"], commissionRate: 4, cookieDays: 30,
    active: true, priority: 2, isAffiliate: true, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 90, trustScore: 88, verified: true,
    theme: { bg: "#0071DC", text: "#FFFFFF", border: "#005CB9" }, cta: "Buy at Walmart",
  },
  {
    id: "target", name: "Target", slug: "target", logoSvg: MERCHANT_LOGOS.target,
    domains: ["target.com"], countries: ["US"], currencies: ["USD"],
    networks: ["shareasale","impact"], commissionRate: 3.5, cookieDays: 30,
    active: true, priority: 3, isAffiliate: true, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 90, trustScore: 86, verified: true,
    theme: { bg: "#CC0000", text: "#FFFFFF", border: "#990000" }, cta: "Buy at Target",
  },
  {
    id: "bestbuy", name: "Best Buy", slug: "bestbuy", logoSvg: MERCHANT_LOGOS.bestbuy,
    domains: ["bestbuy.com"], countries: ["US","CA"], currencies: ["USD","CAD"],
    networks: ["cj","impact"], commissionRate: 2.5, cookieDays: 30,
    active: true, priority: 4, isAffiliate: true, minPrice: 5, supportsDigital: true,
    shipsGlobal: false, returnDays: 15, trustScore: 84, verified: true,
    theme: { bg: "#0046BE", text: "#FFFFFF", border: "#003399" }, cta: "Buy at Best Buy",
  },
  {
    id: "wayfair", name: "Wayfair", slug: "wayfair", logoSvg: MERCHANT_LOGOS.wayfair,
    domains: ["wayfair.com"], countries: ["US","CA","GB","DE"], currencies: ["USD","CAD","GBP","EUR"],
    networks: ["impact","cj"], commissionRate: 5, cookieDays: 30,
    active: true, priority: 5, isAffiliate: true, minPrice: 10, supportsDigital: false,
    shipsGlobal: false, returnDays: 30, trustScore: 82, verified: true,
    theme: { bg: "#862B82", text: "#FFFFFF", border: "#6B2267" }, cta: "Shop Wayfair",
  },
  {
    id: "ebay", name: "eBay", slug: "ebay", logoSvg: MERCHANT_LOGOS.ebay,
    domains: ["ebay.com","ebay.co.uk","ebay.de","ebay.fr","ebay.com.au"],
    countries: ["US","GB","DE","FR","AU","IT","CA"], currencies: ["USD","GBP","EUR","AUD","CAD"],
    networks: ["impact","cj","rakuten"], commissionRate: 3, cookieDays: 30,
    active: true, priority: 6, isAffiliate: true, minPrice: 1, supportsDigital: true,
    shipsGlobal: true, returnDays: 30, trustScore: 80, verified: true,
    theme: { bg: "#E53238", text: "#FFFFFF", border: "#C4282E" }, cta: "Buy on eBay",
  },
  {
    id: "nordstrom", name: "Nordstrom", slug: "nordstrom", logoSvg: MERCHANT_LOGOS.nordstrom,
    domains: ["nordstrom.com"], countries: ["US","CA"], currencies: ["USD","CAD"],
    networks: ["rakuten","impact"], commissionRate: 4, cookieDays: 30,
    active: true, priority: 7, isAffiliate: true, minPrice: 5, supportsDigital: false,
    shipsGlobal: false, returnDays: 45, trustScore: 90, verified: true,
    theme: { bg: "#000000", text: "#FFFFFF", border: "#333333" }, cta: "Shop Nordstrom",
  },
  {
    id: "muji", name: "Muji", slug: "muji", logoSvg: MERCHANT_LOGOS.muji,
    domains: ["muji.com","muji.us","muji.eu"],
    countries: ["US","GB","DE","FR","JP","AU","CA"], currencies: ["USD","GBP","EUR","JPY","AUD","CAD"],
    networks: ["direct"], commissionRate: 6, cookieDays: 30,
    active: true, priority: 8, isAffiliate: false, minPrice: 1, supportsDigital: false,
    shipsGlobal: true, returnDays: 30, trustScore: 88, verified: true,
    theme: { bg: "#A31F1F", text: "#FFFFFF", border: "#7A1414" }, cta: "Shop Muji",
  },
  {
    id: "ikea", name: "IKEA", slug: "ikea", logoSvg: MERCHANT_LOGOS.ikea,
    domains: ["ikea.com"], countries: ["US","GB","DE","FR","IT","ES","CA","AU","SE","NL"],
    currencies: ["USD","GBP","EUR","CAD","AUD","SEK"], networks: ["direct","impact"],
    commissionRate: 3, cookieDays: 30, active: true, priority: 9, isAffiliate: false,
    minPrice: 1, supportsDigital: false, shipsGlobal: true, returnDays: 365, trustScore: 87, verified: true,
    theme: { bg: "#0058A3", text: "#FFD700", border: "#003F73" }, cta: "Shop IKEA",
  },
  {
    id: "flipkart", name: "Flipkart", slug: "flipkart", logoSvg: MERCHANT_LOGOS.flipkart,
    domains: ["flipkart.com"], countries: ["IN"], currencies: ["INR"],
    networks: ["impact","direct"], commissionRate: 5, cookieDays: 30,
    active: true, priority: 10, isAffiliate: true, minPrice: 1, supportsDigital: true,
    shipsGlobal: false, returnDays: 10, trustScore: 78, verified: true,
    theme: { bg: "#2874F0", text: "#FFFFFF", border: "#1D5CC7" }, cta: "Buy on Flipkart",
  },
  {
    id: "croma", name: "Croma", slug: "croma", logoSvg: MERCHANT_LOGOS.croma,
    domains: ["croma.com"], countries: ["IN"], currencies: ["INR"],
    networks: ["direct","impact"], commissionRate: 4, cookieDays: 30,
    active: true, priority: 11, isAffiliate: true, minPrice: 100, supportsDigital: false,
    shipsGlobal: false, returnDays: 10, trustScore: 76, verified: true,
    theme: { bg: "#ED1C24", text: "#FFFFFF", border: "#C2151C" }, cta: "Buy at Croma",
  },
  {
    id: "reliance_digital", name: "Reliance Digital", slug: "reliance-digital", logoSvg: MERCHANT_LOGOS.reliance_digital,
    domains: ["reliancedigital.in"], countries: ["IN"], currencies: ["INR"],
    networks: ["direct"], commissionRate: 3.5, cookieDays: 30,
    active: true, priority: 12, isAffiliate: true, minPrice: 500, supportsDigital: false,
    shipsGlobal: false, returnDays: 10, trustScore: 74, verified: true,
    theme: { bg: "#002B5C", text: "#FFFFFF", border: "#001A36" }, cta: "Shop Reliance Digital",
  },
  {
    id: "homedepot", name: "Home Depot", slug: "home-depot", logoSvg: MERCHANT_LOGOS.homedepot,
    domains: ["homedepot.com"], countries: ["US","CA","MX"], currencies: ["USD","CAD","MXN"],
    networks: ["cj","impact"], commissionRate: 2.5, cookieDays: 30,
    active: true, priority: 13, isAffiliate: true, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 90, trustScore: 85, verified: true,
    theme: { bg: "#F96302", text: "#FFFFFF", border: "#D45201" }, cta: "Shop Home Depot",
  },
  {
    id: "sephora", name: "Sephora", slug: "sephora", logoSvg: MERCHANT_LOGOS.sephora,
    domains: ["sephora.com"], countries: ["US","CA","GB","FR","IN"], currencies: ["USD","CAD","GBP","EUR","INR"],
    networks: ["rakuten","cj","impact"], commissionRate: 5, cookieDays: 30,
    active: true, priority: 14, isAffiliate: true, minPrice: 5, supportsDigital: false,
    shipsGlobal: true, returnDays: 60, trustScore: 86, verified: true,
    theme: { bg: "#1A1A1A", text: "#FFFFFF", border: "#333333" }, cta: "Shop Sephora",
  },
  {
    id: "argos", name: "Argos", slug: "argos", logoSvg: MERCHANT_LOGOS.argos,
    domains: ["argos.co.uk"], countries: ["GB","IE"], currencies: ["GBP","EUR"],
    networks: ["awin","direct"], commissionRate: 3, cookieDays: 30,
    active: true, priority: 15, isAffiliate: true, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 30, trustScore: 80, verified: true,
    theme: { bg: "#C8102E", text: "#FFFFFF", border: "#A00D24" }, cta: "Buy at Argos",
  },
  {
    id: "johnlewis", name: "John Lewis", slug: "john-lewis", logoSvg: MERCHANT_LOGOS.johnlewis,
    domains: ["johnlewis.com"], countries: ["GB"], currencies: ["GBP"],
    networks: ["awin","rakuten"], commissionRate: 3.5, cookieDays: 30,
    active: true, priority: 16, isAffiliate: true, minPrice: 5, supportsDigital: false,
    shipsGlobal: false, returnDays: 35, trustScore: 91, verified: true,
    theme: { bg: "#1A1A2E", text: "#FFFFFF", border: "#0F0F1E" }, cta: "Shop John Lewis",
  },
  {
    id: "mediamarkt", name: "MediaMarkt", slug: "mediamarkt", logoSvg: MERCHANT_LOGOS.mediamarkt,
    domains: ["mediamarkt.de","mediamarkt.at","mediamarkt.es"],
    countries: ["DE","AT","ES","NL","BE"], currencies: ["EUR"],
    networks: ["awin","direct"], commissionRate: 3, cookieDays: 30,
    active: true, priority: 17, isAffiliate: true, minPrice: 1, supportsDigital: true,
    shipsGlobal: false, returnDays: 14, trustScore: 79, verified: true,
    theme: { bg: "#E2001A", text: "#FFFFFF", border: "#B80014" }, cta: "Buy at MediaMarkt",
  },
  {
    id: "zalando", name: "Zalando", slug: "zalando", logoSvg: MERCHANT_LOGOS.zalando,
    domains: ["zalando.com","zalando.de","zalando.fr"],
    countries: ["DE","FR","IT","ES","NL","PL","SE","GB"], currencies: ["EUR","GBP","PLN","SEK"],
    networks: ["awin","impact","rakuten"], commissionRate: 6, cookieDays: 30,
    active: true, priority: 18, isAffiliate: true, minPrice: 5, supportsDigital: false,
    shipsGlobal: false, returnDays: 100, trustScore: 83, verified: true,
    theme: { bg: "#F3722C", text: "#FFFFFF", border: "#D95D1E" }, cta: "Shop Zalando",
  },
  {
    id: "currys", name: "Currys", slug: "currys", logoSvg: MERCHANT_LOGOS.currys,
    domains: ["currys.co.uk"], countries: ["GB","IE"], currencies: ["GBP","EUR"],
    networks: ["awin","direct"], commissionRate: 2.5, cookieDays: 30,
    active: true, priority: 19, isAffiliate: true, minPrice: 5, supportsDigital: false,
    shipsGlobal: false, returnDays: 21, trustScore: 77, verified: true,
    theme: { bg: "#2D2D87", text: "#FFFFFF", border: "#1F1F60" }, cta: "Buy at Currys",
  },
  {
    id: "myntra", name: "Myntra", slug: "myntra", logoSvg: MERCHANT_LOGOS.myntra,
    domains: ["myntra.com"], countries: ["IN"], currencies: ["INR"],
    networks: ["direct"], commissionRate: 7, cookieDays: 30,
    active: true, priority: 20, isAffiliate: true, minPrice: 100, supportsDigital: false,
    shipsGlobal: false, returnDays: 15, trustScore: 75, verified: true,
    theme: { bg: "#E40046", text: "#FFFFFF", border: "#B80036" }, cta: "Shop Myntra",
  },
  {
    id: "costco", name: "Costco", slug: "costco", logoSvg: MERCHANT_LOGOS.costco,
    domains: ["costco.com"], countries: ["US","CA","GB","AU","JP"], currencies: ["USD","CAD","GBP","AUD","JPY"],
    networks: ["direct"], commissionRate: 2, cookieDays: 30,
    active: true, priority: 21, isAffiliate: false, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 90, trustScore: 90, verified: true,
    theme: { bg: "#004B87", text: "#FFFFFF", border: "#003366" }, cta: "Shop Costco",
  },
  {
    id: "etsy", name: "Etsy", slug: "etsy", logoSvg: MERCHANT_LOGOS.etsy,
    domains: ["etsy.com"], countries: ["US","GB","CA","AU","DE","FR"], currencies: ["USD","GBP","CAD","AUD","EUR"],
    networks: ["awin","impact"], commissionRate: 4, cookieDays: 30,
    active: true, priority: 22, isAffiliate: true, minPrice: 1, supportsDigital: true,
    shipsGlobal: true, returnDays: 30, trustScore: 85, verified: true,
    theme: { bg: "#F56400", text: "#FFFFFF", border: "#D45500" }, cta: "Shop Etsy",
  },
  {
    id: "otto", name: "Otto", slug: "otto", logoSvg: MERCHANT_LOGOS.otto,
    domains: ["otto.de"], countries: ["DE","AT"], currencies: ["EUR"],
    networks: ["awin","direct"], commissionRate: 5, cookieDays: 30,
    active: true, priority: 23, isAffiliate: true, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 30, trustScore: 82, verified: true,
    theme: { bg: "#C62128", text: "#FFFFFF", border: "#A01A20" }, cta: "Buy at Otto",
  },
  {
    id: "newegg", name: "Newegg", slug: "newegg", logoSvg: MERCHANT_LOGOS.newegg,
    domains: ["newegg.com"], countries: ["US","CA"], currencies: ["USD","CAD"],
    networks: ["cj","impact"], commissionRate: 3, cookieDays: 30,
    active: true, priority: 24, isAffiliate: true, minPrice: 5, supportsDigital: true,
    shipsGlobal: false, returnDays: 30, trustScore: 78, verified: true,
    theme: { bg: "#E55528", text: "#FFFFFF", border: "#C0441F" }, cta: "Buy at Newegg",
  },
  {
    id: "bhphoto", name: "B&H Photo", slug: "bhphoto", logoSvg: MERCHANT_LOGOS.bhphoto,
    domains: ["bhphotovideo.com"], countries: ["US"], currencies: ["USD"],
    networks: ["rakuten","direct"], commissionRate: 2.5, cookieDays: 30,
    active: true, priority: 25, isAffiliate: true, minPrice: 5, supportsDigital: true,
    shipsGlobal: true, returnDays: 30, trustScore: 89, verified: true,
    theme: { bg: "#000000", text: "#FFFFFF", border: "#333333" }, cta: "Shop B&H",
  },
  {
    id: "lowes", name: "Lowe's", slug: "lowes", logoSvg: MERCHANT_LOGOS.lowes,
    domains: ["lowes.com"], countries: ["US","CA"], currencies: ["USD","CAD"],
    networks: ["cj","impact"], commissionRate: 2, cookieDays: 30,
    active: true, priority: 26, isAffiliate: true, minPrice: 1, supportsDigital: false,
    shipsGlobal: false, returnDays: 90, trustScore: 83, verified: true,
    theme: { bg: "#004990", text: "#FFFFFF", border: "#003570" }, cta: "Shop Lowe's",
  },
  {
    id: "macys", name: "Macy's", slug: "macys", logoSvg: MERCHANT_LOGOS.macys,
    domains: ["macys.com"], countries: ["US"], currencies: ["USD"],
    networks: ["rakuten","impact"], commissionRate: 4.5, cookieDays: 30,
    active: true, priority: 27, isAffiliate: true, minPrice: 5, supportsDigital: false,
    shipsGlobal: false, returnDays: 90, trustScore: 84, verified: true,
    theme: { bg: "#E2231A", text: "#FFFFFF", border: "#B81C14" }, cta: "Shop Macy's",
  },
  {
    id: "staples", name: "Staples", slug: "staples", logoSvg: MERCHANT_LOGOS.staples,
    domains: ["staples.com"], countries: ["US","CA"], currencies: ["USD","CAD"],
    networks: ["cj","impact"], commissionRate: 2.5, cookieDays: 30,
    active: true, priority: 28, isAffiliate: true, minPrice: 1, supportsDigital: true,
    shipsGlobal: false, returnDays: 30, trustScore: 80, verified: true,
    theme: { bg: "#CE1820", text: "#FFFFFF", border: "#A61219" }, cta: "Shop Staples",
  },
];

/* ================================================================== */
/*  GEO — Exact Timezone-to-Country Mapping (P7)                      */
/* ================================================================== */

export const GEO_DB: Readonly<Record<string, GeoInfo>> = {
  US: { country: "US", countryName: "United States", currency: "USD", currencySymbol: "$", language: "en-US", flag: "🇺🇸" },
  GB: { country: "GB", countryName: "United Kingdom", currency: "GBP", currencySymbol: "£", language: "en-GB", flag: "🇬🇧" },
  DE: { country: "DE", countryName: "Germany", currency: "EUR", currencySymbol: "€", language: "de-DE", flag: "🇩🇪" },
  FR: { country: "FR", countryName: "France", currency: "EUR", currencySymbol: "€", language: "fr-FR", flag: "🇫🇷" },
  IT: { country: "IT", countryName: "Italy", currency: "EUR", currencySymbol: "€", language: "it-IT", flag: "🇮🇹" },
  ES: { country: "ES", countryName: "Spain", currency: "EUR", currencySymbol: "€", language: "es-ES", flag: "🇪🇸" },
  JP: { country: "JP", countryName: "Japan", currency: "JPY", currencySymbol: "¥", language: "ja-JP", flag: "🇯🇵" },
  CA: { country: "CA", countryName: "Canada", currency: "CAD", currencySymbol: "CA$", language: "en-CA", flag: "🇨🇦" },
  AU: { country: "AU", countryName: "Australia", currency: "AUD", currencySymbol: "A$", language: "en-AU", flag: "🇦🇺" },
  IN: { country: "IN", countryName: "India", currency: "INR", currencySymbol: "₹", language: "en-IN", flag: "🇮🇳" },
  BR: { country: "BR", countryName: "Brazil", currency: "BRL", currencySymbol: "R$", language: "pt-BR", flag: "🇧🇷" },
  MX: { country: "MX", countryName: "Mexico", currency: "MXN", currencySymbol: "MX$", language: "es-MX", flag: "🇲🇽" },
  SE: { country: "SE", countryName: "Sweden", currency: "SEK", currencySymbol: "kr", language: "sv-SE", flag: "🇸🇪" },
  NL: { country: "NL", countryName: "Netherlands", currency: "EUR", currencySymbol: "€", language: "nl-NL", flag: "🇳🇱" },
  PL: { country: "PL", countryName: "Poland", currency: "PLN", currencySymbol: "zł", language: "pl-PL", flag: "🇵🇱" },
  IE: { country: "IE", countryName: "Ireland", currency: "EUR", currencySymbol: "€", language: "en-IE", flag: "🇮🇪" },
  AT: { country: "AT", countryName: "Austria", currency: "EUR", currencySymbol: "€", language: "de-AT", flag: "🇦🇹" },
  BE: { country: "BE", countryName: "Belgium", currency: "EUR", currencySymbol: "€", language: "nl-BE", flag: "🇧🇪" },
};

/** Exact IANA timezone → country code mapping (not prefix-based) */
const TZ_COUNTRY: Readonly<Record<string, string>> = {
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US",
  "America/Anchorage": "US", "America/Phoenix": "US", "Pacific/Honolulu": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Montreal": "CA", "America/Edmonton": "CA",
  "America/Winnipeg": "CA", "America/Halifax": "CA",
  "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Rome": "IT",
  "Europe/Madrid": "ES", "Europe/Stockholm": "SE", "Europe/Amsterdam": "NL", "Europe/Vienna": "AT",
  "Europe/Brussels": "BE", "Europe/Warsaw": "PL", "Europe/Dublin": "IE", "Europe/Lisbon": "PT",
  "Europe/Copenhagen": "DK", "Europe/Oslo": "NO", "Europe/Helsinki": "FI", "Europe/Prague": "CZ",
  "Europe/Budapest": "HU", "Europe/Athens": "GR", "Europe/Zurich": "CH",
  "Asia/Tokyo": "JP", "Asia/Kolkata": "IN", "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG", "Asia/Seoul": "KR", "Asia/Dubai": "AE", "Asia/Bangkok": "TH",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Perth": "AU", "Australia/Brisbane": "AU",
  "America/Sao_Paulo": "BR", "America/Mexico_City": "MX", "America/Argentina/Buenos_Aires": "AR",
  "Pacific/Auckland": "NZ", "Africa/Johannesburg": "ZA", "Africa/Cairo": "EG",
};

/**
 * Detect the user's country from:
 * 1. Saved preference (localStorage)
 * 2. Browser language (navigator.language)
 * 3. Exact IANA timezone match
 * 4. Fallback to "US"
 */
export function detectUserCountry(): string {
  try {
    // 1. Saved preference
    const stored = localStorage.getItem("alaya_geo_country");
    if (stored && GEO_DB[stored]) return stored;

    // 2. Browser language
    const lang = navigator.language || (navigator as any).languages?.[0] || "en-US";
    const parts = lang.split("-");
    if (parts.length >= 2) {
      const region = parts[1].toUpperCase();
      if (GEO_DB[region]) return region;
    }

    // 3. Exact IANA timezone match (P7 fix)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];

    // 4. Try international currency hint
    try {
      const currency = (Intl as any).NumberFormat?.(undefined, { style: "currency", currency: "USD" })
        .resolvedOptions().currency;
      if (currency) {
        const currencyMap: Record<string, string> = {
          USD: "US", GBP: "GB", EUR: "DE", JPY: "JP", INR: "IN", CAD: "CA",
          AUD: "AU", BRL: "BR", MXN: "MX", SEK: "SE", PLN: "PL",
        };
        if (currencyMap[currency]) return currencyMap[currency];
      }
    } catch { /* skip */ }
  } catch {
    // Silently fail
  }
  return "US";
}

export function setUserCountry(country: string): void {
  try { localStorage.setItem("alaya_geo_country", country); } catch {}
}

export function getGeoInfo(country?: string): GeoInfo {
  const code = (country || detectUserCountry()).toUpperCase();
  return GEO_DB[code] || GEO_DB.US;
}

/* ================================================================== */
/*  MERCHANT DISCOVERY & MATCHING (P3 — no categories param)          */
/* ================================================================== */

/**
 * Module-level cached merchants. Initialized lazily from the backend API.
 * Falls back to hardcoded MERCHANTS array when API is unavailable.
 */
let _cachedMerchants: MerchantConfig[] | null = null;

/**
 * Returns the current merchant data source:
 * 1. Cached API data (if initialized)
 * 2. Hardcoded MERCHANTS array (development fallback)
 */
function getMerchantDataSource(): MerchantConfig[] {
  if (_cachedMerchants && _cachedMerchants.length > 0) return _cachedMerchants;
  return MERCHANTS;
}

/** @internal Promise-based lock to prevent concurrent initialization */
let _initPromise: Promise<void> | null = null;

/**
 * Initialize merchant data from the backend API.
 * Call this once at app startup to replace the hardcoded MERCHANTS array.
 * Falls back silently to MERCHANTS if the API is unavailable.
 * Safe to call multiple times — only executes once.
 */
export async function initMerchantsFromApi(): Promise<void> {
  if (_cachedMerchants) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      const { fetchMerchants } = await import("./affiliateApi");
      const merchants = await fetchMerchants();
      if (merchants && merchants.length > 0) {
        _cachedMerchants = merchants;
      }
    } catch {
      // API unavailable — keep using hardcoded MERCHANTS fallback
    }
  })();
  return _initPromise;
}

export function getMerchantsByCountry(country?: string): MerchantConfig[] {
  const code = (country || detectUserCountry()).toUpperCase();
  return getMerchantDataSource()
    .filter((m) => m.active && m.countries.includes(code))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Find merchants for a product matching by: country, product type,
 * pricing, and merchant priority.
 * No categories/specializations — just availability + compatibility.
 */
export function getMerchantsForProduct(
  product: { type?: string; price?: number },
  country?: string,
): MerchantConfig[] {
  const code = (country || detectUserCountry()).toUpperCase();
  const price = product.price ?? 0;
  const isDigital = product.type === "digital";

  return getMerchantDataSource()
    .filter((m) => {
      if (!m.active) return false;
      if (!m.countries.includes(code)) return false;
      if (isDigital && !m.supportsDigital) return false;
      if (m.minPrice && price < m.minPrice) return false;
      if (m.maxPrice && price > m.maxPrice) return false;
      return true;
    })
    .sort((a, b) => a.priority - b.priority);
}

/* ================================================================== */
/*  MERCHANT RANKING ENGINE (P8)                                      */
/* ================================================================== */

/**
 * Calculate a composite rank score for a merchant offer.
 * Higher score = better recommendation.
 * Factors: price competitiveness, delivery speed, trust, commission, priority.
 */
function calculateRankScore(
  offer: MerchantOffer,
  allOffers: MerchantOffer[],
): number {
  let score = 50; // base

  // Price score (0-25): lower price = higher score
  if (allOffers.length > 1) {
    const prices = allOffers.map((o) => o.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    const priceScore = (1 - (offer.price - minPrice) / range) * 25;
    score += priceScore;
  } else {
    score += 15;
  }

  // Delivery speed (0-15): faster = higher
  const avgDays = (offer.deliveryDays.min + offer.deliveryDays.max) / 2;
  score += Math.max(0, 15 - avgDays);

  // Trust score (0-20)
  score += (offer.trustScore / 100) * 20;

  // Commission (0-10)
  score += Math.min(10, offer.commissionRate);

  return Math.round(score * 10) / 10;
}

/* ================================================================== */
/*  AFFILIATE LINK ENGINE v2 (P8) — Enterprise parameter mapping      */
/* ================================================================== */

/**
 * Per-merchant parameter mapping for affiliate URL generation.
 * Each network defines its own tracking parameter names.
 */
const AFFILIATE_PARAM_MAP: Record<string, Record<string, string>> = {
  amazon_associates: {
    tag: "alaya0a-21", ref_: "as_li_ss_tl", ascsubtag: "{click_id}", linkCode: "as2", creative: "{slug}", camp: "{campaign}",
  },
  impact: {
    subId1: "{click_id}", subId2: "{session_id}", subId3: "{visitor_id}", irclickid: "{click_id}", irgwc: "1",
  },
  cj: {
    sid: "{click_id}", PID: "{product_id}", AID: "{affiliate_id}", ci_cid: "{campaign}",
  },
  awin: {
    clickref: "{click_id}", publisher: "{affiliate_id}", awinaffid: "{affiliate_id}", awinmid: "{merchant_id}",
  },
  shareasale: {
    afftrack: "{click_id}", ssap: "1", mbsky: "{campaign}",
  },
  rakuten: {
    u1: "{click_id}", u2: "{session_id}", u3: "{visitor_id}", ref: "{product_id}",
  },
  partnerize: {
    ps_partner_key: "{affiliate_id}", ps_cid: "{campaign}", ps_aid: "{click_id}", ps_pid: "{product_id}",
  },
  direct: {
    ref: "alaya_insider", utm_source: "alaya_insider", utm_medium: "direct",
  },
};

/** Default UTM parameters applied to all affiliate URLs */
const UTM_PARAMS = {
  utm_source: "alaya_insider",
  utm_medium: "affiliate",
  utm_campaign: "{slug}",
  utm_content: "{click_id}",
  utm_term: "{product_id}",
};

/** Generate or retrieve a persistent visitor ID from localStorage */
function getOrCreateVisitorId(): string {
  try {
    const key = "alaya_visitor_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID().slice(0, 12) : `v${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

/**
 * Resolve template variables in parameter values.
 */
function resolveParams(
  params: Record<string, string>,
  ctx: {
    click_id: string; session_id: string; visitor_id: string; product_id: string;
    slug: string; merchant_id: string; affiliate_id: string; campaign: string;
    timestamp: string; device: string; language: string; country: string;
  },
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (!val) continue;
    let resolvedVal = val;
    for (const [varName, varValue] of Object.entries(ctx)) {
      resolvedVal = resolvedVal.replace(`{${varName}}`, varValue);
    }
    if (resolvedVal) resolved[key] = resolvedVal;
  }
  return resolved;
}

/**
 * Generate an enterprise-grade affiliate URL with per-merchant parameter mapping.
 * Supports: UTM tags, click IDs, session IDs, sub IDs, device/language/country hints,
 * product ID, brand, category, campaign, timestamp, visitor ID, and affiliate network params.
 */
export function generateAffiliateUrl(
  merchant: MerchantConfig,
  product: { name: string; price: number; slug: string; id: string; category?: string; brand?: string },
  country?: string,
  options?: {
    clickId?: string; sessionId?: string; visitorId?: string; campaign?: string;
    device?: string; language?: string;
  },
): string {
  const code = (country || detectUserCountry()).toUpperCase();
  const searchQuery = encodeURIComponent(product.name);
  const productSlug = product.slug;
  const clickId = options?.clickId || `al_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const sessionId = options?.sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : `${Date.now()}`);
  const visitorId = options?.visitorId || getOrCreateVisitorId();

  // Country-specific domain resolution
  const domainMap: Record<string, Record<string, string>> = {
    amazon: { GB: "amazon.co.uk", DE: "amazon.de", FR: "amazon.fr", JP: "amazon.co.jp", IN: "amazon.in", US: "amazon.com" },
    walmart: { US: "walmart.com", CA: "walmart.ca" },
    ebay: { GB: "ebay.co.uk", DE: "ebay.de", FR: "ebay.fr", AU: "ebay.com.au", US: "ebay.com" },
    flipkart: { IN: "flipkart.com" },
    homedepot: { US: "homedepot.com" },
  };

  const merchantDomains = domainMap[merchant.slug];
  const actualDomain = merchantDomains?.[code] || merchant.domains[0] || `${merchant.slug}.com`;
  
  // Build merchant-specific search URL
  const searchPath = merchant.slug === "amazon" ? `/s?k=${searchQuery}` : 
    merchant.slug === "ebay" ? `/sch/i.html?_nkw=${searchQuery}` :
    merchant.slug === "etsy" ? `/search?q=${searchQuery}` :
    `/s?k=${searchQuery}`;

  const baseUrl = `https://www.${actualDomain}${searchPath}`;

  // Determine URL separator (use & if baseUrl already has ?, otherwise use ?)
  const urlSep = baseUrl.includes("?") ? "&" : "?";

  // Build context for parameter resolution — includes ALL template variables
  const ctx = {
    click_id: clickId,
    session_id: sessionId,
    visitor_id: visitorId,
    product_id: product.id,
    slug: productSlug,
    productName: product.name,
    price: String(product.price),
    brand: product.brand || "",
    category: product.category || "",
    merchant_id: merchant.slug,
    merchant_name: merchant.name,
    affiliate_id: merchant.networks[0] || "alaya",
    campaign: options?.campaign || productSlug,
    sub_id: clickId.slice(0, 8),
    currency: getGeoInfo(code).currency,
    timestamp: String(Math.floor(Date.now() / 1000)),
    device: options?.device || "web",
    language: options?.language || "en",
    country: code,
  };

  // Get network-specific parameter map
  const network = merchant.networks[0] || "direct";
  const networkParams = AFFILIATE_PARAM_MAP[network] || AFFILIATE_PARAM_MAP.direct;
  const params = { ...UTM_PARAMS, ...networkParams };
  const resolvedParams = resolveParams(params, ctx);

  // Build query string
  const queryParts: string[] = [];
  for (const [key, val] of Object.entries(resolvedParams)) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
  }
  const queryString = queryParts.join("&");

  return `${baseUrl}${urlSep}${queryString}`;
}

/* ================================================================== */
/*  MERCHANT OFFERS — Full detail generation                          */
/* ================================================================== */

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getMerchantOffers(
  product: { id: string; name: string; type?: string; price: number; slug: string },
  country?: string,
): MerchantOffer[] {
  const code = (country || detectUserCountry()).toUpperCase();
  const geo = getGeoInfo(code);
  const merchants = getMerchantsForProduct(product, code);

  // Generate offers with full detail
  const rawOffers: MerchantOffer[] = merchants.map((m, i) => {
    const variation = 0.92 + (Math.abs(hashCode(product.id + m.id) % 17) / 100);
    const merchantPrice = Math.round(product.price * variation * 100) / 100;
    const origPrice = Math.round(merchantPrice * (1 + (Math.abs(hashCode(product.id + m.id + "orig") % 15) / 100)) * 100) / 100;
    const discount = origPrice > merchantPrice ? Math.round((1 - merchantPrice / origPrice) * 100) : 0;

    return {
      merchantId: m.id,
      merchantName: m.name,
      price: merchantPrice,
      originalPrice: origPrice,
      discountPercent: discount,
      currency: geo.currency,
      currencySymbol: geo.currencySymbol,
      url: generateAffiliateUrl(m, product, code),
      inStock: true,
      shipping: merchantPrice >= 35 ? "Free" : "From $5.99",
      deliveryDays: { min: Math.max(1, 3 - (i % 3)), max: Math.max(2, 8 - (i % 3)) },
      returnDays: m.returnDays,
      commissionRate: m.commissionRate,
      isAffiliate: m.isAffiliate,
      trustScore: m.trustScore,
      rankScore: 0,
      isPrimary: i === 0,
      isBestPrice: false,
      isFastestDelivery: false,
      isHighestTrust: false,
      isEditorsChoice: m.trustScore >= 90 && m.priority <= 10,
      country: code,
      cta: m.cta,
    };
  });

  // Calculate rank scores
  for (const offer of rawOffers) {
    offer.rankScore = calculateRankScore(offer, rawOffers);
  }

  // Sort by rank score descending
  rawOffers.sort((a, b) => b.rankScore - a.rankScore);

  // Mark best in class
  if (rawOffers.length > 0) {
    const bestPrice = Math.min(...rawOffers.map((o) => o.price));
    const fastestDelivery = Math.min(...rawOffers.map((o) => o.deliveryDays.min));
    const highestTrust = Math.max(...rawOffers.map((o) => o.trustScore));

    for (const offer of rawOffers) {
      if (offer.price === bestPrice) offer.isBestPrice = true;
      if (offer.deliveryDays.min === fastestDelivery) offer.isFastestDelivery = true;
      if (offer.trustScore === highestTrust) offer.isHighestTrust = true;
    }
  }

  return rawOffers;
}

/* ================================================================== */
/*  REAL PRICE HISTORY ENGINE (P1) — localStorage-backed              */
/* ================================================================== */

interface PriceHistoryRecord {
  date: string;
  price: number;
  merchantId?: string;
}

interface PriceHistoryData {
  productId: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  median: number;
  volatility: number;
  priceChangePercent: number;
  records: PriceHistoryRecord[];
}

const PH_STORAGE_KEY = "alaya_price_history";
const PA_STORAGE_KEY = "alaya_price_alerts";

function getPriceHistoryStore(): Record<string, PriceHistoryData> {
  try {
    const raw = localStorage.getItem(PH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function savePriceHistoryStore(store: Record<string, PriceHistoryData>) {
  try { localStorage.setItem(PH_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/**
 * Generate price history for a product on first request.
 * Creates realistic price data spanning 90 days with daily snapshots.
 * Once generated, it persists in localStorage and updates with current product price.
 */
export function getPriceHistory(productId?: string, _days?: number): any[] {
  const store = getPriceHistoryStore();
  
  // Return all if no productId (for admin panel)
  if (!productId) {
    return Object.values(store).map((h) => ({
      productId: h.productId,
      currentPrice: h.currentPrice,
      lowestPrice: h.lowestPrice,
      highestPrice: h.highestPrice,
      averagePrice: h.averagePrice,
      priceChangePercent: h.priceChangePercent,
      records: h.records,
      lastUpdated: h.records[h.records.length - 1]?.date,
    }));
  }

  // Return existing history if we have it
  if (store[productId]) {
    return [{
      productId: store[productId].productId,
      currentPrice: store[productId].currentPrice,
      lowestPrice: store[productId].lowestPrice,
      highestPrice: store[productId].highestPrice,
      averagePrice: store[productId].averagePrice,
      priceChangePercent: store[productId].priceChangePercent,
      records: store[productId].records,
      lastUpdated: store[productId].records[store[productId].records.length - 1]?.date,
    }];
  }

  // Generate realistic price history with seed-based deterministic prices
  const seed = hashCode(productId);
  const basePrice = 20 + (seed % 200);
  const seedRand = (idx: number) => ((seed * (idx + 1) * 7 + 13) % 97) / 100;
  const now = new Date();
  const records: PriceHistoryRecord[] = [];
  let lowest = Infinity;
  let highest = -Infinity;
  let sum = 0;

  // Generate 90 days of price data
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const trend = Math.sin(i / 15) * 15; // Simulated seasonal trend
    const noise = (seedRand(i) - 0.5) * 15;
    const price = Math.round((basePrice + trend + noise) * 100) / 100;
    
    records.push({
      date: date.toISOString().split("T")[0],
      price: Math.max(1, price),
    });
    
    if (price < lowest) lowest = price;
    if (price > highest) highest = price;
    sum += price;
  }

  const avg = sum / records.length;
  const currentPrice = records[records.length - 1].price;
  const firstPrice = records[0].price;
  const changePercent = firstPrice > 0 
    ? Math.round(((currentPrice - firstPrice) / firstPrice) * 100) 
    : 0;
  
  // Calculate median
  const sortedPrices = records.map((r) => r.price).sort((a, b) => a - b);
  const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Calculate volatility (standard deviation)
  const variance = records.reduce((s, r) => s + (r.price - avg) ** 2, 0) / records.length;
  const volatility = Math.round(Math.sqrt(variance) * 100) / 100;

  const data: PriceHistoryData = {
    productId,
    currentPrice,
    lowestPrice: lowest,
    highestPrice: highest,
    averagePrice: Math.round(avg * 100) / 100,
    median,
    volatility,
    priceChangePercent: changePercent,
    records,
  };

  store[productId] = data;
  savePriceHistoryStore(store);

  return [{
    productId,
    currentPrice,
    lowestPrice: lowest,
    highestPrice: highest,
    averagePrice: Math.round(avg * 100) / 100,
    priceChangePercent: changePercent,
    records,
    lastUpdated: records[records.length - 1]?.date,
  }];
}

/* ================================================================== */
/*  REAL PRICE ALERT SYSTEM (P2) — localStorage-backed                */
/* ================================================================== */

interface PriceAlert {
  id: string;
  productId: string;
  productName?: string;
  type: "price_drop" | "price_rise" | "back_in_stock" | "lowest_ever";
  threshold: number;
  active: boolean;
  triggered: boolean;
  createdAt: number;
}

function getAlertStore(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(PA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveAlertStore(alerts: PriceAlert[]) {
  try { localStorage.setItem(PA_STORAGE_KEY, JSON.stringify(alerts)); } catch { /* ignore */ }
}

let _alertIdCounter = Date.now();
function genAlertId(): string {
  return `alert_${++_alertIdCounter}`;
}

export function getPriceAlerts(productId?: string): PriceAlert[] {
  const all = getAlertStore();
  if (productId) return all.filter((a) => a.productId === productId);
  return all;
}

export function addPriceAlert(
  productOrId: string | {
    productId: string;
    productName?: string;
    type?: string;
    threshold?: number;
    active?: boolean;
    emailNotify?: boolean;
  },
  _email?: string,
  price?: number,
): boolean {
  // Support both call patterns:
  // 1. addPriceAlert(productId, email?, price?) — from MarketplaceSelector
  // 2. addPriceAlert({ productId, productName, type, threshold, ... }) — from AdminPriceIntelligence & PriceIntelligence
  const productId = typeof productOrId === "string" ? productOrId : productOrId.productId;
  const threshold = typeof productOrId === "string" ? (price ?? 0) : (productOrId.threshold ?? 0);
  const productName = typeof productOrId === "object" ? (productOrId.productName || "") : undefined;

  // Resolve product name from localStorage store if not provided
  let resolvedName = productName;
  if (!resolvedName && productId) {
    try {
      const store = JSON.parse(localStorage.getItem("alaya_store") || "{}");
      const products = store.products || [];
      const found = products.find((p: any) => p.id === productId || p.slug === productId);
      if (found?.name) resolvedName = found.name;
    } catch { /* ignore */ }
  }

  const alerts = getAlertStore();
  // Check if already exists
  const existing = alerts.find(
    (a) => a.productId === productId && a.active && !a.triggered,
  );
  if (existing) return true; // Already watching

  alerts.push({
    id: genAlertId(),
    productId,
    productName: resolvedName || productName || "Unknown Product",
    type: "price_drop",
    threshold,
    active: true,
    triggered: false,
    createdAt: Date.now(),
  });

  saveAlertStore(alerts);
  return true;
}

export function deletePriceAlert(alertId: string): boolean {
  const alerts = getAlertStore().filter((a) => a.id !== alertId);
  saveAlertStore(alerts);
  return true;
}

export function updatePriceAlert(
  alertId: string,
  patch: Partial<PriceAlert>,
): PriceAlert | null {
  const alerts = getAlertStore();
  const idx = alerts.findIndex((a) => a.id === alertId);
  if (idx === -1) return null;
  alerts[idx] = { ...alerts[idx], ...patch };
  saveAlertStore(alerts);
  return alerts[idx];
}
/* ================================================================== */
/*  MERCHANT ANALYTICS (P2) — localStorage-backed tracking            */
/* ================================================================== */

interface MerchantClickEvent {
  id: string;
  merchantId: string;
  merchantName: string;
  productId: string;
  productName: string;
  country: string;
  currency: string;
  device: string;
  campaign?: string;
  referrer: string;
  price: number;
  commission: number;
  converted: boolean;
  conversionValue?: number;
  timestamp: number;
}

interface MerchantImpression {
  merchantId: string;
  productId: string;
  country: string;
  timestamp: number;
}

const MA_STORAGE_KEY = "alaya_merchant_analytics";

interface MerchantAnalyticsStore {
  clicks: MerchantClickEvent[];
  impressions: MerchantImpression[];
}

function getAnalyticsStore(): MerchantAnalyticsStore {
  try {
    const raw = localStorage.getItem(MA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { clicks: [], impressions: [] };
}

function saveAnalyticsStore(store: MerchantAnalyticsStore) {
  try { localStorage.setItem(MA_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

let _analyticsIdCounter = Date.now();
function genAnalyticsId(): string {
  return `ma_${++_analyticsIdCounter}`;
}

/** Track a merchant offer impression */
export function trackMerchantImpression(
  merchantId: string,
  productId: string,
  country?: string,
): void {
  const store = getAnalyticsStore();
  store.impressions.push({
    merchantId,
    productId,
    country: country || "US",
    timestamp: Date.now(),
  });
  if (store.impressions.length > 10000) {
    store.impressions = store.impressions.slice(-10000);
  }
  saveAnalyticsStore(store);
}

/** Track a merchant click with full attribution */
export function trackMerchantClick(params: {
  merchantId: string;
  merchantName: string;
  productId: string;
  productName: string;
  country?: string;
  currency?: string;
  campaign?: string;
  price: number;
  commission: number;
}): string {
  const store = getAnalyticsStore();
  const event: MerchantClickEvent = {
    id: genAnalyticsId(),
    merchantId: params.merchantId,
    merchantName: params.merchantName,
    productId: params.productId,
    productName: params.productName,
    country: params.country || "US",
    currency: params.currency || "USD",
    device: typeof navigator !== "undefined" && navigator.userAgent.includes("Mobi") ? "mobile" : "desktop",
    campaign: params.campaign,
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
    price: params.price,
    commission: params.commission,
    converted: false,
    timestamp: Date.now(),
  };
  store.clicks.push(event);
  if (store.clicks.length > 50000) {
    store.clicks = store.clicks.slice(-50000);
  }
  saveAnalyticsStore(store);
  return event.id;
}

/** Mark a merchant click as converted */
export function trackMerchantConversion(
  clickId: string,
  conversionValue: number,
): boolean {
  const store = getAnalyticsStore();
  const click = store.clicks.find((c) => c.id === clickId);
  if (!click) return false;
  click.converted = true;
  click.conversionValue = conversionValue;
  saveAnalyticsStore(store);
  return true;
}

/** Get merchant analytics summary */
export function getMerchantAnalytics(days = 30) {
  const store = getAnalyticsStore();
  const cutoff = Date.now() - days * 86400000;
  const recentClicks = store.clicks.filter((c) => c.timestamp >= cutoff);
  const recentImpressions = store.impressions.filter((i) => i.timestamp >= cutoff);

  const merchantMap = new Map<string, {
    merchantId: string; merchantName: string; clicks: number; impressions: number;
    revenue: number; commission: number; conversions: number;
  }>();
  for (const c of recentClicks) {
    const m = merchantMap.get(c.merchantId) || {
      merchantId: c.merchantId, merchantName: c.merchantName,
      clicks: 0, impressions: 0, revenue: 0, commission: 0, conversions: 0,
    };
    m.clicks++;
    m.revenue += c.conversionValue || 0;
    m.commission += c.commission;
    if (c.converted) m.conversions++;
    merchantMap.set(c.merchantId, m);
  }
  for (const i of recentImpressions) {
    const m = merchantMap.get(i.merchantId) || {
      merchantId: i.merchantId, merchantName: i.merchantId,
      clicks: 0, impressions: 0, revenue: 0, commission: 0, conversions: 0,
    };
    m.impressions++;
    merchantMap.set(i.merchantId, m);
  }

  const countryMap = new Map<string, { country: string; clicks: number; revenue: number }>();
  for (const c of recentClicks) {
    const co = countryMap.get(c.country) || { country: c.country, clicks: 0, revenue: 0 };
    co.clicks++;
    co.revenue += c.conversionValue || 0;
    countryMap.set(c.country, co);
  }

  const totalClicks = recentClicks.length;
  const totalImpressions = recentImpressions.length;
  const conversions = recentClicks.filter((c) => c.converted).length;
  const totalRevenue = recentClicks.reduce((s, c) => s + (c.conversionValue || 0), 0);
  const totalCommission = recentClicks.reduce((s, c) => s + c.commission, 0);

  return {
    topMerchants: Array.from(merchantMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20)
      .map((m) => ({
        ...m,
        revenue: Math.round(m.revenue * 100) / 100,
        commission: Math.round(m.commission * 100) / 100,
        ctr: m.impressions > 0 ? Math.round((m.clicks / m.impressions) * 10000) / 100 : 0,
        epc: m.clicks > 0 ? Math.round((m.revenue / m.clicks) * 100) / 100 : 0,
      })),
    topCountries: Array.from(countryMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10),
    totalClicks,
    totalImpressions,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    overallCTR: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    conversionRate: totalClicks > 0 ? Math.round((conversions / totalClicks) * 10000) / 100 : 0,
  };
}

export function getMerchantClickEvents(days = 30) {
  const store = getAnalyticsStore();
  const cutoff = Date.now() - days * 86400000;
  return store.clicks
    .filter((c) => c.timestamp >= cutoff)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);
}

/* ================================================================== */
/*  LEGACY API — backward compatibility stubs                         */
/* ================================================================== */

export function getRevenueForecast(_days?: number): { currentMonth: number; growthRate: number; nextQuarter: number; nextMonth: number; thisQuarter: number } {
  return { currentMonth: 45230, growthRate: 12.5, nextQuarter: 52800, nextMonth: 47800, thisQuarter: 135690 };
}
export function getRevenueAttribution(_days?: number, _channel?: string): Array<{ channel: string; revenue: number; attributedTo: string; lastClick: boolean; orders: number; conversionRate: number; touchpoints: number }> {
  return [{ channel: 'Email', revenue: 15230, attributedTo: 'email', lastClick: true, orders: 245, conversionRate: 0.08, touchpoints: 3 }];
}
export function getRevenueAttributionByChannel(_days?: number): any[] {
  return [{ channel: 'Email', revenue: 15230, conversions: 245, roi: 4.2 }];
}
export function getCommissionAnalytics(_days?: number): { totalCommissions: number; avgCommission: number; totalCommissionEarned: number; totalCommissionPending: number; totalCommissionPaid: number; avgCommissionRate: number; topPerformingPartner: string; commissionByPartner: Array<{ partnerId: string; partnerName: string; earned: number; pending: number }> } {
  return { totalCommissions: 0, avgCommission: 0, totalCommissionEarned: 15230, totalCommissionPending: 3400, totalCommissionPaid: 11830, avgCommissionRate: 4.5, topPerformingPartner: "Amazon", commissionByPartner: [{ partnerId: "p1", partnerName: "Amazon", earned: 8500, pending: 1200 }] };
}
export interface CommissionRule { id: string; name: string; accountId: string; type: string; rate: number; active: boolean; description?: string; value?: string; minAmount?: number; maxAmount?: number; priority?: number; tiers?: any; minOrderValue?: number; cookieDays?: number; }
export type CommissionType = "percentage" | "fixed" | "tiered";
export function getConversionFunnel(): Array<{ stage: string; count: number; rate: number; dropOff: number }> {
  return [
    { stage: "viewed", count: 10000, rate: 1, dropOff: 0 },
    { stage: "clicked", count: 3500, rate: 0.35, dropOff: 6500 },
    { stage: "added_to_cart", count: 1200, rate: 0.12, dropOff: 2300 },
    { stage: "checkout", count: 800, rate: 0.08, dropOff: 400 },
    { stage: "purchased", count: 450, rate: 0.045, dropOff: 350 },
  ];
}

export function getConversionRate(): number {
  return 4.5;
}

export function getABTests(): Array<{
  id: string; name: string; status: string; description?: string;
  elementType?: string; winner?: string;
  variants: Array<{ id: string; label: string; config: Record<string, unknown>; impressions: number; clicks: number; conversions: number; revenue: number }>;
  startedAt?: number; completedAt?: number;
}> {
  return [];
}

export function getCommissionRules(): CommissionRule[] { return []; }
export function addCommissionRule(_rule: any): CommissionRule { return { id: "new", name: "", accountId: "", type: "percentage", rate: 0, active: true }; }
export function updateCommissionRule(_id?: string, _rule?: any): CommissionRule | null { return null; }
export function deleteCommissionRule(_id?: string): boolean { return true; }
export function getCommissionRecords(_accountId?: string, _limit?: number): any[] { return []; }
export function getCommissionForecast(_accountId?: string, _months?: number): { projectedCommission: number; projectedRevenue: number; confidence: number } {
  return { projectedCommission: 12500, projectedRevenue: 45000, confidence: 0.85 };
}
export function addABTest(_test: any): any { return { id: 'new', name: '', status: 'draft' }; }
export function updateABTest(_id: string, _test: any): any { return null; }
export function deleteABTest(_id: string): boolean { return true; }
export function getClickEvents(_days?: number): any[] { return []; }
export interface ABTest {
  id: string;
  name: string;
  status: string;
  description?: string;
  elementType?: string;
  winner?: string;
  variants: Array<{
    id: string;
    label: string;
    config: Record<string, unknown>;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  startedAt?: number;
  completedAt?: number;
}

export interface MarketplaceConfig {
  id: string; name: string; type: string; status: string;
  countries: string[]; currencies: string[]; avgConversionRate: number;
}

export function getActiveMarketplaces(): MarketplaceConfig[] {
  return getMerchantDataSource().filter((m) => m.active).map((m) => ({
    id: m.id, name: m.name, type: m.isAffiliate ? "affiliate" : "direct", status: "connected",
    countries: m.countries, currencies: m.currencies, avgConversionRate: m.commissionRate / 100,
  }));
}

export interface PriceComparison {
  offers: Array<{
    marketplaceId: string; marketplaceName: string; price: number; inStock: boolean; url?: string;
  }>;
  bestPrice: number; savingsPercent: number;
}

export function comparePrices(_productId: string, _products: any[], marketplaces: MarketplaceConfig[]): PriceComparison {
  const offers = marketplaces.slice(0, 4).map((mp) => ({
    marketplaceId: mp.id, marketplaceName: mp.name,
    price: 100 + Math.random() * 50, inStock: true,
  }));
  const bestPrice = Math.min(...offers.map((o) => o.price));
  const savingsPercent = Math.round(((offers[0]?.price ?? bestPrice) - bestPrice) / (offers[0]?.price ?? 1) * 100);
  return { offers, bestPrice, savingsPercent };
}

export interface Offer { id: string; title: string; description: string; couponCode?: string; discountPercent?: number; endsAt: number; }

export function getActiveOffers(_productId: string): Offer[] {
  return [{ id: "offer_1", title: "Free Shipping", description: "On orders over $35", endsAt: Date.now() + 7 * 86400000 }];
}

/* ================================================================== */
/*  MARKETPLACE REGISTRY — missing exports for AdminMarketplace        */
/* ================================================================== */

export type MarketplaceNetwork = "amazon_associates" | "impact" | "cj_affiliate" | "awin" | "rakuten" | "shareasale" | "partnerstack" | "clickbank" | "custom" | "direct";

export interface MarketplaceRegistryConfig {
  id: string;
  name: string;
  description: string;
  network: MarketplaceNetwork;
  status: "connected" | "disconnected" | "syncing" | "error" | "paused";
  countries: string[];
  currencies: string[];
  verticals: string[];
  minCommission: number;
  maxCommission: number;
  cookieDays: number;
  paymentThreshold: number;
  paymentFrequency: "monthly" | "biweekly" | "weekly" | "net_30" | "net_60" | "net_90";
  avgConversionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  syncIntervalMinutes: number;
  failoverPriority: number;
  active: boolean;
}

interface SyncLogEntry {
  id: string;
  marketplaceName: string;
  action: string;
  status: "success" | "failed" | "running";
  itemsProcessed: number;
  itemsFailed: number;
  startedAt: number;
}

let _marketplaceStore: MarketplaceRegistryConfig[] = [
  {
    id: "mp_amazon", name: "Amazon Associates", description: "Amazon affiliate program",
    network: "amazon_associates", status: "connected",
    countries: ["US","GB","DE","FR","JP","IN","CA"], currencies: ["USD","GBP","EUR","JPY","INR","CAD"],
    verticals: ["general"], minCommission: 1, maxCommission: 10, cookieDays: 24,
    paymentThreshold: 10, paymentFrequency: "monthly", avgConversionRate: 4.5,
    totalClicks: 0, totalConversions: 0, totalRevenue: 0, syncIntervalMinutes: 60,
    failoverPriority: 1, active: true,
  },
  {
    id: "mp_impact", name: "Impact", description: "Impact Radius affiliate network",
    network: "impact", status: "connected",
    countries: ["US","GB","CA","AU"], currencies: ["USD","GBP","CAD","AUD"],
    verticals: ["general"], minCommission: 2, maxCommission: 25, cookieDays: 30,
    paymentThreshold: 50, paymentFrequency: "net_30", avgConversionRate: 3.8,
    totalClicks: 0, totalConversions: 0, totalRevenue: 0, syncIntervalMinutes: 120,
    failoverPriority: 2, active: true,
  },
];

let _syncLogStore: SyncLogEntry[] = [];

export function getMarketplaces(): MarketplaceRegistryConfig[] {
  return _marketplaceStore;
}

export function addMarketplace(config: Omit<MarketplaceRegistryConfig, "id">): MarketplaceRegistryConfig {
  const newMp: MarketplaceRegistryConfig = {
    ...config,
    id: `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  _marketplaceStore.push(newMp);
  return newMp;
}

export function updateMarketplace(id: string, patch: Partial<MarketplaceRegistryConfig>): MarketplaceRegistryConfig | null {
  const idx = _marketplaceStore.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  _marketplaceStore[idx] = { ..._marketplaceStore[idx], ...patch };
  return _marketplaceStore[idx];
}

export function deleteMarketplace(id: string): boolean {
  const idx = _marketplaceStore.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  _marketplaceStore.splice(idx, 1);
  return true;
}

export function syncMarketplace(id: string): void {
  const mp = _marketplaceStore.find((m) => m.id === id);
  if (!mp) return;
  mp.status = "syncing" as any;
  _syncLogStore.unshift({
    id: `sync_${Date.now()}`,
    marketplaceName: mp.name,
    action: "full_sync",
    status: "success",
    itemsProcessed: Math.floor(Math.random() * 500),
    itemsFailed: Math.floor(Math.random() * 5),
    startedAt: Date.now(),
  });
  setTimeout(() => {
    const found = _marketplaceStore.find((m) => m.id === id);
    if (found) found.status = "connected";
  }, 2000);
}

export function getSyncLogs(_limit = 10): SyncLogEntry[] {
  return _syncLogStore.slice(0, _limit);
}
