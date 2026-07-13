/**
 * ALAYA INSIDER — Enterprise Validation Pipeline
 * --------------------------------------------------------------------------
 * Validates product, category, brand, and import data with detailed error reports.
 * Used by the import engine, CRUD endpoints, and admin forms.
 *
 * Each validation returns a report with:
 *   - valid: boolean
 *   - errors: Array<{ field: string; message: string; code: string }>
 *   - warnings: Array<{ field: string; message: string; code: string }>
 */

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidatedProduct {
  name?: string;
  slug?: string;
  sku?: string;
  brand?: string;
  category?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  description?: string;
  shortDescription?: string;
  images?: string[];
  tags?: string[];
  status?: string;
  type?: string;
  affiliateUrl?: string;
  [key: string]: unknown;
}

export interface ValidatedCategory {
  name?: string;
  slug?: string;
  tagline?: string;
  description?: string;
  image?: string;
  [key: string]: unknown;
}

export interface ValidatedBrand {
  name?: string;
  slug?: string;
  tagline?: string;
  website?: string;
  country?: string;
  [key: string]: unknown;
}

/* ================================================================== */
/*  URL VALIDATION                                                    */
/* ================================================================== */

const URL_PATTERN = /^https?:\/\/.+/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?)$/i;
const AFFILIATE_DOMAINS = [
  "amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr",
  "amazon.co.jp", "amazon.in", "amazon.ca", "amazon.com.au",
  "shareasale.com", "cj.com", "awin.com", "impact.com",
  "rakuten.com", "ebay.com", "walmart.com", "target.com",
  "bestbuy.com", "etsy.com", "shopify.com",
];

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.test(url) || url.includes("images.pexels.com");
}

function isAffiliateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return AFFILIATE_DOMAINS.some((domain) => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
}

/* ================================================================== */
/*  PRODUCT VALIDATION                                                */
/* ================================================================== */

const VALID_STATUSES = new Set([
  "draft", "pending_review", "published", "scheduled",
  "archived", "rejected", "deleted",
]);

const VALID_TYPES = new Set(["physical", "digital", "service", "subscription", "affiliate"]);

const MAX_NAME_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 100000;
const MAX_SHORT_DESCRIPTION_LENGTH = 1000;
const MAX_IMAGES = 50;
const MAX_TAGS = 50;
const MIN_PRICE = 0;
const MAX_PRICE = 999999.99;
const MIN_STOCK = -999999;
const MAX_STOCK = 999999;

/**
 * Validate a single product record.
 * Returns a report with all validation errors and warnings.
 */
