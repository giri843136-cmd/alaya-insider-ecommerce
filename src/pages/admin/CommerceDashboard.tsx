import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, ShoppingBag, Receipt, TrendingUp, TrendingDown, AlertTriangle, Package, Truck, Settings2, Brain, Ship, Calculator, Megaphone, Workflow, Banknote, FileBarChart } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { AreaChart, BarChart, RankList } from "../../components/charts";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { STATUS_STYLES } from "../../lib/orderStatus";
import { COMMERCE_STORAGE_KEY, DEFAULT_COMMERCE_SETTINGS, type CommerceSettings, type CommerceMetrics } from "../../lib/commerce-types";

function getCommerceSettings(): CommerceSettings {
  try { const r = localStorage.getItem(COMMERCE_STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return DEFAULT_COMMERCE_SETTINGS;
}

function computeMetrics(products: any[], orders: any[], suppliers: any[]): CommerceMetrics {
  const revenue = orders.reduce((s: number, o: any) => s + o.total, 0);
  const profit = orders.reduce((s: number, o: any) => {
    const cogs = o.items.reduce((si: number, it: any) => {
      const p = products.find((pp: any) => pp.id === it.productId);
      return si + (p?.costPrice || 0) * it.qty;
    }, 0);
    return s + o.total - cogs;
  }, 0);
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const lowStock = products.filter((p: any) => p.stock <= 8 && p.type !== "digital" && !p.affiliate).length;
  const inventoryHealth = products.length ? Math.round((1 - lowStock / products.length) * 100) : 100;
  const supplierAlerts = suppliers.filter((s: any) => !s.active).length;

  const productRevenue = products.map((p: any) => ({
    id: p.id, name: p.name,
    revenue: orders.reduce((s: number, o: any) =>
      s + o.items.filter((i: any) => i.productId === p.id).reduce((si: number, i: any) => si + i.price * i.qty, 0), 0),
  })).sort((a: any, b: any) => b.revenue - a.revenue);

  const byDay: Record<string, { amount: number; count: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    byDay[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = { amount: 0, count: 0 };
  }
  orders.forEach((o: any) => {
    const key = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (byDay[key]) { byDay[key].amount += o.total; byDay[key].count++; }
  });

  return {
    totalRevenue: Math.round(revenue * 100) / 100,
    totalOrders: orders.length,
    totalProfit: Math.round(profit * 100) / 100,
    averageMargin: Math.round(margin * 10) / 10,
    pendingOrders: orders.filter((o: any) => o.status === "pending").length,
    processingOrders: orders.filter((o: any) => o.status === "processing" || o.status === "paid").length,
    shippedOrders: orders.filter((o: any) => o.status === "shipped").length,
    deliveredOrders: orders.filter((o: any) => o.status === "delivered").length,
    cancelledOrders: orders.filter((o: any) => o.status === "cancelled").length,
    refundedOrders: orders.filter((o: any) => o.status === "refunded").length,
    inventoryHealth, supplierAlerts, lowStockCount: lowStock,
    averageDeliveryDays: 1,
    topProducts: productRevenue.slice(0, 5),
    worstProducts: [...productRevenue].reverse().slice(0, 5),
    recentOrders: [...orders].sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 5).map((o: any) => ({
      id: o.id, number: o.number, customer: o.customer.name, total: o.total, status: o.status, createdAt: o.createdAt,
    })),
    revenueByDay: Object.entries(byDay).map(([date, v]: any) => ({ label: date, value: Math.round(v.amount) })) as { label: string; value: number }[],
    ordersByDay: Object.entries(byDay).map(([date, v]: any) => ({ label: date, value: v.count })) as { label: string; value: number }[],
  };
}

export default function CommerceDashboard() {
  const { products, orders, suppliers } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cs, setCs] = useState(getCommerceSettings);

  const metrics = useMemo(() => computeMetrics(products, orders, suppliers), [products, orders, suppliers]);

  const STATS = [
    { label: "Total Revenue", value: metrics.totalRevenue, icon: DollarSign, format: "currency" as const, sub: `${metrics.totalOrders} orders`, change: "+12.5%" },
    { label: "Total Profit", value: metrics.totalProfit, icon: TrendingUp, format: "currency" as const, sub: `${metrics.averageMargin}% avg margin`, change: "+8.3%" },
    { label: "Pending Orders", value: metrics.pendingOrders, icon: Receipt, format: "number" as const, sub: `${metrics.processingOrders} processing`, change: "-3.1%" },
    { label: "Shipped", value: metrics.shippedOrders, icon: Package, format: "number" as const, sub: `${metrics.deliveredOrders} delivered`, change: "+15.2%" },
    { label: "Inventory Health", value: `${metrics.inventoryHealth}%`, icon: Truck, format: "text" as const, sub: `${metrics.lowStockCount} low stock`, status: metrics.inventoryHealth > 80 ? "good" : metrics.inventoryHealth > 60 ? "warn" : "bad", change: metrics.inventoryHealth >= 70 ? "+2.1%" : "-1.5%" },
    { label: "Supplier Alerts", value: metrics.supplierAlerts, icon: AlertTriangle, format: "number" as const, sub: "Need attention", status: metrics.supplierAlerts > 0 ? "bad" : "good", change: metrics.supplierAlerts === 0 ? "+0%" : "+1" },
  ];

  return (
    <>
      <Seo title="Commerce Dashboard" path="/admin/commerce" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Commerce Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Real-time dropshipping & commerce operations overview.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/commerce/products" className="btn-primary btn-md"><ShoppingBag className="h-4 w-4" /> Manage Products</Link>
            <Link to="/admin/commerce/orders" className="btn-outline btn-md"><Receipt className="h-4 w-4" /> Orders</Link>
            <button onClick={() => setSettingsOpen(true)} className="btn-ghost btn-sm"><Settings2 className="h-4 w-4" /> Settings</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STATS.map((s, i) => (
            <div key={s.label} className="card card-hover p-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}>
              <div className="flex items-center justify-between">
                <span className={cn("grid h-10 w-10 place-items-center rounded-full", 
                  s.status === "bad" ? "bg-danger/15 text-danger" : s.status === "warn" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>
                  <s.icon className="h-5 w-5" />
                </span>
                <span className={cn("flex items-center gap-0.5 text-xs font-medium", s.change.startsWith("+") ? "text-success" : "text-danger")}>
                  {s.change.startsWith("+") ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.change}
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink tabular-nums">
                {s.format === "currency" ? <Money amount={s.value as number} /> : s.value}
              </p>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted/70">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Revenue (30 days)</h2>
              <span className="text-xs text-muted">${metrics.revenueByDay.reduce((s, d) => s + d.value, 0).toLocaleString()}</span>
            </div>
            <div className="mt-4"><AreaChart data={metrics.revenueByDay} height={160} /></div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Orders (30 days)</h2>
              <span className="text-xs text-muted">{metrics.ordersByDay.reduce((s, d) => s + d.value, 0)} total</span>
            </div>
            <div className="mt-4"><BarChart data={metrics.ordersByDay} height={160} /></div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">Recent Orders</h2>
              <Link to="/admin/commerce/orders" className="link-line text-sm text-accent">View all</Link>
            </div>
            {metrics.recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No orders yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {metrics.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface2/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{o.customer}</p>
                      <p className="text-xs text-muted">{o.number} · {formatDateTime(o.createdAt)}</p>
                    </div>
                    <span className={cn("badge capitalize", STATUS_STYLES[o.status])}>{o.status}</span>
                    <span className="text-sm font-semibold text-ink tabular-nums"><Money amount={o.total} /></span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><TrendingUp className="h-4 w-4 text-success" /> Top Products</h2></div>
              <div className="p-4"><RankList data={metrics.topProducts.map(p => ({ label: p.name.length > 30 ? p.name.slice(0, 30) + "\u2026" : p.name, value: p.revenue }))} format={(n) => `$${n.toLocaleString()}`} /></div>
            </div>
            <div className="card">
              <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">AI Commerce Insights</h2></div>
              <div className="p-4 space-y-2 text-xs text-muted">
                <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{metrics.lowStockCount > 0 ? `${metrics.lowStockCount} products low on stock` : "Inventory levels healthy"}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />Avg margin: {metrics.averageMargin}% {metrics.averageMargin < 30 ? "— review pricing" : "— healthy"}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{metrics.supplierAlerts > 0 ? `${metrics.supplierAlerts} supplier(s) need attention` : "All suppliers active"}</li>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/admin/commerce/products" className="btn-outline btn-sm"><ShoppingBag className="h-4 w-4" /> Products</Link>
          <Link to="/admin/commerce/suppliers" className="btn-outline btn-sm"><Truck className="h-4 w-4" /> Suppliers</Link>
          <Link to="/admin/commerce/inventory" className="btn-outline btn-sm"><Package className="h-4 w-4" /> Inventory</Link>
          <Link to="/admin/commerce/shipping" className="btn-outline btn-sm"><Ship className="h-4 w-4" /> Shipping</Link>
          <Link to="/admin/commerce/pricing" className="btn-outline btn-sm"><Calculator className="h-4 w-4" /> Pricing</Link>
          <Link to="/admin/commerce/marketing" className="btn-outline btn-sm"><Megaphone className="h-4 w-4" /> Marketing</Link>
          <Link to="/admin/commerce/automation" className="btn-outline btn-sm"><Workflow className="h-4 w-4" /> Automation</Link>
          <Link to="/admin/commerce/reports" className="btn-outline btn-sm"><FileBarChart className="h-4 w-4" /> Reports</Link>
          <Link to="/admin/commerce/finance" className="btn-outline btn-sm"><Banknote className="h-4 w-4" /> Finance</Link>
          <Link to="/admin/commerce/ai" className="btn-outline btn-sm"><Brain className="h-4 w-4" /> AI Commerce</Link>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSettingsOpen(false)} />
          <div className="card relative z-10 w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Commerce Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2">✕</button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Low Stock Threshold</label><input type="number" className="input-field" value={cs.lowStockThreshold} onChange={e => setCs({...cs, lowStockThreshold: Number(e.target.value)})} /></div>
                <div><label className="label-field">Default Target Margin (%)</label><input type="number" className="input-field" value={cs.defaultTargetMargin} onChange={e => setCs({...cs, defaultTargetMargin: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Min Margin (%)</label><input type="number" className="input-field" value={cs.defaultMinMargin} onChange={e => setCs({...cs, defaultMinMargin: Number(e.target.value)})} /></div>
                <div><label className="label-field">Max Margin (%)</label><input type="number" className="input-field" value={cs.defaultMaxMargin} onChange={e => setCs({...cs, defaultMaxMargin: Number(e.target.value)})} /></div>
              </div>
              <div><label className="label-field">Tax Rate (%)</label><input type="number" className="input-field" value={cs.defaultTaxRate} onChange={e => setCs({...cs, defaultTaxRate: Number(e.target.value)})} /></div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-ink">Automation</h3>
                {(["autoAssignSupplier","autoCreatePO","autoUpdateInventory","autoSendTracking","automationEnabled","pricingEngineEnabled","aiCommerceEnabled"] as const).map(k => (
                  <label key={k} className="flex items-center justify-between text-sm text-ink">
                    <span className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                    <button onClick={() => setCs({...cs, [k]: !cs[k]})} className={cn("relative h-6 w-11 rounded-full transition-colors", cs[k] ? "bg-accent" : "bg-line")}>
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", cs[k] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setSettingsOpen(false)} className="btn-ghost btn-md">Cancel</button>
                <button onClick={() => { localStorage.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(cs)); setSettingsOpen(false); }} className="btn-primary btn-md">Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
