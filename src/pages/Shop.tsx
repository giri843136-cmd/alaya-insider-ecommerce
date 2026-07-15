import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search, PackageSearch, Check, LayoutGrid, List, Star, Heart } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useCommerce } from "../context/CommerceContext";
import { Seo } from "../components/Seo";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { Breadcrumbs, Price } from "../components/ui";
import { useLockBody } from "../lib/hooks";
import { cn } from "@/utils/cn";
import type { Product } from "../lib/types";
import { flags } from "../lib/featureFlags";

type PriceBucket = "all" | "under50" | "50to150" | "over150";
type TypeFilter = "all" | "physical" | "digital" | "variable" | "affiliate";

const PRICE_BUCKETS: { id: PriceBucket; label: string }[] = [
  { id: "all", label: "Any price" },
  { id: "under50", label: "Under $50" },
  { id: "50to150", label: "$50 – $150" },
  { id: "over150", label: "$150+" },
];

type ViewMode = "grid" | "list";

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest arrivals" },
  { id: "old", label: "Oldest" },
  { id: "popular", label: "Most popular" },
  { id: "rated", label: "Highest rated" },
  { id: "reviewed", label: "Most reviewed" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "alpha", label: "Alphabetical (A–Z)" },
  { id: "discount", label: "Biggest discount" },
  { id: "sale", label: "On sale first" },
];

const effectivePrice = (p: { price: number; salePrice?: number | null }) => p.salePrice ?? p.price;
const discountRate = (p: { price: number; salePrice?: number | null }) =>
  p.salePrice && p.salePrice < p.price ? (p.price - p.salePrice) / p.price : 0;

