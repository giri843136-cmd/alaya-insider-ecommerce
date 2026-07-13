/**
 * ALAYA INSIDER — Enterprise Data Platform
 * ------------------------------------------------------------------
 * Centralized data architecture: database management, schema versioning,
 * migration engine, query optimization, storage tiers, backup orchestration,
 * data governance, and operational intelligence.
 *
 * Extends existing backup.ts, types.ts, and devops.ts infrastructure.
 */
import { uid } from "./utils";
import { pushLog } from "./devops";
/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const DATA_STORAGE_KEY = "alaya_data_store";
export const MAX_CONNECTIONS = 100;
export const DEFAULT_PAGE_SIZE = 50;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type DbEngine = "postgresql" | "mysql" | "sqlite" | "mongodb" | "redis" | "elasticsearch";
export type DbRole = "primary" | "replica_read" | "replica_write" | "analytics" | "backup";
export type DbStatus = "online" | "degraded" | "offline" | "maintenance" | "provisioning";
export type StorageTier = "hot" | "warm" | "cold" | "archive" | "cache";
export type BackupType = "full" | "incremental" | "differential" | "snapshot";
export type BackupStatus = "scheduled" | "running" | "completed" | "failed" | "verified";
export type DataDomain = "commerce" | "crm" | "cms" | "pim" | "dam" | "analytics" | "ai" | "affiliate" | "supplier" | "infrastructure" | "security" | "communication" | "search";
export type GovernanceAction = "retention" | "archival" | "purge" | "mask" | "encrypt" | "audit";

/* ================================================================== */
/*  DATABASE PROFILES & CONNECTIONS                                    */
/* ================================================================== */

export interface DatabaseProfile {
  id: string;
  name: string;
  engine: DbEngine;
  role: DbRole;
  status: DbStatus;
  version: string;
  host: string;
  port: number;
  database: string;
  user: string;
  maxConnections: number;
  activeConnections: number;
  poolSize: number;
  poolUsed: number;
  latencyMs: number;
  uptimeHours: number;
  sizeMb: number;
  region: string;
  tags: string[];
  backupEnabled: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  createdAt: number;
}

export function getDatabaseProfiles(): DatabaseProfile[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_profiles`) || "[]"); } catch { return []; }
}

export function updateDatabaseProfile(id: string, patch: Partial<DatabaseProfile>): DatabaseProfile | null {
  const all = getDatabaseProfiles();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_profiles`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getConnectionStats(): { total: number; online: number; degraded: number; avgLatency: number; activeConnections: number } {
  const profiles = getDatabaseProfiles();
  const online = profiles.filter((p) => p.status === "online").length;
  const degraded = profiles.filter((p) => p.status === "degraded").length;
  const avgLatency = profiles.length ? Math.round(profiles.reduce((s, p) => s + p.latencyMs, 0) / profiles.length) : 0;
  const activeConnections = profiles.reduce((s, p) => s + p.activeConnections, 0);
  return { total: profiles.length, online, degraded, avgLatency, activeConnections };
}

/* Seed database profiles */
(function seedProfiles() {
  if (getDatabaseProfiles().length > 0) return;
  const profiles: DatabaseProfile[] = [
    { id: uid("db"), name: "Primary Transactional DB", engine: "postgresql", role: "primary", status: "online", version: "15.4", host: "primary-db.alaya.internal", port: 5432, database: "alaya_production", user: "alaya_app", maxConnections: 100, activeConnections: 23, poolSize: 50, poolUsed: 18, latencyMs: 8, uptimeHours: 2480, sizeMb: 4200, region: "us-east-1", tags: ["primary", "transactions", "commerce"], backupEnabled: true, encryptionAtRest: true, encryptionInTransit: true, createdAt: Date.now() - 180 * 86400000 },
    { id: uid("db"), name: "Read Replica (Analytics)", engine: "postgresql", role: "replica_read", status: "online", version: "15.4", host: "replica-1.alaya.internal", port: 5432, database: "alaya_analytics", user: "alaya_readonly", maxConnections: 50, activeConnections: 12, poolSize: 25, poolUsed: 8, latencyMs: 12, uptimeHours: 1920, sizeMb: 3800, region: "us-east-1", tags: ["replica", "analytics", "readonly"], backupEnabled: true, encryptionAtRest: true, encryptionInTransit: true, createdAt: Date.now() - 150 * 86400000 },
    { id: uid("db"), name: "Cache Layer (Redis)", engine: "redis", role: "primary", status: "online", version: "7.2", host: "redis-cluster.alaya.internal", port: 6379, database: "0", user: "default", maxConnections: 200, activeConnections: 34, poolSize: 100, poolUsed: 28, latencyMs: 2, uptimeHours: 4320, sizeMb: 480, region: "us-east-1", tags: ["cache", "redis", "session"], backupEnabled: true, encryptionAtRest: true, encryptionInTransit: true, createdAt: Date.now() - 365 * 86400000 },
    { id: uid("db"), name: "Search Index (Elasticsearch)", engine: "elasticsearch", role: "primary", status: "online", version: "8.11", host: "es-cluster.alaya.internal", port: 9200, database: "alaya_products", user: "elastic", maxConnections: 80, activeConnections: 15, poolSize: 40, poolUsed: 10, latencyMs: 15, uptimeHours: 1560, sizeMb: 2400, region: "us-east-1", tags: ["search", "elasticsearch", "index"], backupEnabled: true, encryptionAtRest: true, encryptionInTransit: true, createdAt: Date.now() - 120 * 86400000 },
    { id: uid("db"), name: "Analytics Warehouse", engine: "postgresql", role: "analytics", status: "degraded", version: "15.4", host: "warehouse.alaya.internal", port: 5432, database: "alaya_warehouse", user: "alaya_etl", maxConnections: 30, activeConnections: 22, poolSize: 20, poolUsed: 18, latencyMs: 45, uptimeHours: 720, sizeMb: 12000, region: "us-west-2", tags: ["warehouse", "analytics", "etl"], backupEnabled: true, encryptionAtRest: true, encryptionInTransit: false, createdAt: Date.now() - 60 * 86400000 },
    { id: uid("db"), name: "Backup/DR (Standby)", engine: "postgresql", role: "backup", status: "online", version: "15.4", host: "standby-db.alaya.internal", port: 5432, database: "alaya_standby", user: "alaya_repl", maxConnections: 20, activeConnections: 3, poolSize: 10, poolUsed: 2, latencyMs: 25, uptimeHours: 2400, sizeMb: 4100, region: "eu-west-1", tags: ["standby", "dr", "backup"], backupEnabled: true, encryptionAtRest: true, encryptionInTransit: true, createdAt: Date.now() - 160 * 86400000 },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_profiles`, JSON.stringify(profiles)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  SCHEMA MANAGEMENT & VERSIONING                                     */
/* ================================================================== */

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  indexes: SchemaIndex[];
  rowCount: number;
  sizeMb: number;
  description: string;
  domain: DataDomain;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: { table: string; column: string };
  default?: string;
  unique: boolean;
  indexed: boolean;
  description: string;
}

export interface SchemaIndex {
  name: string;
  columns: string[];
  type: "btree" | "hash" | "gin" | "gist" | "brin" | "fulltext" | "vector";
  unique: boolean;
  partial: boolean;
  condition?: string;
  sizeMb: number;
  hitRate: number;
}

export function getSchemaTables(): SchemaTable[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_schema`) || "[]"); } catch { return []; }
}

