import { useMemo, useState } from "react";
import {
  LayoutDashboard, Package, PackageSearch, DollarSign, Percent,
  Handshake, Globe, Link, Search, BarChart3, Bot,
  Boxes, TrendingUp, Star, AlertTriangle, Truck,
  Zap, Store,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getProductFamilies,
  getProductBundles,
  getBuyingGuides,
  getProductRelationships,
  syncInventoryFromProducts, checkLowStock, getWarehouses,
  getPricingRules, applyPricingRules,
  getCommissionRules, getCommissionEntries, getRevenueShares,
  getMarketplaceMappings, syncMarketplace,
  getAffiliateLinks, validateAffiliateLinks,
  getFacetConfigs,
  getCommerceReports, generateCommerceReport,
  getRevenueForecasts,
  getAiProductOptimizations, generateAiProductOptimization,
  getAiPricingRecommendations, generateAiPricingRecommendation,
  getAiInventoryAdvice, generateAiInventoryAdvice,
  getCommercePlatformDashboard, getCommercePlatformStats,
  getTrendingProducts, getEditorialPicks,
} from "../../lib/commercePlatform";

type CpTab = "dashboard" | "catalog" | "inventory" | "pricing" | "discounts" | "commissions" | "marketplace" | "affiliate-links" | "discovery" | "reports" | "ai";

