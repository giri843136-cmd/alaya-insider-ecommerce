import { useMemo, useState } from "react";
import { Eye, Trash2, X, Receipt, Mail, MapPin, Printer, Truck } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState, Money } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import type { Order, OrderStatus } from "../../lib/types";
import { cn } from "@/utils/cn";

import { ORDER_STATUSES, STATUS_STYLES, statusLabel } from "../../lib/orderStatus";

export default function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder, sendEmail, settings } = useStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [view, setView] = useState<Order | null>(null);
  const [toDelete, setToDelete] = useState<Order | null>(null);
  useEscapeKey(() => setView(null), view !== null);
  useLockBody(view !== null);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  return (
    <>
      <Seo title="Orders" path="/admin/orders" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>
        <p className="mt-1 text-sm text-muted">Manage and fulfil customer orders.</p>

        {/* Filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(["all", ...ORDER_STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn("chip capitalize", filter === s && "chip-active")}>
              {s === "all" ? "All" : statusLabel(s as OrderStatus)} {s !== "all" && `· ${orders.filter((o) => o.status === s).length}`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Receipt className="h-6 w-6" />} title="No orders here" description="Orders will appear as customers check out." />
          </div>
        ) : (
          <div className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-surface2/40">
                      <td className="px-4 py-3 font-medium text-ink">{o.number}</td>
                      <td className="px-4 py-3">
                        <p className="text-ink">{o.customer.name}</p>
                        <p className="text-xs text-muted">{o.customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-ink"><Money amount={o.total} /></td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => {
                            updateOrderStatus(o.id, e.target.value as OrderStatus);
                            toast.success(`Order ${o.number} → ${e.target.value}`);
                          }}
                          className={cn("rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize focus:outline-none", STATUS_STYLES[o.status])}
                        >
                          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="bg-surface text-ink">{statusLabel(s)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setView(o)} aria-label="View order" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => setToDelete(o)} aria-label="Delete order" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order detail */}
      {view && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Order details">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setView(null)} aria-hidden="true" />
          <div className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">{view.number}</h2>
                <p className="text-xs text-muted">{formatDateTime(view.createdAt)}</p>
              </div>
              <button onClick={() => setView(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-surface2/50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><Mail className="h-3.5 w-3.5" /> Customer</p>
                <p className="mt-1.5 text-sm text-ink">{view.customer.name}</p>
                <p className="text-sm text-muted">{view.customer.email}</p>
                {view.customer.phone && <p className="text-sm text-muted">{view.customer.phone}</p>}
              </div>
              <div className="rounded-xl bg-surface2/50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><MapPin className="h-3.5 w-3.5" /> Shipping</p>
                <p className="mt-1.5 text-sm text-ink">{view.customer.address}</p>
                <p className="text-sm text-muted">{view.customer.city}, {view.customer.zip}</p>
                <p className="text-sm text-muted">{view.customer.country}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {view.items.map((it) => (
                <li key={it.productId} className="flex items-center gap-3">
                  <img src={it.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                    <p className="text-xs text-muted">Qty {it.qty}{it.variant ? ` · ${Object.entries(it.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}` : ""}</p>
                  </div>
                  <span className="text-sm font-medium"><Money amount={it.price * it.qty} /></span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd><Money amount={view.subtotal} /></dd></div>
              {view.discount > 0 && <div className="flex justify-between"><dt className="text-success">Discount</dt><dd className="text-success">−<Money amount={view.discount} /></dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{view.shipping === 0 ? "Free" : <Money amount={view.shipping} />}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd><Money amount={view.tax} /></dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd><Money amount={view.total} /></dd></div>
            </dl>

            {/* Meta: payment, supplier, notes, tracking */}
            <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-xs">
              {view.paymentMethod && <p className="flex justify-between"><span className="text-muted">Payment</span><span className="font-medium text-ink">{view.paymentMethod}</span></p>}
              {view.supplierId && <p className="flex justify-between"><span className="text-muted">Supplier</span><span className="font-medium text-ink">{view.courier}</span></p>}
              {view.trackingNumber && <p className="flex justify-between"><span className="text-muted">Tracking</span><span className="font-medium text-ink">{view.trackingNumber}</span></p>}
              {view.couponCode && <p className="flex justify-between"><span className="text-muted">Coupon</span><span className="font-mono font-medium text-accent">{view.couponCode}</span></p>}
              {view.notes && <p className="flex justify-between gap-3"><span className="shrink-0 text-muted">Order notes</span><span className="text-right text-ink">{view.notes}</span></p>}
              {view.giftMessage && <p className="flex justify-between gap-3"><span className="shrink-0 text-muted">Gift message</span><span className="text-right text-ink">"{view.giftMessage}"</span></p>}
            </div>

            {/* Document actions */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <button onClick={() => window.print()} className="btn-outline btn-sm"><Printer className="h-3.5 w-3.5" /> Invoice</button>
              <button onClick={() => { sendEmail("order_invoice", view.customer.email, view.number); toast.success("Invoice emailed", `Sent to ${view.customer.email}`); }} className="btn-ghost btn-sm"><Mail className="h-3.5 w-3.5" /> Email invoice</button>
              <button onClick={() => { sendEmail("shipping_confirmation", view.customer.email, view.number); toast.success("Shipping email sent"); }} className="btn-ghost btn-sm"><Truck className="h-3.5 w-3.5" /> Mark shipped & notify</button>
            </div>

            <p className="mt-3 text-xs text-muted">Display currency: {settings.currency.code}. Orders are recorded in USD.</p>
          </div>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete order"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { if (toDelete) { deleteOrder(toDelete.id); toast.success("Order deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Permanently delete order <strong>{toDelete?.number}</strong>? This cannot be undone.
      </Dialog>
    </>
  );
}
