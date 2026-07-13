/**
 * ALAYA INSIDER — Enterprise Search & Discovery Platform Admin UI (PR-10)
 * --------------------------------------------------------------------------
 * Centralized search admin panel with tabs for:
 * Dashboard, Search Engine, Index, Recommendations, Personalization,
 * Analytics, AI Search, Merchandising, Synonyms, Settings
 */

import { useState, useEffect } from "react";
import {
  Activity, BarChart3, BrainCircuit, Database, Eye,
  Gift, Monitor, Package, RefreshCw,
  Search, Shield, ShoppingCart, Sliders, TrendingUp, Users, Zap,
  DollarSign, Sparkles, Target, Filter, Tag, Repeat,
  ThumbsUp, UserCheck, HelpCircle, Calendar,
} from "lucide-react";

type Tab =
  "dashboard" | "search-engine" | "index" | "recommendations" |
  "personalization" | "analytics" | "ai-search" | "merchandising" |
  "synonyms" | "settings";

const API_BASE = "/api/v1/search";

export default function AdminSearchPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [indexStats, setIndexStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [profileAnalytics, setProfileAnalytics] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, indexRes, analRes, rulesRes, synRes, profRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`).then(r => r.json()),
        fetch(`${API_BASE}/index/stats`).then(r => r.json()),
        fetch(`${API_BASE}/analytics?days=30`).then(r => r.json()),
        fetch(`${API_BASE}/merchandising/rules`).then(r => r.json()),
        fetch(`${API_BASE}/synonyms`).then(r => r.json()),
        fetch(`${API_BASE}/profiles/analytics`).then(r => r.json()),
      ]);
      if (dashRes.success) setStats(dashRes.data);
      if (indexRes.success) setIndexStats(indexRes.data);
      if (analRes.success) setAnalytics(analRes.data);
      if (rulesRes.success) setRules(rulesRes.data);
      if (synRes.success) setSynonyms(synRes.data);
      if (profRes.success) setProfileAnalytics(profRes.data);
    } catch { /* API not available */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "search-engine", label: "Search Engine", icon: Search },
    { id: "index", label: "Search Index", icon: Database },
    { id: "recommendations", label: "Recommendations", icon: ThumbsUp },
    { id: "personalization", label: "Personalization", icon: UserCheck },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "ai-search", label: "AI Search", icon: BrainCircuit },
    { id: "merchandising", label: "Merchandising", icon: Target },
    { id: "synonyms", label: "Synonyms", icon: Repeat },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  /* ================================================================== */
  /*  DASHBOARD                                                          */
  /* ================================================================== */

  const renderDashboard = () => {
    const s = stats || {};
    const ix = s.index || {};
    const an = s.analytics || {};
    const rec = s.recommendations || {};
    const prof = s.profiles || {};
    const merch = s.merchandising || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Indexed Docs" value={ix.total?.toLocaleString() || 0} subtitle={`${Object.keys(ix.by_type || {}).length} entity types`} icon={Database} color="blue" />
          <StatCard title="Searches (30d)" value={an.total_searches?.toLocaleString() || 0} subtitle={`${an.unique_searches || 0} unique`} icon={Search} color="green" />
          <StatCard title="CTR" value={`${an.click_through_rate || 0}%`} subtitle={`${an.total_clicks || 0} clicks`} icon={Activity} color="amber" />
          <StatCard title="No Results" value={an.no_result_searches || 0} subtitle="missed queries" icon={HelpCircle} color="red" />
          <StatCard title="Recommendations" value={rec.active_sets || 0} subtitle="active sets" icon={ThumbsUp} color="purple" />
          <StatCard title="Profiles" value={prof.total || 0} subtitle={`${Object.keys(prof.by_segment || {}).length} segments`} icon={Users} color="blue" />
          <StatCard title="Rules" value={`${merch.active_rules || 0}/${merch.total_rules || 0}`} subtitle="active/total" icon={Target} color="green" />
          <StatCard title="Avg Time" value={`${an.avg_search_time_ms || 0}ms`} subtitle="per search" icon={Zap} color="green" />
        </div>

        {/* Top Queries */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Top Queries (30d)</h3>
            <div className="space-y-1.5">
              {(s.top_queries || []).slice(0, 8).map((q: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-surface2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted">#{i + 1}</span>
                    <span className="font-medium text-ink">{q.query}</span>
                  </div>
                  <span className="font-mono text-muted">{q.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Products */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Trending Now</h3>
            <div className="space-y-1.5">
              {(s.trending || []).slice(0, 8).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-surface2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="font-medium text-ink">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="font-mono">${p.price}</span>
                    {p.rating > 0 && <span>★ {p.rating}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Index Health */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Index Health</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              ix.health === "healthy" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
            }`}>{ix.health === "healthy" ? "Healthy" : "Empty"}</span>
          </div>
          {ix.by_type && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(ix.by_type).map(([type, count]) => (
                <span key={type} className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                  {type}: {(count as number).toLocaleString()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  SEARCH ENGINE                                                      */
  /* ================================================================== */

  const renderSearchEngine = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any>(null);

    const doSearch = async () => {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=10`).then(r => r.json());
      if (res.success) setResults(res);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search products, brands, categories..."
            className="input flex-1"
          />
          <button onClick={doSearch} disabled={!query} className="btn-primary btn-sm">Search</button>
        </div>

        {/* Autocomplete test */}
        {query.length >= 2 && (
          <AutocompleteTest prefix={query} />
        )}

        {results && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>{results.total} results</span>
              <span>·</span>
              <span>{results.search_time_ms}ms</span>
              <span>·</span>
              <span>Page {results.page}/{results.total_pages}</span>
              {results.did_you_mean && (
                <span>· Did you mean: <button onClick={() => { setQuery(results.did_you_mean); doSearch(); }} className="text-accent hover:underline">{results.did_you_mean}</button></span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(results.results || []).slice(0, 10).map((r: any, i: number) => (
                <div key={r.id || i} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                  {r.image && <img src={r.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-ink truncate">{r.name}</div>
                        <div className="text-xs text-muted">{r.brand}{r.category ? ` · ${r.category}` : ""}</div>
                      </div>
                      <div className="text-right text-sm font-semibold text-ink">
                        {r.sale_price ? <><span className="text-xs text-muted line-through">${r.price}</span> ${r.sale_price}</> : `$${r.price}`}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span className="font-medium text-amber-600">{r.rating > 0 ? `★ ${r.rating}` : ""}</span>
                      <span>{r.entity_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ================================================================== */
  /*  INDEX                                                              */
  /* ================================================================== */

  const renderIndex = () => {
    const [reindexMsg, setReindexMsg] = useState("");
    const [reindexing, setReindexing] = useState(false);
    const ix = indexStats || {};

    const doReindex = async (entity?: string) => {
      setReindexing(true);
      setReindexMsg("");
      try {
        const url = entity ? `${API_BASE}/reindex/${entity}` : `${API_BASE}/reindex`;
        const res = await fetch(url, { method: "POST" }).then(r => r.json());
        if (res.success) {
          setReindexMsg(`✓ ${res.data.indexed} indexed, ${res.data.failed} failed`);
          fetchData();
        }
      } catch {
        setReindexMsg("✗ Reindex failed");
      }
      setReindexing(false);
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Search Index</h3>
              <p className="text-xs text-muted">{ix.total?.toLocaleString() || 0} total documents · Last indexed: {ix.last_indexed ? new Date(ix.last_indexed).toLocaleString() : "never"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${ix.health === "healthy" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
              {ix.health === "healthy" ? "Healthy" : "Empty"}
            </span>
          </div>
          {ix.by_type && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(ix.by_type).map(([type, count]) => (
                <span key={type} className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-muted">{type}: {(count as number).toLocaleString()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Reindex</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => doReindex()} disabled={reindexing} className="btn-primary btn-sm">Reindex All</button>
            <button onClick={() => doReindex("products")} disabled={reindexing} className="btn-ghost btn-sm">Products</button>
            <button onClick={() => doReindex("brands")} disabled={reindexing} className="btn-ghost btn-sm">Brands</button>
            <button onClick={() => doReindex("categories")} disabled={reindexing} className="btn-ghost btn-sm">Categories</button>
            <button onClick={() => doReindex("articles")} disabled={reindexing} className="btn-ghost btn-sm">Articles</button>
          </div>
          {reindexMsg && <p className={`mt-2 text-xs ${reindexMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{reindexMsg}</p>}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Index Health</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line p-3 text-center">
              <div className="text-xl font-bold text-green-600">{ix.health === "healthy" ? "✓" : "✗"}</div>
              <div className="text-xs text-muted">Status</div>
            </div>
            <div className="rounded-lg border border-line p-3 text-center">
              <div className="text-xl font-bold text-ink">{ix.total?.toLocaleString() || 0}</div>
              <div className="text-xs text-muted">Documents</div>
            </div>
            <div className="rounded-lg border border-line p-3 text-center">
              <div className="text-xl font-bold text-ink">{Object.keys(ix.by_type || {}).length}</div>
              <div className="text-xs text-muted">Entity Types</div>
            </div>
            <div className="rounded-lg border border-line p-3 text-center">
              <div className="text-xl font-bold text-ink">{ix.last_indexed ? new Date(ix.last_indexed).toLocaleDateString() : "N/A"}</div>
              <div className="text-xs text-muted">Last Indexed</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  RECOMMENDATIONS                                                    */
  /* ================================================================== */

  const renderRecommendations = () => {
    const [recType, setRecType] = useState("trending_now");
    const [recs, setRecs] = useState<any>(null);

    const loadRecs = async () => {
      const res = await fetch(`${API_BASE}/recommendations/${recType}?limit=8`).then(r => r.json());
      if (res.success) setRecs(res.data);
    };

    const recTypes = [
      { id: "trending_now", label: "Trending Now", icon: TrendingUp },
      { id: "related", label: "Related Products", icon: Package },
      { id: "frequently_bought_together", label: "Frequently Bought", icon: ShoppingCart },
      { id: "customers_also_viewed", label: "Also Viewed", icon: Eye },
      { id: "gift_suggestions", label: "Gift Suggestions", icon: Gift },
      { id: "seasonal_picks", label: "Seasonal Picks", icon: Calendar },
      { id: "luxury_alternatives", label: "Luxury Alternatives", icon: Sparkles },
      { id: "affordable_alternatives", label: "Affordable Alternatives", icon: DollarSign },
    ];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {recTypes.map((rt) => (
            <button
              key={rt.id}
              onClick={() => { setRecType(rt.id); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                recType === rt.id ? "bg-accent text-white" : "bg-surface2 text-muted hover:text-ink"
              }`}
            >
              <rt.icon className="h-3.5 w-3.5" />{rt.label}
            </button>
          ))}
        </div>
        <button onClick={loadRecs} className="btn-primary btn-sm">Load Recommendations</button>
        {recs && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(recs || []).slice(0, 8).map((r: any, i: number) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-3">
                {r.image && <img src={r.image} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />}
                <div className="text-sm font-medium text-ink truncate">{r.name}</div>
                <div className="text-xs text-muted">{r.brand}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-semibold text-ink">{r.sale_price ? `$${r.sale_price}` : `$${r.price}`}</span>
                  {r.rating > 0 && <span className="text-xs text-amber-600">★ {r.rating}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ================================================================== */
  /*  PERSONALIZATION                                                    */
  /* ================================================================== */

  const renderPersonalization = () => {
    const prof = profileAnalytics || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">{prof.total || 0}</div>
            <div className="text-xs text-muted">Total Profiles</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">{Object.keys(prof.by_segment || {}).length}</div>
            <div className="text-xs text-muted">Segments</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">${prof.avg_order_value || 0}</div>
            <div className="text-xs text-muted">Avg Order Value</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Segments</h3>
            {Object.entries(prof.by_segment || {}).map(([seg, count]) => (
              <div key={seg} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
                <span className="capitalize text-ink">{seg}</span>
                <span className="font-mono text-xs text-muted">{count as number}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Countries</h3>
            {Object.entries(prof.by_country || {}).slice(0, 8).map(([country, count]) => (
              <div key={country} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
                <span className="text-ink">{country}</span>
                <span className="font-mono text-xs text-muted">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  ANALYTICS                                                          */
  /* ================================================================== */

  const renderAnalytics = () => {
    const a = analytics || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Searches" value={a.total_searches?.toLocaleString() || 0} subtitle="30 days" icon={Search} color="blue" />
          <StatCard title="Unique Queries" value={a.unique_searches || 0} subtitle="30 days" icon={Filter} color="green" />
          <StatCard title="Click-through Rate" value={`${a.click_through_rate || 0}%`} subtitle={`${a.total_clicks || 0} clicks`} icon={Activity} color="amber" />
          <StatCard title="No Result Queries" value={a.no_result_searches || 0} subtitle="needs attention" icon={HelpCircle} color="red" />
          <StatCard title="Conversions" value={a.total_conversions || 0} subtitle="from search" icon={ShoppingCart} color="green" />
          <StatCard title="Search Revenue" value={`$${(a.conversion_revenue || 0).toLocaleString()}`} subtitle="30 days" icon={DollarSign} color="purple" />
          <StatCard title="Avg Search Time" value={`${a.avg_search_time_ms || 0}ms`} subtitle="per query" icon={Zap} color="blue" />
          <StatCard title="Top Queries" value={(a.top_queries || []).length} subtitle="tracked" icon={BarChart3} color="amber" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Top Queries</h3>
            <div className="space-y-1.5">
              {(a.top_queries || []).slice(0, 10).map((q: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-surface2">
                  <span className="font-medium text-ink">{q.query}</span>
                  <span className="font-mono text-muted">{q.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">No Result Queries</h3>
            {(a.top_no_result_queries || []).length === 0 ? (
              <p className="text-xs text-muted">No queries with zero results</p>
            ) : (
              <div className="space-y-1.5">
                {(a.top_no_result_queries || []).slice(0, 10).map((q: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-surface2">
                    <span className="font-medium text-ink">{q.query}</span>
                    <span className="font-mono text-muted">{q.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  AI SEARCH                                                          */
  /* ================================================================== */

  const renderAISearch = () => {
    const [query, setQuery] = useState("");
    const [intent, setIntent] = useState<any>(null);
    const [entities, setEntities] = useState<any>(null);
    const [aiResults, setAiResults] = useState<any>(null);

    const analyze = async () => {
      const [intentRes, entRes, aiRes] = await Promise.all([
        fetch(`${API_BASE}/ai/intent?q=${encodeURIComponent(query)}`).then(r => r.json()),
        fetch(`${API_BASE}/ai/entities?q=${encodeURIComponent(query)}`).then(r => r.json()),
        fetch(`${API_BASE}/ai/search?q=${encodeURIComponent(query)}&limit=8`).then(r => r.json()),
      ]);
      if (intentRes.success) setIntent(intentRes.data);
      if (entRes.success) setEntities(entRes.data);
      if (aiRes.success) setAiResults(aiRes);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="Natural language search..." className="input flex-1" />
          <button onClick={analyze} disabled={!query} className="btn-primary btn-sm">Analyze</button>
        </div>

        {intent && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted flex items-center gap-1.5"><BrainCircuit className="h-3 w-3" /> Intent</h4>
              <div className="text-lg font-bold text-ink capitalize">{intent.intent}</div>
              {intent.category && <div className="text-xs text-muted mt-1">Category: {intent.category}</div>}
              {intent.price_preference && <div className="text-xs text-muted">Price: {intent.price_preference}</div>}
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted flex items-center gap-1.5"><Tag className="h-3 w-3" /> Attributes</h4>
              <div className="flex flex-wrap gap-1">
                {(intent.attributes || []).map((a: string, i: number) => (
                  <span key={i} className="rounded bg-surface2 px-2 py-0.5 text-xs text-muted">{a}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted flex items-center gap-1.5"><Database className="h-3 w-3" /> Entities</h4>
              <div className="flex flex-wrap gap-1">
                {(entities || []).map((e: any, i: number) => (
                  <span key={i} className="rounded bg-purple-500/10 px-2 py-0.5 text-xs text-purple-600">{e.text} ({e.type})</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {aiResults && (
          <div className="space-y-2">
            <div className="text-xs text-muted">{aiResults.total} results · {aiResults.search_time_ms}ms</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(aiResults.results || []).slice(0, 8).map((r: any, i: number) => (
                <div key={i} className="rounded-xl border border-line bg-surface p-3">
                  <div className="text-sm font-medium text-ink truncate">{r.name}</div>
                  <div className="text-xs text-muted">{r.brand} · ${r.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ================================================================== */
  /*  MERCHANDISING                                                      */
  /* ================================================================== */

  const renderMerchandising = () => {
    const [newRule, setNewRule] = useState({ name: "", rule_type: "boost", multiplier: 2, brand: "" });

    const createRule = async () => {
      const res = await fetch(`${API_BASE}/merchandising/rules`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule),
      }).then(r => r.json());
      if (res.success) {
        fetchData();
        setNewRule({ name: "", rule_type: "boost", multiplier: 2, brand: "" });
      }
    };

    const toggleRule = async (id: string, active: boolean) => {
      await fetch(`${API_BASE}/merchandising/rules/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchData();
    };

    const deleteRule = async (id: string) => {
      await fetch(`${API_BASE}/merchandising/rules/${id}`, { method: "DELETE" });
      fetchData();
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Create Rule</h3>
          <div className="flex flex-wrap gap-2">
            <input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="Rule name" className="input w-48" />
            <select value={newRule.rule_type} onChange={e => setNewRule({ ...newRule, rule_type: e.target.value })} className="input w-32">
              <option value="boost">Boost</option>
              <option value="demote">Demote</option>
              <option value="pin">Pin</option>
              <option value="hide">Hide</option>
            </select>
            <input value={newRule.brand} onChange={e => setNewRule({ ...newRule, brand: e.target.value })} placeholder="Brand (optional)" className="input w-40" />
            <input value={newRule.multiplier} onChange={e => setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) || 1 })} placeholder="Multiplier" type="number" step="0.5" min="0" className="input w-24" />
            <button onClick={createRule} disabled={!newRule.name} className="btn-primary btn-sm">Create</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Brand/Category</th>
                <th className="px-4 py-3 font-medium">Multiplier</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rules.map((r: any) => (
                <tr key={r.id} className="hover:bg-surface2/50">
                  <td className="px-4 py-2.5 font-medium text-ink">{r.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      r.rule_type === "boost" ? "bg-green-500/10 text-green-600" :
                      r.rule_type === "demote" ? "bg-red-500/10 text-red-600" :
                      r.rule_type === "pin" ? "bg-blue-500/10 text-blue-600" :
                      "bg-amber-500/10 text-amber-600"
                    }`}>{r.rule_type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{r.brand || r.category || r.query_pattern || "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.multiplier}x</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleRule(r.id, r.active)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                      {r.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{r.usage_count || 0}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteRule(r.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  SYNONYMS                                                           */
  /* ================================================================== */

  const renderSynonyms = () => {
    const [term, setTerm] = useState("");
    const [synList, setSynList] = useState("");

    const createSyn = async () => {
      const synonyms_arr = synList.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/synonyms`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, synonyms: synonyms_arr }),
      }).then(r => r.json());
      if (res.success) {
        fetchData();
        setTerm("");
        setSynList("");
      }
    };

    const deleteSyn = async (id: string) => {
      await fetch(`${API_BASE}/synonyms/${id}`, { method: "DELETE" });
      fetchData();
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Add Synonym Group</h3>
          <div className="flex flex-wrap gap-2">
            <input value={term} onChange={e => setTerm(e.target.value)} placeholder="Term (e.g. bag)" className="input w-40" />
            <input value={synList} onChange={e => setSynList(e.target.value)} placeholder="Synonyms (comma-separated: handbag, tote, purse)" className="input flex-1" />
            <button onClick={createSyn} disabled={!term || !synList} className="btn-primary btn-sm">Add</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Synonyms</th>
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {synonyms.map((s: any) => (
                <tr key={s.id} className="hover:bg-surface2/50">
                  <td className="px-4 py-2.5 font-medium text-ink">{s.term}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(s.synonyms || []).map((syn: string, i: number) => (
                        <span key={i} className="rounded bg-surface2 px-1.5 py-0.5 text-xs text-muted">{syn}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{s.language || "en"}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteSyn(s.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  SETTINGS                                                           */
  /* ================================================================== */

  const renderSettings = () => {
    const ix = indexStats || {};

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Database className="h-5 w-5 text-blue-600" /></div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Search Configuration</h3>
              <p className="text-xs text-muted">Global search platform settings and defaults</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Total Indexed</span>
              <div className="text-xl font-bold text-ink">{ix.total?.toLocaleString() || 0}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Entity Types</span>
              <div className="text-xl font-bold text-ink">{Object.keys(ix.by_type || {}).length}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Synonyms</span>
              <div className="text-xl font-bold text-ink">{synonyms.length}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Merchandising Rules</span>
              <div className="text-xl font-bold text-ink">{rules.length}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Index Health</span>
              <div className="text-xl font-bold text-green-600">{ix.health === "healthy" ? "Healthy" : "Empty"}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Last Reindex</span>
              <div className="text-sm font-bold text-ink">{ix.last_indexed ? new Date(ix.last_indexed).toLocaleDateString() : "Never"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><Shield className="h-5 w-5 text-green-600" /></div>
            <div>
              <h3 className="text-sm font-semibold text-ink">System Status</h3>
              <p className="text-xs text-muted">Current search platform operational status</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border-2 border-accent/20 bg-accent/5 p-4">
            <Search className="h-6 w-6 text-accent" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Search Platform Status</p>
              <p className="text-xs text-muted">
                {ix.total > 0
                  ? `${ix.total?.toLocaleString()} documents indexed · ${Object.keys(ix.by_type || {}).length} entity types · ${synonyms.length} synonym groups · ${rules.filter((r: any) => r.active).length} active rules`
                  : "Search index is empty — run reindex to populate"}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${ix.total > 0 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
              {ix.total > 0 ? "Operational" : "Requires Setup"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  TAB RENDERER                                                       */
  /* ================================================================== */

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return renderDashboard();
      case "search-engine": return renderSearchEngine();
      case "index": return renderIndex();
      case "recommendations": return renderRecommendations();
      case "personalization": return renderPersonalization();
      case "analytics": return renderAnalytics();
      case "ai-search": return renderAISearch();
      case "merchandising": return renderMerchandising();
      case "synonyms": return renderSynonyms();
      case "settings": return renderSettings();
    }
  };

  /* ================================================================== */
  /*  LAYOUT                                                            */
  /* ================================================================== */

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Search & Discovery Platform</h1>
          <p className="text-sm text-muted">Enterprise search, recommendations, personalization, and merchandising</p>
        </div>
        <button onClick={fetchData} className="btn-ghost btn-sm" disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-line pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id ? "border-b-2 border-accent text-accent" : "text-muted hover:text-ink hover:bg-surface2"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle: string; icon: any; color: string;
}) {
  const colorMap: Record<string, string> = {
    green: "bg-green-500/10 text-green-600", blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600", red: "bg-red-500/10 text-red-600",
    orange: "bg-orange-500/10 text-orange-600", purple: "bg-purple-500/10 text-purple-600",
  };
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{title}</span>
        <div className={`rounded-lg p-1.5 ${colorMap[color] || "bg-surface2 text-muted"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{subtitle}</div>
    </div>
  );
}

function AutocompleteTest({ prefix }: { prefix: string }) {
  const [suggestions, setSuggestions] = useState<{ text: string; type: string; count: number }[]>([]);
  useEffect(() => {
    if (prefix.length < 2) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(prefix)}&limit=5`).then(r => r.json());
      if (res.success) setSuggestions(res.data);
    }, 200);
    return () => clearTimeout(timer);
  }, [prefix]);
  if (suggestions.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="mb-1 text-xs text-muted">Autocomplete Suggestions</div>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((s, i) => (
          <span key={i} className="rounded bg-surface2 px-2 py-0.5 text-xs text-muted">{s.text} <span className="text-[0.6rem]">({s.type})</span></span>
        ))}
      </div>
    </div>
  );
}
