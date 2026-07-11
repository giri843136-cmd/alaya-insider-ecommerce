/**
 * ALAYA INSIDER — Frontend Seed Data
 * ====================================================================
 * Comprehensive demo data for the standalone SPA.
 * Mirrors the server seed data in server/src/seed/ for consistency.
 *
 * This data is used by StoreContext when localStorage is empty (first visit)
 * and no backend API is configured.
 */

import { uid } from "./utils";

/* ================================================================== */
/*  TIME HELPERS (computed at module load time)                        */
/* ================================================================== */

const NOW = Date.now();
const DAY = 86400000;
const HOUR = 3600000;
function daysAgo(d: number): number { return NOW - d * DAY; }
function hoursAgo(h: number): number { return NOW - h * HOUR; }

/* ================================================================== */
/*  IMAGE HELPERS                                                      */
/* ================================================================== */

function img(id: number, w = 800, h = 1200): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

function wide(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900`;
}

function thumb(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=300&h=300`;
}

/* ================================================================== */
/*  CATEGORIES                                                         */
/* ================================================================== */

export const SEED_CATEGORIES = [
  { id: "home-living",    name: "Home & Living",    tagline: "Curated spaces, intentional living",         description: "Transform your home into a sanctuary with our carefully curated collection of home decor, textiles, and decorative accents.",    image: img(1571460) },
  { id: "kitchen",        name: "Kitchen",           tagline: "Tools for the art of cooking",               description: "Elevate your culinary experience with premium kitchen essentials designed for both form and function.",                    image: img(262917) },
  { id: "beauty",         name: "Beauty",            tagline: "Clean ingredients, radiant results",         description: "Discover a curated edit of clean beauty essentials that nurture your skin and elevate your daily ritual.",                  image: img(3738343) },
  { id: "electronics",    name: "Electronics",       tagline: "Smart design meets modern life",             description: "Thoughtfully selected electronics that seamlessly integrate into your lifestyle.",                                       image: img(577769) },
  { id: "travel",         name: "Travel",            tagline: "Journey in style",                          description: "Everything you need for effortless travel, from durable luggage to clever organizers.",                                    image: img(1008155) },
  { id: "health",         name: "Health",            tagline: "Wellness that fits your life",              description: "Support your wellness journey with thoughtfully designed products that make healthy living achievable.",                    image: img(2294361) },
  { id: "lifestyle",      name: "Lifestyle",         tagline: "The art of everyday living",                description: "Celebrate the art of everyday living with our lifestyle collection.",                                                    image: img(1122868) },
  { id: "fragrance",      name: "Fragrance",         tagline: "Scents that tell a story",                  description: "Explore our collection of fine fragrances and home scents.",                                                              image: img(965998) },
];

/* ================================================================== */
/*  BRANDS                                                             */
/* ================================================================== */

export const SEED_BRANDS = [
  { id: "atelier-co",    name: "Atelier & Co.",    slug: "atelier-co",    tagline: "French-groomed luxury for body and home",    description: "Born in a small apothecary in Provence, crafting exquisite fragrances and skincare since 2012.",                image: img(965998, 800, 600),    website: "https://atelierco.example.com",    instagram: "@atelier_co",    country: "France",     featured: true },
  { id: "lumina-home",   name: "Lumina Home",      slug: "lumina-home",   tagline: "Illuminate your world",                      description: "Scandinavian design sensibility for everyday living — homewares marrying clean lines with warmth.",               image: img(1571460, 800, 600),   website: "https://luminahome.example.com",  instagram: "@lumina_home",   country: "Denmark",    featured: true },
  { id: "voya",          name: "Voya",              slug: "voya",          tagline: "Designed for the journey",                   description: "Travel essentials for the modern nomad — every product designed with input from frequent travelers.",               image: img(1008155, 800, 600),   website: "https://voya.example.com",       instagram: "@voya_travel",   country: "United States", featured: true },
  { id: "terra-stone",   name: "Terra & Stone",     slug: "terra-stone",   tagline: "Handcrafted from the earth",                 description: "Working directly with artisan communities in Portugal and Italy to create handcrafted ceramics and stoneware.",   image: img(262917, 800, 600),     website: "https://terrastone.example.com",  instagram: "@terra_stone",   country: "Portugal",   featured: true },
  { id: "clarity",       name: "Clarity",           slug: "clarity",       tagline: "Clear thinking, clean design",               description: "Electronics and wellness products enhancing focus and well-being — based in Berlin.",                                image: img(577769, 800, 600),     website: "https://clarity.example.com",    instagram: "@clarity_berlin", country: "Germany",   featured: false },
  { id: "nourish-bloom", name: "Nourish & Bloom",   slug: "nourish-bloom", tagline: "Clean beauty, conscious choices",             description: "Clean beauty brand formulated without parabens, sulfates, or synthetic fragrances.",                                 image: img(3738343, 800, 600),   website: "https://nourishbloom.example.com", instagram: "@nourish_bloom", country: "United States", featured: true },
  { id: "ever-oak",      name: "Ever & Oak",        slug: "ever-oak",      tagline: "Rooted in quality",                          description: "Lifestyle goods designed to be cherished for years — crafted with sustainable materials and timeless design.",     image: img(1122868, 800, 600),   website: "https://everoak.example.com",    instagram: "@ever_and_oak",  country: "United Kingdom", featured: false },
  { id: "wanderlust",    name: "Wanderlust",        slug: "wanderlust",    tagline: "Adventure awaits",                           description: "Premium gear for the modern explorer — versatile products transitioning from trail to table.",                      image: img(2762942, 800, 600),   website: "https://wanderlust.example.com",  instagram: "@wanderlust_gear", country: "United States", featured: false },
];

/* ================================================================== */
/*  HELPER: product factory                                            */
/* ================================================================== */

function rid(): string { return `rev_${Math.random().toString(36).slice(2, 10)}`; }
function pid(): string { return `prod_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`; }
function sku(prefix: string, n: number): string { return `AL-${prefix}-${String(n).padStart(4, "0")}`; }
function spec(label: string, value: string) { return { label, value }; }
function rnd(min: number, max: number) { return Math.round((min + Math.random() * (max - min)) * 10) / 10; }
function rcnt(min = 5, max = 200) { return Math.floor(min + Math.random() * (max - min)); }
function stk(min = 0, max = 200) { return Math.floor(min + Math.random() * (max - min)); }

function productImage(url: string): string {
  return `${url}?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1200`;
}

function makeReview(author: string, rating: number, title: string, body: string, daysBack: number, verified = true, helpful?: number) {
  return { id: rid(), author, rating, title, body, date: new Date(daysAgo(daysBack)).toISOString(), verified, helpful: helpful ?? Math.floor(Math.random() * 30 + 5) };
}

/* ================================================================== */
/*  PRODUCTS — 30 across 8 categories                                  */
/* ================================================================== */

const _homeProducts = [
  {
    id: pid(), slug: "artisan-scented-candle-collection", name: "Artisan Scented Candle Collection — Trio",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "home-living", type: "physical" as const,
    price: 68, salePrice: 54, rating: rnd(4.2, 4.9), reviewCount: rcnt(30, 80),
    images: [productImage(img(965998)), productImage(img(1571460)), productImage(img(1122868))],
    shortDescription: "Three hand-poured soy wax candles in signature fragrances: Amber & Sandalwood, Wild Fig & Cassis, and Linen & Cotton.",
    description: "Transform your space with our Artisan Scented Candle Trio from Atelier & Co. Each candle is hand-poured in small batches using 100% natural soy wax, cotton wicks, and fine fragrance oils. Housed in matte ceramic vessels that transition beautifully into decor pieces long after the candle has burned. Burn time: approximately 45 hours each.",
    features: ["100% natural soy wax", "Cotton-core lead-free wicks", "45+ hour burn time each", "Matte ceramic vessels", "Phthalate-free fragrances", "Hand-poured in small batches"],
    stock: stk(15, 60), sku: sku("HOM", 1), tags: ["candles", "home-fragrance", "gift-ideas", "artisan", "soy-wax", "attic"],
    barcode: "8712345678901", gtin: "08712345678901", asin: "B0EXAMPLE001", costPrice: 22,
    featured: true, bestSeller: true, status: "published" as const,
    reviews: [
      makeReview("Sophie M.", 5, "Absolutely divine", "These candles are incredible. The Wild Fig & Cassis is my new favorite scent — it fills my entire living room with the most beautiful warm aroma.", 15, true, 23),
      makeReview("James K.", 4, "Beautiful but subtle", "Lovely candles with a refined, subtle scent. If you prefer strong fragrance throw, these might be too subtle. But for a sophisticated, natural aroma they're perfect.", 34, true, 8),
    ],
    specs: [spec("Burn Time", "45+ hours per candle"), spec("Wax Type", "100% Natural Soy"), spec("Wick", "Cotton-core, lead-free"), spec("Weight", "8 oz each (240g total)"), spec("Fragrance Family", "Woody, Floral, Fresh"), spec("Origin", "Hand-poured in France")],
    createdAt: daysAgo(120),
  },
  {
    id: pid(), slug: "lambswool-throw-blanket", name: "Lambswool Throw Blanket — Portugal",
    brand: "Lumina Home", brandId: "lumina-home", category: "home-living", type: "physical" as const,
    price: 145, salePrice: null, rating: rnd(4.0, 4.8), reviewCount: rcnt(15, 50),
    images: [productImage(img(1571460)), productImage(img(1122868))],
    shortDescription: "Ultra-soft Portuguese lambswool throw, expertly woven for warmth and breathability.",
    description: "The Lambswool Throw Blanket is woven in Portugal from the finest lambswool, sourced from sustainable farms in northern Portugal. The result is a blanket that's impossibly soft, naturally temperature-regulating, and built to last for decades.",
    features: ["100% Portuguese lambswool", "Naturally temperature regulating", "Hand-finished fringe detailing", "Hypoallergenic", "Ethically sourced wool", "Machine washable gentle cycle"],
    stock: stk(8, 35), sku: sku("HOM", 2), tags: ["blankets", "throws", "home-decor", "loungewear", "portuguese", "lambswool"],
    barcode: "8712345678902", gtin: "08712345678902", supplierId: "sup_pt", costPrice: 55, featured: true, isNew: true, status: "published" as const,
    reviews: [makeReview("Clara D.", 5, "Heirloom quality", "This throw is absolutely stunning. The weight is perfect — heavy enough to feel substantial but light enough for year-round use.", 8, true, 15)],
    specs: [spec("Material", "100% Portuguese Lambswool"), spec("Dimensions", "130cm x 180cm"), spec("Weight", "680g"), spec("Care", "Machine wash gentle, air dry"), spec("Origin", "Woven in Portugal"), spec("Colors", "Oatmeal, Charcoal, Blush")],
    createdAt: daysAgo(45),
  },
  {
    id: pid(), slug: "handblown-glass-vase", name: "Handblown Glass Vase — Ambre Collection",
    brand: "Lumina Home", brandId: "lumina-home", category: "home-living", type: "physical" as const,
    price: 89, salePrice: 72, rating: rnd(3.8, 4.7), reviewCount: rcnt(10, 35),
    images: [productImage(img(1122868))],
    shortDescription: "Mouth-blown amber glass vase with an organic, sculptural form by Italian artisans.",
    description: "Each vase in the Ambre Collection is individually mouth-blown by master glass artisans in Murano, Italy. The warm amber hue is achieved through a traditional technique using pure gold chloride, creating subtle variations in color and depth that make every piece unique.",
    features: ["Mouth-blown Murano glass", "Authentic gold chloride amber hue", "Organic asymmetrical form", "Signature etched base", "Each piece is unique", "Watertight — suitable for fresh flowers"],
    stock: stk(3, 20), sku: sku("HOM", 3), tags: ["vases", "glassware", "italian", "murano", "home-decor", "sculptural"],
    costPrice: 32, isNew: true, status: "published" as const,
    reviews: [makeReview("Marcus L.", 5, "A work of art", "Even more beautiful in person. The amber color shifts in different lighting — sometimes almost honey, sometimes deep cognac.", 12, true, 11)],
    specs: [spec("Material", "Mouth-blown Murano Glass"), spec("Height", "28cm"), spec("Width", "14cm (at widest)"), spec("Color", "Amber (varies per piece)"), spec("Origin", "Murano, Italy"), spec("Care", "Hand wash with soft cloth")],
    createdAt: daysAgo(30),
  },
  {
    id: pid(), slug: "organic-linen-curtain-panel", name: "Organic Linen Curtain Panel — Oatmeal",
    brand: "Lumina Home", brandId: "lumina-home", category: "home-living", type: "physical" as const,
    price: 120, salePrice: 96, rating: rnd(4.0, 4.6), reviewCount: rcnt(20, 60),
    images: [productImage(img(1571460)), productImage(img(1122868))],
    shortDescription: "Pure organic linen curtain panels with a relaxed, lived-in drape. Set of two.",
    description: "Our Organic Linen Curtains are woven from 100% GOTS-certified organic flax in Lithuania. The mid-weight linen has a stonewashed finish for a relaxed, lived-in feel from day one.",
    features: ["100% GOTS-certified organic linen", "Stonewashed for softness", "Set of two panels", "4\" rod pocket", "1.5\" hem", "Pre-washed and pre-shrunk"],
    stock: stk(10, 30), sku: sku("HOM", 4), tags: ["curtains", "linen", "organic", "window-treatments", "scandinavian"],
    costPrice: 40, featured: true, status: "published" as const,
    reviews: [makeReview("Elena R.", 4, "Beautiful drape", "The color is exactly as pictured — a warm oatmeal that works perfectly with our neutral palette.", 28, true, 6)],
    specs: [spec("Material", "100% GOTS Organic Linen"), spec("Dimensions", "132cm x 274cm per panel"), spec("Set Includes", "2 panels"), spec("Weight", "190gsm"), spec("Light Filtering", "Semi-sheer / Filtered"), spec("Origin", "Woven in Lithuania")],
    createdAt: daysAgo(60),
  },
  {
    id: pid(), slug: "terra-cotta-plant-pot-set", name: "Terracotta Plant Pot Set — Mediterranean",
    brand: "Terra & Stone", brandId: "terra-stone", category: "home-living", type: "physical" as const,
    price: 45, salePrice: null, rating: rnd(3.9, 4.5), reviewCount: rcnt(8, 25),
    images: [productImage(img(1122868))],
    shortDescription: "Set of three hand-thrown terracotta pots from Tuscany with saucers included.",
    description: "These terracotta pots are hand-thrown by artisans in Tuscany using clay sourced from the Chianti region. Each pot features a natural, unglazed finish that ages beautifully.",
    features: ["Hand-thrown Tuscan terracotta", "Natural unglazed finish", "Set of three sizes", "Matching saucers included", "Drainage hole with cork plug", "Develops natural patina over time"],
    stock: stk(12, 40), sku: sku("HOM", 5), tags: ["plant-pots", "terracotta", "italian", "handmade", "indoor-garden"],
    barcode: "8712345678905", costPrice: 14, isNew: true, status: "published" as const,
    reviews: [makeReview("Priya S.", 5, "Gorgeous craftsmanship", "You can see and feel the handmade quality immediately. The clay has beautiful subtle variations.", 10, true, 9)],
    specs: [spec("Material", "Tuscan Terracotta"), spec("Sizes", "Small: 10cm, Medium: 14cm, Large: 18cm"), spec("Includes", "3 pots + 3 saucers"), spec("Finish", "Natural, unglazed"), spec("Origin", "Hand-thrown in Tuscany, Italy"), spec("Care", "Wipe clean; avoid prolonged water exposure")],
    createdAt: daysAgo(20),
  },
];