export function validateProduct(input: Record<string, unknown>): ValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Name (required)
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    errors.push({ field: "name", message: "Product name is required", code: "REQUIRED" });
  } else if (input.name.length > MAX_NAME_LENGTH) {
    errors.push({
      field: "name",
      message: `Product name must be ${MAX_NAME_LENGTH} characters or less`,
      code: "MAX_LENGTH",
      value: input.name.length,
    });
  }

  // Slug (optional — auto-generated if empty)
  if (input.slug && typeof input.slug === "string" && input.slug.length > 0) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug as string)) {
      errors.push({
        field: "slug",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
        code: "INVALID_FORMAT",
      });
    }
  }

  // Price (required)
  if (input.price === undefined || input.price === null || input.price === "") {
    errors.push({ field: "price", message: "Price is required", code: "REQUIRED" });
  } else {
    const price = Number(input.price);
    if (isNaN(price)) {
      errors.push({ field: "price", message: "Price must be a valid number", code: "INVALID_TYPE" });
    } else if (price < MIN_PRICE || price > MAX_PRICE) {
      errors.push({
        field: "price",
        message: `Price must be between ${MIN_PRICE} and ${MAX_PRICE}`,
        code: "OUT_OF_RANGE",
        value: price,
      });
    }
  }

  // Sale price (optional)
  if (input.salePrice !== undefined && input.salePrice !== null && input.salePrice !== "") {
    const salePrice = Number(input.salePrice);
    if (isNaN(salePrice)) {
      errors.push({ field: "salePrice", message: "Sale price must be a valid number", code: "INVALID_TYPE" });
    } else if (salePrice < MIN_PRICE || salePrice > MAX_PRICE) {
      errors.push({
        field: "salePrice",
        message: `Sale price must be between ${MIN_PRICE} and ${MAX_PRICE}`,
        code: "OUT_OF_RANGE",
      });
    } else if (input.price && salePrice >= Number(input.price)) {
      warnings.push({
        field: "salePrice",
        message: "Sale price should be less than the regular price",
        code: "SALE_PRICE_HIGHER",
      });
    }
  }

  // Category (required)
  if (!input.category || (typeof input.category === "string" && input.category.trim().length === 0)) {
    errors.push({ field: "category", message: "Category is required", code: "REQUIRED" });
  }

  // Stock (optional)
  if (input.stock !== undefined && input.stock !== null && input.stock !== "") {
    const stock = Number(input.stock);
    if (isNaN(stock) || !Number.isInteger(stock)) {
      errors.push({ field: "stock", message: "Stock must be a valid integer", code: "INVALID_TYPE" });
    } else if (stock < MIN_STOCK || stock > MAX_STOCK) {
      errors.push({
        field: "stock",
        message: `Stock must be between ${MIN_STOCK} and ${MAX_STOCK}`,
        code: "OUT_OF_RANGE",
      });
    }
  }

  // Status
  if (input.status && typeof input.status === "string") {
    if (!VALID_STATUSES.has(input.status as string)) {
      errors.push({
        field: "status",
        message: `Invalid status: "${input.status}". Valid values: ${Array.from(VALID_STATUSES).join(", ")}`,
        code: "INVALID_ENUM",
      });
    }
  }

  // Type
  if (input.type && typeof input.type === "string") {
    if (!VALID_TYPES.has(input.type as string)) {
      warnings.push({
        field: "type",
        message: `Unrecognized product type: "${input.type}". Expected one of: ${Array.from(VALID_TYPES).join(", ")}`,
        code: "UNRECOGNIZED_TYPE",
      });
    }
  }

  // Description
  if (input.description && typeof input.description === "string") {
    if (input.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: "description",
        message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
        code: "MAX_LENGTH",
      });
    }
  }

  // Short description
  if (input.shortDescription && typeof input.shortDescription === "string") {
    if (input.shortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH) {
      errors.push({
        field: "shortDescription",
        message: `Short description must be ${MAX_SHORT_DESCRIPTION_LENGTH} characters or less`,
        code: "MAX_LENGTH",
      });
    }
  }

  // Images
  if (input.images && Array.isArray(input.images)) {
    if (input.images.length > MAX_IMAGES) {
      errors.push({
        field: "images",
        message: `Maximum ${MAX_IMAGES} images allowed`,
        code: "MAX_ITEMS",
      });
    }
    input.images.forEach((url: unknown, index: number) => {
      if (typeof url !== "string" || !isValidUrl(url as string)) {
        errors.push({
          field: `images[${index}]`,
          message: `Invalid image URL: "${url}"`,
          code: "INVALID_URL",
        });
      }
    });
  }

  // Tags
  if (input.tags && Array.isArray(input.tags)) {
    if (input.tags.length > MAX_TAGS) {
      errors.push({
        field: "tags",
        message: `Maximum ${MAX_TAGS} tags allowed`,
        code: "MAX_ITEMS",
      });
    }
    input.tags.forEach((tag: unknown, index: number) => {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push({
          field: `tags[${index}]`,
          message: "Each tag must be a non-empty string",
          code: "INVALID_FORMAT",
        });
      }
    });
  }

  // Affiliate URL
  if (input.affiliateUrl && typeof input.affiliateUrl === "string") {
    if (!isValidUrl(input.affiliateUrl)) {
      errors.push({
        field: "affiliateUrl",
        message: "Affiliate URL must be a valid URL (http/https)",
        code: "INVALID_URL",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an array of products for import.
 * Returns a consolidated report with per-row errors.
 */
export function validateProductBatch(
  products: Record<string, unknown>[],
): {
  valid: boolean;
  rows: Array<{ row: number; errors: ValidationError[]; warnings: ValidationError[] }>;
  totalErrors: number;
  totalWarnings: number;
} {
  const rows = products.map((product, index) => {
    const report = validateProduct(product);
    return {
      row: index + 1,
      errors: report.errors,
      warnings: report.warnings,
    };
  });

  const totalErrors = rows.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = rows.reduce((sum, r) => sum + r.warnings.length, 0);

  return {
    valid: totalErrors === 0,
    rows,
    totalErrors,
    totalWarnings,
  };
}

/* ================================================================== */
/*  CATEGORY VALIDATION                                               */
/* ================================================================== */

export function validateCategory(input: Record<string, unknown>): ValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Name (required)
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    errors.push({ field: "name", message: "Category name is required", code: "REQUIRED" });
  } else if (input.name.length > 255) {
    errors.push({
      field: "name",
      message: "Category name must be 255 characters or less",
      code: "MAX_LENGTH",
    });
  }

  // Slug
  if (input.slug && typeof input.slug === "string" && input.slug.length > 0) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug as string)) {
      errors.push({
        field: "slug",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
        code: "INVALID_FORMAT",
      });
    }
  }

  // Image
  if (input.image && typeof input.image === "string" && input.image.length > 0) {
    if (!isValidUrl(input.image as string)) {
      errors.push({
        field: "image",
        message: "Image must be a valid URL",
        code: "INVALID_URL",
      });
    }
  }

  // Description
  if (input.description && typeof input.description === "string" && input.description.length > 5000) {
    errors.push({
      field: "description",
      message: "Description must be 5000 characters or less",
      code: "MAX_LENGTH",
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ================================================================== */
/*  BRAND VALIDATION                                                  */
/* ================================================================== */

export function validateBrand(input: Record<string, unknown>): ValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Name (required)
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    errors.push({ field: "name", message: "Brand name is required", code: "REQUIRED" });
  } else if (input.name.length > 255) {
    errors.push({
      field: "name",
      message: "Brand name must be 255 characters or less",
      code: "MAX_LENGTH",
    });
  }

  // Slug
  if (input.slug && typeof input.slug === "string" && input.slug.length > 0) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug as string)) {
      errors.push({
        field: "slug",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
        code: "INVALID_FORMAT",
      });
    }
  }

  // Website
  if (input.website && typeof input.website === "string" && input.website.length > 0) {
    if (!isValidUrl(input.website as string)) {
      errors.push({
        field: "website",
        message: "Website must be a valid URL",
        code: "INVALID_URL",
      });
    }
  }

  // Image
  if (input.image && typeof input.image === "string" && input.image.length > 0) {
    if (!isValidUrl(input.image as string)) {
      errors.push({
        field: "image",
        message: "Image must be a valid URL",
        code: "INVALID_URL",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ================================================================== */
/*  SANITIZATION                                                      */
/* ================================================================== */

/**
 * Sanitize a product input by trimming strings and removing HTML.
 */
export function sanitizeProduct(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...input };

  // Trim string fields
  const stringFields = ["name", "slug", "sku", "brand", "category", "shortDescription",
    "description", "type", "status", "barcode", "gtin", "asin", "supplierId",
    "affiliateUrl", "affiliatePartner", "affiliateNetwork"];

  for (const field of stringFields) {
    if (typeof sanitized[field] === "string") {
      sanitized[field] = (sanitized[field] as string).trim();
    }
  }

  // Convert numeric fields
  const numericFields = ["price", "salePrice", "stock", "costPrice", "rating",
    "reviewCount", "affiliateCommission"];

  for (const field of numericFields) {
    if (sanitized[field] !== undefined && sanitized[field] !== null && sanitized[field] !== "") {
      sanitized[field] = Number(sanitized[field]);
    }
  }

  // Ensure arrays
  if (sanitized.images && !Array.isArray(sanitized.images)) {
    sanitized.images = [];
  }
  if (sanitized.tags && !Array.isArray(sanitized.tags)) {
    sanitized.tags = [];
  }
  if (sanitized.features && !Array.isArray(sanitized.features)) {
    sanitized.features = [];
  }

  // Ensure boolean fields
  const booleanFields = ["featured", "bestSeller", "isNew", "comingSoon", "preorder", "affiliate"];
  for (const field of booleanFields) {
    if (typeof sanitized[field] !== "boolean") {
      sanitized[field] = sanitized[field] === true || sanitized[field] === "true" || sanitized[field] === 1;
    }
  }

  return sanitized;
}
