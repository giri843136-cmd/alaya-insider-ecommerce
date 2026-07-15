/**
 * ALAYA INSIDER — Enterprise Content Platform (PART 2.13)
 * ====================================================================
 * Unified operating system for every article, page, guide, review,
 * editorial, collection, landing page, media asset, SEO content,
 * AI-generated content, and localized content.
 *
 * Integrates with: Frontend, Backend, Admin Panel, Auth, Workflows,
 * Analytics, AI, Search, SEO, Commerce, Customer, Affiliate, Supplier,
 * Communication, Observability, Infrastructure, Developer, Testing.
 *
 * Modules:
 *   1. CMS Engine (pages, blocks, templates, versioning, publishing)
 *   2. Editorial Engine (authors, teams, workflows, reviews, E-E-A-T)
 *   3. Content Taxonomy (categories, tags, topics, internal linking)
 *   4. SEO Content Engine (schema/JSON-LD, OG, canonicals, sitemaps)
 *   5. AI Content Studio (writing, expansion, summarization, translation)
 *   6. Localization Platform (multi-language, regional variants)
 *   7. Content Search & Discovery (semantic, vector, recommendations)
 *   8. Content Scheduling (calendars, publishing schedules)
 *   9. Content Reports & Forecasting
 */
import { uid } from "./utils";
import { pushLog } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const CP_STORAGE_KEY = "alaya_content_platform";
const CP_CONTENT_KEY = "alaya_content_entries";
const CP_TEMPLATES_KEY = "alaya_content_templates";
const CP_AUTHORS_KEY = "alaya_content_authors";
const CP_CALENDAR_KEY = "alaya_content_calendar";
const CP_TAXONOMY_KEY = "alaya_content_taxonomy";

/* ================================================================== */
/*  SHARED HELPERS                                                     */
/* ================================================================== */

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
function save<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

function clamp(n: number, min = 0, max = 100) { return Math.min(max, Math.max(min, n)); }
function rnd(min: number, max: number) { return Math.floor(min + Math.random() * (max - min)); }

/* ================================================================== */
/*  TYPES — CMS                                                        */
/* ================================================================== */

export type ContentStatus = "draft" | "review" | "approved" | "scheduled" | "published" | "archived";
export type ContentType = "article" | "page" | "guide" | "comparison" | "review" | "editorial" | "landing" | "collection";
export type BlockType = "text" | "image" | "video" | "gallery" | "quote" | "cta" | "product_grid" | "comparison_table" | "faq" | "code" | "embed" | "divider" | "columns" | "accordion" | "tabs";

export interface ContentBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  children: ContentBlock[];
}

export interface ContentEntry {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  status: ContentStatus;
  locale: string;
  authorId: string;
  editorIds: string[];
  reviewerIds: string[];
  categoryId: string;
  tags: string[];
  excerpt: string;
  body: ContentBlock[];
  coverImage: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    canonical: string;
    noindex: boolean;
    nofollow: boolean;
    structuredData: Record<string, unknown>;
  };
  settings: {
    featured: boolean;
    sticky: boolean;
    allowComments: boolean;
    showAuthor: boolean;
    showRelated: boolean;
    password?: string;
  };
  version: number;
  publishedAt?: number;
  scheduledAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: ContentType;
  thumbnail: string;
  blocks: ContentBlock[];
  category: string;
  tags: string[];
  uses: number;
  createdAt: number;
}

export interface ContentVersion {
  id: string;
  entryId: string;
  version: number;
  data: Partial<ContentEntry>;
  changes: string;
  author: string;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Editorial                                                   */
/* ================================================================== */

export type AuthorStatus = "active" | "inactive" | "pending";
export type WorkflowStage = "draft" | "editorial_review" | "legal_review" | "seo_review" | "ai_review" | "approved" | "scheduled" | "published";

export interface Author {
  id: string;
  name: string;
  slug: string;
  email: string;
  bio: string;
  avatar: string;
  role: "author" | "editor" | "contributor" | "reviewer" | "admin";
  status: AuthorStatus;
  department: string;
  teams: string[];
  expertise: string[];
  social: { twitter?: string; linkedin?: string; instagram?: string; website?: string };
  eEAT: { verified: boolean; verifiedBy?: string; verifiedAt?: number; credentials?: string; awards?: string[] };
  stats: { articlesCount: number; totalViews: number; avgRating: number };
  createdAt: number;
}

export interface EditorialTeam {
  id: string;
  name: string;
  description: string;
  department: string;
  leadId: string;
  memberIds: string[];
  createdAt: number;
}

export interface WorkflowState {
  id: string;
  entryId: string;
  stage: WorkflowStage;
  assigneeIds: string[];
  notes: WorkflowNote[];
  startedAt: number;
  completedAt?: number;
}

export interface WorkflowNote {
  id: string;
  authorId: string;
  stage: WorkflowStage;
  body: string;
  action: "submitted" | "approved" | "rejected" | "revision_requested" | "commented";
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Taxonomy                                                    */
/* ================================================================== */

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  icon: string;
  articleCount: number;
  createdAt: number;
}

export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
}

export interface ContentTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  relatedTopicIds: string[];
  articleCount: number;
}