export default function AdminCommercePlatform() {
  const { products, orders } = useStore();
  const [tab, setTab] = useState<CpTab>("dashboard");

  const dash = useMemo(() => getCommercePlatformDashboard(products, orders), [products, orders]);
  const stats = useMemo(() => getCommercePlatformStats(), []);

  const TABS: { id: CpTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "catalog", label: "Catalog", icon: Package },
    { id: "inventory", label: "Inventory", icon: PackageSearch },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "discounts", label: "Discounts", icon: Percent },
    { id: "commissions", label: "Commissions", icon: Handshake },
    { id: "marketplace", label: "Marketplace", icon: Globe },
    { id: "affiliate-links", label: "Affiliate Links", icon: Link },
    { id: "discovery", label: "Discovery", icon: Search },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "ai", label: "AI Assistant", icon: Bot },
  ];

  const STATS = [
    { label: "Products", value: String(dash.totalProducts), sub: `${dash.lowStockItems} low stock · ${dash.outOfStockItems} OOS`, icon: Package, color: "text-accent bg-accent-soft" },
    { label: "Active Bundles", value: String(dash.activeBundles), sub: `${dash.activePricingRules} pricing rules`, icon: Boxes, color: "text-success bg-success/15" },
    { label: "Inventory Alerts", value: String(dash.inventoryAlerts), sub: `${dash.productsWithRelationships} products with relationships`, icon: AlertTriangle, color: dash.inventoryAlerts > 0 ? "text-danger bg-danger/15" : "text-success bg-success/15" },
    { label: "Pending Commissions", value: String(dash.pendingCommissions), sub: `$${Math.round(dash.totalCommissionsPaid)} paid`, icon: Handshake, color: "text-warning bg-warning/15" },
    { label: "Marketplace", value: String(dash.activeMarketplaceMappings), sub: `${dash.affiliateLinkClicks} link clicks`, icon: Globe, color: "text-info bg-info/15" },
    { label: "Buying Guides", value: String(dash.buyingGuidesCount), sub: `${stats.totalAiOptimizations} AI optimizations`, icon: Star, color: "text-accent bg-accent-soft" },
  ];

  return (
    <>
      <Seo title="Commerce Platform" path="/admin/commerce-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Commerce Platform</h1>
            <p className="mt-1 text-sm text-muted">Catalog · Inventory · Pricing · Commissions · Marketplace · AI</p>
          </div>
          <div className="flex flex-wrap gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize whitespace-nowrap", tab === id && "chip-active")}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {STATS.map((s) => (
                <div key={s.label} className="card p-4">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full", s.color)}><s.icon className="h-4.5 w-4.5" /></span>
                  <p className="mt-3 font-display text-xl font-semibold text-ink">{s.value}</p>
                  <p className="text-xs text-muted">{s.label}</p>
                  <p className="text-[0.6rem] text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><TrendingUp className="h-4 w-4 text-accent" /> Revenue Forecasts</h3>
                <div className="mt-4 space-y-3">
                  {getRevenueForecasts().map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-line p-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{f.period}</p>
                        <p className="text-xs text-muted">${f.predictedRevenue.toLocaleString()} predicted</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-accent">{Math.round(f.confidence * 100)}% confidence</p>
                        <p className="text-muted">${f.lowerBound.toLocaleString()} - ${f.upperBound.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Bot className="h-4 w-4 text-accent" /> AI Inventory Advice</h3>
                <div className="mt-4 space-y-2">
                  {getAiInventoryAdvice().slice(0, 4).map((a) => (
                    <div key={a.productId} className="rounded-lg border border-line p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{a.productName}</p>
                        <span className={cn("badge", a.urgency === "critical" ? "bg-danger/15 text-danger" : a.urgency === "high" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>{a.urgency}</span>
                      </div>
                      <p className="mt-1 text-[0.6rem] text-muted">{a.suggestedAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Star className="h-4 w-4 text-accent" /> Editorial Picks</h3>
                <div className="mt-4 space-y-2">
                  {getEditorialPicks(products).length === 0 ? (
                    <p className="text-xs text-muted">No featured products.</p>
                  ) : (
                    getEditorialPicks(products).slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-xs">
                        <span className="text-ink truncate flex-1">{p.name}</span>
                        <span className="font-medium text-ink">${p.salePrice ?? p.price}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Boxes className="h-4 w-4 text-accent" /> Product Families</h3>
                <div className="mt-4 space-y-2">
                  {getProductFamilies().length === 0 ? (
                    <p className="text-xs text-muted">No families defined.</p>
                  ) : (
                    getProductFamilies().slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-xs">
                        <span className="text-ink font-medium">{f.name}</span>
                        <span className="text-muted capitalize">{f.type}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Truck className="h-4 w-4 text-accent" /> Warehouses</h3>
                <div className="mt-4 space-y-2">
                  {getWarehouses().map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="text-ink font-medium truncate">{w.name}</p>
                        <p className="text-muted">{w.city}, {w.country}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-medium", w.utilization > 80 ? "text-danger" : w.utilization > 60 ? "text-warning" : "text-success")}>{w.utilization}%</p>
                        <p className="text-muted">utilized</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* CATALOG */}
        {tab === "catalog" && <CatalogTab />}

        {/* INVENTORY */}
        {tab === "inventory" && <InventoryTab products={products} />}

        {/* PRICING */}
        {tab === "pricing" && <PricingTab products={products} />}

        {/* DISCOUNTS */}
        {tab === "discounts" && <DiscountsTab />}

        {/* COMMISSIONS */}
        {tab === "commissions" && <CommissionsTab />}

        {/* MARKETPLACE */}
        {tab === "marketplace" && <MarketplaceTab />}

        {/* AFFILIATE LINKS */}
        {tab === "affiliate-links" && <AffiliateLinksTab />}

        {/* DISCOVERY */}
        {tab === "discovery" && <DiscoveryTab products={products} />}

        {/* REPORTS */}
        {tab === "reports" && <ReportsTab products={products} orders={orders} />}

        {/* AI */}
        {tab === "ai" && <AiTab products={products} />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  CATALOG TAB                                                         */
/* ================================================================== */
function CatalogTab() {
  const families = useMemo(() => getProductFamilies(), []);
  const bundles = useMemo(() => getProductBundles(), []);
  const guides = useMemo(() => getBuyingGuides(), []);
  const relationships = useMemo(() => getProductRelationships(), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Product Families ({families.length})</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((f) => (
            <div key={f.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{f.name}</p>
                <span className="badge bg-accent-soft text-accent capitalize">{f.type}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{f.description}</p>
              <p className="mt-1 text-[0.55rem] text-muted">Sort: {f.sortOrder} · {f.children.length} products</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Product Bundles ({bundles.length})</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {bundles.map((b) => (
            <div key={b.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{b.name}</p>
                <span className="badge bg-success/15 text-success">{b.totalSavingsPercent}% off</span>
              </div>
              <p className="mt-1 text-xs text-muted">{b.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {b.products.map((pb, i) => (
                  <span key={i} className="badge bg-surface2 text-[0.55rem] text-muted">{pb.productId} ×{pb.quantity}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Buying Guides ({guides.length})</h3>
        {guides.length === 0 ? (
          <p className="text-xs text-muted">No buying guides yet.</p>
        ) : (
          <div className="space-y-2">
            {guides.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{g.title}</p>
                  <p className="text-xs text-muted">{g.category} · {g.products.length} products</p>
                </div>
                <span className={cn("badge", g.featured ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{g.featured ? "Featured" : "Draft"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Product Relationships ({relationships.length})</h3>
        {relationships.length === 0 ? (
          <p className="text-xs text-muted">No relationships defined. Products with relationships will appear in cross-sell, upsell, and FBT modules.</p>
        ) : (
          <div className="space-y-2">
            {relationships.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-line p-2 text-xs">
                <span className="badge bg-info/15 text-info shrink-0">{r.type.replace(/_/g, " ")}</span>
                <span className="text-ink">{r.sourceProductId}</span>
                <span className="text-muted">→</span>
                <span className="text-ink">{r.targetProductId}</span>
                <span className="text-muted ml-auto">{r.weight}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  INVENTORY TAB                                                       */
/* ================================================================== */
function InventoryTab({ products }: { products: any[] }) {
  const [alerts, setAlerts] = useState(() => checkLowStock(products));
  const warehouses = useMemo(() => getWarehouses(), []);

  return (
    <div className="mt-6 space-y-6">
      <button onClick={() => { syncInventoryFromProducts(products); setAlerts(checkLowStock(products)); }} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> Sync Inventory</button>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{products.filter((p) => p.type !== "digital" && !p.affiliate).length}</p>
          <p className="text-xs text-muted">Physical Products</p>
        </div>
        <div className="card p-4 text-center">
          <p className={cn("text-2xl font-semibold", alerts.filter((a) => a.severity === "out").length > 0 ? "text-danger" : "text-ink")}>{alerts.length}</p>
          <p className="text-xs text-muted">Low Stock Alerts</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{warehouses.length}</p>
          <p className="text-xs text-muted">Warehouses</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{warehouses.reduce((s, w) => s + Math.round(w.utilization / warehouses.length), 0)}%</p>
          <p className="text-xs text-muted">Avg Utilization</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card p-4">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-warning" /> Inventory Alerts</h3>
          <div className="mt-3 space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-line p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{a.productName}</p>
                  <p className="text-[0.55rem] text-muted">Reorder at {a.reorderPoint} units</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("badge", a.severity === "out" ? "bg-danger/15 text-danger" : a.severity === "critical" ? "bg-warning/15 text-warning" : "bg-info/15 text-info")}>{a.severity}</span>
                  <span className="text-sm font-semibold text-ink">{a.currentStock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Warehouses</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <div key={w.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{w.name}</p>
                <span className="text-xs text-muted">{w.code}</span>
              </div>
              <p className="text-xs text-muted">{w.city}, {w.country}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Capacity</span>
                  <span className="font-medium text-ink">{w.utilization}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full", w.utilization > 80 ? "bg-danger" : w.utilization > 60 ? "bg-warning" : "bg-success")} style={{ width: `${w.utilization}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PRICING TAB                                                         */
/* ================================================================== */
function PricingTab({ products }: { products: any[] }) {
  const rules = useMemo(() => getPricingRules(), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Pricing Rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <p className="text-xs text-muted">No pricing rules defined.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{r.name}</p>
                  <p className="text-xs text-muted">{r.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="badge bg-accent-soft text-accent text-[0.55rem] capitalize">{r.type.replace(/_/g, " ")}</span>
                    <span className="badge bg-surface2 text-[0.55rem] text-muted">{r.value}%</span>
                    <span className="badge bg-info/15 text-info text-[0.55rem]">Priority {r.priority}</span>
                  </div>
                </div>
                <span className={cn("badge shrink-0", r.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{r.active ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Quick Price Test</h3>
        <p className="text-xs text-muted mb-3">Select a product to see pricing rules applied</p>
        <select className="input-field w-full max-w-xs" onChange={(e) => {
          const p = products.find((pr) => pr.id === e.target.value);
          if (p) {
            const result = applyPricingRules(p);
            alert(`${p.name}\nBase: $${p.price}\nFinal: $${result.finalPrice}\nRules: ${result.rulesApplied.join(", ") || "None"}`);
          }
        }}>
          <option value="">Choose a product...</option>
          {products.slice(0, 10).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DISCOUNTS TAB                                                       */
/* ================================================================== */
function DiscountsTab() {
  const bundles = useMemo(() => getProductBundles().filter((b) => b.active), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{bundles.length}</p>
          <p className="text-xs text-muted">Active Bundles</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{bundles.reduce((s, b) => s + b.totalSavingsPercent, 0) / Math.max(1, bundles.length)}%</p>
          <p className="text-xs text-muted">Avg Savings</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Active Bundle Deals</h3>
        {bundles.length === 0 ? (
          <p className="text-xs text-muted">No active bundle deals.</p>
        ) : (
          <div className="space-y-3">
            {bundles.map((b) => (
              <div key={b.id} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{b.name}</p>
                    <p className="text-xs text-muted">{b.description}</p>
                  </div>
                  <span className="badge bg-success/15 text-success text-sm">{b.totalSavingsPercent}% OFF</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.products.map((pb, i) => (
                    <span key={i} className="chip text-[0.55rem]">{pb.productId} ({pb.quantity}x)</span>
                  ))}
                </div>
                <p className="mt-2 text-xs font-medium text-ink">Total: ${b.totalPrice} {b.maxPerCustomer ? `· Max ${b.maxPerCustomer} per customer` : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMMISSIONS TAB                                                     */
/* ================================================================== */
function CommissionsTab() {
  const rules = useMemo(() => getCommissionRules(), []);
  const entries = useMemo(() => getCommissionEntries(), []);
  const revenueShares = useMemo(() => getRevenueShares(), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{rules.length}</p>
          <p className="text-xs text-muted">Commission Rules</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{entries.length}</p>
          <p className="text-xs text-muted">Commission Entries</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">${Math.round(entries.filter((e) => e.status === "paid").reduce((s, e) => s + e.commissionAmount, 0) * 100) / 100}</p>
          <p className="text-xs text-muted">Total Paid</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{revenueShares.length}</p>
          <p className="text-xs text-muted">Revenue Shares</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Commission Rules</h3>
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-line p-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{r.name}</p>
                  <span className="badge bg-accent-soft text-accent text-[0.55rem] capitalize">{r.type}</span>
                </div>
                <p className="text-xs text-muted">Tier {r.tier} · {r.rate}% rate{r.minSales ? ` · min $${r.minSales} sales` : ""}</p>
              </div>
              <span className={cn("badge", r.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{r.active ? "Active" : "Inactive"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Recent Commission Entries</h3>
        {entries.length === 0 ? (
          <p className="text-xs text-muted">No commission entries yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-line p-2.5 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{e.partnerName} · {e.productName}</p>
                  <p className="text-muted">{e.orderNumber} · ${e.saleAmount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">${e.commissionAmount}</span>
                  <span className={cn("badge", e.status === "paid" ? "bg-success/15 text-success" : e.status === "pending" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MARKETPLACE TAB                                                     */
/* ================================================================== */
function MarketplaceTab() {
  const mappings = useMemo(() => getMarketplaceMappings(), []);
  const [status, setStatus] = useState("");

  const handleSync = (network: string) => {
    const result = syncMarketplace(network as any);
    setStatus(`Synced ${network}: ${result.itemsSucceeded} succeeded, ${result.itemsFailed} failed`);
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="mt-6 space-y-6">
      {status && (
        <div className="rounded-xl bg-info/15 px-4 py-3 text-sm text-info">{status}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(["amazon", "impact", "cj"] as const).map((network) => (
          <div key={network} className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink capitalize">{network}</h3>
              <button onClick={() => handleSync(network)} className="btn-ghost btn-sm"><Zap className="h-3.5 w-3.5" /> Sync</button>
            </div>
            <p className="mt-2 text-xs text-muted">{mappings.filter((m) => m.network === network).length} products mapped</p>
            <div className="mt-2 space-y-1">
              {mappings.filter((m) => m.network === network).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-[0.55rem]">
                  <span className="text-ink truncate flex-1">{m.productName}</span>
                  <span className={cn("badge", m.status === "active" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">All Marketplace Mappings ({mappings.length})</h3>
        {mappings.length === 0 ? (
          <p className="text-xs text-muted">No marketplace mappings.</p>
        ) : (
          <div className="space-y-2">
            {mappings.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-line p-2.5 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{m.productName}</span>
                    <span className="badge bg-accent-soft text-accent text-[0.5rem] capitalize">{m.network}</span>
                  </div>
                  <p className="text-muted">{m.marketplaceId} · {m.commissionRate}% commission</p>
                </div>
                <span className={cn("badge shrink-0", m.status === "active" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AFFILIATE LINKS TAB                                                 */
/* ================================================================== */
function AffiliateLinksTab() {
  const links = useMemo(() => getAffiliateLinks(), []);
  const [validationResult, setValidationResult] = useState("");

  const handleValidate = () => {
    const result = validateAffiliateLinks();
    setValidationResult(`${result.valid} valid · ${result.broken} broken · ${result.invalid} invalid`);
    setTimeout(() => setValidationResult(""), 5000);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{links.length} affiliate links</p>
        <button onClick={handleValidate} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> Validate All</button>
      </div>

      {validationResult && (
        <div className="rounded-xl bg-info/15 px-4 py-3 text-sm text-info">{validationResult}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {links.map((l) => (
          <div key={l.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">{l.partnerName}</p>
              <span className={cn("badge", l.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{l.active ? "Active" : "Inactive"}</span>
            </div>
            <p className="mt-1 text-xs text-muted truncate">{l.deepLink}</p>
            <p className="text-[0.55rem] text-muted">Tracking: {l.trackingId}</p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <div className="text-center"><p className="font-semibold text-ink">{l.clicks}</p><p className="text-muted">Clicks</p></div>
              <div className="text-center"><p className="font-semibold text-ink">{l.conversions}</p><p className="text-muted">Conv</p></div>
              <div className="text-center"><p className="font-semibold text-success">${Math.round(l.revenue)}</p><p className="text-muted">Revenue</p></div>
              <div className="text-center"><span className={cn("badge", l.valid ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{l.valid ? "Valid" : "Invalid"}</span></div>
            </div>
            {l.geoRules.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 text-[0.55rem]">
                {l.geoRules.map((g, i) => (
                  <span key={i} className="badge bg-info/15 text-info">{g.country}</span>
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
/*  DISCOVERY TAB                                                       */
/* ================================================================== */
function DiscoveryTab({ products }: { products: any[] }) {
  const facets = useMemo(() => getFacetConfigs(), []);
  const trending = useMemo(() => getTrendingProducts(products), [products]);

  return (
    <div className="mt-6 space-y-6">
      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Faceted Search Configuration</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {facets.map((f) => (
            <div key={f.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{f.label}</p>
                <span className="badge bg-accent-soft text-accent text-[0.55rem] capitalize">{f.type}</span>
              </div>
              <p className="text-xs text-muted">Field: {f.field} · {f.options.length} options</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {f.options.slice(0, 4).map((o) => (
                  <span key={o.value} className="badge bg-surface2 text-[0.5rem] text-muted">{o.label}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Trending Products</h3>
        <div className="space-y-2">
          {trending.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-line p-2.5 text-xs">
              <span className="text-ink font-medium flex-1 truncate">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted">★ {p.rating}</span>
                <span className="font-medium text-ink">${p.salePrice ?? p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Visual & Barcode Search</h3>
        <p className="text-xs text-muted">Search by image, voice, barcode, or QR code is configured and ready for production integration with AI/ML services.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip"><Search className="h-3 w-3" /> Visual Search</span>
          <span className="chip"><Store className="h-3 w-3" /> Voice Search</span>
          <span className="chip"><Package className="h-3 w-3" /> Barcode Search</span>
          <span className="chip"><Zap className="h-3 w-3" /> QR Search</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  REPORTS TAB                                                         */
/* ================================================================== */
function ReportsTab({ products, orders }: { products: any[]; orders: any[] }) {
  const reports = useMemo(() => getCommerceReports(), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => generateCommerceReport("revenue", "monthly", products, orders)} className="btn-primary btn-sm"><BarChart3 className="h-4 w-4" /> Generate Revenue Report</button>
        <button onClick={() => generateCommerceReport("inventory", "weekly", products, orders)} className="btn-primary btn-sm"><Package className="h-4 w-4" /> Generate Inventory Report</button>
        <button onClick={() => generateCommerceReport("commission", "monthly", products, orders)} className="btn-primary btn-sm"><Handshake className="h-4 w-4" /> Generate Commission Report</button>
      </div>

      <div className="grid gap-4">
        {reports.slice().reverse().map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">{r.title}</p>
                <p className="text-xs text-muted">{formatDateTime(r.generatedAt)}</p>
              </div>
              <span className="badge bg-accent-soft text-accent capitalize">{r.period}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {r.metrics.map((m, i) => (
                <div key={i} className="rounded-lg border border-line p-2 text-center">
                  <p className="text-lg font-semibold text-ink">{typeof m.value === "number" && m.value > 1000 ? `$${m.value.toLocaleString()}` : m.value}</p>
                  <p className="text-xs text-muted">{m.label}</p>
                  <span className={cn("text-[0.55rem]", m.trend === "up" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted")}>{m.change > 0 ? "+" : ""}{m.change}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AI TAB                                                              */
/* ================================================================== */
function AiTab({ products }: { products: any[] }) {
  const optimizations = useMemo(() => getAiProductOptimizations(), []);
  const pricingRecs = useMemo(() => getAiPricingRecommendations(), []);
  const inventoryAdvice = useMemo(() => getAiInventoryAdvice(), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { const p = products[0]; if (p) generateAiProductOptimization(p); }} className="btn-primary btn-sm"><Bot className="h-4 w-4" /> Optimize First Product</button>
        <button onClick={() => { const p = products[0]; if (p) generateAiPricingRecommendation(p); }} className="btn-primary btn-sm"><DollarSign className="h-4 w-4" /> Price First Product</button>
        <button onClick={() => { const p = products.find((pr) => pr.stock <= 8); if (p) generateAiInventoryAdvice(p); }} className="btn-primary btn-sm"><PackageSearch className="h-4 w-4" /> Check Low Stock Product</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Bot className="h-4 w-4 text-accent" /> Product Optimizations ({optimizations.length})</h3>
            {optimizations.length === 0 ? (
              <p className="mt-3 text-xs text-muted">Run an optimization to see AI suggestions.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {optimizations.map((o) => (
                  <div key={o.productId} className="rounded-xl border border-line p-3">
                    <p className="text-sm font-medium text-ink">{o.productName}</p>
                    {o.suggestions.map((s, i) => (
                      <div key={i} className="mt-2 rounded-lg bg-surface2/40 p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink capitalize">{s.field}</span>
                          <span className={cn("badge", s.impact === "high" ? "bg-success/15 text-success" : s.impact === "medium" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{s.impact}</span>
                        </div>
                        <p className="mt-1 text-muted">{s.reasoning}</p>
                        <p className="mt-1 text-accent">→ {s.suggested}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><DollarSign className="h-4 w-4 text-accent" /> Pricing Recs ({pricingRecs.length})</h3>
            {pricingRecs.length === 0 ? (
              <p className="mt-3 text-xs text-muted">Run pricing analysis.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {pricingRecs.map((r) => (
                  <div key={r.productId} className="rounded-xl border border-line p-3">
                    <p className="text-sm font-medium text-ink">{r.productName}</p>
                    <p className="mt-1 text-xs text-muted">${r.currentPrice} → <span className="font-semibold text-accent">${r.recommendedPrice}</span></p>
                    <p className="mt-1 text-[0.55rem] text-muted">{r.reasoning}</p>
                    <div className="mt-2 flex items-center gap-2 text-[0.55rem]">
                      <span className="badge bg-info/15 text-info">{Math.round(r.confidence * 100)}% confidence</span>
                      <span className="text-muted">Demand: {r.expectedDemandChange > 0 ? "+" : ""}{r.expectedDemandChange}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><PackageSearch className="h-4 w-4 text-accent" /> Inventory Advice ({inventoryAdvice.length})</h3>
            {inventoryAdvice.length === 0 ? (
              <p className="mt-3 text-xs text-muted">Run inventory check.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {inventoryAdvice.map((a) => (
                  <div key={a.productId} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{a.productName}</p>
                      <span className={cn("badge", a.urgency === "critical" ? "bg-danger/15 text-danger" : a.urgency === "high" ? "bg-warning/15 text-warning" : a.urgency === "medium" ? "bg-info/15 text-info" : "bg-success/15 text-success")}>{a.urgency}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{a.recommendation}</p>
                    <p className="mt-1 text-xs font-medium text-accent">→ {a.suggestedAction}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
