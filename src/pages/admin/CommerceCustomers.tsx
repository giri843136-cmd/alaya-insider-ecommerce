import { useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import type { Customer } from "../../lib/types";
import { cn } from "@/utils/cn";

export default function CommerceCustomers() {
  const { customers, orders } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [customers, query]);

  const ordersFor = (c: Customer) => orders.filter(o => o.customer.email.toLowerCase() === c.email.toLowerCase());
  const ltv = (c: Customer) => ordersFor(c).reduce((s, o) => s + o.total, 0);
  const segment = (c: Customer, ltvVal: number): string => {
    if (c.status === "vip") return "VIP";
    if (ltvVal >= 1000) return "High Value";
    if (ltvVal >= 300) return "Regular";
    if (ordersFor(c).length > 1) return "Returning";
    return "New";
  };

  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = { VIP: 0, "High Value": 0, Regular: 0, Returning: 0, New: 0 };
    customers.forEach(c => { const s = segment(c, ltv(c)); counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [customers]);

  return (
    <>
      <Seo title="Commerce Customers" path="/admin/commerce/customers" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Customer Management</h1>
        <p className="mt-1 text-sm text-muted">{customers.length} customers · LTV, segments, and journey tracking.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(segmentCounts).map(([seg, count], i) => (
            <div key={seg} className="card p-4 text-center">
              <p className={cn("font-display text-2xl font-semibold", i === 0 ? "text-accent" : "text-ink")}>{count}</p>
              <p className="text-xs text-muted">{seg} Customers</p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customers…" className="input-field pl-9" />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Users className="h-6 w-6" />} title="No customers" /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => {
              const ords = ordersFor(c);
              const val = ltv(c);
              const seg = segment(c, val);
              return (
                <button key={c.id} onClick={() => setSelected(c)} className="card p-5 text-left transition-all hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold", seg === "VIP" ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>{c.name[0]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{c.name}</p>
                      <p className="truncate text-xs text-muted">{c.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className={cn("badge", seg === "VIP" ? "bg-accent text-accent-ink" : seg === "High Value" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{seg}</span>
                    <span className="text-muted">{ords.length} orders</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted">LTV</span>
                    <span className="font-semibold text-ink"><Money amount={val} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Detail */}
      {selected && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
          <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-canvas animate-drawer p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Customer Profile</h2>
              <button onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-xl font-semibold text-accent-ink">{selected.name[0]}</span>
              <div>
                <p className="font-display text-xl font-semibold text-ink">{selected.name}</p>
                <p className="text-sm text-muted">{selected.email}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-line bg-surface p-3"><p className="font-display text-xl font-semibold text-accent">{ordersFor(selected).length}</p><p className="text-xs text-muted">Orders</p></div>
              <div className="rounded-xl border border-line bg-surface p-3"><p className="font-display text-xl font-semibold text-accent"><Money amount={ltv(selected)} /></p><p className="text-xs text-muted">LTV</p></div>
              <div className="rounded-xl border border-line bg-surface p-3"><p className="font-display text-xl font-semibold text-accent">{selected.addresses.length}</p><p className="text-xs text-muted">Addresses</p></div>
            </div>

            {selected.timeline.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Timeline</p>
                <div className="space-y-3">
                  {selected.timeline.slice(0, 10).map(t => (
                    <div key={t.id} className="flex items-start gap-3">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <div>
                        <p className="text-sm text-ink">{t.label}</p>
                        <p className="text-xs text-muted">{formatDateTime(t.ts)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ordersFor(selected).length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Order History</p>
                <div className="space-y-2">
                  {ordersFor(selected).map(o => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{o.number}</p>
                        <p className="text-xs text-muted">{formatDateTime(o.createdAt)} · {o.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <span className={cn("badge capitalize", o.status === "delivered" ? "bg-success/15 text-success" : "bg-accent-soft text-accent")}>{o.status}</span>
                        <p className="mt-1 text-sm font-semibold text-ink"><Money amount={o.total} /></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
