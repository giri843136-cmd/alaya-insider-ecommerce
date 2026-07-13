# ALAYA INSIDER — Enterprise Payment Platform

> **Version**: 2.0.0 — Production Release 2
> **Last updated**: 2026-07-08

---

## 1. Overview

The Enterprise Payment Platform provides production-ready payment processing for Stripe, PayPal, Apple Pay, and Google Pay. It includes a webhook engine, fraud detection, finance reconciliation, and full PostgreSQL persistence.

### Architecture

```
Frontend (React)
    │ HTTP
    ▼
Payment Routes (Hono)
    │
    ├── PaymentProvider Interface
    │   ├── StripeProvider (Payment Intents API)
    │   ├── PayPalProvider (Orders API)
    │   ├── ApplePayProvider (via Stripe)
    │   └── GooglePayProvider (via Stripe)
    │
    ├── WebhookEngine
    │   ├── Signature Validation
    │   ├── Replay Protection (5min max age)
    │   ├── Duplicate Detection (dedup set)
    │   ├── Retry Logic (3x: 1min, 5min, 15min)
    │   └── Dead Letter Queue
    │
    ├── FraudEngine
    │   ├── 10 Signals: Velocity, IP, Geo, Device, Email, Phone, BIN, Amount, History, Failed Payments
    │   └── Risk Score: 0-100 (Low/Medium/High/Critical)
    │
    └── PaymentPersistence (PostgreSQL)
        ├── payment_intents
        ├── payment_transactions
        ├── payment_refunds
        ├── payment_disputes
        ├── webhook_deliveries
        ├── idempotency_keys
        ├── provider_health
        └── finance_reconciliation
```

---

## 2. Payment Providers

### 2.1 Stripe

| Feature | Implementation |
|---------|---------------|
| **SDK** | `stripe@22.3.0` |
| **API** | Payment Intents API with `automatic_payment_methods` |
| **Webhooks** | `payment_intent.*`, `charge.*`, `refund.*`, `dispute.*`, `checkout.session.*` |
| **Refunds** | Full and partial via Refunds API |
| **Disputes** | Detected via `charge.dispute.created` webhook |
| **3D Secure** | `requires_action` status with `next_action` handling |
| **Idempotency** | Stripe native idempotency keys |
| **Health Check** | `balance.retrieve()` — lightweight connectivity test |

**Configuration:**
```
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2.2 PayPal

| Feature | Implementation |
|---------|---------------|
| **SDK** | `@paypal/paypal-server-sdk@2.4.0` |
| **API** | Orders API with intent: CAPTURE |
| **Webhooks** | `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.*` |
| **Refunds** | Full and partial via Captures Refund API |
| **Signature** | RSA-SHA256 with PayPal public certificate |
| **Certificate** | Fetched from PayPal, cached for 1 hour |

**Webhook Verification (5 checks):**
1. Transmission ID present
2. Transmission Time not expired (>5min → reject)
3. Signature valid via RSA-SHA256
4. Cert URL from authorized PayPal host
5. Auth algorithm supported

**Configuration:**
```
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
```

### 2.3 Apple Pay / Google Pay

Both are implemented as thin wrappers around Stripe. They delegate all payment operations to Stripe with wallet-specific metadata for reporting.

---

## 3. Payment Flow

### 3.1 Standard Checkout

```
1. Customer submits checkout form
2. Frontend calls POST /payments/intent
3. Server creates PaymentIntent via provider
4. Provider returns client_secret / approval URL
5. Frontend confirms payment (Stripe Elements / PayPal popup)
6. Payment confirmed → Webhook received
7. Server processes: update order → record transaction → audit log
8. Customer redirected to confirmation page
```

### 3.2 Captured Authorization Flow

```
1. Payment authorized (amount reserved)
2. Server calls POST /payments/intent/:id/capture
3. Amount captured from customer
4. Order created, inventory reserved
5. Confirmation sent
```

---

## 4. Webhook Engine

### 4.1 Processing Pipeline

```
Receive Webhook
    │
    ├── 1. Replay Protection
    │   └── Event >5min old → Acknowledge, don't process
    │
    ├── 2. Duplicate Detection
    │   └── Already processed? → Return success, skip
    │
    ├── 3. Signature Validation
    │   ├── Stripe: constructEvent() with webhook secret
    │   └── PayPal: RSA-SHA256 with public certificate
    │
    ├── 4. Process Event
    │   ├── Map to action (payment.succeeded, charge.refunded, etc.)
    │   └── Extract orderId, paymentIntentId
    │
    ├── 5. Side Effects
    │   ├── Update order status
    │   ├── Send notification
    │   └── Audit log
    │
    └── 6. Persist to PostgreSQL
        └── Full headers, payload, signature, retry history
