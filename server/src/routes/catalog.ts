/**
 * ALAYA INSIDER — Catalog Routes (Products, Categories, Brands, Search)
 *
 * v2.1.0 — Auto slug/SKU generation, validation pipeline, bulk operations,
 *           status workflow (draft/pending/published/scheduled/archived/rejected/deleted),
 *           variant support, full-text search.
 */

import { Hono } from "hono";
import { products, categories, brands } from "../db/repositories/index.js";
import { queryOne, queryAll } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";
import { generateSlug, regenerateSlug, validateSlug } from "../services/slug.js";
import { generateSku } from "../services/sku.js";
import { validateProduct, validateCategory, validateBrand, sanitizeProduct } from "../services/validation.js";

const catalog = new Hono();

/* ================================================================== */
/*  PRODUCT STATUS WORKFLOW CONSTANTS                                  */
/* ================================================================== */

const VALID_STATUSES = [
  "draft", "pending_review", "published", "scheduled",
  "archived", "rejected", "deleted",
] as const;

type ProductStatus = (typeof VALID_STATUSES)[number];

const STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ["pending_review", "published", "archived", "deleted"],
  pending_review: ["published", "rejected", "draft", "deleted"],
  published: ["archived", "draft", "deleted"],
  scheduled: ["published", "draft", "deleted"],
  archived: ["draft", "published", "deleted"],
  rejected: ["draft", "deleted"],
  deleted: [], // terminal state
};

function isValidTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from as ProductStatus];
  if (!allowed) return false;
  return allowed.includes(to as ProductStatus);
}

/* ================================================================== */
/*  PRODUCTS                                                           */
/* ================================================================== */