const _kitchenProducts = [
  {
    id: pid(), slug: "japanese-ceramic-knife-set", name: "Japanese Ceramic Knife Set — Trio",
    brand: "Terra & Stone", brandId: "terra-stone", category: "kitchen", type: "physical" as const,
    price: 175, salePrice: 148, rating: rnd(4.3, 4.9), reviewCount: rcnt(40, 100),
    images: [productImage(img(262917)), productImage(img(1571460))],
    shortDescription: "Three precision ceramic knives with ergonomic handles: chef's, utility, and paring.",
    description: "Our Japanese Ceramic Knife Set brings together three essential kitchen knives featuring Zirconia 92 ceramic blades — the hardest ceramic blade material available, second only to diamond in hardness.",
    features: ["Zirconia 92 ceramic blades", "10x longer edge retention than steel", "Rust-proof and stain-proof", "Ergonomic curved handles", "Blade guard covers included", "Lifetime edge guarantee"],
    stock: stk(8, 25), sku: sku("KIT", 1), tags: ["knives", "ceramic", "japanese", "cutlery", "professional", "gift-ideas"],
    barcode: "8712345678911", asin: "B0EXAMPLE011", costPrice: 55, featured: true, bestSeller: true, status: "published" as const,
    reviews: [
      makeReview("Daniel W.", 5, "Game-changing sharpness", "I've been using these for three months and they're still as sharp as day one.", 45, true, 32),
      makeReview("Anya P.", 5, "Worth the investment", "Upgraded from a steel knife block and the difference is incredible.", 60, true, 18),
    ],
    specs: [spec("Blade Material", "Zirconia 92 Ceramic"), spec("Included", "Chef's (18cm), Utility (14cm), Paring (8cm)"), spec("Handle", "Ergonomically curved synthetic"), spec("Edge Retention", "10x longer than stainless steel"), spec("Weight", "142g (chef's), 98g (utility), 52g (paring)"), spec("Origin", "Crafted in Japan")],
    createdAt: daysAgo(150),
  },
  {
    id: pid(), slug: "bamboo-cutting-board-set", name: "Organic Bamboo Cutting Board Set — 3-Piece",
    brand: "Terra & Stone", brandId: "terra-stone", category: "kitchen", type: "physical" as const,
    price: 52, salePrice: 42, rating: rnd(3.8, 4.4), reviewCount: rcnt(25, 70),
    images: [productImage(img(262917))],
    shortDescription: "Sustainable bamboo cutting boards in three sizes with deep juice grooves.",
    description: "Crafted from organically grown Moso bamboo — one of the fastest-renewing resources on earth — this 3-piece cutting board set is as eco-friendly as it is functional.",
    features: ["Organic Moso bamboo", "Naturally antimicrobial", "Deep juice groove", "3 essential sizes", "Hanging loop for storage", "Gentle on knife edges"],
    stock: stk(20, 50), sku: sku("KIT", 2), tags: ["cutting-boards", "bamboo", "sustainable", "kitchen-essentials"],
    costPrice: 16, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Tom G.", 4, "Solid boards", "These are great for everyday use. The large board handles full meals.", 30, true, 7)],
    specs: [spec("Material", "Organic Moso Bamboo"), spec("Sizes", "Large: 45x30cm, Medium: 35x25cm, Small: 25x18cm"), spec("Thickness", "1.8cm"), spec("Features", "Juice groove on one side, flat on reverse"), spec("Care", "Hand wash, oil monthly"), spec("Antimicrobial", "Naturally antimicrobial bamboo")],
    createdAt: daysAgo(90),
  },
  {
    id: pid(), slug: "french-press-coffee-maker", name: "Double-Wall French Press — 1L",
    brand: "Lumina Home", brandId: "lumina-home", category: "kitchen", type: "physical" as const,
    price: 65, salePrice: null, rating: rnd(4.1, 4.7), reviewCount: rcnt(35, 90),
    images: [productImage(img(262917)), productImage(img(1571460))],
    shortDescription: "Borosilicate glass French press with double-wall insulation in brushed stainless frame.",
    description: "The Double-Wall French Press combines timeless design with modern engineering. The borosilicate glass carafe keeps coffee hot for up to 2 hours.",
    features: ["Double-wall borosilicate glass", "Keeps coffee hot for 2 hours", "4-stage stainless filter", "Brushed stainless steel frame", "1-liter capacity (8 cups)", "Dishwasher-safe glass carafe"],
    stock: stk(15, 40), sku: sku("KIT", 3), tags: ["coffee", "french-press", "kitchen", "scandinavian", "home-barista"],
    asin: "B0EXAMPLE013", costPrice: 22, status: "published" as const,
    reviews: [makeReview("Mia K.", 5, "Beautiful and functional", "Makes perfect coffee and keeps it hot for so long.", 20, true, 14)],
    specs: [spec("Capacity", "1 liter (approx. 8 cups)"), spec("Material", "Borosilicate glass, stainless steel"), spec("Insulation", "Double-wall (keeps hot 2 hours)"), spec("Filter", "4-stage stainless steel mesh"), spec("Dimensions", "24cm height, 12cm diameter"), spec("Care", "Glass is dishwasher-safe; frame hand wash")],
    createdAt: daysAgo(75),
  },
  {
    id: pid(), slug: "wine-decanter-carafe", name: "Crystal Wine Decanter — Handblown",
    brand: "Terra & Stone", brandId: "terra-stone", category: "kitchen", type: "physical" as const,
    price: 95, salePrice: 78, rating: rnd(4.0, 4.6), reviewCount: rcnt(12, 40),
    images: [productImage(img(262917))],
    shortDescription: "Handblown lead-free crystal decanter designed for optimal aeration.",
    description: "This handblown crystal decanter is crafted by master glassblowers using traditional techniques. The generous, wide base provides maximum surface area for aeration.",
    features: ["Handblown lead-free crystal", "Maximal aeration design", "Drip-free curved spout", "Generous 1.5L capacity", "Signature polished base", "Gift box packaging"],
    stock: stk(6, 20), sku: sku("KIT", 4), tags: ["wine", "decanter", "crystal", "handblown", "entertaining", "gift-ideas"],
    barcode: "8712345678914", costPrice: 30, featured: true, status: "published" as const,
    reviews: [makeReview("Oliver S.", 5, "Stunning piece", "The craftsmanship is remarkable. Light catches it beautifully on the dining table.", 18, true, 12)],
    specs: [spec("Material", "Lead-free Crystal"), spec("Capacity", "1.5 liters"), spec("Height", "28cm"), spec("Width", "18cm (widest point)"), spec("Origin", "Handblown in Portugal"), spec("Care", "Hand wash with mild soap, dry immediately")],
    createdAt: daysAgo(50),
  },
];

