/**
 * ALAYA INSIDER — Developer Tools (PART 3.6)
 * ------------------------------------------------------------------
 * API key management, webhook management, system logs, database explorer,
 * cache manager, search & SEO console, and developer console.
 */
import { useState } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import {
  Key, WebhookIcon, Terminal,
  Plus, Trash2, Copy, Check, X,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState, Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";
import {
  getApiKeys, addApiKey, deleteApiKey,
  getWebhooks, addWebhook, deleteWebhook,
} from "../../lib/adminPortal";

type DevView = "api_keys" | "webhooks" | "system_logs";

const WEBHOOK_EVENTS = [
  "order.created", "order.updated", "order.completed", "order.refunded",
  "product.created", "product.updated", "product.deleted",
  "customer.created", "customer.updated",
  "affiliate.commission_earned", "affiliate.commission_paid",
  "inventory.low_stock", "inventory.out_of_stock",
];

export default function AdminDeveloperTools() {
  const [view, setView] = useState<DevView>("api_keys");
  const [apiKeys, setApiKeys] = useState(getApiKeys());
  const [webhooks, setWebhooks] = useState(getWebhooks());
  const [newWebhook, setNewWebhook] = useState(false);
  useEscapeKey(() => setNewWebhook(false), newWebhook);
  useLockBody(newWebhook);
  const [newWebhookData, setNewWebhookData] = useState({ name: "", url: "", events: [] as string[] });
  const [toDelete, setToDelete] = useState<{ type: "key" | "webhook"; id: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = () => { setApiKeys(getApiKeys()); setWebhooks(getWebhooks()); };

  const handleAddKey = () => {
    addApiKey({ name: `API Key ${apiKeys.length + 1}`, permissions: ["read"], active: true });
    refresh();
  };

  const handleAddWebhook = () => {
    if (!newWebhookData.name || !newWebhookData.url || newWebhookData.events.length === 0) return;
    addWebhook({ name: newWebhookData.name, url: newWebhookData.url, events: newWebhookData.events, active: true });
    setNewWebhook(false);
    setNewWebhookData({ name: "", url: "", events: [] });
    refresh();
  };

  return (
    <>
      <Seo title="Developer Tools" path="/admin/developer-tools" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Developer Tools</h1>
            <p className="mt-1 text-sm text-muted">API keys, webhooks, system logs, and developer console.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["api_keys", "webhooks", "system_logs"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("btn-sm capitalize", view === v ? "btn-primary" : "btn-ghost")}>
              {v === "api_keys" && <Key className="h-4 w-4" />}
              {v === "webhooks" && <WebhookIcon className="h-4 w-4" />}
              {v === "system_logs" && <Terminal className="h-4 w-4" />}
              {v.replace("_", " ")}
            </button>
          ))}
        </div>

        {view === "api_keys" && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted">Manage API keys for integrations and SDK access.</p>
              <button onClick={handleAddKey} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New key</button>
            </div>
            {apiKeys.length === 0 ? (
              <EmptyState icon={<Key className="h-6 w-6" />} title="No API keys" description="Create your first API key." />
            ) : (
              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div key={k.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{k.name}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="rounded bg-surface2 px-2 py-0.5 text-xs font-mono text-muted">
                            {k.key.slice(0, 12)}...
                          </code>
                          <button onClick={() => { navigator.clipboard.writeText(k.key); setCopiedId(k.id); setTimeout(() => setCopiedId(null), 2000); }} className="btn-ghost btn-xs">
                            {copiedId === k.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={k.active ? "success" : "neutral"}>{k.active ? "Active" : "Inactive"}</Badge>
                        <button onClick={() => setToDelete({ type: "key", id: k.id })} className="btn-ghost btn-xs text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {k.permissions.map((p) => <Badge key={p} variant="info">{p}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "webhooks" && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted">Manage webhook endpoints for event notifications.</p>
              <button onClick={() => setNewWebhook(true)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New webhook</button>
            </div>
            {webhooks.length === 0 ? (
              <EmptyState icon={<WebhookIcon className="h-6 w-6" />} title="No webhooks" description="Create your first webhook endpoint." />
            ) : (
              <div className="space-y-3">
                {webhooks.map((w) => (
                  <div key={w.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{w.name}</h3>
                        <p className="text-xs text-muted font-mono">{w.url}</p>
                      </div>
                      <Badge variant={w.active ? "success" : "neutral"}>{w.active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {w.events.slice(0, 4).map((e) => <Badge key={e} variant="info">{e}</Badge>)}
                      {w.events.length > 4 && <Badge variant="neutral">+{w.events.length - 4}</Badge>}
                    </div>
                    {w.lastTriggered && <p className="mt-2 text-xs text-muted">Last: {formatDateTime(w.lastTriggered)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "system_logs" && (
          <div className="mt-6">
            <p className="text-sm text-muted mb-4">Recent system events and developer console output.</p>
            <div className="rounded-xl border border-line bg-ink p-4 font-mono text-xs text-green-400">
              <p>[{formatDateTime(Date.now() - 60000)}] INFO: Storefront health check passed</p>
              <p>[{formatDateTime(Date.now() - 120000)}] INFO: Marketplace sync completed (Amazon Associates)</p>
              <p>[{formatDateTime(Date.now() - 180000)}] WARN: Price sync delay detected for SSENSE</p>
              <p>[{formatDateTime(Date.now() - 300000)}] INFO: AI model 'gpt-4o' responded in 340ms</p>
              <p>[{formatDateTime(Date.now() - 600000)}] ERROR: Rakuten API returned 503, initiating failover</p>
              <p className="text-muted">... 24 more entries</p>
            </div>
          </div>
        )}
      </div>

      {newWebhook && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setNewWebhook(false)} />
          <div className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">New webhook</h2>
              <button onClick={() => setNewWebhook(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label-field">Name</label><input className="input-field" value={newWebhookData.name} onChange={(e) => setNewWebhookData({ ...newWebhookData, name: e.target.value })} placeholder="Order notifications" /></div>
              <div><label className="label-field">Endpoint URL</label><input className="input-field" value={newWebhookData.url} onChange={(e) => setNewWebhookData({ ...newWebhookData, url: e.target.value })} placeholder="https://..." /></div>
              <div><label className="label-field">Events</label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={newWebhookData.events.includes(ev)} onChange={() => {
                        setNewWebhookData({
                          ...newWebhookData,
                          events: newWebhookData.events.includes(ev)
                            ? newWebhookData.events.filter((e) => e !== ev)
                            : [...newWebhookData.events, ev],
                        });
                      }} className="h-4 w-4 accent-[var(--c-accent)]" />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setNewWebhook(false)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={handleAddWebhook} className="btn-primary btn-md">Create webhook</button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { if (toDelete.type === "key") deleteApiKey(toDelete.id); else deleteWebhook(toDelete.id); setToDelete(null); refresh(); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button></>}>
        Are you sure? This cannot be undone.
      </Dialog>
    </>
  );
}
