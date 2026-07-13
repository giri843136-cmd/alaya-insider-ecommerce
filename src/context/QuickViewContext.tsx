import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { QuickView } from "../components/QuickView";
import type { Product } from "../lib/types";

interface QuickViewContextValue {
  open: (product: Product) => void;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

/** Provides a single app-wide QuickView modal. Any ProductCard can trigger it. */
export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const open = useCallback((p: Product) => setProduct(p), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <QuickView product={product} onClose={() => setProduct(null)} />
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx) return { open: (_p: Product) => {} };
  return ctx;
}
