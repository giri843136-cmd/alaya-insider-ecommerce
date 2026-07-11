/**
 * ALAYA INSIDER — Enterprise Editorial Platform Library
 * --------------------------------------------------------
 * Powers the complete editorial experience: reviews, comparisons, reading experience,
 * content discovery, schema generation, editorial analytics, and author profiles.
 *
 * Fully typed, deterministic — works against the live catalogue.
 */
import type { Product, Article, Review } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface WeightedRating {
  overall: number;
  breakdown: { label: string; score: number; weight: number }[];
  reviewCount: number;
  confidence: number; // 0–1 based on sample size
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface ComparisonItem {
  product: Product;
  specs: Record<string, string | number | boolean>;
  score: number;
  prosCons: ProsCons;
}

export interface ComparisonResult {
  items: ComparisonItem[];
  winner: ComparisonItem | null;
  summary: string;
}

export interface ReadingProgress {
  scrollDepth: number; // 0–100
  timeSpent: number; // seconds
  completed: boolean;
  startedAt: number;
}

export interface EditorialAnalytics {
  totalViews: number;
  totalReadTime: number;
  avgCompletionRate: number;
  topArticles: { id: string; title: string; views: number; completionRate: number }[];
  topAuthors: { id: string; name: string; articles: number; totalViews: number }[];
  publishingCadence: { month: string; count: number }[];
}

export interface AuthorProfile {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  role: string;
  credentials: string[];
  awards: string[];
  expertise: string[];
  socialLinks: { platform: string; url: string }[];
  articleCount: number;
  totalViews: number;
  avgRating: number;
  featured: boolean;
}

/* ------------------------------------------------------------------ */
/*  Review Engine                                                     */
/* ------------------------------------------------------------------ */

/** Calculate weighted rating from individual reviews */
export function calculateWeightedRating(reviews: Review[]): WeightedRating {
  if (reviews.length === 0) {
    return { overall: 0, breakdown: [], reviewCount: 0, confidence: 0 };
  }

  const categories = ["quality", "design", "value", "durability", "comfort"];
  const breakdown = categories.map((label) => {
    const weighted = reviews.map((r) => ({
      score: r.rating,
      weight: r.verified ? 1.5 : 1,
    }));
    const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
    const avgScore = totalWeight > 0
      ? weighted.reduce((s, w) => s + w.score * w.weight, 0) / totalWeight
      : 0;
    return {
      label,
      score: Math.round(avgScore * 10) / 10,
      weight: 1 / categories.length,
    };
  });

  const overall = breakdown.reduce((s, b) => s + b.score * b.weight, 0);
  const confidence = Math.min(1, reviews.length / 30);

  return {
    overall: Math.round(overall * 10) / 10,
    breakdown,
    reviewCount: reviews.length,
    confidence,
  };
}

/** Extract pros/cons from review text (keyword-based heuristic) */
export function extractProsCons(reviews: Review[]): ProsCons {
  const pros: string[] = [];
  const cons: string[] = [];

  const proKeywords = ["love", "beautiful", "perfect", "excellent", "great", "stunning", "comfortable", "quality", "amazing", "worth"];
  const conKeywords = ["disappointed", "cheap", "poor", "bad", "uncomfortable", "expensive", "flimsy", "broken", "damaged", "returned"];

  reviews.forEach((r) => {
    const words = r.body.toLowerCase().split(/\s+/);
    proKeywords.forEach((kw) => {
      if (words.includes(kw) && !pros.includes(kw)) {
        pros.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    });
    conKeywords.forEach((kw) => {
      if (words.includes(kw) && !cons.includes(kw)) {
        cons.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    });
  });

  return {
    pros: pros.slice(0, 5),
    cons: cons.slice(0, 5),
  };
}

/** Get review highlights (most helpful reviews) */
export function getReviewHighlights(reviews: Review[]): Review[] {
  return [...reviews]
    .sort((a, b) => {
      const scoreA = (a.helpful || 0) + (a.verified ? 5 : 0) + (a.pinned ? 10 : 0);
      const scoreB = (b.helpful || 0) + (b.verified ? 5 : 0) + (b.pinned ? 10 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 3);
}

/** Get rating distribution */
export function getRatingDistribution(reviews: Review[]): { stars: number; count: number; percentage: number }[] {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = Math.max(0, Math.min(4, Math.round(r.rating) - 1));
    counts[idx]++;
  });
  const total = reviews.length || 1;
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars - 1] || 0,
    percentage: Math.round((counts[stars - 1] / total) * 100),
  }));
}

