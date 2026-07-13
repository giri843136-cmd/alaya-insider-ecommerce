-- ====================================================================
-- ALAYA INSIDER — Performance Optimization Indexes v1.0
-- ====================================================================
-- These indexes are designed for production workloads with 10,000+
-- products, 500+ concurrent users, and sub-100ms query targets.
--
-- Apply with: psql -d your_database -f optimization.sql
-- ====================================================================

-- ====================================================================
--  COMPOSITE INDEXES (multi-column)
-- ====================================================================

-- Product listing: status + created_at (used by ALL list endpoints)
CREATE INDEX IF NOT EXISTS idx_products_status_created
  ON products(status, created_at DESC);

-- Product listing: status + price (used by filtered listings)
CREATE INDEX IF NOT EXISTS idx_products_status_price
  ON products(status, price DESC);

-- Product listing: status + featured (used by homepage)
CREATE INDEX IF NOT EXISTS idx_products_status_featured
  ON products(status, featured DESC) WHERE featured = true AND status = 'published';

-- Product listing: status + best_seller (used by bestseller widgets)
CREATE INDEX IF NOT EXISTS idx_products_status_bestseller
  ON products(status, best_seller DESC) WHERE best_seller = true AND status = 'published';

-- Product listing: category + status (used by category pages)
CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products(category_id, status, created_at DESC);

-- Product listing: brand + status (used by brand pages)
CREATE INDEX IF NOT EXISTS idx_products_brand_status
  ON products(brand_id, status, created_at DESC);

-- Orders: customer + created_at (used by order history)
CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders(customer_id, created_at DESC);

-- Orders: status + created_at (used by admin order management)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

-- Articles: category + published_at (used by journal)
CREATE INDEX IF NOT EXISTS idx_articles_category_published
  ON articles(category, published_at DESC);

-- Articles: featured + published_at (used by homepage)
CREATE INDEX IF NOT EXISTS idx_articles_featured_published
  ON articles(featured, published_at DESC) WHERE featured = true;

-- ====================================================================
--  TRIGRAM INDEXES (fuzzy text search)
-- ====================================================================

-- Product description search (for ILIKE fallback and full-text ranking)
CREATE INDEX IF NOT EXISTS idx_products_description_trgm
  ON products USING gin(description gin_trgm_ops);

-- Product features search
CREATE INDEX IF NOT EXISTS idx_products_features_trgm
  ON products USING gin(array_to_string(features, ' ') gin_trgm_ops);

-- Article body search
CREATE INDEX IF NOT EXISTS idx_articles_body_trgm
  ON articles USING gin(array_to_string(body, ' ') gin_trgm_ops);

-- Category description search
CREATE INDEX IF NOT EXISTS idx_categories_description_trgm
  ON categories USING gin(description gin_trgm_ops);

-- Brand description search
CREATE INDEX IF NOT EXISTS idx_brands_description_trgm
  ON brands USING gin(description gin_trgm_ops);

-- Supplier name search
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm
  ON suppliers USING gin(name gin_trgm_ops);

-- Customer name search
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
  ON customers USING gin(name gin_trgm_ops);

-- ====================================================================
--  FULL-TEXT SEARCH INDEXES (PostgreSQL tsvector)
-- ====================================================================

-- Product full-text search (name, description, brand, features, tags)
CREATE INDEX IF NOT EXISTS idx_products_fts
  ON products USING gin(to_tsvector('english', coalesce(name, '') || ' ' ||
    coalesce(short_description, '') || ' ' || coalesce(brand, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    coalesce(description, '')));

-- Article full-text search
CREATE INDEX IF NOT EXISTS idx_articles_fts
  ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' ||
    coalesce(excerpt, '') || ' ' || coalesce(array_to_string(body, ' '), '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce(author, '')));

-- Category full-text search
CREATE INDEX IF NOT EXISTS idx_categories_fts
  ON categories USING gin(to_tsvector('english', coalesce(name, '') || ' ' ||
    coalesce(tagline, '') || ' ' || coalesce(description, '')));

-- Brand full-text search
CREATE INDEX IF NOT EXISTS idx_brands_fts
  ON brands USING gin(to_tsvector('english', coalesce(name, '') || ' ' ||
    coalesce(tagline, '') || ' ' || coalesce(description, '')));

-- ====================================================================
--  PARTIAL INDEXES (for filtered queries)
-- ====================================================================

-- Only published products (used by 90% of storefront queries)
CREATE INDEX IF NOT EXISTS idx_products_published_only
  ON products(created_at DESC) WHERE status = 'published';

-- Products with stock (for in-stock filtering)
CREATE INDEX IF NOT EXISTS idx_products_in_stock
  ON products(price) WHERE stock > 0 AND status = 'published';

-- Active coupons (for coupon validation)
CREATE INDEX IF NOT EXISTS idx_coupons_active_valid
  ON coupons(code) WHERE active = true AND (expires_at IS NULL OR expires_at > NOW());

-- Active popups (for popup engine)
CREATE INDEX IF NOT EXISTS idx_popups_active_targeted
  ON popups(trigger_type) WHERE active = true;

-- Active redirects (for redirect engine)
CREATE INDEX IF NOT EXISTS idx_redirects_active_path
  ON redirects(from_path) WHERE active = true;

-- ====================================================================
--  COVERING INDEXES (for common queries to avoid heap lookups)
-- ====================================================================

-- Product list preview (covers the most common SELECT columns)
CREATE INDEX IF NOT EXISTS idx_products_list_preview
  ON products(id, slug, name, price, sale_price, images, stock, status, created_at DESC)
  WHERE status = 'published';

-- Order list preview
CREATE INDEX IF NOT EXISTS idx_orders_list_preview
  ON orders(id, number, customer_name, customer_email, total, status, created_at DESC);

-- ====================================================================
--  ANALYZE UPDATED STATISTICS
-- ====================================================================

ANALYZE products;
ANALYZE categories;
ANALYZE brands;
ANALYZE orders;
ANALYZE customers;
ANALYZE articles;
ANALYZE coupons;
