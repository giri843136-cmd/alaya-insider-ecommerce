/**
 * ALAYA INSIDER — Shipping & Logistics Routes (PR-5)
 * --------------------------------------------------------------------------
 * Complete REST API for the Enterprise Shipping & Logistics Platform.
 * Mounted at /api/v1/shipping
 */

import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../db/index.js";
import {
  shippingCarriers, shippingProfiles, shippingRates,
  shipments, shipmentEvents, shippingLabels, deliveryConfirmations,
  carrierHealth, shippingRules, shippingQuotes,
} from "../db/repositories/index.js";
import {
  validateAddress, calculateRates, generateLabel, createShipment,
  trackShipment, refreshTracking, checkCarrierHealth,
  evaluateShippingRules, getDeliveryAnalytics,
} from "../services/shippingEngine.js";

const shipping = new Hono();

/* ================================================================== */
/*  CARRIERS                                                           */
/* ================================================================== */

shipping.get("/carriers", async (c) => {
  const result = await shippingCarriers.list(c.req.query() as any);
  return c.json(result);
});

shipping.get("/carriers/active", async (c) => {
  const result = await shippingCarriers.getActive();
  return c.json(result);
});

shipping.get("/carriers/:id", async (c) => {
  const item = await shippingCarriers.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Carrier not found" }, 404);
  return c.json(item);
});

shipping.post("/carriers", async (c) => {
  const body = await c.req.json<any>();
  const carrier = await shippingCarriers.create(body as any, "api");
  return c.json(carrier, 201);
});

shipping.patch("/carriers/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await shippingCarriers.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Carrier not found" }, 404);
  return c.json(updated);
});

shipping.delete("/carriers/:id", async (c) => {
  const ok = await shippingCarriers.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Carrier not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  CARRIER HEALTH                                                     */
/* ================================================================== */

shipping.post("/carriers/:id/health-check", async (c) => {
  const result = await checkCarrierHealth(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Carrier not found" }, 404);
  return c.json(result);
});

shipping.get("/carriers/:id/health", async (c) => {
  const result = await carrierHealth.getLatest(c.req.param("id"));
  return c.json(result || { healthy: true, status: "unknown" });
});

shipping.get("/health/unhealthy", async (c) => {
  const result = await carrierHealth.getUnhealthy();
  return c.json(result);
});

/* ================================================================== */
/*  SHIPPING PROFILES                                                  */
/* ================================================================== */

shipping.get("/profiles", async (c) => {
  const result = await shippingProfiles.list(c.req.query() as any);
  return c.json(result);
});

shipping.get("/profiles/:id", async (c) => {
  const item = await shippingProfiles.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Shipping profile not found" }, 404);
  return c.json(item);
});

shipping.post("/profiles", async (c) => {
  const body = await c.req.json<any>();
  const profile = await shippingProfiles.create(body as any, "api");
  return c.json(profile, 201);
});

shipping.patch("/profiles/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await shippingProfiles.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Shipping profile not found" }, 404);
  return c.json(updated);
});

shipping.delete("/profiles/:id", async (c) => {
  const ok = await shippingProfiles.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Shipping profile not found" }, 404);
  return c.json({ success: true });
});

/* ================================================================== */
/*  SHIPPING RATES                                                     */
/* ================================================================== */

shipping.get("/rates", async (c) => {
  const result = await shippingRates.list(c.req.query() as any);
  return c.json(result);
});

shipping.post("/rates/calculate", async (c) => {
  const body = await c.req.json<any>();
  const result = await calculateRates({
    fromCountry: body.fromCountry || "US",
    fromZip: body.fromZip || "10001",
    toCountry: body.toCountry || "US",
    toZip: body.toZip || "90210",
    weightKg: body.weightKg || 1,
    lengthCm: body.lengthCm,
    widthCm: body.widthCm,
    heightCm: body.heightCm,
    declaredValue: body.declaredValue || 0,
    currency: body.currency,
  });
  return c.json(result);
});

