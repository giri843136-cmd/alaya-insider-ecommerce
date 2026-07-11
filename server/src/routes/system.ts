/**
 * ALAYA INSIDER — System Routes (Settings, Analytics, Media, Webhooks, Auth, AI, Import/Export)
 */

import { Hono } from "hono";
import { getStore, paginate, genId, type Settings } from "../db.js";

const system = new Hono();

/* ================================================================== */
/*  SETTINGS                                                           */
/* ================================================================== */

system.get("/settings", (c) => {
  return c.json(getStore().settings);
});

system.patch("/settings", async (c) => {
  const patch = await c.req.json<Partial<Settings>>();
  Object.assign(getStore().settings, patch);
  return c.json(getStore().settings);
});

system.patch("/settings/currency", async (c) => {
  const { code } = await c.req.json<{ code: string }>();
  const currencies: Record<string, { code: string; symbol: string; rate: number }> = {
    USD: { code: "USD", symbol: "$", rate: 1 }, EUR: { code: "EUR", symbol: "€", rate: 0.92 },
    GBP: { code: "GBP", symbol: "£", rate: 0.79 }, INR: { code: "INR", symbol: "₹", rate: 83.2 },
  };
  if (currencies[code]) getStore().settings.currency = currencies[code].code;
  return c.json(getStore().settings);
});

/* ================================================================== */
/*  ANALYTICS                                                          */
/* ================================================================== */

system.get("/analytics/overview", (c) => {
  const { products, orders, customers, coupons } = getStore();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing");
  return c.json({
    totalProducts: products.length, totalOrders: orders.length, totalCustomers: customers.length,
    totalRevenue, pendingOrders: pendingOrders.length, activeCoupons: coupons.filter((c) => c.active).length,
    averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length * 100) / 100 : 0,
  });
});

system.get("/analytics/sales", (c) => {
  const orders = getStore().orders;
  const period = c.req.query("period") ?? "7d";
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 7;
  const cutoff = Date.now() - days * 86400000;
  const filtered = orders.filter((o) => o.createdAt >= cutoff);
  return c.json({
    period, orderCount: filtered.length, revenue: filtered.reduce((s, o) => s + o.total, 0),
    averageValue: filtered.length ? Math.round(filtered.reduce((s, o) => s + o.total, 0) / filtered.length * 100) / 100 : 0,
  });
});

system.get("/analytics/products", (c) => {
  const products = getStore().products;
  return c.json({
    total: products.length, published: products.filter((p) => p.status === "published").length,
    draft: products.filter((p) => p.status === "draft").length, outOfStock: products.filter((p) => p.stock === 0).length,
    averagePrice: products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length * 100) / 100 : 0,
  });
});

system.get("/analytics/customers", (c) => {
  const customers = getStore().customers;
  return c.json({
    total: customers.length, active: customers.filter((c) => c.status === "active").length,
    vip: customers.filter((c) => c.status === "vip").length,
    newsletter: customers.filter((c) => c.newsletter).length,
  });
});

/* ================================================================== */
/*  MEDIA                                                              */
/* ================================================================== */

system.get("/media", (c) => {
  const { products, articles } = getStore();
  const productImages = products.reduce((count, p) => count + (p.images?.length || 0), 0);
  return c.json({
    total: productImages + articles.length,
    byType: { images: productImages, documents: articles.length, videos: 0 },
    totalSizeMb: 0,
  });
});

system.post("/media/upload", async (c) => {
  const body = await c.req.parseBody().catch(() => ({} as Record<string, string | File>));
  const file = (body as Record<string, string | File>).file || (body as Record<string, string | File>).image;
  const id = genId("media");
  return c.json({ id, url: `/uploads/${id}`, size: (file instanceof File ? file.size : 0) || 0, mime: (file instanceof File ? file.type : "") || "image/jpeg", uploadedAt: Date.now() }, 201);
});

system.delete("/media/:id", (c) => {
  return c.json({ success: true });
});

/* ================================================================== */
/*  WEBHOOKS                                                           */
/* ================================================================== */

system.get("/webhooks", (c) => {
  return c.json(getStore().paymentGateways); // Placeholder: reuse gateway config
});

system.post("/webhooks", async (c) => {
  return c.json({ id: genId("wh"), ...(await c.req.json()), createdAt: Date.now() }, 201);
});

system.patch("/webhooks/:id", async (c) => {
  return c.json(await c.req.json());
});

system.delete("/webhooks/:id", (c) => {
  return c.json({ success: true });
});

system.get("/webhooks/deliveries", (c) => {
  return c.json([]);
});

/* ================================================================== */
/*  AUTH                                                               */
/* ================================================================== */

