/**
 * ALAYA INSIDER — AI Business Operations (PART 3.7)
 * Revenue forecasting, affiliate optimization, SEO intelligence,
 * product research, competitor analysis, and business recommendations.
 */
import { useState, useMemo } from "react";
import { DollarSign, Globe, Search, Target, BarChart3, Lightbulb, Activity } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getBusinessInsights, getBusinessInsightStats } from "../../lib/aiWorkspace";
import { useStore } from "../../context/StoreContext";

type BizTab = "insights" | "revenue" | "affiliate" | "seo";

export default function AdminAiBusinessOps() {
  const [tab, setTab] = useState<BizTab>("insights");
  const { products, orders, affiliates, customers } = useStore();
  const insights = useMemo(() => getBusinessInsights(), []);
  const insightStats = useMemo(() => getBusinessInsightStats(), []);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const affiliateProducts = products.filter((p) => p.affiliate);
  const affiliateRevenue = affiliateProducts.reduce((s, p) => {
    const partner = affiliates.find((a) => a.name === p.affiliatePartner);
    return s + (partner ? (p.price * partner.commission) / 100 : 0);
  }, 0);

  return (
    <>
      <Seo title="AI Business Operations" path="/admin/ai-business-ops" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Business Operations</h1>
            <p className="mt-1 text-sm text-muted">Revenue intelligence, affiliate optimization, SEO insights, and business recommendations.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {([["insights", "Recommendations", Lightbulb], ["revenue", "Revenue", DollarSign], ["affiliate", "Affiliate", Globe], ["seo", "SEO", Search]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("btn-sm capitalize", tab === id ? "btn-primary" : "btn-ghost")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "insights" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total Insights", value: insightStats.total, icon: Lightbulb },
                { label: "Critical", value: insightStats.critical, color: "text-danger", icon: Activity },
                { label: "High Priority", value: insightStats.high, color: "text-warning", icon: Target },
                { label: "Avg Confidence", value: `${insightStats.avgConfidence}%`, icon: BarChart3 },
              ].map((m) => (
                <div key={m.label} className="card p-4 text-center">
                  <m.icon className={cn("h-5 w-5 mx-auto", m.color || "text-accent")} />
                  <p className={cn("mt-2 text-xl font-semibold", m.color || "text-ink")}>{m.value}</p>
                  <p className="text-xs text-muted">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {insights.map((ins) => (
                <div key={ins.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", ins.impact === "critical" ? "bg-danger/15" : ins.impact === "high" ? "bg-warning/15" : "bg-info/15")}>
                        <Lightbulb className={cn("h-5 w-5", ins.impact === "critical" ? "text-danger" : ins.impact === "high" ? "text-warning" : "text-info")} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink">{ins.title}</h3>
                          <Badge variant={ins.impact === "critical" ? "warning" : ins.impact === "high" ? "warning" : "info"}>{ins.impact}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted">{ins.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-accent-soft/20 p-3">
                    <p className="text-xs font-medium text-accent">Recommendation</p>
                    <p className="text-sm text-ink mt-0.5">{ins.recommendation}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[0.55rem] text-muted">
                    <span className="capitalize">{ins.category}</span>
                    <span>· Confidence: {ins.confidence}%</span>
                    {Object.entries(ins.metrics).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="badge bg-surface2">{k}: {typeof v === "number" && v > 1000 ? v.toLocaleString() : v}</span>
                    ))}
                  </div>
                </div>
              ))}
              {insights.length === 0 && <EmptyState icon={<Lightbulb className="h-6 w-6" />} title="No insights yet" description="AI-generated business insights will appear here." />}
            </div>
          </div>
        )}

        {tab === "revenue" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="card p-4 text-center"><p className="text-xs text-muted">Total Revenue</p><p className="text-xl font-semibold text-ink mt-1">${totalRevenue.toLocaleString()}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Total Orders</p><p className="text-xl font-semibold text-ink mt-1">{orders.length.toLocaleString()}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">AOV</p><p className="text-xl font-semibold text-ink mt-1">${orders.length ? (totalRevenue / orders.length).toFixed(0) : "0"}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Customers</p><p className="text-xl font-semibold text-ink mt-1">{customers.length.toLocaleString()}</p></div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Revenue Forecast Insights</h3>
              <ul className="space-y-2">
                {insights.filter((i) => i.category === "revenue").map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[0.5rem] font-bold text-accent">AI</span>
                    <span>{i.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "affiliate" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="card p-4 text-center"><p className="text-xs text-muted">Affiliate Products</p><p className="text-xl font-semibold text-ink mt-1">{affiliateProducts.length}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Affiliate Partners</p><p className="text-xl font-semibold text-ink mt-1">{affiliates.length}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Est. Commission Revenue</p><p className="text-xl font-semibold text-ink mt-1">${affiliateRevenue.toFixed(0)}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Active Partners</p><p className="text-xl font-semibold text-ink mt-1">{affiliates.filter((a) => a.active).length}</p></div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Globe className="h-5 w-5 text-accent" /> Affiliate Intelligence</h3>
              <ul className="space-y-2">
                {insights.filter((i) => i.category === "affiliate").map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[0.5rem] font-bold text-accent">AI</span>
                    <span>{i.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "seo" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-4 text-center"><p className="text-xs text-muted">Total Products</p><p className="text-xl font-semibold text-ink mt-1">{products.length}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Categories</p><p className="text-xl font-semibold text-ink mt-1">{new Set(products.map((p) => p.category)).size}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">SEO Insights</p><p className="text-xl font-semibold text-ink mt-1">{insights.filter((i) => i.category === "seo").length}</p></div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Search className="h-5 w-5 text-accent" /> SEO Intelligence</h3>
              <ul className="space-y-2">
                {insights.filter((i) => i.category === "seo" || i.category === "content").map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[0.5rem] font-bold text-accent">AI</span>
                    <span>{i.recommendation}</span>
                  </li>
                ))}
                {insights.filter((i) => i.category === "seo" || i.category === "content").length === 0 && (
                  <p className="text-sm text-muted text-center py-4">No SEO insights generated yet.</p>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
