/**
 * ALAYA INSIDER — Seed Categories & Brands
 * 8 categories and 8 brands for the demo environment.
 */

/**
 * CATEGORIES
 */
export interface CatDef { id: string; name: string; tagline: string; description: string; image: string; }

export const SEED_CATEGORIES: CatDef[] = [
  {
    id: "home-living",
    name: "Home & Living",
    tagline: "Curated spaces, intentional living",
    description: "Transform your home into a sanctuary with our carefully curated collection of home decor, textiles, and decorative accents. From hand-poured candles to artisanal throws, each piece is selected for its craftsmanship and timeless appeal.",
    image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    tagline: "Tools for the art of cooking",
    description: "Elevate your culinary experience with premium kitchen essentials designed for both form and function. Our collection features handcrafted tools, artisanal serveware, and heirloom-quality pieces that make every meal a celebration.",
    image: "https://images.pexels.com/photos/994234/pexels-photo-994234.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "beauty",
    name: "Beauty",
    tagline: "Clean ingredients, radiant results",
    description: "Discover a curated edit of clean beauty essentials that nurture your skin and elevate your daily ritual. From potent serums to luxurious creams, each formula is thoughtfully crafted with active ingredients that deliver visible results.",
    image: "https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "electronics",
    name: "Electronics",
    tagline: "Smart design meets modern life",
    description: "Thoughtfully selected electronics that seamlessly integrate into your lifestyle. From premium audio to smart home essentials, we choose products that prioritize design, durability, and everyday functionality.",
    image: "https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "travel",
    name: "Travel",
    tagline: "Journey in style",
    description: "Everything you need for effortless travel, from durable luggage to clever organizers. Our travel collection combines style with functionality, ensuring you arrive wherever you're going looking and feeling your best.",
    image: "https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "health",
    name: "Health",
    tagline: "Wellness that fits your life",
    description: "Support your wellness journey with thoughtfully designed products that make healthy living achievable and enjoyable. From fitness essentials to recovery tools, we curate what you need to feel your best every day.",
    image: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    tagline: "The art of everyday living",
    description: "Celebrate the art of everyday living with our lifestyle collection. From beautiful stationery to thoughtful gifts, each piece is designed to bring more beauty, intention, and joy into your daily routines.",
    image: "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
  {
    id: "fragrance",
    name: "Fragrance",
    tagline: "Scents that tell a story",
    description: "Explore our collection of fine fragrances and home scents, each carefully composed to evoke memory, emotion, and a sense of place. From candlelit evenings to sun-drenched mornings, find your signature scent.",
    image: "https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=1000",
  },
];

/**
 * BRANDS
 */
export interface BrandDef {
  id: string; name: string; slug: string; tagline: string;
  description: string; image: string; logo?: string; website?: string;
  instagram?: string; country: string; featured?: boolean;
}

export const SEED_BRANDS: BrandDef[] = [
  {
    id: "atelier-co", name: "Atelier & Co.", slug: "atelier-co",
    tagline: "French-groomed luxury for body and home",
    description: "Born in a small apothecary in Provence, Atelier & Co. has been crafting exquisite fragrances and skincare since 2012. Each product is made in small batches using traditional French techniques and the finest natural ingredients.",
    image: "https://images.pexels.com/photos/965998/pexels-photo-965998.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://atelierco.example.com", instagram: "@atelier_co",
    country: "France", featured: true,
  },
  {
    id: "lumina-home", name: "Lumina Home", slug: "lumina-home",
    tagline: "Illuminate your world",
    description: "Lumina Home brings Scandinavian design sensibility to everyday living. From their studio in Copenhagen, they create homewares that marry clean lines with warmth, functionality with beauty.",
    image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://luminahome.example.com", instagram: "@lumina_home",
    country: "Denmark", featured: true,
  },
  {
    id: "voya", name: "Voya", slug: "voya",
    tagline: "Designed for the journey",
    description: "Voya creates travel essentials for the modern nomad. Every product is designed with input from frequent travelers to solve real problems — from maximizing carry-on space to staying organized on the go.",
    image: "https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://voya.example.com", instagram: "@voya_travel",
    country: "United States", featured: true,
  },
  {
    id: "terra-stone", name: "Terra & Stone", slug: "terra-stone",
    tagline: "Handcrafted from the earth",
    description: "Terra & Stone works directly with artisan communities in Portugal and Italy to create handcrafted ceramics, stoneware, and kitchen tools. Each piece tells a story of traditional craftsmanship passed down through generations.",
    image: "https://images.pexels.com/photos/2386142/pexels-photo-2386142.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://terrastone.example.com", instagram: "@terra_stone",
    country: "Portugal", featured: true,
  },
  {
    id: "clarity", name: "Clarity", slug: "clarity",
    tagline: "Clear thinking, clean design",
    description: "Clarity creates electronics and wellness products that enhance focus and well-being. Based in Berlin, their design philosophy centers on reducing clutter — both physical and digital — to create space for what matters.",
    image: "https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://clarity.example.com", instagram: "@clarity_berlin",
    country: "Germany", featured: false,
  },
  {
    id: "nourish-bloom", name: "Nourish & Bloom", slug: "nourish-bloom",
    tagline: "Clean beauty, conscious choices",
    description: "Nourish & Bloom is a clean beauty brand founded on the belief that what you put on your body matters as much as what you put in it. All products are formulated without parabens, sulfates, or synthetic fragrances.",
    image: "https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://nourishbloom.example.com", instagram: "@nourish_bloom",
    country: "United States", featured: true,
  },
  {
    id: "ever-oak", name: "Ever & Oak", slug: "ever-oak",
    tagline: "Rooted in quality",
    description: "Ever & Oak creates lifestyle goods designed to be cherished for years. From leather-bound journals to hand-finished desk accessories, each piece is crafted with sustainable materials and timeless design.",
    image: "https://images.pexels.com/photos/1122868/pexels-photo-1122868.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://everoak.example.com", instagram: "@ever_and_oak",
    country: "United Kingdom", featured: false,
  },
  {
    id: "wanderlust", name: "Wanderlust", slug: "wanderlust",
    tagline: "Adventure awaits",
    description: "Wanderlust makes premium gear for the modern explorer. Whether you're trekking through Patagonia or brunching in Brooklyn, their versatile products are designed to transition seamlessly from trail to table.",
    image: "https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=600",
    website: "https://wanderlust.example.com", instagram: "@wanderlust_gear",
    country: "United States", featured: false,
  },
];

export const CATEGORY_IDS = SEED_CATEGORIES.map(c => c.id);
export const BRAND_IDS = SEED_BRANDS.map(b => b.id);
