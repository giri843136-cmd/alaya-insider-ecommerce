/**
 * ALAYA INSIDER — Enterprise Business Intelligence Admin UI
 * Tab-based dashboard for analytics, BI, data warehouse, reporting,
 * forecasting, decision support & multi-dimensional analysis.
 */
import { useState } from "react";
import {
  BarChart3, Database, Target, LayoutDashboard, TrendingUp,
  ShieldAlert, FileText, GitBranch, Globe, Users,
  Package, Megaphone, Activity, RefreshCw,
  XCircle, AlertTriangle, TrendingDown,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { useBusinessIntelligence } from "../../context/BusinessIntelligenceContext";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

type Tab =
  | "overview" | "warehouse" | "kpis" | "scorecards" | "dashboards"
  | "forecasts" | "anomalies" | "reports" | "scenarios"
  | "channels" | "cohorts" | "funnel" | "geo" | "customers"
  | "products" | "campaigns";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "warehouse", label: "Warehouse", icon: Database },
  { id: "kpis", label: "KPIs", icon: Target },
  { id: "scorecards", label: "Scorecards", icon: Target },
  { id: "dashboards", label: "Dashboards", icon: LayoutDashboard },
  { id: "forecasts", label: "Forecasts", icon: TrendingUp },
  { id: "anomalies", label: "Anomalies", icon: ShieldAlert },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "scenarios", label: "Scenarios", icon: GitBranch },
  { id: "channels", label: "Channels", icon: Globe },
  { id: "cohorts", label: "Cohorts", icon: Users },
  { id: "funnel", label: "Funnel", icon: TrendingDown },
  { id: "geo", label: "Geography", icon: Globe },
  { id: "customers", label: "Customers", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
];

