/**
 * ALAYA INSIDER — Revenue Intelligence UI (PART 3.5)
 * ------------------------------------------------------------------
 * Revenue dashlets, forecasting widgets, attribution breakdown,
 * and revenue analytics components for the affiliate commerce platform.
 */
import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, PieChart,
  Calendar, Percent, Eye,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCompact } from "../lib/utils";
import { getRevenueForecast, getRevenueAttribution, getCommissionAnalytics } from "../lib/affiliateCommerce";

/* ------------------------------------------------------------------ */
/*  Revenue Overview Card — key revenue metrics                        */
/* ------------------------------------------------------------------ */

export function RevenueOverviewCard() {
  const forecast = useMemo(() => getRevenueForecast(), []);
  const analytics = useMemo(() => getCommissionAnalytics(), []);

  const metrics = [
    { label: "Total Commission Earned", value: `$${formatCompact(analytics.totalCommissionEarned)}`, change: 12.5, trend: "up" as const, icon: DollarSign },
    { label: "Pending Commission", value: `$${formatCompact(analytics.totalCommissionPending)}`, change: 8.3, trend: "up" as const, icon: DollarSign },
    { label: "Paid Commission", value: `$${formatCompact(analytics.totalCommissionPaid)}`, change: 15.2, trend: "up" as const, icon: DollarSign },
    { label: "Avg Commission Rate", value: `${analytics.avgCommissionRate}%`, change: -2.1, trend: "down" as const, icon: Percent },
    { label: "Monthly Forecast", value: `$${formatCompact(forecast.currentMonth)}`, change: forecast.growthRate, trend: "up" as const, icon: TrendingUp },
    { label: "Next Quarter", value: `$${formatCompact(forecast.nextQuarter)}`, change: 12, trend: "up" as const, icon: Calendar },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="card p-3">
            <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted">
              <Icon className="h-3 w-3" /> {m.label}
            </div>
            <p className="mt-1.5 text-lg font-semibold text-ink">{m.value}</p>
            <span className={cn("inline-flex items-center gap-0.5 text-[0.6rem] font-medium", m.trend === "up" ? "text-success" : "text-danger")}>
              {m.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(m.change)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Attribution Breakdown                                     */
/* ------------------------------------------------------------------ */

export function RevenueAttributionChart() {
  const attribution = useMemo(() => getRevenueAttribution(), []);

  const totalRevenue = attribution.reduce((s, a) => s + a.revenue, 0);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-4">
        <PieChart className="h-3.5 w-3.5" /> Revenue attribution
      </p>
      <div className="space-y-3">
        {attribution.map((item) => {
          const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
          const colorMap: Record<string, string> = {
            affiliate: "bg-accent", organic_search: "bg-info", email: "bg-success",
            social: "bg-warning", referral: "bg-danger",
          };
          return (
            <div key={item.channel}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", colorMap[item.attributedTo] || "bg-line")} />
                  <span className="font-medium text-ink">{item.channel}</span>
                  {item.lastClick && <span className="badge bg-accent-soft text-accent text-[0.5rem]">Last click</span>}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-ink">${formatCompact(item.revenue)}</span>
                  <span className="ml-2 text-muted">({Math.round(pct)}%)</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                <div className={cn("h-full rounded-full", colorMap[item.attributedTo] || "bg-line")} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-0.5 flex justify-between text-[0.55rem] text-muted">
                <span>{item.orders} orders · {Math.round(item.conversionRate * 100)}% conv.</span>
                <span>{item.touchpoints} touchpoints</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Forecast Widget                                           */
/* ------------------------------------------------------------------ */

export function RevenueForecastWidget() {
  const forecast = useMemo(() => getRevenueForecast(), []);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-4">
        <Eye className="h-3.5 w-3.5" /> Revenue forecast
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Current month</p>
          <p className="mt-1 text-xl font-semibold text-ink">${formatCompact(forecast.currentMonth)}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Next month</p>
          <p className="mt-1 text-xl font-semibold text-ink">${formatCompact(forecast.nextMonth)}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">This quarter</p>
          <p className="mt-1 text-xl font-semibold text-ink">${formatCompact(forecast.thisQuarter)}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] font-medium uppercase tracking-wider text-muted">Next quarter</p>
          <p className="mt-1 text-xl font-semibold text-ink">${formatCompact(forecast.nextQuarter)}</p>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-3 flex items-center justify-between text-xs text-muted">
        <span>Growth rate</span>
        <span className="flex items-center gap-1 font-semibold text-success">
          <TrendingUp className="h-3 w-3" /> {forecast.growthRate}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Partner Card — top-performing affiliate partner                */
/* ------------------------------------------------------------------ */

export function TopPartnerCard() {
  const analytics = useMemo(() => getCommissionAnalytics(), []);

  if (analytics.commissionByPartner.length === 0) return null;          const topPartner = analytics.commissionByPartner.sort((a: { earned: number }, b: { earned: number }) => b.earned - a.earned)[0];

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Top Partner</p>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
          {topPartner.partnerName.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink truncate">{topPartner.partnerName}</p>
          <p className="text-xs text-muted">Earned ${formatCompact(topPartner.earned)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-success">${formatCompact(topPartner.earned)}</p>
          <p className="text-[0.55rem] text-muted">${formatCompact(topPartner.pending)} pending</p>
        </div>
      </div>
    </div>
  );
}
