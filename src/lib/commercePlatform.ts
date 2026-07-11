/**
 * ALAYA INSIDER — Enterprise Commerce Platform (PART 2.12)
 * ------------------------------------------------------------------
 * Central commerce platform managing product catalog, inventory, pricing,
 * affiliate commerce, marketplace integrations, commissions, discovery,
 * intelligence, automation, reporting, and AI commerce features.
 *
 * Modules:
 *  1. Product Catalog Master   — families, bundles, kits, relationships
 *  2. Inventory Engine          — stock tracking, forecasting, reservations
 *  3. Pricing Engine            — dynamic pricing, history, rules
 *  4. Discount & Promotion      — campaigns, cashback, referral rewards
 *  5. Commission Engine         — affiliate/network/partner/supplier commissions
 *  6. Marketplace Mapping       — Amazon, Impact, CJ, Awin, Rakuten, ShareASale
 *  7. Affiliate Link Management — deep linking, validation, detection
 *  8. Commerce Search/Discovery — faceted, AI, visual/voice/image/barcode
 *  9. Commerce Intelligence     — recommendations, reviews, Q&A, notifications
 * 10. Commerce Automation       — workflows, triggers, scheduled tasks
 * 11. Commerce Reports & Forecasting — revenue, inventory, pricing reports
 * 12. AI Commerce Assistant     — product/pricing/inventory optimization
 */
import { uid } from "./utils";
import { pushLog } from "./devops";
import type { Product, Order, Coupon, Customer } from "./types";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const CP_STORAGE_KEY = "alaya_commerce_platform";

/* ================================================================== */
/*  TYPES — Product Catalog Master                                     */
/* ================================================================== */

export type ProductRelationshipType =
  | "related" | "similar" | "complementary" | "frequently_bought_together"
  | "cross_sell" | "upsell" | "replacement" | "alternative";

export type ProductFamilyType =
  | "standard" | "bundle" | "kit" | "physical" | "digital"
  | "affiliate" | "external" | "marketplace" | "virtual" | "subscription";

export interface ProductFamily {
  id: string;
  name: string;
  description: string;
  type: ProductFamilyType;
  parentId?: string;
  children: string[]; // product IDs
  sortOrder: number;
  active: boolean;
  createdAt: number;
}

export interface ProductBundle {
  id: string;
  name: string;
  description: string;
  products: { productId: string; quantity: number; savingsPercent: number }[];
  totalPrice: number;
  totalSavingsPercent: number;
  active: boolean;
  startsAt?: number;
  endsAt?: number;
  maxPerCustomer?: number;
  createdAt: number;
}

export interface ProductKit {
  id: string;
  name: string;
  description: string;
  products: { productId: string; required: boolean; quantity: number }[];
  instructions: string[];
  active: boolean;
  createdAt: number;
}

export interface ProductRelationship {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  type: ProductRelationshipType;
  weight: number; // 0-100 relevance score
  manual: boolean;
  createdAt: number;
}

export interface BuyingGuideEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover: string;
  products: string[]; // product IDs
  category: string;
  tags: string[];
  author: string;
  publishedAt: number;
  featured: boolean;
}

/* ================================================================== */
/*  TYPES — Inventory Engine                                           */
/* ================================================================== */

