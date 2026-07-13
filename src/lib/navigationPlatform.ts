/**
 * ALAYA INSIDER — Enterprise Navigation & Information Architecture Platform
 * -------------------------------------------------------------------------
 * Powers mega menus, taxonomy management, navigation hierarchies, category/brand/editorial
 * navigation structures, and AI-optimized link placement.
 *
 * All data is deterministic — works against the live catalogue without external dependencies.
 */
import type { Product, Category, Brand, Article } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type NavItemType =
  | "category"
  | "brand"
  | "collection"
  | "editorial"
  | "guide"
  | "topic"
  | "room"
  | "style"
  | "season"
  | "page"
  | "link"
  | "custom";

export interface NavItem {
  id: string;
  label: string;
  type: NavItemType;
  href: string;
  description?: string;
  image?: string;
  badge?: string;
  children?: NavItem[];
  meta?: Record<string, string>;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  columns?: number; // 1–4 columns in mega menu
}

export interface NavigationConfig {
  id: string;
  name: string;
  location: "primary" | "secondary" | "footer" | "mobile" | "mega";
  groups: NavGroup[];
  enabled: boolean;
  sticky?: boolean;
  transparent?: boolean;
}

export interface TaxonomyNode {
  id: string;
  label: string;
  slug: string;
  type: "category" | "topic" | "style" | "room" | "season" | "material";
  parentId?: string;
  children?: TaxonomyNode[];
  productCount: number;
  image?: string;
}

export interface NavigationAnalytics {
  totalClicks: number;
  topItems: { id: string; label: string; clicks: number }[];
  topCategories: { id: string; label: string; clicks: number }[];
  topBrands: { id: string; label: string; clicks: number }[];
  clickThroughRate: number;
}

/* ------------------------------------------------------------------ */
/*  Mega Navigation Builder                                           */
/* ------------------------------------------------------------------ */

/** Build the primary mega navigation groups from live catalogue data */
export function buildPrimaryNav(
  categories: Category[],
  brands: Brand[],
  articles: Article[]
): NavGroup[] {
  const groups: NavGroup[] = [];

  // Category group
  const categoryItems: NavItem[] = categories.map((c) => ({
    id: `cat-${c.id}`,
    label: c.name,
    type: "category" as NavItemType,
    href: `/shop?category=${c.id}`,
    description: c.tagline,
    image: c.image,
  }));
  groups.push({ id: "categories", label: "Shop by Category", items: categoryItems, columns: 2 });

  // Featured collections group
  const collectionItems: NavItem[] = [
    { id: "col-new", label: "New Arrivals", type: "collection", href: "/collections/new", badge: "Fresh" },
    { id: "col-bestsellers", label: "Best Sellers", type: "collection", href: "/collections/bestsellers", badge: "Popular" },
    { id: "col-trending", label: "Trending", type: "collection", href: "/collections/trending" },
    { id: "col-deals", label: "Sale", type: "collection", href: "/collections/deals", badge: "Sale" },
    { id: "col-luxury", label: "Luxury Collection", type: "collection", href: "/collections/luxury" },
    { id: "col-editors", label: "Editor's Choice", type: "collection", href: "/collections/editors" },
    { id: "col-gift", label: "Gift Guide", type: "collection", href: "/collections/gift" },
  ];
  groups.push({ id: "collections", label: "Collections", items: collectionItems, columns: 1 });

  // Brands group
  const featuredBrands = brands.filter((b) => b.featured).slice(0, 8);
  const brandItems: NavItem[] = featuredBrands.map((b) => ({
    id: `brand-${b.id}`,
    label: b.name,
    type: "brand" as NavItemType,
    href: `/brands/${b.slug}`,
    description: b.tagline,
    image: b.logo || b.image,
  }));
  if (brandItems.length > 0) {
    groups.push({ id: "brands", label: "Featured Brands", items: brandItems, columns: 2 });
  }

  // Editorial group
  const featuredArticles = articles.filter((a) => a.featured).slice(0, 4);
  const editorialItems: NavItem[] = featuredArticles.map((a) => ({
    id: `art-${a.id}`,
    label: a.title,
    type: "editorial" as NavItemType,
    href: `/journal/${a.slug}`,
    description: a.excerpt,
    image: a.cover,
  }));
  if (editorialItems.length > 0) {
    groups.push({ id: "editorial", label: "The Journal", items: editorialItems, columns: 1 });
  }

  return groups;
}