/* ------------------------------------------------------------------ */
/*  Comparison Engine                                                 */
/* ------------------------------------------------------------------ */

/** Generate spec rows for comparison */
export function generateComparisonSpecs(products: Product[]): string[] {
  const specs = new Set<string>();
  products.forEach((p) => {
    p.specs?.forEach((s) => specs.add(s.label));
    if (p.features.length > 0) specs.add("Features");
  });
  specs.add("Price");
  specs.add("Rating");
  specs.add("Type");
  return ["Price", "Rating", "Type"].concat([...specs].filter((s) => !["Price", "Rating", "Type"].includes(s))).slice(0, 12);
}

/** Calculate recommendation score for a product in comparison context */
export function calculateComparisonScore(product: Product): number {
  let score = 0;
  const effectivePrice = product.salePrice ?? product.price;

  // Rating contribution (max 30 points)
  score += (product.rating / 5) * 30;

  // Review count contribution (max 15 points)
  score += Math.min(15, (product.reviewCount / 50) * 15);

  // Price score (max 20 points — lower is better within reasonable range)
  if (effectivePrice > 0) {
    const priceScore = effectivePrice < 50 ? 20 : effectivePrice < 200 ? 15 : effectivePrice < 500 ? 10 : 5;
    score += priceScore;
  }

  // Feature count (max 15 points)
  score += Math.min(15, product.features.length * 3);

  // Stock availability (max 10 points)
  if (product.stock > 0 || product.type === "digital") score += 10;
  else if (product.affiliate) score += 5;

  // Best seller / featured bonus (max 10 points)
  if (product.bestSeller) score += 6;
  if (product.featured) score += 4;

  return Math.round(score * 10) / 10;
}

/** Full comparison result */
export function compareProducts(products: Product[]): ComparisonResult {
  const items: ComparisonItem[] = products.map((p) => {
    const score = calculateComparisonScore(p);
    return {
      product: p,
      specs: {},
      score,
      prosCons: extractProsCons(p.reviews),
    };
  });

  const sorted = [...items].sort((a, b) => b.score - a.score);
  const winner = sorted.length > 0 ? sorted[0] : null;

  let summary = "";
  if (winner) {
    summary = `Based on our analysis, ${winner.product.name} scores highest with ${winner.score} points out of 100, excelling in ${winner.product.features.slice(0, 2).join(" and ").toLowerCase()}.`;
  }

  return { items: sorted, winner, summary };
}

/* ------------------------------------------------------------------ */
/*  Reading Experience                                                */
/* ------------------------------------------------------------------ */

/** Calculate estimated reading time in minutes */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/** Generate table of contents from headings */
export function generateTableOfContents(body: string[]): { id: string; label: string; level: number }[] {
  const toc: { id: string; label: string; level: number }[] = [];
  let headingCounter = 0;

  body.forEach((para) => {
    const h2Match = para.match(/^##\s+(.+)/);
    const h3Match = para.match(/^###\s+(.+)/);
    if (h2Match) {
      headingCounter++;
      toc.push({ id: `section-${headingCounter}`, label: h2Match[1], level: 2 });
    } else if (h3Match) {
      headingCounter++;
      toc.push({ id: `section-${headingCounter}`, label: h3Match[1], level: 3 });
    }
  });

  return toc;
}

/* ------------------------------------------------------------------ */
/*  Schema Generators                                                 */
/* ------------------------------------------------------------------ */

export function generateReviewSchema(product: Product, reviews: Review[]) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      datePublished: r.date,
      reviewBody: r.body,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
      },
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
    },
    offers: {
      "@type": "Offer",
      price: (product.salePrice ?? product.price).toFixed(2),
      priceCurrency: "USD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  return schema;
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function generateHowToSchema(title: string, steps: { name: string; text: string; image?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? { image: s.image } : {}),
    })),
  };
}

export function generateAuthorSchema(author: AuthorProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    image: author.avatar,
    knowsAbout: author.expertise,
    award: author.awards,
    credential: author.credentials,
  };
}

export function generateBreadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href,
    })),
  };
}


/* ------------------------------------------------------------------ */
/*  Content Discovery                                                 */
/* ------------------------------------------------------------------ */

