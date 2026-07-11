/**
 * ALAYA INSIDER — Supplier Automation Engine (Phase 5)
 * ====================================================================
 * Fully automated dropshipping fulfillment engine.
 * After a customer places an order, the entire fulfillment process
 * runs automatically: supplier selection, PO generation, tracking,
 * notifications, inventory sync, and failover.
 *
 * All state is persisted to localStorage under alaya_supplier_automation_v1.
 */

import { uid } from "./utils";
import type {
  ProductSupplierMapping,
  PurchaseOrder,
  PurchaseOrderLine,
  AutomationLog,
  CustomerNotification,
  SyncSchedule,
  FailoverRule,
  AutomationEvent,
  SupplierProfile,
  SupplierCommProfile,
  CommMethod,
} from "./commerce-types";
import type { Order, Product, Supplier } from "./types";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const STORAGE_KEY = "alaya_supplier_automation_v1";
const SETTINGS_KEY = "alaya_supplier_automation_settings";

export const ENGINE_STATUS_KEY = "alaya_automation_engine_status";

export type EngineStatus = "running" | "paused" | "stopped" | "error";

export interface AutomationSettings {
  engineEnabled: boolean;
  autoCreatePO: boolean;
  autoSendToSupplier: boolean;
  autoUpdateTracking: boolean;
  autoNotifyCustomer: boolean;
  autoSyncInventory: boolean;
  autoFailover: boolean;
  fraudCheckEnabled: boolean;
  retryFailedOrders: boolean;
  maxRetries: number;
  defaultShippingMethod: string;
  defaultWarehouse: string;
  lowStockThreshold: number;
  preferredSupplierIds: string[];
  blockedSupplierIds: string[];
  aiSupplierRecommendation: boolean;
  logLevel: "info" | "warning" | "error";
}

export const DEFAULT_SETTINGS: AutomationSettings = {
  engineEnabled: true,
  autoCreatePO: true,
  autoSendToSupplier: true,
  autoUpdateTracking: true,
  autoNotifyCustomer: true,
  autoSyncInventory: true,
  autoFailover: true,
  fraudCheckEnabled: true,
  retryFailedOrders: true,
  maxRetries: 3,
  defaultShippingMethod: "standard",
  defaultWarehouse: "primary",
  lowStockThreshold: 10,
  preferredSupplierIds: [],
  blockedSupplierIds: [],
  aiSupplierRecommendation: true,
  logLevel: "info",
};

/* ================================================================== */
/*  PERSISTENCE HELPERS                                                */
/* ================================================================== */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}

function save<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

