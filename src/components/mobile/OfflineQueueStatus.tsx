import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { getOfflineQueue, processOfflineQueue, type OfflineEntry } from "@/lib/mobilePlatform";

export function OfflineQueueStatus() {
  const [entries, setEntries] = useState<OfflineEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const update = () => setEntries(getOfflineQueue());
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const pending = entries.filter((e) => e.status === "pending");
  const failed = entries.filter((e) => e.status === "failed");

  if (pending.length === 0 && failed.length === 0) return null;

  const handleProcess = async () => {
    setProcessing(true);
    await processOfflineQueue(async (_entry) => {
      // Simulate processing — in production, this dispatches to the actual API
      await new Promise((r) => setTimeout(r, 500));
      return true;
    });
    setProcessing(false);
    setEntries(getOfflineQueue());
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 md:bottom-6 md:left-auto md:right-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-[var(--shadow-float)] transition-all duration-200",
          failed.length > 0
            ? "bg-danger text-white"
            : "bg-warning text-white"
        )}
      >
        {failed.length > 0 ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span>
          {pending.length > 0 ? `${pending.length} pending` : `${failed.length} failed`}
        </span>
      </button>

      {expanded && (
        <div className="absolute bottom-full left-0 right-0 mb-2 w-72 animate-slide-up rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-float)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Offline Queue
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full p-1 text-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {pending.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-muted">Pending ({pending.length})</p>
              {pending.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 rounded-lg bg-surface2 px-2.5 py-1.5 mb-1">
                  <RefreshCw className="h-3 w-3 animate-spin text-warning" />
                  <span className="flex-1 truncate text-xs text-ink">{entry.action}</span>
                  <span className="text-[0.6rem] text-muted">retry {entry.retries}/{entry.maxRetries}</span>
                </div>
              ))}
            </div>
          )}

          {failed.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-muted">Failed ({failed.length})</p>
              {failed.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 rounded-lg bg-danger/10 px-2.5 py-1.5 mb-1">
                  <AlertTriangle className="h-3 w-3 text-danger" />
                  <span className="flex-1 truncate text-xs text-ink">{entry.action}</span>
                </div>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="btn-primary btn-sm w-full"
            >
              {processing ? "Processing..." : "Retry All"}
            </button>
          )}

          {failed.length > 0 && pending.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-xs text-ink">Queue processed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
