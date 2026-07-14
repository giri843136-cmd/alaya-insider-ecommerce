# ALAYA INSIDER — Next Task

> **Generated**: 2026-07-14 (Session 3 — PostgreSQL Fully Operational)
> **Type**: 🐛 Bug Fix — Seed Data Migration
> **Priority**: 🔴 Critical
> **Status**: ✅ PostgreSQL installed & running — ⏳ Non-core seed entities failing

---

## Task: Fix Remaining Seed Data Failures

### Session 3 Completed

| Milestone | Result |
|----------|--------|
| PostgreSQL 16.4 installed | ✅ C:\pg with data at C:\pgdata |
| PostgreSQL running | ✅ Port 5432, accepting connections |
| Database created | ✅ alaya_insider_dev with UTF8 encoding |
| Schema migration | ✅ 92 tables created |
| Core seed data | ✅ **34 products, 8 categories, 8 brands, settings, admin** |
| .env created | ✅ 13 vars with 4 generated crypto secrets |
| .env.example created | ✅ 19 sections, comprehensive reference |
| Critical env warnings | ✅ **0 critical** (down from 3) |
| TypeScript | ✅ **0 errors** (both frontend + backend) |
| Seed bugs fixed | ✅ UUID validation, TEXT[] arrays, UTF8 encoding |

### Current Blocker

**71 seed errors** across non-core entities. These entities have **0 rows inserted**:
- `suppliers` — 8 errors
- `payment_gateways` — 5 errors
- `orders` — 5 errors
- `coupons` — 5 errors
- `articles` — 5 errors
- `customers` — 9 errors
- `returns` — 1 error
- `redirects` — 2 errors
- `popups` — 3 errors
- `affiliates` — 5 errors
- `affiliate_networks` — 7 errors
- `loyalty_tiers` — 4 errors
- `live_sales` — 5 errors
- `shipping_carriers` — 7 errors

The core entities (products, categories, brands, settings, admin_user) all seeded with 0 errors.

### Root Cause Analysis Needed

Likely causes:
1. **FK dependency ordering** — orders reference products/customers, suppliers have FK chains
2. **Non-UUID ID references** — suppliers, gateways, etc. may reference IDs from seed data that don't exist as UUIDs
3. **TEXT[] array formatting** — other seed functions may have the same JSON.stringify issue on TEXT[] columns
4. **Missing prerequisite data** — some entities might depend on data that wasn't seeded yet

### Verify Backend Startup Script

```bash
cd server
npm run dev

# Test endpoints (requires server running)
curl http://localhost:3001/api/v1/system/health
curl http://localhost:3001/api/v1/catalog/products?page=1&pageSize=5
curl -X POST http://localhost:3001/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alayainsider@gmail.com","password":"Alaya@1923"}'
```

### Acceptance Criteria

1. All seed entities (suppliers, orders, customers, etc.) insert with 0 errors
2. Product/category FK references resolve correctly
3. GET /api/v1/catalog/products returns paginated results
4. Admin login works via POST /api/v1/auth/admin/login

### Files to Investigate

| File | Issue |
|------|-------|
| `server/src/db/seed.ts` | seedSuppliers, seedGateways, seedOrders, etc. may have similar array/encoding bugs |
| `server/src/lib/seed-data.ts` (frontend) | Raw seed data with non-standard IDs and content |

### Estimated Time

**1-2 hours** to trace and fix all remaining seed failures.
