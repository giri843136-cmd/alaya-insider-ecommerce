/**
 * ALAYA INSIDER — Business Intelligence Platform React Context
 * Bridges the enterprise analytics, BI, data warehouse, reporting,
 * forecasting, and decision support engine to React UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDataCubes, getMaterializedViews, getWarehouseStats,
  getKpis, getOkrs, getScorecards, getKpiStats,
  getDashboards, getDashboardStats,
  getBiForecasts, getAnomalies, getForecastEngineStats,
  getReportDefinitions, getReportExecutions, generateReport, getReportStats,
  getScenarios,
  getChannelAnalytics, getCohortData, getFunnelData, getGeoAnalytics,
  getCustomerAnalytics, getProductAnalytics, getCampaignAnalytics,
  getBiPlatformMetrics,
  type DataCube,
  type MaterializedView,
  type KpiDefinition,
  type OKR,
  type Scorecard,
  type Dashboard,
  type BiForecast,
  type Anomaly,
  type ReportDefinition,
  type ReportExecution,
  type Scenario,
  type ChannelAnalytics as ChannelAnalyticsType,
  type CohortData,
  type FunnelData,
  type GeoAnalytics,
  type CustomerAnalytics as CustomerAnalyticsType,
  type ProductAnalytics as ProductAnalyticsType,
  type CampaignAnalytics,
  type BiPlatformMetric,
} from "../lib/businessIntelligence";

/* ================================================================== */
/*  CONTEXT                                                            */
/* ================================================================== */

interface BusinessIntelligenceContextValue {
  /* OLAP / Warehouse */
  dataCubes: DataCube[];
  materializedViews: MaterializedView[];
  warehouseStats: ReturnType<typeof getWarehouseStats>;

  /* KPIs & Scorecards */
  kpis: KpiDefinition[];
  okrs: OKR[];
  scorecards: Scorecard[];
  kpiStats: ReturnType<typeof getKpiStats>;

  /* Dashboards */
  dashboards: Dashboard[];
  dashboardStats: ReturnType<typeof getDashboardStats>;

  /* Forecasts */
  forecasts: BiForecast[];
  anomalies: Anomaly[];
  forecastStats: ReturnType<typeof getForecastEngineStats>;

  /* Reports */
  reports: ReportDefinition[];
  reportExecutions: ReportExecution[];
  reportStats: ReturnType<typeof getReportStats>;
  generateReportById: (reportId: string) => ReportExecution;

  /* Scenarios */
  scenarios: Scenario[];

  /* Multi-dimensional Analytics */
  channelAnalytics: ChannelAnalyticsType[];
  cohortData: CohortData[];
  funnelData: FunnelData[];
  geoAnalytics: GeoAnalytics[];
  customerAnalytics: CustomerAnalyticsType;
  productAnalytics: ProductAnalyticsType;
  campaignAnalytics: CampaignAnalytics[];

  /* Platform Metrics */
  metrics: BiPlatformMetric[];

  /* Actions */
  refresh: () => void;
}

const BusinessIntelligenceContext = createContext<BusinessIntelligenceContextValue | null>(null);

export function useBusinessIntelligence() {
  const ctx = useContext(BusinessIntelligenceContext);
  if (!ctx) throw new Error("useBusinessIntelligence must be used within <BusinessIntelligenceProvider>");
  return ctx;
}

/* ================================================================== */
/*  PROVIDER                                                           */
/* ================================================================== */