export default function Shop() {
  const { products, categories, brands, settings } = useStore();
  const { wishlist } = useCommerce();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") || "";
  const category = params.get("category") || "all";
  const brand = params.get("brand") || "all";
  const sort = params.get("sort") || "featured";

  const [price, setPrice] = useState<PriceBucket>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [visible, setVisible] = useState(9);
  const SHOP_PAGE = 9;
  const [view, setView] = useState<ViewMode>(() => {
    try { return (localStorage.getItem("alaya_shop_view") as ViewMode) || "grid"; } catch { return "grid"; }
  });
  const setViewMode = (v: ViewMode) => {
    setView(v);
    try { localStorage.setItem("alaya_shop_view", v); } catch { /* ignore */ }
  };

  useLockBody(mobileFilters);

  useEffect(() => {
    setLoading(true);
    setVisible(SHOP_PAGE);
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, [q, category, brand, sort, price, type, onSale, minRating, inStockOnly]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const activeCategory = categories.find((c) => c.id === category);

  const filtered = useMemo(() => {
    let list = products.slice();
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (brand !== "all") list = list.filter((p) => p.brandId === brand);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.brand || "").toLowerCase().includes(needle) ||
          p.tags.some((t) => t.toLowerCase().includes(needle))
      );
    }
    if (type !== "all") {
      list = type === "affiliate" ? list.filter((p) => p.affiliate) : list.filter((p) => p.type === type && !p.affiliate);
    }
    if (onSale) list = list.filter((p) => p.salePrice && p.salePrice < p.price);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    if (inStockOnly) list = list.filter((p) => p.affiliate || p.stock > 0);
    if (price !== "all") {
      list = list.filter((p) => {
        const pr = effectivePrice(p);
        if (price === "under50") return pr < 50;
        if (price === "50to150") return pr >= 50 && pr <= 150;
        return pr > 150;
      });
    }
    switch (sort) {
      case "new":
        list.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "old":
        list.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "popular":
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "rated":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "reviewed":
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "price-asc":
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price-desc":
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "alpha":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "discount":
        list.sort((a, b) => discountRate(b) - discountRate(a));
        break;
      case "sale":
        list.sort((a, b) => (b.salePrice ? 1 : 0) - (a.salePrice ? 1 : 0));
        break;
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [products, category, brand, q, type, onSale, minRating, inStockOnly, price, sort]);

  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: activeCategory ? activeCategory.name : "Shop All",
      description: activeCategory ? activeCategory.description : settings.seo.description,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
          { "@type": "ListItem", position: 2, name: activeCategory ? activeCategory.name : "Shop" },
        ],
      },
    }),
    [activeCategory, settings.seo.description]
  );

  const clearAll = () => {
    setParams({}, { replace: true });
    setPrice("all");
    setType("all");
    setOnSale(false);
    setMinRating(0);
    setInStockOnly(false);
  };

  const hasActiveFilters = category !== "all" || brand !== "all" || !!q || price !== "all" || type !== "all" || onSale || minRating > 0 || inStockOnly;

  return (
    <>
      <Seo
        title={activeCategory ? activeCategory.name : "Shop All"}
        description={activeCategory ? activeCategory.description : "Shop the full ALAYA INSIDER edit."}
        path="/shop"
        schema={schema}
      />

      {/* Header */}
      <section className="border-b border-line bg-surface2/40">
        <div className="container-edge py-10">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Shop" }, ...(activeCategory ? [{ label: activeCategory.name }] : [])]} />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow mb-2">{activeCategory ? activeCategory.tagline : "The complete edit"}</span>
              <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
                {activeCategory ? activeCategory.name : "Shop all"}
              </h1>
            </div>
            <p className="text-sm text-muted">
              {loading ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
              {wishlist.length > 0 && ` · ${wishlist.length} saved`}
            </p>
          </div>
        </div>
      </section>

      <section className="container-edge py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Desktop filters */}
          <aside className="hidden lg:block">
            <FilterPanel
              categories={categories}
              category={category}
              setCategory={(v) => setParam("category", v)}
              brands={brands}
              brand={brand}
              setBrand={(v) => setParam("brand", v)}
              price={price}
              setPrice={setPrice}
              type={type}
              setType={setType}
              onSale={onSale}
              setOnSale={setOnSale}
              minRating={minRating}
              setMinRating={setMinRating}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              onClear={clearAll}
              hasActive={hasActiveFilters}
            />
          </aside>

          <div>
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between gap-3">
              <button onClick={() => setMobileFilters(true)} className="btn-outline btn-sm lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative hidden flex-1 sm:block lg:max-w-xs"
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setParam("q", e.target.value)}
                  placeholder="Search this edit…"
                  aria-label="Search products"
                  className="input-field pl-9"
                />
              </form>
              <div className="ml-auto flex items-center gap-2">
                {/* View toggle */}
                <div className="hidden items-center rounded-lg border border-line p-0.5 sm:flex" role="group" aria-label="View mode">
                  <button onClick={() => setViewMode("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={cn("grid h-8 w-8 place-items-center rounded-md transition-colors", view === "grid" ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} aria-pressed={view === "list"} aria-label="List view" className={cn("grid h-8 w-8 place-items-center rounded-md transition-colors", view === "list" ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <label className="text-xs text-muted" htmlFor="sort">
                  Sort
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setParam("sort", e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-accent focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <NoResults onClear={clearAll} hasFilters={hasActiveFilters} products={products} />
            ) : view === "list" ? (
              <>
                <div className="space-y-4">
                  {filtered.slice(0, visible).map((p) => (
                    <ProductListRow key={p.id} product={p} />
                  ))}
                </div>
                {filtered.length > visible && (
                  <div className="mt-12 flex flex-col items-center gap-2">
                    <button onClick={() => setVisible((v) => v + SHOP_PAGE)} className="btn-outline btn-md">
                      Load more ({filtered.length - visible})
                    </button>
                    <p className="text-xs text-muted">Showing {visible} of {filtered.length}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
                  {filtered.slice(0, visible).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {filtered.length > visible && (
                  <div className="mt-12 flex flex-col items-center gap-2">
                    <button onClick={() => setVisible((v) => v + SHOP_PAGE)} className="btn-outline btn-md">
                      Load more ({filtered.length - visible})
                    </button>
                    <p className="text-xs text-muted">Showing {visible} of {filtered.length}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filter sheet */}
      {mobileFilters && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileFilters(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-canvas animate-drawer" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileFilters(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="hide-scrollbar flex-1 overflow-y-auto p-5">
              <FilterPanel
                categories={categories}
                category={category}
                setCategory={(v) => setParam("category", v)}
                brands={brands}
                brand={brand}
                setBrand={(v) => setParam("brand", v)}
                price={price}
                setPrice={setPrice}
                type={type}
                setType={setType}
                onSale={onSale}
                setOnSale={setOnSale}
                minRating={minRating}
                setMinRating={setMinRating}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                onClear={clearAll}
                hasActive={hasActiveFilters}
              />
            </div>
            <div className="border-t border-line p-4">
              <button onClick={() => setMobileFilters(false)} className="btn-primary btn-md w-full">
                Show {filtered.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterPanel({
  categories,
  category,
  setCategory,
  brands,
  brand,
  setBrand,
  price,
  setPrice,
  type,
  setType,
  onSale,
  setOnSale,
  minRating,
  setMinRating,
  inStockOnly,
  setInStockOnly,
  onClear,
  hasActive,
}: {
  categories: { id: string; name: string }[];
  category: string;
  setCategory: (v: string) => void;
  brands: { id: string; name: string }[];
  brand: string;
  setBrand: (v: string) => void;
  price: PriceBucket;
  setPrice: (v: PriceBucket) => void;
  type: TypeFilter;
  setType: (v: TypeFilter) => void;
  onSale: boolean;
  setOnSale: (v: boolean) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  onClear: () => void;
  hasActive: boolean;
}) {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">Filters</h3>
        {hasActive && (
          <button onClick={onClear} className="text-xs font-medium text-accent hover:underline">
            Clear all
          </button>
        )}
      </div>

      <FilterGroup title="Category">
        <FilterOption active={category === "all"} onClick={() => setCategory("all")}>
          All categories
        </FilterOption>
        {categories.map((c) => (
          <FilterOption key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name}
          </FilterOption>
        ))}
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          <FilterOption active={brand === "all"} onClick={() => setBrand("all")}>
            All brands
          </FilterOption>
          {brands.map((b) => (
            <FilterOption key={b.id} active={brand === b.id} onClick={() => setBrand(b.id)}>
              {b.name}
            </FilterOption>
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Product type">
        {(["all", "physical", "variable", "digital", "affiliate"] as TypeFilter[]).map((t) => (
          <FilterOption key={t} active={type === t} onClick={() => setType(t)}>
            {t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}
          </FilterOption>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_BUCKETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setPrice(b.id)}
              className={cn("chip", price === b.id && "chip-active")}
            >
              {b.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Offers & availability">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setOnSale(!onSale)} className={cn("chip", onSale && "chip-active")}>
            {onSale && <Check className="h-3 w-3" />} On sale
          </button>
          <button onClick={() => setInStockOnly(!inStockOnly)} className={cn("chip", inStockOnly && "chip-active")}>
            {inStockOnly && <Check className="h-3 w-3" />} In stock
          </button>
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button key={r} onClick={() => setMinRating(r)} className={cn("chip", minRating === r && "chip-active")}>
              {r === 0 ? "Any" : `${r}★ & up`}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface2 hover:text-ink"
      )}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Horizontal list-view row. */
function ProductListRow({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, inWishlist } = useCommerce();
  const saved = inWishlist(product.id);
  const soldOut = product.stock <= 0 && !product.affiliate;
  return (
    <article className="group grid gap-4 rounded-[var(--radius-xl2)] border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)] sm:grid-cols-[140px_1fr_auto] sm:items-center">
      <Link to={`/product/${product.slug}`} className="block overflow-hidden rounded-xl bg-surface2">
        <img src={product.images[0]} alt={product.name} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:aspect-[4/5]" />
      </Link>
      <div className="min-w-0">
        {product.brand && <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{product.brand}</span>}
        <h3 className="mt-0.5 font-medium leading-snug text-ink">
          <Link to={`/product/${product.slug}`} className="link-line">{product.name}</Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" strokeWidth={0} /> {(product.rating ?? 0).toFixed(1)} ({product.reviewCount})</span>
          {!product.affiliate && (soldOut ? <span className="text-danger">Sold out</span> : product.stock <= 8 ? <span className="text-amber-600 dark:text-amber-400">Only {product.stock} left</span> : <span className="text-success">In stock</span>)}
        </div>
      </div>
      <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
        <Price price={product.price} salePrice={product.salePrice} priceClassName="text-lg" />
        <div className="flex gap-2">
          {product.affiliate || !flags.ENABLE_ECOMMERCE ? (
            <a href={product.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className="btn-dark btn-sm">See best price</a>
          ) : (
            <button disabled={soldOut} onClick={() => addToCart(product.id, "", "", 1, true)} className="btn-primary btn-sm">{soldOut ? "Sold out" : "Add to bag"}</button>
          )}
          <button onClick={() => toggleWishlist(product.id)} aria-pressed={saved} className={cn("grid h-8 w-8 place-items-center rounded-full border border-line", saved ? "border-accent text-accent" : "text-ink")}><Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} /></button>
        </div>
      </div>
    </article>
  );
}

/** Premium no-results experience: never an empty page. */
function NoResults({ onClear, hasFilters, products }: { onClear: () => void; hasFilters: boolean; products: Product[] }) {
  const suggestions = useMemo(() => [...products].sort(() => 0.5).slice(0, 4), [products]);
  return (
    <div>
      <div className="rounded-[var(--radius-xl2)] border border-dashed border-line bg-surface2/50 px-6 py-12 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-muted" />
        <h3 className="mt-4 text-lg font-semibold text-ink">No products match</h3>
        <p className="mt-1.5 max-w-sm mx-auto text-sm text-muted">Try adjusting your filters, clearing them, or browsing a popular category below.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {hasFilters && <button onClick={onClear} className="btn-primary btn-sm">Clear filters</button>}
          <Link to="/collections/bestsellers" className="btn-outline btn-sm">Best sellers</Link>
          <Link to="/collections/new" className="btn-outline btn-sm">New arrivals</Link>
        </div>
      </div>
      <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">You might like these instead</p>
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {suggestions.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
