/**
 * ALAYA INSIDER — Enterprise SKU Engine
 * --------------------------------------------------------------------------
 * Atomically generates globally unique, human-readable SKUs.
 *
 * Pattern: AL-{CATEGORY}-{YEAR}-{SEQUENCE}
 * Example: AL-HOME-2026-000001
 *
 * Features:
 *   - Globally unique (PostgreSQL sequence-based)
 *   - Atomic generation (no race conditions)
 *   - Concurrent safe (serialized via DB sequence)
 *   - Human-readable (category + year prefix)
 *   - Category mapping with fallback
 *   - Custom prefix support
 */

import { queryOne } from "../db/index.js";

/* ================================================================== */
/*  CONFIGURATION                                                      */
/* ================================================================== */

const SKU_PREFIX = "AL";
const SEQUENCE_NAME = "sku_sequence";
const SEQUENCE_START = 1;
const SEQUENCE_PAD = 6; // 000001

/* ================================================================== */
/*  CATEGORY CODE MAPPING                                              */
/* ================================================================== */

const CATEGORY_CODES: Record<string, string> = {
  // Storefront categories (from seed data)
  "home-living": "HOME",
  "home & living": "HOME",
  home: "HOME",
  kitchen: "KITC",
  beauty: "BEAU",
  electronic: "ELEC",
  travel: "TRVL",
  health: "HEAL",
  lifestyle: "LIFE",
  fragrance: "FRAG",
  // Generic fallbacks
  clothing: "CLTH",
  accessories: "ACCS",
  shoes: "SHOE",
  bags: "BAGS",
  jewelry: "JEWL",
  books: "BOOK",
  media: "MEDI",
  food: "FOOD",
  drinks: "DRNK",
  pets: "PETS",
  toys: "TOYS",
  sports: "SPRT",
  outdoor: "OUTD",
  furniture: "FURN",
  decor: "DECO",
  tools: "TOOL",
  garden: "GRDN",
  automotive: "AUTO",
  computing: "COMP",
  phones: "PHON",
  software: "SOFT",
  music: "MUSC",
  film: "FILM",
  art: "ART",
  // Admin/internal categories
  general: "GENL",
  uncategorized: "GENL",
  default: "GENL",
};

const DEFAULT_CATEGORY_CODE = "GENL";

/**
 * Get the SKU category code from a category name or slug.
 */
export function getCategoryCode(category: string): string {
  if (!category) return DEFAULT_CATEGORY_CODE;

  const normalized = category
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

  // Direct match
  if (CATEGORY_CODES[normalized]) {
    return CATEGORY_CODES[normalized];
  }

  // Partial match (check if any key is contained in the normalized name)
  for (const [key, code] of Object.entries(CATEGORY_CODES)) {
    if (normalized.includes(key)) {
      return code;
    }
  }

  // Generate a 4-letter code from the category name
  const cleaned = normalized.replace(/[^a-z]/g, "");
  if (cleaned.length >= 4) {
    return cleaned.slice(0, 4).toUpperCase();
  }
  if (cleaned.length > 0) {
    return cleaned.toUpperCase().padEnd(4, "X");
  }

  return DEFAULT_CATEGORY_CODE;
}

/* ================================================================== */
/*  SEQUENCE MANAGEMENT                                                */
/* ================================================================== */

/**
 * Ensure the SKU sequence exists in PostgreSQL.
 * Called once on server startup.
 */
export async function ensureSkuSequence(): Promise<void> {
  try {
    await queryOne(
      `CREATE SEQUENCE IF NOT EXISTS ${SEQUENCE_NAME}
       START WITH ${SEQUENCE_START}
       INCREMENT BY 1
       NO MAXVALUE
       CACHE 1`,
    );
  } catch (err) {
    console.warn("[SKU] Could not create sequence:", err);
  }
}

/**
 * Get the next value from the SKU sequence atomically.
 * This is concurrent-safe — PostgreSQL serializes sequence access.
 */
