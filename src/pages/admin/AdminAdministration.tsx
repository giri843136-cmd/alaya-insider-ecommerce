/**
 * ALAYA INSIDER — Administration (PART 3.6)
 * ------------------------------------------------------------------
 * User management, roles & permissions, feature flags, teams,
 * API keys overview, and platform configuration.
 */
import { useState } from "react";
import {
  Users, Shield, Flag, Check, X,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";
import {
  getAdminUsers, getAdminRoles, getFeatureFlags, updateAdminUser,
  updateFeatureFlag, type FeatureFlagStatus,
} from "../../lib/adminPortal";

type AdminView = "users" | "roles" | "flags";

export default function AdminAdministration() {
  const [view, setView] = useState<AdminView>("users");
  const [users, setUsers] = useState(getAdminUsers());
  const [roles, _] = useState(getAdminRoles());
  const [flags, setFlags] = useState(getFeatureFlags());

  const refresh = () => { setUsers(getAdminUsers()); setFlags(getFeatureFlags()); };

  const STATUS_OPTIONS: { value: FeatureFlagStatus; label: string; color: string }[] = [
    { value: "enabled", label: "Enabled", color: "bg-success/15 text-success" },
    { value: "beta", label: "Beta", color: "bg-info/15 text-info" },
    { value: "disabled", label: "Disabled", color: "bg-danger/15 text-danger" },
    { value: "deprecated", label: "Deprecated", color: "bg-warning/15 text-warning" },
  ];

  return (
    <>
      <Seo title="Administration" path="/admin/administration" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Administration</h1>
            <p className="mt-1 text-sm text-muted">Users, roles, permissions, feature flags, and platform management.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["users", "roles", "flags"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("btn-sm capitalize", view === v ? "btn-primary" : "btn-ghost")}>
              {v === "users" && <Users className="h-4 w-4" />}
              {v === "roles" && <Shield className="h-4 w-4" />}
              {v === "flags" && <Flag className="h-4 w-4" />}
              {v}
            </button>
          ))}
        </div>

        {view === "users" && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted">{users.length} administrator accounts</p>
            </div>
            {users.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="No admin users" description="Add your first administrator." />
            ) : (
              users.map((u) => (
                <div key={u.id} className="card flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{u.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{u.name}</p>
                        {!u.active && <Badge variant="neutral">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted">{u.email} · {u.role} · {u.department}</p>
                      {u.lastLogin && <p className="text-xs text-muted">Last login: {formatDateTime(u.lastLogin)}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => { updateAdminUser(u.id, { active: !u.active }); refresh(); }}
                    className={cn("grid h-8 w-8 place-items-center rounded-full", u.active ? "text-success hover:bg-success/10" : "text-muted hover:bg-surface2")}
                  >
                    {u.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {view === "roles" && (
          <div className="mt-6 space-y-3">
            {roles.length === 0 ? (
              <EmptyState icon={<Shield className="h-6 w-6" />} title="No roles defined" description="Create your first role." />
            ) : (
              roles.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{r.name}</h3>
                      <p className="text-xs text-muted">{r.description}</p>
                    </div>
                    <span className="text-xs text-muted">{r.userCount} users</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.permissions.slice(0, 6).map((p) => (
                      <code key={p} className="rounded bg-surface2 px-1.5 py-0.5 text-[0.55rem] font-mono text-muted">{p}</code>
                    ))}
                    {r.permissions.length > 6 && <span className="text-xs text-muted">+{r.permissions.length - 6}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "flags" && (
          <div className="mt-6 space-y-3">
            {flags.length === 0 ? (
              <EmptyState icon={<Flag className="h-6 w-6" />} title="No feature flags" description="Create your first feature flag." />
            ) : (
              flags.map((f) => {
                const statusObj = STATUS_OPTIONS.find((s) => s.value === f.status);
                const nextStatus = (current: FeatureFlagStatus): FeatureFlagStatus => {
                  const order: FeatureFlagStatus[] = ["disabled", "beta", "enabled", "deprecated"];
                  const idx = order.indexOf(current);
                  return order[(idx + 1) % order.length];
                };
                return (
                  <div key={f.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink">{f.name}</h3>
                          <code className="rounded bg-surface2 px-1.5 py-0.5 text-[0.55rem] font-mono text-muted">{f.key}</code>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{f.description}</p>
                      </div>
                      <button
                        onClick={() => { updateFeatureFlag(f.id, { status: nextStatus(f.status) }); refresh(); }}
                        className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors", statusObj?.color || "")}
                      >
                        {f.status === "enabled" ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        {statusObj?.label || f.status}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <span>{f.enabledPercent}% rollout</span>
                      {f.enabledFor.length > 0 && <span>· {f.enabledFor.length} specific users</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}
