/**
 * ALAYA INSIDER — Customer Routes (Customers, Tickets, Referrals, Abandoned Carts)
 */

import { Hono } from "hono";
import { getStore, CRUD, paginate, searchItems, genId, type Customer, type SupportTicket, type Referral, type AbandonedCart } from "../db.js";

const customers = new Hono();

/* ================================================================== */
/*  CUSTOMERS                                                          */
/* ================================================================== */

customers.get("/customers", (c) => {
  return c.json(searchItems(getStore().customers, c.req.query(), ["name", "email"]));
});

customers.get("/customers/:id", (c) => {
  const item = CRUD.get(getStore().customers, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  return c.json(item);
});

customers.post("/customers/register", async (c) => {
  const { name, email, password } = await c.req.json<{ name: string; email: string; password: string }>();
  const exists = getStore().customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (exists) return c.json({ code: "DUPLICATE", message: "Email already registered" }, 409);
  const customer: Customer = { id: genId("cust"), name, email, passwordHash: password, password, createdAt: Date.now(), lastLogin: Date.now(), status: "active", role: "customer", addresses: [], orders: [], wishlist: [], compare: [], recentlyViewed: [], newsletter: true, timeline: [{ id: genId("tl"), type: "account_created", label: "Account created", ts: Date.now() }], notes: [], tasks: [], preferences: { favoriteBrands: [], favoriteCategories: [], preferredTheme: "light", marketingOptIn: true }, loyaltyPoints: 0, storeCredit: 0, referralCode: `ALAYA-${name.toUpperCase().replace(/\s+/g, "").slice(0, 8)}` };
  getStore().customers.push(customer);
  return c.json(customer, 201);
});

customers.post("/customers/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const customer = getStore().customers.find((c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
  if (!customer) return c.json({ code: "UNAUTHORIZED", message: "Invalid email or password" }, 401);
  return c.json({ customer, token: `jwt_${genId("tok")}` });
});

customers.patch("/customers/:id", async (c) => {
  const updated = CRUD.update(getStore().customers, c.req.param("id"), await c.req.json());
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  return c.json(updated);
});

customers.post("/customers/:id/notes", async (c) => {
  const { author, body, pinned } = await c.req.json<{ author: string; body: string; pinned?: boolean }>();
  const cust = CRUD.get(getStore().customers, c.req.param("id"));
  if (!cust) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  const note = { id: genId("note"), author, body, pinned: pinned ?? false, ts: Date.now() };
  if (cust.notes) cust.notes.unshift(note);
  return c.json(note, 201);
});

customers.post("/customers/:id/tasks", async (c) => {
  const task = await c.req.json<{ title: string; type: string; assignee: string; priority: string }>();
  const cust = CRUD.get(getStore().customers, c.req.param("id"));
  if (!cust) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  const t = { ...task, id: genId("task"), done: false, ts: Date.now() };
  if (cust.tasks) cust.tasks.push(t);
  return c.json(t, 201);
});

customers.post("/customers/:id/timeline", async (c) => {
  const { type, label, meta } = await c.req.json<{ type: string; label: string; meta?: string }>();
  const cust = CRUD.get(getStore().customers, c.req.param("id"));
  if (!cust) return c.json({ code: "NOT_FOUND", message: "Customer not found" }, 404);
  const evt = { id: genId("tl"), type, label, ts: Date.now(), meta };
  if (cust.timeline) cust.timeline.unshift(evt);
  return c.json(evt, 201);
});

/* ================================================================== */
/*  SUPPORT TICKETS                                                    */
/* ================================================================== */

customers.get("/support-tickets", (c) => {
  return c.json(searchItems(getStore().supportTickets, c.req.query(), ["subject", "number"]));
});

customers.get("/support-tickets/:id", (c) => {
  const item = CRUD.get(getStore().supportTickets, c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Ticket not found" }, 404);
  return c.json(item);
});

customers.post("/support-tickets", async (c) => {
  const body = await c.req.json<Partial<SupportTicket>>();
  const ticket: SupportTicket = { id: body.id ?? genId("tk"), number: body.number, customerId: body.customerId ?? "", subject: body.subject ?? "", message: body.message ?? "", messages: body.messages, status: body.status ?? "open", priority: body.priority ?? "medium", createdAt: Date.now() };
  getStore().supportTickets.unshift(ticket);
  return c.json(ticket, 201);
});

customers.post("/support-tickets/:id/reply", async (c) => {
  const { author, body } = await c.req.json<{ author: string; body: string }>();
  const ticket = CRUD.get(getStore().supportTickets, c.req.param("id"));
  if (!ticket) return c.json({ code: "NOT_FOUND", message: "Ticket not found" }, 404);
  if (ticket.messages) ticket.messages.push({ author, body, ts: Date.now() });
  ticket.status = "pending";
  return c.json(ticket);
});

customers.patch("/support-tickets/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: string }>();
  const updated = CRUD.update(getStore().supportTickets, c.req.param("id"), { status });
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Ticket not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  REFERRALS                                                          */
/* ================================================================== */

customers.get("/referrals", (c) => {
  return c.json(getStore().referrals);
});

customers.post("/referrals", async (c) => {
  const { customerName } = await c.req.json<{ customerName: string }>();
  const ref: Referral = { id: genId("ref"), code: `ALAYA-${customerName.toUpperCase().replace(/\s+/g, "").slice(0, 12)}`, customerName, clicks: 0, signups: 0, purchases: 0, rewardEarned: 0 };
  getStore().referrals.unshift(ref);
  return c.json(ref, 201);
});

customers.delete("/referrals/:id", (c) => {
  if (!CRUD.remove(getStore().referrals, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Referral not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  ABANDONED CARTS                                                    */
/* ================================================================== */

customers.get("/abandoned-carts", (c) => {
  return c.json(getStore().abandonedCarts);
});

customers.post("/abandoned-carts", async (c) => {
  const body = await c.req.json<Omit<AbandonedCart, "id" | "recovered" | "createdAt">>();
  const cart: AbandonedCart = { ...body, id: genId("ab"), recovered: false, createdAt: Date.now() };
  getStore().abandonedCarts.unshift(cart);
  if (getStore().abandonedCarts.length > 200) getStore().abandonedCarts = getStore().abandonedCarts.slice(0, 200);
  return c.json(cart, 201);
});

customers.post("/abandoned-carts/:id/recover", (c) => {
  const cart = CRUD.get(getStore().abandonedCarts, c.req.param("id"));
  if (!cart) return c.json({ code: "NOT_FOUND", message: "Cart not found" }, 404);
  cart.recovered = true;
  return c.json(cart);
});

customers.delete("/abandoned-carts/:id", (c) => {
  if (!CRUD.remove(getStore().abandonedCarts, c.req.param("id"))) return c.json({ code: "NOT_FOUND", message: "Cart not found" }, 404);
  return c.json({ success: true });
});

export { customers };
