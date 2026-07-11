/**
 * ALAYA INSIDER — Enterprise Communication Platform Admin UI
 *
 * Tabs: Dashboard | Email | SMS | Push | In-App | Templates |
 *       Campaigns | Message Queue | Analytics | Alerts | Settings
 */
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Mail, MessageSquare, Bell, Megaphone, FileText,
  BarChart3, Inbox, Settings, Shield, Smartphone,
  Send, Play, Pause, Trash2, Plus, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle,
  Eye, Users, Globe, SlidersHorizontal,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime, formatCompact } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { useCommunications } from "../../context/CommunicationContext";
import type { MessagePriority, MessageStatus } from "../../lib/communications";

/* ================================================================== */
/*  CONSTANTS & HELPERS                                                */
/* ================================================================== */

type Tab = "dashboard" | "email" | "sms" | "push" | "inapp" | "templates" | "campaigns" | "queue" | "analytics" | "alerts" | "settings";

const STATUS_TONE: Record<MessageStatus, string> = {
  draft: "bg-surface2 text-muted", queued: "bg-accent-soft text-accent",
  sending: "bg-warning/15 text-warning", sent: "bg-info/15 text-info",
  delivered: "bg-success/15 text-success", failed: "bg-danger/15 text-danger",
  bounced: "bg-danger/15 text-danger", cancelled: "bg-surface2 text-muted",
};

