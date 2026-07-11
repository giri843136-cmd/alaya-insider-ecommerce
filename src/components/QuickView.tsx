import { Link } from "react-router-dom";
import { useState } from "react";
import { X, ShoppingBag, Heart, ArrowRight, Truck, RefreshCw, ShieldCheck, ExternalLink } from "lucide-react";
import { useEscapeKey, useLockBody } from "../lib/hooks";
import { useCommerce } from "../context/CommerceContext";
import { Price, Stars, Badge, QuantitySelector } from "./ui";
import { cn } from "@/utils/cn";
import { discountPercent } from "../lib/utils";
import type { Product } from "../lib/types";

/** Quick view modal — preview a product without leaving the grid. */
export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addToCart, toggleWishlist, inWishlist } = useCommerce();
  const [qty, setQty] = useState(1);

  useEscapeKey(onClose, !!product);
  useLockBody(!!product);

  if (!product) return null;
  const saved = inWishlist(product.id);
  const discount = discountPercent(product.price, product.salePrice);
  const soldOut = product.stock <= 0 && !product.affiliate;
  const dvKey = product.variants?.length ? product.variants.map((v) => v.options[0]).join(" | ") : "";
  const dvLabel = product.variants?.length ? product.variants.map((v) => `${v.name}: ${v.options[0]}`).join(" · ") : "";

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="card relative z-10 w-full max-w-3xl overflow-hidden animate-scale-in">
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full glass text-ink hover:text-danger"><X className="h-5 w-5" /></button>
        <div className="grid max-h-[85vh] overflow-y-auto sm:grid-cols-2">
          <div className="relative aspect-square bg-surface2 sm:aspect-auto">
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {discount > 0 && <Badge variant="sale">−{discount}%</Badge>}
              {product.isNew && <Badge variant="new">New</Badge>}
            </div>
          </div>
          <div className="flex flex-col p-6">
            {product.brand && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.brand}</span>}
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">{product.name}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Stars rating={product.rating} size={16} />
              <span className="text-muted">({product.reviewCount})</span>
            </div>
            <div className="mt-4"><Price price={product.price} salePrice={product.salePrice} priceClassName="text-xl" /></div>
            <p className="mt-3 text-sm text-muted">{product.shortDescription}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {!product.affiliate && !soldOut && (
                <QuantitySelector value={qty} onChange={setQty} size="sm" max={product.type === "digital" ? 1 : Math.max(1, product.stock)} />
              )}
              {product.affiliate ? (
                <a href={product.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary btn-md flex-1">Shop partner <ExternalLink className="h-4 w-4" /></a>
              ) : (
                <button disabled={soldOut} onClick={() => addToCart(product.id, dvKey, dvLabel, qty)} className="btn-primary btn-md flex-1">
                  <ShoppingBag className="h-4 w-4" /> {soldOut ? "Sold out" : "Add to bag"}
                </button>
              )}
              <button onClick={() => toggleWishlist(product.id)} aria-pressed={saved} className={cn("btn btn-md border border-line", saved ? "border-accent text-accent" : "text-ink")}><Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} /></button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[{ icon: Truck, t: "Free $150+" }, { icon: RefreshCw, t: "30-day" }, { icon: ShieldCheck, t: "Secure" }].map((a) => (
                <div key={a.t} className="rounded-lg border border-line bg-surface2/50 p-2"><a.icon className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 text-[0.65rem] text-muted">{a.t}</p></div>
              ))}
            </div>

            <div className="mt-auto pt-5">
              <Link to={`/product/${product.slug}`} onClick={onClose} className="link-line inline-flex items-center gap-1 text-sm font-medium text-accent">View full details <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