export function getSchemaStats(): { totalTables: number; totalIndexes: number; totalSizeMb: number; totalRows: number } {
  const tables = getSchemaTables();
  return {
    totalTables: tables.length,
    totalIndexes: tables.reduce((s, t) => s + t.indexes.length, 0),
    totalSizeMb: Math.round(tables.reduce((s, t) => s + t.sizeMb, 0)),
    totalRows: tables.reduce((s, t) => s + t.rowCount, 0),
  };
}

/* Seed schema tables */
(function seedSchema() {
  if (getSchemaTables().length > 0) return;
  const tables: SchemaTable[] = [
    {
      name: "products", rowCount: 24, sizeMb: 4.2, description: "Product catalog — all storefront items", domain: "commerce",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "name", type: "VARCHAR(255)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Product display name" },
        { name: "slug", type: "VARCHAR(255)", nullable: false, primaryKey: false, unique: true, indexed: true, description: "URL-friendly identifier" },
        { name: "price", type: "DECIMAL(10,2)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Base price in USD" },
        { name: "category_id", type: "UUID", nullable: false, primaryKey: false, foreignKey: { table: "categories", column: "id" }, unique: false, indexed: true, description: "FK to categories" },
        { name: "brand_id", type: "UUID", nullable: true, primaryKey: false, foreignKey: { table: "brands", column: "id" }, unique: false, indexed: true, description: "FK to brands" },
        { name: "stock", type: "INTEGER", nullable: false, primaryKey: false, unique: false, indexed: true, default: "0", description: "Current inventory count" },
        { name: "created_at", type: "TIMESTAMPTZ", nullable: false, primaryKey: false, unique: false, indexed: true, default: "NOW()", description: "Creation timestamp" },
        { name: "metadata", type: "JSONB", nullable: true, primaryKey: false, unique: false, indexed: false, description: "Flexible metadata" },
      ],
      indexes: [
        { name: "idx_products_slug", columns: ["slug"], type: "btree", unique: true, partial: false, sizeMb: 0.1, hitRate: 99.2 },
        { name: "idx_products_category", columns: ["category_id"], type: "btree", unique: false, partial: false, sizeMb: 0.1, hitRate: 94.5 },
        { name: "idx_products_price", columns: ["price"], type: "btree", unique: false, partial: false, sizeMb: 0.1, hitRate: 87.3 },
        { name: "idx_products_search", columns: ["name", "slug"], type: "fulltext", unique: false, partial: false, sizeMb: 0.3, hitRate: 96.8 },
      ],
    },
    {
      name: "orders", rowCount: 42, sizeMb: 8.6, description: "Customer orders — full lifecycle", domain: "commerce",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "number", type: "VARCHAR(20)", nullable: false, primaryKey: false, unique: true, indexed: true, description: "Human-readable order number" },
        { name: "customer_id", type: "UUID", nullable: true, primaryKey: false, foreignKey: { table: "customers", column: "id" }, unique: false, indexed: true, description: "FK to customers" },
        { name: "status", type: "VARCHAR(20)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Order status" },
        { name: "total", type: "DECIMAL(10,2)", nullable: false, primaryKey: false, unique: false, indexed: false, description: "Order total" },
        { name: "items", type: "JSONB", nullable: false, primaryKey: false, unique: false, indexed: false, description: "Line items" },
      ],
      indexes: [
        { name: "idx_orders_number", columns: ["number"], type: "btree", unique: true, partial: false, sizeMb: 0.2, hitRate: 100 },
        { name: "idx_orders_customer", columns: ["customer_id"], type: "btree", unique: false, partial: false, sizeMb: 0.2, hitRate: 91.2 },
        { name: "idx_orders_status", columns: ["status"], type: "btree", unique: false, partial: false, sizeMb: 0.1, hitRate: 78.5 },
      ],
    },
    {
      name: "customers", rowCount: 18, sizeMb: 3.4, description: "Customer accounts and profiles", domain: "crm",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "email", type: "VARCHAR(255)", nullable: false, primaryKey: false, unique: true, indexed: true, description: "Login email" },
        { name: "name", type: "VARCHAR(255)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Display name" },
      ],
      indexes: [
        { name: "idx_customers_email", columns: ["email"], type: "btree", unique: true, partial: false, sizeMb: 0.1, hitRate: 100 },
      ],
    },
    {
      name: "categories", rowCount: 8, sizeMb: 0.8, description: "Product categories", domain: "pim",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "name", type: "VARCHAR(100)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Category name" },
      ],
      indexes: [],
    },
    {
      name: "brands", rowCount: 6, sizeMb: 0.5, description: "Product brands and labels", domain: "pim",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "name", type: "VARCHAR(100)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Brand name" },
      ],
      indexes: [],
    },
    {
      name: "articles", rowCount: 8, sizeMb: 2.1, description: "Journal/blog articles", domain: "cms",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "slug", type: "VARCHAR(255)", nullable: false, primaryKey: false, unique: true, indexed: true, description: "URL slug" },
        { name: "published_at", type: "TIMESTAMPTZ", nullable: true, primaryKey: false, unique: false, indexed: true, description: "Publish date" },
      ],
      indexes: [
        { name: "idx_articles_slug", columns: ["slug"], type: "btree", unique: true, partial: false, sizeMb: 0.05, hitRate: 100 },
      ],
    },
    {
      name: "affiliates", rowCount: 4, sizeMb: 0.3, description: "Affiliate partnerships", domain: "affiliate",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "name", type: "VARCHAR(100)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Partner name" },
      ],
      indexes: [],
    },
    {
      name: "suppliers", rowCount: 8, sizeMb: 0.6, description: "Fulfilment suppliers", domain: "supplier",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "name", type: "VARCHAR(100)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Supplier name" },
      ],
      indexes: [],
    },
    {
      name: "media_assets", rowCount: 48, sizeMb: 1200, description: "DAM — digital asset metadata", domain: "dam",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "filename", type: "VARCHAR(500)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Original filename" },
        { name: "size_bytes", type: "BIGINT", nullable: false, primaryKey: false, unique: false, indexed: true, description: "File size" },
        { name: "mime_type", type: "VARCHAR(100)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "MIME type" },
      ],
      indexes: [
        { name: "idx_media_mime", columns: ["mime_type"], type: "btree", unique: false, partial: false, sizeMb: 0.1, hitRate: 72.1 },
        { name: "idx_media_size", columns: ["size_bytes"], type: "brin", unique: false, partial: false, sizeMb: 0.05, hitRate: 88.4 },
      ],
    },
    {
      name: "audit_logs", rowCount: 1200, sizeMb: 18.5, description: "Append-only audit trail", domain: "security",
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true, indexed: true, description: "Primary key" },
        { name: "actor", type: "VARCHAR(255)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Who performed the action" },
        { name: "action", type: "VARCHAR(50)", nullable: false, primaryKey: false, unique: false, indexed: true, description: "Action type" },
        { name: "ts", type: "TIMESTAMPTZ", nullable: false, primaryKey: false, unique: false, indexed: true, description: "When it happened" },
      ],
      indexes: [
        { name: "idx_audit_actor", columns: ["actor"], type: "btree", unique: false, partial: false, sizeMb: 1.2, hitRate: 65.3 },
        { name: "idx_audit_ts", columns: ["ts"], type: "brin", unique: false, partial: false, sizeMb: 0.3, hitRate: 91.7 },
      ],
    },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_schema`, JSON.stringify(tables)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  MIGRATION ENGINE                                                   */
/* ================================================================== */

export interface Migration {
  id: string;
  version: string;
  name: string;
  description: string;
  status: "pending" | "running" | "applied" | "failed" | "rolled_back";
  appliedAt?: number;
  completedAt?: number;
  durationMs?: number;
  author: string;
  checksum: string;
  statements: string[];
  rollbackStatements: string[];
  tags: string[];
}

export function getMigrations(): Migration[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_migrations`) || "[]"); } catch { return []; }
}