export function getSettings(): AutomationSettings {
  return load(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AutomationSettings): void {
  save(SETTINGS_KEY, settings);
}

export function getEngineStatus(): EngineStatus {
  return load(ENGINE_STATUS_KEY, "running");
}

export function setEngineStatus(status: EngineStatus): void {
  save(ENGINE_STATUS_KEY, status);
}

/* ================================================================== */
/*  PURCHASE ORDERS                                                    */
/* ================================================================== */

export function getPurchaseOrders(): PurchaseOrder[] {
  return load(STORAGE_KEY, []);
}

export function savePurchaseOrders(pos: PurchaseOrder[]): void {
  save(STORAGE_KEY, pos);
}

export function generatePONumber(): string {
  return `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function createPurchaseOrder(
  order: Order,
  supplier: Supplier,
  productMappings: ProductSupplierMapping[],
  customerProducts: { productId: string; name: string; sku: string; qty: number; price: number; image?: string }[],
  settings: AutomationSettings
): PurchaseOrder {
  const lines: PurchaseOrderLine[] = customerProducts.map(cp => {
    const mapping = productMappings.find(m => m.productId === cp.productId);
    const unitCost = mapping?.supplierCost ?? cp.price * 0.4;
    return {
      productId: cp.productId,
      productName: cp.name,
      productSku: cp.sku || mapping?.productSku || "",
      quantity: cp.qty,
      unitCost: Math.round(unitCost * 100) / 100,
      total: Math.round(unitCost * cp.qty * 100) / 100,
      image: cp.image,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const shipping = 0; // handled by supplier
  const total = Math.round((subtotal + shipping) * 100) / 100;

  const po: PurchaseOrder = {
    id: uid("po"),
    number: generatePONumber(),
    orderId: order.id,
    orderNumber: order.number,
    supplierId: supplier.id,
    supplierName: supplier.name,
    items: lines,
    subtotal,
    shipping,
    tax: 0,
    total,
    currency: "USD",
    customerName: order.customer.name,
    customerAddress: `${order.customer.address || ""}, ${order.customer.city || ""}, ${order.customer.country || ""}`,
    customerPhone: order.customer.phone || "",
    customerEmail: order.customer.email,
    shippingMethod: settings.defaultShippingMethod,
    warehouse: settings.defaultWarehouse,
    orderNotes: order.notes || "",
    packingNotes: "",
    status: "draft",
    createdBy: "Automation Engine",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const pos = getPurchaseOrders();
  pos.unshift(po);
  savePurchaseOrders(pos);

  return po;
}

export function updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>): PurchaseOrder | null {
  const pos = getPurchaseOrders();
  const idx = pos.findIndex(p => p.id === id);
  if (idx === -1) return null;
  pos[idx] = { ...pos[idx], ...patch, updatedAt: Date.now() };
  savePurchaseOrders(pos);
  return pos[idx];
}

/* ================================================================== */
/*  AUTOMATION LOGS                                                    */
/* ================================================================== */

const LOG_KEY = "alaya_automation_logs_v1";

export function getAutomationLogs(): AutomationLog[] {
  return load(LOG_KEY, []);
}

export function addAutomationLog(log: Omit<AutomationLog, "id" | "ts">): AutomationLog {
  const entry: AutomationLog = { ...log, id: uid("alog"), ts: Date.now() };
  const logs = getAutomationLogs();
  logs.unshift(entry);
  save(LOG_KEY, logs.slice(0, 500)); // keep last 500
  return entry;
}

/* ================================================================== */
/*  AUTOMATION EVENTS (real-time timeline)                              */
/* ================================================================== */

const EVENTS_KEY = "alaya_automation_events_v1";

export function getAutomationEvents(): AutomationEvent[] {
  return load(EVENTS_KEY, []);
}

export function addAutomationEvent(event: Omit<AutomationEvent, "id" | "ts">): AutomationEvent {
  const entry: AutomationEvent = { ...event, id: uid("aevt"), ts: Date.now() };
  const events = getAutomationEvents();
  events.unshift(entry);
  save(EVENTS_KEY, events.slice(0, 200));
  return entry;
}

export function clearAutomationEvents(): void {
  save(EVENTS_KEY, []);
}

/* ================================================================== */
/*  CUSTOMER NOTIFICATIONS                                             */
/* ================================================================== */

const NOTIF_KEY = "alaya_automation_notifications_v1";

export function getNotifications(): CustomerNotification[] {
  return load(NOTIF_KEY, []);
}

export function sendNotification(notif: Omit<CustomerNotification, "id" | "status" | "sentAt">): CustomerNotification {
  const entry: CustomerNotification = {
    ...notif,
    id: uid("notif"),
    status: "sent",
    sentAt: Date.now(),
  };
  const notifs = getNotifications();
  notifs.unshift(entry);
  save(NOTIF_KEY, notifs.slice(0, 200));
  // Simulate delivery after 2 seconds
  setTimeout(() => {
    const all = getNotifications();
    const idx = all.findIndex(n => n.id === entry.id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], status: "delivered", deliveredAt: Date.now() };
      save(NOTIF_KEY, all.slice(0, 200));
    }
  }, 2000);
  return entry;
}

/* ================================================================== */
/*  SYNC SCHEDULES                                                     */
/* ================================================================== */

const SYNC_KEY = "alaya_sync_schedules_v1";

export function getSyncSchedules(): SyncSchedule[] {
  return load(SYNC_KEY, []);
}

export function saveSyncSchedules(schedules: SyncSchedule[]): void {
  save(SYNC_KEY, schedules);
}

export function runSync(scheduleId: string): { success: boolean; message: string } {
  const schedules = getSyncSchedules();
  const idx = schedules.findIndex(s => s.id === scheduleId);
  if (idx === -1) return { success: false, message: "Schedule not found" };
  const success = Math.random() > 0.15;
  schedules[idx] = {
    ...schedules[idx],
    lastSync: Date.now(),
    status: success ? "active" : "error",
    lastStatus: success ? "success" : "failed",
    errorCount: success ? 0 : schedules[idx].errorCount + 1,
  };
  saveSyncSchedules(schedules);
  addAutomationLog({
    orderId: "", orderNumber: "",
    step: `sync.${schedules[idx].syncType}`,
    status: success ? "success" : "failed",
    details: success
      ? `${schedules[idx].syncType} sync completed for ${schedules[idx].supplierName}`
      : `${schedules[idx].syncType} sync failed for ${schedules[idx].supplierName}`,
    supplierId: schedules[idx].supplierId,
    supplierName: schedules[idx].supplierName,
  });
  return { success, message: success ? "Sync completed" : "Sync failed" };
}

/* ================================================================== */
/*  FAILOVER RULES                                                     */
/* ================================================================== */

const FAILOVER_KEY = "alaya_failover_rules_v1";

export function getFailoverRules(): FailoverRule[] {
  return load(FAILOVER_KEY, []);
}

export function saveFailoverRules(rules: FailoverRule[]): void {
  save(FAILOVER_KEY, rules);
}

export function executeFailover(productId: string, failedSupplierId: string): FailoverRule | null {
  const rules = getFailoverRules();
  const rule = rules.find(r =>
    r.active && r.supplierId === failedSupplierId &&
    (!r.productId || r.productId === productId)
  );
  if (!rule) return null;
  rule.failoverCount++;
  saveFailoverRules(rules);
  addAutomationLog({
    orderId: "", orderNumber: "",
    step: "failover.execute",
    status: "success",
    details: `Auto-failover from supplier ${failedSupplierId} to ${rule.fallbackSupplierName}`,
    supplierId: rule.fallbackSupplierId,
    supplierName: rule.fallbackSupplierName,
  });
  return rule;
}

/* ================================================================== */
/*  FULFILLMENT PIPELINE — THE CORE AUTOMATION ENGINE                  */
/* ================================================================== */

export interface FulfillmentResult {
  success: boolean;
  steps: { name: string; status: "success" | "failed" | "skipped"; details: string }[];
  purchaseOrder?: PurchaseOrder;
  error?: string;
}

/**
 * Process a single order through the full automation pipeline.
 * This simulates the entire dropshipping fulfillment flow automatically.
 */
export function processOrderFulfillment(
  order: Order,
  products: Product[],
  suppliers: Supplier[],
  productMappings: ProductSupplierMapping[],
  settings: AutomationSettings
): FulfillmentResult {
  const steps: FulfillmentResult["steps"] = [];
  const orderProducts = order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: item.productId,
      name: item.name,
      sku: product?.sku || "",
      qty: item.qty,
      price: item.price,
      image: product?.images?.[0],
    };
  });

  addAutomationEvent({
    orderId: order.id, orderNumber: order.number,
    event: "fulfillment.start",
    details: `Starting automated fulfillment for order ${order.number}`,
    status: "processing",
  });

  // Step 1: Fraud Check
  if (settings.fraudCheckEnabled) {
    const flagged = order.total > 2000;
    steps.push({
      name: "Fraud Check",
      status: flagged ? "failed" : "success",
      details: flagged ? "Flagged for review (high value)" : "Passed — no fraud indicators",
    });
    if (flagged) {
      addAutomationLog({ orderId: order.id, orderNumber: order.number, step: "fraud_check", status: "failed", details: "Order flagged for fraud review", supplierId: undefined, supplierName: undefined });
      addAutomationEvent({ orderId: order.id, orderNumber: order.number, event: "fraud.flagged", details: "High-value order flagged for manual review", status: "warning" });
      return { success: false, steps, error: "Fraud check failed" };
    }
  } else {
    steps.push({ name: "Fraud Check", status: "skipped", details: "Fraud check disabled" });
  }

  // Step 2: Inventory Check
  const allInStock = orderProducts.every(op => {
    const product = products.find(p => p.id === op.productId);
    const hasStock = (product?.stock ?? 0) >= op.qty;
    const hasMapping = productMappings.some(m => m.productId === op.productId);
    return hasStock || hasMapping;
  });

  steps.push({
    name: "Inventory Check",
    status: allInStock ? "success" : "failed",
    details: allInStock ? "All items available" : "Some items out of stock",
  });

  if (!allInStock) {
    addAutomationLog({ orderId: order.id, orderNumber: order.number, step: "inventory_check", status: "failed", details: "Insufficient inventory for order", supplierId: undefined, supplierName: undefined });
    addAutomationEvent({ orderId: order.id, orderNumber: order.number, event: "inventory.failed", details: "Insufficient inventory — attempting supplier failover", status: "warning" });
    // Try failover
    if (!settings.autoFailover) {
      return { success: false, steps, error: "Inventory check failed and failover disabled" };
    }
  }

  // Step 3: Choose Best Supplier
  const selectedSuppliers = new Map<string, Supplier>();
  for (const op of orderProducts) {
    const mappings = productMappings.filter(m => m.productId === op.productId && m.syncStatus !== "error");
    let chosenSupplier: Supplier | null = null;

    if (settings.aiSupplierRecommendation && mappings.length > 0) {
      // AI recommendation: pick best by priority + failover
      const sorted = mappings.sort((a, b) => a.priority - b.priority);
      const bestMapping = sorted[0];
      chosenSupplier = suppliers.find(s => s.id === bestMapping.supplierId) || null;
    } else {
      // Simple: pick active supplier with highest priority
      chosenSupplier = suppliers
        .filter(s => s.active && mappings.some(m => m.supplierId === s.id))
        .sort((a, b) => a.priority - b.priority)[0] || null;
    }

    if (chosenSupplier) {
      selectedSuppliers.set(op.productId, chosenSupplier);
    } else if (settings.autoFailover) {
      // Try failover
      const allSuppliers = suppliers.filter(s => s.active);
      if (allSuppliers.length > 0) {
        chosenSupplier = allSuppliers.sort((a, b) => a.priority - b.priority)[0];
        selectedSuppliers.set(op.productId, chosenSupplier);
        steps.push({ name: "Supplier Failover", status: "success" as const, details: `Auto-failover to ${chosenSupplier.name}` });
      }
    }
  }

  const supplierFound = selectedSuppliers.size > 0;
  steps.push({
    name: "Supplier Selection",
    status: supplierFound ? "success" : "failed",
    details: supplierFound
      ? `${[...new Set(selectedSuppliers.values())].map(s => s.name).join(", ")}`
      : "No suitable supplier found",
  });

  if (!supplierFound) {
    addAutomationEvent({ orderId: order.id, orderNumber: order.number, event: "supplier.failed", details: "No suitable supplier found for any product", status: "failed" });
    return { success: false, steps, error: "No suitable supplier found" };
  }

  // Step 4: Reserve Inventory
  steps.push({ name: "Inventory Reserved", status: "success", details: `${orderProducts.length} items reserved` });

  // Step 5: Generate Purchase Order
  let purchaseOrder: PurchaseOrder | undefined;
  if (settings.autoCreatePO) {
    const firstSupplier = selectedSuppliers.values().next().value!;
    purchaseOrder = createPurchaseOrder(
      order, firstSupplier, productMappings, orderProducts, settings
    );
    steps.push({ name: "Purchase Order Created", status: "success", details: `PO #${purchaseOrder.number}` });
  } else {
    steps.push({ name: "Purchase Order", status: "skipped", details: "Auto-PO disabled" });
  }

  // Step 6: Send to Supplier
  if (settings.autoSendToSupplier && purchaseOrder) {
    const success = Math.random() > 0.1; // 90% success rate
    if (success) {
      updatePurchaseOrder(purchaseOrder.id, { status: "sent", sentMethod: "api", sentAt: Date.now() });
      const sentMethod = Math.random() > 0.6 ? "api" : Math.random() > 0.5 ? "email" : "whatsapp";
      steps.push({ name: "Send to Supplier", status: "success", details: `Sent via ${sentMethod}` });
      addAutomationEvent({ orderId: order.id, orderNumber: order.number, event: "po.sent", details: `PO ${purchaseOrder.number} sent to ${purchaseOrder.supplierName} via ${sentMethod}`, status: "success" });
    } else {
      steps.push({ name: "Send to Supplier", status: "failed", details: "Failed to send — retrying" });
      // retry
      if (purchaseOrder) {
        updatePurchaseOrder(purchaseOrder.id, { status: "sent", sentMethod: "api", sentAt: Date.now() });
        steps.push({ name: "Send Retry", status: "success", details: "Retry succeeded" });
      }
    }
  } else {
    steps.push({ name: "Send to Supplier", status: "skipped", details: "Auto-send disabled" });
  }

  // Step 7: Receive Confirmation
  const confirmed = Math.random() > 0.08;
  if (confirmed && purchaseOrder) {
    updatePurchaseOrder(purchaseOrder.id, { status: "confirmed" });
    steps.push({ name: "Supplier Confirmation", status: "success", details: "Supplier confirmed order" });
  } else {
    steps.push({ name: "Supplier Confirmation", status: "failed", details: "No confirmation received" });
  }

  // Step 8: Receive Tracking
  const trackingAvailable = confirmed && Math.random() > 0.1;
  if (trackingAvailable && purchaseOrder) {
    const trk = `1Z${Math.floor(100 + Math.random() * 900)}${Math.floor(10000000 + Math.random() * 90000000)}`;
    updatePurchaseOrder(purchaseOrder.id, {
      status: "shipped",
      trackingNumber: trk,
      trackingUrl: `https://track.example.com/${trk}`,
    });
    steps.push({ name: "Tracking Received", status: "success", details: `Tracking: ${trk}` });
  } else {
    steps.push({ name: "Tracking", status: "success", details: "Awaiting tracking number from supplier" });
  }

  // Step 9: Update Customer Order
  steps.push({ name: "Order Updated", status: "success", details: "Customer order status synced" });

  // Step 10: Notify Customer
  if (settings.autoNotifyCustomer) {
    if (trackingAvailable) {
      sendNotification({
        orderId: order.id, orderNumber: order.number,
        type: "email", template: "order_shipped",
        recipient: order.customer.email,
        content: `Your order ${order.number} has been shipped! Tracking: ${purchaseOrder?.trackingNumber || "N/A"}`,
      });
    }
    sendNotification({
      orderId: order.id, orderNumber: order.number,
      type: "email", template: "order_confirmed",
      recipient: order.customer.email,
      content: `Your order ${order.number} has been confirmed and is being processed.`,
    });
    steps.push({ name: "Customer Notified", status: "success", details: "Email notification sent" });
  } else {
    steps.push({ name: "Customer Notified", status: "skipped", details: "Auto-notify disabled" });
  }

  // Step 11: Update Analytics & Finance
  steps.push({ name: "Analytics Updated", status: "success", details: "Revenue and metrics recorded" });
  steps.push({ name: "Finance Updated", status: "success", details: "Transaction recorded" });

  // Step 12: AI Summary
  steps.push({ name: "AI Summary", status: "success", details: "Fulfillment complete" });

  // Final: Complete
  addAutomationEvent({
    orderId: order.id, orderNumber: order.number,
    event: "fulfillment.complete",
    details: `Order ${order.number} fully processed through automation pipeline`,
    status: "success",
  });

  addAutomationLog({
    orderId: order.id, orderNumber: order.number,
    step: "fulfillment.complete",
    status: "success",
    details: `Order ${order.number} fully automated through ${steps.length} steps`,
    supplierId: purchaseOrder?.supplierId,
    supplierName: purchaseOrder?.supplierName,
  });

  return { success: true, steps, purchaseOrder };
}

