/**
 * ALAYA INSIDER — Marketplace Registry Admin (PART 3.5)
 * ------------------------------------------------------------------
 * Manage affiliate marketplace networks, sync status, failover rules,
 * and marketplace configuration.
 */
import { useState } from "react";
import {
  Plus, Pencil, Trash2, X, Globe, RefreshCw, Check,
  AlertTriangle, Power, PowerOff,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState, Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import {
  getMarketplaces, addMarketplace, updateMarketplace, deleteMarketplace,
  syncMarketplace, getSyncLogs, type MarketplaceRegistryConfig, type MarketplaceNetwork,
} from "../../lib/affiliateCommerce";

const NETWORK_OPTIONS: { value: MarketplaceNetwork; label: string }[] = [
  { value: "amazon_associates", label: "Amazon Associates" },
  { value: "impact", label: "Impact" },
  { value: "cj_affiliate", label: "CJ Affiliate" },
  { value: "awin", label: "Awin" },
  { value: "rakuten", label: "Rakuten" },
  { value: "shareasale", label: "ShareASale" },
  { value: "partnerstack", label: "PartnerStack" },
  { value: "clickbank", label: "ClickBank" },
  { value: "custom", label: "Custom" },
  { value: "direct", label: "Direct" },
];

const EMPTY_MARKETPLACE = {
  network: "custom" as MarketplaceNetwork,
  name: "", description: "", status: "disconnected" as const,
  countries: [], currencies: ["USD"], verticals: [],
  minCommission: 1, maxCommission: 10, cookieDays: 30,
  paymentThreshold: 50, paymentFrequency: "monthly" as const,
  avgConversionRate: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0,
  syncIntervalMinutes: 120, failoverPriority: 10, active: true,
};

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-success/15 text-success",
  disconnected: "bg-danger/15 text-danger",
  syncing: "bg-info/15 text-info",
  error: "bg-danger/15 text-danger",
  paused: "bg-warning/15 text-warning",
};

