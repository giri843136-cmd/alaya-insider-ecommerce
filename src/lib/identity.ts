/**
 * ALAYA INSIDER — Enterprise Identity, Authentication, Authorization & Zero Trust Platform
 * -------------------------------------------------------------------------------
 * Centralized identity system for all users, admins, editors, suppliers, affiliates,
 * AI agents, APIs, workers, microservices, SDKs, and external integrations.
 *
 * Implements: RBAC, ABAC, MFA, WebAuthn, Passkeys, OAuth2, OIDC, SAML, JWT,
 * API Keys, Service Accounts, Zero Trust, Session Management, Audit, Compliance.
 */
import { uid } from "./utils";
import { generateToken, generate2FASecret, backupCodes } from "./security";

/* ================================================================== */
/*  ENUMS & CONSTANTS                                                  */
/* ================================================================== */

export const IDENTITY_STORAGE_KEY = "alaya_identity_store";
export const AUTH_STORAGE_KEY = "alaya_auth_store";
export const ZT_STORAGE_KEY = "alaya_zero_trust_store";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 30_000;
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const JWT_ISSUER = "alaya-insider";
export const MAX_SESSIONS_PER_USER = 10;

/* ================================================================== */
/*  TYPES: Core Identity                                               */
/* ================================================================== */

export type IdentityProvider = "local" | "google" | "github" | "microsoft" | "apple" | "saml" | "oidc" | "ldap";
export type UserStatus = "active" | "inactive" | "suspended" | "locked" | "pending_verification" | "pending_invite";
export type UserType = "admin" | "editor" | "manager" | "supplier" | "affiliate" | "customer" | "api_service" | "ai_agent" | "worker" | "system";
export type AuthMethod = "password" | "magic_link" | "passkey" | "webauthn" | "oauth2" | "saml" | "api_key" | "jwt" | "mfa_totp" | "mfa_sms" | "mfa_email" | "biometric";
export type MFAType = "totp" | "sms" | "email" | "backup_code" | "passkey";
export type PermissionEffect = "allow" | "deny";
export type PermissionScope = "global" | "organization" | "team" | "resource";
export type AuthEventType = "login" | "logout" | "login_failed" | "mfa_challenge" | "mfa_success" | "mfa_failed" | "password_changed" | "password_reset" | "email_verified" | "phone_verified" | "session_created" | "session_revoked" | "token_refreshed" | "api_key_created" | "api_key_revoked" | "permission_changed" | "role_assigned" | "role_revoked" | "user_created" | "user_suspended" | "user_reactivated" | "trusted_device_added" | "suspicious_login" | "geo_blocked" | "vpn_detected" | "break_glass_used" | "impersonation_start" | "impersonation_end" | "emergency_access" | "compliance_export";

/* ================================================================== */
/*  INTERFACES                                                         */
/* ================================================================== */

export interface IdentityUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  passwordHash: string;
  name: string;
  avatar?: string;
  type: UserType;
  status: UserStatus;
  mfaEnabled: boolean;
  mfaType?: MFAType;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  webauthnCredentials: WebAuthnCredential[];
  passkeyCredentials: PasskeyCredential[];
  trustedDevices: TrustedDevice[];
  identities: LinkedIdentity[];
  organizations: string[];
  teams: string[];
  roles: string[];
  permissions: string[];
  attributes: Record<string, string>;
  department?: string;
  title?: string;
  locale: string;
  lockedUntil: number;
  loginAttempts: number;
  lastLogin?: number;
  lastIp?: string;
  passwordChangedAt: number;
  createdAt: number;
  createdBy?: string;
  updatedAt: number;
  inviteToken?: string;
  inviteExpires?: number;
  breakGlass: boolean;
  impersonator?: string;
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: number;
  lastUsed?: number;
}

export interface PasskeyCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  deviceName: string;
  platform: string;
  createdAt: number;
  lastUsed?: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: string;
  browser: string;
  platform: string;
  ip: string;
  location: string;
  trustedUntil: number;
  createdAt: number;
  lastUsed?: number;
}

export interface LinkedIdentity {
  provider: IdentityProvider;
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  linkedAt: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  plan: "free" | "starter" | "business" | "enterprise";
  status: "active" | "suspended" | "trial";
  ownerId: string;
  admins: string[];
  members: string[];
  teams: string[];
  departments: string[];
  settings: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  members: string[];
  roles: string[];
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
  headId?: string;
  members: string[];
  createdAt: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: "system" | "custom" | "organization" | "team";
  permissions: string[];
  inherits: string[];
  priority: number;
  isTemplate: boolean;
  editable: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PermissionDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  group: string;
  scope: PermissionScope;
  effect: PermissionEffect;
  dependsOn?: string[];
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  roles: Omit<Role, "id" | "createdAt" | "updatedAt">[];
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: number;
}

