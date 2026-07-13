/**
 * ALAYA INSIDER — Repository Aggregator
 * --------------------------------------------------------------------------
 * Exports all entity repositories with a unified interface.
 * This is the main entry point for database operations throughout the server.
 */

import { BaseRepository } from "./base.js";
export { BaseRepository } from "./base.js";

// Import repository types and functions
export {
  createAuditLog,
  listAuditLogs,
  getAuditLogsForEntity,
  getAuditLogsByActor,
  getAuditStats,
  flushAuditLogsSync,
} from "./audit.js";
export type { AuditEntry, CreateAuditInput } from "./audit.js";

export {
  createJob, getJob, listJobs, updateJobStatus,
  claimNextJob, retryFailedJob, cancelJob, getJobStats, cleanupOldJobs,
} from "./jobs.js";
export type { Job, JobStatus, JobType, CreateJobInput } from "./jobs.js";

export {
  createBackup, verifyBackup, restoreBackup,
  listBackups, getBackupStats, cleanupExpiredBackups, scheduleBackup,
} from "./backups.js";
export type { Backup, BackupType, BackupStatus } from "./backups.js";

import { query, queryOne, queryAll, withTransaction, type PaginatedResult, type ListParams } from "../index.js";

/* ================================================================== */
/*  ENTITY REPOSITORIES                                                */
/* ================================================================== */

/**
 * Instantiate a BaseRepository for each entity type.
 * This avoids having dozens of individual repository class files while
 * still providing type-safe CRUD for every entity.
 */

export const products = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "products",
      entityType: "product",
      searchColumns: ["name", "sku", "brand", "short_description"],
      defaultSort: "created_at",
    });
  }

  async findBySlug(slug: string) {
    return queryOne("SELECT * FROM products WHERE slug = $1", [slug]);
  }

  async searchProducts(query_str: string, limit = 20) {
    return queryAll(
      `SELECT * FROM products 
       WHERE status = 'published' 
       AND (name ILIKE $1 OR short_description ILIKE $1 OR brand ILIKE $1 OR sku ILIKE $1) 
       ORDER BY rating DESC, review_count DESC 
       LIMIT $2`,
      [`%${query_str}%`, limit],
    );
  }

  async getFeatured() {
    return queryAll(
      "SELECT * FROM products WHERE featured = true AND status = 'published' ORDER BY created_at DESC LIMIT 12",
    );
  }

  async getBestSellers(limit = 8) {
    return queryAll(
      "SELECT * FROM products WHERE best_seller = true AND status = 'published' ORDER BY rating DESC LIMIT $1",
      [limit],
    );
  }

  async getByCategory(categoryId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM products WHERE category_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT $2",
      [categoryId, limit],
    );
  }

  async getByBrand(brandId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM products WHERE brand_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT $2",
      [brandId, limit],
    );
  }

  async getRelated(productId: string, categoryId: string, limit = 4) {
    return queryAll(
      `SELECT * FROM products 
       WHERE category_id = $1 AND id != $2 AND status = 'published' 
       ORDER BY rating DESC LIMIT $3`,
      [categoryId, productId, limit],
    );
  }
})();

export const categories = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "categories",
      entityType: "category",
      searchColumns: ["name", "tagline", "description"],
      defaultSort: "sort_order",
      defaultOrder: "asc",
    });
  }

  async findBySlug(slug: string) {
    return queryOne("SELECT * FROM categories WHERE slug = $1", [slug]);
  }
})();

export const brands = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "brands",
      entityType: "brand",
      searchColumns: ["name", "tagline", "description", "country"],
    });
  }

  async findBySlug(slug: string) {
    return queryOne("SELECT * FROM brands WHERE slug = $1", [slug]);
  }

  async getFeatured() {
    return queryAll(
      "SELECT * FROM brands WHERE featured = true ORDER BY name ASC",
    );
  }
})();

