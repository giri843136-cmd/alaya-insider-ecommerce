/**
 * ALAYA INSIDER — Enterprise Notification Dashboard
 * --------------------------------------------------------------------------
 * Admin analytics dashboard for the notification system.
 * Displays delivery statistics, provider status, template usage, and health.
 */

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  RefreshCw,
  Activity,
  Mail,
  Smartphone,
  BellRing,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface DashboardStats {
  totalSent: number;
  delivered: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  spam: number;
  queued: number;
  scheduled: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate: number;
  byChannel: Record<string, number>;
  byCategory: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    channel: string;
    recipient: string;
    status: string;
    ts: number;
  }>;
}

interface ProviderStatus {
  provider: string;
  channel: string;
  status: "connected" | "disconnected" | "error" | "not_configured";
  lastTested?: number;
  healthScore?: number;
}

/* ================================================================== */
/*  DUMMY DATA (will connect to backend API in production)             */
/* ================================================================== */

const MOCK_STATS: DashboardStats = {
  totalSent: 12480,
  delivered: 11856,
  failed: 374,
  bounced: 124,
  opened: 7120,
  clicked: 2496,
  spam: 86,
  queued: 45,
  scheduled: 128,
  deliveryRate: 95.0,
  openRate: 60.0,
  clickRate: 21.0,
  failureRate: 3.0,
  byChannel: {
    email: 8240,
    push: 3120,
    in_app: 1120,
  },
  byCategory: {
    auth: 2340,
    marketing: 4560,
    transactional: 3120,
    system: 1240,
    security: 780,
    affiliate: 440,
  },
  recentActivity: [],
};

const MOCK_PROVIDERS: ProviderStatus[] = [
  { provider: "SMTP", channel: "Email", status: "connected", lastTested: Date.now() - 300000, healthScore: 98 },
  { provider: "SendGrid", channel: "Email", status: "connected", lastTested: Date.now() - 600000, healthScore: 95 },
  { provider: "Twilio", channel: "SMS", status: "not_configured" },
  { provider: "Firebase", channel: "Push", status: "connected", lastTested: Date.now() - 1200000, healthScore: 92 },
  { provider: "OneSignal", channel: "Push", status: "not_configured" },
  { provider: "Pusher", channel: "WebSocket", status: "disconnected", lastTested: Date.now() - 86400000 },
];

export default function AdminNotificationDashboard() {
  const [stats] = useState<DashboardStats>(MOCK_STATS);
  const [providers] = useState<ProviderStatus[]>(MOCK_PROVIDERS);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    sub,
    trend,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    sub?: string;
    trend?: "up" | "down";
    color: string;
  }) => (
    <div className="rounded-2xl border border-line bg-surface p-5 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
            {trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {trend === "up" ? "+12%" : "-3%"}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-muted">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );

  const ChannelBar = ({ channel, count, total }: { channel: string; count: number; total: number }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    const icons: Record<string, any> = { email: Mail, push: Smartphone, in_app: BellRing };
    const Icon = icons[channel] || Send;
    return (
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted" />
        <span className="w-16 text-sm capitalize text-ink">{channel.replace("_", " ")}</span>
        <div className="flex-1">
          <div className="h-2.5 rounded-full bg-surface2">
            <div className="h-2.5 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="w-20 text-right text-sm font-medium text-ink">{count.toLocaleString()}</span>
        <span className="w-12 text-right text-xs text-muted">{pct.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Notification Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Real-time analytics and delivery monitoring</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-1">
          {(["24h", "7d", "30d"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                timeframe === t ? "bg-accent text-white shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Send} label="Total Sent" value={stats.totalSent} sub="Last 24 hours" trend="up" color="bg-blue-500" />
        <MetricCard icon={CheckCircle2} label="Delivered" value={stats.delivered} sub={`${stats.deliveryRate}% delivery rate`} trend="up" color="bg-emerald-500" />
        <MetricCard icon={Eye} label="Opened" value={stats.opened} sub={`${stats.openRate}% open rate`} trend="up" color="bg-violet-500" />
        <MetricCard icon={MousePointerClick} label="Clicked" value={stats.clicked} sub={`${stats.clickRate}% click rate`} trend="up" color="bg-amber-500" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={XCircle} label="Failed" value={stats.failed} sub={`${stats.failureRate}% failure rate`} trend="down" color="bg-red-500" />
        <MetricCard icon={AlertTriangle} label="Bounced" value={stats.bounced} color="bg-orange-500" />
        <MetricCard icon={Clock} label="Queued" value={stats.queued} color="bg-cyan-500" />
        <MetricCard icon={RefreshCw} label="Scheduled" value={stats.scheduled} color="bg-indigo-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Channel */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">By Channel</h2>
          <div className="space-y-3">
            {Object.entries(stats.byChannel).map(([channel, count]) => (
              <ChannelBar key={channel} channel={channel} count={count} total={stats.totalSent} />
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">By Category</h2>
          <div className="space-y-3">
            {Object.entries(stats.byCategory).map(([category, count]) => {
              const pct = stats.totalSent > 0 ? (count / stats.totalSent) * 100 : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="w-28 text-sm capitalize text-ink">{category}</span>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-surface2">
                      <div className="h-2.5 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-ink">{count.toLocaleString()}</span>
                  <span className="w-12 text-right text-xs text-muted">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rate Metrics */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Rate Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Delivery Rate", value: `${stats.deliveryRate}%`, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Open Rate", value: `${stats.openRate}%`, icon: Eye, color: "text-violet-500" },
              { label: "Click Rate", value: `${stats.clickRate}%`, icon: MousePointerClick, color: "text-amber-500" },
              { label: "Failure Rate", value: `${stats.failureRate}%`, icon: XCircle, color: "text-red-500" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-line bg-surface2/50 p-4">
                <div className="flex items-center gap-2">
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                  <span className="text-xs text-muted">{m.label}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-ink">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Status */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Provider Status</h2>
          <div className="space-y-3">
            {providers.map((p) => {
              const statusColor = {
                connected: "bg-emerald-500",
                disconnected: "bg-amber-500",
                error: "bg-red-500",
                not_configured: "bg-gray-300",
              }[p.status];

              const statusLabel = {
                connected: "Connected",
                disconnected: "Disconnected",
                error: "Error",
                not_configured: "Not Configured",
              }[p.status];

              return (
                <div key={p.provider} className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                    <div>
                      <p className="text-sm font-medium text-ink">{p.provider}</p>
                      <p className="text-xs text-muted">{p.channel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.healthScore !== undefined && (
                      <span className="text-xs font-medium text-muted">{p.healthScore}%</span>
                    )}
                    <span className={`text-xs font-medium ${
                      p.status === "connected" ? "text-emerald-600" :
                      p.status === "error" ? "text-red-500" :
                      p.status === "disconnected" ? "text-amber-600" :
                      "text-gray-400"
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent Activity</h2>
        <div className="rounded-xl border border-dashed border-line p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-2 text-sm text-muted">
            Activity feed will appear once notifications are sent through the system.
          </p>
          <p className="text-xs text-muted">
            Connect your notification routes and triggers to populate this feed.
          </p>
        </div>
      </div>
    </div>
  );
}
