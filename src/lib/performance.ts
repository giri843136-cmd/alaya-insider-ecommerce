/* ==========================================================================
 *  ALAYA INSIDER — Performance Optimization Engine
 *
 *  Pure utilities (no React) for:
 *    - Debounce & throttle (standard + RAF-based)
 *    - Image lazy loading & preloading
 *    - Resource prefetch / preconnect / dns-prefetch
 *    - Batch state updates
 *    - requestAnimationFrame scheduler
 *    - Memoization helpers
 *    - Render optimization helpers
 * ========================================================================== */

/* ------------------------------------------------------------------ */
/*  Debounce & Throttle                                                */
/* ------------------------------------------------------------------ */

/** Standard debounce — returns a function that delays invoking fn. */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}

/** Standard throttle — fn called at most once per ms. */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

/** RAF-throttle — batches calls to the next animation frame (scroll/resize). */
export function rafThrottle<T extends (...args: any[]) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  let lastArgs: Parameters<T> | null = null;
  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        if (lastArgs) fn(...lastArgs);
        ticking = false;
      });
    }
  };
}

/* ------------------------------------------------------------------ */
/*  Image loading                                                       */
/* ------------------------------------------------------------------ */

export interface ImageLoadingOptions {
  /** 'eager' | 'lazy' — default 'lazy' for below-fold images */
  loading?: "lazy" | "eager";
  /** 'high' | 'low' — high for LCP candidates */
  fetchpriority?: "high" | "low" | "auto";
  /** Decoding hint */
  decoding?: "async" | "sync" | "auto";
  /** Onload callback */
  onLoad?: () => void;
  /** Onerror fallback URL */
  fallback?: string;
}

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect fill='%23e7e0d4' width='400' height='500'/%3E%3Ctext x='200' y='250' text-anchor='middle' fill='%239c7a4b' font-family='serif' font-size='18'%3EALAYA%3C/text%3E%3C/svg%3E";

/**
 * Build an optimized <img> attribute set based on role (LCP / below-fold).
 * Call this at render time — it's pure.
 */
export function imgAttrs(
  src: string,
  alt: string,
  priority: "lcp" | "above-fold" | "below-fold" = "below-fold"
): ImageLoadingOptions & { src: string; alt: string } {
  const opts: ImageLoadingOptions & { src: string; alt: string } = {
    src: src || FALLBACK_IMG,
    alt,
  };

  if (priority === "lcp") {
    opts.loading = "eager";
    opts.fetchpriority = "high";
    opts.decoding = "auto";
  } else if (priority === "above-fold") {
    opts.loading = "eager";
    opts.fetchpriority = "low";
    opts.decoding = "async";
  } else {
    opts.loading = "lazy";
    opts.fetchpriority = "low";
    opts.decoding = "async";
  }

  return opts;
}

/** Preload a critical image into the browser cache. */
export function preloadImage(url: string): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  document.head.appendChild(link);
  // Clean up after load
  link.onload = () => setTimeout(() => link.remove(), 1000);
}

/** Preload a batch of critical images (e.g. hero slider). */
export function preloadImages(urls: string[]): void {
  urls.forEach(preloadImage);
}

/* ------------------------------------------------------------------ */
/*  Resource hints                                                      */
/* ------------------------------------------------------------------ */

export function preconnect(url: string): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = url;
  document.head.appendChild(link);
}

export function dnsPrefetch(url: string): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "dns-prefetch";
  link.href = url;
  document.head.appendChild(link);
}

export function prefetchResource(url: string, as: "script" | "style" | "image" | "font" | "document" = "document"): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

/** Initialize critical resource hints (call once on app init). */
export function initResourceHints(): void {
  preconnect("https://fonts.googleapis.com");
  preconnect("https://fonts.gstatic.com");
  preconnect("https://images.pexels.com");
  dnsPrefetch("https://fonts.googleapis.com");
  dnsPrefetch("https://fonts.gstatic.com");
}

/* ------------------------------------------------------------------ */
/*  RAF Scheduler                                                       */
/* ------------------------------------------------------------------ */

type RafTask = () => void;
let _rafQueue: RafTask[] = [];
let _rafScheduled = false;

/** Schedule a low-priority task to run in the next idle frame. */
export function scheduleIdle(task: RafTask): void {
  _rafQueue.push(task);
  if (!_rafScheduled) {
    _rafScheduled = true;
    requestAnimationFrame(() => {
      const batch = _rafQueue;
      _rafQueue = [];
      _rafScheduled = false;
      batch.forEach((fn) => fn());
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Batch update helper (for context / state batching)                 */
/* ------------------------------------------------------------------ */

/** Collect multiple updates and flush them in a single microtask. */
export function createBatchUpdater<T>() {
  let pending: T[] = [];
  let scheduled = false;

  return {
    add(item: T): void {
      pending.push(item);
      if (!scheduled) {
        scheduled = true;
        Promise.resolve().then(() => {
          const batch = pending;
          pending = [];
          scheduled = false;
          return batch;
        });
      }
    },
    flush(): T[] {
      const batch = pending;
      pending = [];
      scheduled = false;
      return batch;
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Memoization helper (pure function result caching)                  */
/* ------------------------------------------------------------------ */

export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  keyFn: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => Result {
  const cache = new Map<string, Result>();
  return (...args: Args): Result => {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/** LRU cache with max size — for API responses, search results, etc. */
export class LruCache<K, V> {
  private max: number;
  private map = new Map<K, V>();

  constructor(max = 50) {
    this.max = max;
  }

  get(key: K): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      // Move to end (most recently used)
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: K, value: V): void {
    if (this.map.size >= this.max) {
      // Evict least recently used (first key)
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, value);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

/* ------------------------------------------------------------------ */
/*  Render count tracking (dev only)                                   */
/* ------------------------------------------------------------------ */

let _renderCounts = new Map<string, number>();

export function trackRender(name: string): void {
  if (process.env.NODE_ENV === "production") return;
  const count = (_renderCounts.get(name) || 0) + 1;
  _renderCounts.set(name, count);
}

export function getRenderCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  _renderCounts.forEach((count, name) => {
    out[name] = count;
  });
  return out;
}

export function resetRenderCounts(): void {
  _renderCounts = new Map();
}
