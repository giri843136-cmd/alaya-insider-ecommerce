/**
 * ALAYA INSIDER — Enterprise Business Intelligence Platform
 * ------------------------------------------------------------------
 * Centralized analytics, BI, data warehouse, reporting & executive
 * decision engine. Extends the existing analytics.ts computation layer
 * with warehouse OLAP, KPI frameworks, dashboards, forecasts, reports,
 * scenario analysis, and multi-dimensional business analytics.
 */
import { uid } from "./utils";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const BI_STORAGE_KEY = "alaya_bi_store";
export const MAX_DASHBOARDS = 50;
export const MAX_REPORTS = 100;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type OlapOperation = "slice" | "dice" | "drill_down" | "roll_up" | "pivot";
export type WarehouseSchema = "star" | "snowflake" | "galaxy";
export type KpiCategory = "executive" | "finance" | "marketing" | "sales" | "operations" | "support" | "product" | "engineering" | "ai" | "affiliate" | "supplier" | "seo" | "crm";
export type DashboardScope = "executive" | "department" | "personal" | "system";
export type WidgetType =
  | "kpi" | "trend" | "bar" | "line" | "area" | "pie" | "donut" | "radar"
  | "heatmap" | "scatter" | "bubble" | "treemap" | "waterfall" | "gauge"
  | "table" | "list" | "map" | "funnel" | "cohort" | "timeline"
  | "forecast" | "alert" | "text" | "metric_group";
export type ReportFormat = "pdf" | "excel" | "csv" | "json" | "html";
export type ReportSchedule = "daily" | "weekly" | "monthly" | "quarterly" | "custom";
export type AnalyticsDimension =
  | "channel" | "device" | "geo" | "campaign" | "product" | "category"
  | "brand" | "customer" | "cohort" | "date" | "hour" | "source";
export type FunnelStage = "visit" | "view_product" | "add_cart" | "checkout" | "purchase";
export type ScenarioType = "what_if" | "benchmark" | "competitive" | "seasonal" | "market_shift";

/* ================================================================== */
/*  DATA WAREHOUSE — OLAP CUBES                                       */
/* ================================================================== */

export interface DataCube {
  id: string;
  name: string;
  description: string;
  schema: WarehouseSchema;
  factTable: string;
  dimensions: string[];
  measures: string[];
  rowCount: number;
  lastRefreshed: number;
  refreshInterval: string;
  status: "active" | "stale" | "building" | "failed";
  sizeMb: number;
  tags: string[];
}

export interface FactTable {
  name: string;
  grain: string;
  measures: { name: string; agg: "sum" | "avg" | "count" | "min" | "max" | "distinct"; format: string }[];
}

export interface DimensionTable {
  name: string;
  attributes: string[];
  hierarchy: string[];
}

export interface MaterializedView {
  id: string;
  name: string;
  query: string;
  sizeMb: number;
  refreshInterval: string;
  lastRefreshed: number;
  hitCount: number;
  enabled: boolean;
}

export function getDataCubes(): DataCube[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_cubes`) || "[]"); } catch { return []; }
}

export function getMaterializedViews(): MaterializedView[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_mviews`) || "[]"); } catch { return []; }
}

export function getWarehouseStats(): { totalCubes: number; totalMviews: number; totalSizeMb: number; activeCubes: number } {
  const cubes = getDataCubes();
  const mviews = getMaterializedViews();
  return {
    totalCubes: cubes.length,
    totalMviews: mviews.length,
    totalSizeMb: cubes.reduce((s, c) => s + c.sizeMb, 0) + mviews.reduce((s, v) => s + v.sizeMb, 0),
    activeCubes: cubes.filter((c) => c.status === "active").length,
  };
}

/* ================================================================== */
/*  ENTERPRISE KPIs & SCORECARDS                                      */

/* ================================================================== */
/*  ENTERPRISE KPIs & SCORECARDS                                      */
/* ================================================================== */

export interface KpiDefinition {
  id: string;
  name: string;
  category: KpiCategory;
  description: string;
  formula: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "on_track" | "at_risk" | "behind" | "achieved";
  sparkline: number[];
  owner: string;
  frequency: "realtime" | "daily" | "weekly" | "monthly";
  lastUpdated: number;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: { label: string; current: number; target: number; unit: string }[];
  owner: string;
  quarter: string;
  progress: number;
  status: "on_track" | "at_risk" | "behind" | "completed";
}

export interface Scorecard {
  id: string;
  name: string;
  category: KpiCategory;
  description: string;
  kpis: string[];
  score: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
  period: string;
}

