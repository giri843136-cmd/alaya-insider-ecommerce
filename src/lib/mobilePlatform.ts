/* ==========================================================================
 *  ALAYA INSIDER — Mobile Platform & PWA Engine
 *
 *  Central module for:
 *    - Service Worker lifecycle & registration
 *    - PWA manifest configuration
 *    - Offline queue & background sync
 *    - Data sync manager & conflict resolution
 *    - Device / capability detection
 *    - Network & connectivity awareness
 *    - Gesture & touch helpers
 *    - Voice (SpeechRecognition / SpeechSynthesis)
 *    - Performance monitoring (Core Web Vitals)
 *    - Accessibility utilities
 *    - Orientation handling
 * ========================================================================== */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DeviceCategory = "mobile" | "tablet" | "desktop" | "foldable" | "large" | "tv" | "unknown";

export type ConnectionType = "wifi" | "cellular" | "ethernet" | "unknown" | "none";

export type SyncStatus = "idle" | "syncing" | "error" | "conflict";

export type SyncDirection = "push" | "pull" | "bidirectional";

export interface DeviceInfo {
  category: DeviceCategory;
  touch: boolean;
  orientation: "portrait" | "landscape";
  screenW: number;
  screenH: number;
  pixelRatio: number;
  darkMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  voiceSupported: boolean;
  webgl: boolean;
  webp: boolean;
  avif: boolean;
  serviceWorker: boolean;
  indexedDb: boolean;
  online: boolean;
  connection: ConnectionType;
  battery: number | null;
  memory: number | null;
  cores: number | null;
}

export interface OfflineEntry<T = unknown> {
  id: string;
  action: string;
  payload: T;
  createdAt: number;
  retries: number;
  maxRetries: number;
  status: "pending" | "syncing" | "completed" | "failed";
}

export interface SyncConfig {
  key: string;
  direction: SyncDirection;
  pullUrl?: string;
  pushUrl?: string;
  intervalMs?: number;
  onConflict?: (local: unknown, remote: unknown) => unknown;
}

export interface SyncSnapshot {
  key: string;
  data: unknown;
  version: number;
  timestamp: number;
}

export interface MetricVital {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

export interface PerformanceReport {
  lcp: MetricVital | null;
  cls: MetricVital | null;
  inp: MetricVital | null;
  fcp: MetricVital | null;
  ttfb: MetricVital | null;
  timestamp: number;
}

export interface InstallEvent {
  platform: string;
  promptShown: number;
  installed: boolean;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Device detection                                                   */
/* ------------------------------------------------------------------ */

let _deviceCache: DeviceInfo | null = null;

export function getDeviceInfo(): DeviceInfo {
  if (_deviceCache) return _deviceCache;

  const w = typeof window === "undefined" ? 0 : window.innerWidth;
  const h = typeof window === "undefined" ? 0 : window.innerHeight;
  const pr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const touch = typeof window !== "undefined" && "ontouchstart" in window;
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  let category: DeviceCategory = "desktop";
  if (w < 640) category = "mobile";
  else if (w < 1024) category = "tablet";
  else if (w < 1440) category = "desktop";
  else if (w >= 2560) category = "large";

  // Foldable detection — simple check based on unusual aspect ratio
  const aspect = w / h;
  if (category === "tablet" && (aspect > 1.8 || aspect < 0.55)) {
    category = "foldable";
  }

  let connection: ConnectionType = "unknown";
  if (typeof navigator !== "undefined") {
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.type === "wifi") connection = "wifi";
      else if (conn.type === "cellular") connection = "cellular";
      else if (conn.type === "ethernet") connection = "ethernet";
      else if (!online) connection = "none";
    } else if (!online) {
      connection = "none";
    }
  }

  const device: DeviceInfo = {
    category,
    touch,
    orientation: w > h ? "landscape" : "portrait",
    screenW: w,
    screenH: h,
    pixelRatio: pr,
    darkMode: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
    reducedMotion: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: typeof window !== "undefined" && window.matchMedia("(prefers-contrast: high)").matches,
    voiceSupported: typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    webgl: typeof window !== "undefined" && (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("webgl2")); } catch { return false; } })(),
    webp: typeof window !== "undefined" && document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp"),
    avif: false, // heuristic check skipped
    serviceWorker: "serviceWorker" in (navigator || {}),
    indexedDb: typeof window !== "undefined" && !!window.indexedDB,
    online,
    connection,
    battery: null,
    memory: (navigator as any).deviceMemory || null,
    cores: navigator.hardwareConcurrency || null,
  };

  _deviceCache = device;
  return device;
}

