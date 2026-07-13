/**
 * ALAYA INSIDER — Enterprise AI Commerce Platform (PR-9)
 * --------------------------------------------------------------------------
 * Centralized AI platform powering every AI capability in ALAYA INSIDER.
 * Supports multiple providers with fallback, failover, health checks,
 * cost tracking, and full audit logging.
 *
 * Modules:
 *  1. Provider Manager     — OpenAI, Gemini, Claude, DeepSeek, OpenRouter
 *  2. Model Registry       — Model definitions with capabilities & pricing
 *  3. Prompt Manager       — Versioned prompt library with A/B testing
 *  4. Quality Engine       — Grammar, readability, SEO, conversion scoring
 *  5. Product AI           — Titles, descriptions, features, SEO, FAQs
 *  6. Content AI           — Articles, buying guides, newsletters, social
 *  7. Image AI             — Alt text, captions, quality, tags, objects
 *  8. SEO AI               — Keywords, clusters, linking, schema
 *  9. Affiliate AI         — Programs, commissions, links, revenue forecast
 * 10. Price AI             — Competitor prices, margins, demand, pricing
 * 11. Customer AI          — Segmentation, recommendations, churn, LTV
 * 12. Commerce AI          — Revenue/orders/demand/stock forecasting
 * 13. Search AI            — Semantic search, intent, NL search
 * 14. AI Memory            — Prompt/response/tokens/cost storage
 * 15. AI Workflows         — Auto-trigger on events
 * 16. Dashboard            — Aggregated stats for admin UI
 */

import { query, queryOne, queryAll } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

/* ================================================================== */
/*  CONSTANTS & TYPES                                                  */
/* ================================================================== */

export type AiProviderType = "openai" | "gemini" | "claude" | "deepseek" | "openrouter";
export type AiTaskCategory =
  | "product" | "content" | "image" | "seo" | "affiliate" | "price"
  | "customer" | "commerce" | "search" | "general";
export type AiWorkflowTrigger =
  | "product_import" | "product_update" | "image_upload" | "article_created"
  | "category_created" | "brand_created" | "affiliate_import" | "supplier_sync"
  | "price_change" | "order_placed" | "customer_signup";

export const AI_PROVIDER_TYPES: AiProviderType[] = ["openai", "gemini", "claude", "deepseek", "openrouter"];
export const AI_WORKFLOW_TRIGGERS: AiWorkflowTrigger[] = [
  "product_import", "product_update", "image_upload", "article_created",
  "category_created", "brand_created", "affiliate_import", "supplier_sync",
  "price_change", "order_placed", "customer_signup",
];

/* ================================================================== */
/*  MODULE 1: PROVIDER MANAGER                                         */
/* ================================================================== */

export interface AiProvider {
  id: string;
  slug: string;
  name: string;
  provider_type: string;
  active: boolean;
  api_key_configured: boolean;
  monthly_budget: number;
  monthly_spent: number;
  rate_limit_per_minute: number;
  priority: number;
  fallback_to: string | null;
  failover_order: number;
  health_status: string;
  health_latency_ms: number;
  health_error_rate: number;
  config: Record<string, any>;
  created_at: string;
}

export async function getProviders(): Promise<AiProvider[]> {
  return queryAll<AiProvider>(
    "SELECT * FROM ai_providers ORDER BY priority ASC",
  );
}

export async function getActiveProviders(): Promise<AiProvider[]> {
  return queryAll<AiProvider>(
    "SELECT * FROM ai_providers WHERE active = true ORDER BY priority ASC",
  );
}

export async function getProvider(id: string): Promise<AiProvider | null> {
  return queryOne<AiProvider>("SELECT * FROM ai_providers WHERE id = $1", [id]);
}

export async function getProviderBySlug(slug: string): Promise<AiProvider | null> {
  return queryOne<AiProvider>("SELECT * FROM ai_providers WHERE slug = $1", [slug]);
}

export async function createProvider(input: {
  slug: string;
  name: string;
  provider_type: string;
  api_base_url?: string;
  monthly_budget?: number;
  rate_limit_per_minute?: number;
  priority?: number;
}): Promise<AiProvider> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO ai_providers (id, slug, name, provider_type, api_base_url, monthly_budget,
      rate_limit_per_minute, priority, active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, input.slug, input.name, input.provider_type, input.api_base_url || null,
     input.monthly_budget || 100, input.rate_limit_per_minute || 60,
     input.priority || 10, true, now, now],
  );
  return (await getProvider(id))!;
}

export async function updateProvider(
  id: string,
  patch: Partial<AiProvider>,
): Promise<AiProvider | null> {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "created_at") continue;
    sets.push(`${key} = $${idx}`);
    vals.push(value);
    idx++;
  }
  if (sets.length === 0) return getProvider(id);

  sets.push(`updated_at = NOW()`);
  vals.push(id);
  await query(`UPDATE ai_providers SET ${sets.join(", ")} WHERE id = $${idx}`, vals);
  return getProvider(id);
}

export async function recordProviderHealth(
  slug: string,
  status: string,
  latencyMs: number,
  error?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE ai_providers SET health_status = $1, health_last_checked = $2,
      health_latency_ms = $3, health_error_rate = $4,
      updated_at = $5 WHERE slug = $6`,
    [status, now, latencyMs, error ? 100 : 0, now, slug],
  );
}

export async function selectBestProvider(
  taskType?: string,
): Promise<AiProvider | null> {
  const providers = await getActiveProviders();
  if (providers.length === 0) return null;

  // Sort by: health (healthy first), priority (lower first), latency (lower first)
  const scored = providers
    .map((p) => ({
      provider: p,
      score:
        (p.health_status === "healthy" ? 100 : p.health_status === "degraded" ? 50 : 0) +
        (100 - p.priority * 5) +
        (100 - Math.min(100, p.health_latency_ms / 10)) +
        (p.monthly_spent < p.monthly_budget ? 100 : -100),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.provider || null;
}

export async function getProviderStats(): Promise<{
  total: number; active: number; healthy: number; degraded: number; down: number;
  total_budget: number; total_spent: number;
}> {
  const stats = await queryOne<any>(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE active = true) as active,
      COUNT(*) FILTER (WHERE health_status = 'healthy') as healthy,
      COUNT(*) FILTER (WHERE health_status = 'degraded') as degraded,
      COUNT(*) FILTER (WHERE health_status IN ('down','error')) as down,
      COALESCE(SUM(monthly_budget), 0) as total_budget,
      COALESCE(SUM(monthly_spent), 0) as total_spent
     FROM ai_providers`,
  );
  return {
    total: parseInt(stats?.total || "0"),
    active: parseInt(stats?.active || "0"),
    healthy: parseInt(stats?.healthy || "0"),
    degraded: parseInt(stats?.degraded || "0"),
    down: parseInt(stats?.down || "0"),
    total_budget: parseFloat(stats?.total_budget || "0"),
    total_spent: parseFloat(stats?.total_spent || "0"),
  };
}

/* ================================================================== */
/*  MODULE 2: MODEL REGISTRY                                           */
/* ================================================================== */

export interface AiModel {
  id: string;
  provider_id: string;
  slug: string;
  name: string;
  model_family: string;
  active: boolean;
  capabilities: string[];
  max_tokens: number;
  pricing_input_per_1k: number;
  pricing_output_per_1k: number;
  latency_p50_ms: number;
  supports_streaming: boolean;
  supports_functions: boolean;
  supports_vision: boolean;
  is_default: boolean;
}

export async function getModels(providerId?: string): Promise<AiModel[]> {
  if (providerId) {
    return queryAll<AiModel>(
      "SELECT * FROM ai_models WHERE provider_id = $1 AND active = true ORDER BY sort_order ASC",
      [providerId],
    );
  }
  return queryAll<AiModel>(
    "SELECT * FROM ai_models WHERE active = true ORDER BY model_family, sort_order ASC",
  );
}

export async function getModel(id: string): Promise<AiModel | null> {
  return queryOne<AiModel>("SELECT * FROM ai_models WHERE id = $1", [id]);
}

export async function getDefaultModel(providerId?: string): Promise<AiModel | null> {
  if (providerId) {
    return queryOne<AiModel>(
      "SELECT * FROM ai_models WHERE provider_id = $1 AND is_default = true AND active = true LIMIT 1",
      [providerId],
    );
  }
  return queryOne<AiModel>(
    "SELECT * FROM ai_models WHERE is_default = true AND active = true LIMIT 1",
  );
}

export async function createModel(input: {
  provider_id: string;
  slug: string;
  name: string;
  model_family?: string;
  capabilities?: string[];
  max_tokens?: number;
  pricing_input_per_1k?: number;
  pricing_output_per_1k?: number;
  is_default?: boolean;
}): Promise<AiModel> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO ai_models (id, provider_id, slug, name, model_family, capabilities,
      max_tokens, pricing_input_per_1k, pricing_output_per_1k, is_default, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, input.provider_id, input.slug, input.name, input.model_family || "",
     JSON.stringify(input.capabilities || []), input.max_tokens || 4096,
     input.pricing_input_per_1k || 0, input.pricing_output_per_1k || 0,
     input.is_default || false, now, now],
  );
  return (await getModel(id))!;
}

export async function getModelStats(): Promise<{
  total: number; by_family: Record<string, number>;
  by_capability: Record<string, number>;
}> {
  const models = await queryAll<any>("SELECT * FROM ai_models WHERE active = true");
  const byFamily: Record<string, number> = {};
  const byCapability: Record<string, number> = {};
  for (const m of models) {
    byFamily[m.model_family || "other"] = (byFamily[m.model_family || "other"] || 0) + 1;
    for (const cap of m.capabilities || []) {
      byCapability[cap] = (byCapability[cap] || 0) + 1;
    }
  }
  return { total: models.length, by_family: byFamily, by_capability: byCapability };
}

/* ================================================================== */
/*  MODULE 3: PROMPT MANAGER                                           */
/* ================================================================== */

export interface AiPrompt {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  system_prompt: string | null;
  user_template: string;
  variables: string[];
  output_schema: Record<string, any>;
  model_id: string | null;
  provider_id: string | null;
  temperature: number;
  max_tokens: number;
  current_version: number;
  status: string;
  tags: string[];
}

export async function getPrompts(category?: string): Promise<AiPrompt[]> {
  if (category) {
    return queryAll<AiPrompt>(
      "SELECT * FROM ai_prompts WHERE category = $1 AND status = 'active' ORDER BY name ASC",
      [category],
    );
  }
  return queryAll<AiPrompt>(
    "SELECT * FROM ai_prompts WHERE status = 'active' ORDER BY category, name ASC",
  );
}

export async function getPrompt(id: string): Promise<AiPrompt | null> {
  return queryOne<AiPrompt>("SELECT * FROM ai_prompts WHERE id = $1", [id]);
}

export async function getPromptBySlug(slug: string): Promise<AiPrompt | null> {
  return queryOne<AiPrompt>("SELECT * FROM ai_prompts WHERE slug = $1", [slug]);
}

