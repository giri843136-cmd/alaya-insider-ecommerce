import { useState } from "react";
import { Activity, X, RefreshCw, CheckCircle, AlertTriangle, Play, Pause, Radio } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getSyncSchedules, saveSyncSchedules, runSync, getAutomationLogs } from "../../lib/supplier-automation";
import type { SyncSchedule, AutomationLog } from "../../lib/commerce-types";
import { uid, formatDateTime } from "../../lib/utils";

export default function SupplierAutomationTracking() {
  const { suppliers } = useStore();
  const [schedules, setSchedules] = useState<SyncSchedule[]>(getSyncSchedules);
  const [logs, setLogs] = useState<AutomationLog[]>(getAutomationLogs);

  const refresh = () => { setSchedules(getSyncSchedules()); setLogs(getAutomationLogs()); };

  const addSchedule = () => {
    const supplier = suppliers.find(s => s.active);
    if (!supplier) return;
    const newSchedule: SyncSchedule = {
      id: uid("sync"),
      supplierId: supplier.id,
      supplierName: supplier.name,
      syncType: "inventory",
      interval: "30min",
      status: "active",
      errorCount: 0,
      createdAt: Date.now(),
    };
    const updated = [...schedules, newSchedule];
    saveSyncSchedules(updated);
    refresh();
  };

  const toggleSchedule = (id: string) => {
    const updated = schedules.map(s => s.id === id ? { ...s, status: (s.status === "active" ? "paused" : "active") as SyncSchedule["status"] } : s);
    saveSyncSchedules(updated);
    refresh();
  };

  const deleteSchedule = (id: string) => {
    saveSyncSchedules(schedules.filter(s => s.id !== id));
    refresh();
  };

  const executeSync = (id: string) => {
    runSync(id);
    refresh();
  };

  const syncLogs = logs.filter(l => l.step.startsWith("sync.")).slice(0, 30);

  const INTERVAL_LABELS: Record<string, string> = { "5min": "Every 5 min", "15min": "Every 15 min", "30min": "Every 30 min", "1hour": "Every hour", daily: "Daily", manual: "Manual" };

  return (
    <>
      <Seo title="Tracking & Sync" path="/admin/commerce/supplier-automation/tracking" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Tracking & Inventory Sync</h1>
            <p className="mt-1 text-sm text-muted">Automated tracking import and inventory synchronization.</p>
          </div>
          <button onClick={addSchedule} className="btn-primary btn-md"><Activity className="h-4 w-4" /> Add Schedule</button>
        </div>

        {/* Sync Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Active Schedules", value: schedules.filter(s => s.status === "active").length, icon: Activity, color: "text-accent" },
            { label: "Paused", value: schedules.filter(s => s.status === "paused").length, icon: Pause, color: "text-warning" },
            { label: "Total Syncs", value: schedules.length, icon: RefreshCw, color: "text-info" },
            { label: "Errors", value: schedules.reduce((s, sc) => s + sc.errorCount, 0), icon: AlertTriangle, color: "text-danger" },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={cn("font-display text-2xl font-semibold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {schedules.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Radio className="h-6 w-6" />} title="No sync schedules" action={<button onClick={addSchedule} className="btn-primary btn-md">Add Schedule</button>} /></div>
        ) : (
          <div className="mt-6 space-y-4">
            {schedules.map(s => (
              <div key={s.id} className={cn("card p-5", s.status === "paused" && "opacity-60")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.status === "active" ? "bg-success/15 text-success" : s.status === "error" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>
                      {s.status === "active" ? <RefreshCw className="h-5 w-5" /> : s.status === "error" ? <AlertTriangle className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink capitalize">{s.syncType.replace(/_/g, " ")} Sync</h3>
                        <span className={cn("badge", s.status === "active" ? "bg-success/15 text-success" : s.status === "error" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{s.status}</span>
                      </div>
                      <p className="text-sm text-muted">{s.supplierName} · {INTERVAL_LABELS[s.interval] || s.interval}</p>
                      {s.lastSync && <p className="text-xs text-muted mt-1">Last sync: {formatDateTime(s.lastSync)} · {s.lastStatus === "success" ? "Successful" : "Failed"}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => executeSync(s.id)} className="btn-ghost btn-sm" title="Run sync now"><RefreshCw className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toggleSchedule(s.id)} className="btn btn-sm border border-line">
                      {s.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => deleteSchedule(s.id)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {s.errorCount > 0 && <p className="mt-2 text-xs text-danger">{s.errorCount} error{s.errorCount !== 1 ? "s" : ""} recorded</p>}
              </div>
            ))}
          </div>
        )}

        {/* Sync Logs */}
        <div className="mt-8 card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Sync Activity Log</h2></div>
          {syncLogs.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No sync activity yet.</p>
          ) : (
            <div className="divide-y divide-line">
              {syncLogs.map(l => (
                <div key={l.id} className="flex items-start gap-3 px-5 py-3">
                  <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", l.status === "success" ? "bg-success/15" : l.status === "failed" ? "bg-danger/15" : "bg-surface2")}>
                    {l.status === "success" ? <CheckCircle className="h-3 w-3 text-success" /> : <AlertTriangle className="h-3 w-3 text-danger" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{l.details}</p>
                    <p className="text-xs text-muted">{l.supplierName ? `${l.supplierName} · ` : ""}{formatDateTime(l.ts)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
