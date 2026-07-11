import { useMemo, useState } from "react";
import { RotateCcw, Search, Check, X, Clock } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatDate } from "../../lib/utils";
import type { ReturnRequest, ReturnStatus } from "../../lib/types";
import { cn } from "@/utils/cn";

const STATUS_STYLES: Record<ReturnStatus, string> = {
  requested: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-accent-soft text-accent",
  rejected: "bg-danger/15 text-danger",
  completed: "bg-success/15 text-success",
};

export default function AdminReturns() {
  const { returns, updateReturn } = useStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ReturnStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = returns;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.number.toLowerCase().includes(q) || r.orderNumber.toLowerCase().includes(q) || r.customer.name.toLowerCase().includes(q));
    }
    return list;
  }, [returns, filter, query]);

  const setStatus = (r: ReturnRequest, status: ReturnStatus) => {
    updateReturn(r.id, { status });
    toast.success(`Return ${r.number} → ${status}`);
  };

  return (
    <>
      <Seo title="Returns & Refunds" path="/admin/returns" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Returns & Refunds</h1>
        <p className="mt-1 text-sm text-muted">{returns.filter((r) => r.status === "requested").length} awaiting review · {returns.length} total.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by number or customer…" className="input-field pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "requested", "approved", "completed", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={cn("chip capitalize", filter === s && "chip-active")}>{s}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<RotateCcw className="h-6 w-6" />} title="No returns found" description="Return requests will appear here for review." /></div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{r.number}</p>
                      <span className={cn("badge capitalize", STATUS_STYLES[r.status])}>{r.status}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">Order {r.orderNumber} · {formatDate(r.createdAt)}</p>
                  </div>
                  {r.refundAmount != null && <p className="text-sm font-semibold text-ink">Refund: <Money amount={r.refundAmount} /></p>}
                </div>
                <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Customer</p><p className="text-sm text-ink">{r.customer.name}</p><p className="text-xs text-muted">{r.customer.email}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Request</p><p className="text-sm capitalize text-ink">{r.type}</p><p className="text-xs text-muted">{r.reason}</p></div>
                  <div>{r.comment && <><p className="text-xs font-semibold uppercase tracking-wider text-muted">Comment</p><p className="text-xs text-muted">{r.comment}</p></>}</div>
                </div>
                {r.status === "requested" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setStatus(r, "approved")} className="btn btn-sm bg-accent text-accent-ink hover:brightness-110"><Clock className="h-3.5 w-3.5" /> Approve</button>
                    <button onClick={() => setStatus(r, "completed")} className="btn-success btn-sm"><Check className="h-3.5 w-3.5" /> Complete & refund</button>
                    <button onClick={() => setStatus(r, "rejected")} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><X className="h-3.5 w-3.5" /> Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