export interface InternalLink {
  id: string;
  sourceEntryId: string;
  targetEntryId: string;
  anchor: string;
  type: "related" | "reference" | "citation";
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — SEO Content Engine                                         */
/* ================================================================== */

export interface SchemaTemplate {
  id: string;
  name: string;
  type: string;
  schema: Record<string, unknown>;
  category: string;
}

export interface SeoAudit {
  entryId: string;
  score: number;
  grade: string;
  checks: { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string }[];
  suggestions: string[];
  lastAudited: number;
}

/* ================================================================== */
/*  TYPES — AI Content Studio                                          */
/* ================================================================== */

export interface AiContentRequest {
  id: string;
  type: "expand" | "summarize" | "rewrite" | "translate" | "grammar" | "seo_optimize" | "keywords" | "internal_links" | "readability" | "fact_check" | "tone_adjust" | "brand_voice";
  sourceText: string;
  params: Record<string, unknown>;
  result?: string;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Localization                                               */
/* ================================================================== */

export interface LocalizationEntry {
  entryId: string;
  locale: string;
  title: string;
  slug: string;
  excerpt: string;
  body: ContentBlock[];
  seo: { metaTitle: string; metaDescription: string };
  translatedAt: number;
  translatedBy: string;
  reviewed: boolean;
}

/* ================================================================== */
/*  TYPES — Scheduling & Reports                                       */
/* ================================================================== */

export interface PublishingSchedule {
  id: string;
  entryId: string;
  entryTitle: string;
  entryType: ContentType;
  scheduledAt: number;
  status: "pending" | "published" | "failed";
  createdAt: number;
}

export interface ContentReport {
  id: string;
  type: "editorial" | "seo" | "author" | "publishing" | "performance" | "ai";
  name: string;
  period: { from: number; to: number };
  metrics: Record<string, number>;
  generatedAt: number;
}

export interface ContentForecast {
  id: string;
  type: "views" | "engagement" | "output";
  metric: string;
  periods: { label: string; predicted: number; lower: number; upper: number }[];
  confidence: number;
  generatedAt: number;
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedData() {
  if (load(CP_CONTENT_KEY, []).length > 0) return;
  const now = Date.now();

  /* ---- Content Templates ---- */
  const templates: ContentTemplate[] = [
    {
      id: uid("tpl"), name: "Standard Article", description: "Classic editorial article with hero image, body text, and callout blocks",
      type: "article", thumbnail: "", category: "Articles", tags: ["editorial", "standard"], uses: 24, createdAt: now - 90 * 86400000,
      blocks: [
        { id: uid("blk"), type: "text", props: { content: "<h2>Introduction</h2><p>Write your opening paragraph here…</p>" }, children: [] },
        { id: uid("blk"), type: "image", props: { alt: "", caption: "" }, children: [] },
        { id: uid("blk"), type: "text", props: { content: "<h2>Main Content</h2><p>Develop your story with rich text, quotes, and media.</p>" }, children: [] },
        { id: uid("blk"), type: "cta", props: { label: "Shop now", link: "/shop", variant: "primary" }, children: [] },
      ],
    },
    {
      id: uid("tpl"), name: "Buying Guide", description: "Structured buying guide with specs table, comparison grid, and product cards",
      type: "guide", thumbnail: "", category: "Guides", tags: ["guide", "comparison"], uses: 15, createdAt: now - 60 * 86400000,
      blocks: [
        { id: uid("blk"), type: "text", props: { content: "<h2>What to Look For</h2>" }, children: [] },
        { id: uid("blk"), type: "comparison_table", props: { headers: ["Feature", "Budget", "Mid-range", "Premium"] }, children: [] },
        { id: uid("blk"), type: "product_grid", props: { title: "Top Picks" }, children: [] },
        { id: uid("blk"), type: "faq", props: { items: [{ q: "Question?", a: "Answer." }] }, children: [] },
      ],
    },
    {
      id: uid("tpl"), name: "Landing Page", description: "High-conversion landing page with hero, features, testimonial, and CTA",
      type: "landing", thumbnail: "", category: "Pages", tags: ["landing", "marketing"], uses: 8, createdAt: now - 45 * 86400000,
      blocks: [
        { id: uid("blk"), type: "cta", props: { label: "Get Started", link: "#", variant: "hero" }, children: [] },
        { id: uid("blk"), type: "columns", props: { columns: 3, gap: "md" }, children: [] },
        { id: uid("blk"), type: "quote", props: { text: "Amazing product!", author: "Customer" }, children: [] },
        { id: uid("blk"), type: "cta", props: { label: "View Today's Price", link: "/shop", variant: "primary" }, children: [] },
      ],
    },
    {
      id: uid("tpl"), name: "Product Review", description: "In-depth product review with pros/cons, rating, and gallery",
      type: "review", thumbnail: "", category: "Reviews", tags: ["review", "product"], uses: 18, createdAt: now - 30 * 86400000,
      blocks: [
        { id: uid("blk"), type: "text", props: { content: "<h2>Overview</h2>" }, children: [] },
        { id: uid("blk"), type: "gallery", props: { images: [] }, children: [] },
        { id: uid("blk"), type: "text", props: { content: "<h2>Pros & Cons</h2>" }, children: [] },
        { id: uid("blk"), type: "cta", props: { label: "Check Price", link: "#", variant: "primary" }, children: [] },
      ],
    },
  ];
  save(CP_TEMPLATES_KEY, templates);

  /* ---- Authors ---- */
  const authors: Author[] = [
    { id: uid("auth"), name: "Elena Voss", slug: "elena-voss", email: "elena@alaya.com", bio: "Senior fashion editor with 10+ years covering luxury and emerging designers.", avatar: "https://i.pravatar.cc/150?u=elena", role: "editor", status: "active", department: "Fashion", teams: ["editorial", "luxury"], expertise: ["fashion", "luxury", "sustainable"], social: { twitter: "@elenavoss", linkedin: "elenavoss", website: "" }, eEAT: { verified: true, verifiedBy: "admin", verifiedAt: now - 60 * 86400000, credentials: "BA Journalism, CFDA Member", awards: ["Best Fashion Editor 2024"] }, stats: { articlesCount: 48, totalViews: 124000, avgRating: 4.7 }, createdAt: now - 365 * 86400000 },
    { id: uid("auth"), name: "Marcus Chen", slug: "marcus-chen", email: "marcus@alaya.com", bio: "Tech and lifestyle writer specializing in smart home and wearable tech.", avatar: "https://i.pravatar.cc/150?u=marcus", role: "author", status: "active", department: "Tech", teams: ["editorial", "tech"], expertise: ["technology", "smart-home", "wearables"], social: { twitter: "@marcuschen", linkedin: "marcuschen", website: "marcuschen.com" }, eEAT: { verified: true, verifiedBy: "admin", verifiedAt: now - 30 * 86400000, credentials: "BS Computer Science" }, stats: { articlesCount: 32, totalViews: 89000, avgRating: 4.5 }, createdAt: now - 300 * 86400000 },
    { id: uid("auth"), name: "Sophia Laurent", slug: "sophia-laurent", email: "sophia@alaya.com", bio: "Beauty and wellness editor with a passion for clean beauty and skincare science.", avatar: "https://i.pravatar.cc/150?u=sophia", role: "author", status: "active", department: "Beauty", teams: ["editorial"], expertise: ["beauty", "skincare", "wellness"], social: { instagram: "@sophialaurent" }, eEAT: { verified: false }, stats: { articlesCount: 27, totalViews: 72000, avgRating: 4.3 }, createdAt: now - 240 * 86400000 },
    { id: uid("auth"), name: "James Okafor", slug: "james-okafor", email: "james@alaya.com", bio: "Investigative journalist covering sustainability, ethical fashion, and supply chains.", avatar: "https://i.pravatar.cc/150?u=james", role: "contributor", status: "active", department: "Sustainability", teams: ["editorial", "sustainability"], expertise: ["sustainability", "ethical-fashion", "supply-chain"], social: { twitter: "@jamesokafor", linkedin: "jamesokafor" }, eEAT: { verified: true, verifiedBy: "admin", verifiedAt: now - 15 * 86400000, awards: ["Green Journalism Award 2024"] }, stats: { articlesCount: 14, totalViews: 38000, avgRating: 4.8 }, createdAt: now - 180 * 86400000 },
    { id: uid("auth"), name: "ALAYA Editors", slug: "alaya-editors", email: "editors@alaya.com", bio: "The ALAYA editorial team.", avatar: "", role: "editor", status: "active", department: "Editorial", teams: ["editorial"], expertise: [], social: {}, eEAT: { verified: true, verifiedBy: "admin", verifiedAt: now - 365 * 86400000 }, stats: { articlesCount: 89, totalViews: 240000, avgRating: 4.6 }, createdAt: now - 365 * 86400000 },
  ];
  save(CP_AUTHORS_KEY, authors);

  /* ---- Taxonomy ---- */
  const categories: ContentCategory[] = [
    { id: "style", name: "Style", slug: "style", description: "Fashion, trends, and style guides", parentId: null, icon: "Sparkles", articleCount: 12, createdAt: now - 365 * 86400000 },
    { id: "tech", name: "Technology", slug: "technology", description: "Tech reviews, guides, and news", parentId: null, icon: "Monitor", articleCount: 8, createdAt: now - 300 * 86400000 },
    { id: "beauty", name: "Beauty", slug: "beauty", description: "Skincare, makeup, and wellness", parentId: null, icon: "Sparkle", articleCount: 6, createdAt: now - 240 * 86400000 },
    { id: "home", name: "Home & Living", slug: "home-living", description: "Home decor, furniture, and lifestyle", parentId: null, icon: "Home", articleCount: 4, createdAt: now - 180 * 86400000 },
    { id: "sustainability", name: "Sustainability", slug: "sustainability", description: "Ethical fashion and sustainable living", parentId: null, icon: "Leaf", articleCount: 3, createdAt: now - 120 * 86400000 },
    { id: "luxury", name: "Luxury", slug: "luxury", description: "Luxury goods and premium experiences", parentId: null, icon: "Gem", articleCount: 5, createdAt: now - 90 * 86400000 },
  ];
  const tags: ContentTag[] = [
    { id: uid("tag"), name: "Sustainable", slug: "sustainable", articleCount: 8 },
    { id: uid("tag"), name: "Minimalist", slug: "minimalist", articleCount: 5 },
    { id: uid("tag"), name: "Luxury", slug: "luxury", articleCount: 6 },
    { id: uid("tag"), name: "Budget-Friendly", slug: "budget-friendly", articleCount: 4 },
    { id: uid("tag"), name: "Gift Guide", slug: "gift-guide", articleCount: 3 },
    { id: uid("tag"), name: "New Arrival", slug: "new-arrival", articleCount: 7 },
    { id: uid("tag"), name: "Editor's Pick", slug: "editors-pick", articleCount: 9 },
    { id: uid("tag"), name: "Trending", slug: "trending", articleCount: 6 },
    { id: uid("tag"), name: "How To", slug: "how-to", articleCount: 4 },
    { id: uid("tag"), name: "Review", slug: "review", articleCount: 5 },
  ];
  const topics: ContentTopic[] = [
    { id: uid("top"), name: "Capsule Wardrobe", slug: "capsule-wardrobe", description: "Building a minimalist, versatile wardrobe", relatedTopicIds: [], articleCount: 3 },
    { id: uid("top"), name: "Clean Beauty", slug: "clean-beauty", description: "Non-toxic, sustainable beauty products", relatedTopicIds: [], articleCount: 4 },
    { id: uid("top"), name: "Smart Home", slug: "smart-home", description: "Connected devices and home automation", relatedTopicIds: [], articleCount: 2 },
    { id: uid("top"), name: "Sustainable Fashion", slug: "sustainable-fashion", description: "Ethical and eco-friendly fashion", relatedTopicIds: [], articleCount: 5 },
    { id: uid("top"), name: "Digital Wellness", slug: "digital-wellness", description: "Healthy technology habits and tools", relatedTopicIds: [], articleCount: 2 },
  ];
  save(CP_TAXONOMY_KEY, { categories, tags, topics, internalLinks: [] } as any);

  /* ---- Schema Templates ---- */
  const schemaTmpls: SchemaTemplate[] = [
    { id: uid("sch"), name: "Article", type: "Article", category: "Content", schema: { "@context": "https://schema.org", "@type": "Article", headline: "", author: { "@type": "Person" }, publisher: { "@type": "Organization", name: "ALAYA INSIDER" } } },
    { id: uid("sch"), name: "Product", type: "Product", category: "Commerce", schema: { "@context": "https://schema.org", "@type": "Product", name: "", offers: { "@type": "Offer", price: "", priceCurrency: "USD" } } },
    { id: uid("sch"), name: "FAQ", type: "FAQPage", category: "Content", schema: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] } },
    { id: uid("sch"), name: "How-To", type: "HowTo", category: "Content", schema: { "@context": "https://schema.org", "@type": "HowTo", name: "", step: [] } },
    { id: uid("sch"), name: "Breadcrumb", type: "BreadcrumbList", category: "Navigation", schema: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [] } },
    { id: uid("sch"), name: "Organization", type: "Organization", category: "Brand", schema: { "@context": "https://schema.org", "@type": "Organization", name: "ALAYA INSIDER", logo: "", url: "" } },
    { id: uid("sch"), name: "Video", type: "VideoObject", category: "Media", schema: { "@context": "https://schema.org", "@type": "VideoObject", name: "", description: "", thumbnailUrl: "" } },
    { id: uid("sch"), name: "Review", type: "Review", category: "Commerce", schema: { "@context": "https://schema.org", "@type": "Review", itemReviewed: { "@type": "Product" }, reviewRating: { "@type": "Rating", ratingValue: "" } } },
  ];
  save(`${CP_STORAGE_KEY}_schemas`, schemaTmpls);

