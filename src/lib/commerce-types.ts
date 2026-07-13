/**
 * ALAYA INSIDER — Enterprise Commerce & Dropshipping Domain Types (Phase 4)
 * ====================================================================
 * These types extend the existing domain model for the Commerce Workspace.
 * All types integrate with existing StoreData entities.
 */

import type { OrderStatus } from "./types";

/* ================================================================== */
/*  DROPSHIPPING / SUPPLIER PRODUCT EXTENSIONS                         */
/* ================================================================== */

/** A product's supplier relationship (one product can have multiple suppliers). */
export interface SupplierProduct {
  id: string;
  productId: string;
  supplierId: string;
  supplierName: string;
  supplierSku: string;
  supplierUrl: string;
  supplierCost: number;
  currency: string;
  targetMargin: number;
  sellingPrice: number;
  profit: number;
  profitPercent: number;
  weight: number; // kg
  dimensions: { length: number; width: number; height: number }; // cm
  warehouse: string;
  shippingProfileId: string;
  returnPolicy: string;
  leadTimeDays: number;
  moq: number;
  priority: number; // 1 = primary
  supplierRating: number; // 1-5
  expectedDelivery: number; // days
  notes: string;
  active: boolean;
  syncStatus: "synced" | "pending" | "error" | "manual";
  automationRules: AutomationRule[];
  createdAt: number;
  updatedAt: number;
}

/* ================================================================== */
/*  WAREHOUSE                                                          */
/* ================================================================== */

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  capacity: number; // cubic meters
  usedCapacity: number;
  temperature: string; // "ambient" | "climate_controlled" | "cold_storage"
  active: boolean;
  isPrimary: boolean;
  createdAt: number;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSku: string;
  available: number;
  reserved: number;
  incoming: number;
  damaged: number;
  returned: number;
  transit: number;
  totalStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastCounted: number;
  updatedAt: number;
}

/* ================================================================== */
/*  SHIPPING                                                           */
/* ================================================================== */

export interface ShippingProfile {
  id: string;
  name: string;
  description: string;
  carrier: string;
  method: "standard" | "express" | "overnight" | "pickup";
  baseRate: number;
  ratePerKg: number;
  freeShippingThreshold: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  trackingRequired: boolean;
  signatureRequired: boolean;
  insuranceIncluded: boolean;
  active: boolean;
  zones: ShippingZone[];
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rateMultiplier: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface CarrierSetting {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  testMode: boolean;
  active: boolean;
  services: string[];
}

/* ================================================================== */
/*  PRICING ENGINE                                                     */
/* ================================================================== */

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: "fixed_margin" | "percentage_margin" | "competitor_match" | "cost_plus" | "dynamic";
  value: number;
  minMargin: number;
  maxMargin: number;
  appliesTo: "all" | "category" | "brand" | "supplier" | "product";
  appliesToIds: string[];
  active: boolean;
  schedule?: PricingSchedule;
  createdAt: number;
}

export interface PricingSchedule {
  enabled: boolean;
  startDate?: number;
  endDate?: number;
  flashSale?: boolean;
  flashSaleStart?: number;
  flashSaleEnd?: number;
  flashSaleDiscount?: number;
}

export interface CompetitorPrice {
  id: string;
  productId: string;
  competitor: string;
  url: string;
  price: number;
  inStock: boolean;
  lastChecked: number;
}

/* ================================================================== */
/*  AUTOMATION ENGINE                                                  */
/* ================================================================== */

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type AutomationTrigger = 
  | "order_received" 
  | "order_confirmed" 
  | "order_paid"
  | "order_shipped"
  | "order_delivered"
  | "stock_low"
  | "stock_out"
  | "supplier_confirmed"
  | "return_requested"
  | "customer_created"
  | "schedule"
  | "manual";

export interface AutomationCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in" | "between" | "is_set";
  value: string | number | string[];
}

export interface AutomationAction {
  type: "send_email" | "notify_admin" | "create_purchase_order" | "update_supplier"
    | "update_inventory" | "update_order_status" | "send_sms" | "create_task"
    | "update_tracking" | "charge_payment" | "refund_payment" | "webhook";
  config: Record<string, string | number | boolean>;
}

/* ================================================================== */
/*  FINANCE                                                            */
/* ================================================================== */

