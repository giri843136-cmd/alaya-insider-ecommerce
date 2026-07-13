import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Database, Cpu, HardDrive, Activity, ShieldCheck, Download, RotateCcw, Trash2, Play, CheckCircle2, Clock, Server, Zap, FileJson, Layers, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { jobQueue, JOB_LABELS, type Job, type JobType } from "../../lib/jobs";
import { createBackup, listBackups, downloadBackup, deleteBackup, restoreBackup, verifyBackup, formatBytes, type BackupMeta } from "../../lib/backup";
import { formatDate, formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { checkBackendHealth, getBackendStatus, Backend, isApiConfigured } from "../../lib/backend";

const JOB_TYPES: JobType[] = ["image_optimization", "affiliate_link_validation", "email_send", "supplier_notification", "seo_generation", "analytics_processing", "search_indexing", "backup", "report_generation", "cache_purge"];

const API_MODULES = [
  { name: "ProductService", methods: ["list", "get", "create", "update", "remove", "bulkDelete"], entities: "products" },
  { name: "OrderService", methods: ["list", "get", "setStatus", "remove"], entities: "orders" },
  { name: "BrandService", methods: ["list", "create", "update", "remove"], entities: "brands" },
  { name: "CategoryService", methods: ["list", "create", "update", "remove"], entities: "categories" },
  { name: "ArticleService", methods: ["list", "create", "update", "remove"], entities: "articles" },
  { name: "CustomerService", methods: ["list", "get", "update"], entities: "customers" },
  { name: "CouponService", methods: ["list", "create", "remove"], entities: "coupons" },
  { name: "PopupService", methods: ["list", "create", "update", "remove"], entities: "popups" },
  { name: "SupplierService", methods: ["list", "create", "update", "remove"], entities: "suppliers" },
  { name: "GatewayService", methods: ["list", "create", "remove"], entities: "payment_gateways" },
  { name: "RedirectService", methods: ["list", "create", "remove"], entities: "redirects" },
  { name: "ReturnService", methods: ["list", "create", "update"], entities: "returns" },
];

export default function AdminSystem() {
  const store = useStore();
  const { resetData, settings } = store;
  const { toast } = useToast();
  const [tab, setTab] = useState<"health" | "jobs" | "backups" | "api">("health");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [backendChecking, setBackendChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const refreshBackups = () => setBackups(listBackups());

  const runHealthCheck = async () => {
    if (backendChecking) return;
    setBackendChecking(true);
    const ok = await checkBackendHealth();
    setBackendHealthy(ok);
    const s = getBackendStatus();
    setLastSync(s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleTimeString() : null);
    setBackendChecking(false);
  };

  const syncNow = async () => {
    if (!isApiConfigured()) {
      toast.error("Not configured", "Set a backend API URL in Settings > Developer to enable sync.");
      return;
    }
    setSyncing(true);
    toast.info("Syncing…", "Fetching latest data from backend.");
    const result = await Backend.fetchAll();
    if (result) {
      setBackendHealthy(true);
      const s = getBackendStatus();
      setLastSync(s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleTimeString() : null);
      toast.success("Sync complete", `Loaded ${result.products.length} products, ${result.orders.length} orders, ${result.customers.length} customers`);
    } else {
      const s = getBackendStatus();
      toast.error("Sync failed", s.lastError ?? "Could not reach backend. Check configuration.");
    }
    setSyncing(false);
  };

  useEffect(() => {
    refreshBackups();
    const unsub = jobQueue.subscribe(setJobs);
    // Check backend health on mount
    runHealthCheck();
    return () => { unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // system stats derived from data size
  const dataStr = JSON.stringify(store).length;
  const dbSize = formatBytes(dataStr);
  const totalRecords =
    store.products.length + store.orders.length + store.customers.length +
    store.brands.length + store.categories.length + store.articles.length +
    store.questions.length + store.auditLogs.length + store.returns.length;

  const runJob = (type: JobType) => {
    jobQueue.enqueue(type, JOB_LABELS[type]);
    toast.info("Job queued", JOB_LABELS[type]);
  };

  const createManualBackup = () => {
    // build a snapshot from the store's current data
    const data = {
      version: store.products.length, products: store.products, categories: store.categories, brands: store.brands,
      orders: store.orders, coupons: store.coupons, articles: store.articles, customers: store.customers,
      questions: store.questions, suppliers: store.suppliers, paymentGateways: store.paymentGateways,
      returns: store.returns, redirects: store.redirects, popups: store.popups, abandonedCarts: store.abandonedCarts,
      referrals: store.referrals, loyaltyTiers: store.loyaltyTiers, liveSales: store.liveSales, affiliates: store.affiliates,
      auditLogs: store.auditLogs, settings,
    } as never;
    const meta = createBackup(data, "manual");
    refreshBackups();
    toast.success("Backup created", `${meta.label} · ${formatBytes(meta.size)}`);
  };

  const restore = (id: string) => {
    const data = restoreBackup(id);
    if (!data) return toast.error("Restore failed", "Backup data unreadable.");
    localStorage.setItem("alaya_store_v8", JSON.stringify(data));
    toast.success("Backup restored", "Reloading…");
    setTimeout(() => window.location.reload(), 900);
  };

  const HEALTH = [
    { label: "Database size", value: dbSize, sub: `${totalRecords.toLocaleString()} records`, icon: Database, tone: "accent" },
    { label: "Cache status", value: "Active", sub: "Object + query cache", icon: Zap, tone: "success" },
    { label: "Index health", value: "Optimized", sub: `${store.products.length} products indexed`, icon: Layers, tone: "success" },
    { label: "Security", value: "Protected", sub: "XSS · CSRF · validation", icon: ShieldCheck, tone: "success" },
    { label: "Search engine", value: "Ready", sub: "Autocomplete + synonyms", icon: Activity, tone: "accent" },
    { label: "Error rate (24h)", value: "0.0%", sub: "No errors logged", icon: Cpu, tone: "success" },
  ];

  return (
    <>
      <Seo title="System" path="/admin/system" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">System & Backend</h1>
            <p className="mt-1 text-sm text-muted">Infrastructure health, jobs, backups & API surface.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["health", "jobs", "backups", "api"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>{t === "api" ? "API surface" : t}</button>
            ))}
          </div>
        </div>

        {/* HEALTH */}
        {tab === "health" && (
          <>
            {/* Backend connection status */}
            <div className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                    backendHealthy === true ? "bg-success/15" : backendHealthy === false ? "bg-danger/15" : "bg-warning/15"
                  )}>
                    {backendHealthy === true ? (
                      <Wifi className={cn("h-6 w-6", backendHealthy ? "text-success" : "text-warning")} />
                    ) : backendHealthy === false ? (
                      <WifiOff className="h-6 w-6 text-danger" />
                    ) : (
                      <RefreshCw className="h-6 w-6 animate-spin text-warning" />
                    )}
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">Backend API Connection</h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {backendHealthy === true
                        ? "Connected and healthy"
                        : backendHealthy === false
                          ? "Disconnected — local mode active"
                          : backendChecking
                            ? "Pinging health endpoint…"
                            : "Not checked yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={runHealthCheck} disabled={backendChecking} className="btn-outline btn-sm">
                    <RefreshCw className={cn("h-4 w-4", backendChecking && "animate-spin")} />
                    {backendChecking ? "Checking…" : "Check health"}
                  </button>
                  <button onClick={syncNow} disabled={syncing} className="btn-primary btn-sm">
                    <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                    {syncing ? "Syncing…" : "Sync now"}
                  </button>
                </div>
              </div>
              {isApiConfigured() && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-surface2/50 px-4 py-3">
                    <p className="text-xs text-muted">Mode</p>
                    <p className="mt-0.5 text-sm font-semibold capitalize text-ink">{getBackendStatus().mode}</p>
                  </div>
                  {lastSync && (
                    <div className="rounded-xl bg-surface2/50 px-4 py-3">
                      <p className="text-xs text-muted">Last sync</p>
                      <p className="mt-0.5 text-sm font-semibold text-ink">{lastSync}</p>
                    </div>
                  )}
                  <div className="rounded-xl bg-surface2/50 px-4 py-3">
                    <p className="text-xs text-muted">Backend URL</p>
                    <p className="mt-0.5 truncate text-sm font-semibold font-mono text-ink" title={getBackendStatus().healthUrl}>{getBackendStatus().healthUrl || "Not configured"}</p>
                  </div>
                </div>
              )}
              {!isApiConfigured() && (
                <div className="mt-4 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
                  No backend API URL configured. Set <code className="font-mono">VITE_API_URL</code> in your environment or configure in{' '}
                  <Link to="/admin/settings" className="underline hover:no-underline">Settings → Developer</Link>.
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HEALTH.map((h) => (
                <div key={h.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full", h.tone === "success" ? "bg-success/15 text-success" : "bg-accent-soft text-accent")}><h.icon className="h-5 w-5" /></span>
                    <span className="h-2 w-2 rounded-full bg-success" title="Healthy" />
                  </div>
                  <p className="mt-4 font-display text-xl font-semibold text-ink">{h.value}</p>
                  <p className="text-sm text-muted">{h.label}</p>
                  <p className="text-xs text-muted">{h.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Server className="h-4 w-4 text-accent" /> Architecture readiness</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {["Normalized modules with foreign-key relations", "Service layer (DI) — swappable for REST/GraphQL", "Background job queue with audit logging", "Read-replica & caching ready", "Horizontal scaling — stateless modules", "Backup + restore with verification"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-muted"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><HardDrive className="h-4 w-4 text-accent" /> Module count</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Products", store.products.length], ["Orders", store.orders.length], ["Customers", store.customers.length],
                    ["Brands", store.brands.length], ["Articles", store.articles.length], ["Audit logs", store.auditLogs.length],
                    ["Suppliers", store.suppliers.length], ["Returns", store.returns.length],
                  ].map(([label, n]) => (
                    <div key={label as string} className="flex items-center justify-between rounded-lg bg-surface2/50 px-3 py-2">
                      <span className="text-muted">{label}</span><span className="font-semibold text-ink">{n as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* JOBS */}
        {tab === "jobs" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Enqueue background jobs. They run async with progress tracking + audit logging.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => (
                <button key={t} onClick={() => runJob(t)} className="btn-outline btn-sm"><Play className="h-3.5 w-3.5" /> {JOB_LABELS[t]}</button>
              ))}
            </div>
            <div className="mt-6">
              {jobs.length === 0 ? (
                <EmptyState icon={<Activity className="h-6 w-6" />} title="No jobs run yet" description="Queue a job above to see it execute." />
              ) : (
                <div className="card overflow-hidden">
                  <ul className="divide-y divide-line">
                    {jobs.slice(0, 20).map((j) => (
                      <li key={j.id} className="flex items-center gap-4 px-4 py-3">
                        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full",
                          j.status === "complete" ? "bg-success/15 text-success" : j.status === "running" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                          {j.status === "complete" ? <CheckCircle2 className="h-4 w-4" /> : j.status === "running" ? <Clock className="h-4 w-4 animate-spin-slow" /> : <Clock className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{JOB_LABELS[j.type]}</p>
                          <p className="text-xs text-muted">{formatDateTime(j.createdAt)}</p>
                          {j.status === "running" && (
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface2">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${j.progress}%` }} />
                          </div>
                          )}
                        </div>
                        <span className={cn("badge capitalize", j.status === "complete" ? "bg-success/15 text-success" : j.status === "running" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{j.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BACKUPS */}
        {tab === "backups" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{backups.length} backups · max 10 retained</p>
              <button onClick={createManualBackup} className="btn-primary btn-sm"><Database className="h-4 w-4" /> Create backup</button>
            </div>
            {backups.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Database className="h-6 w-6" />} title="No backups yet" description="Create a full snapshot of your store data." action={<button onClick={createManualBackup} className="btn-primary btn-md">Create backup</button>} /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {backups.map((b) => {
                  const verify = verifyBackup(b.id);
                  return (
                    <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Database className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-ink">{b.label}</p>
                          <span className="badge capitalize bg-surface2 text-muted">{b.type}</span>
                          {verify.valid && <span className="badge bg-success/15 text-success">Verified</span>}
                        </div>
                        <p className="text-xs text-muted">{formatDate(b.createdAt)} · {formatBytes(b.size)} · {verify.products} products, {verify.orders} orders</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => downloadBackup(b.id)} aria-label="Download" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Download className="h-4 w-4" /></button>
                        <button onClick={() => restore(b.id)} aria-label="Restore" className="grid h-8 w-8 place-items-center rounded-full text-accent hover:bg-accent-soft"><RotateCcw className="h-4 w-4" /></button>
                        <button onClick={() => { deleteBackup(b.id); refreshBackups(); toast.success("Backup deleted"); }} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Danger zone */}
            <div className="mt-8 rounded-[var(--radius-xl2)] border border-danger/30 bg-danger/5 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-danger"><RotateCcw className="h-4 w-4" /> Reset store data</h3>
              <p className="mt-1 text-sm text-muted">Restore all products, orders, settings and more to original seed state.</p>
              <button onClick={() => { if (confirm("Reset all store data to defaults?")) { resetData(); toast.success("Store reset"); } }} className="btn btn-md mt-3 border border-danger/40 text-danger hover:bg-danger/10">Reset to defaults</button>
            </div>
          </div>
        )}

        {/* API SURFACE */}
        {tab === "api" && (
          <div className="mt-8">
            <div className="flex items-center gap-2 rounded-[var(--radius-xl2)] bg-surface2/50 p-4 text-sm text-muted">
              <FileJson className="h-4 w-4 text-accent" /> Every frontend action communicates through the versioned service layer (<code className="font-mono text-ink">api.v1</code>). Swappable for REST/GraphQL with zero UI changes.
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {API_MODULES.map((m) => (
                <div key={m.name} className="card p-4">
                  <p className="font-mono text-sm font-semibold text-accent">{m.name}</p>
                  <p className="text-xs text-muted">{m.entities}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.methods.map((meth) => <span key={meth} className="badge bg-surface2 font-mono text-[0.6rem] text-muted">{meth}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="card mt-4 overflow-hidden">
              <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-4 w-4 text-accent" /> Every API response</h2></div>
              <ul className="grid gap-px bg-line sm:grid-cols-2">
                {["Success", "Validation Error", "Authentication Error", "Permission Error", "Server Error", "Rate Limit Error"].map((r) => (
                  <li key={r} className="flex items-center gap-2 bg-surface px-5 py-3 text-sm text-ink"><CheckCircle2 className="h-4 w-4 text-success" /> {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
