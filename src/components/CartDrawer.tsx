import { Link } from "react-router-dom";
import { X, Trash2, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { useStore } from "../context/StoreContext";
import { useEscapeKey, useLockBody } from "../lib/hooks";
import { EmptyState, Money, QuantitySelector } from "./ui";
import { formatPrice } from "../lib/utils";
import { flags } from "../lib/featureFlags";

export function CartDrawer() {
  // Freeze in affiliate-only mode — cart is hidden
  if (!flags.ENABLE_ECOMMERCE) return null;
  const {
    cartOpen,
    closeCart,
    detailedLines,
    subtotal,
    shippingRemaining,
    updateQty,
    removeLine,
  } = useCommerce();
  const { settings } = useStore();

  useEscapeKey(closeCart, cartOpen);
  useLockBody(cartOpen);

  if (!cartOpen) return null;

  const freeOver = settings.shipping.freeOver;
  const pct = Math.min(100, (subtotal / freeOver) * 100);

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeCart} aria-hidden="true" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-canvas animate-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5 text-accent" /> Your Bag
          </h2>
          <button onClick={closeCart} aria-label="Close bag" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2">
            <X className="h-5 w-5" />
          </button>
        </header>

        {detailedLines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Your bag is empty"
              description="Discover pieces our editors love — curated for everyday luxury."
              action={
                <Link to="/shop" onClick={closeCart} className="btn-primary btn-md">
                  Browse the edit <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="border-b border-line px-5 py-3">
              {shippingRemaining > 0 ? (
                <p className="text-xs text-muted">
                  You're <span className="font-semibold text-ink">{formatPrice(shippingRemaining, settings.currency)}</span> away from complimentary shipping
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                  <Sparkles className="h-3.5 w-3.5" /> You've unlocked free shipping
                </p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="hide-scrollbar flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {detailedLines.map((dl) => (
                  <li key={dl.key} className="flex gap-3">
                    <Link to={`/product/${dl.product.slug}`} onClick={closeCart} className="shrink-0">
                      <img src={dl.product.images[0]} alt={dl.product.name} className="h-24 w-20 rounded-lg object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{dl.product.name}</p>
                          {dl.line.variantLabel && <p className="truncate text-xs text-muted">{dl.line.variantLabel}</p>}
                        </div>
                        <button onClick={() => removeLine(dl.key)} aria-label={`Remove ${dl.product.name}`} className="text-muted hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantitySelector
                          value={dl.line.qty}
                          min={1}
                          max={dl.product.type === "digital" ? 1 : Math.max(1, dl.product.stock)}
                          size="sm"
                          onChange={(v) => updateQty(dl.key, v)}
                        />
                        <span className="text-sm font-semibold"><Money amount={dl.lineTotal} /></span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-line px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-lg font-semibold"><Money amount={subtotal} /></span>
              </div>
              <p className="mt-1 text-xs text-muted">Shipping & taxes calculated at checkout.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/cart" onClick={closeCart} className="btn-outline btn-md">
                  View bag
                </Link>
                <Link to="/checkout" onClick={closeCart} className="btn-primary btn-md">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
