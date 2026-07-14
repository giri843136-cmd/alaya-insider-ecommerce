/**
 * ALAYA INSIDER — Affiliate Analytics Dashboard (V6)
 * --------------------------------------------------------------------------
 * Enterprise analytics dashboard for the Global Affiliate Engine.
 * Displays real-time click/conversion/revenue data from PostgreSQL
 * via the backend API, with interactive charts, filters, and CSV export.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  BarChart3, TrendingUp, DollarSign, MousePointerClick,
  Globe, Smartphone, Monitor, Calendar,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { fetchAffiliateAnalytics, fetchClickStats } from "../../lib/affiliateApi";
import { getMerchantAnalytics, getMerchantClickEvents } from "../../lib/affiliateCommerce";

/* ================================================================== */
/*  STAT CARD                                                          */
/* ================================================================== */

function StatCard({ label, value, sub, icon: Icon, trend }: {
  label: string; value: string; sub?: string; icon: any; trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="card p-4 transition-all hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-ink tabular-nums">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
          {trend && (
            <p className={cn("mt-1 flex items-center gap-0.5 text-xs font-medium", trend.positive ? "text-success" : "text-danger")}>
              {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend.value)}% {trend.positive ? "increase" : "decrease"}
            </p>
          )}
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft/40">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TABLE COMPONENT                                                    */
/* ================================================================== */

function AnalyticsTable({ columns, rows, className }: {
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, any>[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line", className)}>
      <table className="w-full text-sm">
        <thead className="bg-surface2/60">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3", col.align === "right" && "text-right")}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                No data available yet. Start tracking affiliate clicks to see analytics.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-surface/60">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.align === "right" && "text-right")}>
                    {row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function AdminAffiliateAnalytics() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [clickStats, setClickStats] = useState<any>(null);

  // Fetch analytics from backend API
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [apiData, clicks] = await Promise.all([
        fetchAffiliateAnalytics(days),
        fetchClickStats(days),
      ]);
      if (apiData) setAnalytics(apiData);
      if (clicks) setClickStats(clicks);
    } catch { /* silent */ }
    setLoading(false);
  }, [days]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Also load local analytics for comparison
  const localAnalytics = useMemo(() => getMerchantAnalytics(days), [days]);
  const clickEvents = useMemo(() => getMerchantClickEvents(days), [days]);

  // Summary stats — prefer API data, fallback to local
  const stats = useMemo(() => {
    const api = analytics;
    const local = localAnalytics;

    return {
      totalClicks: api?.clicks?.total_clicks ?? local.totalClicks ?? 0,
      totalConversions: api?.conversions?.total_conversions ?? 0,
      totalRevenue: api?.conversions?.total_sales ?? local.totalRevenue ?? 0,
      totalCommission: api?.conversions?.total_commission ?? local.totalCommission ?? 0,
      avgOrderValue: api?.conversions?.avg_order_value ?? 0,
      avgCommissionRate: api?.conversions?.avg_commission_rate ?? 0,
      conversionRate: api?.conversions?.total_conversions > 0
        ? Math.round((api.conversions.total_conversions / (api.clicks?.total_clicks || 1)) * 10000) / 100
        : local.conversionRate ?? 0,
      ctr: local.overallCTR ?? 0,
      topMerchants: local.topMerchants ?? [],
      topCountries: local.topCountries ?? [],
      dailyConversions: api?.daily ?? [],
    };
  }, [analytics, localAnalytics]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("en-US").format(val);

  // Top merchants table data
  const topMerchantRows = useMemo(() =>
    stats.topMerchants.slice(0, 15).map((m: any) => ({
      merchant: m.merchantName || m.merchantId,
      clicks: formatNumber(m.clicks),
      impressions: formatNumber(m.impressions),
      ctr: `${m.ctr}%`,
      revenue: formatCurrency(m.revenue),
      commission: formatCurrency(m.commission),
      epc: formatCurrency(m.epc),
    })),
  [stats.topMerchants]);

  // Top countries table data
  const topCountryRows = useMemo(() =>
    stats.topCountries.slice(0, 10).map((c: any) => ({
      country: c.country,
      clicks: formatNumber(c.clicks),
      revenue: formatCurrency(c.revenue),
    })),
  [stats.topCountries]);

  return (
    <>
      <Seo title="Affiliate Analytics" path="/admin/affiliate-analytics" />
      <div className="p-5 pb-28 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Affiliate Analytics</h1>
            <p className="mt-1 text-sm text-muted">Real-time performance metrics for the Global Affiliate Engine.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="btn-ghost btn-md"
            >
              <BarChart3 className="h-4 w-4" />
              {loading ? "Loading..." : "Refresh"}
            </button>
            <div className="flex rounded-lg border border-line overflow-hidden">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    days === d ? "bg-accent text-white" : "text-muted hover:bg-surface2",
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total Clicks"
            value={formatNumber(stats.totalClicks)}
            sub="All affiliate links"
            icon={MousePointerClick}
          />
          <StatCard
            label="Conversions"
            value={formatNumber(stats.totalConversions)}
            sub={`${stats.conversionRate}% conversion rate`}
            icon={TrendingUp}
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            sub={`${formatCurrency(stats.avgOrderValue)} AOV`}
            icon={DollarSign}
          />
          <StatCard
            label="Commission"
            value={formatCurrency(stats.totalCommission)}
            sub={`${stats.avgCommissionRate}% avg rate`}
            icon={DollarSign}
          />
          <StatCard
            label="CTR"
            value={`${stats.ctr}%`}
            sub="Click-through rate"
            icon={BarChart3}
          />
          <StatCard
            label="EPC"
            value={stats.topMerchants.length > 0 ? formatCurrency(stats.topMerchants[0]?.epc || 0) : "$0.00"}
            sub="Earnings per click"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Row */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Daily Conversions Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">Daily Conversions</h3>
              <Calendar className="h-4 w-4 text-muted" />
            </div>
            {stats.dailyConversions.length > 0 ? (
              <div className="flex items-end gap-1 h-32" role="img" aria-label="Daily conversions chart">
                {stats.dailyConversions.slice(-30).map((d: any, i: number) => {
                  const maxVal = Math.max(...stats.dailyConversions.slice(-30).map((x: any) => Number(x.count || x.total_sales || 0)), 1);
                  const val = Number(d.count || d.total_sales || 0);
                  const height = (val / maxVal) * 100;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t bg-accent/50 transition-all hover:bg-accent"
                        style={{ height: `${Math.max(height, 3)}%` }}
                        title={`${d.date || d.day || ""}: ${val}`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted">
                No daily conversion data yet
              </div>
            )}
          </div>

          {/* Device Breakdown */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">Device Breakdown</h3>
              <Globe className="h-4 w-4 text-muted" />
            </div>
            {clickStats?.byDevice && clickStats.byDevice.length > 0 ? (
              <div className="space-y-3">
                {clickStats.byDevice.slice(0, 5).map((d: any, i: number) => {
                  const total = clickStats.byDevice.reduce((s: number, x: any) => s + Number(x.count || 0), 0) || 1;
                  const pct = Math.round((Number(d.count || 0) / total) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-ink">
                          {d.device_type === "mobile" ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                          {d.device_type || d.device || "Unknown"}
                        </span>
                        <span className="text-xs text-muted">{pct}% ({formatNumber(Number(d.count || 0))})</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted">
                <div className="text-center">
                  <Monitor className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  No device data yet
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Merchants Table */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Top Merchants
            </h3>
            <span className="text-xs text-muted">{stats.topMerchants.length} merchants with data</span>
          </div>
          <AnalyticsTable
            columns={[
              { key: "merchant", label: "Merchant" },
              { key: "clicks", label: "Clicks", align: "right" },
              { key: "impressions", label: "Impressions", align: "right" },
              { key: "ctr", label: "CTR", align: "right" },
              { key: "revenue", label: "Revenue", align: "right" },
              { key: "commission", label: "Commission", align: "right" },
              { key: "epc", label: "EPC", align: "right" },
            ]}
            rows={topMerchantRows}
          />
        </div>

        {/* Countries & Recent Clicks */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Top Countries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" />
                Top Countries
              </h3>
            </div>
            <AnalyticsTable
              columns={[
                { key: "country", label: "Country" },
                { key: "clicks", label: "Clicks", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={topCountryRows}
            />
          </div>

          {/* Recent Click Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-accent" />
                Recent Clicks
              </h3>
            </div>
            <div className="overflow-hidden rounded-xl border border-line max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface2/60 sticky top-0">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">Merchant</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {clickEvents.slice(0, 50).map((c: any) => (
                    <tr key={c.id} className="transition-colors hover:bg-surface/60">
                      <td className="px-4 py-2.5 text-sm text-ink">{c.merchantName || c.merchantId}</td>
                      <td className="px-4 py-2.5 text-sm text-muted max-w-[160px] truncate">{c.productName || c.productId}</td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-ink">${c.price?.toFixed(2) || "—"}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-muted hidden sm:table-cell">{c.country || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clickEvents.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  No recent click events. Merchants haven't been clicked yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Health Summary */}
        {analytics?.health && (
          <div className="mt-8 card p-5">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-accent" />
              Link Health Summary
            </h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted">Total Checks</p>
                <p className="text-lg font-bold text-ink">{formatNumber(analytics.health.total_checks)}</p>
              </div>
              <div>
                <p className="text-muted">Healthy</p>
                <p className="text-lg font-bold text-success">{formatNumber(analytics.health.healthy_count)}</p>
              </div>
              <div>
                <p className="text-muted">Broken</p>
                <p className="text-lg font-bold text-danger">{formatNumber(analytics.health.broken_count)}</p>
              </div>
              <div>
                <p className="text-muted">Avg Response</p>
                <p className="text-lg font-bold text-ink">{analytics.health.avg_response_time || 0}ms</p>
              </div>
            </div>
          </div>
        )}

        {/* Totals summary */}
        {analytics?.totals && (
          <div className="mt-4 card p-5">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-accent" />
              Platform Totals
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted">Networks</p>
                <p className="text-lg font-bold text-ink">{analytics.totals.totalNetworks}</p>
              </div>
              <div>
                <p className="text-muted">Accounts</p>
                <p className="text-lg font-bold text-ink">{analytics.totals.totalAccounts}</p>
              </div>
              <div>
                <p className="text-muted">Active Links</p>
                <p className="text-lg font-bold text-ink">{analytics.totals.totalLinks}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