shipping.post("/rates/quotes", async (c) => {
  const body = await c.req.json<any>();
  const rates = await calculateRates({
    fromCountry: body.fromCountry || "US",
    fromZip: body.fromZip || "10001",
    toCountry: body.toCountry || "US",
    toZip: body.toZip || "90210",
    weightKg: body.weightKg || 1,
    declaredValue: body.declaredValue || 0,
  });

  // Cache quotes
  const sessionId = uuidv4();
  for (const rate of rates) {
    await shippingQuotes.create({
      session_id: sessionId,
      to_country: body.toCountry || "US",
      to_zip: body.toZip || "",
      weight_kg: body.weightKg || 1,
      carrier_name: rate.carrierName,
      service_code: rate.serviceCode,
      service_name: rate.serviceName,
      estimated_days_min: rate.estimatedDaysMin,
      estimated_days_max: rate.estimatedDaysMax,
      rate: rate.rate,
      fuel_surcharge: rate.fuelSurcharge,
      insurance_cost: rate.insuranceCost,
      handling_fee: rate.handlingFee,
      tax: rate.tax,
      total: rate.total,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    } as any, "system");
  }

  return c.json({ sessionId, rates });
});

/* ================================================================== */
/*  ADDRESS VALIDATION                                                 */
/* ================================================================== */

shipping.post("/address/validate", async (c) => {
  const body = await c.req.json<any>();
  const result = await validateAddress({
    name: body.name || "",
    line1: body.line1 || "",
    line2: body.line2,
    city: body.city || "",
    state: body.state,
    zip: body.zip || "",
    country: body.country || "",
    phone: body.phone,
    email: body.email,
  });
  return c.json(result);
});

/* ================================================================== */
/*  SHIPPING RULES                                                     */
/* ================================================================== */

shipping.get("/rules", async (c) => {
  const result = await shippingRules.list(c.req.query() as any);
  return c.json(result);
});

shipping.get("/rules/:id", async (c) => {
  const item = await shippingRules.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Shipping rule not found" }, 404);
  return c.json(item);
});

shipping.post("/rules", async (c) => {
  const body = await c.req.json<any>();
  const rule = await shippingRules.create(body as any, "api");
  return c.json(rule, 201);
});

shipping.patch("/rules/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await shippingRules.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Shipping rule not found" }, 404);
  return c.json(updated);
});

shipping.delete("/rules/:id", async (c) => {
  const ok = await shippingRules.delete(c.req.param("id"), "api");
  if (!ok) return c.json({ code: "NOT_FOUND", message: "Shipping rule not found" }, 404);
  return c.json({ success: true });
});

shipping.post("/rules/evaluate", async (c) => {
  const body = await c.req.json<any>();
  const result = await evaluateShippingRules({
    subtotal: body.subtotal || 0,
    weightKg: body.weightKg || 0,
    country: body.country || "",
    customerTier: body.customerTier,
    carrierCode: body.carrierCode,
    couponCode: body.couponCode,
  });
  return c.json(result);
});

/* ================================================================== */
/*  SHIPMENTS                                                          */
/* ================================================================== */

shipping.get("/shipments", async (c) => {
  const query = c.req.query();
  if (query.status) {
    const result = await shipments.getByStatus(query.status);
    return c.json(result);
  }
  if (query.active === "true") {
    const result = await shipments.getActive();
    return c.json(result);
  }
  const result = await shipments.list(query as any);
  return c.json(result);
});

shipping.get("/shipments/recent", async (c) => {
  const limit = Number(c.req.query("limit")) || 20;
  const result = await shipments.getRecent(limit);
  return c.json(result);
});

shipping.get("/shipments/:id", async (c) => {
  const item = await shipments.getById(c.req.param("id"));
  if (!item) return c.json({ code: "NOT_FOUND", message: "Shipment not found" }, 404);
  return c.json(item);
});

shipping.post("/shipments", async (c) => {
  const body = await c.req.json<any>();
  const shipment = await createShipment({
    orderId: body.orderId,
    orderNumber: body.orderNumber,
    customerName: body.customerName || "",
    customerEmail: body.customerEmail || "",
    customerPhone: body.customerPhone,
    address: {
      name: body.address?.name || body.customerName || "",
      line1: body.address?.line1 || "",
      line2: body.address?.line2,
      city: body.address?.city || "",
      state: body.address?.state,
      zip: body.address?.zip || "",
      country: body.address?.country || "",
      phone: body.address?.phone,
    },
    carrierCode: body.carrierCode || "ups",
    carrierName: body.carrierName || "UPS",
    serviceCode: body.serviceCode || "ups_ground",
    items: body.items || [],
    weightKg: body.weightKg,
    declaredValue: body.declaredValue,
    notes: body.notes,
  });
  return c.json(shipment, 201);
});

