/**
 * ALAYA INSIDER — Enterprise Search & Discovery Routes (PR-10)
 * --------------------------------------------------------------------------
 * Full REST API for search, index, recommendations, personalization,
 * analytics, AI search, and merchandising.
 */

import { Hono } from "hono";
import * as searchEngine from "../services/searchEngine.js";

const search = new Hono();

/* ================================================================== */
/*  SEARCH ENGINE                                                     */
/* ================================================================== */

search.get("/search", async (c) => {
  const query_str = c.req.query("q") || "";
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const sort = c.req.query("sort") as any || "relevance";
  const customer_id = c.req.query("customer_id");
  const language = c.req.query("language") || "en";
  const country = c.req.query("country");

  // Parse filters from query params
  const filters: any = {};
  const filterParams = ["category", "brand", "color", "material", "style", "room",
    "season", "collection", "country", "affiliate_network", "supplier",
    "shipping_speed", "tag"];
  for (const fp of filterParams) {
    const val = c.req.query(fp);
    if (val) filters[fp] = val;
  }
  const priceMin = c.req.query("price_min");
  const priceMax = c.req.query("price_max");
  if (priceMin) filters.price_min = parseFloat(priceMin);
  if (priceMax) filters.price_max = parseFloat(priceMax);
  const rating = c.req.query("rating");
  if (rating) filters.rating = parseFloat(rating);
  const isNew = c.req.query("is_new");
  if (isNew === "true") filters.is_new = true;
  const isBestSeller = c.req.query("is_best_seller");
  if (isBestSeller === "true") filters.is_best_seller = true;
  const isTrending = c.req.query("is_trending");
  if (isTrending === "true") filters.is_trending = true;

  const results = await searchEngine.search(query_str, {
    page, limit, sort, filters, customer_id, language, country,
    entity_types: (c.req.query("entity_types")?.split(",") || undefined) as any,
    fuzzy: c.req.query("fuzzy") !== "false",
    track: c.req.query("track") !== "false",
  });

  return c.json({ success: true, ...results });
});

search.get("/autocomplete", async (c) => {
  const prefix = c.req.query("q") || "";
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.autocomplete(prefix, limit);
  return c.json({ success: true, data: results });
});

search.get("/suggestions", async (c) => {
  const query = c.req.query("q") || "";
  const limit = parseInt(c.req.query("limit") || "5");
  const results = await searchEngine.getSuggestions(query, limit);
  return c.json({ success: true, data: results });
});

/* ================================================================== */
/*  FILTERS & SORTING                                                  */
/* ================================================================== */

search.get("/filters", async (c) => {
  const filters = await searchEngine.getFilterOptions();
  return c.json({ success: true, data: filters });
});

/* ================================================================== */
/*  SEARCH INDEX                                                       */
/* ================================================================== */

search.post("/index/:entity_type/:entity_id", async (c) => {
  const { entity_type, entity_id } = c.req.param();
  const ok = await searchEngine.indexEntity(entity_type as any, entity_id);
  return c.json({ success: ok, message: ok ? "Indexed" : "Failed" });
});

search.post("/reindex", async (c) => {
  const result = await searchEngine.reindexAll();
  return c.json({ success: true, data: result });
});

search.post("/reindex/products", async (c) => {
  const result = await searchEngine.reindexProducts();
  return c.json({ success: true, data: result });
});

search.post("/reindex/brands", async (c) => {
  const result = await searchEngine.reindexBrands();
  return c.json({ success: true, data: result });
});

search.post("/reindex/articles", async (c) => {
  const result = await searchEngine.reindexArticles();
  return c.json({ success: true, data: result });
});

search.post("/reindex/categories", async (c) => {
  const result = await searchEngine.reindexCategories();
  return c.json({ success: true, data: result });
});

search.get("/index/stats", async (c) => {
  const stats = await searchEngine.getIndexStats();
  return c.json({ success: true, data: stats });
});

search.get("/index/health", async (c) => {
  const stats = await searchEngine.getIndexStats();
  return c.json({
    success: true,
    data: {
      healthy: stats.health === "healthy",
      total_documents: stats.total,
      by_type: stats.by_type,
      last_indexed: stats.last_indexed,
    },
  });
});

/* ================================================================== */
/*  RECOMMENDATIONS                                                    */
/* ================================================================== */

search.get("/recommendations/:type", async (c) => {
  const type = c.req.param("type") as any;
  const product_id = c.req.query("product_id");
  const customer_id = c.req.query("customer_id");
  const limit = parseInt(c.req.query("limit") || "8");
  const category = c.req.query("category");
  const price = c.req.query("price") ? parseFloat(c.req.query("price")!) : undefined;

  const results = await searchEngine.getRecommendations(type, {
    product_id, customer_id, limit, category, price,
  });
  return c.json({ success: true, data: results });
});

search.get("/recommendations/related/:product_id", async (c) => {
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.getRelatedProducts(c.req.param("product_id"), limit);
  return c.json({ success: true, data: results });
});

