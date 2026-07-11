import { useEffect, useState } from "react";
import { Activity, Server, Gauge, Database, Zap, Cloud, GitBranch, AlertTriangle, Wrench, ShieldCheck, Terminal, RefreshCw, CheckCircle2, XCircle, Clock, ChevronRight, GitFork, Globe, Cpu, LifeBuoy, Eye, Shield, Image as ImageIcon, BarChart3, Play, HardDrive, Radio, Undo2, Layers } from "lucide-react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  environments, runHealthChecks, perfMetrics, cacheLayers, deploymentHistory,
  migrations, alertRules, defaultMaintenance, getDevOpsLogs, pushLog,
  releases, performRollback, deployRelease,
  getTraces, getSpansForTrace, getSecurityIncidents,
  cdnConfig, defaultImageOptimization, getAssetOptimizationStats, imageBreakpoints,
  workerPools, jobSchedules,
  drPlans, getObservabilityMetrics, getOperationalAnalytics, evaluateAlertRules, SEVERITY_CONFIG,
  type HealthCheck, type Environment, type Release, type Trace, type Span,
  type ImageOptimizationConfig, type AssetOptimizationStats,
  type ObservabilityMetric, type OpsAnalytic, type EnvName,
} from "../../lib/devops";

type Tab = "health" | "performance" | "cache" | "deployments" | "environments" | "logs" | "maintenance" | "alerts" | "rollback" | "tracing" | "cdn" | "workers" | "dr";

const STATUS_STYLE: Record<string, string> = {
  healthy: "bg-success/15 text-success",
  degraded: "bg-warning/15 text-warning",
  down: "bg-danger/15 text-danger",
  pass: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  fail: "bg-danger/15 text-danger",
  success: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
  in_progress: "bg-accent-soft text-accent",
  rolled_back: "bg-warning/15 text-warning",
  applied: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
};

