/**
 * ALAYA INSIDER — Revenue Intelligence Admin (PART 3.5)
 * ------------------------------------------------------------------
 * Revenue analytics dashboard with forecasting, attribution,
 * AI insights, trends, and executive reporting.
 */
import { useMemo } from "react";
import { DollarSign, TrendingUp, PieChart, Eye, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { formatCompact } from "../../lib/utils";
import {
  getRevenueForecast, getRevenueAttribution, getCommissionAnalytics,
  getCommissionRecords,
} from "../../lib/affiliateCommerce";
import { RevenueOverviewCard, RevenueAttributionChart, RevenueForecastWidget, TopPartnerCard } from "../../components/RevenueIntelligence";

export default function AdminRevenueIntelligence() {
  const forecast = useMemo(() => getRevenueForecast(), []);
  const attribution = useMemo(() => getRevenueAttribution(), []);
  const analytics = useMemo(() => getCommissionAnalytics(), []);
  const records = useMemo(() => getCommissionRecords(), []);
  const totalRevenue = records.reduce((s, r) => s + r.saleAmount, 0);
  const totalCommission = records.reduce((s, r) => s + r.commissionAmount, 0);

  const revenueByMonth = useMemo(() => {
    const months = new Map<string, number>();
    records.forEach((r) => {
      const month = new Date(r.createdAt).toLocaleString("en-US", { month: "short", year: "2-digit" });
      months.set(month, (months.get(month) || 0) + r.saleAmount);
    });
    return Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [records]);

  return (
    <>
      <Seo title="Revenue Intelligence" path="/admin/revenue-intelligence" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Revenue Intelligence</h1>
            <p className="mt-1 text-sm text-muted">Revenue analytics, forecasting, attribution, and AI-powered insights for your affiliate commerce business.</p>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="mt-6">
          <RevenueOverviewCard />
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Attribution */}
            <RevenueAttributionChart />

            {/* Revenue Trend */}
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-4">
                <BarChart3 className="h-3.5 w-3.5" /> Revenue trend
              </p>
              {revenueByMonth.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No revenue data yet</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {revenueByMonth.map(([month, revenue]) => {
                    const max = Math.max(...revenueByMonth.map(([, r]) => r));
                    const height = max > 0 ? (revenue / max) * 100 : 0;
                    return (
                      <div key={month} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-accent/60 transition-all hover:bg-accent" style={{ height: `${Math.max(height, 4)}%` }} title={`${month}: $${revenue.toLocaleString()}`} />
                        <span className="text-[0.5rem] text-muted">{month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-4">
                <Sparkles className="h-3.5 w-3.5" /> AI Revenue insights
              </p>
              <ul className="space-y-3">
                {[
                  { icon: TrendingUp, text: `${forecast.growthRate}% growth projected next quarter — consider expanding into APAC markets for additional revenue streams.`, severity: "positive" as const },
                  { icon: PieChart, text: `${attribution[0]?.channel || "Direct Affiliate"} leads with ${Math.round((attribution[0]?.revenue || 0) / totalRevenue * 100)}% of attributed revenue. Optimise top-of-funnel channels.`, severity: "info" as const },
                  { icon: Eye, text: `Average commission rate of ${analytics.avgCommissionRate}% across ${records.length} transactions. Review tiered commission structure for top partners.`, severity: "info" as const },
                  { icon: DollarSign, text: `Top partner ${analytics.topPerformingPartner || "N/A"} drives significant revenue. Consider exclusive commission tiers to strengthen the relationship.`, severity: "positive" as const },
                ].map((insight, i) => {
                  const Icon = insight.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs", insight.severity === "positive" ? "bg-success/15 text-success" : "bg-info/15 text-info")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-sm text-muted">{insight.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <RevenueForecastWidget />
            <TopPartnerCard />

            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Executive summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Total revenue</span><span className="font-semibold text-ink">${formatCompact(totalRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Total commission</span><span className="font-semibold text-ink">${formatCompact(totalCommission)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Commission rate</span><span className="font-semibold text-ink">{totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(1) : "0.0"}%</span></div>
                <div className="flex justify-between"><span className="text-muted">Transactions</span><span className="font-semibold text-ink">{records.length}</span></div>
                <div className="flex justify-between"><span className="text-muted">Avg per transaction</span><span className="font-semibold text-ink">${records.length > 0 ? (totalRevenue / records.length).toFixed(0) : "0"}</span></div>
              </div>
            </div>

            <Link to="/admin/affiliate-analytics" className="card block p-4 hover:border-accent transition-colors">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent"><BarChart3 className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Affiliate Analytics</p>
                  <p className="text-xs text-muted">Detailed partner metrics</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
