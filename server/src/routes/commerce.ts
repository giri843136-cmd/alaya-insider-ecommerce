/**
 * ALAYA INSIDER — Commerce Routes (Orders, Coupons, Gateways, Suppliers, Returns)
 */

import { Hono } from "hono";
import { getStore, CRUD, paginateFromParams, searchItems, genId, type Order, type Coupon, type PaymentGateway, type Supplier, type ReturnRequest } from "../db.js";

const commerce = new Hono();

/* ================================================================== */
/*  ORDERS                                                             */
/* ================================================================== */

commerce.get("/orders", (c) => {
  let orders = getStore().orders;
  const status = c.req.query("status");
  if (status) orders = orders.filter((o) => o.status === status);
  return c.json(searchItems(orders, c.req.query(), ["orderNumber"]));
});

commerce.get("/orders/:id", (c) => {
  const item = CRUD.get(getStore().orders, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json(item);
});

commerce.post("/orders", async (c) => {
  const body = await c.req.json<Partial<Order>>();
  const subtotal = body.items?.reduce((s, it) => s + it.price * (it.quantity || 1), 0) ?? 0;
  const order: Order = { id: body.id ?? genId("ord"), orderNumber: body.orderNumber ?? `AL-${Math.floor(100000 + Math.random() * 900000)}`, customerId: body.customerId ?? "", items: body.items ?? [], subtotal, discount: body.discount ?? 0, shippingCost: body.shippingCost ?? 0, tax: body.tax ?? 0, total: body.total ?? subtotal, currency: body.currency ?? "USD", shipping: { address: "", city: "", state: "", zip: "", country: "", method: "" }, payment: { method: "card", status: "paid" }, status: body.status ?? "paid", createdAt: Date.now() };
  getStore().orders.unshift(order);
  return c.json(order, 201);
});

commerce.patch("/orders/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: string }>();
  const updated = CRUD.update(getStore().orders, c.req.param("id"), { status });
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json(updated);
});

