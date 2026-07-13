import { useEffect, useState, useCallback } from "react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import {
  Activity, Zap, Play, RefreshCw, CheckCircle2, Clock,
  ArrowRight, Radio, Shield, RotateCcw,
  BrainCircuit, FileText, Sparkles, Bell,
  Users, Calendar, Eye, BookOpen, Monitor,
} from "lucide-react";

const API = "/api/v1/automation";

interface Stats {
  rules: { total: number; active: number; total_runs: number; avg_runs: number };
  runs: { total_runs: number; completed_runs: number; errored_runs: number; running_runs: number; avg_duration_ms: number };
  jobs: { total: number; queued: number; running: number; failed: number; completed: number };
  workers: { status: string; count: number }[];
  schedules: { total_schedules: number; active_schedules: number };
  recentRuns: any[];
}

interface Rule {
  id: string;
  name: string;
  description?: string;
  trigger_event: string;
  enabled: boolean;
  priority: number;
  run_count: number;
  last_run_at?: string;
}

interface Worker {
  id: string;
  name: string;
  worker_type: string;
  status: string;
  current_jobs: number;
  max_concurrent_jobs: number;
  total_jobs_processed: number;
  total_jobs_failed?: number;
  last_heartbeat_at?: string;
}

export default function AdminAutomationDashboard() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "rules" | "jobs" | "workers" | "schedules" | "logs" | "ai">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simRuleId, setSimRuleId] = useState("");
  const [simResult, setSimResult] = useState<any>(null);
  const [aiResult, setAiResult] = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, rulesRes, jobsRes, workersRes, schedRes, logsRes] = await Promise.all([
        fetch(`${API}/stats`).then(r => r.json()),
        fetch(`${API}/rules`).then(r => r.json()),
        fetch(`${API}/jobs/queued`).then(r => r.json()),
        fetch(`${API}/workers/active`).then(r => r.json()),
        fetch(`${API}/schedules`).then(r => r.json()),
        fetch(`${API}/logs?limit=30`).then(r => r.json()),
      ]);
      setStats(statsRes);
      setRules(rulesRes?.data || rulesRes || []);
      setJobs(jobsRes?.data || jobsRes || []);
      setWorkers(workersRes?.data || workersRes || []);
      setSchedules(schedRes?.data || schedRes || []);
      setLogs(logsRes?.data || logsRes || []);
    } catch (err) {
      console.warn("[Automation] Backend unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const runRule = async (ruleId: string) => {
    try {
      const res = await fetch(`${API}/rules/${ruleId}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (data.status === "completed" || data.conditionsMet) toast.success("Rule executed", `${data.actionsExecuted} actions`);
      else toast.info("Rule ran", "Conditions not met — no actions executed");
      fetchAll();
    } catch { toast.error("Failed to run rule"); }
  };

  const simulateRule = async () => {
    if (!simRuleId.trim()) { toast.error("Rule ID required"); return; }
    try {
      const res = await fetch(`${API}/rules/${simRuleId.trim()}/simulate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      setSimResult(data);
      toast.success("Simulation complete");
    } catch { toast.error("Simulation failed"); }
  };

  const checkSchedules = async () => {
    try {
      const res = await fetch(`${API}/schedules/check`, { method: "POST" });
      const data = await res.json();
      toast.success(`Schedules checked`, `${data.triggered} rules triggered`);
      fetchAll();
    } catch { toast.error("Schedule check failed"); }
  };

  const seedAutomation = async () => {
    try {
      const res = await fetch(`${API}/seed`, { method: "POST" });
      const data = await res.json();
      toast.success(`Seeded ${data.seeded} items`, `${data.total} total`);
      fetchAll();
    } catch { toast.error("Seed failed"); }
  };

  const generateAI = async (type: string) => {
    try {
      const res = await fetch(`${API}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context: { name: "Sample Product", category: "Fashion", features: ["Premium", "Eco-friendly"] } }),
      });
      const data = await res.json();
      setAiResult(data.content || "Generated content");
      toast.success(`AI ${type.replace(/_/g, " ")} generated`);
    } catch { toast.error("AI generation failed"); }
  };



  const TABS = [
    { id: "dashboard" as const, label: "Dashboard", icon: Activity },
    { id: "rules" as const, label: "Rules", icon: Zap },
    { id: "jobs" as const, label: "Jobs", icon: Radio },
    { id: "workers" as const, label: "Workers", icon: Users },
    { id: "schedules" as const, label: "Schedules", icon: Calendar },
    { id: "logs" as const, label: "Logs", icon: BookOpen },
    { id: "ai" as const, label: "AI Auto", icon: BrainCircuit },
  ];

  const statCards = stats ? [
    { label: "Active Rules", value: String(stats.rules?.active || 0), sub: `${stats.rules?.total || 0} total`, icon: Zap, color: "text-accent" },
    { label: "Total Runs", value: String(stats.runs?.total_runs || 0), sub: `${stats.runs?.running_runs || 0} running`, icon: Play, color: "text-accent" },
    { label: "Queued Jobs", value: String(stats.jobs?.queued || 0), sub: `${stats.jobs?.failed || 0} failed`, icon: Radio, color: "text-warning" },
    { label: "Active Workers", value: String(stats.workers?.filter((w: any) => w.status === "idle" || w.status === "busy").length || 0), sub: `${stats.schedules?.active_schedules || 0} schedules`, icon: Users, color: "text-success" },
  ] : [];

  return (
    <>
      <Seo title="Automation Platform" path="/admin/automation" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Enterprise Automation</h1>
            <p className="mt-1 text-sm text-muted">Background jobs · Scheduler · Event automation · AI content</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip capitalize", tab === t.id && "chip-active")}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
            <button onClick={seedAutomation} className="btn-ghost btn-sm"><Sparkles className="h-3.5 w-3.5" /> Seed</button>
            <button onClick={fetchAll} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse"><div className="h-4 w-24 rounded bg-surface2" /><div className="mt-3 h-8 w-16 rounded bg-surface2" /></div>
              )) : statCards.map(s => (
                <div key={s.label} className="card p-5">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-full bg-surface2", s.color)}><s.icon className="h-5 w-5" /></span>
                  <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Pipeline */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Zap className="h-4 w-4 text-accent" /> Automation Pipeline</h3>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {[
                    { icon: Zap, label: "Trigger" },
                    { icon: Shield, label: "Condition" },
                    { icon: Clock, label: "Delay" },
                    { icon: ArrowRight, label: "Branch" },
                    { icon: RotateCcw, label: "Loop" },
                    { icon: Play, label: "Action" },
                    { icon: CheckCircle2, label: "End" },
                  ].map((step, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="badge inline-flex items-center gap-1 bg-surface2 text-muted"><step.icon className="h-3 w-3" /> {step.label}</span>
                      {i < 6 && <ArrowRight className="h-3 w-3 text-line" />}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={checkSchedules} className="btn-outline btn-sm"><Calendar className="h-3.5 w-3.5" /> Check schedules</button>
                  <button onClick={() => setTab("rules")} className="btn-outline btn-sm"><Zap className="h-3.5 w-3.5" /> View rules</button>
                </div>
              </div>

              {/* Recent runs */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Clock className="h-4 w-4 text-accent" /> Recent Runs</h3>
                {stats?.recentRuns?.length ? (
                  <div className="mt-4 space-y-2">
                    {stats.recentRuns.slice(0, 6).map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 rounded-lg bg-surface2/30 p-2.5">
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", {
                          "bg-success/15 text-success": r.status === "completed",
                          "bg-danger/15 text-danger": r.status === "completed_with_errors",
                          "bg-accent-soft text-accent": r.status === "running",
                        })}><Activity className="h-3.5 w-3.5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{r.rule_name || r.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted">{r.status} · {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : ""} · {r.trigger_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-4 text-xs text-muted">No runs yet. Seed and trigger rules.</p>}
              </div>
            </div>
          </>
        )}

        {/* RULES */}
        {tab === "rules" && (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted">{rules.length} rules</p>
            </div>
            {rules.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Zap className="h-6 w-6" />} title="No automation rules" description="Seed default rules or create your own." /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {rules.map(rule => (
                  <div key={rule.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", rule.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                      <Zap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{rule.name}</p>
                        <span className="badge bg-surface2 capitalize text-muted">{rule.trigger_event?.replace(/\./g, " ")}</span>
                        <span className="badge bg-surface2 text-muted">P{rule.priority}</span>
                      </div>
                      <p className="truncate text-xs text-muted">{rule.description || "—"}</p>
                      <p className="mt-0.5 text-xs text-muted">{rule.run_count} runs{rule.last_run_at ? ` · last ${new Date(rule.last_run_at).toLocaleString()}` : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      <span className={cn("chip", rule.enabled && "chip-active")}>{rule.enabled ? "On" : "Off"}</span>
                      <button onClick={() => runRule(rule.id)} className="btn-ghost btn-sm"><Play className="h-3.5 w-3.5" /> Run</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Simulation */}
            <div className="mt-6 card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Eye className="h-4 w-4 text-accent" /> Simulation</h3>
              <p className="mt-1 text-xs text-muted">Dry-run a rule to preview execution without side effects.</p>
              <div className="mt-3 flex gap-2">
                <input className="input-field flex-1" value={simRuleId} onChange={e => setSimRuleId(e.target.value)} placeholder="Rule ID to simulate..." />
                <button onClick={simulateRule} className="btn-primary btn-sm"><Eye className="h-4 w-4" /> Simulate</button>
              </div>
              {simResult && (
                <div className="mt-4 rounded-xl border border-line p-4">
                  <p className="text-sm font-medium text-ink">Simulation Results</p>
                  <p className="text-sm text-muted">Conditions: {simResult.conditions?.met ? "✅ MET" : "❌ NOT MET"}</p>
                  <div className="mt-2 space-y-1">
                    {simResult.trace?.map((t: string, i: number) => (
                      <p key={i} className="font-mono text-[0.6rem] text-muted">{t}</p>
                    ))}
                  </div>
                  {simResult.actions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-ink">Actions ({simResult.actions.length})</p>
                      {simResult.actions.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted">
                          <span className={cn("badge", a.would_execute ? "bg-success/10 text-success" : "bg-surface2 text-muted")}>
                            {a.would_execute ? "WOULD EXECUTE" : "SKIPPED"}
                          </span>
                          {a.type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* JOBS */}
        {tab === "jobs" && (
          <div className="mt-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="font-semibold text-ink">Queued Jobs ({jobs.length})</h3>
                {jobs.length === 0 ? (
                  <p className="mt-4 text-xs text-muted">No queued jobs</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {jobs.map(job => (
                      <div key={job.id} className="rounded-lg bg-surface2/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-ink">{job.type}</span>
                          <span className="badge bg-accent-soft text-accent">P{job.priority}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">Attempts: {job.retry_count}/{job.max_retries}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-ink">Job Stats</h3>
                {stats?.jobs ? (
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Completed", value: stats.jobs.completed || 0, color: "text-success" },
                      { label: "Running", value: stats.jobs.running || 0, color: "text-accent" },
                      { label: "Queued", value: stats.jobs.queued || 0, color: "text-warning" },
                      { label: "Failed", value: stats.jobs.failed || 0, color: "text-danger" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className={cn("text-sm font-medium", s.color)}>{s.label}</span>
                        <span className="text-sm text-ink">{s.value}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-4 text-xs text-muted">No stats available</p>}
              </div>
            </div>
            {/* Manual enqueue buttons */}
            <div className="mt-6 card p-5">
              <h3 className="font-semibold text-ink">Manual Actions</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {["send.email", "webhook", "inventory.sync", "purge.cache", "generate.reports", "backup.database"].map(action => (
                  <button key={action} onClick={async () => {
                    await fetch(`${API}/actions/${action.replace(/\./g, "_")}/execute`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ context: {} }),
                    }).catch(() => {});
                    toast.success(`Action dispatched: ${action}`);
                  }} className="btn-outline btn-sm capitalize">{action.replace(/\./g, " ")}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WORKERS */}
        {tab === "workers" && (
          <div className="mt-8">
            {workers.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="No workers registered" description="Register workers to process automation jobs." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workers.map(w => (
                  <div key={w.id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", {
                        "bg-success/15 text-success": w.status === "idle",
                        "bg-accent-soft text-accent": w.status === "busy",
                        "bg-danger/15 text-danger": w.status === "stopped",
                      })}><Monitor className="h-5 w-5" /></span>
                      <div>
                        <p className="font-semibold text-ink">{w.name}</p>
                        <p className="text-xs text-muted capitalize">{w.status} · {w.worker_type}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted">Jobs processed</span><p className="font-medium text-ink">{w.total_jobs_processed || 0}</p></div>
                      <div><span className="text-muted">Failed</span><p className="font-medium text-ink">{w.total_jobs_failed || 0}</p></div>
                      <div><span className="text-muted">Concurrent</span><p className="font-medium text-ink">{w.current_jobs || 0}/{w.max_concurrent_jobs || 10}</p></div>
                      <div><span className="text-muted">Last heartbeat</span><p className="font-medium text-ink">{w.last_heartbeat_at ? new Date(w.last_heartbeat_at).toLocaleTimeString() : "—"}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULES */}
        {tab === "schedules" && (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted">{schedules.length} schedules</p>
              <button onClick={checkSchedules} className="btn-ghost btn-sm"><Play className="h-3.5 w-3.5" /> Check due</button>
            </div>
            {schedules.length === 0 ? (
              <EmptyState icon={<Calendar className="h-6 w-6" />} title="No schedules" description="Seed default schedules or create via API." />
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {schedules.map(s => (
                  <div key={s.id} className="card p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><Calendar className="h-5 w-5" /></span>
                    <p className="mt-3 font-semibold text-ink">{s.name}</p>
                    <p className="mt-1 font-mono text-sm text-muted">{s.cron_expression}</p>
                    <p className="text-xs text-muted">{s.timezone} · {s.run_count || 0} runs</p>
                    {s.next_run_at && <p className="mt-1 text-xs text-muted">Next: {new Date(s.next_run_at).toLocaleString()}</p>}
                    <span className={cn("badge mt-3", s.enabled ? "bg-success/10 text-success" : "bg-surface2 text-muted")}>{s.enabled ? "Active" : "Paused"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOGS */}
        {tab === "logs" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{logs.length} recent log entries</p>
            {logs.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<BookOpen className="h-6 w-6" />} title="No logs" description="Logs appear when rules execute." /></div>
            ) : (
              <div className="mt-4 space-y-1">
                {logs.map((log: any) => (
                  <div key={log.id} className="card p-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", {
                        "bg-success": log.level === "info",
                        "bg-warning": log.level === "warn",
                        "bg-danger": log.level === "error",
                      })} />
                      <span className="min-w-0 flex-1 text-xs text-ink">{log.message}</span>
                      <span className="badge bg-surface2 text-[0.55rem] text-muted">{log.level}</span>
                      <span className="text-[0.55rem] text-muted">{log.created_at ? new Date(log.created_at).toLocaleTimeString() : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI AUTOMATION */}
        {tab === "ai" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Automatically generate SEO, descriptions, alt text, and more.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { type: "seo_title", label: "SEO Title", icon: FileText },
                { type: "seo_description", label: "SEO Description", icon: FileText },
                { type: "product_description", label: "Product Description", icon: BookOpen },
                { type: "alt_text", label: "Alt Text", icon: Eye },
                { type: "meta_description", label: "Meta Description", icon: FileText },
                { type: "category_copy", label: "Category Copy", icon: FileText },
                { type: "buying_guide", label: "Buying Guide", icon: BookOpen },
                { type: "faq", label: "FAQ", icon: Bell },
                { type: "brand_copy", label: "Brand Copy", icon: Sparkles },
              ].map(ai => (
                <button key={ai.type} onClick={() => generateAI(ai.type)} className="card p-5 text-left hover:shadow-[var(--shadow-card)]">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><ai.icon className="h-5 w-5" /></span>
                  <p className="mt-3 font-semibold text-ink">Generate {ai.label}</p>
                  <p className="mt-1 text-xs text-muted">AI-powered content generation</p>
                </button>
              ))}
            </div>
            {aiResult && (
              <div className="mt-6 card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><BrainCircuit className="h-4 w-4 text-accent" /> Generated Result</h3>
                <p className="mt-3 text-sm text-muted">{aiResult}</p>
                <button onClick={() => setAiResult("")} className="btn-ghost btn-sm mt-3">Clear</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
