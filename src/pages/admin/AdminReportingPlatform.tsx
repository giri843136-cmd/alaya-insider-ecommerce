/**
 * ALAYA INSIDER — Reporting Platform (PART 3.6)
 * ------------------------------------------------------------------
 * Executive reports, custom reports, scheduled exports, and report management.
 */
import { useState, useMemo } from "react";
import {
  FileText, Trash2, Calendar, Clock, RefreshCw,
  BarChart3,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState, Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";
import {
  getReports, deleteReport, generateReport, type Report,
} from "../../lib/adminPortal";

export default function AdminReportingPlatform() {
  const [reports, setReports] = useState(getReports());
  const [tab, setTab] = useState<"reports" | "executions">("reports");
  const [generating, setGenerating] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Report | null>(null);

  const refresh = () => setReports(getReports());
  const executions = useMemo(() => {
    const store = localStorage.getItem("alaya_admin_portal_v1");
    if (!store) return [];
    try {
      const parsed = JSON.parse(store);
      return parsed.reportExecutions || [];
    } catch { return []; }
  }, [reports]);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    generateReport(id);
    setTimeout(() => { setGenerating(null); refresh(); }, 2500);
  };

  return (
    <>
      <Seo title="Reporting Platform" path="/admin/reporting" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Reporting Platform</h1>
            <p className="mt-1 text-sm text-muted">Executive reports, scheduled exports, and custom report generation.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["reports", "executions"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
              {t === "reports" ? <FileText className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {t}
            </button>
          ))}
        </div>

        {tab === "reports" && (
          <div className="mt-6 space-y-3">
            {reports.length === 0 ? (
              <EmptyState icon={<FileText className="h-6 w-6" />} title="No reports yet" description="Create your first report." />
            ) : (
              reports.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{r.name}</h3>
                        <Badge variant="neutral">{r.type}</Badge>
                        <Badge variant="info">{r.format.toUpperCase()}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{r.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleGenerate(r.id)} disabled={generating === r.id} className="btn-ghost btn-sm">
                        <RefreshCw className={cn("h-3.5 w-3.5", generating === r.id && "animate-spin")} />
                        {generating === r.id ? "Generating..." : "Generate"}
                      </button>
                      <button onClick={() => setToDelete(r)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                    {r.schedule && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {r.schedule.frequency}</span>
                    )}
                    {r.lastGenerated && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last: {formatDateTime(r.lastGenerated)}</span>}
                    <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {r.metrics.length} metrics</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "executions" && (
          <div className="mt-6">
            {executions.length === 0 ? (
              <EmptyState icon={<Clock className="h-6 w-6" />} title="No report executions" description="Generate a report to see execution history." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-surface2/60">
                    <tr><th className="px-4 py-2.5 text-left font-medium text-muted">Report</th><th className="px-4 py-2.5 text-center font-medium text-muted">Status</th><th className="px-4 py-2.5 text-right font-medium text-muted">Rows</th><th className="px-4 py-2.5 text-right font-medium text-muted">Started</th></tr>
                  </thead>
                  <tbody>
                    {executions.map((exec: any, idx: number) => {
                      const report = reports.find((r) => r.id === exec.reportId);
                      return (
                        <tr key={exec.id} className={cn("border-t border-line", idx % 2 === 0 ? "bg-surface" : "bg-surface2/20")}>
                          <td className="px-4 py-3 font-medium text-ink">{report?.name || "Unknown"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("badge", exec.status === "completed" ? "bg-success/15 text-success" : exec.status === "running" ? "bg-info/15 text-info" : "bg-danger/15 text-danger")}>{exec.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-muted">{exec.rowCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted text-xs">{formatDateTime(exec.startedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete report"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteReport(toDelete.id); setToDelete(null); refresh(); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>? This cannot be undone.
      </Dialog>
    </>
  );
}
