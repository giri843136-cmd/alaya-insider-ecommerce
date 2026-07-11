/**
 * ALAYA INSIDER — Executive Center (PART 3.6)
 * ------------------------------------------------------------------
 * Executive dashboards: CEO, COO, CMO, CTO, Finance views with
 * AI-powered insights and cross-department metrics.
 */
import { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, BarChart3,
  Sparkles, Percent, Award, Globe,
  Brain, Target, Briefcase, PieChart, Activity,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { formatCompact } from "../../lib/utils";
import { useStore } from "../../context/StoreContext";
import { getBusinessOverview, getPlatformHealth, getAdminPortalStats } from "../../lib/adminPortal";

type ExecutiveView = "ceo" | "coo" | "cmo" | "cto" | "finance";

const EXECUTIVE_VIEWS: { id: ExecutiveView; label: string; icon: typeof Briefcase; description: string }[] = [
  { id: "ceo", label: "CEO Dashboard", icon: Award, description: "High-level strategic overview and growth metrics" },
  { id: "coo", label: "COO Dashboard", icon: Activity, description: "Operations, efficiency, and platform health" },
  { id: "cmo", label: "CMO Dashboard", icon: Target, description: "Marketing performance, campaigns, and growth" },
  { id: "cto", label: "CTO Dashboard", icon: Brain, description: "Technology stack, AI usage, and development velocity" },
  { id: "finance", label: "Finance Dashboard", icon: DollarSign, description: "Revenue, costs, forecasts, and profitability" },
];

export default function AdminExecutiveCenter() {
  const { products, orders, customers, affiliates, settings } = useStore();
  const [view, setView] = useState<ExecutiveView>("ceo");

  const bizOverview = useMemo(() => {
    const affiliateProducts = products.filter((p) => p.affiliate);
    return getBusinessOverview(orders, products, customers, affiliateProducts, affiliates);
  }, [orders, products, customers, affiliates]);

  const health = useMemo(() => getPlatformHealth(), []);
  const stats = useMemo(() => getAdminPortalStats(), []);

  return (
    <>
      <Seo title="Executive Center" path="/admin/executive-center" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Executive Center</h1>
            <p className="mt-1 text-sm text-muted">Strategic dashboards for leadership across every department.</p>
          </div>
        </div>

        {/* View selector tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {EXECUTIVE_VIEWS.map((v) => {
            const Icon = v.icon;
            const isActive = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)} className={cn("card flex items-center gap-2 px-4 py-3 text-left transition-all", isActive && "ring-2 ring-accent")}>
                <span className={cn("grid h-8 w-8 place-items-center rounded-full", isActive ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className={cn("text-sm font-semibold", isActive ? "text-accent" : "text-ink")}>{v.label}</p>
                  <p className="text-[0.55rem] text-muted">{v.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* CEO Dashboard */}
        {view === "ceo" && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Total Revenue", value: settings.currency.symbol + formatCompact(bizOverview.totalRevenue), change: bizOverview.revenueGrowth, icon: DollarSign },
                { label: "Orders", value: String(bizOverview.totalOrders), change: bizOverview.orderGrowth, icon: ShoppingBag },
                { label: "Customers", value: String(bizOverview.totalCustomers), change: bizOverview.customerGrowth, icon: Users },
                { label: "AOV", value: settings.currency.symbol + Math.round(bizOverview.avgOrderValue), change: 3.2, icon: BarChart3 },
                { label: "Conversion", value: `${bizOverview.conversionRate.toFixed(1)}%`, change: 1.5, icon: Percent },
                { label: "Affiliate Rev.", value: settings.currency.symbol + formatCompact(bizOverview.totalAffiliateRevenue), change: bizOverview.affiliateRevenueGrowth, icon: Globe },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="card p-4">
                    <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted"><Icon className="h-3 w-3" />{m.label}</div>
                    <p className="mt-2 text-xl font-semibold text-ink">{m.value}</p>
                    <span className={cn("inline-flex items-center gap-0.5 text-[0.6rem] font-medium", m.change >= 0 ? "text-success" : "text-danger")}>
                      {m.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(m.change)}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink mb-4"><Sparkles className="h-5 w-5 text-accent" /> AI Executive Insights</h2>
              <ul className="space-y-3">
                {[
                  { icon: TrendingUp, text: `Revenue is tracking at $${formatCompact(bizOverview.totalRevenue)} with ${bizOverview.orderGrowth}% order growth — ahead of quarterly projections.` },
                  { icon: Users, text: `Customer acquisition grew ${bizOverview.customerGrowth}% this period. Focus on retention to maximise LTV.` },
                  { icon: Globe, text: `Affiliate revenue grew ${bizOverview.affiliateRevenueGrowth}% — expanding into APAC markets could accelerate this trend.` },
                  { icon: BarChart3, text: `Average order value of $${Math.round(bizOverview.avgOrderValue)} is healthy. Consider premium bundling to increase further.` },
                ].map((insight, i) => {
                  const Icon = insight.icon;
                  return <li key={i} className="flex items-start gap-3 text-sm text-muted"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icon className="h-4 w-4" /></span>{insight.text}</li>;
                })}
              </ul>
            </div>
          </div>
        )}

        {/* COO Dashboard */}
        {view === "coo" && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Platform Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn("h-3 w-3 rounded-full", health.status === "healthy" ? "bg-success" : "bg-danger")} />
                  <span className="text-lg font-semibold text-ink capitalize">{health.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{health.uptime}% uptime · {health.responseTime}ms avg</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Active Products</p>
                <p className="mt-2 text-lg font-semibold text-ink">{bizOverview.activeProducts} / {bizOverview.totalProducts}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Open Approvals</p>
                <p className="mt-2 text-lg font-semibold text-ink">{stats.pendingApprovals}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Active Incidents</p>
                <p className="mt-2 text-lg font-semibold text-ink">{stats.activeIncidents}</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink mb-3"><Activity className="h-5 w-5 text-accent" /> Service Status</h3>
              <div className="space-y-2">
                {health.services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", s.status === "operational" ? "bg-success" : s.status === "degraded" ? "bg-warning" : "bg-danger")} />
                      <span className="text-ink">{s.name}</span>
                    </div>
                    <span className="text-muted">{s.latency}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CMO Dashboard */}
        {view === "cmo" && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Active Campaigns</p>
                <p className="mt-2 text-lg font-semibold text-ink">3</p>
                <p className="text-xs text-success mt-1">+1 from last quarter</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Email Subscribers</p>
                <p className="mt-2 text-lg font-semibold text-ink">{customers.filter((c) => c.newsletter).length.toLocaleString()}</p>
                <p className="text-xs text-success mt-1">+12% growth rate</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Affiliate Partners</p>
                <p className="mt-2 text-lg font-semibold text-ink">{affiliates.filter((a) => a.active).length}</p>
                <p className="text-xs text-muted mt-1">Reach across {affiliates.length} networks</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink mb-3"><BarChart3 className="h-5 w-5 text-accent" /> Growth Metrics</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Customer acquisition cost", value: "$12.50", trend: "down", change: 8 },
                  { label: "Customer LTV", value: "$245", trend: "up", change: 15 },
                  { label: "Email open rate", value: "34.2%", trend: "up", change: 2.1 },
                  { label: "Social engagement", value: "+28%", trend: "up", change: 28 },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-line p-3">
                    <p className="text-xs text-muted">{m.label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-semibold text-ink">{m.value}</span>
                      <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", m.trend === "up" ? "text-success" : "text-danger")}>
                        {m.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {m.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTO Dashboard */}
        {view === "cto" && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">AI Models Active</p>
                <p className="mt-2 text-lg font-semibold text-ink">{stats.activeAiModels}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">AI Agents Active</p>
                <p className="mt-2 text-lg font-semibold text-ink">{stats.activeAiAgents}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">API Keys Active</p>
                <p className="mt-2 text-lg font-semibold text-ink">{stats.totalApiKeys}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Active Webhooks</p>
                <p className="mt-2 text-lg font-semibold text-ink">{stats.activeWebhooks}</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink mb-3"><Brain className="h-5 w-5 text-accent" /> AI Usage Overview</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Total Tokens Used", value: "1.26M", sub: "Across all models" },
                  { label: "Avg Response Time", value: "320ms", sub: "AI service latency" },
                  { label: "Success Rate", value: "96.2%", sub: "Last 30 days" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-line p-3 text-center">
                    <p className="text-xs text-muted">{m.label}</p>
                    <p className="text-xl font-semibold text-ink mt-1">{m.value}</p>
                    <p className="text-xs text-muted">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Finance Dashboard */}
        {view === "finance" && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Total Revenue</p>
                <p className="mt-2 text-xl font-semibold text-ink">{settings.currency.symbol}{formatCompact(bizOverview.totalRevenue)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Affiliate Revenue</p>
                <p className="mt-2 text-xl font-semibold text-ink">{settings.currency.symbol}{formatCompact(bizOverview.totalAffiliateRevenue)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Avg Order Value</p>
                <p className="mt-2 text-xl font-semibold text-ink">{settings.currency.symbol}{Math.round(bizOverview.avgOrderValue)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-muted">Revenue Growth</p>
                <p className="mt-2 flex items-center gap-1 text-xl font-semibold text-success"><TrendingUp className="h-5 w-5" /> {bizOverview.revenueGrowth}%</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink mb-4"><PieChart className="h-5 w-5 text-accent" /> Revenue Breakdown</h3>
              <div className="space-y-3">
                {[
                  { source: "Direct Sales", revenue: bizOverview.totalRevenue - bizOverview.totalAffiliateRevenue, percent: 62 },
                  { source: "Affiliate Commissions", revenue: bizOverview.totalAffiliateRevenue, percent: 23 },
                  { source: "Digital Products", revenue: 0, percent: 10 },
                  { source: "Referral Program", revenue: 0, percent: 5 },
                ].filter((s) => s.revenue > 0 || s.percent > 0).map((s) => (
                  <div key={s.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink">{s.source}</span>
                      <span className="font-semibold text-ink">{s.percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface2">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${s.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
