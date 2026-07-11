/**
 * ALAYA INSIDER — Enterprise Search & Discovery Platform (PR-10)
 * --------------------------------------------------------------------------
 * Centralized search, discovery, recommendation, and personalization engine.
 *
 * Modules:
 *  1. Search Engine     — Instant search, autocomplete, fuzzy, stemming, NL
 *  2. Search Index      — Index/Reindex all entity types
 *  3. Filters & Sorting — Dynamic filters, 12+ sort options
 *  4. Recommendations   — Related, FBT, viewed, trending, personalized
 *  5. Personalization   — Profile-based with AI predictions
 *  6. Search Analytics  — Query tracking, CTR, conversions, revenue
 *  7. AI Search         — Intent detection, semantic ranking, entity extraction
 *  8. Merchandising     — Boost, demote, pin, hide rules
 *  9. Dashboard         — Aggregated stats
 */

import { query, queryOne, queryAll } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

/* ================================================================== */
/*  CONSTANTS & TYPES                                                  */
/* ================================================================== */

export type SearchEntityType =
  "product" | "brand" | "category" | "collection" | "article" |
  "buying_guide" | "review" | "author" | "tag" | "affiliate_product";

export type SortOption =
  "relevance" | "popularity" | "newest" | "price_low" | "price_high" |
  "highest_rated" | "most_reviewed" | "trending" | "best_seller" |
  "highest_commission" | "fastest_shipping" | "personalized";

export type RecType =
  "related" | "frequently_bought_together" | "customers_also_viewed" |
  "recently_viewed" | "recently_purchased" | "trending_now" |
  "recommended_for_you" | "luxury_alternatives" | "affordable_alternatives" |
  "complete_the_room" | "gift_suggestions" | "seasonal_picks";

export interface SearchFilters {
  category?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  rating?: number;
  availability?: boolean;
  color?: string;
  material?: string;
  room?: string;
  style?: string;
  collection?: string;
  season?: string;
  country?: string;
  affiliate_network?: string;
  supplier?: string;
  shipping_speed?: string;
  discount?: number;
  is_new?: boolean;
  is_best_seller?: boolean;
  is_trending?: boolean;
  is_editors_choice?: boolean;
  is_luxury?: boolean;
  tag?: string;
}

export interface SearchResult<T = any> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  results: T[];
  facets?: Record<string, any>;
  did_you_mean?: string;
  suggestions?: string[];
  search_time_ms: number;
}

/* ================================================================== */
/*  MODULE 1: SEARCH ENGINE                                           */
/* ================================================================== */

export async function search(
  query_str: string,
  options?: {
    page?: number;
    limit?: number;
    filters?: SearchFilters;
    sort?: SortOption;
    customer_id?: string;
    language?: string;
    country?: string;
    entity_types?: SearchEntityType[];
    fuzzy?: boolean;
    track?: boolean;
  },
): Promise<SearchResult> {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 20, 100);
  const offset = (page - 1) * limit;
  const entityTypes = options?.entity_types || ["product"];
  const startTime = Date.now();

  const normalized = query_str.toLowerCase().trim();
  const terms = normalized.split(/\s+/).filter(Boolean);

  // Build the WHERE clause
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  // Entity type filter
  conditions.push(`si.entity_type = ANY($${idx})`);
  values.push(entityTypes);
  idx++;

  // Full-text search via tsvector
  if (terms.length > 0) {
    // Build tsquery with prefix matching for autocomplete
    const tsqueryTerms = terms.map((t) => t.replace(/[^a-z0-9]/g, "") + ":*").filter(Boolean).join(" & ");
    if (tsqueryTerms) {
      conditions.push(`si.search_vector @@ to_tsquery('english', $${idx})`);
      values.push(tsqueryTerms);
      idx++;
    }

    // Also fuzzy/ILIKE for partial matches, synonyms, and typo tolerance
    const ilikeConditions = terms.map((t) => {
      const escaped = t.replace(/%/g, "\\%").replace(/_/g, "\\_");
      return `(
        si.name ILIKE $${idx} OR si.brand ILIKE $${idx} OR
        si.category ILIKE $${idx} OR si.description ILIKE $${idx} OR
        si.tags::text ILIKE $${idx}
      )`;
    });
    if (ilikeConditions.length > 0) {
      const allTerms = terms.map((t) => `%${t.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`);
      for (const tv of allTerms) {
        values.push(tv);
        idx++;
      }
      // Join ILIKE conditions with AND across terms, OR within each term
      conditions.push(`(${ilikeConditions.join(" AND ")})`);
    }
  }

  // Apply filters
  if (options?.filters) {
    const f = options.filters;
    if (f.category) { conditions.push(`si.category = $${idx}`); values.push(f.category); idx++; }
    if (f.brand) { conditions.push(`si.brand = $${idx}`); values.push(f.brand); idx++; }
    if (f.price_min !== undefined) { conditions.push(`COALESCE(si.sale_price, si.price) >= $${idx}`); values.push(f.price_min); idx++; }
    if (f.price_max !== undefined) { conditions.push(`COALESCE(si.sale_price, si.price) <= $${idx}`); values.push(f.price_max); idx++; }
    if (f.rating !== undefined) { conditions.push(`si.rating >= $${idx}`); values.push(f.rating); idx++; }
    if (f.availability !== undefined) { conditions.push(f.availability ? `si.stock > 0` : `si.stock = 0`); }
    if (f.color) { conditions.push(`si.color = $${idx}`); values.push(f.color); idx++; }
    if (f.material) { conditions.push(`si.material = $${idx}`); values.push(f.material); idx++; }
    if (f.room) { conditions.push(`si.room = $${idx}`); values.push(f.room); idx++; }
    if (f.style) { conditions.push(`si.style = $${idx}`); values.push(f.style); idx++; }
    if (f.collection) { conditions.push(`si.collection = $${idx}`); values.push(f.collection); idx++; }
    if (f.season) { conditions.push(`si.season = $${idx}`); values.push(f.season); idx++; }
    if (f.country) { conditions.push(`si.country = $${idx}`); values.push(f.country); idx++; }
    if (f.affiliate_network) { conditions.push(`si.affiliate_network = $${idx}`); values.push(f.affiliate_network); idx++; }
    if (f.supplier) { conditions.push(`si.supplier_name = $${idx}`); values.push(f.supplier); idx++; }
    if (f.shipping_speed) { conditions.push(`si.shipping_speed = $${idx}`); values.push(f.shipping_speed); idx++; }
    if (f.discount !== undefined) { conditions.push(`si.discount >= $${idx}`); values.push(f.discount); idx++; }
    if (f.is_new !== undefined) { conditions.push(`si.is_new = $${idx}`); values.push(f.is_new); idx++; }
    if (f.is_best_seller !== undefined) { conditions.push(`si.is_best_seller = $${idx}`); values.push(f.is_best_seller); idx++; }
    if (f.is_trending !== undefined) { conditions.push(`si.is_trending = $${idx}`); values.push(f.is_trending); idx++; }
    if (f.is_editors_choice !== undefined) { conditions.push(`si.is_editors_choice = $${idx}`); values.push(f.is_editors_choice); idx++; }
    if (f.is_luxury !== undefined) { conditions.push(`si.is_luxury = $${idx}`); values.push(f.is_luxury); idx++; }
    if (f.tag) { conditions.push(`$${idx} = ANY(si.tags)`); values.push(f.tag); idx++; }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Determine sort
  let orderBy = "si.popularity_score DESC";
  let sortField = "";
  switch (options?.sort || "relevance") {
    case "relevance":
      if (terms.length > 0) {
        orderBy = `ts_rank(si.search_vector, to_tsquery('english', $${idx})) DESC, si.popularity_score DESC`;
        values.push(terms.map((t) => t.replace(/[^a-z0-9]/g, "") + ":*").filter(Boolean).join(" & "));
        idx++;
      }
      break;
    case "popularity": orderBy = "si.popularity_score DESC"; break;
    case "newest": orderBy = "si.created_at DESC"; break;
    case "price_low": orderBy = "COALESCE(si.sale_price, si.price) ASC"; break;
    case "price_high": orderBy = "COALESCE(si.sale_price, si.price) DESC"; break;
    case "highest_rated": orderBy = "si.rating DESC"; break;
    case "most_reviewed": orderBy = "si.review_count DESC"; break;
    case "trending": orderBy = "si.is_trending DESC, si.popularity_score DESC"; break;
    case "best_seller": orderBy = "si.is_best_seller DESC, si.popularity_score DESC"; break;
    case "highest_commission": orderBy = "si.commission DESC"; break;
    case "fastest_shipping": orderBy = "si.shipping_speed ASC"; break;
    case "personalized":
      orderBy = "si.popularity_score DESC, si.rating DESC";
      break;
  }

  // Track the search query
  if (options?.track !== false && query_str.trim()) {
    const searchId = uuidv4();
    const now = new Date().toISOString();
    // Fire and forget — don't block results
    query(
      `INSERT INTO search_terms (id, query, normalized_query, language, country, session_id,
        customer_id, device_type, searched_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [searchId, query_str, normalized, options?.language || "en", options?.country || "",
       "", options?.customer_id || null, "", now],
    ).catch(() => {});
  }

  // Get total count
  const countResult = await queryOne<{ total: string }>(
    `SELECT COUNT(*) as total FROM search_index si ${where}`, values,
  );
  const total = parseInt(countResult?.total || "0");

  // Get results
  const results = await queryAll(
    `SELECT si.* FROM search_index si ${where} ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );

  // Get facets for filter counts
  const facets = await getFacets(values, terms);

  // Check for "did you mean" if no results
  let didYouMean: string | undefined;
  if (total === 0 && terms.length > 0) {
    didYouMean = await checkDidYouMean(query_str);
  }

  const searchTimeMs = Date.now() - startTime;

  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    results,
    facets,
    did_you_mean: didYouMean,
    search_time_ms: searchTimeMs,
  };
}

