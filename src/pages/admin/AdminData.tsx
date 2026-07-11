/**
 * ALAYA INSIDER — Enterprise Data Platform Admin UI
 * Tab-based dashboard for database management, schema, migrations, queries,
 * storage, backups, governance, quality, metrics, and data lineage.
 */
import { useState } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import {
  Database, Table, GitBranch, BarChart3, HardDrive,
  Shield, FileText, Activity, Map, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Clock, Search,
  Play, Trash2, Plus, Layers, Globe, Eye,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { useData } from "../../context/DataContext";
import type { StorageVolume } from "../../lib/data";
import { formatBytes } from "../../lib/backup";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

type Tab =
  | "overview" | "databases" | "schema" | "migrations"
  | "queries" | "storage" | "backups" | "policies"
  | "catalog" | "quality" | "metrics" | "lineage";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "databases", label: "Databases", icon: Database },
  { id: "schema", label: "Schema", icon: Table },
  { id: "migrations", label: "Migrations", icon: GitBranch },
  { id: "queries", label: "Queries", icon: Search },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "backups", label: "Backups", icon: Shield },
  { id: "policies", label: "Policies", icon: FileText },
  { id: "catalog", label: "Catalog", icon: Layers },
  { id: "quality", label: "Quality", icon: CheckCircle2 },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
  { id: "lineage", label: "Lineage", icon: Map },
];

