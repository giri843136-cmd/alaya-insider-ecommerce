/**
 * ALAYA INSIDER — Seed Data Migration
 * --------------------------------------------------------------------------
 * Migrates all seed data from the frontend's in-memory data structures
 * into PostgreSQL. Called once on initial setup.
 *
 * Features:
 *  - Source-agnostic: accepts StoreData-shaped objects
 *  - Batch insertion for performance
 *  - Pre-migration and post-migration row count verification
 *  - No data loss: only inserts if tables are empty
 *  - Error recovery: each entity type is inserted independently
 */

import { query, queryOne, queryAll, withTransaction } from "./index.js";
import { createHash, randomBytes } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { seedShippingCarriers, SHIPPING_TABLES } from "./seed-shipping.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface SeedStoreData {
  products?: any[];
  categories?: any[];
  brands?: any[];
  orders?: any[];
  coupons?: any[];
  articles?: any[];
  customers?: any[];
  questions?: any[];
  suppliers?: any[];
  paymentGateways?: any[];
  returns?: any[];
  redirects?: any[];
  popups?: any[];
  affiliates?: any[];
  loyaltyTiers?: any[];
  liveSales?: any[];
  settings?: any;
}

interface MigrationResult {
  entity: string;
  attempted: number;
  inserted: number;
  skipped: number;
  errors: number;
}

/* ================================================================== */
/*  HELPER FUNCTIONS                                                   */
/* ================================================================== */

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(password + salt).digest("hex");
  return `${salt}:${hash}`;
}

function now(): string {
  return new Date().toISOString();
}

function epochToTimestamp(epoch: number): string {
  return new Date(epoch).toISOString();
}

/** Validate a string is a proper UUID v4 */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function ensureSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* Cache category and brand lookups to avoid repeated DB queries */
let _categoryNameMap: Record<string, string> | null = null;
let _brandNameMap: Record<string, string> | null = null;

async function getCategoryIdByName(name: string): Promise<string | null> {
  if (!_categoryNameMap) {
    _categoryNameMap = {};
    const rows = await queryAll<{ id: string; name: string; slug: string }>(
      "SELECT id, name, slug FROM categories",
    );
    for (const row of rows) {
      _categoryNameMap[row.name.toLowerCase()] = row.id;
      _categoryNameMap[row.slug.toLowerCase()] = row.id;
    }
  }
  return _categoryNameMap[name.toLowerCase()] || null;
}

async function getBrandIdByName(name: string): Promise<string | null> {
  if (!_brandNameMap) {
    _brandNameMap = {};
    const rows = await queryAll<{ id: string; name: string; slug: string }>(
      "SELECT id, name, slug FROM brands",
    );
    for (const row of rows) {
      _brandNameMap[row.name.toLowerCase()] = row.id;
      _brandNameMap[row.slug.toLowerCase()] = row.id;
    }
  }
  return _brandNameMap[name.toLowerCase()] || null;
}

function clearLookupCaches() {
  _categoryNameMap = null;
  _brandNameMap = null;
}

/* ================================================================== */
/*  ENTITY-SPECIFIC INSERT FUNCTIONS                                   */
/* ================================================================== */