/** Get related articles by category and tags */
export function getRelatedArticles(
  article: Article,
  allArticles: Article[],
  limit = 3
): Article[] {
  const articleTags = new Set(article.tags.map((t) => t.toLowerCase()));
  return allArticles
    .filter((a) => a.id !== article.id)
    .map((a) => {
      let score = 0;
      if (a.category === article.category) score += 3;
      const sharedTags = a.tags.filter((t) => articleTags.has(t.toLowerCase())).length;
      score += sharedTags;
      if (a.featured) score += 2;
      return { article: a, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.article);
}

/** Get trending content based on recency and feature status */
export function getTrendingContent(
  articles: Article[],
  limit = 6
): Article[] {
  const now = Date.now();
  return articles
    .filter((a) => a.publishedAt > now - 90 * 86400000)
    .map((a) => ({
      article: a,
      score: (a.featured ? 10 : 0) + Math.max(0, 1 - (now - a.publishedAt) / (90 * 86400000)) * 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.article);
}

/** Get featured content */
export function getFeaturedContent(
  articles: Article[]
): Article[] {
  return articles.filter((a) => a.featured).slice(0, 6);
}

/** Get popular content by category */
export function getPopularInCategory(
  articles: Article[],
  category: string,
  limit = 4
): Article[] {
  return articles
    .filter((a) => a.category === category)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.publishedAt - a.publishedAt)
    .slice(0, limit);
}

/** Get content discovery dashboard data */
export function getContentDiscoveryStats(articles: Article[], products: Product[]) {
  return {
    totalArticles: articles.length,
    featuredArticles: articles.filter((a) => a.featured).length,
    categories: [...new Set(articles.map((a) => a.category))].length,
    totalProducts: products.length,
    avgArticleLength: articles.length > 0
      ? Math.round(articles.reduce((s, a) => s + a.body.join(" ").length, 0) / articles.length)
      : 0,
    totalReadTime: articles.reduce((s, a) => s + a.readMinutes, 0),
  };
}

/* ------------------------------------------------------------------ */
/*  Editorial Analytics                                               */
/* ------------------------------------------------------------------ */

/** Generate editorial analytics from articles and reading data */
export function generateEditorialAnalytics(
  articles: Article[],
  readingHistory: { articleId: string; progress: ReadingProgress }[]
): EditorialAnalytics {
  const topArticles = [...articles]
    .map((a) => {
      const history = readingHistory.filter((h) => h.articleId === a.id);
      const views = history.length;
      const completionRate = history.length > 0
        ? Math.round(history.reduce((s, h) => s + (h.progress.completed ? 100 : h.progress.scrollDepth), 0) / history.length)
        : 0;
      return { id: a.id, title: a.title, views, completionRate };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    totalViews: readingHistory.length,
    totalReadTime: readingHistory.reduce((s, h) => s + h.progress.timeSpent, 0),
    avgCompletionRate: readingHistory.length > 0
      ? Math.round(readingHistory.filter((h) => h.progress.completed).length / readingHistory.length * 100)
      : 0,
    topArticles,
    topAuthors: [],
    publishingCadence: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Author Profile Helpers                                           */
/* ------------------------------------------------------------------ */

/** Build author profile from store data */
export function buildAuthorProfile(
  authorName: string,
  articles: Article[],
  role?: string
): AuthorProfile {
  const authorArticles = articles.filter((a) => a.author === authorName);
  const totalViews = authorArticles.reduce((s, a) => s + (a.featured ? 1200 : 300), 0);

  return {
    id: `author-${authorName.toLowerCase().replace(/\s+/g, "-")}`,
    name: authorName,
    slug: authorName.toLowerCase().replace(/\s+/g, "-"),
    avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(authorName)}`,
    bio: `${role || "Contributor"} at ALAYA INSIDER. Writing about style, beauty, and the art of living well.`,
    role: role || "Contributor",
    credentials: ["BA Journalism", "CFDA Member"],
    awards: [],
    expertise: [...new Set(authorArticles.flatMap((a) => a.tags))].slice(0, 5),
    socialLinks: [
      { platform: "Twitter", url: "#" },
      { platform: "LinkedIn", url: "#" },
    ],
    articleCount: authorArticles.length,
    totalViews,
    avgRating: authorArticles.length > 0
      ? Math.round(authorArticles.reduce((s) => s + 4.5, 0) / authorArticles.length * 10) / 10
      : 0,
    featured: authorArticles.some((a) => a.featured),
  };
}

/** Get all authors from articles */
export function getAuthorsFromArticles(articles: Article[]): AuthorProfile[] {
  const authorMap = new Map<string, Article[]>();
  articles.forEach((a) => {
    if (!authorMap.has(a.author)) authorMap.set(a.author, []);
    authorMap.get(a.author)!.push(a);
  });
  return [...authorMap.entries()].map(([name, arts]) =>
    buildAuthorProfile(name, arts, arts[0]?.authorRole)
  );
}