export function runMigration(id: string): Migration | null {
  const all = getMigrations();
  const idx = all.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const start = Date.now();
  all[idx] = { ...all[idx], status: "running" };
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_migrations`, JSON.stringify(all)); } catch { /* ignore */ }
  // Simulate migration execution with 90% success rate
  const success = Math.random() > 0.1;
  if (success) {
    all[idx] = { ...all[idx], status: "applied", appliedAt: start, completedAt: Date.now(), durationMs: Date.now() - start };
    pushLog("info", "system", `Migration applied: ${all[idx].name} (${all[idx].version})`);
  } else {
    all[idx] = { ...all[idx], status: "failed", completedAt: Date.now(), durationMs: Date.now() - start };
    pushLog("error", "system", `Migration failed: ${all[idx].name} (${all[idx].version})`);
  }
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_migrations`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function rollbackMigration(id: string): Migration | null {
  const all = getMigrations();
  const idx = all.findIndex((m) => m.id === id);
  if (idx === -1 || all[idx].status !== "applied") return null;
  all[idx] = { ...all[idx], status: "rolled_back", completedAt: Date.now() };
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_migrations`, JSON.stringify(all)); } catch { /* ignore */ }
  pushLog("warning", "system", `Migration rolled back: ${all[idx].name} (${all[idx].version})`);
  return all[idx];
}

export function getMigrationStats(): { total: number; applied: number; pending: number; failed: number } {
  const all = getMigrations();
  return {
    total: all.length,
    applied: all.filter((m) => m.status === "applied").length,
    pending: all.filter((m) => m.status === "pending").length,
    failed: all.filter((m) => m.status === "failed").length,
  };
}

/* Seed migrations */
(function seedMigrations() {
  if (getMigrations().length > 0) return;
  const now = Date.now();
  const migrations: Migration[] = [
    { id: "mig_v1", version: "v1.0.0", name: "Initial Schema", description: "Base tables: products, categories, brands, orders, customers", status: "applied", appliedAt: now - 90 * 86400000, completedAt: now - 90 * 86400000 + 12000, durationMs: 12000, author: "system", checksum: "a1b2c3d4", statements: ["CREATE TABLE products (...)", "CREATE TABLE categories (...)", "CREATE TABLE orders (...)"], rollbackStatements: ["DROP TABLE products", "DROP TABLE categories", "DROP TABLE orders"], tags: ["schema", "initial"] },
    { id: "mig_v2", version: "v1.1.0", name: "Add Brands & Coupons", description: "Brands table, coupons table, article support", status: "applied", appliedAt: now - 60 * 86400000, completedAt: now - 60 * 86400000 + 8400, durationMs: 8400, author: "system", checksum: "e5f6g7h8", statements: ["CREATE TABLE brands (...)", "CREATE TABLE coupons (...)", "CREATE TABLE articles (...)"], rollbackStatements: ["DROP TABLE brands", "DROP TABLE coupons", "DROP TABLE articles"], tags: ["schema"] },
    { id: "mig_v3", version: "v1.2.0", name: "Add Reviews & Questions", description: "Product reviews and Q&A tables", status: "applied", appliedAt: now - 40 * 86400000, completedAt: now - 40 * 86400000 + 5200, durationMs: 5200, author: "system", checksum: "i9j0k1l2", statements: ["CREATE TABLE product_reviews (...)", "CREATE TABLE product_questions (...)"], rollbackStatements: ["DROP TABLE product_reviews", "DROP TABLE product_questions"], tags: ["schema", "engagement"] },
    { id: "mig_v4", version: "v1.3.0", name: "Add Suppliers & Gateways", description: "Supplier profiles, payment gateway configs, returns", status: "applied", appliedAt: now - 25 * 86400000, completedAt: now - 25 * 86400000 + 6800, durationMs: 6800, author: "system", checksum: "m3n4o5p6", statements: ["CREATE TABLE suppliers (...)", "CREATE TABLE payment_gateways (...)", "CREATE TABLE returns (...)"], rollbackStatements: ["DROP TABLE suppliers", "DROP TABLE payment_gateways", "DROP TABLE returns"], tags: ["schema", "fulfilment"] },
    { id: "mig_v5", version: "v1.4.0", name: "Add Hero Slides & Homepage", description: "Homepage builder schema, hero slides", status: "applied", appliedAt: now - 18 * 86400000, completedAt: now - 18 * 86400000 + 3400, durationMs: 3400, author: "system", checksum: "q7r8s9t0", statements: ["CREATE TABLE hero_slides (...)", "CREATE TABLE homepage_sections (...)"], rollbackStatements: ["DROP TABLE hero_slides", "DROP TABLE homepage_sections"], tags: ["feature", "cms"] },
    { id: "mig_v6", version: "v1.5.0", name: "Add SEO & Redirects", description: "SEO metadata, redirect rules, sitemap tracking", status: "applied", appliedAt: now - 12 * 86400000, completedAt: now - 12 * 86400000 + 2800, durationMs: 2800, author: "system", checksum: "u1v2w3x4", statements: ["CREATE TABLE redirects (...)", "CREATE TABLE seo_metadata (...)"] , rollbackStatements: ["DROP TABLE redirects", "DROP TABLE seo_metadata"], tags: ["feature", "seo"] },
    { id: "mig_v7", version: "v1.6.0", name: "Add Marketing Popups", description: "Popup campaigns, referral tracking, loyalty tiers", status: "applied", appliedAt: now - 8 * 86400000, completedAt: now - 8 * 86400000 + 4600, durationMs: 4600, author: "system", checksum: "y5z6a7b8", statements: ["CREATE TABLE popups (...)", "CREATE TABLE referrals (...)", "CREATE TABLE loyalty_tiers (...)"], rollbackStatements: ["DROP TABLE popups", "DROP TABLE referrals", "DROP TABLE loyalty_tiers"], tags: ["feature", "marketing"] },
    { id: "mig_v8", version: "v1.7.0", name: "Add Design Tokens", description: "Design token management, header/footer config", status: "applied", appliedAt: now - 4 * 86400000, completedAt: now - 4 * 86400000 + 3100, durationMs: 3100, author: "system", checksum: "c9d0e1f2", statements: ["CREATE TABLE design_tokens (...)", "CREATE TABLE header_config (...)", "CREATE TABLE footer_config (...)"], rollbackStatements: ["DROP TABLE design_tokens", "DROP TABLE header_config", "DROP TABLE footer_config"], tags: ["feature", "design"] },
    { id: "mig_v9", version: "v1.8.0", name: "Add CRM Tables", description: "Customer timeline, notes, tasks, support tickets", status: "applied", appliedAt: now - 2 * 86400000, completedAt: now - 2 * 86400000 + 7200, durationMs: 7200, author: "system", checksum: "g3h4i5j6", statements: ["CREATE TABLE customer_timeline (...)", "CREATE TABLE customer_notes (...)", "CREATE TABLE support_tickets (...)"], rollbackStatements: ["DROP TABLE customer_timeline", "DROP TABLE customer_notes", "DROP TABLE support_tickets"], tags: ["feature", "crm"] },
    { id: "mig_v10", version: "v1.8.1", name: "Add Media Indexes", description: "Full-text search indexes for media assets", status: "applied", appliedAt: now - 1 * 86400000, completedAt: now - 1 * 86400000 + 1800, durationMs: 1800, author: "system", checksum: "k7l8m9n0", statements: ["CREATE INDEX idx_media_fts ON media_assets USING gin(to_tsvector('english', filename))"], rollbackStatements: ["DROP INDEX idx_media_fts"], tags: ["performance", "dam"] },
    { id: "mig_v11", version: "v1.9.0", name: "Add Developer Extensions", description: "Extension registry, webhook configs, feature flags", status: "pending", author: "system", checksum: "o1p2q3r4", statements: ["CREATE TABLE extensions (...)", "CREATE TABLE webhook_configs (...)", "CREATE TABLE feature_flags (...)"], rollbackStatements: ["DROP TABLE extensions", "DROP TABLE webhook_configs", "DROP TABLE feature_flags"], tags: ["feature", "developer"] },
    { id: "mig_v12", version: "v1.9.1", name: "Add Vector Search Index", description: "pgvector extension for AI-powered semantic search", status: "pending", author: "system", checksum: "s5t6u7v8", statements: ["CREATE EXTENSION IF NOT EXISTS vector", "CREATE TABLE product_embeddings (...)"], rollbackStatements: ["DROP TABLE product_embeddings", "DROP EXTENSION IF EXISTS vector"], tags: ["feature", "ai", "search"] },
    { id: "mig_v13", version: "v2.0.0", name: "Add Audit & Compliance", description: "Comprehensive audit trail and data retention policies", status: "pending", author: "system", checksum: "w9x0y1z2", statements: ["CREATE TABLE audit_entries (...)", "CREATE TABLE retention_policies (...)"], rollbackStatements: ["DROP TABLE audit_entries", "DROP TABLE retention_policies"], tags: ["feature", "security", "compliance"] },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_migrations`, JSON.stringify(migrations)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  QUERY OPTIMIZATION & ANALYZER                                      */
/* ================================================================== */

export interface QueryProfile {
  id: string;
  query: string;
  table: string;
  type: "select" | "insert" | "update" | "delete" | "join" | "aggregate";
  durationMs: number;
  rowsExamined: number;
  rowsReturned: number;
  scans: "sequential" | "index" | "bitmap" | "none";
  indexUsed: string;
  cacheHit: boolean;
  createdAt: number;
  frequency: "frequent" | "occasional" | "rare";
  suggestion?: string;
}

export function getSlowQueries(threshold = 100): QueryProfile[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_queries`) || "[]").filter((q: QueryProfile) => q.durationMs >= threshold); } catch { return []; }
}

export function getQueryStats(): { totalQueries: number; avgDuration: number; slowCount: number; cacheHitRate: number; seqScanCount: number } {
  try {
    const queries: QueryProfile[] = JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_queries`) || "[]");
    const avgDuration = queries.length ? Math.round(queries.reduce((s, q) => s + q.durationMs, 0) / queries.length) : 0;
    const slowCount = queries.filter((q) => q.durationMs >= 100).length;
    const cacheHits = queries.filter((q) => q.cacheHit).length;
    const cacheHitRate = queries.length ? Math.round((cacheHits / queries.length) * 100) : 0;
    const seqScanCount = queries.filter((q) => q.scans === "sequential").length;
    return { totalQueries: queries.length, avgDuration, slowCount, cacheHitRate, seqScanCount };
  } catch { return { totalQueries: 0, avgDuration: 0, slowCount: 0, cacheHitRate: 0, seqScanCount: 0 }; }
}