export function clearDeviceCache() {
  _deviceCache = null;
}

/* ------------------------------------------------------------------ */
/*  Network detection                                                   */
/* ------------------------------------------------------------------ */

export type NetworkListener = (online: boolean, connection: ConnectionType) => void;

const networkListeners: Set<NetworkListener> = new Set();

export function listenNetwork(cb: NetworkListener): () => void {
  networkListeners.add(cb);
  return () => { networkListeners.delete(cb); };
}

export function initNetworkDetection() {
  if (typeof window === "undefined") return;
  const handler = () => {
    clearDeviceCache();
    const info = getDeviceInfo();
    networkListeners.forEach((cb) => cb(info.online, info.connection));
  };
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  if ((navigator as any).connection) {
    (navigator as any).connection.addEventListener("change", handler);
  }
}

/* ------------------------------------------------------------------ */
/*  Orientation                                                         */
/* ------------------------------------------------------------------ */

export type OrientationListener = (orientation: "portrait" | "landscape") => void;

const orientationListeners: Set<OrientationListener> = new Set();

export function listenOrientation(cb: OrientationListener): () => void {
  orientationListeners.add(cb);
  return () => { orientationListeners.delete(cb); };
}

export function initOrientationDetection() {
  if (typeof window === "undefined") return;
  const handler = () => {
    clearDeviceCache();
    const info = getDeviceInfo();
    orientationListeners.forEach((cb) => cb(info.orientation));
  };
  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
}

/* ------------------------------------------------------------------ */
/*  PWA Manifest & Install                                              */
/* ------------------------------------------------------------------ */

export const PWA_MANIFEST = {
  name: "ALAYA INSIDER",
  short_name: "ALAYA",
  description: "Premium Editorial Shopping — curated luxury beauty, leather goods, fine jewelry, fragrance and digital style guides.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  display_override: ["window-controls-overlay", "standalone", "browser"],
  orientation: "any",
  theme_color: "#f7f4ef",
  background_color: "#f7f4ef",
  categories: ["shopping", "lifestyle", "fashion", "luxury"],
  lang: "en",
  dir: "ltr",
  prefer_related_applications: false,
  iarc_rating_id: "e0f7b4a2-1c3d-4e5f-6a7b-8c9d0e1f2a3b",
  edge_side_panel: { preferred_width: 480 },
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  screenshots: [
    { src: "/screenshots/home-mobile.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "ALAYA INSIDER Home" },
    { src: "/screenshots/home-desktop.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "ALAYA INSIDER Desktop" },
  ],
  shortcuts: [
    { name: "Shop", short_name: "Shop", url: "/shop", icons: [{ src: "/icons/shop-icon.png", sizes: "96x96" }] },
    { name: "Cart", short_name: "Cart", url: "/cart", icons: [{ src: "/icons/cart-icon.png", sizes: "96x96" }] },
    { name: "Wishlist", short_name: "Wishlist", url: "/wishlist", icons: [{ src: "/icons/wishlist-icon.png", sizes: "96x96" }] },
    { name: "Account", short_name: "Account", url: "/account", icons: [{ src: "/icons/account-icon.png", sizes: "96x96" }] },
  ],
  related_applications: [],
  handle_links: "preferred",
  launch_handler: { client_mode: ["navigate-existing", "auto"] },
} as const;

export interface InstallPromptResult {
  outcome: "accepted" | "dismissed" | "not-supported";
  platform?: string;
}

let _deferredPrompt: any = null;
let _installListeners: Array<(result: InstallPromptResult) => void> = [];

export function listenInstall(cb: (result: InstallPromptResult) => void): () => void {
  _installListeners.push(cb);
  return () => {
    _installListeners = _installListeners.filter((l) => l !== cb);
  };
}

export function initPwaInstall() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    // Store the event so the Install App button can trigger it later.
    // We DO NOT call e.preventDefault() here — that would suppress the
    // browser's native install banner without showing an alternative.
    // The custom Install button (if displayed) calls showInstallPrompt().
    _deferredPrompt = e;
  });
  window.addEventListener("appinstalled", () => {
    const event: InstallEvent = {
      platform: (navigator as any).standalone ? "ios" : "pwa",
      promptShown: 1,
      installed: true,
      timestamp: Date.now(),
    };
    try {
      const raw = localStorage.getItem("alaya_pwa_install");
      const prev: InstallEvent[] = raw ? JSON.parse(raw) : [];
      prev.push(event);
      localStorage.setItem("alaya_pwa_install", JSON.stringify(prev.slice(-10)));
    } catch { /* ignore */ }
    _installListeners.forEach((cb) => cb({ outcome: "accepted", platform: "pwa" }));
    _deferredPrompt = null;
  });
}

