/**
 * ALAYA INSIDER — Content & Marketing Routes
 */

import { Hono } from "hono";
import { getStore, CRUD, paginate, searchItems, genId, type Article, type Question, type Redirect, type Popup, type AffPartner, type LoyaltyTier, type LiveSale } from "../db.js";

const content = new Hono();

/* ================================================================== */
/*  ARTICLES / JOURNAL                                                 */
/* ================================================================== */

content.get("/articles", (c) => {
  return c.json(searchItems(getStore().articles, c.req.query(), ["title", "excerpt", "author"]));
});

content.get("/articles/slug/:slug", (c) => {
  const item = getStore().articles.find((a) => a.slug === c.req.param("slug"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Article not found" }, 404);
  return c.json(item);
});

content.get("/articles/:id", (c) => {
  const item = CRUD.get(getStore().articles, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(item);
});

content.post("/articles", async (c) => {
  const body = await c.req.json<Partial<Article>>();
  const art: Article = { id: body.id ?? genId("art"), slug: body.slug ?? "", title: body.title ?? "New Article", excerpt: body.excerpt ?? "", content: body.content ?? "", body: body.body, cover: body.cover, author: body.author ?? "ALAYA Editors", authorRole: body.authorRole, category: body.category ?? "Style", tags: body.tags ?? [], image: body.image ?? "", readMinutes: body.readMinutes, published: body.published ?? true, publishedAt: body.publishedAt, featured: body.featured, createdAt: Date.now() };
  getStore().articles.unshift(art);
  return c.json(art, 201);
});

content.patch("/articles/:id", async (c) => {
  const updated = CRUD.update(getStore().articles, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Article not found" }, 404);
  return c.json(updated);
});

content.delete("/articles/:id", (c) => {
  if (!CRUD.remove(getStore().articles, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Article not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  QUESTIONS & ANSWERS                                                */
/* ================================================================== */

content.get("/products/:productId/questions", (c) => {
  return c.json(getStore().questions.filter((q) => q.productId === c.req.param("productId")));
});

content.post("/products/:productId/questions", async (c) => {
  const { author, question } = await c.req.json<{ author: string; question: string }>();
  const q: Question = { id: genId("q"), productId: c.req.param("productId"), author, question, helpful: 0, date: new Date().toISOString() };
  getStore().questions.unshift(q);
  return c.json(q, 201);
});

content.patch("/questions/:id/answer", async (c) => {
  const { answer, answeredBy } = await c.req.json<{ answer: string; answeredBy?: string }>();
  const updated = CRUD.update(getStore().questions, c.req.param("id"), { answer, answeredBy: answeredBy ?? "ALAYA Care" });
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Question not found" }, 404);
  return c.json(updated);
});

content.patch("/questions/:id/vote", (c) => {
  const q = CRUD.get(getStore().questions, c.req.param("id"));
  if (!q) return c.json({ code: "NOT_FOUND" }, 404);
  q.helpful++;
  return c.json(q);
});

/* ================================================================== */
/*  REDIRECTS                                                          */
/* ================================================================== */

content.get("/redirects", (c) => {
  return c.json(getStore().redirects);
});

content.get("/redirects/:id", (c) => {
  const item = CRUD.get(getStore().redirects, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Redirect not found" }, 404);
  return c.json(item);
});

content.post("/redirects", async (c) => {
  const body = await c.req.json<Partial<Redirect>>();
  const red: Redirect = { id: body.id ?? genId("red"), from: body.from ?? "/", to: body.to ?? "", type: body.type ?? 301, active: body.active ?? true, hits: body.hits ?? 0, createdAt: Date.now() };
  getStore().redirects.unshift(red);
  return c.json(red, 201);
});

content.patch("/redirects/:id", async (c) => {
  const updated = CRUD.update(getStore().redirects, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Redirect not found" }, 404);
  return c.json(updated);
});

content.delete("/redirects/:id", (c) => {
  if (!CRUD.remove(getStore().redirects, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Redirect not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  POPUPS                                                             */
/* ================================================================== */

content.get("/popups", (c) => {
  return c.json(searchItems(getStore().popups, c.req.query(), ["name", "headline"]));
});

content.get("/popups/:id", (c) => {
  const item = CRUD.get(getStore().popups, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Popup not found" }, 404);
  return c.json(item);
});

content.post("/popups", async (c) => {
  const body = await c.req.json<Partial<Popup>>();
  const popup: Popup = { id: body.id ?? genId("pop"), name: body.name ?? "", type: body.type ?? "newsletter", trigger: body.trigger ?? "time", headline: body.headline ?? "", body: body.body ?? "", ctaLabel: body.ctaLabel ?? "Subscribe", ctaLink: body.ctaLink, triggerValue: body.triggerValue ?? 15, active: body.active ?? true, views: body.views ?? 0, conversions: body.conversions ?? 0 };
  getStore().popups.unshift(popup);
  return c.json(popup, 201);
});

content.patch("/popups/:id", async (c) => {
  const updated = CRUD.update(getStore().popups, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Popup not found" }, 404);
  return c.json(updated);
});

content.delete("/popups/:id", (c) => {
  if (!CRUD.remove(getStore().popups, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Popup not found" }, 404);
  return c.json({ success: true });
});

content.post("/popups/:id/track", async (c) => {
  const { converted } = await c.req.json<{ converted: boolean }>();
  const popup = CRUD.get(getStore().popups, c.req.param("id"));
  if (!popup) return c.json({ code: "NOT_FOUND" }, 404);
  popup.views++;
  if (converted) popup.conversions++;
  return c.json(popup);
});

/* ================================================================== */
/*  AFFILIATES                                                         */
/* ================================================================== */

content.get("/affiliates", (c) => {
  return c.json(getStore().affiliates);
});

content.get("/affiliates/:id", (c) => {
  const item = CRUD.get(getStore().affiliates, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Affiliate not found" }, 404);
  return c.json(item);
});

content.post("/affiliates", async (c) => {
  const body = await c.req.json<Partial<AffPartner>>();
  const aff: AffPartner = { id: body.id ?? genId("aff"), name: body.name ?? "", url: body.url ?? "", commission: body.commission ?? 5, active: body.active ?? true };
  getStore().affiliates.push(aff);
  return c.json(aff, 201);
});

content.patch("/affiliates/:id", async (c) => {
  const updated = CRUD.update(getStore().affiliates, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Affiliate not found" }, 404);
  return c.json(updated);
});

content.delete("/affiliates/:id", (c) => {
  if (!CRUD.remove(getStore().affiliates, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Affiliate not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  LOYALTY TIERS                                                      */
/* ================================================================== */

content.get("/loyalty/tiers", (c) => {
  return c.json(getStore().loyaltyTiers);
});

content.post("/loyalty/tiers", async (c) => {
  const body = await c.req.json<Partial<LoyaltyTier>>();
  const tier: LoyaltyTier = { id: body.id ?? genId("tier"), name: body.name ?? "", minPoints: body.minPoints ?? 0, perk: body.perk ?? "" };
  getStore().loyaltyTiers.push(tier);
  return c.json(tier, 201);
});

content.patch("/loyalty/tiers/:id", async (c) => {
  const updated = CRUD.update(getStore().loyaltyTiers, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Tier not found" }, 404);
  return c.json(updated);
});

content.delete("/loyalty/tiers/:id", (c) => {
  if (!CRUD.remove(getStore().loyaltyTiers, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Tier not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  LIVE SALES                                                         */
/* ================================================================== */

content.get("/live-sales", (c) => {
  return c.json(getStore().liveSales);
});

content.post("/live-sales", async (c) => {
  const sale = await c.req.json<Omit<LiveSale, "id">>();
  const ls: LiveSale = { ...sale, id: genId("ls") };
  getStore().liveSales.unshift(ls);
  if (getStore().liveSales.length > 50) getStore().liveSales = getStore().liveSales.slice(0, 50);
  return c.json(ls, 201);
});

export { content };