export default function AdminBusinessIntelligence() {
  const { toast } = useToast();
  const ctx = useBusinessIntelligence();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <Seo title="Business Intelligence" path="/admin/business-intelligence" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Business Intelligence</h1>
            <p className="mt-1 text-sm text-muted">
              Enterprise analytics, KPIs, forecasts, dashboards &amp; decision support platform.
            </p>
          </div>
          <button onClick={() => { ctx.refresh(); toast.success("BI Platform refreshed"); }} className="btn-outline btn-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab ctx={ctx} />}
        {tab === "warehouse" && <WarehouseTab ctx={ctx} />}
        {tab === "kpis" && <KpisTab ctx={ctx} />}
        {tab === "scorecards" && <ScorecardsTab ctx={ctx} />}
        {tab === "dashboards" && <DashboardsTab ctx={ctx} />}
        {tab === "forecasts" && <ForecastsTab ctx={ctx} />}
        {tab === "anomalies" && <AnomaliesTab ctx={ctx} />}
        {tab === "reports" && <ReportsTab ctx={ctx} />}
        {tab === "scenarios" && <ScenariosTab ctx={ctx} />}
        {tab === "channels" && <ChannelsTab ctx={ctx} />}
        {tab === "cohorts" && <CohortsTab ctx={ctx} />}
        {tab === "funnel" && <FunnelTab ctx={ctx} />}
        {tab === "geo" && <GeoTab ctx={ctx} />}
        {tab === "customers" && <CustomersTab ctx={ctx} />}
        {tab === "products" && <ProductsTab ctx={ctx} />}
        {tab === "campaigns" && <CampaignsTab ctx={ctx} />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  OVERVIEW                                                           */
/* ================================================================== */
function OverviewTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { warehouseStats, kpiStats, dashboardStats, forecastStats, reportStats, metrics, dashboards } = ctx;

  const cards = [
    { label: "Data Cubes", value: warehouseStats.activeCubes, sub: `${warehouseStats.totalSizeMb} MB total`, icon: Database, tone: "success" as const },
    { label: "KPIs Tracked", value: kpiStats.totalKpis, sub: `${kpiStats.onTrack} on track · ${kpiStats.atRisk} at risk`, icon: Target, tone: kpiStats.atRisk > 0 ? "warning" as const : "success" as const },
    { label: "Dashboards", value: dashboardStats.total, sub: `${dashboardStats.starred} starred · ${dashboardStats.executive} executive`, icon: LayoutDashboard, tone: "success" as const },
    { label: "Forecasts", value: forecastStats.totalForecasts, sub: `${forecastStats.avgConfidence}% avg confidence`, icon: TrendingUp, tone: "success" as const },
    { label: "Scheduled Reports", value: reportStats.scheduled, sub: `${reportStats.totalExecutions} total executions`, icon: FileText, tone: "success" as const },
    { label: "Critical Anomalies", value: forecastStats.criticalAnomalies, sub: `${forecastStats.totalAnomalies} total anomalies`, icon: ShieldAlert, tone: forecastStats.criticalAnomalies > 0 ? "danger" as const : "success" as const },
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className={cn(
                "grid h-10 w-10 place-items-center rounded-full",
                c.tone === "success" ? "bg-success/15 text-success" : c.tone === "warning" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
              )}><c.icon className="h-5 w-5" /></span>
              <span className={cn("h-2 w-2 rounded-full", c.tone === "success" ? "bg-success" : c.tone === "warning" ? "bg-warning" : "bg-danger")} />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="text-xs text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* BI Platform Metrics */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-4 w-4 text-accent" /> BI Platform Metrics</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.name} className="rounded-xl bg-surface2/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{m.name}</p>
                <span className={cn("text-xs font-medium",
                  m.trend === "up" && m.status === "good" ? "text-success" :
                  m.trend === "up" ? "text-danger" :
                  m.trend === "down" && m.status === "good" ? "text-success" :
                  m.trend === "down" ? "text-danger" : "text-muted"
                )}>
                  {m.changePercent > 0 ? "↑" : m.changePercent < 0 ? "↓" : "→"} {Math.abs(m.changePercent).toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold text-ink">
                {typeof m.value === "number" && m.value > 1000 ? m.value.toLocaleString() : m.value}
                {m.unit && <span className="text-xs font-normal text-muted ml-1">{m.unit}</span>}
              </p>
              <div className="mt-2 flex items-end gap-0.5 h-8">
                {m.sparkline.map((v, i) => (
                  <div key={i} className="w-1.5 rounded-t bg-accent/40" style={{ height: `${(v / Math.max(...m.sparkline)) * 100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Dashboards */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><LayoutDashboard className="h-4 w-4 text-accent" /> Featured Dashboards</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.filter((d) => d.starred).map((d) => (
            <div key={d.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{d.name}</p>
                  <p className="text-xs text-muted">{d.description}</p>
                </div>
                <span className="badge bg-accent-soft capitalize text-accent text-[0.55rem]">{d.scope}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span>{d.widgets.length} widgets</span>
                <span>· {d.owner}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  WAREHOUSE TAB (OLAP)                                              */
/* ================================================================== */
function WarehouseTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { dataCubes, materializedViews, warehouseStats } = ctx;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{warehouseStats.totalCubes}</p><p className="text-xs text-muted">Data Cubes</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{warehouseStats.totalMviews}</p><p className="text-xs text-muted">Materialized Views</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{warehouseStats.totalSizeMb} MB</p><p className="text-xs text-muted">Total Size</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{warehouseStats.activeCubes}</p><p className="text-xs text-muted">Active Cubes</p></div>
      </div>

      {/* Data Cubes */}
      <p className="mb-3 mt-4 text-sm font-semibold text-ink">OLAP Data Cubes</p>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {dataCubes.map((c) => (
          <div key={c.id} className={cn("card p-4", c.status === "active" ? "border-success/20" : c.status === "stale" ? "border-warning/20" : c.status === "failed" ? "border-danger/30" : "border-warning/20")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-8 w-8 place-items-center rounded-full",
                  c.status === "active" ? "bg-success/15 text-success" : c.status === "stale" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                )}><Database className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-muted capitalize">{c.schema} schema</p>
                </div>
              </div>
              <span className={cn("badge capitalize", c.status === "active" ? "bg-success/15 text-success" : c.status === "stale" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{c.status}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{c.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted">Fact:</span><p className="font-mono text-ink">{c.factTable}</p></div>
              <div><span className="text-muted">Rows:</span><p className="font-medium text-ink">{c.rowCount.toLocaleString()}</p></div>
              <div><span className="text-muted">Dimensions:</span><p className="text-ink">{c.dimensions.join(", ")}</p></div>
              <div><span className="text-muted">Measures:</span><p className="text-ink">{c.measures.join(", ")}</p></div>
            </div>
            <div className="mt-1 text-xs text-muted">
              <span>Refresh: {c.refreshInterval}</span>
              <span> · Size: {c.sizeMb} MB</span>
              <span> · Last: {formatDateTime(c.lastRefreshed)}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {c.tags.map((t) => <span key={t} className="badge bg-accent-soft text-accent text-[0.55rem]">{t}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Materialized Views */}
      <p className="mb-3 mt-6 text-sm font-semibold text-ink">Materialized Views</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {materializedViews.map((mv) => (
          <div key={mv.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-ink">{mv.name}</p>
                <p className="text-xs text-muted">{mv.sizeMb} MB · Hits: {mv.hitCount.toLocaleString()}</p>
              </div>
              <span className={cn("chip", mv.enabled && "chip-active")}>{mv.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p className="mt-1 font-mono text-[0.6rem] text-muted bg-surface2 rounded p-1 truncate">{mv.query}</p>
            <p className="mt-0.5 text-xs text-muted">Refresh: {mv.refreshInterval} · Last: {formatDateTime(mv.lastRefreshed)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  KPIs TAB                                                          */
/* ================================================================== */
function KpisTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { kpis, kpiStats } = ctx;

  const statusColor = (s: string) => {
    switch (s) {
      case "on_track": return "text-success";
      case "achieved": return "text-accent";
      case "at_risk": return "text-warning";
      case "behind": return "text-danger";
      default: return "text-muted";
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <span>{kpiStats.totalKpis} KPIs</span>
        <span className="text-success">{kpiStats.onTrack} on track</span>
        {kpiStats.atRisk > 0 && <span className="text-warning">{kpiStats.atRisk} at risk</span>}
        <span className="text-accent">{kpiStats.achieved} achieved</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.id} className={cn(
            "card p-5",
            k.status === "behind" && "border-danger/20",
            k.status === "at_risk" && "border-warning/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full",
                  k.status === "achieved" ? "bg-accent-soft text-accent" :
                  k.status === "on_track" ? "bg-success/15 text-success" :
                  k.status === "at_risk" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                )}><Target className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{k.name}</p>
                  <p className="text-xs text-muted capitalize">{k.category} · {k.frequency}</p>
                </div>
              </div>
              <span className={cn("badge capitalize", statusColor(k.status))}>{k.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{k.description}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{typeof k.currentValue === "number" && k.currentValue > 1000 ? k.currentValue.toLocaleString() : k.currentValue}{k.unit}</p>
                <p className="text-muted">Current</p>
              </div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{typeof k.targetValue === "number" && k.targetValue > 1000 ? k.targetValue.toLocaleString() : k.targetValue}{k.unit}</p>
                <p className="text-muted">Target</p>
              </div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className={cn("font-semibold", k.trend === "up" ? "text-success" : k.trend === "down" ? "text-danger" : "text-muted")}>
                  {k.trend === "up" ? "↑" : k.trend === "down" ? "↓" : "→"} {k.previousValue}{k.unit}
                </p>
                <p className="text-muted">Previous</p>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface2">
              <div className={cn("h-full rounded-full transition-all",
                (k.currentValue / k.targetValue) >= 1 ? "bg-accent" : (k.currentValue / k.targetValue) >= 0.7 ? "bg-success" : (k.currentValue / k.targetValue) >= 0.4 ? "bg-warning" : "bg-danger"
              )} style={{ width: `${Math.min(100, (k.currentValue / k.targetValue) * 100)}%` }} />
            </div>

            <div className="mt-2 text-xs text-muted">
              <span className="font-mono text-[0.55rem]">{k.formula}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SCORECARDS TAB                                                    */
/* ================================================================== */
function ScorecardsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { scorecards, okrs } = ctx;

  return (
    <div className="mt-6 space-y-6">
      {/* OKRs */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">OKRs</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {okrs.map((o) => (
            <div key={o.id} className={cn("card p-5",
              o.status === "behind" && "border-danger/20",
              o.status === "at_risk" && "border-warning/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full",
                    o.status === "completed" ? "bg-accent-soft text-accent" :
                    o.status === "on_track" ? "bg-success/15 text-success" :
                    o.status === "at_risk" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                  )}><Target className="h-4 w-4" /></span>
                  <div>
                    <p className="font-semibold text-ink">{o.objective}</p>
                    <p className="text-xs text-muted">{o.owner} · {o.quarter}</p>
                  </div>
                </div>
                <span className={cn("badge capitalize",
                  o.status === "completed" ? "bg-accent-soft text-accent" :
                  o.status === "on_track" ? "bg-success/15 text-success" :
                  o.status === "at_risk" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                )}>{o.status.replace(/_/g, " ")}</span>
              </div>

              <div className="mt-4 space-y-2">
                {o.keyResults.map((kr, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">{kr.label}</span>
                        <span className="text-ink font-medium">{kr.current}{kr.unit} / {kr.target}{kr.unit}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface2">
                        <div className={cn("h-full rounded-full", kr.current / kr.target >= 1 ? "bg-accent" : kr.current / kr.target >= 0.6 ? "bg-success" : "bg-warning")}
                          style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full", o.progress >= 80 ? "bg-accent" : o.progress >= 50 ? "bg-success" : o.progress >= 25 ? "bg-warning" : "bg-danger")}
                    style={{ width: `${o.progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-ink">{o.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scorecards */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Department Scorecards</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {scorecards.map((sc) => (
            <div key={sc.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{sc.name}</p>
                  <p className="text-xs text-muted capitalize">{sc.category}</p>
                </div>
                <span className={cn("text-lg font-bold", sc.trend === "up" ? "text-success" : sc.trend === "down" ? "text-danger" : "text-muted")}>
                  {sc.score}/100
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{sc.description}</p>
              <div className="mt-4 h-2 rounded-full bg-surface2">
                <div className={cn("h-full rounded-full", sc.score >= 80 ? "bg-success" : sc.score >= 60 ? "bg-warning" : "bg-danger")}
                  style={{ width: `${sc.score}%` }} />
              </div>
              <div className="mt-2 text-xs text-muted flex items-center justify-between">
                <span>{sc.period}</span>
                <span className={sc.trend === "up" ? "text-success" : sc.trend === "down" ? "text-danger" : "text-muted"}>
                  {sc.trend === "up" ? "↑" : sc.trend === "down" ? "↓" : "→"} {sc.previousScore} prev
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {sc.kpis.map((k) => <span key={k} className="badge bg-surface2 text-[0.5rem] text-muted">{k}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DASHBOARDS TAB                                                    */
/* ================================================================== */
function DashboardsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { dashboards, dashboardStats } = ctx;

  const scopeColor = (s: string) => {
    switch (s) {
      case "executive": return "bg-danger/15 text-danger";
      case "department": return "bg-accent-soft text-accent";
      case "personal": return "bg-success/15 text-success";
      default: return "bg-surface2 text-muted";
    }
  };

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{dashboardStats.total}</p><p className="text-xs text-muted">Total</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-accent">{dashboardStats.executive}</p><p className="text-xs text-muted">Executive</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{dashboardStats.starred}</p><p className="text-xs text-muted">Starred</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {dashboards.map((d) => (
          <div key={d.id} className={cn("card p-5", d.starred && "border-accent/30")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><LayoutDashboard className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold text-ink">{d.name}</p>
                  <p className="text-xs text-muted">{d.description}</p>
                </div>
              </div>
              {d.starred && <span className="badge bg-accent-soft text-accent">★ Starred</span>}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{d.widgets.length}</p><p className="text-muted">Widgets</p></div>
              <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{d.refreshInterval}s</p><p className="text-muted">Refresh</p></div>
              <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink capitalize">{d.layout}</p><p className="text-muted">Layout</p></div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={cn("badge capitalize text-[0.55rem]", scopeColor(d.scope))}>{d.scope}</span>
              <span className="badge bg-surface2 text-[0.55rem] text-muted">{d.owner}</span>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Widgets ({d.widgets.length})</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {d.widgets.slice(0, 6).map((w) => (
                  <span key={w.id} className="badge bg-surface2 text-[0.5rem] text-muted">{w.type}</span>
                ))}
                {d.widgets.length > 6 && <span className="badge bg-surface2 text-[0.5rem] text-muted">+{d.widgets.length - 6} more</span>}
              </div>
            </div>

            <p className="mt-2 text-[0.55rem] text-muted">Created: {formatDateTime(d.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FORECASTS TAB                                                     */
/* ================================================================== */
function ForecastsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { forecasts, forecastStats } = ctx;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{forecastStats.totalForecasts}</p><p className="text-xs text-muted">Forecasts</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{forecastStats.avgConfidence}%</p><p className="text-xs text-muted">Avg Confidence</p></div>
        <div className="card p-3 text-center"><p className={cn("text-lg font-semibold", forecastStats.criticalAnomalies > 0 ? "text-danger" : "text-muted")}>{forecastStats.totalAnomalies}</p><p className="text-xs text-muted">Anomalies</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{forecastStats.criticalAnomalies}</p><p className="text-xs text-muted">Critical</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {forecasts.map((f) => {
          const pctChange = ((f.predictedValue - f.currentValue) / f.currentValue) * 100;
          return (
            <div key={f.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{f.name}</p>
                  <p className="text-xs text-muted">{f.period} · {f.methodology.replace(/_/g, " ")}</p>
                </div>
                <span className={cn("badge", f.confidence >= 0.8 ? "bg-success/15 text-success" : f.confidence >= 0.6 ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                  {(f.confidence * 100).toFixed(0)}% conf
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted">Current</p>
                  <p className="text-lg font-semibold text-ink">{typeof f.currentValue === "number" && f.currentValue > 1000 ? f.currentValue.toLocaleString() : f.currentValue}</p>
                </div>
                <div className="flex-1 text-center">
                  <span className={cn("text-lg font-bold", pctChange >= 0 ? "text-success" : "text-danger")}>
                    {pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange).toFixed(0)}%
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">Predicted</p>
                  <p className="text-lg font-semibold text-ink">{typeof f.predictedValue === "number" && f.predictedValue > 1000 ? f.predictedValue.toLocaleString() : f.predictedValue}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-muted">Range: {typeof f.lowerBound === "number" && f.lowerBound > 1000 ? f.lowerBound.toLocaleString() : f.lowerBound} – {typeof f.upperBound === "number" && f.upperBound > 1000 ? f.upperBound.toLocaleString() : f.upperBound}</p>
                <div className="mt-1 h-2 rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${((f.predictedValue - f.lowerBound) / (f.upperBound - f.lowerBound)) * 100}%` }} />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted">MAPE</span><p className="font-medium text-ink">{f.mape}%</p></div>
                <div><span className="text-muted">Seasonality</span><p className="font-medium text-ink">{f.seasonalityDetected ? "Detected" : "None"}</p></div>
              </div>

              <p className="mt-1 text-[0.55rem] text-muted">Generated: {formatDateTime(f.generatedAt)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ANOMALIES TAB                                                     */
/* ================================================================== */
function AnomaliesTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { anomalies } = ctx;

  const severityColor = (s: string) => {
    switch (s) {
      case "critical": return "bg-danger/15 text-danger";
      case "high": return "bg-warning/15 text-warning";
      case "medium": return "bg-accent-soft text-accent";
      default: return "bg-surface2 text-muted";
    }
  };

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{anomalies.length} anomaly events detected</p>

      {anomalies.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-muted">
          <ShieldAlert className="h-8 w-8" />
          <p className="text-sm">No anomalies detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a) => (
            <div key={a.id} className={cn("card p-4", a.severity === "critical" && "border-danger/30", a.severity === "high" && "border-warning/20")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("grid h-8 w-8 place-items-center rounded-full",
                      a.severity === "critical" ? "bg-danger/15 text-danger" : a.severity === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent"
                    )}>
                      {a.severity === "critical" ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </span>
                    <p className="font-semibold text-ink">{a.metric} — {a.date}</p>
                    <span className={cn("badge capitalize", severityColor(a.severity))}>{a.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{a.detail}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                    <span>Actual: <span className={a.deviation > 0 ? "text-danger" : "text-success"}>{a.actualValue}</span></span>
                    <span>Expected: {a.expectedValue}</span>
                    <span>Deviation: <span className={cn("font-medium", Math.abs(a.deviation) > 50 ? "text-danger" : "text-warning")}>{a.deviation > 0 ? "+" : ""}{a.deviation.toFixed(1)}%</span></span>
                  </div>
                </div>
                <span className={cn("badge capitalize",
                  a.status === "resolved" ? "bg-success/15 text-success" : a.status === "investigating" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted"
                )}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  REPORTS TAB                                                       */
/* ================================================================== */
function ReportsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { reports, reportExecutions, reportStats, generateReportById } = ctx;
  const { toast } = useToast();

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{reportStats.totalReports}</p><p className="text-xs text-muted">Reports</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{reportStats.scheduled}</p><p className="text-xs text-muted">Scheduled</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{reportStats.totalExecutions}</p><p className="text-xs text-muted">Executions</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{reportStats.avgRows.toLocaleString()}</p><p className="text-xs text-muted">Avg Rows</p></div>
      </div>

      {/* Report Definitions */}
      <p className="mb-3 mt-4 text-sm font-semibold text-ink">Report Definitions</p>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className={cn("card p-4", !r.enabled && "opacity-60")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent"><FileText className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-muted capitalize">{r.category} · {r.format.toUpperCase()}</p>
                </div>
              </div>
              <span className={cn("chip", r.enabled && "chip-active")}>{r.enabled ? "Active" : "Disabled"}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{r.description}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <span>Schedule: {r.schedule}</span>
              {r.lastGenerated && <span>· Last: {formatDateTime(r.lastGenerated)}</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {r.recipients.slice(0, 3).map((rec) => (
                <span key={rec} className="badge bg-surface2 text-[0.5rem] text-muted font-mono">{rec}</span>
              ))}
              {r.recipients.length > 3 && <span className="badge bg-surface2 text-[0.5rem] text-muted">+{r.recipients.length - 3}</span>}
            </div>
            <button onClick={() => { generateReportById(r.id); toast.success("Report generating", r.name); }} className="btn-ghost btn-sm mt-2">
              Generate Now
            </button>
          </div>
        ))}
      </div>

      {/* Recent Executions */}
      {reportExecutions.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-ink">Recent Executions</p>
          <div className="card overflow-hidden">
            <div className="hide-scrollbar max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 border-b border-line bg-surface text-left uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-2">Report</th>
                    <th className="px-4 py-2">Format</th>
                    <th className="px-4 py-2">Rows</th>
                    <th className="px-4 py-2">Size</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reportExecutions.slice(0, 20).map((e) => (
                    <tr key={e.id} className="hover:bg-surface2/40">
                      <td className="px-4 py-2 font-medium text-ink">{e.reportName}</td>
                      <td className="px-4 py-2 uppercase text-muted">{e.format}</td>
                      <td className="px-4 py-2 text-muted">{e.rows.toLocaleString()}</td>
                      <td className="px-4 py-2 text-muted">{e.sizeKb} KB</td>
                      <td className="px-4 py-2">
                        <span className={cn("badge capitalize", e.status === "completed" ? "bg-success/15 text-success" : e.status === "failed" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{e.status}</span>
                      </td>
                      <td className="px-4 py-2 text-muted">{(e.durationMs / 1000).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SCENARIOS TAB                                                     */
/* ================================================================== */
function ScenariosTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { scenarios } = ctx;

  const typeIcon = (t: string) => {
    switch (t) {
      case "what_if": return <GitBranch className="h-4 w-4" />;
      case "benchmark": return <BarChart3 className="h-4 w-4" />;
      case "competitive": return <Target className="h-4 w-4" />;
      case "seasonal": return <Activity className="h-4 w-4" />;
      case "market_shift": return <Globe className="h-4 w-4" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  const riskColor = (r: string) => {
    switch (r) {
      case "low": return "bg-success/15 text-success";
      case "medium": return "bg-warning/15 text-warning";
      case "high": return "bg-danger/15 text-danger";
      default: return "bg-surface2 text-muted";
    }
  };

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{scenarios.length} scenarios analyzed</p>
      <div className="space-y-4">
        {scenarios.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent">{typeIcon(s.type)}</span>
                  <p className="font-semibold text-ink">{s.name}</p>
                  <span className={cn("badge capitalize", riskColor(s.risk))}>{s.risk} risk</span>
                  <span className="badge bg-surface2 capitalize text-muted">{s.type.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{s.description}</p>
              </div>
              <span className={cn("badge capitalize", s.status === "actioned" ? "bg-success/15 text-success" : s.status === "analyzed" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{s.status}</span>
            </div>

            {/* Assumptions */}
            <details className="mt-4">
              <summary className="text-xs font-semibold cursor-pointer text-muted">{s.assumptions.length} Assumptions</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {s.assumptions.map((a, i) => (
                  <div key={i} className="rounded-lg bg-surface2/40 p-2">
                    <p className="text-xs font-medium text-ink">{a.variable}: {a.baseValue} → <span className={a.scenarioValue > a.baseValue ? "text-warning" : "text-success"}>{a.scenarioValue}</span></p>
                    <p className="text-[0.55rem] text-muted">{a.impact}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* Projected Outcomes */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted mb-2">Projected Outcomes</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {s.projectedOutcome.map((o, i) => (
                  <div key={i} className="rounded-lg border border-line p-3">
                    <p className="text-xs text-muted">{o.metric}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted">{typeof o.baseValue === "number" && o.baseValue > 1000 ? o.baseValue.toLocaleString() : o.baseValue}{o.unit}</span>
                      <span className={cn("text-sm font-bold", o.change >= 0 ? "text-success" : "text-danger")}>
                        → {typeof o.scenarioValue === "number" && o.scenarioValue > 1000 ? o.scenarioValue.toLocaleString() : o.scenarioValue}{o.unit}
                      </span>
                    </div>
                    <span className={cn("text-xs font-medium", o.change >= 0 ? "text-success" : "text-danger")}>
                      {o.change >= 0 ? "+" : ""}{o.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-muted">
              <span>Confidence: {(s.confidence * 100).toFixed(0)}%</span>
              <span>· By: {s.createdBy}</span>
              <span>· {formatDateTime(s.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CHANNELS TAB                                                      */
/* ================================================================== */
function ChannelsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { channelAnalytics } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{channelAnalytics.length} marketing channels tracked</p>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {channelAnalytics.map((ch) => (
          <div key={ch.channel} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent"><Globe className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{ch.channel}</p>
                  <p className="text-xs text-muted">{ch.uniqueUsers.toLocaleString()} unique users</p>
                </div>
              </div>
              <span className="text-lg font-bold text-ink">{ch.share}%</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted">Visits</span><p className="font-medium text-ink">{ch.visits.toLocaleString()}</p></div>
              <div><span className="text-muted">Conversions</span><p className="font-medium text-ink">{ch.conversions.toLocaleString()}</p></div>
              <div><span className="text-muted">Revenue</span><p className="font-medium text-ink">${ch.revenue.toLocaleString()}</p></div>
              <div><span className="text-muted">Spend</span><p className="font-medium text-ink">${ch.spend.toLocaleString()}</p></div>
            </div>
            {ch.roi > 0 && <p className="mt-1 text-xs text-success">ROI: {ch.roi}%</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COHORTS TAB                                                       */
/* ================================================================== */
function CohortsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { cohortData } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">Customer cohort retention analysis</p>
      <div className="card overflow-hidden">
        <div className="hide-scrollbar max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-line bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Cohort</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">M1</th>
                <th className="px-4 py-3">M2</th>
                <th className="px-4 py-3">M3</th>
                <th className="px-4 py-3">M4</th>
                <th className="px-4 py-3">M5</th>
                <th className="px-4 py-3">M6</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">CLV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cohortData.map((c, i) => (
                <tr key={i} className="hover:bg-surface2/40">
                  <td className="px-4 py-3 font-medium text-ink">{c.cohort}</td>
                  <td className="px-4 py-3 text-ink">{c.users}</td>
                  {c.retention.map((r, j) => (
                    <td key={j} className={cn("px-4 py-3 font-mono", r >= 70 ? "text-success" : r >= 50 ? "text-warning" : "text-muted")}>{r}%</td>
                  ))}
                  {Array.from({ length: 6 - c.retention.length }).map((_, j) => (
                    <td key={j + c.retention.length} className="px-4 py-3 text-muted">—</td>
                  ))}
                  <td className="px-4 py-3 text-ink">${c.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-ink">${c.clv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FUNNEL TAB                                                        */
/* ================================================================== */
function FunnelTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { funnelData } = ctx;
  const maxUsers = funnelData[0]?.users || 1;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">Conversion funnel analysis</p>
      <div className="space-y-2">
        {funnelData.map((s, i) => (
          <div key={s.stage} className="card p-4">
            <div className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <p className="text-sm font-semibold text-ink capitalize">{s.stage.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted">{s.users.toLocaleString()} users</p>
              </div>
              <div className="flex-1">
                <div className="relative h-10">
                  <div className="absolute inset-y-0 left-0 rounded-r-lg bg-accent/20" style={{ width: `${(s.users / maxUsers) * 100}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-r-lg bg-accent/60" style={{ width: `${(s.conversion * 10)}%` }} />
                </div>
              </div>
              <div className="w-20 text-right">
                <p className="text-lg font-bold text-ink">{s.conversion}%</p>
                <p className={cn("text-xs", s.dropOff > 50 ? "text-danger" : "text-warning")}>Drop: {s.dropOff}%</p>
              </div>
            </div>
            {i < funnelData.length - 1 && (
              <div className="mt-1 flex justify-center">
                <span className="text-muted/40 text-xs">{funnelData[i + 1].users > 0 ? ((1 - funnelData[i + 1].users / s.users) * 100).toFixed(0) : 100}% drop-off →</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  GEOGRAPHY TAB                                                     */
/* ================================================================== */
function GeoTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { geoAnalytics } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{geoAnalytics.length} countries tracked</p>
      <div className="card overflow-hidden">
        <div className="hide-scrollbar max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-line bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Visits</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">AOV</th>
                <th className="px-4 py-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {geoAnalytics.map((g) => (
                <tr key={g.country} className="hover:bg-surface2/40">
                  <td className="px-4 py-3 font-medium text-ink">{g.country}</td>
                  <td className="px-4 py-3 text-muted">{g.visits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted">{g.orders.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-ink">${g.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted">${g.aov}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-surface2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${g.share * 2}%` }} />
                      </div>
                      <span className="text-xs font-medium text-ink">{g.share}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CUSTOMERS TAB                                                     */
/* ================================================================== */
function CustomersTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { customerAnalytics } = ctx;
  const ca = customerAnalytics;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-5 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{ca.totalCustomers}</p><p className="text-xs text-muted">Total Customers</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{ca.activeCustomers}</p><p className="text-xs text-muted">Active</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-accent">{ca.newCustomers}</p><p className="text-xs text-muted">New</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-danger">{ca.churnedCustomers}</p><p className="text-xs text-muted">Churned</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{ca.retentionRate}%</p><p className="text-xs text-muted">Retention Rate</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Customer Segments</h3>
          <div className="space-y-3">
            {ca.segments.map((seg) => (
              <div key={seg.name} className="rounded-lg bg-surface2/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink text-sm">{seg.name}</p>
                  <span className="text-sm font-bold text-ink">${seg.revenue.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted">{seg.count} customers</p>
                <div className="mt-1 h-1.5 rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(seg.revenue / Math.max(...ca.segments.map((s) => s.revenue))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface2/40">
              <span className="text-sm text-muted">Churn Rate</span>
              <span className="font-semibold text-ink">{ca.churnRate}%</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface2/40">
              <span className="text-sm text-muted">Retention Rate</span>
              <span className="font-semibold text-ink">{ca.retentionRate}%</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface2/40">
              <span className="text-sm text-muted">Avg Customer LTV</span>
              <span className="font-semibold text-lg text-ink">${ca.avgLtv}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PRODUCTS TAB                                                      */
/* ================================================================== */
function ProductsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { productAnalytics } = ctx;
  const pa = productAnalytics;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{pa.totalProducts}</p><p className="text-xs text-muted">Products</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{pa.categories.length}</p><p className="text-xs text-muted">Categories</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{pa.inventoryTurnover}x</p><p className="text-xs text-muted">Inventory Turnover</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{pa.avgMargin}%</p><p className="text-xs text-muted">Avg Margin</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Sellers */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Top Sellers</h3>
          <div className="space-y-2">
            {pa.topSellers.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted">#{i + 1}</span>
                  <span className="text-sm font-medium text-ink">{p.product}</span>
                </div>
                <div className="text-right text-xs">
                  <p className="font-medium text-ink">{p.units} units</p>
                  <p className="text-muted">${p.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Revenue */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Categories</h3>
          <div className="space-y-3">
            {pa.categories.map((c) => (
              <div key={c.name} className="rounded-lg bg-surface2/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{c.name}</span>
                  <span className="text-sm font-bold text-ink">${c.revenue.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted">{c.productCount} products</p>
                <div className="mt-1 h-1.5 rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(c.revenue / Math.max(...pa.categories.map((cc) => cc.revenue))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CAMPAIGNS TAB                                                     */
/* ================================================================== */
function CampaignsTab({ ctx }: { ctx: ReturnType<typeof useBusinessIntelligence> }) {
  const { campaignAnalytics } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{campaignAnalytics.length} campaigns tracked</p>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {campaignAnalytics.map((c) => (
          <div key={c.campaign} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent"><Megaphone className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{c.campaign}</p>
                  <p className="text-xs text-muted capitalize">{c.type}</p>
                </div>
              </div>
              <span className={cn("badge", c.roi >= 1000 ? "bg-success/15 text-success" : c.roi >= 500 ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>{c.roi}% ROI</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{c.ctr.toFixed(2)}%</p>
                <p className="text-muted">CTR</p>
              </div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{c.conversionRate.toFixed(2)}%</p>
                <p className="text-muted">Conv Rate</p>
              </div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className={cn("font-semibold", c.revenue > c.spend * 5 ? "text-success" : "text-warning")}>{c.roi}%</p>
                <p className="text-muted">ROI</p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
              <span>Impressions: {c.impressions.toLocaleString()}</span>
              <span>Clicks: {c.clicks.toLocaleString()}</span>
              <span>Spend: ${c.spend.toLocaleString()}</span>
              <span>Revenue: ${c.revenue.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
