import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Truck, Globe, Activity, CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";

interface Carrier {
  id: string;
  name: string;
  code: string;
  description: string;
  website: string;
  api_docs_url: string;
  tracking_url_template: string;
  supported_services: string[];
  supported_countries: string[];
  priority: number;
  test_mode: boolean;
  active: boolean;
  health_status?: { healthy: boolean; status: string; latency_ms: number; checked_at: string };
}

const API = "/api/v1/shipping";

export default function AdminCarrierManager() {
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Carrier> | null>(null);
  const [toDelete, setToDelete] = useState<Carrier | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, any>>({});

  const load = async () => {
    try {
      const data = await fetch(`${API}/carriers`).then(r => r.json());
      setCarriers(Array.isArray(data) ? data : data?.data || []);
    } catch { toast.error("Failed to load carriers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const checkHealth = async (id: string) => {
    try {
      const result = await fetch(`${API}/carriers/${id}/health-check`, { method: "POST" }).then(r => r.json());
      setHealthMap(p => ({ ...p, [id]: result }));
      toast.success("Health check completed");
    } catch { toast.error("Health check failed"); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id) {
        await fetch(`${API}/carriers/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
        toast.success("Carrier updated");
      } else {
        await fetch(`${API}/carriers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
        toast.success("Carrier added");
      }
      setEditing(null);
      load();
    } catch { toast.error("Save failed"); }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await fetch(`${API}/carriers/${toDelete.id}`, { method: "DELETE" });
      toast.success("Carrier deleted");
      setToDelete(null);
      load();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <>
      <Seo title="Carrier Manager" path="/admin/shipping/carriers" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Carrier Manager</h1>
            <p className="mt-1 text-sm text-muted">Manage shipping carrier integrations, API credentials, and health monitoring.</p>
          </div>
          <button onClick={() => setEditing({ name: "", code: "", description: "", website: "", priority: 5, test_mode: true, active: true })} className="btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Add Carrier
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-surface2" />)
          ) : carriers.length === 0 ? (
            <div className="card p-12 text-center"><p className="text-muted">No carriers configured. Add a carrier to get started.</p></div>
          ) : carriers.map(c => (
            <div key={c.id} className={cn("card p-5", !c.active && "opacity-60")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-soft">
                    <Truck className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink flex items-center gap-2">
                      {c.name}
                      <span className="rounded bg-surface2 px-1.5 py-0.5 text-[0.65rem] font-mono uppercase text-muted">{c.code}</span>
                      {!c.active && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] text-amber-800">Inactive</span>}
                    </h3>
                    <p className="text-xs text-muted">{c.description}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {c.supported_countries?.length || 0} countries</span>
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {c.supported_services?.length || 0} services</span>
                      <span className="flex items-center gap-1">Priority: {c.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.api_docs_url && (
                    <a href={c.api_docs_url} target="_blank" rel="noopener" className="btn-ghost btn-sm"><ExternalLink className="h-3.5 w-3.5" /> API</a>
                  )}
                  <button onClick={() => checkHealth(c.id)} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Check</button>
                  <button onClick={() => setEditing({ ...c })} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setToDelete(c)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {healthMap[c.id] && (
                <div className={cn("mt-3 flex items-center gap-3 rounded-lg border p-3 text-xs", healthMap[c.id].healthy ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
                  {healthMap[c.id].healthy ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                  <span className={healthMap[c.id].healthy ? "text-green-800" : "text-red-800"}>
                    {healthMap[c.id].healthy ? "Healthy" : healthMap[c.id].status || "Degraded"}
                    {healthMap[c.id].latency_ms != null && ` · ${healthMap[c.id].latency_ms}ms latency`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="card relative z-10 w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Carrier" : "Add Carrier"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Name</label><input className="input-field" value={editing.name || ""} onChange={e => setEditing({...editing, name: e.target.value})} required /></div>
                <div><label className="label-field">Code</label><input className="input-field font-mono" value={editing.code || ""} onChange={e => setEditing({...editing, code: e.target.value})} required /></div>
              </div>
              <div><label className="label-field">Description</label><input className="input-field" value={editing.description || ""} onChange={e => setEditing({...editing, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Website</label><input className="input-field" value={editing.website || ""} onChange={e => setEditing({...editing, website: e.target.value})} /></div>
                <div><label className="label-field">API Docs URL</label><input className="input-field" value={editing.api_docs_url || ""} onChange={e => setEditing({...editing, api_docs_url: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Priority</label><input type="number" className="input-field" value={editing.priority ?? 5} onChange={e => setEditing({...editing, priority: Number(e.target.value)})} /></div>
                <div><label className="label-field">Tracking URL Template</label><input className="input-field font-mono text-xs" value={editing.tracking_url_template || ""} onChange={e => setEditing({...editing, tracking_url_template: e.target.value})} /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.test_mode ?? true} onChange={e => setEditing({...editing, test_mode: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Test Mode</label>
                <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({...editing, active: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add Carrier"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Carrier" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={remove} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Delete carrier <strong>{toDelete?.name}</strong>? This cannot be undone.
      </Dialog>
    </>
  );
}
