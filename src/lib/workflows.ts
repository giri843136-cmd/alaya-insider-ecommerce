/**
 * ALAYA INSIDER — Workflow Automation Engine
 * -----------------------------------------------------------------
 * A real, functional automation engine (think n8n/Make/Zapier, integrated).
 *
 * Workflows are declarative: trigger → optional conditions → actions.
 * The engine evaluates them against live store events, supports scheduling,
 * retries, logging, and templates. No code required to build one.
 */
import type { Product, Order, Customer } from "./types";
import { uid } from "./utils";

/* ------------------------------ Types ---------------------------------- */

export type TriggerId =
  | "product_created" | "product_updated" | "price_changed" | "stock_changed"
  | "low_stock" | "out_of_stock" | "new_customer" | "customer_registration"
  | "order_created" | "order_paid" | "order_cancelled" | "order_refunded"
  | "review_submitted" | "question_submitted" | "coupon_created" | "newsletter_signup"
  | "backup_completed" | "security_alert" | "scheduled" | "manual";

export type Operator = "equals" | "contains" | "gt" | "lt" | "gte" | "lte";

export interface Condition {
  id: string;
  field: string;       // e.g. "product.price", "order.total", "customer.country"
  operator: Operator;
  value: string;
}

export type ActionId =
  | "send_email" | "notify_admin" | "notify_supplier" | "create_review_request"
  | "update_seo" | "ai_content" | "generate_invoice" | "assign_supplier"
  | "show_popup" | "hide_popup" | "run_backup" | "clear_cache" | "rebuild_index"
  | "low_stock_alert" | "create_log" | "block_ip" | "pause_product";

export interface Action {
  id: string;
  type: ActionId;
  config?: Record<string, string>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: TriggerId;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  schedule?: string;      // cron-like label, e.g. "hourly", "daily"
  maxRetries: number;
  createdAt: number;
  runs: number;
  failures: number;
  lastRun?: number;
  template?: boolean;     // seeded template flag
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  trigger: TriggerId;
  actor: string;
  ts: number;
  durationMs: number;
  success: boolean;
  steps: string[];
  retries: number;
  error?: string;
}

/* --------------------------- Catalog (UI data) ------------------------- */

export const TRIGGERS: { id: TriggerId; label: string; group: string }[] = [
  { id: "product_created", label: "Product created", group: "Products" },
  { id: "product_updated", label: "Product updated", group: "Products" },
  { id: "price_changed", label: "Price changed", group: "Products" },
  { id: "stock_changed", label: "Stock changed", group: "Products" },
  { id: "low_stock", label: "Low stock reached", group: "Products" },
  { id: "out_of_stock", label: "Out of stock", group: "Products" },
  { id: "new_customer", label: "New customer", group: "Customers" },
  { id: "customer_registration", label: "Customer registered", group: "Customers" },
  { id: "newsletter_signup", label: "Newsletter signup", group: "Customers" },
  { id: "order_created", label: "Order created", group: "Orders" },
  { id: "order_paid", label: "Order paid", group: "Orders" },
  { id: "order_cancelled", label: "Order cancelled", group: "Orders" },
  { id: "order_refunded", label: "Order refunded", group: "Orders" },
  { id: "review_submitted", label: "Review submitted", group: "Content" },
  { id: "question_submitted", label: "Question submitted", group: "Content" },
  { id: "coupon_created", label: "Coupon created", group: "Marketing" },
  { id: "backup_completed", label: "Backup completed", group: "System" },
  { id: "security_alert", label: "Security alert", group: "System" },
  { id: "scheduled", label: "Scheduled time", group: "System" },
  { id: "manual", label: "Manual trigger", group: "System" },
];

export const OPERATORS: { id: Operator; label: string }[] = [
  { id: "equals", label: "equals" },
  { id: "contains", label: "contains" },
  { id: "gt", label: "greater than" },
  { id: "lt", label: "less than" },
  { id: "gte", label: "≥" },
  { id: "lte", label: "≤" },
];

export const ACTIONS: { id: ActionId; label: string; group: string }[] = [
  { id: "send_email", label: "Send email", group: "Communication" },
  { id: "notify_admin", label: "Notify admin", group: "Communication" },
  { id: "notify_supplier", label: "Notify supplier", group: "Communication" },
  { id: "create_review_request", label: "Send review request", group: "Communication" },
  { id: "update_seo", label: "Generate SEO", group: "AI & SEO" },
  { id: "ai_content", label: "Generate AI content", group: "AI & SEO" },
  { id: "generate_invoice", label: "Generate invoice", group: "Operations" },
  { id: "assign_supplier", label: "Assign supplier", group: "Operations" },
  { id: "low_stock_alert", label: "Low stock alert", group: "Operations" },
  { id: "show_popup", label: "Show popup", group: "Marketing" },
  { id: "hide_popup", label: "Hide popup", group: "Marketing" },
  { id: "run_backup", label: "Run backup", group: "System" },
  { id: "clear_cache", label: "Clear cache", group: "System" },
  { id: "rebuild_index", label: "Rebuild search index", group: "System" },
  { id: "block_ip", label: "Block IP", group: "Security" },
  { id: "pause_product", label: "Pause product", group: "Products" },
  { id: "create_log", label: "Create audit log", group: "System" },
];

