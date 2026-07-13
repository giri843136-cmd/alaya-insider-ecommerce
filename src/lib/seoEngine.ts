/**
 * ALAYA INSIDER — SEO analysis engine.
 * Centralized, dependency-free scoring + suggestion generation for the SEO Studio.
 * Structured for future AI enhancement (each check returns deterministic hints).
 */
import type { Article, Brand, Category, Product } from "./types";

export interface SeoCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  weight: number;
}

export interface SeoReport {
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D";
  checks: SeoCheck[];
  summary: string;
}

const titleLen = (t: string) => (t || "").trim().length;
const metaLen = (d: string) => (d || "").trim().length;
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/** Analyze a product's SEO posture. */
export function analyzeProduct(p: Product): SeoReport {
  const checks: SeoCheck[] = [
    {
      id: "title",
      label: "Title length",
      status: titleLen(p.name) >= 20 && titleLen(p.name) <= 60 ? "pass" : titleLen(p.name) > 0 ? "warn" : "fail",
      detail: titleLen(p.name) === 0 ? "Missing product name" : `${titleLen(p.name)} chars — aim for 30–60`,
      weight: 15,
    },
    {
      id: "description",
      label: "Meta description",
      status: metaLen(p.shortDescription) >= 70 && metaLen(p.shortDescription) <= 160 ? "pass" : metaLen(p.shortDescription) > 0 ? "warn" : "fail",
      detail: metaLen(p.shortDescription) === 0 ? "Missing description" : `${metaLen(p.shortDescription)} chars — aim for 70–160`,
      weight: 15,
    },
    {
      id: "images",
      label: "Image count",
      status: p.images.length >= 3 ? "pass" : p.images.length >= 1 ? "warn" : "fail",
      detail: p.images.length === 0 ? "No images" : `${p.images.length} image(s) — add 3+ for galleries`,
      weight: 12,
    },
    {
      id: "reviews",
      label: "Review schema eligible",
      status: p.reviewCount >= 5 ? "pass" : p.reviewCount > 0 ? "warn" : "fail",
      detail: `${p.reviewCount} reviews — more reviews enrich schema`,
      weight: 10,
    },
    {
      id: "body",
      label: "Description depth",
      status: p.description.length >= 300 ? "pass" : p.description.length >= 120 ? "warn" : "fail",
      detail: `${p.description.length} chars in long description`,
      weight: 12,
    },
    {
      id: "features",
      label: "Feature highlights",
      status: p.features.length >= 3 ? "pass" : p.features.length > 0 ? "warn" : "fail",
      detail: `${p.features.length} feature bullets`,
      weight: 8,
    },
    {
      id: "tags",
      label: "Tags / keywords",
      status: p.tags.length >= 3 ? "pass" : p.tags.length > 0 ? "warn" : "fail",
      detail: `${p.tags.length} tags`,
      weight: 8,
    },
    {
      id: "specs",
      label: "Specifications table",
      status: p.specs && p.specs.length >= 4 ? "pass" : "warn",
      detail: p.specs ? `${p.specs.length} spec rows` : "No specifications",
      weight: 8,
    },
    {
      id: "slug",
      label: "URL slug",
      status: /^[a-z0-9-]{3,}$/.test(p.slug) ? "pass" : "warn",
      detail: `/${p.slug}`,
      weight: 6,
    },
    {
      id: "sku",
      label: "SKU / identifiers",
      status: p.sku ? "pass" : "warn",
      detail: p.sku || "Missing SKU",
      weight: 6,
    },
  ];
  return scoreReport(checks, p.name);
}

/** Analyze an article's SEO posture. */
export function analyzeArticle(a: Article): SeoReport {
  const checks: SeoCheck[] = [
    { id: "title", label: "Title length", status: titleLen(a.title) >= 30 && titleLen(a.title) <= 60 ? "pass" : "warn", detail: `${titleLen(a.title)} chars`, weight: 20 },
    { id: "excerpt", label: "Meta description", status: metaLen(a.excerpt) >= 70 && metaLen(a.excerpt) <= 160 ? "pass" : "warn", detail: `${metaLen(a.excerpt)} chars`, weight: 20 },
    { id: "body", label: "Content depth", status: a.body.join(" ").length >= 800 ? "pass" : "warn", detail: `${a.body.join(" ").length} chars`, weight: 20 },
    { id: "tags", label: "Tags", status: a.tags.length >= 3 ? "pass" : "warn", detail: `${a.tags.length} tags`, weight: 12 },
    { id: "image", label: "Cover image", status: a.cover ? "pass" : "fail", detail: a.cover ? "Present" : "Missing", weight: 12 },
    { id: "slug", label: "URL slug", status: /^[a-z0-9-]{3,}$/.test(a.slug) ? "pass" : "warn", detail: `/${a.slug}`, weight: 8 },
    { id: "readtime", label: "Reading time", status: a.readMinutes >= 3 ? "pass" : "warn", detail: `${a.readMinutes} min`, weight: 8 },
  ];
  return scoreReport(checks, a.title);
}

