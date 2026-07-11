/**
 * ALAYA INSIDER — Observability React Context
 * Bridges the observability, monitoring, logging, tracing, audit & operational intelligence engine to React UI.
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
  getAllStructuredLogs, queryStructuredLogs, getLogStats,
  writeStructuredLog,
  getObsTraces, getObsSpans, getTraceStats,
  createObsTrace,
  runDeepHealthChecks, getHealthSummary,
  getIncidents, createIncident, updateIncident, getIncidentStats,
  getAuditEntries, getAuditStats,
  getDashboards, createDashboard, updateDashboard, deleteDashboard,
  getMonitoringRules, createMonitoringRule, updateMonitoringRule,
  deleteMonitoringRule, getAlertEvents,
  acknowledgeAlert, resolveAlert,
  getOperationalMetrics,
  getServiceTopology,
  getReports, generateReport,
  getErrorGroups, logError, updateErrorGroup,
  getActivityEvents, recordActivity,
  type StructuredLogEntry, type LogQuery,
  type ObsTrace, type ObsSpan, type TraceEntityType,
  type DeepHealthCheck,
  type Incident,
  type AuditEntry,
  type Dashboard,
  type MonitoringRule, type AlertEvent,
  type OperationalMetric,
  type ServiceNode,
  type OperationalReport,
  type ErrorGroup,
  type ActivityEvent,
} from "../lib/observability";

/* ================================================================== */
/*  CONTEXT DEFINITION                                                  */
/* ================================================================== */

interface ObservabilityContextValue {
  /* Logging */
  logs: StructuredLogEntry[];
  logStats: ReturnType<typeof getLogStats>;
  searchLogs: (query: LogQuery) => void;
  addLog: (entry: Omit<StructuredLogEntry, "id" | "ts">) => StructuredLogEntry;

  /* Tracing */
  traces: ObsTrace[];
  traceStats: ReturnType<typeof getTraceStats>;
  getSpans: (traceId: string) => ObsSpan[];
  startTrace: (name: string, rootOperation: string, entityType: TraceEntityType) => ObsTrace;

  /* Health */
  healthChecks: DeepHealthCheck[];
  healthSummary: ReturnType<typeof getHealthSummary>;
  runHealth: () => DeepHealthCheck[];

  /* Incidents */
  incidents: Incident[];
  incidentStats: ReturnType<typeof getIncidentStats>;
  createInc: (input: Omit<Incident, "id" | "detectedAt" | "status" | "timeline">) => Incident;
  updateInc: (id: string, patch: Partial<Incident> & { action?: string; by?: string; detail?: string }) => Incident | null;

  /* Audit */
  auditEntries: AuditEntry[];
  auditStats: ReturnType<typeof getAuditStats>;

  /* Dashboards */
  dashboards: Dashboard[];
  createDash: (input: Omit<Dashboard, "id" | "createdAt" | "updatedAt">) => Dashboard;
  updateDash: (id: string, patch: Partial<Dashboard>) => Dashboard | null;
  deleteDash: (id: string) => boolean;

  /* Monitoring Rules */
  monitoringRules: MonitoringRule[];
  createRule: (input: Omit<MonitoringRule, "id" | "createdAt" | "updatedAt">) => MonitoringRule;
  updateRule: (id: string, patch: Partial<MonitoringRule>) => MonitoringRule | null;
  deleteRule: (id: string) => boolean;

  /* Alert Events */
  alertEvents: AlertEvent[];
  acknowledgeAlertEvent: (id: string, userId: string) => boolean;
  resolveAlertEvent: (id: string) => boolean;

  /* Metrics */
  operationalMetrics: OperationalMetric[];

  /* Topology */
  topology: { nodes: ServiceNode[]; edges: { source: string; target: string; type: "sync" | "async" | "stream" }[] };

  /* Reports */
  reports: OperationalReport[];
  genReport: (category: OperationalReport["category"], period: string, createdBy: string) => OperationalReport;

  /* Error Groups */
  errorGroups: ErrorGroup[];
  logNewError: (error: Omit<ErrorGroup, "id" | "count" | "firstSeen" | "lastSeen" | "status" | "affectedUsers">) => ErrorGroup;
  updateErrorGroup: (id: string, patch: Partial<ErrorGroup>) => ErrorGroup | null;

  /* Activity */
  activityEvents: ActivityEvent[];
  recordActivityEvent: (input: Omit<ActivityEvent, "id" | "ts">) => ActivityEvent;

