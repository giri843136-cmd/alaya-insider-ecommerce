import { useEffect, useState } from "react";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  Trash2,
  Play,
  Database,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { getApiConfig } from "@/lib/api-config";
import {
  getAllSyncKeys,
  getSyncSnapshot,
  getOfflineQueue,
  processOfflineQueue,
  clearCompletedQueue,
  saveSyncSnapshot,
  type SyncSnapshot,
  type OfflineEntry,
} from "@/lib/mobilePlatform";

export default function AdminSynchronization() {
  const [syncs, setSyncs] = useState<SyncSnapshot[]>([]);
  const [queue, setQueue] = useState<OfflineEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const keys = getAllSyncKeys();
    const snapshots = keys.map((key) => getSyncSnapshot(key)).filter(Boolean) as SyncSnapshot[];
    setSyncs(snapshots);
    setQueue(getOfflineQueue());
  }, [refresh]);

  const handleProcessQueue = async () => {
    setProcessing(true);
    const apiUrl = getApiConfig().apiUrl;
    if (!apiUrl) {
      // Backend not configured — skip queue processing
      setProcessing(false);
      return;
    }
    await processOfflineQueue(async (entry) => {
      try {
        // Dispatch each queued action to the backend API
        const res = await fetch(apiUrl + entry.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.payload || {}),
        });
        return res.ok;
      } catch {
        return false;
      }
    });
    setProcessing(false);
    setRefresh((n) => n + 1);
  };

  const handleClearCompleted = () => {
    clearCompletedQueue();
    setRefresh((n) => n + 1);
  };

  const handleAddSampleData = () => {
    const keys = ["cart", "wishlist", "bookmarks", "reading_progress", "preferences"];
    keys.forEach((key) => {
      saveSyncSnapshot(key, {
        items: [],
        updatedAt: Date.now(),
      });
    });
    setRefresh((n) => n + 1);
  };

  const pendingCount = queue.filter((e) => e.status === "pending").length;
  const completedCount = queue.filter((e) => e.status === "completed").length;
  const failedCount = queue.filter((e) => e.status === "failed").length;

  const queueBadge = (status: string): "success" | "warning" | "info" => {
    if (status === "completed") return "success";
    if (status === "pending") return "warning";
    return "info";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-m text-ink">Synchronization</h1>
        <p className="mt-1 text-sm text-muted">
          Cross-device sync management, offline queue processing, and conflict resolution
        </p>
      </div>

      {/* Queue overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Snapshots</span>
          </div>
          <p className="text-2xl font-bold text-ink">{syncs.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Pending</span>
          </div>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Completed</span>
          </div>
          <p className="text-2xl font-bold text-success">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Failed</span>
          </div>
          <p className="text-2xl font-bold text-danger">{failedCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleProcessQueue}
          disabled={processing || pendingCount === 0}
          className="btn-primary btn-sm"
        >
          <Play className="h-4 w-4" />
          {processing ? "Processing…" : "Process Queue"}
        </button>
        <button
          onClick={handleClearCompleted}
          disabled={completedCount === 0}
          className="btn-outline btn-sm"
        >
          <Trash2 className="h-4 w-4" />
          Clear Completed
        </button>
        <button onClick={handleAddSampleData} className="btn-ghost btn-sm">
          <Database className="h-4 w-4" />
          Add Sample Data
        </button>
      </div>

      {/* Sync snapshots */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Sync Snapshots</h2>
        {syncs.length === 0 ? (
          <p className="text-sm text-muted">No sync snapshots yet. Click "Add Sample Data" to create some, or use the app to generate sync data.</p>
        ) : (
          <div className="space-y-2">
            {syncs.map((snap) => (
              <div key={snap.key} className="flex items-center gap-3 rounded-lg bg-surface2 px-4 py-3">
                <ArrowLeftRight className="h-4 w-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink capitalize">{snap.key.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted">
                    v{snap.version} · {formatDateTime(snap.timestamp)}
                  </p>
                </div>
                <Badge variant="info">v{snap.version}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Queue */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Offline Queue</h2>
          <Badge variant={pendingCount > 0 ? "warning" : "success"}>
            {queue.length} items
          </Badge>
        </div>
        {queue.length === 0 ? (
          <p className="text-sm text-muted">Queue is empty.</p>
        ) : (
          <div className="space-y-1">
            {queue.slice(-15).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2">
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  entry.status === "completed" && "bg-success",
                  entry.status === "pending" && "bg-warning",
                  entry.status === "failed" && "bg-danger",
                  entry.status === "syncing" && "bg-info",
                )} />
                <span className="flex-1 text-sm text-ink truncate">{entry.action}</span>
                <span className="text-xs text-muted shrink-0">{entry.retries}/{entry.maxRetries}</span>
                <Badge variant={queueBadge(entry.status)}>
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync strategy */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Sync Strategies</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            {
              key: "Cart",
              strategy: "Bidirectional",
              conflict: "Last-writer-wins",
            },
            {
              key: "Wishlist",
              strategy: "Bidirectional",
              conflict: "Merge",
            },
            {
              key: "Bookmarks",
              strategy: "Push",
              conflict: "Remote wins",
            },
            {
              key: "Preferences",
              strategy: "Bidirectional",
              conflict: "Last-writer-wins",
            },
            {
              key: "Reading Progress",
              strategy: "Push",
              conflict: "Last-writer-wins",
            },
            {
              key: "Theme",
              strategy: "Bidirectional",
              conflict: "Remote wins",
            },
          ].map((strategy) => (
            <div key={strategy.key} className="rounded-lg border border-line bg-surface p-3">
              <div className="mb-2 flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-ink">{strategy.key}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <ArrowLeftRight className="h-3 w-3" />
                <span>{strategy.strategy}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <AlertTriangle className="h-3 w-3" />
                <span>{strategy.conflict}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