/** Analyze a category's SEO posture. */
export function analyzeCategory(c: Category): SeoReport {
  const checks: SeoCheck[] = [
    { id: "title", label: "Name", status: titleLen(c.name) >= 3 ? "pass" : "fail", detail: c.name, weight: 25 },
    { id: "desc", label: "Description", status: metaLen(c.description) >= 120 ? "pass" : metaLen(c.description) > 0 ? "warn" : "fail", detail: `${metaLen(c.description)} chars`, weight: 30 },
    { id: "tagline", label: "SEO tagline", status: metaLen(c.tagline) >= 20 ? "pass" : "warn", detail: c.tagline, weight: 20 },
    { id: "image", label: "Banner image", status: c.image ? "pass" : "fail", detail: c.image ? "Present" : "Missing", weight: 15 },
    { id: "slug", label: "URL slug", status: /^[a-z0-9-]{3,}$/.test(c.id) ? "pass" : "warn", detail: `/shop?category=${c.id}`, weight: 10 },
  ];
  return scoreReport(checks, c.name);
}

/** Analyze a brand's SEO posture. */
export function analyzeBrand(b: Brand): SeoReport {
  const checks: SeoCheck[] = [
    { id: "title", label: "Name", status: titleLen(b.name) >= 2 ? "pass" : "fail", detail: b.name, weight: 25 },
    { id: "desc", label: "Brand story", status: metaLen(b.description) >= 150 ? "pass" : metaLen(b.description) > 0 ? "warn" : "fail", detail: `${metaLen(b.description)} chars`, weight: 30 },
    { id: "tagline", label: "Tagline", status: metaLen(b.tagline) >= 10 ? "pass" : "warn", detail: b.tagline, weight: 15 },
    { id: "image", label: "Logo / image", status: b.image ? "pass" : "fail", detail: b.image ? "Present" : "Missing", weight: 15 },
    { id: "country", label: "Country of origin", status: b.country ? "pass" : "warn", detail: b.country, weight: 15 },
  ];
  return scoreReport(checks, b.name);
}

function scoreReport(checks: SeoCheck[], name: string): SeoReport {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight * 0.5 : 0), 0);
  const score = clamp(Math.round((earned / totalWeight) * 100));
  const grade: SeoReport["grade"] = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  const failed = checks.filter((c) => c.status !== "pass");
  const summary = failed.length === 0
    ? `"${name}" is fully optimized across all checks.`
    : `${failed.length} improvement${failed.length > 1 ? "s" : ""} recommended for "${name}".`;
  return { score, grade, checks, summary };
}

/** Suggest an SEO-friendly meta title from a name + fallback. */
export function suggestMetaTitle(name: string, fallback = "ALAYA INSIDER"): string {
  const base = name.trim();
  const suffix = ` — ${fallback}`;
  const max = 60;
  if (base.length + suffix.length <= max) return base + suffix;
  return base.slice(0, max - suffix.length - 1).trim() + "…" + suffix;
}

/** Suggest a meta description from a body of text. */
export function suggestMetaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + "…";
}

/** Suggest a keyword set from text. */
export function suggestKeywords(...texts: string[]): string[] {
  const stop = new Set(["the", "and", "for", "with", "your", "you", "that", "this", "are", "our", "from", "have", "but", "not", "will", "can", "all", "its", "a", "of", "to", "in", "on", "is", "it", "be", "as", "at", "by", "an", "or"]);
  const freq: Record<string, number> = {};
  texts.join(" ").toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/).forEach((w) => {
    if (w.length < 4 || stop.has(w)) return;
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
}
