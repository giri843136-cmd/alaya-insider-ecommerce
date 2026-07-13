/** AI Agent Card — displays agent info, status, capabilities, and metrics */
import { Bot, Cpu, CheckCircle, PauseCircle, AlertCircle, Activity } from "lucide-react";
import { cn } from "@/utils/cn";
import type { AiAgentRegistryEntry } from "../../lib/aiWorkspace";

const STATUS_CONFIG = {
  active: { icon: CheckCircle, className: "text-success", bg: "bg-success/15" },
  paused: { icon: PauseCircle, className: "text-warning", bg: "bg-warning/15" },
  error: { icon: AlertCircle, className: "text-danger", bg: "bg-danger/15" },
  training: { icon: Cpu, className: "text-info", bg: "bg-info/15" },
} as const;

export function AiAgentCard({ agent, onToggle, onSelect }: {
  agent: AiAgentRegistryEntry;
  onToggle?: () => void;
  onSelect?: () => void;
}) {
  const statusCfg = STATUS_CONFIG[agent.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className={cn("card p-4 transition-all", agent.status === "active" && "border-success/20", agent.status === "error" && "border-danger/30", onSelect && "cursor-pointer hover:shadow-md")} onClick={onSelect}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-10 w-10 place-items-center rounded-full", statusCfg.bg)}>
            <Bot className={cn("h-5 w-5", statusCfg.className)} />
          </span>
          <div>
            <p className="font-semibold text-ink">{agent.name}</p>
            <p className="text-xs text-muted capitalize">{agent.role.replace(/_/g, " ")} · v{agent.version}</p>
          </div>
        </div>
        {onToggle && (
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", statusCfg.bg, statusCfg.className)}>
            <StatusIcon className="h-3 w-3" />
            {agent.status}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted line-clamp-2">{agent.description}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-surface2/40 p-2 text-center">
          <p className="font-semibold text-ink">{agent.totalTasksCompleted.toLocaleString()}</p>
          <p className="text-muted">Tasks</p>
        </div>
        <div className="rounded bg-surface2/40 p-2 text-center">
          <p className="font-semibold text-ink">{agent.successRate}%</p>
          <p className="text-muted">Success</p>
        </div>
        <div className="rounded bg-surface2/40 p-2 text-center">
          <p className="font-semibold text-ink">{agent.avgResponseTime}ms</p>
          <p className="text-muted">Latency</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map((c) => (
          <span key={c} className="badge bg-accent-soft text-accent text-[0.55rem]">{c.replace(/_/g, " ")}</span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="badge bg-surface2 text-muted text-[0.55rem]">+{agent.capabilities.length - 3}</span>
        )}
        <span className="badge bg-surface2 text-muted text-[0.55rem]">{agent.provider}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[0.55rem] text-muted">
        <Activity className="h-2.5 w-2.5" />
        <span>{agent.activeTasks}/{agent.maxConcurrentTasks} active tasks</span>
      </div>
    </div>
  );
}
