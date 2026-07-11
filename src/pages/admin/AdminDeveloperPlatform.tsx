/**
 * ALAYA INSIDER — Enterprise Developer Platform Admin UI (PART 2.17)
 * 12 tabs: Dashboard | Extensions | Modules | SDKs | CLI | Generators |
 * Playground | AI Dev Tools | Productivity | Docs | Community | APIs
 */
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Puzzle, Box, Code2, Terminal, Wand2,
  Play, Bot, BarChart3, BookOpen, Users, Key,
  Plus, Search, CheckCircle2,
  Target, Globe, Star,
  ArrowUpDown, Crown,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getDeveloperDashboard, getDeveloperMetrics,
  getExtensionManifests, updateExtensionStatus,
  getPlatformModules, activateModule, deactivateModule,
  getSdkPackages,
  getCliCommands, getCliExtensions,
  getCodeGenerators, generateCode,
  getPlaygroundSessions, executeApiExplorerRequest,
  getDocPages, searchDocs, getReleaseNotes,
  getCommunityPosts, getFeatureRequests, upvoteFeatureRequest,
  getDeveloperApiKeys, createDeveloperApiKey, revokeDeveloperApiKey,
  getDeveloperWebhooks,
  aiReviewCode, aiGenerateDocumentation,
  analyzeDependencies,
} from "../../lib/developerPlatform";

type Tab =
  | "dashboard" | "extensions" | "modules" | "sdks" | "cli"
  | "generators" | "playground" | "aidev" | "productivity"
  | "docs" | "community" | "apis";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "extensions", label: "Extensions", icon: Puzzle },
  { id: "modules", label: "Modules", icon: Box },
  { id: "sdks", label: "SDKs", icon: Code2 },
  { id: "cli", label: "CLI", icon: Terminal },
  { id: "generators", label: "Generators", icon: Wand2 },
  { id: "playground", label: "Playground", icon: Play },
  { id: "aidev", label: "AI Dev Tools", icon: Bot },
  { id: "productivity", label: "Productivity", icon: BarChart3 },
  { id: "docs", label: "Documentation", icon: BookOpen },
  { id: "community", label: "Community", icon: Users },
  { id: "apis", label: "API Keys", icon: Key },
];

