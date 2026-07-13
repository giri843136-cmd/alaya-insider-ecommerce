/**
 * ALAYA INSIDER — Enterprise Governance Platform Admin UI (PART 2.16)
 * 12 tabs: Dashboard | Settings | Policies | Organizations | Roles |
 * Audit | Changes | Risks | Incidents | Security Operations | Compliance | AI Governance
 */
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Settings, Shield, Building2, UserCog, FileSearch,
  GitPullRequest, AlertTriangle, AlertOctagon, ShieldAlert,
  CheckSquare, Bot,  Plus, Search, RefreshCw, CheckCircle2,
  XCircle, Clock, Eye, Target, Zap,
  Lock, Key, Swords, Activity, Globe,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getGovernanceDashboard, getGovernanceMetrics,
  getPlatformSettings, updatePlatformSetting,
  getFeatureFlags, updateFeatureFlag,
  getPolicies, createPolicy, updatePolicy, approvePolicy, publishPolicy,
  getDepartments, getProjects,
  getEnterpriseRoles,
  getBreakGlassAccounts, getAdminSessions, terminateAdminSession,
  getGovernanceAuditEntries, getGovernanceAuditStats,
  getChangeRequests, updateChangeRequest, approveChangeRequest,
  getRisks, createRisk,
  getIncidents, createIncident, assignIncident, closeIncident,
  getSecurityThreats, getVulnerabilities, updateVulnerability,
  getCertificates, getSecretRotations, rotateSecret,
  getSecurityOperationsStats,
  getComplianceFrameworks, getComplianceOverallStatus, updateComplianceControl,
  getAiGovernancePolicies, updateAiGovernancePolicy,
  getAiActionApprovals, approveAiAction, rejectAiAction,
  getAiGovernanceStats,

} from "../../lib/governancePlatform";

type Tab =
  | "dashboard" | "settings" | "policies" | "organizations" | "roles"
  | "audit" | "changes" | "risks" | "incidents" | "securityops"
  | "compliance" | "aigovernance";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "policies", label: "Policies", icon: Shield },
  { id: "organizations", label: "Organization", icon: Building2 },
  { id: "roles", label: "Roles & Access", icon: UserCog },
  { id: "audit", label: "Audit", icon: FileSearch },
  { id: "changes", label: "Change Mgmt", icon: GitPullRequest },
  { id: "risks", label: "Risk", icon: AlertTriangle },
  { id: "incidents", label: "Incidents", icon: AlertOctagon },
  { id: "securityops", label: "Security Ops", icon: ShieldAlert },
  { id: "compliance", label: "Compliance", icon: CheckSquare },
  { id: "aigovernance", label: "AI Governance", icon: Bot },
];

