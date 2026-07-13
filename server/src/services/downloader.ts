/**
 * ALAYA INSIDER — Image Download & Processing Engine
 * --------------------------------------------------------------------------
 * Downloads images from remote URLs, validates them, extracts metadata,
 * generates WebP/AVIF variants, thumbnails, registers in DAM, links to
 * products, and provides progress tracking for bulk operations.
 *
 * Pipeline:
 *   URL → HEAD Validation → Download → Magic Byte Check → Metadata Extraction
 *   → Thumbnail Generation → WebP/AVIF → DAM Registration → Product Update
 */

import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { readFile, writeFile, mkdir, unlink, access } from "node:fs/promises";
import { join, extname, resolve, relative } from "node:path";
import sharp from "sharp";
import { genId, getStore, persistStore } from "../db.js";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const UPLOAD_DIR = join(process.cwd(), "data", "uploads");
const THUMB_DIR = join(UPLOAD_DIR, "thumbnails");
const WEBP_DIR = join(UPLOAD_DIR, "webp");
const AVIF_DIR = join(UPLOAD_DIR, "avif");
const ORIG_DIR = join(UPLOAD_DIR, "originals");

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const DOWNLOAD_TIMEOUT = 30_000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;
const CONCURRENCY_LIMIT = 8; // max parallel downloads for bulk imports
const ALLOWED_MIME_PREFIXES = ["image/"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg", ".bmp", ".tiff", ".tif"];
const THUMB_SIZES = [
  { label: "Thumbnail", width: 150, height: 150 },
  { label: "Medium", width: 600, height: 600 },
  { label: "Large", width: 1200, height: 1200 },
];

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface ImageImportResult {
  success: boolean;
  /** Unique DAM asset ID */
  assetId?: string;
  /** Local URL path to the downloaded image */
  localUrl?: string;
  /** URL path to thumbnail */
  thumbnailUrl?: string;
  /** URL path to WebP variant */
  webpUrl?: string;
  /** URL path to AVIF variant */
  avifUrl?: string;
  /** Original filename */
  filename?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** File size in KB */
  sizeKb?: number;
  /** MIME type */
  mimeType?: string;
  /** SHA-256 hash of the file */
  hash?: string;
  /** Dominant color (hex) */
  dominantColor?: string;
  /** Step at which failure occurred */
  failedAt?: string;
  /** Error message if failed */
  error?: string;
  /** Retry count if applicable */
  retryCount?: number;
  /** Processing latency in ms */
  latencyMs?: number;
}

export interface BulkImportProgress {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  results: ImageImportResult[];
  isComplete: boolean;
  startedAt: number;
}

export interface ImportUrlRequest {
  /** The remote image URL to import */
  url: string;
  /** Optional: product/entity ID to link the image to */
  refId?: string;
  /** Optional: product/entity name for reference */
  refName?: string;
  /** Optional: source description (e.g. "csv", "manual", "api") */
  source?: string;
  /** Optional: image index in the gallery */
  index?: number;
}

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function ensureDirs(): void {
  [UPLOAD_DIR, THUMB_DIR, WEBP_DIR, AVIF_DIR, ORIG_DIR].forEach((dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  });
}

/** Extract file extension from URL or content-type */
function getExtension(url: string, mimeType?: string): string {
  const parsed = new URL(url);
  const ext = extname(parsed.pathname).toLowerCase().split("?")[0];
  if (ext && ALLOWED_EXTENSIONS.includes(ext)) return ext;
  if (mimeType) {
    const map: Record<string, string> = {
      "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
      "image/avif": ".avif", "image/gif": ".gif", "image/svg+xml": ".svg",
      "image/bmp": ".bmp", "image/tiff": ".tiff",
    };
    return map[mimeType] || ".jpg";
  }
  return ".jpg";
}

/** Compute SHA-256 hash of a buffer */
function computeHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Detect dominant color using sharp (samples center pixel as approximation) */
async function detectDominantColor(imagePath: string): Promise<string> {
  try {
    const { dominant } = await sharp(imagePath).stats();
    const r = Math.round(dominant.r).toString(16).padStart(2, "0");
    const g = Math.round(dominant.g).toString(16).padStart(2, "0");
    const b = Math.round(dominant.b).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  } catch {
    return "#9c7a4b"; // fallback
  }
}

/* ================================================================== */
/*  STEP 1: VALIDATE URL                                               */
/* ================================================================== */

async function validateUrl(url: string): Promise<{ valid: boolean; contentType?: string; contentLength?: number; error?: string }> {
  try {
    // Sanitize URL first
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: `Unsupported protocol: ${parsed.protocol}` };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 404) return { valid: false, error: "Image Not Found (404)" };
    if (response.status === 403) return { valid: false, error: "Forbidden (403)" };
    if (response.status === 401) return { valid: false, error: "Authentication Required (401)" };
    if (response.status >= 400) return { valid: false, error: `HTTP ${response.status}` };

    const contentType = response.headers.get("content-type") || "";
    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);

    if (!ALLOWED_MIME_PREFIXES.some((p) => contentType.startsWith(p))) {
      return { valid: false, error: `Unsupported format: ${contentType}` };
    }

    if (contentLength > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large: ${(contentLength / 1024 / 1024).toFixed(1)} MB (max ${MAX_FILE_SIZE / 1024 / 1024} MB)` };
    }

    return { valid: true, contentType, contentLength };
  } catch (error: any) {
    if (error?.name === "AbortError") return { valid: false, error: "Connection Timeout" };
    if (error?.code === "ENOTFOUND") return { valid: false, error: "Connection Failed — URL not reachable" };
    return { valid: false, error: `Validation Error: ${error?.message || "Unknown"}` };
  }
}

/* ================================================================== */
/*  STEP 2: DOWNLOAD IMAGE                                             */
/* ================================================================== */

async function downloadImage(url: string, destination: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, buffer);
  } catch (error: any) {
    clearTimeout(timeout);
    throw error;
  }
}

/* ================================================================== */
/*  STEP 3: VALIDATE MAGIC BYTES                                       */
/* ================================================================== */

const MAGIC_BYTES: { magic: number[]; mime: string; ext: string }[] = [
  { magic: [0xFF, 0xD8, 0xFF], mime: "image/jpeg", ext: ".jpg" },
  { magic: [0x89, 0x50, 0x4E, 0x47], mime: "image/png", ext: ".png" },
  { magic: [0x52, 0x49, 0x46, 0x46], mime: "image/webp", ext: ".webp" },
  { magic: [0x47, 0x49, 0x46], mime: "image/gif", ext: ".gif" },
  { magic: [0x42, 0x4D], mime: "image/bmp", ext: ".bmp" },
  { magic: [0x49, 0x49, 0x2A, 0x00], mime: "image/tiff", ext: ".tiff" },
  { magic: [0x4D, 0x4D, 0x00, 0x2A], mime: "image/tiff", ext: ".tiff" },
  { magic: [0x00, 0x00, 0x01, 0x00], mime: "image/x-icon", ext: ".ico" },
  { magic: [0x41, 0x56, 0x30, 0x31], mime: "image/avif", ext: ".avif" },
];

function validateMagicBytes(buffer: Buffer): { valid: boolean; mime: string; ext: string } {
  for (const entry of MAGIC_BYTES) {
    const matches = entry.magic.every((byte, i) => buffer[i] === byte);
    if (matches) return { valid: true, mime: entry.mime, ext: entry.ext };
  }

  // Check for SVG (text-based, starts with <svg or <?xml)
  const header = buffer.slice(0, 200).toString("utf-8").trim();
  if (header.startsWith("<svg") || header.startsWith("<?xml") || header.startsWith("<!DOCTYPE svg")) {
    return { valid: true, mime: "image/svg+xml", ext: ".svg" };
  }

  return { valid: false, mime: "unknown", ext: ".bin" };
}

/* ================================================================== */
/*  STEP 4: EXTRACT METADATA                                           */
/* ================================================================== */

interface ImageMetadata {
  width: number;
  height: number;
  orientation: "portrait" | "landscape" | "square";
  format: string;
  space: string;
  hasAlpha: boolean;
  exif: Record<string, string>;
}

async function extractMetadata(imagePath: string): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(imagePath).metadata();
    const w = metadata.width || 0;
    const h = metadata.height || 0;
    const orientation: "portrait" | "landscape" | "square" =
      w > h ? "landscape" : h > w ? "portrait" : "square";

    return {
      width: w,
      height: h,
      orientation,
      format: (metadata.format || "jpeg").toUpperCase(),
      space: metadata.space || "srgb",
      hasAlpha: Boolean(metadata.hasAlpha),
      exif: metadata.exif
        ? { extracted: `EXIF present (${metadata.exif.length} bytes)`, software: metadata.iptc ? "embedded" : "none" }
        : {},
    };
  } catch (error: any) {
    throw new Error(`Metadata extraction failed: ${error.message}`);
  }
}

/* ================================================================== */
/*  STEP 5: GENERATE VARIANTS                                          */
/* ================================================================== */

interface GeneratedVariant {
  path: string;
  sizeKb: number;
  label: string;
  width: number;
  height: number;
}

async function generateVariants(originalPath: string, assetId: string): Promise<GeneratedVariant[]> {
  const variants: GeneratedVariant[] = [];

  for (const size of THUMB_SIZES) {
    const outputPath = join(THUMB_DIR, `${assetId}_${size.label.toLowerCase()}.webp`);
    try {
      const result = await sharp(originalPath)
        .resize(size.width, size.height, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      variants.push({
        path: outputPath,
        sizeKb: Math.round(result.size / 1024),
        label: size.label,
        width: result.width,
        height: result.height,
      });
    } catch {
      // Silently skip failed variant
    }
  }

  // Generate WebP
  try {
    const webpPath = join(WEBP_DIR, `${assetId}.webp`);
    const webpResult = await sharp(originalPath)
      .webp({ quality: 85, effort: 4 })
      .toFile(webpPath);
    variants.push({
      path: webpPath,
      sizeKb: Math.round(webpResult.size / 1024),
      label: "WebP",
      width: webpResult.width,
      height: webpResult.height,
    });
  } catch {
    // WebP generation failed — non-critical
  }

  // Generate AVIF
  try {
    const avifPath = join(AVIF_DIR, `${assetId}.avif`);
    const avifResult = await sharp(originalPath)
      .avif({ quality: 75, effort: 4 })
      .toFile(avifPath);
    variants.push({
      path: avifPath,
      sizeKb: Math.round(avifResult.size / 1024),
      label: "AVIF",
      width: avifResult.width,
      height: avifResult.height,
    });
  } catch {
    // AVIF generation failed — non-critical if Node version doesn't support it
  }

  return variants;
}

/* ================================================================== */
/*  STEP 6: REGISTER IN DAM                                            */
/* ================================================================== */

interface DamAssetRecord {
  id: string;
  url: string;
  thumbnailUrl: string;
  webpUrl: string;
  avifUrl: string;
  filename: string;
  mimeType: string;
  sizeKb: number;
  width: number;
  height: number;
  orientation: "portrait" | "landscape" | "square";
  hash: string;
  dominantColor: string;
  source: string;
  refId: string;
  refName: string;
  importedAt: number;
  optimized: boolean;
}

function registerInDam(result: ImageImportResult, source: string, refId: string, refName: string): DamAssetRecord {
  const store = getStore() as any;

  if (!store.damAssets) store.damAssets = [];

  const record: DamAssetRecord = {
    id: result.assetId!,
    url: result.localUrl!,
    thumbnailUrl: result.thumbnailUrl || result.localUrl!,
    webpUrl: result.webpUrl || result.localUrl!,
    avifUrl: result.avifUrl || result.localUrl!,
    filename: result.filename || "unknown",
    mimeType: result.mimeType || "image/jpeg",
    sizeKb: result.sizeKb || 0,
    width: result.width || 0,
    height: result.height || 0,
    orientation: result.width! > result.height! ? "landscape" : result.height! > result.width! ? "portrait" : "square",
    hash: result.hash || "",
    dominantColor: result.dominantColor || "#9c7a4b",
    source,
    refId,
    refName: refName || "Imported Image",
    importedAt: Date.now(),
    optimized: true,
  };

  store.damAssets.push(record);
  persistStore(store);
  return record;
}

/* ================================================================== */
/*  MAIN IMPORT FUNCTION                                               */
/* ================================================================== */

const importProgress = new Map<string, BulkImportProgress>();

/** Full asset record returned by duplicate detection */
interface DuplicateAsset {
  id: string;
  url: string;
  dominantColor: string;
}

/** Check if a hash already exists in DAM assets (duplicate detection) */
function findExistingByHash(hash: string): DuplicateAsset | null {
  try {
    const store = getStore() as any;
    if (!store.damAssets) return null;
    const existing = store.damAssets.find((a: any) => a.hash === hash);
    return existing
      ? { id: existing.id, url: existing.url, dominantColor: existing.dominantColor || "#9c7a4b" }
      : null;
  } catch {
    return null;
  }
}

/**
 * Import a single image from a remote URL.
 * Full pipeline: Validate → Download → Magic Bytes → Metadata → Variants → DAM
 */
export async function importImageUrl(request: ImportUrlRequest): Promise<ImageImportResult> {
  const startTime = performance.now();
  const { url, refId = "import", refName = "Imported Image", source = "import", index = 0 } = request;

  ensureDirs();

  // --- STEP 1: Validate URL ---
  const validation = await validateUrl(url);
  if (!validation.valid) {
    return {
      success: false,
      failedAt: "url_validation",
      error: validation.error || "URL validation failed",
      latencyMs: Math.round(performance.now() - startTime),
      retryCount: 0,
    };
  }

  // --- STEP 2: Download ---
  const ext = getExtension(url, validation.contentType);
  const assetId = `img_${genId("imp")}`;
  const origPath = join(ORIG_DIR, `${assetId}${ext}`);

  try {
    await downloadImage(url, origPath);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      failedAt: "download",
      error: `Download failed: ${msg}`,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  // --- STEP 3: Validate Magic Bytes ---
  let imageBuffer: Buffer;
  try {
    imageBuffer = await readFile(origPath);
  } catch {
    return {
      success: false,
      failedAt: "file_read",
      error: "Failed to read downloaded file",
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  const magicCheck = validateMagicBytes(imageBuffer);
  if (!magicCheck.valid) {
    // Clean up corrupted file
    await unlink(origPath).catch(() => {});
    return {
      success: false,
      failedAt: "magic_bytes",
      error: "Corrupted image — magic bytes validation failed",
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  // --- STEP 4: Extract Metadata ---
  let metadata: ImageMetadata;
  try {
    metadata = await extractMetadata(origPath);
  } catch (error: unknown) {
    await unlink(origPath).catch(() => {});
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      failedAt: "metadata",
      error: `Metadata extraction failed: ${msg}`,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  // --- STEP 5: Generate Hash & Check Duplicates ---
  const hash = computeHash(imageBuffer);
  const existing = findExistingByHash(hash);
  if (existing) {
    // Duplicate detected — clean up the newly downloaded file and return the existing asset's data
    await unlink(origPath).catch(() => {});
    return {
      success: true,
      assetId: existing.id,
      localUrl: existing.url,
      thumbnailUrl: existing.url.replace('/originals/', '/thumbnails/'),
      webpUrl: existing.url.replace('/originals/', '/webp/').replace(/\.[^.]+$/, '.webp'),
      avifUrl: existing.url.replace('/originals/', '/avif/').replace(/\.[^.]+$/, '.avif'),
      filename: existing.url.split('/').pop(),
      width: metadata.width,
      height: metadata.height,
      sizeKb: Math.round(imageBuffer.length / 1024),
      mimeType: magicCheck.mime,
      hash,
      dominantColor: existing.dominantColor,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  // --- STEP 6: Detect Dominant Color ---
  const dominantColor = await detectDominantColor(origPath);

  // --- STEP 7: Generate Variants ---
  const variants = await generateVariants(origPath, assetId);

  // --- STEP 8: Build local URL paths ---
  const localUrl = `/uploads/originals/${assetId}${ext}`;
  const thumbnailVariant = variants.find((v) => v.label === "Thumbnail");
  const webpVariant = variants.find((v) => v.label === "WebP");
  const avifVariant = variants.find((v) => v.label === "AVIF");

  const result: ImageImportResult = {
    success: true,
    assetId,
    localUrl,
    thumbnailUrl: thumbnailVariant ? `/uploads/thumbnails/${assetId}_thumbnail.webp` : localUrl,
    webpUrl: webpVariant ? `/uploads/webp/${assetId}.webp` : localUrl,
    avifUrl: avifVariant ? `/uploads/avif/${assetId}.avif` : localUrl,
    filename: `${assetId}${ext}`,
    width: metadata.width,
    height: metadata.height,
    sizeKb: Math.round(imageBuffer.length / 1024),
    mimeType: magicCheck.mime,
    hash,
    dominantColor,
    latencyMs: Math.round(performance.now() - startTime),
  };

  // --- STEP 9: Register in DAM ---
  registerInDam(result, source, refId, refName);

  return result;
}

/**
 * Import multiple image URLs and update a product's images with local URLs.
 * Returns results for each URL with retry logic.
 */
export async function importProductImages(
  urls: string[],
  refId: string,
  refName: string,
  source = "csv",
): Promise<{ results: ImageImportResult[]; localUrls: string[] }> {
  const results: ImageImportResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!url) continue;

    let result: ImageImportResult | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      result = await importImageUrl({
        url,
        refId,
        refName: `${refName} image ${i + 1}`,
        source,
        index: i,
      });

      if (result.success) break;

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }

    results.push(result!);
  }

  // Return only original local URLs — variants are served automatically via <picture>/srcset
  const localUrls = results
    .filter((r) => r.success)
    .map((r) => r.localUrl!);

  return { results, localUrls };
}

/** Clean up old completed progress entries (runs every 5 minutes) */
function startProgressCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [batchId, progress] of importProgress.entries()) {
      if (progress.isComplete && (now - progress.startedAt) > 10 * 60 * 1000) {
        importProgress.delete(batchId);
      }
    }
  }, 5 * 60 * 1000);
}
// Start cleanup on module load
startProgressCleanup();

/**
 * Start a bulk import with progress tracking.
 */
export function startBulkImport(urls: ImportUrlRequest[], batchId: string): BulkImportProgress {
  const progress: BulkImportProgress = {
    total: urls.length,
    completed: 0,
    failed: 0,
    skipped: 0,
    results: [],
    isComplete: false,
    startedAt: Date.now(),
  };

  importProgress.set(batchId, progress);

  // Process asynchronously
  processBulkImport(urls, batchId).catch((err) => {
    console.error(`[IMPORT] Bulk import ${batchId} failed: ${err.message}`);
  });

  return progress;
}

/**
 * Process bulk imports with a concurrency-limited pool.
 * Images are downloaded in parallel batches of CONCURRENCY_LIMIT at a time
 * to maximize throughput without overwhelming the server or remote sources.
 */
async function processBulkImport(urls: ImportUrlRequest[], batchId: string): Promise<void> {
  const progress = importProgress.get(batchId);
  if (!progress) return;

  // Process in batches of CONCURRENCY_LIMIT for controlled parallelism
  for (let i = 0; i < urls.length; i += CONCURRENCY_LIMIT) {
    const batch = urls.slice(i, i + CONCURRENCY_LIMIT);

    // Launch all downloads in this batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map((req) => importImageUrl(req)),
    );

    // Collect results in order
    for (const settled of batchResults) {
      if (settled.status === "fulfilled") {
        const result = settled.value;
        progress.results.push(result);
        if (result.success) {
          progress.completed++;
        } else {
          progress.failed++;
        }
      } else {
        // Promise rejection (shouldn't happen — importImageUrl catches all errors)
        const errMsg = settled.reason instanceof Error ? settled.reason.message : String(settled.reason || "Unknown batch error");
        progress.results.push({
          success: false,
          failedAt: "batch_error",
          error: errMsg,
        });
        progress.failed++;
      }
    }
  }

  progress.isComplete = true;
}

/**
 * Get the current progress of a bulk import.
 */
export function getBulkImportProgress(batchId: string): BulkImportProgress | null {
  return importProgress.get(batchId) || null;
}

/**
 * Safely resolve an upload path with path traversal protection.
 * Strips /uploads/ prefix and resolves relative to UPLOAD_DIR.
 * Throws if the resolved path escapes outside UPLOAD_DIR.
 */
export function getUploadPath(relativePath: string): string {
  // Strip /uploads/ prefix if present
  const clean = relativePath.replace(/^\/?uploads\//, "");
  const resolved = resolve(UPLOAD_DIR, clean);
  // Guard against path traversal (e.g. "../../etc/passwd")
  if (!resolved.startsWith(UPLOAD_DIR)) {
    throw new Error(`Invalid path: ${relativePath} escapes upload directory`);
  }
  return resolved;
}

/**
 * Check if a file exists in the uploads directory.
 */
export function uploadFileExists(relativePath: string): boolean {
  try {
    return existsSync(getUploadPath(relativePath));
  } catch {
    return false;
  }
}