/* Seed query profiles */
(function seedQueries() {
  if (getQueryStats().totalQueries > 0) return;
  const queries: QueryProfile[] = [
    { id: uid("q"), query: "SELECT * FROM products WHERE category_id = $1 ORDER BY price ASC", table: "products", type: "select", durationMs: 45, rowsExamined: 24, rowsReturned: 12, scans: "index", indexUsed: "idx_products_category", cacheHit: true, createdAt: Date.now() - 300000, frequency: "frequent", suggestion: "Covering index would eliminate sort" },
    { id: uid("q"), query: "SELECT p.*, b.name as brand_name FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.price BETWEEN $1 AND $2", table: "products", type: "join", durationMs: 180, rowsExamined: 120, rowsReturned: 8, scans: "index", indexUsed: "idx_products_price", cacheHit: false, createdAt: Date.now() - 600000, frequency: "occasional", suggestion: "Consider composite index on (price, brand_id)" },
    { id: uid("q"), query: "INSERT INTO orders (customer_id, items, total, status) VALUES ($1, $2, $3, $4) RETURNING id", table: "orders", type: "insert", durationMs: 12, rowsExamined: 0, rowsReturned: 1, scans: "none", indexUsed: "", cacheHit: false, createdAt: Date.now() - 120000, frequency: "frequent", suggestion: "" },
    { id: uid("q"), query: "UPDATE products SET stock = stock - $1 WHERE id = $2", table: "products", type: "update", durationMs: 8, rowsExamined: 0, rowsReturned: 0, scans: "index", indexUsed: "idx_products_slug", cacheHit: true, createdAt: Date.now() - 240000, frequency: "frequent", suggestion: "" },
    { id: uid("q"), query: "SELECT o.*, oi.* FROM orders o JOIN LATERAL jsonb_to_recordset(o.items) AS oi(product_id UUID, qty INT, price DECIMAL) ON TRUE WHERE o.status = $1", table: "orders", type: "join", durationMs: 320, rowsExamined: 840, rowsReturned: 42, scans: "sequential", indexUsed: "", cacheHit: false, createdAt: Date.now() - 900000, frequency: "frequent", suggestion: "Normalize order_items into separate table" },
    { id: uid("q"), query: "SELECT COUNT(*) as cnt, status FROM orders GROUP BY status", table: "orders", type: "aggregate", durationMs: 25, rowsExamined: 42, rowsReturned: 6, scans: "index", indexUsed: "idx_orders_status", cacheHit: true, createdAt: Date.now() - 450000, frequency: "occasional", suggestion: "" },
    { id: uid("q"), query: "DELETE FROM audit_logs WHERE ts < NOW() - INTERVAL '90 days'", table: "audit_logs", type: "delete", durationMs: 450, rowsExamined: 1200, rowsReturned: 0, scans: "sequential", indexUsed: "", cacheHit: false, createdAt: Date.now() - 1800000, frequency: "rare", suggestion: "Add partition by month using BRIN index on ts" },
    { id: uid("q"), query: "SELECT * FROM products WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery($1)", table: "products", type: "select", durationMs: 65, rowsExamined: 24, rowsReturned: 6, scans: "index", indexUsed: "idx_products_search", cacheHit: false, createdAt: Date.now() - 150000, frequency: "frequent", suggestion: "" },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_queries`, JSON.stringify(queries)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  STORAGE ENGINE                                                     */
/* ================================================================== */

export interface StorageVolume {
  id: string;
  name: string;
  tier: StorageTier;
  provider: string;
  region: string;
  totalBytes: number;
  usedBytes: number;
  fileCount: number;
  status: "healthy" | "degraded" | "full";
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  deduplicationEnabled: boolean;
  dailyGrowthMb: number;
  lastBackup?: number;
  description: string;
}

export function getStorageVolumes(): StorageVolume[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_storage`) || "[]"); } catch { return []; }
}

