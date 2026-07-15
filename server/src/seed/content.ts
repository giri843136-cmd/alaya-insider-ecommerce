/**
 * ALAYA INSIDER — Seed Content
 * Articles, coupons, affiliates, orders, suppliers, and store data.
 */

import { daysAgo, hoursAgo, uid, ono, rtn, img } from "./helpers.js";

/* ================================================================== */
/*  ARTICLES                                                           */
/* ================================================================== */

export interface ArticleDef {
  id: string; slug: string; title: string; excerpt: string;
  body: string[]; cover: string; author: string; authorRole: string;
  category: string; tags: string[]; readMinutes: number;
  publishedAt: number; featured?: boolean;
}

export const SEED_ARTICLES: ArticleDef[] = [
  {
    id: uid("art"), slug: "spring-skincare-routine-2026",
    title: "The Ultimate Spring Skincare Routine — 2026 Edition",
    excerpt: "Transition your skincare from winter to spring with our expert-approved routine featuring lightweight textures and brightening ingredients.",
    body: [
      "As the seasons shift from winter's chill to spring's gentle warmth, your skincare routine deserves a refresh. The heavy balms and rich creams that protected your skin through winter can now be swapped for lighter, brighter formulations.",
      "The key to a successful spring transition lies in three pillars: gentle exfoliation to shed winter dullness, antioxidant protection to defend against increasing UV exposure, and lightweight hydration that won't feel heavy as temperatures rise.",
      "Start by introducing a gentle exfoliant like lactic acid or PHAs twice a week to reveal fresh, glowing skin beneath. Follow with our Vitamin C Brightening Serum — the gold-standard antioxidant that protects against environmental damage while visibly brightening hyperpigmentation.",
      "Swap your heavy night cream for a lightweight gel moisturizer or a hyaluronic acid serum that delivers deep hydration without the weight. Our Triple Weight Hyaluronic Acid Serum is perfect for this transition, delivering moisture at every layer of the skin.",
      "Don't forget — spring sunshine means higher UV exposure. Layer a weightless SPF 50 over your moisturizer every single day. Your future self will thank you.",
    ],
    cover: "https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    author: "Sarah Chen", authorRole: "Content Manager",
    category: "Beauty", tags: ["skincare", "spring", "routine", "vitamin-c", "hydration"],
    readMinutes: 5, publishedAt: daysAgo(7), featured: true,
  },
  {
    id: uid("art"), slug: "guide-to-ceramic-knives",
    title: "Everything You Need to Know About Ceramic Knives",
    excerpt: "Why professional chefs are switching to ceramic blades — and why you should too.",
    body: [
      "Ceramic knives have come a long way from their niche origins. Today, they're found in professional kitchens and home cookeries alike, prized for their exceptional sharpness and longevity.",
      "Made from zirconium dioxide — the same material used in dental implants and aerospace components — ceramic blades are second only to diamond in hardness. This means they hold their edge up to 10 times longer than traditional steel knives.",
      "One of the biggest advantages of ceramic is its chemical inertness. Unlike steel blades, which can react with acidic foods like tomatoes or citrus, ceramic won't transfer any metallic taste to your ingredients. Your fruits and vegetables taste exactly as they should.",
      "The main consideration with ceramic is brittleness. While incredibly hard, ceramic blades can chip if used to cut through bones, frozen foods, or if dropped on hard surfaces. Our Japanese Ceramic Knife Set uses advanced Zirconia 92 — the most durable ceramic available — to minimize this risk.",
      "Bottom line: for slicing, dicing, and precision cutting of fruits, vegetables, and boneless meats, ceramic is superior to steel in almost every way. Just treat them with care and they'll reward you with years of effortless cutting.",
    ],
    cover: "https://images.pexels.com/photos/2661468/pexels-photo-2661468.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    author: "James Hartley", authorRole: "Editor",
    category: "Kitchen", tags: ["knives", "ceramic", "cooking", "kitchen-tools", "buying-guide"],
    readMinutes: 6, publishedAt: daysAgo(14), featured: true,
  },
  {
    id: uid("art"), slug: "capsule-wardrobe-travel-essentials",
    title: "The Perfect Capsule Wardrobe for Spring Travel",
    excerpt: "Everything you need for a week-long trip that fits in a carry-on — with zero compromise on style.",
    body: [
      "The art of travel packing is about making smart choices — selecting pieces that work harder, mix effortlessly, and transition from day to night. Our carry-on challenge: one week, one destination, one perfectly packed suitcase.",
      "Start with a neutral color palette. When every piece coordinates with every other piece, you can create dozens of outfits from just 10-15 items. Think navy, camel, cream, olive, and denim — colors that travel well and hide wrinkles.",
      "The key investment pieces are a well-structured blazer, a versatile midi dress, quality denim, and a lightweight cashmere sweater. Round out with a silk scarf, leather belt, and minimalist jewelry to elevate any combination.",
      "Storage is everything. Our Travel Organizer Cube Set (5-piece) keeps your belongings sorted and maximizes every inch of your carry-on luggage. Use the compression zipper feature to save up to 30% space.",
      "With the right pieces and smart organization, you'll arrive at your destination looking polished, with everything you need — and nothing you don't. Happy travels!",
    ],
    cover: "https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    author: "Sarah Chen", authorRole: "Content Manager",
    category: "Travel", tags: ["travel", "packing", "capsule-wardrobe", "carry-on", "organization"],
    readMinutes: 4, publishedAt: daysAgo(10), featured: false,
  },
  {
    id: uid("art"), slug: "morning-yoga-routine-beginners",
    title: "A 10-Minute Morning Yoga Routine for Beginners",
    excerpt: "Start your day with intention using this gentle flow designed for all levels.",
    body: [
      "A consistent morning yoga practice doesn't require an hour of your time or years of experience. This 10-minute flow is designed for complete beginners and seasoned practitioners alike, requiring only a mat and an open mind.",
      "Begin in Child's Pose (Balasana) for 5 deep breaths. Kneel on your mat, sit back on your heels, and extend your arms forward. This gentle stretch releases tension in the back and shoulders accumulated during sleep.",
      "Transition to Cat-Cow (Marjaryasana-Bitilasana) for 5 rounds. On your inhale, drop your belly and lift your gaze. On your exhale, round your spine and tuck your chin. This warms up the spine and wakes up the nervous system.",
      "Come to a standing forward fold (Uttanasana) for 5 breaths. Let your head hang heavy, bend your knees as much as you need. Feel the release in your hamstrings and lower back.",
      "Flow through 3 Sun Salutations (Surya Namaskar A), moving with your breath. Don't worry about perfect alignment — focus on linking movement with breath. This builds heat, strengthens the body, and calms the mind.",
      "Finish in Savasana for 2 minutes. Lie flat on your back, arms at your sides, palms up. Close your eyes and simply observe your breath. This integration is the most important part of any practice.",
    ],
    cover: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    author: "James Hartley", authorRole: "Editor",
    category: "Health", tags: ["yoga", "morning-routine", "wellness", "meditation", "fitness"],
    readMinutes: 3, publishedAt: daysAgo(20), featured: false,
  },
  {
    id: uid("art"), slug: "scented-candle-buying-guide",
    title: "The Art of Home Fragrance — A Complete Guide to Scented Candles",
    excerpt: "From fragrance families to burn times, everything you need to choose the perfect candle.",
    body: [
      "A well-chosen candle transforms a house into a home. The right fragrance can evoke memories, set a mood, and create an atmosphere that words cannot capture. But with so many options, how do you choose?",
      "First, understand fragrance families. Woody scents (sandalwood, cedar, amber) create warmth and grounding. Floral scents (rose, jasmine, lavender) bring romance and softness. Fresh scents (linen, cotton, citrus) clean and energize. Gourmand scents (vanilla, fig, tonka) comfort and indulge.",
      "Consider the room. For living rooms, choose warm, welcoming scents like amber or sandalwood. For bedrooms, opt for calming lavender, chamomile, or clean linen. For kitchens and bathrooms, fresh citrus or herbal scents work beautifully.",
      "Wax quality matters. Soy wax burns cleaner and longer than paraffin, with no soot or harmful chemicals. Our Artisan Scented Candle Collection uses 100% natural soy wax with cotton wicks for the cleanest, longest burn possible.",
      "Safety first: always trim your wick to 1/4 inch before lighting, burn candles within sight, and never burn for more than 4 hours at a time. A properly cared-for candle will reward you with consistent fragrance and an even burn every time.",
    ],
    cover: "https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    author: "Sarah Chen", authorRole: "Content Manager",
    category: "Lifestyle", tags: ["candles", "home-fragrance", "buying-guide", "interior"],
    readMinutes: 5, publishedAt: daysAgo(25), featured: true,
  },
];

