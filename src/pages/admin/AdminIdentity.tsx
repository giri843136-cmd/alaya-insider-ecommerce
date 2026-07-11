/**
 * ALAYA INSIDER — Enterprise Identity, Authentication & Authorization Admin UI
 *
 * Complete administration interface for the Identity Platform.
 * Tabs: Dashboard | Users | Roles | Permissions | Organizations | Sessions |
 *        API Keys | Audit | Zero Trust | Break Glass | Settings
 */
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Shield, Users as UsersIcon, KeyRound, Lock, Fingerprint,
  Monitor, MapPin, Clock, CheckCircle2, XCircle, AlertTriangle,
  Plus, Search, Trash2, Edit3, UserPlus, UserCheck, UserX,
  Ban, Power, ExternalLink, Copy, Eye,
  Building2, UsersRound, Siren, Globe,
  RefreshCw, Download, FileText, SlidersHorizontal, UnlockKeyhole,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { useIdentity } from "../../context/IdentityContext";
import type {
  IdentityUser,
  ApiKey, ServiceAccount, BreakGlassAccount, ImpersonationLog,
  IdentityEvent, PermissionDefinition,
  UserType, UserStatus, ZtConditionType,
} from "../../lib/identity";
import {
  PERMISSION_DEFINITIONS, ROLE_TEMPLATES,
  getStore,
} from "../../lib/identity";

/* ================================================================== */
/*  TYPE HELPERS                                                       */
/* ================================================================== */

type Tab = "dashboard" | "users" | "roles" | "permissions" | "organizations" | "sessions" | "apikeys" | "audit" | "zerotrust" | "breakglass" | "settings";

const USER_TYPE_TONE: Record<UserType, string> = {
  admin: "bg-danger/15 text-danger",
  editor: "bg-accent-soft text-accent",
  manager: "bg-warning/15 text-warning",
  supplier: "bg-violet-500/15 text-violet-500",
  affiliate: "bg-orange-500/15 text-orange-500",
  customer: "bg-success/15 text-success",
  api_service: "bg-cyan-500/15 text-cyan-500",
  ai_agent: "bg-purple-500/15 text-purple-500",
  worker: "bg-surface2 text-muted",
  system: "bg-surface2 text-muted",
};

