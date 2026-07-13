/**
 * ALAYA INSIDER — Marketplace Selector & Comparison UI (PART 3.5)
 * ------------------------------------------------------------------
 * Interactive marketplace selector that shows prices across affiliate
 * networks, with geo-aware routing, availability badges, and offer display.
 */
import { useMemo, useState } from "react";
import { Globe, ArrowUpRight, Check, Percent, Clock, Zap, Tag, ExternalLink } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Price } from "./ui";
import { cn } from "@/utils/cn";
import type { Product } from "../lib/types";
import { getActiveMarketplaces, comparePrices, getActiveOffers, type MarketplaceConfig } from "../lib/affiliateCommerce";

/* ------------------------------------------------------------------ */
/*  Marketplace Badge                                                  */
/* ------------------------------------------------------------------ */

export function MarketplaceBadge({ marketplace }: { marketplace: MarketplaceConfig }) {
  const statusColors: Record<string, string> = {
    connected: "bg-success/15 text-success",
    syncing: "bg-info/15 text-info",
    disconnected: "bg-danger/15 text-danger",
    error: "bg-danger/15 text-danger",
    paused: "bg-warning/15 text-warning",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", statusColors[marketplace.status] || "bg-surface2 text-muted")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", marketplace.status === "connected" ? "bg-success" : marketplace.status === "error" ? "bg-danger" : "bg-warning")} />
      {marketplace.name}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Marketplaces Available — shows which networks a product is on      */
/* ------------------------------------------------------------------ */

export function MarketplacesAvailable(_product: Product) {
  const marketplaces = useMemo(() => getActiveMarketplaces(), []);

  if (marketplaces.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-3">
        <Globe className="h-3.5 w-3.5" /> Available on
      </p>
      <div className="flex flex-wrap gap-2">
        {marketplaces.map((mp) => (
          <MarketplaceBadge key={mp.id} marketplace={mp} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Comparison Widget — shows best price across networks         */
/* ------------------------------------------------------------------ */

export function PriceComparisonWidget({ product }: { product: Product }) {
  const { products } = useStore();
  const [selectedMp, setSelectedMp] = useState<string | null>(null);

  const marketplaces = useMemo(() => getActiveMarketplaces(), []);
  const comparison = useMemo(
    () => comparePrices(product.id, products, marketplaces),
    [product.id, products, marketplaces]
  );

  if (!product.affiliate || comparison.offers.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> Price comparison
        </p>
        {comparison.savingsPercent > 0 && (
          <span className="text-xs font-semibold text-success flex items-center gap-1">
            <Percent className="h-3 w-3" /> Save up to {comparison.savingsPercent}%
          </span>
        )}
      </div>
      <div className="space-y-2">
        {comparison.offers.map((offer) => {
          const isBest = offer.price === comparison.bestPrice;
          return (
            <button
              key={offer.marketplaceId}
              onClick={() => setSelectedMp(selectedMp === offer.marketplaceId ? null : offer.marketplaceId)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all",
                selectedMp === offer.marketplaceId
                  ? "border-accent bg-accent-soft"
                  : "border-line hover:border-accent/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{offer.marketplaceName}</span>
                {isBest && (
                  <span className="badge bg-success/15 text-success text-[0.55rem]">Best price</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("font-semibold", isBest ? "text-accent" : "text-muted")}>
                  <Price price={offer.price} />
                </span>
                {offer.inStock ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-xs text-danger">Sold out</span>
                )}
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Offer Cards — show active deals for a product                      */
/* ------------------------------------------------------------------ */

export function ActiveOffers({ product }: { product: Product }) {
  const offers = useMemo(() => getActiveOffers(product.id), [product.id]);

  if (offers.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
        <Zap className="h-3.5 w-3.5" /> Active offers
      </p>
      <div className="space-y-2">
        {offers.map((offer) => (
          <div key={offer.id} className="flex items-center justify-between rounded-lg border border-line p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{offer.title}</p>
              <p className="text-xs text-muted truncate">{offer.description}</p>
              {offer.couponCode && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[0.6rem] font-semibold text-accent">
                  Code: {offer.couponCode}
                </span>
              )}
            </div>
            <div className="ml-3 text-right">
              {offer.discountPercent && (
                <span className="text-sm font-semibold text-success">-{offer.discountPercent}%</span>
              )}
              <p className="text-xs text-muted flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.ceil((offer.endsAt - Date.now()) / 86400000)}d left
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Geo-Aware Marketplace Selector — for product detail page           */
/* ------------------------------------------------------------------ */

export function GeoMarketplaceSelector({ product, className }: { product: Product; className?: string }) {
  const [selectedRegion, setSelectedRegion] = useState("US");
  const marketplaces = useMemo(() => getActiveMarketplaces(), []);

  const regions = [
    { code: "US", label: "United States", flag: "🇺🇸" },
    { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
    { code: "EU", label: "European Union", flag: "🇪🇺" },
    { code: "AU", label: "Australia", flag: "🇦🇺" },
    { code: "IN", label: "India", flag: "🇮🇳" },
  ];

  const regionalMarketplaces = useMemo(() => {
    const regionMap: Record<string, string> = {
      US: "United States", GB: "United Kingdom", EU: "European Union",
      AU: "Australia", IN: "India",
    };
    return marketplaces.filter((m) =>
      m.countries.some((c) => c.toLowerCase().includes((regionMap[selectedRegion] || "").toLowerCase()))
    );
  }, [marketplaces, selectedRegion]);

  if (!product.affiliate || marketplaces.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
        <Globe className="h-3.5 w-3.5" /> Shop in
      </p>

      {/* Region selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {regions.map((r) => (
          <button
            key={r.code}
            onClick={() => setSelectedRegion(r.code)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors",
              selectedRegion === r.code
                ? "bg-accent text-accent-ink"
                : "bg-surface2 text-muted hover:text-ink"
            )}
          >
            <span>{r.flag}</span> {r.code}
          </button>
        ))}
      </div>

      {/* Marketplace links */}
      <div className="space-y-1.5">
        {regionalMarketplaces.map((mp) => (
          <a
            key={mp.id}
            href={product.affiliateUrl || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface2 group"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{mp.name}</span>
              {mp.avgConversionRate > 0.045 && (
                <span className="badge bg-success/15 text-success text-[0.55rem]">Top performer</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted group-hover:text-accent">
              <span className="text-xs">{mp.currencies.slice(0, 2).join(", ")}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
