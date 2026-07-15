import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag, ExternalLink } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { Seo } from "../components/Seo";
import { Breadcrumbs, EmptyState, Money, QuantitySelector } from "../components/ui";

/**
 * ALAYA INSIDER — Saved Items
 * --------------------------------------------------------------------------
 * Affiliate-only view: users save products for price/market comparison.
 * No checkout, no purchase — all CTAs go to affiliate merchant links.
 */

export default function Cart() {
  const { detailedLines, updateQty, removeLine, clearCart } = useCommerce();

  return (
    <>
      <Seo title="Your bag" path="/cart" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bag" }]} />
      </div>

      <section className="container-edge pb-20">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Your bag</h1>

        {detailedLines.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Your bag is empty"
              description="Discover our editors' most-loved pieces and start your edit."
              action={<Link to="/shop" className="btn-primary btn-md">Browse the edit <ArrowRight className="h-4 w-4" /></Link>}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Items */}
            <div>
              <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-line pb-3 text-xs font-semibold uppercase tracking-wider text-muted sm:grid">
                <span>Product</span>
                <span className="px-4">Quantity</span>
                <span className="text-right">Total</span>
              </div>
              <ul className="divide-y divide-line">
                {detailedLines.map((dl) => (
                  <li key={dl.key} className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="flex gap-4">
                      <Link to={`/product/${dl.product.slug}`} className="shrink-0">
                        <img src={dl.product.images[0]} alt={dl.product.name} className="h-28 w-24 rounded-xl object-cover" />
                      </Link>
                      <div className="flex flex-col">
                        {dl.product.brand && <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{dl.product.brand}</span>}
                        <Link to={`/product/${dl.product.slug}`} className="font-medium text-ink hover:text-accent">{dl.product.name}</Link>
                        {dl.line.variantLabel && <span className="mt-0.5 text-sm text-muted">{dl.line.variantLabel}</span>}
                        <span className="mt-1 text-sm text-muted"><Money amount={dl.unitPrice} /></span>
                        <button onClick={() => removeLine(dl.key)} className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs text-muted hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="px-4">
                      <QuantitySelector
                        value={dl.line.qty}
                        max={dl.product.type === "digital" ? 1 : Math.max(1, dl.product.stock)}
                        size="sm"
                        onChange={(v) => updateQty(dl.key, v)}
                      />
                    </div>
                    <div className="text-right font-semibold text-ink sm:text-lg">
                      <Money amount={dl.lineTotal} />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent">
                  ← Continue shopping
                </Link>
                <button onClick={clearCart} className="text-sm text-muted hover:text-danger">Clear bag</button>
              </div>
            </div>

            {/* Summary — affiliate-only */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-ink">{detailedLines.length} saved item{detailedLines.length > 1 ? "s" : ""}</h2>
                <p className="mt-2 text-sm text-muted">Compare prices across trusted merchants to find the best deal.</p>
                <Link to="/compare" className="btn-primary btn-lg mt-6 w-full">
                  Compare Merchants <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <ExternalLink className="h-3.5 w-3.5" /> You'll be redirected to our trusted merchants
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