export const orders = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "orders",
      entityType: "order",
      searchColumns: ["number", "customer_name", "customer_email"],
      defaultSort: "created_at",
    });
  }

  async findByNumber(number: string) {
    return queryOne("SELECT * FROM orders WHERE number = $1", [number]);
  }

  async getByCustomer(customerId: string, limit = 20) {
    return queryAll(
      "SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2",
      [customerId, limit],
    );
  }

  async getRecent(limit = 10) {
    return queryAll(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }

  async getRevenueStats() {
    return queryOne(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        AVG(total) as avg_order_value,
        COUNT(*) FILTER (WHERE status = 'completed' OR status = 'delivered') as completed_orders
       FROM orders WHERE created_at > NOW() - INTERVAL '30 days'`,
    );
  }

  async getRevenueByDay(days = 30) {
    return queryAll(
      `SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
       FROM orders WHERE created_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at) ORDER BY date`,
      [days],
    );
  }
})();

export const coupons = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "coupons",
      entityType: "coupon",
      searchColumns: ["code", "description"],
    });
  }

  async findByCode(code: string) {
    return queryOne("SELECT * FROM coupons WHERE code ILIKE $1", [code]);
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await this.findByCode(code);
    if (!coupon) return { valid: false, discount: 0, message: "Invalid code." };
    if (!coupon.active) return { valid: false, discount: 0, message: "This code is no longer active." };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { valid: false, discount: 0, message: "This code has expired." };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
      return { valid: false, discount: 0, message: "This code has reached its limit." };
    if (subtotal < coupon.min_spend)
      return { valid: false, discount: 0, message: `Spend $${coupon.min_spend} to use this code.` };
    const discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : Math.min(coupon.value, subtotal);
    return { valid: true, coupon, discount: Math.round(discount * 100) / 100, message: "Code applied." };
  }
})();

export const articles = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "articles",
      entityType: "article",
      searchColumns: ["title", "excerpt", "author", "category"],
    });
  }

  async findBySlug(slug: string) {
    return queryOne("SELECT * FROM articles WHERE slug = $1", [slug]);
  }

  async getFeatured() {
    return queryAll(
      "SELECT * FROM articles WHERE featured = true ORDER BY published_at DESC LIMIT 6",
    );
  }

  async getRecent(limit = 10) {
    return queryAll(
      "SELECT * FROM articles ORDER BY published_at DESC LIMIT $1",
      [limit],
    );
  }

  async getByCategory(category: string, limit = 20) {
    return queryAll(
      "SELECT * FROM articles WHERE category = $1 ORDER BY published_at DESC LIMIT $2",
      [category, limit],
    );
  }
})();

export const customers_repo = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "customers",
      entityType: "customer",
      searchColumns: ["name", "email", "phone"],
    });
  }

  async findByEmail(email: string) {
    return queryOne("SELECT * FROM customers WHERE email ILIKE $1", [email]);
  }

  async authenticate(email: string, password: string) {
    return queryOne(
      "SELECT * FROM customers WHERE email ILIKE $1 AND password = $2",
      [email, password],
    );
  }

  async getVip() {
    return queryAll(
      "SELECT * FROM customers WHERE status = 'vip' ORDER BY name ASC",
    );
  }
})();

export const suppliers = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "suppliers",
      entityType: "supplier",
      searchColumns: ["name", "email", "country"],
    });
  }

  async resolveByCountry(country?: string) {
    if (country) {
      const found = await queryAll(
        "SELECT * FROM suppliers WHERE active = true AND country ILIKE $1 ORDER BY priority ASC LIMIT 1",
        [country],
      );
      if (found.length > 0) return found[0];
    }
    return queryOne(
      "SELECT * FROM suppliers WHERE active = true ORDER BY priority ASC LIMIT 1",
    );
  }
})();

export const gateways = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "payment_gateways",
      entityType: "payment_gateway",
      searchColumns: ["name", "code"],
    });
  }

  async getActiveForCountry(country?: string) {
    if (country) {
      return queryAll(
        `SELECT * FROM payment_gateways 
         WHERE active = true AND (countries = '{}' OR $1 = ANY(countries))
         ORDER BY name`,
        [country],
      );
    }
    return queryAll(
      "SELECT * FROM payment_gateways WHERE active = true ORDER BY name",
    );
  }
})();

export const returns = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "returns",
      entityType: "return",
      searchColumns: ["number", "customer_name", "customer_email"],
    });
  }
})();

export const redirects = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "redirects",
      entityType: "redirect",
      searchColumns: ["from_path", "to_path"],
    });
  }

  async findByFromPath(from: string) {
    return queryOne("SELECT * FROM redirects WHERE from_path = $1", [from]);
  }

  async wouldCreateLoop(from: string, to: string) {
    if (!to) return false;
    let current = to;
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      if (current === from) return true;
      seen.add(current);
      const next = await this.findByFromPath(current);
      current = next ? next.to_path : "";
    }
    return false;
  }
})();

export const popups = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "popups",
      entityType: "popup",
      searchColumns: ["name", "headline"],
    });
  }

  async trackView(id: string) {
    return query(
      "UPDATE popups SET views = views + 1 WHERE id = $1",
      [id],
    );
  }

  async trackConversion(id: string) {
    return query(
      "UPDATE popups SET conversions = conversions + 1 WHERE id = $1",
      [id],
    );
  }

  async getActivePopups() {
    return queryAll(
      "SELECT * FROM popups WHERE active = true ORDER BY created_at DESC",
    );
  }
})();

/* ================================================================== */
/*  AFFILIATE PLATFORM (PR-3)                                          */
/* ================================================================== */

export const affiliateNetworks = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_networks",
      entityType: "affiliate_network",
      searchColumns: ["name", "provider", "description"],
    });
  }

  async getByProvider(provider: string) {
    return queryOne("SELECT * FROM affiliate_networks WHERE provider = $1", [provider]);
  }

  async getActive() {
    return queryAll("SELECT * FROM affiliate_networks WHERE active = true ORDER BY failover_priority ASC");
  }
})();

export const affiliateAccounts = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_accounts",
      entityType: "affiliate_account",
      searchColumns: ["label", "account_id", "tracking_id"],
    });
  }

  async getByNetwork(networkId: string) {
    return queryAll(
      "SELECT * FROM affiliate_accounts WHERE network_id = $1 AND active = true ORDER BY label",
      [networkId],
    );
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM affiliate_accounts WHERE active = true ORDER BY label",
    );
  }

  async getByMarketplace(country: string) {
    return queryAll(
      `SELECT a.*, n.provider, n.name as network_name
       FROM affiliate_accounts a
       JOIN affiliate_networks n ON n.id = a.network_id
       JOIN affiliate_marketplaces m ON m.account_id = a.id
       WHERE a.active = true AND n.active = true AND m.country = $1
       ORDER BY n.failover_priority ASC`,
      [country],
    );
  }
})();

export const affiliateProducts = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_products",
      entityType: "affiliate_product",
      searchColumns: ["provider_product_id"],
    });
  }

  async getByProduct(productId: string) {
    return queryAll(
      `SELECT ap.*, an.name as network_name, an.provider
       FROM affiliate_products ap
       JOIN affiliate_networks an ON an.id = ap.network_id
       WHERE ap.product_id = $1 AND ap.active = true
       ORDER BY ap.priority ASC`,
      [productId],
    );
  }

  async getByAccount(accountId: string) {
    return queryAll(
      "SELECT * FROM affiliate_products WHERE account_id = $1 AND active = true",
      [accountId],
    );
  }

  async getPrimary(productId: string) {
    return queryOne(
      `SELECT ap.*, an.name as network_name, an.provider
       FROM affiliate_products ap
       JOIN affiliate_networks an ON an.id = ap.network_id
       WHERE ap.product_id = $1 AND ap.is_primary = true AND ap.active = true
       LIMIT 1`,
      [productId],
    );
  }
})();

export const affiliateLinks = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_links",
      entityType: "affiliate_link",
      searchColumns: ["original_url", "short_url", "cloaked_url"],
    });
  }

  async getByProduct(productId: string) {
    return queryAll(
      "SELECT * FROM affiliate_links WHERE product_id = $1 AND active = true ORDER BY created_at DESC",
      [productId],
    );
  }

  async getByAccount(accountId: string) {
    return queryAll(
      "SELECT * FROM affiliate_links WHERE account_id = $1 ORDER BY created_at DESC",
      [accountId],
    );
  }

  async resolveForGeo(country?: string, device?: string, language?: string): Promise<any[]> {
    let sql = "SELECT * FROM affiliate_links WHERE active = true";
    const params: any[] = [];
    let idx = 1;

    if (country) {
      sql += ` AND geo_rules @> $${idx}::jsonb`;
      params.push(JSON.stringify([{ country }]));
      idx++;
    }
    if (device) {
      sql += ` AND device_rules @> $${idx}::jsonb`;
      params.push(JSON.stringify([{ device }]));
      idx++;
    }
    if (language) {
      sql += ` AND language_rules @> $${idx}::jsonb`;
      params.push(JSON.stringify([{ language }]));
      idx++;
    }

    sql += " ORDER BY clicks DESC LIMIT 50";
    return queryAll(sql, params);
  }

  async incrementClick(id: string) {
    return query(
      "UPDATE affiliate_links SET clicks = clicks + 1, last_clicked_at = NOW() WHERE id = $1",
      [id],
    );
  }
})();

export const affiliateClicks = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_clicks",
      entityType: "affiliate_click",
      searchColumns: ["session_id", "ip_address", "referrer"],
    });
  }

  async getByLink(linkId: string, limit = 100) {
    return queryAll(
      "SELECT * FROM affiliate_clicks WHERE link_id = $1 ORDER BY clicked_at DESC LIMIT $2",
      [linkId, limit],
    );
  }

  async getStats(days = 30) {
    return queryOne(
      `SELECT 
        COUNT(*) as total_clicks,
        COUNT(*) FILTER (WHERE converted = true) as conversions,
        COALESCE(SUM(conversion_value), 0) as total_revenue,
        COUNT(DISTINCT country) as countries,
        COUNT(DISTINCT device_type) as device_types
       FROM affiliate_clicks
       WHERE clicked_at > NOW() - INTERVAL '1 day' * $1`,
      [days],
    );
  }

  async getByCountry(days = 30) {
    return queryAll(
      `SELECT country, COUNT(*) as clicks, 
        COUNT(*) FILTER (WHERE converted = true) as conversions,
        COALESCE(SUM(conversion_value), 0) as revenue
       FROM affiliate_clicks
       WHERE clicked_at > NOW() - INTERVAL '1 day' * $1 AND country IS NOT NULL
       GROUP BY country ORDER BY clicks DESC`,
      [days],
    );
  }

  async getByDevice(days = 30) {
    return queryAll(
      `SELECT device_type, COUNT(*) as clicks,
        COUNT(*) FILTER (WHERE converted = true) as conversions
       FROM affiliate_clicks
       WHERE clicked_at > NOW() - INTERVAL '1 day' * $1 AND device_type IS NOT NULL
       GROUP BY device_type ORDER BY clicks DESC`,
      [days],
    );
  }
})();

export const affiliateConversions = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_conversions",
      entityType: "affiliate_conversion",
      searchColumns: ["order_number"],
    });
  }

  async getByAccount(accountId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM affiliate_conversions WHERE account_id = $1 ORDER BY converted_at DESC LIMIT $2",
      [accountId, limit],
    );
  }

  async getStats(days = 30) {
    return queryOne(
      `SELECT 
        COUNT(*) as total_conversions,
        COALESCE(SUM(sale_amount), 0) as total_sales,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        AVG(sale_amount) as avg_order_value,
        AVG(commission_rate) as avg_commission_rate
       FROM affiliate_conversions
       WHERE converted_at > NOW() - INTERVAL '1 day' * $1 AND status != 'rejected'`,
      [days],
    );
  }

  async getDaily(days = 30) {
    return queryAll(
      `SELECT DATE(converted_at) as date,
        COUNT(*) as conversions,
        COALESCE(SUM(sale_amount), 0) as revenue,
        COALESCE(SUM(commission_amount), 0) as commission
       FROM affiliate_conversions
       WHERE converted_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(converted_at) ORDER BY date`,
      [days],
    );
  }

  async getTopProducts(limit = 10) {
    return queryAll(
      `SELECT 
        COALESCE(product_id::text, 'unknown') as product_id,
        COUNT(*) as conversions,
        COALESCE(SUM(sale_amount), 0) as revenue,
        COALESCE(SUM(commission_amount), 0) as commission
       FROM affiliate_conversions
       WHERE product_id IS NOT NULL
       GROUP BY product_id
       ORDER BY revenue DESC LIMIT $1`,
      [limit],
    );
  }
})();

export const affiliateCommissions = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_commissions",
      entityType: "affiliate_commission",
      searchColumns: ["order_number", "tier"],
    });
  }

  async getByAccount(accountId: string, status?: string) {
    const conditions = ["account_id = $1"];
    const params: any[] = [accountId];
    if (status) {
      conditions.push("status = $2");
      params.push(status);
    }
    return queryAll(
      `SELECT * FROM affiliate_commissions WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
      params,
    );
  }

  async getSummary() {
    return queryOne(
      `SELECT 
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'pending'), 0) as pending,
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'approved'), 0) as approved,
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'paid'), 0) as paid,
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'rejected'), 0) as rejected,
        COUNT(*) as total_records
       FROM affiliate_commissions`,
    );
  }
})();

