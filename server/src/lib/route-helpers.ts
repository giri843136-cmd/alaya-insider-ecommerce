/**
 * ALAYA INSIDER — Typed Route Helpers
 * --------------------------------------------------------------------------
 * Reduces (body as any), (patch as any), and (c.req.query() as any) patterns
 * across all route files by providing properly typed utility functions.
 *
 * Usage:
 *   import { parseBody, parseQueryParams } from "../lib/route-helpers.js";
 *   import type { ListParams } from "../db/index.js";
 *
 *   const body = await parseBody<Partial<Product>>(c);
 *   const params = parseQueryParams(c);
 *   const result = await products.list(params);
 */

import type { Context } from "hono";
import type { ListParams } from "../db/index.js";

/**
 * Parse and type-safely extract query parameters from a request.
 * Returns a properly typed ListParams object instead of using `c.req.query() as any`.
 */
export function parseQueryParams(c: Context): ListParams {
  const raw = c.req.query();
  const params: ListParams = {};
  
  if (raw.page) params.page = parseInt(raw.page, 10);
  if (raw.pageSize) params.pageSize = parseInt(raw.pageSize, 10);
  if (raw.search) params.search = raw.search;
  if (raw.sort) params.sort = raw.sort;
  if (raw.order === "asc" || raw.order === "desc") params.order = raw.order;
  else if (raw.order) (params as Record<string, string>).order = raw.order;

  // Pass through any additional filter parameters
  for (const [key, val] of Object.entries(raw)) {
    if (!["page", "pageSize", "search", "sort", "order"].includes(key) && val !== undefined) {
      (params as Record<string, string>)[key] = val;
    }
  }

  return params;
}

/**
 * Parse JSON request body with proper typing.
 * Replaces `c.req.json<any>()` pattern.
 */
export async function parseBody<T extends Record<string, unknown>>(c: Context): Promise<Partial<T>> {
  try {
    const body = await c.req.json<Record<string, unknown>>();
    return body as Partial<T>;
  } catch {
    return {} as Partial<T>;
  }
}

/**
 * Parse JSON body string values into appropriate types (number, boolean).
 * Useful for query params that arrive as strings but should be numbers.
 */
export function parseNumericQuery(raw: Record<string, string | undefined>, key: string): number | undefined {
  const val = raw[key];
  if (val === undefined || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

export function parseBooleanQuery(raw: Record<string, string | undefined>, key: string): boolean | undefined {
  const val = raw[key];
  if (val === undefined) return undefined;
  return val === "true" || val === "1";
}