  /* ---- Calendar events ---- */
  const calendar: PublishingSchedule[] = [
    { id: uid("cal"), entryId: "demo1", entryTitle: "Spring Fashion Trends 2026", entryType: "article", scheduledAt: now + 7 * 86400000, status: "pending", createdAt: now - 2 * 86400000 },
    { id: uid("cal"), entryId: "demo2", entryTitle: "Best Smart Home Devices", entryType: "guide", scheduledAt: now + 14 * 86400000, status: "pending", createdAt: now - 5 * 86400000 },
    { id: uid("cal"), entryId: "demo3", entryTitle: "Clean Beauty Guide 2026", entryType: "guide", scheduledAt: now + 21 * 86400000, status: "pending", createdAt: now - 3 * 86400000 },
  ];
  save(CP_CALENDAR_KEY, calendar);
}

seedData();

/* ================================================================== */
/*  MODULE 1 — CMS ENGINE                                              */
/* ================================================================== */

export function getContentEntries(): ContentEntry[] { return load(CP_CONTENT_KEY, []); }
export function getContentEntry(id: string): ContentEntry | undefined { return getContentEntries().find((e) => e.id === id || e.slug === id); }

export function createContentEntry(input: Partial<ContentEntry> & { title: string; type: ContentType; authorId: string }): ContentEntry {
  const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const entry: ContentEntry = {
    id: input.id ?? uid("cnt"),
    type: input.type,
    title: input.title,
    slug,
    status: "draft",
    locale: input.locale ?? "en",
    authorId: input.authorId,
    editorIds: input.editorIds ?? [],
    reviewerIds: input.reviewerIds ?? [],
    categoryId: input.categoryId ?? "",
    tags: input.tags ?? [],
    excerpt: input.excerpt ?? "",
    body: input.body ?? [],
    coverImage: input.coverImage ?? "",
    seo: input.seo ?? { metaTitle: "", metaDescription: "", ogImage: "", canonical: "", noindex: false, nofollow: false, structuredData: {} },
    settings: input.settings ?? { featured: false, sticky: false, allowComments: true, showAuthor: true, showRelated: true },
    version: 1,
    publishedAt: input.publishedAt,
    scheduledAt: input.scheduledAt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const all = getContentEntries();
  all.unshift(entry);
  save(CP_CONTENT_KEY, all);
  pushLog("info", "system", `Content entry created: ${entry.title} (${entry.type})`);
  return entry;
}

export function updateContentEntry(id: string, patch: Partial<ContentEntry>): ContentEntry | null {
  const all = getContentEntries();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, version: all[idx].version + 1, updatedAt: Date.now() };
  save(CP_CONTENT_KEY, all);
  pushLog("info", "system", `Content entry updated: ${all[idx].title} (v${all[idx].version})`);
  return all[idx];
}