const _beautyProducts = [
  {
    id: pid(), slug: "vitamin-c-brightening-serum", name: "Vitamin C Brightening Serum — 15% Pure L-Ascorbic",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical" as const,
    price: 58, salePrice: 46, rating: rnd(4.3, 4.9), reviewCount: rcnt(80, 200),
    images: [productImage(img(3738343)), productImage(img(1122868))],
    shortDescription: "Stabilized 15% pure L-ascorbic acid serum with vitamin E and ferulic acid for brightening.",
    description: "Our Vitamin C Brightening Serum delivers a potent 15% concentration of pure L-ascorbic acid — the gold standard for vitamin C efficacy — stabilized with a patented delivery system.",
    features: ["15% pure L-ascorbic acid", "Stabilized against oxidation", "Vitamin E + Ferulic acid booster", "Reduces hyperpigmentation", "Boosts collagen synthesis", "Lightweight, fast-absorbing"],
    stock: stk(25, 60), sku: sku("BEA", 1), tags: ["vitamin-c", "serum", "brightening", "anti-aging", "antioxidant", "skincare"],
    barcode: "8712345678921", gtin: "08712345678921", asin: "B0EXAMPLE021", costPrice: 15, featured: true, bestSeller: true, status: "published" as const,
    reviews: [
      makeReview("Emma L.", 5, "Holy grail serum", "I've tried so many vitamin C serums and this is by far the best.", 30, true, 45),
      makeReview("Rachel H.", 4, "Great results, slight tingling", "Definitely notice a difference in brightness and texture.", 55, true, 28),
    ],
    specs: [spec("Key Ingredient", "15% L-Ascorbic Acid (Vitamin C)"), spec("Supporting Ingredients", "Vitamin E, Ferulic Acid"), spec("Volume", "30ml / 1 fl oz"), spec("Texture", "Lightweight water-like serum"), spec("pH", "3.2-3.5"), spec("Packaging", "Airless pump, amber glass")],
    createdAt: daysAgo(180),
  },
  {
    id: pid(), slug: "retinol-night-cream", name: "Retinol Night Cream — 0.5% Encapsulated Retinol",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical" as const,
    price: 72, salePrice: 60, rating: rnd(4.0, 4.7), reviewCount: rcnt(50, 120),
    images: [productImage(img(3738343))],
    shortDescription: "Time-release retinol night cream with peptides and ceramides for renewal while you sleep.",
    description: "Our Retinol Night Cream uses encapsulated retinol technology for controlled release throughout the night, maximizing efficacy while minimizing irritation.",
    features: ["0.5% encapsulated retinol", "Time-release delivery system", "Copper peptides for collagen", "Ceramide complex for barrier", "Non-comedogenic", "Fragrance-free"],
    stock: stk(18, 40), sku: sku("BEA", 2), tags: ["retinol", "night-cream", "anti-aging", "peptides", "skincare"],
    barcode: "8712345678922", gtin: "08712345678922", costPrice: 20, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Nina V.", 5, "Game changer for fine lines", "After 6 weeks of nightly use, my forehead lines are noticeably softer.", 40, true, 35)],
    specs: [spec("Active Ingredient", "0.5% Encapsulated Retinol"), spec("Key Additives", "Copper Peptides, Ceramide NP/AP/EOP"), spec("Volume", "50ml / 1.7 fl oz"), spec("Texture", "Rich cream, absorbs fully"), spec("Usage", "Apply PM only, follow with SPF AM"), spec("Skin Type", "All skin types, including sensitive")],
    createdAt: daysAgo(120),
  },
  {
    id: pid(), slug: "hyaluronic-acid-plumping-serum", name: "Hyaluronic Acid Plumping Serum — Triple Weight",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical" as const,
    price: 46, salePrice: null, rating: rnd(4.2, 4.8), reviewCount: rcnt(60, 150),
    images: [productImage(img(3738343))],
    shortDescription: "Triple-weight hyaluronic acid with multi-molecular hydration for deep, lasting plumping.",
    description: "Our Triple Weight Hyaluronic Acid Serum features three molecular weights of hyaluronic acid to hydrate at every layer of the skin.",
    features: ["Triple-molecular HA (low/med/high)", "Deep multi-layer hydration", "5% HA concentration", "Lightweight gel texture", "Vegan and cruelty-free", "No added fragrance"],
    stock: stk(30, 70), sku: sku("BEA", 3), tags: ["hyaluronic-acid", "serum", "hydration", "plumping", "skincare", "vegan"],
    barcode: "8712345678923", costPrice: 12, featured: true, status: "published" as const,
    reviews: [makeReview("Leila K.", 5, "Hydration like no other", "My dehydrated skin drinks this up. The plumping effect is immediate.", 25, true, 22)],
    specs: [spec("Active", "5% Hyaluronic Acid Complex"), spec("Molecular Weights", "Super-Low (3-5kDa), Medium (50-100kDa), High (1,000-1,500kDa)"), spec("Volume", "30ml / 1 fl oz"), spec("Texture", "Lightweight gel-serum"), spec("pH", "5.5-6.5"), spec("Certifications", "Vegan, Cruelty-Free, Fragrance-Free")],
    createdAt: daysAgo(90),
  },
  {
    id: pid(), slug: "cleansing-balm-makeup-remover", name: "Cleansing Balm — Universal Makeup Remover",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical" as const,
    price: 34, salePrice: null, rating: rnd(4.1, 4.6), reviewCount: rcnt(40, 90),
    images: [productImage(img(3738343))],
    shortDescription: "Oil-based cleansing balm that melts away makeup and sunscreen without stripping.",
    description: "This universal cleansing balm transforms from a silky balm to a milky oil on contact with skin, dissolving even waterproof makeup and SPF effortlessly.",
    features: ["Balm-to-oil-to-milk texture", "Dissolves waterproof makeup", "Moringa oil for vitamin-rich cleansing", "Chamomile to soothe", "Magnetic spatula included", "Does not strip skin barrier"],
    stock: stk(22, 50), sku: sku("BEA", 4), tags: ["cleanser", "cleansing-balm", "makeup-remover", "skincare", "vegan"],
    costPrice: 10, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Sophia A.", 5, "The best balm ever", "Takes off everything — including my stubborn waterproof mascara.", 35, true, 19)],
    specs: [spec("Key Ingredients", "Moringa Oil, Chamomile, Green Tea"), spec("Texture", "Solid balm → milky oil → emulsion"), spec("Volume", "100ml / 3.4 fl oz"), spec("Suited For", "All skin types, including sensitive"), spec("Removes", "Waterproof makeup, SPF, sebum"), spec("Finish", "Clean, hydrated, never stripped")],
    createdAt: daysAgo(60),
  },
  {
    id: pid(), slug: "professional-makeup-brush-set", name: "Professional Makeup Brush Set — 12-Piece",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "beauty", type: "physical" as const,
    price: 125, salePrice: 99, rating: rnd(4.0, 4.5), reviewCount: rcnt(20, 50),
    images: [productImage(img(3738343))],
    shortDescription: "Complete 12-piece brush set with ultra-soft synthetic bristles and weighted handles.",
    description: "This 12-piece brush collection features ultra-soft synthetic bristles that perform like natural hair without the ethical concerns.",
    features: ["12 essential brush shapes", "Ultra-soft synthetic Taklon bristles", "Weighted faceted handles", "Vegan leather travel roll", "No shedding or shedding", "Easy to clean, dries quickly"],
    stock: stk(10, 30), sku: sku("BEA", 5), tags: ["makeup-brushes", "brush-set", "professional", "vegan", "beauty-tools"],
    barcode: "8712345678925", costPrice: 32, featured: true, isNew: true, status: "published" as const,
    reviews: [makeReview("Isabella V.", 4, "Luxurious set", "The brushes feel amazing in hand — substantial but not heavy.", 14, true, 10)],
    specs: [spec("Bristle Material", "Synthetic Taklon (vegan)"), spec("Set Includes", "12 brushes + vegan leather roll"), spec("Handle", "Weighted, faceted, matte black"), spec("Brush Types", "Powder, blush, contour, eyeshadow (x3), blending, liner, brow, lip, concealer, fan"), spec("Care", "Wash weekly with mild soap, dry flat"), spec("Cruelty-Free", "Certified cruelty-free and vegan")],
    createdAt: daysAgo(25),
  },
];

const _electronicsProducts = [
  {
    id: pid(), slug: "wireless-noise-cancelling-earbuds", name: "Wireless Noise-Cancelling Earbuds — Pro",
    brand: "Clarity", brandId: "clarity", category: "electronics", type: "physical" as const,
    price: 199, salePrice: 169, rating: rnd(4.2, 4.8), reviewCount: rcnt(100, 250),
    images: [productImage(img(577769)), productImage(img(1122868))],
    shortDescription: "Premium ANC earbuds with adaptive transparency, 30h battery, and crystal-clear calls.",
    description: "Our Wireless Pro Earbuds deliver studio-quality sound with adaptive active noise cancellation that adjusts to your environment in real time.",
    features: ["Adaptive ANC with transparency mode", "11mm custom dynamic drivers", "6-mic array for calls", "8h buds / 30h with case", "Wireless Qi charging", "IPX5 water resistant"],
    stock: stk(20, 45), sku: sku("ELE", 1), tags: ["earbuds", "wireless", "noise-cancelling", "bluetooth", "audio", "clarity"],
    barcode: "8712345678931", gtin: "08712345678931", asin: "B0EXAMPLE031", costPrice: 55, featured: true, bestSeller: true, status: "published" as const,
    reviews: [
      makeReview("Alex T.", 5, "Best earbuds I've owned", "The sound quality is outstanding — clear, balanced, with punchy bass.", 20, true, 52),
      makeReview("Jordan P.", 4, "Great features, slight fit adjustment", "Sound and ANC are excellent. My only note is that the earbuds are a bit large.", 42, true, 16),
    ],
    specs: [spec("Driver", "11mm custom dynamic"), spec("ANC", "Adaptive, up to -40dB"), spec("Battery", "8 hrs (buds) / 30 hrs (with case)"), spec("Charging", "USB-C, Qi wireless"), spec("Connectivity", "Bluetooth 5.3, Multipoint"), spec("Water Resistance", "IPX5")],
    createdAt: daysAgo(90),
  },
  {
    id: pid(), slug: "portable-bluetooth-speaker", name: "Portable Bluetooth Speaker — Wander",
    brand: "Clarity", brandId: "clarity", category: "electronics", type: "physical" as const,
    price: 129, salePrice: 109, rating: rnd(4.0, 4.6), reviewCount: rcnt(30, 80),
    images: [productImage(img(577769))],
    shortDescription: "Rugged, waterproof portable speaker with 360° sound and 20-hour battery life.",
    description: "The Wander speaker delivers big, room-filling 360° sound in a compact, go-anywhere design. IP67 rated against dust and water.",
    features: ["360° immersive sound", "IP67 dust and waterproof", "20-hour battery life", "Built-in carabiner loop", "True Wireless Stereo pairing", "Built-in microphone for calls"],
    stock: stk(15, 35), sku: sku("ELE", 2), tags: ["speaker", "bluetooth", "portable", "waterproof", "outdoor", "clarity"],
    barcode: "8712345678932", costPrice: 38, isNew: true, status: "published" as const,
    reviews: [makeReview("Sam R.", 5, "Tough and sounds incredible", "I've brought this on camping trips, to the beach, and even dropped it in a pool.", 10, true, 14)],
    specs: [spec("Sound", "360°, 20W output"), spec("Waterproof", "IP67 (1m depth, 30 min)"), spec("Battery", "20 hours playtime"), spec("Charging", "USB-C, 3 hours full charge"), spec("Connectivity", "Bluetooth 5.2, range 30m"), spec("Dimensions", "18cm x 7cm diameter")],
    createdAt: daysAgo(35),
  },
  {
    id: pid(), slug: "smart-alarm-clock", name: "Smart Alarm Clock — Dawn Simulator",
    brand: "Clarity", brandId: "clarity", category: "electronics", type: "physical" as const,
    price: 79, salePrice: null, rating: rnd(4.1, 4.5), reviewCount: rcnt(25, 60),
    images: [productImage(img(577769))],
    shortDescription: "Wake naturally with a simulated sunrise, wind-down sunset, and sleep sounds.",
    description: "The Dawn Simulator Smart Alarm Clock transforms your mornings with a gradual 30-minute sunrise simulation.",
    features: ["30-minute sunrise simulation", "Sunset wind-down mode", "Built-in sleep sounds", "Adjustable brightness & color", "Dual USB charging ports", "AM/FM radio backup"],
    stock: stk(12, 28), sku: sku("ELE", 3), tags: ["alarm-clock", "dawn-simulator", "sleep", "wellness", "clarity"],
    costPrice: 25, featured: true, status: "published" as const,
    reviews: [makeReview("Hannah W.", 5, "Gentlest wake-up ever", "I didn't realize how jarring my phone alarm was until I started using this.", 28, true, 20)],
    specs: [spec("Light", "LED, 2700K-6500K adjustable"), spec("Sunrise", "30-minute gradual simulation"), spec("Sounds", "5 nature sounds, FM radio"), spec("Display", "Auto-dimming LED clock"), spec("Ports", "2x USB-A (2.4A each)"), spec("Dimensions", "18cm x 8cm x 12cm")],
    createdAt: daysAgo(60),
  },
  {
    id: pid(), slug: "premium-laptop-sleeve", name: "Premium Laptop Sleeve — Merino Wool",
    brand: "Wanderlust", brandId: "wanderlust", category: "electronics", type: "physical" as const,
    price: 55, salePrice: null, rating: rnd(4.0, 4.4), reviewCount: rcnt(15, 35),
    images: [productImage(img(577769))],
    shortDescription: "Eco-friendly merino wool felt laptop sleeve with padded interior. Fits 13-14\" laptops.",
    description: "Crafted from compressed merino wool felt, this laptop sleeve provides natural impact and scratch protection without synthetic padding.",
    features: ["Compressed merino wool felt", "Natural impact protection", "Microfiber scratch-proof interior", "Fits 13-14\" laptops", "Slim, bag-friendly design", "Made from recycled wool fibers"],
    stock: stk(18, 40), sku: sku("ELE", 4), tags: ["laptop-sleeve", "merino-wool", "eco-friendly", "tech-accessories"],
    barcode: "8712345678934", costPrice: 16, isNew: true, status: "published" as const,
    reviews: [makeReview("David C.", 4, "Great quality, snug fit", "Lovely minimal design and the wool feels substantial.", 8, true, 5)],
    specs: [spec("Material", "Compressed Merino Wool Felt"), spec("Interior", "Soft microfiber"), spec("Dimensions", "34cm x 25cm x 1.5cm"), spec("Fits", "13-14\" laptops (up to 32cm x 22cm)"), spec("Weight", "180g"), spec("Eco", "Made from 80% recycled wool fibers")],
    createdAt: daysAgo(20),
  },
];

