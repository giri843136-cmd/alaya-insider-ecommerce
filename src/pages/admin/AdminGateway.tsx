/**
 * ALAYA INSIDER — Enterprise API Gateway, Integration & Microservices Admin UI
 *
 * Tabs: Dashboard | API Explorer | Endpoints | Webhooks | Integrations |
 *        Microservices | Service Mesh | Queue | Docs | SDK
 */
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Shield, Server, Globe, Code2, Webhook as WebhookIcon,
  Puzzle, Cpu, Network, MessageSquare, BookOpen, Terminal,
  XCircle, AlertTriangle, Zap,
  Plus, Trash2, Power, Copy,
  RefreshCw, Download, FileText,
  ArrowUpDown,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime, formatCompact } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { useGateway } from "../../context/GatewayContext";
import {
  generateApiDoc, getApiDocSpec,
  type ApiMethod, type ApiScope, type ApiStatus,
  type WebhookEvent,
} from "../../lib/gateway";

/* ================================================================== */
/*  TYPE HELPERS                                                       */
/* ================================================================== */

type Tab = "dashboard" | "explorer" | "endpoints" | "webhooks" | "integrations" | "microservices" | "mesh" | "queue" | "docs" | "sdk";

const METHOD_TONE: Record<ApiMethod, string> = {
  GET: "bg-info/15 text-info", POST: "bg-success/15 text-success",
  PUT: "bg-warning/15 text-warning", PATCH: "bg-accent-soft text-accent",
  DELETE: "bg-danger/15 text-danger", HEAD: "bg-surface2 text-muted", OPTIONS: "bg-surface2 text-muted",
};

const SCOPE_TONE: Record<ApiScope, string> = {
  public: "bg-success/15 text-success", internal: "bg-accent-soft text-accent",
  partner: "bg-warning/15 text-warning", admin: "bg-danger/15 text-danger",
  supplier: "bg-violet-500/15 text-violet-500", affiliate: "bg-orange-500/15 text-orange-500",
  ai: "bg-purple-500/15 text-purple-500", system: "bg-surface2 text-muted",
};