const STATUS_TONE: Record<UserStatus, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-surface2 text-muted",
  suspended: "bg-danger/15 text-danger",
  locked: "bg-warning/15 text-warning",
  pending_verification: "bg-accent-soft text-accent",
  pending_invite: "bg-accent-soft text-accent",
};

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function AdminIdentity() {
  const identity = useIdentity();
  const { analytics, fetchAnalytics } = identity;
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "users", label: "Users", icon: UsersIcon },
    { id: "roles", label: "Roles", icon: KeyRound },
    { id: "permissions", label: "Permissions", icon: Lock },
    { id: "organizations", label: "Organizations", icon: Building2 },
    { id: "sessions", label: "Sessions", icon: Monitor },
    { id: "apikeys", label: "API Keys", icon: KeyRound },
    { id: "audit", label: "Audit Log", icon: FileText },
    { id: "zerotrust", label: "Zero Trust", icon: Shield },
    { id: "breakglass", label: "Emergency", icon: Siren },
    { id: "settings", label: "Settings", icon: SlidersHorizontal },
  ];

  return (
    <>
      <Seo title="Identity" path="/admin/identity" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Identity Platform</h1>
            <p className="mt-1 text-sm text-muted">
              Enterprise identity, authentication, authorization & zero trust management.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchAnalytics} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("chip flex items-center gap-1.5 capitalize", tab === t.id && "chip-active")}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/*  DASHBOARD                                                       */}
        {/* ================================================================ */}
        {tab === "dashboard" && <DashboardTab analytics={analytics} identity={identity} />}

        {/* ================================================================ */}
        {/*  USERS                                                           */}
        {/* ================================================================ */}
        {tab === "users" && <UsersTab />}

        {/* ================================================================ */}
        {/*  ROLES                                                           */}
        {/* ================================================================ */}
        {tab === "roles" && <RolesTab />}

        {/* ================================================================ */}
        {/*  PERMISSIONS                                                     */}
        {/* ================================================================ */}
        {tab === "permissions" && <PermissionsTab />}

        {/* ================================================================ */}
        {/*  ORGANIZATIONS                                                   */}
        {/* ================================================================ */}
        {tab === "organizations" && <OrganizationsTab />}

        {/* ================================================================ */}
        {/*  SESSIONS                                                        */}
        {/* ================================================================ */}
        {tab === "sessions" && <SessionsTab />}

        {/* ================================================================ */}
        {/*  API KEYS                                                        */}
        {/* ================================================================ */}
        {tab === "apikeys" && <ApiKeysTab />}

        {/* ================================================================ */}
        {/*  AUDIT LOG                                                       */}
        {/* ================================================================ */}
        {tab === "audit" && <AuditTab />}

        {/* ================================================================ */}
        {/*  ZERO TRUST                                                      */}
        {/* ================================================================ */}
        {tab === "zerotrust" && <ZeroTrustTab />}

        {/* ================================================================ */}
        {/*  BREAK GLASS & EMERGENCY                                         */}
        {/* ================================================================ */}
        {tab === "breakglass" && <BreakGlassTab />}

        {/* ================================================================ */}
        {/*  SETTINGS                                                        */}
        {/* ================================================================ */}
        {tab === "settings" && <SecuritySettingsTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD TAB                                                      */
/* ================================================================== */

function DashboardTab({ analytics, identity }: { analytics: ReturnType<typeof import("../../lib/identity").getIdentityAnalytics>; identity: ReturnType<typeof useIdentity> }) {
  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UsersIcon} label="Total Users" value={analytics.totalUsers} sub={`${analytics.activeUsers} active`} tone="accent" />
        <StatCard icon={Fingerprint} label="MFA Enabled" value={analytics.mfaEnabled} sub={`${analytics.totalUsers > 0 ? Math.round(analytics.mfaEnabled / analytics.totalUsers * 100) : 0}% of users`} tone="success" />
        <StatCard icon={Monitor} label="Active Sessions" value={analytics.activeSessions} sub="Currently logged in" tone="accent" />
        <StatCard icon={AlertTriangle} label="Suspicious Events (24h)" value={analytics.suspiciousEvents24h} sub={`${analytics.events24h} total events`} tone={analytics.suspiciousEvents24h > 0 ? "danger" : "success"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-semibold text-ink">Logins (24h)</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-ink">{analytics.loginEvents24h}</span>
            <span className="text-sm text-muted">total</span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="text-sm text-success">{analytics.loginEvents24h - analytics.failedLogins24h} successful</span>
            <span className="text-sm text-muted">·</span>
            <span className="text-sm text-danger">{analytics.failedLogins24h} failed</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${analytics.loginEvents24h > 0 ? (analytics.loginEvents24h - analytics.failedLogins24h) / analytics.loginEvents24h * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink">Users by Type</h3>
          <div className="mt-4 space-y-2">
            {(["admin", "editor", "manager", "supplier", "affiliate", "customer"] as UserType[]).map((type) => {
              const count = identity.users.filter((u) => u.type === type).length;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", USER_TYPE_TONE[type].split(" ")[0])} />
                    <span className="capitalize text-muted">{type}</span>
                  </span>
                  <span className="font-medium text-ink">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink">Key Metrics</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">API Keys</span>
              <span className="font-medium text-ink">{analytics.totalApiKeys} ({analytics.activeApiKeys} active)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Service Accounts</span>
              <span className="font-medium text-ink">{analytics.totalServiceAccounts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Roles</span>
              <span className="font-medium text-ink">{analytics.totalRoles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Organizations</span>
              <span className="font-medium text-ink">{analytics.totalOrganizations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Teams</span>
              <span className="font-medium text-ink">{analytics.totalTeams}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Shield; label: string; value: number | string; sub: string; tone: "accent" | "success" | "danger" | "warning";
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className={cn(
          "grid h-10 w-10 place-items-center rounded-full",
          tone === "success" ? "bg-success/15 text-success" :
          tone === "danger" ? "bg-danger/15 text-danger" :
          tone === "warning" ? "bg-warning/15 text-warning" :
          "bg-accent-soft text-accent"
        )}><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

/* ================================================================== */
/*  USERS TAB                                                          */
/* ================================================================== */

function UsersTab() {
  const identity = useIdentity();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<IdentityUser | null>(null);

  const filtered = useMemo(() => {
    if (!search) return identity.users;
    const q = search.toLowerCase();
    return identity.users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.type.toLowerCase().includes(q) ||
      u.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [identity.users, search]);

  const [form, setForm] = useState({ email: "", name: "", password: "", type: "editor" as UserType, phone: "", department: "", title: "", roles: [] as string[] });

  const handleCreate = () => {
    identity.createNewUser(form);
    setShowCreate(false);
    setForm({ email: "", name: "", password: "", type: "editor", phone: "", department: "", title: "", roles: [] });
  };

  const handleSuspend = (id: string) => {
    const user = identity.users.find((u) => u.id === id);
    if (user?.status === "suspended") identity.reactivateUserById(id);
    else identity.suspendUserById(id);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input-field w-full pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name, email, type…" />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm"><UserPlus className="h-3.5 w-3.5" /> Create User</button>
      </div>

      {/* Create/Edit Form */}
      {(showCreate || editingUser) && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">{editingUser ? "Edit User" : "Create New User"}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted">Name</label>
              <input className="input-field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input className="input-field mt-1 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
            </div>
            {!editingUser && (
              <div>
                <label className="text-xs font-medium text-muted">Password</label>
                <input className="input-field mt-1 w-full" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted">Type</label>
              <select className="input-field mt-1 w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as UserType })}>
                {["admin", "editor", "manager", "supplier", "affiliate", "customer", "api_service", "ai_agent"].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Department</label>
              <input className="input-field mt-1 w-full" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Title</label>
              <input className="input-field mt-1 w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Developer" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Phone</label>
              <input className="input-field mt-1 w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0100" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Roles</label>
              <select className="input-field mt-1 w-full" multiple value={form.roles} onChange={(e) => setForm({ ...form, roles: Array.from(e.target.selectedOptions, (o) => o.value) })}>
                {identity.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={editingUser ? () => { identity.editUser(editingUser.id, form); setEditingUser(null); } : handleCreate} className="btn-primary btn-sm">
              {editingUser ? "Save Changes" : "Create User"}
            </button>
            <button onClick={() => { setShowCreate(false); setEditingUser(null); }} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="mt-6"><EmptyState icon={<UsersIcon className="h-6 w-6" />} title="No users found" description={search ? "Try a different search." : "Create your first user to get started."} /></div>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-medium",
                USER_TYPE_TONE[u.type]
              )}>{u.name.charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{u.name}</p>
                  <span className={cn("badge text-[0.6rem]", STATUS_TONE[u.status])}>{u.status.replace("_", " ")}</span>
                  <span className={cn("badge text-[0.6rem]", USER_TYPE_TONE[u.type])}>{u.type.replace("_", " ")}</span>
                  {u.mfaEnabled && <span className="badge bg-accent-soft text-accent text-[0.6rem]">MFA</span>}
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span>{u.email}</span>
                  {u.phone && <span>{u.phone}</span>}
                  <span>Roles: {u.roles.map((r) => identity.roles.find((role) => role.id === r)?.name || r).join(", ")}</span>
                  {u.lastLogin && <span>Last login: {formatDateTime(u.lastLogin)}</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingUser(u); setForm({ email: u.email, name: u.name, password: "", type: u.type, phone: u.phone || "", department: u.attributes?.department || "", title: u.attributes?.title || "", roles: u.roles }); }} className="btn-ghost btn-sm" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleSuspend(u.id)} className={cn("btn-ghost btn-sm", u.status === "suspended" ? "text-success" : "text-warning")} title={u.status === "suspended" ? "Reactivate" : "Suspend"}>
                  {u.status === "suspended" ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => identity.removeUser(u.id)} className="btn-ghost btn-sm text-danger" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ROLES TAB                                                          */
/* ================================================================== */

function RolesTab() {
  const identity = useIdentity();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "custom" as "system" | "custom" | "organization" | "team", permissions: [] as string[], inherits: [] as string[], priority: 50, isTemplate: false, editable: true });

  const handleCreate = () => {
    identity.createNewRole({ ...form, isTemplate: false, editable: true });
    setShowCreate(false);
    setForm({ name: "", description: "", type: "custom", permissions: [], inherits: [], priority: 50, isTemplate: false, editable: true });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{identity.roles.length} role(s) · {identity.roles.filter((r) => r.type === "system").length} system, {identity.roles.filter((r) => r.type === "custom").length} custom</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create Role</button>
      </div>

      {showCreate && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">Create New Role</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Name</label>
              <input className="input-field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Content Manager" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Type</label>
              <select className="input-field mt-1 w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "system" | "custom" | "organization" | "team" })}>
                <option value="custom">Custom</option>
                <option value="organization">Organization</option>
                <option value="team">Team</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted">Description</label>
              <input className="input-field mt-1 w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Role description" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Priority</label>
              <input className="input-field mt-1 w-full" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Inherits from</label>
              <select className="input-field mt-1 w-full" multiple value={form.inherits} onChange={(e) => setForm({ ...form, inherits: Array.from(e.target.selectedOptions, (o) => o.value) })}>
                {identity.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted">Permissions</label>
              <div className="mt-1 flex flex-wrap gap-2 max-h-40 overflow-y-auto rounded-lg border border-line p-3">
                {PERMISSION_DEFINITIONS.filter((p) => p.key !== "*").map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setForm({
                      ...form,
                      permissions: form.permissions.includes(p.key)
                        ? form.permissions.filter((x) => x !== p.key)
                        : [...form.permissions, p.key],
                    })}
                    className={cn("chip text-xs", form.permissions.includes(p.key) && "bg-accent-soft text-accent")}
                  >
                    {p.key}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="btn-primary btn-sm">Create Role</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Role templates */}
      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-ink">Role Templates</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_TEMPLATES.map((rt) => (
            <div key={rt.id} className="card p-4">
              <h4 className="font-medium text-ink">{rt.name}</h4>
              <p className="mt-1 text-xs text-muted">{rt.description}</p>
              <div className="mt-3 space-y-1">
                {rt.roles.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    {r.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role list */}
      <div className="mt-6 space-y-2">
        {identity.roles.map((role) => (
          <div key={role.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full",
              role.type === "system" ? "bg-danger/15 text-danger" :
              role.type === "custom" ? "bg-accent-soft text-accent" :
              "bg-surface2 text-muted"
            )}>
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink">{role.name}</p>
                <span className={cn("badge text-[0.6rem]", role.type === "system" ? "bg-danger/15 text-danger" : "bg-accent-soft text-accent")}>{role.type}</span>
                {role.isTemplate && <span className="badge bg-surface2 text-muted text-[0.6rem]">Template</span>}
              </div>
              <p className="text-xs text-muted">{role.description}</p>
              <p className="text-xs text-muted mt-0.5">
                {role.permissions.length} permission(s) · {role.inherits.length} inheritance(s) · Priority {role.priority}
              </p>
            </div>
            {role.editable && (
              <button onClick={() => identity.removeRole(role.id)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PERMISSIONS TAB                                                    */
/* ================================================================== */

function PermissionsTab() {
  const identity = useIdentity();
  const groups = useMemo(() => {
    const map = new Map<string, PermissionDefinition[]>();
    PERMISSION_DEFINITIONS.forEach((p) => {
      if (!map.has(p.group)) map.set(p.group, []);
      map.get(p.group)!.push(p);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-6">{PERMISSION_DEFINITIONS.length} permission definitions across {groups.length} groups</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map(([group, perms]) => (
          <div key={group} className="card p-5">
            <h3 className="font-semibold text-ink">{group} ({perms.length})</h3>
            <div className="mt-3 space-y-2">
              {perms.map((p) => (
                <div key={p.id} className="flex items-start gap-3 rounded-lg border border-line p-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-medium text-ink">{p.key}</code>
                      <span className={cn("badge text-[0.55rem]", p.scope === "global" ? "bg-danger/15 text-danger" : p.scope === "organization" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{p.scope}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{p.name} — {p.description}</p>
                    {p.dependsOn && p.dependsOn.length > 0 && (
                      <p className="text-xs text-muted mt-0.5">Depends on: {p.dependsOn.join(", ")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Permission check tool */}
      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink">Permission Checker</h3>
        <p className="mt-1 text-xs text-muted">Check whether a user has a specific permission.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERMISSION_DEFINITIONS.slice(0, 20).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                const user = identity.users[0];
                if (user) {
                  const has = identity.checkPermission(user.id, p.key);
                  alert(`User "${user.name}" ${has ? "HAS" : "does NOT have"} permission "${p.key}"`);
                }
              }}
              className="chip text-xs"
            >
              {p.key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ORGANIZATIONS TAB                                                  */
/* ================================================================== */

function OrganizationsTab() {
  const identity = useIdentity();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: "", slug: "", domain: "", plan: "free" as "free" | "starter" | "business" | "enterprise" });
  const [teamForm, setTeamForm] = useState({ name: "", description: "", organizationId: "" });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{identity.organizations.length} organization(s) · {identity.teams.length} team(s)</p>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateTeam(true)} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Create Team</button>
          <button onClick={() => setShowCreateOrg(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create Organization</button>
        </div>
      </div>

      {(showCreateOrg || showCreateTeam) && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">{showCreateOrg ? "Create Organization" : "Create Team"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {showCreateOrg ? (
              <>
                <div>
                  <label className="text-xs font-medium text-muted">Name</label>
                  <input className="input-field mt-1 w-full" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Slug</label>
                  <input className="input-field mt-1 w-full" value={orgForm.slug} onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Domain</label>
                  <input className="input-field mt-1 w-full" value={orgForm.domain} onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Plan</label>
                  <select className="input-field mt-1 w-full" value={orgForm.plan} onChange={(e) => setOrgForm({ ...orgForm, plan: e.target.value as any })}>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted">Name</label>
                  <input className="input-field mt-1 w-full" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Organization</label>
                  <select className="input-field mt-1 w-full" value={teamForm.organizationId} onChange={(e) => setTeamForm({ ...teamForm, organizationId: e.target.value })}>
                    <option value="">Select organization</option>
                    {identity.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted">Description</label>
                  <input className="input-field mt-1 w-full" value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={showCreateOrg ? () => { identity.createNewOrg({ ...orgForm, ownerId: identity.currentUser?.id || "", status: "active", admins: [], members: [], teams: [], departments: [], settings: {} }); setShowCreateOrg(false); } : () => { identity.createNewTeam({ ...teamForm, members: [], roles: [], permissions: [] }); setShowCreateTeam(false); }}
              className="btn-primary btn-sm"
            >
              Create
            </button>
            <button onClick={() => { setShowCreateOrg(false); setShowCreateTeam(false); }} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Organizations */}
      <div className="mt-6 space-y-3">
        <h3 className="font-semibold text-ink">Organizations</h3>
        {identity.organizations.length === 0 ? (
          <EmptyState icon={<Building2 className="h-6 w-6" />} title="No organizations yet" />
        ) : (
          identity.organizations.map((org) => (
            <div key={org.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{org.name}</p>
                  <p className="text-xs text-muted">{org.slug} · {org.domain} · Plan: {org.plan} · {org.members.length} members</p>
                </div>
                <span className={cn("badge", org.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{org.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Teams */}
      <div className="mt-6 space-y-3">
        <h3 className="font-semibold text-ink">Teams</h3>
        {identity.teams.length === 0 ? (
          <EmptyState icon={<UsersRound className="h-6 w-6" />} title="No teams yet" />
        ) : (
          identity.teams.map((team) => (
            <div key={team.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{team.name}</p>
                  <p className="text-xs text-muted">{team.description} · {team.members.length} members · {team.roles.length} roles</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SESSIONS TAB                                                       */
/* ================================================================== */

function SessionsTab() {
  const identity = useIdentity();
  const [selectedUser, setSelectedUser] = useState<string>(identity.currentUser?.id || "");
  const sessions = selectedUser ? identity.fetchSessions(selectedUser) : [];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-xs font-medium text-muted">Select user</label>
          <select className="input-field mt-1 w-full" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">— All users —</option>
            {identity.users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        {sessions.length > 0 && (
          <button onClick={() => identity.terminateAllSessions(selectedUser)} className="btn-ghost btn-sm text-danger"><Power className="h-3.5 w-3.5" /> Terminate All</button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<Monitor className="h-6 w-6" />} title="No active sessions" description="Select a user to view their sessions." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {sessions.map((s) => {
            const user = identity.users.find((u) => u.id === s.userId);
            return (
              <div key={s.id} className="card flex flex-wrap items-center gap-4 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  {s.type === "api_key" ? <KeyRound className="h-5 w-5" /> :
                   s.type === "magic_link" ? <ExternalLink className="h-5 w-5" /> :
                   <Monitor className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{user?.name || s.userId}</p>
                    <span className={cn("badge text-[0.55rem]", s.mfaVerified ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{s.mfaVerified ? "MFA OK" : "MFA pending"}</span>
                  </div>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                    <span>{s.type.replace("_", " ")}</span>
                    <span><Monitor className="inline h-3 w-3" /> {s.deviceName}</span>
                    <span><MapPin className="inline h-3 w-3" /> {s.location}</span>
                    <span><Clock className="inline h-3 w-3" /> {formatDateTime(s.createdAt)}</span>
                    {s.ip !== "client-resolved" && <span>IP: {s.ip}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    Expires {formatDateTime(s.expiresAt)} · Last activity {formatDateTime(s.lastActivity)}
                  </p>
                </div>
                <button onClick={() => identity.terminateSession(s.id)} className="btn-ghost btn-sm text-danger"><Power className="h-3.5 w-3.5" /> Terminate</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  API KEYS TAB                                                       */
/* ================================================================== */

function ApiKeysTab() {
  const identity = useIdentity();
  const [showCreate, setShowCreate] = useState(false);
  const [showServiceAccount, setShowServiceAccount] = useState(false);
  const store = getStore();
  const allApiKeys = store.apiKeys || [];
  const serviceAccounts = store.serviceAccounts || [];
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", userId: identity.currentUser?.id || "", type: "user" as "user" | "service_account" | "machine", permissions: [] as string[], allowedIps: [] as string[] });
  const [saForm, setSaForm] = useState({ name: "", description: "", type: "api" as "api" | "worker" | "ai_agent" | "microservice" | "webhook" | "cli" | "sdk", roles: [] as string[], permissions: [] as string[] });

  const handleCreateKey = () => {
    const result = identity.createNewApiKey(form);
    if (result) setCreatedKey(result.rawKey);
    setShowCreate(false);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{allApiKeys.length} API key(s) · {serviceAccounts.length} service account(s)</p>
        <div className="flex gap-2">
          <button onClick={() => setShowServiceAccount(true)} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Service Account</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create API Key</button>
        </div>
      </div>

      {/* Show created key */}
      {createdKey && (
        <div className="card mt-4 border border-accent/30 bg-accent-soft/10 p-5">
          <h3 className="font-semibold text-ink">API Key Created</h3>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface p-3">
            <code className="flex-1 text-sm font-mono text-ink break-all">{createdKey}</code>
            <button onClick={() => navigator.clipboard.writeText(createdKey)} className="btn-ghost btn-sm"><Copy className="h-4 w-4" /></button>
          </div>
          <p className="mt-2 text-xs text-warning"><AlertTriangle className="inline h-3 w-3" /> This is the only time you'll see the full key. Copy it now.</p>
          <button onClick={() => setCreatedKey(null)} className="btn-ghost btn-sm mt-2">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {(showCreate || showServiceAccount) && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">{showCreate ? "Create API Key" : "Create Service Account"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {showCreate ? (
              <>
                <div>
                  <label className="text-xs font-medium text-muted">Name</label>
                  <input className="input-field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">User</label>
                  <select className="input-field mt-1 w-full" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                    {identity.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Type</label>
                  <select className="input-field mt-1 w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                    <option value="user">User</option>
                    <option value="service_account">Service Account</option>
                    <option value="machine">Machine</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted">Name</label>
                  <input className="input-field mt-1 w-full" value={saForm.name} onChange={(e) => setSaForm({ ...saForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Type</label>
                  <select className="input-field mt-1 w-full" value={saForm.type} onChange={(e) => setSaForm({ ...saForm, type: e.target.value as any })}>
                    <option value="api">API</option>
                    <option value="worker">Worker</option>
                    <option value="ai_agent">AI Agent</option>
                    <option value="microservice">Microservice</option>
                    <option value="webhook">Webhook</option>
                    <option value="cli">CLI</option>
                    <option value="sdk">SDK</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted">Description</label>
                  <input className="input-field mt-1 w-full" value={saForm.description} onChange={(e) => setSaForm({ ...saForm, description: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={showCreate ? handleCreateKey : () => { identity.createNewServiceAccount(saForm); setShowServiceAccount(false); }} className="btn-primary btn-sm">
              {showCreate ? "Create API Key" : "Create Service Account"}
            </button>
            <button onClick={() => { setShowCreate(false); setShowServiceAccount(false); }} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* API Keys */}
      <div className="mt-6 space-y-2">
        <h3 className="font-semibold text-ink">API Keys</h3>
        {allApiKeys.length === 0 ? (
          <EmptyState icon={<KeyRound className="h-6 w-6" />} title="No API keys" />
        ) : (
          allApiKeys.map((k: ApiKey) => (
            <div key={k.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", k.active ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{k.name}</p>
                  <span className={cn("badge text-[0.6rem]", k.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{k.active ? "Active" : "Revoked"}</span>
                  <span className="badge bg-surface2 text-muted text-[0.6rem]">{k.type.replace("_", " ")}</span>
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <code className="font-mono">{k.prefix}…</code>
                  <span>Permissions: {k.permissions.length}</span>
                  {k.expiresAt && <span>Expires: {formatDateTime(k.expiresAt)}</span>}
                  {k.lastUsed && <span>Last used: {formatDateTime(k.lastUsed)}</span>}
                </p>
              </div>
              {k.active && (
                <button onClick={() => identity.revokeApiKeyById(k.id)} className="btn-ghost btn-sm text-danger"><Ban className="h-3.5 w-3.5" /> Revoke</button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Service Accounts */}
      <div className="mt-6 space-y-2">
        <h3 className="font-semibold text-ink">Service Accounts</h3>
        {serviceAccounts.length === 0 ? (
          <EmptyState icon={<UsersRound className="h-6 w-6" />} title="No service accounts" />
        ) : (
          serviceAccounts.map((sa: ServiceAccount) => (
            <div key={sa.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", sa.active ? "bg-cyan-500/15 text-cyan-500" : "bg-surface2 text-muted")}>
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{sa.name}</p>
                  <span className={cn("badge text-[0.6rem]", sa.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{sa.active ? "Active" : "Inactive"}</span>
                  <span className="badge bg-surface2 text-muted text-[0.6rem]">{sa.type.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-muted">{sa.description}</p>
                <p className="text-xs text-muted">
                  Roles: {sa.roles.length} · API Keys: {sa.apiKeys.length} · Permissions: {sa.permissions.length}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AUDIT TAB                                                          */
/* ================================================================== */

function AuditTab() {
  const identity = useIdentity();
  const [events, setEvents] = useState<IdentityEvent[]>([]);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const evts = identity.fetchIdentityEvents();
    setEvents(evts);
  }, [identity.fetchIdentityEvents]);

  const filtered = useMemo(() => {
    if (!filter) return events;
    return events.filter((e) =>
      e.type.toLowerCase().includes(filter.toLowerCase()) ||
      e.detail.toLowerCase().includes(filter.toLowerCase()) ||
      e.actor.toLowerCase().includes(filter.toLowerCase())
    );
  }, [events, filter]);

  const handleExport = () => {
    const csv = identity.exportComplianceReport();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input-field w-full pl-9" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter events…" />
        </div>
        <button onClick={handleExport} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> Export CSV</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {["login", "login_failed", "logout", "mfa_success", "mfa_failed", "session_created", "session_revoked", "password_changed", "user_created", "user_suspended", "role_assigned", "permission_changed", "api_key_created", "break_glass_used", "impersonation_start"].map((t) => (
          <button key={t} onClick={() => setFilter(filter === t ? "" : t)} className={cn("chip text-[0.6rem]", filter === t && "chip-active")}>{t.replace("_", " ")}</button>
        ))}
      </div>

      <div className="mt-4 card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState icon={<FileText className="h-6 w-6" />} title="No events found" description="Events will appear here as users interact with the system." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.slice(0, 100).map((e) => {
              const user = identity.users.find((u) => u.id === e.userId);
              return (
                <li key={e.id} className="flex items-center gap-4 px-4 py-3">
                  <span className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs",
                    e.type === "login" || e.type === "mfa_success" || e.type === "session_created" ? "bg-success/15 text-success" :
                    e.type === "login_failed" || e.type === "mfa_failed" || e.type === "suspicious_login" ? "bg-danger/15 text-danger" :
                    e.type === "break_glass_used" || e.type === "impersonation_start" ? "bg-warning/15 text-warning" :
                    "bg-accent-soft text-accent"
                  )}>
                    {e.type === "login" || e.type === "logout" ? <Activity className="h-4 w-4" /> :
                     e.type === "login_failed" ? <XCircle className="h-4 w-4" /> :
                     <FileText className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{e.detail}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span>{user?.name || e.actor}</span>
                      <span><Clock className="inline h-3 w-3" /> {formatDateTime(e.ts)}</span>
                      {e.ip && <span>IP: {e.ip}</span>}
                    </p>
                  </div>
                  <span className={cn(
                    "badge text-[0.55rem] capitalize",
                    e.type.includes("fail") || e.type.includes("suspicious") ? "bg-danger/15 text-danger" :
                    e.type.includes("success") || e.type === "login" ? "bg-success/15 text-success" :
                    "bg-accent-soft text-accent"
                  )}>{e.type.replace(/_/g, " ")}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ZERO TRUST TAB                                                     */
/* ================================================================== */

function ZeroTrustTab() {
  const identity = useIdentity();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", effect: "allow" as "allow" | "deny" | "require_mfa" | "require_approval", conditions: [] as { type: ZtConditionType; operator: "in" | "not_in" | "equals" | "not_equals" | "gt" | "lt" | "between" | "contains"; value: string | string[] | number; label: string }[], priority: 100, enabled: true });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{identity.zeroTrustPolicies.length} Zero Trust policy(ies)</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create Policy</button>
      </div>

      {/* Zero Trust Architecture diagram */}
      <div className="card mt-6 p-5 bg-gradient-to-br from-accent-soft/5 to-surface">
        <h3 className="font-semibold text-ink">Zero Trust Architecture</h3>
        <div className="mt-4 flex flex-wrap gap-4">
          {[
            { icon: Eye, label: "Continuous Verification", desc: "Every request is verified, regardless of source" },
            { icon: Shield, label: "Least Privilege", desc: "Minimum permissions for every action" },
            { icon: Monitor, label: "Device Trust", desc: "Device health verified before access" },
            { icon: Lock, label: "Micro-segmentation", desc: "Network segments isolated by policy" },
          ].map((item) => (
            <div key={item.label} className="flex-1 min-w-[200px] rounded-lg border border-line bg-surface p-4">
              <item.icon className="h-5 w-5 text-accent" />
              <p className="mt-2 font-medium text-ink text-sm">{item.label}</p>
              <p className="mt-1 text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-ink mb-4">Create Zero Trust Policy</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Name</label>
              <input className="input-field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Effect</label>
              <select className="input-field mt-1 w-full" value={form.effect} onChange={(e) => setForm({ ...form, effect: e.target.value as any })}>
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
                <option value="require_mfa">Require MFA</option>
                <option value="require_approval">Require Approval</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted">Description</label>
              <input className="input-field mt-1 w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Priority</label>
              <input className="input-field mt-1 w-full" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded border-line" />
                <span className="text-xs text-muted">Enabled</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => {
              identity.createZtPolicy({ ...form, conditions: form.conditions.length > 0 ? form.conditions : [{ type: "mfa_status" as const, operator: "equals" as const, value: "true", label: "MFA must be verified" }] });
              setShowCreate(false);
            }} className="btn-primary btn-sm">Create Policy</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {identity.zeroTrustPolicies.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{p.name}</p>
                  <span className={cn("badge", p.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{p.enabled ? "Enabled" : "Disabled"}</span>
                  <span className={cn(
                    "badge",
                    p.effect === "allow" ? "bg-success/15 text-success" :
                    p.effect === "deny" ? "bg-danger/15 text-danger" :
                    "bg-warning/15 text-warning"
                  )}>{p.effect.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.conditions.map((c, i) => (
                    <span key={i} className="chip text-[0.55rem]">{c.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BREAK GLASS & EMERGENCY TAB                                        */
/* ================================================================== */

function BreakGlassTab() {
  const identity = useIdentity();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", reason: "" });
  const [impersonateForm, setImpersonateForm] = useState({ targetId: "", reason: "" });
  const store = getStore();
  const breakGlassAccounts = store.breakGlassAccounts || [];
  const impersonations = store.impersonations || [];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary btn-sm"><Siren className="h-3.5 w-3.5" /> Create Break Glass Account</button>
      </div>

      {showCreate && (
        <div className="card mb-6 p-5 border border-warning/30">
          <h3 className="font-semibold text-ink flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> New Break Glass Account</h3>
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            <div>
              <label className="text-xs font-medium text-muted">Name</label>
              <input className="input-field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input className="input-field mt-1 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Emergency Reason</label>
              <input className="input-field mt-1 w-full" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <button onClick={() => { identity.createBreakGlass(form.name, form.email, form.reason); setShowCreate(false); setForm({ name: "", email: "", reason: "" }); }} className="btn-primary btn-sm mt-4">Create Emergency Account</button>
        </div>
      )}

      {/* Break Glass Accounts */}
      <div className="space-y-3">
        <h3 className="font-semibold text-ink">Break Glass Accounts</h3>
        {breakGlassAccounts.length === 0 ? (
          <EmptyState icon={<Siren className="h-6 w-6" />} title="No break glass accounts" description="Emergency access accounts for critical situations." />
        ) : (
          breakGlassAccounts.map((bg: BreakGlassAccount) => (
            <div key={bg.id} className="card p-4 border border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{bg.name}</p>
                    <span className={cn("badge", bg.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{bg.active ? "Active" : "Used"}</span>
                  </div>
                  <p className="text-xs text-muted">{bg.email} · {bg.reason}</p>
                  <p className="text-xs text-muted">
                    Created {formatDateTime(bg.createdAt)} · Expires {formatDateTime(bg.expiresAt)}
                    {bg.usedAt && ` · Used ${formatDateTime(bg.usedAt)} by ${bg.usedBy}`}
                  </p>
                </div>
                {bg.active && (
                  <button onClick={() => identity.useBreakGlass(bg.id, identity.currentUser?.id || "system")} className="btn-ghost btn-sm text-warning">
                    <UnlockKeyhole className="h-3.5 w-3.5" /> Use
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Impersonation */}
      <div className="mt-8 space-y-3">
        <h3 className="font-semibold text-ink">Impersonation</h3>
        <div className="card p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted">Target User</label>
              <select className="input-field mt-1 w-full" value={impersonateForm.targetId} onChange={(e) => setImpersonateForm({ ...impersonateForm, targetId: e.target.value })}>
                <option value="">Select user</option>
                {identity.users.filter((u) => u.id !== identity.currentUser?.id).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted">Reason</label>
              <input className="input-field mt-1 w-full" value={impersonateForm.reason} onChange={(e) => setImpersonateForm({ ...impersonateForm, reason: e.target.value })} placeholder="e.g. Debugging user issue" />
            </div>
            <button
              onClick={() => { identity.startImpersonating(identity.currentUser?.id || "", impersonateForm.targetId, impersonateForm.reason); }}
              className="btn-ghost btn-sm text-warning"
              disabled={!impersonateForm.targetId || !impersonateForm.reason}
            >
              <Eye className="h-3.5 w-3.5" /> Start Impersonation
            </button>
          </div>
        </div>

        {impersonations.length > 0 && (
          <div className="space-y-2">
            {impersonations.map((imp: ImpersonationLog) => (
              <div key={imp.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{imp.impersonatorName} → {imp.targetName}</p>
                    <p className="text-xs text-muted">Reason: {imp.reason}</p>
                    <p className="text-xs text-muted">Started: {formatDateTime(imp.startedAt)}{imp.endedAt && ` · Ended: ${formatDateTime(imp.endedAt)}`}</p>
                  </div>
                  {!imp.endedAt && (
                    <button onClick={() => identity.stopImpersonating(imp.id)} className="btn-ghost btn-sm text-danger"><Ban className="h-3.5 w-3.5" /> Stop</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SECURITY SETTINGS TAB                                              */
/* ================================================================== */

function SecuritySettingsTab() {
  const identity = useIdentity();
  const settingsStore = getStore();
  const [passwordPolicy, setPasswordPolicy] = useState({ minLength: 10, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecial: true });
  const [sessionTtl, setSessionTtl] = useState(8);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [lockoutMs, setLockoutMs] = useState(30);
  const [maxSessions, setMaxSessions] = useState(10);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Password Policy Settings */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><KeyRound className="h-4 w-4 text-accent" /> Password Policy</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Minimum length</span>
            <input className="input-field w-20 text-center" type="number" value={passwordPolicy.minLength} onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: Number(e.target.value) })} />
          </div>
          {(["Uppercase", "Lowercase", "Numbers", "Special characters"] as const).map((label) => {
            const key = `require${label === "Special characters" ? "Special" : label}` as "requireUppercase" | "requireLowercase" | "requireNumbers" | "requireSpecial";
            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted">{label}</span>
                <input type="checkbox" checked={passwordPolicy[key]} onChange={(e) => setPasswordPolicy({ ...passwordPolicy, [key]: e.target.checked })} className="rounded border-line" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Settings */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Monitor className="h-4 w-4 text-accent" /> Session & Lockout Settings</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Session TTL (hours)</span>
            <input className="input-field w-20 text-center" type="number" value={sessionTtl} onChange={(e) => setSessionTtl(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Max failed attempts</span>
            <input className="input-field w-20 text-center" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Lockout duration (seconds)</span>
            <input className="input-field w-20 text-center" type="number" value={lockoutMs} onChange={(e) => setLockoutMs(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Max sessions per user</span>
            <input className="input-field w-20 text-center" type="number" value={maxSessions} onChange={(e) => setMaxSessions(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Active Security Features */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Shield className="h-4 w-4 text-accent" /> Active Security Features</h3>
        <div className="mt-4 space-y-2">
          {[
            ["PBKDF2 Password Hashing", "100k iterations + salt", true],
            ["Brute Force Protection", `${maxAttempts} attempts → lockout`, true],
            ["CSRF Protection", "Per-session tokens", true],
            ["MFA (TOTP)", `${identity.analytics.mfaEnabled} users enrolled`, identity.analytics.mfaEnabled > 0],
            ["Session Fingerprinting", "Device, browser, location", true],
            ["Zero Trust Policies", `${identity.zeroTrustPolicies.length} active`, identity.zeroTrustPolicies.length > 0],
            ["Break Glass Accounts", `${settingsStore.breakGlassAccounts?.length || 0} configured`, (settingsStore.breakGlassAccounts?.length || 0) > 0],
            ["Impersonation Audit", "Full trail with reason", true],
            ["Event Audit Log", `${identity.analytics.totalEvents} events`, identity.analytics.totalEvents > 0],
            ["Compliance Reports", "CSV export available", true],
          ].map(([feature, detail, active]) => (
            <div key={feature as string} className="flex items-center justify-between rounded-lg border border-line p-3">
              <div>
                <p className="text-sm font-medium text-ink">{feature as string}</p>
                <p className="text-xs text-muted">{detail as string}</p>
              </div>
              {active ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-muted" />}
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Globe className="h-4 w-4 text-accent" /> Identity Integrations</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-line p-3">
            <p className="font-medium text-ink">API Authentication</p>
            <p className="text-xs text-muted">JWT · Refresh Tokens · API Keys · Service Accounts</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="font-medium text-ink">Authentication Methods</p>
            <p className="text-xs text-muted">Password · Magic Links · OAuth2 · SAML · Passkeys · WebAuthn</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="font-medium text-ink">Authorization</p>
            <p className="text-xs text-muted">RBAC · ABAC · Permission Groups · Role Templates · Hierarchical</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="font-medium text-ink">Integrations</p>
            <p className="text-xs text-muted">Identity Providers · SAML Federation · OIDC · LDAP Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}