const _travelProducts = [
  {
    id: pid(), slug: "carry-on-luggage-cabin", name: "Carry-On Luggage — Cabin Pro",
    brand: "Voya", brandId: "voya", category: "travel", type: "physical" as const,
    price: 245, salePrice: 199, rating: rnd(4.3, 4.8), reviewCount: rcnt(50, 120),
    images: [productImage(img(1008155)), productImage(img(2762942))],
    shortDescription: "Polycarbonate carry-on with YKK zippers, 360° spinner wheels, and TSA-approved lock.",
    description: "The Cabin Pro carry-on is built for the modern traveler who values durability without sacrificing style.",
    features: ["100% polycarbonate shell", "YKK RC zippers throughout", "360° dual spinner wheels", "TSA-approved combination lock", "Compression strap system", "Weight: only 2.8kg (6.2lbs)"],
    stock: stk(10, 25), sku: sku("TRV", 1), tags: ["luggage", "carry-on", "travel", "polycarbonate", "cabin"],
    barcode: "8712345678941", asin: "B0EXAMPLE041", costPrice: 68, featured: true, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Marcus W.", 5, "Perfect carry-on companion", "Fits every airline sizer I've tried it on. Rolls incredibly smoothly even on carpet.", 60, true, 38)],
    specs: [spec("Material", "100% Polycarbonate"), spec("Weight", "2.8kg (6.2lbs)"), spec("Capacity", "38 liters"), spec("Dimensions", "55cm x 35cm x 22cm"), spec("Wheels", "4x dual spinner (360°)"), spec("Warranty", "5-year limited warranty")],
    createdAt: daysAgo(120),
  },
  {
    id: pid(), slug: "travel-organizer-cube-set", name: "Travel Organizer Cube Set — 5-Piece",
    brand: "Voya", brandId: "voya", category: "travel", type: "physical" as const,
    price: 42, salePrice: 34, rating: rnd(4.2, 4.7), reviewCount: rcnt(35, 80),
    images: [productImage(img(1008155))],
    shortDescription: "Ultralight ripstop nylon packing cubes in 5 sizes with compression zippers.",
    description: "Maximize your luggage space with this 5-piece packing cube set made from ultralight, water-repellent ripstop nylon.",
    features: ["Ultralight ripstop nylon", "Water-repellent coating", "Compression zipper (saves 30% space)", "Mesh top for visibility", "5 sizes: 2 small, 2 medium, 1 large", "Reinforced stitching throughout"],
    stock: stk(30, 70), sku: sku("TRV", 2), tags: ["packing-cubes", "travel-organization", "luggage-accessories", "voya"],
    costPrice: 10, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Emily K.", 5, "Total game changer", "These cubes have changed my travel life. Everything stays organized.", 15, true, 24)],
    specs: [spec("Material", "Ripstop Nylon with water-repellent coating"), spec("Set Includes", "2 small (25x17cm), 2 medium (35x25cm), 1 large (45x30cm)"), spec("Compression", "Zip-compresses up to 30%"), spec("Weight", "Total: 180g"), spec("Closure", "YKK zippers"), spec("Care", "Spot clean, air dry")],
    createdAt: daysAgo(60),
  },
  {
    id: pid(), slug: "vegan-leather-passport-holder", name: "Vegan Leather Passport Holder & Travel Wallet",
    brand: "Ever & Oak", brandId: "ever-oak", category: "travel", type: "physical" as const,
    price: 48, salePrice: null, rating: rnd(4.0, 4.5), reviewCount: rcnt(18, 45),
    images: [productImage(img(1008155))],
    shortDescription: "Slim RFID-blocking passport holder with card slots, boarding pass pocket, and SIM slot.",
    description: "This slim travel wallet is designed to carry your passport, cards, boarding pass, and SIM card in one sleek package.",
    features: ["Premium vegan leather", "RFID-blocking lining", "4 card slots", "Full-length bill pocket", "Boarding pass pocket", "SIM card slot"],
    stock: stk(25, 55), sku: sku("TRV", 3), tags: ["passport-holder", "travel-wallet", "rfid", "vegan-leather", "ever-oak"],
    barcode: "8712345678943", costPrice: 14, featured: true, status: "published" as const,
    reviews: [makeReview("Aisha N.", 5, "Sleek and functional", "This holds everything I need for travel — passport, 4 cards, some cash.", 22, true, 8)],
    specs: [spec("Material", "Premium Vegan Leather (PU)"), spec("RFID Protection", "Blocks 13.56MHz frequencies"), spec("Capacity", "1 passport, 4 cards, bills, boarding pass"), spec("Dimensions", "14cm x 10cm x 1cm (closed)"), spec("Weight", "85g"), spec("Colors", "Black, Cognac, Olive")],
    createdAt: daysAgo(45),
  },
  {
    id: pid(), slug: "travel-hammock-silk", name: "Travel Hammock — Silk Parachute",
    brand: "Wanderlust", brandId: "wanderlust", category: "travel", type: "physical" as const,
    price: 65, salePrice: 52, rating: rnd(4.1, 4.6), reviewCount: rcnt(22, 55),
    images: [productImage(img(2762942)), productImage(img(1008155))],
    shortDescription: "Ultralight ripstop silk hammock that packs to the size of a tennis ball. Includes tree straps.",
    description: "The Silk Parachute Hammock is made from ultra-strong, featherlight 20D ripstop silk — strong enough to hold 300kg yet compact enough to fit in your pocket.",
    features: ["20D ripstop silk construction", "Packs to tennis-ball size", "300kg weight capacity", "Tree-friendly polyester straps", "Quick 2-minute setup", "Breathable, quick-drying fabric"],
    stock: stk(14, 30), sku: sku("TRV", 4), tags: ["hammock", "outdoor", "camping", "travel", "lightweight", "wanderlust"],
    costPrice: 18, isNew: true, status: "published" as const,
    reviews: [makeReview("Zach B.", 5, "Incredibly packable", "I take this everywhere — beach, camping, even just to the park.", 12, true, 16)],
    specs: [spec("Material", "20D Ripstop Silk"), spec("Dimensions", "280cm x 140cm (open)"), spec("Packed Size", "12cm x 8cm (tennis ball size)"), spec("Weight", "280g (with straps)"), spec("Capacity", "Up to 300kg (660lbs)"), spec("Straps", "2x 3m polyester tree straps")],
    createdAt: daysAgo(30),
  },
];

