import { useMemo, useState } from "react";
import { Plus, ShoppingBag, Check, PackageCheck } from "lucide-react";
import type { Product } from "../../lib/types";
import { useCommerce } from "../../context/CommerceContext";
import { useStore } from "../../context/StoreContext";
import { Price, Money } from "../ui";
import { cn } from "@/utils/cn";

/** "Frequently bought together" bundle with a combined total + add-all. */
export function FrequentlyBoughtTogether({ main, related }: { main: Product; related: Product[] }) {
  const { addToCart } = useCommerce();
  const { settings } = useStore();
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(related.slice(0, 2).map((p) => [p.id, true]))
  );

  const items = useMemo(() => [main, ...related.filter((r) => picked[r.id])], [main, related, picked]);
  const total = useMemo(() => items.reduce((s, p) => s + (p.salePrice ?? p.price), 0), [items]);

  if (related.length === 0) return null;

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <PackageCheck className="h-5 w-5 text-accent" />
        <h2 className="font-display text-xl font-semibold text-ink">Frequently bought together</h2>
      </div>
      <p className="mt-1 text-sm text-muted">Complete your routine — bundle and save time at checkout.</p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Visual stack */}
        <div className="flex items-center gap-3">
          {items.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="relative">
                <img src={p.images[0]} alt={p.name} loading="lazy" className="h-24 w-20 rounded-xl object-cover" />
              </div>
              {i < items.length - 1 && <Plus className="h-4 w-4 shrink-0 text-muted" />}
            </div>
          ))}
        </div>

        {/* Selectable list */}
        <div className="flex-1 space-y-2.5">
          {related.map((p) => {
            const on = picked[p.id];
            return (
              <label key={p.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors", on ? "border-accent bg-accent-soft" : "border-line hover:bg-surface2")}>
                <input type="checkbox" checked={!!on} onChange={() => setPicked((s) => ({ ...s, [p.id]: !s[p.id] }))} className="h-4 w-4 accent-[var(--c-accent)]" />
                <img src={p.images[0]} alt="" className="h-10 w-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                  <Price price={p.price} salePrice={p.salePrice} />
                </div>
                {on && <Check className="h-4 w-4 text-accent" />}
              </label>
            );
          })}
        </div>

        {/* Total + add */}
        <div className="flex flex-col justify-between rounded-xl bg-surface2/50 p-5 lg:w-56">
          <div>
            <p className="text-xs text-muted">Total for {items.length} items</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink"><Money amount={total} /></p>
            <p className="mt-1 text-xs text-success">Save time at checkout</p>
          </div>
          <button
            onClick={() => items.forEach((p) => !p.affiliate && addToCart(p.id, "", "", 1, false))}
            className="btn-primary btn-md mt-4 w-full"
          >
            <ShoppingBag className="h-4 w-4" /> Add {items.length} to bag
          </button>
          <p className="mt-2 text-center text-[0.65rem] text-muted">Shipping calc. at checkout · {settings.currency.code}</p>
        </div>
      </div>
    </div>
  );
}
