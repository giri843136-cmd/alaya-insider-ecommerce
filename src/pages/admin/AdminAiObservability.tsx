/**
 * ALAYA INSIDER — AI Observability (PART 3.7)
 * Logs, metrics, cost management, compliance, and safety monitoring.
 */
import { useState, useMemo } from "react";
import { Activity, AlertTriangle, DollarSign, Shield, BarChart3, Eye, TrendingUp } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getObservabilityEvents, getObservabilityStats, getAiCostHistory, getCostStats } from "../../lib/aiWorkspace";

type OTab = "events" | "cost" | "compliance";

export default function AdminAiObservability() {
  const [tab, setTab] = useState<OTab>("events");
  const events = useMemo(() => getObservabilityEvents(), []);
  const stats = useMemo(() => getObservabilityStats(), []);
  const costStats = useMemo(() => getCostStats(), []);
  const costHistory = useMemo(() => getAiCostHistory(), []);

  return (
    <>
      <Seo title="AI Observability" path="/admin/ai-observability" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Observability</h1>
            <p className="mt-1 text-sm text-muted">Monitoring, cost management, compliance, and safety for all AI operations.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {([["events", "Events", Activity], ["cost", "Cost Management", DollarSign], ["compliance", "Compliance", Shield]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("btn-sm capitalize", tab === id ? "btn-primary" : "btn-ghost")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "events" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-5">
              {[
                { label: "Total Events", value: stats.total, color: "text-ink" },
                { label: "Info", value: stats.info, color: "text-info" },
                { label: "Warnings", value: stats.warning, color: "text-warning" },
                { label: "Errors", value: stats.error, color: "text-danger" },
                { label: "Critical", value: stats.critical, color: "text-danger" },
              ].map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <p className={cn("text-lg font-semibold", s.color)}>{s.value}</p>
                  <p className="text-[0.55rem] text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className={cn("card p-3", e.type === "error" && "border-danger/20", e.type === "critical" && "border-danger/40", e.type === "warning" && "border-warning/20")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full",
                        e.type === "critical" ? "bg-danger/15 text-danger" : e.type === "error" ? "bg-danger/10 text-danger" : e.type === "warning" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"
                      )}>
                        {e.type === "critical" || e.type === "error" ? <AlertTriangle className="h-4 w-4" /> : e.type === "warning" ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-ink text-sm">{e.message}</p>
                          <Badge variant={e.type === "critical" ? "warning" : e.type === "error" ? "warning" : e.type === "warning" ? "warning" : "info"}>{e.type}</Badge>
                        </div>
                        <p className="text-xs text-muted">{e.details}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.5rem] text-muted">
                          <span>Source: {e.agentName}</span>
                          {e.durationMs && <span>· {e.durationMs}ms</span>}
                          {e.tokensUsed && <span>· {e.tokensUsed} tokens</span>}
                          {e.cost && <span>· ${e.cost.toFixed(4)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && <EmptyState icon={<Activity className="h-6 w-6" />} title="No events" description="AI observability events will appear here." />}
            </div>
          </div>
        )}

        {tab === "cost" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total Cost", value: `$${costStats.totalCost.toFixed(2)}`, icon: DollarSign },
                { label: "Total Requests", value: costStats.totalRequests.toLocaleString(), icon: Activity },
                { label: "Input Tokens", value: costStats.totalTokensInput.toLocaleString(), icon: TrendingUp },
                { label: "Output Tokens", value: costStats.totalTokensOutput.toLocaleString(), icon: BarChart3 },
              ].map((m) => (
                <div key={m.label} className="card p-4 text-center">
                  <m.icon className="h-5 w-5 mx-auto text-accent" />
                  <p className="mt-2 text-xl font-semibold text-ink">{m.value}</p>
                  <p className="text-xs text-muted">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(costStats.byProvider).map(([provider, data]) => (
                <div key={provider} className="card p-4">
                  <p className="text-sm font-semibold text-ink capitalize">{provider}</p>
                  <p className="text-lg font-semibold text-ink mt-1">${data.cost.toFixed(2)}</p>
                  <p className="text-xs text-muted">{data.requests.toLocaleString()} requests</p>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-ink mb-3">Cost History (Last 30 Days)</h3>
              <div className="flex items-end gap-1 h-20">
                {(() => {
                  const daily: Record<string, number> = {};
                  costHistory.forEach((c) => { daily[c.date] = (daily[c.date] || 0) + c.cost; });
                  const entries = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
                  const max = Math.max(...entries.map(([, v]) => v), 0.01);
                  return entries.slice(-30).map(([date, cost]) => (
                    <div key={date} className="flex flex-1 flex-col items-center gap-1" title={`${date}: $${cost.toFixed(2)}`}>
                      <div className="w-full rounded-t bg-accent/60" style={{ height: `${(cost / max) * 100}%` }} />
                      <span className="text-[0.4rem] text-muted rotate-45 origin-left">{date.slice(5)}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === "compliance" && (
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { rule: "Human Approval Required", description: "All AI-generated content requires human review before publication.", status: "enabled", icon: Shield },
                { rule: "Confidence Threshold", description: "AI decisions below 80% confidence flagged for human review.", status: "enabled", icon: Eye },
                { rule: "Token Budget Enforcement", description: "Monthly token budget capped per agent. Alerts at 80% usage.", status: "enabled", icon: DollarSign },
                { rule: "Audit Logging", description: "Every AI invocation logged with full trace including prompt and response.", status: "enabled", icon: Activity },
                { rule: "Data Retention", description: "AI interaction data retained for 90 days, then anonymized.", status: "enabled", icon: Shield },
                { rule: "Rate Limiting", description: "Maximum 60 AI requests per minute per agent. Burst protection active.", status: "enabled", icon: Activity },
                { rule: "PII Scanning", description: "All AI inputs and outputs scanned for personally identifiable information.", status: "enabled", icon: Eye },
                { rule: "Model Governance", description: "Only approved models can be used. Version pinning required for production.", status: "enabled", icon: Shield },
              ].map((g, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-success/15"><g.icon className="h-4 w-4 text-success" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{g.rule}</p>
                      <p className="text-[0.55rem] text-muted">{g.description}</p>
                    </div>
                    <Badge variant="success">{g.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