shipping.patch("/shipments/:id", async (c) => {
  const patch = await c.req.json();
  const updated = await shipments.update(c.req.param("id"), patch as any, "api");
  if (!updated) return c.json({ code: "NOT_FOUND", message: "Shipment not found" }, 404);
  return c.json(updated);
});

/* ================================================================== */
/*  LABEL GENERATION                                                   */
/* ================================================================== */

shipping.post("/shipments/:id/label", async (c) => {
  const shipment = await shipments.getById(c.req.param("id"));
  if (!shipment) return c.json({ code: "NOT_FOUND", message: "Shipment not found" }, 404);

  const labelResult = await generateLabel({
    shipmentId: shipment.id,
    carrierCode: shipment.carrier_name?.toLowerCase().replace(/\s/g, "") || "ups",
    serviceCode: shipment.service_code || "ground",
    fromAddress: {
      name: "ALAYA INSIDER",
      line1: "200 Park Avenue South",
      line2: "Suite 1500",
      city: "New York",
      state: "NY",
      zip: "10003",
      country: "US",
    },
    toAddress: {
      name: shipment.address_name || shipment.customer_name,
      line1: shipment.address_line1 || "",
      line2: shipment.address_line2,
      city: shipment.address_city || "",
      state: shipment.address_state,
      zip: shipment.address_zip || "",
      country: shipment.address_country || "US",
    },
    parcels: [{
      weightKg: Number(shipment.weight_kg) || 1,
      declaredValue: Number(shipment.declared_value) || 0,
    }],
  });

  if (labelResult.success && labelResult.trackingNumber) {
    await shipments.update(shipment.id, {
      status: "processing",
      tracking_number: labelResult.trackingNumber,
      tracking_url: labelResult.trackingUrl,
      label_url: labelResult.labelUrl,
      shipping_cost: labelResult.cost,
    } as any, "system");

    // Store label record
    await shippingLabels.create({
      shipment_id: shipment.id,
      type: "shipping",
      format: "pdf",
      url: labelResult.labelUrl || "",
      size: "4x6",
      generated_at: new Date().toISOString(),
    } as any, "system");
  }

  return c.json(labelResult);
});

/* ================================================================== */
/*  TRACKING                                                           */
/* ================================================================== */

shipping.get("/tracking/:trackingNumber", async (c) => {
  const trackingNumber = c.req.param("trackingNumber");
  const result = await trackShipment(trackingNumber);
  return c.json(result);
});

shipping.post("/shipments/:id/refresh-tracking", async (c) => {
  const result = await refreshTracking(c.req.param("id"));
  if (!result) return c.json({ code: "NOT_FOUND", message: "Shipment not found" }, 404);
  return c.json(result);
});

shipping.get("/shipments/:id/events", async (c) => {
  const limit = Number(c.req.query("limit")) || 50;
  const result = await shipmentEvents.getByShipment(c.req.param("id"), limit);
  return c.json(result);
});

/* ================================================================== */
/*  DELIVERY CONFIRMATIONS                                             */
/* ================================================================== */

shipping.get("/delivery-confirmations/:shipmentId", async (c) => {
  const result = await deliveryConfirmations.getByShipment(c.req.param("shipmentId"));
  return c.json(result);
});

/* ================================================================== */
/*  SHIPPING LABELS                                                    */
/* ================================================================== */

shipping.get("/labels/:shipmentId", async (c) => {
  const result = await shippingLabels.getByShipment(c.req.param("shipmentId"));
  return c.json(result);
});

/* ================================================================== */
/*  SHIPPING QUOTES                                                    */
/* ================================================================== */

shipping.get("/quotes/:sessionId", async (c) => {
  const result = await shippingQuotes.getBySession(c.req.param("sessionId"));
  return c.json(result);
});

/* ================================================================== */
/*  ANALYTICS                                                          */
/* ================================================================== */

shipping.get("/analytics", async (c) => {
  const days = Number(c.req.query("days")) || 30;
  const result = await getDeliveryAnalytics(days);
  return c.json(result);
});

export { shipping };