search.get("/recommendations/fbt/:product_id", async (c) => {
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.getFrequentlyBoughtTogether(c.req.param("product_id"), limit);
  return c.json({ success: true, data: results });
});

search.get("/recommendations/trending", async (c) => {
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.getTrendingNow(limit);
  return c.json({ success: true, data: results });
});

search.get("/recommendations/for-you/:customer_id", async (c) => {
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.getRecommendedForYou(c.req.param("customer_id"), limit);
  return c.json({ success: true, data: results });
});

search.get("/recommendations/gift-suggestions", async (c) => {
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.getGiftSuggestions(limit);
  return c.json({ success: true, data: results });
});

search.get("/recommendations/seasonal-picks", async (c) => {
  const limit = parseInt(c.req.query("limit") || "8");
  const results = await searchEngine.getSeasonalPicks(limit);
  return c.json({ success: true, data: results });
});

/* ================================================================== */
/*  PERSONALIZATION                                                    */
/* ================================================================== */

search.get("/profiles/:customer_id", async (c) => {
  const profile = await searchEngine.getOrCreateProfile(c.req.param("customer_id"));
  return c.json({ success: true, data: profile });
});

search.post("/profiles/:customer_id/update", async (c) => {
  const body = await c.req.json();
  await searchEngine.updateProfile(c.req.param("customer_id"), body);
  return c.json({ success: true, message: "Profile updated" });
});

search.get("/profiles/analytics", async (c) => {
  const analytics = await searchEngine.getProfileAnalytics();
  return c.json({ success: true, data: analytics });
});

/* ================================================================== */
/*  SEARCH ANALYTICS                                                   */
/* ================================================================== */

search.get("/analytics", async (c) => {
  const days = parseInt(c.req.query("days") || "30");
  const analytics = await searchEngine.getSearchAnalytics(days);
  return c.json({ success: true, data: analytics });
});

search.post("/analytics/click", async (c) => {
  const body = await c.req.json();
  await searchEngine.trackClick(body);
  return c.json({ success: true, message: "Click tracked" });
});

/* ================================================================== */
/*  AI SEARCH                                                          */
/* ================================================================== */

search.get("/ai/search", async (c) => {
  const query_str = c.req.query("q") || "";
  const customer_id = c.req.query("customer_id");
  const results = await searchEngine.searchWithAI(query_str, {
    customer_id, language: c.req.query("language"), country: c.req.query("country"),
    limit: parseInt(c.req.query("limit") || "20"),
  });
  return c.json({ success: true, ...results });
});

search.get("/ai/intent", async (c) => {
  const query = c.req.query("q") || "";
  const intent = await searchEngine.detectSearchIntent(query);
  return c.json({ success: true, data: intent });
});

search.get("/ai/entities", async (c) => {
  const query = c.req.query("q") || "";
  const entities = await searchEngine.extractSearchEntities(query);
  return c.json({ success: true, data: entities });
});

/* ================================================================== */
/*  MERCHANDISING                                                      */
/* ================================================================== */

search.get("/merchandising/rules", async (c) => {
  const activeOnly = c.req.query("active") === "true";
  const rules = await searchEngine.getBoostRules(activeOnly);
  return c.json({ success: true, data: rules });
});

search.post("/merchandising/rules", async (c) => {
  const body = await c.req.json();
  const rule = await searchEngine.createBoostRule(body);
  return c.json({ success: true, data: rule });
});

search.put("/merchandising/rules/:id", async (c) => {
  const body = await c.req.json();
  const rule = await searchEngine.updateBoostRule(c.req.param("id"), body);
  return c.json({ success: !!rule, data: rule });
});

search.delete("/merchandising/rules/:id", async (c) => {
  const ok = await searchEngine.deleteBoostRule(c.req.param("id"));
  return c.json({ success: ok });
});

/* ================================================================== */
/*  SYNONYMS                                                           */
/* ================================================================== */

search.get("/synonyms", async (c) => {
  const synonyms = await searchEngine.getSynonyms();
  return c.json({ success: true, data: synonyms });
});

search.post("/synonyms", async (c) => {
  const body = await c.req.json();
  const synonym = await searchEngine.createSynonym(body);
  return c.json({ success: true, data: synonym });
});

search.delete("/synonyms/:id", async (c) => {
  const ok = await searchEngine.deleteSynonym(c.req.param("id"));
  return c.json({ success: ok });
});

/* ================================================================== */
/*  AUTOMATION                                                          */
/* ================================================================== */

search.post("/automation/refresh-recommendations", async (c) => {
  const result = await searchEngine.refreshRecommendations();
  return c.json({ success: true, data: result });
});

search.get("/automation/detect-broken-index", async (c) => {
  const result = await searchEngine.detectBrokenIndex();
  return c.json({ success: true, data: result });
});

search.post("/automation/repair-index", async (c) => {
  const result = await searchEngine.repairBrokenIndex();
  return c.json({ success: true, data: result });
});

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

search.get("/dashboard", async (c) => {
  const stats = await searchEngine.getSearchDashboardStats();
  return c.json({ success: true, data: stats });
});

export { search };