/* ================================================================== */
/*  COUPONS                                                            */
/* ================================================================== */

export interface CouponDef {
  id: string; code: string; type: string; value: number;
  minSpend: number; active: boolean; description: string;
  expiresAt?: number; usageLimit?: number; usedCount: number;
}

export const SEED_COUPONS: CouponDef[] = [
  { id: uid("cpn"), code: "WELCOME10", type: "percent", value: 10, minSpend: 0, active: true, description: "10% off your first order", usageLimit: 500, usedCount: 87 },
  { id: uid("cpn"), code: "INSIDER15", type: "percent", value: 15, minSpend: 200, active: true, description: "15% off orders over $200", usageLimit: 200, usedCount: 34 },
  { id: uid("cpn"), code: "FREESHIP", type: "fixed", value: 12, minSpend: 75, active: true, description: "Free shipping on orders over $75", usageLimit: 1000, usedCount: 312 },
  { id: uid("cpn"), code: "VIP20", type: "percent", value: 20, minSpend: 150, active: true, description: "VIP exclusive 20% off", usageLimit: 50, usedCount: 12 },
  { id: uid("cpn"), code: "BEAUTY25", type: "percent", value: 25, minSpend: 100, active: true, description: "25% off all beauty products", expiresAt: daysAgo(-30), usageLimit: 100, usedCount: 98 },
];

