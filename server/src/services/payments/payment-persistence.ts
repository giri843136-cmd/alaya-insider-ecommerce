/**
 * ALAYA INSIDER — Payment Persistence Layer
 * --------------------------------------------------------------------------
 * PostgreSQL persistence for all payment entities:
 *  - Payment Intents
 *  - Payment Transactions
 *  - Refunds
 *  - Disputes / Chargebacks
 *  - Webhook Deliveries (with full headers, payload, retry history)
 *  - Idempotency Records
 *  - Provider Health Snapshots
 *  - Payment Audit Logs
 *
 * All data survives server restart, deployment, crash, or rollback.
 */

import { query, queryOne, queryAll } from "../../db/index.js";
import { v4 as uuidv4 } from "uuid";

/* ================================================================== */
/*  PAYMENT INTENTS                                                    */
/* ================================================================== */

export interface PaymentIntentRecord {
  id: string;
  order_id: string;
  order_number: string;
  provider: string;
  provider_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
  metadata: Record<string, string>;
  idempotency_key?: string;
  refunded_amount: number;
  processor_fees: number;
  net_amount: number;
  payment_method_type?: string;
  payment_method_details?: Record<string, unknown>;
  billing_details?: Record<string, unknown>;
  error_message?: string;
  authorized_at?: Date;
  captured_at?: Date;
  paid_at?: Date;
  failed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export async function savePaymentIntent(record: Partial<PaymentIntentRecord>): Promise<PaymentIntentRecord> {
  const id = record.id || uuidv4();
  const now = new Date();

  const row = await queryOne<PaymentIntentRecord>(
    `INSERT INTO payment_intents (
      id, order_id, order_number, provider, provider_payment_id,
      amount, currency, status, client_secret, metadata, idempotency_key,
      refunded_amount, processor_fees, net_amount, payment_method_type,
      payment_method_details, billing_details, error_message,
      authorized_at, captured_at, paid_at, failed_at,
      created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
    ON CONFLICT (provider_payment_id) DO UPDATE SET
      status = EXCLUDED.status,
      refunded_amount = EXCLUDED.refunded_amount,
      processor_fees = EXCLUDED.processor_fees,
      net_amount = EXCLUDED.net_amount,
      error_message = EXCLUDED.error_message,
      updated_at = NOW()
    RETURNING *`,
    [
      id, record.order_id, record.order_number, record.provider, record.provider_payment_id,
      record.amount, record.currency || "USD", record.status || "pending", record.client_secret,
      JSON.stringify(record.metadata || {}), record.idempotency_key,
      record.refunded_amount || 0, record.processor_fees || 0, record.net_amount || 0,
      record.payment_method_type, record.payment_method_details ? JSON.stringify(record.payment_method_details) : null,
      record.billing_details ? JSON.stringify(record.billing_details) : null, record.error_message,
      record.authorized_at, record.captured_at, record.paid_at, record.failed_at,
      now, now,
    ],
  );

  if (!row) throw new Error("Failed to save payment intent");
  return row;
}

export async function getPaymentIntentByProviderId(providerPaymentId: string): Promise<PaymentIntentRecord | null> {
  return queryOne<PaymentIntentRecord>(
    "SELECT * FROM payment_intents WHERE provider_payment_id = $1",
    [providerPaymentId],
  );
}

export async function getPaymentIntentByOrderId(orderId: string): Promise<PaymentIntentRecord | null> {
  return queryOne<PaymentIntentRecord>(
    "SELECT * FROM payment_intents WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1",
    [orderId],
  );
}

export async function listPaymentIntents(limit = 50, offset = 0): Promise<PaymentIntentRecord[]> {
  return queryAll<PaymentIntentRecord>(
    "SELECT * FROM payment_intents ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
}

export async function updatePaymentIntentStatus(
  providerPaymentId: string,
  status: string,
  extra?: Partial<PaymentIntentRecord>,
): Promise<PaymentIntentRecord | null> {
  const sets: string[] = ["status = $2", "updated_at = NOW()"];
  const values: any[] = [providerPaymentId, status];
  let idx = 3;

  if (extra?.refunded_amount !== undefined) { sets.push(`refunded_amount = $${idx++}`); values.push(extra.refunded_amount); }
  if (extra?.processor_fees !== undefined) { sets.push(`processor_fees = $${idx++}`); values.push(extra.processor_fees); }
  if (extra?.net_amount !== undefined) { sets.push(`net_amount = $${idx++}`); values.push(extra.net_amount); }
  if (extra?.error_message !== undefined) { sets.push(`error_message = $${idx++}`); values.push(extra.error_message); }
  if (status === "paid" || status === "captured") { sets.push("paid_at = NOW()"); }
  if (status === "failed") { sets.push("failed_at = NOW()"); }

  return queryOne<PaymentIntentRecord>(
    `UPDATE payment_intents SET ${sets.join(", ")} WHERE provider_payment_id = $1 RETURNING *`,
    values,
  );
}

/* ================================================================== */
/*  TRANSACTIONS                                                       */
/* ================================================================== */

export interface TransactionRecord {
  id: string;
  payment_intent_id: string;
  order_id: string;
  order_number?: string;
  provider: string;
  provider_transaction_id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  processor_response?: string;
  processor_fee?: number;
  net_amount?: number;
  description?: string;
  metadata: Record<string, string>;
  created_at: Date;
}

export async function saveTransaction(record: Partial<TransactionRecord>): Promise<TransactionRecord> {
  const id = record.id || uuidv4();

  const row = await queryOne<TransactionRecord>(
    `INSERT INTO payment_transactions (
      id, payment_intent_id, order_id, order_number, provider,
      provider_transaction_id, type, amount, currency, status,
      processor_response, processor_fee, net_amount, description, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      id, record.payment_intent_id, record.order_id, record.order_number, record.provider,
      record.provider_transaction_id, record.type, record.amount, record.currency || "USD",
      record.status || "pending", record.processor_response, record.processor_fee || 0,
      record.net_amount, record.description, JSON.stringify(record.metadata || {}),
    ],
  );
  if (!row) throw new Error("Failed to save transaction");
  return row;
}

export async function listTransactions(
  orderId?: string,
  limit = 50,
  offset = 0,
): Promise<TransactionRecord[]> {
  if (orderId) {
    return queryAll<TransactionRecord>(
      "SELECT * FROM payment_transactions WHERE order_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [orderId, limit, offset],
    );
  }
  return queryAll<TransactionRecord>(
    "SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
}

/* ================================================================== */
/*  REFUNDS                                                           */
/* ================================================================== */

export interface RefundRecord {
  id: string;
  payment_intent_id: string;
  order_id: string;
  order_number?: string;
  provider_refund_id: string;
  amount: number;
  currency: string;
  reason?: string;
  notes?: string;
  status: string;
  metadata: Record<string, string>;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export async function saveRefund(record: Partial<RefundRecord>): Promise<RefundRecord> {
  const id = record.id || uuidv4();
  const now = new Date();

  const row = await queryOne<RefundRecord>(
    `INSERT INTO payment_refunds (
      id, payment_intent_id, order_id, order_number, provider_refund_id,
      amount, currency, reason, notes, status, metadata, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      id, record.payment_intent_id, record.order_id, record.order_number,
      record.provider_refund_id, record.amount, record.currency || "USD",
      record.reason, record.notes, record.status || "pending",
      JSON.stringify(record.metadata || {}), now, now,
    ],
  );
  if (!row) throw new Error("Failed to save refund");
  return row;
}

export async function listRefunds(orderId?: string, limit = 50): Promise<RefundRecord[]> {
  if (orderId) {
    return queryAll<RefundRecord>(
      "SELECT * FROM payment_refunds WHERE order_id = $1 ORDER BY created_at DESC LIMIT $2",
      [orderId, limit],
    );
  }
  return queryAll<RefundRecord>(
    "SELECT * FROM payment_refunds ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
}

export async function getTotalRefundedAmount(orderId: string): Promise<number> {
  const result = await queryOne<{ total: string }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_refunds WHERE order_id = $1 AND status = 'succeeded'",
    [orderId],
  );
  return Number(result?.total || 0);
}

/* ================================================================== */
/*  DISPUTES / CHARGEBACKS                                            */
/* ================================================================== */

export interface DisputeRecord {
  id: string;
  dispute_number: string;
  order_id?: string;
  order_number?: string;
  payment_intent_id?: string;
  provider_dispute_id: string;
  provider: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidence_submitted: boolean;
  evidence_data?: Record<string, unknown>;
  due_by?: Date;
  timeline: Array<{ action: string; detail: string; timestamp: number }>;
  metadata: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export async function saveDispute(record: Partial<DisputeRecord>): Promise<DisputeRecord> {
  const id = record.id || uuidv4();
  const now = new Date();

  const row = await queryOne<DisputeRecord>(
    `INSERT INTO payment_disputes (
      id, dispute_number, order_id, order_number, payment_intent_id,
      provider_dispute_id, provider, amount, currency, reason, status,
      evidence_submitted, evidence_data, due_by, timeline, metadata,
      created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT (provider_dispute_id) DO UPDATE SET
      status = EXCLUDED.status,
      evidence_submitted = EXCLUDED.evidence_submitted,
      timeline = EXCLUDED.timeline,
      updated_at = NOW()
    RETURNING *`,
    [
      id, record.dispute_number || `DSP-${Date.now().toString(36).toUpperCase()}`,
      record.order_id, record.order_number, record.payment_intent_id,
      record.provider_dispute_id, record.provider, record.amount, record.currency || "USD",
      record.reason, record.status || "needs_response",
      record.evidence_submitted || false,
      record.evidence_data ? JSON.stringify(record.evidence_data) : null,
      record.due_by, JSON.stringify(record.timeline || []),
      JSON.stringify(record.metadata || {}), now, now,
    ],
  );
  if (!row) throw new Error("Failed to save dispute");
  return row;
}

export async function listDisputes(status?: string, limit = 50): Promise<DisputeRecord[]> {
  if (status) {
    return queryAll<DisputeRecord>(
      "SELECT * FROM payment_disputes WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, limit],
    );
  }
  return queryAll<DisputeRecord>(
    "SELECT * FROM payment_disputes ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
}

export async function updateDisputeStatus(
  providerDisputeId: string,
  status: string,
): Promise<DisputeRecord | null> {
  return queryOne<DisputeRecord>(
    "UPDATE payment_disputes SET status = $2, updated_at = NOW() WHERE provider_dispute_id = $1 RETURNING *",
    [providerDisputeId, status],
  );
}

/* ================================================================== */
/*  WEBHOOK DELIVERIES                                                 */
/* ================================================================== */

export interface WebhookDeliveryRecord {
  id: string;
  provider: string;
  event_type: string;
  provider_event_id: string;
  status: string;
  payload: unknown;
  headers: Record<string, string>;
  signature: string;
  signature_valid: boolean;
  idempotent: boolean;
  processing_time_ms?: number;
  failure_reason?: string;
  retry_count: number;
  retry_history: Array<{ attemptedAt: number; status: string; error?: string }>;
  order_id?: string;
  payment_intent_id?: string;
  created_at: Date;
  updated_at: Date;
}

export async function saveWebhookDelivery(record: Partial<WebhookDeliveryRecord>): Promise<WebhookDeliveryRecord> {
  const id = record.id || uuidv4();
  const now = new Date();

  const row = await queryOne<WebhookDeliveryRecord>(
    `INSERT INTO webhook_deliveries (
      id, provider, event_type, provider_event_id, status,
      payload, headers, signature, signature_valid, idempotent,
      processing_time_ms, failure_reason, retry_count, retry_history,
      order_id, payment_intent_id, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT (provider_event_id) DO UPDATE SET
      status = EXCLUDED.status,
      retry_count = EXCLUDED.retry_count,
      retry_history = EXCLUDED.retry_history,
      failure_reason = EXCLUDED.failure_reason,
      updated_at = NOW()
    RETURNING *`,
    [
      id, record.provider, record.event_type, record.provider_event_id, record.status || "received",
      JSON.stringify(record.payload || {}), JSON.stringify(record.headers || {}),
      record.signature, record.signature_valid || false, record.idempotent || false,
      record.processing_time_ms, record.failure_reason, record.retry_count || 0,
      JSON.stringify(record.retry_history || []),
      record.order_id, record.payment_intent_id, now, now,
    ],
  );
  if (!row) throw new Error("Failed to save webhook delivery");
  return row;
}

export async function listWebhookDeliveries(
  provider?: string,
  status?: string,
  limit = 100,
  offset = 0,
): Promise<WebhookDeliveryRecord[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (provider) { conditions.push(`provider = $${idx++}`); values.push(provider); }
  if (status) { conditions.push(`status = $${idx++}`); values.push(status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(limit);
  values.push(offset);

  return queryAll<WebhookDeliveryRecord>(
    `SELECT * FROM webhook_deliveries ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    values,
  );
}

export async function getWebhookDeliveryStats(): Promise<{
  total: number;
  processed: number;
  failed: number;
  byProvider: Record<string, number>;
  byEventType: Record<string, number>;
}> {
  const total = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM webhook_deliveries");
  const processed = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM webhook_deliveries WHERE status = 'processed'");
  const failed = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM webhook_deliveries WHERE status = 'failed' OR status = 'dead_letter'");

  const byProviderRows = await queryAll<{ provider: string; count: string }>(
    "SELECT provider, COUNT(*) as count FROM webhook_deliveries GROUP BY provider",
  );
  const byEventTypeRows = await queryAll<{ event_type: string; count: string }>(
    "SELECT event_type, COUNT(*) as count FROM webhook_deliveries GROUP BY event_type ORDER BY count DESC LIMIT 20",
  );

  const byProvider: Record<string, number> = {};
  const byEventType: Record<string, number> = {};
  for (const r of byProviderRows) byProvider[r.provider] = Number(r.count);
  for (const r of byEventTypeRows) byEventType[r.event_type || "unknown"] = Number(r.count);

  return {
    total: Number(total?.count || 0),
    processed: Number(processed?.count || 0),
    failed: Number(failed?.count || 0),
    byProvider,
    byEventType,
  };
}

/* ================================================================== */
/*  IDEMPOTENCY KEY STORAGE                                            */
/* ================================================================== */

export interface IdempotencyKeyRecord {
  id: string;
  key: string;
  result: Record<string, unknown>;
  response_status: number;
  expires_at: Date;
  created_at: Date;
}

export async function getIdempotencyResult(key: string): Promise<IdempotencyKeyRecord | null> {
  return queryOne<IdempotencyKeyRecord>(
    "SELECT * FROM idempotency_keys WHERE key = $1 AND expires_at > NOW()",
    [key],
  );
}

export async function saveIdempotencyResult(
  key: string,
  result: Record<string, unknown>,
  responseStatus: number,
  ttlMs = 86_400_000, // 24 hours default
): Promise<IdempotencyKeyRecord> {
  const row = await queryOne<IdempotencyKeyRecord>(
    `INSERT INTO idempotency_keys (key, result, response_status, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '1 millisecond' * $4)
     ON CONFLICT (key) DO NOTHING
     RETURNING *`,
    [key, JSON.stringify(result), responseStatus, ttlMs],
  );
  if (!row) throw new Error("Idempotency key already exists");
  return row;
}

export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  const result = await query(
    "DELETE FROM idempotency_keys WHERE expires_at < NOW()",
  );
  return result.rowCount || 0;
}

/* ================================================================== */
/*  PROVIDER HEALTH SNAPSHOTS                                         */
/* ================================================================== */

export interface ProviderHealthRecord {
  id: string;
  provider: string;
  healthy: boolean;
  message: string;
  latency_ms: number;
  recorded_at: Date;
}

export async function saveProviderHealthSnapshot(
  provider: string,
  healthy: boolean,
  message: string,
  latencyMs: number,
): Promise<ProviderHealthRecord> {
  const row = await queryOne<ProviderHealthRecord>(
    `INSERT INTO provider_health (provider, healthy, message, latency_ms)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [provider, healthy, message, latencyMs],
  );
  if (!row) throw new Error("Failed to save provider health snapshot");
  return row;
}

export async function getLatestProviderHealth(provider: string): Promise<ProviderHealthRecord | null> {
  return queryOne<ProviderHealthRecord>(
    "SELECT * FROM provider_health WHERE provider = $1 ORDER BY recorded_at DESC LIMIT 1",
    [provider],
  );
}

export async function getProviderHealthHistory(
  provider: string,
  hours = 24,
): Promise<ProviderHealthRecord[]> {
  return queryAll<ProviderHealthRecord>(
    "SELECT * FROM provider_health WHERE provider = $1 AND recorded_at > NOW() - INTERVAL '1 hour' * $2 ORDER BY recorded_at DESC",
    [provider, hours],
  );
}

/* ================================================================== */
/*  FINANCE / RECONCILIATION                                           */
/* ================================================================== */

export interface FinanceReconciliationRecord {
  id: string;
  period_start: Date;
  period_end: Date;
  provider_revenue: number;
  provider_fees: number;
  provider_refunds: number;
  provider_chargebacks: number;
  db_revenue: number;
  db_refunds: number;
  db_chargebacks: number;
  revenue_difference: number;
  refund_difference: number;
  status: string;
  discrepancies: Array<{ type: string; description: string; amount: number }>;
  reconciled_at: Date;
}

export async function runReconciliation(
  periodStart: Date,
  periodEnd: Date,
): Promise<FinanceReconciliationRecord> {
  // Aggregate from payment_intents
  const providerStats = await queryOne<{
    revenue: string; fees: string; refunds: string;
  }>(
    `SELECT
      COALESCE(SUM(amount), 0) as revenue,
      COALESCE(SUM(processor_fees), 0) as fees,
      COALESCE(SUM(refunded_amount), 0) as refunds
     FROM payment_intents
     WHERE created_at >= $1 AND created_at <= $2`,
    [periodStart, periodEnd],
  );

  // Aggregate from refunds
  const refundStats = await queryOne<{ total: string }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_refunds WHERE created_at >= $1 AND created_at <= $2 AND status = 'succeeded'",
    [periodStart, periodEnd],
  );

  // Aggregate from disputes
  const disputeStats = await queryOne<{ total: string }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_disputes WHERE created_at >= $1 AND created_at <= $2 AND status IN ('needs_response', 'under_review', 'lost')",
    [periodStart, periodEnd],
  );

  // Aggregate from orders (DB side)
  const orderStats = await queryOne<{ revenue: string }>(
    "SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE created_at >= $1 AND created_at <= $2 AND status NOT IN ('cancelled', 'refunded')",
    [periodStart, periodEnd],
  );

  const providerRevenue = Number(providerStats?.revenue || 0);
  const dbRevenue = Number(orderStats?.revenue || 0);
  const providerRefunds = Number(refundStats?.total || 0);
  const dbChargebacks = Number(disputeStats?.total || 0);

  const discrepancies: Array<{ type: string; description: string; amount: number }> = [];

  const revenueDiff = providerRevenue - dbRevenue;
  if (Math.abs(revenueDiff) > 1) { // > 1 cent difference
    discrepancies.push({
      type: "revenue_mismatch",
      description: `Provider revenue $${(providerRevenue / 100).toFixed(2)} vs DB revenue $${(dbRevenue / 100).toFixed(2)}`,
      amount: revenueDiff,
    });
  }

  const status = discrepancies.length === 0 ? "matched" : "unmatched";

  const row = await queryOne<FinanceReconciliationRecord>(
    `INSERT INTO finance_reconciliation (
      period_start, period_end,
      provider_revenue, provider_fees, provider_refunds, provider_chargebacks,
      db_revenue, db_refunds, db_chargebacks,
      revenue_difference, refund_difference,
      status, discrepancies
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      periodStart, periodEnd,
      providerRevenue, Number(providerStats?.fees || 0), providerRefunds, dbChargebacks,
      dbRevenue, 0, dbChargebacks,
      revenueDiff, 0,
      status, JSON.stringify(discrepancies),
    ],
  );
  if (!row) throw new Error("Failed to save reconciliation record");
  return row;
}

export async function listReconciliations(limit = 20): Promise<FinanceReconciliationRecord[]> {
  return queryAll<FinanceReconciliationRecord>(
    "SELECT * FROM finance_reconciliation ORDER BY reconciled_at DESC LIMIT $1",
    [limit],
  );
}
