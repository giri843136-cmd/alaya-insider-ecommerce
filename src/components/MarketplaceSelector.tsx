/**
 * ALAYA INSIDER — Global Multi-Merchant Selector v2
 * --------------------------------------------------------------------------
 * Enterprise-grade "Available at" cards for ALL products with geo-routing,
 * price comparison, country selector, accessibility, and performance.
 *
 * Every product page displays:
 *   Available at               [Country Selector ▼]
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ 🏪 Amazon           $49.99  −12%  Free · 2-5 days  Best │
 *   │ 🏪 Walmart          $47.22  −8%   Free · 3-6 days       │
 *   │ 🏪 Target           $51.99  −5%   $5.99 · 4-7 days      │
 *   └──────────────────────────────────────────────────────────┘
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Price History Chart                                      │
 *   └──────────────────────────────────────────────────────────┘
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Price Drop Alert                                         │
 *   └──────────────────────────────────────────────────────────┘
 */

import { memo, useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  Globe, ExternalLink, Check, ChevronDown, Truck, Zap, MapPin,
  TrendingDown, TrendingUp, Bell, DollarSign, BarChart3,
  Star, ShieldCheck, Clock, Sparkles,
} from "lucide-react";
import type { Product } from "../lib/types";
import {
  getMerchantsForProduct, getMerchantOffers, getGeoInfo,
  detectUserCountry, setUserCountry,
  MERCHANTS, getPriceHistory, addPriceAlert, deletePriceAlert, getPriceAlerts,
  trackMerchantImpression, trackMerchantClick,
  type MerchantConfig, type MerchantOffer,
} from "../lib/affiliateCommerce";
import { Price } from "./ui";
import { cn } from "@/utils/cn";

/* ================================================================== */
/*  INLINE MERCHANT LOGO — renders SVG safely                         */
/* ================================================================== */

function MerchantLogo({ merchant, className }: { merchant: MerchantConfig; className?: string }) {
  return (
    <div
      className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white overflow-hidden", className)}
      aria-hidden="true"
    >
      <div
        className="h-full w-full p-1.5"
        dangerouslySetInnerHTML={{ __html: merchant.logoSvg }}
      />
    </div>
  );
}

/* ================================================================== */
/*  MERCHANT BADGE                                                     */
/* ================================================================== */

function MerchantBadge({ merchant }: { merchant: MerchantConfig }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6rem] font-semibold tracking-wide"
      style={{
        backgroundColor: merchant.theme.bg,
        color: merchant.theme.text,
        border: `1px solid ${merchant.theme.border}`,
      }}
      role="listitem"
    >
      {merchant.verified && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
      {merchant.name}
    </span>
  );
}

/* ================================================================== */
/*  COUNTRY SELECTOR — ALWAYS VISIBLE (P2)                            */
/* ================================================================== */

const QUICK_REGIONS = [
  { code: "US", flag: "🇺🇸", name: "United States" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "IN", flag: "🇮🇳", name: "India" },
];

