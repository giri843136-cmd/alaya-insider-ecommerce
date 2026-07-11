/**
 * ALAYA INSIDER — Enterprise Operations Platform Admin UI (PART 2.19)
 * 12 tabs: Dashboard | Releases | Maintenance | Feature Flags | Lifecycle |
 * Continuity | DR | Capacity | Automation | KPIs | Docs | Reports
 */
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Rocket, Wrench, Flag, RefreshCw,
  Shield, Radio, BarChart3, Cpu, Activity,
  BookOpen, FileText,
  Plus, Search, CheckCircle2,
  XCircle, AlertTriangle, Target, Globe, Clock,
  Zap,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getOpsDashboard, getOpsMetrics, getOpsGlobalStatus,
  getReleasePlans, createReleasePlan, updateReleasePlan, deployRelease, rollbackRelease, getReleaseCalendar,
  getMaintenanceWindows, createMaintenanceWindow,
  getFeatureFlags, updateFeatureFlag, createFeatureFlag,
  getPlatformUpgrades, createPlatformUpgrade, updatePlatformUpgrade,
  getContinuityPlans, createContinuityPlan,
  getDrPlans, getDrTests, startDrTest,
  getCapacityForecasts, getScalingRecommendations, implementScalingRecommendation,
  getOpsAutomations, updateOpsAutomation, triggerAutomation, getAiInsights,
  getOpsKpis,
  getOpsDocuments, searchOpsDocuments, createOpsDocument,
  getOpsReports, generateOpsReport,
} from "../../lib/operationsPlatform";

type Tab =
  | "dashboard" | "releases" | "maintenance" | "flags"
  | "lifecycle" | "continuity" | "dr" | "capacity"
  | "automation" | "kpis" | "docs" | "reports";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "releases", label: "Releases", icon: Rocket },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "lifecycle", label: "Lifecycle", icon: RefreshCw },
  { id: "continuity", label: "Continuity", icon: Shield },
  { id: "dr", label: "DR", icon: Radio },
  { id: "capacity", label: "Capacity", icon: BarChart3 },
  { id: "automation", label: "Automation", icon: Cpu },
  { id: "kpis", label: "KPIs", icon: Activity },
  { id: "docs", label: "Documentation", icon: BookOpen },
  { id: "reports", label: "Reports", icon: FileText },
];