export async function showInstallPrompt(): Promise<InstallPromptResult> {
  if (!_deferredPrompt) return { outcome: "not-supported" };
  _deferredPrompt.prompt();
  const result = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  _installListeners.forEach((cb) => cb(result));
  return result;
}

export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

/* ------------------------------------------------------------------ */
/*  Service Worker                                                      */
/* ------------------------------------------------------------------ */

export type SwStatus = "unregistered" | "registering" | "active" | "error";

let _swStatus: SwStatus = "unregistered";

export function getSwStatus(): SwStatus {
  return _swStatus;
}

export type SwListener = (status: SwStatus) => void;
const swListeners: Set<SwListener> = new Set();

export function listenSw(cb: SwListener): () => void {
  swListeners.add(cb);
  return () => { swListeners.delete(cb); };
}

export async function registerServiceWorker(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    _swStatus = "error";
    return false;
  }
  try {
    _swStatus = "registering";
    swListeners.forEach((cb) => cb(_swStatus));
    const reg = await navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
      updateViaCache: "none",
    });
    _swStatus = "active";
    swListeners.forEach((cb) => cb(_swStatus));

    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (installing) {
        installing.addEventListener("statechange", () => {
          if (installing.state === "activated") {
            swListeners.forEach((cb) => cb("active"));
          }
        });
      }
    });

    return true;
  } catch {
    _swStatus = "error";
    swListeners.forEach((cb) => cb(_swStatus));
    return false;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    await reg.unregister();
    _swStatus = "unregistered";
    swListeners.forEach((cb) => cb(_swStatus));
    return true;
  }
  return false;
}

