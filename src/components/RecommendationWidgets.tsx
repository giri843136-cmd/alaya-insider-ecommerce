/**
 * ALAYA INSIDER — Product Recommendation Widgets (Part 3.4)
 * -----------------------------------------------------------
 * Premium recommendation widgets for storefront integration.
 * Each widget showcases products with editorial copy, confidence badges, and rich interactions.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Gem, Wallet, Eye, ShoppingBag } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";
import { HorizontalScroller } from "./HorizontalScroller";
import { SectionHeading, Badge, Price, Stars } from "./ui";
import {
  similarProducts,
  styleMatchProducts,
  completeTheLook,
  luxuryAlternatives,
  budgetAlternatives,
  frequentlyViewedTogether,
} from "../lib/recommendations";
import type { Product } from "../lib/types";

/* ------------------------------------------------------------------ */
/*  You May Also Like                                                  */
/* ------------------------------------------------------------------ */

export function YouMayAlsoLike({ product, limit = 4 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => similarProducts(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-display text-2xl font-semibold text-ink">You may also like</h2>
        </div>
        <Link to="/shop" className="link-line text-sm font-medium text-accent">Shop all</Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Style Match — aesthetic similarity                                 */
/* ------------------------------------------------------------------ */

export function StyleMatch({ product, limit = 4 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => styleMatchProducts(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <SectionHeading
        eyebrow="Style match"
        title="Aesthetic companions"
        subtitle="Pieces that share this product's design language and mood."
      />
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Complete The Look — outfit/collection builder                      */
/* ------------------------------------------------------------------ */

export function CompleteTheLook({ product, limit = 4 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => completeTheLook(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <Reveal>
        <div className="rounded-[var(--radius-xl2)] border border-line bg-gradient-to-br from-accent-soft/20 to-surface2/20 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
              <Gem className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Complete the look</h2>
              <p className="text-sm text-muted">Pair {product.name} with these complementary pieces.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-2 pr-4 transition-all hover:border-accent hover:shadow-[var(--shadow-card)]"
              >
                <img src={p.images[0]} alt={p.name} className="h-16 w-14 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                  <Price price={p.price} salePrice={p.salePrice} />
                  <div className="flex items-center gap-1 mt-0.5">
                    <Stars rating={p.rating} size={10} />
                    <span className="text-[0.6rem] text-muted">({p.reviewCount})</span>
                  </div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Luxury Alternatives — higher price tier picks                      */
/* ------------------------------------------------------------------ */

export function LuxuryAlternatives({ product, limit = 3 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => luxuryAlternatives(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <Reveal>
        <div className="rounded-[var(--radius-xl2)] border border-line bg-ink p-6 text-canvas sm:p-8">
          <div className="absolute inset-0 bg-luxe opacity-30 rounded-[var(--radius-xl2)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-amber-400" />
              <span className="badge bg-amber-500/20 text-amber-300">Premium alternative</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold">Luxury alternatives</h2>
            <p className="mt-1 max-w-md text-canvas/70">Investment-worthy pieces at a higher price tier — for when only the finest will do.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {items.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  className="group rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <img src={p.images[0]} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover" />
                  <div className="mt-2">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <Price price={p.price} salePrice={p.salePrice} priceClassName="text-canvas" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Budget Alternatives — more affordable picks                        */
/* ------------------------------------------------------------------ */

export function BudgetAlternatives({ product, limit = 3 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => budgetAlternatives(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <Reveal>
        <div className="rounded-[var(--radius-xl2)] border border-line bg-success/5 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-success" />
            <span className="badge bg-success/15 text-success">Great value</span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">Budget-friendly alternatives</h2>
          <p className="mt-1 max-w-md text-muted">Beautiful pieces at a more accessible price point — same style, less spend.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                className="group rounded-xl border border-line bg-surface p-3 transition-all hover:border-accent hover:shadow-[var(--shadow-card)]"
              >
                <img src={p.images[0]} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover" />
                <div className="mt-2">
                  <div className="flex items-center gap-1">
                    {p.salePrice && p.salePrice < p.price && (
                      <Badge variant="sale">Sale</Badge>
                    )}
                    {p.bestSeller && <Badge variant="bestseller">Best Seller</Badge>}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-ink">{p.name}</p>
                  <Price price={p.price} salePrice={p.salePrice} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Frequently Viewed Together — browsing pattern widget               */
/* ------------------------------------------------------------------ */

export function FrequentlyViewedTogetherWidget({ product, limit = 4 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => frequentlyViewedTogether(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <Reveal>
        <div className="flex items-center gap-2 mb-6">
          <Eye className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold text-ink">Frequently viewed together</h2>
        </div>
        <HorizontalScroller>
          {items.map((p) => (
            <div key={p.id} className="w-64 shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </HorizontalScroller>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Recommendation Strip — compact horizontal scroller                 */
/* ------------------------------------------------------------------ */

export function RecommendationStrip({
  title,
  products: items,
}: {
  title: string;
  products: Product[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="container-edge mt-16">
      <Reveal>
        <SectionHeading
          eyebrow="Curated for you"
          title={title}
          action={<Link to="/shop" className="link-line text-sm font-medium text-accent">View all <ArrowRight className="h-4 w-4" /></Link>}
        />
      </Reveal>
      <Reveal delay={80}>
        <HorizontalScroller className="mt-8">
          {items.map((p) => (
            <div key={p.id} className="w-64 shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </HorizontalScroller>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card with Affiliate Enhanced Badge                         */
/* ------------------------------------------------------------------ */

export function AffiliateProductBadge({ product }: { product: Product }) {
  if (!product.affiliate) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.65rem] font-semibold text-accent tracking-wide">
      <ShoppingBag className="h-3 w-3" />
      {product.affiliatePartner || "Affiliate"}
    </span>
  );
}
