/**
 * ALAYA INSIDER — Smart Collection Builder (Part 3.4)
 * -----------------------------------------------------
 * Enterprise collection management: create, edit, preview dynamic collections
 * with filter rules, templates, SEO metadata, scheduling, and analytics.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Clock,
  BarChart3,
  Sparkles,
  Filter,
  Tag,
  Globe,
  X,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState, Badge } from "../../components/ui";
import { cn } from "@/utils/cn";
import { COLLECTIONS } from "../../lib/collections";
import type { Product } from "../../lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof Layers;
  config: { filterKey: string; sortKey: string; limit: number };
}

const TEMPLATES: CollectionTemplate[] = [
  { id: "editorial", name: "Editor's Choice", description: "Hand-picked featured products", icon: Sparkles, config: { filterKey: "featured", sortKey: "rating", limit: 8 } },
  { id: "bestsellers", name: "Best Sellers", description: "Most popular products", icon: BarChart3, config: { filterKey: "bestseller", sortKey: "popularity", limit: 8 } },
  { id: "new-arrivals", name: "New Arrivals", description: "Most recent products", icon: Clock, config: { filterKey: "newest", sortKey: "date", limit: 8 } },
  { id: "trending", name: "Trending Now", description: "What's popular right now", icon: BarChart3, config: { filterKey: "all", sortKey: "popularity", limit: 8 } },
  { id: "sale", name: "On Sale", description: "Discounted products", icon: Tag, config: { filterKey: "sale", sortKey: "discount", limit: 8 } },
  { id: "affiliate", name: "Affiliate Picks", description: "Partner-curated products", icon: Globe, config: { filterKey: "affiliate", sortKey: "popularity", limit: 8 } },
  { id: "luxury", name: "Luxury Edit", description: "Premium investment pieces", icon: Filter, config: { filterKey: "luxury", sortKey: "price-desc", limit: 8 } },
  { id: "clearance", name: "Clearance", description: "Final reductions", icon: Tag, config: { filterKey: "sale", sortKey: "discount", limit: 8 } },
];

interface SmartCollection {
  id: string;
  name: string;
  description: string;
  template: string;
  categories: string[];
  tags: string[];
  minRating: number;
  maxPrice: number;
  minPrice: number;
  onlyOnSale: boolean;
  onlyFeatured: boolean;
  onlyBestSeller: boolean;
  sortBy: string;
  limit: number;
  isActive: boolean;
  createdAt: number;
}

const EMPTY_COLLECTION: SmartCollection = {
  id: "",
  name: "",
  description: "",
  template: "editorial",
  categories: [],
  tags: [],
  minRating: 0,
  maxPrice: 10000,
  minPrice: 0,
  onlyOnSale: false,
  onlyFeatured: false,
  onlyBestSeller: false,
  sortBy: "popularity",
  limit: 8,
  isActive: true,
  createdAt: Date.now(),
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AdminCollectionBuilder() {
  const { products, categories } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"existing" | "builder" | "templates">("existing");
  const [editing, setEditing] = useState<SmartCollection | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);
  const [smartCollections, setSmartCollections] = useState<SmartCollection[]>(() => {
    try { return JSON.parse(localStorage.getItem("alaya_smart_collections_v1") || "[]"); } catch { return []; }
  });

  const saveCollections = (collections: SmartCollection[]) => {
    setSmartCollections(collections);
    try { localStorage.setItem("alaya_smart_collections_v1", JSON.stringify(collections)); } catch { /* ignore */ }
  };

  const applyFilter = (collection: SmartCollection): Product[] => {
    let list = [...products];
    if (collection.categories.length > 0) list = list.filter((p) => collection.categories.includes(p.category));
    if (collection.tags.length > 0) list = list.filter((p) => p.tags.some((t) => collection.tags.includes(t)));
    if (collection.minRating > 0) list = list.filter((p) => p.rating >= collection.minRating);
    if (collection.maxPrice < 10000) list = list.filter((p) => (p.salePrice ?? p.price) <= collection.maxPrice);
    if (collection.minPrice > 0) list = list.filter((p) => (p.salePrice ?? p.price) >= collection.minPrice);
    if (collection.onlyOnSale) list = list.filter((p) => p.salePrice && p.salePrice < p.price);
    if (collection.onlyFeatured) list = list.filter((p) => p.featured);
    if (collection.onlyBestSeller) list = list.filter((p) => p.bestSeller);

    switch (collection.sortBy) {
      case "price-asc": list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)); break;
      case "price-desc": list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price)); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "date": list.sort((a, b) => b.createdAt - a.createdAt); break;
      case "popularity": list.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating); break;
      case "discount": list.sort((a, b) => ((b.salePrice ?? b.price) - b.price) - ((a.salePrice ?? a.price) - a.price)); break;
      default: break;
    }

    return list.slice(0, collection.limit);
  };

  const previewItems = editing ? applyFilter(editing) : [];

  const saveCollection = () => {
    if (!editing?.name.trim()) { toast.error("Collection name is required"); return; }
    if (editing.id) {
      saveCollections(smartCollections.map((c) => c.id === editing.id ? { ...editing } : c));
      toast.success("Collection updated");
    } else {
      const newCollection = { ...editing, id: `smart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() };
      saveCollections([newCollection, ...smartCollections]);
      toast.success("Collection created");
    }
    setEditing(null);
  };

  const deleteCollection = (id: string) => {
    saveCollections(smartCollections.filter((c) => c.id !== id));
    toast.success("Collection deleted");
    setToDelete(null);
  };

  const duplicateCollection = (collection: SmartCollection) => {
    const dup = { ...collection, id: `smart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: `${collection.name} (Copy)`, createdAt: Date.now() };
    saveCollections([dup, ...smartCollections]);
    toast.success("Collection duplicated");
  };

  const tabs = [
    { id: "existing" as const, label: "Existing Collections", count: Object.keys(COLLECTIONS).length },
    { id: "builder" as const, label: "Smart Collections", count: smartCollections.length },
    { id: "templates" as const, label: "Templates", count: TEMPLATES.length },
  ];

  return (
    <>
      <Seo title="Collection Builder" path="/admin/collection-builder" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Collection Builder</h1>
            <p className="mt-1 text-sm text-muted">Create, manage, and preview dynamic product collections.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_COLLECTION, id: "" })} className="btn-primary btn-md">
            <Plus className="h-4 w-4" /> New smart collection
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-line pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors", activeTab === t.id ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2")}
            >
              {t.label}
              <span className="rounded-full bg-surface2 px-1.5 py-0.5 text-xs">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Existing Collections */}
        {activeTab === "existing" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(COLLECTIONS).map(([key, def]) => {
              const count = def.filter(products).length;
              return (
                <Link key={key} to={`/collections/${def.id}`} className="card group p-4 transition-all hover:border-accent">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">{def.eyebrow}</span>
                      <h3 className="mt-1 font-semibold text-ink">{def.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{def.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface2 px-2.5 py-1 text-xs font-medium text-muted">{count} items</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Smart Collections Builder */}
        {activeTab === "builder" && (
          <div className="mt-6">
            {smartCollections.length === 0 ? (
              <EmptyState icon={<Layers className="h-6 w-6" />} title="No smart collections yet" description="Create dynamic collections with filter rules that auto-update as your catalogue grows." action={<button onClick={() => setEditing({ ...EMPTY_COLLECTION, id: "" })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Create your first collection</button>} />
            ) : (
              <div className="space-y-3">
                {smartCollections.map((sc) => {
                  const count = applyFilter(sc).length;
                  return (
                    <div key={sc.id} className="card flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink">{sc.name}</h3>
                          {sc.isActive ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted" />}
                        </div>
                        <p className="text-sm text-muted">{sc.description || "No description"}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sc.categories.map((c) => <span key={c} className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6rem] font-medium text-accent">{c}</span>)}
                          {sc.onlyFeatured && <Badge variant="info">Featured only</Badge>}
                          {sc.onlyOnSale && <Badge variant="sale">On sale</Badge>}
                          {sc.onlyBestSeller && <Badge variant="bestseller">Best Sellers</Badge>}
                          <span className="rounded-full bg-surface2 px-2 py-0.5 text-[0.6rem] text-muted">{count} products</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1 ml-4">
                        <button onClick={() => setEditing({ ...sc })} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => duplicateCollection(sc)} aria-label="Duplicate" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => setToDelete(sc.id)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Templates */}
        {activeTab === "templates" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setEditing({ ...EMPTY_COLLECTION, id: "", name: tpl.name, description: tpl.description, template: tpl.id })}
                  className="card group p-4 text-left transition-all hover:border-accent"
                >
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-2 font-semibold text-ink group-hover:text-accent">{tpl.name}</h3>
                  <p className="mt-1 text-sm text-muted">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Collection Editor Dialog */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Collection editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <div className="card relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit collection" : "New smart collection"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label-field">Collection name</label><input className="input-field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Summer Essentials" /></div>
                <div><label className="label-field">Sort by</label><select className="input-field" value={editing.sortBy} onChange={(e) => setEditing({ ...editing, sortBy: e.target.value })}>{["popularity", "rating", "date", "price-asc", "price-desc", "discount"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="label-field">Description</label><textarea className="input-field resize-none" rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Describe this collection..." /></div>

              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Filter rules</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-field">Categories</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {categories.map((c) => (
                        <button key={c.id} onClick={() => setEditing({ ...editing, categories: editing.categories.includes(c.id) ? editing.categories.filter((x) => x !== c.id) : [...editing.categories, c.id] })} className={cn("chip", editing.categories.includes(c.id) && "chip-active")}>{c.name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-field">Max products</label>
                    <input type="number" min={1} max={100} className="input-field" value={editing.limit} onChange={(e) => setEditing({ ...editing, limit: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label-field">Min price</label>
                    <input type="number" min={0} className="input-field" value={editing.minPrice} onChange={(e) => setEditing({ ...editing, minPrice: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label-field">Max price</label>
                    <input type="number" min={0} className="input-field" value={editing.maxPrice} onChange={(e) => setEditing({ ...editing, maxPrice: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label-field">Min rating</label>
                    <select className="input-field" value={editing.minRating} onChange={(e) => setEditing({ ...editing, minRating: Number(e.target.value) })}>
                      {[0, 3, 3.5, 4, 4.5].map((r) => <option key={r} value={r}>{r === 0 ? "Any" : `${r}+`}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface2 transition-colors">
                    <input type="checkbox" checked={editing.onlyOnSale} onChange={(e) => setEditing({ ...editing, onlyOnSale: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    On sale only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface2 transition-colors">
                    <input type="checkbox" checked={editing.onlyFeatured} onChange={(e) => setEditing({ ...editing, onlyFeatured: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    Featured only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface2 transition-colors">
                    <input type="checkbox" checked={editing.onlyBestSeller} onChange={(e) => setEditing({ ...editing, onlyBestSeller: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    Best Sellers only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface2 transition-colors">
                    <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    Active
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-line pt-4">
                <button type="button" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-sm font-medium text-accent mb-3">
                  <Eye className="h-4 w-4" /> {showPreview ? "Hide preview" : `Preview (${previewItems.length} products)`}
                </button>
                {showPreview && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {previewItems.slice(0, 4).map((p) => (
                      <Link key={p.id} to={`/product/${p.slug}`} className="group rounded-xl border border-line p-2 transition-colors hover:border-accent">
                        <img src={p.images[0]} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover" />
                        <p className="mt-1 truncate text-xs font-medium text-ink">{p.name}</p>
                        <span className="text-xs text-muted">${p.salePrice ?? p.price}</span>
                      </Link>
                    ))}
                    {previewItems.length === 0 && <p className="col-span-full text-sm text-muted py-8 text-center">No products match these filters.</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="button" onClick={saveCollection} className="btn-primary btn-md">{editing.id ? "Save" : "Create collection"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete collection?" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => toDelete && deleteCollection(toDelete)} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button></>}>
        This will remove the smart collection permanently. Products are not affected.
      </Dialog>
    </>
  );
}
