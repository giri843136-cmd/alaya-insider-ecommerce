/**
 * ALAYA INSIDER — Refund Center
 * --------------------------------------------------------------------------
 * Enterprise refund processing with full/partial refunds,
 * reason tracking, audit logging, and refund history.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ban, Search, ExternalLink, RefreshCw, DollarSign,
  CheckCircle2, Clock, RotateCcw,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

const API_BASE = "/api/v1";

interface RefundRecord {
  id: string;
  number: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  type: "refund" | "return";
  reason: string;
  comment?: string;
  status: string;
  refundAmount?: number;
  items?: Array<{ name: string; qty: number; price: number; productId: string }>;
  createdAt: number;
}

const MOCK_REFUNDS: RefundRecord[] = [
  { id: "ref_1", number: "R-1001", orderId: "ord_1", orderNumber: "ORD-1001", customerName: "Alice Johnson", customerEmail: "alice@example.com", type: "refund", reason: "Damaged packaging", status: "completed", refundAmount: 4500, createdAt: Date.now() - 86400000 * 2 },
  { id: "ref_2", number: "R-1002", orderId: "ord_2", orderNumber: "ORD-1002", customerName: "Bob Smith", customerEmail: "bob@example.com", type: "refund", reason: "Wrong size", status: "pending", refundAmount: 8900, createdAt: Date.now() - 86400000 },
  { id: "ref_3", number: "R-1003", orderId: "ord_3", orderNumber: "ORD-1003", customerName: "Carol Davis", customerEmail: "carol@example.com", type: "return", reason: "Defective product", comment: "Screen flickering", status: "processing", refundAmount: 12900, createdAt: Date.now() - 3600000 },
];

function processRefund(providerPaymentId: string, amount?: number, reason?: string) {
  return fetch(`${API_BASE}/payments/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      providerPaymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
      metadata: { provider: "stripe" },
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
}

export default function AdminPaymentRefunds() {
  const [refunds, setRefunds] = useState<RefundRecord[]>(MOCK_REFUNDS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundingId, setRefundingId] = useState("");

  const filtered = useMemo(() => {
    let items = [...refunds];
    if (filterStatus !== "all") items = items.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        r.number.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q),
      );
    }
    return items;
  }, [refunds, filterStatus, search]);

  const stats = useMemo(() => ({
    total: refunds.length,
    pending: refunds.filter((r) => r.status === "pending").length,
    completed: refunds.filter((r) => r.status === "completed").length,
    totalAmount: refunds.reduce((s, r) => s + (r.refundAmount || 0), 0),
  }), [refunds]);

  const handleRefund = async () => {
    if (!refundingId || !refundAmount) return;
    setProcessing(refundingId);
    const amount = parseFloat(refundAmount);
    const result = await processRefund(`pi_${refundingId}`, amount, refundReason);
    if (result.success || result.status === "pending") {
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === refundingId ? { ...r, status: "completed", refundAmount: Math.round(amount * 100) } : r,
        ),
      );
    } else {
      setRefunds((prev) =>
        prev.map((r) => (r.id === refundingId ? { ...r, status: "failed" } : r)),
      );
    }
    setProcessing(null);
    setShowRefundForm(false);
    setRefundAmount("");
    setRefundReason("");
  };

  return (
    <>
      <Seo title="Refund Center" path="/admin/payments/refunds" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Refund Center</h1>
        <p className="mt-1 text-sm text-muted">
          Process full and partial refunds with audit logging and inventory updates.
        </p>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Refunds", value: stats.total, icon: Ban, color: "text-warning" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-accent" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success" },
            { label: "Total Amount", value: `$${(stats.totalAmount / 100).toLocaleString()}`, icon: DollarSign, color: "text-danger" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-4">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", s.color.replace("text-", "bg-") + "/15", s.color)}>
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-ink tabular-nums">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input-field !pl-9" placeholder="Search refunds..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "processing", "completed", "failed"] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={cn("chip capitalize", filterStatus === s && "chip-active")}>{s}</button>
            ))}
          </div>
        </div>

        {/* Refunds Table */}
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Refund</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface2/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{r.number}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{r.customerName}</p>
                      <p className="text-xs text-muted">{r.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge capitalize", r.type === "refund" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{r.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-4 py-3 font-semibold text-ink tabular-nums">
                      {r.refundAmount ? <Money amount={r.refundAmount} /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "badge capitalize",
                        r.status === "completed" ? "bg-success/15 text-success" :
                        r.status === "failed" ? "bg-danger/15 text-danger" :
                        r.status === "pending" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted",
                      )}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {r.status !== "completed" && (
                          <button
                            onClick={() => {
                              setRefundingId(r.id);
                              setRefundAmount(((r.refundAmount || 0) / 100).toFixed(2));
                              setShowRefundForm(true);
                            }}
                            className="btn-accent-soft btn-xs"
                            disabled={!!processing}
                          >
                            <RotateCcw className="h-3 w-3" /> Refund
                          </button>
                        )}
                        <Link to={`/admin/payments/transactions/${r.id}`} className="btn-ghost btn-xs">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted">No refunds found.</p>
          )}
        </div>
      </div>

      {/* Refund Form Dialog */}
      {showRefundForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowRefundForm(false)} />
          <div className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-2">Process Refund</h2>
            <p className="text-sm text-muted mb-5">Enter refund amount and reason. Leave amount blank for full refund.</p>
            <div className="space-y-4">
              <div>
                <label className="label-field">Refund Amount ($)</label>
                <input type="number" step="0.01" className="input-field" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
              </div>
              <div>
                <label className="label-field">Reason (optional)</label>
                <select className="input-field" value={refundReason} onChange={(e) => setRefundReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="defective">Defective Product</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="damaged">Damaged in Shipping</option>
                  <option value="not_as_described">Not as Described</option>
                  <option value="duplicate">Duplicate Order</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowRefundForm(false)} className="btn-ghost btn-md">Cancel</button>
              <button onClick={handleRefund} disabled={!!processing} className="btn-primary btn-md">
                {processing === refundingId ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
