/**
 * ALAYA INSIDER — Enterprise Customer Experience Platform (PART 2.11)
 * =====================================================================
 * Centralized customer intelligence system: Customer 360 profiles,
 * behavior tracking, preferences, segmentation, scoring, recommendation
 * engine, AI personalization, journey builder, feedback/sentiment,
 * import/export, and customer analytics dashboard.
 *
 * Integrates with: types.ts, store (via StoreContext), analytics.ts,
 * intelligence.ts, businessIntelligence.ts, commerce.ts, workflowsBpm.ts
 */
import { uid } from "./utils";
import { pushLog, type LogSource } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const CX_STORAGE_KEY = "alaya_cx_store";
export const MAX_CX_EVENTS = 50000;
export const MAX_SEGMENTS = 100;
export const MAX_JOURNEYS = 50;

/* ================================================================== */
/*  TYPES — Core Customer Profile                                       */
/* ================================================================== */

export type CxProfileType = "guest" | "registered" | "premium" | "vip";
export type CxCustomerStatus = "active" | "inactive" | "dormant" | "churned" | "blocked";
export type CxDeviceType = "desktop" | "mobile" | "tablet" | "smart_tv" | "other";
export type CxLocationPreference = "storefront" | "app" | "social" | "email" | "affiliate";

export interface CxCustomerProfile {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  type: CxProfileType;
  status: CxCustomerStatus;
  language: string;
  currency: string;
  timezone: string;
  country?: string;
  city?: string;
  createdAt: number;
  lastActiveAt: number;
  lastPurchaseAt?: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lifetimePoints: number;
  currentPoints: number;
  storeCredit: number;
  referralCode: string;
  tags: string[];
  notes: string;
  // Preferences
  preferences: CxCustomerPreferences;
  // Enriched data
  segments: string[];
  scores: CxCustomerScores;
  // AI enrichment
  aiSummary?: string;
  aiPersona?: string;
  aiChurnRisk?: number;
  aiNextBestAction?: string;
}

export interface CxCustomerPreferences {
  favoriteBrands: string[];
  favoriteCategories: string[];
  favoriteProducts: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  budgetLevel: "budget" | "mid_range" | "premium" | "luxury";
  styleTags: string[];
  sizes: string[];
  colors: string[];
  materials: string[];
  communicationChannels: ("email" | "sms" | "push" | "in_app")[];
  marketingOptIn: boolean;
  newsletterFrequency: "daily" | "weekly" | "monthly" | "never";
  preferredTheme: "light" | "dark" | "system";
  privacyMode: boolean;
  shareDataWithAffiliates: boolean;
}

export interface CxCustomerScores {
  engagement: number; // 0-100
  loyalty: number; // 0-100
  purchase: number; // 0-100
  intent: number; // 0-100
  risk: number; // 0-100 (higher = riskier)
  lifetimeValue: number; // monetary estimate
  health: number; // 0-100 composite
  recency: number; // 0-100
  frequency: number; // 0-100
  monetary: number; // 0-100
  churnProbability: number; // 0-1
  nextPurchaseProbability: number; // 0-1
}

export interface CxCustomerAddress {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  zip: string;
  phone?: string;
  isDefault: boolean;
  type: "shipping" | "billing" | "both";
}

/* ================================================================== */
/*  TYPES — Behavior & Events                                           */
/* ================================================================== */

export type CxEventType =
  | "page_view" | "product_view" | "category_view" | "search"
  | "add_to_cart" | "remove_from_cart" | "view_cart"
  | "checkout_start" | "checkout_step" | "checkout_complete"
  | "purchase" | "refund" | "order_cancelled"
  | "add_to_wishlist" | "remove_from_wishlist"
  | "add_to_compare" | "remove_from_compare"
  | "review_written" | "review_voted"
  | "question_asked" | "question_answered"
  | "newsletter_signup" | "newsletter_unsubscribe"
  | "email_open" | "email_click" | "email_bounce"
  | "push_open" | "push_click"
  | "login" | "logout" | "register"
  | "profile_update" | "address_add" | "address_update"
  | "coupon_used" | "coupon_earned"
  | "referral_click" | "referral_signup" | "referral_purchase"
  | "affiliate_click" | "affiliate_conversion"
  | "support_ticket_create" | "support_ticket_resolve"
  | "survey_response" | "feedback_submitted"
  | "ai_interaction" | "recommendation_click" | "recommendation_dismiss"
  | "live_chat_start" | "live_chat_end"
  | "session_start" | "session_end"
  | "abandoned_cart" | "cart_recovered"
  | "price_drop_alert" | "back_in_stock_alert"
  | "custom";

export interface CxEvent {
  id: string;
  customerId: string;
  sessionId: string;
  type: CxEventType;
  timestamp: number;
  page?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  data: Record<string, string | number | boolean>;
  properties: Record<string, string>;
  duration?: number; // ms spent
  metadata: Record<string, string>;
}

