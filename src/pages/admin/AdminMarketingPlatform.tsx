/**
 * ALAYA INSIDER — Enterprise Marketing Platform Admin UI (PART 2.14)
 * 12 tabs: Dashboard | Leads | Audiences | Campaigns | Email & Drip |
 * Automation | A/B Testing | Personalization | Referral & Loyalty |
 * Attribution & Analytics | Growth Forecasts | AI Marketing Assistant
 */
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Target, Megaphone, Mail, Workflow,
  GitCompare, SlidersHorizontal, Gift, BarChart3, TrendingUp, Sparkles,
  Plus, Search, Trash2, Play, Pause, DollarSign, Eye,
  Crown, Award, Gem, Star, Zap, CheckCircle2, XCircle,
  RefreshCw, Download, UserPlus, Filter, Clock, ArrowUpDown,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatCompact, formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getLeads, createLead, updateLead, deleteLead, getScoringRules,
  getAudiences, createAudience, deleteAudience, evaluateAudience,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getEmailCampaigns, createEmailCampaign, getDripSequences,
  getAutomations, updateAutomation, deleteAutomation,
  getAbTests, createAbTest, declareAbTestWinner,
  getPersonalizationRules, createPersonalizationRule,
  getReferralCampaigns,
  getLoyaltyTiers, getLoyaltyTransactions,
  getMarketingDashboard, getMarketingMetrics, getChannelPerformance,
  getGrowthForecasts, generateMarketingReport,
  getAiSuggestions, generateCampaignBrief, generateAiCopy,
  type CampaignGoal,
} from "../../lib/marketingPlatform";

type Tab =
  | "dashboard" | "leads" | "audiences" | "campaigns"
  | "email" | "automation" | "abtesting" | "personalization"
  | "referral" | "analytics" | "forecasts" | "ai";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: UserPlus },
  { id: "audiences", label: "Audiences", icon: Target },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "email", label: "Email & Drip", icon: Mail },
  { id: "automation", label: "Automation", icon: Workflow },
  { id: "abtesting", label: "A/B Testing", icon: GitCompare },
  { id: "personalization", label: "Personalize", icon: SlidersHorizontal },
  { id: "referral", label: "Referral & Loyalty", icon: Gift },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "forecasts", label: "Forecasts", icon: TrendingUp },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
];