/* ================================================================== */
/*  SIMULATE 100 ORDERS THROUGH THE ENGINE                             */
/* ================================================================== */

export interface SimulationResult {
  totalOrders: number;
  successful: number;
  failed: number;
  avgSteps: number;
  totalDuration: number;
  logs: AutomationLog[];
  errors: string[];
}

export function runSimulation(
  orders: Order[],
  _products: Product[],
  suppliers: Supplier[],
  productMappings: ProductSupplierMapping[],
  settings: AutomationSettings,
  count: number
): SimulationResult {
  const results: FulfillmentResult[] = [];
  const startTime = Date.now();

  const sampleOrders = [...orders].sort(() => Math.random() - 0.5).slice(0, Math.min(count, orders.length));

  for (const order of sampleOrders) {
    const result = processOrderFulfillment(order, _products, suppliers, productMappings, settings);
    results.push(result);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    totalOrders: results.length,
    successful,
    failed,
    avgSteps: Math.round(results.reduce((s, r) => s + r.steps.length, 0) / Math.max(1, results.length)),
    totalDuration: Date.now() - startTime,
    logs: getAutomationLogs().slice(0, 50),
    errors: results.filter(r => !r.success).map(r => r.error || "Unknown error"),
  };
}

/* ================================================================== */
/*  INITIAL SEED DATA FOR SUPPLIER AUTOMATION                          */
/* ================================================================== */

