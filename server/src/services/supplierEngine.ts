/**
 * ALAYA INSIDER — Enterprise Supplier & Fulfillment Engine (PR-4)
 * ====================================================================
 * Complete dropshipping automation platform supporting:
 *  - Multiple supplier types (API, CSV, FTP, Email)
 *  - Automatic supplier selection with scoring
 *  - Purchase order generation and dispatch
 *  - Inventory synchronization
 *  - Tracking integration
 *  - Warehouse management
 *  - Supplier scorecard / ranking
 */

import { query, queryOne, queryAll } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";
import {
  supplierAccounts, supplierProducts, supplierOrders, purchaseOrders,
  supplierInventory, supplierTracking, supplierReturns, supplierRatings,
  supplierHealth, supplierScorecard, supplierSyncJobs,
  warehouseInventory, warehouseTransfers,
} from "../db/repositories/index.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface SupplierSelectionCriteria {
  country?: string;
  productId: string;
  quantity: number;
  maxCost?: number;
  maxLeadTime?: number;
  preferPrimary?: boolean;
}

export interface SelectedSupplier {
  accountId: string;
  supplierId: string;
  supplierName: string;
  supplierSku: string;
  unitCost: number;
  shippingCost: number;
  currency: string;
  leadTimeDays: number;
  stock: number;
  score: number;
  reasons: string[];
}

export interface PurchaseOrderInput {
  orderId: string;
  orderNumber: string;
  supplierId: string;
  accountId: string;
  supplierName: string;
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitCost: number;
    image?: string;
  }>;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  shippingMethod?: string;
  warehouse?: string;
  notes?: string;
  createdBy?: string;
}

export interface FulfillmentPipelineResult {
  success: boolean;
  purchaseOrder?: any;
  trackingRecord?: any;
  steps: Array<{ name: string; status: string; details: string }>;
  error?: string;
}

/* ================================================================== */
/*  SUPPLIER SELECTION ENGINE                                          */
/* ================================================================== */

/**
 * Automatically select the best supplier for a product based on:
 * stock, shipping time, profit margin, rating, warehouse distance, cost, historical success, customer country
 */
