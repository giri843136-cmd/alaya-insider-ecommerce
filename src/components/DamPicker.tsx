/**
 * ALAYA INSIDER — Global Media Picker (Enterprise DAM)
 * -----------------------------------------------------------------------
 * The single media selection interface for the entire platform.
 * Every image/upload field opens this picker instead of the OS file browser.
 *
 * Features:
 * - Tabs: Media Library, Upload, Recent, Favorites, Folders
 * - Drag-and-drop, paste, browse, multi-upload
 * - Search: by filename, tag, description, color, dimensions, folder
 * - Folder-based organization
 * - Duplicate detection during upload
 * - Asset selection with callback pattern
 * - Responsive: modal on desktop, full-screen on mobile
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon, Upload, Clock, Star, FolderOpen, Search,
  X, List, ChevronDown, Ban, Copy, Sparkles,
  Check, AlertTriangle, Film, FileText, Music,
  RefreshCw, UploadCloud, CornerUpLeft, Eye,
  LayoutGrid, Trash2,
} from "lucide-react";
import { useDam } from "../lib/damContext";
import { DAM_FOLDERS, type EnterpriseMediaAsset, type DamFilter, type FolderName, type AssetSource } from "../lib/media";
import { cn } from "@/utils/cn";

/* ================================================================== */
/*  TYPES                                                               */
/* ================================================================== */

export interface PickerConfig {
  /** What the picker is selecting an image for */
  purpose: string;
  /** Source context (e.g. "product", "brand", "article") */
  source?: AssetSource;
  /** Target folder */
  folder?: FolderName;
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  /** Accepted file types */
  accept?: string;
  /** Aspect ratio hint (e.g. "16:9", "1:1", "4:5") */
  aspectRatio?: string;
  /** Callback when asset(s) are selected */
  onSelect: (urls: string[], assets: EnterpriseMediaAsset[]) => void;
  /** Current image URL(s) to pre-select */
  currentUrls?: string[];
}

type PickerTab = "library" | "upload" | "recent" | "favorites" | "folders" | "unused" | "duplicates" | "ai_generated";

/* ================================================================== */
/*  MAIN PICKER COMPONENT                                               */
/* ================================================================== */

interface DamPickerProps {
  open: boolean;
  onClose: () => void;
  config: PickerConfig;
}

