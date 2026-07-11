import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Search, Package, TrendingUp, TrendingDown, Truck, Copy, Download } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState, Money } from "../../components/ui";
import { slugify } from "../../lib/utils";
import { downloadCsv } from "../../lib/csv";
import type { Product } from "../../lib/types";
import { cn } from "@/utils/cn";

interface ProductForm {
  id?: string;
  name: string;
  category: string;
  type: string;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  sku: string;
  supplierId: string;
  supplierSku: string;
  supplierUrl: string;
  targetMargin: string;
  weight: string;
  dimensions: string;
  shippingProfile: string;
  returnPolicy: string;
}

const blank: ProductForm = { name: "", category: "", type: "physical", price: "", salePrice: "", costPrice: "", stock: "0", sku: "", supplierId: "", supplierSku: "", supplierUrl: "", targetMargin: "40", weight: "", dimensions: "", shippingProfile: "", returnPolicy: "" };

function toForm(p: Product): ProductForm {
  return { id: p.id, name: p.name, category: p.category, type: p.type, price: String(p.price), salePrice: p.salePrice ? String(p.salePrice) : "", costPrice: p.costPrice ? String(p.costPrice) : "", stock: String(p.stock), sku: p.sku, supplierId: p.supplierId || "", supplierSku: "", supplierUrl: "", targetMargin: "40", weight: "", dimensions: "", shippingProfile: "", returnPolicy: "" };
}

