/**
 * ALAYA INSIDER — Decision Intelligence (PART 3.8)
 * Decision support, scenario planning, what-if analysis, and strategic planning.
 */
import { useState, useMemo } from "react";
import { GitBranch, Shield, Target, TrendingUp, DollarSign, ArrowRight, Globe, Zap } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getExecDecisions, getScenarioPlans, type DecisionCategory, type ScenarioPlan } from "../../lib/executiveIntelligence";
import { formatDateTime } from "../../lib/utils";

type DecTab = "decisions" | "scenarios";

const CATEGORIES: { id: DecisionCategory; label: string; icon: typeof Shield }[] = [
  { id: "strategic", label: "Strategic", icon: Target },
  { id: "operational", label: "Operational", icon: GitBranch },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "marketing", label: "Marketing", icon: TrendingUp },
  { id: "product", label: "Product", icon: Target },
  { id: "growth", label: "Growth", icon: Globe },
  { id: "risk", label: "Risk", icon: Shield },
  { id: "ai", label: "AI", icon: Zap },
];

export default function AdminDecisionIntelligence() {
  const [tab, setTab] = useState<DecTab>("decisions");
  const [category, setCategory] = useState<DecisionCategory | "all">("all");
  const decisions = useMemo(() => getExecDecisions(), []);
  const scenarios = useMemo(() => getScenarioPlans(), []);

  const filteredDecisions = category === "all" ? decisions : decisions.filter((d) => d.category === category);

  return (
    <>
      <Seo title="Decision Intelligence" path="/admin/decision-intelligence" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Decision Intelligence</h1>
            <p className="mt-1 text-sm text-muted">Decision support, scenario planning, and what-if analysis powered by AI.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setTab("decisions")} className={cn("btn-sm", tab === "decisions" ? "btn-primary" : "btn-ghost")}><Shield className="h-4 w-4" /> Decisions ({decisions.length})</button>
          <button onClick={() => setTab("scenarios")} className={cn("btn-sm", tab === "scenarios" ? "btn-primary" : "btn-ghost")}><GitBranch className="h-4 w-4" /> Scenarios ({scenarios.length})</button>
        </div>

        {tab === "decisions" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategory("all")} className={cn("badge cursor-pointer", category === "all" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>All</button>
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={cn("badge cursor-pointer capitalize", category === c.id ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                  <c.icon className="h-3 w-3 mr-1" /> {c.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredDecisions.map((d) => (
                <div key={d.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("grid h-8 w-8 place-items-center rounded-full", d.impact === "critical" ? "bg-danger/15 text-danger" : d.impact === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>
                          <Shield className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{d.title}</p>
                          <p className="text-xs text-muted capitalize">{d.category} · {d.impact} impact · {(d.confidence * 100).toFixed(0)}% AI confidence</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted">{d.description}</p>
                    </div>
                    <span className={cn("badge capitalize", d.status === "actioned" ? "bg-success/15 text-success" : d.status === "decided" ? "bg-accent-soft text-accent" : d.status === "in_review" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{d.status.replace(/_/g, " ")}</span>
                  </div>

                  {d.options.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {d.options.map((opt) => (
                        <div key={opt.id} className={cn("rounded-lg border p-3", d.selectedOption === opt.id ? "border-accent bg-accent-soft/10" : "border-line")}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-ink">{opt.label}</p>
                            <span className={cn("badge", opt.riskLevel === "low" ? "bg-success/15 text-success" : opt.riskLevel === "medium" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{opt.riskLevel} risk</span>
                          </div>
                          <p className="mt-1 text-xs text-muted">{opt.description}</p>
                          <div className="mt-2 space-y-0.5">
                            {opt.pros.slice(0, 2).map((p, i) => <p key={i} className="text-[0.55rem] text-success">✓ {p}</p>)}
                            {opt.cons.slice(0, 2).map((c, i) => <p key={i} className="text-[0.55rem] text-danger">✗ {c}</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {d.risks.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[0.55rem] font-medium text-muted">Risks ({d.risks.length})</summary>
                      <div className="mt-2 space-y-1">
                        {d.risks.map((r, i) => (
                          <p key={i} className="text-[0.55rem] text-muted">{r.description} ({(r.probability * 100).toFixed(0)}% · {r.impact})</p>
                        ))}
                      </div>
                    </details>
                  )}

                  <div className="mt-2 flex items-center gap-3 text-[0.55rem] text-muted">
                    <span>Created: {formatDateTime(d.createdAt)}</span>
                    {d.stakeholders.length > 0 && <span>Stakeholders: {d.stakeholders.join(", ")}</span>}
                  </div>
                </div>
              ))}
              {filteredDecisions.length === 0 && <EmptyState icon={<Shield className="h-6 w-6" />} title="No decisions" description="No decisions in this category." />}
            </div>
          </div>
        )}

        {tab === "scenarios" && (
          <div className="mt-6 space-y-4">
            {scenarios.map((s) => <ScenarioCard key={s.id} scenario={s} />)}
            {scenarios.length === 0 && <EmptyState icon={<GitBranch className="h-6 w-6" />} title="No scenarios" description="No scenario plans created yet." />}
          </div>
        )}
      </div>
    </>
  );
}

function ScenarioCard({ scenario }: { scenario: ScenarioPlan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("card p-5", scenario.status === "actioned" && "border-success/20")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-9 w-9 place-items-center rounded-full", scenario.risk === "low" ? "bg-success/15 text-success" : scenario.risk === "medium" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
            <GitBranch className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-ink">{scenario.name}</p>
            <p className="text-xs text-muted">{scenario.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("badge capitalize", scenario.risk === "low" ? "bg-success/15 text-success" : scenario.risk === "medium" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{scenario.risk} risk</span>
          <span className={cn("badge capitalize", scenario.status === "actioned" ? "bg-success/15 text-success" : scenario.status === "analyzed" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{scenario.status}</span>
        </div>
      </div>

      <button onClick={() => setExpanded(!expanded)} className="mt-3 flex items-center gap-1 text-xs text-muted hover:text-ink">
        {expanded ? "Hide" : "Show"} details ({scenario.assumptions.length} assumptions, {scenario.outcomes.length} outcomes)
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted mb-2">Assumptions</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {scenario.assumptions.map((a, i) => (
                <div key={i} className="rounded bg-surface2/40 p-2 text-xs">
                  <p className="text-muted">{a.variable}</p>
                  <p className="font-medium text-ink">{a.baseValue} → <span className={a.scenarioValue > a.baseValue ? "text-warning" : "text-success"}>{a.scenarioValue}</span> {a.unit}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted mb-2">Projected Outcomes</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {scenario.outcomes.map((o, i) => (
                <div key={i} className="rounded-lg border border-line p-3">
                  <p className="text-xs text-muted">{o.metric}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-muted">{o.baseValue}{o.unit}</span>
                    <ArrowRight className="h-3 w-3 text-muted" />
                    <span className={cn("text-sm font-bold", o.change >= 0 ? "text-success" : "text-danger")}>{o.scenarioValue}{o.unit}</span>
                  </div>
                  <span className={cn("text-xs font-medium", o.change >= 0 ? "text-success" : "text-danger")}>{o.change >= 0 ? "+" : ""}{o.change.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[0.55rem] text-muted">
            <span>Confidence: {(scenario.confidence * 100).toFixed(0)}%</span>
            <span>By: {scenario.createdBy.toUpperCase()}</span>
            <span>{formatDateTime(scenario.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
