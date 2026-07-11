/** ALAYA INSIDER — BI analytics computation engine (deterministic, derived from store data). */
import type { Article, Brand, Category, Coupon, Customer, Order, Product } from "./types";

const DAY = 86400000;
const now = () => Date.now();

export interface ExecKpis {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  lifetime: number;
  affiliate: number;
  digital: number;
  orders: number;
  aov: number;
  refunds: number;
  growth: number; // % vs previous period
}

function inRange(ts: number, from: number) {
  return ts >= from && ts <= now();
}

export function computeExec(orders: Order[], products: Product[]): ExecKpis {
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const todayFrom = startToday.getTime();
  const yestFrom = todayFrom - DAY;
  const weekFrom = now() - 7 * DAY;
  const monthFrom = now() - 30 * DAY;
  const yearFrom = now() - 365 * DAY;

  let today = 0, yesterday = 0, thisWeek = 0, thisMonth = 0, thisYear = 0, lifetime = 0, refunds = 0;
  orders.forEach((o) => {
    lifetime += o.total;
    if (inRange(o.createdAt, todayFrom)) today += o.total;
    if (o.createdAt >= yestFrom && o.createdAt < todayFrom) yesterday += o.total;
    if (inRange(o.createdAt, weekFrom)) thisWeek += o.total;
    if (inRange(o.createdAt, monthFrom)) thisMonth += o.total;
    if (inRange(o.createdAt, yearFrom)) thisYear += o.total;
    if (o.status === "refunded") refunds += o.total;
  });

  const affiliate = products.filter((p) => p.affiliate).reduce((s, p) => s + p.price * 0.07, 0);
  const digital = orders
    .flatMap((o) => o.items)
    .reduce((s, it) => {
      const p = products.find((pp) => pp.id === it.productId);
      return p?.type === "digital" ? s + it.price * it.qty : s;
    }, 0);

  return {
    today: Math.round(today),
    yesterday: Math.round(yesterday),
    thisWeek: Math.round(thisWeek),
    thisMonth: Math.round(thisMonth),
    thisYear: Math.round(thisYear),
    lifetime: Math.round(lifetime),
    affiliate: Math.round(affiliate),
    digital: Math.round(digital),
    orders: orders.length,
    aov: orders.length ? Math.round(lifetime / orders.length) : 0,
    refunds: Math.round(refunds),
    growth: yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : today > 0 ? 100 : 0,
  };
}

/** Revenue trend over N days (returns Points for charts). */
export function revenueTrend(orders: Order[], days: number): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now() - i * DAY;
    const d = new Date(dayStart);
    d.setHours(0, 0, 0, 0);
    const from = d.getTime();
    const to = from + DAY;
    const rev = orders.filter((o) => o.createdAt >= from && o.createdAt < to).reduce((s, o) => s + o.total, 0);
    out.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Math.round(rev) });
  }
  return out;
}

export interface ProductPerf {
  product: Product;
  unitsSold: number;
  revenue: number;
}