export function sendSwMessage(message: Record<string, unknown>) {
  if (typeof navigator === "undefined" || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage(message);
}

/* ------------------------------------------------------------------ */
/*  Offline Queue                                                        */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "alaya_offline_queue";

function getQueue<T = unknown>(): OfflineEntry<T>[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue<T>(queue: OfflineEntry<T>[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full */
  }
}

export function enqueueOffline<T>(action: string, payload: T, maxRetries = 3): OfflineEntry<T> {
  const queue = getQueue();
  const entry: OfflineEntry<T> = {
    id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    payload,
    createdAt: Date.now(),
    retries: 0,
    maxRetries,
    status: "pending",
  };
  queue.push(entry as OfflineEntry<unknown>);
  saveQueue(queue);
  return entry;
}

export function getOfflineQueue(): OfflineEntry[] {
  return getQueue();
}

export function removeOfflineEntry(id: string) {
  const queue = getQueue();
  saveQueue(queue.filter((e) => e.id !== id));
}

export function retryOfflineEntry(id: string) {
  const queue = getQueue();
  const entry = queue.find((e) => e.id === id);
  if (entry && entry.retries < entry.maxRetries) {
    entry.retries++;
    entry.status = "pending";
    saveQueue(queue);
  }
}

export function clearCompletedQueue() {
  const queue = getQueue();
  saveQueue(queue.filter((e) => e.status !== "completed"));
}

export function processOfflineQueue(processor: (entry: OfflineEntry) => Promise<boolean>): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  const pending = queue.filter((e) => e.status === "pending" && e.retries < e.maxRetries);
  if (pending.length === 0) return Promise.resolve({ success: 0, failed: 0 });

  return Promise.all(
    pending.map(async (entry) => {
      entry.status = "syncing";
      saveQueue(queue);
      try {
        const ok = await processor(entry);
        if (ok) {
          entry.status = "completed";
        } else {
          entry.retries++;
          entry.status = entry.retries >= entry.maxRetries ? "failed" : "pending";
        }
      } catch {
        entry.retries++;
        entry.status = entry.retries >= entry.maxRetries ? "failed" : "pending";
      }
      saveQueue(queue);
      return entry.status === "completed";
    })
  ).then((results) => ({
    success: results.filter(Boolean).length,
    failed: results.filter((r) => !r).length,
  }));
}

/* ------------------------------------------------------------------ */
/*  Sync Manager                                                        */
/* ------------------------------------------------------------------ */

const SYNC_PREFIX = "alaya_sync_";

export function initSync(config: SyncConfig) {
  try {
    const existing = localStorage.getItem(`${SYNC_PREFIX}${config.key}_meta`);
    if (!existing) {
      localStorage.setItem(`${SYNC_PREFIX}${config.key}_meta`, JSON.stringify({ version: 0, lastSync: 0 }));
    }
  } catch { /* ignore */ }
}

export function getSyncSnapshot(key: string): SyncSnapshot | null {
  try {
    const data = localStorage.getItem(`${SYNC_PREFIX}${key}_data`);
    const meta = localStorage.getItem(`${SYNC_PREFIX}${key}_meta`);
    if (!meta) return null;
    const m = JSON.parse(meta);
    return {
      key,
      data: data ? JSON.parse(data) : null,
      version: m.version,
      timestamp: m.lastSync,
    };
  } catch {
    return null;
  }
}

export function saveSyncSnapshot(key: string, data: unknown) {
  try {
    const metaRaw = localStorage.getItem(`${SYNC_PREFIX}${key}_meta`);
    const meta = metaRaw ? JSON.parse(metaRaw) : { version: 0, lastSync: 0 };
    meta.version++;
    meta.lastSync = Date.now();
    localStorage.setItem(`${SYNC_PREFIX}${key}_data`, JSON.stringify(data));
    localStorage.setItem(`${SYNC_PREFIX}${key}_meta`, JSON.stringify(meta));
  } catch { /* ignore */ }
}

export function resolveSyncConflict(local: SyncSnapshot, remote: SyncSnapshot): SyncSnapshot {
  // Simple last-writer-wins based on timestamp
  if (remote.timestamp >= local.timestamp) return remote;
  return local;
}

export function getAllSyncKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(SYNC_PREFIX) && k.endsWith("_meta")) {
      keys.push(k.replace(SYNC_PREFIX, "").replace("_meta", ""));
    }
  }
  return keys;
}

/* ------------------------------------------------------------------ */
/*  Data persistence helpers (IndexedDB wrapper)                       */
/* ------------------------------------------------------------------ */

const DB_NAME = "alaya_offline";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "url" });
      }
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store: string, key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put({ key, value, updated: Date.now() });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch { /* fallback to localstorage */ }
}

