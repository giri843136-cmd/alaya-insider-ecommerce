/**
 * ALAYA INSIDER — Enterprise Observability Dashboard (PR-8)
 * --------------------------------------------------------------------------
 * Centralized monitoring platform with tabs for:
 * Dashboard, Logs, Traces, Metrics, Alerts, Incidents, Services, Workers, Queues, Security, Backups
 */

import { useState, useEffect } from "react";
import { useObservability } from "../../context/ObservabilityContext";
import {
  Activity, AlertTriangle, BarChart3, Bell, BookOpen,
  CheckCircle2, Database, FileText,
  Monitor, Radio, RefreshCw, Search, Server,
  Shield, ShieldAlert, ShieldCheck, Users,
  XCircle,
} from "lucide-react";

type Tab = "dashboard" | "logs" | "traces" | "metrics" | "alerts" | "incidents" | "services" | "workers" | "queues" | "security" | "backups";

const API_BASE = "/api/v1/observability";

export default function AdminObservability() {
  const obs = useObservability();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [traces, setTraces] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  /* Export handler — exports current tab data as CSV or JSON */
  const exportData = (format: 'csv' | 'json') => {
    let data: any[] = [];
    let filename = `observability-${tab}-`;

    switch (tab) {
      case 'logs': data = logs; filename += 'logs'; break;
      case 'traces': data = traces; filename += 'traces'; break;
      case 'metrics': data = metrics; filename += 'metrics'; break;
      case 'alerts': data = alerts; filename += 'alerts'; break;
      case 'incidents': data = incidents; filename += 'incidents'; break;
      case 'services': data = services; filename += 'services'; break;
      case 'workers': data = workers; filename += 'workers'; break;
      case 'queues': data = queues; filename += 'queues'; break;
      case 'backups': data = backups; filename += 'backups'; break;
      default: data = dashboardStats ? [dashboardStats] : []; filename += 'dashboard'; break;
    }

    filename += `-${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, filename);
    } else {
      // Convert to CSV
      const flatten = (obj: any, prefix = ''): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj || {})) {
          const key = prefix ? `${prefix}.${k}` : k;
          if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
            Object.assign(result, flatten(v, key));
          } else {
            result[key] = Array.isArray(v) ? v.join('; ') : String(v ?? '');
          }
        }
        return result;
      };
      if (data.length === 0) return;
      const flattened = data.map(d => flatten(d));
      const headers = [...new Set(flattened.flatMap(Object.keys))];
      const csvRows = [
        headers.join(','),
        ...flattened.map(row => headers.map(h => {
          const val = (row[h] || '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      downloadBlob(blob, filename);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, logsRes, tracesRes, metricsRes, alertsRes, incRes, svcRes, wkrRes, qRes, bkpRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`).then(r => r.json()),
        fetch(`${API_BASE}/logs?limit=50`).then(r => r.json()),
        fetch(`${API_BASE}/traces?limit=20`).then(r => r.json()),
        fetch(`${API_BASE}/metrics/summary?days=1`).then(r => r.json()),
        fetch(`${API_BASE}/alerts?limit=20`).then(r => r.json()),
        fetch(`${API_BASE}/incidents?limit=20`).then(r => r.json()),
        fetch(`${API_BASE}/services/health`).then(r => r.json()),
        fetch(`${API_BASE}/workers/health`).then(r => r.json()),
        fetch(`${API_BASE}/queues/health`).then(r => r.json()),
        fetch(`${API_BASE}/backups?limit=10`).then(r => r.json()),
      ]);
      if (dashRes.success) setDashboardStats(dashRes.data);
      if (logsRes.success) setLogs(logsRes.data);
      if (tracesRes.success) setTraces(tracesRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
      if (incRes.success) setIncidents(incRes.data);
      if (svcRes.success) setServices(svcRes.data);
      if (wkrRes.success) setWorkers(wkrRes.data);
      if (qRes.success) setQueues(qRes.data);
      if (bkpRes.success) setBackups(bkpRes.data);
    } catch { /* API not available */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "logs", label: "Logs", icon: BookOpen },
    { id: "traces", label: "Traces", icon: Activity },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "incidents", label: "Incidents", icon: AlertTriangle },
    { id: "services", label: "Services", icon: Server },
    { id: "workers", label: "Workers", icon: Users },
    { id: "queues", label: "Queues", icon: Radio },
    { id: "security", label: "Security", icon: Shield },
    { id: "backups", label: "Backups", icon: Database },
  ];

  /* ================================================================== */
  /*  DASHBOARD TAB                                                      */
  /* ================================================================== */

  const renderDashboard = () => {
    const ds = dashboardStats || {};
    const svcs = ds.services || {};
    const w = ds.workers || {};
    const q = ds.queues || {};
    const ls = ds.logs || {};
    const as = ds.alerts || {};
    const is = ds.incidents || {};
    const bs = ds.backups || {};
    const ms = ds.metrics || {};

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Services" value={`${svcs.healthy || 0}/${svcs.total || 0}`} subtitle="healthy" icon={Server} color="green" />
          <StatCard title="Workers" value={`${w.healthy || 0}/${w.total || 0}`} subtitle="active" icon={Users} color="blue" />
          <StatCard title="Queue Depth" value={q.total_depth || 0} subtitle="pending items" icon={Radio} color="amber" />
          <StatCard title="Errors (24h)" value={ls.errors_24h || 0} subtitle="errors" icon={XCircle} color="red" />
          <StatCard title="Active Alerts" value={as.triggered || 0} subtitle="triggered" icon={Bell} color="red" />
          <StatCard title="Open Incidents" value={is.open || 0} subtitle="unresolved" icon={AlertTriangle} color="orange" />
          <StatCard title="Avg Latency" value={`${Math.round(ms.avg_latency_ms || 0)}ms`} subtitle={`P95: ~${Math.round(ms.latency_ms || 0)}ms`} icon={Activity} color="purple" />
          <StatCard title="Backups" value={bs.verified || 0} subtitle={`of ${bs.total || 0} verified`} icon={Database} color="green" />
        </div>

        {/* Service Health Row */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Service Health Map</h3>
          <div className="flex flex-wrap gap-2">
            {(obs.healthChecks || []).slice(0, 20).map((hc: any) => (
              <span key={hc.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                hc.status === "healthy" ? "bg-green-500/10 text-green-600" :
                hc.status === "degraded" ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  hc.status === "healthy" ? "bg-green-500" :
                  hc.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                }`} />
                {hc.name}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent Logs</h3>
            <button onClick={() => setTab("logs")} className="text-xs text-accent hover:underline">View all</button>
          </div>
          <div className="space-y-1.5">
            {logs.slice(0, 8).map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs hover:bg-surface2">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase ${
                  log.level === "error" || log.level === "critical" ? "bg-red-500/10 text-red-600" :
                  log.level === "warning" ? "bg-amber-500/10 text-amber-600" :
                  "bg-blue-500/10 text-blue-600"
                }`}>{log.level}</span>
                <span className="font-mono text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium text-ink">{log.service}</span>
                <span className="text-muted line-clamp-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  LOGS TAB                                                          */
  /* ================================================================== */

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="input w-full pl-9"
          />
        </div>
        <select className="input w-32">
          <option value="">All Levels</option>
          <option value="debug">DEBUG</option>
          <option value="info">INFO</option>
          <option value="warning">WARNING</option>
          <option value="error">ERROR</option>
          <option value="critical">CRITICAL</option>
        </select>
        <button onClick={fetchData} className="btn-ghost btn-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Correlation ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase ${
                    log.level === "critical" ? "bg-red-500/10 text-red-600" :
                    log.level === "error" ? "bg-red-500/5 text-red-500" :
                    log.level === "warning" ? "bg-amber-500/10 text-amber-600" :
                    "bg-blue-500/10 text-blue-600"
                  }`}>{log.level}</span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium text-ink">{log.service}</td>
                <td className="px-4 py-2.5 text-muted max-w-md truncate">{log.message}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{log.correlation_id || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  TRACES TAB                                                        */
  /* ================================================================== */

  const renderTraces = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
            {obs.traceStats.healthy} healthy
          </span>
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">
            {obs.traceStats.errors} errors
          </span>
        </div>
        <button onClick={fetchData} className="btn-ghost btn-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Trace</th>
              <th className="px-4 py-3 font-medium">Root Operation</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Spans</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {traces.map((t: any) => (
              <tr key={t.trace_id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{t.trace_id.slice(0, 16)}...</td>
                <td className="px-4 py-2.5 font-medium text-ink">{t.root_operation}</td>
                <td className="px-4 py-2.5 text-muted">{t.service}</td>
                <td className="px-4 py-2.5 text-muted">{t.span_count}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{t.total_duration_ms}ms</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.status === "healthy" ? "bg-green-500/10 text-green-600" :
                    t.status === "degraded" ? "bg-amber-500/10 text-amber-600" :
                    "bg-red-500/10 text-red-600"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      t.status === "healthy" ? "bg-green-500" :
                      t.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                    }`} />
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  METRICS TAB                                                       */
  /* ================================================================== */

  const renderMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {obs.operationalMetrics.map((m: any) => (
          <div key={m.name} className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">{m.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${
                m.status === "good" ? "bg-green-500/10 text-green-600" :
                m.status === "warning" ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              }`}>{m.status}</span>
            </div>
            <div className="text-2xl font-bold text-ink">{m.value}<span className="ml-1 text-sm font-normal text-muted">{m.unit}</span></div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span className={m.trend === "up" ? "text-green-600" : m.trend === "down" ? "text-red-600" : ""}>
                {m.changePercent > 0 ? "+" : ""}{m.changePercent}%
              </span>
              <span>{m.description}</span>
            </div>
            {/* Mini sparkline */}
            {m.sparkline && (
              <div className="mt-2 flex items-end gap-0.5 h-8">
                {m.sparkline.map((v: number, i: number) => (
                  <div key={i} className="flex-1 rounded-t" style={{
                    height: `${(v / Math.max(...m.sparkline)) * 100}%`,
                    backgroundColor: m.status === "good" ? "rgb(34 197 94 / 0.3)" :
                      m.status === "warning" ? "rgb(234 179 8 / 0.3)" : "rgb(239 68 68 / 0.3)",
                  }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* ================================================================== */
  /*  ALERTS TAB                                                        */
  /* ================================================================== */

  const renderAlerts = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">{alerts.filter(a => a.status === "triggered").length} triggered</span>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">{alerts.filter(a => a.status === "acknowledged").length} acknowledged</span>
        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">{alerts.filter(a => a.status === "resolved").length} resolved</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Rule</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Triggered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {alerts.map((a: any) => (
              <tr key={a.id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5 font-medium text-ink">{a.rule_name}</td>
                <td className="px-4 py-2.5"><span className="rounded bg-surface2 px-2 py-0.5 text-xs">{a.alert_type}</span></td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    a.severity === "critical" ? "bg-red-500/10 text-red-600" :
                    a.severity === "high" ? "bg-amber-500/10 text-amber-600" :
                    a.severity === "medium" ? "bg-blue-500/10 text-blue-600" :
                    "bg-surface2 text-muted"
                  }`}>{a.severity}</span>
                </td>
                <td className="px-4 py-2.5 text-muted max-w-xs truncate">{a.message}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === "triggered" ? "bg-red-500/10 text-red-600" :
                    a.status === "acknowledged" ? "bg-amber-500/10 text-amber-600" :
                    "bg-green-500/10 text-green-600"
                  }`}>{a.status}</span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{new Date(a.triggered_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  INCIDENTS TAB                                                     */
  /* ================================================================== */

  const renderIncidents = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["total", "open", "critical"].map(k => (
          <span key={k} className={`rounded-full px-3 py-1 text-xs font-medium ${
            k === "critical" ? "bg-red-500/10 text-red-600" :
            k === "open" ? "bg-amber-500/10 text-amber-600" :
            "bg-blue-500/10 text-blue-600"
          }`}>
            {k}: {(obs.incidentStats as any)?.[k] || incidents.filter(i => k === "open" ? i.status !== "resolved" : true).length}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Detected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {incidents.map((inc: any) => (
              <tr key={inc.id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5 font-medium text-ink">{inc.title}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    inc.severity === "critical" ? "bg-red-500/10 text-red-600" :
                    inc.severity === "high" ? "bg-amber-500/10 text-amber-600" :
                    inc.severity === "medium" ? "bg-blue-500/10 text-blue-600" :
                    "bg-surface2 text-muted"
                  }`}>{inc.severity}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    inc.status === "detected" ? "bg-red-500/10 text-red-600" :
                    inc.status === "investigating" ? "bg-amber-500/10 text-amber-600" :
                    inc.status === "identified" ? "bg-blue-500/10 text-blue-600" :
                    inc.status === "monitoring" ? "bg-purple-500/10 text-purple-600" :
                    "bg-green-500/10 text-green-600"
                  }`}>{inc.status}</span>
                </td>
                <td className="px-4 py-2.5 text-muted">{inc.source}</td>
                <td className="px-4 py-2.5 text-muted">{inc.owner || "-"}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{new Date(inc.detected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  SERVICES TAB                                                      */
  /* ================================================================== */

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {services.map((s: any) => (
          <div key={s.id} className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
            s.healthy ? "border-green-500/20 bg-green-500/5" :
            "border-red-500/20 bg-red-500/5"
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${s.healthy ? "bg-green-500" : "bg-red-500"}`} />
            <div>
              <div className="text-sm font-medium text-ink">{s.service_name}</div>
              <div className="text-xs text-muted">{s.service_type} · {s.latency_ms}ms</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ================================================================== */
  /*  WORKERS TAB                                                       */
  /* ================================================================== */

  const renderWorkers = () => (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Worker</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Jobs Processed</th>
            <th className="px-4 py-3 font-medium">Failed</th>
            <th className="px-4 py-3 font-medium">Avg Duration</th>
            <th className="px-4 py-3 font-medium">Heartbeat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {workers.map((w: any) => (
            <tr key={w.id} className="hover:bg-surface2/50">
              <td className="px-4 py-2.5 font-medium text-ink">{w.worker_name}</td>
              <td className="px-4 py-2.5 text-muted">{w.worker_type}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  w.healthy ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${w.healthy ? "bg-green-500" : "bg-red-500"}`} />
                  {w.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-muted">{w.total_jobs_processed}</td>
              <td className="px-4 py-2.5 text-muted">{w.total_jobs_failed}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted">{w.avg_job_duration_ms}ms</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted">{w.last_heartbeat_at ? new Date(w.last_heartbeat_at).toLocaleTimeString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ================================================================== */
  /*  QUEUES TAB                                                        */
  /* ================================================================== */

  const renderQueues = () => (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Queue</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Depth</th>
            <th className="px-4 py-3 font-medium">Pending</th>
            <th className="px-4 py-3 font-medium">Running</th>
            <th className="px-4 py-3 font-medium">Completed</th>
            <th className="px-4 py-3 font-medium">Failed</th>
            <th className="px-4 py-3 font-medium">Dead Letter</th>
            <th className="px-4 py-3 font-medium">Throughput</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {queues.map((q: any) => (
            <tr key={q.id} className="hover:bg-surface2/50">
              <td className="px-4 py-2.5 font-medium text-ink">{q.queue_name}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  q.healthy ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                }`}>{q.status}</span>
              </td>
              <td className="px-4 py-2.5 font-mono text-sm font-semibold text-ink">{q.depth}</td>
              <td className="px-4 py-2.5 text-muted">{q.pending_count}</td>
              <td className="px-4 py-2.5 text-muted">{q.running_count}</td>
              <td className="px-4 py-2.5 text-muted">{q.completed_count}</td>
              <td className="px-4 py-2.5 text-muted">{q.failed_count}</td>
              <td className="px-4 py-2.5 text-muted">{q.dead_letter_count}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted">{q.throughput_per_minute}/min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ================================================================== */
  /*  SECURITY TAB                                                      */
  /* ================================================================== */

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-1 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted">Brute Force Detection</span>
          </div>
          <p className="text-xs text-muted">Monitors failed login attempts per IP. Threshold: 10 in 15 min.</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted">SQL Injection Prevention</span>
          </div>
          <p className="text-xs text-muted">Scans inputs for SQL injection patterns (UNION, DROP, OR 1=1, etc.)</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-muted">XSS Protection</span>
          </div>
          <p className="text-xs text-muted">Detects cross-site scripting attempts (&lt;script&gt;, onerror, javascript:)</p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Security Events</h3>
        <div className="space-y-2">
          {(obs.activityEvents || []).filter((e: any) => e.category === "security").slice(0, 10).map((ev: any) => (
            <div key={ev.id} className="flex items-start gap-3 rounded-lg px-3 py-2 text-xs hover:bg-surface2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span className="font-medium text-ink">{ev.action}</span>
              <span className="text-muted">{ev.entityName}</span>
              <span className="text-muted flex-1">{ev.detail}</span>
              <span className="font-mono text-muted">{new Date(ev.ts).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  BACKUPS TAB                                                       */
  /* ================================================================== */

  const renderBackups = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-2xl font-bold text-ink">{backups.length}</div>
          <div className="text-xs text-muted">Total Backups</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-2xl font-bold text-green-600">{backups.filter((b: any) => b.verified).length}</div>
          <div className="text-xs text-muted">Verified</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-2xl font-bold text-ink">{backups.filter((b: any) => b.status === "running").length}</div>
          <div className="text-xs text-muted">In Progress</div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tables</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {backups.map((b: any) => (
              <tr key={b.id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5 font-medium text-ink">{b.name}</td>
                <td className="px-4 py-2.5"><span className="rounded bg-surface2 px-2 py-0.5 text-xs">{b.type}</span></td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "completed" ? "bg-green-500/10 text-green-600" :
                    b.status === "running" ? "bg-blue-500/10 text-blue-600" :
                    b.status === "failed" ? "bg-red-500/10 text-red-600" :
                    "bg-surface2 text-muted"
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-2.5 text-muted">{b.tables_backed_up}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{b.file_size ? `${(b.file_size / 1024 / 1024).toFixed(1)} MB` : "-"}</td>
                <td className="px-4 py-2.5">{b.verified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted" />}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{new Date(b.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  TAB RENDERER                                                      */
  /* ================================================================== */

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return renderDashboard();
      case "logs": return renderLogs();
      case "traces": return renderTraces();
      case "metrics": return renderMetrics();
      case "alerts": return renderAlerts();
      case "incidents": return renderIncidents();
      case "services": return renderServices();
      case "workers": return renderWorkers();
      case "queues": return renderQueues();
      case "security": return renderSecurity();
      case "backups": return renderBackups();
    }
  };

  /* ================================================================== */
  /*  LAYOUT                                                            */
  /* ================================================================== */

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Observability Platform</h1>
          <p className="text-sm text-muted">Enterprise monitoring, logging, alerting, and incident management</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <button
            onClick={() => exportData('csv')}
            className="btn-ghost btn-sm"
            title="Export as CSV"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => exportData('json')}
            className="btn-ghost btn-sm"
            title="Export as JSON"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            JSON
          </button>
          <button onClick={fetchData} className="btn-ghost btn-sm" disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-line pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-ink hover:bg-surface2"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}

/* ================================================================== */
/*  STAT CARD                                                          */
/* ================================================================== */

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle: string; icon: any; color: string;
}) {
  const colorMap: Record<string, string> = {
    green: "bg-green-500/10 text-green-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
    orange: "bg-orange-500/10 text-orange-600",
    purple: "bg-purple-500/10 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{title}</span>
        <div className={`rounded-lg p-1.5 ${colorMap[color] || "bg-surface2 text-muted"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{subtitle}</div>
    </div>
  );
}