export default function AdminOperationsPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Operations Platform" path="/admin/operations-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Operations Center</h1>
            <p className="mt-1 text-sm text-muted">Release management, maintenance, business continuity, capacity planning & production readiness.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip flex items-center gap-1.5 capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "releases" && <ReleasesTab />}
        {tab === "maintenance" && <MaintenanceTab />}
        {tab === "flags" && <FlagsTab />}
        {tab === "lifecycle" && <LifecycleTab />}
        {tab === "continuity" && <ContinuityTab />}
        {tab === "dr" && <DrTab />}
        {tab === "capacity" && <CapacityTab />}
        {tab === "automation" && <AutomationTab />}
        {tab === "kpis" && <KpisTab />}
        {tab === "docs" && <DocsTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const dash = useMemo(() => getOpsDashboard(), []);
  const metrics = useMemo(() => getOpsMetrics(), []);
  const status = useMemo(() => getOpsGlobalStatus(), []);

  const STATS = [
    { label: "Uptime", value: `${dash.uptimePercent}%`, sub: "Last 30 days", icon: Activity, tone: dash.uptimePercent >= 99.99 ? "success" : "warning" },
    { label: "Active Incidents", value: String(dash.activeIncidents), sub: "In progress", icon: AlertTriangle, tone: dash.activeIncidents > 0 ? "danger" : "success" },
    { label: "Release Queue", value: String(status.plannedReleases), sub: "Planned releases", icon: Rocket, tone: "accent" },
    { label: "Maintenance", value: String(status.activeMaintenance), sub: "Planned windows", icon: Wrench, tone: "accent" },
    { label: "Feature Flags", value: `${status.activeFlags} active`, sub: `${getFeatureFlags().length} total`, icon: Flag, tone: "accent" },
    { label: "DR Ready", value: `${status.drReady} plans`, sub: "Active/tested", icon: Radio, tone: "success" },
    { label: "Capacity", value: `${status.capacityCritical} critical`, sub: "Forecasts at risk", icon: BarChart3, tone: "warning" },
    { label: "Health Score", value: `${dash.servicesUp}/${dash.totalServices}`, sub: "Services up", icon: Target, tone: dash.servicesUp === dash.totalServices ? "success" : "warning" },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
          dash.overallHealth === "healthy" ? "bg-success/15 text-success" :
          dash.overallHealth === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
          <span className={cn("h-2 w-2 rounded-full",
            dash.overallHealth === "healthy" ? "bg-success" :
            dash.overallHealth === "degraded" ? "bg-warning" : "bg-danger")} />
          {dash.overallHealth.charAt(0).toUpperCase() + dash.overallHealth.slice(1)}
        </span>
        <span className="text-xs text-muted">Services: {dash.servicesUp}/{dash.totalServices} · Avg response: {dash.avgResponseTimeMs}ms</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card p-5">
            <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.tone === "danger" ? "bg-danger/15 text-danger" : s.tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}><s.icon className="h-5 w-5" /></span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Key Metrics</h3>
          <div className="mt-4 space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger")} />
                  <span className="text-sm text-ink">{m.name}</span>
                </div>
                <span className="text-sm font-semibold text-ink">{m.currentValue}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Operational Overview</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-ink">KPIs On Track</span><span className="text-sm font-semibold text-ink">{status.kpisOnTrack}/{status.totalKpis}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Automations Active</span><span className="text-sm font-semibold text-ink">{status.automationsActive}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Pending Releases</span><span className="text-sm font-semibold text-ink">{status.plannedReleases}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Feature Flags Active</span><span className="text-sm font-semibold text-ink">{status.activeFlags}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Capacity Warnings</span><span className="text-sm font-semibold text-warning">{status.capacityCritical}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">DR Plans Active</span><span className="text-sm font-semibold text-ink">{status.drReady}</span></div>
          </div>
        </div>
      </div>

      {/* Release Calendar Preview */}
      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Release Calendar</h3>
        <div className="space-y-2">
          {getReleaseCalendar().slice(0, 4).map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 rounded-lg bg-surface2/30 px-3 py-2">
              <span className={cn("h-2 w-2 rounded-full shrink-0", ev.type === "release" ? "bg-accent" : ev.type === "freeze" ? "bg-danger" : ev.type === "maintenance" ? "bg-warning" : "bg-success")} />
              <span className="text-xs text-muted w-16 shrink-0">{formatDate(ev.date)}</span>
              <span className="text-sm font-medium text-ink">{ev.title}</span>
              {ev.version && <span className="badge bg-accent-soft text-accent text-xs">v{ev.version}</span>}
              <span className="badge bg-surface2 text-muted text-xs">{ev.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  RELEASES TAB                                                       */
/* ================================================================== */

function ReleasesTab() {
  const [plans, setPlans] = useState(() => getReleasePlans());
  const [calendar] = useState(() => getReleaseCalendar());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ version: "", name: "", type: "minor" as const, env: "production", strategy: "rolling" as const });
  const refresh = () => setPlans(getReleasePlans());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{plans.filter((r) => r.status === "deployed").length} deployed · {plans.length} releases · {calendar.length} calendar events</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Release</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Release Plan</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Version (e.g. 2.7.0)*" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <input className="input-field" placeholder="Release name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="major">Major</option><option value="minor">Minor</option><option value="patch">Patch</option><option value="hotfix">Hotfix</option>
            </select>
            <select className="input-field" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value as any })}>
              <option value="standard">Standard</option><option value="blue_green">Blue/Green</option><option value="canary">Canary</option><option value="rolling">Rolling</option><option value="zero_downtime">Zero Downtime</option>
            </select>
          </div>
          <button onClick={() => { if (form.version && form.name) { createReleasePlan(form.version, form.name, form.type, form.env, form.strategy); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Rocket className={cn("h-5 w-5 mt-0.5 shrink-0", r.status === "deployed" ? "text-success" : r.status === "rolled_back" ? "text-danger" : r.status === "in_progress" || r.status === "approved" ? "text-accent" : "text-muted")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink">v{r.version} — {r.name}</p>
                    <span className={cn("badge", r.status === "deployed" ? "bg-success/15 text-success" : r.status === "rolled_back" ? "bg-danger/15 text-danger" : r.status === "approved" ? "bg-accent-soft text-accent" : r.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{r.status.replace(/_/g, " ")}</span>
                    <span className="badge bg-accent-soft text-accent text-xs">{r.deploymentStrategy.replace(/_/g, " ")}</span>
                    <span className={cn("badge", r.riskLevel === "critical" ? "bg-danger/15 text-danger" : r.riskLevel === "high" ? "bg-warning/15 text-warning" : "bg-surface2")}>{r.riskLevel}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{r.description || r.changelog}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.validationChecks.map((c) => (
                      <span key={c.id} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                        c.status === "passed" ? "bg-success/15 text-success" : c.status === "failed" ? "bg-danger/15 text-danger" : c.status === "running" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                        {c.status === "passed" ? <CheckCircle2 className="h-2.5 w-2.5" /> : c.status === "failed" ? <XCircle className="h-2.5 w-2.5" /> : null}
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                    {r.scheduledAt && <span>Scheduled: {formatDate(r.scheduledAt)}</span>}
                    {r.deployedAt && <span>Deployed: {formatDate(r.deployedAt)}</span>}
                    <span>{r.features.length} features · {r.fixes.length} fixes</span>
                    {r.approvers.length > 0 && <span>Approvers: {r.approvers.join(", ")}</span>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {(r.status === "planned" || r.status === "approved") && <button onClick={() => { deployRelease(r.id, "admin"); refresh(); }} className="btn-ghost btn-sm text-xs text-success">Deploy</button>}
                {r.status === "deployed" && <button onClick={() => { rollbackRelease(r.id, "Manual rollback"); refresh(); }} className="btn-ghost btn-sm text-xs text-danger">Rollback</button>}
                {r.status === "planned" && <button onClick={() => { updateReleasePlan(r.id, { status: "approved" }); refresh(); }} className="btn-ghost btn-sm text-xs text-accent">Approve</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MAINTENANCE TAB                                                    */
/* ================================================================== */

function MaintenanceTab() {
  const DAY_MS = 86400000;
  const [windows, setWindows] = useState(() => getMaintenanceWindows());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "scheduled" as const, env: "production", startAt: Date.now() + DAY_MS, endAt: Date.now() + DAY_MS + 3600000 });
  const refresh = () => setWindows(getMaintenanceWindows());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{windows.filter((w) => w.status === "in_progress").length} in progress · {windows.filter((w) => w.status === "planned" || w.status === "approved").length} planned</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Window</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Maintenance Window</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Title*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="scheduled">Scheduled</option><option value="emergency">Emergency</option>
            </select>
            <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={() => { if (form.title) { createMaintenanceWindow(form.title, form.description, form.type, form.env, form.startAt, form.endAt); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {windows.map((w) => (
          <div key={w.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className={cn("h-5 w-5", w.status === "in_progress" ? "text-warning" : w.status === "completed" ? "text-success" : w.status === "cancelled" ? "text-muted" : "text-accent")} />
                <div>
                  <p className="font-medium text-ink text-sm">{w.title}</p>
                  <span className="badge bg-surface2 text-muted text-xs">{w.type}</span>
                </div>
              </div>
              <span className={cn("badge", w.status === "completed" ? "bg-success/15 text-success" : w.status === "in_progress" ? "bg-warning/15 text-warning" : w.status === "cancelled" ? "bg-surface2 text-muted" : "bg-accent-soft text-accent")}>{w.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{w.description}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <Clock className="h-3 w-3" />
              <span>{formatDate(w.startAt)} — {formatDate(w.endAt)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="badge bg-surface2 text-muted">{w.environment}</span>
              <span className="badge bg-surface2 text-muted">{w.scope.length} resources</span>
              {w.expectedDowntime > 0 && <span className="badge bg-warning/15 text-warning">{Math.round(w.expectedDowntime / 60000)}min downtime</span>}
            </div>
            {w.performedBy && <p className="mt-2 text-[10px] text-muted">By {w.performedBy}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FEATURE FLAGS TAB                                                  */
/* ================================================================== */

function FlagsTab() {
  const [flags, setFlags] = useState(() => getFeatureFlags());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "", owner: "admin" });
  const refresh = () => setFlags(getFeatureFlags());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{flags.filter((f) => f.enabled).length} active · {flags.length} flags</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Flag</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Feature Flag</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Flag key (e.g. ff_new_feature)*" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={() => { if (form.key && form.name) { createFeatureFlag(form.key, form.name, form.description, form.owner); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flags.map((f) => (
          <div key={f.key} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className={cn("h-5 w-5", f.enabled ? "text-accent" : "text-muted")} />
                <div>
                  <p className="font-medium text-ink text-sm">{f.name}</p>
                  <code className="text-[10px] text-muted">{f.key}</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={f.enabled} onChange={() => { updateFeatureFlag(f.key, { enabled: !f.enabled }); refresh(); }} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-line after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{f.description}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>Rollout: {f.rolloutPercent}%</span>
              <span className={cn("badge", f.instantRollback ? "bg-success/15 text-success" : "bg-surface2")}>{f.instantRollback ? "Instant rollback" : "Manual rollback"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="badge bg-surface2 text-muted">{f.regionalRollout.length} regions</span>
              <span className="badge bg-surface2 text-muted">{f.userGroupRollout.length} groups</span>
              <span className="badge bg-accent-soft text-accent">{f.owner}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px] text-muted">
              <div className="rounded bg-surface2/50 p-1"><span>Impressions</span><br /><span className="font-semibold text-ink">{f.metrics.impressions.toLocaleString()}</span></div>
              <div className="rounded bg-surface2/50 p-1"><span>Conversions</span><br /><span className="font-semibold text-ink">{f.metrics.conversions.toLocaleString()}</span></div>
              <div className="rounded bg-surface2/50 p-1"><span>Error</span><br /><span className={cn("font-semibold", f.metrics.errorRate > 0.5 ? "text-danger" : "text-success")}>{f.metrics.errorRate}%</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  LIFECYCLE TAB                                                      */
/* ================================================================== */

function LifecycleTab() {
  const [upgrades, setUpgrades] = useState(() => getPlatformUpgrades());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", target: "platform" as const, fromVer: "", toVer: "" });
  const refresh = () => setUpgrades(getPlatformUpgrades());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{upgrades.filter((u) => u.status === "completed").length} completed · {upgrades.filter((u) => u.status === "planned" || u.status === "in_progress").length} in progress</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Upgrade</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Platform Upgrade</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Upgrade name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-field" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as any })}>
              <option value="platform">Platform</option><option value="module">Module</option><option value="plugin">Plugin</option>
              <option value="database">Database</option><option value="infrastructure">Infrastructure</option><option value="ai_model">AI Model</option>
              <option value="sdk">SDK</option><option value="api">API</option><option value="schema">Schema</option>
            </select>
            <input className="input-field" placeholder="From version" value={form.fromVer} onChange={(e) => setForm({ ...form, fromVer: e.target.value })} />
            <input className="input-field" placeholder="To version" value={form.toVer} onChange={(e) => setForm({ ...form, toVer: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name && form.fromVer && form.toVer) { createPlatformUpgrade(form.name, form.target, form.fromVer, form.toVer); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {upgrades.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <RefreshCw className={cn("h-5 w-5 mt-0.5 shrink-0", u.status === "completed" ? "text-success" : u.status === "failed" || u.status === "rolled_back" ? "text-danger" : u.status === "in_progress" ? "text-warning" : "text-accent")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink">{u.name}</p>
                    <span className="badge bg-accent-soft text-accent text-xs">{u.target.replace(/_/g, " ")}</span>
                    <span className={cn("badge", u.status === "completed" ? "bg-success/15 text-success" : u.status === "failed" || u.status === "rolled_back" ? "bg-danger/15 text-danger" : u.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{u.status.replace(/_/g, " ")}</span>
                    <span className={cn("badge", u.riskLevel === "high" ? "bg-danger/15 text-danger" : u.riskLevel === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>{u.riskLevel}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{u.fromVersion} → {u.toVersion}: {u.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.migrationSteps.map((s) => (
                      <span key={s.step} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]", s.done ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>
                        {s.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : null} Step {s.step}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                    <span>{u.prerequisites.length} prerequisites</span>
                    {u.scheduledAt && <span>Scheduled: {formatDate(u.scheduledAt)}</span>}
                    {u.performedBy && <span>By: {u.performedBy}</span>}
                  </div>
                </div>
              </div>
              {u.status === "planned" && <button onClick={() => { updatePlatformUpgrade(u.id, { status: "in_progress", startedAt: Date.now() }); refresh(); }} className="btn-ghost btn-sm text-xs shrink-0">Start</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CONTINUITY TAB                                                     */
/* ================================================================== */

function ContinuityTab() {
  const [plans, setPlans] = useState(() => getContinuityPlans());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", rto: 60, rpo: 15 });
  const refresh = () => setPlans(getContinuityPlans());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{plans.filter((p) => p.status === "active" || p.status === "tested").length} active · {plans.length} plans</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Plan</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Continuity Plan</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Plan name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2"><label className="label-field">RTO (min)</label><input className="input-field w-20" type="number" value={form.rto} onChange={(e) => setForm({ ...form, rto: parseInt(e.target.value) || 60 })} /></div>
            <div className="flex gap-2"><label className="label-field">RPO (min)</label><input className="input-field w-20" type="number" value={form.rpo} onChange={(e) => setForm({ ...form, rpo: parseInt(e.target.value) || 15 })} /></div>
          </div>
          <button onClick={() => { if (form.name) { createContinuityPlan(form.name, form.description, form.rto, form.rpo); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4">
        {plans.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Shield className={cn("h-5 w-5 mt-0.5 shrink-0", p.status === "active" ? "text-success" : p.status === "tested" ? "text-accent" : "text-muted")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink">{p.name}</p>
                    <span className={cn("badge", p.status === "active" ? "bg-success/15 text-success" : p.status === "tested" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{p.status}</span>
                  </div>
                  <p className="text-xs text-muted">{p.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="badge bg-accent-soft text-accent">RTO: {p.rtoMinutes}min</span>
                    <span className="badge bg-accent-soft text-accent">RPO: {p.rpoMinutes}min</span>
                    <span className="badge bg-surface2 text-muted">{p.procedures.length} procedures</span>
                    <span className="badge bg-surface2 text-muted">{p.emergencyContacts.length} contacts</span>
                    <span className="badge bg-surface2 text-muted">{p.escalationMatrix.length} escalation levels</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted">
                    {p.lastTestedAt && <span>Last tested: {formatDate(p.lastTestedAt)}</span>}
                    {p.nextTestAt && <span>Next test: {formatDate(p.nextTestAt)}</span>}
                    {p.testResults && <span className="text-success">✓ {p.testResults}</span>}
                  </div>
                  {/* Procedures */}
                  <div className="mt-3 space-y-1">
                    {p.procedures.slice(0, 4).map((proc) => (
                      <div key={proc.id} className="flex items-center gap-2 text-xs">
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold", proc.critical ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{proc.step}</span>
                        <span className="font-medium text-ink">{proc.action}</span>
                        <span className="text-muted">— {proc.description}</span>
                        {proc.automationAvailable && <span className="badge bg-accent-soft text-accent text-[10px]">Auto</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DR TAB                                                             */
/* ================================================================== */

function DrTab() {
  const [plans, setPlans] = useState(() => getDrPlans());
  const [tests, setTests] = useState(() => getDrTests());
  const refresh = () => { setPlans(getDrPlans()); setTests(getDrTests()); };

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{plans.filter((p) => p.status === "active" || p.status === "tested").length} plans · {tests.length} tests completed</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Radio className="h-4 w-4 text-accent" /> DR Plans</h3>
          {plans.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className={cn("h-5 w-5", p.status === "tested" ? "text-success" : p.status === "active" ? "text-accent" : "text-muted")} />
                  <div>
                    <p className="font-medium text-ink text-sm">{p.name}</p>
                    <span className="badge bg-accent-soft text-accent text-xs">{p.type.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <span className={cn("badge", p.status === "tested" ? "bg-success/15 text-success" : p.status === "active" ? "bg-accent-soft text-accent" : p.status === "failed_test" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{p.status.replace(/_/g, " ")}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">RTO Target</span><br /><span className="font-semibold text-ink">{p.rtoMinutes} min</span></div>
                <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">RPO Target</span><br /><span className="font-semibold text-ink">{p.rpoMinutes} min</span></div>
                <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">Primary</span><br /><span className="font-semibold text-ink">{p.primaryRegion}</span></div>
                <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">Secondary</span><br /><span className="font-semibold text-ink">{p.secondaryRegion}</span></div>
              </div>
              <div className="mt-2 flex gap-2 text-[10px] text-muted">
                {p.lastTestedAt && <span>Last test: {formatDate(p.lastTestedAt)}</span>}
                {p.nextTestAt && <span>Next test: {formatDate(p.nextTestAt)}</span>}
                {p.lastTestResult && <span className={cn("font-medium", p.lastTestResult === "passed" ? "text-success" : "text-danger")}>Result: {p.lastTestResult}</span>}
              </div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => { startDrTest(p.id, `Test ${tests.length + 1}`, "admin"); refresh(); }} className="btn-ghost btn-sm text-xs">Start Test</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> DR Test Results</h3>
          <div className="space-y-2">
            {tests.map((t) => (
              <div key={t.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">{t.name}</p>
                    <span className="text-xs text-muted">By {t.performedBy}</span>
                  </div>
                  <span className={cn("badge", t.status === "passed" ? "bg-success/15 text-success" : t.status === "failed" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{t.status}</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-success">RTO: {t.rtoAchieved}min</span>
                  <span className="text-accent">RPO: {t.rpoAchieved}min</span>
                </div>
                {t.issuesFound.length > 0 && (
                  <div className="mt-1"><span className="text-[10px] text-warning">Issues: {t.issuesFound.join(", ")}</span></div>
                )}
                <p className="mt-1 text-[10px] text-muted">{formatDate(t.startedAt || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CAPACITY TAB                                                       */
/* ================================================================== */

function CapacityTab() {
  const forecasts = useMemo(() => getCapacityForecasts(), []);
  const [recs, setRecs] = useState(() => getScalingRecommendations());
  const refreshRecs = () => setRecs(getScalingRecommendations());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">
        {forecasts.filter((f) => f.priority === "critical").length} critical · {forecasts.filter((f) => f.priority === "high").length} high · {forecasts.length} forecasts
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forecasts.map((f) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className={cn("h-5 w-5", f.priority === "critical" ? "text-danger" : f.priority === "high" ? "text-warning" : "text-accent")} />
                <div>
                  <p className="font-medium text-ink text-sm">{f.name}</p>
                  <span className="badge bg-surface2 text-muted text-xs">{f.category}</span>
                </div>
              </div>
              <span className={cn("badge", f.priority === "critical" ? "bg-danger/15 text-danger" : f.priority === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{f.priority}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">Current</span><br /><span className="font-semibold text-ink">{f.currentUtilization}{f.capacityUnit}</span></div>
              <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">Forecast</span><br /><span className="font-semibold text-warning">{f.forecastUtilization}{f.capacityUnit}</span></div>
              <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">Growth</span><br /><span className="font-semibold text-ink">{f.growthRate}%/mo</span></div>
              <div className="rounded-lg bg-surface2/50 p-2"><span className="text-muted">Exhaustion</span><br /><span className={cn("font-semibold", f.daysUntilExhaustion <= 90 ? "text-danger" : f.daysUntilExhaustion <= 180 ? "text-warning" : "text-success")}>{f.daysUntilExhaustion}d</span></div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
              <div className={cn("h-full rounded-full", f.currentUtilization >= 80 ? "bg-danger" : f.currentUtilization >= 60 ? "bg-warning" : "bg-success")}
                style={{ width: `${f.forecastUtilization}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-muted">↳ {f.recommendedAction}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Scaling Recommendations</h3>
        <div className="space-y-2">
          {recs.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-surface2/30 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink text-sm">{r.resource}</p>
                  <span className={cn("badge", r.urgency === "high" ? "bg-danger/15 text-danger" : r.urgency === "medium" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{r.urgency}</span>
                  {r.implemented && <span className="badge bg-success/15 text-success">Done</span>}
                </div>
                <p className="text-xs text-muted mt-0.5">{r.currentSize} → {r.recommendedSize}</p>
                <p className="text-xs text-muted">{r.reason} · ${r.estimatedCostImpact}/mo</p>
              </div>
              {!r.implemented && <button onClick={() => { implementScalingRecommendation(r.id); refreshRecs(); }} className="btn-ghost btn-sm text-xs text-success">Implement</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AUTOMATION TAB                                                     */
/* ================================================================== */

function AutomationTab() {
  const [autos, setAutos] = useState(() => getOpsAutomations());
  const insights = useMemo(() => getAiInsights(), []);
  const refresh = () => setAutos(getOpsAutomations());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{autos.filter((a) => a.enabled).length} enabled · {autos.length} automations · {insights.length} AI insights</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {autos.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className={cn("h-5 w-5", a.status === "active" ? "text-success" : a.status === "error" ? "text-danger" : "text-muted")} />
                <div>
                  <p className="font-medium text-ink text-sm">{a.name}</p>
                  <span className="badge bg-accent-soft text-accent text-xs">{a.type.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("badge", a.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{a.enabled ? "On" : "Off"}</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={a.enabled} onChange={() => { updateOpsAutomation(a.id, { enabled: !a.enabled }); refresh(); }} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-line after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{a.description}</p>
            <div className="mt-2 text-xs">
              <span className="text-muted">Trigger: </span><code className="text-ink">{a.trigger}</code>
            </div>
            <div className="mt-1 text-xs">
              <span className="text-muted">Action: </span><code className="text-ink">{a.action}</code>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span className="text-success">{a.successCount} successes</span>
              {a.failureCount > 0 && <span className="text-danger">{a.failureCount} failures</span>}
              {a.lastTriggeredAt && <span>{formatDate(a.lastTriggeredAt)}</span>}
            </div>
            <button onClick={() => { triggerAutomation(a.id); refresh(); }} className="btn-ghost btn-sm mt-2 text-xs"><Zap className="h-3 w-3" /> Trigger Now</button>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Cpu className="h-4 w-4 text-accent" /> AI Operational Insights</h3>
        <div className="space-y-2">
          {insights.map((i) => (
            <div key={i.id} className="flex items-start gap-3 rounded-lg bg-surface2/30 p-3">
              <span className={cn("mt-0.5 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold",
                i.impact === "high" ? "bg-danger/15 text-danger" : i.impact === "medium" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>
                {i.type === "prediction" ? "P" : i.type === "recommendation" ? "R" : i.type === "anomaly" ? "A" : "O"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink text-sm">{i.title}</p>
                  <span className={cn("badge", i.impact === "high" ? "bg-danger/15 text-danger" : i.impact === "medium" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{i.impact}</span>
                  <span className="text-xs text-muted">{Math.round(i.confidence * 100)}% confidence</span>
                </div>
                <p className="text-xs text-muted">{i.description}</p>
                <p className="text-xs text-accent mt-0.5">→ {i.suggestedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  KPIs TAB                                                           */
/* ================================================================== */

function KpisTab() {
  const kpis = useMemo(() => getOpsKpis(), []);

  const categories = [
    { key: "availability", label: "Availability", icon: Activity },
    { key: "reliability", label: "Reliability", icon: Shield },
    { key: "performance", label: "Performance", icon: BarChart3 },
    { key: "release", label: "Release", icon: Rocket },
    { key: "incident", label: "Incident", icon: AlertTriangle },
    { key: "recovery", label: "Recovery", icon: Radio },
    { key: "business", label: "Business", icon: Globe },
    { key: "executive", label: "Executive", icon: Target },
  ] as const;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{kpis.filter((k) => k.status === "on_track").length} on track · {kpis.filter((k) => k.status === "at_risk").length} at risk · {kpis.filter((k) => k.status === "missed").length} missed</p>
      <div className="grid gap-6">
        {categories.map((cat) => {
          const items = kpis.filter((k) => k.category === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key}>
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><cat.icon className="h-4 w-4 text-accent" /> {cat.label}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((k) => (
                  <div key={k.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink text-sm">{k.name}</p>
                      <span className={cn("badge", k.status === "on_track" ? "bg-success/15 text-success" : k.status === "at_risk" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{k.status.replace(/_/g, " ")}</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-semibold text-ink">{k.currentValue}</span>
                      <span className="text-sm text-muted">{k.unit}</span>
                      <span className="text-sm text-muted">/ {k.targetValue}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
                      <div className={cn("h-full rounded-full", k.status === "on_track" ? "bg-success" : k.status === "at_risk" ? "bg-warning" : "bg-danger")}
                        style={{ width: `${Math.min((k.currentValue / k.targetValue) * 100, 100)}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
                      <span>{k.period}</span>
                      <span>{k.trend === "up" ? "↑" : k.trend === "down" ? "↓" : "→"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DOCUMENTATION TAB                                                  */
/* ================================================================== */

function DocsTab() {
  const docs = useMemo(() => getOpsDocuments(), []);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", type: "runbook" as const, category: "general", content: "", author: "admin" });
  const [docList, setDocList] = useState(docs);
  const results = useMemo(() => query.trim() ? searchOpsDocuments(query) : docList, [query, docList]);
  const refresh = () => setDocList(getOpsDocuments());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentation…" className="input-field pl-9" />
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Document</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Ops Document</h3>
          <div className="grid gap-3">
            <input className="input-field" placeholder="Title*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                <option value="runbook">Runbook</option><option value="sop">SOP</option><option value="emergency_procedure">Emergency Procedure</option>
                <option value="architecture_doc">Architecture Doc</option><option value="deployment_doc">Deployment Doc</option>
                <option value="policy">Policy</option><option value="knowledge_article">Knowledge Article</option>
              </select>
              <input className="input-field" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <textarea className="input-field h-32 font-mono text-xs" placeholder="Content (markdown)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <button onClick={() => { if (form.title) { createOpsDocument(form.title, form.type, form.category, form.content, form.author); setShowForm(false); setForm({ title: "", type: "runbook", category: "general", content: "", author: "admin" }); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink text-sm truncate">{d.title}</p>
                <span className="badge bg-accent-soft text-accent text-xs">{d.type.replace(/_/g, " ")}</span>
              </div>
              <span className={cn("badge shrink-0", d.status === "published" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{d.status}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{d.category} · v{d.version} by {d.author}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {d.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted text-[10px]">{t}</span>)}
            </div>
            <p className="mt-2 text-[10px] text-muted">Updated {formatDate(d.updatedAt)}{d.lastReviewedAt ? ` · Reviewed ${formatDate(d.lastReviewedAt)}` : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  REPORTS TAB                                                        */
/* ================================================================== */

function ReportsTab() {
  const [reports, setReports] = useState(() => getOpsReports());
  const [reportType, setReportType] = useState("operations");
  const refresh = () => setReports(getOpsReports());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{reports.length} reports</p>
        <div className="flex gap-2">
          <select className="input-field text-xs" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="operations">Operations Report</option>
            <option value="executive">Executive Report</option>
            <option value="release">Release Report</option>
            <option value="incident">Incident Report</option>
            <option value="capacity">Capacity Report</option>
            <option value="availability">Availability Report</option>
            <option value="performance">Performance Report</option>
          </select>
          <button onClick={() => { generateOpsReport(reportType as any, "Last 30 days"); refresh(); }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Generate</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-ink text-sm">{r.name}</p>
                <span className="badge bg-accent-soft text-accent text-xs">{r.type}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{r.summary}</p>
            <div className="mt-2 text-[10px] text-muted">{r.period}</div>
            <div className="mt-2 space-y-1">
              {r.metrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{m.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-ink">{m.value}</span>
                    {m.trend === "up" && <span className="text-success">↑</span>}
                    {m.trend === "down" && <span className="text-danger">↓</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted">{formatDate(r.generatedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