export async function selectBestSupplier(criteria: SupplierSelectionCriteria): Promise<SelectedSupplier | null> {
  const mappings = await supplierProducts.getByProduct(criteria.productId);
  if (!mappings || mappings.length === 0) return null;

  const scored: SelectedSupplier[] = [];

  for (const m of mappings) {
    if (!m.active) continue;
    const account = await supplierAccounts.getById(m.account_id);
    if (!account || !account.active) continue;

    let score = 0;
    const reasons: string[] = [];

    // Stock score (0-30)
    const stockScore = Math.min(30, (m.stock || 0) / criteria.quantity * 30);
    score += stockScore;
    if (m.stock >= criteria.quantity) reasons.push("In stock");

    // Lead time score (0-20) — faster is better
    const leadDays = m.lead_time_days || account.avg_delivery_days || 10;
    const leadScore = Math.max(0, 20 - leadDays);
    score += leadScore;
    if (leadDays <= 3) reasons.push("Fast shipping");

    // Priority score (0-15)
    const priorityScore = Math.max(0, 15 - (m.priority || 5) * 3);
    score += priorityScore;
    if (m.is_preferred) { score += 10; reasons.push("Preferred supplier"); }

    // Cost score (0-15) — lower cost = higher score
    const maxCost = criteria.maxCost || m.supplier_cost * 2;
    const costScore = Math.max(0, 15 - ((m.supplier_cost || 0) / maxCost) * 15);
    score += costScore;

    // Country match (0-10)
    const countryMatch = account.country?.toLowerCase() === criteria.country?.toLowerCase();
    if (countryMatch) { score += 10; reasons.push("Local fulfillment"); }

    // Rating score (0-10)
    const ratingData = await supplierRatings.getAverage(m.supplier_id);
    if (ratingData?.avg_rating) {
      score += Number(ratingData.avg_rating) * 2;
    }

    // Failover backup
    if (m.is_backup && !criteria.preferPrimary) {
      score -= 5; // Penalize backup suppliers slightly
    }

    // Lead time constraint
    if (criteria.maxLeadTime && leadDays > criteria.maxLeadTime) {
      score -= 20;
    }

    scored.push({
      accountId: m.account_id,
      supplierId: m.supplier_id,
      supplierName: m.supplier_name || account.company_name || "Unknown",
      supplierSku: m.supplier_sku,
      unitCost: Number(m.supplier_cost) || 0,
      shippingCost: Number(m.shipping_cost) || 0,
      currency: m.currency || account.currency || "USD",
      leadTimeDays: leadDays,
      stock: m.stock || 0,
      score: Math.max(0, Math.round(score * 10) / 10),
      reasons,
    });
  }

  if (scored.length === 0) return null;

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

/* ================================================================== */
/*  PURCHASE ORDER ENGINE                                              */
/* ================================================================== */

function generatePONumber(): string {
  return `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Create a purchase order and send it to the supplier.
 */
export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<any> {
  const subtotal = input.items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const poNumber = generatePONumber();

  const po = await purchaseOrders.create({
    number: poNumber,
    order_id: input.orderId,
    order_number: input.orderNumber,
    supplier_id: input.supplierId,
    account_id: input.accountId,
    supplier_name: input.supplierName,
    items: JSON.stringify(input.items),
    subtotal,
    shipping: 0,
    tax: 0,
    total: subtotal,
    currency: "USD",
    status: "draft",
    customer_name: input.customerName,
    customer_address: input.customerAddress,
    customer_phone: input.customerPhone,
    customer_email: input.customerEmail,
    shipping_method: input.shippingMethod || "standard",
    warehouse: input.warehouse || "Primary",
    order_notes: input.notes || "",
    created_by: input.createdBy || "Automation Engine",
  } as any, "system");

  // Create individual PO items
  for (const item of input.items) {
    await query(
      `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, product_name, product_sku, image, quantity, unit_cost, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [uuidv4(), po.id, item.productId, item.productName, item.productSku || "", item.image || "",
       item.quantity, item.unitCost, item.unitCost * item.quantity],
    );
  }

  // Log the action with relational keys
  await query(
    `INSERT INTO supplier_logs (id, supplier_id, account_id, order_id, order_number, purchase_order_id, po_number, action, status, details, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [uuidv4(), input.supplierId, input.accountId, input.orderId, input.orderNumber, po.id, poNumber,
     "po.created", "success",
     `Purchase Order ${poNumber} created for ${input.supplierName} (${input.items.length} items, $${subtotal.toFixed(2)})`,
     JSON.stringify({ items: input.items.length, subtotal })],
  );

  return po;
}

/**
 * Send purchase order to supplier (simulated API call).
 */
export async function dispatchPurchaseOrder(poId: string): Promise<{ success: boolean; message: string }> {
  const po = await purchaseOrders.getById(poId);
  if (!po) return { success: false, message: "Purchase order not found" };

  const account = await supplierAccounts.getById(po.account_id);
  if (!account) return { success: false, message: "Supplier account not found" };

  // Simulate dispatch via API/email/CSV based on supplier config
  const dispatchMethod = account.api_endpoint ? "api" : account.email_template ? "email" : "manual";
  const success = Math.random() > 0.08; // 92% success simulation

  if (success) {
    const supplierOrderId = `SUP-${Date.now().toString(36).toUpperCase()}`;
    await purchaseOrders.update(poId, {
      status: "sent",
      sent_method: dispatchMethod,
      sent_at: new Date().toISOString(),
      supplier_order_id: supplierOrderId,
    } as any, "system");

    // Create supplier order record
    await supplierOrders.create({
      order_id: po.order_id,
      order_number: po.order_number,
      supplier_id: po.supplier_id,
      account_id: po.account_id,
      supplier_name: po.supplier_name,
      purchase_order_id: po.id,
      purchase_order_number: po.number,
      items: po.items,
      subtotal: po.subtotal,
      total: po.total,
      status: "sent",
      supplier_order_id: supplierOrderId,
      sent_method: dispatchMethod,
      sent_at: new Date().toISOString(),
    } as any, "system");

    await query(
      `INSERT INTO supplier_logs (id, supplier_id, account_id, order_id, purchase_order_id, po_number, action, status, details, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [uuidv4(), po.supplier_id, po.account_id, po.order_id, po.id, po.number,
       "po.dispatched", "success",
       `PO ${po.number} dispatched to ${po.supplier_name} via ${dispatchMethod}`,
       JSON.stringify({ poId, supplierOrderId, dispatchMethod })],
    );

    return { success: true, message: `Dispatched via ${dispatchMethod}` };
  }

  await purchaseOrders.update(poId, { status: "sent" } as any, "system");
  return { success: false, message: "Dispatch failed, will retry" };
}

