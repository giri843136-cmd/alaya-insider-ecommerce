import { useMemo, useState } from "react";
import { Search, Tags, Package, Star, Hash, Filter } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { buildTaxonomy, getCategoryAnalytics } from "../../lib/navigationPlatform";
import { cn } from "@/utils/cn";
import { formatNumber } from "../../lib/utils";

export default function AdminTaxonomy() {
  const { products, categories } = useStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const taxonomy = useMemo(() => buildTaxonomy(categories, products), [categories, products]);
  const analytics = useMemo(() => getCategoryAnalytics(categories, products), [categories, products]);

  const filtered = useMemo(() => {
    if (!search) return taxonomy;
    const q = search.toLowerCase();
    return taxonomy.filter(
      (n) => n.label.toLowerCase().includes(q) || n.children?.some((c) => c.label.toLowerCase().includes(q))
    );
  }, [taxonomy, search]);

  const selectedNode = taxonomy.find((n) => n.id === selectedCategory);
  const selectedAnalytics = analytics.find((a) => a.id === selectedCategory);

  return (
    <>
      <Seo title="Taxonomy" path="/admin/taxonomy" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Taxonomy</h1>
            <p className="mt-1 text-sm text-muted">Browse and manage your category architecture, topics, and tags.</p>
          </div>
        </div>

        {/* Overview stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Categories", value: taxonomy.length, icon: Tags },
            { label: "Sub-topics", value: taxonomy.reduce((s, n) => s + (n.children?.length || 0), 0), icon: Hash },
            { label: "Total products", value: formatNumber(products.length), icon: Package },
            { label: "Avg rating", value: (products.reduce((s, p) => s + (Number(p.rating) || 0), 0) / Math.max(1, products.length)).toFixed(1), icon: Star },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Taxonomy tree */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories and topics…"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filtered.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedCategory(node.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    selectedCategory === node.id
                      ? "border-accent bg-accent-soft/30"
                      : "border-line bg-surface hover:border-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {node.image && (
                        <img src={node.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <span className="font-medium text-ink">{node.label}</span>
                        <span className="block text-xs text-muted">{node.productCount} products</span>
                      </div>
                    </div>
                    <Tags className="h-4 w-4 text-muted" />
                  </div>
                  {node.children && node.children.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {node.children.map((child) => (
                        <span
                          key={child.id}
                          className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-muted"
                        >
                          {child.label} ({child.productCount})
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted">No matching categories found.</div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {selectedNode && selectedAnalytics ? (
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  {selectedNode.image && (
                    <img src={selectedNode.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  )}
                  <div>
                    <h3 className="font-semibold text-ink">{selectedNode.label}</h3>
                    <p className="text-xs text-muted">{selectedNode.productCount} products</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Products</span>
                    <span className="font-semibold text-ink">{selectedAnalytics.productCount}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Avg price</span>
                    <span className="font-semibold text-ink">${selectedAnalytics.avgPrice}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Avg rating</span>
                    <span className="font-semibold text-ink">{selectedAnalytics.avgRating}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Best sellers</span>
                    <span className="font-semibold text-ink">{selectedAnalytics.bestSellers}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-medium text-muted">Featured</span>
                    <span className="font-semibold text-ink">{selectedAnalytics.featured}</span>
                  </div>
                </div>

                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Sub-topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.children.map((child) => (
                        <span key={child.id} className="rounded-full bg-surface2 px-2.5 py-1 text-xs text-ink">
                          {child.label} ({child.productCount})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center p-8 text-center">
                <Filter className="h-8 w-8 text-muted" />
                <p className="mt-3 text-sm text-muted">Select a category to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
