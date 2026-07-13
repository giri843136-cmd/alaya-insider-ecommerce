/**
 * ALAYA INSIDER — Executive Intelligence & Command Center (PART 3.8)
 * CEO/COO/CMO/CTO/CFO dashboards, business health, and command center.
 */
import { useState, useMemo } from "react";
import { Crown, Wrench, TrendingUp, Cpu, DollarSign, Activity, BarChart3, Target, Lightbulb, Shield, LayoutDashboard, Search, RefreshCw } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getExecutiveKpis, getBusinessHealthScores, getOverallBusinessHealth, getExecutiveWorkspaceStats, getExecutiveReports, generateExecutiveReport, getExecutiveInsights, getExecDecisions, type ExecutiveRole, type ReportPeriod } from "../../lib/executiveIntelligence";
import { ExecutiveMetricCard } from "../../components/executive/ExecutiveMetricCard";
import { formatDateTime } from "../../lib/utils";

type ExecTab = "ceo" | "coo" | "cto" | "cmo" | "cfo" | "command";

const ROLE_CONFIG: { id: ExecTab; label: string; icon: typeof Crown; color: string; roles: ExecutiveRole[] }[] = [
  { id: "command", label: "Command Center", icon: LayoutDashboard, color: "text-accent", roles: [] },
  { id: "ceo", label: "CEO Dashboard", icon: Crown, color: "text-accent", roles: ["ceo"] },
  { id: "coo", label: "COO Dashboard", icon: Wrench, color: "text-info", roles: ["coo"] },
  { id: "cmo", label: "CMO Dashboard", icon: TrendingUp, color: "text-success", roles: ["cmo"] },
  { id: "cto", label: "CTO Dashboard", icon: Cpu, color: "text-warning", roles: ["cto"] },
  { id: "cfo", label: "CFO Dashboard", icon: DollarSign, color: "text-danger", roles: ["cfo"] },
];

