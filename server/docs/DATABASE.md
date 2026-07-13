# ALAYA INSIDER — PostgreSQL Database Architecture

> **Version**: 2.0.0
> **Last updated**: 2026-07-08

---

## 1. Connection & Pool

File: `server/src/db/index.ts`

| Feature | Implementation |
|---------|---------------|
| **Driver** | `pg` (node-postgres) |
| **Pool** | `new Pool()` with env-based config |
| **Connection String** | `DATABASE_URL` env var |
| **Fallback** | Individual `DB_HOST`, `DB_PORT`, `DB_NAME`, etc. |
| **Max Connections** | 20 (configurable via `DB_POOL_MAX`) |
| **SSL** | Enabled in production |
| **Auto-Retry** | 10 retries with 2-second delay |
| **Health Check** | Lightweight `SELECT 1` query |
| **Timeout** | 30 seconds connection timeout |
| **Transactions** | `withTransaction()` and `withTransactionClient()` |

### Helper Functions

- `query(text, params)` — Execute query, return result
- `queryOne(text, params)` — Return first row or null
- `queryAll(text, params)` — Return all rows
- `buildPaginatedQuery(sql, params)` — Build paginated query with count
- `getTotalCount(sql, params)` — Get total count for pagination
- `withTransaction(fn)` — Execute function within a transaction
- `closePool()` — Graceful shutdown
- `waitForDatabase()` — Wait for database connection (10 retries)
- `checkDbHealth()` — Return pool statistics and latency

---

## 2. Schema (45+ Tables)

### 2.1 Users & Authentication

| Table | Columns | Indexes |
|-------|---------|---------|
| `users` | id, email, password_hash, name, role, is_active, mfa_method, totp_secret, last_login_at | email, role |
| `sessions` | id, user_id, token, refresh_token, ip_address, user_agent, device_info, expires_at | user_id, token, expires |
| `trusted_devices` | id, user_id, device_fingerprint, device_name, last_used_at | user_id, fingerprint |
| `recovery_codes` | id, user_id, code_hash, used, used_at, expires_at | user_id |

### 2.2 Catalog

| Table | Columns | Indexes |
|-------|---------|---------|
| `products` | id, slug, name, brand, brand_id, category_id, type, price, sale_price, stock, sku, tags, variants(JSONB), specs(JSONB), featured, status, reviews(JSONB) | slug, category, brand, status, name(gin_trgm), tags(gin), sku, price, created |
| `brands` | id, slug, name, tagline, country, featured | slug, name(gin_trgm) |
| `categories` | id, slug, name, parent_id, sort_order | slug, parent, name(gin_trgm) |
| `product_images` | id, product_id, url, alt, sort_order | product_id, order |

### 2.3 Orders & Checkout

| Table | Columns | Indexes |
|-------|---------|---------|
| `orders` | id, number, customer_id, items(JSONB), subtotal, discount, shipping, tax, total, currency, status | number, customer, status, created, email, total |
| `order_items` | id, order_id, product_id, name, price, qty | order_id |
| `customers` | id, name, email, password, phone, country, status, preferences(JSONB), timeline(JSONB) | email, status, name(gin_trgm) |
| `addresses` | id, customer_id, label, name, line1, city, state, country, zip, is_default | customer_id |

### 2.4 Payments

| Table | Columns | Indexes |
|-------|---------|---------|
| `payment_intents` | id, order_id, order_number, provider, provider_payment_id, amount, status, metadata(JSONB), refunded_amount, processor_fees, net_amount | provider_payment_id(UNIQUE), order, status, provider, created |
| `payment_transactions` | id, payment_intent_id, order_id, provider, provider_transaction_id, type, amount, status, processor_fee, net_amount, metadata(JSONB) | order, payment_intent, type, status, created |
| `payment_refunds` | id, payment_intent_id, order_id, provider_refund_id, amount, reason, status, metadata(JSONB) | provider_refund_id(UNIQUE), order, status, created |
| `payment_disputes` | id, dispute_number, order_id, payment_intent_id, provider_dispute_id, amount, reason, status, evidence_data(JSONB), timeline(JSONB) | provider_dispute_id(UNIQUE), order, status, created |
| `payment_gateways` | id, name, code, mode, active, countries, config(JSONB) | code, active |
| `payments` | id, order_id, method, amount, status, gateway_response(JSONB) | order, status |

### 2.5 Returns & Refunds

| Table | Columns | Indexes |
|-------|---------|---------|
| `returns` | id, number, order_id, customer_name, type, reason, status, refund_amount | order, status, number |
| `refunds` | id, return_id, order_id, amount, reason, payment_method, status | return, order |

### 2.6 Content

| Table | Columns | Indexes |
|-------|---------|---------|
| `articles` | id, slug, title, excerpt, body(TEXT[]), cover, author, category, tags(TEXT[]), featured | slug, author, category, published, title(gin_trgm), tags(gin) |
| `authors` | id, name, role, avatar, bio | — |

### 2.7 Infrastructure

