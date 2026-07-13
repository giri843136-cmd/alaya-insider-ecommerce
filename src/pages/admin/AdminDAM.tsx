/**
 * ALAYA INSIDER — Enterprise Digital Asset Management (DAM) Suite
 * -----------------------------------------------------------------------
 * The single admin interface for every media asset in the platform.
 * Features full enterprise capabilities: asset grid, detail panel,
 * folders, duplicates, unused, safe delete, versions, CDN, AI metadata,
 * usage tracking, bulk optimization, and audit logs.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon, Search, Layers, Copy, AlertTriangle, Zap,
  Star, TrendingUp, HardDrive, CheckCircle2, Grid, List,
  FolderOpen, Upload, Shield, Activity, Trash2, X, RefreshCw,
  Link2, Info, RotateCcw, FileDigit, ChevronDown, Ban,
  Sparkles, Share2, Edit, Download,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useDam } from "../../lib/damContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { DAM_FOLDERS, type EnterpriseMediaAsset, type DamFilter, type FolderName } from "../../lib/media";
import { cn } from "@/utils/cn";

/* ================================================================== */
/*  TYPES                                                               */
/* ================================================================== */

type AdminTab = "overview" | "library" | "folders" | "duplicates" | "unused" | "upload" | "audit";

/* ================================================================== */
/*  MAIN EXPORT                                                         */
/* ================================================================== */

