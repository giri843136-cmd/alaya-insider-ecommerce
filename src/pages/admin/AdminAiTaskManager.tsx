/**
 * ALAYA INSIDER — AI Task Manager (PART 3.7)
 * Task assignment, scheduling, prioritization, and planning.
 */
import { useState, useMemo } from "react";
import { Target, Calendar, Clock, Brain } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getAiTasks, updateAiTask, getTaskStats, getAgentRegistry } from "../../lib/aiWorkspace";

type TaskTab = "all" | "pending" | "in_progress" | "completed" | "planning";

export default function AdminAiTaskManager() {
  const [tab, setTab] = useState<TaskTab>("all");
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);
  const tasks = useMemo(() => getAiTasks(), []);
  const stats = useMemo(() => getTaskStats(), []);
  const agents = useMemo(() => getAgentRegistry(), []);

  const filtered = tasks.filter((t) => {
    if (tab === "all") return true;
    if (tab === "planning") return t.status === "pending";
    return t.status === tab;
  });

  const handleStatusChange = (id: string, status: string) => {
    updateAiTask(id, { status: status as any, ...(status === "in_progress" ? { startedAt: Date.now() } : {}), ...(status === "completed" ? { completedAt: Date.now() } : {}) });
    refresh();
  };

  return (
    <>
      <Seo title="AI Task Manager" path="/admin/ai-task-manager" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Task Manager</h1>
            <p className="mt-1 text-sm text-muted">Task assignment, scheduling, prioritization, and planning.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "text-ink" },
            { label: "Pending", value: stats.pending, color: "text-warning" },
            { label: "In Progress", value: stats.inProgress, color: "text-info" },
            { label: "Completed", value: stats.completed, color: "text-success" },
            { label: "Failed", value: stats.failed, color: "text-danger" },
          ].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <p className={cn("text-lg font-semibold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {stats.avgCompletionTime > 0 && (
          <div className="mt-4 card p-3 flex items-center gap-2 text-xs text-muted">
            <Clock className="h-4 w-4 text-accent" />
            Average completion time: {(stats.avgCompletionTime / 1000).toFixed(0)}s
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-2">
          {([["all", "All"], ["pending", "Pending"], ["in_progress", "In Progress"], ["completed", "Completed"], ["planning", "Planning"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("btn-sm capitalize", tab === id ? "btn-primary" : "btn-ghost")}>
              {id === "planning" && <Brain className="h-4 w-4" />}
              {id === "all" && <Target className="h-4 w-4" />}
              {label} {id === "pending" && stats.pending > 0 && <span className="ml-1 text-[0.5rem] bg-warning/20 text-warning px-1 rounded-full">{stats.pending}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {filtered.length === 0 ? (
            <EmptyState icon={<Target className="h-6 w-6" />} title="No tasks" description="Tasks will appear here once created by AI agents or administrators." />
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <div key={t.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("font-semibold", t.status === "completed" ? "text-muted line-through" : "text-ink")}>{t.title}</h3>
                        <span className={cn("badge capitalize", t.priority === "critical" ? "bg-danger/15 text-danger" : t.priority === "high" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{t.priority}</span>
                        <span className="badge bg-surface2 text-muted capitalize">{t.category}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{t.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.55rem] text-muted">
                        <span className={cn("badge capitalize", t.status === "completed" ? "bg-success/15 text-success" : t.status === "failed" ? "bg-danger/15 text-danger" : t.status === "in_progress" ? "bg-info/15 text-info" : "bg-surface2 text-muted")}>{t.status.replace(/_/g, " ")}</span>
                        {t.assignedAgentId && <span>Agent: {agents.find((a) => a.id === t.assignedAgentId)?.name || "Unknown"}</span>}
                        {t.scheduledAt && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{new Date(t.scheduledAt).toLocaleDateString()}</span>}
                        {t.durationMs && <span><Clock className="h-2.5 w-2.5 inline" /> {(t.durationMs / 1000).toFixed(0)}s</span>}
                        {t.retries > 0 && <span>Retries: {t.retries}</span>}
                      </div>
                      {t.result && <p className="mt-2 text-xs text-success bg-success/5 rounded p-2">{t.result}</p>}
                      {t.error && <p className="mt-2 text-xs text-danger bg-danger/5 rounded p-2">{t.error}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {t.status === "pending" && <button onClick={() => handleStatusChange(t.id, "in_progress")} className="btn-ghost btn-xs text-info"><Clock className="h-3.5 w-3.5" /> Start</button>}
                      {t.status === "in_progress" && <button onClick={() => handleStatusChange(t.id, "completed")} className="btn-ghost btn-xs text-success"><Target className="h-3.5 w-3.5" /> Complete</button>}
                      {t.status !== "completed" && t.status !== "cancelled" && <button onClick={() => handleStatusChange(t.id, "cancelled")} className="btn-ghost btn-xs text-danger">Cancel</button>}
                    </div>
                  </div>
                  {t.dependsOn.length > 0 && (
                    <div className="mt-2 text-[0.55rem] text-muted">
                      Depends on: {t.dependsOn.map((d) => tasks.find((t2) => t2.id === d)?.title || d).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