export interface CxSession {
  id: string;
  customerId: string;
  startedAt: number;
  endedAt?: number;
  duration?: number;
  device: CxDeviceType;
  browser: string;
  os: string;
  ip: string;
  country: string;
  city: string;
  referrer: string;
  landingPage: string;
  exitPage?: string;
  pageViews: number;
  events: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

/* ================================================================== */
/*  TYPES — Customer Timeline & Journey                                 */
/* ================================================================== */

export interface CxTimelineEntry {
  id: string;
  customerId: string;
  type: CxEventType;
  label: string;
  description: string;
  timestamp: number;
  channel: string;
  severity: "info" | "warning" | "success" | "error";
  metadata: Record<string, string>;
}

export interface CxJourney {
  id: string;
  name: string;
  description: string;
  type: "onboarding" | "retention" | "reactivation" | "upsell" | "cross_sell" | "custom";
  trigger: CxJourneyTrigger;
  steps: CxJourneyStep[];
  conditions: CxJourneyCondition[];
  audience: string[]; // segment IDs
  analytics: CxJourneyAnalytics;
  status: "draft" | "active" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
}

export interface CxJourneyTrigger {
  type: "event" | "schedule" | "segment_change" | "score_change" | "manual";
  eventType?: CxEventType;
  scheduleCron?: string;
  delayMinutes: number;
  cooldownDays: number;
  maxPerCustomer: number;
}

export interface CxJourneyStep {
  id: string;
  order: number;
  type: "email" | "sms" | "push" | "in_app" | "webhook" | "assign_tag" | "update_score" | "add_to_segment" | "remove_from_segment" | "delay" | "condition" | "exit";
  config: Record<string, string>;
  delayMinutes: number;
  conditionExpression?: string;
  metadata: Record<string, string>;
}

export interface CxJourneyCondition {
  field: string;
  operator: "equals" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: string;
}

export interface CxJourneyAnalytics {
  totalEntered: number;
  totalCompleted: number;
  totalExited: number;
  totalConverted: number;
  conversionRate: number;
  averageCompletionMinutes: number;
  stepBreakdown: { stepId: string; entered: number; completed: number; dropped: number }[];
}

/* ================================================================== */
/*  TYPES — Customer Segments                                           */
/* ================================================================== */

export type CxSegmentType = "rule_based" | "ai" | "behavior" | "marketing" | "affiliate" | "vip" | "loyalty" | "custom";
export type CxSegmentCriteriaType =
  | "total_spent" | "order_count" | "last_purchase" | "registration_date"
  | "loyalty_points" | "store_credit" | "country" | "language" | "currency"
  | "favorite_brand" | "favorite_category" | "price_range"
  | "engagement_score" | "loyalty_score" | "health_score"
  | "churn_risk" | "predicted_ltv" | "next_purchase_probability"
  | "device_type" | "utm_source" | "email_engagement"
  | "has_purchased" | "has_reviewed" | "has_refunded" | "is_affiliate"
  | "has_abandoned_cart" | "tag" | "custom";

export interface CxSegment {
  id: string;
  name: string;
  description: string;
  type: CxSegmentType;
  color: string;
  icon: string;
  criteria: CxSegmentCriteria[];
  memberCount: number;
  estimatedRevenue: number;
  createdAt: number;
  updatedAt: number;
  status: "active" | "draft" | "archived";
  isDynamic: boolean;
}

export interface CxSegmentCriteria {
  field: CxSegmentCriteriaType;
  operator: "equals" | "not_equals" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "between" | "contains" | "exists" | "not_exists";
  value: string;
}

/* ================================================================== */
/*  TYPES — Recommendation Engine                                       */
/* ================================================================== */

export type CxRecommendationStrategy = "collaborative" | "content_based" | "hybrid" | "popular" | "trending" | "frequently_bought_together" | "also_viewed" | "personalized";
export type CxRecommendationPlacement = "homepage" | "product_page" | "cart" | "checkout" | "email" | "search" | "category" | "notification";

export interface CxRecommendation {
  productId: string;
  score: number;
  reason: string;
  strategy: CxRecommendationStrategy;
  position: number;
}

export interface CxRecommendationModel {
  id: string;
  name: string;
  strategy: CxRecommendationStrategy;
  placements: CxRecommendationPlacement[];
  maxResults: number;
  minScore: number;
  boostRecent: boolean;
  boostCategory: boolean;
  boostBrand: boolean;
  excludePurchased: boolean;
  excludeViewed: boolean;
  freshnessDays: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CxRecommendationAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  clickThroughRate: number;
  conversionRate: number;
  revenueAttributed: number;
  topProducts: { productId: string; impressions: number; clicks: number; conversions: number }[];
  strategyPerformance: { strategy: CxRecommendationStrategy; impressions: number; ctr: number; cvr: number }[];
}

/* ================================================================== */
/*  TYPES — Customer Feedback & Sentiment                               */
/* ================================================================== */

export type CxFeedbackType = "review" | "rating" | "survey" | "nps" | "csat" | "support_feedback" | "custom";
export type CxSentimentLabel = "very_positive" | "positive" | "neutral" | "negative" | "very_negative";

export interface CxFeedback {
  id: string;
  customerId: string;
  type: CxFeedbackType;
  source: string;
  rating: number; // 1-5 or 1-10 for NPS
  content: string;
  sentiment: CxSentimentLabel;
  sentimentScore: number; // -1 to 1
  categories: string[];
  tags: string[];
  response?: string;
  respondedAt?: number;
  isPublic: boolean;
  createdAt: number;
}

export interface CxNpsResponse {
  id: string;
  customerId: string;
  score: number; // 0-10
  promoterType: "detractor" | "passive" | "promoter";
  reason?: string;
  createdAt: number;
}

export interface CxSentimentSummary {
  overallScore: number; // -1 to 1
  totalFeedbacks: number;
  distribution: { label: CxSentimentLabel; count: number; percentage: number }[];
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
  trendingTopic: string;
  averageRating: number;
  npsScore: number; // -100 to 100
}

/* ================================================================== */
/*  TYPES — Customer Intelligence & Insights                            */
/* ================================================================== */

export interface CxCustomerInsight {
  id: string;
  customerId: string;
  type: "purchase_pattern" | "browsing_pattern" | "category_affinity" | "brand_affinity"
    | "price_sensitivity" | "seasonal_behavior" | "churn_indicators" | "growth_potential"
    | "cross_sell_opportunity" | "upsell_opportunity";
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction: string;
  createdAt: number;
}

export interface CxIntelligenceDashboard {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  newCustomersThisMonth: number;
  churnedCustomers: number;
  churnRate: number;
  retentionRate: number;
  averageLifetimeValue: number;
  averageHealthScore: number;
  averageEngagementScore: number;
  segmentCount: number;
  topSegment: string;
  predictedRevenue: number;
  atRiskCustomers: number;
  vipCustomers: number;
  promoterCount: number;
  detractorCount: number;
  npsScore: number;
  totalFeedback: number;
  positiveSentiment: number;
  negativeSentiment: number;
}

/* ================================================================== */
/*  STORE — Persistence Layer                                           */
/* ================================================================== */

interface CxStore {
  profiles: CxCustomerProfile[];
  events: CxEvent[];
  sessions: CxSession[];
  timelines: CxTimelineEntry[];
  journeys: CxJourney[];
  segments: CxSegment[];
  recommendationModels: CxRecommendationModel[];
  recommendationAnalytics: CxRecommendationAnalytics;
  feedback: CxFeedback[];
  npsResponses: CxNpsResponse[];
  insights: CxCustomerInsight[];
}

const EMPTY_STORE: CxStore = {
  profiles: [], events: [], sessions: [], timelines: [],
  journeys: [], segments: [], recommendationModels: [],
  recommendationAnalytics: {
    totalImpressions: 0, totalClicks: 0, totalConversions: 0,
    clickThroughRate: 0, conversionRate: 0, revenueAttributed: 0,
    topProducts: [], strategyPerformance: [],
  },
  feedback: [], npsResponses: [], insights: [],
};

function getStore(): CxStore {
  try { const raw = localStorage.getItem(CX_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return { ...EMPTY_STORE };
}

function saveStore(store: CxStore) {
  try { localStorage.setItem(CX_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

function getCustomerProfilesFromMainStore(): { id: string; name: string; email: string; phone?: string; country?: string; language?: string; createdAt: number; status: string; loyaltyPoints?: number; storeCredit?: number; referralCode?: string; addresses: any[]; preferences?: any; timeline: any[]; notes: any[]; tasks: any[] }[] {
  try {
    const raw = localStorage.getItem("alaya_store_v10");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.customers || [];
  } catch { return []; }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedCxData() {
  const store = getStore();
  if (store.profiles.length > 0) return;
  const now = Date.now();

  // Sync profiles from main store
  const mainCustomers = getCustomerProfilesFromMainStore();
  const profiles: CxCustomerProfile[] = mainCustomers.map((c) => ({
    customerId: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    type: c.status === "vip" ? "vip" : "registered",
    status: c.status === "vip" ? "active" : (c.status as CxCustomerStatus),
    language: c.language || "en",
    currency: "USD",
    timezone: "America/New_York",
    country: c.country,
    createdAt: c.createdAt,
    lastActiveAt: c.createdAt,
    lastPurchaseAt: c.createdAt + 86400000 * 6,
    totalOrders: 2,
    totalSpent: 632.45,
    averageOrderValue: 316.22,
    lifetimePoints: c.loyaltyPoints || 0,
    currentPoints: c.loyaltyPoints || 0,
    storeCredit: c.storeCredit || 0,
    referralCode: c.referralCode || "",
    tags: c.status === "vip" ? ["vip", "high_value", "early_access"] : ["standard"],
    notes: c.notes?.map((n: any) => n.body).join("; ") || "",
    preferences: {
      favoriteBrands: c.preferences?.favoriteBrands || [],
      favoriteCategories: c.preferences?.favoriteCategories || [],
      favoriteProducts: [],
      priceRangeMin: 0,
      priceRangeMax: 1000,
      budgetLevel: c.status === "vip" ? "luxury" : "mid_range",
      styleTags: ["classic", "minimal"],
      sizes: [],
      colors: [],
      materials: [],
      communicationChannels: ["email", "push"],
      marketingOptIn: c.preferences?.marketingOptIn ?? true,
      newsletterFrequency: "weekly",
      preferredTheme: c.preferences?.preferredTheme || "light",
      privacyMode: false,
      shareDataWithAffiliates: false,
    },
    segments: c.status === "vip" ? ["seg_vip", "seg_high_value", "seg_engaged"] : ["seg_standard", "seg_new"],
    scores: {
      engagement: c.status === "vip" ? 85 : 45,
      loyalty: c.status === "vip" ? 92 : 30,
      purchase: c.status === "vip" ? 78 : 25,
      intent: c.status === "vip" ? 70 : 55,
      risk: c.status === "vip" ? 12 : 35,
      lifetimeValue: c.status === "vip" ? 1840 : 420,
      health: c.status === "vip" ? 88 : 52,
      recency: 60,
      frequency: c.status === "vip" ? 75 : 20,
      monetary: c.status === "vip" ? 80 : 28,
      churnProbability: c.status === "vip" ? 0.08 : 0.25,
      nextPurchaseProbability: c.status === "vip" ? 0.85 : 0.45,
    },
    aiSummary: c.status === "vip" ? "VIP customer with strong loyalty. High-value segments interested in leather goods and fragrance." : "New customer exploring the store. Engaged with beauty category. Recommend targeted welcome offers.",
    aiPersona: c.status === "vip" ? "Luxury Connoisseur" : "Aspiring Buyer",
    aiChurnRisk: c.status === "vip" ? 0.08 : 0.25,
    aiNextBestAction: c.status === "vip" ? "VIP exclusive early access to new collection" : "Send welcome series with 10% discount code",
  }));

  // Additional synthetic profiles for a richer dataset
  const syntheticProfiles: CxCustomerProfile[] = [
    { customerId: "synth_eleanor", name: "Eleanor V.", email: "eleanor@example.com", type: "vip", status: "active", language: "en", currency: "USD", timezone: "Europe/London", country: "United Kingdom", createdAt: now - 180 * 86400000, lastActiveAt: now - 3600000, lastPurchaseAt: now - 7 * 86400000, totalOrders: 8, totalSpent: 3240, averageOrderValue: 405, lifetimePoints: 4200, currentPoints: 2800, storeCredit: 50, referralCode: "ALAYA-ELEANOR", tags: ["vip", "top_spender", "brand_advocate"], notes: "One of our earliest customers. Regularly purchases leather goods and jewelry.", preferences: { favoriteBrands: ["alaya", "solene", "alya"], favoriteCategories: ["bags", "jewelry", "home"], favoriteProducts: [], priceRangeMin: 200, priceRangeMax: 2000, budgetLevel: "luxury", styleTags: ["classic", "elegant", "minimal"], sizes: [], colors: ["gold", "black", "tan"], materials: ["leather", "gold", "silk"], communicationChannels: ["email", "push", "in_app"], marketingOptIn: true, newsletterFrequency: "weekly", preferredTheme: "light", privacyMode: false, shareDataWithAffiliates: true }, segments: ["seg_vip", "seg_high_value", "seg_engaged", "seg_loyalty"], scores: { engagement: 92, loyalty: 95, purchase: 88, intent: 75, risk: 5, lifetimeValue: 4200, health: 94, recency: 85, frequency: 82, monetary: 90, churnProbability: 0.03, nextPurchaseProbability: 0.92 }, aiSummary: "Top-tier VIP customer with consistent high-value purchases. Strong brand advocate. Leather and jewelry enthusiast.", aiPersona: "Luxury Connoisseur", aiChurnRisk: 0.03, aiNextBestAction: "Personal styling session invite for new collection" },
    { customerId: "synth_noor", name: "Noor A.", email: "noor@example.com", type: "registered", status: "active", language: "en", currency: "USD", timezone: "Asia/Dubai", country: "United Arab Emirates", createdAt: now - 60 * 86400000, lastActiveAt: now - 7200000, lastPurchaseAt: now - 14 * 86400000, totalOrders: 3, totalSpent: 890, averageOrderValue: 296, lifetimePoints: 890, currentPoints: 450, storeCredit: 0, referralCode: "ALAYA-NOOR", tags: ["skincare", "beauty", "returning"], notes: "Interested in skincare and fragrance. Moderate spender.", preferences: { favoriteBrands: ["maison-clare", "lumiere", "alya"], favoriteCategories: ["beauty", "home"], favoriteProducts: [], priceRangeMin: 30, priceRangeMax: 150, budgetLevel: "premium", styleTags: ["modern", "clean"], sizes: [], colors: ["rose", "gold"], materials: [], communicationChannels: ["email", "sms"], marketingOptIn: true, newsletterFrequency: "weekly", preferredTheme: "dark", privacyMode: false, shareDataWithAffiliates: false }, segments: ["seg_beauty", "seg_returning", "seg_engaged"], scores: { engagement: 68, loyalty: 55, purchase: 48, intent: 62, risk: 18, lifetimeValue: 890, health: 72, recency: 70, frequency: 45, monetary: 42, churnProbability: 0.12, nextPurchaseProbability: 0.68 }, aiSummary: "Beauty-focused customer with consistent engagement. Shows interest in premium skincare.", aiPersona: "Beauty Enthusiast", aiChurnRisk: 0.12, aiNextBestAction: "New skincare routine personalized recommendation" },
  ];

  store.profiles = [...profiles, ...syntheticProfiles];

  // Seed segments
  const segments: CxSegment[] = [
    { id: "seg_vip", name: "VIP Customers", description: "High-value VIP tier customers", type: "vip", color: "#9c7a4b", icon: "crown", criteria: [{ field: "total_spent", operator: "gte", value: "1000" }], memberCount: 2, estimatedRevenue: 5080, createdAt: now - 90 * 86400000, updatedAt: now - 7 * 86400000, status: "active", isDynamic: true },
    { id: "seg_high_value", name: "High Value", description: "Customers with above-average LTV", type: "rule_based", color: "#4b7a52", icon: "diamond", criteria: [{ field: "predicted_ltv", operator: "gte", value: "500" }], memberCount: 3, estimatedRevenue: 4130, createdAt: now - 90 * 86400000, updatedAt: now - 14 * 86400000, status: "active", isDynamic: true },
    { id: "seg_engaged", name: "Highly Engaged", description: "Active shoppers with high engagement scores", type: "behavior", color: "#4f6da3", icon: "zap", criteria: [{ field: "engagement_score", operator: "gte", value: "60" }], memberCount: 3, estimatedRevenue: 3560, createdAt: now - 90 * 86400000, updatedAt: now - 3 * 86400000, status: "active", isDynamic: true },
    { id: "seg_loyalty", name: "Loyalty Program", description: "Loyalty points holders above tier threshold", type: "loyalty", color: "#b9802f", icon: "award", criteria: [{ field: "loyalty_points", operator: "gte", value: "1000" }], memberCount: 2, estimatedRevenue: 5080, createdAt: now - 60 * 86400000, updatedAt: now - 5 * 86400000, status: "active", isDynamic: true },
    { id: "seg_new", name: "New Customers", description: "Registered within last 90 days", type: "marketing", color: "#b14b46", icon: "user-plus", criteria: [{ field: "registration_date", operator: "gte", value: String(now - 90 * 86400000) }], memberCount: 2, estimatedRevenue: 420, createdAt: now - 60 * 86400000, updatedAt: now - 10 * 86400000, status: "active", isDynamic: true },
    { id: "seg_returning", name: "Returning Customers", description: "More than 1 purchase", type: "behavior", color: "#6e6356", icon: "refresh-cw", criteria: [{ field: "order_count", operator: "gte", value: "2" }], memberCount: 3, estimatedRevenue: 4130, createdAt: now - 60 * 86400000, updatedAt: now - 8 * 86400000, status: "active", isDynamic: true },
    { id: "seg_standard", name: "Standard Shoppers", description: "General active customers", type: "marketing", color: "#7a8c9e", icon: "users", criteria: [{ field: "total_spent", operator: "gte", value: "0" }], memberCount: 4, estimatedRevenue: 5100, createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000, status: "active", isDynamic: true },
    { id: "seg_beauty", name: "Beauty Enthusiasts", description: "Customers with beauty category affinity", type: "ai", color: "#d4a5a5", icon: "flower", criteria: [{ field: "favorite_category", operator: "contains", value: "beauty" }], memberCount: 2, estimatedRevenue: 1340, createdAt: now - 45 * 86400000, updatedAt: now - 2 * 86400000, status: "active", isDynamic: true },
    { id: "seg_at_risk", name: "At Risk (Churn)", description: "Customers showing churn indicators", type: "ai", color: "#b14b46", icon: "alert-triangle", criteria: [{ field: "churn_risk", operator: "gte", value: "0.7" }], memberCount: 0, estimatedRevenue: 0, createdAt: now - 30 * 86400000, updatedAt: now - 86400000, status: "active", isDynamic: true },
    { id: "seg_affiliate", name: "Affiliate Referrers", description: "Customers who drive referral traffic", type: "affiliate", color: "#4b7a52", icon: "link", criteria: [{ field: "is_affiliate", operator: "exists", value: "true" }], memberCount: 0, estimatedRevenue: 0, createdAt: now - 30 * 86400000, updatedAt: now - 86400000, status: "active", isDynamic: true },
  ];

  // Seed journeys
  const journeys: CxJourney[] = [
    {
      id: "journey_welcome", name: "Welcome Series", description: "5-step onboarding journey for new customers",
      type: "onboarding", trigger: { type: "event", eventType: "register", delayMinutes: 0, cooldownDays: 365, maxPerCustomer: 1 },
      steps: [
        { id: uid("js"), order: 0, type: "email", config: { template: "welcome_1", subject: "Welcome to ALAYA INSIDER", body: "Thank you for joining!" }, delayMinutes: 0, metadata: {} },
        { id: uid("js"), order: 1, type: "delay", config: { duration: "1440" }, delayMinutes: 1440, metadata: {} },
        { id: uid("js"), order: 2, type: "email", config: { template: "welcome_2", subject: "Discover your style", body: "Browse our curated collections" }, delayMinutes: 0, metadata: {} },
        { id: uid("js"), order: 3, type: "delay", config: { duration: "2880" }, delayMinutes: 2880, metadata: {} },
        { id: uid("js"), order: 4, type: "push", config: { title: "10% off your first order!", body: "Use code INSIDER10" }, delayMinutes: 0, metadata: {} },
      ],
      conditions: [], audience: ["seg_new"],
      analytics: { totalEntered: 45, totalCompleted: 28, totalExited: 5, totalConverted: 22, conversionRate: 48.9, averageCompletionMinutes: 4320, stepBreakdown: [] },
      status: "active", createdAt: now - 60 * 86400000, updatedAt: now - 5 * 86400000,
    },
    {
      id: "journey_abandoned", name: "Abandoned Cart Recovery", description: "Recover lost sales from cart abandoners",
      type: "retention", trigger: { type: "event", eventType: "abandoned_cart", delayMinutes: 30, cooldownDays: 7, maxPerCustomer: 3 },
      steps: [
        { id: uid("js"), order: 0, type: "email", config: { template: "cart_1", subject: "You left something behind", body: "Your cart is waiting" }, delayMinutes: 30, metadata: {} },
        { id: uid("js"), order: 1, type: "delay", config: { duration: "360" }, delayMinutes: 360, metadata: {} },
        { id: uid("js"), order: 2, type: "push", config: { title: "Still thinking about it?", body: "Your items are still available" }, delayMinutes: 0, metadata: {} },
        { id: uid("js"), order: 3, type: "delay", config: { duration: "1440" }, delayMinutes: 1440, metadata: {} },
        { id: uid("js"), order: 4, type: "email", config: { template: "cart_2", subject: "Free shipping + 10% off", body: "Complete your order with a special offer" }, delayMinutes: 0, metadata: {} },
      ],
      conditions: [], audience: ["seg_standard", "seg_returning"],
      analytics: { totalEntered: 120, totalCompleted: 42, totalExited: 15, totalConverted: 38, conversionRate: 31.7, averageCompletionMinutes: 2160, stepBreakdown: [] },
      status: "active", createdAt: now - 45 * 86400000, updatedAt: now - 3 * 86400000,
    },
    {
      id: "journey_vip", name: "VIP Engagement Program", description: "Exclusive perks and early access for VIP customers",
      type: "upsell", trigger: { type: "segment_change", delayMinutes: 0, cooldownDays: 30, maxPerCustomer: 12 },
      steps: [
        { id: uid("js"), order: 0, type: "email", config: { template: "vip_welcome", subject: "Welcome to VIP Atelier", body: "Your exclusive benefits await" }, delayMinutes: 0, metadata: {} },
        { id: uid("js"), order: 1, type: "delay", config: { duration: "43200" }, delayMinutes: 43200, metadata: {} },
        { id: uid("js"), order: 2, type: "in_app", config: { title: "Early Access: New Collection", body: "Preview before anyone else" }, delayMinutes: 0, metadata: {} },
        { id: uid("js"), order: 3, type: "assign_tag", config: { tag: "vip_active" }, delayMinutes: 0, metadata: {} },
      ],
      conditions: [], audience: ["seg_vip"],
      analytics: { totalEntered: 15, totalCompleted: 12, totalExited: 1, totalConverted: 10, conversionRate: 66.7, averageCompletionMinutes: 43200, stepBreakdown: [] },
      status: "active", createdAt: now - 30 * 86400000, updatedAt: now - 2 * 86400000,
    },
  ];

  // Seed feedback
  const feedback: CxFeedback[] = [
    { id: uid("fb"), customerId: "synth_eleanor", type: "review", source: "product_page", rating: 5, content: "Absolutely stunning quality. The leather is buttery soft and the craftsmanship is impeccable.", sentiment: "very_positive", sentimentScore: 0.95, categories: ["product_quality", "craftsmanship"], tags: ["leather", "bags"], isPublic: true, createdAt: now - 14 * 86400000 },
    { id: uid("fb"), customerId: "cust_isabella", type: "rating", source: "email", rating: 4, content: "Lovely products. Shipping was a bit slow but the packaging made up for it.", sentiment: "positive", sentimentScore: 0.65, categories: ["shipping", "packaging"], tags: [], isPublic: true, createdAt: now - 21 * 86400000 },
    { id: uid("fb"), customerId: "cust_meera", type: "survey", source: "post_purchase", rating: 5, content: "The Atelier Tote exceeded my expectations. Will definitely order again.", sentiment: "very_positive", sentimentScore: 0.90, categories: ["product_satisfaction"], tags: ["tote", "leather"], isPublic: true, createdAt: now - 5 * 86400000 },
  ];

  // Seed NPS responses
  const npsResponses: CxNpsResponse[] = [
    { id: uid("nps"), customerId: "synth_eleanor", score: 10, promoterType: "promoter", reason: "Best shopping experience. The quality is unmatched.", createdAt: now - 30 * 86400000 },
    { id: uid("nps"), customerId: "cust_isabella", score: 8, promoterType: "promoter", reason: "Great products, good service.", createdAt: now - 45 * 86400000 },
    { id: uid("nps"), customerId: "cust_meera", score: 9, promoterType: "promoter", reason: "Loved the tote. Will buy more.", createdAt: now - 10 * 86400000 },
  ];

  // Seed recommendation models
  const recModels: CxRecommendationModel[] = [
    { id: uid("rec"), name: "Homepage Personalized", strategy: "hybrid", placements: ["homepage"], maxResults: 12, minScore: 0.3, boostRecent: true, boostCategory: true, boostBrand: true, excludePurchased: true, excludeViewed: false, freshnessDays: 90, enabled: true, createdAt: now - 60 * 86400000, updatedAt: now - 5 * 86400000 },
    { id: uid("rec"), name: "Product Page Similar", strategy: "content_based", placements: ["product_page"], maxResults: 8, minScore: 0.4, boostRecent: false, boostCategory: true, boostBrand: true, excludePurchased: true, excludeViewed: true, freshnessDays: 60, enabled: true, createdAt: now - 60 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("rec"), name: "Cart Cross-sell", strategy: "frequently_bought_together", placements: ["cart"], maxResults: 4, minScore: 0.5, boostRecent: false, boostCategory: false, boostBrand: false, excludePurchased: true, excludeViewed: false, freshnessDays: 30, enabled: true, createdAt: now - 45 * 86400000, updatedAt: now - 3 * 86400000 },
    { id: uid("rec"), name: "Email Recommendations", strategy: "collaborative", placements: ["email"], maxResults: 6, minScore: 0.35, boostRecent: true, boostCategory: true, boostBrand: false, excludePurchased: true, excludeViewed: true, freshnessDays: 45, enabled: true, createdAt: now - 45 * 86400000, updatedAt: now - 2 * 86400000 },
    { id: uid("rec"), name: "Trending Now", strategy: "trending", placements: ["homepage", "category"], maxResults: 10, minScore: 0.2, boostRecent: true, boostCategory: false, boostBrand: false, excludePurchased: false, excludeViewed: false, freshnessDays: 7, enabled: true, createdAt: now - 30 * 86400000, updatedAt: now - 1 * 86400000 },
  ];

  store.segments = segments;
  store.journeys = journeys;
  store.feedback = feedback;
  store.npsResponses = npsResponses;
  store.recommendationModels = recModels;
  saveStore(store);
  pushLog("info", "system" as LogSource, "Customer Experience Platform seeded successfully");
}

seedCxData();

/* ================================================================== */
/*  PROFILE MANAGEMENT                                                  */
/* ================================================================== */

export function getCxProfiles(): CxCustomerProfile[] {
  return getStore().profiles;
}

export function getCxProfile(customerId: string): CxCustomerProfile | undefined {
  return getStore().profiles.find((p) => p.customerId === customerId);
}

export function updateCxProfile(customerId: string, patch: Partial<CxCustomerProfile>): CxCustomerProfile | null {
  const store = getStore();
  const idx = store.profiles.findIndex((p) => p.customerId === customerId);
  if (idx === -1) return null;
  store.profiles[idx] = { ...store.profiles[idx], ...patch };
  saveStore(store);
  return store.profiles[idx];
}

export function searchCxProfiles(query: string): CxCustomerProfile[] {
  if (!query.trim()) return getCxProfiles();
  const q = query.toLowerCase();
  return getCxProfiles().filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.email.toLowerCase().includes(q) ||
    p.customerId.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/* ================================================================== */
/*  EVENTS & BEHAVIOR TRACKING                                          */
/* ================================================================== */

export function getCxEvents(customerId?: string, limit = 100): CxEvent[] {
  const store = getStore();
  let events = [...store.events].reverse();
  if (customerId) events = events.filter((e) => e.customerId === customerId);
  return events.slice(0, limit);
}

export function trackCxEvent(event: Omit<CxEvent, "id" | "timestamp">): CxEvent {
  const store = getStore();
  const evt: CxEvent = { ...event, id: uid("cx_evt"), timestamp: Date.now() };
  store.events.push(evt);
  if (store.events.length > MAX_CX_EVENTS) store.events = store.events.slice(-MAX_CX_EVENTS);

  // Update profile lastActiveAt and add timeline entry
  const profile = store.profiles.find((p) => p.customerId === event.customerId);
  if (profile) profile.lastActiveAt = Date.now();

  saveStore(store);
  return evt;
}

export function getCxSessions(customerId?: string, limit = 50): CxSession[] {
  const store = getStore();
  let sessions = [...store.sessions].reverse();
  if (customerId) sessions = sessions.filter((s) => s.customerId === customerId);
  return sessions.slice(0, limit);
}

/* ================================================================== */
/*  TIMELINE                                                           */
/* ================================================================== */

export function getCxTimeline(customerId?: string, limit = 200): CxTimelineEntry[] {
  const store = getStore();
  let tl = [...store.timelines].sort((a, b) => b.timestamp - a.timestamp);
  if (customerId) tl = tl.filter((e) => e.customerId === customerId);
  return tl.slice(0, limit);
}

export function addCxTimelineEntry(entry: Omit<CxTimelineEntry, "id">): CxTimelineEntry {
  const store = getStore();
  const tl: CxTimelineEntry = { ...entry, id: uid("cx_tl") };
  store.timelines.push(tl);
  if (store.timelines.length > 5000) store.timelines = store.timelines.slice(-5000);
  saveStore(store);
  return tl;
}

/* ================================================================== */
/*  SEGMENTS ENGINE                                                     */
/* ================================================================== */

export function getCxSegments(): CxSegment[] {
  return getStore().segments;
}

export function createCxSegment(input: Omit<CxSegment, "id" | "createdAt" | "updatedAt" | "memberCount" | "estimatedRevenue">): CxSegment {
  const store = getStore();
  const seg: CxSegment = { ...input, id: uid("seg"), memberCount: 0, estimatedRevenue: 0, createdAt: Date.now(), updatedAt: Date.now() };
  store.segments.push(seg);
  if (store.segments.length > MAX_SEGMENTS) store.segments = store.segments.slice(-MAX_SEGMENTS);
  saveStore(store);
  return seg;
}

export function evaluateSegment(segmentId: string): { memberCount: number; members: string[] } {
  const store = getStore();
  const seg = store.segments.find((s) => s.id === segmentId);
  if (!seg || !seg.isDynamic) return { memberCount: 0, members: [] };

  const members = store.profiles.filter((p) => {
    return seg.criteria.every((c) => {
      const val = getProfileField(p, c.field);
      return evaluateCriterion(val, c.operator, c.value);
    });
  });

  seg.memberCount = members.length;
  seg.estimatedRevenue = members.reduce((s, m) => s + m.scores.lifetimeValue, 0);
  saveStore(store);
  return { memberCount: members.length, members: members.map((m) => m.customerId) };
}

function getProfileField(profile: CxCustomerProfile, field: CxSegmentCriteriaType): string {
  switch (field) {
    case "total_spent": return String(profile.totalSpent);
    case "order_count": return String(profile.totalOrders);
    case "last_purchase": return String(profile.lastPurchaseAt || 0);
    case "registration_date": return String(profile.createdAt);
    case "loyalty_points": return String(profile.currentPoints);
    case "store_credit": return String(profile.storeCredit);
    case "country": return profile.country || "";
    case "language": return profile.language;
    case "engagement_score": return String(profile.scores.engagement);
    case "loyalty_score": return String(profile.scores.loyalty);
    case "health_score": return String(profile.scores.health);
    case "churn_risk": return String(profile.scores.churnProbability);
    case "predicted_ltv": return String(profile.scores.lifetimeValue);
    case "next_purchase_probability": return String(profile.scores.nextPurchaseProbability);
    case "favorite_brand": return profile.preferences.favoriteBrands.join(",");
    case "favorite_category": return profile.preferences.favoriteCategories.join(",");
    case "price_range": return `${profile.preferences.priceRangeMin}-${profile.preferences.priceRangeMax}`;
    case "tag": return profile.tags.join(",");
    default: return "";
  }
}

function evaluateCriterion(value: string, operator: string, target: string): boolean {
  const v = value.toLowerCase();
  const t = target.toLowerCase();
  switch (operator) {
    case "equals": return v === t;
    case "not_equals": return v !== t;
    case "gt": return Number(value) > Number(target);
    case "gte": return Number(value) >= Number(target);
    case "lt": return Number(value) < Number(target);
    case "lte": return Number(value) <= Number(target);
    case "in": return target.split(",").map((s) => s.trim().toLowerCase()).includes(v);
    case "not_in": return !target.split(",").map((s) => s.trim().toLowerCase()).includes(v);
    case "between": { const [a, b] = target.split("-").map(Number); return Number(value) >= a && Number(value) <= b; }
    case "contains": return v.includes(t);
    case "exists": return value !== "" && value !== "0" && value !== "undefined" && value !== "null";
    case "not_exists": return value === "" || value === "undefined" || value === "null";
    default: return false;
  }
}

/* ================================================================== */
/*  SCORING ENGINE                                                      */
/* ================================================================== */

export function calculateCxScores(profile: CxCustomerProfile): CxCustomerScores {
  const now = Date.now();
  const daysSinceLastPurchase = profile.lastPurchaseAt ? (now - profile.lastPurchaseAt) / 86400000 : 365;
  const daysSinceLastActive = (now - profile.lastActiveAt) / 86400000;

  const recency = Math.max(0, 100 - daysSinceLastActive * 5);
  const frequency = Math.min(100, profile.totalOrders * 10);
  const monetary = Math.min(100, (profile.totalSpent / 5000) * 100);

  const engagement = Math.round((recency * 0.4 + frequency * 0.3 + monetary * 0.3));
  const loyalty = Math.round(Math.min(100, profile.currentPoints / 50));
  const purchase = Math.round((frequency * 0.5 + monetary * 0.5));
  const intent = Math.round(Math.max(0, 100 - daysSinceLastPurchase * 2));
  const risk = Math.round(Math.min(100, daysSinceLastPurchase * 3 + (profile.totalOrders === 0 ? 50 : 0)));
  const lifetimeValue = profile.totalSpent;
  const health = Math.round((engagement * 0.25 + loyalty * 0.25 + purchase * 0.2 + (100 - risk) * 0.15 + recency * 0.15));
  const churnProbability = parseFloat(Math.min(1, risk / 100).toFixed(2));
  const nextPurchaseProbability = parseFloat(Math.max(0, Math.min(1, (100 - risk) / 100)).toFixed(2));

  return {
    engagement, loyalty, purchase, intent, risk,
    lifetimeValue, health, recency, frequency, monetary,
    churnProbability, nextPurchaseProbability,
  };
}

/* ================================================================== */
/*  RECOMMENDATION ENGINE                                               */
/* ================================================================== */

export function getRecommendationModels(): CxRecommendationModel[] {
  return getStore().recommendationModels;
}

export function getRecommendationAnalytics(): CxRecommendationAnalytics {
  return getStore().recommendationAnalytics;
}

export function generateRecommendations(
  customerId: string,
  _placement: CxRecommendationPlacement,
  count = 8
): CxRecommendation[] {
  const store = getStore();
  const profile = store.profiles.find((p) => p.customerId === customerId);
  if (!profile) return [];

  // Get products from main store for recommendations
  let products: any[] = [];
  try {
    const raw = localStorage.getItem("alaya_store_v10");
    if (raw) {
      const parsed = JSON.parse(raw);
      products = parsed.products || [];
    }
  } catch { /* ignore */ }

  if (products.length === 0) return [];

  // Simple recommendation scoring based on customer preferences
  const scored = products.map((p: any) => {
    let score = 0;
    const reasons: string[] = [];

    // Brand affinity
    if (profile.preferences.favoriteBrands.includes(p.brandId) || profile.preferences.favoriteBrands.includes(p.brand?.toLowerCase())) {
      score += 0.25;
      reasons.push("Matches your favorite brands");
    }
    // Category affinity
    if (profile.preferences.favoriteCategories.includes(p.category)) {
      score += 0.2;
      reasons.push("Similar to categories you love");
    }
    // Price range match
    if (p.price >= profile.preferences.priceRangeMin && p.price <= profile.preferences.priceRangeMax) {
      score += 0.15;
    }
    // Style tag match
    if (p.tags?.some((t: string) => profile.preferences.styleTags.includes(t.toLowerCase()))) {
      score += 0.1;
      reasons.push("Matches your style preferences");
    }
    // Bestseller/featured boost
    if (p.bestSeller) { score += 0.1; reasons.push("Best seller"); }
    if (p.featured) { score += 0.05; reasons.push("Editor's pick"); }
    if (p.isNew) { score += 0.05; reasons.push("New arrival"); }

    return {
      productId: p.id,
      score,
      reason: reasons.length > 0 ? reasons[0] : "Recommended for you",
      strategy: "personalized" as CxRecommendationStrategy,
      position: 0,
    };
  });

  // Record analytics
  const recAnalytics = store.recommendationAnalytics;
  recAnalytics.totalImpressions += Math.min(scored.length, count);

  return scored.sort((a, b) => b.score - a.score).slice(0, count);
}

export function trackRecommendationClick(_productId: string) {
  const store = getStore();
  store.recommendationAnalytics.totalClicks++;
  saveStore(store);
}

export function trackRecommendationConversion(_productId: string, revenue: number) {
  const store = getStore();
  store.recommendationAnalytics.totalConversions++;
  store.recommendationAnalytics.revenueAttributed += revenue;
  store.recommendationAnalytics.conversionRate = store.recommendationAnalytics.totalImpressions > 0
    ? parseFloat(((store.recommendationAnalytics.totalConversions / store.recommendationAnalytics.totalImpressions) * 100).toFixed(2))
    : 0;
  store.recommendationAnalytics.clickThroughRate = store.recommendationAnalytics.totalImpressions > 0
    ? parseFloat(((store.recommendationAnalytics.totalClicks / store.recommendationAnalytics.totalImpressions) * 100).toFixed(2))
    : 0;

  // Update top products
  const existing = store.recommendationAnalytics.topProducts.find((tp) => tp.productId === _productId);
  if (existing) {
    existing.conversions++;
  } else {
    store.recommendationAnalytics.topProducts.push({ productId: _productId, impressions: 1, clicks: 1, conversions: 1 });
  }
  saveStore(store);
}

/* ================================================================== */
/*  FEEDBACK & SENTIMENT                                                */
/* ================================================================== */

export function getCxFeedback(limit = 100): CxFeedback[] {
  return getStore().feedback.slice(0, limit);
}

export function getNpsResponses(): CxNpsResponse[] {
  return getStore().npsResponses;
}

export function getSentimentSummary(): CxSentimentSummary {
  const store = getStore();
  const feedback = store.feedback;
  const nps = store.npsResponses;

  const distribution: Record<string, number> = { very_positive: 0, positive: 0, neutral: 0, negative: 0, very_negative: 0 };
  let totalScore = 0;
  let totalRating = 0;

  feedback.forEach((f) => {
    distribution[f.sentiment] = (distribution[f.sentiment] || 0) + 1;
    totalScore += f.sentimentScore;
    totalRating += f.rating;
  });

  const total = feedback.length || 1;
  const avgScore = totalScore / feedback.length || 0;

  // NPS calculation
  const promoters = nps.filter((n) => n.promoterType === "promoter").length;
  const detractors = nps.filter((n) => n.promoterType === "detractor").length;
  const npsTotal = nps.length || 1;
  const npsScore = Math.round(((promoters - detractors) / npsTotal) * 100);

  return {
    overallScore: avgScore,
    totalFeedbacks: feedback.length,
    distribution: Object.entries(distribution).map(([label, count]) => ({
      label: label as CxSentimentLabel,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
    })),
    topPositiveKeywords: ["quality", "beautiful", "love", "amazing", "stunning"],
    topNegativeKeywords: ["shipping", "delay", "expensive", "size", "wait"],
    trendingTopic: "product quality",
    averageRating: feedback.length ? parseFloat((totalRating / feedback.length).toFixed(1)) : 0,
    npsScore,
  };
}

export function submitFeedback(input: Omit<CxFeedback, "id" | "createdAt">): CxFeedback {
  const store = getStore();
  const fb: CxFeedback = { ...input, id: uid("fb"), createdAt: Date.now() };
  store.feedback.push(fb);
  saveStore(store);
  return fb;
}

export function submitNps(input: Omit<CxNpsResponse, "id" | "createdAt" | "promoterType">): CxNpsResponse {
  const promoterType: "promoter" | "passive" | "detractor" =
    input.score >= 9 ? "promoter" : input.score >= 7 ? "passive" : "detractor";
  const res: CxNpsResponse = { ...input, id: uid("nps"), promoterType, createdAt: Date.now() };
  const store = getStore();
  store.npsResponses.push(res);
  saveStore(store);
  return res;
}

/* ================================================================== */
/*  JOURNEY ENGINE                                                      */
/* ================================================================== */

export function getCxJourneys(): CxJourney[] {
  return getStore().journeys;
}

export function createCxJourney(input: Omit<CxJourney, "id" | "createdAt" | "updatedAt" | "analytics">): CxJourney {
  const store = getStore();
  const journey: CxJourney = {
    ...input,
    id: uid("jn"),
    analytics: { totalEntered: 0, totalCompleted: 0, totalExited: 0, totalConverted: 0, conversionRate: 0, averageCompletionMinutes: 0, stepBreakdown: [] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.journeys.push(journey);
  if (store.journeys.length > MAX_JOURNEYS) store.journeys = store.journeys.slice(-MAX_JOURNEYS);
  saveStore(store);
  return journey;
}

export function updateCxJourney(id: string, patch: Partial<CxJourney>): CxJourney | null {
  const store = getStore();
  const idx = store.journeys.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  store.journeys[idx] = { ...store.journeys[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.journeys[idx];
}

export function deleteCxJourney(id: string): boolean {
  const store = getStore();
  store.journeys = store.journeys.filter((j) => j.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  INSIGHTS ENGINE                                                     */
/* ================================================================== */

export function getCxInsights(customerId?: string): CxCustomerInsight[] {
  const store = getStore();
  if (customerId) return store.insights.filter((i) => i.customerId === customerId);
  return store.insights;
}

export function generateCxInsights(profile: CxCustomerProfile): CxCustomerInsight[] {
  const insights: CxCustomerInsight[] = [];
  const now = Date.now();

  // Churn risk insight
  if (profile.scores.churnProbability > 0.3) {
    insights.push({
      id: uid("insight"), customerId: profile.customerId,
      type: "churn_indicators", title: "At risk of churning",
      description: `${profile.name} has a ${Math.round(profile.scores.churnProbability * 100)}% churn probability and hasn't purchased recently.`,
      confidence: profile.scores.churnProbability, actionable: true,
      suggestedAction: "Send re-engagement email with personalized offer",
      createdAt: now,
    });
  }

  // Upsell opportunity
  if (profile.scores.lifetimeValue > 500 && profile.preferences.budgetLevel === "premium") {
    insights.push({
      id: uid("insight"), customerId: profile.customerId,
      type: "upsell_opportunity", title: "Upsell opportunity detected",
      description: `${profile.name} has premium budget level and high LTV. Consider VIP upgrade.`,
      confidence: 0.75, actionable: true,
      suggestedAction: "Invite to VIP Atelier program with exclusive preview",
      createdAt: now,
    });
  }

  // Cross-sell based on preferences
  if (profile.preferences.favoriteCategories.length > 0) {
    insights.push({
      id: uid("insight"), customerId: profile.customerId,
      type: "cross_sell_opportunity", title: "Cross-sell by category affinity",
      description: `${profile.name} shows strong affinity for ${profile.preferences.favoriteCategories.slice(0, 2).join(" and ")}.`,
      confidence: 0.7, actionable: true,
      suggestedAction: "Recommend complementary products from adjacent categories",
      createdAt: now,
    });
  }

  return insights;
}

/* ================================================================== */
/*  INTELLIGENCE DASHBOARD                                              */
/* ================================================================== */

export function getCxIntelligenceDashboard(): CxIntelligenceDashboard {
  const store = getStore();
  const profiles = store.profiles;
  const nps = store.npsResponses;
  const feedback = store.feedback;
  const now = Date.now();
  const today = new Date().setHours(0, 0, 0, 0);

  const total = profiles.length;
  const active = profiles.filter((p) => p.status === "active").length;
  const newToday = profiles.filter((p) => p.createdAt >= today).length;
  const newThisMonth = profiles.filter((p) => p.createdAt >= now - 30 * 86400000).length;
  const churned = profiles.filter((p) => p.status === "churned").length;
  const vip = profiles.filter((p) => p.type === "vip").length;
  const atRisk = profiles.filter((p) => p.scores.churnProbability > 0.5).length;

  const avgLtv = total > 0 ? Math.round(profiles.reduce((s, p) => s + p.scores.lifetimeValue, 0) / total) : 0;
  const avgHealth = total > 0 ? Math.round(profiles.reduce((s, p) => s + p.scores.health, 0) / total) : 0;
  const avgEngagement = total > 0 ? Math.round(profiles.reduce((s, p) => s + p.scores.engagement, 0) / total) : 0;
  const churnRate = total > 0 ? parseFloat(((churned / total) * 100).toFixed(1)) : 0;
  const retentionRate = parseFloat((100 - churnRate).toFixed(1));
  const predictedRevenue = profiles.reduce((s, p) => s + p.scores.lifetimeValue * 0.2, 0);

  const promoters = nps.filter((n) => n.promoterType === "promoter").length;
  const detractors = nps.filter((n) => n.promoterType === "detractor").length;
  const npsTotal = nps.length || 1;
  const npsScore = Math.round(((promoters - detractors) / npsTotal) * 100);

  const positiveSentiment = feedback.filter((f) => f.sentiment === "very_positive" || f.sentiment === "positive").length;
  const negativeSentiment = feedback.filter((f) => f.sentiment === "very_negative" || f.sentiment === "negative").length;

  return {
    totalCustomers: total,
    activeCustomers: active,
    newCustomersToday: newToday,
    newCustomersThisMonth: newThisMonth,
    churnedCustomers: churned,
    churnRate,
    retentionRate,
    averageLifetimeValue: avgLtv,
    averageHealthScore: avgHealth,
    averageEngagementScore: avgEngagement,
    segmentCount: store.segments.length,
    topSegment: store.segments.sort((a, b) => b.memberCount - a.memberCount)[0]?.name || "N/A",
    predictedRevenue: Math.round(predictedRevenue),
    atRiskCustomers: atRisk,
    vipCustomers: vip,
    promoterCount: promoters,
    detractorCount: detractors,
    npsScore,
    totalFeedback: feedback.length,
    positiveSentiment,
    negativeSentiment,
  };
}

/* ================================================================== */
/*  IMPORT / EXPORT                                                     */
/* ================================================================== */

export function exportCxProfiles(ids?: string[]): string {
  const store = getStore();
  const profiles = ids ? store.profiles.filter((p) => ids.includes(p.customerId)) : store.profiles;
  return JSON.stringify({ version: 1, exportedAt: Date.now(), profiles }, null, 2);
}

export function importCxProfiles(json: string): { imported: number; errors: string[] } {
  try {
    const data = JSON.parse(json);
    if (!data.profiles || !Array.isArray(data.profiles)) return { imported: 0, errors: ["Invalid format: expected .profiles array"] };
    const store = getStore();
    let imported = 0;
    const errors: string[] = [];
    for (const p of data.profiles) {
      try {
        const existing = store.profiles.find((x) => x.customerId === p.customerId);
        if (existing) {
          Object.assign(existing, p);
        } else {
          store.profiles.push(p);
        }
        imported++;
      } catch (e) {
        errors.push(`Failed to import ${p.name || "unknown"}: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }
    saveStore(store);
    return { imported, errors };
  } catch {
    return { imported: 0, errors: ["Invalid JSON"] };
  }
}

export function mergeCxProfiles(targetId: string, sourceIds: string[]): CxCustomerProfile | null {
  const store = getStore();
  const target = store.profiles.find((p) => p.customerId === targetId);
  if (!target) return null;
  const sources = store.profiles.filter((p) => sourceIds.includes(p.customerId));
  for (const src of sources) {
    target.totalSpent += src.totalSpent;
    target.totalOrders += src.totalOrders;
    target.lifetimePoints += src.lifetimePoints;
    target.currentPoints += src.currentPoints;
    target.storeCredit += src.storeCredit;
    target.tags = [...new Set([...target.tags, ...src.tags])];
    Object.assign(target.preferences, src.preferences);
    store.profiles = store.profiles.filter((p) => p.customerId !== src.customerId);
  }
  target.averageOrderValue = target.totalOrders > 0 ? Math.round(target.totalSpent / target.totalOrders) : 0;
  saveStore(store);
  return target;
}

/* ================================================================== */
/*  PERSONALIZATION API                                                 */
/* ================================================================== */

export interface CxPersonalizationContext {
  homepageBanners: string[];
  heroCopy: { title: string; subtitle: string };
  collectionOrder: string[];
  productBoost: string[];
  featuredCategories: string[];
  upsellMessage?: string;
  discountOffer?: { code: string; value: number; type: string };
}

export function getPersonalizationContext(customerId?: string): CxPersonalizationContext {
  if (!customerId) {
    // Anonymous visitor — default experience
    return {
      homepageBanners: ["default_hero", "new_arrivals", "bestsellers"],
      heroCopy: { title: "Discover your new essentials", subtitle: "Curated luxury for everyday elegance" },
      collectionOrder: ["beauty", "jewelry", "bags", "home"],
      productBoost: [],
      featuredCategories: ["beauty", "bags", "jewelry"],
    };
  }

  const profile = getCxProfile(customerId);
  if (!profile) return getPersonalizationContext();

  const ctx: CxPersonalizationContext = {
    homepageBanners: [],
    heroCopy: { title: "Welcome back", subtitle: `Curated for ${profile.name.split(" ")[0]}` },
    collectionOrder: [],
    productBoost: [],
    featuredCategories: profile.preferences.favoriteCategories.length > 0
      ? profile.preferences.favoriteCategories
      : ["beauty", "bags", "jewelry"],
  };

  // Personalize based on type
  if (profile.type === "vip") {
    ctx.homepageBanners = ["vip_exclusive", "early_access", "vip_collection"];
    ctx.heroCopy = { title: "Welcome to VIP Atelier", subtitle: `${profile.name}, your exclusive preview awaits` };
    ctx.collectionOrder = ["luxury", "new_arrivals", ...profile.preferences.favoriteCategories];
  } else if (profile.totalOrders > 0) {
    ctx.homepageBanners = ["returning_customer", "recommended_for_you"];
    ctx.heroCopy = { title: "We thought you'd love these", subtitle: `Inspired by your style, ${profile.name.split(" ")[0]}` };
    ctx.collectionOrder = ["recommended", ...profile.preferences.favoriteCategories];
    ctx.upsellMessage = "Complete your collection with matching pieces";
  } else {
    ctx.homepageBanners = ["welcome", "get_started", "inspiration"];
    ctx.collectionOrder = ["bestsellers", "new_arrivals", ...profile.preferences.favoriteCategories];
    ctx.discountOffer = { code: "INSIDER10", value: 10, type: "percent" };
  }

  return ctx;
}

/* ================================================================== */
/*  AI CUSTOMER ANALYTICS                                               */
/* ================================================================== */

export function getAiCustomerSummary(customerId: string): { summary: string; persona: string; nextBestAction: string; churnRisk: number } {
  const profile = getCxProfile(customerId);
  if (!profile) return { summary: "Customer not found", persona: "Unknown", nextBestAction: "N/A", churnRisk: 0 };
  return {
    summary: profile.aiSummary || `${profile.name} has spent $${profile.totalSpent} across ${profile.totalOrders} orders.`,
    persona: profile.aiPersona || "Standard Shopper",
    nextBestAction: profile.aiNextBestAction || "Monitor engagement",
    churnRisk: profile.aiChurnRisk || profile.scores.churnProbability,
  };
}

export function predictCustomerSegment(customerId: string): { segment: string; confidence: number }[] {
  const profile = getCxProfile(customerId);
  if (!profile) return [];

  const predictions: { segment: string; confidence: number }[] = [];

  if (profile.scores.lifetimeValue > 3000) predictions.push({ segment: "VIP", confidence: 0.92 });
  else if (profile.scores.lifetimeValue > 1000) predictions.push({ segment: "High Value", confidence: 0.78 });
  else if (profile.totalOrders > 2) predictions.push({ segment: "Returning", confidence: 0.85 });
  else if (profile.totalOrders > 0) predictions.push({ segment: "Converted", confidence: 0.7 });
  else predictions.push({ segment: "New/Browsing", confidence: 0.6 });

  if (profile.preferences.favoriteCategories.includes("beauty")) predictions.push({ segment: "Beauty Enthusiast", confidence: 0.72 });
  if (profile.preferences.budgetLevel === "luxury") predictions.push({ segment: "Luxury Buyer", confidence: 0.68 });
  if (profile.scores.churnProbability > 0.4) predictions.push({ segment: "At Risk", confidence: 0.81 });

  return predictions;
}

/* ================================================================== */
/*  FORECASTING                                                         */
/* ================================================================== */

export interface CxForecast {
  metric: string;
  currentValue: number;
  predictedNextMonth: number;
  predictedNextQuarter: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}

export function getCxForecasts(): CxForecast[] {
  const store = getStore();
  const profiles = store.profiles;
  const total = profiles.length || 1;
  const monthlyRevenue = profiles.reduce((s, p) => s + p.totalSpent * 0.1, 0);

  return [
    { metric: "Active Customers", currentValue: profiles.filter((p) => p.status === "active").length, predictedNextMonth: 18, predictedNextQuarter: 32, lowerBound: 14, upperBound: 28, confidence: 0.82, trend: "up" },
    { metric: "New Customers", currentValue: 4, predictedNextMonth: 8, predictedNextQuarter: 25, lowerBound: 5, upperBound: 12, confidence: 0.77, trend: "up" },
    { metric: "Churn Rate (%)", currentValue: profiles.length ? parseFloat(((profiles.filter((p) => p.status === "churned").length / total) * 100).toFixed(1)) : 0, predictedNextMonth: 4.2, predictedNextQuarter: 3.8, lowerBound: 3.0, upperBound: 5.5, confidence: 0.85, trend: "down" },
    { metric: "Average LTV ($)", currentValue: total > 0 ? Math.round(profiles.reduce((s, p) => s + p.scores.lifetimeValue, 0) / total) : 0, predictedNextMonth: 1200, predictedNextQuarter: 1500, lowerBound: 1000, upperBound: 1800, confidence: 0.72, trend: "up" },
    { metric: "Monthly Revenue from CX ($)", currentValue: Math.round(monthlyRevenue), predictedNextMonth: Math.round(monthlyRevenue * 1.15), predictedNextQuarter: Math.round(monthlyRevenue * 1.4), lowerBound: Math.round(monthlyRevenue * 0.9), upperBound: Math.round(monthlyRevenue * 1.6), confidence: 0.8, trend: "up" },
    { metric: "NPS Score", currentValue: getCxIntelligenceDashboard().npsScore, predictedNextMonth: 82, predictedNextQuarter: 85, lowerBound: 75, upperBound: 90, confidence: 0.78, trend: "up" },
    { metric: "Recommendation Revenue ($)", currentValue: Math.round(store.recommendationAnalytics.revenueAttributed), predictedNextMonth: 2800, predictedNextQuarter: 8500, lowerBound: 2000, upperBound: 4000, confidence: 0.75, trend: "up" },
    { metric: "Customer Health Score (Avg)", currentValue: total > 0 ? Math.round(profiles.reduce((s, p) => s + p.scores.health, 0) / total) : 0, predictedNextMonth: 62, predictedNextQuarter: 65, lowerBound: 58, upperBound: 70, confidence: 0.83, trend: "up" },
  ];
}

/* ================================================================== */
/*  CX REPORTS                                                          */
/* ================================================================== */

export interface CxReport {
  title: string;
  metrics: { label: string; value: string; change: string; trend: "up" | "down" | "stable" }[];
  chartData: { label: string; values: number[] }[];
}

export function getCxReport(type: "monthly" | "quarterly" | "annual"): CxReport {
  const dash = getCxIntelligenceDashboard();
  return {
    title: `Customer Experience Report (${type})`,
    metrics: [
      { label: "Total Customers", value: String(dash.totalCustomers), change: "+12%", trend: "up" },
      { label: "Active Rate", value: `${dash.activeCustomers}`, change: "+5%", trend: "up" },
      { label: "NPS Score", value: String(dash.npsScore), change: dash.npsScore > 50 ? "+3 pts" : "-2 pts", trend: dash.npsScore > 50 ? "up" : "down" },
      { label: "Churn Rate", value: `${dash.churnRate}%`, change: "-0.5%", trend: "down" },
      { label: "Avg LTV", value: `$${dash.averageLifetimeValue}`, change: "+8%", trend: "up" },
      { label: "Health Score", value: `${dash.averageHealthScore}%`, change: "+2%", trend: "up" },
    ],
    chartData: [
      { label: "Customer Growth", values: Array.from({ length: 12 }, (_, i) => Math.round(10 + dash.totalCustomers * 0.08 * i + Math.random() * 3)) },
      { label: "Monthly Revenue", values: Array.from({ length: 12 }, () => Math.round(5000 + Math.random() * 3000)) },
      { label: "NPS Trend", values: Array.from({ length: 12 }, () => Math.round(40 + Math.random() * 45)) },
      { label: "Engagement", values: Array.from({ length: 12 }, () => Math.round(40 + Math.random() * 40)) },
    ],
  };
}
