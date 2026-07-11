/**
 * ALAYA INSIDER — Lookbook & Mood Board Experience
 * -------------------------------------------------
 * Immersive visual browsing components: editorial lookbooks, mood boards,
 * shop-the-look, room inspiration, and lifestyle galleries.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Share2,
  Plus,
  Grid3X3,
  LayoutGrid,
  Maximize2,
} from "lucide-react";
import type { Product, Article } from "../lib/types";
import { cn } from "@/utils/cn";
import { wide } from "../lib/utils";
import { Reveal } from "./Reveal";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface LookbookItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  products: { id: string; slug: string; name: string; price: number; salePrice?: number | null; image: string }[];
  tag?: string;
}

interface MoodBoardTile {
  id: string;
  image: string;
  aspectRatio: "portrait" | "landscape" | "square";
  title?: string;
  productSlug?: string;
}

/* ------------------------------------------------------------------ */
/*  Editorial Lookbook — grid of curated visual stories               */
/* ------------------------------------------------------------------ */

interface LookbookProps {
  items: LookbookItem[];
  title?: string;
  subtitle?: string;
}

const LOOKBOOK_IMAGES = [
  { id: 8502484, aspect: "landscape" as const },
  { id: 3765538, aspect: "portrait" as const },
  { id: 11826093, aspect: "landscape" as const },
  { id: 30541170, aspect: "portrait" as const },
  { id: 6538441, aspect: "square" as const },
  { id: 14940718, aspect: "landscape" as const },
  { id: 8049841, aspect: "portrait" as const },
  { id: 9430468, aspect: "square" as const },
  { id: 36701535, aspect: "landscape" as const },
];

function buildLookbookFromProducts(products: Product[]): LookbookItem[] {
  const groups = [
    { title: "The Modernist Edit", subtitle: "Clean lines. Bold forms.", tag: "modern", startIdx: 0 },
    { title: "Artisanal Craft", subtitle: "Handmade with intention.", tag: "handmade", startIdx: 3 },
    { title: "Soft Minimalism", subtitle: "Quiet luxury for everyday.", tag: "minimal", startIdx: 6 },
  ];
  return groups.map((g, gi) => {
    const groupProducts = products.slice(g.startIdx, g.startIdx + 4);
    const img = LOOKBOOK_IMAGES[gi % LOOKBOOK_IMAGES.length];
    return {
      id: `lookbook-${gi}`,
      image: wide(img.id, 800, img.aspect === "portrait" ? 1000 : 700),
      title: g.title,
      subtitle: g.subtitle,
      tag: g.tag,
      products: groupProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        salePrice: p.salePrice,
        image: p.images[0],
      })),
    };
  });
}

