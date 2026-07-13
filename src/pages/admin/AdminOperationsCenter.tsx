/**
 * ALAYA INSIDER — Operations Center (PART 3.6)
 * ------------------------------------------------------------------
 * Platform health monitoring, business overview, infrastructure status,
 * and operational analytics.
 */
import { useMemo } from "react";
import {
  Activity, Server, AlertTriangle, CheckCircle,
  Clock, Eye,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";
import { useStore } from "../../context/StoreContext";
import { getBusinessOverview, getPlatformHealth, getAdminPortalStats, getIncidents } from "../../lib/adminPortal";

export default function AdminOperationsCenter() {
  const { products, orders, customers, affiliates } = useStore();
  const affiliateProducts = useMemo(() => products.filter((p) => p.affiliate), [products]);
  const bizOverview = useMemo(() => getBusinessOverview(orders, products, customers, affiliateProducts, affiliates), [orders, products, customers, affiliateProducts, affiliates]);
  const health = useMemo(() => getPlatformHealth(), []);
  const stats = useMemo(() => getAdminPortalStats(), []);
  const incidents = useMemo(() => getIncidents(), []);

  return (
    <>
      <Seo title="Operations Center" path="/admin/operations-center" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Operations Center</h1>
            <p className="mt-1 text-sm text-muted">Platform health, business overview, and infrastructure monitoring.</p>
          </div>
        </div>

        {/* Platform Status */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cn("card p-4", health.status === "healthy" ? "border-success/30" : "border-danger/30")}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted">Platform Status</p>
              {health.status === "healthy" ? <CheckCircle className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-danger" />}
            </div>
            <p className="mt-2 text-xl font-semibold text-ink capitalize">{health.status}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {health.uptime}% uptime</span>
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {health.responseTime}ms</span>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Services</p>
            <p className="mt-2 text-xl font-semibold text-ink">{health.services.filter((s) => s.status === "operational").length}/{health.services.length} operational</p>
            {health.services.filter((s) => s.status !== "operational").length > 0 && (
              <p className="mt-1 text-xs text-warning">{health.services.filter((s) => s.status !== "operational").length} degraded</p>
            )}
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Active Incidents</p>
            <p className="mt-2 text-xl font-semibold text-ink">{incidents.filter((i) => i.status !== "resolved").length}</p>
            {health.lastIncident && <p className="mt-1 text-xs text-muted">Last: {formatDateTime(health.lastIncident)}</p>}
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Active Users</p>
            <p className="mt-2 text-xl font-semibold text-ink">{stats.totalAdminUsers}</p>
            <p className="mt-1 text-xs text-muted">Administrators online</p>
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-accent" /> Service Health</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {health.services.map((s) => {
              const statusIcons: Record<string, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: AlertTriangle };
              const Icon = statusIcons[s.status] || CheckCircle;
              const statusColors: Record<string, string> = { operational: "text-success", degraded: "text-warning", down: "text-danger" };
              return (
                <div key={s.name} className={cn("card p-4", s.status !== "operational" && "ring-1 ring-warning")}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    <Icon className={cn("h-4 w-4", statusColors[s.status])} />
                  </div>
                  <p className={cn("mt-1 text-xs font-medium capitalize", statusColors[s.status])}>{s.status}</p>
                  <p className="text-xs text-muted">{s.latency}ms latency</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incidents */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Active Incidents</h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No active incidents. All systems operational.</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", inc.severity === "critical" ? "bg-danger" : inc.severity === "high" ? "bg-warning" : "bg-info")} />
                      <h3 className="font-semibold text-ink">{inc.title}</h3>
                    </div>
                    <Badge variant={inc.status === "resolved" ? "success" : inc.status === "investigating" ? "warning" : "neutral"}>{inc.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{inc.description}</p>
                  <div className="mt-2 space-y-1">
                    {inc.timeline.slice(0, 3).map((t, i) => (
                      <p key={i} className="text-xs text-muted">
                        <span className="font-medium text-ink">{formatDateTime(t.ts)}</span> — {t.message}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Overview */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2"><Eye className="h-5 w-5 text-accent" /> Business Overview</h2>
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Products", value: bizOverview.activeProducts, total: bizOverview.totalProducts },
                { label: "Orders", value: bizOverview.totalOrders, total: 0 },
                { label: "Customers", value: bizOverview.totalCustomers, total: 0 },
                { label: "Affiliate Products", value: affiliateProducts.length, total: 0 },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-xs text-muted">{m.label}</p>
                  <p className="text-2xl font-semibold text-ink mt-1">{m.value.toLocaleString()}</p>
                  {m.total > 0 && <p className="text-xs text-muted">of {m.total.toLocaleString()} total</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