export default function AdminDeveloperPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Developer Platform" path="/admin/developer-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Developer Platform</h1>
            <p className="mt-1 text-sm text-muted">Extensions, modules, SDKs, CLI, generators, playground, documentation & community.</p>
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
        {tab === "extensions" && <ExtensionsTab />}
        {tab === "modules" && <ModulesTab />}
        {tab === "sdks" && <SdksTab />}
        {tab === "cli" && <CliTab />}
        {tab === "generators" && <GeneratorsTab />}
        {tab === "playground" && <PlaygroundTab />}
        {tab === "aidev" && <AiDevTab />}
        {tab === "productivity" && <ProductivityTab />}
        {tab === "docs" && <DocsTab />}
        {tab === "community" && <CommunityTab />}
        {tab === "apis" && <ApisTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const dash = useMemo(() => getDeveloperDashboard(), []);
  const metrics = useMemo(() => getDeveloperMetrics(), []);

  const STATS = [
    { label: "Extensions", value: `${dash.activeExtensions}/${dash.totalExtensions}`, sub: "Active", icon: Puzzle },
    { label: "Modules", value: `${dash.activatedModules}/${dash.totalModules}`, sub: "Activated", icon: Box },
    { label: "SDKs", value: `${dash.stableSdks}/${dash.totalSdks}`, sub: "Stable", icon: Code2 },
    { label: "CLI Commands", value: String(dash.totalCliCommands), sub: "Available", icon: Terminal },
    { label: "Generators", value: String(dash.totalGenerators), sub: "Templates", icon: Wand2 },
    { label: "Doc Pages", value: String(dash.totalDocPages), sub: "Published", icon: BookOpen },
  ];

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STATS.map((s) => (
          <div key={s.label} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Key Metrics</h3>
          <div className="mt-4 space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger")} />
                  <span className="text-sm text-ink">{m.name}</span>
                </div>
                <span className="text-sm font-semibold text-ink">{m.currentValue}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Feature Requests</h3>
          <div className="mt-4 space-y-3">
            {getFeatureRequests().slice(0, 3).map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{f.title}</p>
                  <span className="text-xs text-muted">{f.votes} votes · {f.status}</span>
                </div>
                <span className={cn("badge", f.status === "shipped" ? "bg-success/15 text-success" : f.status === "planned" ? "bg-accent-soft text-accent" : f.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EXTENSIONS TAB                                                     */
/* ================================================================== */

function ExtensionsTab() {
  const [exts, setExts] = useState(() => getExtensionManifests());
  const refresh = () => setExts(getExtensionManifests());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{exts.filter((e) => e.status === "active").length} active · {exts.length} total</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exts.map((e) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Puzzle className={cn("h-5 w-5", e.status === "active" ? "text-accent" : "text-muted")} />
                <div>
                  <p className="font-medium text-ink text-sm">{e.name}</p>
                  <p className="text-xs text-muted">v{e.version} · {e.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {e.verified && <span title="Verified"><CheckCircle2 className="h-3.5 w-3.5 text-success" /></span>}
                <span className={cn("badge", e.status === "active" ? "bg-success/15 text-success" : e.status === "disabled" ? "bg-surface2 text-muted" : "bg-danger/15 text-danger")}>{e.status}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{e.description}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="badge bg-accent-soft text-accent">{e.category}</span>
              <span className="badge bg-surface2 text-muted">{e.permissions.length} permissions</span>
              <span className="badge bg-surface2 text-muted">{e.hooks.length} hooks</span>
              {e.sandboxed && <span className="badge bg-success/15 text-success">Sandboxed</span>}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", e.healthScore >= 90 ? "bg-success" : e.healthScore >= 70 ? "bg-warning" : "bg-danger")} />
                <span className="text-xs text-muted">{e.healthScore}% health</span>
              </div>
              <button onClick={() => { updateExtensionStatus(e.id, e.status === "active" ? "disabled" : "active"); refresh(); }} className={cn("btn-ghost btn-sm", e.status === "active" ? "text-warning" : "text-success")}>{e.status === "active" ? "Disable" : "Enable"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MODULES TAB                                                        */
/* ================================================================== */

function ModulesTab() {
  const [mods, setMods] = useState(() => getPlatformModules());
  const refresh = () => setMods(getPlatformModules());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{mods.filter((m) => m.status === "activated").length} activated · {mods.filter((m) => m.status === "available").length} available</p>
      <div className="space-y-3">
        {mods.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Box className={cn("h-5 w-5", m.status === "activated" ? "text-accent" : m.status === "available" ? "text-muted" : "text-warning")} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{m.name}</p>
                    <span className="badge bg-surface2 text-muted">v{m.version}</span>
                    <span className={cn("badge", m.status === "activated" ? "bg-success/15 text-success" : m.status === "available" ? "bg-accent-soft text-accent" : "bg-warning/15 text-warning")}>{m.status}</span>
                    <span className={cn("badge", m.healthStatus === "healthy" ? "bg-success/15 text-success" : m.healthStatus === "degraded" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{m.healthStatus}</span>
                  </div>
                  <p className="text-xs text-muted">{m.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    <span className="badge bg-accent-soft text-accent">{m.category}</span>
                    <span className="badge bg-surface2 text-muted">Priority {m.priority}</span>
                    {m.hasUI && <span className="badge bg-surface2 text-muted">UI</span>}
                    {m.hasAPI && <span className="badge bg-surface2 text-muted">API</span>}
                    {m.hasWorker && <span className="badge bg-surface2 text-muted">Worker</span>}
                    {m.dependencies.map((d) => <span key={d} className="badge bg-surface2 text-muted">{d}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {m.status === "activated" && <button onClick={() => { deactivateModule(m.id); refresh(); }} className="btn-ghost btn-sm text-xs text-warning">Deactivate</button>}
                {(m.status === "available" || m.status === "deactivated") && <button onClick={() => { activateModule(m.id); refresh(); }} className="btn-ghost btn-sm text-xs text-success">Activate</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SDKs TAB                                                           */
/* ================================================================== */

function SdksTab() {
  const sdks = useMemo(() => getSdkPackages(), []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{sdks.filter((s) => s.status === "stable").length} stable · {sdks.length} SDKs</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sdks.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-ink text-sm">{s.name}</p>
                <span className="badge bg-surface2 text-muted">{s.language}</span>
              </div>
              <span className={cn("ml-auto badge", s.status === "stable" ? "bg-success/15 text-success" : s.status === "beta" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{s.status}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{s.description}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="badge bg-accent-soft text-accent">v{s.version}</span>
              <span className="badge bg-surface2 text-muted">{s.license}</span>
              {s.downloads && <span className="badge bg-surface2 text-muted">{s.downloads.toLocaleString()} downloads</span>}
            </div>
            <div className="mt-2 rounded-lg bg-surface2/50 p-2">
              <code className="text-xs text-ink">{s.installCommand}</code>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.features.map((f) => <span key={f} className="badge bg-accent-soft/50 text-accent text-[10px]">{f}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CLI TAB                                                            */
/* ================================================================== */

function CliTab() {
  const commands = useMemo(() => getCliCommands(), []);
  const extensions = useMemo(() => getCliExtensions(), []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{commands.length} commands · {extensions.filter((e) => e.installed).length} CLI extensions</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {commands.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-accent" />
              <p className="font-mono font-medium text-ink text-sm">alaya {c.name}</p>
              <span className="badge bg-accent-soft text-accent text-xs capitalize">{c.category}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{c.description}</p>
            <code className="mt-2 block rounded-lg bg-surface2/50 px-2 py-1 text-xs text-ink">{c.usage}</code>
            {c.flags.length > 0 && (
              <div className="mt-2 space-y-1">
                {c.flags.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-mono text-accent">{f.alias ? `-${f.alias}, ` : ""}--{f.name}</span>
                    <span>{f.description}{f.required ? " *" : ""}</span>
                  </div>
                ))}
              </div>
            )}
            {c.examples.length > 0 && (
              <div className="mt-2 space-y-1">
                {c.examples.map((ex, i) => <code key={i} className="block text-xs text-muted">$ {ex}</code>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  GENERATORS TAB                                                     */
/* ================================================================== */

function GeneratorsTab() {
  const [generators] = useState(() => getCodeGenerators());
  const [selectedGen, setSelectedGen] = useState<string | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  const gen = selectedGen ? generators.find((g) => g.id === selectedGen) : null;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{generators.length} code generators available</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generators.map((g) => (
          <button key={g.id} onClick={() => { setSelectedGen(g.id); setVars({}); setResult(null); }} className={cn("card p-4 text-left transition-all", selectedGen === g.id && "ring-2 ring-accent")}>
            <Wand2 className="h-5 w-5 text-accent" />
            <p className="mt-2 font-medium text-ink text-sm">{g.name}</p>
            <p className="text-xs text-muted">{g.description}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="badge bg-accent-soft text-accent">{g.type}</span>
              <span className="badge bg-surface2 text-muted">{g.language}</span>
              {g.tags.map((t) => <span key={t} className="badge bg-surface2 text-muted">{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      {gen && (
        <div className="card mt-6 p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Wand2 className="h-4 w-4 text-accent" /> {gen.name}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {gen.variables.map((v) => (
              <div key={v.name}>
                <label className="label-field">{v.label}{v.required ? "*" : ""}</label>
                {v.type === "boolean" ? (
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={vars[v.name] === "true"} onChange={(e) => setVars({ ...vars, [v.name]: String(e.target.checked) })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    {v.label}
                  </label>
                ) : v.type === "select" && v.options ? (
                  <select className="input-field" value={vars[v.name] || v.defaultValue || ""} onChange={(e) => setVars({ ...vars, [v.name]: e.target.value })}>
                    {v.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="input-field" value={vars[v.name] || ""} onChange={(e) => setVars({ ...vars, [v.name]: e.target.value })} placeholder={v.defaultValue} />
                )}
              </div>
            ))}
          </div>
          <button onClick={() => { const r = generateCode(gen.id, vars); if (r) setResult(r); }} className="btn-primary btn-sm mt-3">Generate</button>

          {result && (
            <div className="mt-4">
              <p className="font-medium text-ink text-sm mb-2">Generated Artifact</p>
              <pre className="max-h-60 overflow-y-auto rounded-lg bg-surface2/50 p-3 text-xs text-muted whitespace-pre-wrap">{JSON.stringify(result.files, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PLAYGROUND TAB                                                     */
/* ================================================================== */

function PlaygroundTab() {
  const [sessions] = useState(() => getPlaygroundSessions());
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v1/products");
  const [apiResult, setApiResult] = useState<any>(null);

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Explorer */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> API Explorer</h3>
          <div className="flex gap-2">
            <select className="input-field w-24 text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
            </select>
            <input className="input-field flex-1 font-mono text-xs" value={path} onChange={(e) => setPath(e.target.value)} />
            <button onClick={() => { const r = executeApiExplorerRequest({ method: method as any, path, headers: { "Content-Type": "application/json" }, saved: false }); setApiResult(r); }} className="btn-primary btn-sm"><Play className="h-4 w-4" /></button>
          </div>
          {apiResult && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn("badge", apiResult.response.status < 400 ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{apiResult.response.status}</span>
                <span className="text-xs text-muted">{apiResult.response.durationMs}ms</span>
              </div>
              <pre className="max-h-40 overflow-y-auto rounded-lg bg-surface2/50 p-2 text-xs text-muted">{JSON.stringify(JSON.parse(apiResult.response.body), null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Play className="h-4 w-4 text-accent" /> Playground Sessions</h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface2/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <span className="badge bg-accent-soft text-accent text-xs">{s.type}</span>
                </div>
                <span className="text-xs text-muted">{formatDate(s.createdAt)}</span>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-muted">No playground sessions yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AI DEV TOOLS TAB                                                   */
/* ================================================================== */

function AiDevTab() {
  const [codeInput, setCodeInput] = useState("function processOrder(items) {\n  let total = 0;\n  for(let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}");
  const [review, setReview] = useState<any>(null);

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Code Review */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /> AI Code Review</h3>
          <textarea className="input-field h-32 font-mono text-xs" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
          <button onClick={() => setReview(aiReviewCode(codeInput, "TypeScript"))} className="btn-primary btn-sm mt-2">Review</button>
          {review && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-ink">{review.score}/100</span>
                <span className={cn("badge", review.score >= 80 ? "bg-success/15 text-success" : review.score >= 60 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{review.score >= 80 ? "Good" : review.score >= 60 ? "Needs work" : "Poor"}</span>
              </div>
              {review.issues.map((iss: any, i: number) => (
                <div key={i} className="rounded-lg bg-surface2/50 p-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", iss.severity === "error" ? "bg-danger/15 text-danger" : iss.severity === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent")}>{iss.severity}</span>
                    <span className="text-xs text-muted">Line {iss.line}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink">{iss.message}</p>
                  <p className="text-xs text-muted">{iss.suggestion}</p>
                </div>
              ))}
              <div className="mt-2">
                <p className="text-xs font-medium text-ink">Suggestions:</p>
                {review.suggestions.map((s: string, i: number) => <p key={i} className="text-xs text-muted">• {s}</p>)}
              </div>
            </div>
          )}
        </div>

        {/* AI Documentation Generator */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> AI Documentation Generator</h3>
          <textarea className="input-field h-20 font-mono text-xs" defaultValue="export function calculateDiscount(price: number, percent: number): number" />
          <button onClick={() => {}} className="btn-primary btn-sm mt-2">Generate Docs</button>
          <pre className="mt-3 rounded-lg bg-surface2/50 p-3 text-xs text-muted whitespace-pre-wrap">{aiGenerateDocumentation("", "", "Calculate discount amount")}</pre>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PRODUCTIVITY TAB                                                   */
/* ================================================================== */

function ProductivityTab() {
  const deps = useMemo(() => analyzeDependencies(), []);

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dependency Analysis */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Box className="h-4 w-4 text-accent" /> Dependency Analysis</h3>
          <div className="space-y-2">
            {deps.map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-lg bg-surface2/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink">{d.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>v{d.version}</span>
                    {d.outdated && <span className="text-warning">→ v{d.latestVersion}</span>}
                    <span>{d.license}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.vulnerabilities > 0 && <span className="badge bg-danger/15 text-danger">{d.vulnerabilities} vuln</span>}
                  <span className={cn("h-2 w-2 rounded-full", d.outdated ? "bg-warning" : d.vulnerabilities > 0 ? "bg-danger" : "bg-success")} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complexity Analysis */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Code Complexity Analyzer</h3>
          <textarea className="input-field h-24 font-mono text-xs" defaultValue="function processOrder(items) { let total = 0; for(let i = 0; i < items.length; i++) { total += items[i].price; } return total; }" />
          <button onClick={() => {}} className="btn-primary btn-sm mt-2">Analyze</button>
          <div className="mt-3 rounded-lg bg-surface2/50 p-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><p className="text-lg font-semibold text-ink">3</p><p className="text-muted">Lines</p></div>
              <div><p className="text-lg font-semibold text-ink">1</p><p className="text-muted">Complexity</p></div>
              <div><p className="text-lg font-semibold text-success">95%</p><p className="text-muted">Score</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports */}        <div className="card mt-6 p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Developer Reports</h3>
          <p className="text-xs text-muted">Generate reports for extensions, SDKs, CLI, generators, docs & community.</p>
        </div>
    </div>
  );
}

/* ================================================================== */
/*  DOCUMENTATION TAB                                                  */
/* ================================================================== */

function DocsTab() {
  const [query, setQuery] = useState("");
  const pages = useMemo(() => getDocPages(), []);
  const searchResults = useMemo(() => query.trim() ? searchDocs(query) : [], [query]);
  const rns = useMemo(() => getReleaseNotes(), []);

  return (
    <div className="mt-8">
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentation…" className="input-field pl-9" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> Documentation Pages ({pages.length})</h3>
          {query.trim() ? (
            <div className="space-y-2">
              {searchResults.map((r) => (
                <div key={r.pageId} className="card p-3">
                  <p className="font-medium text-ink text-sm">{r.title}</p>
                  <p className="text-xs text-muted">{r.snippet}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="badge bg-accent-soft text-accent">{r.category}</span>
                    <span className="text-muted">Relevance: {Math.round(r.relevance * 100)}%</span>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && <p className="text-sm text-muted">No results for "{query}"</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((p) => (
                <div key={p.id} className="card p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink text-sm">{p.title}</p>
                    <span className="badge bg-accent-soft text-accent text-xs">{p.category.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{p.description}</p>
                  <p className="text-[10px] text-muted mt-0.5">Updated {formatDate(p.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Release Notes</h3>
          <div className="space-y-3">
            {rns.map((rn) => (
              <div key={rn.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", rn.type === "major" ? "bg-accent-soft text-accent" : rn.type === "minor" ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{rn.type}</span>
                    <p className="font-semibold text-ink">v{rn.version}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDate(rn.date)}</span>
                </div>
                <p className="mt-1 text-sm text-ink">{rn.title}</p>
                {rn.highlights.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rn.highlights.map((h) => <span key={h} className="badge bg-accent-soft/50 text-accent text-[10px]">{h}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMMUNITY TAB                                                      */
/* ================================================================== */

function CommunityTab() {
  const posts = useMemo(() => getCommunityPosts(), []);
  const [frs, setFrs] = useState(() => getFeatureRequests());
  const refreshFrs = () => setFrs(getFeatureRequests());

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Posts */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Community Posts</h3>
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="card p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink text-sm">{p.title}</p>
                      {p.pinned && <Crown className="h-3.5 w-3.5 text-accent" />}
                      <span className="badge bg-accent-soft text-accent text-xs">{p.category}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">by {p.authorName} · {p.views} views</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted">
                    <ArrowUpDown className="h-3 w-3" /> {p.votes}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted line-clamp-2">{p.content}</p>
                <div className="mt-1 flex gap-2 text-xs text-muted">
                  <span>{p.answers} answers</span>
                  {p.resolved && <span className="text-success">✓ Resolved</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Requests */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Feature Requests</h3>
          <div className="space-y-2">
            {frs.map((f) => (
              <div key={f.id} className="card p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink text-sm">{f.title}</p>
                      <span className={cn("badge", f.status === "shipped" ? "bg-success/15 text-success" : f.status === "planned" ? "bg-accent-soft text-accent" : f.status === "in_progress" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{f.status.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-muted">{f.description}</p>
                  </div>
                  <button onClick={() => { upvoteFeatureRequest(f.id); refreshFrs(); }} className="flex shrink-0 items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-xs text-muted hover:bg-accent-soft hover:text-accent">
                    <ArrowUpDown className="h-3 w-3" /> {f.votes}
                  </button>
                </div>
                {f.comments.length > 0 && (
                  <div className="mt-2 border-t border-line pt-2">
                    {f.comments.map((c, i) => <p key={i} className="text-xs text-muted"><span className="font-medium text-ink">{c.authorName}:</span> {c.content}</p>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  API KEYS TAB                                                       */
/* ================================================================== */

function ApisTab() {
  const [keys, setKeys] = useState(() => getDeveloperApiKeys());
  const [whs] = useState(() => getDeveloperWebhooks());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", scopes: ["products:read"] as string[], rateLimit: 1000, allowedIps: [] as string[] });
  const refreshKeys = () => setKeys(getDeveloperApiKeys());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{keys.filter((k) => k.active).length} active keys</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New API Key</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New API Key</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="Key name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" type="number" placeholder="Rate limit" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value) || 1000 })} />
          </div>
          <button onClick={() => { if (form.name) { createDeveloperApiKey(form as any); setShowForm(false); refreshKeys(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className={cn("h-4 w-4", k.active ? "text-accent" : "text-muted")} />
                  <div>
                    <p className="font-medium text-ink text-sm">{k.name}</p>
                    <code className="text-xs text-muted">{k.key.slice(0, 20)}...</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("badge", k.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{k.active ? "Active" : "Revoked"}</span>
                  {k.active && <button onClick={() => { revokeDeveloperApiKey(k.id); refreshKeys(); }} className="btn-ghost btn-sm text-xs text-danger">Revoke</button>}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                <span className="badge bg-surface2">{k.scopes.length} scopes</span>
                <span className="badge bg-surface2">{k.usageCount.toLocaleString()} requests</span>
                <span className="badge bg-surface2">{k.rateLimit}/min</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Webhook Subscriptions</h3>
          <div className="space-y-2">
            {whs.map((w) => (
              <div key={w.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <code className="text-xs text-ink truncate flex-1">{w.url}</code>
                  <span className={cn("badge", w.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{w.active ? "Active" : "Inactive"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                  {w.events.map((ev) => <span key={ev} className="badge bg-surface2">{ev}</span>)}
                </div>
              </div>
            ))}
            {whs.length === 0 && <p className="text-sm text-muted">No webhooks configured</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
