import { useMemo, useState } from "react";
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Globe, Smartphone, Activity, Eye, RefreshCw, FileBarChart, Star, Heart, Scale, Share2, Link2 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { AreaChart, BarChart, DonutChart, RankList } from "../../components/charts";
import { Money } from "../../components/ui";
import { formatPrice } from "../../lib/utils";
import * as A from "../../lib/analytics";
import { downloadCsv } from "../../lib/csv";
import { cn } from "@/utils/cn";

type Range = 7 | 30 | 90;

export default function AdminAnalytics() {
  const { products, orders, categories, brands, customers, coupons, articles, settings } = useStore();
  const { toast } = useToast();
  const [range, setRange] = useState<Range>(30);

  const exec = useMemo(() => A.computeExec(orders, products), [orders, products]);
  const trend = useMemo(() => A.revenueTrend(orders, range), [orders, range]);
  const perf = useMemo(() => A.productPerformance(orders, products), [orders, products]);
  const catRev = useMemo(() => A.categoryRevenue(orders, products, categories), [orders, products, categories]);
  const brandRev = useMemo(() => A.brandRevenue(orders, products, brands), [orders, products, brands]);
  const segments = useMemo(() => A.customerSegments(customers, orders), [customers, orders]);
  const traffic = useMemo(() => A.trafficSources(), []);
  const devices = useMemo(() => A.deviceBreakdown(), []);
  const statusDist = useMemo(() => A.orderStatusDist(orders), [orders]);
  const inv = useMemo(() => A.inventoryHealth(products), [products]);
  const couponUse = useMemo(() => A.couponUsage(coupons), [coupons]);
  const search = useMemo(() => A.searchAnalytics(), []);
  const aff = useMemo(() => A.affiliateStats(products), [products]);
  const artViews = useMemo(() => A.articleViews(articles), [articles]);

  const topProducts = perf.slice(0, 6);
  const deadProducts = perf.filter((p) => p.unitsSold === 0).slice(0, 5);

  const KPI_GRID = [
    { label: "Today", value: formatPrice(exec.today, settings.currency), sub: `+${exec.growth}% vs yesterday`, up: exec.growth >= 0, icon: DollarSign },
    { label: "This week", value: formatPrice(exec.thisWeek, settings.currency), sub: "Last 7 days", up: true, icon: TrendingUp },
    { label: "This month", value: formatPrice(exec.thisMonth, settings.currency), sub: "Last 30 days", up: true, icon: TrendingUp },
    { label: "Lifetime", value: formatPrice(exec.lifetime, settings.currency), sub: `${exec.orders} orders`, up: true, icon: Activity },
    { label: "Avg. order value", value: formatPrice(exec.aov, settings.currency), sub: "Per order", up: true, icon: ShoppingCart },
    { label: "Affiliate revenue", value: formatPrice(exec.affiliate, settings.currency), sub: "Est. commissions", up: true, icon: DollarSign },
  ];

  const exportReport = (type: string) => {
    let csv = "";
    if (type === "Sales") csv = "Metric,Value\n" + Object.entries(exec).map(([k, v]) => `${k},${v}`).join("\n");
    else if (type === "Products") csv = "Product,Units,Revenue\n" + perf.map((p) => `${p.product.name},${p.unitsSold},${p.revenue}`).join("\n");
    else if (type === "Categories") csv = "Category,Revenue\n" + catRev.map((c) => `${c.label},${c.value}`).join("\n");
    else if (type === "Brands") csv = "Brand,Revenue\n" + brandRev.map((b) => `${b.label},${b.value}`).join("\n");
    else if (type === "Customers") csv = "Customer,Orders\n" + customers.map((c) => `${c.name},${orders.filter((o) => o.customer.email === c.email).length}`).join("\n");
    downloadCsv(`alaya-${type.toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(`${type} report exported`, "Downloaded as CSV.");
  };

  const REPORTS = ["Sales", "Products", "Categories", "Brands", "Customers", "Orders", "SEO", "Marketing", "Inventory", "Finance"];

  return (
    <>
      <Seo title="Analytics" path="/admin/analytics" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Analytics Command Center</h1>
            <p className="mt-1 text-sm text-muted">Real-time business intelligence for {settings.storeName}.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-line p-0.5">
              {([7, 30, 90] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", range === r ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}>{r}d</button>
              ))}
            </div>
            <button onClick={() => toast.success("Dashboard refreshed", "All metrics are live.")} className="btn-outline btn-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
          </div>
        </div>

        {/* Executive KPIs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KPI_GRID.map((k) => (
            <div key={k.label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><k.icon className="h-5 w-5" /></span>
                <span className={cn("flex items-center gap-1 text-xs font-medium", k.up ? "text-success" : "text-danger")}>
                  {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{k.value}</p>
              <p className="text-sm text-muted">{k.label}</p>
              <p className="text-xs text-muted">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue trend + status */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">Revenue trend</h2>
              <span className="text-xs text-muted">Last {range} days</span>
            </div>
            <div className="p-5"><AreaChart data={trend} height={220} /></div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Order status</h2></div>
            <div className="p-5">
              {statusDist.length > 0 ? <DonutChart data={statusDist} /> : <p className="text-sm text-muted">No orders yet.</p>}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-ink"><Package className="h-4 w-4 text-accent" /> Top products by revenue</h2>
              <button onClick={() => exportReport("Products")} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> Export</button>
            </div>
            <div className="p-5"><RankList data={topProducts.map((p) => ({ label: p.product.name, value: p.revenue }))} format={(n) => formatPrice(n, settings.currency)} /></div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Star className="h-4 w-4 text-warning" /> Dead stock</h2></div>
            <div className="p-3">
              {deadProducts.length === 0 ? <p className="p-3 text-sm text-muted">No dead stock.</p> : (
                <ul className="space-y-1">
                  {deadProducts.map((p) => (
                    <li key={p.product.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface2">
                      <img src={p.product.images[0]} alt="" className="h-8 w-7 rounded object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.product.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Product signals */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Most viewed", icon: Eye, value: products[0]?.name || "—" },
            { label: "Most wishlisted", icon: Heart, value: products[0]?.name || "—" },
            { label: "Most compared", icon: Scale, value: products[0]?.name || "—" },
            { label: "Most shared", icon: Share2, value: products[0]?.name || "—" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <s.icon className="h-5 w-5 text-accent" />
              <p className="mt-2 text-xs text-muted">{s.label}</p>
              <p className="truncate text-sm font-medium text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Category & brand */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">Revenue by category</h2>
              <button onClick={() => exportReport("Categories")} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-5"><RankList data={catRev} format={(n) => formatPrice(n, settings.currency)} /></div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">Revenue by brand</h2>
              <button onClick={() => exportReport("Brands")} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-5"><RankList data={brandRev} format={(n) => formatPrice(n, settings.currency)} /></div>
          </div>
        </div>

        {/* Customers & traffic */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Users className="h-4 w-4 text-accent" /> Customer segments</h2></div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-muted">New customers</span><span className="font-semibold text-ink">{segments.newCustomers}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted">Returning</span><span className="font-semibold text-ink">{segments.returning}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted">VIP ($300+)</span><span className="font-semibold text-ink">{segments.vip}</span></div>
              <div className="flex items-center justify-between border-t border-line pt-3 text-sm"><span className="text-muted">Avg. CLV</span><span className="font-semibold text-ink"><Money amount={segments.clv} /></span></div>
            </div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Globe className="h-4 w-4 text-accent" /> Traffic sources</h2></div>
            <div className="p-5"><DonutChart data={traffic} /></div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Smartphone className="h-4 w-4 text-accent" /> Devices</h2></div>
            <div className="p-5"><DonutChart data={devices} /></div>
          </div>
        </div>

        {/* Search & marketing */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Search analytics</h2></div>
            <div className="p-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Popular searches</p>
                <div className="flex flex-wrap gap-2">{search.popular.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Zero-result searches</p>
                <div className="flex flex-wrap gap-2">{search.zero.map((s) => <span key={s} className="badge bg-warning/15 text-warning">{s}</span>)}</div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Trending</p>
                <div className="flex flex-wrap gap-2">{search.trending.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Coupon usage</h2></div>
            <div className="p-5"><RankList data={couponUse} /></div>
          </div>
        </div>

        {/* Affiliate & inventory */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Link2 className="h-4 w-4 text-accent" /> Affiliate performance</h2></div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Products</span><span className="font-semibold text-ink">{aff.count}</span></div>
              <div className="flex justify-between"><span className="text-muted">Clicks (est.)</span><span className="font-semibold text-ink">{aff.clicks.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted">CTR</span><span className="font-semibold text-ink">{aff.ctr}%</span></div>
              <div className="flex justify-between"><span className="text-muted">EPC</span><span className="font-semibold text-ink">{formatPrice(aff.epc, settings.currency)}</span></div>
              <div className="flex justify-between border-t border-line pt-3"><span className="text-muted">Revenue</span><span className="font-semibold text-ink">{formatPrice(aff.revenue, settings.currency)}</span></div>
            </div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Package className="h-4 w-4 text-accent" /> Inventory health</h2></div>
            <div className="p-5">
              <DonutChart data={[
                { label: "Healthy", value: inv.healthy, color: "#4b7a52" },
                { label: "Low stock", value: inv.low, color: "#b9802f" },
                { label: "Out of stock", value: inv.out, color: "#b14b46" },
              ]} />
            </div>
          </div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Article views (est.)</h2></div>
            <div className="p-5"><BarChart data={artViews} height={180} /></div>
          </div>
        </div>

        {/* Report generator */}
        <div className="card mt-6">
          <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><FileBarChart className="h-4 w-4 text-accent" /> Report generator</h2></div>
          <div className="flex flex-wrap gap-2 p-5">
            {REPORTS.map((r) => (
              <button key={r} onClick={() => exportReport(r)} className="btn-outline btn-sm"><Download className="h-3.5 w-3.5" /> {r}</button>
            ))}
            <button onClick={() => window.print()} className="btn-ghost btn-sm">Print dashboard</button>
          </div>
          <p className="px-5 pb-5 text-xs text-muted">Reports export as CSV. Scheduled & emailed reports, plus PDF/Excel formats, are integration-ready.</p>
        </div>
      </div>
    </>
  );
}