export default function AdminMarketingPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Marketing Platform" path="/admin/marketing-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Marketing Platform</h1>
            <p className="mt-1 text-sm text-muted">Enterprise growth engine: campaigns, automation, analytics & AI.</p>
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
        {tab === "leads" && <LeadsTab />}
        {tab === "audiences" && <AudiencesTab />}
        {tab === "campaigns" && <CampaignsTab />}
        {tab === "email" && <EmailTab />}
        {tab === "automation" && <AutomationTab />}
        {tab === "abtesting" && <AbTestingTab />}
        {tab === "personalization" && <PersonalizationTab />}
        {tab === "referral" && <ReferralTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "forecasts" && <ForecastsTab />}
        {tab === "ai" && <AiTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const dash = useMemo(() => getMarketingDashboard(), []);
  const metrics = useMemo(() => getMarketingMetrics(), []);

  const statsList: { label: string; value: string; sub: string; icon: any; tone: string }[] = [
    { label: "Revenue", value: `$${dash.totalRevenue.toLocaleString()}`, sub: `${dash.totalCampaigns} campaigns`, icon: DollarSign, tone: "accent" },
    { label: "Active Campaigns", value: String(dash.activeCampaigns), sub: "Running now", icon: Megaphone, tone: "success" },
    { label: "Leads", value: String(dash.totalLeads), sub: `${dash.hotLeads} hot`, icon: UserPlus, tone: "warning" },
    { label: "Audiences", value: String(dash.totalAudiences), sub: "Segments", icon: Target, tone: "info" },
    { label: "Automations", value: String(dash.activeAutomations), sub: `/ ${dash.totalAutomations} total`, icon: Workflow, tone: "accent" },
    { label: "A/B Tests", value: String(dash.runningAbTests), sub: `/ ${dash.totalAbTests} total`, icon: GitCompare, tone: "accent" },
  ];

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsList.map((s) => (
          <div key={s.label} className="card p-5">
            <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.tone === "success" ? "bg-success/15 text-success" : s.tone === "warning" ? "bg-warning/15 text-warning" : s.tone === "info" ? "bg-info/15 text-info" : "bg-accent-soft text-accent")}><s.icon className="h-5 w-5" /></span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Key Metrics</h3>
          <div className="mt-4 space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger")} />
                  <span className="text-sm text-ink">{m.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{m.unit === "$" ? <Money amount={m.currentValue} /> : `${m.currentValue}${m.unit}`}</span>
                  <span className={cn("text-xs", m.trend === "up" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted")}>
                    {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {m.unit === "$" ? "" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Channel Performance</h3>
          <div className="mt-4 space-y-3">
            {dash.channelPerformance.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-muted capitalize">{ch.channel}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <div className={cn("h-full rounded-full", ch.roi > 1000 ? "bg-success" : ch.roi > 500 ? "bg-accent" : "bg-warning")} style={{ width: `${Math.min(100, ch.roi / 40)}%` }} />
                </div>
                <span className="w-16 text-right text-xs text-muted">{ch.conversions} conv</span>
                <span className="w-16 text-right text-xs font-medium text-ink">{ch.roi}% ROI</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  LEADS TAB                                                          */
/* ================================================================== */

function LeadsTab() {
  const [leads, setLeads] = useState(() => getLeads());
  const [rules, setRules] = useState(() => getScoringRules());
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<typeof leads[0]>>({ name: "", email: "", source: "web_form", tags: [], notes: "", metadata: {} });

  const refresh = () => { setLeads(getLeads()); setRules(getScoringRules()); };
  const filtered = query.trim() ? leads.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()) || l.email.toLowerCase().includes(query.toLowerCase())) : leads;

  const stats = { total: leads.length, hot: leads.filter((l) => l.scoreTier === "hot").length, warm: leads.filter((l) => l.scoreTier === "warm").length, cold: leads.filter((l) => l.scoreTier === "cold").length, converted: leads.filter((l) => l.status === "converted").length };

  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-5 mb-6">
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-ink">{stats.total}</p><p className="text-xs text-muted">Total</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-danger">{stats.hot}</p><p className="text-xs text-muted">Hot</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-warning">{stats.warm}</p><p className="text-xs text-muted">Warm</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-muted">{stats.cold}</p><p className="text-xs text-muted">Cold</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-semibold text-success">{stats.converted}</p><p className="text-xs text-muted">Converted</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads…" className="input-field pl-9" /></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Lead</button>
        <button onClick={refresh} className="btn-ghost btn-sm"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Lead</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Email*" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as any })}>
              <option value="web_form">Web Form</option><option value="popup">Popup</option><option value="referral">Referral</option><option value="social">Social</option><option value="email">Email</option>
            </select>
            <input className="input-field" placeholder="Company" value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input className="input-field" placeholder="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input-field" placeholder="Country" value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name && form.email) { createLead(form as any); setForm({ name: "", email: "", source: "web_form", tags: [], notes: "", metadata: {} }); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create Lead</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((l) => (
          <div key={l.id} className="card flex flex-wrap items-center gap-4 p-4">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold", l.scoreTier === "hot" ? "bg-danger/15 text-danger" : l.scoreTier === "warm" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{l.name[0]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink">{l.name}</p>
                <span className={cn("badge", l.scoreTier === "hot" ? "bg-danger/15 text-danger" : l.scoreTier === "warm" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{l.scoreTier}</span>
                <span className="badge bg-accent-soft text-accent">{l.status}</span>
              </div>
              <p className="text-xs text-muted">{l.email} · {l.company || "—"} · {l.source} · Score: {l.score}</p>
              {l.notes && <p className="text-xs text-muted mt-0.5">{l.notes}</p>}
            </div>
            <div className="flex gap-1">
              <select value={l.status} onChange={(e) => { updateLead(l.id, { status: e.target.value as any }); refresh(); }} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs">
                <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="converted">Converted</option><option value="lost">Lost</option>
              </select>
              <button onClick={() => { deleteLead(l.id); refresh(); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No leads" />}
      </div>

      {rules.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Filter className="h-4 w-4 text-accent" /> Scoring Rules</h3>
          <div className="flex flex-wrap gap-2">
            {rules.map((r) => (
              <span key={r.id} className="badge bg-accent-soft text-accent">{r.name} ({r.points}pts)</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  AUDIENCES TAB                                                     */
/* ================================================================== */

function AudiencesTab() {
  const [audiences, setAudiences] = useState(() => getAudiences());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: "", description: "", source: "rule_based", status: "draft", rules: [], tags: [], color: "#4f6da3" });

  const refresh = () => setAudiences(getAudiences());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{audiences.length} audiences · {audiences.filter((a) => a.status === "active").length} active</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Audience</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Audience</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name) { createAudience(form); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {audiences.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full" style={{ backgroundColor: a.color + "20", color: a.color }}><Target className="h-4 w-4" /></span>
                <div>
                  <p className="font-medium text-ink text-sm">{a.name}</p>
                  <p className="text-xs text-muted">{a.memberCount} members · ~{a.estimatedReach} reach</p>
                </div>
              </div>
              <span className={cn("badge", a.status === "active" ? "bg-success/15 text-success" : a.status === "draft" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{a.status}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{a.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {a.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted">{t}</span>)}
              <span className="badge bg-accent-soft text-accent capitalize">{a.source.replace("_", " ")}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { evaluateAudience(a.id); refresh(); }} className="btn-ghost btn-sm text-xs"><RefreshCw className="h-3 w-3" /> Evaluate</button>
              <button onClick={() => { deleteAudience(a.id); refresh(); }} className="btn-ghost btn-sm text-xs text-danger"><Trash2 className="h-3 w-3" /></button>
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
  const [campaigns, setCampaigns] = useState(() => getCampaigns());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: "", description: "", goal: "conversion", channels: ["email"], audienceIds: [], budget: 0, status: "draft", tags: [], utmSource: "alaya", utmMedium: "", utmCampaign: "" });

  const refresh = () => setCampaigns(getCampaigns());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{campaigns.length} campaigns · {campaigns.filter((c) => c.status === "active").length} active · ${campaigns.reduce((s, c) => s + c.budget, 0).toLocaleString()} budget</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Campaign</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Campaign</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="input-field" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              <option value="conversion">Conversion</option><option value="awareness">Awareness</option><option value="consideration">Consideration</option>
              <option value="retention">Retention</option><option value="reactivation">Reactivation</option><option value="loyalty">Loyalty</option>
            </select>
            <input className="input-field" type="number" placeholder="Budget ($)" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
          </div>
          <button onClick={() => { if (form.name) { createCampaign(form); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", c.status === "active" ? "bg-success/15 text-success" : c.status === "draft" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}><Megaphone className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{c.name}</p>
                  <span className={cn("badge", c.status === "active" ? "bg-success/15 text-success" : c.status === "draft" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{c.status}</span>
                  <span className="badge bg-accent-soft text-accent capitalize">{c.goal}</span>
                </div>
                <p className="text-xs text-muted">{c.description} · ${c.spend.toLocaleString()} spent of ${c.budget.toLocaleString()} · v{c.version}</p>
                <div className="mt-1 flex gap-3 text-xs text-muted">
                  <span>{formatCompact(c.analytics.impressions)} impressions</span>
                  <span>{formatCompact(c.analytics.clicks)} clicks</span>
                  <span>{c.analytics.ctr}% CTR</span>
                  <span>{c.analytics.conversions} conv</span>
                  <span>${c.analytics.revenue.toLocaleString()} rev</span>
                </div>
              </div>
              <div className="flex gap-1">
                {c.status === "draft" && <button onClick={() => { updateCampaign(c.id, { status: "active" }); refresh(); }} className="btn-ghost btn-sm text-success"><Play className="h-3.5 w-3.5" /></button>}
                {c.status === "active" && <button onClick={() => { updateCampaign(c.id, { status: "paused" }); refresh(); }} className="btn-ghost btn-sm text-warning"><Pause className="h-3.5 w-3.5" /></button>}
                <button onClick={() => { deleteCampaign(c.id); refresh(); }} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EMAIL & DRIP TAB                                                   */
/* ================================================================== */

function EmailTab() {
  const [emailCampaigns] = useState(() => getEmailCampaigns());
  const [drips] = useState(() => getDripSequences());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: "", campaignId: "", subject: "", bodyText: "", bodyHtml: "", senderName: "ALAYA INSIDER", senderEmail: "editorial@alayainsider.com", replyTo: "editorial@alayainsider.com", preheader: "", status: "draft" });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{emailCampaigns.length} emails · {drips.length} drip sequences</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Email</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Email Campaign</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Subject*" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <input className="input-field sm:col-span-2" placeholder="Preheader" value={form.preheader} onChange={(e) => setForm({ ...form, preheader: e.target.value })} />
            <textarea className="input-field sm:col-span-2 min-h-[80px]" placeholder="Body text" value={form.bodyText} onChange={(e) => setForm({ ...form, bodyText: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name && form.subject) { createEmailCampaign({ ...form, version: 1, campaignId: form.campaignId || "cmp_1" }); setShowForm(false); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold text-ink mb-3">Email Campaigns</h3>
          <div className="space-y-2">
            {emailCampaigns.map((e) => (
              <div key={e.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">{e.name}</p>
                    <p className="text-xs text-muted">{e.subject}</p>
                  </div>
                  <span className={cn("badge", e.status === "sent" ? "bg-success/15 text-success" : e.status === "ready" ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-ink mb-3">Drip Sequences</h3>
          <div className="space-y-2">
            {drips.map((d) => (
              <div key={d.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink text-sm">{d.name}</p>
                    <p className="text-xs text-muted">{d.steps.length} steps · {d.analytics.totalEnrolled} enrolled · {d.analytics.conversionRate}% conversion</p>
                  </div>
                  <span className={cn("badge", d.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{d.status}</span>
                </div>
                <div className="mt-1 flex gap-2 text-xs text-muted">
                  {d.steps.map((s) => <span key={s.id} className="badge bg-surface2">Day {s.delayDays}</span>)}
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
/*  AUTOMATION TAB                                                     */
/* ================================================================== */

function AutomationTab() {
  const [automations, setAutomations] = useState(() => getAutomations());
  const refresh = () => setAutomations(getAutomations());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{automations.length} automations · {automations.filter((a) => a.status === "active").length} active</p>
      <div className="space-y-3">
        {automations.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", a.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}><Zap className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{a.name}</p>
                  <span className={cn("badge", a.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{a.status}</span>
                  <span className="badge bg-accent-soft text-accent capitalize">v{a.version}</span>
                </div>
                <p className="text-xs text-muted">{a.description} · Trigger: {a.trigger.type.replace(/_/g, " ")} · {a.steps.length} steps</p>
                <div className="mt-1 flex gap-3 text-xs text-muted">
                  <span>{a.stats.totalEntered} entered</span>
                  <span>{a.stats.totalCompleted} completed</span>
                  <span>{a.stats.conversionRate}% conv</span>
                </div>
              </div>
              <div className="flex gap-1">
                {a.status === "draft" && <button onClick={() => { updateAutomation(a.id, { status: "active" }); refresh(); }} className="btn-ghost btn-sm text-success"><Play className="h-3.5 w-3.5" /></button>}
                {a.status === "active" && <button onClick={() => { updateAutomation(a.id, { status: "paused" }); refresh(); }} className="btn-ghost btn-sm text-warning"><Pause className="h-3.5 w-3.5" /></button>}
                <button onClick={() => { deleteAutomation(a.id); refresh(); }} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {a.steps.map((s, i) => (
                <span key={s.id} className="badge bg-surface2 text-muted flex items-center gap-1">
                  {i + 1}. {s.type.replace(/_/g, " ")}
                  {s.delayMinutes > 0 && <Clock className="h-3 w-3" />}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  A/B TESTING TAB                                                    */
/* ================================================================== */

function AbTestingTab() {
  const [tests, setTests] = useState(() => getAbTests());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: "", description: "", type: "subject_line", status: "draft", variants: [{ id: "v1", name: "Control", content: "", trafficPercent: 50, impressions: 0, conversions: 0, conversionRate: 0, isControl: true }, { id: "v2", name: "Variant A", content: "", trafficPercent: 50, impressions: 0, conversions: 0, conversionRate: 0, isControl: false }], audienceSplit: 100, sampleSize: 1000, confidenceLevel: 95, durationDays: 7 });

  const refresh = () => setTests(getAbTests());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{tests.length} tests · {tests.filter((t) => t.status === "running").length} running</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Test</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New A/B Test</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="subject_line">Subject Line</option><option value="cta">CTA</option><option value="content">Content</option><option value="layout">Layout</option>
            </select>
            <input className="input-field" type="number" placeholder="Sample size" value={form.sampleSize} onChange={(e) => setForm({ ...form, sampleSize: Number(e.target.value) })} />
            <input className="input-field" type="number" placeholder="Duration (days)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} />
            <input className="input-field sm:col-span-2" placeholder="Variant A content" value={form.variants[1].content} onChange={(e) => setForm({ ...form, variants: [{ ...form.variants[0] }, { ...form.variants[1], content: e.target.value }] })} />
          </div>
          <button onClick={() => { if (form.name) { createAbTest(form); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {tests.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.description} · {t.type.replace(/_/g, " ")} · {t.durationDays}d</p>
                </div>
              </div>
              <span className={cn("badge", t.status === "running" ? "bg-success/15 text-success" : t.status === "completed" ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>{t.status}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {t.variants.map((v) => (
                <div key={v.id} className={cn("rounded-lg border p-3", v.isControl ? "border-accent/30" : "border-line")}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">{v.name} {v.isControl && "(Control)"}</span>
                    <span className="text-xs text-muted">{v.trafficPercent}% traffic</span>
                  </div>
                  <p className="mt-1 text-xs text-muted truncate">{v.content}</p>
                  <div className="mt-1 flex gap-2 text-xs text-muted">
                    <span>{v.impressions} impressions</span>
                    <span>{v.conversions} conv</span>
                    <span className="font-medium text-ink">{v.conversionRate}%</span>
                  </div>
                </div>
              ))}
            </div>
            {t.status === "running" && (
              <div className="mt-3 flex gap-2">
                {t.variants.map((v) => (
                  <button key={v.id} onClick={() => { declareAbTestWinner(t.id, v.id); refresh(); }} className="btn-ghost btn-sm text-xs">Declare "{v.name}" winner</button>
                ))}
              </div>
            )}
            {t.status === "completed" && t.winnerId && (
              <p className="mt-2 text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Winner: {t.variants.find((v) => v.id === t.winnerId)?.name} ({t.metrics.liftOverControl}% lift, {t.metrics.winnerConfidence}% confidence)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PERSONALIZATION TAB                                                */
/* ================================================================== */

function PersonalizationTab() {
  const [rules, setRules] = useState(() => getPersonalizationRules());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: "", description: "", channel: "web", condition: { field: "", operator: "equals", value: "" }, action: { type: "show_banner", config: {} }, priority: 50, enabled: true });

  const refresh = () => setRules(getPersonalizationRules());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{rules.length} personalization rules</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Rule</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Personalization Rule</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-field" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="web">Web</option><option value="email">Email</option><option value="push">Push</option><option value="in_app">In-App</option>
            </select>
            <input className="input-field" placeholder="Condition field" value={form.condition.field} onChange={(e) => setForm({ ...form, condition: { ...form.condition, field: e.target.value } })} />
            <input className="input-field" placeholder="Condition value" value={form.condition.value} onChange={(e) => setForm({ ...form, condition: { ...form.condition, value: e.target.value } })} />
          </div>
          <button onClick={() => { if (form.name) { createPersonalizationRule(form); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="card flex items-center gap-4 p-4">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", r.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}><SlidersHorizontal className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink text-sm">{r.name}</p>
                <span className="badge bg-accent-soft text-accent capitalize">{r.channel}</span>
                <span className={cn("badge", r.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{r.enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <p className="text-xs text-muted">{r.description} · Priority: {r.priority}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  REFERRAL & LOYALTY TAB                                            */
/* ================================================================== */

function ReferralTab() {
  const [refCampaigns] = useState(() => getReferralCampaigns());
  const [loyaltyTiers] = useState(() => getLoyaltyTiers());
  const [txs] = useState(() => getLoyaltyTransactions());
  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referral Campaigns */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-accent" /> Referral Campaigns</h3>
          <div className="space-y-2">
            {refCampaigns.map((r) => (
              <div key={r.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">{r.name}</p>
                    <p className="text-xs text-muted">{r.referrerReward} · {r.analytics.totalConversions} conversions · ${r.analytics.revenueGenerated.toLocaleString()} revenue</p>
                  </div>
                  <span className={cn("badge", r.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{r.status}</span>
                </div>
                <div className="mt-1 flex gap-2 text-xs text-muted">
                  <span>{r.analytics.totalClicks} clicks</span>
                  <span>{r.analytics.totalSignups} signups</span>
                  <span>{r.analytics.conversionRate}% conv</span>
                  <span>{r.analytics.roi}% ROI</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Tiers */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Crown className="h-4 w-4 text-accent" /> Loyalty Tiers</h3>
          <div className="grid gap-3">
            {loyaltyTiers.map((t, i) => (
              <div key={t.id} className={cn("card p-3", i === loyaltyTiers.length - 1 && "ring-1 ring-accent/40")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {i === 0 ? <Star className="h-4 w-4" style={{ color: t.color }} /> : i === 1 ? <Award className="h-4 w-4" style={{ color: t.color }} /> : i === 2 ? <Crown className="h-4 w-4" style={{ color: t.color }} /> : <Gem className="h-4 w-4" style={{ color: t.color }} />}
                    <div>
                      <p className="font-medium text-ink text-sm">{t.name}</p>
                      <p className="text-xs text-muted">{t.minPoints}+ pts · {t.pointsMultiplier}x multiplier</p>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                  {t.benefits.map((b) => <span key={b} className="badge bg-accent-soft/50 text-accent">{b}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loyalty Transactions */}
      <div className="mt-6">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><ArrowUpDown className="h-4 w-4 text-accent" /> Recent Transactions</h3>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Points</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {txs.slice(0, 10).map((tx) => (
                <tr key={tx.id} className="hover:bg-surface2/40">
                  <td className="px-4 py-3 text-ink">{tx.customerId}</td>
                  <td className="px-4 py-3"><span className={cn("badge", tx.type === "earn" ? "bg-success/15 text-success" : tx.type === "spend" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{tx.type}</span></td>
                  <td className="px-4 py-3 font-mono text-ink">{tx.points > 0 ? "+" : ""}{tx.points}</td>
                  <td className="px-4 py-3 font-mono text-ink">{tx.balance}</td>
                  <td className="px-4 py-3 text-muted">{tx.reason}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ANALYTICS TAB                                                      */
/* ================================================================== */

function AnalyticsTab() {
  const metrics = useMemo(() => getMarketingMetrics(), []);
  const channelPerf = useMemo(() => getChannelPerformance(), []);
  const [report, setReport] = useState<any>(null);

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> All Metrics</h3>
          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger")} />
                  <div>
                    <p className="text-sm text-ink">{m.name}</p>
                    <p className="text-xs text-muted">Target: {m.targetValue}{m.unit} · Prev: {m.previousValue}{m.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">{m.unit === "$" ? <Money amount={m.currentValue} /> : `${m.currentValue}${m.unit}`}</p>
                  <span className={cn("text-xs", m.trend === "up" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted")}>{m.trend === "up" ? "↑" : "↓"} {m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Channel Performance</h3>
          <div className="space-y-3">
            {channelPerf.map((ch) => (
              <div key={ch.channel} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink capitalize">{ch.channel}</span>
                  <span className="text-sm font-semibold text-ink"><Money amount={ch.revenue} /></span>
                </div>
                <div className="flex gap-3 text-xs text-muted">
                  <span>Spent: <Money amount={ch.spend} /></span>
                  <span>CAC: <Money amount={ch.cac} /></span>
                  <span>ROI: {ch.roi}%</span>
                  <span>CVR: {ch.cvr}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Download className="h-4 w-4 text-accent" /> Reports</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(["channel", "campaign", "roi", "attribution", "forecast"] as const).map((type) => (
            <button key={type} onClick={() => setReport(generateMarketingReport(type))} className="chip capitalize">{type} Report</button>
          ))}
        </div>
        {report && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-ink">{report.title}</p>
              <button onClick={() => setReport(null)} className="btn-ghost btn-sm"><XCircle className="h-3.5 w-3.5" /></button>
            </div>
            <pre className="text-xs text-muted whitespace-pre-wrap max-h-60 overflow-y-auto">{JSON.stringify(report.data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FORECASTS TAB                                                      */
/* ================================================================== */

function ForecastsTab() {
  const forecasts = useMemo(() => getGrowthForecasts(), []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">Growth forecasts · next month & quarter projections</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forecasts.map((f) => (
          <div key={f.metric} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink text-sm">{f.metric}</p>
              <span className={cn("h-2 w-2 rounded-full", f.trend === "up" ? "bg-success" : "bg-danger")} />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">
              {typeof f.currentValue === "number" ? (f.metric.includes("$") || f.metric.includes("Revenue") || f.metric.includes("CAC") ? `$${f.currentValue.toLocaleString()}` : f.currentValue) : f.currentValue}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">Month: <span className="font-medium text-ink">{typeof f.predictedNextMonth === "number" ? (f.metric.includes("$") || f.metric.includes("Revenue") || f.metric.includes("CAC") ? `$${f.predictedNextMonth.toLocaleString()}` : f.predictedNextMonth) : f.predictedNextMonth}</span></span>
              <span className="text-muted">Quarter: <span className="font-medium text-ink">{typeof f.predictedNextQuarter === "number" ? (f.metric.includes("$") || f.metric.includes("Revenue") || f.metric.includes("CAC") ? `$${f.predictedNextQuarter.toLocaleString()}` : f.predictedNextQuarter) : f.predictedNextQuarter}</span></span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              <span className="text-muted">Confidence: </span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${f.confidence * 100}%` }} />
              </div>
              <span className="font-medium text-ink">{Math.round(f.confidence * 100)}%</span>
            </div>
            <div className="mt-2 text-xs text-muted">
              <span>Drivers: {f.drivers.join(", ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AI ASSISTANT TAB                                                   */
/* ================================================================== */

function AiTab() {
  const [suggestions] = useState(() => getAiSuggestions());
  const [briefResult, setBriefResult] = useState<any>(null);
  const [briefForm, setBriefForm] = useState({ goal: "conversion" as CampaignGoal, targetAudience: "", budget: 5000 });
  const [copyType, setCopyType] = useState<"subject_line" | "cta" | "body" | "social">("subject_line");
  const [copyContext, setCopyContext] = useState("");
  const [copyResults, setCopyResults] = useState<string[]>([]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* AI Suggestions */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Suggestions</h3>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("badge", s.impact === "high" ? "bg-danger/15 text-danger" : s.impact === "medium" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{s.impact}</span>
                  <p className="text-sm font-medium text-ink">{s.title}</p>
                </div>
                <span className="text-xs text-muted">{Math.round(s.confidence * 100)}%</span>
              </div>
              <p className="mt-1 text-xs text-muted">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Brief Generator */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent" /> Campaign Brief Generator</h3>
        <div className="space-y-3">
          <select className="input-field w-full" value={briefForm.goal} onChange={(e) => setBriefForm({ ...briefForm, goal: e.target.value as any })}>
            <option value="conversion">Conversion</option><option value="awareness">Awareness</option><option value="retention">Retention</option><option value="loyalty">Loyalty</option>
          </select>
          <input className="input-field w-full" placeholder="Target audience" value={briefForm.targetAudience} onChange={(e) => setBriefForm({ ...briefForm, targetAudience: e.target.value })} />
          <input className="input-field w-full" type="number" placeholder="Budget ($)" value={briefForm.budget} onChange={(e) => setBriefForm({ ...briefForm, budget: Number(e.target.value) })} />
          <button onClick={() => setBriefResult(generateCampaignBrief(briefForm))} className="btn-primary btn-sm w-full"><Sparkles className="h-4 w-4" /> Generate Brief</button>
          {briefResult && (
            <div className="rounded-lg bg-accent-soft/30 p-3 text-sm">
              <p className="font-medium text-ink">{briefResult.campaignName}</p>
              <p className="text-xs text-muted mt-1">Target: {briefResult.targetAudience} · Est. Reach: {briefResult.estimatedReach}</p>
              <p className="text-xs text-muted">Est. Revenue: ${briefResult.estimatedRevenue.toLocaleString()} · Budget: ${briefResult.suggestedBudget}</p>
              <div className="mt-2">
                <p className="text-xs font-medium text-ink">Copy suggestions:</p>
                {briefResult.copySuggestions.map((s: string, i: number) => <p key={i} className="text-xs text-muted">• {s}</p>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Copy Generator */}
      <div className="card p-5 lg:col-span-2">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-accent" /> AI Copy Generator</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(["subject_line", "cta", "body", "social"] as const).map((t) => (
            <button key={t} onClick={() => setCopyType(t)} className={cn("chip capitalize", copyType === t && "chip-active")}>{t.replace("_", " ")}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <input className="input-field flex-1" placeholder="Context (e.g., Summer Collection)" value={copyContext} onChange={(e) => setCopyContext(e.target.value)} />
          <button onClick={() => setCopyResults(generateAiCopy(copyType, copyContext || "new collection"))} className="btn-primary btn-sm"><Sparkles className="h-4 w-4" /> Generate</button>
        </div>
        {copyResults.length > 0 && (
          <div className="mt-3 space-y-1">
            {copyResults.map((r, i) => (
              <div key={i} className="rounded-lg border border-line p-2 text-sm text-ink">• {r}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
