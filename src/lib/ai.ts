/**
 * ALAYA INSIDER — AI Engine (on-device, deterministic, no external API)
 * --------------------------------------------------------------------
 * Provides real, functional AI-assisted generation across the platform.
 * Uses heuristic + template generation against the live catalogue so output
 * is contextual, consistent, and reviewable — never auto-published.
 *
 * Architecture is provider-ready: swap `generate()` to call OpenAI/Anthropic/
 * Gemini by delegating to the configured provider (see aiProviders).
 */

/* --------------------------- Provider config ---------------------------- */

export interface AiProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKeyConfigured: boolean;
  monthlyBudget: number;
  rateLimitPerMin: number;
}

export const aiProviders: AiProvider[] = [
  { id: "openai", name: "OpenAI", enabled: true, apiKeyConfigured: false, monthlyBudget: 50, rateLimitPerMin: 60 },
  { id: "anthropic", name: "Anthropic", enabled: true, apiKeyConfigured: false, monthlyBudget: 40, rateLimitPerMin: 50 },
  { id: "gemini", name: "Google Gemini", enabled: true, apiKeyConfigured: false, monthlyBudget: 30, rateLimitPerMin: 60 },
  { id: "glm", name: "GLM", enabled: false, apiKeyConfigured: false, monthlyBudget: 20, rateLimitPerMin: 40 },
  { id: "deepseek", name: "DeepSeek", enabled: false, apiKeyConfigured: false, monthlyBudget: 20, rateLimitPerMin: 40 },
  { id: "local", name: "Local LLM", enabled: true, apiKeyConfigured: true, monthlyBudget: 0, rateLimitPerMin: 999 },
];

/* ------------------------------ Tokens --------------------------------- */

/** A recorded AI invocation (for logs + analytics). */
export interface AiLog {
  id: string;
  ts: number;
  task: string;
  provider: string;
  model: string;
  prompt: string;
  responseMs: number;
  tokens: number;
  cost: number;
  success: boolean;
  actor: string;
}

/* --------------------------- Prompt library ---------------------------- */

export interface PromptTemplate {
  id: string;
  category: string;
  name: string;
  template: string; // contains {variables}
  variables: string[];
}

