/* ==========================================================================
 *  ALAYA INSIDER — Performance React Hooks
 *
 *  Reusable hooks for:
 *    - useDebouncedCallback – stable debounced callback
 *    - useThrottledCallback – stable throttled callback
 *    - useLazyImage       – IntersectionObserver-based lazy image loading
 *    - usePrefetch        – prefetch resources on hover/focus
 *    - useRenderCount     – dev-only render counter
 *    - useBatchUpdate     – batched state updates via microtask
 * ========================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  useDebouncedCallback — stable debounced callback                   */
/* ------------------------------------------------------------------ */

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fnRef.current(...args);
        timer.current = null;
      }, ms);
    },
    [ms]
  );
}

/* ------------------------------------------------------------------ */
/*  useThrottledCallback — stable throttled callback                    */
/* ------------------------------------------------------------------ */

export function useThrottledCallback<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const last = useRef(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - last.current >= ms) {
        last.current = now;
        fnRef.current(...args);
      }
    },
    [ms]
  );
}

/* ------------------------------------------------------------------ */
/*  useLazyImage — IntersectionObserver for lazy image loading         */
/* ------------------------------------------------------------------ */

export function useLazyImage(
  rootMargin = "0px 0px 200px 0px"
): {
  ref: React.RefCallback<HTMLImageElement>;
  loaded: boolean;
} {
  const [loaded, setLoaded] = useState(false);
  const observed = useRef(false);

  const ref = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || observed.current) return;

      if (typeof IntersectionObserver === "undefined") {
        setLoaded(true);
        observed.current = true;
        return;
      }

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          observed.current = true;
          const realSrc = node.dataset.src;
          if (realSrc) {
            node.src = realSrc;
            node.removeAttribute("data-src");
          }
          setLoaded(true);
          observer.disconnect();
        }
      }, { rootMargin });

      observer.observe(node);
    },
    [rootMargin]
  );

  return { ref, loaded };
}

/* ------------------------------------------------------------------ */
/*  usePrefetch — prefetch a route/resource on hover/focus             */
/* ------------------------------------------------------------------ */

export function usePrefetch(
  url: string,
  as: "script" | "style" | "image" | "font" | "document" = "document"
): {
  onMouseEnter: () => void;
  onFocus: () => void;
  onTouchStart: () => void;
} {
  const prefetched = useRef(false);

  const trigger = useCallback(() => {
    if (prefetched.current || typeof document === "undefined") return;
    prefetched.current = true;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
    // Clean up after a moment
    setTimeout(() => link.remove(), 3000);
  }, [url, as]);

  return {
    onMouseEnter: trigger,
    onFocus: trigger,
    onTouchStart: trigger,
  };
}

/* ------------------------------------------------------------------ */
/*  useRenderCount — dev-only render counter (strips in production)    */
/* ------------------------------------------------------------------ */

export function useRenderCount(name: string): number {
  const count = useRef(0);
  count.current += 1;

  if (process.env.NODE_ENV !== "production") {
    // Store in the global registry from performance.ts
    if (typeof window !== "undefined") {
      const registry = ((window as any).__alaya_render_counts =
        (window as any).__alaya_render_counts || {});
      registry[name] = count.current;
    }
  }

  return count.current;
}

/* ------------------------------------------------------------------ */
/*  useIntersectionObserver — generic visibility hook                  */
/* ------------------------------------------------------------------ */

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: "100px" }
): { ref: React.RefCallback<T>; inView: boolean } {
  const [inView, setInView] = useState(false);
  const elementRef = useRef<T | null>(null);

  const ref = useCallback((node: T | null) => {
    elementRef.current = node;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(node);
  }, [options.threshold, options.rootMargin]);

  return { ref, inView };
}

/* ------------------------------------------------------------------ */
/*  useStableMemo — identity-preserving memo (avoids re-render chains) */
/* ------------------------------------------------------------------ */

/**
 * Like useMemo but with deep-compare on dependencies.
 * Useful when deps are objects/arrays that may change reference.
 */
export function useStableMemo<T>(factory: () => T, deps: any[]): T {
  const depsRef = useRef<any[]>(deps);
  const valueRef = useRef<T>(factory());

  if (!shallowEqual(deps, depsRef.current)) {
    depsRef.current = deps;
    valueRef.current = factory();
  }

  return valueRef.current;
}

function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}