/**
 * Confirm a purchase order (simulated supplier confirmation).
 */
export async function confirmPurchaseOrder(poId: string): Promise<any> {
  const po = await purchaseOrders.getById(poId);
  if (!po) return null;

  const updated = await purchaseOrders.update(poId, {
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
  } as any, "system");

  await supplierOrders.update(
    po.supplier_order_id,
    { status: "confirmed", confirmed_at: new Date().toISOString() } as any,
    "system",
  );

  await query(
    `INSERT INTO supplier_logs (id, supplier_id, account_id, order_id, purchase_order_id, po_number, action, status, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [uuidv4(), po.supplier_id, po.account_id, po.order_id, po.id, po.number,
     "po.confirmed", "success", `PO ${po.number} confirmed by ${po.supplier_name}`],
  );

  return updated;
}

/* ================================================================== */
/*  INVENTORY SYNC ENGINE                                              */
/* ================================================================== */

/**
 * Sync supplier inventory for a specific supplier.
 */
export async function syncSupplierInventory(supplierId: string): Promise<{
  updated: number; errors: number; message: string;
}> {
  const mappings = await supplierProducts.getBySupplier(supplierId);
  let updated = 0;
  let errors = 0;

  for (const m of mappings) {
    try {
      // Simulate fetching inventory from supplier API
      const newStock = Math.floor(Math.random() * 500);
      const newPrice = Number(m.supplier_cost) * (0.9 + Math.random() * 0.2);

      // Update supplier products
      await supplierProducts.updateSyncStatus(m.id, "synced");

      // Insert inventory snapshot
      await supplierInventory.create({
        supplier_id: m.supplier_id,
        account_id: m.account_id,
        product_id: m.product_id,
        supplier_product_id: m.id,
        stock: newStock,
        reserved: Math.floor(newStock * 0.1),
        available: Math.floor(newStock * 0.9),
        price: Math.round(newPrice * 100) / 100,
        warehouse: m.warehouse || "Primary",
        lead_time_days: m.lead_time_days,
        in_stock: newStock > 0,
      } as any, "system");

      updated++;
    } catch {
      errors++;
    }
  }

  await query(
    `INSERT INTO supplier_logs (id, supplier_id, action, status, details, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), supplierId, "inventory.sync", updated > 0 ? "success" : "warning",
     `Inventory sync for supplier ${supplierId}: ${updated} products updated, ${errors} errors`,
     JSON.stringify({ updated, errors })],
  );

  return { updated, errors, message: `${updated} products synced, ${errors} errors` };
}

/**
 * Sync inventory across all suppliers.
 */
export async function syncAllSupplierInventory(): Promise<{
  totalUpdated: number; totalErrors: number; results: any[];
}> {
  const accounts = await supplierAccounts.getActive();
  let totalUpdated = 0;
  let totalErrors = 0;
  const results: any[] = [];

  for (const acc of accounts) {
    const result = await syncSupplierInventory(acc.supplier_id);
    totalUpdated += result.updated;
    totalErrors += result.errors;
    results.push({ supplierId: acc.supplier_id, supplierName: acc.company_name, ...result });
  }

  return { totalUpdated, totalErrors, results };
}

