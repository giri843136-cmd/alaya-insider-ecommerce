/**
 * ALAYA INSIDER — Enterprise Digital Asset Management (DAM) Engine
 * -----------------------------------------------------------------
 * The single source of truth for every media asset across the platform.
 * Handles indexing, upload simulation, optimization, duplicate detection,
 * usage tracking, version management, CDN sync, safe delete, audit logging,
 * and AI metadata generation — all from existing catalogue data.
 *
 * Every image field in the platform opens the Global Media Picker which
 * sources assets from this engine.
 */
import type { Product, Brand, Article, Category, Settings } from "./types";

/* ================================================================== */
/*  ENTERPRISE DAM TYPES                                               */
/* ================================================================== */

/** Minimal interface needed by the DAM indexer. */
export interface IndexableData {
  products: Product[];
  brands: Brand[];
  articles: Article[];
  categories: Category[];
  settings: Settings;
}

export type AssetType = "image" | "video" | "document" | "audio";

export type AssetSource =
  | "product" | "brand" | "article" | "hero" | "category"
  | "collection" | "author" | "page" | "system" | "seo"
  | "email" | "notification" | "popup" | "coupon"
  | "user" | "admin" | "logo" | "favicon" | "upload" | "ai_generated";

export type FolderName =
  | "Products" | "Brands" | "Collections" | "Categories"
  | "Articles" | "Authors" | "Pages" | "Homepage" | "System"
  | "SEO" | "Marketing" | "Notifications" | "Users" | "Admins"
  | "Uploads" | "AI Generated" | "Uncategorized";

export type MediaOrientation = "portrait" | "landscape" | "square";

export type CdnProvider = "local" | "cloudinary" | "aws_s3" | "gcs" | "backblaze" | "cloudflare";

export type OptimizationStatus = "pending" | "processing" | "done" | "failed";

export interface AssetVersion {
  id: string;
  label: string; // "Original", "WebP", "AVIF", "Thumbnail", "Small", "Medium", "Large", "Retina", "Compressed"
  url: string;
  width: number;
  height: number;
  sizeKb: number;
  format: string;
  createdAt: number;
}

export interface AssetUsage {
  source: AssetSource;
  refId: string;
  refName: string;
  field: string; // e.g. "images[0]", "cover", "image", "logo"
  url: string;
}

export interface AssetAuditEntry {
  action: "upload" | "replace" | "delete" | "restore" | "move" | "rename"
    | "optimize" | "compress" | "convert" | "download" | "share"
    | "favorite" | "permission_change" | "version_restore" | "ai_generate";
  user: string;
  role: string;
  ip: string;
  browser: string;
  device: string;
  ts: number;
  detail?: string;
}

export interface EnterpriseMediaAsset {
  /** Core */
  id: string;
  url: string;
  originalFilename: string;
  filename: string;
  fileExtension: string;
  type: AssetType;
  source: AssetSource;
  refId: string;
  refName: string;

  /** Metadata */
  title: string;
  alt: string;
  description: string;
  caption: string;
  tags: string[];
  sizeKb: number;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: MediaOrientation;
  colorSpace: string;
  dominantColor: string;

  /** Organization */
  folder: FolderName;
  collection: string;
  category: string;

  /** Copyright / License */
  copyright: string;
  license: string;

  /** SEO */
  seoMetadata: Record<string, string>;

  /** CDN URLs */
  cdnUrl: string;
  originalUrl: string;
  thumbnailUrl: string;
  webpUrl: string;
  avifUrl: string;
  retinaUrl: string;

  /** Processing */
  optimized: boolean;
  webp: boolean;
  avif: boolean;
  compressionRatio: number;
  optimizationStatus: OptimizationStatus;
  blurPlaceholder: string;
  dominantColorHex: string;

  /** Security / Integrity */
  hash: string; // SHA-256
  checksum: string;
  fingerprint: string;

  /** EXIF */
  exif: Record<string, string>;

  /** AI Metadata */
  aiTags: string[];
  aiCaption: string;
  aiAltText: string;
  aiDescription: string;

  /** Duplicate Detection */
  duplicateOf?: string;
  isDuplicate: boolean;
  duplicateScore?: number;

  /** Usage */
  usageCount: number;
  usages: AssetUsage[];
  timesUsed: number;
  pagesUsing: number;
  productsUsing: number;
  articlesUsing: number;
  collectionsUsing: number;
  categoriesUsing: number;
  brandsUsing: number;
  authorsUsing: number;
  templatesUsing: number;
  campaignsUsing: number;
  notificationsUsing: number;
  lastUsed: number;
  firstUsed: number;
  mostViewed: number;
  lastModified: number;

