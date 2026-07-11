/**
 * ALAYA INSIDER — Enterprise Executive Intelligence Platform (PART 3.8)
 * ------------------------------------------------------------------
 * Business Operating System: KPI engine, executive reports, forecasting,
 * digital twin, scenario planning, decision intelligence, OKR platform,
 * business health scoring, AI recommendations, and executive search.
 *
 * Integrates with: businessIntelligence.ts, intelligence.ts, aiWorkspace.ts,
 * analytics.ts, types.ts
 */
import { uid } from "./utils";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const EXEC_KEY = "alaya_exec_intel_v1";
const DAY_MS = 86400000;
export const MAX_EXECUTIVE_REPORTS = 100;
export const MAX_DECISIONS = 200;
export const MAX_DIGITAL_TWIN_SNAPSHOTS = 50;

/* ================================================================== */
/*  TYPES — Executive Intelligence                                    */
/* ================================================================== */

export type ExecutiveRole = "ceo" | "coo" | "cto" | "cmo" | "cfo";
export type ReportPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "annual";
export type BusinessHealthArea = "revenue" | "operations" | "customers" | "growth" | "ai" | "risk" | "innovation";
export type DecisionCategory = "strategic" | "operational" | "financial" | "marketing" | "product" | "growth" | "risk" | "ai";
export type DigitalTwinDomain = "business" | "customer" | "commerce" | "marketing" | "infrastructure" | "workflow" | "ai";
export type ForecastHorizon = "7d" | "30d" | "90d" | "180d" | "1y";

/* ================================================================== */
/*  MODULE 1: EXECUTIVE KPI ENGINE & SCORECARDS                       */
/* ================================================================== */

export interface ExecutiveKpi {
  id: string;
  name: string;
  role: ExecutiveRole;
  category: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "on_track" | "at_risk" | "behind" | "achieved";
  sparkline: number[];
  description: string;
  lastUpdated: number;
}

export interface BusinessHealthScore {
  area: BusinessHealthArea;
  score: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  metrics: { name: string; value: number; target: number; unit: string }[];
  recommendations: string[];
}

export function getExecutiveKpis(role?: ExecutiveRole): ExecutiveKpi[] {
  try {
    const all: ExecutiveKpi[] = JSON.parse(localStorage.getItem(`${EXEC_KEY}_kpis`) || "[]");
    return role ? all.filter((k) => k.role === role) : all;
  } catch { return []; }
}

export function getBusinessHealthScores(): BusinessHealthScore[] {
  try { return JSON.parse(localStorage.getItem(`${EXEC_KEY}_health`) || "[]"); } catch { return []; }
}

export function getOverallBusinessHealth(): { score: number; previousScore: number; trend: "up" | "down" | "stable"; status: "good" | "warning" | "critical" } {
  const scores = getBusinessHealthScores();
  if (!scores.length) return { score: 0, previousScore: 0, trend: "stable", status: "warning" };
  const avg = Math.round(scores.reduce((s, h) => s + h.score, 0) / scores.length);
  const prevAvg = Math.round(scores.reduce((s, h) => s + h.previousScore, 0) / scores.length);
  const critical = scores.filter((h) => h.status === "critical").length;
  return {
    score: avg, previousScore: prevAvg,
    trend: avg > prevAvg ? "up" : avg < prevAvg ? "down" : "stable",
    status: critical > 0 ? "critical" : avg >= 70 ? "good" : "warning",
  };
}



/* ================================================================== */
/*  MODULE 2: EXECUTIVE REPORTS                                       */
/* ================================================================== */

export interface ExecutiveReport {
  id: string;
  title: string;
  period: ReportPeriod;
  role: ExecutiveRole;
  summary: string;
  keyHighlights: { metric: string; value: string; change: string; direction: "up" | "down" | "neutral" }[];
  insights: string[];
  recommendations: string[];
  riskFlags: string[];
  sections: { title: string; content: string; metrics?: { label: string; value: string }[] }[];
  generatedAt: number;
  periodStart: number;
  periodEnd: number;
  status: "draft" | "final" | "sent";
}

