import { useEffect, useMemo, useState } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import {
  Zap, Play, Plus, Trash2, Copy, CheckCircle2, XCircle, ChevronRight,
  X, Save, BarChart3, GitBranch, Layers, Server,
  Settings2, Search, Download, Upload, AlertTriangle, RefreshCw,
  Activity, UserCheck, GitMerge,
  ListTodo, Workflow, Sparkles, Eye,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime, uid } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  publishWorkflow, duplicateWorkflow,
  getBpmDashboardMetrics,
  getCategories, getRuleSets, createRuleSet, evaluateRuleSet,
  getDecisionTables,
  getStateMachines, createStateMachine, transitionState,
  getQueues, getQueueMessages, retryDeadLetter,
  getApprovalRequests, respondToApproval,
  getAuditTrails, generateAiDebugResult,
  exportWorkflows, importWorkflows, searchWorkflows,
  type BpmWorkflow, type BpmWorkflowMode,
  type BpmTriggerType, type BpmActionType,
  type BpmCondition, type BpmRuleSet, type BpmDecisionTable,
  type BpmStateMachine, type BpmQueue, type BpmQueueMessage,
  type BpmApprovalRequest, type BpmAiDebugResult,
  ACTION_TYPES, TRIGGER_TYPES, CONDITION_OPERATORS, EVENT_TYPES,
} from "../../lib/workflowsBpm";

type BpmTab = "dashboard" | "workflows" | "rules" | "decisions" | "state_machines" | "queues" | "approvals" | "audit" | "debugger";

