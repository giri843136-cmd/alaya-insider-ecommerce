/** AI Task Board — displays tasks with status, priority, and assignment */
import { Calendar, Clock, AlertCircle, CheckCircle, Loader, Play, User } from "lucide-react";
import { cn } from "@/utils/cn";
import type { AiTask } from "../../lib/aiWorkspace";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-danger/15 text-danger",
  urgent: "bg-warning/15 text-warning",
  high: "bg-warning/10 text-warning",
  medium: "bg-info/15 text-info",
  low: "bg-surface2 text-muted",
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock, assigned: Loader, in_progress: Play, completed: CheckCircle, failed: AlertCircle, cancelled: AlertCircle,
};

export function AiTaskCard({ task, compact }: { task: AiTask; compact?: boolean }) {
  const StatusIcon = STATUS_ICONS[task.status] || Clock;

  return (
    <div className={cn("card p-3 transition-colors hover:border-accent/30", task.status === "completed" && "opacity-70")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <StatusIcon className={cn("h-4 w-4 shrink-0", task.status === "completed" ? "text-success" : task.status === "failed" ? "text-danger" : "text-muted")} />
          <div className="min-w-0">
            <p className={cn("text-sm truncate", task.status === "completed" ? "text-muted line-through" : "font-medium text-ink")}>{task.title}</p>
            {!compact && task.description && <p className="text-xs text-muted truncate">{task.description}</p>}
          </div>
        </div>
        <span className={cn("badge text-[0.5rem] shrink-0", PRIORITY_STYLES[task.priority])}>{task.priority}</span>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.55rem] text-muted">
          <span className="badge bg-surface2 capitalize">{task.status.replace(/_/g, " ")}</span>
          <span className="capitalize">{task.category}</span>
          {task.assignedAgentId && <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" /> Assigned</span>}
          {task.scheduledAt && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" /> {new Date(task.scheduledAt).toLocaleDateString()}</span>}
          {task.completedAt && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {((task.completedAt - (task.startedAt || task.createdAt)) / 1000).toFixed(0)}s</span>}
        </div>
      )}
    </div>
  );
}

export function AiTaskBoard({ tasks, compact }: { tasks: AiTask[]; compact?: boolean }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted text-center py-8">No tasks found.</p>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t) => <AiTaskCard key={t.id} task={t} compact={compact} />)}
    </div>
  );
}