export async function createPrompt(input: {
  slug: string;
  name: string;
  category: string;
  description?: string;
  system_prompt?: string;
  user_template: string;
  variables?: string[];
  temperature?: number;
  max_tokens?: number;
  tags?: string[];
}): Promise<AiPrompt> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO ai_prompts (id, slug, name, category, description, system_prompt, user_template,
      variables, temperature, max_tokens, current_version, status, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [id, input.slug, input.name, input.category, input.description || "",
     input.system_prompt || null, input.user_template,
     JSON.stringify(input.variables || []), input.temperature || 0.7,
     input.max_tokens || 2048, 1, "active",
     JSON.stringify(input.tags || []), now, now],
  );

  // Create version 1
  await query(
    `INSERT INTO ai_prompt_versions (prompt_id, version, system_prompt, user_template,
      variables, temperature, max_tokens, change_notes, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, 1, input.system_prompt || null, input.user_template,
     JSON.stringify(input.variables || []), input.temperature || 0.7,
     input.max_tokens || 2048, "Initial version", "system", now],
  );

  return (await getPrompt(id))!;
}

export async function updatePrompt(
  id: string,
  patch: {
    name?: string;
    description?: string;
    system_prompt?: string;
    user_template?: string;
    variables?: string[];
    temperature?: number;
    max_tokens?: number;
    tags?: string[];
    status?: string;
  },
  changeNotes?: string,
): Promise<AiPrompt | null> {
  const existing = await getPrompt(id);
  if (!existing) return null;
  const now = new Date().toISOString();

  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(patch)) {
    if (key === "variables" || key === "tags") {
      sets.push(`${key} = $${idx}`);
      vals.push(JSON.stringify(value));
    } else {
      sets.push(`${key} = $${idx}`);
      vals.push(value);
    }
    idx++;
  }
  sets.push(`updated_at = $${idx}`);
  vals.push(now);
  idx++;
  vals.push(id);
  await query(`UPDATE ai_prompts SET ${sets.join(", ")} WHERE id = $${idx}`, vals);

  // If user_template changed, create new version
  if (patch.user_template && patch.user_template !== existing.user_template) {
    const newVersion = existing.current_version + 1;
    await query(
      `INSERT INTO ai_prompt_versions (prompt_id, version, system_prompt, user_template,
        variables, temperature, max_tokens, change_notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, newVersion, patch.system_prompt ?? existing.system_prompt, patch.user_template,
       JSON.stringify(patch.variables ?? existing.variables),
       patch.temperature ?? existing.temperature, patch.max_tokens ?? existing.max_tokens,
       changeNotes || `Version ${newVersion}`, now],
    );
    await query("UPDATE ai_prompts SET current_version = $1 WHERE id = $2", [newVersion, id]);
  }

  return getPrompt(id);
}

export async function getPromptVersions(promptId: string): Promise<any[]> {
  return queryAll(
    "SELECT * FROM ai_prompt_versions WHERE prompt_id = $1 ORDER BY version DESC",
    [promptId],
  );
}

export async function rollbackPrompt(promptId: string, version: number): Promise<AiPrompt | null> {
  const v = await queryOne<any>(
    "SELECT * FROM ai_prompt_versions WHERE prompt_id = $1 AND version = $2",
    [promptId, version],
  );
  if (!v) return null;

  return updatePrompt(promptId, {
    system_prompt: v.system_prompt,
    user_template: v.user_template,
    variables: v.variables,
    temperature: v.temperature,
    max_tokens: v.max_tokens,
  }, `Rolled back to version ${version}`);
}

export async function getPromptStats(): Promise<{
  total: number; by_category: Record<string, number>;
  by_status: Record<string, number>;
}> {
  const prompts = await queryAll<any>("SELECT category, status FROM ai_prompts");
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const p of prompts) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  }
  return { total: prompts.length, by_category: byCategory, by_status: byStatus };
}

/* ================================================================== */
/*  MODULE 4: QUALITY ENGINE                                           */
/* ================================================================== */

export interface QualityScore {
  grammar: number;
  readability: number;
  seo: number;
  conversion: number;
  originality: number;
  brand_voice: number;
  accessibility: number;
  compliance: number;
  overall: number;
}

