/**
 * ALAYA INSIDER — Product Discovery Feeds (Part 3.4)
 * -----------------------------------------------------
 * Premium discovery components for the storefront: staff picks, hidden gems,
 * award winners, trending feeds — designed for homepage and shop pages.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Award, Sparkles, ArrowRight, Gem, Zap } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { ProductCard } from "./ProductCard";
import { AffiliateBadge } from "./EnhancedAffiliateCard";
import { Reveal } from "./Reveal";
import { HorizontalScroller } from "./HorizontalScroller";
import { SectionHeading, Price, Stars } from "./ui";
import {
  staffPicks,
  hiddenGems,
  awardWinners,
  trendingProducts,
} from "../lib/recommendations";
import type { Product } from "../lib/types";

/* ------------------------------------------------------------------ */
/*  Staff Picks — curated editorial selections                         */
/* ------------------------------------------------------------------ */

export function StaffPicks({ limit = 8 }: { limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => staffPicks(products, limit), [products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Editorial selection"
          title="Staff picks"
          subtitle="Every product in this edit has been personally tested and approved by our editorial team."
          action={<Link to="/collections/editors" className="link-line text-sm font-medium text-accent">View all <ArrowRight className="h-4 w-4" /></Link>}
        />
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {items.slice(0, 8).map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <div className="relative">
                <div className="absolute -left-2 -top-2 z-10">
                  <AffiliateBadge type="staff_pick" />
                </div>
                <ProductCard product={p} />
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Hidden Gems — undiscovered treasures                               */
/* ------------------------------------------------------------------ */

export function HiddenGems({ limit = 4 }: { limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => hiddenGems(products, limit), [products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge py-20">
      <Reveal>
        <div className="rounded-[var(--radius-xl2)] border border-line bg-gradient-to-br from-amber-500/5 to-accent-soft/20 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Gem className="h-5 w-5 text-amber-500" />
            <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400">Hidden Gems</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink">Undiscovered treasures</h2>
          <p className="mt-2 max-w-lg text-muted">Brilliant pieces that deserve the spotlight — highly rated but quietly waiting to be discovered.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <Link
                  to={`/product/${p.slug}`}
                  className="group block rounded-xl border border-line bg-surface p-3 transition-all hover:border-accent hover:shadow-[var(--shadow-card)]"
                >
                  <div className="relative overflow-hidden rounded-lg">
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <Stars rating={p.rating} size={12} className="text-amber-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <Price price={p.price} salePrice={p.salePrice} />
                    <p className="mt-1 line-clamp-2 text-[0.65rem] text-muted">{p.shortDescription}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Award Winners — recognized and awarded products                    */
/* ------------------------------------------------------------------ */

export function AwardWinnersSection({ limit = 4 }: { limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => awardWinners(products, limit), [products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge py-20">
      <Reveal>
        <div className="rounded-[var(--radius-xl2)] border border-line bg-ink p-6 text-canvas sm:p-8">
          <div className="absolute inset-0 bg-luxe opacity-40 rounded-[var(--radius-xl2)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span className="badge bg-amber-500/20 text-amber-300">Award Winners</span>
            </div>
            <h2 className="font-display text-2xl font-semibold">Award-winning design</h2>
            <p className="mt-2 max-w-lg text-canvas/70">Products that have earned recognition for exceptional design, quality, and innovation.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {items.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <img src={p.images[0]} alt={p.name} loading="lazy" className="h-20 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-canvas/60">
                      <Stars rating={p.rating} size={12} />
                      <span>{(p.rating ?? 0).toFixed(1)}</span>
                      <span>·</span>
                      <span>{p.reviewCount} reviews</span>
                    </div>
                    <Price price={p.price} salePrice={p.salePrice} priceClassName="text-canvas" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-canvas/40 transition-transform group-hover:translate-x-1" />
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
/*  Trending Feed — what's popular right now                           */
/* ------------------------------------------------------------------ */

export function TrendingFeed({ limit = 8 }: { limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => trendingProducts(products, limit), [products, limit]);

  if (items.length === 0) return null;

  return (
    <section className="container-edge py-20">
      <Reveal>
        <SectionHeading
          eyebrow="What's hot"
          title="Trending now"
          subtitle="The products the ALAYA community is loving right now — ranked by popularity."
          action={<Link to="/collections/trending" className="link-line text-sm font-medium text-accent">View trending <ArrowRight className="h-4 w-4" /></Link>}
        />
      </Reveal>
      <Reveal delay={80}>
        <HorizontalScroller className="mt-10">
          {items.map((p) => (
            <div key={p.id} className="w-64 shrink-0 snap-start relative">
              <div className="absolute -left-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[0.6rem] font-semibold text-white">
                <Zap className="h-3 w-3" /> Trending
              </div>
              <ProductCard product={p} />
            </div>
          ))}
        </HorizontalScroller>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Discovery Feed Grid — combined discovery experience                */
/* ------------------------------------------------------------------ */

export function DiscoveryFeedGrid({ products: feed, title, icon: Icon = Sparkles }: {
  products: Product[];
  title: string;
  icon?: typeof Sparkles;
}) {
  if (feed.length === 0) return null;

  return (
    <section className="container-edge py-12">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="h-5 w-5 text-accent" />
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {feed.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Recently Added Feed — newest products                              */
/* ------------------------------------------------------------------ */

export function RecentlyAddedFeed({ limit = 8 }: { limit?: number }) {
  const { products } = useStore();

  const items = useMemo(
    () => [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit),
    [products, limit]
  );

  if (items.length === 0) return null;

  return (
    <section className="container-edge py-12">
      <Reveal>
        <SectionHeading
          eyebrow="Fresh arrivals"
          title="Recently added"
          action={<Link to="/collections/new" className="link-line text-sm font-medium text-accent">View all new <ArrowRight className="h-4 w-4" /></Link>}
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