export const affiliateCampaigns = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_campaigns",
      entityType: "affiliate_campaign",
      searchColumns: ["name", "description"],
    });
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM affiliate_campaigns WHERE active = true AND status = 'active' ORDER BY created_at DESC",
    );
  }
})();

export const affiliateMarketplaces = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_marketplaces",
      entityType: "affiliate_marketplace",
      searchColumns: ["country", "marketplace_code", "marketplace_url"],
    });
  }

  async getByCountry(country: string) {
    return queryAll(
      `SELECT m.*, n.name as network_name, n.provider, n.failover_priority
       FROM affiliate_marketplaces m
       JOIN affiliate_networks n ON n.id = m.network_id
       WHERE m.country = $1 AND m.active = true AND n.active = true
       ORDER BY m.is_primary DESC, n.failover_priority ASC`,
      [country],
    );
  }

  async getByNetwork(networkId: string) {
    return queryAll(
      "SELECT * FROM affiliate_marketplaces WHERE network_id = $1 ORDER BY country",
      [networkId],
    );
  }
})();

export const affiliateHealthLogs = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_health_logs",
      entityType: "affiliate_health_log",
    });
  }

  async getLatestByLink(linkId: string) {
    return queryOne(
      "SELECT * FROM affiliate_health_logs WHERE link_id = $1 ORDER BY checked_at DESC LIMIT 1",
      [linkId],
    );
  }

  async getStats() {
    return queryOne(
      `SELECT 
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE healthy = true) as healthy_count,
        COUNT(*) FILTER (WHERE healthy = false) as broken_count,
        AVG(response_time_ms) as avg_response_time
       FROM affiliate_health_logs
       WHERE checked_at > NOW() - INTERVAL '24 hours'`,
    );
  }
})();

export const affiliatePriceHistory = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliate_price_history",
      entityType: "affiliate_price",
    });
  }

  async getByProduct(productId: string, days = 90) {
    return queryAll(
      `SELECT * FROM affiliate_price_history
       WHERE product_id = $1 AND recorded_at > NOW() - INTERVAL '1 day' * $2
       ORDER BY recorded_at ASC`,
      [productId, days],
    );
  }

  async getLatestByProduct(productId: string) {
    return queryOne(
      "SELECT * FROM affiliate_price_history WHERE product_id = $1 ORDER BY recorded_at DESC LIMIT 1",
      [productId],
    );
  }

  async getAlerts(productId?: string) {
    let sql = `SELECT * FROM (
      SELECT DISTINCT ON (product_id) *,
        price - LAG(price) OVER (PARTITION BY product_id ORDER BY recorded_at) as price_drop
      FROM affiliate_price_history
    ) sub
    WHERE price_drop < 0`;
    const params: any[] = [];
    if (productId) {
      sql += " AND product_id = $1";
      params.push(productId);
    }
    sql += " ORDER BY recorded_at DESC LIMIT 20";
    return queryAll(sql, params);
  }
})();