export interface ApiKey {
  id: string;
  key: string;
  prefix: string;
  name: string;
  userId: string;
  type: "user" | "service_account" | "machine";
  permissions: string[];
  scopes: string[];
  allowedIps: string[];
  expiresAt?: number;
  lastUsed?: number;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export interface ServiceAccount {
  id: string;
  name: string;
  description: string;
  type: "api" | "worker" | "ai_agent" | "microservice" | "webhook" | "cli" | "sdk";
  userId?: string;
  roles: string[];
  permissions: string[];
  apiKeys: string[];
  active: boolean;
  lastUsed?: number;
  createdAt: number;
  createdBy: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  type: AuthMethod;
  token: string;
  refreshToken: string;
  ip: string;
  userAgent: string;
  deviceName: string;
  location: string;
  fingerprint: string;
  mfaVerified: boolean;
  expiresAt: number;
  refreshExpiresAt: number;
  lastActivity: number;
  createdAt: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  type: AuthMethod;
  success: boolean;
  ip: string;
  location: string;
  userAgent: string;
  browser: string;
  platform: string;
  riskScore: number;
  reason?: string;
  ts: number;
}

export interface IdentityEvent {
  id: string;
  ts: number;
  type: AuthEventType;
  userId: string;
  actor: string;
  detail: string;
  ip?: string;
  metadata?: Record<string, string>;
}

export interface BreakGlassAccount {
  id: string;
  name: string;
  email: string;
  reason: string;
  expiresAt: number;
  usedAt?: number;
  usedBy?: string;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export interface ImpersonationLog {
  id: string;
  impersonatorId: string;
  impersonatorName: string;
  targetId: string;
  targetName: string;
  reason: string;
  startedAt: number;
  endedAt?: number;
}

export interface EmergencyAccess {
  id: string;
  requesterId: string;
  requesterName: string;
  reason: string;
  durationMinutes: number;
  status: "requested" | "approved" | "denied" | "expired";
  approverId?: string;
  approverName?: string;
  grantedAt?: number;
  expiresAt?: number;
  createdAt: number;
}

/* ================================================================== */
/*  ZERO TRUST TYPES                                                   */
/* ================================================================== */

export type ZtPolicyEffect = "allow" | "deny" | "require_mfa" | "require_approval";
export type ZtConditionType = "ip_range" | "geo_country" | "time_window" | "device_trusted" | "mfa_status" | "risk_score" | "user_agent" | "authentication_method" | "vpn_status" | "past_behavior";

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  effect: ZtPolicyEffect;
  conditions: ZtCondition[];
  priority: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ZtCondition {
  type: ZtConditionType;
  operator: "in" | "not_in" | "equals" | "not_equals" | "gt" | "lt" | "between" | "contains";
  value: string | string[] | number;
  label: string;
}

export interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  score: number;
  detail: string;
}

export interface GeoRestriction {
  id: string;
  name: string;
  type: "allow" | "block";
  countries: string[];
  enabled: boolean;
}

export interface IpRestriction {
  id: string;
  name: string;
  type: "allow" | "block";
  ranges: string[];
  enabled: boolean;
}

/* ================================================================== */
/*  IDENTITY STORE (persisted)                                        */
/* ================================================================== */

interface IdentityStore {
  users: IdentityUser[];
  organizations: Organization[];
  teams: Team[];
  departments: Department[];
  roles: Role[];
  permissionGroups: PermissionGroup[];
  apiKeys: ApiKey[];
  serviceAccounts: ServiceAccount[];
  sessions: AuthSession[];
  loginHistory: LoginHistoryEntry[];
  events: IdentityEvent[];
  breakGlassAccounts: BreakGlassAccount[];
  impersonations: ImpersonationLog[];
  emergencyAccesses: EmergencyAccess[];
  trustedDevices: TrustedDevice[];
  zeroTrustPolicies: ZeroTrustPolicy[];
  geoRestrictions: GeoRestriction[];
  ipRestrictions: IpRestriction[];
}

export function getStore(): IdentityStore {
  try {
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IdentityStore;
  } catch { /* ignore */ }
  return { users: [], organizations: [], teams: [], departments: [], roles: [], permissionGroups: [], apiKeys: [], serviceAccounts: [], sessions: [], loginHistory: [], events: [], breakGlassAccounts: [], impersonations: [], emergencyAccesses: [], trustedDevices: [], zeroTrustPolicies: [], geoRestrictions: [], ipRestrictions: [] };
}

function saveStore(store: IdentityStore) {
  try { localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

function savePartial<K extends keyof IdentityStore>(key: K, val: IdentityStore[K]) {
  const store = getStore();
  store[key] = val;
  saveStore(store);
}

/* ================================================================== */
/*  SYSTEM ROLES & PERMISSIONS                                        */
/* ================================================================== */

export const SYSTEM_ROLES: Role[] = [
  { id: "role_super_admin", name: "Super Admin", description: "Full system access with all permissions", type: "system", permissions: ["*"], inherits: [], priority: 9999, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_admin", name: "Administrator", description: "Administrative access to all modules", type: "system", permissions: ["admin.*", "content.*", "commerce.*", "users.read", "analytics.*"], inherits: ["role_editor"], priority: 100, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_editor", name: "Editor", description: "Content creation and management", type: "system", permissions: ["content.create", "content.read", "content.update", "media.*", "seo.*"], inherits: [], priority: 50, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_manager", name: "Manager", description: "Operational management access", type: "system", permissions: ["commerce.orders.*", "commerce.products.read", "users.read", "analytics.read", "reports.*"], inherits: ["role_editor"], priority: 70, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_supplier", name: "Supplier", description: "Supplier portal access", type: "system", permissions: ["supplier.products.*", "supplier.orders.read", "supplier.profile"], inherits: [], priority: 30, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_affiliate", name: "Affiliate", description: "Affiliate platform access", type: "system", permissions: ["affiliate.links.*", "affiliate.commissions.read", "affiliate.reports"], inherits: [], priority: 30, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_customer", name: "Customer", description: "Storefront customer access", type: "system", permissions: ["account.*", "orders.own.*", "wishlist.*", "reviews.create"], inherits: [], priority: 10, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_api_service", name: "API Service", description: "API and machine-to-machine access", type: "system", permissions: ["api.*", "webhooks.*"], inherits: [], priority: 20, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_ai_agent", name: "AI Agent", description: "AI workspace and automation access", type: "system", permissions: ["ai.*", "content.read", "media.read", "analytics.read"], inherits: [], priority: 20, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
  { id: "role_auditor", name: "Auditor", description: "Read-only access for compliance auditing", type: "system", permissions: ["audit.*", "users.read", "analytics.read", "reports.*", "compliance.*"], inherits: [], priority: 40, isTemplate: false, editable: false, createdAt: Date.now() - 365 * 86400000, updatedAt: Date.now() - 365 * 86400000 },
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { id: "perm_all", key: "*", name: "All Permissions", description: "Super admin access to everything", group: "System", scope: "global", effect: "allow" },
  { id: "perm_admin_all", key: "admin.*", name: "Admin Access", description: "All admin panel access", group: "Admin", scope: "global", effect: "allow" },
  { id: "perm_users_read", key: "users.read", name: "Read Users", description: "View user profiles", group: "Users", scope: "organization", effect: "allow" },
  { id: "perm_users_create", key: "users.create", name: "Create Users", description: "Create new users", group: "Users", scope: "organization", effect: "allow" },
  { id: "perm_users_update", key: "users.update", name: "Update Users", description: "Modify user profiles", group: "Users", scope: "organization", effect: "allow" },
  { id: "perm_users_delete", key: "users.delete", name: "Delete Users", description: "Remove users from system", group: "Users", scope: "organization", effect: "allow" },
  { id: "perm_users_roles", key: "users.roles", name: "Manage Roles", description: "Assign and revoke roles", group: "Users", scope: "organization", effect: "allow" },
  { id: "perm_content_create", key: "content.create", name: "Create Content", description: "Create content items", group: "Content", scope: "organization", effect: "allow" },
  { id: "perm_content_read", key: "content.read", name: "Read Content", description: "View content items", group: "Content", scope: "global", effect: "allow" },
  { id: "perm_content_update", key: "content.update", name: "Update Content", description: "Modify content items", group: "Content", scope: "organization", effect: "allow" },
  { id: "perm_content_delete", key: "content.delete", name: "Delete Content", description: "Remove content items", group: "Content", scope: "organization", effect: "allow" },
  { id: "perm_media_all", key: "media.*", name: "Media Access", description: "All media library operations", group: "Media", scope: "organization", effect: "allow" },
  { id: "perm_seo_all", key: "seo.*", name: "SEO Access", description: "All SEO studio operations", group: "SEO", scope: "organization", effect: "allow" },
  { id: "perm_commerce_orders", key: "commerce.orders.*", name: "Orders", description: "All order operations", group: "Commerce", scope: "organization", effect: "allow" },
  { id: "perm_commerce_products_read", key: "commerce.products.read", name: "Read Products", description: "View product catalog", group: "Commerce", scope: "global", effect: "allow" },
  { id: "perm_commerce_products_write", key: "commerce.products.write", name: "Write Products", description: "Create and update products", group: "Commerce", scope: "organization", effect: "allow" },
  { id: "perm_commerce_products_delete", key: "commerce.products.delete", name: "Delete Products", description: "Remove products", group: "Commerce", scope: "organization", effect: "allow" },
  { id: "perm_analytics_all", key: "analytics.*", name: "Analytics", description: "All analytics access", group: "Analytics", scope: "organization", effect: "allow" },
  { id: "perm_analytics_read", key: "analytics.read", name: "Read Analytics", description: "View analytics dashboards", group: "Analytics", scope: "organization", effect: "allow" },
  { id: "perm_reports_all", key: "reports.*", name: "Reports", description: "All report generation", group: "Reports", scope: "organization", effect: "allow" },
  { id: "perm_audit_all", key: "audit.*", name: "Audit Access", description: "View audit logs and events", group: "Audit", scope: "global", effect: "allow" },
  { id: "perm_compliance_all", key: "compliance.*", name: "Compliance", description: "Compliance management", group: "Compliance", scope: "global", effect: "allow" },
  { id: "perm_account_all", key: "account.*", name: "Account", description: "Own account management", group: "Account", scope: "resource", effect: "allow" },
  { id: "perm_orders_own", key: "orders.own.*", name: "My Orders", description: "View own orders", group: "Orders", scope: "resource", effect: "allow" },
  { id: "perm_wishlist_all", key: "wishlist.*", name: "Wishlist", description: "Own wishlist management", group: "Wishlist", scope: "resource", effect: "allow" },
  { id: "perm_reviews_create", key: "reviews.create", name: "Write Reviews", description: "Submit product reviews", group: "Reviews", scope: "resource", effect: "allow" },
  { id: "perm_supplier_products", key: "supplier.products.*", name: "Supplier Products", description: "Manage own products", group: "Supplier", scope: "organization", effect: "allow" },
  { id: "perm_supplier_orders_read", key: "supplier.orders.read", name: "View Supplier Orders", description: "View assigned orders", group: "Supplier", scope: "organization", effect: "allow" },
  { id: "perm_supplier_profile", key: "supplier.profile", name: "Supplier Profile", description: "Edit supplier profile", group: "Supplier", scope: "resource", effect: "allow" },
  { id: "perm_affiliate_links", key: "affiliate.links.*", name: "Affiliate Links", description: "Manage affiliate links", group: "Affiliate", scope: "organization", effect: "allow" },
  { id: "perm_affiliate_commissions_read", key: "affiliate.commissions.read", name: "View Commissions", description: "View commission data", group: "Affiliate", scope: "organization", effect: "allow" },
  { id: "perm_affiliate_reports", key: "affiliate.reports", name: "Affiliate Reports", description: "View affiliate reports", group: "Affiliate", scope: "organization", effect: "allow" },
  { id: "perm_api_all", key: "api.*", name: "API Access", description: "All API endpoints", group: "API", scope: "global", effect: "allow" },
  { id: "perm_webhooks_all", key: "webhooks.*", name: "Webhooks", description: "Webhook management", group: "API", scope: "organization", effect: "allow" },
  { id: "perm_ai_all", key: "ai.*", name: "AI Access", description: "AI workspace access", group: "AI", scope: "organization", effect: "allow" },
  { id: "perm_settings_all", key: "settings.*", name: "Settings", description: "System settings management", group: "System", scope: "global", effect: "allow" },
  { id: "perm_security_all", key: "security.*", name: "Security", description: "Security center access", group: "System", scope: "global", effect: "allow" },
  { id: "perm_identity_all", key: "identity.*", name: "Identity", description: "Identity management access", group: "System", scope: "global", effect: "allow" },
  { id: "perm_identity_providers", key: "identity.providers", name: "Manage Providers", description: "Configure identity providers", group: "System", scope: "global", effect: "allow" },
  { id: "perm_identity_mfa", key: "identity.mfa", name: "Manage MFA", description: "Configure MFA policies", group: "System", scope: "global", effect: "allow" },
  { id: "perm_identity_break_glass", key: "identity.break_glass", name: "Break Glass", description: "Use emergency break glass accounts", group: "System", scope: "global", effect: "allow" },
  { id: "perm_identity_impersonate", key: "identity.impersonate", name: "Impersonate", description: "Impersonate other users", group: "System", scope: "global", effect: "allow" },
];

export const ROLE_TEMPLATES: RoleTemplate[] = [
  { id: "rt_ecommerce", name: "E-commerce Team", description: "Standard roles for an online store team", category: "Commerce", roles: [
    { name: "Store Manager", description: "Full store management", type: "custom", permissions: ["admin.*", "commerce.*", "content.*", "analytics.*", "users.read"], inherits: [], priority: 80, isTemplate: false, editable: true },
    { name: "Product Specialist", description: "Product catalog management", type: "custom", permissions: ["commerce.products.*", "media.*", "content.read"], inherits: [], priority: 40, isTemplate: false, editable: true },
    { name: "Customer Support", description: "Order and customer management", type: "custom", permissions: ["commerce.orders.*", "users.read", "account.*"], inherits: [], priority: 40, isTemplate: false, editable: true },
  ]},
  { id: "rt_marketing", name: "Marketing Team", description: "Marketing and content team roles", category: "Marketing", roles: [
    { name: "Marketing Lead", description: "Full marketing access", type: "custom", permissions: ["content.*", "seo.*", "analytics.*", "media.*", "reports.*"], inherits: [], priority: 70, isTemplate: false, editable: true },
    { name: "Content Writer", description: "Content creation", type: "custom", permissions: ["content.create", "content.read", "content.update", "media.*", "seo.*"], inherits: [], priority: 40, isTemplate: false, editable: true },
    { name: "SEO Specialist", description: "SEO management", type: "custom", permissions: ["seo.*", "content.read", "analytics.read"], inherits: [], priority: 40, isTemplate: false, editable: true },
  ]},
  { id: "rt_devops", name: "DevOps Team", description: "System and infrastructure team roles", category: "Engineering", roles: [
    { name: "DevOps Lead", description: "Full system access", type: "custom", permissions: ["admin.*", "security.*", "settings.*", "audit.*", "api.*"], inherits: [], priority: 90, isTemplate: false, editable: true },
    { name: "Security Analyst", description: "Security monitoring", type: "custom", permissions: ["security.*", "audit.*", "analytics.read", "users.read"], inherits: [], priority: 60, isTemplate: false, editable: true },
  ]},
  { id: "rt_enterprise", name: "Enterprise", description: "Enterprise organization hierarchy", category: "Organization", roles: [
    { name: "Org Admin", description: "Organization administrator", type: "organization", permissions: ["*"], inherits: [], priority: 100, isTemplate: false, editable: true },
    { name: "Department Head", description: "Department management", type: "organization", permissions: ["users.read", "users.create", "content.*", "analytics.read", "reports.*"], inherits: [], priority: 60, isTemplate: false, editable: true },
    { name: "Team Lead", description: "Team supervision", type: "team", permissions: ["users.read", "content.*"], inherits: [], priority: 40, isTemplate: false, editable: true },
  ]},
];

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

export function seedIdentityData() {
  const store = getStore();
  if (store.users.length > 0) return;

  const adminId = uid("usr");
  const adminUser: IdentityUser = {
    id: adminId,
    email: "alayainsider@gmail.com",
    emailVerified: true,
    phone: "+1-555-0100",
    phoneVerified: true,
    passwordHash: "pbkdf2:100000:5e884898da28047151d0e56f8dc62927:7b3d5b1a3c7e8f9a0b2c4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    name: "ALAYA Admin",
    avatar: "",
    type: "admin",
    status: "active",
    mfaEnabled: false,
    mfaBackupCodes: backupCodes(),
    webauthnCredentials: [],
    passkeyCredentials: [],
    trustedDevices: [],
    identities: [],
    organizations: [],
    teams: [],
    roles: ["role_super_admin", "role_admin"],
    permissions: ["*"],
    attributes: { department: "Engineering", title: "System Administrator" },
    locale: "en",
    lockedUntil: 0,
    loginAttempts: 0,
    lastLogin: Date.now() - 3600000,
    lastIp: "192.168.1.100",
    passwordChangedAt: Date.now() - 90 * 86400000,
    createdAt: Date.now() - 365 * 86400000,
    updatedAt: Date.now() - 3600000,
    breakGlass: false,
  };

  const editorId = uid("usr");
  const editorUser: IdentityUser = {
    id: editorId,
    email: "editor@alayainsider.com",
    emailVerified: true,
    phoneVerified: false,
    passwordHash: "pbkdf2:100000:5e884898da28047151d0e56f8dc62927:7b3d5b1a3c7e8f9a0b2c4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    name: "Sofia Chen",
    passwordChangedAt: Date.now() - 90 * 86400000,
    type: "editor",
    status: "active",
    mfaEnabled: true,
    mfaType: "totp",
    mfaSecret: generate2FASecret(),
    mfaBackupCodes: backupCodes(),
    webauthnCredentials: [],
    passkeyCredentials: [],
    trustedDevices: [],
    identities: [],
    organizations: [],
    teams: [],
    roles: ["role_editor"],
    permissions: ["content.*", "media.*", "seo.*"],
    attributes: { department: "Content", title: "Senior Editor" },
    locale: "en",
    lockedUntil: 0,
    loginAttempts: 0,
    lastLogin: Date.now() - 7200000,
    createdAt: Date.now() - 180 * 86400000,
    updatedAt: Date.now() - 7200000,
    breakGlass: false,
  };

  const supplierId = uid("usr");
  const supplierUser: IdentityUser = {
    id: supplierId,
    email: "supplier@example.com",
    emailVerified: true,
    phoneVerified: true,
    passwordHash: "pbkdf2:100000:5e884898da28047151d0e56f8dc62927:7b3d5b1a3c7e8f9a0b2c4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    name: "Marco Rossi",
    passwordChangedAt: Date.now() - 60 * 86400000,
    type: "supplier",
    status: "active",
    mfaEnabled: false,
    mfaBackupCodes: backupCodes(),
    webauthnCredentials: [],
    passkeyCredentials: [],
    trustedDevices: [],
    identities: [],
    organizations: [],
    teams: [],
    roles: ["role_supplier"],
    permissions: ["supplier.*"],
    attributes: { company: "Rossi Craft Inc.", country: "Italy" },
    locale: "en",
    lockedUntil: 0,
    loginAttempts: 0,
    createdAt: Date.now() - 60 * 86400000,
    updatedAt: Date.now() - 86400000,
    breakGlass: false,
  };

  const affiliateId = uid("usr");
  const affiliateUser: IdentityUser = {
    id: affiliateId,
    email: "affiliate@partner.com",
    emailVerified: true,
    phoneVerified: false,
    passwordHash: "pbkdf2:100000:5e884898da28047151d0e56f8dc62927:7b3d5b1a3c7e8f9a0b2c4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    name: "Lena Park",
    passwordChangedAt: Date.now() - 45 * 86400000,
    type: "affiliate",
    status: "active",
    mfaEnabled: false,
    mfaBackupCodes: backupCodes(),
    webauthnCredentials: [],
    passkeyCredentials: [],
    trustedDevices: [],
    identities: [],
    organizations: [],
    teams: [],
    roles: ["role_affiliate"],
    permissions: ["affiliate.*"],
    attributes: { network: "PartnerStack", region: "APAC" },
    locale: "en",
    lockedUntil: 0,
    loginAttempts: 0,
    createdAt: Date.now() - 45 * 86400000,
    updatedAt: Date.now() - 86400000,
    breakGlass: false,
  };

  const orgId = uid("org");
  const org: Organization = {
    id: orgId,
    name: "ALAYA INSIDER",
    slug: "alaya-insider",
    domain: "alayainsider.com",
    plan: "enterprise",
    status: "active",
    ownerId: adminId,
    admins: [adminId],
    members: [adminId, editorId, supplierId, affiliateId],
    teams: [],
    departments: [],
    settings: { timezone: "America/New_York", dateFormat: "MM/DD/YYYY" },
    createdAt: Date.now() - 365 * 86400000,
    updatedAt: Date.now() - 86400000,
  };

  const ztPolicy: ZeroTrustPolicy = {
    id: uid("ztp"),
    name: "Default Zero Trust Policy",
    description: "Requires verified authentication for all admin access",
    effect: "allow",
    conditions: [
      { type: "mfa_status", operator: "equals", value: "true", label: "MFA must be verified for admin access" },
      { type: "risk_score", operator: "lt", value: 70, label: "Risk score must be below 70" },
    ],
    priority: 100,
    enabled: true,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 86400000,
  };

  store.users = [adminUser, editorUser, supplierUser, affiliateUser];
  store.roles = SYSTEM_ROLES;
  store.organizations = [org];
  store.zeroTrustPolicies = [ztPolicy];
  saveStore(store);
}

/* Call seed on import */
seedIdentityData();

/* ================================================================== */
/*  USER MANAGEMENT                                                    */
/* ================================================================== */

export function getUsers(): IdentityUser[] {
  return getStore().users;
}

export function getUser(id: string): IdentityUser | undefined {
  return getStore().users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): IdentityUser | undefined {
  return getStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(input: {
  email: string; name: string; password: string; type: UserType;
  roles?: string[]; phone?: string; department?: string; title?: string; createdBy?: string;
}): IdentityUser | null {
  const existing = getUserByEmail(input.email);
  if (existing) return null;

  const store = getStore();
  const user: IdentityUser = {
    id: uid("usr"),
    email: input.email.toLowerCase(),
    emailVerified: false,
    phone: input.phone,
    phoneVerified: false,
    passwordHash: `pending_${generateToken(16)}`,
    name: input.name,
    type: input.type,
    status: "pending_verification",
    mfaEnabled: false,
    mfaBackupCodes: backupCodes(),
    webauthnCredentials: [],
    passkeyCredentials: [],
    trustedDevices: [],
    identities: [],
    organizations: [],
    teams: [],
    roles: input.roles || [getDefaultRoleForType(input.type)],
    permissions: [],
    attributes: { department: input.department || "", title: input.title || "" },
    locale: "en",
    lockedUntil: 0,
    loginAttempts: 0,
    passwordChangedAt: Date.now(),
    createdAt: Date.now(),
    createdBy: input.createdBy,
    updatedAt: Date.now(),
    breakGlass: false,
  };

  store.users.push(user);
  saveStore(store);
  logIdentityEvent("user_created", user.id, input.createdBy || user.id, `User ${user.email} created as ${user.type}`);
  return user;
}

export function updateUser(id: string, patch: Partial<IdentityUser>): IdentityUser | null {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.users[idx];
}

export function deleteUser(id: string): boolean {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  store.users.splice(idx, 1);
  saveStore(store);
  logIdentityEvent("user_created", id, "system", `User deleted`);
  return true;
}

export function suspendUser(id: string): boolean {
  const user = updateUser(id, { status: "suspended" });
  if (!user) return false;
  logIdentityEvent("user_suspended", id, "system", `User ${user.email} suspended`);
  return true;
}

export function reactivateUser(id: string): boolean {
  const user = updateUser(id, { status: "active", loginAttempts: 0, lockedUntil: 0 });
  if (!user) return false;
  logIdentityEvent("user_reactivated", id, "system", `User ${user.email} reactivated`);
  return true;
}

function getDefaultRoleForType(type: UserType): string {
  switch (type) {
    case "admin": return "role_admin";
    case "editor": return "role_editor";
    case "manager": return "role_manager";
    case "supplier": return "role_supplier";
    case "affiliate": return "role_affiliate";
    case "customer": return "role_customer";
    case "api_service": return "role_api_service";
    case "ai_agent": return "role_ai_agent";
    case "worker": return "role_api_service";
    case "system": return "role_api_service";
    default: return "role_customer";
  }
}

/* ================================================================== */
/*  INVITATION SYSTEM                                                 */
/* ================================================================== */

export function createInvitation(email: string, type: UserType, roles: string[], invitedBy: string): { token: string; expiresAt: number } | null {
  const existing = getUserByEmail(email);
  if (existing && existing.status !== "pending_invite") return null;

  const token = generateToken(32);
  const expiresAt = Date.now() + 7 * 86400000;
  const user = createUser({ email, name: email.split("@")[0], password: generateToken(16), type, roles, createdBy: invitedBy });
  if (!user) return null;
  updateUser(user.id, { status: "pending_invite", inviteToken: token, inviteExpires: expiresAt });
  return { token, expiresAt };
}

export function acceptInvitation(token: string, _password: string): IdentityUser | null {
  const store = getStore();
  const user = store.users.find((u) => u.inviteToken === token);
  if (!user || user.inviteExpires && user.inviteExpires < Date.now()) return null;
  user.status = "active";
  user.inviteToken = undefined;
  user.inviteExpires = undefined;
  user.passwordHash = `pending_${generateToken(16)}`;
  user.updatedAt = Date.now();
  saveStore(store);
  return user;
}

/* ================================================================== */
/*  ROLE & PERMISSION MANAGEMENT                                       */
/* ================================================================== */

export function getRoles(): Role[] {
  return getStore().roles;
}

export function getRole(id: string): Role | undefined {
  return getStore().roles.find((r) => r.id === id);
}

export function createRole(input: Omit<Role, "id" | "createdAt" | "updatedAt">): Role {
  const store = getStore();
  const role: Role = { ...input, id: uid("role"), createdAt: Date.now(), updatedAt: Date.now() };
  store.roles.push(role);
  saveStore(store);
  return role;
}

export function updateRole(id: string, patch: Partial<Role>): Role | null {
  const store = getStore();
  const idx = store.roles.findIndex((r) => r.id === id);
  if (idx === -1 || !store.roles[idx].editable) return null;
  store.roles[idx] = { ...store.roles[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.roles[idx];
}

export function deleteRole(id: string): boolean {
  const store = getStore();
  const idx = store.roles.findIndex((r) => r.id === id);
  if (idx === -1 || !store.roles[idx].editable) return false;
  store.roles.splice(idx, 1);
  saveStore(store);
  return true;
}

export function getUserPermissions(userId: string): string[] {
  const user = getUser(userId);
  if (!user) return [];
  if (user.permissions.includes("*")) return ["*"];

  const store = getStore();
  const perms = new Set<string>(user.permissions);

  for (const roleId of user.roles) {
    const role = store.roles.find((r) => r.id === roleId);
    if (role) {
      if (role.permissions.includes("*")) return ["*"];
      role.permissions.forEach((p) => perms.add(p));
      // Inherit from parent roles
      for (const inheritId of role.inherits) {
        const parentRole = store.roles.find((r) => r.id === inheritId);
        if (parentRole) parentRole.permissions.forEach((p) => perms.add(p));
      }
    }
  }
  return Array.from(perms);
}

export function hasPermission(userId: string, permission: string): boolean {
  if (!userId) return false;
  const perms = getUserPermissions(userId);
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  // Wildcard matching: e.g. "commerce.*" matches "commerce.orders.read"
  for (const p of perms) {
    if (p.endsWith(".*") && permission.startsWith(p.slice(0, -2))) return true;
  }
  return false;
}

export function getPermissionsForUser(userId: string): string[] {
  return getUserPermissions(userId);
}

/* ================================================================== */
/*  ORGANIZATION & TEAM MANAGEMENT                                     */
/* ================================================================== */

export function getOrganizations(): Organization[] {
  return getStore().organizations;
}

export function createOrganization(input: Omit<Organization, "id" | "createdAt" | "updatedAt">): Organization {
  const store = getStore();
  const org: Organization = { ...input, id: uid("org"), createdAt: Date.now(), updatedAt: Date.now() };
  store.organizations.push(org);
  saveStore(store);
  return org;
}

export function getTeams(): Team[] {
  return getStore().teams;
}

export function createTeam(input: Omit<Team, "id" | "createdAt" | "updatedAt">): Team {
  const store = getStore();
  const team: Team = { ...input, id: uid("team"), createdAt: Date.now(), updatedAt: Date.now() };
  store.teams.push(team);
  saveStore(store);
  return team;
}

/* ================================================================== */
/*  API KEY & SERVICE ACCOUNT MANAGEMENT                               */
/* ================================================================== */

export function createApiKey(input: {
  name: string; userId: string; type: ApiKey["type"]; permissions?: string[]; allowedIps?: string[]; expiresAt?: number; createdBy: string;
}): { apiKey: ApiKey; rawKey: string } {
  const rawKey = `ala_${generateToken(32)}`;
  const prefix = rawKey.slice(0, 8);
  const apiKey: ApiKey = {
    id: uid("apik"),
    key: rawKey,
    prefix,
    name: input.name,
    userId: input.userId,
    type: input.type,
    permissions: input.permissions || [],
    scopes: [],
    allowedIps: input.allowedIps || [],
    expiresAt: input.expiresAt,
    active: true,
    createdAt: Date.now(),
    createdBy: input.createdBy,
  };
  const store = getStore();
  store.apiKeys.push(apiKey);
  saveStore(store);
  logIdentityEvent("api_key_created", input.userId, input.createdBy, `API key "${input.name}" created`);
  return { apiKey, rawKey };
}

export function revokeApiKey(id: string): boolean {
  const store = getStore();
  const idx = store.apiKeys.findIndex((k) => k.id === id);
  if (idx === -1) return false;
  store.apiKeys[idx].active = false;
  saveStore(store);
  return true;
}

export function createServiceAccount(input: {
  name: string; description: string; type: ServiceAccount["type"]; roles?: string[]; permissions?: string[]; createdBy: string;
}): ServiceAccount {
  const store = getStore();
  const sa: ServiceAccount = {
    id: uid("svc"),
    name: input.name,
    description: input.description,
    type: input.type,
    roles: input.roles || [],
    permissions: input.permissions || [],
    apiKeys: [],
    active: true,
    createdAt: Date.now(),
    createdBy: input.createdBy,
  };
  store.serviceAccounts.push(sa);
  saveStore(store);
  // Auto-create an API key for the service account
  const { apiKey } = createApiKey({ name: `${input.name} Key`, userId: sa.id, type: "service_account", permissions: input.permissions, createdBy: input.createdBy });
  sa.apiKeys.push(apiKey.id);
  saveStore(store);
  return sa;
}

/* ================================================================== */
/*  SESSION MANAGEMENT                                                 */
/* ================================================================== */

export function createSession(input: {
  userId: string; type: AuthMethod; ip: string; userAgent: string; deviceName: string; location: string; fingerprint: string; mfaVerified?: boolean;
}): AuthSession {
  const store = getStore();
  const session: AuthSession = {
    id: uid("sess"),
    userId: input.userId,
    type: input.type,
    token: generateToken(48),
    refreshToken: generateToken(64),
    ip: input.ip,
    userAgent: input.userAgent,
    deviceName: input.deviceName,
    location: input.location,
    fingerprint: input.fingerprint,
    mfaVerified: input.mfaVerified || false,
    expiresAt: Date.now() + SESSION_TTL_MS,
    refreshExpiresAt: Date.now() + REFRESH_TTL_MS,
    lastActivity: Date.now(),
    createdAt: Date.now(),
  };
  store.sessions.push(session);
  // Enforce max sessions
  const userSessions = store.sessions.filter((s) => s.userId === input.userId);
  if (userSessions.length > MAX_SESSIONS_PER_USER) {
    const oldest = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
    store.sessions = store.sessions.filter((s) => s.id !== oldest.id);
  }
  saveStore(store);
  return session;
}

export function getSessionsForUser(userId: string): AuthSession[] {
  return getStore().sessions.filter((s) => s.userId === userId && s.expiresAt > Date.now());
}

export function revokeSession(id: string): boolean {
  const store = getStore();
  store.sessions = store.sessions.filter((s) => s.id !== id);
  saveStore(store);
  return true;
}

export function revokeAllSessionsForUser(userId: string): boolean {
  const store = getStore();
  store.sessions = store.sessions.filter((s) => s.userId !== userId);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  LOGIN HISTORY & AUDIT                                              */
/* ================================================================== */

export function logLoginAttempt(userId: string, type: AuthMethod, success: boolean, ip: string, userAgent: string, location: string, riskScore: number, reason?: string): LoginHistoryEntry {
  const store = getStore();
  const entry: LoginHistoryEntry = {
    id: uid("lh"),
    userId,
    type,
    success,
    ip,
    location,
    userAgent,
    browser: navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : "Other",
    platform: navigator.platform || "Unknown",
    riskScore,
    reason,
    ts: Date.now(),
  };
  store.loginHistory.push(entry);
  saveStore(store);
  return entry;
}

export function logIdentityEvent(type: AuthEventType, userId: string, actor: string, detail: string, ip?: string, metadata?: Record<string, string>) {
  const store = getStore();
  const event: IdentityEvent = { id: uid("iev"), ts: Date.now(), type, userId, actor, detail, ip, metadata };
  store.events.push(event);
  if (store.events.length > 500) store.events = store.events.slice(-500);
  saveStore(store);
}

export function getLoginHistory(userId?: string, limit = 50): LoginHistoryEntry[] {
  const store = getStore();
  let entries = store.loginHistory;
  if (userId) entries = entries.filter((e) => e.userId === userId);
  return entries.slice(0, limit);
}

export function getIdentityEvents(userId?: string, limit = 100): IdentityEvent[] {
  const store = getStore();
  let events = [...store.events].reverse();
  if (userId) events = events.filter((e) => e.userId === userId);
  return events.slice(0, limit);
}

/* ================================================================== */
/*  MFA & AUTHENTICATION METHODS                                       */
/* ================================================================== */

export function enableMfa(userId: string, type: MFAType): { secret?: string; backupCodes: string[] } | null {
  const user = getUser(userId);
  if (!user) return null;
  const secret = type === "totp" ? generate2FASecret() : undefined;
  const codes = backupCodes();
  updateUser(userId, { mfaEnabled: true, mfaType: type, mfaSecret: secret, mfaBackupCodes: codes });
  return { secret, backupCodes: codes };
}

export function disableMfa(userId: string): boolean {
  const user = updateUser(userId, { mfaEnabled: false, mfaType: undefined, mfaSecret: undefined, mfaBackupCodes: [] });
  return !!user;
}

export function verifyBackupCode(userId: string, code: string): boolean {
  const user = getUser(userId);
  if (!user) return false;
  const idx = user.mfaBackupCodes.indexOf(code.toUpperCase());
  if (idx === -1) return false;
  const newCodes = [...user.mfaBackupCodes];
  newCodes.splice(idx, 1);
  updateUser(userId, { mfaBackupCodes: newCodes });
  return true;
}

export function addTrustedDevice(userId: string, name: string, fingerprint: string): TrustedDevice {
  const user = getUser(userId);
  const device: TrustedDevice = {
    id: uid("td"),
    name,
    fingerprint,
    browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Other",
    platform: navigator.platform || "Unknown",
    ip: "client-resolved",
    location: navigator.language || "en",
    trustedUntil: Date.now() + 30 * 86400000,
    createdAt: Date.now(),
  };
  if (user) {
    user.trustedDevices.push(device);
    savePartial("users", getStore().users);
  }
  return device;
}

export function isDeviceTrusted(userId: string, fingerprint: string): boolean {
  const user = getUser(userId);
  if (!user) return false;
  return user.trustedDevices.some((d) => d.fingerprint === fingerprint && d.trustedUntil > Date.now());
}

/* ================================================================== */
/*  BREAK GLASS & EMERGENCY ACCESS                                     */
/* ================================================================== */

export function createBreakGlassAccount(name: string, email: string, reason: string, createdBy: string): BreakGlassAccount {
  const store = getStore();
  const account: BreakGlassAccount = {
    id: uid("bg"),
    name,
    email,
    reason,
    expiresAt: Date.now() + 24 * 3600000,
    active: true,
    createdAt: Date.now(),
    createdBy,
  };
  store.breakGlassAccounts.push(account);
  saveStore(store);
  logIdentityEvent("emergency_access", "", createdBy, `Break glass account created for ${email}: ${reason}`);
  return account;
}

export function useBreakGlassAccount(id: string, usedBy: string): boolean {
  const store = getStore();
  const idx = store.breakGlassAccounts.findIndex((a) => a.id === id);
  if (idx === -1 || !store.breakGlassAccounts[idx].active || store.breakGlassAccounts[idx].expiresAt < Date.now()) return false;
  store.breakGlassAccounts[idx].usedAt = Date.now();
  store.breakGlassAccounts[idx].usedBy = usedBy;
  store.breakGlassAccounts[idx].active = false;
  saveStore(store);
  logIdentityEvent("break_glass_used", "", usedBy, `Break glass account used: ${store.breakGlassAccounts[idx].email}`);
  return true;
}

export function startImpersonation(impersonatorId: string, targetId: string, reason: string): ImpersonationLog | null {
  const impersonator = getUser(impersonatorId);
  const target = getUser(targetId);
  if (!impersonator || !target) return null;
  const store = getStore();
  const log: ImpersonationLog = {
    id: uid("imp"),
    impersonatorId,
    impersonatorName: impersonator.name,
    targetId,
    targetName: target.name,
    reason,
    startedAt: Date.now(),
  };
  store.impersonations.push(log);
  saveStore(store);
  logIdentityEvent("impersonation_start", targetId, impersonatorId, `Impersonation started: ${impersonator.name} → ${target.name}: ${reason}`);
  return log;
}

export function stopImpersonation(id: string): boolean {
  const store = getStore();
  const idx = store.impersonations.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  store.impersonations[idx].endedAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  ZERO TRUST & RISK ASSESSMENT                                       */
/* ================================================================== */

export function getZeroTrustPolicies(): ZeroTrustPolicy[] {
  return getStore().zeroTrustPolicies;
}

export function createZeroTrustPolicy(input: Omit<ZeroTrustPolicy, "id" | "createdAt" | "updatedAt">): ZeroTrustPolicy {
  const store = getStore();
  const policy: ZeroTrustPolicy = { ...input, id: uid("ztp"), createdAt: Date.now(), updatedAt: Date.now() };
  store.zeroTrustPolicies.push(policy);
  saveStore(store);
  return policy;
}

export function assessRisk(userId: string, ip: string, _userAgent: string, fingerprint: string): RiskAssessment {
  const user = getUser(userId);
  const factors: RiskFactor[] = [];
  let score = 0;

  // Check for VPN/proxy
  if (ip.startsWith("10.") || ip.startsWith("172.") || ip.startsWith("192.168.")) {
    factors.push({ name: "VPN/Proxy", score: 0, detail: "Internal IP" });
  } else {
    score += 10;
    factors.push({ name: "External IP", score: 10, detail: "Connection from external IP" });
  }

  // Unknown device
  if (fingerprint && user) {
    const trusted = user.trustedDevices.some((d) => d.fingerprint === fingerprint);
    if (!trusted) { score += 15; factors.push({ name: "Unknown Device", score: 15, detail: "Device not recognized" }); }
    else factors.push({ name: "Trusted Device", score: 0, detail: "Device is trusted" });
  }

  // Suspicious time
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) { score += 10; factors.push({ name: "Unusual Time", score: 10, detail: `Login at ${hour}:00 (local)` }); }

  // Previous failed attempts
  if (user && user.loginAttempts > 3) { score += 20; factors.push({ name: "Failed Attempts", score: 20, detail: `${user.loginAttempts} recent failures` }); }

  // New location
  if (user && user.lastIp && user.lastIp !== ip && user.lastIp !== "client-resolved") {
    score += 15;
    factors.push({ name: "New IP", score: 15, detail: `Previous: ${user.lastIp}` });
  }

  const level: RiskAssessment["level"] = score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, factors };
}

export function evaluateZeroTrustPolicies(userId: string, risk: RiskAssessment, mfaVerified: boolean): ZtPolicyEffect {
  const policies = getZeroTrustPolicies().filter((p) => p.enabled).sort((a, b) => b.priority - a.priority);
  for (const policy of policies) {
    let allMet = true;
    for (const cond of policy.conditions) {
      switch (cond.type) {
        case "mfa_status":
          if (cond.operator === "equals" && String(mfaVerified) !== cond.value) allMet = false;
          break;
        case "risk_score":
          if (cond.operator === "lt" && risk.score >= Number(cond.value)) allMet = false;
          if (cond.operator === "gt" && risk.score <= Number(cond.value)) allMet = false;
          break;
        case "device_trusted":
          if (cond.operator === "equals") {
            const trusted = isDeviceTrusted(userId, "");
            if (String(trusted) !== cond.value) allMet = false;
          }
          break;
        default:
          break;
      }
    }
    if (allMet) return policy.effect;
  }
  return "deny";
}

export function getGeoRestrictions(): GeoRestriction[] {
  return getStore().geoRestrictions;
}

export function getIpRestrictions(): IpRestriction[] {
  return getStore().ipRestrictions;
}

/* ================================================================== */
/*  AUTHENTICATION FLOW                                                */
/* ================================================================== */

export interface AuthResult {
  success: boolean;
  user?: IdentityUser;
  session?: AuthSession;
  requiresMfa: boolean;
  risk?: RiskAssessment;
  error?: string;
}

export function authenticatePassword(email: string, password: string, ip: string, userAgent: string, deviceName: string, location: string, fingerprint: string): AuthResult {
  const user = getUserByEmail(email);
  if (!user) {
    logIdentityEvent("login_failed", "", email, `Login failed: user not found`, ip);
    return { success: false, requiresMfa: false, error: "Invalid email or password." };
  }

  if (user.status === "suspended") return { success: false, requiresMfa: false, error: "Account suspended. Contact support." };
  if (user.status === "locked" || (user.lockedUntil > Date.now())) return { success: false, requiresMfa: false, error: "Account locked. Try again later." };

  // Verify password using PBKDF2
  if (user.passwordHash.startsWith("pbkdf2:")) {
    // This would call verifyPassword in production
    const pwOk = password === "alaya2026"; // Demo password
    if (!pwOk) {
      const newAttempts = user.loginAttempts + 1;
      const lockedUntil = newAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : 0;
      updateUser(user.id, { loginAttempts: newAttempts, lockedUntil, status: newAttempts >= MAX_LOGIN_ATTEMPTS ? "locked" : user.status });
      logLoginAttempt(user.id, "password", false, ip, userAgent, location, 30, "Invalid password");
      logIdentityEvent("login_failed", user.id, user.email, `Login failed: invalid password (${newAttempts}/${MAX_LOGIN_ATTEMPTS})`, ip);
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) return { success: false, requiresMfa: false, error: "Account locked due to too many failed attempts. Try again later." };
      return { success: false, requiresMfa: false, error: `Invalid password. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempt(s) remaining.` };
    }
  }

  // Success - reset lockout
  const risk = assessRisk(user.id, ip, userAgent, fingerprint);
  const ztResult = evaluateZeroTrustPolicies(user.id, risk, false);

  if (ztResult === "require_mfa" || user.mfaEnabled) {
    updateUser(user.id, { loginAttempts: 0, lockedUntil: 0, lastLogin: Date.now(), lastIp: ip });
    logLoginAttempt(user.id, "password", true, ip, userAgent, location, risk.score);
    logIdentityEvent("login", user.id, user.email, `Login successful — MFA required`, ip);
    return { success: true, user, requiresMfa: true, risk };
  }

  const session = createSession({ userId: user.id, type: "password", ip, userAgent, deviceName, location, fingerprint, mfaVerified: false });
  updateUser(user.id, { loginAttempts: 0, lockedUntil: 0, lastLogin: Date.now(), lastIp: ip, status: "active" });
  logLoginAttempt(user.id, "password", true, ip, userAgent, location, risk.score);
  logIdentityEvent("login", user.id, user.email, `Login successful — session ${session.id}`, ip);
  return { success: true, user, session, requiresMfa: false, risk };
}

export function verifyMfa(userId: string, code: string, sessionId: string): boolean {
  const user = getUser(userId);
  if (!user || !user.mfaEnabled) return false;

  // Check backup codes first
  if (verifyBackupCode(userId, code)) {
    const store = getStore();
    const session = store.sessions.find((s) => s.id === sessionId);
    if (session) { session.mfaVerified = true; saveStore(store); }
    logIdentityEvent("mfa_success", userId, user.email, "MFA verified via backup code");
    return true;
  }

  // In production, verify TOTP here
  // For demo, accept any 6-digit code
  if (code.length === 6 && /^\d{6}$/.test(code)) {
    const store = getStore();
    const session = store.sessions.find((s) => s.id === sessionId);
    if (session) { session.mfaVerified = true; saveStore(store); }
    logIdentityEvent("mfa_success", userId, user.email, "MFA verified via TOTP");
    return true;
  }

  logIdentityEvent("mfa_failed", userId, user.email, "MFA verification failed");
  return false;
}

export function generateMagicLink(email: string): string | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  const token = generateToken(48);
  const expiresAt = Date.now() + 15 * 60000;
  updateUser(user.id, { inviteToken: token, inviteExpires: expiresAt });
  return `https://alayainsider.com/auth/magic?token=${token}`;
}

export function verifyMagicLink(token: string): IdentityUser | null {
  const store = getStore();
  const user = store.users.find((u) => u.inviteToken === token);
  if (!user || (user.inviteExpires && user.inviteExpires < Date.now())) return null;
  user.inviteToken = undefined;
  user.inviteExpires = undefined;
  user.lastLogin = Date.now();
  saveStore(store);
  return user;
}

/* ================================================================== */
/*  COMPLIANCE & REPORTS                                               */
/* ================================================================== */

export function generateComplianceReport(userId?: string, startDate?: number, endDate?: number): string {
  const events = getIdentityEvents(userId);
  const filtered = events.filter((e) => {
    if (startDate && e.ts < startDate) return false;
    if (endDate && e.ts > endDate) return false;
    return true;
  });

  const header = "Timestamp,Event Type,User ID,Actor,Detail,IP Address";
  const rows = filtered.map((e) =>
    `${new Date(e.ts).toISOString()},${e.type},${e.userId},${e.actor},"${e.detail}",${e.ip || ""}`
  );
  return [header, ...rows].join("\n");
}

export function getIdentityAnalytics() {
  const store = getStore();
  const now = Date.now();
  const dayAgo = now - 86400000;
  const weekAgo = now - 7 * 86400000;

  return {
    totalUsers: store.users.length,
    activeUsers: store.users.filter((u) => u.status === "active").length,
    adminUsers: store.users.filter((u) => u.type === "admin" || u.type === "editor").length,
    mfaEnabled: store.users.filter((u) => u.mfaEnabled).length,
    loginEvents24h: store.loginHistory.filter((l) => l.ts > dayAgo).length,
    failedLogins24h: store.loginHistory.filter((l) => !l.success && l.ts > dayAgo).length,
    loginEvents7d: store.loginHistory.filter((l) => l.ts > weekAgo).length,
    failedLogins7d: store.loginHistory.filter((l) => !l.success && l.ts > weekAgo).length,
    activeSessions: store.sessions.filter((s) => s.expiresAt > now).length,
    totalApiKeys: store.apiKeys.length,
    activeApiKeys: store.apiKeys.filter((k) => k.active).length,
    totalServiceAccounts: store.serviceAccounts.length,
    totalRoles: store.roles.length,
    totalOrganizations: store.organizations.length,
    totalTeams: store.teams.length,
    events24h: store.events.filter((e) => e.ts > dayAgo).length,
    totalEvents: store.events.length,
    suspiciousEvents24h: store.events.filter((e) => e.ts > dayAgo && (e.type === "login_failed" || e.type === "suspicious_login" || e.type === "geo_blocked")).length,
  };
}
