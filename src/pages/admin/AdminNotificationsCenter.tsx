/**
 * ALAYA INSIDER — Notifications Center (PART 3.6)
 * ------------------------------------------------------------------
 * Full notification management, alerts, incidents, tasks, approvals.
 */
import { useState, useMemo } from "react";
import {
  Bell, Check, X, AlertTriangle, CheckCircle,
  UserPlus, Calendar,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";
import {
  getUnreadCount,
  markAllNotificationsRead,
  getIncidents, getTasks, completeTask,
  getApprovals, reviewApproval,
} from "../../lib/adminPortal";
import { NotificationList } from "../../components/admin/NotificationsCenter";

type NCView = "notifications" | "incidents" | "tasks" | "approvals";

export default function AdminNotificationsCenter() {
  const [view, setView] = useState<NCView>("notifications");

  const incidents = useMemo(() => getIncidents(), []);
  const tasks = useMemo(() => getTasks(), []);
  const approvals = useMemo(() => getApprovals(), []);
  const unread = useMemo(() => getUnreadCount(), []);

  return (
    <>
      <Seo title="Notifications Center" path="/admin/notifications" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Notifications Center</h1>
            <p className="mt-1 text-sm text-muted">Alerts, incidents, tasks, and approvals across the platform.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-2">
          {(["notifications", "incidents", "tasks", "approvals"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("btn-sm capitalize relative", view === v ? "btn-primary" : "btn-ghost")}>
              {v === "notifications" && <Bell className="h-4 w-4" />}
              {v === "incidents" && <AlertTriangle className="h-4 w-4" />}
              {v === "tasks" && <CheckCircle className="h-4 w-4" />}
              {v === "approvals" && <UserPlus className="h-4 w-4" />}
              {v}
              {v === "notifications" && unread > 0 && (
                <span className="ml-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-danger px-1 text-[0.5rem] font-bold text-white">{unread}</span>
              )}
            </button>
          ))}
          {view === "notifications" && unread > 0 && (
            <button onClick={() => { markAllNotificationsRead(); }} className="btn-ghost btn-sm ml-auto"><Check className="h-3.5 w-3.5" /> Mark all read</button>
          )}
        </div>

        {view === "notifications" && (
          <div className="mt-6">
            <NotificationList />
          </div>
        )}

        {view === "incidents" && (
          <div className="mt-6 space-y-3">
            {incidents.length === 0 ? (
              <EmptyState icon={<CheckCircle className="h-6 w-6" />} title="No incidents" description="All systems operational." />
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", inc.severity === "critical" ? "bg-danger" : inc.severity === "high" ? "bg-warning" : "bg-info")} />
                      <h3 className="font-semibold text-ink">{inc.title}</h3>
                      <Badge variant={inc.status === "resolved" ? "success" : inc.status === "investigating" ? "warning" : "neutral"}>{inc.status}</Badge>

                    </div>
                    <span className="text-xs text-muted">{formatDateTime(inc.detectedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{inc.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {inc.affectedSystems.map((s) => <Badge key={s} variant="neutral">{s}</Badge>)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "tasks" && (
          <div className="mt-6 space-y-2">
            {tasks.length === 0 ? (
              <EmptyState icon={<CheckCircle className="h-6 w-6" />} title="No tasks" description="All tasks completed." />
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="card flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => { completeTask(t.id); }} className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", t.status === "completed" ? "border-success bg-success text-white" : "border-line hover:border-accent")}>
                      {t.status === "completed" && <Check className="h-3 w-3" />}
                    </button>
                    <div className="min-w-0">
                      <p className={cn("text-sm", t.status === "completed" ? "text-muted line-through" : "font-medium text-ink")}>{t.title}</p>
                      <p className="text-xs text-muted">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", t.priority === "urgent" ? "bg-danger/15 text-danger" : t.priority === "high" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{t.priority}</span>
                    {t.dueDate && <span className="text-xs text-muted flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateTime(t.dueDate)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "approvals" && (
          <div className="mt-6 space-y-3">
            {approvals.length === 0 ? (
              <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No pending approvals" description="All requests reviewed." />
            ) : (
              approvals.map((a) => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{a.title}</h3>
                      <p className="text-xs text-muted">{a.description} · Requested by {a.requestedBy}</p>
                    </div>
                    <span className={cn("badge", a.status === "pending" ? "bg-warning/15 text-warning" : a.status === "approved" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{a.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Badge variant="neutral">{a.type}</Badge>
                    <span>{formatDateTime(a.createdAt)}</span>
                  </div>
                  {a.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => { reviewApproval(a.id, "approved", "Admin"); }} className="btn-success btn-sm"><Check className="h-3.5 w-3.5" /> Approve</button>
                      <button onClick={() => { reviewApproval(a.id, "rejected", "Admin"); }} className="btn btn-sm border border-danger text-danger hover:bg-danger/10"><X className="h-3.5 w-3.5" /> Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