  /** Quality */
  qualityScore: number;

  /** Versions */
  versions: AssetVersion[];
  currentVersion: string;

  /** Favorites */
  favorited: boolean;
  favoritedBy: string[];

  /** CDN */
  cdnProvider: CdnProvider;
  cdnSynced: boolean;
  cdnSyncAt: number | null;

  /** Audit */
  auditLog: AssetAuditEntry[];

  /** Timestamps */
  createdAt: number;
  modifiedAt: number;
  uploadDate: number;
  uploader: string;
  uploaderRole: string;

  /** Stats */
  downloadCount: number;
  shareCount: number;
  viewCount: number;
}

/* ================================================================== */
/*  FOLDER DEFINITIONS                                                  */
/* ================================================================== */

export const DAM_FOLDERS: { name: FolderName; icon: string; description: string }[] = [
  { name: "Products", icon: "package", description: "Product images, galleries, variants" },
  { name: "Brands", icon: "tag", description: "Brand logos, banners, covers" },
  { name: "Collections", icon: "layers", description: "Collection banners and thumbnails" },
  { name: "Categories", icon: "folder-open", description: "Category banners and images" },
  { name: "Articles", icon: "file-text", description: "Article covers and galleries" },
  { name: "Authors", icon: "users", description: "Author avatars and profiles" },
  { name: "Pages", icon: "file", description: "Page hero and background images" },
  { name: "Homepage", icon: "layout", description: "Hero slides, sections, banners" },
  { name: "System", icon: "settings", description: "Logo, favicon, system assets" },
  { name: "SEO", icon: "search", description: "OG images, Twitter cards" },
  { name: "Marketing", icon: "megaphone", description: "Email templates, popups, coupons" },
  { name: "Notifications", icon: "bell", description: "Push notification images" },
  { name: "Users", icon: "user", description: "User avatars" },
  { name: "Admins", icon: "shield", description: "Admin avatars" },
  { name: "Uploads", icon: "upload-cloud", description: "Direct uploads" },
  { name: "AI Generated", icon: "sparkles", description: "AI-generated media" },
  { name: "Uncategorized", icon: "help-circle", description: "Assets needing organization" },
];

/* ================================================================== */
/*  HELPERS                                                             */
/* ================================================================== */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function detectType(url: string): AssetType {
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov)$/.test(lower)) return "video";
  if (/\.(mp3|wav)$/.test(lower)) return "audio";
  if (/\.(pdf|docx|xlsx|ppt|txt|csv)$/.test(lower)) return "document";
  return "image";
}

function detectOrientation(w: number, h: number): MediaOrientation {
  if (w > h) return "landscape";
  if (h > w) return "portrait";
  return "square";
}

function deriveMeta(url: string, seed = 0) {
  const h = hashStr(url + seed);
  const ext = (url.split(".").pop() || "jpg").toLowerCase();
  const sizeKb = 40 + ((h % 380) + seed * 17) % 400;
  const ratios: [number, number][] = [
    [800, 1200], [1000, 1300], [1600, 900], [1200, 800],
    [500, 500], [1920, 1080], [600, 900], [300, 300],
  ];
  const [width, height] = ratios[h % ratios.length];
  const aspectRatio = width / height;
  return { sizeKb, width, height, ext, aspectRatio };
}

const COLORS = [
  "#9c7a4b", "#c9a876", "#7a6a52", "#b8a888",
  "#6f7f5c", "#a8b893", "#9a5a4a", "#c98a78",
  "#4a5a7a", "#8aa0c9", "#1f1b16", "#f2ece1",
  "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444",
];

function deriveColor(url: string): string {
  return COLORS[hashStr(url) % COLORS.length];
}

function deriveHash(url: string): string {
  // Deterministic pseudo-SHA-256 for demo
  const h = hashStr(url);
  const hex = h.toString(16).padStart(8, "0");
  return `sha256$${hex}${"0".repeat(48)}${hex}${"0".repeat(48)}`;
}

