/**
 * ALAYA INSIDER — Performance Dashboard (PR-11)
 * --------------------------------------------------------------------------
 * Quick-view performance metrics dashboard for the admin nav.
 * References AdminPerformancePlatform for full details.
 */

import { Link } from "react-router-dom";
import { Activity, BarChart3, Database, Gauge, TrendingUp, Zap } from "lucide-react";

export default function AdminPerformanceDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Performance Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Quick overview of platform performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Core Web Vitals</p>
              <p className="mt-2 text-2xl font-bold text-ink">—</p>
            </div>
            <div className="rounded-lg bg-accent-soft p-2.5 text-accent">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Run Lighthouse to measure</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Bundle Size</p>
              <p className="mt-2 text-2xl font-bold text-ink">—</p>
            </div>
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Run build with ANALYZE=true</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Cache</p>
              <p className="mt-2 text-2xl font-bold text-ink">8 stores</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Memory, search, recs, sessions</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Code Splitting</p>
              <p className="mt-2 text-2xl font-bold text-ink">Active</p>
            </div>
            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">React.lazy + manual chunks</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">DB Indexes</p>
              <p className="mt-2 text-2xl font-bold text-ink">20+ added</p>
            </div>
            <div className="rounded-lg bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Composite, partial, GIN indexes</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">PWA</p>
              <p className="mt-2 text-2xl font-bold text-ink">v2.0.0</p>
            </div>
            <div className="rounded-lg bg-rose-100 p-2.5 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Smart caching, offline, background sync</p>
        </div>
      </div>

      {/* Link to full platform */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Performance Platform</h2>
            <p className="mt-1 text-sm text-muted">Full performance management with Bundle Analyzer, Query Profiler, Cache Manager, Core Web Vitals, and Reports</p>
          </div>
          <Link
            to="/admin/performance-platform"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Open Perf Platform
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