async function seedProducts(products: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of (products || [])) {
    try {
      const slug = p.slug || ensureSlug(p.name);
      const existing = await queryOne("SELECT id FROM products WHERE slug = $1", [slug]);
      if (existing) { skipped++; continue; }

      // Always use a proper UUID for the product ID
      const productId = uuidv4();
      
      // Look up category UUID by name/slug instead of using non-UUID string
      const categoryName = p.category || "uncategorized";
      const categoryId = await getCategoryIdByName(categoryName);
      if (!categoryId) {
        console.warn(`[SEED] Skipping product "${p.name}" — no matching category "${categoryName}"`);
        skipped++;
        continue;
      }
      
      // Look up brand UUID by name
      const brandName = p.brand || p.brandId || "";
      const brandId = brandName ? await getBrandIdByName(brandName) : null;
      await query(
        `INSERT INTO products (id, slug, name, brand, brand_id, category_id, type, price, sale_price, cost_price, 
          rating, review_count, images, short_description, description, features, variants, stock, sku, tags,
          barcode, gtin, asin, supplier_id, affiliate, affiliate_url, affiliate_partner, affiliate_network,
          affiliate_commission, featured, best_seller, is_new, coming_soon, preorder, status, reviews, specs,
          created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39)`,
        [
          productId, slug, p.name, p.brand || "", brandId,
          categoryId, p.type || "physical", p.price ?? 0, p.salePrice ?? null, p.costPrice ?? null,
          p.rating ?? 0, p.reviewCount ?? 0, p.images || [], p.shortDescription || "",
          p.description || "", p.features || [], JSON.stringify(p.variants || []),
          p.stock ?? 0, p.sku || "", p.tags || [],
          p.barcode || null, p.gtin || null, p.asin || null, p.supplierId || null,
          p.affiliate ?? false, p.affiliateUrl || null, p.affiliatePartner || null, p.affiliateNetwork || null,
          p.affiliateCommission ?? null, p.featured ?? false, p.bestSeller ?? false,
          p.isNew ?? false, p.comingSoon ?? false, p.preorder ?? false,
          p.status || "published", JSON.stringify(p.reviews || []), JSON.stringify(p.specs || []),
          p.createdAt ? epochToTimestamp(p.createdAt) : now(), now(),
        ],
      );
      inserted++;
    } catch (err) {
      errors++;
      console.error(`[SEED] Error inserting product "${p.name}":`, err);
    }
  }

  return { entity: "products", attempted: products?.length || 0, inserted, skipped, errors };
}

async function seedCategories(categories: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of (categories || [])) {
    try {
      const slug = c.id || ensureSlug(c.name);
      const existing = await queryOne("SELECT id FROM categories WHERE slug = $1", [slug]);
      if (existing) { skipped++; continue; }

          const catId = uuidv4();
      await query(
        `INSERT INTO categories (id, slug, name, tagline, description, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [catId, slug, c.name, c.tagline || "", c.description || "", c.image || "", now(), now()],
      );
      inserted++;
    } catch (err) {
      errors++;
    }
  }

  return { entity: "categories", attempted: categories?.length || 0, inserted, skipped, errors };
}

async function seedBrands(brands: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const b of (brands || [])) {
    try {
      const slug = b.slug || ensureSlug(b.name);
      const existing = await queryOne("SELECT id FROM brands WHERE slug = $1", [slug]);
      if (existing) { skipped++; continue; }

          const brandId = uuidv4();
      await query(
        `INSERT INTO brands (id, slug, name, tagline, description, image, logo, website, instagram, country, featured, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [brandId, slug, b.name, b.tagline || "", b.description || "", b.image || "",
         b.logo || null, b.website || null, b.instagram || null, b.country || "Global",
         b.featured ?? false, now(), now()],
      );
      inserted++;
    } catch (err) {
      errors++;
    }
  }

  return { entity: "brands", attempted: brands?.length || 0, inserted, skipped, errors };
}

async function seedOrders(orders: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const o of (orders || [])) {
    try {
      const existing = await queryOne("SELECT id FROM orders WHERE number = $1", [o.number || "temp"]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO orders (id, number, items, subtotal, discount, shipping, tax, total, currency,
          coupon_code, payment_method, notes, gift_message, tracking_number, courier,
          customer_name, customer_email, customer_phone, customer_address, customer_city, customer_country, customer_zip,
          status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
        [
          o.id || uuidv4(), o.number || `ORD-${Date.now()}`, JSON.stringify(o.items || []),
          o.subtotal ?? 0, o.discount ?? 0, o.shipping ?? 0, o.tax ?? 0, o.total ?? 0, o.currency || "USD",
          o.couponCode || null, o.paymentMethod || null, o.notes || null, o.giftMessage || null,
          o.trackingNumber || null, o.courier || null,
          o.customer?.name || "", o.customer?.email || "", o.customer?.phone || null,
          o.customer?.address || null, o.customer?.city || null, o.customer?.country || null, o.customer?.zip || null,
          o.status || "pending", o.createdAt ? epochToTimestamp(o.createdAt) : now(), now(),
        ],
      );
      inserted++;
    } catch (err) {
      errors++;
    }
  }

  return { entity: "orders", attempted: orders?.length || 0, inserted, skipped, errors };
}

