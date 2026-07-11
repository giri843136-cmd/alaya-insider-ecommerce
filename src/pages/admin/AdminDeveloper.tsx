import { useEffect, useState } from "react";
import { Code2, Puzzle, Webhook as WebhookIcon, Flag, Activity, Terminal, Server, Zap, CheckCircle2, Clock, Plus, Trash2, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  versionInfo, CATEGORY_LABELS, apiEndpoints, cronJobs, sdks,
  loadExtensions, saveExtensions, loadFlags, saveFlags, loadWebhooks, saveWebhooks,
  getBusEvents, publishEvent, getSystemEvents,
  type Extension, type FeatureFlag, type Webhook,
} from "../../lib/developer";

type Tab = "dashboard" | "extensions" | "api" | "webhooks" | "flags" | "events" | "docs";

export default function AdminDeveloper() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [busEvents, setBusEvents] = useState(getBusEvents());
  const [sysEvents] = useState(getSystemEvents());
  const [whEditor, setWhEditor] = useState<Webhook | null>(null);

  useEffect(() => {
    setExtensions(loadExtensions());
    setFlags(loadFlags());
    setWebhooks(loadWebhooks());
  }, []);

  const persistExt = (n: Extension[]) => { setExtensions(n); saveExtensions(n); };
  const persistFlags = (n: FeatureFlag[]) => { setFlags(n); saveFlags(n); };
  const persistWh = (n: Webhook[]) => { setWebhooks(n); saveWebhooks(n); };

  const activeExt = extensions.filter((e) => e.status === "active").length;
  const disabledExt = extensions.filter((e) => e.status === "disabled").length;
  const activeWh = webhooks.filter((w) => w.active).length;
  const totalWhDeliveries = webhooks.reduce((s, w) => s + w.deliveries, 0);

  const toggleExt = (id: string) => {
    persistExt(extensions.map((e) => e.id === id ? { ...e, status: e.status === "active" ? "disabled" : "active" } : e));
    toast.success("Extension updated");
  };

  const toggleFlag = (key: string) => {
    persistFlags(flags.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));
    toast.success("Feature flag toggled");
  };

  const fireTestEvent = () => {
    const evt = publishEvent("order.created", '{"orderId":"AL-999999","total":198.50}', activeWh);
    setBusEvents([evt, ...getBusEvents()]);
    toast.success("Test event published", evt.name);
  };

  const STATS = [
    { label: "Active extensions", value: String(activeExt), sub: `${disabledExt} disabled`, icon: Puzzle },
    { label: "API endpoints", value: String(apiEndpoints.length), sub: "REST v1 + GraphQL ready", icon: Code2 },
    { label: "Webhooks", value: String(activeWh), sub: `${totalWhDeliveries.toLocaleString()} deliveries`, icon: WebhookIcon },
    { label: "Core version", value: versionInfo.core, sub: versionInfo.framework, icon: Server },
  ];

  return (
    <>
      <Seo title="Developer Platform" path="/admin/developer" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Developer Platform</h1>
            <p className="mt-1 text-sm text-muted">Extensions, APIs, webhooks, events & SDKs.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["dashboard", "Dashboard"], ["extensions", "Extensions"], ["api", "API Reference"], ["webhooks", "Webhooks"], ["flags", "Feature Flags"], ["events", "Event Bus"], ["docs", "Docs"]] as const).map(([id, label]) => (
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

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Cron jobs */}
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-ink"><Clock className="h-4 w-4 text-accent" /> Scheduled tasks</h3></div>
                <ul className="divide-y divide-line">
                  {cronJobs.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", c.status === "running" ? "bg-success animate-pulse" : c.status === "error" ? "bg-danger" : "bg-accent")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{c.name}</p>
                        <p className="text-xs text-muted">{c.schedule}</p>
                      </div>
                      {c.nextRun && <span className="text-xs text-muted">Next: {formatDateTime(c.nextRun)}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* System events */}
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> System events</h3></div>
                <ul className="divide-y divide-line">
                  {sysEvents.slice(0, 8).map((e) => (
                    <li key={e.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                      <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", e.level === "error" ? "bg-danger" : e.level === "warning" ? "bg-warning" : "bg-success")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">{e.message}</p>
                        <p className="text-xs text-muted">{e.source} · {formatDateTime(e.ts)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SDKs + versions */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Terminal className="h-4 w-4 text-accent" /> SDKs</h3>
                <div className="mt-3 space-y-2">
                  {sdks.map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-lg border border-line p-3">
                      <div><p className="text-sm font-medium text-ink">{s.name} SDK</p><p className="font-mono text-xs text-muted">{s.install}</p></div>
                      <span className={cn("badge", s.status === "stable" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{s.version} {s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Server className="h-4 w-4 text-accent" /> Version management</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Core</dt><dd className="font-mono text-ink">{versionInfo.core}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Framework</dt><dd className="font-mono text-ink">{versionInfo.framework}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Database</dt><dd className="font-mono text-ink">{versionInfo.database}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Schema</dt><dd className="font-mono text-ink">{versionInfo.schema}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Build</dt><dd className="font-mono text-ink">{versionInfo.build}</dd></div>
                </dl>
              </div>
            </div>
          </>
        )}

        {/* EXTENSIONS */}
        {tab === "extensions" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{extensions.length} extensions installed · {activeExt} active</p>
            <div className="mt-4 space-y-3">
              {extensions.map((e) => (
                <div key={e.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", e.status === "active" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Puzzle className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{e.name}</p>
                      {e.official && <span className="badge bg-accent text-accent-ink">Official</span>}
                      <span className="badge bg-surface2 text-muted">{CATEGORY_LABELS[e.category]}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">{e.description}</p>
                    <p className="mt-0.5 text-xs text-muted">v{e.version} · {e.author}</p>
                  </div>
                  <button onClick={() => toggleExt(e.id)} className={cn("chip", e.status === "active" && "chip-active")} aria-pressed={e.status === "active"}>
                    {e.status === "active" ? <><CheckCircle2 className="h-3 w-3" /> Active</> : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API REFERENCE */}
        {tab === "api" && (
          <div className="mt-8">
            <div className="flex items-center gap-2 rounded-[var(--radius-xl2)] bg-surface2/50 p-4 text-sm text-muted">
              <Code2 className="h-4 w-4 text-accent" /> REST API <code className="font-mono text-ink">v1</code> · GraphQL ready · JSON · Rate limited · API key auth · Webhook-ready
            </div>
            <div className="card mt-4 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr><th className="px-4 py-3">Method</th><th className="px-4 py-3">Endpoint</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Auth</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {apiEndpoints.map((e, i) => (
                    <tr key={i} className="hover:bg-surface2/40">
                      <td className="px-4 py-3"><span className={cn("badge font-mono", e.method === "GET" ? "bg-info/15 text-info" : e.method === "POST" ? "bg-success/15 text-success" : e.method === "DELETE" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{e.method}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-ink">{e.path}</td>
                      <td className="px-4 py-3 text-muted">{e.description}</td>
                      <td className="px-4 py-3">{e.auth ? <Lock className="h-3.5 w-3.5 text-accent" /> : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WEBHOOKS */}
        {tab === "webhooks" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{webhooks.length} webhooks · {activeWh} active · {totalWhDeliveries.toLocaleString()} total deliveries</p>
              <button onClick={() => setWhEditor({ id: `wh_${Date.now().toString(36)}`, url: "", events: [], secret: "whsec_" + Math.random().toString(36).slice(2, 10), active: true, deliveries: 0, failures: 0 })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add webhook</button>
            </div>
            <div className="mt-4 space-y-3">
              {webhooks.map((w) => (
                <div key={w.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", w.active ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><WebhookIcon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-ink">{w.url || "(not configured)"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">{w.events.map((ev) => <span key={ev} className="badge bg-surface2 text-muted">{ev}</span>)}</div>
                    <p className="mt-1 text-xs text-muted">{w.deliveries} deliveries · {w.failures} failed {w.lastDelivery ? `· last ${formatDateTime(w.lastDelivery)}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setWhEditor(w)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Code2 className="h-4 w-4" /></button>
                    <button onClick={() => { persistWh(webhooks.filter((x) => x.id !== w.id)); toast.success("Webhook removed"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && <EmptyState icon={<WebhookIcon className="h-6 w-6" />} title="No webhooks" />}
            </div>
          </div>
        )}

        {/* FEATURE FLAGS */}
        {tab === "flags" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Toggle platform capabilities. Experimental features are future-ready architecture.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {flags.map((f) => (
                <label key={f.key} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{f.label}</p>
                      <span className={cn("badge capitalize", f.category === "experimental" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{f.category}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{f.description}</p>
                    <p className="mt-0.5 font-mono text-[0.65rem] text-muted">{f.key}</p>
                  </div>
                  <button onClick={() => toggleFlag(f.key)} aria-pressed={f.enabled} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", f.enabled ? "bg-accent" : "bg-line")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", f.enabled ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* EVENT BUS */}
        {tab === "events" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{busEvents.length} events in the bus</p>
              <button onClick={fireTestEvent} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> Publish test event</button>
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-4"><h3 className="font-semibold text-ink">Event bus</h3></div>
                {busEvents.length === 0 ? <div className="p-8"><EmptyState icon={<Activity className="h-6 w-6" />} title="No events published" /></div> : (
                  <ul className="divide-y divide-line">
                    {busEvents.slice(0, 15).map((e) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <div className="min-w-0 flex-1"><p className="truncate font-mono text-xs text-ink">{e.name}</p><p className="text-xs text-muted">{formatDateTime(e.ts)} · {e.subscribers} subscriber(s)</p></div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-4"><h3 className="font-semibold text-ink">System log</h3></div>
                <ul className="divide-y divide-line">
                  {sysEvents.slice(0, 15).map((e) => (
                    <li key={e.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                      <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", e.level === "error" ? "bg-danger" : e.level === "warning" ? "bg-warning" : "bg-success")} />
                      <div className="min-w-0 flex-1"><p className="text-ink">{e.message}</p><p className="text-xs text-muted">{e.source} · {formatDateTime(e.ts)}</p></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* DOCS */}
        {tab === "docs" && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "API Reference", desc: "REST & GraphQL endpoints, auth, pagination, rate limits", icon: Code2 },
              { title: "Extension Guide", desc: "Build, package, install & maintain extensions", icon: Puzzle },
              { title: "Webhook Guide", desc: "Subscribe, verify signatures, retry & recover", icon: WebhookIcon },
              { title: "Authentication", desc: "API keys, OAuth, JWT, session management", icon: Server },
              { title: "Configuration", desc: "Env vars, secrets, feature flags, per-module settings", icon: Flag },
              { title: "Deployment", desc: "Build, deploy, scale, CDN, caching strategies", icon: Terminal },
            ].map((d) => (
              <div key={d.title} className="card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><d.icon className="h-5 w-5" /></span>
                <p className="mt-3 font-semibold text-ink">{d.title}</p>
                <p className="mt-1 text-xs text-muted">{d.desc}</p>
                <button onClick={() => toast.info("Documentation", `${d.title} guide available in the developer portal.`)} className="btn-ghost btn-sm mt-3">View guide</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook editor */}
      {whEditor && (
        <WebhookEditor wh={whEditor} onClose={() => setWhEditor(null)} onSave={(w) => {
          const exists = webhooks.find((x) => x.id === w.id);
          persistWh(exists ? webhooks.map((x) => x.id === w.id ? w : x) : [...webhooks, w]);
          setWhEditor(null);
          toast.success(exists ? "Webhook updated" : "Webhook created");
        }} />
      )}
    </>
  );
}

/* --------------------------- Icons helper ----------------------------- */
function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* --------------------------- Webhook Editor ---------------------------- */
function WebhookEditor({ wh, onClose, onSave }: { wh: Webhook; onClose: () => void; onSave: (w: Webhook) => void }) {
  const [draft, setDraft] = useState<Webhook>(wh);
  const allEvents = ["order.created", "order.paid", "order.shipped", "order.cancelled", "product.created", "product.updated", "product.stock_changed", "product.low_stock", "customer.registered", "review.submitted", "payment.completed", "refund.issued"];

  const toggleEvent = (ev: string) => {
    setDraft((d) => ({ ...d, events: d.events.includes(ev) ? d.events.filter((x) => x !== ev) : [...d.events, ev] }));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Webhook editor">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{wh.url ? "Edit webhook" : "New webhook"}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div><label className="label-field">URL</label><input className="input-field font-mono" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://api.example.com/webhook" /></div>
          <div><label className="label-field">Secret (for signature verification)</label><input className="input-field font-mono" value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} /></div>
          <div>
            <label className="label-field">Events to subscribe</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allEvents.map((ev) => (
                <button key={ev} type="button" onClick={() => toggleEvent(ev)} className={cn("chip font-mono text-xs", draft.events.includes(ev) && "chip-active")}>{ev}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost btn-md">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn-primary btn-md">Save webhook</button>
        </div>
      </div>
    </div>
  );
}
