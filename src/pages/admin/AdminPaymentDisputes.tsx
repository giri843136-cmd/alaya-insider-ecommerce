/**
 * ALAYA INSIDER — Dispute Center
 * --------------------------------------------------------------------------
 * Enterprise chargeback/dispute management with evidence upload,
 * status timeline, admin actions, and finance reporting.
 */

import { useMemo, useState } from "react";

import {
  AlertTriangle, Shield, Search, Upload, MessageSquare,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

interface DisputeRecord {
  id: string;
  number: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  reason: string;
  status: "warning_needs_response" | "warning_under_review" | "warning_closed" | "needs_response" | "under_review" | "won" | "lost";
  currency: string;
  evidenceSubmitted: boolean;
  dueBy?: number;
  timeline: Array<{ action: string; detail: string; timestamp: number }>;
  createdAt: number;
}

const MOCK_DISPUTES: DisputeRecord[] = [
  {
    id: "dp_1", number: "D-1001", orderId: "ord_5", orderNumber: "ORD-1005",
    customerName: "Eve Wilson", customerEmail: "eve@example.com",
    amount: 12900, reason: "Product not received", currency: "USD",
    status: "needs_response", evidenceSubmitted: false,
    dueBy: Date.now() + 86400000 * 5,
    timeline: [
      { action: "dispute.created", detail: "Customer filed chargeback with card issuer", timestamp: Date.now() - 86400000 * 2 },
      { action: "notification.sent", detail: "Dispute notification sent to admin", timestamp: Date.now() - 86400000 * 2 + 3600000 },
    ],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "dp_2", number: "D-1002", orderId: "ord_8", orderNumber: "ORD-1008",
    customerName: "Frank Miller", customerEmail: "frank@example.com",
    amount: 4500, reason: "Defective item", currency: "USD",
    status: "under_review", evidenceSubmitted: true,
    timeline: [
      { action: "dispute.created", detail: "Customer filed chargeback - defective item", timestamp: Date.now() - 86400000 * 7 },
      { action: "evidence.submitted", detail: "Shipping proof and product photos uploaded", timestamp: Date.now() - 86400000 * 5 },
      { action: "under_review", detail: "Bank is reviewing submitted evidence", timestamp: Date.now() - 86400000 * 3 },
    ],
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "dp_3", number: "D-1003", orderId: "ord_12", orderNumber: "ORD-1012",
    customerName: "Grace Lee", customerEmail: "grace@example.com",
    amount: 8900, reason: "Unauthorized transaction", currency: "USD",
    status: "won", evidenceSubmitted: true,
    timeline: [
      { action: "dispute.created", detail: "Customer claimed unauthorized transaction", timestamp: Date.now() - 86400000 * 14 },
      { action: "evidence.submitted", detail: "IP logs and device fingerprint provided", timestamp: Date.now() - 86400000 * 12 },
      { action: "won", detail: "Bank ruled in merchant favor - transaction authorized", timestamp: Date.now() - 86400000 * 2 },
    ],
    createdAt: Date.now() - 86400000 * 14,
  },
];

type Tab = "all" | "needs_response" | "under_review" | "won" | "lost";

export default function AdminPaymentDisputes() {
  const [disputes] = useState<DisputeRecord[]>(MOCK_DISPUTES);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DisputeRecord | null>(null);

  const filtered = useMemo(() => {
    let items = [...disputes];
    if (tab !== "all") items = items.filter((d) => d.status.includes(tab));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((d) =>
        d.number.toLowerCase().includes(q) ||
        d.orderNumber.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q),
      );
    }
    return items;
  }, [disputes, tab, search]);

  const statusColor = (status: string) => {
    if (status === "won") return "bg-success/15 text-success";
    if (status === "lost") return "bg-danger/15 text-danger";
    if (status.includes("warning") || status === "needs_response") return "bg-warning/15 text-warning";
    return "bg-accent-soft text-accent";
  };

  return (
    <>
      <Seo title="Dispute Center" path="/admin/payments/disputes" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Dispute Center</h1>
        <p className="mt-1 text-sm text-muted">
          Manage chargebacks, upload evidence, and track dispute resolutions.
        </p>

        {/* Alert for disputes needing response */}
        {disputes.some((d) => d.status === "needs_response") && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-5 py-3 text-sm text-danger">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              {disputes.filter((d) => d.status === "needs_response").length} dispute(s) require your response.
              Evidence must be submitted before the deadline.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {(["all", "needs_response", "under_review", "won", "lost"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>
              {t.replace("_", " ")}
              {t !== "all" && ` (${disputes.filter((d) => d.status.includes(t)).length})`}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input-field !h-8 !w-48 !pl-9 !text-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Disputes */}
        <div className="mt-4 space-y-3">
          {filtered.map((d) => (
            <div key={d.id} className="card card-hover p-4" onClick={() => setSelected(d)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", statusColor(d.status))}>
                    <Shield className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{d.number}</p>
                      <span className="text-xs text-muted">· {d.orderNumber}</span>
                    </div>
                    <p className="text-sm text-muted truncate">{d.customerName} · {d.reason}</p>
                    <p className="text-xs text-muted mt-0.5">{formatDateTime(d.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-ink tabular-nums"><Money amount={d.amount} /></p>
                    <span className={cn("badge text-[0.6rem]", statusColor(d.status))}>
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {d.dueBy && d.status === "needs_response" && (
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-danger font-medium">
                        Due {formatDateTime(d.dueBy)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dispute Detail Dialog */}
        {selected && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
            <div className="card relative z-10 w-full max-w-2xl p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selected.number}</h2>
                  <p className="text-sm text-muted">{selected.orderNumber} · {selected.customerName} · {selected.customerEmail}</p>
                </div>
                <span className={cn("badge", statusColor(selected.status))}>{selected.status.replace(/_/g, " ")}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-surface2/50 p-4">
                  <p className="text-xs text-muted uppercase tracking-wider">Dispute Amount</p>
                  <p className="mt-1 font-display text-xl font-semibold text-danger"><Money amount={selected.amount} /></p>
                </div>
                <div className="rounded-xl bg-surface2/50 p-4">
                  <p className="text-xs text-muted uppercase tracking-wider">Reason</p>
                  <p className="mt-1 text-sm text-ink">{selected.reason}</p>
                </div>
                <div className="rounded-xl bg-surface2/50 p-4">
                  <p className="text-xs text-muted uppercase tracking-wider">Evidence</p>
                  <p className="mt-1 font-medium text-ink">{selected.evidenceSubmitted ? "Submitted" : "Not submitted"}</p>
                  {selected.dueBy && !selected.evidenceSubmitted && (
                    <p className="text-xs text-danger mt-1">Due {formatDateTime(selected.dueBy)}</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Dispute Timeline</h3>
                <div className="space-y-3">
                  {selected.timeline.map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-3 w-3 rounded-full border-2",
                          i === selected.timeline.length - 1
                            ? "border-accent bg-accent"
                            : "border-line bg-surface2",
                        )} />
                        {i < selected.timeline.length - 1 && <div className="mt-0.5 h-full w-px bg-line" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-ink capitalize">{entry.action.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted">{entry.detail}</p>
                        <p className="text-xs text-muted/70 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selected.status === "needs_response" && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
                  <button className="btn-primary btn-md">
                    <Upload className="h-4 w-4" /> Upload Evidence
                  </button>
                  <button className="btn-outline btn-md">
                    <MessageSquare className="h-4 w-4" /> Submit Response
                  </button>
                  <button className="btn-ghost btn-md text-danger">Accept Liability</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
