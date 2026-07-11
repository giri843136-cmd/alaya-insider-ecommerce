import { useEffect, useState } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Zap, Play, Plus, Trash2, Copy, Clock, CheckCircle2, XCircle, ChevronRight, Sparkles, History, X, Save } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { uid } from "../../lib/utils";
import {
  TRIGGERS, OPERATORS, ACTIONS, SCHEDULES, WORKFLOW_TEMPLATES,
  loadWorkflows, saveWorkflows, loadExecutions, saveExecutions, executeWorkflow, buildContext,
  type Workflow, type TriggerId, type ActionId, type Condition, type Action, type ExecutionLog,
} from "../../lib/workflows";
import { cn } from "@/utils/cn";

export default function AdminWorkflows() {
  const { products, orders, sendEmail, log: logStore } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "workflows" | "templates" | "logs" | "builder">("dashboard");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [editing, setEditing] = useState<Workflow | null>(null);

  useEffect(() => {
    setWorkflows(loadWorkflows());
    setExecutions(loadExecutions());
  }, []);

  // Seed templates on first load
  useEffect(() => {
    if (loadWorkflows().length === 0) {
      const seeded = WORKFLOW_TEMPLATES.map((t) => ({ ...t, id: uid("wf"), createdAt: Date.now(), runs: 0, failures: 0 }));
      saveWorkflows(seeded);
      setWorkflows(seeded);
    }
  }, []);

  const persist = (next: Workflow[]) => { setWorkflows(next); saveWorkflows(next); };
  const persistExec = (next: ExecutionLog[]) => { setExecutions(next); saveExecutions(next); };

  const active = workflows.filter((w) => w.enabled);
  const paused = workflows.filter((w) => !w.enabled);
  const failed = executions.filter((e) => !e.success).length;
  const totalRuns = executions.length;
  const avgMs = totalRuns ? Math.round(executions.reduce((s, e) => s + e.durationMs, 0) / totalRuns) : 0;

  const runNow = (wf: Workflow) => {
    const sampleProduct = products[0];
    const sampleOrder = orders[0];
    const ctx = wf.trigger.includes("order") && sampleOrder
      ? buildContext({ order: sampleOrder, actor: "admin" })
      : buildContext({ product: sampleProduct, actor: "admin" });
    const helpers = {
      sendEmail: (to: string, tpl: string) => sendEmail(tpl, to, "workflow"),
      log: (msg: string) => logStore("workflow.action", "workflow", wf.id, msg),
    };
    const exec = executeWorkflow(wf, ctx, helpers);
    persistExec([exec, ...executions]);
    persist(workflows.map((w) => w.id === wf.id ? { ...w, runs: w.runs + 1, lastRun: Date.now(), failures: w.failures + (exec.success ? 0 : 1) } : w));
    if (exec.success) toast.success("Workflow executed", `${wf.name} · ${exec.steps.length} steps`);
    else toast.error("Workflow failed", exec.error);
  };

  const toggle = (id: string) => persist(workflows.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w));
  const duplicate = (wf: Workflow) => { persist([{ ...wf, id: uid("wf"), name: `${wf.name} (Copy)`, runs: 0, failures: 0, createdAt: Date.now(), template: false }, ...workflows]); toast.success("Workflow duplicated"); };
  const remove = (id: string) => { persist(workflows.filter((w) => w.id !== id)); toast.success("Workflow deleted"); };

  const addTemplate = (t: typeof WORKFLOW_TEMPLATES[number]) => {
    const wf: Workflow = { ...t, id: uid("wf"), createdAt: Date.now(), runs: 0, failures: 0 };
    persist([wf, ...workflows]);
    toast.success("Template added", t.name);
  };

  const saveWorkflow = (wf: Workflow) => {
    const exists = workflows.find((w) => w.id === wf.id);
    persist(exists ? workflows.map((w) => w.id === wf.id ? wf : w) : [wf, ...workflows]);
    setEditing(null);
    toast.success(exists ? "Workflow updated" : "Workflow created");
  };

  const STATS = [
    { label: "Active workflows", value: String(active.length), sub: `${paused.length} paused`, icon: Zap },
    { label: "Total executions", value: String(totalRuns), sub: `${failed} failed`, icon: Play },
    { label: "Avg. execution", value: `${avgMs}ms`, sub: "Fast & logged", icon: Clock },
    { label: "Success rate", value: totalRuns ? `${Math.round(((totalRuns - failed) / totalRuns) * 100)}%` : "—", sub: "Health metric", icon: CheckCircle2 },
  ];

  return (
    <>
      <Seo title="Workflows" path="/admin/workflows" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Workflow Automation</h1>
            <p className="mt-1 text-sm text-muted">Connect every module. Automate without code.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["dashboard", "Dashboard"], ["workflows", "Workflows"], ["templates", "Templates"], ["logs", "Execution logs"], ["builder", "Builder"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize", tab === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
                  <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Zap className="h-4 w-4 text-accent" /> Automation pipelines</h3>
              <p className="mt-1 text-sm text-muted">Pre-built automation chains connect modules end-to-end:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { name: "Order", steps: ["Order paid", "Generate invoice", "Assign supplier", "Email customer", "Notify admin"] },
                  { name: "Supplier", steps: ["Order created", "Find supplier", "Prepare PO", "Send email", "Log activity"] },
                  { name: "Security", steps: ["Failed logins", "Block IP", "Notify admin", "Audit log", "Force reset"] },
                  { name: "Marketing", steps: ["Product viewed", "Show popup", "Capture email", "Send coupon", "Track conversion"] },
                ].map((p) => (
                  <div key={p.name} className="rounded-xl border border-line bg-surface2/40 p-4">
                    <p className="text-sm font-semibold text-ink">{p.name} pipeline</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {p.steps.map((s, i) => (
                        <span key={s} className="flex items-center gap-1">
                          <span className="badge bg-surface text-muted">{s}</span>
                          {i < p.steps.length - 1 && <ChevronRight className="h-3 w-3 text-line" />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* WORKFLOWS */}
        {tab === "workflows" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{workflows.length} workflows</p>
              <button onClick={() => setEditing({ id: uid("wf"), name: "New workflow", description: "", trigger: "manual", conditions: [], actions: [], enabled: true, maxRetries: 2, createdAt: Date.now(), runs: 0, failures: 0 })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New workflow</button>
            </div>
            {workflows.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Zap className="h-6 w-6" />} title="No workflows" description="Add a template or build your own." /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {workflows.map((wf) => (
                  <div key={wf.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", wf.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Zap className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{wf.name}</p>
                        <span className="badge bg-surface2 capitalize text-muted">{wf.trigger.replace(/_/g, " ")}</span>
                        {wf.schedule && <span className="badge bg-accent-soft text-accent">{wf.schedule}</span>}
                      </div>
                      <p className="truncate text-xs text-muted">{wf.description || `${wf.actions.length} action(s) · ${wf.conditions.length} condition(s)`}</p>
                      <p className="mt-0.5 text-xs text-muted">{wf.runs} runs · {wf.failures} failed {wf.lastRun ? `· last ${formatDateTime(wf.lastRun)}` : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => runNow(wf)} className="btn-ghost btn-sm"><Play className="h-3.5 w-3.5" /> Run</button>
                      <button onClick={() => toggle(wf.id)} className={cn("chip", wf.enabled && "chip-active")} aria-pressed={wf.enabled}>{wf.enabled ? "On" : "Off"}</button>
                      <button onClick={() => setEditing(wf)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Edit"><Sparkles className="h-4 w-4" /></button>
                      <button onClick={() => duplicate(wf)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => remove(wf.id)} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATES */}
        {tab === "templates" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{WORKFLOW_TEMPLATES.length} ready-made workflows.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WORKFLOW_TEMPLATES.map((t, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-start justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><Zap className="h-5 w-5" /></span>
                    <span className="badge bg-surface2 capitalize text-muted">{t.trigger.replace(/_/g, " ")}</span>
                  </div>
                  <p className="mt-3 font-semibold text-ink">{t.name}</p>
                  <p className="mt-1 text-xs text-muted">{t.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.actions.map((a) => <span key={a.id} className="badge bg-surface2 text-muted">{a.type.replace(/_/g, " ")}</span>)}
                  </div>
                  <button onClick={() => addTemplate(t)} className="btn-outline btn-sm mt-4 w-full"><Plus className="h-4 w-4" /> Add workflow</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXECUTION LOGS */}
        {tab === "logs" && (
          <div className="mt-8">
            {executions.length === 0 ? (
              <EmptyState icon={<History className="h-6 w-6" />} title="No executions yet" description="Run a workflow to see logs." />
            ) : (
              <div className="space-y-3">
                {executions.slice(0, 30).map((e) => (
                  <div key={e.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("grid h-7 w-7 place-items-center rounded-full", e.success ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                            {e.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          </span>
                          <p className="font-medium text-ink">{e.workflowName}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted">{formatDateTime(e.ts)} · {e.durationMs}ms · {e.retries} retries · {e.actor}</p>
                        {e.error && <p className="mt-1 text-xs text-danger">{e.error}</p>}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.steps.map((s, i) => <span key={i} className="badge bg-surface2 text-[0.6rem] text-muted">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUILDER */}
        {tab === "builder" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Select a workflow to edit in the visual builder, or create a new one from the Workflows tab.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workflows.map((wf) => (
                <button key={wf.id} onClick={() => setEditing(wf)} className="card p-5 text-left hover:shadow-[var(--shadow-card)]">
                  <p className="font-semibold text-ink">{wf.name}</p>
                  <p className="mt-1 text-xs text-muted">{wf.trigger.replace(/_/g, " ")} → {wf.actions.length} actions</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Workflow editor modal */}
      {editing && <WorkflowEditor wf={editing} onClose={() => setEditing(null)} onSave={saveWorkflow} />}
    </>
  );
}

/* --------------------------- Workflow Editor --------------------------- */
function WorkflowEditor({ wf, onClose, onSave }: { wf: Workflow; onClose: () => void; onSave: (wf: Workflow) => void }) {
  const [draft, setDraft] = useState<Workflow>(wf);
  useEscapeKey(onClose, true);
  useLockBody(true);
  const set = <K extends keyof Workflow>(k: K, v: Workflow[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const addCondition = () => set("conditions", [...draft.conditions, { id: uid("c"), field: "stock", operator: "lt", value: "8" }]);
  const addAction = () => set("actions", [...draft.actions, { id: uid("a"), type: "notify_admin" }]);
  const updateCondition = (id: string, patch: Partial<Condition>) => set("conditions", draft.conditions.map((c) => c.id === id ? { ...c, ...patch } : c));
  const updateAction = (id: string, patch: Partial<Action>) => set("actions", draft.actions.map((a) => a.id === id ? { ...a, ...patch } : a));

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Workflow builder">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="card relative z-10 my-4 w-full max-w-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{wf.name ? "Edit workflow" : "New workflow"}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>

        {/* Visual flow preview */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto rounded-xl bg-surface2/40 p-3">
          <span className="badge bg-accent text-accent-ink whitespace-nowrap">{draft.trigger.replace(/_/g, " ")}</span>
          {draft.conditions.length > 0 && <><ChevronRight className="h-3 w-3 shrink-0 text-line" /><span className="badge bg-warning/15 text-warning whitespace-nowrap">If</span></>}
          {draft.actions.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-line" />}
              <span className="badge bg-surface whitespace-nowrap capitalize">{a.type.replace(/_/g, " ")}</span>
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">Name</label><input className="input-field" value={draft.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div>
              <label className="label-field">Trigger</label>
              <select className="input-field" value={draft.trigger} onChange={(e) => set("trigger", e.target.value as TriggerId)}>
                {TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label-field">Description</label><input className="input-field" value={draft.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field">Schedule (if trigger=scheduled)</label>
              <select className="input-field" value={draft.schedule || ""} onChange={(e) => set("schedule", e.target.value || undefined)}>
                <option value="">None</option>
                {SCHEDULES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div><label className="label-field">Max retries</label><input type="number" min={0} max={5} className="input-field" value={draft.maxRetries} onChange={(e) => set("maxRetries", Number(e.target.value))} /></div>
            <label className="flex items-end gap-2 pb-3 text-sm text-ink"><input type="checkbox" checked={draft.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[var(--c-accent)]" /> Enabled</label>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between">
              <label className="label-field">Conditions</label>
              <button onClick={addCondition} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
            <div className="mt-2 space-y-2">
              {draft.conditions.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2">
                  <input className="input-field !py-2 flex-1" value={c.field} onChange={(e) => updateCondition(c.id, { field: e.target.value })} placeholder="field e.g. order.total" />
                  <select className="input-field !py-2 w-28" value={c.operator} onChange={(e) => updateCondition(c.id, { operator: e.target.value as Condition["operator"] })}>
                    {OPERATORS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <input className="input-field !py-2 flex-1" value={c.value} onChange={(e) => updateCondition(c.id, { value: e.target.value })} placeholder="value" />
                  <button onClick={() => set("conditions", draft.conditions.filter((x) => x.id !== c.id))} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {draft.conditions.length === 0 && <p className="text-xs text-muted">No conditions — runs on every trigger.</p>}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between">
              <label className="label-field">Actions</label>
              <button onClick={addAction} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
            <div className="mt-2 space-y-2">
              {draft.actions.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl border border-line p-2">
                  <select className="input-field !py-2 flex-1" value={a.type} onChange={(e) => updateAction(a.id, { type: e.target.value as ActionId })}>
                    {ACTIONS.map((ac) => <option key={ac.id} value={ac.id}>{ac.label}</option>)}
                  </select>
                  <button onClick={() => set("actions", draft.actions.filter((x) => x.id !== a.id))} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost btn-md">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn-primary btn-md"><Save className="h-4 w-4" /> Save workflow</button>
        </div>
      </div>
    </div>
  );
}
