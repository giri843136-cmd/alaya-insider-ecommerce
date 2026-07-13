/**
 * ALAYA INSIDER — Database Migration Runner
 * --------------------------------------------------------------------------
 * Reads and executes schema SQL files against PostgreSQL.
 * Tracks applied migrations in a `_migrations` table.
 * Supports rollback via reverse migrations in schema files.
 *
 * Commands:
 *   tsx src/db/migrate.ts up       → Apply all pending migrations
 *   tsx src/db/migrate.ts down     → Rollback last migration
 *   tsx src/db/migrate.ts status   → Show migration status
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { getPool, query, queryOne, waitForDatabase, closePool } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ================================================================== */
/*  MIGRATION CONFIG                                                   */
/* ================================================================== */

const MIGRATIONS_TABLE = "_migrations";
const SCHEMA_DIR = __dirname; // db/ directory
const MAIN_SCHEMA = "schema.sql";

export interface Migration {
  id: string;
  name: string;
  hash: string;
  applied_at: Date;
  duration_ms: number;
}

/* ================================================================== */
/*  INIT MIGRATIONS TABLE                                              */
/* ================================================================== */

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      hash VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      duration_ms INTEGER DEFAULT 0
    )
  `);
}

/* ================================================================== */
/*  HASH CALCULATION                                                   */
/* ================================================================== */

import { createHash } from "node:crypto";

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/* ================================================================== */
/*  MIGRATION OPERATIONS                                               */
/* ================================================================== */

async function isApplied(name: string): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `SELECT id FROM "${MIGRATIONS_TABLE}" WHERE name = $1`,
    [name],
  );
  return row !== null;
}

async function applyMigration(name: string, content: string): Promise<void> {
  const hash = hashContent(content);
  const t0 = performance.now();

  // Parse the SQL content into individual statements, accounting for
  // semicolons inside string literals, function bodies, and comments.
  const statements = parseSqlStatements(content);

  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[MIGRATE] Error in "${name}": ${message}`);
      console.error(`[MIGRATE] Statement: ${stmt.slice(0, 200)}...`);
      throw err;
    }
  }

  const durationMs = Math.round(performance.now() - t0);

  await query(
    `INSERT INTO "${MIGRATIONS_TABLE}" (name, hash, duration_ms) VALUES ($1, $2, $3)`,
    [name, hash, durationMs],
  );

  console.log(`[MIGRATE] Applied: ${name} (${durationMs}ms, hash: ${hash})`);
}

/**
 * Parse SQL text into individual statements, respecting:
 * - Single-line comments (-- ...)
 * - Block comments (/* ... *​/)
 * - String literals with single quotes and escaped quotes
 * - Dollar-quoting ($$ ... $$ or $tag$ ... $tag$)
 */
function parseSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];
    const next = i + 1 < len ? sql[i + 1] : "";

    // Single-line comment: --
    if (ch === "-" && next === "-") {
      // Skip to end of line
      while (i < len && sql[i] !== "\n") i++;
      continue;
    }

    // Block comment: /* ... */
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < len - 1 && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2; // Skip past */
      continue;
    }

    // Dollar-quoting: $$ ... $$ or $tag$ ... $tag$
    if (ch === "$" && next === "$") {
      current += "$$";
      i += 2;
      while (i < len - 1 && !(sql[i] === "$" && sql[i + 1] === "$")) {
        current += sql[i];
        i++;
      }
      current += "$$";
      i += 2;
      continue;
    }
    // Dollar-quoting with tag: $tag$ ... $tag$
    if (ch === "$") {
      let tagStart = i + 1;
      let tagEnd = i + 1;
      while (tagEnd < len && sql[tagEnd] !== "$") tagEnd++;
      if (tagEnd < len && tagEnd > tagStart) {
        const tag = sql.slice(tagStart, tagEnd);
        const closeTag = "$" + tag + "$";
        // Include the opening $tag$
        current += sql.slice(i, tagEnd + 1);
        i = tagEnd + 1;
        // Find closing tag
        const closeIdx = sql.indexOf(closeTag, i);
        if (closeIdx !== -1) {
          current += sql.slice(i, closeIdx + closeTag.length);
          i = closeIdx + closeTag.length;
          continue;
        }
      }
    }

    // String literal: '...' (with escaped quotes '')
    if (ch === "'") {
      current += "'";
      i++;
      while (i < len) {
        current += sql[i];
        if (sql[i] === "'") {
          // Check for escaped quote ''
          if (i + 1 < len && sql[i + 1] === "'") {
            i++;
            current += sql[i];
          } else {
            i++;
            break;
          }
        }
        i++;
      }
      continue;
    }

    // Statement terminator: ; (but not inside strings or comments)
    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Don't forget last statement if it has no trailing semicolon
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

async function rollbackLastMigration(): Promise<void> {
  const last = await queryOne<Migration>(
    `SELECT * FROM "${MIGRATIONS_TABLE}" ORDER BY id DESC LIMIT 1`,
  );
  if (!last) {
    console.log("[MIGRATE] No migrations to roll back");
    return;
  }

  // Look for a rollback SQL file
  const rollbackFile = join(SCHEMA_DIR, `rollback_${last.name}`);
  if (existsSync(rollbackFile)) {
    const content = readFileSync(rollbackFile, "utf-8");
    const statements = content
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await query(stmt);
      } catch (err) {
        throw err;
      }
    }
  } else {
    // No rollback SQL — just delete the migration record (rebuild will re-apply)
    console.log(`[MIGRATE] No rollback SQL found for "${last.name}" — removing record only`);
  }

  await query(`DELETE FROM "${MIGRATIONS_TABLE}" WHERE id = $1`, [last.id]);
  console.log(`[MIGRATE] Rolled back: ${last.name}`);
}