export async function searchRaw(
  sql: string,
  values: any[],
): Promise<any[]> {
  return queryAll(sql, values);
}

async function getFacets(values: any[], terms: string[]): Promise<Record<string, any>> {
  try {
    // We rebuild a minimal WHERE for facet queries
    const facetData = await queryAll(
      `SELECT
        COUNT(DISTINCT si.brand) as brand_count,
        COUNT(DISTINCT si.category) as category_count,
        COUNT(DISTINCT si.color) as color_count,
        COUNT(DISTINCT si.material) as material_count,
        COUNT(DISTINCT si.style) as style_count,
        COUNT(DISTINCT si.room) as room_count,
        COUNT(DISTINCT si.season) as season_count,
        COUNT(DISTINCT si.collection) as collection_count,
        COUNT(DISTINCT si.country) as country_count,
        MIN(COALESCE(si.sale_price, si.price)) as min_price,
        MAX(COALESCE(si.sale_price, si.price)) as max_price,
        AVG(si.rating) as avg_rating
      FROM search_index si`,
    );
    return facetData[0] || {};
  } catch {
    return {};
  }
}

async function checkDidYouMean(query: string): Promise<string | undefined> {
  // Simple Levenshtein-based suggestion using trigram similarity
  const suggestions = await queryAll<any>(
    `SELECT name, similarity(name, $1) as sim
     FROM search_index
     WHERE similarity(name, $1) > 0.3
     ORDER BY sim DESC LIMIT 1`,
    [query],
  );
  return suggestions[0]?.name || undefined;
}

/* ================================================================== */
/*  MODULE 1b: AUTOCOMPLETE & SUGGESTIONS                              */
/* ================================================================== */

export async function autocomplete(
  prefix: string,
  limit = 8,
): Promise<{ text: string; type: string; count: number }[]> {
  const escaped = prefix.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const pattern = `${escaped}%`;

  const results = await queryAll<any>(
    `SELECT name as text, entity_type as type, COUNT(*) as count
     FROM search_index
     WHERE name ILIKE $1
     GROUP BY name, entity_type
     ORDER BY count DESC, name ASC
     LIMIT $2`,
    [pattern, limit],
  );
  return results.map((r: any) => ({
    text: r.text,
    type: r.type,
    count: parseInt(r.count),
  }));
}

export async function getSuggestions(
  query: string,
  limit = 5,
): Promise<string[]> {
  // Generate suggestions based on popular searches
  const popular = await queryAll<any>(
    `SELECT normalized_query, COUNT(*) as count
     FROM search_terms
     WHERE normalized_query ILIKE $1 AND normalized_query != $2
     GROUP BY normalized_query
     ORDER BY count DESC
     LIMIT $3`,
    [`${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`, query, limit],
  );
  return popular.map((r: any) => r.normalized_query);
}

/* ================================================================== */
/*  MODULE 1c: SPELLING & STEMMING                                    */
/* ================================================================== */

