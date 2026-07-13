import { useState } from "react";
import { Plus, Pencil, Trash2, X, FolderOpen } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { DamField } from "../../components/DamField";
import { Dialog, EmptyState } from "../../components/ui";
import type { Category } from "../../lib/types";

const EMPTY: Partial<Category> = { name: "", tagline: "", description: "", image: "" };

export default function AdminCategories() {
  const { categories, productsByCategory, addCategory, updateCategory, deleteCategory } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  useEscapeKey(() => setIsOpen(false), isOpen);
  useLockBody(isOpen);

  const openNew = () => {
    setEditing({ ...EMPTY });
    setIsOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing({ ...c });
    setIsOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) {
      toast.error("Name required");
      return;
    }
    if (editing.id) {
      updateCategory(editing.id, editing);
      toast.success("Category updated");
    } else {
      addCategory({ ...editing, name: editing.name! });
      toast.success("Category created");
    }
    setIsOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteCategory(toDelete.id);
    toast.success("Category deleted");
    setToDelete(null);
  };

  return (
    <>
      <Seo title="Categories" path="/admin/categories" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Categories</h1>
            <p className="mt-1 text-sm text-muted">Organise your catalogue into collections.</p>
          </div>
          <button onClick={openNew} className="btn-primary btn-md"><Plus className="h-4 w-4" /> New category</button>
        </div>

        {categories.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<FolderOpen className="h-6 w-6" />} title="No categories yet" description="Create your first collection." action={<button onClick={openNew} className="btn-primary btn-md">New category</button>} />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className="card overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface2">
                  {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted"><FolderOpen className="h-8 w-8" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-ink">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">{c.tagline}</p>
                  <p className="mt-2 text-xs text-accent">{productsByCategory(c.id).length} products</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEdit(c)} className="btn-ghost btn-sm flex-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => setToDelete(c)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {isOpen && editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Category editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit category" : "New category"}</h2>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field" htmlFor="cat-name">Name</label><input id="cat-name" className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className="label-field" htmlFor="cat-tagline">Tagline</label><input id="cat-tagline" className="input-field" value={editing.tagline || ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></div>
              <div><label className="label-field" htmlFor="cat-desc">Description</label><textarea id="cat-desc" rows={3} className="input-field resize-none" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><label className="label-field" htmlFor="cat-image">Image</label><DamField label="" value={editing.image || ""} onChange={(v) => setEditing({ ...editing, image: v })} purpose="Category banner" source="category" folder="Categories" compact /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save changes" : "Create category"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete category"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Are you sure you want to delete <strong>{toDelete?.name}</strong>? Products in this category will remain but be unlinked.
      </Dialog>
    </>
  );
}
