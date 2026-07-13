/**
 * ALAYA INSIDER — Supplier & Fulfillment Routes (PR-4)
 * --------------------------------------------------------------------------
 * Complete REST API for the Enterprise Supplier & Fulfillment Platform.
 * Mounted at /api/v1/suppliers
 */

import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../db/index.js";
import {
  supplierAccounts, supplierProducts, supplierOrders, purchaseOrders,
  supplierSyncJobs, supplierInventory, supplierTracking, supplierReturns,
  supplierRatings, supplierHealth, supplierLogs, supplierScorecard,
  warehouseInventory, warehouseTransfers,
} from "../db/repositories/index.js";
import {
  selectBestSupplier, createPurchaseOrder, dispatchPurchaseOrder,
  confirmPurchaseOrder, syncSupplierInventory, syncAllSupplierInventory,
  updateTracking, transferStock, completeTransfer, calculateScorecard,
  runFulfillmentPipeline, getSupplierAnalytics, getSupplierPerformance,
} from "../services/supplierEngine.js";

const supplier = new Hono();

/* ================================================================== */
/*  SUPPLIER ACCOUNTS                                                  */
/* ================================================================== */

supplier.get("/accounts", async (c) => {
  const result = await supplierAccounts.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/accounts/:id", async (c) => {
  const item = await supplierAccounts.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Supplier account not found" }, 404);
  return c.json(item);
});

supplier.post("/accounts", async (c) => {
  const body = await c.req.json<any>();
  const account = await supplierAccounts.create(body as any, "api");
  return c.json(account, 201);
});

supplier.patch("/accounts/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await supplierAccounts.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Supplier account not found" }, 404);
  return c.json(updated);
});

supplier.delete("/accounts/:id", async (c) => {
  const ok = await supplierAccounts.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Supplier account not found" }, 404);
  return c.json({ success: true });
});

supplier.get("/accounts/by-supplier/:supplierId", async (c) => {
  const result = await supplierAccounts.getBySupplier(c.req.param("supplierId"));
  return c.json(result);
});

/* ================================================================== */
/*  SUPPLIER PRODUCT MAPPING                                           */
/* ================================================================== */

supplier.get("/products", async (c) => {
  const result = await supplierProducts.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/products/:id", async (c) => {
  const item = await supplierProducts.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Supplier product mapping not found" }, 404);
  return c.json(item);
});

supplier.post("/products", async (c) => {
  const body = await c.req.json<any>();
  const mapping = await supplierProducts.create(body as any, "api");
  return c.json(mapping, 201);
});

supplier.patch("/products/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await supplierProducts.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Supplier product mapping not found" }, 404);
  return c.json(updated);
});

supplier.delete("/products/:id", async (c) => {
  const ok = await supplierProducts.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Supplier product mapping not found" }, 404);
  return c.json({ success: true });
});

supplier.get("/products/by-product/:productId", async (c) => {
  const result = await supplierProducts.getByProduct(c.req.param("productId"));
  return c.json(result);
});