export function deleteContentEntry(id: string) {
  const all = getContentEntries().filter((e) => e.id !== id);
  save(CP_CONTENT_KEY, all);
  pushLog("warning", "system", `Content entry deleted: ${id}`);
}

export function publishContentEntry(id: string): ContentEntry | null {
  return updateContentEntry(id, { status: "published", publishedAt: Date.now() });
}

export function archiveContentEntry(id: string): ContentEntry | null {
  return updateContentEntry(id, { status: "archived" });
}

export function scheduleContentEntry(id: string, scheduledAt: number): ContentEntry | null {
  const entry = updateContentEntry(id, { status: "scheduled", scheduledAt });
  if (entry) {
    const schedule: PublishingSchedule = { id: uid("cal"), entryId: id, entryTitle: entry.title, entryType: entry.type, scheduledAt, status: "pending", createdAt: Date.now() };
    const cal = load<PublishingSchedule[]>(CP_CALENDAR_KEY, []);
    cal.push(schedule);
    save(CP_CALENDAR_KEY, cal);
  }
  return entry;
}

export function duplicateContentEntry(id: string): ContentEntry | null {
  const original = getContentEntry(id);
  if (!original) return null;
  return createContentEntry({ ...original, title: `${original.title} (Copy)`, slug: `${original.slug}-copy-${Date.now()}`, id: undefined, status: "draft", publishedAt: undefined, scheduledAt: undefined } as any);
}

/* ---- Content Templates ---- */
export function getContentTemplates(): ContentTemplate[] { return load(CP_TEMPLATES_KEY, []); }
export function getContentTemplate(id: string): ContentTemplate | undefined { return getContentTemplates().find((t) => t.id === id); }
export function createContentTemplate(input: Partial<ContentTemplate> & { name: string; type: ContentType }): ContentTemplate {
  const tpl: ContentTemplate = { id: input.id ?? uid("tpl"), name: input.name, description: input.description ?? "", type: input.type, thumbnail: input.thumbnail ?? "", blocks: input.blocks ?? [], category: input.category ?? "", tags: input.tags ?? [], uses: 0, createdAt: Date.now() };
  const all = getContentTemplates();
  all.push(tpl);
  save(CP_TEMPLATES_KEY, all);
  return tpl;
}

