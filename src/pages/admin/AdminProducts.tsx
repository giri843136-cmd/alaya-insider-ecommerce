import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Search, Package, ExternalLink, Image as ImageIcon, Download, Upload, Copy, CheckSquare } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState, Price } from "../../components/ui";
import { DamField } from "../../components/DamField";
import { slugify } from "../../lib/utils";
import { downloadCsv, parseProductsCsv, productsToCsv } from "../../lib/csv";
import type { Product, ProductType, Variant } from "../../lib/types";
import { cn } from "@/utils/cn";

interface PForm {
  id?: string;
  name: string;
  brand: string;
  category: string;
  type: ProductType;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  sku: string;
  barcode: string;
  gtin: string;
  asin: string;
  images: string;
  shortDescription: string;
  description: string;
  features: string;
  tags: string;
  variants: string;
  featured: boolean;
  bestSeller: boolean;
  isNew: boolean;
  affiliate: boolean;
  affiliateUrl: string;
  affiliatePartner: string;
}

const blank = (categoryId: string): PForm => ({
  name: "",
  brand: "",
  category: categoryId,
  type: "physical",
  price: "",
  salePrice: "",
  costPrice: "",
  stock: "0",
  sku: "",
  barcode: "",
  gtin: "",
  asin: "",
  images: "",
  shortDescription: "",
  description: "",
  features: "",
  tags: "",
  variants: "",
  featured: false,
  bestSeller: false,
  isNew: true,
  affiliate: false,
  affiliateUrl: "",
  affiliatePartner: "",
});

function toForm(p: Product): PForm {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand || "",
    category: p.category,
    type: p.type,
    price: String(p.price),
    salePrice: p.salePrice ? String(p.salePrice) : "",
    costPrice: p.costPrice ? String(p.costPrice) : "",
    stock: String(p.stock),
    sku: p.sku,
    barcode: p.barcode || "",
    gtin: p.gtin || "",
    asin: p.asin || "",
    images: p.images.join("\n"),
    shortDescription: p.shortDescription,
    description: p.description,
    features: p.features.join("\n"),
    tags: p.tags.join(", "),
    variants: (p.variants || []).map((v) => `${v.name}: ${v.options.join(", ")}`).join("\n"),
    featured: !!p.featured,
    bestSeller: !!p.bestSeller,
    isNew: !!p.isNew,
    affiliate: !!p.affiliate,
    affiliateUrl: p.affiliateUrl || "",
    affiliatePartner: p.affiliatePartner || "",
  };
}

function parseVariants(text: string): Variant[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, opts] = line.split(":");
      if (!name || !opts) return null;
      const options = opts.split(",").map((o) => o.trim()).filter(Boolean);
      return options.length ? { name: name.trim(), options } : null;
    })
    .filter((v): v is Variant => v !== null);
}

