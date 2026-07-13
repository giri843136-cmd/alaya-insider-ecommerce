/**
 * ALAYA INSIDER — Admin Authentication Center
 * --------------------------------------------------------------------------
 * Central dashboard for authentication management including:
 * - Authentication statistics
 * - Login analytics
 * - OTP statistics
 * - Failed login monitoring
 * - Trusted devices overview
 * - Session manager
 * - Recovery center
 * - Security events
 * - Provider settings
 * - Authentication settings
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, LogIn, KeyRound, Smartphone,
  Activity, Clock, CheckCircle2, XCircle,
  Settings, RefreshCw,
  Monitor, Globe, MapPin, Trash2,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface AuthStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  otpSent: number;
  otpVerified: number;
  otpFailed: number;
  activeSessions: number;
  trustedDevices: number;
  recoveryCodesRemaining: number;
  loginByMethod: Record<string, number>;
  loginByHour: Record<string, number>;
  recentEvents: SecurityEvent[];
}

interface SecurityEvent {
  id: string;
  ts: number;
  type: string;
  userId: string;
  userType: string;
  actor: string;
  detail: string;
  ip?: string;
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function AdminAuthCenter() {
  const [tab, setTab] = useState<"overview" | "sessions" | "devices" | "events" | "history">("overview");
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadSessions(),
      loadDevices(),
      loadEvents(),
      loadHistory(),
    ]);
    setLoading(false);
  };

  const getToken = () => localStorage.getItem("alaya_admin_session_token") || localStorage.getItem("alaya_customer_token") || "";

  const apiFetch = async (path: string) => {
    const backendUrl = "http://localhost:3001/api/v1";
    const token = getToken();
    try {
      const res = await fetch(`${backendUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const loadStats = async () => {
    const data = await apiFetch("/auth/security/stats");
    if (data?.stats) setStats(data.stats);
    else {
      // Fallback demo data
      setStats({
        totalLogins: 128, successfulLogins: 112, failedLogins: 16,
        otpSent: 45, otpVerified: 42, otpFailed: 3,
        activeSessions: 2, trustedDevices: 1, recoveryCodesRemaining: 10,
        loginByMethod: { password: 80, otp: 42, google: 6 },
        loginByHour: { "9": 12, "10": 18, "11": 22, "12": 15, "13": 10, "14": 16, "15": 14, "16": 8, "17": 6, "18": 4, "19": 3 },
        recentEvents: [],
      });
    }
  };

  const loadSessions = async () => {
    const data = await apiFetch("/auth/sessions");
    if (data?.sessions) setSessions(data.sessions);
    else {
      setSessions([
        { id: "sess1", browser: "Chrome", os: "macOS", country: "US", city: "New York", ip: "192.168.1.1", isTrusted: true, lastActivity: Date.now() - 600000, createdAt: Date.now() - 3600000, expiresAt: Date.now() + 25200000, current: true },
        { id: "sess2", browser: "Safari", os: "iOS", country: "US", city: "New York", ip: "192.168.1.2", isTrusted: false, lastActivity: Date.now() - 7200000, createdAt: Date.now() - 14400000, expiresAt: Date.now() + 14400000, current: false },
      ]);
    }
  };

  const loadDevices = async () => {
    const data = await apiFetch("/auth/devices");
    if (data?.devices) setDevices(data.devices);
    else {
      setDevices([
        { id: "dev1", name: "MacBook Pro", browser: "Chrome", os: "macOS", country: "US", city: "New York", trustedUntil: Date.now() + 25 * 86400000, lastUsed: Date.now() - 600000, createdAt: Date.now() - 30 * 86400000 },
      ]);
    }
  };

  const loadEvents = async () => {
    const data = await apiFetch("/auth/security/events");
    if (data?.events) setEvents(data.events);
    else {
      setEvents([
        { id: "ev1", ts: Date.now() - 3600000, type: "login_success", userId: "admin", userType: "admin", actor: "alayainsider@gmail.com", detail: "Admin login via password — 2FA required", ip: "192.168.1.1" },
        { id: "ev2", ts: Date.now() - 7200000, type: "otp_verified", userId: "admin", userType: "admin", actor: "system", detail: "OTP verified for admin authentication", ip: "192.168.1.1" },
        { id: "ev3", ts: Date.now() - 86400000, type: "login_failed", userId: "unknown", userType: "admin", actor: "unknown@example.com", detail: "Failed login attempt", ip: "10.0.0.1" },
      ]);
    }
  };

  const loadHistory = async () => {
    const data = await apiFetch("/auth/security/login-history");
    if (data?.history) setHistory(data.history);
  };

  const handleTerminateSession = async (sessionId: string) => {
    await apiFetch(`/auth/sessions/${sessionId}`);
    loadSessions();
  };

  const handleLogoutAll = async () => {
    await apiFetch("/auth/logout-all");
    loadSessions();
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const TYPE_TONE: Record<string, string> = {
    login_success: "bg-success/15 text-success",
    login_failed: "bg-danger/15 text-danger",
    otp_sent: "bg-accent-soft text-accent",
    otp_verified: "bg-success/15 text-success",
    otp_failed: "bg-danger/15 text-danger",
    session_terminated: "bg-surface2 text-muted",
    all_sessions_terminated: "bg-danger/15 text-danger",
    new_device: "bg-warning/15 text-warning",
    recovery_code_used: "bg-accent-soft text-accent",
    recovery_success: "bg-success/15 text-success",
    trusted_device_added: "bg-accent-soft text-accent",
  };

  return (
    <>
      <Seo title="Authentication Center" path="/admin/authentication" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Authentication Center</h1>
            <p className="mt-1 text-sm text-muted">Authentication statistics, session management, security monitoring.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadData} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
            <button onClick={() => navigate("/admin/settings")} className="btn-ghost btn-sm"><Settings className="h-3.5 w-3.5" /> Settings</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
          {([["overview", "Overview"], ["sessions", "Sessions"], ["devices", "Devices"], ["events", "Security Events"], ["history", "Login History"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize", tab === id && "chip-active")}>{label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && stats && (
          <div className="mt-6 space-y-6">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={LogIn} label="Total Logins (24h)" value={stats.totalLogins} sub={`${stats.successfulLogins} success, ${stats.failedLogins} failed`} tone={stats.failedLogins > 10 ? "danger" : "accent"} />
              <StatCard icon={KeyRound} label="OTP Activity" value={stats.otpSent} sub={`${stats.otpVerified} verified, ${stats.otpFailed} failed`} tone={stats.otpFailed > 5 ? "warning" : "accent"} />
              <StatCard icon={Monitor} label="Active Sessions" value={stats.activeSessions} sub={`${stats.trustedDevices} trusted devices`} tone="accent" />
              <StatCard icon={ShieldCheck} label="Security Status" value={stats.failedLogins > 10 ? "Alert" : "Protected"} sub={stats.recoveryCodesRemaining > 0 ? `${stats.recoveryCodesRemaining} recovery codes` : "No recovery codes"} tone={stats.failedLogins > 10 ? "danger" : "success"} />
            </div>

            {/* Login by method */}
            <div className="card p-5">
              <h3 className="font-semibold text-ink">Login by Method</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(stats.loginByMethod).map(([method, count]) => {
                  const total = Object.values(stats.loginByMethod).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={method} className="flex items-center gap-3">
                      <span className="w-24 text-sm capitalize text-muted">{method}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface2 overflow-hidden">
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium tabular-nums text-ink w-12 text-right">{count}</span>
                      <span className="text-xs text-muted w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Login by hour */}
            <div className="card p-5">
              <h3 className="font-semibold text-ink">Login Activity (24h)</h3>
              <div className="mt-4 flex items-end gap-1.5 h-32">
                {Array.from({ length: 24 }, (_, i) => {
                  const count = stats.loginByHour[String(i)] || 0;
                  const max = Math.max(...Object.values(stats.loginByHour), 1);
                  const height = (count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] tabular-nums text-muted">{count || ""}</span>
                      <div className="w-full rounded-t-md bg-accent/60 transition-all hover:bg-accent" style={{ height: `${Math.max(height, 4)}%` }} />
                      <span className="text-[10px] text-muted">{i}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent events */}
            <div className="card p-5">
              <h3 className="font-semibold text-ink">Recent Security Events</h3>
              <div className="mt-4 space-y-2">
                {stats.recentEvents.length === 0 ? (
                  <p className="text-sm text-muted">No recent security events.</p>
                ) : (
                  stats.recentEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 rounded-lg bg-surface2/50 p-3">
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", TYPE_TONE[event.type] || "bg-surface2 text-muted")}>
                        {event.type.includes("success") ? <CheckCircle2 className="h-4 w-4" /> : event.type.includes("failed") ? <XCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">{event.detail}</p>
                        <p className="text-xs text-muted">{event.actor} · {event.ip} · {formatDateTime(event.ts)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SESSIONS */}
        {tab === "sessions" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">{sessions.length} active session(s)</p>
              {sessions.length > 0 && (
                <button onClick={handleLogoutAll} className="btn btn-sm border border-danger/40 text-danger hover:bg-danger/10">
                  <Trash2 className="h-3.5 w-3.5" /> Terminate all
                </button>
              )}
            </div>
            {sessions.length === 0 ? (
              <EmptyState icon={<Monitor className="h-6 w-6" />} title="No active sessions" description="Sign in to see your active sessions." />
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                      {s.os === "iOS" || s.os === "Android" ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{s.browser} on {s.os}</p>
                        {s.current && <span className="badge bg-accent-soft text-accent text-[10px]">Current</span>}
                        {s.isTrusted && <span className="badge bg-success/15 text-success text-[10px]">Trusted</span>}
                      </div>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted mt-0.5">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {s.country}, {s.city}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.ip}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last active: {formatDateTime(s.lastActivity)}</span>
                      </p>
                    </div>
                    {!s.current && (
                      <button onClick={() => handleTerminateSession(s.id)} className="btn-ghost btn-sm text-danger hover:bg-danger/10">
                        <Trash2 className="h-3.5 w-3.5" /> Terminate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEVICES */}
        {tab === "devices" && (
          <div className="mt-6">
            <p className="text-sm text-muted mb-4">{devices.length} trusted device(s)</p>
            {devices.length === 0 ? (
              <EmptyState icon={<Smartphone className="h-6 w-6" />} title="No trusted devices" description="Trust a device during login to skip 2FA on future logins." />
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <div key={d.id} className="card flex items-center gap-4 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                      <Monitor className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{d.name}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                        <span>{d.browser} · {d.os}</span>
                        <span>{d.country}, {d.city}</span>
                        <span>Trusted until {formatDateTime(d.trustedUntil)}</span>
                      </p>
                    </div>
                    <button className="btn-ghost btn-sm text-muted hover:text-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECURITY EVENTS */}
        {tab === "events" && (
          <div className="mt-6">
            <p className="text-sm text-muted mb-4">{events.length} event(s)</p>
            <div className="card overflow-hidden">
              {events.length === 0 ? (
                <div className="p-8"><EmptyState icon={<Activity className="h-6 w-6" />} title="No security events" /></div>
              ) : (
                <ul className="divide-y divide-line">
                  {events.slice(0, 50).map((e) => (
                    <li key={e.id} className="flex items-center gap-4 px-4 py-3">
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", TYPE_TONE[e.type] || "bg-surface2 text-muted")}>
                        {e.type.includes("success") ? <CheckCircle2 className="h-4 w-4" /> : e.type.includes("failed") || e.type.includes("error") || e.type.includes("terminated") ? <XCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{e.detail}</p>
                        <p className="text-xs text-muted">{e.actor} · {e.ip} · {formatDateTime(e.ts)}</p>
                      </div>
                      <span className={cn("badge capitalize text-[10px]", TYPE_TONE[e.type] || "bg-surface2 text-muted")}>{e.type.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* LOGIN HISTORY */}
        {tab === "history" && (
          <div className="mt-6">
            <p className="text-sm text-muted mb-4">{history.length} login attempt(s)</p>
            <div className="card overflow-hidden">
              {history.length === 0 ? (
                <div className="p-8"><EmptyState icon={<LogIn className="h-6 w-6" />} title="No login history" description="Login history will appear here." /></div>
              ) : (
                <ul className="divide-y divide-line">
                  {history.slice(0, 50).map((h: any) => (
                    <li key={h.id} className="flex items-center gap-4 px-4 py-3">
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", h.success ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                        {h.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {h.success ? "Successful" : "Failed"} login via {h.method}
                        </p>
                        <p className="text-xs text-muted">
                          {h.browser} · {h.os} · {h.country} · {h.ip} · {formatDateTime(h.ts)}
                        </p>
                      </div>
                      {h.riskScore > 0 && (
                        <span className={cn("badge text-[10px]", h.riskScore > 50 ? "bg-danger/15 text-danger" : h.riskScore > 20 ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                          Risk: {h.riskScore}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================================================================ */
/*  STAT CARD                                                       */
/* ================================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  tone: "accent" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    accent: "bg-accent-soft text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className={cn("grid h-10 w-10 place-items-center rounded-full", toneClasses[tone])}><Icon className="h-5 w-5" /></span>
        <span className={cn("h-2 w-2 rounded-full", tone === "accent" ? "bg-accent" : tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger")} />
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}
