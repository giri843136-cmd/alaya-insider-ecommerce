/**
 * ALAYA INSIDER — Seed Test Users
 * 8 users with different roles for the demo environment.
 */

import { v4 } from "uuid";
import { daysAgo, uid, avatar } from "./helpers.js";

export interface CustomerDef {
  id: string; name: string; email: string; password: string;
  phone?: string; country?: string; createdAt: number;
  lastLogin?: number; status: string;
  addresses: Array<{ id: string; label: string; name: string; line1: string; city: string; country: string; zip: string; phone?: string; }>;
  newsletter: boolean;
  timeline: Array<{ id: string; type: string; label: string; ts: number; meta?: string; }>;
  notes: Array<{ id: string; author: string; body: string; pinned: boolean; ts: number; }>;
  tasks: Array<{ id: string; title: string; type: string; assignee: string; dueDate?: number; priority: string; done: boolean; ts: number; }>;
  preferences?: Record<string, unknown>;
  loyaltyPoints?: number; storeCredit?: number; referralCode?: string;
}

function addr(label: string, line1: string, city: string, country: string, zip: string, phone?: string) {
  return { id: uid("addr"), label, name: "", line1, city, country, zip, phone };
}

function tle(type: string, label: string, ts: number, meta?: string) {
  return { id: uid("tl"), type, label, ts, meta };
}

/* ================================================================== */
/*  SEED CUSTOMERS                                                     */
/* ================================================================== */

