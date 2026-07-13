/**
 * ALAYA INSIDER — Enterprise Integrations Center
 * --------------------------------------------------------------------------
 * Complete admin dashboard for configuring every third-party service.
 * Supports 16 modules with full health monitoring, credential security,
 * backup/restore, environment isolation, and RBAC.
 *
 * Security Hardening (Phase 2):
 *   - Health dashboard with health scores (0-100)
 *   - Health badges (green/amber/red) per integration
 *   - Credential expiry warnings and rotation reminders
 *   - Circuit breaker status display
 *   - Backup, restore, export, import via UI
 *   - Environment isolation selector per integration
 *   - RBAC-aware UI — only Super Admin sees credential operations
 *   - Provider documentation links
 *   - Enhanced audit logs with actor IP/device/country
 */

import { useState, useEffect, useCallback } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import {
  Settings as SettingsIcon,
  Shield,
  Mail,
  MessageSquare,
  Handshake,
  BarChart3,
  Search,
  Tags,
  Brain,
  Database,
  Globe,
  Cloud,
  MapPin,
  Bell,
  CreditCard,
  Code2,
  Trash2,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  History,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Clock,
  Download,
  Upload,
  AlertTriangle,
  Wifi,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { getApiConfig } from "../../lib/api-config";
import { cn } from "../../utils/cn";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

type IntegrationModule =
  | "authentication" | "email" | "sms" | "affiliate_networks"
  | "analytics" | "search_console" | "tag_manager" | "ai_providers"
  | "search_engines" | "storage" | "cdn" | "cloud_services"
  | "maps" | "notifications" | "payments" | "developer_apis";

type ConnectionStatus = "connected" | "disconnected" | "error" | "testing" | "unknown";
type CircuitBreakerState = "closed" | "open" | "half-open";

interface ProviderField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "toggle" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  maskInUI?: boolean;
}

interface ProviderDefinition {
  module: IntegrationModule;
  provider: string;
  label: string;
  fields: ProviderField[];
  docsUrl?: string;
}

interface IntegrationConfig {
  id: string;
  module: IntegrationModule;
  provider: string;
  label: string;
  enabled: boolean;
  environment: string;
  settings: Record<string, string>;
  connectionStatus: ConnectionStatus;
  lastTestedAt?: number;
  lastError?: string;
  lastErrorAt?: number;
  lastSyncAt?: number;
  metadata?: {
    healthScore?: number;
    averageLatency?: number;
    lastSuccessAt?: number;
    expiresAt?: number;
    rotationReminderAt?: number;
    circuitBreakerState?: CircuitBreakerState;
    totalSuccessTests?: number;
    totalFailedTests?: number;
    credentialVersions?: { version: number; rotatedAt: number; rotatedBy: string }[];
  };
  createdAt: number;
  updatedAt: number;
  version: number;
}

interface IntegrationLog {
  id: string;
  integrationId: string;
  type: string;
  status: "success" | "failure" | "info";
  message: string;
  details?: string;
  actor: string;
  actorRole?: string;
  actorIp?: string;
  actorDevice?: string;
  actorCountry?: string;
  ts: number;
}

interface IntegrationStats {
  totalIntegrations: number;
  enabledCount: number;
  connectedCount: number;
  errorCount: number;
  credentialExpiringCount: number;
  circuitBreakerOpenCount: number;
  recentLogs: IntegrationLog[];
  byModule: Record<string, number>;
  byEnvironment: Record<string, number>;
  healthSummary: {
    averageHealthScore: number;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
  };
}

interface HealthCheckResult {
  id: string;
  provider: string;
  label: string;
  module: IntegrationModule;
  environment: string;
  enabled: boolean;
  connectionStatus: ConnectionStatus;
  healthScore: number;
  averageLatency?: number;
  lastTestedAt?: number;
  lastSuccessAt?: number;
  lastError?: string;
  lastErrorAt?: number;
  circuitBreakerState?: CircuitBreakerState;
  expiresAt?: number;
  credentialExpired: boolean;
  credentialExpiringSoon: boolean;
  version: number;
  lastUpdated: number;
}

interface BackupEntry {
  id: string;
  label: string;
  createdAt: number;
  createdBy: string;
  environment: string;
  integrationCount: number;
  checksum: string;
}

/* ================================================================== */
/*  MODULE METADATA                                                    */
/* ================================================================== */

const MODULE_META: Record<IntegrationModule, { label: string; icon: React.ElementType; description: string; color: string }> = {
  authentication: { label: "Authentication", icon: Shield, description: "OAuth providers, SSO, social login", color: "text-purple-500" },
  email: { label: "Email", icon: Mail, description: "SMTP, SES, SendGrid, Mailgun, Resend, Postmark", color: "text-blue-500" },
  sms: { label: "SMS", icon: MessageSquare, description: "Twilio, MSG91, Amazon SNS", color: "text-green-500" },
  affiliate_networks: { label: "Affiliate Networks", icon: Handshake, description: "Amazon, Impact, CJ, Awin, ShareASale, Rakuten", color: "text-amber-500" },
  analytics: { label: "Analytics", icon: BarChart3, description: "GA4, Clarity, Meta, TikTok, Pinterest", color: "text-orange-500" },
  search_console: { label: "Search Console", icon: Search, description: "Google Search Console verification & sitemaps", color: "text-emerald-500" },
  tag_manager: { label: "Tag Manager", icon: Tags, description: "Google Tag Manager container management", color: "text-yellow-500" },
  ai_providers: { label: "AI Providers", icon: Brain, description: "OpenAI, Gemini, Claude, DeepSeek", color: "text-violet-500" },
  search_engines: { label: "Search Engines", icon: Search, description: "Typesense, Algolia, Meilisearch, Elasticsearch", color: "text-sky-500" },
  storage: { label: "Storage", icon: Database, description: "Local, S3, Cloudinary, GCS, Backblaze", color: "text-cyan-500" },
  cdn: { label: "CDN", icon: Globe, description: "Cloudflare configuration & cache management", color: "text-indigo-500" },
  cloud_services: { label: "Cloud Services", icon: Cloud, description: "AWS, GCP, Azure cloud configuration", color: "text-blue-600" },
  maps: { label: "Maps", icon: MapPin, description: "Google Maps API configuration", color: "text-red-500" },
  notifications: { label: "Notifications", icon: Bell, description: "FCM, OneSignal, Pusher push notifications", color: "text-pink-500" },
  payments: { label: "Payments (Future)", icon: CreditCard, description: "Stripe, PayPal — architecture ready", color: "text-slate-500" },
  developer_apis: { label: "Developer APIs", icon: Code2, description: "API keys, webhooks, rate limits, secrets", color: "text-teal-500" },
};