export function CountrySelector({ className, compact }: { className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const current = getGeoInfo();
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((code: string) => {
    setUserCountry(code);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("alaya-geo-change", { detail: { country: code } }));
  }, []);

  // Close on outside click (accessibility)
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-all hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
        aria-label={`Select country. Currently ${current.countryName}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPin className="h-3 w-3 text-muted" aria-hidden="true" />
        <span aria-hidden="true">{current.flag}</span>
        <span className={compact ? "sr-only sm:not-sr-only" : ""}>{current.country}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-float)] animate-fade-in"
          role="listbox"
          aria-label="Select your shopping region"
        >
          <p className="px-2 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted">
            Shop in your region
          </p>
          {QUICK_REGIONS.map((r) => (
            <button
              key={r.code}
              onClick={() => handleSelect(r.code)}
              role="option"
              aria-selected={current.country === r.code}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                current.country === r.code
                  ? "bg-accent-soft text-accent"
                  : "text-ink hover:bg-surface2",
              )}
            >
              <span className="text-base" aria-hidden="true">{r.flag}</span>
              <span className="flex-1 font-medium">{r.name}</span>
              {current.country === r.code && (
                <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  EXPANDED MERCHANT CARD (P6)                                       */
/* ================================================================== */

const MerchantOfferCard = memo(function MerchantOfferCard({
  offer, merchant, productId, productName,
}: {
  offer: MerchantOffer;
  merchant: MerchantConfig;
  productId: string;
  productName: string;
}) {
  // Track impression once on mount
  useEffect(() => {
    trackMerchantImpression(merchant.id, productId, offer.country);
  }, [merchant.id, productId, offer.country]);

  // Track click before navigation using sendBeacon when possible
  const handleClick = useCallback(() => {
    trackMerchantClick({
      merchantId: merchant.id,
      merchantName: merchant.name,
      productId,
      productName,
      country: offer.country,
      currency: offer.currency,
      price: offer.price,
      commission: offer.commissionRate,
    });
    // Return nothing — onClick expects void
  }, [merchant.id, merchant.name, productId, productName, offer.country, offer.currency, offer.price, offer.commissionRate]);

  const badges: string[] = [];
  if (offer.isEditorsChoice) badges.push("Editor's Choice");
  if (offer.isBestPrice) badges.push("Best Price");
  if (offer.isFastestDelivery) badges.push("Fastest");
  if (offer.isHighestTrust) badges.push("Trusted");

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        offer.isBestPrice
          ? "border-accent/40 bg-accent-soft/30 hover:border-accent hover:shadow-[var(--shadow-card)]"
          : "border-line bg-surface hover:border-accent/50 hover:shadow-[var(--shadow-card)]",
      )}
      aria-label={`${merchant.name}: ${offer.currencySymbol}${offer.price} ${offer.shipping === "Free" ? "with free shipping" : ""}`}
      tabIndex={0}
    >
      {/* Rank badge for editor's choice */}
      {offer.isEditorsChoice && (
        <div className="absolute -right-1 -top-2.5" aria-hidden="true">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.55rem] font-bold text-accent-ink shadow-sm">
            <Star className="h-2.5 w-2.5" /> Pick
          </span>
        </div>
      )}

      {/* Merchant logo */}
      <MerchantLogo merchant={merchant} />

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{merchant.name}</span>
          {offer.isPrimary && <span className="text-[0.5rem] text-muted uppercase tracking-wider">Partner</span>}
          {merchant.verified && (
            <span className="text-[0.5rem] text-accent flex items-center gap-0.5" title="Verified merchant">
              <ShieldCheck className="h-2.5 w-2.5" /> Verified
            </span>
          )}
        </div>

        {/* Shipping + Delivery */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6rem] text-muted">
          <span className="flex items-center gap-0.5">
            <Truck className="h-3 w-3" aria-hidden="true" />
            {offer.shipping}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {offer.deliveryDays.min}–{offer.deliveryDays.max} days
          </span>
          <span>{offer.returnDays}d returns</span>

          {/* Commission badge */}
          {offer.isAffiliate && (
            <span className="text-[0.45rem] uppercase tracking-wider text-muted bg-surface2 rounded px-1">
              {offer.commissionRate}% commission
            </span>
          )}
        </div>

        {/* Badge row */}
        {badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1" aria-hidden="true">
            {badges.map((b) => (
              <span key={b} className="inline-flex items-center gap-0.5 rounded-full bg-accent-soft/60 px-1.5 py-0.5 text-[0.5rem] font-semibold text-accent">
                {b === "Best Price" && <Zap className="h-2 w-2" />}
                {b === "Fastest" && <TrendingDown className="h-2 w-2" />}
                {b === "Trusted" && <ShieldCheck className="h-2 w-2" />}
                {b === "Editor's Choice" && <Sparkles className="h-2 w-2" />}
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price column */}
      <div className="flex shrink-0 flex-col items-end gap-0.5 min-w-[70px]">
        <div className="text-right">
          <span className="text-sm font-bold text-ink tabular-nums">
            <Price price={offer.price} />
          </span>
          {offer.discountPercent > 0 && (
            <span className="ml-1 text-[0.55rem] font-semibold text-success">
              −{offer.discountPercent}%
            </span>
          )}
        </div>
        {offer.originalPrice > offer.price && (
          <span className="text-[0.55rem] text-muted line-through tabular-nums">
            <Price price={offer.originalPrice} />
          </span>
        )}
        {/* CTA */}
        <span className="inline-flex items-center gap-0.5 text-[0.6rem] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
          {merchant.cta} <ExternalLink className="h-2.5 w-2.5" />
        </span>
      </div>
    </a>
  );
});

/* ================================================================== */
/*  SKELETON                                                           */
/* ================================================================== */

function MerchantCardSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-line bg-surface p-3" aria-hidden="true">
      <div className="h-10 w-10 rounded-lg bg-surface2" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-surface2" />
        <div className="h-3 w-32 rounded bg-surface2/60" />
      </div>
      <div className="h-4 w-14 rounded bg-surface2" />
    </div>
  );
}

/* ================================================================== */
/*  PRICE HISTORY CHART (P1 — RESTORED)                               */
/* ================================================================== */

const PriceHistoryWidget = memo(function PriceHistoryWidget({ product }: { product: Product }) {
  const history = useMemo(() => getPriceHistory(product.id), [product.id]);

  if (history.length === 0) return null;      const historyItem = history[0] as any;
  if (!historyItem || !historyItem.records) return null;
  const min = historyItem.lowestPrice;
  const max = historyItem.highestPrice;
  const range = max - min || 1;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
        <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Price history
      </p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Current</p>
          <p className="mt-0.5 text-sm font-semibold text-ink"><Price price={historyItem.currentPrice} /></p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Lowest</p>
          <p className="mt-0.5 text-sm font-semibold text-success"><Price price={historyItem.lowestPrice} /></p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Average</p>
          <p className="mt-0.5 text-sm font-semibold text-ink"><Price price={historyItem.averagePrice} /></p>
        </div>
      </div>
      <div className="flex items-end gap-1 h-16" role="img" aria-label="Price history chart">
        {(historyItem.records as any[]).map((record: any, idx: number) => {
          const height = ((record.price - min) / range) * 100;
          const isLatest = idx === historyItem.records.length - 1;
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className={cn("w-full rounded-t transition-all", isLatest ? "bg-accent" : "bg-accent/40")}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${record.date}: $${record.price}`}
              />
              <span className="text-[0.5rem] text-muted">{record.date?.slice(5)}</span>
            </div>
          );
        })}
      </div>
      {historyItem.priceChangePercent !== 0 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">Since first record</span>
          <span className={cn("flex items-center gap-1 font-medium", historyItem.priceChangePercent < 0 ? "text-success" : "text-danger")}>
            {historyItem.priceChangePercent < 0 ? <TrendingDown className="h-3 w-3" aria-hidden="true" /> : <TrendingUp className="h-3 w-3" aria-hidden="true" />}
            {Math.abs(historyItem.priceChangePercent)}%
          </span>
        </div>
      )}
    </div>
  );
});