function deriveFolder(source: AssetSource): FolderName {
  const map: Record<string, FolderName> = {
    product: "Products", brand: "Brands", article: "Articles",
    hero: "Homepage", category: "Categories", collection: "Collections",
    author: "Authors", page: "Pages", seo: "SEO", system: "System",
    email: "Marketing", notification: "Notifications", popup: "Marketing",
    user: "Users", admin: "Admins", upload: "Uploads", ai_generated: "AI Generated",
  };
  return map[source] || "Uncategorized";
}

function getAssetUsages(assetUrl: string, data: IndexableData): AssetUsage[] {
  const usages: AssetUsage[] = [];

  data.products.forEach((p) => {
    p.images.forEach((img, i) => {
      if (img === assetUrl) usages.push({
        source: "product", refId: p.id, refName: p.name,
        field: `images[${i}]`, url: img,
      });
    });
  });

  data.brands.forEach((b) => {
    if (b.image === assetUrl) usages.push({
      source: "brand", refId: b.id, refName: b.name,
      field: "image", url: b.image,
    });
    if (b.logo === assetUrl) usages.push({
      source: "brand", refId: b.id, refName: b.name,
      field: "logo", url: b.logo,
    });
  });

  data.articles.forEach((a) => {
    if (a.cover === assetUrl) usages.push({
      source: "article", refId: a.id, refName: a.title,
      field: "cover", url: a.cover,
    });
  });

  data.categories.forEach((c) => {
    if (c.image === assetUrl) usages.push({
      source: "category", refId: c.id, refName: c.name,
      field: "image", url: c.image,
    });
  });

  data.settings.heroSlides.forEach((s) => {
    if (s.image === assetUrl) usages.push({
      source: "hero", refId: s.id, refName: s.eyebrow,
      field: "image", url: s.image,
    });
  });

  if (data.settings.seo.ogImage === assetUrl) usages.push({
    source: "seo", refId: "settings", refName: "SEO",
    field: "ogImage", url: data.settings.seo.ogImage,
  });

  return usages;
}

/* ================================================================== */
/*  AI METADATA GENERATION                                              */
/* ================================================================== */

const AI_TAG_POOL = [
  "luxury", "minimal", "natural", "handcrafted", "organic",
  "artisanal", "premium", "sustainable", "eco-friendly", "vegan",
  "cruelty-free", "fair-trade", "ethically-sourced", "bespoke",
  "limited-edition", "seasonal", "classic", "modern", "vintage",
  "boho", "scandinavian", "japanese", "moroccan", "italian",
];

export function generateAiTags(name: string): string[] {
  const tags: string[] = [];
  const lower = name.toLowerCase();
  AI_TAG_POOL.forEach((t) => {
    if (lower.includes(t.slice(0, 4))) tags.push(t);
  });
  if (tags.length < 3) {
    const h = hashStr(name);
    const extra = AI_TAG_POOL.filter((t) => !tags.includes(t));
    for (let i = 0; i < Math.min(3, extra.length); i++) {
      tags.push(extra[(h + i * 7) % extra.length]);
    }
  }
  return tags.slice(0, 6);
}

export function generateAiCaption(name: string, source: AssetSource): string {
  const labels: Record<string, string> = {
    product: "product", brand: "brand", article: "editorial feature",
    hero: "hero banner", category: "category showcase",
  };
  return `A beautiful ${labels[source] || "image"} featuring ${name}, captured with professional lighting and composition for the ALAYA INSIDER platform.`;
}

export function generateAiDescription(name: string, type: AssetType, tags: string[]): string {
  return `This ${type} asset titled "${name}" is part of the ALAYA INSIDER media library. ${tags.length ? `Key themes include: ${tags.slice(0, 4).join(", ")}.` : ""} Optimized for web performance with responsive variants.`;
}

/* ================================================================== */
/*  CORE ASSET CREATION                                                 */
/* ================================================================== */

export function genAltText(refName: string, source: AssetSource, index = 0): string {
  const labels: Record<string, string> = {
    product: "product photography",
    brand: "brand image",
    article: "editorial cover image",
    hero: "hero banner",
    category: "category image",
    collection: "collection image",
    author: "author portrait",
    seo: "SEO preview image",
    system: "system asset",
    upload: "uploaded media",
    ai_generated: "AI-generated media",
  };
  const variant = index === 0 ? "" : ` view ${index + 1}`;
  return `${refName} — ${labels[source] || "media asset"}${variant}`;
}

