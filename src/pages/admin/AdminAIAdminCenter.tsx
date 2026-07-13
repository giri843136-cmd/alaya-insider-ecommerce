/**
 * ALAYA INSIDER — AI Administration Center (PART 3.6)
 * ------------------------------------------------------------------
 * AI command center with model management, agent oversight,
 * prompt library, usage analytics, cost tracking, and governance.
 */
import { useState, useMemo } from "react";
import {
  Brain, Cpu, Database, BarChart3,
  Play, Pause, Shield,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatCompact } from "../../lib/utils";
import {
  getAiModels, getAiAgents, getAiPrompts, updateAiAgent, getAiUsage,
} from "../../lib/adminPortal";

type AIView = "models" | "agents" | "prompts" | "usage" | "governance";

export default function AdminAIAdminCenter() {
  const [view, setView] = useState<AIView>("models");
  const models = useMemo(() => getAiModels(), []);
  const agents = useMemo(() => getAiAgents(), []);
  const prompts = useMemo(() => getAiPrompts(), []);
  const usage = useMemo(() => getAiUsage(), []);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  return (
    <>
      <Seo title="AI Administration" path="/admin/ai-admin" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Administration</h1>
            <p className="mt-1 text-sm text-muted">Manage AI models, agents, prompts, usage, costs, and governance.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["models", "agents", "prompts", "usage", "governance"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("btn-sm capitalize", view === v ? "btn-primary" : "btn-ghost")}>
              {v === "models" && <Cpu className="h-4 w-4" />}
              {v === "agents" && <Brain className="h-4 w-4" />}
              {v === "prompts" && <Database className="h-4 w-4" />}
              {v === "usage" && <BarChart3 className="h-4 w-4" />}
              {v === "governance" && <Shield className="h-4 w-4" />}
              {v}
            </button>
          ))}
        </div>

        {view === "models" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {models.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{m.name}</h3>
                    <p className="text-xs text-muted">{m.provider} · {m.modelId}</p>
                  </div>
                  <Badge variant={m.status === "active" ? "success" : "neutral"}>{m.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.capabilities.map((c) => <Badge key={c} variant="info">{c}</Badge>)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                  <div><span className="font-medium text-ink">${m.costPerToken.toFixed(5)}</span> / token</div>
                  <div><span className="font-medium text-ink">{formatCompact(m.tokensUsed)}</span> tokens used</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "agents" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {agents.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{a.name}</h3>
                    <p className="text-xs text-muted">{a.description}</p>
                  </div>
                  <button
                    onClick={() => { updateAiAgent(a.id, { status: a.status === "active" ? "paused" : "active" }); refresh(); }}
                    className={cn("grid h-8 w-8 place-items-center rounded-full", a.status === "active" ? "text-success hover:bg-success/10" : "text-muted hover:bg-surface2")}
                  >
                    {a.status === "active" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><span className="block font-semibold text-ink">{a.totalRequests.toLocaleString()}</span>Requests</div>
                  <div><span className="block font-semibold text-ink">{formatCompact(a.totalTokens)}</span>Tokens</div>
                  <div><span className="block font-semibold text-ink">{(a.successRate * 100).toFixed(0)}%</span>Success</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "prompts" && (
          <div className="mt-6">
            {prompts.length === 0 ? (
              <EmptyState icon={<Database className="h-6 w-6" />} title="No prompts" description="Create your first prompt template." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-surface2/60">
                    <tr><th className="px-4 py-2.5 text-left font-medium text-muted">Name</th><th className="px-4 py-2.5 text-left font-medium text-muted">Category</th><th className="px-4 py-2.5 text-center font-medium text-muted">Version</th><th className="px-4 py-2.5 text-right font-medium text-muted">Usage</th><th className="px-4 py-2.5 text-right font-medium text-muted">Avg Tokens</th></tr>
                  </thead>
                  <tbody>
                    {prompts.map((p, i) => (
                      <tr key={p.id} className={cn("border-t border-line", i % 2 === 0 ? "bg-surface" : "bg-surface2/20")}>
                        <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                        <td className="px-4 py-3"><Badge variant="info">{p.category}</Badge></td>
                        <td className="px-4 py-3 text-center text-muted">v{p.version}</td>
                        <td className="px-4 py-3 text-right text-muted">{p.usageCount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted">{p.avgTokens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === "usage" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-4 text-center">
                <p className="text-xs font-semibold text-muted">Total Tokens</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{formatCompact(usage.totalTokens)}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs font-semibold text-muted">Total Cost</p>
                <p className="mt-2 text-2xl font-semibold text-ink">${usage.totalCost.toFixed(2)}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs font-semibold text-muted">Avg Daily Requests</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{Math.round(usage.requestsByDay.reduce((s, d) => s + d.count, 0) / usage.requestsByDay.length)}</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Requests by Day</h3>
              <div className="flex items-end gap-2 h-20">
                {usage.requestsByDay.map((d) => {
                  const max = Math.max(...usage.requestsByDay.map((r) => r.count));
                  const height = max > 0 ? (d.count / max) * 100 : 0;
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-accent/60" style={{ height: `${Math.max(height, 4)}%` }} title={`${d.date}: ${d.count}`} />
                      <span className="text-[0.5rem] text-muted">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "governance" && (
          <div className="mt-6 space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /> AI Governance</h3>
              <div className="space-y-3">
                {[
                  { rule: "Content Approval", description: "All AI-generated product descriptions require editorial review before publishing.", status: "enabled" },
                  { rule: "Usage Limits", description: "Monthly token budget capped at 500K tokens per model.", status: "enabled" },
                  { rule: "Data Retention", description: "AI interaction logs retained for 90 days.", status: "enabled" },
                  { rule: "Rate Limiting", description: "Maximum 60 requests per minute per user.", status: "enabled" },
                  { rule: "Audit Logging", description: "All AI invocations logged with user, prompt, and response.", status: "enabled" },
                ].map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-line p-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{g.rule}</p>
                      <p className="text-xs text-muted">{g.description}</p>
                    </div>
                    <Badge variant="success">{g.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
