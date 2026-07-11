import { useMemo, useState } from "react";
import { Image as ImageIcon, Film, FileText, Search, Layers, Copy, AlertTriangle, Sparkles, Zap, Download, Star, Eye, TrendingUp, HardDrive, CheckCircle2 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { indexAssets, findDuplicates, findUnused, mediaStats, optimizeAsset, genAltText, type IndexableData, type EnterpriseMediaAsset } from "../../lib/media";
import { cn } from "@/utils/cn";

type Filter = "all" | "image" | "video" | "document" | "audio" | "duplicates" | "unused" | "unoptimized";

const TYPE_ICON: Record<string, typeof ImageIcon> = { image: ImageIcon, video: Film, document: FileText, audio: ImageIcon };

export default function AdminMedia() {
  const store = useStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<EnterpriseMediaAsset[]>([]);
  const [selected, setSelected] = useState<EnterpriseMediaAsset | null>(null);

  const storeData = store as unknown as IndexableData;
  const indexed = useMemo(() => indexAssets(storeData), [storeData]);
  const duplicateGroups = useMemo(() => findDuplicates(indexed), [indexed]);
  const unused = useMemo(() => findUnused(indexed, storeData), [indexed, storeData]);
  const stats = useMemo(() => mediaStats(indexed), [indexed]);

  // keep local state synced with indexed on first load
  useMemo(() => { if (assets.length === 0 && indexed.length > 0) setAssets(indexed); }, [indexed, assets.length]);

  const filtered = useMemo(() => {
    let list = assets.length ? assets : indexed;
    if (filter === "duplicates") {
      const dupIds = new Set(duplicateGroups.flatMap((g) => [g.original.id, ...g.duplicates.map((d) => d.id)]));
      list = list.filter((a) => dupIds.has(a.id));
    }
    else if (filter === "unused") list = list.filter((a) => unused.some((u) => u.id === a.id));
    else if (filter === "unoptimized") list = list.filter((a) => !a.optimized);
    else if (filter !== "all") list = list.filter((a) => a.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.refName.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q)));
    }
    return list;
  }, [assets, indexed, filter, query, duplicateGroups, unused]);

  const optimizeOne = (id: string) => {
    setAssets((prev) => {
      const base = prev.length ? prev : indexed;
      return base.map((a) => (a.id === id ? optimizeAsset(a) : a));
    });
    toast.success("Asset optimized", "Compressed + WebP + AVIF generated.");
  };

  const optimizeAll = () => {
    setAssets(indexed.map((a) => (a.optimized ? a : optimizeAsset(a))));
    toast.success("Bulk optimization complete", `${stats.unoptimized} assets processed.`);
  };

  const genAlt = (id: string) => {
    setAssets((prev) => {
      const base = prev.length ? prev : indexed;
      return base.map((a) => (a.id === id ? { ...a, alt: genAltText(a.refName, a.source, 0) } : a));
    });
    toast.success("Alt text generated");
  };

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All assets", count: stats.total },
    { id: "image", label: "Images", count: stats.byType.image },
    { id: "video", label: "Videos", count: stats.byType.video },
    { id: "document", label: "Documents", count: stats.byType.document },
    { id: "unoptimized", label: "Unoptimized", count: stats.unoptimized },
    { id: "duplicates", label: "Duplicates", count: duplicateGroups.length },
    { id: "unused", label: "Unused", count: unused.length },
  ];

  return (
    <>
      <Seo title="Media Library" path="/admin/media" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Media Library (DAM)</h1>
            <p className="mt-1 text-sm text-muted">The single source of truth for every asset.</p>
          </div>
          <button onClick={optimizeAll} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> Optimize all</button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total assets", value: String(stats.total), sub: `${stats.byType.image} images · ${stats.byType.video} videos`, icon: Layers },
            { label: "Storage used", value: `${stats.totalMb} MB`, sub: "Across all assets", icon: HardDrive },
            { label: "Optimized", value: `${stats.optimized}/${stats.total}`, sub: `${stats.unoptimized} pending`, icon: CheckCircle2 },
            { label: "Potential savings", value: `${(stats.potentialSavingsKb / 1024).toFixed(1)} MB`, sub: "Via compression", icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="text-xs text-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, tag, type…" className="input-field pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={cn("chip", filter === f.id && "chip-active")}>
                {f.label} <span className="text-muted">({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Asset grid */}
        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<ImageIcon className="h-6 w-6" />} title="No assets found" /></div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {filtered.slice(0, 60).map((a) => {
              const Icon = TYPE_ICON[a.type];
              return (
                <div key={a.id} className="group card overflow-hidden">
                  <button onClick={() => setSelected(a)} className="relative block aspect-square w-full overflow-hidden bg-surface2">
                    {a.type === "image" ? (
                      <img src={a.url} alt={a.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center text-muted"><Icon className="h-10 w-10" /></div>
                    )}
                    <div className="absolute left-2 top-2 flex gap-1">
                      {a.duplicateOf && <span className="badge bg-warning/90 text-white"><Copy className="h-3 w-3" /></span>}
                      {!a.optimized && <span className="badge bg-danger/90 text-white"><AlertTriangle className="h-3 w-3" /></span>}
                    </div>
                    {a.optimized && <span className="absolute right-2 top-2 badge bg-success/90 text-white"><CheckCircle2 className="h-3 w-3" /></span>}
                  </button>
                  <div className="p-3">
                    <p className="truncate text-xs font-medium text-ink">{a.refName}</p>
                    <p className="text-[0.65rem] text-muted">{a.width}×{a.height} · {a.sizeKb}KB</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="badge bg-surface2 capitalize text-[0.6rem] text-muted">{a.source}</span>
                      {a.qualityScore >= 80 && <Star className="h-3 w-3 text-accent" fill="currentColor" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {filtered.length > 60 && <p className="mt-4 text-center text-xs text-muted">Showing 60 of {filtered.length} assets</p>}
      </div>

      {/* Asset detail drawer */}
      {selected && (
        <AssetDrawer asset={selected} onClose={() => setSelected(null)} onOptimize={optimizeOne} onGenAlt={genAlt} />
      )}
    </>
  );
}

/* --------------------------- Asset Drawer --------------------------- */
function AssetDrawer({ asset, onClose, onOptimize, onGenAlt }: { asset: EnterpriseMediaAsset; onClose: () => void; onOptimize: (id: string) => void; onGenAlt: (id: string) => void }) {
  const Icon = TYPE_ICON[asset.type];
  useEscapeKey(onClose, true);
  useLockBody(true);
  return (
    <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true" aria-label="Asset details">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <aside className="hide-scrollbar relative z-10 h-full w-full max-w-md overflow-y-auto bg-canvas animate-drawer p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Asset details</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><Eye className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl bg-surface2">
          {asset.type === "image" ? (
            <img src={asset.url} alt={asset.alt} className="aspect-video w-full object-cover" />
          ) : (
            <div className="grid aspect-video place-items-center text-muted"><Icon className="h-12 w-12" /></div>
          )}
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <p className="label-field">Title</p>
            <p className="text-sm font-medium text-ink">{asset.refName}</p>
          </div>
          <div>
            <p className="label-field">Alt text</p>
            <p className="text-sm text-muted">{asset.alt}</p>
            <button onClick={() => onGenAlt(asset.id)} className="btn-ghost btn-sm mt-2"><Sparkles className="h-3.5 w-3.5" /> Regenerate alt</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="label-field">Type</p><p className="text-sm capitalize text-ink">{asset.type}</p></div>
            <div><p className="label-field">Source</p><p className="text-sm capitalize text-ink">{asset.source}</p></div>
            <div><p className="label-field">Dimensions</p><p className="text-sm text-ink">{asset.width}×{asset.height}</p></div>
            <div><p className="label-field">File size</p><p className="text-sm text-ink">{asset.sizeKb} KB</p></div>
            <div><p className="label-field">Quality</p><p className="text-sm text-ink">{asset.qualityScore}/100</p></div>
            <div><p className="label-field">Usage</p><p className="text-sm text-ink">{asset.usageCount} reference(s)</p></div>
          </div>
          <div>
            <p className="label-field">Formats</p>
            <div className="flex flex-wrap gap-2">
              <span className={cn("badge", asset.webp ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>WebP {asset.webp ? "✓" : "—"}</span>
              <span className={cn("badge", asset.avif ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>AVIF {asset.avif ? "✓" : "—"}</span>
              <span className={cn("badge", asset.optimized ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>Optimized {asset.optimized ? "✓" : "—"}</span>
            </div>
          </div>
          {asset.duplicateOf && (
            <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Possible duplicate detected
            </div>
          )}
          <div>
            <p className="label-field">Tags</p>
            <div className="flex flex-wrap gap-1">{asset.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted">{t}</span>)}</div>
          </div>
          <div>
            <p className="label-field">URL</p>
            <p className="break-all font-mono text-xs text-muted">{asset.url}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {!asset.optimized && <button onClick={() => onOptimize(asset.id)} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> Optimize</button>}
          <button onClick={() => navigator.clipboard.writeText(asset.url)} className="btn-outline btn-sm"><Download className="h-4 w-4" /> Copy URL</button>
        </div>
      </aside>
    </div>
  );
}
