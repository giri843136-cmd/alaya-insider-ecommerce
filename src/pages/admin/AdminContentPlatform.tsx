import { useMemo, useState } from "react";
import {
  LayoutDashboard, FileText, Users, Tags, Search, Sparkles, Globe, CalendarDays,
  BarChart3, TrendingUp, Eye, Plus, Pencil, Trash2, X, CheckCircle2,
  Copy, Send, Loader2, Award, Star, Languages,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDate } from "../../lib/utils";
import {
  getContentEntries, createContentEntry, updateContentEntry,
  deleteContentEntry, publishContentEntry, duplicateContentEntry, getContentTemplates,
  getAuthors, createAuthor, updateAuthor,
  getCategories, getTags, getTopics, createCategory, createTag,
  getSchemaTemplates, auditSeo,
  runAiContentTask, getAiContentHistory, getAiContentSuggestions,
  getLocalizations, getAvailableLocales, translateEntry,
  searchContent, getTrendingContent, getFeaturedContent,
  getSchedules, getEditorialCalendar,
  generateContentReport, generateContentForecast, getContentPlatformDashboard,
  type ContentEntry, type ContentType, type ContentStatus,
  type Author, type ContentReport, type ContentForecast, type AiContentRequest,
} from "../../lib/contentPlatform";

type Tab = "dashboard" | "cms" | "authors" | "taxonomy" | "seo" | "ai-studio" | "localization" | "search" | "calendar" | "reports" | "forecasts";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cms", label: "Content", icon: FileText },
  { id: "authors", label: "Authors", icon: Users },
  { id: "taxonomy", label: "Taxonomy", icon: Tags },
  { id: "seo", label: "SEO", icon: Search },
  { id: "ai-studio", label: "AI Studio", icon: Sparkles },
  { id: "localization", label: "Localize", icon: Globe },
  { id: "search", label: "Discovery", icon: Eye },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "forecasts", label: "Forecasts", icon: TrendingUp },
];

export default function AdminContentPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Content Platform" path="/admin/content-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Content Platform</h1>
            <p className="mt-1 text-sm text-muted">Enterprise CMS, Editorial Engine, AI Content Studio, Localization & SEO.</p>
          </div>
        </div>
        <div className="mt-6 hide-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip shrink-0", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "cms" && <CmsTab />}
          {tab === "authors" && <AuthorsTab />}
          {tab === "taxonomy" && <TaxonomyTab />}
          {tab === "seo" && <SeoTab />}
          {tab === "ai-studio" && <AiStudioTab />}
          {tab === "localization" && <LocalizationTab />}
          {tab === "search" && <SearchTab />}
          {tab === "calendar" && <CalendarTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "forecasts" && <ForecastsTab />}
        </div>
      </div>
    </>
  );
}

/* ======================== DASHBOARD ======================== */