const ENVIRONMENTS = ["development", "testing", "qa", "staging", "production"] as const;

function getApiBase(): string {
  return getApiConfig().apiUrl.replace(/\/+$/, "");
}

function getSessionToken(): string | null {
  try {
    const raw = window.localStorage.getItem("alaya_admin_session");
    if (raw) {
      const session = JSON.parse(raw);
      return session.token || null;
    }
  } catch { /* ignore */ }
  return null;
}

function isSuperAdmin(): boolean {
  try {
    const raw = window.localStorage.getItem("alaya_admin_session");
    if (raw) {
      const session = JSON.parse(raw);
      return session.email === "alayainsider@gmail.com" || session.role === "super_admin";
    }
  } catch { /* ignore */ }
  return false;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getSessionToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function AdminIntegrationsCenter() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Record<string, ProviderDefinition[]>>({});
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [healthData, setHealthData] = useState<HealthCheckResult[]>([]);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<IntegrationModule | "all">("all");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [showRawValues, setShowRawValues] = useState<string | null>(null);
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [integrationLogs, setIntegrationLogs] = useState<Record<string, IntegrationLog[]>>({});
  const [activeTab, setActiveTab] = useState<"modules" | "all-integrations" | "health" | "logs" | "stats" | "backup">("modules");
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupLabel, setBackupLabel] = useState("");
  const [backupEnv, setBackupEnv] = useState<string>("all");
  const [importJson, setImportJson] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const superAdmin = isSuperAdmin();

  useEscapeKey(() => setViewingLogs(null), !!viewingLogs);
  useLockBody(!!viewingLogs);
  useEscapeKey(() => setShowBackupModal(false), showBackupModal);
  useLockBody(showBackupModal);
  useEscapeKey(() => { setShowImportModal(false); setImportJson(""); }, showImportModal);
  useLockBody(showImportModal);

  /* ---- Data Loading ---- */

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const base = getApiBase();
      const endpoints = [
        fetch(`${base}/integrations/providers`, { headers }),
        fetch(`${base}/integrations`, { headers }),
        fetch(`${base}/integrations/stats`, { headers }),
        fetch(`${base}/integrations/logs?limit=50`, { headers }),
        fetch(`${base}/integrations/health`, { headers }),
      ];

      // Add backup listing if super admin
      if (superAdmin) {
        endpoints.push(fetch(`${base}/integrations/backups`, { headers }));
      }

      const results = await Promise.all(endpoints);

      if (results[0].ok) {
        const pData = await results[0].json();
        setProviders(pData.data || {});
      }
      if (results[1].ok) {
        const iData = await results[1].json();
        setIntegrations(iData.data || []);
      }
      if (results[2].ok) {
        const sData = await results[2].json();
        setStats(sData.data || null);
      }
      if (results[3].ok) {
        const lData = await results[3].json();
        setLogs(lData.data || []);
      }
      if (results[4].ok) {
        const hData = await results[4].json();
        setHealthData(hData.data || []);
      }
      if (results[5]?.ok) {
        const bData = await results[5].json();
        setBackups(bData.data || []);
      }
    } catch (err) {
      console.error("Failed to load integrations data:", err);
    } finally {
      setLoading(false);
    }
  }, [superAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- API Helpers ---- */

  const apiCall = async (path: string, options?: RequestInit) => {
    const headers = getHeaders();
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, { ...options, headers });
    return res.json();
  };

  /* ---- Integration Actions ---- */

  const handleSave = async (module: string, provider: string) => {
    const providerDef = (providers[module] || []).find((p) => p.provider === provider);
    if (!providerDef) return;

    const settings: Record<string, string> = {};
    for (const field of providerDef.fields) {
      const val = formValues[`${provider}.${field.key}`] || "";
      if (field.required && !val) {
        toast.error(`${field.label} is required`);
        return;
      }
      settings[field.key] = val;
    }

    // Include environment if set
    const env = formValues[`${provider}.environment`] || "development";

    const result = await apiCall("/integrations", {
      method: "POST",
      body: JSON.stringify({ module, provider, label: providerDef.label, settings, environment: env }),
    });

    if (result.data) {
      toast.success(`${providerDef.label} configured successfully`);
      setExpandedProvider(null);
      setFormValues({});
      loadData();
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const result = await apiCall(`/integrations/${id}/toggle`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    if (result.data) {
      toast.success(enabled ? "Integration enabled" : "Integration disabled");
      loadData();
    } else if (result.code === "FORBIDDEN") {
      toast.error("Only Super Admin can enable/disable integrations");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await apiCall(`/integrations/${id}`, { method: "DELETE" });
    if (result.message) {
      toast.success("Integration deleted");
      loadData();
    } else if (result.code === "FORBIDDEN") {
      toast.error("Only Super Admin can delete integrations");
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    const result = await apiCall(`/integrations/${id}/test`, { method: "POST" });
    setTestingConnection(null);
    if (result.data) {
      if (result.data.success) {
        toast.success(`Connection test passed: ${result.data.message}`);
      } else {
        toast.error(`Connection failed: ${result.data.message}`);
      }
      loadData();
    }
  };

  const handleRotateCredentials = async (id: string) => {
    const result = await apiCall(`/integrations/${id}/rotate`, { method: "POST" });
    if (result.data) {
      toast.success("Credentials rotated successfully");
      loadData();
    } else if (result.code === "FORBIDDEN") {
      toast.error("Only Super Admin can rotate credentials");
    }
  };

  const handleViewLogs = async (id: string) => {
    setViewingLogs(id);
    const result = await apiCall(`/integrations/${id}/logs?limit=50`);
    if (result.data) {
      setIntegrationLogs((prev) => ({ ...prev, [id]: result.data }));
    }
  };

  const closeLogs = () => {
    setViewingLogs(null);
  };

  /* ---- Backup/Restore ---- */

  const handleCreateBackup = async () => {
    if (!backupLabel.trim()) {
      toast.error("Backup label is required");
      return;
    }
    const result = await apiCall("/integrations/backup", {
      method: "POST",
      body: JSON.stringify({ label: backupLabel, environment: backupEnv }),
    });
    if (result.data) {
      toast.success(`Backup "${backupLabel}" created`);
      setShowBackupModal(false);
      setBackupLabel("");
      loadData();
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setRestoringBackup(backupId);
    const result = await apiCall(`/integrations/backups/${backupId}/restore`, { method: "POST" });
    setRestoringBackup(null);
    if (result.success) {
      toast.success(result.message);
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleExport = async () => {
    try {
      const headers = getHeaders();
      const base = getApiBase();
      const res = await fetch(`${base}/integrations/export`, { headers });
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Only Super Admin can export configurations");
        } else {
          toast.error("Export failed");
        }
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `integrations-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      toast.error("Please paste the export JSON data");
      return;
    }
    const result = await apiCall("/integrations/import", {
      method: "POST",
      body: JSON.stringify({ data: importJson }),
    });
    if (result.success) {
      toast.success(result.message);
      setShowImportModal(false);
      setImportJson("");
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  /* ---- Filtered Lists ---- */

  const filteredIntegrations = selectedModule === "all"
    ? integrations
    : integrations.filter((i) => i.module === selectedModule);

  /* ---- Format Helpers ---- */

  const statusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case "connected": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "disconnected": return <XCircle className="h-4 w-4 text-muted" />;
      case "error": return <AlertCircle className="h-4 w-4 text-danger" />;
      case "testing": return <Loader2 className="h-4 w-4 text-accent animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-muted" />;
    }
  };

  const statusLabel = (status: ConnectionStatus) => {
    switch (status) {
      case "connected": return "Connected";
      case "disconnected": return "Disconnected";
      case "error": return "Error";
      case "testing": return "Testing...";
      default: return "Unknown";
    }
  };

  const healthBadge = (score?: number, cbState?: CircuitBreakerState) => {
    if (cbState === "open") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[0.6rem] font-medium text-danger">
          <ShieldAlert className="h-3 w-3" />
          Circuit Open
        </span>
      );
    }
    if (score === undefined || score === null) return null;
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[0.6rem] font-medium text-success">
          <CheckCircle2 className="h-3 w-3" />
          Healthy
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[0.6rem] font-medium text-warning">
          <AlertTriangle className="h-3 w-3" />
          Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[0.6rem] font-medium text-danger">
        <AlertCircle className="h-3 w-3" />
        Critical
      </span>
    );
  };

  const expiryBadge = (expiresAt?: number) => {
    if (!expiresAt) return null;
    const now = Date.now();
    if (expiresAt < now) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[0.6rem] font-medium text-danger">
          <Clock className="h-3 w-3" />
          Expired
        </span>
      );
    }
    const daysUntil = Math.round((expiresAt - now) / 86400000);
    if (daysUntil <= 14) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[0.6rem] font-medium text-warning">
          <AlertTriangle className="h-3 w-3" />
          Expires in {daysUntil}d
        </span>
      );
    }
    return null;
  };

  const timeAgo = (ts?: number) => {
    if (!ts) return "Never";
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatModuleLabel = (module: string) => {
    return MODULE_META[module as IntegrationModule]?.label ||
      module.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  if (loading) {
    return (
      <>
        <Seo title="Integrations Center" path="/admin/integrations" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted">Loading Integrations Center...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Integrations Center" path="/admin/integrations" />
      <div className="p-5 pb-28 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Integrations Center</h1>
            <p className="mt-1 text-sm text-muted">
              Configure every third-party service from one place.
              {superAdmin ? " All credentials are encrypted at rest." : " Some actions are restricted to Super Admin."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats && (
              <div className="flex gap-3">
                <span className="flex items-center gap-1 text-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {stats.connectedCount} connected
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <AlertCircle className="h-3.5 w-3.5 text-danger" />
                  {stats.errorCount} errors
                </span>
                {stats.credentialExpiringCount > 0 && (
                  <span className="flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {stats.credentialExpiringCount} expiring
                  </span>
                )}
                <span className="text-muted">| {stats.healthSummary.averageHealthScore}% avg health</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-1 rounded-xl bg-surface2 p-1 w-fit">
          {([
            ["modules", "Modules"],
            ["all-integrations", "All"],
            ["health", "Health"],
            ["logs", "Logs"],
            ["stats", "Stats"],
            ...(superAdmin ? [["backup", "Backup"] as const] : []),
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
              {key === "health" && healthData.filter((h) => h.credentialExpired || h.circuitBreakerState === "open").length > 0 && (
                <span className="ml-1.5 rounded-full bg-danger/20 px-1.5 text-[0.6rem] text-danger">
                  {healthData.filter((h) => h.credentialExpired || h.circuitBreakerState === "open").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============ MODULES TAB ============ */}
        {activeTab === "modules" && (
          <>
            <div className="mt-6 mb-4 flex items-center gap-2">
              <span className="text-sm font-medium text-muted">Module filter:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedModule("all")}
                  className={cn("chip", selectedModule === "all" && "chip-active")}
                >
                  All
                </button>
                {(Object.keys(MODULE_META) as IntegrationModule[]).map((mod) => {
                  const meta = MODULE_META[mod];
                  const Icon = meta.icon;
                  const modIntegrations = integrations.filter((i) => i.module === mod);
                  const hasErrors = modIntegrations.some((i) => i.connectionStatus === "error");
                  const hasExpiring = healthData.some((h) => h.module === mod && h.credentialExpiringSoon);
                  const hasExpired = healthData.some((h) => h.module === mod && h.credentialExpired);
                  return (
                    <button
                      key={mod}
                      onClick={() => setSelectedModule(mod)}
                      className={cn(
                        "chip flex items-center gap-1.5",
                        selectedModule === mod && "chip-active",
                        hasErrors && "ring-1 ring-danger/40",
                        hasExpired && "ring-1 ring-danger/40",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                      {meta.label}
                      {hasExpired && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-danger" />}
                      {hasExpiring && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-warning" />}
                      {modIntegrations.length > 0 && (
                        <span className="ml-0.5 rounded-full bg-surface2 px-1.5 text-[0.6rem] tabular-nums text-muted">
                          {modIntegrations.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(MODULE_META) as IntegrationModule[])
                .filter((mod) => selectedModule === "all" || selectedModule === mod)
                .map((module) => {
                  const meta = MODULE_META[module];
                  const Icon = meta.icon;
                  const moduleProviders = providers[module] || [];
                  const moduleIntegrations = integrations.filter((i) => i.module === module);
                  const enabledCount = moduleIntegrations.filter((i) => i.enabled).length;
                  const hasErrors = moduleIntegrations.some((i) => i.connectionStatus === "error");

                  return (
                    <div key={module} className={cn("card overflow-hidden", hasErrors && "ring-1 ring-danger/20")}>
                      <div className="flex items-start justify-between border-b border-line p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2">
                            <Icon className={cn("h-5 w-5", meta.color)} />
                          </div>
                          <div>
                            <h3 className="font-medium text-ink">{meta.label}</h3>
                            <p className="text-xs text-muted">{meta.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {moduleIntegrations.length > 0 && (
                            <span className="text-xs tabular-nums text-muted">
                              {enabledCount}/{moduleIntegrations.length} active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-line">
                        {moduleProviders.map((provider) => {
                          const existing = moduleIntegrations.find((i) => i.provider === provider.provider);
                          const health = healthData.find((h) => h.id === existing?.id);
                          const isExpanded = expandedProvider === `${module}.${provider.provider}`;

                          return (
                            <div key={provider.provider}>
                              <button
                                onClick={() => {
                                  setExpandedProvider(isExpanded ? null : `${module}.${provider.provider}`);
                                  if (!existing) {
                                    const vals: Record<string, string> = {};
                                    provider.fields.forEach((f) => { vals[`${provider.provider}.${f.key}`] = ""; });
                                    setFormValues(vals);
                                  }
                                }}
                                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface2/50"
                              >
                                <div className="flex items-center gap-3">
                                  {existing ? statusIcon(existing.connectionStatus) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-dashed border-line" />
                                  )}
                                  <span className={cn("text-sm", existing ? "font-medium text-ink" : "text-muted")}>
                                    {provider.label}
                                  </span>
                                  {existing?.enabled && (
                                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[0.6rem] font-medium text-success">Active</span>
                                  )}
                                  {existing && !existing.enabled && (
                                    <span className="rounded-full bg-surface2 px-2 py-0.5 text-[0.6rem] font-medium text-muted">Disabled</span>
                                  )}
                                  {/* Health badge */}
                                  {health && healthBadge(health.healthScore, health.circuitBreakerState)}
                                  {health?.credentialExpired && expiryBadge(health.expiresAt)}
                                  {health?.credentialExpiringSoon && expiryBadge(health.expiresAt)}
                                </div>
                                <div className="flex items-center gap-2">
                                  {existing && (
                                    <span className="text-xs text-muted">
                                      {existing.connectionStatus !== "unknown" ? statusLabel(existing.connectionStatus) : ""}
                                    </span>
                                  )}
                                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="border-t border-line bg-surface2/30 p-4">
                                  {existing ? (
                                    <div className="space-y-3">
                                      {/* Status & health info */}
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-muted">Status: </span>
                                          <span className={cn(
                                            existing.connectionStatus === "connected" ? "text-success" :
                                            existing.connectionStatus === "error" ? "text-danger" :
                                            "text-muted"
                                          )}>
                                            {statusLabel(existing.connectionStatus)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted">Environment: </span>
                                          <span className="text-ink capitalize">{existing.environment}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted">Last tested: </span>
                                          <span className="text-ink">{timeAgo(existing.lastTestedAt)}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted">Health score: </span>
                                          <span className={cn(
                                            (health?.healthScore ?? 100) >= 80 ? "text-success" :
                                            (health?.healthScore ?? 100) >= 50 ? "text-warning" :
                                            "text-danger"
                                          )}>
                                            {health?.healthScore ?? 100}%
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted">Circuit breaker: </span>
                                          <span className={cn(
                                            health?.circuitBreakerState === "closed" ? "text-success" :
                                            health?.circuitBreakerState === "open" ? "text-danger" :
                                            health?.circuitBreakerState === "half-open" ? "text-warning" :
                                            "text-muted"
                                          )}>
                                            {health?.circuitBreakerState ?? "closed"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted">Avg latency: </span>
                                          <span className="text-ink">
                                            {health?.averageLatency ? `${health.averageLatency}ms` : "—"}
                                          </span>
                                        </div>
                                        {health?.expiresAt && (
                                          <div className="col-span-2">
                                            <span className="text-muted">Credentials: </span>
                                            <span className={cn(
                                              health.credentialExpired ? "text-danger" :
                                              health.credentialExpiringSoon ? "text-warning" :
                                              "text-ink"
                                            )}>
                                              {health.credentialExpired
                                                ? "EXPIRED — rotate immediately"
                                                : health.credentialExpiringSoon
                                                  ? `Expires in ${Math.round((health.expiresAt - Date.now()) / 86400000)} days`
                                                  : `Valid until ${new Date(health.expiresAt).toLocaleDateString()}`
                                              }
                                            </span>
                                          </div>
                                        )}
                                        {existing.lastError && (
                                          <div className="col-span-2">
                                            <span className="text-muted">Last error: </span>
                                            <span className="text-danger">{existing.lastError}</span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-muted">Version: </span>
                                          <span className="text-ink">{existing.version}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted">Updated: </span>
                                          <span className="text-ink">{timeAgo(existing.updatedAt)}</span>
                                        </div>
                                      </div>

                                      {/* Current settings (masked) */}
                                      <div>
                                        <p className="mb-1 text-xs font-medium text-muted">Current configuration:</p>
                                        <div className="space-y-1">
                                          {provider.fields.map((field) => {
                                            const val = existing.settings[field.key];
                                            const isRevealed = showRawValues === `${existing.id}.${field.key}`;
                                            return (
                                              <div key={field.key} className="flex items-center justify-between rounded-md bg-surface px-3 py-1.5">
                                                <span className="text-xs text-muted">{field.label}</span>
                                                <div className="flex items-center gap-1.5">
                                                  <code className="text-xs text-ink">
                                                    {val ? (isRevealed ? val : `${val.slice(0, 2)}****${val.slice(-2)}`) : "—"}
                                                  </code>
                                                  {superAdmin && field.maskInUI && val && (
                                                    <button
                                                      onClick={() => setShowRawValues(isRevealed ? null : `${existing.id}.${field.key}`)}
                                                      className="text-muted hover:text-ink"
                                                      title={isRevealed ? "Hide value" : "Show value"}
                                                    >
                                                      {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Action buttons — RBAC aware */}
                                      <div className="flex flex-wrap gap-2">
                                        {superAdmin && (
                                          <>
                                            <button
                                              onClick={() => handleToggle(existing.id, !existing.enabled)}
                                              className={cn("btn-sm", existing.enabled ? "btn-ghost text-warning" : "btn-ghost text-success")}
                                            >
                                              {existing.enabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                                              {existing.enabled ? "Disable" : "Enable"}
                                            </button>
                                            <button
                                              onClick={() => handleRotateCredentials(existing.id)}
                                              className="btn-ghost btn-sm"
                                            >
                                              <RefreshCw className="h-3.5 w-3.5" />
                                              Rotate
                                            </button>
                                            <button
                                              onClick={() => handleDelete(existing.id)}
                                              className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                              Delete
                                            </button>
                                          </>
                                        )}
                                        <button
                                          onClick={() => handleTestConnection(existing.id)}
                                          disabled={testingConnection === existing.id}
                                          className="btn-ghost btn-sm"
                                        >
                                          {testingConnection === existing.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Play className="h-3.5 w-3.5" />
                                          )}
                                          Test connection
                                        </button>
                                        <button
                                          onClick={() => handleViewLogs(existing.id)}
                                          className="btn-ghost btn-sm"
                                        >
                                          <History className="h-3.5 w-3.5" />
                                          Logs
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* New integration form */
                                    <div className="space-y-3">
                                      <p className="text-xs font-medium text-muted">
                                        Configure <span className="text-ink">{provider.label}</span>:
                                      </p>
                                      {provider.fields.map((field) => (
                                        <div key={field.key}>
                                          <label className="label-field">
                                            {field.label}
                                            {field.required && <span className="text-danger ml-0.5">*</span>}
                                          </label>
                                          {field.type === "select" ? (
                                            <select
                                              className="input-field"
                                              value={formValues[`${provider.provider}.${field.key}`] || ""}
                                              onChange={(e) => setFormValues((prev) => ({ ...prev, [`${provider.provider}.${field.key}`]: e.target.value }))}
                                            >
                                              <option value="">Select...</option>
                                              {(field.options || []).map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          ) : field.type === "textarea" ? (
                                            <textarea
                                              className="input-field resize-none"
                                              rows={3}
                                              placeholder={field.placeholder}
                                              value={formValues[`${provider.provider}.${field.key}`] || ""}
                                              onChange={(e) => setFormValues((prev) => ({ ...prev, [`${provider.provider}.${field.key}`]: e.target.value }))}
                                            />
                                          ) : field.type === "number" ? (
                                            <input
                                              type="number"
                                              className="input-field"
                                              placeholder={field.placeholder}
                                              value={formValues[`${provider.provider}.${field.key}`] || ""}
                                              onChange={(e) => setFormValues((prev) => ({ ...prev, [`${provider.provider}.${field.key}`]: e.target.value }))}
                                            />
                                          ) : (
                                            <input
                                              type={field.type === "password" ? "password" : "text"}
                                              className="input-field"
                                              placeholder={field.placeholder}
                                              value={formValues[`${provider.provider}.${field.key}`] || ""}
                                              onChange={(e) => setFormValues((prev) => ({ ...prev, [`${provider.provider}.${field.key}`]: e.target.value }))}
                                            />
                                          )}
                                          {field.helpText && (
                                            <p className="mt-0.5 text-[0.6rem] text-muted">{field.helpText}</p>
                                          )}
                                        </div>
                                      ))}
                                      {/* Environment selector for new integrations */}
                                      <div>
                                        <label className="label-field">Environment</label>
                                        <select
                                          className="input-field"
                                          value={formValues[`${provider.provider}.environment`] || "development"}
                                          onChange={(e) => setFormValues((prev) => ({ ...prev, [`${provider.provider}.environment`]: e.target.value }))}
                                        >
                                          {ENVIRONMENTS.map((env) => (
                                            <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() => handleSave(module, provider.provider)}
                                          className="btn-primary btn-sm"
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          Save configuration
                                        </button>
                                        <button
                                          onClick={() => { setExpandedProvider(null); setFormValues({}); }}
                                          className="btn-ghost btn-sm"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {moduleProviders.length === 0 && (
                        <div className="p-6 text-center text-sm text-muted">
                          No providers available for this module.
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* ============ ALL INTEGRATIONS TAB ============ */}
        {activeTab === "all-integrations" && (
          <div className="mt-6">
            {filteredIntegrations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16">
                <SettingsIcon className="h-10 w-10 text-muted" />
                <p className="text-sm text-muted">No integrations configured yet</p>
                <p className="text-xs text-muted">Go to Modules tab to configure your first integration</p>
                <button onClick={() => setActiveTab("modules")} className="btn-primary btn-sm">
                  Browse modules
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Integration</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Module</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Provider</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Health</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Active</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Last Tested</th>
                      <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIntegrations.map((integration) => {
                      const meta = MODULE_META[integration.module];
                      const Icon = meta?.icon || SettingsIcon;
                      const health = healthData.find((h) => h.id === integration.id);
                      return (
                        <tr key={integration.id} className="border-b border-line transition-colors hover:bg-surface2/30">
                          <td className="px-4 py-3">
                            {statusIcon(integration.connectionStatus)}
                          </td>
                          <td className="px-4 py-3 font-medium text-ink">{integration.label}</td>
                          <td className="px-4 py-3 text-muted">
                            <span className="flex items-center gap-1.5">
                              {meta && <Icon className={cn("h-3.5 w-3.5", meta?.color)} />}
                              {formatModuleLabel(integration.module)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted">{integration.provider}</td>
                          <td className="px-4 py-3">
                            {healthBadge(health?.healthScore, health?.circuitBreakerState)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-medium",
                              integration.enabled ? "bg-success/10 text-success" : "bg-surface2 text-muted"
                            )}>
                              {integration.enabled ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted">{timeAgo(integration.lastTestedAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleTestConnection(integration.id)}
                                disabled={testingConnection === integration.id}
                                className="btn-ghost btn-sm px-2"
                                title="Test connection"
                              >
                                {testingConnection === integration.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Play className="h-3.5 w-3.5" />}
                              </button>
                              {superAdmin && (
                                <>
                                  <button
                                    onClick={() => handleRotateCredentials(integration.id)}
                                    className="btn-ghost btn-sm px-2"
                                    title="Rotate credentials"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggle(integration.id, !integration.enabled)}
                                    className="btn-ghost btn-sm px-2"
                                    title={integration.enabled ? "Disable" : "Enable"}
                                  >
                                    {integration.enabled
                                      ? <ToggleRight className="h-3.5 w-3.5 text-warning" />
                                      : <ToggleLeft className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(integration.id)}
                                    className="btn-ghost btn-sm px-2 text-danger"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleViewLogs(integration.id)}
                                className="btn-ghost btn-sm px-2"
                                title="View logs"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============ HEALTH TAB ============ */}
        {activeTab === "health" && (
          <div className="mt-6">
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="card p-4">
                <p className="text-xs text-muted">Average Health Score</p>
                <p className={cn(
                  "mt-1 text-2xl font-semibold",
                  (stats?.healthSummary.averageHealthScore ?? 100) >= 80 ? "text-success" :
                  (stats?.healthSummary.averageHealthScore ?? 100) >= 50 ? "text-warning" : "text-danger"
                )}>
                  {stats?.healthSummary.averageHealthScore ?? 100}%
                </p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted">Healthy Integrations</p>
                <p className="mt-1 text-2xl font-semibold text-success">{stats?.healthSummary.healthyCount ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted">Warning</p>
                <p className="mt-1 text-2xl font-semibold text-warning">{stats?.healthSummary.warningCount ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted">Critical / Circuit Open</p>
                <p className={cn("mt-1 text-2xl font-semibold", (stats?.healthSummary.criticalCount ?? 0) > 0 ? "text-danger" : "text-muted")}>
                  {stats?.healthSummary.criticalCount ?? 0}
                  {(stats?.circuitBreakerOpenCount ?? 0) > 0 && ` (${stats?.circuitBreakerOpenCount} open)`}
                </p>
              </div>
            </div>

            {healthData.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16">
                <Shield className="h-10 w-10 text-muted" />
                <p className="text-sm text-muted">No health data available</p>
                <p className="text-xs text-muted">Configure integrations and run connection tests to populate the health dashboard</p>
              </div>
            ) : (
              <div className="space-y-2">
                {healthData.map((h) => (
                  <div key={h.id} className={cn(
                    "flex items-center gap-4 rounded-lg border border-line p-3 transition-colors hover:bg-surface2/30",
                    h.credentialExpired && "border-danger/30",
                    h.credentialExpiringSoon && "border-warning/30",
                  )}>
                    {/* Health score circle */}
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      h.healthScore >= 80 ? "bg-success/10 text-success" :
                      h.healthScore >= 50 ? "bg-warning/10 text-warning" :
                      "bg-danger/10 text-danger"
                    )}>
                      {h.healthScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{h.label}</span>
                        <span className="text-xs text-muted">({h.provider})</span>
                        <span className="text-[0.6rem] uppercase text-muted bg-surface2 px-1.5 rounded">{h.environment}</span>
                        {healthBadge(h.healthScore, h.circuitBreakerState)}
                        {(h.credentialExpired || h.credentialExpiringSoon) && expiryBadge(h.expiresAt)}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem] text-muted">
                        <span className="flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          {statusLabel(h.connectionStatus)}
                        </span>
                        {h.averageLatency && (
                          <span>{h.averageLatency}ms avg</span>
                        )}
                        <span>v{h.version}</span>
                        <span>Last tested: {timeAgo(h.lastTestedAt)}</span>
                        {h.lastSuccessAt && <span>Last success: {timeAgo(h.lastSuccessAt)}</span>}
                        {h.circuitBreakerState && h.circuitBreakerState !== "closed" && (
                          <span className="text-danger font-medium">Circuit: {h.circuitBreakerState}</span>
                        )}
                      </div>
                      {h.lastError && (
                        <p className="mt-1 text-[0.6rem] text-danger">{h.lastError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTestConnection(h.id)}
                        disabled={testingConnection === h.id}
                        className="btn-ghost btn-sm px-2"
                        title="Test connection"
                      >
                        {testingConnection === h.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Play className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleViewLogs(h.id)}
                        className="btn-ghost btn-sm px-2"
                        title="View logs"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ LOGS TAB ============ */}
        {activeTab === "logs" && (
          <div className="mt-6">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16">
                <History className="h-10 w-10 text-muted" />
                <p className="text-sm text-muted">No audit logs yet</p>
                <p className="text-xs text-muted">Logs will appear here as you configure and test integrations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const typeColors: Record<string, string> = {
                    connection_test: "text-blue-500",
                    sync: "text-green-500",
                    error: "text-danger",
                    credential_rotation: "text-amber-500",
                    credential_created: "text-emerald-500",
                    credential_updated: "text-cyan-500",
                    credential_deleted: "text-red-500",
                    enabled: "text-success",
                    disabled: "text-warning",
                    config_update: "text-accent",
                    backup_created: "text-purple-500",
                    backup_restored: "text-indigo-500",
                    environment_changed: "text-orange-500",
                  };
                  const statusDots: Record<string, string> = {
                    success: "bg-success",
                    failure: "bg-danger",
                    info: "bg-accent",
                  };

                  return (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border border-line p-3 transition-colors hover:bg-surface2/30">
                      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", statusDots[log.status] || "bg-muted")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("text-xs font-medium capitalize", typeColors[log.type] || "text-muted")}>
                            {log.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-ink">{log.message}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6rem] text-muted">
                          <span className="font-medium">{log.actor}</span>
                          {log.actorRole && (
                            <span className={cn(
                              log.actorRole === "super_admin" ? "text-amber-500" : "text-blue-500"
                            )}>
                              ({log.actorRole})
                            </span>
                          )}
                          {log.actorIp && log.actorIp !== "unknown" && <span>· {log.actorIp}</span>}
                          {log.actorDevice && <span>· {log.actorDevice}</span>}
                          {log.actorCountry && log.actorCountry !== "unknown" && <span>· {log.actorCountry}</span>}
                          <span>· {new Date(log.ts).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ STATS TAB ============ */}
        {activeTab === "stats" && (
          <div className="mt-6">
            {stats ? (
              <div className="space-y-6">
                {/* Overview cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="card p-4">
                    <p className="text-xs text-muted">Total Integrations</p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{stats.totalIntegrations}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-muted">Enabled</p>
                    <p className="mt-1 text-2xl font-semibold text-success">{stats.enabledCount}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-muted">Connected</p>
                    <p className="mt-1 text-2xl font-semibold text-accent">{stats.connectedCount}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-muted">Errors</p>
                    <p className={cn("mt-1 text-2xl font-semibold", stats.errorCount > 0 ? "text-danger" : "text-muted")}>
                      {stats.errorCount}
                    </p>
                  </div>
                </div>

                {/* Health summary */}
                <div className="card p-4">
                  <h3 className="text-sm font-medium text-ink">Health Summary</h3>
                  <div className="mt-3 flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-success" />
                      <span className="text-xs text-muted">{stats.healthSummary.healthyCount} Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-warning" />
                      <span className="text-xs text-muted">{stats.healthSummary.warningCount} Warning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-danger" />
                      <span className="text-xs text-muted">{stats.healthSummary.criticalCount} Critical</span>
                    </div>
                  </div>
                  <div className="mt-3 flex h-3 rounded-full bg-surface2 overflow-hidden">
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: `${stats.totalIntegrations > 0 ? (stats.healthSummary.healthyCount / stats.totalIntegrations) * 100 : 0}%` }}
                    />
                    <div
                      className="h-full bg-warning transition-all"
                      style={{ width: `${stats.totalIntegrations > 0 ? (stats.healthSummary.warningCount / stats.totalIntegrations) * 100 : 0}%` }}
                    />
                    <div
                      className="h-full bg-danger transition-all"
                      style={{ width: `${stats.totalIntegrations > 0 ? (stats.healthSummary.criticalCount / stats.totalIntegrations) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Credentials health */}
                {(stats.credentialExpiringCount > 0 || stats.circuitBreakerOpenCount > 0) && (
                  <div className="card p-4 border-danger/20">
                    <h3 className="text-sm font-medium text-danger">Issues Requiring Attention</h3>
                    <div className="mt-2 space-y-1">
                      {stats.credentialExpiringCount > 0 && (
                        <p className="text-xs text-muted">
                          <AlertTriangle className="h-3 w-3 inline mr-1 text-warning" />
                          {stats.credentialExpiringCount} integration(s) have expired or expiring credentials. Rotate them immediately.
                        </p>
                      )}
                      {stats.circuitBreakerOpenCount > 0 && (
                        <p className="text-xs text-muted">
                          <ShieldAlert className="h-3 w-3 inline mr-1 text-danger" />
                          {stats.circuitBreakerOpenCount} integration(s) have open circuit breakers. Check connection configuration or rotate credentials.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* By Module */}
                <div className="card p-4">
                  <h3 className="text-sm font-medium text-ink">Integrations by Module</h3>
                  <div className="mt-3 space-y-2">
                    {(Object.keys(MODULE_META) as IntegrationModule[])
                      .filter((mod) => stats.byModule[mod])
                      .map((mod) => {
                        const meta = MODULE_META[mod];
                        const Icon = meta.icon;
                        const count = stats.byModule[mod];
                        const maxCount = Math.max(...Object.values(stats.byModule), 1);
                        return (
                          <div key={mod} className="flex items-center gap-3">
                            <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
                            <span className="w-36 text-xs text-ink">{meta.label}</span>
                            <div className="flex-1 h-4 rounded-full bg-surface2 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent/60 transition-all"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted">{count}</span>
                          </div>
                        );
                      })}
                    {Object.keys(stats.byModule).length === 0 && (
                      <p className="text-xs text-muted">No integrations configured yet.</p>
                    )}
                  </div>
                </div>

                {/* By Environment */}
                {Object.keys(stats.byEnvironment).length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-medium text-ink">By Environment</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(stats.byEnvironment).map(([env, count]) => (
                        <div key={env} className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2">
                          <span className="text-xs font-medium text-ink capitalize">{env}</span>
                          <span className="text-xs text-muted">{count} integrations</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent logs summary */}
                <div className="card p-4">
                  <h3 className="text-sm font-medium text-ink">Recent Activity</h3>
                  <div className="mt-3 space-y-1.5">
                    {stats.recentLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          log.status === "success" ? "bg-success" :
                          log.status === "failure" ? "bg-danger" : "bg-accent"
                        )} />
                        <span className="text-muted">{log.message}</span>
                        <span className="text-muted ml-auto">{new Date(log.ts).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16">
                <BarChart3 className="h-10 w-10 text-muted" />
                <p className="text-sm text-muted">No statistics available yet</p>
              </div>
            )}
          </div>
        )}

        {/* ============ BACKUP TAB (Super Admin only) ============ */}
        {activeTab === "backup" && superAdmin && (
          <div className="mt-6 space-y-6">
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowBackupModal(true)} className="btn-primary btn-sm">
                <Download className="h-3.5 w-3.5" />
                Create Backup
              </button>
              <button onClick={handleExport} className="btn-ghost btn-sm">
                <Download className="h-3.5 w-3.5" />
                Export Configs
              </button>
              <button onClick={() => setShowImportModal(true)} className="btn-ghost btn-sm">
                <Upload className="h-3.5 w-3.5" />
                Import Configs
              </button>
            </div>

            {/* Backups list */}
            <div>
              <h3 className="text-sm font-medium text-ink mb-3">Available Backups</h3>
              {backups.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-12">
                  <Download className="h-10 w-10 text-muted" />
                  <p className="text-sm text-muted">No backups available</p>
                  <p className="text-xs text-muted">Create a backup to save the current state of all integration configurations</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between rounded-lg border border-line p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2">
                          <Download className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">{backup.label}</p>
                          <p className="text-[0.6rem] text-muted">
                            {backup.integrationCount} integrations · {backup.environment} ·
                            Created by {backup.createdBy} · {new Date(backup.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={restoringBackup === backup.id}
                        className="btn-ghost btn-sm"
                      >
                        {restoringBackup === backup.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />}
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ LOGS DRAWER ============ */}
        {viewingLogs && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeLogs} />
            <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-surface sm:rounded-2xl max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h3 className="font-medium text-ink">Integration Logs</h3>
                <button onClick={closeLogs} className="btn-ghost btn-sm">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(integrationLogs[viewingLogs] || []).length === 0 ? (
                  <p className="text-center text-sm text-muted py-8">No logs found for this integration.</p>
                ) : (
                  (integrationLogs[viewingLogs] || []).map((log) => (
                    <div key={log.id} className="flex items-start gap-2 rounded-lg border border-line p-3">
                      <span className={cn(
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                        log.status === "success" ? "bg-success" :
                        log.status === "failure" ? "bg-danger" : "bg-accent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium capitalize",
                            log.type.includes("credential") ? "text-amber-500" :
                            log.type === "connection_test" ? "text-blue-500" :
                            log.type === "error" ? "text-danger" : "text-accent"
                          )}>
                            {log.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-ink">{log.message}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.6rem] text-muted">
                          <span className="font-medium">{log.actor}</span>
                          {log.actorRole && <span>({log.actorRole})</span>}
                          {log.actorIp && log.actorIp !== "unknown" && <span>· {log.actorIp}</span>}
                          {log.actorDevice && <span>· {log.actorDevice}</span>}
                          <span>· {new Date(log.ts).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ BACKUP MODAL ============ */}
        {showBackupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBackupModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-6">
              <h3 className="font-medium text-ink mb-4">Create Backup</h3>
              <div className="space-y-3">
                <div>
                  <label className="label-field">Backup Label</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Pre-release backup"
                    value={backupLabel}
                    onChange={(e) => setBackupLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-field">Environment</label>
                  <select
                    className="input-field"
                    value={backupEnv}
                    onChange={(e) => setBackupEnv(e.target.value)}
                  >
                    <option value="all">All Environments</option>
                    {ENVIRONMENTS.map((env) => (
                      <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCreateBackup} className="btn-primary btn-sm">
                    <Download className="h-3.5 w-3.5" />
                    Create Backup
                  </button>
                  <button onClick={() => setShowBackupModal(false)} className="btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ IMPORT MODAL ============ */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6">
              <h3 className="font-medium text-ink mb-2">Import Integration Configurations</h3>
              <p className="text-xs text-muted mb-4">
                Paste the exported JSON data below. This will merge with existing configurations — existing integrations will be updated, new ones will be added.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label-field">Export JSON Data</label>
                  <textarea
                    className="input-field resize-none"
                    rows={8}
                    placeholder='{"version":2,"exportedAt":...,"configs":[...]}'
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleImport} className="btn-primary btn-sm">
                    <Upload className="h-3.5 w-3.5" />
                    Import
                  </button>
                  <button onClick={() => { setShowImportModal(false); setImportJson(""); }} className="btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
