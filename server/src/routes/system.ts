/**
 * ALAYA INSIDER — System Routes (Settings, Analytics, Media, Webhooks, Auth, AI, Import/Export)
 *
 * Migrated to PostgreSQL repositories (v2.0.0)
 */

import { Hono } from "hono";
import { settings } from "../db/repositories/index.js";
import { queryAll, queryOne } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

const system = new Hono();

/* ================================================================== */
/*  SETTINGS                                                           */
/* ================================================================== */

system.get("/settings", async (c) => {
  const all = await settings.getAllAsMap();
  return c.json(all);
});

system.patch("/settings", async (c) => {
  const patch = await c.req.json<Record<string, any>>();
  for (const [key, value] of Object.entries(patch)) {
    await settings.setValue(key, value);
  }
  const all = await settings.getAllAsMap();
  return c.json(all);
});

system.patch("/settings/currency", async (c) => {
  const { code } = await c.req.json<{ code: string }>();
  const currencies: Record<string, { code: string; symbol: string; rate: number }> = {
    USD: { code: "USD", symbol: "$", rate: 1 }, EUR: { code: "EUR", symbol: "€", rate: 0.92 },
    GBP: { code: "GBP", symbol: "£", rate: 0.79 }, INR: { code: "INR", symbol: "₹", rate: 83.2 },
  };
  if (currencies[code]) {
    await settings.setValue("currency", currencies[code] as any);
  }
  const all = await settings.getAllAsMap();
  return c.json(all);
});

/* ================================================================== */
/*  ANALYTICS                                                          */
/* ================================================================== */

system.get("/analytics/overview", async (c) => {
  const productCount = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products");
  const orderCount = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM orders");
  const customerCount = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers");
  const revenue = await queryOne<{ total: string }>("SELECT COALESCE(SUM(total), 0) as total FROM orders");
  const pending = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')");
  const activeCoupons = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM coupons WHERE active = true");

  const totalOrders = Number(orderCount?.count || 0);
  const totalRevenue = Number(revenue?.total || 0);

  return c.json({
    totalProducts: Number(productCount?.count || 0),
    totalOrders,
    totalCustomers: Number(customerCount?.count || 0),
    totalRevenue,
    pendingOrders: Number(pending?.count || 0),
    activeCoupons: Number(activeCoupons?.count || 0),
    averageOrderValue: totalOrders ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
  });
});

system.get("/analytics/sales", async (c) => {
  const period = c.req.query("period") ?? "7d";
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 7;

  const orders = await queryAll<any>(
    "SELECT total, created_at FROM orders WHERE created_at > NOW() - INTERVAL '1 day' * $1",
    [days],
  );
  const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  return c.json({
    period,
    orderCount: orders.length,
    revenue: totalRevenue,
    averageValue: orders.length ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
  });
});

system.get("/analytics/products", async (c) => {
  const total = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products");
  const published = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products WHERE status = 'published'");
  const draft = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products WHERE status = 'draft'");
  const outOfStock = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products WHERE stock = 0");
  const avgPrice = await queryOne<{ avg: string }>("SELECT COALESCE(AVG(price), 0) as avg FROM products");

  return c.json({
    total: Number(total?.count || 0),
    published: Number(published?.count || 0),
    draft: Number(draft?.count || 0),
    outOfStock: Number(outOfStock?.count || 0),
    averagePrice: Math.round(Number(avgPrice?.avg || 0) * 100) / 100,
  });
});

system.get("/analytics/customers", async (c) => {
  const total = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers");
  const active = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers WHERE status = 'active'");
  const vip = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers WHERE status = 'vip'");
  const newsletter = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers WHERE newsletter = true");

  return c.json({
    total: Number(total?.count || 0),
    active: Number(active?.count || 0),
    vip: Number(vip?.count || 0),
    newsletter: Number(newsletter?.count || 0),
  });
});

/* ================================================================== */
/*  MEDIA                                                              */
/* ================================================================== */

