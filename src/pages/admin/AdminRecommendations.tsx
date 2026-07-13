import { useMemo, useState } from "react";
import { Sparkles, TrendingUp, Package, Zap, Eye } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import {
  getAllRecommendations,
  getRecommendationStats,
  trendingProducts,
  editorialPicks,
  type RecommendationContext,
} from "../../lib/recommendations";
import { cn } from "@/utils/cn";
import { formatCompact } from "../../lib/utils";
import { Link } from "react-router-dom";

export default function AdminRecommendations() {
  const { products } = useStore();
  const [activeStrategy, setActiveStrategy] = useState<string>("personalized");

  const stats = useMemo(() => getRecommendationStats(), []);

  const context: RecommendationContext = useMemo(
    () => ({
      viewedProducts: products.slice(0, 3).map((p) => p.id),
      wishlistProducts: products.slice(1, 4).map((p) => p.id),
      cartProducts: [],
      preferredCategories: ["jewelry", "fashion"],
      preferredBrands: [],
      tags: ["luxury", "gold"],
    }),
    [products]
  );

  const recommendations = useMemo(
    () => getAllRecommendations(products, context),
    [products, context]
  );

  const trending = useMemo(() => trendingProducts(products, 10), [products]);
  const editorial = useMemo(() => editorialPicks(products, 10), [products]);

  const activeRec = recommendations.find((r) => r.type === activeStrategy);

  return (
    <>
      <Seo title="Recommendations" path="/admin/recommendations" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Recommendation Engine</h1>
            <p className="mt-1 text-sm text-muted">AI-powered product recommendations, trending detection, and editorial curation.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Strategies", value: stats.totalTypes, icon: Zap },
            { label: "Trending products", value: trending.length, icon: TrendingUp },
            { label: "Editorial picks", value: editorial.length, icon: Eye },
            { label: "Catalogue size", value: formatCompact(products.length), icon: Package },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Strategy tabs */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => setActiveStrategy(rec.type)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeStrategy === rec.type
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface2"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {rec.label}
                <span className="text-xs text-muted">({rec.products.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active recommendation */}
        {activeRec && (
          <div className="card mt-6 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">{activeRec.label}</h3>
                <p className="text-sm text-muted">{activeRec.description}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted">
                Confidence: <span className="font-semibold text-accent">{Math.round(activeRec.confidence * 100)}%</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {activeRec.products.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  className="group rounded-xl border border-line p-2 transition-colors hover:border-accent"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-lg object-cover"
                  />
                  <div className="mt-2 px-1">
                    <p className="line-clamp-1 text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-muted">${p.salePrice ?? p.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Strategy list */}
        <div className="card mt-8 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Zap className="h-4 w-4 text-accent" /> Available Strategies
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.strategies.map((s) => (
              <div
                key={s}
                className="flex items-center gap-3 rounded-xl border border-line p-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-sm font-medium text-ink">
                    {s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </span>
                  <span className="block text-xs text-muted">{s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