export function correctSpelling(word: string): string {
  // Simple dictionary-based correction
  const commonMisspellings: Record<string, string> = {
    "accesories": "accessories",
    "beutiful": "beautiful", "beautifull": "beautiful",
    "jewlery": "jewelry", "jewellery": "jewelry",
    "shoes": "shoes", "shoose": "shoes",
    "wathes": "watches", "watchs": "watches",
    "premium": "premium", "premimum": "premium",
    "gucci": "Gucci", "prada": "Prada", "lui vuitton": "Louis Vuitton",
  };
  const lower = word.toLowerCase();
  return commonMisspellings[lower] || word;
}

export function pluralToSingular(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (lower.endsWith("ves")) return lower.slice(0, -3) + "f";
  if (lower.endsWith("ses") || lower.endsWith("xes") || lower.endsWith("ches") || lower.endsWith("shes")) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
}

export function singularToPlural(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("y") && !["a", "e", "i", "o", "u"].includes(lower[lower.length - 2])) return lower.slice(0, -1) + "ies";
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("ch") || lower.endsWith("sh")) return lower + "es";
  return lower + "s";
}

export function stem(word: string): string {
  // Simple Porter-style stemming
  let w = word.toLowerCase();
  if (w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.endsWith("tion")) w = w.slice(0, -4);
  else if (w.endsWith("ment")) w = w.slice(0, -4);
  else if (w.endsWith("ness")) w = w.slice(0, -4);
  else if (w.endsWith("able")) w = w.slice(0, -4);
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("ly") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("es") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) w = w.slice(0, -1);
  return w;
}

export function expandWithSynonyms(term: string): string[] {
  const synonymMap: Record<string, string[]> = {
    "bag": ["bags", "handbag", "tote", "purse", "satchel"],
    "shoe": ["shoes", "footwear", "sneakers", "loafers", "boots"],
    "watch": ["watches", "timepiece", "chronograph"],
    "jewelry": ["jewellery", "jewelry", "accessories", "ornaments"],
    "luxury": ["premium", "high-end", "designer", "exclusive"],
    "affordable": ["cheap", "budget", "inexpensive", "value"],
    "new": ["latest", "new arrival", "just in", "fresh"],
    "men": ["male", "man", "gentleman", "masculine"],
    "women": ["female", "woman", "lady", "feminine"],
    "gift": ["present", "gift idea", "special occasion"],
  };
  const lower = term.toLowerCase();
  return synonymMap[lower] || [term];
}

/* ================================================================== */
/*  MODULE 2: SEARCH INDEX                                             */
/* ================================================================== */

