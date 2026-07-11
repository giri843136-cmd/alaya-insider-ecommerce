import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, Flame, Eye } from "lucide-react";
import type { Product } from "../../lib/types";
import { HorizontalScroller } from "../HorizontalScroller";
import { Reveal } from "../Reveal";
import { useStore } from "../../context/StoreContext";
import { discountPercent, hashToIndex, wide } from "../../lib/utils";
import { CountdownBar } from "./CountdownBar";

/** Flash deals rail: countdown timer + deal cards with stock progress + social proof. */
export function FlashDeals({ products }: { products: Product[] }) {
  const { settings } = useStore();
  const deals = useMemo(
    () => products.filter((p) => p.salePrice && p.salePrice < p.price).slice(0, 8),
    [products]
  );

  // deterministic "ends in" within the next ~24h
  const endsAt = useMemo(() => Date.now() + 20 * 3600000 + hashToIndex("flash", 7) * 3600000, []);

  if (deals.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-line bg-ink py-20 text-canvas">
      <img src={wide(17775855, 1600, 800)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/70" />
      <div className="container-edge relative">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-ink">
                <Zap className="h-3.5 w-3.5" /> Flash Deals
              </span>
              <h2 className="text-display-m text-canvas">Dropping fast</h2>
              <p className="mt-2 text-canvas/70">Steepest markdowns — when they're gone, they're gone.</p>
            </div>
            <CountdownBar endsAt={endsAt} />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <HorizontalScroller className="mt-10">
            {deals.map((p) => {
              const discount = discountPercent(p.price, p.salePrice);
              const sold = Math.min(95, 40 + hashToIndex(p.id, 50));
              const viewing = 8 + hashToIndex(p.id + "v", 40);
              return (
                <div key={p.id} className="w-64 shrink-0 snap-start">
                  <div className="rounded-[var(--radius-xl2)] border border-white/10 bg-surface p-3 text-ink">
                    <div className="relative overflow-hidden rounded-xl bg-surface2">
                      <Link to={`/product/${p.slug}`}>
                        <img src={p.images[0]} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                      </Link>
                      <span className="absolute left-2 top-2 badge bg-danger text-white">−{discount}%</span>
                    </div>
                    <div className="px-1 pt-3">
                      <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-semibold text-danger">{settings.currency.symbol}{Math.round(p.salePrice!)}</span>
                        <span className="text-xs text-muted line-through">{settings.currency.symbol}{Math.round(p.price)}</span>
                      </div>
                      {/* Stock progress */}
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[0.65rem] text-muted">
                          <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-danger" /> {sold}% sold</span>
                          <span>Hurry</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                          <div className="h-full rounded-full bg-danger transition-all" style={{ width: `${sold}%` }} />
                        </div>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[0.65rem] text-muted">
                        <Eye className="h-3 w-3" /> {viewing} people viewing
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </HorizontalScroller>
        </Reveal>

        <div className="mt-8 text-center">
          <Link to="/collections/flash" className="btn btn-md border border-white/20 text-canvas hover:bg-white/10">
            View all flash deals
          </Link>
        </div>
      </div>
    </section>
  );
}