/* ================================================================== */
/*  AFFILIATE PARTNERS                                                */
/* ================================================================== */

export interface AffPartnerDef {
  id: string; name: string; url: string; commission: number; active: boolean;
}

export const SEED_AFFILIATES: AffPartnerDef[] = [
  { id: uid("aff"), name: "Amazon Associates", url: "https://amazon.com", commission: 6.0, active: true },
  { id: uid("aff"), name: "Impact Radius", url: "https://impact.com", commission: 8.5, active: true },
  { id: uid("aff"), name: "CJ Affiliate", url: "https://cj.com", commission: 7.0, active: true },
  { id: uid("aff"), name: "Awin", url: "https://awin.com", commission: 7.5, active: true },
  { id: uid("aff"), name: "ShareASale", url: "https://shareasale.com", commission: 6.5, active: false },
];

/* ================================================================== */
/*  SUPPLIERS                                                          */
/* ================================================================== */

export interface SupplierDef {
  id: string; name: string; email: string; country: string;
  priority: number; active: boolean; handlingDays: number; notes?: string;
}

export const SEED_SUPPLIERS: SupplierDef[] = [
  { id: "sup_pt", name: "Lusitana Ware", email: "orders@lusitana.pt", country: "Portugal", priority: 1, active: true, handlingDays: 3, notes: "Ceramics and textiles — high quality, reliable" },
  { id: "sup_it", name: "Artigiano Italiano SRL", email: "orders@artigiano.it", country: "Italy", priority: 2, active: true, handlingDays: 4, notes: "Glassware and leather goods" },
  { id: "sup_fr", name: "Maison de Provence", email: "orders@maison-provence.fr", country: "France", priority: 1, active: true, handlingDays: 3, notes: "Fragrance and skincare — premium partner" },
  { id: "sup_cn", name: "Shenzen Elite Manufacturing", email: "orders@elite-mfg.cn", country: "China", priority: 3, active: true, handlingDays: 10, notes: "Electronics and accessories — longer lead times" },
  { id: "sup_us", name: "American Craft Supply", email: "info@americancraft.com", country: "United States", priority: 1, active: true, handlingDays: 2, notes: "Domestic shipping — fastest turnaround" },
  { id: "sup_dk", name: "Nordic Home Goods", email: "orders@nordichome.dk", country: "Denmark", priority: 2, active: true, handlingDays: 5, notes: "Home goods and textiles" },
  { id: "sup_jp", name: "Kyoto Precision Crafts", email: "orders@kyotocrafts.jp", country: "Japan", priority: 1, active: true, handlingDays: 7, notes: "Ceramic knives — premium quality" },
  { id: "sup_uk", name: "British Heritage Goods", email: "orders@britishheritage.co.uk", country: "United Kingdom", priority: 2, active: true, handlingDays: 3, notes: "Lifestyle and stationery" },
];