export interface FinanceRecord {
  id: string;
  type: "revenue" | "expense" | "refund" | "chargeback" | "supplier_payment" | "fee" | "tax";
  category: string;
  description: string;
  amount: number;
  currency: string;
  orderId?: string;
  orderNumber?: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  purchaseOrderId?: string;
  date: number;
  notes?: string;
  attachedFile?: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "confirmed" | "shipped" | "received" | "cancelled";
  expectedDelivery?: number;
  deliveredAt?: number;
  notes?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PurchaseOrderLine {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  type: "sales" | "purchase" | "credit_note" | "refund";
  orderId?: string;
  orderNumber?: string;
  supplierId?: string;
  supplierName?: string;
  customerName: string;
  customerEmail: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate?: number;
  paidAt?: number;
  notes: string;
  createdAt: number;
}

/* ================================================================== */
/*  REPORT                                                             */
/* ================================================================== */

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: "revenue" | "orders" | "products" | "suppliers" | "inventory" | "customers" | "returns" | "marketing" | "shipping" | "finance" | "automation";
  filters: ReportFilter[];
  columns: ReportColumn[];
  schedule?: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    recipients: string[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  format?: "currency" | "number" | "percentage" | "date" | "text";
}

/* ================================================================== */
/*  SUPPLIER AUTOMATION ENGINE — Phase 5                               */
/* ================================================================== */

/** Complete supplier profile for the automation engine. */
export interface SupplierProfile {
  id: string;
  supplierId: string;
  companyName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  portalUrl: string;
  country: string;
  state: string;
  city: string;
  warehouseAddress: string;
  returnAddress: string;
  currency: string;
  timeZone: string;
  businessHours: string;
  avgProcessingTime: number; // days
  avgDeliveryTime: number; // days
  moq: number;
  maxDailyCapacity: number;
  reliabilityScore: number; // 0-100
  performanceScore: number; // 0-100
  qualityScore: number; // 0-100
  avgReviewScore: number; // 0-5
  shippingCountries: string[];
  supportedCarriers: string[];
  preferredCarrier: string;
  insuranceAvailable: boolean;
  trackingSupported: boolean;
  returnsAccepted: boolean;
  returnPolicy: string;
  replacementPolicy: string;
  paymentTerms: string;
  taxDetails: string;
  documents: string[];
  contracts: string[];
  certificates: string[];
  internalNotes: string;
  tags: string[];
  status: "active" | "inactive" | "blacklisted";
  priority: number;
  isPrimary: boolean;
  isBackup: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Communication configuration for a supplier. */
export interface SupplierCommProfile {
  id: string;
  supplierId: string;
  supplierName: string;
  methods: CommMethod[];
  createdAt: number;
}

export interface CommMethod {
  type: "api" | "email" | "whatsapp" | "csv" | "ftp" | "webhook" | "manual";
  apiUrl?: string;
  apiType?: "rest" | "graphql" | "soap";
  authType?: "bearer" | "api_key" | "basic" | "oauth";
  apiKey?: string;
  apiSecret?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  oauthToken?: string;
  oauthRefreshToken?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  emailTemplate?: string;
  whatsappTemplate?: string;
  csvMapping?: Record<string, string>;
  retryRules: { maxRetries: number; backoffMs: number; };
  rateLimit: number; // requests per minute
  timeout: number; // ms
  heartbeatEnabled: boolean;
  healthCheckUrl?: string;
  healthCheckInterval: number; // minutes
  enabled: boolean;
}

/** Product-to-supplier mapping with failover. */
export interface ProductSupplierMapping {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  supplierId: string;
  supplierName: string;
  supplierSku: string;
  supplierProductUrl: string;
  supplierProductId: string;
  supplierCost: number;
  shippingCost: number;
  currency: string;
  leadTime: number; // days
  inventory: number;
  warehouse: string;
  minQty: number;
  maxQty: number;
  supplierMargin: number;
  isPreferred: boolean;
  priority: number;
  isBackup: boolean;
  automaticFailover: boolean;
  syncStatus: "synced" | "pending" | "error";
  lastSynced?: number;
  createdAt: number;
}

/** A generated purchase order. */
export interface PurchaseOrder {
  id: string;
  number: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  shippingMethod: string;
  warehouse: string;
  expectedDelivery?: number;
  orderNotes: string;
  packingNotes: string;
  barcode?: string;
  status: "draft" | "sent" | "confirmed" | "shipped" | "received" | "cancelled";
  sentMethod?: "api" | "email" | "whatsapp" | "manual";
  sentAt?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PurchaseOrderLine {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  total: number;
  image?: string;
}

/** Automation log entry (each step in the fulfillment pipeline). */
export interface AutomationLog {
  id: string;
  orderId: string;
  orderNumber: string;
  step: string;
  status: "success" | "failed" | "pending" | "skipped";
  details: string;
  supplierId?: string;
  supplierName?: string;
  duration?: number; // ms
  ts: number;
}

/** An automated notification template/record. */
export interface CustomerNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  type: "email" | "sms" | "push";
  template: string;
  recipient: string;
  status: "sent" | "delivered" | "opened" | "failed";
  content: string;
  sentAt: number;
  deliveredAt?: number;
  openedAt?: number;
  failedReason?: string;
}

/** Sync schedule for inventory/price sync. */
export interface SyncSchedule {
  id: string;
  supplierId: string;
  supplierName: string;
  syncType: "inventory" | "price" | "availability" | "shipping_cost" | "variants" | "warehouse" | "images" | "product_status";
  interval: "5min" | "15min" | "30min" | "1hour" | "daily" | "manual";
  lastSync?: number;
  nextSync?: number;
  status: "active" | "paused" | "error";
  lastStatus?: "success" | "failed";
  errorCount: number;
  createdAt: number;
}

/** Failover rule for automatic supplier switching. */
export interface FailoverRule {
  id: string;
  name: string;
  productId?: string;
  productName?: string;
  supplierId: string;
  fallbackSupplierId: string;
  fallbackSupplierName: string;
  condition: "out_of_stock" | "price_increase" | "delay" | "error" | "any";
  active: boolean;
  failoverCount: number;
  createdAt: number;
}

/** AI recommendation for supplier selection. */
export interface SupplierAIRecommendation {
  supplierId: string;
  supplierName: string;
  reasons: string[];
  score: number;
  estimatedCost: number;
  estimatedDelivery: number;
  reliability: number;
}

/** Automation engine event for real-time timeline display. */
export interface AutomationEvent {
  id: string;
  orderId: string;
  orderNumber: string;
  event: string;
  details: string;
  status: "processing" | "success" | "failed" | "warning";
  ts: number;
}

/* ================================================================== */
/*  COMMERCE SETTINGS                                                  */
/* ================================================================== */

export interface CommerceSettings {
  defaultSupplierId: string;
  defaultWarehouseId: string;
  defaultShippingProfileId: string;
  defaultReturnPolicy: string;
  autoAssignSupplier: boolean;
  autoCreatePO: boolean;
  autoUpdateInventory: boolean;
  autoSendTracking: boolean;
  lowStockThreshold: number;
  reorderPointMultiplier: number;
  defaultTargetMargin: number;
  defaultMinMargin: number;
  defaultMaxMargin: number;
  currency: string;
  taxCalculation: "exclusive" | "inclusive";
  defaultTaxRate: number;
  shippingCalculation: "flat" | "weight_based" | "zone_based";
  marginCalculation: "cost_plus" | "sell_less_cost";
  notificationEmails: {
    lowStock: boolean;
    supplierOrder: boolean;
    returnRequest: boolean;
    automationError: boolean;
  };
  automationEnabled: boolean;
  pricingEngineEnabled: boolean;
  aiCommerceEnabled: boolean;
}

/* ================================================================== */
/*  PERFORMANCE METRICS                                                */
/* ================================================================== */

export interface CommerceMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProfit: number;
  averageMargin: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  inventoryHealth: number;
  supplierAlerts: number;
  lowStockCount: number;
  averageDeliveryDays: number;
  topProducts: { id: string; name: string; revenue: number }[];
  worstProducts: { id: string; name: string; revenue: number }[];
  recentOrders: { id: string; number: string; customer: string; total: number; status: OrderStatus; createdAt: number }[];
  revenueByDay: { label: string; value: number }[];
  ordersByDay: { label: string; value: number }[];
}

/* ================================================================== */
/*  DEFAULT SEED DATA FOR COMMERCE                                     */
/* ================================================================== */

export const COMMERCE_STORAGE_KEY = "alaya_commerce_store_v1";

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  defaultSupplierId: "",
  defaultWarehouseId: "",
  defaultShippingProfileId: "",
  defaultReturnPolicy: "standard",
  autoAssignSupplier: true,
  autoCreatePO: true,
  autoUpdateInventory: true,
  autoSendTracking: true,
  lowStockThreshold: 10,
  reorderPointMultiplier: 1.5,
  defaultTargetMargin: 40,
  defaultMinMargin: 20,
  defaultMaxMargin: 70,
  currency: "USD",
  taxCalculation: "exclusive",
  defaultTaxRate: 8,
  shippingCalculation: "zone_based",
  marginCalculation: "cost_plus",
  notificationEmails: {
    lowStock: true,
    supplierOrder: true,
    returnRequest: true,
    automationError: true,
  },
  automationEnabled: true,
  pricingEngineEnabled: true,
  aiCommerceEnabled: true,
};