/* ================================================================== */
/*  PRICE DROP ALERT (P1 — RESTORED)                                  */
/* ================================================================== */

const PriceDropWidget = memo(function PriceDropWidget({ product }: { product: Product }) {
  const [alertActive, setAlertActive] = useState(() => {
    return getPriceAlerts().some((a: any) => a.productId === product.id && a.active);
  });
  const [threshold, setThreshold] = useState(Math.round(product.salePrice ?? product.price * 0.9));

  const toggleAlert = useCallback(() => {
    if (alertActive) {
      const existing = getPriceAlerts().find((a: any) => a.productId === product.id && a.active);
      if (existing) deletePriceAlert(existing.id);
      setAlertActive(false);
    } else {
      addPriceAlert(product.id, "", threshold);
      setAlertActive(true);
    }
  }, [alertActive, product.id, threshold]);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Price alert
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {alertActive
              ? "We'll notify you when the price drops below your threshold."
              : "Set a target price and get notified when it drops."}
          </p>
        </div>
        <button
          onClick={toggleAlert}
          className={cn("btn-sm transition-all", alertActive ? "btn-primary" : "btn-ghost")}
          aria-pressed={alertActive}
          aria-label={alertActive ? "Deactivate price alert" : "Activate price alert"}
        >
          {alertActive ? <Bell className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {alertActive ? "Active" : "Alert me"}
        </button>
      </div>
      {!alertActive && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Notify when below</span>
          <div className="relative flex-1 max-w-[120px]">
            <DollarSign className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="input-field w-full pl-7 text-sm"
              min={1}
              aria-label="Price alert threshold"
            />
          </div>
        </div>
      )}
    </div>
  );
});