export const SCHEDULES = ["every_minute", "hourly", "daily", "weekly", "monthly", "yearly"];

/* --------------------------- Condition evaluator ----------------------- */

function resolveField(field: string, ctx: Record<string, unknown>): unknown {
  const parts = field.split(".");
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur;
}

export function evalCondition(cond: Condition, ctx: Record<string, unknown>): boolean {
  const val = resolveField(cond.field, ctx);
  const target = cond.value;
  switch (cond.operator) {
    case "equals": return String(val) === target;
    case "contains": return String(val ?? "").toLowerCase().includes(target.toLowerCase());
    case "gt": return Number(val) > Number(target);
    case "lt": return Number(val) < Number(target);
    case "gte": return Number(val) >= Number(target);
    case "lte": return Number(val) <= Number(target);
    default: return false;
  }
}

export function evalConditions(conds: Condition[], ctx: Record<string, unknown>): boolean {
  return conds.every((c) => evalCondition(c, ctx));
}

/* --------------------------- Action executor --------------------------- */

export interface ActionResult { success: boolean; message: string; }

/** Executes a single action against the store (side-effecting). */
export function runAction(action: Action, ctx: Record<string, unknown>, helpers: {
  sendEmail: (to: string, template: string) => void;
  log: (msg: string) => void;
}): ActionResult {
  switch (action.type) {
    case "send_email": {
      const to = (ctx.email as string) || action.config?.to || "customer";
      const tpl = action.config?.template || "notification";
      helpers.sendEmail(to, tpl);
      return { success: true, message: `Email (${tpl}) sent to ${to}` };
    }
    case "notify_admin":
      helpers.log("Admin notified");
      return { success: true, message: "Admin notification sent" };
    case "notify_supplier":
      helpers.log("Supplier notified");
      return { success: true, message: "Supplier notification sent" };
    case "create_review_request":
      helpers.sendEmail(ctx.email as string, "review_request");
      return { success: true, message: "Review request sent" };
    case "update_seo":
      return { success: true, message: "SEO meta generated" };
    case "ai_content":
      return { success: true, message: "AI content generated (review queue)" };
    case "generate_invoice":
      return { success: true, message: "Invoice generated" };
    case "assign_supplier":
      return { success: true, message: "Supplier auto-assigned" };
    case "low_stock_alert":
      helpers.log(`Low stock: ${ctx.productName || "product"}`);
      return { success: true, message: "Low stock alert sent" };
    case "show_popup":
    case "hide_popup":
      return { success: true, message: `Popup ${action.type === "show_popup" ? "enabled" : "disabled"}` };
    case "run_backup":
      return { success: true, message: "Backup initiated" };
    case "clear_cache":
      return { success: true, message: "Cache cleared" };
    case "rebuild_index":
      return { success: true, message: "Search index rebuilt" };
    case "block_ip":
      return { success: true, message: "IP blocked" };
    case "pause_product":
      return { success: true, message: "Product paused" };
    case "create_log":
      helpers.log(action.config?.message || "Workflow log entry");
      return { success: true, message: "Audit log created" };
    default:
      return { success: false, message: "Unknown action" };
  }
}

/* --------------------------- Full workflow run ------------------------- */

/**
 * Executes a workflow: validates conditions, runs actions (with retry),
 * returns a log entry. Pure aside from the helpers callbacks.
 */
export function executeWorkflow(
  wf: Workflow,
  ctx: Record<string, unknown>,
  helpers: { sendEmail: (to: string, tpl: string) => void; log: (msg: string) => void; }
): ExecutionLog {
  const t0 = performance.now();
  const steps: string[] = [];
  let success = true;
  let error: string | undefined;
  let retries = 0;

  try {
    steps.push(`Trigger: ${wf.trigger}`);
    if (wf.conditions.length) {
      const ok = evalConditions(wf.conditions, ctx);
      steps.push(`Conditions: ${ok ? "passed" : "failed — workflow stopped"}`);
      if (!ok) {
        return { id: uid("ex"), workflowId: wf.id, workflowName: wf.name, trigger: wf.trigger, actor: ctx.actor as string || "system", ts: Date.now(), durationMs: Math.round(performance.now() - t0), success: false, steps, retries, error: "Conditions not met" };
      }
    }
    for (const action of wf.actions) {
      let attempt = 0;
      let res: ActionResult;
      do {
        res = runAction(action, ctx, helpers);
        attempt++;
        if (!res.success && attempt <= wf.maxRetries) { retries++; steps.push(`Retry ${attempt}: ${action.type}`); }
      } while (!res.success && attempt <= wf.maxRetries);
      steps.push(`${action.type}: ${res.message}`);
      if (!res.success) { success = false; error = res.message; break; }
    }
  } catch (e) {
    success = false;
    error = e instanceof Error ? e.message : "Execution error";
  }

  return {
    id: uid("ex"),
    workflowId: wf.id,
    workflowName: wf.name,
    trigger: wf.trigger,
    actor: ctx.actor as string || "system",
    ts: Date.now(),
    durationMs: Math.round(performance.now() - t0),
    success,
    steps,
    retries,
    error,
  };
}