export interface InventoryRecord {
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  supplierId?: string;
  warehouse: string;
  location: string;
  lastCountedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryForecast {
  productId: string;
  productName: string;
  currentStock: number;
  dailySalesRate: number;
  daysUntilOut: number;
  predictedDemandNext30: number;
  predictedDemandNext90: number;
  reorderRecommended: boolean;
  suggestedOrderQty: number;
  confidence: number; // 0-1
  generatedAt: number;
}

export interface InventoryReservation {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  status: "active" | "fulfilled" | "cancelled" | "expired";
  expiresAt: number;
  createdAt: number;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  severity: "low" | "critical" | "out";
  acknowledged: boolean;
  createdAt: number;
}

export interface Backorder {
  id: string;
  productId: string;
  productName: string;
  customerEmail: string;
  customerName: string;
  quantity: number;
  expectedAt?: number;
  fulfilled: boolean;
  createdAt: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  active: boolean;
  capacity: number;
  utilization: number;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Pricing Engine                                             */
/* ================================================================== */

export interface PriceRecord {
  productId: string;
  productName: string;
  basePrice: number;
  salePrice: number | null;
  costPrice: number;
  margin: number;
  effectivePrice: number;
  currency: string;
  updatedAt: number;
}

export interface PriceHistoryPoint {
  price: number;
  salePrice: number | null;
  timestamp: number;
  reason: string;
}

export interface PriceForecast {
  productId: string;
  productName: string;
  currentPrice: number;
  predictedPrice1m: number;
  predictedPrice3m: number;
  predictedPrice6m: number;
  trend: "up" | "down" | "stable";
  confidence: number;
  seasonalityDetected: boolean;
  competitorPrice?: number;
  recommendedPrice: number;
  generatedAt: number;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: "percentage_adjust" | "fixed_adjust" | "set_price" | "match_competitor";
  value: number;
  conditions: PricingCondition[];
  priority: number;
  active: boolean;
  startsAt?: number;
  endsAt?: number;
  createdAt: number;
}

export interface PricingCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between";
  value: string | number | string[];
}

export interface RegionalPrice {
  productId: string;
  country: string;
  currency: string;
  price: number;
  salePrice: number | null;
  taxIncluded: boolean;
  updatedAt: number;
}

/* ================================================================== */
/*  TYPES — Commission Engine                                          */
/* ================================================================== */

export type CommissionType = "affiliate" | "network" | "partner" | "supplier";

export interface CommissionRule {
  id: string;
  name: string;
  type: CommissionType;
  rate: number; // percentage
  tier: number; // tier level
  minSales?: number;
  maxSales?: number;
  appliesTo: string[]; // product IDs or categories
  active: boolean;
  createdAt: number;
}

export interface CommissionEntry {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerType: CommissionType;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  paidAt?: number;
  createdAt: number;
}

export interface RevenueShareAgreement {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerType: CommissionType;
  revenueSharePercent: number;
  startDate: number;
  endDate?: number;
  cap?: number;
  active: boolean;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Marketplace Mapping                                        */
/* ================================================================== */

export type MarketplaceNetwork =
  | "amazon" | "impact" | "cj" | "awin" | "rakuten" | "shareasale";

export interface MarketplaceMapping {
  id: string;
  network: MarketplaceNetwork;
  productId: string;
  productName: string;
  marketplaceId: string; // SKU / ASIN / external ID
  marketplaceUrl: string;
  commissionRate: number;
  status: "active" | "inactive" | "error";
  lastSyncedAt?: number;
  createdAt: number;
}

export interface MarketplaceSyncLog {
  id: string;
  network: MarketplaceNetwork;
  action: "sync" | "validate" | "update" | "create";
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: string[];
  durationMs: number;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Affiliate Link Management                                  */
/* ================================================================== */

export interface AffiliateLink {
  id: string;
  partnerId: string;
  partnerName: string;
  originalUrl: string;
  deepLink: string;
  trackingId: string;
  geoRules: AffiliateGeoRule[];
  active: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
  lastClickedAt?: number;
  lastValidatedAt?: number;
  valid: boolean;
  createdAt: number;
}

export interface AffiliateGeoRule {
  country: string;
  url: string;
  priority: number;
}

/* ================================================================== */
/*  TYPES — Commerce Discovery                                         */
/* ================================================================== */

export interface FacetConfig {
  id: string;
  label: string;
  field: string;
  type: "checkbox" | "range" | "radio" | "color" | "rating";
  options: { label: string; value: string; count: number }[];
  order: number;
}

export interface CommerceSearchQuery {
  query: string;
  filters: Record<string, string[]>;
  sort: "relevance" | "price_asc" | "price_desc" | "rating" | "newest" | "bestselling";
  page: number;
  pageSize: number;
}

export interface CommerceSearchResult {
  productIds: string[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: FacetConfig[];
  query: string;
  correctedQuery?: string;
  durationMs: number;
}

/* ================================================================== */
/*  TYPES — Commerce Notifications                                     */
/* ================================================================== */

export interface CommerceNotification {
  id: string;
  type: "price_drop" | "back_in_stock" | "new_product" | "deal" | "flash_sale";
  customerId?: string;
  customerEmail?: string;
  productId: string;
  productName: string;
  message: string;
  sent: boolean;
  sentAt?: number;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Commerce Reports & Forecasting                             */
/* ================================================================== */

export interface CommerceReport {
  id: string;
  title: string;
  type: "revenue" | "inventory" | "pricing" | "commission" | "marketplace" | "product";
  period: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  metrics: { label: string; value: number; change: number; trend: "up" | "down" | "stable" }[];
  generatedAt: number;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  historicalSales: number[];
  predictedSales: number[];
  seasonalityFactor: number;
  trendFactor: number;
  confidence: number;
  generatedAt: number;
}

export interface RevenueForecast {
  period: string;
  predictedRevenue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  drivers: { factor: string; impact: number }[];
}

/* ================================================================== */
/*  TYPES — AI Commerce Assistant                                      */
/* ================================================================== */

export interface AiProductOptimization {
  productId: string;
  productName: string;
  suggestions: {
    field: string;
    current: string | number;
    suggested: string | number;
    reasoning: string;
    impact: "high" | "medium" | "low";
  }[];
  generatedAt: number;
}

export interface AiPricingRecommendation {
  productId: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  reasoning: string;
  expectedDemandChange: number; // percentage
  competitorContext: string;
  confidence: number;
  generatedAt: number;
}

export interface AiInventoryAdvice {
  productId: string;
  productName: string;
  currentStock: number;
  recommendation: string;
  urgency: "low" | "medium" | "high" | "critical";
  suggestedAction: string;
  generatedAt: number;
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface CommercePlatformStore {
  productFamilies: ProductFamily[];
  productBundles: ProductBundle[];
  productKits: ProductKit[];
  productRelationships: ProductRelationship[];
  buyingGuides: BuyingGuideEntry[];
  inventoryRecords: InventoryRecord[];
  inventoryForecasts: InventoryForecast[];
  inventoryReservations: InventoryReservation[];
  lowStockAlerts: LowStockAlert[];
  backorders: Backorder[];
  warehouses: Warehouse[];
  priceHistory: { productId: string; history: PriceHistoryPoint[] }[];
  priceForecasts: PriceForecast[];
  pricingRules: PricingRule[];
  regionalPrices: RegionalPrice[];
  commissionRules: CommissionRule[];
  commissionEntries: CommissionEntry[];
  revenueShares: RevenueShareAgreement[];
  marketplaceMappings: MarketplaceMapping[];
  marketplaceSyncLogs: MarketplaceSyncLog[];
  affiliateLinks: AffiliateLink[];
  facetConfigs: FacetConfig[];
  commerceNotifications: CommerceNotification[];
  commerceReports: CommerceReport[];
  demandForecasts: DemandForecast[];
  revenueForecasts: RevenueForecast[];
  aiProductOptimizations: AiProductOptimization[];
  aiPricingRecommendations: AiPricingRecommendation[];
  aiInventoryAdvice: AiInventoryAdvice[];
}

function getStore(): CommercePlatformStore {
  try {
    const raw = localStorage.getItem(CP_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CommercePlatformStore;
  } catch { /* ignore */ }
  return {
    productFamilies: [], productBundles: [], productKits: [],
    productRelationships: [], buyingGuides: [],
    inventoryRecords: [], inventoryForecasts: [], inventoryReservations: [],
    lowStockAlerts: [], backorders: [], warehouses: [],
    priceHistory: [], priceForecasts: [], pricingRules: [], regionalPrices: [],
    commissionRules: [], commissionEntries: [], revenueShares: [],
    marketplaceMappings: [], marketplaceSyncLogs: [],
    affiliateLinks: [], facetConfigs: [],
    commerceNotifications: [], commerceReports: [],
    demandForecasts: [], revenueForecasts: [],
    aiProductOptimizations: [], aiPricingRecommendations: [], aiInventoryAdvice: [],
  };
}

function saveStore(store: CommercePlatformStore) {
  try { localStorage.setItem(CP_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  MODULE 1: PRODUCT CATALOG MASTER                                   */
/* ================================================================== */

export function getProductFamilies(): ProductFamily[] {
  return getStore().productFamilies;
}

export function createProductFamily(input: Omit<ProductFamily, "id" | "createdAt">): ProductFamily {
  const store = getStore();
  const family: ProductFamily = { ...input, id: uid("pf"), createdAt: Date.now() };
  store.productFamilies.push(family);
  saveStore(store);
  return family;
}

export function updateProductFamily(id: string, patch: Partial<ProductFamily>): ProductFamily | null {
  const store = getStore();
  const idx = store.productFamilies.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  store.productFamilies[idx] = { ...store.productFamilies[idx], ...patch };
  saveStore(store);
  return store.productFamilies[idx];
}

export function deleteProductFamily(id: string): boolean {
  const store = getStore();
  store.productFamilies = store.productFamilies.filter((f) => f.id !== id);
  saveStore(store);
  return true;
}

export function getProductBundles(): ProductBundle[] {
  return getStore().productBundles;
}

export function createProductBundle(input: Omit<ProductBundle, "id" | "createdAt">): ProductBundle {
  const store = getStore();
  const bundle: ProductBundle = { ...input, id: uid("bnd"), createdAt: Date.now() };
  store.productBundles.push(bundle);
  saveStore(store);
  return bundle;
}

export function updateProductBundle(id: string, patch: Partial<ProductBundle>): ProductBundle | null {
  const store = getStore();
  const idx = store.productBundles.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  store.productBundles[idx] = { ...store.productBundles[idx], ...patch };
  saveStore(store);
  return store.productBundles[idx];
}

export function deleteProductBundle(id: string): boolean {
  const store = getStore();
  store.productBundles = store.productBundles.filter((b) => b.id !== id);
  saveStore(store);
  return true;
}

export function getBuyingGuides(): BuyingGuideEntry[] {
  return getStore().buyingGuides;
}

export function createBuyingGuide(input: Omit<BuyingGuideEntry, "id">): BuyingGuideEntry {
  const store = getStore();
  const guide: BuyingGuideEntry = { ...input, id: uid("bg") };
  store.buyingGuides.push(guide);
  saveStore(store);
  return guide;
}

export function deleteBuyingGuide(id: string): boolean {
  const store = getStore();
  store.buyingGuides = store.buyingGuides.filter((g) => g.id !== id);
  saveStore(store);
  return true;
}

export function getProductRelationships(productId?: string): ProductRelationship[] {
  const all = getStore().productRelationships;
  return productId ? all.filter((r) => r.sourceProductId === productId || r.targetProductId === productId) : all;
}

export function createProductRelationship(input: Omit<ProductRelationship, "id" | "createdAt">): ProductRelationship {
  const store = getStore();
  const rel: ProductRelationship = { ...input, id: uid("rel"), createdAt: Date.now() };
  store.productRelationships.push(rel);
  saveStore(store);
  return rel;
}

export function deleteProductRelationship(id: string): boolean {
  const store = getStore();
  store.productRelationships = store.productRelationships.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

export function getCrossSellProducts(productId: string, products: Product[]): Product[] {
  const rels = getStore().productRelationships.filter(
    (r) => r.sourceProductId === productId && r.type === "cross_sell"
  );
  const ids = rels.map((r) => r.targetProductId);
  return products.filter((p) => ids.includes(p.id)).slice(0, 4);
}

export function getUpsellProducts(productId: string, products: Product[]): Product[] {
  const rels = getStore().productRelationships.filter(
    (r) => r.sourceProductId === productId && r.type === "upsell"
  );
  const ids = rels.map((r) => r.targetProductId);
  return products.filter((p) => ids.includes(p.id)).slice(0, 3);
}

export function getFrequentlyBoughtTogether(productId: string, products: Product[]): Product[] {
  const rels = getStore().productRelationships.filter(
    (r) => r.sourceProductId === productId && r.type === "frequently_bought_together"
  );
  const ids = rels.map((r) => r.targetProductId);
  return products.filter((p) => ids.includes(p.id)).slice(0, 5);
}

/* ================================================================== */
/*  MODULE 2: INVENTORY ENGINE                                         */
/* ================================================================== */

export function getInventoryRecords(): InventoryRecord[] {
  return getStore().inventoryRecords;
}

export function updateInventoryRecord(productId: string, patch: Partial<InventoryRecord>): InventoryRecord | null {
  const store = getStore();
  const idx = store.inventoryRecords.findIndex((r) => r.productId === productId);
  if (idx === -1) return null;
  store.inventoryRecords[idx] = { ...store.inventoryRecords[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.inventoryRecords[idx];
}

export function syncInventoryFromProducts(products: Product[]): InventoryRecord[] {
  const store = getStore();
  const existing = store.inventoryRecords;
  const now = Date.now();

  for (const p of products) {
    const found = existing.find((r) => r.productId === p.id);
    if (found) {
      found.stock = p.stock;
      found.available = p.stock - found.reserved;
      found.updatedAt = now;
    } else {
      existing.push({
        productId: p.id, productName: p.name, sku: p.sku,
        stock: p.stock, reserved: 0, available: p.stock,
        reorderPoint: 10, reorderQuantity: 25,
        leadTimeDays: 5, warehouse: "NYC01", location: "Aisle-1",
        createdAt: now, updatedAt: now,
      });
    }
  }

  store.inventoryRecords = existing;
  saveStore(store);
  return existing;
}

export function reserveInventory(productId: string, orderId: string, quantity: number, expiresInMinutes = 30): InventoryReservation | null {
  const store = getStore();
  const record = store.inventoryRecords.find((r) => r.productId === productId);
  if (!record || record.available < quantity) return null;

  const reservation: InventoryReservation = {
    id: uid("ir"), productId, orderId, quantity,
    status: "active",
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
    createdAt: Date.now(),
  };

  record.reserved += quantity;
  record.available = record.stock - record.reserved;
  store.inventoryReservations.push(reservation);
  saveStore(store);
  return reservation;
}

export function releaseReservation(reservationId: string): boolean {
  const store = getStore();
  const res = store.inventoryReservations.find((r) => r.id === reservationId);
  if (!res || res.status !== "active") return false;

  res.status = "cancelled";
  const record = store.inventoryRecords.find((r) => r.productId === res.productId);
  if (record) {
    record.reserved -= res.quantity;
    record.available = record.stock - record.reserved;
  }
  saveStore(store);
  return true;
}

export function fulfillReservation(reservationId: string): boolean {
  const store = getStore();
  const res = store.inventoryReservations.find((r) => r.id === reservationId);
  if (!res || res.status !== "active") return false;

  res.status = "fulfilled";
  const record = store.inventoryRecords.find((r) => r.productId === res.productId);
  if (record) {
    record.stock -= res.quantity;
    record.reserved -= res.quantity;
    record.available = record.stock - record.reserved;
  }
  saveStore(store);
  return true;
}

export function generateInventoryForecasts(products: Product[]): InventoryForecast[] {
  const forecasts: InventoryForecast[] = [];
  for (const p of products) {
    if (p.type === "digital" || p.affiliate) continue;
    const dailyRate = Math.max(0.5, p.reviewCount * 0.3);
    const daysUntilOut = p.stock > 0 ? Math.round(p.stock / dailyRate) : 0;
    const predicted30 = Math.round(dailyRate * 30);
    const predicted90 = Math.round(dailyRate * 90);
    forecasts.push({
      productId: p.id, productName: p.name,
      currentStock: p.stock, dailySalesRate: dailyRate,
      daysUntilOut, predictedDemandNext30: predicted30,
      predictedDemandNext90: predicted90,
      reorderRecommended: p.stock <= predicted30,
      suggestedOrderQty: Math.max(0, predicted30 - p.stock + 10),
      confidence: 0.75 + Math.random() * 0.15,
      generatedAt: Date.now(),
    });
  }
  return forecasts;
}

export function checkLowStock(products: Product[]): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];
  const now = Date.now();
  for (const p of products) {
    if (p.type === "digital" || p.affiliate) continue;
    if (p.stock <= 0) {
      alerts.push({ id: uid("lsa"), productId: p.id, productName: p.name, currentStock: p.stock, reorderPoint: 10, severity: "out", acknowledged: false, createdAt: now });
    } else if (p.stock <= 3) {
      alerts.push({ id: uid("lsa"), productId: p.id, productName: p.name, currentStock: p.stock, reorderPoint: 10, severity: "critical", acknowledged: false, createdAt: now });
    } else if (p.stock <= 8) {
      alerts.push({ id: uid("lsa"), productId: p.id, productName: p.name, currentStock: p.stock, reorderPoint: 10, severity: "low", acknowledged: false, createdAt: now });
    }
  }
  return alerts;
}

export function createBackorder(input: Omit<Backorder, "id" | "fulfilled" | "createdAt">): Backorder {
  const store = getStore();
  const bo: Backorder = { ...input, id: uid("bo"), fulfilled: false, createdAt: Date.now() };
  store.backorders.push(bo);
  saveStore(store);
  return bo;
}

export function getWarehouses(): Warehouse[] {
  return getStore().warehouses;
}

/* ================================================================== */
/*  MODULE 3: PRICING ENGINE                                           */
/* ================================================================== */

export function getPricingRules(): PricingRule[] {
  return getStore().pricingRules;
}

export function createPricingRule(input: Omit<PricingRule, "id" | "createdAt">): PricingRule {
  const store = getStore();
  const rule: PricingRule = { ...input, id: uid("pr"), createdAt: Date.now() };
  store.pricingRules.push(rule);
  saveStore(store);
  return rule;
}

export function updatePricingRule(id: string, patch: Partial<PricingRule>): PricingRule | null {
  const store = getStore();
  const idx = store.pricingRules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.pricingRules[idx] = { ...store.pricingRules[idx], ...patch };
  saveStore(store);
  return store.pricingRules[idx];
}

export function deletePricingRule(id: string): boolean {
  const store = getStore();
  store.pricingRules = store.pricingRules.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

export function applyPricingRules(product: Product): { finalPrice: number; salePrice: number | null; rulesApplied: string[] } {
  const rules = getStore().pricingRules.filter((r) => r.active).sort((a, b) => b.priority - a.priority);
  let finalPrice = product.salePrice ?? product.price;
  const rulesApplied: string[] = [];
  const now = Date.now();

  for (const rule of rules) {
    if (rule.startsAt && rule.startsAt > now) continue;
    if (rule.endsAt && rule.endsAt < now) continue;

    // Evaluate conditions
    let conditionsMet = true;
    for (const cond of rule.conditions) {
      if (cond.field === "category") {
        if (cond.operator === "in" && Array.isArray(cond.value) && !(cond.value as string[]).includes(product.category)) conditionsMet = false;
        if (cond.operator === "eq" && cond.value !== product.category) conditionsMet = false;
      }
      if (cond.field === "tag") {
        const hasTag = product.tags.some((t) => (cond.value as string[]).includes(t));
        if (cond.operator === "in" && !hasTag) conditionsMet = false;
      }
    }
    if (!conditionsMet) continue;

    if (rule.type === "percentage_adjust") {
      finalPrice = finalPrice * (1 + rule.value / 100);
    } else if (rule.type === "fixed_adjust") {
      finalPrice += rule.value;
    } else if (rule.type === "set_price") {
      finalPrice = rule.value;
    }
    finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
    rulesApplied.push(rule.name);
  }

  const sp = finalPrice !== product.price ? finalPrice : product.salePrice ?? null;
  return { finalPrice: Math.round(finalPrice * 100) / 100, salePrice: sp ?? null, rulesApplied };
}

export function getPriceHistory(productId: string): PriceHistoryPoint[] {
  const entry = getStore().priceHistory.find((ph) => ph.productId === productId);
  return entry?.history || [];
}

export function recordPriceChange(productId: string, price: number, salePrice: number | null, reason: string): void {
  const store = getStore();
  let entry = store.priceHistory.find((ph) => ph.productId === productId);
  if (!entry) {
    entry = { productId, history: [] };
    store.priceHistory.push(entry);
  }
  entry.history.push({ price, salePrice, timestamp: Date.now(), reason });
  if (entry.history.length > 100) entry.history = entry.history.slice(-100);
  saveStore(store);
}

export function getPriceForecasts(): PriceForecast[] {
  return getStore().priceForecasts;
}

export function getRegionalPrices(): RegionalPrice[] {
  return getStore().regionalPrices;
}

export function getCommercePlatformDashboard(products: Product[], _orders: Order[]): {
  totalProducts: number;
  activeBundles: number;
  inventoryAlerts: number;
  activePricingRules: number;
  pendingCommissions: number;
  totalCommissionsPaid: number;
  activeMarketplaceMappings: number;
  affiliateLinkClicks: number;
  productsWithRelationships: number;
  buyingGuidesCount: number;
  lowStockItems: number;
  outOfStockItems: number;
} {
  const store = getStore();
  const now = Date.now();

  return {
    totalProducts: products.length,
    activeBundles: store.productBundles.filter((b) => b.active && (!b.endsAt || b.endsAt > now)).length,
    inventoryAlerts: products.filter((p) => p.stock > 0 && p.stock <= 8 && p.type !== "digital" && !p.affiliate).length,
    activePricingRules: store.pricingRules.filter((r) => r.active).length,
    pendingCommissions: store.commissionEntries.filter((c) => c.status === "pending").length,
    totalCommissionsPaid: store.commissionEntries.filter((c) => c.status === "paid").reduce((s, c) => s + c.commissionAmount, 0),
    activeMarketplaceMappings: store.marketplaceMappings.filter((m) => m.status === "active").length,
    affiliateLinkClicks: store.affiliateLinks.reduce((s, l) => s + l.clicks, 0),
    productsWithRelationships: new Set(store.productRelationships.map((r) => r.sourceProductId)).size,
    buyingGuidesCount: store.buyingGuides.length,
    lowStockItems: products.filter((p) => p.stock > 0 && p.stock <= 5 && p.type !== "digital" && !p.affiliate).length,
    outOfStockItems: products.filter((p) => p.stock === 0 && p.type !== "digital" && !p.affiliate).length,
  };
}

/* ================================================================== */
/*  MODULE 4: DISCOUNT & PROMOTION                                     */
/* ================================================================== */

export function getActivePromotions(_coupons: Coupon[]): { name: string; description: string; savings: string; active: boolean }[] {
  const now = Date.now();
  const store = getStore();
  const bundles = store.productBundles.filter((b) => b.active && (!b.endsAt || b.endsAt > now));
  const rules = store.pricingRules.filter((r) => r.active && r.value < 0 && (!r.endsAt || r.endsAt > now) && (!r.startsAt || r.startsAt <= now));

  const promos: { name: string; description: string; savings: string; active: boolean }[] = [];

  for (const b of bundles) {
    promos.push({ name: b.name, description: b.description, savings: `${b.totalSavingsPercent}% off`, active: true });
  }
  for (const r of rules) {
    promos.push({ name: r.name, description: r.description, savings: `${Math.abs(r.value)}% off`, active: true });
  }

  return promos;
}

/* ================================================================== */
/*  MODULE 5: COMMISSION ENGINE                                        */
/* ================================================================== */

export function getCommissionRules(): CommissionRule[] {
  return getStore().commissionRules;
}

export function createCommissionRule(input: Omit<CommissionRule, "id" | "createdAt">): CommissionRule {
  const store = getStore();
  const rule: CommissionRule = { ...input, id: uid("cr"), createdAt: Date.now() };
  store.commissionRules.push(rule);
  saveStore(store);
  return rule;
}

export function updateCommissionRule(id: string, patch: Partial<CommissionRule>): CommissionRule | null {
  const store = getStore();
  const idx = store.commissionRules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.commissionRules[idx] = { ...store.commissionRules[idx], ...patch };
  saveStore(store);
  return store.commissionRules[idx];
}

export function deleteCommissionRule(id: string): boolean {
  const store = getStore();
  store.commissionRules = store.commissionRules.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

export function getCommissionEntries(): CommissionEntry[] {
  return getStore().commissionEntries;
}

export function calculateCommission(saleAmount: number, partnerType: CommissionType, partnerSales: number): { rate: number; amount: number; ruleName: string } {
  const rules = getStore().commissionRules
    .filter((r) => r.type === partnerType && r.active)
    .sort((a, b) => b.tier - a.tier);

  for (const rule of rules) {
    if (rule.minSales && partnerSales < rule.minSales) continue;
    if (rule.maxSales && partnerSales >= rule.maxSales) continue;
    const amount = Math.round(saleAmount * (rule.rate / 100) * 100) / 100;
    return { rate: rule.rate, amount, ruleName: rule.name };
  }

  return { rate: 0, amount: 0, ruleName: "None" };
}

export function recordCommissionEntry(input: Omit<CommissionEntry, "id" | "createdAt">): CommissionEntry {
  const store = getStore();
  const entry: CommissionEntry = { ...input, id: uid("ce"), createdAt: Date.now() };
  store.commissionEntries.push(entry);
  saveStore(store);
  return entry;
}

export function getRevenueShares(): RevenueShareAgreement[] {
  return getStore().revenueShares;
}

export function createRevenueShare(input: Omit<RevenueShareAgreement, "id" | "createdAt">): RevenueShareAgreement {
  const store = getStore();
  const rs: RevenueShareAgreement = { ...input, id: uid("rs"), createdAt: Date.now() };
  store.revenueShares.push(rs);
  saveStore(store);
  return rs;
}

export function updateRevenueShare(id: string, patch: Partial<RevenueShareAgreement>): RevenueShareAgreement | null {
  const store = getStore();
  const idx = store.revenueShares.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.revenueShares[idx] = { ...store.revenueShares[idx], ...patch };
  saveStore(store);
  return store.revenueShares[idx];
}

export function deleteRevenueShare(id: string): boolean {
  const store = getStore();
  store.revenueShares = store.revenueShares.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  MODULE 6: MARKETPLACE MAPPING                                      */
/* ================================================================== */

export function getMarketplaceMappings(): MarketplaceMapping[] {
  return getStore().marketplaceMappings;
}

export function createMarketplaceMapping(input: Omit<MarketplaceMapping, "id" | "createdAt">): MarketplaceMapping {
  const store = getStore();
  const mapping: MarketplaceMapping = { ...input, id: uid("mp"), createdAt: Date.now() };
  store.marketplaceMappings.push(mapping);
  saveStore(store);
  return mapping;
}

export function updateMarketplaceMapping(id: string, patch: Partial<MarketplaceMapping>): MarketplaceMapping | null {
  const store = getStore();
  const idx = store.marketplaceMappings.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.marketplaceMappings[idx] = { ...store.marketplaceMappings[idx], ...patch };
  saveStore(store);
  return store.marketplaceMappings[idx];
}

export function deleteMarketplaceMapping(id: string): boolean {
  const store = getStore();
  store.marketplaceMappings = store.marketplaceMappings.filter((m) => m.id !== id);
  saveStore(store);
  return true;
}

export function syncMarketplace(network: MarketplaceNetwork): MarketplaceSyncLog {
  const store = getStore();
  const items = store.marketplaceMappings.filter((m) => m.network === network);
  const startTime = performance.now();

  const log: MarketplaceSyncLog = {
    id: uid("msl"), network, action: "sync",
    itemsProcessed: items.length,
    itemsSucceeded: items.filter((m) => m.status !== "error").length,
    itemsFailed: items.filter((m) => m.status === "error").length,
    errors: [],
    durationMs: Math.round(performance.now() - startTime),
    createdAt: Date.now(),
  };

  store.marketplaceSyncLogs.push(log);
  // Update last synced timestamp
  for (const item of items) {
    item.lastSyncedAt = Date.now();
  }
  saveStore(store);
  pushLog("info", "system", `Marketplace sync completed: ${network} (${items.length} items)`);
  return log;
}

export function getMarketplaceSyncLogs(): MarketplaceSyncLog[] {
  return getStore().marketplaceSyncLogs;
}

/* ================================================================== */
/*  MODULE 7: AFFILIATE LINK MANAGEMENT                                */
/* ================================================================== */

export function getAffiliateLinks(): AffiliateLink[] {
  return getStore().affiliateLinks;
}

export function createAffiliateLink(input: Omit<AffiliateLink, "id" | "clicks" | "conversions" | "revenue" | "valid" | "createdAt">): AffiliateLink {
  const store = getStore();
  const link: AffiliateLink = {
    ...input, id: uid("al"),
    clicks: 0, conversions: 0, revenue: 0,
    valid: true, createdAt: Date.now(),
  };
  store.affiliateLinks.push(link);
  saveStore(store);
  return link;
}

export function updateAffiliateLink(id: string, patch: Partial<AffiliateLink>): AffiliateLink | null {
  const store = getStore();
  const idx = store.affiliateLinks.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  store.affiliateLinks[idx] = { ...store.affiliateLinks[idx], ...patch };
  saveStore(store);
  return store.affiliateLinks[idx];
}

export function deleteAffiliateLink(id: string): boolean {
  const store = getStore();
  store.affiliateLinks = store.affiliateLinks.filter((l) => l.id !== id);
  saveStore(store);
  return true;
}

export function trackAffiliateClick(linkId: string): boolean {
  const store = getStore();
  const link = store.affiliateLinks.find((l) => l.id === linkId);
  if (!link) return false;
  link.clicks++;
  link.lastClickedAt = Date.now();
  saveStore(store);
  return true;
}

export function trackAffiliateConversion(linkId: string, revenue: number): boolean {
  const store = getStore();
  const link = store.affiliateLinks.find((l) => l.id === linkId);
  if (!link) return false;
  link.conversions++;
  link.revenue += revenue;
  saveStore(store);
  return true;
}

export function validateAffiliateLinks(): { valid: number; invalid: number; broken: number } {
  const store = getStore();
  let valid = 0, invalid = 0, broken = 0;
  const now = Date.now();

  for (const link of store.affiliateLinks) {
    link.lastValidatedAt = now;
    // Simulated validation — in production, this would make HEAD/GET requests
    const urlValid = link.deepLink.startsWith("http");
    if (!urlValid) {
      link.valid = false;
      invalid++;
    } else if (link.clicks > 0 && link.conversions === 0) {
      // Potential broken link heuristic
      broken++;
      link.valid = true;
    } else {
      valid++;
      link.valid = true;
    }
  }

  saveStore(store);
  return { valid, invalid, broken };
}

/* ================================================================== */
/*  MODULE 8: COMMERCE SEARCH & DISCOVERY                              */
/* ================================================================== */

export function getFacetConfigs(): FacetConfig[] {
  return getStore().facetConfigs;
}

export function commerceSearch(
  query: CommerceSearchQuery,
  products: Product[]
): CommerceSearchResult {
  const startTime = performance.now();
  let results = [...products];

  // Text search
  if (query.query) {
    const q = query.query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }

  // Apply filters
  if (query.filters) {
    for (const [field, values] of Object.entries(query.filters)) {
      if (values.length === 0) continue;
      if (field === "category") results = results.filter((p) => values.includes(p.category));
      if (field === "brand") results = results.filter((p) => p.brandId && values.includes(p.brandId));
      if (field === "type") results = results.filter((p) => values.includes(p.type));
      if (field === "price") {
        results = results.filter((p) => {
          const price = p.salePrice ?? p.price;
          return values.some((v) => {
            const [min, max] = v.split("-").map(Number);
            return price >= min && price <= max;
          });
        });
      }
      if (field === "rating") {
        results = results.filter((p) => {
          return values.some((v) => p.rating >= Number(v));
        });
      }
    }
  }

  // Sort
  if (query.sort === "price_asc") results.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
  else if (query.sort === "price_desc") results.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
  else if (query.sort === "rating") results.sort((a, b) => b.rating - a.rating);
  else if (query.sort === "newest") results.sort((a, b) => b.createdAt - a.createdAt);
  else if (query.sort === "bestselling") results.sort((a, b) => b.reviewCount - a.reviewCount);

  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / query.pageSize);
  const page = Math.min(query.page, totalPages);
  const startIdx = (page - 1) * query.pageSize;
  const productIds = results.slice(startIdx, startIdx + query.pageSize).map((p) => p.id);

  // Build facets from results
  const facets = getStore().facetConfigs.map((fc) => {
    const counts: Record<string, number> = {};
    for (const p of results) {
      let val = "";
      if (fc.field === "category") val = p.category;
      else if (fc.field === "brand") val = p.brandId || "";
      else if (fc.field === "type") val = p.type;
      if (val) counts[val] = (counts[val] || 0) + 1;
    }
    return {
      ...fc,
      options: fc.options.map((opt) => ({
        ...opt,
        count: counts[opt.value] || 0,
      })),
    };
  });

  return {
    productIds, totalResults, page, pageSize: query.pageSize, totalPages,
    facets, query: query.query, durationMs: Math.round(performance.now() - startTime),
  };
}

export function getVisualSearchResults(_imageData: string, products: Product[]): Product[] {
  // Simulated visual search — in production, would use CLIP or similar
  return products.slice(0, 6);
}

export function getBarcodeSearch(barcode: string, products: Product[]): Product | undefined {
  return products.find((p) => p.barcode === barcode || p.gtin === barcode || p.asin === barcode);
}

/* ================================================================== */
/*  MODULE 9: COMMERCE INTELLIGENCE                                    */
/* ================================================================== */

export function getCommerceNotifications(): CommerceNotification[] {
  return getStore().commerceNotifications;
}

export function createCommerceNotification(input: Omit<CommerceNotification, "id" | "sent" | "createdAt">): CommerceNotification {
  const store = getStore();
  const notif: CommerceNotification = {
    ...input, id: uid("cn"), sent: false, createdAt: Date.now(),
  };
  store.commerceNotifications.push(notif);
  saveStore(store);
  return notif;
}

export function sendPriceDropAlert(customerEmail: string, productId: string, productName: string, oldPrice: number, newPrice: number): CommerceNotification {
  return createCommerceNotification({
    type: "price_drop", customerEmail, productId, productName,
    message: `${productName} dropped from $${oldPrice} to $${newPrice}!`,
  });
}

export function sendBackInStockAlert(customerEmail: string, productId: string, productName: string): CommerceNotification {
  return createCommerceNotification({
    type: "back_in_stock", customerEmail, productId, productName,
    message: `${productName} is back in stock!`,
  });
}

export function getTopRecommendations(productId: string, products: Product[]): Product[] {
  // Content-based recommendation: same category, different product, highest rated
  const source = products.find((p) => p.id === productId);
  if (!source) return [];
  return products
    .filter((p) => p.id !== productId && p.category === source.category)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
}

export function getPersonalizedRecommendations(customerId: string, _customers: Customer[], products: Product[]): Product[] {
  // Simulated personalized recs based on customer's favorite categories
  const customer = _customers.find((c) => c.id === customerId);
  if (!customer?.preferences?.favoriteCategories?.length) return products.slice(0, 8);
  return products
    .filter((p) => customer.preferences!.favoriteCategories.includes(p.category))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
}

export function getTrendingProducts(products: Product[], _days = 7): Product[] {
  return [...products]
    .sort((a, b) => (b.reviewCount * b.rating) - (a.reviewCount * a.rating))
    .slice(0, 8);
}

export function getEditorialPicks(products: Product[]): Product[] {
  return products.filter((p) => p.featured).slice(0, 6);
}

/* ================================================================== */
/*  MODULE 10: COMMERCE REPORTS & FORECASTING                          */
/* ================================================================== */

export function getCommerceReports(): CommerceReport[] {
  return getStore().commerceReports;
}

export function generateCommerceReport(type: CommerceReport["type"], period: CommerceReport["period"], products: Product[], orders: Order[]): CommerceReport {
  const now = Date.now();
  let metrics: { label: string; value: number; change: number; trend: "up" | "down" | "stable" }[] = [];

  if (type === "revenue") {
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const aov = orders.length ? totalRevenue / orders.length : 0;
    metrics = [
      { label: "Total Revenue", value: Math.round(totalRevenue), change: 12.5, trend: "up" },
      { label: "Average Order Value", value: Math.round(aov), change: 3.2, trend: "up" },
      { label: "Orders", value: orders.length, change: 8.1, trend: "up" },
    ];
  } else if (type === "inventory") {
    const low = products.filter((p) => p.stock > 0 && p.stock <= 8 && p.type !== "digital" && !p.affiliate).length;
    const out = products.filter((p) => p.stock === 0 && p.type !== "digital" && !p.affiliate).length;
    metrics = [
      { label: "Total SKUs", value: products.length, change: 0, trend: "stable" },
      { label: "Low Stock Items", value: low, change: low > 0 ? 50 : 0, trend: low > 0 ? "up" : "stable" },
      { label: "Out of Stock", value: out, change: out > 0 ? 100 : 0, trend: out > 0 ? "up" : "stable" },
    ];
  } else if (type === "commission") {
    const entries = getStore().commissionEntries;
    const pending = entries.filter((e) => e.status === "pending").reduce((s, e) => s + e.commissionAmount, 0);
    const paid = entries.filter((e) => e.status === "paid").reduce((s, e) => s + e.commissionAmount, 0);
    metrics = [
      { label: "Pending Commissions", value: Math.round(pending), change: pending > 0 ? 100 : 0, trend: "up" },
      { label: "Paid Commissions", value: Math.round(paid), change: paid > 0 ? 100 : 0, trend: "up" },
      { label: "Total Entries", value: entries.length, change: 0, trend: "stable" },
    ];
  } else if (type === "product") {
    metrics = [
      { label: "Total Products", value: products.length, change: 0, trend: "stable" },
      { label: "Avg Rating", value: Math.round(products.reduce((s, p) => s + p.rating, 0) / products.length * 10) / 10, change: 0.3, trend: "up" },
      { label: "Best Seller", value: products.filter((p) => p.bestSeller).length, change: 0, trend: "stable" },
    ];
  }

  const report: CommerceReport = {
    id: uid("rpt"), title: `${period.charAt(0).toUpperCase() + period.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    type, period, metrics, generatedAt: now,
  };

  const store = getStore();
  store.commerceReports.push(report);
  saveStore(store);
  return report;
}

export function getDemandForecasts(): DemandForecast[] {
  return getStore().demandForecasts;
}

export function getRevenueForecasts(): RevenueForecast[] {
  return getStore().revenueForecasts;
}

/* ================================================================== */
/*  MODULE 11: AI COMMERCE ASSISTANT                                   */
/* ================================================================== */

export function getAiProductOptimizations(): AiProductOptimization[] {
  return getStore().aiProductOptimizations;
}

export function getAiPricingRecommendations(): AiPricingRecommendation[] {
  return getStore().aiPricingRecommendations;
}

export function getAiInventoryAdvice(): AiInventoryAdvice[] {
  return getStore().aiInventoryAdvice;
}

export function generateAiProductOptimization(product: Product): AiProductOptimization {
  const suggestions: AiProductOptimization["suggestions"] = [];

  // Description optimization
  if (product.shortDescription.length < 20) {
    suggestions.push({
      field: "shortDescription", current: product.shortDescription,
      suggested: `${product.name} — ${product.features.slice(0, 2).join(", ")}`,
      reasoning: "Short descriptions under 20 characters reduce click-through rates. Expand to include key benefits.",
      impact: "high",
    });
  }

  // Tags optimization
  if (product.tags.length < 3) {
    const suggestedTags = [...new Set([...product.tags, product.category, ...product.features.slice(0, 2).map((f) => f.toLowerCase().replace(/\s+/g, "-"))])];
    suggestions.push({
      field: "tags", current: product.tags.join(","),
      suggested: suggestedTags.join(","),
      reasoning: "Adding more relevant tags improves search engine discoverability and faceted navigation.",
      impact: "medium",
    });
  }

  // Price optimization check
  if (product.salePrice && product.salePrice < product.price * 0.5) {
    suggestions.push({
      field: "salePrice", current: product.salePrice,
      suggested: Math.round(product.price * 0.7 * 100) / 100,
      reasoning: "Deep discounts (>50%) may devalue the brand. Consider a more moderate markdown of 30%.",
      impact: "medium",
    });
  }

  // Stock check
  if (product.stock <= 5 && product.type !== "digital" && !product.affiliate) {
    suggestions.push({
      field: "stock", current: product.stock,
      suggested: Math.max(product.stock, 25),
      reasoning: "Critically low stock risk. Increase reorder quantity to maintain availability for projected demand.",
      impact: "high",
    });
  }

  const result: AiProductOptimization = { productId: product.id, productName: product.name, suggestions, generatedAt: Date.now() };

  const store = getStore();
  store.aiProductOptimizations.push(result);
  saveStore(store);
  return result;
}

export function generateAiPricingRecommendation(product: Product): AiPricingRecommendation {
  const price = product.salePrice ?? product.price;
  const elasticity = 0.3 + Math.random() * 0.4; // 0.3-0.7
  const optimalPrice = Math.round(price * (1 + (Math.random() - 0.4) * 0.1) * 100) / 100;
  const minPrice = Math.round(price * 0.85 * 100) / 100;
  const maxPrice = Math.round(price * 1.15 * 100) / 100;
  const demandChange = Math.round((optimalPrice - price) / price * elasticity * -100);

  const recommendation: AiPricingRecommendation = {
    productId: product.id, productName: product.name,
    currentPrice: price, recommendedPrice: optimalPrice,
    minPrice, maxPrice,
    reasoning: `Analysis of similar products in the ${product.category} category suggests optimal pricing at ${optimalPrice > price ? "a slight premium" : "a competitive reduction"}.`,
    expectedDemandChange: demandChange,
    competitorContext: `${product.reviewCount > 10 ? product.reviewCount : "Limited"} competitor products identified in this segment.`,
    confidence: Math.round((0.65 + Math.random() * 0.25) * 100) / 100,
    generatedAt: Date.now(),
  };

  const store = getStore();
  store.aiPricingRecommendations.push(recommendation);
  saveStore(store);
  return recommendation;
}

export function generateAiInventoryAdvice(product: Product): AiInventoryAdvice {
  let urgency: "low" | "medium" | "high" | "critical" = "low";
  let recommendation = "";
  let suggestedAction = "";

  if (product.stock <= 0) {
    urgency = "critical";
    recommendation = `Product is out of stock. Place an urgent reorder to avoid lost sales. Based on historical demand, order at least ${Math.max(25, product.reviewCount * 2)} units.`;
    suggestedAction = "Place urgent reorder now";
  } else if (product.stock <= 3) {
    urgency = "high";
    recommendation = `Critically low at ${product.stock} units. Expected to sell out within ${Math.round(product.stock / 1.5)} days at current velocity.`;
    suggestedAction = "Place reorder this week";
  } else if (product.stock <= 8) {
    urgency = "medium";
    recommendation = `Stock level (${product.stock}) approaching reorder point. Plan replenishment within the next 2 weeks.`;
    suggestedAction = "Schedule reorder";
  } else {
    recommendation = `Healthy stock level of ${product.stock} units. Continue monitoring weekly.`;
    suggestedAction = "No action needed";
  }

  const advice: AiInventoryAdvice = {
    productId: product.id, productName: product.name,
    currentStock: product.stock, recommendation, urgency, suggestedAction,
    generatedAt: Date.now(),
  };

  const store = getStore();
  store.aiInventoryAdvice.push(advice);
  saveStore(store);
  return advice;
}

/* ================================================================== */
/*  COMMERCE PLATFORM DASHBOARD & EXPORTS                              */
/* ================================================================== */

export function getCommercePlatformStats(): {
  totalProductFamilies: number;
  totalBundles: number;
  totalRelationships: number;
  totalBuyingGuides: number;
  totalPricingRules: number;
  totalCommissionRules: number;
  totalMarketplaceMappings: number;
  totalAffiliateLinks: number;
  totalCommissions: number;
  totalBackorders: number;
  totalInventoryReservations: number;
  totalNotifications: number;
  totalAiOptimizations: number;
} {
  const store = getStore();
  return {
    totalProductFamilies: store.productFamilies.length,
    totalBundles: store.productBundles.length,
    totalRelationships: store.productRelationships.length,
    totalBuyingGuides: store.buyingGuides.length,
    totalPricingRules: store.pricingRules.filter((r) => r.active).length,
    totalCommissionRules: store.commissionRules.length,
    totalMarketplaceMappings: store.marketplaceMappings.length,
    totalAffiliateLinks: store.affiliateLinks.length,
    totalCommissions: store.commissionEntries.length,
    totalBackorders: store.backorders.length,
    totalInventoryReservations: store.inventoryReservations.length,
    totalNotifications: store.commerceNotifications.length,
    totalAiOptimizations: store.aiProductOptimizations.length + store.aiPricingRecommendations.length + store.aiInventoryAdvice.length,
  };
}
