/**
 * ALAYA INSIDER — Enterprise Governance, Security Operations, Compliance,
 * Risk Management, Audit & Enterprise Administration Platform (PART 2.16)
 * =====================================================================
 * Centralized governance layer: administration, policies, organizations,
 * permissions, audit, change management, risk, incidents, security ops,
 * compliance, AI governance, reports.
 *
 * Integrates with: security.ts, identity.ts, observability.ts, devops.ts,
 * types.ts, globalizationPlatform.ts, intelligence.ts, data.ts
 */
import { uid } from "./utils";
import { pushLog } from "./devops";
import { writeAuditEntry } from "./observability";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const GOVERNANCE_KEY = "alaya_governance_platform_store";

/* ================================================================== */
/*  TYPES — Enterprise Administration                                  */
/* ================================================================== */

export interface PlatformSetting {
  id: string;
  key: string;
  name: string;
  description: string;
  category: "general" | "security" | "performance" | "email" | "api" | "ai" | "compliance" | "maintenance";
  type: "string" | "number" | "boolean" | "select" | "multiselect" | "json";
  value: any;
  defaultValue: any;
  options?: string[];
  envOverride: boolean;
  requiresRestart: boolean;
  editable: boolean;
  updatedAt: number;
  updatedBy: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  enabledFor: string[]; // user/role IDs
  rolloutPercent: number;
  dependencies: string[];
  expiresAt?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface DynamicConfig {
  id: string;
  key: string;
  value: any;
  environment: "all" | "development" | "staging" | "production";
  validations: { type: string; rule: string }[];
  updatedAt: number;
  updatedBy: string;
}

/* ================================================================== */
/*  TYPES — Policy Management                                          */
/* ================================================================== */

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: "security" | "compliance" | "governance" | "data" | "ai" | "access" | "operations" | "custom";
  severity: "critical" | "high" | "medium" | "low";
  scope: "global" | "tenant" | "department" | "team";
  rules: PolicyRule[];
  version: number;
  status: "draft" | "review" | "approved" | "published" | "archived";
  effectiveFrom?: number;
  effectiveTo?: number;
  approvedBy?: string;
  approvedAt?: number;
  publishedBy?: string;
  publishedAt?: number;
  tags: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PolicyRule {
  id: string;
  condition: string;
  effect: "allow" | "deny" | "require" | "log" | "alert" | "block";
  priority: number;
  params: Record<string, any>;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: Policy["category"];
  severity: Policy["severity"];
  rules: PolicyRule[];
  variables: string[];
  tags: string[];
}

/* ================================================================== */
/*  TYPES — Organization Management                                    */
/* ================================================================== */

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headUserId: string;
  headName: string;
  parentId?: string;
  children: string[];
  businessUnits: BusinessUnit[];
  budget?: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  description: string;
  headUserId: string;
  headName: string;
  teams: Team[];
  active: boolean;
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  businessUnitId: string;
  description: string;
  leadUserId: string;
  leadName: string;
  memberIds: string[];
  projects: string[];
  active: boolean;
  createdAt: number;
}

export interface ProjectOwnership {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  businessUnitId?: string;
  teamId?: string;
  ownerUserId: string;
  ownerName: string;
  stakeholders: { userId: string; name: string; role: string }[];
  approvalMatrix: ApprovalMatrixEntry[];
  status: "active" | "paused" | "completed" | "archived";
  createdAt: number;
}

export interface ApprovalMatrixEntry {
  id: string;
  name: string;
  description: string;
  entityType: string;
  minAmount?: number;
  maxAmount?: number;
  requiredApprovers: number;
  approvers: { userId: string; name: string; order: number; type: "any" | "all" }[];
  escalationRule?: { afterHours: number; escalateTo: string };
}

/* ================================================================== */
/*  TYPES — Enterprise Permissions & Access                            */
/* ================================================================== */

export interface EnterpriseRole {
  id: string;
  name: string;
  description: string;
  type: "system" | "custom";
  privileges: string[];
  inherits: string[];
  scope: "global" | "tenant" | "department";
  priority: number;
  isBreakGlass: boolean;
  requiresMfa: boolean;
  sessionTimeout: number; // minutes
  editable: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BreakGlassAccount {
  id: string;
  name: string;
  userId: string;
  reason: string;
  approvedBy: string;
  approvedAt: number;
  expiresAt: number;
  usedAt?: number;
  usedBy?: string;
  status: "active" | "used" | "expired" | "revoked";
  sessionId?: string;
  sessionStartedAt?: number;
  sessionEndedAt?: number;
  actions: BreakGlassAction[];
  createdAt: number;
}

export interface BreakGlassAction {
  action: string;
  resource: string;
  detail: string;
  ts: number;
}

export interface AdminSession {
  id: string;
  userId: string;
  userName: string;
  role: string;
  ip: string;
  userAgent: string;
  location: string;
  startedAt: number;
  lastActivityAt: number;
  expiresAt: number;
  isMfaVerified: boolean;
  isImpersonating: boolean;
  impersonatingUserId?: string;
  sessionType: "normal" | "break_glass" | "emergency" | "impersonation";
  status: "active" | "idle" | "expired" | "terminated";
}

export interface PrivilegeAudit {
  id: string;
  userId: string;
  userName: string;
  action: "granted" | "revoked" | "changed" | "used" | "abused";
  privilege: string;
  resource: string;
  reason: string;
  grantedBy?: string;
  ts: number;
}

/* ================================================================== */
/*  TYPES — Audit Platform                                             */
/* ================================================================== */

export interface GovernanceAuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  actor: string;
  actorType: "admin" | "system" | "user" | "ai" | "api";
  detail: string;
  changes?: { field: string; oldValue?: any; newValue?: any }[];
  metadata: Record<string, string>;
  severity: "info" | "warning" | "critical";
  ip?: string;
  userAgent?: string;
  immutable: true; // audit records cannot be modified
  ts: number;
}

export interface AuditSearchQuery {
  query?: string;
  entityType?: string;
  action?: string;
  actor?: string;
  severity?: string;
  startDate?: number;
  endDate?: number;
}

