/**
 * ALAYA INSIDER — AI Knowledge Platform (PART 3.7)
 * Knowledge graph, memory platform, and decision engine.
 */
import { useState, useMemo } from "react";
import { Brain, Database, Search, GitBranch, Zap } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getMemoryEntries, searchMemory, getMemoryStats, getDecisionPolicies, getDecisionLogs, type MemoryEntry } from "../../lib/aiWorkspace";

type KTab = "memory" | "knowledge" | "decisions";

export default function AdminAiKnowledgePlatform() {
  const [tab, setTab] = useState<KTab>("memory");
  const [, _rerender] = useState(0);
  const memories = useMemo(() => getMemoryEntries(), []);
  const stats = useMemo(() => getMemoryStats(), []);
  const policies = useMemo(() => getDecisionPolicies(), []);
  const decisionLogs = useMemo(() => getDecisionLogs(20), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemoryEntry[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchResults(searchMemory(searchQuery));
  };

  return (
    <>
      <Seo title="AI Knowledge Platform" path="/admin/ai-knowledge" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Knowledge Platform</h1>
            <p className="mt-1 text-sm text-muted">Enterprise knowledge graph, memory systems, and decision engine.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {([["memory", "Memory", Brain], ["knowledge", "Knowledge Graph", GitBranch], ["decisions", "Decision Engine", Zap]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("btn-sm capitalize", tab === id ? "btn-primary" : "btn-ghost")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "memory" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total Entries", value: stats.total, icon: Brain },
                { label: "High Importance", value: stats.highImportance, icon: Zap },
                { label: "Business Memory", value: stats.byType.business, icon: Database },
                { label: "Avg Access", value: stats.avgAccessCount, icon: Search },
              ].map((m) => (
                <div key={m.label} className="card p-4 text-center">
                  <m.icon className="h-5 w-5 mx-auto text-accent" />
                  <p className="mt-2 text-xl font-semibold text-ink">{m.value}</p>
                  <p className="text-xs text-muted">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="input-field pl-9" placeholder="Search memory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              </div>
              <button onClick={handleSearch} className="btn-ghost btn-sm"><Search className="h-4 w-4" /> Search</button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {(searchResults.length > 0 ? searchResults : memories).map((m) => (
                <div key={m.id} className={cn("card p-4", m.importance >= 4 && "border-accent/20")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("grid h-8 w-8 place-items-center rounded-full text-xs font-bold", m.importance >= 4 ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{m.importance}</span>
                      <div>
                        <p className="font-medium text-ink text-sm">{m.key}</p>
                        <p className="text-[0.55rem] text-muted capitalize">{m.type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <Badge variant={m.importance >= 4 ? "info" : "neutral"}>Imp {m.importance}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted line-clamp-2">{m.content}</p>
                  <div className="mt-2 flex items-center gap-2 text-[0.5rem] text-muted">
                    <span>{m.source}</span>
                    {m.tags.map((t) => <Badge key={t} variant="neutral">{t}</Badge>)}
                    <span className="ml-auto">Accessed {m.accessCount}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "knowledge" && (
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="card p-4 text-center">
                <p className="text-xs text-muted">Memory (Short Term)</p>
                <p className="text-xl font-semibold text-ink mt-1">{stats.byType.short_term}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-muted">Memory (Long Term)</p>
                <p className="text-xl font-semibold text-ink mt-1">{stats.byType.long_term}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-muted">Semantic Knowledge</p>
                <p className="text-xl font-semibold text-ink mt-1">{stats.byType.semantic}</p>
              </div>
            </div>
            <p className="text-sm text-muted">Knowledge graph visualization and relationship mapping coming in a future update. Memory entries serve as the foundation for the enterprise knowledge base.</p>
          </div>
        )}

        {tab === "decisions" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {policies.map((p) => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      <p className="text-xs text-muted">{p.description}</p>
                    </div>
                    <Badge variant={p.enabled ? "success" : "neutral"}>{p.enabled ? "Active" : "Disabled"}</Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    {p.rules.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs rounded bg-surface2/40 px-2 py-1">
                        <span className="text-muted font-mono">{r.condition}</span>
                        <span className="text-ink">→ {r.action.replace(/_/g, " ")}</span>
                        <span className="text-muted">w: {r.weight}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.55rem] text-muted">v{p.version} · {p.rules.length} rules</p>
                </div>
              ))}
            </div>

            {decisionLogs.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Recent Decisions</h3>
                <div className="space-y-2">
                  {decisionLogs.slice(0, 10).map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-line p-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink truncate">{l.policyName}</p>
                        <p className="text-xs text-muted">Decision: {l.decision.replace(/_/g, " ")} · Confidence: {(l.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={l.requiresApproval ? "warning" : "success"}>{l.requiresApproval ? "Needs review" : "Auto-approved"}</Badge>
                        <span className="text-[0.55rem] text-muted">{l.durationMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