/* ================================================================== */
/*  RUN ALL MIGRATIONS                                                 */
/* ================================================================== */

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const schemaPath = join(SCHEMA_DIR, MAIN_SCHEMA);
  if (!existsSync(schemaPath)) {
    console.log("[MIGRATE] No schema.sql found, skipping");
    return;
  }

  const content = readFileSync(schemaPath, "utf-8");
  const name = MAIN_SCHEMA;

  if (await isApplied(name)) {
    console.log(`[MIGRATE] Schema already applied (${name})`);
    // Check if we need to re-apply due to hash mismatch
    const applied = await queryOne<Migration>(
      `SELECT * FROM "${MIGRATIONS_TABLE}" WHERE name = $1`,
      [name],
    );
    const currentHash = hashContent(content);
    if (applied && applied.hash !== currentHash) {
      console.log(`[MIGRATE] Schema changed (hash: ${applied.hash} → ${currentHash}) — re-applying`);
      await query(`DELETE FROM "${MIGRATIONS_TABLE}" WHERE name = $1`, [name]);
      await applyMigration(name, content);
    }
    return;
  }

  await applyMigration(name, content);
}

/* ================================================================== */
/*  RESET DATABASE (DANGER: drops all tables)                          */
/* ================================================================== */

export async function resetDatabase(): Promise<void> {
  console.log("[MIGRATE] WARNING: Resetting database — all data will be lost!");
  
  // Drop all tables in dependency order
  const tables = [
    "media_usage", "media_versions", "media_assets",
    "backups", "jobs", "audit_logs",
    "system_metrics", "system_logs", "system_traces", "system_alerts",
    "system_incidents", "system_backups", "system_restores",
    "service_health", "worker_health", "queue_health",
    "automation_rules", "feature_flags",
    "api_keys", "webhooks",
    "live_sales", "support_tickets",
    "abandoned_carts", "referrals",
    "customer_loyalty", "loyalty_tiers",
    "affiliates", "popups", "redirects",
    "warehouse_transfers", "warehouse_inventory",
    "automation_metrics", "automation_schedules", "automation_workers",
    "automation_logs", "automation_jobs", "automation_runs",
    "automation_actions", "automation_conditions", "automation_triggers",
    "supplier_scorecard", "supplier_logs", "supplier_health",
    "supplier_ratings", "supplier_returns", "supplier_tracking",
    "supplier_inventory", "supplier_sync_jobs",
    "purchase_order_items", "purchase_orders",
    "supplier_orders", "supplier_products", "supplier_accounts",
    "affiliate_price_history", "affiliate_health_logs",
    "affiliate_marketplaces", "affiliate_campaigns",
    "affiliate_commissions", "affiliate_conversions",
    "affiliate_clicks", "affiliate_links",
    "affiliate_products", "affiliate_accounts", "affiliate_networks",
    "shipping_quotes", "carrier_health",
    "delivery_confirmations", "shipping_labels", "shipment_events",
    "shipment_items", "shipments", "shipping_rates", "shipping_profiles",
    "shipping_carriers",
    "workflow_compensation", "workflow_failures", "workflow_history",
    "workflow_queue", "workflow_events", "workflow_steps",
    "workflow_instances", "workflow_definitions",
    "payment_gateways", "suppliers",
    "questions", "articles", "authors",
    "coupons", "refunds", "returns",
    "payments", "order_items", "orders",
    "addresses", "customers",
    "product_images", "products",
    "categories", "brands",
    "recovery_codes", "trusted_devices", "sessions", "users",
    "_migrations",
  ];

  for (const table of tables) {
    try {
      await query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    } catch {
      // ignore if table doesn't exist
    }
  }

  console.log("[MIGRATE] Database reset complete");
}

/* ================================================================== */
/*  CLI ENTRY POINT                                                    */
/* ================================================================== */

async function main() {
  const command = process.argv[2] || "up";

  const connected = await waitForDatabase();
  if (!connected) {
    console.error("[MIGRATE] Cannot connect to database");
    process.exit(1);
  }

  try {
    switch (command) {
      case "up":
        await runMigrations();
        console.log("[MIGRATE] All migrations applied successfully");
        break;

      case "down":
        await rollbackLastMigration();
        break;

      case "status":
        await ensureMigrationsTable();
        const applied = await query<Migration>(
          `SELECT * FROM "${MIGRATIONS_TABLE}" ORDER BY id`,
        );
        if (applied.rows.length === 0) {
          console.log("[MIGRATE] No migrations applied");
        } else {
          console.log("[MIGRATE] Applied migrations:");
          for (const m of applied.rows) {
            console.log(`  ${m.id}. ${m.name} — ${m.hash} (${m.applied_at.toISOString()})`);
          }
        }
        break;

      case "reset":
        await resetDatabase();
        await runMigrations();
        console.log("[MIGRATE] Database reset and re-migrated");
        break;

      default:
        console.log(`[MIGRATE] Unknown command: ${command}`);
        console.log("Usage: tsx src/db/migrate.ts [up|down|status|reset]");
    }
  } catch (err) {
    console.error("[MIGRATE] Failed:", err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run directly via CLI
const isDirectRun = process.argv[1]?.includes("migrate");
if (isDirectRun) {
  main();
}

export { main as cli };
