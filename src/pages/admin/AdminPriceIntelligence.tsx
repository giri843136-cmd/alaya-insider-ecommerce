/**
 * ALAYA INSIDER — Price Intelligence Admin (PART 3.5)
 * ------------------------------------------------------------------
 * Price monitoring dashboard, history tracking, comparison tables,
 * price alerts management, and deal detection.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown, TrendingUp, BarChart3, Bell, BellOff,
  Search, X, Plus, Trash2, ArrowRight,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState, Price } from "../../components/ui";
import { cn } from "@/utils/cn";
import { useStore } from "../../context/StoreContext";
import type { Product } from "../../lib/types";
import {
  getPriceHistory, getPriceAlerts, addPriceAlert, deletePriceAlert,
  getActiveMarketplaces,
} from "../../lib/affiliateCommerce";

export default function AdminPriceIntelligence() {
  const { products } = useStore();
  const marketplaces = useMemo(() => getActiveMarketplaces(), []);
  const priceHistory = useMemo(() => getPriceHistory(), []);
  const priceAlerts = useMemo(() => getPriceAlerts(), []);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "alerts">("overview");
  const [newAlert, setNewAlert] = useState<{ productId: string; threshold: number } | null>(null);

  const affiliateProducts = useMemo(() => products.filter((p: Product) => p.affiliate), [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return affiliateProducts.slice(0, 10);
    const q = search.toLowerCase();
    return affiliateProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.affiliatePartner || "").toLowerCase().includes(q));
  }, [affiliateProducts, search]);

  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  return (
    <>
      <Seo title="Price Intelligence" path="/admin/price-intelligence" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Price Intelligence</h1>
            <p className="mt-1 text-sm text-muted">Monitor price history, set alerts, and compare offers across marketplaces.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Tracked products</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{priceHistory.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Active alerts</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{priceAlerts.filter((a) => a.active && !a.triggered).length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Affiliate products</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{affiliateProducts.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Active marketplaces</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{marketplaces.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["overview", "alerts"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
              {t === "overview" ? <BarChart3 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {t}
            </button>
          ))}
          {/* Search */}
          <div className="relative ml-auto max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="input-field w-full pl-9 text-sm" />
          </div>
        </div>

        {tab === "overview" && (
          <>
            {filteredProducts.length === 0 ? (
              <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No products found" description={search ? "Try a different search." : "Add affiliate products to track prices."} />
            ) : (
              <div className="mt-6 space-y-2">
                {filteredProducts.map((p) => {
                  const ph = priceHistory.find((h: { productId: string }) => h.productId === p.id);
                  return (
                    <Link key={p.id} to={`/product/${p.slug}`} className="card flex items-center gap-3 p-3 transition-colors hover:border-accent">
                      <img src={p.images[0]} alt={p.name} className="h-14 w-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-ink">{p.name}</p>
                          {p.affiliatePartner && <Badge variant="affiliate">{p.affiliatePartner}</Badge>}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                          <span className="font-semibold text-ink"><Price price={p.salePrice ?? p.price} /></span>
                          {ph && (
                            <>
                              <span className={cn("inline-flex items-center gap-0.5", ph.priceChangePercent < 0 ? "text-success" : "text-danger")}>
                                {ph.priceChangePercent < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                {Math.abs(ph.priceChangePercent)}%
                              </span>
                              <span>Low: <Price price={ph.lowestPrice} /></span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "alerts" && (
          <>
            <div className="mt-6 space-y-2">
              {priceAlerts.length === 0 ? (
                <EmptyState icon={<Bell className="h-6 w-6" />} title="No price alerts set" description="Set price drop alerts for products you're watching." action={
                  <button onClick={() => setNewAlert({ productId: "", threshold: 0 })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add alert</button>
                } />
              ) : (
                <>
                  <button onClick={() => setNewAlert({ productId: "", threshold: 0 })} className="btn-primary btn-sm mb-4"><Plus className="h-4 w-4" /> Add alert</button>
                  {priceAlerts.map((alert) => {
                    return (
                      <div key={alert.id} className="card flex items-center justify-between p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {alert.triggered ? <BellOff className="h-5 w-5 shrink-0 text-muted" /> : <Bell className="h-5 w-5 shrink-0 text-accent" />}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{alert.productName}</p>
                            <p className="text-xs text-muted">
                              {alert.type === "price_drop" ? `Notify when below $${alert.threshold}` : `Notify when above $${alert.threshold}`}
                              {!alert.active && <span className="ml-2 text-danger">Inactive</span>}
                              {alert.triggered && <span className="ml-2 text-warning">Triggered</span>}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => { deletePriceAlert(alert.id); refresh(); }} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {newAlert && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setNewAlert(null)} />
          <div className="card relative z-10 w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">New price alert</h2>
              <button onClick={() => setNewAlert(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label-field">Product</label>
                <select className="input-field" value={newAlert.productId} onChange={(e) => setNewAlert({ ...newAlert, productId: e.target.value })}>
                  <option value="">Select a product</option>
                  {affiliateProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="label-field">Price threshold ($)</label>
                <input type="number" className="input-field" value={newAlert.threshold || ""} onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })} placeholder="50" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setNewAlert(null)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={() => {
                if (!newAlert.productId || !newAlert.threshold) return;
                const product = products.find((p) => p.id === newAlert.productId);
                addPriceAlert({
                  productId: newAlert.productId, productName: product?.name || "Unknown",
                  type: "price_drop", threshold: newAlert.threshold, active: true, emailNotify: true,
                });
                setNewAlert(null);
                refresh();
              }} className="btn-primary btn-md">Set alert</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
