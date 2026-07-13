import { useState } from "react";
import { Plus, Pencil, Trash2, X, Truck, Crown } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState } from "../../components/ui";
import type { Supplier } from "../../lib/types";
import { cn } from "@/utils/cn";

const EMPTY: any = {
  name: "", email: "", company: "", website: "", api: "", phone: "", whatsapp: "", country: "Global",
  priority: 3, active: true, handlingDays: 2, notes: "",
};

export default function CommerceSuppliers() {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);
  const [view, setView] = useState<any>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name required");
    if (editing.id) { updateSupplier(editing.id, { name: editing.name, email: editing.email, country: editing.country, priority: editing.priority, active: editing.active, handlingDays: editing.handlingDays, notes: editing.notes }); toast.success("Supplier updated"); }
    else { addSupplier({ name: editing.name, email: editing.email, country: editing.country, priority: editing.priority, active: editing.active, handlingDays: editing.handlingDays, notes: editing.notes }); toast.success("Supplier added"); }
    setEditing(null);
  };

  const productCount = (s: Supplier) => products.filter(p => p.supplierId === s.id).length;
  // const totalCost = (s: Supplier) => products.filter(p => p.supplierId === s.id).reduce((sum, p) => sum + (p.costPrice || 0), 0);

  const sorted = [...suppliers].sort((a, b) => {
    const aScore = a.priority * 10 + (a.active ? 0 : 100);
    const bScore = b.priority * 10 + (b.active ? 0 : 100);
    return aScore - bScore;
  });

  return (
    <>
      <Seo title="Supplier Management" path="/admin/commerce/suppliers" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Supplier Management</h1>
            <p className="mt-1 text-sm text-muted">{suppliers.length} partners · auto-ranked by performance.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add Supplier</button>
        </div>

        {/* Rankings */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-semibold text-accent">{suppliers.length}</p>
            <p className="text-xs text-muted">Total Suppliers</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-semibold text-success">{suppliers.filter(s => s.active).length}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-semibold text-ink">{products.filter(p => p.supplierId).length}</p>
            <p className="text-xs text-muted">Linked Products</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-semibold text-warning">{suppliers.filter(s => !s.active).length}</p>
            <p className="text-xs text-muted">Inactive</p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Truck className="h-6 w-6" />} title="No suppliers yet" action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md">Add Supplier</button>} /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((s, idx) => {
              const pCount = productCount(s);
              const score = Math.max(0, 100 - (s.priority - 1) * 15 - (s.active ? 0 : 50));
              return (
                <div key={s.id} className={cn("card p-5 cursor-pointer transition-all hover:shadow-lg", !s.active && "opacity-60")} onClick={() => setView({ ...s, score, productCount: pCount })}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("grid h-12 w-12 place-items-center rounded-full text-lg font-bold", idx === 0 && s.active ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>
                        {idx === 0 && s.active ? <Crown className="h-6 w-6" /> : s.name[0]}
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink">{s.name}</h3>
                        <p className="text-xs text-muted">{s.country} · Priority {s.priority}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="text-muted">Score</p><p className={cn("font-semibold", score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-danger")}>{score}</p></div>
                    <div><p className="text-muted">Products</p><p className="font-semibold text-ink">{pCount}</p></div>
                    <div><p className="text-muted">Lead Time</p><p className="font-semibold text-ink">{s.handlingDays}d</p></div>
                    <div><p className="text-muted">Status</p><span className={cn("badge", s.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{s.active ? "Active" : "Inactive"}</span></div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface2">
                    <div className={cn("h-full rounded-full transition-all", score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger")} style={{ width: `${score}%` }} />
                  </div>
                  <div className="mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditing({ ...s, company: "", website: "", api: "" })} className="btn-ghost btn-sm flex-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => setToDelete(s)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail View */}
      {view && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setView(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="card relative z-10 w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-14 w-14 place-items-center rounded-full text-xl font-bold", view.active ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>{view.name[0]}</span>
                <div><h2 className="text-lg font-semibold text-ink">{view.name}</h2><p className="text-sm text-muted">{view.country}</p></div>
              </div>
              <button onClick={() => setView(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Email</p><p className="font-medium text-ink">{view.email}</p></div>
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Priority</p><p className="font-medium text-ink">{view.priority}</p></div>
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Handling Days</p><p className="font-medium text-ink">{view.handlingDays}</p></div>
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Performance Score</p><p className="font-medium text-ink">{view.score}/100</p></div>
            </div>
            {view.notes && <div className="mt-4 rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Notes</p><p className="text-sm text-ink">{view.notes}</p></div>}
            <div className="mt-4 flex justify-between text-xs text-muted">
              <span>{view.productCount} products linked</span>
              <span>Status: {view.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Supplier" : "Add Supplier"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Supplier Name</label><input className="input-field" value={editing.name || ""} onChange={e => setEditing({...editing, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Email</label><input type="email" className="input-field" value={editing.email || ""} onChange={e => setEditing({...editing, email: e.target.value})} /></div>
                <div><label className="label-field">Phone</label><input className="input-field" value={editing.phone || ""} onChange={e => setEditing({...editing, phone: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Company</label><input className="input-field" value={editing.company || ""} onChange={e => setEditing({...editing, company: e.target.value})} /></div>
                <div><label className="label-field">Country</label><input className="input-field" value={editing.country || ""} onChange={e => setEditing({...editing, country: e.target.value})} /></div>
              </div>
              <div><label className="label-field">Website</label><input className="input-field" value={editing.website || ""} onChange={e => setEditing({...editing, website: e.target.value})} placeholder="https://" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Priority</label><input type="number" min={1} max={10} className="input-field" value={editing.priority ?? 5} onChange={e => setEditing({...editing, priority: Number(e.target.value)})} /></div>
                <div><label className="label-field">Lead Time Days</label><input type="number" className="input-field" value={editing.handlingDays ?? 2} onChange={e => setEditing({...editing, handlingDays: Number(e.target.value)})} /></div>
                <div><label className="label-field">MOQ</label><input type="number" className="input-field" value={editing.moq || 1} onChange={e => setEditing({...editing, moq: Number(e.target.value)})} /></div>
              </div>
              <div><label className="label-field">Notes</label><textarea rows={2} className="input-field resize-none" value={editing.notes || ""} onChange={e => setEditing({...editing, notes: e.target.value})} /></div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({...editing, active: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add Supplier"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Supplier" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteSupplier(toDelete.id); toast.success("Deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Remove <strong>{toDelete?.name}</strong>? Products linked to this supplier won't be affected.
      </Dialog>
    </>
  );
}