const _healthProducts = [
  {
    id: pid(), slug: "premium-yoga-mat", name: "Premium Yoga Mat — 6mm Cork",
    brand: "Wanderlust", brandId: "wanderlust", category: "health", type: "physical" as const,
    price: 88, salePrice: 72, rating: rnd(4.2, 4.7), reviewCount: rcnt(45, 100),
    images: [productImage(img(2294361)), productImage(img(2762942))],
    shortDescription: "Natural cork yoga mat with superior grip, antimicrobial surface, and alignment guides.",
    description: "Our 6mm cork yoga mat offers the perfect balance of cushioning and stability. The natural cork surface provides unmatched grip — the more you sweat, the grippier it gets.",
    features: ["Natural cork surface, rubber base", "Grip improves with moisture", "Naturally antimicrobial", "6mm thickness for comfort", "Subtle alignment markings", "Eco-friendly, biodegradable materials"],
    stock: stk(12, 30), sku: sku("HEA", 1), tags: ["yoga-mat", "cork", "eco-friendly", "fitness", "wellness"],
    barcode: "8712345678951", costPrice: 28, featured: true, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Lily M.", 5, "Best mat I've ever owned", "The cork grip is incredible — even in hot yoga class, my hands and feet stay planted.", 40, true, 32)],
    specs: [spec("Material", "Natural Cork top, Natural Tree Rubber base"), spec("Thickness", "6mm"), spec("Dimensions", "183cm x 61cm"), spec("Weight", "2.5kg"), spec("Features", "Alignment markings, antimicrobial"), spec("Care", "Wipe with damp cloth; avoid direct sunlight")],
    createdAt: daysAgo(100),
  },
  {
    id: pid(), slug: "resistance-bands-set", name: "Resistance Bands Set — 5 Levels",
    brand: "Wanderlust", brandId: "wanderlust", category: "health", type: "physical" as const,
    price: 32, salePrice: null, rating: rnd(4.0, 4.4), reviewCount: rcnt(30, 65),
    images: [productImage(img(2294361))],
    shortDescription: "Set of 5 fabric resistance bands from extra-light to extra-heavy with carrying pouch.",
    description: "This 5-band set covers every resistance level from extra-light (5lbs) to extra-heavy (50lbs). Unlike rubber bands, our fabric bands are woven from natural latex wrapped in soft, non-slip fabric.",
    features: ["5 resistance levels: 5-50lbs", "Non-slip fabric exterior", "No rolling or snapping", "Natural latex core", "Cotton carrying pouch", "Beginner to advanced levels"],
    stock: stk(20, 50), sku: sku("HEA", 2), tags: ["resistance-bands", "fitness", "home-gym", "workout", "wanderlust"],
    costPrice: 8, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Ryan D.", 4, "Great quality bands", "Much better than the rubber bands I used before — these actually stay in place.", 18, true, 12)],
    specs: [spec("Set Includes", "5 bands + pouch + exercise guide"), spec("Resistance", "Extra Light (5lbs), Light (15lbs), Medium (25lbs), Heavy (35lbs), Extra Heavy (50lbs)"), spec("Material", "Natural latex core, woven fabric exterior"), spec("Dimensions", "30cm x 15cm (each band)"), spec("Care", "Wipe clean, store away from direct sunlight"), spec("Pouch", "100% cotton drawstring")],
    createdAt: daysAgo(50),
  },
  {
    id: pid(), slug: "essential-oil-diffuser", name: "Ultrasonic Essential Oil Diffuser — 300ml",
    brand: "Clarity", brandId: "clarity", category: "health", type: "physical" as const,
    price: 44, salePrice: 36, rating: rnd(4.1, 4.5), reviewCount: rcnt(40, 90),
    images: [productImage(img(2294361))],
    shortDescription: "Borosilicate glass ultrasonic diffuser with LED mood lighting and auto shut-off.",
    description: "This ultrasonic essential oil diffuser disperses a fine, cool mist of water and essential oils into the air, creating a calming atmosphere.",
    features: ["Ultrasonic cool-mist technology", "300ml borosilicate glass tank", "7-color LED mood light", "4 timer settings (1/3/6/continuous)", "Whisper-quiet (under 30dB)", "Auto shut-off when empty"],
    stock: stk(18, 40), sku: sku("HEA", 3), tags: ["diffuser", "essential-oils", "aromatherapy", "wellness", "clarity"],
    barcode: "8712345678953", costPrice: 12, featured: true, status: "published" as const,
    reviews: [makeReview("Natalie F.", 5, "Beautiful and calming", "The glass tank looks so much nicer than plastic diffusers. Quiet enough for my nightstand.", 25, true, 18)],
    specs: [spec("Type", "Ultrasonic cool-mist"), spec("Tank Capacity", "300ml borosilicate glass"), spec("Coverage", "Up to 30m² (320 sq ft)"), spec("Run Time", "Up to 10 hours (intermittent)"), spec("Lighting", "7-color LED, adjustable brightness"), spec("Safety", "Auto shut-off when water runs out")],
    createdAt: daysAgo(70),
  },
  {
    id: pid(), slug: "insulated-water-bottle", name: "Insulated Water Bottle — 750ml",
    brand: "Wanderlust", brandId: "wanderlust", category: "health", type: "physical" as const,
    price: 38, salePrice: null, rating: rnd(4.1, 4.6), reviewCount: rcnt(50, 110),
    images: [productImage(img(2294361))],
    shortDescription: "Double-wall vacuum insulated bottle keeps drinks cold 24h / hot 12h. BPA-free.",
    description: "Built from 18/8 stainless steel with double-wall vacuum insulation, this water bottle keeps your beverages ice-cold for 24 hours or hot for 12 hours.",
    features: ["18/8 stainless steel, BPA-free", "Double-wall vacuum insulation", "Cold 24h / Hot 12h", "Leak-proof bamboo cap/cup", "Wide mouth for ice & cleaning", "Powder-coated, scratch-resistant"],
    stock: stk(25, 60), sku: sku("HEA", 4), tags: ["water-bottle", "insulated", "stainless-steel", "eco-friendly", "wanderlust"],
    barcode: "8712345678954", costPrice: 10, featured: true, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Chris B.", 5, "Does exactly what it should", "Ice water was still cold after 20 hours in summer heat.", 20, true, 27)],
    specs: [spec("Material", "18/8 Stainless Steel (interior/exterior)"), spec("Capacity", "750ml (25 oz)"), spec("Insulation", "Double-wall vacuum (Cold 24h / Hot 12h)"), spec("Lid", "Bamboo cap with cup function"), spec("Weight", "340g"), spec("Dishwasher Safe", "Yes (top rack recommended)")],
    createdAt: daysAgo(80),
  },
];

const _lifestyleProducts = [
  {
    id: pid(), slug: "coffee-table-book-architecture", name: "Coffee Table Book — Spaces of Serenity",
    brand: "Ever & Oak", brandId: "ever-oak", category: "lifestyle", type: "physical" as const,
    price: 55, salePrice: 44, rating: rnd(4.3, 4.8), reviewCount: rcnt(20, 50),
    images: [productImage(img(1122868)), productImage(img(1571460))],
    shortDescription: "A curated visual journey through 50 of the world's most serene architectural spaces.",
    description: "Spaces of Serenity is a stunning hardcover volume featuring 50 architectural spaces designed for peace and contemplation.",
    features: ["50 architectural spaces featured", "240 pages, hardcover", "Exceptional photography", "Thoughtful essays on design & wellness", "Premium matte paper stock", "Ribbon bookmark included"],
    stock: stk(15, 35), sku: sku("LIF", 1), tags: ["coffee-table-book", "architecture", "design", "interior", "gift-ideas"],
    barcode: "8712345678961", costPrice: 18, featured: true, status: "published" as const,
    reviews: [makeReview("Olivia T.", 5, "Absolutely stunning", "This book is as beautiful as the spaces it features.", 30, true, 14)],
    specs: [spec("Format", "Hardcover, 240 pages"), spec("Dimensions", "26cm x 30cm x 2.5cm"), spec("Paper", "150gsm matte art paper"), spec("Weight", "1.8kg"), spec("Features", "Ribbon bookmark, cloth-bound spine"), spec("ISBN", "978-0-123456-78-9")],
    createdAt: daysAgo(120),
  },
  {
    id: pid(), slug: "leather-bound-journal-set", name: "Leather-Bound Journal Set — 3-Piece",
    brand: "Ever & Oak", brandId: "ever-oak", category: "lifestyle", type: "physical" as const,
    price: 42, salePrice: 34, rating: rnd(4.0, 4.5), reviewCount: rcnt(25, 55),
    images: [productImage(img(1122868))],
    shortDescription: "Three vegan leather journals in A5, pocket, and mini sizes with 192 pages each.",
    description: "This journal set is designed for every aspect of your life — the A5 for daily journaling, the pocket size for on-the-go notes.",
    features: ["3 sizes: A5, Pocket, Mini", "192 pages each, 100gsm paper", "Fountain pen friendly", "Vegan leather covers", "Elastic closures & ribbon bookmarks", "Expandable inner back pocket"],
    stock: stk(20, 45), sku: sku("LIF", 2), tags: ["journal", "notebook", "vegan-leather", "stationery", "ever-oak"],
    costPrice: 10, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Emma S.", 5, "Beautiful quality", "The paper is thick enough for my fountain pens with no bleed-through.", 15, true, 11)],
    specs: [spec("Set Includes", "3 journals: A5 (148x210mm), Pocket (95x140mm), Mini (70x100mm)"), spec("Pages", "192 pages each, 100gsm cream paper"), spec("Binding", "Smyth-sewn, lays flat"), spec("Cover", "Premium vegan leather (PU)"), spec("Features", "Elastic closure, ribbon bookmark, expandable pocket"), spec("Paper Type", "Suitable for fountain pens, pencils, ballpoint")],
    createdAt: daysAgo(60),
  },
  {
    id: pid(), slug: "minimalist-desk-organizer", name: "Minimalist Desk Organizer — Walnut & Aluminum",
    brand: "Ever & Oak", brandId: "ever-oak", category: "lifestyle", type: "physical" as const,
    price: 68, salePrice: null, rating: rnd(4.0, 4.4), reviewCount: rcnt(10, 30),
    images: [productImage(img(1122868))],
    shortDescription: "Modular desk organizer crafted from walnut wood and brushed aluminum with 6 compartments.",
    description: "Bring refined organization to your workspace with our modular desk organizer. The base is crafted from solid walnut wood.",
    features: ["Solid walnut base", "Brushed aluminum dividers", "6 modular compartments", "Felt-lined bottom", "Natural oil finish", "Heavy felt grip feet"],
    stock: stk(8, 22), sku: sku("LIF", 3), tags: ["desk-organizer", "walnut", "minimalist", "office", "ever-oak"],
    costPrice: 22, isNew: true, status: "published" as const,
    reviews: [makeReview("Thomas K.", 4, "Solid and beautiful", "The walnut is gorgeous and the aluminum dividers contrast perfectly.", 10, true, 5)],
    specs: [spec("Materials", "Solid Walnut, Brushed Aluminum"), spec("Dimensions", "28cm x 18cm x 8cm"), spec("Compartments", "6 (pens, phone, clips, notes, cards, miscellaneous)"), spec("Weight", "680g"), spec("Base", "Felt-lined bottom with grip feet"), spec("Finish", "Natural danish oil (walnut)")],
    createdAt: daysAgo(25),
  },
  {
    id: pid(), slug: "scented-candle-gift-set", name: "Scented Candle Gift Set — Miniatures (Set of 6)",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "lifestyle", type: "physical" as const,
    price: 38, salePrice: 30, rating: rnd(4.2, 4.7), reviewCount: rcnt(28, 65),
    images: [productImage(img(1122868)), productImage(img(965998))],
    shortDescription: "Six miniature soy wax candles in curated fragrance collection. Perfect for gifting.",
    description: "Discover your signature scent with this collection of six miniature candles, each representing a different fragrance family.",
    features: ["6 miniature candles, 12h burn each", "Curated fragrance journey", "100% natural soy wax", "Cotton wicks, phthalate-free", "Gift box packaging with scent guide", "Travel-friendly size (2.5 oz each)"],
    stock: stk(22, 50), sku: sku("LIF", 4), tags: ["candles", "gift-set", "miniature", "soy-wax", "fragrance", "attic", "gift-ideas"],
    barcode: "8712345678964", costPrice: 10, featured: true, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Charlotte W.", 5, "Perfect gift set", "Bought this as a gift for my sister-in-law but ended up keeping one for myself!", 8, true, 19)],
    specs: [spec("Set Includes", "6 candles, 2.5 oz (71g) each"), spec("Fragrances", "Amber & Sandalwood, Wild Fig & Cassis, Linen & Cotton, Ebony & Spice, Bergamot & Basil, Vanilla & Tonka"), spec("Wax", "100% Natural Soy Wax"), spec("Wick", "Cotton-core, lead-free"), spec("Burn Time", "12+ hours each"), spec("Packaging", "Gift box with fragrance guide booklet")],
    createdAt: daysAgo(40),
  },
];