export default function AdminDevOps() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("health");
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [logs, setLogs] = useState(getDevOpsLogs());
  const [maintenance, setMaintenance] = useState(defaultMaintenance);

  useEffect(() => { setHealth(runHealthChecks()); }, []);

  const refreshHealth = () => { setHealth(runHealthChecks()); pushLog("info", "system", "Health checks refreshed"); setLogs(getDevOpsLogs()); toast.success("Health checks refreshed"); };

  const purgeCache = (id: string) => { pushLog("info", "system", `Cache purged: ${id}`); setLogs(getDevOpsLogs()); toast.success("Cache purged", id); };
  const purgeAll = () => { pushLog("warning", "system", "All caches purged"); setLogs(getDevOpsLogs()); toast.success("All caches purged"); };

  const toggleMaintenance = () => {
    const next = { ...maintenance, enabled: !maintenance.enabled };
    setMaintenance(next);
    pushLog(maintenance.enabled ? "info" : "warning", "system", maintenance.enabled ? "Maintenance mode disabled" : "Maintenance mode enabled", next.message);
    setLogs(getDevOpsLogs());
    if (maintenance.enabled) {
      toast.success("Maintenance ended", "Site is live");
    } else {
      toast.info("Maintenance mode enabled", "Only admins can access");
    }
  };

  const runMigration = (id: string) => { pushLog("info", "system", `Migration applied: ${id}`); setLogs(getDevOpsLogs()); toast.success("Migration applied", id); };

  const metrics = perfMetrics();
  const allHealthy = health.every((h) => h.status === "healthy");
  const avgLatency = health.length ? Math.round(health.reduce((s, h) => s + h.latencyMs, 0) / health.length) : 0;

  const STATS = [
    { label: "System health", value: allHealthy ? "Operational" : "Degraded", sub: `${health.filter((h) => h.status === "healthy").length}/${health.length} healthy`, icon: Activity, tone: allHealthy ? "success" : "warning" },
    { label: "Avg latency", value: `${avgLatency}ms`, sub: "Across all checks", icon: Gauge, tone: "accent" },
    { label: "Cache hit rate", value: "94.8%", sub: "Weighted average", icon: Zap, tone: "accent" },
    { label: "Uptime", value: "99.99%", sub: "SLA target met", icon: Server, tone: "success" },
  ];

  return (
    <>
      <Seo title="DevOps" path="/admin/devops" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">DevOps & Reliability</h1>
            <p className="mt-1 text-sm text-muted">Health, performance, deployment, backup & monitoring.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["health", "Health"], ["performance", "Performance"], ["cache", "Caching"], ["deployments", "Deployments"], ["environments", "Environments"], ["logs", "Logs"], ["maintenance", "Maintenance"], ["alerts", "Alerts"], ["rollback", "Rollback"], ["tracing", "Tracing"], ["cdn", "CDN"], ["workers", "Workers"], ["dr", "DR"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize", tab === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* DASHBOARD STATS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.tone === "success" ? "bg-success/15 text-success" : s.tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}><s.icon className="h-5 w-5" /></span>
                <span className={cn("h-2 w-2 rounded-full", s.tone === "success" ? "bg-success" : s.tone === "warning" ? "bg-warning" : "bg-accent")} />
              </div>
              <p className="mt-4 font-display text-xl font-semibold text-ink">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="text-xs text-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* HEALTH */}
        {tab === "health" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Live health monitoring across all subsystems</p>
              <button onClick={refreshHealth} className="btn-outline btn-sm"><RefreshCw className="h-4 w-4" /> Re-check</button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {health.map((h) => (
                <div key={h.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full", STATUS_STYLE[h.status])}>
                      {h.status === "healthy" ? <CheckCircle2 className="h-5 w-5" /> : h.status === "degraded" ? <AlertTriangle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </span>
                    <span className="text-xs font-medium text-muted">{h.latencyMs}ms</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">{h.name}</p>
                  <p className="text-xs text-muted">{h.detail}</p>
                  <span className={cn("badge mt-2 capitalize", STATUS_STYLE[h.status])}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFORMANCE */}
        {tab === "performance" && (
          <div className="mt-6">
            <div className="flex items-center gap-2 rounded-[var(--radius-xl2)] bg-surface2/50 p-4 text-sm text-muted">
              <Gauge className="h-4 w-4 text-accent" /> Core Web Vitals targets: LCP &lt; 2.5s · INP &lt; 200ms · CLS &lt; 0.1 · TTFB &lt; 600ms
            </div>
            <div className="mt-4 card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr><th className="px-4 py-3">Metric</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Description</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {metrics.map((m) => (
                    <tr key={m.name} className="hover:bg-surface2/40">
                      <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                      <td className="px-4 py-3 text-ink">{m.value}{m.unit}</td>
                      <td className="px-4 py-3 text-muted">{m.target}{m.unit}</td>
                      <td className="px-4 py-3"><span className={cn("badge capitalize", STATUS_STYLE[m.status])}>{m.status}</span></td>
                      <td className="px-4 py-3 text-muted">{m.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Critical CSS", desc: "Inlined above-the-fold", icon: CheckCircle2, on: true },
                { label: "Lazy loading", desc: "Images + components", icon: CheckCircle2, on: true },
                { label: "Font preconnect", desc: "Google Fonts optimized", icon: CheckCircle2, on: true },
                { label: "Single-file bundle", desc: "Zero render-blocking JS", icon: CheckCircle2, on: true },
              ].map((o) => (
                <div key={o.label} className="card p-4">
                  <o.icon className="h-5 w-5 text-success" />
                  <p className="mt-2 text-sm font-medium text-ink">{o.label}</p>
                  <p className="text-xs text-muted">{o.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CACHING */}
        {tab === "cache" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{cacheLayers.length} cache layers · {cacheLayers.filter((c) => c.enabled).length} active</p>
              <button onClick={purgeAll} className="btn btn-sm border border-danger/40 text-danger hover:bg-danger/10"><RefreshCw className="h-3.5 w-3.5" /> Purge all</button>
            </div>
            <div className="mt-4 space-y-3">
              {cacheLayers.map((c) => (
                <div key={c.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", c.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Zap className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-muted">{c.keys} keys · {c.sizeMb} MB · {c.hitRate}% hit rate</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${c.hitRate}%` }} />
                    </div>
                    <button onClick={() => purgeCache(c.id)} className="btn-ghost btn-sm">Purge</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEPLOYMENTS */}
        {tab === "deployments" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-ink"><GitBranch className="h-4 w-4 text-accent" /> Deployment history</h3></div>
              <ul className="divide-y divide-line">
                {deploymentHistory.map((d) => (
                  <li key={d.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-ink">v{d.version}</span>
                          <span className={cn("badge capitalize", STATUS_STYLE[d.status])}>{d.status.replace(/_/g, " ")}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted capitalize">{d.environment} · {d.commit} · {d.deployedBy}</p>
                        <p className="mt-0.5 text-xs text-muted">{d.notes}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">{formatDateTime(d.ts)}</p>
                        <p className="text-xs text-muted">{(d.durationMs / 1000).toFixed(1)}s</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-ink"><Database className="h-4 w-4 text-accent" /> Database migrations</h3></div>
              <ul className="divide-y divide-line">
                {migrations.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", STATUS_STYLE[m.status])}>
                      {m.status === "applied" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-ink">{m.name}</p>
                      <p className="text-xs text-muted">{m.version} {m.appliedAt ? `· ${formatDateTime(m.appliedAt)}` : "· pending"}</p>
                    </div>
                    {m.status === "pending" && <button onClick={() => runMigration(m.id)} className="btn-ghost btn-sm">Run</button>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ENVIRONMENTS */}
        {tab === "environments" && (
          <div className="mt-6 space-y-4">
            {environments.map((env) => <EnvCard key={env.name} env={env} />)}
          </div>
        )}

        {/* LOGS */}
        {tab === "logs" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{logs.length} centralized log entries</p>
              <button onClick={() => { pushLog("info", "system", "Manual log entry by admin"); setLogs(getDevOpsLogs()); toast.success("Log entry added"); }} className="btn-ghost btn-sm"><Terminal className="h-4 w-4" /> Add entry</button>
            </div>
            <div className="card mt-4 overflow-hidden">
              {logs.length === 0 ? <div className="p-8"><EmptyState icon={<Terminal className="h-6 w-6" />} title="No logs" /></div> : (
                <ul className="hide-scrollbar max-h-[60vh] divide-y divide-line overflow-y-auto">
                  {logs.slice(0, 60).map((l) => (
                    <li key={l.id} className="flex items-start gap-3 px-4 py-2.5 font-mono text-xs">
                      <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", l.level === "error" ? "bg-danger" : l.level === "warning" ? "bg-warning" : l.level === "debug" ? "bg-muted" : "bg-success")} />
                      <span className="shrink-0 text-muted">{formatDateTime(l.ts)}</span>
                      <span className="shrink-0 font-semibold uppercase text-ink">[{l.source}]</span>
                      <span className="text-muted">{l.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* MAINTENANCE */}
        {tab === "maintenance" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Wrench className="h-4 w-4 text-accent" /> Maintenance mode</h3>
              <div className={cn("mt-4 rounded-xl border p-4", maintenance.enabled ? "border-warning/40 bg-warning/5" : "border-line bg-surface2/40")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{maintenance.enabled ? "Currently active" : "Inactive"}</p>
                    <p className="text-xs text-muted">{maintenance.allowAdmins ? "Admins bypass maintenance" : "All users blocked"}</p>
                  </div>
                  <button onClick={toggleMaintenance} className={cn("relative h-7 w-12 rounded-full transition-colors", maintenance.enabled ? "bg-warning" : "bg-line")}>
                    <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform", maintenance.enabled ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className="label-field">Maintenance message</label>
                <textarea rows={3} className="input-field resize-none" value={maintenance.message} onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={maintenance.allowAdmins} onChange={(e) => setMaintenance({ ...maintenance, allowAdmins: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" /> Allow admins to bypass</label>
            </div>
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-4 w-4 text-accent" /> CI/CD pipeline</h3>
              <div className="mt-4 space-y-3">
                {[
                  { step: "Code commit", desc: "Push to branch", done: true },
                  { step: "Automated build", desc: "Vite production bundle", done: true },
                  { step: "Type checking", desc: "TypeScript strict mode", done: true },
                  { step: "Static analysis", desc: "ESLint + security scan", done: true },
                  { step: "Unit + integration tests", desc: "Automated test suite", done: true },
                  { step: "Deployment approval", desc: "Manual review gate", done: true },
                  { step: "Zero-downtime deploy", desc: "Blue-green ready", done: true },
                  { step: "Health verification", desc: "Post-deploy smoke test", done: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success/15 text-success"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                    <div className="flex-1"><p className="text-sm font-medium text-ink">{s.step}</p><p className="text-xs text-muted">{s.desc}</p></div>
                    {i < 7 && <ChevronRight className="h-3 w-3 text-line" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALERTS + SECURITY MONITORING */}
        {tab === "alerts" && (
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{alertRules.length} alerting rules configured</p>
                <button onClick={() => { const results = evaluateAlertRules(); const triggered = results.filter((r) => r.triggered); if (triggered.length) toast.warning(`${triggered.length} alert(s) triggered`, triggered.map((t) => t.rule.name).join(", ")); else toast.success("All rules pass", "No alerts triggered"); }} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Evaluate</button>
              </div>
              <div className="mt-4 space-y-3">
                {alertRules.map((a) => (
                  <div key={a.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", a.enabled ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}><AlertTriangle className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-muted">Trigger: <span className="font-mono">{a.metric}</span> {a.threshold} · via {a.channel}</p>
                    </div>
                    <span className={cn("chip", a.enabled && "chip-active")} aria-pressed={a.enabled}>{a.enabled ? "On" : "Off"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security incidents */}
            <DevOpsSecuritySection />
          </div>
        )}

        {/* ROLLBACK / RELEASE MANAGEMENT */}
        {tab === "rollback" && <DevOpsRollbackSection />}

        {/* DISTRIBUTED TRACING */}
        {tab === "tracing" && <DevOpsTracingSection />}

        {/* CDN + OPTIMIZATION */}
        {tab === "cdn" && <DevOpsCdnSection />}

        {/* WORKERS + SCHEDULER */}
        {tab === "workers" && <DevOpsWorkersSection />}

        {/* DISASTER RECOVERY + OPERATIONAL ANALYTICS */}
        {tab === "dr" && <DevOpsDrSection />}
      </div>
    </>
  );
}

/* --------------------------- Environment card -------------------------- */
function EnvCard({ env }: { env: Environment }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-10 w-10 place-items-center rounded-full", env.status === "healthy" ? "bg-success/15 text-success" : env.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
            <Cloud className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink">{env.label}</p>
              <span className={cn("badge capitalize", STATUS_STYLE[env.status])}>{env.status}</span>
              <span className="badge bg-surface2 font-mono text-muted">v{env.version}</span>
            </div>
            <p className="text-xs text-muted">{env.url} · branch: {env.branch}</p>
            {env.lastDeploy && <p className="text-xs text-muted">Last deploy: {formatDateTime(env.lastDeploy)}</p>}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Secrets ({env.secrets.filter((s) => s.configured).length}/{env.secrets.length} configured)</p>
        <div className="grid grid-cols-2 gap-2">
          {env.secrets.map((s) => (
            <div key={s.key} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
              {s.configured ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> : <XCircle className="h-3.5 w-3.5 shrink-0 text-danger" />}
              <div className="min-w-0"><p className="truncate text-xs text-ink">{s.label}</p><p className="truncate font-mono text-[0.6rem] text-muted">{s.configured ? "••••••••" : "not set"}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SECURITY MONITORING (sub-section within Alerts tab)                */
/* ================================================================== */
function DevOpsSecuritySection() {
  const [incidents] = useState(() => getSecurityIncidents());
  const critical = incidents.filter((i) => !i.resolved && i.severity === "critical").length;
  const high = incidents.filter((i) => !i.resolved && i.severity === "high").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Shield className="h-4 w-4 text-accent" /> Security monitoring</h3>
          {(critical > 0 || high > 0) && (
            <span className="badge bg-danger/15 text-danger animate-pulse">{critical + high} active</span>
          )}
        </div>
        <p className="text-xs text-muted">{incidents.length} total incidents</p>
      </div>
      {incidents.length === 0 ? (
        <div className="mt-4"><EmptyState icon={<Shield className="h-6 w-6" />} title="No security incidents" description="All clear — no threats detected." /></div>
      ) : (
        <div className="mt-4 space-y-2">
          {incidents.slice(0, 10).map((inc) => {
            const sevCfg = SEVERITY_CONFIG[inc.severity];
            return (
              <div key={inc.id} className={cn("card flex items-center gap-3 p-3", !inc.resolved && "border-danger/30")}>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", sevCfg.color)}>
                  {inc.blocked ? <Shield className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", sevCfg.color)}>{sevCfg.label}</span>
                    <span className="badge bg-surface2 text-muted">{inc.type.replace(/_/g, " ")}</span>
                    {inc.blocked && <span className="badge bg-success/15 text-success">Blocked</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-ink">{inc.detail}</p>
                  <p className="text-xs text-muted">{inc.source} · {inc.ip} · {formatDateTime(inc.ts)}</p>
                </div>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", inc.resolved ? "bg-success" : "bg-danger animate-pulse")} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  ROLLBACK / RELEASE MANAGEMENT                                      */
/* ================================================================== */
function DevOpsRollbackSection() {
  const { toast } = useToast();
  const [relList, setRelList] = useState<Release[]>(releases);
  const [showDeploy, setShowDeploy] = useState(false);
  useEscapeKey(() => setShowDeploy(false), showDeploy);
  useLockBody(showDeploy);
  const [newVersion, setNewVersion] = useState("1.1.0");
  const [newName, setNewName] = useState("");
  const [newEnv, setNewEnv] = useState<EnvName>("staging");
  const [newCommit, setNewCommit] = useState("");

  const handleRollback = (id: string) => {
    const reason = prompt("Reason for rollback:");
    if (!reason) return;
    const result = performRollback(id, reason);
    if (result) {
      setRelList([...releases]);
      pushLog("warning", "system", `Rollback executed on ${result.version}`);
      toast.warning("Rollback executed", `${result.version} — ${reason}`);
    }
  };

  const handleDeploy = () => {
    if (!newVersion || !newName) return;
    deployRelease(newVersion, newName, newEnv, newCommit || "manual");
    setRelList([...releases]);
    pushLog("info", "system", `Release ${newVersion} deployed to ${newEnv}`);
    toast.success("Release deployed", `${newVersion} to ${newEnv}`);
    setShowDeploy(false);
    setNewVersion("1.1.0");
    setNewName("");
    setNewCommit("");
  };

  const live = relList.filter((r) => r.status === "live").length;
  const rolled = relList.filter((r) => r.status === "rolled_back").length;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{relList.length} releases · {live} live · {rolled} rolled back</p>
        <button onClick={() => setShowDeploy(true)} className="btn-primary btn-sm"><Play className="h-4 w-4" /> New deployment</button>
      </div>

      <div className="mt-4 space-y-3">
        {relList.map((r) => (
          <div key={r.id} className={cn("card p-4", r.status === "rolled_back" && "border-warning/30 bg-warning/5", r.status === "live" && "border-success/30 bg-success/5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-ink">v{r.version}</span>
                  <span className={cn("badge capitalize", STATUS_STYLE[r.status])}>{r.status.replace(/_/g, " ")}</span>
                  <span className="badge bg-surface2 capitalize text-muted">{r.environment}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink">{r.name}</p>
                <p className="text-xs text-muted">{r.commit} · {r.branch} · {r.deployedBy} · {formatDateTime(r.ts)}</p>
                {r.changelog && <p className="mt-1 text-xs text-muted">{r.changelog}</p>}
                {r.rollbackReason && <p className="mt-1 text-xs text-danger">Rollback: {r.rollbackReason}</p>}
                {r.artifacts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.artifacts.map((a) => <span key={a} className="badge bg-surface2 font-mono text-[0.6rem] text-muted">{a}</span>)}
                  </div>
                )}
              </div>
              {(r.status === "live" || r.status === "deploying") && (
                <button onClick={() => handleRollback(r.id)} className="btn btn-sm shrink-0 border border-warning/40 text-warning hover:bg-warning/10">
                  <Undo2 className="h-3.5 w-3.5" /> Rollback
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deploy dialog */}
      {showDeploy && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeploy(false)} aria-hidden="true" />
          <div className="card relative z-10 w-full max-w-md animate-scale-in p-6">
            <h2 className="text-lg font-semibold text-ink">New deployment</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Version</label><input className="input-field" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} placeholder="1.1.0" /></div>
                <div><label className="label-field">Environment</label>
                  <select className="input-field" value={newEnv} onChange={(e) => setNewEnv(e.target.value as EnvName)}>
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
              <div><label className="label-field">Release name</label><input className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Feature release" /></div>
              <div><label className="label-field">Commit hash</label><input className="input-field" value={newCommit} onChange={(e) => setNewCommit(e.target.value)} placeholder="a4f8c2e" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeploy(false)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={handleDeploy} className="btn-primary btn-md"><Play className="h-4 w-4" /> Deploy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  DISTRIBUTED TRACING                                                */
/* ================================================================== */
function DevOpsTracingSection() {
  const [traces] = useState<Trace[]>(getTraces());
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [spans, setSpans] = useState<Span[]>([]);

  const viewTrace = (t: Trace) => {
    setSelectedTrace(t);
    setSpans(getSpansForTrace(t.id));
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><GitFork className="h-4 w-4 text-accent" /> Request traces</h3>
        </div>
        {traces.length === 0 ? (
          <div className="p-6"><EmptyState icon={<GitFork className="h-6 w-6" />} title="No traces yet" description="Traces appear as requests are processed." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {traces.slice(0, 12).map((t) => (
              <li key={t.id}>
                <button onClick={() => viewTrace(t)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2/40", selectedTrace?.id === t.id && "bg-accent-soft")}>
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", t.status === "healthy" ? "bg-success/15 text-success" : t.status === "error" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>
                    {t.status === "healthy" ? <CheckCircle2 className="h-4 w-4" /> : t.status === "error" ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="truncate text-xs text-muted">{t.rootOperation}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span>{t.totalDurationMs}ms</span>
                      <span>·</span>
                      <span>{t.spanCount} spans</span>
                      {t.errorCount > 0 && <><span>·</span><span className="text-danger">{t.errorCount} errors</span></>}
                    </div>
                  </div>
                  <span className="text-xs text-muted">{formatDateTime(t.startTime)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> Span detail</h3>
        </div>
        {!selectedTrace ? (
          <div className="p-6"><EmptyState icon={<Eye className="h-6 w-6" />} title="Select a trace" description="Click a trace to view its spans." /></div>
        ) : spans.length === 0 ? (
          <div className="p-6">
            <p className="text-sm font-medium text-ink">{selectedTrace.name}</p>
            <p className="mt-1 text-xs text-muted">{selectedTrace.rootOperation} · {selectedTrace.totalDurationMs}ms</p>
            <p className="mt-2 text-xs text-muted">No span data persisted for this trace.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {spans.map((span) => (
              <li key={span.id} className="flex items-start gap-3 px-4 py-3">
                <div className="relative">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full", span.status === "ok" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                    {span.status === "ok" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  </span>
                  {spans.indexOf(span) < spans.length - 1 && <div className="absolute left-3.5 top-7 h-4 w-px bg-line" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{span.operation}</p>
                  <p className="text-xs text-muted">{span.service} · {span.durationMs || "pending"}ms</p>
                  {span.error && <p className="mt-0.5 text-xs text-danger">{span.error}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CDN + IMAGE/ASSET OPTIMIZATION                                     */
/* ================================================================== */
function DevOpsCdnSection() {
  const [imgCfg] = useState<ImageOptimizationConfig>(defaultImageOptimization);
  const [assetStats] = useState<AssetOptimizationStats>(getAssetOptimizationStats());
  const cfg = cdnConfig;

  return (
    <div className="mt-6 space-y-6">
      {/* CDN Status */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Globe className="h-4 w-4 text-accent" /> CDN / Edge delivery</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Provider</p>
            <p className="mt-1 text-sm font-semibold text-ink">{cfg.provider}</p>
          </div>
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Domain</p>
            <p className="mt-1 text-sm font-mono text-ink">{cfg.domain}</p>
          </div>
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Edge locations</p>
            <p className="mt-1 text-sm font-semibold text-ink">{cfg.edgeLocations}</p>
          </div>
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Bandwidth</p>
            <p className="mt-1 text-sm font-semibold text-ink">{cfg.bandwidthUsedGb} GB / {cfg.monthlyBandwidthGb} GB</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className={cn("chip", cfg.active && "chip-active")}><Radio className="h-3.5 w-3.5" /> CDN {cfg.active ? "Active" : "Inactive"}</span>
          <span className={cn("chip", cfg.sslEnabled && "chip-active")}><Shield className="h-3.5 w-3.5" /> SSL {cfg.sslEnabled ? "Enabled" : "Disabled"}</span>
          <span className={cn("chip", cfg.wafEnabled && "chip-active")}><Shield className="h-3.5 w-3.5" /> WAF {cfg.wafEnabled ? "Active" : "Inactive"}</span>
          <span className={cn("chip", cfg.ddosProtection && "chip-active")}><Shield className="h-3.5 w-3.5" /> DDoS {cfg.ddosProtection ? "Protected" : "Unprotected"}</span>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Cache rules</p>
          <div className="space-y-2">
            {cfg.cachingRules.map((rule) => (
              <div key={rule.path} className="flex items-center gap-3 rounded-lg border border-line p-3">
                <span className="font-mono text-xs text-ink">{rule.path}</span>
                <span className="text-xs text-muted">TTL: {rule.ttl > 86400 ? `${rule.ttl / 86400}d` : rule.ttl > 0 ? `${rule.ttl}s` : "No cache"}</span>
                <span className={cn("chip text-[0.6rem]", rule.enabled && "chip-active")}>{rule.enabled ? "Active" : "Disabled"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image optimization */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><ImageIcon className="h-4 w-4 text-accent" /> Image optimization</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className={cn("chip", imgCfg.webpEnabled && "chip-active")}>WebP {imgCfg.webpEnabled ? "On" : "Off"}</span>
          <span className={cn("chip", imgCfg.avifEnabled && "chip-active")}>AVIF {imgCfg.avifEnabled ? "On" : "Off"}</span>
          <span className={cn("chip", imgCfg.lazyLoad && "chip-active")}>Lazy load {imgCfg.lazyLoad ? "On" : "Off"}</span>
          <span className={cn("chip", imgCfg.autoFormat && "chip-active")}>Auto-format {imgCfg.autoFormat ? "On" : "Off"}</span>
          <span className="chip">Quality: {imgCfg.quality}%</span>
          <span className="chip">Max: {imgCfg.maxWidth}×{imgCfg.maxHeight}</span>
        </div>

        <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Responsive breakpoints</p>
        <div className="flex flex-wrap gap-2">
          {imageBreakpoints.map((bp) => (
            <span key={bp.width} className="chip">{bp.label} ({bp.width}px)</span>
          ))}
        </div>
      </div>

      {/* Asset optimization stats */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Layers className="h-4 w-4 text-accent" /> Asset optimization</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Total assets</p>
            <p className="mt-1 text-lg font-semibold text-ink">{assetStats.totalAssets}</p>
          </div>
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Original size</p>
            <p className="mt-1 text-lg font-semibold text-ink">{(assetStats.totalSizeKb / 1024).toFixed(1)} MB</p>
          </div>
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Optimized size</p>
            <p className="mt-1 text-lg font-semibold text-ink">{(assetStats.optimizedSizeKb / 1024).toFixed(1)} MB</p>
          </div>
          <div className="rounded-xl bg-surface2/50 p-3">
            <p className="text-xs text-muted">Saved</p>
            <p className="mt-1 text-lg font-semibold text-success">{assetStats.savedPercent}%</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">CSS: {(assetStats.cssSizeKb / 1024).toFixed(1)} MB</span>
          <span className="chip">JS: {(assetStats.jsSizeKb / 1024).toFixed(1)} MB</span>
          <span className="chip">Fonts: {(assetStats.fontSizeKb / 1024).toFixed(1)} MB</span>
          <span className="chip">Images: {(assetStats.imageSizeKb / 1024).toFixed(1)} MB</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  WORKER POOLS + SCHEDULER                                          */
/* ================================================================== */
function DevOpsWorkersSection() {
  const running = workerPools.filter((w) => w.status === "running").length;
  const totalProcessed = workerPools.reduce((s, w) => s + w.jobsProcessed, 0);

  return (
    <div className="mt-6 space-y-6">
      {/* Worker pools */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Cpu className="h-4 w-4 text-accent" /> Worker pools</h3>
          <p className="text-xs text-muted">{running}/{workerPools.length} active · {totalProcessed.toLocaleString()} jobs processed</p>
        </div>
        <div className="mt-4 space-y-3">
          {workerPools.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    w.status === "running" ? "bg-success/15 text-success" : w.status === "idle" ? "bg-accent-soft text-accent" : w.status === "error" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>
                    <HardDrive className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{w.name}</p>
                    <p className="text-xs text-muted">Queue: {w.queue} · Concurrency: {w.concurrency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{w.activeWorkers}/{w.concurrency} active</span>
                  <span>{w.jobsProcessed.toLocaleString()} jobs</span>
                  <span className={cn("badge capitalize",
                    w.status === "running" ? "bg-success/15 text-success" : w.status === "idle" ? "bg-accent-soft text-accent" : "bg-danger/15 text-danger")}>{w.status}</span>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(w.activeWorkers / w.concurrency) * 100}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>Avg: {w.avgProcessingMs}ms/job</span>
                <span>Failed: {w.jobsFailed}</span>
                <span>Uptime: {w.uptimeHours}h</span>
                {w.lastHeartbeat && <span>Heartbeat: {formatDateTime(w.lastHeartbeat)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job schedule */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Clock className="h-4 w-4 text-accent" /> Scheduled jobs</h3>
          <p className="text-xs text-muted">{jobSchedules.filter((s) => s.enabled).length} enabled</p>
        </div>
        <div className="mt-4 space-y-3">
          {jobSchedules.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full",
                s.status === "running" ? "bg-success/15 text-success animate-pulse" : s.status === "error" ? "bg-danger/15 text-danger" : "bg-accent-soft text-accent")}>
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="text-xs text-muted">{s.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span className="font-mono text-accent">{s.cronExpression}</span>
                  <span>· Queue: {s.queue}</span>
                  <span>· Avg: {s.avgDurationMs}ms</span>
                  {s.nextRun && <span>· Next: {formatDateTime(s.nextRun)}</span>}
                </div>
              </div>
              <span className={cn("chip", s.enabled && "chip-active")} aria-pressed={s.enabled}>{s.enabled ? "On" : "Off"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DISASTER RECOVERY + OBSERVABILITY + OPERATIONAL ANALYTICS          */
/* ================================================================== */
function DevOpsDrSection() {
  const [obsMetrics] = useState<ObservabilityMetric[]>(getObservabilityMetrics());
  const [opsAnalytics] = useState<OpsAnalytic[]>(getOperationalAnalytics());

  const activePlans = drPlans.filter((p) => p.status === "active").length;
  const passed = drPlans.filter((p) => p.lastTestResult === "pass").length;

  return (
    <div className="mt-6 space-y-6">
      {/* Observability metrics */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> Observability</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {obsMetrics.map((m) => (
            <div key={m.name} className="rounded-xl bg-surface2/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{m.name}</p>
                <span className={cn("text-xs font-medium", m.trend === "up" && m.changePercent > 0 && m.name !== "Error Rate" ? "text-success" : m.trend === "up" ? "text-danger" : "text-muted")}>
                  {m.changePercent > 0 ? "↑" : "↓"} {Math.abs(m.changePercent).toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold text-ink">{m.value} <span className="text-xs font-normal text-muted">{m.unit}</span></p>
              <div className="mt-2 flex items-end gap-0.5 h-8">
                {m.sparkline.map((v, i) => (
                  <div key={i} className="w-2 rounded-t bg-accent/40" style={{ height: `${(v / Math.max(...m.sparkline)) * 100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Analytics (DORA Metrics) */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-4 w-4 text-accent" /> Operational analytics (DORA)</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {opsAnalytics.map((a) => (
            <div key={a.metric} className={cn("rounded-xl p-4", a.status === "good" ? "bg-success/5 border border-success/20" : a.status === "warning" ? "bg-warning/5 border border-warning/20" : "bg-danger/5 border border-danger/20")}>
              <p className="text-xs text-muted">{a.metric}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-semibold text-ink">{a.value}</span>
                <span className="text-xs text-muted">{a.unit}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className={cn(a.changePercent >= 0 ? "text-success" : "text-danger")}>
                  {a.changePercent >= 0 ? "↑" : "↓"} {Math.abs(a.changePercent).toFixed(1)}%
                </span>
                <span className="text-muted">vs previous</span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{a.period}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disaster Recovery Plans */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><LifeBuoy className="h-4 w-4 text-accent" /> Disaster recovery plans</h3>
          <p className="text-xs text-muted">{activePlans} active · {passed}/{drPlans.length} passed tests</p>
        </div>
        <div className="mt-4 space-y-4">
          {drPlans.map((plan) => (
            <div key={plan.id} className={cn("rounded-xl border p-4", plan.status === "active" ? "border-success/20 bg-success/5" : plan.status === "testing" ? "border-warning/20 bg-warning/5" : "border-line bg-surface2/40")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{plan.name}</p>
                    <span className={cn("badge capitalize", plan.status === "active" ? "bg-success/15 text-success" : plan.status === "testing" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{plan.status}</span>
                    <span className="badge bg-surface2 capitalize text-muted">{plan.type.replace(/_/g, " ")}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                    <span>RPO: <span className="font-semibold text-ink">{plan.rpo}</span></span>
                    <span>RTO: <span className="font-semibold text-ink">{plan.rto}</span></span>
                    {plan.lastTested && <span>Tested: {formatDateTime(plan.lastTested)}</span>}
                  </div>
                  {plan.lastTestResult && (
                    <span className={cn("badge mt-1", plan.lastTestResult === "pass" ? "bg-success/15 text-success" : plan.lastTestResult === "fail" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>
                      Last test: {plan.lastTestResult}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Regions: {plan.regions.join(", ")}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {plan.procedures.map((p, i) => (
                    <span key={i} className="badge bg-surface2 text-muted">{i + 1}. {p}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