export function getKpis(): KpiDefinition[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_kpis`) || "[]"); } catch { return []; }
}

export function getOkrs(): OKR[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_okrs`) || "[]"); } catch { return []; }
}

export function getScorecards(): Scorecard[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_scorecards`) || "[]"); } catch { return []; }
}

export function getKpiStats(): { totalKpis: number; onTrack: number; atRisk: number; achieved: number } {
  const kpis = getKpis();
  return {
    totalKpis: kpis.length,
    onTrack: kpis.filter((k) => k.status === "on_track").length,
    atRisk: kpis.filter((k) => k.status === "at_risk" || k.status === "behind").length,
    achieved: kpis.filter((k) => k.status === "achieved").length,
  };
}

/* ================================================================== */
/*  DASHBOARD PLATFORM                                                 */

/* ================================================================== */
/*  DASHBOARD PLATFORM                                                 */
/* ================================================================== */

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  scope: DashboardScope;
  category: KpiCategory;
  widgets: DashboardWidget[];
  layout: "grid" | "freeform" | "columns";
  refreshInterval: number;
  owner: string;
  starred: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  width: 1 | 2 | 3 | 4 | 6 | 12;
  height: 1 | 2 | 3;
  settings: Record<string, string | number | boolean>;
  x?: number;
  y?: number;
}

export function getDashboards(): Dashboard[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_dashboards`) || "[]"); } catch { return []; }
}

export function getDashboardStats(): { total: number; executive: number; starred: number } {
  const all = getDashboards();
  return {
    total: all.length,
    executive: all.filter((d) => d.scope === "executive").length,
    starred: all.filter((d) => d.starred).length,
  };
}

/* ================================================================== */
/*  FORECAST ENGINE                                                    */

/* ================================================================== */
/*  FORECAST ENGINE                                                    */
/* ================================================================== */

export interface BiForecast {
  id: string;
  name: string;
  category: string;
  period: string;
  methodology: "linear" | "moving_average" | "exponential" | "seasonal" | "ml_ensemble";
  dataPoints: { date: string; actual: number; predicted: number }[];
  currentValue: number;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  mape: number;
  trend: "up" | "down" | "stable";
  seasonalityDetected: boolean;
  anomalyCount: number;
  generatedAt: number;
  nextRun: number;
}

export interface Anomaly {
  id: string;
  metric: string;
  date: string;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: number;
  status: "open" | "investigating" | "resolved";
  detail: string;
}

export function getBiForecasts(): BiForecast[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_forecasts`) || "[]"); } catch { return []; }
}

export function getAnomalies(): Anomaly[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_anomalies`) || "[]"); } catch { return []; }
}

export function getForecastEngineStats(): { totalForecasts: number; avgConfidence: number; totalAnomalies: number; criticalAnomalies: number } {
  const forecasts = getBiForecasts();
  const anomalies = getAnomalies();
  return {
    totalForecasts: forecasts.length,
    avgConfidence: forecasts.length ? Math.round(forecasts.reduce((s, f) => s + f.confidence, 0) / forecasts.length * 100) : 0,
    totalAnomalies: anomalies.length,
    criticalAnomalies: anomalies.filter((a) => a.severity === "critical").length,
  };
}

/* ================================================================== */
/*  REPORTING PLATFORM                                                 */

/* ================================================================== */
/*  REPORTING PLATFORM                                                 */
/* ================================================================== */

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: KpiCategory;
  format: ReportFormat;
  schedule: ReportSchedule | "none";
  dataSources: string[];
  filters: Record<string, string>[];
  recipients: string[];
  enabled: boolean;
  lastGenerated?: number;
  nextRun?: number;
  createdAt: number;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  format: ReportFormat;
  status: "generating" | "completed" | "failed";
  rows: number;
  sizeKb: number;
  generatedAt: number;
  durationMs: number;
  error?: string;
}

export function getReportDefinitions(): ReportDefinition[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_reports`) || "[]"); } catch { return []; }
}

export function getReportExecutions(): ReportExecution[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_report_execs`) || "[]"); } catch { return []; }
}