const _fragranceProducts = [
  {
    id: pid(), slug: "eau-de-parfum-amber-sandalwood", name: "Eau de Parfum — Amber & Sandalwood",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical" as const,
    price: 128, salePrice: 108, rating: rnd(4.3, 4.9), reviewCount: rcnt(40, 90),
    images: [productImage(img(965998)), productImage(img(1122868))],
    shortDescription: "A warm, seductive EDP with notes of amber, sandalwood, vanilla, and saffron.",
    description: "Our signature Amber & Sandalwood Eau de Parfum is a warm, enveloping fragrance that lingers beautifully throughout the day.",
    features: ["Eau de Parfum concentration (18%)", "Longevity: 8-10 hours", "Composed in Grasse, France", "Responsibly sourced ingredients", "Iconic ribbed glass bottle", "Magnetic cap with leather accent"],
    stock: stk(10, 25), sku: sku("FRG", 1), tags: ["fragrance", "eau-de-parfum", "amber", "sandalwood", "unisex", "luxury"],
    barcode: "8712345678971", asin: "B0EXAMPLE071", costPrice: 32, featured: true, bestSeller: true, status: "published" as const,
    reviews: [
      makeReview("Victoria L.", 5, "Mesmerizing scent", "I receive compliments every single time I wear this. Warm and sophisticated without being overpowering.", 45, true, 42),
      makeReview("Marcus J.", 5, "Perfect signature scent", "After searching for years for a signature scent, I've found it.", 60, true, 28),
    ],
    specs: [spec("Fragrance Family", "Warm Woody / Oriental"), spec("Concentration", "Eau de Parfum (18%)"), spec("Top Notes", "Saffron, Pink Pepper, Bergamot"), spec("Heart Notes", "Bulgarian Rose, Orris Butter, Jasmine"), spec("Base Notes", "Amber, Mysore Sandalwood, Madagascar Vanilla"), spec("Size", "50ml / 1.7 fl oz")],
    createdAt: daysAgo(200),
  },
  {
    id: pid(), slug: "room-spray-linen-cotton", name: "Room Spray — Linen & Cotton",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical" as const,
    price: 34, salePrice: null, rating: rnd(4.0, 4.5), reviewCount: rcnt(15, 40),
    images: [productImage(img(965998))],
    shortDescription: "Fresh, clean room spray with notes of linen, cotton blossom, and white musk.",
    description: "Our Linen & Cotton Room Spray captures the feeling of sun-dried laundry on a summer breeze.",
    features: ["Fine mist atomizer", "Fresh clean fragrance", "Linen, cotton blossom, white musk", "Safe for fabrics and linens", "200ml / 6.8 fl oz", "Lasts 3-4 hours per application"],
    stock: stk(20, 45), sku: sku("FRG", 2), tags: ["room-spray", "home-fragrance", "linen", "attic", "fresh"],
    costPrice: 8, isNew: true, status: "published" as const,
    reviews: [makeReview("Alice B.", 4, "Beautifully fresh", "Spray this on my bedding every morning and it instantly makes the bedroom feel like a luxury hotel.", 14, true, 8)],
    specs: [spec("Fragrance Profile", "Clean / Fresh / Light"), spec("Key Notes", "Linen, Cotton Blossom, White Musk, Aldehydes"), spec("Size", "200ml / 6.8 fl oz"), spec("Usage", "Spray 2-3 times into the air or onto fabrics"), spec("Longevity", "3-4 hours"), spec("Alcohol-Free", "Yes, water-based formula")],
    createdAt: daysAgo(30),
  },
  {
    id: pid(), slug: "solid-perfume-compact", name: "Solid Perfume Compact — Travel Size",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical" as const,
    price: 28, salePrice: null, rating: rnd(4.1, 4.6), reviewCount: rcnt(22, 50),
    images: [productImage(img(965998))],
    shortDescription: "Concentrated solid perfume in a vintage-style compact. TSA-friendly and spill-proof.",
    description: "Our Solid Perfume Compact offers the same exquisite fragrances in a concentrated, portable format.",
    features: ["Concentrated solid perfume", "Beeswax + jojoba oil base", "Vintage-style mirrored compact", "TSA-friendly, spill-proof", "6+ months of daily use", "Available in 2 signature scents"],
    stock: stk(25, 55), sku: sku("FRG", 3), tags: ["solid-perfume", "travel-size", "fragrance", "attic", "tsa-friendly"],
    barcode: "8712345678973", costPrice: 7, featured: true, status: "published" as const,
    reviews: [makeReview("Nina T.", 5, "Perfect for travel", "I keep this in my handbag for touch-ups throughout the day.", 20, true, 14)],
    specs: [spec("Format", "Solid perfume in compact"), spec("Base", "Beeswax, Jojoba Oil, Coconut Oil"), spec("Fragrance Options", "Amber & Sandalwood, Wild Fig & Cassis"), spec("Size", "Compact: 5cm diameter, 12g net weight"), spec("Longevity", "4-6 hours on skin"), spec("TSA", "TSA-friendly under 3.4oz limit")],
    createdAt: daysAgo(45),
  },
  {
    id: pid(), slug: "fragrance-discovery-set", name: "Fragrance Discovery Set — 5 Iconic EDP Samples",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical" as const,
    price: 25, salePrice: null, rating: rnd(4.2, 4.7), reviewCount: rcnt(35, 70),
    images: [productImage(img(965998))],
    shortDescription: "Five 2ml EDP samples to discover your signature Atelier & Co. scent.",
    description: "Can't decide on a full bottle? Our Discovery Set lets you experience five of our most beloved fragrances.",
    features: ["5 x 2ml EDP samples (10-15 wears each)", "Full discovery experience", "Redemption toward full bottle", "Premium box with fragrance notes", "Fragrance guide booklet", "Perfect introduction to the brand"],
    stock: stk(30, 70), sku: sku("FRG", 4), tags: ["fragrance", "discovery-set", "samples", "gift-ideas", "attic"],
    costPrice: 5, bestSeller: true, status: "published" as const,
    reviews: [makeReview("Julia R.", 5, "Best way to explore", "I bought this to try before committing to a full bottle and I'm so glad I did.", 35, true, 22)],
    specs: [spec("Set Includes", "5 x 2ml EDP spray samples"), spec("Fragrances", "Amber & Sandalwood, Wild Fig & Cassis, Ebony & Spice, Bergamot & Basil, Vanilla & Tonka"), spec("Format", "Mini spray vials with atomizer"), spec("Usage", "Approx. 10-15 wears per sample"), spec("Redeemable", "Full purchase price credited toward 50ml EDP"), spec("Packaging", "Premium gift box with guide booklet")],
    createdAt: daysAgo(30),
  },
];

export const SEED_PRODUCTS = [
  ..._homeProducts,
  ..._kitchenProducts,
  ..._beautyProducts,
  ..._electronicsProducts,
  ..._travelProducts,
  ..._healthProducts,
  ..._lifestyleProducts,
  ..._fragranceProducts,
];

/* ================================================================== */
/*  CUSTOMERS                                                          */
/* ================================================================== */

function addr(label: string, line1: string, city: string, country: string, zip: string, phone?: string) {
  return { id: uid("addr"), label, name: "", line1, city, country, zip, phone };
}

function tle(type: "account_created" | "login" | "viewed_product" | "wishlist_add" | "compare_add" | "cart_add" | "checkout_start" | "purchase" | "refund" | "review" | "coupon_used" | "newsletter_signup" | "support_ticket" | "email_open", label: string, ts: number, meta?: string) {
  return { id: uid("tl"), type, label, ts, meta };
}

function ctask(title: string, type: "follow_up" | "marketing" | "support" | "sales" | "reminder", assignee: string, priority: "low" | "medium" | "high", dueDate: number, done: boolean, ts: number) {
  return { id: uid("task"), title, type, assignee, dueDate, priority, done, ts };
}

function prefs(brands: string[], categories: string[], theme: "light" | "dark", marketing: boolean) {
  return { favoriteBrands: brands, favoriteCategories: categories, preferredTheme: theme, marketingOptIn: marketing };
}