export const affiliates = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "affiliates",
      entityType: "affiliate",
      searchColumns: ["name", "url"],
    });
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM affiliates WHERE active = true ORDER BY name",
    );
  }
})();

export const loyalty = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "loyalty_tiers",
      entityType: "loyalty_tier",
      searchColumns: ["name", "perk"],
      defaultSort: "min_points",
      defaultOrder: "asc",
    });
  }
})();

export const questions = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "questions",
      entityType: "question",
      searchColumns: ["author", "question", "answer"],
    });
  }

  async getByProduct(productId: string) {
    return queryAll(
      "SELECT * FROM questions WHERE product_id = $1 ORDER BY pinned DESC, helpful DESC, created_at DESC",
      [productId],
    );
  }

  async vote(id: string) {
    return query(
      "UPDATE questions SET helpful = helpful + 1 WHERE id = $1",
      [id],
    );
  }

  async answer(id: string, answer: string, answeredBy?: string) {
    return queryOne(
      "UPDATE questions SET answer = $1, answered_by = $2 WHERE id = $3 RETURNING *",
      [answer, answeredBy || "ALAYA Care", id],
    );
  }
})();

export const tickets = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "support_tickets",
      entityType: "support_ticket",
      searchColumns: ["number", "subject"],
    });
  }

  async reply(id: string, author: string, body: string) {
    return queryOne(
      `UPDATE support_tickets 
       SET messages = messages || $1::jsonb, status = 'pending', updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ author, body, ts: Date.now() }]), id],
    );
  }
})();

export const liveSales = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "live_sales",
      entityType: "live_sale",
    });
  }

  async getRecent(limit = 20) {
    return queryAll(
      "SELECT * FROM live_sales ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  }
})();

export const abandonedCarts = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "abandoned_carts",
      entityType: "abandoned_cart",
      searchColumns: ["email"],
    });
  }

  async recover(id: string) {
    return queryOne(
      "UPDATE abandoned_carts SET recovered = true, recovered_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
  }

  async getUnrecovered() {
    return queryAll(
      "SELECT * FROM abandoned_carts WHERE recovered = false ORDER BY created_at DESC",
    );
  }
})();

export const referrals = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "referrals",
      entityType: "referral",
      searchColumns: ["code", "customer_name"],
    });
  }
})();

export const addresses = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "addresses",
      entityType: "address",
      searchColumns: ["name", "city", "country"],
    });
  }

  async getByCustomer(customerId: string) {
    return queryAll(
      "SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC",
      [customerId],
    );
  }
})();

export const settings = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "settings",
      entityType: "settings",
      searchColumns: ["key"],
      immutableColumns: ["created_at", "key"],
    });
  }

  async getByKey(key: string) {
    return queryOne("SELECT * FROM settings WHERE key = $1", [key]);
  }

  async setValue(key: string, value: Record<string, unknown>) {
    const existing = await this.getByKey(key);
    if (existing) {
      return queryOne(
        "UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *",
        [JSON.stringify(value), key],
      );
    }
    return queryOne(
      "INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING *",
      [key, JSON.stringify(value)],
    );
  }

  async getAllAsMap(): Promise<Record<string, any>> {
    const rows = await queryAll<{ key: string; value: any }>(
      "SELECT key, value FROM settings",
    );
    const map: Record<string, any> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  }
})();

export const users_repo = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "users",
      entityType: "user",
      searchColumns: ["name", "email"],
    });
  }

  async findByEmail(email: string) {
    return queryOne("SELECT * FROM users WHERE email ILIKE $1", [email]);
  }

  async findByToken(token: string) {
    return queryOne(
      `SELECT u.* FROM users u 
       JOIN sessions s ON s.user_id = u.id 
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token],
    );
  }
})();

export const authors = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "authors",
      entityType: "author",
      searchColumns: ["name", "role"],
    });
  }
})();

export const webhooks = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "webhooks",
      entityType: "webhook",
      searchColumns: ["name", "url"],
    });
  }
})();

export const apiKeys = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "api_keys",
      entityType: "api_key",
      searchColumns: ["name"],
    });
  }
})();

export const featureFlags = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "feature_flags",
      entityType: "feature_flag",
      searchColumns: ["key", "name"],
    });
  }
})();

export const automationRules = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_rules",
      entityType: "automation_rule",
      searchColumns: ["name", "description"],
    });
  }

  async getEnabled() {
    return queryAll(
      "SELECT * FROM automation_rules WHERE enabled = true ORDER BY priority ASC, sort_order ASC",
    );
  }

  async getByTrigger(triggerEvent: string) {
    return queryAll(
      "SELECT * FROM automation_rules WHERE trigger_event = $1 AND enabled = true ORDER BY priority ASC",
      [triggerEvent],
    );
  }

  async getStats() {
    return queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE enabled = true) as active,
        COALESCE(SUM(run_count), 0) as total_runs,
        COALESCE(AVG(run_count), 0) as avg_runs
       FROM automation_rules`,
    );
  }
})();

export const automationTriggers = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_triggers",
      entityType: "automation_trigger",
      searchColumns: [],
    });
  }

  async getByRule(ruleId: string) {
    return queryAll(
      "SELECT * FROM automation_triggers WHERE rule_id = $1 AND active = true ORDER BY created_at",
      [ruleId],
    );
  }

  async getByEventType(eventType: string) {
    return queryAll(
      "SELECT t.*, r.name as rule_name, r.enabled as rule_enabled FROM automation_triggers t JOIN automation_rules r ON r.id = t.rule_id WHERE t.event_type = $1 AND t.active = true AND r.enabled = true",
      [eventType],
    );
  }
})();

export const automationConditions = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_conditions",
      entityType: "automation_condition",
      searchColumns: [],
    });
  }

  async getByRule(ruleId: string) {
    return queryAll(
      "SELECT * FROM automation_conditions WHERE rule_id = $1 ORDER BY sort_order ASC",
      [ruleId],
    );
  }

  async getChildren(parentId: string) {
    return queryAll(
      "SELECT * FROM automation_conditions WHERE parent_id = $1 ORDER BY sort_order ASC",
      [parentId],
    );
  }
})();

export const automationActions = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_actions",
      entityType: "automation_action",
      searchColumns: [],
    });
  }

  async getByRule(ruleId: string) {
    return queryAll(
      "SELECT * FROM automation_actions WHERE rule_id = $1 ORDER BY sort_order ASC",
      [ruleId],
    );
  }

  async getByType(type: string, limit = 50) {
    return queryAll(
      "SELECT * FROM automation_actions WHERE type = $1 ORDER BY created_at DESC LIMIT $2",
      [type, limit],
    );
  }
})();

export const automationRuns = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_runs",
      entityType: "automation_run",
      searchColumns: [],
    });
  }

  async getByRule(ruleId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM automation_runs WHERE rule_id = $1 ORDER BY created_at DESC LIMIT $2",
      [ruleId, limit],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM automation_runs WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }

  async getRecent(limit = 20) {
    return queryAll(
      "SELECT ar.*, r.name as rule_name FROM automation_runs ar JOIN automation_rules r ON r.id = ar.rule_id ORDER BY ar.created_at DESC LIMIT $1",
      [limit],
    );
  }
})();

export const automationJobs = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_jobs",
      entityType: "automation_job",
      searchColumns: [],
    });
  }

  async getByRun(runId: string) {
    return queryAll(
      "SELECT * FROM automation_jobs WHERE run_id = $1 ORDER BY created_at",
      [runId],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM automation_jobs WHERE status = $1 ORDER BY priority DESC, created_at ASC LIMIT $2",
      [status, limit],
    );
  }

  async getQueued(limit = 20) {
    return queryAll(
      "SELECT * FROM automation_jobs WHERE status = 'queued' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) ORDER BY priority DESC, created_at ASC LIMIT $1",
      [limit],
    );
  }

  async getFailed() {
    return queryAll(
      "SELECT * FROM automation_jobs WHERE status = 'failed' AND retry_count >= max_retries ORDER BY created_at DESC LIMIT 50",
    );
  }

  async getStats() {
    return queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'running') as running,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN retry_count END), 0) as avg_retries
       FROM automation_jobs WHERE created_at > NOW() - INTERVAL '7 days'`,
    );
  }
})();

