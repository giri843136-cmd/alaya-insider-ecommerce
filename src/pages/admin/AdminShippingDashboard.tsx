import { useState, useEffect } from "react";
import { Ship, Truck, Package, Clock, DollarSign, TrendingUp, AlertTriangle, Activity, BarChart3, ExternalLink } from "lucide-react";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";

interface AnalyticsData {
  totalShipments: number;
  delivered: number;
  inTransit: number;
  exceptions: number;
  deliveryRate: number;
  avgDeliveryDays: number;
  totalShippingCost: number;
  avgShippingCost: number;
  carrierPerformance: Array<{ carrier_name: string; total: number; delivered: number; exceptions: number; success_rate: number }>;
}

interface Shipment {
  id: string;
  number: string;
  customer_name: string;
  carrier_name: string;
  status: string;
  tracking_number: string;
  created_at: string;
  estimated_delivery: string;
}

const API = "/api/v1/shipping";

export default function AdminShippingDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/analytics?days=30`).then(r => r.json()),
      fetch(`${API}/shipments/recent?limit=10`).then(r => r.json()),
    ]).then(([analyticsData, shipmentsData]) => {
      setAnalytics(analyticsData);
      setRecentShipments(Array.isArray(shipmentsData) ? shipmentsData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Total Shipments", value: analytics?.totalShipments ?? 0, icon: Package, color: "text-blue-600" },
    { label: "Delivered", value: analytics?.delivered ?? 0, icon: Truck, color: "text-green-600" },
    { label: "In Transit", value: analytics?.inTransit ?? 0, icon: Ship, color: "text-amber-600" },
    { label: "Exceptions", value: analytics?.exceptions ?? 0, icon: AlertTriangle, color: "text-red-600" },
    { label: "Delivery Rate", value: `${analytics?.deliveryRate ?? 0}%`, icon: TrendingUp, color: "text-emerald-600" },
    { label: "Avg Delivery", value: `${analytics?.avgDeliveryDays ?? 0} days`, icon: Clock, color: "text-purple-600" },
    { label: "Total Cost", value: `$${(analytics?.totalShippingCost ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-600" },
    { label: "Avg Cost/Shipment", value: `$${(analytics?.avgShippingCost ?? 0).toFixed(2)}`, icon: BarChart3, color: "text-indigo-600" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    in_transit: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    exception: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <>
      <Seo title="Shipping Dashboard" path="/admin/shipping" />
      <div className="p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Shipping Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Real-time overview of shipping operations and carrier performance.</p>
          </div>
          <a href="/admin/commerce/shipping" className="btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /> Manage Profiles</a>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {loading ? <span className="inline-block h-6 w-20 animate-pulse rounded bg-surface2" /> : s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recent Shipments */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink flex items-center gap-2"><Package className="h-4 w-4 text-accent" /> Recent Shipments</h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-surface2" />
                ))
              ) : recentShipments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No shipments yet</p>
              ) : (
                recentShipments.map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-line p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{s.number}</p>
                      <p className="text-xs text-muted truncate">{s.customer_name} · {s.carrier_name || "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {s.tracking_number && <span className="text-xs text-muted font-mono">{s.tracking_number.slice(0, 12)}...</span>}
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusColors[s.status] || "bg-gray-100 text-gray-800")}>
                        {s.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Carrier Performance */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Carrier Performance</h2>
            <div className="mt-4 space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-surface2" />
                ))
              ) : !analytics?.carrierPerformance?.length ? (
                <p className="py-8 text-center text-sm text-muted">No carrier data yet</p>
              ) : (
                analytics.carrierPerformance.map((c, i) => (
                  <div key={c.carrier_name || i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{c.carrier_name}</span>
                      <span className="text-muted">
                        {c.delivered}/{c.total} · <span className={c.success_rate >= 95 ? "text-green-600" : c.success_rate >= 80 ? "text-amber-600" : "text-red-600"}>{c.success_rate}%</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2">
                      <div
                        className={cn("h-full rounded-full transition-all", c.success_rate >= 95 ? "bg-green-500" : c.success_rate >= 80 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${Math.min(c.success_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
