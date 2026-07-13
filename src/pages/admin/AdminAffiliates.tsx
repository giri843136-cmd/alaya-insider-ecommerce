import { useState } from "react";
import { Plus, Pencil, Trash2, X, Handshake, ExternalLink } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState } from "../../components/ui";
import type { AffPartner } from "../../lib/types";
import { cn } from "@/utils/cn";

const EMPTY: Partial<AffPartner> = { name: "", url: "", commission: 5, active: true };

export default function AdminAffiliates() {
  const { affiliates, products, addAffiliate, updateAffiliate, deleteAffiliate } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<AffPartner> | null>(null);
  const [toDelete, setToDelete] = useState<AffPartner | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const productCount = (name: string) => products.filter((p) => p.affiliatePartner === name).length;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim() || !editing?.url?.trim()) {
      toast.error("Name and URL are required");
      return;
    }
    if (editing.id) {
      updateAffiliate(editing.id, editing);
      toast.success("Partner updated");
    } else {
      addAffiliate({ ...editing, name: editing.name!, url: editing.url! });
      toast.success("Partner added");
    }
    setEditing(null);
  };

  return (
    <>
      <Seo title="Affiliates" path="/admin/affiliates" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Affiliate partners</h1>
            <p className="mt-1 text-sm text-muted">Manage retailers you curate and earn commission from.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add partner</button>
        </div>

        {affiliates.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Handshake className="h-6 w-6" />} title="No partners yet" description="Add your first affiliate retailer." action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md">Add partner</button>} />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {affiliates.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{a.name}</h3>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      {a.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <button
                    onClick={() => updateAffiliate(a.id, { active: !a.active })}
                    aria-label="Toggle active"
                    className={cn("relative h-6 w-11 rounded-full transition-colors", a.active ? "bg-accent" : "bg-line")}
                  >
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", a.active ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <div>
                    <p className="text-xs text-muted">Commission</p>
                    <p className="font-semibold text-ink">{a.commission}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Linked products</p>
                    <p className="font-semibold text-ink">{productCount(a.name)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({ ...a })} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setToDelete(a)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Partner editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit partner" : "Add partner"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field" htmlFor="aff-name">Partner name</label><input id="aff-name" className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="NET-A-PORTER" /></div>
              <div><label className="label-field" htmlFor="aff-url">Website URL</label><input id="aff-url" className="input-field" value={editing.url || ""} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://…" /></div>
              <div><label className="label-field" htmlFor="aff-commission">Commission (%)</label><input id="aff-commission" type="number" min={0} max={50} className="input-field" value={editing.commission ?? 5} onChange={(e) => setEditing({ ...editing, commission: Number(e.target.value) })} /></div>
              <label className="flex items-center gap-3 text-sm text-ink">
                <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                Active (visible on storefront)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add partner"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete partner"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { if (toDelete) { deleteAffiliate(toDelete.id); toast.success("Partner removed"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Remove <strong>{toDelete?.name}</strong> as a partner? Linked products will remain but lose their partner tag.
      </Dialog>
    </>
  );
}