export default function AdminExecutiveIntelligence() {
  const [tab, setTab] = useState<ExecTab>("command");
  const [, forceRefresh] = useState(0);
  const refresh = () => forceRefresh((n) => n + 1);

  const stats = useMemo(() => getExecutiveWorkspaceStats(), []);
  const health = useMemo(() => getOverallBusinessHealth(), []);

  return (
    <>
      <Seo title="Executive Intelligence" path="/admin/executive-intelligence" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Executive Intelligence</h1>
            <p className="mt-1 text-sm text-muted">Enterprise command center — real-time business performance, KPIs, and strategic insights.</p>
          </div>
          <button onClick={refresh} className="btn-outline btn-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {ROLE_CONFIG.map((r) => (
            <button key={r.id} onClick={() => setTab(r.id)} className={cn("btn-sm capitalize", tab === r.id ? "btn-primary" : "btn-ghost")}>
              <r.icon className={cn("h-4 w-4", r.color)} /> {r.label}
            </button>
          ))}
        </div>

        {tab === "command" && <CommandCenterView stats={stats} health={health} />}
        {tab === "ceo" && <RoleDashboard role="ceo" />}
        {tab === "coo" && <RoleDashboard role="coo" />}
        {tab === "cmo" && <RoleDashboard role="cmo" />}
        {tab === "cto" && <RoleDashboard role="cto" />}
        {tab === "cfo" && <RoleDashboard role="cfo" />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  COMMAND CENTER                                                     */
/* ================================================================== */
function CommandCenterView({ stats, health }: { stats: ReturnType<typeof getExecutiveWorkspaceStats>; health: ReturnType<typeof getOverallBusinessHealth> }) {
  const allKpis = useMemo(() => getExecutiveKpis(), []);
  const healthScores = useMemo(() => getBusinessHealthScores(), []);
  const insights = useMemo(() => getExecutiveInsights(), []);
  const decisions = useMemo(() => getExecDecisions(), []);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredKpis = searchQuery ? allKpis.filter((k) => k.name.toLowerCase().includes(searchQuery.toLowerCase())) : allKpis;

  return (
    <div className="mt-6 space-y-6">
      {/* Executive Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input-field pl-9" placeholder="Search KPIs, reports, forecasts, decisions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: "KPIs Tracked", value: stats.totalKpis, sub: `${stats.kpisOnTrack} on track`, icon: Target, color: "text-accent" },
          { label: "Business Health", value: `${health.score}%`, sub: health.status, icon: Activity, color: health.status === "good" ? "text-success" : health.status === "critical" ? "text-danger" : "text-warning" },
          { label: "Reports", value: stats.totalReports, sub: "executive", icon: BarChart3, color: "text-info" },
          { label: "Forecasts", value: stats.totalForecasts, sub: `${stats.avgForecastConfidence}% conf`, icon: TrendingUp, color: "text-info" },
          { label: "Decisions", value: stats.totalDecisions, sub: `${stats.pendingDecisions} pending`, icon: Shield, color: stats.pendingDecisions > 0 ? "text-warning" : "text-muted" },
          { label: "Scenarios", value: stats.totalScenarios, sub: "what-if", icon: Target, color: "text-accent" },
          { label: "AI Insights", value: stats.totalInsights, sub: `${stats.criticalInsights} critical`, icon: Lightbulb, color: stats.criticalInsights > 0 ? "text-danger" : "text-muted" },
          { label: "Digital Twins", value: stats.twinSnapshots, sub: "active domains", icon: Activity, color: "text-success" },
        ].map((m) => (
          <div key={m.label} className="card p-3 text-center">
            <p className={cn("text-lg font-semibold", m.color)}>{m.value}</p>
            <p className="text-[0.55rem] text-muted uppercase tracking-wider mt-0.5">{m.label}</p>
            <p className="text-[0.5rem] text-muted">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* All KPIs */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Target className="h-4 w-4 text-accent" /> All Executive KPIs</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredKpis.map((kpi) => <ExecutiveMetricCard key={kpi.id} kpi={kpi} />)}
        </div>
      </div>

      {/* Business Health Matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> Business Health</h3>
          <div className="mt-4 space-y-3">
            {healthScores.map((h) => (
              <div key={h.area} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", h.status === "good" ? "bg-success" : h.status === "critical" ? "bg-danger" : "bg-warning")} />
                    <p className="text-sm font-medium text-ink capitalize">{h.area}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-surface2">
                      <div className={cn("h-full rounded-full", h.score >= 80 ? "bg-success" : h.score >= 60 ? "bg-warning" : "bg-danger")} style={{ width: `${h.score}%` }} />
                    </div>
                    <span className={cn("text-xs font-bold", h.score >= 80 ? "text-success" : h.score >= 60 ? "text-warning" : "text-danger")}>{h.score}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Lightbulb className="h-4 w-4 text-accent" /> AI Executive Insights</h3>
          <div className="mt-4 space-y-2">
            {insights.slice(0, 5).map((ins) => (
              <div key={ins.id} className="rounded-lg border border-line p-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("badge", ins.impact === "critical" ? "bg-danger/15 text-danger" : ins.impact === "high" ? "bg-warning/15 text-warning" : "bg-info/15 text-info")}>{ins.impact}</span>
                  <span className="text-xs font-medium text-ink">{ins.title}</span>
                </div>
                <p className="mt-1 text-[0.55rem] text-muted line-clamp-1">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Decisions */}
      {decisions.filter((d) => d.status === "pending" || d.status === "in_review").length > 0 && (
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Shield className="h-4 w-4 text-accent" /> Decisions Requiring Attention</h3>
          <div className="mt-4 space-y-2">
            {decisions.filter((d) => d.status === "pending" || d.status === "in_review").map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{d.title}</p>
                  <p className="text-xs text-muted">{d.category} · {d.impact} impact · {(d.confidence * 100).toFixed(0)}% confidence</p>
                </div>
                <span className={cn("badge capitalize", d.status === "in_review" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{d.status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  ROLE DASHBOARD                                                     */
/* ================================================================== */
function RoleDashboard({ role }: { role: ExecutiveRole }) {
  const kpis = useMemo(() => getExecutiveKpis(role), []);
  const reports = useMemo(() => getExecutiveReports(role), []);
  const insights = useMemo(() => getExecutiveInsights(role), []);

  return (
    <div className="mt-6 space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi) => <ExecutiveMetricCard key={kpi.id} kpi={kpi} />)}
      </div>

      {/* Generate Report */}
      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Generate Report</summary>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["daily", "weekly", "monthly", "quarterly", "annual"] as ReportPeriod[]).map((period) => (
            <button key={period} onClick={() => { generateExecutiveReport(role, period); }} className="btn-ghost btn-sm capitalize">
              Generate {period} report
            </button>
          ))}
        </div>
      </details>

      {/* Reports */}
      {reports.length > 0 && (
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-4 w-4 text-accent" /> {role.toUpperCase()} Reports</h3>
          <div className="mt-4 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.title}</p>
                    <p className="text-xs text-muted">{r.period} · {formatDateTime(r.generatedAt)}</p>
                  </div>
                  <span className={cn("badge capitalize", r.status === "final" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{r.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted line-clamp-1">{r.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Lightbulb className="h-4 w-4 text-accent" /> AI Insights</h3>
          <div className="mt-4 space-y-2">
            {insights.map((ins) => (
              <div key={ins.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className={cn("badge", ins.impact === "critical" ? "bg-danger/15 text-danger" : ins.impact === "high" ? "bg-warning/15 text-warning" : "bg-info/15 text-info")}>{ins.impact}</span>
                  <span className="text-sm font-medium text-ink">{ins.title}</span>
                  <span className="text-xs text-muted ml-auto">{(ins.confidence * 100).toFixed(0)}% conf</span>
                </div>
                <p className="mt-1 text-xs text-muted">{ins.description}</p>
                {ins.actionItems.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-[0.55rem] text-muted">
                    {ins.actionItems.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {kpis.length === 0 && reports.length === 0 && insights.length === 0 && (
        <EmptyState icon={<Target className="h-6 w-6" />} title="No data yet" description="Executive KPIs, reports, and AI insights will appear here." />
      )}
    </div>
  );
}
