import { useState, useMemo } from "react";
import { Layers, Search, X, Plus, CheckCircle } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getProductMappings, saveProductMappings } from "../../lib/supplier-automation";
import type { ProductSupplierMapping } from "../../lib/commerce-types";
import { uid } from "../../lib/utils";

export default function SupplierAutomationMapping() {
  const { products, suppliers } = useStore();
  const [mappings, setMappings] = useState<ProductSupplierMapping[]>(getProductMappings);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<ProductSupplierMapping | null>(null);

  const refresh = () => setMappings(getProductMappings());

  const filtered = useMemo(() => {
    return mappings.filter(m => {
      if (search && !m.productName.toLowerCase().includes(search.toLowerCase()) && !m.supplierName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).slice(0, 200);
  }, [mappings, search]);



  const addMapping = () => {
    const newM: ProductSupplierMapping = {
      id: uid("psm"),
      productId: "",
      productName: "",
      productSku: "",
      supplierId: "",
      supplierName: "",
      supplierSku: "",
      supplierProductUrl: "",
      supplierProductId: "",
      supplierCost: 0,
      shippingCost: 0,
      currency: "USD",
      leadTime: 5,
      inventory: 100,
      warehouse: "Primary",
      minQty: 1,
      maxQty: 50,
      supplierMargin: 30,
      isPreferred: false,
      priority: 1,
      isBackup: false,
      automaticFailover: true,
      syncStatus: "synced",
      createdAt: Date.now(),
    };
    const updated = [...mappings, newM];
    saveProductMappings(updated);
    refresh();
    setViewing(newM);
  };

  const saveMapping = (m: ProductSupplierMapping) => {
    const updated = mappings.map(mp => mp.id === m.id ? m : mp);
    saveProductMappings(updated);
    refresh();
    setViewing(null);
  };

  const deleteMapping = (id: string) => {
    const updated = mappings.filter(m => m.id !== id);
    saveProductMappings(updated);
    refresh();
  };

  return (
    <>
      <Seo title="Product Supplier Mapping" path="/admin/commerce/supplier-automation/mapping" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Product Supplier Mapping</h1>
            <p className="mt-1 text-sm text-muted">{mappings.length} product-supplier relationships with failover.</p>
          </div>
          <button onClick={addMapping} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add Mapping</button>
        </div>
        <div className="mt-4 relative max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input-field pl-9" placeholder="Search products or suppliers..." value={search} onChange={e => setSearch(e.target.value)} /></div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Layers className="h-6 w-6" />} title="No mappings yet" action={<button onClick={addMapping} className="btn-primary btn-md">Add Mapping</button>} /></div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3 text-right">Cost</th><th className="px-4 py-3 text-right">Margin</th><th className="px-4 py-3 text-center">Priority</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Failover</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-surface2/40 cursor-pointer" onClick={() => setViewing(m)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink truncate max-w-[200px]">{m.productName || m.productId}</p>
                      <p className="text-xs text-muted">{m.productSku}</p>
                    </td>
                    <td className="px-4 py-3"><span className="font-medium text-ink">{m.supplierName}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-muted">{m.supplierSku}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">${m.supplierCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">{m.supplierMargin}%</td>
                    <td className="px-4 py-3 text-center"><span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", m.priority === 1 ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>{m.priority}</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("badge", m.syncStatus === "synced" ? "bg-success/15 text-success" : m.syncStatus === "pending" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{m.syncStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{m.automaticFailover ? <CheckCircle className="inline h-4 w-4 text-success" /> : <X className="inline h-4 w-4 text-muted" />}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={(e) => { e.stopPropagation(); deleteMapping(m.id); }} className="text-danger/50 hover:text-danger text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Mapping */}
      {viewing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setViewing(null)} />
          <div className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">Edit Mapping</h2>
            <button onClick={() => setViewing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Product</label><select className="input-field" value={viewing.productId} onChange={e => setViewing({...viewing, productId: e.target.value, productName: products.find(p => p.id === e.target.value)?.name || "", productSku: products.find(p => p.id === e.target.value)?.sku || "" })}>
                  <option value="">Select product</option>
                  {products.filter(p => !mappings.some(m => m.productId === p.id && m.supplierId === viewing.supplierId)).slice(0, 50).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
                <div><label className="label-field">Supplier</label><select className="input-field" value={viewing.supplierId} onChange={e => setViewing({...viewing, supplierId: e.target.value, supplierName: suppliers.find(s => s.id === e.target.value)?.name || "" })}>
                  <option value="">Select supplier</option>
                  {suppliers.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Supplier SKU</label><input className="input-field" value={viewing.supplierSku} onChange={e => setViewing({...viewing, supplierSku: e.target.value})} /></div>
                <div><label className="label-field">Supplier Cost ($)</label><input type="number" step={0.01} className="input-field" value={viewing.supplierCost} onChange={e => setViewing({...viewing, supplierCost: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Shipping Cost</label><input type="number" step={0.01} className="input-field" value={viewing.shippingCost} onChange={e => setViewing({...viewing, shippingCost: Number(e.target.value)})} /></div>
                <div><label className="label-field">Lead Time (days)</label><input type="number" className="input-field" value={viewing.leadTime} onChange={e => setViewing({...viewing, leadTime: Number(e.target.value)})} /></div>
                <div><label className="label-field">Margin (%)</label><input type="number" className="input-field" value={viewing.supplierMargin} onChange={e => setViewing({...viewing, supplierMargin: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Priority</label><select className="input-field" value={viewing.priority} onChange={e => setViewing({...viewing, priority: Number(e.target.value)})}>
                  {[1,2,3,4,5].map(p => <option key={p} value={p}>Priority {p}{p === 1 ? " (Primary)" : ""}</option>)}
                </select></div>
                <div><label className="label-field">Inventory</label><input type="number" className="input-field" value={viewing.inventory} onChange={e => setViewing({...viewing, inventory: Number(e.target.value)})} /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={viewing.isPreferred} onChange={e => setViewing({...viewing, isPreferred: e.target.checked})} /> Preferred</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={viewing.isBackup} onChange={e => setViewing({...viewing, isBackup: e.target.checked})} /> Backup</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={viewing.automaticFailover} onChange={e => setViewing({...viewing, automaticFailover: e.target.checked})} /> Auto-Failover</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setViewing(null)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={() => saveMapping(viewing)} className="btn-primary btn-md">Save Mapping</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
