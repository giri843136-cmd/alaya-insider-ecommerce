/**
 * ALAYA INSIDER — Customer Routes (Customers, Tickets, Referrals, Abandoned Carts)
 *
 * Migrated to PostgreSQL repositories (v2.0.0)
 */

import { Hono } from "hono";
import { customers_repo, tickets, referrals, abandonedCarts } from "../db/repositories/index.js";

const customers = new Hono();

/* ================================================================== */
/*  CUSTOMERS                                                          */
/* ================================================================== */

customers.get("/customers", async (c) => {
  const result = await customers_repo.list(c.req.query() as any);
  return c.json(result);
});

customers.get("/customers/:id", async (c) => {
  const item = await customers_repo.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  return c.json(item);
});

customers.post("/customers/register", async (c) => {
  const { name, email, password } = await c.req.json<{ name: string; email: string; password: string }>();
  const exists = await customers_repo.findByEmail(email);
  if (exists) return c.json({ code: "DUPLICATE", message: "Email already registered" }, 409);
  const customer = await customers_repo.create({
    name,
    email,
    password,
    status: "active",
    newsletter: true,
    referral_code: `ALAYA-${name.toUpperCase().replace(/\s+/g, "").slice(0, 8)}`,
  } as any, "api");
  return c.json(customer, 201);
});

customers.post("/customers/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const customer = await customers_repo.authenticate(email, password);
  if (!customer) return c.json({ code: "UNAUTHORIZED", message: "Invalid email or password" }, 401);
  return c.json({ customer, token: `jwt_${customer.id}_${Date.now().toString(36)}` });
});

customers.patch("/customers/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await customers_repo.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  return c.json(updated);
});

customers.post("/customers/:id/notes", async (c) => {
  const { author, body, pinned } = await c.req.json<{ author: string; body: string; pinned?: boolean }>();
  const cust = await customers_repo.getById(c.req.param("id"));
  if (!cust) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  // Append note to preferences JSONB array
  const note = { id: `note_${Date.now()}`, author, body, pinned: pinned ?? false, ts: Date.now() };
  const currentPrefs = (cust as any).preferences || {};
  const notes = Array.isArray(currentPrefs.notes) ? [...currentPrefs.notes, note] : [note];
  await customers_repo.update(c.req.param("id"), {
    preferences: { ...currentPrefs, notes },
  } as any, "api");
  return c.json(note, 201);
});

customers.post("/customers/:id/tasks", async (c) => {
  const task = await c.req.json<{ title: string; type: string; assignee: string; priority: string }>();
  const cust = await customers_repo.getById(c.req.param("id"));
  if (!cust) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  // Append task to preferences JSONB array
  const t = { ...task, id: `task_${Date.now()}`, done: false, ts: Date.now() };
  const currentPrefs = (cust as any).preferences || {};
  const tasks = Array.isArray(currentPrefs.tasks) ? [...currentPrefs.tasks, t] : [t];
  await customers_repo.update(c.req.param("id"), {
    preferences: { ...currentPrefs, tasks },
  } as any, "api");
  return c.json(t, 201);
});

customers.post("/customers/:id/timeline", async (c) => {
  const { type, label, meta } = await c.req.json<{ type: string; label: string; meta?: string }>();
  const cust = await customers_repo.getById(c.req.param("id"));
  if (!cust) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  // Append to timeline JSONB column
  const evt = { id: `tl_${Date.now()}`, type, label, ts: Date.now(), meta };
  const currentTimeline = (cust as any).timeline || [];
  const timeline = Array.isArray(currentTimeline) ? [evt, ...currentTimeline] : [evt];
  await customers_repo.update(c.req.param("id"), {
    timeline,
  } as any, "api");
  return c.json(evt, 201);
});

/* ================================================================== */
/*  SUPPORT TICKETS                                                    */
/* ================================================================== */

customers.get("/support-tickets", async (c) => {
  const result = await tickets.list(c.req.query() as any);
  return c.json(result);
});

customers.get("/support-tickets/:id", async (c) => {
  const item = await tickets.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Ticket not found" }, 404);
  return c.json(item);
});

customers.post("/support-tickets", async (c) => {
  const body = await c.req.json<any>();
  const ticket = await tickets.create({
    number: body.number || `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
    customer_id: body.customerId ?? body.customer_id ?? "",
    subject: body.subject || "",
    status: body.status || "open",
    priority: body.priority || "medium",
    messages: body.messages || [],
  } as any, "api");
  return c.json(ticket, 201);
});

customers.post("/support-tickets/:id/reply", async (c) => {
  const { author, body } = await c.req.json<{ author: string; body: string }>();
  const updated = await tickets.reply(c.req.param("id"), author, body);
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Ticket not found" }, 404);
  return c.json(updated);
});

customers.patch("/support-tickets/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: string }>();
  const updated = await tickets.update(c.req.param("id"), { status } as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Ticket not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  REFERRALS                                                          */
/* ================================================================== */

customers.get("/referrals", async (c) => {
  const result = await referrals.list(c.req.query() as any);
  return c.json(result);
});

customers.post("/referrals", async (c) => {
  const { customerName } = await c.req.json<{ customerName: string }>();
  const ref = await referrals.create({
    code: `ALAYA-${customerName.toUpperCase().replace(/\s+/g, "").slice(0, 12)}`,
    customer_name: customerName,
    clicks: 0,
    signups: 0,
    purchases: 0,
    reward_earned: 0,
  } as any, "api");
  return c.json(ref, 201);
});

customers.delete("/referrals/:id", async (c) => {
  const ok = await referrals.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Referral not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  ABANDONED CARTS                                                    */
/* ================================================================== */

customers.get("/abandoned-carts", async (c) => {
  const result = await abandonedCarts.list(c.req.query() as any);
  return c.json(result);
});

customers.post("/abandoned-carts", async (c) => {
  const body = await c.req.json<any>();
  const cart = await abandonedCarts.create({
    email: body.email,
    items: body.items || 0,
    value: body.value || 0,
    stage: body.stage || "checkout",
    recovered: false,
  } as any, "api");
  return c.json(cart, 201);
});

customers.post("/abandoned-carts/:id/recover", async (c) => {
  const updated = await abandonedCarts.recover(c.req.param("id"));
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Cart not found" }, 404);
  return c.json(updated);
});

customers.delete("/abandoned-carts/:id", async (c) => {
  const ok = await abandonedCarts.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Cart not found" }, 404);
  return c.json({ success: true });
});

export { customers };