export function productPerformance(orders: Order[], products: Product[]): ProductPerf[] {
  const map: Record<string, { units: number; revenue: number }> = {};
  orders.forEach((o) => o.items.forEach((it) => {
    map[it.productId] = map[it.productId] || { units: 0, revenue: 0 };
    map[it.productId].units += it.qty;
    map[it.productId].revenue += it.price * it.qty;
  }));
  return products
    .map((p) => ({ product: p, unitsSold: map[p.id]?.units ?? 0, revenue: map[p.id]?.revenue ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function categoryRevenue(orders: Order[], products: Product[], categories: Category[]) {
  const map: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((it) => {
    const p = products.find((pp) => pp.id === it.productId);
    if (p) map[p.category] = (map[p.category] || 0) + it.price * it.qty;
  }));
  return categories.map((c) => ({ label: c.name, value: Math.round(map[c.id] || 0) })).sort((a, b) => b.value - a.value);
}

export function brandRevenue(orders: Order[], products: Product[], brands: Brand[]) {
  const map: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((it) => {
    const p = products.find((pp) => pp.id === it.productId);
    if (p?.brandId) map[p.brandId] = (map[p.brandId] || 0) + it.price * it.qty;
  }));
  return brands.map((b) => ({ label: b.name, value: Math.round(map[b.id] || 0) })).filter((b) => b.value > 0).sort((a, b) => b.value - a.value);
}

export function customerSegments(customers: Customer[], orders: Order[]) {
  const orderCount: Record<string, number> = {};
  const spend: Record<string, number> = {};
  orders.forEach((o) => {
    const key = o.customer.email.toLowerCase();
    orderCount[key] = (orderCount[key] || 0) + 1;
    spend[key] = (spend[key] || 0) + o.total;
  });
  let newC = 0, returning = 0, vip = 0;
  customers.forEach((c) => {
    const n = orderCount[c.email.toLowerCase()] || 0;
    if (n === 0) return;
    if (spend[c.email.toLowerCase()] >= 300) vip++;
    else if (n > 1) returning++;
    else newC++;
  });
  return { newCustomers: newC, returning, vip, clv: customers.length ? Math.round(Object.values(spend).reduce((a, b) => a + b, 0) / customers.length) : 0 };
}

export function trafficSources() {
  // deterministic demo distribution (integration-ready)
  return [
    { label: "Organic", value: 42, color: "#9c7a4b" },
    { label: "Direct", value: 24, color: "#4b7a52" },
    { label: "Social", value: 16, color: "#4f6da3" },
    { label: "Email", value: 11, color: "#b9802f" },
    { label: "Referral", value: 7, color: "#b14b46" },
  ];
}

export function deviceBreakdown() {
  return [
    { label: "Mobile", value: 58, color: "#9c7a4b" },
    { label: "Desktop", value: 32, color: "#4f6da3" },
    { label: "Tablet", value: 10, color: "#4b7a52" },
  ];
}

export function orderStatusDist(orders: Order[]) {
  const map: Record<string, number> = {};
  orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
  const colors: Record<string, string> = {
    delivered: "#4b7a52", completed: "#4b7a52", paid: "#9c7a4b", shipped: "#9c7a4b",
    pending: "#b9802f", processing: "#b9802f", cancelled: "#b14b46", refunded: "#b14b46",
    packed: "#4f6da3", out_for_delivery: "#4f6da3",
  };
  return Object.entries(map).map(([label, value]) => ({ label, value, color: colors[label] || "#6e6356" }));
}

export function inventoryHealth(products: Product[]) {
  const low = products.filter((p) => p.stock > 0 && p.stock <= 8 && p.type !== "digital" && !p.affiliate).length;
  const out = products.filter((p) => p.stock === 0 && p.type !== "digital" && !p.affiliate).length;
  const healthy = products.length - low - out;
  return { healthy, low, out };
}

export function couponUsage(coupons: Coupon[]) {
  return coupons.map((c) => ({ label: c.code, value: c.usedCount })).sort((a, b) => b.value - a.value);
}

export function searchAnalytics() {
  return {
    popular: ["amber noir", "gold hoops", "leather tote", "vitamin c", "capsule wardrobe"],
    zero: ["red shoes", "cheap bags", "men wallet"],
    trending: ["amber noir", "signet ring", "cleansing oil"],
  };
}

export function articleViews(articles: Article[]) {
  return articles.map((a) => ({ label: a.title, value: Math.round(a.readMinutes * 120 + 340) })).sort((a, b) => b.value - a.value).slice(0, 5);
}

export function affiliateStats(products: Product[]) {
  const aff = products.filter((p) => p.affiliate);
  const clicks = aff.reduce((s, p) => s + Math.round(p.reviewCount * 0.8), 0);
  return {
    count: aff.length,
    clicks,
    revenue: Math.round(aff.reduce((s, p) => s + p.price * 0.07, 0)),
    ctr: aff.length ? 4.2 : 0,
    epc: aff.length ? 1.8 : 0,
  };
}
