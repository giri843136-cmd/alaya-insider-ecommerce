import { useState } from "react";
import { Plus, Pencil, Trash2, X, Warehouse as WarehouseIcon, MapPin, Phone, Mail } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Dialog, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { uid } from "../../lib/utils";

interface Warehouse {
  id: string; name: string; code: string; address: string; city: string; country: string;
  contactName: string; contactEmail: string; contactPhone: string;
  capacity: number; usedCapacity: number; temperature: string; active: boolean; isPrimary: boolean;
}

const STORAGE_KEY = "alaya_warehouses_v1";
function loadWarehouses(): Warehouse[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return [
    { id: uid("wh"), name: "NYC Fulfillment Center", code: "NYC-01", address: "200 Park Avenue South", city: "New York", country: "United States", contactName: "James Miller", contactEmail: "james@alayainsider.com", contactPhone: "+1 (212) 555-0101", capacity: 5000, usedCapacity: 3200, temperature: "ambient", active: true, isPrimary: true },
    { id: uid("wh"), name: "LA Distribution Hub", code: "LAX-01", address: "1200 S Figueroa St", city: "Los Angeles", country: "United States", contactName: "Sarah Chen", contactEmail: "sarah@alayainsider.com", contactPhone: "+1 (213) 555-0202", capacity: 3500, usedCapacity: 1800, temperature: "climate_controlled", active: true, isPrimary: false },
    { id: uid("wh"), name: "London EU Hub", code: "LHR-01", address: "88 Soho Square", city: "London", country: "United Kingdom", contactName: "Oliver Grant", contactEmail: "oliver@alayainsider.com", contactPhone: "+44 20 7123 4567", capacity: 3000, usedCapacity: 1200, temperature: "ambient", active: true, isPrimary: false },
  ];
}

export default function CommerceWarehouses() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>(loadWarehouses);
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<Warehouse | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name required");
    if (editing.isPrimary) { warehouses.forEach(w => { if (w.id !== editing.id) w.isPrimary = false; }); }
    const updated = editing.id ? warehouses.map(w => w.id === editing.id ? editing : w) : [...warehouses, { ...editing, id: uid("wh"), usedCapacity: 0 }];
    setWarehouses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(editing.id ? "Warehouse updated" : "Warehouse added");
    setEditing(null);
  };

  return (
    <>
      <Seo title="Warehouses" path="/admin/commerce/warehouses" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Warehouses</h1>
            <p className="mt-1 text-sm text-muted">{warehouses.length} locations · manage global fulfillment.</p>
          </div>
          <button onClick={() => setEditing({ name: "", code: "", address: "", city: "", country: "United States", contactName: "", contactEmail: "", contactPhone: "", capacity: 1000, temperature: "ambient", active: true, isPrimary: false })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add Warehouse</button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-accent">{warehouses.length}</p><p className="text-xs text-muted">Total Warehouses</p></div>
          <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-success">{warehouses.filter(w => w.active).length}</p><p className="text-xs text-muted">Active</p></div>
          <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-ink">{warehouses.reduce((s, w) => s + w.usedCapacity, 0).toLocaleString()} / {warehouses.reduce((s, w) => s + w.capacity, 0).toLocaleString()} m³</p><p className="text-xs text-muted">Capacity Used</p></div>
        </div>

        {warehouses.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<WarehouseIcon className="h-6 w-6" />} title="No warehouses" /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {warehouses.map(w => {
              const pct = Math.round((w.usedCapacity / Math.max(1, w.capacity)) * 100);
              return (
                <div key={w.id} className={cn("card p-5", !w.active && "opacity-60")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{w.name}</h3>
                        {w.isPrimary && <span className="badge bg-accent text-accent-ink">Primary</span>}
                      </div>
                      <p className="text-xs text-muted flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {w.city}, {w.country}</p>
                    </div>
                    <span className="text-xs font-mono text-muted">{w.code}</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted mb-1"><span>Capacity</span><span>{w.usedCapacity}/{w.capacity} m³</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface2">
                      <div className={cn("h-full rounded-full", pct > 80 ? "bg-danger" : pct > 60 ? "bg-warning" : "bg-success")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {w.contactEmail}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {w.contactPhone}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setEditing({ ...w })} className="btn-ghost btn-sm flex-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => setToDelete(w)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Warehouse" : "Add Warehouse"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Name</label><input className="input-field" value={editing.name || ""} onChange={e => setEditing({...editing, name: e.target.value})} /></div>
                <div><label className="label-field">Code</label><input className="input-field" value={editing.code || ""} onChange={e => setEditing({...editing, code: e.target.value})} /></div>
              </div>
              <div><label className="label-field">Address</label><input className="input-field" value={editing.address || ""} onChange={e => setEditing({...editing, address: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">City</label><input className="input-field" value={editing.city || ""} onChange={e => setEditing({...editing, city: e.target.value})} /></div>
                <div><label className="label-field">Country</label><input className="input-field" value={editing.country || ""} onChange={e => setEditing({...editing, country: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Contact Name</label><input className="input-field" value={editing.contactName || ""} onChange={e => setEditing({...editing, contactName: e.target.value})} /></div>
                <div><label className="label-field">Contact Email</label><input type="email" className="input-field" value={editing.contactEmail || ""} onChange={e => setEditing({...editing, contactEmail: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Phone</label><input className="input-field" value={editing.contactPhone || ""} onChange={e => setEditing({...editing, contactPhone: e.target.value})} /></div>
                <div><label className="label-field">Capacity (m³)</label><input type="number" className="input-field" value={editing.capacity || 1000} onChange={e => setEditing({...editing, capacity: Number(e.target.value)})} /></div>
              </div>
              <div><label className="label-field">Temperature</label><select className="input-field" value={editing.temperature || "ambient"} onChange={e => setEditing({...editing, temperature: e.target.value})}><option value="ambient">Ambient</option><option value="climate_controlled">Climate Controlled</option><option value="cold_storage">Cold Storage</option></select></div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({...editing, active: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.isPrimary ?? false} onChange={e => setEditing({...editing, isPrimary: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Primary Warehouse</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add Warehouse"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Warehouse" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { setWarehouses(warehouses.filter(w => w.id !== toDelete.id)); localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouses.filter(w => w.id !== toDelete.id))); toast.success("Deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>?
      </Dialog>
    </>
  );
}