export const SEED_CUSTOMERS = [
  {
    id: "cust_guest", name: "Guest Visitor", email: "guest@alayainsider.com", password: "",
    country: "United States", createdAt: daysAgo(60), status: "active" as const, addresses: [],
    newsletter: false, timeline: [tle("account_created", "Account created", daysAgo(60))], notes: [], tasks: [],
    loyaltyPoints: 0, storeCredit: 0,
  },
  {
    id: "cust_isabella", name: "Isabella Moreau", email: "isabella@example.com", password: "password123",
    phone: "+1 (555) 123-4567", country: "United States", createdAt: daysAgo(120), lastLogin: daysAgo(2), status: "active" as const,
    addresses: [addr("Home", "245 Park Avenue, Apt 4B", "New York", "United States", "10022", "+1 (555) 123-4567"), addr("Office", "60 Columbus Circle", "New York", "United States", "10023")],
    newsletter: true,
    timeline: [tle("account_created", "Account created", daysAgo(120)), tle("login", "Logged in", daysAgo(2)), tle("purchase", "Order placed — $246.80", daysAgo(15), "246.80"), tle("wishlist_add", "Added Artisan Candle Trio to wishlist", daysAgo(5)), tle("review", "Left a 5-star review", daysAgo(20))],
    notes: [{ id: uid("note"), author: "Admin", body: "VIP customer — frequently purchases beauty products.", pinned: true, private: false, ts: daysAgo(30) }],
    tasks: [ctask("Follow up on recent order", "support", "Admin", "medium", daysAgo(-3), false, daysAgo(7))],
    preferences: prefs(["nourish-bloom", "atelier-co"], ["beauty", "fragrance"], "light", true),
    loyaltyPoints: 1840, storeCredit: 50, referralCode: "ALAYA-ISABELLA",
  },
  {
    id: "cust_vip_eleanor", name: "Eleanor Whitfield", email: "eleanor@example.com", password: "password123",
    phone: "+1 (555) 987-6543", country: "United States", createdAt: daysAgo(365), lastLogin: daysAgo(1), status: "vip" as const,
    addresses: [addr("Home", "15 Beekman Place", "New York", "United States", "10022"), addr("Country Home", "42 Old Mill Road", "The Hamptons", "United States", "11937")],
    newsletter: true,
    timeline: [tle("account_created", "Account created", daysAgo(365)), tle("purchase", "Order placed — $1,248.00", daysAgo(7), "1248.00"), tle("purchase", "Order placed — $532.00", daysAgo(45), "532.00"), tle("purchase", "Order placed — $890.00", daysAgo(90), "890.00")],
    notes: [{ id: uid("note"), author: "Admin", body: "Top-tier customer, lifetime spend >$5,000.", pinned: true, private: false, ts: daysAgo(60) }],
    tasks: [],
    preferences: prefs(["atelier-co", "lumina-home", "ever-oak"], ["fragrance", "home-living", "lifestyle"], "dark", true),
    loyaltyPoints: 4500, storeCredit: 200, referralCode: "ALAYA-ELEANOR",
  },
  {
    id: "cust_james", name: "James Hartley", email: "james.hartley@alayainsider.com", password: "editor123",
    phone: "+44 20 7123 4567", country: "United Kingdom", createdAt: daysAgo(180), lastLogin: daysAgo(3), status: "active" as const,
    addresses: [addr("Office", "88 Soho Square", "London", "United Kingdom", "W1D 3PZ")],
    newsletter: true, timeline: [tle("account_created", "Editor account created", daysAgo(180)), tle("login", "Logged in from London", daysAgo(3))], notes: [],
    tasks: [ctask("Review draft article: Spring Skincare Guide", "marketing", "James Hartley", "high", daysAgo(-1), false, daysAgo(5))],
    preferences: prefs(["nourish-bloom"], ["beauty", "lifestyle"], "light", true),
    loyaltyPoints: 320, storeCredit: 0, referralCode: "ALAYA-JAMES",
  },
  {
    id: "cust_sarah", name: "Sarah Chen", email: "sarah.chen@alayainsider.com", password: "content456",
    phone: "+1 (415) 555-8901", country: "United States", createdAt: daysAgo(240), lastLogin: daysAgo(1), status: "active" as const,
    addresses: [addr("Office", "1 Market Street, Suite 300", "San Francisco", "United States", "94105")],
    newsletter: true, timeline: [tle("account_created", "Content Manager account created", daysAgo(240))], notes: [],
    tasks: [
      ctask("Approve buying guide: Best Ceramic Knives", "marketing", "Sarah Chen", "high", daysAgo(-2), true, daysAgo(10)),
      ctask("Schedule 3 new product reviews", "marketing", "Sarah Chen", "medium", daysAgo(-5), false, daysAgo(7)),
    ],
    preferences: prefs([], ["kitchen", "home-living"], "light", true),
    loyaltyPoints: 150, storeCredit: 0,
  },
  {
    id: "cust_marco", name: "Marco Rossi", email: "marco.rossi@alayainsider.com", password: "affiliate789",
    phone: "+39 06 1234 5678", country: "Italy", createdAt: daysAgo(300), lastLogin: daysAgo(5), status: "active" as const,
    addresses: [addr("Office", "Via Condotti 88", "Rome", "Italy", "00187")],
    newsletter: false, timeline: [tle("account_created", "Affiliate Manager account created", daysAgo(300))], notes: [],
    tasks: [ctask("Review affiliate commission rates for Q2", "sales", "Marco Rossi", "high", daysAgo(7), false, daysAgo(14))],
    preferences: prefs([], ["electronics", "travel"], "dark", false),
    loyaltyPoints: 0, storeCredit: 0,
  },
  {
    id: "cust_admin", name: "Admin User", email: "alayainsider@gmail.com", password: "Alaya@1923",
    phone: "+91 8431364706", country: "India", createdAt: daysAgo(365), lastLogin: daysAgo(0), status: "active" as const,
    addresses: [addr("Office", "12 MG Road, Indiranagar", "Bangalore", "India", "560038")],
    newsletter: false, timeline: [tle("account_created", "Administrator account created", daysAgo(365)), tle("login", "Admin login", daysAgo(0))], notes: [],
    tasks: [ctask("Review weekly analytics report", "reminder", "Admin", "medium", daysAgo(1), false, daysAgo(3))],
    preferences: prefs([], [], "dark", false),
    loyaltyPoints: 0, storeCredit: 0,
  },
  {
    id: "cust_meera", name: "Meera Iyer", email: "meera.iyer@example.com", password: "password123",
    phone: "+91 98765 43210", country: "India", createdAt: daysAgo(65), lastLogin: daysAgo(4), status: "active" as const,
    addresses: [addr("Home", "42 Lavelle Road", "Bangalore", "India", "560001")],
    newsletter: true, timeline: [tle("account_created", "Account created", daysAgo(65)), tle("purchase", "Order placed — $124.50", daysAgo(20), "124.50")], notes: [], tasks: [],
    preferences: prefs(["nourish-bloom", "clarity"], ["beauty", "health"], "light", true),
    loyaltyPoints: 420, storeCredit: 0, referralCode: "ALAYA-MEERA",
  },
  {
    id: "cust_oliver", name: "Oliver Thorne", email: "oliver@example.com", password: "password123",
    phone: "+44 777 654 3210", country: "United Kingdom", createdAt: daysAgo(45), lastLogin: daysAgo(10), status: "active" as const,
    addresses: [addr("Home", "5B Kensington High Street", "London", "United Kingdom", "W8 5NP")],
    newsletter: true, timeline: [tle("account_created", "Account created", daysAgo(45))], notes: [], tasks: [],
    preferences: prefs(["ever-oak"], ["lifestyle", "kitchen"], "light", true),
    loyaltyPoints: 80, storeCredit: 0,
  },
];

/* ================================================================== */
/*  ORDERS                                                             */
/* ================================================================== */

export const SEED_ORDERS = [
  {
    id: uid("ord"), number: "AL-481203",
    items: [
      { productId: _homeProducts[0].id, name: "Artisan Scented Candle Collection — Trio", image: thumb(965998), price: 54, qty: 1 },
      { productId: _beautyProducts[0].id, name: "Vitamin C Brightening Serum", image: thumb(3738343), price: 46, qty: 2 },
      { productId: _beautyProducts[3].id, name: "Cleansing Balm", image: thumb(3738343), price: 34, qty: 1 },
    ],
    subtotal: 180, discount: 18, shipping: 0, tax: 12.96, total: 174.96, currency: "USD",
    couponCode: "WELCOME10", paymentMethod: "Credit Card", trackingNumber: "1Z999AA10123456784", courier: "UPS",
    customer: { name: "Isabella Moreau", email: "isabella@example.com", address: "245 Park Avenue, Apt 4B", city: "New York", country: "United States", zip: "10022" },
    status: "delivered" as const, createdAt: daysAgo(15),
  },
  {
    id: uid("ord"), number: "AL-780102",
    items: [
      { productId: _fragranceProducts[0].id, name: "Eau de Parfum — Amber & Sandalwood", image: thumb(965998), price: 108, qty: 1 },
      { productId: _fragranceProducts[3].id, name: "Fragrance Discovery Set", image: thumb(965998), price: 25, qty: 1 },
    ],
    subtotal: 133, discount: 0, shipping: 12, tax: 11.60, total: 156.60, currency: "USD",
    paymentMethod: "PayPal", trackingNumber: "9400111899223456789012", courier: "USPS",
    customer: { name: "Eleanor Whitfield", email: "eleanor@example.com", address: "15 Beekman Place", city: "New York", country: "United States", zip: "10022" },
    status: "shipped" as const, createdAt: daysAgo(7),
  },
  {
    id: uid("ord"), number: "AL-654321",
    items: [
      { productId: _homeProducts[1].id, name: "Lambswool Throw Blanket", image: thumb(1571460), price: 145, qty: 1 },
      { productId: _kitchenProducts[3].id, name: "Crystal Wine Decanter", image: thumb(262917), price: 78, qty: 1 },
    ],
    subtotal: 223, discount: 33.45, shipping: 0, tax: 15.16, total: 204.71, currency: "USD",
    couponCode: "INSIDER15", paymentMethod: "Credit Card",
    customer: { name: "Eleanor Whitfield", email: "eleanor@example.com", address: "42 Old Mill Road", city: "The Hamptons", country: "United States", zip: "11937" },
    status: "processing" as const, createdAt: daysAgo(3),
  },
  {
    id: uid("ord"), number: "AL-481488",
    items: [
      { productId: _beautyProducts[1].id, name: "Retinol Night Cream", image: thumb(3738343), price: 60, qty: 1 },
      { productId: _beautyProducts[2].id, name: "Hyaluronic Acid Plumping Serum", image: thumb(3738343), price: 46, qty: 1 },
    ],
    subtotal: 106, discount: 0, shipping: 12, tax: 9.44, total: 127.44, currency: "USD",
    paymentMethod: "UPI",
    customer: { name: "Meera Iyer", email: "meera.iyer@example.com", address: "42 Lavelle Road", city: "Bangalore", country: "India", zip: "560001" },
    status: "pending" as const, createdAt: daysAgo(1),
  },
  {
    id: uid("ord"), number: "AL-998877",
    items: [
      { productId: _electronicsProducts[0].id, name: "Wireless Noise-Cancelling Earbuds", image: thumb(577769), price: 169, qty: 1 },
    ],
    subtotal: 169, discount: 0, shipping: 12, tax: 14.48, total: 195.48, currency: "USD",
    paymentMethod: "Apple Pay",
    customer: { name: "Oliver Thorne", email: "oliver@example.com", address: "5B Kensington High Street", city: "London", country: "United Kingdom", zip: "W8 5NP" },
    status: "paid" as const, createdAt: hoursAgo(12),
  },
];

/* ================================================================== */
/*  COUPONS                                                            */
/* ================================================================== */

export const SEED_COUPONS = [
  { id: uid("cpn"), code: "WELCOME10", type: "percent" as const, value: 10, minSpend: 0, active: true, description: "10% off your first order", usageLimit: 500, usedCount: 87 },
  { id: uid("cpn"), code: "INSIDER15", type: "percent" as const, value: 15, minSpend: 200, active: true, description: "15% off orders over $200", usageLimit: 200, usedCount: 34 },
  { id: uid("cpn"), code: "FREESHIP", type: "fixed" as const, value: 12, minSpend: 75, active: true, description: "Free shipping on orders over $75", usageLimit: 1000, usedCount: 312 },
  { id: uid("cpn"), code: "VIP20", type: "percent" as const, value: 20, minSpend: 150, active: true, description: "VIP exclusive 20% off", usageLimit: 50, usedCount: 12 },
  { id: uid("cpn"), code: "BEAUTY25", type: "percent" as const, value: 25, minSpend: 100, active: true, description: "25% off all beauty products", expiresAt: daysAgo(-30), usageLimit: 100, usedCount: 98 },
];

/* ================================================================== */
/*  ARTICLES                                                           */
/* ================================================================== */