export function DamPicker({ open, onClose, config }: DamPickerProps) {
  const [tab, setTab] = useState<PickerTab>("library");
  const { stats } = useDam();
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Escape key closes modal
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap — focus the modal container on open
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const TABS: { id: PickerTab; label: string; icon: typeof ImageIcon; badge?: string }[] = [
    { id: "library", label: "Media Library", icon: ImageIcon },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "folders", label: "Folders", icon: FolderOpen },
    { id: "unused", label: "Unused", icon: Ban, badge: stats.unusedCount > 0 ? String(stats.unusedCount) : undefined },
    { id: "duplicates", label: "Duplicates", icon: Copy, badge: stats.duplicateCount > 0 ? String(stats.duplicateCount) : undefined },
    { id: "ai_generated", label: "AI", icon: Sparkles },
  ];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Global Media Picker"
      tabIndex={-1}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" aria-hidden="true" />

      {/* Modal container */}
      <div className="relative z-10 flex h-full max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-scale-in sm:h-[85vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h2 className="truncate font-display text-lg font-semibold text-ink">Media Picker</h2>
            <span className="hidden shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent sm:inline">{config.purpose}</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-surface2">
            <X className="h-5 w-5 text-ink" />
          </button>
        </div>

        {/* Tab bar — scrollable on small screens */}
        <div className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 py-2 sm:px-6" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm", tab === t.id ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2 hover:text-ink")}>
              <t.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && (
                <span className="ml-1 rounded-full bg-warning/20 px-1.5 text-[10px] text-warning">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <PickerContent tab={tab} config={config} onClose={onClose} />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB CONTENT                                                         */
/* ================================================================== */

function PickerContent({ tab, config, onClose }: { tab: PickerTab; config: PickerConfig; onClose: () => void }) {
  switch (tab) {
    case "library": return <LibraryTab config={config} onClose={onClose} />;
    case "upload": return <UploadTab config={config} onClose={onClose} />;
    case "recent": return <RecentTab config={config} onClose={onClose} />;
    case "favorites": return <FavoritesTab config={config} onClose={onClose} />;
    case "folders": return <FoldersTab config={config} onClose={onClose} />;
    case "unused": return <UnusedTab config={config} onClose={onClose} />;
    case "duplicates": return <DuplicatesTab config={config} onClose={onClose} />;
    case "ai_generated": return <AiGeneratedTab config={config} onClose={onClose} />;
    default: return null;
  }
}

/* ================================================================== */
/*  LIBRARY TAB                                                         */
/* ================================================================== */

function LibraryTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const {
    filteredAssets, stats, currentFilter, setFilter,
    searchQuery, setSearch,
    viewMode, setViewMode, toggleFavorite, selectAsset,
  } = useDam();

  const [selected, setSelected] = useState<string[]>(config.currentUrls || []);

  const FILTERS: { id: DamFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "images", label: "Images", count: stats.byType.image || 0 },
    { id: "video", label: "Video", count: stats.byType.video || 0 },
    { id: "document", label: "Documents", count: stats.byType.document || 0 },
  ];

  const toggleSelect = (asset: EnterpriseMediaAsset) => {
    if (!config.multiple) {
      setSelected([asset.url]);
      config.onSelect([asset.url], [asset]);
      onClose();
      return;
    }
    setSelected((prev) =>
      prev.includes(asset.url)
        ? prev.filter((u) => u !== asset.url)
        : [...prev, asset.url],
    );
  };

  const confirmSelection = () => {
    const urls = selected;
    const assets = filteredAssets.filter((a) => urls.includes(a.url));
    config.onSelect(urls, assets);
    onClose();
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
        <div className="relative flex-1 sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name, tag, color…"
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn("chip text-xs", currentFilter === f.id && "chip-active")}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("grid h-8 w-8 place-items-center rounded-lg", viewMode === "grid" ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("grid h-8 w-8 place-items-center rounded-lg", viewMode === "list" ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Asset grid / list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredAssets.slice(0, 100).map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selected.includes(asset.url)}
                onSelect={() => toggleSelect(asset)}
                onFavorite={() => toggleFavorite(asset.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAssets.slice(0, 100).map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                selected={selected.includes(asset.url)}
                onSelect={() => toggleSelect(asset)}
                onFavorite={() => toggleFavorite(asset.id)}
                onPreview={() => selectAsset(asset)}
              />
            ))}
          </div>
        )}
        {filteredAssets.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <ImageIcon className="h-12 w-12 text-muted" />
            <p className="text-sm text-muted">No assets found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-6">
        <p className="text-xs text-muted">
          {selected.length > 0
            ? `${selected.length} selected · ${stats.total} total assets`
            : `${stats.totalMb} MB · ${stats.total} assets`}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          {config.multiple && (
            <button onClick={confirmSelection} disabled={selected.length === 0} className="btn-primary btn-sm">
              <Check className="h-4 w-4" /> Select ({selected.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ASSET CARD                                                          */
/* ================================================================== */

function AssetCard({ asset, selected, onSelect, onFavorite }: {
  asset: EnterpriseMediaAsset;
  selected: boolean;
  onSelect: () => void;
  onFavorite: () => void;
}) {
  const Icon = asset.type === "video" ? Film : asset.type === "document" ? FileText : asset.type === "audio" ? Music : ImageIcon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 transition-all",
        selected ? "border-accent ring-2 ring-accent/30" : "border-transparent hover:border-accent/50",
      )}
    >
      <div className="relative aspect-square bg-surface2">
        {asset.type === "image" ? (
          <img src={asset.url} alt={asset.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <Icon className="h-8 w-8" />
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-accent/20">
            <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-ink">
              <Check className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
        {!asset.optimized && (
          <span className="absolute left-2 top-2 badge bg-amber-500/90 text-[10px] text-white">
            <AlertTriangle className="h-3 w-3" />
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className={cn(
            "absolute right-2 bottom-2 grid h-7 w-7 place-items-center rounded-full opacity-0 transition-all group-hover:opacity-100",
            asset.favorited ? "bg-amber-400 text-white" : "bg-black/40 text-white",
          )}
        >
          <Star className="h-3.5 w-3.5" fill={asset.favorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="min-w-0 px-2.5 py-2">
        <p className="truncate text-xs font-medium text-ink">{asset.refName}</p>
        <p className="truncate text-[10px] text-muted">{asset.width}×{asset.height} · {asset.sizeKb}KB</p>
        <div className="mt-1 flex flex-wrap items-center gap-1 overflow-hidden">
          <span className="shrink-0 rounded bg-surface2 px-1.5 py-0.5 text-[9px] uppercase leading-none text-muted">{asset.fileExtension}</span>
          <span className="truncate text-[9px] capitalize leading-none text-muted">{asset.folder}</span>
        </div>
      </div>
    </button>
  );
}

/* ================================================================== */
/*  ASSET ROW (list view)                                               */
/* ================================================================== */

function AssetRow({ asset, selected, onSelect, onFavorite, onPreview }: {
  asset: EnterpriseMediaAsset;
  selected: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  onPreview: () => void;
}) {
  const Icon = asset.type === "video" ? Film : asset.type === "document" ? FileText : asset.type === "audio" ? Music : ImageIcon;

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        selected ? "bg-accent/10 ring-1 ring-accent" : "hover:bg-surface2",
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface2">
        {asset.type === "image" ? (
          <img src={asset.url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center"><Icon className="h-5 w-5 text-muted" /></div>
        )}
        {selected && <div className="absolute inset-0 bg-accent/20"><Check className="absolute right-1 top-1 h-4 w-4 text-accent" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{asset.refName}</p>
        <p className="truncate text-xs text-muted">{asset.width}×{asset.height} · {asset.sizeKb}KB · {asset.fileExtension.toUpperCase()}</p>
        <div className="flex flex-wrap gap-1 overflow-hidden">
          <span className="shrink-0 rounded bg-surface2 px-1.5 py-0.5 text-[10px] capitalize text-muted">{asset.folder}</span>
          <span className="shrink-0 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">{asset.usageCount} uses</span>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {asset.aiTags.slice(0, 2).map((t) => (
          <span key={t} className="rounded bg-accent-soft/50 px-1.5 py-0.5 text-[10px] text-accent">{t}</span>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); onPreview(); }} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface2" title="Preview" aria-label="Preview">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className={cn("grid h-8 w-8 place-items-center rounded-full", asset.favorited ? "text-amber-400" : "text-muted hover:bg-surface2")} title="Favorite" aria-label={asset.favorited ? "Unfavorite" : "Favorite"}>
          <Star className="h-4 w-4" fill={asset.favorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  UPLOAD TAB                                                          */
/* ================================================================== */

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  asset?: EnterpriseMediaAsset;
  dataUrl?: string;
}

function UploadTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { uploadAsset } = useDam();
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [totalProgress, setTotalProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef(false);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      // Simulate progress
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          // progress is handled via the upload simulation
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback(async (fileList: File[]) => {
    cancelRef.current = false;
    const uploadFiles: UploadFile[] = fileList.map((f) => ({
      file: f,
      id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      progress: 0,
      status: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
    setTotalProgress(0);

    const allFiles = [...files, ...uploadFiles];
    const total = allFiles.length;
    let completed = 0;

    for (const uf of uploadFiles) {
      if (cancelRef.current) break;

      setFiles((prev) =>
        prev.map((f) => f.id === uf.id ? { ...f, status: "uploading" as const, progress: 0 } : f),
      );

      try {
        // Read the file as data URL for preview
        const dataUrl = await readFileAsDataURL(uf.file);

        if (cancelRef.current) break;

        // Simulate upload progress in chunks
        for (let pct = 10; pct <= 90; pct += Math.floor(Math.random() * 15) + 5) {
          if (cancelRef.current) break;
          await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));
          setFiles((prev) =>
            prev.map((f) => f.id === uf.id ? { ...f, progress: pct } : f),
          );
          setTotalProgress(Math.round((completed * 100 + pct) / total));
        }

        if (cancelRef.current) break;

        // Create asset via DAM context
        const asset = uploadAsset({
          url: dataUrl,
          filename: uf.file.name,
          source: config.source || "upload",
          folder: config.folder,
          title: uf.file.name.replace(/\.[^.]+$/, ""),
        });

        setFiles((prev) =>
          prev.map((f) => f.id === uf.id ? { ...f, status: "done" as const, progress: 100, asset, dataUrl } : f),
        );

        completed++;
        setTotalProgress(Math.round((completed / total) * 100));
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) => f.id === uf.id ? { ...f, status: "error" as const, error: "Upload failed. Please try again." } : f),
        );
      }
    }
  }, [uploadAsset, config.source, config.folder, files]);

  const handleBrowse = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    processFiles(Array.from(fileList));
  }, [processFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) processFiles(dropped);
  }, [processFiles]);

  const handlePasteImage = useCallback(async (blob: Blob) => {
    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
    processFiles([file]);
  }, [processFiles]);

  const handlePasteUrl = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
        const asset = uploadAsset({
          url: text,
          filename: "clipboard-image.jpg",
          source: config.source || "upload",
          folder: config.folder,
          title: "Pasted URL",
        });
        setFiles((prev) => [...prev, {
          file: new File([], "clipboard-image.jpg"),
          id: `url_${Date.now()}`,
          progress: 100,
          status: "done",
          asset,
        }]);
        setUrlInput(text);
      }
    } catch { /* clipboard access denied — not critical */ }
  }, [uploadAsset, config.source, config.folder]);

  const handleUrlUpload = () => {
    if (!urlInput.trim()) return;
    const asset = uploadAsset({
      url: urlInput.trim(),
      filename: urlInput.split("/").pop() || "web-image.jpg",
      source: config.source || "upload",
      folder: config.folder,
      title: urlInput.split("/").pop()?.replace(/\.[^.]+$/, "") || "Web image",
    });
    setFiles((prev) => [...prev, {
      file: new File([], "web-image.jpg"),
      id: `url_${Date.now()}`,
      progress: 100,
      status: "done",
      asset,
    }]);
    setUrlInput("");
  };

  const retryFile = (uf: UploadFile) => {
    if (uf.file.size > 0) {
      processFiles([uf.file]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const cancelUploads = () => {
    cancelRef.current = true;
    setFiles((prev) => prev.map((f) => f.status === "pending" || f.status === "uploading" ? { ...f, status: "error" as const, error: "Cancelled" } : f));
    setTotalProgress(0);
  };

  const confirmUpload = () => {
    const done = files.filter((f) => f.status === "done" && f.asset);
    config.onSelect(
      done.map((a) => a.asset!.url),
      done.map((a) => a.asset!),
    );
    onClose();
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const uploadingCount = files.filter((f) => f.status === "pending" || f.status === "uploading").length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Drop zone */}
        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors",
            dragging
              ? "border-accent bg-accent-soft/30"
              : "border-line hover:border-accent/50 hover:bg-surface2/50",
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className={cn("h-12 w-12", dragging ? "text-accent" : "text-muted")} />
          <p className="mt-4 text-sm font-medium text-ink">
            {dragging ? "Drop files here" : "Drag & drop files, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Supports JPG, PNG, WEBP, AVIF, GIF, SVG, MP4, PDF, DOCX & more
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={config.accept || "image/*,.pdf,.docx,.xlsx,.mp4,.webm,.mp3"}
            className="hidden"
            onChange={(e) => { handleBrowse(e.target.files); e.target.value = ""; }}
          />
        </div>

        {/* Paste zone */}
        <div className="rounded-xl border border-line p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-muted">
            <CornerUpLeft className="h-3.5 w-3.5" /> Paste image from clipboard
          </p>
          <textarea
            ref={pasteRef}
            className="input-field mt-2 resize-none text-xs"
            rows={2}
            placeholder="Press Ctrl+V / Cmd+V to paste an image or URL…"
            onPaste={async (e) => {
              const items = e.clipboardData.items;
              for (const item of items) {
                if (item.type.startsWith("image/")) {
                  e.preventDefault();
                  const blob = item.getAsFile();
                  if (blob) { await handlePasteImage(blob); }
                  return;
                }
              }
              setTimeout(handlePasteUrl, 200);
            }}
          />
        </div>

        {/* URL upload */}
        <div className="flex items-center gap-2">
          <input
            className="input-field flex-1 text-sm"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or paste an image URL directly…"
            onKeyDown={(e) => { if (e.key === "Enter") handleUrlUpload(); }}
          />
          <button onClick={handleUrlUpload} disabled={!urlInput.trim()} className="btn-outline btn-sm">
            <Upload className="h-4 w-4" /> Import
          </button>
        </div>

        {/* Global progress bar */}
        {uploadingCount > 0 && totalProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Uploading {uploadingCount} file(s)…
              </span>
              <span>{totalProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={totalProgress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${totalProgress}%` }} />
            </div>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink">
                {doneCount} uploaded · {uploadingCount} pending · {errorCount} failed
              </p>
              {uploadingCount > 0 && (
                <button onClick={cancelUploads} className="btn-ghost btn-sm text-danger">
                  <Trash2 className="h-3.5 w-3.5" /> Cancel all
                </button>
              )}
            </div>

            {files.map((uf) => (
              <div key={uf.id} className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                uf.status === "done" ? "border-success/30 bg-success/5" :
                uf.status === "error" ? "border-danger/30 bg-danger/5" :
                "border-line bg-surface",
              )}>
                {/* Preview */}
                {uf.dataUrl || (uf.asset && uf.asset.url.startsWith("data:")) ? (
                  <img src={uf.dataUrl || uf.asset!.url} alt="" className="h-12 w-10 shrink-0 rounded-lg object-cover" />
                ) : uf.asset ? (
                  <img src={uf.asset.url} alt="" className="h-12 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-12 w-10 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{uf.file.name || "URL import"}</p>
                  {uf.asset ? (
                    <p className="text-xs text-muted">
                      {uf.asset.width}×{uf.asset.height} · {(uf.asset.sizeKb / 1024).toFixed(1)}MB
                    </p>
                  ) : (
                    <p className="text-xs text-muted">
                      {uf.file.size ? `${(uf.file.size / 1024 / 1024).toFixed(1)}MB` : "Unknown size"}
                    </p>
                  )}
                  {/* Error message */}
                  {uf.status === "error" && uf.error && (
                    <p className="mt-0.5 text-xs text-danger">{uf.error}</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {uf.status === "pending" || uf.status === "uploading" ? (
                    <>
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface2 sm:w-16">
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${uf.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted">{uf.progress}%</span>
                    </>
                  ) : uf.status === "done" ? (
                    <Check className="h-4 w-4 shrink-0 text-success" />
                  ) : uf.status === "error" && uf.error !== "Cancelled" ? (
                    <button onClick={() => retryFile(uf)} className="btn-ghost btn-sm" aria-label="Retry upload">
                      <RefreshCw className="h-3.5 w-3.5" /> Retry
                    </button>
                  ) : null}
                  <button onClick={() => removeFile(uf.id)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface2" aria-label="Remove">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {doneCount > 0 && uploadingCount === 0 && (
          <div className="flex gap-2">
            <button onClick={confirmUpload} className="btn-primary btn-sm">
              <Check className="h-4 w-4" /> Use {doneCount} selected asset(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  RECENT TAB                                                          */
/* ================================================================== */

function RecentTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { assets, toggleFavorite } = useDam();
  const recent = useMemo(() =>
    [...assets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 30),
    [assets],
  );

  const handleSelect = (asset: EnterpriseMediaAsset) => {
    config.onSelect([asset.url], [asset]);
    onClose();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <p className="mb-4 text-xs text-muted">Recently uploaded or modified assets</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {recent.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            selected={false}
            onSelect={() => handleSelect(asset)}
            onFavorite={() => toggleFavorite(asset.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FAVORITES TAB                                                       */
/* ================================================================== */

function FavoritesTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { assets, toggleFavorite } = useDam();
  const favorites = useMemo(() => assets.filter((a) => a.favorited), [assets]);

  const handleSelect = (asset: EnterpriseMediaAsset) => {
    config.onSelect([asset.url], [asset]);
    onClose();
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Star className="h-12 w-12 text-muted" />
        <p className="text-sm text-muted">No favorites yet</p>
        <p className="text-xs text-muted">Star assets from the Media Library to add them here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {favorites.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            selected={false}
            onSelect={() => handleSelect(asset)}
            onFavorite={() => toggleFavorite(asset.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FOLDERS TAB                                                         */
/* ================================================================== */

function FoldersTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { assets, toggleFavorite, setFolder } = useDam();
  const [activeFolder, setActiveFolder] = useState<FolderName | null>(null);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => { counts[a.folder] = (counts[a.folder] || 0) + 1; });
    return counts;
  }, [assets]);

  const folderAssets = useMemo(
    () => activeFolder ? assets.filter((a) => a.folder === activeFolder) : [],
    [assets, activeFolder],
  );

  const handleSelect = (asset: EnterpriseMediaAsset) => {
    config.onSelect([asset.url], [asset]);
    onClose();
  };

  if (activeFolder) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <button
          onClick={() => setActiveFolder(null)}
          className="mb-4 flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-90" /> All folders
        </button>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {folderAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={false}
              onSelect={() => handleSelect(asset)}
              onFavorite={() => toggleFavorite(asset.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAM_FOLDERS.map((f) => (
          <button
            key={f.name}
            onClick={() => { setActiveFolder(f.name); setFolder(f.name); }}
            className="flex items-center gap-4 rounded-xl border border-line p-4 text-left transition-all hover:border-accent/50 hover:bg-surface2"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <FolderOpen className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate font-medium text-ink">{f.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{f.description}</p>
              <p className="mt-1 truncate text-xs font-medium text-accent">
                {folderCounts[f.name] || 0} asset(s)
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  UNUSED TAB                                                          */
/* ================================================================== */

function UnusedTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { assets: damAssets, unused, toggleFavorite } = useDam();
  const unusedAssets = useMemo(() => unused.length > 0 ? unused : damAssets.filter((a) => a.usageCount === 0), [unused, damAssets]);

  const handleSelect = (asset: EnterpriseMediaAsset) => {
    config.onSelect([asset.url], [asset]);
    onClose();
  };

  if (unusedAssets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Ban className="h-12 w-12 text-muted" />
        <p className="text-sm text-muted">All assets are in use</p>
        <p className="text-xs text-muted">No unused assets available for selection.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <p className="mb-4 text-xs text-muted">Assets not currently used anywhere on the platform</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {unusedAssets.slice(0, 40).map((asset) => (
          <div key={asset.id} className="relative">
            <AssetCard
              asset={asset}
              selected={false}
              onSelect={() => handleSelect(asset)}
              onFavorite={() => toggleFavorite(asset.id)}
            />
            <span className="absolute left-2 top-2 badge bg-surface/80 text-[9px] text-muted">
              <Ban className="h-2.5 w-2.5" /> Unused
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DUPLICATES TAB                                                      */
/* ================================================================== */

function DuplicatesTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { duplicates, toggleFavorite } = useDam();

  const handleSelect = (asset: EnterpriseMediaAsset) => {
    config.onSelect([asset.url], [asset]);
    onClose();
  };

  if (duplicates.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Copy className="h-12 w-12 text-muted" />
        <p className="text-sm text-muted">No duplicate assets found</p>
        <p className="text-xs text-muted">All assets are unique.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <p className="mb-4 text-xs text-muted">Duplicate asset groups — select the one you want to use</p>
      <div className="space-y-4">
        {duplicates.map((group, i) => (
          <div key={i} className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-warning">
              <Copy className="h-3.5 w-3.5" />
              {group.type.charAt(0).toUpperCase() + group.type.slice(1)} duplicate — {group.confidence}% confidence
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              <AssetCard
                asset={group.original}
                selected={false}
                onSelect={() => handleSelect(group.original)}
                onFavorite={() => toggleFavorite(group.original.id)}
              />
              {group.duplicates.map((dup) => (
                <div key={dup.id} className="relative">
                  <AssetCard
                    asset={dup}
                    selected={false}
                    onSelect={() => handleSelect(dup)}
                    onFavorite={() => toggleFavorite(dup.id)}
                  />
                  <span className="absolute left-2 top-2 badge bg-warning/80 text-[9px] text-white">Dupe</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AI GENERATED TAB                                                    */
/* ================================================================== */

function AiGeneratedTab({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const { assets, toggleFavorite } = useDam();
  const aiAssets = useMemo(() => assets.filter((a) => a.source === "ai_generated" || a.aiTags.length > 3), [assets]);

  const handleSelect = (asset: EnterpriseMediaAsset) => {
    config.onSelect([asset.url], [asset]);
    onClose();
  };

  if (aiAssets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Sparkles className="h-12 w-12 text-muted" />
        <p className="text-sm text-muted">No AI-generated assets</p>
        <p className="text-xs text-muted">Upload assets with AI metadata to see them here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <p className="mb-4 text-xs text-muted">Assets with AI-generated metadata (tags, captions, alt text)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {aiAssets.slice(0, 40).map((asset) => (
          <div key={asset.id}>
            <AssetCard
              asset={asset}
              selected={false}
              onSelect={() => handleSelect(asset)}
              onFavorite={() => toggleFavorite(asset.id)}
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {asset.aiTags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-full bg-accent-soft/60 px-1.5 py-0.5 text-[9px] text-accent">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  USE MEDIA PICKER HOOK                                               */
/* ================================================================== */

/**
 * Hook to open the Global Media Picker from any form field.
 *
 * @example
 * ```tsx
 * const { openPicker } = useMediaPicker();
 *
 * <button onClick={() => openPicker({
 *   purpose: "Product cover image",
 *   source: "product",
 *   onSelect: (urls) => setImageUrls(urls),
 *   currentUrls: product.images,
 * })}>
 *   Choose image
 * </button>
 * ```
 */
export function useMediaPicker() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerConfig, setPickerConfig] = useState<PickerConfig | null>(null);

  const openPicker = useCallback((config: PickerConfig) => {
    setPickerConfig(config);
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setPickerConfig(null);
  }, []);

  const Picker = pickerConfig ? (
    <DamPicker open={pickerOpen} onClose={closePicker} config={pickerConfig} />
  ) : null;

  return { openPicker, closePicker, Picker, pickerOpen };
}