export function getExecutiveReports(role?: ExecutiveRole, period?: ReportPeriod): ExecutiveReport[] {
  try {
    let all: ExecutiveReport[] = JSON.parse(localStorage.getItem(`${EXEC_KEY}_reports`) || "[]");
    if (role) all = all.filter((r) => r.role === role);
    if (period) all = all.filter((r) => r.period === period);
    return all;
  } catch { return []; }
}

export function generateExecutiveReport(role: ExecutiveRole, period: ReportPeriod): ExecutiveReport {
  const now = Date.now();
  const periodStart = period === "daily" ? now - DAY_MS : period === "weekly" ? now - 7 * DAY_MS : period === "monthly" ? now - 30 * DAY_MS : period === "quarterly" ? now - 90 * DAY_MS : now - 365 * DAY_MS;

  const report: ExecutiveReport = {
    id: uid("exr"),
    title: `${role.toUpperCase()} ${period.charAt(0).toUpperCase() + period.slice(1)} Brief`,
    period, role,
    summary: `ALAYA INSIDER delivered ${period} performance with revenue at $284,500, ${period === "annual" ? "representing 18.5% YoY growth" : `${period === "daily" ? "up 4.2%" : period === "weekly" ? "up 8.7%" : "up 12.5%"} vs previous ${period}`}. Key achievements include expanded affiliate partnerships and improved AI automation rate.`,
    keyHighlights: [
      { metric: "Revenue", value: "$284,500", change: "+12.5%", direction: "up" },
      { metric: "Orders", value: "1,240", change: "+8.2%", direction: "up" },
      { metric: "New Customers", value: "180", change: "+15.4%", direction: "up" },
      { metric: "AOV", value: "$229", change: "+6.5%", direction: "up" },
      { metric: "Affiliate Revenue", value: "$142,000", change: "+22.3%", direction: "up" },
      { metric: "AI Automation Rate", value: "34.5%", change: "+6.5pp", direction: "up" },
    ],
    insights: [
      `Skincare category continues to lead growth at 28% YoY, now representing 32% of total revenue.`,
      `Affiliate channel showed strongest ROI at 320%, driven by NET-A-PORTER and SSENSE partnerships.`,
      `Customer retention rate improved to 72%, up from 68% last ${period}, attributed to improved CX.`,
      `AI-powered SEO optimization generated 42% increase in organic traffic.`,
      `Inventory turnover rate improved to 4.8x, reducing carrying costs by 8%.`,
    ],
    recommendations: [
      `Increase affiliate commission budget by 15% to capture additional high-ROI partners.`,
      `Launch personalization engine to increase AOV and conversion rate by an estimated 12%.`,
      `Expand EU market presence with localized content and partnerships.`,
      `Accelerate AI agent deployment to achieve 50% automation rate by Q3.`,
    ],
    riskFlags: [
      `Order fulfilment rate declining (94.2% vs 98.5% target) — investigate carrier performance.`,
      `CAC remains elevated at $48.50 against $35 target — review paid channel efficiency.`,
      `Single-supplier dependency for 3 top-selling SKUs — identify backup suppliers.`,
      `AI cost increasing 15.6% month-over-month — implement model optimization.`,
    ],
    sections: [
      { title: "Revenue Performance", content: `${role.toUpperCase()} ${period} revenue reached $284,500, representing 12.5% growth over the previous ${period}. All key channels showed positive growth.`, metrics: [{ label: "Total Revenue", value: "$284,500" }, { label: "Growth Rate", value: "12.5%" }, { label: "Revenue vs Target", value: "88.9%" }] },
      { title: "Channel Performance", content: "Organic search remains the largest channel at 42% of revenue. Affiliate channel grew 22.3% and now represents 18% of total. Direct traffic shows strong brand recognition.", metrics: [{ label: "Organic", value: "42%" }, { label: "Direct", value: "24%" }, { label: "Affiliate", value: "18%" }] },
      { title: "Customer Metrics", content: "Acquired 180 new customers with an improved retention rate of 72%. Customer satisfaction remains high with NPS of 72.", metrics: [{ label: "New Customers", value: "180" }, { label: "Retention Rate", value: "72%" }, { label: "NPS", value: "72" }] },
    ],
    generatedAt: now,
    periodStart, periodEnd: now,
    status: "final",
  };

  const all = getExecutiveReports();
  all.unshift(report);
  if (all.length > MAX_EXECUTIVE_REPORTS) all.splice(MAX_EXECUTIVE_REPORTS);
  try { localStorage.setItem(`${EXEC_KEY}_reports`, JSON.stringify(all)); } catch { /* ignore */ }
  return report;
}

