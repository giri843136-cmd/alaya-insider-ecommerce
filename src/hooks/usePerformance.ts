/**
 * ALAYA INSIDER — Performance Optimization Hooks (PR-11)
 * --------------------------------------------------------------------------
 * Production-grade hooks for image lazy loading, intersection observation,
 * debouncing, memoization, virtual scrolling, and Core Web Vitals.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ================================================================== */
/*  useLazyImage — Lazy load images with blur placeholder               */
/* ================================================================== */

interface LazyImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

interface LazyImageResult {
  imageRef: React.RefObject<HTMLImageElement | null>;
  isLoaded: boolean;
  currentSrc: string;
  isError: boolean;
}

export function useLazyImage({ src, placeholder = "", threshold = 0.1, rootMargin = "200px" }: LazyImageOptions): LazyImageResult {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || "");
  const [isError, setIsError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Intersection Observer to detect when image enters viewport
  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Load image when it enters viewport
  useEffect(() => {
    if (!isIntersecting || !src) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
      if (placeholder) setCurrentSrc(placeholder);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isIntersecting, src, placeholder]);

  return { imageRef, isLoaded, currentSrc, isError };
}

/* ================================================================== */
/*  useIntersectionObserver — Generic intersection observer              */
/* ================================================================== */

interface IntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  threshold = 0,
  rootMargin = "0px",
  triggerOnce = true,
}: IntersectionOptions = {}) {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setRatio(entry.intersectionRatio);
        if (triggerOnce && entry.isIntersecting) {
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isIntersecting, ratio };
}

/* ================================================================== */
/*  useDebounce — Debounce a value or callback                          */
/* ================================================================== */

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount to prevent callback firing after unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(...args), delayMs);
    },
    [callback, delayMs],
  );
}

/* ================================================================== */
/*  useMemoizedCallback — Stable callback with dependency tracking       */
/* ================================================================== */

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[],
): T {
  return useCallback(callback, deps);
}

/* ================================================================== */
/*  useVirtualScroll — Virtual scrolling for large lists                */
/* ================================================================== */

interface VirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualScrollResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetY: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  overscan = 5,
  containerHeight,
}: VirtualScrollOptions): VirtualScrollResult {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = itemCount * itemHeight;

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
    return { start, end };
  }, [scrollTop, itemHeight, overscan, containerHeight, itemCount]);

  const offsetY = visibleRange.start * itemHeight;

  return { visibleRange, totalHeight, offsetY, scrollRef, onScroll };
}

/* ================================================================== */
/*  usePerformanceMark — Measure component render performance            */
/* ================================================================== */

export function usePerformanceMark(name: string, enabled = false): void {
  const markName = `alaya-${name}`;

  useEffect(() => {
    if (!enabled || typeof performance === "undefined") return;

    performance.mark(`${markName}-start`);

    return () => {
      performance.mark(`${markName}-end`);
      performance.measure(markName, `${markName}-start`, `${markName}-end`);

      const entries = performance.getEntriesByName(markName);
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug(`[Perf] ${name}: ${lastEntry.duration.toFixed(2)}ms`);
      }

      // Clean up marks
      performance.clearMarks(`${markName}-start`);
      performance.clearMarks(`${markName}-end`);
      performance.clearMeasures(markName);
    };
  }, [name, enabled, markName]);
}

/* ================================================================== */
/*  Core Web Vitals helpers                                             */
/* ================================================================== */

interface WebVitalMeasurement {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

/** Check if CLS (Cumulative Layout Shift) is within acceptable range */
export function useCLS(): WebVitalMeasurement | null {
  const [cls, setCls] = useState<WebVitalMeasurement | null>(null);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let cumulativeShift = 0;
        for (const entry of entries) {
          cumulativeShift += (entry as any).value || 0;
        }
        const rating = cumulativeShift < 0.1 ? "good" : cumulativeShift < 0.25 ? "needs-improvement" : "poor";
        setCls({ name: "CLS", value: Math.round(cumulativeShift * 1000) / 1000, rating });
      });
      observer.observe({ type: "layout-shift", buffered: true });
      return () => observer.disconnect();
    } catch {
      // PerformanceObserver not supported
    }
  }, []);

  return cls;
}

/** Check if LCP (Largest Contentful Paint) is within acceptable range */
export function useLCP(): WebVitalMeasurement | null {
  const [lcp, setLcp] = useState<WebVitalMeasurement | null>(null);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const value = lastEntry.startTime;
          const rating = value < 2500 ? "good" : value < 4000 ? "needs-improvement" : "poor";
          setLcp({ name: "LCP", value: Math.round(value), rating });
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      return () => observer.disconnect();
    } catch {
      // PerformanceObserver not supported
    }
  }, []);

  return lcp;
}

/* ================================================================== */
/*  WebP/AVIF Detection — Browser format support check                   */
/* ================================================================== */

interface ImageFormatSupport {
  webp: boolean;
  avif: boolean;
  loaded: boolean;
}

/**
 * Detect whether the browser supports WebP and AVIF image formats.
 * Useful for generating optimal srcset/sizes attributes.
 */
export function useImageFormatSupport(): ImageFormatSupport {
  const [support, setSupport] = useState<ImageFormatSupport>({ webp: false, avif: false, loaded: false });

  useEffect(() => {
    const checkWebP = () =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width > 0 && img.height > 0);
        img.onerror = () => resolve(false);
        img.src = "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v81AA==";
      });

    const checkAVIF = () =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width > 0 && img.height > 0);
        img.onerror = () => resolve(false);
        img.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
      });

    Promise.all([checkWebP(), checkAVIF()]).then(([webp, avif]) => {
      setSupport({ webp, avif, loaded: true });
    });
  }, []);

  return support;
}

/**
 * Generate responsive srcset string from an image URL template.
 * @param baseUrl The base URL (without size suffix)
 * @param sizes Array of width/height pairs to generate
 * @param ext Optional file extension override
 */
export function generateSrcset(
  baseUrl: string,
  sizes: { width: number; label?: string }[],
  ext?: string,
): string {
  return sizes
    .map((s) => `${baseUrl}${s.label ? `_${s.label}` : `_${s.width}w`}.${ext || "webp"} ${s.width}w`)
    .join(", ");
}

/**
 * Generate sizes attribute for responsive images based on breakpoints.
 */
export function generateSizes(
  breakpoints: { maxWidth: number; size: string }[],
  defaultSize: string,
): string {
  return breakpoints
    .map((bp) => `(max-width: ${bp.maxWidth}px) ${bp.size}`)
    .concat([defaultSize])
    .join(", ");
}

/** Check if FID (First Input Delay) or INP is within acceptable range */
export function useFID(): WebVitalMeasurement | null {
  const [fid, setFid] = useState<WebVitalMeasurement | null>(null);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const value = (entry as any).processingStart - entry.startTime;
          const rating = value < 100 ? "good" : value < 300 ? "needs-improvement" : "poor";
          setFid({ name: "FID", value: Math.round(value), rating });
          break; // Only need first input
        }
      });
      observer.observe({ type: "first-input", buffered: true });
      return () => observer.disconnect();
    } catch {
      // PerformanceObserver not supported
    }
  }, []);

  return fid;
}
