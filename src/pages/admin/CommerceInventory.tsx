import { useMemo, useState } from "react";
import { Search, Package, AlertTriangle, TrendingUp, RefreshCw, Warehouse as WarehouseIcon } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { cn } from "@/utils/cn";

export default function CommerceInventory() {
  const { products, suppliers } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out" | "healthy">("all");

  const inventoryData = useMemo(() => {
    const physical = products.filter(p => p.type !== "digital");
    const lowStock = physical.filter(p => p.stock <= 8 && p.stock > 0);
    const outOfStock = physical.filter(p => p.stock === 0);
    const healthy = physical.filter(p => p.stock > 8);
    const totalValue = physical.reduce((s, p) => s + (p.salePrice ?? p.price) * p.stock, 0);
    const totalCost = physical.reduce((s, p) => s + (p.costPrice || 0) * p.stock, 0);

    let list = physical;
    if (filter === "low") list = lowStock;
    else if (filter === "out") list = outOfStock;
    else if (filter === "healthy") list = healthy;
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)); }

    return { lowStock, outOfStock, healthy, totalValue, totalCost, list, totalItems: physical.length };
  }, [products, filter, query]);

  return (
    <>
      <Seo title="Inventory Management" path="/admin/commerce/inventory" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Inventory Management</h1>
        <p className="mt-1 text-sm text-muted">{products.length} total items · multi-warehouse stock tracking.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Items", value: inventoryData.totalItems, sub: "Physical products", icon: Package, color: "accent" },
            { label: "Inventory Value", value: inventoryData.totalValue, sub: "At selling price", icon: TrendingUp, color: "success", isMoney: true },
            { label: "Low Stock", value: inventoryData.lowStock.length, sub: "≤ 8 units remaining", icon: AlertTriangle, color: "warning" },
            { label: "Out of Stock", value: inventoryData.outOfStock.length, sub: "Zero inventory", icon: AlertTriangle, color: "danger" },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.color === "accent" && "bg-accent-soft text-accent", s.color === "success" && "bg-success/15 text-success", s.color === "warning" && "bg-warning/15 text-warning", s.color === "danger" && "bg-danger/15 text-danger")}>
                  <s.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink tabular-nums">{s.isMoney ? <Money amount={s.value} /> : typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="text-xs text-muted/70">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search inventory…" className="input-field pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all","low","out","healthy"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn("chip capitalize", filter === f && "chip-active")}>{f === "all" ? "All" : f === "low" ? "Low Stock" : f === "out" ? "Out of Stock" : "Healthy"}</button>
            ))}
          </div>
          <button onClick={() => toast.success("Stock levels refreshed")} className="btn-ghost btn-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        {inventoryData.list.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Package className="h-6 w-6" />} title="No items" /></div>
        ) : (
          <div className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Forecast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {inventoryData.list.map(p => {
                    const supplier = suppliers.find(s => s.id === p.supplierId);
                    const val = (p.salePrice ?? p.price) * p.stock;
                    const status = p.stock === 0 ? "out" : p.stock <= 8 ? "low" : "healthy";
                    return (
                      <tr key={p.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.images[0]} alt="" className="h-10 w-8 rounded-lg object-cover" />
                            <span className="truncate font-medium text-ink max-w-[200px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted">{p.sku}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold tabular-nums", status === "out" ? "text-danger" : status === "low" ? "text-warning" : "text-ink")}>{p.stock}</span>
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-surface2">
                              <div className={cn("h-full rounded-full", status === "out" ? "bg-danger" : status === "low" ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(100, (p.stock / 50) * 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-ink"><Money amount={val} /></td>
                        <td className="px-4 py-3 text-xs">{supplier ? <span className="text-accent">{supplier.name}</span> : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className={cn("badge", status === "out" ? "bg-danger/15 text-danger" : status === "low" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>
                            {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {p.stock <= 8 ? "Reorder needed" : p.stock <= 20 ? "Order soon" : "Adequate"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Health Score */}
        <div className="mt-6 card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><WarehouseIcon className="h-4 w-4 text-accent" /> Inventory Health</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex h-4 overflow-hidden rounded-full bg-surface2">
                <div className="bg-success transition-all" style={{ width: `${(inventoryData.healthy.length / Math.max(1, inventoryData.totalItems)) * 100}%` }} title="Healthy" />
                <div className="bg-warning transition-all" style={{ width: `${(inventoryData.lowStock.length / Math.max(1, inventoryData.totalItems)) * 100}%` }} title="Low Stock" />
                <div className="bg-danger transition-all" style={{ width: `${(inventoryData.outOfStock.length / Math.max(1, inventoryData.totalItems)) * 100}%` }} title="Out of Stock" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Healthy ({inventoryData.healthy.length})</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Low ({inventoryData.lowStock.length})</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> Out ({inventoryData.outOfStock.length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