/* ================================================================== */
/*  MODULE 3: FORECASTING CENTER                                      */
/* ================================================================== */

export interface ExecForecast {
  id: string;
  name: string;
  domain: string;
  horizon: ForecastHorizon;
  currentValue: number;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  methodology: string;
  dataPoints: { date: string; actual: number; predicted: number }[];
  drivers: string[];
  risks: string[];
  generatedAt: number;
}

export function getExecForecasts(domain?: string): ExecForecast[] {
  try {
    const all: ExecForecast[] = JSON.parse(localStorage.getItem(`${EXEC_KEY}_forecasts`) || "[]");
    return domain ? all.filter((f) => f.domain === domain) : all;
  } catch { return []; }
}

export function getForecastStats(): { total: number; avgConfidence: number; highConfidenceCount: number } {
  const all = getExecForecasts();
  return {
    total: all.length,
    avgConfidence: all.length ? Math.round(all.reduce((s, f) => s + f.confidence, 0) / all.length * 100) : 0,
    highConfidenceCount: all.filter((f) => f.confidence >= 0.8).length,
  };
}

/* ================================================================== */
/*  MODULE 4: DECISION INTELLIGENCE & SCENARIO PLANNING              */

/* ================================================================== */
/*  MODULE 4: DECISION INTELLIGENCE & SCENARIO PLANNING              */
/* ================================================================== */

export interface ExecDecision {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  impact: "low" | "medium" | "high" | "critical";
  urgency: "low" | "medium" | "high" | "critical";
  confidence: number;
  options: DecisionOption[];
  selectedOption?: string;
  status: "pending" | "in_review" | "decided" | "actioned" | "rejected";
  owner?: ExecutiveRole;
  stakeholders: string[];
  risks: { description: string; probability: number; impact: string }[];
  expectedOutcome: string;
  actualOutcome?: string;
  createdAt: number;
  decidedAt?: number;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  projectedImpact: { metric: string; value: string }[];
  confidence: number;
  riskLevel: "low" | "medium" | "high";
}

export interface ScenarioPlan {
  id: string;
  name: string;
  description: string;
  assumptions: { variable: string; baseValue: number; scenarioValue: number; unit: string }[];
  outcomes: { metric: string; baseValue: number; scenarioValue: number; change: number; unit: string }[];
  confidence: number;
  risk: "low" | "medium" | "high";
  status: "draft" | "analyzed" | "actioned";
  createdBy: ExecutiveRole;
  createdAt: number;
}

export function getExecDecisions(category?: DecisionCategory): ExecDecision[] {
  try {
    const all: ExecDecision[] = JSON.parse(localStorage.getItem(`${EXEC_KEY}_decisions`) || "[]");
    return category ? all.filter((d) => d.category === category) : all;
  } catch { return []; }
}

export function getScenarioPlans(): ScenarioPlan[] {
  try { return JSON.parse(localStorage.getItem(`${EXEC_KEY}_scenarios`) || "[]"); } catch { return []; }
}

/* ================================================================== */
/*  MODULE 4: DECISION INTELLIGENCE & SCENARIO PLANNING              */
/* ================================================================== */

/* ================================================================== */
/*  MODULE 5: DIGITAL TWIN                                            */
/* ================================================================== */

export interface DigitalTwinSnapshot {
  id: string;
  domain: DigitalTwinDomain;
  name: string;
  state: Record<string, number>;
  metrics: { name: string; value: number; unit: string; trend: "up" | "down" | "stable" }[];
  timestamp: number;
  version: number;
}

export function getDigitalTwinSnapshots(domain?: DigitalTwinDomain): DigitalTwinSnapshot[] {
  try {
    const all: DigitalTwinSnapshot[] = JSON.parse(localStorage.getItem(`${EXEC_KEY}_twins`) || "[]");
    return domain ? all.filter((t) => t.domain === domain) : all;
  } catch { return []; }
}

export function getCurrentDigitalTwin(): DigitalTwinSnapshot[] {
  return [];
}

