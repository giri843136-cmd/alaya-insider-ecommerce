/**
 * ALAYA INSIDER — Enhanced Affiliate Experience (Part 3.4)
 * -----------------------------------------------------------
 * Premium affiliate product display with smart badges, geo-aware routing,
 * commission display, and conversion-optimized product cards.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Globe,
  Percent,
  Star,
  Award,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Price, Stars, Badge } from "./ui";
import { cn } from "@/utils/cn";
import type { Product } from "../lib/types";

/* ------------------------------------------------------------------ */
/*  Affiliate Badge Variants                                          */
/* ------------------------------------------------------------------ */

export type AffiliateBadgeType =
  | "best_value"
  | "premium_pick"
  | "editors_choice"
  | "trending"
  | "new"
  | "top_rated"
  | "limited_time"
  | "price_drop"
  | "award_winner"
  | "staff_pick";

const BADGE_CONFIG: Record<AffiliateBadgeType, { label: string; icon: typeof Award; className: string }> = {
  best_value: { label: "Best Value", icon: Award, className: "bg-success/15 text-success" },
  premium_pick: { label: "Premium Pick", icon: Award, className: "bg-ink text-canvas" },
  editors_choice: { label: "Editor's Choice", icon: Star, className: "bg-accent text-accent-ink" },
  trending: { label: "Trending", icon: TrendingUp, className: "bg-accent-soft text-accent" },
  new: { label: "New", icon: Zap, className: "bg-info/15 text-info" },
  top_rated: { label: "Top Rated", icon: Star, className: "bg-success/15 text-success" },
  limited_time: { label: "Limited Time", icon: Zap, className: "bg-danger/15 text-danger" },
  price_drop: { label: "Price Drop", icon: TrendingUp, className: "bg-warning/15 text-warning" },
  award_winner: { label: "Award Winner", icon: Award, className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  staff_pick: { label: "Staff Pick", icon: Star, className: "bg-accent-soft text-accent" },
};

export function AffiliateBadge({ type }: { type: AffiliateBadgeType }) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide", config.className)}>
      <Icon className="h-3 w-3" /> {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Geo Routing Display — show where a product ships from              */
/* ------------------------------------------------------------------ */

export function GeoRoutingBadge({ product }: { product: Product }) {
  // In production, this would read from the store's geo-IP routing config
  const regions: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "European Union": "🇪🇺",
    "India": "🇮🇳",
    "Australia": "🇦🇺",
    "Global": "🌍",
  };

  const partnerCountry = product.affiliatePartner
    ? regions[product.affiliatePartner] || "🌍"
    : "🌍";

  return (
    <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted">
      <Globe className="h-3 w-3" />
      Ships from {partnerCountry}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Commission Disclosure — transparent affiliate disclosure           */
/* ------------------------------------------------------------------ */

export function CommissionDisclosure({ rate }: { rate?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.6rem] text-muted">
      <Percent className="h-2.5 w-2.5" />
      {rate ? `${rate}% commission · ` : ""}
      As an affiliate, we may earn
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Affiliate Product Card — premium card for affiliate items          */
/* ------------------------------------------------------------------ */

export function AffiliateProductCard({
  product,
  badge,
  className,
}: {
  product: Product;
  badge?: AffiliateBadgeType;
  className?: string;
}) {
  if (!product.affiliate) return null;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[var(--radius-xl2)] bg-surface2">
        <Link
          to={`/product/${product.slug}`}
          className="block aspect-[4/5] overflow-hidden"
          aria-label={product.name}
        >
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-[900ms] ease-out group-hover:scale-[1.04]"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {badge && <AffiliateBadge type={badge} />}
          <Badge variant="affiliate">Affiliate</Badge>
        </div>
      </div>

      <div className="mt-3.5 flex flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] font-medium uppercase tracking-wider text-accent">
            {product.affiliatePartner || "Partner"}
          </span>
          <GeoRoutingBadge product={product} />
        </div>
        <h3 className="mt-1 font-medium leading-snug text-ink">
          <Link to={`/product/${product.slug}`} className="link-line">{product.name}</Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Stars rating={product.rating} size={12} />
          <span className="font-medium text-ink">{product.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span>{product.reviewCount} reviews</span>
        </div>
        <div className="mt-2">
          <Price price={product.price} salePrice={product.salePrice} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <a
            href={product.affiliateUrl || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="btn-dark btn-sm flex-1"
          >
            Shop now <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <Link
            to={`/product/${product.slug}`}
            className="btn-ghost btn-sm"
          >
            Details
          </Link>
        </div>
        <div className="mt-2">
          <CommissionDisclosure rate={product.affiliateCommission} />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Affiliate Geo Selector — dynamic geo-routing display               */
/* ------------------------------------------------------------------ */

export function AffiliateGeoSelector({ product }: { product: Product }) {
  const { affiliates } = useStore();

  const activeAffiliates = useMemo(
    () => affiliates.filter((a) => a.active),
    [affiliates]
  );

  if (!product.affiliate || activeAffiliates.length === 0) return null;

  const regions = [
    { country: "United States", icon: "🇺🇸", partner: activeAffiliates[0] },
    { country: "United Kingdom", icon: "🇬🇧", partner: activeAffiliates[activeAffiliates.length > 1 ? 1 : 0] },
    { country: "European Union", icon: "🇪🇺", partner: activeAffiliates[activeAffiliates.length > 1 ? 1 : 0] },
    { country: "India", icon: "🇮🇳", partner: activeAffiliates[0] },
    { country: "Australia", icon: "🇦🇺", partner: activeAffiliates[activeAffiliates.length > 1 ? 1 : 0] },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface2/30 p-3">
      <p className="text-xs font-semibold text-muted mb-2 flex items-center gap-1">
        <Globe className="h-3.5 w-3.5" /> Available in
      </p>
      <div className="flex flex-wrap gap-1.5">
        {regions.map((r) => (
          <span key={r.country} className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2 py-0.5 text-[0.6rem] text-muted">
            {r.icon} {r.country}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price History Display — inline price tracking                      */
/* ------------------------------------------------------------------ */

export function PriceHistoryDisplay({ product }: { product: Product }) {
  if (!product.salePrice) return null;

  const dropPercent = Math.round(((product.price - product.salePrice) / product.price) * 100);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-success">
      <TrendingUp className="h-3 w-3" />
      {dropPercent}% below regular price
    </span>
  );
}