export const SEED_ARTICLES = [
  { id: uid("art"), slug: "spring-skincare-routine-2026", title: "The Ultimate Spring Skincare Routine — 2026 Edition", excerpt: "Transition your skincare from winter to spring with our expert-approved routine featuring lightweight textures and brightening ingredients.", body: ["As the seasons shift from winter's chill to spring's gentle warmth, your skincare routine deserves a refresh. The heavy balms and rich creams that protected your skin through winter can now be swapped for lighter, brighter formulations.", "The key to a successful spring transition lies in three pillars: gentle exfoliation to shed winter dullness, antioxidant protection to defend against increasing UV exposure, and lightweight hydration that won't feel heavy as temperatures rise.", "Start by introducing a gentle exfoliant like lactic acid or PHAs twice a week to reveal fresh, glowing skin beneath. Follow with our Vitamin C Brightening Serum — the gold-standard antioxidant that protects against environmental damage while visibly brightening hyperpigmentation.", "Swap your heavy night cream for a lightweight gel moisturizer or a hyaluronic acid serum that delivers deep hydration without the weight.", "Don't forget — spring sunshine means higher UV exposure. Layer a weightless SPF 50 over your moisturizer every single day."], cover: wide(3738343), author: "Sarah Chen", authorRole: "Content Manager", category: "Beauty", tags: ["skincare", "spring", "routine", "vitamin-c", "hydration"], readMinutes: 5, publishedAt: daysAgo(7), featured: true },
  { id: uid("art"), slug: "guide-to-ceramic-knives", title: "Everything You Need to Know About Ceramic Knives", excerpt: "Why professional chefs are switching to ceramic blades — and why you should too.", body: ["Ceramic knives have come a long way from their niche origins. Today, they're found in professional kitchens and home cookeries alike, prized for their exceptional sharpness and longevity.", "Made from zirconium dioxide — the same material used in dental implants and aerospace components — ceramic blades are second only to diamond in hardness.", "One of the biggest advantages of ceramic is its chemical inertness. Unlike steel blades, which can react with acidic foods like tomatoes or citrus, ceramic won't transfer any metallic taste to your ingredients.", "The main consideration with ceramic is brittleness. While incredibly hard, ceramic blades can chip if used to cut through bones, frozen foods, or if dropped on hard surfaces.", "Bottom line: for slicing, dicing, and precision cutting of fruits, vegetables, and boneless meats, ceramic is superior to steel in almost every way."], cover: wide(262917), author: "James Hartley", authorRole: "Editor", category: "Kitchen", tags: ["knives", "ceramic", "cooking", "kitchen-tools", "buying-guide"], readMinutes: 6, publishedAt: daysAgo(14), featured: true },
  { id: uid("art"), slug: "capsule-wardrobe-travel-essentials", title: "The Perfect Capsule Wardrobe for Spring Travel", excerpt: "Everything you need for a week-long trip that fits in a carry-on — with zero compromise on style.", body: ["The art of travel packing is about making smart choices — selecting pieces that work harder, mix effortlessly, and transition from day to night.", "Start with a neutral color palette. When every piece coordinates with every other piece, you can create dozens of outfits from just 10-15 items.", "The key investment pieces are a well-structured blazer, a versatile midi dress, quality denim, and a lightweight cashmere sweater.", "Storage is everything. Our Travel Organizer Cube Set keeps your belongings sorted and maximizes every inch of your carry-on luggage.", "With the right pieces and smart organization, you'll arrive at your destination looking polished, with everything you need."], cover: wide(1008155), author: "Sarah Chen", authorRole: "Content Manager", category: "Travel", tags: ["travel", "packing", "capsule-wardrobe", "carry-on", "organization"], readMinutes: 4, publishedAt: daysAgo(10), featured: false },
  { id: uid("art"), slug: "morning-yoga-routine-beginners", title: "A 10-Minute Morning Yoga Routine for Beginners", excerpt: "Start your day with intention using this gentle flow designed for all levels.", body: ["A consistent morning yoga practice doesn't require an hour of your time or years of experience. This 10-minute flow is designed for complete beginners.", "Begin in Child's Pose (Balasana) for 5 deep breaths. Kneel on your mat, sit back on your heels, and extend your arms forward.", "Transition to Cat-Cow (Marjaryasana-Bitilasana) for 5 rounds. On your inhale, drop your belly and lift your gaze.", "Come to a standing forward fold (Uttanasana) for 5 breaths. Let your head hang heavy, bend your knees as much as you need.", "Flow through 3 Sun Salutations (Surya Namaskar A), moving with your breath.", "Finish in Savasana for 2 minutes. Lie flat on your back, arms at your sides, palms up."], cover: wide(2294361), author: "James Hartley", authorRole: "Editor", category: "Health", tags: ["yoga", "morning-routine", "wellness", "meditation", "fitness"], readMinutes: 3, publishedAt: daysAgo(20), featured: false },
  { id: uid("art"), slug: "scented-candle-buying-guide", title: "The Art of Home Fragrance — A Complete Guide to Scented Candles", excerpt: "From fragrance families to burn times, everything you need to choose the perfect candle.", body: ["A well-chosen candle transforms a house into a home. The right fragrance can evoke memories, set a mood, and create an atmosphere that words cannot capture.", "First, understand fragrance families. Woody scents create warmth, florals bring romance, fresh scents energize, and gourmand scents comfort.", "Consider the room. For living rooms, choose warm scents like amber or sandalwood. For bedrooms, opt for calming lavender or clean linen.", "Wax quality matters. Soy wax burns cleaner and longer than paraffin, with no soot or harmful chemicals.", "Safety first: always trim your wick to 1/4 inch before lighting, burn candles within sight, and never burn for more than 4 hours at a time."], cover: wide(965998), author: "Sarah Chen", authorRole: "Content Manager", category: "Lifestyle", tags: ["candles", "home-fragrance", "buying-guide", "interior"], readMinutes: 5, publishedAt: daysAgo(25), featured: true },
];

/* ================================================================== */
/*  SUPPLIERS                                                          */
/* ================================================================== */

export const SEED_SUPPLIERS = [
  { id: "sup_pt", name: "Lusitana Ware",           email: "orders@lusitana.pt",          country: "Portugal",      priority: 1, active: true, handlingDays: 3,  notes: "Ceramics and textiles" },
  { id: "sup_it", name: "Artigiano Italiano SRL",  email: "orders@artigiano.it",         country: "Italy",         priority: 2, active: true, handlingDays: 4,  notes: "Glassware and leather goods" },
  { id: "sup_fr", name: "Maison de Provence",      email: "orders@maison-provence.fr",   country: "France",        priority: 1, active: true, handlingDays: 3,  notes: "Fragrance and skincare" },
  { id: "sup_cn", name: "Shenzen Elite Mfg",       email: "orders@elite-mfg.cn",         country: "China",         priority: 3, active: true, handlingDays: 10, notes: "Electronics" },
  { id: "sup_us", name: "American Craft Supply",   email: "info@americancraft.com",     country: "United States", priority: 1, active: true, handlingDays: 2,  notes: "Domestic shipping" },
  { id: "sup_dk", name: "Nordic Home Goods",        email: "orders@nordichome.dk",      country: "Denmark",              priority: 2, active: true, handlingDays: 5,  notes: "Home goods" },
  { id: "sup_jp", name: "Kyoto Precision Crafts",  email: "orders@kyotocrafts.jp",       country: "Japan",         priority: 1, active: true, handlingDays: 7,  notes: "Ceramic knives" },
  { id: "sup_uk", name: "British Heritage Goods",   email: "orders@britishheritage.co.uk", country: "United Kingdom",              priority: 2, active: true, handlingDays: 3,  notes: "Lifestyle and stationery" },
];

/* ================================================================== */
/*  PAYMENT GATEWAYS                                                   */
/* ================================================================== */

export const SEED_PAYMENT_GATEWAYS = [
  { id: uid("gw"), name: "Stripe",      code: "stripe",    mode: "live" as const,  active: true, countries: [] },
  { id: uid("gw"), name: "PayPal",      code: "paypal",    mode: "live" as const,  active: true, countries: [] },
  { id: uid("gw"), name: "Apple Pay",   code: "applepay",  mode: "live" as const,  active: true, countries: ["United States", "United Kingdom", "Canada"] },
  { id: uid("gw"), name: "Google Pay",  code: "googlepay", mode: "live" as const,  active: true, countries: ["United States", "United Kingdom", "India"] },
  { id: uid("gw"), name: "Razorpay (UPI)", code: "razorpay", mode: "live" as const, active: true, countries: ["India"] },
];

/* ================================================================== */
/*  AFFILIATES                                                         */
/* ================================================================== */

export const SEED_AFFILIATES = [
  { id: uid("aff"), name: "Amazon Associates", url: "https://amazon.com",    commission: 6.0, active: true },
  { id: uid("aff"), name: "Impact Radius",     url: "https://impact.com",    commission: 8.5, active: true },
  { id: uid("aff"), name: "CJ Affiliate",      url: "https://cj.com",       commission: 7.0, active: true },
  { id: uid("aff"), name: "Awin",             url: "https://awin.com",       commission: 7.5, active: true },
  { id: uid("aff"), name: "ShareASale",       url: "https://shareasale.com", commission: 6.5, active: false },
];

/* ================================================================== */
/*  POPUPS                                                             */
/* ================================================================== */

export const SEED_POPUPS = [
  { id: uid("pop"), name: "Welcome Newsletter", type: "newsletter" as const, trigger: "time" as const, headline: "Join the Inner Circle", body: "Subscribe for exclusive access to new collections, early sale previews, and 10% off your first order.", ctaLabel: "Subscribe & Save", couponCode: "WELCOME10", triggerValue: 10, active: true, views: 1240, conversions: 312 },
  { id: uid("pop"), name: "Spring Sale Exit", type: "promo" as const, trigger: "exit_intent" as const, headline: "Wait! Don't Miss Our Spring Refresh", body: "Enjoy 15% off sitewide with code SPRING15 — but hurry, this offer won't last.", ctaLabel: "Shop Now", ctaLink: "/shop", couponCode: "SPRING15", active: true, views: 890, conversions: 68 },
  { id: uid("pop"), name: "Free Shipping Announcement", type: "announcement" as const, trigger: "scroll" as const, headline: "Free Shipping on Orders $150+", body: "Complimentary standard shipping on every order over $150. No code needed.", ctaLabel: "Start Shopping", ctaLink: "/shop", triggerValue: 50, active: true, views: 2100, conversions: 420 },
];

/* ================================================================== */
/*  LOYALTY TIERS                                                      */
/* ================================================================== */

export const SEED_LOYALTY_TIERS = [
  { id: uid("lty"), name: "Insider",    minPoints: 0,    perk: "Early access to new arrivals" },
  { id: uid("lty"), name: "Silver",     minPoints: 500,  perk: "Free standard shipping + early access" },
  { id: uid("lty"), name: "Gold",       minPoints: 1500, perk: "Free express shipping, early access, birthday gift" },
  { id: uid("lty"), name: "VIP Atelier", minPoints: 4000, perk: "Complimentary overnight shipping, exclusive events, personal stylist" },
];

/* ================================================================== */
/*  LIVE SALES                                                         */
/* ================================================================== */

export const SEED_LIVE_SALES = [
  { id: uid("ls"), customerName: "Emma L.",   city: "Melbourne", country: "Australia",       productId: SEED_PRODUCTS[4].id, minutesAgo: 3 },
  { id: uid("ls"), customerName: "James W.",   city: "London",   country: "United Kingdom",   productId: SEED_PRODUCTS[10].id, minutesAgo: 8 },
  { id: uid("ls"), customerName: "Sophia R.",  city: "Paris",     country: "France",           productId: SEED_PRODUCTS[8].id, minutesAgo: 15 },
  { id: uid("ls"), customerName: "Aiden K.",   city: "Toronto",  country: "Canada",           productId: SEED_PRODUCTS[15].id, minutesAgo: 22 },
  { id: uid("ls"), customerName: "Mia S.",     city: "Berlin",   country: "Germany",          productId: SEED_PRODUCTS[22].id, minutesAgo: 30 },
];

/* ================================================================== */
/*  REDIRECTS                                                          */
/* ================================================================== */

export const SEED_REDIRECTS = [
  { id: uid("redir"), from: "/shop/spring-collection", to: "/shop?tag=spring", type: 301 as const, active: true, hits: 245, createdAt: daysAgo(120) },
  { id: uid("redir"), from: "/old-blog", to: "/journal", type: 301 as const, active: true, hits: 89, createdAt: daysAgo(180) },
];

/* ================================================================== */
/*  RETURNS                                                            */
/* ================================================================== */

export const SEED_RETURNS = [
  { id: uid("ret"), number: "RT-481203", orderId: SEED_ORDERS[0].id, orderNumber: "AL-481203", customer: { name: "Isabella Moreau", email: "isabella@example.com" }, type: "refund" as const, reason: "Item arrived with damaged packaging", comment: "The candle box was crushed during shipping.", status: "completed" as const, refundAmount: 15, createdAt: daysAgo(10) },
];