export default function AdminDAM() {
  const store = useStore();
  const dam = useDam();
  // Index data on mount
  const storeData = store as unknown as Parameters<typeof dam.indexData>[0];
  const [indexed, setIndexed] = useState(false);
  useMemo(() => {
    if (!indexed && storeData) {
      dam.indexData(storeData);
      setIndexed(true);
    }
  }, [storeData, indexed, dam]);

  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedAsset, setSelectedAsset] = useState<EnterpriseMediaAsset | null>(null);

  return (
    <>
      <Seo title="DAM Suite" path="/admin/dam" />
      <div className="p-5 pb-28 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Digital Asset Management</h1>
            <p className="mt-1 text-sm text-muted">
              {dam.stats.total} assets · {dam.stats.totalMb} MB · {dam.stats.optimized} optimized · {dam.assetsNeedingOptimization} pending
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => dam.optimizeAll()}
              disabled={dam.assetsNeedingOptimization === 0}
              className="btn-primary btn-sm"
            >
              <Zap className="h-4 w-4" /> Optimize all
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {([
            ["overview", "Overview", Layers],
            ["library", "Library", ImageIcon],
            ["folders", "Folders", FolderOpen],
            ["duplicates", "Duplicates", Copy],
            ["unused", "Unused", Ban],
            ["upload", "Upload", Upload],
            ["audit", "Audit", Shield],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn("chip", tab === id && "chip-active")}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
              {id === "duplicates" && dam.stats.duplicateCount > 0 && (
                <span className="ml-1 rounded-full bg-warning/20 px-1.5 text-[10px] text-warning">{dam.stats.duplicateCount}</span>
              )}
              {id === "unused" && dam.stats.unusedCount > 0 && (
                <span className="ml-1 rounded-full bg-danger/20 px-1.5 text-[10px] text-danger">{dam.stats.unusedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab />}
        {tab === "library" && (
          <LibraryTab onSelectAsset={(a) => setSelectedAsset(a)} />
        )}
        {tab === "folders" && <FoldersTab onSelectAsset={(a) => setSelectedAsset(a)} />}
        {tab === "duplicates" && <DuplicatesTab onSelectAsset={(a) => setSelectedAsset(a)} />}
        {tab === "unused" && <UnusedTab onSelectAsset={(a) => setSelectedAsset(a)} />}
        {tab === "upload" && <UploadTab />}
        {tab === "audit" && <AuditTab />}
      </div>

      {/* Asset Detail Panel */}
      {selectedAsset && (
        <DamAssetPanel
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
}

/* ================================================================== */
/*  OVERVIEW TAB                                                        */
/* ================================================================== */

function OverviewTab() {
  const dam = useDam();
  const { settings } = useStore();

  const statCards = [
    {
      label: "Total assets",
      value: String(dam.stats.total),
      sub: `${dam.stats.byType.image || 0} images · ${dam.stats.byType.video || 0} videos · ${dam.stats.byType.document || 0} docs`,
      icon: Layers,
      color: "accent",
    },
    {
      label: "Storage used",
      value: `${dam.stats.totalMb} MB`,
      sub: `${(Number(dam.stats.totalMb) * 1024).toFixed(0)} KB total`,
      icon: HardDrive,
      color: "accent",
    },
    {
      label: "Optimized",
      value: `${dam.stats.optimized}/${dam.stats.total}`,
      sub: `${dam.stats.unoptimized} pending optimization`,
      icon: CheckCircle2,
      color: dam.stats.unoptimized > 0 ? "warn" : "success",
    },
    {
      label: "Potential savings",
      value: `${(dam.stats.potentialSavingsKb / 1024).toFixed(1)} MB`,
      sub: "Via compression + WebP/AVIF",
      icon: TrendingUp,
      color: "accent",
    },
    {
      label: "Versions tracked",
      value: String(dam.stats.totalVersions),
      sub: `${dam.stats.total} primary versions`,
      icon: RefreshCw,
      color: "accent",
    },
    {
      label: "Duplicates",
      value: String(dam.stats.duplicateCount),
      sub: `${dam.stats.duplicateCount} duplicate groups`,
      icon: Copy,
      color: dam.stats.duplicateCount > 0 ? "warn" : "success",
    },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5">
            <span className={cn(
              "grid h-10 w-10 place-items-center rounded-full",
              s.color === "success" ? "bg-success/15 text-success" :
              s.color === "warn" ? "bg-warning/15 text-warning" :
              "bg-accent-soft text-accent",
            )}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* By folder */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink">
          <FolderOpen className="h-4 w-4 text-accent" /> Assets by folder
        </h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DAM_FOLDERS.map((f) => {
            const count = dam.stats.byFolder[f.name] || 0;
            if (count === 0) return null;
            return (
              <div key={f.name} className="flex items-center justify-between rounded-lg bg-surface2/50 px-3 py-2.5">
                <span className="text-sm text-ink">{f.name}</span>
                <span className="text-sm font-semibold text-accent">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top sources */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink">
          <Activity className="h-4 w-4 text-accent" /> Top media sources
        </h3>
        <div className="mt-4 space-y-2">
          {dam.stats.topSources.map((s) => (
            <div key={s.source} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm capitalize text-ink">
                <ImageIcon className="h-3.5 w-3.5 text-muted" />
                {s.source}
              </span>
              <span className="text-sm text-muted">{s.count} assets</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health status */}
      <div className="rounded-2xl border border-line p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink">
          <Shield className="h-4 w-4 text-accent" /> DAM health
        </h3>
        <div className="mt-4 space-y-2">
          {[
            { ok: dam.stats.duplicateCount === 0, label: dam.stats.duplicateCount === 0 ? "No duplicate assets" : `${dam.stats.duplicateCount} duplicate(s) detected` },
            { ok: dam.stats.unoptimized === 0, label: dam.stats.unoptimized === 0 ? "All assets optimized" : `${dam.stats.unoptimized} asset(s) pending optimization` },
            { ok: true, label: `${dam.stats.cdnSynced}/${dam.stats.total} assets CDN-synced` },
            { ok: true, label: `${dam.stats.totalVersions} total versions tracked across all assets` },
            { ok: dam.stats.favoritedCount > 0, label: `${dam.stats.favoritedCount} favorited asset(s)` },
          ].map((h, i) => (
            <p key={i} className="flex items-center gap-2 text-sm">
              {h.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
              <span className={h.ok ? "text-ink" : "text-warning"}>{h.label}</span>
            </p>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted">
        Enterprise DAM v1.0 · {settings.storeName} · Last indexed: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

/* ================================================================== */
/*  LIBRARY TAB                                                         */
/* ================================================================== */

function LibraryTab({ onSelectAsset }: { onSelectAsset: (a: EnterpriseMediaAsset) => void }) {
  const dam = useDam();
  const { toast } = useToast();

  const FILTERS: { id: DamFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: dam.stats.total },
    { id: "images", label: "Images", count: dam.stats.byType.image || 0 },
    { id: "video", label: "Video", count: dam.stats.byType.video || 0 },
    { id: "document", label: "Documents", count: dam.stats.byType.document || 0 },
    { id: "audio", label: "Audio", count: dam.stats.byType.audio || 0 },
    { id: "unoptimized", label: "Unoptimized", count: dam.stats.unoptimized },
    { id: "favorites", label: "Favorites", count: dam.stats.favoritedCount },
  ];

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-md lg:max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={dam.searchQuery}
            onChange={(e) => dam.setSearch(e.target.value)}
            placeholder="Search by name, tag, color, type…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => dam.setFilter(f.id)}
              className={cn("chip text-xs", dam.currentFilter === f.id && "chip-active")}
            >
              {f.label} <span className="text-muted">({f.count})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => dam.setViewMode("grid")}
            className={cn("grid h-8 w-8 place-items-center rounded-lg", dam.viewMode === "grid" ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2")}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => dam.setViewMode("list")}
            className={cn("grid h-8 w-8 place-items-center rounded-lg", dam.viewMode === "list" ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Asset display */}
      <div className="mt-4">
        {dam.filteredAssets.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<ImageIcon className="h-6 w-6" />} title="No assets found" description="Try a different filter or upload new assets." />
          </div>
        ) : dam.viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {dam.filteredAssets.slice(0, 80).map((asset) => (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="group card overflow-hidden text-left transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-surface2">
                  <img
                    src={asset.url}
                    alt={asset.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {asset.isDuplicate && (
                      <span className="badge bg-warning/90 text-[10px] text-white"><Copy className="h-3 w-3" /></span>
                    )}
                    {!asset.optimized && (
                      <span className="badge bg-danger/90 text-[10px] text-white"><AlertTriangle className="h-3 w-3" /></span>
                    )}
                  </div>
                  {asset.optimized && (
                    <span className="absolute right-2 top-2 badge bg-success/90 text-[10px] text-white"><CheckCircle2 className="h-3 w-3" /></span>
                  )}
                </div>
                <div className="min-w-0 p-3">
                  <p className="truncate text-xs font-medium text-ink">{asset.refName}</p>
                  <p className="truncate text-[10px] text-muted">{asset.width}×{asset.height} · {asset.sizeKb}KB</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 overflow-hidden">
                    <span className="shrink-0 badge bg-surface2 text-[9px] capitalize text-muted">{asset.source}</span>
                    {asset.qualityScore >= 80 && <Star className="h-3 w-3 shrink-0 text-accent" fill="currentColor" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dimensions</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Folder</th>
                    <th className="px-4 py-3">Uses</th>
                    <th className="px-4 py-3">Quality</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {dam.filteredAssets.slice(0, 80).map((a) => (
                    <tr key={a.id} className="hover:bg-surface2/40 cursor-pointer" onClick={() => onSelectAsset(a)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={a.url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{a.refName}</p>
                            <p className="truncate text-xs text-muted">{a.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-surface2 capitalize text-muted">{a.type}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{a.width}×{a.height}</td>
                      <td className="px-4 py-3 text-muted">{a.sizeKb} KB</td>
                      <td className="px-4 py-3"><span className="capialize text-xs text-muted">{a.folder}</span></td>
                      <td className="px-4 py-3 text-muted">{a.usageCount}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          a.qualityScore >= 80 ? "bg-success/15 text-success" :
                          a.qualityScore >= 50 ? "bg-accent-soft text-accent" :
                          "bg-warning/15 text-warning",
                        )}>{a.qualityScore}</span>
                      </td>
                      <td className="px-4 py-3">
                        {a.optimized ? (
                          <span className="badge bg-success/15 text-success text-xs">Optimized</span>
                        ) : (
                          <span className="badge bg-warning/15 text-warning text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); dam.optimizeSingle(a.id); toast.success("Optimized", `${a.refName} compressed + WebP/AVIF`); }}
                          disabled={a.optimized}
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2 disabled:opacity-30"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FOLDERS TAB                                                         */
/* ================================================================== */

function FoldersTab({ onSelectAsset }: { onSelectAsset: (a: EnterpriseMediaAsset) => void }) {
  const dam = useDam();
  const [activeFolder, setActiveFolder] = useState<FolderName | null>(null);

  if (activeFolder) {
    const folderAssets = dam.assets.filter((a) => a.folder === activeFolder);
    return (
      <div className="mt-6">
        <button
          onClick={() => setActiveFolder(null)}
          className="mb-4 flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-90" /> All folders
        </button>
        <h2 className="font-semibold text-ink">{activeFolder}</h2>
        <p className="mb-4 text-xs text-muted">{folderAssets.length} assets</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {folderAssets.slice(0, 80).map((asset) => (
            <button
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              className="group card overflow-hidden text-left"
            >
              <div className="relative aspect-square bg-surface2">
                <img src={asset.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="min-w-0 p-3">
                <p className="truncate text-xs font-medium text-ink">{asset.refName}</p>
                <p className="truncate text-[10px] text-muted">{asset.width}×{asset.height}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DAM_FOLDERS.map((f) => {
          const count = dam.stats.byFolder[f.name] || 0;
          return (
            <button
              key={f.name}
              onClick={() => setActiveFolder(f.name)}
              className="card flex items-center gap-4 p-5 text-left transition-all hover:border-accent/50"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                <FolderOpen className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate font-semibold text-ink">{f.name}</p>
                <p className="truncate text-xs text-muted">{f.description}</p>
                <p className="mt-1 truncate text-xs font-medium text-accent">{count} asset(s)</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DUPLICATES TAB                                                      */
/* ================================================================== */

function DuplicatesTab({ onSelectAsset }: { onSelectAsset: (a: EnterpriseMediaAsset) => void }) {
  const dam = useDam();

  if (dam.duplicates.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState icon={<Copy className="h-6 w-6" />} title="No duplicates found" description="All assets are unique." />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {dam.duplicates.map((group, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="border-b border-line bg-warning/5 px-5 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              {group.type.charAt(0).toUpperCase() + group.type.slice(1)} duplicate ({group.confidence}% confidence)
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr]">
            {/* Original */}
            <div className="flex flex-col items-center">
              <img src={group.original.url} alt="" className="aspect-square h-32 rounded-xl object-cover sm:h-40" />
              <p className="mt-2 text-xs font-medium text-ink">{group.original.refName}</p>
              <p className="text-[10px] text-muted">{group.original.width}×{group.original.height} · {group.original.sizeKb}KB</p>
              <span className="badge bg-success/15 text-success mt-1 text-[10px]">Original</span>
            </div>

            <div className="flex items-center justify-center">
              <Copy className="h-6 w-6 text-warning" />
            </div>

            {/* Duplicates */}
            <div className="flex flex-wrap gap-3">
              {group.duplicates.map((dup) => (
                <button key={dup.id} onClick={() => onSelectAsset(dup)} className="flex flex-col items-center text-left">
                  <img src={dup.url} alt="" className="aspect-square h-32 rounded-xl object-cover sm:h-40" />
                  <p className="mt-2 text-xs font-medium text-ink">{dup.refName}</p>
                  <p className="text-[10px] text-muted">{dup.width}×{dup.height} · {dup.sizeKb}KB</p>
                  <span className="badge bg-warning/15 text-warning mt-1 text-[10px]">Duplicate</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  UNUSED TAB                                                          */
/* ================================================================== */

function UnusedTab({ onSelectAsset }: { onSelectAsset: (a: EnterpriseMediaAsset) => void }) {
  const dam = useDam();

  if (dam.unused.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState icon={<Ban className="h-6 w-6" />} title="All assets in use" description="No unused assets to clean up." />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="mb-4 flex items-center gap-2 text-sm text-warning">
        <AlertTriangle className="h-4 w-4" />
        {dam.unused.length} unused asset(s) — available for cleanup
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {dam.unused.slice(0, 40).map((asset) => (
          <button
            key={asset.id}
            onClick={() => onSelectAsset(asset)}
            className="group card overflow-hidden text-left"
          >
            <div className="relative aspect-square bg-surface2">
              <img src={asset.url} alt="" loading="lazy" className="h-full w-full object-cover opacity-70 transition-all group-hover:opacity-100" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="badge bg-surface/80 text-muted text-[10px]"><Ban className="h-3 w-3" /> Unused</span>
              </div>
            </div>              <div className="min-w-0 p-3">
                <p className="truncate text-xs font-medium text-ink">{asset.refName}</p>
                <p className="truncate text-[10px] text-muted">{asset.width}×{asset.height} · {asset.sizeKb}KB</p>
              </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  UPLOAD TAB                                                          */
/* ================================================================== */

function UploadTab() {
  const dam = useDam();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<EnterpriseMediaAsset[]>([]);

  const handleUpload = () => {
    if (!url.trim()) return;
    const asset = dam.uploadAsset({
      url: url.trim(),
      filename: url.split("/").pop() || "upload.jpg",
      source: "upload",
    });
    setResults((prev) => [asset, ...prev]);
    setUrl("");
    toast.success("Uploaded", "Asset added to DAM library");
  };

  return (
    <div className="mt-6">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2">
          <input
            className="input-field flex-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an image URL and press Import…"
            onKeyDown={(e) => e.key === "Enter" && handleUpload()}
          />
          <button onClick={handleUpload} disabled={!url.trim()} className="btn-primary btn-sm">
            <Upload className="h-4 w-4" /> Import
          </button>
        </div>
        <p className="text-xs text-muted">
          URL import simulates adding remote assets to the DAM. Drag-and-drop and clipboard paste are available in the Global Media Picker.
        </p>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink">Recently imported ({results.length})</p>
            {results.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <img src={a.url} alt="" className="h-12 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{a.filename}</p>
                  <p className="text-xs text-muted">{a.width}×{a.height} · {a.fileExtension.toUpperCase()} · {(a.sizeKb / 1024).toFixed(1)}MB</p>
                </div>
                <span className={cn("badge text-xs", a.optimized ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                  {a.optimized ? "Optimized" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AUDIT TAB                                                           */
/* ================================================================== */

function AuditTab() {
  const dam = useDam();
  const allLogs = useMemo(
    () => dam.assets.flatMap((a) => a.auditLog.map((log) => ({ ...log, assetName: a.refName, assetId: a.id }))),
    [dam.assets],
  );
  const sorted = useMemo(
    () => [...allLogs].sort((a, b) => b.ts - a.ts).slice(0, 100),
    [allLogs],
  );

  const ACTION_ICONS: Record<string, typeof Upload> = {
    upload: Upload, optimize: Zap, delete: Trash2, restore: RefreshCw,
    move: FolderOpen, rename: Edit, download: Download, share: Share2,
    favorite: Star, version_restore: RefreshCw, ai_generate: Sparkles,
  };

  if (sorted.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState icon={<Shield className="h-6 w-6" />} title="No audit entries" />
      </div>
    );
  }

  return (
    <div className="mt-6 card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Shield className="h-4 w-4 text-accent" /> Media audit trail · Last 100 events
        </p>
      </div>
      <div className="divide-y divide-line">
        {sorted.map((entry, i) => {
          const Icon = ACTION_ICONS[entry.action] || Activity;
          return (
            <div key={`${entry.assetId}-${i}`} className="flex items-start gap-3 px-5 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface2">
                <Icon className="h-4 w-4 text-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <span className="font-medium capitalize">{entry.action.replace("_", " ")}</span>
                  {entry.detail && <span className="text-muted"> — {entry.detail}</span>}
                </p>
                <p className="text-xs text-muted">
                  {entry.user} ({entry.role}) · {new Date(entry.ts).toLocaleString()} · {entry.device}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted">{entry.ip}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ASSET DETAIL PANEL                                                  */
/* ================================================================== */

function DamAssetPanel({ asset, onClose }: { asset: EnterpriseMediaAsset; onClose: () => void }) {
  const dam = useDam();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"info" | "usage" | "versions" | "ai" | "audit" | "delete">("info");

  // Lock body scroll when panel is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPad;
    };
  }, []);

  // Escape key closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const deleteCheck = dam.checkDelete(asset.id);

  const handleOptimize = () => {
    dam.optimizeSingle(asset.id);
    toast.success("Optimized", "Asset compressed + WebP/AVIF generated");
  };

  const handleFavoriteToggle = () => {
    dam.toggleFavorite(asset.id);
    toast.success(asset.favorited ? "Removed from favorites" : "Added to favorites");
  };

  const handleRestoreVersion = (versionId: string) => {
    dam.restoreAssetVersion(asset.id, versionId);
    toast.success("Version restored");
  };

  const handleSafeDelete = () => {
    if (deleteCheck.safe) {
      const ok = dam.deleteAsset(asset.id);
      if (ok) {
        toast.success("Asset deleted");
        onClose();
      }
    }
  };

  const SECTIONS: { id: typeof activeSection; label: string; icon: typeof Info }[] = [
    { id: "info", label: "Info", icon: Info },
    { id: "usage", label: "Usage", icon: Link2 },
    { id: "versions", label: "Versions", icon: RefreshCw },
    { id: "ai", label: "AI Metadata", icon: Sparkles },
    { id: "audit", label: "Audit", icon: Shield },
    { id: "delete", label: "Delete", icon: Trash2 },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true" aria-label={`Asset: ${asset.refName}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <aside className="hide-scrollbar relative z-10 h-full w-full max-w-lg overflow-y-auto bg-canvas animate-drawer p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Asset details</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>

        {/* Preview */}
        <div className="mt-4 overflow-hidden rounded-xl bg-surface2">
          <img src={asset.url} alt={asset.alt} className="aspect-video w-full object-cover" />
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!asset.optimized && (
            <button onClick={handleOptimize} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> Optimize</button>
          )}
          <button onClick={handleFavoriteToggle} className={cn("btn-outline btn-sm", asset.favorited && "border-amber-400 text-amber-500")}>
            <Star className="h-4 w-4" fill={asset.favorited ? "currentColor" : "none"} /> {asset.favorited ? "Favorited" : "Favorite"}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(asset.url); toast.success("URL copied"); }} className="btn-outline btn-sm">
            <Link2 className="h-4 w-4" /> Copy URL
          </button>
          <button onClick={() => { navigator.clipboard.writeText(asset.alt); toast.success("Alt text copied"); }} className="btn-ghost btn-sm">
            <FileDigit className="h-4 w-4" /> Alt
          </button>
        </div>

        {/* Section tabs */}
        <div className="mt-5 flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn("chip text-xs", activeSection === s.id && "chip-active")}
            >
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </button>
          ))}
        </div>

        {/* INFO SECTION */}
        {activeSection === "info" && (
          <div className="mt-4 space-y-4">
            <InfoRow label="Filename" value={asset.filename} />
            <InfoRow label="Type" value={<span className="capitalize">{asset.type} · {asset.fileExtension.toUpperCase()}</span>} />
            <InfoRow label="Source" value={<span className="capitalize">{asset.source}</span>} />
            <InfoRow label="Dimensions" value={`${asset.width} × ${asset.height}`} />
            <InfoRow label="Aspect ratio" value={asset.aspectRatio.toFixed(2)} />
            <InfoRow label="Orientation" value={<span className="capitalize">{asset.orientation}</span>} />
            <InfoRow label="File size" value={`${asset.sizeKb} KB (${(asset.sizeKb / 1024).toFixed(2)} MB)`} />
            <InfoRow label="Color space" value={asset.colorSpace} />
            <InfoRow label="Dominant color">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: asset.dominantColor }} />
                <span className="text-sm text-ink">{asset.dominantColor}</span>
              </div>
            </InfoRow>
            <InfoRow label="Folder" value={asset.folder} />
            <InfoRow label="Collection" value={asset.collection} />
            <InfoRow label="Uploaded by" value={asset.uploader} />
            <InfoRow label="Upload date" value={new Date(asset.uploadDate).toLocaleString()} />
            <InfoRow label="Compression" value={`${(asset.compressionRatio * 100).toFixed(0)}% saved`} />
            <InfoRow label="CDN" value={asset.cdnSynced ? "Synced" : "Pending"} />
            <InfoRow label="CDN provider" value={<span className="capitalize">{asset.cdnProvider.replace("_", " ")}</span>} />
            <InfoRow label="SHA-256" value={<code className="break-all font-mono text-[10px] text-muted">{asset.hash}</code>} />
            <InfoRow label="License" value={asset.license} />
            <InfoRow label="Copyright" value={asset.copyright} />
            <InfoRow label="Quality score">
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full", asset.qualityScore >= 80 ? "bg-success" : asset.qualityScore >= 50 ? "bg-accent" : "bg-warning")} style={{ width: `${asset.qualityScore}%` }} />
                </div>
                <span className={cn("text-sm font-semibold", asset.qualityScore >= 80 ? "text-success" : "text-warning")}>{asset.qualityScore}/100</span>
              </div>
            </InfoRow>
          </div>
        )}

        {/* USAGE SECTION */}
        {activeSection === "usage" && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <UsageStat label="Total uses" value={String(asset.usageCount)} />
              <UsageStat label="Products" value={String(asset.productsUsing)} />
              <UsageStat label="Articles" value={String(asset.articlesUsing)} />
              <UsageStat label="Brands" value={String(asset.brandsUsing)} />
              <UsageStat label="Categories" value={String(asset.categoriesUsing)} />
              <UsageStat label="Pages" value={String(asset.pagesUsing)} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Where used</p>
            {asset.usages.length === 0 ? (
              <p className="text-sm text-muted">Not currently used anywhere.</p>
            ) : (
              <div className="space-y-2">
                {asset.usages.map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-line p-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{u.refName}</p>
                      <p className="text-xs text-muted">{u.source} · {u.field}</p>
                    </div>
                    <span className="badge bg-surface2 capitalize text-xs text-muted">{u.source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VERSIONS SECTION */}
        {activeSection === "versions" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{asset.versions.length} version(s)</p>
            {asset.versions.map((v) => (
              <div key={v.id} className={cn(
                "flex items-center justify-between rounded-xl border p-3",
                v.label === asset.currentVersion ? "border-accent bg-accent-soft/20" : "border-line",
              )}>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    {v.label}
                    {v.label === asset.currentVersion && <span className="badge bg-accent text-accent-ink text-[10px]">Current</span>}
                  </p>
                  <p className="text-xs text-muted">{v.width}×{v.height} · {v.sizeKb}KB · {v.format}</p>
                  <p className="text-[10px] text-muted">{new Date(v.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  {v.label !== asset.currentVersion && (
                    <button onClick={() => handleRestoreVersion(v.id)} className="btn-ghost btn-sm">
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI METADATA SECTION */}
        {activeSection === "ai" && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="label-field">AI Tags</p>
              <div className="flex flex-wrap gap-1">
                {asset.aiTags.map((t) => (
                  <span key={t} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="label-field">AI Caption</p>
              <p className="text-sm text-ink">{asset.aiCaption}</p>
            </div>
            <div>
              <p className="label-field">AI Alt Text</p>
              <p className="text-sm text-ink">{asset.aiAltText}</p>
              <button onClick={() => { navigator.clipboard.writeText(asset.aiAltText); toast.success("Alt text copied"); }} className="btn-ghost btn-sm mt-1">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <div>
              <p className="label-field">AI Description</p>
              <p className="text-sm text-muted">{asset.aiDescription}</p>
            </div>
            <div>
              <p className="label-field">SEO Title</p>
              <p className="text-sm text-ink">{asset.seoMetadata.title}</p>
            </div>
            <div>
              <p className="label-field">SEO Description</p>
              <p className="text-sm text-muted">{asset.seoMetadata.description}</p>
            </div>
            <div>
              <p className="label-field">SEO Keywords</p>
              <p className="text-sm text-muted">{asset.seoMetadata.keywords}</p>
            </div>
          </div>
        )}

        {/* AUDIT SECTION */}
        {activeSection === "audit" && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{asset.auditLog.length} event(s)</p>
            {asset.auditLog.map((entry, i) => (
              <div key={i} className="rounded-lg border border-line p-3">
                <p className="flex items-center gap-2 text-sm text-ink">
                  <span className="font-medium capitalize">{entry.action.replace("_", " ")}</span>
                  {entry.detail && <span className="text-muted">— {entry.detail}</span>}
                </p>
                <p className="text-[10px] text-muted">
                  {entry.user} · {entry.role} · {new Date(entry.ts).toLocaleString()} · {entry.device}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* DELETE SECTION */}
        {activeSection === "delete" && (
          <div className="mt-4 space-y-4">
            <div className={cn(
              "rounded-xl border p-4",
              deleteCheck.safe ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5",
            )}>
              {deleteCheck.safe ? (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> {deleteCheck.message}
                </p>
              ) : (
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-danger">
                    <AlertTriangle className="h-4 w-4" /> Asset is in use
                  </p>
                  <p className="mt-1 text-xs text-muted">This asset is referenced in {deleteCheck.usageCount} location(s):</p>
                  <div className="mt-2 space-y-1">
                    {deleteCheck.usages.slice(0, 5).map((u, i) => (
                      <p key={i} className="text-xs text-ink">{u.source}: {u.refName} ({u.field})</p>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Replace the asset references before deleting, or use "Replace Asset Everywhere" to swap it out platform-wide.
                  </p>
                </div>
              )}
            </div>

            {deleteCheck.safe && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-danger">
                  <AlertTriangle className="h-4 w-4" /> This action is permanent
                </p>
                <p className="mt-1 text-xs text-muted">Deleting <strong>{asset.refName}</strong> will remove it and all its versions from the DAM.</p>
                <button onClick={handleSafeDelete} className="btn btn-md mt-3 border border-danger/40 bg-danger text-white hover:brightness-110">
                  <Trash2 className="h-4 w-4" /> Permanently delete
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

/* ================================================================== */
/*  HELPER COMPONENTS                                                   */
/* ================================================================== */

function InfoRow({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-line/50 pb-2">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="ml-4 text-right text-sm text-ink">{children || value}</div>
    </div>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface2/50 p-3 text-center">
      <p className="text-lg font-semibold text-accent">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