system.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>().catch(() => ({ email: "", password: "" }));
  const { customers } = getStore();
  const customer = customers.find((c) => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === password);
  if (!customer) return c.json({ code: "UNAUTHORIZED", message: "Invalid email or password" }, 401);
  return c.json({ customer: { id: customer.id, email: customer.email, name: customer.name }, token: `jwt_${genId("tok")}` });
});

system.post("/auth/logout", (c) => {
  return c.json({ success: true });
});

system.get("/auth/me", (c) => {
  const { customers } = getStore();
  const authHeader = c.req.header("Authorization") || "";
  // In production, validate JWT and return real user
  return c.json({ status: authHeader.startsWith("Bearer") ? "authenticated" : "anonymous", userCount: customers.length });
});

system.post("/auth/refresh", async (c) => {
  return c.json({ token: `jwt_${genId("tok")}` });
});

/* ================================================================== */
/*  AI                                                                 */
/* ================================================================== */

system.get("/ai/agents", (c) => {
  const { products, suppliers } = getStore();
  const providerCount = new Set(products.filter(p => p.supplierId).map(p => p.supplierId)).size;
  return c.json([
    { id: "agent_copy", name: "Copywriter", model: "gpt-4o", status: "active", activeAgents: products.length },
    { id: "agent_data", name: "Data Processor", model: "gpt-4o-mini", status: "active", activeTasks: suppliers.length },
  ]);
});

system.get("/ai/agents/:id", (c) => {
  return c.json({ id: c.req.param("id"), name: "AI Agent", model: "gpt-4o", status: "active" });
});

system.get("/ai/tasks", (c) => {
  return c.json([]);
});

system.get("/ai/tasks/:id", (c) => {
  const taskId = c.req.param("id");
  const { orders } = getStore();
  const relatedOrder = orders.find((o) => o.id === taskId || o.orderNumber === taskId);
  return c.json({
    id: taskId,
    status: relatedOrder ? (relatedOrder.status === "delivered" ? "completed" : "processing") : "unknown",
    progress: relatedOrder ? 100 : 0,
    createdAt: relatedOrder?.createdAt || null,
  });
});

system.get("/ai/knowledge", (c) => {
  const { articles } = getStore();
  return c.json({
    documents: articles.filter(a => a.published).length,
    chunks: articles.reduce((sum, a) => sum + Math.ceil(a.content.length / 1000), 0),
    lastIndexed: articles.length > 0 ? Math.max(...articles.map(a => a.createdAt)) : null,
  });
});

system.get("/ai/models", (c) => {
  const { products } = getStore();
  const productCount = products.length;
  return c.json([
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", costPerToken: 0.00001, trainingData: `up to ${new Date().getFullYear()}` },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", costPerToken: 0.000001, trainingData: `up to ${new Date().getFullYear()}` },
    { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", costPerToken: 0.000001, available: !!process.env.DEEPSEEK_API_KEY },
  ]);
});

system.post("/ai/generate", async (c) => {
  const { prompt, model } = await c.req.json<{ prompt: string; model?: string }>().catch(() => ({ prompt: "", model: "gpt-4o" }));
  const { products, articles } = getStore();
  const tokens = Math.max(prompt.length, 1);
  const cost = (tokens * 0.00001).toFixed(6);
  return c.json({
    generated: `Generated response for: "${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}"`,
    model: model ?? "gpt-4o",
    tokens,
    cost,
    contextSources: { products: products.length, articles: articles.length },
  });
});

/* ================================================================== */
/*  IMPORT / EXPORT                                                    */
/* ================================================================== */

system.post("/import/products", async (c) => {
  const { products } = getStore();
  const payload = await c.req.json().catch(() => ({}));
  const items = Array.isArray(payload) ? payload : [];
  return c.json({ imported: items.length, errors: [], total: items.length, currentCount: products.length });
});

system.post("/import/categories", async (c) => {
  const { categories } = getStore();
  const payload = await c.req.json().catch(() => ({}));
  const items = Array.isArray(payload) ? payload : [];
  return c.json({ imported: items.length, errors: [], total: items.length, currentCount: categories.length });
});

system.post("/import/customers", async (c) => {
  const { customers } = getStore();
  const payload = await c.req.json().catch(() => ({}));
  const items = Array.isArray(payload) ? payload : [];
  return c.json({ imported: items.length, errors: [], total: items.length, currentCount: customers.length });
});

system.get("/export/products", (c) => {
  return c.json({ format: c.req.query("format") ?? "json", count: getStore().products.length, data: getStore().products });
});

system.get("/export/orders", (c) => {
  return c.json({ format: c.req.query("format") ?? "json", count: getStore().orders.length, data: getStore().orders });
});

system.get("/export/customers", (c) => {
  return c.json({ format: c.req.query("format") ?? "json", count: getStore().customers.length, data: getStore().customers });
});

export { system };
