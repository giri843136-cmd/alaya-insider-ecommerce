/**
 * ALAYA INSIDER — Shipping Fulfillment Pipeline (PR-5)
 * ====================================================================
 * Integrates the shipping engine into the order fulfillment flow.
 * When an order is paid and a supplier is selected, this pipeline:
 *  1. Validates the shipping address
 *  2. Calculates the best shipping rate
 *  3. Creates a shipment record
 *  4. Generates a shipping label
 *  5. Returns tracking information for the customer
 *
 * This bridges PR-4 (Supplier Platform) with PR-5 (Shipping & Logistics).
 */

import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll } from "../db/index.js";
import {
  shipments, shipmentEvents, shippingLabels, deliveryConfirmations,
} from "../db/repositories/index.js";
import type { LabelResult } from "./shippingEngine.js";
import {
  validateAddress, calculateRates, generateLabel, createShipment,
  trackShipment,
} from "./shippingEngine.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface ShippingFulfillmentInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
  };
  items: Array<{
    productId?: string;
    productName: string;
    productSku?: string;
    quantity: number;
    weightKg?: number;
    declaredValue?: number;
  }>;
  preferredCarrier?: string;
  warehouseId?: string;
  notes?: string;
}

export interface ShippingFulfillmentResult {
  success: boolean;
  steps: Array<{ name: string; status: string; details: string }>;
  shipmentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  carrierName?: string;
  serviceName?: string;
  shippingCost?: number;
  estimatedDelivery?: string;
  errors?: string[];
}

/* ================================================================== */
/*  FULFILLMENT PIPELINE                                               */
/* ================================================================== */

/**
 * Run the complete shipping fulfillment pipeline for an order.
 * This is called after supplier fulfillment is complete.
 */
