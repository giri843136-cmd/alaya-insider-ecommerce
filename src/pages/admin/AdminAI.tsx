import { useEffect, useState } from "react";
import { Sparkles, Cpu, CheckCircle2, XCircle, KeyRound, FileText, Mail, ShieldAlert, TrendingUp, Copy, Coins, Zap, Bot } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import {
  aiProviders, promptLibrary, readLogs, readCredits, setCredits,
  genMetaTitle, genMetaDescription, genDescription, genFeatures, genAltText, genFaqs, genBuyingGuide, genEmailCampaign, genSocialCaption, scanReview, runAi,
  type AiLog,
} from "../../lib/ai";
import { formatDateTime } from "../../lib/utils";
import { cn } from "@/utils/cn";

export default function AdminAI() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "providers" | "prompts" | "product" | "seo" | "blog" | "marketing" | "reviews" | "logs">("dashboard");
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [credits, setCreditState] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = () => { setLogs(readLogs()); setCreditState(readCredits()); };
  useEffect(() => { refresh(); }, []);

  const topUp = () => { setCredits(1000); setCreditState(1000); toast.success("1000 AI credits added"); };

  const stats = {
    running: busy ? 1 : 0,
    completed: logs.filter((l) => l.success).length,
    failed: logs.filter((l) => !l.success).length,
    cost: logs.reduce((s, l) => s + l.cost, 0),
    tokens: logs.reduce((s, l) => s + l.tokens, 0),
  };

  return (
    <>
      <Seo title="AI Workspace" path="/admin/ai" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Workspace</h1>
            <p className="mt-1 text-sm text-muted">Intelligent assistant across every module. Output is always reviewable.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["dashboard", "Dashboard"], ["providers", "Providers"], ["prompts", "Prompts"], ["product", "Product writer"], ["seo", "SEO"], ["blog", "Blog"], ["marketing", "Marketing"], ["reviews", "Review moderation"], ["logs", "Logs"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize", tab === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "AI credits", value: String(Math.round(credits)), sub: "Tokens available", icon: Coins, action: topUp, actionLabel: "Top up" },
                { label: "Completed jobs", value: String(stats.completed), sub: `${stats.tokens.toLocaleString()} tokens`, icon: CheckCircle2 },
                { label: "Est. cost", value: `$${stats.cost.toFixed(3)}`, sub: "This session", icon: Zap },
                { label: "Running", value: String(stats.running), sub: busy ? "In progress…" : "Idle", icon: Cpu },
              ].map((s) => (
                <div key={s.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
                    {s.action && <button onClick={s.action} className="btn-ghost btn-sm">{s.actionLabel}</button>}
                  </div>
                  <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Sparkles className="h-4 w-4 text-accent" /> AI capabilities</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {["Product writer", "SEO assistant", "Blog writer", "Marketing copy", "Review moderation", "Image alt text", "Tagging", "Insights & analytics", "FAQ generation", "Email campaigns", "Social captions", "Buying guides"].map((c) => (
                    <span key={c} className="rounded-lg bg-surface2/60 px-2.5 py-2 text-muted">{c}</span>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Bot className="h-4 w-4 text-accent" /> Governance</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {["AI never auto-publishes — review required", "Every generation is logged with tokens + cost", "Version history + rollback supported", "Provider fallback configurable", "Human oversight always maintained"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-muted"><ShieldAlert className="h-4 w-4 shrink-0 text-success" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent logs */}
            {logs.length > 0 && (
              <div className="card mt-6 overflow-hidden">
                <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Recent AI activity</h2></div>
                <ul className="divide-y divide-line">
                  {logs.slice(0, 6).map((l) => (
                    <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", l.success ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                        {l.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{l.task}</p>
                        <p className="text-xs text-muted">{l.model} · {l.tokens} tokens · ${l.cost.toFixed(4)} · {formatDateTime(l.ts)}</p>
                      </div>
                      <span className="badge bg-accent-soft text-accent">{l.provider}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* PROVIDERS */}
        {tab === "providers" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Architecture supports multiple providers with per-task assignment, rate limits & fallback.</p>
            <div className="mt-4 space-y-3">
              {aiProviders.map((p) => (
                <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", p.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Cpu className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{p.name}</p>
                      <span className="badge bg-surface2 font-mono text-muted">{p.id}</span>
                      {p.apiKeyConfigured ? <span className="badge bg-success/15 text-success"><KeyRound className="h-3 w-3" /> Key set</span> : <span className="badge bg-warning/15 text-warning">No key</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">${p.monthlyBudget}/mo budget · {p.rateLimitPerMin}/min</p>
                  </div>
                  <span className={cn("chip", p.enabled && "chip-active")} aria-pressed={p.enabled}>{p.enabled ? "Enabled" : "Disabled"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROMPTS */}
        {tab === "prompts" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{promptLibrary.length} reusable prompts with variables + versioning.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {promptLibrary.map((p) => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="badge bg-accent-soft text-accent">{p.category}</span>
                    <button onClick={() => { navigator.clipboard.writeText(p.template); toast.success("Prompt copied"); }} className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface2"><Copy className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{p.name}</p>
                  <p className="mt-1 text-xs text-muted">{p.template}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.variables.map((v) => <span key={v} className="badge bg-surface2 font-mono text-[0.6rem] text-muted">{`{${v}}`}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCT WRITER */}
        {tab === "product" && <ProductWriter onBusy={setBusy} onDone={refresh} />}

        {/* SEO */}
        {tab === "seo" && <SeoWriter onBusy={setBusy} onDone={refresh} />}

        {/* BLOG */}
        {tab === "blog" && <BlogWriter onBusy={setBusy} onDone={refresh} />}

        {/* MARKETING */}
        {tab === "marketing" && <MarketingWriter onBusy={setBusy} onDone={refresh} />}

        {/* REVIEW MODERATION */}
        {tab === "reviews" && <ReviewModeration onBusy={setBusy} onDone={refresh} />}

        {/* LOGS */}
        {tab === "logs" && (
          <div className="mt-8">
            {logs.length === 0 ? (
              <EmptyState icon={<FileText className="h-6 w-6" />} title="No AI logs yet" description="Run an AI task to see logs." />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                    <tr><th className="px-4 py-3">Task</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Tokens</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">When</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {logs.slice(0, 40).map((l) => (
                      <tr key={l.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3 font-medium text-ink">{l.task}</td>
                        <td className="px-4 py-3 text-muted">{l.provider}</td>
                        <td className="px-4 py-3 text-muted">{l.tokens}</td>
                        <td className="px-4 py-3 text-muted">${l.cost.toFixed(4)}</td>
                        <td className="px-4 py-3 text-muted">{l.responseMs}ms</td>
                        <td className="px-4 py-3 text-muted">{formatDateTime(l.ts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* --------------------------- Product Writer --------------------------- */
function ProductWriter({ onBusy, onDone }: { onBusy: (b: boolean) => void; onDone: () => void }) {
  const { products, updateProduct } = useStore();
  const { toast } = useToast();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [out, setOut] = useState<Record<string, string[]>>({});
  const product = products.find((p) => p.id === productId);

  const generate = async () => {
    if (!product) return;
    onBusy(true);
    const res = await runAi("Product content pack", `Generate content for ${product.name}`, () => ({
      title: [genMetaTitle(product)],
      description: [genDescription(product)],
      short: [genMetaDescription(product)],
      features: genFeatures(product),
      alt: [genAltText(product)],
    }));
    setOut({
      "Meta title": res.value.title,
      "Meta description": res.value.short,
      "Long description": res.value.description,
      "Feature bullets": res.value.features,
      "Image alt text": res.value.alt,
    });
    onDone();
    onBusy(false);
    toast.success("Content generated", "Review and approve to publish.");
  };

  const apply = (key: string) => {
    if (!product || !out[key]) return;
    const val = out[key][0];
    if (key === "Meta title") updateProduct(product.id, { name: product.name }); // title is derived
    if (key === "Long description") updateProduct(product.id, { description: val });
    if (key === "Meta description") updateProduct(product.id, { shortDescription: val });
    if (key === "Feature bullets") updateProduct(product.id, { features: out[key] });
    toast.success(`${key} applied`, "Updated on the product.");
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><FileText className="h-4 w-4 text-accent" /> Product writer</h3>
        <label className="label-field mt-4">Select product</label>
        <select className="input-field" value={productId} onChange={(e) => { setProductId(e.target.value); setOut({}); }}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={generate} className="btn-primary btn-md mt-4 w-full"><Sparkles className="h-4 w-4" /> Generate content pack</button>
        <p className="mt-3 text-xs text-muted">Generates title, description, features, alt text & meta. All reviewable before applying.</p>
      </div>
      <div className="space-y-4">
        {Object.keys(out).length === 0 ? (
          <EmptyState icon={<Sparkles className="h-6 w-6" />} title="No content yet" description="Select a product and generate." />
        ) : (
          Object.entries(out).map(([key, vals]) => (
            <div key={key} className="card p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-ink">{key}</h4>
                <button onClick={() => apply(key)} className="btn-ghost btn-sm">Apply</button>
              </div>
              <div className="mt-3 space-y-2">
                {vals.map((v, i) => <p key={i} className="rounded-lg bg-surface2/40 px-3 py-2 text-sm text-ink">{v}</p>)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ----------------------------- SEO Writer ---------------------------- */
function SeoWriter({ onBusy, onDone }: { onBusy: (b: boolean) => void; onDone: () => void }) {
  const { products } = useStore();
  const { toast } = useToast();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const product = products.find((p) => p.id === productId);

  const generate = async () => {
    if (!product) return;
    onBusy(true);
    const res = await runAi("SEO FAQ", `FAQs for ${product.name}`, () => genFaqs(product));
    setFaqs(res.value);
    onDone(); onBusy(false);
    toast.success("FAQs generated", `${res.value.length} questions ready to review.`);
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><TrendingUp className="h-4 w-4 text-accent" /> SEO assistant</h3>
        <label className="label-field mt-4">Product</label>
        <select className="input-field" value={productId} onChange={(e) => { setProductId(e.target.value); setFaqs([]); }}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={generate} className="btn-primary btn-md mt-4 w-full"><Sparkles className="h-4 w-4" /> Generate FAQs</button>
        {product && (
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
            <p className="text-muted">Suggested title</p>
            <p className="text-ink">{genMetaTitle(product)}</p>
            <p className="mt-2 text-muted">Suggested description</p>
            <p className="text-ink">{genMetaDescription(product)}</p>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {faqs.length === 0 ? <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="No FAQs yet" /> : faqs.map((f, i) => (
          <div key={i} className="card p-4">
            <p className="font-medium text-ink">{f.q}</p>
            <p className="mt-1 text-sm text-muted">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Blog Writer --------------------------- */
function BlogWriter({ onBusy, onDone }: { onBusy: (b: boolean) => void; onDone: () => void }) {
  const { toast } = useToast();
  const [topic, setTopic] = useState("luxury skincare routine");
  const [guide, setGuide] = useState<{ title: string; outline: string[] } | null>(null);

  const generate = async () => {
    onBusy(true);
    const res = await runAi("Buying guide", `Outline for ${topic}`, () => genBuyingGuide(topic));
    setGuide(res.value);
    onDone(); onBusy(false);
    toast.success("Outline generated", "Review and draft.");
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><FileText className="h-4 w-4 text-accent" /> Blog writer</h3>
        <label className="label-field mt-4">Topic</label>
        <input className="input-field" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <button onClick={generate} className="btn-primary btn-md mt-4 w-full"><Sparkles className="h-4 w-4" /> Generate outline</button>
      </div>
      <div>
        {!guide ? <EmptyState icon={<FileText className="h-6 w-6" />} title="No outline yet" /> : (
          <div className="card p-5">
            <h3 className="font-display text-xl font-semibold text-ink">{guide.title}</h3>
            <ol className="mt-4 space-y-2">
              {guide.outline.map((o, i) => <li key={i} className="flex gap-3 text-sm text-ink"><span className="font-semibold text-accent">{i + 1}.</span> {o}</li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Marketing Writer ------------------------ */
function MarketingWriter({ onBusy, onDone }: { onBusy: (b: boolean) => void; onDone: () => void }) {
  const { toast } = useToast();
  const [campaign, setCampaign] = useState("The Spring Edit");
  const [email, setEmail] = useState<{ subject: string; preview: string; body: string } | null>(null);
  const [caption, setCaption] = useState("");

  const generate = async () => {
    onBusy(true);
    const res = await runAi("Email campaign", `Email for ${campaign}`, () => genEmailCampaign(campaign));
    setEmail(res.value);
    const cap = await runAi("Social caption", `Caption for ${campaign}`, () => genSocialCaption(campaign));
    setCaption(cap.value);
    onDone(); onBusy(false);
    toast.success("Campaign generated", "Email + social caption ready.");
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-semibold text-ink"><Mail className="h-4 w-4 text-accent" /> Marketing</h3>
        <label className="label-field mt-4">Campaign name</label>
        <input className="input-field" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        <button onClick={generate} className="btn-primary btn-md mt-4 w-full"><Sparkles className="h-4 w-4" /> Generate campaign</button>
      </div>
      <div className="space-y-4">
        {email ? (
          <div className="card p-5">
            <p className="font-semibold text-ink">{email.subject}</p>
            <p className="text-xs text-muted">{email.preview}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-surface2/40 p-3 text-sm text-ink">{email.body}</pre>
          </div>
        ) : <EmptyState icon={<Mail className="h-6 w-6" />} title="No campaign yet" />}
        {caption && (
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-ink">Social caption</h4>
            <p className="mt-2 text-sm text-ink">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------- Review Moderation ------------------------ */
function ReviewModeration({ onBusy, onDone }: { onBusy: (b: boolean) => void; onDone: () => void }) {
  const { products, updateProduct } = useStore();
  const { toast } = useToast();
  const all = products.flatMap((p) => p.reviews.map((r) => ({ ...r, productId: p.id, productName: p.name })));
  const [results, setResults] = useState<Record<string, { verdict: string; reasons: string[]; spamScore: number }>>({});

  const scanAll = async () => {
    onBusy(true);
    for (const r of all) {
      const res = await runAi("Review scan", `Scan: ${r.body}`, () => scanReview(r.body, all.filter((x) => x.id !== r.id).map((x) => x.body)));
      setResults((prev) => ({ ...prev, [r.id]: res.value }));
    }
    onDone(); onBusy(false);
    toast.success("Reviews scanned", `${all.length} reviews analyzed.`);
  };

  const removeReview = (productId: string, reviewId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateProduct(productId, { reviews: p.reviews.filter((r) => r.id !== reviewId) });
    toast.success("Review removed");
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{all.length} reviews to scan</p>
        <button onClick={scanAll} className="btn-primary btn-sm"><ShieldAlert className="h-4 w-4" /> Scan all reviews</button>
      </div>
      <div className="mt-4 space-y-3">
        {all.slice(0, 12).map((r) => {
          const res = results[r.id];
          return (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{r.body}</p>
                  <p className="mt-1 text-xs text-muted">{r.author} · {r.productName}</p>
                </div>
                {res && (
                  <span className={cn("badge capitalize shrink-0", res.verdict === "approve" ? "bg-success/15 text-success" : res.verdict === "review" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
                    {res.verdict} ({res.spamScore})
                  </span>
                )}
              </div>
              {res && res.reasons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {res.reasons.map((reason, i) => <span key={i} className="badge bg-surface2 text-[0.6rem] text-muted">{reason}</span>)}
                </div>
              )}
              {res?.verdict === "reject" && (
                <button onClick={() => removeReview(r.productId, r.id)} className="btn btn-sm mt-2 border border-danger/40 text-danger hover:bg-danger/10">Remove review</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

