/**
 * ALAYA INSIDER — Enterprise AI Platform Admin UI
 * Multi-agent system, knowledge graph, LLM gateway, RAG, governance,
 * machine learning, forecasting & AI assistants.
 */
import { useState } from "react";
import {
  Bot, Brain, Cpu, FileText, Shield, BarChart3,
  Users, RefreshCw, Activity, Globe, Search, Layers,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { useIntelligence } from "../../context/IntelligenceContext";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

type Tab =
  | "overview" | "agents" | "knowledge" | "models"
  | "rag" | "governance" | "ml" | "forecasting" | "assistants";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "knowledge", label: "Knowledge", icon: Brain },
  { id: "models", label: "Models", icon: Cpu },
  { id: "rag", label: "RAG Pipeline", icon: Layers },
  { id: "governance", label: "Governance", icon: Shield },
  { id: "ml", label: "ML Models", icon: BarChart3 },
  { id: "forecasting", label: "Forecasting", icon: Globe },
  { id: "assistants", label: "Assistants", icon: Users },
];

export default function AdminIntelligence() {
  const { toast } = useToast();
  const ctx = useIntelligence();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <Seo title="Intelligence Platform" path="/admin/intelligence" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Platform</h1>
            <p className="mt-1 text-sm text-muted">
              Multi-agent system, knowledge graph, LLM gateway, ML &amp; autonomous intelligence.
            </p>
          </div>
          <button onClick={() => { ctx.refresh(); toast.success("AI Platform refreshed"); }} className="btn-outline btn-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab ctx={ctx} />}
        {tab === "agents" && <AgentsTab ctx={ctx} />}
        {tab === "knowledge" && <KnowledgeTab ctx={ctx} />}
        {tab === "models" && <ModelsTab ctx={ctx} />}
        {tab === "rag" && <RagTab ctx={ctx} />}
        {tab === "governance" && <GovernanceTab ctx={ctx} />}
        {tab === "ml" && <MlTab ctx={ctx} />}
        {tab === "forecasting" && <ForecastingTab ctx={ctx} />}
        {tab === "assistants" && <AssistantsTab ctx={ctx} />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  OVERVIEW                                                           */
/* ================================================================== */
function OverviewTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { agentStats, modelStats, knowledgeStats, mlStats, auditStats, promptStats, metrics } = ctx;

  const cards = [
    { label: "AI Agents", value: agentStats.total, sub: `${agentStats.running} running · ${agentStats.idle} idle`, icon: Bot, tone: agentStats.error > 0 ? "warning" : "success" },
    { label: "LLM Models", value: modelStats.total, sub: `${modelStats.enabled} enabled · ${modelStats.avgLatency}ms avg`, icon: Cpu, tone: "success" },
    { label: "Knowledge Graph", value: knowledgeStats.totalNodes, sub: `${knowledgeStats.totalEdges} relationships`, icon: Brain, tone: "success" },
    { label: "ML Models", value: mlStats.totalModels, sub: `${mlStats.deployed} deployed · ${mlStats.avgAccuracy}% accuracy`, icon: BarChart3, tone: "success" },
    { label: "Prompts", value: promptStats.total, sub: `${promptStats.totalRuns.toLocaleString()} total runs`, icon: FileText, tone: "success" },
    { label: "Pending Review", value: auditStats.pendingReview, sub: `${auditStats.total} total audit entries`, icon: Shield, tone: auditStats.pendingReview > 0 ? "warning" : "success" },
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className={cn("grid h-10 w-10 place-items-center rounded-full", c.tone === "success" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                <c.icon className="h-5 w-5" />
              </span>
              <span className={cn("h-2 w-2 rounded-full", c.tone === "success" ? "bg-success" : "bg-warning")} />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="text-xs text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* AI Platform Metrics */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><BarChart3 className="h-4 w-4 text-accent" /> AI Platform Metrics</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.name} className="rounded-xl bg-surface2/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{m.name}</p>
                <span className={cn("text-xs font-medium", m.trend === "up" && m.status === "good" ? "text-success" : m.trend === "up" ? "text-danger" : m.trend === "down" && m.status === "good" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted")}>
                  {m.changePercent > 0 ? "↑" : m.changePercent < 0 ? "↓" : "→"} {Math.abs(m.changePercent).toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold text-ink">{typeof m.value === "number" && m.value > 1000 ? m.value.toLocaleString() : m.value} <span className="text-xs font-normal text-muted">{m.unit}</span></p>
              <div className="mt-2 flex items-end gap-0.5 h-8">
                {m.sparkline.map((v: number, i: number) => (
                  <div key={i} className="w-1.5 rounded-t bg-accent/40" style={{ height: `${((v) / Math.max(...m.sparkline)) * 100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AGENTS                                                             */
/* ================================================================== */
function AgentsTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { agents, agentStats, updateAgentById } = ctx;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <span>{agentStats.total} agents</span>
        <span className="text-success">{agentStats.running} running</span>
        <span>{agentStats.idle} idle</span>
        {agentStats.error > 0 && <span className="text-danger">{agentStats.error} errors</span>}
        <span>{agentStats.avgSuccessRate}% avg success</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <div key={a.id} className={cn("card p-5", a.status === "running" && "border-success/30", a.status === "error" && "border-danger/30")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 place-items-center rounded-full",
                  a.status === "running" ? "bg-success/15 text-success" :
                  a.status === "error" ? "bg-danger/15 text-danger" :
                  a.status === "paused" ? "bg-warning/15 text-warning" :
                  "bg-accent-soft text-accent"
                )}><Bot className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold text-ink">{a.name}</p>
                  <p className="text-xs text-muted capitalize">{a.capability} · v{a.version}</p>
                </div>
              </div>
              <button onClick={() => updateAgentById(a.id, { status: a.status === "running" ? "paused" : "running" })} className={cn("chip", a.status === "running" && "chip-active")}>
                {a.status}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">{a.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{a.totalRuns.toLocaleString()}</p>
                <p className="text-muted">Runs</p>
              </div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{a.successRate}%</p>
                <p className="text-muted">Success</p>
              </div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{a.avgResponseMs}ms</p>
                <p className="text-muted">Latency</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {a.tags.map((t) => <span key={t} className="badge bg-accent-soft text-accent text-[0.55rem]">{t}</span>)}
              <span className="badge bg-surface2 text-muted text-[0.55rem]">{a.provider}</span>
              <span className="badge bg-surface2 text-muted text-[0.55rem]">{a.model}</span>
            </div>
            {a.lastRun && <p className="mt-2 text-xs text-muted">Last run: {formatDateTime(a.lastRun)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  KNOWLEDGE GRAPH                                                    */
/* ================================================================== */
function KnowledgeTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { knowledgeNodes, knowledgeStats, searchKnowledgeBase } = ctx;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof knowledgeNodes>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setSearchResults(searchKnowledgeBase(searchQuery));
  };

  const display = searchResults.length > 0 ? searchResults : knowledgeNodes;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input-field pl-9" placeholder="Search knowledge base..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        </div>
        <button onClick={handleSearch} className="btn-ghost btn-sm"><Search className="h-4 w-4" /> Search</button>
        <span className="text-xs text-muted">{knowledgeStats.totalNodes} nodes · {knowledgeStats.totalEdges} edges</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {display.map((node) => (
          <div key={node.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent"><Brain className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{node.name}</p>
                  <p className="text-xs text-muted capitalize">{node.type.replace(/_/g, " ")}</p>
                </div>
              </div>
              <span className={cn("text-xs font-semibold", node.confidence >= 0.9 ? "text-success" : node.confidence >= 0.7 ? "text-warning" : "text-muted")}>
                {(node.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-2 text-xs text-muted line-clamp-2">{node.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {node.tags.map((t) => <span key={t} className="badge bg-surface2 text-[0.55rem] text-muted">{t}</span>)}
              <span className="badge bg-surface2 text-[0.55rem] text-muted">v{node.version}</span>
            </div>
            <p className="mt-1 text-[0.6rem] text-muted">Source: {node.source} · Updated: {formatDateTime(node.updatedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MODELS TAB                                                         */
/* ================================================================== */
function ModelsTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { models, modelStats, updateModelById } = ctx;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <span>{modelStats.total} models</span>
        <span className="text-success">{modelStats.enabled} enabled</span>
        <span>{modelStats.avgLatency}ms avg latency</span>
        <span>${modelStats.monthlyCost}/mo estimated</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {models.map((m) => (
          <div key={m.id} className={cn("card p-5", !m.enabled && "opacity-60")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full", m.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-muted capitalize">{m.provider} · {m.version}</p>
                </div>
              </div>
              <button onClick={() => updateModelById(m.id, { enabled: !m.enabled })} className={cn("chip", m.enabled && "chip-active")}>{m.enabled ? "Enabled" : "Disabled"}</button>
            </div>
            <p className="mt-2 text-xs text-muted">{m.contextWindow.toLocaleString()} context · {m.maxOutputTokens.toLocaleString()} max output</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-muted">Cost/1k in</span><p className="font-medium text-ink">${m.costPer1kInput.toFixed(4)}</p></div>
              <div><span className="text-muted">Cost/1k out</span><p className="font-medium text-ink">${m.costPer1kOutput.toFixed(4)}</p></div>
              <div><span className="text-muted">Latency P50</span><p className="font-medium text-ink">{m.latencyP50Ms}ms</p></div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {m.capability.map((c) => <span key={c} className="badge bg-surface2 capitalize text-[0.55rem] text-muted">{c}</span>)}
              {m.tags.map((t) => <span key={t} className="badge bg-accent-soft text-accent text-[0.55rem]">{t}</span>)}
            </div>
            {m.fallbackModelId && <p className="mt-1 text-[0.6rem] text-muted">Fallback: {m.fallbackModelId}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  RAG PIPELINE                                                       */
/* ================================================================== */
function RagTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { ragDocuments, ragStats } = ctx;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-5 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{ragStats.totalDocuments}</p><p className="text-xs text-muted">Documents</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{ragStats.totalChunks.toLocaleString()}</p><p className="text-xs text-muted">Chunks</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{ragStats.indexed}</p><p className="text-xs text-muted">Indexed</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{ragStats.avgChunkSize}</p><p className="text-xs text-muted">Avg Chunks/Doc</p></div>
        {ragStats.processing > 0 && <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{ragStats.processing}</p><p className="text-xs text-muted">Processing</p></div>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ragDocuments.map((doc) => (
          <div key={doc.id} className={cn("card p-4", doc.status === "indexed" ? "border-success/20" : doc.status === "failed" ? "border-danger/30" : "border-warning/20")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-8 w-8 place-items-center rounded-full",
                  doc.status === "indexed" ? "bg-success/15 text-success" : doc.status === "failed" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
                )}><Layers className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{doc.name}</p>
                  <p className="text-xs text-muted capitalize">{doc.source}</p>
                </div>
              </div>
              <span className={cn("badge capitalize", doc.status === "indexed" ? "bg-success/15 text-success" : doc.status === "failed" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{doc.status}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted">
              <span>{doc.chunkCount} chunks</span>
              <span>· Indexed: {formatDateTime(doc.indexedAt)}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {doc.tags.map((t) => <span key={t} className="badge bg-surface2 text-[0.55rem] text-muted">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  GOVERNANCE TAB                                                     */
/* ================================================================== */
function GovernanceTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { auditLogs, auditStats } = ctx;

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{auditStats.total}</p><p className="text-xs text-muted">Total Events</p></div>
        <div className="card p-3 text-center"><p className={cn("text-lg font-semibold", auditStats.pendingReview > 0 ? "text-warning" : "text-success")}>{auditStats.pendingReview}</p><p className="text-xs text-muted">Pending Review</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{auditStats.approved}</p><p className="text-xs text-muted">Approved</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-danger">{auditStats.rejected}</p><p className="text-xs text-muted">Rejected</p></div>
      </div>

      <div className="card overflow-hidden">
        <div className="hide-scrollbar max-h-[65vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-line bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {auditLogs.slice(0, 40).map((l) => (
                <tr key={l.id} className="hover:bg-surface2/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{formatDateTime(l.ts)}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{l.agentName}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{l.model}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{l.tokensUsed.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">${l.cost.toFixed(4)}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("badge capitalize", l.success ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{l.success ? "OK" : "Fail"}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("badge capitalize",
                      l.status === "approved" ? "bg-success/15 text-success" :
                      l.status === "rejected" ? "bg-danger/15 text-danger" :
                      "bg-warning/15 text-warning"
                    )}>{l.status.replace(/_/g, " ")}</span>
                    {l.reviewedBy && <p className="text-[0.55rem] text-muted mt-0.5">by {l.reviewedBy}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ML MODELS TAB                                                      */
/* ================================================================== */
function MlTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { mlModels, mlStats } = ctx;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-sm text-muted mb-4">
        <span>{mlStats.totalModels} ML models</span>
        <span className="text-success">{mlStats.deployed} deployed</span>
        <span>{mlStats.avgAccuracy}% avg accuracy</span>
        <span>{mlStats.totalPredictions.toLocaleString()} total predictions</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {mlModels.map((m) => (
          <div key={m.id} className={cn("card p-5", m.status === "deployed" && "border-success/20", m.status === "training" && "border-warning/20")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full",
                  m.status === "deployed" ? "bg-success/15 text-success" : m.status === "training" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted"
                )}><BarChart3 className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-muted capitalize">{m.type} · v{m.version}</p>
                </div>
              </div>
              <span className={cn("badge capitalize", m.status === "deployed" ? "bg-success/15 text-success" : m.status === "training" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{m.status}</span>
            </div>
            {m.status === "deployed" && (
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{(m.accuracy * 100).toFixed(0)}%</p><p className="text-muted">Acc</p></div>
                <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{(m.precision * 100).toFixed(0)}%</p><p className="text-muted">Prec</p></div>
                <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{(m.recall * 100).toFixed(0)}%</p><p className="text-muted">Rec</p></div>
                <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{(m.f1Score * 100).toFixed(0)}%</p><p className="text-muted">F1</p></div>
              </div>
            )}
            <div className="mt-2 text-xs text-muted">
              <span>Features: {m.features.join(", ")}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.tags.map((t) => <span key={t} className="badge bg-accent-soft text-accent text-[0.55rem]">{t}</span>)}
            </div>
            {m.totalPredictions > 0 && <p className="mt-1 text-[0.6rem] text-muted">{m.totalPredictions.toLocaleString()} predictions · Last: {formatDateTime(m.lastInference || m.trainingDate)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FORECASTING TAB                                                    */
/* ================================================================== */
function ForecastingTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { forecasts } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{forecasts.length} active forecasts</p>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {forecasts.map((f) => {
          const pctChange = ((f.predictedValue - f.currentValue) / f.currentValue) * 100;
          return (
            <div key={f.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{f.metric}</p>
                  <p className="text-xs text-muted">{f.period}</p>
                </div>
                <span className={cn("badge", f.confidence >= 0.8 ? "bg-success/15 text-success" : f.confidence >= 0.6 ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                  {(f.confidence * 100).toFixed(0)}% conf
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted">Current</p>
                  <p className="text-lg font-semibold text-ink">{typeof f.currentValue === "number" && f.currentValue > 1000 ? f.currentValue.toLocaleString() : f.currentValue}</p>
                </div>
                <div className="flex-1 text-center">
                  <span className={cn("text-lg font-bold", pctChange >= 0 ? "text-success" : "text-danger")}>
                    {pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange).toFixed(1)}%
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">Predicted</p>
                  <p className="text-lg font-semibold text-ink">{typeof f.predictedValue === "number" && f.predictedValue > 1000 ? f.predictedValue.toLocaleString() : f.predictedValue}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted">Range: {typeof f.lowerBound === "number" && f.lowerBound > 1000 ? f.lowerBound.toLocaleString() : f.lowerBound} – {typeof f.upperBound === "number" && f.upperBound > 1000 ? f.upperBound.toLocaleString() : f.upperBound}</p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${((f.predictedValue - f.lowerBound) / (f.upperBound - f.lowerBound)) * 100}%` }} />
                </div>
              </div>

              <p className="mt-2 text-[0.6rem] text-muted">Generated: {formatDateTime(f.generatedAt)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ASSISTANTS TAB                                                     */
/* ================================================================== */
function AssistantsTab({ ctx }: { ctx: ReturnType<typeof useIntelligence> }) {
  const { assistants } = ctx;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted mb-4">{assistants.filter((a) => a.enabled).length}/{assistants.length} assistants active</p>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {assistants.map((asst) => (
          <div key={asst.id} className={cn("card p-5", !asst.enabled && "opacity-60")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 place-items-center rounded-full", asst.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{asst.name}</p>
                  <p className="text-xs text-muted capitalize">{asst.role.replace(/_/g, " ")}</p>
                </div>
              </div>
              <span className={cn("chip", asst.enabled && "chip-active")}>{asst.enabled ? "Active" : "Disabled"}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{asst.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{asst.totalConversations}</p><p className="text-muted">Conversations</p></div>
              <div className="rounded bg-surface2/40 p-2 text-center"><p className="font-semibold text-ink">{asst.totalMessages.toLocaleString()}</p><p className="text-muted">Messages</p></div>
              <div className="rounded bg-surface2/40 p-2 text-center">
                <p className="font-semibold text-ink">{asst.avgRating.toFixed(1)} ★</p>
                <p className="text-muted">Rating</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {asst.capabilities.map((c) => <span key={c} className="badge bg-surface2 capitalize text-[0.55rem] text-muted">{c.replace(/_/g, " ")}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
