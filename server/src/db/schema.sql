-- ====================================================================
-- ALAYA INSIDER — PostgreSQL Schema v1.0
-- ====================================================================
-- Complete normalized schema for the enterprise platform.
-- All tables use UUID primary keys with foreign key enforcement.
-- Timestamps use TIMESTAMPTZ for timezone-aware storage.
-- ====================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ====================================================================
--  USERS & AUTHENTICATION
-- ====================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_method VARCHAR(20) DEFAULT 'email_sms',
  totp_secret VARCHAR(255) DEFAULT '',
  totp_verified BOOLEAN DEFAULT false,
  totp_backup_codes TEXT[] DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) NOT NULL,
  refresh_token VARCHAR(512),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_device_fingerprint ON trusted_devices(device_fingerprint);

CREATE TABLE IF NOT EXISTS recovery_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON recovery_codes(user_id);

-- OAuth Accounts (Google/Apple social login)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) DEFAULT '',
  avatar TEXT DEFAULT '',
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_unique ON oauth_accounts(provider, provider_id);

-- OTP Codes (verified OTPs expire after TTL, cleaned automatically)
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  mobile VARCHAR(50) DEFAULT '',
  otp_hash VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'email',
  purpose VARCHAR(50) NOT NULL DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  used BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  ip_address VARCHAR(45) DEFAULT '',
  user_agent TEXT DEFAULT '',
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_used ON otps(used) WHERE used = false;

-- ====================================================================
--  CATALOG
-- ====================================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image VARCHAR(500) DEFAULT '',
  logo VARCHAR(500),
  website VARCHAR(500),
  instagram VARCHAR(500),
  country VARCHAR(100) DEFAULT 'Global',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_featured ON brands(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands USING gin(name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image VARCHAR(500) DEFAULT '',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories USING gin(name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  brand VARCHAR(255) DEFAULT '',
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL DEFAULT 'physical',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  rating DECIMAL(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  features TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]',
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  barcode VARCHAR(100),
  gtin VARCHAR(100),
  asin VARCHAR(100),
  supplier_id VARCHAR(100),
  affiliate BOOLEAN DEFAULT false,
  affiliate_url VARCHAR(500),
  affiliate_partner VARCHAR(255),
  affiliate_network VARCHAR(255),
  affiliate_commission DECIMAL(5,2),
  featured BOOLEAN DEFAULT false,
  best_seller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  coming_soon BOOLEAN DEFAULT false,
  preorder BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'published',
  reviews JSONB DEFAULT '[]',
  specs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller) WHERE best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id, sort_order);

-- ====================================================================
--  ORDERS & CHECKOUT
-- ====================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(50),
  country VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  newsletter BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  loyalty_points INTEGER DEFAULT 0,
  store_credit DECIMAL(12,2) DEFAULT 0,
  referral_code VARCHAR(100),
  timeline JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  tasks JSONB DEFAULT '[]',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(100) DEFAULT 'Home',
  name VARCHAR(255) NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  coupon_code VARCHAR(100),
  payment_method VARCHAR(100),
  notes TEXT,
  gift_message TEXT,
  supplier_id VARCHAR(100),
  tracking_number VARCHAR(255),
  courier VARCHAR(100),
  estimated_delivery TIMESTAMPTZ,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  customer_email VARCHAR(255) NOT NULL DEFAULT '',
  customer_phone VARCHAR(50),
  customer_address TEXT,
  customer_city VARCHAR(100),
  customer_country VARCHAR(100),
  customer_zip VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_total ON orders(total);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name VARCHAR(500) NOT NULL,
  image VARCHAR(500) DEFAULT '',
  variant JSONB DEFAULT '{}',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ====================================================================
--  RETURNS & REFUNDS
-- ====================================================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  customer_email VARCHAR(255) NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'refund',
  reason TEXT NOT NULL DEFAULT '',
  comment TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'requested',
  refund_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_number ON returns(number);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  payment_method VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_return_id ON refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);