export default function AdminWorkflowsBpm() {
  const { toast } = useToast();
  const [tab, setTab] = useState<BpmTab>("dashboard");
  const [workflows, setWorkflows] = useState<BpmWorkflow[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<BpmWorkflow | null>(null);
  const [importJson, setImportJson] = useState("");

  useEscapeKey(() => setImportJson(""), importJson !== "" && importJson !== "Paste JSON here...");
  useLockBody(importJson !== "" && importJson !== "Paste JSON here...");

  const refresh = () => setWorkflows(getWorkflows());
  useEffect(() => { refresh(); }, []);

  const metrics = useMemo(() => getBpmDashboardMetrics(), [workflows]);
  const filtered = useMemo(() => query ? searchWorkflows(query) : workflows, [query, workflows]);

  const STATS = [
    { label: "Workflows", value: String(metrics.totalWorkflows), sub: `${metrics.publishedWorkflows} published`, icon: Zap, color: "text-accent bg-accent-soft" },
    { label: "Executions", value: String(metrics.totalExecutions), sub: `${metrics.successRate}% success`, icon: Play, color: "text-success bg-success/15" },
    { label: "Queue Depth", value: String(metrics.queueDepth), sub: `${metrics.workerCount} workers active`, icon: Layers, color: "text-info bg-info/15" },
    { label: "Pending Approvals", value: String(metrics.pendingApprovals), sub: `${metrics.runningExecutions} running`, icon: UserCheck, color: "text-warning bg-warning/15" },
  ];

  const TABS: { id: BpmTab; label: string; icon: typeof Zap }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "rules", label: "Rules Engine", icon: GitBranch },
    { id: "decisions", label: "Decision Tables", icon: ListTodo },
    { id: "state_machines", label: "State Machines", icon: GitMerge },
    { id: "queues", label: "Queue Monitor", icon: Server },
    { id: "approvals", label: "Approvals", icon: UserCheck },
    { id: "audit", label: "Audit Trail", icon: Eye },
    { id: "debugger", label: "AI Debugger", icon: Sparkles },
  ];

  const handleDelete = (id: string) => {
    deleteWorkflow(id);
    refresh();
    toast.success("Workflow deleted");
  };

  const handlePublish = (id: string) => {
    const wf = publishWorkflow(id, "admin");
    if (wf) { refresh(); toast.success("Workflow published", `v${wf.version}`); }
  };

  const handleDuplicate = (id: string) => {
    duplicateWorkflow(id);
    refresh();
    toast.success("Workflow duplicated");
  };

  const handleSave = (wf: BpmWorkflow) => {
    const existing = workflows.find((w) => w.id === wf.id);
    if (existing) {
      updateWorkflow(wf.id, wf);
    } else {
      createWorkflow({ name: wf.name, description: wf.description, createdBy: "admin" });
    }
    refresh();
    setEditing(null);
    toast.success(existing ? "Workflow updated" : "Workflow created");
  };

  return (
    <>
      <Seo title="Workflow Automation BPM" path="/admin/workflows-bpm" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Enterprise BPM Platform</h1>
            <p className="mt-1 text-sm text-muted">Workflow automation · Rules engine · State machines · Queue orchestration</p>
          </div>
          <div className="flex flex-wrap gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize whitespace-nowrap", tab === id && "chip-active")}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="card p-5">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.color)}><s.icon className="h-5 w-5" /></span>
                  <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-4 w-4 text-accent" /> Top Workflows</h3>
                <div className="mt-4 space-y-2">
                  {metrics.topWorkflows.slice(0, 5).map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{w.name}</p>
                        <p className="text-xs text-muted">{w.executions} runs · {w.avgDurationMs}ms avg</p>
                      </div>
                      <span className={cn("badge", w.successRate >= 90 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                        {w.successRate}%
                      </span>
                    </div>
                  ))}
                  {metrics.topWorkflows.length === 0 && <p className="text-xs text-muted">No workflows executed yet.</p>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> Hourly Executions (24h)</h3>
                <div className="mt-4 flex items-end gap-1" style={{ height: 100 }}>
                  {metrics.hourlyExecutionTrend.slice(-12).map((h, i) => {
                    const max = Math.max(...metrics.hourlyExecutionTrend.map((x) => x.count), 1);
                    const pct = (h.count / max) * 100;
                    return (
                      <div key={i} className="group relative flex flex-1 flex-col items-center">
                        <span className="mb-1 text-[0.55rem] text-muted opacity-0 group-hover:opacity-100">{h.count}</span>
                        <div className="w-full rounded-t bg-accent/40" style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }} title={`${h.hour}: ${h.count}`} />
                        <span className="mt-1 text-[0.5rem] text-muted">{h.hour.split(":")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><GitBranch className="h-4 w-4 text-accent" /> Action Usage</h3>
                <div className="mt-4 space-y-1">
                  {metrics.actionUsage.slice(0, 10).map((a) => (
                    <div key={a.type} className="flex items-center justify-between text-sm">
                      <span className="text-muted capitalize">{a.type.replace(/_/g, " ")}</span>
                      <span className="font-medium text-ink">{a.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-danger" /> Error Distribution</h3>
                <div className="mt-4 space-y-1">
                  {metrics.errorDistribution.slice(0, 5).map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted">{e.error}</span>
                      <span className="font-medium text-danger">{e.count}</span>
                    </div>
                  ))}
                  {metrics.errorDistribution.length === 0 && <p className="text-xs text-muted">No errors recorded.</p>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Server className="h-4 w-4 text-accent" /> Queue Health</h3>
                <div className="mt-4 space-y-2">
                  {getQueues().slice(0, 4).map((q) => (
                    <div key={q.id} className="flex items-center justify-between rounded-lg border border-line p-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">{q.name}</p>
                        <p className="text-[0.6rem] text-muted">{q.pendingCount} pending · {q.runningCount} running</p>
                      </div>
                      <span className={cn("badge shrink-0", q.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                        {q.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* WORKFLOWS */}
        {tab === "workflows" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="input-field !pl-9" placeholder="Search workflows..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <button onClick={() => setEditing({ id: "", name: "New Workflow", description: "", categoryId: "cat_system", mode: "standard", status: "draft", version: 1, tags: [], variables: [], versions: [], trigger: { id: "", type: "manual", label: "Manual trigger", enabled: true, metadata: {} }, conditions: [], actions: [], approvals: { enabled: false, type: "sequential", steps: [], timeoutMinutes: 1440, emergencyOverride: false, requireAll: true, autoApproveIfNoResponse: false, notifyOnApproval: true, notifyOnRejection: true }, errorHandling: { onError: "retry", maxRetries: 3, retryDelayMs: 1000, escalateAfterFailures: 5, escalateTo: "", fallbackAction: "continue", compensationEnabled: false }, retryPolicy: { enabled: true, maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 60000, exponentialBackoff: true }, timeoutMs: 300000, executionMode: "sequential", sandboxEnabled: false, debugMode: false, permissions: [], createdBy: "admin", createdAt: 0, updatedAt: 0, totalRuns: 0, totalFailures: 0, avgDurationMs: 0, starred: false } as BpmWorkflow)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New</button>
              <button onClick={() => { const json = exportWorkflows(); navigator.clipboard?.writeText(json); toast.success("Exported to clipboard"); }} className="btn-ghost btn-sm"><Download className="h-4 w-4" /> Export</button>
              <button onClick={() => setImportJson("Paste JSON here...")} className="btn-ghost btn-sm"><Upload className="h-4 w-4" /> Import</button>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Workflow className="h-6 w-6" />} title="No workflows" description="Create your first workflow to automate a business process." /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {filtered.map((wf) => (
                  <div key={wf.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", wf.status === "published" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                      <Zap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{wf.name}</p>
                        <span className={cn("badge", wf.status === "published" ? "bg-success/15 text-success" : wf.status === "draft" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{wf.status}</span>
                        <span className="badge bg-accent-soft text-accent capitalize">{wf.mode.replace(/_/g, " ")}</span>
                        <span className="badge bg-surface2 text-muted capitalize">{wf.trigger.type.replace(/_/g, " ")}</span>
                        <span className="text-[0.6rem] text-muted">v{wf.version}</span>
                      </div>
                      <p className="truncate text-xs text-muted">{wf.description || `${wf.actions.length} action(s) · ${wf.conditions.length} condition(s)`}</p>
                      <p className="mt-0.5 text-xs text-muted">{wf.totalRuns} runs · {wf.totalFailures} failed · {wf.avgDurationMs}ms avg {wf.lastRunAt ? `· last ${formatDateTime(wf.lastRunAt)}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => setEditing(wf)} className="btn-ghost btn-sm"><Settings2 className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => handlePublish(wf.id)} disabled={wf.status === "published"} className="btn-ghost btn-sm"><Save className="h-3.5 w-3.5" /> Publish</button>
                      <button onClick={() => handleDuplicate(wf.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(wf.id)} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {importJson && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setImportJson("")} />
                <div className="card relative z-10 w-full max-w-lg p-6">
                  <h3 className="font-semibold text-ink">Import Workflows</h3>
                  <textarea className="input-field mt-3 h-32 w-full" value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder="Paste exported JSON..." />
                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={() => setImportJson("")} className="btn-ghost btn-sm">Cancel</button>
                    <button onClick={() => { const res = importWorkflows(importJson); refresh(); setImportJson(""); toast.success(`Imported ${res.imported} workflows`); }} className="btn-primary btn-sm">Import</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RULES ENGINE */}
        {tab === "rules" && <RulesEngineTab />}

        {/* DECISION TABLES */}
        {tab === "decisions" && <DecisionTablesTab />}

        {/* STATE MACHINES */}
        {tab === "state_machines" && <StateMachinesTab />}

        {/* QUEUE MONITOR */}
        {tab === "queues" && <QueueMonitorTab />}

        {/* APPROVALS */}
        {tab === "approvals" && <ApprovalsTab />}

        {/* AUDIT TRAIL */}
        {tab === "audit" && <AuditTrailTab />}

        {/* AI DEBUGGER */}
        {tab === "debugger" && <AiDebuggerTab workflows={workflows} />}
      </div>

      {editing && <WorkflowBpmEditor wf={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </>
  );
}

/* ================================================================== */
/*  RULES ENGINE TAB                                                   */
/* ================================================================== */
function RulesEngineTab() {
  const { toast } = useToast();
  const [ruleSets, setRuleSets] = useState<BpmRuleSet[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [evalInput, setEvalInput] = useState("{}");
  const [evalResult, setEvalResult] = useState("");
  const refresh = () => setRuleSets(getRuleSets());
  useEffect(() => { refresh(); }, []);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{ruleSets.length} rule sets</p>
        <button onClick={() => {
          createRuleSet({ name: `Rule Set ${ruleSets.length + 1}`, description: "New rule set", category: "general", rules: [], tags: [], enabled: true });
          refresh();
          toast.success("Rule set created");
        }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Rule Set</button>
      </div>
      <div className="mt-4 space-y-3">
        {ruleSets.map((rs) => (
          <div key={rs.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{rs.name}</p>
                  <span className={cn("badge", rs.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{rs.enabled ? "Active" : "Disabled"}</span>
                  <span className="badge bg-surface2 text-muted">v{rs.version}</span>
                </div>
                <p className="text-xs text-muted">{rs.description} · {rs.rules.length} rules</p>
              </div>
              <button onClick={() => setExpanded(expanded === rs.id ? null : rs.id)} className="btn-ghost btn-sm">
                {expanded === rs.id ? "Collapse" : "Expand"}
              </button>
            </div>

            {expanded === rs.id && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  {rs.rules.map((rule, i) => (
                    <div key={rule.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{rule.name || `Rule ${i + 1}`}</p>
                        <div className="flex items-center gap-2">
                          <span className="badge bg-surface2 text-muted">Priority {rule.priority}</span>
                          <span className="badge bg-surface2 text-muted">{rule.hitCount} hits</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rule.conditions.map((c, ci) => (
                          <span key={ci} className="badge bg-accent-soft text-accent text-[0.6rem]">
                            {c.field} {c.operator} {c.value}
                          </span>
                        ))}
                        <span className="badge bg-success/15 text-success text-[0.6rem]">→ {rule.action.result || rule.action.type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-line p-3">
                  <p className="mb-2 text-xs font-medium text-muted">Test Rule Set</p>
                  <div className="flex gap-2">
                    <input className="input-field flex-1" value={evalInput} onChange={(e) => setEvalInput(e.target.value)} placeholder='{"field": "value"}' />
                    <button onClick={() => {
                      try {
                        const input = JSON.parse(evalInput);
                        const result = evaluateRuleSet(rs.id, input);
                        setEvalResult(result.matched
                          ? `✓ Matched rule: ${result.rule?.name || "unnamed"} → ${result.result || "no result"}`
                          : "✗ No matching rule");
                      } catch { setEvalResult("Invalid JSON input"); }
                    }} className="btn-primary btn-sm"><Play className="h-4 w-4" /> Test</button>
                  </div>
                  {evalResult && <p className="mt-2 text-xs text-ink">{evalResult}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {ruleSets.length === 0 && <EmptyState icon={<GitBranch className="h-6 w-6" />} title="No rule sets" description="Create rule sets for business logic automation." />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DECISION TABLES TAB                                                */
/* ================================================================== */
function DecisionTablesTab() {
  const [tables, setTables] = useState<BpmDecisionTable[]>([]);
  useEffect(() => { setTables(getDecisionTables()); }, []);

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">{tables.length} decision tables</p>
      {tables.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<ListTodo className="h-6 w-6" />} title="No decision tables" description="Decision tables map input conditions to output actions." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {tables.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.description} · {t.rules.length} rules · {t.hitPolicy} hit policy</p>
                </div>
                <span className={cn("badge", t.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{t.enabled ? "Active" : "Disabled"}</span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line">
                      {t.inputFields.map((f) => <th key={f.name} className="px-3 py-2 text-left text-muted">{f.label}</th>)}
                      {t.outputFields.map((f) => <th key={f.name} className="px-3 py-2 text-left text-muted">{f.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rules.map((r) => (
                      <tr key={r.id} className="border-b border-line/50">
                        {t.inputFields.map((f) => <td key={f.name} className="px-3 py-2 text-ink">{r.inputValues[f.name] || "—"}</td>)}
                        {t.outputFields.map((f) => <td key={f.name} className="px-3 py-2 font-medium text-accent">{r.outputValues[f.name] || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  STATE MACHINES TAB                                                 */
/* ================================================================== */
function StateMachinesTab() {
  const { toast } = useToast();
  const [machines, setMachines] = useState<BpmStateMachine[]>([]);
  const [eventInput, setEventInput] = useState("");

  useEffect(() => { setMachines(getStateMachines()); }, []);

  const handleTransition = (smId: string) => {
    if (!eventInput) return;
    const result = transitionState(smId, eventInput);
    if (result.success) {
      setMachines(getStateMachines());
      toast.success("Transition completed", `${result.fromState} → ${result.toState}`);
    } else {
      toast.error("Transition failed", result.error);
    }
    setEventInput("");
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{machines.length} state machines</p>
        <button onClick={() => {
          createStateMachine({
            name: `State Machine ${machines.length + 1}`, description: "",
            states: [
              { id: "s1", name: "created", label: "Created", type: "initial", entryActions: [], exitActions: [], metadata: {} },
              { id: "s2", name: "processing", label: "Processing", type: "intermediate", entryActions: [], exitActions: [], metadata: {} },
              { id: "s3", name: "completed", label: "Completed", type: "final", entryActions: [], exitActions: [], metadata: {} },
            ],
            transitions: [
              { id: uid("t"), fromState: "s1", toState: "s2", event: "start", label: "Start", actions: [] },
              { id: uid("t"), fromState: "s2", toState: "s3", event: "complete", label: "Complete", actions: [] },
            ],
            initialState: "s1", finalStates: ["s3"], context: {},
          });
          setMachines(getStateMachines());
          toast.success("State machine created");
        }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New State Machine</button>
      </div>
      <div className="mt-4 space-y-3">
        {machines.map((sm) => (
          <div key={sm.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">{sm.name}</p>
                <p className="text-xs text-muted">{sm.description || `${sm.states.length} states · ${sm.transitions.length} transitions`}</p>
              </div>
              <span className="badge bg-accent-soft text-accent">Current: {sm.states.find((s) => s.id === sm.currentState)?.label || sm.currentState}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {sm.states.map((st) => (
                <span key={st.id} className={cn("rounded-xl border px-3 py-1.5 text-xs", st.id === sm.currentState ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line text-muted")}>
                  {st.label}
                  {st.type === "initial" && " ●"}
                  {st.type === "final" && " ■"}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input className="input-field flex-1" value={eventInput} onChange={(e) => setEventInput(e.target.value)} placeholder="Event name (e.g. start, complete)..." />
              <button onClick={() => handleTransition(sm.id)} className="btn-primary btn-sm"><Play className="h-4 w-4" /> Fire</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {sm.transitions.map((t) => (
                <span key={t.id} className="badge bg-surface2 text-[0.55rem] text-muted">
                  {sm.states.find((s) => s.id === t.fromState)?.label || t.fromState} → [{t.event}] → {sm.states.find((s) => s.id === t.toState)?.label || t.toState}
                </span>
              ))}
            </div>
          </div>
        ))}
        {machines.length === 0 && <EmptyState icon={<GitMerge className="h-6 w-6" />} title="No state machines" description="State machines model complex business processes as finite states." />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  QUEUE MONITOR TAB                                                  */
/* ================================================================== */
function QueueMonitorTab() {
  const [queues, setQueues] = useState<BpmQueue[]>([]);
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null);
  const [messages, setMessages] = useState<BpmQueueMessage[]>([]);

  const refresh = () => {
    setQueues(getQueues());
    if (expandedQueue) setMessages(getQueueMessages(expandedQueue));
  };
  useEffect(() => { refresh(); }, [expandedQueue]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{queues.length} queues</p>
        <button onClick={() => refresh()} className="btn-ghost btn-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>
      <div className="mt-4 space-y-3">
        {queues.map((q) => (
          <div key={q.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{q.name}</p>
                  <span className={cn("badge", q.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{q.status}</span>
                  <span className="badge bg-surface2 capitalize text-muted">{q.priority}</span>
                </div>
                <p className="text-xs text-muted">{q.description}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center"><p className="font-semibold text-ink">{q.pendingCount}</p><p className="text-muted">Pending</p></div>
                <div className="text-center"><p className="font-semibold text-ink">{q.runningCount}</p><p className="text-muted">Running</p></div>
                <div className="text-center"><p className="font-semibold text-ink">{q.completedCount}</p><p className="text-muted">Done</p></div>
                <div className="text-center"><p className="font-semibold text-danger">{q.deadLetterCount}</p><p className="text-muted">DLQ</p></div>
                <button onClick={() => setExpandedQueue(expandedQueue === q.id ? null : q.id)} className="btn-ghost btn-sm">
                  {expandedQueue === q.id ? "Hide" : "Messages"}
                </button>
              </div>
            </div>

            {expandedQueue === q.id && (
              <div className="mt-4 space-y-2">
                {messages.slice(0, 10).map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ink">Msg {msg.id.slice(-8)} · {msg.workflowId.slice(-8)}</p>
                      <p className="text-muted">{msg.status} · {msg.retryCount}/{msg.maxRetries} retries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("badge", msg.status === "completed" ? "bg-success/15 text-success" : msg.status === "dead_letter" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{msg.status}</span>
                      {msg.status === "dead_letter" && (
                        <button onClick={() => { retryDeadLetter(msg.id); refresh(); }} className="grid h-6 w-6 place-items-center rounded hover:bg-surface2"><RefreshCw className="h-3 w-3" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  APPROVALS TAB                                                      */
/* ================================================================== */
function ApprovalsTab() {
  const [requests, setRequests] = useState<BpmApprovalRequest[]>([]);
  const refresh = () => setRequests(getApprovalRequests());
  useEffect(() => { refresh(); }, []);

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">{requests.length} approval requests ({requests.filter((r) => r.status === "pending").length} pending)</p>
      {requests.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<UserCheck className="h-6 w-6" />} title="No approval requests" description="Approval requests appear when workflows require human review." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{req.workflowName}</p>
                    <span className={cn("badge", req.status === "pending" ? "bg-warning/15 text-warning" : req.status === "approved" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{req.status}</span>
                  </div>
                  <p className="text-xs text-muted">Assigned to {req.assignedToName} · {formatDateTime(req.requestedAt)}</p>
                  {req.comment && <p className="mt-1 text-xs text-ink">"{req.comment}"</p>}
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => { respondToApproval(req.id, true); refresh(); }} className="btn-primary btn-sm"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                    <button onClick={() => { respondToApproval(req.id, false, "Rejected by admin"); refresh(); }} className="btn-outline btn-sm"><XCircle className="h-4 w-4" /> Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  AUDIT TRAIL TAB                                                    */
/* ================================================================== */
function AuditTrailTab() {
  const [audits, setAudits] = useState(getAuditTrails());
  useEffect(() => { setAudits(getAuditTrails()); }, []);

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">{audits.length} audit entries</p>
      {audits.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<Eye className="h-6 w-6" />} title="No audit entries" description="Workflow actions are automatically recorded here." /></div>
      ) : (
        <div className="mt-4 space-y-1">
          {audits.slice(0, 50).map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-line p-3 text-xs">
              <span className="badge bg-surface2 shrink-0 text-muted">{a.action}</span>
              <div className="min-w-0 flex-1">
                <p className="text-ink">{a.detail}</p>
                <p className="text-muted">{a.actor} · {formatDateTime(a.ts)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  AI DEBUGGER TAB                                                    */
/* ================================================================== */
function AiDebuggerTab({ workflows }: { workflows: BpmWorkflow[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [debug, setDebug] = useState<BpmAiDebugResult | null>(null);

  const analyze = () => {
    const wf = workflows.find((w) => w.id === selectedId);
    if (!wf) return;
    setDebug(generateAiDebugResult(wf));
  };

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">AI-powered workflow analysis, optimization, and validation</p>
      <div className="mt-4 flex gap-2">
        <select className="input-field flex-1" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select a workflow to analyze...</option>
          {workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button onClick={analyze} disabled={!selectedId} className="btn-primary btn-sm"><Sparkles className="h-4 w-4" /> Analyze</button>
      </div>

      {debug && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-4 text-center">
              <p className="text-2xl font-semibold text-ink">{debug.optimizationScore}/100</p>
              <p className="text-xs text-muted">Optimization Score</p>
            </div>
            <div className="card p-4 text-center">
              <p className={cn("text-2xl font-semibold", debug.complexity === "simple" ? "text-success" : debug.complexity === "moderate" ? "text-warning" : "text-danger")}>
                {debug.complexity}
              </p>
              <p className="text-xs text-muted">Complexity</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-semibold text-ink">{debug.estimatedCost}</p>
              <p className="text-xs text-muted">Estimated Cost</p>
            </div>
          </div>

          {debug.issues.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-ink">Issues Found ({debug.issues.length})</h3>
              <div className="mt-3 space-y-2">
                {debug.issues.map((issue, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <div className="flex items-start gap-2">
                      <span className={cn("badge shrink-0", issue.severity === "error" ? "bg-danger/15 text-danger" : issue.severity === "warning" ? "bg-warning/15 text-warning" : "bg-info/15 text-info")}>
                        {issue.severity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">{issue.message}</p>
                        <p className="text-xs text-muted">Location: {issue.location}</p>
                        <p className="mt-1 text-xs text-accent">Suggestion: {issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debug.issues.length === 0 && (
            <div className="card p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="mt-2 font-semibold text-ink">No issues found!</p>
              <p className="text-xs text-muted">This workflow is well-optimized.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  WORKFLOW EDITOR MODAL                                              */
/* ================================================================== */
function WorkflowBpmEditor({ wf, onClose, onSave }: { wf: BpmWorkflow; onClose: () => void; onSave: (wf: BpmWorkflow) => void }) {
  useEscapeKey(onClose, true);
  useLockBody(true);
  const [draft, setDraft] = useState<BpmWorkflow>(wf.id ? wf : {
    ...wf,
    id: uid("wf"),
    name: wf.name || "New Workflow",
    description: "",
    categoryId: "cat_system",
    mode: "standard",
    status: "draft",
    version: 1,
    tags: [],
    variables: [],
    versions: [],
    trigger: { id: uid("trig"), type: "manual", label: "Manual trigger", enabled: true, metadata: {} },
    conditions: [],
    actions: [],
    approvals: { enabled: false, type: "sequential", steps: [], timeoutMinutes: 1440, emergencyOverride: false, requireAll: true, autoApproveIfNoResponse: false, notifyOnApproval: true, notifyOnRejection: true },
    errorHandling: { onError: "retry", maxRetries: 3, retryDelayMs: 1000, escalateAfterFailures: 5, escalateTo: "", fallbackAction: "continue", compensationEnabled: false },
    retryPolicy: { enabled: true, maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 60000, exponentialBackoff: true },
    timeoutMs: 300000,
    executionMode: "sequential",
    sandboxEnabled: false,
    debugMode: false,
    permissions: [],
    createdBy: "admin",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    totalRuns: 0,
    totalFailures: 0,
    avgDurationMs: 0,
    starred: false,
  });
  const categories = getCategories();

  const set = <K extends keyof BpmWorkflow>(k: K, v: BpmWorkflow[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const addAction = () => set("actions", [...draft.actions, { id: uid("a"), type: "email", label: "Send email", description: "", config: {}, timeoutMs: 30000, retryCount: 2, parallel: false, order: draft.actions.length, dependsOn: [], metadata: {} }]);
  const addCondition = () => set("conditions", [...draft.conditions, { id: uid("c"), groupId: "", operator: "equals", field: "status", value: "active", valueType: "string", label: "", order: draft.conditions.length }]);

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="card relative z-10 my-4 w-full max-w-3xl p-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{wf.id ? "Edit workflow" : "New workflow"}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 flex items-center gap-2 overflow-x-auto rounded-xl bg-surface2/40 p-3">
          <span className="badge bg-accent text-accent-ink whitespace-nowrap capitalize">{draft.trigger.type.replace(/_/g, " ")}</span>
          {draft.conditions.length > 0 && <><ChevronRight className="h-3 w-3 shrink-0 text-line" /><span className="badge bg-warning/15 text-warning whitespace-nowrap">Conditions</span></>}
          {draft.actions.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-line" />}
              <span className="badge bg-surface whitespace-nowrap capitalize">{a.label || a.type.replace(/_/g, " ")}</span>
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">Name</label><input className="input-field" value={draft.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div>
              <label className="label-field">Category</label>
              <select className="input-field" value={draft.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label-field">Description</label><input className="input-field" value={draft.description} onChange={(e) => set("description", e.target.value)} /></div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field">Mode</label>
              <select className="input-field" value={draft.mode} onChange={(e) => set("mode", e.target.value as BpmWorkflowMode)}>
                {(["standard", "state_machine", "approval", "rules_driven", "scheduled", "event_driven", "ai_orchestrated"] as const).map((m) => (
                  <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Trigger</label>
              <select className="input-field" value={draft.trigger.type} onChange={(e) => set("trigger", { ...draft.trigger, type: e.target.value as BpmTriggerType, label: TRIGGER_TYPES.find((t) => t.type === e.target.value)?.label || "" })}>
                {TRIGGER_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>
            <div>
              {draft.trigger.type === "event" && (
                <>
                  <label className="label-field">Event type</label>
                  <select className="input-field" value={draft.trigger.eventType || ""} onChange={(e) => set("trigger", { ...draft.trigger, eventType: e.target.value })}>
                    <option value="">Select event...</option>
                    {EVENT_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </>
              )}
              {draft.trigger.type === "cron" && (
                <>
                  <label className="label-field">Cron expression</label>
                  <input className="input-field" value={draft.trigger.cronExpression || ""} onChange={(e) => set("trigger", { ...draft.trigger, cronExpression: e.target.value })} placeholder="0 */4 * * *" />
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">Timeout (ms)</label><input type="number" className="input-field" value={draft.timeoutMs} onChange={(e) => set("timeoutMs", Number(e.target.value))} /></div>
            <div><label className="label-field">Execution mode</label><select className="input-field" value={draft.executionMode} onChange={(e) => set("executionMode", e.target.value as any)}>
              {(["sequential", "parallel", "conditional", "loop", "compensation"] as const).map((m) => <option key={m} value={m}>{m}</option>)}
            </select></div>
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
                  <input className="input-field !py-2 flex-1" value={c.field} onChange={(e) => set("conditions", draft.conditions.map((x) => x.id === c.id ? { ...x, field: e.target.value } : x))} placeholder="field" />
                  <select className="input-field !py-2 w-28" value={c.operator} onChange={(e) => set("conditions", draft.conditions.map((x) => x.id === c.id ? { ...x, operator: e.target.value as BpmCondition["operator"] } : x))}>
                    {CONDITION_OPERATORS.map((o) => <option key={o.operator} value={o.operator}>{o.symbol} {o.label}</option>)}
                  </select>
                  <input className="input-field !py-2 flex-1" value={c.value} onChange={(e) => set("conditions", draft.conditions.map((x) => x.id === c.id ? { ...x, value: e.target.value } : x))} placeholder="value" />
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
              {draft.actions.map((a, i) => (
                <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2">
                  <span className="badge bg-surface2 text-muted shrink-0">{i + 1}</span>
                  <select className="input-field !py-2 flex-1" value={a.type} onChange={(e) => set("actions", draft.actions.map((x) => x.id === a.id ? { ...x, type: e.target.value as BpmActionType, label: ACTION_TYPES.find((at) => at.type === e.target.value)?.label || e.target.value } : x))}>
                    {ACTION_TYPES.map((at) => <option key={at.type} value={at.type}>{at.label}</option>)}
                  </select>
                  <input className="input-field !py-2 w-32" value={a.label} onChange={(e) => set("actions", draft.actions.map((x) => x.id === a.id ? { ...x, label: e.target.value } : x))} placeholder="Label" />
                  <button onClick={() => set("actions", draft.actions.filter((x) => x.id !== a.id))} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {draft.actions.length === 0 && <p className="text-xs text-muted">No actions defined — add at least one action.</p>}
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