export function qualityScore(asset: {
  type: AssetType; sizeKb: number; width: number; height: number;
  optimized: boolean; webp: boolean; avif: boolean;
  orientation: MediaOrientation;
}): number {
  let score = 50;
  if (asset.width >= 800 && asset.height >= 600) score += 15;
  if (asset.sizeKb < 250) score += 15;
  if (asset.optimized) score += 10;
  if (asset.webp) score += 5;
  if (asset.avif) score += 5;
  if (asset.orientation === "landscape" && asset.width >= 1920) score += 5;
  return Math.min(100, score);
}

/** Build an EnterpriseMediaAsset from a URL and its context. */
export function createAsset(
  url: string,
  source: AssetSource,
  refId: string,
  refName: string,
  index = 0,
  data?: IndexableData,
): EnterpriseMediaAsset {
  const meta = deriveMeta(url, index);
  const type = detectType(url);
  const orientation = detectOrientation(meta.width, meta.height);
  const id = `dam_${hashStr(url)}_${index}`;
  const folder = deriveFolder(source);
  const tags = [source, type, meta.ext, folder.toLowerCase()];
  const aiTags = generateAiTags(refName);
  const alt = genAltText(refName, source, index);
  const dominantColor = deriveColor(url);
  const hash = deriveHash(url);
  const usages = data ? getAssetUsages(url, data) : [];

  const versionBase: AssetVersion = {
    id: `${id}_orig`, label: "Original", url,
    width: meta.width, height: meta.height,
    sizeKb: meta.sizeKb, format: meta.ext.toUpperCase(),
    createdAt: Date.now(),
  };

  const asset: EnterpriseMediaAsset = {
    id, url,
    originalFilename: `${refName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${meta.ext}`,
    filename: `${refName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${meta.ext}`,
    fileExtension: meta.ext,
    type, source, refId, refName,
    title: refName,
    alt,
    description: "",
    caption: generateAiCaption(refName, source),
    tags: [...new Set([...tags, ...aiTags])],
    sizeKb: meta.sizeKb, width: meta.width, height: meta.height,
    aspectRatio: meta.aspectRatio, orientation,
    colorSpace: "sRGB",
    dominantColor,
    folder, collection: folder, category: source,
    copyright: `© ${new Date().getFullYear()} ALAYA INSIDER`,
    license: "All rights reserved",
    seoMetadata: {
      title: refName,
      description: generateAiDescription(refName, type, aiTags),
      keywords: aiTags.slice(0, 5).join(", "),
    },
    cdnUrl: url, originalUrl: url,
    thumbnailUrl: url, webpUrl: url, avifUrl: url, retinaUrl: url,
    optimized: type !== "image" ? true : meta.sizeKb < 120,
    webp: type !== "image",
    avif: false,
    compressionRatio: type !== "image" ? 1 : Math.round((1 - (meta.sizeKb * 0.6) / meta.sizeKb) * 100) / 100,
    optimizationStatus: type !== "image" ? "done" : meta.sizeKb < 120 ? "done" : "pending",
    blurPlaceholder: dominantColor,
    dominantColorHex: dominantColor,
    hash, checksum: hash, fingerprint: hash,
    exif: {
      Make: "ALAYA DAM",
      Software: "Enterprise DAM v1.0",
      "Color Space": "sRGB",
    },
    aiTags, aiCaption: generateAiCaption(refName, source),
    aiAltText: alt,
    aiDescription: generateAiDescription(refName, type, aiTags),
    isDuplicate: false,
    usageCount: usages.length,
    usages,
    timesUsed: usages.length,
    pagesUsing: usages.length,
    productsUsing: usages.filter((u) => u.source === "product").length,
    articlesUsing: usages.filter((u) => u.source === "article").length,
    collectionsUsing: 0,
    categoriesUsing: usages.filter((u) => u.source === "category").length,
    brandsUsing: usages.filter((u) => u.source === "brand").length,
    authorsUsing: 0,
    templatesUsing: 0,
    campaignsUsing: 0,
    notificationsUsing: 0,
    lastUsed: Date.now(),
    firstUsed: Date.now(),
    mostViewed: Math.floor(Math.random() * 500),
    lastModified: Date.now(),
    qualityScore: 0,
    versions: [versionBase],
    currentVersion: "Original",
    favorited: false,
    favoritedBy: [],
    cdnProvider: "local",
    cdnSynced: true,
    cdnSyncAt: Date.now(),
    auditLog: [{
      action: "upload",
      user: "System",
      role: "Administrator",
      ip: "127.0.0.1",
      browser: "ALAYA DAM Engine",
      device: "Server",
      ts: Date.now(),
      detail: `Asset auto-created from ${source}: ${refName}`,
    }],
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    uploadDate: Date.now(),
    uploader: "System",
    uploaderRole: "Administrator",
    downloadCount: 0,
    shareCount: 0,
    viewCount: 0,
  };

  asset.qualityScore = qualityScore(asset);
  return asset;
}

