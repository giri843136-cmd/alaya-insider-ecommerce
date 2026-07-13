/**
 * ALAYA INSIDER — Enterprise Marketing Platform (PART 2.14)
 * =====================================================================
 * Centralized growth engine: lead management, audience/CDP, campaigns,
 * email marketing, marketing automation, A/B testing, personalization,
 * referral/loyalty, attribution, analytics, growth forecasting, and
 * AI marketing assistant.
 *
 * Integrates with: types.ts, communications.ts, customerExperience.ts,
 * businessIntelligence.ts, analytics.ts, commercePlatform.ts, StoreContext
 */
import { uid } from "./utils";
import { pushLog } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const MP_STORAGE_KEY = "alaya_marketing_platform_store";
export const MAX_LEADS = 5000;
export const MAX_AUDIENCES = 100;
export const MAX_AUTOMATIONS = 200;
export const MAX_AB_TESTS = 50;

/* ================================================================== */
/*  TYPES — Lead Management                                            */
/* ================================================================== */

export type LeadSource = "web_form" | "popup" | "referral" | "affiliate" | "social" | "email" | "sms" | "chat" | "import" | "api" | "other";
export type LeadStatus = "new" | "contacted" | "qualified" | "disqualified" | "converted" | "lost";
export type LeadScoreTier = "cold" | "warm" | "hot";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  scoreTier: LeadScoreTier;
  company?: string;
  title?: string;
  country?: string;
  city?: string;
  tags: string[];
  notes: string;
  assignedTo?: string;
  convertedToCustomer?: string;
  createdAt: number;
  contactedAt?: number;
  convertedAt?: number;
  lastActivityAt: number;
  metadata: Record<string, string>;
}

export interface LeadScoringRule {
  id: string;
  name: string;
  field: string;
  operator: "equals" | "contains" | "gt" | "gte" | "lt" | "lte" | "exists";
  value: string;
  points: number;
  enabled: boolean;
}

/* ================================================================== */
/*  TYPES — Audience & CDP                                             */
/* ================================================================== */

export type AudienceSource = "rule_based" | "ai" | "lookalike" | "manual" | "import";
export type AudienceStatus = "active" | "draft" | "archived";

export interface Audience {
  id: string;
  name: string;
  description: string;
  source: AudienceSource;
  status: AudienceStatus;
  rules: AudienceRule[];
  memberCount: number;
  estimatedReach: number;
  tags: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
  lastEvaluatedAt?: number;
}

export interface AudienceRule {
  id: string;
  group: string;
  field: string;
  operator: "equals" | "not_equals" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "between" | "contains" | "exists" | "not_exists";
  value: string;
}

export interface CdpProfile {
  customerId: string;
  anonymousId?: string;
  email: string;
  name: string;
  phone?: string;
  segments: string[];
  audiences: string[];
  firstSeen: number;
  lastSeen: number;
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lifetimePoints: number;
  tags: string[];
  deviceType: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  preferredChannel: string;
  marketingOptIn: boolean;
  predictedLtv: number;
  churnProbability: number;
  nextBestAction: string;
  properties: Record<string, string>;
}

/* ================================================================== */
/*  TYPES — Campaign Management                                        */
/* ================================================================== */

export type CampaignChannel = "email" | "sms" | "push" | "in_app" | "social" | "affiliate" | "seo" | "content" | "display" | "search" | "referral";
export type CampaignGoal = "awareness" | "consideration" | "conversion" | "retention" | "reactivation" | "referral" | "loyalty";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled" | "archived";
export type AttributionModel = "first_touch" | "last_touch" | "linear" | "position_based" | "time_decay" | "custom";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: CampaignGoal;
  channels: CampaignChannel[];
  status: CampaignStatus;
  audienceIds: string[];
  budget: number;
  spend: number;
  startAt?: number;
  endAt?: number;
  scheduledAt?: number;
  version: number;
  tags: string[];
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  analytics: CampaignAnalyticsData;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignAnalyticsData {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roi: number;
  cac: number;
  uniqueReach: number;
  bounceRate: number;
  avgPosition?: number;
  qualityScore?: number;
}

export interface CampaignScheduleEntry {
  id: string;
  campaignId: string;
  channel: CampaignChannel;
  scheduledAt: number;
  sentAt?: number;
  status: "pending" | "sending" | "sent" | "failed";
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

/* ================================================================== */
/*  TYPES — Email Marketing & Drip Campaigns                           */
/* ================================================================== */

export interface EmailCampaign {
  id: string;
  campaignId: string;
  name: string;
  subject: string;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
  templateId?: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  version: number;
  status: "draft" | "ready" | "sent" | "paused";
  aTestId?: string;
  isWinningVariant?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DripSequence {
  id: string;
  name: string;
  description: string;
  trigger: DripTrigger;
  steps: DripStep[];
  analytics: DripAnalytics;
  status: "draft" | "active" | "paused" | "completed";
  createdAt: number;
  updatedAt: number;
}

export type DripTriggerType = "welcome" | "abandoned_cart" | "post_purchase" | "re_engagement" | "price_drop" | "back_in_stock" | "birthday" | "anniversary" | "lead_scored" | "custom";

export interface DripTrigger {
  type: DripTriggerType;
  delayHours: number;
  audienceIds: string[];
  cooldownDays: number;
  maxPerCustomer: number;
  customEvent?: string;
}

export interface DripStep {
  id: string;
  order: number;
  delayDays: number;
  subject: string;
  body: string;
  bodyHtml?: string;
  templateId?: string;
  conditions?: string;
}

export interface DripAnalytics {
  totalEnrolled: number;
  totalCompleted: number;
  totalExited: number;
  totalConverted: number;
  conversionRate: number;
  averageCompletionDays: number;
  stepBreakdown: { stepId: string; entered: number; completed: number; dropped: number }[];
}

/* ================================================================== */
/*  TYPES — Marketing Automation                                       */
/* ================================================================== */

export type AutomationTriggerType =
  | "form_submitted" | "popup_converted" | "lead_created" | "lead_scored"
  | "order_placed" | "order_shipped" | "order_delivered"
  | "cart_abandoned" | "product_viewed"
  | "email_opened" | "email_clicked"
  | "page_visited" | "segment_entered" | "segment_exited"
  | "date_based" | "custom_event"
  | "scheduled";

export type AutomationActionType =
  | "send_email" | "send_sms" | "send_push" | "send_in_app"
  | "add_to_segment" | "remove_from_segment"
  | "add_tag" | "remove_tag"
  | "update_score"
  | "webhook"
  | "delay"
  | "condition"
  | "exit";

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  audienceIds: string[];
  stats: AutomationStats;
  status: "draft" | "active" | "paused" | "archived";
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  eventName?: string;
  scheduleCron?: string;
  delayMinutes: number;
  cooldownHours: number;
  maxPerContact: number;
  conditionExpression?: string;
}

export interface AutomationStep {
  id: string;
  order: number;
  type: AutomationActionType;
  config: Record<string, string>;
  delayMinutes: number;
  conditionExpression?: string;
  metadata: Record<string, string>;
}

export interface AutomationStats {
  totalEntered: number;
  totalCompleted: number;
  totalExited: number;
  totalConverted: number;
  conversionRate: number;
  stepBreakdown: { stepId: string; entered: number; completed: number; dropped: number }[];
}

/* ================================================================== */
/*  TYPES — A/B Testing                                                */
/* ================================================================== */

export type AbTestType = "subject_line" | "content" | "cta" | "layout" | "landing_page" | "banner" | "popup";
export type AbTestStatus = "draft" | "running" | "completed" | "cancelled";

export interface AbTest {
  id: string;
  name: string;
  description: string;
  type: AbTestType;
  status: AbTestStatus;
  variants: AbTestVariant[];
  audienceSplit: number;
  sampleSize: number;
  confidenceLevel: number;
  winnerId?: string;
  startAt?: number;
  endAt?: number;
  durationDays: number;
  metrics: AbTestMetrics;
  createdAt: number;
  updatedAt: number;
}

export interface AbTestVariant {
  id: string;
  name: string;
  content: string;
  trafficPercent: number;
  impressions: number;
  conversions: number;
  conversionRate: number;
  isControl: boolean;
}

export interface AbTestMetrics {
  totalImpressions: number;
  totalConversions: number;
  overallConversionRate: number;
  liftOverControl: number;
  significanceLevel: number;
  winnerConfidence: number;
}

/* ================================================================== */
/*  TYPES — Personalization Engine                                     */
/* ================================================================== */

export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  channel: "web" | "email" | "push" | "in_app";
  condition: PersonalizationCondition;
  action: PersonalizationAction;
  priority: number;
  enabled: boolean;
  createdAt: number;
}

export interface PersonalizationCondition {
  field: string;
  operator: "equals" | "contains" | "gt" | "gte" | "lt" | "lte" | "in";
  value: string;
  logicalGroup?: string;
}