export function BusinessIntelligenceProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [dataCubes, setDataCubes] = useState(() => getDataCubes());
  const [materializedViews, setMaterializedViews] = useState(() => getMaterializedViews());
  const [warehouseStats, setWarehouseStats] = useState(() => getWarehouseStats());
  const [kpis, setKpis] = useState(() => getKpis());
  const [okrs, setOkrs] = useState(() => getOkrs());
  const [scorecards, setScorecards] = useState(() => getScorecards());
  const [kpiStats, setKpiStats] = useState(() => getKpiStats());
  const [dashboards, setDashboards] = useState(() => getDashboards());
  const [dashboardStats, setDashboardStats] = useState(() => getDashboardStats());
  const [forecasts, setForecasts] = useState(() => getBiForecasts());
  const [anomalies, setAnomalies] = useState(() => getAnomalies());
  const [forecastStats, setForecastStats] = useState(() => getForecastEngineStats());
  const [reports, setReports] = useState(() => getReportDefinitions());
  const [reportExecutions, setReportExecutions] = useState(() => getReportExecutions());
  const [reportStats, setReportStats] = useState(() => getReportStats());
  const [scenarios, setScenarios] = useState(() => getScenarios());
  const [channelAnalytics, setChannelAnalytics] = useState(() => getChannelAnalytics());
  const [cohortData, setCohortData] = useState(() => getCohortData());
  const [funnelData, setFunnelData] = useState(() => getFunnelData());
  const [geoAnalytics, setGeoAnalytics] = useState(() => getGeoAnalytics());
  const [customerAnalytics, setCustomerAnalytics] = useState(() => getCustomerAnalytics());
  const [productAnalytics, setProductAnalytics] = useState(() => getProductAnalytics());
  const [campaignAnalytics, setCampaignAnalytics] = useState(() => getCampaignAnalytics());
  const [metrics, setMetrics] = useState(() => getBiPlatformMetrics());

  const doRefresh = useCallback(() => {
    setDataCubes(getDataCubes());
    setMaterializedViews(getMaterializedViews());
    setWarehouseStats(getWarehouseStats());
    setKpis(getKpis());
    setOkrs(getOkrs());
    setScorecards(getScorecards());
    setKpiStats(getKpiStats());
    setDashboards(getDashboards());
    setDashboardStats(getDashboardStats());
    setForecasts(getBiForecasts());
    setAnomalies(getAnomalies());
    setForecastStats(getForecastEngineStats());
    setReports(getReportDefinitions());
    setReportExecutions(getReportExecutions());
    setReportStats(getReportStats());
    setScenarios(getScenarios());
    setChannelAnalytics(getChannelAnalytics());
    setCohortData(getCohortData());
    setFunnelData(getFunnelData());
    setGeoAnalytics(getGeoAnalytics());
    setCustomerAnalytics(getCustomerAnalytics());
    setProductAnalytics(getProductAnalytics());
    setCampaignAnalytics(getCampaignAnalytics());
    setMetrics(getBiPlatformMetrics());
    refresh();
  }, [refresh]);

  const generateReportById = useCallback((reportId: string) => {
    const result = generateReport(reportId);
    setTimeout(() => doRefresh(), 2000);
    return result;
  }, [doRefresh]);

  const value = useMemo<BusinessIntelligenceContextValue>(() => ({
    dataCubes, materializedViews, warehouseStats,
    kpis, okrs, scorecards, kpiStats,
    dashboards, dashboardStats,
    forecasts, anomalies, forecastStats,
    reports, reportExecutions, reportStats, generateReportById,
    scenarios,
    channelAnalytics, cohortData, funnelData, geoAnalytics,
    customerAnalytics, productAnalytics, campaignAnalytics,
    metrics,
    refresh: doRefresh,
  }), [
    dataCubes, materializedViews, warehouseStats,
    kpis, okrs, scorecards, kpiStats,
    dashboards, dashboardStats,
    forecasts, anomalies, forecastStats,
    reports, reportExecutions, reportStats, generateReportById,
    scenarios,
    channelAnalytics, cohortData, funnelData, geoAnalytics,
    customerAnalytics, productAnalytics, campaignAnalytics,
    metrics,
    doRefresh,
  ]);

  return <BusinessIntelligenceContext.Provider value={value}>{children}</BusinessIntelligenceContext.Provider>;
}