export async function runShippingFulfillment(
  input: ShippingFulfillmentInput,
): Promise<ShippingFulfillmentResult> {
  const steps: ShippingFulfillmentResult["steps"] = [];
  const errors: string[] = [];

  // Step 1: Validate address
  steps.push({ name: "Address Validation", status: "processing", details: "Validating shipping address..." });
  try {
    const validation = await validateAddress({
      name: input.customerName,
      line1: input.address.line1,
      line2: input.address.line2,
      city: input.address.city,
      state: input.address.state,
      zip: input.address.zip,
      country: input.address.country,
      phone: input.customerPhone,
      email: input.customerEmail,
    });

    if (!validation.valid) {
      steps[steps.length - 1] = {
        name: "Address Validation",
        status: "warning",
        details: `Address needs attention: ${validation.issues?.join(", ")}`,
      };
    } else {
      steps[steps.length - 1] = {
        name: "Address Validation",
        status: "success",
        details: `Address validated: ${validation.normalized?.city}, ${validation.normalized?.country} (${validation.isCommercial ? "Commercial" : "Residential"})`,
      };
    }
  } catch (err) {
    errors.push(`Address validation failed: ${err instanceof Error ? err.message : String(err)}`);
    steps[steps.length - 1] = { name: "Address Validation", status: "error", details: errors[errors.length - 1] };
  }

  // Step 2: Calculate total weight and value
  const totalWeight = input.items.reduce((s, i) => s + (i.weightKg || 0.5) * i.quantity, 0);
  const totalValue = input.items.reduce((s, i) => s + (i.declaredValue || 0) * i.quantity, 0);

  // Step 3: Get shipping rates
  steps.push({ name: "Rate Calculation", status: "processing", details: "Calculating shipping rates..." });
  let selectedRate: any = null;
  try {
    const rates = await calculateRates({
      fromCountry: "US",
      fromZip: "10003",
      toCountry: input.address.country || "US",
      toZip: input.address.zip || "10001",
      weightKg: Math.max(0.1, totalWeight),
      declaredValue: totalValue,
    });

    // Filter by preferred carrier if specified
    const filtered = input.preferredCarrier
      ? rates.filter(r => r.carrierCode === input.preferredCarrier)
      : rates;

    selectedRate = filtered[0] || rates[0];

    if (selectedRate) {
      steps[steps.length - 1] = {
        name: "Rate Calculation",
        status: "success",
        details: `${selectedRate.carrierName} ${selectedRate.serviceName}: $${selectedRate.total.toFixed(2)} (${selectedRate.estimatedDaysMin}-${selectedRate.estimatedDaysMax} days)`,
      };
    } else {
      steps[steps.length - 1] = {
        name: "Rate Calculation",
        status: "warning",
        details: "No rates available for this destination",
      };
    }
  } catch (err) {
    errors.push(`Rate calculation failed: ${err instanceof Error ? err.message : String(err)}`);
    steps[steps.length - 1] = { name: "Rate Calculation", status: "error", details: errors[errors.length - 1] };
  }

  // Step 4: Create shipment
  steps.push({ name: "Shipment Creation", status: "processing", details: "Creating shipment record..." });
  let shipmentId: string | undefined;
  try {
    const shipment = await createShipment({
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      address: {
        name: input.customerName,
        line1: input.address.line1,
        line2: input.address.line2,
        city: input.address.city,
        state: input.address.state,
        zip: input.address.zip,
        country: input.address.country,
      },
      carrierCode: selectedRate?.carrierCode || "ups",
      carrierName: selectedRate?.carrierName || "UPS",
      serviceCode: selectedRate?.serviceCode || "ups_ground",
      items: input.items,
      weightKg: totalWeight,
      declaredValue: totalValue,
      notes: input.notes,
    });
    shipmentId = shipment.id;

    // Update order with shipment reference
    await query(
      `UPDATE orders SET tracking_number = $1, courier = $2, status = 'shipped', updated_at = NOW()
       WHERE id = $3`,
      [shipment.number || shipmentId, selectedRate?.carrierName || "UPS", input.orderId],
    ).catch(() => {});

    steps[steps.length - 1] = {
      name: "Shipment Creation",
      status: "success",
      details: `Shipment ${shipment.number || shipmentId} created`,
    };
  } catch (err) {
    errors.push(`Shipment creation failed: ${err instanceof Error ? err.message : String(err)}`);
    steps[steps.length - 1] = { name: "Shipment Creation", status: "error", details: errors[errors.length - 1] };
  }

  // Step 5: Generate label
  steps.push({ name: "Label Generation", status: "processing", details: "Generating shipping label..." });
  let trackingNumber: string | undefined;
  let trackingUrl: string | undefined;
  let labelUrl: string | undefined;
  let estimatedDelivery: string | undefined;
  try {
    if (shipmentId) {
      const labelResult = await (async (): Promise<LabelResult> => {
        try {
          const response = await fetch(
            `http://localhost:${process.env.PORT || 3000}/api/v1/shipping/shipments/${shipmentId}/label`,
            { method: "POST" },
          );
          return (await response.json()) as LabelResult;
        } catch {
          // Fallback: call the engine directly
          const shipment = await shipments.getById(shipmentId);
          if (!shipment) throw new Error("Shipment not found");
          return generateLabel({
            shipmentId,
            carrierCode: selectedRate?.carrierCode || "ups",
            serviceCode: selectedRate?.serviceCode || "ground",
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
              name: input.customerName,
              line1: input.address.line1,
              line2: input.address.line2,
              city: input.address.city,
              state: input.address.state,
              zip: input.address.zip,
              country: input.address.country,
            },
            parcels: [{
              weightKg: Math.max(0.1, totalWeight),
              declaredValue: totalValue,
            }],
          });
        }
      })();

      if (labelResult.success) {
        trackingNumber = labelResult.trackingNumber;
        trackingUrl = labelResult.trackingUrl;
        labelUrl = labelResult.labelUrl;
        estimatedDelivery = labelResult.eta;
        steps[steps.length - 1] = {
          name: "Label Generation",
          status: "success",
          details: `Label generated: ${trackingNumber} ($${labelResult.cost?.toFixed(2) || "N/A"})`,
        };
      } else {
        throw new Error(labelResult.error || "Label generation failed");
      }
    }
  } catch (err) {
    errors.push(`Label generation failed: ${err instanceof Error ? err.message : String(err)}`);
    steps[steps.length - 1] = { name: "Label Generation", status: "error", details: errors[errors.length - 1] };
  }

  // Step 6: Initial tracking event
  if (trackingNumber && shipmentId) {
    steps.push({ name: "Tracking Initialization", status: "success", details: `Tracking initialized: ${trackingNumber}` });
    try {
      await shipmentEvents.create({
        shipment_id: shipmentId,
        tracking_number: trackingNumber,
        status: "label_created",
        location: "Shipping Origin",
        description: "Shipping label created, carrier notified",
        timestamp: new Date().toISOString(),
      } as any, "system");
    } catch {}
  }

  // Summary
  const hasErrors = errors.length > 0;
  steps.push({
    name: "Fulfillment Complete",
    status: hasErrors ? "partial" : "success",
    details: hasErrors
      ? `Completed with ${errors.length} issue(s): ${errors.join("; ")}`
      : `Shipping fulfillment complete — ${trackingNumber || "pending tracking"}`,
  });

  return {
    success: !hasErrors,
    steps,
    shipmentId,
    trackingNumber,
    trackingUrl,
    labelUrl,
    carrierName: selectedRate?.carrierName,
    serviceName: selectedRate?.serviceName,
    shippingCost: selectedRate?.total,
    estimatedDelivery,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Create a shipping endpoint route handler that can be called from
 * the fulfillment pipeline after supplier fulfillment is complete.
 */
export async function fulfillOrderShipping(orderId: string): Promise<ShippingFulfillmentResult> {
  const order = await queryOne(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId],
  );

  if (!order) {
    return {
      success: false,
      steps: [{ name: "Error", status: "error", details: "Order not found" }],
      errors: ["Order not found"],
    };
  }

  // Parse items
  const items = (order.items || []) as Array<{ productId?: string; name: string; sku?: string; quantity: number; price: number }>;

  return runShippingFulfillment({
    orderId: order.id,
    orderNumber: order.number,
    customerName: order.customer_name || "",
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone,
    address: {
      line1: order.customer_address || "",
      city: order.customer_city || "",
      state: order.customer_state,
      zip: order.customer_zip || "",
      country: order.customer_country || "US",
    },
    items: items.map((item: any) => ({
      productId: item.productId,
      productName: item.name || "Product",
      productSku: item.sku,
      quantity: item.quantity || 1,
      declaredValue: item.price || 0,
    })),
    notes: order.notes,
  });
}