commerce.patch("/orders/:id", async (c) => {
  const updated = CRUD.update(getStore().orders, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json(updated);
});

commerce.delete("/orders/:id", (c) => {
  if (!CRUD.remove(getStore().orders, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Order not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  COUPONS                                                            */
/* ================================================================== */

commerce.get("/coupons", (c) => {
  return c.json(searchItems(getStore().coupons, c.req.query(), ["code", "description"]));
});

commerce.get("/coupons/:id", (c) => {
  const item = CRUD.get(getStore().coupons, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Coupon not found" }, 404);
  return c.json(item);
});

commerce.post("/coupons", async (c) => {
  const body = await c.req.json<Partial<Coupon>>();
  const coupon: Coupon = { id: body.id ?? genId("cpn"), code: (body.code ?? "").toUpperCase(), type: body.type ?? "percent", value: body.value ?? 0, minSpend: body.minSpend ?? 0, minOrder: body.minOrder ?? 0, active: body.active ?? true, description: body.description ?? "", usageLimit: body.usageLimit ?? 0, usedCount: body.usedCount ?? 0, expiresAt: body.expiresAt ?? 0 };
  getStore().coupons.push(coupon);
  return c.json(coupon, 201);
});

commerce.patch("/coupons/:id", async (c) => {
  const updated = CRUD.update(getStore().coupons, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Coupon not found" }, 404);
  return c.json(updated);
});

commerce.delete("/coupons/:id", (c) => {
  if (!CRUD.remove(getStore().coupons, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Coupon not found" }, 404);
  return c.json({ success: true });
});

commerce.post("/coupons/validate", async (c) => {
  const { code, subtotal } = await c.req.json<{ code: string; subtotal: number }>();
  const coupon = getStore().coupons.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!coupon) return c.json({ valid: false, discount: 0, message: "Invalid code." });
  if (!coupon.active) return c.json({ valid: false, discount: 0, message: "This code is no longer active." });
  if (coupon.expiresAt && coupon.expiresAt < Date.now()) return c.json({ valid: false, discount: 0, message: "This code has expired." });
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return c.json({ valid: false, discount: 0, message: "This code has reached its limit." });
  if (coupon.minSpend != null && subtotal < coupon.minSpend) return c.json({ valid: false, discount: 0, message: `Spend $${coupon.minSpend} to use this code.` });
  const discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : Math.min(coupon.value, subtotal);
  return c.json({ valid: true, coupon, discount: Math.round(discount * 100) / 100, message: "Code applied." });
});

/* ================================================================== */
/*  PAYMENT GATEWAYS                                                   */
/* ================================================================== */

commerce.get("/gateways", (c) => {
  let gateways = getStore().paymentGateways;
  const active = c.req.query("active");
  if (active === "true") gateways = gateways.filter((g) => g.active);
  return c.json(paginateFromParams(gateways, c.req.query()));
});

commerce.get("/gateways/:id", (c) => {
  const item = CRUD.get(getStore().paymentGateways, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Gateway not found" }, 404);
  return c.json(item);
});

commerce.post("/gateways", async (c) => {
  const gw = await c.req.json<PaymentGateway>();
  gw.id = gw.id ?? genId("gw");
  getStore().paymentGateways.push(gw);
  return c.json(gw, 201);
});

commerce.patch("/gateways/:id", async (c) => {
  const updated = CRUD.update(getStore().paymentGateways, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Gateway not found" }, 404);
  return c.json(updated);
});

commerce.delete("/gateways/:id", (c) => {
  if (!CRUD.remove(getStore().paymentGateways, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Gateway not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SUPPLIERS                                                          */
/* ================================================================== */

commerce.get("/suppliers", (c) => {
  return c.json(paginateFromParams(getStore().suppliers, c.req.query()));
});

commerce.get("/suppliers/:id", (c) => {
  const item = CRUD.get(getStore().suppliers, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json(item);
});

commerce.post("/suppliers", async (c) => {
  const sup = await c.req.json<Partial<Supplier>>();
  const supplier: Supplier = { id: sup.id ?? genId("sup"), name: sup.name ?? "", contactName: sup.contactName ?? "", email: sup.email ?? "", phone: sup.phone ?? "", status: sup.status ?? "active", leadTime: sup.leadTime ?? 7, rating: sup.rating ?? 0, products: sup.products ?? [] };
  getStore().suppliers.push(supplier);
  return c.json(supplier, 201);
});

commerce.patch("/suppliers/:id", async (c) => {
  const updated = CRUD.update(getStore().suppliers, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json(updated);
});

commerce.delete("/suppliers/:id", (c) => {
  if (!CRUD.remove(getStore().suppliers, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  RETURNS                                                            */
/* ================================================================== */

commerce.get("/returns", (c) => {
  return c.json(paginateFromParams(getStore().returns, c.req.query()));
});

commerce.get("/returns/:id", (c) => {
  const item = CRUD.get(getStore().returns, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Return not found" }, 404);
  return c.json(item);
});

commerce.post("/returns", async (c) => {
  const body = await c.req.json<Partial<ReturnRequest>>();
  const ret: ReturnRequest = { id: body.id ?? genId("ret"), number: body.number ?? `RT-${Math.floor(100000 + Math.random() * 900000)}`, orderId: body.orderId ?? "", orderNumber: body.orderNumber ?? "", customer: body.customer ?? { name: "", email: "" }, type: body.type ?? "refund", reason: body.reason ?? "", status: body.status ?? "requested", createdAt: Date.now() };
  getStore().returns.unshift(ret);
  return c.json(ret, 201);
});

commerce.patch("/returns/:id", async (c) => {
  const updated = CRUD.update(getStore().returns, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Return not found" }, 404);
  return c.json(updated);
});

export { commerce };