catalog.get("/products", async (c) => {
  const params = c.req.query();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 24));

  // Build query with filters
  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Admin includes deleted products unless filtered out
  if (params.includeDeleted !== "true") {
    conditions.push("(status IS NULL OR status != 'deleted')");
  }

  if (params.search) {
    queryParams.push(`%${params.search}%`);
    conditions.push(
      `(name::text ILIKE $${paramIndex} OR short_description::text ILIKE $${paramIndex} OR brand::text ILIKE $${paramIndex} OR sku::text ILIKE $${paramIndex})`
    );
    paramIndex++;
  }

  if (params.category) {
    queryParams.push(params.category);
    conditions.push(`(category_id = $${paramIndex} OR category = $${paramIndex})`);
    paramIndex++;
  }

  if (params.brand) {
    queryParams.push(params.brand);
    conditions.push(`(brand_id = $${paramIndex} OR brand = $${paramIndex})`);
    paramIndex++;
  }

  if (params.status) {
    // Allow filtering by multiple comma-separated statuses
    const statuses = params.status.split(",");
    const statusParams = statuses.map((s: string, i: number) => `$${paramIndex + i}`).join(",");
    queryParams.push(...statuses);
    conditions.push(`status IN (${statusParams})`);
    paramIndex += statuses.length;
  } else if (!params.includeDeleted) {
    conditions.push("status = 'published'");
  }

  if (params.featured === "true") conditions.push("featured = true");
  if (params.bestseller === "true") conditions.push("best_seller = true");
  if (params.new === "true") conditions.push("is_new = true");
  if (params.affiliate === "true") conditions.push("affiliate = true");

  if (params.minPrice) {
    queryParams.push(Number(params.minPrice));
    conditions.push(`price >= $${paramIndex++}`);
  }
  if (params.maxPrice) {
    queryParams.push(Number(params.maxPrice));
    conditions.push(`price <= $${paramIndex++}`);
  }

  if (params.inStock === "true") {
    conditions.push("stock > 0");
  }

  if (params.tag) {
    queryParams.push(params.tag);
    conditions.push(`$${paramIndex} = ANY(tags)`);
    paramIndex++;
  }

  if (params.type) {
    queryParams.push(params.type);
    conditions.push(`type = $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get total count
  const count = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM products ${whereClause}`, queryParams
  );
  const total = Number(count?.count ?? 0);

  // Sort — validate sort column to prevent SQL injection
  const allowedSorts = ["created_at", "updated_at", "name", "price", "rating", "stock", "sale_price", "featured"];
  const sortCol = params.sort && allowedSorts.includes(params.sort) ? params.sort : "created_at";
  const sortDir = params.order === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * pageSize;

  const dataParams = [...queryParams, pageSize, offset];
  const dataSql = `SELECT * FROM products ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  const data = await queryAll(dataSql, dataParams);

  return c.json({ data, total, page, pageSize, hasMore: page * pageSize < total });
});

catalog.get("/products/slug/:slug", async (c) => {
  const product = await products.findBySlug(c.req.param("slug"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json(product);
});

catalog.get("/products/:id", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json(product);
});

catalog.post("/products", async (c) => {
  const body = await c.req.json<any>();

  // Sanitize input
  const sanitized = sanitizeProduct(body);

  // Validate
  const validation = validateProduct(sanitized);
  if (!validation.valid) {
    return c.json({
      code: "VALIDATION_ERROR",
      message: "Product validation failed",
      errors: validation.errors,
      warnings: validation.warnings,
    }, 400);
  }

  // Auto-generate slug if not provided
  const slug = sanitized.slug
    ? sanitized.slug as string
    : await generateSlug(sanitized.name as string, "products");

  // Auto-generate SKU if not provided
  const sku = sanitized.sku
    ? sanitized.sku as string
    : await generateSku(sanitized.category as string);

  const product = await products.create({
    slug,
    name: sanitized.name || "New Product",
    brand: sanitized.brand as string || "",
    brand_id: sanitized.brandId ?? sanitized.brand_id,
    category: sanitized.category as string || "general",
    type: sanitized.type as string || "physical",
    price: sanitized.price ?? 0,
    sale_price: sanitized.salePrice ?? sanitized.sale_price,
    cost_price: sanitized.costPrice ?? sanitized.cost_price,
    rating: sanitized.rating ?? 5,
    review_count: (sanitized.reviewCount ?? sanitized.review_count) ?? 0,
    images: sanitized.images || [],
    short_description: (sanitized.shortDescription ?? sanitized.short_description) || "",
    description: sanitized.description || "",
    features: sanitized.features || [],
    variants: sanitized.variants || [],
    stock: sanitized.stock ?? 0,
    sku,
    tags: sanitized.tags || [],
    barcode: sanitized.barcode || "",
    gtin: sanitized.gtin || "",
    asin: sanitized.asin || "",
    supplier_id: sanitized.supplierId ?? sanitized.supplier_id,
    affiliate: sanitized.affiliate ?? false,
    affiliate_url: sanitized.affiliateUrl ?? sanitized.affiliate_url,
    affiliate_partner: sanitized.affiliatePartner ?? sanitized.affiliate_partner,
    affiliate_network: sanitized.affiliateNetwork ?? sanitized.affiliate_network,
    affiliate_commission: sanitized.affiliateCommission ?? sanitized.affiliate_commission,
    reviews: sanitized.reviews || [],
    specs: sanitized.specs || [],
    featured: sanitized.featured ?? false,
    best_seller: sanitized.bestSeller ?? sanitized.best_seller ?? false,
    is_new: sanitized.isNew ?? sanitized.is_new ?? false,
    coming_soon: sanitized.comingSoon ?? false,
    preorder: sanitized.preorder ?? false,
    status: sanitized.status || "published",
  } as any, "api");

  return c.json(product, 201);
});

catalog.patch("/products/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json<any>();

  // If name changed, regenerate slug (unless slug explicitly provided)
  if (patch.name && !patch.slug) {
    patch.slug = await regenerateSlug(patch.name as string, "products", id);
  }

  // If category changed and no explicit SKU, regenerate SKU
  if (patch.category && !patch.sku) {
    patch.sku = await generateSku(patch.category as string);
  }

  // Status transition validation
  if (patch.status) {
    const current = await products.getById(id);
    if (current && current.status && !isValidTransition(current.status, patch.status as string)) {
      return c.json({
        code: "INVALID_TRANSITION",
        message: `Cannot transition from "${current.status}" to "${patch.status}"`,
        validTransitions: STATUS_TRANSITIONS[current.status as ProductStatus] || [],
      }, 400);
    }
  }

  const updated = await products.update(id, patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json(updated);
});

catalog.delete("/products/:id", async (c) => {
  const id = c.req.param("id");
  // Soft delete — set status to 'deleted'
  const updated = await products.update(id, { status: "deleted" } as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json({ success: true, message: "Product soft-deleted" });
});

/* ================================================================== */
/*  BULK OPERATIONS                                                    */
/* ================================================================== */

catalog.post("/products/bulk", async (c) => {
  const body = await c.req.json<{
    action: string;
    ids: string[];
    value?: any;
  }>();

  let affected = 0;
  const errors: Array<{ id: string; error: string }> = [];

  switch (body.action) {
    case "delete":
      for (const id of body.ids) {
        const ok = await products.update(id, { status: "deleted" } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "restore":
      for (const id of body.ids) {
        const ok = await products.update(id, { status: "draft" } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "publish":
      for (const id of body.ids) {
        const ok = await products.update(id, { status: "published" } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "archive":
      for (const id of body.ids) {
        const ok = await products.update(id, { status: "archived" } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "draft":
      for (const id of body.ids) {
        const ok = await products.update(id, { status: "draft" } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "feature":
      for (const id of body.ids) {
        const ok = await products.update(id, { featured: body.value ?? true } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "bestseller":
      for (const id of body.ids) {
        const ok = await products.update(id, { best_seller: body.value ?? true } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "updateCategory":
      for (const id of body.ids) {
        const ok = await products.update(id, { category: body.value } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "updatePrice":
      for (const id of body.ids) {
        const ok = await products.update(id, { price: body.value } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    case "updateStatus":
      for (const id of body.ids) {
        const current = await products.getById(id);
        if (current && current.status && !isValidTransition(current.status, body.value)) {
          errors.push({ id, error: `Cannot transition from "${current.status}" to "${body.value}"` });
          continue;
        }
        const ok = await products.update(id, { status: body.value } as any, "api");
        if (ok) affected++;
        else errors.push({ id, error: "Not found" });
      }
      break;

    default:
      return c.json({ code: "INVALID_ACTION", message: `Unknown bulk action: "${body.action}"` }, 400);
  }

  return c.json({
    success: true,
    action: body.action,
    affected,
    total: body.ids.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/* ================================================================== */
/*  VARIANTS (CRUD)                                                   */
/* ================================================================== */

catalog.get("/products/:id/variants", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json({
    data: (product.variants || []) as any[],
    total: (product.variants || []).length,
  });
});

catalog.post("/products/:id/variants", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);

  const body = await c.req.json<{
    name: string;
    options: string[];
  }>();

  if (!body.name || !body.options || body.options.length === 0) {
    return c.json({
      code: "VALIDATION_ERROR",
      message: "Variant name and at least one option are required",
    }, 400);
  }

  const currentVariants = (product.variants || []) as any[];
  const updatedVariants = [...currentVariants, { name: body.name, options: body.options }];

  await products.update(c.req.param("id"), { variants: updatedVariants } as any, "api");
  return c.json({ data: updatedVariants }, 201);
});

catalog.put("/products/:id/variants/:index", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);

  const index = parseInt(c.req.param("index"), 10);
  const currentVariants = (product.variants || []) as any[];

  if (index < 0 || index >= currentVariants.length) {
    return c.json({ code: "NOT_FOUND", message: "Variant not found" }, 404);
  }

  const body = await c.req.json<{ name?: string; options?: string[] }>();
  currentVariants[index] = { ...currentVariants[index], ...body };

  await products.update(c.req.param("id"), { variants: currentVariants } as any, "api");
  return c.json({ data: currentVariants });
});

catalog.delete("/products/:id/variants/:index", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);

  const index = parseInt(c.req.param("index"), 10);
  const currentVariants = (product.variants || []) as any[];

  if (index < 0 || index >= currentVariants.length) {
    return c.json({ code: "NOT_FOUND", message: "Variant not found" }, 404);
  }

  currentVariants.splice(index, 1);
  await products.update(c.req.param("id"), { variants: currentVariants } as any, "api");
  return c.json({ success: true, data: currentVariants });
});

/* ================================================================== */
/*  PRODUCT IMAGES                                                     */
/* ================================================================== */

catalog.post("/products/:id/images", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);

  const body = await c.req.json<{ url: string; alt?: string }>();
  if (!body.url) {
    return c.json({ code: "VALIDATION_ERROR", message: "Image URL is required" }, 400);
  }

  const currentImages = (product.images || []) as string[];
  currentImages.push(body.url);

  await products.update(c.req.param("id"), { images: currentImages } as any, "api");
  return c.json({ data: currentImages }, 201);
});

catalog.delete("/products/:id/images/:index", async (c) => {
  const product = await products.getById(c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);

  const index = parseInt(c.req.param("index"), 10);
  const currentImages = (product.images || []) as string[];

  if (index < 0 || index >= currentImages.length) {
    return c.json({ code: "NOT_FOUND", message: "Image not found" }, 404);
  }

  currentImages.splice(index, 1);
  await products.update(c.req.param("id"), { images: currentImages } as any, "api");
  return c.json({ success: true, data: currentImages });
});

/* ================================================================== */
/*  CATEGORIES                                                         */
/* ================================================================== */

catalog.get("/categories", async (c) => {
  const params = c.req.query();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 50));

  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.search) {
    queryParams.push(`%${params.search}%`);
    conditions.push(`(name::text ILIKE $${paramIndex} OR description::text ILIKE $${paramIndex})`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get product counts per category
  const result = await queryAll(
    `SELECT c.*, COUNT(p.id) FILTER (WHERE p.status = 'published') as product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, pageSize, (page - 1) * pageSize],
  );

  const count = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM categories ${whereClause}`, queryParams
  );

  return c.json({
    data: result,
    total: Number(count?.count ?? 0),
    page,
    pageSize,
    hasMore: page * pageSize < Number(count?.count ?? 0),
  });
});

catalog.get("/categories/tree", async (c) => {
  // Returns nested category tree
  const all = await queryAll(
    `SELECT c.*, COUNT(p.id) FILTER (WHERE p.status = 'published') as product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  // Build tree
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const cat of all) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of all) {
    const node = map.get(cat.id);
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return c.json({ data: roots, total: all.length });
});