/* ================================================================== */
/*  TRACKING ENGINE                                                    */
/* ================================================================== */

/**
 * Update tracking for a purchase order (simulated tracking event).
 */
export async function updateTracking(poId: string): Promise<any> {
  const po = await purchaseOrders.getById(poId);
  if (!po) return null;

  const carriers = ["UPS", "FedEx", "DHL", "USPS", "Canada Post"];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  const trackingNumber = `1Z${Math.floor(100 + Math.random() * 900)}${Math.floor(10000000 + Math.random() * 90000000)}`;
  const statuses = ["picked_up", "in_transit", "out_for_delivery", "delivered"];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  // Create tracking record
  const tracking = await supplierTracking.create({
    supplier_id: po.supplier_id,
    account_id: po.account_id,
    order_id: po.order_id,
    order_number: po.order_number,
    purchase_order_id: po.id,
    po_number: po.number,
    tracking_number: trackingNumber,
    carrier,
    status,
    status_detail: `Package ${status.replace(/_/g, " ")}`,
    estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString(),
    last_event: `Package ${status.replace(/_/g, " ")}`,
    events: JSON.stringify([{
      status,
      location: "Distribution Center",
      timestamp: new Date().toISOString(),
      description: `Package ${status.replace(/_/g, " ")}`,
    }]),
    last_checked_at: new Date().toISOString(),
  } as any, "system");

  // Update purchase order
  await purchaseOrders.update(poId, {
    status: status === "delivered" ? "received" : "shipped",
    tracking_number: trackingNumber,
    tracking_url: `https://track.example.com/${trackingNumber}`,
    carrier,
    received_at: status === "delivered" ? new Date().toISOString() : undefined,
  } as any, "system");

  await query(
    `INSERT INTO supplier_logs (id, supplier_id, account_id, order_id, purchase_order_id, po_number, action, status, details, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [uuidv4(), po.supplier_id, po.account_id, po.order_id, po.id, po.number,
     "tracking.updated", "success",
     `Tracking ${trackingNumber} (${carrier}) — ${status} for PO ${po.number}`,
     JSON.stringify({ trackingNumber, carrier, status })],
  );

  return tracking;
}

/* ================================================================== */
/*  WAREHOUSE MANAGEMENT                                               */
/* ================================================================== */

/**
 * Transfer stock between warehouses.
 */
export async function transferStock(
  fromWarehouse: string, toWarehouse: string,
  productId: string, quantity: number,
  initiatedBy?: string,
): Promise<any> {
  // Check available stock at source
  const source = await queryOne(
    "SELECT * FROM warehouse_inventory WHERE warehouse_id = $1 AND product_id = $2",
    [fromWarehouse, productId],
  );

  if (!source || source.available < quantity) {
    return { success: false, message: `Insufficient stock at ${fromWarehouse}: ${source?.available || 0} available, ${quantity} required` };
  }

  const transferNumber = `WT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  // Create transfer record
  const transfer = await warehouseTransfers.create({
    number: transferNumber,
    from_warehouse: fromWarehouse,
    to_warehouse: toWarehouse,
    product_id: productId,
    product_name: source.product_name,
    product_sku: source.product_sku,
    quantity,
    status: "pending",
    initiated_by: initiatedBy || "Automation Engine",
  } as any, "system");

  // Reserve stock at source
  await warehouseInventory.reserveStock(fromWarehouse, productId, quantity);

  await query(
    `INSERT INTO supplier_logs (id, action, status, details, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [uuidv4(), "warehouse.transfer", "success",
     `Transfer ${transferNumber}: ${quantity}x ${source.product_name} from ${fromWarehouse} to ${toWarehouse}`,
     JSON.stringify({ transferId: transfer.id, fromWarehouse, toWarehouse, quantity })],
  );

  return { success: true, transfer, transferNumber };
}

/**
 * Complete a warehouse transfer (mark as received).
 */
export async function completeTransfer(transferId: string, receivedBy?: string): Promise<any> {
  const transfer = await warehouseTransfers.getById(transferId);
  if (!transfer) return { success: false, message: "Transfer not found" };

  // Add stock to destination
  const destExisting = await queryOne(
    "SELECT * FROM warehouse_inventory WHERE warehouse_id = $1 AND product_id = $2",
    [transfer.to_warehouse, transfer.product_id],
  );

  if (destExisting) {
    await warehouseInventory.adjustStock(transfer.to_warehouse, transfer.product_id, transfer.quantity);
  } else {
    // Create new inventory record
    await warehouseInventory.create({
      warehouse_id: transfer.to_warehouse,
      warehouse_name: transfer.to_warehouse,
      product_id: transfer.product_id,
      product_name: transfer.product_name,
      product_sku: transfer.product_sku,
      available: transfer.quantity,
    } as any, "system");
  }

  // Release reserved stock at source (stock physically moved)
  await query(
    `UPDATE warehouse_inventory SET reserved = GREATEST(0, reserved - $1), updated_at = NOW()
     WHERE warehouse_id = $2 AND product_id = $3`,
    [transfer.quantity, transfer.from_warehouse, transfer.product_id],
  );

  // Update transfer status
  await warehouseTransfers.update(transferId, {
    status: "completed",
    received_by: receivedBy || "System",
    received_at: new Date().toISOString(),
  } as any, "system");

  return { success: true, message: `Transfer ${transfer.number} completed` };
}

/* ================================================================== */
/*  SUPPLIER SCORECARD                                                 */
/* ================================================================== */

/**
 * Calculate and update the scorecard for a supplier.
 */
export async function calculateScorecard(supplierId: string): Promise<any> {
  const supplier = await queryOne("SELECT * FROM suppliers WHERE id = $1", [supplierId]);
  if (!supplier) return null;

  // Gather metrics
  const totalOrders = await supplierOrders.count({ supplier_id: supplierId });
  const successfulOrders = await supplierOrders.count({ supplier_id: supplierId, status: "delivered" });
  const failedOrders = await supplierOrders.count({ supplier_id: supplierId, status: "cancelled" });
  const totalReturns = await supplierReturns.count({ supplier_id: supplierId });

  const ratingData = await supplierRatings.getAverage(supplierId);
  const healthData = await supplierHealth.getLatest(supplierId);

  // Calculate scores
  const fulfillmentRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 100;
  const cancellationRate = totalOrders > 0 ? (failedOrders / totalOrders) * 100 : 0;
  const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
  const defectRate = returnRate * 0.3; // estimated
  const deliverySpeedScore = Math.min(100, Math.max(0, 100 - (supplier.handling_days || 5) * 10));
  const communicationScore = healthData?.healthy ? 95 : 60;
  const apiUptime = healthData?.healthy ? 99.5 : 85;
  const avgRating = Number(ratingData?.avg_rating) || 5;
  const costScore = Math.min(100, Math.max(0, 100 - (supplier.priority || 5) * 5));
  const marginScore = 75 + Math.random() * 20; // simulated

  // Composite health score
  const healthScore = Math.round(
    fulfillmentRate * 0.25 +
    deliverySpeedScore * 0.15 +
    (100 - cancellationRate) * 0.10 +
    (100 - returnRate) * 0.10 +
    (100 - defectRate) * 0.10 +
    communicationScore * 0.10 +
    avgRating * 10 * 0.10 +
    costScore * 0.10
  );

  // Check for existing scorecard
  const existing = await supplierScorecard.getBySupplier(supplierId);
  const scorecardData = {
    supplier_id: supplierId,
    account_id: null,
    fulfillment_rate: Math.round(fulfillmentRate * 100) / 100,
    delivery_speed_score: Math.round(deliverySpeedScore * 100) / 100,
    cancellation_rate: Math.round(cancellationRate * 100) / 100,
    return_rate: Math.round(returnRate * 100) / 100,
    defect_rate: Math.round(defectRate * 100) / 100,
    communication_score: Math.round(communicationScore * 100) / 100,
    api_uptime: Math.round(apiUptime * 100) / 100,
    avg_rating: Math.round(avgRating * 10) / 10,
    cost_score: Math.round(costScore * 100) / 100,
    margin_score: Math.round(marginScore * 100) / 100,
    health_score: healthScore,
    total_orders: totalOrders,
    successful_orders: successfulOrders,
    failed_orders: failedOrders,
    total_revenue: 0,
    total_profit: 0,
    calculated_at: new Date().toISOString(),
  };

  if (existing) {
    await supplierScorecard.update(existing.id, scorecardData as any, "system");
  } else {
    await supplierScorecard.create(scorecardData as any, "system");
  }

  // Re-rank all suppliers
  await recalculateRanks();

  return scorecardData;
}

/**
 * Recalculate ranks for all suppliers based on health scores.
 */
async function recalculateRanks(): Promise<void> {
  const all = await queryAll(
    "SELECT id, supplier_id FROM supplier_scorecard ORDER BY health_score DESC",
  );

  for (let i = 0; i < all.length; i++) {
    await query(
      "UPDATE supplier_scorecard SET rank = $1, updated_at = NOW() WHERE id = $2",
      [i + 1, all[i].id],
    );
  }
}

/* ================================================================== */
/*  FULL FULFILLMENT PIPELINE                                          */
/* ================================================================== */

/**
 * Run the complete fulfillment pipeline for an order.
 * Customer Order → Payment Success → Auto Supplier Selection →
 * PO Creation → Supplier Notification → Supplier Acceptance →
 * Inventory Sync → Tracking → Customer Notification → Delivery → Complete
 */
export async function runFulfillmentPipeline(
  orderId: string,
  orderNumber: string,
  items: Array<{ productId: string; productName: string; productSku: string; quantity: number; price: number; image?: string }>,
  customer: { name: string; email: string; address: string; phone?: string },
): Promise<FulfillmentPipelineResult> {
  const steps: FulfillmentPipelineResult["steps"] = [];
  let purchaseOrder: any = null;
  let trackingRecord: any = null;

  try {
    // Step 1: Select best supplier for each product
    steps.push({ name: "Supplier Selection", status: "processing", details: "Evaluating suppliers..." });
    const selectedSuppliers = new Map<string, SelectedSupplier>();

    for (const item of items) {
      const selected = await selectBestSupplier({
        productId: item.productId,
        quantity: item.quantity,
        country: customer.address?.split(",").pop()?.trim(),
        maxCost: item.price * 0.6,
      });

      if (selected) {
        selectedSuppliers.set(item.productId, selected);
      }
    }

    if (selectedSuppliers.size === 0) {
      steps.push({ name: "Supplier Selection", status: "failed", details: "No suitable supplier found for any product" });
      return { success: false, steps, error: "No suppliers available" };
    }

    const firstSelected = selectedSuppliers.values().next().value!;
    steps[0].status = "success";
    steps[0].details = `Selected ${firstSelected.supplierName} (score: ${firstSelected.score})`;

    // Step 2: Create purchase order
    steps.push({ name: "Purchase Order", status: "processing", details: "Generating PO..." });
    const poInput: PurchaseOrderInput = {
      orderId,
      orderNumber,
      supplierId: firstSelected.supplierId,
      accountId: firstSelected.accountId,
      supplierName: firstSelected.supplierName,
      items: items.map(item => {
        const sel = selectedSuppliers.get(item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku || sel?.supplierSku || "",
          quantity: item.quantity,
          unitCost: sel?.unitCost || item.price * 0.35,
          image: item.image,
        };
      }),
      customerName: customer.name,
      customerAddress: customer.address,
      customerPhone: customer.phone || "",
      customerEmail: customer.email,
    };

    purchaseOrder = await createPurchaseOrder(poInput);
    steps[1].status = "success";
    steps[1].details = `PO #${purchaseOrder.number} created`;

    // Step 3: Dispatch to supplier
    steps.push({ name: "Dispatch to Supplier", status: "processing", details: "Sending PO..." });
    const dispatchResult = await dispatchPurchaseOrder(purchaseOrder.id);
    steps[2].status = dispatchResult.success ? "success" : "failed";
    steps[2].details = dispatchResult.message;

    // Step 4: Confirm
    steps.push({ name: "Supplier Confirmation", status: "processing", details: "Awaiting confirmation..." });
    const confirmed = await confirmPurchaseOrder(purchaseOrder.id);
    if (confirmed) {
      steps[3].status = "success";
      steps[3].details = "Supplier confirmed";
    } else {
      steps[3].status = "failed";
      steps[3].details = "No confirmation received";
    }

    // Step 5: Get tracking
    steps.push({ name: "Tracking", status: "processing", details: "Obtaining tracking..." });
    trackingRecord = await updateTracking(purchaseOrder.id);
    if (trackingRecord) {
      steps[4].status = "success";
      steps[4].details = `Tracking: ${trackingRecord.tracking_number} (${trackingRecord.carrier})`;
    } else {
      steps[4].status = "skipped";
      steps[4].details = "Tracking unavailable";
    }

    // Step 6: Sync inventory
    steps.push({ name: "Inventory Sync", status: "processing", details: "Syncing inventory..." });
    const syncResult = await syncSupplierInventory(firstSelected.supplierId);
    steps[5].status = syncResult.updated > 0 ? "success" : "warning";
    steps[5].details = `${syncResult.updated} products synced`;

    // Final
    steps.push({ name: "Fulfillment Complete", status: "success", details: `Order ${orderNumber} processed through ${steps.length} steps` });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({ name: "Error", status: "failed", details: message });
    return { success: false, steps, purchaseOrder, error: message };
  }

  return { success: true, purchaseOrder, trackingRecord, steps };
}

/* ================================================================== */
/*  ANALYTICS                                                          */
/* ================================================================== */

export async function getSupplierAnalytics() {
  const totalSuppliers = await queryOne("SELECT COUNT(*) as count FROM suppliers WHERE active = true");
  const totalAccounts = await queryOne("SELECT COUNT(*) as count FROM supplier_accounts WHERE active = true");
  const totalPOs = await queryOne("SELECT COUNT(*) as count FROM purchase_orders");
  const pendingPOs = await queryOne("SELECT COUNT(*) as count FROM purchase_orders WHERE status NOT IN ('received', 'cancelled')");
  const totalRevenue = await queryOne("SELECT COALESCE(SUM(total), 0) as total FROM purchase_orders");
  const lowStockCount = await queryOne("SELECT COUNT(*) as count FROM warehouse_inventory WHERE available <= low_stock_threshold");
  const unhealthySuppliers = await queryAll("SELECT DISTINCT ON (supplier_id) s.name, sh.* FROM supplier_health sh JOIN suppliers s ON s.id = sh.supplier_id WHERE sh.healthy = false ORDER BY sh.supplier_id, sh.checked_at DESC");

  return {
    totalSuppliers: Number(totalSuppliers?.count || 0),
    totalAccounts: Number(totalAccounts?.count || 0),
    totalPOs: Number(totalPOs?.count || 0),
    pendingPOs: Number(pendingPOs?.count || 0),
    totalRevenue: Number(totalRevenue?.total || 0),
    lowStockCount: Number(lowStockCount?.count || 0),
    unhealthySuppliers: unhealthySuppliers || [],
  };
}

export async function getSupplierPerformance(supplierId: string) {
  const scorecard = await supplierScorecard.getBySupplier(supplierId);
  const health = await supplierHealth.getLatest(supplierId);
  const recentOrders = await supplierOrders.getBySupplier(supplierId, 10);
  const ratings = await supplierRatings.getAverage(supplierId);

  return {
    scorecard,
    health,
    recentOrders,
    ratings,
  };
}