export function getStorageStats(): { total: number; usedBytes: number; totalBytes: number; healthy: number; fileCount: number; compressed: number } {
  const volumes = getStorageVolumes();
  return {
    total: volumes.length,
    usedBytes: volumes.reduce((s, v) => s + v.usedBytes, 0),
    totalBytes: volumes.reduce((s, v) => s + v.totalBytes, 0),
    healthy: volumes.filter((v) => v.status === "healthy").length,
    fileCount: volumes.reduce((s, v) => s + v.fileCount, 0),
    compressed: volumes.filter((v) => v.compressionEnabled).length,
  };
}

/* Seed storage volumes */
(function seedStorage() {
  if (getStorageVolumes().length > 0) return;
  const volumes: StorageVolume[] = [
    { id: uid("vol"), name: "Product Images (Hot)", tier: "hot", provider: "AWS S3", region: "us-east-1", totalBytes: 5 * 1024 * 1024 * 1024, usedBytes: 1.2 * 1024 * 1024 * 1024, fileCount: 240, status: "healthy", compressionEnabled: true, encryptionEnabled: true, deduplicationEnabled: false, dailyGrowthMb: 12.5, description: "Primary product and category images" },
    { id: uid("vol"), name: "Media Archive (Cold)", tier: "cold", provider: "AWS S3 Glacier", region: "us-east-1", totalBytes: 20 * 1024 * 1024 * 1024, usedBytes: 4.8 * 1024 * 1024 * 1024, fileCount: 89, status: "healthy", compressionEnabled: true, encryptionEnabled: true, deduplicationEnabled: true, dailyGrowthMb: 0.5, description: "Archived media assets older than 6 months" },
    { id: uid("vol"), name: "Document Storage", tier: "warm", provider: "AWS S3", region: "us-west-2", totalBytes: 2 * 1024 * 1024 * 1024, usedBytes: 0.4 * 1024 * 1024 * 1024, fileCount: 156, status: "healthy", compressionEnabled: true, encryptionEnabled: true, deduplicationEnabled: false, dailyGrowthMb: 3.2, description: "Supplier contracts, invoices, legal documents" },
    { id: uid("vol"), name: "Database Backups", tier: "cold", provider: "AWS S3 Glacier", region: "us-east-1", totalBytes: 50 * 1024 * 1024 * 1024, usedBytes: 32.5 * 1024 * 1024 * 1024, fileCount: 84, status: "healthy", compressionEnabled: true, encryptionEnabled: true, deduplicationEnabled: true, dailyGrowthMb: 180, description: "Automated daily database snapshots" },
    { id: uid("vol"), name: "Log Archive", tier: "archive", provider: "AWS S3 Glacier Deep Archive", region: "us-east-1", totalBytes: 100 * 1024 * 1024 * 1024, usedBytes: 78.3 * 1024 * 1024 * 1024, fileCount: 1240, status: "degraded", compressionEnabled: true, encryptionEnabled: true, deduplicationEnabled: true, dailyGrowthMb: 42, description: "Structured and application logs (retention: 7 years)" },
    { id: uid("vol"), name: "CDN Edge Cache", tier: "cache", provider: "Cloudflare", region: "global", totalBytes: 10 * 1024 * 1024 * 1024, usedBytes: 3.6 * 1024 * 1024 * 1024, fileCount: 420, status: "healthy", compressionEnabled: true, encryptionEnabled: true, deduplicationEnabled: false, dailyGrowthMb: 0, description: "Edge-cached static assets and media" },
    { id: uid("vol"), name: "AI Training Data", tier: "warm", provider: "AWS S3", region: "us-east-1", totalBytes: 30 * 1024 * 1024 * 1024, usedBytes: 8.2 * 1024 * 1024 * 1024, fileCount: 15, status: "healthy", compressionEnabled: false, encryptionEnabled: true, deduplicationEnabled: false, dailyGrowthMb: 0, description: "Curated datasets for AI model training" },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_storage`, JSON.stringify(volumes)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  BACKUP ORCHESTRATION                                               */
/* ================================================================== */

export interface BackupJob {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  database: string;
  sizeMb: number;
  durationMs: number;
  encryption: boolean;
  compression: boolean;
  retentionDays: number;
  location: string;
  startedAt: number;
  completedAt?: number;
  verifiedAt?: number;
  verifiedBy?: string;
  error?: string;
  checksum?: string;
  tags: string[];
}

export interface BackupPolicy {
  id: string;
  name: string;
  description: string;
  type: BackupType[];
  schedule: string;
  retentionDays: number;
  encryptionRequired: boolean;
  compressionRequired: boolean;
  databases: string[];
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
}

export function getBackupJobs(): BackupJob[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_backups`) || "[]"); } catch { return []; }
}