export async function dbGet<T>(store: string, key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => {
        db.close();
        resolve(req.result?.value ?? null);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

export async function dbDelete(store: string, key: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch { /* ignore */ }
}

export async function dbClear(store: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Voice (SpeechRecognition / SpeechSynthesis)                        */
/* ------------------------------------------------------------------ */

export interface VoiceResult {
  transcript: string;
  confidence: number;
  final: boolean;
}

export type VoiceListener = (result: VoiceResult) => void;

let _recognition: any = null;
const voiceListeners: Set<VoiceListener> = new Set();

export function listenVoice(cb: VoiceListener): () => void {
  voiceListeners.add(cb);
  return () => { voiceListeners.delete(cb); };
}

export function startVoiceRecognition(lang = "en-US"): boolean {
  if (typeof window === "undefined") return false;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return false;

  if (_recognition) stopVoiceRecognition();

  _recognition = new SpeechRecognition();
  _recognition.lang = lang;
  _recognition.continuous = true;
  _recognition.interimResults = true;
  _recognition.maxAlternatives = 1;

  _recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      voiceListeners.forEach((cb) =>
        cb({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          final: result.isFinal,
        })
      );
    }
  };

  _recognition.onerror = () => {
    stopVoiceRecognition();
  };

  _recognition.start();
  return true;
}

export function stopVoiceRecognition() {
  if (_recognition) {
    try { _recognition.stop(); } catch { /* ignore */ }
    _recognition = null;
  }
}

export function speakText(text: string, lang = "en-US"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

/* ------------------------------------------------------------------ */
/*  Performance Monitoring (Core Web Vitals)                           */
/* ------------------------------------------------------------------ */

let _performanceListeners: Set<(report: PerformanceReport) => void> = new Set();

export function listenPerformance(cb: (report: PerformanceReport) => void): () => void {
  _performanceListeners.add(cb);
  return () => { _performanceListeners.delete(cb); };
}

export function initPerformanceMonitoring() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  const report: PerformanceReport = {
    lcp: null,
    cls: null,
    inp: null,
    fcp: null,
    ttfb: null,
    timestamp: Date.now(),
  };

  // LCP
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const last = entries[entries.length - 1];
        report.lcp = {
          name: "LCP",
          value: last.startTime,
          rating: last.startTime < 2500 ? "good" : last.startTime < 4000 ? "needs-improvement" : "poor",
          timestamp: Date.now(),
        };
        _performanceListeners.forEach((cb) => cb({ ...report }));
      }
    });
    lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* ignore */ }

  // CLS
  try {
    let clsValue = 0;
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value || 0;
        }
      }
      report.cls = {
        name: "CLS",
        value: clsValue,
        rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor",
        timestamp: Date.now(),
      };
      _performanceListeners.forEach((cb) => cb({ ...report }));
    });
    clsObs.observe({ type: "layout-shift", buffered: true });
  } catch { /* ignore */ }

  // INP via first-input / event
  try {
    const inpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const inp = entry as any;
        report.inp = {
          name: "INP",
          value: inp.duration || 0,
          rating: (inp.duration || 0) < 200 ? "good" : (inp.duration || 0) < 500 ? "needs-improvement" : "poor",
          timestamp: Date.now(),
        };
        _performanceListeners.forEach((cb) => cb({ ...report }));
      }
    });
    inpObs.observe({ type: "first-input", buffered: true } as any);
    // Also try event type
    inpObs.observe({ type: "event", durationThreshold: 100, buffered: true } as any);
  } catch { /* ignore */ }

  // FCP
  try {
    const fcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const fcp = entries[0];
        report.fcp = {
          name: "FCP",
          value: fcp.startTime,
          rating: fcp.startTime < 1800 ? "good" : fcp.startTime < 3000 ? "needs-improvement" : "poor",
          timestamp: Date.now(),
        };
        _performanceListeners.forEach((cb) => cb({ ...report }));
      }
    });
    fcpObs.observe({ type: "paint", buffered: true });
  } catch { /* ignore */ }

  // TTFB via navigation
  try {
    const nav = performance.getEntriesByType("navigation")[0] as any;
    if (nav) {
      report.ttfb = {
        name: "TTFB",
        value: nav.responseStart,
        rating: nav.responseStart < 800 ? "good" : nav.responseStart < 1800 ? "needs-improvement" : "poor",
        timestamp: Date.now(),
      };
    }
  } catch { /* ignore */ }

  // Store initial report
  report.timestamp = Date.now();
  try {
    localStorage.setItem("alaya_performance", JSON.stringify(report));
  } catch { /* ignore */ }
}

export function getPerformanceReport(): PerformanceReport | null {
  try {
    const raw = localStorage.getItem("alaya_performance");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getPerformanceHistory(): PerformanceReport[] {
  try {
    const raw = localStorage.getItem("alaya_performance_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPerformanceSnapshot() {
  const report = getPerformanceReport();
  if (!report) return;
  try {
    const raw = localStorage.getItem("alaya_performance_history");
    const history: PerformanceReport[] = raw ? JSON.parse(raw) : [];
    history.push(report);
    localStorage.setItem("alaya_performance_history", JSON.stringify(history.slice(-100)));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Accessibility helpers                                              */
/* ------------------------------------------------------------------ */

export function announceToScreenReader(message: string, polite = true) {
  let announcer = document.getElementById("alaya-sr-announcer");
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "alaya-sr-announcer";
    announcer.setAttribute("aria-live", polite ? "polite" : "assertive");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    document.body.appendChild(announcer);
  }
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer!.textContent = message;
  });
}

export function focusTrap(container: HTMLElement, active: boolean) {
  if (!active) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function trap(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  container.addEventListener("keydown", trap);
  first?.focus();
}

/* ------------------------------------------------------------------ */
/*  Gesture helpers                                                     */
/* ------------------------------------------------------------------ */

export interface SwipeEvent {
  direction: "left" | "right" | "up" | "down";
  distance: number;
  velocity: number;
  target: EventTarget | null;
}

export type SwipeCallback = (event: SwipeEvent) => void;

export function attachSwipe(element: HTMLElement, cb: SwipeCallback, threshold = 50) {
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  };

  const onTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const dt = Date.now() - startTime;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < threshold) return;

    const velocity = distance / Math.max(dt, 1);
    let direction: SwipeEvent["direction"] = "right";
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? "right" : "left";
    } else {
      direction = dy > 0 ? "down" : "up";
    }

    cb({ direction, distance, velocity, target: e.target });
  };

  element.addEventListener("touchstart", onTouchStart, { passive: true });
  element.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    element.removeEventListener("touchstart", onTouchStart);
    element.removeEventListener("touchend", onTouchEnd);
  };
}