catalog.get("/categories/:id", async (c) => {
  const item = await categories.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json(item);
});

catalog.post("/categories", async (c) => {
  const body = await c.req.json<any>();

  const validation = validateCategory(body);
  if (!validation.valid) {
    return c.json({ code: "VALIDATION_ERROR", message: "Category validation failed", errors: validation.errors }, 400);
  }

  const slug = body.slug || await generateSlug(body.name, "categories");

  const cat = await categories.create({
    name: body.name || "",
    slug,
    tagline: body.tagline || "",
    description: body.description || "",
    image: body.image || "",
    parent_id: body.parentId || body.parent_id || null,
    sort_order: body.sortOrder ?? body.sort_order ?? 0,
  } as any, "api");

  return c.json(cat, 201);
});

catalog.patch("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json<any>();

  if (patch.name && !patch.slug) {
    patch.slug = await regenerateSlug(patch.name, "categories", id);
  }

  const updated = await categories.update(id, patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json(updated);
});

catalog.delete("/categories/:id", async (c) => {
  const id = c.req.param("id");

  // Check for child categories
  const children = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM categories WHERE parent_id = $1", [id]
  );
  if (Number(children?.count ?? 0) > 0) {
    return c.json({
      code: "HAS_CHILDREN",
      message: `Cannot delete category: ${children?.count} child categories exist. Reassign or delete children first.`,
    }, 400);
  }

  // Check for products — ON DELETE RESTRICT in schema
  const ok = await categories.delete(id, "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  BRANDS                                                             */
/* ================================================================== */

catalog.get("/brands", async (c) => {
  const params = c.req.query();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 50));

  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.search) {
    queryParams.push(`%${params.search}%`);
    conditions.push(`(name::text ILIKE $${paramIndex} OR description::text ILIKE $${paramIndex})`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await queryAll(
    `SELECT b.*, COUNT(p.id) FILTER (WHERE p.status = 'published') as product_count
     FROM brands b
     LEFT JOIN products p ON p.brand_id = b.id
     ${whereClause}
     GROUP BY b.id
     ORDER BY b.featured DESC, b.name ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, pageSize, (page - 1) * pageSize],
  );

  const count = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM brands ${whereClause}`, queryParams
  );

  return c.json({
    data: result,
    total: Number(count?.count ?? 0),
    page,
    pageSize,
    hasMore: page * pageSize < Number(count?.count ?? 0),
  });
});

catalog.get("/brands/:id", async (c) => {
  const item = await brands.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Brand not found" }, 404);
  return c.json(item);
});

catalog.post("/brands", async (c) => {
  const body = await c.req.json<any>();

  const validation = validateBrand(body);
  if (!validation.valid) {
    return c.json({ code: "VALIDATION_ERROR", message: "Brand validation failed", errors: validation.errors }, 400);
  }

  const slug = body.slug || await generateSlug(body.name, "brands");

  const brand = await brands.create({
    name: body.name || "",
    slug,
    tagline: body.tagline || "",
    description: body.description || "",
    image: body.image || "",
    logo: body.logo || "",
    website: body.website || "",
    instagram: body.instagram || "",
    country: body.country || "Global",
    featured: body.featured ?? false,
  } as any, "api");

  return c.json(brand, 201);
});

catalog.patch("/brands/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json<any>();

  if (patch.name && !patch.slug) {
    patch.slug = await regenerateSlug(patch.name, "brands", id);
  }

  const updated = await brands.update(id, patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Brand not found" }, 404);
  return c.json(updated);
});

catalog.delete("/brands/:id", async (c) => {
  const ok = await brands.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Brand not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SEARCH — PostgreSQL Full-Text Search                               */
/* ================================================================== */

catalog.get("/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize")) || 24));
  const category = c.req.query("category");
  const minPrice = c.req.query("minPrice");
  const maxPrice = c.req.query("maxPrice");
  const inStock = c.req.query("inStock");
  const sort = c.req.query("sort") || "relevance";
  const order = c.req.query("order") || "desc";

  if (!q) {
    return c.json({ data: [], total: 0, page: 1, pageSize, hasMore: false, facets: null });
  }

  // Escape tsquery special characters
  const sanitized = q.replace(/[!&|():*]/g, " ").trim();
  if (!sanitized) {
    return c.json({ data: [], total: 0, page: 1, pageSize, hasMore: false, facets: null });
  }

  // Build tsquery — split into words, join with &
  const tsquery = sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");

  // Full-text search with ranking
  const conditions: string[] = [
    `to_tsvector('english', coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' || coalesce(brand, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce(description, ''))
     @@ to_tsquery('english', $1)`,
    "status = 'published'",
  ];

  // Also add ILIKE fallback for partial matches
  const ilikeCondition = `(name::text ILIKE $2 OR brand::text ILIKE $2 OR sku::text ILIKE $2)`;
  const params: any[] = [tsquery, `%${sanitized}%`];
  let paramIndex = 3;

  if (category) {
    params.push(category);
    conditions.push(`(category_id = $${paramIndex} OR category = $${paramIndex})`);
    paramIndex++;
  }

  if (minPrice) {
    params.push(Number(minPrice));
    conditions.push(`price >= $${paramIndex++}`);
  }

  if (maxPrice) {
    params.push(Number(maxPrice));
    conditions.push(`price <= $${paramIndex++}`);
  }

  if (inStock === "true") {
    conditions.push("stock > 0");
  }

  const whereClause = `WHERE ((${conditions.join(" AND ")}))`;
  const fullWhere = `WHERE ((${conditions.join(" AND ")}) OR ${ilikeCondition} AND status = 'published')`;

  // Get facets
  const facetPromise = queryAll<any>(
    `SELECT
       json_agg(DISTINCT jsonb_build_object('value', tags, 'count', 1)) as tags,
       COUNT(*) FILTER (WHERE stock > 0) as in_stock_count,
       MIN(price) as min_price,
       MAX(price) as max_price
     FROM products ${fullWhere}`,
    params,
  );

  // Get category facet
  const categoryFacetPromise = queryAll<any>(
    `SELECT category, COUNT(*) as count
     FROM products ${fullWhere}
     GROUP BY category
     ORDER BY count DESC
     LIMIT 20`,
    params,
  );

  // Get total count
  const countParams = [...params];
  const count = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM products ${fullWhere}`, countParams
  );
  const total = Number(count?.count ?? 0);

  // Determine sort
  let orderClause: string;
  switch (sort) {
    case "price":
      orderClause = `ORDER BY price ${order === "asc" ? "ASC" : "DESC"}`;
      break;
    case "name":
      orderClause = `ORDER BY name ${order === "asc" ? "ASC" : "DESC"}`;
      break;
    case "newest":
      orderClause = "ORDER BY created_at DESC";
      break;
    case "rating":
      orderClause = "ORDER BY rating DESC";
      break;
    default:
      // Relevance — ts_rank
      orderClause = `ORDER BY ts_rank(to_tsvector('english', coalesce(name, '') || ' ' ||
        coalesce(short_description, '') || ' ' || coalesce(brand, '') || ' ' ||
        coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce(description, '')),
        to_tsquery('english', $1)) DESC`;
      break;
  }

  const offset = (page - 1) * pageSize;
  const dataParams = [...params, pageSize, offset];
  const dataSql = `SELECT * FROM products ${fullWhere} ${orderClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

  const [data, facets, categoryFacets] = await Promise.all([
    queryAll(dataSql, dataParams),
    facetPromise,
    categoryFacetPromise,
  ]);

  // Record search term for analytics
  try {
    await queryOne(
      `INSERT INTO search_terms (term, results_count, searched_at)
       VALUES ($1, $2, NOW())`,
      [q, total],
    ).catch(() => {});
  } catch { /* ignore analytics errors */ }

  return c.json({
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    query: q,
    facets: {
      categories: categoryFacets || [],
      inStock: Number(facets?.[0]?.in_stock_count ?? 0),
      priceRange: {
        min: Number(facets?.[0]?.min_price ?? 0),
        max: Number(facets?.[0]?.max_price ?? 999999),
      },
    },
  });
});