```

### 4.2 Retry Logic

| Attempt | Delay | Total |
|---------|-------|-------|
| 1st | 1 minute | 1 minute |
| 2nd | 5 minutes | 6 minutes |
| 3rd | 15 minutes | 21 minutes |
| Failed | → Dead Letter Queue | |

### 4.3 Dead Letter Queue

Entries in the dead letter queue can be manually retried via:
```
POST /api/v1/webhooks/dead-letter/:id/retry
```

---

## 5. Fraud Detection Engine

### 5.1 Signals (10 dimensions)

| # | Signal | Description | Weight |
|---|--------|-------------|--------|
| 1 | Velocity | Request frequency per IP | 15% |
| 2 | IP Reputation | VPN, proxy, TOR detection | 15% |
| 3 | Geolocation | High-risk country detection | 10% |
| 4 | Device | Headless browser, automation tools | 10% |
| 5 | Email | Disposable domains, random patterns | 15% |
| 6 | Phone | Fake numbers, repetitive digits | 10% |
| 7 | BIN | Card issuer country mismatch (placeholder) | 10% |
| 8 | Amount | High-value order thresholds | 5% |
| 9 | History | Chargeback history, excessive returns | 5% |
| 10 | Failed Payments | Multiple failed attempts | 5% |

### 5.2 Risk Levels

| Score | Level | Action |
|-------|-------|--------|
| 0-20 | Low | Auto-approve |
| 21-50 | Medium | Standard processing |
| 51-80 | High | Manual review required |
| 81-100 | Critical | Auto-reject |

### 5.3 Configuration

Review threshold: 51/100
Reject threshold: 81/100
High value threshold: $1,000
Max failed payments/hour: 3
Max orders/24h: 5

---

## 6. Finance Reconciliation

### 6.1 Comparison

The reconciliation engine compares:
- **Provider side**: Payment intents (amount, fees, refunds)
- **Database side**: Orders (total revenue), refunds, disputes

### 6.2 Discrepancy Detection

Differences > 1 cent are flagged as discrepancies:
- Revenue mismatch
- Refund mismatch
- Chargeback mismatch

---

## 7. Idempotency

All payment requests support idempotency keys:

| Operation | Key Pattern | TTL |
|-----------|-------------|-----|
| Create Payment Intent | `pi_{orderId}_{uuid}` | 24 hours |
| Refund | `ref_{paymentId}_{uuid}` | 24 hours |

Duplicate detection: If a key already exists with a successful result, the original result is returned instead of processing a new payment.

---

## 8. Security

| Requirement | Implementation |
|-------------|---------------|
| Card numbers stored? | **Never** — provider tokens only |
| CVV stored? | **Never** |
| Webhook secrets encrypted? | Read from env vars |
| API keys encrypted? | Read from env vars |
| Webhook signatures verified? | Stripe: HMAC-SHA256; PayPal: RSA-SHA256 |
| Idempotency enforced? | PostgreSQL-backed with 24h TTL |
| Admin access control? | RBAC — Super Admin only for payment configuration |

---

## 9. Payment States

```
pending
    │
    ├── requires_action (3DS / redirect)
    │
    ├── authorized → captured → paid
    │                          ├── partially_paid
    │                          ├── refund_pending → refunded / partially_refunded
    │                          ├── chargeback / disputed
    │                          └── failed / cancelled / expired
    │
    └── failed / cancelled / expired
```

---

## 10. Known Limitations

1. **Fraud engine not integrated** — `assessFraudRisk()` is never called from payment routes (manual step required)
2. **PayPal webhook headers** — Route needs to pass all 5 PayPal headers to verification (currently only passes transmission-id)
3. **Webhook dedup on restart** — `processedEventIds` (in-memory Set) is cleared on restart; should seed from PostgreSQL
4. **BIN database** — Fraud engine BIN check is a placeholder; requires third-party BIN/IIN data service
5. **No CRON jobs** — Finance reconciliation, idempotency cleanup, and health checks need scheduled execution
6. **Commerce routes** — Still use old in-memory store; need migration to PostgreSQL repositories