/* ================================================================== */
/*  INDEXING                                                            */
/* ================================================================== */

/** Index all media from the store into the enterprise asset list. */
export function indexAssets(data: IndexableData): EnterpriseMediaAsset[] {
  const assets: EnterpriseMediaAsset[] = [];
  const seen = new Map<string, number>(); // url → count for tracking multi-usage

  const add = (url: string, source: AssetSource, refId: string, refName: string, index = 0) => {
    if (!url) return;
    seen.set(url, (seen.get(url) || 0) + 1);
    const existing = assets.find((a) => a.url === url);
    if (existing) {
      // Update usage count for existing asset
      existing.usageCount = seen.get(url) || 1;
      existing.timesUsed = existing.usageCount;
      // Add usage if not already there
      if (!existing.usages.some((u) => u.refId === refId && u.field === (index >= 0 ? `images[${index}]` : "image"))) {
        existing.usages.push({
          source, refId, refName,
          field: index >= 0 ? `images[${index}]` : "image", url,
        });
      }
      return;
    }
    const asset = createAsset(url, source, refId, refName, index, data);
    asset.usageCount = seen.get(url) || 1;
    asset.timesUsed = asset.usageCount;
    assets.push(asset);
  };

  data.products.forEach((p: Product) =>
    p.images.forEach((u, i) => add(u, "product", p.id, p.name, i)));
  data.brands.forEach((b: Brand) => {
    add(b.image, "brand", b.id, b.name);
    if (b.logo) add(b.logo, "brand", b.id, b.name, 1);
  });
  data.articles.forEach((a: Article) => add(a.cover, "article", a.id, a.title));
  data.categories.forEach((c) => add(c.image, "category", c.id, c.name));
  data.settings.heroSlides.forEach((s) => add(s.image, "hero", s.id, s.eyebrow));
  if (data.settings.seo.ogImage) add(data.settings.seo.ogImage, "seo", "settings", "SEO OG Image");

  // Calculate quality scores
  assets.forEach((a) => { a.qualityScore = qualityScore(a); });

  return assets;
}

/* ================================================================== */
/*  DUPLICATE DETECTION                                                 */
/* ================================================================== */

export interface DuplicateGroup {
  original: EnterpriseMediaAsset;
  duplicates: EnterpriseMediaAsset[];
  type: "exact" | "near" | "resized" | "compressed";
  confidence: number;
}

export function findDuplicates(assets: EnterpriseMediaAsset[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < assets.length; i++) {
    if (visited.has(assets[i].id)) continue;

    const group: DuplicateGroup = {
      original: assets[i],
      duplicates: [],
      type: "exact",
      confidence: 100,
    };

    for (let j = i + 1; j < assets.length; j++) {
      if (visited.has(assets[j].id)) continue;

      const a = assets[i];
      const b = assets[j];

      // Exact duplicate (same URL)
      if (a.url === b.url) {
        group.duplicates.push(b);
        group.type = "exact";
        visited.add(b.id);
        b.isDuplicate = true;
        b.duplicateOf = a.id;
        continue;
      }

      // Near duplicate (same dimensions + similar name)
      if (a.width === b.width && a.height === b.height &&
          a.refName.toLowerCase() === b.refName.toLowerCase()) {
        group.duplicates.push(b);
        group.type = "near";
        group.confidence = 85;
        visited.add(b.id);
        b.isDuplicate = true;
        b.duplicateOf = a.id;
        b.duplicateScore = 85;
        continue;
      }

      // Resized copy (same aspect ratio + similar name)
      if (Math.abs(a.aspectRatio - b.aspectRatio) < 0.01 &&
          a.refName.toLowerCase().includes(b.refName.toLowerCase())) {
        group.duplicates.push(b);
        group.type = "resized";
        group.confidence = 70;
        visited.add(b.id);
        b.isDuplicate = true;
        b.duplicateOf = a.id;
        b.duplicateScore = 70;
        continue;
      }
    }

    if (group.duplicates.length > 0) {
      groups.push(group);
    }
  }

  return groups;
}

/* ================================================================== */
/*  USAGE ANALYSIS                                                      */
/* ================================================================== */

