/**
 * ALAYA INSIDER — Enterprise Testing Platform Admin UI (PART 2.18)
 * 12 tabs: Dashboard | Test Suites | Performance | Security |
 * Accessibility | Visual | AI Testing | Test Data | Release Cert |
 * Code Quality | Schedules | Reports
 */
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Beaker, Gauge, Shield, Eye, ImageIcon,
  Bot, Database, Award, BarChart3, Clock, FileText,
  Plus, RefreshCw, CheckCircle2,
  XCircle, Play, AlertTriangle, Target, Globe,
  Activity,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getQaDashboard, getQaMetrics,
  getTestSuites, runTestSuite,
  getPerformanceTests, runPerformanceTest,
  getSecurityTests, updateSecurityFinding, runSecurityScan,
  getAccessibilityTests, runAccessibilityAudit,
  getVisualRegressionTests,
  getAiTests, runAiTestSuite,
  getTestDataTemplates, generateTestData,
  getReleaseCertifications, createRelease, startReleaseCertification, completeReleaseCheck, certifyRelease,
  getCodeQualityReports, runCodeQualityAnalysis,
  getTestSchedules, updateTestSchedule, createTestSchedule,
  getTestingReports, generateTestingReport,
  getTestingStats,
} from "../../lib/testingPlatform";

type Tab =
  | "dashboard" | "suites" | "performance" | "security"
  | "accessibility" | "visual" | "aitesting" | "testdata"
  | "releases" | "quality" | "schedules" | "reports";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "suites", label: "Test Suites", icon: Beaker },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "security", label: "Security", icon: Shield },
  { id: "accessibility", label: "Accessibility", icon: Eye },
  { id: "visual", label: "Visual", icon: ImageIcon },
  { id: "aitesting", label: "AI Testing", icon: Bot },
  { id: "testdata", label: "Test Data", icon: Database },
  { id: "releases", label: "Release Cert", icon: Award },
  { id: "quality", label: "Code Quality", icon: BarChart3 },
  { id: "schedules", label: "Schedules", icon: Clock },
  { id: "reports", label: "Reports", icon: FileText },
];

export default function AdminTestingPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Testing Platform" path="/admin/testing-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Testing Platform</h1>
            <p className="mt-1 text-sm text-muted">Quality assurance, testing, validation, release certification & continuous quality.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip flex items-center gap-1.5 capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "suites" && <SuitesTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "accessibility" && <AccessibilityTab />}
        {tab === "visual" && <VisualTab />}
        {tab === "aitesting" && <AiTestingTab />}
        {tab === "testdata" && <TestDataTab />}
        {tab === "releases" && <ReleasesTab />}
        {tab === "quality" && <QualityTab />}
        {tab === "schedules" && <SchedulesTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const dash = useMemo(() => getQaDashboard(), []);
  const metrics = useMemo(() => getQaMetrics(), []);
  const stats = useMemo(() => getTestingStats(), []);

  const STATS = [
    { label: "Pass Rate", value: `${dash.passRate}%`, sub: `${dash.passedTests} passed`, icon: CheckCircle2 },
    { label: "Test Coverage", value: `${dash.coveragePercent}%`, sub: "Line coverage", icon: Target },
    { label: "Open Bugs", value: String(dash.openBugs), sub: "Requires attention", icon: AlertTriangle },
    { label: "Active Incidents", value: String(dash.activeIncidents), sub: "In progress", icon: Activity },
    { label: "Releases", value: `${stats.certifiedReleases} certified`, sub: `${stats.failedReleases} failed`, icon: Award },
    { label: "AI Score", value: `${stats.aiScore}%`, sub: "AI test pass rate", icon: Bot },
    { label: "A11Y Score", value: `${stats.a11yScore}%`, sub: "Accessibility avg", icon: Eye },
    { label: "Suite Duration", value: `${Math.round(dash.avgDurationMs / 1000)}s`, sub: "Avg suite time", icon: Clock },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
          dash.overallHealth === "healthy" ? "bg-success/15 text-success" :
          dash.overallHealth === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
          <span className={cn("h-2 w-2 rounded-full",
            dash.overallHealth === "healthy" ? "bg-success" :
            dash.overallHealth === "degraded" ? "bg-warning" : "bg-danger")} />
          {dash.overallHealth.charAt(0).toUpperCase() + dash.overallHealth.slice(1)}
        </span>
        <span className="text-xs text-muted">Last run: {formatDate(dash.lastRunAt)}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Key Metrics</h3>
          <div className="mt-4 space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger")} />
                  <span className="text-sm text-ink">{m.name}</span>
                </div>
                <span className="text-sm font-semibold text-ink">{m.currentValue}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Testing Overview</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Test Suites</span><span className="text-sm font-semibold text-ink">{stats.totalSuites}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Test Cases</span><span className="text-sm font-semibold text-ink">{stats.totalCases} ({stats.passed} pass / {stats.failed} fail / {stats.skipped} skip)</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Performance Tests</span><span className="text-sm font-semibold text-ink">{stats.perfTests} completed</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Security Findings</span><span className="text-sm font-semibold text-ink text-danger">{stats.openFindings} open / {stats.secFindings} total</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Visual Failures</span><span className="text-sm font-semibold text-warning">{stats.visualFailures}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-ink">Schedules Active</span><span className="text-sm font-semibold text-ink">{stats.activeSchedules}/{stats.schedules}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TEST SUITES TAB                                                    */