export const automationLogs = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_logs",
      entityType: "automation_log",
      searchColumns: [],
    });
  }

  async getByRule(ruleId: string, limit = 100) {
    return queryAll(
      "SELECT * FROM automation_logs WHERE rule_id = $1 ORDER BY created_at DESC LIMIT $2",
      [ruleId, limit],
    );
  }

  async getByRun(runId: string) {
    return queryAll(
      "SELECT * FROM automation_logs WHERE run_id = $1 ORDER BY created_at",
      [runId],
    );
  }
})();

export const automationWorkers = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_workers",
      entityType: "automation_worker",
      searchColumns: ["name", "worker_type"],
    });
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM automation_workers WHERE status IN ('idle', 'busy') ORDER BY name",
    );
  }

  async getByStatus(status: string) {
    return queryAll(
      "SELECT * FROM automation_workers WHERE status = $1 ORDER BY name",
      [status],
    );
  }

  async getHealthy() {
    return queryAll(
      "SELECT * FROM automation_workers WHERE last_heartbeat_at > NOW() - INTERVAL '1 minute' ORDER BY name",
    );
  }
})();

export const automationSchedules = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_schedules",
      entityType: "automation_schedule",
      searchColumns: ["name"],
    });
  }

  async getDue() {
    return queryAll(
      `SELECT s.*, r.name as rule_name, r.enabled as rule_enabled
       FROM automation_schedules s
       JOIN automation_rules r ON r.id = s.rule_id
       WHERE s.enabled = true AND r.enabled = true
       AND (s.next_run_at IS NULL OR s.next_run_at <= NOW())
       AND (s.start_date IS NULL OR s.start_date <= NOW())
       AND (s.end_date IS NULL OR s.end_date >= NOW())`,
    );
  }

  async getByRule(ruleId: string) {
    return queryAll(
      "SELECT * FROM automation_schedules WHERE rule_id = $1 ORDER BY created_at",
      [ruleId],
    );
  }
})();

export const automationMetrics = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "automation_metrics",
      entityType: "automation_metric",
      searchColumns: [],
    });
  }

  async getByName(name: string, since?: string) {
    let sql = "SELECT * FROM automation_metrics WHERE metric_name = $1";
    const params: any[] = [name];
    if (since) {
      sql += " AND recorded_at >= $2";
      params.push(since);
    }
    sql += " ORDER BY recorded_at DESC LIMIT 100";
    return queryAll(sql, params);
  }

  async getByRule(ruleId: string, limit = 100) {
    return queryAll(
      "SELECT * FROM automation_metrics WHERE rule_id = $1 ORDER BY recorded_at DESC LIMIT $2",
      [ruleId, limit],
    );
  }

  async getSummary(days = 30) {
    return queryAll(
      `SELECT metric_name, COUNT(*) as count, AVG(metric_value) as avg_value, SUM(metric_value) as total
       FROM automation_metrics WHERE recorded_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY metric_name ORDER BY count DESC`,
      [days],
    );
  }
})();

export const mediaAssets = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "media_assets",
      entityType: "media_asset",
      searchColumns: ["filename", "original_name", "alt"],
    });
  }
})();

/* ================================================================== */
/*  ENTERPRISE SUPPLIER & FULFILLMENT PLATFORM (PR-4)                  */
/* ================================================================== */

export const supplierAccounts = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_accounts",
      entityType: "supplier_account",
      searchColumns: ["company_name", "email", "contact_person"],
    });
  }

  async getBySupplier(supplierId: string) {
    return queryAll(
      "SELECT * FROM supplier_accounts WHERE supplier_id = $1 AND active = true ORDER BY priority ASC",
      [supplierId],
    );
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM supplier_accounts WHERE active = true AND automation_capable = true ORDER BY priority ASC",
    );
  }

  async getByCountry(country: string) {
    return queryAll(
      `SELECT sa.*, s.name as supplier_name
       FROM supplier_accounts sa
       JOIN suppliers s ON s.id = sa.supplier_id
       WHERE sa.active = true AND s.active = true
       AND (sa.country ILIKE $1 OR $1 = ANY(sa.shipping_countries))
       ORDER BY sa.priority ASC`,
      [country],
    );
  }
})();