/* ================================================================== */
/*  TYPES — Change Management                                          */
/* ================================================================== */

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: "standard" | "emergency" | "normal" | "minor";
  category: "deployment" | "configuration" | "security" | "infrastructure" | "policy" | "release" | "database" | "api";
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "review" | "approved" | "rejected" | "scheduled" | "in_progress" | "completed" | "rolled_back" | "failed";
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  rejectReason?: string;
  scheduledFor?: number;
  completedAt?: number;
  rollbackPlan: string;
  riskAssessment: "low" | "medium" | "high";
  impact: string;
  affectedSystems: string[];
  reviewers: { userId: string; name: string; status: "pending" | "approved" | "rejected"; comment?: string }[];
  implementationSteps: { step: number; description: string; done: boolean; completedAt?: number }[];
  verificationSteps: { step: number; description: string; passed: boolean }[];
  rollbackSteps: { step: number; description: string }[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/* ================================================================== */
/*  TYPES — Risk Management                                            */
/* ================================================================== */

export interface RiskItem {
  id: string;
  name: string;
  description: string;
  category: "strategic" | "operational" | "financial" | "security" | "compliance" | "reputational" | "technology" | "legal";
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  score: number; // likelihood * impact
  status: "identified" | "assessed" | "mitigating" | "accepted" | "transferred" | "resolved";
  ownerUserId: string;
  ownerName: string;
  mitigationPlan: string;
  mitigationProgress: number; // 0-100
  dueDate?: number;
  residualScore?: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RiskAssessmentReport {
  id: string;
  name: string;
  assessor: string;
  departmentId?: string;
  findings: RiskFinding[];
  score: number;
  assessedAt: number;
  nextAssessmentAt: number;
}

export interface RiskFinding {
  id: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendation: string;
  status: "open" | "in_progress" | "resolved" | "accepted";
}

/* ================================================================== */
/*  TYPES — Incident Management                                        */
/* ================================================================== */

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  type: "security_breach" | "data_leak" | "unauthorized_access" | "ddos" | "malware" | "phishing" | "insider_threat" | "policy_violation" | "system_failure" | "api_abuse" | "credential_compromise" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "detected" | "investigating" | "contained" | "resolved" | "closed";
  detectedAt: number;
  detectedBy: string;
  assignedTo: string;
  assignedToName: string;
  timeline: IncidentTimelineEntry[];
  affectedSystems: string[];
  affectedData?: string[];
  impactDescription: string;
  containmentActions: string[];
  rootCause?: string;
  resolution?: string;
  resolvedAt?: number;
  closedAt?: number;
  postMortem?: string;
  lessonsLearned?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface IncidentTimelineEntry {
  id: string;
  action: string;
  actor: string;
  detail: string;
  ts: number;
}

/* ================================================================== */
/*  TYPES — Security Operations                                        */
/* ================================================================== */

export interface SecurityThreat {
  id: string;
  name: string;
  description: string;
  type: "malware" | "phishing" | "ddos" | "injection" | "xss" | "csrf" | "brute_force" | "credential_stuffing" | "api_abuse" | "data_exfiltration" | "privilege_escalation" | "zero_day" | "other";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  target?: string;
  detectedAt: number;
  blockedAt?: number;
  status: "active" | "blocked" | "investigating" | "mitigated" | "false_positive";
  mitreTechnique?: string;
  indicators: string[];
  recommendations: string[];
}

export interface Vulnerability {
  id: string;
  name: string;
  cveId?: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  cvssScore?: number;
  type: "dependency" | "code" | "configuration" | "infrastructure" | "secret" | "container" | "ai";
  affectedComponent: string;
  fixedVersion?: string;
  patchAvailable: boolean;
  exploitAvailable: boolean;
  status: "open" | "in_progress" | "fixed" | "accepted" | "false_positive";
  discoveredAt: number;
  fixedAt?: number;
  assignedTo?: string;
  dueDate?: number;
  references: string[];
}

export interface CertificateInfo {
  id: string;
  domain: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  algorithm: string;
  issuedAt: number;
  expiresAt: number;
  daysUntilExpiry: number;
  autoRenew: boolean;
  status: "valid" | "expiring" | "expired" | "revoked";
  lastCheckedAt: number;
}

export interface SecretRotation {
  id: string;
  name: string;
  type: "api_key" | "database_password" | "encryption_key" | "jwt_secret" | "oauth_secret" | "service_account";
  lastRotatedAt: number;
  rotationIntervalDays: number;
  nextRotationAt: number;
  status: "ok" | "due" | "overdue";
  ownedBy: string;
}

/* ================================================================== */
/*  TYPES — AI Governance                                              */
/* ================================================================== */

export interface AiGovernancePolicy {
  id: string;
  name: string;
  description: string;
  category: "safety" | "ethics" | "privacy" | "accuracy" | "bias" | "transparency" | "compliance";
  rules: AiGovernanceRule[];
  enabled: boolean;
  version: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface AiGovernanceRule {
  id: string;
  condition: string;
  action: "allow" | "block" | "review" | "log" | "flag" | "override";
  priority: number;
  params: Record<string, any>;
}

export interface AiActionApproval {
  id: string;
  actionType: string;
  description: string;
  model: string;
  prompt: string;
  outputPreview: string;
  requestedBy: string;
  requestedByName: string;
  status: "pending" | "approved" | "rejected" | "overridden";
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  rejectReason?: string;
  riskScore: number;
  requiresHumanReview: boolean;
  createdAt: number;
}

export interface AiExplainabilityRecord {
  id: string;
  actionId: string;
  model: string;
  input: string;
  output: string;
  confidence: number;
  reasoning: string;
  factors: { name: string; weight: number; value: string }[];
  biasDetected: boolean;
  biasDetails?: string;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Governance Reports                                         */
/* ================================================================== */

export interface GovernanceMetric {
  id: string;
  name: string;
  category: "governance" | "security" | "compliance" | "risk" | "audit" | "incidents" | "administration";
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
}

export interface GovernanceDashboardData {
  totalPolicies: number;
  publishedPolicies: number;
  totalChangeRequests: number;
  pendingChangeRequests: number;
  totalRisks: number;
  criticalRisks: number;
  totalIncidents: number;
  activeIncidents: number;
  totalVulnerabilities: number;
  openVulnerabilities: number;
  complianceScore: number;
  auditEventsToday: number;
  activeSessions: number;
  openFindings: number;
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface GovernanceStore {
  settings: PlatformSetting[];
  featureFlags: FeatureFlag[];
  dynamicConfigs: DynamicConfig[];
  policies: Policy[];
  policyTemplates: PolicyTemplate[];
  departments: Department[];
  businessUnits: BusinessUnit[];
  teams: Team[];
  projects: ProjectOwnership[];
  enterpriseRoles: EnterpriseRole[];
  breakGlassAccounts: BreakGlassAccount[];
  adminSessions: AdminSession[];
  privilegeAudits: PrivilegeAudit[];
  auditEntries: GovernanceAuditEntry[];
  changeRequests: ChangeRequest[];
  risks: RiskItem[];
  riskAssessments: RiskAssessmentReport[];
  incidents: SecurityIncident[];
  securityThreats: SecurityThreat[];
  vulnerabilities: Vulnerability[];
  certificates: CertificateInfo[];
  secretRotations: SecretRotation[];
  aiGovernancePolicies: AiGovernancePolicy[];
  aiActionApprovals: AiActionApproval[];
  aiExplainabilityRecords: AiExplainabilityRecord[];
}

function getStore(): GovernanceStore {
  try {
    const raw = localStorage.getItem(GOVERNANCE_KEY);
    if (raw) return JSON.parse(raw) as GovernanceStore;
  } catch { /* ignore */ }
  return {
    settings: [], featureFlags: [], dynamicConfigs: [],
    policies: [], policyTemplates: [],
    departments: [], businessUnits: [], teams: [], projects: [],
    enterpriseRoles: [], breakGlassAccounts: [], adminSessions: [], privilegeAudits: [],
    auditEntries: [],
    changeRequests: [],
    risks: [], riskAssessments: [],
    incidents: [], securityThreats: [], vulnerabilities: [],
    certificates: [], secretRotations: [],
    aiGovernancePolicies: [], aiActionApprovals: [], aiExplainabilityRecords: [],
  };
}

function saveStore(store: GovernanceStore) {
  try { localStorage.setItem(GOVERNANCE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedGovernanceData() {
  const store = getStore();
  if (store.policies.length > 0) return;

  const now = Date.now();

  /* ---- Platform Settings ---- */
  store.settings = [
    { id: uid("gs"), key: "platform_name", name: "Platform Name", description: "The name of the platform", category: "general", type: "string", value: "ALAYA INSIDER", defaultValue: "ALAYA INSIDER", envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "platform_url", name: "Platform URL", description: "Base URL of the platform", category: "general", type: "string", value: "https://alayainsider.com", defaultValue: "https://alayainsider.com", envOverride: true, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "maintenance_mode", name: "Maintenance Mode", description: "Enable maintenance mode for the platform", category: "maintenance", type: "boolean", value: false, defaultValue: false, envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "session_timeout_minutes", name: "Session Timeout", description: "Admin session timeout in minutes", category: "security", type: "number", value: 60, defaultValue: 60, envOverride: false, requiresRestart: true, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "max_login_attempts", name: "Max Login Attempts", description: "Maximum failed login attempts before lockout", category: "security", type: "number", value: 5, defaultValue: 5, envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "audit_retention_days", name: "Audit Retention Days", description: "Number of days to retain audit logs", category: "compliance", type: "number", value: 1095, defaultValue: 1095, envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "password_min_length", name: "Min Password Length", description: "Minimum password length requirement", category: "security", type: "number", value: 12, defaultValue: 12, envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "rate_limit_per_minute", name: "API Rate Limit", description: "Maximum API requests per minute per key", category: "api", type: "number", value: 100, defaultValue: 100, envOverride: true, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "mfa_required", name: "Require MFA", description: "Require MFA for all admin accounts", category: "security", type: "boolean", value: true, defaultValue: true, envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "ai_approval_required", name: "AI Action Approval", description: "Require human approval for AI actions", category: "ai", type: "boolean", value: true, defaultValue: true, envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "default_language", name: "Default Language", description: "Default language for the platform", category: "general", type: "select", value: "en", defaultValue: "en", options: ["en", "es", "fr", "de", "it", "hi"], envOverride: false, requiresRestart: false, editable: true, updatedAt: now, updatedBy: "system" },
    { id: uid("gs"), key: "log_level", name: "Log Level", description: "Minimum log level to record", category: "general", type: "select", value: "info", defaultValue: "info", options: ["debug", "info", "warning", "error"], envOverride: true, requiresRestart: true, editable: true, updatedAt: now, updatedBy: "system" },
  ];

  /* ---- Feature Flags ---- */
  store.featureFlags = [
    { id: uid("ff"), key: "ff_ai_content", name: "AI Content Generation", description: "Enable AI content generation features", enabled: true, enabledFor: [], rolloutPercent: 100, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
    { id: uid("ff"), key: "ff_multi_language", name: "Multi-Language Support", description: "Enable multi-language content", enabled: true, enabledFor: [], rolloutPercent: 100, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
    { id: uid("ff"), key: "ff_multi_currency", name: "Multi-Currency", description: "Enable multi-currency pricing", enabled: true, enabledFor: [], rolloutPercent: 100, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
    { id: uid("ff"), key: "ff_ab_testing", name: "A/B Testing", description: "Enable A/B testing platform", enabled: true, enabledFor: [], rolloutPercent: 100, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
    { id: uid("ff"), key: "ff_affiliates", name: "Affiliate Program", description: "Enable affiliate marketing program", enabled: true, enabledFor: [], rolloutPercent: 100, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
    { id: uid("ff"), key: "ff_supplier_portal", name: "Supplier Portal", description: "Enable supplier management portal", enabled: false, enabledFor: [], rolloutPercent: 50, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
    { id: uid("ff"), key: "ff_vip_program", name: "VIP Loyalty Program", description: "Enable VIP membership program", enabled: true, enabledFor: [], rolloutPercent: 100, dependencies: [], createdBy: "system", createdAt: now, updatedAt: now },
  ];

  /* ---- Policies ---- */
  store.policies = [
    {
      id: uid("pol"), name: "Password Policy", description: "Enterprise password requirements", category: "security",
      severity: "high", scope: "global", rules: [
        { id: uid("pr"), condition: "password.length < 12", effect: "deny", priority: 1, params: { message: "Password must be at least 12 characters" } },
        { id: uid("pr"), condition: "password.strength < 3", effect: "deny", priority: 2, params: { minStrength: 3 } },
        { id: uid("pr"), condition: "password.reuse", effect: "deny", priority: 3, params: { historyCount: 5 } },
      ], version: 1, status: "published", publishedBy: "system", publishedAt: now - 90 * 86400000, tags: ["security", "password"], createdBy: "system", createdAt: now - 90 * 86400000, updatedAt: now - 30 * 86400000,
    },
    {
      id: uid("pol"), name: "Data Classification", description: "Data handling and classification policy", category: "compliance",
      severity: "critical", scope: "global", rules: [
        { id: uid("pr"), condition: "data.classification === 'restricted'", effect: "require", priority: 1, params: { requires: ["encryption", "audit"] } },
        { id: uid("pr"), condition: "data.classification === 'confidential'", effect: "require", priority: 2, params: { requires: ["encryption"] } },
      ], version: 2, status: "published", approvedBy: "system", approvedAt: now - 60 * 86400000, publishedBy: "system", publishedAt: now - 60 * 86400000, tags: ["compliance", "data"], createdBy: "system", createdAt: now - 120 * 86400000, updatedAt: now - 60 * 86400000,
    },
    {
      id: uid("pol"), name: "AI Usage Policy", description: "Acceptable use of AI features", category: "ai",
      severity: "high", scope: "global", rules: [
        { id: uid("pr"), condition: "ai.action === 'generate_content'", effect: "require", priority: 1, params: { requires: ["human_review"] } },
        { id: uid("pr"), condition: "ai.model === 'external'", effect: "require", priority: 2, params: { requires: ["approval", "audit"] } },
      ], version: 1, status: "published", publishedBy: "system", publishedAt: now - 30 * 86400000, tags: ["ai", "governance"], createdBy: "system", createdAt: now - 45 * 86400000, updatedAt: now - 30 * 86400000,
    },
    { id: uid("pol"), name: "Access Review Policy", description: "Quarterly access review requirements", category: "access",
      severity: "medium", scope: "global", rules: [
        { id: uid("pr"), condition: "access.last_reviewed > 90", effect: "alert", priority: 1, params: { alertDays: 90 } },
      ], version: 1, status: "draft", tags: ["access", "compliance"], createdBy: "system", createdAt: now - 10 * 86400000, updatedAt: now - 10 * 86400000,
    },
  ];

  /* ---- Policy Templates ---- */
  store.policyTemplates = [
    { id: uid("pt"), name: "SOC 2 Password Policy", description: "Password policy aligned with SOC 2 requirements", category: "security", severity: "high", rules: [
      { id: uid("ptr"), condition: "password.length < 14", effect: "deny", priority: 1, params: {} },
      { id: uid("ptr"), condition: "password.mfa_required", effect: "require", priority: 2, params: {} },
    ], variables: ["min_length"], tags: ["soc2", "password"] },
    { id: uid("pt"), name: "GDPR Data Policy", description: "Data protection policy for GDPR compliance", category: "compliance", severity: "critical", rules: [
      { id: uid("ptr"), condition: "data.eu_citizen", effect: "require", priority: 1, params: { requires: ["consent", "right_to_deletion"] } },
    ], variables: ["data_retention_days"], tags: ["gdpr", "compliance"] },
  ];

  /* ---- Departments ---- */
  const departments: Department[] = [
    { id: uid("dept"), name: "Executive", code: "EXEC", description: "Executive leadership", headUserId: "admin_1", headName: "Admin User", children: [], businessUnits: [], active: true, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("dept"), name: "Technology", code: "TECH", description: "Engineering, DevOps, Data", headUserId: "admin_2", headName: "Tech Lead", children: [], businessUnits: [], active: true, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("dept"), name: "Marketing", code: "MKTG", description: "Marketing, Growth, Content", headUserId: "editor_1", headName: "Editor In Chief", children: [], businessUnits: [], active: true, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("dept"), name: "Operations", code: "OPS", description: "Business operations, fulfillment", headUserId: "admin_3", headName: "Operations Manager", children: [], businessUnits: [], active: true, createdAt: now - 180 * 86400000, updatedAt: now },
    { id: uid("dept"), name: "Security & Compliance", code: "SEC", description: "Security, compliance, audit", headUserId: "admin_4", headName: "Security Lead", children: [], businessUnits: [], active: true, createdAt: now - 180 * 86400000, updatedAt: now },
  ];

  const buTech: BusinessUnit[] = [
    { id: uid("bu"), name: "Platform Engineering", code: "PE", departmentId: departments[1].id, description: "Core platform development", headUserId: "admin_2", headName: "Tech Lead", teams: [
      { id: uid("team"), name: "Frontend", code: "FE", businessUnitId: "", description: "Frontend development team", leadUserId: "dev_1", leadName: "Dev One", memberIds: ["dev_1", "dev_2"], projects: [], active: true, createdAt: now - 180 * 86400000 },
      { id: uid("team"), name: "Backend", code: "BE", businessUnitId: "", description: "Backend development team", leadUserId: "dev_2", leadName: "Dev Two", memberIds: ["dev_2"], projects: [], active: true, createdAt: now - 180 * 86400000 },
    ], active: true, createdAt: now - 180 * 86400000 },
    { id: uid("bu"), name: "Data & AI", code: "DA", departmentId: departments[1].id, description: "Data engineering and AI/ML", headUserId: "admin_2", headName: "Tech Lead", teams: [
      { id: uid("team"), name: "Data Engineering", code: "DE", businessUnitId: "", description: "Data pipeline team", leadUserId: "dev_2", leadName: "Dev Two", memberIds: ["dev_2"], projects: [], active: true, createdAt: now - 120 * 86400000 },
    ], active: true, createdAt: now - 120 * 86400000 },
  ];
  buTech.forEach((bu) => bu.teams.forEach((t) => { t.businessUnitId = bu.id; }));
  departments[1].businessUnits = buTech;

  const buMktg: BusinessUnit[] = [
    { id: uid("bu"), name: "Content", code: "CONT", departmentId: departments[2].id, description: "Editorial and content creation", headUserId: "editor_1", headName: "Editor In Chief", teams: [
      { id: uid("team"), name: "Editorial", code: "EDIT", businessUnitId: "", description: "Editorial team", leadUserId: "editor_1", leadName: "Editor In Chief", memberIds: ["editor_1"], projects: [], active: true, createdAt: now - 180 * 86400000 },
    ], active: true, createdAt: now - 180 * 86400000 },
    { id: uid("bu"), name: "Growth", code: "GROWTH", departmentId: departments[2].id, description: "Growth and performance marketing", headUserId: "editor_1", headName: "Editor In Chief", teams: [
      { id: uid("team"), name: "SEO", code: "SEO", businessUnitId: "", description: "SEO team", leadUserId: "editor_1", leadName: "Editor In Chief", memberIds: [], projects: [], active: true, createdAt: now - 90 * 86400000 },
    ], active: true, createdAt: now - 90 * 86400000 },
  ];
  buMktg.forEach((bu) => bu.teams.forEach((t) => { t.businessUnitId = bu.id; }));
  departments[2].businessUnits = buMktg;

  store.departments = departments;

  /* ---- Enterprise Roles ---- */
  store.enterpriseRoles = [
    { id: uid("er"), name: "Super Admin", description: "Full platform access", type: "system", privileges: ["*"], inherits: [], scope: "global", priority: 100, isBreakGlass: false, requiresMfa: true, sessionTimeout: 60, editable: false, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("er"), name: "Security Admin", description: "Security operations access", type: "system", privileges: ["security.*", "audit.*", "compliance.*", "incidents.*", "users.read", "settings.read"], inherits: [], scope: "global", priority: 90, isBreakGlass: false, requiresMfa: true, sessionTimeout: 60, editable: false, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("er"), name: "Compliance Officer", description: "Compliance and audit access", type: "system", privileges: ["compliance.*", "audit.*", "reports.*", "policies.read", "risks.read"], inherits: [], scope: "global", priority: 80, isBreakGlass: false, requiresMfa: true, sessionTimeout: 60, editable: false, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("er"), name: "Auditor", description: "Read-only audit access", type: "system", privileges: ["audit.read", "reports.read", "compliance.read"], inherits: [], scope: "global", priority: 40, isBreakGlass: false, requiresMfa: false, sessionTimeout: 120, editable: false, createdAt: now - 365 * 86400000, updatedAt: now },
    { id: uid("er"), name: "Department Admin", description: "Department-level administration", type: "custom", privileges: ["users.read", "users.manage", "policies.read", "reports.read"], inherits: ["auditor"], scope: "department", priority: 60, isBreakGlass: false, requiresMfa: true, sessionTimeout: 60, editable: true, createdAt: now - 180 * 86400000, updatedAt: now },
    { id: uid("er"), name: "Developer", description: "Developer access to systems", type: "custom", privileges: ["deployments.read", "deployments.manage", "config.read", "logs.read", "monitoring.read"], inherits: [], scope: "global", priority: 50, isBreakGlass: false, requiresMfa: false, sessionTimeout: 120, editable: true, createdAt: now - 180 * 86400000, updatedAt: now },
  ];

  /* ---- Break Glass Accounts ---- */
  store.breakGlassAccounts = [
    { id: uid("bg"), name: "Emergency Root Access", userId: "admin_1", reason: "Emergency break-glass account for critical incidents", approvedBy: "system", approvedAt: now - 90 * 86400000, expiresAt: now + 275 * 86400000, status: "active", actions: [{ action: "emergency_access", resource: "system", detail: "Break-glass account created", ts: now - 90 * 86400000 }], createdAt: now - 90 * 86400000 },
    { id: uid("bg"), name: "Infrastructure Emergency", userId: "admin_2", reason: "Emergency access for infrastructure failures", approvedBy: "system", approvedAt: now - 60 * 86400000, expiresAt: now + 305 * 86400000, status: "active", actions: [], createdAt: now - 60 * 86400000 },
  ];

  /* ---- Admin Sessions ---- */
  store.adminSessions = [
    { id: uid("as"), userId: "admin_1", userName: "Admin User", role: "Super Admin", ip: "192.168.1.100", userAgent: "Mozilla/5.0", location: "New York, US", startedAt: now - 3600000, lastActivityAt: now - 60000, expiresAt: now + 3540000, isMfaVerified: true, isImpersonating: false, sessionType: "normal", status: "active" },
    { id: uid("as"), userId: "editor_1", userName: "Editor Chief", role: "Department Admin", ip: "192.168.1.102", userAgent: "Mozilla/5.0", location: "London, UK", startedAt: now - 7200000, lastActivityAt: now - 300000, expiresAt: now + 2880000, isMfaVerified: true, isImpersonating: false, sessionType: "normal", status: "active" },
    { id: uid("as"), userId: "admin_1", userName: "Admin User", role: "Super Admin", ip: "10.0.0.5", userAgent: "Mozilla/5.0", location: "Unknown", startedAt: now - 3600000 * 24, lastActivityAt: now - 3600000 * 23, expiresAt: now - 3600000 * 22, isMfaVerified: true, isImpersonating: true, impersonatingUserId: "editor_1", sessionType: "impersonation", status: "expired" },
  ];

  /* ---- Change Requests ---- */
  store.changeRequests = [
    {
      id: uid("cr"), title: "Update Password Policy", description: "Increase minimum password length from 8 to 12", type: "standard", category: "policy", priority: "medium", status: "completed",
      requestedBy: "admin_1", requestedByName: "Admin User", approvedBy: "admin_1", approvedByName: "Admin User", approvedAt: now - 40 * 86400000, scheduledFor: now - 35 * 86400000, completedAt: now - 35 * 86400000,
      rollbackPlan: "Revert to previous policy version 1", riskAssessment: "low", impact: "All users must update passwords", affectedSystems: ["Identity Platform"],
      reviewers: [{ userId: "admin_1", name: "Admin User", status: "approved" }],
      implementationSteps: [{ step: 1, description: "Update password policy min length", done: true, completedAt: now - 35 * 86400000 }, { step: 2, description: "Notify users of upcoming change", done: true, completedAt: now - 36 * 86400000 }],
      verificationSteps: [{ step: 1, description: "Verify new password validation", passed: true }],
      rollbackSteps: [{ step: 1, description: "Restore previous policy" }],
      tags: ["security", "policy"], createdAt: now - 45 * 86400000, updatedAt: now - 35 * 86400000,
    },
    {
      id: uid("cr"), title: "Deploy New Analytics Module", description: "Deploy v2 of the analytics module to production", type: "standard", category: "deployment", priority: "high", status: "approved",
      requestedBy: "admin_2", requestedByName: "Tech Lead", approvedBy: "admin_1", approvedByName: "Admin User", approvedAt: now - 2 * 86400000, scheduledFor: now + 3 * 86400000,
      rollbackPlan: "Revert to previous analytics module version", riskAssessment: "medium", impact: "Analytics unavailable during deployment window", affectedSystems: ["Analytics Platform", "Business Intelligence"],
      reviewers: [{ userId: "admin_2", name: "Tech Lead", status: "approved" }, { userId: "admin_1", name: "Admin User", status: "approved" }],
      implementationSteps: [{ step: 1, description: "Run database migrations", done: false }, { step: 2, description: "Deploy new module", done: false }, { step: 3, description: "Verify data pipeline", done: false }],
      verificationSteps: [{ step: 1, description: "Verify data integrity", passed: false }, { step: 2, description: "Verify API endpoints", passed: false }],
      rollbackSteps: [{ step: 1, description: "Roll back database migrations" }, { step: 2, description: "Deploy previous version" }],
      tags: ["deployment", "analytics"], createdAt: now - 7 * 86400000, updatedAt: now - 2 * 86400000,
    },
    {
      id: uid("cr"), title: "Emergency SSL Renewal", description: "SSL certificate renewal for primary domain", type: "emergency", category: "security", priority: "critical", status: "completed",
      requestedBy: "admin_2", requestedByName: "Tech Lead", approvedBy: "admin_1", approvedByName: "Admin User", approvedAt: now - 5 * 86400000, completedAt: now - 5 * 86400000,
      rollbackPlan: "Deploy old certificate if new one fails", riskAssessment: "low", impact: "HTTPS may be briefly interrupted", affectedSystems: ["Web Server", "CDN"],
      reviewers: [{ userId: "admin_1", name: "Admin User", status: "approved" }],
      implementationSteps: [{ step: 1, description: "Generate new certificate", done: true }, { step: 2, description: "Deploy to CDN", done: true }],
      verificationSteps: [{ step: 1, description: "Verify HTTPS works", passed: true }],
      rollbackSteps: [{ step: 1, description: "Revert to previous certificate" }],
      tags: ["security", "ssl", "emergency"], createdAt: now - 5 * 86400000, updatedAt: now - 5 * 86400000,
    },
  ];

  /* ---- Risks ---- */
  store.risks = [
    { id: uid("risk"), name: "Data Breach via Third-Party API", description: "Third-party API integration vulnerability could lead to customer data exposure", category: "security", likelihood: 3, impact: 5, score: 15, status: "mitigating", ownerUserId: "admin_4", ownerName: "Security Lead", mitigationPlan: "Implement API gateway with strict validation, rate limiting, and audit logging", mitigationProgress: 65, dueDate: now + 60 * 86400000, residualScore: 6, tags: ["data", "third-party", "api"], createdAt: now - 90 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("risk"), name: "GDPR Non-Compliance", description: "Risk of GDPR non-compliance in data handling processes", category: "compliance", likelihood: 2, impact: 4, score: 8, status: "mitigating", ownerUserId: "admin_4", ownerName: "Security Lead", mitigationPlan: "Complete GDPR gap analysis and remediation", mitigationProgress: 80, dueDate: now + 30 * 86400000, residualScore: 3, tags: ["compliance", "gdpr", "data"], createdAt: now - 120 * 86400000, updatedAt: now - 14 * 86400000 },
    { id: uid("risk"), name: "Infrastructure Downtime", description: "Cloud provider outage could cause extended platform downtime", category: "operational", likelihood: 2, impact: 5, score: 10, status: "mitigating", ownerUserId: "admin_2", ownerName: "Tech Lead", mitigationPlan: "Implement multi-region failover and disaster recovery plan", mitigationProgress: 45, dueDate: now + 90 * 86400000, residualScore: 5, tags: ["infrastructure", "availability"], createdAt: now - 60 * 86400000, updatedAt: now - 3 * 86400000 },
    { id: uid("risk"), name: "Supply Chain Disruption", description: "Key supplier failure could impact product fulfillment", category: "operational", likelihood: 3, impact: 3, score: 9, status: "accepted", ownerUserId: "admin_3", ownerName: "Operations Manager", mitigationPlan: "Diversify supplier base and maintain safety stock", mitigationProgress: 100, residualScore: 6, tags: ["supply-chain", "fulfillment"], createdAt: now - 45 * 86400000, updatedAt: now - 5 * 86400000 },
  ];

  /* ---- Incidents ---- */
  store.incidents = [
    {
      id: uid("inc"), title: "Suspicious Login Attempts Detected", description: "Multiple failed login attempts from unusual IP range", type: "unauthorized_access", severity: "high", status: "resolved",
      detectedAt: now - 20 * 86400000, detectedBy: "system", assignedTo: "admin_4", assignedToName: "Security Lead",
      timeline: [
        { id: uid("it"), action: "detected", actor: "system", detail: "15 failed login attempts from 5 IPs in 10 minutes", ts: now - 20 * 86400000 },
        { id: uid("it"), action: "investigating", actor: "admin_4", detail: "IPs traced to known VPN endpoints", ts: now - 20 * 86400000 + 600000 },
        { id: uid("it"), action: "contained", actor: "admin_4", detail: "Blocked IP range and enabled additional MFA enforcement", ts: now - 20 * 86400000 + 1800000 },
        { id: uid("it"), action: "resolved", actor: "admin_4", detail: "No data compromise. Implemented rate limiting.", ts: now - 20 * 86400000 + 3600000 },
      ],
      affectedSystems: ["Authentication Service"], impactDescription: "No customer data compromised", containmentActions: ["Blocked IP range", "Enabled stricter rate limiting", "Notified security team"],
      rootCause: "Credential stuffing attack using previously leaked credentials", resolution: "Rate limiting and MFA enforced", resolvedAt: now - 20 * 86400000 + 3600000, lessonsLearned: ["Enable rate limiting proactively", "Deploy CAPTCHA on login forms"], createdAt: now - 20 * 86400000, updatedAt: now - 19 * 86400000,
    },
    {
      id: uid("inc"), title: "API Rate Limit Exceeded", description: "Client exceeded API rate limit, causing degraded performance", type: "api_abuse", severity: "medium", status: "resolved",
      detectedAt: now - 10 * 86400000, detectedBy: "system", assignedTo: "admin_2", assignedToName: "Tech Lead",
      timeline: [
        { id: uid("it"), action: "detected", actor: "system", detail: "Client ID api_abc exceeded 1000 req/min limit", ts: now - 10 * 86400000 },
        { id: uid("it"), action: "contained", actor: "admin_2", detail: "Temporarily suspended API key", ts: now - 10 * 86400000 + 300000 },
        { id: uid("it"), action: "resolved", actor: "admin_2", detail: "Contacted client, restored with lower limit", ts: now - 10 * 86400000 + 86400000 },
      ],
      affectedSystems: ["API Gateway"], impactDescription: "Degraded API performance for 5 minutes", containmentActions: ["Suspended API key", "Alerted client"],
      rootCause: "Misconfigured client script making excessive requests", resolution: "Reduced rate limit and added monitoring", resolvedAt: now - 9 * 86400000, lessonsLearned: ["Monitor API usage anomalies in real-time"], createdAt: now - 10 * 86400000, updatedAt: now - 9 * 86400000,
    },
    {
      id: uid("inc"), title: "Phishing Campaign Targeting Admin", description: "Phishing email targeting admin accounts detected", type: "phishing", severity: "high", status: "contained",
      detectedAt: now - 3 * 86400000, detectedBy: "admin_1", assignedTo: "admin_4", assignedToName: "Security Lead",
      timeline: [
        { id: uid("it"), action: "detected", actor: "admin_1", detail: "Suspicious email reported by admin user", ts: now - 3 * 86400000 },
        { id: uid("it"), action: "investigating", actor: "admin_4", detail: "Confirmed phishing attempt targeting 3 admin accounts", ts: now - 3 * 86400000 + 900000 },
        { id: uid("it"), action: "contained", actor: "admin_4", detail: "Blocked sender and notified all admins", ts: now - 3 * 86400000 + 3600000 },
      ],
      affectedSystems: ["Email", "Admin Portal"], impactDescription: "No credentials compromised", containmentActions: ["Blocked sender domain", "Sent security alert to all admins"],
      createdAt: now - 3 * 86400000, updatedAt: now - 3 * 86400000,
    },
  ];

  /* ---- Security Threats ---- */
  store.securityThreats = [
    { id: uid("st"), name: "Credential Stuffing Attack", description: "Multiple login attempts using leaked credentials", type: "brute_force", severity: "high", source: "Various VPN IPs", target: "Login API", detectedAt: now - 20 * 86400000, blockedAt: now - 20 * 86400000 + 1800000, status: "blocked", indicators: ["High failed login rate", "Known VPN IPs"], recommendations: ["Enable CAPTCHA", "Implement IP rate limiting"] },
    { id: uid("st"), name: "SQL Injection Probe", description: "SQL injection pattern detected in search query", type: "injection", severity: "critical", source: "185.220.x.x", target: "Search API", detectedAt: now - 14 * 86400000, blockedAt: now - 14 * 86400000 + 10000, status: "blocked", indicators: ["OR 1=1 pattern", "UNION SELECT pattern"], recommendations: ["Input sanitization confirmed working", "Add WAF rules"] },
    { id: uid("st"), name: "Suspicious API Pattern", description: "Unusual API access pattern detected from new client", type: "api_abuse", severity: "medium", source: "Unknown", target: "Product API", detectedAt: now - 7 * 86400000, status: "investigating", indicators: ["Rapid product catalog scraping", "No user agent header"], recommendations: ["Review API key usage", "Consider rate limiting"] },
  ];

  /* ---- Vulnerabilities ---- */
  store.vulnerabilities = [
    { id: uid("vuln"), name: "lodash prototype pollution", cveId: "CVE-2023-26136", description: "Prototype pollution in lodash dependency", severity: "high", cvssScore: 7.4, type: "dependency", affectedComponent: "lodash@4.17.20", fixedVersion: "4.17.21", patchAvailable: true, exploitAvailable: true, status: "open", discoveredAt: now - 14 * 86400000, dueDate: now + 14 * 86400000, references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-26136"] },
    { id: uid("vuln"), name: "CORS misconfiguration", description: "Overly permissive CORS headers in API gateway", severity: "medium", cvssScore: 5.3, type: "configuration", affectedComponent: "API Gateway", patchAvailable: true, exploitAvailable: false, status: "fixed", discoveredAt: now - 30 * 86400000, fixedAt: now - 25 * 86400000, references: [] },
    { id: uid("vuln"), name: "Hardcoded API key in repository", description: "Git history contains hardcoded test API key", severity: "high", cvssScore: 8.2, type: "secret", affectedComponent: "Repository", patchAvailable: true, exploitAvailable: true, status: "in_progress", discoveredAt: now - 7 * 86400000, assignedTo: "admin_2", dueDate: now + 7 * 86400000, references: [] },
    { id: uid("vuln"), name: "Express.js vulnerable to XSS", cveId: "CVE-2023-34235", description: "Cross-site scripting vulnerability in Express.js", severity: "medium", cvssScore: 6.1, type: "dependency", affectedComponent: "express@4.18.0", fixedVersion: "4.18.2", patchAvailable: true, exploitAvailable: true, status: "open", discoveredAt: now - 21 * 86400000, dueDate: now + 21 * 86400000, references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-34235"] },
  ];

  /* ---- Certificates ---- */
  store.certificates = [
    { id: uid("cert"), domain: "alayainsider.com", issuer: "Let's Encrypt", subject: "CN=alayainsider.com", serialNumber: "ABC123", algorithm: "SHA-256", issuedAt: now - 60 * 86400000, expiresAt: now + 305 * 86400000, daysUntilExpiry: 305, autoRenew: true, status: "valid", lastCheckedAt: now - 86400000 },
    { id: uid("cert"), domain: "*.alayainsider.com", issuer: "Let's Encrypt", subject: "CN=*.alayainsider.com", serialNumber: "DEF456", algorithm: "SHA-256", issuedAt: now - 45 * 86400000, expiresAt: now + 320 * 86400000, daysUntilExpiry: 320, autoRenew: true, status: "valid", lastCheckedAt: now - 86400000 },
    { id: uid("cert"), domain: "api.alayainsider.com", issuer: "DigiCert", subject: "CN=api.alayainsider.com", serialNumber: "GHI789", algorithm: "SHA-384", issuedAt: now - 180 * 86400000, expiresAt: now + 14 * 86400000, daysUntilExpiry: 14, autoRenew: false, status: "expiring", lastCheckedAt: now - 86400000 },
  ];

  /* ---- Secret Rotations ---- */
  store.secretRotations = [
    { id: uid("sr"), name: "Database Master Password", type: "database_password", lastRotatedAt: now - 60 * 86400000, rotationIntervalDays: 90, nextRotationAt: now + 30 * 86400000, status: "ok", ownedBy: "admin_2" },
    { id: uid("sr"), name: "JWT Signing Secret", type: "jwt_secret", lastRotatedAt: now - 120 * 86400000, rotationIntervalDays: 180, nextRotationAt: now + 60 * 86400000, status: "ok", ownedBy: "admin_2" },
    { id: uid("sr"), name: "API Gateway Secret Key", type: "oauth_secret", lastRotatedAt: now - 200 * 86400000, rotationIntervalDays: 90, nextRotationAt: now - 110 * 86400000, status: "overdue", ownedBy: "admin_2" },
  ];

  /* ---- AI Governance Policies ---- */
  store.aiGovernancePolicies = [
    { id: uid("aig"), name: "Content Generation Policy", description: "Rules for AI-generated content", category: "accuracy", rules: [
      { id: uid("agr"), condition: "action === 'generate_content'", action: "review", priority: 1, params: { requiresHumanReview: true } },
      { id: uid("agr"), condition: "confidence < 0.7", action: "flag", priority: 2, params: { flagReason: "Low confidence" } },
    ], enabled: true, version: 1, createdBy: "admin_1", createdAt: now - 60 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: uid("aig"), name: "Bias Detection Policy", description: "Bias monitoring in AI outputs", category: "bias", rules: [
      { id: uid("agr"), condition: "bias_score > 0.3", action: "block", priority: 1, params: {} },
    ], enabled: true, version: 1, createdBy: "admin_1", createdAt: now - 45 * 86400000, updatedAt: now - 15 * 86400000 },
    { id: uid("aig"), name: "External Model Policy", description: "Rules for using external AI models", category: "privacy", rules: [
      { id: uid("agr"), condition: "model_type === 'external'", action: "review", priority: 1, params: { requiresApproval: true } },
    ], enabled: true, version: 1, createdBy: "admin_1", createdAt: now - 30 * 86400000, updatedAt: now - 7 * 86400000 },
  ];

  /* ---- AI Action Approvals ---- */
  store.aiActionApprovals = [
    { id: uid("aaa"), actionType: "generate_content", description: "Generate product description for new arrivals", model: "gpt-4", prompt: "Write a compelling product description for...", outputPreview: "Discover the epitome of elegance...", requestedBy: "editor_1", requestedByName: "Editor Chief", status: "approved", approvedBy: "admin_1", approvedByName: "Admin User", approvedAt: now - 86400000, riskScore: 25, requiresHumanReview: true, createdAt: now - 2 * 86400000 },
    { id: uid("aaa"), actionType: "translate_content", description: "Auto-translate 50 articles to Spanish", model: "gpt-4", prompt: "Translate the following content...", outputPreview: "Preview of translated content...", requestedBy: "editor_1", requestedByName: "Editor Chief", status: "pending", riskScore: 15, requiresHumanReview: false, createdAt: now - 3600000 },
    { id: uid("aaa"), actionType: "generate_marketing_copy", description: "Generate email campaign copy for VIP sale", model: "gpt-4", prompt: "Write an email for our VIP customers...", outputPreview: "Dear Valued VIP Member...", requestedBy: "editor_1", requestedByName: "Editor Chief", status: "rejected", approvedBy: "admin_1", approvedByName: "Admin User", approvedAt: now - 2 * 86400000, rejectReason: "Brand voice not aligned with current campaign", riskScore: 30, requiresHumanReview: true, createdAt: now - 3 * 86400000 },
  ];

  saveStore(store);
  pushLog("info", "system", "Governance Platform seeded successfully");
}

seedGovernanceData();

/* ================================================================== */
/*  MODULE 1: ENTERPRISE ADMINISTRATION                                */
/* ================================================================== */

export function getPlatformSettings(): PlatformSetting[] {
  return getStore().settings;
}

export function updatePlatformSetting(key: string, value: any, updatedBy: string): PlatformSetting | null {
  const store = getStore();
  const idx = store.settings.findIndex((s) => s.key === key);
  if (idx === -1) return null;
  store.settings[idx] = { ...store.settings[idx], value, updatedBy, updatedAt: Date.now() };
  saveStore(store);
  recordGovernanceAudit("update", "setting", key, store.settings[idx].name, updatedBy, `Updated setting: ${key} = ${JSON.stringify(value)}`);
  return store.settings[idx];
}

export function getFeatureFlags(): FeatureFlag[] {
  return getStore().featureFlags;
}

export function updateFeatureFlag(key: string, patch: Partial<FeatureFlag>): FeatureFlag | null {
  const store = getStore();
  const idx = store.featureFlags.findIndex((f) => f.key === key);
  if (idx === -1) return null;
  store.featureFlags[idx] = { ...store.featureFlags[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  recordGovernanceAudit("update", "feature_flag", key, store.featureFlags[idx].name, "system", `Updated feature flag: ${key}`);
  return store.featureFlags[idx];
}

export function getDynamicConfigs(): DynamicConfig[] {
  return getStore().dynamicConfigs;
}

export function setDynamicConfig(key: string, value: any, environment: DynamicConfig["environment"], updatedBy: string): DynamicConfig {
  const store = getStore();
  const existing = store.dynamicConfigs.find((c) => c.key === key && c.environment === environment);
  if (existing) {
    existing.value = value;
    existing.updatedAt = Date.now();
    existing.updatedBy = updatedBy;
  } else {
    store.dynamicConfigs.push({ id: uid("dc"), key, value, environment, validations: [], updatedAt: Date.now(), updatedBy });
  }
  saveStore(store);
  return existing || store.dynamicConfigs[store.dynamicConfigs.length - 1];
}

/* ---- Global Settings Access ---- */

export function getPlatformSetting(key: string): any {
  return getStore().settings.find((s) => s.key === key)?.value ?? null;
}

export function isFeatureEnabled(key: string): boolean {
  return getStore().featureFlags.find((f) => f.key === key)?.enabled ?? false;
}

/* ================================================================== */
/*  MODULE 2: POLICY MANAGEMENT                                        */
/* ================================================================== */

export function getPolicies(): Policy[] {
  return getStore().policies;
}

export function getPolicy(id: string): Policy | undefined {
  return getStore().policies.find((p) => p.id === id);
}

export function createPolicy(input: Omit<Policy, "id" | "version" | "createdAt" | "updatedAt">): Policy {
  const store = getStore();
  const policy: Policy = { ...input, id: uid("pol"), version: 1, createdAt: Date.now(), updatedAt: Date.now() };
  store.policies.push(policy);
  saveStore(store);
  recordGovernanceAudit("create", "policy", policy.id, policy.name, input.createdBy, `Created policy: ${policy.name}`);
  pushLog("info", "system", `Policy created: ${policy.name}`);
  return policy;
}

export function updatePolicy(id: string, patch: Partial<Policy>): Policy | null {
  const store = getStore();
  const idx = store.policies.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const old = store.policies[idx];
  store.policies[idx] = { ...old, ...patch, version: patch.status === "published" ? old.version + 1 : old.version, updatedAt: Date.now() };
  saveStore(store);
  recordGovernanceAudit("update", "policy", id, old.name, "system", `Updated policy: ${old.name} → ${patch.status || "modified"}`);
  return store.policies[idx];
}

export function approvePolicy(id: string, approvedBy: string): Policy | null {
  return updatePolicy(id, { status: "approved", approvedBy, approvedAt: Date.now() });
}

export function publishPolicy(id: string, publishedBy: string): Policy | null {
  return updatePolicy(id, { status: "published", publishedBy, publishedAt: Date.now() });
}

export function getPolicyTemplates(): PolicyTemplate[] {
  return getStore().policyTemplates;
}

export function applyPolicyTemplate(templateId: string, createdBy: string, _variables: Record<string, string>): Policy | null {
  const template = getStore().policyTemplates.find((t) => t.id === templateId);
  if (!template) return null;
  const rules = template.rules.map((r) => ({ ...r, id: uid("pr") }));
  return createPolicy({
    name: template.name, description: template.description,
    category: template.category, severity: template.severity, scope: "global",
    rules, status: "draft", tags: [...template.tags],
    createdBy, effectiveFrom: undefined, effectiveTo: undefined,
  });
}

/* ================================================================== */
/*  MODULE 3: ORGANIZATION MANAGEMENT                                  */
/* ================================================================== */

export function getDepartments(): Department[] {
  return getStore().departments;
}

export function getDepartment(id: string): Department | undefined {
  return getStore().departments.find((d) => d.id === id);
}

export function createDepartment(input: Omit<Department, "id" | "createdAt" | "updatedAt" | "children" | "businessUnits">): Department {
  const store = getStore();
  const dept: Department = { ...input, id: uid("dept"), children: [], businessUnits: [], createdAt: Date.now(), updatedAt: Date.now() };
  store.departments.push(dept);
  saveStore(store);
  return dept;
}

export function updateDepartment(id: string, patch: Partial<Department>): Department | null {
  const store = getStore();
  const idx = store.departments.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  store.departments[idx] = { ...store.departments[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.departments[idx];
}

export function getProjects(): ProjectOwnership[] {
  return getStore().projects;
}

export function createProject(input: Omit<ProjectOwnership, "id" | "createdAt">): ProjectOwnership {
  const store = getStore();
  const project: ProjectOwnership = { ...input, id: uid("proj"), createdAt: Date.now() };
  store.projects.push(project);
  saveStore(store);
  return project;
}

/* ================================================================== */
/*  MODULE 4: ENTERPRISE PERMISSIONS & ACCESS                          */
/* ================================================================== */

export function getEnterpriseRoles(): EnterpriseRole[] {
  return getStore().enterpriseRoles;
}

export function createEnterpriseRole(input: Omit<EnterpriseRole, "id" | "createdAt" | "updatedAt">): EnterpriseRole {
  const store = getStore();
  const role: EnterpriseRole = { ...input, id: uid("er"), createdAt: Date.now(), updatedAt: Date.now() };
  store.enterpriseRoles.push(role);
  saveStore(store);
  return role;
}

export function updateEnterpriseRole(id: string, patch: Partial<EnterpriseRole>): EnterpriseRole | null {
  const store = getStore();
  const idx = store.enterpriseRoles.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.enterpriseRoles[idx] = { ...store.enterpriseRoles[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.enterpriseRoles[idx];
}

export function getBreakGlassAccounts(): BreakGlassAccount[] {
  return getStore().breakGlassAccounts;
}

export function createBreakGlassAccount(input: Omit<BreakGlassAccount, "id" | "createdAt">): BreakGlassAccount {
  const store = getStore();
  const account: BreakGlassAccount = { ...input, id: uid("bg"), createdAt: Date.now() };
  store.breakGlassAccounts.push(account);
  saveStore(store);
  recordGovernanceAudit("create", "break_glass", account.id, account.name, input.userId, `Break-glass account created: ${account.name}`);
  return account;
}

export function useBreakGlassAccount(id: string, usedBy: string): BreakGlassAccount | null {
  const store = getStore();
  const idx = store.breakGlassAccounts.findIndex((a) => a.id === id);
  if (idx === -1 || store.breakGlassAccounts[idx].status !== "active") return null;
  store.breakGlassAccounts[idx].status = "used";
  store.breakGlassAccounts[idx].usedAt = Date.now();
  store.breakGlassAccounts[idx].usedBy = usedBy;
  store.breakGlassAccounts[idx].actions.push({ action: "emergency_access", resource: "system", detail: `Used by ${usedBy}`, ts: Date.now() });
  saveStore(store);
  recordGovernanceAudit("use", "break_glass", id, store.breakGlassAccounts[idx].name, usedBy, `Break-glass account used by ${usedBy}`);
  pushLog("warning", "security", `Break-glass account used: ${store.breakGlassAccounts[idx].name} by ${usedBy}`);
  return store.breakGlassAccounts[idx];
}

export function getAdminSessions(): AdminSession[] {
  return getStore().adminSessions;
}

export function terminateAdminSession(id: string): AdminSession | null {
  const store = getStore();
  const idx = store.adminSessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.adminSessions[idx].status = "terminated";
  saveStore(store);
  return store.adminSessions[idx];
}

export function getPrivilegeAudits(): PrivilegeAudit[] {
  return getStore().privilegeAudits;
}

export function logPrivilegeAudit(entry: Omit<PrivilegeAudit, "id" | "ts">): PrivilegeAudit {
  const store = getStore();
  const audit: PrivilegeAudit = { ...entry, id: uid("pa"), ts: Date.now() };
  store.privilegeAudits.push(audit);
  if (store.privilegeAudits.length > 500) store.privilegeAudits = store.privilegeAudits.slice(-500);
  saveStore(store);
  return audit;
}

/* ================================================================== */
/*  MODULE 5: AUDIT PLATFORM                                           */
/* ================================================================== */

function recordGovernanceAudit(action: string, entityType: string, entityId: string, entityName: string, actor: string, detail: string, changes?: { field: string; oldValue?: any; newValue?: any }[], severity: GovernanceAuditEntry["severity"] = "info"): GovernanceAuditEntry {
  const store = getStore();
  const entry: GovernanceAuditEntry = {
    id: uid("gaud"), action, entityType, entityId, entityName, actor,
    actorType: actor === "system" ? "system" : "admin",
    detail, changes, metadata: {}, severity, immutable: true, ts: Date.now(),
  };
  store.auditEntries.unshift(entry);
  if (store.auditEntries.length > 1000) store.auditEntries = store.auditEntries.slice(0, 1000);
  saveStore(store);

  // Also write to observability audit
  writeAuditEntry({ actor, actorType: "admin", action: action as any, entityType: entityType as any, entityId, entityName, detail, severity: severity as any, metadata: {} });

  if (severity !== "info") pushLog(severity === "critical" ? "error" : "warning", "security", `[Governance] ${detail}`);
  return entry;
}

export function getGovernanceAuditEntries(limit = 200): GovernanceAuditEntry[] {
  return getStore().auditEntries.slice(0, limit);
}

export function searchGovernanceAudit(query: AuditSearchQuery): GovernanceAuditEntry[] {
  let results = getStore().auditEntries;
  if (query.query) {
    const q = query.query.toLowerCase();
    results = results.filter((e) =>
      e.detail.toLowerCase().includes(q) || e.entityName.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q) || e.action.toLowerCase().includes(q)
    );
  }
  if (query.entityType) results = results.filter((e) => e.entityType === query.entityType);
  if (query.action) results = results.filter((e) => e.action === query.action);
  if (query.actor) results = results.filter((e) => e.actor === query.actor);
  if (query.severity) results = results.filter((e) => e.severity === query.severity);
  if (query.startDate) results = results.filter((e) => e.ts >= query.startDate!);
  if (query.endDate) results = results.filter((e) => e.ts <= query.endDate!);
  return results.slice(0, 200);
}

export function getGovernanceAuditStats(): { total: number; criticalCount: number; warningCount: number; infoCount: number; byAction: Record<string, number>; byEntity: Record<string, number> } {
  const entries = getStore().auditEntries;
  return {
    total: entries.length,
    criticalCount: entries.filter((e) => e.severity === "critical").length,
    warningCount: entries.filter((e) => e.severity === "warning").length,
    infoCount: entries.filter((e) => e.severity === "info").length,
    byAction: entries.reduce((acc, e) => { acc[e.action] = (acc[e.action] || 0) + 1; return acc; }, {} as Record<string, number>),
    byEntity: entries.reduce((acc, e) => { acc[e.entityType] = (acc[e.entityType] || 0) + 1; return acc; }, {} as Record<string, number>),
  };
}

/* ---- Module-specific Audit Helpers ---- */

export function auditEntityUpdate(entityType: string, entityId: string, entityName: string, actor: string, changes: { field: string; oldValue?: any; newValue?: any }[]): void {
  recordGovernanceAudit("update", entityType, entityId, entityName, actor, `Updated ${entityType}: ${entityName}`, changes);
}

export function auditEntityCreate(entityType: string, entityId: string, entityName: string, actor: string): void {
  recordGovernanceAudit("create", entityType, entityId, entityName, actor, `Created ${entityType}: ${entityName}`);
}

export function auditEntityDelete(entityType: string, entityId: string, entityName: string, actor: string): void {
  recordGovernanceAudit("delete", entityType, entityId, entityName, actor, `Deleted ${entityType}: ${entityName}`, undefined, "warning");
}

/* ================================================================== */
/*  MODULE 6: CHANGE MANAGEMENT                                        */
/* ================================================================== */

export function getChangeRequests(): ChangeRequest[] {
  return getStore().changeRequests;
}

export function getChangeRequest(id: string): ChangeRequest | undefined {
  return getStore().changeRequests.find((c) => c.id === id);
}

export function createChangeRequest(input: Omit<ChangeRequest, "id" | "status" | "createdAt" | "updatedAt">): ChangeRequest {
  const store = getStore();
  const cr: ChangeRequest = { ...input, id: uid("cr"), status: "draft", createdAt: Date.now(), updatedAt: Date.now() };
  store.changeRequests.push(cr);
  saveStore(store);
  recordGovernanceAudit("create", "change_request", cr.id, cr.title, input.requestedBy, `Change request created: ${cr.title}`);
  return cr;
}

export function updateChangeRequest(id: string, patch: Partial<ChangeRequest>): ChangeRequest | null {
  const store = getStore();
  const idx = store.changeRequests.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.changeRequests[idx] = { ...store.changeRequests[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.changeRequests[idx];
}

export function approveChangeRequest(id: string, approvedBy: string, approvedByName: string): ChangeRequest | null {
  const cr = getChangeRequest(id);
  if (!cr) return null;
  const updated = updateChangeRequest(id, {
    status: "approved", approvedBy, approvedByName, approvedAt: Date.now(),
    reviewers: cr.reviewers.map((r) => r.userId === approvedBy ? { ...r, status: "approved" } : r),
  });
  if (updated) recordGovernanceAudit("approve", "change_request", id, updated.title, approvedBy, `Change request approved: ${updated.title}`);
  return updated;
}

export function rejectChangeRequest(id: string, rejectedBy: string, reason: string): ChangeRequest | null {
  const cr = getChangeRequest(id);
  if (!cr) return null;
  return updateChangeRequest(id, { status: "rejected", approvedBy: rejectedBy, rejectReason: reason });
}

export function submitForReview(id: string): ChangeRequest | null {
  return updateChangeRequest(id, { status: "review" });
}

export function implementChangeStep(id: string, stepNumber: number): ChangeRequest | null {
  const cr = getChangeRequest(id);
  if (!cr) return null;
  const steps = cr.implementationSteps.map((s) => s.step === stepNumber ? { ...s, done: true, completedAt: Date.now() } : s);
  const allDone = steps.every((s) => s.done);
  return updateChangeRequest(id, {
    implementationSteps: steps,
    status: allDone ? "completed" : "in_progress",
    completedAt: allDone ? Date.now() : undefined,
  });
}

export function rollbackChangeRequest(id: string): ChangeRequest | null {
  recordGovernanceAudit("rollback", "change_request", id, getChangeRequest(id)?.title || "", "system", `Change request rolled back: ${id}`, undefined, "warning");
  return updateChangeRequest(id, { status: "rolled_back" });
}

/* ================================================================== */
/*  MODULE 7: RISK MANAGEMENT                                          */
/* ================================================================== */

export function getRisks(): RiskItem[] {
  return getStore().risks;
}

export function getRisk(id: string): RiskItem | undefined {
  return getStore().risks.find((r) => r.id === id);
}

export function createRisk(input: Omit<RiskItem, "id" | "score" | "createdAt" | "updatedAt">): RiskItem {
  const store = getStore();
  const score = input.likelihood * input.impact;
  const risk: RiskItem = { ...input, id: uid("risk"), score, createdAt: Date.now(), updatedAt: Date.now() };
  store.risks.push(risk);
  saveStore(store);
  recordGovernanceAudit("create", "risk", risk.id, risk.name, input.ownerUserId, `Risk created: ${risk.name} (score: ${score})`);
  return risk;
}

export function updateRisk(id: string, patch: Partial<RiskItem>): RiskItem | null {
  const store = getStore();
  const idx = store.risks.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated = { ...store.risks[idx], ...patch };
  if (patch.likelihood !== undefined || patch.impact !== undefined) {
    updated.score = (patch.likelihood ?? updated.likelihood) * (patch.impact ?? updated.impact);
  }
  updated.updatedAt = Date.now();
  store.risks[idx] = updated;
  saveStore(store);
  return updated;
}

export function getRiskMatrix(): { likelihood: number; impact: number; count: number; items: RiskItem[] }[] {
  const risks = getRisks();
  const matrix: { likelihood: number; impact: number; count: number; items: RiskItem[] }[] = [];
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      const items = risks.filter((r) => r.likelihood === l && r.impact === i);
      if (items.length > 0) matrix.push({ likelihood: l, impact: i, count: items.length, items });
    }
  }
  return matrix;
}

export function getRiskAssessments(): RiskAssessmentReport[] {
  return getStore().riskAssessments;
}

export function createRiskAssessment(input: Omit<RiskAssessmentReport, "id">): RiskAssessmentReport {
  const store = getStore();
  const assessment: RiskAssessmentReport = { ...input, id: uid("ra") };
  store.riskAssessments.push(assessment);
  saveStore(store);
  return assessment;
}

/* ================================================================== */
/*  MODULE 8: INCIDENT MANAGEMENT                                      */
/* ================================================================== */

export function getIncidents(): SecurityIncident[] {
  return getStore().incidents;
}

export function getIncident(id: string): SecurityIncident | undefined {
  return getStore().incidents.find((i) => i.id === id);
}

export function createIncident(input: Omit<SecurityIncident, "id" | "status" | "detectedAt" | "timeline" | "createdAt" | "updatedAt">): SecurityIncident {
  const store = getStore();
  const now = Date.now();
  const incident: SecurityIncident = {
    ...input, id: uid("inc"), status: "detected", detectedAt: now,
    timeline: [{ id: uid("it"), action: "detected", actor: input.detectedBy, detail: "Incident detected and logged", ts: now }],
    createdAt: now, updatedAt: now,
  };
  store.incidents.push(incident);
  saveStore(store);
  recordGovernanceAudit("create", "incident", incident.id, incident.title, input.detectedBy, `Incident created: ${incident.title} (${incident.severity})`, undefined, incident.severity === "critical" || incident.severity === "high" ? "critical" : "warning");
  pushLog("warning", "security", `Incident created: ${incident.title} [${incident.severity}]`);
  return incident;
}

export function updateIncident(id: string, patch: Partial<SecurityIncident>): SecurityIncident | null {
  const store = getStore();
  const idx = store.incidents.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  store.incidents[idx] = { ...store.incidents[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.incidents[idx];
}

export function addIncidentTimelineEntry(incidentId: string, entry: Omit<IncidentTimelineEntry, "id" | "ts">): SecurityIncident | null {
  const incident = getIncident(incidentId);
  if (!incident) return null;
  const timelineEntry: IncidentTimelineEntry = { ...entry, id: uid("it"), ts: Date.now() };
  return updateIncident(incidentId, { timeline: [...incident.timeline, timelineEntry] });
}

export function assignIncident(id: string, assignedTo: string, assignedToName: string): SecurityIncident | null {
  const updated = updateIncident(id, { assignedTo, assignedToName, status: "investigating" });
  if (updated) addIncidentTimelineEntry(id, { action: "assigned", actor: assignedTo, detail: `Assigned to ${assignedToName}` });
  return updated;
}

export function closeIncident(id: string, resolution: string, rootCause: string, lessonsLearned: string[]): SecurityIncident | null {
  return updateIncident(id, {
    status: "closed", resolution, rootCause, lessonsLearned, closedAt: Date.now(),
    timeline: [...(getIncident(id)?.timeline || []), { id: uid("it"), action: "closed", actor: "system", detail: "Incident closed", ts: Date.now() }],
  });
}

/* ================================================================== */
/*  MODULE 9: SECURITY OPERATIONS                                      */
/* ================================================================== */

export function getSecurityThreats(): SecurityThreat[] {
  return getStore().securityThreats;
}

export function getVulnerabilities(): Vulnerability[] {
  return getStore().vulnerabilities;
}

export function updateVulnerability(id: string, patch: Partial<Vulnerability>): Vulnerability | null {
  const store = getStore();
  const idx = store.vulnerabilities.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  store.vulnerabilities[idx] = { ...store.vulnerabilities[idx], ...patch };
  saveStore(store);
  return store.vulnerabilities[idx];
}

export function getCertificates(): CertificateInfo[] {
  return getStore().certificates;
}

export function getSecretRotations(): SecretRotation[] {
  return getStore().secretRotations;
}

export function rotateSecret(id: string): SecretRotation | null {
  const store = getStore();
  const idx = store.secretRotations.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const now = Date.now();
  store.secretRotations[idx] = {
    ...store.secretRotations[idx],
    lastRotatedAt: now,
    nextRotationAt: now + store.secretRotations[idx].rotationIntervalDays * 86400000,
    status: "ok",
  };
  saveStore(store);
  recordGovernanceAudit("rotate", "secret", id, store.secretRotations[idx].name, "system", `Secret rotated: ${store.secretRotations[idx].name}`);
  pushLog("info", "security", `Secret rotated: ${store.secretRotations[idx].name}`);
  return store.secretRotations[idx];
}

export function getSecurityOperationsStats(): { totalThreats: number; activeThreats: number; blockedThreats: number; totalVulns: number; openVulns: number; fixedVulns: number; totalCerts: number; expiringCerts: number; totalSecrets: number; overdueSecrets: number } {
  const store = getStore();
  return {
    totalThreats: store.securityThreats.length,
    activeThreats: store.securityThreats.filter((t) => t.status === "active" || t.status === "investigating").length,
    blockedThreats: store.securityThreats.filter((t) => t.status === "blocked" || t.status === "mitigated").length,
    totalVulns: store.vulnerabilities.length,
    openVulns: store.vulnerabilities.filter((v) => v.status === "open" || v.status === "in_progress").length,
    fixedVulns: store.vulnerabilities.filter((v) => v.status === "fixed").length,
    totalCerts: store.certificates.length,
    expiringCerts: store.certificates.filter((c) => c.status === "expiring" || c.status === "expired").length,
    totalSecrets: store.secretRotations.length,
    overdueSecrets: store.secretRotations.filter((s) => s.status === "overdue").length,
  };
}

/* ================================================================== */
/*  MODULE 10: COMPLIANCE PLATFORM                                     */
/* ================================================================== */

export interface ComplianceFramework {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  controls: ComplianceControl[];
  status: "not_started" | "in_progress" | "audit_ready" | "certified" | "expired";
  certificationDate?: number;
  expiryDate?: number;
  assignedTo: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: string;
  requirements: string[];
  status: "non_compliant" | "partially_compliant" | "compliant" | "not_applicable";
  lastCheckedAt?: number;
  evidenceUrls: string[];
  notes: string;
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: "fw_gdpr", name: "GDPR", code: "GDPR", description: "EU General Data Protection Regulation", version: "2018/679",
    controls: [
      { id: uid("cc"), name: "Consent Management", description: "Explicit consent for data processing", category: "Data Subject Rights", requirements: ["Consent records", "Withdrawal mechanism", "Age verification"], status: "compliant", lastCheckedAt: Date.now() - 7 * 86400000, evidenceUrls: [] as string[], notes: "Consent management implemented via cookie banner" },
      { id: uid("cc"), name: "Data Access Requests", description: "Right to access personal data", category: "Data Subject Rights", requirements: ["SAR process", "Response within 30 days", "Identity verification"], status: "compliant", lastCheckedAt: Date.now() - 14 * 86400000, evidenceUrls: [] as string[], notes: "Automated SAR process via support portal" },
      { id: uid("cc"), name: "Data Deletion", description: "Right to be forgotten", category: "Data Subject Rights", requirements: ["Deletion process", "Verification workflow", "Third-party notification"], status: "partially_compliant", lastCheckedAt: Date.now() - 21 * 86400000, evidenceUrls: [] as string[], notes: "Deletion process exists but third-party notification needs automation" },
      { id: uid("cc"), name: "Breach Notification", description: "72-hour breach notification", category: "Security", requirements: ["Incident response plan", "Notification template", "DPO contact"], status: "compliant", lastCheckedAt: Date.now() - 7 * 86400000, evidenceUrls: [] as string[], notes: "Incident response plan documented" },
    ],
    status: "audit_ready", assignedTo: "admin_4",
  },
  {
    id: "fw_ccpa", name: "CCPA", code: "CCPA", description: "California Consumer Privacy Act", version: "2020",
    controls: [
      { id: uid("cc"), name: "Right to Know", description: "Disclosure of collected data", category: "Disclosure", requirements: ["Data inventory", "Disclosure mechanism", "Response process"], status: "compliant", lastCheckedAt: Date.now() - 14 * 86400000, evidenceUrls: [] as string[], notes: "" },
      { id: uid("cc"), name: "Opt-Out Rights", description: "Right to opt out of data sale", category: "Data Subject Rights", requirements: ["Do Not Sell link", "Opt-out mechanism", "Compliance tracking"], status: "compliant", lastCheckedAt: Date.now() - 7 * 86400000, evidenceUrls: [] as string[], notes: "" },
      { id: uid("cc"), name: "Non-Discrimination", description: "No discrimination for exercising rights", category: "Data Subject Rights", requirements: ["Policy documented", "Training completed"], status: "compliant", lastCheckedAt: Date.now() - 30 * 86400000, evidenceUrls: [] as string[], notes: "" },
    ],
    status: "in_progress", assignedTo: "admin_4",
  },
  {
    id: "fw_soc2", name: "SOC 2", code: "SOC2", description: "Service Organization Control 2", version: "2023",
    controls: [
      { id: uid("cc"), name: "Security Monitoring", description: "Continuous security monitoring", category: "Security", requirements: ["SIEM tool", "Alert rules", "Response procedures"], status: "non_compliant", lastCheckedAt: undefined, evidenceUrls: [] as string[], notes: "SIEM tool evaluation in progress" },
      { id: uid("cc"), name: "Access Control", description: "Logical and physical access controls", category: "Access", requirements: ["Access reviews", "MFA", "Session management"], status: "partially_compliant", lastCheckedAt: undefined, evidenceUrls: [] as string[], notes: "Quarterly access reviews needed" },
      { id: uid("cc"), name: "Change Management", description: "Controlled change process", category: "Operations", requirements: ["Change policy", "Approval workflow", "Testing requirements"], status: "compliant", lastCheckedAt: undefined, evidenceUrls: [] as string[], notes: "Change management process documented" },
    ],
    status: "not_started", assignedTo: "admin_4",
  },
  {
    id: "fw_iso27001", name: "ISO 27001", code: "ISO27001", description: "Information Security Management", version: "2022",
    controls: [
      { id: uid("cc"), name: "Information Security Policy", description: "ISMS policy framework", category: "Policy", requirements: ["Policy document", "Review cycle", "Approval process"], status: "compliant", lastCheckedAt: undefined, evidenceUrls: [] as string[], notes: "ISMS policy published" },
      { id: uid("cc"), name: "Risk Assessment", description: "Risk assessment and treatment", category: "Risk", requirements: ["Risk methodology", "Risk register", "Treatment plan"], status: "partially_compliant", lastCheckedAt: undefined, evidenceUrls: [] as string[], notes: "Risk register established, review cycle needs implementation" },
      { id: uid("cc"), name: "Asset Management", description: "Asset inventory and classification", category: "Asset", requirements: ["Asset register", "Classification scheme", "Ownership assignments"], status: "non_compliant", lastCheckedAt: undefined, evidenceUrls: [] as string[], notes: "Asset register partially complete" },
    ],
    status: "not_started", assignedTo: "admin_4",
  },
];

export function getComplianceFrameworks(): ComplianceFramework[] {
  return COMPLIANCE_FRAMEWORKS;
}

export function updateComplianceControl(frameworkCode: string, controlId: string, patch: Partial<ComplianceControl>): ComplianceControl | null {
  const fw = COMPLIANCE_FRAMEWORKS.find((f) => f.code === frameworkCode);
  if (!fw) return null;
  const idx = fw.controls.findIndex((c) => c.id === controlId);
  if (idx === -1) return null;
  fw.controls[idx] = { ...fw.controls[idx], ...patch, lastCheckedAt: Date.now() };
  return fw.controls[idx];
}

export function getComplianceOverallStatus(): { score: number; passed: number; total: number; byFramework: { name: string; score: number; status: string }[] } {
  const frameworks = getComplianceFrameworks();
  let totalControls = 0;
  let compliantControls = 0;

  const byFramework = frameworks.map((fw) => {
    const total = fw.controls.length;
    const compliant = fw.controls.filter((c) => c.status === "compliant").length;
    totalControls += total;
    compliantControls += compliant;
    const score = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { name: fw.name, score, status: fw.status };
  });

  return {
    score: totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0,
    passed: compliantControls,
    total: totalControls,
    byFramework,
  };
}

/* ================================================================== */
/*  MODULE 11: AI GOVERNANCE                                           */
/* ================================================================== */

export function getAiGovernancePolicies(): AiGovernancePolicy[] {
  return getStore().aiGovernancePolicies;
}

export function updateAiGovernancePolicy(id: string, patch: Partial<AiGovernancePolicy>): AiGovernancePolicy | null {
  const store = getStore();
  const idx = store.aiGovernancePolicies.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.aiGovernancePolicies[idx] = { ...store.aiGovernancePolicies[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.aiGovernancePolicies[idx];
}

export function getAiActionApprovals(): AiActionApproval[] {
  return getStore().aiActionApprovals;
}

export function approveAiAction(id: string, approvedBy: string, approvedByName: string): AiActionApproval | null {
  const store = getStore();
  const idx = store.aiActionApprovals.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.aiActionApprovals[idx] = { ...store.aiActionApprovals[idx], status: "approved", approvedBy, approvedByName, approvedAt: Date.now() };
  saveStore(store);
  return store.aiActionApprovals[idx];
}

export function rejectAiAction(id: string, approvedBy: string, approvedByName: string, reason: string): AiActionApproval | null {
  const store = getStore();
  const idx = store.aiActionApprovals.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.aiActionApprovals[idx] = { ...store.aiActionApprovals[idx], status: "rejected", approvedBy, approvedByName, approvedAt: Date.now(), rejectReason: reason };
  saveStore(store);
  return store.aiActionApprovals[idx];
}

export function getAiExplainabilityRecords(): AiExplainabilityRecord[] {
  return getStore().aiExplainabilityRecords;
}

export function getAiGovernanceStats(): { totalPolicies: number; enabledPolicies: number; totalApprovals: number; pendingApprovals: number; approvedApprovals: number; rejectedApprovals: number; totalExplanations: number; biasDetected: number } {
  const store = getStore();
  return {
    totalPolicies: store.aiGovernancePolicies.length,
    enabledPolicies: store.aiGovernancePolicies.filter((p) => p.enabled).length,
    totalApprovals: store.aiActionApprovals.length,
    pendingApprovals: store.aiActionApprovals.filter((a) => a.status === "pending").length,
    approvedApprovals: store.aiActionApprovals.filter((a) => a.status === "approved").length,
    rejectedApprovals: store.aiActionApprovals.filter((a) => a.status === "rejected").length,
    totalExplanations: store.aiExplainabilityRecords.length,
    biasDetected: store.aiExplainabilityRecords.filter((r) => r.biasDetected).length,
  };
}

/* ================================================================== */
/*  MODULE 12: GOVERNANCE ANALYTICS & REPORTS                          */
/* ================================================================== */

export function getGovernanceDashboard(): GovernanceDashboardData {
  const store = getStore();
  const compliance = getComplianceOverallStatus();
  return {
    totalPolicies: store.policies.length,
    publishedPolicies: store.policies.filter((p) => p.status === "published").length,
    totalChangeRequests: store.changeRequests.length,
    pendingChangeRequests: store.changeRequests.filter((c) => c.status === "draft" || c.status === "review" || c.status === "approved").length,
    totalRisks: store.risks.length,
    criticalRisks: store.risks.filter((r) => r.score >= 15 || r.status === "accepted").length,
    totalIncidents: store.incidents.length,
    activeIncidents: store.incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length,
    totalVulnerabilities: store.vulnerabilities.length,
    openVulnerabilities: store.vulnerabilities.filter((v) => v.status === "open" || v.status === "in_progress").length,
    complianceScore: compliance.score,
    auditEventsToday: store.auditEntries.filter((e) => e.ts > Date.now() - 86400000).length,
    activeSessions: store.adminSessions.filter((s) => s.status === "active").length,
    openFindings: store.risks.filter((r) => r.status === "identified" || r.status === "assessed" || r.status === "mitigating").length,
  };
}

export function getGovernanceMetrics(): GovernanceMetric[] {
  const dash = getGovernanceDashboard();
  return [
    { id: uid("gm"), name: "Published Policies", category: "governance", currentValue: dash.publishedPolicies, previousValue: 2, unit: "", trend: "up", status: "good" },
    { id: uid("gm"), name: "Pending Changes", category: "governance", currentValue: dash.pendingChangeRequests, previousValue: 1, unit: "", trend: "up", status: dash.pendingChangeRequests > 3 ? "warning" : "good" },
    { id: uid("gm"), name: "Open Vulnerabilities", category: "security", currentValue: dash.openVulnerabilities, previousValue: 1, unit: "", trend: "down", status: dash.openVulnerabilities > 2 ? "critical" : "warning" },
    { id: uid("gm"), name: "Compliance Score", category: "compliance", currentValue: dash.complianceScore, previousValue: 65, unit: "%", trend: "up", status: dash.complianceScore >= 80 ? "good" : dash.complianceScore >= 50 ? "warning" : "critical" },
    { id: uid("gm"), name: "Active Incidents", category: "incidents", currentValue: dash.activeIncidents, previousValue: 1, unit: "", trend: "down", status: dash.activeIncidents > 0 ? "warning" : "good" },
    { id: uid("gm"), name: "Active Admin Sessions", category: "administration", currentValue: dash.activeSessions, previousValue: 3, unit: "", trend: "stable", status: "good" },
    { id: uid("gm"), name: "Critical Risks", category: "risk", currentValue: dash.criticalRisks, previousValue: 3, unit: "", trend: "stable", status: dash.criticalRisks > 2 ? "warning" : "good" },
    { id: uid("gm"), name: "Audit Events (24h)", category: "audit", currentValue: dash.auditEventsToday, previousValue: 0, unit: "", trend: "up", status: "good" },
  ];
}

export function generateGovernanceReport(type: "compliance" | "audit" | "risk" | "security" | "incidents" | "administration"): { title: string; type: string; generatedAt: number; data: any } {
  const now = Date.now();
  const store = getStore();

  switch (type) {
    case "compliance": {
      const compliance = getComplianceOverallStatus();
      return {
        title: "Compliance Report", type, generatedAt: now,
        data: { overall: { score: compliance.score, passed: compliance.passed, total: compliance.total }, frameworks: getComplianceFrameworks().map((f) => ({ name: f.name, code: f.code, status: f.status, controls: f.controls.length, compliant: f.controls.filter((c) => c.status === "compliant").length })) },
      };
    }
    case "audit":
      return {
        title: "Audit Report", type, generatedAt: now,
        data: { stats: getGovernanceAuditStats(), recentEntries: store.auditEntries.slice(0, 20) },
      };
    case "risk":
      return {
        title: "Risk Report", type, generatedAt: now,
        data: { totalRisks: store.risks.length, byCategory: store.risks.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {} as Record<string, number>), byStatus: store.risks.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>), riskMatrix: getRiskMatrix() },
      };
    case "security":
      return { title: "Security Report", type, generatedAt: now, data: { stats: getSecurityOperationsStats(), threats: store.securityThreats, vulnerabilities: store.vulnerabilities } };
    case "incidents":
      return { title: "Incident Report", type, generatedAt: now, data: { total: store.incidents.length, bySeverity: store.incidents.reduce((acc, i) => { acc[i.severity] = (acc[i.severity] || 0) + 1; return acc; }, {} as Record<string, number>), byType: store.incidents.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {} as Record<string, number>), open: store.incidents.filter((i) => i.status !== "closed" && i.status !== "resolved") } };
    case "administration":
      return { title: "Administration Report", type, generatedAt: now, data: { settings: store.settings.length, featureFlags: store.featureFlags.length, departments: store.departments.length, roles: store.enterpriseRoles.length, sessions: store.adminSessions.length, breakGlassAccounts: store.breakGlassAccounts.length } };
  }
}