export interface PersonalizationAction {
  type: "show_banner" | "show_popup" | "show_block" | "change_copy" | "change_cta" | "change_offer" | "change_layout";
  config: Record<string, string>;
}

/* ================================================================== */
/*  TYPES — Referral & Loyalty Platform                                */
/* ================================================================== */

export type RewardType = "points" | "credit" | "coupon" | "free_shipping" | "product" | "tier_upgrade";

export interface ReferralCampaign {
  id: string;
  name: string;
  description: string;
  rewardType: RewardType;
  rewardValue: number;
  rewardDescription: string;
  referrerReward: string;
  refereeReward: string;
  minPurchase: number;
  maxReferrals: number;
  expiryDays: number;
  status: "draft" | "active" | "paused" | "completed";
  analytics: ReferralCampaignAnalytics;
  createdAt: number;
}

export interface ReferralCampaignAnalytics {
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  conversionRate: number;
  rewardCost: number;
  revenueGenerated: number;
  roi: number;
}

export interface LoyaltyTierDefinition {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  pointsMultiplier: number;
  benefits: string[];
  color: string;
  icon: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: "earn" | "spend" | "bonus" | "expire" | "adjust";
  points: number;
  balance: number;
  reason: string;
  orderId?: string;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Marketing Attribution                                      */
/* ================================================================== */

export interface AttributionResult {
  campaignId: string;
  campaignName: string;
  channel: CampaignChannel;
  touchpoint: number;
  attributedConversions: number;
  attributedRevenue: number;
  attributionShare: number;
  attributedRevenueByModel: Record<AttributionModel, number>;
}

/* ================================================================== */
/*  TYPES — Marketing Analytics & Forecasting                          */
/* ================================================================== */

export interface MarketingMetric {
  id: string;
  name: string;
  category: "acquisition" | "engagement" | "conversion" | "revenue" | "retention" | "roi";
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  sparkline: number[];
}

export interface ChannelPerformance {
  channel: CampaignChannel;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cvr: number;
  revenue: number;
  roi: number;
  cac: number;
}

export interface GrowthForecast {
  metric: string;
  currentValue: number;
  predictedNextMonth: number;
  predictedNextQuarter: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  drivers: string[];
}

export interface MarketingDashboardData {
  totalRevenue: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  hotLeads: number;
  totalAudiences: number;
  totalAutomations: number;
  activeAutomations: number;
  totalAbTests: number;
  runningAbTests: number;
  channelPerformance: ChannelPerformance[];
  topMetrics: MarketingMetric[];
  forecasts: GrowthForecast[];
  attributionSummary: AttributionResult[];
}

/* ================================================================== */
/*  TYPES — AI Marketing Assistant                                     */
/* ================================================================== */

export interface AiMarketingSuggestion {
  id: string;
  type: "campaign_idea" | "audience_suggestion" | "copy" | "subject_line" | "cta" | "optimization" | "strategy";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  metadata: Record<string, string>;
  createdAt: number;
}

export interface AiCampaignBrief {
  campaignName: string;
  goal: CampaignGoal;
  channels: CampaignChannel[];
  targetAudience: string;
  keyMessage: string;
  estimatedReach: number;
  estimatedConversions: number;
  estimatedRevenue: number;
  suggestedBudget: number;
  suggestedTimeline: string;
  copySuggestions: string[];
  ctaSuggestions: string[];
}

/* ================================================================== */
/*  STORE                                                              */
/* ================================================================== */

interface MpStore {
  leads: Lead[];
  scoringRules: LeadScoringRule[];
  audiences: Audience[];
  cdpProfiles: CdpProfile[];
  campaigns: Campaign[];
  campaignSchedules: CampaignScheduleEntry[];
  emailCampaigns: EmailCampaign[];
  dripSequences: DripSequence[];
  automations: Automation[];
  abTests: AbTest[];
  personalizationRules: PersonalizationRule[];
  referralCampaigns: ReferralCampaign[];
  loyaltyTiers: LoyaltyTierDefinition[];
  loyaltyTransactions: LoyaltyTransaction[];
  attributionResults: AttributionResult[];
  aiSuggestions: AiMarketingSuggestion[];
  channelPerformance: ChannelPerformance[];
}

function getStore(): MpStore {
  try {
    const raw = localStorage.getItem(MP_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MpStore;
  } catch { /* ignore */ }
  return {
    leads: [], scoringRules: [], audiences: [], cdpProfiles: [],
    campaigns: [], campaignSchedules: [], emailCampaigns: [],
    dripSequences: [], automations: [], abTests: [],
    personalizationRules: [], referralCampaigns: [],
    loyaltyTiers: [], loyaltyTransactions: [],
    attributionResults: [], aiSuggestions: [], channelPerformance: [],
  };
}

function saveStore(store: MpStore) {
  try { localStorage.setItem(MP_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedMarketingData() {
  const store = getStore();
  if (store.leads.length > 0 || store.campaigns.length > 0) return;

  const now = Date.now();

  /* ---- Leads ---- */
  const leads: Lead[] = [
    { id: uid("lead"), name: "James Whitfield", email: "james.w@example.com", phone: "+1-212-555-0101", source: "web_form", status: "new", score: 72, scoreTier: "warm", company: "Whitfield & Co.", title: "CEO", country: "United States", city: "New York", tags: ["luxury", "high_intent"], notes: "Interested in wholesale partnership", createdAt: now - 86400000 * 2, lastActivityAt: now - 86400000, metadata: {} },
    { id: uid("lead"), name: "Sophie Laurent", email: "sophie.l@example.fr", source: "popup", status: "contacted", score: 88, scoreTier: "hot", country: "France", city: "Paris", tags: ["newsletter", "premium"], notes: "Signed up via popup, opened 3 emails", createdAt: now - 86400000 * 5, contactedAt: now - 86400000 * 3, lastActivityAt: now - 86400000, metadata: {} },
    { id: uid("lead"), name: "Raj Patel", email: "raj.p@example.in", phone: "+91-98765-43210", source: "referral", status: "qualified", score: 65, scoreTier: "warm", company: "Patel Enterprises", country: "India", city: "Mumbai", tags: ["referral", "b2b"], notes: "Referred by existing customer. Follow up re: bulk order.", createdAt: now - 86400000 * 10, contactedAt: now - 86400000 * 7, lastActivityAt: now - 86400000 * 2, metadata: {} },
    { id: uid("lead"), name: "Amara Okafor", email: "amara.o@example.ng", source: "social", status: "new", score: 45, scoreTier: "cold", country: "Nigeria", city: "Lagos", tags: ["social", "instagram"], notes: "Came from Instagram campaign", createdAt: now - 86400000, lastActivityAt: now - 43200000, metadata: {} },
    { id: uid("lead"), name: "Lena Müller", email: "lena.m@example.de", source: "email", status: "converted", score: 92, scoreTier: "hot", company: "Müller Design", title: "Creative Director", country: "Germany", city: "Berlin", tags: ["converted", "vip_potential"], notes: "Converted to customer after welcome series. Order #AL-12450.", createdAt: now - 86400000 * 14, contactedAt: now - 86400000 * 12, convertedAt: now - 86400000 * 3, convertedToCustomer: "cust_lena", lastActivityAt: now - 86400000 * 3, metadata: {} },
    { id: uid("lead"), name: "Carlos Rivera", email: "carlos.r@example.mx", source: "chat", status: "disqualified", score: 20, scoreTier: "cold", company: "Rivera Corp", country: "Mexico", city: "Mexico City", tags: ["disqualified"], notes: "Not in target market", createdAt: now - 86400000 * 20, lastActivityAt: now - 86400000 * 18, metadata: {} },
  ];

  /* ---- Scoring Rules ---- */
  const scoringRules: LeadScoringRule[] = [
    { id: uid("lsr"), name: "Email Open Recent", field: "email_engagement", operator: "gte", value: "3", points: 15, enabled: true },
    { id: uid("lsr"), name: "High Spend Industry", field: "company_size", operator: "gte", value: "50", points: 20, enabled: true },
    { id: uid("lsr"), name: "Has Phone Number", field: "phone", operator: "exists", value: "", points: 10, enabled: true },
    { id: uid("lsr"), name: "Referral Source", field: "source", operator: "equals", value: "referral", points: 25, enabled: true },
    { id: uid("lsr"), name: "Executive Title", field: "title", operator: "contains", value: "CEO", points: 30, enabled: true },
    { id: uid("lsr"), name: "Multiple Page Visits", field: "page_visits", operator: "gte", value: "5", points: 10, enabled: true },
  ];

  /* ---- Audiences ---- */
  const audiences: Audience[] = [
    { id: uid("aud"), name: "VIP High Spenders", description: "Top 10% of customers by revenue", source: "rule_based", status: "active", rules: [{ id: uid("ar"), group: "A", field: "total_spent", operator: "gte", value: "1000" }], memberCount: 3, estimatedReach: 5, tags: ["vip", "high_value"], color: "#9c7a4b", createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 2, lastEvaluatedAt: now - 86400000 },
    { id: uid("aud"), name: "Cart Abandoners (7d)", description: "Customers who abandoned cart in last 7 days", source: "rule_based", status: "active", rules: [{ id: uid("ar"), group: "A", field: "abandoned_cart_date", operator: "gte", value: String(now - 86400000 * 7) }], memberCount: 2, estimatedReach: 4, tags: ["cart", "recovery"], color: "#b14b46", createdAt: now - 86400000 * 14, updatedAt: now - 86400000, lastEvaluatedAt: now - 43200000 },
    { id: uid("aud"), name: "New Subscribers (30d)", description: "Leads who subscribed in last 30 days", source: "rule_based", status: "active", rules: [{ id: uid("ar"), group: "A", field: "created_at", operator: "gte", value: String(now - 86400000 * 30) }], memberCount: 3, estimatedReach: 6, tags: ["new", "onboarding"], color: "#4b7a52", createdAt: now - 86400000 * 10, updatedAt: now - 86400000 * 3, lastEvaluatedAt: now - 86400000 },
    { id: uid("aud"), name: "Luxury Shoppers", description: "Customers with luxury budget preference", source: "ai", status: "active", rules: [{ id: uid("ar"), group: "A", field: "budget_level", operator: "equals", value: "luxury" }, { id: uid("ar"), group: "A", field: "style_tags", operator: "contains", value: "luxury" }], memberCount: 2, estimatedReach: 3, tags: ["luxury", "premium"], color: "#b9802f", createdAt: now - 86400000 * 20, updatedAt: now - 86400000 * 5, lastEvaluatedAt: now - 86400000 * 2 },
    { id: uid("aud"), name: "At Risk Churn", description: "Customers with high churn probability", source: "ai", status: "active", rules: [{ id: uid("ar"), group: "A", field: "churn_probability", operator: "gte", value: "0.5" }], memberCount: 1, estimatedReach: 2, tags: ["churn", "retention"], color: "#dc2626", createdAt: now - 86400000 * 7, updatedAt: now - 86400000, lastEvaluatedAt: now - 86400000 },
    { id: uid("aud"), name: "High Intent Leads", description: "Leads with score > 70", source: "rule_based", status: "draft", rules: [{ id: uid("ar"), group: "A", field: "lead_score", operator: "gte", value: "70" }], memberCount: 0, estimatedReach: 3, tags: ["leads", "sales"], color: "#4f6da3", createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 3 },
  ];

  /* ---- Campaigns ---- */
  const campaigns: Campaign[] = [
    { id: uid("cmp"), name: "Summer Sale 2026", description: "Seasonal promotion across all channels", goal: "conversion", channels: ["email", "social", "search"], status: "active", audienceIds: [audiences[0].id, audiences[1].id], budget: 15000, spend: 4200, startAt: now - 86400000 * 5, endAt: now + 86400000 * 20, version: 2, tags: ["seasonal", "sale"], utmSource: "alaya", utmMedium: "campaign", utmCampaign: "summer_sale_2026", analytics: { impressions: 85000, clicks: 4200, ctr: 4.94, conversions: 280, conversionRate: 6.67, revenue: 68000, roi: 1519, cac: 15, uniqueReach: 32000, bounceRate: 32.5 }, createdAt: now - 86400000 * 14, updatedAt: now - 86400000 },
    { id: uid("cmp"), name: "New Customer Welcome", description: "Onboarding series for new signups", goal: "retention", channels: ["email", "sms"], status: "active", audienceIds: [audiences[2].id], budget: 2000, spend: 450, startAt: now - 86400000 * 30, endAt: now + 86400000 * 335, version: 1, tags: ["onboarding", "welcome"], utmSource: "alaya", utmMedium: "email", utmCampaign: "welcome_series", analytics: { impressions: 3200, clicks: 1800, ctr: 56.25, conversions: 410, conversionRate: 22.78, revenue: 55000, roi: 12111, cac: 1.1, uniqueReach: 1800, bounceRate: 1.2 }, createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 7 },
    { id: uid("cmp"), name: "VIP Exclusive Preview", description: "Early access to new collection for VIPs", goal: "loyalty", channels: ["email", "in_app"], status: "scheduled", audienceIds: [audiences[0].id], budget: 5000, spend: 0, scheduledAt: now + 86400000 * 3, startAt: now + 86400000 * 3, endAt: now + 86400000 * 17, version: 1, tags: ["vip", "exclusive", "preview"], utmSource: "alaya", utmMedium: "email", utmCampaign: "vip_preview", analytics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversionRate: 0, revenue: 0, roi: 0, cac: 0, uniqueReach: 0, bounceRate: 0 }, createdAt: now - 86400000 * 2, updatedAt: now - 86400000 },
    { id: uid("cmp"), name: "Abandoned Cart Recovery", description: "Re-engage cart abandoners with offers", goal: "conversion", channels: ["email", "push"], status: "active", audienceIds: [audiences[1].id], budget: 3000, spend: 800, startAt: now - 86400000 * 14, endAt: now + 86400000 * 14, version: 3, tags: ["cart", "recovery", "automation"], utmSource: "alaya", utmMedium: "email", utmCampaign: "cart_recovery", analytics: { impressions: 12000, clicks: 3800, ctr: 31.67, conversions: 320, conversionRate: 8.42, revenue: 42000, roi: 5150, cac: 2.5, uniqueReach: 4500, bounceRate: 2.1 }, createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 3 },
    { id: uid("cmp"), name: "Re-engagement Series", description: "Win back inactive customers", goal: "reactivation", channels: ["email", "sms"], status: "draft", audienceIds: [audiences[4].id], budget: 2000, spend: 0, version: 1, tags: ["re-engagement", "winback"], utmSource: "alaya", utmMedium: "email", utmCampaign: "re_engagement", analytics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversionRate: 0, revenue: 0, roi: 0, cac: 0, uniqueReach: 0, bounceRate: 0 }, createdAt: now - 86400000, updatedAt: now - 86400000 },
  ];

  /* ---- Email Campaigns ---- */
  const emailCampaigns: EmailCampaign[] = [
    { id: uid("ec"), campaignId: campaigns[0].id, name: "Summer Sale Launch", subject: "Summer is here — up to 40% off", preheader: "Exclusive early access inside", bodyHtml: "<h1>Summer Sale</h1><p>Shop our curated collection.</p>", bodyText: "Summer Sale — up to 40% off selected items.", senderName: "ALAYA INSIDER", senderEmail: "editorial@alayainsider.com", replyTo: "editorial@alayainsider.com", version: 1, status: "sent", createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 5 },
    { id: uid("ec"), campaignId: campaigns[1].id, name: "Welcome Email 1", subject: "Welcome to ALAYA INSIDER", preheader: "Your curated luxury journey starts here", bodyHtml: "<h1>Welcome</h1><p>Thank you for joining.</p>", bodyText: "Welcome to ALAYA INSIDER. We're thrilled to have you.", senderName: "ALAYA INSIDER", senderEmail: "editorial@alayainsider.com", replyTo: "editorial@alayainsider.com", version: 2, status: "sent", createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 7 },
    { id: uid("ec"), campaignId: campaigns[3].id, name: "Cart Recovery Email", subject: "You left something behind", preheader: "Your cart is waiting with a special offer", bodyHtml: "<h1>Complete your order</h1><p>Free shipping on orders over $200.</p>", bodyText: "Your cart is waiting. Complete your order now.", senderName: "ALAYA INSIDER", senderEmail: "orders@alayainsider.com", replyTo: "orders@alayainsider.com", version: 1, status: "ready", createdAt: now - 86400000 * 10, updatedAt: now - 86400000 * 2 },
  ];

  /* ---- Drip Sequences ---- */
  const dripSequences: DripSequence[] = [
    {
      id: uid("drip"), name: "Welcome Series", description: "5-email onboarding sequence", trigger: { type: "welcome", delayHours: 0, audienceIds: [audiences[2].id], cooldownDays: 365, maxPerCustomer: 1 },
      steps: [
        { id: uid("ds"), order: 1, delayDays: 0, subject: "Welcome to ALAYA INSIDER", body: "Thank you for joining our community. Here's what to expect." },
        { id: uid("ds"), order: 2, delayDays: 2, subject: "Discover your style", body: "Browse our curated collections hand-picked by our editors." },
        { id: uid("ds"), order: 3, delayDays: 5, subject: "Insider tips & tricks", body: "How to make the most of your ALAYA experience." },
        { id: uid("ds"), order: 4, delayDays: 10, subject: "Your exclusive offer", body: "Here's 10% off your next purchase — just for you." },
        { id: uid("ds"), order: 5, delayDays: 14, subject: "We'd love your feedback", body: "Tell us how your first month has been." },
      ],
      analytics: { totalEnrolled: 145, totalCompleted: 98, totalExited: 12, totalConverted: 72, conversionRate: 49.7, averageCompletionDays: 14, stepBreakdown: [] },
      status: "active", createdAt: now - 86400000 * 60, updatedAt: now - 86400000 * 5,
    },
    {
      id: uid("drip"), name: "Abandoned Cart Drip", description: "3-email recovery sequence", trigger: { type: "abandoned_cart", delayHours: 1, audienceIds: [audiences[1].id], cooldownDays: 7, maxPerCustomer: 3 },
      steps: [
        { id: uid("ds"), order: 1, delayDays: 0, subject: "Did you forget something?", body: "Your cart is still waiting for you." },
        { id: uid("ds"), order: 2, delayDays: 1, subject: "Still thinking about it?", body: "We've saved your items. Plus, free shipping on orders over $200." },
        { id: uid("ds"), order: 3, delayDays: 3, subject: "Last chance — 10% off your cart", body: "Use code SAVE10 to complete your order." },
      ],
      analytics: { totalEnrolled: 280, totalCompleted: 125, totalExited: 35, totalConverted: 98, conversionRate: 35.0, averageCompletionDays: 4, stepBreakdown: [] },
      status: "active", createdAt: now - 86400000 * 45, updatedAt: now - 86400000 * 3,
    },
    {
      id: uid("drip"), name: "Post-Purchase Follow-up", description: "Post-purchase care series", trigger: { type: "post_purchase", delayHours: 24, audienceIds: [], cooldownDays: 90, maxPerCustomer: 12 },
      steps: [
        { id: uid("ds"), order: 1, delayDays: 3, subject: "How's your new item?", body: "We'd love to hear your thoughts." },
        { id: uid("ds"), order: 2, delayDays: 14, subject: "Care & styling tips", body: "Get the most out of your purchase with our care guide." },
        { id: uid("ds"), order: 3, delayDays: 30, subject: "Complete the look", body: "Discover complementary pieces from our collection." },
      ],
      analytics: { totalEnrolled: 420, totalCompleted: 310, totalExited: 28, totalConverted: 185, conversionRate: 44.0, averageCompletionDays: 30, stepBreakdown: [] },
      status: "active", createdAt: now - 86400000 * 50, updatedAt: now - 86400000 * 2,
    },
  ];

  /* ---- Automations ---- */
  const automations: Automation[] = [
    {
      id: uid("auto"), name: "Welcome Email Sequence", description: "Send welcome series when new lead created", trigger: { type: "lead_created", delayMinutes: 0, cooldownHours: 0, maxPerContact: 1 },
      steps: [
        { id: uid("as"), order: 1, type: "send_email", config: { template: "welcome_1", subject: "Welcome!", body: "Thank you for joining." }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 2, type: "delay", config: { duration: "1440" }, delayMinutes: 1440, metadata: {} },
        { id: uid("as"), order: 3, type: "send_email", config: { template: "welcome_2", subject: "Discover your style", body: "Browse our collections." }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 4, type: "condition", config: { expression: "lead.score > 50" }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 5, type: "add_to_segment", config: { segment: "high_intent" }, delayMinutes: 0, metadata: {} },
      ],
      audienceIds: [audiences[2].id], stats: { totalEntered: 125, totalCompleted: 98, totalExited: 10, totalConverted: 65, conversionRate: 52.0, stepBreakdown: [] },
      status: "active", version: 2, createdAt: now - 86400000 * 45, updatedAt: now - 86400000 * 5,
    },
    {
      id: uid("auto"), name: "Abandoned Cart Recovery", description: "Recover abandoned carts with email + push", trigger: { type: "cart_abandoned", delayMinutes: 30, cooldownHours: 168, maxPerContact: 3 },
      steps: [
        { id: uid("as"), order: 1, type: "delay", config: { duration: "60" }, delayMinutes: 60, metadata: {} },
        { id: uid("as"), order: 2, type: "send_email", config: { template: "cart_1", subject: "Did you forget something?", body: "Your cart is waiting." }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 3, type: "delay", config: { duration: "1440" }, delayMinutes: 1440, metadata: {} },
        { id: uid("as"), order: 4, type: "send_push", config: { title: "Still thinking?", body: "Your items are still available!" }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 5, type: "delay", config: { duration: "2880" }, delayMinutes: 2880, metadata: {} },
        { id: uid("as"), order: 6, type: "send_email", config: { template: "cart_2", subject: "Last chance — 10% off", body: "Use code SAVE10." }, delayMinutes: 0, metadata: {} },
      ],
      audienceIds: [audiences[1].id], stats: { totalEntered: 280, totalCompleted: 125, totalExited: 35, totalConverted: 98, conversionRate: 35.0, stepBreakdown: [] },
      status: "active", version: 3, createdAt: now - 86400000 * 35, updatedAt: now - 86400000 * 2,
    },
    {
      id: uid("auto"), name: "High Score Lead Alert", description: "Notify sales team of hot leads", trigger: { type: "lead_scored", delayMinutes: 0, cooldownHours: 24, maxPerContact: 5 },
      steps: [
        { id: uid("as"), order: 1, type: "condition", config: { expression: "lead.score >= 80" }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 2, type: "send_email", config: { template: "lead_alert", subject: "Hot lead alert!", body: "Lead {{lead.name}} scored {{lead.score}}" }, delayMinutes: 0, metadata: {} },
        { id: uid("as"), order: 3, type: "send_in_app", config: { title: "New hot lead", body: "{{lead.name}} — score: {{lead.score}}" }, delayMinutes: 0, metadata: {} },
      ],
      audienceIds: [], stats: { totalEntered: 45, totalCompleted: 42, totalExited: 0, totalConverted: 38, conversionRate: 84.4, stepBreakdown: [] },
      status: "active", version: 1, createdAt: now - 86400000 * 20, updatedAt: now - 86400000 * 5,
    },
    {
      id: uid("auto"), name: "Post-Purchase Upsell", description: "Recommend complementary products after purchase", trigger: { type: "order_placed", delayMinutes: 1440, cooldownHours: 720, maxPerContact: 6 },
      steps: [
        { id: uid("as"), order: 1, type: "delay", config: { duration: "4320" }, delayMinutes: 4320, metadata: {} },
        { id: uid("as"), order: 2, type: "send_email", config: { template: "upsell_1", subject: "Complete your look", body: "Items that pair perfectly with your purchase." }, delayMinutes: 0, metadata: {} },
      ],
      audienceIds: [], stats: { totalEntered: 180, totalCompleted: 145, totalExited: 8, totalConverted: 62, conversionRate: 34.4, stepBreakdown: [] },
      status: "draft", version: 1, createdAt: now - 86400000 * 10, updatedAt: now - 86400000 * 3,
    },
  ];

  /* ---- A/B Tests ---- */
  const abTests: AbTest[] = [
    {
      id: uid("ab"), name: "Summer Sale Subject Line Test", description: "Test subject line effectiveness for Summer Sale email", type: "subject_line", status: "completed",
      variants: [
        { id: uid("abv"), name: "Control", content: "Summer Sale — up to 40% off", trafficPercent: 50, impressions: 12500, conversions: 420, conversionRate: 3.36, isControl: true },
        { id: uid("abv"), name: "Variant A", content: "☀️ Your summer edit is here — up to 40% off", trafficPercent: 50, impressions: 12800, conversions: 510, conversionRate: 3.98, isControl: false },
      ],
      audienceSplit: 100, sampleSize: 25300, confidenceLevel: 95, winnerId: undefined, durationDays: 3, startAt: now - 86400000 * 10, endAt: now - 86400000 * 7,
      metrics: { totalImpressions: 25300, totalConversions: 930, overallConversionRate: 3.68, liftOverControl: 18.5, significanceLevel: 97.2, winnerConfidence: 97.2 },
      createdAt: now - 86400000 * 12, updatedAt: now - 86400000 * 7,
    },
    {
      id: uid("ab"), name: "Landing Page CTA Test", description: "Test CTA button copy on landing page", type: "cta", status: "running",
      variants: [
        { id: uid("abv"), name: "Control", content: "Shop Now", trafficPercent: 50, impressions: 8400, conversions: 252, conversionRate: 3.0, isControl: true },
        { id: uid("abv"), name: "Variant A", content: "Explore the Collection", trafficPercent: 25, impressions: 4200, conversions: 147, conversionRate: 3.5, isControl: false },
        { id: uid("abv"), name: "Variant B", content: "Get Early Access", trafficPercent: 25, impressions: 4100, conversions: 160, conversionRate: 3.9, isControl: false },
      ],
      audienceSplit: 100, sampleSize: 16700, confidenceLevel: 95, durationDays: 7, startAt: now - 86400000 * 3,
      metrics: { totalImpressions: 16700, totalConversions: 559, overallConversionRate: 3.35, liftOverControl: 16.7, significanceLevel: 0, winnerConfidence: 0 },
      createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 3,
    },
    {
      id: uid("ab"), name: "Welcome Email Content Test", description: "Test different welcome email copy", type: "content", status: "draft",
      variants: [
        { id: uid("abv"), name: "Control", content: "Standard welcome copy", trafficPercent: 50, impressions: 0, conversions: 0, conversionRate: 0, isControl: true },
        { id: uid("abv"), name: "Variant A", content: "Story-driven welcome with founder note", trafficPercent: 50, impressions: 0, conversions: 0, conversionRate: 0, isControl: false },
      ],
      audienceSplit: 100, sampleSize: 5000, confidenceLevel: 95, durationDays: 5,
      metrics: { totalImpressions: 0, totalConversions: 0, overallConversionRate: 0, liftOverControl: 0, significanceLevel: 0, winnerConfidence: 0 },
      createdAt: now - 86400000, updatedAt: now - 86400000,
    },
  ];

  /* ---- Personalization Rules ---- */
  const personalizationRules: PersonalizationRule[] = [
    { id: uid("pr"), name: "VIP Banner", description: "Show VIP exclusive banner for high-value customers", channel: "web", condition: { field: "customer_type", operator: "equals", value: "vip" }, action: { type: "show_banner", config: { banner_id: "vip_exclusive", message: "Welcome VIP member!" } }, priority: 100, enabled: true, createdAt: now - 86400000 * 30 },
    { id: uid("pr"), name: "New Visitor Popup", description: "Show welcome popup to first-time visitors", channel: "web", condition: { field: "visit_count", operator: "equals", value: "1" }, action: { type: "show_popup", config: { popup_id: "welcome_offer", message: "Welcome! Get 10% off." } }, priority: 50, enabled: true, createdAt: now - 86400000 * 14 },
    { id: uid("pr"), name: "Returning Customer Offer", description: "Show loyalty offer to returning customers", channel: "web", condition: { field: "order_count", operator: "gte", value: "1" }, action: { type: "change_offer", config: { offer: "free_shipping", message: "Free shipping on your next order!" } }, priority: 75, enabled: true, createdAt: now - 86400000 * 7 },
  ];

  /* ---- Referral Campaigns ---- */
  const referralCampaigns: ReferralCampaign[] = [
    { id: uid("refc"), name: "Refer a Friend", description: "Earn $50 credit for each referral who makes a purchase", rewardType: "credit", rewardValue: 50, rewardDescription: "$50 store credit", referrerReward: "$50 credit", refereeReward: "15% off first order", minPurchase: 100, maxReferrals: 20, expiryDays: 90, status: "active", analytics: { totalClicks: 1250, totalSignups: 320, totalConversions: 185, conversionRate: 57.8, rewardCost: 9250, revenueGenerated: 82000, roi: 787 }, createdAt: now - 86400000 * 60 },
    { id: uid("refc"), name: "Insider Circle", description: "Exclusive referral program for VIP customers", rewardType: "tier_upgrade", rewardValue: 0, rewardDescription: "Exclusive VIP benefits", referrerReward: "VIP status + $100 credit", refereeReward: "$50 welcome credit", minPurchase: 250, maxReferrals: 50, expiryDays: 180, status: "active", analytics: { totalClicks: 420, totalSignups: 85, totalConversions: 52, conversionRate: 61.2, rewardCost: 5200, revenueGenerated: 48000, roi: 823 }, createdAt: now - 86400000 * 30 },
    { id: uid("refc"), name: "Summer Referral Boost", description: "Double rewards during summer campaign", rewardType: "credit", rewardValue: 100, rewardDescription: "$100 store credit (double)", referrerReward: "$100 credit", refereeReward: "20% off + free shipping", minPurchase: 50, maxReferrals: 10, expiryDays: 30, status: "draft", analytics: { totalClicks: 0, totalSignups: 0, totalConversions: 0, conversionRate: 0, rewardCost: 0, revenueGenerated: 0, roi: 0 }, createdAt: now - 86400000 * 2 },
  ];

  /* ---- Loyalty Tiers ---- */
  const loyaltyTiers: LoyaltyTierDefinition[] = [
    { id: uid("lt"), name: "Silver", description: "Entry-level tier", minPoints: 0, pointsMultiplier: 1, benefits: ["Earn 1 point per $1", "Birthday reward", "Exclusive newsletters"], color: "#a0aec0", icon: "star" },
    { id: uid("lt"), name: "Gold", description: "Mid-tier benefits", minPoints: 500, pointsMultiplier: 1.5, benefits: ["Earn 1.5x points", "Free shipping", "Early sale access", "Priority support"], color: "#d4af37", icon: "award" },
    { id: uid("lt"), name: "Platinum", description: "Premium tier", minPoints: 2000, pointsMultiplier: 2, benefits: ["Earn 2x points", "Free express shipping", "VIP early access", "Personal stylist", "Exclusive gifts"], color: "#9c7a4b", icon: "crown" },
    { id: uid("lt"), name: "Diamond", description: "Top-tier luxury", minPoints: 5000, pointsMultiplier: 3, benefits: ["Earn 3x points", "Complimentary returns", "Private events", "Concierge service", "Annual gift", "Extended returns"], color: "#4f6da3", icon: "gem" },
  ];

  /* ---- Loyalty Transactions ---- */
  const loyaltyTransactions: LoyaltyTransaction[] = [
    { id: uid("ltx"), customerId: "synth_eleanor", type: "earn", points: 420, balance: 2800, reason: "Purchase: Order #AL-12480", orderId: "ord_12480", createdAt: now - 86400000 * 3 },
    { id: uid("ltx"), customerId: "synth_eleanor", type: "spend", points: 500, balance: 2300, reason: "Redeemed: $50 gift card", createdAt: now - 86400000 * 14 },
    { id: uid("ltx"), customerId: "synth_eleanor", type: "bonus", points: 200, balance: 2800, reason: "Birthday bonus points", createdAt: now - 86400000 * 21 },
    { id: uid("ltx"), customerId: "cust_isabella", type: "earn", points: 150, balance: 650, reason: "Purchase: Order #AL-12460", orderId: "ord_12460", createdAt: now - 86400000 * 5 },
    { id: uid("ltx"), customerId: "cust_meera", type: "earn", points: 280, balance: 1200, reason: "Purchase: Order #AL-12470", orderId: "ord_12470", createdAt: now - 86400000 * 2 },
  ];

  /* ---- AI Suggestions ---- */
  const aiSuggestions: AiMarketingSuggestion[] = [
    { id: uid("ais"), type: "campaign_idea", title: "Seasonal Gift Guide Campaign", description: "Create a gift guide campaign targeting high-intent shoppers with product recommendations based on past purchases.", confidence: 0.85, impact: "high", metadata: { season: "summer", audience: "high_intent" }, createdAt: now - 86400000 * 2 },
    { id: uid("ais"), type: "audience_suggestion", title: "Lookalike Audience: VIPs", description: "Build a lookalike audience based on your top 10 VIP customers to find similar high-value prospects.", confidence: 0.78, impact: "high", metadata: { source: "vip" }, createdAt: now - 86400000 * 3 },
    { id: uid("ais"), type: "subject_line", title: "Urgency Subject Line", description: "Test subject lines with urgency signals like 'Last chance' or 'Ending soon' to improve open rates.", confidence: 0.72, impact: "medium", metadata: { metric: "open_rate" }, createdAt: now - 86400000 },
    { id: uid("ais"), type: "optimization", title: "Abandoned Cart Timing", description: "Current delay is 30 min. Consider reducing to 15 min for mobile users who convert faster.", confidence: 0.81, impact: "medium", metadata: { automation: "cart_recovery" }, createdAt: now - 86400000 * 4 },
    { id: uid("ais"), type: "strategy", title: "Multi-Channel Attribution", description: "Implement position-based attribution to better understand the role of each channel in the customer journey.", confidence: 0.69, impact: "high", metadata: { area: "analytics" }, createdAt: now - 86400000 * 7 },
  ];

  /* ---- Attribution Results ---- */
  const attributionResults: AttributionResult[] = [
    { campaignId: campaigns[0].id, campaignName: "Summer Sale 2026", channel: "email", touchpoint: 1, attributedConversions: 120, attributedRevenue: 28000, attributionShare: 42.9, attributedRevenueByModel: { first_touch: 18000, last_touch: 22000, linear: 14000, position_based: 16000, time_decay: 17000, custom: 17000 } },
    { campaignId: campaigns[0].id, campaignName: "Summer Sale 2026", channel: "social", touchpoint: 2, attributedConversions: 80, attributedRevenue: 18000, attributionShare: 28.6, attributedRevenueByModel: { first_touch: 16000, last_touch: 8000, linear: 9000, position_based: 10000, time_decay: 9500, custom: 9500 } },
    { campaignId: campaigns[0].id, campaignName: "Summer Sale 2026", channel: "search", touchpoint: 3, attributedConversions: 60, attributedRevenue: 14000, attributionShare: 21.4, attributedRevenueByModel: { first_touch: 10000, last_touch: 12000, linear: 7000, position_based: 8000, time_decay: 8500, custom: 8500 } },
    { campaignId: campaigns[3].id, campaignName: "Abandoned Cart Recovery", channel: "email", touchpoint: 1, attributedConversions: 240, attributedRevenue: 32000, attributionShare: 75.0, attributedRevenueByModel: { first_touch: 28000, last_touch: 32000, linear: 16000, position_based: 20000, time_decay: 22000, custom: 22000 } },
    { campaignId: campaigns[3].id, campaignName: "Abandoned Cart Recovery", channel: "push", touchpoint: 2, attributedConversions: 80, attributedRevenue: 10000, attributionShare: 25.0, attributedRevenueByModel: { first_touch: 6000, last_touch: 10000, linear: 5000, position_based: 6000, time_decay: 7000, custom: 7000 } },
  ];

  /* ---- Channel Performance ---- */
  const _channelPerformance: ChannelPerformance[] = [
    { channel: "email", spend: 4500, impressions: 110000, clicks: 16000, ctr: 14.55, conversions: 1250, cvr: 7.81, revenue: 185000, roi: 4011, cac: 3.6 },
    { channel: "social", spend: 8000, impressions: 215000, clicks: 9800, ctr: 4.56, conversions: 420, cvr: 4.29, revenue: 65000, roi: 713, cac: 19.0 },
    { channel: "search", spend: 6000, impressions: 95000, clicks: 7200, ctr: 7.58, conversions: 380, cvr: 5.28, revenue: 52000, roi: 767, cac: 15.8 },
    { channel: "affiliate", spend: 12000, impressions: 78000, clicks: 2800, ctr: 3.59, conversions: 145, cvr: 5.18, revenue: 42000, roi: 250, cac: 82.8 },
    { channel: "sms", spend: 1500, impressions: 15000, clicks: 3200, ctr: 21.33, conversions: 180, cvr: 5.63, revenue: 24000, roi: 1500, cac: 8.3 },
    { channel: "content", spend: 2000, impressions: 35000, clicks: 1800, ctr: 5.14, conversions: 95, cvr: 5.28, revenue: 15000, roi: 650, cac: 21.1 },
  ];

  store.leads = leads;
  store.scoringRules = scoringRules;
  store.audiences = audiences;
  store.campaigns = campaigns;
  store.emailCampaigns = emailCampaigns;
  store.dripSequences = dripSequences;
  store.automations = automations;
  store.abTests = abTests;
  store.personalizationRules = personalizationRules;
  store.referralCampaigns = referralCampaigns;
  store.loyaltyTiers = loyaltyTiers;
  store.loyaltyTransactions = loyaltyTransactions;
  store.aiSuggestions = aiSuggestions;
  store.attributionResults = attributionResults;
  store.channelPerformance = _channelPerformance;
  saveStore(store);
  pushLog("info", "system", "Marketing Platform seeded successfully");
}

seedMarketingData();

/* ================================================================== */
/*  LEAD MANAGEMENT                                                     */
/* ================================================================== */

export function getLeads(): Lead[] {
  return getStore().leads;
}

export function getLead(id: string): Lead | undefined {
  return getStore().leads.find((l) => l.id === id);
}

export function createLead(input: Omit<Lead, "id" | "score" | "scoreTier" | "status" | "createdAt" | "lastActivityAt">): Lead {
  const store = getStore();
  const lead: Lead = {
    ...input,
    id: uid("lead"),
    score: 0,
    scoreTier: "cold",
    status: "new",
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  // Apply scoring rules
  const score = evaluateLeadScore(lead, store.scoringRules);
  lead.score = score;
  lead.scoreTier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  store.leads.push(lead);
  if (store.leads.length > MAX_LEADS) store.leads = store.leads.slice(-MAX_LEADS);
  saveStore(store);
  return lead;
}

export function updateLead(id: string, patch: Partial<Lead>): Lead | null {
  const store = getStore();
  const idx = store.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  store.leads[idx] = { ...store.leads[idx], ...patch, lastActivityAt: Date.now() };
  // Re-evaluate score if status changed
  if (patch.status) {
    store.leads[idx].score = evaluateLeadScore(store.leads[idx], store.scoringRules);
    store.leads[idx].scoreTier = store.leads[idx].score >= 70 ? "hot" : store.leads[idx].score >= 40 ? "warm" : "cold";
  }
  saveStore(store);
  return store.leads[idx];
}

export function deleteLead(id: string): boolean {
  const store = getStore();
  store.leads = store.leads.filter((l) => l.id !== id);
  saveStore(store);
  return true;
}

export function getScoringRules(): LeadScoringRule[] {
  return getStore().scoringRules;
}

export function createScoringRule(input: Omit<LeadScoringRule, "id">): LeadScoringRule {
  const store = getStore();
  const rule: LeadScoringRule = { ...input, id: uid("lsr") };
  store.scoringRules.push(rule);
  saveStore(store);
  return rule;
}

function evaluateLeadScore(lead: Lead, rules: LeadScoringRule[]): number {
  let score = 0;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const val = (lead as any)[rule.field]?.toString() || "";
    switch (rule.operator) {
      case "equals": if (val.toLowerCase() === rule.value.toLowerCase()) score += rule.points; break;
      case "contains": if (val.toLowerCase().includes(rule.value.toLowerCase())) score += rule.points; break;
      case "gt": if (Number(val) > Number(rule.value)) score += rule.points; break;
      case "gte": if (Number(val) >= Number(rule.value)) score += rule.points; break;
      case "lt": if (Number(val) < Number(rule.value)) score += rule.points; break;
      case "lte": if (Number(val) <= Number(rule.value)) score += rule.points; break;
      case "exists": if (val) score += rule.points; break;
    }
  }
  return Math.min(100, Math.max(0, score));
}

/* ================================================================== */
/*  AUDIENCE & CDP                                                     */
/* ================================================================== */

export function getAudiences(): Audience[] {
  return getStore().audiences;
}

export function createAudience(input: Omit<Audience, "id" | "createdAt" | "updatedAt" | "memberCount" | "estimatedReach">): Audience {
  const store = getStore();
  const aud: Audience = { ...input, id: uid("aud"), memberCount: 0, estimatedReach: 0, createdAt: Date.now(), updatedAt: Date.now() };
  store.audiences.push(aud);
  if (store.audiences.length > MAX_AUDIENCES) store.audiences = store.audiences.slice(-MAX_AUDIENCES);
  saveStore(store);
  return aud;
}

export function updateAudience(id: string, patch: Partial<Audience>): Audience | null {
  const store = getStore();
  const idx = store.audiences.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.audiences[idx] = { ...store.audiences[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.audiences[idx];
}

export function deleteAudience(id: string): boolean {
  const store = getStore();
  store.audiences = store.audiences.filter((a) => a.id !== id);
  saveStore(store);
  return true;
}

export function evaluateAudience(id: string): { memberCount: number; members: string[] } {
  const store = getStore();
  const aud = store.audiences.find((a) => a.id === id);
  if (!aud || aud.rules.length === 0) return { memberCount: 0, members: [] };

  // Evaluate against leads and CDP profiles
  const leads = store.leads;
  const profileMatches = store.cdpProfiles.filter((p) => {
    return aud.rules.every((r) => {
      const val = (p as any)[r.field]?.toString() || "";
      return evaluateAudienceCriterion(val, r.operator, r.value);
    });
  });

  aud.memberCount = profileMatches.length + leads.filter((l) => l.status !== "disqualified" && l.status !== "lost").length;
  aud.estimatedReach = Math.round(aud.memberCount * 1.4);
  aud.lastEvaluatedAt = Date.now();
  saveStore(store);
  return { memberCount: aud.memberCount, members: profileMatches.map((m) => m.customerId) };
}

function evaluateAudienceCriterion(value: string, operator: string, target: string): boolean {
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
    case "exists": return !!value && value !== "0" && value !== "undefined" && value !== "null";
    case "not_exists": return !value || value === "undefined" || value === "null";
    default: return false;
  }
}

export function getCdpProfiles(): CdpProfile[] {
  return getStore().cdpProfiles;
}

export function getCdpProfile(customerId: string): CdpProfile | undefined {
  return getStore().cdpProfiles.find((p) => p.customerId === customerId);
}

/* ================================================================== */
/*  CAMPAIGN MANAGEMENT                                                */
/* ================================================================== */

export function getCampaigns(): Campaign[] {
  return getStore().campaigns;
}

export function getCampaign(id: string): Campaign | undefined {
  return getStore().campaigns.find((c) => c.id === id);
}

export function createCampaign(input: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "analytics" | "version">): Campaign {
  const store = getStore();
  const camp: Campaign = {
    ...input,
    id: uid("cmp"),
    analytics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversionRate: 0, revenue: 0, roi: 0, cac: 0, uniqueReach: 0, bounceRate: 0 },
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.campaigns.push(camp);
  saveStore(store);
  return camp;
}

export function updateCampaign(id: string, patch: Partial<Campaign>): Campaign | null {
  const store = getStore();
  const idx = store.campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.campaigns[idx] = { ...store.campaigns[idx], ...patch, updatedAt: Date.now(), version: store.campaigns[idx].version + 1 };
  saveStore(store);
  return store.campaigns[idx];
}

export function deleteCampaign(id: string): boolean {
  const store = getStore();
  store.campaigns = store.campaigns.filter((c) => c.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  EMAIL MARKETING & DRIP SEQUENCES                                   */
/* ================================================================== */

export function getEmailCampaigns(): EmailCampaign[] {
  return getStore().emailCampaigns;
}

export function createEmailCampaign(input: Omit<EmailCampaign, "id" | "createdAt" | "updatedAt">): EmailCampaign {
  const store = getStore();
  const ec: EmailCampaign = { ...input, id: uid("ec"), createdAt: Date.now(), updatedAt: Date.now() };
  store.emailCampaigns.push(ec);
  saveStore(store);
  return ec;
}

export function getDripSequences(): DripSequence[] {
  return getStore().dripSequences;
}

export function createDripSequence(input: Omit<DripSequence, "id" | "createdAt" | "updatedAt" | "analytics">): DripSequence {
  const store = getStore();
  const ds: DripSequence = {
    ...input,
    id: uid("drip"),
    analytics: { totalEnrolled: 0, totalCompleted: 0, totalExited: 0, totalConverted: 0, conversionRate: 0, averageCompletionDays: 0, stepBreakdown: [] },
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  store.dripSequences.push(ds);
  saveStore(store);
  return ds;
}

/* ================================================================== */
/*  MARKETING AUTOMATION                                               */
/* ================================================================== */

export function getAutomations(): Automation[] {
  return getStore().automations;
}

export function createAutomation(input: Omit<Automation, "id" | "createdAt" | "updatedAt" | "stats" | "version">): Automation {
  const store = getStore();
  const auto: Automation = {
    ...input,
    id: uid("auto"),
    stats: { totalEntered: 0, totalCompleted: 0, totalExited: 0, totalConverted: 0, conversionRate: 0, stepBreakdown: [] },
    version: 1,
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  store.automations.push(auto);
  if (store.automations.length > MAX_AUTOMATIONS) store.automations = store.automations.slice(-MAX_AUTOMATIONS);
  saveStore(store);
  return auto;
}

export function updateAutomation(id: string, patch: Partial<Automation>): Automation | null {
  const store = getStore();
  const idx = store.automations.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.automations[idx] = { ...store.automations[idx], ...patch, updatedAt: Date.now(), version: store.automations[idx].version + 1 };
  saveStore(store);
  return store.automations[idx];
}

export function deleteAutomation(id: string): boolean {
  const store = getStore();
  store.automations = store.automations.filter((a) => a.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  A/B TESTING                                                       */
/* ================================================================== */

export function getAbTests(): AbTest[] {
  return getStore().abTests;
}

export function createAbTest(input: Omit<AbTest, "id" | "createdAt" | "updatedAt" | "metrics">): AbTest {
  const store = getStore();
  const test: AbTest = {
    ...input,
    id: uid("ab"),
    metrics: { totalImpressions: 0, totalConversions: 0, overallConversionRate: 0, liftOverControl: 0, significanceLevel: 0, winnerConfidence: 0 },
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  store.abTests.push(test);
  if (store.abTests.length > MAX_AB_TESTS) store.abTests = store.abTests.slice(-MAX_AB_TESTS);
  saveStore(store);
  return test;
}

export function updateAbTest(id: string, patch: Partial<AbTest>): AbTest | null {
  const store = getStore();
  const idx = store.abTests.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.abTests[idx] = { ...store.abTests[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.abTests[idx];
}

export function declareAbTestWinner(testId: string, variantId: string): AbTest | null {
  const store = getStore();
  const test = store.abTests.find((t) => t.id === testId);
  if (!test) return null;
  const variant = test.variants.find((v) => v.id === variantId);
  if (!variant) return null;
  test.winnerId = variantId;
  test.status = "completed";
  test.metrics.winnerConfidence = test.metrics.significanceLevel;
  // Calculate lift
  const control = test.variants.find((v) => v.isControl);
  if (control && control.conversionRate > 0) {
    test.metrics.liftOverControl = parseFloat((((variant.conversionRate - control.conversionRate) / control.conversionRate) * 100).toFixed(1));
  }
  saveStore(store);
  return test;
}

/* ================================================================== */
/*  PERSONALIZATION ENGINE                                             */
/* ================================================================== */

export function getPersonalizationRules(): PersonalizationRule[] {
  return getStore().personalizationRules;
}

export function createPersonalizationRule(input: Omit<PersonalizationRule, "id" | "createdAt">): PersonalizationRule {
  const store = getStore();
  const rule: PersonalizationRule = { ...input, id: uid("pr"), createdAt: Date.now() };
  store.personalizationRules.push(rule);
  saveStore(store);
  return rule;
}

/* ================================================================== */
/*  REFERRAL & LOYALTY                                                 */
/* ================================================================== */

export function getReferralCampaigns(): ReferralCampaign[] {
  return getStore().referralCampaigns;
}

export function createReferralCampaign(input: Omit<ReferralCampaign, "id" | "createdAt" | "analytics">): ReferralCampaign {
  const store = getStore();
  const rc: ReferralCampaign = {
    ...input,
    id: uid("refc"),
    analytics: { totalClicks: 0, totalSignups: 0, totalConversions: 0, conversionRate: 0, rewardCost: 0, revenueGenerated: 0, roi: 0 },
    createdAt: Date.now(),
  };
  store.referralCampaigns.push(rc);
  saveStore(store);
  return rc;
}

export function getLoyaltyTiers(): LoyaltyTierDefinition[] {
  return getStore().loyaltyTiers;
}

export function getLoyaltyTransactions(): LoyaltyTransaction[] {
  return getStore().loyaltyTransactions;
}

export function addLoyaltyTransaction(input: Omit<LoyaltyTransaction, "id" | "createdAt">): LoyaltyTransaction {
  const store = getStore();
  const tx: LoyaltyTransaction = { ...input, id: uid("ltx"), createdAt: Date.now() };
  store.loyaltyTransactions.push(tx);
  saveStore(store);
  return tx;
}

/* ================================================================== */
/*  ATTRIBUTION                                                        */
/* ================================================================== */

export function getAttributionResults(): AttributionResult[] {
  return getStore().attributionResults;
}

export function calculateAttribution(campaignId: string, model: AttributionModel): AttributionResult[] {
  const store = getStore();
  const campaign = store.campaigns.find((c) => c.id === campaignId);
  if (!campaign) return [];
  return store.attributionResults.filter((r) => r.campaignId === campaignId).map((r) => ({
    ...r,
    attributedRevenue: r.attributedRevenueByModel[model] || r.attributedRevenue,
  }));
}

/* ================================================================== */
/*  MARKETING ANALYTICS & FORECASTING                                  */
/* ================================================================== */

export function getMarketingMetrics(): MarketingMetric[] {
  void(Date.now());
  const store = getStore();
  const campaigns = store.campaigns;
  const totalRevenue = campaigns.reduce((s, c) => s + c.analytics.revenue, 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.analytics.conversions, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.analytics.impressions, 0);

  return [
    { id: uid("mm"), name: "Total Marketing Revenue", category: "revenue", currentValue: totalRevenue, previousValue: Math.round(totalRevenue * 0.85), targetValue: Math.round(totalRevenue * 1.3), unit: "$", trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(30000 + Math.random() * 60000)) },
    { id: uid("mm"), name: "Campaign ROI", category: "roi", currentValue: totalSpend > 0 ? Math.round(totalRevenue / totalSpend * 100) : 0, previousValue: 850, targetValue: 1500, unit: "%", trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => Math.round(400 + Math.random() * 800)) },
    { id: uid("mm"), name: "Conversion Rate", category: "conversion", currentValue: totalImpressions > 0 ? parseFloat(((totalConversions / totalImpressions) * 100).toFixed(2)) : 0, previousValue: 3.2, targetValue: 5.0, unit: "%", trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => parseFloat((2 + Math.random() * 3).toFixed(1))) },
    { id: uid("mm"), name: "Customer Acquisition Cost", category: "acquisition", currentValue: totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0, previousValue: 22, targetValue: 15, unit: "$", trend: "down", status: "warning", sparkline: Array.from({ length: 12 }, () => Math.round(12 + Math.random() * 20)) },
    { id: uid("mm"), name: "Email Open Rate", category: "engagement", currentValue: 42.5, previousValue: 40.2, targetValue: 50.0, unit: "%", trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((30 + Math.random() * 18).toFixed(1))) },
    { id: uid("mm"), name: "Click-Through Rate", category: "engagement", currentValue: 4.85, previousValue: 4.2, targetValue: 6.0, unit: "%", trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((2.5 + Math.random() * 3.5).toFixed(2))) },
    { id: uid("mm"), name: "Retention Rate", category: "retention", currentValue: 68.5, previousValue: 65.0, targetValue: 75.0, unit: "%", trend: "up", status: "good", sparkline: Array.from({ length: 12 }, () => parseFloat((55 + Math.random() * 18).toFixed(1))) },
    { id: uid("mm"), name: "Lead Conversion Rate", category: "conversion", currentValue: 22.3, previousValue: 20.1, targetValue: 30.0, unit: "%", trend: "up", status: "warning", sparkline: Array.from({ length: 12 }, () => parseFloat((12 + Math.random() * 15).toFixed(1))) },
  ];
}

export function getChannelPerformance(): ChannelPerformance[] {
  return [
    { channel: "email", spend: 4500, impressions: 110000, clicks: 16000, ctr: 14.55, conversions: 1250, cvr: 7.81, revenue: 185000, roi: 4011, cac: 3.6 },
    { channel: "social", spend: 8000, impressions: 215000, clicks: 9800, ctr: 4.56, conversions: 420, cvr: 4.29, revenue: 65000, roi: 713, cac: 19.0 },
    { channel: "search", spend: 6000, impressions: 95000, clicks: 7200, ctr: 7.58, conversions: 380, cvr: 5.28, revenue: 52000, roi: 767, cac: 15.8 },
    { channel: "affiliate", spend: 12000, impressions: 78000, clicks: 2800, ctr: 3.59, conversions: 145, cvr: 5.18, revenue: 42000, roi: 250, cac: 82.8 },
    { channel: "sms", spend: 1500, impressions: 15000, clicks: 3200, ctr: 21.33, conversions: 180, cvr: 5.63, revenue: 24000, roi: 1500, cac: 8.3 },
    { channel: "content", spend: 2000, impressions: 35000, clicks: 1800, ctr: 5.14, conversions: 95, cvr: 5.28, revenue: 15000, roi: 650, cac: 21.1 },
  ];
}

export function getGrowthForecasts(): GrowthForecast[] {
  const store = getStore();
  const totalRevenue = store.campaigns.reduce((s, c) => s + c.analytics.revenue, 0);
  return [
    { metric: "Marketing Revenue", currentValue: totalRevenue, predictedNextMonth: Math.round(totalRevenue * 1.18), predictedNextQuarter: Math.round(totalRevenue * 1.45), lowerBound: Math.round(totalRevenue * 0.9), upperBound: Math.round(totalRevenue * 1.5), confidence: 0.84, trend: "up", drivers: ["New campaign launches", "Growing email list", "Channel expansion"] },
    { metric: "Email Open Rate (%)", currentValue: 42.5, predictedNextMonth: 44.8, predictedNextQuarter: 48.2, lowerBound: 40, upperBound: 52, confidence: 0.82, trend: "up", drivers: ["A/B testing improvements", "Better segmentation", "Personalization"] },
    { metric: "Conversion Rate (%)", currentValue: 3.35, predictedNextMonth: 3.8, predictedNextQuarter: 4.2, lowerBound: 3.0, upperBound: 5.0, confidence: 0.76, trend: "up", drivers: ["Landing page optimization", "CTA testing", "Improved targeting"] },
    { metric: "Customer Acquisition Cost ($)", currentValue: 15.8, predictedNextMonth: 14.2, predictedNextQuarter: 12.5, lowerBound: 10, upperBound: 18, confidence: 0.79, trend: "down", drivers: ["Organic growth increase", "Referral program", "Content marketing"] },
    { metric: "New Leads (Monthly)", currentValue: 15, predictedNextMonth: 22, predictedNextQuarter: 35, lowerBound: 15, upperBound: 50, confidence: 0.72, trend: "up", drivers: ["SEO improvements", "Social campaigns", "Lead magnets"] },
    { metric: "Referral Revenue ($)", currentValue: store.referralCampaigns.reduce((s, r) => s + r.analytics.revenueGenerated, 0), predictedNextMonth: 18000, predictedNextQuarter: 55000, lowerBound: 12000, upperBound: 80000, confidence: 0.74, trend: "up", drivers: ["Referral boost campaign", "VIP program expansion", "Higher rewards"] },
  ];
}

export function getMarketingDashboard(): MarketingDashboardData {
  const store = getStore();
  const campaigns = store.campaigns;
  const totalRevenue = campaigns.reduce((s, c) => s + c.analytics.revenue, 0);
  return {
    totalRevenue,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalLeads: store.leads.length,
    hotLeads: store.leads.filter((l) => l.scoreTier === "hot").length,
    totalAudiences: store.audiences.length,
    totalAutomations: store.automations.length,
    activeAutomations: store.automations.filter((a) => a.status === "active").length,
    totalAbTests: store.abTests.length,
    runningAbTests: store.abTests.filter((t) => t.status === "running").length,
    channelPerformance: getChannelPerformance(),
    topMetrics: getMarketingMetrics().slice(0, 6),
    forecasts: getGrowthForecasts().slice(0, 4),
    attributionSummary: store.attributionResults.slice(0, 5),
  };
}

/* ================================================================== */
/*  AI MARKETING ASSISTANT                                             */
/* ================================================================== */

export function getAiSuggestions(): AiMarketingSuggestion[] {
  return getStore().aiSuggestions;
}

export function generateCampaignBrief(input: { goal: CampaignGoal; targetAudience: string; budget: number }): AiCampaignBrief {
  const { goal, targetAudience, budget } = input;
  const brief: AiCampaignBrief = {
    campaignName: `AI-Generated ${goal.charAt(0).toUpperCase() + goal.slice(1)} Campaign`,
    goal,
    channels: ["email", "social"],
    targetAudience,
    keyMessage: "Discover curated luxury — hand-picked by our editors.",
    estimatedReach: Math.round(budget * 8),
    estimatedConversions: Math.round(budget * 0.3),
    estimatedRevenue: Math.round(budget * 4.5),
    suggestedBudget: budget,
    suggestedTimeline: "2 weeks planning + 4 weeks active",
    copySuggestions: [
      "Discover the edit that's right for you",
      "Curated luxury, delivered to your door",
      "Your style, your way — explore now",
    ],
    ctaSuggestions: ["Shop the Edit", "Explore Now", "Discover More", "Get Early Access"],
  };
  return brief;
}

export function generateAiCopy(type: "subject_line" | "cta" | "body" | "social", context: string): string[] {
  if (type === "subject_line") {
    return [
      `${context} — just for you`,
      `Discover ${context.toLowerCase()} today`,
      `Your ${context.toLowerCase()} edit awaits`,
      `${context} — exclusive preview inside`,
      `Don't miss ${context.toLowerCase()}`,
    ];
  }
  if (type === "cta") {
    return ["Shop Now", "Explore the Collection", "Get Early Access", "Discover More", "Claim Your Offer"];
  }
  if (type === "social") {
    return [
      `✨ Discover our ${context.toLowerCase()} — curated by editors, crafted for you. #ALAYAINSIDER`,
      `The ${context.toLowerCase()} you've been waiting for is here. Tap to explore. ✨`,
      `New edit: ${context}. Hand-picked pieces that define your style.`,
    ];
  }
  return [
    `Discover our curated ${context.toLowerCase()} collection. Every piece has been hand-selected by our editors for its quality, craftsmanship, and enduring style.`,
    `We've curated ${context.toLowerCase()} just for you. Explore pieces that reflect your unique taste and elevate your everyday.`,
  ];
}

/* ================================================================== */
/*  MARKETING REPORTS                                                  */
/* ================================================================== */

export interface MarketingReport {
  title: string;
  type: "channel" | "campaign" | "roi" | "attribution" | "forecast";
  generatedAt: number;
  data: Record<string, any>;
}

export function generateMarketingReport(type: MarketingReport["type"]): MarketingReport {
  const now = Date.now();
  if (type === "channel") {
    return { title: "Channel Performance Report", type, generatedAt: now, data: { channels: getChannelPerformance() } };
  }
  if (type === "campaign") {
    const store = getStore();
    return { title: "Campaign Analytics Report", type, generatedAt: now, data: { campaigns: store.campaigns.map((c) => ({ name: c.name, status: c.status, ...c.analytics })) } };
  }
  if (type === "roi") {
    const store = getStore();
    const totalRevenue = store.campaigns.reduce((s, c) => s + c.analytics.revenue, 0);
    const totalSpend = store.campaigns.reduce((s, c) => s + c.spend, 0);
    return {
      title: "ROI Analysis Report", type, generatedAt: now, data: {
        totalRevenue, totalSpend, overallROI: totalSpend > 0 ? Math.round(totalRevenue / totalSpend * 100) : 0,
        campaigns: store.campaigns.map((c) => ({ name: c.name, spend: c.spend, revenue: c.analytics.revenue, roi: c.analytics.roi })),
      },
    };
  }
  if (type === "attribution") {
    return { title: "Attribution Report", type, generatedAt: now, data: { results: getAttributionResults() } };
  }
  return { title: "Growth Forecast Report", type, generatedAt: now, data: { forecasts: getGrowthForecasts() } };
}