async function nextSkuSequence(): Promise<number> {
  const result = await queryOne<{ nextval: string }>(
    `SELECT nextval('${SEQUENCE_NAME}') as nextval`,
  );
  return Number(result?.nextval ?? 1);
}

/**
 * Get the current value of the SKU sequence (without incrementing).
 */
export async function currentSkuSequence(): Promise<number> {
  try {
    const result = await queryOne<{ last_value: string }>(
      `SELECT last_value FROM ${SEQUENCE_NAME}`,
    );
    return Number(result?.last_value ?? 0);
  } catch {
    return 0;
  }
}

/* ================================================================== */
/*  SKU GENERATION                                                     */
/* ================================================================== */

/**
 * Generate a globally unique SKU.
 *
 * Pattern: AL-{CATEGORY}-{YEAR}-{SEQUENCE}
 * Example: AL-HOME-2026-000001
 *
 * The sequence is atomically incremented via PostgreSQL,
 * making this safe for concurrent calls from multiple server instances.
 */
export async function generateSku(category?: string): Promise<string> {
  const year = new Date().getFullYear().toString();
  const categoryCode = getCategoryCode(category ?? "general");
  const sequence = await nextSkuSequence();
  const paddedSequence = String(sequence).padStart(SEQUENCE_PAD, "0");

  return `${SKU_PREFIX}-${categoryCode}-${year}-${paddedSequence}`;
}

/**
 * Generate a SKU with a custom prefix (for special product types).
 */
export async function generateCustomSku(
  prefix: string,
  category?: string,
): Promise<string> {
  const year = new Date().getFullYear().toString();
  const categoryCode = getCategoryCode(category ?? "general");
  const sequence = await nextSkuSequence();
  const paddedSequence = String(sequence).padStart(SEQUENCE_PAD, "0");

  const cleanPrefix = prefix
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(2, "X");

  return `${SKU_PREFIX}-${cleanPrefix}-${year}-${paddedSequence}`;
}

/**
 * Generate a SKU for product variants.
 * Appends a variant suffix to the base SKU.
 *
 * Example: AL-HOME-2026-000001-BLK
 */
export async function generateVariantSku(
  baseSku: string,
  variantAttributes: Record<string, string>,
): Promise<string> {
  // Create a short code from variant attributes
  const variantCode = Object.values(variantAttributes)
    .map((v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3),
    )
    .join("-");

  return `${baseSku}-${variantCode || "VAR"}`;
}

/**
 * Parse a SKU into its components.
 * Example: "AL-HOME-2026-000001" → { prefix: "AL", category: "HOME", year: "2026", sequence: 1 }
 */
export function parseSku(sku: string): {
  prefix: string;
  category: string;
  year: string;
  sequence: number;
  variant?: string;
} | null {
  if (!sku || typeof sku !== "string") return null;

  const parts = sku.split("-");
  if (parts.length < 4) return null;

  const prefix = parts[0];
  const category = parts[1];
  const year = parts[2];
  const sequence = parseInt(parts[3], 10);

  if (prefix !== SKU_PREFIX || isNaN(sequence)) return null;

  // Check for variant suffix
  const variant = parts.length > 4 ? parts.slice(4).join("-") : undefined;

  return { prefix, category, year, sequence, variant };
}

/**
 * Validate a SKU format without checking existence.
 */
export function validateSku(sku: string): { valid: boolean; reason?: string } {
  if (!sku || sku.length === 0) {
    return { valid: false, reason: "SKU cannot be empty" };
  }

  const pattern = /^AL-[A-Z0-9]{2,6}-\d{4}-\d{6}(-[A-Z0-9-]+)?$/;
  if (!pattern.test(sku)) {
    return {
      valid: false,
      reason:
        'SKU must match pattern AL-{CATEGORY}-{YEAR}-{SEQUENCE} (e.g., AL-HOME-2026-000001)',
    };
  }

  return { valid: true };
}