export function generateReport(reportId: string): ReportExecution {
  const reports = getReportDefinitions();
  const rep = reports.find((r) => r.id === reportId);
  const start = Date.now();
  const exec: ReportExecution = {
    id: uid("rex"), reportId, reportName: rep?.name || reportId,
    format: rep?.format || "csv", status: "generating",
    rows: Math.round(50 + Math.random() * 500), sizeKb: Math.round(20 + Math.random() * 500),
    generatedAt: start, durationMs: 0,
  };
  // Simulate generation
  setTimeout(() => {
    const all = getReportExecutions();
    exec.status = Math.random() > 0.05 ? "completed" : "failed";
    exec.durationMs = Date.now() - start;
    if (exec.status === "failed") exec.error = "Data source timeout";
    all.unshift(exec);
    try { localStorage.setItem(`${BI_STORAGE_KEY}_report_execs`, JSON.stringify(all.slice(0, 500))); } catch { /* ignore */ }
  }, 1500);
  const all = getReportExecutions();
  all.unshift(exec);
  try { localStorage.setItem(`${BI_STORAGE_KEY}_report_execs`, JSON.stringify(all.slice(0, 500))); } catch { /* ignore */ }
  return exec;
}

export function getReportStats(): { totalReports: number; scheduled: number; totalExecutions: number; avgRows: number } {
  const reports = getReportDefinitions();
  const execs = getReportExecutions();
  return {
    totalReports: reports.length,
    scheduled: reports.filter((r) => r.schedule !== "none").length,
    totalExecutions: execs.length,
    avgRows: execs.length ? Math.round(execs.reduce((s, e) => s + e.rows, 0) / execs.length) : 0,
  };
}

/* ================================================================== */
/*  DECISION SUPPORT — SCENARIO ANALYSIS                              */

/* ================================================================== */
/*  DECISION SUPPORT — SCENARIO ANALYSIS                              */
/* ================================================================== */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  assumptions: { variable: string; baseValue: number; scenarioValue: number; unit: string; impact: string }[];
  projectedOutcome: { metric: string; baseValue: number; scenarioValue: number; change: number; unit: string }[];
  confidence: number;
  risk: "low" | "medium" | "high";
  createdBy: string;
  createdAt: number;
  status: "draft" | "analyzed" | "actioned";
}

export function getScenarios(): Scenario[] {
  try { return JSON.parse(localStorage.getItem(`${BI_STORAGE_KEY}_scenarios`) || "[]"); } catch { return []; }
}

/* ================================================================== */
/*  MULTI-DIMENSIONAL ANALYTICS                                       */

/* ================================================================== */
/*  MULTI-DIMENSIONAL ANALYTICS                                       */
/* ================================================================== */

export interface ChannelAnalytics {
  channel: string;
  visits: number;
  uniqueUsers: number;
  conversions: number;
  revenue: number;
  spend: number;
  roi: number;
  share: number;
}

export interface CohortData {
  cohort: string;
  period: string;
  users: number;
  retention: number[];
  revenue: number;
  clv: number;
}

export interface FunnelData {
  stage: FunnelStage;
  users: number;
  conversion: number;
  dropOff: number;
}

export interface GeoAnalytics {
  country: string;
  visits: number;
  orders: number;
  revenue: number;
  aov: number;
  share: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;
  retentionRate: number;
  avgLtv: number;
  segments: { name: string; count: number; revenue: number }[];
}

export interface ProductAnalytics {
  totalProducts: number;
  topSellers: { product: string; units: number; revenue: number }[];
  categories: { name: string; productCount: number; revenue: number }[];
  inventoryTurnover: number;
  avgMargin: number;
}

export interface CampaignAnalytics {
  campaign: string;
  type: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  spend: number;
  revenue: number;
  roi: number;
}

export function getChannelAnalytics(): ChannelAnalytics[] {
  return [];
}

export function getCohortData(): CohortData[] {
  return [];
}

export function getFunnelData(): FunnelData[] {
  return [];
}

export function getGeoAnalytics(): GeoAnalytics[] {
  return [];
}

export function getCustomerAnalytics(): CustomerAnalytics {
  return { totalCustomers: 0, activeCustomers: 0, newCustomers: 0, churnedCustomers: 0, churnRate: 0, retentionRate: 0, avgLtv: 0, segments: [] };
}

export function getProductAnalytics(): ProductAnalytics {
  return { totalProducts: 0, topSellers: [], categories: [], inventoryTurnover: 0, avgMargin: 0 };
}

export function getCampaignAnalytics(): CampaignAnalytics[] {
  return [];
}

/* ================================================================== */
/*  BI PLATFORM METRICS                                               */
/* ================================================================== */

export interface BiPlatformMetric {
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  sparkline: number[];
  description: string;
}

export function getBiPlatformMetrics(): BiPlatformMetric[] {
  return [];
}