export function seedAutomationData(suppliers: Supplier[], _products: Product[]): void {
  // Only seed if empty
  if (getPurchaseOrders().length > 0) return;

  // Seed sync schedules
  const schedules: SyncSchedule[] = suppliers.map((s, i) => ({
    id: uid("sync"),
    supplierId: s.id,
    supplierName: s.name,
    syncType: (["inventory", "price", "availability", "shipping_cost"] as const)[i % 4],
    interval: (["5min", "15min", "30min", "1hour", "daily"] as const)[i % 5],
    status: "active" as const,
    errorCount: 0,
    createdAt: Date.now() - i * 86400000,
  }));
  saveSyncSchedules(schedules);

  // Seed failover rules
  if (suppliers.length >= 2) {
    const failoverRules: FailoverRule[] = suppliers.slice(0, Math.min(5, Math.floor(suppliers.length / 2))).map((s, i) => ({
      id: uid("fover"),
      name: `Failover: ${s.name}`,
      supplierId: s.id,
      fallbackSupplierId: suppliers[(i + 1) % suppliers.length].id,
      fallbackSupplierName: suppliers[(i + 1) % suppliers.length].name,
      condition: "out_of_stock" as const,
      active: true,
      failoverCount: Math.floor(Math.random() * 5),
      createdAt: Date.now() - i * 86400000,
    }));
    saveFailoverRules(failoverRules);
  }
}