/* ================================================================== */

function SuitesTab() {
  const [suites, setSuites] = useState(() => getTestSuites());
  const [runningId, setRunningId] = useState<string | null>(null);
  const refresh = () => setSuites(getTestSuites());

  const total = suites.reduce((s, su) => s + su.testCases.length, 0);
  const passed = suites.reduce((s, su) => s + su.testCases.filter((tc) => tc.status === "pass").length, 0);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{passed}/{total} passing · {suites.length} suites</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suites.map((suite) => {
          const sPassed = suite.testCases.filter((tc) => tc.status === "pass").length;
          const sFailed = suite.testCases.filter((tc) => tc.status === "fail").length;
          const sSkipped = suite.testCases.filter((tc) => tc.status === "skipped").length;
          return (
            <div key={suite.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beaker className={cn("h-5 w-5", sFailed > 0 ? "text-danger" : "text-accent")} />
                  <div>
                    <p className="font-medium text-ink text-sm">{suite.name}</p>
                    <span className="badge bg-accent-soft text-accent text-xs">{suite.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setRunningId(suite.id); runTestSuite(suite.id); setTimeout(() => { setRunningId(null); refresh(); }, 1000); }}
                  disabled={runningId === suite.id}
                  className="btn-ghost btn-sm"
                >
                  {runningId === suite.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">{suite.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-success">{sPassed} pass</span>
                {sFailed > 0 && <span className="text-danger">{sFailed} fail</span>}
                {sSkipped > 0 && <span className="text-muted">{sSkipped} skip</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {suite.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted text-[10px]">{t}</span>)}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
                <div className={cn("h-full rounded-full", sPassed / suite.testCases.length >= 0.9 ? "bg-success" : sPassed / suite.testCases.length >= 0.7 ? "bg-warning" : "bg-danger")}
                  style={{ width: `${(sPassed / Math.max(suite.testCases.length, 1)) * 100}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted">Updated {formatDate(suite.updatedAt)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PERFORMANCE TAB                                                    */
/* ================================================================== */

function PerformanceTab() {
  const [tests, setTests] = useState(() => getPerformanceTests());
  const [runningId, setRunningId] = useState<string | null>(null);
  const refresh = () => setTests(getPerformanceTests());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{tests.filter((t) => t.status === "completed").length} completed · {tests.length} total</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className={cn("h-5 w-5", t.passed ? "text-accent" : t.status === "failed" ? "text-danger" : "text-muted")} />
                <div>
                  <p className="font-medium text-ink text-sm">{t.name}</p>
                  <span className="badge bg-accent-soft text-accent text-xs">{t.type}</span>
                </div>
              </div>
              <button
                onClick={() => { setRunningId(t.id); runPerformanceTest(t.id); setTimeout(() => { setRunningId(null); refresh(); }, 3000); }}
                disabled={runningId === t.id || t.status === "running"}
                className="btn-ghost btn-sm"
              >
                {runningId === t.id || t.status === "running" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">{t.scenario}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-surface2/50 p-1.5"><span className="text-muted">P50</span><br /><span className="font-semibold text-ink">{t.p50Ms}ms</span></div>
              <div className="rounded-lg bg-surface2/50 p-1.5"><span className="text-muted">P95</span><br /><span className="font-semibold text-ink">{t.p95Ms}ms</span></div>
              <div className="rounded-lg bg-surface2/50 p-1.5"><span className="text-muted">P99</span><br /><span className="font-semibold text-ink">{t.p99Ms}ms</span></div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              <span className="badge bg-surface2">{t.concurrency} concurrent</span>
              <span className="badge bg-surface2">{t.requestsPerSecond} rps</span>
              <span className={cn("badge", t.errorRate > 2 ? "bg-danger/15 text-danger" : "bg-success/15 text-success")}>{t.errorRate}% errors</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={cn("badge", t.status === "completed" ? (t.passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger") : t.status === "running" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{t.status}</span>
              {t.lastRunAt && <span className="text-[10px] text-muted">{formatDate(t.lastRunAt)}</span>}
            </div>
            {t.thresholdViolations.length > 0 && (
              <div className="mt-2 space-y-1">
                {t.thresholdViolations.map((v, i) => <p key={i} className="text-xs text-danger">⚠ {v}</p>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SECURITY TAB                                                       */
/* ================================================================== */

function SecurityTab() {
  const [tests, setTests] = useState(() => getSecurityTests());
  const [scanTarget, setScanTarget] = useState("");
  const refresh = () => setTests(getSecurityTests());

  const allFindings = useMemo(() => tests.flatMap((t) => t.findings), [tests]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{allFindings.filter((f) => f.status === "open").length} open · {allFindings.length} findings · {tests.length} scans</p>
        <div className="flex gap-2">
          <input className="input-field text-xs w-48" placeholder="Scan target URL..." value={scanTarget} onChange={(e) => setScanTarget(e.target.value)} />
          <button onClick={() => { if (scanTarget) { runSecurityScan(scanTarget); setScanTarget(""); refresh(); } }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Scan</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <div key={test.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={cn("h-5 w-5", test.severity === "critical" ? "text-danger" : test.severity === "high" ? "text-warning" : "text-accent")} />
                <div>
                  <p className="font-medium text-ink text-sm">{test.name}</p>
                  <span className="badge bg-accent-soft text-accent text-xs">{test.category.replace(/_/g, " ")}</span>
                </div>
              </div>
              <span className={cn("badge", test.status === "fixed" ? "bg-success/15 text-success" : test.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{test.status}</span>
            </div>
            <p className="mt-2 text-xs text-muted">Target: {test.target}</p>
            <div className="mt-2 space-y-1">
              {test.findings.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-surface2/30 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-ink truncate">{f.title}</span>
                      <span className={cn("badge text-[10px]", f.severity === "critical" ? "bg-danger/15 text-danger" : f.severity === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{f.severity}</span>
                    </div>
                    <p className="text-[10px] text-muted">{f.cveId || ""} · {f.affectedComponent}</p>
                  </div>
                  <select className="input-field text-[10px] w-20 ml-2" value={f.status} onChange={(e) => { updateSecurityFinding(test.id, f.id, { status: e.target.value as any }); refresh(); }}>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="fixed">Fixed</option>
                    <option value="accepted">Accepted</option>
                  </select>
                </div>
              ))}
            </div>
            {test.lastRunAt && <p className="mt-2 text-[10px] text-muted">Last scan: {formatDate(test.lastRunAt)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ACCESSIBILITY TAB                                                  */
/* ================================================================== */

function AccessibilityTab() {
  const [tests, setTests] = useState(() => getAccessibilityTests());
  const refresh = () => setTests(getAccessibilityTests());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{tests.filter((t) => t.status === "pass").length} passing · {tests.filter((t) => t.status === "fail").length} failing</p>
        <button onClick={() => { runAccessibilityAudit("on-demand"); refresh(); }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Audit</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className={cn("h-5 w-5", t.status === "pass" ? "text-success" : "text-danger")} />
                <div>
                  <p className="font-medium text-ink text-sm">{t.name}</p>
                  <span className="badge bg-surface2 text-muted text-xs">{t.standard.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-semibold", t.score >= 80 ? "text-success" : t.score >= 60 ? "text-warning" : "text-danger")}>{t.score}%</span>
                <span className={cn("badge", t.status === "pass" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{t.status}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">Target: {t.target}</p>
            {t.violations.length > 0 && (
              <div className="mt-2 space-y-1">
                {t.violations.map((v) => (
                  <div key={v.id} className="flex items-start gap-2 rounded-lg bg-surface2/30 p-2">
                    <AlertTriangle className={cn("mt-0.5 h-3 w-3 shrink-0", v.impact === "critical" ? "text-danger" : v.impact === "serious" ? "text-warning" : "text-accent")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink">{v.description}</p>
                      <p className="text-[10px] text-muted">{v.wcagCriteria} · {v.element}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {t.violations.length === 0 && <p className="mt-2 text-xs text-success">No violations found</p>}
            {t.lastRunAt && <p className="mt-2 text-[10px] text-muted">Last audit: {formatDate(t.lastRunAt)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  VISUAL REGRESSION TAB                                              */
/* ================================================================== */

function VisualTab() {
  const tests = useMemo(() => getVisualRegressionTests(), []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{tests.filter((t) => t.status === "pass").length} passing · {tests.filter((t) => t.status === "fail").length} failing</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className={cn("h-5 w-5", t.status === "pass" ? "text-success" : "text-danger")} />
                <div>
                  <p className="font-medium text-ink text-sm">{t.name}</p>
                  <span className="badge bg-surface2 text-muted text-xs">{t.viewport}</span>
                </div>
              </div>
              <span className={cn("badge", t.status === "pass" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{t.status}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{t.target}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Diff</span>
                  <span className={cn("font-semibold", t.diffPercent < 1 ? "text-success" : t.diffPercent < 3 ? "text-warning" : "text-danger")}>{t.diffPercent}%</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-line overflow-hidden">
                  <div className={cn("h-full rounded-full", t.diffPercent < 1 ? "bg-success" : t.diffPercent < 3 ? "bg-warning" : "bg-danger")} style={{ width: `${Math.min(t.diffPercent * 20, 100)}%` }} />
                </div>
              </div>
            </div>
            {t.lastRunAt && <p className="mt-2 text-[10px] text-muted">Last run: {formatDate(t.lastRunAt)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AI TESTING TAB                                                     */
/* ================================================================== */

function AiTestingTab() {
  const [tests, setTests] = useState(() => getAiTests());
  const [runningId, setRunningId] = useState<string | null>(null);
  const refresh = () => setTests(getAiTests());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{tests.filter((t) => t.status === "passed").length} passing · {tests.filter((t) => t.status === "failed").length} failing</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className={cn("h-5 w-5", t.status === "passed" ? "text-success" : t.status === "failed" ? "text-danger" : "text-muted")} />
                <div>
                  <p className="font-medium text-ink text-sm">{t.name}</p>
                  <span className="badge bg-accent-soft text-accent text-xs">{t.target}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-semibold", t.score >= 80 ? "text-success" : t.score >= 50 ? "text-warning" : "text-danger")}>{t.score}%</span>
                <button
                  onClick={() => { setRunningId(t.id); runAiTestSuite(t.id); setTimeout(() => { setRunningId(null); refresh(); }, 1500); }}
                  disabled={runningId === t.id}
                  className="btn-ghost btn-sm"
                >
                  {runningId === t.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {t.testCases.slice(0, 3).map((tc) => (
                <div key={tc.id} className="flex items-center justify-between rounded-lg bg-surface2/30 px-2 py-1">
                  <span className="text-xs text-ink truncate flex-1">{tc.input.slice(0, 40)}...</span>
                  <span className={cn("text-xs", tc.passed ? "text-success" : "text-danger")}>{tc.passed ? "✓" : "✗"}</span>
                </div>
              ))}
            </div>
            {t.lastRunAt && <p className="mt-2 text-[10px] text-muted">Last run: {formatDate(t.lastRunAt)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TEST DATA TAB                                                      */
/* ================================================================== */

function TestDataTab() {
  const templates = useMemo(() => getTestDataTemplates(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [result, setResult] = useState<any>(null);

  const selected = selectedId ? templates.find((t) => t.id === selectedId) : null;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{templates.length} data templates</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <button key={t.id} onClick={() => { setSelectedId(t.id); setResult(null); }} className={cn("card p-4 text-left transition-all", selectedId === t.id && "ring-2 ring-accent")}>
            <Database className="h-5 w-5 text-accent" />
            <p className="mt-2 font-medium text-ink text-sm">{t.name}</p>
            <p className="text-xs text-muted">{t.description}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="badge bg-accent-soft text-accent">{t.type}</span>
              <span className="badge bg-surface2 text-muted">{t.category}</span>
              <span className="badge bg-surface2 text-muted">{t.recordCount} records</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card mt-6 p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Database className="h-4 w-4 text-accent" /> {selected.name}</h3>
          <div className="flex items-center gap-3">
            <label className="label-field">Record count</label>
            <input className="input-field w-24" type="number" min={1} max={10000} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 10)} />
            <button onClick={() => { const r = generateTestData(selected.id, count); if (r) setResult(r); }} className="btn-primary btn-sm">Generate</button>
          </div>
          {result && (
            <div className="mt-4">
              <p className="text-sm font-medium text-ink mb-2">Generated {result.records.length} records</p>
              <pre className="max-h-60 overflow-y-auto rounded-lg bg-surface2/50 p-3 text-xs text-muted whitespace-pre-wrap">{JSON.stringify(result.records.slice(0, 5), null, 2)}</pre>
              <p className="text-xs text-muted mt-2">Showing first 5 of {result.records.length} records</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  RELEASE CERTIFICATION TAB                                          */
/* ================================================================== */

function ReleasesTab() {
  const [releases, setReleases] = useState(() => getReleaseCertifications());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ version: "", name: "" });
  const refresh = () => setReleases(getReleaseCertifications());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{releases.filter((r) => r.status === "certified").length} certified · {releases.length} releases</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Release</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Release Certification</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Version (e.g. 2.6.0)*" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <input className="input-field" placeholder="Release name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <button onClick={() => { if (form.version && form.name) { createRelease(form.version, form.name); setShowForm(false); setForm({ version: "", name: "" }); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {releases.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <Award className={cn("h-5 w-5 mt-0.5", r.status === "certified" ? "text-success" : r.status === "failed" ? "text-danger" : r.status === "in_progress" ? "text-warning" : "text-muted")} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">v{r.version} — {r.name}</p>
                    <span className={cn("badge", r.status === "certified" ? "bg-success/15 text-success" : r.status === "passed" ? "bg-accent-soft text-accent" : r.status === "failed" ? "bg-danger/15 text-danger" : r.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{r.status.replace(/_/g, " ")}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.checks.map((c) => (
                      <div key={c.id} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                        c.status === "passed" ? "bg-success/15 text-success" : c.status === "failed" ? "bg-danger/15 text-danger" : c.status === "running" ? "bg-warning/15 text-warning" : c.status === "skipped" ? "bg-surface2 text-muted" : "bg-surface2/50 text-muted")}>
                        {c.status === "passed" ? <CheckCircle2 className="h-2.5 w-2.5" /> : c.status === "failed" ? <XCircle className="h-2.5 w-2.5" /> : c.status === "running" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : null}
                        {c.name}
                      </div>
                    ))}
                  </div>
                  {r.overallScore > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-line overflow-hidden">
                        <div className={cn("h-full rounded-full", r.overallScore >= 85 ? "bg-success" : r.overallScore >= 60 ? "bg-warning" : "bg-danger")} style={{ width: `${r.overallScore}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-ink">{r.overallScore}%</span>
                    </div>
                  )}
                  {r.notes && <p className="mt-1 text-xs text-muted">{r.notes}</p>}
                  <div className="mt-1 flex gap-2 text-[10px] text-muted">
                    {r.certifiedBy && <span>Certified by: {r.certifiedBy}</span>}
                    <span>Started: {formatDate(r.startedAt)}</span>
                    {r.completedAt && <span>Completed: {formatDate(r.completedAt)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {r.status === "draft" && <button onClick={() => { startReleaseCertification(r.id); refresh(); }} className="btn-ghost btn-sm text-xs">Start</button>}
                {r.status === "in_progress" && r.checks.find((c) => c.status === "running") && (
                  <button onClick={() => { const running = r.checks.find((c) => c.status === "running"); if (running) { const passed = Math.random() < 0.8; completeReleaseCheck(r.id, running.id, passed, passed ? Math.round(85 + Math.random() * 15) : Math.round(40 + Math.random() * 30), passed ? "All checks passed" : "Threshold not met"); refresh(); } }} className="btn-ghost btn-sm text-xs">Complete Step</button>
                )}
                {r.status === "passed" && <button onClick={() => { certifyRelease(r.id, "qa_lead", "All gates passed. Ready for production."); refresh(); }} className="btn-ghost btn-sm text-xs text-success">Certify</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CODE QUALITY TAB                                                   */
/* ================================================================== */

function QualityTab() {
  const [reports, setReports] = useState(() => getCodeQualityReports());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", lines: 1000 });
  const refresh = () => setReports(getCodeQualityReports());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{reports.length} quality reports</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Analysis</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Code Quality Analysis</h3>
          <div className="flex items-center gap-3">
            <input className="input-field flex-1" placeholder="Analysis name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="label-field shrink-0">Lines of code</label>
            <input className="input-field w-24" type="number" min={1} value={form.lines} onChange={(e) => setForm({ ...form, lines: parseInt(e.target.value) || 1000 })} />
            <button onClick={() => { if (form.name) { runCodeQualityAnalysis(form.name, form.lines); setShowForm(false); setForm({ name: "", lines: 1000 }); refresh(); } }} className="btn-primary btn-sm">Analyze</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-ink text-sm">{r.name}</p>
                  <span className="badge bg-surface2 text-muted text-xs">{r.linesOfCode.toLocaleString()} LOC</span>
                </div>
              </div>
              <span className={cn("text-lg font-semibold", r.grade === "A+" ? "text-success" : r.grade === "A" ? "text-accent" : r.grade === "B" ? "text-warning" : "text-danger")}>{r.grade}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-surface2/50 p-2">
                <span className="text-muted">Complexity</span>
                <p className="font-semibold text-ink">{r.complexityScore}</p>
              </div>
              <div className="rounded-lg bg-surface2/50 p-2">
                <span className="text-muted">Tech Debt</span>
                <p className="font-semibold text-ink">{r.technicalDebtDays} days</p>
              </div>
              <div className="rounded-lg bg-surface2/50 p-2">
                <span className="text-muted">Duplication</span>
                <p className="font-semibold text-ink">{r.duplicatePercent}%</p>
              </div>
              <div className="rounded-lg bg-surface2/50 p-2">
                <span className="text-muted">Coverage</span>
                <p className="font-semibold text-ink">{r.coveragePercent}%</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
              <span>{r.lintErrors} lint errors</span>
              <span>{r.codeSmells} smells</span>
              <span>{r.deadCodeFiles} dead files</span>
              <span>{r.unusedDependencies} unused deps</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2 text-[10px] text-muted">
                <span>Line: {r.coverageLine}%</span>
                <span>Branch: {r.coverageBranch}%</span>
                <span>Func: {r.coverageFunction}%</span>
              </div>
              <span className="text-[10px] text-muted">{formatDate(r.generatedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SCHEDULES TAB                                                      */
/* ================================================================== */

function SchedulesTab() {
  const [schedules, setSchedules] = useState(() => getTestSchedules());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", cron: "0 2 * * *", suites: [] as string[] });
  const refresh = () => setSchedules(getTestSchedules());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{schedules.filter((s) => s.enabled).length} active · {schedules.length} schedules</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Schedule</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Test Schedule</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Schedule name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field font-mono" placeholder="Cron expression" value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name) { createTestSchedule(form.name, form.cron, form.suites); setShowForm(false); setForm({ name: "", cron: "0 2 * * *", suites: [] }); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {schedules.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={cn("h-5 w-5", s.enabled ? "text-accent" : "text-muted")} />
                <div>
                  <p className="font-medium text-ink text-sm">{s.name}</p>
                  <code className="text-xs text-muted">{s.cronExpression}</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("badge", s.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{s.enabled ? "Active" : "Disabled"}</span>
                <span className={cn("badge", s.lastRunStatus === "passed" ? "bg-success/15 text-success" : s.lastRunStatus === "failed" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{s.lastRunStatus || "N/A"}</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={s.enabled} onChange={() => { updateTestSchedule(s.id, { enabled: !s.enabled }); refresh(); }} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-line after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              {s.suites.length > 0 && <span className="badge bg-surface2">{s.suites.length} suites</span>}
              {s.notifyOnFailure && <span className="badge bg-warning/15 text-warning">Notify on failure</span>}
              {s.notifyChannels.map((ch) => <span key={ch} className="badge bg-accent-soft text-accent">{ch}</span>)}
            </div>
            <div className="mt-2 flex gap-4 text-[10px] text-muted">
              {s.lastRunAt && <span>Last: {formatDate(s.lastRunAt)}</span>}
              {s.nextRunAt && <span>Next: {formatDate(s.nextRunAt)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  REPORTS TAB                                                        */
/* ================================================================== */

function ReportsTab() {
  const [reports, setReports] = useState(() => getTestingReports());
  const refresh = () => setReports(getTestingReports());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{reports.length} reports</p>
        <div className="flex gap-2">
          <select className="input-field text-xs" id="report-type-select">
            <option value="qa">QA Report</option>
            <option value="executive">Executive Report</option>
            <option value="developer">Developer Report</option>
            <option value="release">Release Report</option>
            <option value="coverage">Coverage Report</option>
            <option value="performance">Performance Report</option>
            <option value="security">Security Report</option>
            <option value="accessibility">Accessibility Report</option>
          </select>
          <button onClick={() => {
            const sel = (document.getElementById("report-type-select") as HTMLSelectElement)?.value || "qa";
            generateTestingReport(sel as any, "Last 30 days");
            refresh();
          }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Generate Report</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-ink text-sm">{r.name}</p>
                <span className="badge bg-accent-soft text-accent text-xs">{r.type}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{r.summary}</p>
            <div className="mt-2 text-[10px] text-muted">{r.period}</div>
            <div className="mt-2 space-y-1">
              {r.metrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{m.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-ink">{m.value}</span>
                    {m.trend === "up" && <span className="text-success">↑</span>}
                    {m.trend === "down" && <span className="text-danger">↓</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted">{formatDate(r.generatedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