/* ================================================================== */
/*  ORDERS                                                             */
/* ================================================================== */

export interface OrderDef {
  id: string; number: string;
  items: Array<{ productId: string; name: string; image: string; price: number; qty: number; }>;
  subtotal: number; discount: number; shipping: number; tax: number;
  total: number; currency: string; couponCode?: string; paymentMethod?: string;
  trackingNumber?: string; courier?: string;
  customer: { name: string; email: string; address?: string; city?: string; country?: string; zip?: string; };
  status: string; createdAt: number;
}

export const SEED_ORDERS: OrderDef[] = [
  {
    id: uid("ord"), number: ono(),
    items: [
      { productId: "prod_placeholder", name: "Artisan Scented Candle Collection — Trio", image: img(965998, 300, 300), price: 54, qty: 1 },
      { productId: "prod_placeholder", name: "Vitamin C Brightening Serum", image: img(3738343, 300, 300), price: 46, qty: 2 },
      { productId: "prod_placeholder", name: "Cleansing Balm", image: img(3738343, 300, 300), price: 34, qty: 1 },
    ],
    subtotal: 180, discount: 18, shipping: 0, tax: 12.96,
    total: 174.96, currency: "USD", couponCode: "WELCOME10", paymentMethod: "Credit Card",
    trackingNumber: "1Z999AA10123456784", courier: "UPS",
    customer: { name: "Isabella Moreau", email: "isabella@example.com", address: "245 Park Avenue, Apt 4B", city: "New York", country: "United States", zip: "10022" },
    status: "delivered", createdAt: daysAgo(15),
  },
  {
    id: uid("ord"), number: ono(),
    items: [
      { productId: "prod_placeholder", name: "Eau de Parfum — Amber & Sandalwood", image: img(965998, 300, 300), price: 108, qty: 1 },
      { productId: "prod_placeholder", name: "Fragrance Discovery Set", image: img(965998, 300, 300), price: 25, qty: 1 },
    ],
    subtotal: 133, discount: 0, shipping: 12, tax: 11.60,
    total: 156.60, currency: "USD", paymentMethod: "PayPal",
    trackingNumber: "9400111899223456789012", courier: "USPS",
    customer: { name: "Eleanor Whitfield", email: "eleanor@example.com", address: "15 Beekman Place", city: "New York", country: "United States", zip: "10022" },
    status: "shipped", createdAt: daysAgo(7),
  },
  {
    id: uid("ord"), number: ono(),
    items: [
      { productId: "prod_placeholder", name: "Lambswool Throw Blanket", image: img(1571460, 300, 300), price: 145, qty: 1 },
      { productId: "prod_placeholder", name: "Crystal Wine Decanter", image: img(262917, 300, 300), price: 78, qty: 1 },
    ],
    subtotal: 223, discount: 33.45, shipping: 0, tax: 15.16,
    total: 204.71, currency: "USD", couponCode: "INSIDER15", paymentMethod: "Credit Card",
    customer: { name: "Eleanor Whitfield", email: "eleanor@example.com", address: "42 Old Mill Road", city: "The Hamptons", country: "United States", zip: "11937" },
    status: "processing", createdAt: daysAgo(3),
  },
  {
    id: uid("ord"), number: ono(),
    items: [
      { productId: "prod_placeholder", name: "Retinol Night Cream", image: img(3738343, 300, 300), price: 60, qty: 1 },
      { productId: "prod_placeholder", name: "Hyaluronic Acid Plumping Serum", image: img(3738343, 300, 300), price: 46, qty: 1 },
    ],
    subtotal: 106, discount: 0, shipping: 12, tax: 9.44,
    total: 127.44, currency: "USD", paymentMethod: "UPI",
    customer: { name: "Meera Iyer", email: "meera.iyer@example.com", address: "42 Lavelle Road", city: "Bangalore", country: "India", zip: "560001" },
    status: "pending", createdAt: daysAgo(1),
  },
  {
    id: uid("ord"), number: ono(),
    items: [
      { productId: "prod_placeholder", name: "Wireless Noise-Cancelling Earbuds", image: img(577769, 300, 300), price: 169, qty: 1 },
    ],
    subtotal: 169, discount: 0, shipping: 12, tax: 14.48,
    total: 195.48, currency: "USD", paymentMethod: "Apple Pay",
    customer: { name: "Oliver Thorne", email: "oliver@example.com", address: "5B Kensington High Street", city: "London", country: "United Kingdom", zip: "W8 5NP" },
    status: "paid", createdAt: hoursAgo(12),
  },
];