/** Find unused assets (not referenced by any active entity). */
export function findUnused(assets: EnterpriseMediaAsset[], data: IndexableData): EnterpriseMediaAsset[] {
  const activeUrls = new Set<string>([
    ...data.products.flatMap((p) => p.images),
    ...data.brands.map((b) => b.image),
    ...data.brands.filter((b) => b.logo).map((b) => b.logo!),
    ...data.articles.map((a) => a.cover),
    ...data.categories.map((c) => c.image),
    ...data.settings.heroSlides.map((s) => s.image),
  ]);
  if (data.settings.seo.ogImage) activeUrls.add(data.settings.seo.ogImage);
  return assets.filter((a) => !activeUrls.has(a.url));
}

/* ================================================================== */
/*  SAFE DELETE                                                         */
/* ================================================================== */

export interface DeleteCheckResult {
  safe: boolean;
  usageCount: number;
  usages: AssetUsage[];
  message: string;
}

export function checkSafeDelete(asset: EnterpriseMediaAsset): DeleteCheckResult {
  if (asset.usages.length === 0) {
    return { safe: true, usageCount: 0, usages: [], message: "Asset is not in use — safe to delete." };
  }
  return {
    safe: false,
    usageCount: asset.usages.length,
    usages: asset.usages,
    message: `Asset is used in ${asset.usages.length} location(s). Delete will remove it from all references.`,
  };
}

/* ================================================================== */
/*  OPTIMIZATION                                                        */
/* ================================================================== */

export function optimizeAsset(asset: EnterpriseMediaAsset): EnterpriseMediaAsset {
  const compressedSize = Math.round(asset.sizeKb * 0.6);
  const newVersion: AssetVersion = {
    id: `${asset.id}_opt`,
    label: "Compressed",
    url: asset.url,
    width: asset.width,
    height: asset.height,
    sizeKb: compressedSize,
    format: "WEBP",
    createdAt: Date.now(),
  };

  const webpVersion: AssetVersion = {
    id: `${asset.id}_webp`,
    label: "WebP",
    url: asset.url,
    width: asset.width,
    height: asset.height,
    sizeKb: Math.round(compressedSize * 0.7),
    format: "WEBP",
    createdAt: Date.now(),
  };

  const avifVersion: AssetVersion = {
    id: `${asset.id}_avif`,
    label: "AVIF",
    url: asset.url,
    width: asset.width,
    height: asset.height,
    sizeKb: Math.round(compressedSize * 0.5),
    format: "AVIF",
    createdAt: Date.now(),
  };

  return {
    ...asset,
    optimized: true,
    webp: true,
    avif: true,
    sizeKb: compressedSize,
    compressionRatio: 0.4,
    optimizationStatus: "done",
    webpUrl: asset.url,
    avifUrl: asset.url,
    qualityScore: qualityScore({ ...asset, sizeKb: compressedSize, optimized: true, webp: true, avif: true }),
    versions: [
      ...asset.versions,
      newVersion, webpVersion, avifVersion,
    ],
    auditLog: [
      ...asset.auditLog,
      {
        action: "optimize",
        user: "Administrator",
        role: "Administrator",
        ip: "127.0.0.1",
        browser: "DAM Engine",
        device: "Server",
        ts: Date.now(),
        detail: `Compressed ${asset.sizeKb}KB → ${compressedSize}KB, generated WebP + AVIF`,
      },
    ],
    modifiedAt: Date.now(),
  };
}

/* ================================================================== */
/*  VERSION MANAGEMENT                                                  */
/* ================================================================== */

export function addVersion(asset: EnterpriseMediaAsset, label: string, url: string, width: number, height: number, sizeKb: number, format: string): EnterpriseMediaAsset {
  const version: AssetVersion = {
    id: `${asset.id}_v${asset.versions.length}`,
    label, url, width, height, sizeKb, format,
    createdAt: Date.now(),
  };
  return {
    ...asset,
    versions: [...asset.versions, version],
    currentVersion: label,
    modifiedAt: Date.now(),
  };
}

