/**
 * ALAYA INSIDER — AI Executive Assistant (PART 3.8)
 * AI-powered executive coaching, insights, strategic recommendations,
 * and business intelligence advisories.
 */
import { useState, useMemo } from "react";
import { Bot, Sparkles, Lightbulb, TrendingUp, DollarSign, Search, BarChart3, Activity, Shield, Crown } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getExecutiveInsights, getExecutiveSearchResults, getOverallBusinessHealth, getExecDecisions, type ExecutiveRole } from "../../lib/executiveIntelligence";

const ROLE_TABS: { id: ExecutiveRole | "all"; label: string; icon: typeof Crown }[] = [
  { id: "all", label: "All Insights", icon: Sparkles },
  { id: "ceo", label: "CEO", icon: Crown },
  { id: "coo", label: "COO", icon: Activity },
  { id: "cmo", label: "CMO", icon: TrendingUp },
  { id: "cto", label: "CTO", icon: Bot },
  { id: "cfo", label: "CFO", icon: DollarSign },
];

export default function AdminExecutiveAI() {
  const [role, setRole] = useState<ExecutiveRole | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const insights = useMemo(() => {
    const all = getExecutiveInsights();
    return role === "all" ? all : all.filter((i) => i.role === role);
  }, [role]);
  const health = useMemo(() => getOverallBusinessHealth(), []);

  const searchResults = searchQuery.trim() ? getExecutiveSearchResults(searchQuery) : [];

  return (
    <>
      <Seo title="AI Executive Assistant" path="/admin/executive-ai" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Executive Assistant</h1>
            <p className="mt-1 text-sm text-muted">AI-powered business intelligence, strategic advisories, and executive coaching.</p>
          </div>
        </div>

        {/* Executive Search */}
        <div className="mt-6 card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input-field pl-9" placeholder="Search KPIs, reports, forecasts, decisions, scenarios..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted">{searchResults.length} results</p>
              {searchResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-surface2/40 px-3 py-1.5 text-xs">
                  <span className="badge bg-accent-soft text-accent">{r.type}</span>
                  <span className="font-medium text-ink">{r.title}</span>
                  <span className="text-muted">{r.subtitle}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {ROLE_TABS.map((r) => (
            <button key={r.id} onClick={() => setRole(r.id)} className={cn("btn-sm", role === r.id ? "btn-primary" : "btn-ghost")}>
              <r.icon className="h-4 w-4" /> {r.label}
            </button>
          ))}
        </div>

        {/* AI Daily Brief */}
        {role === "all" && (
          <div className="mt-6 card p-5 bg-gradient-to-br from-accent-soft/20 to-transparent">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Sparkles className="h-5 w-5" /></span>
              <div>
                <h3 className="font-semibold text-ink">AI Daily Business Brief</h3>
                <p className="mt-1 text-sm text-muted">
                  Good morning. Business health score is <strong className={health.status === "good" ? "text-success" : health.status === "critical" ? "text-danger" : "text-warning"}>{health.score}%</strong> ({health.status}).
                  Revenue tracking at $284,500 MTD with 1,240 orders. You have {getExecDecisions().filter((d) => d.status === "pending").length} decisions requiring your attention and {getExecutiveInsights().filter((i) => i.impact === "critical" || i.impact === "high").length} high-impact insights.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card p-4 text-center">
            <Lightbulb className="h-5 w-5 mx-auto text-accent" />
            <p className="mt-2 text-xl font-semibold text-ink">{insights.length}</p>
            <p className="text-xs text-muted">AI Insights</p>
          </div>
          <div className="card p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-info" />
            <p className="mt-2 text-xl font-semibold text-ink">{insights.filter((i) => i.impact === "critical" || i.impact === "high").length}</p>
            <p className="text-xs text-muted">High/Critical Impact</p>
          </div>
          <div className="card p-4 text-center">
            <Activity className="h-5 w-5 mx-auto text-success" />
            <p className="mt-2 text-xl font-semibold text-ink">{insights.filter((i) => i.confidence >= 0.85).length}</p>
            <p className="text-xs text-muted">High Confidence</p>
          </div>
        </div>

        {/* Insights by Type */}
        <div className="mt-6 space-y-3">
          {insights.map((ins) => (
            <div key={ins.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    ins.type === "alert" ? "bg-danger/15 text-danger" : ins.type === "opportunity" ? "bg-success/15 text-success" : ins.type === "recommendation" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent"
                  )}>
                    {ins.type === "alert" ? <Shield className="h-4 w-4" /> : ins.type === "opportunity" ? <TrendingUp className="h-4 w-4" /> : ins.type === "recommendation" ? <Lightbulb className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink">{ins.title}</p>
                      <span className={cn("badge capitalize", ins.impact === "critical" ? "bg-danger/15 text-danger" : ins.impact === "high" ? "bg-warning/15 text-warning" : "bg-info/15 text-info")}>{ins.impact}</span>
                      <span className="badge bg-surface2 text-muted capitalize">{ins.type}</span>
                      <span className="badge bg-surface2 text-muted">{ins.role.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{ins.description}</p>
                    {ins.actionItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-ink">Action Items:</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {ins.actionItems.map((a, i) => (
                            <li key={i} className="flex items-start gap-1 text-xs text-muted">
                              <span className="text-accent mt-0.5">→</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ins.relatedMetrics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ins.relatedMetrics.map((m, i) => (
                          <span key={i} className="badge bg-surface2 text-xs text-muted">{m.name}: <strong className="text-ink">{m.value}</strong></span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[0.55rem] text-muted shrink-0">{(ins.confidence * 100).toFixed(0)}% conf</span>
              </div>
            </div>
          ))}
          {insights.length === 0 && <EmptyState icon={<Sparkles className="h-6 w-6" />} title="No insights" description="AI-generated insights will appear here based on business data analysis." />}
        </div>
      </div>
    </>
  );
}
