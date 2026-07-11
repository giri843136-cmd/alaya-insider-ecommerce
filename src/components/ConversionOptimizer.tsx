/**
 * ALAYA INSIDER — Conversion Optimization UI (PART 3.5)
 * ------------------------------------------------------------------
 * Trust badges, click tracking widgets, A/B test displays,
 * conversion funnel visualization, and CTA optimization components.
 */
import { useMemo } from "react";
import {
  ShieldCheck, Star, Award, Zap, TrendingUp, MousePointerClick,
  ShoppingBag, ArrowRight, BarChart3, Check, Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getConversionFunnel, getConversionRate, getABTests } from "../lib/affiliateCommerce";

/* ------------------------------------------------------------------ */
/*  Trust Badge Set — conversion-optimizing trust indicators           */
/* ------------------------------------------------------------------ */

export type TrustBadgeType =
  | "editor_choice" | "verified_product" | "top_rated" | "trending_now"
  | "premium_pick" | "luxury_choice" | "best_value" | "limited_stock"
  | "price_drop" | "community_favorite";

const TRUST_BADGES: Record<TrustBadgeType, { label: string; icon: typeof Star; className: string; description: string }> = {
  editor_choice: { label: "Editor's Choice", icon: Star, className: "bg-accent-soft text-accent", description: "Hand-picked by our editorial team" },
  verified_product: { label: "Verified Product", icon: ShieldCheck, className: "bg-success/15 text-success", description: "Authenticity verified" },
  top_rated: { label: "Top Rated", icon: Award, className: "bg-amber-500/15 text-amber-600", description: "Highest-rated in category" },
  trending_now: { label: "Trending Now", icon: TrendingUp, className: "bg-accent-soft text-accent", description: "Popular this week" },
  premium_pick: { label: "Premium Pick", icon: Sparkles, className: "bg-ink text-canvas", description: "Our premium selection" },
  luxury_choice: { label: "Luxury Choice", icon: Award, className: "bg-ink text-canvas", description: "Curated luxury selection" },
  best_value: { label: "Best Value", icon: Zap, className: "bg-success/15 text-success", description: "Best price-to-quality ratio" },
  limited_stock: { label: "Limited Stock", icon: ShoppingBag, className: "bg-danger/15 text-danger", description: "Only a few left" },
  price_drop: { label: "Price Drop", icon: TrendingUp, className: "bg-warning/15 text-warning", description: "Price reduced" },
  community_favorite: { label: "Community Favorite", icon: Star, className: "bg-accent-soft text-accent", description: "Most saved by shoppers" },
};



export function TrustBadge({ type }: { type: TrustBadgeType }) {
  const config = TRUST_BADGES[type];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide", config.className)} title={config.description}>
      <Icon className="h-3 w-3" /> {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Conversion Funnel Chart — visual stage-by-stage funnel             */
/* ------------------------------------------------------------------ */

export function ConversionFunnelChart() {
  const funnel = useMemo(() => getConversionFunnel(), []);

  const maxCount = funnel[0]?.count || 1;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-4">
        <BarChart3 className="h-3.5 w-3.5" /> Conversion funnel
      </p>
      <div className="space-y-2">          {funnel.map((stage, i) => {
          const width = (stage.count / maxCount) * 100;
    
          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink capitalize">{stage.stage}</span>
                <span className="text-muted">{stage.count.toLocaleString()} · {Math.round(stage.rate * 100)}%</span>
              </div>
              <div className="relative h-6 w-full rounded-lg bg-surface2 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-lg transition-all",
                    i === funnel.length - 1 ? "bg-accent" : "bg-accent/40"
                  )}
                  style={{ width: `${Math.max(width, 2)}%` }}
                />
                {i > 0 && (
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[0.55rem] text-muted">
                    -{stage.dropOff.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted border-t border-line pt-3">
        <span>Overall conversion rate</span>
        <span className="font-semibold text-accent">{getConversionRate()}%</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  A/B Test Result Card — show test variant performance               */
/* ------------------------------------------------------------------ */

export function ABTestResultCard() {
  const tests = useMemo(() => getABTests(), []);

  if (tests.length === 0) return null;

  const latestTest = tests[tests.length - 1];

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
        <BarChart3 className="h-3.5 w-3.5" /> A/B Test: {latestTest.name}
      </p>
      <div className="space-y-3">
        {latestTest.variants.map((v) => {
          const conversionRate = v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : "0.0";
          const isWinner = latestTest.status === "completed" && latestTest.winner === v.id;
          return (
            <div key={v.id} className={cn("rounded-lg border p-3", isWinner ? "border-accent bg-accent-soft" : "border-line")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", isWinner ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>
                    {v.label.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-ink">{v.label}</span>
                  {isWinner && <span className="badge bg-accent text-accent-ink text-[0.55rem]">Winner</span>}
                </div>
                <span className="text-sm font-semibold text-ink">{conversionRate}%</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted">
                <span>{v.impressions.toLocaleString()} impressions</span>
                <span>{v.clicks.toLocaleString()} clicks</span>
                <span>${v.revenue.toLocaleString()} revenue</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA Performance Badge — show conversion-optimizing CTA indicators  */
/* ------------------------------------------------------------------ */

export function CTAPerformanceBadge({ clicks, impressions }: { clicks: number; impressions: number }) {
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
  const isGood = ctr >= 5;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", isGood ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
      <MousePointerClick className="h-3 w-3" />
      {ctr}% CTR
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust Signals Strip — horizontal trust indicators                  */
/* ------------------------------------------------------------------ */

export function TrustSignalsStrip() {
  const signals = [
    { icon: ShieldCheck, text: "Secure checkout" },
    { icon: Check, text: "Verified products" },
    { icon: ArrowRight, text: "30-day returns" },
    { icon: Star, text: "Editor curated" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {signals.map((s) => {
        const Icon = s.icon;
        return (
          <span key={s.text} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Icon className="h-3.5 w-3.5 text-accent" /> {s.text}
          </span>
        );
      })}
    </div>
  );
}
