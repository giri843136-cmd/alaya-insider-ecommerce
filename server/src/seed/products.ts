/**
 * ALAYA INSIDER — Seed Products
 * 30 realistic products distributed across 8 categories.
 * Each product includes full PIM data: SEO, specs, images, reviews, features.
 */

import { v4 } from "uuid";
import { daysAgo, rating, reviewCount, stock } from "./helpers.js";

export interface ProductDef {
  id: string; slug: string; name: string; brand?: string; brandId?: string;
  category: string; type: string; price: number; salePrice?: number | null;
  rating: number; reviewCount: number; images: string[];
  shortDescription: string; description: string; features: string[];
  variants?: { name: string; options: string[] }[];
  stock: number; sku: string; tags: string[];
  barcode?: string; gtin?: string; asin?: string; supplierId?: string;
  costPrice?: number; affiliate?: boolean; affiliateUrl?: string;
  affiliatePartner?: string; affiliateNetwork?: string;
  affiliateCommission?: number; featured?: boolean; bestSeller?: boolean;
  isNew?: boolean; comingSoon?: boolean; preorder?: boolean;
  status?: string; reviews: Array<{
    id: string; author: string; rating: number; title: string;
    body: string; date: string; verified?: boolean; helpful?: number; pinned?: boolean;
  }>; specs?: Array<{ label: string; value: string }>;
  createdAt: number;
}

function pId(): string { return `prod_${v4().slice(0, 8)}${Date.now().toString(36).slice(-4)}`; }
function rId(): string { return `rev_${v4().slice(0, 8)}`; }
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function sku(prefix: string, num: number): string {
  return `AL-${prefix}-${String(num).padStart(4, "0")}`;
}
function spec(label: string, value: string): { label: string; value: string } {
  return { label, value };
}

/* ================================================================== */
/*  HOME & LIVING — 5 products                                         */
/* ================================================================== */

