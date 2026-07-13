import { useEffect, useState } from "react";
import { ShoppingBag, ExternalLink, Heart } from "lucide-react";
import type { Product } from "../../lib/types";
import { useCommerce } from "../../context/CommerceContext";
import { Price } from "../ui";
import { cn } from "@/utils/cn";
import { discountPercent } from "../../lib/utils";

/** Mobile-friendly sticky purchase bar that appears as the user scrolls past the hero. */
export function StickyPurchaseBar({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, inWishlist } = useCommerce();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const soldOut = product.stock <= 0 && !product.affiliate;
  const saved = inWishlist(product.id);
  const discount = discountPercent(product.price, product.salePrice);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[120] border-t border-line bg-surface/95 backdrop-blur transition-transform duration-300 lg:hidden",
        show && !soldOut ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container-edge flex items-center gap-3 py-3">
        <img src={product.images[0]} alt="" className="h-11 w-9 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <Price price={product.price} salePrice={product.salePrice} priceClassName="text-sm" />
            {discount > 0 && <span className="text-[0.65rem] font-semibold text-danger">−{discount}%</span>}
          </div>
        </div>
        <button onClick={() => toggleWishlist(product.id)} aria-pressed={saved} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line", saved ? "text-accent" : "text-ink")}>
          <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>
        {product.affiliate ? (
          <a href={product.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary btn-sm shrink-0">
            <ExternalLink className="h-4 w-4" /> Shop
          </a>
        ) : (
          <button onClick={() => addToCart(product.id, "", "", 1, true)} className="btn-primary btn-sm shrink-0">
            <ShoppingBag className="h-4 w-4" /> Add
          </button>
        )}
      </div>
    </div>
  );
}
