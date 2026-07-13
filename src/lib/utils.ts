import type { CurrencySetting } from "./types";

/** Supported currencies with symbol + indicative conversion rate from USD. */
export const CURRENCIES: Record<string, CurrencySetting> = {
  USD: { code: "USD", symbol: "$", rate: 1 },
  EUR: { code: "EUR", symbol: "€", rate: 0.92 },
  GBP: { code: "GBP", symbol: "£", rate: 0.79 },
  CAD: { code: "CAD", symbol: "C$", rate: 1.36 },
  AUD: { code: "AUD", symbol: "A$", rate: 1.52 },
  INR: { code: "INR", symbol: "₹", rate: 83.2 },
};

export const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Germany",
  "France",
  "Italy",
  "Spain",
] as const;

/** Format a USD amount into the active display currency. */
export function formatPrice(amountUsd: number, currency: CurrencySetting): string {
  const value = (amountUsd || 0) * (currency.rate || 1);
  const hasFraction = Math.abs(value - Math.round(value)) > 0.001;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: hasFraction ? 2 : 0,
  }).format(value);
  return `${currency.symbol}${formatted}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(iso: number | string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: number | string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Deterministic id generator. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function orderNumber(): string {
  return `AL-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

/** Convert hex (#rgb / #rrggbb) to an rgba() string. */
export function hexToRgba(hex: string, alpha = 1): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const num = parseInt(h, 16);
  if (Number.isNaN(num) || h.length !== 6) return `rgba(156,122,75,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Build a portrait (2:3) Pexels image URL. */
export function img(id: number, w = 800, h = 1200): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/** Build a wide landscape Pexels image URL. */
export function wide(id: number, w = 1600, h = 900): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

export function discountPercent(price: number, sale?: number | null): number {
  if (!sale || sale >= price) return 0;
  return Math.round(((price - sale) / price) * 100);
}

/** Tiny deterministic string hash → 0..n-1 (used for varied sample data). */
export function hashToIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % mod;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
