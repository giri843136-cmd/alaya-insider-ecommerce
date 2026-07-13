/**
 * ALAYA INSIDER — Enterprise Recommendation Engine
 * -------------------------------------------------
 * Deterministic recommendation algorithms that power AI-driven product discovery.
 * Fully typed, no external dependencies — works against the live catalogue.
 *
 * Modules: Trending Detection, Similar Products, Style Matching, Bundle Suggestions,
 * Frequently Viewed, Editorial Recommendations, Homepage Personalization.
 */
import type { Product } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface RecommendationContext {
  productId?: string;
  category?: string;
  brandId?: string;
  viewedProducts: string[];
  wishlistProducts: string[];
  cartProducts: string[];
  preferredCategories?: string[];
  preferredBrands?: string[];
  tags?: string[];
}

export interface RecommendationResult {
  /** Unique id for tracking / analytics */
  id: string;
  label: string;
  description: string;
  products: Product[];
  confidence: number; // 0–1
  type: RecommendationType;
}

export type RecommendationType =
  | "trending"
  | "similar"
  | "style_match"
  | "bundle"
  | "frequently_viewed"
  | "editorial_pick"
  | "personalized"
  | "new_arrivals"
  | "back_in_stock"
  | "popular_in_category"
  | "complementary"
  | "seasonal"
  | "ai_suggested";

/* ------------------------------------------------------------------ */
/*  Scoring helpers                                                   */
/* ------------------------------------------------------------------ */

function popularityScore(p: Product): number {
  return p.rating * Math.min(p.reviewCount, 200) + (p.bestSeller ? 100 : 0) + (p.featured ? 50 : 0);
}

function recencyScore(p: Product): number {
  const age = Date.now() - p.createdAt;
  return Math.max(0, 1 - age / (365 * 86400000));
}

function priceAffinity(p: Product, budget: number): number {
  const price = p.salePrice ?? p.price;
  if (budget <= 0) return 1;
  const ratio = price / budget;
  if (ratio <= 1) return 1 - ratio * 0.3;
  return Math.max(0, 1 - (ratio - 1) * 0.5);
}

function tagOverlap(p: Product, tags: string[]): number {
  if (tags.length === 0) return 0;
  const productTags = new Set(p.tags.map((t) => t.toLowerCase()));
  const matchCount = tags.filter((t) => productTags.has(t.toLowerCase())).length;
  return matchCount / tags.length;
}

/* ------------------------------------------------------------------ */
/*  Recommendation strategies                                         */
/* ------------------------------------------------------------------ */

