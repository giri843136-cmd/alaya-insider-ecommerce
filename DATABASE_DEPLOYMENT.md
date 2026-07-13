# ALAYA INSIDER — Database Deployment Guide v2.0.0

> **Last updated**: 2026-07-10

---

## 1. Overview

| Attribute | Value |
|-----------|-------|
| **Database** | PostgreSQL 15+ |
| **Driver** | `pg` (node-postgres) v8.22.0 |
| **Connection Pool** | Configurable (default: 20 connections) |
| **Migration Tool** | Custom runner (`src/db/migrate.ts`) |
| **Seed Tool** | Custom seeder (`src/db/seed.ts`) |
| **Tables** | 45+ normalized tables with UUIDs, FKs, and indexes |

---

## 2. Provisioning

### 2.1 Railway (Recommended)

1. Go to Railway Dashboard → New → Database → PostgreSQL
2. Railway auto-generates `DATABASE_URL` and injects it as an environment variable
3. No manual configuration needed — the server reads `DATABASE_URL` automatically

### 2.2 External Hosting (Aiven, DigitalOcean, AWS RDS)

```bash
# Create database
createdb alaya_insider_prod

# Create user with secure password
CREATE USER alaya_admin WITH ENCRYPTED PASSWORD '<secure-password>';
GRANT ALL PRIVILEGES ON DATABASE alaya_insider_prod TO alaya_admin;
```

Then set `DATABASE_URL` in Railway Dashboard → Variables:

```
DATABASE_URL=postgresql://alaya_admin:<password>@<host>:5432/alaya_insider_prod?sslmode=require
```

---

## 3. Migration Order

Migrations run automatically on server startup via `index.ts`:
```typescript
await runMigrations();   // Applies schema.sql
await runSeedMigration(); // Seeds data (if tables empty)
```

### 3.1 Manual Execution

```bash
cd server

# View migration status
npx tsx src/db/migrate.ts status

# Apply pending migrations
npx tsx src/db/migrate.ts up

# Rollback last migration
npx tsx src/db/migrate.ts down

# Seed data (inserts if tables empty)
npx tsx src/db/seed.ts

# Reset database (DANGER: drops all tables and re-creates)
npx tsx src/db/migrate.ts reset
```

### 3.2 Rollback Order

The migration runner supports:
- **`down`**: Rolls back the last applied migration
- Only removes the migration record if no rollback SQL exists
- Tables are NOT dropped during normal rollback (safety)

Full rollback procedure:
```bash
# 1. Check current state
npx tsx src/db/migrate.ts status

# 2. Rollback if needed
npx tsx src/db/migrate.ts down

# 3. Re-apply
npx tsx src/db/migrate.ts up
```

---

## 4. Seed Data

### 4.1 What Gets Seeded

| Entity | Count (approx) | Description |
|--------|---------------|-------------|
| Products | 50+ | Demo products with prices, images, reviews |
| Categories | 8 | Fashion, Home, Tech, etc. |
| Brands | 12 | Demo brands |
| Orders | 20+ | Sample orders with statuses |
| Customers | 8 | Sample customer accounts |
| Articles | 6 | Journal articles |
| Coupons | 4 | Discount codes |
| Suppliers | 6 | Sample supplier records |
| Admin User | 1 | Default admin (alayainsider@gmail.com) |

### 4.2 Production

Set `SEED_ON_STARTUP=false` in production to prevent re-seeding on every restart.

```env
SEED_ON_STARTUP=false
```

---

## 5. Indexes

All indexes are defined in `src/db/schema.sql` and applied automatically. Key indexes:

| Table | Index Type | Columns | Purpose |
|-------|-----------|---------|---------|
| products | B-tree, GIN | slug, name(gin), category_id, brand_id, status, tags, sku, price, created_at | Search, browse, filter, sort |
| products | Partial | featured, best_seller | Landing page queries |
| orders | B-tree | number, customer_id, status, created_at, customer_email, total | Order lookup, customer history |
| customers | B-tree, GIN | email, name(gin), referral_code, created_at | Login, search, segmentation |
| articles | B-tree, GIN | slug, author_id, category, published_at, title(gin), tags(gin) | Content discovery |
| audit_logs | B-tree | actor, action, entity_type+entity_id, created_at | Audit trail queries |
| jobs | B-tree | status, type, priority, scheduled_at, created_at | Job processing |

---

## 6. Constraints

### 6.1 Foreign Keys

All foreign keys use `ON DELETE` policies:

| Policy | Usage |
|--------|-------|
| `CASCADE` | Child tables (order_items, sessions, addresses, etc.) |
| `SET NULL` | Optional references (brand_id on products, author_id on articles) |
| `RESTRICT` | Critical references (category_id on products) |

### 6.2 Unique Constraints

| Table | Column(s) |
|-------|-----------|
| users | email |
| brands | slug |
| categories | slug |
| products | slug |
| orders | number |
| coupons | code |
| articles | slug |
| returns | number |
| settings | key |
| purchase_orders | number |
| support_tickets | number |
| shipments | number |

---

## 7. Connection Pool Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max` | 20 | Maximum concurrent connections |
| `idleTimeoutMillis` | 30,000 | Close idle connections after 30s |
| `connectionTimeoutMillis` | 10,000 | Connection timeout |
| `application_name` | `alaya-insider-api-{env}` | Monitoring identifier |

Tuning for production:
```env
DB_MAX_CONNECTIONS=20        # Adjust based on Railway plan
DB_IDLE_TIMEOUT=30000        # 30 seconds
DB_CONNECT_TIMEOUT=10000     # 10 seconds
```

---

## 8. Backup Strategy

| Type | Frequency | Retention | Command |
|------|-----------|-----------|---------|
| Manual | On demand | 30 days | Scheduler trigger |
| Daily | Every 24 hours | 7 days | Automated |
| Weekly | Every 7 days | 30 days | Automated |
| Monthly | Every 30 days | 365 days | Automated |

Backups are stored in the `backups` table with checksum verification.

---

## 9. Troubleshooting

### 9.1 Connection Issues

```bash
# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check if PostgreSQL is running
pg_isready -h localhost -p 5432
```

### 9.2 Migration Failures

```bash
# Check migration status
npx tsx src/db/migrate.ts status

# View last error in server logs
railway logs --service api

# Manual fix if needed
npx tsx src/db/migrate.ts reset   # Drops ALL tables — use with caution
npx tsx src/db/migrate.ts up      # Re-apply all migrations
```

### 9.3 Seed Issues

```bash
# Force re-seed (drops existing data that matches)
npx tsx src/db/seed.ts
```

---

## 10. Verification Checklist

- [ ] Database is reachable: `curl /api/v1/system/health` → `"status":"healthy"`
- [ ] All 45+ tables exist: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`
- [ ] Indexes are created: `SELECT * FROM pg_indexes WHERE schemaname = 'public'`
- [ ] Foreign keys are enforced: `SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'`
- [ ] Migration status is clean: `npx tsx src/db/migrate.ts status`
- [ ] Hibernate/extensions: `SELECT * FROM pg_extension`
- [ ] No dead connections: `SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction'`
