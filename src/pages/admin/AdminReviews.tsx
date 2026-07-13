import { useMemo, useState } from "react";
import { Star, Search, Pin, Trash2, BadgeCheck, MessageSquareText } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";

export default function AdminReviews() {
  const { products, updateProduct } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState(0);

  // Flatten all reviews with their product reference
  const all = useMemo(
    () =>
      products.flatMap((p) =>
        p.reviews.map((r) => ({ ...r, productId: p.id, productName: p.name, productSlug: p.slug }))
      ),
    [products]
  );

  const filtered = useMemo(() => {
    let list = all;
    if (minRating > 0) list = list.filter((r) => r.rating >= minRating);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q) || r.author.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [all, query, minRating]);

  const setReview = (productId: string, reviewId: string, patch: Record<string, unknown>) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateProduct(productId, {
      reviews: product.reviews.map((r) => (r.id === reviewId ? { ...r, ...patch } : r)),
    });
  };

  const remove = (productId: string, reviewId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateProduct(productId, { reviews: product.reviews.filter((r) => r.id !== reviewId) });
    toast.success("Review deleted");
  };

  return (
    <>
      <Seo title="Reviews" path="/admin/reviews" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Review moderation</h1>
        <p className="mt-1 text-sm text-muted">{all.length} reviews across {products.length} products.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reviews…" className="input-field pl-9" />
          </div>
          <div className="flex gap-2">
            {[0, 1, 3, 4, 5].map((r) => (
              <button key={r} onClick={() => setMinRating(r)} className={cn("chip", minRating === r && "chip-active")}>{r === 0 ? "All" : `${r}★ & up`}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<MessageSquareText className="h-6 w-6" />} title="No reviews found" /></div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map((r) => (
              <div key={r.productId + r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-accent text-accent" : "text-line")} strokeWidth={0} />)}</span>
                      <span className="text-sm font-semibold text-ink">{r.title}</span>
                      {r.verified && <span className="badge bg-success/15 text-success"><BadgeCheck className="h-3 w-3" /> Verified</span>}
                      {r.pinned && <span className="badge bg-accent-soft text-accent"><Pin className="h-3 w-3" /> Pinned</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted">{r.body}</p>
                    <p className="mt-2 text-xs text-muted">{r.author} · {formatDate(r.date)} · on <span className="font-medium text-ink">{r.productName}</span></p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => setReview(r.productId, r.id, { pinned: !r.pinned })} aria-label="Toggle pin" className={cn("grid h-8 w-8 place-items-center rounded-full hover:bg-surface2", r.pinned ? "text-accent" : "text-muted")}><Pin className="h-4 w-4" /></button>
                    <button onClick={() => setReview(r.productId, r.id, { verified: !r.verified })} aria-label="Toggle verified" className={cn("grid h-8 w-8 place-items-center rounded-full hover:bg-surface2", r.verified ? "text-accent" : "text-muted")}><BadgeCheck className="h-4 w-4" /></button>
                    <button onClick={() => remove(r.productId, r.id)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
