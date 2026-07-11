/**
 * ALAYA INSIDER — AI Product Insights (Part 3.4)
 * -------------------------------------------------
 * AI-powered product summaries, buying advice, alternative suggestions,
 * and bundle recommendations — all powered by on-device deterministic AI.
 * Fully integrated with the existing ai.ts library.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Sparkles,
  Lightbulb,
  Gift,
  Star,
  Check,
  Tag,
  ShoppingBag,
  Gem,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { genDescription, genFaqs, genFeatures } from "../lib/ai";
import { completeTheLook, bundleSuggestions, budgetAlternatives } from "../lib/recommendations";
import { Price } from "./ui";
import type { Product } from "../lib/types";

/* ------------------------------------------------------------------ */
/*  AI Product Summary — concise editorial overview                    */
/* ------------------------------------------------------------------ */

export function AiProductSummary({ product }: { product: Product }) {
  const summary = useMemo(() => genDescription(product), [product]);
  const features = useMemo(() => genFeatures(product, 4), [product]);

  return (
    <div className="rounded-[var(--radius-xl2)] border border-line bg-gradient-to-br from-accent-soft/10 to-surface2/30 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-accent">
          <Bot className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">AI Summary</span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{summary}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-muted">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Buying Advice — personalized recommendation copy                */
/* ------------------------------------------------------------------ */

export function AiBuyingAdvice({ product }: { product: Product }) {
  const advice = useMemo(() => {
    const tips: { icon: typeof Star; text: string; highlight?: string }[] = [];
    const price = product.salePrice ?? product.price;

    if (price > 200) {
      tips.push({ icon: Gem, text: "This is an investment piece — the quality and craftsmanship justify the price point.", highlight: "Investment piece" });
    } else if (price < 50) {
      tips.push({ icon: ShoppingBag, text: "An accessible luxury with exceptional value — perfect for everyday rotation.", highlight: "Great value" });
    } else {
      tips.push({ icon: Star, text: "A beautifully balanced piece that offers lasting quality at a considered price.", highlight: "Considered choice" });
    }

    if (product.bestSeller) {
      tips.push({ icon: Star, text: "Our community's top choice — repeatedly purchased by discerning shoppers.", highlight: "Best seller" });
    }
    if (product.featured) {
      tips.push({ icon: Sparkles, text: "Personally selected by our editorial team for its exceptional design and quality.", highlight: "Editor's pick" });
    }
    if (product.affiliate) {
      tips.push({ icon: Tag, text: `Curated from ${product.affiliatePartner || "our partner"} — pricing and availability may vary.`, highlight: "Partner pick" });
    }
    if (product.type === "digital") {
      tips.push({ icon: ShoppingBag, text: "Delivered instantly to your inbox — begin your journey right away.", highlight: "Instant access" });
    }

    return tips;
  }, [product]);

  return (
    <div className="rounded-[var(--radius-xl2)] border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-accent">
          <Lightbulb className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">Why ALAYA Recommends</span>
      </div>
      <div className="space-y-3">
        {advice.map((tip, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft/50 text-accent">
              <tip.icon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm leading-relaxed text-muted">{tip.text}</p>
              {tip.highlight && (
                <span className="inline-block mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-accent">
                  {tip.highlight}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Alternatives — smarter alternative suggestions                  */
/* ------------------------------------------------------------------ */

export function AiAlternatives({ product, limit = 3 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => {
    const budget = budgetAlternatives(product, products, limit);
    const complementary = completeTheLook(product, products, limit);
    const bundles = bundleSuggestions(product, products, limit);
    return { budget, complementary, bundles };
  }, [product, products, limit]);

  const hasAny = items.budget.length > 0 || items.complementary.length > 0 || items.bundles.length > 0;
  if (!hasAny) return null;

  return (
    <div className="rounded-[var(--radius-xl2)] border border-line p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-accent">
          <Bot className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">AI Suggestions</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.complementary.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-ink">Complete the look</span>
            </div>
            <div className="space-y-2">
              {items.complementary.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-line p-2 transition-colors hover:border-accent">
                  <img src={p.images[0]} alt="" className="h-10 w-8 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{p.name}</p>
                    <Price price={p.price} salePrice={p.salePrice} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {items.budget.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-semibold text-ink">Budget options</span>
            </div>
            <div className="space-y-2">
              {items.budget.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-line p-2 transition-colors hover:border-accent">
                  <img src={p.images[0]} alt="" className="h-10 w-8 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{p.name}</p>
                    <Price price={p.price} salePrice={p.salePrice} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {items.bundles.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Gift className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-ink">Bundle & save</span>
            </div>
            <div className="space-y-2">
              {items.bundles.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-line p-2 transition-colors hover:border-accent">
                  <img src={p.images[0]} alt="" className="h-10 w-8 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{p.name}</p>
                    <Price price={p.price} salePrice={p.salePrice} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI FAQ — smart FAQ generation                                      */
/* ------------------------------------------------------------------ */

export function AiProductFAQ({ product }: { product: Product }) {
  const faqs = useMemo(() => genFaqs(product), [product]);

  return (
    <div className="rounded-[var(--radius-xl2)] border border-line p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-accent">
          <Bot className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">AI FAQs</span>
      </div>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-lg border border-line [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface2/50 rounded-lg">
              {faq.q}
              <span className="text-muted transition-transform group-open:rotate-180">▼</span>
            </summary>
            <p className="border-t border-line px-3 py-2.5 text-sm text-muted">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Bundle Suggestions Widget                                       */
/* ------------------------------------------------------------------ */

export function AiBundleSuggestions({ product, limit = 3 }: { product: Product; limit?: number }) {
  const { products } = useStore();

  const items = useMemo(() => bundleSuggestions(product, products, limit), [product, products, limit]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-xl2)] border border-line bg-gradient-to-br from-accent-soft/10 to-surface2/20 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-accent">
          <Gift className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">Bundle Suggestions</span>
      </div>
      <p className="text-sm text-muted mb-4">Pair {product.name} with these complementary pieces for a cohesive edit.</p>
      <div className="flex flex-wrap gap-2">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="group flex items-center gap-2 rounded-xl border border-line bg-surface p-2 pr-3 transition-all hover:border-accent"
          >
            <img src={p.images[0]} alt="" className="h-12 w-10 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink">{p.name}</p>
              <Price price={p.price} salePrice={p.salePrice} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