export default function AdminData() {
  const { toast } = useToast();
  const ctx = useData();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <Seo title="Data Platform" path="/admin/data" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Data Platform</h1>
            <p className="mt-1 text-sm text-muted">
              Database management, schema, migrations, storage, backup orchestration & data governance.
            </p>
          </div>
          <button onClick={() => { ctx.refresh(); toast.success("Data platform refreshed"); }} className="btn-outline btn-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("chip capitalize", tab === t.id && "chip-active")}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab ctx={ctx} />}
        {tab === "databases" && <DatabasesTab ctx={ctx} />}
        {tab === "schema" && <SchemaTab ctx={ctx} />}
        {tab === "migrations" && <MigrationsTab ctx={ctx} />}
        {tab === "queries" && <QueriesTab ctx={ctx} />}
        {tab === "storage" && <StorageTab ctx={ctx} />}
        {tab === "backups" && <BackupsTab ctx={ctx} />}
        {tab === "policies" && <PoliciesTab ctx={ctx} />}
        {tab === "catalog" && <CatalogTab ctx={ctx} />}
        {tab === "quality" && <QualityTab ctx={ctx} />}
        {tab === "metrics" && <DataMetricsTab ctx={ctx} />}
        {tab === "lineage" && <LineageTab ctx={ctx} />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  OVERVIEW TAB                                                       */
/* ================================================================== */
function OverviewTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { connectionStats, schemaStats, migrationStats, queryStats, storageStats, backupStats, governanceStats, dataMetrics } = ctx;

  const cards = [
    { label: "Databases", value: connectionStats.total, sub: `${connectionStats.online} online · ${connectionStats.degraded} degraded`, icon: Database, tone: connectionStats.degraded > 0 ? "warning" : "success" },
    { label: "Schema Tables", value: schemaStats.totalTables, sub: `${schemaStats.totalIndexes} indexes · ${schemaStats.totalSizeMb} MB`, icon: Table, tone: "success" },
    { label: "Migrations", value: migrationStats.applied, sub: `${migrationStats.pending} pending · ${migrationStats.failed} failed`, icon: GitBranch, tone: migrationStats.failed > 0 ? "danger" : "success" },
    { label: "Avg Query Time", value: `${queryStats.avgDuration}ms`, sub: `${queryStats.slowCount} slow · ${queryStats.cacheHitRate}% cache`, icon: BarChart3, tone: queryStats.avgDuration < 50 ? "success" : "warning" },
    { label: "Storage", value: formatBytes(storageStats.usedBytes), sub: `${storageStats.healthy}/${storageStats.total} volumes healthy`, icon: HardDrive, tone: storageStats.healthy === storageStats.total ? "success" : "warning" },
    { label: "Backups", value: backupStats.completed, sub: `${backupStats.failed} failed · ${backupStats.verified} verified`, icon: Shield, tone: backupStats.failed > 0 ? "warning" : "success" },
    { label: "Data Policies", value: governanceStats.totalPolicies, sub: `${governanceStats.totalCatalog} catalog entries`, icon: FileText, tone: "success" },
    { label: "Data Quality", value: "92–99%", sub: "Across all tables", icon: CheckCircle2, tone: "success" },
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className={cn(
                "grid h-10 w-10 place-items-center rounded-full",
                c.tone === "success" ? "bg-success/15 text-success" : c.tone === "warning" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
              )}><c.icon className="h-5 w-5" /></span>
              <span className={cn("h-2 w-2 rounded-full", c.tone === "success" ? "bg-success" : c.tone === "warning" ? "bg-warning" : "bg-danger")} />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="text-xs text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-4 w-4 text-accent" /> Key Data Metrics</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {dataMetrics.slice(0, 10).map((m) => (
            <div key={m.name} className="rounded-xl bg-surface2/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{m.name}</p>
                <span className={cn("text-xs font-medium", m.trend === "up" && m.status === "good" ? "text-success" : m.trend === "up" ? "text-danger" : m.trend === "down" && m.status === "good" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted")}>
                  {m.changePercent > 0 ? "↑" : m.changePercent < 0 ? "↓" : "→"} {Math.abs(m.changePercent).toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold text-ink">{m.value} <span className="text-xs font-normal text-muted">{m.unit}</span></p>
              <div className="mt-2 flex items-end gap-0.5 h-8">
                {m.sparkline.map((v, i) => (
                  <div key={i} className="w-1.5 rounded-t bg-accent/40" style={{ height: `${(v / Math.max(...m.sparkline)) * 100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DATABASES TAB                                                      */
/* ================================================================== */
function DatabasesTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { databaseProfiles, connectionStats } = ctx;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <span>{connectionStats.total} databases</span>
        <span className="text-success">{connectionStats.online} online</span>
        {connectionStats.degraded > 0 && <span className="text-warning">{connectionStats.degraded} degraded</span>}
        <span>{connectionStats.activeConnections} active connections</span>
        <span>{connectionStats.avgLatency}ms avg latency</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {databaseProfiles.map((db) => (
          <div key={db.id} className={cn(
            "card p-5",
            db.status === "online" ? "border-success/20" : db.status === "degraded" ? "border-warning/20" : "border-danger/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-10 w-10 place-items-center rounded-full",
                  db.status === "online" ? "bg-success/15 text-success" : db.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                )}><Database className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold text-ink">{db.name}</p>
                  <p className="text-xs text-muted capitalize">{db.engine} · {db.role.replace(/_/g, " ")}</p>
                </div>
              </div>
              <span className={cn(
                "badge capitalize",
                db.status === "online" ? "bg-success/15 text-success" : db.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
              )}>{db.status}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted">Version</span><p className="font-medium text-ink">{db.version}</p></div>
              <div><span className="text-muted">Host</span><p className="font-mono text-ink">{db.host}</p></div>
              <div><span className="text-muted">Latency</span><p className="font-medium text-ink">{db.latencyMs}ms</p></div>
              <div><span className="text-muted">Uptime</span><p className="font-medium text-ink">{db.uptimeHours}h</p></div>
              <div><span className="text-muted">Connections</span><p className="font-medium text-ink">{db.activeConnections}/{db.maxConnections}</p></div>
              <div><span className="text-muted">Pool</span><p className="font-medium text-ink">{db.poolUsed}/{db.poolSize}</p></div>
              <div><span className="text-muted">Size</span><p className="font-medium text-ink">{db.sizeMb} MB</p></div>
              <div><span className="text-muted">Region</span><p className="font-medium text-ink">{db.region}</p></div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={cn("chip", db.encryptionAtRest && "chip-active")}>Encrypted</span>
              <span className={cn("chip", db.backupEnabled && "chip-active")}>Backup</span>
              {db.tags.map((t) => (
                <span key={t} className="badge bg-accent-soft text-accent text-[0.6rem]">{t}</span>
              ))}
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(db.poolUsed / db.poolSize) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SCHEMA TAB                                                         */
/* ================================================================== */
function SchemaTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { schemaTables, schemaStats } = ctx;
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const table = schemaTables.find((t) => t.name === selectedTable);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Table className="h-4 w-4 text-accent" /> Tables</h3>
            <span className="text-xs text-muted">{schemaStats.totalTables} tables · {schemaStats.totalSizeMb} MB</span>
          </div>
        </div>
        <ul className="divide-y divide-line">
          {schemaTables.map((t) => (
            <li key={t.name}>
              <button onClick={() => setSelectedTable(t.name)} className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2/40",
                selectedTable === t.name && "bg-accent-soft"
              )}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent"><Table className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.rowCount.toLocaleString()} rows · {t.sizeMb} MB · {t.columns.length} columns</p>
                </div>
                <span className="badge bg-surface2 capitalize text-muted">{t.domain}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        {!table ? (
          <div className="card flex flex-col items-center gap-2 p-8 text-muted">
            <Table className="h-8 w-8" />
            <p className="text-sm">Select a table to view schema</p>
          </div>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ink">{table.name}</h3>
                  <p className="text-xs text-muted">{table.description}</p>
                </div>
                <span className="badge bg-surface2 capitalize text-muted">{table.domain}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{table.rowCount.toLocaleString()} rows · {table.sizeMb} MB</p>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Columns ({table.columns.length})</h4>
              </div>
              <div className="hide-scrollbar max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 border-b border-line bg-surface">
                    <tr className="text-left text-muted">
                      <th className="px-4 py-2">Column</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Nullable</th>
                      <th className="px-4 py-2">Key</th>
                      <th className="px-4 py-2">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {table.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-surface2/40">
                        <td className="px-4 py-2 font-mono font-semibold text-ink">{col.name}</td>
                        <td className="px-4 py-2 font-mono text-ink">{col.type}</td>
                        <td className="px-4 py-2">{col.nullable ? <span className="text-success">YES</span> : <span className="text-danger">NO</span>}</td>
                        <td className="px-4 py-2">
                          {col.primaryKey && <span className="badge bg-warning/15 text-warning font-mono">PK</span>}
                          {col.foreignKey && <span className="badge bg-accent-soft text-accent font-mono">FK</span>}
                          {col.unique && !col.primaryKey && <span className="badge bg-surface2 text-muted font-mono">UQ</span>}
                        </td>
                        <td className="px-4 py-2 font-mono text-muted">{col.default || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {table.indexes.length > 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Indexes ({table.indexes.length})</h4>
                </div>
                <ul className="divide-y divide-line text-xs">
                  {table.indexes.map((idx) => (
                    <li key={idx.name} className="flex items-center gap-3 px-4 py-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface2 text-muted">#</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono font-medium text-ink">{idx.name}</p>
                        <p className="text-muted">({idx.columns.join(", ")}) · {idx.type} {idx.unique ? "· UNIQUE" : ""}</p>
                      </div>
                      <div className="text-right text-muted">
                        <p className="font-medium">{idx.hitRate}% hit</p>
                        <p>{idx.sizeMb} MB</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MIGRATIONS TAB                                                     */
/* ================================================================== */
function MigrationsTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { migrations, migrationStats, runMig, rollbackMig } = ctx;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <span>{migrationStats.total} migrations</span>
        <span className="text-success">{migrationStats.applied} applied</span>
        <span className="text-warning">{migrationStats.pending} pending</span>
        {migrationStats.failed > 0 && <span className="text-danger">{migrationStats.failed} failed</span>}
      </div>

      <div className="space-y-3">
        {migrations.map((m) => (
          <div key={m.id} className={cn(
            "card p-4",
            m.status === "applied" && "border-success/20",
            m.status === "failed" && "border-danger/30",
            m.status === "running" && "border-warning/20"
          )}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    m.status === "applied" ? "bg-success/15 text-success" :
                    m.status === "failed" ? "bg-danger/15 text-danger" :                     m.status === "running" ? "bg-warning/15 text-warning" :
                    "bg-surface2 text-muted"
                  )}>
                    {m.status === "applied" ? <CheckCircle2 className="h-4 w-4" /> :
                     m.status === "failed" ? <XCircle className="h-4 w-4" /> :
                     m.status === "running" ? <AlertTriangle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </span>
                  <p className="font-semibold text-ink">{m.name}</p>
                  <span className="badge bg-surface2 font-mono text-muted">{m.version}</span>
                  <span className={cn(
                    "badge capitalize",
                    m.status === "applied" ? "bg-success/15 text-success" :
                    m.status === "failed" ? "bg-danger/15 text-danger" :                     m.status === "running" ? "bg-warning/15 text-warning" :
                    "bg-surface2 text-muted"
                  )}>{m.status.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{m.description}</p>
                <p className="mt-0.5 text-xs text-muted">Author: {m.author} · Checksum: {m.checksum}</p>
                {m.durationMs && <p className="text-xs text-muted">Duration: {(m.durationMs / 1000).toFixed(1)}s</p>}
                {m.appliedAt && <p className="text-xs text-muted">Applied: {formatDateTime(m.appliedAt)}</p>}
                {m.statements.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-accent">View SQL ({m.statements.length} statements)</summary>
                    <div className="mt-1 space-y-1">
                      {m.statements.map((s, i) => (
                        <p key={i} className="font-mono text-[0.6rem] text-muted bg-surface2 rounded p-1">{s}</p>
                      ))}
                    </div>
                  </details>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.tags.map((t) => (
                    <span key={t} className="badge bg-accent-soft text-accent text-[0.55rem]">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {m.status === "pending" && (
                  <button onClick={() => runMig(m.id)} className="btn-ghost btn-sm"><Play className="h-3.5 w-3.5" /> Run</button>
                )}
                {m.status === "applied" && (
                  <button onClick={() => rollbackMig(m.id)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /> Rollback</button>
                )}
                {m.status === "failed" && (
                  <button onClick={() => runMig(m.id)} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  QUERIES TAB                                                        */
/* ================================================================== */
function QueriesTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { slowQueries, queryStats } = ctx;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-5 mb-4">
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{queryStats.totalQueries}</p>
          <p className="text-xs text-muted">Total Queries</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{queryStats.avgDuration}ms</p>
          <p className="text-xs text-muted">Avg Duration</p>
        </div>
        <div className="card p-3 text-center">
          <p className={cn("text-lg font-semibold", queryStats.slowCount > 5 ? "text-danger" : "text-warning")}>{queryStats.slowCount}</p>
          <p className="text-xs text-muted">Slow Queries</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{queryStats.cacheHitRate}%</p>
          <p className="text-xs text-muted">Cache Hit Rate</p>
        </div>
        <div className="card p-3 text-center">
          <p className={cn("text-lg font-semibold", queryStats.seqScanCount > 2 ? "text-danger" : "text-warning")}>{queryStats.seqScanCount}</p>
          <p className="text-xs text-muted">Seq Scans</p>
        </div>
      </div>

      {slowQueries.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-muted">
          <Search className="h-8 w-8" />
          <p className="text-sm">No slow queries detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slowQueries.map((q) => (
            <div key={q.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                      q.durationMs > 300 ? "bg-danger/15 text-danger" : q.durationMs > 100 ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent"
                    )}>
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <p className="font-mono text-xs font-semibold text-ink truncate max-w-md">{q.query}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                    <span>{q.durationMs}ms</span>
                    <span>· {q.table}</span>
                    <span>· {q.type}</span>
                    <span>· rows: {q.rowsExamined} examined / {q.rowsReturned} returned</span>
                    <span>· scan: {q.scans}</span>
                    <span>· cache: {q.cacheHit ? "hit" : "miss"}</span>
                  </div>
                  {q.suggestion && <p className="mt-1 text-xs text-accent">💡 {q.suggestion}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  STORAGE TAB                                                        */
/* ================================================================== */
function StorageTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { storageVolumes, storageStats } = ctx;

  const usagePercent = (v: StorageVolume) => Math.round((v.usedBytes / v.totalBytes) * 100);

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-5 mb-4">
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{storageStats.total}</p>
          <p className="text-xs text-muted">Volumes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{formatBytes(storageStats.totalBytes)}</p>
          <p className="text-xs text-muted">Total Capacity</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{formatBytes(storageStats.usedBytes)}</p>
          <p className="text-xs text-muted">Used</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{storageStats.fileCount.toLocaleString()}</p>
          <p className="text-xs text-muted">Files</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{storageStats.healthy}/{storageStats.total}</p>
          <p className="text-xs text-muted">Healthy</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {storageVolumes.map((vol) => (
          <div key={vol.id} className={cn(
            "card p-5",
            vol.status === "degraded" && "border-warning/20",
            vol.status === "full" && "border-danger/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-10 w-10 place-items-center rounded-full",
                  vol.status === "healthy" ? "bg-success/15 text-success" : vol.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                )}><HardDrive className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold text-ink">{vol.name}</p>
                  <p className="text-xs text-muted capitalize">{vol.tier} · {vol.provider} · {vol.region}</p>
                </div>
              </div>
              <span className={cn("badge capitalize", vol.status === "healthy" ? "bg-success/15 text-success" : vol.status === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{vol.status}</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{formatBytes(vol.usedBytes)} used</span>
                <span>of {formatBytes(vol.totalBytes)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
                <div className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent(vol) > 90 ? "bg-danger" : usagePercent(vol) > 75 ? "bg-warning" : "bg-success"
                )} style={{ width: `${usagePercent(vol)}%` }} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted">Files</span><p className="font-medium text-ink">{vol.fileCount.toLocaleString()}</p></div>
              <div><span className="text-muted">Daily Growth</span><p className="font-medium text-ink">{vol.dailyGrowthMb} MB</p></div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={cn("chip", vol.compressionEnabled && "chip-active")}>Compression</span>
              <span className={cn("chip", vol.encryptionEnabled && "chip-active")}>Encryption</span>
              <span className={cn("chip", vol.deduplicationEnabled && "chip-active")}>Dedup</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BACKUPS TAB                                                        */
/* ================================================================== */
function BackupsTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { backupJobs, backupPolicies, backupStats, createBackup, verifyBackup } = ctx;
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  useEscapeKey(() => setShowCreate(false), showCreate);
  useLockBody(showCreate);
  const [newName, setNewName] = useState("Manual Backup");
  const [newType, setNewType] = useState<"full" | "incremental" | "differential" | "snapshot">("full");
  const [newDb, setNewDb] = useState("alaya_production");

  const handleCreate = () => {
    createBackup(newName, newType, newDb);
    toast.success("Backup started", `${newName} (${newType})`);
    setShowCreate(false);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>{backupStats.total} total</span>
          <span className="text-success">{backupStats.completed} completed</span>
          <span className="text-warning">{backupStats.verified} verified</span>
          {backupStats.failed > 0 && <span className="text-danger">{backupStats.failed} failed</span>}
          <span>{formatBytes(backupStats.totalSizeMb * 1024 * 1024)} total</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Backup</button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)} aria-hidden="true" />
          <div className="card relative z-10 w-full max-w-sm animate-scale-in p-6">
            <h2 className="text-lg font-semibold text-ink">New Backup</h2>
            <div className="mt-4 space-y-4">
              <div><label className="label-field">Name</label><input className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
              <div><label className="label-field">Type</label>
                <select className="input-field" value={newType}          onChange={(e) => setNewType(e.target.value as "full" | "incremental" | "differential" | "snapshot")}>
                  <option value="full">Full</option>
                  <option value="incremental">Incremental</option>
                  <option value="differential">Differential</option>
                  <option value="snapshot">Snapshot</option>
                </select>
              </div>
              <div><label className="label-field">Database</label><input className="input-field" value={newDb} onChange={(e) => setNewDb(e.target.value)} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={handleCreate} className="btn-primary btn-md"><Play className="h-4 w-4" /> Start</button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Policies */}
      <div className="card mb-4 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-ink mb-3"><Shield className="h-4 w-4 text-accent" /> Backup Policies</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {backupPolicies.map((bp) => (
            <div key={bp.id} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{bp.name}</p>
                <span className={cn("chip", bp.enabled && "chip-active")}>{bp.enabled ? "On" : "Off"}</span>
              </div>
              <p className="text-xs text-muted">{bp.description}</p>
              <div className="mt-1 text-xs text-muted">
                <span className="font-mono text-accent">{bp.schedule}</span>
                <span> · {bp.retentionDays}d retention</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {bp.databases.map((d) => <span key={d} className="badge bg-surface2 font-mono text-[0.55rem] text-muted">{d}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup Jobs */}
      <div className="space-y-3">
        {backupJobs.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-8 text-muted">
            <Shield className="h-8 w-8" />
            <p className="text-sm">No backup jobs yet</p>
          </div>
        ) : (
          backupJobs.map((bj) => (
            <div key={bj.id} className={cn(
              "card p-4",
              bj.status === "failed" && "border-danger/30",
              bj.status === "completed" && "border-success/20",
              bj.status === "verified" && "border-accent/30"
            )}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                      bj.status === "completed" ? "bg-success/15 text-success" :
                      bj.status === "verified" ? "bg-accent-soft text-accent" :
                      bj.status === "failed" ? "bg-danger/15 text-danger" :
                      bj.status === "running" ? "bg-warning/15 text-warning animate-pulse" :
                      "bg-surface2 text-muted"
                    )}>
                      {bj.status === "verified" ? <CheckCircle2 className="h-4 w-4" /> :
                       bj.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
                       bj.status === "failed" ? <XCircle className="h-4 w-4" /> :
                       bj.status === "running" ? <Clock className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </span>
                    <p className="font-semibold text-ink">{bj.name}</p>
                    <span className="badge bg-surface2 capitalize text-muted">{bj.type}</span>
                    <span className={cn(
                      "badge capitalize",
                      bj.status === "completed" ? "bg-success/15 text-success" :
                      bj.status === "verified" ? "bg-accent-soft text-accent" :
                      bj.status === "failed" ? "bg-danger/15 text-danger" :
                      bj.status === "running" ? "bg-warning/15 text-warning" :
                      "bg-surface2 text-muted"
                    )}>{bj.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                    <span>Database: {bj.database}</span>
                    <span>· Size: {bj.sizeMb} MB</span>
                    <span>· Duration: {(bj.durationMs / 1000).toFixed(1)}s</span>
                    <span>· Retention: {bj.retentionDays}d</span>
                    {bj.location && <span>· {bj.location}</span>}
                  </div>
                  {bj.checksum && <p className="text-xs text-muted">Checksum: {bj.checksum}</p>}
                  {bj.error && <p className="text-xs text-danger">{bj.error}</p>}
                  {bj.startedAt && <p className="text-xs text-muted">Started: {formatDateTime(bj.startedAt)}</p>}
                </div>
                <div className="flex gap-2">
                  {bj.status === "completed" && (
                    <button onClick={() => { verifyBackup(bj.id, "admin"); toast.success("Backup verified", bj.name); }} className="btn-ghost btn-sm"><CheckCircle2 className="h-3.5 w-3.5" /> Verify</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  POLICIES TAB                                                       */
/* ================================================================== */
function PoliciesTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { dataPolicies } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{dataPolicies.length} data governance policies</p>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {dataPolicies.map((p) => (
          <div key={p.id} className={cn("card p-5", !p.enabled && "opacity-60")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-9 w-9 place-items-center rounded-full",
                  p.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted"
                )}><Shield className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{p.description}</p>
                </div>
              </div>
              <span className={cn("chip", p.enabled && "chip-active")}>{p.enabled ? "Active" : "Disabled"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.actions.map((a) => (
                <span key={a} className="badge bg-accent-soft text-accent capitalize text-[0.6rem]">{a}</span>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted">
              <span>Retention: {p.retentionDays > 0 ? `${p.retentionDays} days` : "Indefinite"}</span>
              <span> · Domain: {p.domain}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.appliedTo.map((a) => (
                <span key={a} className="badge bg-surface2 font-mono text-[0.55rem] text-muted">{a}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CATALOG TAB                                                        */
/* ================================================================== */
function CatalogTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { dataCatalog, governanceStats } = ctx;

  const classColor = (c: string) => {
    switch (c) {
      case "restricted": return "bg-danger/15 text-danger";
      case "confidential": return "bg-warning/15 text-warning";
      case "internal": return "bg-accent-soft text-accent";
      default: return "bg-success/15 text-success";
    }
  };

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{governanceStats.totalCatalog}</p>
          <p className="text-xs text-muted">Catalog Entries</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-ink">{governanceStats.restrictedCount}</p>
          <p className="text-xs text-muted">Restricted</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-semibold text-warning">{governanceStats.confidentailCount}</p>
          <p className="text-xs text-muted">Confidential</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="hide-scrollbar max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-line bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Steward</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Fields</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dataCatalog.map((e) => (
                <tr key={e.id} className="hover:bg-surface2/40">
                  <td className="px-4 py-3 font-medium text-ink">{e.name}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-surface2 capitalize text-muted">{e.domain}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{e.steward}</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge capitalize", classColor(e.classification))}>{e.classification}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{e.rowCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted">{e.sizeMb} MB</td>
                  <td className="px-4 py-3 text-xs text-muted max-w-[200px] truncate">{e.fields.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  QUALITY TAB                                                        */
/* ================================================================== */
function QualityTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { qualityReports, runQualityCheck } = ctx;
  const { toast } = useToast();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{qualityReports.length} tables checked</p>
        <button onClick={() => { const reports = runQualityCheck(); toast.success("Quality check complete", `${reports.length} tables analyzed`); }} className="btn-outline btn-sm">
          <RefreshCw className="h-4 w-4" /> Run Check
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {qualityReports.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-9 w-9 place-items-center rounded-full",
                  r.score >= 95 ? "bg-success/15 text-success" : r.score >= 85 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
                )}>
                  {r.score >= 95 ? <CheckCircle2 className="h-4 w-4" /> : r.score >= 85 ? <AlertTriangle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </span>
                <div>
                  <p className="font-semibold text-ink">{r.table}</p>
                  <p className="text-xs text-muted">{r.totalRows.toLocaleString()} rows</p>
                </div>
              </div>
              <span className={cn(
                "text-lg font-bold",
                r.score >= 95 ? "text-success" : r.score >= 85 ? "text-warning" : "text-danger"
              )}>{r.score}%</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{r.duplicatesFound}</p>
                <p className="text-muted">Duplicates</p>
              </div>
              <div className="rounded-lg bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{r.nullValues}</p>
                <p className="text-muted">Nulls</p>
              </div>
              <div className="rounded-lg bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{r.orphans}</p>
                <p className="text-muted">Orphans</p>
              </div>
            </div>

            {r.issues.length > 0 && (
              <div className="mt-2 space-y-1">
                {r.issues.map((iss, i) => (
                  <p key={i} className="text-xs text-muted">• {iss.detail} ({iss.count})</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  METRICS TAB                                                        */
/* ================================================================== */
function DataMetricsTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { dataMetrics } = ctx;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {dataMetrics.map((m) => (
          <div key={m.name} className={cn(
            "card p-5",
            m.status === "warning" && "border-warning/20",
            m.status === "critical" && "border-danger/20"
          )}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{m.name}</p>
              <span className={cn(
                "text-xs font-medium",
                m.trend === "up" && m.status === "good" ? "text-success" :
                m.trend === "up" ? "text-danger" :
                m.trend === "down" && m.status === "good" ? "text-success" :
                m.trend === "down" ? "text-danger" :
                "text-muted"
              )}>
                {m.changePercent > 0 ? "↑" : m.changePercent < 0 ? "↓" : "→"} {Math.abs(m.changePercent).toFixed(1)}%
              </span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-ink">{m.value} <span className="text-sm font-normal text-muted">{m.unit}</span></p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "h-2 w-2 rounded-full",
                m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger"
              )} />
              <span className="text-xs text-muted">{m.previousValue} {m.unit} previous</span>
            </div>
            <div className="mt-3 flex items-end gap-0.5 h-10">
              {m.sparkline.map((v, i) => (
                <div key={i} className={cn(
                  "w-2 rounded-t transition-all",
                  m.status === "good" ? "bg-success/40" : m.status === "warning" ? "bg-warning/40" : "bg-danger/40"
                )} style={{ height: `${(v / Math.max(...m.sparkline)) * 100}%` }} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  LINEAGE TAB                                                        */
/* ================================================================== */
function LineageTab({ ctx }: { ctx: ReturnType<typeof useData> }) {
  const { dataLineage } = ctx;

  const typeIcon = (type: string) => {
    switch (type) {
      case "source": return <Database className="h-4 w-4" />;
      case "transform": return <Activity className="h-4 w-4" />;
      case "store": return <HardDrive className="h-4 w-4" />;
      case "export": return <Globe className="h-4 w-4" />;
      case "api": return <Eye className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "source": return "bg-success/15 border-success/30";
      case "transform": return "bg-accent-soft border-accent/30";
      case "store": return "bg-surface2 border-line";
      case "export": return "bg-warning/15 border-warning/30";
      case "api": return "bg-primary-soft border-primary/30";
      default: return "bg-surface2 border-line";
    }
  };

  const edgeIcon = (type: string) => {
    switch (type) {
      case "sync": return "→";
      case "async": return "↷";
      case "batch": return "⇶";
      case "stream": return "⇄";
      default: return "→";
    }
  };

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">
        {dataLineage.nodes.length} data nodes · {dataLineage.edges.length} data flows
      </p>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {dataLineage.nodes.map((node) => (
          <div key={node.id} className={cn("card border p-4", typeColor(node.type))}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface2 text-accent">
                {typeIcon(node.type)}
              </span>
              <div>
                <p className="font-semibold text-ink">{node.name}</p>
                <p className="text-xs text-muted capitalize">{node.type} · {node.domain}</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">{node.description}</p>

            {/* Outgoing edges */}
            {dataLineage.edges.filter((e) => e.source === node.id).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Outputs</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {dataLineage.edges.filter((e) => e.source === node.id).map((e, i) => {
                    const target = dataLineage.nodes.find((n) => n.id === e.target);
                    return (
                      <span key={i} className="badge bg-surface2 text-muted text-[0.6rem]">
                        {edgeIcon(e.type)} {target?.name || e.target}
                        <span className="ml-1 text-muted/60">{e.frequency}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Incoming edges */}
            {dataLineage.edges.filter((e) => e.target === node.id).length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Inputs</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {dataLineage.edges.filter((e) => e.target === node.id).map((e, i) => {
                    const source = dataLineage.nodes.find((n) => n.id === e.source);
                    return (
                      <span key={i} className="badge bg-surface2 text-muted text-[0.6rem]">
                        {source?.name || e.source} {edgeIcon(e.type)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
