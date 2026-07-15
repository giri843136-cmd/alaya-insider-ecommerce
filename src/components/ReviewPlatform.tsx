/**
 * ALAYA INSIDER — Review Platform Components
 * -------------------------------------------------
 * Expert reviews, weighted ratings with breakdown, pros/cons, review highlights,
 * rating distribution chart, and expert verification badges.
 */
import { useMemo } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Trophy,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import type { Review, Product } from "../lib/types";
import { cn } from "@/utils/cn";
import {
  calculateWeightedRating,
  extractProsCons,
  getReviewHighlights,
  getRatingDistribution,
} from "../lib/editorialPlatform";
import { formatDate } from "../lib/utils";

/* ------------------------------------------------------------------ */
/*  Weighted Rating Display                                           */
/* ------------------------------------------------------------------ */

interface WeightedRatingDisplayProps {
  reviews: Review[];
  className?: string;
}

export function WeightedRatingDisplay({ reviews, className }: WeightedRatingDisplayProps) {
  const rating = useMemo(() => calculateWeightedRating(reviews), [reviews]);

  if (reviews.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-line bg-surface p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BarChart3 className="h-4 w-4 text-accent" /> Weighted rating
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-ink">{(Number(rating.overall) || 0).toFixed(1)}</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(rating.overall)
                    ? "fill-accent text-accent"
                    : "text-line"
                )}
                strokeWidth={1.5}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rating.breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="w-20 text-xs capitalize text-muted">{b.label}</span>
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${(b.score / 5) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-6 text-right text-xs font-medium tabular-nums text-ink">
              {b.score.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>Confidence: {Math.round(rating.confidence * 100)}% · {rating.reviewCount} reviews</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pros & Cons Card                                                  */
/* ------------------------------------------------------------------ */

interface ProsConsCardProps {
  pros: string[];
  cons: string[];
  className?: string;
}

export function ProsConsCard({ pros, cons, className }: ProsConsCardProps) {
  if (pros.length === 0 && cons.length === 0) return null;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-success mb-3">
          <ThumbsUp className="h-4 w-4" /> Pros
        </h3>
        <ul className="space-y-2">
          {pros.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-ink">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {p}
            </li>
          ))}
          {pros.length === 0 && (
            <li className="text-sm text-muted">No pros mentioned yet.</li>
          )}
        </ul>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-danger mb-3">
          <ThumbsDown className="h-4 w-4" /> Cons
        </h3>
        <ul className="space-y-2">
          {cons.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
              {c}
            </li>
          ))}
          {cons.length === 0 && (
            <li className="text-sm text-muted">No cons mentioned yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rating Distribution Chart                                         */
/* ------------------------------------------------------------------ */

interface RatingDistributionProps {
  reviews: Review[];
  className?: string;
}

export function RatingDistributionChart({ reviews, className }: RatingDistributionProps) {
  const distribution = useMemo(() => getRatingDistribution(reviews), [reviews]);

  if (reviews.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {distribution.map((d) => (
        <div key={d.stars} className="flex items-center gap-3">
          <span className="w-8 text-right text-xs font-medium text-muted">{d.stars}★</span>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${d.percentage}%` }}
              />
            </div>
          </div>
          <span className="w-10 text-right text-xs tabular-nums text-muted">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Highlights                                                 */
/* ------------------------------------------------------------------ */

interface ReviewHighlightsProps {
  reviews: Review[];
  className?: string;
}

export function ReviewHighlights({ reviews, className }: ReviewHighlightsProps) {
  const highlights = useMemo(() => getReviewHighlights(reviews), [reviews]);

  if (highlights.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Trophy className="h-4 w-4 text-accent" /> Top reviews
      </h3>
      {highlights.map((r) => (
        <div key={r.id} className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {r.author.slice(0, 1)}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  {r.author}
                  {r.verified && (
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  )}
                </p>
                <span className="flex items-center gap-1 text-xs text-muted">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("h-3 w-3", i < r.rating ? "fill-accent text-accent" : "text-line")}
                      strokeWidth={1.5}
                    />
                  ))}
                  <span className="ml-1">{formatDate(r.date)}</span>
                </span>
              </div>
            </div>
            {r.helpful && r.helpful > 0 && (
              <span className="text-xs text-muted">{r.helpful} found helpful</span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>
          <p className="mt-1 text-sm text-muted line-clamp-3">{r.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expert Review Badge                                               */
/* ------------------------------------------------------------------ */

interface ExpertReviewBadgeProps {
  expertName: string;
  expertRole: string;
  verified: boolean;
}

export function ExpertReviewBadge({ expertName, expertRole: _expertRole, verified }: ExpertReviewBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft/50 px-3 py-1.5 text-xs font-medium text-accent">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>Expert review by {expertName}</span>
      {verified && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase">Verified</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Full Review Summary Panel                                         */
/* ------------------------------------------------------------------ */

interface ReviewSummaryPanelProps {
  product: Product;
  className?: string;
}

export function ReviewSummaryPanel({ product, className }: ReviewSummaryPanelProps) {
  const rating = useMemo(() => calculateWeightedRating(product.reviews), [product.reviews]);
  const prosCons = useMemo(() => extractProsCons(product.reviews), [product.reviews]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Customer reviews</h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold text-ink">{(Number(rating.overall) || 0).toFixed(1)}</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-5 w-5", i < Math.round(rating.overall) ? "fill-accent text-accent" : "text-line")}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="text-sm text-muted">{rating.reviewCount} reviews</span>
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="grid gap-6 sm:grid-cols-2">
        <RatingDistributionChart reviews={product.reviews} />
        <WeightedRatingDisplay reviews={product.reviews} />
      </div>

      {/* Pros & Cons */}
      {(prosCons.pros.length > 0 || prosCons.cons.length > 0) && (
        <ProsConsCard pros={prosCons.pros} cons={prosCons.cons} />
      )}

      {/* Review highlights */}
      <ReviewHighlights reviews={product.reviews} />
    </div>
  );
}
