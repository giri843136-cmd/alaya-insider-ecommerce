/**
 * ALAYA INSIDER — Enterprise DAM Context
 * -----------------------------------------------------------------------
 * Central state management for the Digital Asset Management system.
 * Provides the asset store, indexing, upload simulation, duplicate
 * detection, folder management, and favorites across the entire platform.
 *
 * Every component that needs media access uses the useDam() hook.
 */
import { createContext, useContext, useCallback, useMemo, useState, createElement, type ReactNode } from "react";
import {
  indexAssets,
  findDuplicates,
  findUnused,
  searchAssets,
  filterAssets,
  filterByFolder,
  filterBySource,
  simulateUpload,
  optimizeAsset,
  checkSafeDelete,
  addVersion,
  restoreVersion,
  mediaStats,
  DAM_FOLDERS,
  type EnterpriseMediaAsset,
  type IndexableData,
  type DamFilter,
  type FolderName,
  type AssetSource,
  type DuplicateGroup,
  type DeleteCheckResult,
  type DamStats,
  type UploadOptions,
} from "./media";

/* ================================================================== */
/*  DAM STORE                                                           */
/* ================================================================== */

interface DamState {
  assets: EnterpriseMediaAsset[];
  duplicates: DuplicateGroup[];
  unused: EnterpriseMediaAsset[];
  stats: DamStats;
  selectedAsset: EnterpriseMediaAsset | null;
  currentFilter: DamFilter;
  currentFolder: FolderName | "all";
  currentSource: AssetSource | "all";
  searchQuery: string;
  viewMode: "grid" | "list";
}

interface DamActions {
  indexData: (data: IndexableData) => void;
  selectAsset: (asset: EnterpriseMediaAsset | null) => void;
  setFilter: (filter: DamFilter) => void;
  setFolder: (folder: FolderName | "all") => void;
  setSource: (source: AssetSource | "all") => void;
  setSearch: (query: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  uploadAsset: (options: UploadOptions, uploader?: string, role?: string) => EnterpriseMediaAsset;
  optimizeSingle: (id: string) => void;
  optimizeAll: () => void;
  toggleFavorite: (id: string) => void;
  deleteAsset: (id: string) => boolean;
  addAssetVersion: (id: string, label: string, url: string, width: number, height: number, sizeKb: number, format: string) => void;
  restoreAssetVersion: (id: string, versionId: string) => void;
  checkDelete: (id: string) => DeleteCheckResult;
  getSuggestedUploads: () => EnterpriseMediaAsset[];
}

interface DamContextType extends DamState, DamActions {
  folders: typeof DAM_FOLDERS;
  filteredAssets: EnterpriseMediaAsset[];
  assetsNeedingOptimization: number;
}

const DamContext = createContext<DamContextType | null>(null);

/* ================================================================== */
/*  PROVIDER                                                            */
/* ================================================================== */

export function DamProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<EnterpriseMediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<EnterpriseMediaAsset | null>(null);
  const [currentFilter, setCurrentFilter] = useState<DamFilter>("all");
  const [currentFolder, setCurrentFolder] = useState<FolderName | "all">("all");
  const [currentSource, setCurrentSource] = useState<AssetSource | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Store latest indexable data for re-indexing
  const [lastData, setLastData] = useState<IndexableData | null>(null);

  const duplicates = useMemo(() => findDuplicates(assets), [assets]);
  const unused = useMemo(
    () => lastData ? findUnused(assets, lastData) : [],
    [assets, lastData],
  );
  const stats = useMemo(() => mediaStats(assets), [assets]);

  const indexData = useCallback((data: IndexableData) => {
    setLastData(data);
    const indexed = indexAssets(data);
    setAssets(indexed);
  }, []);

  const uploadAsset = useCallback(
    (options: UploadOptions, uploader = "Administrator", role = "Administrator") => {
      const newAsset = simulateUpload(options, uploader, role);
      setAssets((prev) => [newAsset, ...prev]);
      return newAsset;
    },
    [],
  );

  const optimizeSingle = useCallback((id: string) => {
    setAssets((prev) => prev.map((a) => a.id === id ? optimizeAsset(a) : a));
  }, []);

  const optimizeAll = useCallback(() => {
    setAssets((prev) => prev.map((a) => a.optimized ? a : optimizeAsset(a)));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setAssets((prev) =>
      prev.map((a) => a.id === id ? { ...a, favorited: !a.favorited } : a),
    );
  }, []);

  const deleteAsset = useCallback((id: string): boolean => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return false;
    const check = checkSafeDelete(asset);
    if (!check.safe) return false; // Don't delete if in use
    setAssets((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, [assets]);

  const addAssetVersion = useCallback(
    (id: string, label: string, url: string, width: number, height: number, sizeKb: number, format: string) => {
      setAssets((prev) =>
        prev.map((a) => a.id === id ? addVersion(a, label, url, width, height, sizeKb, format) : a),
      );
    },
    [],
  );

  const restoreAssetVersion = useCallback((id: string, versionId: string) => {
    setAssets((prev) =>
      prev.map((a) => a.id === id ? restoreVersion(a, versionId) : a),
    );
  }, []);

  const checkDelete = useCallback((id: string): DeleteCheckResult => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return { safe: true, usageCount: 0, usages: [], message: "Asset not found." };
    return checkSafeDelete(asset);
  }, [assets]);

  const getSuggestedUploads = useCallback((): EnterpriseMediaAsset[] => {
    return assets.filter((a) => a.source === "upload").slice(0, 10);
  }, [assets]);

  // Derived filtered assets
  const filteredAssets = useMemo(() => {
    let result = assets;
    result = filterAssets(result, currentFilter);
    result = filterByFolder(result, currentFolder);
    result = filterBySource(result, currentSource);
    result = searchAssets(result, searchQuery);
    return result;
  }, [assets, currentFilter, currentFolder, currentSource, searchQuery]);

  const assetsNeedingOptimization = useMemo(
    () => assets.filter((a) => !a.optimized).length,
    [assets],
  );

  const value: DamContextType = {
    assets, duplicates, unused, stats,
    selectedAsset, currentFilter, currentFolder,
    currentSource, searchQuery, viewMode,
    folders: DAM_FOLDERS,
    filteredAssets,
    assetsNeedingOptimization,
    indexData,
    selectAsset: setSelectedAsset,
    setFilter: setCurrentFilter,
    setFolder: setCurrentFolder,
    setSource: setCurrentSource,
    setSearch: setSearchQuery,
    setViewMode,
    uploadAsset,
    optimizeSingle,
    optimizeAll,
    toggleFavorite,
    deleteAsset,
    addAssetVersion,
    restoreAssetVersion,
    checkDelete,
    getSuggestedUploads,
  };

  return createElement(DamContext.Provider, { value }, children);
}

/* ================================================================== */
/*  HOOK                                                                */
/* ================================================================== */

export function useDam(): DamContextType {
  const ctx = useContext(DamContext);
  if (!ctx) {
    throw new Error("useDam() must be used within a <DamProvider>");
  }
  return ctx;
}
