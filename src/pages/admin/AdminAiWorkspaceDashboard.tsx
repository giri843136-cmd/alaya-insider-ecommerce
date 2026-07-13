/**
 * ALAYA INSIDER — AI Workspace Dashboard (PART 3.7)
 * Command center for the entire AI ecosystem.
 */
import { useMemo, useState } from "react";
import { Bot, Brain, Sparkles, Activity, BarChart3, Target, Zap, DollarSign } from "lucide-react";
import { Seo } from "../../components/Seo";

import { cn } from "@/utils/cn";
import { getAiWorkspaceStats, getAgentRegistryStats, getTaskStats, getMemoryStats, getCostStats, getObservabilityStats, getAgentRegistry, getBusinessInsights, getAiTasks } from "../../lib/aiWorkspace";
import { AiTaskBoard } from "../../components/ai/AiTaskBoard";
import { AiAgentCard } from "../../components/ai/AiAgentCard";

export default function AdminAiWorkspaceDashboard() {
  const stats = useMemo(() => getAiWorkspaceStats(), []);
  const agentStats = useMemo(() => getAgentRegistryStats(), []);
  const taskStats = useMemo(() => getTaskStats(), []);
  const memoryStats = useMemo(() => getMemoryStats(), []);
  const costStats = useMemo(() => getCostStats(), []);
  const obsStats = useMemo(() => getObservabilityStats(), []);
  const agents = useMemo(() => getAgentRegistry(), []);
  const [tab, setTab] = useState<"overview" | "agents" | "tasks">("overview");

  return (
    <>
      <Seo title="AI Workspace" path="/admin/ai-workspace" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Workspace</h1>
            <p className="mt-1 text-sm text-muted">Enterprise command center for autonomous AI operations & agent orchestration.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {([["overview", "Overview"], ["agents", "AI Agents"], ["tasks", "Tasks"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("btn-sm capitalize", tab === id ? "btn-primary" : "btn-ghost")}>
              {id === "overview" && <Activity className="h-4 w-4" />}
              {id === "agents" && <Bot className="h-4 w-4" />}
              {id === "tasks" && <Target className="h-4 w-4" />}
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "AI Agents", value: `${stats.activeAgentCount}/${stats.agentCount}`, sub: `${stats.avgSuccessRate}% success`, icon: Bot, color: "text-accent" },
                { label: "Tasks", value: String(stats.taskCount), sub: `${stats.pendingTaskCount} pending`, icon: Target, color: "text-info" },
                { label: "Memory", value: String(stats.memoryCount), sub: `${memoryStats.highImportance} high`, icon: Brain, color: "text-success" },
                { label: "Decisions", value: String(stats.decisionPolicyCount), sub: `${stats.insightCount} insights`, icon: Zap, color: "text-warning" },
                { label: "Events", value: String(stats.observabilityEventCount), sub: `${obsStats.warning + obsStats.error} alerts`, icon: Activity, color: "text-danger" },
                { label: "Cost", value: `$${stats.totalCost.toFixed(0)}`, sub: `${stats.totalTokens.toLocaleString()} tokens`, icon: DollarSign, color: "text-muted" },
              ].map((m) => (
                <div key={m.label} className="card p-4">
                  <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted">
                    <span className={m.color}><m.icon className="h-3 w-3" /></span>
                    {m.label}
                  </div>
                  <p className="mt-2 text-xl font-semibold text-ink">{m.value}</p>
                  <p className="text-xs text-muted">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Bot className="h-5 w-5 text-accent" /> Active AI Employees</h3>
                <div className="mt-3 space-y-2">
                  {agents.filter((a) => a.status === "active").slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-line p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-success/15"><Bot className="h-4 w-4 text-success" /></span>
                        <div>
                          <p className="text-sm font-medium text-ink">{a.name}</p>
                          <p className="text-[0.55rem] text-muted capitalize">{a.role.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted">{a.activeTasks}/{a.maxConcurrentTasks} tasks</span>
                    </div>
                  ))}
                  {agents.filter((a) => a.status === "active").length === 0 && <p className="text-xs text-muted">No active agents.</p>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Sparkles className="h-5 w-5 text-accent" /> AI Business Insights</h3>
                <div className="mt-3 space-y-2">
                  {(() => {
                    const insights = getBusinessInsights();
                    return insights.slice(0, 4).map((ins) => (
                      <div key={ins.id} className="rounded-lg border border-line p-2.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("badge", ins.impact === "critical" ? "bg-danger/15 text-danger" : ins.impact === "high" ? "bg-warning/15 text-warning" : "bg-info/15 text-info")}>{ins.impact}</span>
                          <span className="text-xs font-medium text-ink">{ins.title}</span>
                          <span className="text-[0.5rem] text-muted ml-auto">{ins.confidence}% conf</span>
                        </div>
                        <p className="mt-1 text-[0.6rem] text-muted line-clamp-1">{ins.description}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-5 w-5 text-accent" /> AI Cost Overview</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Total Cost", value: `$${costStats.totalCost.toFixed(0)}`, sub: "All time" },
                  { label: "Total Requests", value: costStats.totalRequests.toLocaleString(), sub: "Across all agents" },
                  { label: "Total Input Tokens", value: costStats.totalTokensInput.toLocaleString(), sub: "Model inputs" },
                  { label: "Total Output Tokens", value: costStats.totalTokensOutput.toLocaleString(), sub: "Model outputs" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-surface2/40 p-3 text-center">
                    <p className="text-xs text-muted">{m.label}</p>
                    <p className="text-lg font-semibold text-ink mt-1">{m.value}</p>
                    <p className="text-[0.55rem] text-muted">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "agents" && (
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4 text-sm text-muted">
              <span>{agentStats.total} agents</span>
              <span className="text-success">{agentStats.active} active</span>
              <span className="text-warning">{agentStats.paused} paused</span>
              {agentStats.error > 0 && <span className="text-danger">{agentStats.error} errors</span>}
            </div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {agents.map((a) => (
                <AiAgentCard key={a.id} agent={a} onToggle={() => {}} />
              ))}
              {agents.length === 0 && <p className="text-sm text-muted col-span-full text-center py-8">No AI agents registered. Create one from the Agent Registry.</p>}
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4 text-sm text-muted">
              <span>{taskStats.total} total</span>
              <span className="text-warning">{taskStats.pending} pending</span>
              <span className="text-info">{taskStats.inProgress} in progress</span>
              <span className="text-success">{taskStats.completed} completed</span>
              {taskStats.failed > 0 && <span className="text-danger">{taskStats.failed} failed</span>}
            </div>
            <AiTaskBoard tasks={getAiTasks()} />
          </div>
        )}
      </div>
    </>
  );
}
