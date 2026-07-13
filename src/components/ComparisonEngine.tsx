/**
 * ALAYA INSIDER — Comparison Engine Components
 * -------------------------------------------------
 * Side-by-side comparison, feature comparison, spec tables, pros/cons,
 * recommendation score, and AI comparison summary.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Minus,
  Trophy,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import type { Product } from "../lib/types";
import { cn } from "@/utils/cn";
import {
  compareProducts,
  generateComparisonSpecs,
} from "../lib/editorialPlatform";
import { Price } from "./ui";

/* ------------------------------------------------------------------ */
/*  Comparison Score Badge                                            */
/* ------------------------------------------------------------------ */

interface ComparisonScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
}

export function ComparisonScoreBadge({ score, maxScore = 100, size = "md" }: ComparisonScoreBadgeProps) {
  const pct = Math.round((score / maxScore) * 100);
  const color = pct >= 80 ? "text-success" : pct >= 60 ? "text-accent" : pct >= 40 ? "text-amber-500" : "text-muted";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-1",
      color
    )}>
      <div className={cn(
        "grid place-items-center rounded-full border-2 font-bold",
        sizeClasses[size],
        pct >= 80 ? "border-success/30 bg-success/10" : "border-accent/20 bg-accent-soft/50"
      )}>
        {score}
      </div>
      <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">Score</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison Table                                                  */
/* ------------------------------------------------------------------ */

interface ComparisonTableProps {
  products: Product[];
  compact?: boolean;
}

export function ComparisonTable({ products, compact = false }: ComparisonTableProps) {
  const result = useMemo(() => compareProducts(products), [products]);
  const specLabels = useMemo(() => generateComparisonSpecs(products), [products]);

  if (products.length < 2) return null;

  const getSpecValue = (product: Product, label: string): string | number => {
    switch (label) {
      case "Price":
        return `$${product.salePrice ?? product.price}`;
      case "Rating":
        return `${product.rating}/5`;
      case "Type":
        return product.type;
      case "Features":
        return product.features.length > 0 ? product.features[0] : "—";
      default:
        const spec = product.specs?.find((s) => s.label === label);
        return spec?.value ?? "—";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="w-36 p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Feature</th>
            {result.items.map((item) => (
              <th key={item.product.id} className="p-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  {item === result.winner && (
                    <Trophy className="h-4 w-4 text-accent" />
                  )}
                  <Link to={`/product/${item.product.slug}`} className="font-medium text-ink hover:text-accent line-clamp-1">
                    {item.product.name}
                  </Link>
                  <ComparisonScoreBadge score={item.score} size="sm" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {compact ? (
            <>
              {["Price", "Rating", "Type"].map((label) => (
                <tr key={label} className="border-b border-line">
                  <td className="p-3 font-medium text-muted">{label}</td>
                  {result.items.map((item) => (
                    <td key={item.product.id} className="p-3 text-center text-ink">
                      {getSpecValue(item.product, label)}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ) : (
            specLabels.map((label) => (
              <tr key={label} className="border-b border-line">
                <td className="p-3 font-medium text-muted">{label}</td>
                {result.items.map((item) => {
                  const val = getSpecValue(item.product, label);
                  return (
                    <td key={item.product.id} className="p-3 text-center text-ink">
                      {typeof val === "boolean" ? (
                        val ? <Check className="mx-auto h-4 w-4 text-success" /> : <Minus className="mx-auto h-4 w-4 text-line" />
                      ) : (
                        <span className="line-clamp-1">{String(val)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}

          {/* Pros & Cons row */}
          {!compact && (
            <tr className="border-b border-line">
              <td className="p-3 align-top font-medium text-muted">Pros</td>
              {result.items.map((item) => (
                <td key={item.product.id} className="p-3 align-top">
                  <ul className="space-y-1">
                    {item.prosCons.pros.slice(0, 3).map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs text-ink">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {p}
                      </li>
                    ))}
                    {item.prosCons.pros.length === 0 && (
                      <li className="text-xs text-muted">—</li>
                    )}
                  </ul>
                </td>
              ))}
            </tr>
          )}

          {/* Action row */}
          <tr>
            <td className="p-3"></td>
            {result.items.map((item) => (
              <td key={item.product.id} className="p-3 text-center">
                {item.product.affiliate ? (
                  <a href={item.product.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className="btn-dark btn-sm w-full">
                    <ExternalLink className="h-3.5 w-3.5" /> Shop
                  </a>
                ) : (
                  <Link to={`/product/${item.product.slug}`} className="btn-primary btn-sm w-full">
                    <ShoppingBag className="h-3.5 w-3.5" /> View
                  </Link>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Winner summary */}
      {result.winner && result.summary && (
        <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Trophy className="h-4 w-4" /> Recommendation
          </div>
          <p className="mt-1 text-sm text-ink">{result.summary}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Compare Card                                                */
/* ------------------------------------------------------------------ */

interface QuickCompareCardProps {
  products: Product[];
  className?: string;
}

export function QuickCompareCard({ products, className }: QuickCompareCardProps) {
  const result = useMemo(() => compareProducts(products), [products]);

  if (products.length < 2) return null;

  return (
    <div className={cn("rounded-xl border border-line overflow-hidden", className)}>
      <div className="bg-surface2/60 px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <TrendingUp className="h-4 w-4 text-accent" /> Quick comparison
        </h3>
      </div>
      <div className="divide-y divide-line">
        {result.items.slice(0, 3).map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 px-4 py-3">
            <img
              src={item.product.images[0]}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link to={`/product/${item.product.slug}`} className="text-sm font-medium text-ink hover:text-accent line-clamp-1">
                {item.product.name}
              </Link>
              <Price price={item.product.price} salePrice={item.product.salePrice} priceClassName="text-xs" />
            </div>
            <div className="text-right">
              <ComparisonScoreBadge score={item.score} size="sm" />
            </div>
          </div>
        ))}
      </div>
      <Link to="/compare" className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-xs font-medium text-accent hover:bg-accent-soft/30">
        View full comparison
      </Link>
    </div>
  );
}