export function restoreVersion(asset: EnterpriseMediaAsset, versionId: string): EnterpriseMediaAsset {
  const version = asset.versions.find((v) => v.id === versionId);
  if (!version) return asset;
  return {
    ...asset,
    url: version.url,
    width: version.width,
    height: version.height,
    sizeKb: version.sizeKb,
    currentVersion: version.label,
    modifiedAt: Date.now(),
    auditLog: [
      ...asset.auditLog,
      {
        action: "version_restore",
        user: "Administrator",
        role: "Administrator",
        ip: "127.0.0.1",
        browser: "DAM Engine",
        device: "Server",
        ts: Date.now(),
        detail: `Restored version: ${version.label}`,
      },
    ],
  };
}

/* ================================================================== */
/*  MEDIA STATISTICS                                                    */
/* ================================================================== */

export interface DamStats {
  total: number;
  byType: Record<AssetType, number>;
  byFolder: Record<string, number>;
  totalMb: string;
  optimized: number;
  unoptimized: number;
  duplicateCount: number;
  unusedCount: number;
  favoritedCount: number;
  totalVersions: number;
  cdnSynced: number;
  potentialSavingsKb: number;
  topSources: { source: AssetSource; count: number }[];
}

export function mediaStats(assets: EnterpriseMediaAsset[]): DamStats {
  const byType = { image: 0, video: 0, document: 0, audio: 0 };
  const byFolder: Record<string, number> = {};
  let totalKb = 0;
  let optimized = 0;
  let favorited = 0;
  let cdnSynced = 0;
  let totalVersions = 0;
  const sourceCount: Record<string, number> = {};

  assets.forEach((a) => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    byFolder[a.folder] = (byFolder[a.folder] || 0) + 1;
    totalKb += a.sizeKb;
    if (a.optimized) optimized++;
    if (a.favorited) favorited++;
    if (a.cdnSynced) cdnSynced++;
    totalVersions += a.versions.length;
    sourceCount[a.source] = (sourceCount[a.source] || 0) + 1;
  });

  const unoptimized = assets.length - optimized;
  const duplicateCount = assets.filter((a) => a.isDuplicate).length;
  const unusedCount = assets.filter((a) => a.usageCount === 0).length;

  const potentialSavingsKb = assets
    .filter((a) => !a.optimized)
    .reduce((s, a) => s + Math.round(a.sizeKb * 0.4), 0);

  const topSources = Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source: source as AssetSource, count }));

  return {
    total: assets.length,
    byType,
    byFolder,
    totalMb: (totalKb / 1024).toFixed(1),
    optimized,
    unoptimized,
    duplicateCount,
    unusedCount,
    favoritedCount: favorited,
    totalVersions,
    cdnSynced,
    potentialSavingsKb,
    topSources,
  };
}

/* ================================================================== */
/*  FOLDER / SEARCH UTILITIES                                           */
/* ================================================================== */

export type DamFilter = "all" | "images" | "video" | "document" | "audio"
  | "duplicates" | "unused" | "unoptimized" | "favorites";

export function filterAssets(
  assets: EnterpriseMediaAsset[],
  filter: DamFilter,
): EnterpriseMediaAsset[] {
  switch (filter) {
    case "all": return assets;
    case "images": return assets.filter((a) => a.type === "image");
    case "video": return assets.filter((a) => a.type === "video");
    case "document": return assets.filter((a) => a.type === "document");
    case "audio": return assets.filter((a) => a.type === "audio");
    case "duplicates": return assets.filter((a) => a.isDuplicate);
    case "unused": return assets.filter((a) => a.usageCount === 0);
    case "unoptimized": return assets.filter((a) => !a.optimized);
    case "favorites": return assets.filter((a) => a.favorited);
    default: return assets;
  }
}

export function searchAssets(
  assets: EnterpriseMediaAsset[],
  query: string,
): EnterpriseMediaAsset[] {
  if (!query.trim()) return assets;
  const q = query.toLowerCase();
  return assets.filter((a) =>
    a.title.toLowerCase().includes(q) ||
    a.filename.toLowerCase().includes(q) ||
    a.refName.toLowerCase().includes(q) ||
    a.tags.some((t) => t.toLowerCase().includes(q)) ||
    a.folder.toLowerCase().includes(q) ||
    a.source.toLowerCase().includes(q) ||
    a.aiTags.some((t) => t.toLowerCase().includes(q)) ||
    a.alt.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.orientation.toLowerCase().includes(q) ||
    a.dominantColor.toLowerCase().includes(q) ||
    a.fileExtension.toLowerCase().includes(q)
  );
}

export function filterByFolder(
  assets: EnterpriseMediaAsset[],
  folder: FolderName | "all",
): EnterpriseMediaAsset[] {
  if (folder === "all") return assets;
  return assets.filter((a) => a.folder === folder);
}

