/**
 * BackendStatusDot — Live connection status indicator for the admin navbar.
 * Shows a green/amber/red dot based on backend connectivity, with a tooltip
 * showing the backend URL, last sync time, and any error message.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { checkBackendHealth, getBackendStatus, type BackendStatus } from "../../lib/backend";
import { cn } from "@/utils/cn";

export function BackendStatusDot() {
  const [status, setStatus] = useState<BackendStatus>(getBackendStatus());
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);

  const check = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    const ok = await checkBackendHealth();
    if (mounted.current) {
      setHealthy(ok);
      setStatus(getBackendStatus());
      setChecking(false);
    }
  }, [checking]);

  useEffect(() => {
    mounted.current = true;
    // Check on mount
    check();
    // Re-check every 60 seconds
    const interval = setInterval(check, 60_000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!status.configured) {
    return (
      <Link
        to="/admin/system"
        className="group relative flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface2"
        title="Backend not configured. Click to configure."
      >
        <span className="relative h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-warning opacity-60" />
          <span className="absolute inset-0 animate-ping rounded-full bg-warning opacity-30" />
        </span>
        <span className="hidden sm:inline">No backend</span>
      </Link>
    );
  }

  const dotColor = healthy === true
    ? "bg-success"
    : healthy === false
      ? "bg-danger"
      : "bg-warning";

  const label = healthy === true
    ? "Connected"
    : healthy === false
      ? "Disconnected"
      : "Checking…";

  const lastSync = status.lastSyncAt
    ? new Date(status.lastSyncAt).toLocaleTimeString()
    : null;

  return (
    <div className="group relative flex items-center gap-1.5">
      <button
        onClick={check}
        disabled={checking}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface2 disabled:opacity-50"
        title={`Backend: ${label}${status.lastError ? ` · ${status.lastError}` : ""}`}
      >
        <span className="relative h-2 w-2">
          <span className={`absolute inset-0 rounded-full ${dotColor} ${healthy === null ? "animate-pulse" : ""}`} />
          {healthy === true && (
            <span className={`absolute inset-0 animate-ping rounded-full ${dotColor} opacity-40`} />
          )}
        </span>
        <span className="hidden sm:inline">{label}</span>
      </button>

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 origin-top-right scale-95 rounded-xl border border-line bg-surface p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
        <p className="text-xs font-semibold text-ink">Backend Connection</p>
        <div className="mt-2 space-y-1 text-[0.65rem] text-muted">
          <div className="flex justify-between">
            <span>Status</span>
            <span className={cn("font-medium", healthy === true ? "text-success" : healthy === false ? "text-danger" : "text-warning")}>{label}</span>
          </div>
          <div className="flex justify-between">
            <span>Mode</span>
            <span className="font-medium capitalize text-ink">{status.mode}</span>
          </div>
          <div className="flex justify-between">
            <span>URL</span>
            <span className="max-w-[140px] truncate font-mono text-ink" title={status.healthUrl}>{status.healthUrl || "—"}</span>
          </div>
          {lastSync && (
            <div className="flex justify-between">
              <span>Last sync</span>
              <span className="font-medium text-ink">{lastSync}</span>
            </div>
          )}
          {status.lastError && (
            <div className="mt-1.5 rounded-lg bg-danger/10 px-2 py-1.5 text-[0.6rem] text-danger">
              {status.lastError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
