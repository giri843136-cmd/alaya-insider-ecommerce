/**
 * ALAYA INSIDER — Shipping Carrier Seed Data (PR-5)
 * ====================================================================
 * Seeds 7 real carrier connectors with API endpoints and service definitions.
 * Idempotent — only inserts if carriers table is empty.
 */

import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "./index.js";

function now(): string {
  return new Date().toISOString();
}

export async function seedShippingCarriers(): Promise<{
  entity: string;
  attempted: number;
  inserted: number;
  skipped: number;
  errors: number;
}> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const carriers = [
    {
      name: "UPS",
      code: "ups",
      description: "United Parcel Service — Global shipping and logistics",
      website: "https://www.ups.com",
      api_docs_url: "https://developer.ups.com/api",
      tracking_url_template: "https://www.ups.com/track?num={{TRACKING_NUMBER}}",
      supported_services: ["ups_ground", "ups_2day", "ups_1day", "ups_worldwide"],
      supported_countries: ["US", "CA", "MX", "GB", "DE", "FR", "IT", "ES", "NL", "AU", "JP", "CN", "BR", "IN"],
      max_weight_kg: 70,
      api_endpoint: "https://onlinetools.ups.com/api",
      auth_type: "api_key",
      health_check_url: "https://www.ups.com/tracker",
      priority: 1,
      test_mode: true,
      requires_signature: false,
      insurance_available: true,
      max_dimensions: { length: 274, width: 274, height: 274 },
    },
    {
      name: "FedEx",
      code: "fedex",
      description: "FedEx Express — Global courier delivery services",
      website: "https://www.fedex.com",
      api_docs_url: "https://developer.fedex.com/api",
      tracking_url_template: "https://www.fedex.com/fedextrack/?trknbr={{TRACKING_NUMBER}}",
      supported_services: ["fedex_ground", "fedex_2day", "fedex_overnight", "fedex_intl"],
      supported_countries: ["US", "CA", "MX", "GB", "DE", "FR", "IT", "ES", "NL", "AU", "JP", "CN", "BR", "IN"],
      max_weight_kg: 68,
      api_endpoint: "https://apis.fedex.com",
      auth_type: "oauth",
      health_check_url: "https://www.fedex.com/fedextrack",
      priority: 2,
      test_mode: true,
      requires_signature: false,
      insurance_available: true,
      max_dimensions: { length: 274, width: 213, height: 178 },
    },
    {
      name: "USPS",
      code: "usps",
      description: "United States Postal Service — Domestic mail and package delivery",
      website: "https://www.usps.com",
      api_docs_url: "https://www.usps.com/business/web-tools-apis",
      tracking_url_template: "https://tools.usps.com/go/TrackConfirmAction?tLabels={{TRACKING_NUMBER}}",
      supported_services: ["usps_ground", "usps_priority", "usps_express", "usps_intl"],
      supported_countries: ["US", "GU", "PR", "VI"],
      max_weight_kg: 31,
      api_endpoint: "https://secure.shippingapis.com/ShippingAPI.dll",
      auth_type: "api_key",
      health_check_url: "https://www.usps.com/",
      priority: 3,
      test_mode: true,
      requires_signature: false,
      insurance_available: true,
      max_dimensions: { length: 108, girth: 130 },
    },
    {
      name: "DHL Express",
      code: "dhl",
      description: "DHL Express — International shipping and courier services",
      website: "https://www.dhl.com",
      api_docs_url: "https://developer.dhl.com/api",
      tracking_url_template: "https://www.dhl.com/en/express/tracking.html?AWB={{TRACKING_NUMBER}}",
      supported_services: ["dhl_express", "dhl_economy", "dhl_ground"],
      supported_countries: ["US", "CA", "MX", "GB", "DE", "FR", "IT", "ES", "NL", "AU", "JP", "CN", "BR", "IN", "AE", "SA"],
      max_weight_kg: 70,
      api_endpoint: "https://api-eu.dhl.com",
      auth_type: "api_key",
      health_check_url: "https://www.dhl.com",
      priority: 4,
      test_mode: true,
      requires_signature: true,
      insurance_available: true,
      max_dimensions: { length: 120, width: 120, height: 120 },
    },
    {
      name: "Shippo",
      code: "shippo",
      description: "Multi-carrier shipping platform with rate comparison and label generation",
      website: "https://goshippo.com",
      api_docs_url: "https://docs.goshippo.com",
      tracking_url_template: "https://goshippo.com/tracking/{{TRACKING_NUMBER}}",
      supported_services: ["shippo_standard", "shippo_express"],
      supported_countries: ["US", "CA", "GB", "DE", "FR", "IT", "ES", "AU", "JP", "IN", "BR", "MX", "NL"],
      max_weight_kg: 70,
      api_endpoint: "https://api.goshippo.com",
      auth_type: "api_key",
      health_check_url: "https://api.goshippo.com",
      priority: 5,
      test_mode: true,
      requires_signature: false,
      insurance_available: true,
      max_dimensions: {},
    },
    {
      name: "EasyPost",
      code: "easypost",
      description: "Shipping API for multi-carrier rates, labels, and tracking",
      website: "https://www.easypost.com",
      api_docs_url: "https://docs.easypost.com",
      tracking_url_template: "https://track.easypost.com/{{TRACKING_NUMBER}}",
      supported_services: ["ep_standard", "ep_express"],
      supported_countries: ["US", "CA", "GB", "DE", "FR", "IT", "ES", "AU", "JP", "MX"],
      max_weight_kg: 70,
      api_endpoint: "https://api.easypost.com/v2",
      auth_type: "api_key",
      health_check_url: "https://api.easypost.com/v2",
      priority: 6,
      test_mode: true,
      requires_signature: false,
      insurance_available: true,
      max_dimensions: {},
    },
    {
      name: "ShipStation",
      code: "shipstation",
      description: "Shipping platform for order management and label printing",
      website: "https://www.shipstation.com",
      api_docs_url: "https://developer.shipstation.com/docs",
      tracking_url_template: "https://ss.shipstation.com/tracking/{{TRACKING_NUMBER}}",
      supported_services: ["ss_standard", "ss_expedited"],
      supported_countries: ["US", "CA", "GB", "AU"],
      max_weight_kg: 70,
      api_endpoint: "https://ssapi.shipstation.com",
      auth_type: "api_key",
      health_check_url: "https://ssapi.shipstation.com",
      priority: 7,
      test_mode: true,
      requires_signature: false,
      insurance_available: true,
      max_dimensions: {},
    },
  ];

  for (const c of carriers) {
    try {
      const existing = await queryOne("SELECT id FROM shipping_carriers WHERE code = $1", [c.code]);
      if (existing) { skipped++; continue; }

      await query(
        `INSERT INTO shipping_carriers (
          id, name, code, description, website, api_docs_url, tracking_url_template,
          supported_services, supported_countries, max_weight_kg, max_dimensions,
          api_endpoint, auth_type, health_check_url, priority, test_mode,
          requires_signature, insurance_available, active, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          uuidv4(), c.name, c.code, c.description, c.website, c.api_docs_url,
          c.tracking_url_template, JSON.stringify(c.supported_services),
          JSON.stringify(c.supported_countries), c.max_weight_kg,
          JSON.stringify(c.max_dimensions), c.api_endpoint, c.auth_type,
          c.health_check_url, c.priority, c.test_mode,
          c.requires_signature, c.insurance_available, true, now(), now(),
        ],
      );
      inserted++;
    } catch (err) {
      errors++;
      console.error(`[SEED] Error inserting carrier ${c.code}:`, err);
    }
  }

  return {
    entity: "shipping_carriers",
    attempted: carriers.length,
    inserted,
    skipped,
    errors,
  };
}

// Add shipping tables to the seed verification table list
export const SHIPPING_TABLES = [
  "shipping_carriers",
  "shipping_profiles",
  "shipping_rates",
  "shipments",
  "shipment_items",
  "shipment_events",
  "shipping_labels",
  "delivery_confirmations",
  "carrier_health",
  "shipping_rules",
  "shipping_quotes",
];
