import { useMemo, useState } from "react";
import { Eye, Trash2, X, Receipt, Mail, MapPin, Printer, Truck, Package, Clock, CheckCircle, Ship } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState, Money } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import type { Order, OrderStatus } from "../../lib/types";
import { cn } from "@/utils/cn";
import { ORDER_STATUSES, STATUS_STYLES } from "../../lib/orderStatus";

const FULFILLMENT_STAGES = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "paid", label: "Paid", icon: Package },
  { key: "supplier_ordered", label: "Supplier Ordered", icon: Truck },
  { key: "processing", label: "Processing", icon: Package },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Ship },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const PIPELINE_STAGES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function CommerceOrders() {
  const { orders, products, suppliers, updateOrderStatus, deleteOrder, sendEmail } = useStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<Order | null>(null);
  const [toDelete, setToDelete] = useState<Order | null>(null);
  useEscapeKey(() => setView(null), view !== null);
  useLockBody(view !== null);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "active") return orders.filter(o => ["pending","paid","processing","shipped","packed"].includes(o.status));
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => counts[s] = orders.filter(o => o.status === s).length);
    return counts;
  }, [orders]);

  const getSupplier = (o: Order) => {
    const product = products.find(p => o.items.some(i => i.productId === p.id));
    return product?.supplierId ? suppliers.find(s => s.id === product.supplierId) : undefined;
  };

  return (
    <>
      <Seo title="Order Management" path="/admin/commerce/orders" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Order Management</h1>
        <p className="mt-1 text-sm text-muted">{orders.length} orders · full pipeline with supplier tracking.</p>

        {/* Pipeline Visualization */}
        <div className="mt-6 card p-4">
          <h2 className="text-sm font-semibold text-ink mb-3">Order Pipeline</h2>
          <div className="grid grid-cols-7 gap-2">
            {PIPELINE_STAGES.map(s => (
              <div key={s} className={cn("text-center rounded-xl p-3 transition-colors cursor-pointer", filter === s ? "bg-accent text-accent-ink" : "bg-surface2/50 hover:bg-surface2")} onClick={() => setFilter(s)}>
                <p className={cn("font-display text-xl font-semibold", filter === s ? "text-accent-ink" : "text-ink")}>{pipelineCounts[s] || 0}</p>
                <p className="text-[0.6rem] uppercase tracking-wider mt-1 capitalize">{s.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["all", "active", ...ORDER_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={cn("chip capitalize", filter === s && "chip-active")}>
              {s === "all" ? "All" : s === "active" ? "Active" : s} {s !== "all" && s !== "active" && `·${pipelineCounts[s] || 0}`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Receipt className="h-6 w-6" />} title="No orders" /></div>
        ) : (
          <div className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map(o => {
                    const supplier = getSupplier(o);
                    return (
                      <tr key={o.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3 font-medium text-ink">{o.number}</td>
                        <td className="px-4 py-3"><p className="text-ink">{o.customer.name}</p><p className="text-xs text-muted">{o.customer.email}</p></td>
                        <td className="px-4 py-3 text-muted text-xs">{formatDateTime(o.createdAt)}</td>
                        <td className="px-4 py-3 text-muted">{o.items.length}</td>
                        <td className="px-4 py-3 font-semibold text-ink"><Money amount={o.total} /></td>
                        <td className="px-4 py-3">{supplier ? <span className="text-xs text-accent">{supplier.name}</span> : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">{o.trackingNumber ? <span className="text-xs font-mono text-accent">{o.trackingNumber.slice(0, 12)}…</span> : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">
                          <select value={o.status} onChange={e => { updateOrderStatus(o.id, e.target.value as OrderStatus); toast.success(`Order ${o.number} → ${e.target.value}`); }} className={cn("rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize focus:outline-none", STATUS_STYLES[o.status])}>
                            {ORDER_STATUSES.map(s => <option key={s} value={s} className="bg-surface text-ink">{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setView(o)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => setToDelete(o)} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail */}
      {view && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setView(null)} />
          <div className="card relative z-10 w-full max-w-lg p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-semibold text-ink">{view.number}</h2><p className="text-xs text-muted">{formatDateTime(view.createdAt)}</p></div>
              <button onClick={() => setView(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>

            {/* Fulfillment Timeline */}
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Fulfillment Timeline</h3>
              <div className="space-y-3">
                {FULFILLMENT_STAGES.map((stage, i) => {
                  const active = FULFILLMENT_STAGES.findIndex(s => s.key === view?.status) >= i;
                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", active ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>
                        <stage.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-sm", active ? "font-medium text-ink" : "text-muted")}>{stage.label}</span>
                      {active && i === FULFILLMENT_STAGES.findIndex(s => s.key === view?.status) && <span className="badge bg-accent-soft text-accent text-[0.6rem]">Current</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-surface2/50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><Mail className="h-3.5 w-3.5" /> Customer</p>
                <p className="mt-1.5 text-sm text-ink">{view.customer.name}</p>
                <p className="text-sm text-muted">{view.customer.email}</p>
              </div>
              <div className="rounded-xl bg-surface2/50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><MapPin className="h-3.5 w-3.5" /> Shipping</p>
                <p className="mt-1.5 text-sm text-ink">{view.customer.address}</p>
                <p className="text-sm text-muted">{view.customer.city}, {view.customer.zip}</p>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {view.items.map(it => {
                const prod = products.find(p => p.id === it.productId);
                const cost = prod?.costPrice;
                return (
                  <li key={it.productId} className="flex items-center gap-3">
                    <img src={it.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                      <p className="text-xs text-muted">Qty {it.qty}{cost ? ` · Cost: $${(cost * it.qty).toFixed(2)}` : ""}</p>
                    </div>
                    <span className="text-sm font-medium"><Money amount={it.price * it.qty} /></span>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd><Money amount={view.subtotal} /></dd></div>
              {view.discount > 0 && <div className="flex justify-between"><dt className="text-success">Discount</dt><dd className="text-success">−<Money amount={view.discount} /></dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{view.shipping === 0 ? "Free" : <Money amount={view.shipping} />}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd><Money amount={view.tax} /></dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd><Money amount={view.total} /></dd></div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <button onClick={() => window.print()} className="btn-outline btn-sm"><Printer className="h-3.5 w-3.5" /> Invoice</button>
              <button onClick={() => { sendEmail("order_invoice", view.customer.email, view.number); toast.success("Invoice sent"); }} className="btn-ghost btn-sm"><Mail className="h-3.5 w-3.5" /> Email Invoice</button>
              {view.status !== "shipped" && view.status !== "delivered" && (
                <button onClick={() => { updateOrderStatus(view.id, "shipped"); toast.success("Marked shipped"); }} className="btn-accent-soft btn-sm"><Truck className="h-3.5 w-3.5" /> Mark Shipped</button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Order" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteOrder(toDelete.id); toast.success("Deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Permanently delete <strong>{toDelete?.number}</strong>?
      </Dialog>
    </>
  );
}