const homeProducts: ProductDef[] = [
  {
    id: pId(), slug: "artisan-scented-candle-collection", name: "Artisan Scented Candle Collection — Trio",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "home-living", type: "physical",
    price: 68, salePrice: 54, rating: rating(4.2, 4.9), reviewCount: reviewCount(30, 80),
    images: ["https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg", "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Three hand-poured soy wax candles in signature fragrances: Amber & Sandalwood, Wild Fig & Cassis, and Linen & Cotton.",
    description: "Transform your space with our Artisan Scented Candle Trio from Atelier & Co. Each candle is hand-poured in small batches using 100% natural soy wax, cotton wicks, and fine fragrance oils. Housed in matte ceramic vessels that transition beautifully into decor pieces long after the candle has burned. Burn time: approximately 45 hours each.",
    features: ["100% natural soy wax", "Cotton-core lead-free wicks", "45+ hour burn time each", "Matte ceramic vessels", "Phthalate-free fragrances", "Hand-poured in small batches"],
    stock: stock(15, 60), sku: sku("HOM", 1),
    tags: ["candles", "home-fragrance", "gift-ideas", "artisan", "soy-wax", "attic"],
    barcode: "8712345678901", gtin: "08712345678901", asin: "B0EXAMPLE001",
    costPrice: 22, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Sophie M.", rating: 5, title: "Absolutely divine", body: "These candles are incredible. The Wild Fig & Cassis is my new favorite scent — it fills my entire living room with the most beautiful warm aroma. The vessels are gorgeous too; I'm using them as planters now.", date: new Date(daysAgo(15)).toISOString(), verified: true, helpful: 23 },
      { id: rId(), author: "James K.", rating: 4, title: "Beautiful but subtle", body: "Lovely candles with a refined, subtle scent. If you prefer strong fragrance throw, these might be too subtle. But for a sophisticated, natural aroma they're perfect. The Linen & Cotton is my go-to.", date: new Date(daysAgo(34)).toISOString(), verified: true, helpful: 8 },
    ],
    specs: [
      spec("Burn Time", "45+ hours per candle"), spec("Wax Type", "100% Natural Soy"),
      spec("Wick", "Cotton-core, lead-free"), spec("Weight", "8 oz each (240g total)"),
      spec("Fragrance Family", "Woody, Floral, Fresh"), spec("Origin", "Hand-poured in France"),
    ],
    createdAt: daysAgo(120),
  },
  {
    id: pId(), slug: "lambswool-throw-blanket", name: "Lambswool Throw Blanket — Portugal",
    brand: "Lumina Home", brandId: "lumina-home", category: "home-living", type: "physical",
    price: 145, salePrice: null, rating: rating(4.0, 4.8), reviewCount: reviewCount(15, 50),
    images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Ultra-soft Portuguese lambswool throw, expertly woven for warmth and breathability.",
    description: "The Lambswool Throw Blanket is woven in Portugal from the finest lambswool, sourced from sustainable farms in northern Portugal. The result is a blanket that's impossibly soft, naturally temperature-regulating, and built to last for decades. Each throw is finished with hand-knotted fringe detailing.",
    features: ["100% Portuguese lambswool", "Naturally temperature regulating", "Hand-finished fringe detailing", "Hypoallergenic", "Ethically sourced wool", "Machine washable gentle cycle"],
    stock: stock(8, 35), sku: sku("HOM", 2),
    tags: ["blankets", "throws", "home-decor", "loungewear", "portuguese", "lambswool"],
    barcode: "8712345678902", gtin: "08712345678902", supplierId: "sup_pt",
    costPrice: 55, featured: true, isNew: true,
    reviews: [
      { id: rId(), author: "Clara D.", rating: 5, title: "Heirloom quality", body: "This throw is absolutely stunning. The weight is perfect — heavy enough to feel substantial but light enough for year-round use. The wool is so soft, not scratchy at all. Worth every penny.", date: new Date(daysAgo(8)).toISOString(), verified: true, helpful: 15 },
    ],
    specs: [
      spec("Material", "100% Portuguese Lambswool"), spec("Dimensions", "130cm x 180cm"),
      spec("Weight", "680g"), spec("Care", "Machine wash gentle, air dry"),
      spec("Origin", "Woven in Portugal"), spec("Colors", "Oatmeal, Charcoal, Blush"),
    ],
    createdAt: daysAgo(45),
  },
  {
    id: pId(), slug: "handblown-glass-vase", name: "Handblown Glass Vase — Ambre Collection",
    brand: "Lumina Home", brandId: "lumina-home", category: "home-living", type: "physical",
    price: 89, salePrice: 72, rating: rating(3.8, 4.7), reviewCount: reviewCount(10, 35),
    images: ["https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Mouth-blown amber glass vase with an organic, sculptural form by Italian artisans.",
    description: "Each vase in the Ambre Collection is individually mouth-blown by master glass artisans in Murano, Italy. The warm amber hue is achieved through a traditional technique using pure gold chloride, creating subtle variations in color and depth that make every piece unique. The organic, asymmetrical form makes a striking sculptural statement even without flowers.",
    features: ["Mouth-blown Murano glass", "Authentic gold chloride amber hue", "Organic asymmetrical form", "Signature etched base", "Each piece is unique", "Watertight — suitable for fresh flowers"],
    stock: stock(3, 20), sku: sku("HOM", 3),
    tags: ["vases", "glassware", "italian", "murano", "home-decor", "sculptural"],
    costPrice: 32, isNew: true,
    reviews: [
      { id: rId(), author: "Marcus L.", rating: 5, title: "A work of art", body: "Even more beautiful in person. The amber color shifts in different lighting — sometimes almost honey, sometimes deep cognac. It's the centerpiece of my dining table now.", date: new Date(daysAgo(12)).toISOString(), verified: true, helpful: 11 },
    ],
    specs: [
      spec("Material", "Mouth-blown Murano Glass"), spec("Height", "28cm"),
      spec("Width", "14cm (at widest)"), spec("Color", "Amber (varies per piece)"),
      spec("Origin", "Murano, Italy"), spec("Care", "Hand wash with soft cloth"),
    ],
    createdAt: daysAgo(30),
  },
  {
    id: pId(), slug: "organic-linen-curtain-panel", name: "Organic Linen Curtain Panel — Oatmeal",
    brand: "Lumina Home", brandId: "lumina-home", category: "home-living", type: "physical",
    price: 120, salePrice: 96, rating: rating(4.0, 4.6), reviewCount: reviewCount(20, 60),
    images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Pure organic linen curtain panels with a relaxed, lived-in drape. Set of two.",
    description: "Our Organic Linen Curtains are woven from 100% GOTS-certified organic flax in Lithuania. The mid-weight linen has a stonewashed finish for a relaxed, lived-in feel from day one. Each panel is finished with a 4\" rod pocket and 1.5\" hem. Sold as a pair.",
    features: ["100% GOTS-certified organic linen", "Stonewashed for softness", "Set of two panels", "4\" rod pocket", "1.5\" hem", "Pre-washed and pre-shrunk"],
    stock: stock(10, 30), sku: sku("HOM", 4),
    tags: ["curtains", "linen", "organic", "window-treatments", "scandinavian"],
    costPrice: 40, featured: true,
    reviews: [
      { id: rId(), author: "Elena R.", rating: 4, title: "Beautiful drape", body: "The color is exactly as pictured — a warm oatmeal that works perfectly with our neutral palette. They let in lovely diffused light. My only note is they arrived a bit wrinkled but steamed out beautifully.", date: new Date(daysAgo(28)).toISOString(), verified: true, helpful: 6 },
    ],
    specs: [
      spec("Material", "100% GOTS Organic Linen"), spec("Dimensions", "132cm x 274cm per panel"),
      spec("Set Includes", "2 panels"), spec("Weight", "190gsm"),
      spec("Light Filtering", "Semi-sheer / Filtered"), spec("Origin", "Woven in Lithuania"),
    ],
    createdAt: daysAgo(60),
  },
  {
    id: pId(), slug: "terra-cotta-plant-pot-set", name: "Terracotta Plant Pot Set — Mediterranean",
    brand: "Terra & Stone", brandId: "terra-stone", category: "home-living", type: "physical",
    price: 45, salePrice: null, rating: rating(3.9, 4.5), reviewCount: reviewCount(8, 25),
    images: ["https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Set of three hand-thrown terracotta pots from Tuscany with saucers included.",
    description: "These terracotta pots are hand-thrown by artisans in Tuscany using clay sourced from the Chianti region. Each pot features a natural, unglazed finish that ages beautifully and develops a unique patina over time. The porous terracotta allows soil to breathe, promoting healthy root growth. Set includes three graduated sizes with matching saucers.",
    features: ["Hand-thrown Tuscan terracotta", "Natural unglazed finish", "Set of three sizes", "Matching saucers included", "Drainage hole with cork plug", "Develops natural patina over time"],
    stock: stock(12, 40), sku: sku("HOM", 5),
    tags: ["plant-pots", "terracotta", "italian", "handmade", "indoor-garden"],
    barcode: "8712345678905",
    costPrice: 14, isNew: true,
    reviews: [
      { id: rId(), author: "Priya S.", rating: 5, title: "Gorgeous craftsmanship", body: "You can see and feel the handmade quality immediately. The clay has beautiful subtle variations. My succulents look so much happier in these than in plastic pots!", date: new Date(daysAgo(10)).toISOString(), verified: true, helpful: 9 },
    ],
    specs: [
      spec("Material", "Tuscan Terracotta"), spec("Sizes", "Small: 10cm, Medium: 14cm, Large: 18cm"),
      spec("Includes", "3 pots + 3 saucers"), spec("Finish", "Natural, unglazed"),
      spec("Origin", "Hand-thrown in Tuscany, Italy"), spec("Care", "Wipe clean; avoid prolonged water exposure"),
    ],
    createdAt: daysAgo(20),
  },
];

/* ================================================================== */
/*  KITCHEN — 4 products                                               */
/* ================================================================== */

const kitchenProducts: ProductDef[] = [
  {
    id: pId(), slug: "japanese-ceramic-knife-set", name: "Japanese Ceramic Knife Set — Trio",
    brand: "Terra & Stone", brandId: "terra-stone", category: "kitchen", type: "physical",
    price: 175, salePrice: 148, rating: rating(4.3, 4.9), reviewCount: reviewCount(40, 100),
    images: ["https://images.pexels.com/photos/262917/pexels-photo-1008155.jpeg", "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg"],
    shortDescription: "Three precision ceramic knives with ergonomic handles: chef's, utility, and paring.",
    description: "Our Japanese Ceramic Knife Set brings together three essential kitchen knives featuring Zirconia 92 ceramic blades — the hardest ceramic blade material available, second only to diamond in hardness. The blades stay razor-sharp 10x longer than steel, are completely rust-proof, and won't transfer metallic tastes to food. Each knife features a curved ergonomic handle with a weighted, balanced feel.",
    features: ["Zirconia 92 ceramic blades", "10x longer edge retention than steel", "Rust-proof and stain-proof", "Ergonomic curved handles", "Blade guard covers included", "Lifetime edge guarantee"],
    stock: stock(8, 25), sku: sku("KIT", 1),
    tags: ["knives", "ceramic", "japanese", "cutlery", "professional", "gift-ideas"],
    barcode: "8712345678911", asin: "B0EXAMPLE011",
    costPrice: 55, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Daniel W.", rating: 5, title: "Game-changing sharpness", body: "I've been using these for three months and they're still as sharp as day one. The chef's knife has become my go-to for everything. They're lightweight but feel substantial. Highly recommend the included blade guards for storage.", date: new Date(daysAgo(45)).toISOString(), verified: true, helpful: 32 },
      { id: rId(), author: "Anya P.", rating: 5, title: "Worth the investment", body: "Upgraded from a steel knife block and the difference is incredible. Slicing tomatoes is effortless, and cleanup is so easy. They're beautiful to look at too!", date: new Date(daysAgo(60)).toISOString(), verified: true, helpful: 18 },
    ],
    specs: [
      spec("Blade Material", "Zirconia 92 Ceramic"), spec("Included", "Chef's (18cm), Utility (14cm), Paring (8cm)"),
      spec("Handle", "Ergonomically curved synthetic"), spec("Edge Retention", "10x longer than stainless steel"),
      spec("Weight", "142g (chef's), 98g (utility), 52g (paring)"), spec("Origin", "Crafted in Japan"),
    ],
    createdAt: daysAgo(150),
  },
  {
    id: pId(), slug: "bamboo-cutting-board-set", name: "Organic Bamboo Cutting Board Set — 3-Piece",
    brand: "Terra & Stone", brandId: "terra-stone", category: "kitchen", type: "physical",
    price: 52, salePrice: 42, rating: rating(3.8, 4.4), reviewCount: reviewCount(25, 70),
    images: ["https://images.pexels.com/photos/262917/pexels-photo-1008155.jpeg"],
    shortDescription: "Sustainable bamboo cutting boards in three sizes with deep juice grooves.",
    description: "Crafted from organically grown Moso bamboo — one of the fastest-renewing resources on earth — this 3-piece cutting board set is as eco-friendly as it is functional. Each board features a deep juice groove on one side and a flat surface on the reverse. The bamboo is harder than maple, naturally antimicrobial, and gentle on knife edges.",
    features: ["Organic Moso bamboo", "Naturally antimicrobial", "Deep juice groove", "3 essential sizes", "Hanging loop for storage", "Gentle on knife edges"],
    stock: stock(20, 50), sku: sku("KIT", 2),
    tags: ["cutting-boards", "bamboo", "sustainable", "kitchen-essentials"],
    costPrice: 16, bestSeller: true,
    reviews: [
      { id: rId(), author: "Tom G.", rating: 4, title: "Solid boards", body: "These are great for everyday use. The large board handles full meals while the small one is perfect for quick prep. They do require occasional oiling to maintain the bamboo.", date: new Date(daysAgo(30)).toISOString(), verified: true, helpful: 7 },
    ],
    specs: [
      spec("Material", "Organic Moso Bamboo"), spec("Sizes", "Large: 45x30cm, Medium: 35x25cm, Small: 25x18cm"),
      spec("Thickness", "1.8cm"), spec("Features", "Juice groove on one side, flat on reverse"),
      spec("Care", "Hand wash, oil monthly"), spec("Antimicrobial", "Naturally antimicrobial bamboo"),
    ],
    createdAt: daysAgo(90),
  },
  {
    id: pId(), slug: "french-press-coffee-maker", name: "Double-Wall French Press — 1L",
    brand: "Lumina Home", brandId: "lumina-home", category: "kitchen", type: "physical",
    price: 65, salePrice: null, rating: rating(4.1, 4.7), reviewCount: reviewCount(35, 90),
    images: ["https://images.pexels.com/photos/262917/pexels-photo-1008155.jpeg", "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg"],
    shortDescription: "Borosilicate glass French press with double-wall insulation in brushed stainless frame.",
    description: "The Double-Wall French Press combines timeless design with modern engineering. The borosilicate glass carafe keeps coffee hot for up to 2 hours thanks to the double-wall construction, while the brushed stainless steel frame and handle add durability and elegance. The 4-stage filter system ensures a clean, sediment-free cup every time.",
    features: ["Double-wall borosilicate glass", "Keeps coffee hot for 2 hours", "4-stage stainless filter", "Brushed stainless steel frame", "1-liter capacity (8 cups)", "Dishwasher-safe glass carafe"],
    stock: stock(15, 40), sku: sku("KIT", 3),
    tags: ["coffee", "french-press", "kitchen", "scandinavian", "home-barista"],
    asin: "B0EXAMPLE013", costPrice: 22,
    reviews: [
      { id: rId(), author: "Mia K.", rating: 5, title: "Beautiful and functional", body: "Makes perfect coffee and keeps it hot for so long — I can actually sip my coffee over a lazy morning without needing to reheat. The filter works great, no grounds in my cup.", date: new Date(daysAgo(20)).toISOString(), verified: true, helpful: 14 },
    ],
    specs: [
      spec("Capacity", "1 liter (approx. 8 cups)"), spec("Material", "Borosilicate glass, stainless steel"),
      spec("Insulation", "Double-wall (keeps hot 2 hours)"), spec("Filter", "4-stage stainless steel mesh"),
      spec("Dimensions", "24cm height, 12cm diameter"), spec("Care", "Glass is dishwasher-safe; frame hand wash"),
    ],
    createdAt: daysAgo(75),
  },
  {
    id: pId(), slug: "wine-decanter-carafe", name: "Crystal Wine Decanter — Handblown",
    brand: "Terra & Stone", brandId: "terra-stone", category: "kitchen", type: "physical",
    price: 95, salePrice: 78, rating: rating(4.0, 4.6), reviewCount: reviewCount(12, 40),
    images: ["https://images.pexels.com/photos/262917/pexels-photo-1008155.jpeg"],
    shortDescription: "Handblown lead-free crystal decanter designed for optimal aeration.",
    description: "This handblown crystal decanter is crafted by master glassblowers using traditional techniques. The generous, wide base provides maximum surface area for aeration, while the elegantly curved neck ensures a drip-free pour. Made from lead-free crystal, it enhances both the flavor and presentation of your finest wines.",
    features: ["Handblown lead-free crystal", "Maximal aeration design", "Drip-free curved spout", "Generous 1.5L capacity", "Signature polished base", "Gift box packaging"],
    stock: stock(6, 20), sku: sku("KIT", 4),
    tags: ["wine", "decanter", "crystal", "handblown", "entertaining", "gift-ideas"],
    barcode: "8712345678914",
    costPrice: 30, featured: true,
    reviews: [
      { id: rId(), author: "Oliver S.", rating: 5, title: "Stunning piece", body: "The craftsmanship is remarkable. Light catches it beautifully on the dining table. And functionally, it makes a real difference — my Bordeaux opened up beautifully after just 30 minutes in the decanter.", date: new Date(daysAgo(18)).toISOString(), verified: true, helpful: 12 },
    ],
    specs: [
      spec("Material", "Lead-free Crystal"), spec("Capacity", "1.5 liters"),
      spec("Height", "28cm"), spec("Width", "18cm (widest point)"),
      spec("Origin", "Handblown in Portugal"), spec("Care", "Hand wash with mild soap, dry immediately"),
    ],
    createdAt: daysAgo(50),
  },
];

/* ================================================================== */
/*  BEAUTY — 5 products                                                */
/* ================================================================== */

const beautyProducts: ProductDef[] = [
  {
    id: pId(), slug: "vitamin-c-brightening-serum", name: "Vitamin C Brightening Serum — 15% Pure L-Ascorbic",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical",
    price: 58, salePrice: 46, rating: rating(4.3, 4.9), reviewCount: reviewCount(80, 200),
    images: ["https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg", "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Stabilized 15% pure L-ascorbic acid serum with vitamin E and ferulic acid for brightening.",
    description: "Our Vitamin C Brightening Serum delivers a potent 15% concentration of pure L-ascorbic acid — the gold standard for vitamin C efficacy — stabilized with a patented delivery system to prevent oxidation. Enhanced with vitamin E and ferulic acid, this antioxidant powerhouse brightens hyperpigmentation, boosts collagen production, and defends against environmental damage.",
    features: ["15% pure L-ascorbic acid", "Stabilized against oxidation", "Vitamin E + Ferulic acid booster", "Reduces hyperpigmentation", "Boosts collagen synthesis", "Lightweight, fast-absorbing"],
    stock: stock(25, 60), sku: sku("BEA", 1),
    tags: ["vitamin-c", "serum", "brightening", "anti-aging", "antioxidant", "skincare"],
    barcode: "8712345678921", gtin: "08712345678921", asin: "B0EXAMPLE021",
    costPrice: 15, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Emma L.", rating: 5, title: "Holy grail serum", body: "I've tried so many vitamin C serums and this is by far the best. Within two weeks my dark spots visibly faded, and my skin has this glow I haven't seen in years. The formula doesn't oxidize as quickly as others I've used.", date: new Date(daysAgo(30)).toISOString(), verified: true, helpful: 45 },
      { id: rId(), author: "Rachel H.", rating: 4, title: "Great results, slight tingling", body: "Definitely notice a difference in brightness and texture. It does tingle on application, especially if I've exfoliated recently, but that's normal for L-ascorbic acid. Just something to be aware of if you have sensitive skin.", date: new Date(daysAgo(55)).toISOString(), verified: true, helpful: 28 },
    ],
    specs: [
      spec("Key Ingredient", "15% L-Ascorbic Acid (Vitamin C)"), spec("Supporting Ingredients", "Vitamin E (Tocopherol), Ferulic Acid"),
      spec("Volume", "30ml / 1 fl oz"), spec("Texture", "Lightweight water-like serum"),
      spec("pH", "3.2-3.5 (optimal for absorption)"), spec("Packaging", "Airless pump, amber glass"),
    ],
    createdAt: daysAgo(180),
  },
  {
    id: pId(), slug: "retinol-night-cream", name: "Retinol Night Cream — 0.5% Encapsulated Retinol",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical",
    price: 72, salePrice: 60, rating: rating(4.0, 4.7), reviewCount: reviewCount(50, 120),
    images: ["https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg"],
    shortDescription: "Time-release retinol night cream with peptides and ceramides for renewal while you sleep.",
    description: "Our Retinol Night Cream uses encapsulated retinol technology for controlled release throughout the night, maximizing efficacy while minimizing irritation. The rich, nourishing formula is fortified with copper peptides to support collagen production and ceramides to strengthen the skin barrier. Suitable for retinol beginners and experienced users alike.",
    features: ["0.5% encapsulated retinol", "Time-release delivery system", "Copper peptides for collagen", "Ceramide complex for barrier", "Non-comedogenic", "Fragrance-free"],
    stock: stock(18, 40), sku: sku("BEA", 2),
    tags: ["retinol", "night-cream", "anti-aging", "peptides", "skincare"],
    barcode: "8712345678922", gtin: "08712345678922",
    costPrice: 20, bestSeller: true,
    reviews: [
      { id: rId(), author: "Nina V.", rating: 5, title: "Game changer for fine lines", body: "After 6 weeks of nightly use, my forehead lines are noticeably softer. I love that it's encapsulated so I don't get that raw, irritated feeling I've had with other retinols. My skin feels plump and smooth in the morning.", date: new Date(daysAgo(40)).toISOString(), verified: true, helpful: 35 },
    ],
    specs: [
      spec("Active Ingredient", "0.5% Encapsulated Retinol"), spec("Key Additives", "Copper Peptides, Ceramide NP/AP/EOP"),
      spec("Volume", "50ml / 1.7 fl oz"), spec("Texture", "Rich cream, absorbs fully"),
      spec("Usage", "Apply PM only, follow with SPF AM"), spec("Skin Type", "All skin types, including sensitive"),
    ],
    createdAt: daysAgo(120),
  },
  {
    id: pId(), slug: "hyaluronic-acid-plumping-serum", name: "Hyaluronic Acid Plumping Serum — Triple Weight",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical",
    price: 46, salePrice: null, rating: rating(4.2, 4.8), reviewCount: reviewCount(60, 150),
    images: ["https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg"],
    shortDescription: "Triple-weight hyaluronic acid with multi-molecular hydration for deep, lasting plumping.",
    description: "Our Triple Weight Hyaluronic Acid Serum features three molecular weights of hyaluronic acid — super-low, medium, and high — to hydrate at every layer of the skin. Super-low molecular weight HA penetrates deep, medium weight hydrates the mid-layers, and high weight provides surface hydration. The result is visibly plumper, smoother, more dewy skin.",
    features: ["Triple-molecular HA (low/med/high)", "Deep multi-layer hydration", "5% HA concentration", "Lightweight gel texture", "Vegan and cruelty-free", "No added fragrance"],
    stock: stock(30, 70), sku: sku("BEA", 3),
    tags: ["hyaluronic-acid", "serum", "hydration", "plumping", "skincare", "vegan"],
    barcode: "8712345678923",
    costPrice: 12, featured: true,
    reviews: [
      { id: rId(), author: "Leila K.", rating: 5, title: "Hydration like no other", body: "My dehydrated skin drinks this up. I apply it to damp skin and follow with moisturizer — the plumping effect is immediate. Fine lines around my eyes are much less noticeable.", date: new Date(daysAgo(25)).toISOString(), verified: true, helpful: 22 },
    ],
    specs: [
      spec("Active", "5% Hyaluronic Acid Complex (Triple Weight)"), spec("Molecular Weights", "Super-Low (3-5kDa), Medium (50-100kDa), High (1,000-1,500kDa)"),
      spec("Volume", "30ml / 1 fl oz"), spec("Texture", "Lightweight gel-serum"),
      spec("pH", "5.5-6.5"), spec("Certifications", "Vegan, Cruelty-Free, Fragrance-Free"),
    ],
    createdAt: daysAgo(90),
  },
  {
    id: pId(), slug: "cleansing-balm-makeup-remover", name: "Cleansing Balm — Universal Makeup Remover",
    brand: "Nourish & Bloom", brandId: "nourish-bloom", category: "beauty", type: "physical",
    price: 34, salePrice: null, rating: rating(4.1, 4.6), reviewCount: reviewCount(40, 90),
    images: ["https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg"],
    shortDescription: "Oil-based cleansing balm that melts away makeup and sunscreen without stripping.",
    description: "This universal cleansing balm transforms from a silky balm to a milky oil on contact with skin, dissolving even waterproof makeup and SPF effortlessly. Formulated with vitamin-rich moringa oil, soothing chamomile, and antioxidant green tea extract, it cleanses without stripping the skin barrier. The built-in magnetic spatula ensures hygienic scooping every time.",
    features: ["Balm-to-oil-to-milk texture", "Dissolves waterproof makeup", "Moringa oil for vitamin-rich cleansing", "Chamomile to soothe", "Magnetic spatula included", "Does not strip skin barrier"],
    stock: stock(22, 50), sku: sku("BEA", 4),
    tags: ["cleanser", "cleansing-balm", "makeup-remover", "skincare", "vegan"],
    costPrice: 10, bestSeller: true,
    reviews: [
      { id: rId(), author: "Sophia A.", rating: 5, title: "The best balm ever", body: "Takes off everything — including my stubborn waterproof mascara — without any tugging or irritation. My skin feels soft and clean after, never tight or dry. The magnetic spatula is such a nice touch!", date: new Date(daysAgo(35)).toISOString(), verified: true, helpful: 19 },
    ],
    specs: [
      spec("Key Ingredients", "Moringa Oil, Chamomile, Green Tea"), spec("Texture", "Solid balm → milky oil → emulsion"),
      spec("Volume", "100ml / 3.4 fl oz"), spec("Suited For", "All skin types, including sensitive"),
      spec("Removes", "Waterproof makeup, SPF, sebum"), spec("Finish", "Clean, hydrated, never stripped"),
    ],
    createdAt: daysAgo(60),
  },
  {
    id: pId(), slug: "professional-makeup-brush-set", name: "Professional Makeup Brush Set — 12-Piece",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "beauty", type: "physical",
    price: 125, salePrice: 99, rating: rating(4.0, 4.5), reviewCount: reviewCount(20, 50),
    images: ["https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg"],
    shortDescription: "Complete 12-piece brush set with ultra-soft synthetic bristles and weighted handles.",
    description: "This 12-piece brush collection features ultra-soft synthetic bristles that perform like natural hair without the ethical concerns. Each brush has a weighted, faceted handle for perfect balance and control. The set includes everything from a fluffy powder brush to a precision liner brush, all housed in a sleek vegan leather roll.",
    features: ["12 essential brush shapes", "Ultra-soft synthetic Taklon bristles", "Weighted faceted handles", "Vegan leather travel roll", "No shedding or shedding", "Easy to clean, dries quickly"],
    stock: stock(10, 30), sku: sku("BEA", 5),
    tags: ["makeup-brushes", "brush-set", "professional", "vegan", "beauty-tools"],
    barcode: "8712345678925",
    costPrice: 32, featured: true, isNew: true,
    reviews: [
      { id: rId(), author: "Isabella V.", rating: 4, title: "Luxurious set", body: "The brushes feel amazing in hand — substantial but not heavy. The bristles are ridiculously soft and blend seamlessly. The only reason I'm not giving 5 stars is that the roll could be a bit larger; it's snug with all brushes.", date: new Date(daysAgo(14)).toISOString(), verified: true, helpful: 10 },
    ],
    specs: [
      spec("Bristle Material", "Synthetic Taklon (vegan)"), spec("Set Includes", "12 brushes + vegan leather roll"),
      spec("Handle", "Weighted, faceted, matte black"), spec("Brush Types", "Powder, blush, contour, eyeshadow (x3), blending, liner, brow, lip, concealer, fan"),
      spec("Care", "Wash weekly with mild soap, dry flat"), spec("Cruelty-Free", "Certified cruelty-free and vegan"),
    ],
    createdAt: daysAgo(25),
  },
];

/* ================================================================== */
/*  ELECTRONICS — 4 products                                           */
/* ================================================================== */

const electronicsProducts: ProductDef[] = [
  {
    id: pId(), slug: "wireless-noise-cancelling-earbuds", name: "Wireless Noise-Cancelling Earbuds — Pro",
    brand: "Clarity", brandId: "clarity", category: "electronics", type: "physical",
    price: 199, salePrice: 169, rating: rating(4.2, 4.8), reviewCount: reviewCount(100, 250),
    images: ["https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg", "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Premium ANC earbuds with adaptive transparency, 30h battery, and crystal-clear calls.",
    description: "Our Wireless Pro Earbuds deliver studio-quality sound with adaptive active noise cancellation that adjusts to your environment in real time. The custom 11mm dynamic drivers produce rich, detailed audio with deep bass and sparkling highs. Six beamforming microphones ensure crystal-clear call quality even in windy conditions. With 8 hours of playback per charge (30h with case) and wireless charging, they're built for all-day use.",
    features: ["Adaptive ANC with transparency mode", "11mm custom dynamic drivers", "6-mic array for calls", "8h buds / 30h with case", "Wireless Qi charging", "IPX5 water resistant"],
    stock: stock(20, 45), sku: sku("ELE", 1),
    tags: ["earbuds", "wireless", "noise-cancelling", "bluetooth", "audio", "clarity"],
    barcode: "8712345678931", gtin: "08712345678931", asin: "B0EXAMPLE031",
    costPrice: 55, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Alex T.", rating: 5, title: "Best earbuds I've owned", body: "The sound quality is outstanding — clear, balanced, with punchy bass. ANC is top-tier, almost as good as my over-ear headphones. The transparency mode is surprisingly natural. Comfortable for hours of wear.", date: new Date(daysAgo(20)).toISOString(), verified: true, helpful: 52 },
      { id: rId(), author: "Jordan P.", rating: 4, title: "Great features, slight fit adjustment", body: "Sound and ANC are excellent. My only note is that the earbuds are a bit large — I needed to try the different ear tip sizes to get a secure fit. Once I did, they're great for runs too.", date: new Date(daysAgo(42)).toISOString(), verified: true, helpful: 16 },
    ],
    specs: [
      spec("Driver", "11mm custom dynamic"), spec("ANC", "Adaptive, up to -40dB"),
      spec("Battery", "8 hrs (buds) / 30 hrs (with case)"), spec("Charging", "USB-C, Qi wireless"),
      spec("Connectivity", "Bluetooth 5.3, Multipoint"), spec("Water Resistance", "IPX5"),
    ],
    createdAt: daysAgo(90),
  },
  {
    id: pId(), slug: "portable-bluetooth-speaker", name: "Portable Bluetooth Speaker — Wander",
    brand: "Clarity", brandId: "clarity", category: "electronics", type: "physical",
    price: 129, salePrice: 109, rating: rating(4.0, 4.6), reviewCount: reviewCount(30, 80),
    images: ["https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg"],
    shortDescription: "Rugged, waterproof portable speaker with 360° sound and 20-hour battery life.",
    description: "The Wander speaker delivers big, room-filling 360° sound in a compact, go-anywhere design. IP67 rated against dust and water, it survives drops, dunks, and beach trips without missing a beat. The built-in loop attaches to backpacks, bike handles, or shower caddies. Pair two for stereo sound.",
    features: ["360° immersive sound", "IP67 dust and waterproof", "20-hour battery life", "Built-in carabiner loop", "True Wireless Stereo pairing", "Built-in microphone for calls"],
    stock: stock(15, 35), sku: sku("ELE", 2),
    tags: ["speaker", "bluetooth", "portable", "waterproof", "outdoor", "clarity"],
    barcode: "8712345678932",
    costPrice: 38, isNew: true,
    reviews: [
      { id: rId(), author: "Sam R.", rating: 5, title: "Tough and sounds incredible", body: "I've brought this on camping trips, to the beach, and even dropped it in a pool — still works perfectly. The sound is impressively loud and clear for its size. The battery genuinely lasts about 20 hours.", date: new Date(daysAgo(10)).toISOString(), verified: true, helpful: 14 },
    ],
    specs: [
      spec("Sound", "360°, 20W output"), spec("Waterproof", "IP67 (1m depth, 30 min)"),
      spec("Battery", "20 hours playtime"), spec("Charging", "USB-C, 3 hours full charge"),
      spec("Connectivity", "Bluetooth 5.2, range 30m"), spec("Dimensions", "18cm x 7cm diameter"),
    ],
    createdAt: daysAgo(35),
  },
  {
    id: pId(), slug: "smart-alarm-clock", name: "Smart Alarm Clock — Dawn Simulator",
    brand: "Clarity", brandId: "clarity", category: "electronics", type: "physical",
    price: 79, salePrice: null, rating: rating(4.1, 4.5), reviewCount: reviewCount(25, 60),
    images: ["https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg"],
    shortDescription: "Wake naturally with a simulated sunrise, wind-down sunset, and sleep sounds.",
    description: "The Dawn Simulator Smart Alarm Clock transforms your mornings with a gradual 30-minute sunrise simulation that gently wakes you with increasing light, followed by your choice of alarm sound or nature sounds. At night, a reverse sunset helps you wind down with warm amber light. Built-in sleep sounds (white noise, ocean, rain, forest) and a sleek, minimalist design.",
    features: ["30-minute sunrise simulation", "Sunset wind-down mode", "Built-in sleep sounds", "Adjustable brightness & color", "Dual USB charging ports", "AM/FM radio backup"],
    stock: stock(12, 28), sku: sku("ELE", 3),
    tags: ["alarm-clock", "dawn-simulator", "sleep", "wellness", "clarity"],
    costPrice: 25, featured: true,
    reviews: [
      { id: rId(), author: "Hannah W.", rating: 5, title: "Gentlest wake-up ever", body: "I didn't realize how jarring my phone alarm was until I started using this. The sunrise simulation is so natural — I often wake up before the sound even starts. The sunset mode has genuinely improved my evening wind-down routine.", date: new Date(daysAgo(28)).toISOString(), verified: true, helpful: 20 },
    ],
    specs: [
      spec("Light", "LED, 2700K-6500K adjustable"), spec("Sunrise", "30-minute gradual simulation"),
      spec("Sounds", "5 nature sounds, FM radio"), spec("Display", "Auto-dimming LED clock"),
      spec("Ports", "2x USB-A (2.4A each)"), spec("Dimensions", "18cm x 8cm x 12cm"),
    ],
    createdAt: daysAgo(60),
  },
  {
    id: pId(), slug: "premium-laptop-sleeve", name: "Premium Laptop Sleeve — Merino Wool",
    brand: "Wanderlust", brandId: "wanderlust", category: "electronics", type: "physical",
    price: 55, salePrice: null, rating: rating(4.0, 4.4), reviewCount: reviewCount(15, 35),
    images: ["https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg"],
    shortDescription: "Eco-friendly merino wool felt laptop sleeve with padded interior. Fits 13-14\" laptops.",
    description: "Crafted from compressed merino wool felt, this laptop sleeve provides natural impact and scratch protection without synthetic padding. The wool is naturally water-resistant, temperature-regulating, and sustainable. A soft microfiber interior prevents scratches, and the minimal design slides easily into any bag.",
    features: ["Compressed merino wool felt", "Natural impact protection", "Microfiber scratch-proof interior", "Fits 13-14\" laptops", "Slim, bag-friendly design", "Made from recycled wool fibers"],
    stock: stock(18, 40), sku: sku("ELE", 4),
    tags: ["laptop-sleeve", "merino-wool", "eco-friendly", "tech-accessories"],
    barcode: "8712345678934",
    costPrice: 16, isNew: true,
    reviews: [
      { id: rId(), author: "David C.", rating: 4, title: "Great quality, snug fit", body: "Lovely minimal design and the wool feels substantial. My MacBook Air fits perfectly — probably would be snug for a bulkier 14\" laptop. Adds protection without bulk.", date: new Date(daysAgo(8)).toISOString(), verified: true, helpful: 5 },
    ],
    specs: [
      spec("Material", "Compressed Merino Wool Felt"), spec("Interior", "Soft microfiber"),
      spec("Dimensions", "34cm x 25cm x 1.5cm"), spec("Fits", "13-14\" laptops (up to 32cm x 22cm)"),
      spec("Weight", "180g"), spec("Eco", "Made from 80% recycled wool fibers"),
    ],
    createdAt: daysAgo(20),
  },
];

/* ================================================================== */
/*  TRAVEL — 4 products                                                */
/* ================================================================== */

const travelProducts: ProductDef[] = [
  {
    id: pId(), slug: "carry-on-luggage-cabin", name: "Carry-On Luggage — Cabin Pro",
    brand: "Voya", brandId: "voya", category: "travel", type: "physical",
    price: 245, salePrice: 199, rating: rating(4.3, 4.8), reviewCount: reviewCount(50, 120),
    images: ["https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg", "https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg"],
    shortDescription: "Polycarbonate carry-on with YKK zippers, 360° spinner wheels, and TSA-approved lock.",
    description: "The Cabin Pro carry-on is built for the modern traveler who values durability without sacrificing style. The 100% polycarbonate shell is impact-resistant and lightweight at just 2.8kg. Features include smooth 360° dual spinner wheels, a telescopic handle with ergonomic grip, and a TSA-approved combination lock. Interior organization includes compression straps and a zippered divider.",
    features: ["100% polycarbonate shell", "YKK RC zippers throughout", "360° dual spinner wheels", "TSA-approved combination lock", "Compression strap system", "Weight: only 2.8kg (6.2lbs)"],
    stock: stock(10, 25), sku: sku("TRV", 1),
    tags: ["luggage", "carry-on", "travel", "polycarbonate", "cabin"],
    barcode: "8712345678941", asin: "B0EXAMPLE041",
    costPrice: 68, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Marcus W.", rating: 5, title: "Perfect carry-on companion", body: "Fits every airline sizer I've tried it on (Ryanair, EasyJet, Delta). Rolls incredibly smoothly even on carpet. After 15+ trips it still looks brand new — just a few minor scuffs on the corners.", date: new Date(daysAgo(60)).toISOString(), verified: true, helpful: 38 },
    ],
    specs: [
      spec("Material", "100% Polycarbonate"), spec("Weight", "2.8kg (6.2lbs)"),
      spec("Capacity", "38 liters"), spec("Dimensions", "55cm x 35cm x 22cm"),
      spec("Wheels", "4x dual spinner (360°)"), spec("Warranty", "5-year limited warranty"),
    ],
    createdAt: daysAgo(120),
  },
  {
    id: pId(), slug: "travel-organizer-cube-set", name: "Travel Organizer Cube Set — 5-Piece",
    brand: "Voya", brandId: "voya", category: "travel", type: "physical",
    price: 42, salePrice: 34, rating: rating(4.2, 4.7), reviewCount: reviewCount(35, 80),
    images: ["https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg"],
    shortDescription: "Ultralight ripstop nylon packing cubes in 5 sizes with compression zippers.",
    description: "Maximize your luggage space with this 5-piece packing cube set made from ultralight, water-repellent ripstop nylon. Each cube features a compression zipper that shrinks contents by up to 30%. The mesh tops allow visibility while keeping items secure. Set includes 2 small, 2 medium, and 1 large cube in coordinating colors.",
    features: ["Ultralight ripstop nylon", "Water-repellent coating", "Compression zipper (saves 30% space)", "Mesh top for visibility", "5 sizes: 2 small, 2 medium, 1 large", "Reinforced stitching throughout"],
    stock: stock(30, 70), sku: sku("TRV", 2),
    tags: ["packing-cubes", "travel-organization", "luggage-accessories", "voya"],
    costPrice: 10, bestSeller: true,
    reviews: [
      { id: rId(), author: "Emily K.", rating: 5, title: "Total game changer", body: "I used to just throw everything into my suitcase. These cubes have changed my travel life. Everything stays organized, I can find what I need instantly, and the compression zippers actually work — I fit a week's worth of clothes in a carry-on!", date: new Date(daysAgo(15)).toISOString(), verified: true, helpful: 24 },
    ],
    specs: [
      spec("Material", "Ripstop Nylon with water-repellent coating"), spec("Set Includes", "2 small (25x17cm), 2 medium (35x25cm), 1 large (45x30cm)"),
      spec("Compression", "Zip-compresses up to 30%"), spec("Weight", "Total: 180g"),
      spec("Closure", "YKK zippers"), spec("Care", "Spot clean, air dry"),
    ],
    createdAt: daysAgo(60),
  },
  {
    id: pId(), slug: "vegan-leather-passport-holder", name: "Vegan Leather Passport Holder & Travel Wallet",
    brand: "Ever & Oak", brandId: "ever-oak", category: "travel", type: "physical",
    price: 48, salePrice: null, rating: rating(4.0, 4.5), reviewCount: reviewCount(18, 45),
    images: ["https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg"],
    shortDescription: "Slim RFID-blocking passport holder with card slots, boarding pass pocket, and SIM slot.",
    description: "This slim travel wallet is designed to carry your passport, cards, boarding pass, and SIM card in one sleek package. Made from premium vegan leather with RFID-blocking technology to protect your personal information. The interior features 4 card slots, a full-length bill pocket, and a SIM card slot.",
    features: ["Premium vegan leather", "RFID-blocking lining", "4 card slots", "Full-length bill pocket", "Boarding pass pocket", "SIM card slot"],
    stock: stock(25, 55), sku: sku("TRV", 3),
    tags: ["passport-holder", "travel-wallet", "rfid", "vegan-leather", "ever-oak"],
    barcode: "8712345678943",
    costPrice: 14, featured: true,
    reviews: [
      { id: rId(), author: "Aisha N.", rating: 5, title: "Sleek and functional", body: "This holds everything I need for travel — passport, 4 cards, some cash, and my boarding pass. The RFID protection gives peace of mind. The vegan leather looks and feels premium.", date: new Date(daysAgo(22)).toISOString(), verified: true, helpful: 8 },
    ],
    specs: [
      spec("Material", "Premium Vegan Leather (PU)"), spec("RFID Protection", "Blocks 13.56MHz frequencies"),
      spec("Capacity", "1 passport, 4 cards, bills, boarding pass"), spec("Dimensions", "14cm x 10cm x 1cm (closed)"),
      spec("Weight", "85g"), spec("Colors", "Black, Cognac, Olive"),
    ],
    createdAt: daysAgo(45),
  },
  {
    id: pId(), slug: "travel-hammock-silk", name: "Travel Hammock — Silk Parachute",
    brand: "Wanderlust", brandId: "wanderlust", category: "travel", type: "physical",
    price: 65, salePrice: 52, rating: rating(4.1, 4.6), reviewCount: reviewCount(22, 55),
    images: ["https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg", "https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg"],
    shortDescription: "Ultralight ripstop silk hammock that packs to the size of a tennis ball. Includes tree straps.",
    description: "The Silk Parachute Hammock is made from ultra-strong, featherlight 20D ripstop silk — strong enough to hold 300kg yet compact enough to fit in your pocket. Packs down to just 12cm x 8cm (smaller than a tennis ball). Includes 2 tree-friendly polyester straps that protect bark and adjust from 6 to 15 feet. Perfect for camping, beach days, or park afternoons.",
    features: ["20D ripstop silk construction", "Packs to tennis-ball size", "300kg weight capacity", "Tree-friendly polyester straps", "Quick 2-minute setup", "Breathable, quick-drying fabric"],
    stock: stock(14, 30), sku: sku("TRV", 4),
    tags: ["hammock", "outdoor", "camping", "travel", "lightweight", "wanderlust"],
    costPrice: 18, isNew: true,
    reviews: [
      { id: rId(), author: "Zach B.", rating: 5, title: "Incredibly packable", body: "I take this everywhere — beach, camping, even just to the park. It packs so small I forget it's in my bag. The silk is surprisingly comfortable and doesn't stretch out over time like nylon hammocks.", date: new Date(daysAgo(12)).toISOString(), verified: true, helpful: 16 },
    ],
    specs: [
      spec("Material", "20D Ripstop Silk"), spec("Dimensions", "280cm x 140cm (open)"),
      spec("Packed Size", "12cm x 8cm (tennis ball size)"), spec("Weight", "280g (with straps)"),
      spec("Capacity", "Up to 300kg (660lbs)"), spec("Straps", "2x 3m polyester tree straps"),
    ],
    createdAt: daysAgo(30),
  },
];