export const promptLibrary: PromptTemplate[] = [
  {
    id: "p_seo_title", category: "SEO", name: "SEO Meta Title",
    template: "Write a 50-60 character SEO title for {product_name} in the {category} category, emphasising luxury and {brand}.",
    variables: ["product_name", "category", "brand"],
  },
  {
    id: "p_seo_desc", category: "SEO", name: "Meta Description",
    template: "Write a 150-160 character meta description for {product_name} by {brand}, highlighting {feature}.",
    variables: ["product_name", "brand", "feature"],
  },
  {
    id: "p_desc", category: "Product", name: "Product Description",
    template: "Write a premium product description for {product_name} ({brand}). Focus on craftsmanship, materials and lifestyle.",
    variables: ["product_name", "brand"],
  },
  {
    id: "p_features", category: "Product", name: "Feature Bullets",
    template: "Generate 5 benefit-driven bullet points for {product_name}.",
    variables: ["product_name"],
  },
  {
    id: "p_alt", category: "Image", name: "Image Alt Text",
    template: "Write descriptive, keyword-rich alt text for an image of {product_name} by {brand}.",
    variables: ["product_name", "brand"],
  },
  {
    id: "p_blog", category: "Blog", name: "Article Outline",
    template: "Create a buying-guide outline for {topic}, targeting luxury shoppers.",
    variables: ["topic"],
  },
  {
    id: "p_email", category: "Marketing", name: "Email Campaign",
    template: "Write a luxury email campaign for {campaign}, driving traffic to {link}.",
    variables: ["campaign", "link"],
  },
  {
    id: "p_faq", category: "SEO", name: "FAQ",
    template: "Generate 4 FAQs for {product_name} covering usage, care, sizing and shipping.",
    variables: ["product_name"],
  },
];

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`);
}

/* ------------------------- Generation helpers -------------------------- */

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

const LUXURY = ["considered", "timeless", "refined", "quietly luxurious", "elevated", "crafted", "iconic", "investment-worthy"];
const MATERIALS = ["full-grain leather", "recycled gold", "solid brass", "fine silk", "cashmere", "sustainable cotton", "hand-blown glass"];
const BENEFITS = ["designed to last a lifetime", "develops a rich patina", "fits seamlessly into your routine", "makes an effortless gift", "elevates the everyday"];

export interface ProductLike {
  name: string;
  brand?: string;
  category?: string;
  shortDescription?: string;
  features?: string[];
  tags?: string[];
}

/* --------------------------- Generators -------------------------------- */

export function genMetaTitle(p: ProductLike): string {
  const brand = p.brand || "ALAYA";
  const base = `${p.name} by ${brand}`;
  if (base.length <= 58) return `${base} — ALAYA INSIDER`.slice(0, 60);
  return `${p.name} | ALAYA INSIDER`.slice(0, 60);
}

export function genMetaDescription(p: ProductLike): string {
  const brand = p.brand ? ` by ${p.brand}` : "";
  const feat = p.features?.[0] || p.shortDescription || "premium quality";
  const d = `Discover ${p.name}${brand} — ${feat}. Shop the ${pick(LUXURY, hashStr(p.name))} edit at ALAYA INSIDER with worldwide shipping.`;
  return d.slice(0, 158);
}

export function genDescription(p: ProductLike): string {
  const adj = pick(LUXURY, hashStr(p.name));
  const mat = pick(MATERIALS, hashStr(p.name + "m"));
  const benefit = pick(BENEFITS, hashStr(p.name + "b"));
  return `A ${adj} piece from ${p.brand || "our edit"}, the ${p.name} is crafted with ${mat} and ${benefit}. ${p.shortDescription ? p.shortDescription + " " : ""}Each detail is considered — from the finish to the feel — ensuring it earns a lasting place in your collection.`;
}

export function genFeatures(p: ProductLike, count = 5): string[] {
  const base = p.features && p.features.length >= 3 ? p.features : [];
  const h = hashStr(p.name);
  const generated = [
    `${pick(["Handcrafted", "Considered", "Premium", "Sustainable", "Editor-curated"], h)} ${pick(MATERIALS, h + 1).split(" ").pop()} construction`,
    `${pick(BENEFITS, h + 2)}`,
    `${p.brand || "House"} quality & finish`,
    `Ethically sourced materials`,
    `Designed to ${pick(["age beautifully", "be worn daily", "layer effortlessly", "travel with you"], h + 3)}`,
  ];
  return Array.from(new Set([...base, ...generated])).slice(0, count);
}

export function genAltText(p: ProductLike): string {
  return `${p.name}${p.brand ? ` by ${p.brand}` : ""} — ${pick(["product photography", "studio shot", "editorial image", "lifestyle shot"], hashStr(p.name))}`;
}

export function genTags(p: ProductLike, all: string[] = []): string[] {
  const own = new Set([
    ...(p.tags || []),
    ...(p.features || []).map((f) => f.split(" ")[0].toLowerCase()),
    pick(LUXURY, hashStr(p.name)),
  ]);
  // fill from catalogue tags if too few
  if (own.size < 4 && all.length) all.forEach((t) => own.add(t));
  return Array.from(own).filter(Boolean).slice(0, 8);
}

export function genFaqs(p: ProductLike): { q: string; a: string }[] {
  return [
    { q: `Is the ${p.name} suitable for everyday use?`, a: `Yes — it's designed and tested for daily wear, balancing durability with ${pick(LUXURY, hashStr(p.name))} aesthetics.` },
    { q: `How should I care for ${p.brand || "this"} products?`, a: `Store away from direct sunlight and moisture. Use a soft cloth. Full care instructions are included with every order.` },
    { q: `Is this eligible for returns?`, a: `Absolutely. Physical items can be returned within 30 days for a full refund, provided they're unused.` },
    { q: `Do you ship internationally?`, a: `Yes — we ship worldwide with complimentary shipping over $150. Delivery typically takes 3–6 business days.` },
  ];
}

export function genBuyingGuide(topic: string): { title: string; outline: string[] } {
  return {
    title: `The ${topic} Buying Guide: What Really Matters`,
    outline: [
      `Why ${topic} deserves consideration`,
      `The key materials and what they mean for longevity`,
      `How to choose the right ${topic} for your lifestyle`,
      `Our editor's top picks across price points`,
      `Care, storage and making it last`,
      `Frequently asked questions`,
    ],
  };
}

export function genEmailCampaign(campaign: string, link = "/shop"): { subject: string; preview: string; body: string } {
  return {
    subject: `${campaign} — first look from ALAYA INSIDER`,
    preview: `A considered edit you'll love, hand-picked by our editors.`,
    body: `Hi there,\n\nWe've just unveiled ${campaign}. Our editors have curated the pieces worth your attention — each chosen for craft, quality and enduring style.\n\nExplore the edit: ${link}\n\nWith care,\nThe ALAYA INSIDER team`,
  };
}