async function seedCoupons(coupons: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of (coupons || [])) {
    try {
      const existing = await queryOne("SELECT id FROM coupons WHERE code = $1", [c.code || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO coupons (id, code, type, value, min_spend, active, description, expires_at, usage_limit, used_count, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          c.id || uuidv4(), c.code || "UNKNOWN", c.type || "percent", c.value ?? 0, c.minSpend ?? 0,
          c.active ?? true, c.description || "", c.expiresAt ? epochToTimestamp(c.expiresAt) : null,
          c.usageLimit ?? null, c.usedCount ?? 0, now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "coupons", attempted: coupons?.length || 0, inserted, skipped, errors };
}

async function seedArticles(articles: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const a of (articles || [])) {
    try {
      const slug = a.slug || ensureSlug(a.title);
      const existing = await queryOne("SELECT id FROM articles WHERE slug = $1", [slug]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO articles (id, slug, title, excerpt, body, cover, author, author_role, category, tags, read_minutes, featured, published_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          a.id || uuidv4(), slug, a.title, a.excerpt || "", JSON.stringify(a.body || []), a.cover || "",
          a.author || "ALAYA Editors", a.authorRole || "Editor", a.category || "Style",
          JSON.stringify(a.tags || []), a.readMinutes ?? 4, a.featured ?? false,
          a.publishedAt ? epochToTimestamp(a.publishedAt) : now(), now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "articles", attempted: articles?.length || 0, inserted, skipped, errors };
}

async function seedCustomers(customers: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of (customers || [])) {
    try {
      const existing = await queryOne("SELECT id FROM customers WHERE email = $1", [c.email || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO customers (id, name, email, password, phone, country, language, status, newsletter, preferences, loyalty_points, store_credit, referral_code, timeline, notes, tasks, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          c.id || uuidv4(), c.name || c.email, c.email, hashPassword(c.password || "password"),
          c.phone || null, c.country || null, c.language || "en", c.status || "active",
          c.newsletter ?? true, JSON.stringify(c.preferences || {}), c.loyaltyPoints ?? 0,
          c.storeCredit ?? 0, c.referralCode || null,
          JSON.stringify(c.timeline || []), JSON.stringify(c.notes || []), JSON.stringify(c.tasks || []),
          c.createdAt ? epochToTimestamp(c.createdAt) : now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "customers", attempted: customers?.length || 0, inserted, skipped, errors };
}

async function seedSuppliers(suppliers: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const s of (suppliers || [])) {
    try {
      const existing = await queryOne("SELECT id FROM suppliers WHERE name = $1", [s.name || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO suppliers (id, name, email, phone, country, priority, active, handling_days, notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          s.id || uuidv4(), s.name, s.email || "", s.phone || null, s.country || "Global",
          s.priority ?? 5, s.active ?? true, s.handlingDays ?? 2, s.notes || null, now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "suppliers", attempted: suppliers?.length || 0, inserted, skipped, errors };
}

async function seedGateways(gateways: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const g of (gateways || [])) {
    try {
      const existing = await queryOne("SELECT id FROM payment_gateways WHERE code = $1", [g.code || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO payment_gateways (id, name, code, mode, active, countries, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          g.id || uuidv4(), g.name, g.code, g.mode || "live", g.active ?? true,
          JSON.stringify(g.countries || []), now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "payment_gateways", attempted: gateways?.length || 0, inserted, skipped, errors };
}

async function seedRetuns(returns: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of (returns || [])) {
    try {
      const existing = await queryOne("SELECT id FROM returns WHERE number = $1", [r.number || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO returns (id, number, order_id, customer_name, customer_email, type, reason, comment, status, refund_amount, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          r.id || uuidv4(), r.number || `RT-${Date.now()}`, r.orderId || "",
          r.customer?.name || "", r.customer?.email || "", r.type || "refund",
          r.reason || "", r.comment || null, r.status || "requested", r.refundAmount ?? null, now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "returns", attempted: returns?.length || 0, inserted, skipped, errors };
}

async function seedRedirects(redirects: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of (redirects || [])) {
    try {
      const existing = await queryOne("SELECT id FROM redirects WHERE from_path = $1", [r.from || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO redirects (id, from_path, to_path, redirect_type, active, hits, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          r.id || uuidv4(), r.from, r.to || "", r.type ?? 301, r.active ?? true, r.hits ?? 0, now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "redirects", attempted: redirects?.length || 0, inserted, skipped, errors };
}

async function seedPopups(popups: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of (popups || [])) {
    try {
      const existing = await queryOne("SELECT id FROM popups WHERE name = $1", [p.name || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO popups (id, name, type, trigger_type, headline, body, cta_label, cta_link, coupon_code, trigger_value, active, views, conversions, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          p.id || uuidv4(), p.name, p.type || "newsletter", p.trigger || "time",
          p.headline || "", p.body || "", p.ctaLabel || "Subscribe", p.ctaLink || null,
          p.couponCode || null, p.triggerValue ?? 15, p.active ?? true, p.views ?? 0, p.conversions ?? 0,
          now(), now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "popups", attempted: popups?.length || 0, inserted, skipped, errors };
}

async function seedAffiliates(affiliates: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const a of (affiliates || [])) {
    try {
      const existing = await queryOne("SELECT id FROM affiliates WHERE name = $1", [a.name || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO affiliates (id, name, url, commission, active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [a.id || uuidv4(), a.name, a.url || "", a.commission ?? 5, a.active ?? true, now(), now()],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "affiliates", attempted: affiliates?.length || 0, inserted, skipped, errors };
}

async function seedLoyalty(tiers: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const t of (tiers || [])) {
    try {
      const existing = await queryOne("SELECT id FROM loyalty_tiers WHERE name = $1", [t.name || ""]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO loyalty_tiers (id, name, min_points, perk, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [t.id || uuidv4(), t.name, t.minPoints ?? 0, t.perk || "", now()],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "loyalty_tiers", attempted: tiers?.length || 0, inserted, skipped, errors };
}

async function seedLiveSales(sales: any[]): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const s of (sales || [])) {
    try {
      await query(
        `INSERT INTO live_sales (id, customer_name, city, country, product_id, minutes_ago, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          s.id || uuidv4(), s.customerName || "Shopper", s.city || "", s.country || "",
          s.productId || null, s.minutesAgo ?? 0, now(),
        ],
      );
      inserted++;
    } catch (err) { errors++; }
  }
  return { entity: "live_sales", attempted: sales?.length || 0, inserted, skipped, errors };
}

async function seedSettings(settings: any): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  if (!settings) return { entity: "settings", attempted: 0, inserted: 0, skipped: 0, errors: 0 };

  try {
    const existing = await queryOne("SELECT id FROM settings WHERE key = $1", ["store_settings"]);
    if (existing) {
      skipped++;
    } else {
      // Flatten settings into a single settings record
      await query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)`,
        ["store_settings", JSON.stringify(settings)],
      );
      inserted++;
    }
  } catch (err) {
    errors++;
  }

  // Also seed feature flags from settings.features
  if (settings.features) {
    for (const [key, enabled] of Object.entries(settings.features)) {
      try {
        const existing = await queryOne("SELECT id FROM feature_flags WHERE key = $1", [key]);
        if (!existing) {
          await query(
            `INSERT INTO feature_flags (key, name, enabled) VALUES ($1, $2, $3)`,
            [key, key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()), enabled],
          );
          inserted++;
        } else {
          skipped++;
        }
      } catch { errors++; }
    }
  }

  return { entity: "settings", attempted: 1 + Object.keys(settings.features || {}).length, inserted, skipped, errors };
}

/* ================================================================== */
/*  AFFILIATE PLATFORM SEED (PR-3)                                    */
/* ================================================================== */

async function seedAffiliateNetworks(seedData: any): Promise<MigrationResult> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const networks = [
    { provider: "amazon_associates", name: "Amazon Associates", description: "Global marketplace with extensive product catalogue", website: "https://associates.amazon.com", docs_url: "https://developer.amazon.com/paapi", cookie_days: 24, min_commission: 1, max_commission: 10, payment_threshold: 10, payment_frequency: "monthly", supports_countries: ["US","GB","DE","FR","JP","CA","IN","IT","ES","AU"], supports_currencies: ["USD","GBP","EUR","JPY","CAD","INR","AUD"], failover_priority: 1, active: true },
    { provider: "impact", name: "Impact Radius", description: "Leading partnership automation platform", website: "https://impact.com", docs_url: "https://developer.impact.com", cookie_days: 30, min_commission: 1, max_commission: 20, payment_threshold: 50, payment_frequency: "monthly", supports_countries: ["US","GB","CA","AU","DE","FR"], supports_currencies: ["USD","GBP","EUR","CAD","AUD"], failover_priority: 2, active: true },
    { provider: "cj", name: "CJ Affiliate", description: "Global affiliate network with premium advertisers", website: "https://www.cj.com", docs_url: "https://developers.cj.com", cookie_days: 30, min_commission: 1, max_commission: 20, payment_threshold: 50, payment_frequency: "monthly", supports_countries: ["US","GB","CA","DE","FR","AU"], supports_currencies: ["USD","GBP","EUR","CAD","AUD"], failover_priority: 3, active: true },
    { provider: "shareasale", name: "ShareASale", description: "Performance-based affiliate marketing network", website: "https://www.shareasale.com", docs_url: "https://wiki.shareasale.com", cookie_days: 30, min_commission: 1, max_commission: 20, payment_threshold: 50, payment_frequency: "monthly", supports_countries: ["US","GB","CA","AU"], supports_currencies: ["USD","GBP","CAD","AUD"], failover_priority: 4, active: true },
    { provider: "rakuten", name: "Rakuten Advertising", description: "Global affiliate network connecting brands with publishers", website: "https://rakutenadvertising.com", docs_url: "https://rakutenadvertising.com/developers", cookie_days: 30, min_commission: 1, max_commission: 20, payment_threshold: 50, payment_frequency: "monthly", supports_countries: ["US","JP","GB","DE","FR"], supports_currencies: ["USD","JPY","GBP","EUR"], failover_priority: 5, active: true },
    { provider: "awin", name: "Awin", description: "Global affiliate network with diverse merchant base", website: "https://www.awin.com", docs_url: "https://wiki.awin.com", cookie_days: 30, min_commission: 1, max_commission: 20, payment_threshold: 50, payment_frequency: "monthly", supports_countries: ["US","GB","DE","FR","ES","IT","NL","SE","AU"], supports_currencies: ["USD","GBP","EUR","SEK","AUD"], failover_priority: 6, active: true },
    { provider: "partnerize", name: "Partnerize", description: "Performance partnership platform for global brands", website: "https://partnerize.com", docs_url: "https://developer.partnerize.com", cookie_days: 30, min_commission: 1, max_commission: 20, payment_threshold: 100, payment_frequency: "net_60", supports_countries: ["US","GB","DE","FR","AU"], supports_currencies: ["USD","GBP","EUR","AUD"], failover_priority: 7, active: true },
  ];

  for (const n of networks) {
    try {
      const existing = await queryOne("SELECT id FROM affiliate_networks WHERE provider = $1", [n.provider]);
      if (existing) { skipped++; continue; }

      const networkId = uuidv4();
      await query(
        `INSERT INTO affiliate_networks (id, provider, name, description, website, docs_url, cookie_days, min_commission, max_commission, payment_threshold, payment_frequency, supports_countries, supports_currencies, failover_priority, active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [networkId, n.provider, n.name, n.description, n.website, n.docs_url, n.cookie_days,
         n.min_commission, n.max_commission, n.payment_threshold, n.payment_frequency,
         JSON.stringify(n.supports_countries), JSON.stringify(n.supports_currencies),
         n.failover_priority, n.active, now(), now()],
      );
      inserted++;

      // Also seed a default account for each network
      const accountId = uuidv4();
      await query(
        `INSERT INTO affiliate_accounts (id, network_id, label, account_id, tracking_id, marketplace, country, status, health_score, active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [accountId, networkId, `${n.name} Default`, `${n.provider}_acc`, `${n.provider}_tracking`, "US", "US", "connected", 100, true, now(), now()],
      );

      // Seed marketplaces for each network (US as primary)
      const countries = n.supports_countries || [];
      for (const country of countries.slice(0, 3)) {
        await query(
          `INSERT INTO affiliate_marketplaces (id, network_id, account_id, country, language, marketplace_code, currency, is_primary, active, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [uuidv4(), networkId, accountId, country, "en", country, country === "JP" ? "JPY" : country === "GB" ? "GBP" : country === "DE" || country === "FR" || country === "ES" || country === "IT" || country === "NL" ? "EUR" : "USD", country === "US", true, now(), now()],
        );
      }
    } catch (err) {
      errors++;
    }
  }

  return { entity: "affiliate_networks", attempted: networks.length, inserted, skipped, errors };
}

async function seedAdminUser(): Promise<MigrationResult> {
  const adminEmail = process.env.ADMIN_EMAIL || "alayainsider@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Alaya@1923";

  try {
    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (existing) {
      return { entity: "admin_user", attempted: 1, inserted: 0, skipped: 1, errors: 0 };
    }

    await query(
      `INSERT INTO users (id, email, password_hash, name, role, is_active, mfa_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(), adminEmail, hashPassword(adminPassword), "ALAYA Admin", "super_admin",
        true, "email_sms",
      ],
    );
    return { entity: "admin_user", attempted: 1, inserted: 1, skipped: 0, errors: 0 };
  } catch (err) {
    return { entity: "admin_user", attempted: 1, inserted: 0, skipped: 0, errors: 1 };
  }
}

/* ================================================================== */
/*  PRE-VERIFICATION                                                   */
/* ================================================================== */

async function getRowsBefore(): Promise<Record<string, number>> {
  const tables = [
    "products", "categories", "brands", "orders", "coupons", "articles",
    "customers", "suppliers", "payment_gateways", "returns", "redirects",
    "popups", "affiliates", "loyalty_tiers", "live_sales", "settings", "users",
    "affiliate_networks", "affiliate_accounts", "affiliate_products",
    "affiliate_links", "affiliate_clicks", "affiliate_conversions",
    "affiliate_commissions", "affiliate_campaigns", "affiliate_marketplaces",
    "affiliate_health_logs", "affiliate_price_history",
    ...SHIPPING_TABLES,
  ];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = Number(result?.count ?? 0);
    } catch {
      counts[table] = 0;
    }
  }
  return counts;
}

/* ================================================================== */
/*  MAIN SEED FUNCTION                                                 */
/* ================================================================== */

export async function runSeedMigration(seedData: SeedStoreData): Promise<{
  results: MigrationResult[];
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  totalRowsMigrated: number;
  success: boolean;
}> {
  console.log("[SEED] Starting data migration...");
  const beforeCounts = await getRowsBefore();

  const results: MigrationResult[] = [];

  // Clear lookup caches before starting
  clearLookupCaches();

  // Run migrations sequentially (some depend on others for FK references)
  results.push(await seedCategories(seedData.categories || []));
  results.push(await seedBrands(seedData.brands || []));
  results.push(await seedProducts(seedData.products || []));
  results.push(await seedSuppliers(seedData.suppliers || []));
  results.push(await seedGateways(seedData.paymentGateways || []));
  results.push(await seedOrders(seedData.orders || []));
  results.push(await seedCoupons(seedData.coupons || []));
  results.push(await seedArticles(seedData.articles || []));
  results.push(await seedCustomers(seedData.customers || []));
  results.push(await seedRetuns(seedData.returns || []));
  results.push(await seedRedirects(seedData.redirects || []));
  results.push(await seedPopups(seedData.popups || []));
  results.push(await seedAffiliates(seedData.affiliates || []));
  results.push(await seedAffiliateNetworks(seedData as any));
  results.push(await seedLoyalty(seedData.loyaltyTiers || []));
  results.push(await seedLiveSales(seedData.liveSales || []));
  results.push(await seedSettings(seedData.settings));
  results.push(await seedShippingCarriers());
  results.push(await seedAdminUser());

  const afterCounts = await getRowsBefore();

  const totalRowsMigrated = results.reduce((sum, r) => sum + r.inserted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const success = totalErrors === 0;

  // Log results
  console.log("\n[SEED] Migration Results:");
  console.log("=".repeat(70));
  console.log(
    `${"Entity".padEnd(20)} ${"Attempted".padEnd(10)} ${"Inserted".padEnd(10)} ${"Skipped".padEnd(10)} ${"Errors".padEnd(10)}`,
  );
  console.log("-".repeat(70));
  for (const r of results) {
    console.log(
      `${r.entity.padEnd(20)} ${String(r.attempted).padEnd(10)} ${String(r.inserted).padEnd(10)} ${String(r.skipped).padEnd(10)} ${String(r.errors).padEnd(10)}`,
    );
  }
  console.log("-".repeat(70));
  console.log(`Total rows migrated: ${totalRowsMigrated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Status: ${success ? "SUCCESS ✅" : "FAILED ❌"}`);

  // Verify no data loss
  console.log("\n[SEED] Data verification:");
  for (const [table, before] of Object.entries(beforeCounts)) {
    const after = afterCounts[table] || 0;
    if (after < before) {
      console.warn(`  ⚠ ${table}: ${before} → ${after} (DATA LOSS!)`);
    } else {
      console.log(`  ✓ ${table}: ${before} → ${after}`);
    }
  }

  return { results, beforeCounts, afterCounts, totalRowsMigrated, success };
}

/* ================================================================== */
/*  CLI ENTRY POINT                                                    */
/* ================================================================== */

async function main() {
  const { waitForDatabase, closePool, getPool } = await import("./index.js");

  const connected = await waitForDatabase();
  if (!connected) {
    console.error("[SEED] Cannot connect to database");
    process.exit(1);
  }

  // Try to load seed data from the frontend if available
  let seedData: SeedStoreData = {};
  try {
    const { createSeedData } = await import("../seed/index.js");
    const store = createSeedData();
    seedData = {
      products: store.products,
      categories: store.categories,
      brands: store.brands,
      orders: store.orders,
      coupons: store.coupons,
      articles: store.articles,
      customers: store.customers,
      suppliers: store.suppliers,
      paymentGateways: store.paymentGateways,
      returns: store.returns,
      redirects: store.redirects,
      popups: store.popups,
      affiliates: store.affiliates,
      loyaltyTiers: store.loyaltyTiers,
      liveSales: store.liveSales,
      settings: store.settings,
    };
    console.log(`[SEED] Loaded seed data: ${seedData.products?.length} products, ${seedData.orders?.length} orders`);
  } catch (err) {
    console.error("[SEED] Could not load seed data:", err);
    process.exit(1);
  }

  try {
    const result = await runSeedMigration(seedData);
    if (!result.success) {
      console.error("[SEED] Migration completed with errors");
      process.exit(1);
    }
  } finally {
    await closePool();
  }
}

const isDirectRun = process.argv[1]?.includes("seed");
if (isDirectRun) {
  main();
}