export default function AdminGovernancePlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Governance Platform" path="/admin/governance-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Governance Platform</h1>
            <p className="mt-1 text-sm text-muted">Security operations, compliance, risk management, audit & enterprise administration.</p>
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
        {tab === "settings" && <SettingsTab />}
        {tab === "policies" && <PoliciesTab />}
        {tab === "organizations" && <OrganizationsTab />}
        {tab === "roles" && <RolesTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "changes" && <ChangesTab />}
        {tab === "risks" && <RisksTab />}
        {tab === "incidents" && <IncidentsTab />}
        {tab === "securityops" && <SecurityOpsTab />}
        {tab === "compliance" && <ComplianceTab />}
        {tab === "aigovernance" && <AiGovernanceTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const dash = useMemo(() => getGovernanceDashboard(), []);
  const metrics = useMemo(() => getGovernanceMetrics(), []);

  const STATS = [
    { label: "Compliance", value: `${dash.complianceScore}%`, sub: `${dash.publishedPolicies} policies`, icon: CheckSquare },
    { label: "Open Vulns", value: String(dash.openVulnerabilities), sub: `${dash.totalVulnerabilities} total`, icon: ShieldAlert },
    { label: "Active Incidents", value: String(dash.activeIncidents), sub: `${dash.totalIncidents} total`, icon: AlertOctagon },
    { label: "Critical Risks", value: String(dash.criticalRisks), sub: `${dash.totalRisks} total`, icon: AlertTriangle },
    { label: "Pending Changes", value: String(dash.pendingChangeRequests), sub: `${dash.totalChangeRequests} total`, icon: GitPullRequest },
    { label: "Audit Events", value: String(dash.auditEventsToday), sub: "Last 24h", icon: FileSearch },
    { label: "Open Findings", value: String(dash.openFindings), sub: "Requires attention", icon: Target },
    { label: "Active Sessions", value: String(dash.activeSessions), sub: "Admin", icon: UserCog },
  ];

  return (
    <div className="mt-8">
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
          <h3 className="font-semibold text-ink flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Compliance Frameworks</h3>
          <div className="mt-4 space-y-3">
            {getComplianceFrameworks().map((fw) => {
              const compliant = fw.controls.filter((c) => c.status === "compliant").length;
              return (
                <div key={fw.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {fw.status === "certified" ? <CheckCircle2 className="h-4 w-4 text-success" /> : fw.status === "audit_ready" ? <CheckCircle2 className="h-4 w-4 text-accent" /> : fw.status === "in_progress" ? <Clock className="h-4 w-4 text-warning" /> : <XCircle className="h-4 w-4 text-muted" />}
                    <span className="text-sm text-ink">{fw.name}</span>
                  </div>
                  <span className={cn("text-xs font-medium", compliant === fw.controls.length ? "text-success" : "text-warning")}>{compliant}/{fw.controls.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SETTINGS TAB                                                       */
/* ================================================================== */

function SettingsTab() {
  const settings = useMemo(() => getPlatformSettings(), []);
  const [flags, setFlags] = useState(() => getFeatureFlags());
  const refreshFlags = () => setFlags(getFeatureFlags());

  return (
    <div className="mt-8">
      <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Settings className="h-4 w-4 text-accent" /> Platform Settings</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((s) => (
          <div key={s.key} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink text-sm">{s.name}</p>
                <p className="text-xs text-muted">{s.description}</p>
                <span className="badge bg-surface2 text-muted text-xs mt-1">{s.category}</span>
              </div>
            </div>
            <div className="mt-2">
              {s.type === "boolean" ? (
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={s.value} onChange={() => updatePlatformSetting(s.key, !s.value, "admin")} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-line after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
                </label>
              ) : s.type === "select" && s.options ? (
                <select className="input-field text-xs" value={s.value} onChange={(e) => updatePlatformSetting(s.key, e.target.value, "admin")}>
                  {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : s.type === "number" ? (
                <input className="input-field text-xs w-24" type="number" value={s.value} onChange={(e) => updatePlatformSetting(s.key, parseFloat(e.target.value) || 0, "admin")} />
              ) : (
                <input className="input-field text-xs" value={s.value} onChange={(e) => updatePlatformSetting(s.key, e.target.value, "admin")} />
              )}
            </div>
            <div className="mt-1 flex gap-2 text-[10px] text-muted">
              {s.envOverride && <span className="badge bg-warning/15 text-warning">Env override</span>}
              {s.requiresRestart && <span className="badge bg-accent-soft text-accent">Restart required</span>}
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-semibold text-ink mt-8 mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Feature Flags</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {flags.map((f) => (
          <div key={f.key} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink text-sm">{f.name}</p>
                <p className="text-xs text-muted">{f.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={f.enabled} onChange={() => { updateFeatureFlag(f.key, { enabled: !f.enabled }); refreshFlags(); }} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-line after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
              </label>
            </div>
            <p className="mt-1 text-xs text-muted">Rollout: {f.rolloutPercent}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  POLICIES TAB                                                       */
/* ================================================================== */

function PoliciesTab() {
  const [policies, setPolicies] = useState(() => getPolicies());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "security" as const, severity: "medium" as const, scope: "global" as const, rules: [] as any[], tags: [] as string[], createdBy: "admin" });
  const refresh = () => setPolicies(getPolicies());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{policies.filter((p) => p.status === "published").length} published · {policies.length} total</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Policy</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Policy</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              <option value="security">Security</option><option value="compliance">Compliance</option><option value="governance">Governance</option>
              <option value="data">Data</option><option value="ai">AI</option><option value="access">Access</option>
            </select>
            <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name) { createPolicy(form as any); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {policies.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <Shield className={cn("h-5 w-5 mt-0.5", p.severity === "critical" ? "text-danger" : p.severity === "high" ? "text-warning" : "text-accent")} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{p.name}</p>
                    <span className={cn("badge", p.status === "published" ? "bg-success/15 text-success" : p.status === "approved" ? "bg-accent-soft text-accent" : p.status === "draft" ? "bg-surface2 text-muted" : "bg-warning/15 text-warning")}>{p.status}</span>
                    <span className="badge bg-surface2 text-muted">v{p.version}</span>
                    <span className={cn("badge", p.severity === "critical" ? "bg-danger/15 text-danger" : p.severity === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{p.severity}</span>
                  </div>
                  <p className="text-xs text-muted">{p.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="badge bg-accent-soft text-accent text-xs">{p.category}</span>
                    <span className="badge bg-surface2 text-muted text-xs">{p.scope}</span>
                    <span className="badge bg-surface2 text-muted text-xs">{p.rules.length} rules</span>
                    {p.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted text-xs">{t}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {p.status === "draft" && <button onClick={() => { updatePolicy(p.id, { status: "review" }); refresh(); }} className="btn-ghost btn-sm text-xs">Submit</button>}
                {p.status === "review" && <button onClick={() => { approvePolicy(p.id, "admin"); refresh(); }} className="btn-ghost btn-sm text-xs text-success">Approve</button>}
                {p.status === "approved" && <button onClick={() => { publishPolicy(p.id, "admin"); refresh(); }} className="btn-ghost btn-sm text-xs text-accent">Publish</button>}
                {p.status === "published" && <button onClick={() => { updatePolicy(p.id, { status: "draft" }); refresh(); }} className="btn-ghost btn-sm text-xs text-warning">Unpublish</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ORGANIZATIONS TAB                                                  */
/* ================================================================== */

function OrganizationsTab() {
  const depts = useMemo(() => getDepartments(), []);
  const projects = useMemo(() => getProjects(), []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{depts.length} departments · {projects.length} projects</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depts.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-ink text-sm">{d.name}</p>
                <span className="badge bg-surface2 text-muted">{d.code}</span>
              </div>
              <span className={cn("ml-auto h-2 w-2 rounded-full", d.active ? "bg-success" : "bg-line")} />
            </div>
            <p className="mt-2 text-xs text-muted">{d.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              <span className="badge bg-accent-soft text-accent">Head: {d.headName}</span>
              <span className="badge bg-surface2">{d.businessUnits.length} business units</span>
              <span className="badge bg-surface2">{d.businessUnits.reduce((s, bu) => s + bu.teams.length, 0)} teams</span>
            </div>
            {d.businessUnits.length > 0 && (
              <div className="mt-3 space-y-2">
                {d.businessUnits.map((bu) => (
                  <div key={bu.id} className="rounded-lg bg-surface2/50 p-2">
                    <p className="text-xs font-medium text-ink">{bu.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {bu.teams.map((t) => (
                        <span key={t.id} className="badge bg-accent-soft/50 text-accent text-[10px]">{t.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ROLES & ACCESS TAB                                                 */
/* ================================================================== */

function RolesTab() {
  const [roles] = useState(() => getEnterpriseRoles());
  const [sessions] = useState(() => getAdminSessions());
  const [bgAccounts] = useState(() => getBreakGlassAccounts());
  const [sessionList, setSessionList] = useState(sessions);
  const refreshSessions = () => setSessionList(getAdminSessions());

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roles */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><UserCog className="h-4 w-4 text-accent" /> Enterprise Roles ({roles.length})</h3>
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-accent" />
                    <div>
                      <p className="font-medium text-ink text-sm">{r.name}</p>
                      <p className="text-xs text-muted">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className={cn("badge", r.type === "system" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{r.type}</span>
                    <span className="badge bg-surface2 text-muted">{r.scope}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted">
                  <span className="badge bg-surface2">{r.privileges.length} privileges</span>
                  {r.requiresMfa && <span className="badge bg-warning/15 text-warning">MFA</span>}
                  <span className="badge bg-surface2">{r.sessionTimeout}m timeout</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions & Break Glass */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Active Admin Sessions ({sessionList.filter((s) => s.status === "active").length})</h3>
            <div className="space-y-2">
              {sessionList.filter((s) => s.status === "active").slice(0, 5).map((s) => (
                <div key={s.id} className="card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink text-sm">{s.userName}</p>
                      <p className="text-xs text-muted">{s.role} · {s.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.isImpersonating && <span className="badge bg-warning/15 text-warning">Impersonating</span>}
                      <button onClick={() => { terminateAdminSession(s.id); refreshSessions(); }} className="btn-ghost btn-sm text-xs text-danger"><XCircle className="h-3 w-3" /> Terminate</button>
                    </div>
                  </div>
                </div>
              ))}
              {sessionList.filter((s) => s.status === "active").length === 0 && <p className="text-sm text-muted">No active sessions</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Swords className="h-4 w-4 text-accent" /> Break Glass Accounts</h3>
            <div className="space-y-2">
              {bgAccounts.map((a) => (
                <div key={a.id} className="card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink text-sm">{a.name}</p>
                      <p className="text-xs text-muted">{a.reason}</p>
                    </div>
                    <span className={cn("badge", a.status === "active" ? "bg-success/15 text-success" : a.status === "used" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AUDIT TAB                                                          */
/* ================================================================== */

function AuditTab() {
  const [entries, setEntries] = useState(() => getGovernanceAuditEntries(100));
  const stats = useMemo(() => getGovernanceAuditStats(), [entries]);
  const [query, setQuery] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const refresh = () => setEntries(getGovernanceAuditEntries(100));
  const filtered = query.trim() || filterAction
    ? entries.filter((e) =>
        (!query.trim() || e.detail.toLowerCase().includes(query.toLowerCase()) || e.actor.toLowerCase().includes(query.toLowerCase())) &&
        (!filterAction || e.action === filterAction)
      )
    : entries;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{stats.total}</p><p className="text-xs text-muted">Total</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-danger">{stats.criticalCount}</p><p className="text-xs text-muted">Critical</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{stats.warningCount}</p><p className="text-xs text-muted">Warning</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{stats.infoCount}</p><p className="text-xs text-muted">Info</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search audit…" className="input-field pl-9" />
        </div>
        <select className="input-field w-32 text-xs" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          <option value="">All actions</option>
          {Object.keys(stats.byAction).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={refresh} className="btn-ghost btn-sm"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="card overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto divide-y divide-line">
          {filtered.slice(0, 50).map((e) => (
            <div key={e.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface2/40">
              {e.severity === "critical" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> : e.severity === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink text-sm">{e.actor}</span>
                  <span className="badge bg-surface2 text-muted text-xs">{e.action}</span>
                  <span className="badge bg-accent-soft text-accent text-xs">{e.entityType}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{e.detail}</p>
                <p className="text-[10px] text-muted mt-0.5">{formatDate(e.ts)}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted">No audit entries found</p>}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CHANGE MANAGEMENT TAB                                              */
/* ================================================================== */

function ChangesTab() {
  const [crs, setCrs] = useState(() => getChangeRequests());
  const refresh = () => setCrs(getChangeRequests());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{crs.filter((c) => c.status === "completed").length} completed · {crs.length} total</p>
      <div className="space-y-3">
        {crs.map((cr) => (
          <div key={cr.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <GitPullRequest className={cn("h-5 w-5 mt-0.5", cr.priority === "critical" ? "text-danger" : cr.priority === "high" ? "text-warning" : "text-accent")} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{cr.title}</p>
                    <span className={cn("badge", cr.status === "completed" ? "bg-success/15 text-success" : cr.status === "approved" ? "bg-accent-soft text-accent" : cr.status === "review" ? "bg-warning/15 text-warning" : cr.status === "in_progress" ? "bg-accent-soft text-accent" : cr.status === "rejected" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{cr.status}</span>
                    <span className={cn("badge", cr.type === "emergency" ? "bg-danger/15 text-danger" : "bg-accent-soft text-accent")}>{cr.type}</span>
                    <span className={cn("badge", cr.riskAssessment === "high" ? "bg-danger/15 text-danger" : cr.riskAssessment === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>{cr.riskAssessment} risk</span>
                  </div>
                  <p className="text-xs text-muted">{cr.description}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    <span>By {cr.requestedByName}</span>
                    <span>{formatDate(cr.createdAt)}</span>
                    <span className="badge bg-surface2">{cr.category}</span>
                    {cr.affectedSystems.map((sys) => <span key={sys} className="badge bg-accent-soft text-accent text-[10px]">{sys}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {cr.status === "draft" && <button onClick={() => { updateChangeRequest(cr.id, { status: "review" }); refresh(); }} className="btn-ghost btn-sm text-xs">Submit</button>}
                {cr.status === "review" && <button onClick={() => { approveChangeRequest(cr.id, "admin", "Admin"); refresh(); }} className="btn-ghost btn-sm text-xs text-success">Approve</button>}
                {cr.status === "in_progress" && <button onClick={() => { implementChangeStep(cr.id, cr.implementationSteps.findIndex((s) => !s.done) + 1); refresh(); }} className="btn-ghost btn-sm text-xs">Next step</button>}
              </div>
            </div>
            {cr.implementationSteps.length > 0 && (
              <div className="mt-3 flex gap-2">
                {cr.implementationSteps.map((s) => (
                  <span key={s.step} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]", s.done ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>
                    {s.done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />} Step {s.step}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Helper for ChangesTab */
function implementChangeStep(id: string, stepNumber: number) {
  const cr = getChangeRequests().find((c) => c.id === id);
  if (!cr) return;
  const steps = cr.implementationSteps.map((s) => s.step === stepNumber ? { ...s, done: true, completedAt: Date.now() } : s);
  const allDone = steps.every((s) => s.done);
  updateChangeRequest(id, { implementationSteps: steps, status: allDone ? "completed" : "in_progress", completedAt: allDone ? Date.now() : undefined });
}

/* ================================================================== */
/*  RISKS TAB                                                          */
/* ================================================================== */

function RisksTab() {
  const [risks, setRisks] = useState(() => getRisks());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "security" as const, likelihood: 3, impact: 3, ownerUserId: "admin", ownerName: "Admin", mitigationPlan: "", tags: [] as string[] });
  const refresh = () => setRisks(getRisks());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{risks.filter((r) => r.status === "mitigating" || r.status === "identified").length} open · {risks.length} total</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Risk</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Risk</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <label className="label-field">Likelihood (1-5)</label>
              <input className="input-field w-20" type="number" min={1} max={5} value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="flex gap-2">
              <label className="label-field">Impact (1-5)</label>
              <input className="input-field w-20" type="number" min={1} max={5} value={form.impact} onChange={(e) => setForm({ ...form, impact: parseInt(e.target.value) || 1 })} />
            </div>
            <input className="input-field sm:col-span-2" placeholder="Mitigation plan" value={form.mitigationPlan} onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name) { createRisk(form as any); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {risks.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("h-5 w-5", r.score >= 15 ? "text-danger" : r.score >= 8 ? "text-warning" : "text-accent")} />
                <div>
                  <p className="font-medium text-ink text-sm">{r.name}</p>
                  <span className={cn("badge", r.status === "resolved" ? "bg-success/15 text-success" : r.status === "mitigating" ? "bg-accent-soft text-accent" : r.status === "accepted" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{r.status}</span>
                </div>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", r.score >= 15 ? "bg-danger/15 text-danger" : r.score >= 8 ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{r.score}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{r.description}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted">
              <span className="badge bg-surface2">L{r.likelihood}/I{r.impact}</span>
              <span className="badge bg-accent-soft text-accent">{r.category}</span>
              <span className="badge bg-surface2">Owner: {r.ownerName}</span>
            </div>
            {r.mitigationPlan && (
              <div className="mt-2 rounded-lg bg-surface2/50 p-2">
                <p className="text-xs text-muted">{r.mitigationPlan}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
                    <div className={cn("h-full rounded-full", r.mitigationProgress >= 80 ? "bg-success" : r.mitigationProgress >= 40 ? "bg-warning" : "bg-danger")} style={{ width: `${r.mitigationProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-muted">{r.mitigationProgress}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Risk Matrix */}
      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Risk Matrix</h3>
        <div className="grid grid-cols-5 gap-1">
          {[5, 4, 3, 2, 1].map((l) => (
            [1, 2, 3, 4, 5].map((i) => {
              const score = l * i;
              const count = risks.filter((r) => r.likelihood === l && r.impact === i).length;
              return (
                <div key={`${l}-${i}`} className={cn("flex items-center justify-center rounded p-2 text-xs font-medium", score >= 15 ? "bg-danger/20 text-danger" : score >= 8 ? "bg-warning/20 text-warning" : score >= 4 ? "bg-accent-soft/30 text-accent" : "bg-surface2 text-muted")}>
                  {count > 0 ? count : "·"}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  INCIDENTS TAB                                                      */
/* ================================================================== */

function IncidentsTab() {
  const [incidents, setIncidents] = useState(() => getIncidents());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "security_breach" as const, severity: "medium" as const, detectedBy: "admin", assignedTo: "admin_4", assignedToName: "Security Lead", impactDescription: "", containmentActions: [] as string[], affectedSystems: [] as string[] });
  const refresh = () => setIncidents(getIncidents());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length} active · {incidents.length} total</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Incident</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Incident</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Title*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="input-field" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as any })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
            <input className="input-field sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input-field sm:col-span-2" placeholder="Impact description" value={form.impactDescription} onChange={(e) => setForm({ ...form, impactDescription: e.target.value })} />
          </div>
          <button onClick={() => { if (form.title) { createIncident(form as any); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {incidents.map((inc) => (
          <div key={inc.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <AlertOctagon className={cn("h-5 w-5 mt-0.5", inc.severity === "critical" ? "text-danger" : inc.severity === "high" ? "text-warning" : "text-accent")} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{inc.title}</p>
                    <span className={cn("badge", inc.status === "closed" ? "bg-success/15 text-success" : inc.status === "resolved" ? "bg-accent-soft text-accent" : inc.status === "investigating" ? "bg-warning/15 text-warning" : inc.status === "contained" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{inc.status}</span>
                    <span className={cn("badge", inc.severity === "critical" ? "bg-danger/15 text-danger" : inc.severity === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{inc.severity}</span>
                    <span className="badge bg-surface2 text-muted">{inc.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-muted">{inc.description}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    <span>Assigned: {inc.assignedToName}</span>
                    <span>{formatDate(inc.detectedAt)}</span>
                    {inc.affectedSystems.map((sys) => <span key={sys} className="badge bg-surface2 text-[10px]">{sys}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {inc.status === "detected" && <button onClick={() => { assignIncident(inc.id, "admin_4", "Security Lead"); refresh(); }} className="btn-ghost btn-sm text-xs">Assign</button>}
                {inc.rootCause && inc.status !== "closed" && <button onClick={() => { closeIncident(inc.id, inc.resolution || "", inc.rootCause || "", inc.lessonsLearned || []); refresh(); }} className="btn-ghost btn-sm text-xs text-success">Close</button>}
              </div>
            </div>
            {inc.timeline.length > 0 && (
              <div className="mt-3 space-y-1">
                {inc.timeline.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-soft shrink-0" />
                    <span className="font-medium">{t.action}</span>
                    <span>by {t.actor}</span>
                    <span>— {t.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SECURITY OPS TAB                                                   */
/* ================================================================== */

function SecurityOpsTab() {
  const threats = useMemo(() => getSecurityThreats(), []);
  const [vulns, setVulns] = useState(() => getVulnerabilities());
  const certs = useMemo(() => getCertificates(), []);
  const secrets = useMemo(() => getSecretRotations(), []);
  const stats = useMemo(() => getSecurityOperationsStats(), []);
  const refreshVulns = () => setVulns(getVulnerabilities());

  return (
    <div className="mt-8">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{stats.activeThreats}</p><p className="text-xs text-muted">Active Threats</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-danger">{stats.openVulns}</p><p className="text-xs text-muted">Open Vulns</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{stats.expiringCerts}</p><p className="text-xs text-muted">Expiring Certs</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{stats.overdueSecrets}</p><p className="text-xs text-muted">Overdue Secrets</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Threats */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-accent" /> Security Threats</h3>
          <div className="space-y-2">
            {threats.map((t) => (
              <div key={t.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={cn("h-4 w-4", t.severity === "critical" ? "text-danger" : t.severity === "high" ? "text-warning" : "text-accent")} />
                    <div>
                      <p className="font-medium text-ink text-sm">{t.name}</p>
                      <p className="text-xs text-muted">{t.description}</p>
                    </div>
                  </div>
                  <span className={cn("badge", t.status === "blocked" ? "bg-success/15 text-success" : t.status === "investigating" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerabilities */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Vulnerabilities</h3>
          <div className="space-y-2">
            {vulns.map((v) => (
              <div key={v.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold", v.severity === "critical" ? "bg-danger/15 text-danger" : v.severity === "high" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{v.cvssScore}</div>
                    <div>
                      <p className="font-medium text-ink text-sm">{v.name}</p>
                      <p className="text-xs text-muted">{v.affectedComponent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("badge", v.status === "fixed" ? "bg-success/15 text-success" : v.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{v.status}</span>
                    {v.patchAvailable && v.status !== "fixed" && (
                      <button onClick={() => { updateVulnerability(v.id, { status: "in_progress" }); refreshVulns(); }} className="btn-ghost btn-sm text-xs"><CheckCircle2 className="h-3 w-3" /></button>
                    )}
                  </div>
                </div>
                {v.cveId && <span className="badge bg-accent-soft text-accent text-[10px] mt-1">{v.cveId}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificates & Secrets */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Lock className="h-4 w-4 text-accent" /> Certificates</h3>
          <div className="space-y-2">
            {certs.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-surface2/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink">{c.domain}</p>
                  <p className="text-xs text-muted">Expires: {formatDate(c.expiresAt)} ({c.daysUntilExpiry} days)</p>
                </div>
                <span className={cn("badge", c.status === "valid" ? "bg-success/15 text-success" : c.status === "expiring" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Key className="h-4 w-4 text-accent" /> Secret Rotation</h3>
          <div className="space-y-2">
            {secrets.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface2/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-muted">{s.type} · Next: {formatDate(s.nextRotationAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("badge", s.status === "ok" ? "bg-success/15 text-success" : s.status === "due" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{s.status}</span>
                  {s.status === "overdue" && <button onClick={() => { rotateSecret(s.id); }} className="btn-ghost btn-sm text-xs"><RefreshCw className="h-3 w-3" /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPLIANCE TAB                                                     */
/* ================================================================== */

function ComplianceTab() {
  const frameworks = useMemo(() => getComplianceFrameworks(), []);
  const overall = useMemo(() => getComplianceOverallStatus(), [frameworks]);
  const [selections, setSelections] = useState<Record<string, string>>({});

  return (
    <div className="mt-8">
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("grid h-16 w-16 place-items-center rounded-full text-lg font-bold", overall.score >= 80 ? "bg-success/15 text-success" : overall.score >= 50 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{overall.score}%</div>
          <div>
            <h3 className="font-semibold text-ink">Compliance Score</h3>
            <p className="text-sm text-muted">{overall.passed}/{overall.total} controls compliant</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {overall.byFramework.map((f) => (
            <span key={f.name} className={cn("badge", f.status === "certified" || f.status === "audit_ready" ? "bg-success/15 text-success" : f.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{f.name}: {f.score}%</span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {frameworks.map((fw) => (
          <div key={fw.code} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-ink">{fw.name} <span className="text-xs text-muted">v{fw.version}</span></p>
                  <p className="text-xs text-muted">{fw.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("badge", fw.status === "certified" ? "bg-success/15 text-success" : fw.status === "audit_ready" ? "bg-accent-soft text-accent" : fw.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{fw.status.replace(/_/g, " ")}</span>
                <span className="text-xs text-muted">Assigned: {fw.assignedTo}</span>
              </div>
            </div>
            <div className="space-y-2">
              {fw.controls.map((c) => {
                const key = `${fw.code}-${c.id}`;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-surface2/30 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select className="input-field text-xs w-32" value={selections[key] || c.status} onChange={(e) => {
                        const val = e.target.value as any;
                        updateComplianceControl(fw.code, c.id, { status: val, lastCheckedAt: Date.now() });
                        setSelections({ ...selections, [key]: val });
                      }}>
                        <option value="compliant">Compliant</option>
                        <option value="partially_compliant">Partial</option>
                        <option value="non_compliant">Non-compliant</option>
                        <option value="not_applicable">N/A</option>
                      </select>
                      <span className={cn("h-2 w-2 rounded-full", c.status === "compliant" ? "bg-success" : c.status === "partially_compliant" ? "bg-warning" : "bg-danger")} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AI GOVERNANCE TAB                                                  */
/* ================================================================== */

function AiGovernanceTab() {
  const policies = useMemo(() => getAiGovernancePolicies(), []);
  const [approvals, setApprovals] = useState(() => getAiActionApprovals());
  const stats = useMemo(() => getAiGovernanceStats(), [policies, approvals]);
  const refreshApprovals = () => setApprovals(getAiActionApprovals());

  return (
    <div className="mt-8">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{stats.enabledPolicies}/{stats.totalPolicies}</p><p className="text-xs text-muted">Policies Active</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{stats.pendingApprovals}</p><p className="text-xs text-muted">Pending Review</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{stats.approvedApprovals}</p><p className="text-xs text-muted">Approved</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-danger">{stats.rejectedApprovals}</p><p className="text-xs text-muted">Rejected</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Policies */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /> AI Governance Policies</h3>
          <div className="space-y-2">
            {policies.map((p) => (
              <div key={p.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">{p.name}</p>
                    <p className="text-xs text-muted">{p.description}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" checked={p.enabled} onChange={() => { updateAiGovernancePolicy(p.id, { enabled: !p.enabled }); }} className="peer sr-only" />
                    <div className="h-5 w-9 rounded-full bg-line after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                  <span className="badge bg-accent-soft text-accent">{p.category}</span>
                  <span className="badge bg-surface2">v{p.version}</span>
                  <span className="badge bg-surface2">{p.rules.length} rules</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action Approvals */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-accent" /> AI Action Approvals</h3>
          <div className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="card p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink text-sm">{a.actionType.replace(/_/g, " ")}</p>
                      <span className={cn("badge", a.status === "approved" ? "bg-success/15 text-success" : a.status === "rejected" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>{a.status}</span>
                    </div>
                    <p className="text-xs text-muted">{a.description}</p>
                    <p className="text-xs text-muted mt-0.5">By {a.requestedByName} · {formatDate(a.createdAt)}</p>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex shrink-0 gap-1 ml-2">
                      <button onClick={() => { approveAiAction(a.id, "admin", "Admin"); refreshApprovals(); }} className="btn-ghost btn-sm text-xs text-success"><CheckCircle2 className="h-3 w-3" /></button>
                      <button onClick={() => { rejectAiAction(a.id, "admin", "Admin", "Manual review: not approved"); refreshApprovals(); }} className="btn-ghost btn-sm text-xs text-danger"><XCircle className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
