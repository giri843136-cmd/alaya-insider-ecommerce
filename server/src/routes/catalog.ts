/**
 * ALAYA INSIDER — Catalog Routes (Products, Categories, Brands, Search)
 */

import { Hono } from "hono";
import { getStore, CRUD, searchItems, paginateFromParams, genId, type Product, type Category, type Brand } from "../db.js";

const catalog = new Hono();

/* ================================================================== */
/*  PRODUCTS                                                           */
/* ================================================================== */

catalog.get("/products", (c) => {
  const params = c.req.query();
  let products = getStore().products;
  // Filter by category
  if (params.category) products = products.filter((p) => p.category === params.category);
  // Filter by featured/bestSeller/isNew
  if (params.featured === "true") products = products.filter((p) => p.featured);
  if (params.bestseller === "true") products = products.filter((p) => p.bestSeller);
  if (params.new === "true") products = products.filter((p) => p.isNew);
  // Price range
  if (params.minPrice) products = products.filter((p) => p.price >= Number(params.minPrice));
  if (params.maxPrice) products = products.filter((p) => p.price <= Number(params.maxPrice));
  return c.json(searchItems(products, params, ["name", "brand", "sku", "category"]));
});

catalog.get("/products/slug/:slug", (c) => {
  const product = getStore().products.find((p) => p.slug === c.req.param("slug"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json(product);
});

catalog.get("/products/:id", (c) => {
  const product = CRUD.get(getStore().products, c.req.param("id"));
  if (!product) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json(product);
});

catalog.post("/products", async (c) => {
  const body = await c.req.json<Partial<Product>>();
  const product: Product = {
    id: body.id ?? genId("prod"),
    slug: body.slug ?? "",
    name: body.name ?? "New Product",
    brand: body.brand ?? "", brandId: body.brandId,
    category: body.category ?? "general", type: body.type ?? "physical",
    price: body.price ?? 0, salePrice: body.salePrice ?? null,
    rating: body.rating ?? 5, reviewCount: body.reviewCount ?? 0,
    images: body.images ?? [], shortDescription: body.shortDescription ?? "",
    description: body.description ?? "", features: body.features ?? [],
    variants: body.variants, stock: body.stock ?? 0, sku: body.sku ?? "",
    tags: body.tags ?? [], reviews: body.reviews ?? [],
    affiliate: body.affiliate, affiliateUrl: body.affiliateUrl,
    affiliatePartner: body.affiliatePartner,
    featured: body.featured, bestSeller: body.bestSeller, isNew: body.isNew,
    status: body.status ?? "published", createdAt: Date.now(),
  };
  getStore().products.unshift(product);
  return c.json(product, 201);
});

catalog.patch("/products/:id", async (c) => {
  const patch = await c.req.json<Partial<Product>>();
  const updated = CRUD.update(getStore().products, c.req.param("id"), patch);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json(updated);
});

catalog.delete("/products/:id", (c) => {
  const ok = CRUD.remove(getStore().products, c.req.param("id"));
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Product not found" }, 404);
  return c.json({ success: true });
});

catalog.post("/products/bulk", async (c) => {
  const body = await c.req.json<{ action: string; ids: string[] }>();
  if (body.action === "delete") {
    body.ids.forEach((id) => CRUD.remove(getStore().products, id));
  }
  return c.json({ success: true, affected: body.ids.length });
});

/* ================================================================== */
/*  CATEGORIES                                                         */
/* ================================================================== */

catalog.get("/categories", (c) => {
  return c.json(paginateFromParams(getStore().categories, c.req.query()));
});

catalog.get("/categories/:id", (c) => {
  const item = CRUD.get(getStore().categories, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json(item);
});

catalog.post("/categories", async (c) => {
  const body = await c.req.json<Partial<Category>>();
  const cat: Category = { id: body.id ?? genId("cat"), slug: body.slug ?? "", name: body.name ?? "", tagline: body.tagline ?? "", description: body.description ?? "", image: body.image ?? "", order: body.order ?? 0 };
  getStore().categories.push(cat);
  return c.json(cat, 201);
});

catalog.patch("/categories/:id", async (c) => {
  const updated = CRUD.update(getStore().categories, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json(updated);
});

catalog.delete("/categories/:id", (c) => {
  if (!CRUD.remove(getStore().categories, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  BRANDS                                                             */
/* ================================================================== */

catalog.get("/brands", (c) => {
  return c.json(paginateFromParams(getStore().brands, c.req.query()));
});

catalog.get("/brands/:id", (c) => {
  const item = CRUD.get(getStore().brands, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Brand not found" }, 404);
  return c.json(item);
});

catalog.post("/brands", async (c) => {
  const body = await c.req.json<Partial<Brand>>();
  const brand: Brand = { id: body.id ?? genId("brand"), name: body.name ?? "", slug: body.slug ?? "", tagline: body.tagline ?? "", description: body.description ?? "", image: body.image ?? "", logo: body.logo, country: body.country ?? "Global", featured: body.featured ?? false };
  getStore().brands.push(brand);
  return c.json(brand, 201);
});

catalog.patch("/brands/:id", async (c) => {
  const updated = CRUD.update(getStore().brands, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Category not found" }, 404);
  return c.json(updated);
});

catalog.delete("/brands/:id", (c) => {
  if (!CRUD.remove(getStore().brands, c.req.param("id"))) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SEARCH                                                             */
/* ================================================================== */

catalog.get("/search", (c) => {
  const q = c.req.query("q") ?? "";
  const products = getStore().products.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.brand?.toLowerCase().includes(q.toLowerCase()) ||
    p.tags?.some((t) => t.toLowerCase().includes(q.toLowerCase()))
  );
  return c.json(paginateFromParams(products, c.req.query()));
});

export { catalog };