export const SEED_CUSTOMERS: CustomerDef[] = [
  // 1. Guest User — browsing only
  {
    id: "cust_guest",
    name: "Guest Visitor",
    email: "guest@alayainsider.com",
    password: "",
    country: "United States",
    createdAt: daysAgo(60),
    status: "active",
    addresses: [],
    newsletter: false,
    timeline: [tle("account_created", "Account created", daysAgo(60))],
    notes: [],
    tasks: [],
    loyaltyPoints: 0, storeCredit: 0,
  },
  // 2. Regular Customer
  {
    id: "cust_isabella",
    name: "Isabella Moreau",
    email: "isabella@example.com",
    password: "password123",
    phone: "+1 (555) 123-4567",
    country: "United States",
    createdAt: daysAgo(120),
    lastLogin: daysAgo(2),
    status: "active",
    addresses: [
      addr("Home", "245 Park Avenue, Apt 4B", "New York", "United States", "10022", "+1 (555) 123-4567"),
      addr("Office", "60 Columbus Circle", "New York", "United States", "10023"),
    ],
    newsletter: true,
    timeline: [
      tle("account_created", "Account created", daysAgo(120)),
      tle("login", "Logged in", daysAgo(2)),
      tle("purchase", "Order #AL-481203 placed — $246.80", daysAgo(15), "246.80"),
      tle("wishlist_add", "Added Artisan Candle Trio to wishlist", daysAgo(5)),
      tle("review", "Left a 5-star review on Vitamin C Serum", daysAgo(20)),
    ],
    notes: [
      { id: uid("note"), author: "Admin", body: "VIP customer — frequently purchases beauty products. Consider for loyalty program.", pinned: true, ts: daysAgo(30) },
    ],
    tasks: [
      { id: uid("task"), title: "Follow up on recent order", type: "support", assignee: "Admin", dueDate: daysAgo(-3), priority: "medium", done: false, ts: daysAgo(7) },
    ],
    preferences: { favoriteBrands: ["nourish-bloom", "atelier-co"], favoriteCategories: ["beauty", "fragrance"], preferredTheme: "light", marketingOptIn: true },
    loyaltyPoints: 1840, storeCredit: 50, referralCode: "ALAYA-ISABELLA",
  },
  // 3. VIP Customer
  {
    id: "cust_vip_eleanor",
    name: "Eleanor Whitfield",
    email: "eleanor@example.com",
    password: "password123",
    phone: "+1 (555) 987-6543",
    country: "United States",
    createdAt: daysAgo(365),
    lastLogin: daysAgo(1),
    status: "vip",
    addresses: [
      addr("Home", "15 Beekman Place", "New York", "United States", "10022"),
      addr("Country Home", "42 Old Mill Road", "The Hamptons", "United States", "11937"),
    ],
    newsletter: true,
    timeline: [
      tle("account_created", "Account created", daysAgo(365)),
      tle("purchase", "Order #AL-780102 placed — $1,248.00", daysAgo(7), "1248.00"),
      tle("purchase", "Order #AL-654321 placed — $532.00", daysAgo(45), "532.00"),
      tle("purchase", "Order #AL-112233 placed — $890.00", daysAgo(90), "890.00"),
    ],
    notes: [
      { id: uid("note"), author: "Admin", body: "Top-tier customer, lifetime spend >$5,000. Send holiday gift.", pinned: true, ts: daysAgo(60) },
    ],
    tasks: [],
    preferences: { favoriteBrands: ["atelier-co", "lumina-home", "ever-oak"], favoriteCategories: ["fragrance", "home-living", "lifestyle"], preferredTheme: "dark", marketingOptIn: true },
    loyaltyPoints: 4500, storeCredit: 200, referralCode: "ALAYA-ELEANOR",
  },
  // 4. Editor role user
  {
    id: "cust_james",
    name: "James Hartley",
    email: "james.hartley@alayainsider.com",
    password: "editor123",
    phone: "+44 20 7123 4567",
    country: "United Kingdom",
    createdAt: daysAgo(180),
    lastLogin: daysAgo(3),
    status: "active",
    addresses: [addr("Office", "88 Soho Square", "London", "United Kingdom", "W1D 3PZ")],
    newsletter: true,
    timeline: [tle("account_created", "Editor account created", daysAgo(180)), tle("login", "Logged in from London", daysAgo(3))],
    notes: [],
    tasks: [
      { id: uid("task"), title: "Review draft article: Spring Skincare Guide", type: "marketing", assignee: "James Hartley", priority: "high", dueDate: daysAgo(-1), done: false, ts: daysAgo(5) },
    ],
    preferences: { favoriteBrands: ["nourish-bloom"], favoriteCategories: ["beauty", "lifestyle"], preferredTheme: "light", marketingOptIn: true },
    loyaltyPoints: 320, storeCredit: 0, referralCode: "ALAYA-JAMES",
  },
  // 5. Content Manager
  {
    id: "cust_sarah",
    name: "Sarah Chen",
    email: "sarah.chen@alayainsider.com",
    password: "content456",
    phone: "+1 (415) 555-8901",
    country: "United States",
    createdAt: daysAgo(240),
    lastLogin: daysAgo(1),
    status: "active",
    addresses: [addr("Office", "1 Market Street, Suite 300", "San Francisco", "United States", "94105")],
    newsletter: true,
    timeline: [tle("account_created", "Content Manager account created", daysAgo(240))],
    notes: [],
    tasks: [
      { id: uid("task"), title: "Approve buying guide: Best Ceramic Knives", type: "marketing", assignee: "Sarah Chen", priority: "high", dueDate: daysAgo(-2), done: true, ts: daysAgo(10) },
      { id: uid("task"), title: "Schedule 3 new product reviews for next week", type: "marketing", assignee: "Sarah Chen", priority: "medium", dueDate: daysAgo(-5), done: false, ts: daysAgo(7) },
    ],
    preferences: { favoriteBrands: [], favoriteCategories: ["kitchen", "home-living"], preferredTheme: "light", marketingOptIn: true },
    loyaltyPoints: 150, storeCredit: 0,
  },
  // 6. Affiliate Manager
  {
    id: "cust_marco",
    name: "Marco Rossi",
    email: "marco.rossi@alayainsider.com",
    password: "affiliate789",
    phone: "+39 06 1234 5678",
    country: "Italy",
    createdAt: daysAgo(300),
    lastLogin: daysAgo(5),
    status: "active",
    addresses: [addr("Office", "Via Condotti 88", "Rome", "Italy", "00187")],
    newsletter: false,
    timeline: [tle("account_created", "Affiliate Manager account created", daysAgo(300))],
    notes: [
      { id: uid("note"), author: "Admin", body: "Manages Amazon Associates and Impact partnerships. Strong performance.", pinned: true, ts: daysAgo(30) },
    ],
    tasks: [
      { id: uid("task"), title: "Review affiliate commission rates for Q2", type: "sales", assignee: "Marco Rossi", priority: "high", dueDate: daysAgo(7), done: false, ts: daysAgo(14) },
    ],
    preferences: { favoriteBrands: [], favoriteCategories: ["electronics", "travel"], preferredTheme: "dark", marketingOptIn: false },
    loyaltyPoints: 0, storeCredit: 0,
  },
  // 7. Administrator
  {
    id: "cust_admin",
    name: "Admin User",
    email: "alayainsider@gmail.com",
    password: "Alaya@1923",
    phone: "+91 8431364706",
    country: "India",
    createdAt: daysAgo(365),
    lastLogin: daysAgo(0),
    status: "active",
    addresses: [addr("Office", "12 MG Road, Indiranagar", "Bangalore", "India", "560038")],
    newsletter: false,
    timeline: [tle("account_created", "Administrator account created", daysAgo(365)), tle("login", "Admin login", daysAgo(0))],
    notes: [],
    tasks: [
      { id: uid("task"), title: "Review weekly analytics report", type: "reminder", assignee: "Admin", priority: "medium", dueDate: daysAgo(1), done: false, ts: daysAgo(3) },
    ],
    preferences: { favoriteBrands: [], favoriteCategories: [], preferredTheme: "dark", marketingOptIn: false },
    loyaltyPoints: 0, storeCredit: 0,
  },
  // 8. Additional customers for variety
  {
    id: "cust_meera",
    name: "Meera Iyer",
    email: "meera.iyer@example.com",
    password: "password123",
    phone: "+91 98765 43210",
    country: "India",
    createdAt: daysAgo(65),
    lastLogin: daysAgo(4),
    status: "active",
    addresses: [addr("Home", "42 Lavelle Road", "Bangalore", "India", "560001")],
    newsletter: true,
    timeline: [tle("account_created", "Account created", daysAgo(65)), tle("purchase", "Order #AL-481488 placed — $124.50", daysAgo(20), "124.50")],
    notes: [],
    tasks: [],
    preferences: { favoriteBrands: ["nourish-bloom", "clarity"], favoriteCategories: ["beauty", "health"], preferredTheme: "light", marketingOptIn: true },
    loyaltyPoints: 420, storeCredit: 0, referralCode: "ALAYA-MEERA",
  },
  {
    id: "cust_oliver",
    name: "Oliver Thorne",
    email: "oliver@example.com",
    password: "password123",
    phone: "+44 777 654 3210",
    country: "United Kingdom",
    createdAt: daysAgo(45),
    lastLogin: daysAgo(10),
    status: "active",
    addresses: [addr("Home", "5B Kensington High Street", "London", "United Kingdom", "W8 5NP")],
    newsletter: true,
    timeline: [tle("account_created", "Account created", daysAgo(45))],
    notes: [],
    tasks: [],
    preferences: { favoriteBrands: ["ever-oak"], favoriteCategories: ["lifestyle", "kitchen"], preferredTheme: "light", marketingOptIn: true },
    loyaltyPoints: 80, storeCredit: 0,
  },
];