/* ================================================================== */
/*  HEALTH — 4 products                                                */
/* ================================================================== */

const healthProducts: ProductDef[] = [
  {
    id: pId(), slug: "premium-yoga-mat", name: "Premium Yoga Mat — 6mm Cork",
    brand: "Wanderlust", brandId: "wanderlust", category: "health", type: "physical",
    price: 88, salePrice: 72, rating: rating(4.2, 4.7), reviewCount: reviewCount(45, 100),
    images: ["https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg", "https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg"],
    shortDescription: "Natural cork yoga mat with superior grip, antimicrobial surface, and alignment guides.",
    description: "Our 6mm cork yoga mat offers the perfect balance of cushioning and stability. The natural cork surface provides unmatched grip — the more you sweat, the grippier it gets. Cork is naturally antimicrobial and hypoallergenic. The base is natural tree rubber for excellent floor traction. Subtle alignment markings help you find your pose without looking.",
    features: ["Natural cork surface, rubber base", "Grip improves with moisture", "Naturally antimicrobial", "6mm thickness for comfort", "Subtle alignment markings", "Eco-friendly, biodegradable materials"],
    stock: stock(12, 30), sku: sku("HEA", 1),
    tags: ["yoga-mat", "cork", "eco-friendly", "fitness", "wellness"],
    barcode: "8712345678951",
    costPrice: 28, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Lily M.", rating: 5, title: "Best mat I've ever owned", body: "The cork grip is incredible — even in hot yoga class, my hands and feet stay planted. The alignment lines are subtle but helpful. And it doesn't have that horrible rubber smell that new mats usually have.", date: new Date(daysAgo(40)).toISOString(), verified: true, helpful: 32 },
    ],
    specs: [
      spec("Material", "Natural Cork top, Natural Tree Rubber base"), spec("Thickness", "6mm"),
      spec("Dimensions", "183cm x 61cm"), spec("Weight", "2.5kg"),
      spec("Features", "Alignment markings, antimicrobial"), spec("Care", "Wipe with damp cloth; avoid direct sunlight"),
    ],
    createdAt: daysAgo(100),
  },
  {
    id: pId(), slug: "resistance-bands-set", name: "Resistance Bands Set — 5 Levels",
    brand: "Wanderlust", brandId: "wanderlust", category: "health", type: "physical",
    price: 32, salePrice: null, rating: rating(4.0, 4.4), reviewCount: reviewCount(30, 65),
    images: ["https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg"],
    shortDescription: "Set of 5 fabric resistance bands from extra-light to extra-heavy with carrying pouch.",
    description: "This 5-band set covers every resistance level from extra-light (5lbs) to extra-heavy (50lbs). Unlike rubber bands, our fabric bands are woven from natural latex wrapped in soft, non-slip fabric — they won't roll, snap, or dig into your skin. Includes a cotton carrying pouch and exercise guide.",
    features: ["5 resistance levels: 5-50lbs", "Non-slip fabric exterior", "No rolling or snapping", "Natural latex core", "Cotton carrying pouch", "Beginner to advanced levels"],
    stock: stock(20, 50), sku: sku("HEA", 2),
    tags: ["resistance-bands", "fitness", "home-gym", "workout", "wanderlust"],
    costPrice: 8, bestSeller: true,
    reviews: [
      { id: rId(), author: "Ryan D.", rating: 4, title: "Great quality bands", body: "Much better than the rubber bands I used before — these actually stay in place during squats and don't pinch. The fabric feels durable. I wish the pouch was a bit bigger to fit all 5 bands comfortably.", date: new Date(daysAgo(18)).toISOString(), verified: true, helpful: 12 },
    ],
    specs: [
      spec("Set Includes", "5 bands + pouch + exercise guide"), spec("Resistance", "Extra Light (5lbs), Light (15lbs), Medium (25lbs), Heavy (35lbs), Extra Heavy (50lbs)"),
      spec("Material", "Natural latex core, woven fabric exterior"), spec("Dimensions", "30cm x 15cm (each band)"),
      spec("Care", "Wipe clean, store away from direct sunlight"), spec("Pouch", "100% cotton drawstring"),
    ],
    createdAt: daysAgo(50),
  },
  {
    id: pId(), slug: "essential-oil-diffuser", name: "Ultrasonic Essential Oil Diffuser — 300ml",
    brand: "Clarity", brandId: "clarity", category: "health", type: "physical",
    price: 44, salePrice: 36, rating: rating(4.1, 4.5), reviewCount: reviewCount(40, 90),
    images: ["https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg"],
    shortDescription: "Borosilicate glass ultrasonic diffuser with LED mood lighting and auto shut-off.",
    description: "This ultrasonic essential oil diffuser disperses a fine, cool mist of water and essential oils into the air, creating a calming atmosphere. The borosilicate glass water tank is easy to clean and crack-resistant. Features 7-color LED mood lighting with brightness control and 4 timer settings. Whisper-quiet operation makes it perfect for bedrooms and offices.",
    features: ["Ultrasonic cool-mist technology", "300ml borosilicate glass tank", "7-color LED mood light", "4 timer settings (1/3/6/continuous)", "Whisper-quiet (under 30dB)", "Auto shut-off when empty"],
    stock: stock(18, 40), sku: sku("HEA", 3),
    tags: ["diffuser", "essential-oils", "aromatherapy", "wellness", "clarity"],
    barcode: "8712345678953",
    costPrice: 12, featured: true,
    reviews: [
      { id: rId(), author: "Natalie F.", rating: 5, title: "Beautiful and calming", body: "The glass tank looks so much nicer than plastic diffusers. It's quiet enough for my nightstand and the mist is consistent. I use it with lavender oil every evening and it's become an essential part of my wind-down routine.", date: new Date(daysAgo(25)).toISOString(), verified: true, helpful: 18 },
    ],
    specs: [
      spec("Type", "Ultrasonic cool-mist"), spec("Tank Capacity", "300ml borosilicate glass"),
      spec("Coverage", "Up to 30m² (320 sq ft)"), spec("Run Time", "Up to 10 hours (intermittent)"),
      spec("Lighting", "7-color LED, adjustable brightness"), spec("Safety", "Auto shut-off when water runs out"),
    ],
    createdAt: daysAgo(70),
  },
  {
    id: pId(), slug: "insulated-water-bottle", name: "Insulated Water Bottle — 750ml",
    brand: "Wanderlust", brandId: "wanderlust", category: "health", type: "physical",
    price: 38, salePrice: null, rating: rating(4.1, 4.6), reviewCount: reviewCount(50, 110),
    images: ["https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg"],
    shortDescription: "Double-wall vacuum insulated bottle keeps drinks cold 24h / hot 12h. BPA-free.",
    description: "Built from 18/8 stainless steel with double-wall vacuum insulation, this water bottle keeps your beverages ice-cold for 24 hours or hot for 12 hours. The wide mouth makes for easy cleaning and adding ice cubes. The leak-proof bamboo lid doubles as a cup. The powder-coated exterior provides a grippy, durable finish that resists scratches.",
    features: ["18/8 stainless steel, BPA-free", "Double-wall vacuum insulation", "Cold 24h / Hot 12h", "Leak-proof bamboo cap/cup", "Wide mouth for ice & cleaning", "Powder-coated, scratch-resistant"],
    stock: stock(25, 60), sku: sku("HEA", 4),
    tags: ["water-bottle", "insulated", "stainless-steel", "eco-friendly", "wanderlust"],
    barcode: "8712345678954",
    costPrice: 10, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Chris B.", rating: 5, title: "Does exactly what it should", body: "Ice water was still cold after 20 hours in summer heat. The bamboo lid/cup is a clever touch. Doesn't sweat or leak. Great value for the quality.", date: new Date(daysAgo(20)).toISOString(), verified: true, helpful: 27 },
    ],
    specs: [
      spec("Material", "18/8 Stainless Steel (interior/exterior)"), spec("Capacity", "750ml (25 oz)"),
      spec("Insulation", "Double-wall vacuum (Cold 24h / Hot 12h)"), spec("Lid", "Bamboo cap with cup function"),
      spec("Weight", "340g"), spec("Dishwasher Safe", "Yes (top rack recommended)"),
    ],
    createdAt: daysAgo(80),
  },
];

