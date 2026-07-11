import { useState } from "react";
import { Plus, Pencil, Trash2, X, Newspaper, ExternalLink } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { DamField } from "../../components/DamField";
import { Dialog, EmptyState } from "../../components/ui";
import type { Article } from "../../lib/types";
import { formatDate } from "../../lib/utils";

const EMPTY: Partial<Article> = {
  title: "", excerpt: "", body: [], cover: "", author: "ALAYA Editors", authorRole: "Editor",
  category: "Style", tags: [], readMinutes: 4, publishedAt: Date.now(), featured: false,
};

export default function AdminArticles() {
  const { articles, addArticle, updateArticle, deleteArticle } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<(Partial<Article> & { bodyText?: string; tagsText?: string }) | null>(null);
  const [toDelete, setToDelete] = useState<Article | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const openNew = () => setEditing({ ...EMPTY, bodyText: "", tagsText: "" });
  const openEdit = (a: Article) => setEditing({ ...a, bodyText: a.body.join("\n\n"), tagsText: a.tags.join(", ") });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.title?.trim()) return toast.error("Title is required");
    if (!editing?.cover?.trim()) return toast.error("Cover image URL is required");
    const payload = {
      title: editing.title!.trim(),
      excerpt: editing.excerpt || "",
      body: (editing.bodyText || "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
      cover: editing.cover,
      author: editing.author || "ALAYA Editors",
      authorRole: editing.authorRole || "Editor",
      category: editing.category || "Style",
      tags: (editing.tagsText || "").split(",").map((t) => t.trim()).filter(Boolean),
      readMinutes: editing.readMinutes ?? 4,
      featured: editing.featured,
    };
    if (editing.id) {
      updateArticle(editing.id, payload);
      toast.success("Article updated");
    } else {
      addArticle({ ...payload, title: payload.title });
      toast.success("Article published");
    }
    setEditing(null);
  };

  return (
    <>
      <Seo title="Journal" path="/admin/journal" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Journal</h1>
            <p className="mt-1 text-sm text-muted">{articles.length} published articles.</p>
          </div>
          <button onClick={openNew} className="btn-primary btn-md"><Plus className="h-4 w-4" /> New article</button>
        </div>

        {articles.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Newspaper className="h-6 w-6" />} title="No articles yet" description="Publish your first editorial story." action={<button onClick={openNew} className="btn-primary btn-md">New article</button>} />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <div key={a.id} className="card overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface2">
                  <img src={a.cover} alt={a.title} className="h-full w-full object-cover" />
                  {a.featured && <span className="absolute left-3 top-3 badge bg-accent-soft text-accent">Featured</span>}
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">{a.category}</span>
                  <h3 className="mt-1.5 line-clamp-2 font-semibold text-ink">{a.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-muted">{a.excerpt}</p>
                  <p className="mt-3 text-xs text-muted">{a.author} · {formatDate(a.publishedAt)}</p>
                  <div className="mt-4 flex gap-2">
                    <a href={`/#/journal/${a.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm flex-1"><ExternalLink className="h-3.5 w-3.5" /> View</a>
                    <button onClick={() => openEdit(a)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setToDelete(a)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Article editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 my-4 w-full max-w-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit article" : "New article"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field" htmlFor="art-title">Title</label><input id="art-title" className="input-field" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><label className="label-field" htmlFor="art-excerpt">Excerpt</label><input id="art-excerpt" className="input-field" value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label-field" htmlFor="art-category">Category</label><input id="art-category" className="input-field" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><label className="label-field" htmlFor="art-readtime">Read time (min)</label><input id="art-readtime" type="number" min={1} className="input-field" value={editing.readMinutes ?? 4} onChange={(e) => setEditing({ ...editing, readMinutes: Number(e.target.value) })} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label-field" htmlFor="art-author">Author</label><input id="art-author" className="input-field" value={editing.author || ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
                <div><label className="label-field" htmlFor="art-role">Author role</label><input id="art-role" className="input-field" value={editing.authorRole || ""} onChange={(e) => setEditing({ ...editing, authorRole: e.target.value })} /></div>
              </div>
              <div><label className="label-field" htmlFor="art-cover">Cover image *</label><DamField label="" value={editing.cover || ""} onChange={(v) => setEditing({ ...editing, cover: v })} purpose="Article cover" source="article" folder="Articles" compact /></div><div><label className="label-field" htmlFor="art-body">Body (separate paragraphs with a blank line)</label>
                <textarea id="art-body" rows={6} className="input-field resize-none" value={editing.bodyText || ""} onChange={(e) => setEditing({ ...editing, bodyText: e.target.value })} />
              </div>
              <div><label className="label-field" htmlFor="art-tags">Tags (comma separated)</label><input id="art-tags" className="input-field" value={editing.tagsText || ""} onChange={(e) => setEditing({ ...editing, tagsText: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={editing.featured ?? false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                Feature on Journal page
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save changes" : "Publish article"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete article"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { if (toDelete) { deleteArticle(toDelete.id); toast.success("Article deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Permanently delete <strong>{toDelete?.title}</strong>?
      </Dialog>
    </>
  );
}
