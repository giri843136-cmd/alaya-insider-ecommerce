import { useState } from "react";
import { ShieldCheck, ShieldAlert, Activity, Lock, Users, AlertTriangle, CheckCircle2, XCircle, Fingerprint, Smartphone, Monitor, MapPin, Clock, KeyRound, Ban, Power } from "lucide-react";
import { useSecurity } from "../../context/SecurityContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { passwordStrength, validatePassword, detectInjection, type PasswordPolicy } from "../../lib/security";
import { cn } from "@/utils/cn";

const TYPE_TONE: Record<string, string> = {
  login: "bg-success/15 text-success",
  logout: "bg-surface2 text-muted",
  failed_login: "bg-danger/15 text-danger",
  permission_change: "bg-warning/15 text-warning",
  suspicious: "bg-danger/15 text-danger",
  lockdown: "bg-danger/15 text-danger",
  backup: "bg-accent-soft text-accent",
  export: "bg-accent-soft text-accent",
  config: "bg-accent-soft text-accent",
};

export default function AdminSecurity() {
  const { events, sessions, csrfToken, terminateSession, terminateAll } = useSecurity();
  const [tab, setTab] = useState<"dashboard" | "sessions" | "events" | "policies" | "tools">("dashboard");

  const failedLogins = events.filter((e) => e.type === "failed_login").length;
  const suspicious = events.filter((e) => e.type === "suspicious" || e.type === "lockdown").length;
  const activeSessions = sessions.length;

  const STATS = [
    { label: "Security status", value: suspicious > 0 ? "Alert" : "Protected", sub: suspicious > 0 ? `${suspicious} alerts` : "All systems nominal", icon: ShieldCheck, tone: suspicious > 0 ? "danger" : "success" },
    { label: "Failed logins", value: String(failedLogins), sub: "Brute-force protected", icon: ShieldAlert, tone: failedLogins > 5 ? "warning" : "accent" },
    { label: "Active sessions", value: String(activeSessions), sub: "Tracked & managed", icon: Users, tone: "accent" },
    { label: "SSL / encryption", value: "Active", sub: "PBKDF2 hashing", icon: Lock, tone: "success" },
  ];

  return (
    <>
      <Seo title="Security" path="/admin/security" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Security Center</h1>
            <p className="mt-1 text-sm text-muted">Authentication, sessions, audit & threat monitoring.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["dashboard", "Dashboard"], ["sessions", "Sessions"], ["events", "Audit log"], ["policies", "Policies"], ["tools", "Testing"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize", tab === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.tone === "success" ? "bg-success/15 text-success" : s.tone === "danger" ? "bg-danger/15 text-danger" : s.tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}><s.icon className="h-5 w-5" /></span>
                    <span className={cn("h-2 w-2 rounded-full", s.tone === "success" ? "bg-success" : s.tone === "danger" ? "bg-danger" : "bg-accent")} />
                  </div>
                  <p className="mt-4 font-display text-xl font-semibold text-ink">{s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-4 w-4 text-accent" /> Security framework (inherited by all features)</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {[
                    "PBKDF2 password hashing (100k iterations, salted)",
                    "Brute-force lockout (5 attempts → 30s)",
                    "CSRF token per session",
                    "Input sanitization + injection detection",
                    "XSS escaping on all dynamic output",
                    "Upload validation (type/size/executables)",
                    "Audit logging on every mutation",
                    "Session fingerprinting (device/browser/OS)",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-muted"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-accent" /> Architecture-ready</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {["JWT / OAuth / Social login", "TOTP 2FA + backup codes", "IP allow / block lists", "Emergency lockdown mode", "Webhook signature verification", "Virus scan on uploads", "Encrypted backups", "Consent & privacy request workflows"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-muted"><Clock className="h-4 w-4 shrink-0 text-accent" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* SESSIONS */}
        {tab === "sessions" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{sessions.length} active session(s)</p>
              {sessions.length > 0 && <button onClick={terminateAll} className="btn btn-sm border border-danger/40 text-danger hover:bg-danger/10"><Power className="h-3.5 w-3.5" /> Terminate all</button>}
            </div>
            {sessions.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Users className="h-6 w-6" />} title="No active sessions" description="Sign in to register a tracked session." /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                      {s.fp.platform === "iOS" || s.fp.platform === "Android" ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{s.actor}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                        <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {s.fp.browser} · {s.fp.platform}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.fp.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(s.loginAt)}</span>
                      </p>
                    </div>
                    <button onClick={() => terminateSession(s.id)} className="btn-ghost btn-sm text-danger hover:bg-danger/10">Terminate</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG */}
        {tab === "events" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{events.length} security events recorded</p>
            <div className="card mt-4 overflow-hidden">
              {events.length === 0 ? (
                <div className="p-8"><EmptyState icon={<Activity className="h-6 w-6" />} title="No security events yet" /></div>
              ) : (
                <ul className="divide-y divide-line">
                  {events.slice(0, 50).map((e) => (
                    <li key={e.id} className="flex items-center gap-4 px-4 py-3">
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", TYPE_TONE[e.type] || "bg-surface2 text-muted")}>
                        {e.type === "login" || e.type === "backup" ? <CheckCircle2 className="h-4 w-4" /> : e.type === "failed_login" || e.type === "suspicious" ? <XCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{e.detail}</p>
                        <p className="text-xs text-muted">{e.actor} · {formatDateTime(e.ts)}</p>
                      </div>
                      <span className={cn("badge capitalize", TYPE_TONE[e.type] || "bg-surface2 text-muted")}>{e.type.replace("_", " ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* POLICIES */}
        {tab === "policies" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><KeyRound className="h-4 w-4 text-accent" /> Password policy</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[["Minimum length", "10 characters"], ["Uppercase", "Required"], ["Lowercase", "Required"], ["Numbers", "Required"], ["Special characters", "Required"], ["Hashing", "PBKDF2 100k + salt"]].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between"><span className="text-muted">{k}</span><span className="font-medium text-ink">{v}</span></li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Ban className="h-4 w-4 text-accent" /> Session & lockout rules</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {([
                  ["Session timeout", "8 hours"],
                  ["Max failed attempts", "5"],
                  ["Lockout duration", "30 seconds"],
                  ["Concurrent sessions", "Controlled"],
                  ["CSRF token", `${csrfToken.slice(0, 12)}…`],
                ] as [string, string][]).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between"><span className="text-muted">{k}</span><span className="font-mono text-xs font-medium text-ink">{v}</span></li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TESTING TOOLS */}
        {tab === "tools" && <SecurityTesting />}
      </div>
    </>
  );
}

/** Live interactive security testing tools. */
function SecurityTesting() {
  const [pwd, setPwd] = useState("");
  const [input, setInput] = useState("");
  const strength = passwordStrength(pwd);
  const policy: PasswordPolicy = { minLength: 10, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecial: true };
  const pwdCheck = validatePassword(pwd, policy);
  const injCheck = detectInjection(input);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><KeyRound className="h-4 w-4 text-accent" /> Password strength tester</h3>
        <input className="input-field mt-4" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Type a password…" />
        <div className="mt-3 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= strength.score ? strength.score <= 1 ? "bg-danger" : strength.score === 2 ? "bg-warning" : strength.score === 3 ? "bg-accent" : "bg-success" : "bg-surface2")} />
          ))}
        </div>
        <p className="mt-2 text-sm font-medium text-ink">{strength.label}</p>
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs", pwdCheck.valid ? "text-success" : "text-danger")}>
          {pwdCheck.valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {pwd ? pwdCheck.message || "Meets all policy requirements" : "Enter a password to test"}
        </p>
      </div>

      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><ShieldAlert className="h-4 w-4 text-accent" /> Input injection tester</h3>
        <input className="input-field mt-4" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try: ' OR 1=1 -- or <script>" />
        <p className={cn("mt-3 flex items-center gap-1.5 text-xs", input && !injCheck.valid ? "text-danger" : "text-success")}>
          {injCheck.valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {input ? (injCheck.valid ? "Input is clean — no threats detected" : injCheck.message || "Threat detected") : "Enter a payload to test detection"}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["' OR 1=1 --", "<script>alert(1)</script>", "../../../etc/passwd", "normal text"].map((t) => (
            <button key={t} onClick={() => setInput(t)} className="chip">{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
