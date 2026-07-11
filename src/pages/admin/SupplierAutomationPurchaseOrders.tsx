import { useState, useMemo } from "react";
import { Receipt, Search, X, Download, Printer, Clock, ExternalLink } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getPurchaseOrders, updatePurchaseOrder } from "../../lib/supplier-automation";
import type { PurchaseOrder } from "../../lib/commerce-types";
import { formatDate } from "../../lib/utils";

export default function SupplierAutomationPurchaseOrders() {
  const [pos, setPos] = useState<PurchaseOrder[]>(getPurchaseOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);

  const refresh = () => setPos(getPurchaseOrders());

  const filtered = useMemo(() => pos.filter(po => {
    if (search && !po.number.toLowerCase().includes(search.toLowerCase()) && !po.supplierName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && po.status !== statusFilter) return false;
    return true;
  }), [pos, search, statusFilter]);

  const statusColor: Record<string, string> = { draft: "bg-surface2 text-muted", sent: "bg-info/15 text-info", confirmed: "bg-accent/15 text-accent", shipped: "bg-warning/15 text-warning", received: "bg-success/15 text-success", cancelled: "bg-danger/15 text-danger" };

  return (
    <>
      <Seo title="Purchase Orders" path="/admin/commerce/supplier-automation/purchase-orders" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Purchase Orders</h1>
            <p className="mt-1 text-sm text-muted">{pos.length} auto-generated POs.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input-field pl-9" placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option><option value="sent">Sent</option><option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
          </select>
          <button onClick={refresh} className="btn-ghost btn-sm"><Download className="h-4 w-4" /> Refresh</button>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Receipt className="h-6 w-6" />} title="No purchase orders" description="POs are auto-generated when orders are processed through the automation engine." /></div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map(po => (
              <div key={po.id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewing(po)}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent"><Receipt className="h-6 w-6" /></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{po.number}</h3>
                        <span className={cn("badge", statusColor[po.status] || "bg-surface2 text-muted")}>{po.status}</span>
                        {po.sentMethod && <span className="badge bg-surface2 text-muted capitalize">{po.sentMethod}</span>}
                      </div>
                      <p className="text-sm text-muted">{po.supplierName} · Order {po.orderNumber} · {po.customerName}</p>
                      <p className="text-xs text-muted mt-1">Created {formatDate(po.createdAt)}{po.trackingNumber ? ` · Tracking: ${po.trackingNumber}` : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink text-lg"><Money amount={po.total} /></p>
                    <p className="text-xs text-muted">{po.items.length} item{po.items.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {po.items.slice(0, 3).map(item => (
                    <span key={item.productId} className="badge bg-surface2 text-muted text-xs">{item.productName} × {item.quantity}</span>
                  ))}
                  {po.items.length > 3 && <span className="badge bg-surface2 text-muted text-xs">+{po.items.length - 3} more</span>}
                </div>
                {po.expectedDelivery && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted"><Clock className="h-3 w-3" /> Expected by {formatDate(po.expectedDelivery)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail View */}
      {viewing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="card relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink">{viewing.number}</h2>
                <p className="text-sm text-muted">Order {viewing.orderNumber} · {viewing.supplierName}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost btn-sm"><Printer className="h-4 w-4" /> Print</button>
                <button className="btn-ghost btn-sm"><Download className="h-4 w-4" /> PDF</button>
                <button onClick={() => setViewing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Customer</p><p className="font-medium text-ink">{viewing.customerName}</p></div>
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Shipping Method</p><p className="font-medium text-ink capitalize">{viewing.shippingMethod}</p></div>
              <div className="col-span-2 rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Shipping Address</p><p className="text-sm text-ink">{viewing.customerAddress}</p></div>
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Email</p><p className="text-sm text-ink">{viewing.customerEmail}</p></div>
              <div className="rounded-xl bg-surface2/50 p-3"><p className="text-xs text-muted">Phone</p><p className="text-sm text-ink">{viewing.customerPhone}</p></div>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead className="bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Unit Cost</th><th className="px-3 py-2 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {viewing.items.map(item => (
                  <tr key={item.productId} className="hover:bg-surface2/40">
                    <td className="px-3 py-2 text-ink">{item.productName}</td>
                    <td className="px-3 py-2 text-xs font-mono text-muted">{item.productSku}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">${item.unitCost.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="font-semibold"><td colSpan={4} className="px-3 py-2 text-right text-ink">Total</td><td className="px-3 py-2 text-right text-ink">${viewing.total.toFixed(2)}</td></tr></tfoot>
            </table>
            {viewing.trackingNumber && (
              <div className="mt-4 rounded-xl bg-surface2/50 p-3 flex items-center justify-between">
                <div><p className="text-xs text-muted">Tracking Number</p><p className="font-medium text-ink">{viewing.trackingNumber}</p></div>
                {viewing.trackingUrl && <a href={viewing.trackingUrl} target="_blank" rel="noopener" className="btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /> Track</a>}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <select className="input-field w-auto text-sm" value={viewing.status} onChange={e => { updatePurchaseOrder(viewing.id, { status: e.target.value as any }); refresh(); setViewing({...viewing, status: e.target.value as any}); }}>
                <option value="draft">Draft</option><option value="sent">Sent</option><option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