| Table | Columns | Indexes |
|-------|---------|---------|
| `audit_logs` | id, actor, action, entity_type, entity_id, before_data(JSONB), after_data(JSONB), meta, ip_address | actor, action, entity, created |
| `jobs` | id, type, status, priority, payload(JSONB), result(JSONB), retry_count, max_retries, scheduled_at | status, type, priority, scheduled, created |
| `backups` | id, name, type, status, file_path, file_size, checksum, verified, retention_days | type, status, created, expires |
| `webhook_deliveries` | id, provider, event_type, provider_event_id, status, payload(JSONB), headers(JSONB), signature, signature_valid, idempotent, retry_count, retry_history(JSONB) | provider_event_id(UNIQUE), provider, status, event_type, created, order |
| `idempotency_keys` | id, key, result(JSONB), response_status, expires_at | key(UNIQUE), expires |
| `provider_health` | id, provider, healthy, message, latency_ms | provider, recorded |
| `finance_reconciliation` | id, period_start, period_end, provider_revenue, provider_fees, provider_refunds, provider_chargebacks, db_revenue, db_refunds, db_chargebacks, revenue_difference, status, discrepancies(JSONB) | period, status, reconciled |
| `api_keys` | id, name, key_hash, key_prefix, user_id, scopes(TEXT[]), active, expires_at | prefix, user |
| `settings` | id, key(UNIQUE), value(JSONB) | — |
| `webhooks` | id, name, url, secret, events(TEXT[]), active | active |

---

## 3. Migration System

File: `server/src/db/migrate.ts`

| Command | Description |
|---------|-------------|
| `runMigrations()` | Apply pending migrations |
| `rollbackMigration()` | Undo last migration |
| `getMigrationStatus()` | Show migration history |
| `resetDatabase()` | Drop and recreate all tables |

Migrations use SHA-256 hash detection to track changes.

---

## 4. Repository Layer

### 4.1 Base Repository (`repositories/base.ts`)

Generic CRUD with:
- `list(params)` — Paginated list with search, sort, filters
- `getById(id)` — Get single record
- `create(input, actor)` — Insert with audit log
- `update(id, patch, actor)` — Update with audit log
- `delete(id, actor)` — Soft or hard delete with audit log
- `exists(id)` — Check existence
- `count(conditions)` — Count records
- `bulkCreate/Update/Delete(inputs)` — Batch operations
- `transactional(fn)` — Execute within transaction

### 4.2 Entity Repositories (30)

All entities in `repositories/index.ts`:
- `products` — Search, featured, best sellers, by category, by brand, related
- `categories` — By slug
- `brands` — By slug, featured
- `orders` — By number, by customer, recent, by status, revenue stats
- `customers_repo` — By email, authenticate (legacy), VIP
- `coupons` — By code, validate
- `articles` — By slug, featured, recent, by category
- `suppliers` — Resolve by country
- `gateways` — Active for country
- `returns`, `redirects`, `popups`, `affiliates`, `loyalty`, `questions`, `tickets`, `liveSales`, `abandonedCarts`, `referrals`, `addresses`, `settings`, `users_repo`, `authors`, `webhooks`, `apiKeys`, `featureFlags`, `automationRules`, `mediaAssets`

---

## 5. Payment Persistence

See [PAYMENT_PLATFORM.md](./PAYMENT_PLATFORM.md) for complete payment persistence documentation.

Tables: `payment_intents`, `payment_transactions`, `payment_refunds`, `payment_disputes`, `webhook_deliveries`, `idempotency_keys`, `provider_health`, `finance_reconciliation`

---

## 6. Backup Strategy

File: `server/src/db/repositories/backups.ts`

| Type | Frequency | Retention |
|------|-----------|-----------|
| Manual | On demand | 30 days |
| Daily | Every 24 hours | 7 days |
| Weekly | Every 7 days | 30 days |
| Monthly | Every 30 days | 365 days |

Backup verification: Checksum validation after each backup.

---

## 7. Audit Strategy

File: `server/src/db/repositories/audit.ts`

- Append-only logging
- Batch writes for performance (flush every 5 seconds or 100 entries)
- Tracks: actor, action, entity_type, entity_id, before/after data, meta, IP address
- Indexed by actor, action, entity, and created_at

---

## 8. Data Relationships

```
users ──1:N── sessions
users ──1:N── recovery_codes
users ──1:N── api_keys

brands ──1:N── products
categories ──1:N── products (parent)
categories ──1:N── categories (self-referencing)

products ──1:N── product_images
products ──1:N── order_items
products ──1:N── questions

customers ──1:N── addresses
customers ──1:N── orders
customers ──1:N── support_tickets
customers ──1:N── customer_loyalty

orders ──1:N── order_items
orders ──1:N── payments
orders ──1:N── returns
orders ──1:N── refunds
orders ──1:N── payment_intents

payment_intents ──1:N── payment_transactions
payment_intents ──1:N── payment_refunds
payment_intents ──1:N── payment_disputes
```