export function getBackupPolicies(): BackupPolicy[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_backup_policies`) || "[]"); } catch { return []; }
}

export function createBackupJob(name: string, type: BackupType, database: string): BackupJob {
  const job: BackupJob = {
    id: uid("bak"), name, type, status: "running",
    database, sizeMb: Math.round(100 + Math.random() * 900),
    durationMs: Math.round(5000 + Math.random() * 25000),
    encryption: true, compression: true, retentionDays: 90,
    location: `s3://alaya-backups/${type}/${database}/`,
    startedAt: Date.now(), tags: ["automated"],
  };
  const all = getBackupJobs();
  all.unshift(job);
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_backups`, JSON.stringify(all.slice(0, 200))); } catch { /* ignore */ }
  // Simulate completion
  setTimeout(() => {
    const jobs = getBackupJobs();
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx !== -1) {
      const success = Math.random() > 0.08;
      jobs[idx] = { ...jobs[idx], status: success ? "completed" : "failed", completedAt: Date.now(), error: success ? undefined : "Connection timeout during backup" };
      try { localStorage.setItem(`${DATA_STORAGE_KEY}_backups`, JSON.stringify(jobs.slice(0, 200))); } catch { /* ignore */ }
      pushLog(success ? "info" : "error", "system", `Backup ${success ? "completed" : "failed"}: ${name} (${type})`);
    }
  }, 2000);
  pushLog("info", "system", `Backup started: ${name} (${type})`);
  return job;
}

export function verifyBackupJob(id: string, verifier: string): BackupJob | null {
  const all = getBackupJobs();
  const idx = all.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status: "verified", verifiedAt: Date.now(), verifiedBy: verifier, checksum: uid("chk") };
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_backups`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getBackupStats(): { total: number; completed: number; failed: number; verified: number; totalSizeMb: number; avgDurationMs: number } {
  const jobs = getBackupJobs();
  return {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    verified: jobs.filter((j) => j.status === "verified").length,
    totalSizeMb: jobs.reduce((s, j) => s + (j.sizeMb || 0), 0),
    avgDurationMs: jobs.length ? Math.round(jobs.reduce((s, j) => s + j.durationMs, 0) / jobs.length) : 0,
  };
}

/* Seed backup policies */
(function seedBackupPolicies() {
  if (getBackupPolicies().length > 0) return;
  const now = Date.now();
  const policies: BackupPolicy[] = [
    { id: uid("bp"), name: "Daily Full Backup", description: "Complete database snapshot every 24 hours", type: ["full"], schedule: "0 3 * * *", retentionDays: 90, encryptionRequired: true, compressionRequired: true, databases: ["alaya_production", "alaya_analytics"], enabled: true, lastRun: now - 20 * 3600000, nextRun: now + 4 * 3600000, createdAt: now - 180 * 86400000 },
    { id: uid("bp"), name: "Hourly Incremental", description: "Incremental changes every hour", type: ["incremental"], schedule: "0 * * * *", retentionDays: 7, encryptionRequired: true, compressionRequired: true, databases: ["alaya_production"], enabled: true, lastRun: now - 1800000, nextRun: now + 3600000, createdAt: now - 90 * 86400000 },
    { id: uid("bp"), name: "Weekly Differential", description: "Differential backup for faster restore", type: ["differential"], schedule: "0 2 * * 0", retentionDays: 30, encryptionRequired: true, compressionRequired: true, databases: ["alaya_production"], enabled: true, lastRun: now - 5 * 86400000, nextRun: now + 2 * 86400000, createdAt: now - 90 * 86400000 },
    { id: uid("bp"), name: "Snapshot Before Deploy", description: "Pre-deployment snapshot for rollback safety", type: ["snapshot"], schedule: "on_deploy", retentionDays: 14, encryptionRequired: true, compressionRequired: false, databases: ["alaya_production", "alaya_analytics", "alaya_warehouse"], enabled: true, createdAt: now - 60 * 86400000 },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_backup_policies`, JSON.stringify(policies)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  DATA GOVERNANCE                                                    */
/* ================================================================== */

export interface DataPolicy {
  id: string;
  name: string;
  description: string;
  domain: DataDomain;
  actions: GovernanceAction[];
  retentionDays: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  appliedTo: string[];
}

export interface DataCatalogEntry {
  id: string;
  name: string;
  domain: DataDomain;
  steward: string;
  classification: "public" | "internal" | "confidential" | "restricted";
  retentionDays: number;
  rowCount: number;
  sizeMb: number;
  description: string;
  fields: string[];
}

export function getDataPolicies(): DataPolicy[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_policies`) || "[]"); } catch { return []; }
}