/* ================================================================== */
/*  MODULE 6: AI EXECUTIVE ASSISTANT                                  */
/* ================================================================== */

export interface ExecutiveInsight {
  id: string;
  type: "alert" | "opportunity" | "recommendation" | "brief";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  confidence: number;
  role: ExecutiveRole;
  actionItems: string[];
  relatedMetrics: { name: string; value: string }[];
  createdAt: number;
}

export function getExecutiveInsights(role?: ExecutiveRole): ExecutiveInsight[] {
  try {
    const all: ExecutiveInsight[] = JSON.parse(localStorage.getItem(`${EXEC_KEY}_insights`) || "[]");
    return role ? all.filter((i) => i.role === role) : all;
  } catch { return []; }
}

export function getExecutiveSearchResults(query: string): any[] {
  const q = query.toLowerCase();
  const results: any[] = [];

  // Search KPIs
  const kpis = getExecutiveKpis();
  kpis.filter((k) => k.name.toLowerCase().includes(q)).forEach((k) => results.push({ type: "KPI", title: k.name, subtitle: `${k.currentValue}${k.unit} — ${k.status}`, id: k.id }));

  // Search reports
  const reports = getExecutiveReports();
  reports.filter((r) => r.title.toLowerCase().includes(q)).forEach((r) => results.push({ type: "Report", title: r.title, subtitle: `${r.role.toUpperCase()} · ${r.period}`, id: r.id }));

  // Search forecasts
  const forecasts = getExecForecasts();
  forecasts.filter((f) => f.name.toLowerCase().includes(q)).forEach((f) => results.push({ type: "Forecast", title: f.name, subtitle: `${f.predictedValue} predicted · ${(f.confidence * 100).toFixed(0)}% confidence`, id: f.id }));

  // Search decisions
  const decisions = getExecDecisions();
  decisions.filter((d) => d.title.toLowerCase().includes(q)).forEach((d) => results.push({ type: "Decision", title: d.title, subtitle: `${d.category} · ${d.status}`, id: d.id }));

  // Search scenarios
  const scenarios = getScenarioPlans();
  scenarios.filter((s) => s.name.toLowerCase().includes(q)).forEach((s) => results.push({ type: "Scenario", title: s.name, subtitle: `${s.risk} risk · ${s.status}`, id: s.id }));

  return results.slice(0, 20);
}

/* ================================================================== */
/*  MODULE 6: AI EXECUTIVE ASSISTANT                                  */
/* ================================================================== */

/* ================================================================== */
/*  MODULE 7: EXECUTIVE WORKSPACE STATS                               */
/* ================================================================== */

export interface ExecutiveWorkspaceStats {
  totalKpis: number;
  kpisOnTrack: number;
  kpisAtRisk: number;
  overallHealth: number;
  totalReports: number;
  totalForecasts: number;
  avgForecastConfidence: number;
  totalDecisions: number;
  pendingDecisions: number;
  totalScenarios: number;
  totalInsights: number;
  criticalInsights: number;
  twinSnapshots: number;
}

export function getExecutiveWorkspaceStats(): ExecutiveWorkspaceStats {
  const kpis = getExecutiveKpis();
  const health = getOverallBusinessHealth();
  const reports = getExecutiveReports();
  const forecasts = getExecForecasts();
  const decisions = getExecDecisions();
  const scenarios = getScenarioPlans();
  const insights = getExecutiveInsights();
  const twins = getDigitalTwinSnapshots();

  return {
    totalKpis: kpis.length,
    kpisOnTrack: kpis.filter((k) => k.status === "on_track" || k.status === "achieved").length,
    kpisAtRisk: kpis.filter((k) => k.status === "at_risk" || k.status === "behind").length,
    overallHealth: health.score,
    totalReports: reports.length,
    totalForecasts: forecasts.length,
    avgForecastConfidence: forecasts.length ? Math.round(forecasts.reduce((s, f) => s + f.confidence, 0) / forecasts.length * 100) : 0,
    totalDecisions: decisions.length,
    pendingDecisions: decisions.filter((d) => d.status === "pending" || d.status === "in_review").length,
    totalScenarios: scenarios.length,
    totalInsights: insights.length,
    criticalInsights: insights.filter((i) => i.impact === "critical").length,
    twinSnapshots: twins.length,
  };
}