/* ---- Content Versions ---- */
export function getContentVersions(entryId: string): ContentVersion[] {
  try { return JSON.parse(localStorage.getItem(`${CP_STORAGE_KEY}_versions_${entryId}`) || "[]"); } catch { return []; }
}
export function saveContentVersion(entryId: string, data: Partial<ContentEntry>, changes: string, author: string): ContentVersion {
  const versions = getContentVersions(entryId);
  const version: ContentVersion = { id: uid("ver"), entryId, version: versions.length + 1, data, changes, author, createdAt: Date.now() };
  versions.push(version);
  try { localStorage.setItem(`${CP_STORAGE_KEY}_versions_${entryId}`, JSON.stringify(versions.slice(-50))); } catch { /* quota */ }
  return version;
}
export function rollbackContentEntry(entryId: string, targetVersion: number): ContentEntry | null {
  const versions = getContentVersions(entryId);
  const ver = versions.find((v) => v.version === targetVersion);
  if (!ver) return null;
  return updateContentEntry(entryId, ver.data);
}

/* ================================================================== */
/*  MODULE 2 — EDITORIAL ENGINE                                         */
/* ================================================================== */

export function getAuthors(): Author[] { return load(CP_AUTHORS_KEY, []); }
export function getAuthor(id: string): Author | undefined { return getAuthors().find((a) => a.id === id); }

export function createAuthor(input: Partial<Author> & { name: string; email: string }): Author {
  const author: Author = { id: input.id ?? uid("auth"), name: input.name, slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), email: input.email, bio: input.bio ?? "", avatar: input.avatar ?? "", role: input.role ?? "author", status: input.status ?? "active", department: input.department ?? "", teams: input.teams ?? [], expertise: input.expertise ?? [], social: input.social ?? {}, eEAT: input.eEAT ?? { verified: false }, stats: input.stats ?? { articlesCount: 0, totalViews: 0, avgRating: 0 }, createdAt: Date.now() };
  const all = getAuthors();
  all.push(author);
  save(CP_AUTHORS_KEY, all);
  return author;
}

export function updateAuthor(id: string, patch: Partial<Author>): Author | null {
  const all = getAuthors();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  save(CP_AUTHORS_KEY, all);
  return all[idx];
}

export function getTeams(): EditorialTeam[] { return load(`${CP_STORAGE_KEY}_teams`, []); }
export function createTeam(input: Partial<EditorialTeam> & { name: string; leadId: string }): EditorialTeam {
  const team: EditorialTeam = { id: input.id ?? uid("team"), name: input.name, description: input.description ?? "", department: input.department ?? "", leadId: input.leadId, memberIds: input.memberIds ?? [], createdAt: Date.now() };
  const all = getTeams();
  all.push(team);
  save(`${CP_STORAGE_KEY}_teams`, all);
  return team;
}

export function getWorkflowStates(): WorkflowState[] { return load(`${CP_STORAGE_KEY}_workflows`, []); }
export function getWorkflowForEntry(entryId: string): WorkflowState | undefined { return getWorkflowStates().find((w) => w.entryId === entryId); }

export function startWorkflow(entryId: string, assigneeIds: string[]): WorkflowState {
  const wf: WorkflowState = { id: uid("wf"), entryId, stage: "draft", assigneeIds, notes: [], startedAt: Date.now() };
  const all = getWorkflowStates();
  all.push(wf);
  save(`${CP_STORAGE_KEY}_workflows`, all);
  return wf;
}

export function advanceWorkflow(entryId: string, stage: WorkflowStage, note?: string, authorId?: string): WorkflowState | null {
  const all = getWorkflowStates();
  const idx = all.findIndex((w) => w.entryId === entryId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], stage, completedAt: stage === "published" ? Date.now() : undefined };
  if (note) {
    all[idx].notes.push({ id: uid("wn"), authorId: authorId ?? "", stage, body: note, action: stage === "approved" ? "approved" : stage === "draft" ? "revision_requested" : "submitted", createdAt: Date.now() });
  }
  save(`${CP_STORAGE_KEY}_workflows`, all);
  return all[idx];
}

/* ================================================================== */
/*  MODULE 3 — CONTENT TAXONOMY                                        */
/* ================================================================== */

export function getContentTaxonomy() { return load<{ categories: ContentCategory[]; tags: ContentTag[]; topics: ContentTopic[]; internalLinks: InternalLink[] }>(CP_TAXONOMY_KEY, { categories: [], tags: [], topics: [], internalLinks: [] }); }

export function getCategories(): ContentCategory[] { return getContentTaxonomy().categories; }
export function getTags(): ContentTag[] { return getContentTaxonomy().tags; }
export function getTopics(): ContentTopic[] { return getContentTaxonomy().topics; }

export function createCategory(input: Partial<ContentCategory> & { name: string }): ContentCategory {
  const tx = getContentTaxonomy();
  const cat: ContentCategory = { id: input.id ?? uid("ccat"), name: input.name, slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), description: input.description ?? "", parentId: input.parentId ?? null, icon: input.icon ?? "", articleCount: 0, createdAt: Date.now() };
  tx.categories.push(cat);
  save(CP_TAXONOMY_KEY, tx);
  return cat;
}

export function createTag(name: string): ContentTag {
  const tx = getContentTaxonomy();
  const tag: ContentTag = { id: uid("ctag"), name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), articleCount: 0 };
  tx.tags.push(tag);
  save(CP_TAXONOMY_KEY, tx);
  return tag;
}

export function createTopic(input: Partial<ContentTopic> & { name: string }): ContentTopic {
  const tx = getContentTaxonomy();
  const topic: ContentTopic = { id: input.id ?? uid("ctop"), name: input.name, slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), description: input.description ?? "", relatedTopicIds: input.relatedTopicIds ?? [], articleCount: 0 };
  tx.topics.push(topic);
  save(CP_TAXONOMY_KEY, tx);
  return topic;
}

export function addInternalLink(sourceEntryId: string, targetEntryId: string, anchor: string, type: InternalLink["type"] = "related"): InternalLink {
  const tx = getContentTaxonomy();
  const link: InternalLink = { id: uid("il"), sourceEntryId, targetEntryId, anchor, type, createdAt: Date.now() };
  tx.internalLinks.push(link);
  save(CP_TAXONOMY_KEY, tx);
  return link;
}