/**
 * GET /search/autocomplete — Fast prefix search for autocomplete dropdowns.
 */
catalog.get("/search/autocomplete", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (!q || q.length < 2) {
    return c.json({ suggestions: [], products: [] });
  }

  const sanitized = q.replace(/[!&|():*]/g, " ").trim();
  const tsquery = sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");

  // Fast product suggestions (limit 8)
  const productsResult = await queryAll<any>(
    `SELECT id, slug, name, price, sale_price, images[1] as image,
            ts_rank(to_tsvector('english', name || ' ' || coalesce(short_description, '') || ' ' || coalesce(brand, '')),
                    to_tsquery('english', $1)) as rank
     FROM products
     WHERE to_tsvector('english', name || ' ' || coalesce(short_description, '') || ' ' || coalesce(brand, ''))
           @@ to_tsquery('english', $1)
        OR name::text ILIKE $2
     AND status = 'published'
     ORDER BY rank DESC
     LIMIT 8`,
    [tsquery, `%${sanitized}%`],
  );

  // Category suggestions
  const categoryResult = await queryAll<any>(
    `SELECT name, slug FROM categories
     WHERE name::text ILIKE $1
     LIMIT 5`,
    [`%${sanitized}%`],
  );

  // Brand suggestions
  const brandResult = await queryAll<any>(
    `SELECT name, slug FROM brands
     WHERE name::text ILIKE $1
     LIMIT 5`,
    [`%${sanitized}%`],
  );

  return c.json({
    suggestions: {
      categories: categoryResult,
      brands: brandResult,
    },
    products: productsResult,
    query: q,
  });
});

/**
 * GET /search/suggestions — Search term suggestions.
 */
catalog.get("/search/suggestions", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (!q || q.length < 2) {
    return c.json({ suggestions: [] });
  }

  // Get popular search terms matching the prefix
  const popularTerms = await queryAll<any>(
    `SELECT term, COUNT(*) as count
     FROM search_terms
     WHERE term::text ILIKE $1
     GROUP BY term
     ORDER BY count DESC
     LIMIT 10`,
    [`${q}%`],
  );

  return c.json({
    suggestions: popularTerms.map((t: any) => t.term),
    query: q,
  });
});

export { catalog };