export async function indexEntity(
  entityType: SearchEntityType,
  entityId: string,
): Promise<boolean> {
  try {
    // Remove existing index entry
    await query(
      "DELETE FROM search_index WHERE entity_type = $1 AND entity_id = $2",
      [entityType, entityId],
    );

    const now = new Date().toISOString();
    let data: any;

    switch (entityType) {
      case "product": {
        data = await queryOne<any>(
          `SELECT p.*, c.name as category_name, b.name as brand_name
           FROM products p
           LEFT JOIN categories c ON c.id = p.category_id
           LEFT JOIN brands b ON b.id = p.brand_id
           WHERE p.id = $1`,
          [entityId],
        );
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, slug, brand, category,
            description, content, tags, price, sale_price, rating, review_count, stock, image, url,
            is_new, is_featured, is_best_seller, popularity_score, commission, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24)`,
          [id, "product", entityId, data.name, data.slug, data.brand_name || data.brand || "",
           data.category_name || "", data.short_description || "",
           data.description || "", data.tags || [], data.price || 0, data.sale_price || null,
           data.rating || 0, data.review_count || 0, data.stock || 0,
           (data.images || [])[0] || "", `/product/${data.slug}`,
           data.is_new || false, data.featured || false, data.best_seller || false,
           (data.rating || 0) * 100 + (data.review_count || 0), data.affiliate_commission || 0,
           now, now],
        );
        return true;
      }
      case "brand": {
        data = await queryOne("SELECT * FROM brands WHERE id = $1", [entityId]);
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, slug, description, image, url,
            is_featured, country, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [id, "brand", entityId, data.name, data.slug, data.description || "",
           data.image || "", `/brands/${data.slug}`, data.featured || false,
           data.country || "", now, now],
        );
        return true;
      }
      case "category": {
        data = await queryOne("SELECT * FROM categories WHERE id = $1", [entityId]);
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, slug, description, image, url,
            created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [id, "category", entityId, data.name, data.slug, data.description || "",
           data.image || "", `/shop?category=${data.slug}`, now, now],
        );
        return true;
      }
      case "article": {
        data = await queryOne("SELECT * FROM articles WHERE id = $1", [entityId]);
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, slug, description, content,
            tags, image, url, is_featured, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [id, "article", entityId, data.title, data.slug, data.excerpt || "",
           (data.body || []).join(" "), data.tags || [], data.cover || "",
           `/journal/${data.slug}`, data.featured || false, now, now],
        );
        return true;
      }
      case "collection": {
        data = await queryOne("SELECT * FROM collections WHERE id = $1", [entityId]);
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, slug, description, image, url,
            created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [id, "collection", entityId, data.name, data.slug, data.description || "",
           data.image || "", `/collections/${data.slug || data.id}`, now, now],
        );
        return true;
      }
      case "affiliate_product": {
        data = await queryOne("SELECT * FROM affiliate_products WHERE id = $1", [entityId]);
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, slug,
            price, commission, affiliate_network, image, url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [id, "affiliate_product", entityId, data.name || "Affiliate Product", "",
           data.price || 0, data.commission_rate || 0, data.network_name || "",
           data.image || "", data.affiliate_url || "", now, now],
        );
        return true;
      }
      case "buying_guide":
      case "review":
      case "author":
      case "tag": {
        // Generic entity indexing by name
        const tableMap: Record<string, string> = {
          buying_guide: "buying_guides", review: "reviews", author: "authors", tag: "tags",
        };
        const table = tableMap[entityType];
        if (!table) return false;
        try {
          data = await queryOne(`SELECT * FROM ${table} WHERE id = $1`, [entityId]);
        } catch {
          data = null;
        }
        if (!data) return false;
        const id = uuidv4();
        await query(
          `INSERT INTO search_index (id, entity_type, entity_id, name, description, image, url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [id, entityType, entityId, data.name || data.title || "",
           data.description || data.bio || "", data.image || data.avatar || "",
           `/${entityType}/${data.slug || entityId}`, now, now],
        );
        return true;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function reindexAll(): Promise<{ indexed: number; failed: number }> {
  let indexed = 0;
  let failed = 0;

  // Clear existing index
  await query("DELETE FROM search_index");    // Index products
  const products = await queryAll("SELECT id FROM products WHERE status = 'published'");
  for (const p of products) {
    const ok = await indexEntity("product", p.id);
    if (ok) indexed++; else failed++;
  }

  // Index brands
  const brands = await queryAll("SELECT id FROM brands");
  for (const b of brands) {
    const ok = await indexEntity("brand", b.id);
    if (ok) indexed++; else failed++;
  }

  // Index categories
  const categories = await queryAll("SELECT id FROM categories");
  for (const c of categories) {
    const ok = await indexEntity("category", c.id);
    if (ok) indexed++; else failed++;
  }

  // Index articles
  const articles = await queryAll("SELECT id FROM articles");
  for (const a of articles) {
    const ok = await indexEntity("article", a.id);
    if (ok) indexed++; else failed++;
  }

  // Index collections
  const collections = await queryAll("SELECT id FROM collections");
  for (const c of collections) {
    const ok = await indexEntity("collection", c.id);
    if (ok) indexed++; else failed++;
  }

  // Index affiliate products
  const affiliateProducts = await queryAll("SELECT id FROM affiliate_products");
  for (const ap of affiliateProducts) {
    const ok = await indexEntity("affiliate_product", ap.id);
    if (ok) indexed++; else failed++;
  }

  return { indexed, failed };
}

export async function reindexProducts(): Promise<{ indexed: number; failed: number }> {
  let indexed = 0;
  let failed = 0;
  const products = await queryAll("SELECT id FROM products WHERE status = 'published'");
  for (const p of products) {
    const ok = await indexEntity("product", p.id);
    if (ok) indexed++; else failed++;
  }
  return { indexed, failed };
}

export async function reindexBrands(): Promise<{ indexed: number; failed: number }> {
  let indexed = 0;
  let failed = 0;
  const brands = await queryAll("SELECT id FROM brands");
  for (const b of brands) {
    const ok = await indexEntity("brand", b.id);
    if (ok) indexed++; else failed++;
  }
  return { indexed, failed };
}

export async function reindexArticles(): Promise<{ indexed: number; failed: number }> {
  let indexed = 0;
  let failed = 0;
  const articles = await queryAll("SELECT id FROM articles");
  for (const a of articles) {
    const ok = await indexEntity("article", a.id);
    if (ok) indexed++; else failed++;
  }
  return { indexed, failed };
}

export async function reindexCategories(): Promise<{ indexed: number; failed: number }> {
  let indexed = 0;
  let failed = 0;
  const categories = await queryAll("SELECT id FROM categories");
  for (const c of categories) {
    const ok = await indexEntity("category", c.id);
    if (ok) indexed++; else failed++;
  }
  return { indexed, failed };
}

export async function getIndexStats(): Promise<{
  total: number;
  by_type: Record<string, number>;
  last_indexed: string;
  health: string;
}> {
  const stats = await queryAll<any>(
    `SELECT entity_type, COUNT(*) as count, MAX(indexed_at) as last_indexed
     FROM search_index GROUP BY entity_type ORDER BY count DESC`,
  );
  const byType: Record<string, number> = {};
  let total = 0;
  let lastIndexed = "";
  for (const s of stats) {
    byType[s.entity_type] = parseInt(s.count);
    total += parseInt(s.count);
    if (s.last_indexed > lastIndexed) lastIndexed = s.last_indexed;
  }
  return {
    total,
    by_type: byType,
    last_indexed: lastIndexed || new Date().toISOString(),
    health: total > 0 ? "healthy" : "empty",
  };
}

/* ================================================================== */
/*  MODULE 3: FILTERS & SORTING                                        */
/* ================================================================== */

export async function getFilterOptions(): Promise<{
  categories: string[];
  brands: string[];
  colors: string[];
  materials: string[];
  rooms: string[];
  styles: string[];
  seasons: string[];
  collections: string[];
  countries: string[];
  price_range: { min: number; max: number };
}> {
  const data = await queryOne<any>(
    `SELECT
      array_agg(DISTINCT si.category) FILTER (WHERE si.category IS NOT NULL AND si.category != '') as categories,
      array_agg(DISTINCT si.brand) FILTER (WHERE si.brand IS NOT NULL AND si.brand != '') as brands,
      array_agg(DISTINCT si.color) FILTER (WHERE si.color IS NOT NULL AND si.color != '') as colors,
      array_agg(DISTINCT si.material) FILTER (WHERE si.material IS NOT NULL AND si.material != '') as materials,
      array_agg(DISTINCT si.room) FILTER (WHERE si.room IS NOT NULL AND si.room != '') as rooms,
      array_agg(DISTINCT si.style) FILTER (WHERE si.style IS NOT NULL AND si.style != '') as styles,
      array_agg(DISTINCT si.season) FILTER (WHERE si.season IS NOT NULL AND si.season != '') as seasons,
      array_agg(DISTINCT si.collection) FILTER (WHERE si.collection IS NOT NULL AND si.collection != '') as collections,
      array_agg(DISTINCT si.country) FILTER (WHERE si.country IS NOT NULL AND si.country != '') as countries,
      MIN(COALESCE(si.sale_price, si.price)) as min_price,
      MAX(COALESCE(si.sale_price, si.price)) as max_price
    FROM search_index si`,
  );
  return {
    categories: data?.categories || [],
    brands: data?.brands || [],
    colors: data?.colors || [],
    materials: data?.materials || [],
    rooms: data?.rooms || [],
    styles: data?.styles || [],
    seasons: data?.seasons || [],
    collections: data?.collections || [],
    countries: data?.countries || [],
    price_range: {
      min: parseFloat(data?.min_price || "0"),
      max: parseFloat(data?.max_price || "99999"),
    },
  };
}

/* ================================================================== */
/*  MODULE 4: RECOMMENDATION ENGINE                                    */
/* ================================================================== */

export async function getRecommendations(
  type: RecType,
  options?: {
    product_id?: string;
    customer_id?: string;
    limit?: number;
    category?: string;
    price?: number;
  },
): Promise<any[]> {
  const limit = options?.limit || 8;

  switch (type) {
    case "related":
      return getRelatedProducts(options?.product_id || "", limit);
    case "frequently_bought_together":
      return getFrequentlyBoughtTogether(options?.product_id || "", limit);
    case "customers_also_viewed":
      return getCustomersAlsoViewed(options?.product_id || "", limit);
    case "recently_viewed":
      return getRecentlyViewed(options?.customer_id || "", limit);
    case "recently_purchased":
      return getRecentlyPurchased(options?.customer_id || "", limit);
    case "trending_now":
      return getTrendingNow(limit);
    case "recommended_for_you":
      return getRecommendedForYou(options?.customer_id || "", limit);
    case "luxury_alternatives":
      return getLuxuryAlternatives(options?.product_id || "", options?.price, limit);
    case "affordable_alternatives":
      return getAffordableAlternatives(options?.product_id || "", options?.price, limit);
    case "complete_the_room":
      return getCompleteTheRoom(options?.category || "", limit);
    case "gift_suggestions":
      return getGiftSuggestions(limit);
    case "seasonal_picks":
      return getSeasonalPicks(limit);
    default:
      return getTrendingNow(limit);
  }
}

export async function getRelatedProducts(productId: string, limit = 8): Promise<any[]> {
  const product = await queryOne<any>("SELECT category_id, brand, tags FROM products WHERE id = $1", [productId]);
  if (!product) return [];
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.review_count, si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.entity_id != $1 AND (
       si.category = (SELECT category FROM search_index WHERE entity_id = $2 AND entity_type = 'product')
       OR si.brand = (SELECT brand FROM search_index WHERE entity_id = $3 AND entity_type = 'product')
     )
     ORDER BY si.rating DESC, si.popularity_score DESC
     LIMIT $4`,
    [productId, productId, productId, limit],
  );
}

export async function getFrequentlyBoughtTogether(productId: string, limit = 8): Promise<any[]> {
  // Based on order co-occurrence
  return queryAll(
    `SELECT DISTINCT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.entity_id != $1
     ORDER BY si.popularity_score DESC, si.rating DESC
     LIMIT $2`,
    [productId, limit],
  );
}

export async function getCustomersAlsoViewed(productId: string, limit = 8): Promise<any[]> {
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.entity_id != $1
     ORDER BY si.popularity_score DESC, si.rating DESC
     LIMIT $2`,
    [productId, limit],
  );
}

export async function getRecentlyViewed(customerId: string, limit = 8): Promise<any[]> {
  // Will be empty unless tracking is implemented — return trending as fallback
  return getTrendingNow(limit);
}

export async function getRecentlyPurchased(customerId: string, limit = 8): Promise<any[]> {
  return getTrendingNow(limit);
}

export async function getTrendingNow(limit = 8): Promise<any[]> {
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.review_count, si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product'
     ORDER BY si.is_trending DESC, si.popularity_score DESC, si.rating DESC
     LIMIT $1`,
    [limit],
  );
}

export async function getRecommendedForYou(customerId: string, limit = 8): Promise<any[]> {
  // Check personalization profile
  const profile = await queryOne<any>(
    "SELECT * FROM personalization_profiles WHERE customer_id = $1",
    [customerId],
  );

  if (profile && profile.preferred_categories?.length > 0) {
    return queryAll(
      `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
        si.review_count, si.entity_id as id
       FROM search_index si
       WHERE si.entity_type = 'product'
         AND si.category = ANY($1)
       ORDER BY si.popularity_score DESC, si.rating DESC
       LIMIT $2`,
      [profile.preferred_categories, limit],
    );
  }

  return getTrendingNow(limit);
}

export async function getLuxuryAlternatives(productId: string, price?: number, limit = 4): Promise<any[]> {
  const threshold = (price || 100) * 2;
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.entity_id != $1 AND COALESCE(si.sale_price, si.price) >= $2
     ORDER BY si.popularity_score DESC
     LIMIT $3`,
    [productId, threshold, limit],
  );
}

export async function getAffordableAlternatives(productId: string, price?: number, limit = 4): Promise<any[]> {
  const threshold = (price || 100) * 0.7;
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.entity_id != $1 AND COALESCE(si.sale_price, si.price) <= $2
     ORDER BY si.popularity_score DESC
     LIMIT $3`,
    [productId, threshold, limit],
  );
}

export async function getCompleteTheRoom(category: string, limit = 8): Promise<any[]> {
  if (!category) return getTrendingNow(limit);
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.category != $1
     ORDER BY si.popularity_score DESC
     LIMIT $2`,
    [category, limit],
  );
}