/* ================================================================== */
/*  REFUNDS / RETURNS                                                 */
/* ================================================================== */

export interface ReturnDef {
  id: string; number: string; orderId: string; orderNumber: string;
  customer: { name: string; email: string; };
  type: string; reason: string; comment?: string;
  status: string; refundAmount?: number; createdAt: number;
}

export const SEED_RETURNS: ReturnDef[] = [
  {
    id: uid("ret"), number: rtn(), orderId: "", orderNumber: "AL-481203",
    customer: { name: "Isabella Moreau", email: "isabella@example.com" },
    type: "refund", reason: "Item arrived with damaged packaging", comment: "The candle box was crushed during shipping. Contents seem fine but packaging was damaged.",
    status: "completed", refundAmount: 15, createdAt: daysAgo(10),
  },
];

/* ================================================================== */
/*  POPUPS                                                             */
/* ================================================================== */

export interface PopupDef {
  id: string; name: string; type: string; trigger: string;
  headline: string; body: string; ctaLabel: string; ctaLink?: string;
  couponCode?: string; triggerValue?: number;
  active: boolean; views: number; conversions: number;
}

export const SEED_POPUPS: PopupDef[] = [
  {
    id: uid("pop"), name: "Welcome Newsletter", type: "newsletter", trigger: "time",
    headline: "Join the Inner Circle",
    body: "Subscribe for exclusive access to new collections, early sale previews, and 10% off your first order.",
    ctaLabel: "Subscribe & Save", couponCode: "WELCOME10", triggerValue: 10,
    active: true, views: 1240, conversions: 312,
  },
  {
    id: uid("pop"), name: "Spring Sale Exit", type: "promo", trigger: "exit_intent",
    headline: "Wait! Don't Miss Our Spring Refresh",
    body: "Enjoy 15% off sitewide with code SPRING15 — but hurry, this offer won't last.",
    ctaLabel: "Shop Now", ctaLink: "/shop", couponCode: "SPRING15",
    active: true, views: 890, conversions: 68,
  },
  {
    id: uid("pop"), name: "Free Shipping Announcement", type: "announcement", trigger: "scroll",
    headline: "Free Shipping on Orders $150+",
    body: "Complimentary standard shipping on every order over $150. No code needed — automatically applied at checkout.",
    ctaLabel: "Start Shopping", ctaLink: "/shop", triggerValue: 50,
    active: true, views: 2100, conversions: 420,
  },
];

/* ================================================================== */
/*  LOYALTY TIERS                                                     */
/* ================================================================== */

export interface LoyaltyTierDef {
  id: string; name: string; minPoints: number; perk: string;
}

export const SEED_LOYALTY_TIERS: LoyaltyTierDef[] = [
  { id: uid("lty"), name: "Insider", minPoints: 0, perk: "Early access to new arrivals" },
  { id: uid("lty"), name: "Silver", minPoints: 500, perk: "Free standard shipping + early access" },
  { id: uid("lty"), name: "Gold", minPoints: 1500, perk: "Free express shipping, early access, birthday gift" },
  { id: uid("lty"), name: "VIP Atelier", minPoints: 4000, perk: "Complimentary overnight shipping, exclusive events, personal stylist" },
];

