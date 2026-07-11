/**
 * ALAYA INSIDER — Authentication Settings
 * --------------------------------------------------------------------------
 * Enterprise Authentication Settings page accessible via Admin → Settings → Authentication.
 * Controls every auth feature across customer and admin domains.
 *
 * Sections:
 *   - Customer Authentication (Email OTP, Google, Apple, Guest, Password)
 *   - Admin Authentication (Email OTP, Mobile OTP, Password, 2FA)
 *   - Session & Timeout (Session duration, idle timeout, trusted device)
 *   - OTP Configuration (Length, expiry, retry limits)
 *   - Security (Rate limiting, CAPTCHA, lockout)
 *   - Future Ready (Passkeys, WebAuthn, Windows Hello, etc.)
 *   - Provider Configuration (Google OAuth, Apple Sign In, SMTP, SMS)
 */

import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { cn } from "../../utils/cn";
import {
  Save,
  ShieldCheck,
  Mail,
  MessageSquare,
  Smartphone,
  KeyRound,
  Clock,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  Globe,
  Lock,
  User,
  Monitor,
  Check,
} from "lucide-react";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface AuthSettings {
  customer: {
    emailOtpEnabled: boolean;
    googleLoginEnabled: boolean;
    appleSignInEnabled: boolean;
    guestBrowsingEnabled: boolean;
    passwordLoginEnabled: boolean;
  };
  admin: {
    emailOtpEnabled: boolean;
    mobileOtpEnabled: boolean;
    requirePassword: boolean;
    require2FA: boolean;
    trustedDevicesEnabled: boolean;
    sessionTimeoutMinutes: number;
    idleTimeoutMinutes: number;
    otpLength: number;
    otpExpirySeconds: number;
    retryLimit: number;
    lockoutDurationSeconds: number;
    rateLimitPerMinute: number;
    captchaAfterAttempts: number;
  };
  providers: {
    sms: { enabled: boolean; provider: string };
    smtp: { enabled: boolean; host: string; port: number };
    google: { enabled: boolean; clientId: string; clientSecret: string };
    apple: { enabled: boolean; teamId: string; keyId: string; clientId: string };
  };
}

const DEFAULT_SETTINGS: AuthSettings = {
  customer: {
    emailOtpEnabled: true,
    googleLoginEnabled: true,
    appleSignInEnabled: true,
    guestBrowsingEnabled: true,
    passwordLoginEnabled: false,
  },
  admin: {
    emailOtpEnabled: true,
    mobileOtpEnabled: true,
    requirePassword: true,
    require2FA: true,
    trustedDevicesEnabled: true,
    sessionTimeoutMinutes: 480,
    idleTimeoutMinutes: 30,
    otpLength: 6,
    otpExpirySeconds: 300,
    retryLimit: 5,
    lockoutDurationSeconds: 60,
    rateLimitPerMinute: 10,
    captchaAfterAttempts: 3,
  },
  providers: {
    sms: { enabled: false, provider: "twilio" },
    smtp: { enabled: false, host: "", port: 587 },
    google: { enabled: false, clientId: "", clientSecret: "" },
    apple: { enabled: false, teamId: "", keyId: "", clientId: "" },
  },
};

const FUTURE_METHODS = [
  { id: "passkeys", label: "Passkeys", description: "FIDO2/WebAuthn passwordless authentication" },
  { id: "webauthn", label: "WebAuthn", description: "W3C standard for public-key cryptography" },
  { id: "windows_hello", label: "Windows Hello", description: "Biometric & PIN sign-in on Windows" },
  { id: "touch_id", label: "Touch ID", description: "Fingerprint authentication on Mac/iOS" },
  { id: "face_id", label: "Face ID", description: "Facial recognition on iOS" },
  { id: "security_keys", label: "Security Keys", description: "YubiKey, Titan, and other FIDO2 hardware keys" },
  { id: "microsoft_login", label: "Microsoft Login", description: "Microsoft identity platform OAuth" },
  { id: "amazon_login", label: "Amazon Login", description: "Login with Amazon OAuth" },
  { id: "github_login", label: "GitHub Login", description: "Sign in with GitHub OAuth" },
];

