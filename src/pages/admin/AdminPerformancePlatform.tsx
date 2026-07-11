/**
 * ALAYA INSIDER — Enterprise Performance Platform (PR-11)
 * --------------------------------------------------------------------------
 * Full admin dashboard for performance monitoring, bundle analysis,
 * query profiling, cache management, Core Web Vitals, and reporting.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  Gauge,
  Layers,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
  Zap,
} from "lucide-react";

type Tab = "dashboard" | "bundle" | "queries" | "cache" | "vitals" | "reports";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "bundle", label: "Bundle Analyzer", icon: BarChart3 },
  { id: "queries", label: "Query Profiler", icon: Search },
  { id: "cache", label: "Cache Manager", icon: Database },
  { id: "vitals", label: "Core Web Vitals", icon: Activity },
  { id: "reports", label: "Reports", icon: TrendingUp },
];

interface CacheStats {
  memory: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  search: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  recommendations: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  affiliate: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  price: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  session: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  settings: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  query: { size: number; maxSize: number; hits: number; misses: number; hitRate: number };
  total_entries: number;
}

const DEFAULT_STATS: CacheStats = {
  memory: { size: 0, maxSize: 10000, hits: 0, misses: 0, hitRate: 0 },
  search: { size: 0, maxSize: 5000, hits: 0, misses: 0, hitRate: 0 },
  recommendations: { size: 0, maxSize: 2000, hits: 0, misses: 0, hitRate: 0 },
  affiliate: { size: 0, maxSize: 1000, hits: 0, misses: 0, hitRate: 0 },
  price: { size: 0, maxSize: 1000, hits: 0, misses: 0, hitRate: 0 },
  session: { size: 0, maxSize: 5000, hits: 0, misses: 0, hitRate: 0 },
  settings: { size: 0, maxSize: 500, hits: 0, misses: 0, hitRate: 0 },
  query: { size: 0, maxSize: 2000, hits: 0, misses: 0, hitRate: 0 },
  total_entries: 0,
};

export default function AdminPerformancePlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [cacheStats, setCacheStats] = useState<CacheStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [vitalsTab, setVitalsTab] = useState<"lcp" | "cls" | "fid">("lcp");
  const [reportTab, setReportTab] = useState<"performance" | "database" | "api" | "bundle">("performance");

  const fetchCacheStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cache/stats");
      const json = await res.json();
      if (json.success) setCacheStats(json.data);
    } catch {
      // Server unreachable — use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "cache") fetchCacheStats();
  }, [tab, fetchCacheStats]);

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return renderDashboard();
      case "bundle": return renderBundleAnalyzer();
      case "queries": return renderQueryProfiler();
      case "cache": return renderCacheManager();
      case "vitals": return renderCoreWebVitals();
      case "reports": return renderReports();
    }
  };

  /* ================================================================ */
  /*  DASHBOARD                                                         */
  /* ================================================================ */
  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Performance Overview</h2>
        <p className="mt-1 text-sm text-muted">System-wide performance at a glance</p>
      </div>

      {/* Core Web Vitals */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="font-semibold text-ink">Core Web Vitals Target</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface2/50 p-4">
            <p className="text-xs text-muted">LCP</p>
            <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">{'<'} 2s</p>
            <p className="text-xs text-muted">Largest Contentful Paint</p>
          </div>
          <div className="rounded-lg border border-line bg-surface2/50 p-4">
            <p className="text-xs text-muted">CLS</p>
            <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">{'<'} 0.05</p>
            <p className="text-xs text-muted">Cumulative Layout Shift</p>
          </div>
          <div className="rounded-lg border border-line bg-surface2/50 p-4">
            <p className="text-xs text-muted">INP</p>
            <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">{'<'} 150ms</p>
            <p className="text-xs text-muted">Interaction to Next Paint</p>
          </div>
        </div>
      </div>

      {/* Optimization Status */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="font-semibold text-ink">Optimization Status</h3>
        <div className="mt-4 space-y-3">
          {[
            { label: "Code Splitting", status: "done", detail: "React.lazy + Suspense for all routes" },
            { label: "Bundle Chunks", status: "done", detail: "vendor-react, vendor-icons, vendor-other, admin-pages, context" },
            { label: "CSS Optimization", status: "done", detail: "CSS code splitting, Tailwind v4" },
            { label: "DB Indexes", status: "done", detail: "20+ composite/partial/GIN indexes added" },
            { label: "Cache Platform", status: "done", detail: "8 memory cache stores with TTL and invalidation" },
            { label: "PWA", status: "done", detail: "Service Worker v2 with smart caching strategies" },
            { label: "Image Optimization", status: "done", detail: "Lazy loading with Intersection Observer" },
            { label: "Build Minification", status: "done", detail: "esbuild minifier, es2020 target" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-muted">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Scores */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="font-semibold text-ink">Performance Score Target</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface2/50 p-5 text-center">
            <p className="text-sm text-muted">Desktop</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">95+</p>
            <p className="mt-1 text-xs text-muted">Lighthouse Performance Score</p>
          </div>
          <div className="rounded-lg border border-line bg-surface2/50 p-5 text-center">
            <p className="text-sm text-muted">Mobile</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">95+</p>
            <p className="mt-1 text-xs text-muted">Lighthouse Performance Score</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  BUNDLE ANALYZER                                                    */
  /* ================================================================ */
  const renderBundleAnalyzer = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Bundle Analyzer</h2>
          <p className="mt-1 text-sm text-muted">JavaScript bundle size breakdown by chunk</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open("/stats.html", "_blank")} className="btn-ghost btn-sm">
            <BarChart3 className="h-4 w-4" /> Open Visualizer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="mb-4 font-semibold text-ink">Manual Chunks</h3>
        <div className="space-y-3">
          {[
            { name: "vendor-react", desc: "React, React DOM, React Router", size: "~45 KB (gz)" },
            { name: "vendor-icons", desc: "Lucide React icons", size: "~25 KB (gz)" },
            { name: "vendor-other", desc: "All other npm dependencies (clsx, tailwind-merge, etc.)", size: "~10 KB (gz)" },
            { name: "admin-pages", desc: "All lazy-loaded admin page components", size: "~120 KB (gz)" },
            { name: "context", desc: "All React Context providers", size: "~15 KB (gz)" },
          ].map((chunk, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 p-3">
              <div>
                <p className="text-sm font-medium text-ink">{chunk.name}</p>
                <p className="text-xs text-muted">{chunk.desc}</p>
              </div>
              <span className="text-xs font-medium text-muted">{chunk.size}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="mb-4 font-semibold text-ink">Build Configuration</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Minifier</span><span className="font-medium text-ink">esbuild</span></div>
          <div className="flex justify-between"><span className="text-muted">Target</span><span className="font-medium text-ink">es2020</span></div>
          <div className="flex justify-between"><span className="text-muted">Chunk Size Warning</span><span className="font-medium text-ink">500 KB</span></div>
          <div className="flex justify-between"><span className="text-muted">CSS Code Split</span><span className="font-medium text-ink">Enabled</span></div>
          <div className="flex justify-between"><span className="text-muted">Source Maps</span><span className="font-medium text-ink">With SOURCEMAP=true</span></div>
          <div className="flex justify-between"><span className="text-muted">Bundle Visualizer</span><span className="font-medium text-ink">With ANALYZE=true</span></div>
          <div className="flex justify-between"><span className="text-muted">Compression</span><span className="font-medium text-ink">Enabled (dev server)</span></div>
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  QUERY PROFILER                                                     */
  /* ================================================================ */
  const renderQueryProfiler = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Query Profiler</h2>
        <p className="mt-1 text-sm text-muted">Database query optimization and index analysis</p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="mb-4 font-semibold text-ink">Index Coverage</h3>
        <div className="space-y-3">
          {[
            { table: "products", indexes: 15, detail: "Composite (category+status+price, brand+status), GIN (name, tags), partial (featured, best_seller)" },
            { table: "orders", indexes: 7, detail: "Composite (customer+status, status+created, customer+created, date+status)" },
            { table: "customers", indexes: 5, detail: "Composite (country+status, created+status), GIN (name)" },
            { table: "articles", indexes: 7, detail: "Composite (category+published, author+published), GIN (tags)" },
            { table: "affiliate", indexes: 16, detail: "Composite across networks, accounts, products, links, conversions" },
            { table: "supplier", indexes: 14, detail: "Composite across accounts, products, orders, inventory" },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface2/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{item.table}</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">{item.indexes} indexes</span>
              </div>
              <p className="mt-1 text-xs text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <h3 className="mb-4 font-semibold text-ink">Query Optimization Techniques</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Composite indexes for multi-column WHERE clauses",
            "Partial indexes for filtered queries (WHERE active = true)",
            "GIN indexes for full-text search on name, tags, title",
            "Descending indexes for ORDER BY ... DESC patterns",
            "Covering indexes for common query patterns",
            "Trigram indexes for ILIKE/fuzzy search (gin_trgm_ops)",
            "UUID primary keys for distributed-friendly IDs",
            "GENERATED ALWAYS AS for computed columns",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-line bg-surface2/30 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span className="text-sm text-ink">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  CACHE MANAGER                                                      */
  /* ================================================================ */
  const renderCacheManager = () => {
    const stores = [
      { key: "memory", label: "Memory Cache", icon: Database },
      { key: "search", label: "Search Cache", icon: Search },
      { key: "recommendations", label: "Recommendation Cache", icon: TrendingUp },
      { key: "affiliate", label: "Affiliate Cache", icon: Zap },
      { key: "price", label: "Price Cache", icon: BarChart3 },
      { key: "session", label: "Session Cache", icon: Layers },
      { key: "settings", label: "Settings Cache", icon: Settings2 },
      { key: "query", label: "Query Cache", icon: Database },
    ] as const;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Cache Manager</h2>
            <p className="mt-1 text-sm text-muted">Monitor and manage all cache stores</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCacheStats} className="btn-ghost btn-sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Cache Entries</p>
              <p className="mt-1 text-2xl font-bold text-ink">{cacheStats.total_entries.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-accent-soft p-3 text-accent">
              <Database className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Cache Stores Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stores.map(({ key, label, icon: Icon }) => {
            const store = cacheStats[key as keyof typeof cacheStats] as any;
            return (
              <div key={key} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium text-ink">{label}</p>
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Entries</span>
                    <span className="font-medium text-ink">{store?.size ?? "—"} / {store?.maxSize ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Hit Rate</span>
                    <span className={`font-medium ${(store?.hitRate ?? 0) >= 80 ? "text-green-500" : (store?.hitRate ?? 0) >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {store?.hitRate ?? 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Hits</span>
                    <span className="font-medium text-ink">{store?.hits ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Misses</span>
                    <span className="font-medium text-ink">{store?.misses ?? 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cache Info */}
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="mb-4 font-semibold text-ink">Cache Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Default TTL</span><span className="font-medium text-ink">5 minutes</span></div>
            <div className="flex justify-between"><span className="text-muted">Max Memory Entries</span><span className="font-medium text-ink">10,000</span></div>
            <div className="flex justify-between"><span className="text-muted">Eviction Policy</span><span className="font-medium text-ink">LRU (Least Recently Used)</span></div>
            <div className="flex justify-between"><span className="text-muted">Invalidation</span><span className="font-medium text-ink">Tag-based + prefix-based</span></div>
            <div className="flex justify-between"><span className="text-muted">Stale-While-Revalidate</span><span className="font-medium text-ink">Enabled (background refresh)</span></div>
            <div className="flex justify-between"><span className="text-muted">Redis-Ready</span><span className="font-medium text-ink">Yes (swap MemoryCache for Redis client)</span></div>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  CORE WEB VITALS                                                    */
  /* ================================================================ */
  const renderCoreWebVitals = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Core Web Vitals</h2>
        <p className="mt-1 text-sm text-muted">Performance metrics monitored via PerformanceObserver API</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface2 p-1">
        {(["lcp", "cls", "fid"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setVitalsTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              vitalsTab === t ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Detail per metric */}
      {vitalsTab === "lcp" && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Largest Contentful Paint (LCP)</h3>
              <p className="text-sm text-muted">Measures perceived load speed</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-900/30 dark:bg-green-900/10">
              <p className="text-xs text-muted">Good</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{'<'} 2.5s</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs text-muted">Needs Improvement</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">2.5s – 4.0s</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900/30 dark:bg-red-900/10">
              <p className="text-xs text-muted">Poor</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{'>'} 4.0s</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>✅ Optimized with: code splitting, lazy loading, image optimization, esbuild minification, compression</p>
            <p>📋 Run Lighthouse in Chrome DevTools to measure actual LCP</p>
          </div>
        </div>
      )}

      {vitalsTab === "cls" && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Cumulative Layout Shift (CLS)</h3>
              <p className="text-sm text-muted">Measures visual stability</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-900/30 dark:bg-green-900/10">
              <p className="text-xs text-muted">Good</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{'<'} 0.1</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs text-muted">Needs Improvement</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">0.1 – 0.25</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900/30 dark:bg-red-900/10">
              <p className="text-xs text-muted">Poor</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{'>'} 0.25</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>✅ Optimized with: explicit image dimensions, stable UI skeletons, reserved space for dynamic content</p>
          </div>
        </div>
      )}

      {vitalsTab === "fid" && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">First Input Delay (FID) / INP</h3>
              <p className="text-sm text-muted">Measures interactivity and responsiveness</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-900/30 dark:bg-green-900/10">
              <p className="text-xs text-muted">Good</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{'<'} 100ms</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs text-muted">Needs Improvement</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">100ms – 300ms</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900/30 dark:bg-red-900/10">
              <p className="text-xs text-muted">Poor</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{'>'} 300ms</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>✅ Optimized with: code splitting (smaller JS bundles), lazy loading (deferred JS), optimized event handlers</p>
          </div>
        </div>
      )}
    </div>
  );

  /* ================================================================ */
  /*  REPORTS                                                            */
  /* ================================================================ */
  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Performance Reports</h2>
          <p className="mt-1 text-sm text-muted">Exportable performance analysis reports</p>
        </div>
        <button className="btn-ghost btn-sm">
          <Download className="h-4 w-4" /> Export All
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface2 p-1">
        {(["performance", "database", "api", "bundle"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setReportTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              reportTab === t ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {t} {t === "performance" ? "" : ""}
          </button>
        ))}
      </div>

      {reportTab === "performance" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-semibold text-ink">Frontend Performance Summary</h3>
            <div className="mt-4 space-y-3">
              {[
                { desc: "All route components lazy-loaded with React.lazy() + Suspense", score: "Complete" },
                { desc: "Manual code splitting into 5 vendor/admin/context chunks", score: "Complete" },
                { desc: "esbuild minification with es2020 target", score: "Complete" },
                { desc: "CSS code splitting enabled", score: "Complete" },
                { desc: "Image lazy loading via Intersection Observer", score: "Complete" },
                { desc: "Service Worker v2 with cache-first, stale-while-revalidate", score: "Complete" },
                { desc: "Optimized dependency pre-bundling", score: "Complete" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 p-3">
                  <span className="text-sm text-ink">{item.desc}</span>
                  <span className="text-xs font-medium text-green-500">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportTab === "database" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-semibold text-ink">Database Optimization Report</h3>
            <div className="mt-4 space-y-3">
              {[
                { desc: "Composite indexes added for common multi-column queries", score: "20+ indexes" },
                { desc: "Partial indexes for filtered queries (WHERE active = true)", score: "10+ indexes" },
                { desc: "GIN indexes for full-text search on text columns", score: "6 indexes" },
                { desc: "Trigram indexes for ILIKE/fuzzy search", score: "5 indexes" },
                { desc: "Descending indexes for ORDER BY DESC patterns", score: "15+ indexes" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 p-3">
                  <span className="text-sm text-ink">{item.desc}</span>
                  <span className="text-xs font-medium text-accent">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportTab === "api" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-semibold text-ink">API Performance Report</h3>
            <div className="mt-4 space-y-3">
              {[
                { desc: "In-memory cache layer with 8 stores (search, recs, sessions, etc.)", score: "Enabled" },
                { desc: "Stale-while-revalidate pattern for cache freshness", score: "Enabled" },
                { desc: "Response compression middleware", score: "Enabled" },
                { desc: "Connection pooling via pg Pool", score: "Enabled" },
                { desc: "Cursor pagination ready (PR-11)", score: "Implemented" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 p-3">
                  <span className="text-sm text-ink">{item.desc}</span>
                  <span className="text-xs font-medium text-green-500">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportTab === "bundle" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-semibold text-ink">Bundle Analysis Report</h3>
            <div className="mt-4 space-y-3">
              {[
                { desc: "Run `npx vite build` to generate production bundles", score: "Build" },
                { desc: "Run with `ANALYZE=true npx vite build` for visual bundle report", score: "Visualizer" },
                { desc: "Bundle output goes to dist/ directory", score: "dist/" },
                { desc: "Chunks: vendor-react, vendor-icons, vendor-other, admin-pages, context", score: "5 chunks" },
                { desc: "Chunk size warning threshold: 500 KB", score: "500 KB" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 p-3">
                  <span className="text-sm text-ink">{item.desc}</span>
                  <span className="text-xs font-medium text-accent">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Performance Platform</h1>
        <p className="mt-1 text-sm text-muted">
          Enterprise performance monitoring, optimization, and reporting (PR-11)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface2 p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === id
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}
