/**
 * ALAYA INSIDER — Enterprise Operations Platform (PART 2.19)
 *
 * 12 modules:
 *   1. Operations Dashboard & NOC
 *   2. Release Management
 *   3. Maintenance Management
 *   4. Feature Flag Platform
 *   5. Platform Lifecycle Management
 *   6. Business Continuity
 *   7. Disaster Recovery
 *   8. Capacity Planning
 *   9. Operations Automation
 *  10. Operational KPIs
 *  11. Operations Documentation
 *  12. Operations Reports & Analytics
 */
import { uid } from "./utils";

// ------------------------------------------------------------------ //
//  TYPES                                                              //
// ------------------------------------------------------------------ //

export interface OpsDashboard {
  overallHealth: "healthy" | "degraded" | "critical";
  uptimePercent: number;
  activeIncidents: number;
  pendingReleases: number;
  scheduledMaintenance: number;
  activeFeatureFlags: number;
  drReady: boolean;
  lastDrTestAt?: number;
  capacityUtilization: number;
  avgResponseTimeMs: number;
  errorRate: number;
  totalServices: number;
  servicesUp: number;
}

export interface OpsMetric {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  description: string;
}

// ---- Release Management ---- //
export type DeploymentStrategy = "standard" | "blue_green" | "canary" | "rolling" | "zero_downtime";