const STATUS_TONE: Record<ApiStatus, string> = {
  active: "bg-success/15 text-success", deprecated: "bg-warning/15 text-warning",
  sunset: "bg-danger/15 text-danger", beta: "bg-accent-soft text-accent", alpha: "bg-purple-500/15 text-purple-500",
};

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function AdminGateway() {
  const gateway = useGateway();
  const { refresh } = gateway;
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => { refresh(); }, [refresh]);

  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "explorer", label: "API Explorer", icon: Code2 },
    { id: "endpoints", label: "Endpoints", icon: Server },
    { id: "webhooks", label: "Webhooks", icon: WebhookIcon },
    { id: "integrations", label: "Integrations", icon: Puzzle },
    { id: "microservices", label: "Microservices", icon: Cpu },
    { id: "mesh", label: "Service Mesh", icon: Network },
    { id: "queue", label: "Message Queue", icon: MessageSquare },
    { id: "docs", label: "API Docs", icon: BookOpen },
    { id: "sdk", label: "SDK & CLI", icon: Terminal },
  ];

  return (
    <>
      <Seo title="API Gateway" path="/admin/gateway" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">API Gateway</h1>
            <p className="mt-1 text-sm text-muted">Enterprise API platform, integrations, microservices fabric & service mesh.</p>
          </div>
          <button onClick={refresh} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip flex items-center gap-1.5 capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "explorer" && <ApiExplorerTab />}
        {tab === "endpoints" && <EndpointsTab />}
        {tab === "webhooks" && <WebhooksTab />}
        {tab === "integrations" && <IntegrationsTab />}
        {tab === "microservices" && <MicroservicesTab />}
        {tab === "mesh" && <ServiceMeshTab />}
        {tab === "queue" && <QueueTab />}
        {tab === "docs" && <DocsTab />}
        {tab === "sdk" && <SdkTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const gateway = useGateway();
  const { analytics, fabricSummary, webhookStats } = gateway;

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Server} label="Total Requests" value={formatCompact(analytics.totalRequests)} sub={`${analytics.successfulRequests} success`} tone="accent" />
        <StatCard icon={Activity} label="Avg Latency" value={`${analytics.avgLatencyMs}ms`} sub={`P95: ${analytics.p95LatencyMs}ms`} tone="success" />
        <StatCard icon={Shield} label="Active Endpoints" value={String(analytics.activeEndpoints)} sub={`${analytics.deprecatedEndpoints} deprecated`} tone="accent" />
        <StatCard icon={AlertTriangle} label="Rate Limit Hits" value={String(analytics.rateLimitExceeded)} sub={`${analytics.authFailures} auth failures`} tone={analytics.rateLimitExceeded > 0 ? "warning" : "success"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink">Microservices Fabric</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Services</span><span className="font-medium text-ink">{fabricSummary.totalServices} ({fabricSummary.healthyServices} healthy)</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Instances</span><span className="font-medium text-ink">{fabricSummary.totalInstances} ({fabricSummary.healthyInstances} healthy)</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Active Connections</span><span className="font-medium text-ink">{formatCompact(fabricSummary.totalConnections)}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Avg CPU / Memory</span><span className="font-medium text-ink">{fabricSummary.avgCpu}% / {fabricSummary.avgMemory}%</span></div>
          </div>
          {fabricSummary.degradedServices > 0 && (
            <div className="mt-3 rounded-lg bg-warning/10 p-3 text-sm text-warning">
              {fabricSummary.degradedServices} service(s) degraded · {fabricSummary.unhealthyServices} unhealthy
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink">Webhook Platform</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Total Deliveries</span><span className="font-medium text-ink">{formatCompact(webhookStats.totalDeliveries)}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Success Rate</span><span className="font-medium text-ink">{webhookStats.successRate}%</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Avg Latency</span><span className="font-medium text-ink">{webhookStats.avgLatencyMs}ms</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Failed / Retried</span><span className="font-medium text-ink">{webhookStats.failedDeliveries} / {webhookStats.retriedDeliveries}</span></div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${webhookStats.successRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Shield; label: string; value: string; sub: string; tone: "accent" | "success" | "danger" | "warning";
}) {
  return (
    <div className="card p-5">
      <span className={cn("grid h-10 w-10 place-items-center rounded-full", tone === "success" ? "bg-success/15 text-success" : tone === "danger" ? "bg-danger/15 text-danger" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}><Icon className="h-5 w-5" /></span>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

/* ================================================================== */
/*  API EXPLORER                                                       */
/* ================================================================== */

function ApiExplorerTab() {
  const gateway = useGateway();
  const { endpoints, internalApis } = gateway;
  const [method, setMethod] = useState<ApiMethod>("GET");
  const [path, setPath] = useState("/api/v1/products");
  const [response, setResponse] = useState<string>("");
  const allEndpoints = [...endpoints, ...internalApis];

  const handleSend = () => {
    const ep = allEndpoints.find((e) => e.path === path);
    if (ep) {
      setResponse(JSON.stringify({
        status: 200,
        endpoint: ep.path,
        method,
        description: ep.description,
        version: ep.version,
        cacheTtl: ep.cacheTtl,
        rateLimit: ep.rateLimit,
        auth: ep.auth,
        detail: `Fires ${method} ${path} through the API Gateway to the backend service`,
      }, null, 2));
    } else {
      setResponse(JSON.stringify({ status: 404, error: `No endpoint matches ${method} ${path}` }, null, 2));
    }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Code2 className="h-4 w-4 text-accent" /> API Console</h3>
        <div className="mt-4 flex gap-2">
          <select className="input-field w-24" value={method} onChange={(e) => setMethod(e.target.value as ApiMethod)}>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className="input-field flex-1 font-mono" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/api/v1/products" list="endpoint-list" />
          <datalist id="endpoint-list">{allEndpoints.map((ep) => <option key={ep.id} value={ep.path} />)}</datalist>
          <button onClick={handleSend} className="btn-primary btn-sm"><Zap className="h-3.5 w-3.5" /> Send</button>
        </div>
        {response && (
          <div className="mt-4">
            <pre className="overflow-auto rounded-lg bg-ink/5 p-4 text-xs font-mono text-ink max-h-80">{response}</pre>
            <button onClick={() => navigator.clipboard.writeText(response)} className="btn-ghost btn-sm mt-2"><Copy className="h-3.5 w-3.5" /> Copy</button>
          </div>
        )}
      </div>

      <div className="card p-5 overflow-auto max-h-[500px]">
        <h3 className="font-semibold text-ink mb-4">Quick Reference</h3>
        <div className="space-y-2">
          {allEndpoints.slice(0, 20).map((ep) => (
            <button key={ep.id} onClick={() => { setMethod(ep.method); setPath(ep.path); }} className="flex w-full items-center gap-3 rounded-lg border border-line p-2.5 text-left text-sm hover:bg-surface2/50">
              <span className={cn("badge font-mono text-[0.55rem]", METHOD_TONE[ep.method])}>{ep.method}</span>
              <code className="flex-1 truncate text-xs text-ink">{ep.path}</code>
              <span className={cn("badge text-[0.5rem]", SCOPE_TONE[ep.scope])}>{ep.scope}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ENDPOINTS                                                          */
/* ================================================================== */

function EndpointsTab() {
  const gateway = useGateway();
  const { endpoints, internalApis, versions, registerNewEndpoint, deprecate, sunset } = gateway;
  const [scope, setScope] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ path: "", method: "GET" as ApiMethod, scope: "internal" as ApiScope, summary: "", description: "", version: "v1", tags: [] as string[], auth: [] as string[], status: "active" as ApiStatus, rateLimit: 60, burst: 10, cacheTtl: 0 });

  const filtered = useMemo(() => {
    if (scope === "all") return endpoints;
    if (scope === "internal") return internalApis;
    return endpoints.filter((ep) => ep.scope === scope);
  }, [endpoints, internalApis, scope]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[["all", "All"], ["public", "Public"], ["internal", "Internal"], ["admin", "Admin"], ["partner", "Partner"], ["supplier", "Supplier"], ["affiliate", "Affiliate"]].map(([id, label]) => (
            <button key={id} onClick={() => setScope(id)} className={cn("chip", scope === id && "chip-active")}>{label}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Register Endpoint</button>
      </div>

      {showForm && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">Register New Endpoint</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="text-xs font-medium text-muted">Path</label><input className="input-field mt-1 w-full font-mono" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/api/v1/..." /></div>
            <div><label className="text-xs font-medium text-muted">Method</label><select className="input-field mt-1 w-full" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as ApiMethod })}>{["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="text-xs font-medium text-muted">Scope</label><select className="input-field mt-1 w-full" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as ApiScope })}>{["public", "internal", "admin", "partner", "supplier", "affiliate", "ai"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="text-xs font-medium text-muted">Summary</label><input className="input-field mt-1 w-full" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted">Rate Limit (req/min)</label><input className="input-field mt-1 w-full" type="number" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: Number(e.target.value) })} /></div>
            <div><label className="text-xs font-medium text-muted">Burst</label><input className="input-field mt-1 w-full" type="number" value={form.burst} onChange={(e) => setForm({ ...form, burst: Number(e.target.value) })} /></div>
            <div><label className="text-xs font-medium text-muted">Cache TTL (s)</label><input className="input-field mt-1 w-full" type="number" value={form.cacheTtl} onChange={(e) => setForm({ ...form, cacheTtl: Number(e.target.value) })} /></div>
            <div><label className="text-xs font-medium text-muted">Version</label><select className="input-field mt-1 w-full" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}>{versions.map((v) => <option key={v.id} value={v.version}>{v.version}</option>)}</select></div>
          </div>
          <button onClick={() => { registerNewEndpoint({ ...form, protocol: "rest", tags: form.tags, description: form.summary, rateLimit: { limit: form.rateLimit, period: "minute", burst: form.burst }, payloadValidation: false, requiresMfa: false, auth: form.auth as any, exampleResponse: undefined }); setShowForm(false); }} className="btn-primary btn-sm mt-4">Register</button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {filtered.map((ep) => (
          <div key={ep.id} className="card flex flex-wrap items-center gap-4 p-4">
            <span className={cn("badge font-mono", METHOD_TONE[ep.method])}>{ep.method}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-ink">{ep.path}</code>
                <span className={cn("badge text-[0.55rem]", SCOPE_TONE[ep.scope])}>{ep.scope}</span>
                <span className={cn("badge text-[0.55rem]", STATUS_TONE[ep.status])}>{ep.status}</span>
              </div>
              <p className="text-xs text-muted">{ep.summary} · v{ep.version} · {ep.auth.join(", ") || "No auth"} · {ep.rateLimit.limit}/{ep.rateLimit.period}</p>
            </div>
            {'service' in ep && <span className="chip text-[0.55rem]">{(ep as any).service}</span>}
            <div className="flex gap-1">
              {ep.status !== "deprecated" && ep.status !== "sunset" && (
                <button onClick={() => deprecate(ep.id)} className="btn-ghost btn-sm text-warning" title="Deprecate"><AlertTriangle className="h-3.5 w-3.5" /></button>
              )}
              {ep.status === "deprecated" && (
                <button onClick={() => sunset(ep.id)} className="btn-ghost btn-sm text-danger" title="Sunset"><XCircle className="h-3.5 w-3.5" /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  WEBHOOKS                                                           */
/* ================================================================== */

function WebhooksTab() {
  const gateway = useGateway();
  const { webhooks, deliveries, webhookStats, createWh, deleteWh, deliverEvent, replayDelivery } = gateway;
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ url: "", events: [] as WebhookEvent[], name: "" });

  const allEvents: WebhookEvent[] = ["order.created", "order.paid", "order.shipped", "order.cancelled", "order.refunded", "product.created", "product.updated", "product.stock_changed", "customer.registered", "review.submitted", "payment.completed", "affiliate.conversion", "inventory.low_stock", "inventory.out_of_stock", "security.incident"];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{webhooks.length} webhooks · {webhooks.filter((w) => w.status === "active").length} active · {webhookStats.successRate}% success rate</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create Webhook</button>
      </div>

      {showCreate && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">New Webhook Endpoint</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-xs font-medium text-muted">Name</label><input className="input-field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted">URL</label><input className="input-field mt-1 w-full font-mono" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted">Events</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {allEvents.map((ev) => (
                  <button key={ev} onClick={() => setForm({ ...form, events: form.events.includes(ev) ? form.events.filter((e) => e !== ev) : [...form.events, ev] })} className={cn("chip text-[0.55rem]", form.events.includes(ev) && "chip-active")}>{ev}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => { createWh({ url: form.url, events: form.events, secret: `whsec_${Math.random().toString(36).slice(2, 10)}`, status: "active", headers: {}, retryConfig: { enabled: true, maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 60000, exponentialBackoff: true }, rateLimit: 100, timeout: 10000 }); setShowCreate(false); setForm({ url: "", events: [], name: "" }); }} className="btn-primary btn-sm mt-4">Create Webhook</button>
        </div>
      )}

      {/* Webhook list */}
      <div className="mt-4 space-y-2">
        {webhooks.map((wh) => (
          <div key={wh.id} className="card flex flex-wrap items-center gap-4 p-4">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", wh.status === "active" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><WebhookIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-ink truncate">{wh.url}</code>
                <span className={cn("badge text-[0.55rem]", wh.status === "active" ? "bg-success/15 text-success" : wh.status === "paused" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{wh.status}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">{wh.events.map((ev) => <span key={ev} className="badge bg-surface2 text-muted text-[0.5rem]">{ev}</span>)}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => deliverEvent(wh.id, wh.events[0] || "order.created", JSON.stringify({ test: true, ts: Date.now() }))} className="btn-ghost btn-sm"><Zap className="h-3.5 w-3.5" /> Test</button>
              <button onClick={() => deleteWh(wh.id)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery log */}
      <div className="mt-6">
        <h3 className="font-semibold text-ink mb-3">Delivery Log</h3>
        <div className="card overflow-hidden max-h-80 overflow-y-auto">
          {deliveries.length === 0 ? <div className="p-6"><EmptyState icon={<WebhookIcon className="h-6 w-6" />} title="No deliveries" /></div> : (
            <div className="divide-y divide-line">
              {deliveries.slice(0, 20).map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", d.success ? "bg-success" : "bg-danger")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ink">{d.event} → {d.url}</p>
                    <p className="text-xs text-muted">Attempt {d.attempt} · {d.durationMs}ms · {d.statusCode}{d.error ? ` · ${d.error}` : ""} · {formatDateTime(d.ts)}</p>
                  </div>
                  {!d.success && <button onClick={() => replayDelivery(d.id)} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  INTEGRATIONS                                                       */
/* ================================================================== */

function IntegrationsTab() {
  const gateway = useGateway();
  const { connectors, connectorInstances, installConn, uninstallConn } = gateway;
  const [connecting, setConnecting] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});

  const installedConnectors = connectors.filter((c) => c.installed);
  const availableConnectors = connectors.filter((c) => !c.installed);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{installedConnectors.length} connected · {availableConnectors.length} available</p>

      {/* Installed */}
      <div className="space-y-3">
        <h3 className="font-semibold text-ink">Connected</h3>
        {installedConnectors.map((conn) => (
          <div key={conn.id} className="card flex flex-wrap items-center gap-4 p-4">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", conn.status === "active" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}><Puzzle className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><p className="font-medium text-ink">{conn.name}</p><span className={cn("badge", conn.official && "bg-accent text-accent-ink")}>{conn.official ? "Official" : "Community"}</span></div>
              <p className="text-xs text-muted">{conn.description}</p>
              <p className="text-xs text-muted">{conn.category} · {conn.authType} · v{conn.version}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => uninstallConn(connectorInstances.find((i) => i.providerId === conn.id)?.id || "")} className="btn-ghost btn-sm text-danger"><Power className="h-3.5 w-3.5" /> Disconnect</button>
            </div>
          </div>
        ))}
      </div>

      {/* Available */}
      <div className="mt-8 space-y-3">
        <h3 className="font-semibold text-ink">Available Connectors</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableConnectors.map((conn) => (
            <div key={conn.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-muted"><Puzzle className="h-4 w-4" /></span>
                {conn.official && <span className="badge bg-accent text-accent-ink text-[0.5rem]">Official</span>}
              </div>
              <p className="mt-3 font-medium text-ink text-sm">{conn.name}</p>
              <p className="mt-1 text-xs text-muted line-clamp-2">{conn.description}</p>
              <p className="mt-1 text-[0.6rem] text-muted">{conn.pricing} · {conn.authType}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {conn.capabilities.slice(0, 3).map((cap) => <span key={cap} className="badge bg-surface2 text-muted text-[0.5rem]">{cap}</span>)}
              </div>
              {connecting === conn.id ? (
                <div className="mt-3 space-y-2">
                  {conn.configFields.filter((f) => f.required).map((f) => (
                    <input key={f.key} className="input-field w-full text-xs" placeholder={f.label} value={config[f.key] || ""} onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })} />
                  ))}
                  <button onClick={() => { installConn(conn.id, conn.name, config); setConnecting(null); setConfig({}); }} className="btn-primary btn-sm w-full">Connect</button>
                </div>
              ) : (
                <button onClick={() => setConnecting(conn.id)} className="btn-ghost btn-sm mt-3 w-full"><Plus className="h-3.5 w-3.5" /> Connect</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MICROSERVICES                                                      */
/* ================================================================== */

function MicroservicesTab() {
  const gateway = useGateway();
  const { services, fabricSummary, runHealthChecks, healthChecks } = gateway;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{fabricSummary.totalServices} services · {fabricSummary.totalInstances} instances · {fabricSummary.totalConnections} connections</p>
        <button onClick={runHealthChecks} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Run Health Checks</button>
      </div>

      {/* Health check results */}
      {healthChecks.length > 0 && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {healthChecks.map((hc) => (
            <div key={hc.id} className={cn("rounded-lg border p-3", hc.status === "healthy" ? "border-success/30 bg-success/5" : hc.status === "degraded" ? "border-warning/30 bg-warning/5" : "border-danger/30 bg-danger/5")}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", hc.status === "healthy" ? "bg-success" : hc.status === "degraded" ? "bg-warning" : "bg-danger")} />
                <p className="text-sm font-medium text-ink">{hc.serviceName}</p>
              </div>
              <p className="mt-1 text-xs text-muted">{hc.latencyMs}ms · {hc.lastChecked ? formatDateTime(hc.lastChecked) : ""}</p>
              {hc.error && <p className="mt-0.5 text-xs text-danger">{hc.error}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Service cards */}
      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", svc.status === "healthy" ? "bg-success/15 text-success" : svc.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}><Cpu className="h-5 w-5" /></span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{svc.name}</p>
                    <span className={cn("badge", svc.status === "healthy" ? "bg-success/15 text-success" : svc.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{svc.status}</span>
                    <span className="badge bg-surface2 text-muted">v{svc.version}</span>
                  </div>
                  <p className="text-xs text-muted">{svc.description} · Port {svc.port} · {svc.protocol}</p>
                </div>
              </div>
              <div className="text-right text-xs text-muted">
                <p>{svc.instances.length} instance(s)</p>
                <p>{svc.instances.filter((i) => i.status === "healthy").length} healthy</p>
              </div>
            </div>
            {/* Instances */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {svc.instances.map((inst) => (
                <div key={inst.id} className={cn("rounded-lg border p-2.5 text-xs", inst.status === "healthy" ? "border-success/20 bg-success/5" : inst.status === "degraded" ? "border-warning/20 bg-warning/5" : "border-danger/20 bg-danger/5")}>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", inst.status === "healthy" ? "bg-success" : inst.status === "degraded" ? "bg-warning" : "bg-danger")} />
                    <code className="font-mono text-[0.6rem] text-ink">{inst.host}:{inst.port}</code>
                  </div>
                  <p className="mt-0.5 text-muted">CPU: {inst.cpuUsage}% · MEM: {inst.memoryUsage}% · {inst.connections} conn</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SERVICE MESH                                                       */
/* ================================================================== */

function ServiceMeshTab() {
  const gateway = useGateway();
  const { serviceGraph, dnsRecords } = gateway;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Topology */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Network className="h-4 w-4 text-accent" /> Service Topology</h3>
        <div className="mt-4 space-y-2">
          {serviceGraph.nodes.map((node) => (
            <div key={node.id}>
              <div className="flex items-center gap-2 rounded-lg border border-line p-3">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", node.status === "healthy" ? "bg-success" : node.status === "degraded" ? "bg-warning" : "bg-danger")} />
                <span className="text-sm font-medium text-ink">{node.name}</span>
                <span className={cn("badge", node.status === "healthy" ? "bg-success/15 text-success" : node.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{node.status}</span>
              </div>
              {/* Dependency edges */}
              {serviceGraph.edges.filter((e) => e.source === node.id).map((edge, i) => (
                <div key={i} className="ml-6 mt-1 flex items-center gap-2 text-xs text-muted">
                  <ArrowUpDown className="h-3 w-3" />
                  <span>→ {serviceGraph.nodes.find((n) => n.id === edge.target)?.name || edge.target}</span>
                  <span className={cn("badge", edge.type === "sync" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{edge.type}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* DNS Records */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Internal DNS</h3>
        <div className="mt-4 space-y-2">
          {dnsRecords.map((dns) => (
            <div key={dns.id} className="flex items-center justify-between rounded-lg border border-line p-2.5">
              <div>
                <p className="font-mono text-xs font-medium text-ink">{dns.name}</p>
                <p className="font-mono text-[0.6rem] text-muted">{dns.type} → {dns.value} · TTL {dns.ttl}s</p>
              </div>
              <span className={cn("badge text-[0.5rem]", dns.type === "SRV" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{dns.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  QUEUE                                                              */
/* ================================================================== */

function QueueTab() {
  const gateway = useGateway();
  const { queueMessages } = gateway;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{queueMessages.length} messages in queue</p>
      <div className="card overflow-hidden">
        {queueMessages.length === 0 ? (
          <div className="p-8"><EmptyState icon={<MessageSquare className="h-6 w-6" />} title="No messages" description="Messages will appear here as services communicate." /></div>
        ) : (
          <div className="divide-y divide-line">
            {queueMessages.map((msg) => (
              <div key={msg.id} className="flex items-center gap-4 px-4 py-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", msg.status === "completed" ? "bg-success" : msg.status === "failed" ? "bg-danger" : msg.status === "processing" ? "bg-accent" : "bg-surface2")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink"><span className="font-medium">{msg.queue}</span> — {msg.payload.slice(0, 60)}</p>
                  <p className="text-xs text-muted">{msg.status} · Attempt {msg.retryCount}/{msg.maxRetries} · {formatDateTime(msg.createdAt)}</p>
                </div>
                <span className={cn("badge", msg.priority === "high" ? "bg-danger/15 text-danger" : msg.priority === "normal" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{msg.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  API DOCS                                                           */
/* ================================================================== */

function DocsTab() {
  const spec = getApiDocSpec();
  const [doc, setDoc] = useState("");

  const handleGenerate = () => {
    setDoc(generateApiDoc(spec));
  };

  const handleDownload = () => {
    const blob = new Blob([doc], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "api-documentation.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spec viewer */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink">API Specification</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-line p-3">
              <p className="font-medium text-ink">{spec.title} v{spec.version}</p>
              <p className="text-xs text-muted">{spec.description}</p>
            </div>
            <div className="space-y-2">
              {spec.sections.map((section) => (
                <div key={section.id} className="rounded-lg border border-line p-3">
                  <p className="font-medium text-ink text-sm">{section.title}</p>
                  <p className="text-xs text-muted">{section.description}</p>
                  <p className="mt-1 text-[0.6rem] text-muted">{section.endpoints.length} endpoint(s)</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleGenerate} className="btn-primary btn-sm"><FileText className="h-3.5 w-3.5" /> Generate Docs</button>
            {doc && <button onClick={handleDownload} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> Download</button>}
          </div>
        </div>

        {/* Generated doc */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink">Generated Documentation</h3>
          {doc ? (
            <pre className="mt-4 max-h-[500px] overflow-auto rounded-lg bg-ink/5 p-4 text-xs font-mono text-ink whitespace-pre-wrap">{doc}</pre>
          ) : (
            <div className="mt-8"><EmptyState icon={<BookOpen className="h-6 w-6" />} title="Not generated yet" description="Click 'Generate Docs' to build the API documentation." /></div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SDK TAB                                                            */
/* ================================================================== */

function SdkTab() {
  const gateway = useGateway();
  const { sdkPackages } = gateway;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-6">Software Development Kits for integrating with the ALAYA INSIDER API.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sdkPackages.map((sdk) => (
          <div key={sdk.id} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><Terminal className="h-5 w-5" /></span>
            <p className="mt-3 font-semibold text-ink text-sm">{sdk.name}</p>
            <p className="mt-1 text-xs text-muted">{sdk.description}</p>
            <div className="mt-3 rounded-lg bg-surface2 p-2.5">
              <code className="text-[0.6rem] font-mono text-ink">{sdk.install}</code>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted">v{sdk.version}</span>
              <span className={cn("badge text-[0.5rem]", sdk.status === "stable" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{sdk.status}</span>
            </div>
            <button onClick={() => navigator.clipboard.writeText(sdk.install)} className="btn-ghost btn-sm mt-3 w-full"><Copy className="h-3.5 w-3.5" /> Copy install command</button>
          </div>
        ))}
      </div>

      {/* CLI info */}
      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Terminal className="h-4 w-4 text-accent" /> ALAYA CLI</h3>
        <p className="mt-2 text-sm text-muted">The official command-line tool for platform management.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { cmd: "alaya api:list", desc: "List all registered API endpoints" },
            { cmd: "alaya api:register", desc: "Register a new API endpoint" },
            { cmd: "alaya webhook:list", desc: "List configured webhooks" },
            { cmd: "alaya webhook:deliver", desc: "Manually trigger a webhook delivery" },
            { cmd: "alaya services:health", desc: "Check all microservice health" },
            { cmd: "alaya services:topology", desc: "Show service dependency graph" },
            { cmd: "alaya integration:list", desc: "List installed connectors" },
            { cmd: "alaya integration:connect", desc: "Install a new connector" },
            { cmd: "alaya docs:generate", desc: "Generate API documentation" },
            { cmd: "alaya queue:list", desc: "List message queue contents" },
          ].map((cmd) => (
            <div key={cmd.cmd} className="flex items-center gap-3 rounded-lg border border-line p-3">
              <code className="flex-1 font-mono text-xs text-ink">{cmd.cmd}</code>
              <span className="text-xs text-muted">{cmd.desc}</span>
              <button onClick={() => navigator.clipboard.writeText(cmd.cmd)} className="btn-ghost btn-sm p-1"><Copy className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


