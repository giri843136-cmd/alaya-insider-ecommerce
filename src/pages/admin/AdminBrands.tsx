import { useState } from "react";
import { Plus, Pencil, Trash2, X, Tag, ExternalLink } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { DamField } from "../../components/DamField";
import { Dialog, EmptyState } from "../../components/ui";
import type { Brand } from "../../lib/types";

const EMPTY: Partial<Brand> = { name: "", tagline: "", description: "", image: "", country: "Global", featured: false };

export default function AdminBrands() {
  const { brands, productsByBrand, addBrand, updateBrand, deleteBrand } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Brand> | null>(null);
  const [toDelete, setToDelete] = useState<Brand | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name is required");
    if (editing.id) {
      updateBrand(editing.id, editing);
      toast.success("Brand updated");
    } else {
      addBrand({ ...editing, name: editing.name! });
      toast.success("Brand created");
    }
    setEditing(null);
  };

  return (
    <>
      <Seo title="Brands" path="/admin/brands" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Brands</h1>
            <p className="mt-1 text-sm text-muted">{brands.length} brands across the catalogue.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add brand</button>
        </div>

        {brands.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Tag className="h-6 w-6" />} title="No brands yet" description="Add the makers behind your edit." action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md">Add brand</button>} />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <div key={b.id} className="card overflow-hidden">
                <div className="flex gap-4 p-4">
                  <img src={b.image} alt={b.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-ink">{b.name}</h3>
                      {b.featured && <span className="badge bg-accent-soft text-accent">Featured</span>}
                    </div>
                    <p className="truncate text-xs text-muted">{b.tagline}</p>
                    <a href={`/#/brands/${b.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      View on store <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-line px-4 py-3">
                  <span className="text-xs text-muted">{b.country} · {productsByBrand(b.id).length} products</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({ ...b })} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setToDelete(b)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Brand editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit brand" : "New brand"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field" htmlFor="brand-name">Name</label><input id="brand-name" className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field" htmlFor="brand-tagline">Tagline</label><input id="brand-tagline" className="input-field" value={editing.tagline || ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></div>
                <div><label className="label-field" htmlFor="brand-country">Country</label><input id="brand-country" className="input-field" value={editing.country || ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
              </div>
              <div><label className="label-field" htmlFor="brand-desc">Description</label><textarea id="brand-desc" rows={3} className="input-field resize-none" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><label className="label-field" htmlFor="brand-image">Image</label><DamField label="" value={editing.image || ""} onChange={(v) => setEditing({ ...editing, image: v })} purpose="Brand photo" source="brand" folder="Brands" compact /></div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={editing.featured ?? false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                Featured brand (shown on Brands page)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save changes" : "Create brand"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete brand"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { if (toDelete) { deleteBrand(toDelete.id); toast.success("Brand deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Delete <strong>{toDelete?.name}</strong>? Products will remain but lose their brand link.
      </Dialog>
    </>
  );
}