export function genInsights(metrics: { revenue: number; orders: number; aov: number; topCat: string }): string[] {
  const out: string[] = [];
  out.push(`Revenue is tracking at $${metrics.revenue.toLocaleString()} across ${metrics.orders} orders, with a healthy AOV of $${metrics.aov}.`);
  if (metrics.topCat) out.push(`"${metrics.topCat}" is your leading category — consider expanding inventory and cross-selling complementary products.`);
  out.push(`Repeat-purchase rate is a growth lever: launch a loyalty nudge or post-purchase email to lift retention.`);
  out.push(`Add 1–2 buying-guide articles per month targeting your top categories to grow organic traffic.`);
  return out;
}

export function genSocialCaption(campaign: string): string {
  return `${campaign} ✨ Considered pieces, curated by editors. Tap to shop the edit at ALAYA INSIDER. #alayainsider #luxuryedit #${campaign.toLowerCase().replace(/\s+/g, "")}`;
}

/* ------------------------- Review moderation --------------------------- */

export interface ReviewScan {
  verdict: "approve" | "reject" | "review";
  reasons: string[];
  spamScore: number; // 0-100
}

const SPAM_WORDS = ["buy now", "click here", "free", "www.", "http", "$$$", "discount code", "casino", "viagra", "loan"];
const ABUSE_WORDS = ["hate", "stupid", "idiot", "rubbish", "scam"];

export function scanReview(text: string, existing: string[]): ReviewScan {
  const lower = (text || "").toLowerCase();
  const reasons: string[] = [];
  let spamScore = 0;

  SPAM_WORDS.forEach((w) => { if (lower.includes(w)) { reasons.push(`Spam keyword: "${w}"`); spamScore += 30; } });
  ABUSE_WORDS.forEach((w) => { if (lower.includes(w)) { reasons.push(`Abusive language: "${w}"`); spamScore += 25; } });
  if (text.length < 8) { reasons.push("Too short to be meaningful"); spamScore += 20; }
  if (/(.)\1{4,}/.test(text)) { reasons.push("Repetitive characters detected"); spamScore += 15; }
  const dup = existing.find((e) => e.toLowerCase() === lower);
  if (dup) { reasons.push("Duplicate of an existing review"); spamScore += 40; }

  spamScore = Math.min(100, spamScore);
  const verdict: ReviewScan["verdict"] = spamScore >= 50 ? "reject" : spamScore >= 25 ? "review" : "approve";
  return { verdict, reasons: reasons.length ? reasons : ["Clean — no issues detected"], spamScore };
}

/* ---------------------------- Execution -------------------------------- */

const LOG_KEY = "alaya_ai_logs";
const CREDIT_KEY = "alaya_ai_credits";

export function readLogs(): AiLog[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}
export function logAi(entry: Omit<AiLog, "id" | "ts">): AiLog {
  const log: AiLog = { ...entry, id: `ailog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ts: Date.now() };
  const trimmed = [log, ...readLogs()].slice(0, 500);
  try { localStorage.setItem(LOG_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  const credits = readCredits() - log.cost;
  try { localStorage.setItem(CREDIT_KEY, String(Math.max(0, credits))); } catch { /* ignore */ }
  return log;
}

export function readCredits(): number {
  try { return Number(localStorage.getItem(CREDIT_KEY)) || 0; } catch { return 0; }
}
export function setCredits(n: number) {
  try { localStorage.setItem(CREDIT_KEY, String(n)); } catch { /* ignore */ }
}

/**
 * Simulates a provider call with realistic latency, token + cost accounting,
 * and full logging. Returns the generated value. In production this delegates
 * to the configured provider's API.
 */
export async function runAi<T>(task: string, prompt: string, fn: () => T, actor = "admin"): Promise<{ value: T; log: AiLog }> {
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
  const value = fn();
  const responseMs = Math.round(performance.now() - t0);
  const tokens = Math.ceil(prompt.length / 4) + 40;
  const cost = +(tokens * 0.00002).toFixed(4);
  const log = logAi({
    task,
    provider: "local",
    model: "alaya-on-device",
    prompt,
    responseMs,
    tokens,
    cost,
    success: true,
    actor,
  });
  return { value, log };
}