export function filterBySource(
  assets: EnterpriseMediaAsset[],
  source: AssetSource | "all",
): EnterpriseMediaAsset[] {
  if (source === "all") return assets;
  return assets.filter((a) => a.source === source);
}

/* ================================================================== */
/*  UPLOAD SIMULATION                                                   */
/* ================================================================== */

export interface UploadOptions {
  url: string;
  filename: string;
  source?: AssetSource;
  folder?: FolderName;
  tags?: string[];
  alt?: string;
  title?: string;
  description?: string;
}

export function simulateUpload(
  options: UploadOptions,
  uploader = "Administrator",
  role = "Administrator",
): EnterpriseMediaAsset {
  const meta = deriveMeta(options.url);
  const type = detectType(options.url);
  const orientation = detectOrientation(meta.width, meta.height);
  const id = `dam_upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dominantColor = deriveColor(options.url);
  const hash = deriveHash(options.url);
  const tags = options.tags || [type, meta.ext, options.folder || "upload"];
  const source = options.source || "upload";

  return {
    id,
    url: options.url,
    originalFilename: options.filename,
    filename: options.filename,
    fileExtension: meta.ext,
    type, source,
    refId: id,
    refName: options.title || options.filename,
    title: options.title || options.filename,
    alt: options.alt || genAltText(options.filename, source),
    description: options.description || "",
    caption: generateAiCaption(options.filename, source),
    tags: [...new Set([...tags, ...generateAiTags(options.filename)])],
    sizeKb: meta.sizeKb, width: meta.width, height: meta.height,
    aspectRatio: meta.aspectRatio, orientation,
    colorSpace: "sRGB", dominantColor,
    folder: options.folder || "Uploads",
    collection: "Uploads",
    category: source,
    copyright: `© ${new Date().getFullYear()} ALAYA INSIDER`,
    license: "All rights reserved",
    seoMetadata: {
      title: options.title || options.filename,
      description: generateAiDescription(options.filename, type, tags),
      keywords: tags.slice(0, 5).join(", "),
    },
    cdnUrl: options.url, originalUrl: options.url,
    thumbnailUrl: options.url, webpUrl: options.url,
    avifUrl: options.url, retinaUrl: options.url,
    optimized: type !== "image",
    webp: type !== "image",
    avif: false,
    compressionRatio: type !== "image" ? 1 : 0,
    optimizationStatus: "pending",
    blurPlaceholder: dominantColor,
    dominantColorHex: dominantColor,
    hash, checksum: hash, fingerprint: hash,
    exif: {},
    aiTags: generateAiTags(options.filename),
    aiCaption: generateAiCaption(options.filename, source),
    aiAltText: options.alt || genAltText(options.filename, source),
    aiDescription: generateAiDescription(options.filename, type, tags),
    isDuplicate: false,
    usageCount: 0,
    usages: [],
    timesUsed: 0,
    pagesUsing: 0,
    productsUsing: 0,
    articlesUsing: 0,
    collectionsUsing: 0,
    categoriesUsing: 0,
    brandsUsing: 0,
    authorsUsing: 0,
    templatesUsing: 0,
    campaignsUsing: 0,
    notificationsUsing: 0,
    lastUsed: Date.now(),
    firstUsed: Date.now(),
    mostViewed: 0,
    lastModified: Date.now(),
    qualityScore: qualityScore({
      type, sizeKb: meta.sizeKb, width: meta.width, height: meta.height,
      optimized: type !== "image", webp: type !== "image", avif: false,
      orientation,
    }),
    versions: [{
      id: `${id}_orig`,
      label: "Original",
      url: options.url,
      width: meta.width,
      height: meta.height,
      sizeKb: meta.sizeKb,
      format: meta.ext.toUpperCase(),
      createdAt: Date.now(),
    }],
    currentVersion: "Original",
    favorited: false,
    favoritedBy: [],
    cdnProvider: "local",
    cdnSynced: true,
    cdnSyncAt: Date.now(),
    auditLog: [{
      action: "upload", user: uploader, role,
      ip: "127.0.0.1", browser: "DAM Picker", device: "Web",
      ts: Date.now(),
      detail: `Uploaded by ${uploader} via Global Media Picker`,
    }],
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    uploadDate: Date.now(),
    uploader, uploaderRole: role,
    downloadCount: 0,
    shareCount: 0,
    viewCount: 0,
  };
}
