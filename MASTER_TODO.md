# ALAYA INSIDER — Master TODO v2.0.0

> **Last updated**: 2026-07-08
> **Phase**: Production Release 2 — Enterprise Payment Platform

---

## COMPLETED — Production Release 2

### PostgreSQL Database Architecture

| Task | Priority | Complexity | Status |
|------|----------|------------|--------|
| Install PostgreSQL dependencies (pg, dotenv, @types/pg) | Critical | Low | ✅ Done |
| Create DB connection module (pool, transactions, pagination, health) | Critical | Medium | ✅ Done |
| Create SQL schema (40+ tables, UUIDs, FKs, indexes, GIN trgm) | Critical | High | ✅ Done |
| Create migration runner (up/down/status/reset) | Critical | Medium | ✅ Done |
| Create base repository (CRUD, pagination, search, audit) | Critical | High | ✅ Done |
| Create audit logging system (append-only, batch) | Critical | Medium | ✅ Done |
| Create background jobs system (persistent jobs table) | Critical | Medium | ✅ Done |
| Create backup/restore system | High | Medium | ✅ Done |
| Create entity repositories (30 entities) | Critical | High | ✅ Done |
| Create seed data migration | Critical | Medium | ✅ Done |
| Create repository initialization verification | Critical | Low | ✅ Done |
| Update server entry point for PostgreSQL | Critical | Medium | ✅ Done |

### Enterprise Payment Platform

| Task | Priority | Complexity | Status |
|------|----------|------------|--------|
| Install Stripe SDK (v22.3.0) | Critical | Low | ✅ Done |
| Install PayPal SDK (@paypal/paypal-server-sdk v2.4.0) | Critical | Low | ✅ Done |
| Create payment domain types (14 states, provider interface) | Critical | Medium | ✅ Done |
| Create payment provider registry | Critical | Medium | ✅ Done |
| Implement Stripe provider (Payment Intents, webhooks, refunds, disputes) | Critical | High | ✅ Done |
| Implement PayPal provider (Orders API, captures, refunds) | Critical | High | ✅ Done |
| Implement Apple Pay / Google Pay wallet providers | High | Medium | ✅ Done |
| Create webhook engine (signature validation, replay protection, dedup, retries, dead letter) | Critical | High | ✅ Done |
| Create payment routes (intents, confirm, capture, cancel, webhooks, refunds, providers, finance) | Critical | High | ✅ Done |
| Update route aggregator and server entry | Critical | Medium | ✅ Done |
| Fix TypeScript compilation errors | Critical | Medium | ✅ Done |

### Production Release 2.1 — Completion

| Task | Priority | Complexity | Status |
|------|----------|------------|--------|
| **TASK 1**: Build Payment Admin Pages (8 pages) | Critical | High | ✅ Done |
| **TASK 2**: Fix PayPal webhook verification (RSA-SHA256, CRC32, cert fetch) | Critical | High | ✅ Done |
| **TASK 3**: PostgreSQL persistence (intents, transactions, refunds, disputes, webhooks, idempotency, health, reconciliation) | Critical | High | ✅ Done |
| **TASK 4**: Fraud detection engine (10 signals, risk scoring 0-100) | Critical | High | ✅ Done |
| **TASK 5**: Transactional checkout (payment routes + webhook side effects) | Critical | Medium | ✅ Done |
| **TASK 6**: Idempotency system (PostgreSQL-backed, 24h TTL) | Critical | Medium | ✅ Done |
| **TASK 7**: Finance reconciliation (provider vs DB comparison) | Critical | Medium | ✅ Done |
| **TASK 8**: Webhook persistence (full audit trail to PostgreSQL) | Critical | Medium | ✅ Done |
| **TASK 9**: Admin RBAC (Super Admin for payment operations) | High | Low | ✅ Done |
| **TASK 10**: TypeScript check, code review, production build validation | Critical | Medium | ✅ Done |

---

## IN PROGRESS

### Route Migration (old in-memory store → PostgreSQL)