const PRIORITY_TONE: Record<MessagePriority, string> = {
  critical: "bg-danger/15 text-danger", high: "bg-warning/15 text-warning",
  normal: "bg-accent-soft text-accent", low: "bg-surface2 text-muted",
};

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function AdminCommunications() {
  const comms = useCommunications();
  const { refresh } = comms;
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => { refresh(); }, [refresh]);

  const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS", icon: MessageSquare },
    { id: "push", label: "Push", icon: Smartphone },
    { id: "inapp", label: "In-App", icon: Bell },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "queue", label: "Queue", icon: Inbox },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <Seo title="Communications" path="/admin/communications" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Communications</h1>
            <p className="mt-1 text-sm text-muted">Enterprise notification engine, email, SMS, push, in-app & channel integrations.</p>
          </div>
          <button onClick={refresh} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip flex items-center gap-1.5 capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "email" && <EmailTab />}
        {tab === "sms" && <SmsTab />}
        {tab === "push" && <PushTab />}
        {tab === "inapp" && <InAppTab />}
        {tab === "templates" && <TemplatesTab />}
        {tab === "campaigns" && <CampaignsTab />}
        {tab === "queue" && <QueueTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const comms = useCommunications();
  const { analytics, channelAnalytics, inbox } = comms;

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Send} label="Total Sent" value={formatCompact(analytics.totalSent)} sub={`${analytics.overallDeliveryRate}% delivered`} tone="accent" />
        <StatCard icon={Mail} label="Delivery Rate" value={`${analytics.overallDeliveryRate}%`} sub={`${analytics.overallOpenRate}% open rate`} tone="success" />
        <StatCard icon={AlertTriangle} label="Failed" value={formatCompact(analytics.totalFailed)} sub={`${analytics.totalBounced} bounced`} tone={analytics.totalFailed > 0 ? "danger" : "success"} />
        <StatCard icon={Bell} label="Unread In-App" value={String(inbox.unread)} sub={`${inbox.total} total`} tone={inbox.unread > 0 ? "warning" : "accent"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Channel Performance</h3>
          <div className="mt-4 space-y-3">
            {channelAnalytics.filter((c) => c.sent > 0).slice(0, 6).map((ca) => (
              <div key={ca.channel} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-muted capitalize">{ca.channel.replace("_", " ")}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: `${ca.deliveryRate}%` }} />
                </div>
                <span className="w-16 text-right text-xs text-muted">{ca.deliveryRate}%</span>
                <span className="w-12 text-right text-xs text-muted">{ca.sent}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Engagement</h3>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-accent-soft p-4 text-center"><p className="text-2xl font-semibold text-accent">{analytics.overallOpenRate}%</p><p className="text-xs text-muted mt-1">Open Rate</p></div>
            <div className="rounded-xl bg-success/10 p-4 text-center"><p className="text-2xl font-semibold text-success">{analytics.overallClickRate}%</p><p className="text-xs text-muted mt-1">Click Rate</p></div>
            <div className="rounded-xl bg-info/10 p-4 text-center"><p className="text-2xl font-semibold text-info">{formatCompact(analytics.totalOpened)}</p><p className="text-xs text-muted mt-1">Total Opens</p></div>
            <div className="rounded-xl bg-warning/10 p-4 text-center"><p className="text-2xl font-semibold text-warning">{analytics.totalComplained}</p><p className="text-xs text-muted mt-1">Complaints</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Activity; label: string; value: string; sub: string; tone: "accent" | "success" | "danger" | "warning" | "info";
}) {
  return (
    <div className="card p-5">
      <span className={cn("grid h-10 w-10 place-items-center rounded-full", tone === "success" ? "bg-success/15 text-success" : tone === "danger" ? "bg-danger/15 text-danger" : tone === "warning" ? "bg-warning/15 text-warning" : tone === "info" ? "bg-info/15 text-info" : "bg-accent-soft text-accent")}><Icon className="h-5 w-5" /></span>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

/* ================================================================== */
/*  EMAIL TAB                                                          */
/* ================================================================== */

function EmailTab() {
  const comms = useCommunications();
  const { emailProviders, updateEmailProv, sendEmailMsg } = comms;
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });

  const activeProviders = emailProviders.filter((p) => p.active);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{activeProviders.length} of {emailProviders.length} providers active · {emailProviders.reduce((s, p) => s + p.dailyUsed, 0)} emails sent today</p>
        <button onClick={() => setShowCompose(!showCompose)} className="btn-primary btn-sm"><Send className="h-3.5 w-3.5" /> Compose</button>
      </div>

      {showCompose && (
        <div className="card mb-6 p-5">
          <h3 className="font-semibold text-ink mb-4">Send Email</h3>
          <div className="space-y-3">
            <input className="input-field w-full" placeholder="To: email@example.com" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} />
            <input className="input-field w-full" placeholder="Subject" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} />
            <textarea className="input-field w-full min-h-[100px]" placeholder="Email body..." value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
            <button onClick={() => { sendEmailMsg({ to: compose.to, subject: compose.subject, body: compose.body, tracking: true }); setCompose({ to: "", subject: "", body: "" }); setShowCompose(false); }} className="btn-primary btn-sm">
              <Send className="h-3.5 w-3.5" /> Send
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {emailProviders.map((prov) => (
          <div key={prov.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", prov.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-ink text-sm">{prov.label}</p>
                  <p className="text-xs text-muted capitalize">{prov.provider.replace("_", " ")}</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" checked={prov.active} onChange={() => updateEmailProv(prov.id, { active: !prov.active })} />
                <div className="h-5 w-9 rounded-full bg-surface2 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
              </label>
            </div>
            {prov.configured && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs"><span className="text-muted">Used today</span><span className="text-ink">{formatCompact(prov.dailyUsed)} / {formatCompact(prov.dailyLimit)}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full transition-all", (prov.dailyUsed / prov.dailyLimit) > 0.8 ? "bg-warning" : (prov.dailyUsed / prov.dailyLimit) > 0.5 ? "bg-accent" : "bg-success")} style={{ width: `${(prov.dailyUsed / prov.dailyLimit) * 100}%` }} />
                </div>
              </div>
            )}
            {!prov.configured && <p className="mt-3 text-xs text-warning">Not configured</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SMS TAB                                                            */
/* ================================================================== */

function SmsTab() {
  const comms = useCommunications();
  const { sendSmsMsg, notifications } = comms;
  const [showSend, setShowSend] = useState(false);
  const [form, setForm] = useState({ to: "", body: "" });

  const smsNotifs = useMemo(() => notifications.filter((n) => n.channels.includes("sms")).slice(0, 10), [notifications]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{smsNotifs.length} recent SMS messages</p>
        <button onClick={() => setShowSend(!showSend)} className="btn-primary btn-sm"><MessageSquare className="h-3.5 w-3.5" /> Send SMS</button>
      </div>

      {showSend && (
        <div className="card mb-6 p-5">
          <h3 className="font-semibold text-ink mb-4">Send SMS</h3>
          <div className="space-y-3">
            <input className="input-field w-full" placeholder="Phone: +1234567890" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
            <textarea className="input-field w-full min-h-[80px]" placeholder="Message (max 160 characters)" maxLength={160} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{form.body.length}/160 characters · ~{Math.ceil(form.body.length / 160)} segment(s)</span>
              <button onClick={() => { sendSmsMsg({ to: form.to, body: form.body }); setForm({ to: "", body: "" }); setShowSend(false); }} className="btn-primary btn-sm"><Send className="h-3.5 w-3.5" /> Send</button>
            </div>
          </div>
        </div>
      )}

      {smsNotifs.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-6 w-6" />} title="No SMS sent yet" description="Send an SMS to see your message history." />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {smsNotifs.map((n) => (
              <div key={n.id} className="flex items-center gap-4 px-4 py-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", n.status === "sent" || n.status === "delivered" ? "bg-success" : n.status === "failed" ? "bg-danger" : "bg-surface2")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{n.body}</p>
                  <p className="text-xs text-muted">{n.phone || "N/A"} · {formatDateTime(n.createdAt)}</p>
                </div>
                <span className={cn("badge text-[0.55rem]", STATUS_TONE[n.status])}>{n.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PUSH TAB                                                           */
/* ================================================================== */

function PushTab() {
  const comms = useCommunications();
  const { sendPushMsg, pushNotifications } = comms;
  const [showSend, setShowSend] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", icon: "", userId: "" });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{pushNotifications.length} push notifications</p>
        <button onClick={() => setShowSend(!showSend)} className="btn-primary btn-sm"><Smartphone className="h-3.5 w-3.5" /> Send Push</button>
      </div>

      {showSend && (
        <div className="card mb-6 p-5">
          <h3 className="font-semibold text-ink mb-4">Send Push Notification</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field w-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input-field w-full" placeholder="User ID (optional)" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
            <div className="sm:col-span-2">
              <textarea className="input-field w-full min-h-[80px]" placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
          </div>
          <button onClick={() => { sendPushMsg({ userId: form.userId || undefined, title: form.title, body: form.body }); setForm({ title: "", body: "", icon: "", userId: "" }); setShowSend(false); }} className="btn-primary btn-sm mt-3">
            <Send className="h-3.5 w-3.5" /> Send Push
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pushNotifications.slice(0, 12).map((pn) => (
          <div key={pn.id} className="card p-4">
            <div className="flex items-center gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", pn.status === "sent" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}><Smartphone className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink text-sm truncate">{pn.title}</p>
                <p className="text-xs text-muted truncate">{pn.body}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{formatDateTime(pn.sentAt || Date.now())}</span>
              <span className={cn("badge", STATUS_TONE[pn.status])}>{pn.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  IN-APP TAB                                                        */
/* ================================================================== */

function InAppTab() {
  const comms = useCommunications();
  const { inbox, markRead, dismissNotif, markAllRead } = comms;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{inbox.total} notifications · {inbox.unread} unread</p>
        <button onClick={() => markAllRead("admin_1")} className="btn-ghost btn-sm"><Eye className="h-3.5 w-3.5" /> Mark all read</button>
      </div>

      <div className="card overflow-hidden">
        {inbox.notifications.length === 0 ? (
          <div className="p-8"><EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" /></div>
        ) : (
          <div className="divide-y divide-line">
            {inbox.notifications.map((n) => (
              <div key={n.id} className={cn("flex items-start gap-4 px-4 py-3.5 transition-colors", !n.read && "bg-accent-soft/30")}>
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", !n.read ? "bg-accent" : "bg-transparent")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm", n.read ? "text-muted" : "font-medium text-ink")}>{n.title}</p>
                    <span className={cn("badge text-[0.5rem]", n.priority === "urgent" ? "bg-danger/15 text-danger" : n.priority === "high" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{n.priority}</span>
                  </div>
                  <p className={cn("text-xs mt-0.5", n.read ? "text-muted" : "text-ink")}>{n.body}</p>
                  <p className="text-[0.6rem] text-muted mt-1">{formatDateTime(n.createdAt)} · {n.type}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && <button onClick={() => markRead(n.id)} className="btn-ghost btn-sm p-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /></button>}
                  {!n.dismissed && <button onClick={() => dismissNotif(n.id)} className="btn-ghost btn-sm p-1"><XCircle className="h-3.5 w-3.5 text-muted" /></button>}
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
/*  TEMPLATES TAB                                                      */
/* ================================================================== */

function TemplatesTab() {
  const comms = useCommunications();
  const { templates, createTpl, updateTpl, deleteTpl, renderTpl } = comms;
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", category: "transactional" as const, subject: "", body: "", channels: ["email"] as string[] });
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{templates.length} templates</p>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create Template</button>
      </div>

      {showCreate && (
        <div className="card mb-6 p-5">
          <h3 className="font-semibold text-ink mb-4">New Template</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field w-full" placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-field w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              {["transactional", "marketing", "system", "security", "workflow", "affiliate", "supplier", "customer"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input-field w-full sm:col-span-2" placeholder="Subject (use {{variable}} for placeholders)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="input-field w-full sm:col-span-2 min-h-[120px]" placeholder="Body template..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { createTpl({ name: form.name, category: form.category as any, channels: form.channels as any, subject: form.subject, body: form.body, variables: [], version: "1.0", status: "draft" }); setShowCreate(false); setForm({ name: "", category: "transactional", subject: "", body: "", channels: ["email"] }); }} className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
            <button onClick={() => { const r = renderTpl(templates[0]?.id || "", { name: "Test", store_name: "ALAYA" }); if (r) setPreview(r); }} className="btn-ghost btn-sm"><Eye className="h-3.5 w-3.5" /> Preview</button>
          </div>
        </div>
      )}

      {preview && (
        <div className="card mb-4 p-4">
          <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-ink">Preview</h4><button onClick={() => setPreview(null)} className="btn-ghost btn-sm p-1"><XCircle className="h-3.5 w-3.5" /></button></div>
          <p className="mt-2 text-sm text-ink"><strong>Subject:</strong> {preview.subject}</p>
          <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{preview.body}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><FileText className="h-4 w-4" /></span>
                <div>
                  <p className="font-medium text-ink text-sm">{tpl.name}</p>
                  <p className="text-[0.6rem] text-muted capitalize">{tpl.category}</p>
                </div>
              </div>
              <span className={cn("badge", tpl.status === "active" ? "bg-success/15 text-success" : tpl.status === "draft" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{tpl.status}</span>
            </div>
            <p className="mt-2 text-xs text-muted truncate">{tpl.subject}</p>
            <div className="mt-2 flex items-center justify-between text-[0.6rem] text-muted">
              <span>v{tpl.version} · {tpl.usageCount} uses</span>
              <span>{tpl.variables.length} variables</span>
            </div>
            <div className="mt-2 flex gap-1">
              <button onClick={() => updateTpl(tpl.id, { status: tpl.status === "active" ? "draft" : "active" })} className="btn-ghost btn-sm p-1 text-xs">
                {tpl.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => deleteTpl(tpl.id)} className="btn-ghost btn-sm p-1 text-xs text-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CAMPAIGNS TAB                                                      */
/* ================================================================== */

function CampaignsTab() {
  const comms = useCommunications();
  const { campaigns, createCamp, updateCamp, deleteCamp } = comms;
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", channels: ["email"] as string[], category: "marketing" as const, targetAudience: "all_subscribers", scheduleType: "immediate" as const });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{campaigns.length} campaigns · {campaigns.filter((c) => c.status === "active").length} active</p>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New Campaign</button>
      </div>

      {showCreate && (
        <div className="card mb-6 p-5">
          <h3 className="font-semibold text-ink mb-4">New Campaign</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field w-full" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className="input-field w-full" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="input-field w-full" value={form.scheduleType} onChange={(e) => setForm({ ...form, scheduleType: e.target.value as any })}>
              <option value="immediate">Send Immediately</option><option value="scheduled">Schedule</option><option value="drip">Drip Sequence</option>
            </select>
          </div>
          <button onClick={() => { createCamp({ name: form.name, description: form.description, channels: form.channels as any, category: form.category, templateId: undefined, targetAudience: form.targetAudience, scheduleType: form.scheduleType, status: "draft" }); setShowCreate(false); }} className="btn-primary btn-sm mt-3">
            <Plus className="h-3.5 w-3.5" /> Create Campaign
          </button>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((camp) => (
          <div key={camp.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", camp.status === "active" ? "bg-success/15 text-success" : camp.status === "completed" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Megaphone className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{camp.name}</p>
                  <span className={cn("badge", camp.status === "active" ? "bg-success/15 text-success" : camp.status === "completed" ? "bg-accent-soft text-accent" : camp.status === "draft" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{camp.status}</span>
                </div>
                <p className="text-xs text-muted">{camp.description} · {camp.targetAudience} · {camp.scheduleType}</p>
                <div className="mt-1 flex items-center gap-3 text-[0.6rem] text-muted">
                  <span>Sent: {formatCompact(camp.sentCount)}</span>
                  <span>Opened: {formatCompact(camp.openedCount)}</span>
                  <span>Clicked: {formatCompact(camp.clickedCount)}</span>
                  <span>Bounced: {formatCompact(camp.bouncedCount)}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {camp.status === "draft" && <button onClick={() => updateCamp(camp.id, { status: "active" })} className="btn-ghost btn-sm text-success"><Play className="h-3.5 w-3.5" /></button>}
                {camp.status === "active" && <button onClick={() => updateCamp(camp.id, { status: "paused" })} className="btn-ghost btn-sm text-warning"><Pause className="h-3.5 w-3.5" /></button>}
                <button onClick={() => deleteCamp(camp.id)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  QUEUE TAB                                                          */
/* ================================================================== */

function QueueTab() {
  const comms = useCommunications();
  const { notifications, retryNotif, cancelNotif } = comms;
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "queued") return notifications.filter((n) => n.status === "queued" || n.status === "sending");
    if (filter === "failed") return notifications.filter((n) => n.status === "failed" || n.status === "bounced");
    return notifications.filter((n) => n.status === filter);
  }, [notifications, filter]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[["all", "All"], ["queued", "Queued"], ["sent", "Sent"], ["delivered", "Delivered"], ["failed", "Failed"], ["cancelled", "Cancelled"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={cn("chip", filter === id && "chip-active")}>{label}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState icon={<Inbox className="h-6 w-6" />} title="No notifications" description="Notifications will appear here as they are sent." /></div>
        ) : (
          <div className="divide-y divide-line max-h-[600px] overflow-y-auto">
            {filtered.map((n) => (
              <div key={n.id} className="flex items-center gap-4 px-4 py-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", n.status === "sent" || n.status === "delivered" ? "bg-success" : n.status === "failed" || n.status === "bounced" ? "bg-danger" : n.status === "queued" || n.status === "sending" ? "bg-accent" : "bg-surface2")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{n.subject}</p>
                  <p className="text-xs text-muted truncate">{n.body.slice(0, 80)}</p>
                  <p className="text-[0.6rem] text-muted mt-0.5">
                    {n.channels.join(", ")} · {n.category} · {formatDateTime(n.createdAt)}
                    {n.failureReason && <span className="text-danger"> · {n.failureReason}</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("badge", STATUS_TONE[n.status])}>{n.status}</span>
                  <span className={cn("badge text-[0.45rem]", PRIORITY_TONE[n.priority])}>{n.priority}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(n.status === "failed" || n.status === "bounced") && (
                    <button onClick={() => retryNotif(n.id)} className="btn-ghost btn-sm" title="Retry"><RefreshCw className="h-3.5 w-3.5" /></button>
                  )}
                  {(n.status === "queued" || n.status === "sending") && (
                    <button onClick={() => cancelNotif(n.id)} className="btn-ghost btn-sm text-danger" title="Cancel"><XCircle className="h-3.5 w-3.5" /></button>
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
/*  ANALYTICS TAB                                                      */
/* ================================================================== */

function AnalyticsTab() {
  const comms = useCommunications();
  const { analytics, channelAnalytics, providerAnalytics } = comms;

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{analytics.overallDeliveryRate}%</p><p className="text-[0.55rem] text-muted">Delivery</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{analytics.overallOpenRate}%</p><p className="text-[0.55rem] text-muted">Open</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{analytics.overallClickRate}%</p><p className="text-[0.55rem] text-muted">Click</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{formatCompact(analytics.totalSent)}</p><p className="text-[0.55rem] text-muted">Sent</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{formatCompact(analytics.totalFailed)}</p><p className="text-[0.55rem] text-muted">Failed</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{analytics.totalBounced}</p><p className="text-[0.55rem] text-muted">Bounced</p></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Channel Breakdown</h3>
          <div className="mt-4 space-y-3">
            {channelAnalytics.filter((c) => c.sent > 0).map((ca) => (
              <div key={ca.channel} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-muted capitalize">{ca.channel.replace("_", " ")}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full", ca.deliveryRate > 95 ? "bg-success" : ca.deliveryRate > 80 ? "bg-warning" : "bg-danger")} style={{ width: `${ca.deliveryRate}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-muted">{formatCompact(ca.sent)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> Provider Performance</h3>
          <div className="mt-4 space-y-3">
            {providerAnalytics.map((pa) => (
              <div key={pa.provider} className="flex items-center justify-between rounded-lg border border-line p-2.5">
                <div>
                  <p className="text-sm font-medium text-ink capitalize">{pa.provider.replace("_", " ")}</p>
                  <p className="text-xs text-muted">{formatCompact(pa.sent)} sent · {pa.avgLatencyMs}ms avg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{pa.deliveryRate}%</p>
                  <p className="text-xs text-muted">{pa.bounced} bounced</p>
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
/*  ALERTS TAB                                                         */
/* ================================================================== */

function AlertsTab() {
  const comms = useCommunications();
  const { systemAlerts, announcements, createAnn, ackAlert, resolveAlertById, deleteAnn } = comms;
  const [showAnn, setShowAnn] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "info" as const, targetAudience: "all" as const });

  const unresolvedAlerts = systemAlerts.filter((a) => !a.resolvedAt);

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Alerts */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> System Alerts ({unresolvedAlerts.length} unresolved)</h3>
          <div className="space-y-2">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className={cn("card p-3.5", !alert.acknowledged && "border-l-2 border-l-warning")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{alert.title}</p>
                      <span className={cn("badge", alert.severity === "critical" ? "bg-danger/15 text-danger" : alert.severity === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{alert.severity}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{alert.body}</p>
                    <p className="text-[0.6rem] text-muted mt-1">{alert.type} · {formatDateTime(alert.createdAt)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!alert.acknowledged && <button onClick={() => ackAlert(alert.id, "admin")} className="btn-ghost btn-sm"><CheckCircle2 className="h-3.5 w-3.5 text-success" /></button>}
                    {!alert.resolvedAt && <button onClick={() => resolveAlertById(alert.id)} className="btn-ghost btn-sm"><XCircle className="h-3.5 w-3.5" /></button>}
                  </div>
                </div>
                {alert.acknowledged && <p className="text-[0.55rem] text-muted mt-1">Acknowledged by {alert.acknowledgedBy} · {alert.acknowledgedAt ? formatDateTime(alert.acknowledgedAt) : ""}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent" /> Announcements</h3>
            <button onClick={() => setShowAnn(!showAnn)} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> New</button>
          </div>

          {showAnn && (
            <div className="card mb-4 p-4">
              <h4 className="text-sm font-medium text-ink mb-3">New Announcement</h4>
              <div className="space-y-2">
                <input className="input-field w-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <textarea className="input-field w-full min-h-[80px]" placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                <div className="flex gap-2">
                  <select className="input-field flex-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                    <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option><option value="maintenance">Maintenance</option>
                  </select>
                  <select className="input-field flex-1" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value as any })}>
                    <option value="all">All</option><option value="admins">Admins</option><option value="customers">Customers</option><option value="suppliers">Suppliers</option><option value="affiliates">Affiliates</option>
                  </select>
                </div>
                <button onClick={() => { createAnn({ title: form.title, body: form.body, type: form.type, channels: ["email", "in_app"], targetAudience: form.targetAudience, status: "active" }); setShowAnn(false); setForm({ title: "", body: "", type: "info", targetAudience: "all" }); }} className="btn-primary btn-sm">
                  <Megaphone className="h-3.5 w-3.5" /> Publish
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {announcements.map((ann) => (
              <div key={ann.id} className="card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{ann.title}</p>
                      <span className={cn("badge", ann.type === "critical" ? "bg-danger/15 text-danger" : ann.type === "warning" ? "bg-warning/15 text-warning" : ann.type === "maintenance" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{ann.type}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{ann.body}</p>
                    <p className="text-[0.6rem] text-muted mt-1">{ann.targetAudience} · {ann.status} · {ann.publishedAt ? formatDateTime(ann.publishedAt) : "Not published"}</p>
                  </div>
                  <button onClick={() => deleteAnn(ann.id)} className="btn-ghost btn-sm shrink-0 text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
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
/*  SETTINGS TAB                                                       */
/* ================================================================== */

function SettingsTab() {
  const comms = useCommunications();
  const { channelIntegrations, preferences, updateChannel } = comms;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Channel Integrations */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> External Channels</h3>
        <div className="mt-4 space-y-3">
          {channelIntegrations.map((ci) => (
            <div key={ci.id} className="flex items-center justify-between rounded-lg border border-line p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink capitalize">{ci.name}</p>
                  <span className={cn("badge", ci.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{ci.active ? "Active" : "Inactive"}</span>
                </div>
                <p className="text-xs text-muted">{ci.description}</p>
                {ci.lastSent && <p className="text-[0.55rem] text-muted mt-0.5">Last sent: {formatDateTime(ci.lastSent)}</p>}
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0 ml-3">
                <input type="checkbox" className="peer sr-only" checked={ci.active} onChange={() => updateChannel(ci.id, { active: !ci.active, configured: !ci.configured })} />
                <div className="h-5 w-9 rounded-full bg-surface2 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* User Preferences */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Communication Preferences</h3>
        <div className="mt-4 space-y-3">
          {preferences.map((pref) => (
            <div key={pref.userId} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">User: {pref.userId}</p>
                <span className={cn("badge", pref.subscribed ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{pref.subscribed ? "Subscribed" : "Unsubscribed"}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                {["email", "sms", "push", "inApp"].filter((ch) => (pref as any)[ch]).map((ch) => <span key={ch} className="badge bg-accent-soft text-accent capitalize">{ch}</span>)}
              </div>
              {pref.doNotDisturb && <p className="text-[0.55rem] text-warning mt-1">Do Not Disturb active</p>}
              <p className="text-[0.55rem] text-muted mt-0.5">{pref.timezone} · {pref.locale} · Updated {formatDateTime(pref.updatedAt)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Rules Summary */}
      <div className="card p-5 lg:col-span-2">
        <h3 className="font-semibold text-ink flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-accent" /> Delivery Configuration</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-medium text-ink">Retry Strategy</p><p className="text-xs text-muted mt-1">Exponential backoff · Max 3 retries</p></div>
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-medium text-ink">Quiet Hours</p><p className="text-xs text-muted mt-1">22:00 — 08:00 local time</p></div>
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-medium text-ink">Dead Letter Queue</p><p className="text-xs text-muted mt-1">Moves after 3 failed retries</p></div>
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-medium text-ink">Email Priority</p><p className="text-xs text-muted mt-1">SES → Mailgun → SendGrid → SMTP</p></div>
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-medium text-ink">Channel Fallback</p><p className="text-xs text-muted mt-1">Email → SMS → Push → In-App</p></div>
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-medium text-ink">Rate Limits</p><p className="text-xs text-muted mt-1">10 emails/sec · 5 SMS/min · 20 push/sec</p></div>
        </div>
      </div>
    </div>
  );
}
