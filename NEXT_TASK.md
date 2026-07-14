# ALAYA INSIDER — Next Task

> **Generated**: 2026-07-14 (Final Production Certification)
> **Type**: 🚀 Production Launch — Add Stripe API Keys & Verify Payment Flow
> **Priority**: 🔴 Critical — Blocks all commerce features
> **Status**: ⏳ Blocked by external dependency (Stripe account credentials)

---

## Task: Configure Stripe Payments for Production

### Objective

Create a Stripe account, obtain the required API keys, configure them in `server/.env`, and verify that the full payment flow (checkout → payment intent → webhook → fulfillment) completes successfully.

### Files to Modify

| File | Action |
|------|--------|
| `server/.env` | Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |

### Dependencies

1. Stripe account (https://dashboard.stripe.com/register)
2. Stripe webhook endpoint configured for the production URL

### Acceptance Criteria

- [ ] `POST /api/v1/payments/intents` returns a valid Stripe client secret
- [ ] Test card payment completes in Stripe dashboard
- [ ] Stripe webhook received and verified by `server/src/services/payments/webhooks.ts`
- [ ] Payment intent status updates correctly in PostgreSQL
- [ ] `GET /api/v1/system/health` shows `"stripe": "connected"`
- [ ] Server starts with 0 critical env warnings

### Verification Steps

1. Create Stripe account at https://dashboard.stripe.com/register
2. Copy `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` from Stripe Dashboard → Developers → API Keys
3. Set up a Stripe webhook endpoint pointing to `https://[your-domain]/api/v1/payments/webhooks/stripe` with events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy the `STRIPE_WEBHOOK_SECRET` (signing secret) from the webhook endpoint settings
5. Add all three values to `server/.env`
6. Restart the server (`cd server && npm run dev`) and confirm 0 critical env warnings on startup
7. Verify health endpoint shows `"stripe": "connected"` via `GET /api/v1/system/health`
8. Test a payment intent via `POST /api/v1/payments/intents` — expect a valid client secret in response

### Estimated Time

**15 minutes** — account creation + key configuration + one test transaction