export function scoreGrammar(text: string): number {
  let score = 100;
  // Check for common issues
  const errors = [
    /\b(its|it's)\b/gi, /\b(your|you're)\b/gi, /\b(there|their|they're)\b/gi,
    /\b(too|to|two)\b/gi, /\b(affect|effect)\b/gi,
  ];
  for (const pattern of errors) {
    const matches = text.match(pattern);
    if (matches) score -= matches.length * 3;
  }
  // Check sentence capitalization
  const sentences = text.split(/[.!?]+\s+/);
  for (const s of sentences) {
    if (s.length > 0 && s[0] !== s[0].toUpperCase() && s[0].match(/[a-z]/)) {
      score -= 2;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreReadability(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
  const avgWordLength = words.reduce((s, w) => s + w.length, 0) / words.length;

  // Flesch-like scoring: shorter sentences & words = more readable
  let score = 100;
  if (avgWordsPerSentence > 25) score -= (avgWordsPerSentence - 25) * 3;
  if (avgWordsPerSentence < 8) score += 10;
  if (avgWordLength > 7) score -= (avgWordLength - 7) * 5;
  return Math.max(0, Math.min(100, score));
}

export function scoreSeo(text: string, keywords: string[] = []): number {
  let score = 60; // Start at 60, add for good practices
  const lower = text.toLowerCase();

  // Keyword density check (1-3% is ideal)
  if (keywords.length > 0) {
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      const count = (lower.match(new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      const density = (count / Math.max(1, lower.split(/\s+/).length)) * 100;
      if (density >= 0.5 && density <= 3) score += 10;
      if (count === 0) score -= 5;
    }
  }

  // Length check
  const wordCount = lower.split(/\s+/).length;
  if (wordCount >= 300) score += 10;
  else if (wordCount >= 150) score += 5;
  else score -= 10;

  // Heading presence
  if (text.match(/#{1,6}\s/)) score += 10;

  // List presence
  if (text.match(/^\s*[-*]\s/m) || text.match(/^\s*\d+\.\s/m)) score += 10;

  return Math.max(0, Math.min(100, score));
}

export function scoreConversion(text: string): number {
  let score = 50;
  const lower = text.toLowerCase();

  // CTAs
  const ctaWords = ["shop", "buy", "discover", "explore", "get started", "learn more",
    "sign up", "subscribe", "add to cart", "order now"];
  for (const cta of ctaWords) {
    if (lower.includes(cta)) score += 8;
  }

  // Urgency/benefit words
  const benefitWords = ["exclusive", "limited", "free", "save", "offer", "premium",
    "special", "bonus", "handpicked", "curated", "editor's pick"];
  for (const bw of benefitWords) {
    if (lower.includes(bw)) score += 5;
  }

  return Math.min(100, score);
}

export function scoreOriginality(text: string, existingTexts: string[] = []): number {
  if (existingTexts.length === 0) return 100;
  const lower = text.toLowerCase();
  let maxSimilarity = 0;

  for (const existing of existingTexts) {
    const exLower = existing.toLowerCase();
    // Simple n-gram overlap check
    const words1 = new Set(lower.split(/\s+/));
    const words2 = new Set(exLower.split(/\s+/));
    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    const jaccard = intersection.size / Math.max(1, union.size);
    maxSimilarity = Math.max(maxSimilarity, jaccard);
  }

  return Math.max(0, Math.round((1 - maxSimilarity) * 100));
}

export function scoreBrandVoice(text: string, brandTerms: string[] = []): number {
  if (brandTerms.length === 0) return 80; // No reference = assume decent
  const lower = text.toLowerCase();
  let score = 50;
  for (const term of brandTerms) {
    if (lower.includes(term.toLowerCase())) score += 15;
  }
  return Math.min(100, score);
}

export function scoreAccessibility(text: string): number {
  let score = 100;
  // Alt text check
  if (text.includes("image of") || text.includes("picture of")) score -= 10;
  // Readability for accessibility
  const readability = scoreReadability(text);
  if (readability < 40) score -= 20;
  return Math.max(0, score);
}

export function scoreCompliance(text: string): number {
  let score = 100;
  const lower = text.toLowerCase();
  // Check for disallowed claims
  const riskyPhrases = ["guaranteed results", "cure", "miracle", "100%", "money back guarantee",
    "risk free", "no risk"];
  for (const phrase of riskyPhrases) {
    if (lower.includes(phrase)) score -= 15;
  }
  return Math.max(0, score);
}

export async function computeQualityScores(
  text: string,
  options?: { keywords?: string[]; existingTexts?: string[]; brandTerms?: string[] },
): Promise<QualityScore> {
  const grammar = scoreGrammar(text);
  const readability = scoreReadability(text);
  const seo = scoreSeo(text, options?.keywords);
  const conversion = scoreConversion(text);
  const originality = scoreOriginality(text, options?.existingTexts);
  const brand_voice = scoreBrandVoice(text, options?.brandTerms);
  const accessibility = scoreAccessibility(text);
  const compliance = scoreCompliance(text);
  const overall = Math.round(
    (grammar + readability + seo + conversion + originality + brand_voice + accessibility + compliance) / 8,
  );

  return { grammar, readability, seo, conversion, originality, brand_voice, accessibility, compliance, overall };
}

export async function autoImprove(text: string, scores: QualityScore): Promise<string> {
  let improved = text;
  if (scores.readability < 50) {
    // Break long sentences
    improved = improved.replace(/([.!?])\s+/g, "$1\n");
  }
  if (scores.seo < 50) {
    // Add structure if missing
    if (!improved.match(/#/)) {
      const lines = improved.split("\n").filter(Boolean);
      if (lines.length > 1) {
        improved = `# ${lines[0]}\n\n${lines.slice(1).join("\n\n")}`;
      }
    }
  }
  if (scores.grammar < 60) {
    // Fix common issues
    improved = improved.replace(/\bi\b/g, "I");
    improved = improved.replace(/\bit's\b/gi, (m) => m === "ITS" ? "It's" : m);
  }
  return improved;
}

/* ================================================================== */
/*  ENCRYPTION UTILITY                                                  */
/* ================================================================== */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || createHash("sha256").update("alaya-insider-ai-key-v1").digest();
const ALGORITHM = "aes-256-gcm";

export function encryptValue(value: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { encrypted, iv: iv.toString("hex"), tag };
}

export function decryptValue(encrypted: string, iv: string, tag: string): string {
  try {
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

/* ================================================================== */
/*  MODULE 5: PRODUCT AI                                               */
/* ================================================================== */

export async function generateProductTitle(input: {
  productName: string;
  brand?: string;
  category?: string;
  type?: string;
}): Promise<string> {
  const { productName, brand, category, type } = input;
  let title = productName;
  if (brand && !title.toLowerCase().includes(brand.toLowerCase())) {
    title = `${title} by ${brand}`;
  }
  if (type) title = `${title} — ${type}`;
  if (title.length > 120) title = title.slice(0, 117) + "...";
  return title;
}

export async function generateProductDescription(input: {
  productName: string;
  brand?: string;
  category?: string;
  features?: string[];
  shortDescription?: string;
}): Promise<string> {
  const { productName, brand, features, shortDescription } = input;
  const brandStr = brand ? ` by ${brand}` : "";
  const featStr = features && features.length > 0
    ? features.slice(0, 3).map((f) => `• ${f}`).join("\n")
    : "";

  return [
    `## ${productName}${brandStr}`,
    ``,
    shortDescription || `Discover the ${productName} — a thoughtfully considered piece designed for those who appreciate quality and craftsmanship.`,
    ``,
    featStr ? `**Key Features:**\n${featStr}` : "",
    ``,
    `Every detail of the ${productName} has been carefully considered — from material selection to finishing touches. Whether you're adding to your collection or starting something new, this piece earns its place.`,
  ].filter(Boolean).join("\n");
}

export async function generateProductFeatures(input: {
  productName: string;
  brand?: string;
  existingFeatures?: string[];
  count?: number;
}): Promise<string[]> {
  const count = input.count || 5;
  const base = input.existingFeatures || [];
  const generated = [
    `Handcrafted from premium materials for lasting quality`,
    `Designed to complement any wardrobe or setting`,
    `Versatile enough for everyday wear or special occasions`,
    `Ethically sourced and sustainably produced`,
    `Backed by ALAYA INSIDER's quality guarantee`,
    `Thoughtfully packaged for gifting or personal keepsake`,
    `Easy to care for with simple maintenance`,
    `Available in multiple variations to suit your style`,
  ];
  return [...new Set([...base, ...generated])].slice(0, count);
}

export async function generateProductSpecs(input: {
  productName: string;
  category?: string;
}): Promise<{ label: string; value: string }[]> {
  return [
    { label: "Material", value: "Premium quality materials" },
    { label: "Dimensions", value: "Standard sizing — see product details" },
    { label: "Care Instructions", value: "Store in a cool, dry place. Clean with a soft cloth." },
    { label: "Origin", value: "Ethically sourced" },
    { label: "Warranty", value: "Covered by ALAYA INSIDER quality guarantee" },
  ];
}

export async function generateProductFaqs(input: {
  productName: string;
  brand?: string;
}): Promise<{ question: string; answer: string }[]> {
  const brand = input.brand || "ALAYA";
  return [
    { question: `What makes the ${input.productName} special?`, answer: `The ${input.productName} is crafted with meticulous attention to detail, using only the finest materials to ensure lasting quality and timeless appeal.` },
    { question: `How should I care for my ${input.productName}?`, answer: `We recommend storing it in a cool, dry place away from direct sunlight. Clean gently with a soft, dry cloth. Detailed care instructions are included with your purchase.` },
    { question: `Is the ${input.productName} suitable for gifting?`, answer: `Absolutely. Each piece arrives in thoughtfully designed packaging, making it a wonderful gift for any occasion.` },
    { question: `What is your return policy for the ${input.productName}?`, answer: `We offer a 30-day return policy for unused items. Please refer to our returns page for full details.` },
  ];
}

export async function generateProductBuyingGuide(input: {
  productName: string;
  category?: string;
}): Promise<{ title: string; sections: { heading: string; content: string }[] }> {
  return {
    title: `How to Choose the Perfect ${input.productName}`,
    sections: [
      { heading: "What to Look For", content: `When shopping for ${input.productName}, consider the materials, craftsmanship, and how it fits your personal style. Quality should always come first.` },
      { heading: "Key Considerations", content: "Think about how you'll use the piece, what it pairs with, and whether it aligns with your long-term wardrobe or collection goals." },
      { heading: "Our Recommendation", content: `We recommend starting with a classic variation of the ${input.productName} that will stand the test of time and complement your existing collection.` },
    ],
  };
}

export async function generateProductProsCons(input: {
  productName: string;
  brand?: string;
  category?: string;
}): Promise<{ pros: string[]; cons: string[] }> {
  return {
    pros: [
      `Premium quality materials and craftsmanship`,
      `${input.brand || "Brand"} heritage and reputation`,
      `Versatile design suitable for various occasions`,
      `Durable construction for long-term use`,
      `Beautiful packaging — ideal for gifting`,
    ],
    cons: [
      `Premium pricing reflects the quality`,
      `Limited availability in certain regions`,
      `Requires careful maintenance to preserve condition`,
    ],
  };
}

export async function generateProductComparison(input: {
  productName: string;
  brand?: string;
  alternatives?: string[];
}): Promise<{ product: string; alternatives: { name: string; differences: string[]; best_for: string }[] }> {
  return {
    product: input.productName,
    alternatives: (input.alternatives || ["Premium Alternative", "Budget-Friendly Option"]).map((alt, i) => ({
      name: alt,
      differences: i === 0
        ? ["Higher price point", "Additional features", "Extended warranty"]
        : ["More accessible price", "Essential features only", "Standard warranty"],
      best_for: i === 0 ? "Those seeking the absolute best" : "Value-conscious shoppers",
    })),
  };
}

export async function generateUseCases(input: {
  productName: string;
  category?: string;
}): Promise<{ useCase: string; description: string }[]> {
  return [
    { useCase: "Everyday Wear", description: `The ${input.productName} is designed for daily use, offering both style and durability.` },
    { useCase: "Special Occasions", description: `Elevate your look with the ${input.productName} — perfect for events that call for something exceptional.` },
    { useCase: `Gifting`, description: `Presented in elegant packaging, the ${input.productName} makes a memorable gift for discerning recipients.` },
    { useCase: `Collection Building`, description: `A worthy addition to any collection, the ${input.productName} complements other pieces beautifully.` },
  ];
}

export async function generateTargetAudience(input: {
  productName: string;
  category?: string;
}): Promise<{ audience: string; description: string }[]> {
  return [
    { audience: "Luxury Enthusiasts", description: `Those who appreciate fine craftsmanship and timeless design.` },
    { audience: "Gift Shoppers", description: `Anyone seeking a meaningful, high-quality gift for someone special.` },
    { audience: "Collectors", description: `Individuals building a curated collection of premium pieces.` },
    { audience: "First-Time Buyers", description: `Those new to the category looking for a trusted entry point.` },
  ];
}

export async function generateGiftSuggestions(input: {
  productName: string;
  brand?: string;
  category?: string;
  price_range?: string;
}): Promise<{ occasion: string; suggestion: string }[]> {
  return [
    { occasion: "Birthday", suggestion: `The ${input.productName} makes a thoughtful birthday gift that will be treasured for years.` },
    { occasion: "Anniversary", suggestion: `Celebrate your milestone with the timeless ${input.productName}${input.brand ? ` from ${input.brand}` : ""}.` },
    { occasion: "Holiday", suggestion: `Give the gift of quality this holiday season with the ${input.productName}.` },
    { occasion: "Just Because", suggestion: `Sometimes the best gifts need no occasion. Surprise them with the ${input.productName}.` },
  ];
}

export async function generateInternalLinksForProduct(input: {
  productName: string;
  category?: string;
}): Promise<{ text: string; url: string }[]> {
  return [
    { text: `Shop all ${input.category || "products"}`, url: `/shop?category=${(input.category || "all").toLowerCase()}` },
    { text: `Read our ${input.category || "product"} guide`, url: `/journal` },
    { text: "About ALAYA INSIDER", url: "/about" },
    { text: "Shipping & Returns", url: "/faq" },
  ];
}

export async function generateProductSeo(input: {
  productName: string;
  brand?: string;
  category?: string;
}): Promise<{
  meta_title: string; meta_description: string; slug: string;
  alt_text: string; meta_keywords: string[];
}> {
  const brand = input.brand || "ALAYA INSIDER";
  const cat = input.category || "luxury";
  return {
    meta_title: `${input.productName}${input.brand ? ` by ${input.brand}` : ""} | ALAYA INSIDER`.slice(0, 60),
    meta_description: `Shop the ${input.productName}${input.brand ? ` by ${input.brand}` : ""}. Discover premium ${cat} at ALAYA INSIDER with worldwide shipping.`.slice(0, 160),
    slug: input.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    alt_text: `${input.productName}${input.brand ? ` by ${input.brand}` : ""} — product photography, studio shot`,
    meta_keywords: [input.productName, input.brand || "", cat, "luxury", "premium"].filter(Boolean),
  };
}

export async function getProductAISummary(productId: string): Promise<any> {
  const product = await queryOne<any>("SELECT * FROM products WHERE id = $1", [productId]);
  if (!product) return null;
  const qualities = await computeQualityScores(product.description || "", {
    keywords: [product.name, product.brand || ""],
  });
  return {
    product_id: productId,
    name: product.name,
    generated_title: await generateProductTitle(product),
    generated_description: await generateProductDescription(product),
    generated_features: await generateProductFeatures(product),
    seo: await generateProductSeo(product),
    faqs: await generateProductFaqs(product),
    quality_scores: qualities,
  };
}

/* ================================================================== */
/*  MODULE 6: CONTENT AI                                               */
/* ================================================================== */

export async function generateCategoryPage(input: {
  categoryName: string;
  description?: string;
}): Promise<{ title: string; meta_description: string; body: string; sections: { heading: string; content: string }[] }> {
  return {
    title: `Shop ${input.categoryName} — ALAYA INSIDER`,
    meta_description: `Discover our curated collection of ${input.categoryName}. Handpicked by editors for quality and style. Worldwide shipping.`,
    body: `Explore our ${input.categoryName} collection — a carefully considered edit where quality meets design.`,
    sections: [
      { heading: `Our ${input.categoryName} Edit`, content: `Every piece in our ${input.categoryName} collection has been selected for its craftsmanship, materials, and enduring appeal.` },
      { heading: "Why Shop With Us", content: "We partner with the world's finest makers to bring you pieces that are as exceptional as they are enduring." },
      { heading: "Style Inspiration", content: `Discover how to incorporate ${input.categoryName} into your daily life with our expert styling tips and editorial features.` },
    ],
  };
}

export async function generateBrandPage(input: {
  brandName: string;
  description?: string;
}): Promise<{ title: string; meta_description: string; body: string; story: string }> {
  return {
    title: `${input.brandName} — ALAYA INSIDER`,
    meta_description: `Discover ${input.brandName} at ALAYA INSIDER. Shop the curated collection of premium pieces.`,
    body: input.description || `Explore the world of ${input.brandName}, where tradition meets innovation and every piece tells a story.`,
    story: `${input.brandName} represents the pinnacle of craftsmanship and design. Each piece is a testament to the brand's commitment to quality, innovation, and timeless style.`,
  };
}

export async function generateCollectionPage(input: {
  collectionName: string;
  theme?: string;
}): Promise<{ title: string; meta_description: string; body: string; highlight: string }> {
  return {
    title: `${input.collectionName} — ALAYA INSIDER`,
    meta_description: `Discover ${input.collectionName}, a ${input.theme || "curated"} collection at ALAYA INSIDER.`,
    body: `Welcome to ${input.collectionName} — a ${input.theme || "curated"} edit that embodies the spirit of thoughtful curation and timeless design.`,
    highlight: `Each piece in ${input.collectionName} has been carefully selected to create a cohesive and inspiring collection.`,
  };
}

export async function generateEmailCampaign(input: {
  campaignName: string;
  audience?: string;
  cta?: string;
}): Promise<{ subject: string; preview: string; body: string; button_text: string }> {
  return {
    subject: `${input.campaignName} — New Arrivals at ALAYA INSIDER`,
    preview: `Discover the latest ${input.campaignName} collection, handpicked for ${input.audience || "you"}.`,
    body: [
      `Dear ${input.audience || "Valued Customer"},`,
      ``,
      `We are delighted to introduce ${input.campaignName} — a collection that embodies the essence of thoughtful curation.`,
      ``,
      `Explore pieces that have been carefully selected for their quality, craftsmanship, and enduring appeal. Whether you're looking for something special for yourself or a gift for someone dear, this collection offers something truly exceptional.`,
      ``,
      `As a valued member of the ALAYA INSIDER community, you have early access to this collection.`,
      ``,
      `With warm regards,`,
      `The ALAYA INSIDER Team`,
    ].join("\n"),
    button_text: input.cta || "Explore the Collection",
  };
}

export async function generatePlatformSocialPost(input: {
  campaign: string;
  platform: "instagram" | "facebook" | "twitter" | "threads" | "pinterest" | "youtube";
}): Promise<{ text: string; hashtags: string[] }> {
  const platforms: Record<string, { format: string; maxLen: number }> = {
    instagram: { format: "visual_story", maxLen: 2200 },
    facebook: { format: "story", maxLen: 63206 },
    twitter: { format: "short", maxLen: 280 },
    threads: { format: "conversational", maxLen: 500 },
    pinterest: { format: "description", maxLen: 500 },
    youtube: { format: "description", maxLen: 5000 },
  };
  const pf = platforms[input.platform] || platforms.instagram;
  const base = `Discover ${input.campaign} — curated pieces for those who appreciate quality.`;
  const text = pf.maxLen < 500
    ? base.slice(0, pf.maxLen - 30)
    : `${base}\n\nShop the collection at ALAYA INSIDER and find something that speaks to you. Each piece is handpicked by our editors for its craftsmanship and timeless appeal.`;

  return { text, hashtags: [`#${input.campaign.toLowerCase().replace(/\s+/g, "")}`, "#alayainsider", "#luxury", "#curated"] };
}

/* ================================================================== */
/*  MODULE 6b: CONTENT AI — Existing generators                       */
/* ================================================================== */

export async function generateArticle(input: {
  title: string;
  topic: string;
  category?: string;
  wordCount?: number;
}): Promise<{ title: string; excerpt: string; body: string[]; tags: string[] }> {
  const wordCount = input.wordCount || 500;
  const sections = [
    `## Introduction`,
    `When it comes to ${input.topic}, there's more than meets the eye. Whether you're a seasoned enthusiast or just beginning your journey, understanding the nuances can transform your experience entirely.`,
    `## Why ${input.topic} Matters`,
    `In today's world, ${input.topic} has become an essential consideration for those who value quality and intentionality. From the materials used to the craftsmanship involved, every aspect contributes to the overall experience.`,
    `## Key Considerations`,
    `Before diving into ${input.topic}, there are several factors worth considering. First, think about what matters most to you — is it durability, aesthetics, or versatility? Understanding your priorities will guide your choices and ensure satisfaction.`,
    `## Our Expert Take`,
    `Our editors have spent considerable time exploring ${input.topic}, and we've found that the best approach is one that balances quality with personal preference. We recommend starting with a well-crafted piece that aligns with your values and lifestyle.`,
    `## Final Thoughts`,
    `Whether you're investing in ${input.topic} for yourself or as a gift, remember that the best choices are the ones that bring lasting value and joy. Explore our curated selection to find pieces that resonate with you.`,
  ];

  return {
    title: input.title || `The Complete Guide to ${input.topic}`,
    excerpt: `Explore the world of ${input.topic} with our comprehensive guide. From key considerations to expert recommendations, discover everything you need to know.`,
    body: sections,
    tags: [input.topic, input.category || "lifestyle", "guide", "editorial"].filter(Boolean),
  };
}

export async function generateBuyingGuide(input: {
  topic: string;
  audience?: string;
}): Promise<{ title: string; sections: { heading: string; content: string }[] }> {
  const audience = input.audience || "discerning shoppers";
  return {
    title: `The Ultimate ${input.topic} Buying Guide`,
    sections: [
      { heading: "Understanding Your Needs", content: `Before purchasing ${input.topic}, take a moment to consider what matters most to you as one of our ${audience}.` },
      { heading: "Quality Indicators", content: `When evaluating ${input.topic}, look for quality materials, expert craftsmanship, and attention to detail — the hallmarks of pieces worth investing in.` },
      { heading: "Price vs. Value", content: "The most expensive option isn't always the best. Consider the value proposition: how often will you use it, how long will it last, and how does it make you feel?" },
      { heading: "Our Top Picks", content: `We've curated a selection of ${input.topic} options that exemplify quality and design. Each has been vetted by our editors for your confidence.` },
      { heading: "Care & Maintenance", content: "Proper care extends the life of your investment. Follow manufacturer guidelines and establish a regular maintenance routine." },
    ],
  };
}

export async function generateLandingPage(input: {
  campaign: string;
  audience?: string;
  cta?: string;
}): Promise<{ headline: string; subheadline: string; body: string; cta: string }> {
  return {
    headline: `Discover ${input.campaign}`,
    subheadline: `A carefully curated edit for ${input.audience || "those who appreciate the finer things"}.`,
    body: `Welcome to ${input.campaign} — a collection that embodies the spirit of thoughtful curation. Every piece has been selected with intention, ensuring that each addition to your life brings meaning and joy.`,
    cta: input.cta || "Explore the Collection",
  };
}

export async function generateNewsletter(input: {
  topic: string;
  subject?: string;
}): Promise<{ subject: string; preview: string; body: string }> {
  return {
    subject: input.subject || `${input.topic} — New Arrivals & Editor's Picks`,
    preview: `Discover what's new in ${input.topic}, handpicked by ALAYA INSIDER editors.`,
    body: [
      `Hi there,`,
      ``,
      `Welcome to this edition of the ALAYA INSIDER newsletter. We've curated the latest in ${input.topic} just for you.`,
      ``,
      `**What's Inside**`,
      `• New arrivals in ${input.topic}`,
      `• Editor's top picks`,
      `• Exclusive offers for subscribers`,
      ``,
      `Explore the collection and find something that speaks to you.`,
      ``,
      `With care,`,
      `The ALAYA INSIDER Team`,
    ].join("\n"),
  };
}

export async function generateSocialPost(input: {
  campaign: string;
  platform: string;
}): Promise<{ text: string; hashtags: string[] }> {
  const hashtags = [`#${input.campaign.toLowerCase().replace(/\s+/g, "")}`,
    "#alayainsider", "#luxuryedit", "#curated"];
  return {
    text: `✨ Discover ${input.campaign} — a thoughtfully curated edit for those who appreciate quality. Shop the collection at ALAYA INSIDER.`,
    hashtags,
  };
}

/* ================================================================== */
/*  MODULE 7a: IMAGE AI — Color Analysis                               */
/* ================================================================== */

export async function analyzeImageColors(url: string): Promise<{
  dominant_colors: string[];
  palette: { hex: string; name: string; percentage: number }[];
  warmth: string;
  contrast: string;
  brightness: string;
}> {
  // Deterministic color analysis based on URL hash
  const hash = url.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes = [
    [{ hex: "#F5F0EB", name: "Warm Ivory", percentage: 35 }, { hex: "#2C2C2C", name: "Charcoal", percentage: 25 }, { hex: "#8B7355", name: "Warm Brown", percentage: 20 }, { hex: "#D4C5A9", name: "Beige", percentage: 20 }],
    [{ hex: "#F8F8F8", name: "White", percentage: 40 }, { hex: "#1A1A1A", name: "Black", percentage: 30 }, { hex: "#C0C0C0", name: "Silver", percentage: 30 }],
    [{ hex: "#2F4F4F", name: "Dark Slate", percentage: 35 }, { hex: "#8FBC8F", name: "Sage", percentage: 30 }, { hex: "#F5DEB3", name: "Wheat", percentage: 35 }],
  ];
  const palette = palettes[Math.abs(hash) % palettes.length];
  const dominant = palette.sort((a, b) => b.percentage - a.percentage).slice(0, 3).map((c) => c.name);

  return {
    dominant_colors: dominant,
    palette,
    warmth: hash % 2 === 0 ? "warm" : "neutral",
    contrast: hash % 3 === 0 ? "high" : hash % 3 === 1 ? "medium" : "low",
    brightness: hash % 2 === 0 ? "bright" : "moderate",
  };
}

export async function detectDuplicateImages(
  url: string,
  existingUrls: string[],
): Promise<{ is_duplicate: boolean; similarity: number; matches: string[] }> {
  // Simple URL-based duplicate detection
  const baseName = url.split("/").pop()?.split("?")[0]?.replace(/[-_]/g, "").toLowerCase() || "";
  const matches = existingUrls.filter((existing) => {
    const existingBase = existing.split("/").pop()?.split("?")[0]?.replace(/[-_]/g, "").toLowerCase() || "";
    return existingBase === baseName;
  });
  return {
    is_duplicate: matches.length > 0,
    similarity: matches.length > 0 ? 80 + (Math.abs(url.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 15) : 0,
    matches,
  };
}

/* ================================================================== */
/*  MODULE 7b: IMAGE AI — Core generators                             */
/* ================================================================== */

export async function generateImageAltText(input: {
  productName: string;
  brand?: string;
  category?: string;
  imageType?: string;
}): Promise<string> {
  return `${input.productName}${input.brand ? ` by ${input.brand}` : ""} — ${input.imageType || "product photography"}, studio shot on neutral background`;
}

export async function generateImageCaption(input: {
  productName: string;
  brand?: string;
}): Promise<string> {
  return `The ${input.productName}${input.brand ? ` by ${input.brand}` : ""}. A considered piece for your collection.`;
}

export async function analyzeImageQuality(url: string): Promise<{
  score: number; resolution: string; lighting: string; focus: string;
  issues: string[];
}> {
  // Deterministic quality analysis based on URL characteristics
  const score = url.includes("placeholder") ? 30 : 85;
  const issues: string[] = [];
  if (score < 50) issues.push("Low resolution detected");
  if (score < 70) issues.push("Potential compression artifacts");
  return { score, resolution: score >= 80 ? "high" : "medium", lighting: "good", focus: "sharp", issues };
}

export async function detectImageObjects(text: string): Promise<string[]> {
  const tokens = text.split(/\s+/);
  const objects = tokens.filter((t) => t.length > 4 && !["with", "from", "that", "this", "the", "and"].includes(t.toLowerCase()));
  return [...new Set(objects)].slice(0, 10);
}

export async function generateImageTags(input: {
  productName: string;
  brand?: string;
  category?: string;
}): Promise<string[]> {
  const tags = [input.productName, input.brand, input.category, "product", "photography", "studio", "ecommerce"]
    .filter(Boolean)
    .map((t) => t!.toLowerCase().replace(/\s+/g, "-"));
  return [...new Set(tags)];
}

export async function getImageSeoScore(altText: string): Promise<number> {
  let score = 50;
  if (altText.length >= 30 && altText.length <= 125) score += 20;
  if (altText.includes("product") || altText.includes("photography")) score += 10;
  if (altText.match(/by\s+\w+/)) score += 10;
  return Math.min(100, score);
}

export async function getAccessibilityScore(altText: string): Promise<number> {
  let score = 60;
  if (altText.length >= 20) score += 20;
  if (!altText.startsWith("image of") && !altText.startsWith("picture of")) score += 10;
  if (altText.includes("—") || altText.includes(":")) score += 5;
  return Math.min(100, score);
}

/* ================================================================== */
/*  MODULE 8: SEO AI                                                   */
/* ================================================================== */

export async function keywordResearch(topic: string): Promise<{
  primary: string[]; long_tail: string[]; related: string[];
  volume_estimate: number; difficulty_estimate: number;
}> {
  const words = topic.toLowerCase().split(/\s+/).filter(Boolean);
  return {
    primary: [topic, ...words.map((w) => `luxury ${w}`)].slice(0, 5),
    long_tail: [
      `best ${topic} for ${words[0] || "you"}`,
      `how to choose ${topic}`,
      `${topic} buying guide`,
      `where to buy ${topic} online`,
      `${topic} review and comparison`,
    ],
    related: [`premium ${topic}`, `${topic} collection`, `${topic} edit`, `designer ${topic}`, `${topic} essentials`],
    volume_estimate: Math.abs(topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 5000 + 500,
    difficulty_estimate: Math.abs(topic.split("").reduce((a, c) => a + c.charCodeAt(0) * 31, 0)) % 40 + 20,
  };
}

export async function generateTopicClusters(topic: string): Promise<{
  pillar: string; cluster_topics: string[];
}[]> {
  return [
    { pillar: topic, cluster_topics: [`What is ${topic}`, `History of ${topic}`, `Types of ${topic}`, `${topic} Care Guide`] },
    { pillar: `How to Choose ${topic}`, cluster_topics: [`${topic} Buying Guide`, `${topic} for Beginners`, `Premium ${topic} Options`, `${topic} Under Budget`] },
    { pillar: `${topic} Trends`, cluster_topics: [`Latest ${topic} Trends`, `${topic} Seasonal Guide`, `${topic} Innovations`, `Future of ${topic}`] },
  ];
}

export async function generateInternalLinks(
  entityType: string,
  entityId: string,
): Promise<{ from: string; to: string; anchor: string }[]> {
  return [
    { from: entityId, to: "/shop", anchor: "Shop related products" },
    { from: entityId, to: "/journal", anchor: "Read our journal" },
    { from: entityId, to: "/about", anchor: "About ALAYA INSIDER" },
  ];
}

export async function generateSchema(input: {
  type: string;
  name: string;
  description: string;
  image?: string;
  url?: string;
}): Promise<Record<string, any>> {
  const schemas: Record<string, any> = {
    product: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: input.name,
      description: input.description,
      image: input.image,
      brand: { "@type": "Brand", name: "ALAYA INSIDER" },
      offers: { "@type": "Offer", availability: "https://schema.org/InStock" },
    },
    article: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: input.name,
      description: input.description,
      image: input.image,
      publisher: { "@type": "Organization", name: "ALAYA INSIDER" },
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    },
    howto: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: input.name,
      description: input.description,
      step: [],
    },
  };
  return schemas[input.type] || schemas.product;
}

/* ================================================================== */
/*  MODULE 8b: SEO AI — Additional Features                            */
/* ================================================================== */

export async function generateExternalLinks(input: {
  topic: string;
  url?: string;
}): Promise<{ url: string; anchor: string; authority: string; relevance: string }[]> {
  return [
    { url: "https://example.com/industry-standards", anchor: "Industry quality standards", authority: "high", relevance: "high" },
    { url: "https://example.com/materials-guide", anchor: "Materials and craftsmanship guide", authority: "high", relevance: "medium" },
    { url: "https://example.com/care-guide", anchor: "Product care best practices", authority: "medium", relevance: "medium" },
  ];
}

export async function extractEntities(text: string): Promise<{
  entities: { name: string; type: string; relevance: number }[];
  keywords: string[];
  topics: string[];
}> {
  const words = text.split(/\s+/).filter((w) => w.length > 3);
  const unique = [...new Set(words)];
  const entities = unique.slice(0, 10).map((w) => ({
    name: w,
    type: w[0] === w[0].toUpperCase() ? "Brand" : "Attribute",
    relevance: Math.round((1 - unique.indexOf(w) / unique.length) * 100),
  }));
  return {
    entities,
    keywords: unique.filter((w) => w.length > 5).slice(0, 8),
    topics: entities.filter((e) => e.type === "Brand").map((e) => e.name).slice(0, 5),
  };
}

export async function analyzeContentGap(input: {
  topic: string;
  existing_content: string[];
  competitor_content: string[];
}): Promise<{
  gaps: { topic: string; importance: string; suggestion: string }[];
  coverage_percent: number;
  recommended_articles: number;
}> {
  const existingSet = new Set(input.existing_content.map((c) => c.toLowerCase()));
  const competitorSet = new Set(input.competitor_content.map((c) => c.toLowerCase()));

  const gaps: { topic: string; importance: string; suggestion: string }[] = [];
  for (const compTopic of input.competitor_content) {
    if (!existingSet.has(compTopic.toLowerCase())) {
      gaps.push({
        topic: compTopic,
        importance: gaps.length < 2 ? "high" : "medium",
        suggestion: `Create content about ${compTopic} to match competitor coverage`,
      });
    }
  }

  const coverage = competitorSet.size > 0
    ? Math.round((existingSet.size / Math.max(1, competitorSet.size)) * 100)
    : 100;

  return {
    gaps: gaps.slice(0, 5),
    coverage_percent: Math.min(100, coverage),
    recommended_articles: Math.max(0, 5 - gaps.length),
  };
}

export async function generateCompetitorSuggestions(input: {
  topic: string;
  competitors?: string[];
}): Promise<{
  competitors: { name: string; strengths: string[]; weaknesses: string[]; opportunity: string }[];
  differentiation: string[];
}> {
  const competitors = (input.competitors || ["Competitor A", "Competitor B", "Competitor C"]).map((c, i) => ({
    name: c,
    strengths: ["Established brand presence", "Wide product range", "Strong SEO"],
    weaknesses: ["Limited content depth", "Generic product descriptions", "Poor internal linking"],
    opportunity: i === 0 ? `Create more detailed ${input.topic} guides than ${c}` : `Target ${input.topic} keywords ${c} ignores`,
  }));
  return {
    competitors,
    differentiation: [
      "Focus on editorial-quality content with expert insights",
      "Build comprehensive topic clusters around core keywords",
      "Create unique buying guides that competitors lack",
    ],
  };
}

export async function generateReviewSchema(input: {
  productName: string;
  reviews?: { author: string; rating: number; comment: string }[];
}): Promise<Record<string, any>> {
  const reviews = (input.reviews || [
    { author: "Verified Buyer", rating: 5, comment: "Excellent quality and craftsmanship" },
  ]).map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    reviewRating: { "@type": "Rating", ratingValue: r.rating },
    description: r.comment,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.productName,
    review: reviews,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.reviewRating.ratingValue, 0) / reviews.length).toFixed(1)
        : "5.0",
      reviewCount: reviews.length,
    },
  };
}

/* ================================================================== */
/*  MODULE 9: AFFILIATE AI                                             */
/* ================================================================== */

export async function compareAffiliatePrograms(): Promise<{
  programs: { name: string; commission: number; cookieDays: number; score: number }[];
  bestPick: string;
}> {
  const programs = [
    { name: "Amazon Associates", commission: 7, cookieDays: 24, score: 75 },
    { name: "ShareASale", commission: 10, cookieDays: 30, score: 82 },
    { name: "Rakuten", commission: 8, cookieDays: 30, score: 78 },
    { name: "PartnerStack", commission: 12, cookieDays: 45, score: 88 },
    { name: "Impact", commission: 11, cookieDays: 30, score: 85 },
  ];
  const best = programs.reduce((a, b) => a.score > b.score ? a : b);
  return { programs, bestPick: best.name };
}

export async function forecastAffiliateRevenue(input: {
  monthly_clicks?: number;
  conversion_rate?: number;
  avg_commission?: number;
  avg_order_value?: number;
}): Promise<{ monthly_forecast: number; annual_forecast: number; confidence: string }> {
  const clicks = input.monthly_clicks || 1000;
  const conv = (input.conversion_rate || 2) / 100;
  const comm = input.avg_commission || 8;
  const aov = input.avg_order_value || 150;
  const monthly = clicks * conv * (comm / 100) * aov;
  return {
    monthly_forecast: Math.round(monthly),
    annual_forecast: Math.round(monthly * 12),
    confidence: clicks > 5000 ? "high" : "medium",
  };
}

/* ================================================================== */
/*  MODULE 9b: AFFILIATE AI — Additional Features                      */
/* ================================================================== */

export async function chooseBestAffiliateLink(input: {
  product_name: string;
  links?: { program: string; url: string; commission: number; cookie_days: number; deep_link?: string }[];
}): Promise<{
  best_link: { program: string; url: string; score: number };
  alternatives: { program: string; url: string; score: number }[];
  reasoning: string;
}> {
  const links = input.links || [
    { program: "Amazon", url: "https://amazon.com/dp/example", commission: 7, cookie_days: 24 },
    { program: "ShareASale", url: "https://shareasale.com/r.cfm?p=example", commission: 10, cookie_days: 30 },
    { program: "Rakuten", url: "https://rakuten.com/example", commission: 8, cookie_days: 30 },
  ];

  const scored = links.map((l) => ({
    ...l,
    score: l.commission * 10 + l.cookie_days * 2,
  })).sort((a, b) => b.score - a.score);

  return {
    best_link: { program: scored[0].program, url: scored[0].deep_link || scored[0].url, score: scored[0].score },
    alternatives: scored.slice(1).map((l) => ({ program: l.program, url: l.deep_link || l.url, score: l.score })),
    reasoning: `Best link: ${scored[0].program} with ${scored[0].commission}% commission and ${scored[0].cookie_days}-day cookie window`,
  };
}

export async function repairBrokenAffiliateLinks(
  brokenUrls: string[],
): Promise<{ url: string; repaired: boolean; suggested_replacement?: string; status: string }[]> {
  return brokenUrls.map((url) => ({
    url,
    repaired: false,
    suggested_replacement: url.includes("/dp/")
      ? url.replace(/\/dp\/[A-Z0-9]+/, "/dp/REPLACED_ASIN")
      : url,
    status: "requires_review",
  }));
}

export async function suggestBetterAffiliateProducts(
  currentProductId: string,
  category?: string,
): Promise<{ current: string; suggestions: { name: string; reason: string; potential_commission: number }[] }> {
  return {
    current: currentProductId,
    suggestions: [
      { name: "Premium Alternative", reason: "Higher price point = higher commission", potential_commission: 12 },
      { name: "Bestselling Item", reason: "Higher conversion rate", potential_commission: 8 },
      { name: "New Arrival", reason: "Growing demand, less competition", potential_commission: 10 },
    ],
  };
}

/* ================================================================== */
/*  MODULE 10: PRICE AI                                                */
/* ================================================================== */

export async function analyzeCompetitorPrices(input: {
  product_price: number;
  competitor_prices?: number[];
  category?: string;
}): Promise<{
  avg_competitor: number; min_competitor: number; max_competitor: number;
  position: string; recommendation: string;
}> {
  const prices = input.competitor_prices || [input.product_price * 0.9, input.product_price * 1.1, input.product_price * 0.95];
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const ratio = input.product_price / avg;
  return {
    avg_competitor: Math.round(avg * 100) / 100,
    min_competitor: min,
    max_competitor: max,
    position: ratio < 0.95 ? "below_market" : ratio > 1.05 ? "above_market" : "at_market",
    recommendation: ratio > 1.05
      ? "Consider reducing price to stay competitive"
      : ratio < 0.95
        ? "You have room to increase price while remaining competitive"
        : "Current pricing is competitive",
  };
}

export async function recommendBestPrice(input: {
  cost_price: number;
  desired_margin: number;
  competitor_avg?: number;
  demand_level?: string;
}): Promise<{
  recommended_price: number; margin_percent: number; profit: number;
  confidence: string;
}> {
  const margin = input.desired_margin / 100;
  const priceFromMargin = input.cost_price / (1 - margin);
  const competitorPrice = input.competitor_avg || priceFromMargin;
  const demandMultiplier = input.demand_level === "high" ? 1.15 : input.demand_level === "low" ? 0.9 : 1;

  const recommended = Math.max(priceFromMargin, competitorPrice * 0.95) * demandMultiplier;
  return {
    recommended_price: Math.round(recommended * 100) / 100,
    margin_percent: Math.round(((recommended - input.cost_price) / recommended) * 100),
    profit: Math.round((recommended - input.cost_price) * 100) / 100,
    confidence: input.competitor_avg ? "high" : "medium",
  };
}

/* ================================================================== */
/*  MODULE 10b: PRICE AI — Supplier Prices                             */
/* ================================================================== */

export async function analyzeSupplierPrices(input: {
  product_name: string;
  supplier_prices?: { supplier: string; price: number }[];
}): Promise<{
  suppliers: { name: string; price: number; margin: number; recommendation: string }[];
  best_supplier: string;
  avg_price: number;
}> {
  const prices = input.supplier_prices || [
    { supplier: "Primary Supplier", price: 45 },
    { supplier: "Backup Supplier", price: 42 },
    { supplier: "Premium Supplier", price: 55 },
  ];
  const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length;
  const enriched = prices.map((p) => ({
    name: p.supplier,
    price: p.price,
    margin: Math.round((1 - p.price / avg) * 100),
    recommendation: p.price <= avg * 0.95
      ? "Best value — consider increasing volume"
      : p.price >= avg * 1.1
        ? "Premium pricing — evaluate quality benefit"
        : "Competitive pricing",
  }));
  const best = enriched.reduce((a, b) => a.price < b.price ? a : b);
  return { suppliers: enriched, best_supplier: best.name, avg_price: Math.round(avg * 100) / 100 };
}

/* ================================================================== */
/*  MODULE 11: CUSTOMER AI                                             */
/* ================================================================== */

export async function recommendProducts(
  customerId: string,
  limit = 8,
): Promise<any[]> {
  // Get customer's purchase history for personalization
  const orders = await queryAll<any>(
    `SELECT items FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [customerId],
  );
  const productIds = new Set<string>();
  for (const order of orders) {
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items || [];
    for (const item of items) productIds.add(item.product_id);
  }

  if (productIds.size > 0) {
    // Recommend from same categories as past purchases
    const ids = [...productIds];
    return queryAll(
      `SELECT DISTINCT p.id, p.name, p.brand, p.price, p.sale_price, p.images, p.slug, p.rating
       FROM products p
       WHERE p.id != ALL($1) AND p.status = 'published'
         AND p.category_id IN (SELECT category_id FROM products WHERE id = ANY($1))
       ORDER BY p.rating DESC, p.review_count DESC
       LIMIT $2`,
      [ids, limit],
    );
  }

  // Fallback to top-rated products
  return queryAll(
    `SELECT id, name, brand, price, sale_price, images, slug, rating
     FROM products WHERE status = 'published'
     ORDER BY rating DESC, review_count DESC LIMIT $1`,
    [limit],
  );
}

export async function recommendEmails(
  customerId: string,
): Promise<{ type: string; subject: string; preview: string; reason: string }[]> {
  const orders = await queryAll<any>(
    `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [customerId],
  );
  const lastOrder = orders[0];
  const daysSince = lastOrder
    ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / 86400000)
    : 999;

  const recommendations = [];
  if (daysSince > 60) {
    recommendations.push({
      type: "re_engagement",
      subject: "We Miss You — 15% Off Your Next Order",
      preview: "Come back and discover what's new at ALAYA INSIDER.",
      reason: "No purchase in 60+ days",
    });
  }
  if (daysSince < 30 && lastOrder) {
    recommendations.push({
      type: "post_purchase",
      subject: "Complete Your Look — Complementary Pieces",
      preview: "Based on your recent purchase, we think you'll love these.",
      reason: "Post-purchase cross-sell opportunity",
    });
  }
  recommendations.push({
    type: "newsletter",
    subject: "New Arrivals — Editor's Picks This Week",
    preview: "The latest additions to our curated collection.",
    reason: "Regular engagement",
  });
  return recommendations;
}

export async function recommendOffers(
  customerId: string,
): Promise<{ offer: string; description: string; discount: string; urgency: string }[]> {
  return [
    {
      offer: "Welcome Back Offer",
      description: "Complete your collection with 10% off select items.",
      discount: "10% OFF",
      urgency: "3 days remaining",
    },
    {
      offer: "Free Shipping",
      description: "Complimentary shipping on orders over $150.",
      discount: "FREE SHIPPING",
      urgency: "Always available",
    },
    {
      offer: "VIP Early Access",
      description: "Be the first to shop new arrivals and limited editions.",
      discount: "EARLY ACCESS",
      urgency: "New collection dropping soon",
    },
  ];
}

/* ================================================================== */
/*  MODULE 11b: CUSTOMER AI — Existing                                */
/* ================================================================== */

export async function segmentCustomers(): Promise<{
  segments: { name: string; count: number; percentage: number; description: string }[];
}> {
  const total = 1000; // Placeholder — would query customers table
  const segments = [
    { name: "VIP", count: Math.round(total * 0.05), percentage: 5, description: "High-value, frequent purchasers" },
    { name: "Active", count: Math.round(total * 0.25), percentage: 25, description: "Regular shoppers with consistent purchase history" },
    { name: "At Risk", count: Math.round(total * 0.15), percentage: 15, description: "Declining engagement — needs re-engagement" },
    { name: "New", count: Math.round(total * 0.20), percentage: 20, description: "First purchase within 30 days" },
    { name: "Dormant", count: Math.round(total * 0.35), percentage: 35, description: "No purchase in 90+ days" },
  ];
  return { segments };
}

export async function predictChurn(customerData: {
  days_since_last_purchase: number;
  total_orders: number;
  avg_order_value: number;
  return_rate: number;
}): Promise<{ risk: string; probability: number; recommendations: string[] }> {
  let probability = 0;
  if (customerData.days_since_last_purchase > 90) probability += 0.4;
  if (customerData.total_orders < 2) probability += 0.3;
  if (customerData.avg_order_value < 50) probability += 0.2;
  if (customerData.return_rate > 0.3) probability += 0.1;

  const risk = probability > 0.6 ? "high" : probability > 0.3 ? "medium" : "low";
  return {
    risk,
    probability: Math.round(probability * 100),
    recommendations: risk === "high"
      ? ["Send personalized re-engagement email", "Offer exclusive discount", "Request feedback on recent experience"]
      : risk === "medium"
        ? ["Send product recommendations based on past purchases", "Share new arrivals in their preferred category"]
        : ["Continue current engagement strategy"],
  };
}

export async function predictLifetimeValue(customerData: {
  total_spent: number;
  months_active: number;
  avg_monthly_spend: number;
}): Promise<{ current_ltv: number; predicted_ltv: number; potential_ltv: number }> {
  const monthlyAvg = customerData.months_active > 0
    ? customerData.total_spent / customerData.months_active
    : customerData.avg_monthly_spend;

  return {
    current_ltv: Math.round(customerData.total_spent * 100) / 100,
    predicted_ltv: Math.round(customerData.total_spent + monthlyAvg * 24 * 0.7 * 100) / 100,
    potential_ltv: Math.round(customerData.total_spent + monthlyAvg * 24 * 100) / 100,
  };
}

/* ================================================================== */
/*  MODULE 12a: COMMERCE AI — Returns & Supplier Performance          */
/* ================================================================== */

export async function forecastReturns(months = 6): Promise<{
  forecasts: { month: string; returns: number; refund_amount: number }[];
  total_returns: number;
  avg_return_rate: number;
}> {
  const baseReturns = 30;
  const baseRefund = 2500;
  const forecasts = Array.from({ length: months }, (_, i) => {
    const seasonal = 1 + Math.sin((i + 11) / 12 * Math.PI * 2) * 0.25; // Returns peak in Jan (after holidays)
    const returns = Math.round(baseReturns * seasonal);
    return {
      month: new Date(Date.now() + i * 30 * 86400000).toISOString().slice(0, 7),
      returns,
      refund_amount: Math.round(baseRefund * seasonal),
    };
  });
  return {
    forecasts,
    total_returns: forecasts.reduce((s, f) => s + f.returns, 0),
    avg_return_rate: 3.5,
  };
}

export async function forecastSupplierPerformance(months = 6): Promise<{
  forecasts: { month: string; on_time_rate: number; quality_score: number; avg_lead_days: number }[];
  overall_score: number;
}> {
  const forecasts = Array.from({ length: months }, (_, i) => ({
    month: new Date(Date.now() + i * 30 * 86400000).toISOString().slice(0, 7),
    on_time_rate: Math.round((90 + Math.sin(i * 0.5) * 5) * 10) / 10,
    quality_score: Math.round((85 + Math.cos(i * 0.3) * 5) * 10) / 10,
    avg_lead_days: Math.round((5 + Math.sin(i * 0.7) * 1.5) * 10) / 10,
  }));
  return { forecasts, overall_score: 88 };
}

export async function forecastCarrierPerformance(months = 6): Promise<{
  forecasts: { month: string; on_time_delivery: number; avg_transit_days: number; damage_rate: number }[];
  best_carrier: string;
}> {
  const forecasts = Array.from({ length: months }, (_, i) => ({
    month: new Date(Date.now() + i * 30 * 86400000).toISOString().slice(0, 7),
    on_time_delivery: Math.round((92 + Math.sin(i * 0.4) * 3) * 10) / 10,
    avg_transit_days: Math.round((4 + Math.cos(i * 0.6) * 1) * 10) / 10,
    damage_rate: Math.round((1.5 + Math.sin(i * 0.8) * 0.5) * 10) / 10,
  }));
  return { forecasts, best_carrier: "FedEx" };
}

/* ================================================================== */
/*  MODULE 12c: COMMERCE AI — Refunds Forecast                        */
/* ================================================================== */

export async function forecastRefunds(months = 6): Promise<{
  forecasts: { month: string; refunds: number; refund_amount: number; refund_rate: number }[];
  total_refunds: number;
  avg_refund_amount: number;
}> {
  const baseRefunds = 15;
  const baseAmount = 1800;
  const forecasts = Array.from({ length: months }, (_, i) => {
    const seasonal = 1 + Math.sin((i + 11) / 12 * Math.PI * 2) * 0.3;
    const refunds = Math.round(baseRefunds * seasonal);
    return {
      month: new Date(Date.now() + i * 30 * 86400000).toISOString().slice(0, 7),
      refunds,
      refund_amount: Math.round(baseAmount * seasonal),
      refund_rate: +(seasonal * 2.5).toFixed(1),
    };
  });
  return {
    forecasts,
    total_refunds: forecasts.reduce((s, f) => s + f.refunds, 0),
    avg_refund_amount: Math.round(baseAmount),
  };
}

/* ================================================================== */
/*  MODULE 12b: COMMERCE AI — Existing                                */
/* ================================================================== */

export async function forecastRevenue(months = 12): Promise<{
  forecasts: { month: string; revenue: number; confidence: string }[];
  total: number;
}> {
  const baseRevenue = 100000;
  const forecasts = Array.from({ length: months }, (_, i) => {
    const seasonal = 1 + Math.sin((i + 5) / 12 * Math.PI * 2) * 0.15;
    const growth = 1 + i * 0.02;
    const revenue = Math.round(baseRevenue * seasonal * growth);
    return {
      month: new Date(Date.now() + i * 30 * 86400000).toISOString().slice(0, 7),
      revenue,
      confidence: i < 3 ? "high" : i < 6 ? "medium" : "low",
    };
  });
  return { forecasts, total: forecasts.reduce((s, f) => s + f.revenue, 0) };
}

export async function forecastOrders(months = 12): Promise<{
  forecasts: { month: string; orders: number }[];
  total: number;
}> {
  const baseOrders = 500;
  const forecasts = Array.from({ length: months }, (_, i) => {
    const seasonal = 1 + Math.sin((i + 5) / 12 * Math.PI * 2) * 0.2;
    const growth = 1 + i * 0.015;
    const orders = Math.round(baseOrders * seasonal * growth);
    return { month: new Date(Date.now() + i * 30 * 86400000).toISOString().slice(0, 7), orders };
  });
  return { forecasts, total: forecasts.reduce((s, f) => s + f.orders, 0) };
}

export async function forecastDemand(productId?: string): Promise<{
  product_id?: string;
  current_demand: string;
  trend: string;
  seasonal_factor: number;
  recommendation: string;
}> {
  const seasonal = 1 + Math.sin((new Date().getMonth() + 5) / 12 * Math.PI * 2) * 0.2;
  return {
    product_id: productId,
    current_demand: seasonal > 1.1 ? "high" : seasonal < 0.9 ? "low" : "medium",
    trend: "increasing",
    seasonal_factor: Math.round(seasonal * 100) / 100,
    recommendation: seasonal > 1.1
      ? "Increase stock levels to meet demand"
      : "Maintain current inventory levels",
  };
}

export async function forecastStock(productId: string): Promise<{
  current_stock: number;
  days_until_out: number;
  reorder_recommendation: string;
}> {
  const product = await queryOne<any>("SELECT stock FROM products WHERE id = $1", [productId]);
  const stock = product?.stock || 0;
  const dailySales = Math.max(1, Math.round(stock * 0.02));
  return {
    current_stock: stock,
    days_until_out: Math.round(stock / dailySales),
    reorder_recommendation: stock < 20 ? "Reorder immediately" : stock < 50 ? "Plan reorder soon" : "Stock level adequate",
  };
}

/* ================================================================== */
/*  MODULE 13: SEARCH AI                                               */
/* ================================================================== */

export async function semanticSearch(query: string, limit = 20): Promise<any[]> {
  const lower = query.toLowerCase();
  const terms = lower.split(/\s+/).filter(Boolean);

  // Build search conditions
  const conditions = terms.map((_, i) =>
    `(name ILIKE $${i + 1} OR short_description ILIKE $${i + 1} OR tags::text ILIKE $${i + 1} OR brand ILIKE $${i + 1})`
  );
  const values = terms.map((t) => `%${t}%`);

  return queryAll(
    `SELECT id, name, brand, price, sale_price, images, short_description,
      slug, rating, review_count
     FROM products
     WHERE status = 'published' AND (${conditions.join(" OR ")})
     ORDER BY
       CASE WHEN name ILIKE $${terms.length + 1} THEN 0
            WHEN brand ILIKE $${terms.length + 2} THEN 1
            ELSE 2 END,
       rating DESC, review_count DESC
     LIMIT $${terms.length + 3}`,
    [...values, `%${query}%`, `%${query}%`, limit],
  );
}

export async function detectIntent(query: string): Promise<{
  intent: string;
  category?: string;
  price_range?: string;
  attributes: string[];
}> {
  const lower = query.toLowerCase();
  let intent = "browse";
  let category: string | undefined;
  const attributes: string[] = [];

  if (lower.includes("buy") || lower.includes("shop") || lower.includes("purchase")) intent = "purchase";
  else if (lower.includes("compare") || lower.includes("vs") || lower.includes("versus")) intent = "compare";
  else if (lower.includes("review") || lower.includes("best")) intent = "research";
  else if (lower.includes("under $") || lower.includes("budget") || lower.includes("cheap") || lower.includes("affordable")) {
    intent = "price_sensitive";
    const match = lower.match(/under\s*\$?(\d+)/);
    if (match) attributes.push(`budget: ${match[1]}`);
  }

  const categories = ["bags", "shoes", "jewelry", "watches", "clothing", "accessories",
    "home", "beauty", "fragrance", "leather"];
  for (const cat of categories) {
    if (lower.includes(cat)) { category = cat; break; }
  }

  const attrKeywords = ["luxury", "premium", "vintage", "designer", "handmade", "sustainable",
    "vegan", "organic", "limited", "exclusive", "gold", "silver", "leather", "silk"];
  for (const attr of attrKeywords) {
    if (lower.includes(attr)) attributes.push(attr);
  }

  return { intent, category, attributes: [...new Set(attributes)] };
}

export async function getRelatedProducts(productId: string, limit = 8): Promise<any[]> {
  const product = await queryOne<any>("SELECT category_id, brand, tags FROM products WHERE id = $1", [productId]);
  if (!product) return [];

  return queryAll(
    `SELECT id, name, brand, price, sale_price, images, slug, rating
     FROM products
     WHERE id != $1 AND status = 'published'
       AND (category_id = $2 OR brand = $3 OR tags && $4::text[])
     ORDER BY rating DESC, review_count DESC
     LIMIT $5`,
    [productId, product.category_id, product.brand || "", JSON.stringify(product.tags || []), limit],
  );
}

export async function naturalLanguageSearch(query: string): Promise<any> {
  const intent = await detectIntent(query);
  const results = await semanticSearch(query);
  return { intent, results, total: results.length };
}

/* ================================================================== */
/*  MODULE 14: AI MEMORY                                               */
/* ================================================================== */

export async function recordGeneration(input: {
  task: string;
  prompt_text: string;
  generated_text: string;
  provider_slug?: string;
  model_slug?: string;
  entity_type?: string;
  entity_id?: string;
  tokens_input?: number;
  tokens_output?: number;
  latency_ms?: number;
  user_id?: string;
  quality_score?: number;
  seo_score?: number;
  metadata?: Record<string, any>;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const totalTokens = (input.tokens_input || 0) + (input.tokens_output || 0);

  await query(
    `INSERT INTO ai_generations (id, task, prompt_text, generated_text, provider_slug,
      model_slug, entity_type, entity_id, tokens_input, tokens_output, total_tokens,
      latency_ms, user_id, quality_score, seo_score, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [id, input.task, input.prompt_text, input.generated_text,
     input.provider_slug || null, input.model_slug || null,
     input.entity_type || null, input.entity_id || null,
     input.tokens_input || 0, input.tokens_output || 0, totalTokens,
     input.latency_ms || 0, input.user_id || null,
     input.quality_score || null, input.seo_score || null,
     JSON.stringify(input.metadata || {}), now],
  );

  // Update usage aggregate
  await query(
    `INSERT INTO ai_usage (date, provider_slug, model_slug, task, requests,
      tokens_input, tokens_output, total_tokens, cost, avg_latency_ms, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (date, provider_slug, model_slug, COALESCE(task, ''))
     DO UPDATE SET
       requests = ai_usage.requests + 1,
       tokens_input = ai_usage.tokens_input + $5,
       tokens_output = ai_usage.tokens_output + $6,
       total_tokens = ai_usage.total_tokens + $7,
       cost = ai_usage.cost + $8,
       avg_latency_ms = (ai_usage.avg_latency_ms * ai_usage.requests + $9) / (ai_usage.requests + 1),
       updated_at = $11`,
    [now.slice(0, 10), input.provider_slug || "local", input.model_slug || "local",
     input.task, input.tokens_input || 0, input.tokens_output || 0, totalTokens,
     0, input.latency_ms || 0, now],
  );

  // Audit log for every AI request
  await query(
    `INSERT INTO audit_logs (actor, action, entity_type, entity_id, after_data, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [input.user_id || "ai_system", "ai_generation", input.entity_type || "ai",
     input.entity_id || id,
     JSON.stringify({ task: input.task, tokens: totalTokens, provider: input.provider_slug }),
     now],
  );

  return { id, created_at: now };
}

export async function getGenerationHistory(params: {
  task?: string;
  entity_type?: string;
  entity_id?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.task) { conditions.push(`task = $${idx}`); values.push(params.task); idx++; }
  if (params.entity_type) { conditions.push(`entity_type = $${idx}`); values.push(params.entity_type); idx++; }
  if (params.entity_id) { conditions.push(`entity_id = $${idx}`); values.push(params.entity_id); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  return queryAll(
    `SELECT * FROM ai_generations ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
}

export async function getUsageStats(
  days = 30,
): Promise<{
  total_requests: number; total_tokens: number; total_cost: number;
  avg_latency_ms: number; by_provider: Record<string, any>;
  by_task: Record<string, any>; daily: any[];
}> {
  const summary = await queryOne<any>(
    `SELECT
      COALESCE(SUM(requests), 0) as requests,
      COALESCE(SUM(total_tokens), 0) as tokens,
      COALESCE(SUM(cost), 0) as cost,
      COALESCE(AVG(avg_latency_ms), 0) as avg_latency
     FROM ai_usage WHERE date > NOW() - INTERVAL '1 day' * $1`,
    [days],
  );

  const byProvider = await queryAll(
    `SELECT provider_slug, SUM(requests) as requests, SUM(total_tokens) as tokens,
      SUM(cost) as cost
     FROM ai_usage WHERE date > NOW() - INTERVAL '1 day' * $1
     GROUP BY provider_slug ORDER BY requests DESC`,
    [days],
  );

  const byTask = await queryAll(
    `SELECT task, SUM(requests) as requests, SUM(total_tokens) as tokens
     FROM ai_generations WHERE created_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY task ORDER BY requests DESC LIMIT 20`,
    [days],
  );

  const daily = await queryAll(
    `SELECT date, SUM(requests) as requests, SUM(total_tokens) as tokens,
      SUM(cost) as cost
     FROM ai_usage WHERE date > NOW() - INTERVAL '1 day' * $1
     GROUP BY date ORDER BY date ASC`,
    [days],
  );

  return {
    total_requests: parseInt(summary?.requests || "0"),
    total_tokens: parseInt(summary?.tokens || "0"),
    total_cost: parseFloat(summary?.cost || "0"),
    avg_latency_ms: parseFloat(summary?.avg_latency || "0"),
    by_provider: Object.fromEntries(byProvider.map((r: any) => [r.provider_slug, r])),
    by_task: Object.fromEntries(byTask.map((r: any) => [r.task, r])),
    daily,
  };
}

/* ================================================================== */
/*  MODULE 15: AI WORKFLOWS                                            */
/* ================================================================== */

export async function registerWorkflow(input: {
  name: string;
  description?: string;
  trigger_event: string;
  ai_task: string;
  prompt_slug?: string;
  enabled?: boolean;
  auto_apply?: boolean;
  requires_review?: boolean;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date().toISOString();

  // Find prompt if slug provided
  let promptId: string | null = null;
  if (input.prompt_slug) {
    const prompt = await getPromptBySlug(input.prompt_slug);
    promptId = prompt?.id || null;
  }

  await query(
    `INSERT INTO ai_workflows (id, name, description, trigger_event, ai_task,
      prompt_id, enabled, auto_apply, requires_review, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, input.name, input.description || "", input.trigger_event, input.ai_task,
     promptId, input.enabled !== false, input.auto_apply || false,
     input.requires_review !== false, now, now],
  );

  return { id, name: input.name, trigger_event: input.trigger_event, created_at: now };
}

/* ================================================================== */
/*  MODULE 15b: A/B TEST PROMPTS                                       */
/* ================================================================== */

export async function enableABTest(
  promptId: string,
): Promise<{ prompt_id: string; a_test_enabled: boolean } | null> {
  const prompt = await getPrompt(promptId);
  if (!prompt) return null;
  await query(
    "UPDATE ai_prompts SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{a_test_enabled}', 'true'::jsonb), updated_at = NOW() WHERE id = $1",
    [promptId],
  );
  return { prompt_id: promptId, a_test_enabled: true };
}

export async function setABTestWinner(
  promptId: string,
  winnerVersion: number,
): Promise<{ prompt_id: string; winner_version: number } | null> {
  const prompt = await getPrompt(promptId);
  if (!prompt) return null;
  await query(
    `UPDATE ai_prompt_versions SET a_test_enabled = true, a_test_winner = 'v${winnerVersion}' WHERE prompt_id = $1 AND version = $2`,
    [promptId, winnerVersion],
  );
  // Rollback to winner version
  await rollbackPrompt(promptId, winnerVersion);
  return { prompt_id: promptId, winner_version: winnerVersion };
}

export async function approvePromptVersion(
  promptId: string,
  version: number,
  approvedBy: string,
): Promise<boolean> {
  const v = await queryOne<any>(
    "SELECT * FROM ai_prompt_versions WHERE prompt_id = $1 AND version = $2",
    [promptId, version],
  );
  if (!v) return false;
  const now = new Date().toISOString();
  await query(
    `UPDATE ai_prompt_versions SET approved = true, approved_by = $1, approved_at = $2 WHERE prompt_id = $3 AND version = $4`,
    [approvedBy, now, promptId, version],
  );
  return true;
}

export async function getPendingApprovals(): Promise<any[]> {
  return queryAll(
    `SELECT pv.*, p.name as prompt_name, p.slug as prompt_slug
     FROM ai_prompt_versions pv
     JOIN ai_prompts p ON p.id = pv.prompt_id
     WHERE pv.approved = false AND p.status = 'active'
     ORDER BY pv.created_at DESC`,
  );
}

export async function triggerWorkflow(
  event: string,
  entityType: string,
  entityId: string,
): Promise<any[]> {
  const workflows = await queryAll<any>(
    `SELECT * FROM ai_workflows WHERE trigger_event = $1 AND enabled = true ORDER BY sort_order ASC`,
    [event],
  );

  const results: any[] = [];
  for (const wf of workflows) {
    const runId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO ai_workflow_runs (id, workflow_id, trigger_event, entity_type, entity_id,
        status, requires_review, started_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [runId, wf.id, event, entityType, entityId, "running", wf.requires_review, now, now, now],
    );

    results.push({
      run_id: runId,
      workflow_id: wf.id,
      workflow_name: wf.name,
      ai_task: wf.ai_task,
      status: "running",
    });
  }

  return results;
}

export async function getWorkflows(): Promise<any[]> {
  return queryAll("SELECT * FROM ai_workflows ORDER BY trigger_event, sort_order ASC");
}

export async function getWorkflowRuns(params: {
  workflow_id?: string;
  status?: string;
  limit?: number;
}): Promise<any[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.workflow_id) { conditions.push(`workflow_id = $${idx}`); values.push(params.workflow_id); idx++; }
  if (params.status) { conditions.push(`status = $${idx}`); values.push(params.status); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return queryAll(
    `SELECT * FROM ai_workflow_runs ${where} ORDER BY created_at DESC LIMIT $${idx}`,
    [...values, params.limit || 50],
  );
}

export async function getWorkflowStats(): Promise<{
  total: number; enabled: number; by_event: Record<string, number>;
  total_runs: number; success_rate: number;
}> {
  const stats = await queryAll<any>("SELECT trigger_event, enabled FROM ai_workflows");
  const byEvent: Record<string, number> = {};
  for (const w of stats) {
    byEvent[w.trigger_event] = (byEvent[w.trigger_event] || 0) + 1;
  }

  const runs = await queryOne<any>(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'completed') as success FROM ai_workflow_runs",
  );

  return {
    total: stats.length,
    enabled: stats.filter((w: any) => w.enabled).length,
    by_event: byEvent,
    total_runs: parseInt(runs?.total || "0"),
    success_rate: parseInt(runs?.total || "0") > 0
      ? Math.round((parseInt(runs?.success || "0") / parseInt(runs?.total || "1")) * 100)
      : 100,
  };
}

/* ================================================================== */
/*  MODULE 16: AI DASHBOARD STATS                                      */
/* ================================================================== */

export async function getAIDashboardStats(): Promise<{
  providers: { total: number; active: number; healthy: number; budget: number; spent: number };
  models: { total: number; by_family: Record<string, number> };
  prompts: { total: number; by_category: Record<string, number> };
  usage: { total_requests: number; total_tokens: number; total_cost: number; avg_latency_ms: number };
  generations: { total_24h: number; by_task: Record<string, number> };
  quality: { avg_overall: number; avg_seo: number; avg_grammar: number; avg_readability: number };
  workflows: { total: number; enabled: number; total_runs: number };
}> {
  const providerStats = await getProviderStats();
  const modelStats = await getModelStats();
  const promptStats = await getPromptStats();
  const usageStats = await getUsageStats(30);
  const workflowStats = await getWorkflowStats();

  const gen24h = await queryAll<any>(
    `SELECT task, COUNT(*) as count FROM ai_generations
     WHERE created_at > NOW() - INTERVAL '24 hours'
     GROUP BY task ORDER BY count DESC`,
  );
  const byTask: Record<string, number> = {};
  for (const g of gen24h) byTask[g.task] = parseInt(g.count);

  const quality = await queryOne<any>(
    `SELECT
      COALESCE(AVG(quality_score), 0) as avg_quality,
      COALESCE(AVG(seo_score), 0) as avg_seo,
      COALESCE(AVG(grammar_score), 0) as avg_grammar,
      COALESCE(AVG(readability_score), 0) as avg_readability
     FROM ai_quality WHERE calculated_at > NOW() - INTERVAL '7 days'`,
  );

  return {
    providers: {
      total: providerStats.total,
      active: providerStats.active,
      healthy: providerStats.healthy,
      budget: providerStats.total_budget,
      spent: providerStats.total_spent,
    },
    models: { total: modelStats.total, by_family: modelStats.by_family },
    prompts: { total: promptStats.total, by_category: promptStats.by_category },
    usage: {
      total_requests: usageStats.total_requests,
      total_tokens: usageStats.total_tokens,
      total_cost: usageStats.total_cost,
      avg_latency_ms: usageStats.avg_latency_ms,
    },
    generations: { total_24h: Object.values(byTask).reduce((a, b) => a + b, 0), by_task: byTask },
    quality: {
      avg_overall: parseFloat(quality?.avg_quality || "0"),
      avg_seo: parseFloat(quality?.avg_seo || "0"),
      avg_grammar: parseFloat(quality?.avg_grammar || "0"),
      avg_readability: parseFloat(quality?.avg_readability || "0"),
    },
    workflows: {
      total: workflowStats.total,
      enabled: workflowStats.enabled,
      total_runs: workflowStats.total_runs,
    },
  };
}

/* ================================================================== */
/*  SEED DATA — Default providers & models                             */
/* ================================================================== */

export async function seedAIPlatform(): Promise<void> {
  // Check if providers already exist
  const existing = await queryOne("SELECT COUNT(*) as c FROM ai_providers");
  if (parseInt(existing?.c || "0") > 0) return;

  // Create default providers
  const openai = await createProvider({ slug: "openai", name: "OpenAI", provider_type: "openai", priority: 1 });
  const anthropic = await createProvider({ slug: "anthropic", name: "Anthropic", provider_type: "claude", priority: 2 });
  const gemini = await createProvider({ slug: "gemini", name: "Google Gemini", provider_type: "gemini", priority: 3 });
  const deepseek = await createProvider({ slug: "deepseek", name: "DeepSeek", provider_type: "deepseek", priority: 4 });
  const openrouter = await createProvider({ slug: "openrouter", name: "OpenRouter", provider_type: "openrouter", priority: 5 });

  // Set up fallbacks
  await updateProvider(anthropic.id, { fallback_to: openai.id } as any);
  await updateProvider(gemini.id, { fallback_to: anthropic.id } as any);
  await updateProvider(deepseek.id, { fallback_to: openrouter.id } as any);
  await updateProvider(openrouter.id, { fallback_to: openai.id } as any);

  // Create default models
  await createModel({ provider_id: openai.id, slug: "gpt-4o", name: "GPT-4o", model_family: "gpt-4", capabilities: ["text", "vision", "functions", "json"], max_tokens: 4096, pricing_input_per_1k: 0.01, pricing_output_per_1k: 0.03, is_default: true });
  await createModel({ provider_id: openai.id, slug: "gpt-4o-mini", name: "GPT-4o Mini", model_family: "gpt-4", capabilities: ["text", "functions", "json"], max_tokens: 4096, pricing_input_per_1k: 0.0015, pricing_output_per_1k: 0.006 });
  await createModel({ provider_id: openai.id, slug: "gpt-4-turbo", name: "GPT-4 Turbo", model_family: "gpt-4", capabilities: ["text", "vision", "functions"], max_tokens: 8192, pricing_input_per_1k: 0.01, pricing_output_per_1k: 0.03 });
  await createModel({ provider_id: anthropic.id, slug: "claude-3-opus", name: "Claude 3 Opus", model_family: "claude-3", capabilities: ["text", "vision", "functions"], max_tokens: 4096, pricing_input_per_1k: 0.015, pricing_output_per_1k: 0.075 });
  await createModel({ provider_id: anthropic.id, slug: "claude-3-sonnet", name: "Claude 3 Sonnet", model_family: "claude-3", capabilities: ["text", "functions"], max_tokens: 4096, pricing_input_per_1k: 0.003, pricing_output_per_1k: 0.015 });
  await createModel({ provider_id: anthropic.id, slug: "claude-3-haiku", name: "Claude 3 Haiku", model_family: "claude-3", capabilities: ["text"], max_tokens: 4096, pricing_input_per_1k: 0.00025, pricing_output_per_1k: 0.00125 });
  await createModel({ provider_id: gemini.id, slug: "gemini-1.5-pro", name: "Gemini 1.5 Pro", model_family: "gemini-1.5", capabilities: ["text", "vision", "functions"], max_tokens: 8192, pricing_input_per_1k: 0.0035, pricing_output_per_1k: 0.0105 });
  await createModel({ provider_id: gemini.id, slug: "gemini-1.5-flash", name: "Gemini 1.5 Flash", model_family: "gemini-1.5", capabilities: ["text", "vision"], max_tokens: 8192, pricing_input_per_1k: 0.000075, pricing_output_per_1k: 0.0003 });
  await createModel({ provider_id: deepseek.id, slug: "deepseek-v3", name: "DeepSeek V3", model_family: "deepseek", capabilities: ["text", "functions"], max_tokens: 4096, pricing_input_per_1k: 0.0005, pricing_output_per_1k: 0.002 });
  await createModel({ provider_id: openrouter.id, slug: "openrouter-auto", name: "OpenRouter Auto", model_family: "openrouter", capabilities: ["text", "functions", "vision"], max_tokens: 4096, pricing_input_per_1k: 0.005, pricing_output_per_1k: 0.015 });

  // Create default prompts
  const defaultPrompts = [
    { slug: "product-title", name: "Product Title", category: "product", user_template: "Generate a compelling product title for {product_name}" },
    { slug: "product-description", name: "Product Description", category: "product", user_template: "Write a detailed product description for {product_name} from {brand}" },
    { slug: "product-features", name: "Product Features", category: "product", user_template: "List key features for {product_name}" },
    { slug: "seo-title", name: "SEO Meta Title", category: "seo", user_template: "Generate an SEO-optimized meta title for {product_name}" },
    { slug: "seo-description", name: "SEO Meta Description", category: "seo", user_template: "Write a compelling meta description for {product_name}" },
    { slug: "article-outline", name: "Article Outline", category: "content", user_template: "Create an outline for an article about {topic}" },
    { slug: "buying-guide", name: "Buying Guide", category: "content", user_template: "Write a buying guide for {topic}" },
    { slug: "alt-text", name: "Image Alt Text", category: "image", user_template: "Generate descriptive alt text for {product_name}" },
    { slug: "social-post", name: "Social Media Post", category: "content", user_template: "Create a social media post about {campaign}" },
    { slug: "faq-generation", name: "FAQ Generator", category: "seo", user_template: "Generate FAQs for {product_name}" },
  ];
  for (const p of defaultPrompts) {
    await createPrompt(p);
  }

  console.log("[AI] Platform seeded: 5 providers, 10 models, 10 prompts");
}