/* ================================================================== */
/*  MERCHANT STRIP — for product cards                                */
/* ================================================================== */

export const MerchantStrip = memo(function MerchantStrip({
  product, max = 4,
}: {
  product: Product; max?: number;
}) {
  const merchants = useMemo(() => getMerchantsForProduct(product), [product.type, product.price, product.id]);
  if (!merchants.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1" role="list" aria-label="Available merchants">
      <span className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted">At</span>
      {merchants.slice(0, max).map((m) => (
        <span
          key={m.id}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.55rem] font-semibold tracking-tight"
          style={{ backgroundColor: m.theme.bg, color: m.theme.text }}
          role="listitem"
        >
          {m.name}
        </span>
      ))}
      {merchants.length > max && (
        <span className="text-[0.55rem] font-semibold text-muted">+{merchants.length - max}</span>
      )}
    </div>
  );
});

/* ================================================================== */
/*  MAIN MULTI-MERCHANT COMPONENT                                     */
/* ================================================================== */

interface MultiMerchantProps {
  product: Product;
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function MultiMerchantOffers({
  product, limit = 5, showTitle = true, className,
}: MultiMerchantProps) {
  const [geoVersion, setGeoVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listen for geo changes
  useEffect(() => {
    const handler = () => setGeoVersion((v) => v + 1);
    window.addEventListener("alaya-geo-change", handler);
    return () => window.removeEventListener("alaya-geo-change", handler);
  }, []);

  // Brief loading on geo change for visual feedback
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [geoVersion]);

  const country = detectUserCountry();
  const geo = getGeoInfo(country);

  // Memoize expensive computations (P10)
  const merchants = useMemo(
    () => getMerchantsForProduct(product, country),
    [product.type, product.price, product.id, country, geoVersion],
  );

  const offers = useMemo(
    () => getMerchantOffers(product, country),
    [product, country, geoVersion],
  );

  const displayOffers = useMemo(() => offers.slice(0, limit), [offers, limit]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Title row with CountrySelector (P2 — always visible) */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              Available at
            </span>
            <span className="text-[0.6rem] text-muted hidden sm:inline">
              {geo.flag} {geo.countryName}
            </span>
          </div>
          <CountrySelector compact />
        </div>
      )}