export const supplierProducts = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_products",
      entityType: "supplier_product",
      searchColumns: ["supplier_sku", "supplier_name", "supplier_product_id"],
    });
  }

  async getByProduct(productId: string) {
    return queryAll(
      "SELECT * FROM supplier_products WHERE product_id = $1 AND active = true ORDER BY priority ASC",
      [productId],
    );
  }

  async getBySupplier(supplierId: string) {
    return queryAll(
      "SELECT * FROM supplier_products WHERE supplier_id = $1 AND active = true",
      [supplierId],
    );
  }

  async getPreferred(productId: string) {
    return queryOne(
      "SELECT * FROM supplier_products WHERE product_id = $1 AND is_preferred = true AND active = true LIMIT 1",
      [productId],
    );
  }

  async getFallback(productId: string) {
    return queryOne(
      "SELECT * FROM supplier_products WHERE product_id = $1 AND is_backup = true AND active = true ORDER BY priority ASC LIMIT 1",
      [productId],
    );
  }

  async getBestSupplier(productId: string) {
    return queryOne(
      `SELECT sp.*, sa.country as supplier_country, sa.avg_delivery_days, sa.api_endpoint
       FROM supplier_products sp
       JOIN supplier_accounts sa ON sa.id = sp.account_id
       WHERE sp.product_id = $1 AND sp.active = true AND sa.active = true
       ORDER BY sp.priority ASC, sa.avg_delivery_days ASC
       LIMIT 1`,
      [productId],
    );
  }

  async updateSyncStatus(id: string, status: string) {
    return queryOne(
      "UPDATE supplier_products SET sync_status = $1, last_synced_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id],
    );
  }
})();

export const supplierOrders = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_orders",
      entityType: "supplier_order",
      searchColumns: ["order_number", "supplier_name", "tracking_number"],
    });
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM supplier_orders WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId],
    );
  }

  async getBySupplier(supplierId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM supplier_orders WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT $2",
      [supplierId, limit],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM supplier_orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }
})();

export const purchaseOrders = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "purchase_orders",
      entityType: "purchase_order",
      searchColumns: ["number", "supplier_name", "customer_name", "order_number"],
    });
  }

  async findByNumber(number: string) {
    return queryOne("SELECT * FROM purchase_orders WHERE number = $1", [number]);
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM purchase_orders WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId],
    );
  }

  async getBySupplier(supplierId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM purchase_orders WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT $2",
      [supplierId, limit],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM purchase_orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }

  async getRecent(limit = 20) {
    return queryAll(
      "SELECT * FROM purchase_orders ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  }
})();

export const supplierSyncJobs = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_sync_jobs",
      entityType: "supplier_sync_job",
      searchColumns: [],
    });
  }

  async getPending() {
    return queryAll(
      "SELECT * FROM supplier_sync_jobs WHERE status = 'pending' AND (next_sync_at IS NULL OR next_sync_at <= NOW()) ORDER BY created_at ASC",
    );
  }

  async getBySupplier(supplierId: string) {
    return queryAll(
      "SELECT * FROM supplier_sync_jobs WHERE supplier_id = $1 ORDER BY created_at DESC",
      [supplierId],
    );
  }
})();

export const supplierInventory = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_inventory",
      entityType: "supplier_inventory",
      searchColumns: [],
    });
  }

  async getByProduct(productId: string) {
    return queryAll(
      "SELECT * FROM supplier_inventory WHERE product_id = $1 ORDER BY stock DESC",
      [productId],
    );
  }

  async getBySupplier(supplierId: string) {
    return queryAll(
      "SELECT * FROM supplier_inventory WHERE supplier_id = $1 ORDER BY snapshot_at DESC",
      [supplierId],
    );
  }

  async getLowStock(threshold = 10) {
    return queryAll(
      "SELECT * FROM supplier_inventory WHERE available < $1 AND in_stock = true ORDER BY available ASC",
      [threshold],
    );
  }
})();

export const supplierTracking = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_tracking",
      entityType: "supplier_tracking",
      searchColumns: ["tracking_number", "carrier", "po_number"],
    });
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM supplier_tracking WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId],
    );
  }

  async getByPO(poId: string) {
    return queryAll(
      "SELECT * FROM supplier_tracking WHERE purchase_order_id = $1 ORDER BY created_at DESC",
      [poId],
    );
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM supplier_tracking WHERE status NOT IN ('delivered', 'cancelled') ORDER BY created_at DESC",
    );
  }
})();

export const supplierReturns = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_returns",
      entityType: "supplier_return",
      searchColumns: ["number", "rma_number", "order_number"],
    });
  }

  async getBySupplier(supplierId: string) {
    return queryAll(
      "SELECT * FROM supplier_returns WHERE supplier_id = $1 ORDER BY created_at DESC",
      [supplierId],
    );
  }

  async getByStatus(status: string) {
    return queryAll(
      "SELECT * FROM supplier_returns WHERE status = $1 ORDER BY created_at DESC",
      [status],
    );
  }
})();

export const supplierRatings = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_ratings",
      entityType: "supplier_rating",
      searchColumns: [],
    });
  }

  async getAverage(supplierId: string) {
    return queryOne(
      `SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE category = 'quality') as quality_count,
        AVG(rating) FILTER (WHERE category = 'quality') as quality_avg,
        COUNT(*) FILTER (WHERE category = 'delivery') as delivery_count,
        AVG(rating) FILTER (WHERE category = 'delivery') as delivery_avg,
        COUNT(*) FILTER (WHERE category = 'communication') as comm_count,
        AVG(rating) FILTER (WHERE category = 'communication') as comm_avg
       FROM supplier_ratings WHERE supplier_id = $1`,
      [supplierId],
    );
  }
})();

export const supplierHealth = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_health",
      entityType: "supplier_health",
      searchColumns: [],
    });
  }

  async getLatest(supplierId: string) {
    return queryOne(
      "SELECT * FROM supplier_health WHERE supplier_id = $1 ORDER BY checked_at DESC LIMIT 1",
      [supplierId],
    );
  }

  async getUnhealthySuppliers() {
    return queryAll(
      "SELECT DISTINCT ON (supplier_id) * FROM supplier_health WHERE healthy = false ORDER BY supplier_id, checked_at DESC",
    );
  }
})();

