import { useState, useEffect } from "react";
import { BarChart3, Truck, Clock, DollarSign, Percent, Package } from "lucide-react";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";

interface Analytics {
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

const API = "/api/v1/shipping";

export default function AdminShippingAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/analytics?days=${days}`)
      .then(r => r.json())
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="p-5 sm:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-surface2" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-surface2" />)}
        </div>
      </div>
    );
  }

  const mainStats = [
    { label: "Total Shipments", value: analytics?.totalShipments ?? 0, icon: Package, change: "+12% vs last period" },
    { label: "Delivery Rate", value: `${analytics?.deliveryRate ?? 0}%`, icon: Percent, change: analytics && analytics.deliveryRate >= 95 ? "Excellent" : "Needs improvement" },
    { label: "Avg Delivery", value: `${analytics?.avgDeliveryDays ?? 0} days`, icon: Clock, change: "Across all carriers" },
    { label: "Total Cost", value: `$${(analytics?.totalShippingCost ?? 0).toLocaleString()}`, icon: DollarSign, change: `Avg $${(analytics?.avgShippingCost ?? 0).toFixed(2)}/shipment` },
  ];

  return (
    <>
      <Seo title="Shipping Analytics" path="/admin/shipping/analytics" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Shipping Analytics</h1>
            <p className="mt-1 text-sm text-muted">Comprehensive delivery analytics and carrier performance metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={cn("chip", days === d && "chip-active")}>{d}d</button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mainStats.map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{s.label}</p>
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.change}</p>
            </div>
          ))}
        </div>

        {/* Detailed Stats */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Carrier Performance */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Carrier Performance</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted">
                  <tr className="border-b border-line">
                    <th className="px-3 py-2">Carrier</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Delivered</th>
                    <th className="px-3 py-2 text-right">Exceptions</th>
                    <th className="px-3 py-2 text-right">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {analytics?.carrierPerformance?.map((c, i) => (
                    <tr key={i} className="hover:bg-surface2/40">
                      <td className="px-3 py-2.5 font-medium text-ink">{c.carrier_name}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{c.total}</td>
                      <td className="px-3 py-2.5 text-right text-green-600">{c.delivered}</td>
                      <td className="px-3 py-2.5 text-right text-red-600">{c.exceptions}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={cn("font-medium", c.success_rate >= 95 ? "text-green-600" : c.success_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                          {c.success_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold text-ink flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Delivery Summary</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Delivered</span>
                    <span className="font-medium text-green-600">{analytics?.delivered ?? 0} ({analytics?.deliveryRate ?? 0}%)</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${analytics?.deliveryRate ?? 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">In Transit</span>
                    <span className="font-medium text-ink">{analytics?.inTransit ?? 0}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${analytics?.totalShipments ? ((analytics?.inTransit ?? 0) / analytics.totalShipments) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Exceptions</span>
                    <span className="font-medium text-red-600">{analytics?.exceptions ?? 0}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${analytics?.totalShipments ? ((analytics?.exceptions ?? 0) / analytics.totalShipments) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-ink flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent" /> Cost Analysis</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-surface2 p-3 text-center">
                  <p className="text-2xl font-semibold text-ink">${(analytics?.totalShippingCost ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted">Total Shipping Cost</p>
                </div>
                <div className="rounded-lg bg-surface2 p-3 text-center">
                  <p className="text-2xl font-semibold text-ink">$${(analytics?.avgShippingCost ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-muted">Avg Cost / Shipment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
