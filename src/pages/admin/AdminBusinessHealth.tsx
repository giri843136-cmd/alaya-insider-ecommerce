/**
 * ALAYA INSIDER — Business Health (PART 3.8)
 * Health scoring, business maturity, risk analysis, and opportunity tracking.
 */
import { useMemo } from "react";
import { Activity, AlertTriangle, Lightbulb } from "lucide-react";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { getBusinessHealthScores, getOverallBusinessHealth, getExecutiveInsights, type BusinessHealthArea } from "../../lib/executiveIntelligence";

const HEALTH_AREAS: { id: BusinessHealthArea; label: string; description: string }[] = [
  { id: "revenue", label: "Revenue Health", description: "Revenue growth, stability, and forecasts" },
  { id: "operations", label: "Operations Health", description: "Fulfilment efficiency, NPS, infrastructure" },
  { id: "customers", label: "Customer Health", description: "Acquisition, retention, satisfaction" },
  { id: "growth", label: "Growth Health", description: "Market expansion and business growth" },
  { id: "ai", label: "AI & Innovation", description: "AI adoption, automation, and innovation" },
  { id: "risk", label: "Risk Management", description: "Risk exposure and mitigation readiness" },
  { id: "innovation", label: "Innovation Score", description: "R&D, projects, and feature velocity" },
];

export default function AdminBusinessHealth() {
  const healthScores = useMemo(() => getBusinessHealthScores(), []);
  const overall = useMemo(() => getOverallBusinessHealth(), []);
  const insights = useMemo(() => getExecutiveInsights(), []);

  return (
    <>
      <Seo title="Business Health" path="/admin/business-health" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Business Health</h1>
            <p className="mt-1 text-sm text-muted">Enterprise health scoring, risk analysis, and opportunity tracking.</p>
          </div>
        </div>

        {/* Overall Health Score */}
        <div className="mt-6 card p-6 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-accent/30">
            <div>
              <p className={cn("font-display text-3xl font-bold", overall.status === "good" ? "text-success" : overall.status === "critical" ? "text-danger" : "text-warning")}>{overall.score}%</p>
              <p className="text-xs text-muted capitalize">{overall.status}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Overall Business Health Score
            <span className={cn("ml-2", overall.trend === "up" ? "text-success" : overall.trend === "down" ? "text-danger" : "text-muted")}>
              {overall.trend === "up" ? "↑ Improving" : overall.trend === "down" ? "↓ Declining" : "→ Stable"}
            </span>
            <span className="ml-2 text-xs">(prev: {overall.previousScore}%)</span>
          </p>
        </div>

        {/* Health Areas */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {healthScores.map((h) => {
            const areaInfo = HEALTH_AREAS.find((a) => a.id === h.area);
            return (
              <div key={h.area} className={cn("card p-5", h.status === "critical" && "border-danger/30", h.status === "warning" && "border-warning/20")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full", h.status === "good" ? "bg-success/15 text-success" : h.status === "critical" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>
                      <Activity className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{areaInfo?.label || h.area}</p>
                      <p className="text-xs text-muted">{areaInfo?.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-bold", h.score >= 80 ? "text-success" : h.score >= 60 ? "text-warning" : "text-danger")}>{h.score}/100</p>
                    <p className={cn("text-xs", h.trend === "up" ? "text-success" : h.trend === "down" ? "text-danger" : "text-muted")}>{h.trend === "up" ? "↑" : h.trend === "down" ? "↓" : "→"} {h.previousScore} prev</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full", h.score >= 80 ? "bg-success" : h.score >= 60 ? "bg-warning" : "bg-danger")} style={{ width: `${h.score}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {h.metrics.map((m) => (
                    <div key={m.name} className="rounded bg-surface2/40 p-2 text-center">
                      <p className="font-medium text-ink">{typeof m.value === "number" && m.value > 1000 ? m.value.toLocaleString() : m.value}{m.unit}</p>
                      <p className="text-muted">{m.name}</p>
                    </div>
                  ))}
                </div>
                {h.recommendations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {h.recommendations.map((r, i) => (
                      <p key={i} className="text-[0.55rem] text-muted flex items-start gap-1">
                        <Lightbulb className="h-2.5 w-2.5 mt-0.5 shrink-0 text-accent" /> {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Critical Insights */}
        {insights.filter((i) => i.impact === "critical" || i.impact === "high").length > 0 && (
          <div className="mt-6 card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-danger" /> Critical & High Impact Insights</h3>
            <div className="mt-4 space-y-2">
              {insights.filter((i) => i.impact === "critical" || i.impact === "high").map((ins) => (
                <div key={ins.id} className="rounded-lg border border-line p-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", ins.impact === "critical" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{ins.impact}</span>
                    <span className="text-sm font-medium text-ink">{ins.title}</span>
                    <span className="text-xs text-muted ml-auto">{(ins.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{ins.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
