import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "./StoreContext";
import { useToast } from "./ToastContext";
import { clamp } from "../lib/utils";
import type { CartLine, Product } from "../lib/types";

export interface DetailedLine {
  key: string;
  line: CartLine;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

interface CommerceContextValue {
  cart: CartLine[];
  wishlist: string[];
  compare: string[];
  recentlyViewed: string[];
  cartCount: number;
  detailedLines: DetailedLine[];
  subtotal: number;
  shippingRemaining: number;
  addToCart: (productId: string, variantKey: string, variantLabel: string, qty?: number, open?: boolean) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleWishlist: (productId: string) => void;
  inWishlist: (id: string) => boolean;
  toggleCompare: (productId: string) => void;
  inCompare: (id: string) => boolean;
  clearCompare: () => void;
  trackView: (productId: string) => void;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);

const CART_KEY = "alaya_cart_v1";
const WISH_KEY = "alaya_wishlist_v1";
const COMPARE_KEY = "alaya_compare_v1";
const RECENT_KEY = "alaya_recent_v1";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lineKey(productId: string, variantKey: string) {
  return `${productId}__${variantKey || "default"}`;
}

const MAX_COMPARE = 4;
const MAX_RECENT = 8;

export function CommerceProvider({ children }: { children: ReactNode }) {
  const { getProduct, settings } = useStore();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartLine[]>(() => readJSON(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => readJSON(WISH_KEY, []));
  const [compare, setCompare] = useState<string[]>(() => readJSON(COMPARE_KEY, []));
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => readJSON(RECENT_KEY, []));
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => window.localStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart]);
  useEffect(() => window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => window.localStorage.setItem(COMPARE_KEY, JSON.stringify(compare)), [compare]);
  useEffect(() => window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed)), [recentlyViewed]);

  const detailedLines = useMemo<DetailedLine[]>(() => {
    return cart
      .map((line) => {
        const product = getProduct(line.productId);
        if (!product) return null;
        const unitPrice = product.salePrice ?? product.price;
        return {
          key: lineKey(line.productId, line.variantKey),
          line,
          product,
          unitPrice,
          lineTotal: unitPrice * line.qty,
        } as DetailedLine;
      })
      .filter((x): x is DetailedLine => x !== null);
  }, [cart, getProduct]);

  const subtotal = useMemo(() => detailedLines.reduce((s, dl) => s + dl.lineTotal, 0), [detailedLines]);
  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const shippingRemaining = Math.max(0, settings.shipping.freeOver - subtotal);

  const addToCart = useCallback<CommerceContextValue["addToCart"]>(
    (productId, variantKey, variantLabel, qty = 1, open = true) => {
      const product = getProduct(productId);
      if (!product) return;
      if (product.affiliate) {
        toast.info("Affiliate item", "This curated piece opens on our partner's site.");
        return;
      }
      setCart((prev) => {
        const key = lineKey(productId, variantKey);
        const existing = prev.find((l) => lineKey(l.productId, l.variantKey) === key);
        const max = product.type === "digital" ? 1 : Math.max(1, product.stock);
        if (existing) {
          return prev.map((l) =>
            lineKey(l.productId, l.variantKey) === key ? { ...l, qty: clamp(l.qty + qty, 1, max) } : l
          );
        }
        return [...prev, { productId, variantKey, variantLabel, qty: clamp(qty, 1, max) }];
      });
      toast.success("Added to bag", product.name);
      if (open) setCartOpen(true);
    },
    [getProduct, toast]
  );

  const updateQty = useCallback((key: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (lineKey(l.productId, l.variantKey) !== key) return l;
          const product = getProduct(l.productId);
          const max = product && product.type !== "digital" ? Math.max(1, product.stock) : 99;
          return { ...l, qty: clamp(qty, 1, max) };
        })
        .filter((l) => l.qty > 0)
    );
  }, [getProduct]);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => lineKey(l.productId, l.variantKey) !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const inWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist]);
  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        if (prev.includes(productId)) {
          toast.info("Removed from wishlist");
          return prev.filter((id) => id !== productId);
        }
        toast.success("Saved to wishlist");
        return [...prev, productId];
      });
    },
    [toast]
  );

  const inCompare = useCallback((id: string) => compare.includes(id), [compare]);
  const toggleCompare = useCallback(
    (productId: string) => {
      setCompare((prev) => {
        if (prev.includes(productId)) return prev.filter((id) => id !== productId);
        if (prev.length >= MAX_COMPARE) {
          toast.error("Compare is full", `You can compare up to ${MAX_COMPARE} items.`);
          return prev;
        }
        toast.success("Added to compare");
        return [...prev, productId];
      });
    },
    [toast]
  );
  const clearCompare = useCallback(() => setCompare([]), []);

  const trackView = useCallback((productId: string) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_RECENT));
  }, []);

  const value = useMemo<CommerceContextValue>(
    () => ({
      cart,
      wishlist,
      compare,
      recentlyViewed,
      cartCount,
      detailedLines,
      subtotal,
      shippingRemaining,
      addToCart,
      updateQty,
      removeLine,
      clearCart,
      cartOpen,
      openCart,
      closeCart,
      toggleWishlist,
      inWishlist,
      toggleCompare,
      inCompare,
      clearCompare,
      trackView,
    }),
    [
      cart, wishlist, compare, recentlyViewed, cartCount, detailedLines, subtotal, shippingRemaining,
      addToCart, updateQty, removeLine, clearCart, cartOpen, openCart, closeCart,
      toggleWishlist, inWishlist, toggleCompare, inCompare, clearCompare, trackView,
    ]
  );

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const ctx = useContext(CommerceContext);
  if (!ctx) throw new Error("useCommerce must be used within <CommerceProvider>");
  return ctx;
}
