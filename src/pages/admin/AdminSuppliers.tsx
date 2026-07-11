import { useState } from "react";
import { Plus, Pencil, Trash2, X, Truck, Mail, Globe, Crown } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState } from "../../components/ui";
import type { Supplier } from "../../lib/types";
import { cn } from "@/utils/cn";

const EMPTY: Partial<Supplier> = { name: "", email: "", country: "Global", priority: 3, active: true, handlingDays: 2, notes: "" };

export default function AdminSuppliers() {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name is required");
    if (!editing?.email?.trim()) return toast.error("Email is required");
    if (editing.id) {
      updateSupplier(editing.id, editing);
      toast.success("Supplier updated");
    } else {
      addSupplier({ ...editing, name: editing.name!, email: editing.email! });
      toast.success("Supplier added");
    }
    setEditing(null);
  };

  void products; // product assignment is configured per-brand in production

  return (
    <>
      <Seo title="Suppliers" path="/admin/suppliers" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Suppliers</h1>
            <p className="mt-1 text-sm text-muted">{suppliers.length} fulfilment partners · auto-prioritised by priority.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add supplier</button>
        </div>

        {suppliers.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Truck className="h-6 w-6" />} title="No suppliers yet" description="Add a fulfilment partner to enable dropshipping automation." action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md">Add supplier</button>} />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...suppliers].sort((a, b) => a.priority - b.priority).map((s, idx) => (
              <div key={s.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink">{s.name}</h3>
                      {idx === 0 && s.active && <span className="badge bg-accent-soft text-accent"><Crown className="h-3 w-3" /> Primary</span>}
                    </div>
                    <a href={`mailto:${s.email}`} className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"><Mail className="h-3 w-3" /> {s.email}</a>
                  </div>
                  <button onClick={() => updateSupplier(s.id, { active: !s.active })} aria-label="Toggle active" className={cn("relative h-6 w-11 rounded-full transition-colors", s.active ? "bg-accent" : "bg-line")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", s.active ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center text-xs">
                  <div><p className="flex items-center justify-center gap-1 text-muted"><Globe className="h-3 w-3" /></p><p className="mt-0.5 font-medium text-ink truncate">{s.country}</p></div>
                  <div><p className="text-muted">Priority</p><p className="font-medium text-ink">{s.priority}</p></div>
                  <div><p className="text-muted">Handling</p><p className="font-medium text-ink">{s.handlingDays}d</p></div>
                </div>
                {s.notes && <p className="mt-3 line-clamp-2 text-xs text-muted">{s.notes}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing({ ...s })} className="btn-ghost btn-sm flex-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => setToDelete(s)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 text-xs text-muted">New orders auto-route to the highest-priority active supplier matching the destination country, with fallback to global partners.</p>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Supplier editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit supplier" : "Add supplier"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field" htmlFor="sup-name">Name</label><input id="sup-name" className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className="label-field" htmlFor="sup-email">Email</label><input id="sup-email" className="input-field" type="email" value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="orders@supplier.com" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field" htmlFor="sup-country">Country</label><input id="sup-country" className="input-field" value={editing.country || ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
                <div><label className="label-field" htmlFor="sup-priority">Priority</label><input id="sup-priority" type="number" min={1} max={10} className="input-field" value={editing.priority ?? 5} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} /></div>
                <div><label className="label-field" htmlFor="sup-handling">Handling days</label><input id="sup-handling" type="number" min={0} className="input-field" value={editing.handlingDays ?? 2} onChange={(e) => setEditing({ ...editing, handlingDays: Number(e.target.value) })} /></div>
              </div>
              <div><label className="label-field" htmlFor="sup-notes">Notes</label><textarea id="sup-notes" rows={2} className="input-field resize-none" value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add supplier"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete supplier" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteSupplier(toDelete.id); toast.success("Supplier removed"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button></>}>
        Remove <strong>{toDelete?.name}</strong>? Future orders will route to other active suppliers.
      </Dialog>
    </>
  );
}
