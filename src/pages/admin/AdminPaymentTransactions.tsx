/**
 * ALAYA INSIDER — Payment Transactions
 * --------------------------------------------------------------------------
 * Enterprise transactions list with advanced search, filters,
 * pagination, and CSV / PDF / JSON export.
 */

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search, Download, ExternalLink, ArrowUpDown,
  FileText, Printer, ChevronLeft, ChevronRight,
  DollarSign, CreditCard, Ban,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

const API_BASE = "/api/v1";

type SortField = "createdAt" | "amount" | "provider" | "status";
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "paid" | "failed" | "pending" | "refunded" | "cancelled";

interface TxItem {
  id: string;
  paymentIntentId: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  processorFee?: number;
  netAmount?: number;
  description?: string;
  createdAt: number;
}

async function fetchData(url: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${url}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function exportToCsv(items: TxItem[], filename = "transactions") {
  const headers = ["ID", "Provider", "Type", "Amount", "Status", "Fee", "Net", "Date"];
  const rows = items.map((t) => [
    t.id, t.provider, t.type, t.amount, t.status,
    t.processorFee || 0, t.netAmount || t.amount,
    new Date(t.createdAt).toISOString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJson(items: TxItem[], filename = "transactions") {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToPdf(items: TxItem[]) {
  // Simple print-based export
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html><head><title>Transactions Export</title>
    <style>body{font-family:sans-serif;padding:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #ddd;padding:6px;text-align:left}
    th{background:#f5f5f5}</style></head><body>
    <h1>Transaction Report</h1>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
    <table><thead><tr>
      <th>ID</th><th>Provider</th><th>Type</th><th>Amount</th>
      <th>Status</th><th>Fee</th><th>Net</th><th>Date</th>
    </tr></thead><tbody>
    ${items.map((t) => `<tr>
      <td>${t.id.slice(0, 16)}</td>
      <td>${t.provider}</td>
      <td>${t.type}</td>
      <td>$${(t.amount / 100).toFixed(2)}</td>
      <td>${t.status}</td>
      <td>$${((t.processorFee || 0) / 100).toFixed(2)}</td>
      <td>$${((t.netAmount || t.amount) / 100).toFixed(2)}</td>
      <td>${new Date(t.createdAt).toLocaleDateString()}</td>
    </tr>`).join("")}
    </tbody></table></body></html>
  `);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

export default function AdminPaymentTransactions() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    (async () => {
      const deliveries = await fetchData("/webhooks/deliveries?limit=200");
      if (deliveries?.deliveries) {
        setTransactions(
          deliveries.deliveries.map((d: any) => ({
            id: d.id,
            paymentIntentId: d.paymentIntentId || "",
            orderId: d.orderId || "",
            orderNumber: d.orderNumber || "",
            provider: d.provider,
            type: d.eventType?.includes("refund") ? "refund" : d.eventType?.includes("capture") ? "capture" : "sale",
            amount: 0,
            currency: "USD",
            status: d.status === "processed" ? "paid" : d.status === "failed" ? "failed" : d.status,
            processorFee: 0,
            netAmount: 0,
            description: d.eventType || "",
            createdAt: d.createdAt,
          })),
        );
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let items = [...transactions];

    // Filter by status
    if (filterStatus !== "all") {
      items = items.filter((t) => t.status === filterStatus);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.provider.includes(q) ||
          t.type.includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") cmp = a.createdAt - b.createdAt;
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else if (sortField === "provider") cmp = a.provider.localeCompare(b.provider);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [transactions, filterStatus, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        "ml-1 inline h-3 w-3 cursor-pointer",
        sortField === field && "text-accent",
      )}
      onClick={() => toggleSort(field)}
    />
  );

  return (
    <>
      <Seo title="Transactions" path="/admin/payments/transactions" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Transactions</h1>
            <p className="mt-1 text-sm text-muted">
              {filtered.length} transactions · Search, filter, sort, and export payment records.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToCsv(paged)} className="btn-outline btn-sm">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button onClick={() => exportToJson(paged)} className="btn-outline btn-sm">
              <FileText className="h-3.5 w-3.5" /> JSON
            </button>
            <button onClick={() => exportToPdf(paged)} className="btn-outline btn-sm">
              <Printer className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input-field !pl-9"
              placeholder="Search by ID, provider, type..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "paid", "failed", "pending", "refunded", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={cn("chip capitalize", filterStatus === s && "chip-active")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">
                    Transaction ID <SortIcon field="createdAt" />
                  </th>
                  <th className="px-4 py-3">
                    Provider <SortIcon field="provider" />
                  </th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">
                    Amount <SortIcon field="amount" />
                  </th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Net</th>
                  <th className="px-4 py-3">
                    Status <SortIcon field="status" />
                  </th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface2/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{tx.id.slice(0, 20)}…</td>
                    <td className="px-4 py-3 capitalize text-ink">{tx.provider}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "badge bg-surface2 text-muted capitalize flex items-center gap-1 w-fit",
                        tx.type === "refund" && "bg-warning/15 text-warning",
                        tx.type === "sale" && "bg-success/15 text-success",
                      )}>
                        {tx.type === "refund" ? <Ban className="h-3 w-3" /> : tx.type === "sale" ? <DollarSign className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink tabular-nums">
                      {tx.amount > 0 ? <Money amount={tx.amount} /> : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {(tx.processorFee || 0) > 0 ? <Money amount={tx.processorFee || 0} /> : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink tabular-nums">
                      {(tx.netAmount || tx.amount) > 0 ? <Money amount={tx.netAmount || tx.amount} /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "badge capitalize",
                        tx.status === "paid" || tx.status === "processed"
                          ? "bg-success/15 text-success"
                          : tx.status === "failed" || tx.status === "dead_letter"
                            ? "bg-danger/15 text-danger"
                            : "bg-surface2 text-muted",
                      )}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDateTime(tx.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/payments/transactions/${tx.id}`} className="btn-ghost btn-xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paged.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted">No transactions match your filters.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost btn-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg text-xs font-medium transition-colors",
                    page === p ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2",
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost btn-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