/* ================================================================== */
/*  LIVE SALES NOTIFICATIONS                                          */
/* ================================================================== */

export interface LiveSaleDef {
  id: string; customerName: string; city: string;
  country: string; productId: string; minutesAgo: number;
}

export const SEED_LIVE_SALES: LiveSaleDef[] = [
  { id: uid("ls"), customerName: "Emma L.", city: "Melbourne", country: "Australia", productId: "", minutesAgo: 3 },
  { id: uid("ls"), customerName: "James W.", city: "London", country: "United Kingdom", productId: "", minutesAgo: 8 },
  { id: uid("ls"), customerName: "Sophia R.", city: "Paris", country: "France", productId: "", minutesAgo: 15 },
  { id: uid("ls"), customerName: "Aiden K.", city: "Toronto", country: "Canada", productId: "", minutesAgo: 22 },
  { id: uid("ls"), customerName: "Mia S.", city: "Berlin", country: "Germany", productId: "", minutesAgo: 30 },
];

/* ================================================================== */
/*  SETTINGS ENRICHMENT                                               */
/* ================================================================== */

export const SEED_SETTINGS_EXTRA = {
  tagline: "Premium Editorial Shopping — Curated by Experts",
  description: "ALAYA INSIDER discovers and curates the finest products from around the world. From artisanal home goods to clean beauty essentials, every piece is selected for its quality, craftsmanship, and story.",
  contactEmail: "hello@alayainsider.com",
  supportEmail: "support@alayainsider.com",
  contactPhone: "+1 (212) 555-0198",
  address: "200 Park Avenue South, Suite 1500, New York, NY 10003",
  social: {
    instagram: "https://instagram.com/alayainsider",
    pinterest: "https://pinterest.com/alayainsider",
    tiktok: "https://tiktok.com/@alayainsider",
    youtube: "https://youtube.com/@alayainsider",
    x: "https://x.com/alayainsider",
  },
  seo: {
    title: "ALAYA INSIDER — Premium Editorial Shopping | Curated Home, Beauty & Lifestyle",
    description: "Discover the finest curated products from around the world. Artisanal home goods, clean beauty, premium kitchen tools, and intentional lifestyle essentials — all selected by our experts.",
    keywords: "premium shopping, curated products, home decor, beauty products, kitchen tools, lifestyle goods, artisan, editorial shopping, ALAYA INSIDER",
    ogImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=630",
    twitterHandle: "@alayainsider",
  },
  adminPassword: "Alaya@1923",
};

/* ================================================================== */
/*  HERO SLIDES                                                       */
/* ================================================================== */

export interface HeroSlideDef {
  id: string; eyebrow: string; title: string; highlight?: string;
  description: string; image: string; ctaLabel: string; ctaLink: string;
  cta2Label?: string; cta2Link?: string; align?: "left" | "center" | "right";
}

export const SEED_HERO_SLIDES: HeroSlideDef[] = [
  {
    id: "hero_spring", eyebrow: "Spring 2026 Collection",
    title: "A Fresh Chapter in",
    highlight: "Thoughtful Living",
    description: "Discover our curated Spring Collection — where clean lines meet warm textures, and every piece tells a story of artisanal craftsmanship.",
    image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    ctaLabel: "Shop the Collection", ctaLink: "/shop",
    cta2Label: "Read Our Journal", cta2Link: "/journal",
    align: "left",
  },
  {
    id: "hero_beauty", eyebrow: "Clean Beauty Edit",
    title: "Radiant Skin",
    highlight: "Starts Here",
    description: "Our clean beauty collection harnesses the power of active ingredients — formulated without compromise, for results you can see and feel.",
    image: "https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    ctaLabel: "Explore Beauty", ctaLink: "/shop?category=beauty",
    align: "right",
  },
  {
    id: "hero_travel", eyebrow: "Weekend Escape",
    title: "Pack Light,",
    highlight: "Travel Far",
    description: "From cabin-ready luggage to smart organizers — everything you need for effortless travel, designed for the modern journey.",
    image: "https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900",
    ctaLabel: "Shop Travel", ctaLink: "/shop?category=travel",
    align: "center",
  },
];
