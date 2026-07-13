import { Link } from "react-router-dom";
import {
  Receipt,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Star,
  TrendingUp,
  Plus,
  Users,
  Gem,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { formatDateTime, formatPrice } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { STATUS_STYLES } from "../../lib/orderStatus";

export default function Dashboard() {
  const { products, orders, categories, customers, returns, affiliates, settings, productsByCategory, productsByBrand } = useStore();

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const openOrders = orders.filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "pending" || o.status === "processing" || o.status === "packed").length;
  const affiliateProducts = products.filter((p) => p.affiliate);
  const affiliateRevenue = affiliateProducts.reduce((s, p) => {
    const partner = affiliates.find((a) => a.name === p.affiliatePartner);
    return s + (partner ? (p.price * partner.commission) / 100 : 0);
  }, 0);
  const openReturns = returns.filter((r) => r.status === "requested").length;
  const lowStock = products.filter((p) => p.stock <= 8 && p.type !== "digital" && !p.affiliate);
  const avgRating = products.length ? products.reduce((s, p) => s + p.rating, 0) / products.length : 0;

  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const topCats = categories
    .map((c) => ({ ...c, count: productsByCategory(c.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const topBrands = [...new Set(products.map((p) => p.brandId).filter(Boolean))]
    .map((id) => ({ id: id as string, count: productsByBrand(id as string).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const STATS = [
    { label: "Total revenue", value: formatPrice(revenue, settings.currency), icon: DollarSign, sub: `${orders.length} orders · ${formatPrice(aov, settings.currency)} AOV` },
    { label: "Open orders", value: String(openOrders), icon: Receipt, sub: `${openReturns} returns pending` },
    { label: "Affiliate revenue", value: formatPrice(affiliateRevenue, settings.currency), icon: DollarSign, sub: `${affiliateProducts.length} affiliate SKUs` },
    { label: "Customers", value: String(customers.length), icon: Users, sub: `${products.length} products` },
    { label: "Avg. rating", value: `${avgRating.toFixed(2)}★`, icon: Star, sub: "Across catalogue" },
    { label: "Conversion rate", value: `${(orders.length / Math.max(1, customers.length) * 100).toFixed(1)}%`, icon: TrendingUp, sub: "Orders / customers" },
  ];

  return (
    <>
      <Seo title="Dashboard" path="/admin" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Welcome back. Here's how {settings.storeName} is performing.</p>
          </div>
          <Link to="/admin/products" className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add product</Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className="card card-hover p-5 animate-fade-in-up" style={{ animationDuration: "0.4s", animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110"><s.icon className="h-5 w-5" /></span>
                <TrendingUp className="h-4 w-4 text-success opacity-60" />
              </div>
              <p className="mt-4 font-display text-3xl font-semibold text-ink tabular-nums">{s.value}</p>
              <p className="text-sm font-medium text-muted">{s.label}</p>
              <p className="mt-1 text-xs text-muted/70">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Recent orders */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">Recent orders</h2>
              <Link to="/admin/orders" className="link-line text-sm text-accent">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No orders yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {recent.map((o) => (
                  <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface2/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{o.customer.name}</p>
                      <p className="text-xs text-muted">{o.number} · {formatDateTime(o.createdAt)}</p>
                    </div>
                    <span className={cn("badge", STATUS_STYLES[o.status])}>{o.status}</span>
                    <span className="text-sm font-semibold text-ink tabular-nums"><Money amount={o.total} /></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side column */}
          <div className="space-y-6">
            <div className="card">
              <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Top categories</h2></div>
              <div className="space-y-1 p-3">
                {topCats.map((c) => (
                  <Link key={c.id} to={`/admin/products`} className="flex items-center justify-between rounded-lg px-2 py-2 transition-all duration-200 hover:bg-surface2 hover:translate-x-0.5">
                    <span className="text-sm text-ink">{c.name}</span>
                    <span className="text-sm font-medium text-muted tabular-nums">{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="border-b border-line px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-ink"><Gem className="h-4 w-4 text-accent" /> Top brands</h2></div>
              <div className="space-y-1 p-3">
                {topBrands.map((b) => (
                  <Link key={b.id} to={`/brands/${b.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 transition-all duration-200 hover:bg-surface2 hover:translate-x-0.5">
                    <span className="text-sm capitalize text-ink">{b.id.replace(/-/g, " ")}</span>
                    <span className="text-sm font-medium text-muted tabular-nums">{b.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock</h2>
              </div>
              {lowStock.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-muted">All stocked up 🎉</p>
              ) : (
                <div className="divide-y divide-line">
                  {lowStock.slice(0, 5).map((p) => (
                    <Link key={p.id} to="/admin/products" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface2">
                      <img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                      <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">{p.stock} left</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className="btn-outline btn-sm"><ArrowUpRight className="h-4 w-4" /> View storefront</Link>
          <Link to="/admin/settings" className="btn-ghost btn-sm">Store settings</Link>
        </div>
      </div>
    </>
  );
}
