import { useEffect, useMemo, useState } from "react";
import {
  Users, UserPlus, Search, BarChart3, TrendingUp, Award,
  Crown, Eye, Smile, Download, Upload, Sparkles, Zap,
  Activity, Brain, AlertTriangle, MessageSquare,
  GitBranch, Star,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getCxProfiles, searchCxProfiles, getCxProfile,
  getCxTimeline, getCxSegments, getCxIntelligenceDashboard,
  getRecommendationModels, getRecommendationAnalytics,
  getCxFeedback, getNpsResponses, getSentimentSummary,
  getCxJourneys, createCxJourney, updateCxJourney, deleteCxJourney,
  getCxForecasts, getCxReport, getPersonalizationContext,
  getAiCustomerSummary, predictCustomerSegment, generateCxInsights,
  exportCxProfiles, importCxProfiles,
  type CxCustomerProfile, type CxJourney,
} from "../../lib/customerExperience";

type CxTab = "dashboard" | "intelligence" | "profiles" | "segments" | "scoring" | "recommendations" | "journeys" | "feedback" | "forecasts";

export default function AdminCustomerExperience() {
  const { toast } = useToast();
  const [tab, setTab] = useState<CxTab>("dashboard");
  const [profiles, setProfiles] = useState<CxCustomerProfile[]>([]);
  const [query, setQuery] = useState("");

  const refresh = () => setProfiles(getCxProfiles());
  useEffect(() => { refresh(); }, []);

  const dash = useMemo(() => getCxIntelligenceDashboard(), [profiles]);
  const segments = useMemo(() => getCxSegments(), []);
  const filtered = useMemo(() => query ? searchCxProfiles(query) : profiles, [query, profiles]);

  const STATS = [
    { label: "Total Customers", value: String(dash.totalCustomers), sub: `${dash.activeCustomers} active · ${dash.vipCustomers} VIP`, icon: Users, color: "text-accent bg-accent-soft" },
    { label: "New This Month", value: String(dash.newCustomersThisMonth), sub: `${dash.newCustomersToday} today`, icon: UserPlus, color: "text-success bg-success/15" },
    { label: "Avg LTV", value: `$${dash.averageLifetimeValue}`, sub: `${dash.averageHealthScore}% avg health`, icon: Award, color: "text-info bg-info/15" },
    { label: "NPS Score", value: String(dash.npsScore), sub: `${dash.promoterCount} promoters · ${dash.detractorCount} detractors`, icon: Smile, color: "text-warning bg-warning/15" },
    { label: "At Risk", value: String(dash.atRiskCustomers), sub: `${dash.churnRate}% churn rate`, icon: AlertTriangle, color: "text-danger bg-danger/15" },
    { label: "Segments", value: String(dash.segmentCount), sub: `Top: ${dash.topSegment}`, icon: GitBranch, color: "text-accent bg-accent-soft" },
  ];

  const TABS: { id: CxTab; label: string; icon: typeof BarChart3 }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "intelligence", label: "Intelligence", icon: Brain },
    { id: "profiles", label: "Profiles", icon: Users },
    { id: "segments", label: "Segments", icon: GitBranch },
    { id: "scoring", label: "Scoring", icon: Activity },
    { id: "recommendations", label: "Recommendations", icon: Star },
    { id: "journeys", label: "Journeys", icon: TrendingUp },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "forecasts", label: "Forecasts", icon: Eye },
  ];

  const handleExport = () => {
    const json = exportCxProfiles();
    navigator.clipboard?.writeText(json);
    toast.success("Profiles exported to clipboard");
  };

  return (
    <>
      <Seo title="Customer Experience Platform" path="/admin/customer-experience" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Customer Experience Platform</h1>
            <p className="mt-1 text-sm text-muted">Customer 360 · Personalization · Intelligence · Segmentation · Journeys</p>
          </div>
          <div className="flex flex-wrap gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize whitespace-nowrap", tab === id && "chip-active")}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {STATS.map((s) => (
                <div key={s.label} className="card p-4">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full", s.color)}><s.icon className="h-4.5 w-4.5" /></span>
                  <p className="mt-3 font-display text-xl font-semibold text-ink">{s.value}</p>
                  <p className="text-xs text-muted">{s.label}</p>
                  <p className="text-[0.6rem] text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Users className="h-4 w-4 text-accent" /> Customer Health Trends</h3>
                <div className="mt-4 space-y-3">
                  {profiles.slice(0, 5).map((p) => (
                    <div key={p.customerId} className="flex items-center justify-between rounded-xl border border-line p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink truncate">{p.name}</span>
                          {p.type === "vip" && <Crown className="h-3.5 w-3.5 text-warning shrink-0" />}
                        </div>
                        <p className="text-xs text-muted truncate">{p.email}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-center"><p className={cn("font-semibold", p.scores.health >= 70 ? "text-success" : p.scores.health >= 40 ? "text-warning" : "text-danger")}>{p.scores.health}</p><p className="text-muted">Health</p></div>
                        <div className="text-center"><p className="font-semibold text-ink">{p.scores.engagement}</p><p className="text-muted">Eng</p></div>
                        <div className="text-center"><p className="font-semibold text-ink">${p.scores.lifetimeValue}</p><p className="text-muted">LTV</p></div>
                      </div>
                    </div>
                  ))}
                  {profiles.length === 0 && <p className="text-xs text-muted">No customer data yet.</p>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><GitBranch className="h-4 w-4 text-accent" /> Segment Performance</h3>
                <div className="mt-4 space-y-2">
                  {segments.sort((a, b) => b.memberCount - a.memberCount).slice(0, 6).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-line p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{s.name}</p>
                        <p className="text-[0.6rem] text-muted">{s.type.replace(/_/g, " ")} · {s.memberCount} members</p>
                      </div>
                      <span className="text-xs font-medium text-ink">${s.estimatedRevenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Smile className="h-4 w-4 text-accent" /> Sentiment Overview</h3>
                <div className="mt-4 space-y-1">
                  {(() => { const ss = getSentimentSummary(); return ss.distribution.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted">{d.label.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface2">
                          <div className={cn("h-full rounded-full", d.label.includes("positive") ? "bg-success" : d.label.includes("negative") ? "bg-danger" : "bg-muted")} style={{ width: `${d.percentage}%` }} />
                        </div>
                        <span className="w-8 text-right font-medium text-ink">{d.count}</span>
                      </div>
                    </div>
                  )); })()}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Brain className="h-4 w-4 text-accent" /> AI Insights</h3>
                {profiles.slice(0, 3).map((p) => {
                  const ai = getAiCustomerSummary(p.customerId);
                  return (
                    <div key={p.customerId} className="mt-3 rounded-xl border border-line p-3">
                      <p className="text-xs font-medium text-ink">{p.name}</p>
                      <p className="mt-1 text-[0.6rem] text-muted">{ai.summary}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="badge bg-accent-soft text-accent text-[0.5rem]">{ai.persona}</span>
                        <span className="text-[0.5rem] text-muted">Risk: {Math.round(ai.churnRisk * 100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Star className="h-4 w-4 text-accent" /> Recommendation Performance</h3>
                {(() => { const ra = getRecommendationAnalytics(); return (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">Impressions</span><span className="font-medium text-ink">{ra.totalImpressions}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">Clicks</span><span className="font-medium text-ink">{ra.totalClicks}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">CTR</span><span className="font-medium text-ink">{ra.clickThroughRate}%</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">Conversions</span><span className="font-medium text-ink">{ra.totalConversions}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">Revenue Attributed</span><span className="font-medium text-success">${ra.revenueAttributed}</span></div>
                  </div>
                ); })()}
              </div>
            </div>
          </>
        )}

        {/* INTELLIGENCE */}
        {tab === "intelligence" && <IntelligenceTab profiles={profiles} />}

        {/* PROFILES */}
        {tab === "profiles" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="input-field !pl-9" placeholder="Search customers..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <button onClick={handleExport} className="btn-ghost btn-sm"><Download className="h-4 w-4" /> Export</button>
              <button onClick={() => { navigator.clipboard?.readText().then((t) => { const r = importCxProfiles(t); toast.success(`Imported ${r.imported} profiles`); refresh(); }); }} className="btn-ghost btn-sm"><Upload className="h-4 w-4" /> Import</button>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6"><EmptyState icon={<Users className="h-6 w-6" />} title="No profiles" description="Customer profiles appear once customers register and interact with the store." /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {filtered.map((p) => (
                  <ProfileCard key={p.customerId} profile={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEGMENTS */}
        {tab === "segments" && <SegmentsTab segments={segments} profiles={profiles} />}

        {/* SCORING */}
        {tab === "scoring" && <ScoringTab profiles={profiles} />}

        {/* RECOMMENDATIONS */}
        {tab === "recommendations" && <RecommendationsTab />}

        {/* JOURNEYS */}
        {tab === "journeys" && <JourneysTab />}

        {/* FEEDBACK */}
        {tab === "feedback" && <FeedbackTab />}

        {/* FORECASTS */}
        {tab === "forecasts" && <ForecastsTab profiles={profiles} />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  PROFILE CARD                                                        */
/* ================================================================== */
function ProfileCard({ profile }: { profile: CxCustomerProfile }) {
  const [expanded, setExpanded] = useState(false);
  const scores = profile.scores;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold", profile.type === "vip" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>
          {profile.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink">{profile.name}</p>
            {profile.type === "vip" && <Crown className="h-3.5 w-3.5 text-warning" />}
            {profile.segments.slice(0, 3).map((seg) => (
              <span key={seg} className="badge bg-accent-soft text-accent text-[0.55rem]">{seg.replace("seg_", "")}</span>
            ))}
            <span className={cn("badge", profile.status === "active" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{profile.status}</span>
          </div>
          <p className="text-xs text-muted">{profile.email} · {profile.country || "N/A"} · {profile.totalOrders} orders · ${profile.totalSpent}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="text-center"><p className={cn("font-semibold", scores.health >= 70 ? "text-success" : scores.health >= 40 ? "text-warning" : "text-danger")}>{scores.health}</p><p className="text-muted">Health</p></div>
          <div className="text-center"><p className="font-semibold text-ink">{scores.engagement}</p><p className="text-muted">Eng</p></div>
          <div className="text-center"><p className="font-semibold text-ink">{scores.loyalty}</p><p className="text-muted">Loyal</p></div>
          <div className="text-center"><p className="font-semibold text-ink">${scores.lifetimeValue}</p><p className="text-muted">LTV</p></div>
          <button onClick={() => setExpanded(!expanded)} className="btn-ghost btn-sm">{expanded ? "Less" : "More"}</button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-medium text-muted mb-2">Scores Detail</p>                          {Object.keys(scores).filter((k) => !["lifetimeValue", "churnProbability", "nextPurchaseProbability"].includes(k)).map((key) => {
                            const val = (scores as unknown as Record<string, number>)[key];
                            return (
                              <div key={key} className="flex items-center justify-between text-xs py-1">
                                <span className="text-muted capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                                <span className="font-medium text-ink">{val}</span>
                              </div>
                            );
                          })}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-muted">Churn Prob</span>
              <span className={cn("font-medium", scores.churnProbability > 0.3 ? "text-danger" : "text-success")}>{Math.round(scores.churnProbability * 100)}%</span>
            </div>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-medium text-muted mb-2">Preferences</p>
            <div className="flex flex-wrap gap-1">
              {profile.preferences.favoriteCategories.map((c) => <span key={c} className="badge bg-info/15 text-info text-[0.55rem]">{c}</span>)}
              {profile.preferences.favoriteBrands.map((b) => <span key={b} className="badge bg-accent-soft text-accent text-[0.55rem]">{b}</span>)}
            </div>
            <p className="mt-2 text-xs text-muted">Budget: {profile.preferences.budgetLevel} · Style: {profile.preferences.styleTags.join(", ")}</p>
            <p className="text-xs text-muted">Price range: ${profile.preferences.priceRangeMin} - ${profile.preferences.priceRangeMax}</p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-medium text-muted mb-2">AI Insights</p>
            {(() => { const ai = getAiCustomerSummary(profile.customerId); return (
              <>
                <p className="text-xs text-ink">{ai.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="badge bg-accent-soft text-accent text-[0.55rem]">{ai.persona}</span>
                  <span className="badge bg-warning/15 text-warning text-[0.55rem]">Next: {ai.nextBestAction}</span>
                </div>
              </>
            ); })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  INTELLIGENCE TAB                                                    */
/* ================================================================== */
function IntelligenceTab({ profiles }: { profiles: CxCustomerProfile[] }) {
  const [selectedId, setSelectedId] = useState("");

  const insights = selectedId ? generateCxInsights(getCxProfile(selectedId)!) : [];
  const predictions = selectedId ? predictCustomerSegment(selectedId) : [];
  const timeline = selectedId ? getCxTimeline(selectedId, 10) : [];
  const ctx = selectedId ? getPersonalizationContext(selectedId) : null;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <div className="card p-4">
          <h3 className="font-semibold text-ink mb-3">Select Customer</h3>
          <select className="input-field w-full" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Choose a customer...</option>
            {profiles.map((p) => <option key={p.customerId} value={p.customerId}>{p.name} ({p.email})</option>)}
          </select>
        </div>
        {predictions.length > 0 && (
          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Sparkles className="h-4 w-4 text-accent" /> Segment Predictions</h3>
            <div className="mt-3 space-y-2">
              {predictions.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line p-2 text-xs">
                  <span className="text-ink">{p.segment}</span>
                  <span className="font-medium text-accent">{Math.round(p.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedId && (
          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Eye className="h-4 w-4 text-accent" /> Personalization Context</h3>
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-muted">Hero: <span className="text-ink">{ctx?.heroCopy.title}</span></p>
              <p className="text-muted">Categories: <span className="text-ink">{ctx?.featuredCategories.join(", ")}</span></p>
              {ctx?.discountOffer && <p className="text-muted">Offer: <span className="text-success">{ctx.discountOffer.code} ({ctx.discountOffer.value}% off)</span></p>}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {insights.length > 0 && (
          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Brain className="h-4 w-4 text-accent" /> AI Insights ({insights.length})</h3>
            <div className="mt-3 space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-start gap-2">
                    <span className={cn("badge shrink-0", ins.type.includes("churn") ? "bg-danger/15 text-danger" : ins.type.includes("upsell") ? "bg-success/15 text-success" : "bg-info/15 text-info")}>{ins.type.replace(/_/g, " ")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{ins.title}</p>
                      <p className="text-xs text-muted mt-0.5">{ins.description}</p>
                      <p className="text-xs text-accent mt-1">→ {ins.suggestedAction}</p>
                    </div>
                    <span className="text-[0.55rem] text-muted">{Math.round(ins.confidence * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {timeline.length > 0 && (
          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> Timeline</h3>
            <div className="mt-3 space-y-1">
              {timeline.map((t) => (
                <div key={t.id} className="flex items-start gap-3 rounded-lg border border-line p-2 text-xs">
                  <span className={cn("badge shrink-0", t.severity === "success" ? "bg-success/15 text-success" : t.severity === "warning" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{t.type}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink">{t.label}</p>
                    <p className="text-muted">{formatDateTime(t.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedId && (
          <div className="card p-8 text-center">
            <Brain className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 font-medium text-ink">Select a customer to see AI-powered intelligence</p>
            <p className="mt-1 text-xs text-muted">Insights, predictions, personalization, and timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SEGMENTS TAB                                                        */
/* ================================================================== */
function SegmentsTab({ segments, profiles }: { segments: any[]; profiles: CxCustomerProfile[] }) {
  return (
    <div className="mt-6">
      <p className="text-sm text-muted">{segments.length} segments · {profiles.length} total profiles</p>
      {segments.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<GitBranch className="h-6 w-6" />} title="No segments" description="Create rule-based or AI segments to group customers." /></div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s: any) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <p className="font-semibold text-ink">{s.name}</p>
                </div>
                <span className={cn("badge", s.status === "active" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{s.status}</span>
              </div>
              <p className="mt-2 text-xs text-muted">{s.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted">{s.memberCount} members · {s.type.replace(/_/g, " ")}</span>
                <span className="font-medium text-ink">${s.estimatedRevenue}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(s.criteria || []).map((c: any, i: number) => (
                  <span key={i} className="badge bg-surface2 text-[0.55rem] text-muted">{c.field.replace(/_/g, " ")} {c.operator} {c.value}</span>
                ))}
              </div>
              <p className="mt-2 text-[0.55rem] text-muted">{s.isDynamic ? "Dynamic — auto-updates" : "Static"} · Updated {formatDateTime(s.updatedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SCORING TAB                                                         */
/* ================================================================== */
function ScoringTab({ profiles }: { profiles: CxCustomerProfile[] }) {
  const scoreKeys = ["health", "engagement", "loyalty", "purchase", "intent", "risk", "lifetimeValue"] as const;
  type ScoreKey = typeof scoreKeys[number];
  const [sortBy, setSortBy] = useState<ScoreKey>("health");

  const getScore = (scores: CxCustomerProfile['scores'], key: ScoreKey): number => (scores as unknown as Record<string, number>)[key] ?? 0;
  const sorted = [...profiles].sort((a, b) => getScore(b.scores, sortBy) - getScore(a.scores, sortBy));

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Sort by:</span>
        {scoreKeys.map((k) => (
          <button key={k} onClick={() => setSortBy(k)} className={cn("chip capitalize", sortBy === k && "chip-active")}>
            {k === "lifetimeValue" ? "LTV" : k}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {sorted.map((p) => (
          <div key={p.customerId} className="card flex flex-wrap items-center gap-4 p-3">
            <span className="text-sm font-medium text-ink w-32 truncate">{p.name}</span>
            <div className="flex flex-1 items-center gap-4 text-xs">
              {(["health", "engagement", "loyalty", "purchase", "intent", "risk"] as const).map((k) => {
                const val = p.scores[k];
                return (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="text-muted w-6 capitalize">{k.slice(0, 3)}</span>
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-surface2">
                      <div className={cn("h-full rounded-full", val >= 70 ? "bg-success" : val >= 40 ? "bg-warning" : "bg-danger")} style={{ width: `${Math.min(val, 100)}%` }} />
                    </div>
                    <span className="font-medium text-ink w-6 text-right">{val}</span>
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
/*  RECOMMENDATIONS TAB                                                 */
/* ================================================================== */
function RecommendationsTab() {
  const models = useMemo(() => getRecommendationModels(), []);
  const analytics = useMemo(() => getRecommendationAnalytics(), []);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold text-ink mb-3">Recommendation Models ({models.length})</h3>
        {models.map((m) => (
          <div key={m.id} className="card mb-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{m.name}</p>
                <p className="text-xs text-muted capitalize">{m.strategy.replace(/_/g, " ")} · {m.placements.join(", ")}</p>
              </div>
              <span className={cn("badge", m.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{m.enabled ? "Active" : "Disabled"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1 text-[0.55rem]">
              <span className="badge bg-surface2 text-muted">{m.maxResults} max results</span>
              <span className="badge bg-surface2 text-muted">Min score {m.minScore}</span>
              {m.boostRecent && <span className="badge bg-info/15 text-info">Boost recent</span>}
              {m.boostCategory && <span className="badge bg-accent-soft text-accent">Boost category</span>}
              {m.excludePurchased && <span className="badge bg-warning/15 text-warning">Exclude purchased</span>}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="card p-4">
          <h3 className="font-semibold text-ink mb-3">Analytics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Total Impressions</span><span className="font-medium text-ink">{analytics.totalImpressions}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Total Clicks</span><span className="font-medium text-ink">{analytics.totalClicks}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Click-Through Rate</span><span className="font-medium text-accent">{analytics.clickThroughRate}%</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Conversions</span><span className="font-medium text-ink">{analytics.totalConversions}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Conversion Rate</span><span className="font-medium text-accent">{analytics.conversionRate}%</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Revenue Attributed</span><span className="font-medium text-success">${analytics.revenueAttributed}</span></div>
          </div>
        </div>
        <div className="card mt-4 p-4">
          <h3 className="font-semibold text-ink mb-3">Top Recommended Products</h3>
          {analytics.topProducts.length === 0 ? (
            <p className="text-xs text-muted">No data yet. Recommendations will track analytics as they serve.</p>
          ) : (
            <div className="space-y-2">
              {analytics.topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line p-2 text-xs">
                  <span className="text-ink truncate flex-1">{p.productId}</span>
                  <span className="text-muted">{p.impressions} views · {p.clicks} clicks · {p.conversions} conv</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  JOURNEYS TAB                                                        */
/* ================================================================== */
function JourneysTab() {
  const { toast } = useToast();
  const [journeys, setJourneys] = useState<CxJourney[]>([]);
  const refresh = () => setJourneys(getCxJourneys());
  useEffect(() => { refresh(); }, []);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{journeys.length} journeys</p>
        <button onClick={() => {
          createCxJourney({
            name: `Journey ${journeys.length + 1}`, description: "New customer journey",
            type: "custom", trigger: { type: "manual", delayMinutes: 0, cooldownDays: 0, maxPerCustomer: 10 },
            steps: [], conditions: [], audience: [], status: "draft",
          });
          refresh(); toast.success("Journey created");
        }} className="btn-primary btn-sm"><Zap className="h-4 w-4" /> New Journey</button>
      </div>
      {journeys.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<TrendingUp className="h-6 w-6" />} title="No journeys" description="Automated customer journeys drive engagement and conversions." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {journeys.map((j) => (
            <div key={j.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{j.name}</p>
                    <span className={cn("badge", j.status === "active" ? "bg-success/15 text-success" : j.status === "draft" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{j.status}</span>
                    <span className="badge bg-accent-soft text-accent capitalize">{j.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-muted">{j.description} · {j.steps.length} steps</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-center"><p className="font-semibold text-ink">{j.analytics.totalEntered}</p><p className="text-muted">Entered</p></div>
                  <div className="text-center"><p className="font-semibold text-success">{j.analytics.totalConverted}</p><p className="text-muted">Converted</p></div>
                  <div className="text-center"><p className={cn("font-semibold", j.analytics.conversionRate >= 30 ? "text-success" : "text-warning")}>{j.analytics.conversionRate}%</p><p className="text-muted">CVR</p></div>
                  <button onClick={() => {
                    const newStatus = j.status === "active" ? "paused" as const : "active" as const;
                    updateCxJourney(j.id, { status: newStatus });
                    refresh(); toast.success(`Journey ${newStatus}`);
                  }} className="btn-ghost btn-sm">{j.status === "active" ? "Pause" : "Activate"}</button>
                  <button onClick={() => { deleteCxJourney(j.id); refresh(); toast.success("Journey deleted"); }} className="btn-ghost btn-sm text-danger">Delete</button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 overflow-x-auto">
                <span className={cn("badge shrink-0", j.trigger.type === "event" ? "bg-info/15 text-info" : "bg-surface2 text-muted")}>{j.trigger.type}</span>
                {j.steps.map((s, i) => (
                  <span key={s.id} className="flex items-center gap-1 shrink-0">
                    <span className="badge bg-surface text-[0.55rem] text-muted capitalize">{s.type.replace(/_/g, " ")}</span>
                    {i < j.steps.length - 1 && <span className="text-muted text-[0.5rem]">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  FEEDBACK TAB                                                        */
/* ================================================================== */
function FeedbackTab() {
  const feedback = useMemo(() => getCxFeedback(), []);
  const sentiment = useMemo(() => getSentimentSummary(), []);
  const nps = useMemo(() => getNpsResponses(), []);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{sentiment.averageRating}</p>
          <p className="text-xs text-muted">Avg Rating</p>
          <div className="mt-1 flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-3 w-3", s <= Math.round(sentiment.averageRating) ? "text-warning fill-warning" : "text-muted")} />
            ))}
          </div>
        </div>
        <div className="card p-4 text-center">
          <p className={cn("text-2xl font-semibold", sentiment.npsScore >= 50 ? "text-success" : sentiment.npsScore >= 0 ? "text-warning" : "text-danger")}>{sentiment.npsScore}</p>
          <p className="text-xs text-muted">NPS Score</p>
          <p className="text-[0.55rem] text-muted">{nps.filter((n) => n.promoterType === "promoter").length} promoters · {nps.filter((n) => n.promoterType === "detractor").length} detractors</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{sentiment.totalFeedbacks}</p>
          <p className="text-xs text-muted">Total Feedback</p>
          <p className="text-[0.55rem] text-muted">{sentiment.trendingTopic} — trending</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Sentiment Distribution</h3>
        <div className="space-y-2">
          {sentiment.distribution.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-24 text-xs capitalize text-muted">{d.label.replace(/_/g, " ")}</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-surface2">
                <div className={cn("h-full rounded-full", d.label.includes("positive") ? "bg-success" : d.label.includes("negative") ? "bg-danger" : "bg-muted")} style={{ width: `${d.percentage}%` }} />
              </div>
              <span className="w-16 text-right text-xs font-medium text-ink">{d.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-ink mb-3">Recent Feedback</h3>
        {feedback.length === 0 ? (
          <p className="text-xs text-muted">No feedback yet.</p>
        ) : (
          <div className="space-y-3">
            {feedback.map((fb) => (
              <div key={fb.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className={cn("badge", fb.sentiment === "very_positive" || fb.sentiment === "positive" ? "bg-success/15 text-success" : fb.sentiment === "negative" || fb.sentiment === "very_negative" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{fb.sentiment.replace(/_/g, " ")}</span>
                  <span className="badge bg-accent-soft text-accent capitalize">{fb.type}</span>
                  <div className="flex items-center gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("h-2.5 w-2.5", i < fb.rating ? "text-warning fill-warning" : "text-line")} />)}</div>
                </div>
                <p className="mt-2 text-sm text-ink">{fb.content}</p>
                <p className="mt-1 text-[0.55rem] text-muted">{formatDateTime(fb.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FORECASTS TAB                                                       */
/* ================================================================== */
function ForecastsTab({ profiles }: { profiles: CxCustomerProfile[] }) {
  const forecasts = useMemo(() => getCxForecasts(), [profiles]);
  const report = useMemo(() => getCxReport("monthly"), [profiles]);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold text-ink mb-3">Customer Forecasts</h3>
        <div className="space-y-3">
          {forecasts.map((f) => (
            <div key={f.metric} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{f.metric}</p>
                <span className={cn("badge", f.trend === "up" ? "bg-success/15 text-success" : f.trend === "down" ? "bg-danger/15 text-danger" : "bg-surface2 text-muted")}>{f.trend}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-surface2/40 p-2 text-center">
                  <p className="text-muted">Current</p>
                  <p className="font-semibold text-ink">{f.currentValue}</p>
                </div>
                <div className="rounded-lg bg-accent-soft p-2 text-center">
                  <p className="text-muted">1 Month</p>
                  <p className="font-semibold text-accent">{f.predictedNextMonth}</p>
                </div>
                <div className="rounded-lg bg-success/15 p-2 text-center">
                  <p className="text-muted">1 Quarter</p>
                  <p className="font-semibold text-success">{f.predictedNextQuarter}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.55rem]">
                <span className="text-muted">Range: {f.lowerBound} - {f.upperBound}</span>
                <span className="text-muted">{Math.round(f.confidence * 100)}% confidence</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3">{report.title}</h3>
          <div className="space-y-3">
            {report.metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between rounded-lg border border-line p-3">
                <span className="text-sm text-muted">{m.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{m.value}</span>
                  <span className={cn("text-xs", m.trend === "up" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted")}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
