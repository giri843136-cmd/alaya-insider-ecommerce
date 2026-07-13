import { useMemo, useState } from "react";
import { Search, Users, Mail, MapPin, X, Package, Calendar, Bell } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";
import type { Customer, Order } from "../../lib/types";
import { cn } from "@/utils/cn";

export default function AdminCustomers() {
  const { customers, orders } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [customers, query]);

  const ordersFor = (c: Customer) => orders.filter((o) => o.customer.email.toLowerCase() === c.email.toLowerCase());

  return (
    <>
      <Seo title="Customers" path="/admin/customers" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-muted">{customers.length} registered accounts.</p>

        <div className="relative mt-6 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="input-field pl-9" />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Users className="h-6 w-6" />} title="No customers found" /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const count = ordersFor(c).length;
              return (
                <button key={c.id} onClick={() => setSelected(c)} className="card p-5 text-left transition-shadow hover:shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{c.name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{c.name}</p>
                      <p className="truncate text-xs text-muted">{c.email}</p>
                    </div>
                    {c.newsletter && <Bell className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {count} orders</span>
                    <span>Since {formatDate(c.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer detail drawer */}
      {selected && (
        <CustomerDrawer customer={selected} orders={ordersFor(selected)} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function CustomerDrawer({ customer, orders, onClose }: { customer: Customer; orders: Order[]; onClose: () => void }) {
  const totalSpend = orders.reduce((s, o) => s + o.total, 0);
  useEscapeKey(onClose, true);
  useLockBody(true);
  return (
    <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true" aria-label={`Customer: ${customer.name}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <aside className="hide-scrollbar relative z-10 h-full w-full max-w-md overflow-y-auto bg-canvas animate-drawer p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Customer profile</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-xl font-semibold text-accent-ink">{customer.name.slice(0, 1)}</span>
          <div>
            <p className="font-display text-xl font-semibold text-ink">{customer.name}</p>
            <p className="text-sm text-muted">{customer.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-line bg-surface p-3"><p className="font-display text-xl font-semibold text-accent">{orders.length}</p><p className="text-xs text-muted">Orders</p></div>
          <div className="rounded-xl border border-line bg-surface p-3"><p className="font-display text-xl font-semibold text-accent"><Money amount={totalSpend} /></p><p className="text-xs text-muted">Spend</p></div>
          <div className="rounded-xl border border-line bg-surface p-3"><p className="font-display text-xl font-semibold text-accent">{customer.addresses.length}</p><p className="text-xs text-muted">Addresses</p></div>
        </div>

        {/* Meta */}
        <div className="mt-6 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-muted"><Calendar className="h-4 w-4" /> Member since {formatDate(customer.createdAt)}</p>
          <p className="flex items-center gap-2 text-muted"><Mail className="h-4 w-4" /> {customer.newsletter ? "Subscribed to newsletter" : "Not subscribed"}</p>
        </div>

        {/* Addresses */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Saved addresses</p>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-muted">No saved addresses.</p>
          ) : (
            <div className="space-y-2">
              {customer.addresses.map((a) => (
                <div key={a.id} className="rounded-xl border border-line bg-surface p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-accent"><MapPin className="h-3.5 w-3.5" /> {a.label}</p>
                  <p className="mt-1 text-sm text-ink">{a.name}</p>
                  <p className="text-xs text-muted">{a.line1}, {a.city}, {a.country} {a.zip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Order history</p>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{o.number}</p>
                    <p className="text-xs text-muted">{formatDateTime(o.createdAt)} · {o.items.length} items</p>
                  </div>
                  <div className="text-right">
                    <span className={cn("badge capitalize", o.status === "delivered" || o.status === "completed" ? "bg-success/15 text-success" : "bg-accent-soft text-accent")}>{o.status}</span>
                    <p className="mt-1 text-sm font-semibold text-ink"><Money amount={o.total} /></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