export const supplierLogs = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_logs",
      entityType: "supplier_log",
      searchColumns: ["action", "details"],
    });
  }

  async getByOrder(orderId: string, limit = 100) {
    return queryAll(
      "SELECT * FROM supplier_logs WHERE order_id = $1 ORDER BY created_at DESC LIMIT $2",
      [orderId, limit],
    );
  }

  async getByPO(poId: string, limit = 100) {
    return queryAll(
      "SELECT * FROM supplier_logs WHERE purchase_order_id = $1 ORDER BY created_at DESC LIMIT $2",
      [poId, limit],
    );
  }

  async logAction(action: string, status: string, details: string, meta?: Record<string, any>) {
    return queryOne(
      `INSERT INTO supplier_logs (id, action, status, details, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [this.genId(), action, status, details, JSON.stringify(meta || {})],
    );
  }
})();

export const supplierScorecard = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "supplier_scorecard",
      entityType: "supplier_scorecard",
      searchColumns: [],
    });
  }

  async getBySupplier(supplierId: string) {
    return queryOne(
      "SELECT * FROM supplier_scorecard WHERE supplier_id = $1 ORDER BY calculated_at DESC LIMIT 1",
      [supplierId],
    );
  }

  async getRankings(limit = 20) {
    return queryAll(
      `SELECT ss.*, s.name as supplier_name
       FROM supplier_scorecard ss
       JOIN suppliers s ON s.id = ss.supplier_id
       ORDER BY ss.rank ASC, ss.health_score DESC
       LIMIT $1`,
      [limit],
    );
  }
})();

export const warehouseInventory = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "warehouse_inventory",
      entityType: "warehouse_inventory",
      searchColumns: ["warehouse_name", "product_name", "product_sku"],
    });
  }

  async getByWarehouse(warehouseId: string) {
    return queryAll(
      "SELECT * FROM warehouse_inventory WHERE warehouse_id = $1 ORDER BY available ASC",
      [warehouseId],
    );
  }

  async getByProduct(productId: string) {
    return queryAll(
      "SELECT * FROM warehouse_inventory WHERE product_id = $1 ORDER BY warehouse_name",
      [productId],
    );
  }

  async getLowStock() {
    return queryAll(
      "SELECT * FROM warehouse_inventory WHERE available <= low_stock_threshold ORDER BY available ASC",
    );
  }

  async getTotalStock(productId: string) {
    return queryOne(
      `SELECT product_id, product_name, product_sku,
        SUM(available) as total_available,
        SUM(reserved) as total_reserved,
        SUM(incoming) as total_incoming,
        SUM(transit) as total_transit,
        SUM(available + reserved + incoming + transit) as total_stock
       FROM warehouse_inventory WHERE product_id = $1
       GROUP BY product_id, product_name, product_sku`,
      [productId],
    );
  }

  async adjustStock(warehouseId: string, productId: string, delta: number) {
    return query(
      `UPDATE warehouse_inventory SET available = GREATEST(0, available + $1), updated_at = NOW()
       WHERE warehouse_id = $2 AND product_id = $3`,
      [delta, warehouseId, productId],
    );
  }

  async reserveStock(warehouseId: string, productId: string, qty: number) {
    return query(
      `UPDATE warehouse_inventory SET available = available - $1, reserved = reserved + $1, updated_at = NOW()
       WHERE warehouse_id = $2 AND product_id = $3 AND available >= $1`,
      [qty, warehouseId, productId],
    );
  }
})();

export const warehouseTransfers = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "warehouse_transfers",
      entityType: "warehouse_transfer",
      searchColumns: ["number", "product_name", "product_sku"],
    });
  }

  async getByProduct(productId: string) {
    return queryAll(
      "SELECT * FROM warehouse_transfers WHERE product_id = $1 ORDER BY created_at DESC",
      [productId],
    );
  }

  async getPending() {
    return queryAll(
      "SELECT * FROM warehouse_transfers WHERE status = 'pending' OR status = 'in_transit' ORDER BY created_at ASC",
    );
  }
})();

/* ================================================================== */
/*  ENTERPRISE ORDER ORCHESTRATION PLATFORM (PR-6)                    */
/* ================================================================== */

export const workflowDefinitions = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_definitions",
      entityType: "workflow_definition",
      searchColumns: ["name", "description", "type"],
      defaultSort: "created_at",
    });
  }

  async getByType(type: string) {
    return queryAll(
      "SELECT * FROM workflow_definitions WHERE type = $1 AND status = 'published' ORDER BY version DESC",
      [type],
    );
  }

  async getPublished() {
    return queryAll(
      "SELECT * FROM workflow_definitions WHERE status = 'published' ORDER BY name",
    );
  }
})();

export const workflowInstances = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_instances",
      entityType: "workflow_instance",
      searchColumns: ["workflow_name", "order_number"],
      defaultSort: "created_at",
    });
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM workflow_instances WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM workflow_instances WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }

  async getRunning() {
    return queryAll(
      "SELECT * FROM workflow_instances WHERE status IN ('pending','running','retrying') ORDER BY created_at DESC",
    );
  }

  async getRecent(limit = 20) {
    return queryAll(
      "SELECT * FROM workflow_instances ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  }

  async getStats() {
    return queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status IN ('pending','running','retrying')) as running,
        COALESCE(AVG(duration_ms), 0) as avg_duration_ms,
        COALESCE(SUM(retry_count), 0) as total_retries
       FROM workflow_instances WHERE created_at > NOW() - INTERVAL '30 days'`,
    );
  }
})();

export const workflowSteps = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_steps",
      entityType: "workflow_step",
      searchColumns: ["name", "step_type"],
    });
  }

  async getByInstance(instanceId: string) {
    return queryAll(
      "SELECT * FROM workflow_steps WHERE instance_id = $1 ORDER BY order_index ASC",
      [instanceId],
    );
  }

  async getFailed() {
    return queryAll(
      "SELECT * FROM workflow_steps WHERE status = 'failed' ORDER BY created_at DESC LIMIT 50",
    );
  }
})();

export const workflowEvents = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_events",
      entityType: "workflow_event",
      searchColumns: ["event_type", "event_name"],
    });
  }

  async getByInstance(instanceId: string, limit = 100) {
    return queryAll(
      "SELECT * FROM workflow_events WHERE instance_id = $1 ORDER BY created_at DESC LIMIT $2",
      [instanceId, limit],
    );
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM workflow_events WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId],
    );
  }

  async getByCorrelation(correlationId: string) {
    return queryAll(
      "SELECT * FROM workflow_events WHERE correlation_id = $1 ORDER BY created_at",
      [correlationId],
    );
  }
})();

export const workflowQueue = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_queue",
      entityType: "workflow_queue",
      searchColumns: [],
    });
  }

  async getPending(queueName?: string) {
    if (queueName) {
      return queryAll(
        "SELECT * FROM workflow_queue WHERE queue_name = $1 AND status = 'pending' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) ORDER BY priority DESC, created_at ASC",
        [queueName],
      );
    }
    return queryAll(
      "SELECT * FROM workflow_queue WHERE status = 'pending' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) ORDER BY priority DESC, created_at ASC",
    );
  }

  async getDeadLetter() {
    return queryAll(
      "SELECT * FROM workflow_queue WHERE status = 'failed' AND retry_count >= max_retries ORDER BY created_at DESC LIMIT 100",
    );
  }

  async getQueueStats() {
    return queryAll(
      `SELECT queue_name,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'running') as running_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE retry_count >= max_retries) as dead_letter_count
       FROM workflow_queue GROUP BY queue_name ORDER BY queue_name`,
    );
  }
})();