supplier.get("/products/best-supplier/:productId", async (c) => {
  const result = await selectBestSupplier({
    productId: c.req.param("productId"),
    quantity: Number(c.req.query("qty")) || 1,
    country: c.req.query("country"),
  });
  if (!result) return c.json({ code: "NOT_FOUND", message: "No suitable supplier found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  PURCHASE ORDERS                                                    */
/* ================================================================== */

supplier.get("/purchase-orders", async (c) => {
  const result = await purchaseOrders.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/purchase-orders/recent", async (c) => {
  const result = await purchaseOrders.getRecent(Number(c.req.query("limit")) || 20);
  return c.json(result);
});

supplier.get("/purchase-orders/:id", async (c) => {
  const item = await purchaseOrders.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Purchase order not found" }, 404);
  return c.json(item);
});

supplier.post("/purchase-orders", async (c) => {
  const body = await c.req.json<any>();
  const po = await createPurchaseOrder({
    orderId: body.orderId || "",
    orderNumber: body.orderNumber || "",
    supplierId: body.supplierId,
    accountId: body.accountId,
    supplierName: body.supplierName || "",
    items: body.items || [],
    customerName: body.customerName || "",
    customerAddress: body.customerAddress || "",
    customerPhone: body.customerPhone || "",
    customerEmail: body.customerEmail || "",
    shippingMethod: body.shippingMethod,
    warehouse: body.warehouse,
    notes: body.notes,
    createdBy: body.createdBy,
  });
  return c.json(po, 201);
});

supplier.post("/purchase-orders/:id/dispatch", async (c) => {
  const result = await dispatchPurchaseOrder(c.req.param("id"));
  return c.json(result);
});

supplier.post("/purchase-orders/:id/confirm", async (c) => {
  const result = await confirmPurchaseOrder(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Purchase order not found" }, 404);
  return c.json(result);
});

supplier.patch("/purchase-orders/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await purchaseOrders.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Purchase order not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  SUPPLIER ORDERS                                                    */
/* ================================================================== */

supplier.get("/orders", async (c) => {
  const result = await supplierOrders.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/orders/:id", async (c) => {
  const item = await supplierOrders.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Supplier order not found" }, 404);
  return c.json(item);
});

supplier.patch("/orders/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await supplierOrders.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Supplier order not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  SUPPLIER INVENTORY                                                 */
/* ================================================================== */

supplier.get("/inventory", async (c) => {
  const result = await supplierInventory.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/inventory/by-product/:productId", async (c) => {
  const result = await supplierInventory.getByProduct(c.req.param("productId"));
  return c.json(result);
});

supplier.post("/inventory/sync/:supplierId", async (c) => {
  const result = await syncSupplierInventory(c.req.param("supplierId"));
  return c.json(result);
});

supplier.post("/inventory/sync-all", async (c) => {
  const result = await syncAllSupplierInventory();
  return c.json(result);
});

supplier.get("/inventory/low-stock", async (c) => {
  const threshold = Number(c.req.query("threshold")) || 10;
  const result = await supplierInventory.getLowStock(threshold);
  return c.json(result);
});

/* ================================================================== */
/*  TRACKING                                                           */
/* ================================================================== */

supplier.get("/tracking", async (c) => {
  const result = await supplierTracking.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/tracking/active", async (c) => {
  const result = await supplierTracking.getActive();
  return c.json(result);
});

supplier.get("/tracking/:id", async (c) => {
  const item = await supplierTracking.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Tracking record not found" }, 404);
  return c.json(item);
});

supplier.post("/tracking/:poId/update", async (c) => {
  const result = await updateTracking(c.req.param("poId"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Purchase order not found" }, 404);
  return c.json(result);
});

/* ================================================================== */
/*  WAREHOUSE INVENTORY                                                */
/* ================================================================== */

supplier.get("/warehouse", async (c) => {
  const warehouseId = c.req.query("warehouse_id");
  const productId = c.req.query("product_id");

  if (warehouseId) {
    const result = await warehouseInventory.getByWarehouse(warehouseId);
    return c.json(result);
  }
  if (productId) {
    const result = await warehouseInventory.getByProduct(productId);
    return c.json(result);
  }
  const result = await warehouseInventory.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/warehouse/low-stock", async (c) => {
  const result = await warehouseInventory.getLowStock();
  return c.json(result);
});

supplier.get("/warehouse/total-stock/:productId", async (c) => {
  const result = await warehouseInventory.getTotalStock(c.req.param("productId"));
  return c.json(result);
});

supplier.post("/warehouse/adjust", async (c) => {
  const { warehouseId, productId, delta } = await c.req.json<{ warehouseId: string; productId: string; delta: number }>();
  await warehouseInventory.adjustStock(warehouseId, productId, delta);
  return c.json({ success: true });
});

supplier.post("/warehouse/transfer", async (c) => {
  const { fromWarehouse, toWarehouse, productId, quantity, initiatedBy } = await c.req.json<any>();
  const result = await transferStock(fromWarehouse, toWarehouse, productId, quantity, initiatedBy);
  return c.json(result);
});

supplier.post("/warehouse/transfer/:id/complete", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { receivedBy?: string };
  const result = await completeTransfer(c.req.param("id"), body.receivedBy);
  return c.json(result);
});

/* ================================================================== */
/*  SUPPLIER RETURNS                                                   */
/* ================================================================== */

supplier.get("/returns", async (c) => {
  const result = await supplierReturns.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/returns/:id", async (c) => {
  const item = await supplierReturns.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Supplier return not found" }, 404);
  return c.json(item);
});

supplier.post("/returns", async (c) => {
  const body = await c.req.json<any>();
  const ret = await supplierReturns.create({
    number: body.number || `SR-${Date.now()}`,
    supplier_id: body.supplierId,
    order_id: body.orderId,
    order_number: body.orderNumber,
    reason: body.reason || "",
    type: body.type || "refund",
    status: "requested",
    items: JSON.stringify(body.items || []),
  } as any, "api");
  return c.json(ret, 201);
});

supplier.patch("/returns/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await supplierReturns.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Supplier return not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  SUPPLIER RATINGS & SCORECARD                                       */
/* ================================================================== */

supplier.get("/ratings/:supplierId", async (c) => {
  const result = await supplierRatings.getAverage(c.req.param("supplierId"));
  return c.json(result);
});

supplier.post("/ratings", async (c) => {
  const body = await c.req.json<any>();
  const rating = await supplierRatings.create({
    supplier_id: body.supplierId,
    rating: body.rating,
    category: body.category || "overall",
    review: body.review || "",
    order_id: body.orderId,
    created_by: body.createdBy || "system",
  } as any, "api");
  return c.json(rating, 201);
});

supplier.get("/scorecard/:supplierId", async (c) => {
  const result = await calculateScorecard(c.req.param("supplierId"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Supplier not found" }, 404);
  return c.json(result);
});

supplier.get("/scorecard/rankings", async (c) => {
  const limit = Number(c.req.query("limit")) || 20;
  const result = await supplierScorecard.getRankings(limit);
  return c.json(result);
});

/* ================================================================== */
/*  SUPPLIER HEALTH                                                    */
/* ================================================================== */

supplier.get("/health/:supplierId", async (c) => {
  const result = await supplierHealth.getLatest(c.req.param("supplierId"));
  return c.json(result || { healthy: true, status: "unknown" });
});

supplier.get("/health/unhealthy", async (c) => {
  const result = await supplierHealth.getUnhealthySuppliers();
  return c.json(result);
});

/* ================================================================== */
/*  SUPPLIER LOGS                                                      */
/* ================================================================== */

supplier.get("/logs", async (c) => {
  const result = await supplierLogs.list(c.req.query() as any);
  return c.json(result);
});

supplier.get("/logs/by-order/:orderId", async (c) => {
  const limit = Number(c.req.query("limit")) || 100;
  const result = await supplierLogs.getByOrder(c.req.param("orderId"), limit);
  return c.json(result);
});

/* ================================================================== */
/*  FULFILLMENT PIPELINE                                               */
/* ================================================================== */

supplier.post("/fulfill", async (c) => {
  const body = await c.req.json<any>();
  const result = await runFulfillmentPipeline(
    body.orderId,
    body.orderNumber,
    body.items || [],
    body.customer || { name: "", email: "", address: "" },
  );
  return c.json(result);
});

/* ================================================================== */
/*  ANALYTICS                                                          */
/* ================================================================== */

supplier.get("/analytics", async (c) => {
  const result = await getSupplierAnalytics();
  return c.json(result);
});

supplier.get("/analytics/:supplierId", async (c) => {
  const result = await getSupplierPerformance(c.req.param("supplierId"));
  return c.json(result);
});

/* ================================================================== */
/*  SYNC JOBS                                                          */
/* ================================================================== */

supplier.get("/sync-jobs", async (c) => {
  const result = await supplierSyncJobs.list(c.req.query() as any);
  return c.json(result);
});

supplier.post("/sync-jobs", async (c) => {
  const body = await c.req.json<any>();
  const job = await supplierSyncJobs.create({
    supplier_id: body.supplierId,
    type: body.type || "inventory",
    status: "pending",
    interval_minutes: body.intervalMinutes || 60,
    next_sync_at: new Date(Date.now() + 60000).toISOString(),
  } as any, "api");
  return c.json(job, 201);
});

supplier.get("/sync-jobs/pending", async (c) => {
  const result = await supplierSyncJobs.getPending();
  return c.json(result);
});

export { supplier };