/* ================================================================== */
/*  LIFESTYLE — 4 products                                             */
/* ================================================================== */

const lifestyleProducts: ProductDef[] = [
  {
    id: pId(), slug: "coffee-table-book-architecture", name: "Coffee Table Book — Spaces of Serenity",
    brand: "Ever & Oak", brandId: "ever-oak", category: "lifestyle", type: "physical",
    price: 55, salePrice: 44, rating: rating(4.3, 4.8), reviewCount: reviewCount(20, 50),
    images: ["https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg", "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg"],
    shortDescription: "A curated visual journey through 50 of the world's most serene architectural spaces.",
    description: "Spaces of Serenity is a stunning hardcover volume featuring 50 architectural spaces designed for peace and contemplation — from minimalist Japanese tea houses to light-filled Nordic cabins. Each space is captured through exquisite photography accompanied by thoughtful essays on the intersection of design and well-being. 240 pages of pure visual inspiration.",
    features: ["50 architectural spaces featured", "240 pages, hardcover", "Exceptional photography", "Thoughtful essays on design & wellness", "Premium matte paper stock", "Ribbon bookmark included"],
    stock: stock(15, 35), sku: sku("LIF", 1),
    tags: ["coffee-table-book", "architecture", "design", "interior", "gift-ideas"],
    barcode: "8712345678961",
    costPrice: 18, featured: true,
    reviews: [
      { id: rId(), author: "Olivia T.", rating: 5, title: "Absolutely stunning", body: "This book is as beautiful as the spaces it features. The photography is breathtaking and the essays add meaningful context. It's the centerpiece of our coffee table and every guest picks it up.", date: new Date(daysAgo(30)).toISOString(), verified: true, helpful: 14 },
    ],
    specs: [
      spec("Format", "Hardcover, 240 pages"), spec("Dimensions", "26cm x 30cm x 2.5cm"),
      spec("Paper", "150gsm matte art paper"), spec("Weight", "1.8kg"),
      spec("Features", "Ribbon bookmark, cloth-bound spine"), spec("ISBN", "978-0-123456-78-9"),
    ],
    createdAt: daysAgo(120),
  },
  {
    id: pId(), slug: "leather-bound-journal-set", name: "Leather-Bound Journal Set — 3-Piece",
    brand: "Ever & Oak", brandId: "ever-oak", category: "lifestyle", type: "physical",
    price: 42, salePrice: 34, rating: rating(4.0, 4.5), reviewCount: reviewCount(25, 55),
    images: ["https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Three vegan leather journals in A5, pocket, and mini sizes with 192 pages each.",
    description: "This journal set is designed for every aspect of your life — the A5 for daily journaling, the pocket size for on-the-go notes, and the mini for quick ideas and lists. Each journal features 192 pages of 100gsm fountain-pen-friendly paper, an elastic closure, and a ribbon bookmark. The vegan leather covers develop a natural patina over time.",
    features: ["3 sizes: A5, Pocket, Mini", "192 pages each, 100gsm paper", "Fountain pen friendly", "Vegan leather covers", "Elastic closures & ribbon bookmarks", "Expandable inner back pocket"],
    stock: stock(20, 45), sku: sku("LIF", 2),
    tags: ["journal", "notebook", "vegan-leather", "stationery", "ever-oak"],
    costPrice: 10, bestSeller: true,
    reviews: [
      { id: rId(), author: "Emma S.", rating: 5, title: "Beautiful quality", body: "The paper is thick enough for my fountain pens with no bleed-through. The set covers all my needs — the A5 for my main journal, pocket for work notes, and mini for grocery lists. Makes a wonderful gift too.", date: new Date(daysAgo(15)).toISOString(), verified: true, helpful: 11 },
    ],
    specs: [
      spec("Set Includes", "3 journals: A5 (148x210mm), Pocket (95x140mm), Mini (70x100mm)"), spec("Pages", "192 pages each, 100gsm cream paper"),
      spec("Binding", "Smyth-sewn, lays flat"), spec("Cover", "Premium vegan leather (PU)"),
      spec("Features", "Elastic closure, ribbon bookmark, expandable pocket"), spec("Paper Type", "Suitable for fountain pens, pencils, ballpoint"),
    ],
    createdAt: daysAgo(60),
  },
  {
    id: pId(), slug: "minimalist-desk-organizer", name: "Minimalist Desk Organizer — Walnut & Aluminum",
    brand: "Ever & Oak", brandId: "ever-oak", category: "lifestyle", type: "physical",
    price: 68, salePrice: null, rating: rating(4.0, 4.4), reviewCount: reviewCount(10, 30),
    images: ["https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "Modular desk organizer crafted from walnut wood and brushed aluminum with 6 compartments.",
    description: "Bring refined organization to your workspace with our modular desk organizer. The base is crafted from solid walnut wood with a natural oil finish, while the dividers are brushed aluminum with anodized finish. Six compartments accommodate pens, phones, paper clips, sticky notes, business cards, and more. Felt-lined bottom protects your desk surface.",
    features: ["Solid walnut base", "Brushed aluminum dividers", "6 modular compartments", "Felt-lined bottom", "Natural oil finish", "Heavy felt grip feet"],
    stock: stock(8, 22), sku: sku("LIF", 3),
    tags: ["desk-organizer", "walnut", "minimalist", "office", "ever-oak"],
    costPrice: 22, isNew: true,
    reviews: [
      { id: rId(), author: "Thomas K.", rating: 4, title: "Solid and beautiful", body: "The walnut is gorgeous and the aluminum dividers contrast perfectly. It's heavy and substantial, doesn't slide around. My only wish is that the pen compartment was a touch wider for thicker pens.", date: new Date(daysAgo(10)).toISOString(), verified: true, helpful: 5 },
    ],
    specs: [
      spec("Materials", "Solid Walnut, Brushed Aluminum"), spec("Dimensions", "28cm x 18cm x 8cm"),
      spec("Compartments", "6 (pens, phone, clips, notes, cards, miscellaneous)"), spec("Weight", "680g"),
      spec("Base", "Felt-lined bottom with grip feet"), spec("Finish", "Natural danish oil (walnut)"),
    ],
    createdAt: daysAgo(25),
  },
  {
    id: pId(), slug: "scented-candle-gift-set", name: "Scented Candle Gift Set — Miniatures (Set of 6)",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "lifestyle", type: "physical",
    price: 38, salePrice: 30, rating: rating(4.2, 4.7), reviewCount: reviewCount(28, 65),
    images: ["https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg", "https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg"],
    shortDescription: "Six miniature soy wax candles in curated fragrance collection. Perfect for gifting.",
    description: "Discover your signature scent with this collection of six miniature candles, each representing a different fragrance family from Atelier & Co. Includes: Amber & Sandalwood (warm woody), Wild Fig & Cassis (fruity gourmand), Linen & Cotton (clean fresh), Ebony & Spice (dark aromatic), Bergamot & Basil (citrus herbal), and Vanilla & Tonka (sweet comforting). Each burns for 12+ hours.",
    features: ["6 miniature candles, 12h burn each", "Curated fragrance journey", "100% natural soy wax", "Cotton wicks, phthalate-free", "Gift box packaging with scent guide", "Travel-friendly size (2.5 oz each)"],
    stock: stock(22, 50), sku: sku("LIF", 4),
    tags: ["candles", "gift-set", "miniature", "soy-wax", "fragrance", "attic", "gift-ideas"],
    barcode: "8712345678964",
    costPrice: 10, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Charlotte W.", rating: 5, title: "Perfect gift set", body: "Bought this as a gift for my sister-in-law but ended up keeping one for myself! The variety is fantastic — something for every mood. The packaging is beautiful, ready for gifting. Already bought another set as a hostess gift.", date: new Date(daysAgo(8)).toISOString(), verified: true, helpful: 19 },
    ],
    specs: [
      spec("Set Includes", "6 candles, 2.5 oz (71g) each"), spec("Fragrances", "Amber & Sandalwood, Wild Fig & Cassis, Linen & Cotton, Ebony & Spice, Bergamot & Basil, Vanilla & Tonka"),
      spec("Wax", "100% Natural Soy Wax"), spec("Wick", "Cotton-core, lead-free"),
      spec("Burn Time", "12+ hours each"), spec("Packaging", "Gift box with fragrance guide booklet"),
    ],
    createdAt: daysAgo(40),
  },
];

/* ================================================================== */
/*  FRAGRANCE — 4 products                                             */
/* ================================================================== */

const fragranceProducts: ProductDef[] = [
  {
    id: pId(), slug: "eau-de-parfum-amber-sandalwood", name: "Eau de Parfum — Amber & Sandalwood",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical",
    price: 128, salePrice: 108, rating: rating(4.3, 4.9), reviewCount: reviewCount(40, 90),
    images: ["https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg", "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg"],
    shortDescription: "A warm, seductive EDP with notes of amber, sandalwood, vanilla, and saffron.",
    description: "Our signature Amber & Sandalwood Eau de Parfum is a warm, enveloping fragrance that lingers beautifully throughout the day. Top notes of saffron and pink pepper give way to a heart of Bulgarian rose and orris butter, resting on a base of golden amber, Mysore sandalwood, and Madagascar vanilla. Expertly composed in Grasse, France.",
    features: ["Eau de Parfum concentration (18%)", "Longevity: 8-10 hours", "Composed in Grasse, France", "Responsibly sourced ingredients", "Iconic ribbed glass bottle", "Magnetic cap with leather accent"],
    stock: stock(10, 25), sku: sku("FRG", 1),
    tags: ["fragrance", "eau-de-parfum", "amber", "sandalwood", "unisex", "luxury"],
    barcode: "8712345678971", asin: "B0EXAMPLE071",
    costPrice: 32, featured: true, bestSeller: true,
    reviews: [
      { id: rId(), author: "Victoria L.", rating: 5, title: "Mesmerizing scent", body: "I receive compliments every single time I wear this. It's warm and sophisticated without being overpowering. The longevity is impressive — I can still smell it on my skin after 10 hours. The bottle is absolutely gorgeous too.", date: new Date(daysAgo(45)).toISOString(), verified: true, helpful: 42 },
      { id: rId(), author: "Marcus J.", rating: 5, title: "Perfect signature scent", body: "After searching for years for a signature scent, I've found it. The amber and sandalwood combination is timeless. Works equally well for day and evening. Worth every penny.", date: new Date(daysAgo(60)).toISOString(), verified: true, helpful: 28 },
    ],
    specs: [
      spec("Fragrance Family", "Warm Woody / Oriental"), spec("Concentration", "Eau de Parfum (18%)"),
      spec("Top Notes", "Saffron, Pink Pepper, Bergamot"), spec("Heart Notes", "Bulgarian Rose, Orris Butter, Jasmine"),
      spec("Base Notes", "Amber, Mysore Sandalwood, Madagascar Vanilla"), spec("Size", "50ml / 1.7 fl oz"),
    ],
    createdAt: daysAgo(200),
  },
  {
    id: pId(), slug: "room-spray-linen-cotton", name: "Room Spray — Linen & Cotton",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical",
    price: 34, salePrice: null, rating: rating(4.0, 4.5), reviewCount: reviewCount(15, 40),
    images: ["https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg"],
    shortDescription: "Fresh, clean room spray with notes of linen, cotton blossom, and white musk.",
    description: "Our Linen & Cotton Room Spray captures the feeling of sun-dried laundry on a summer breeze. Notes of fresh linen, cotton blossom, and clean white musk create an instant sense of calm and freshness. Perfect for linens, upholstery, or any living space. The fine mist nozzle delivers an even, delicate application.",
    features: ["Fine mist atomizer", "Fresh clean fragrance", "Linen, cotton blossom, white musk", "Safe for fabrics and linens", "200ml / 6.8 fl oz", "Lasts 3-4 hours per application"],
    stock: stock(20, 45), sku: sku("FRG", 2),
    tags: ["room-spray", "home-fragrance", "linen", "attic", "fresh"],
    costPrice: 8, isNew: true,
    reviews: [
      { id: rId(), author: "Alice B.", rating: 4, title: "Beautifully fresh", body: "Spray this on my bedding every morning and it instantly makes the bedroom feel like a luxury hotel. The scent is light and natural, not synthetic at all. Would love if it lasted a bit longer.", date: new Date(daysAgo(14)).toISOString(), verified: true, helpful: 8 },
    ],
    specs: [
      spec("Fragrance Profile", "Clean / Fresh / Light"), spec("Key Notes", "Linen, Cotton Blossom, White Musk, Aldehydes"),
      spec("Size", "200ml / 6.8 fl oz"), spec("Usage", "Spray 2-3 times into the air or onto fabrics"),
      spec("Longevity", "3-4 hours"), spec("Alcohol-Free", "Yes, water-based formula"),
    ],
    createdAt: daysAgo(30),
  },
  {
    id: pId(), slug: "solid-perfume-compact", name: "Solid Perfume Compact — Travel Size",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical",
    price: 28, salePrice: null, rating: rating(4.1, 4.6), reviewCount: reviewCount(22, 50),
    images: ["https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg"],
    shortDescription: "Concentrated solid perfume in a vintage-style compact. TSA-friendly and spill-proof.",
    description: "Our Solid Perfume Compact offers the same exquisite fragrances in a concentrated, portable format. The beeswax and jojoba oil base melts on contact with skin, releasing the fragrance gradually throughout the day. Perfect for travel (TSA-friendly), touch-ups on the go, or discreet application. Choose from Amber & Sandalwood or Wild Fig & Cassis.",
    features: ["Concentrated solid perfume", "Beeswax + jojoba oil base", "Vintage-style mirrored compact", "TSA-friendly, spill-proof", "6+ months of daily use", "Available in 2 signature scents"],
    stock: stock(25, 55), sku: sku("FRG", 3),
    tags: ["solid-perfume", "travel-size", "fragrance", "attic", "tsa-friendly"],
    barcode: "8712345678973",
    costPrice: 7, featured: true,
    reviews: [
      { id: rId(), author: "Nina T.", rating: 5, title: "Perfect for travel", body: "I keep this in my handbag for touch-ups throughout the day. The scent lasts about 4-5 hours on skin and the compact is so elegant. No worries about leaking in my bag. Great value for how long it lasts.", date: new Date(daysAgo(20)).toISOString(), verified: true, helpful: 14 },
    ],
    specs: [
      spec("Format", "Solid perfume in compact"), spec("Base", "Beeswax, Jojoba Oil, Coconut Oil"),
      spec("Fragrance Options", "Amber & Sandalwood, Wild Fig & Cassis"), spec("Size", "Compact: 5cm diameter, 12g net weight"),
      spec("Longevity", "4-6 hours on skin"), spec("TSA", "TSA-friendly under 3.4oz limit"),
    ],
    createdAt: daysAgo(45),
  },
  {
    id: pId(), slug: "fragrance-discovery-set", name: "Fragrance Discovery Set — 5 Iconic EDP Samples",
    brand: "Atelier & Co.", brandId: "atelier-co", category: "fragrance", type: "physical",
    price: 25, salePrice: null, rating: rating(4.2, 4.7), reviewCount: reviewCount(35, 70),
    images: ["https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg"],
    shortDescription: "Five 2ml EDP samples to discover your signature Atelier & Co. scent.",
    description: "Can't decide on a full bottle? Our Discovery Set lets you experience five of our most beloved fragrances: Amber & Sandalwood, Wild Fig & Cassis, Ebony & Spice, Bergamot & Basil, and Vanilla & Tonka. Each 2ml sample provides 10-15 wears, giving you time to fall in love. Fully redeemable toward your full-size purchase.",
    features: ["5 x 2ml EDP samples (10-15 wears each)", "Full discovery experience", "Redemption toward full bottle", "Premium box with fragrance notes", "Fragrance guide booklet", "Perfect introduction to the brand"],
    stock: stock(30, 70), sku: sku("FRG", 4),
    tags: ["fragrance", "discovery-set", "samples", "gift-ideas", "attic"],
    costPrice: 5, bestSeller: true,
    reviews: [
      { id: rId(), author: "Julia R.", rating: 5, title: "Best way to explore", body: "I bought this to try before committing to a full bottle and I'm so glad I did — I discovered Ebony & Spice which I wouldn't have chosen based on description alone but it's now my favorite. The redemption credit toward the full bottle makes this a no-brainer.", date: new Date(daysAgo(35)).toISOString(), verified: true, helpful: 22 },
    ],
    specs: [
      spec("Set Includes", "5 x 2ml EDP spray samples"), spec("Fragrances", "Amber & Sandalwood, Wild Fig & Cassis, Ebony & Spice, Bergamot & Basil, Vanilla & Tonka"),
      spec("Format", "Mini spray vials with atomizer"), spec("Usage", "Approx. 10-15 wears per sample"),
      spec("Redeemable", "Full purchase price credited toward 50ml EDP"), spec("Packaging", "Premium gift box with guide booklet"),
    ],
    createdAt: daysAgo(30),
  },
];

export const SEED_PRODUCTS: ProductDef[] = [
  ...homeProducts,
  ...kitchenProducts,
  ...beautyProducts,
  ...electronicsProducts,
  ...travelProducts,
  ...healthProducts,
  ...lifestyleProducts,
  ...fragranceProducts,
];

export const AFFILIATE_PRODUCT_IDS = [homeProducts[0].id, beautyProducts[0].id, electronicsProducts[0].id, travelProducts[0].id, fragranceProducts[0].id];
