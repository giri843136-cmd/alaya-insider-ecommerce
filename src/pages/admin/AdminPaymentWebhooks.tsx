/**
 * ALAYA INSIDER — Webhook Logs
 * --------------------------------------------------------------------------
 * Enterprise webhook event viewer with full payload inspection,
 * retry/replay capabilities, search, and export.
 */

import { useMemo, useState, useEffect } from "react";
import {
  Search, RotateCcw,
  CheckCircle2, XCircle, Clock, AlertTriangle, Eye,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

const API_BASE = "/api/v1";

interface WebhookDelivery {
  id: string;
  provider: string;
  eventType: string;
  providerEventId: string;
  status: string;
  signature: string;
  signatureValid: boolean;
  idempotent: boolean;
  processedAt?: number;
  failureReason?: string;
  retryCount: number;
  lastRetryAt?: number;
  nextRetryAt?: number;
  orderId?: string;
  paymentIntentId?: string;
  createdAt: number;
}

async function fetchData(url: string): Promise<any> {
  try { const r = await fetch(`${API_BASE}${url}`); if (!r.ok) return null; return await r.json(); } catch { return null; }
}

export default function AdminPaymentWebhooks() {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deadLetters, setDeadLetters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<WebhookDelivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"deliveries" | "dead_letter" | "stats">("deliveries");

  useEffect(() => {
    (async () => {
      const [d, dl, s] = await Promise.all([
        fetchData("/webhooks/deliveries?limit=200"),
        fetchData("/webhooks/dead-letter"),
        fetchData("/webhooks/stats"),
      ]);
      if (d?.deliveries) setDeliveries(d.deliveries);
      if (dl?.deadLetter) setDeadLetters(dl.deadLetter);
      if (s?.stats) setStats(s.stats);
    })();
  }, []);

  const handleRetry = async (id: string) => {
    setLoading(true);
    await fetch(`${API_BASE}/webhooks/dead-letter/${id}/retry`, { method: "POST" });
    const dl = await fetchData("/webhooks/dead-letter");
    if (dl?.deadLetter) setDeadLetters(dl.deadLetter);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let items = tab === "dead_letter" ? deadLetters.map((d) => d.originalDelivery) : deliveries;
    if (filterProvider !== "all") items = items.filter((d) => d.provider === filterProvider);
    if (filterStatus !== "all") items = items.filter((d) => d.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((d) =>
        d.id?.toLowerCase().includes(q) ||
        d.eventType?.toLowerCase().includes(q) ||
        d.providerEventId?.toLowerCase().includes(q) ||
        d.orderId?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [deliveries, deadLetters, tab, filterProvider, filterStatus, search]);

  const statusIcon = (status: string) => {
    if (status === "processed") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "failed" || status === "dead_letter") return <XCircle className="h-4 w-4 text-danger" />;
    if (status === "received" || status === "processing") return <Clock className="h-4 w-4 text-warning" />;
    return <AlertTriangle className="h-4 w-4 text-muted" />;
  };

  return (
    <>
      <Seo title="Webhook Logs" path="/admin/payments/webhooks" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Webhook Logs</h1>
        <p className="mt-1 text-sm text-muted">
          Inspect, retry, and export webhook events. {deliveries.length} events logged.
        </p>

        {/* Stats Cards */}
        {stats && (
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {[
              { label: "Total", value: stats.total, color: "text-ink" },
              { label: "Processed", value: stats.processed, color: "text-success" },
              { label: "Failed", value: stats.failed, color: "text-danger" },
              { label: "Dead Letter", value: stats.deadLetter, color: "text-danger" },
              { label: "Providers", value: Object.keys(stats.byProvider || {}).length, color: "text-accent" },
            ].map((s) => (
              <div key={s.label} className="card p-3 text-center">
                <p className={cn("font-display text-xl font-semibold tabular-nums", s.color)}>{s.value}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs & Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {(["deliveries", "dead_letter", "stats"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input-field !h-8 !pl-9 !text-xs" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field !h-8 !w-[120px] !text-xs" value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
            <option value="all">All Providers</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
          </select>
          <select className="input-field !h-8 !w-[120px] !text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
            <option value="dead_letter">Dead Letter</option>
            <option value="received">Received</option>
          </select>
        </div>

        {/* Webhook List */}
        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="card p-8 text-center text-sm text-muted">No webhook events found.</p>
          ) : (
            filtered.map((d: WebhookDelivery) => (
              <div key={d.id} className="card card-hover p-3 flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setSelected(d)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {statusIcon(d.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{d.eventType || d.providerEventId}</p>
                    <p className="text-xs text-muted">
                      {d.provider} · {d.id?.slice(0, 12)}…
                      {d.retryCount > 0 && ` · ${d.retryCount} retries`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "badge text-[0.6rem]",
                    d.status === "processed" ? "bg-success/15 text-success" :
                    d.status === "failed" || d.status === "dead_letter" ? "bg-danger/15 text-danger" :
                    "bg-surface2 text-muted",
                  )}>{d.status}</span>
                  <span className="text-xs text-muted">{formatDateTime(d.createdAt)}</span>
                  {d.status !== "processed" && d.status !== "dead_letter" && (
                    <button onClick={(e) => { e.stopPropagation(); handleRetry(d.id); }} disabled={loading} className="btn-ghost btn-xs">
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                  <Eye className="h-4 w-4 text-muted" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      {selected && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
          <div className="card relative z-10 w-full max-w-2xl p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-ink">Webhook Event</h2>
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2">✕</button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Event ID</dt><dd className="font-mono text-xs text-ink">{selected.id}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Provider</dt><dd className="capitalize text-ink">{selected.provider}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Event Type</dt><dd className="text-ink">{selected.eventType}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Provider Event ID</dt><dd className="font-mono text-xs text-ink">{selected.providerEventId}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Status</dt><dd><span className={cn("badge", selected.status === "processed" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{selected.status}</span></dd></div>
              <div className="flex justify-between"><dt className="text-muted">Signature Valid</dt><dd>{selected.signatureValid ? <CheckCircle2 className="inline h-4 w-4 text-success" /> : <XCircle className="inline h-4 w-4 text-danger" />}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Idempotent</dt><dd>{selected.idempotent ? "Yes" : "No"}</dd></div>
              {selected.failureReason && <div className="flex justify-between"><dt className="text-muted">Failure Reason</dt><dd className="text-danger max-w-[300px] text-right">{selected.failureReason}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Retry Count</dt><dd>{selected.retryCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Order ID</dt><dd className="font-mono text-xs text-ink">{selected.orderId || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Payment Intent</dt><dd className="font-mono text-xs text-ink">{selected.paymentIntentId || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Created</dt><dd>{formatDateTime(selected.createdAt)}</dd></div>
              {selected.processedAt && <div className="flex justify-between"><dt className="text-muted">Processed</dt><dd>{formatDateTime(selected.processedAt)}</dd></div>}
            </dl>
            {selected.status !== "processed" && (
              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <button onClick={() => handleRetry(selected.id)} className="btn-primary btn-sm">
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
