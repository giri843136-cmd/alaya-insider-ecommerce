/**
 * ALAYA INSIDER — Cache API Routes (PR-11)
 * --------------------------------------------------------------------------
 * REST API for cache monitoring, invalidation, and management.
 */

import { Hono } from "hono";
import { cacheManager, invalidateEntity, invalidateProductData } from "../services/cache.js";

const cacheRouter = new Hono();

/* ================================================================== */
/*  CACHE STATS & MANAGEMENT                                           */
/* ================================================================== */

cacheRouter.get("/stats", async (c) => {
  const stats = cacheManager.getStats();
  return c.json({ success: true, data: stats });
});

cacheRouter.post("/clear", async (c) => {
  cacheManager.clearAll();
  return c.json({ success: true, message: "All caches cleared" });
});

cacheRouter.post("/clear/:store", async (c) => {
  const store = c.req.param("store");
  const cacheMap: Record<string, any> = {
    memory: cacheManager.memory, search: cacheManager.search,
    recommendations: cacheManager.recommendations, affiliate: cacheManager.affiliate,
    price: cacheManager.price, session: cacheManager.session,
    settings: cacheManager.settings, query: cacheManager.query,
  };
  const target = cacheMap[store];
  if (!target) return c.json({ success: false, message: `Unknown cache: ${store}` }, 400);
  target.clear();
  return c.json({ success: true, message: `${store} cache cleared` });
});

cacheRouter.post("/invalidate/:entity_type", async (c) => {
  const entityType = c.req.param("entity_type");
  const entityId = c.req.query("entity_id");
  invalidateEntity(entityType, entityId);
  return c.json({ success: true, message: `Invalidated ${entityType}${entityId ? `:${entityId}` : ""}` });
});

cacheRouter.post("/invalidate/products", async (c) => {
  invalidateProductData();
  return c.json({ success: true, message: "Product caches invalidated" });
});

cacheRouter.get("/keys", async (c) => {
  const stats = cacheManager.getStats();
  const allKeys = {
    memory: cacheManager.memory.stats.keys,
    search: cacheManager.search.stats.keys,
    recommendations: cacheManager.recommendations.stats.keys,
  };
  return c.json({ success: true, data: allKeys });
});

export { cacheRouter };
