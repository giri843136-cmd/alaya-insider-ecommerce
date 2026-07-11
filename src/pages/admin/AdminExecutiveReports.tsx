/**
 * ALAYA INSIDER — Executive Reports (PART 3.8)
 * Daily, weekly, monthly, quarterly, annual reports for each executive role.
 */
import { useState, useMemo } from "react";
import { FileText, Crown, Wrench, TrendingUp, Cpu, DollarSign, Plus } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getExecutiveReports, generateExecutiveReport, type ExecutiveRole, type ReportPeriod } from "../../lib/executiveIntelligence";
import { formatDateTime } from "../../lib/utils";

const ROLE_CONFIG = [
  { id: "ceo" as ExecutiveRole, label: "CEO", icon: Crown, color: "text-accent" },
  { id: "coo" as ExecutiveRole, label: "COO", icon: Wrench, color: "text-info" },
  { id: "cmo" as ExecutiveRole, label: "CMO", icon: TrendingUp, color: "text-success" },
  { id: "cto" as ExecutiveRole, label: "CTO", icon: Cpu, color: "text-warning" },
  { id: "cfo" as ExecutiveRole, label: "CFO", icon: DollarSign, color: "text-danger" },
];

const PERIODS: ReportPeriod[] = ["daily", "weekly", "monthly", "quarterly", "annual"];

export default function AdminExecutiveReports() {
  const [role, setRole] = useState<ExecutiveRole | "all">("all");
  const [period, setPeriod] = useState<ReportPeriod | "all">("all");
  const [, refresh] = useState(0);
  const reports = useMemo(() => {
    let all = getExecutiveReports();
    if (role !== "all") all = all.filter((r) => r.role === role);
    if (period !== "all") all = all.filter((r) => r.period === period);
    return all;
  }, [role, period]);

  const handleGenerate = (r: ExecutiveRole, p: ReportPeriod) => {
    generateExecutiveReport(r, p);
    refresh((n) => n + 1);
  };

  return (
    <>
      <Seo title="Executive Reports" path="/admin/executive-reports" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Executive Reports</h1>
            <p className="mt-1 text-sm text-muted">Generate and manage executive briefings across all roles and periods.</p>
          </div>
        </div>

        {/* Generate Panel */}
        <div className="mt-6 card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Plus className="h-4 w-4 text-accent" /> Generate New Report</h3>
          <div className="mt-4 space-y-3">
            {ROLE_CONFIG.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2">
                <span className={cn("flex w-12 items-center gap-1 text-sm font-medium", r.color)}><r.icon className="h-4 w-4" /> {r.label}</span>
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => handleGenerate(r.id, p)} className="btn-ghost btn-xs capitalize">
                    {p}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setRole("all")} className={cn("btn-sm", role === "all" ? "btn-primary" : "btn-ghost")}>All Roles</button>
          {ROLE_CONFIG.map((r) => (
            <button key={r.id} onClick={() => setRole(r.id)} className={cn("btn-sm", role === r.id ? "btn-primary" : "btn-ghost")}>
              <r.icon className={cn("h-4 w-4", r.color)} /> {r.label}
            </button>
          ))}
          <span className="mx-2 text-muted">|</span>
          <button onClick={() => setPeriod("all")} className={cn("btn-sm", period === "all" ? "btn-primary" : "btn-ghost")}>All Periods</button>
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("btn-sm capitalize", period === p ? "btn-primary" : "btn-ghost")}>{p}</button>
          ))}
        </div>

        {/* Reports List */}
        <div className="mt-6 space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{r.title}</p>
                      <Badge variant={r.status === "final" ? "success" : "neutral"}>{r.status}</Badge>
                      <span className="badge bg-surface2 capitalize text-muted">{r.period}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{r.summary}</p>
                  </div>
                </div>
                <span className="text-xs text-muted shrink-0">{formatDateTime(r.generatedAt)}</span>
              </div>

              {/* Key Highlights */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {r.keyHighlights.map((h, i) => (
                  <div key={i} className="rounded bg-surface2/40 p-2 text-center">
                    <p className={cn("text-xs font-bold", h.direction === "up" ? "text-success" : h.direction === "down" ? "text-danger" : "text-muted")}>{h.value}</p>
                    <p className="text-[0.5rem] text-muted">{h.metric}</p>
                    <p className={cn("text-[0.45rem]", h.direction === "up" ? "text-success" : h.direction === "down" ? "text-danger" : "text-muted")}>{h.change}</p>
                  </div>
                ))}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted hover:text-ink">{r.insights.length} Insights · {r.recommendations.length} Recommendations · {r.riskFlags.length} Risk Flags</summary>
                <div className="mt-3 space-y-3">
                  {r.insights.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted mb-1">Key Insights</p>
                      <ul className="space-y-0.5">
                        {r.insights.map((ins, i) => <li key={i} className="text-xs text-muted flex items-start gap-1"><span className="text-accent mt-0.5">•</span> {ins}</li>)}
                      </ul>
                    </div>
                  )}
                  {r.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-success mb-1">Recommendations</p>
                      <ul className="space-y-0.5">
                        {r.recommendations.map((rec, i) => <li key={i} className="text-xs text-success flex items-start gap-1"><span className="mt-0.5">✓</span> {rec}</li>)}
                      </ul>
                    </div>
                  )}
                  {r.riskFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-danger mb-1">Risk Flags</p>
                      <ul className="space-y-0.5">
                        {r.riskFlags.map((rf, i) => <li key={i} className="text-xs text-danger flex items-start gap-1"><span className="mt-0.5">⚠</span> {rf}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            </div>
          ))}
          {reports.length === 0 && <EmptyState icon={<FileText className="h-6 w-6" />} title="No reports" description="Generate executive reports using the panel above." />}
        </div>
      </div>
    </>
  );
}