export interface ReleasePlan {
  id: string;
  version: string;
  name: string;
  description: string;
  type: "major" | "minor" | "patch" | "hotfix";
  status: "planned" | "in_progress" | "approved" | "deployed" | "rolled_back" | "cancelled";
  deploymentStrategy: DeploymentStrategy;
  environment: string;
  scheduledAt?: number;
  deployedAt?: number;
  completedAt?: number;
  approvedBy?: string;
  deployedBy?: string;
  features: string[];
  fixes: string[];
  breakingChanges: string[];
  rollbackPlan: string;
  rollbackSteps: { step: number; description: string; done: boolean }[];
  artifacts: string[];
  changelog: string;
  releaseNotes: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  approvers: string[];
  validationChecks: ReleaseCheck[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ReleaseCheck {
  id: string;
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  details?: string;
}

export interface ReleaseCalendar {
  id: string;
  date: number;
  type: "release" | "freeze" | "maintenance" | "milestone";
  title: string;
  version?: string;
  environment?: string;
  notes?: string;
}

// ---- Maintenance Management ---- //
export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  type: "scheduled" | "emergency" | "auto";
  status: "planned" | "approved" | "in_progress" | "completed" | "cancelled";
  environment: string;
  scope: string[];
  startAt: number;
  endAt: number;
  expectedDowntime: number;
  actualDowntime?: number;
  approvedBy?: string;
  performedBy?: string;
  impactDescription: string;
  rollbackPlan: string;
  notificationsSent: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// ---- Feature Flag Platform ---- //
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  regionalRollout: { region: string; percent: number }[];
  userGroupRollout: { group: string; enabled: boolean }[];
  tenantRollout: { tenantId: string; enabled: boolean }[];
  dependencies: string[];
  instantRollback: boolean;
  metrics: { impressions: number; conversions: number; errorRate: number };
  owner: string;
  createdAt: number;
  updatedAt: number;
}

// ---- Platform Lifecycle ---- //
export type UpgradeTarget = "platform" | "module" | "plugin" | "database" | "infrastructure" | "ai_model" | "sdk" | "api" | "schema";

export interface PlatformUpgrade {
  id: string;
  name: string;
  target: UpgradeTarget;
  fromVersion: string;
  toVersion: string;
  status: "planned" | "in_progress" | "completed" | "failed" | "rolled_back";
  description: string;
  prerequisites: string[];
  migrationSteps: { step: number; description: string; done: boolean }[];
  rollbackSteps: { step: number; description: string; done: boolean }[];
  validationChecks: { name: string; status: "pending" | "running" | "passed" | "failed" }[];
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  performedBy?: string;
  riskLevel: "low" | "medium" | "high";
  notes: string;
  tags: string[];
  createdAt: number;
}

// ---- Business Continuity ---- //
export interface ContinuityPlan {
  id: string;
  name: string;
  description: string;
  scope: string[];
  rtoMinutes: number;
  rpoMinutes: number;
  status: "draft" | "active" | "tested" | "archived";
  lastTestedAt?: number;
  nextTestAt?: number;
  testResults?: string;
  procedures: ContinuityProcedure[];
  emergencyContacts: EmergencyContact[];
  escalationMatrix: EscalationEntry[];
  owner: string;
  approvedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContinuityProcedure {
  id: string;
  step: number;
  action: string;
  description: string;
  owner: string;
  estimatedDuration: number;
  automationAvailable: boolean;
  critical: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  backupContact?: string;
  priority: number;
}

export interface EscalationEntry {
  id: string;
  level: number;
  name: string;
  condition: string;
  contacts: string[];
  maxResponseMinutes: number;
}

// ---- Disaster Recovery ---- //
export interface DrPlan {
  id: string;
  name: string;
  description: string;
  type: "multi_region" | "backup_restore" | "pilot_light" | "warm_standby" | "active_active";
  status: "draft" | "active" | "tested" | "failed_test";
  rtoMinutes: number;
  rpoMinutes: number;
  lastTestedAt?: number;
  lastTestResult?: "passed" | "failed" | "partial";
  nextTestAt?: number;
  primaryRegion: string;
  secondaryRegion: string;
  failoverSteps: { step: number; description: string; done: boolean }[];
  failbackSteps: { step: number; description: string; done: boolean }[];
  recoveryProcedures: { id: string; name: string; estimatedRto: number; automated: boolean }[];
  testedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DrTest {
  id: string;
  planId: string;
  name: string;
  status: "scheduled" | "in_progress" | "passed" | "failed";
  startedAt?: number;
  completedAt?: number;
  rtoAchieved?: number;
  rpoAchieved?: number;
  issuesFound: string[];
  lessonsLearned: string[];
  performedBy: string;
}

// ---- Capacity Planning ---- //
export interface CapacityForecast {
  id: string;
  name: string;
  category: "compute" | "storage" | "memory" | "database" | "network" | "search" | "worker" | "cdn";
  currentUtilization: number;
  forecastUtilization: number;
  capacityTotal: number;
  capacityUnit: string;
  growthRate: number;
  daysUntilExhaustion: number;
  recommendedAction: string;
  priority: "low" | "medium" | "high" | "critical";
  lastCheckedAt: number;
  createdAt: number;
}

export interface ScalingRecommendation {
  id: string;
  resource: string;
  currentSize: string;
  recommendedSize: string;
  reason: string;
  urgency: "low" | "medium" | "high";
  estimatedCostImpact: number;
  estimatedPerformanceImpact: string;
  implemented: boolean;
  createdAt: number;
}

// ---- Operations Automation ---- //
export interface OpsAutomation {
  id: string;
  name: string;
  description: string;
  type: "auto_scaling" | "self_healing" | "predictive_maintenance" | "failure_prediction" | "capacity_prediction" | "infra_optimization" | "operational_ai";
  status: "disabled" | "enabled" | "active" | "error";
  trigger: string;
  action: string;
  cooldownMinutes: number;
  lastTriggeredAt?: number;
  lastResult?: "success" | "failure";
  successCount: number;
  failureCount: number;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: number;
}

export interface OperationalAiInsight {
  id: string;
  type: "prediction" | "recommendation" | "anomaly" | "optimization";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  affectedResource: string;
  suggestedAction: string;
  createdAt: number;
}

// ---- Operational KPIs ---- //
export interface OpsKpi {
  id: string;
  name: string;
  category: "availability" | "reliability" | "performance" | "release" | "incident" | "recovery" | "business" | "executive";
  currentValue: number;
  targetValue: number;
  unit: string;
  status: "on_track" | "at_risk" | "missed";
  trend: "up" | "down" | "stable";
  period: string;
  lastUpdated: number;
}

// ---- Operations Documentation ---- //
export interface OpsDocument {
  id: string;
  title: string;
  type: "runbook" | "sop" | "emergency_procedure" | "architecture_doc" | "deployment_doc" | "infrastructure_doc" | "policy" | "knowledge_article";
  category: string;
  content: string;
  tags: string[];
  author: string;
  version: number;
  status: "draft" | "published" | "archived";
  lastReviewedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ---- Operations Reports ---- //
export interface OpsReport {
  id: string;
  name: string;
  type: "operations" | "executive" | "release" | "incident" | "capacity" | "availability" | "performance";
  period: string;
  summary: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "stable" }[];
  generatedAt: number;
}

// ------------------------------------------------------------------ //
//  SEED DATA                                                          //
// ------------------------------------------------------------------ //

const now = Date.now();
const DAY = 86400000;

// ---- Release Plans ---- //
const RELEASE_PLANS: ReleasePlan[] = [
  { id: uid("rel"), version: "2.6.0", name: "Summer Collection Launch", description: "New summer collection with AI recommendations and multi-currency support", type: "minor", status: "approved", deploymentStrategy: "blue_green", environment: "production", scheduledAt: now + 7 * DAY, features: ["AI product recommendations", "Multi-currency display", "Summer collection CMS", "Performance optimizations"], fixes: ["Checkout redirect loop fix", "Image lazy loading fix"], breakingChanges: [], rollbackPlan: "Switch back to previous blue/green environment", rollbackSteps: [{ step: 1, description: "Route traffic back to blue environment", done: false }], artifacts: ["alaya-bundle-v2.6.0.js", "alaya-styles-v2.6.0.css"], changelog: "Full changelog available in release notes", releaseNotes: "Summer Collection Launch includes significant improvements to the recommendation engine.", riskLevel: "medium", approvers: ["cto", "qa_lead"], validationChecks: [
    { id: uid("rc"), name: "Unit Tests", status: "passed" }, { id: uid("rc"), name: "Integration Tests", status: "passed" },
    { id: uid("rc"), name: "Security Scan", status: "passed" }, { id: uid("rc"), name: "Load Test", status: "passed" },
  ], tags: ["feature", "summer", "commerce"], createdAt: now - 14 * DAY, updatedAt: now - DAY },
  { id: uid("rel"), version: "2.5.1", name: "Security Hotfix", description: "Critical security patch for dependency vulnerabilities", type: "hotfix", status: "in_progress", deploymentStrategy: "rolling", environment: "production", scheduledAt: now + DAY, features: [], fixes: ["lodash prototype pollution fix", "axios SSRF vulnerability fix"], breakingChanges: [], rollbackPlan: "Revert to v2.5.0", rollbackSteps: [{ step: 1, description: "Deploy v2.5.0 artifact", done: false }], artifacts: ["alaya-bundle-v2.5.1.js"], changelog: "Security patch release", releaseNotes: "Critical security vulnerabilities addressed.", riskLevel: "critical", approvers: ["cto", "security_lead"], validationChecks: [
    { id: uid("rc"), name: "Security Scan", status: "running" as const }, { id: uid("rc"), name: "Unit Tests", status: "passed" as const },
  ], tags: ["security", "hotfix", "critical"], createdAt: now - 3 * DAY, updatedAt: now - 3600000 },
  { id: uid("rel"), version: "2.5.0", name: "Spring Release 2026", description: "Major spring release with new features", type: "minor", status: "deployed", deploymentStrategy: "canary", environment: "production", scheduledAt: now - 30 * DAY, deployedAt: now - 28 * DAY, completedAt: now - 28 * DAY + 7200000, approvedBy: "cto", deployedBy: "devops_lead", features: ["New checkout flow", "Wishlist sharing", "Social login"], fixes: ["Cart sync bug fix", "Mobile menu fix"], breakingChanges: [], rollbackPlan: "Revert to v2.4.0", rollbackSteps: [{ step: 1, description: "Deploy previous version", done: false }], artifacts: ["alaya-bundle-v2.5.0.js", "alaya-styles-v2.5.0.css"], changelog: "See release notes for details", releaseNotes: "Spring Release brings a redesigned checkout experience.", riskLevel: "medium", approvers: ["cto", "qa_lead"], validationChecks: [
    { id: uid("rc"), name: "All Tests", status: "passed" },
  ], tags: ["feature", "spring"], createdAt: now - 45 * DAY, updatedAt: now - 28 * DAY },
  { id: uid("rel"), version: "2.4.0", name: "Winter Release 2025", description: "Holiday season feature release", type: "major", status: "deployed", deploymentStrategy: "blue_green", environment: "production", scheduledAt: now - 60 * DAY, deployedAt: now - 58 * DAY, completedAt: now - 58 * DAY + 5400000, approvedBy: "cto", deployedBy: "devops_lead", features: ["Gift cards", "Holiday promotions engine", "Multi-language support"], fixes: ["Currency rounding fix", "Tax calculation fix"], breakingChanges: ["API v1 deprecation notice"], rollbackPlan: "Blue/green switch", rollbackSteps: [{ step: 1, description: "Route to blue environment", done: false }], artifacts: ["alaya-bundle-v2.4.0.js"], changelog: "Winter Release is our biggest update yet.", releaseNotes: "Holiday season ready with gift cards and promotions.", riskLevel: "high", approvers: ["cto", "vp_eng", "qa_lead"], validationChecks: [
    { id: uid("rc"), name: "All Gates", status: "passed" },
  ], tags: ["feature", "holiday", "major"], createdAt: now - 75 * DAY, updatedAt: now - 58 * DAY },
  { id: uid("rel"), version: "3.0.0", name: "Next Gen Platform", description: "Major platform rewrite with new architecture", type: "major", status: "planned", deploymentStrategy: "zero_downtime", environment: "production", scheduledAt: now + 90 * DAY, features: ["Microservices migration", "GraphQL API", "Real-time updates"], fixes: [], breakingChanges: ["Complete API v2", "Database schema migration"], rollbackPlan: "Full rollback to v2.x branch", rollbackSteps: [{ step: 1, description: "Database rollback", done: false }, { step: 2, description: "Deploy v2.x artifacts", done: false }], artifacts: [], changelog: "TBD", releaseNotes: "Next Generation Platform is a complete rewrite.", riskLevel: "critical", approvers: ["cto", "ceo"], validationChecks: [], tags: ["major", "architecture", "future"], createdAt: now - 7 * DAY, updatedAt: now - DAY },
];

// ---- Maintenance Windows ---- //
const MAINTENANCE_WINDOWS: MaintenanceWindow[] = [
  { id: uid("mw"), title: "Weekly DB Optimization", description: "Routine database vacuum and index rebuild", type: "scheduled", status: "planned", environment: "production", scope: ["postgresql-primary", "postgresql-replica"], startAt: now + DAY + 7200000, endAt: now + DAY + 10800000, expectedDowntime: 0, impactDescription: "Read replicas briefly unavailable during index rebuild", rollbackPlan: "Rollback index changes via migration revert", notificationsSent: false, tags: ["database", "optimization"], createdAt: now - 7 * DAY, updatedAt: now - DAY },
  { id: uid("mw"), title: "CDN Cache Purge", description: "Full CDN cache purge and refresh", type: "scheduled", status: "in_progress", environment: "production", scope: ["cdn", "edge"], startAt: now - 1800000, endAt: now + 1800000, expectedDowntime: 0, actualDowntime: 0, approvedBy: "devops_lead", performedBy: "devops_lead", impactDescription: "Slight performance degradation during cache warm-up", rollbackPlan: "N/A — cache rebuilds automatically", notificationsSent: true, tags: ["cdn", "performance"], createdAt: now - 3 * DAY, updatedAt: now - DAY },
  { id: uid("mw"), title: "Emergency Dependency Patch", description: "Critical npm dependency vulnerability patch", type: "emergency", status: "completed", environment: "production", scope: ["alaya-main", "alaya-worker"], startAt: now - 14 * DAY + 3600000, endAt: now - 14 * DAY + 7200000, expectedDowntime: 300000, actualDowntime: 120000, approvedBy: "cto", performedBy: "devops_lead", impactDescription: "Brief rolling restart of application servers", rollbackPlan: "Revert dependency version", notificationsSent: true, tags: ["security", "emergency"], createdAt: now - 14 * DAY, updatedAt: now - 14 * DAY + 7200000 },
  { id: uid("mw"), title: "Monthly Platform Update", description: "Scheduled platform maintenance and updates", type: "scheduled", status: "completed", environment: "staging", scope: ["alaya-staging", "redis-staging", "postgresql-staging"], startAt: now - 21 * DAY, endAt: now - 21 * DAY + 7200000, expectedDowntime: 3600000, actualDowntime: 2400000, approvedBy: "qa_lead", performedBy: "devops", impactDescription: "Staging environment unavailable during maintenance", rollbackPlan: "Full environment restore from snapshot", notificationsSent: true, tags: ["routine", "update"], createdAt: now - 28 * DAY, updatedAt: now - 21 * DAY + 7200000 },
  { id: uid("mw"), title: "Emergency Database Failover Test", description: "Unplanned failover test for disaster recovery", type: "emergency", status: "cancelled", environment: "production", scope: ["postgresql-primary"], startAt: now - 5 * DAY, endAt: now - 5 * DAY + 3600000, expectedDowntime: 60000, impactDescription: "Brief write interruption during failover", rollbackPlan: "Fail back to primary", notificationsSent: true, tags: ["database", "dr"], createdAt: now - 6 * DAY, updatedAt: now - 5 * DAY },
];

// ---- Feature Flags ---- //
const FEATURE_FLAGS: FeatureFlag[] = [
  { id: uid("ff"), key: "ff_ai_recommendations", name: "AI Product Recommendations", description: "AI-powered product recommendations on product detail pages", enabled: true, rolloutPercent: 50, regionalRollout: [{ region: "US", percent: 80 }, { region: "EU", percent: 40 }, { region: "APAC", percent: 20 }], userGroupRollout: [{ group: "premium", enabled: true }, { group: "beta_testers", enabled: true }, { group: "new_users", enabled: false }], tenantRollout: [], dependencies: ["ff_ml_service"], instantRollback: true, metrics: { impressions: 125000, conversions: 3800, errorRate: 0.02 }, owner: "product_team", createdAt: now - 30 * DAY, updatedAt: now - DAY },
  { id: uid("ff"), key: "ff_new_checkout", name: "New Checkout Flow", description: "Redesigned checkout with one-page layout", enabled: true, rolloutPercent: 25, regionalRollout: [{ region: "US", percent: 30 }, { region: "EU", percent: 20 }], userGroupRollout: [{ group: "premium", enabled: true }, { group: "beta_testers", enabled: true }], tenantRollout: [], dependencies: [], instantRollback: true, metrics: { impressions: 45000, conversions: 2100, errorRate: 0.5 }, owner: "commerce_team", createdAt: now - 21 * DAY, updatedAt: now - 2 * DAY },
  { id: uid("ff"), key: "ff_multi_currency", name: "Multi-Currency Display", description: "Display prices in user's local currency", enabled: true, rolloutPercent: 100, regionalRollout: [{ region: "US", percent: 100 }, { region: "EU", percent: 100 }, { region: "APAC", percent: 100 }], userGroupRollout: [], tenantRollout: [], dependencies: ["ff_currency_service"], instantRollback: true, metrics: { impressions: 200000, conversions: 5200, errorRate: 0.01 }, owner: "globalization_team", createdAt: now - 14 * DAY, updatedAt: now - DAY },
  { id: uid("ff"), key: "ff_gift_cards", name: "Gift Cards", description: "Digital gift card purchasing and redemption", enabled: false, rolloutPercent: 0, regionalRollout: [], userGroupRollout: [], tenantRollout: [], dependencies: [], instantRollback: true, metrics: { impressions: 0, conversions: 0, errorRate: 0 }, owner: "product_team", createdAt: now - 7 * DAY, updatedAt: now - 7 * DAY },
  { id: uid("ff"), key: "ff_social_login", name: "Social Login", description: "OAuth login via Google, Apple, Facebook", enabled: true, rolloutPercent: 75, regionalRollout: [{ region: "US", percent: 80 }, { region: "EU", percent: 70 }, { region: "APAC", percent: 60 }], userGroupRollout: [{ group: "new_users", enabled: true }], tenantRollout: [], dependencies: ["ff_oauth_service"], instantRollback: true, metrics: { impressions: 85000, conversions: 4200, errorRate: 0.08 }, owner: "identity_team", createdAt: now - 10 * DAY, updatedAt: now - DAY },
  { id: uid("ff"), key: "ff_wishlist_sharing", name: "Wishlist Sharing", description: "Share wishlists with friends via link", enabled: false, rolloutPercent: 5, regionalRollout: [{ region: "US", percent: 10 }], userGroupRollout: [{ group: "beta_testers", enabled: true }], tenantRollout: [], dependencies: [], instantRollback: true, metrics: { impressions: 1200, conversions: 45, errorRate: 0.1 }, owner: "product_team", createdAt: now - 5 * DAY, updatedAt: now - DAY },
];

// ---- Platform Upgrades ---- //
const PLATFORM_UPGRADES: PlatformUpgrade[] = [
  { id: uid("upg"), name: "Node.js LTS Upgrade", target: "platform", fromVersion: "18.x", toVersion: "22.x", status: "planned", description: "Upgrade runtime to Node.js 22 LTS for performance and security improvements", prerequisites: ["Verify all dependencies support Node.js 22", "Run full test suite", "Benchmark performance"], migrationSteps: [{ step: 1, description: "Update Docker image version", done: false }, { step: 2, description: "Deploy to staging", done: false }, { step: 3, description: "Run full test suite", done: false }, { step: 4, description: "Deploy to production (rolling)", done: false }], rollbackSteps: [{ step: 1, description: "Revert Docker image to Node.js 18", done: false }], validationChecks: [{ name: "Unit Tests", status: "pending" }, { name: "Integration Tests", status: "pending" }, { name: "Performance Benchmark", status: "pending" }], scheduledAt: now + 30 * DAY, riskLevel: "medium", notes: "Docker image updates required. Plan for 2-hour maintenance window.", tags: ["runtime", "security", "performance"], createdAt: now - 3 * DAY },
  { id: uid("upg"), name: "PostgreSQL 16 Upgrade", target: "database", fromVersion: "15", toVersion: "16", status: "in_progress", description: "Database upgrade to PostgreSQL 16 for improved query performance and new features", prerequisites: ["Backup database", "Test in staging first"], migrationSteps: [{ step: 1, description: "Backup production database", done: true }, { step: 2, description: "Set up PostgreSQL 16 replica", done: true }, { step: 3, description: "Replicate data to new version", done: false }, { step: 4, description: "Validate data integrity", done: false }, { step: 5, description: "Switch read traffic", done: false }, { step: 6, description: "Switch write traffic", done: false }], rollbackSteps: [{ step: 1, description: "Switch back to PostgreSQL 15 replica", done: false }], validationChecks: [{ name: "Data Integrity", status: "running" }, { name: "Performance Benchmark", status: "pending" }], startedAt: now - 2 * DAY, riskLevel: "high", notes: "Rolling upgrade with read replica switch. Zero downtime expected.", tags: ["database", "infrastructure", "upgrade"], createdAt: now - 14 * DAY },
  { id: uid("upg"), name: "Redis 7 Upgrade", target: "infrastructure", fromVersion: "6.x", toVersion: "7.x", status: "completed", description: "Cache layer upgrade to Redis 7", prerequisites: [], migrationSteps: [{ step: 1, description: "Provision Redis 7 instance", done: true }, { step: 2, description: "Replicate data", done: true }, { step: 3, description: "Switch applications", done: true }], rollbackSteps: [{ step: 1, description: "Switch back to Redis 6", done: false }], validationChecks: [{ name: "Cache Hit Rate", status: "passed" }, { name: "Performance", status: "passed" }], scheduledAt: now - 45 * DAY, startedAt: now - 45 * DAY, completedAt: now - 45 * DAY + 3600000, performedBy: "devops_lead", riskLevel: "medium", notes: "Upgrade completed successfully. Cache hit rate improved by 5%.", tags: ["cache", "infrastructure", "upgrade"], createdAt: now - 50 * DAY },
];

// ---- Business Continuity Plans ---- //
const CONTINUITY_PLANS: ContinuityPlan[] = [
  { id: uid("bcp"), name: "Primary Platform Continuity", description: "Business continuity plan for main e-commerce platform", scope: ["alaya-insider.com", "api.alaya-insider.com", "admin.alaya-insider.com"], rtoMinutes: 60, rpoMinutes: 15, status: "active", lastTestedAt: now - 30 * DAY, nextTestAt: now + 30 * DAY, testResults: "All procedures passed. RTO: 45 min, RPO: 12 min.", procedures: [
    { id: uid("bcp_proc"), step: 1, action: "Activate incident response team", description: "Page on-call engineers via PagerDuty", owner: "NOC Lead", estimatedDuration: 5, automationAvailable: true, critical: true },
    { id: uid("bcp_proc"), step: 2, action: "Assess impact scope", description: "Determine affected services and customer impact", owner: "Incident Commander", estimatedDuration: 10, automationAvailable: false, critical: true },
    { id: uid("bcp_proc"), step: 3, action: "Failover to secondary region", description: "Route traffic to DR region via DNS change", owner: "DevOps Lead", estimatedDuration: 15, automationAvailable: true, critical: true },
    { id: uid("bcp_proc"), step: 4, action: "Verify service health", description: "Run health checks on all critical services", owner: "DevOps Lead", estimatedDuration: 10, automationAvailable: true, critical: true },
    { id: uid("bcp_proc"), step: 5, action: "Communicate status", description: "Update status page and notify stakeholders", owner: "Communications Lead", estimatedDuration: 5, automationAvailable: false, critical: false },
    { id: uid("bcp_proc"), step: 6, action: "Monitor and stabilize", description: "Monitor system health and address any issues", owner: "NOC", estimatedDuration: 30, automationAvailable: false, critical: true },
  ], emergencyContacts: [
    { id: uid("ec"), name: "Alex Chen", role: "NOC Lead", email: "alex@alaya.io", phone: "+1-555-0101", backupContact: "Maria Santos", priority: 1 },
    { id: uid("ec"), name: "Maria Santos", role: "DevOps Lead", email: "maria@alaya.io", phone: "+1-555-0102", priority: 2 },
    { id: uid("ec"), name: "James Wilson", role: "CTO", email: "james@alaya.io", phone: "+1-555-0103", priority: 3 },
    { id: uid("ec"), name: "Sarah Kim", role: "Communications Lead", email: "sarah@alaya.io", phone: "+1-555-0104", priority: 4 },
  ], escalationMatrix: [
    { id: uid("esc"), level: 1, name: "Level 1: NOC Engineer", condition: "Initial alert or incident detected", contacts: ["NOC Engineer on-call"], maxResponseMinutes: 5 },
    { id: uid("esc"), level: 2, name: "Level 2: DevOps Lead", condition: "Not resolved within 15 minutes or critical severity", contacts: ["Maria Santos", "DevOps Team"], maxResponseMinutes: 15 },
    { id: uid("esc"), level: 3, name: "Level 3: CTO / VP Eng", condition: "Not resolved within 30 minutes or platform-wide impact", contacts: ["James Wilson", "Engineering Management"], maxResponseMinutes: 30 },
    { id: uid("esc"), level: 4, name: "Level 4: Executive", condition: "Not resolved within 60 minutes or customer data breach", contacts: ["CEO", "CISO", "Legal"], maxResponseMinutes: 60 },
  ], owner: "alex_chen", approvedBy: "cto", createdAt: now - 90 * DAY, updatedAt: now - 7 * DAY },
  { id: uid("bcp"), name: "Database Failure Continuity", description: "Continuity plan for primary database failure", scope: ["postgresql-primary", "redis-primary"], rtoMinutes: 30, rpoMinutes: 5, status: "tested", lastTestedAt: now - 14 * DAY, nextTestAt: now + 45 * DAY, testResults: "Failover completed in 18 minutes. Data loss: <1 minute.", procedures: [
    { id: uid("bcp_proc"), step: 1, action: "Promote replica to primary", description: "Execute pg-promote on standby replica", owner: "DevOps Lead", estimatedDuration: 5, automationAvailable: true, critical: true },
    { id: uid("bcp_proc"), step: 2, action: "Update connection strings", description: "Point applications to new primary", owner: "DevOps Lead", estimatedDuration: 5, automationAvailable: true, critical: true },
    { id: uid("bcp_proc"), step: 3, action: "Verify replication lag", description: "Check data consistency", owner: "DevOps Lead", estimatedDuration: 5, automationAvailable: false, critical: true },
  ], emergencyContacts: [
    { id: uid("ec"), name: "Maria Santos", role: "DevOps Lead", email: "maria@alaya.io", phone: "+1-555-0102", priority: 1 },
  ], escalationMatrix: [
    { id: uid("esc"), level: 1, name: "Level 1: DBA", condition: "Database alert triggered", contacts: ["DBA on-call"], maxResponseMinutes: 5 },
    { id: uid("esc"), level: 2, name: "Level 2: DevOps Lead", condition: "Failover not completed in 10 min", contacts: ["Maria Santos"], maxResponseMinutes: 10 },
  ], owner: "maria_santos", approvedBy: "cto", createdAt: now - 60 * DAY, updatedAt: now - 7 * DAY },
];

// ---- Disaster Recovery Plans ---- //
const DR_PLANS: DrPlan[] = [
  { id: uid("dr"), name: "Full Platform DR", description: "Multi-region disaster recovery for complete platform failover", type: "multi_region", status: "tested", rtoMinutes: 60, rpoMinutes: 15, lastTestedAt: now - 30 * DAY, lastTestResult: "passed", nextTestAt: now + 30 * DAY, primaryRegion: "us-east-1", secondaryRegion: "eu-west-2", failoverSteps: [
    { step: 1, description: "Trigger DR alert and notify team", done: false },
    { step: 2, description: "Promote secondary database to primary", done: false },
    { step: 3, description: "Deploy application stack in secondary region", done: false },
    { step: 4, description: "Update DNS records to secondary region", done: false },
    { step: 5, description: "Verify all services operational", done: false },
    { step: 6, description: "Update status page", done: false },
  ], failbackSteps: [
    { step: 1, description: "Sync data back to primary region", done: false },
    { step: 2, description: "Test data consistency", done: false },
    { step: 3, description: "Route traffic back to primary", done: false },
    { step: 4, description: "Demote secondary to replica", done: false },
  ], recoveryProcedures: [
    { id: uid("drp"), name: "Database recovery", estimatedRto: 20, automated: true },
    { id: uid("drp"), name: "Application deployment", estimatedRto: 15, automated: true },
    { id: uid("drp"), name: "DNS propagation", estimatedRto: 10, automated: true },
    { id: uid("drp"), name: "Cache warm-up", estimatedRto: 15, automated: true },
  ], testedAt: now - 30 * DAY, createdAt: now - 180 * DAY, updatedAt: now - 7 * DAY },
  { id: uid("dr"), name: "Database-Only DR", description: "Database failover to cross-region replica", type: "warm_standby", status: "active", rtoMinutes: 30, rpoMinutes: 5, lastTestedAt: now - 14 * DAY, lastTestResult: "passed", nextTestAt: now + 45 * DAY, primaryRegion: "us-east-1", secondaryRegion: "us-west-2", failoverSteps: [
    { step: 1, description: "Promote warm standby to primary", done: false },
    { step: 2, description: "Update application config", done: false },
    { step: 3, description: "Verify data integrity", done: false },
  ], failbackSteps: [
    { step: 1, description: "Rebuild original primary", done: false },
    { step: 2, description: "Stream replication from new primary", done: false },
  ], recoveryProcedures: [
    { id: uid("drp"), name: "Database promote", estimatedRto: 10, automated: true },
    { id: uid("drp"), name: "Config update", estimatedRto: 5, automated: true },
  ], createdAt: now - 120 * DAY, updatedAt: now - 7 * DAY },
];

// ---- DR Tests ---- //
const DR_TESTS: DrTest[] = [
  { id: uid("drt"), planId: DR_PLANS[0].id, name: "Q2 2026 DR Test", status: "passed", startedAt: now - 30 * DAY, completedAt: now - 30 * DAY + 2700000, rtoAchieved: 45, rpoAchieved: 12, issuesFound: ["DNS propagation took longer than expected (14 min)"], lessonsLearned: ["Pre-warm DNS TTL before failover", "Automate DNS update step"], performedBy: "devops_lead" },
  { id: uid("drt"), planId: DR_PLANS[1].id, name: "Database DR Test", status: "passed", startedAt: now - 14 * DAY, completedAt: now - 14 * DAY + 1200000, rtoAchieved: 18, rpoAchieved: 5, issuesFound: [], lessonsLearned: ["Failover script works correctly", "Update runbook with new connection strings"], performedBy: "dba_lead" },
];

// ---- Capacity Forecasts ---- //
const CAPACITY_FORECASTS: CapacityForecast[] = [
  { id: uid("cap"), name: "Compute Capacity", category: "compute", currentUtilization: 68, forecastUtilization: 85, capacityTotal: 100, capacityUnit: "%", growthRate: 2.5, daysUntilExhaustion: 180, recommendedAction: "Scale up EC2 instances by Q3 2026", priority: "medium", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: uid("cap"), name: "Database Storage", category: "storage", currentUtilization: 72, forecastUtilization: 92, capacityTotal: 2000, capacityUnit: "GB", growthRate: 3.2, daysUntilExhaustion: 120, recommendedAction: "Add 500GB storage or archive old data", priority: "high", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: uid("cap"), name: "Redis Memory", category: "memory", currentUtilization: 55, forecastUtilization: 70, capacityTotal: 32, capacityUnit: "GB", growthRate: 1.8, daysUntilExhaustion: 250, recommendedAction: "Monitor — no action required yet", priority: "low", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: uid("cap"), name: "CDN Bandwidth", category: "network", currentUtilization: 45, forecastUtilization: 65, capacityTotal: 500, capacityUnit: "Mbps", growthRate: 1.5, daysUntilExhaustion: 365, recommendedAction: "No action required", priority: "low", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: uid("cap"), name: "Search Index Size", category: "search", currentUtilization: 80, forecastUtilization: 95, capacityTotal: 100, capacityUnit: "GB", growthRate: 4.0, daysUntilExhaustion: 60, recommendedAction: "Add search cluster node or optimize index size", priority: "critical", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: uid("cap"), name: "Worker Queue Throughput", category: "worker", currentUtilization: 35, forecastUtilization: 55, capacityTotal: 100, capacityUnit: "%", growthRate: 1.2, daysUntilExhaustion: 400, recommendedAction: "No action required", priority: "low", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: uid("cap"), name: "Memory Utilization", category: "memory", currentUtilization: 65, forecastUtilization: 82, capacityTotal: 64, capacityUnit: "GB", growthRate: 2.0, daysUntilExhaustion: 200, recommendedAction: "Plan memory upgrade by Q4 2026", priority: "medium", lastCheckedAt: now - DAY, createdAt: now - 30 * DAY },
];

// ---- Scaling Recommendations ---- //
const SCALING_RECOMMENDATIONS: ScalingRecommendation[] = [
  { id: uid("sr"), resource: "web-server", currentSize: "t3.large (2 vCPU, 8 GB)", recommendedSize: "t3.xlarge (4 vCPU, 16 GB)", reason: "CPU consistently above 70% during peak hours", urgency: "high", estimatedCostImpact: 85, estimatedPerformanceImpact: "Expected 40% improvement in response times", implemented: false, createdAt: now - 14 * DAY },
  { id: uid("sr"), resource: "db-primary", currentSize: "db.r5.xlarge (4 vCPU, 32 GB)", recommendedSize: "db.r5.2xlarge (8 vCPU, 64 GB)", reason: "Connection pool regularly exceeds 80%", urgency: "medium", estimatedCostImpact: 180, estimatedPerformanceImpact: "Eliminate connection pool contention", implemented: false, createdAt: now - 10 * DAY },
  { id: uid("sr"), resource: "redis-cache", currentSize: "cache.r6g.large (2 vCPU, 13 GB)", recommendedSize: "cache.r6g.xlarge (4 vCPU, 26 GB)", reason: "Memory usage growing 3% month-over-month", urgency: "low", estimatedCostImpact: 60, estimatedPerformanceImpact: "Maintain cache hit rate above 95%", implemented: false, createdAt: now - 7 * DAY },
];

// ---- Operations Automation ---- //
const OPS_AUTOMATIONS: OpsAutomation[] = [
  { id: uid("opsauto"), name: "Auto Scaling Group", description: "Automatically scale web server count based on CPU utilization", type: "auto_scaling", status: "enabled", trigger: "CPU > 70% for 5 minutes", action: "Add 2 web server instances", cooldownMinutes: 10, lastTriggeredAt: now - 3 * DAY, lastResult: "success", successCount: 42, failureCount: 1, enabled: true, config: { minInstances: 3, maxInstances: 20, targetCpu: 60 }, createdAt: now - 180 * DAY },
  { id: uid("opsauto"), name: "Self-Healing Worker", description: "Automatically restart failed workers", type: "self_healing", status: "active", trigger: "Worker health check fails 3 times", action: "Restart worker container", cooldownMinutes: 5, lastTriggeredAt: now - DAY, lastResult: "success", successCount: 128, failureCount: 3, enabled: true, config: { maxRetries: 3, healthCheckEndpoint: "/health" }, createdAt: now - 150 * DAY },
  { id: uid("opsauto"), name: "Predictive Disk Scaling", description: "Predict disk usage and scale before exhaustion", type: "predictive_maintenance", status: "disabled", trigger: "Disk usage forecast > 85% within 30 days", action: "Add 100GB storage", cooldownMinutes: 1440, lastTriggeredAt: undefined, lastResult: undefined, successCount: 0, failureCount: 0, enabled: false, config: { forecastDays: 30, thresholdPercent: 85, incrementGb: 100 }, createdAt: now - 60 * DAY },
  { id: uid("opsauto"), name: "Failure Prediction Model", description: "ML model that predicts service failures from metrics", type: "failure_prediction", status: "disabled", trigger: "Model anomaly score > 0.8", action: "Create predictive alert", cooldownMinutes: 60, lastTriggeredAt: undefined, lastResult: undefined, successCount: 0, failureCount: 0, enabled: false, config: { modelVersion: "1.0", anomalyThreshold: 0.8 }, createdAt: now - 30 * DAY },
  { id: uid("opsauto"), name: "AI Ops Assistant", description: "AI-powered operational recommendations", type: "operational_ai", status: "enabled", trigger: "Daily analysis of operational metrics", action: "Generate recommendations report", cooldownMinutes: 1440, lastTriggeredAt: now - DAY, lastResult: "success", successCount: 45, failureCount: 0, enabled: true, config: { schedule: "daily", channels: ["slack", "dashboard"] }, createdAt: now - 45 * DAY },
];

// ---- AI Insights ---- //
const AI_INSIGHTS: OperationalAiInsight[] = [
  { id: uid("insight"), type: "prediction", title: "Database Storage Exhaustion Predicted", description: "Database storage is projected to reach 92% utilization within 120 days at current growth rate", confidence: 0.85, impact: "high", affectedResource: "postgresql-primary", suggestedAction: "Add 500GB storage or archive data older than 6 months", createdAt: now - DAY },
  { id: uid("insight"), type: "recommendation", title: "Optimize Search Index Size", description: "Search index is at 80% capacity. Compressing older indices could free 30% space.", confidence: 0.78, impact: "medium", affectedResource: "elasticsearch", suggestedAction: "Enable index compression and reduce replica count for non-critical indices", createdAt: now - 2 * DAY },
  { id: uid("insight"), type: "anomaly", title: "Unusual Error Rate Spike Detected", description: "Error rate on /api/v1/products increased by 340% between 02:00-02:15 UTC", confidence: 0.92, impact: "medium", affectedResource: "api-server", suggestedAction: "Review deployment logs and recent code changes to product API service", createdAt: now - 3 * DAY },
  { id: uid("insight"), type: "optimization", title: "CDN Cache Hit Rate Optimization", description: "Cache hit rate is 82% — optimizing cache headers could improve to 92%", confidence: 0.72, impact: "low", affectedResource: "cdn", suggestedAction: "Increase TTL on static assets and add cache-control headers for product images", createdAt: now - 4 * DAY },
];

// ---- Operational KPIs ---- //
const OPS_KPIS: OpsKpi[] = [
  { id: uid("kpi"), name: "Uptime (30d)", category: "availability", currentValue: 99.95, targetValue: 99.99, unit: "%", status: "at_risk", trend: "down", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Deploy Frequency", category: "release", currentValue: 4.5, targetValue: 5, unit: "per week", status: "on_track", trend: "up", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "MTTR (Mean Time To Resolve)", category: "incident", currentValue: 45, targetValue: 30, unit: "minutes", status: "missed", trend: "up", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Change Failure Rate", category: "reliability", currentValue: 8, targetValue: 5, unit: "%", status: "at_risk", trend: "stable", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "P95 Response Time", category: "performance", currentValue: 210, targetValue: 250, unit: "ms", status: "on_track", trend: "down", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Recovery Time (DR)", category: "recovery", currentValue: 45, targetValue: 60, unit: "minutes", status: "on_track", trend: "stable", period: "Last DR test", lastUpdated: now - 30 * DAY },
  { id: uid("kpi"), name: "Recovery Point (DR)", category: "recovery", currentValue: 12, targetValue: 15, unit: "minutes", status: "on_track", trend: "down", period: "Last DR test", lastUpdated: now - 30 * DAY },
  { id: uid("kpi"), name: "Incident Resolution Rate", category: "incident", currentValue: 92, targetValue: 95, unit: "%", status: "at_risk", trend: "stable", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Revenue Per Deploy", category: "business", currentValue: 25000, targetValue: 30000, unit: "$", status: "at_risk", trend: "up", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Capacity Utilization", category: "performance", currentValue: 65, targetValue: 70, unit: "%", status: "on_track", trend: "up", period: "Real-time", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Auto-Resolution Rate", category: "reliability", currentValue: 78, targetValue: 85, unit: "%", status: "at_risk", trend: "up", period: "Last 30 days", lastUpdated: now - DAY },
  { id: uid("kpi"), name: "Executive Health Score", category: "executive", currentValue: 87, targetValue: 90, unit: "%", status: "at_risk", trend: "stable", period: "Real-time", lastUpdated: now - DAY },
];

// ---- Operations Documents ---- //
const OPS_DOCUMENTS: OpsDocument[] = [
  { id: uid("doc"), title: "Production Incident Response Runbook", type: "runbook", category: "incident", content: "## Incident Response Procedure\n\n1. **Detect** — Monitor alerts, customer reports, or automated detection\n2. **Triage** — Determine severity and impact scope\n3. **Respond** — Execute appropriate recovery procedure\n4. **Communicate** — Update status page and stakeholders\n5. **Resolve** — Confirm system health and close incident\n6. **Review** — Conduct postmortem within 48 hours", tags: ["incident", "response", "runbook"], author: "devops_lead", version: 3, status: "published", lastReviewedAt: now - 30 * DAY, createdAt: now - 180 * DAY, updatedAt: now - 30 * DAY },
  { id: uid("doc"), title: "Database Failover SOP", type: "sop", category: "database", content: "## Database Failover Standard Operating Procedure\n\n**Prerequisites:** DBA access, read replica configured\n\n1. Verify replica lag < 1 second\n2. Stop application writes\n3. Promote replica to primary\n4. Update connection strings\n5. Verify data consistency\n6. Resume application traffic\n7. Rebuild original primary as replica", tags: ["database", "failover", "sop"], author: "dba_lead", version: 2, status: "published", lastReviewedAt: now - 14 * DAY, createdAt: now - 120 * DAY, updatedAt: now - 14 * DAY },
  { id: uid("doc"), title: "Security Incident Emergency Procedure", type: "emergency_procedure", category: "security", content: "## Security Incident Emergency Procedure\n\n1. **Isolate** affected systems immediately\n2. **Preserve** logs and evidence\n3. **Assess** breach scope and data impact\n4. **Notify** CISO and legal team\n5. **Contain** the incident\n6. **Remediate** vulnerabilities\n7. **Communicate** to affected parties\n8. **Document** findings and lessons learned", tags: ["security", "emergency", "incident"], author: "security_lead", version: 1, status: "draft", createdAt: now - 14 * DAY, updatedAt: now - 14 * DAY },
  { id: uid("doc"), title: "Deployment Architecture Overview", type: "architecture_doc", category: "architecture", content: "## Deployment Architecture\n\n**Components:**\n- Load Balancers: AWS ALB (multi-region)\n- Application: Docker containers on ECS (Fargate)\n- Database: PostgreSQL 15 (RDS Multi-AZ)\n- Cache: Redis 7 (ElastiCache)\n- Search: Elasticsearch 8.x\n- CDN: CloudFront\n- DNS: Route53 (failover routing)", tags: ["architecture", "deployment", "infrastructure"], author: "devops_lead", version: 5, status: "published", lastReviewedAt: now - 30 * DAY, createdAt: now - 365 * DAY, updatedAt: now - 30 * DAY },
  { id: uid("doc"), title: "Production Deployment Procedure", type: "deployment_doc", category: "deployment", content: "## Production Deployment Procedure\n\n**Pre-deployment:**\n1. Code review approved\n2. All tests passing\n3. Staging deployment validated\n4. Change request approved\n\n**Deployment:**\n1. Tag release in Git\n2. Build Docker image\n3. Push to ECR\n4. Update ECS task definition\n5. Rolling deploy (10% at a time)\n6. Monitor health checks\n7. Verify with smoke tests\n\n**Rollback:**\n1. Revert to previous task definition\n2. Monitor rollback health", tags: ["deployment", "production", "procedure"], author: "devops_lead", version: 4, status: "published", lastReviewedAt: now - 14 * DAY, createdAt: now - 180 * DAY, updatedAt: now - 14 * DAY },
  { id: uid("doc"), title: "Operations Security Policy", type: "policy", category: "security", content: "## Operations Security Policy\n\n1. All production access requires MFA\n2. SSH keys must be rotated every 90 days\n3. Database credentials rotated every 30 days\n4. All deployments must be logged\n5. Production changes require approved change request\n6. Incident reports must be filed within 48 hours\n7. DR tests conducted quarterly", tags: ["policy", "security", "operations"], author: "cto", version: 2, status: "published", lastReviewedAt: now - 30 * DAY, createdAt: now - 180 * DAY, updatedAt: now - 30 * DAY },
  { id: uid("doc"), title: "PostgreSQL Performance Tuning KB", type: "knowledge_article", category: "database", content: "## PostgreSQL Performance Tuning\n\n- **Shared buffers:** 25% of total RAM\n- **Work memory:** 32MB per query\n- **Maintenance work memory:** 256MB\n- **Effective cache size:** 75% of total RAM\n- **Autovacuum:** Enabled with aggressive settings\n\n**Common issues:**\n- High CPU: Check slow queries with pg_stat_statements\n- High memory: Reduce shared_buffers or connection count\n- I/O wait: Increase checkpoint intervals", tags: ["database", "postgresql", "performance", "kb"], author: "dba_lead", version: 1, status: "published", lastReviewedAt: now - 7 * DAY, createdAt: now - 60 * DAY, updatedAt: now - 7 * DAY },
];

// ---- Operations Reports ---- //
const OPS_REPORTS: OpsReport[] = [
  { id: uid("opsrpt"), name: "Weekly Operations Summary", type: "operations", period: "Last 7 days", summary: "Platform stable. 2 scheduled maintenance completed. 3 incidents resolved.", metrics: [{ label: "Uptime", value: "99.98%", trend: "up" }, { label: "Incidents", value: "3", trend: "down" }, { label: "Deployments", value: "2", trend: "stable" }], generatedAt: now - DAY },
  { id: uid("opsrpt"), name: "Executive Operations Report", type: "executive", period: "Q2 2026", summary: "Platform health score 87/100. All DR tests passed. Capacity within thresholds.", metrics: [{ label: "Health Score", value: "87/100", trend: "up" }, { label: "Uptime (QTD)", value: "99.95%", trend: "stable" }, { label: "MTTR", value: "45 min", trend: "down" }], generatedAt: now - 2 * DAY },
  { id: uid("opsrpt"), name: "Release Performance Report", type: "release", period: "Last 30 days", summary: "4 releases deployed. 0 rollbacks. Average deploy time 45 minutes.", metrics: [{ label: "Releases", value: "4", trend: "up" }, { label: "Rollbacks", value: "0", trend: "stable" }, { label: "Avg Deploy Time", value: "45 min", trend: "down" }], generatedAt: now - 3 * DAY },
  { id: uid("opsrpt"), name: "Capacity Planning Report", type: "capacity", period: "Monthly", summary: "Database storage critical at 72%. Search index at 80%. Compute healthy.", metrics: [{ label: "DB Storage", value: "72%", trend: "up" }, { label: "Compute", value: "68%", trend: "up" }, { label: "Redis Memory", value: "55%", trend: "stable" }], generatedAt: now - 5 * DAY },
  { id: uid("opsrpt"), name: "Incident Analysis Report", type: "incident", period: "Last 30 days", summary: "7 incidents: 2 critical, 3 high, 2 medium. All resolved.", metrics: [{ label: "Critical", value: "2", trend: "down" }, { label: "Avg Resolution", value: "45 min", trend: "down" }, { label: "SLA Compliance", value: "92%", trend: "up" }], generatedAt: now - 4 * DAY },
];

// ------------------------------------------------------------------ //
//  STORE                                                              //
// ------------------------------------------------------------------ //

interface OpsStore {
  dashboard: OpsDashboard;
  releases: ReleasePlan[];
  maintenanceWindows: MaintenanceWindow[];
  featureFlags: FeatureFlag[];
  upgrades: PlatformUpgrade[];
  continuityPlans: ContinuityPlan[];
  drPlans: DrPlan[];
  drTests: DrTest[];
  capacityForecasts: CapacityForecast[];
  scalingRecommendations: ScalingRecommendation[];
  automations: OpsAutomation[];
  aiInsights: OperationalAiInsight[];
  kpis: OpsKpi[];
  documents: OpsDocument[];
  reports: OpsReport[];
  releaseCalendar: ReleaseCalendar[];
}

let store: OpsStore;

function initStore(): OpsStore {
  return {
    dashboard: {
      overallHealth: "degraded",
      uptimePercent: 99.95,
      activeIncidents: 3,
      pendingReleases: RELEASE_PLANS.filter((r) => r.status === "approved" || r.status === "in_progress").length,
      scheduledMaintenance: MAINTENANCE_WINDOWS.filter((m) => m.status === "planned" || m.status === "approved").length,
      activeFeatureFlags: FEATURE_FLAGS.filter((f) => f.enabled).length,
      drReady: true,
      lastDrTestAt: now - 30 * DAY,
      capacityUtilization: 65,
      avgResponseTimeMs: 210,
      errorRate: 0.8,
      totalServices: 24,
      servicesUp: 23,
    },
    releases: [...RELEASE_PLANS],
    maintenanceWindows: [...MAINTENANCE_WINDOWS],
    featureFlags: [...FEATURE_FLAGS],
    upgrades: [...PLATFORM_UPGRADES],
    continuityPlans: [...CONTINUITY_PLANS],
    drPlans: [...DR_PLANS],
    drTests: [...DR_TESTS],
    capacityForecasts: [...CAPACITY_FORECASTS],
    scalingRecommendations: [...SCALING_RECOMMENDATIONS],
    automations: [...OPS_AUTOMATIONS],
    aiInsights: [...AI_INSIGHTS],
    kpis: [...OPS_KPIS],
    documents: [...OPS_DOCUMENTS],
    reports: [...OPS_REPORTS],
    releaseCalendar: [
      { id: uid("rc"), date: now + 7 * DAY, type: "release", title: "Summer Collection v2.6.0", version: "2.6.0", environment: "production", notes: "Blue-green deployment" },
      { id: uid("rc"), date: now + DAY, type: "release", title: "Security Hotfix v2.5.1", version: "2.5.1", environment: "production", notes: "Critical security patch" },
      { id: uid("rc"), date: now + 30 * DAY, type: "freeze", title: "End of Quarter Freeze", notes: "No deployments during freeze period" },
      { id: uid("rc"), date: now + 45 * DAY, type: "freeze", title: "End of Quarter Freeze Ends", notes: "Deployments resume" },
      { id: uid("rc"), date: now + 14 * DAY, type: "maintenance", title: "Monthly Database Maintenance", environment: "production" },
      { id: uid("rc"), date: now + 90 * DAY, type: "milestone", title: "Next Gen Platform v3.0.0 Target", version: "3.0.0" },
    ],
  };
}

function getStore(): OpsStore {
  if (!store) store = initStore();
  return store;
}

// ------------------------------------------------------------------ //
//  MODULE 1 — Operations Dashboard                                    //
// ------------------------------------------------------------------ //

export function getOpsDashboard(): OpsDashboard {
  return { ...getStore().dashboard };
}

export function getOpsMetrics(): OpsMetric[] {
  const d = getStore().dashboard;
  return [
    { id: uid("om"), name: "Uptime (30d)", currentValue: d.uptimePercent, unit: "%", previousValue: 99.98, changePercent: -0.03, trend: "down", status: "warning", description: "Platform uptime over last 30 days" },
    { id: uid("om"), name: "Average Response Time", currentValue: d.avgResponseTimeMs, unit: "ms", previousValue: 230, changePercent: -8.7, trend: "down", status: "good", description: "Average API response time" },
    { id: uid("om"), name: "Error Rate", currentValue: d.errorRate, unit: "%", previousValue: 1.2, changePercent: -33, trend: "down", status: "good", description: "API error rate" },
    { id: uid("om"), name: "Services Uptime", currentValue: (d.servicesUp / d.totalServices) * 100, unit: "%", previousValue: 95.8, changePercent: 0, trend: "stable", status: "good", description: "Percentage of services online" },
    { id: uid("om"), name: "Capacity Utilization", currentValue: d.capacityUtilization, unit: "%", previousValue: 62, changePercent: 3, trend: "up", status: "warning", description: "Overall infrastructure capacity used" },
    { id: uid("om"), name: "DR Readiness", currentValue: d.drReady ? 100 : 0, unit: "%", previousValue: 100, changePercent: 0, trend: "stable", status: "good", description: "Disaster recovery readiness" },
  ];
}

export function getOpsGlobalStatus() {
  const s = getStore();
  return {
    totalReleases: s.releases.filter((r) => r.status === "deployed" || r.status === "in_progress").length,
    plannedReleases: s.releases.filter((r) => r.status === "planned" || r.status === "approved").length,
    activeMaintenance: s.maintenanceWindows.filter((m) => m.status === "in_progress" || m.status === "planned").length,
    activeFlags: s.featureFlags.filter((f) => f.enabled).length,
    drReady: s.drPlans.filter((p) => p.status === "active" || p.status === "tested").length,
    capacityCritical: s.capacityForecasts.filter((c) => c.priority === "critical" || c.priority === "high").length,
    openIncidents: getStore().dashboard.activeIncidents,
    automationsActive: s.automations.filter((a) => a.enabled && a.status !== "error").length,
    uptimeCurrent: s.dashboard.uptimePercent,
    totalKpis: s.kpis.length,
    kpisOnTrack: s.kpis.filter((k) => k.status === "on_track").length,
  };
}

// ------------------------------------------------------------------ //
//  MODULE 2 — Release Management                                      //
// ------------------------------------------------------------------ //

export function getReleasePlans(): ReleasePlan[] {
  return [...getStore().releases];
}

export function createReleasePlan(
  version: string,
  name: string,
  type: ReleasePlan["type"],
  environment: string,
  deploymentStrategy: DeploymentStrategy
): ReleasePlan {
  const plan: ReleasePlan = {
    id: uid("rel"),
    version, name, description: "", type, status: "planned",
    deploymentStrategy, environment,
    features: [], fixes: [], breakingChanges: [],
    rollbackPlan: "", rollbackSteps: [],
    artifacts: [], changelog: "", releaseNotes: "",
    riskLevel: "medium", approvers: [],
    validationChecks: [
      { id: uid("rc"), name: "Unit Tests", status: "pending" },
      { id: uid("rc"), name: "Integration Tests", status: "pending" },
      { id: uid("rc"), name: "Security Scan", status: "pending" },
    ],
    tags: [], createdAt: Date.now(), updatedAt: Date.now(),
  };
  getStore().releases.unshift(plan);
  return plan;
}

export function updateReleasePlan(id: string, updates: Partial<ReleasePlan>): boolean {
  const store = getStore();
  const idx = store.releases.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.releases[idx] = { ...store.releases[idx], ...updates, updatedAt: Date.now() };
  return true;
}

export function deployRelease(id: string, deployedBy: string): ReleasePlan | null {
  const store = getStore();
  const idx = store.releases.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.releases[idx] = {
    ...store.releases[idx],
    status: "deployed",
    deployedBy,
    deployedAt: Date.now(),
    completedAt: Date.now(),
    updatedAt: Date.now(),
  };
  return store.releases[idx];
}

export function rollbackRelease(id: string, reason: string): ReleasePlan | null {
  const store = getStore();
  const idx = store.releases.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.releases[idx] = {
    ...store.releases[idx],
    status: "rolled_back",
    rollbackPlan: reason,
    updatedAt: Date.now(),
  };
  return store.releases[idx];
}

export function getReleaseCalendar(): ReleaseCalendar[] {
  return [...getStore().releaseCalendar];
}

export function addReleaseCalendarEntry(entry: Omit<ReleaseCalendar, "id">): ReleaseCalendar {
  const cal: ReleaseCalendar = { id: uid("rc"), ...entry };
  getStore().releaseCalendar.push(cal);
  return cal;
}

// ------------------------------------------------------------------ //
//  MODULE 3 — Maintenance Management                                  //
// ------------------------------------------------------------------ //

export function getMaintenanceWindows(): MaintenanceWindow[] {
  return [...getStore().maintenanceWindows];
}

export function createMaintenanceWindow(
  title: string,
  description: string,
  type: MaintenanceWindow["type"],
  environment: string,
  startAt: number,
  endAt: number
): MaintenanceWindow {
  const mw: MaintenanceWindow = {
    id: uid("mw"), title, description, type, status: "planned",
    environment, scope: [], startAt, endAt,
    expectedDowntime: endAt - startAt,
    impactDescription: "", rollbackPlan: "",
    notificationsSent: false, tags: [],
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  getStore().maintenanceWindows.push(mw);
  return mw;
}

export function updateMaintenanceWindow(id: string, updates: Partial<MaintenanceWindow>): boolean {
  const store = getStore();
  const idx = store.maintenanceWindows.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  store.maintenanceWindows[idx] = { ...store.maintenanceWindows[idx], ...updates, updatedAt: Date.now() };
  return true;
}

// ------------------------------------------------------------------ //
//  MODULE 4 — Feature Flag Platform                                   //
// ------------------------------------------------------------------ //

export function getFeatureFlags(): FeatureFlag[] {
  return [...getStore().featureFlags];
}

export function updateFeatureFlag(key: string, updates: Partial<FeatureFlag>): boolean {
  const store = getStore();
  const idx = store.featureFlags.findIndex((f) => f.key === key);
  if (idx === -1) return false;
  store.featureFlags[idx] = { ...store.featureFlags[idx], ...updates, updatedAt: Date.now() };
  return true;
}

export function createFeatureFlag(
  key: string,
  name: string,
  description: string,
  owner: string
): FeatureFlag {
  const ff: FeatureFlag = {
    id: uid("ff"), key, name, description, enabled: false,
    rolloutPercent: 0, regionalRollout: [], userGroupRollout: [],
    tenantRollout: [], dependencies: [], instantRollback: true,
    metrics: { impressions: 0, conversions: 0, errorRate: 0 },
    owner, createdAt: Date.now(), updatedAt: Date.now(),
  };
  getStore().featureFlags.push(ff);
  return ff;
}

// ------------------------------------------------------------------ //
//  MODULE 5 — Platform Lifecycle Management                           //
// ------------------------------------------------------------------ //

export function getPlatformUpgrades(): PlatformUpgrade[] {
  return [...getStore().upgrades];
}

export function createPlatformUpgrade(
  name: string,
  target: UpgradeTarget,
  fromVersion: string,
  toVersion: string
): PlatformUpgrade {
  const upg: PlatformUpgrade = {
    id: uid("upg"), name, target, fromVersion, toVersion,
    status: "planned", description: "",
    prerequisites: [], migrationSteps: [],
    rollbackSteps: [], validationChecks: [],
    riskLevel: "medium", notes: "", tags: [],
    createdAt: Date.now(),
  };
  getStore().upgrades.unshift(upg);
  return upg;
}

export function updatePlatformUpgrade(id: string, updates: Partial<PlatformUpgrade>): boolean {
  const store = getStore();
  const idx = store.upgrades.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  store.upgrades[idx] = { ...store.upgrades[idx], ...updates };
  return true;
}

// ------------------------------------------------------------------ //
//  MODULE 6 — Business Continuity                                     //
// ------------------------------------------------------------------ //

export function getContinuityPlans(): ContinuityPlan[] {
  return [...getStore().continuityPlans];
}

export function createContinuityPlan(
  name: string,
  description: string,
  rtoMinutes: number,
  rpoMinutes: number
): ContinuityPlan {
  const plan: ContinuityPlan = {
    id: uid("bcp"), name, description, scope: [],
    rtoMinutes, rpoMinutes, status: "draft",
    procedures: [], emergencyContacts: [],
    escalationMatrix: [], owner: "",
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  getStore().continuityPlans.push(plan);
  return plan;
}

export function updateContinuityPlan(id: string, updates: Partial<ContinuityPlan>): boolean {
  const store = getStore();
  const idx = store.continuityPlans.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.continuityPlans[idx] = { ...store.continuityPlans[idx], ...updates, updatedAt: Date.now() };
  return true;
}

// ------------------------------------------------------------------ //
//  MODULE 7 — Disaster Recovery                                       //
// ------------------------------------------------------------------ //

export function getDrPlans(): DrPlan[] {
  return [...getStore().drPlans];
}

export function getDrTests(): DrTest[] {
  return [...getStore().drTests];
}

export function startDrTest(planId: string, name: string, performedBy: string): DrTest | null {
  const plan = getStore().drPlans.find((p) => p.id === planId);
  if (!plan) return null;
  const test: DrTest = {
    id: uid("drt"), planId, name, status: "in_progress",
    startedAt: Date.now(), issuesFound: [], lessonsLearned: [], performedBy,
  };
  getStore().drTests.unshift(test);
  plan.lastTestedAt = Date.now();
  plan.status = "tested";
  return test;
}

export function completeDrTest(
  testId: string,
  passed: boolean,
  rtoAchieved: number,
  rpoAchieved: number,
  issuesFound: string[],
  lessonsLearned: string[]
): DrTest | null {
  const store = getStore();
  const idx = store.drTests.findIndex((t) => t.id === testId);
  if (idx === -1) return null;
  store.drTests[idx] = {
    ...store.drTests[idx],
    status: passed ? "passed" : "failed",
    completedAt: Date.now(),
    rtoAchieved, rpoAchieved, issuesFound, lessonsLearned,
  };
  // Update parent DR plan status
  const test = store.drTests[idx];
  const plan = store.drPlans.find((p) => p.id === test.planId);
  if (plan) {
    plan.lastTestResult = passed ? "passed" : "failed";
    plan.status = passed ? "tested" : "failed_test";
    plan.lastTestedAt = Date.now();
  }
  return store.drTests[idx];
}

// ------------------------------------------------------------------ //
//  MODULE 8 — Capacity Planning                                       //
// ------------------------------------------------------------------ //

export function getCapacityForecasts(): CapacityForecast[] {
  return [...getStore().capacityForecasts];
}

export function getScalingRecommendations(): ScalingRecommendation[] {
  return [...getStore().scalingRecommendations];
}

export function implementScalingRecommendation(id: string): boolean {
  const store = getStore();
  const idx = store.scalingRecommendations.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.scalingRecommendations[idx].implemented = true;
  return true;
}

// ------------------------------------------------------------------ //
//  MODULE 9 — Operations Automation                                   //
// ------------------------------------------------------------------ //

export function getOpsAutomations(): OpsAutomation[] {
  return [...getStore().automations];
}

export function updateOpsAutomation(id: string, updates: Partial<OpsAutomation>): boolean {
  const store = getStore();
  const idx = store.automations.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  store.automations[idx] = { ...store.automations[idx], ...updates };
  return true;
}

export function triggerAutomation(id: string): OpsAutomation | null {
  const store = getStore();
  const idx = store.automations.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const success = Math.random() < 0.9;
  store.automations[idx] = {
    ...store.automations[idx],
    lastTriggeredAt: Date.now(),
    lastResult: success ? "success" : "failure",
    successCount: success ? store.automations[idx].successCount + 1 : store.automations[idx].successCount,
    failureCount: success ? store.automations[idx].failureCount : store.automations[idx].failureCount + 1,
    status: success ? "active" : "error",
  };
  return store.automations[idx];
}

export function getAiInsights(): OperationalAiInsight[] {
  return [...getStore().aiInsights];
}

// ------------------------------------------------------------------ //
//  MODULE 10 — Operational KPIs                                       //
// ------------------------------------------------------------------ //

export function getOpsKpis(): OpsKpi[] {
  return [...getStore().kpis];
}

export function getOpsKpisByCategory(category: OpsKpi["category"]): OpsKpi[] {
  return getStore().kpis.filter((k) => k.category === category);
}

// ------------------------------------------------------------------ //
//  MODULE 11 — Operations Documentation                               //
// ------------------------------------------------------------------ //

export function getOpsDocuments(): OpsDocument[] {
  return [...getStore().documents];
}

export function searchOpsDocuments(query: string): OpsDocument[] {
  const q = query.toLowerCase();
  return getStore().documents.filter(
    (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q))
  );
}

export function createOpsDocument(
  title: string,
  type: OpsDocument["type"],
  category: string,
  content: string,
  author: string
): OpsDocument {
  const doc: OpsDocument = {
    id: uid("doc"), title, type, category, content, tags: [],
    author, version: 1, status: "draft",
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  getStore().documents.push(doc);
  return doc;
}

// ------------------------------------------------------------------ //
//  MODULE 12 — Operations Reports & Analytics                         //
// ------------------------------------------------------------------ //

export function getOpsReports(): OpsReport[] {
  return [...getStore().reports];
}

export function generateOpsReport(type: OpsReport["type"], period: string): OpsReport {
  const report: OpsReport = {
    id: uid("opsrpt"),
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    type, period,
    summary: "Auto-generated operations report",
    metrics: [
      { label: "Uptime", value: `${(99.5 + Math.random() * 0.5).toFixed(2)}%`, trend: "stable" },
      { label: "Incidents", value: String(Math.round(Math.random() * 10)), trend: Math.random() > 0.5 ? "down" : "up" },
      { label: "Deployments", value: String(Math.round(Math.random() * 5)), trend: "stable" },
    ],
    generatedAt: Date.now(),
  };
  getStore().reports.unshift(report);
  return report;
}