/** Trending products — popularity × recency decay */
export function trendingProducts(products: Product[], limit = 8): Product[] {
  return [...products]
    .map((p) => ({ p, score: popularityScore(p) * (0.3 + 0.7 * recencyScore(p)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Similar products based on shared tags + category + brand */
export function similarProducts(product: Product, allProducts: Product[], limit = 4): Product[] {
  const productTags = new Set(product.tags.map((t) => t.toLowerCase()));
  return allProducts
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      // Same category = strong signal
      if (p.category === product.category) score += 3;
      // Same brand = very strong signal
      if (p.brandId && product.brandId && p.brandId === product.brandId) score += 4;
      // Tag overlap
      const overlap = p.tags.filter((t) => productTags.has(t.toLowerCase())).length;
      score += overlap * 2;
      // Price range similarity (within 30%)
      const myPrice = product.salePrice ?? product.price;
      const theirPrice = p.salePrice ?? p.price;
      if (myPrice > 0 && theirPrice > 0) {
        const ratio = theirPrice / myPrice;
        if (ratio >= 0.7 && ratio <= 1.3) score += 1.5;
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Style matching — find products with aesthetic similarity */
export function styleMatchProducts(
  seedProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  const seedTags = new Set(seedProduct.tags.map((t) => t.toLowerCase()));
  const seedDesc = seedProduct.shortDescription.toLowerCase();
  return allProducts
    .filter((p) => p.id !== seedProduct.id)
    .map((p) => {
      let score = 0;
      // Tag overlap (weighted)
      const tagOverlapCount = p.tags.filter((t) => seedTags.has(t.toLowerCase())).length;
      score += tagOverlapCount * 2.5;
      // Category match
      if (p.category === seedProduct.category) score += 2;
      // Brand match
      if (p.brandId && seedProduct.brandId && p.brandId === seedProduct.brandId) score += 3;
      // Description keyword overlap
      const descWords = new Set(p.shortDescription.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
      const keywordOverlap = [...descWords].filter((w) => seedDesc.includes(w)).length;
      score += Math.min(keywordOverlap * 0.5, 2);
      // Price tier match
      const seedPrice = seedProduct.salePrice ?? seedProduct.price;
      const budget = seedPrice || 100;
      score += priceAffinity(p, budget) * 2;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Bundle suggestions — pieces that complement each other */
export function bundleSuggestions(
  seedProduct: Product,
  allProducts: Product[],
  limit = 3
): Product[] {
  const seedTags = new Set(seedProduct.tags.map((t) => t.toLowerCase()));
  const complementary = allProducts
    .filter((p) => p.id !== seedProduct.id && !p.affiliate)
    .map((p) => {
      let score = 0;
      // Complementary categories
      const complementaryPairs: Record<string, string[]> = {
        jewelry: ["bags", "fashion"],
        skincare: ["beauty", "fragrance"],
        bags: ["fashion", "jewelry"],
        fashion: ["jewelry", "bags", "fragrance"],
        home: ["fragrance", "fashion"],
        fragrance: ["skincare", "home"],
      };
      const complements = complementaryPairs[seedProduct.category] || [];
      if (complements.includes(p.category)) score += 4;
      // Tag affinity
      const overlap = p.tags.filter((t) => seedTags.has(t.toLowerCase())).length;
      score += overlap * 0.5;
      // Not same category = more complementary
      if (p.category !== seedProduct.category) score += 2;
      // Price harmony (within 50%)
      const seedPrice = seedProduct.salePrice ?? seedProduct.price;
      const theirPrice = p.salePrice ?? p.price;
      if (seedPrice > 0 && theirPrice > 0) {
        const ratio = theirPrice / seedPrice;
        if (ratio >= 0.5 && ratio <= 1.5) score += 1.5;
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
  return complementary;
}

/** Frequently viewed together — products in the same category/view group */
export function frequentlyViewedTogether(
  product: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  return allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => popularityScore(b) - popularityScore(a))
    .slice(0, limit);
}

/** Personalized recommendations based on user context */
export function personalizedRecommendations(
  products: Product[],
  context: RecommendationContext,
  limit = 8
): Product[] {
  const viewed = new Set(context.viewedProducts);
  const wishlisted = new Set(context.wishlistProducts);
  const inCart = new Set(context.cartProducts);

  return products
    .filter((p) => !viewed.has(p.id) || wishlisted.has(p.id))
    .map((p) => {
      let score = 0;
      // Wishlisted = high intent
      if (wishlisted.has(p.id)) score += 10;
      // Preferred categories
      if (context.preferredCategories?.includes(p.category)) score += 5;
      // Preferred brands
      if (p.brandId && context.preferredBrands?.includes(p.brandId)) score += 4;
      // Tag affinity
      if (context.tags?.length) score += tagOverlap(p, context.tags) * 3;
      // Popularity baseline
      score += popularityScore(p) / 100;
      // Recency
      score += recencyScore(p) * 2;
      // Exclude already purchased / in-cart
      if (inCart.has(p.id)) score -= 20;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Editorial picks — curated selection */
export function editorialPicks(products: Product[], limit = 8): Product[] {
  return [...products]
    .filter((p) => p.featured || p.bestSeller)
    .sort((a, b) => {
      const scoreA = (a.featured ? 10 : 0) + (a.bestSeller ? 5 : 0) + popularityScore(a);
      const scoreB = (b.featured ? 10 : 0) + (b.bestSeller ? 5 : 0) + popularityScore(b);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/** Seasonal recommendations — based on tag-based seasonal detection */
export function seasonalRecommendations(products: Product[], season?: string, limit = 8): Product[] {
  const seasonalTags: Record<string, string[]> = {
    summer: ["summer", "warm", "light", "fresh", "bright", "linen", "cotton"],
    winter: ["winter", "cold", "warm", "cozy", "knit", "cashmere", "wool"],
    spring: ["spring", "fresh", "floral", "light", "pastel"],
    fall: ["fall", "autumn", "warm", "earth", "cozy", "layered"],
  };
  const tags = season ? seasonalTags[season] || seasonalTags.summer : seasonalTags.summer;
  return products
    .map((p) => {
      const match = p.tags.filter((t) => tags.includes(t.toLowerCase())).length;
      return { p, score: match * 2 + popularityScore(p) / 100 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Back in stock */
export function backInStock(
  recentlyRestocked: string[],
  allProducts: Product[],
  limit = 4
): Product[] {
  const restocked = new Set(recentlyRestocked);
  return allProducts
    .filter((p) => restocked.has(p.id) && p.stock > 0)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  New Part 3.4 Strategies                                           */
/* ------------------------------------------------------------------ */

/** Complete The Look — complementary products that form an outfit/collection */
export function completeTheLook(
  seedProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  const seedCat = seedProduct.category;
  const seedTags = new Set(seedProduct.tags.map((t) => t.toLowerCase()));

  // Category pairing rules for outfit completion
  const outfitMap: Record<string, string[]> = {
    fashion: ["jewelry", "bags", "fashion"],
    jewelry: ["fashion", "bags"],
    bags: ["fashion", "jewelry"],
    beauty: ["fragrance", "beauty"],
    fragrance: ["beauty", "home"],
    home: ["fragrance", "home"],
  };

  const complementCats = outfitMap[seedCat] || [seedCat];

  return allProducts
    .filter((p) => p.id !== seedProduct.id && complementCats.includes(p.category))
    .map((p) => {
      let score = 0;
      // Same category but different product = alternate
      if (p.category === seedCat) score += 2;
      // Complementary category = strong signal
      if (p.category !== seedCat) score += 3;
      // Price harmony
      const seedPrice = seedProduct.salePrice ?? seedProduct.price;
      const theirPrice = p.salePrice ?? p.price;
      if (seedPrice > 0 && theirPrice > 0) {
        const ratio = theirPrice / seedPrice;
        if (ratio >= 0.5 && ratio <= 2) score += 2;
      }
      // Tag overlap
      const overlap = p.tags.filter((t) => seedTags.has(t.toLowerCase())).length;
      score += overlap;
      // Popularity bonus
      score += popularityScore(p) / 200;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Luxury alternatives — products similar but at a higher price tier */
export function luxuryAlternatives(
  product: Product,
  allProducts: Product[],
  limit = 3
): Product[] {
  const effectivePrice = product.salePrice ?? product.price;
  const productTags = new Set(product.tags.map((t) => t.toLowerCase()));

  return allProducts
    .filter((p) => p.id !== product.id)
    .map((p) => {
      const pPrice = p.salePrice ?? p.price;
      let score = 0;
      // Must be more expensive
      if (pPrice <= effectivePrice) return { p, score: 0 };
      // Price ratio contribution (higher = more luxurious)
      const ratio = (pPrice - effectivePrice) / effectivePrice;
      if (ratio > 0.1) score += 5;
      if (ratio > 0.3) score += 3;
      if (ratio > 0.5) score += 2;
      // Same category
      if (p.category === product.category) score += 4;
      // Same brand = same luxury tier
      if (p.brandId && product.brandId && p.brandId === product.brandId) score += 6;
      // Tag overlap for aesthetic similarity
      const overlap = p.tags.filter((t) => productTags.has(t.toLowerCase())).length;
      score += overlap * 2;
      // Featured/best seller prestige bonus
      if (p.featured) score += 3;
      if (p.bestSeller) score += 2;
      // Popularity
      score += popularityScore(p) / 200;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Budget alternatives — similar products at a lower price point */
export function budgetAlternatives(
  product: Product,
  allProducts: Product[],
  limit = 3
): Product[] {
  const effectivePrice = product.salePrice ?? product.price;
  const productTags = new Set(product.tags.map((t) => t.toLowerCase()));

  return allProducts
    .filter((p) => p.id !== product.id)
    .map((p) => {
      const pPrice = p.salePrice ?? p.price;
      let score = 0;
      // Must be cheaper
      if (pPrice >= effectivePrice) return { p, score: 0 };
      // Same category
      if (p.category === product.category) score += 5;
      // Tag overlap
      const overlap = p.tags.filter((t) => productTags.has(t.toLowerCase())).length;
      score += overlap * 2.5;
      // Same brand = comparable quality
      if (p.brandId && product.brandId && p.brandId === product.brandId) score += 3;
      // Popularity
      score += popularityScore(p) / 200;
      // Discount bonus (on sale = better value)
      if (p.salePrice && p.salePrice < p.price) score += 2;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Staff picks — hand-selected by the editorial team */
export function staffPicks(products: Product[], limit = 8): Product[] {
  return [...products]
    .filter((p) => p.featured || p.bestSeller)
    .sort((a, b) => {
      const scoreA = (a.featured ? 8 : 0) + (a.bestSeller ? 4 : 0) + popularityScore(a) / 100;
      const scoreB = (b.featured ? 8 : 0) + (b.bestSeller ? 4 : 0) + popularityScore(b) / 100;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/** Hidden gems — highly rated but less popular products */
export function hiddenGems(products: Product[], limit = 4): Product[] {
  return [...products]
    .filter((p) => !p.featured && !p.bestSeller && p.reviewCount >= 3 && p.rating >= 4)
    .sort((a, b) => {
      // Score favours high rating with modest review count (hidden gems)
      const scoreA = a.rating * 3 + Math.min(a.reviewCount, 15);
      const scoreB = b.rating * 3 + Math.min(b.reviewCount, 15);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/** Award winners — products that have editorial recognition */
export function awardWinners(products: Product[], limit = 4): Product[] {
  return [...products]
    .filter((p) => p.featured && p.rating >= 4.5 && p.reviewCount >= 5)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/** Popular in category — top products per category */
export function popularInCategory(
  products: Product[],
  category: string,
  limit = 4
): Product[] {
  return products
    .filter((p) => p.category === category)
    .sort((a, b) => popularityScore(b) - popularityScore(a))
    .slice(0, limit);
}

/** Get all recommendation types for the admin */
export function getAllRecommendationTypes(): { id: string; label: string; description: string }[] {
  return [
    { id: "trending", label: "Trending Now", description: "What the community loves right now" },
    { id: "similar", label: "You May Also Like", description: "Similar pieces based on attributes" },
    { id: "style_match", label: "Style Match", description: "Aesthetic similarity matching" },
    { id: "bundle", label: "Bundle Suggestions", description: "Products that complement each other" },
    { id: "frequently_viewed", label: "Frequently Viewed Together", description: "Products often browsed together" },
    { id: "editorial_pick", label: "Editor's Choice", description: "Hand-picked by editors" },
    { id: "personalized", label: "Personalized", description: "Tailored to browsing history" },
    { id: "new_arrivals", label: "New Arrivals", description: "Freshly added to our edit" },
    { id: "popular_in_category", label: "Popular in Category", description: "Top products by category" },
    { id: "complementary", label: "Complete The Look", description: "Outfit and collection completion" },
    { id: "seasonal", label: "Seasonal Edit", description: "Perfect for the current season" },
    { id: "luxury_alternative", label: "Luxury Alternatives", description: "Higher-price alternatives" },
    { id: "budget_alternative", label: "Budget Alternatives", description: "More affordable options" },
    { id: "staff_picks", label: "Staff Picks", description: "Curated by our team" },
    { id: "hidden_gems", label: "Hidden Gems", description: "Undiscovered treasures" },
    { id: "award_winners", label: "Award Winners", description: "Awarded and recognized products" },
  ];
}

/* ------------------------------------------------------------------ */
/*  Aggregate engine                                                   */
/* ------------------------------------------------------------------ */

export function getAllRecommendations(
  products: Product[],
  context: RecommendationContext,
  _recentlyRestocked: string[] = []
): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  // 1. Personalized (highest priority)
  const personalized = personalizedRecommendations(products, context);
  if (personalized.length > 0) {
    results.push({
      id: "rec_personalized",
      label: "Recommended for you",
      description: "Picked just for you based on your browsing and preferences.",
      products: personalized,
      confidence: context.viewedProducts.length > 0 ? 0.85 : 0.5,
      type: "personalized",
    });
  }

  // 2. Trending
  const trending = trendingProducts(products);
  if (trending.length > 0) {
    results.push({
      id: "rec_trending",
      label: "Trending now",
      description: "What the ALAYA community is loving right now.",
      products: trending,
      confidence: 0.75,
      type: "trending",
    });
  }

  // 3. Editorial picks
  const editorial = editorialPicks(products);
  if (editorial.length > 0) {
    results.push({
      id: "rec_editorial",
      label: "Editor's choice",
      description: "Hand-picked by our editorial team.",
      products: editorial,
      confidence: 0.9,
      type: "editorial_pick",
    });
  }

  // 4. New arrivals
  const newArrivals = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  if (newArrivals.length > 0) {
    results.push({
      id: "rec_new",
      label: "New arrivals",
      description: "Fresh additions to our edit.",
      products: newArrivals,
      confidence: 0.7,
      type: "new_arrivals",
    });
  }

  // 5. Seasonal
  const seasonal = seasonalRecommendations(products, "summer");
  if (seasonal.length > 0) {
    results.push({
      id: "rec_seasonal",
      label: "Seasonal edit",
      description: "Perfect for this season's mood.",
      products: seasonal,
      confidence: 0.65,
      type: "seasonal",
    });
  }

  // 6. Similar to last viewed
  if (context.productId) {
    const seed = products.find((p) => p.id === context.productId || p.slug === context.productId);
    if (seed) {
      const similar = similarProducts(seed, products);
      if (similar.length > 0) {
        results.push({
          id: "rec_similar",
          label: "You may also like",
          description: `Similar pieces to ${seed.name}.`,
          products: similar,
          confidence: 0.8,
          type: "similar",
        });
      }
      const style = styleMatchProducts(seed, products);
      if (style.length > 0) {
        results.push({
          id: "rec_style",
          label: "Style match",
          description: "Pieces with a similar aesthetic.",
          products: style,
          confidence: 0.7,
          type: "style_match",
        });
      }
    }
  }

  return results;
}

/** Get recommendation stats for analytics */
export function getRecommendationStats() {
  return {
    totalTypes: 13,
    strategies: [
      "trending", "similar", "style_match", "bundle",
      "frequently_viewed", "editorial_pick", "personalized",
      "new_arrivals", "back_in_stock", "popular_in_category",
      "complementary", "seasonal", "ai_suggested",
    ],
    scoringFactors: ["popularity", "recency", "price_affinity", "tag_overlap", "category_match", "brand_match"],
  };
}
