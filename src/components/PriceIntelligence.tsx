/**
 * ALAYA INSIDER — Price Intelligence UI (PART 3.5)
 * ------------------------------------------------------------------
 * Price history charts, price comparison tables, price drop alerts,
 * and real-time price monitoring widgets for affiliate products.
 */
import { useMemo, useState } from "react";
import {
  TrendingDown, TrendingUp, Bell, BellOff, DollarSign,
  BarChart3, ArrowUpRight, Check, AlertTriangle
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Price, Badge } from "./ui";
import { cn } from "@/utils/cn";
import type { Product } from "../lib/types";
import {
  getPriceHistory, addPriceAlert, deletePriceAlert, getPriceAlerts,
  getActiveMarketplaces, comparePrices,
} from "../lib/affiliateCommerce";

/* ------------------------------------------------------------------ */
/*  Price History Chart — simple bar chart showing price over time     */
/* ------------------------------------------------------------------ */

export function PriceHistoryChart({ product }: { product: Product }) {
  const history = useMemo(() => getPriceHistory(product.id), [product.id]);

  if (history.length === 0) return null;

  const ph = history[0];
  const min = ph.lowestPrice;
  const max = ph.highestPrice;
  const range = max - min || 1;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
        <BarChart3 className="h-3.5 w-3.5" /> Price history
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Current</p>
          <p className="mt-0.5 text-sm font-semibold text-ink"><Price price={ph.currentPrice} /></p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Lowest</p>
          <p className="mt-0.5 text-sm font-semibold text-success"><Price price={ph.lowestPrice} /></p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Average</p>
          <p className="mt-0.5 text-sm font-semibold text-ink"><Price price={ph.averagePrice} /></p>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-16">
        {ph.records.map((r, i) => {
          const height = ((r.price - min) / range) * 100;
          const isLatest = i === ph.records.length - 1;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  isLatest ? "bg-accent" : "bg-accent/40"
                )}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${r.date}: $${r.price}`}
              />
              <span className="text-[0.5rem] text-muted">{r.date.slice(5)}</span>
            </div>
          );
        })}
      </div>

      {/* Change indicator */}
      {ph.priceChangePercent !== 0 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">Since first record</span>
          <span className={cn("flex items-center gap-1 font-medium", ph.priceChangePercent < 0 ? "text-success" : "text-danger")}>
            {ph.priceChangePercent < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {Math.abs(ph.priceChangePercent)}%
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Drop Alert Toggle — subscribe to price notifications         */
/* ------------------------------------------------------------------ */

export function PriceDropAlert({ product }: { product: Product }) {
  const [alertActive, setAlertActive] = useState(() => {
    return getPriceAlerts().some((a) => a.productId === product.id && a.active);
  });
  const [threshold, setThreshold] = useState(Math.round(product.salePrice ?? product.price * 0.9));

  const toggleAlert = () => {
    if (alertActive) {
      const existing = getPriceAlerts().find((a) => a.productId === product.id && a.active);
      if (existing) deletePriceAlert(existing.id);
      setAlertActive(false);
    } else {
      addPriceAlert({
        productId: product.id, productName: product.name,
        type: "price_drop", threshold, active: true, emailNotify: true,
      });
      setAlertActive(true);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Price alert
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {alertActive
              ? "We'll notify you when the price drops below your threshold."
              : "Set a target price and get notified when it drops."}
          </p>
        </div>
        <button
          onClick={toggleAlert}
          className={cn("btn-sm", alertActive ? "btn-primary" : "btn-ghost")}
        >
          {alertActive ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {alertActive ? "Active" : "Alert me"}
        </button>
      </div>

      {!alertActive && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Notify when below</span>
          <div className="relative flex-1">
            <DollarSign className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="input-field w-full pl-7 text-sm"
              min={1}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Comparison Table — detailed comparison across marketplaces   */
/* ------------------------------------------------------------------ */

export function PriceComparisonTable({ product }: { product: Product }) {
  const { products } = useStore();
  const marketplaces = useMemo(() => getActiveMarketplaces(), []);
  const comparison = useMemo(
    () => comparePrices(product.id, products, marketplaces),
    [product.id, products, marketplaces]
  );

  if (comparison.offers.length === 0) return null;

  const bestPrice = comparison.bestPrice;

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface2/60">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-muted">Marketplace</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted">Price</th>
            <th className="px-4 py-2.5 text-center font-medium text-muted">Status</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted">Link</th>
          </tr>
        </thead>
        <tbody>
          {comparison.offers.map((offer, i) => {
            const isBest = offer.price === bestPrice;
            const savings = bestPrice > 0 && !isBest
              ? Math.round(((offer.price - bestPrice) / bestPrice) * 100)
              : 0;
            return (
              <tr key={offer.marketplaceId} className={cn("border-t border-line", i % 2 === 0 ? "bg-surface" : "bg-surface2/20")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{offer.marketplaceName}</span>
                    {isBest && <Badge variant="success">Best</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn("font-semibold", isBest ? "text-accent" : "text-muted")}>
                    <Price price={offer.price} />
                  </span>
                  {savings > 0 && (
                    <p className="text-xs text-danger">+{savings}%</p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {offer.inStock ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success"><Check className="h-3 w-3" /> In stock</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-danger"><AlertTriangle className="h-3 w-3" /> Sold out</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="btn-ghost btn-sm"
                  >
                    Shop <ArrowUpRight className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Monitoring Badge — quick price change indicator              */
/* ------------------------------------------------------------------ */

export function PriceChangeBadge({ product }: { product: Product }) {
  const history = useMemo(() => getPriceHistory(product.id), [product.id]);

  if (history.length === 0) return null;

  const ph = history[0];
  if (Math.abs(ph.priceChangePercent) < 1) return null;

  const isDrop = ph.priceChangePercent < 0;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", isDrop ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
      {isDrop ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {Math.abs(ph.priceChangePercent)}%
    </span>
  );
}