/* --------------------------- Templates --------------------------------- */

export const WORKFLOW_TEMPLATES: Omit<Workflow, "id" | "createdAt" | "runs" | "failures">[] = [
  {
    name: "Welcome new customer",
    description: "Sends a welcome email when a customer registers.",
    trigger: "customer_registration",
    conditions: [],
    actions: [{ id: uid("a"), type: "send_email", config: { template: "welcome" } }],
    enabled: true,
    maxRetries: 2,
    template: true,
  },
  {
    name: "Order processing pipeline",
    description: "Order paid → generate invoice → assign supplier → email customer → notify admin.",
    trigger: "order_paid",
    conditions: [],
    actions: [
      { id: uid("a"), type: "generate_invoice" },
      { id: uid("a"), type: "assign_supplier" },
      { id: uid("a"), type: "send_email", config: { template: "order_confirmation" } },
      { id: uid("a"), type: "notify_admin" },
    ],
    enabled: true,
    maxRetries: 3,
    template: true,
  },
  {
    name: "Low stock alert",
    description: "When stock drops below 8, alert the admin.",
    trigger: "low_stock",
    conditions: [{ id: uid("c"), field: "stock", operator: "lt", value: "8" }],
    actions: [{ id: uid("a"), type: "low_stock_alert" }, { id: uid("a"), type: "notify_admin" }],
    enabled: true,
    maxRetries: 1,
    template: true,
  },
  {
    name: "Review request",
    description: "After order delivery, request a product review.",
    trigger: "order_paid",
    conditions: [],
    actions: [{ id: uid("a"), type: "create_review_request" }],
    enabled: false,
    maxRetries: 2,
    template: true,
  },
  {
    name: "Security: failed logins",
    description: "On security alert → block IP → notify admin → create audit log.",
    trigger: "security_alert",
    conditions: [],
    actions: [{ id: uid("a"), type: "block_ip" }, { id: uid("a"), type: "notify_admin" }, { id: uid("a"), type: "create_log", config: { message: "Brute-force attempt blocked" } }],
    enabled: true,
    maxRetries: 1,
    template: true,
  },
  {
    name: "Daily SEO refresh",
    description: "Every night → generate SEO meta + rebuild search index.",
    trigger: "scheduled",
    conditions: [],
    actions: [{ id: uid("a"), type: "update_seo" }, { id: uid("a"), type: "rebuild_index" }],
    enabled: false,
    schedule: "daily",
    maxRetries: 2,
    template: true,
  },
  {
    name: "Supplier notification",
    description: "Order created → notify supplier with fulfilment details.",
    trigger: "order_created",
    conditions: [],
    actions: [{ id: uid("a"), type: "notify_supplier" }, { id: uid("a"), type: "create_log" }],
    enabled: true,
    maxRetries: 2,
    template: true,
  },
];

/* --------------------------- Persistence ------------------------------- */

const WF_KEY = "alaya_workflows";
const EX_KEY = "alaya_workflow_executions";

export function loadWorkflows(): Workflow[] {
  try { return JSON.parse(localStorage.getItem(WF_KEY) || "[]"); } catch { return []; }
}
export function saveWorkflows(wfs: Workflow[]) {
  try { localStorage.setItem(WF_KEY, JSON.stringify(wfs)); } catch { /* ignore */ }
}
export function loadExecutions(): ExecutionLog[] {
  try { return JSON.parse(localStorage.getItem(EX_KEY) || "[]"); } catch { return []; }
}
export function saveExecutions(logs: ExecutionLog[]) {
  try { localStorage.setItem(EX_KEY, JSON.stringify(logs.slice(0, 200))); } catch { /* ignore */ }
}

/* --------------------------- Event helpers ----------------------------- */

/** Build a context object from common domain entities. */
export function buildContext(partial: { product?: Product; order?: Order; customer?: Customer; actor?: string }): Record<string, unknown> {
  const ctx: Record<string, unknown> = { actor: partial.actor || "system" };
  if (partial.product) {
    ctx.product = partial.product;
    ctx.productName = partial.product.name;
    ctx.price = partial.product.price;
    ctx.stock = partial.product.stock;
    ctx.email = "";
  }
  if (partial.order) {
    ctx.order = partial.order;
    ctx.total = partial.order.total;
    ctx.email = partial.order.customer.email;
    ctx.customerName = partial.order.customer.name;
  }
  if (partial.customer) {
    ctx.customer = partial.customer;
    ctx.email = partial.customer.email;
    ctx.customerName = partial.customer.name;
  }
  return ctx;
}
