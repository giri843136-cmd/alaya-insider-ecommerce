import { useEffect, useState, useCallback } from "react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import {
  Activity, Zap, Play, RefreshCw, XCircle, CheckCircle2, Clock,
  AlertTriangle, ArrowRight, Layers, Radio, Shield,
  BarChart3, RotateCcw, Mail, Truck, CreditCard,
  ShoppingBag, BrainCircuit, FileText, Sparkles,
} from "lucide-react";

const API = "/api/v1/orchestrator";

interface Stats {
  instances: { running: number; completed: number; failed: number };
  queues: { queue: string; pending: number; running: number; failed: number }[];
  unresolvedFailures: number;
  recentInstances: any[];
}

interface WorkflowInstance {
  id: string;
  workflow_name: string;
  workflow_type: string;
  status: string;
  current_state: string;
  order_id?: string;
  order_number?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
}

interface QueueItem {
  id: string;
  queue_name: string;
  action: string;
  status: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  scheduled_at?: string;
  error_message?: string;
}

interface WorkflowEvent {
  id: string;
  event_type: string;
  event_name: string;
  source: string;
  order_id?: string;
  instance_id?: string;
  payload?: string;
  created_at: string;
}

export default function AdminOrderOrchestrator() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "workflows" | "instances" | "queues" | "events" | "failures" | "compensations">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [running, setRunning] = useState<WorkflowInstance[]>([]);
  const [recent, setRecent] = useState<WorkflowInstance[]>([]);
  const [deadLetter, setDeadLetter] = useState<QueueItem[]>([]);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerModal, setTriggerModal] = useState(false);
  const [fulfillOrderId, setFulfillOrderId] = useState("");
  const [fulfillOrderNumber, setFulfillOrderNumber] = useState("");
  const [fulfilling, setFulfilling] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, runningRes, recentRes, dlRes, eventsRes, failuresRes] = await Promise.all([
        fetch(`${API}/stats`).then(r => r.json()),
        fetch(`${API}/instances?running=true`).then(r => r.json()),
        fetch(`${API}/instances/recent?limit=10`).then(r => r.json()),
        fetch(`${API}/queues/dead-letter`).then(r => r.json()),
        fetch(`${API}/events?limit=50`).then(r => r.json()),
        fetch(`${API}/failures`).then(r => r.json()),
      ]);
      setStats(statsRes);
      setRunning(runningRes?.data || runningRes || []);
      setRecent(recentRes?.data || recentRes || []);
      setDeadLetter(dlRes?.data || dlRes || []);
      setEvents(eventsRes?.data || eventsRes || []);
      setFailures(failuresRes?.data || failuresRes || []);
    } catch (err) {
      console.warn("[Orchestrator] Backend unavailable — showing empty state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const triggerFulfillment = async () => {
    if (!fulfillOrderId.trim()) { toast.error("Order ID required"); return; }
    setFulfilling(true);
    try {
      const res = await fetch(`${API}/fulfill/${fulfillOrderId.trim()}?orderNumber=${encodeURIComponent(fulfillOrderNumber.trim() || `ORD-${Date.now()}`)}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Fulfillment saga started", `${data.completedSteps?.length || 0} steps completed`);
        fetchAll();
      } else {
        toast.error("Fulfillment failed", data.error);
      }
    } catch (err) {
      toast.error("Failed to trigger fulfillment", String(err));
    } finally {
      setFulfilling(false);
      setTriggerModal(false);
      setFulfillOrderId("");
      setFulfillOrderNumber("");
    }
  };

  const retryQueueItem = async (id: string) => {
    try {
      await fetch(`${API}/queues/retry/${id}`, { method: "POST" });
      toast.success("Item requeued for retry");
      fetchAll();
    } catch { toast.error("Failed to retry item"); }
  };

  const recoverInstance = async (id: string) => {
    try {
      const res = await fetch(`${API}/instances/${id}/recover`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Workflow recovery initiated");
        fetchAll();
      } else {
        toast.error("Recovery failed", data.error);
      }
    } catch { toast.error("Failed to recover instance"); }
  };

  const seedWorkflows = async () => {
    try {
      const res = await fetch(`${API}/seed`, { method: "POST" });
      const data = await res.json();
      toast.success(`Seeded ${data.seeded} workflows`, `${data.total} total definitions`);
      fetchAll();
    } catch { toast.error("Failed to seed workflows"); }
  };

  const resolveFailure = async (id: string) => {
    try {
      await fetch(`${API}/failures/${id}/resolve`, { method: "POST" });
      toast.success("Failure marked as resolved");
      fetchAll();
    } catch { toast.error("Failed to resolve failure"); }
  };

  const TABS = [
    { id: "dashboard" as const, label: "Dashboard", icon: Activity },
    { id: "workflows" as const, label: "Running", icon: Play },
    { id: "instances" as const, label: "Recent", icon: Layers },
    { id: "queues" as const, label: "Queues", icon: Radio },
    { id: "events" as const, label: "Events", icon: Zap },
    { id: "failures" as const, label: "Failures", icon: AlertTriangle },
    { id: "compensations" as const, label: "Sagas", icon: Shield },
  ];

  const statCards = stats ? [
    { label: "Running", value: String(stats.instances.running), sub: "active workflows", icon: Play, color: "text-accent" },
    { label: "Completed", value: String(stats.instances.completed), sub: "successful executions", icon: CheckCircle2, color: "text-success" },
    { label: "Failed", value: String(stats.instances.failed), sub: "workflows failed", icon: XCircle, color: "text-danger" },
    { label: "Unresolved", value: String(stats.unresolvedFailures), sub: "failures needing action", icon: AlertTriangle, color: "text-warning" },
  ] : [];

  return (
    <>
      <Seo title="Order Orchestrator" path="/admin/orchestrator" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Order Orchestrator</h1>
            <p className="mt-1 text-sm text-muted">Central orchestration engine — event-driven commerce workflows</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip capitalize", tab === t.id && "chip-active")}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
            <button onClick={seedWorkflows} className="btn-ghost btn-sm"><Sparkles className="h-3.5 w-3.5" /> Seed</button>
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
              {/* Queue Stats */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Radio className="h-4 w-4 text-accent" /> Queue Status</h3>
                {stats?.queues?.length ? (
                  <div className="mt-4 space-y-3">
                    {stats.queues.map(q => (
                      <div key={q.queue} className="flex items-center gap-3 rounded-lg bg-surface2/50 p-3">
                        <span className="min-w-0 flex-1 text-sm font-medium capitalize text-ink">{q.queue}</span>
                        <span className="text-xs text-muted">{q.pending} pending</span>
                        <span className="text-xs text-muted">{q.running} running</span>
                        {q.failed > 0 && <span className="badge bg-danger/10 text-danger">{q.failed} failed</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted">No queue data available</p>
                )}
              </div>

              {/* Pipeline overview */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><ShoppingBag className="h-4 w-4 text-accent" /> Fulfillment Pipeline</h3>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {[
                    { icon: CreditCard, label: "Payment", color: "text-accent" },
                    { icon: Layers, label: "Inventory", color: "text-accent" },
                    { icon: Truck, label: "Supplier", color: "text-accent" },
                    { icon: Truck, label: "Warehouse", color: "text-accent" },
                    { icon: Truck, label: "Shipping", color: "text-accent" },
                    { icon: Mail, label: "Notify", color: "text-accent" },
                    { icon: BrainCircuit, label: "Affiliate", color: "text-accent" },
                    { icon: BarChart3, label: "Analytics", color: "text-accent" },
                    { icon: FileText, label: "Finance", color: "text-accent" },
                    { icon: Shield, label: "Audit", color: "text-accent" },
                  ].map((step, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="badge inline-flex items-center gap-1 bg-surface2 text-muted"><step.icon className="h-3 w-3" /> {step.label}</span>
                      {i < 9 && <ArrowRight className="h-3 w-3 text-line" />}
                    </span>
                  ))}
                </div>
                <button onClick={() => setTriggerModal(true)} className="btn-primary btn-sm mt-4 w-full"><Play className="h-4 w-4" /> Trigger fulfillment saga</button>
              </div>
            </div>

            {/* Recent instances */}
            <div className="mt-6 card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Clock className="h-4 w-4 text-accent" /> Recent Workflow Instances</h3>
              {recent.length === 0 ? (
                <p className="mt-4 text-xs text-muted">No workflow instances yet. Seed and trigger a fulfillment to see them here.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {recent.slice(0, 8).map(inst => (
                    <div key={inst.id} className="flex items-center gap-3 rounded-lg bg-surface2/30 p-3">
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", {
                        "bg-success/15 text-success": inst.status === "completed",
                        "bg-danger/15 text-danger": inst.status === "failed" || inst.status === "completed_with_errors",
                        "bg-accent-soft text-accent": inst.status === "running" || inst.status === "retrying",
                        "bg-warning/15 text-warning": inst.status === "pending",
                      })}>
                        <Activity className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{inst.workflow_name}</p>
                        <p className="text-xs text-muted">{inst.status} · {inst.workflow_type}{inst.order_number ? ` · ${inst.order_number}` : ""}</p>
                      </div>
                      {inst.status === "failed" && (
                        <button onClick={() => recoverInstance(inst.id)} className="btn-ghost btn-sm"><RotateCcw className="h-3.5 w-3.5" /> Recover</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* RUNNING WORKFLOWS */}
        {tab === "workflows" && (
          <div className="mt-8">
            {running.length === 0 ? (
              <EmptyState icon={<Play className="h-6 w-6" />} title="No running workflows" description="Running workflows will appear here." />
            ) : (
              <div className="space-y-3">
                {running.map(inst => (
                  <div key={inst.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent animate-pulse"><Activity className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{inst.workflow_name}</p>
                      <p className="text-xs text-muted">{inst.workflow_type} · {inst.current_state} · {inst.order_number || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECENT INSTANCES */}
        {tab === "instances" && (
          <div className="mt-8">
            {recent.length === 0 ? (
              <EmptyState icon={<Layers className="h-6 w-6" />} title="No instances" description="Workflow instances will appear here after fulfillment." />
            ) : (
              <div className="space-y-3">
                {recent.map(inst => (
                  <div key={inst.id} className="card p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", {
                        "bg-success/15 text-success": inst.status === "completed",
                        "bg-danger/15 text-danger": inst.status === "failed" || inst.status === "completed_with_errors",
                        "bg-accent-soft text-accent": inst.status === "running" || inst.status === "retrying",
                      })}>
                        {inst.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : inst.status === "failed" ? <XCircle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{inst.workflow_name}</p>
                        <p className="text-xs text-muted">
                          State: {inst.current_state} · Type: {inst.workflow_type}
                          {inst.duration_ms ? ` · Duration: ${(inst.duration_ms / 1000).toFixed(1)}s` : ""}
                          {inst.order_number ? ` · Order: ${inst.order_number}` : ""}
                        </p>
                        {inst.error_message && <p className="mt-1 text-xs text-danger">{inst.error_message}</p>}
                      </div>
                      {inst.status === "failed" && (
                        <button onClick={() => recoverInstance(inst.id)} className="btn-primary btn-sm"><RotateCcw className="h-4 w-4" /> Recover</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUEUES */}
        {tab === "queues" && (
          <div className="mt-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Queue Stats */}
              <div className="card p-5">
                <h3 className="font-semibold text-ink">Queue Statistics</h3>
                {stats?.queues?.length ? (
                  <div className="mt-4 space-y-3">
                    {stats.queues.map(q => (
                      <div key={q.queue} className="rounded-xl border border-line p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize text-ink">{q.queue}</span>
                          <span className={cn("badge", q.failed > 0 ? "bg-danger/10 text-danger" : "bg-surface2 text-muted")}>
                            {q.failed} failed
                          </span>
                        </div>
                        <div className="mt-2 flex gap-4 text-sm text-muted">
                          <span>{q.pending} pending</span>
                          <span>{q.running} running</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted">No queue data</p>
                )}
              </div>

              {/* Dead Letter Queue */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-warning" /> Dead Letter Queue</h3>
                {deadLetter.length === 0 ? (
                  <p className="mt-4 text-xs text-muted">No dead letter items. All queues healthy.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {deadLetter.slice(0, 10).map(item => (
                      <div key={item.id} className="rounded-lg bg-surface2/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-ink">{item.action}</span>
                          <span className="badge bg-danger/10 text-danger">{item.retry_count}/{item.max_retries}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{item.queue_name} · {item.error_message?.slice(0, 100) || "No error"}</p>
                        <button onClick={() => retryQueueItem(item.id)} className="btn-ghost btn-sm mt-2"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Enqueue form */}
            <div className="mt-6 card p-5">
              <h3 className="font-semibold text-ink">Manual Enqueue</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {["process_payment", "sync_inventory", "notify_supplier", "create_shipment", "send_notification", "record_analytics"].map(action => (
                  <button key={action} onClick={async () => {
                    await fetch(`${API}/queues/enqueue`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ queueName: "manual", action, payload: {} }),
                    });
                    toast.success(`Enqueued: ${action}`);
                    fetchAll();
                  }} className="btn-outline btn-sm capitalize">{action.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EVENTS */}
        {tab === "events" && (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <input placeholder="Filter events..." className="input-field max-w-xs" />
              <span className="text-sm text-muted">{events.length} events</span>
            </div>
            {events.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Zap className="h-6 w-6" />} title="No events" description="Events will appear when workflows execute." /></div>
            ) : (
              <div className="mt-4 space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="card p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                        <Zap className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{ev.event_name || ev.event_type}</p>
                        <p className="text-xs text-muted">{ev.source} · {ev.order_id ? `Order: ${ev.order_id.slice(0, 8)}…` : ""} {ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}</p>
                      </div>
                    </div>
                    {ev.payload && (
                      <pre className="mt-2 overflow-x-auto rounded bg-surface2/50 p-2 text-[0.65rem] text-muted">{JSON.stringify(JSON.parse(ev.payload), null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAILURES */}
        {tab === "failures" && (
          <div className="mt-8">
            {failures.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="No failures" description="All systems nominal." />
            ) : (
              <div className="space-y-3">
                {failures.map(f => (
                  <div key={f.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger"><XCircle className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{f.step_name || "Unknown step"}</p>
                        <p className="text-xs text-muted">{f.error_type} · {f.retry_count}/{f.max_retries} retries{f.recovered ? " · Recovered" : ""}</p>
                        {f.error_message && <p className="mt-1 text-xs text-danger">{f.error_message}</p>}
                      </div>
                      {!f.recovered && (
                        <button onClick={() => resolveFailure(f.id)} className="btn-outline btn-sm"><CheckCircle2 className="h-3.5 w-3.5" /> Resolve</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPENSATIONS / SAGAS */}
        {tab === "compensations" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Saga compensation actions track distributed transaction rollbacks.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Validate Order", icon: Shield, desc: "Cancels order on failure", critical: true },
                { name: "Reserve Inventory", icon: Layers, desc: "Releases reserved stock", critical: true },
                { name: "Process Supplier", icon: Truck, desc: "Cancels supplier assignment", critical: true },
                { name: "Create Shipment", icon: Truck, desc: "Cancels shipment creation", critical: true },
                { name: "Notify Customer", icon: Mail, desc: "No compensation needed", critical: false },
                { name: "Sync Finance", icon: FileText, desc: "No compensation needed", critical: false },
              ].map(saga => (
                <div key={saga.name} className="card p-5">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-full", saga.critical ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                    <saga.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-semibold text-ink">{saga.name}</p>
                  <p className="mt-1 text-xs text-muted">{saga.desc}</p>
                  <span className={cn("badge mt-3", saga.critical ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                    {saga.critical ? "Compensable" : "No-op"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trigger Fulfillment Modal */}
      {triggerModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Trigger fulfillment">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setTriggerModal(false)} aria-hidden="true" />
          <div className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-semibold text-ink">Trigger Fulfillment Saga</h2>
            <p className="mt-1 text-sm text-muted">Execute the complete order fulfillment pipeline for a given order.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label-field">Order ID *</label>
                <input className="input-field" value={fulfillOrderId} onChange={e => setFulfillOrderId(e.target.value)} placeholder="e.g. ord_abc123" />
              </div>
              <div>
                <label className="label-field">Order Number</label>
                <input className="input-field" value={fulfillOrderNumber} onChange={e => setFulfillOrderNumber(e.target.value)} placeholder="e.g. ORD-001" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setTriggerModal(false)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={triggerFulfillment} disabled={fulfilling} className="btn-primary btn-md">
                {fulfilling ? <>Fulfilling…</> : <><Play className="h-4 w-4" /> Start Fulfillment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