export default function CommerceProducts() {
  const { products, categories, suppliers, updateProduct, deleteProduct, cloneProduct, bulkUpdateProducts, bulkDeleteProducts, addProduct } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [form, setForm] = useState<ProductForm | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEscapeKey(() => setForm(null), form !== null);
  useLockBody(form !== null);

  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

  const filtered = useMemo(() => {
    let list = products.slice();
    if (catFilter !== "all") list = list.filter(p => p.category === catFilter);
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q)); }
    return list;
  }, [products, catFilter, query]);

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm(f => f ? { ...f, [k]: v } : f);

  const getMargin = (p: Product) => {
    if (!p.costPrice || p.costPrice <= 0) return null;
    const sellPrice = p.salePrice ?? p.price;
    return Math.round(((sellPrice - p.costPrice) / sellPrice) * 100);
  };

  const getProfit = (p: Product) => {
    if (!p.costPrice || p.costPrice <= 0) return null;
    return (p.salePrice ?? p.price) - p.costPrice;
  };

  const getSupplier = (p: Product) => suppliers.find(s => s.id === p.supplierId);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name.trim()) return toast.error("Name required");
    const payload: Partial<Product> = {
      name: form.name.trim(), slug: slugify(form.name), category: form.category,
      type: form.type as any, price: Number(form.price), salePrice: form.salePrice ? Number(form.salePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      stock: Number(form.stock) || 0, sku: form.sku.trim(), supplierId: form.supplierId || undefined,
    };
    if (form.id) { updateProduct(form.id, payload); toast.success("Product updated"); }
    else { addProduct(payload as any); toast.success("Product created"); }
    setForm(null);
  };

  return (
    <>
      <Seo title="Commerce Products" path="/admin/commerce/products" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Product Management</h1>
            <p className="mt-1 text-sm text-muted">{products.length} products · dropshipping & margin management.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setForm({...blank, category: categories[0]?.id || ""})} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add Product</button>
            <button onClick={() => { downloadCsv(`products.csv`, "name,sku,price,costPrice,targetMargin\n"); toast.success("CSV exported"); }} className="btn-outline btn-md"><Download className="h-4 w-4" /> Export</button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…" className="input-field pl-9" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {selected.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 animate-fade-in">
            <span className="text-sm font-medium text-accent">{selected.size} selected</span>
            <div className="flex gap-2">
              <button onClick={() => { bulkUpdateProducts([...selected], { status: "published" as any }); toast.success(`${selected.size} published`); setSelected(new Set()); }} className="btn-ghost btn-sm">Publish</button>
              <button onClick={() => { [...selected].forEach(id => cloneProduct(id)); toast.success(`${selected.size} duplicated`); setSelected(new Set()); }} className="btn-ghost btn-sm"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
              <button onClick={() => { bulkDeleteProducts([...selected]); toast.success(`${selected.size} deleted`); setSelected(new Set()); }} className="btn btn-sm border border-danger/40 text-danger hover:bg-danger/10">Delete</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Package className="h-6 w-6" />} title="No products found" /></div>
        ) : (
          <div className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="h-4 w-4 accent-[var(--c-accent)]" /></th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Margin</th>
                    <th className="px-4 py-3">Profit</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map(p => {
                    const margin = getMargin(p);
                    const profit = getProfit(p);
                    const supplier = getSupplier(p);
                    return (
                      <tr key={p.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="h-4 w-4 accent-[var(--c-accent)]" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.images[0]} alt="" className="h-11 w-9 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">{p.name}</p>
                              <p className="text-xs text-muted">{p.sku || p.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Money amount={p.salePrice ?? p.price} /></td>
                        <td className="px-4 py-3">{p.costPrice ? <Money amount={p.costPrice} /> : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">
                          {margin !== null ? (
                            <span className={cn("flex items-center gap-1 font-medium", margin >= 40 ? "text-success" : margin >= 20 ? "text-warning" : "text-danger")}>
                              {margin >= 40 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                              {margin}%
                            </span>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">{profit !== null ? <Money amount={profit} /> : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">
                          {supplier ? (
                            <span className="flex items-center gap-1 text-xs"><Truck className="h-3 w-3 text-accent" /> {supplier.name}</span>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(p.stock <= 8 && p.type !== "digital" ? "font-semibold text-amber-600" : "text-ink")}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { cloneProduct(p.id); toast.success("Duplicated"); }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Copy className="h-4 w-4" /></button>
                            <button onClick={() => setForm(toForm(p))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setToDelete(p)} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Margin Summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "High Margin (40%+)", count: products.filter(p => { const m = p.costPrice ? Math.round((((p.salePrice ?? p.price) - p.costPrice) / (p.salePrice ?? p.price)) * 100) : 0; return m >= 40; }).length, color: "text-success" },
            { label: "Medium Margin (20-39%)", count: products.filter(p => { const m = p.costPrice ? Math.round((((p.salePrice ?? p.price) - p.costPrice) / (p.salePrice ?? p.price)) * 100) : 0; return m >= 20 && m < 40; }).length, color: "text-warning" },
            { label: "Low Margin (<20%)", count: products.filter(p => { const m = p.costPrice ? Math.round((((p.salePrice ?? p.price) - p.costPrice) / (p.salePrice ?? p.price)) * 100) : 0; return m > 0 && m < 20; }).length, color: "text-danger" },
            { label: "No Cost Data", count: products.filter(p => !p.costPrice).length, color: "text-muted" },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={cn("font-display text-2xl font-semibold", s.color)}>{s.count}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      {form && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setForm(null)} />
          <form onSubmit={save} className="card relative z-10 my-4 w-full max-w-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{form.id ? "Edit Product" : "New Product"}</h2>
              <button type="button" onClick={() => setForm(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label-field">Product Name *</label><input className="input-field" value={form.name} onChange={e => set("name", e.target.value)} /></div>
              <div><label className="label-field">Category</label><select className="input-field" value={form.category} onChange={e => set("category", e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="label-field">Type</label><select className="input-field" value={form.type} onChange={e => set("type", e.target.value)}><option value="physical">Physical</option><option value="external">Dropship</option></select></div>
              <div><label className="label-field">Selling Price ($)</label><input type="number" step="0.01" className="input-field" value={form.price} onChange={e => set("price", e.target.value)} /></div>
              <div><label className="label-field">Sale Price ($)</label><input type="number" step="0.01" className="input-field" value={form.salePrice} onChange={e => set("salePrice", e.target.value)} /></div>
              <div><label className="label-field">Cost Price ($)</label><input type="number" step="0.01" className="input-field" value={form.costPrice} onChange={e => set("costPrice", e.target.value)} /></div>
              <div><label className="label-field">Stock</label><input type="number" className="input-field" value={form.stock} onChange={e => set("stock", e.target.value)} /></div>
              <div><label className="label-field">SKU</label><input className="input-field" value={form.sku} onChange={e => set("sku", e.target.value)} /></div>
              <div className="sm:col-span-2 border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Dropshipping Details</h3>
              </div>
              <div><label className="label-field">Supplier</label><select className="input-field" value={form.supplierId} onChange={e => set("supplierId", e.target.value)}><option value="">Select supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="label-field">Supplier SKU</label><input className="input-field" value={form.supplierSku} onChange={e => set("supplierSku", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label-field">Supplier URL</label><input className="input-field" value={form.supplierUrl} onChange={e => set("supplierUrl", e.target.value)} placeholder="https://supplier.com/product/…" /></div>
              <div><label className="label-field">Target Margin (%)</label><input type="number" className="input-field" value={form.targetMargin} onChange={e => set("targetMargin", e.target.value)} /></div>
              <div><label className="label-field">Weight (kg)</label><input type="number" step="0.1" className="input-field" value={form.weight} onChange={e => set("weight", e.target.value)} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setForm(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{form.id ? "Save Changes" : "Create Product"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Product" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteProduct(toDelete.id); toast.success("Deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>? This affects supplier links too.
      </Dialog>
    </>
  );
}