system.get("/media", async (c) => {
  const result = await queryAll("SELECT mime_type, COUNT(*) as count, SUM(size_bytes) as total_bytes FROM media_assets GROUP BY mime_type");
  const byType: Record<string, number> = {};
  let totalSizeBytes = 0;
  for (const row of result) {
    const type = (row.mime_type || "unknown").startsWith("image/") ? "images" :
      (row.mime_type || "unknown").startsWith("video/") ? "videos" : "documents";
    byType[type] = (byType[type] || 0) + Number(row.count || 0);
    totalSizeBytes += Number(row.total_bytes || 0);
  }
  return c.json({
    total: result.reduce((s: number, r: any) => s + Number(r.count || 0), 0),
    byType,
    totalSizeMb: Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100,
  });
});

system.get("/media/:id", async (c) => {
  const id = c.req.param("id");
  const result = await queryOne("SELECT * FROM media_assets WHERE id = $1", [id]);
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

system.post("/media/upload", async (c) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const url = "/api/v1/uploads/" + id + ".jpg";
  await queryOne(
    `INSERT INTO media_assets (id, filename, original_name, mime_type, url, folder, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, "upload-" + id, "upload-" + id.slice(0, 8), "image/jpeg", url, "/", now],
  );
  return c.json({ id, url, size: 0, mime: "image/jpeg", uploadedAt: now }, 201);
});

system.delete("/media/:id", async (c) => {
  try {
    await queryOne("DELETE FROM media_assets WHERE id = $1", [c.req.param("id")]);
    return c.json({ success: true });
  } catch {
    return c.json({ success: false }, 400);
  }
});

/* ================================================================== */
/*  SITEMAP                                                            */
/* ================================================================== */

system.get("/sitemap.xml", async (c) => {
  const baseUrl = "https://alayainsider.com";
  const products = await queryAll<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM products WHERE status = 'published' ORDER BY slug"
  );
  const categories = await queryAll<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM categories ORDER BY slug"
  );
  const articles = await queryAll<{ slug: string; updated_at: string }>(
    "SELECT slug, published_at as updated_at FROM articles WHERE published_at IS NOT NULL ORDER BY slug"
  );
  const brands = await queryAll<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM brands ORDER BY slug"
  );

  const urls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
    { loc: baseUrl, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/#/shop`, priority: "0.9", changefreq: "daily" },
    { loc: `${baseUrl}/#/collections`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/#/brands`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/#/journal`, priority: "0.7", changefreq: "weekly" },
    { loc: `${baseUrl}/#/about`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/#/faq`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/#/contact`, priority: "0.5", changefreq: "monthly" },
    ...products.map((p: any) => ({
      loc: `${baseUrl}/#/product/${p.slug}`,
      priority: "0.7", changefreq: "weekly",
      lastmod: p.updated_at || undefined,
    })),
    ...categories.map((c: any) => ({
      loc: `${baseUrl}/#/shop?category=${c.slug}`,
      priority: "0.6", changefreq: "weekly",
      lastmod: c.updated_at || undefined,
    })),
    ...articles.map((a: any) => ({
      loc: `${baseUrl}/#/journal/${a.slug}`,
      priority: "0.6", changefreq: "monthly",
      lastmod: a.updated_at || undefined,
    })),
    ...brands.map((b: any) => ({
      loc: `${baseUrl}/#/brands/${b.slug}`,
      priority: "0.5", changefreq: "monthly",
      lastmod: b.updated_at || undefined,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>
    ${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`).join("\n")}
</urlset>`;

  c.header("Content-Type", "application/xml");
  return c.body(xml);
});

/* ================================================================== */
/*  WEBHOOKS                                                           */
/* ================================================================== */

system.get("/webhooks", async (c) => {
  const result = await queryAll("SELECT * FROM payment_gateways");
  return c.json(result);
});

system.post("/webhooks", async (c) => {
  const body = await c.req.json();
  const id = uuidv4();
  await queryOne(
    "INSERT INTO webhooks (id, name, url, secret, events, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [id, body.name || "webhook", body.url, body.secret || null, JSON.stringify(body.events || []), body.active !== false, new Date().toISOString()],
  );
  return c.json({ id, ...body, created_at: new Date() }, 201);
});

system.patch("/webhooks/:id", async (c) => {
  const body = await c.req.json();
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "created_at") continue;
    updates.push(`${key} = $${idx}`);
    values.push(key === "events" ? JSON.stringify(val) : val);
    idx++;
  }
  if (updates.length > 0) {
    updates.push(`updated_at = NOW()`);
    values.push(c.req.param("id"));
    await queryOne(`UPDATE webhooks SET ${updates.join(", ")} WHERE id = $${idx}`, values);
  }
  const result = await queryOne("SELECT * FROM webhooks WHERE id = $1", [c.req.param("id")]);
  return c.json(result);
});

system.delete("/webhooks/:id", async (c) => {
  try {
    await queryOne("DELETE FROM webhooks WHERE id = $1", [c.req.param("id")]);
    return c.json({ success: true });
  } catch {
    return c.json({ success: false }, 400);
  }
});

system.get("/webhooks/deliveries", async (c) => {
  const result = await queryAll("SELECT * FROM webhooks ORDER BY created_at DESC LIMIT 50");
  return c.json(result);
});

/* ================================================================== */
/*  AI                                                                 */
/* ================================================================== */

system.get("/ai/agents", async (c) => {
  return c.json({
    agents: [
      { id: "gpt-4o", name: "GPT-4o", provider: "openai", status: "available" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", status: "available" },
    ],
    total: 2,
    available: 2,
  });
});

system.get("/ai/agents/:id", async (c) => {
  return c.json({ id: c.req.param("id"), status: "unknown" });
});

system.get("/ai/tasks", async (c) => {
  try {
    const tasks = await queryAll("SELECT * FROM jobs WHERE type ILIKE 'ai_%' ORDER BY created_at DESC LIMIT 50");
    return c.json(tasks);
  } catch {
    return c.json([]);
  }
});

system.get("/ai/tasks/:id", async (c) => {
  try {
    const task = await queryOne("SELECT * FROM jobs WHERE id = $1", [c.req.param("id")]);
    return c.json(task || { id: c.req.param("id"), status: "unknown" });
  } catch {
    return c.json({ id: c.req.param("id"), status: "unknown" });
  }
});

system.get("/ai/knowledge", async (c) => {
  try {
    const stats = await queryOne(
      "SELECT COUNT(*) as documents FROM articles"
    );
    return c.json({
      documents: Number(stats?.documents || 0),
      chunks: 0,
      lastIndexed: null,
    });
  } catch {
    return c.json({ documents: 0, chunks: 0, lastIndexed: null });
  }
});

system.get("/ai/models", async (c) => {
  try {
    const { getModels } = await import("../services/aiEngine.js");
    return c.json(await getModels());
  } catch {
    return c.json([
      { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", costPerToken: 0.00001 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", costPerToken: 0.000001 },
    ]);
  }
});

system.post("/ai/generate", async (c) => {
  let promptText = "";
  let modelId = "gpt-4o";
  try {
    const body = await c.req.json<{ prompt: string; model?: string }>();
    promptText = body.prompt || "";
    modelId = body.model || "gpt-4o";
    return c.json({
      generated: `Generated content for: "${promptText.slice(0, 50)}"`,
      model: modelId,
      tokens: promptText.length,
      cost: (promptText.length * 0.00001).toFixed(6),
    });
  } catch {
    return c.json({
      generated: `Content generation unavailable`,
      model: modelId,
      tokens: 0,
      cost: "0",
    });
  }
});

/* ================================================================== */
/*  IMPORT ENGINE — Enterprise Bulk Import                              */
/* ================================================================== */

import { importProducts, getImportStatus, cancelImport } from "../services/importer.js";
import { exportProducts, exportOrders, exportCustomers } from "../services/exporter.js";

/**
 * POST /import/products — Bulk import products with batch processing.
 * Body: { products: [...], config?: { batchSize, dryRun, upsert, autoSlug, autoSku } }
 */
system.post("/import/products", async (c) => {
  try {
    const body = await c.req.json<{
      products: Record<string, unknown>[];
      config?: {
        batchSize?: number;
        dryRun?: boolean;
        upsert?: boolean;
        autoSlug?: boolean;
        autoSku?: boolean;
        skipValidation?: boolean;
        resume?: boolean;
        importId?: string;
        background?: boolean;
      };
    }>();

    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return c.json({ code: "VALIDATION_ERROR", message: "Products array is required and must not be empty" }, 400);
    }

    if (body.products.length > 50000) {
      return c.json({ code: "TOO_MANY_RECORDS", message: "Maximum 50,000 products per import request" }, 400);
    }

    const result = await importProducts(body.products, {
      batchSize: body.config?.batchSize ?? 500,
      dryRun: body.config?.dryRun ?? false,
      upsert: body.config?.upsert ?? true,
      autoSlug: body.config?.autoSlug ?? true,
      autoSku: body.config?.autoSku ?? true,
      skipValidation: body.config?.skipValidation ?? false,
      resume: body.config?.resume ?? false,
      importId: body.config?.importId,
      background: body.config?.background ?? false,
    });

    const statusCode = result.success ? 200 : 422;
    return c.json(result, statusCode);
  } catch (err: any) {
    return c.json({
      code: "IMPORT_ERROR",
      message: err.message || "Import failed",
      success: false,
    }, 500);
  }
});

/**
 * GET /import/products/:id — Get import status and results.
 */
system.get("/import/products/:id", async (c) => {
  const status = await getImportStatus(c.req.param("id"));
  if (!status) return c.json({ code: "NOT_FOUND", message: "Import not found" }, 404);
  return c.json(status);
});

/**
 * POST /import/products/:id/cancel — Cancel a running import.
 */
system.post("/import/products/:id/cancel", async (c) => {
  const ok = await cancelImport(c.req.param("id"));
  return c.json({ success: ok });
});

/* ================================================================== */
/*  EXPORT ENGINE — Enterprise Memory-Safe Export                       */
/* ================================================================== */

/**
 * GET /export/products — Export products with pagination and format options.
 * Query params: format (json|csv|ndjson), pageSize, maxRecords, status, category, brand, search
 */
system.get("/export/products", async (c) => {
  try {
    const query = c.req.query();
    const result = await exportProducts(
      {
        format: (query.format as any) || "json",
        pageSize: Number(query.pageSize) || 500,
        maxRecords: Number(query.maxRecords) || 0,
        fields: query.fields ? query.fields.split(",") : undefined,
        includeMetadata: query.metadata !== "false",
      },
      {
        status: query.status,
        category: query.category,
        brand: query.brand,
        featured: query.featured === "true" ? true : undefined,
        inStock: query.inStock === "true" ? true : undefined,
        search: query.search,
      },
    );

    // Set content-type header based on format
    if (result.format === "csv") {
      c.header("Content-Type", "text/csv");
      c.header("Content-Disposition", `attachment; filename="${result.filename}"`);
      return c.body(result.csv!);
    }
    if (result.format === "ndjson") {
      c.header("Content-Type", "application/x-ndjson");
      c.header("Content-Disposition", `attachment; filename="${result.filename}"`);
      return c.body(result.ndjson!);
    }

    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "EXPORT_ERROR", message: err.message || "Export failed" }, 500);
  }
});

/**
 * GET /export/orders — Export orders with pagination and format options.
 */
system.get("/export/orders", async (c) => {
  try {
    const query = c.req.query();
    const result = await exportOrders(
      {
        format: (query.format as any) || "json",
        pageSize: Number(query.pageSize) || 500,
        maxRecords: Number(query.maxRecords) || 0,
      },
      { status: query.status },
    );

    if (result.format === "csv") {
      c.header("Content-Type", "text/csv");
      c.header("Content-Disposition", `attachment; filename="${result.filename}"`);
      return c.body(result.csv!);
    }

    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "EXPORT_ERROR", message: err.message || "Export failed" }, 500);
  }
});

/**
 * GET /export/customers — Export customers with pagination and format options.
 */
system.get("/export/customers", async (c) => {
  try {
    const query = c.req.query();
    const result = await exportCustomers(
      {
        format: (query.format as any) || "json",
        pageSize: Number(query.pageSize) || 500,
        maxRecords: Number(query.maxRecords) || 0,
      },
      { status: query.status },
    );

    if (result.format === "csv") {
      c.header("Content-Type", "text/csv");
      c.header("Content-Disposition", `attachment; filename="${result.filename}"`);
      return c.body(result.csv!);
    }

    return c.json(result);
  } catch (err: any) {
    return c.json({ code: "EXPORT_ERROR", message: err.message || "Export failed" }, 500);
  }
});

export { system };