export function getInternalLinks(entryId: string): InternalLink[] {
  return getContentTaxonomy().internalLinks.filter((l) => l.sourceEntryId === entryId || l.targetEntryId === entryId);
}

export function getRelatedContent(entryId: string, entries: ContentEntry[], maxResults = 4): ContentEntry[] {
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return [];
  return entries
    .filter((e) => e.id !== entryId && e.status === "published")
    .map((e) => {
      let score = 0;
      if (e.categoryId === entry.categoryId) score += 3;
      const sharedTags = e.tags.filter((t) => entry.tags.includes(t)).length;
      score += sharedTags;
      return { entry: e, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((r) => r.entry);
}

/* ================================================================== */
/*  MODULE 4 — SEO CONTENT ENGINE                                      */
/* ================================================================== */

export function getSchemaTemplates(): SchemaTemplate[] { return load(`${CP_STORAGE_KEY}_schemas`, []); }

export function generateJsonLd(entry: ContentEntry, author?: Author): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": entry.type === "article" ? "Article" : entry.type === "review" ? "Review" : entry.type === "guide" ? "HowTo" : "WebPage",
    headline: entry.title,
    description: entry.excerpt,
    image: entry.coverImage,
    datePublished: entry.publishedAt ? new Date(entry.publishedAt).toISOString() : undefined,
    dateModified: new Date(entry.updatedAt).toISOString(),
    author: author ? { "@type": "Person", name: author.name } : { "@type": "Organization", name: "ALAYA INSIDER" },
    publisher: { "@type": "Organization", name: "ALAYA INSIDER" },
  };
  return base;
}

export function generateOpenGraph(entry: ContentEntry): Record<string, string> {
  return {
    "og:title": entry.seo.metaTitle || entry.title,
    "og:description": entry.seo.metaDescription || entry.excerpt,
    "og:image": entry.seo.ogImage || entry.coverImage,
    "og:type": "article",
    "og:url": entry.seo.canonical || "",
  };
}

export function generateTwitterCard(entry: ContentEntry): Record<string, string> {
  return {
    "twitter:card": "summary_large_image",
    "twitter:title": entry.seo.metaTitle || entry.title,
    "twitter:description": entry.seo.metaDescription || entry.excerpt,
    "twitter:image": entry.seo.ogImage || entry.coverImage,
  };
}

export function auditSeo(entry: ContentEntry): SeoAudit {
  const checks: SeoAudit['checks'] = [
    { id: "title", label: "Meta title", status: (entry.seo.metaTitle?.length ?? 0) >= 30 && (entry.seo.metaTitle?.length ?? 0) <= 60 ? "pass" : "warn" as const, detail: `${entry.seo.metaTitle?.length ?? 0} chars — aim 30-60"` },
    { id: "description", label: "Meta description", status: (entry.seo.metaDescription?.length ?? 0) >= 70 && (entry.seo.metaDescription?.length ?? 0) <= 160 ? "pass" : "warn" as const, detail: `${entry.seo.metaDescription?.length ?? 0} chars` },
    { id: "slug", label: "URL slug", status: /^[a-z0-9-]{3,}$/.test(entry.slug) ? "pass" : "warn" as const, detail: `/${entry.slug}` },
    { id: "excerpt", label: "Excerpt", status: entry.excerpt.length >= 50 ? "pass" : "warn" as const, detail: `${entry.excerpt.length} chars` },
    { id: "cover", label: "Cover image", status: entry.coverImage ? "pass" : "fail" as const, detail: entry.coverImage ? "Present" : "Missing" },
    { id: "og_image", label: "OG image", status: entry.seo.ogImage ? "pass" : "warn" as const, detail: entry.seo.ogImage || "Using cover fallback" },
    { id: "canonical", label: "Canonical URL", status: entry.seo.canonical ? "pass" : "warn" as const, detail: entry.seo.canonical || "Not set" },
    { id: "structured", label: "Structured data", status: Object.keys(entry.seo.structuredData).length > 0 ? "pass" : "warn" as const, detail: `${Object.keys(entry.seo.structuredData).length} fields` },
    { id: "body_length", label: "Content depth", status: entry.body.length >= 5 ? "pass" : entry.body.length >= 2 ? "warn" : "fail" as const, detail: `${entry.body.length} blocks` },
    { id: "tags", label: "Tags", status: entry.tags.length >= 2 ? "pass" : "warn" as const, detail: `${entry.tags.length} tags` },
    { id: "category", label: "Category", status: entry.categoryId ? "pass" : "fail" as const, detail: entry.categoryId || "Uncategorized" },
  ] as const;
  const totalWeight = checks.reduce((s, _c) => s + 9, 0);
  const earned = checks.reduce((s, c) => s + (c.status === "pass" ? 9 : c.status === "warn" ? 4.5 : 0), 0);
  const score = clamp(Math.round((earned / totalWeight) * 100));
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  const suggestions = checks.filter((c) => c.status !== "pass").map((c) => `${c.label}: ${c.detail}`);
  return { entryId: entry.id, score, grade, checks, suggestions, lastAudited: Date.now() };
}

/* ================================================================== */
/*  MODULE 5 — AI CONTENT STUDIO                                       */
/* ================================================================== */

export function getAiContentHistory(): AiContentRequest[] { return load(`${CP_STORAGE_KEY}_ai_history`, []); }

export function runAiContentTask(type: AiContentRequest["type"], sourceText: string, params: Record<string, unknown> = {}): AiContentRequest {
  let result = "";
  const wordCount = sourceText.split(/\s+/).filter(Boolean).length;

  switch (type) {
    case "expand":
      result = sourceText + `\n\n[AI EXPANDED] Building on the above, this topic encompasses several important dimensions worth exploring in greater detail. From foundational principles to advanced applications, each aspect contributes to a comprehensive understanding that empowers informed decision-making and strategic implementation across relevant contexts.`;
      break;
    case "summarize":
      result = sourceText.split(". ").slice(0, Math.max(3, Math.ceil(wordCount / 50))).join(". ") + ".";
      break;
    case "rewrite":
      result = `[AI REWRITE] ${sourceText.replace(/\b(good|nice|great|very)\b/gi, (m) => ({ good: "exceptional", nice: "refined", great: "outstanding", very: "remarkably" })[m.toLowerCase()] || m)}`;
      break;
    case "translate":
      result = `[AI TRANSLATION to ${(params.targetLocale as string) || "es"}] ${sourceText}`;
      break;
    case "grammar":
      result = sourceText; // demo: no change
      break;
    case "seo_optimize":
      result = sourceText + `\n\n[SEO OPTIMIZED] Enhanced with targeted keyword placement, improved heading structure, and optimized meta-description readiness.`;
      break;
    case "keywords":
      result = (params.existingKeywords as string[] || []).concat(["ai-suggested-1", "ai-suggested-2", "ai-suggested-3"]).join(", ");
      break;
    case "internal_links":
      result = "AI suggests linking to: related-guide, latest-trends, expert-opinion";
      break;
    case "readability":
      result = `Flesch Reading Ease: ${65 + rnd(0, 20)} (Standard). Grade Level: ${8 + rnd(0, 4)}. Sentence count: ${Math.ceil(wordCount / 15)}. Recommend adding subheadings every 300 words.`;
      break;
    case "fact_check":
      result = `AI Fact Check: Verified ${rnd(3, 8)} claims. ${rnd(1, 3)} need citation. Suggested sources: [alaya-research-${rnd(100, 999)}].`;
      break;
    case "tone_adjust":
      result = `[TONE: ${(params.tone as string) || "professional"}] ${sourceText}`;
      break;
    case "brand_voice":
      result = `[BRAND VOICE — ALAYA INSIDER] ${sourceText.replace(/we think/i, "we believe").replace(/maybe/i, "certainly").replace(/good/i, "exceptional")}`;
      break;
  }

  const req: AiContentRequest = { id: uid("ai"), type, sourceText, params, result, createdAt: Date.now() };
  const history = getAiContentHistory();
  history.unshift(req);
  save(`${CP_STORAGE_KEY}_ai_history`, history.slice(0, 200));
  pushLog("info", "system", `AI content task: ${type}`);
  return req;
}

export function getAiContentSuggestions(_content: string): string[] {
  const suggestions = [
    "Consider adding a featured quote to break up text blocks",
    "Include a comparison table for better scannability",
    "Add an FAQ section to target featured snippets",
    "Insert a product grid to increase conversion opportunities",
    "The introduction could be strengthened with a statistic",
    "Consider adding expert quotes for E-E-A-T authority",
  ];
  return suggestions.sort(() => Math.random() - 0.5).slice(0, 3);
}

/* ================================================================== */
/*  MODULE 6 — LOCALIZATION PLATFORM                                   */
/* ================================================================== */

export function getLocalizations(entryId: string): LocalizationEntry[] {
  try { return JSON.parse(localStorage.getItem(`${CP_STORAGE_KEY}_loc_${entryId}`) || "[]"); } catch { return []; }
}

export function createLocalization(input: Partial<LocalizationEntry> & { entryId: string; locale: string; title: string }): LocalizationEntry {
  const loc: LocalizationEntry = { entryId: input.entryId, locale: input.locale, title: input.title, slug: input.slug ?? "", excerpt: input.excerpt ?? "", body: input.body ?? [], seo: input.seo ?? { metaTitle: "", metaDescription: "" }, translatedAt: Date.now(), translatedBy: input.translatedBy ?? "AI Translator", reviewed: false };
  const all = getLocalizations(input.entryId);
  const existing = all.findIndex((l) => l.locale === input.locale);
  if (existing >= 0) all[existing] = loc;
  else all.push(loc);
  try { localStorage.setItem(`${CP_STORAGE_KEY}_loc_${input.entryId}`, JSON.stringify(all)); } catch { /* quota */ }
  pushLog("info", "system", `Localization created: ${input.locale} for ${input.entryId}`);
  return loc;
}

export function getAvailableLocales(): { code: string; label: string; flag: string }[] {
  return [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  ];
}

export function translateEntry(entry: ContentEntry, targetLocale: string, translator: string): LocalizationEntry {
  const loc: LocalizationEntry = {
    entryId: entry.id,
    locale: targetLocale,
    title: `[${targetLocale.toUpperCase()}] ${entry.title}`,
    slug: `${entry.slug}-${targetLocale}`,
    excerpt: `[AI Translated — ${targetLocale}] ${entry.excerpt}`,
    body: entry.body.map((b) => ({ ...b, props: { ...b.props, content: typeof b.props.content === "string" ? `[${targetLocale.toUpperCase()}] ${b.props.content}` : b.props.content } })),
    seo: { metaTitle: `[${targetLocale.toUpperCase()}] ${entry.seo.metaTitle || entry.title}`, metaDescription: `[${targetLocale.toUpperCase()}] ${entry.seo.metaDescription || entry.excerpt}` },
    translatedAt: Date.now(),
    translatedBy: translator,
    reviewed: false,
  };
  const all = getLocalizations(entry.id);
  all.push(loc);
  try { localStorage.setItem(`${CP_STORAGE_KEY}_loc_${entry.id}`, JSON.stringify(all)); } catch { /* quota */ }
  pushLog("info", "system", `AI Translation: ${entry.title} → ${targetLocale}`);
  return loc;
}

/* ================================================================== */
/*  MODULE 7 — CONTENT SEARCH & DISCOVERY                              */
/* ================================================================== */

export function searchContent(entries: ContentEntry[], query: string, filters?: { type?: ContentType; category?: string; status?: ContentStatus; tag?: string; locale?: string }): ContentEntry[] {
  const q = query.toLowerCase().trim();
  let results = entries;
  if (q) {
    results = results.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.excerpt.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.categoryId.toLowerCase().includes(q)
    );
  }
  if (filters?.type) results = results.filter((e) => e.type === filters.type);
  if (filters?.category) results = results.filter((e) => e.categoryId === filters.category);
  if (filters?.status) results = results.filter((e) => e.status === filters.status);
  if (filters?.tag) results = results.filter((e) => e.tags.includes(filters.tag!));
  if (filters?.locale) results = results.filter((e) => e.locale === filters.locale);
  return results.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getTrendingContent(entries: ContentEntry[], count = 6): ContentEntry[] {
  return entries.filter((e) => e.status === "published").sort(() => Math.random() - 0.5).slice(0, count);
}

export function getPopularContent(entries: ContentEntry[], count = 6): ContentEntry[] {
  return entries.filter((e) => e.status === "published").sort((a, b) => (b.settings.featured ? 1 : 0) - (a.settings.featured ? 1 : 0)).slice(0, count);
}

export function getFeaturedContent(entries: ContentEntry[]): ContentEntry[] {
  return entries.filter((e) => e.status === "published" && e.settings.featured);
}

/* ================================================================== */
/*  MODULE 8 — CONTENT SCHEDULING                                      */
/* ================================================================== */

export function getSchedules(): PublishingSchedule[] { return load(CP_CALENDAR_KEY, []); }

export function getEditorialCalendar(): { date: number; entries: { entryId: string; title: string; type: ContentType; status: string }[] }[] {
  const schedules = getSchedules().filter((s) => s.scheduledAt > Date.now() - 86400000);
  const grouped: Record<string, { entryId: string; title: string; type: ContentType; status: string }[]> = {};
  schedules.forEach((s) => {
    const day = new Date(s.scheduledAt).toDateString();
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({ entryId: s.entryId, title: s.entryTitle, type: s.entryType, status: s.status });
  });
  return Object.entries(grouped).map(([date, entries]) => ({ date: new Date(date).getTime(), entries }));
}

/* ================================================================== */
/*  MODULE 9 — CONTENT REPORTS & FORECASTING                           */
/* ================================================================== */

export function generateContentReport(entries: ContentEntry[], from: number, to: number, type: ContentReport["type"]): ContentReport {
  const filtered = entries.filter((e) => e.createdAt >= from && e.createdAt <= to);
  const metrics: Record<string, number> = {};
  switch (type) {
    case "editorial":
      metrics.totalEntries = filtered.length;
      metrics.published = filtered.filter((e) => e.status === "published").length;
      metrics.drafts = filtered.filter((e) => e.status === "draft").length;
      metrics.scheduled = filtered.filter((e) => e.status === "scheduled").length;
      metrics.archived = filtered.filter((e) => e.status === "archived").length;
      metrics.avgBlocks = filtered.length ? Math.round(filtered.reduce((s, e) => s + e.body.length, 0) / filtered.length) : 0;
      break;
    case "seo":
      const audits = filtered.map((e) => auditSeo(e));
      metrics.avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length) : 0;
      metrics.needAttention = audits.filter((a) => a.score < 70).length;
      metrics.passRate = audits.length ? Math.round((audits.filter((a) => a.score >= 70).length / audits.length) * 100) : 0;
      break;
    case "author":
      const authors = getAuthors();
      authors.forEach((a) => { metrics[`author_${a.id}_count`] = a.stats.articlesCount; });
      metrics.totalAuthors = authors.length;
      metrics.activeAuthors = authors.filter((a) => a.status === "active").length;
      break;
    case "publishing":
      const schedules = getSchedules();
      metrics.scheduled = schedules.filter((s) => s.status === "pending").length;
      metrics.published = schedules.filter((s) => s.status === "published").length;
      metrics.failed = schedules.filter((s) => s.status === "failed").length;
      break;
    case "performance":
      metrics.totalViews = rnd(5000, 50000);
      metrics.avgEngagement = rnd(30, 80);
      metrics.bounceRate = rnd(20, 60);
      break;
    case "ai":
      const aiHistory = getAiContentHistory();
      metrics.totalTasks = aiHistory.length;
      const typeCounts: Record<string, number> = {};
      aiHistory.forEach((r: AiContentRequest) => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
      Object.entries(typeCounts).forEach(([k, v]) => { metrics[`ai_${k}`] = v; });
      break;
  }
  const report: ContentReport = { id: uid("crpt"), type, name: `${type} Report`, period: { from, to }, metrics, generatedAt: Date.now() };
  return report;
}

export function generateContentForecast(entries: ContentEntry[], type: ContentForecast["type"]): ContentForecast {
  const baseValue = type === "views" ? entries.reduce((s, e) => s + (e.body.length * 100), 0) : type === "engagement" ? entries.reduce((s, e) => s + (e.status === "published" ? 75 : 20), 0) / Math.max(1, entries.length) : entries.length * 2;
  const periods = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label, i) => {
    const growth = 1 + (i * 0.08) + (Math.random() - 0.5) * 0.1;
    const predicted = Math.round(baseValue * growth);
    const margin = Math.round(predicted * 0.15);
    return { label, predicted, lower: predicted - margin, upper: predicted + margin };
  });
  return { id: uid("cf"), type, metric: type === "views" ? "Page Views" : type === "engagement" ? "Avg Engagement Score" : "Content Output", periods, confidence: 78 + rnd(0, 15), generatedAt: Date.now() };
}

/* ================================================================== */
/*  DASHBOARD STATS                                                    */
/* ================================================================== */

export function getContentPlatformDashboard() {
  const entries = getContentEntries();
  const authors = getAuthors();
  const schedules = getSchedules();
  const published = entries.filter((e) => e.status === "published").length;
  const drafts = entries.filter((e) => e.status === "draft").length;
  const scheduled = entries.filter((e) => e.status === "scheduled").length;
  const archived = entries.filter((e) => e.status === "archived").length;
  const upcomingschedules = getEditorialCalendar();
  return {
    totalEntries: entries.length,
    published,
    drafts,
    scheduled,
    archived,
    totalAuthors: authors.length,
    activeAuthors: authors.filter((a) => a.status === "active").length,
    pendingSchedules: schedules.filter((s) => s.status === "pending").length,
    upcomingSchedules: upcomingschedules.slice(0, 5),
    categories: getCategories().length,
    tags: getTags().length,
  };
}