  /* Refresh */
  refresh: () => void;
}

const ObservabilityContext = createContext<ObservabilityContextValue | null>(null);

export function useObservability() {
  const ctx = useContext(ObservabilityContext);
  if (!ctx) throw new Error("useObservability must be used within <ObservabilityProvider>");
  return ctx;
}

/* ================================================================== */
/*  PROVIDER                                                           */
/* ================================================================== */

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [logs, setLogs] = useState<StructuredLogEntry[]>(() => getAllStructuredLogs());
  const [logStats, setLogStats] = useState(() => getLogStats());
  const [traces, setTraces] = useState(() => getObsTraces());
  const [traceStats, setTraceStats] = useState(() => getTraceStats());
  const [healthChecks, setHealthChecks] = useState<DeepHealthCheck[]>(() => runDeepHealthChecks());
  const [healthSummary, setHealthSummary] = useState(() => getHealthSummary(healthChecks));
  const [incidents, setIncidents] = useState(() => getIncidents());
  const [incidentStats, setIncidentStats] = useState(() => getIncidentStats());
  const [auditEntries, setAuditEntries] = useState(() => getAuditEntries());
  const [auditStats, setAuditStats] = useState(() => getAuditStats());
  const [dashboards, setDashboards] = useState(() => getDashboards());
  const [monitoringRules, setMonitoringRules] = useState(() => getMonitoringRules());
  const [alertEvents, setAlertEvents] = useState(() => getAlertEvents());
  const [operationalMetrics, setOperationalMetrics] = useState(() => getOperationalMetrics());
  const [topology, setTopology] = useState(() => getServiceTopology());
  const [reports, setReports] = useState(() => getReports());
  const [errorGroups, setErrorGroups] = useState(() => getErrorGroups());
  const [activityEvents, setActivityEvents] = useState(() => getActivityEvents());

  const doRefresh = useCallback(() => {
    setLogs(getAllStructuredLogs());
    setLogStats(getLogStats());
    setTraces(getObsTraces());
    setTraceStats(getTraceStats());
    const hc = runDeepHealthChecks();
    setHealthChecks(hc);
    setHealthSummary(getHealthSummary(hc));
    setIncidents(getIncidents());
    setIncidentStats(getIncidentStats());
    setAuditEntries(getAuditEntries());
    setAuditStats(getAuditStats());
    setDashboards(getDashboards());
    setMonitoringRules(getMonitoringRules());
    setAlertEvents(getAlertEvents());
    setOperationalMetrics(getOperationalMetrics());
    setTopology(getServiceTopology());
    setReports(getReports());
    setErrorGroups(getErrorGroups());
    setActivityEvents(getActivityEvents());
    refresh();
  }, [refresh]);

  /* ================================================================ */
  /*  LOGGING ACTIONS                                                   */
  /* ================================================================ */

  const searchLogs = useCallback((query: LogQuery) => {
    setLogs(queryStructuredLogs(query));
  }, []);

  const addLog = useCallback((entry: Omit<StructuredLogEntry, "id" | "ts">) => {
    const log = writeStructuredLog(entry);
    doRefresh();
    return log;
  }, [doRefresh]);

  /* ================================================================ */
  /*  TRACING ACTIONS                                                   */
  /* ================================================================ */

  const getSpans = useCallback((traceId: string) => getObsSpans(traceId), []);

  const startTrace = useCallback((name: string, rootOperation: string, entityType: TraceEntityType) => {
    const trace = createObsTrace(name, rootOperation, entityType);
    doRefresh();
    return trace;
  }, [doRefresh]);

  /* ================================================================ */
  /*  HEALTH ACTIONS                                                    */
  /* ================================================================ */

  const runHealth = useCallback(() => {
    const hc = runDeepHealthChecks();
    setHealthChecks(hc);
    setHealthSummary(getHealthSummary(hc));
    return hc;
  }, []);

  /* ================================================================ */
  /*  INCIDENT ACTIONS                                                  */
  /* ================================================================ */

  const createInc = useCallback((input: Omit<Incident, "id" | "detectedAt" | "status" | "timeline">) => {
    const inc = createIncident(input);
    doRefresh();
    return inc;
  }, [doRefresh]);

  const updateInc = useCallback((id: string, patch: Partial<Incident> & { action?: string; by?: string; detail?: string }) => {
    const inc = updateIncident(id, patch);
    doRefresh();
    return inc;
  }, [doRefresh]);

  /* ================================================================ */
  /*  DASHBOARD ACTIONS                                                 */
  /* ================================================================ */

  const createDash = useCallback((input: Omit<Dashboard, "id" | "createdAt" | "updatedAt">) => {
    const dash = createDashboard(input);
    doRefresh();
    return dash;
  }, [doRefresh]);

  const updateDash = useCallback((id: string, patch: Partial<Dashboard>) => {
    const dash = updateDashboard(id, patch);
    doRefresh();
    return dash;
  }, [doRefresh]);

  const deleteDash = useCallback((id: string) => {
    const result = deleteDashboard(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  MONITORING RULES ACTIONS                                          */
  /* ================================================================ */

  const createRule = useCallback((input: Omit<MonitoringRule, "id" | "createdAt" | "updatedAt">) => {
    const rule = createMonitoringRule(input);
    doRefresh();
    return rule;
  }, [doRefresh]);

  const updateRule = useCallback((id: string, patch: Partial<MonitoringRule>) => {
    const rule = updateMonitoringRule(id, patch);
    doRefresh();
    return rule;
  }, [doRefresh]);

  const deleteRule = useCallback((id: string) => {
    const result = deleteMonitoringRule(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  ALERT ACTIONS                                                     */
  /* ================================================================ */

  const acknowledgeAlertEvent = useCallback((id: string, userId: string) => {
    const result = acknowledgeAlert(id, userId);
    doRefresh();
    return result;
  }, [doRefresh]);

  const resolveAlertEvent = useCallback((id: string) => {
    const result = resolveAlert(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  ERROR GROUP ACTIONS                                               */
  /* ================================================================ */

  const logNewError = useCallback((error: Omit<ErrorGroup, "id" | "count" | "firstSeen" | "lastSeen" | "status" | "affectedUsers">) => {
    const eg = logError(error);
    doRefresh();
    return eg;
  }, [doRefresh]);

  const updateErrorGroupById = useCallback((id: string, patch: Partial<ErrorGroup>) => {
    const eg = updateErrorGroup(id, patch);
    doRefresh();
    return eg;
  }, [doRefresh]);

  /* ================================================================ */
  /*  ACTIVITY ACTIONS                                                  */
  /* ================================================================ */

  const recordActivityEvent = useCallback((input: Omit<ActivityEvent, "id" | "ts">) => {
    const event = recordActivity(input);
    doRefresh();
    return event;
  }, [doRefresh]);

  /* ================================================================ */
  /*  REPORT ACTIONS                                                    */
  /* ================================================================ */

  const genReport = useCallback((category: OperationalReport["category"], period: string, createdBy: string) => {
    const report = generateReport(category, period, createdBy);
    doRefresh();
    return report;
  }, [doRefresh]);

  /* ================================================================ */
  /*  CONTEXT VALUE                                                    */
  /* ================================================================ */

  const value = useMemo<ObservabilityContextValue>(() => ({
    logs, logStats, searchLogs, addLog,
    traces, traceStats, getSpans, startTrace,
    healthChecks, healthSummary, runHealth,
    incidents, incidentStats, createInc, updateInc,
    auditEntries, auditStats,
    dashboards, createDash, updateDash, deleteDash,
    monitoringRules, createRule, updateRule, deleteRule,
    alertEvents, acknowledgeAlertEvent, resolveAlertEvent,
    operationalMetrics,
    topology,
    reports, genReport,
    errorGroups, logNewError, updateErrorGroup: updateErrorGroupById,
    activityEvents, recordActivityEvent,
    refresh: doRefresh,
  }), [
    logs, logStats, searchLogs, addLog,
    traces, traceStats, getSpans, startTrace,
    healthChecks, healthSummary, runHealth,
    incidents, incidentStats, createInc, updateInc,
    auditEntries, auditStats,
    dashboards, createDash, updateDash, deleteDash,
    monitoringRules, createRule, updateRule, deleteRule,
    alertEvents, acknowledgeAlertEvent, resolveAlertEvent,
    operationalMetrics,
    topology,
    reports, genReport,
    errorGroups, logNewError, updateErrorGroupById,
    activityEvents, recordActivityEvent,
    doRefresh,
  ]);

  return <ObservabilityContext.Provider value={value}>{children}</ObservabilityContext.Provider>;
}