/* ------------------------------------------------------------------ */
/*  Adaptive loading helpers                                           */
/* ------------------------------------------------------------------ */

export function isLowEndDevice(): boolean {
  const info = getDeviceInfo();
  if (info.memory !== null && info.memory < 4) return true;
  if (info.cores !== null && info.cores < 4) return true;
  return false;
}

export function isSlowConnection(): boolean {
  const info = getDeviceInfo();
  return info.connection === "cellular" || info.connection === "none";
}

export function shouldReduceQuality(): boolean {
  return isLowEndDevice() || isSlowConnection();
}

/* ------------------------------------------------------------------ */
/*  Theme & Preference sync                                            */
/* ------------------------------------------------------------------ */

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "small" | "medium" | "large";
  reducedData: boolean;
  lang: string;
}

export function getDefaultPreferences(): UserPreferences {
  return {
    theme: "system",
    reducedMotion: false,
    highContrast: false,
    fontSize: "medium",
    reducedData: false,
    lang: "en",
  };
}

export function savePreferences(prefs: Partial<UserPreferences>) {
  try {
    const raw = localStorage.getItem("alaya_prefs");
    const current: UserPreferences = raw ? { ...getDefaultPreferences(), ...JSON.parse(raw) } : getDefaultPreferences();
    Object.assign(current, prefs);
    localStorage.setItem("alaya_prefs", JSON.stringify(current));
  } catch { /* ignore */ }
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem("alaya_prefs");
    return raw ? { ...getDefaultPreferences(), ...JSON.parse(raw) } : getDefaultPreferences();
  } catch {
    return getDefaultPreferences();
  }
}

/* ------------------------------------------------------------------ */
/*  Mobile analytics                                                    */
/* ------------------------------------------------------------------ */

export interface MobileAnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  device: DeviceCategory;
  online: boolean;
}

const analyticsBuffer: MobileAnalyticsEvent[] = [];

export function trackMobileEvent(type: string, data: Record<string, unknown> = {}) {
  const info = getDeviceInfo();
  analyticsBuffer.push({
    type,
    data,
    timestamp: Date.now(),
    device: info.category,
    online: info.online,
  });
  // Flush to localStorage periodically
  if (analyticsBuffer.length >= 10) {
    flushMobileAnalytics();
  }
}

export function flushMobileAnalytics() {
  if (analyticsBuffer.length === 0) return;
  try {
    const raw = localStorage.getItem("alaya_mobile_analytics");
    const existing: MobileAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    const all = [...existing, ...analyticsBuffer].slice(-500);
    localStorage.setItem("alaya_mobile_analytics", JSON.stringify(all));
    analyticsBuffer.length = 0;
  } catch { /* ignore */ }
}

export function getMobileAnalytics(): MobileAnalyticsEvent[] {
  try {
    const raw = localStorage.getItem("alaya_mobile_analytics");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearMobileAnalytics() {
  try {
    localStorage.removeItem("alaya_mobile_analytics");
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Mobile Platform initialization                                     */
/* ------------------------------------------------------------------ */

export function initMobilePlatform() {
  if (typeof window === "undefined") return;

  initNetworkDetection();
  initOrientationDetection();
  initPwaInstall();
  initPerformanceMonitoring();

  // Register service worker after page load
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      registerServiceWorker();
    });
  }

  // Flush analytics on page unload
  window.addEventListener("beforeunload", () => {
    flushMobileAnalytics();
    recordPerformanceSnapshot();
  });

  trackMobileEvent("platform_init", {
    device: getDeviceInfo().category,
    pwa: isInstalled(),
  });
}