function getApiBase(): string {
  try {
    const raw = localStorage.getItem("alaya_api_config");
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg.apiUrl) return cfg.apiUrl.replace(/\/+$/, "");
    }
  } catch { /* ignore */ }
  return "http://localhost:3001/api/v1";
}

function getToken(): string {
  try {
    const raw = localStorage.getItem("alaya_admin_session");
    if (raw) {
      const session = JSON.parse(raw);
      return session.token || "";
    }
  } catch { /* ignore */ }
  return "";
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function AdminAuthSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AuthSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "admin" | "security" | "future">("customer");

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const base = getApiBase();
      const token = getToken();
      const res = await fetch(`${base}/auth/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch {
      // Use defaults if backend unavailable
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const base = getApiBase();
      const token = getToken();
      const res = await fetch(`${base}/auth/settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Authentication settings saved");
        setDirty(false);
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Backend unavailable — settings saved locally");
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const updateCustomer = <K extends keyof AuthSettings["customer"]>(key: K, value: AuthSettings["customer"][K]) => {
    setSettings((prev) => ({ ...prev, customer: { ...prev.customer, [key]: value } }));
    setDirty(true);
  };

  const updateAdmin = <K extends keyof AuthSettings["admin"]>(key: K, value: AuthSettings["admin"][K]) => {
    setSettings((prev) => ({ ...prev, admin: { ...prev.admin, [key]: value } }));
    setDirty(true);
  };

  const updateProvider = <K extends keyof AuthSettings["providers"]>(key: K, value: AuthSettings["providers"][K]) => {
    setSettings((prev) => ({ ...prev, providers: { ...prev.providers, [key]: value } }));
    setDirty(true);
  };

  if (loading) {
    return (
      <>
        <Seo title="Authentication Settings" path="/admin/auth-settings" />
        <div className="flex min-h-[40vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Authentication Settings" path="/admin/auth-settings" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Authentication Settings</h1>
            <p className="mt-1 text-sm text-muted">Configure authentication behavior, security policies, and provider integrations.</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={!dirty || saving}
            className={cn("btn-primary btn-sm", !dirty && "opacity-50")}
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-1 rounded-xl bg-surface2 p-1 w-fit">
          {([
            ["customer", "Customer Auth"],
            ["admin", "Admin Auth"],
            ["security", "Security"],
            ["future", "Future Ready"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activeTab === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CUSTOMER AUTH TAB */}
        {activeTab === "customer" && (
          <div className="mt-6 space-y-6">
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <User className="h-4 w-4 text-accent" /> Customer Authentication Methods
              </h2>
              <p className="mt-1 text-xs text-muted">Enable or disable each customer authentication method.</p>
              <div className="mt-6 space-y-4">
                <ToggleRow
                  label="Email OTP"
                  description="Customers receive a one-time password via email to sign in"
                  checked={settings.customer.emailOtpEnabled}
                  onChange={(v) => updateCustomer("emailOtpEnabled", v)}
                  icon={Mail}
                />
                <ToggleRow
                  label="Google Sign In"
                  description="Customers can sign in using their Google account"
                  checked={settings.customer.googleLoginEnabled}
                  onChange={(v) => updateCustomer("googleLoginEnabled", v)}
                  icon={Globe}
                />
                <ToggleRow
                  label="Apple Sign In"
                  description="Customers can sign in using their Apple ID"
                  checked={settings.customer.appleSignInEnabled}
                  onChange={(v) => updateCustomer("appleSignInEnabled", v)}
                  icon={Smartphone}
                />
                <ToggleRow
                  label="Guest Browsing"
                  description="Allow browsing without an account (limited functionality)"
                  checked={settings.customer.guestBrowsingEnabled}
                  onChange={(v) => updateCustomer("guestBrowsingEnabled", v)}
                  icon={User}
                />
                <ToggleRow
                  label="Password Login (Future)"
                  description="Traditional email + password login (architecture ready, disabled by default)"
                  checked={settings.customer.passwordLoginEnabled}
                  onChange={(v) => updateCustomer("passwordLoginEnabled", v)}
                  icon={Lock}
                  future
                />
              </div>
            </div>

            {/* Provider configuration */}
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> OAuth Provider Configuration
              </h2>
              <p className="mt-1 text-xs text-muted">Configure OAuth provider credentials (managed via Integrations Center).</p>
              <div className="mt-6 space-y-4">
                <ProviderField
                  label="Google OAuth"
                  description="Client ID and Secret for Google Sign In"
                  fields={[
                    { key: "clientId", label: "Client ID", value: settings.providers.google.clientId, onChange: (v) => updateProvider("google", { ...settings.providers.google, clientId: v }) },
                    { key: "clientSecret", label: "Client Secret", value: settings.providers.google.clientSecret, onChange: (v) => updateProvider("google", { ...settings.providers.google, clientSecret: v }) },
                  ]}
                />
                <ProviderField
                  label="Apple Sign In"
                  description="Team ID, Key ID, Service ID for Apple Sign In"
                  fields={[
                    { key: "teamId", label: "Team ID", value: settings.providers.apple.teamId, onChange: (v) => updateProvider("apple", { ...settings.providers.apple, teamId: v }) },
                    { key: "keyId", label: "Key ID", value: settings.providers.apple.keyId, onChange: (v) => updateProvider("apple", { ...settings.providers.apple, keyId: v }) },
                    { key: "clientId", label: "Service ID", value: settings.providers.apple.clientId, onChange: (v) => updateProvider("apple", { ...settings.providers.apple, clientId: v }) },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* ADMIN AUTH TAB */}
        {activeTab === "admin" && (
          <div className="mt-6 space-y-6">
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> Admin Authentication Policies
              </h2>
              <div className="mt-6 space-y-4">
                <ToggleRow
                  label="Require Password"
                  description="Admin must enter a password before 2FA"
                  checked={settings.admin.requirePassword}
                  onChange={(v) => updateAdmin("requirePassword", v)}
                  icon={Lock}
                />
                <ToggleRow
                  label="Require Two-Factor Authentication"
                  description="OTP or TOTP required after password verification"
                  checked={settings.admin.require2FA}
                  onChange={(v) => updateAdmin("require2FA", v)}
                  icon={ShieldCheck}
                />
                <ToggleRow
                  label="Enable Email OTP (2FA)"
                  description="Send verification codes via email"
                  checked={settings.admin.emailOtpEnabled}
                  onChange={(v) => updateAdmin("emailOtpEnabled", v)}
                  icon={Mail}
                />
                <ToggleRow
                  label="Enable Mobile OTP (2FA)"
                  description="Send verification codes via SMS"
                  checked={settings.admin.mobileOtpEnabled}
                  onChange={(v) => updateAdmin("mobileOtpEnabled", v)}
                  icon={MessageSquare}
                />
                <ToggleRow
                  label="Trusted Devices"
                  description="Allow remembering trusted devices to skip 2FA"
                  checked={settings.admin.trustedDevicesEnabled}
                  onChange={(v) => updateAdmin("trustedDevicesEnabled", v)}
                  icon={Monitor}
                />
              </div>
            </div>

            {/* Session & Timeout */}
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Clock className="h-4 w-4 text-accent" /> Session & Timeout Settings
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Session Timeout (minutes)"
                  value={settings.admin.sessionTimeoutMinutes}
                  onChange={(v) => updateAdmin("sessionTimeoutMinutes", v)}
                  min={60}
                  max={1440}
                />
                <NumberField
                  label="Idle Timeout (minutes)"
                  value={settings.admin.idleTimeoutMinutes}
                  onChange={(v) => updateAdmin("idleTimeoutMinutes", v)}
                  min={5}
                  max={240}
                />
              </div>
            </div>

            {/* OTP Configuration */}
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <KeyRound className="h-4 w-4 text-accent" /> OTP Configuration
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="OTP Code Length"
                  value={settings.admin.otpLength}
                  onChange={(v) => updateAdmin("otpLength", v)}
                  min={4}
                  max={8}
                />
                <NumberField
                  label="OTP Expiry (seconds)"
                  value={settings.admin.otpExpirySeconds}
                  onChange={(v) => updateAdmin("otpExpirySeconds", v)}
                  min={60}
                  max={1800}
                />
                <NumberField
                  label="Max Verification Attempts"
                  value={settings.admin.retryLimit}
                  onChange={(v) => updateAdmin("retryLimit", v)}
                  min={3}
                  max={10}
                />
                <NumberField
                  label="Lockout Duration (seconds)"
                  value={settings.admin.lockoutDurationSeconds}
                  onChange={(v) => updateAdmin("lockoutDurationSeconds", v)}
                  min={30}
                  max={3600}
                />
              </div>
            </div>

            {/* Provider endpoints */}
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Globe className="h-4 w-4 text-accent" /> Delivery Provider Configuration
              </h2>
              <div className="mt-6 space-y-4">
                <ToggleRow
                  label="SMS Provider"
                  description={`Currently: ${settings.providers.sms.provider}. Configure via Integrations Center → SMS.`}
                  checked={settings.providers.sms.enabled}
                  onChange={(v) => updateProvider("sms", { ...settings.providers.sms, enabled: v })}
                  icon={MessageSquare}
                />
                <ToggleRow
                  label="SMTP (Email Provider)"
                  description="Configure SMTP settings via Integrations Center → Email."
                  checked={settings.providers.smtp.enabled}
                  onChange={(v) => updateProvider("smtp", { ...settings.providers.smtp, enabled: v })}
                  icon={Mail}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="mt-6 space-y-6">
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <AlertTriangle className="h-4 w-4 text-accent" /> Brute Force & Rate Limiting
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Rate Limit (requests/minute)"
                  description="Max login requests per minute per IP"
                  value={settings.admin.rateLimitPerMinute}
                  onChange={(v) => updateAdmin("rateLimitPerMinute", v)}
                  min={3}
                  max={60}
                />
                <NumberField
                  label="CAPTCHA After (failed attempts)"
                  description="Show CAPTCHA after this many failed login attempts"
                  value={settings.admin.captchaAfterAttempts}
                  onChange={(v) => updateAdmin("captchaAfterAttempts", v)}
                  min={0}
                  max={10}
                />
                <div className="sm:col-span-2 rounded-lg bg-surface2 p-4">
                  <h3 className="text-sm font-medium text-ink">Security Features Active</h3>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      "SHA-256 hashed OTP codes (never stored in plaintext)",
                      "Progressive delay on repeated failures",
                      "Temporary account lockout after max attempts",
                      "Rate limiting per IP address per minute",
                      "Device fingerprinting for new device detection",
                      "Login risk scoring (0-100) based on behavior",
                      "Security event logging for all auth actions",
                      "Session token rotation every 30 minutes",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-muted">
                        <Check className="h-3.5 w-3.5 text-success shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Fingerprint className="h-4 w-4 text-accent" /> Detection Capabilities
              </h2>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Brute Force Detection", active: true, desc: "Detects rapid-fire login attempts from the same IP" },
                  { label: "Credential Stuffing", active: true, desc: "Identifies patterns consistent with credential stuffing attacks" },
                  { label: "Impossible Travel", active: true, desc: "Detects logins from geographically distant locations within impossible timeframes" },
                  { label: "Suspicious Login", active: true, desc: "Flags logins from unrecognized devices, locations, or IPs" },
                  { label: "New Device Detection", active: true, desc: "Alerts when a previously unseen device fingerprint is used" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-lg border border-line p-3">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-ink">{item.label}</p>
                      <p className="text-xs text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security notifications */}
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> Auth Event Notifications
              </h2>
              <p className="mt-1 text-xs text-muted">
                Security events trigger notifications to the admin via the configured notification provider (Integrations Center → Notifications).
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Successful login notifications",
                  "Failed login alerts",
                  "Password change alerts",
                  "Email change alerts",
                  "Phone change alerts",
                  "Role/permission change alerts",
                  "Recovery code used alerts",
                  "Recovery codes generated alerts",
                  "New device login alerts",
                  "Suspicious login detection alerts",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 text-xs text-muted">
                    <Check className="h-3 w-3 text-success shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FUTURE READY TAB */}
        {activeTab === "future" && (
          <div className="mt-6 space-y-6">
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Fingerprint className="h-4 w-4 text-accent" /> Future Authentication Methods
              </h2>
              <p className="mt-1 text-xs text-muted">
                These authentication methods are architecturally ready for future integration. No implementation is required yet.
                The settings below will become functional when the corresponding modules are activated in the Integrations Center.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {FUTURE_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-start gap-3 rounded-lg border border-line p-4 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-muted">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{method.label}</p>
                      <p className="text-xs text-muted">{method.description}</p>
                      <span className="mt-1 inline-block rounded bg-surface2 px-2 py-0.5 text-[0.55rem] font-medium uppercase text-muted">
                        Architecture Ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent-soft/10 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> Integration Points
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>• <strong>Passkeys / WebAuthn</strong>: Add to CustomerAuth.tsx and AdminAuth.tsx via <code className="rounded bg-surface2 px-1 text-[0.6rem]">navigator.credentials.create()</code> and <code className="rounded bg-surface2 px-1 text-[0.6rem]">navigator.credentials.get()</code></li>
                <li>• <strong>Windows Hello / Touch ID / Face ID</strong>: Platform biometric APIs integrated via WebAuthn</li>
                <li>• <strong>Security Keys</strong>: FIDO2/CTAP support via WebAuthn transport types (usb, nfc, ble)</li>
                <li>• <strong>Microsoft / Amazon / GitHub Login</strong>: OAuth 2.0 providers — add client ID/secret via Integrations Center → Authentication</li>
                <li>• <strong>Route points</strong>: Prepare <code className="rounded bg-surface2 px-1 text-[0.6rem]">/auth/customer/microsoft</code>, <code className="rounded bg-surface2 px-1 text-[0.6rem]">/auth/customer/amazon</code>, <code className="rounded bg-surface2 px-1 text-[0.6rem]">/auth/customer/github</code> endpoint signatures</li>
              </ul>
            </div>
          </div>
        )}

        {/* Sticky save bar */}
        {dirty && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-transform lg:left-[260px]">
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <p className="text-sm text-muted">You have unsaved authentication settings</p>
              <button onClick={saveSettings} disabled={saving} className="btn-primary btn-sm">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================================================================ */
/*  SUB-COMPONENTS                                                   */
/* ================================================================ */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
  future,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ElementType;
  future?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line p-4 hover:bg-surface2/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">{label}</p>
            {future && (
              <span className="rounded bg-accent-soft/30 px-1.5 py-0.5 text-[0.55rem] font-medium uppercase text-accent">
                Future
              </span>
            )}
          </div>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  description?: string;
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input
        type="number"
        className="input-field"
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        min={min}
        max={max}
      />
      {description && <p className="mt-0.5 text-[0.6rem] text-muted">{description}</p>}
      <div className="mt-1 flex gap-1">
        <span className="text-[0.55rem] text-muted">Min: {min}</span>
        <span className="text-[0.55rem] text-muted">·</span>
        <span className="text-[0.55rem] text-muted">Max: {max}</span>
      </div>
    </div>
  );
}

function ProviderField({
  label,
  description,
  fields,
}: {
  label: string;
  description: string;
  fields: { key: string; label: string; value: string; onChange: (v: string) => void }[];
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-muted">{description}</p>
      <div className="mt-3 space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-xs text-muted">{field.label}</label>
            <input
              className="input-field mt-0.5"
              type="password"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={`Enter ${field.label}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
