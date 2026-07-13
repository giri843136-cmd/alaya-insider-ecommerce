# ALAYA INSIDER — Bug Tracker

> **Last updated**: 2026-07-08
> **Phase**: Production Release 2 — Enterprise Payment Platform

---

## Resolved Issues

| ID | Description | Root Cause | Files Changed | Solution | Verification |
|----|-------------|------------|---------------|----------|-------------|
| BUG-001 | TS4094: Protected properties in exported anonymous class | BaseRepository used `protected` properties, but anonymous class exports require public accessibility | `server/src/db/repositories/base.ts` | Changed `protected` to `public` for all properties (`tableName`, `primaryKey`, etc.) and methods (`genId`, `quote`) | ✅ TypeScript compiles clean |
| BUG-002 | TS2322: null assignment from queryOne to non-nullable types | `queryOne` returns `T \| null` but functions returned `Promise<T>` | `server/src/services/payments/payment-persistence.ts` | Added null checks with throw for all `queryOne` calls in `savePaymentIntent`, `saveTransaction`, `saveRefund`, `saveDispute`, `saveWebhookDelivery`, `saveIdempotencyResult`, `saveProviderHealthSnapshot`, `runReconciliation` | ✅ TypeScript compiles clean |
| BUG-003 | SQL parameter bug in listWebhookDeliveries | OFFSET parameter used `$${idx}` instead of `$${idx++}`, always referencing same parameter as LIMIT+1 | `server/src/services/payments/payment-persistence.ts` | Changed `$${idx}` to `$${idx++}` for LIMIT and OFFSET parameters | ✅ Code review confirmed |
| BUG-004 | Memory leak in fraud engine IP tracking | `recentIpSet` stored unbounded arrays per IP | `server/src/services/payments/fraud.ts` | Added cap of 100 entries per IP with array truncation | ✅ Code review confirmed |
| BUG-005 | Missing Link import in AdminPaymentSettings | Used `<Link>` without importing from react-router-dom | `src/pages/admin/AdminPaymentSettings.tsx` | Added `import { Link } from "react-router-dom"` | ✅ Build verified |
| BUG-006 | PayPal webhook verification stubbed to always return true | Placeholder implementation returned `true` without verification | `server/src/services/payments/paypal.ts` | Replaced with real `verifyPayPalWebhook()` call using RSA-SHA256 | ✅ Code review confirmed |

---

## Open Issues

| ID | Priority | Description | Status | Next Action |
|----|----------|-------------|--------|-------------|
| BUG-007 | Medium | Fraud engine not wired into payment flow — `assessFraudRisk()` never called from routes | 🔍 Open | Add fraud check to `POST /payments/intent` route handler |
| BUG-008 | Low | PayPal webhook headers not fully passed — route only extracts `paypal-transmission-id` as signature parameter | 🔍 Open | Update `routes/payments.ts` PayPal webhook handler to extract all 5 PayPal headers and pass to `verifyPayPalWebhook()` |
| BUG-009 | Low | Webhook engine dedup state lost on restart — `processedEventIds` (in-memory Set) cleared on each restart | 🔍 Open | Seed `processedEventIds` from recent `webhook_deliveries` records on engine initialization |
| BUG-010 | Low | Commerce routes still use old in-memory `getStore()` instead of PostgreSQL repositories | 🔍 Open | Migrate all route handlers to use PostgreSQL repositories |
| BUG-011 | Low | Finance reconciliation not wired to any route — `runReconciliation()` exists but never called | 🔍 Open | Update `/payments/finance/reconciliation` endpoint to call `runReconciliation()` |
| BUG-012 | Low | Missing BIN database integration — fraud engine `checkBin()` returns 0 always | 🔍 Open | Integrate third-party BIN/IIN database lookup service |

---

## Bug Legend

| Status | Meaning |
|--------|---------|
| ✅ Resolved | Fixed and verified |
| 🔍 Open | Identified, not yet fixed |
| 🔄 In Progress | Currently being fixed |
| ❌ Won't Fix | Will not be addressed |
