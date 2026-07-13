/**
 * ALAYA INSIDER — Content & Marketing Routes
 *
 * Migrated to PostgreSQL repositories (v2.0.0)
 */

import { Hono } from "hono";
import { articles, questions, redirects, popups, affiliates, loyalty, liveSales } from "../db/repositories/index.js";

const content = new Hono();

/* ================================================================== */
/*  ARTICLES / JOURNAL                                                 */
/* ================================================================== */

content.get("/articles", async (c) => {
  const result = await articles.list(c.req.query() as any);
  return c.json(result);
});

content.get("/articles/slug/:slug", async (c) => {
  const item = await articles.findBySlug(c.req.param("slug"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Article not found" }, 404);
  return c.json(item);
});

content.get("/articles/:id", async (c) => {
  const item = await articles.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(item);
});

content.post("/articles", async (c) => {
  const body = await c.req.json<any>();
  const art = await articles.create({
    slug: body.slug || "",
    title: body.title || "New Article",
    excerpt: body.excerpt || "",
    body: body.body || [],
    cover: body.cover || "",
    author: body.author || "ALAYA Editors",
    author_role: body.authorRole || "Editor",
    category: body.category || "Style",
    tags: body.tags || [],
    read_minutes: body.readMinutes ?? body.read_minutes ?? 4,
    published_at: body.publishedAt ?? body.published_at ?? new Date(),
    featured: body.featured ?? false,
  } as any, "api");
  return c.json(art, 201);
});

content.patch("/articles/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await articles.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Article not found" }, 404);
  return c.json(updated);
});

content.delete("/articles/:id", async (c) => {
  const ok = await articles.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Article not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  QUESTIONS & ANSWERS                                                */
/* ================================================================== */

content.get("/products/:productId/questions", async (c) => {
  const result = await questions.getByProduct(c.req.param("productId"));
  return c.json(result);
});

content.post("/products/:productId/questions", async (c) => {
  const { author, question } = await c.req.json<{ author: string; question: string }>();
  const q = await questions.create({
    product_id: c.req.param("productId"),
    author,
    question,
    helpful: 0,
  } as any, "api");
  return c.json(q, 201);
});

content.patch("/questions/:id/answer", async (c) => {
  const { answer, answeredBy } = await c.req.json<{ answer: string; answeredBy?: string }>();
  const updated = await questions.answer(c.req.param("id"), answer, answeredBy);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Question not found" }, 404);
  return c.json(updated);
});

content.patch("/questions/:id/vote", async (c) => {
  const result = await questions.vote(c.req.param("id"));
  if (result.rowCount === 0) return c.json({ code: "NOT_FOUND" }, 404);
  const q = await questions.getById(c.req.param("id"));
  return c.json(q);
});

/* ================================================================== */
/*  REDIRECTS                                                          */
/* ================================================================== */

content.get("/redirects", async (c) => {
  const result = await redirects.list(c.req.query() as any);
  return c.json(result);
});

content.get("/redirects/:id", async (c) => {
  const item = await redirects.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Redirect not found" }, 404);
  return c.json(item);
});

content.post("/redirects", async (c) => {
  const body = await c.req.json<any>();
  const red = await redirects.create({
    from_path: body.from || body.from_path || "/",
    to_path: body.to || body.to_path || "",
    redirect_type: body.type ?? body.redirect_type ?? 301,
    active: body.active ?? true,
    hits: body.hits ?? 0,
  } as any, "api");
  return c.json(red, 201);
});

content.patch("/redirects/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await redirects.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Redirect not found" }, 404);
  return c.json(updated);
});

content.delete("/redirects/:id", async (c) => {
  const ok = await redirects.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Redirect not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  POPUPS                                                             */
/* ================================================================== */

content.get("/popups", async (c) => {
  const result = await popups.list(c.req.query() as any);
  return c.json(result);
});

content.get("/popups/:id", async (c) => {
  const item = await popups.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Popup not found" }, 404);
  return c.json(item);
});

content.post("/popups", async (c) => {
  const body = await c.req.json<any>();
  const popup = await popups.create({
    name: body.name || "",
    type: body.type || "newsletter",
    trigger: body.trigger || "time",
    headline: body.headline || "",
    body: body.body || "",
    cta_label: body.ctaLabel || "Subscribe",
    cta_link: body.ctaLink,
    trigger_value: body.triggerValue ?? body.trigger_value ?? 15,
    active: body.active ?? true,
    views: body.views ?? 0,
    conversions: body.conversions ?? 0,
  } as any, "api");
  return c.json(popup, 201);
});

content.patch("/popups/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await popups.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Popup not found" }, 404);
  return c.json(updated);
});

content.delete("/popups/:id", async (c) => {
  const ok = await popups.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Popup not found" }, 404);
  return c.json({ success: true });
});

content.post("/popups/:id/track", async (c) => {
  const { converted } = await c.req.json<{ converted: boolean }>();
  await popups.trackView(c.req.param("id"));
  if (converted) {
    await popups.trackConversion(c.req.param("id"));
  }
  const popup = await popups.getById(c.req.param("id"));
  if (!popup) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(popup);
});

/* ================================================================== */
/*  AFFILIATES                                                         */
/* ================================================================== */

content.get("/affiliates", async (c) => {
  const result = await affiliates.list(c.req.query() as any);
  return c.json(result);
});

content.get("/affiliates/:id", async (c) => {
  const item = await affiliates.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Affiliate not found" }, 404);
  return c.json(item);
});

content.post("/affiliates", async (c) => {
  const body = await c.req.json<any>();
  const aff = await affiliates.create({
    name: body.name || "",
    url: body.url || "",
    commission: body.commission ?? 5,
    active: body.active ?? true,
  } as any, "api");
  return c.json(aff, 201);
});

content.patch("/affiliates/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await affiliates.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Affiliate not found" }, 404);
  return c.json(updated);
});

content.delete("/affiliates/:id", async (c) => {
  const ok = await affiliates.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Affiliate not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  LOYALTY TIERS                                                      */
/* ================================================================== */

content.get("/loyalty/tiers", async (c) => {
  const result = await loyalty.list(c.req.query() as any);
  return c.json(result);
});

content.post("/loyalty/tiers", async (c) => {
  const body = await c.req.json<any>();
  const tier = await loyalty.create({
    name: body.name || "",
    min_points: body.minPoints ?? body.min_points ?? 0,
    perk: body.perk || "",
  } as any, "api");
  return c.json(tier, 201);
});

content.patch("/loyalty/tiers/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await loyalty.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Tier not found" }, 404);
  return c.json(updated);
});

content.delete("/loyalty/tiers/:id", async (c) => {
  const ok = await loyalty.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Tier not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  LIVE SALES                                                         */
/* ================================================================== */

content.get("/live-sales", async (c) => {
  const result = await liveSales.list(c.req.query() as any);
  return c.json(result);
});

content.post("/live-sales", async (c) => {
  const sale = await c.req.json<any>();
  const ls = await liveSales.create({
    customer_name: sale.customerName || sale.customer_name || "",
    city: sale.city || "",
    country: sale.country || "",
    product_id: sale.productId || sale.product_id || "",
    product_name: sale.productName || sale.product_name || "",
    amount: sale.amount || 0,
    minutes_ago: sale.minutesAgo ?? sale.minutes_ago ?? 0,
  } as any, "api");
  return c.json(ls, 201);
});

export { content };