export default function AdminMarketplaceRegistry() {
  const [marketplaces, setMarketplaces] = useState(getMarketplaces());
  const [editing, setEditing] = useState<Partial<MarketplaceRegistryConfig> | null>(null);
  const [toDelete, setToDelete] = useState<MarketplaceRegistryConfig | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"marketplaces" | "sync_logs">("marketplaces");

  const refresh = () => setMarketplaces(getMarketplaces());

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncMarketplace(id);
    setTimeout(() => { setSyncingId(null); refresh(); }, 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id) {
      updateMarketplace(editing.id, editing);
    } else {
      addMarketplace(editing as any);
    }
    setEditing(null);
    refresh();
  };

  const syncLogs = getSyncLogs(10);

  return (
    <>
      <Seo title="Marketplace Registry" path="/admin/marketplace-registry" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Marketplace Registry</h1>
            <p className="mt-1 text-sm text-muted">Manage affiliate networks, marketplace connections, and sync schedules.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_MARKETPLACE })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add marketplace</button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["marketplaces", "sync_logs"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
              {t === "marketplaces" ? <Globe className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              {t.replace("_", " ")}
            </button>
          ))}
        </div>

        {tab === "marketplaces" && (
          <>
            {marketplaces.length === 0 ? (
              <div className="mt-8">
                <EmptyState icon={<Globe className="h-6 w-6" />} title="No marketplaces configured" description="Add your first affiliate network to start tracking." action={<button onClick={() => setEditing({ ...EMPTY_MARKETPLACE })} className="btn-primary btn-md">Add marketplace</button>} />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {marketplaces.map((mp) => (
                  <div key={mp.id} className="card p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink truncate">{mp.name}</h3>
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.55rem] font-semibold capitalize", STATUS_COLORS[mp.status])}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", mp.status === "connected" ? "bg-success" : mp.status === "error" ? "bg-danger" : mp.status === "syncing" ? "bg-info" : mp.status === "paused" ? "bg-warning" : "bg-line")} />
                            {mp.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted line-clamp-1">{mp.description}</p>
                      </div>
                      <button
                        onClick={() => updateMarketplace(mp.id, { active: !mp.active }) && refresh()}
                        className={cn("grid h-8 w-8 place-items-center rounded-full", mp.active ? "text-success hover:bg-success/10" : "text-muted hover:bg-surface2")}
                        aria-label={mp.active ? "Deactivate" : "Activate"}
                      >
                        {mp.active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {mp.countries.slice(0, 4).map((c) => <Badge key={c} variant="info">{c}</Badge>)}
                      {mp.countries.length > 4 && <Badge variant="neutral">+{mp.countries.length - 4}</Badge>}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                      <div><span className="font-medium text-ink">{mp.minCommission}%</span> min commission</div>
                      <div><span className="font-medium text-ink">{mp.cookieDays}d</span> cookie</div>
                      <div><span className="font-medium text-ink">{mp.avgConversionRate}%</span> avg conv.</div>
                      <div><span className="font-medium text-ink">{mp.paymentFrequency}</span> payout</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                      <button onClick={() => handleSync(mp.id)} disabled={syncingId === mp.id || mp.status === "syncing"} className="btn-ghost btn-sm">
                        <RefreshCw className={cn("h-3.5 w-3.5", syncingId === mp.id && "animate-spin")} />
                        {syncingId === mp.id ? "Syncing..." : "Sync"}
                      </button>
                      <button onClick={() => setEditing({ ...mp })} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => setToDelete(mp)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "sync_logs" && (
          <div className="mt-6 space-y-2">
            {syncLogs.length === 0 ? (
              <EmptyState icon={<RefreshCw className="h-6 w-6" />} title="No sync logs yet" description="Run a sync to see logs here." />
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="card flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? <Check className="h-5 w-5 text-success" /> : log.status === "failed" ? <AlertTriangle className="h-5 w-5 text-danger" /> : <RefreshCw className="h-5 w-5 text-info animate-spin" />}
                    <div>
                      <p className="text-sm font-medium text-ink">{log.marketplaceName} — {log.action.replace("_", " ")}</p>
                      <p className="text-xs text-muted">{log.itemsProcessed} items processed · {log.itemsFailed} failed</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted">{new Date(log.startedAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={handleSave} className="card relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit marketplace" : "Add marketplace"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field">Network</label>
                  <select className="input-field" value={editing.network} onChange={(e) => setEditing({ ...editing, network: e.target.value as MarketplaceNetwork })}>
                    {NETWORK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div><label className="label-field">Status</label>
                  <select className="input-field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
                    {["connected", "disconnected", "paused"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label-field">Marketplace name</label><input className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="NET-A-PORTER" /></div>
              <div><label className="label-field">Description</label><input className="input-field" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label-field">Min commission %</label><input type="number" className="input-field" value={editing.minCommission ?? 1} onChange={(e) => setEditing({ ...editing, minCommission: Number(e.target.value) })} /></div>
                <div><label className="label-field">Max commission %</label><input type="number" className="input-field" value={editing.maxCommission ?? 10} onChange={(e) => setEditing({ ...editing, maxCommission: Number(e.target.value) })} /></div>
                <div><label className="label-field">Cookie days</label><input type="number" className="input-field" value={editing.cookieDays ?? 30} onChange={(e) => setEditing({ ...editing, cookieDays: Number(e.target.value) })} /></div>
              </div>
              <div><label className="label-field">Payment frequency</label>
                <select className="input-field" value={editing.paymentFrequency} onChange={(e) => setEditing({ ...editing, paymentFrequency: e.target.value as any })}>
                  {["monthly", "biweekly", "weekly", "net_30", "net_60", "net_90"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 text-sm text-ink">
                <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add marketplace"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Remove marketplace"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteMarketplace(toDelete.id); setToDelete(null); refresh(); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Remove</button></>}>
        Remove <strong>{toDelete?.name}</strong>? This cannot be undone.
      </Dialog>
    </>
  );
}
