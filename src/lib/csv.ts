import type { Product } from "./types";
import { slugify } from "./utils";

/** CSV utilities for PIM bulk import / export (no external deps). */

const HEADERS = [
  "name", "brand", "category", "type", "price", "salePrice", "stock",
  "sku", "barcode", "gtin", "asin", "tags", "shortDescription",
  "description", "featured", "bestSeller", "isNew", "affiliate",
  "affiliateUrl", "affiliatePartner", "images",
];

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const s = Array.isArray(value) ? value.join(" | ") : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Convert products to a CSV string. */
export function productsToCsv(products: Product[]): string {
  const rows = products.map((p) =>
    [
      p.name, p.brand, p.category, p.type, p.price, p.salePrice ?? "", p.stock,
      p.sku, p.barcode ?? "", p.gtin ?? "", p.asin ?? "", p.tags.join(", "),
      p.shortDescription, p.description, p.featured, p.bestSeller, p.isNew,
      p.affiliate, p.affiliateUrl, p.affiliatePartner, p.images.join("\n"),
    ].map(escapeCsv).join(",")
  );
  return [HEADERS.join(","), ...rows].join("\n");
}

export interface ParsedRow {
  product: Partial<Product> & { name: string; category: string };
  errors: string[];
}

/** Parse CSV text into partial products with validation + per-row errors. */
export function parseProductsCsv(text: string): ParsedRow[] {
  const lines = splitCsvLines(text);
  if (lines.length < 2) return [];
  const header = lines[0].map((h) => h.trim());
  const out: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i];
    if (cols.length === 1 && cols[0].trim() === "") continue;
    const row: Record<string, string> = {};
    header.forEach((h, idx) => (row[h] = (cols[idx] ?? "").trim()));

    const errors: string[] = [];
    const name = row.name;
    const category = row.category;
    if (!name) errors.push("Missing name");
    if (!category) errors.push("Missing category");
    const price = Number(row.price);
    if (row.price !== "" && Number.isNaN(price)) errors.push("Invalid price");

    if (!name || !category) {
      out.push({ product: { name: name || "(invalid)", category: category || "uncategorised" }, errors });
      continue;
    }

    const num = (v: string) => (v === "" ? undefined : Number(v));
    out.push({
      product: {
        name,
        brand: row.brand || undefined,
        category,
        type: (row.type as Product["type"]) || "physical",
        price: Number.isNaN(price) ? 0 : price,
        salePrice: num(row.salePrice) ?? null,
        stock: num(row.stock) ?? 0,
        sku: row.sku || "",
        barcode: row.barcode || undefined,
        gtin: row.gtin || undefined,
        asin: row.asin || undefined,
        tags: row.tags ? row.tags.split(/[,/]/).map((t) => t.trim()).filter(Boolean) : [],
        shortDescription: row.shortDescription || "",
        description: row.description || "",
        featured: row.featured === "true",
        bestSeller: row.bestSeller === "true",
        isNew: row.isNew === "true",
        affiliate: row.affiliate === "true",
        affiliateUrl: row.affiliateUrl || undefined,
        affiliatePartner: row.affiliatePartner || undefined,
        images: row.images ? row.images.split(/\n+/).map((s) => s.trim()).filter(Boolean) : [],
        slug: slugify(name),
      },
      errors,
    });
  }
  return out;
}

/** Triggers a browser download of CSV content. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Minimal CSV line splitter that respects quoted fields with embedded commas/newlines. */
function splitCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (char === "\r") { /* ignore */ }
      else { field += char; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