-- ====================================================================
--  COUPONS & DISCOUNTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'percent',
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_spend DECIMAL(12,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  description TEXT DEFAULT '',
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

-- ====================================================================
--  CONTENT & JOURNAL
-- ====================================================================

CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'Editor',
  avatar VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT DEFAULT '',
  body TEXT[] DEFAULT '{}',
  cover VARCHAR(500) DEFAULT '',
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  author VARCHAR(255) DEFAULT 'ALAYA Editors',
  author_role VARCHAR(100) DEFAULT 'Editor',
  category VARCHAR(100) DEFAULT 'Style',
  tags TEXT[] DEFAULT '{}',
  read_minutes INTEGER DEFAULT 4,
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING gin(tags);

-- ====================================================================
--  QUESTIONS & ANSWERS
-- ====================================================================

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by VARCHAR(255),
  helpful INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT false,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_product_id ON questions(product_id);
CREATE INDEX IF NOT EXISTS idx_questions_pinned ON questions(pinned) WHERE pinned = true;

-- ====================================================================
--  SUPPLIERS
-- ====================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Global',
  priority INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT true,
  handling_days INTEGER DEFAULT 2,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_priority ON suppliers(priority);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers USING gin(name gin_trgm_ops);

-- ====================================================================
--  PAYMENT GATEWAYS
-- ====================================================================

CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  mode VARCHAR(20) DEFAULT 'live',
  active BOOLEAN DEFAULT true,
  countries TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_gateways_code ON payment_gateways(code);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(active) WHERE active = true;

-- ====================================================================
--  REDIRECTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_path VARCHAR(500) NOT NULL,
  to_path VARCHAR(500) NOT NULL DEFAULT '',
  redirect_type INTEGER DEFAULT 301,
  active BOOLEAN DEFAULT true,
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redirects_from_path ON redirects(from_path);
CREATE INDEX IF NOT EXISTS idx_redirects_active ON redirects(active) WHERE active = true;

-- ====================================================================
--  POPUPS
-- ====================================================================

CREATE TABLE IF NOT EXISTS popups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'newsletter',
  trigger_type VARCHAR(50) DEFAULT 'time',
  headline TEXT DEFAULT '',
  body TEXT DEFAULT '',
  cta_label VARCHAR(255) DEFAULT 'Subscribe',
  cta_link VARCHAR(500),
  coupon_code VARCHAR(100),
  trigger_value INTEGER DEFAULT 15,
  active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popups_active ON popups(active) WHERE active = true;

-- ====================================================================
--  AFFILIATES
-- ====================================================================

-- ====================================================================
--  AFFILIATE PLATFORM (PR-3)
-- ====================================================================

-- Affiliate Networks (provider definitions)
CREATE TABLE IF NOT EXISTS affiliate_networks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  website VARCHAR(500) DEFAULT '',
  docs_url VARCHAR(500),
  logo VARCHAR(500),
  active BOOLEAN DEFAULT true,
  cookie_days INTEGER DEFAULT 30,
  min_commission DECIMAL(5,2) DEFAULT 0,
  max_commission DECIMAL(5,2) DEFAULT 20,
  payment_threshold DECIMAL(12,2) DEFAULT 50,
  payment_frequency VARCHAR(50) DEFAULT 'monthly',
  supports_countries TEXT[] DEFAULT '{}',
  supports_currencies TEXT[] DEFAULT '{}',
  supports_verticals TEXT[] DEFAULT '{}',
  failover_priority INTEGER DEFAULT 10,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_networks_active ON affiliate_networks(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_networks_provider ON affiliate_networks(provider);

-- Affiliate Accounts (credentials per provider)
CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES affiliate_networks(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) DEFAULT '',
  tracking_id VARCHAR(255),
  store_id VARCHAR(255),
  api_key_encrypted TEXT DEFAULT '',
  api_secret_encrypted TEXT DEFAULT '',
  access_token_encrypted TEXT DEFAULT '',
  refresh_token_encrypted TEXT DEFAULT '',
  token_expires_at TIMESTAMPTZ,
  credentials JSONB DEFAULT '{}',
  marketplace VARCHAR(100) DEFAULT 'US',
  country VARCHAR(10) DEFAULT 'US',
  language VARCHAR(10) DEFAULT 'en',
  commission_rules JSONB DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'connected',
  health_score INTEGER DEFAULT 100,
  last_sync_at TIMESTAMPTZ,
  sync_interval_minutes INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_network_id ON affiliate_accounts(network_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_active ON affiliate_accounts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_status ON affiliate_accounts(status);

-- Affiliate Products (product → provider mapping)
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  network_id UUID NOT NULL REFERENCES affiliate_networks(id) ON DELETE CASCADE,
  provider_product_id VARCHAR(255),
  affiliate_url TEXT DEFAULT '',
  deep_link_url TEXT,
  short_url TEXT,
  price DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_type VARCHAR(50) DEFAULT 'percentage',
  cookie_days INTEGER DEFAULT 30,
  in_stock BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  is_primary BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_product_id ON affiliate_products(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_account_id ON affiliate_products(account_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_active ON affiliate_products(active) WHERE active = true;

-- Affiliate Links (deep link management with geo/device/language rules)
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID,
  account_id UUID REFERENCES affiliate_accounts(id) ON DELETE SET NULL,
  network_id UUID REFERENCES affiliate_networks(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  cloaked_url TEXT,
  short_url TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'smart',
  default_url TEXT NOT NULL,
  geo_rules JSONB DEFAULT '[]',
  device_rules JSONB DEFAULT '[]',
  language_rules JSONB DEFAULT '[]',
  currency_rules JSONB DEFAULT '[]',
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255) DEFAULT 'affiliate',
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON affiliate_links(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_account_id ON affiliate_links(account_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(active) WHERE active = true;

-- Affiliate Clicks
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  product_id UUID,
  account_id UUID,
  network_id UUID,
  customer_id UUID,
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  country VARCHAR(10),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  user_agent TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_id UUID,
  conversion_value DECIMAL(12,2),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_id ON affiliate_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_id ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_country ON affiliate_clicks(country);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_converted ON affiliate_clicks(converted) WHERE converted = true;

-- Affiliate Conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  product_id UUID,
  account_id UUID,
  network_id UUID,
  customer_id UUID,
  order_id UUID,
  order_number VARCHAR(255),
  sale_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_type VARCHAR(50) DEFAULT 'percentage',
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  epc DECIMAL(12,2) DEFAULT 0,
  aov DECIMAL(12,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_click_id ON affiliate_conversions(click_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_order_id ON affiliate_conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_account_id ON affiliate_conversions(account_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_converted_at ON affiliate_conversions(converted_at DESC);

-- Affiliate Commissions
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversion_id UUID REFERENCES affiliate_conversions(id) ON DELETE SET NULL,
  account_id UUID,
  network_id UUID,
  product_id UUID,
  order_id UUID,
  order_number VARCHAR(255),
  sale_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
  tier VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_account_id ON affiliate_commissions(account_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order_id ON affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created_at ON affiliate_commissions(created_at DESC);

-- Affiliate Campaigns
CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  account_id UUID REFERENCES affiliate_accounts(id) ON DELETE SET NULL,
  network_id UUID REFERENCES affiliate_networks(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'standard',
  budget DECIMAL(12,2) DEFAULT 0,
  spent DECIMAL(12,2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  click_goal INTEGER DEFAULT 1000,
  conversion_goal INTEGER DEFAULT 50,
  revenue_goal DECIMAL(12,2) DEFAULT 10000,
  utm_campaign VARCHAR(255),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_account_id ON affiliate_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_status ON affiliate_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_active ON affiliate_campaigns(active) WHERE active = true;

-- Affiliate Marketplaces (geo routing table)
CREATE TABLE IF NOT EXISTS affiliate_marketplaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES affiliate_networks(id) ON DELETE CASCADE,
  account_id UUID REFERENCES affiliate_accounts(id) ON DELETE SET NULL,
  country VARCHAR(10) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  marketplace_code VARCHAR(100) NOT NULL,
  marketplace_url VARCHAR(500),
  tracking_id VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'USD',
  commission_rate DECIMAL(5,2),
  is_primary BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_marketplaces_network_id ON affiliate_marketplaces(network_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_marketplaces_country ON affiliate_marketplaces(country);
CREATE INDEX IF NOT EXISTS idx_affiliate_marketplaces_active ON affiliate_marketplaces(active) WHERE active = true;

-- Affiliate Health Logs
CREATE TABLE IF NOT EXISTS affiliate_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  status_code INTEGER DEFAULT 0,
  healthy BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER DEFAULT 0,
  redirect_chain TEXT[],
  ssl_valid BOOLEAN DEFAULT false,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_health_logs_link_id ON affiliate_health_logs(link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_health_logs_healthy ON affiliate_health_logs(healthy);
CREATE INDEX IF NOT EXISTS idx_affiliate_health_logs_checked_at ON affiliate_health_logs(checked_at DESC);

-- Affiliate Price History
CREATE TABLE IF NOT EXISTS affiliate_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  account_id UUID REFERENCES affiliate_accounts(id) ON DELETE SET NULL,
  network_id UUID REFERENCES affiliate_networks(id) ON DELETE SET NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  previous_price DECIMAL(12,2),
  price_change DECIMAL(12,2),
  price_change_percent DECIMAL(5,2),
  in_stock BOOLEAN DEFAULT true,
  stock_level INTEGER,
  url TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_price_history_product_id ON affiliate_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_price_history_recorded_at ON affiliate_price_history(recorded_at DESC);

-- ====================================================================
--  ENTERPRISE SUPPLIER & FULFILLMENT PLATFORM (PR-4)
-- ====================================================================

-- Supplier Accounts (extended supplier profiles)
CREATE TABLE IF NOT EXISTS supplier_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) DEFAULT 'manufacturer',
  contact_person VARCHAR(255) DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(100),
  whatsapp VARCHAR(100),
  website VARCHAR(500),
  portal_url VARCHAR(500),
  country VARCHAR(100) DEFAULT 'Global',
  state VARCHAR(100),
  city VARCHAR(100),
  warehouse_address TEXT,
  return_address TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  business_hours VARCHAR(255) DEFAULT '9:00 AM - 6:00 PM',
  avg_processing_days INTEGER DEFAULT 2,
  avg_delivery_days INTEGER DEFAULT 5,
  moq INTEGER DEFAULT 1,
  max_daily_capacity INTEGER DEFAULT 500,
  shipping_countries TEXT[] DEFAULT '{}',
  supported_carriers TEXT[] DEFAULT '{}',
  preferred_carrier VARCHAR(100),
  insurance_available BOOLEAN DEFAULT false,
  tracking_supported BOOLEAN DEFAULT true,
  returns_accepted BOOLEAN DEFAULT true,
  return_policy TEXT,
  replacement_policy TEXT,
  payment_terms VARCHAR(255) DEFAULT 'Net 30',
  tax_details TEXT,
  documents TEXT[] DEFAULT '{}',
  contracts JSONB DEFAULT '[]',
  certificates TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  priority INTEGER DEFAULT 5,
  is_primary BOOLEAN DEFAULT false,
  is_backup BOOLEAN DEFAULT false,
  api_endpoint VARCHAR(500),
  api_type VARCHAR(50) DEFAULT 'rest',
  auth_type VARCHAR(50) DEFAULT 'api_key',
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  bearer_token_encrypted TEXT,
  oauth_token_encrypted TEXT,
  oauth_refresh_encrypted TEXT,
  webhook_url VARCHAR(500),
  webhook_secret_encrypted TEXT,
  email_template VARCHAR(255),
  csv_mapping JSONB DEFAULT '{}',
  retry_max INTEGER DEFAULT 3,
  retry_backoff_ms INTEGER DEFAULT 5000,
  rate_limit INTEGER DEFAULT 60,
  timeout_ms INTEGER DEFAULT 30000,
  health_check_url VARCHAR(500),
  health_check_interval INTEGER DEFAULT 5,
  automation_capable BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_accounts_supplier_id ON supplier_accounts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_accounts_active ON supplier_accounts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_supplier_accounts_country ON supplier_accounts(country);
CREATE INDEX IF NOT EXISTS idx_supplier_accounts_status ON supplier_accounts(status);
CREATE INDEX IF NOT EXISTS idx_supplier_accounts_priority ON supplier_accounts(priority);

-- Supplier Products (product-supplier mapping)
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  supplier_sku VARCHAR(255),
  supplier_product_url TEXT,
  supplier_product_id VARCHAR(255),
  supplier_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  stock INTEGER DEFAULT 0,
  warehouse VARCHAR(255),
  lead_time_days INTEGER DEFAULT 5,
  min_qty INTEGER DEFAULT 1,
  max_qty INTEGER DEFAULT 50,
  supplier_margin DECIMAL(5,2) DEFAULT 0,
  weight_kg DECIMAL(8,2),
  dimensions JSONB DEFAULT '{}',
  supplier_images TEXT[] DEFAULT '{}',
  supplier_variants JSONB DEFAULT '[]',
  is_preferred BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 5,
  is_backup BOOLEAN DEFAULT false,
  automatic_failover BOOLEAN DEFAULT false,
  sync_status VARCHAR(50) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_product_id ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_account_id ON supplier_products(account_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_active ON supplier_products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_supplier_products_sync_status ON supplier_products(sync_status);

-- Supplier Orders (per-supplier order tracking)
CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID,
  order_number VARCHAR(255),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  purchase_order_id UUID,
  purchase_order_number VARCHAR(255),
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  supplier_order_id VARCHAR(255),
  supplier_status VARCHAR(255),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  carrier VARCHAR(100),
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  sent_method VARCHAR(50),
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_orders_order_id ON supplier_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_id ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_purchase_order_id ON supplier_orders(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders(created_at DESC);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  order_id UUID,
  order_number VARCHAR(255),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  supplier_order_id VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  customer_name VARCHAR(255),
  customer_address TEXT,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  shipping_method VARCHAR(100),
  warehouse VARCHAR(255),
  expected_delivery TIMESTAMPTZ,
  order_notes TEXT,
  packing_notes TEXT,
  barcode VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  carrier VARCHAR(100),
  sent_method VARCHAR(50),
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by VARCHAR(255) DEFAULT 'Automation Engine',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id ON purchase_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at DESC);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_name VARCHAR(500) NOT NULL,
  product_sku VARCHAR(255),
  image VARCHAR(500),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);

-- Supplier Sync Jobs
CREATE TABLE IF NOT EXISTS supplier_sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  interval_minutes INTEGER DEFAULT 60,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_jobs_supplier_id ON supplier_sync_jobs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_jobs_status ON supplier_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_jobs_type ON supplier_sync_jobs(type);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_jobs_next_sync_at ON supplier_sync_jobs(next_sync_at);

-- Supplier Inventory (snapshots from suppliers)
CREATE TABLE IF NOT EXISTS supplier_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  product_id UUID NOT NULL,
  supplier_product_id UUID REFERENCES supplier_products(id) ON DELETE SET NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  available INTEGER DEFAULT 0,
  price DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  warehouse VARCHAR(255),
  lead_time_days INTEGER,
  in_stock BOOLEAN DEFAULT true,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_inventory_supplier_id ON supplier_inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_inventory_product_id ON supplier_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_inventory_snapshot_at ON supplier_inventory(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_inventory_available ON supplier_inventory(available);

-- Supplier Tracking
CREATE TABLE IF NOT EXISTS supplier_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  order_id UUID,
  order_number VARCHAR(255),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_number VARCHAR(255),
  tracking_number VARCHAR(255) NOT NULL,
  carrier VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  origin_country VARCHAR(100),
  destination_country VARCHAR(100),
  last_event TEXT,
  events JSONB DEFAULT '[]',
  raw_data JSONB,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_tracking_tracking_number ON supplier_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_supplier_tracking_order_id ON supplier_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tracking_purchase_order_id ON supplier_tracking(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tracking_status ON supplier_tracking(status);
CREATE INDEX IF NOT EXISTS idx_supplier_tracking_supplier_id ON supplier_tracking(supplier_id);

-- Supplier Returns (returns to suppliers)
CREATE TABLE IF NOT EXISTS supplier_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  order_id UUID,
  order_number VARCHAR(255),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_number VARCHAR(255),
  customer_return_id UUID,
  items JSONB DEFAULT '[]',
  reason TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'refund',
  status VARCHAR(50) NOT NULL DEFAULT 'requested',
  rma_number VARCHAR(255),
  return_label_url TEXT,
  warehouse VARCHAR(255),
  inspection_notes TEXT,
  refund_amount DECIMAL(12,2),
  replacement_order_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_returns_supplier_id ON supplier_returns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_order_id ON supplier_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_status ON supplier_returns(status);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_number ON supplier_returns(number);

-- Supplier Ratings
CREATE TABLE IF NOT EXISTS supplier_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50) NOT NULL,
  review TEXT,
  order_id UUID,
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier_id ON supplier_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_category ON supplier_ratings(category);

-- Supplier Health
CREATE TABLE IF NOT EXISTS supplier_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  healthy BOOLEAN NOT NULL DEFAULT true,
  api_status VARCHAR(50) DEFAULT 'up',
  api_latency_ms INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_health_supplier_id ON supplier_health(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_health_healthy ON supplier_health(healthy);
CREATE INDEX IF NOT EXISTS idx_supplier_health_checked_at ON supplier_health(checked_at DESC);

-- Supplier Logs (audit trail for all supplier automation actions)
CREATE TABLE IF NOT EXISTS supplier_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  order_id UUID,
  order_number VARCHAR(255),
  purchase_order_id UUID,
  po_number VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'info',
  details TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_logs_supplier_id ON supplier_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_logs_order_id ON supplier_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_logs_purchase_order_id ON supplier_logs(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_logs_action ON supplier_logs(action);
CREATE INDEX IF NOT EXISTS idx_supplier_logs_created_at ON supplier_logs(created_at DESC);

-- Supplier Scorecard (calculated performance metrics)
CREATE TABLE IF NOT EXISTS supplier_scorecard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  fulfillment_rate DECIMAL(5,2) DEFAULT 100,
  delivery_speed_score DECIMAL(5,2) DEFAULT 100,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  return_rate DECIMAL(5,2) DEFAULT 0,
  defect_rate DECIMAL(5,2) DEFAULT 0,
  communication_score DECIMAL(5,2) DEFAULT 100,
  api_uptime DECIMAL(5,2) DEFAULT 100,
  avg_rating DECIMAL(3,1) DEFAULT 5,
  cost_score DECIMAL(5,2) DEFAULT 100,
  margin_score DECIMAL(5,2) DEFAULT 100,
  health_score DECIMAL(5,2) DEFAULT 100,
  rank INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  failed_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(14,2) DEFAULT 0,
  total_profit DECIMAL(14,2) DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_scorecard_supplier_id ON supplier_scorecard(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_scorecard_rank ON supplier_scorecard(rank);
CREATE INDEX IF NOT EXISTS idx_supplier_scorecard_health_score ON supplier_scorecard(health_score DESC);

-- Warehouse Inventory
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id VARCHAR(100) NOT NULL,
  warehouse_name VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL,
  product_name VARCHAR(500),
  product_sku VARCHAR(100),
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  incoming INTEGER DEFAULT 0,
  damaged INTEGER DEFAULT 0,
  returned INTEGER DEFAULT 0,
  transit INTEGER DEFAULT 0,
  total_stock INTEGER GENERATED ALWAYS AS (available + reserved + incoming + transit) STORED,
  low_stock_threshold INTEGER DEFAULT 10,
  reorder_point INTEGER DEFAULT 20,
  reorder_qty INTEGER DEFAULT 50,
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse_id ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product_id ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_available ON warehouse_inventory(available);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wh_inventory_wh_product ON warehouse_inventory(warehouse_id, product_id);

-- Warehouse Transfers (stock movement between warehouses)
CREATE TABLE IF NOT EXISTS warehouse_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  from_warehouse VARCHAR(100) NOT NULL,
  to_warehouse VARCHAR(100) NOT NULL,
  product_id UUID NOT NULL,
  product_name VARCHAR(500),
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  initiated_by VARCHAR(255),
  approved_by VARCHAR(255),
  received_by VARCHAR(255),
  notes TEXT,
  dispatched_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_from_warehouse ON warehouse_transfers(from_warehouse);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_to_warehouse ON warehouse_transfers(to_warehouse);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_product_id ON warehouse_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_status ON warehouse_transfers(status);

-- ====================================================================
--  ENTERPRISE SHIPPING & LOGISTICS PLATFORM (PR-5)
-- ====================================================================

-- Shipping Carriers
CREATE TABLE IF NOT EXISTS shipping_carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  website VARCHAR(500),
  api_docs_url VARCHAR(500),
  logo VARCHAR(500),
  active BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT false,
  insurance_available BOOLEAN DEFAULT true,
  tracking_url_template VARCHAR(500),
  supported_services TEXT[] DEFAULT '{}',
  supported_countries TEXT[] DEFAULT '{}',
  max_weight_kg DECIMAL(8,2) DEFAULT 70,
  max_dimensions JSONB DEFAULT '{}',
  api_endpoint VARCHAR(500),
  auth_type VARCHAR(50) DEFAULT 'api_key',
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  account_number VARCHAR(255),
  webhook_url VARCHAR(500),
  webhook_secret_encrypted TEXT,
  rate_limit INTEGER DEFAULT 100,
  timeout_ms INTEGER DEFAULT 30000,
  health_check_url VARCHAR(500),
  config JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_carriers_active ON shipping_carriers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON shipping_carriers(code);

-- Shipping Profiles (rate profiles / service offerings)
CREATE TABLE IF NOT EXISTS shipping_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL,
  carrier_name VARCHAR(255),
  service_code VARCHAR(100) NOT NULL,
  method VARCHAR(50) NOT NULL DEFAULT 'standard',
  base_rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  rate_per_kg DECIMAL(12,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(12,2) DEFAULT 0,
  estimated_days_min INTEGER DEFAULT 3,
  estimated_days_max INTEGER DEFAULT 8,
  tracking_required BOOLEAN DEFAULT true,
  signature_required BOOLEAN DEFAULT false,
  insurance_included BOOLEAN DEFAULT false,
  max_weight_kg DECIMAL(8,2),
  zones JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_profiles_active ON shipping_profiles(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_profiles_carrier_id ON shipping_profiles(carrier_id);

-- Shipping Rates (rate cards)
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES shipping_profiles(id) ON DELETE SET NULL,
  carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL,
  zone VARCHAR(100) DEFAULT 'domestic',
  weight_min DECIMAL(8,2) DEFAULT 0,
  weight_max DECIMAL(8,2) DEFAULT 70,
  base_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_per_kg DECIMAL(12,2) DEFAULT 0,
  fuel_surcharge DECIMAL(5,2) DEFAULT 0,
  handling_fee DECIMAL(12,2) DEFAULT 0,
  transit_days_min INTEGER DEFAULT 1,
  transit_days_max INTEGER DEFAULT 10,
  active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_profile_id ON shipping_rates(profile_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone ON shipping_rates(zone);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(active) WHERE active = true;

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  order_id UUID,
  order_number VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  address_name VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_zip VARCHAR(20),
  address_country VARCHAR(100),
  carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL,
  carrier_name VARCHAR(255),
  profile_id UUID REFERENCES shipping_profiles(id) ON DELETE SET NULL,
  service_code VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  weight_kg DECIMAL(8,2),
  length_cm DECIMAL(8,2),
  width_cm DECIMAL(8,2),
  height_cm DECIMAL(8,2),
  declared_value DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  shipping_cost DECIMAL(12,2),
  insurance_cost DECIMAL(12,2),
  fuel_surcharge DECIMAL(12,2),
  tax DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  label_url TEXT,
  label_format VARCHAR(20) DEFAULT 'pdf',
  packing_slip_url TEXT,
  invoice_url TEXT,
  customs_docs_url TEXT,
  cn22_url TEXT,
  cn23_url TEXT,
  return_label_url TEXT,
  commercial_invoice_url TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  signature_name VARCHAR(255),
  signature_image_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_number ON shipments(number);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);

-- Shipment Items
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  product_id UUID,
  product_name VARCHAR(500) NOT NULL,
  product_sku VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(8,2),
  declared_value DECIMAL(12,2),
  hs_code VARCHAR(20),
  origin_country VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON shipment_items(shipment_id);

-- Shipment Events (tracking)
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  tracking_number VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_tracking_number ON shipment_events(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_events_status ON shipment_events(status);
CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp ON shipment_events(timestamp DESC);

-- Shipping Labels
CREATE TABLE IF NOT EXISTS shipping_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'shipping',
  format VARCHAR(20) DEFAULT 'pdf',
  url TEXT NOT NULL,
  size VARCHAR(50) DEFAULT '4x6',
  pages INTEGER DEFAULT 1,
  file_size_bytes BIGINT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_labels_shipment_id ON shipping_labels(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_type ON shipping_labels(type);

-- Delivery Confirmations (proof of delivery)
CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  tracking_number VARCHAR(255) NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL,
  signature_name VARCHAR(255),
  signature_image_url TEXT,
  photo_url TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  left_at VARCHAR(100),
  received_by VARCHAR(255),
  notes TEXT,
  carrier_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_shipment_id ON delivery_confirmations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_tracking_number ON delivery_confirmations(tracking_number);

-- Carrier Health
CREATE TABLE IF NOT EXISTS carrier_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL,
  carrier_code VARCHAR(100) NOT NULL,
  healthy BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(50) DEFAULT 'up',
  latency_ms INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_health_carrier_id ON carrier_health(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_health_healthy ON carrier_health(healthy);
CREATE INDEX IF NOT EXISTS idx_carrier_health_checked_at ON carrier_health(checked_at DESC);

-- Shipping Rules (rule engine for free shipping, weight-based, etc.)
CREATE TABLE IF NOT EXISTS shipping_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  rule_type VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rules_rule_type ON shipping_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_enabled ON shipping_rules(enabled) WHERE enabled = true;

-- Shipping Quotes (cached rate quotes)
CREATE TABLE IF NOT EXISTS shipping_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255),
  from_country VARCHAR(100),
  to_country VARCHAR(100),
  to_zip VARCHAR(20),
  weight_kg DECIMAL(8,2),
  declared_value DECIMAL(12,2),
  carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL,
  carrier_name VARCHAR(255),
  profile_id UUID REFERENCES shipping_profiles(id) ON DELETE SET NULL,
  service_code VARCHAR(100),
  service_name VARCHAR(255),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  rate DECIMAL(12,2),
  fuel_surcharge DECIMAL(12,2),
  insurance_cost DECIMAL(12,2),
  handling_fee DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_quotes_session_id ON shipping_quotes(session_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_created_at ON shipping_quotes(created_at DESC);-- ====================================================================
--  ENTERPRISE ORDER ORCHESTRATION PLATFORM (PR-6)
-- ====================================================================

-- Workflow Definitions (configurable workflow templates)
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  type VARCHAR(100) NOT NULL DEFAULT 'standard',
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  trigger_type VARCHAR(100) NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  context_schema JSONB DEFAULT '{}',
  timeout_ms INTEGER DEFAULT 300000,
  max_retries INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 1000,
  compensation_enabled BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_by VARCHAR(255) DEFAULT 'system',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_type ON workflow_definitions(type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_status ON workflow_definitions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_name ON workflow_definitions USING gin(name gin_trgm_ops);

-- Workflow Instances (running/completed workflow executions)
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE SET NULL,
  workflow_name VARCHAR(255),
  workflow_type VARCHAR(100),
  version INTEGER DEFAULT 1,
  order_id UUID,
  order_number VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  current_state VARCHAR(100) DEFAULT 'draft',
  context JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_order_id ON workflow_instances(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_current_state ON workflow_instances(current_state);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_created_at ON workflow_instances(created_at DESC);

-- Workflow Steps (individual step execution records)
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  step_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_instance_id ON workflow_steps(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_type ON workflow_steps(step_type);

-- Workflow Events (event log)
CREATE TABLE IF NOT EXISTS workflow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  workflow_id UUID,
  order_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  payload JSONB DEFAULT '{}',
  source VARCHAR(100) DEFAULT 'system',
  correlation_id VARCHAR(255),
  causation_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_instance_id ON workflow_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_order_id ON workflow_events(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_event_type ON workflow_events(event_type);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created_at ON workflow_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_correlation_id ON workflow_events(correlation_id);

-- Workflow Queue (persistent task queues)
CREATE TABLE IF NOT EXISTS workflow_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name VARCHAR(100) NOT NULL,
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  timeout_ms INTEGER DEFAULT 30000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_queue_queue_name ON workflow_queue(queue_name);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_status ON workflow_queue(status);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_priority ON workflow_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_scheduled_at ON workflow_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_instance_id ON workflow_queue(instance_id);

-- Workflow History (execution history)
CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workflow_id UUID,
  workflow_name VARCHAR(255),
  order_id UUID,
  order_number VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_state VARCHAR(100),
  duration_ms INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  failed_steps INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_history_instance_id ON workflow_history(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_workflow_id ON workflow_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_order_id ON workflow_history(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_status ON workflow_history(status);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at ON workflow_history(created_at DESC);

-- Workflow Failures (failure records with compensation info)
CREATE TABLE IF NOT EXISTS workflow_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  workflow_id UUID,
  order_id UUID,
  step_name VARCHAR(255),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  compensated BOOLEAN DEFAULT false,
  compensation_status VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  recovered BOOLEAN DEFAULT false,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_failures_instance_id ON workflow_failures(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_workflow_id ON workflow_failures(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_order_id ON workflow_failures(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_compensated ON workflow_failures(compensated);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_failed_at ON workflow_failures(failed_at DESC);

-- Workflow Compensation (saga compensation actions)
CREATE TABLE IF NOT EXISTS workflow_compensation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  workflow_id UUID,
  order_id UUID,
  action VARCHAR(100) NOT NULL,
  compensation_action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_compensation_instance_id ON workflow_compensation(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_compensation_workflow_id ON workflow_compensation(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_compensation_order_id ON workflow_compensation(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_compensation_status ON workflow_compensation(status);

-- ====================================================================
--  LOYALTY
-- ====================================================================

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  perk TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tier_id UUID REFERENCES loyalty_tiers(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);

-- ====================================================================
--  REFERRALS
-- ====================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  reward_earned DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_customer_id ON referrals(customer_id);

-- ====================================================================
--  ABANDONED CARTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  items INTEGER DEFAULT 0,
  value DECIMAL(12,2) DEFAULT 0,
  stage VARCHAR(50) DEFAULT 'cart',
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON abandoned_carts(recovered) WHERE recovered = false;

-- ====================================================================
--  SUPPORT TICKETS
-- ====================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(number);

-- ====================================================================
--  LIVE SALES (notification feed)
-- ====================================================================

CREATE TABLE IF NOT EXISTS live_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) DEFAULT '',
  country VARCHAR(100) DEFAULT '',
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  minutes_ago INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_sales_created_at ON live_sales(created_at DESC);

-- ====================================================================
--  WEBHOOKS & INTEGRATIONS
-- ====================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255),
  events TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active) WHERE active = true;

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scopes TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- ====================================================================
--  SETTINGS
-- ====================================================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
--  MEDIA ASSETS
-- ====================================================================

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt TEXT DEFAULT '',
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  folder VARCHAR(255) DEFAULT '/',
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_mime_type ON media_assets(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags ON media_assets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);

CREATE TABLE IF NOT EXISTS media_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_versions_media_id ON media_versions(media_id);

CREATE TABLE IF NOT EXISTS media_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  field_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_usage_media_id ON media_usage(media_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_entity_type ON media_usage(entity_type, entity_id);

-- ====================================================================
--  FEATURE FLAGS
-- ====================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
--  AUTOMATION RULES (Supplier Automation)
-- ====================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  trigger_event VARCHAR(100) NOT NULL,
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  max_runs INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  cooldown_minutes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_event ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled) WHERE enabled = true;

-- Automation Triggers (25+ trigger types)
CREATE TABLE IF NOT EXISTS automation_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  config JSONB DEFAULT '{}',
  event_type VARCHAR(255),
  cron_expression VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  business_hours_only BOOLEAN DEFAULT false,
  blackout_windows JSONB DEFAULT '[]',
  holiday_rules JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_triggers_rule_id ON automation_triggers(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_type ON automation_triggers(type);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_event_type ON automation_triggers(event_type);

-- Automation Conditions (with AND/OR/NOT nesting)
CREATE TABLE IF NOT EXISTS automation_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES automation_conditions(id) ON DELETE SET NULL,
  operator VARCHAR(20) NOT NULL DEFAULT 'AND',
  logic_type VARCHAR(20) NOT NULL DEFAULT 'comparison',
  field VARCHAR(255),
  comparator VARCHAR(50),
  value TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_conditions_rule_id ON automation_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_conditions_parent_id ON automation_conditions(parent_id);

-- Automation Actions (send email, webhook, slack, api call, etc.)
CREATE TABLE IF NOT EXISTS automation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  timeout_ms INTEGER DEFAULT 30000,
  retry_count INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 1000,
  continue_on_failure BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_actions_rule_id ON automation_actions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_actions_type ON automation_actions(type);

-- Automation Runs (execution history per rule)
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  conditions_met BOOLEAN DEFAULT false,
  conditions_evaluated JSONB DEFAULT '{}',
  actions_executed JSONB DEFAULT '[]',
  action_results JSONB DEFAULT '[]',
  error_message TEXT,
  dry_run BOOLEAN DEFAULT false,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_rule_id ON automation_runs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started_at ON automation_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_trigger_type ON automation_runs(trigger_type);

-- Automation Jobs (persistent job tracking for each action)
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES automation_runs(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  action_id UUID REFERENCES automation_actions(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  priority INTEGER DEFAULT 5,
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  circuit_breaker_state VARCHAR(20) DEFAULT 'closed',
  circuit_breaker_failures INTEGER DEFAULT 0,
  circuit_breaker_reset_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  worker_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_run_id ON automation_jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_rule_id ON automation_jobs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_type ON automation_jobs(type);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_scheduled_at ON automation_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_worker_id ON automation_jobs(worker_id);

-- Automation Logs (detailed execution logs)
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  run_id UUID REFERENCES automation_runs(id) ON DELETE SET NULL,
  job_id UUID REFERENCES automation_jobs(id) ON DELETE SET NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_run_id ON automation_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_job_id ON automation_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_level ON automation_logs(level);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at DESC);

-- Automation Workers (worker pool management)
CREATE TABLE IF NOT EXISTS automation_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  worker_type VARCHAR(50) NOT NULL DEFAULT 'general',
  queues TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'idle',
  max_concurrent_jobs INTEGER DEFAULT 10,
  current_jobs INTEGER DEFAULT 0,
  total_jobs_processed INTEGER DEFAULT 0,
  total_jobs_failed INTEGER DEFAULT 0,
  avg_job_duration_ms INTEGER DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_workers_status ON automation_workers(status);
CREATE INDEX IF NOT EXISTS idx_automation_workers_worker_type ON automation_workers(worker_type);

-- Automation Schedules (cron-based scheduling)
CREATE TABLE IF NOT EXISTS automation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  business_hours_only BOOLEAN DEFAULT false,
  blackout_windows JSONB DEFAULT '[]',
  holiday_rules JSONB DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  max_runs INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_schedules_rule_id ON automation_schedules(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_enabled ON automation_schedules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_automation_schedules_next_run_at ON automation_schedules(next_run_at);

-- Automation Metrics (performance tracking)
CREATE TABLE IF NOT EXISTS automation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(14,4) NOT NULL DEFAULT 0,
  dimensions JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_metrics_rule_id ON automation_metrics(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_metrics_metric_name ON automation_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_automation_metrics_recorded_at ON automation_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_metrics_metric_name ON automation_metrics(metric_name, recorded_at DESC);

-- ====================================================================
--  AUDIT LOG
-- ====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor VARCHAR(255) NOT NULL DEFAULT 'system',
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  before_data JSONB,
  after_data JSONB,
  meta TEXT,
  ip_address VARCHAR(45),
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ====================================================================
--  BACKGROUND JOBS
-- ====================================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON jobs(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- ====================================================================
--  ENTERPRISE OBSERVABILITY PLATFORM (PR-8)
-- ====================================================================

-- System Metrics (API latency, DB latency, queue latency, memory, CPU, disk, bandwidth, etc.)
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(14,4) NOT NULL,
  unit VARCHAR(50) DEFAULT '',
  source VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  tags JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_source ON system_metrics(source);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON system_metrics(metric_name, recorded_at DESC);

-- System Logs (structured logging with correlation ID, trace ID, user, session, etc.)
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  service VARCHAR(100) DEFAULT '',
  module VARCHAR(100) DEFAULT '',
  correlation_id VARCHAR(255),
  trace_id VARCHAR(255),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  ip_address VARCHAR(45),
  country VARCHAR(100),
  device VARCHAR(255),
  browser VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'production',
  severity VARCHAR(20) DEFAULT 'info',
  execution_time_ms INTEGER DEFAULT 0,
  memory_usage_bytes BIGINT DEFAULT 0,
  cpu_usage_percent DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  stack_trace TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service);
CREATE INDEX IF NOT EXISTS idx_system_logs_correlation_id ON system_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_trace_id ON system_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON system_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_logs_environment ON system_logs(environment);

-- System Traces (distributed tracing spans)
CREATE TABLE IF NOT EXISTS system_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trace_id VARCHAR(255) NOT NULL,
  parent_span_id VARCHAR(255),
  span_id VARCHAR(255) NOT NULL,
  operation VARCHAR(255) NOT NULL,
  service VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ok',
  tags JSONB DEFAULT '{}',
  input_metadata JSONB DEFAULT '{}',
  output_metadata JSONB DEFAULT '{}',
  error_message TEXT,
  correlation_id VARCHAR(255),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_traces_trace_id ON system_traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_system_traces_span_id ON system_traces(span_id);
CREATE INDEX IF NOT EXISTS idx_system_traces_parent_span_id ON system_traces(parent_span_id);
CREATE INDEX IF NOT EXISTS idx_system_traces_service ON system_traces(service);
CREATE INDEX IF NOT EXISTS idx_system_traces_status ON system_traces(status);
CREATE INDEX IF NOT EXISTS idx_system_traces_start_time ON system_traces(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_system_traces_correlation_id ON system_traces(correlation_id);

-- System Alerts (alert events triggered by monitoring rules)
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(255) NOT NULL,
  rule_id VARCHAR(255),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metric_name VARCHAR(255),
  metric_value DECIMAL(14,4),
  threshold DECIMAL(14,4),
  condition VARCHAR(20),
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  channels TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'triggered',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  auto_resolve BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_alert_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_entity_type ON system_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_triggered_at ON system_alerts(triggered_at DESC);

-- System Incidents (incident management with full lifecycle)
CREATE TABLE IF NOT EXISTS system_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT DEFAULT '',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'detected',
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  source VARCHAR(255) DEFAULT 'system',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  root_cause TEXT,
  resolution TEXT,
  recovery_actions TEXT,
  owner VARCHAR(255),
  timeline JSONB DEFAULT '[]',
  postmortem TEXT,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_incidents_severity ON system_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_detected_at ON system_incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_incidents_entity_type ON system_incidents(entity_type, entity_id);

-- System Backups (backup records)
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'manual',
  backup_type VARCHAR(50) NOT NULL DEFAULT 'full',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  file_path VARCHAR(500),
  file_size BIGINT DEFAULT 0,
  checksum VARCHAR(255),
  encryption_algorithm VARCHAR(100),
  database_name VARCHAR(255),
  tables_backed_up INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  retention_days INTEGER DEFAULT 30,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_system_backups_type ON system_backups(type);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_backups_expires_at ON system_backups(expires_at);

-- System Restores (restore operations)
CREATE TABLE IF NOT EXISTS system_restores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_id UUID REFERENCES system_backups(id) ON DELETE SET NULL,
  backup_name VARCHAR(255),
  restore_type VARCHAR(50) NOT NULL DEFAULT 'full',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  target_database VARCHAR(255),
  tables_restored INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  error_message TEXT,
  recovery_point TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  initiated_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_restores_backup_id ON system_restores(backup_id);
CREATE INDEX IF NOT EXISTS idx_system_restores_status ON system_restores(status);

-- Service Health (health check snapshots for all services)
CREATE TABLE IF NOT EXISTS service_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'unknown',
  healthy BOOLEAN DEFAULT true,
  latency_ms INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  error_message TEXT,
  dependencies TEXT[] DEFAULT '{}',
  version VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_health_service_name ON service_health(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_service_type ON service_health(service_type);
CREATE INDEX IF NOT EXISTS idx_service_health_status ON service_health(status);
CREATE INDEX IF NOT EXISTS idx_service_health_healthy ON service_health(healthy);
CREATE INDEX IF NOT EXISTS idx_service_health_checked_at ON service_health(checked_at DESC);

-- Worker Health (worker status tracking)
CREATE TABLE IF NOT EXISTS worker_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_name VARCHAR(255) NOT NULL,
  worker_type VARCHAR(100) NOT NULL DEFAULT 'general',
  queues TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
  healthy BOOLEAN DEFAULT true,
  current_jobs INTEGER DEFAULT 0,
  max_concurrent_jobs INTEGER DEFAULT 10,
  total_jobs_processed INTEGER DEFAULT 0,
  total_jobs_failed INTEGER DEFAULT 0,
  avg_job_duration_ms INTEGER DEFAULT 0,
  memory_usage_bytes BIGINT DEFAULT 0,
  cpu_usage_percent DECIMAL(5,2),
  last_heartbeat_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_health_worker_name ON worker_health(worker_name);
CREATE INDEX IF NOT EXISTS idx_worker_health_worker_type ON worker_health(worker_type);
CREATE INDEX IF NOT EXISTS idx_worker_health_status ON worker_health(status);
CREATE INDEX IF NOT EXISTS idx_worker_health_healthy ON worker_health(healthy);
CREATE INDEX IF NOT EXISTS idx_worker_health_last_heartbeat_at ON worker_health(last_heartbeat_at);

-- Queue Health (queue monitoring)
CREATE TABLE IF NOT EXISTS queue_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name VARCHAR(255) NOT NULL,
  queue_type VARCHAR(100) DEFAULT 'workflow',
  status VARCHAR(20) NOT NULL DEFAULT 'up',
  healthy BOOLEAN DEFAULT true,
  depth INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  running_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  dead_letter_count INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  throughput_per_minute DECIMAL(10,2) DEFAULT 0,
  last_processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_health_queue_name ON queue_health(queue_name);
CREATE INDEX IF NOT EXISTS idx_queue_health_status ON queue_health(status);
CREATE INDEX IF NOT EXISTS idx_queue_health_healthy ON queue_health(healthy);
CREATE INDEX IF NOT EXISTS idx_queue_health_checked_at ON queue_health(checked_at DESC);

-- ====================================================================
--  PERFORMANCE OPTIMIZATION (PR-11) — Additional composite indexes
-- ====================================================================

-- Products: Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_category_status_price ON products(category_id, status, COALESCE(sale_price, price));
CREATE INDEX IF NOT EXISTS idx_products_brand_status ON products(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured_rating ON products(featured, rating DESC) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_best_seller_rating ON products(best_seller, rating DESC) WHERE best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_status_price ON products(status, COALESCE(sale_price, price));
CREATE INDEX IF NOT EXISTS idx_products_affiliate_status ON products(affiliate, status) WHERE affiliate = true;

-- Orders: Composite indexes for order queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(created_at, status);

-- Customers: Indexes for segmentation and search
CREATE INDEX IF NOT EXISTS idx_customers_country_status ON customers(country, status);
CREATE INDEX IF NOT EXISTS idx_customers_created_status ON customers(created_at DESC, status);

-- Articles: Content query optimization
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author_published ON articles(author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tags_gin ON articles USING gin(tags);

-- Affiliate: Performance optimization
CREATE INDEX IF NOT EXISTS idx_aff_products_commission ON affiliate_products(commission_rate DESC);
CREATE INDEX IF NOT EXISTS idx_aff_links_conversions ON affiliate_links(clicks DESC, conversions DESC);
CREATE INDEX IF NOT EXISTS idx_aff_conv_date ON affiliate_conversions(converted_at, status);

-- Supplier: Query optimization
CREATE INDEX IF NOT EXISTS idx_supplier_products_cost ON supplier_products(supplier_cost ASC);
CREATE INDEX IF NOT EXISTS idx_supplier_accounts_priority_active ON supplier_accounts(priority, active) WHERE active = true;

-- System metrics: Time-series optimization
CREATE INDEX IF NOT EXISTS idx_sys_metrics_name_time_desc ON system_metrics(metric_name, recorded_at DESC);

-- Audit logs: Entity lookup optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON audit_logs(entity_type, entity_id, created_at DESC);

-- ====================================================================
--  ENTERPRISE SEARCH & DISCOVERY PLATFORM (PR-10)
-- ====================================================================

-- Search Index (full-text search index for all entities)
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(255),
  brand VARCHAR(255) DEFAULT '',
  category VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT '',
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  attributes JSONB DEFAULT '{}',
  price DECIMAL(12,2) DEFAULT 0,
  sale_price DECIMAL(12,2),
  rating DECIMAL(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  image VARCHAR(500) DEFAULT '',
  url VARCHAR(500) DEFAULT '',
  country VARCHAR(100) DEFAULT '',
  language VARCHAR(10) DEFAULT 'en',
  color VARCHAR(100) DEFAULT '',
  material VARCHAR(255) DEFAULT '',
  room VARCHAR(100) DEFAULT '',
  style VARCHAR(100) DEFAULT '',
  season VARCHAR(50) DEFAULT '',
  collection VARCHAR(255) DEFAULT '',
  affiliate_network VARCHAR(255) DEFAULT '',
  supplier_name VARCHAR(255) DEFAULT '',
  shipping_speed VARCHAR(50) DEFAULT '',
  discount DECIMAL(5,2) DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_editors_choice BOOLEAN DEFAULT false,
  is_luxury BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0,
  commission DECIMAL(5,2) DEFAULT 0,
  search_vector tsvector NOT NULL DEFAULT ''::tsvector,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_index_entity_type ON search_index(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_index_name ON search_index USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_index_brand ON search_index(brand);
CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category);
CREATE INDEX IF NOT EXISTS idx_search_index_price ON search_index(price);
CREATE INDEX IF NOT EXISTS idx_search_index_rating ON search_index(rating DESC);
CREATE INDEX IF NOT EXISTS idx_search_index_popularity_score ON search_index(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_index_created_at ON search_index(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_index_search_vector ON search_index USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_index_tags ON search_index USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_search_index_country ON search_index(country);
CREATE INDEX IF NOT EXISTS idx_search_index_language ON search_index(language);
CREATE INDEX IF NOT EXISTS idx_search_index_color ON search_index(color);
CREATE INDEX IF NOT EXISTS idx_search_index_material ON search_index(material);
CREATE INDEX IF NOT EXISTS idx_search_index_style ON search_index(style);
CREATE INDEX IF NOT EXISTS idx_search_index_season ON search_index(season);
CREATE INDEX IF NOT EXISTS idx_search_index_is_new ON search_index(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_search_index_is_featured ON search_index(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_search_index_is_best_seller ON search_index(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_search_index_is_trending ON search_index(is_trending) WHERE is_trending = true;

-- Search Terms (query log)
CREATE TABLE IF NOT EXISTS search_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query VARCHAR(500) NOT NULL,
  normalized_query VARCHAR(500) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  country VARCHAR(10) DEFAULT '',
  result_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_revenue DECIMAL(12,2) DEFAULT 0,
  no_result BOOLEAN DEFAULT false,
  abandoned BOOLEAN DEFAULT false,
  session_id VARCHAR(255),
  customer_id UUID,
  device_type VARCHAR(50),
  search_time_ms INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_terms_query ON search_terms(query);
CREATE INDEX IF NOT EXISTS idx_search_terms_normalized_query ON search_terms(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_terms_no_result ON search_terms(no_result) WHERE no_result = true;
CREATE INDEX IF NOT EXISTS idx_search_terms_abandoned ON search_terms(abandoned) WHERE abandoned = true;
CREATE INDEX IF NOT EXISTS idx_search_terms_searched_at ON search_terms(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_terms_normalized_query ON search_terms(normalized_query, searched_at);

-- Search Clicks (click tracking for analytics)
CREATE TABLE IF NOT EXISTS search_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_term_id UUID REFERENCES search_terms(id) ON DELETE SET NULL,
  query VARCHAR(500) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  position INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'search',
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(12,2) DEFAULT 0,
  session_id VARCHAR(255),
  customer_id UUID,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_clicks_search_term_id ON search_clicks(search_term_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_entity_type ON search_clicks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_converted ON search_clicks(converted) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_search_clicks_clicked_at ON search_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_clicks_session_id ON search_clicks(session_id);

-- Search Sessions
CREATE TABLE IF NOT EXISTS search_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  customer_id UUID,
  query_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  first_query VARCHAR(500),
  last_query VARCHAR(500),
  device_type VARCHAR(50),
  country VARCHAR(10),
  language VARCHAR(10),
  duration_seconds INTEGER DEFAULT 0,
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(12,2) DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_sessions_session_id ON search_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_customer_id ON search_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_converted ON search_sessions(converted) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_search_sessions_started_at ON search_sessions(started_at DESC);

-- Search Synonyms
CREATE TABLE IF NOT EXISTS search_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term VARCHAR(255) NOT NULL,
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_synonyms_term ON search_synonyms(term);
CREATE INDEX IF NOT EXISTS idx_search_synonyms_active ON search_synonyms(active) WHERE active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_synonyms_term_lang ON search_synonyms(term, language);

-- Search Boost Rules (merchandising)
CREATE TABLE IF NOT EXISTS search_boost_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  rule_type VARCHAR(50) NOT NULL DEFAULT 'boost',
  entity_type VARCHAR(50),
  entity_id UUID,
  query_pattern VARCHAR(500),
  category VARCHAR(255),
  brand VARCHAR(255),
  multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  priority INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  campaign VARCHAR(255),
  active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_boost_rules_active ON search_boost_rules(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_search_boost_rules_rule_type ON search_boost_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_search_boost_rules_entity_type ON search_boost_rules(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_boost_rules_query_pattern ON search_boost_rules(query_pattern);
CREATE INDEX IF NOT EXISTS idx_search_boost_rules_category ON search_boost_rules(category);
CREATE INDEX IF NOT EXISTS idx_search_boost_rules_brand ON search_boost_rules(brand);

-- Search Redirects (manual redirects)
CREATE TABLE IF NOT EXISTS search_redirects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_pattern VARCHAR(500) NOT NULL,
  redirect_url VARCHAR(500) NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  active BOOLEAN DEFAULT true,
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_redirects_active ON search_redirects(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_search_redirects_query_pattern ON search_redirects(query_pattern);

-- Recommendations (stored recommendation sets)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  source VARCHAR(50) DEFAULT 'engine',
  items JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  score DECIMAL(5,2) DEFAULT 0,
  expires_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
CREATE INDEX IF NOT EXISTS idx_recommendations_entity_type ON recommendations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_source ON recommendations(source);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires_at ON recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(score DESC);

-- Recommendation Scores (per-product recommendation scores)
CREATE TABLE IF NOT EXISTS recommendation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  related_product_id UUID NOT NULL,
  score DECIMAL(10,4) NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL DEFAULT 'related',
  source VARCHAR(50) DEFAULT 'co_occurrence',
  weight DECIMAL(5,2) DEFAULT 1.0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_scores_product_id ON recommendation_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_related_product_id ON recommendation_scores(related_product_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_type ON recommendation_scores(type);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_score ON recommendation_scores(score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_scores_pair ON recommendation_scores(product_id, related_product_id, type);

-- Personalization Profiles
CREATE TABLE IF NOT EXISTS personalization_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  country VARCHAR(10) DEFAULT '',
  language VARCHAR(10) DEFAULT 'en',
  device_type VARCHAR(50) DEFAULT '',
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_brands TEXT[] DEFAULT '{}',
  price_range_min DECIMAL(12,2) DEFAULT 0,
  price_range_max DECIMAL(12,2) DEFAULT 99999,
  style_preferences TEXT[] DEFAULT '{}',
  color_preferences TEXT[] DEFAULT '{}',
  material_preferences TEXT[] DEFAULT '{}',
  purchase_history TEXT[] DEFAULT '{}',
  browsing_history TEXT[] DEFAULT '{}',
  wishlist_items TEXT[] DEFAULT '{}',
  favorite_items TEXT[] DEFAULT '{}',
  search_history TEXT[] DEFAULT '{}',
  customer_segment VARCHAR(50) DEFAULT '',
  ai_predictions JSONB DEFAULT '{}',
  price_sensitivity VARCHAR(20) DEFAULT 'medium',
  avg_order_value DECIMAL(12,2) DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personalization_profiles_customer_id ON personalization_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_personalization_profiles_country ON personalization_profiles(country);
CREATE INDEX IF NOT EXISTS idx_personalization_profiles_customer_segment ON personalization_profiles(customer_segment);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pers_profiles_customer_unique ON personalization_profiles(customer_id);

-- Search Analytics (aggregated daily stats)
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  total_searches INTEGER DEFAULT 0,
  unique_searches INTEGER DEFAULT 0,
  no_result_searches INTEGER DEFAULT 0,
  abandoned_searches INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  conversion_revenue DECIMAL(14,2) DEFAULT 0,
  avg_search_time_ms INTEGER DEFAULT 0,
  avg_click_position DECIMAL(3,1) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,
  top_queries JSONB DEFAULT '[]',
  popular_categories JSONB DEFAULT '[]',
  popular_filters JSONB DEFAULT '[]',
  device_breakdown JSONB DEFAULT '{}',
  country_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_analytics_date_unique ON search_analytics(date);

-- ====================================================================
--  ENTERPRISE AI COMMERCE PLATFORM (PR-9)
-- ====================================================================

-- AI Providers (OpenAI, Gemini, Claude, DeepSeek, OpenRouter + future)
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(50) NOT NULL DEFAULT 'openai',
  description TEXT DEFAULT '',
  docs_url VARCHAR(500),
  website VARCHAR(500),
  logo VARCHAR(500),
  active BOOLEAN DEFAULT true,
  api_base_url VARCHAR(500),
  api_key_encrypted TEXT DEFAULT '',
  api_key_configured BOOLEAN DEFAULT false,
  monthly_budget DECIMAL(12,2) DEFAULT 100,
  monthly_spent DECIMAL(12,2) DEFAULT 0,
  rate_limit_per_minute INTEGER DEFAULT 60,
  priority INTEGER DEFAULT 10,
  fallback_to UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  failover_order INTEGER DEFAULT 10,
  health_status VARCHAR(50) DEFAULT 'unknown',
  health_last_checked TIMESTAMPTZ,
  health_latency_ms INTEGER DEFAULT 0,
  health_error_rate DECIMAL(5,2) DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_ai_providers_provider_type ON ai_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_ai_providers_priority ON ai_providers(priority);

-- AI Models (model registry with capabilities)
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  model_family VARCHAR(100) DEFAULT '',
  version VARCHAR(50) DEFAULT '1.0',
  description TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  capabilities TEXT[] DEFAULT '{}',
  max_tokens INTEGER DEFAULT 4096,
  max_input_tokens INTEGER DEFAULT 4096,
  max_output_tokens INTEGER DEFAULT 4096,
  training_data_cutoff VARCHAR(100),
  context_window INTEGER DEFAULT 8192,
  pricing_input_per_1k DECIMAL(10,6) DEFAULT 0,
  pricing_output_per_1k DECIMAL(10,6) DEFAULT 0,
  pricing_fine_tune_per_1k DECIMAL(10,6) DEFAULT 0,
  latency_p50_ms INTEGER DEFAULT 500,
  latency_p95_ms INTEGER DEFAULT 2000,
  supports_streaming BOOLEAN DEFAULT true,
  supports_functions BOOLEAN DEFAULT true,
  supports_vision BOOLEAN DEFAULT false,
  supports_embeddings BOOLEAN DEFAULT false,
  supports_fine_tuning BOOLEAN DEFAULT false,
  supports_json_mode BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 60,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_ai_models_model_family ON ai_models(model_family);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_default ON ai_models(is_default) WHERE is_default = true;

-- AI Prompts (prompt library with versioning)
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  description TEXT DEFAULT '',
  system_prompt TEXT,
  user_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  output_schema JSONB DEFAULT '{}',
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  is_active_version BOOLEAN DEFAULT true,
  current_version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_slug ON ai_prompts(slug);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_status ON ai_prompts(status);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_tags ON ai_prompts USING gin(tags);

-- AI Prompt Versions (version history with rollback)
CREATE TABLE IF NOT EXISTS ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES ai_prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT,
  user_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  change_notes TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  a_test_enabled BOOLEAN DEFAULT false,
  a_test_winner VARCHAR(20),
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_prompt_id ON ai_prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_prompt_id ON ai_prompt_versions(prompt_id, version DESC);

-- AI Generations (full history of all AI generations)
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task VARCHAR(100) NOT NULL,
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
  prompt_version INTEGER DEFAULT 1,
  prompt_slug VARCHAR(255),
  prompt_text TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  provider_slug VARCHAR(100),
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  model_slug VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(12,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  cached BOOLEAN DEFAULT false,
  fallback_used BOOLEAN DEFAULT false,
  fallback_chain TEXT[],
  quality_score DECIMAL(3,1),
  seo_score DECIMAL(3,1),
  grammar_score DECIMAL(3,1),
  readability_score DECIMAL(3,1),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_task ON ai_generations(task);
CREATE INDEX IF NOT EXISTS idx_ai_generations_prompt_id ON ai_generations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_provider_id ON ai_generations(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_model_id ON ai_generations(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_entity_type ON ai_generations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);

-- AI Usage (aggregated token usage per provider/model/day)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  provider_slug VARCHAR(100),
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  model_slug VARCHAR(255),
  task VARCHAR(100),
  requests INTEGER DEFAULT 0,
  tokens_input BIGINT DEFAULT 0,
  tokens_output BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  cost DECIMAL(14,6) DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_id ON ai_usage(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model_id ON ai_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_task ON ai_usage(task);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_unique ON ai_usage(date, provider_slug, model_slug, COALESCE(task, ''));

-- AI Costs (detailed cost tracking per generation)
CREATE TABLE IF NOT EXISTS ai_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES ai_generations(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  provider_slug VARCHAR(100),
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  model_slug VARCHAR(255),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_input DECIMAL(12,6) DEFAULT 0,
  cost_output DECIMAL(12,6) DEFAULT 0,
  total_cost DECIMAL(12,6) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  billed_to VARCHAR(100),
  project VARCHAR(100),
  user_id VARCHAR(255),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_costs_generation_id ON ai_costs(generation_id);
CREATE INDEX IF NOT EXISTS idx_ai_costs_provider_id ON ai_costs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_costs_model_id ON ai_costs(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_costs_recorded_at ON ai_costs(recorded_at DESC);

-- AI Feedback (user feedback on AI generations)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES ai_generations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(100),
  comment TEXT,
  corrected_text TEXT,
  quality_score DECIMAL(3,1),
  seo_score DECIMAL(3,1),
  grammar_score DECIMAL(3,1),
  readability_score DECIMAL(3,1),
  brand_voice_score DECIMAL(3,1),
  conversion_score DECIMAL(3,1),
  originality_score DECIMAL(3,1),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_generation_id ON ai_feedback(generation_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at DESC);

-- AI Quality (quality scores per prompt/category)
CREATE TABLE IF NOT EXISTS ai_quality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
  prompt_slug VARCHAR(255),
  task VARCHAR(100),
  entity_type VARCHAR(100),
  sample_size INTEGER DEFAULT 0,
  avg_quality DECIMAL(3,1) DEFAULT 0,
  avg_grammar DECIMAL(3,1) DEFAULT 0,
  avg_readability DECIMAL(3,1) DEFAULT 0,
  avg_seo DECIMAL(3,1) DEFAULT 0,
  avg_conversion DECIMAL(3,1) DEFAULT 0,
  avg_originality DECIMAL(3,1) DEFAULT 0,
  avg_brand_voice DECIMAL(3,1) DEFAULT 0,
  avg_accessibility DECIMAL(3,1) DEFAULT 0,
  avg_compliance DECIMAL(3,1) DEFAULT 0,
  pass_rate DECIMAL(5,2) DEFAULT 100,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_quality_prompt_id ON ai_quality(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_quality_task ON ai_quality(task);
CREATE INDEX IF NOT EXISTS idx_ai_quality_calculated_at ON ai_quality(calculated_at DESC);

-- AI Workflows (automated AI triggers)
CREATE TABLE IF NOT EXISTS ai_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  trigger_event VARCHAR(100) NOT NULL,
  trigger_entity_type VARCHAR(100),
  ai_task VARCHAR(100) NOT NULL,
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  conditions JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  auto_apply BOOLEAN DEFAULT false,
  requires_review BOOLEAN DEFAULT true,
  max_runs INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  cooldown_minutes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_workflows_trigger_event ON ai_workflows(trigger_event);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_enabled ON ai_workflows(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_ai_workflows_ai_task ON ai_workflows(ai_task);

-- AI Workflow Runs (execution history)
CREATE TABLE IF NOT EXISTS ai_workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES ai_workflows(id) ON DELETE CASCADE,
  trigger_event VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  generation_id UUID REFERENCES ai_generations(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  result JSONB,
  auto_applied BOOLEAN DEFAULT false,
  requires_review BOOLEAN DEFAULT true,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_workflow_runs_workflow_id ON ai_workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_runs_entity_type ON ai_workflow_runs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_runs_status ON ai_workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_runs_created_at ON ai_workflow_runs(created_at DESC);

-- ====================================================================
--  BACKUPS
-- ====================================================================

CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'manual',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  file_path VARCHAR(500),
  file_size BIGINT,
  checksum VARCHAR(255),
  database_name VARCHAR(255),
  tables_backed_up INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  retention_days INTEGER DEFAULT 30,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_expires_at ON backups(expires_at);

-- ====================================================================
--  ENTERPRISE PAYMENT PERSISTENCE TABLES
-- ====================================================================

-- Payment Intents (durable storage for all payment intent records)
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  client_secret TEXT,
  metadata JSONB DEFAULT '{}',
  idempotency_key VARCHAR(255),
  refunded_amount BIGINT DEFAULT 0,
  processor_fees BIGINT DEFAULT 0,
  net_amount BIGINT DEFAULT 0,
  payment_method_type VARCHAR(100),
  payment_method_details JSONB,
  billing_details JSONB,
  error_message TEXT,
  authorized_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pi_provider_payment ON payment_intents(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider ON payment_intents(provider);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at ON payment_intents(created_at DESC);

-- Payment Transactions (every payment event: authorization, capture, refund, etc.)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
  order_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(255),
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  processor_response TEXT,
  processor_fee BIGINT DEFAULT 0,
  net_amount BIGINT DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_intent_id ON payment_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Refunds (full and partial)
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
  order_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(255),
  provider_refund_id VARCHAR(255) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  reason TEXT,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_provider ON payment_refunds(provider_refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_created_at ON payment_refunds(created_at DESC);

-- Disputes / Chargebacks
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_number VARCHAR(100) NOT NULL,
  order_id VARCHAR(255),
  order_number VARCHAR(255),
  payment_intent_id VARCHAR(255),
  provider_dispute_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'needs_response',
  evidence_submitted BOOLEAN DEFAULT false,
  evidence_data JSONB,
  due_by TIMESTAMPTZ,
  timeline JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dispute_provider ON payment_disputes(provider_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_order_id ON payment_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON payment_disputes(created_at DESC);

-- Webhook Deliveries (persistent audit trail)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(255),
  provider_event_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'received',
  payload JSONB,
  headers JSONB,
  signature TEXT,
  signature_valid BOOLEAN DEFAULT false,
  idempotent BOOLEAN DEFAULT false,
  processing_time_ms INTEGER,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  retry_history JSONB DEFAULT '[]',
  order_id VARCHAR(255),
  payment_intent_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wh_provider_event ON webhook_deliveries(provider_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_provider ON webhook_deliveries(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_order_id ON webhook_deliveries(order_id);

-- Idempotency Keys (duplicate payment protection)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL,
  result JSONB NOT NULL,
  response_status INTEGER NOT NULL DEFAULT 200,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ik_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- Provider Health Snapshots
CREATE TABLE IF NOT EXISTS provider_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  healthy BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  latency_ms INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health(provider);
CREATE INDEX IF NOT EXISTS idx_provider_health_recorded_at ON provider_health(recorded_at DESC);

-- Finance Reconciliation Records
CREATE TABLE IF NOT EXISTS finance_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  provider_revenue BIGINT DEFAULT 0,
  provider_fees BIGINT DEFAULT 0,
  provider_refunds BIGINT DEFAULT 0,
  provider_chargebacks BIGINT DEFAULT 0,
  db_revenue BIGINT DEFAULT 0,
  db_refunds BIGINT DEFAULT 0,
  db_chargebacks BIGINT DEFAULT 0,
  revenue_difference BIGINT DEFAULT 0,
  refund_difference BIGINT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  discrepancies JSONB DEFAULT '[]',
  reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_reconciliation_period_start ON finance_reconciliation(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_reconciliation_status ON finance_reconciliation(status);
CREATE INDEX IF NOT EXISTS idx_finance_reconciliation_reconciled_at ON finance_reconciliation(reconciled_at DESC);


-- ====================================================================
--  INTEGRATION CONFIGS (Enterprise Integrations Center)
-- ====================================================================

CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment VARCHAR(50) NOT NULL DEFAULT 'development',
  settings JSONB NOT NULL DEFAULT '{}',
  connection_status VARCHAR(50) DEFAULT 'unknown',
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_configs_unique ON integration_configs(module, provider);
CREATE INDEX IF NOT EXISTS idx_integration_configs_module ON integration_configs(module);
CREATE INDEX IF NOT EXISTS idx_integration_configs_enabled ON integration_configs(enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integration_configs(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details TEXT,
  actor VARCHAR(255) NOT NULL DEFAULT 'system',
  actor_role VARCHAR(50) DEFAULT 'super_admin',
  actor_ip VARCHAR(45),
  actor_user_agent TEXT,
  actor_device VARCHAR(255),
  actor_country VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON integration_logs(type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS integration_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL,
  environment VARCHAR(50) DEFAULT 'all',
  integration_count INTEGER DEFAULT 0,
  checksum VARCHAR(64) NOT NULL,
  data JSONB NOT NULL,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_backups_created_at ON integration_backups(created_at DESC);

-- ====================================================================
--  INTEGRATION CONFIGS (Enterprise Integrations Center)
-- ====================================================================

CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment VARCHAR(50) NOT NULL DEFAULT 'development',
  settings JSONB NOT NULL DEFAULT '{}',
  connection_status VARCHAR(50) DEFAULT 'unknown',
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_configs_unique ON integration_configs(module, provider);
CREATE INDEX IF NOT EXISTS idx_integration_configs_module ON integration_configs(module);
CREATE INDEX IF NOT EXISTS idx_integration_configs_enabled ON integration_configs(enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integration_configs(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details TEXT,
  actor VARCHAR(255) NOT NULL DEFAULT 'system',
  actor_role VARCHAR(50) DEFAULT 'super_admin',
  actor_ip VARCHAR(45),
  actor_user_agent TEXT,
  actor_device VARCHAR(255),
  actor_country VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON integration_logs(type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS integration_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL,
  environment VARCHAR(50) DEFAULT 'all',
  integration_count INTEGER DEFAULT 0,
  checksum VARCHAR(64) NOT NULL,
  data JSONB NOT NULL,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_backups_created_at ON integration_backups(created_at DESC);

-- ====================================================================
--  AFFILIATES
-- ====================================================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  website VARCHAR(500),
  commission_rate DECIMAL(5,2) DEFAULT 0,
  tracking_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_commission DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(100),
  payment_details TEXT,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_tracking_id ON affiliates(tracking_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