      {/* When no merchants found — show message + selector (P2 fix) */}
      {merchants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center">
          <p className="text-sm text-muted mb-3">
            No supported merchants found for {geo.countryName}.
          </p>
          <div className="flex justify-center">
            <CountrySelector />
          </div>
        </div>
      ) : (
        <>
          {/* Merchant pills */}
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Available merchants">
            {merchants.slice(0, 6).map((m) => (
              <MerchantBadge key={m.id} merchant={m} />
            ))}
            {merchants.length > 6 && (
              <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-[0.55rem] font-semibold text-muted">
                +{merchants.length - 6}
              </span>
            )}
          </div>

          {/* Offer cards */}
          <div className="space-y-2" role="list" aria-label="Merchant offers">
            {loading
              ? Array.from({ length: Math.min(3, limit) }).map((_, idx) => (
                  <MerchantCardSkeleton key={idx} />
                ))
              : displayOffers.map((offer) => {
                  const merchant = merchants.find((m) => m.id === offer.merchantId);
                  if (!merchant) return null;
                  return (
                    <MerchantOfferCard
                      key={offer.merchantId}
                      offer={offer}
                      merchant={merchant}
                      productId={product.id}
                      productName={product.name}
                    />
                  );
                })}
          </div>

          {offers.length > limit && (
            <button
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={`View all ${offers.length} merchants`}
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              View all {offers.length} merchants
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  FULL PRODUCT INTELLIGENCE BLOCK (P1 — PriceHistory + DropAlert)   */
/* ================================================================== */

export function ProductIntelligence({ product }: { product: Product }) {
  const history = useMemo(() => getPriceHistory(product.id), [product.id]);
  const hasHistory = history.length > 0;
  const hasAlerts = true; // Always show alert option

  if (!hasHistory && !hasAlerts) return null;

  return (
    <div className="space-y-4">
      {hasHistory && <PriceHistoryWidget product={product} />}
      {hasAlerts && <PriceDropWidget product={product} />}
    </div>
  );
}

/* ================================================================== */
/*  LEGACY COMPONENTS — re-exported for backward compatibility        */
/* ================================================================== */

import { useStore } from "../context/StoreContext";
import { getActiveMarketplaces, comparePrices, getActiveOffers } from "../lib/affiliateCommerce";

export function GeoMarketplaceSelector({ product, className }: { product: Product; className?: string }) {
  const merchants = useMemo(() => getMerchantsForProduct(product), [product.type, product.price, product.id]);
  if (!merchants.length) return null;
  return (
    <div className={cn("rounded-xl border border-line p-4", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Shop on
      </p>
      <div className="flex flex-wrap gap-1.5">
        {merchants.map((m) => (<MerchantBadge key={m.id} merchant={m} />))}
      </div>
    </div>
  );
}

export function PriceComparisonWidget({ product }: { product: Product }) {
  const { products } = useStore();
  const marketplaces = useMemo(() => getActiveMarketplaces(), []);
  const comparison = useMemo(() => comparePrices(product.id, products, marketplaces), [product.id, products, marketplaces]);
  if (comparison.offers.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Price Comparison</p>
      <div className="space-y-2">
        {comparison.offers.slice(0, 3).map((offer) => (
          <div key={offer.marketplaceId} className="flex items-center justify-between rounded-lg border border-line p-3">
            <span className="text-sm font-medium">{offer.marketplaceName}</span>
            <div className="flex items-center gap-2">
              <Price price={offer.price} />
              {offer.inStock && <Check className="h-4 w-4 text-success" aria-hidden="true" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActiveOffers({ product }: { product: Product }) {
  const offers = useMemo(() => getActiveOffers(product.id), [product.id]);
  if (offers.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Active offers
      </p>
      {offers.map((offer) => (
        <div key={offer.id} className="flex items-center justify-between rounded-lg border border-line p-3">
          <span className="text-sm font-medium">{offer.title}</span>
          <span className="text-xs text-success">Available</span>
        </div>
      ))}
    </div>
  );
}

export function MarketplacesAvailable(_product: Product) {
  const marketplaces = useMemo(() => getActiveMarketplaces(), []);
  if (marketplaces.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Available on
      </p>
      <div className="flex flex-wrap gap-2">
        {marketplaces.slice(0, 6).map((mp) => (
          <span key={mp.id} className="rounded-full bg-surface2 px-2.5 py-0.5 text-[0.6rem] font-semibold text-muted">{mp.name}</span>
        ))}
      </div>
    </div>
  );
}

export function MarketplaceBadge({ marketplace }: { marketplace: { id: string; name: string; status: string } }) {
  const merchant = MERCHANTS.find((m) => m.id === marketplace.id);
  if (merchant) return <MerchantBadge merchant={merchant} />;
  return <span className="rounded-full bg-surface2 px-2.5 py-0.5 text-[0.6rem] font-semibold text-muted">{marketplace.name}</span>;
}

// Re-export ProductIntelligence as PriceHistoryChart + PriceDropAlert for backward compat
export { PriceHistoryWidget as PriceHistoryChart, PriceDropWidget as PriceDropAlert };