export default function AdminProducts() {
  const { products, categories, brands, addProduct, updateProduct, deleteProduct, cloneProduct, bulkUpdateProducts, bulkDeleteProducts } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [form, setForm] = useState<PForm | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  useEscapeKey(() => { setForm(null); setImportOpen(false); }, form !== null || importOpen);
  useLockBody(form !== null || importOpen);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))));

  const exportCsv = () => {
    downloadCsv(`alaya-products-${new Date().toISOString().slice(0, 10)}.csv`, productsToCsv(products));
    toast.success("Export ready", `${products.length} products downloaded as CSV.`);
  };

  const filtered = useMemo(() => {
    let list = products.slice();
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return list;
  }, [products, catFilter, query]);

  const set = <K extends keyof PForm>(k: K, v: PForm[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.category) return toast.error("Choose a category");
    if (form.price === "" || Number(form.price) < 0) return toast.error("Enter a valid price");

    const images = form.images.split("\n").map((s) => s.trim()).filter(Boolean);
    if (images.length === 0) return toast.error("Add at least one image URL");

    const matchedBrand = brands.find((b) => b.name.toLowerCase() === form.brand.trim().toLowerCase());
    const payload: Partial<Product> = {
      name: form.name.trim(),
      slug: slugify(form.name),
      brand: form.brand.trim(),
      brandId: matchedBrand?.id ?? (form.brand.trim() ? slugify(form.brand) : undefined),
      category: form.category,
      type: form.type,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      stock: form.affiliate ? 0 : Number(form.stock) || 0,
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || undefined,
      gtin: form.gtin.trim() || undefined,
      asin: form.asin.trim() || undefined,
      images,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      variants: form.type === "variable" ? parseVariants(form.variants) : undefined,
      featured: form.featured,
      bestSeller: form.bestSeller,
      isNew: form.isNew,
      affiliate: form.affiliate,
      affiliateUrl: form.affiliateUrl.trim() || undefined,
      affiliatePartner: form.affiliatePartner.trim() || undefined,
    };

    if (form.id) {
      updateProduct(form.id, payload);
      toast.success("Product updated");
    } else {
      addProduct(payload as Partial<Product> & { name: string; category: string });
      toast.success("Product created");
    }
    setForm(null);
  };

  return (
    <>
      <Seo title="Products" path="/admin/products" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Products</h1>
            <p className="mt-1 text-sm text-muted">{products.length} products across {categories.length} categories.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setForm(blank(categories[0]?.id || ""))} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add product</button>
            <button onClick={() => setImportOpen(true)} className="btn-outline btn-md"><Upload className="h-4 w-4" /> Import</button>
            <button onClick={exportCsv} className="btn-outline btn-md"><Download className="h-4 w-4" /> Export</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="input-field pl-9" />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink focus:border-accent focus:outline-none">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 animate-fade-in">
            <span className="flex items-center gap-2 text-sm font-medium text-accent"><CheckSquare className="h-4 w-4" /> {selected.size} selected</span>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { bulkUpdateProducts([...selected], { status: "published" }); toast.success(`${selected.size} published`); setSelected(new Set()); }} className="btn-ghost btn-sm">Publish</button>
              <button onClick={() => { bulkUpdateProducts([...selected], { status: "draft" }); toast.success(`${selected.size} drafted`); setSelected(new Set()); }} className="btn-ghost btn-sm">Set draft</button>
              <button onClick={() => { bulkUpdateProducts([...selected], { featured: true }); toast.success(`${selected.size} featured`); setSelected(new Set()); }} className="btn-ghost btn-sm">Feature</button>
              <button onClick={() => { [...selected].forEach((id) => cloneProduct(id)); toast.success(`${selected.size} duplicated`); setSelected(new Set()); }} className="btn-ghost btn-sm"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
              <button onClick={() => { bulkDeleteProducts([...selected]); toast.success(`${selected.size} deleted`); setSelected(new Set()); }} className="btn btn-sm border border-danger/40 text-danger hover:bg-danger/10">Delete</button>
            </div>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Package className="h-6 w-6" />} title="No products found" description="Try a different search or add a new product." action={<button onClick={() => setForm(blank(categories[0]?.id || ""))} className="btn-primary btn-md">Add product</button>} />
          </div>
        ) : (
          <div className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 accent-[var(--c-accent)]" />
                    </th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((p) => {
                    const cat = categories.find((c) => c.id === p.category);
                    return (
                      <tr key={p.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Select ${p.name}`} className="h-4 w-4 accent-[var(--c-accent)]" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.images[0]} alt="" className="h-11 w-9 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-medium text-ink">
                                {p.name}
                                {p.featured && <span className="badge bg-accent-soft text-accent">★</span>}
                                {p.affiliate && <span className="badge bg-accent text-accent-ink">Aff</span>}
                              </p>
                              <p className="text-xs text-muted">{p.brand || p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{cat?.name || "—"}</td>
                        <td className="px-4 py-3 capitalize text-muted">{p.type}</td>
                        <td className="px-4 py-3"><Price price={p.price} salePrice={p.salePrice} /></td>
                        <td className="px-4 py-3">
                          {p.affiliate ? <span className="text-muted">—</span> : <span className={cn(p.stock <= 8 && p.type !== "digital" ? "font-semibold text-amber-600 dark:text-amber-400" : "text-ink")}>{p.stock}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("badge capitalize", p.status === "published" ? "bg-success/15 text-success" : p.status === "draft" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{p.status ?? "published"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { cloneProduct(p.id); toast.success("Product duplicated"); }} aria-label="Duplicate" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Copy className="h-4 w-4" /></button>
                            <button onClick={() => setForm(toForm(p))} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setToDelete(p)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
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
      </div>

      {/* Editor */}
      {form && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Product editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setForm(null)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 my-4 w-full max-w-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{form.id ? "Edit product" : "New product"}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label-field">Name *</label><input className="input-field" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div>
                <label className="label-field">Brand</label>
                <input className="input-field" list="brand-options" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Type or select" />
                <datalist id="brand-options">
                  {brands.map((b) => <option key={b.id} value={b.name} />)}
                </datalist>
              </div>
              <div><label className="label-field">SKU</label><input className="input-field" value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
              <div><label className="label-field">Category *</label>
                <select className="input-field" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label-field">Type</label>
                <select className="input-field" value={form.type} onChange={(e) => set("type", e.target.value as ProductType)}>
                  <option value="physical">Physical</option>
                  <option value="variable">Variable</option>
                  <option value="digital">Digital</option>
                  <option value="external">External / Dropship</option>
                </select>
              </div>
              <div><label className="label-field">Price (USD) *</label><input type="number" min={0} step="0.01" className="input-field" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
              <div><label className="label-field">Sale price (USD)</label><input type="number" min={0} step="0.01" className="input-field" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="Optional" /></div>
              {!form.affiliate && (
                <div><label className="label-field">Stock</label><input type="number" min={0} className="input-field" value={form.stock} onChange={(e) => set("stock", e.target.value)} /></div>
              )}
              <div><label className="label-field">Cost price (USD)</label><input type="number" min={0} step="0.01" className="input-field" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} placeholder="For margin calc" /></div>
            </div>

            {/* PIM Identifiers */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div><label className="label-field">Barcode</label><input className="input-field" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="EAN/UPC" /></div>
              <div><label className="label-field">GTIN</label><input className="input-field" value={form.gtin} onChange={(e) => set("gtin", e.target.value)} /></div>
              <div><label className="label-field">ASIN</label><input className="input-field" value={form.asin} onChange={(e) => set("asin", e.target.value)} placeholder="Amazon ID" /></div>
            </div>

            <div className="mt-4"><label className="label-field">Short description</label><input className="input-field" value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></div>
            <div className="mt-4"><label className="label-field">Full description</label><textarea rows={3} className="input-field resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>

            <div className="mt-4">
              <DamField
                label="Product images *"
                value={form.images}
                onChange={(v) => set("images", v)}
                purpose="Product gallery images"
                source="product"
                folder="Products"
                multiple
                helpText="Click to open the DAM picker — select one or more product images"
                required
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label-field">Features (one per line)</label><textarea rows={3} className="input-field resize-none" value={form.features} onChange={(e) => set("features", e.target.value)} /></div>
              <div><label className="label-field">Tags (comma separated)</label><textarea rows={3} className="input-field resize-none" value={form.tags} onChange={(e) => set("tags", e.target.value)} /></div>
            </div>

            {form.type === "variable" && (
              <div className="mt-4">
                <label className="label-field">Variants (Name: opt1, opt2 per line)</label>
                <textarea rows={2} className="input-field resize-none font-mono text-xs" value={form.variants} onChange={(e) => set("variants", e.target.value)} placeholder={"Size: S, M, L\nColour: Tan, Black"} />
              </div>
            )}

            {/* Flags */}
            <div className="mt-5 flex flex-wrap gap-4">
              {([["featured", "Featured"], ["bestSeller", "Bestseller"], ["isNew", "New arrival"]] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[var(--c-accent)]" />
                  {label}
                </label>
              ))}
            </div>

            {/* Affiliate */}
            <div className="mt-4 rounded-xl border border-line bg-surface2/40 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input type="checkbox" checked={form.affiliate} onChange={(e) => set("affiliate", e.target.checked)} className="h-4 w-4 accent-[var(--c-accent)]" />
                Affiliate product (links to external partner)
              </label>
              {form.affiliate && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label className="label-field">Partner name</label><input className="input-field" value={form.affiliatePartner} onChange={(e) => set("affiliatePartner", e.target.value)} placeholder="NET-A-PORTER" /></div>
                  <div><label className="label-field">Affiliate URL</label><input className="input-field" value={form.affiliateUrl} onChange={(e) => set("affiliateUrl", e.target.value)} placeholder="https://…" /></div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {form.id ? (
                <a href={`/#/product/${slugify(form.name)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /> View</a>
              ) : <span className="flex items-center gap-1.5 text-xs text-muted"><ImageIcon className="h-3.5 w-3.5" /> Saved instantly to your store</span>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm(null)} className="btn-ghost btn-md">Cancel</button>
                <button type="submit" className="btn-primary btn-md">{form.id ? "Save changes" : "Create product"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete product"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { if (toDelete) { deleteProduct(toDelete.id); toast.success("Product deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Delete <strong>{toDelete?.name}</strong>? This permanently removes it from your store.
      </Dialog>

      {/* Import modal */}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </>
  );
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { addProduct } = useStore();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ ok: number; errors: number } | null>(null);
  const [importing, setImporting] = useState(false);

  const sample =
    "name,brand,category,type,price,stock,sku,tags,images\n" +
    "Silk Slip Dress,Auré,beauty,physical,180,20,AUR-SSD-001,evening,silk,https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg\n";

  /** Import images for a product and return updated product with local image URLs */
  const processImages = async (
    product: Partial<Product> & { name: string; category: string },
  ): Promise<(Partial<Product> & { name: string; category: string })> => {
    const urls = product.images || [];
    if (urls.length === 0) return product;

    try {
      const { api } = await import("../../lib/api-client");
      const res = await api.post<{ localUrls: string[]; imported: number; failed: number; results: { success: boolean; url?: string; error?: string }[] }>(
        "/media/import-product-images",
        {
          urls,
          refId: product.sku || product.name,
          refName: product.name,
          source: "csv",
        },
        { timeout: 120_000 },
      );

      if (res.data.localUrls && res.data.localUrls.length > 0) {
        return { ...product, images: res.data.localUrls };
      }
    } catch (err) {
      console.warn(`[CSV IMPORT] Image import failed for ${product.name}:`, err);
      // Fall through with original URLs — product still created
    }

    return product;
  };

  const run = async () => {
    setImporting(true);
    const rows = parseProductsCsv(text);
    let ok = 0;
    let errors = 0;

    for (const r of rows) {
      if (r.errors.length) { errors++; continue; }

      // Download and process images first
      const productWithImages = await processImages(
        r.product as Partial<Product> & { name: string; category: string },
      );

      addProduct(productWithImages);
      ok++;
    }

    setResult({ ok, errors });
    setImporting(false);
    if (ok) toast.success("Import complete", `${ok} products added with processed images.`);
    if (errors && !ok) toast.error("Import had errors", `${errors} rows skipped.`);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import products">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="card relative z-10 w-full max-w-xl p-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Import products (CSV)</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-sm text-muted">Paste CSV data below. Headers: name, brand, category, type, price, salePrice, stock, sku, barcode, gtin, asin, tags, shortDescription, images (one per line), etc.</p>
        <textarea rows={8} className="input-field mt-4 resize-none font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} placeholder={sample} />
        <div className="mt-3 flex items-center justify-between">
          <button onClick={() => setText(sample)} className="text-xs text-accent hover:underline">Insert sample template</button>
          {result && <p className="text-xs text-muted"><span className="font-semibold text-success">{result.ok} added</span> · {result.errors} skipped</p>}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} disabled={importing} className="btn-ghost btn-md">Close</button>
          <button onClick={run} disabled={importing} className="btn-primary btn-md">
            {importing ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Importing…</>
            ) : (
              <><Upload className="h-4 w-4" /> Import</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