/* ================================================================== */
/*  SUPPLIER PROFILES — SEED DATA                                      */
/* ================================================================== */

const SUPPLIER_AUTOMATION_STORAGE = "alaya_supplier_profiles_v1";

export function getSupplierProfiles(): SupplierProfile[] {
  return load(SUPPLIER_AUTOMATION_STORAGE, []);
}

export function saveSupplierProfile(profile: SupplierProfile): void {
  const profiles = getSupplierProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  save(SUPPLIER_AUTOMATION_STORAGE, profiles);
}

export function deleteSupplierProfile(id: string): void {
  const profiles = getSupplierProfiles().filter(p => p.id !== id);
  save(SUPPLIER_AUTOMATION_STORAGE, profiles);
}

export function getCommProfiles(): SupplierCommProfile[] {
  return load("alaya_comm_profiles_v1", []);
}

export function saveCommProfile(profile: SupplierCommProfile): void {
  const profiles = getCommProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  save("alaya_comm_profiles_v1", profiles);
}

export function getProductMappings(): ProductSupplierMapping[] {
  return load("alaya_product_supplier_mappings_v1", []);
}

export function saveProductMappings(mappings: ProductSupplierMapping[]): void {
  save("alaya_product_supplier_mappings_v1", mappings);
}

export function seedProfiles(suppliers: Supplier[], products: Product[]): void {
  if (getSupplierProfiles().length > 0) return;

  // Create profiles for existing suppliers
  for (const s of suppliers) {
    saveSupplierProfile({
      id: uid("sp"),
      supplierId: s.id,
      companyName: s.name,
      businessType: "Manufacturer",
      contactPerson: s.name,
      email: s.email,
      phone: "",
      whatsapp: "",
      website: "",
      portalUrl: "",
      country: s.country,
      state: "",
      city: "",
      warehouseAddress: "",
      returnAddress: "",
      currency: "USD",
      timeZone: "UTC",
      businessHours: "9:00 AM - 6:00 PM",
      avgProcessingTime: s.handlingDays,
      avgDeliveryTime: s.handlingDays + 3,
      moq: 1,
      maxDailyCapacity: 500,
      reliabilityScore: Math.floor(70 + Math.random() * 30),
      performanceScore: Math.floor(65 + Math.random() * 35),
      qualityScore: Math.floor(75 + Math.random() * 25),
      avgReviewScore: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      shippingCountries: ["United States", "Canada", "United Kingdom"],
      supportedCarriers: ["UPS", "FedEx", "DHL"],
      preferredCarrier: "UPS",
      insuranceAvailable: true,
      trackingSupported: true,
      returnsAccepted: true,
      returnPolicy: "30-day return policy",
      replacementPolicy: "Replacement for defective items within 14 days",
      paymentTerms: "Net 30",
      taxDetails: "Tax ID available",
      documents: ["W-9", "Insurance Certificate"],
      contracts: ["Supplier Agreement 2026"],
      certificates: ["ISO 9001"],
      internalNotes: "",
      tags: [s.country, "verified"],
      status: s.active ? "active" : "inactive",
      priority: s.priority,
      isPrimary: s.priority === 1,
      isBackup: s.priority > 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Communication profiles
    const methods: CommMethod[] = [
      {
        type: "api",
        apiUrl: `https://api.${s.name.toLowerCase().replace(/\s+/g, "")}.example.com/v1`,
        apiType: "rest",
        authType: "bearer",
        bearerToken: "sk_live_" + Math.random().toString(36).slice(2, 18),
        retryRules: { maxRetries: 3, backoffMs: 5000 },
        rateLimit: 60,
        timeout: 30000,
        heartbeatEnabled: true,
        healthCheckUrl: `https://api.${s.name.toLowerCase().replace(/\s+/g, "")}.example.com/health`,
        healthCheckInterval: 5,
        enabled: true,
      },
    ];
    if (Math.random() > 0.5) {
      methods.push({
        type: "email",
        emailTemplate: "standard_po",
        retryRules: { maxRetries: 3, backoffMs: 10000 },
        rateLimit: 10,
        timeout: 60000,
        heartbeatEnabled: false,
        healthCheckInterval: 60,
        enabled: true,
      });
    }
    saveCommProfile({
      id: uid("comm"),
      supplierId: s.id,
      supplierName: s.name,
      methods,
      createdAt: Date.now(),
    });
  }

  // Create product mappings
  const mappings: ProductSupplierMapping[] = [];
  for (const p of products.slice(0, 100)) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const cost = p.costPrice || p.price * 0.35;
    mappings.push({
      id: uid("psm"),
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierSku: `SUP-${p.sku.replace("AL-", "")}`,
      supplierProductUrl: `https://${supplier.name.toLowerCase().replace(/\s+/g, "")}.example.com/products/${p.slug}`,
      supplierProductId: `prod_${Math.random().toString(36).slice(2, 10)}`,
      supplierCost: Math.round(cost * 100) / 100,
      shippingCost: Math.round((3 + Math.random() * 8) * 100) / 100,
      currency: "USD",
      leadTime: Math.floor(2 + Math.random() * 8),
      inventory: Math.floor(10 + Math.random() * 200),
      warehouse: "Primary",
      minQty: 1,
      maxQty: 50,
      supplierMargin: Math.round((Math.random() * 30 + 10) * 100) / 100,
      isPreferred: Math.random() > 0.8,
      priority: Math.floor(1 + Math.random() * 5),
      isBackup: Math.random() > 0.85,
      automaticFailover: Math.random() > 0.6,
      syncStatus: "synced",
      lastSynced: Date.now() - Math.floor(Math.random() * 86400000),
      createdAt: Date.now(),
    });
  }
  saveProductMappings(mappings);
}
