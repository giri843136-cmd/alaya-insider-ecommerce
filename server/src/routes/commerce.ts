/**
 * ALAYA INSIDER — Commerce Routes (Orders, Coupons, Gateways, Suppliers, Returns)
 *
 * Migrated to PostgreSQL repositories (v2.0.0)
 */

import { Hono } from "hono";
import { orders, coupons, gateways, suppliers, returns } from "../db/repositories/index.js";

const commerce = new Hono();

/* ================================================================== */
/*  ORDERS                                                             */
/* ================================================================== */

commerce.get("/orders", async (c) => {
  const result = await orders.list(c.req.query() as any);
  return c.json(result);
});

commerce.get("/orders/:id", async (c) => {
  const item = await orders.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json(item);
});

commerce.post("/orders", async (c) => {
  const body = await c.req.json<any>();
  const order = await orders.create({
    number: body.number || `AL-${Math.floor(100000 + Math.random() * 900000)}`,
    items: body.items || [],
    subtotal: body.subtotal ?? body.items?.reduce((s: number, it: any) => s + it.price * it.qty, 0) ?? 0,
    discount: body.discount ?? 0,
    shipping: body.shipping ?? 0,
    tax: body.tax ?? 0,
    total: body.total ?? 0,
    currency: body.currency || "USD",
    customer_id: body.customer_id || body.customer?.id,
    customer_name: body.customer_name || body.customer?.name || "",
    customer_email: body.customer_email || body.customer?.email || "",
    status: body.status || "paid",
  } as any, "api");
  return c.json(order, 201);
});

commerce.patch("/orders/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: string }>();
  const updated = await orders.update(c.req.param("id"), { status } as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json(updated);
});

commerce.patch("/orders/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await orders.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json(updated);
});

commerce.delete("/orders/:id", async (c) => {
  const ok = await orders.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  COUPONS                                                            */
/* ================================================================== */

commerce.get("/coupons", async (c) => {
  const result = await coupons.list(c.req.query() as any);
  return c.json(result);
});

commerce.get("/coupons/:id", async (c) => {
  const item = await coupons.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Coupon not found" }, 404);
  return c.json(item);
});

commerce.post("/coupons", async (c) => {
  const body = await c.req.json<any>();
  const coupon = await coupons.create({
    code: (body.code || "").toUpperCase(),
    type: body.type || "percent",
    value: body.value ?? 0,
    min_spend: body.minSpend ?? body.min_spend ?? 0,
    active: body.active ?? true,
    description: body.description || "",
    usage_limit: body.usageLimit ?? body.usage_limit,
    used_count: body.usedCount ?? body.used_count ?? 0,
    expires_at: body.expiresAt ?? body.expires_at,
  } as any, "api");
  return c.json(coupon, 201);
});

commerce.patch("/coupons/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await coupons.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Coupon not found" }, 404);
  return c.json(updated);
});

commerce.delete("/coupons/:id", async (c) => {
  const ok = await coupons.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Coupon not found" }, 404);
  return c.json({ success: true });
});

commerce.post("/coupons/validate", async (c) => {
  const { code, subtotal } = await c.req.json<{ code: string; subtotal: number }>();
  const result = await coupons.validateCoupon(code, subtotal);
  return c.json(result);
});

/* ================================================================== */
/*  PAYMENT GATEWAYS                                                   */
/* ================================================================== */

commerce.get("/gateways", async (c) => {
  const query = c.req.query();
  if (query.active === "true") {
    const active = await gateways.getActiveForCountry();
    return c.json({ data: active, total: active.length, page: 1, pageSize: active.length, hasMore: false });
  }
  const result = await gateways.list(query as any);
  return c.json(result);
});

commerce.get("/gateways/:id", async (c) => {
  const item = await gateways.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Gateway not found" }, 404);
  return c.json(item);
});

commerce.post("/gateways", async (c) => {
  const body = await c.req.json<any>();
  const gw = await gateways.create(body as any, "api");
  return c.json(gw, 201);
});

commerce.patch("/gateways/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await gateways.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Gateway not found" }, 404);
  return c.json(updated);
});

commerce.delete("/gateways/:id", async (c) => {
  const ok = await gateways.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Gateway not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SUPPLIERS                                                          */
/* ================================================================== */

commerce.get("/suppliers", async (c) => {
  const result = await suppliers.list(c.req.query() as any);
  return c.json(result);
});

commerce.get("/suppliers/:id", async (c) => {
  const item = await suppliers.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json(item);
});

commerce.post("/suppliers", async (c) => {
  const body = await c.req.json<any>();
  const sup = await suppliers.create(body as any, "api");
  return c.json(sup, 201);
});

commerce.patch("/suppliers/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await suppliers.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json(updated);
});

commerce.delete("/suppliers/:id", async (c) => {
  const ok = await suppliers.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  RETURNS                                                            */
/* ================================================================== */

commerce.get("/returns", async (c) => {
  const result = await returns.list(c.req.query() as any);
  return c.json(result);
});

commerce.get("/returns/:id", async (c) => {
  const item = await returns.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Return not found" }, 404);
  return c.json(item);
});

commerce.post("/returns", async (c) => {
  const body = await c.req.json<any>();
  const ret = await returns.create({
    number: body.number || `RT-${Math.floor(100000 + Math.random() * 900000)}`,
    order_id: body.orderId ?? body.order_id ?? "",
    order_number: body.orderNumber ?? body.order_number ?? "",
    customer_name: body.customer?.name || body.customer_name || "",
    customer_email: body.customer?.email || body.customer_email || "",
    type: body.type || "refund",
    reason: body.reason || "",
    status: body.status || "requested",
  } as any, "api");
  return c.json(ret, 201);
});

commerce.patch("/returns/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await returns.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Return not found" }, 404);
  return c.json(updated);
});

export { commerce };
