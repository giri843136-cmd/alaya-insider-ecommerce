/**
 * ALAYA INSIDER — Enterprise AI Commerce Platform Admin UI (PR-9)
 * --------------------------------------------------------------------------
 * Centralized AI admin panel with tabs for:
 * Dashboard, Providers, Models, Prompts, Quality, Product AI, Content AI,
 * Image AI, SEO AI, Affiliate AI, Price AI, Customer AI, Commerce AI,
 * Search AI, Generations, Usage, Workflows
 */

import { useState, useEffect } from "react";
import {
  Activity, BarChart3, BookOpen, BrainCircuit, CreditCard,
  Database, DollarSign, FileText, Globe, Image, Layers,
  LineChart, Monitor, Package, RefreshCw,
  Search, Server, Shield, ShoppingCart, Sliders, Users, Zap,
} from "lucide-react";

type Tab =
  "dashboard" | "providers" | "models" | "prompts" | "quality" |
  "product" | "content" | "image" | "seo" | "affiliate" | "price" |
  "customer" | "commerce" | "search" | "generations" | "usage" | "workflows" |
  "settings";

const API_BASE = "/api/v1/ai";

export default function AdminAIPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [providerStats, setProviderStats] = useState<any>(null);
  const [modelStats, setModelStats] = useState<any>(null);
  const [promptStats, setPromptStats] = useState<any>(null);
  const [workflowStats, setWorkflowStats] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, provRes, modelRes, promptRes, genRes, useRes, wfRes, pStats, mStats, prStats, wfStats] = await Promise.all([
        fetch(`${API_BASE}/dashboard`).then(r => r.json()),
        fetch(`${API_BASE}/providers`).then(r => r.json()),
        fetch(`${API_BASE}/models`).then(r => r.json()),
        fetch(`${API_BASE}/prompts`).then(r => r.json()),
        fetch(`${API_BASE}/generations?limit=20`).then(r => r.json()),
        fetch(`${API_BASE}/usage?days=30`).then(r => r.json()),
        fetch(`${API_BASE}/workflows`).then(r => r.json()),
        fetch(`${API_BASE}/providers/stats`).then(r => r.json()),
        fetch(`${API_BASE}/models/stats`).then(r => r.json()),
        fetch(`${API_BASE}/prompts/stats`).then(r => r.json()),
        fetch(`${API_BASE}/workflows/stats`).then(r => r.json()),
      ]);
      if (dashRes.success) setDashboardStats(dashRes.data);
      if (provRes.success) setProviders(provRes.data);
      if (modelRes.success) setModels(modelRes.data);
      if (promptRes.success) setPrompts(promptRes.data);
      if (genRes.success) setGenerations(genRes.data);
      if (useRes.success) setUsage(useRes.data);
      if (wfRes.success) setWorkflows(wfRes.data);
      if (pStats.success) setProviderStats(pStats.data);
      if (mStats.success) setModelStats(mStats.data);
      if (prStats.success) setPromptStats(prStats.data);
      if (wfStats.success) setWorkflowStats(wfStats.data);
    } catch { /* API not available */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "providers", label: "Providers", icon: Server },
    { id: "models", label: "Models", icon: Layers },
    { id: "prompts", label: "Prompts", icon: FileText },
    { id: "quality", label: "Quality", icon: Shield },
    { id: "product", label: "Product AI", icon: Package },
    { id: "content", label: "Content AI", icon: BookOpen },
    { id: "image", label: "Image AI", icon: Image },
    { id: "seo", label: "SEO AI", icon: Globe },
    { id: "affiliate", label: "Affiliate AI", icon: DollarSign },
    { id: "price", label: "Price AI", icon: LineChart },
    { id: "customer", label: "Customer AI", icon: Users },
    { id: "commerce", label: "Commerce AI", icon: ShoppingCart },
    { id: "search", label: "Search AI", icon: Search },
    { id: "generations", label: "History", icon: Activity },
    { id: "usage", label: "Usage", icon: BarChart3 },
    { id: "workflows", label: "Workflows", icon: Zap },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  /* ================================================================== */
  /*  DASHBOARD                                                          */
  /* ================================================================== */

  const renderDashboard = () => {
    const ds = dashboardStats || {};
    const p = ds.providers || {};
    const u = ds.usage || {};
    const g = ds.generations || {};
    const q = ds.quality || {};
    const w = ds.workflows || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Providers" value={`${p.healthy || 0}/${p.total || 0}`} subtitle="healthy" icon={Server} color="green" />
          <StatCard title="Models" value={ds.models?.total || 0} subtitle="registered" icon={Layers} color="blue" />
          <StatCard title="Prompts" value={ds.prompts?.total || 0} subtitle="templates" icon={FileText} color="purple" />
          <StatCard title="Requests (30d)" value={u.total_requests || 0} subtitle="total" icon={Activity} color="blue" />
          <StatCard title="Tokens" value={`${((u.total_tokens || 0) / 1000000).toFixed(1)}M`} subtitle="total" icon={BarChart3} color="amber" />
          <StatCard title="Cost" value={`$${(u.total_cost || 0).toFixed(2)}`} subtitle="30-day total" icon={CreditCard} color="red" />
          <StatCard title="Avg Latency" value={`${Math.round(u.avg_latency_ms || 0)}ms`} subtitle="per request" icon={Activity} color="green" />
          <StatCard title="Quality" value={`${(q.avg_overall || 0).toFixed(1)}/100`} subtitle="overall" icon={Shield} color="purple" />
          <StatCard title="Gen (24h)" value={g.total_24h || 0} subtitle="generations" icon={Zap} color="amber" />
          <StatCard title="Workflows" value={`${w.enabled || 0}/${w.total || 0}`} subtitle="active" icon={Zap} color="green" />
          <StatCard title="Budget Used" value={`${p.spent ? `$${Math.round(p.spent)}` : "$0"}`} subtitle={`of $${Math.round(p.budget)}`} icon={CreditCard} color="blue" />
          <StatCard title="Avg Quality" value={`SEO: ${(q.avg_seo || 0).toFixed(0)}`} subtitle={`Grammar: ${(q.avg_grammar || 0).toFixed(0)}`} icon={Shield} color="green" />
        </div>

        {/* Recent Generations */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent Generations</h3>
            <button onClick={() => setTab("generations")} className="text-xs text-accent hover:underline">View all</button>
          </div>
          <div className="space-y-1.5">
            {generations.slice(0, 8).map((gen: any) => (
              <div key={gen.id} className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs hover:bg-surface2">
                <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase text-muted">{gen.task}</span>
                <span className="font-mono text-muted">{new Date(gen.created_at).toLocaleTimeString()}</span>
                <span className="font-medium text-ink">{gen.provider_slug || "local"}</span>
                <span className="text-muted line-clamp-1">{gen.prompt_text?.slice(0, 80)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  PROVIDERS                                                          */
  /* ================================================================== */

  const renderProviders = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">{providerStats?.healthy || 0} healthy</span>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">{providerStats?.degraded || 0} degraded</span>
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">{providerStats?.down || 0} down</span>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">Budget: ${Math.round(providerStats?.total_spent || 0)}/${Math.round(providerStats?.total_budget || 0)}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p: any) => (
          <div key={p.id} className={`rounded-xl border p-4 ${
            p.health_status === "healthy" ? "border-green-500/20 bg-green-500/5" :
            p.health_status === "degraded" ? "border-amber-500/20 bg-amber-500/5" :
            p.health_status === "down" ? "border-red-500/20 bg-red-500/5" :
            "border-line bg-surface"
          }`}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  p.health_status === "healthy" ? "bg-green-500" :
                  p.health_status === "degraded" ? "bg-amber-500" :
                  p.health_status === "down" ? "bg-red-500" : "bg-gray-400"
                }`} />
                <span className="font-medium text-ink">{p.name}</span>
              </div>
              <span className="rounded bg-surface2 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-muted">{p.provider_type}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted">
              <span>Priority: {p.priority}</span>
              <span>RPM: {p.rate_limit_per_minute}</span>
              <span>Latency: {p.health_latency_ms}ms</span>
              <span>Budget: ${p.monthly_spent?.toFixed(0)}/${p.monthly_budget}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ================================================================== */
  /*  MODELS                                                             */
  /* ================================================================== */

  const renderModels = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {modelStats && Object.entries(modelStats.by_family || {}).map(([family, count]) => (
          <span key={family} className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">{family}: {count as number}</span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Family</th>
              <th className="px-4 py-3 font-medium">Max Tokens</th>
              <th className="px-4 py-3 font-medium">Input/1k</th>
              <th className="px-4 py-3 font-medium">Output/1k</th>
              <th className="px-4 py-3 font-medium">Capabilities</th>
              <th className="px-4 py-3 font-medium">Default</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {models.map((m: any) => (
              <tr key={m.id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-2.5 text-muted">{m.provider_id?.slice(0, 8)}...</td>
                <td className="px-4 py-2.5"><span className="rounded bg-surface2 px-2 py-0.5 text-xs">{m.model_family}</span></td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{m.max_tokens}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">${m.pricing_input_per_1k}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">${m.pricing_output_per_1k}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(m.capabilities || []).slice(0, 3).map((c: string) => (
                      <span key={c} className="rounded bg-surface2 px-1.5 py-0.5 text-[0.6rem]">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">{m.is_default ? <span className="text-green-500">✓</span> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  PROMPTS                                                            */
  /* ================================================================== */

  const renderPrompts = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {promptStats && Object.entries(promptStats.by_category || {}).map(([cat, count]) => (
          <span key={cat} className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600">{cat}: {count as number}</span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map((p: any) => (
          <div key={p.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-ink">{p.name}</span>
              <span className="rounded bg-surface2 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-muted">{p.category}</span>
            </div>
            <p className="mb-2 text-xs text-muted line-clamp-2">{p.user_template}</p>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>v{p.current_version}</span>
              {(p.variables || []).length > 0 && <span>· {p.variables.join(", ")}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ================================================================== */
  /*  QUALITY                                                            */
  /* ================================================================== */

  const renderQuality = () => {
    const [textInput, setTextInput] = useState("");
    const [scores, setScores] = useState<any>(null);

    const analyzeText = async () => {
      const res = await fetch(`${API_BASE}/quality/score`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });
      const data = await res.json();
      if (data.success) setScores(data.data);
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Quality Analyzer</h3>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste text to analyze..."
            className="input mb-3 h-32 w-full resize-y"
          />
          <button onClick={analyzeText} disabled={!textInput} className="btn-primary btn-sm">Analyze</button>
          {scores && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(scores).filter(([k]) => k !== "overall").map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line p-3 text-center">
                  <div className="text-2xl font-bold text-ink">{Math.round(v as number)}</div>
                  <div className="text-xs text-muted capitalize">{k.replace(/_/g, " ")}</div>
                </div>
              ))}
              <div className="col-span-2 rounded-lg border-2 border-accent/30 bg-accent/5 p-3 text-center sm:col-span-4">
                <div className="text-3xl font-bold text-accent">{Math.round(scores.overall)}</div>
                <div className="text-xs text-muted">Overall Quality Score</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  TAB RENDERER                                                       */
  /* ================================================================== */

  const renderContentAI = () => {
    const [topic, setTopic] = useState("");
    const [contentRes, setContentRes] = useState<any>(null);
    const generate = async () => {
      const [articleRes, guideRes, socialRes] = await Promise.all([
        fetch(`${API_BASE}/content/article`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `Guide to ${topic}`, topic }) }).then(r => r.json()),
        fetch(`${API_BASE}/content/buying-guide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) }).then(r => r.json()),
        fetch(`${API_BASE}/content/social-post`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaign: topic, platform: "instagram" }) }).then(r => r.json()),
      ]);
      setContentRes({ article: articleRes.data, guide: guideRes.data, social: socialRes.data });
    };
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" className="input flex-1" />
          <button onClick={generate} disabled={!topic} className="btn-primary btn-sm">Generate</button>
        </div>
        {contentRes && (
          <div className="space-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
            <div><strong>Article:</strong> {contentRes.article?.title}<p className="mt-1 text-muted">{contentRes.article?.excerpt}</p></div>
            <div className="border-t border-line pt-2"><strong>Buying Guide:</strong> {contentRes.guide?.title}</div>
            <div className="border-t border-line pt-2"><strong>Social:</strong> {contentRes.social?.text}</div>
          </div>
        )}
      </div>
    );
  };

  const renderImageAI = () => {
    const [product, setProduct] = useState("");
    const [imgRes, setImgRes] = useState<any>(null);
    const generate = async () => {
      const [altRes, tagRes] = await Promise.all([
        fetch(`${API_BASE}/image/alt-text`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: product }) }).then(r => r.json()),
        fetch(`${API_BASE}/image/tags`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: product }) }).then(r => r.json()),
      ]);
      setImgRes({ alt_text: altRes.data?.alt_text, tags: tagRes.data?.tags });
    };
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Product name" className="input flex-1" />
          <button onClick={generate} disabled={!product} className="btn-primary btn-sm">Generate</button>
        </div>
        {imgRes && <div className="rounded-xl border border-line bg-surface p-4 text-sm"><strong>Alt Text:</strong> {imgRes.alt_text}<br /><strong>Tags:</strong> {imgRes.tags?.join(", ")}</div>}
      </div>
    );
  };

  const renderSeoAI = () => {
    const [topic, setTopic] = useState("");
    const [seoRes, setSeoRes] = useState<any>(null);
    const analyze = async () => {
      const [kwRes, clusterRes] = await Promise.all([
        fetch(`${API_BASE}/seo/keywords`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) }).then(r => r.json()),
        fetch(`${API_BASE}/seo/topic-clusters`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) }).then(r => r.json()),
      ]);
      setSeoRes({ keywords: kwRes.data, clusters: clusterRes.data });
    };
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" className="input flex-1" />
          <button onClick={analyze} disabled={!topic} className="btn-primary btn-sm">Analyze</button>
        </div>
        {seoRes && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted">Keywords</h4>
              <p className="text-xs text-muted">Primary: {seoRes.keywords?.primary?.join(", ")}</p>
              <p className="mt-1 text-xs text-muted">Long-tail: {seoRes.keywords?.long_tail?.join(", ")}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted">Topic Clusters</h4>
              {seoRes.clusters?.map((c: any, i: number) => (
                <div key={i} className="mb-1 text-xs text-muted"><strong>{c.pillar}:</strong> {c.cluster_topics?.join(", ")}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return renderDashboard();
      case "providers": return renderProviders();
      case "models": return renderModels();
      case "prompts": return renderPrompts();
      case "quality": return renderQuality();
      case "product": return <ProductAITab />;
      case "content": return renderContentAI();
      case "image": return renderImageAI();
      case "seo": return renderSeoAI();
      case "affiliate": return <AffiliateAITab />;
      case "price": return <PriceAITab />;
      case "customer": return <CustomerAITab />;
      case "commerce": return <CommerceAITab />;
      case "search": return <SearchAITab />;
      case "generations": return renderGenerations();
      case "usage": return renderUsage();
      case "workflows": return renderWorkflows();
      case "settings": return renderSettings();
    }
  };

  /* More render functions for remaining tabs */
  const renderGenerations = () => (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Provider</th>
            <th className="px-4 py-3 font-medium">Prompt</th>
            <th className="px-4 py-3 font-medium">Tokens</th>
            <th className="px-4 py-3 font-medium">Latency</th>
            <th className="px-4 py-3 font-medium">Quality</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {generations.map((g: any) => (
            <tr key={g.id} className="hover:bg-surface2/50">
              <td className="px-4 py-2.5"><span className="rounded bg-surface2 px-1.5 py-0.5 text-xs font-medium">{g.task}</span></td>
              <td className="px-4 py-2.5 text-muted">{g.provider_slug || "local"}</td>
              <td className="px-4 py-2.5 text-muted max-w-xs truncate">{g.prompt_text}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted">{g.total_tokens}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted">{g.latency_ms}ms</td>
              <td className="px-4 py-2.5">{g.quality_score ? `${g.quality_score}/100` : "-"}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted">{new Date(g.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUsage = () => {
    const u = usage || {};
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">{u.total_requests?.toLocaleString() || 0}</div>
            <div className="text-xs text-muted">Total Requests</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">{((u.total_tokens || 0) / 1000000).toFixed(2)}M</div>
            <div className="text-xs text-muted">Total Tokens</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">${(u.total_cost || 0).toFixed(2)}</div>
            <div className="text-xs text-muted">Total Cost</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-2xl font-bold text-ink">{Math.round(u.avg_latency_ms || 0)}ms</div>
            <div className="text-xs text-muted">Avg Latency</div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflows = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">{workflowStats?.enabled || 0} enabled</span>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">{workflowStats?.total_runs || 0} runs</span>
        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600">{workflowStats?.by_event ? Object.keys(workflowStats.by_event).length : 0} events</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Trigger Event</th>
              <th className="px-4 py-3 font-medium">AI Task</th>
              <th className="px-4 py-3 font-medium">Enabled</th>
              <th className="px-4 py-3 font-medium">Auto Apply</th>
              <th className="px-4 py-3 font-medium">Requires Review</th>
              <th className="px-4 py-3 font-medium">Runs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {workflows.map((w: any) => (
              <tr key={w.id} className="hover:bg-surface2/50">
                <td className="px-4 py-2.5 font-medium text-ink">{w.name}</td>
                <td className="px-4 py-2.5"><span className="rounded bg-surface2 px-2 py-0.5 text-xs">{w.trigger_event}</span></td>
                <td className="px-4 py-2.5 text-muted">{w.ai_task}</td>
                <td className="px-4 py-2.5">{w.enabled ? <span className="text-green-500">✓</span> : "✗"}</td>
                <td className="px-4 py-2.5">{w.auto_apply ? <span className="text-green-500">✓</span> : "✗"}</td>
                <td className="px-4 py-2.5">{w.requires_review ? <span className="text-amber-500">✓</span> : "✗"}</td>
                <td className="px-4 py-2.5 text-muted">{w.run_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ================================================================== */
  /*  SETTINGS                                                          */
  /* ================================================================== */

  const renderSettings = () => {
    const [apiKeyValue, setApiKeyValue] = useState("");
    const [encryptedKey, setEncryptedKey] = useState("");
    const [decryptedKey, setDecryptedKey] = useState("");
    const [encrypting, setEncrypting] = useState(false);
    const [decrypting, setDecrypting] = useState(false);
    const [encResult, setEncResult] = useState<string | null>(null);
    const [decResult, setDecResult] = useState<string | null>(null);

    const encryptApiKey = async () => {
      if (!apiKeyValue) return;
      setEncrypting(true);
      setEncResult(null);
      try {
        const res = await fetch(`${API_BASE}/encrypt`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: apiKeyValue }),
        });
        const data = await res.json();
        if (data.success) {
          setEncryptedKey(data.data.encrypted);
          setEncResult("✓ Key encrypted successfully");
        } else {
          setEncResult("✗ Encryption failed");
        }
      } catch {
        setEncResult("✗ API error — server may not be running");
      }
      setEncrypting(false);
    };

    const decryptApiKey = async () => {
      if (!encryptedKey) return;
      setDecrypting(true);
      setDecResult(null);
      try {
        const res = await fetch(`${API_BASE}/decrypt`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ encrypted: encryptedKey }),
        });
        const data = await res.json();
        if (data.success) {
          setDecryptedKey(data.data.value);
          setDecResult("✓ Key decrypted successfully");
        } else {
          setDecResult("✗ Decryption failed");
        }
      } catch {
        setDecResult("✗ API error — server may not be running");
      }
      setDecrypting(false);
    };

    return (
      <div className="space-y-8">
        {/* Encryption Key Management */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">API Key Encryption</h3>
              <p className="text-xs text-muted">Encrypt and decrypt API keys using AES-256-GCM</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Raw API Key</label>
              <div className="flex gap-2">
                <input
                  value={apiKeyValue}
                  onChange={e => setApiKeyValue(e.target.value)}
                  placeholder="sk-..."
                  type="password"
                  className="input flex-1"
                />
                <button onClick={encryptApiKey} disabled={!apiKeyValue || encrypting} className="btn-primary btn-sm whitespace-nowrap">
                  {encrypting ? "Encrypting..." : "Encrypt"}
                </button>
              </div>
              {encResult && <p className={`mt-1 text-xs ${encResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{encResult}</p>}
              {encryptedKey && (
                <div className="mt-2 rounded bg-surface2 p-2">
                  <p className="mb-1 text-xs text-muted">Encrypted:</p>
                  <code className="break-all font-mono text-xs text-ink">{encryptedKey}</code>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Encrypted Key</label>
              <div className="flex gap-2">
                <input
                  value={encryptedKey}
                  onChange={e => setEncryptedKey(e.target.value)}
                  placeholder="Paste encrypted key..."
                  className="input flex-1 font-mono text-xs"
                />
                <button onClick={decryptApiKey} disabled={!encryptedKey || decrypting} className="btn-ghost btn-sm whitespace-nowrap">
                  {decrypting ? "Decrypting..." : "Decrypt"}
                </button>
              </div>
              {decResult && <p className={`mt-1 text-xs ${decResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{decResult}</p>}
              {decryptedKey && (
                <div className="mt-2 rounded bg-amber-500/10 p-2">
                  <p className="mb-1 text-xs text-muted">Decrypted value:</p>
                  <code className="break-all font-mono text-xs text-ink">{decryptedKey}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Provider Budget Configuration */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Provider Budget Configuration</h3>
              <p className="text-xs text-muted">Set monthly budget limits per provider</p>
            </div>
          </div>
          <div className="space-y-3">
            {providers.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${p.health_status === "healthy" ? "bg-green-500" : p.health_status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
                  <span className="text-sm font-medium text-ink">{p.name}</span>
                  <span className="text-xs text-muted">({p.provider_type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Priority:</span>
                  <span className="rounded bg-surface2 px-2 py-0.5 text-xs font-mono">{p.priority}</span>
                  <span className="text-xs text-muted">Budget:</span>
                  <span className="rounded bg-surface2 px-2 py-0.5 text-xs font-mono">${p.monthly_spent?.toFixed(0) || 0}/${p.monthly_budget}</span>
                  <span className="text-xs text-muted">Latency:</span>
                  <span className="rounded bg-surface2 px-2 py-0.5 text-xs font-mono">{p.health_latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Defaults */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Layers className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Default Models</h3>
              <p className="text-xs text-muted">Current default model assignments per capability</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["chat", "completion", "embedding", "vision", "function_calling", "streaming"].map((cap) => {
              const defaultModel = models.find((m: any) => m.is_default && (m.capabilities || []).includes(cap));
              return (
                <div key={cap} className="rounded-lg border border-line p-3">
                  <div className="text-xs font-semibold uppercase text-muted">{cap.replace(/_/g, " ")}</div>
                  <div className="mt-1 text-sm font-medium text-ink">{defaultModel?.name || "Not assigned"}</div>
                  <div className="text-xs text-muted">{defaultModel?.provider_slug || "-"} · ${defaultModel?.pricing_input_per_1k || "-"}/1k input</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Configuration */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Database className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">System Configuration</h3>
              <p className="text-xs text-muted">Global AI platform settings and defaults</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Total Providers</span>
              <div className="text-xl font-bold text-ink">{providers.length}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Active Models</span>
              <div className="text-xl font-bold text-ink">{models.length}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Prompt Templates</span>
              <div className="text-xl font-bold text-ink">{prompts.length}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Monthly Budget</span>
              <div className="text-xl font-bold text-ink">${Math.round(providerStats?.total_budget || 0)}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Budget Spent</span>
              <div className="text-xl font-bold text-ink">${Math.round(providerStats?.total_spent || 0)}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <span className="text-xs font-medium text-muted">Avg Cost/Request</span>
              <div className="text-xl font-bold text-ink">${(usage?.total_cost && usage?.total_requests ? (usage.total_cost / usage.total_requests) : 0).toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-accent/20 bg-accent/5 p-4">
          <BrainCircuit className="h-6 w-6 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">AI Platform Status</p>
            <p className="text-xs text-muted">
              {providers.length > 0
                ? `${providerStats?.healthy || 0}/${providers.length} providers healthy · ${models.filter((m: any) => m.is_default).length} default models · ${prompts.length} prompt templates`
                : "No providers configured — seed data required"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${providerStats?.healthy === providers.length && providers.length > 0 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
            {providerStats?.healthy === providers.length && providers.length > 0 ? "All Systems Operational" : "Configuration Required"}
          </span>
        </div>
      </div>
    );
  };

  /* ================================================================== */
  /*  LAYOUT                                                            */
  /* ================================================================== */

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">AI Commerce Platform</h1>
          <p className="text-sm text-muted">Enterprise AI — providers, models, prompts, quality, and automation</p>
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

/* Sub-tab components */
function ProductAITab() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [results, setResults] = useState<any>(null);

  const generate = async () => {
    const body = { productName: name, brand };
    const [titleRes, descRes, featRes, seoRes, faqRes] = await Promise.all([
      fetch(`${API_BASE}/product/title`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
      fetch(`${API_BASE}/product/description`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
      fetch(`${API_BASE}/product/features`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
      fetch(`${API_BASE}/product/seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
      fetch(`${API_BASE}/product/faqs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    ]);
    setResults({ title: titleRes.data?.title, description: descRes.data?.description, features: featRes.data?.features, seo: seoRes.data, faqs: faqRes.data?.faqs });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" className="input flex-1" />
        <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand" className="input w-48" />
        <button onClick={generate} disabled={!name} className="btn-primary btn-sm">Generate All</button>
      </div>
      {results && (
        <div className="space-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
          <div><strong className="text-ink">Title:</strong> <span className="text-muted">{results.title}</span></div>
          <div><strong className="text-ink">Description:</strong><p className="mt-1 text-muted whitespace-pre-wrap">{results.description}</p></div>
          {results.features && <div><strong className="text-ink">Features:</strong><ul className="mt-1 list-inside list-disc text-muted">{results.features.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul></div>}
          {results.seo && <div className="text-xs"><strong className="text-ink">SEO Title:</strong> <span className="text-muted">{results.seo.meta_title}</span><br /><strong className="text-ink">Meta Desc:</strong> <span className="text-muted">{results.seo.meta_description}</span></div>}
          {results.faqs && <div><strong className="text-ink">FAQs:</strong><div className="mt-1 space-y-1">{results.faqs.map((f: any, i: number) => <div key={i} className="text-xs text-muted"><strong>Q:</strong> {f.question}<br /><strong>A:</strong> {f.answer}</div>)}</div></div>}
        </div>
      )}
    </div>
  );
}

function AffiliateAITab() {
  const [progRes, setProgRes] = useState<any>(null);
  const loadPrograms = async () => {
    const res = await fetch(`${API_BASE}/affiliate/compare-programs`).then(r => r.json());
    if (res.success) setProgRes(res.data);
  };
  return (
    <div className="space-y-4">
      <button onClick={loadPrograms} className="btn-primary btn-sm">Compare Programs</button>
      {progRes && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-sm font-medium text-ink">Best Pick: {progRes.bestPick}</p>
          {progRes.programs?.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
              <span className="text-ink">{p.name}</span>
              <span className="text-muted">{p.commission}% · {p.cookieDays}d cookies · Score: {p.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceAITab() {
  const [cost, setCost] = useState("50");
  const [margin, setMargin] = useState("40");
  const [priceRes, setPriceRes] = useState<any>(null);
  const recommend = async () => {
    const res = await fetch(`${API_BASE}/price/recommend`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cost_price: parseFloat(cost), desired_margin: parseFloat(margin) }),
    }).then(r => r.json());
    if (res.success) setPriceRes(res.data);
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Cost price" type="number" className="input w-40" />
        <input value={margin} onChange={e => setMargin(e.target.value)} placeholder="Desired margin %" type="number" className="input w-48" />
        <button onClick={recommend} className="btn-primary btn-sm">Recommend Price</button>
      </div>
      {priceRes && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${priceRes.recommended_price}</div>
            <div className="text-xs text-muted">Recommended Price</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="text-2xl font-bold text-ink">{priceRes.margin_percent}%</div>
            <div className="text-xs text-muted">Margin</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="text-2xl font-bold text-ink">${priceRes.profit}</div>
            <div className="text-xs text-muted">Profit</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerAITab() {
  const [segRes, setSegRes] = useState<any>(null);
  const loadSegments = async () => {
    const res = await fetch(`${API_BASE}/customer/segments`).then(r => r.json());
    if (res.success) setSegRes(res.data);
  };
  return (
    <div className="space-y-4">
      <button onClick={loadSegments} className="btn-primary btn-sm">Analyze Segments</button>
      {segRes && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {segRes.segments?.map((s: any, i: number) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-4">
              <div className="text-lg font-bold text-ink">{s.name}</div>
              <div className="text-2xl font-bold text-accent">{s.count}</div>
              <div className="text-xs text-muted">{s.percentage}% · {s.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommerceAITab() {
  const [forecast, setForecast] = useState<any>(null);
  const loadForecast = async () => {
    const [revRes, ordRes] = await Promise.all([
      fetch(`${API_BASE}/commerce/forecast-revenue?months=6`).then(r => r.json()),
      fetch(`${API_BASE}/commerce/forecast-orders?months=6`).then(r => r.json()),
    ]);
    if (revRes.success && ordRes.success) setForecast({ revenue: revRes.data, orders: ordRes.data });
  };
  return (
    <div className="space-y-4">
      <button onClick={loadForecast} className="btn-primary btn-sm">Generate Forecast</button>
      {forecast && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-surface p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted">Revenue Forecast</h4>
            <div className="text-2xl font-bold text-green-600">${(forecast.revenue.total / 1000000).toFixed(1)}M</div>
            <div className="mt-2 space-y-1">
              {forecast.revenue.forecasts?.slice(0, 6).map((f: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-muted">
                  <span>{f.month}</span>
                  <span>${(f.revenue / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted">Orders Forecast</h4>
            <div className="text-2xl font-bold text-ink">{forecast.orders.total.toLocaleString()}</div>
            <div className="mt-2 space-y-1">
              {forecast.orders.forecasts?.slice(0, 6).map((f: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-muted">
                  <span>{f.month}</span>
                  <span>{f.orders} orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchAITab() {
  const [query, setQuery] = useState("");
  const [searchRes, setSearchRes] = useState<any>(null);
  const search = async () => {
    const [semRes, intentRes] = await Promise.all([
      fetch(`${API_BASE}/search/semantic`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) }).then(r => r.json()),
      fetch(`${API_BASE}/search/intent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) }).then(r => r.json()),
    ]);
    if (semRes.success || intentRes.success) setSearchRes({ results: semRes.data, intent: intentRes.data });
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Natural language search..." className="input flex-1" />
        <button onClick={search} disabled={!query} className="btn-primary btn-sm">Search</button>
      </div>
      {searchRes && (
        <div className="space-y-3">
          {searchRes.intent && (
            <div className="rounded-xl border border-line bg-surface p-3 text-sm">
              <strong className="text-ink">Intent:</strong> <span className="text-muted">{searchRes.intent.intent}</span>
              {searchRes.intent.category && <span className="ml-2 text-muted">· Category: {searchRes.intent.category}</span>}
              {searchRes.intent.attributes?.length > 0 && <span className="ml-2 text-muted">· {searchRes.intent.attributes.join(", ")}</span>}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(searchRes.results || []).slice(0, 6).map((p: any) => (
              <div key={p.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                <div className="font-medium text-ink">{p.name}</div>
                <div className="text-xs text-muted">{p.brand} · ${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