export const workflowHistory = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_history",
      entityType: "workflow_history",
      searchColumns: ["workflow_name", "order_number"],
    });
  }

  async getByWorkflow(workflowId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM workflow_history WHERE workflow_id = $1 ORDER BY created_at DESC LIMIT $2",
      [workflowId, limit],
    );
  }

  async getRecent(limit = 50) {
    return queryAll(
      "SELECT * FROM workflow_history ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  }
})();

export const workflowFailures = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_failures",
      entityType: "workflow_failure",
      searchColumns: [],
    });
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM workflow_failures WHERE order_id = $1 ORDER BY failed_at DESC",
      [orderId],
    );
  }

  async getUnresolved() {
    return queryAll(
      "SELECT * FROM workflow_failures WHERE recovered = false AND compensated = false ORDER BY failed_at DESC",
    );
  }

  async markRecovered(id: string) {
    return queryOne(
      "UPDATE workflow_failures SET recovered = true, recovered_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
  }
})();

export const workflowCompensation = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "workflow_compensation",
      entityType: "workflow_compensation",
      searchColumns: [],
    });
  }

  async getByInstance(instanceId: string) {
    return queryAll(
      "SELECT * FROM workflow_compensation WHERE instance_id = $1 ORDER BY created_at DESC",
      [instanceId],
    );
  }

  async getPending() {
    return queryAll(
      "SELECT * FROM workflow_compensation WHERE status = 'pending' ORDER BY created_at ASC",
    );
  }
})();

/* ================================================================== */
/*  ENTERPRISE SHIPPING & LOGISTICS PLATFORM (PR-5)                    */
/* ================================================================== */

export const shippingCarriers = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipping_carriers",
      entityType: "shipping_carrier",
      searchColumns: ["name", "code", "description"],
    });
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM shipping_carriers WHERE active = true ORDER BY priority ASC",
    );
  }

  async getByCode(code: string) {
    return queryOne("SELECT * FROM shipping_carriers WHERE code = $1", [code]);
  }
})();

export const shippingProfiles = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipping_profiles",
      entityType: "shipping_profile",
      searchColumns: ["name", "description", "carrier_name"],
    });
  }

  async getByCarrier(carrierId: string) {
    return queryAll(
      "SELECT * FROM shipping_profiles WHERE carrier_id = $1 AND active = true ORDER BY method",
      [carrierId],
    );
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM shipping_profiles WHERE active = true ORDER BY base_rate ASC",
    );
  }
})();

export const shippingRates = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipping_rates",
      entityType: "shipping_rate",
      searchColumns: [],
    });
  }

  async getByProfile(profileId: string) {
    return queryAll(
      "SELECT * FROM shipping_rates WHERE profile_id = $1 AND active = true ORDER BY weight_min",
      [profileId],
    );
  }

  async getByZone(zone: string) {
    return queryAll(
      "SELECT * FROM shipping_rates WHERE zone = $1 AND active = true ORDER BY weight_min",
      [zone],
    );
  }
})();

export const shipments = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipments",
      entityType: "shipment",
      searchColumns: ["number", "tracking_number", "customer_name", "order_number"],
    });
  }

  async getByOrder(orderId: string) {
    return queryAll(
      "SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId],
    );
  }

  async getByTracking(trackingNumber: string) {
    return queryOne(
      "SELECT * FROM shipments WHERE tracking_number = $1",
      [trackingNumber],
    );
  }

  async getByStatus(status: string, limit = 50) {
    return queryAll(
      "SELECT * FROM shipments WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }

  async getRecent(limit = 20) {
    return queryAll(
      "SELECT * FROM shipments ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  }

  async getActive() {
    return queryAll(
      "SELECT * FROM shipments WHERE status NOT IN ('delivered', 'cancelled') ORDER BY created_at DESC",
    );
  }
})();

export const shipmentEvents = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipment_events",
      entityType: "shipment_event",
      searchColumns: [],
    });
  }

  async getByShipment(shipmentId: string, limit = 50) {
    return queryAll(
      "SELECT * FROM shipment_events WHERE shipment_id = $1 ORDER BY timestamp DESC LIMIT $2",
      [shipmentId, limit],
    );
  }

  async getByTracking(trackingNumber: string) {
    return queryAll(
      "SELECT * FROM shipment_events WHERE tracking_number = $1 ORDER BY timestamp DESC",
      [trackingNumber],
    );
  }
})();

export const shippingLabels = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipping_labels",
      entityType: "shipping_label",
      searchColumns: [],
    });
  }

  async getByShipment(shipmentId: string) {
    return queryAll(
      "SELECT * FROM shipping_labels WHERE shipment_id = $1 ORDER BY generated_at DESC",
      [shipmentId],
    );
  }
})();

export const deliveryConfirmations = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "delivery_confirmations",
      entityType: "delivery_confirmation",
      searchColumns: ["signature_name", "tracking_number"],
    });
  }

  async getByShipment(shipmentId: string) {
    return queryAll(
      "SELECT * FROM delivery_confirmations WHERE shipment_id = $1 ORDER BY delivered_at DESC",
      [shipmentId],
    );
  }
})();

export const carrierHealth = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "carrier_health",
      entityType: "carrier_health",
      searchColumns: [],
    });
  }

  async getLatest(carrierId: string) {
    return queryOne(
      "SELECT * FROM carrier_health WHERE carrier_id = $1 ORDER BY checked_at DESC LIMIT 1",
      [carrierId],
    );
  }

  async getUnhealthy() {
    return queryAll(
      "SELECT DISTINCT ON (carrier_id) * FROM carrier_health WHERE healthy = false ORDER BY carrier_id, checked_at DESC",
    );
  }
})();

export const shippingRules = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipping_rules",
      entityType: "shipping_rule",
      searchColumns: ["name", "description"],
    });
  }

  async getEnabled() {
    return queryAll(
      "SELECT * FROM shipping_rules WHERE enabled = true ORDER BY priority ASC",
    );
  }
})();

export const shippingQuotes = new (class extends BaseRepository<any> {
  constructor() {
    super({
      tableName: "shipping_quotes",
      entityType: "shipping_quote",
      searchColumns: [],
    });
  }

  async getBySession(sessionId: string) {
    return queryAll(
      "SELECT * FROM shipping_quotes WHERE session_id = $1 ORDER BY total ASC",
      [sessionId],
    );
  }

  async cleanupExpired() {
    return query(
      "DELETE FROM shipping_quotes WHERE expires_at IS NOT NULL AND expires_at < NOW()",
    );
  }
})();