/** Build buying guide navigation items */
export function buildGuideNav(): NavItem[] {
  const guideTopics = [
    { id: "guide-capsule", label: "Capsule Wardrobe", tags: ["wardrobe", "capsule", "essential"] },
    { id: "guide-jewelry", label: "Fine Jewelry Guide", tags: ["jewelry", "gold", "diamond"] },
    { id: "guide-skincare", label: "Skincare Routine", tags: ["skincare", "beauty", "face"] },
    { id: "guide-gift", label: "Gifting Guide", tags: ["gift", "present"] },
    { id: "guide-home", label: "Home Decor Edit", tags: ["home", "decor", "interior"] },
  ];
  return guideTopics.map((g) => ({
    id: g.id,
    label: g.label,
    type: "guide" as NavItemType,
    href: `/shop?tags=${g.tags[0]}`,
    description: `Curated ${g.tags[0]} picks`,
  }));
}

/** Build trending topic navigation */
export function buildTrendingTopics(products: Product[]): NavItem[] {
  const tagFrequency = new Map<string, number>();
  products.forEach((p) => p.tags.forEach((t) => tagFrequency.set(t, (tagFrequency.get(t) || 0) + 1)));
  const trending = [...tagFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  return trending.map(([tag]) => ({
    id: `topic-${tag}`,
    label: tag.charAt(0).toUpperCase() + tag.slice(1),
    type: "topic" as NavItemType,
    href: `/shop?tags=${tag}`,
  }));
}

/** Build style/room navigation */
export function buildStyleNav(): NavItem[] {
  return [
    { id: "style-minimal", label: "Minimal", type: "style", href: "/shop?tags=minimal" },
    { id: "style-modern", label: "Modern", type: "style", href: "/shop?tags=modern" },
    { id: "style-classic", label: "Classic", type: "style", href: "/shop?tags=classic" },
    { id: "style-bohemian", label: "Bohemian", type: "style", href: "/shop?tags=bohemian" },
    { id: "style-avant", label: "Avant-Garde", type: "style", href: "/shop?tags=avant-garde" },
    { id: "style-art-deco", label: "Art Deco", type: "style", href: "/shop?tags=art-deco" },
  ];
}

export function buildRoomNav(): NavItem[] {
  return [
    { id: "room-living", label: "Living Room", type: "room", href: "/shop?tags=living" },
    { id: "room-bedroom", label: "Bedroom", type: "room", href: "/shop?tags=bedroom" },
    { id: "room-kitchen", label: "Kitchen", type: "room", href: "/shop?tags=kitchen" },
    { id: "room-bathroom", label: "Bathroom", type: "room", href: "/shop?tags=bathroom" },
    { id: "room-home-office", label: "Home Office", type: "room", href: "/shop?tags=office" },
    { id: "room-outdoor", label: "Outdoor", type: "room", href: "/shop?tags=outdoor" },
  ];
}

/** Build seasonal navigation */
export function buildSeasonNav(): NavItem[] {
  return [
    { id: "season-summer", label: "Summer Edit", type: "season", href: "/collections/new" },
    { id: "season-winter", label: "Winter Edit", type: "season", href: "/collections/new" },
    { id: "season-spring", label: "Spring Refresh", type: "season", href: "/collections/new" },
    { id: "season-fall", label: "Autumn/Winter", type: "season", href: "/collections/new" },
  ];
}

/* ------------------------------------------------------------------ */
/*  Taxonomy Builder                                                   */
/* ------------------------------------------------------------------ */

/** Build taxonomy tree from categories and products */
export function buildTaxonomy(
  categories: Category[],
  products: Product[]
): TaxonomyNode[] {
  return categories.map((c) => {
    const catProducts = products.filter((p) => p.category === c.id);
    // Sub-tags within this category as child nodes
    const tagCount = new Map<string, number>();
    catProducts.forEach((p) => p.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
    const children: TaxonomyNode[] = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({
        id: `${c.id}-${tag}`,
        label: tag.charAt(0).toUpperCase() + tag.slice(1),
        slug: tag,
        type: "topic" as const,
        parentId: c.id,
        productCount: count,
      }));
    return {
      id: c.id,
      label: c.name,
      slug: c.id,
      type: "category" as const,
      children,
      productCount: catProducts.length,
      image: c.image,
    };
  });
}

/** Get category analytics (product counts, engagement) */
export function getCategoryAnalytics(
  categories: Category[],
  products: Product[]
) {
  return categories.map((c) => {
    const catProducts = products.filter((p) => p.category === c.id);
    const avgPrice = catProducts.length > 0
      ? catProducts.reduce((s, p) => s + (p.salePrice ?? p.price), 0) / catProducts.length
      : 0;
    const avgRating = catProducts.length > 0
      ? catProducts.reduce((s, p) => s + p.rating, 0) / catProducts.length
      : 0;
    return {
      id: c.id,
      name: c.name,
      productCount: catProducts.length,
      avgPrice: Math.round(avgPrice * 100) / 100,
      avgRating: Math.round(avgRating * 100) / 100,
      bestSellers: catProducts.filter((p) => p.bestSeller).length,
      featured: catProducts.filter((p) => p.featured).length,
    };
  });
}

/** AI-powered navigation optimization suggestions */
export function getAISuggestion(
  navigationConfigs: NavigationConfig[],
  products: Product[]
): { suggestions: string[]; score: number } {
  const suggestions: string[] = [];
  let score = 100;

  // Check if any nav groups are empty
  navigationConfigs.forEach((config) => {
    config.groups.forEach((group) => {
      if (group.items.length === 0) {
        suggestions.push(`Group "${group.label}" in "${config.name}" is empty — consider removing or populating it.`);
        score -= 15;
      }
    });
  });

  // Check brand coverage
  const brandsWithProducts = new Set(products.filter((p) => p.brandId).map((p) => p.brandId));
  if (brandsWithProducts.size > 12) {
    suggestions.push("Consider adding more brand navigation links — you have brands with products not in the nav.");
    score -= 5;
  }

  // Check category coverage
  const navCategories = new Set(
    navigationConfigs.flatMap((c) => c.groups.flatMap((g) => g.items.filter((i) => i.type === "category").map((i) => i.label)))
  );
  const totalCategories = new Set(products.map((p) => p.category)).size;
  if (totalCategories > navCategories.size) {
    suggestions.push(`${totalCategories - navCategories.size} categories missing from navigation.`);
    score -= 5;
  }

  return { suggestions: suggestions.slice(0, 5), score: Math.max(0, score) };
}

/* ------------------------------------------------------------------ */
/*  Navigation Configuration Presets                                   */
/* ------------------------------------------------------------------ */

export function getDefaultNavConfigs(
  categories: Category[],
  brands: Brand[],
  articles: Article[]
): NavigationConfig[] {
  return [
    {
      id: "primary",
      name: "Primary Navigation",
      location: "primary",
      groups: buildPrimaryNav(categories, brands, articles),
      enabled: true,
      sticky: true,
    },
    {
      id: "mega",
      name: "Mega Menu",
      location: "mega",
      groups: [
        {
          id: "discover",
          label: "Discover",
          items: [
            { id: "disc-new", label: "New Arrivals", type: "collection", href: "/collections/new", badge: "Fresh" },
            { id: "disc-trending", label: "Trending", type: "collection", href: "/collections/trending" },
            { id: "disc-bestsellers", label: "Best Sellers", type: "collection", href: "/collections/bestsellers" },
            { id: "disc-editors", label: "Editor's Picks", type: "collection", href: "/collections/editors" },
            { id: "disc-deals", label: "Sale", type: "collection", href: "/collections/deals" },
          ],
        },
        {
          id: "explore",
          label: "Explore",
          items: buildStyleNav(),
        },
        {
          id: "rooms",
          label: "By Room",
          items: buildRoomNav(),
        },
        {
          id: "guides",
          label: "Guides",
          items: buildGuideNav(),
        },
      ],
      enabled: true,
    },
  ];
}

/** Get navigation stats for the admin dashboard */
export function getNavigationStats(
  configs: NavigationConfig[],
  categories: Category[],
  brands: Brand[],
  articles: Article[]
) {
  const totalNavItems = configs.reduce(
    (s, c) => s + c.groups.reduce((sg, g) => sg + g.items.length, 0),
    0
  );
  return {
    totalConfigs: configs.length,
    totalGroups: configs.reduce((s, c) => s + c.groups.length, 0),
    totalNavItems,
    categoriesInNav: categories.length,
    brandsInNav: brands.length,
    articlesInNav: articles.filter((a) => a.featured).length,
    enabledConfigs: configs.filter((c) => c.enabled).length,
  };
}