function DashboardTab() {
  const authors = useMemo(() => getAuthors(), []);
  const dashboard = useMemo(() => getContentPlatformDashboard(), []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total entries", value: String(dashboard.totalEntries), sub: "Across all types", icon: FileText },
          { label: "Published", value: String(dashboard.published), sub: `${dashboard.drafts} drafts · ${dashboard.scheduled} scheduled`, icon: CheckCircle2 },
          { label: "Active authors", value: String(dashboard.activeAuthors), sub: `of ${dashboard.totalAuthors} total`, icon: Users },
          { label: "Taxonomy", value: String(dashboard.categories + dashboard.tags), sub: `${dashboard.categories} categories · ${dashboard.tags} tags`, icon: Tags },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
              <span className="font-display text-3xl font-semibold text-ink">{s.value}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Upcoming Schedule</h2></div>
          {dashboard.upcomingSchedules.length === 0 ? (
            <div className="p-5 text-sm text-muted">No upcoming scheduled content.</div>
          ) : (
            <div className="divide-y divide-line">
              {dashboard.upcomingSchedules.map((day, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-xs font-semibold uppercase text-muted">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  {day.entries.map((e) => (
                    <div key={e.entryId} className="mt-1 flex items-center gap-2 text-sm text-ink">
                      <CalendarDays className="h-3.5 w-3.5 text-accent" />
                      <span className="capitalize">{e.type}</span>
                      <span>·</span>
                      <span className="truncate">{e.title}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Author Spotlight</h2></div>
          <div className="divide-y divide-line">
            {authors.filter((a) => a.status === "active").slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-xs font-bold text-ink">{a.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                  <p className="text-xs capitalize text-muted">{a.role} · {a.department}</p>
                </div>
                <span className="text-xs text-muted">{a.stats.articlesCount} articles</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================== CMS ======================== */

function CmsTab() {
  const entries = useMemo(() => getContentEntries(), []);
  const authors = useMemo(() => getAuthors(), []);
  const templates = useMemo(() => getContentTemplates(), []);
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ContentEntry> | null>(null);
  const [viewing, setViewing] = useState<ContentEntry | null>(null);
  useEscapeKey(() => { setViewing(null); }, !!viewing);
  useLockBody(!!viewing);
  useEscapeKey(() => { setEditorOpen(false); setEditing(null); }, editorOpen);
  useLockBody(editorOpen);

  const openNew = () => {
    setEditing({ title: "", type: "article", authorId: authors[0]?.id || "", body: [] });
    setEditorOpen(true);
  };
  const openEdit = (e: ContentEntry) => { setEditing({ ...e }); setEditorOpen(true); };

  const saveEntry = () => {
    if (!editing?.title?.trim()) return toast.error("Title is required");
    if (!editing?.type) return toast.error("Type is required");
    if (!editing?.authorId) return toast.error("Author is required");
    if (editing.id) {
      updateContentEntry(editing.id, editing);
      toast.success("Content entry updated");
    } else {
      createContentEntry(editing as any);
      toast.success("Content entry created");
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const STATUS_COLORS: Record<ContentStatus, string> = {
    draft: "bg-surface2 text-muted", review: "bg-warning/15 text-warning",
    approved: "bg-success/15 text-success", scheduled: "bg-accent-soft text-accent",
    published: "bg-success/15 text-success", archived: "bg-surface2 text-muted",
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{entries.length} entries · {templates.length} templates</p>
        <div className="flex gap-2">
          <button onClick={() => { const j = JSON.stringify(getContentEntries(), null, 2); navigator.clipboard.writeText(j); toast.success("Content entries copied to clipboard"); }} className="btn-ghost btn-sm"><Copy className="h-4 w-4" /> Export</button>
          <button onClick={openNew} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New entry</button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<FileText className="h-6 w-6" />} title="No content yet" description="Create your first content entry from a template or from scratch." action={<button onClick={openNew} className="btn-primary btn-md">New entry</button>} /></div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface2/40">
                  <td className="px-4 py-3 font-medium text-ink">
                    <button onClick={() => setViewing(e)} className="hover:text-accent">{e.title}</button>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{e.type}</td>
                  <td className="px-4 py-3"><span className={cn("badge", STATUS_COLORS[e.status])}>{e.status}</span></td>
                  <td className="px-4 py-3 text-muted">v{e.version}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(e.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(e)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      {e.status === "draft" && <button onClick={() => { publishContentEntry(e.id); toast.success("Published"); }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Publish"><Send className="h-4 w-4 text-success" /></button>}
                      <button onClick={() => { duplicateContentEntry(e.id); toast.success("Duplicated"); }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => { deleteContentEntry(e.id); toast.success("Deleted"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entry detail drawer */}
      {viewing && (
        <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setViewing(null)} aria-hidden="true" />
          <aside className="hide-scrollbar relative z-10 h-full w-full max-w-lg overflow-y-auto bg-canvas animate-drawer p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{viewing.title}</h2>
              <button onClick={() => setViewing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="label-field">Type</p><p className="capitalize text-ink">{viewing.type}</p></div>
                <div><p className="label-field">Status</p><span className={cn("badge", STATUS_COLORS[viewing.status])}>{viewing.status}</span></div>
                <div><p className="label-field">Version</p><p className="text-ink">v{viewing.version}</p></div>
                <div><p className="label-field">Slug</p><p className="text-ink">/{viewing.slug}</p></div>
              </div>
              <div><p className="label-field">Excerpt</p><p className="text-sm text-muted">{viewing.excerpt || "—"}</p></div>
              <div><p className="label-field">Blocks</p><p className="text-ink">{viewing.body.length} content blocks</p></div>
              {viewing.tags.length > 0 && (
                <div><p className="label-field">Tags</p><div className="flex flex-wrap gap-1">{viewing.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted">{t}</span>)}</div></div>
              )}
              <div><p className="label-field">SEO</p>
                <div className="space-y-1 text-xs text-muted">
                  <p>Meta: {viewing.seo.metaTitle || "—"}</p>
                  <p>Canonical: {viewing.seo.canonical || "—"}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setEditorOpen(false); setEditing(null); }} aria-hidden="true" />
          <div className="card relative z-10 my-4 w-full max-w-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing?.id ? "Edit entry" : "New entry"}</h2>
              <button onClick={() => { setEditorOpen(false); setEditing(null); }} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Title</label><input className="input-field" value={editing?.title || ""} onChange={(e) => setEditing({ ...editing!, title: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Type</label>
                  <select className="input-field" value={editing?.type || "article"} onChange={(e) => setEditing({ ...editing!, type: e.target.value as ContentType })}>
                    {(["article", "page", "guide", "comparison", "review", "editorial", "landing", "collection"] as const).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">Author</label>
                  <select className="input-field" value={editing?.authorId || ""} onChange={(e) => setEditing({ ...editing!, authorId: e.target.value })}>
                    <option value="">Select author</option>
                    {getAuthors().map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div><label className="label-field">Excerpt</label><textarea rows={2} className="input-field resize-none" value={editing?.excerpt || ""} onChange={(e) => setEditing({ ...editing!, excerpt: e.target.value })} /></div>
              <div><label className="label-field">Cover image URL</label><input className="input-field" value={editing?.coverImage || ""} onChange={(e) => setEditing({ ...editing!, coverImage: e.target.value })} placeholder="https://…" /></div>
              <div>
                <label className="label-field">Templates</label>
                <div className="flex flex-wrap gap-2">
                  {getContentTemplates().filter((t) => t.type === editing?.type).map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => { setEditing({ ...editing!, body: tpl.blocks }); toast.success(`Template "${tpl.name}" applied`); }} className="chip bg-accent-soft text-accent">
                      <Copy className="h-3 w-3" /> {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditorOpen(false); setEditing(null); }} className="btn-ghost btn-md">Cancel</button>
              <button onClick={saveEntry} className="btn-primary btn-md">{editing?.id ? "Save changes" : "Create entry"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ======================== AUTHORS ======================== */

function AuthorsTab() {
  const authors = useMemo(() => getAuthors(), []);
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Author> | null>(null);

  const openNew = () => { setEditing({ name: "", email: "", role: "author" }); setEditorOpen(true); };
  const openEdit = (a: Author) => { setEditing({ ...a }); setEditorOpen(true); };
  const saveAuthor = () => {
    if (!editing?.name?.trim() || !editing?.email?.trim()) return toast.error("Name and email required");
    if (editing.id) { updateAuthor(editing.id, editing); toast.success("Author updated"); }
    else { createAuthor(editing as any); toast.success("Author created"); }
    setEditorOpen(false); setEditing(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{authors.length} authors · {authors.filter((a) => a.status === "active").length} active</p>
        <button onClick={openNew} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New author</button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">{a.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{a.name}</p>
                <p className="truncate text-xs capitalize text-muted">{a.role} · {a.department}</p>
              </div>
              {a.eEAT.verified && <Award className="h-5 w-5 text-accent" aria-label="E-E-A-T Verified" />}
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-muted">{a.bio}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span>{a.stats.articlesCount} articles</span>
              <span>{a.stats.totalViews.toLocaleString()} views</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {a.expertise.slice(0, 3).map((ex) => (
                <span key={ex} className="badge bg-surface2 text-muted">{ex}</span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(a)} className="btn-ghost btn-sm flex-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
            </div>
          </div>
        ))}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setEditorOpen(false); setEditing(null); }} aria-hidden="true" />
          <div className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing?.id ? "Edit author" : "New author"}</h2>
              <button onClick={() => { setEditorOpen(false); setEditing(null); }} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Name</label><input className="input-field" value={editing?.name || ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
              <div><label className="label-field">Email</label><input className="input-field" value={editing?.email || ""} onChange={(e) => setEditing({ ...editing!, email: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Role</label>
                  <select className="input-field" value={editing?.role || "author"} onChange={(e) => setEditing({ ...editing!, role: e.target.value as Author["role"] })}>
                    <option value="author">Author</option><option value="editor">Editor</option><option value="contributor">Contributor</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Department</label>
                  <input className="input-field" value={editing?.department || ""} onChange={(e) => setEditing({ ...editing!, department: e.target.value })} />
                </div>
              </div>
              <div><label className="label-field">Bio</label><textarea rows={3} className="input-field resize-none" value={editing?.bio || ""} onChange={(e) => setEditing({ ...editing!, bio: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditorOpen(false); setEditing(null); }} className="btn-ghost btn-md">Cancel</button>
              <button onClick={saveAuthor} className="btn-primary btn-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ======================== TAXONOMY ======================== */

function TaxonomyTab() {
  const cats = useMemo(() => getCategories(), []);
  const tags = useMemo(() => getTags(), []);
  const topics = useMemo(() => getTopics(), []);
  const { toast } = useToast();

  const [newCat, setNewCat] = useState("");
  const [newTag, setNewTag] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Categories ({cats.length})</h2></div>
        <div className="divide-y divide-line">
          {cats.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.articleCount} articles</p>
              </div>
              <span className="text-xs text-muted">{c.slug}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3">
          <input className="input-field flex-1" placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newCat.trim()) { createCategory({ name: newCat.trim() }); toast.success("Category created"); setNewCat(""); } }} />
          <button onClick={() => { if (newCat.trim()) { createCategory({ name: newCat.trim() }); toast.success("Category created"); setNewCat(""); } }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Tags ({tags.length})</h2></div>
        <div className="flex flex-wrap gap-2 p-4">
          {tags.map((t) => (
            <span key={t.id} className="badge bg-surface2 text-muted">{t.name} <span className="ml-1 opacity-60">{t.articleCount}</span></span>
          ))}
        </div>
        <div className="flex gap-2 p-3">
          <input className="input-field flex-1" placeholder="New tag name" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTag.trim()) { createTag(newTag.trim()); toast.success("Tag created"); setNewTag(""); } }} />
          <button onClick={() => { if (newTag.trim()) { createTag(newTag.trim()); toast.success("Tag created"); setNewTag(""); } }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Topics ({topics.length})</h2></div>
        <div className="divide-y divide-line">
          {topics.map((t) => (
            <div key={t.id} className="px-5 py-2.5">
              <p className="text-sm font-medium text-ink">{t.name}</p>
              <p className="text-xs text-muted">{t.articleCount} articles · /{t.slug}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ======================== SEO ======================== */

function SeoTab() {
  const entries = useMemo(() => getContentEntries(), []);
  const schemaTmpls = useMemo(() => getSchemaTemplates(), []);
  const audits = useMemo(() => entries.map((e) => ({ entry: e, audit: auditSeo(e) })), [entries]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase text-muted">Avg SEO Score</p>
          <p className="font-display text-3xl font-semibold text-ink">{audits.length ? Math.round(audits.reduce((s, a) => s + a.audit.score, 0) / audits.length) : 0}</p>
          <p className="text-xs text-muted">Across {audits.length} entries</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase text-muted">Need Attention</p>
          <p className="font-display text-3xl font-semibold text-ink">{audits.filter((a) => a.audit.score < 70).length}</p>
          <p className="text-xs text-muted">Score below 70</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase text-muted">Schema Templates</p>
          <p className="font-display text-3xl font-semibold text-ink">{schemaTmpls.length}</p>
          <p className="text-xs text-muted">JSON-LD ready</p>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">SEO Audits</h2></div>
        <div className="divide-y divide-line">
          {audits.slice(0, 10).map(({ entry, audit }) => (
            <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
                <p className="text-xs text-muted">Grade {audit.grade} · {audit.suggestions.length} suggestion(s)</p>
              </div>
              <div className="flex gap-1">
                {audit.suggestions.slice(0, 2).map((s, i) => (
                  <span key={i} className="badge bg-warning/15 text-warning">{s.split(":")[0]}</span>
                ))}
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", audit.grade === "A" ? "bg-success/15 text-success" : audit.grade === "B" ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>
                {audit.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Schema Templates</h2></div>
        <div className="flex flex-wrap gap-3 p-4">
          {schemaTmpls.map((s) => (
            <div key={s.id} className="rounded-xl border border-line p-3">
              <p className="text-sm font-medium text-ink">{s.name}</p>
              <p className="text-xs text-muted">{s.category} · {s.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ======================== AI STUDIO ======================== */

function AiStudioTab() {
  const [sourceText, setSourceText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const history = useMemo(() => getAiContentHistory(), []);
  const suggestions = useMemo(() => sourceText ? getAiContentSuggestions(sourceText) : [], [sourceText]);

  const runTask = async (type: AiContentRequest["type"]) => {
    if (!sourceText.trim()) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    const req = runAiContentTask(type, sourceText, {});
    setResult(req.result || "");
    setProcessing(false);
  };

  const QUICK_ACTIONS: { type: AiContentRequest["type"]; label: string; icon: typeof Sparkles }[] = [
    { type: "expand", label: "Expand", icon: Plus },
    { type: "summarize", label: "Summarize", icon: FileText },
    { type: "rewrite", label: "Rewrite", icon: Pencil },
    { type: "seo_optimize", label: "SEO Optimize", icon: Search },
    { type: "grammar", label: "Grammar", icon: CheckCircle2 },
    { type: "readability", label: "Readability", icon: BarChart3 },
    { type: "brand_voice", label: "Brand Voice", icon: Award },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">AI Writer</h2></div>
          <div className="p-4">
            <textarea
              rows={8} className="input-field resize-none"
              placeholder="Paste your content here…"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button key={qa.type} onClick={() => runTask(qa.type)} disabled={processing || !sourceText.trim()} className="btn-ghost btn-sm">
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <qa.icon className="h-3.5 w-3.5" />}
                  {qa.label}
                </button>
              ))}
            </div>
            {suggestions.length > 0 && (
              <div className="mt-4 rounded-lg bg-accent-soft p-3">
                <p className="text-xs font-semibold text-accent">AI Suggestions</p>
                {suggestions.map((s, i) => (
                  <p key={i} className="mt-1 text-xs text-accent/80">💡 {s}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {result && (
          <div className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">Result</h2>
              <button onClick={() => navigator.clipboard.writeText(result)} className="btn-ghost btn-sm"><Copy className="h-3.5 w-3.5" /> Copy</button>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-ink">{result}</pre>
            </div>
          </div>
        )}

        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">History ({history.length})</h2></div>
          <div className="divide-y divide-line">
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="px-5 py-2.5">
                <p className="text-xs font-medium capitalize text-ink">{h.type}</p>
                <p className="truncate text-xs text-muted">{h.sourceText.slice(0, 80)}…</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================== LOCALIZATION ======================== */

function LocalizationTab() {
  const entries = useMemo(() => getContentEntries().filter((e) => e.status === "published"), []);
  const locales = useMemo(() => getAvailableLocales(), []);
  const { toast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState<string>("");
  const [selectedLocale, setSelectedLocale] = useState("es");

  const entry = entries.find((e) => e.id === selectedEntry);
  const localizations = selectedEntry ? getLocalizations(selectedEntry) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Translate Content</h2></div>
        <div className="p-4 space-y-4">
          <div>
            <label className="label-field">Select Entry</label>
            <select className="input-field" value={selectedEntry} onChange={(e) => setSelectedEntry(e.target.value)}>
              <option value="">Choose published entry</option>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>{e.title} ({e.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Target Language</label>
            <select className="input-field" value={selectedLocale} onChange={(e) => setSelectedLocale(e.target.value)}>
              {locales.filter((l) => l.code !== "en").map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label} ({l.code})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (!entry) return toast.error("Select an entry");
              translateEntry(entry, selectedLocale, "AI Translator");
              toast.success(`Translated to ${selectedLocale}`);
            }}
            disabled={!entry}
            className="btn-primary btn-md w-full"
          >
            <Languages className="h-4 w-4" /> AI Translate
          </button>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Localizations {selectedEntry ? `(${localizations.length})` : ""}</h2></div>
        {localizations.length === 0 ? (
          <div className="p-5 text-sm text-muted">{selectedEntry ? "No translations yet." : "Select an entry to see translations."}</div>
        ) : (
          <div className="divide-y divide-line">
            {localizations.map((loc) => {
              const l = locales.find((l) => l.code === loc.locale);
              return (
                <div key={loc.locale} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{l?.flag} {l?.label}</p>
                    <p className="text-xs text-muted">{loc.translatedBy} · {formatDate(loc.translatedAt)}</p>
                  </div>
                  {loc.reviewed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="badge bg-warning/15 text-warning">Unreviewed</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== SEARCH ======================== */

function SearchTab() {
  const entries = useMemo(() => getContentEntries(), []);
  const [query, setQuery] = useState("");
  const results = useMemo(() => query.trim() ? searchContent(entries, query) : [], [query, entries]);
  const trending = useMemo(() => getTrendingContent(entries, 6), [entries]);
  const featured = useMemo(() => getFeaturedContent(entries), [entries]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content by title, excerpt, tags…" className="input-field pl-9" />
      </div>

      {query.trim() && (
        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Results ({results.length})</h2></div>
          {results.length === 0 ? (
            <div className="p-5 text-sm text-muted">No results for "{query}"</div>
          ) : (
            <div className="divide-y divide-line">
              {results.slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{e.title}</p>
                    <p className="truncate text-xs text-muted">{e.excerpt}</p>
                  </div>
                  <span className="badge bg-surface2 capitalize text-muted">{e.type}</span>
                  <span className="badge bg-accent-soft text-accent">{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Trending Content</h2></div>
          <div className="divide-y divide-line">
            {trending.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                <p className="min-w-0 truncate text-sm text-ink">{e.title}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Featured Content</h2></div>
          {featured.length === 0 ? (
            <div className="p-5 text-sm text-muted">No featured content.</div>
          ) : (
            <div className="divide-y divide-line">
              {featured.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Star className="h-4 w-4 text-accent shrink-0" fill="currentColor" />
                  <p className="min-w-0 truncate text-sm text-ink">{e.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================== CALENDAR ======================== */

function CalendarTab() {
  const schedule = useMemo(() => getEditorialCalendar(), []);
  const schedules = useMemo(() => getSchedules(), []);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Editorial Calendar</h2></div>
        {schedule.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">No upcoming schedules.</div>
        ) : (
          <div className="divide-y divide-line">
            {schedule.map((day, i) => (
              <div key={i} className="px-5 py-4">
                <p className="text-xs font-bold uppercase text-muted">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                {day.entries.map((e) => (
                  <div key={e.entryId} className="mt-2 flex items-center gap-3 rounded-lg bg-surface2/50 px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{e.title}</span>
                    <span className="badge bg-surface2 capitalize text-muted">{e.type}</span>
                    <span className={cn("badge", e.status === "published" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{e.status}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Stats</h2></div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total scheduled</span>
            <span className="font-semibold text-ink">{schedules.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Pending</span>
            <span className="font-semibold text-ink">{schedules.filter((s) => s.status === "pending").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Published</span>
            <span className="font-semibold text-ink">{schedules.filter((s) => s.status === "published").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Next up</span>
            <span className="text-sm font-medium text-ink">{schedule[0]?.entries[0]?.title || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================== REPORTS ======================== */

function ReportsTab() {
  const entries = useMemo(() => getContentEntries(), []);
  const [reportType, setReportType] = useState<ContentReport["type"]>("editorial");
  const [report, setReport] = useState<ContentReport | null>(null);

  const generate = () => {
    const from = Date.now() - 90 * 86400000;
    const to = Date.now();
    const r = generateContentReport(entries, from, to, reportType);
    setReport(r);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Generate Report</h2></div>
        <div className="p-4 space-y-4">
          <div>
            <label className="label-field">Report Type</label>
            <div className="flex flex-wrap gap-2">
              {(["editorial", "seo", "author", "publishing", "performance", "ai"] as const).map((t) => (
                <button key={t} onClick={() => setReportType(t)} className={cn("chip capitalize", reportType === t && "chip-active")}>{t}</button>
              ))}
            </div>
          </div>
          <button onClick={generate} className="btn-primary btn-md w-full"><BarChart3 className="h-4 w-4" /> Generate Report</button>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Report {report ? `(${report.type})` : ""}</h2></div>
        {!report ? (
          <div className="p-5 text-sm text-muted">Select a report type and generate.</div>
        ) : (
          <div className="space-y-3 p-5">
            {Object.entries(report.metrics).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="font-semibold text-ink">{typeof val === 'number' ? val.toLocaleString() : String(val)}</span>
              </div>
            ))}
            <p className="mt-4 text-xs text-muted">Generated {formatDate(report.generatedAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== FORECASTS ======================== */

function ForecastsTab() {
  const entries = useMemo(() => getContentEntries(), []);
  const [forecastType, setForecastType] = useState<ContentForecast["type"]>("views");
  const forecast = useMemo(() => generateContentForecast(entries, forecastType), [entries, forecastType]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Forecast Settings</h2></div>
        <div className="p-4 space-y-4">
          <div>
            <label className="label-field">Metric</label>
            <div className="flex flex-wrap gap-2">
              {(["views", "engagement", "output"] as const).map((t) => (
                <button key={t} onClick={() => setForecastType(t)} className={cn("chip capitalize", forecastType === t && "chip-active")}>{t}</button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-accent-soft p-3 text-sm text-accent">
            Confidence: {forecast.confidence}%
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">{forecast.metric} — 6-Month Forecast</h2></div>
        <div className="p-5 space-y-4">
          {forecast.periods.map((p) => (
            <div key={p.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{p.label}</span>
                <span className="text-ink">{p.predicted.toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span>Low: {p.lower.toLocaleString()}</span>
                <div className="h-2 flex-1 rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(10, Math.min(100, ((p.predicted - p.lower) / (p.upper - p.lower)) * 100))}%` }}
                  />
                </div>
                <span>High: {p.upper.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
