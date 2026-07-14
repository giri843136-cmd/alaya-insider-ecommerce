import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star, Scale } from "lucide-react";
import type { Product } from "../lib/types";
import { useCommerce } from "../context/CommerceContext";
import { useStore } from "../context/StoreContext";
import { useQuickView } from "../context/QuickViewContext";
import { Price, Badge } from "./ui";
import { Skeleton } from "./ui";
import { SafeImg } from "./SafeImg";
import { cn } from "@/utils/cn";
import { discountPercent } from "../lib/utils";

const ProductCardInner = memo(function ProductCardInner({ product, onQuickView }: { product: Product; onQuickView?: (p: Product) => void }) {
  const { toggleWishlist, inWishlist, toggleCompare, inCompare } = useCommerce();
  const { settings } = useStore();
  const { open: openQuickView } = useQuickView();
  const quickView = onQuickView ?? openQuickView;
  const saved = inWishlist(product.id);
  const comparing = inCompare(product.id);
  const discount = discountPercent(product.price, product.salePrice);
  const soldOut = product.stock <= 0 && !product.affiliate && product.type !== 'digital';

  const handleToggleWishlist = useCallback(() => toggleWishlist(product.id), [toggleWishlist, product.id]);
  const handleToggleCompare = useCallback(() => toggleCompare(product.id), [toggleCompare, product.id]);
  const handleQuickView = useCallback(() => quickView(product), [quickView, product]);

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-[var(--radius-xl2)] bg-surface2">
        <Link
          to={`/product/${product.slug}`}
          className="block aspect-[4/5] overflow-hidden"
          aria-label={product.name}
        >
          <SafeImg
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-all duration-[900ms] ease-out group-hover:scale-[1.04]",
              soldOut && "opacity-60"
            )}
          />
          {product.images[1] && (
            <SafeImg
              src={product.images[1]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && <Badge variant="sale">−{discount}%</Badge>}
          {product.isNew && <Badge variant="new">New</Badge>}
          {product.bestSeller && <Badge variant="bestseller">Bestseller</Badge>}
          {product.type === "digital" && <Badge variant="digital">Digital</Badge>}
          {soldOut && <Badge variant="neutral">Sold out</Badge>}
          {!soldOut && product.stock > 0 && product.stock <= 8 && product.type !== "digital" && (
            <Badge variant="lowstock">Only {product.stock} left</Badge>
          )}
        </div>

        {/* Wishlist + Compare */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-pressed={saved}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full glass text-ink transition-all duration-300 hover:scale-110",
              saved && "text-accent"
            )}
          >
            <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
          </button>
          {settings.features.compare && (
            <button
              type="button"
              onClick={handleToggleCompare}
              aria-pressed={comparing}
              aria-label={comparing ? "Remove from compare" : "Add to compare"}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full glass text-ink transition-all duration-300 hover:scale-110",
                comparing && "text-accent"
              )}
            >
              <Scale className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Quick action */}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-3 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Link to={`/product/${product.slug}`} className="btn-primary btn-md w-full">
            <ShoppingBag className="h-4 w-4" />
            View options
          </Link>
          <button type="button" onClick={handleQuickView} className="btn-ghost btn-sm w-full bg-white/70 text-ink backdrop-blur hover:bg-white">
            Quick view
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3.5 flex flex-1 flex-col">
        {product.brand && (
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
            {product.brand}
          </span>
        )}
        <h3 className="mt-1 font-medium leading-snug text-ink">
          <Link to={`/product/${product.slug}`} className="link-line">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" strokeWidth={0} />
          <span className="font-medium text-ink">{product.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span>{product.reviewCount} reviews</span>
        </div>
        <div className="mt-2">
          <Price price={product.price} salePrice={product.salePrice} />
        </div>
      </div>
    </article>
  );
});

/** Default export is the memo-wrapped ProductCard. */
export { ProductCardInner as ProductCard };

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[4/5] w-full rounded-[var(--radius-xl2)]" />
      <div className="mt-3.5 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
