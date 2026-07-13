import { useMemo, useState } from "react";
import { ScrollText, ShieldCheck, Search } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

const ENTITY_ICON: Record<string, string> = {
  product: "📦",
  category: "🗂️",
  brand: "🏷️",
  order: "🧾",
  coupon: "🎟️",
  article: "📰",
  affiliate: "🤝",
  settings: "⚙️",
  customer: "👤",
  session: "🔐",
};

const ACTION_TONE: Record<string, string> = {
  create: "bg-success/15 text-success",
  update: "bg-accent-soft text-accent",
  delete: "bg-danger/15 text-danger",
};

export default function AdminActivity() {
  const { auditLogs } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const entities = useMemo(
    () => ["all", ...Array.from(new Set(auditLogs.map((l) => l.entity)))],
    [auditLogs]
  );

  const filtered = useMemo(() => {
    let list = auditLogs;
    if (filter !== "all") list = list.filter((l) => l.entity === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          (l.entityId || "").toLowerCase().includes(q) ||
          (l.meta || "").toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [auditLogs, filter, query]);

  const tone = (action: string) => {
    const key = action.split(".").pop() || "";
    return ACTION_TONE[key] || "bg-surface2 text-muted";
  };

  return (
    <>
      <Seo title="Activity log" path="/admin/activity" />
      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-ink">Activity log</h1>
          <span className="badge bg-accent-soft text-accent">{auditLogs.length} entries</span>
        </div>
        <p className="mt-1 text-sm text-muted">Append-only audit trail of every change made across the platform.</p>

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activity…" className="input-field pl-9" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink focus:border-accent focus:outline-none">
            {entities.map((e) => <option key={e} value={e} className="capitalize">{e === "all" ? "All entities" : e}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<ScrollText className="h-6 w-6" />} title="No activity found" description="Try a different search or filter." />
          </div>
        ) : (
          <div className="card mt-6 overflow-hidden">
            <ul className="divide-y divide-line">
              {filtered.map((l) => (
                <li key={l.id} className="flex items-center gap-4 px-4 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-base" aria-hidden="true">
                    {ENTITY_ICON[l.entity] ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-ink">{l.action}</span>
                      <span className={cn("badge", tone(l.action))}>{l.action.split(".").pop()}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      <span className="capitalize">{l.entity}</span>
                      {l.entityId && <> · {l.entityId}</>}
                      {l.meta && <> · {l.meta}</>}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium text-ink capitalize">{l.actor}</p>
                    <p className="text-xs text-muted">{formatDateTime(l.ts)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 rounded-[var(--radius-xl2)] border border-line bg-surface2/40 p-4 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          Logs are capped at the most recent 500 events and persist with your store data. In production these would stream to a SIEM with tamper-evident retention.
        </div>
      </div>
    </>
  );
}