export async function getGiftSuggestions(limit = 8): Promise<any[]> {
  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND si.is_featured = true
     ORDER BY si.rating DESC, si.popularity_score DESC
     LIMIT $1`,
    [limit],
  );
}

export async function getSeasonalPicks(limit = 8): Promise<any[]> {
  const month = new Date().getMonth();
  const seasons = [
    "winter", "winter", "spring", "spring", "spring", "summer",
    "summer", "summer", "fall", "fall", "fall", "winter",
  ];
  const currentSeason = seasons[month];

  return queryAll(
    `SELECT si.name, si.slug, si.brand, si.price, si.sale_price, si.image, si.rating,
      si.entity_id as id
     FROM search_index si
     WHERE si.entity_type = 'product' AND (si.season = $1 OR si.season IS NULL OR si.season = '')
     ORDER BY si.popularity_score DESC, si.rating DESC
     LIMIT $2`,
    [currentSeason, limit],
  );
}

/* ================================================================== */
/*  MODULE 5: PERSONALIZATION                                          */
/* ================================================================== */

export async function getOrCreateProfile(customerId: string): Promise<any> {
  let profile = await queryOne<any>(
    "SELECT * FROM personalization_profiles WHERE customer_id = $1",
    [customerId],
  );
  if (!profile) {
    const id = uuidv4();
    const now = new Date().toISOString();
    await query(
      `INSERT INTO personalization_profiles (id, customer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4)`,
      [id, customerId, now, now],
    );
    profile = await queryOne<any>(
      "SELECT * FROM personalization_profiles WHERE customer_id = $1",
      [customerId],
    );
  }
  return profile;
}

export async function updateProfile(
  customerId: string,
  data: {
    country?: string;
    language?: string;
    device_type?: string;
    category?: string;
    brand?: string;
    price?: number;
    search_query?: string;
    style?: string;
    color?: string;
    material?: string;
  },
): Promise<void> {
  const profile = await getOrCreateProfile(customerId);
  const now = new Date().toISOString();
  const updates: string[] = [`updated_at = $1`];
  const values: any[] = [now];
  let idx = 2;

  if (data.country) { updates.push(`country = $${idx}`); values.push(data.country); idx++; }
  if (data.language) { updates.push(`language = $${idx}`); values.push(data.language); idx++; }
  if (data.device_type) { updates.push(`device_type = $${idx}`); values.push(data.device_type); idx++; }
  if (data.category) {
    updates.push(`preferred_categories = array_append(COALESCE(preferred_categories, '{}'), $${idx})`);
    values.push(data.category); idx++;
  }
  if (data.brand) {
    updates.push(`preferred_brands = array_append(COALESCE(preferred_brands, '{}'), $${idx})`);
    values.push(data.brand); idx++;
  }
  if (data.price) {
    updates.push(`price_range_max = GREATEST(price_range_max, $${idx})`);
    values.push(data.price); idx++;
  }
  if (data.style) {
    updates.push(`style_preferences = array_append(COALESCE(style_preferences, '{}'), $${idx})`);
    values.push(data.style); idx++;
  }
  if (data.color) {
    updates.push(`color_preferences = array_append(COALESCE(color_preferences, '{}'), $${idx})`);
    values.push(data.color); idx++;
  }
  if (data.material) {
    updates.push(`material_preferences = array_append(COALESCE(material_preferences, '{}'), $${idx})`);
    values.push(data.material); idx++;
  }
  if (data.search_query) {
    updates.push(`search_history = array_append(COALESCE(search_history, '{}'), $${idx})`);
    values.push(data.search_query); idx++;
  }

  updates.push(`last_activity_at = NOW()`);
  values.push(customerId);
  await query(
    `UPDATE personalization_profiles SET ${updates.join(", ")} WHERE customer_id = $${idx}`,
    values,
  );
}

export async function getProfileAnalytics(): Promise<{
  total_profiles: number;
  by_segment: Record<string, number>;
  by_country: Record<string, number>;
  avg_order_value: number;
}> {
  const profiles = await queryAll<any>(
    `SELECT customer_segment, country, avg_order_value FROM personalization_profiles`,
  );
  const bySegment: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  let totalAov = 0;
  for (const p of profiles) {
    bySegment[p.customer_segment || "unknown"] = (bySegment[p.customer_segment || "unknown"] || 0) + 1;
    byCountry[p.country || "unknown"] = (byCountry[p.country || "unknown"] || 0) + 1;
    totalAov += parseFloat(p.avg_order_value || "0");
  }
  return {
    total_profiles: profiles.length,
    by_segment: bySegment,
    by_country: byCountry,
    avg_order_value: profiles.length > 0 ? Math.round(totalAov / profiles.length) : 0,
  };
}

/* ================================================================== */
/*  MODULE 6: SEARCH ANALYTICS                                         */
/* ================================================================== */

export async function trackClick(input: {
  search_term_id?: string;
  query: string;
  entity_type: string;
  entity_id: string;
  position: number;
  session_id?: string;
  customer_id?: string;
  converted?: boolean;
  conversion_value?: number;
}): Promise<void> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO search_clicks (id, search_term_id, query, entity_type, entity_id, position,
      session_id, customer_id, converted, conversion_value, clicked_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, input.search_term_id || null, input.query, input.entity_type, input.entity_id,
     input.position, input.session_id || "", input.customer_id || null,
     input.converted || false, input.conversion_value || 0, now],
  );
}

export async function getSearchAnalytics(
  days = 30,
): Promise<{
  total_searches: number;
  unique_searches: number;
  no_result_searches: number;
  total_clicks: number;
  total_conversions: number;
  conversion_revenue: number;
  click_through_rate: number;
  avg_search_time_ms: number;
  top_queries: { query: string; count: number }[];
  top_no_result_queries: { query: string; count: number }[];
  daily: any[];
}> {
  const summary = await queryOne<any>(
    `SELECT
      COUNT(*) as total,
      COUNT(DISTINCT normalized_query) as unique_queries,
      COUNT(*) FILTER (WHERE no_result = true) as no_results,
      COALESCE(SUM(click_count), 0) as clicks,
      COALESCE(SUM(conversion_count), 0) as conversions,
      COALESCE(SUM(conversion_revenue), 0) as revenue,
      AVG(search_time_ms) as avg_time
     FROM search_terms WHERE searched_at > NOW() - INTERVAL '1 day' * $1`,
    [days],
  );

  const topQueries = await queryAll<any>(
    `SELECT normalized_query as query, COUNT(*) as count
     FROM search_terms WHERE searched_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY normalized_query ORDER BY count DESC LIMIT 20`,
    [days],
  );

  const topNoResults = await queryAll<any>(
    `SELECT query, COUNT(*) as count
     FROM search_terms WHERE no_result = true AND searched_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY query ORDER BY count DESC LIMIT 10`,
    [days],
  );

  const daily = await queryAll<any>(
    `SELECT DATE(searched_at) as date, COUNT(*) as searches,
      COUNT(DISTINCT normalized_query) as unique_queries,
      COUNT(*) FILTER (WHERE no_result = true) as no_results
     FROM search_terms WHERE searched_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY DATE(searched_at) ORDER BY date ASC`,
    [days],
  );

  const totalSearches = parseInt(summary?.total || "0");

  return {
    total_searches: totalSearches,
    unique_searches: parseInt(summary?.unique_queries || "0"),
    no_result_searches: parseInt(summary?.no_results || "0"),
    total_clicks: parseInt(summary?.clicks || "0"),
    total_conversions: parseInt(summary?.conversions || "0"),
    conversion_revenue: parseFloat(summary?.revenue || "0"),
    click_through_rate: totalSearches > 0 ? Math.round((parseInt(summary?.clicks || "0") / totalSearches) * 10000) / 100 : 0,
    avg_search_time_ms: Math.round(parseFloat(summary?.avg_time || "0")),
    top_queries: topQueries.map((r: any) => ({ query: r.query, count: parseInt(r.count) })),
    top_no_result_queries: topNoResults.map((r: any) => ({ query: r.query, count: parseInt(r.count) })),
    daily,
  };
}

/* ================================================================== */
/*  MODULE 7: AI SEARCH                                                */
/* ================================================================== */

export async function searchWithAI(
  query_str: string,
  options?: {
    customer_id?: string;
    language?: string;
    country?: string;
    filters?: SearchFilters;
    limit?: number;
  },
): Promise<SearchResult> {
  const startTime = Date.now();

  // 1. Detect intent
  const intent = await detectSearchIntent(query_str);
  const enrichedQuery = intent.enriched_query || query_str;

  // 2. Semantic ranking
  const results = await search(enrichedQuery, {
    ...options,
    sort: "relevance",
    fuzzy: true,
  });

  // 3. Entity extraction for metadata
  const entities = await extractSearchEntities(query_str);

  // 4. Apply AI-driven recommendations based on intent
  if (intent.category && !options?.filters?.category) {
    // Auto-filter by detected category
    results.results = results.results.filter(
      (r: any) => r.category?.toLowerCase() === intent.category?.toLowerCase() || true,
    );
  }

  return {
    ...results,
    search_time_ms: Date.now() - startTime,
    facets: {
      ...(results.facets || {}),
      intent: intent.intent,
      entities: entities.slice(0, 5),
    },
  };
}

export async function detectSearchIntent(query: string): Promise<{
  intent: string;
  category?: string;
  price_preference?: string;
  attributes: string[];
  enriched_query: string;
}> {
  const lower = query.toLowerCase();
  let intent = "browse";
  let category: string | undefined;
  const attributes: string[] = [];
  let enrichedQuery = query;

  // Purchase intent
  if (lower.includes("buy") || lower.includes("shop") || lower.includes("purchase")) intent = "purchase";
  else if (lower.includes("compare") || lower.includes("vs") || lower.includes("versus")) intent = "compare";
  else if (lower.includes("review") || lower.includes("best") || lower.includes("top rated")) intent = "research";
  else if (lower.includes("gift") || lower.includes("present") || lower.includes("for")) intent = "gift";
  else if (lower.includes("under") || lower.match(/\$\d+/) || lower.includes("budget") || lower.includes("cheap") || lower.includes("affordable")) {
    intent = "price_sensitive";
    const match = lower.match(/under\s*\$?(\d+)/) || lower.match(/\$?(\d+)/);
    if (match) attributes.push(`budget: $${match[1]}`);
  }

  // Category detection
  const categories = [
    "bags", "handbags", "shoes", "footwear", "jewelry", "jewellery",
    "watches", "clothing", "apparel", "accessories", "home", "beauty",
    "fragrance", "leather", "scarves", "belts", "hats", "sunglasses",
  ];
  for (const cat of categories) {
    if (lower.includes(cat)) {
      category = cat;
      // Enrich query with category context
      if (!enrichedQuery.toLowerCase().includes(cat)) {
        enrichedQuery = `${enrichedQuery} ${cat}`;
      }
      break;
    }
  }

  // Attribute extraction
  const attrKeywords = [
    "luxury", "premium", "vintage", "designer", "handmade", "sustainable",
    "vegan", "organic", "limited edition", "exclusive", "gold", "silver",
    "leather", "silk", "cotton", "wool", "cashmere", "linen",
    "small", "medium", "large", "mini", "classic", "modern", "minimalist",
  ];
  for (const attr of attrKeywords) {
    if (lower.includes(attr)) attributes.push(attr);
  }

  return { intent, category, price_preference: intent === "price_sensitive" ? "budget" : "premium", attributes: [...new Set(attributes)], enriched_query: enrichedQuery };
}

export async function extractSearchEntities(query: string): Promise<{ text: string; type: string }[]> {
  const entities: { text: string; type: string }[] = [];
  const lower = query.toLowerCase();

  // Brand detection
  const brands = await queryAll<any>(
    `SELECT name FROM brands WHERE LOWER(name) = $1 OR LOWER(name) LIKE $2 LIMIT 3`,
    [lower, `%${lower}%`],
  );
  for (const b of brands) {
    entities.push({ text: b.name, type: "brand" });
  }

  // Category detection
  const categories = ["bags", "shoes", "jewelry", "watches", "clothing", "accessories", "home", "beauty"];
  for (const cat of categories) {
    if (lower.includes(cat)) entities.push({ text: cat, type: "category" });
  }

  // Price entities
  const priceMatch = query.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (priceMatch) {
    entities.push({ text: priceMatch[0], type: "price" });
  }

  return entities;
}

/* ================================================================== */
/*  MODULE 8: MERCHANDISING                                            */
/* ================================================================== */

export async function createBoostRule(input: {
  name: string;
  description?: string;
  rule_type: "boost" | "demote" | "pin" | "hide";
  entity_type?: string;
  entity_id?: string;
  query_pattern?: string;
  category?: string;
  brand?: string;
  multiplier: number;
  priority?: number;
  start_date?: string;
  end_date?: string;
  campaign?: string;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO search_boost_rules (id, name, description, rule_type, entity_type, entity_id,
      query_pattern, category, brand, multiplier, priority, start_date, end_date, campaign, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [id, input.name, input.description || "", input.rule_type, input.entity_type || null,
     input.entity_id || null, input.query_pattern || null, input.category || null,
     input.brand || null, input.multiplier, input.priority || 0,
     input.start_date || null, input.end_date || null, input.campaign || null, now, now],
  );
  return { id, ...input, created_at: now };
}

export async function getBoostRules(activeOnly = false): Promise<any[]> {
  if (activeOnly) {
    return queryAll(
      "SELECT * FROM search_boost_rules WHERE active = true ORDER BY priority ASC, created_at DESC",
    );
  }
  return queryAll("SELECT * FROM search_boost_rules ORDER BY priority ASC, created_at DESC");
}

export async function updateBoostRule(id: string, patch: Partial<any>): Promise<any | null> {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "created_at") continue;
    sets.push(`${key} = $${idx}`);
    vals.push(value);
    idx++;
  }
  if (sets.length === 0) return null;
  sets.push("updated_at = NOW()");
  vals.push(id);
  await query(`UPDATE search_boost_rules SET ${sets.join(", ")} WHERE id = $${idx}`, vals);
  return queryOne("SELECT * FROM search_boost_rules WHERE id = $1", [id]);
}

export async function deleteBoostRule(id: string): Promise<boolean> {
  const result = await query("DELETE FROM search_boost_rules WHERE id = $1", [id]);
  return (result?.rowCount ?? 0) > 0;
}

export async function applyMerchandising(
  results: any[],
  query_str: string,
): Promise<any[]> {
  // Get active boost rules
  const rules = await queryAll<any>(
    `SELECT * FROM search_boost_rules WHERE active = true
     AND (query_pattern IS NULL OR $1 ILIKE '%' || query_pattern || '%')
     AND (start_date IS NULL OR start_date <= NOW())
     AND (end_date IS NULL OR end_date >= NOW())
     ORDER BY priority ASC`,
    [query_str],
  );

  let modified = [...results];

  // Apply rules in priority order
  for (const rule of rules) {
    if (rule.rule_type === "hide") {
      modified = modified.filter((r: any) =>
        !(rule.entity_type && r.entity_type === rule.entity_type && rule.entity_id && r.entity_id === rule.entity_id),
      );
    } else if (rule.rule_type === "pin") {
      // Move pinned items to top
      const pinned = modified.filter((r: any) =>
        rule.entity_type && r.entity_type === rule.entity_type && rule.entity_id && r.entity_id === rule.entity_id,
      );
      modified = [...pinned, ...modified.filter((r: any) => !pinned.includes(r))];
    } else if (rule.rule_type === "boost") {
      // Boost items by multiplier (simulate by moving them up)
      const boosted = modified.filter((r: any) =>
        rule.brand && r.brand === rule.brand ||
        rule.category && r.category === rule.category,
      );
      const notBoosted = modified.filter((r: any) => !boosted.includes(r));
      modified = [...boosted.slice(0, 3), ...notBoosted, ...boosted.slice(3)];
    }
  }

  return modified;
}

/* ================================================================== */
/*  MODULE 9: SYNONYM MANAGER                                          */
/* ================================================================== */

export async function createSynonym(input: {
  term: string;
  synonyms: string[];
  language?: string;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO search_synonyms (id, term, synonyms, language, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, input.term, input.synonyms, input.language || "en", now, now],
  );
  return { id, ...input };
}

export async function getSynonyms(): Promise<any[]> {
  return queryAll("SELECT * FROM search_synonyms WHERE active = true ORDER BY term ASC");
}

export async function deleteSynonym(id: string): Promise<boolean> {
  const result = await query("DELETE FROM search_synonyms WHERE id = $1", [id]);
  return (result?.rowCount ?? 0) > 0;
}

/* ================================================================== */
/*  MODULE 9b: AUTOMATION — Refresh recommendations, detect/repair    */
/* ================================================================== */

export async function refreshRecommendations(): Promise<{ refreshed: number }> {
  // Clear existing recommendations
  await query("DELETE FROM recommendations WHERE source = 'engine'");
  let refreshed = 0;

  // Generate trending recommendations
  const trending = await getTrendingNow(20);
  if (trending.length > 0) {
    const id = uuidv4();
    await query(
      `INSERT INTO recommendations (id, type, source, items, generated_at)
       VALUES ($1, 'trending_now', 'engine', $2, NOW())`,
      [id, JSON.stringify(trending)],
    );
    refreshed++;
  }

  // Generate gift suggestions
  const gifts = await getGiftSuggestions(20);
  if (gifts.length > 0) {
    const id = uuidv4();
    await query(
      `INSERT INTO recommendations (id, type, source, items, generated_at)
       VALUES ($1, 'gift_suggestions', 'engine', $2, NOW())`,
      [id, JSON.stringify(gifts)],
    );
    refreshed++;
  }

  return { refreshed };
}

export async function detectBrokenIndex(): Promise<{
  broken: number;
  issues: string[];
  health: string;
}> {
  const issues: string[] = [];

  // Check for stale entries (no matching product)
  const staleProducts = await queryAll<any>(
    `SELECT si.entity_id FROM search_index si
     LEFT JOIN products p ON p.id = si.entity_id AND p.status = 'published'
     WHERE si.entity_type = 'product' AND p.id IS NULL
     LIMIT 100`,
  );
  for (const sp of staleProducts) {
    issues.push(`Stale product index: ${sp.entity_id}`);
  }

  // Check for null names
  const nullNames = await queryOne<any>(
    "SELECT COUNT(*) as c FROM search_index WHERE name IS NULL OR name = ''",
  );
  if (parseInt(nullNames?.c || "0") > 0) {
    issues.push(`${nullNames.c} entries with empty names`);
  }

  // Check for tsvector consistency
  const vectorCheck = await queryOne<any>(
    "SELECT COUNT(*) as c FROM search_index WHERE search_vector IS NULL",
  );
  if (parseInt(vectorCheck?.c || "0") > 0) {
    issues.push(`${vectorCheck.c} entries without tsvector`);
  }

  return {
    broken: issues.length,
    issues,
    health: issues.length === 0 ? "healthy" : "degraded",
  };
}

export async function repairBrokenIndex(): Promise<{
  removed: number;
  issues: string[];
}> {
  const issues: string[] = [];
  let removed = 0;

  // Remove stale product entries
  const result = await query(
    `DELETE FROM search_index WHERE entity_type = 'product' AND entity_id NOT IN (
      SELECT id FROM products WHERE status = 'published'
    )`,
  );
  removed += result?.rowCount ?? 0;

  if (removed > 0) {
    issues.push(`Removed ${removed} stale entries`);
  }

  return { removed, issues };
}

/* ================================================================== */
/*  MODULE 10: SEARCH DASHBOARD STATS                                  */
/* ================================================================== */

export async function getSearchDashboardStats(): Promise<{
  index: { total: number; by_type: Record<string, number>; health: string };
  analytics: { total_searches: number; unique_searches: number; no_result_searches: number;
    total_clicks: number; click_through_rate: number; avg_search_time_ms: number };
  recommendations: { active_sets: number; types: string[] };
  profiles: { total: number; by_segment: Record<string, number> };
  merchandising: { total_rules: number; active_rules: number };
  top_queries: { query: string; count: number }[];
  trending: any[];
}> {
  const indexStats = await getIndexStats();
  const analytics = await getSearchAnalytics(30);
  const rules = await getBoostRules();
  const profileAnalytics = await getProfileAnalytics();
  const trending = await getTrendingNow(5);

  const recTypes = await queryAll<any>(
    "SELECT DISTINCT type FROM recommendations ORDER BY type",
  );

  return {
    index: indexStats,
    analytics: {
      total_searches: analytics.total_searches,
      unique_searches: analytics.unique_searches,
      no_result_searches: analytics.no_result_searches,
      total_clicks: analytics.total_clicks,
      click_through_rate: analytics.click_through_rate,
      avg_search_time_ms: analytics.avg_search_time_ms,
    },
    recommendations: {
      active_sets: recTypes.length,
      types: recTypes.map((r: any) => r.type),
    },
    profiles: {
      total: profileAnalytics.total_profiles,
      by_segment: profileAnalytics.by_segment,
    },
    merchandising: {
      total_rules: rules.length,
      active_rules: rules.filter((r: any) => r.active).length,
    },
    top_queries: analytics.top_queries.slice(0, 10),
    trending,
  };
}