export function Lookbook({ items, title = "The Lookbook", subtitle }: LookbookProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const toggleWishlist = (id: string) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="overflow-hidden py-20">
      <div className="container-edge">
        <Reveal>
          <div className="mb-12">
            <span className="eyebrow mb-3">Visual Stories</span>
            <h2 className="text-display-m text-ink">{title}</h2>
            {subtitle && <p className="mt-3 max-w-md text-muted">{subtitle}</p>}
          </div>
        </Reveal>
      </div>

      <div className="container-edge">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 60}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-[var(--radius-xl2)] bg-surface2 transition-all duration-500",
                  activeIndex === i ? "ring-2 ring-accent ring-offset-2 ring-offset-canvas" : ""
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {/* Hero image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Tag badge */}
                  {item.tag && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {item.tag}
                    </span>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                    {item.subtitle && (
                      <p className="mt-1 text-sm text-white/70">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Shopable products row */}
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Shop the look
                    </span>
                    <button
                      onClick={() => toggleWishlist(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"
                      aria-label="Toggle wishlist"
                    >
                      {wishlisted.has(item.id) ? (
                        <Heart className="h-4 w-4 fill-danger text-danger" />
                      ) : (
                        <Heart className="h-4 w-4 text-muted" />
                      )}
                    </button>
                  </div>
                  <div className="flex -space-x-2">
                    {item.products.slice(0, 4).map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-canvas transition-transform hover:scale-110 hover:-translate-y-1"
                        title={p.name}
                      >
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      </Link>
                    ))}
                    {item.products.length > 4 && (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-canvas bg-surface2 text-xs font-medium text-muted">
                        +{item.products.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Mood Board — Pinterest-style masonry grid of inspiration          */
/* ------------------------------------------------------------------ */

interface MoodBoardViewProps {
  products: Product[];
  articles?: Article[];
  title?: string;
}

export function MoodBoardView({ products, articles = [], title = "Inspiration Board" }: MoodBoardViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
  const tiles: MoodBoardTile[] = useMemo(() => {
    const result: MoodBoardTile[] = [];
    const imgPool = LOOKBOOK_IMAGES;

    // Product tiles
    products.slice(0, 12).forEach((p, i) => {
      const img = imgPool[i % imgPool.length];
      result.push({
        id: `tile-prod-${p.id}`,
        image: p.images[0] || wide(img.id, 600, img.aspect === "portrait" ? 800 : 500),
        aspectRatio: img.aspect,
        title: p.name,
        productSlug: p.slug,
      });
    });

    // Article tiles
    articles.slice(0, 4).forEach((a, i) => {
      const img = imgPool[(i + 5) % imgPool.length];
      result.push({
        id: `tile-art-${a.id}`,
        image: a.cover || wide(img.id, 600, 500),
        aspectRatio: i % 2 === 0 ? "landscape" : "square",
        title: a.title,
      });
    });

    return result;
  }, [products, articles]);

  if (tiles.length === 0) return null;

  return (
    <section className="py-20">
      <div className="container-edge">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="eyebrow mb-3">Mood Board</span>
              <h2 className="text-display-m text-ink">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("grid h-9 w-9 place-items-center rounded-lg transition-colors", viewMode === "grid" ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2")}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("masonry")}
                className={cn("grid h-9 w-9 place-items-center rounded-lg transition-colors", viewMode === "masonry" ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2")}
                aria-label="Masonry view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              : "columns-2 gap-4 sm:columns-3 lg:columns-4"
          )}
        >
          {tiles.map((tile, i) => (
            <Reveal key={tile.id} delay={(i % 8) * 40}>
              <div
                className={cn(
                  "group relative mb-4 overflow-hidden rounded-2xl bg-surface2 transition-all duration-500 hover:shadow-lg",
                  viewMode === "grid" && "aspect-[4/5]"
                )}
              >
                <img
                  src={tile.image}
                  alt={tile.title || ""}
                  loading="lazy"
                  className={cn(
                    "h-full w-full object-cover transition-all duration-700 group-hover:scale-105",
                    viewMode !== "grid" && (tile.aspectRatio === "portrait" ? "aspect-[3/4]" : tile.aspectRatio === "landscape" ? "aspect-[4/3]" : "aspect-square")
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {tile.title && (
                      <p className="text-sm font-medium text-white line-clamp-2">{tile.title}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      {tile.productSlug ? (
                        <Link
                          to={`/product/${tile.productSlug}`}
                          className="btn btn-sm bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                        >
                          <Maximize2 className="h-3 w-3" /> View
                        </Link>
                      ) : (
                        <button className="btn btn-sm bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
                          <Share2 className="h-3 w-3" /> Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Lookbook Builder — auto-generate from catalogue                   */
/* ------------------------------------------------------------------ */

interface LookbookBuilderProps {
  products: Product[];
  title?: string;
}

export function LookbookBuilder({ products, title }: LookbookBuilderProps) {
  const items = useMemo(() => buildLookbookFromProducts(products), [products]);

  if (items.length === 0) return null;

  return <Lookbook items={items} title={title || "The Lookbook"} subtitle="Curated visual stories — shop the looks you love." />;
}

/* ------------------------------------------------------------------ */
/*  Shop The Look — inline component for product detail               */
/* ------------------------------------------------------------------ */

interface ShopTheLookProps {
  products: Product[];
  seedProduct?: Product;
}

export function ShopTheLook({ products }: ShopTheLookProps) {
  const looks = useMemo(() => buildLookbookFromProducts(products).slice(0, 2), [products]);

  if (looks.length === 0) return null;

  return (
    <section className="border-t border-line py-12">
      <Reveal>
        <span className="eyebrow mb-3">Styled with</span>
        <h3 className="font-display text-2xl font-semibold text-ink">Shop The Look</h3>
        <p className="mt-2 text-muted">Complete the ensemble with these curated pieces.</p>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {looks.map((look, i) => (
          <Reveal key={look.id} delay={i * 60}>
            <div className="group relative overflow-hidden rounded-2xl bg-surface2">
              <div className="grid grid-cols-[1fr_1fr]">
                <div className="overflow-hidden">
                  <img
                    src={look.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center p-4 sm:p-6">
                  <h4 className="font-display text-lg font-semibold text-ink">{look.title}</h4>
                  <div className="mt-3 space-y-2">
                    {look.products.slice(0, 3).map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface2"
                      >
                        <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                          <span className="text-xs text-muted">
                            ${p.salePrice ?? p.price}
                          </span>
                        </span>
                        <Plus className="h-4 w-4 text-muted shrink-0" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    to={`/shop?tags=${look.tag}`}
                    className="btn-outline btn-sm mt-4 self-start"
                  >
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