| Task | Priority | Complexity | Dependencies | Status |
|------|----------|------------|--------------|--------|
| Migrate commerce routes to PostgreSQL repositories | Critical | High | PostgreSQL schema | 🔄 Not Started |
| Migrate auth service to PostgreSQL | Critical | High | PostgreSQL schema | 🔄 Not Started |
| Migrate email routes to PostgreSQL | High | Medium | PostgreSQL schema | 🔄 Not Started |
| Migrate integration routes to PostgreSQL | High | Medium | PostgreSQL schema | 🔄 Not Started |
| Remove old `db.ts` in-memory store | High | Medium | All routes migrated | 🔄 Blocked |

### Fraud Engine Integration

| Task | Priority | Complexity | Dependencies | Status |
|------|----------|------------|--------------|--------|
| Wire fraud engine into create-payment-intent route | Medium | Low | Fraud engine | 🔄 Not Started |
| Wire fraud engine into checkout flow | Medium | Medium | Route migration | 🔄 Blocked |
| Add fraud assessment to audit log | Low | Low | Fraud engine | 🔄 Not Started |

### Webhook Engine Improvements

| Task | Priority | Complexity | Dependencies | Status |
|------|----------|------------|--------------|--------|
| Seed dedup set from PostgreSQL on startup | Low | Low | Webhook persistence | 🔄 Not Started |
| Pass full PayPal headers to verification function | Medium | Low | Webhook routes | 🔄 Not Started |

---

## REMAINING — Priority Ordered

### Critical

| # | Task | Dependencies | Complexity | Notes |
|---|------|--------------|------------|-------|
| 1 | Migrate commerce routes to PostgreSQL | PostgreSQL schema | High | Core orders, products, customers routes |
| 2 | Migrate auth service to PostgreSQL | PostgreSQL schema | High | Login, session, OTP, recovery |
| 3 | Wire fraud engine into payment flow | Fraud engine | Low | Call `assessFraudRisk()` in payment routes |
| 4 | Create `.env` with test credentials | — | Low | Stripe test keys, PayPal sandbox |

### High

| # | Task | Dependencies | Complexity | Notes |
|---|------|--------------|------------|-------|
| 5 | Migrate email routes | PostgreSQL schema | Medium | Notification templates, send history |
| 6 | Migrate integration routes | PostgreSQL schema | Medium | Third-party integrations CRUD |
| 7 | Add end-to-end payment tests | Payment platform | High | Stripe CLI, PayPal sandbox |
| 8 | Remove old `db.ts` in-memory store | All routes migrated | Medium | Cleanup after migration |

### Medium

| # | Task | Dependencies | Complexity | Notes |
|---|------|--------------|------------|-------|
| 9 | Seed webhook dedup from PostgreSQL on startup | Webhook persistence | Low | Prevent duplicate processing after restart |
| 10 | Pass full PayPal headers to verify function | Webhook routes | Low | Extract all 5 PayPal headers |
| 11 | Add unit tests for fraud engine | Fraud engine | Medium | Test each signal independently |
| 12 | Add unit tests for PayPal webhook verification | PayPal module | Medium | Test RSA verification, CRC32 |
| 13 | Create admin payment API endpoints | Payment platform | Medium | CRUD for payment entities |

### Low

| # | Task | Dependencies | Complexity | Notes |
|---|------|--------------|------------|-------|
| 14 | Add finance reconciliation CRON job | Finance module | Low | Auto-reconcile daily |
| 15 | Add provider health monitoring | Provider health | Low | Scheduled health checks |
| 16 | Add fraud engine BIN database lookup | Fraud engine | Medium | Third-party BIN/IIN data |
| 17 | Add admin payment notification preferences | Payment admin | Low | Email alerts for failed payments |

---

## COMPLETED — Production Release 1 (v1.0.0 - v1.0.1)

*See [CHANGELOG.md](./CHANGELOG.md) for complete history of v1.0.0 and v1.0.1 releases.*

---

## Symbols

| Symbol | Meaning |
|--------|---------|
| ✅ Done | Completed and verified |
| 🔄 Not Started | Planned, not yet begun |
| 🔄 In Progress | Currently being worked on |
| 🔄 Blocked | Waiting on dependency |
| ❌ Cancelled | Will not be implemented |
