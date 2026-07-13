import { Link } from "react-router-dom";
import { Scale, X, ArrowRight } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";

/** Floating bar that appears when items are in the compare list. */
export function CompareBar() {
  const { compare, toggleCompare, clearCompare } = useCommerce();
  const { getProduct, settings } = useStore();
  const { toast } = useToast();

  if (!settings.features.compare || compare.length === 0) return null;

  const items = compare.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] animate-slide-up">
      <div className="container-edge pb-4">
        <div className="card flex items-center gap-3 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Scale className="h-5 w-5" />
          </span>
          <span className="hidden text-sm font-medium text-ink sm:block">
            Comparing {compare.length}
          </span>
          <div className="hide-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
            {items.map((p) => (
              <div key={p.id} className="group relative shrink-0">
                <img src={p.images[0]} alt={p.name} className="h-12 w-10 rounded-lg object-cover" />
                <button
                  onClick={() => toggleCompare(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-canvas transition-transform hover:scale-110"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => { clearCompare(); toast.info("Compare cleared"); }}
              className="hidden text-xs text-muted hover:text-ink sm:block"
            >
              Clear
            </button>
            <Link to="/compare" className="btn-primary btn-sm">
              Compare <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
