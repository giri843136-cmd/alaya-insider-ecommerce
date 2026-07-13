/**
 * ALAYA INSIDER — Notifications Center Component (PART 3.6)
 * ------------------------------------------------------------------
 * Dropdown notifications panel, alert badges, and notification list.
 */
import { useMemo, useState } from "react";
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, ExternalLink } from "lucide-react";
import { cn } from "@/utils/cn";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, dismissNotification } from "../../lib/adminPortal";
import { formatDateTime } from "../../lib/utils";

const TYPE_ICONS = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: X, critical: AlertTriangle,
};

const TYPE_COLORS = {
  info: "bg-info/15 text-info", success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning", error: "bg-danger/15 text-danger", critical: "bg-danger/15 text-danger",
};

/* ------------------------------------------------------------------ */
/*  Notification Bell — shows unread count + dropdown                  */
/* ------------------------------------------------------------------ */

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = useMemo(() => getUnreadCount(), []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-surface2" aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-danger px-1 text-[0.55rem] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-hidden animate-scale-in origin-top-right">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              <div className="flex gap-1">
                <button onClick={() => { markAllNotificationsRead(); }} className="btn-ghost btn-xs" title="Mark all read"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => setOpen(false)} className="btn-ghost btn-xs"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-80">
              {(() => {
                const notifs = getNotifications().filter((n) => !n.dismissed).slice(0, 10);
                if (notifs.length === 0) return <p className="px-4 py-8 text-center text-sm text-muted">All clear — no new notifications.</p>;
                return notifs.map((n) => {
                  const Icon = TYPE_ICONS[n.type];
                  return (
                    <button key={n.id} onClick={() => { markNotificationRead(n.id); }} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2", !n.read && "bg-accent-soft/30")}>
                      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs", TYPE_COLORS[n.type])}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs", !n.read ? "font-semibold text-ink" : "font-medium text-muted")}>{n.title}</p>
                        <p className="mt-0.5 text-[0.6rem] text-muted line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[0.55rem] text-muted">{formatDateTime(n.createdAt)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }} className="shrink-0 text-muted hover:text-ink"><X className="h-3 w-3" /></button>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification List — full page notification list component          */
/* ------------------------------------------------------------------ */

export function NotificationList({ limit }: { limit?: number }) {
  const notifications = useMemo(() => getNotifications().filter((n) => !n.dismissed), []);
  const list = limit ? notifications.slice(0, limit) : notifications;

  if (list.length === 0) return <p className="text-sm text-muted text-center py-8">No notifications.</p>;

  return (
    <div className="space-y-2">
      {list.map((n) => {
        const Icon = TYPE_ICONS[n.type];
        return (
          <div key={n.id} className={cn("card flex items-start gap-3 p-3 transition-colors", !n.read && "border-accent/30 bg-accent-soft/20")}>
            <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs", TYPE_COLORS[n.type])}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm", !n.read ? "font-semibold text-ink" : "text-ink")}>{n.title}</p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-accent" />}
              </div>
              <p className="text-xs text-muted mt-0.5">{n.message}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[0.55rem] text-muted">{formatDateTime(n.createdAt)}</span>
                <span className="badge bg-surface2 text-muted text-[0.5rem] capitalize">{n.category}</span>
                {n.link && <a href={n.link} className="inline-flex items-center gap-0.5 text-[0.55rem] text-accent hover:underline"><ExternalLink className="h-2.5 w-2.5" /> View</a>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!n.read && <button onClick={() => markNotificationRead(n.id)} className="btn-ghost btn-xs" title="Mark read"><Check className="h-3.5 w-3.5" /></button>}
              <button onClick={() => dismissNotification(n.id)} className="btn-ghost btn-xs text-muted"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
