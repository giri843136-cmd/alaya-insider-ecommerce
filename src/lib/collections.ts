import type { Product } from "./types";

/**
 * ALAYA INSIDER — Curated collection definitions.
 * Each entry maps a navigation destination to a title, copy, hero image,
 * and a deterministic filter/sort over the product catalogue.
 *
 * Adding a new collection = adding one object here + one route in App.tsx.
 * The navigation/information architecture scales without code redesign.
 */
export interface CollectionDef {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  hero: number; // pexels image id (wide)
  accent?: boolean; // dark hero treatment
  filter: (products: Product[]) => Product[];
}

const effectivePrice = (p: Product) => p.salePrice ?? p.price;
const byNewest = (a: Product, b: Product) => b.createdAt - a.createdAt;
const byPopular = (a: Product, b: Product) => b.reviewCount - a.reviewCount;
const byRating = (a: Product, b: Product) => b.rating - a.rating;
const byDiscount = (a: Product, b: Product) =>
  (b.price - effectivePrice(b)) / b.price - (a.price - effectivePrice(a)) / a.price;

export const COLLECTIONS: Record<string, CollectionDef> = {
  deals: {
    id: "deals",
    eyebrow: "On sale",
    title: "The Sale Edit",
    description: "Considered pieces, now at their most irresistible. Limited time — while stocks last.",
    hero: 17775855,
    filter: (p) => p.filter((x) => x.salePrice && x.salePrice < x.price).sort(byDiscount),
  },
  flash: {
    id: "flash",
    eyebrow: "Flash deals",
    title: "Flash Deals",
    description: "Our steepest markdowns, dropping fast. When they're gone, they're gone.",
    hero: 10476251,
    accent: true,
    filter: (p) => p.filter((x) => x.salePrice && x.salePrice < x.price).sort(byDiscount).slice(0, 12),
  },
  today: {
    id: "today",
    eyebrow: "Today only",
    title: "Today's Deals",
    description: "Fresh savings refreshed daily across beauty, leather, jewelry and home.",
    hero: 33464930,
    filter: (p) => p.filter((x) => x.salePrice && x.salePrice < x.price).sort(byNewest),
  },
  bestsellers: {
    id: "bestsellers",
    eyebrow: "Loved by thousands",
    title: "Best Sellers",
    description: "The pieces our community reaches for again and again.",
    hero: 8502484,
    filter: (p) => p.filter((x) => x.bestSeller).sort(byPopular),
  },
  new: {
    id: "new",
    eyebrow: "Just landed",
    title: "New Arrivals",
    description: "The latest additions to the ALAYA edit — fresh in this week.",
    hero: 3765538,
    filter: (p) => [...p].sort(byNewest),
  },
  trending: {
    id: "trending",
    eyebrow: "On everyone's list",
    title: "Trending Now",
    description: "What the world is loving right now, ranked by demand.",
    hero: 33401555,
    filter: (p) => [...p].sort((a, b) => byPopular(a, b) || byRating(a, b)),
  },
  popular: {
    id: "popular",
    eyebrow: "Most wanted",
    title: "Most Popular",
    description: "The most-reviewed and highest-rated pieces in the catalogue.",
    hero: 11826093,
    filter: (p) => [...p].sort(byPopular),
  },
  luxury: {
    id: "luxury",
    eyebrow: "The Luxury Collection",
    title: "Luxury Collection",
    description: "Investment pieces and future heirlooms — our most considered edit.",
    hero: 30541170,
    accent: true,
    filter: (p) => [...p].filter((x) => effectivePrice(x) >= 150 || x.featured).sort((a, b) => effectivePrice(b) - effectivePrice(a)),
  },
  editors: {
    id: "editors",
    eyebrow: "Editor's Choice",
    title: "Editor's Choice",
    description: "Hand-selected favourites from the desks of our style editors.",
    hero: 6538441,
    filter: (p) => [...p].filter((x) => x.featured).sort(byRating),
  },
  gift: {
    id: "gift",
    eyebrow: "Gift Guide",
    title: "The Gift Edit",
    description: "Gift-worthy pieces for every occasion — beautifully presented, always welcome.",
    hero: 14940718,
    filter: (p) => [...p].sort((a, b) => Number(!!b.bestSeller) - Number(!!a.bestSeller) || byRating(a, b)),
  },
  clearance: {
    id: "clearance",
    eyebrow: "Last chance",
    title: "Clearance",
    description: "Final reductions on retiring styles — up to 50% off, very limited stock.",
    hero: 8049841,
    filter: (p) => p.filter((x) => x.salePrice && x.salePrice < x.price).sort(byDiscount),
  },
  affiliate: {
    id: "affiliate",
    eyebrow: "Curated from partners",
    title: "Affiliate Picks",
    description: "Treasures we love from the world's finest retailers.",
    hero: 9430468,
    filter: (p) => p.filter((x) => x.affiliate),
  },
  digital: {
    id: "digital",
    eyebrow: "Download instantly",
    title: "Digital Guides",
    description: "Capsule wardrobes, masterclasses and workbooks — yours forever.",
    hero: 36701535,
    filter: (p) => p.filter((x) => x.type === "digital").sort(byPopular),
  },
};

export const COLLECTION_GROUPS: { label: string; items: { to: string; label: string }[] }[] = [
  {
    label: "Shop",
    items: [
      { to: "/shop", label: "All products" },
      { to: "/collections/new", label: "New arrivals" },
      { to: "/collections/bestsellers", label: "Best sellers" },
      { to: "/collections/trending", label: "Trending" },
      { to: "/collections/popular", label: "Most popular" },
    ],
  },
  {
    label: "Deals",
    items: [
      { to: "/collections/deals", label: "The sale edit" },
      { to: "/collections/flash", label: "Flash deals" },
      { to: "/collections/today", label: "Today's deals" },
      { to: "/collections/clearance", label: "Clearance" },
    ],
  },
  {
    label: "Edits",
    items: [
      { to: "/collections/luxury", label: "Luxury collection" },
      { to: "/collections/editors", label: "Editor's choice" },
      { to: "/collections/gift", label: "Gift guide" },
      { to: "/collections/affiliate", label: "Affiliate picks" },
      { to: "/collections/digital", label: "Digital guides" },
    ],
  },
];