export function getDataCatalog(): DataCatalogEntry[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_catalog`) || "[]"); } catch { return []; }
}

export function getGovernanceStats(): { totalPolicies: number; totalCatalog: number; restrictedCount: number; confidentailCount: number } {
  const catalog = getDataCatalog();
  return {
    totalPolicies: getDataPolicies().length,
    totalCatalog: catalog.length,
    restrictedCount: catalog.filter((e) => e.classification === "restricted").length,
    confidentailCount: catalog.filter((e) => e.classification === "confidential").length,
  };
}

/* Seed data governance */
(function seedGovernance() {
  if (getDataPolicies().length > 0) return;
  const now = Date.now();
  const policies: DataPolicy[] = [
    { id: uid("dp"), name: "Customer Data Retention", description: "Retain customer data for 7 years per GDPR", domain: "crm", actions: ["retention", "audit"], retentionDays: 2555, enabled: true, createdAt: now - 180 * 86400000, updatedAt: now - 30 * 86400000, appliedTo: ["customers", "orders", "support_tickets"] },
    { id: uid("dp"), name: "Audit Log Retention", description: "Audit logs retained for 3 years for compliance", domain: "security", actions: ["retention", "archival"], retentionDays: 1095, enabled: true, createdAt: now - 180 * 86400000, updatedAt: now - 60 * 86400000, appliedTo: ["audit_logs", "security_events"] },
    { id: uid("dp"), name: "PII Masking", description: "Mask personally identifiable information in analytics exports", domain: "analytics", actions: ["mask"], retentionDays: 0, enabled: true, createdAt: now - 120 * 86400000, updatedAt: now - 45 * 86400000, appliedTo: ["customer_analytics", "export_reports"] },
    { id: uid("dp"), name: "Log Archival", description: "Application logs older than 90 days moved to cold storage", domain: "infrastructure", actions: ["archival"], retentionDays: 90, enabled: true, createdAt: now - 180 * 86400000, updatedAt: now - 15 * 86400000, appliedTo: ["application_logs", "api_logs"] },
    { id: uid("dp"), name: "Data Purge Schedule", description: "Temporary cart data older than 30 days purged automatically", domain: "commerce", actions: ["purge"], retentionDays: 30, enabled: true, createdAt: now - 90 * 86400000, updatedAt: now - 7 * 86400000, appliedTo: ["abandoned_carts", "cart_sessions"] },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_policies`, JSON.stringify(policies)); } catch { /* ignore */ }

  const catalog: DataCatalogEntry[] = [
    { id: uid("dc"), name: "Product Catalog", domain: "pim", steward: "product-team", classification: "public", retentionDays: 0, rowCount: 24, sizeMb: 4.2, description: "All product data including pricing and descriptions", fields: ["id", "name", "price", "description", "images"] },
    { id: uid("dc"), name: "Customer Profiles", domain: "crm", steward: "crm-team", classification: "confidential", retentionDays: 2555, rowCount: 18, sizeMb: 3.4, description: "Customer accounts, preferences, and contact info", fields: ["id", "name", "email", "phone", "addresses"] },
    { id: uid("dc"), name: "Order Transactions", domain: "commerce", steward: "finance-team", classification: "confidential", retentionDays: 2555, rowCount: 42, sizeMb: 8.6, description: "Complete order records with line items and payments", fields: ["id", "number", "customer_id", "items", "total", "status"] },
    { id: uid("dc"), name: "Payment Methods", domain: "commerce", steward: "finance-team", classification: "restricted", retentionDays: 365, rowCount: 12, sizeMb: 0.8, description: "Tokenized payment method references", fields: ["id", "customer_id", "type", "last_four", "expiry"] },
    { id: uid("dc"), name: "Audit Trail", domain: "security", steward: "security-team", classification: "restricted", retentionDays: 1095, rowCount: 1200, sizeMb: 18.5, description: "All security-relevant actions and events", fields: ["id", "actor", "action", "entity", "detail", "ts"] },
    { id: uid("dc"), name: "Analytics Events", domain: "analytics", steward: "analytics-team", classification: "internal", retentionDays: 365, rowCount: 8400, sizeMb: 45, description: "Product views, clicks, and user interactions", fields: ["id", "event", "product_id", "user_id", "ts"] },
    { id: uid("dc"), name: "AI Model Data", domain: "ai", steward: "ai-team", classification: "internal", retentionDays: 730, rowCount: 15, sizeMb: 8200, description: "Training datasets and model artifacts", fields: ["id", "name", "version", "dataset_size", "accuracy"] },
    { id: uid("dc"), name: "Affiliate Links", domain: "affiliate", steward: "affiliate-team", classification: "internal", retentionDays: 365, rowCount: 1240, sizeMb: 2.1, description: "All affiliate network links and performance data", fields: ["id", "partner", "url", "clicks", "conversions"] },
  ];
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_catalog`, JSON.stringify(catalog)); } catch { /* ignore */ }
})();

/* ================================================================== */
/*  DATA QUALITY & DEDUPLICATION                                       */
/* ================================================================== */

export interface DataQualityReport {
  id: string;
  table: string;
  totalRows: number;
  duplicatesFound: number;
  nullValues: number;
  constraintViolations: number;
  orphans: number;
  lastChecked: number;
  score: number;
  issues: { type: string; count: number; detail: string }[];
}

export function getDataQualityReports(): DataQualityReport[] {
  try { return JSON.parse(localStorage.getItem(`${DATA_STORAGE_KEY}_quality`) || "[]"); } catch { return []; }
}

export function runDataQualityCheck(): DataQualityReport[] {
  const tables = getSchemaTables();
  const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));
  const reports: DataQualityReport[] = tables.map((t) => ({
    id: uid("dq"), table: t.name,
    totalRows: t.rowCount,
    duplicatesFound: rnd(0, Math.max(1, Math.floor(t.rowCount * 0.05))),
    nullValues: rnd(0, Math.max(1, Math.floor(t.rowCount * 0.08))),
    constraintViolations: rnd(0, Math.max(1, Math.floor(t.rowCount * 0.02))),
    orphans: rnd(0, Math.max(1, Math.floor(t.rowCount * 0.03))),
    lastChecked: Date.now(),
    score: parseFloat((85 + Math.random() * 15).toFixed(1)),
    issues: [
      { type: "duplicate", count: rnd(0, 3), detail: "Duplicate rows found" },
      { type: "null_constraint", count: rnd(0, 2), detail: "NULL values in non-nullable columns" },
      { type: "orphan", count: rnd(0, 2), detail: "Orphaned foreign key references" },
    ].filter((i) => i.count > 0),
  }));
  try { localStorage.setItem(`${DATA_STORAGE_KEY}_quality`, JSON.stringify(reports)); } catch { /* ignore */ }
  return reports;
}

/* ================================================================== */
/*  DATA OPERATIONAL ANALYTICS                                         */
/* ================================================================== */

export interface DataMetric {
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  sparkline: number[];
  description: string;
}

export function getDataMetrics(): DataMetric[] {
  const rnd = () => Math.random();
  return [
    { name: "Total Data Size", value: 24.6, unit: "GB", previousValue: 23.1, changePercent: 6.5, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((18 + rnd() * 10).toFixed(1))), description: "All databases and storage volumes" },
    { name: "Avg Query Time", value: 42, unit: "ms", previousValue: 48, changePercent: -12.5, trend: "down", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(30 + rnd() * 40)), description: "Average query execution duration" },
    { name: "Cache Hit Rate", value: parseFloat((93.2 + rnd() * 5).toFixed(1)), unit: "%", previousValue: 91.8, changePercent: 1.5, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((85 + rnd() * 12).toFixed(1))), description: "Database query cache effectiveness" },
    { name: "Slow Queries (24h)", value: Math.round(8 + rnd() * 15), unit: "queries", previousValue: 12, changePercent: -25, trend: "down", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(5 + rnd() * 25)), description: "Queries exceeding 100ms threshold" },
    { name: "Storage Utilization", value: parseFloat((55 + rnd() * 15).toFixed(1)), unit: "%", previousValue: 52, changePercent: 5.8, trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => parseFloat((40 + rnd() * 25).toFixed(1))), description: "Total storage capacity used" },
    { name: "Connection Pool", value: Math.round(60 + rnd() * 20), unit: "%", previousValue: 55, changePercent: 9.1, trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => Math.round(40 + rnd() * 35)), description: "Average pool utilization across all databases" },
    { name: "Data Quality Score", value: parseFloat((92 + rnd() * 7).toFixed(1)), unit: "%", previousValue: 90.5, changePercent: 1.7, trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((85 + rnd() * 10).toFixed(1))), description: "Overall data quality assessment" },
    { name: "Backup Success Rate", value: 98.5, unit: "%", previousValue: 97.2, changePercent: 1.3, trend: "up", status: "good", sparkline: [96, 97, 96.5, 98, 97.5, 98.2, 98.5, 97.8, 98.1, 98.5], description: "Percentage of successful backups" },
    { name: "Replication Lag", value: Math.round(2 + rnd() * 5), unit: "seconds", previousValue: 4, changePercent: -25, trend: "down", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(1 + rnd() * 8)), description: "Maximum replica lag across all replicas" },
    { name: "Storage Cost", value: 1240 + Math.round(rnd() * 300), unit: "$/mo", previousValue: 1150, changePercent: 7.8, trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => Math.round(800 + rnd() * 600)), description: "Monthly storage and backup costs" },
  ];
}

/* ================================================================== */
/*  DATA LINEAGE & IMPACT ANALYSIS                                     */
/* ================================================================== */

export interface DataLineageNode {
  id: string;
  name: string;
  type: "source" | "transform" | "store" | "export" | "api";
  domain: DataDomain;
  description: string;
}

export interface DataLineageEdge {
  source: string;
  target: string;
  type: "sync" | "async" | "batch" | "stream";
  frequency: string;
}

export function getDataLineage(): { nodes: DataLineageNode[]; edges: DataLineageEdge[] } {
  const nodes: DataLineageNode[] = [
    { id: "dl_products", name: "Product Catalog (PIM)", type: "source", domain: "pim", description: "Master product data" },
    { id: "dl_storefront", name: "Storefront API", type: "api", domain: "commerce", description: "Customer-facing API" },
    { id: "dl_search", name: "Search Index", type: "store", domain: "search", description: "Algolia search index" },
    { id: "dl_orders", name: "Order Transactions", type: "source", domain: "commerce", description: "Customer orders" },
    { id: "dl_warehouse", name: "Analytics Warehouse", type: "store", domain: "analytics", description: "Aggregated analytics data" },
    { id: "dl_etl", name: "ETL Pipeline", type: "transform", domain: "analytics", description: "Daily aggregation jobs" },
    { id: "dl_ai", name: "AI Recommendations", type: "transform", domain: "ai", description: "ML model inference" },
    { id: "dl_crm", name: "CRM Database", type: "store", domain: "crm", description: "Customer relationship data" },
    { id: "dl_affiliate", name: "Affiliate Network", type: "source", domain: "affiliate", description: "Affiliate links & commissions" },
    { id: "dl_export", name: "Data Export (CSV/API)", type: "export", domain: "analytics", description: "External data feeds" },
  ];
  const edges: DataLineageEdge[] = [
    { source: "dl_products", target: "dl_storefront", type: "sync", frequency: "realtime" },
    { source: "dl_products", target: "dl_search", type: "async", frequency: "every 5 min" },
    { source: "dl_storefront", target: "dl_orders", type: "sync", frequency: "realtime" },
    { source: "dl_orders", target: "dl_warehouse", type: "batch", frequency: "hourly" },
    { source: "dl_etl", target: "dl_warehouse", type: "batch", frequency: "daily" },
    { source: "dl_warehouse", target: "dl_ai", type: "batch", frequency: "daily" },
    { source: "dl_storefront", target: "dl_crm", type: "async", frequency: "realtime" },
    { source: "dl_affiliate", target: "dl_warehouse", type: "batch", frequency: "daily" },
    { source: "dl_warehouse", target: "dl_export", type: "batch", frequency: "on demand" },
  ];
  return { nodes, edges };
}
