import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2 } from "lucide-react";
import { useStore } from "../context/StoreContext";
import type { LiveSale } from "../lib/types";

const REPEAT_KEY = "alaya_live_seen";

/** Rotating "someone just purchased" social-proof toast. */
export function LiveSalesToast() {
  const { liveSales, getProduct, settings } = useStore();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<LiveSale | null>(null);

  useEffect(() => {
    if (liveSales.length === 0) return;
    let index = Math.floor(Math.random() * liveSales.length);
    let cycle: ReturnType<typeof setTimeout>;
    let gap: ReturnType<typeof setTimeout>;

    const show = () => {
      const seen = (() => { try { return JSON.parse(sessionStorage.getItem(REPEAT_KEY) || "[]") as string[]; } catch { return []; } })();
      const next = liveSales[index % liveSales.length];
      index++;
      setCurrent(next);
      sessionStorage.setItem(REPEAT_KEY, JSON.stringify([...seen, next.id].slice(0, 30)));
      // auto-hide after 6s, then wait 14s before next
      cycle = setTimeout(() => setCurrent(null), 6000);
      gap = setTimeout(show, 20000);
    };

    const initial = setTimeout(show, 5000);
    return () => { clearTimeout(initial); clearTimeout(cycle); clearTimeout(gap); };
  }, [liveSales]);

  if (!current) return null;
  const product = getProduct(current.productId);
  if (!product) return null;

  const ago = (m: number) => (m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`);

  return (
    <div className="fixed bottom-6 left-6 z-[120] hidden max-w-xs animate-slide-up sm:block">
      <div className="card flex items-center gap-3 p-3">
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="shrink-0"
          aria-label={`View ${product.name}`}
        >
          <img src={product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3 text-success" />
            <span className="font-semibold text-ink">{current.customerName}</span>
            <span className="text-muted">from {current.city}</span>
          </p>
          <p className="truncate text-xs text-muted">purchased {product.name}</p>
          <p className="text-[0.65rem] text-muted">{ago(current.minutesAgo)} · {settings.currency.symbol}{Math.round(product.salePrice ?? product.price)}</p>
        </div>
        <button onClick={() => setCurrent(null)} aria-label="Dismiss" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
