/**
 * ALAYA INSIDER — Repository Initialization
 * --------------------------------------------------------------------------
 * Initializes all repositories by verifying the database schema is ready
 * and performing any needed pre-checks.
 */

import { query } from "../index.js";

export async function initRepositories(): Promise<void> {
  // Verify critical tables exist
  const requiredTables = [
    "users", "products", "categories", "brands", "orders",
    "coupons", "articles", "customers", "suppliers",
    "payment_gateways", "returns", "redirects", "popups",
    "affiliates", "loyalty_tiers", "audit_logs", "jobs", "backups",
    "supplier_accounts", "supplier_products", "supplier_orders",
    "purchase_orders", "supplier_inventory", "supplier_tracking",
    "supplier_returns", "supplier_ratings", "supplier_health",
    "supplier_logs", "supplier_scorecard", "warehouse_inventory",
    "warehouse_transfers",
    "shipping_carriers", "shipping_profiles", "shipping_rates",
    "shipments", "shipment_items", "shipment_events",
    "shipping_labels", "delivery_confirmations", "carrier_health",
    "shipping_rules", "shipping_quotes",
    "workflow_definitions", "workflow_instances", "workflow_steps",
    "workflow_events", "workflow_queue", "workflow_history",
    "workflow_failures", "workflow_compensation",
    "automation_rules", "automation_triggers", "automation_conditions",
    "automation_actions", "automation_runs", "automation_jobs",
    "automation_logs", "automation_workers", "automation_schedules",
    "automation_metrics",
    "system_metrics", "system_logs", "system_traces", "system_alerts",
    "system_incidents", "system_backups", "system_restores",
    "service_health", "worker_health", "queue_health",
    "ai_providers", "ai_models", "ai_prompts", "ai_prompt_versions",
    "ai_generations", "ai_usage", "ai_costs", "ai_feedback",
    "ai_quality", "ai_workflows", "ai_workflow_runs",
    "search_index", "search_terms", "search_clicks", "search_sessions",
    "search_synonyms", "search_boost_rules", "search_redirects",
    "recommendations", "recommendation_scores", "personalization_profiles",
    "search_analytics",
  ];

  const missing: string[] = [];

  for (const table of requiredTables) {
    try {
      const result = await query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table],
      );
      if (!result.rows[0]?.exists) {
        missing.push(table);
      }
    } catch {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    console.warn(`[DB] Missing tables: ${missing.join(", ")} — run migrations first`);
    throw new Error(`Missing tables: ${missing.join(", ")}`);
  }

  console.log(`[DB] All ${requiredTables.length} required tables verified`);
}
