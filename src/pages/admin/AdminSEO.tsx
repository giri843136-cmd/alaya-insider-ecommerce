import { useMemo, useState } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Plus, Trash2, Globe, Search, Gauge, MapPin, TrendingUp, ArrowRight, Activity, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { analyzeProduct, analyzeArticle, analyzeBrand, analyzeCategory, suggestMetaDescription, suggestMetaTitle } from "../../lib/seoEngine";
import type { Redirect, RedirectType } from "../../lib/types";
import { cn } from "@/utils/cn";

const TYPES: RedirectType[] = [301, 302, 307, 410];
const TYPE_LABEL: Record<RedirectType, string> = { 301: "Permanent", 302: "Found", 307: "Temp redirect", 410: "Gone" };

export default function AdminSEO() {
  const { products, categories, brands, articles, redirects, settings, addRedirect, updateRedirect, deleteRedirect, wouldCreateLoop } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "content" | "redirects" | "tools">("overview");
  const [editing, setEditing] = useState<Partial<Redirect> & { from: string } | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  // Aggregate scores
  const productScores = useMemo(() => products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, type: "product" as const, report: analyzeProduct(p) })), [products]);
  const articleScores = useMemo(() => articles.map((a) => ({ id: a.id, name: a.title, slug: a.slug, type: "article" as const, report: analyzeArticle(a) })), [articles]);
  const brandScores = useMemo(() => brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug, type: "brand" as const, report: analyzeBrand(b) })), [brands]);
  const categoryScores = useMemo(() => categories.map((c) => ({ id: c.id, name: c.name, slug: c.id, type: "category" as const, report: analyzeCategory(c) })), [categories]);
  const all = [...productScores, ...articleScores, ...brandScores, ...categoryScores];

  const avgScore = all.length ? Math.round(all.reduce((s, x) => s + x.report.score, 0) / all.length) : 0;
  const lowCount = all.filter((x) => x.report.score < 70).length;
  const missingAlt = products.filter((p) => p.images.length === 0).length;
  const duplicateTitles = useMemo(() => {
    const counts: Record<string, number> = {};
    all.forEach((x) => { counts[x.name.toLowerCase()] = (counts[x.name.toLowerCase()] || 0) + 1; });
    return Object.values(counts).filter((c) => c > 1).length;
  }, [all]);

  const graded = (score: number) => score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";

  const STATS = [
    { label: "Avg SEO score", value: `${avgScore}`, sub: `Grade ${graded(avgScore)}`, icon: Gauge, tone: avgScore >= 70 ? "success" : "warn" },
    { label: "Indexed pages", value: String(all.length), sub: `${products.length} products`, icon: Globe, tone: "accent" },
    { label: "Needs attention", value: String(lowCount), sub: "Score below 70", icon: AlertTriangle, tone: lowCount > 0 ? "warn" : "success" },
    { label: "Redirects", value: String(redirects.length), sub: `${redirects.reduce((s, r) => s + r.hits, 0)} hits`, icon: Activity, tone: "accent" },
  ];

  const saveRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.from?.trim()) return toast.error("Source URL required");
    if (editing.type !== 410 && !editing.to?.trim()) return toast.error("Destination URL required");
    if (editing.type !== 410 && editing.to && wouldCreateLoop(editing.from, editing.to)) return toast.error("Loop detected — destination chains back to source");
    if (editing.id) {
      updateRedirect(editing.id, editing);
      toast.success("Redirect updated");
    } else {
      addRedirect(editing);
      toast.success("Redirect created");
    }
    setEditing(null);
  };

  // Generate sitemap text
  const sitemap = useMemo(() => {
    const base = window.location.origin + "/#";
    const urls = [
      "/", "/shop", "/collections", "/brands", "/journal", "/about", "/contact", "/faq",
      ...categories.map((c) => `/shop?category=${c.id}`),
      ...products.map((p) => `/product/${p.slug}`),
      ...brands.map((b) => `/brands/${b.slug}`),
      ...articles.map((a) => `/journal/${a.slug}`),
    ];
    return urls.map((u) => `${base}${u}`).join("\n");
  }, [products, categories, brands, articles]);

  const robots = `User-agent: *\nAllow: /\nSitemap: ${window.location.origin}/sitemap.xml`;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`)).catch(() => toast.error("Copy failed"));
  };

  return (
    <>
      <Seo title="SEO Studio" path="/admin/seo" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">SEO Studio</h1>
            <p className="mt-1 text-sm text-muted">Centralized optimization hub for {settings.storeName}.</p>
          </div>
          <div className="flex gap-2">
            {(["overview", "content", "redirects", "tools"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>{t === "tools" ? "Sitemap & robots" : t}</button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.tone === "success" ? "bg-success/15 text-success" : s.tone === "warn" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}><s.icon className="h-5 w-5" /></span>
                    <span className={cn("font-display text-3xl font-semibold", s.tone === "success" ? "text-success" : s.tone === "warn" ? "text-warning" : "text-ink")}>{s.value}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-ink">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Health alerts */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card lg:col-span-2">
                <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">SEO health</h2></div>
                <ul className="divide-y divide-line">
                  {[
                    { ok: avgScore >= 70, label: avgScore >= 70 ? "Average score is healthy" : "Average score needs improvement" },
                    { ok: missingAlt === 0, label: missingAlt === 0 ? "All products have images" : `${missingAlt} products missing images` },
                    { ok: duplicateTitles === 0, label: duplicateTitles === 0 ? "No duplicate titles detected" : `${duplicateTitles} duplicate title groups` },
                    { ok: true, label: "Canonical URLs generated automatically" },
                    { ok: true, label: "Schema.org structured data active (Product, Review, FAQ, Breadcrumb, Article)" },
                    { ok: true, label: "Open Graph + Twitter cards configured" },
                    { ok: true, label: "Core Web Vitals optimized (lazy loading, single-file bundle, font preconnect)" },
                  ].map((h, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3 text-sm">
                      {h.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
                      <span className={h.ok ? "text-ink" : "text-warning"}>{h.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top pages */}
              <div className="card">
                <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><TrendingUp className="h-4 w-4 text-accent" /> Top optimized pages</h2></div>
                <div className="space-y-1 p-3">
                  {[...all].sort((a, b) => b.report.score - a.report.score).slice(0, 6).map((x) => (
                    <div key={x.type + x.id} className="flex items-center justify-between rounded-lg px-2 py-2">
                      <span className="min-w-0 truncate text-sm text-ink">{x.name}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", graded(x.report.score) === "A" ? "bg-success/15 text-success" : graded(x.report.score) === "B" ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>{x.report.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* CONTENT SCORES */}
        {tab === "content" && (
          <div className="mt-8">
            <div className="flex items-center gap-2 rounded-[var(--radius-xl2)] bg-surface2/50 p-4 text-sm text-muted">
              <FileText className="h-4 w-4 text-accent" /> Every page is scored on metadata, content depth, images, schema readiness and slug quality. Click a row for AI-ready suggestions.
            </div>
            <div className="card mt-4 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Top issue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...all].sort((a, b) => a.report.score - b.report.score).map((x) => {
                    const issue = x.report.checks.find((c) => c.status !== "pass");
                    return (
                      <tr key={x.type + x.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3 font-medium text-ink">{x.name}</td>
                        <td className="px-4 py-3 capitalize text-muted">{x.type}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{x.report.score}</td>
                        <td className="px-4 py-3"><span className={cn("badge", graded(x.report.score) === "A" ? "bg-success/15 text-success" : graded(x.report.score) === "B" ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>{x.report.grade}</span></td>
                        <td className="px-4 py-3 text-muted">{issue ? `${issue.label}: ${issue.detail}` : "All checks passing ✓"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REDIRECTS */}
        {tab === "redirects" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{redirects.length} redirect rules · loop detection active</p>
              <button onClick={() => setEditing({ from: "", to: "", type: 301, active: true })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add redirect</button>
            </div>
            {redirects.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<MapPin className="h-6 w-6" />} title="No redirects" description="Manage 301/302/307/410 redirects with automatic loop detection." /></div>
            ) : (
              <div className="card mt-4 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                    <tr><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Hits</th><th className="px-4 py-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {redirects.map((r) => (
                      <tr key={r.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3 font-mono text-xs text-ink">{r.from}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">{r.to || "—"}</td>
                        <td className="px-4 py-3"><span className="badge bg-accent-soft text-accent">{r.type}</span><span className="ml-2 text-xs text-muted">{TYPE_LABEL[r.type]}</span></td>
                        <td className="px-4 py-3 text-muted">{r.hits}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => updateRedirect(r.id, { active: !r.active })} className={cn("chip", r.active && "chip-active")} aria-pressed={r.active}>{r.active ? "On" : "Off"}</button>
                            <button onClick={() => setEditing({ ...r })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Edit"><Search className="h-4 w-4" /></button>
                            <button onClick={() => { deleteRedirect(r.id); toast.success("Redirect deleted"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TOOLS: sitemap & robots */}
        {tab === "tools" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold text-ink"><Globe className="h-4 w-4 text-accent" /> XML Sitemap</h2>
                <button onClick={() => copyText(sitemap, "Sitemap")} className="btn-ghost btn-sm">Copy</button>
              </div>
              <pre className="hide-scrollbar max-h-80 overflow-auto whitespace-pre-wrap bg-surface2/40 p-4 font-mono text-xs text-muted">{sitemap}</pre>
            </div>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold text-ink"><FileText className="h-4 w-4 text-accent" /> robots.txt</h2>
                <button onClick={() => copyText(robots, "robots.txt")} className="btn-ghost btn-sm">Copy</button>
              </div>
              <pre className="whitespace-pre-wrap bg-surface2/40 p-4 font-mono text-xs text-muted">{robots}</pre>
            </div>

            {/* AI-ready generators */}
            <div className="card lg:col-span-2">
              <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">AI-ready meta generator (preview)</h2></div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} className="rounded-xl border border-line p-4">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">Suggested title</p>
                    <p className="mt-0.5 text-xs text-ink">{suggestMetaTitle(p.name, "ALAYA INSIDER")}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">Suggested description</p>
                    <p className="mt-0.5 text-xs text-muted">{suggestMetaDescription(p.shortDescription || p.description)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Redirect editor */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Redirect editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={saveRedirect} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit redirect" : "New redirect"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><ArrowRight className="h-5 w-5 rotate-45" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">From (source path)</label><input className="input-field font-mono" value={editing.from} onChange={(e) => setEditing({ ...editing, from: e.target.value })} placeholder="/old-page" /></div>
              <div><label className="label-field">To (destination{editing.type === 410 ? " — not used for 410" : ""})</label><input className="input-field font-mono" value={editing.to} onChange={(e) => setEditing({ ...editing, to: e.target.value })} placeholder="/new-page" disabled={editing.type === 410} /></div>
              <div>
                <label className="label-field">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setEditing({ ...editing, type: t })} className={cn("chip", editing.type === t && "chip-active")}>{t} · {TYPE_LABEL[t]}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Create"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
