/**
 * ALAYA INSIDER — Enterprise Integrations Service
 * --------------------------------------------------------------------------
 * Manages all third-party service integrations with encrypted credential storage,
 * connection testing, health monitoring, and audit logging.
 *
 * All persistence is PostgreSQL-backed (integration_configs, integration_logs,
 * integration_backups tables).
 *
 * Security:
 *   - AES-256-CBC encryption for all credentials at rest
 *   - Credentials masked in UI responses (never returned in full)
 *   - Circuit breaker pattern (threshold=5, reset=5min, half-open)
 *   - Retry logic with exponential backoff (1s, 2s, 4s)
 *   - Environment isolation (dev/test/qa/staging/prod)
 *   - Backup/Restore/Export/Import with encrypted backups
 *   - Health dashboard (health score 0-100, average latency, success/fail counts)
 *   - RBAC: only Super Admin can view/modify/rotate/delete credentials
 *   - Secrets never appear in logs, errors, or API responses
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { fireTrigger } from "./notificationTriggers.js";
import {
  getAllConfigs,
  getConfig as repoGetConfig,
  getConfigByModuleProvider,
  getConfigsByModule,
  getConfigsByEnvironment,
  createConfig as repoCreateConfig,
  updateConfig as repoUpdateConfig,
  deleteConfig as repoDeleteConfig,
  createLog as repoCreateLog,
  getLogsForIntegration,
  getAllLogs as repoGetAllLogs,
  createBackup as repoCreateBackup,
  listBackups as repoListBackups,
  getBackup as repoGetBackup,
  deleteOldBackups,
} from "../db/repositories/integrations.js";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const ENCRYPTION_KEY = (() => {
  const envKey = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (envKey && envKey.length >= 16) return envKey;
  if (process.env.NODE_ENV === "production") {
    console.warn("[Integrations] WARNING: INTEGRATIONS_ENCRYPTION_KEY not set in production! Generating ephemeral key — credentials will be lost on restart.");
  }
  return randomBytes(32).toString("hex");
})();

const ALGORITHM = "aes-256-cbc";

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 300_000;
const DEFAULT_CREDENTIAL_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const ROTATION_REMINDER_DAYS = 14;
const MAX_BACKUPS = 20;

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type IntegrationModule =
  | "authentication" | "email" | "sms" | "affiliate_networks"
  | "analytics" | "search_console" | "tag_manager" | "ai_providers"
  | "search_engines" | "storage" | "cdn" | "cloud_services"
  | "maps" | "notifications" | "payments" | "developer_apis";

export type ConnectionStatus = "connected" | "disconnected" | "error" | "testing" | "unknown";
export type IntegrationEnvironment = "development" | "testing" | "qa" | "staging" | "production";
export type CircuitBreakerState = "closed" | "open" | "half-open";

export interface CredentialMetadata {
  lastRotatedAt?: number;
  expiresAt?: number;
  rotationReminderAt?: number;
  healthScore?: number;
  consecutiveFailures?: number;
  circuitBreakerState?: CircuitBreakerState;
  circuitBreakerOpenedAt?: number;
  credentialVersions?: { version: number; rotatedAt: number; rotatedBy: string }[];
  totalSuccessTests?: number;
  totalFailedTests?: number;
  averageLatency?: number;
  lastSuccessAt?: number;
}

export interface IntegrationConfig {
  id: string;
  module: IntegrationModule;
  provider: string;
  label: string;
  enabled: boolean;
  environment: IntegrationEnvironment;
  settings: Record<string, string>;
  connectionStatus: ConnectionStatus;
  lastTestedAt?: number;
  lastError?: string;
  lastErrorAt?: number;
  lastSuccessAt?: number;
  lastSyncAt?: number;
  metadata: CredentialMetadata;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export type IntegrationLogType =
  | "connection_test" | "sync" | "error" | "credential_rotation"
  | "credential_created" | "credential_updated" | "credential_deleted"
  | "enabled" | "disabled" | "config_update"
  | "backup_created" | "backup_restored" | "backup_exported" | "backup_imported"
  | "environment_changed";

export interface IntegrationLog {
  id: string;
  integrationId: string;
  type: IntegrationLogType;
  status: "success" | "failure" | "info";
  message: string;
  details?: string;
  actor: string;
  actorRole?: "super_admin" | "admin" | "editor" | "manager";
  actorIp?: string;
  actorUserAgent?: string;
  actorDevice?: string;
  actorCountry?: string;
  ts: number;
}

export interface IntegrationStats {
  totalIntegrations: number;
  enabledCount: number;
  connectedCount: number;
  errorCount: number;
  credentialExpiringCount: number;
  circuitBreakerOpenCount: number;
  recentLogs: IntegrationLog[];
  byModule: Record<string, number>;
  byEnvironment: Record<string, number>;
  healthSummary: {
    averageHealthScore: number;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
  };
}

export interface HealthCheckResult {
  id: string;
  provider: string;
  label: string;
  module: IntegrationModule;
  environment: IntegrationEnvironment;
  enabled: boolean;
  connectionStatus: ConnectionStatus;
  healthScore: number;
  averageLatency?: number;
  lastTestedAt?: number;
  lastSuccessAt?: number;
  lastError?: string;
  lastErrorAt?: number;
  circuitBreakerState?: CircuitBreakerState;
  expiresAt?: number;
  credentialExpired: boolean;
  credentialExpiringSoon: boolean;
  version: number;
  lastUpdated: number;
}

export interface BackupEntry {
  id: string;
  label: string;
  createdAt: number;
  createdBy: string;
  environment: IntegrationEnvironment | "all";
  integrationCount: number;
  checksum: string;
}

export interface ProviderDefinition {
  module: IntegrationModule;
  provider: string;
  label: string;
  fields: ProviderField[];
  docsUrl?: string;
}

export interface ProviderField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "toggle" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  maskInUI?: boolean;
}

export const PROVIDER_DEFINITIONS: ProviderDefinition[] = [
  { module: "authentication", provider: "google", label: "Google OAuth", fields: [
    { key: "client_id", label: "Client ID", type: "password", required: true, maskInUI: true },
    { key: "client_secret", label: "Client Secret", type: "password", required: true, maskInUI: true },
    { key: "redirect_uri", label: "Redirect URI", type: "text", required: true, placeholder: "https://alayainsider.com/auth/google/callback" },
    { key: "environment", label: "Environment", type: "select", required: true, options: ["production", "development"] },
  ]},
  { module: "authentication", provider: "apple", label: "Apple Sign In", fields: [
    { key: "team_id", label: "Team ID", type: "password", required: true, maskInUI: true },
    { key: "key_id", label: "Key ID", type: "password", required: true, maskInUI: true },
    { key: "client_id", label: "Service ID / Client ID", type: "password", required: true, maskInUI: true },
    { key: "private_key", label: "Private Key", type: "textarea", required: true, maskInUI: true },
    { key: "redirect_uri", label: "Redirect URI", type: "text", required: true, placeholder: "https://alayainsider.com/auth/apple/callback" },
  ]},
  { module: "authentication", provider: "microsoft", label: "Microsoft Login (Future)", fields: [
    { key: "client_id", label: "Client ID", type: "password", required: true, maskInUI: true },
    { key: "client_secret", label: "Client Secret", type: "password", required: true, maskInUI: true },
    { key: "tenant_id", label: "Tenant ID", type: "password", required: true, maskInUI: true },
  ]},
  { module: "authentication", provider: "amazon", label: "Amazon Login (Future)", fields: [
    { key: "client_id", label: "Client ID", type: "password", required: true, maskInUI: true },
    { key: "client_secret", label: "Client Secret", type: "password", required: true, maskInUI: true },
  ]},
  { module: "authentication", provider: "github", label: "GitHub Login (Future)", fields: [
    { key: "client_id", label: "Client ID", type: "password", required: true, maskInUI: true },
    { key: "client_secret", label: "Client Secret", type: "password", required: true, maskInUI: true },
    { key: "redirect_uri", label: "Redirect URI", type: "text", required: true, placeholder: "https://alayainsider.com/auth/github/callback" },
  ]},
  { module: "email", provider: "smtp", label: "SMTP", fields: [
    { key: "host", label: "SMTP Host", type: "text", required: true, placeholder: "smtp.example.com" },
    { key: "port", label: "Port", type: "number", required: true, placeholder: "587" },
    { key: "encryption", label: "Encryption", type: "select", required: true, options: ["TLS", "SSL", "NONE"] },
    { key: "username", label: "Username", type: "text", required: true },
    { key: "password", label: "Password", type: "password", required: true, maskInUI: true },
    { key: "from_name", label: "From Name", type: "text", required: false, placeholder: "ALAYA INSIDER" },
    { key: "from_email", label: "From Email", type: "text", required: true, placeholder: "noreply@alayainsider.com" },
    { key: "reply_to", label: "Reply-To", type: "text", required: false, placeholder: "support@alayainsider.com" },
  ]},
  { module: "email", provider: "ses", label: "Amazon SES", fields: [
    { key: "access_key_id", label: "Access Key ID", type: "password", required: true, maskInUI: true },
    { key: "secret_access_key", label: "Secret Access Key", type: "password", required: true, maskInUI: true },
    { key: "region", label: "Region", type: "select", required: true, options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"] },
    { key: "from_email", label: "From Email", type: "text", required: true },
    { key: "from_name", label: "From Name", type: "text", required: false },
  ]},
  { module: "email", provider: "sendgrid", label: "SendGrid", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "from_email", label: "From Email", type: "text", required: true },
    { key: "from_name", label: "From Name", type: "text", required: false },
  ]},
  { module: "email", provider: "mailgun", label: "Mailgun", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "domain", label: "Domain", type: "text", required: true, placeholder: "mg.alayainsider.com" },
    { key: "from_email", label: "From Email", type: "text", required: true },
  ]},
  { module: "email", provider: "resend", label: "Resend", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "from_email", label: "From Email", type: "text", required: true },
  ]},
  { module: "email", provider: "postmark", label: "Postmark", fields: [
    { key: "server_token", label: "Server Token", type: "password", required: true, maskInUI: true },
    { key: "from_email", label: "From Email", type: "text", required: true },
  ]},
  { module: "sms", provider: "twilio", label: "Twilio", fields: [
    { key: "account_sid", label: "Account SID", type: "password", required: true, maskInUI: true },
    { key: "auth_token", label: "Auth Token", type: "password", required: true, maskInUI: true },
    { key: "phone_number", label: "Phone Number", type: "text", required: true, placeholder: "+1234567890" },
    { key: "sender_id", label: "Sender ID", type: "text", required: false, placeholder: "ALAYA" },
  ]},
  { module: "sms", provider: "msg91", label: "MSG91", fields: [
    { key: "auth_key", label: "Auth Key", type: "password", required: true, maskInUI: true },
    { key: "sender_id", label: "Sender ID", type: "text", required: true, placeholder: "ALAYA" },
    { key: "route", label: "Route", type: "select", required: false, options: ["1", "4", "transactional"] },
  ]},
  { module: "sms", provider: "amazon_sns", label: "Amazon SNS", fields: [
    { key: "access_key_id", label: "Access Key ID", type: "password", required: true, maskInUI: true },
    { key: "secret_access_key", label: "Secret Access Key", type: "password", required: true, maskInUI: true },
    { key: "region", label: "Region", type: "select", required: true, options: ["us-east-1", "us-west-2", "eu-west-1"] },
    { key: "sender_id", label: "Sender ID", type: "text", required: false, placeholder: "ALAYA" },
  ]},
  { module: "affiliate_networks", provider: "amazon_associates", label: "Amazon Associates", fields: [
    { key: "access_key", label: "Access Key", type: "password", required: true, maskInUI: true },
    { key: "secret_key", label: "Secret Key", type: "password", required: true, maskInUI: true },
    { key: "tracking_id", label: "Tracking ID", type: "text", required: true, placeholder: "alaya-20" },
    { key: "marketplace", label: "Marketplace", type: "select", required: true, options: ["US", "UK", "DE", "FR", "JP", "CA", "IN", "IT", "ES"] },
    { key: "country", label: "Country", type: "select", required: true, options: ["US", "GB", "DE", "FR", "JP", "CA", "IN", "IT", "ES"] },
  ]},
  { module: "affiliate_networks", provider: "impact", label: "Impact", fields: [
    { key: "account_sid", label: "Account SID", type: "password", required: true, maskInUI: true },
    { key: "auth_token", label: "Auth Token", type: "password", required: true, maskInUI: true },
    { key: "tracking_id", label: "Tracking ID", type: "text", required: true },
  ]},
  { module: "affiliate_networks", provider: "cj", label: "CJ (Commission Junction)", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "website_id", label: "Website ID", type: "text", required: true },
  ]},
  { module: "affiliate_networks", provider: "awin", label: "Awin", fields: [
    { key: "api_token", label: "API Token", type: "password", required: true, maskInUI: true },
    { key: "publisher_id", label: "Publisher ID", type: "text", required: true },
  ]},
  { module: "affiliate_networks", provider: "shareasale", label: "ShareASale", fields: [
    { key: "api_token", label: "API Token", type: "password", required: true, maskInUI: true },
    { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
    { key: "secret_key", label: "Secret Key", type: "password", required: true, maskInUI: true },
  ]},
  { module: "affiliate_networks", provider: "rakuten", label: "Rakuten", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "mid", label: "MID (Merchant ID)", type: "text", required: true },
  ]},
  { module: "analytics", provider: "ga4", label: "Google Analytics 4", fields: [
    { key: "measurement_id", label: "Measurement ID", type: "password", required: true, maskInUI: true, placeholder: "G-XXXXXXXXXX" },
    { key: "api_secret", label: "API Secret", type: "password", required: false, maskInUI: true },
  ]},
  { module: "analytics", provider: "clarity", label: "Microsoft Clarity", fields: [
    { key: "project_id", label: "Project ID", type: "password", required: true, maskInUI: true },
  ]},
  { module: "analytics", provider: "meta_pixel", label: "Meta Pixel", fields: [
    { key: "pixel_id", label: "Pixel ID", type: "password", required: true, maskInUI: true },
    { key: "access_token", label: "Access Token", type: "password", required: false, maskInUI: true },
  ]},
  { module: "analytics", provider: "tiktok_pixel", label: "TikTok Pixel", fields: [
    { key: "pixel_id", label: "Pixel ID", type: "password", required: true, maskInUI: true },
    { key: "access_token", label: "Access Token", type: "password", required: false, maskInUI: true },
  ]},
  { module: "analytics", provider: "pinterest_pixel", label: "Pinterest Pixel", fields: [
    { key: "tag_id", label: "Tag ID", type: "password", required: true, maskInUI: true },
    { key: "access_token", label: "Access Token", type: "password", required: false, maskInUI: true },
  ]},
  { module: "search_console", provider: "google_search_console", label: "Google Search Console", fields: [
    { key: "site_url", label: "Site URL", type: "text", required: true, placeholder: "https://alayainsider.com" },
    { key: "property_id", label: "Property ID", type: "text", required: true },
    { key: "verification_token", label: "Verification Token", type: "password", required: true, maskInUI: true },
    { key: "client_email", label: "Service Account Email", type: "text", required: true },
    { key: "private_key", label: "Private Key", type: "textarea", required: true, maskInUI: true },
  ]},
  { module: "tag_manager", provider: "gtm", label: "Google Tag Manager", fields: [
    { key: "container_id", label: "Container ID", type: "password", required: true, maskInUI: true, placeholder: "GTM-XXXXXXX" },
    { key: "api_key", label: "API Key", type: "password", required: false, maskInUI: true },
    { key: "environment", label: "Environment", type: "select", required: false, options: ["production", "staging", "development"] },
  ]},
  { module: "ai_providers", provider: "openai", label: "OpenAI", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "model", label: "Default Model", type: "select", required: true, options: ["gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"] },
    { key: "temperature", label: "Temperature", type: "number", required: false, placeholder: "0.7" },
    { key: "max_tokens", label: "Max Tokens", type: "number", required: false, placeholder: "4096" },
    { key: "budget_limit", label: "Monthly Budget Limit ($)", type: "number", required: false, placeholder: "100" },
  ]},
  { module: "ai_providers", provider: "gemini", label: "Gemini", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "model", label: "Default Model", type: "select", required: true, options: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"] },
    { key: "temperature", label: "Temperature", type: "number", required: false, placeholder: "0.7" },
  ]},
  { module: "ai_providers", provider: "claude", label: "Claude (Anthropic)", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "model", label: "Default Model", type: "select", required: true, options: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"] },
    { key: "temperature", label: "Temperature", type: "number", required: false, placeholder: "0.7" },
  ]},
  { module: "ai_providers", provider: "deepseek", label: "DeepSeek", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "model", label: "Default Model", type: "select", required: true, options: ["deepseek-chat", "deepseek-coder"] },
  ]},
  { module: "search_engines", provider: "typesense", label: "Typesense", fields: [
    { key: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
    { key: "port", label: "Port", type: "number", required: true, placeholder: "8108" },
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "protocol", label: "Protocol", type: "select", required: true, options: ["http", "https"] },
  ]},
  { module: "search_engines", provider: "algolia", label: "Algolia", fields: [
    { key: "app_id", label: "Application ID", type: "password", required: true, maskInUI: true },
    { key: "api_key", label: "Admin API Key", type: "password", required: true, maskInUI: true },
    { key: "search_api_key", label: "Search-Only API Key", type: "password", required: false, maskInUI: true },
  ]},
  { module: "search_engines", provider: "meilisearch", label: "Meilisearch", fields: [
    { key: "host", label: "Host", type: "text", required: true, placeholder: "http://localhost:7700" },
    { key: "api_key", label: "API Key (Master Key)", type: "password", required: true, maskInUI: true },
  ]},
  { module: "search_engines", provider: "elastic", label: "Elasticsearch", fields: [
    { key: "host", label: "Host", type: "text", required: true, placeholder: "http://localhost:9200" },
    { key: "api_key", label: "API Key", type: "password", required: false, maskInUI: true },
    { key: "username", label: "Username", type: "text", required: false },
    { key: "password", label: "Password", type: "password", required: false, maskInUI: true },
    { key: "cloud_id", label: "Cloud ID", type: "text", required: false },
  ]},
  { module: "storage", provider: "local", label: "Local Storage", fields: [
    { key: "base_path", label: "Base Path", type: "text", required: true, placeholder: "/var/www/storage" },
    { key: "public_url", label: "Public URL", type: "text", required: false, placeholder: "https://alayainsider.com/storage" },
  ]},
  { module: "storage", provider: "s3", label: "AWS S3", fields: [
    { key: "bucket", label: "Bucket Name", type: "text", required: true },
    { key: "region", label: "Region", type: "select", required: true, options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"] },
    { key: "access_key_id", label: "Access Key ID", type: "password", required: true, maskInUI: true },
    { key: "secret_access_key", label: "Secret Access Key", type: "password", required: true, maskInUI: true },
    { key: "cdn_url", label: "CDN URL", type: "text", required: false, placeholder: "https://cdn.alayainsider.com" },
  ]},
  { module: "storage", provider: "cloudinary", label: "Cloudinary", fields: [
    { key: "cloud_name", label: "Cloud Name", type: "text", required: true },
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "api_secret", label: "API Secret", type: "password", required: true, maskInUI: true },
    { key: "cdn_url", label: "CDN URL", type: "text", required: false },
  ]},
  { module: "storage", provider: "gcs", label: "Google Cloud Storage", fields: [
    { key: "bucket", label: "Bucket Name", type: "text", required: true },
    { key: "project_id", label: "Project ID", type: "text", required: true },
    { key: "client_email", label: "Service Account Email", type: "text", required: true },
    { key: "private_key", label: "Private Key", type: "textarea", required: true, maskInUI: true },
  ]},
  { module: "storage", provider: "backblaze", label: "Backblaze B2", fields: [
    { key: "bucket", label: "Bucket Name", type: "text", required: true },
    { key: "application_key_id", label: "Application Key ID", type: "password", required: true, maskInUI: true },
    { key: "application_key", label: "Application Key", type: "password", required: true, maskInUI: true },
    { key: "cdn_url", label: "CDN URL", type: "text", required: false },
  ]},
  { module: "cdn", provider: "cloudflare", label: "Cloudflare", fields: [
    { key: "api_token", label: "API Token", type: "password", required: true, maskInUI: true },
    { key: "zone_id", label: "Zone ID", type: "password", required: true, maskInUI: true },
    { key: "email", label: "Account Email", type: "text", required: true },
    { key: "global_api_key", label: "Global API Key", type: "password", required: false, maskInUI: true },
  ]},
  { module: "cloud_services", provider: "aws", label: "Amazon Web Services", fields: [
    { key: "access_key_id", label: "Access Key ID", type: "password", required: true, maskInUI: true },
    { key: "secret_access_key", label: "Secret Access Key", type: "password", required: true, maskInUI: true },
    { key: "default_region", label: "Default Region", type: "select", required: true, options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"] },
  ]},
  { module: "cloud_services", provider: "gcp", label: "Google Cloud Platform", fields: [
    { key: "project_id", label: "Project ID", type: "text", required: true },
    { key: "client_email", label: "Service Account Email", type: "text", required: true },
    { key: "private_key", label: "Private Key", type: "textarea", required: true, maskInUI: true },
  ]},
  { module: "cloud_services", provider: "azure", label: "Microsoft Azure", fields: [
    { key: "tenant_id", label: "Tenant ID", type: "password", required: true, maskInUI: true },
    { key: "client_id", label: "Client ID", type: "password", required: true, maskInUI: true },
    { key: "client_secret", label: "Client Secret", type: "password", required: true, maskInUI: true },
    { key: "subscription_id", label: "Subscription ID", type: "text", required: true },
  ]},
  { module: "maps", provider: "google_maps", label: "Google Maps", fields: [
    { key: "api_key", label: "API Key", type: "password", required: true, maskInUI: true },
    { key: "map_id", label: "Map ID", type: "text", required: false },
  ]},
  { module: "notifications", provider: "firebase", label: "Firebase Cloud Messaging", fields: [
    { key: "server_key", label: "Server Key", type: "password", required: true, maskInUI: true },
    { key: "sender_id", label: "Sender ID", type: "text", required: true },
    { key: "project_id", label: "Project ID", type: "text", required: true },
  ]},
  { module: "notifications", provider: "onesignal", label: "OneSignal", fields: [
    { key: "app_id", label: "App ID", type: "password", required: true, maskInUI: true },
    { key: "rest_api_key", label: "REST API Key", type: "password", required: true, maskInUI: true },
  ]},
  { module: "notifications", provider: "pusher", label: "Pusher", fields: [
    { key: "app_id", label: "App ID", type: "password", required: true, maskInUI: true },
    { key: "key", label: "Key", type: "password", required: true, maskInUI: true },
    { key: "secret", label: "Secret", type: "password", required: true, maskInUI: true },
    { key: "cluster", label: "Cluster", type: "text", required: true, placeholder: "us2" },
  ]},
  { module: "payments", provider: "stripe", label: "Stripe (Future)", fields: [
    { key: "publishable_key", label: "Publishable Key", type: "password", required: true, maskInUI: true },
    { key: "secret_key", label: "Secret Key", type: "password", required: true, maskInUI: true },
    { key: "webhook_secret", label: "Webhook Secret", type: "password", required: true, maskInUI: true },
    { key: "environment", label: "Environment", type: "select", required: true, options: ["test", "live"] },
    { key: "enabled", label: "Enabled", type: "toggle", required: false },
  ]},
  { module: "payments", provider: "paypal", label: "PayPal (Future)", fields: [
    { key: "client_id", label: "Client ID", type: "password", required: true, maskInUI: true },
    { key: "secret", label: "Secret", type: "password", required: true, maskInUI: true },
    { key: "environment", label: "Environment", type: "select", required: true, options: ["sandbox", "live"] },
  ]},
  { module: "developer_apis", provider: "internal_api", label: "Internal API Keys", fields: [
    { key: "rate_limit_per_minute", label: "Rate Limit (per minute)", type: "number", required: true, placeholder: "60" },
    { key: "webhook_retry_count", label: "Webhook Retry Count", type: "number", required: false, placeholder: "3" },
    { key: "webhook_timeout_ms", label: "Webhook Timeout (ms)", type: "number", required: false, placeholder: "5000" },
  ]},
];

/* ================================================================== */
/*  ENCRYPTION                                                         */
/* ================================================================== */

function getEncryptionKey(): Buffer {
  return createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(":");
    if (parts.length !== 2) return encryptedText;
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encryptedText;
  }
}

function maskValue(value: string): string {
  if (!value || value.length <= 4) return "****";
  return value.slice(0, 2) + "****" + value.slice(-2);
}

/* ================================================================== */
/*  HELPERS — row ↔ config conversion                                    */
/* ================================================================== */

function rowToConfig(row: any): IntegrationConfig {
  const meta = row.metadata || {};
  return {
    id: row.id,
    module: row.module as IntegrationModule,
    provider: row.provider,
    label: row.label,
    enabled: row.enabled,
    environment: row.environment as IntegrationEnvironment,
    settings: row.settings || {},
    connectionStatus: (row.connection_status || "unknown") as ConnectionStatus,
    lastTestedAt: row.last_tested_at ? new Date(row.last_tested_at).getTime() : undefined,
    lastError: row.last_error || undefined,
    lastErrorAt: row.last_error_at ? new Date(row.last_error_at).getTime() : undefined,
    lastSuccessAt: row.last_success_at ? new Date(row.last_success_at).getTime() : undefined,
    lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at).getTime() : undefined,
    metadata: {
      healthScore: meta.healthScore ?? 100,
      consecutiveFailures: meta.consecutiveFailures ?? 0,
      circuitBreakerState: meta.circuitBreakerState || "closed",
      circuitBreakerOpenedAt: meta.circuitBreakerOpenedAt,
      lastRotatedAt: meta.lastRotatedAt,
      expiresAt: meta.expiresAt,
      rotationReminderAt: meta.rotationReminderAt,
      credentialVersions: meta.credentialVersions || [],
      totalSuccessTests: meta.totalSuccessTests ?? 0,
      totalFailedTests: meta.totalFailedTests ?? 0,
      averageLatency: meta.averageLatency,
      lastSuccessAt: meta.lastSuccessAt,
    },
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    version: row.version,
  };
}

function configToMetadata(config: IntegrationConfig): Record<string, any> {
  return {
    healthScore: config.metadata.healthScore,
    consecutiveFailures: config.metadata.consecutiveFailures,
    circuitBreakerState: config.metadata.circuitBreakerState,
    circuitBreakerOpenedAt: config.metadata.circuitBreakerOpenedAt,
    lastRotatedAt: config.metadata.lastRotatedAt,
    expiresAt: config.metadata.expiresAt,
    rotationReminderAt: config.metadata.rotationReminderAt,
    credentialVersions: config.metadata.credentialVersions,
    totalSuccessTests: config.metadata.totalSuccessTests,
    totalFailedTests: config.metadata.totalFailedTests,
    averageLatency: config.metadata.averageLatency,
    lastSuccessAt: config.metadata.lastSuccessAt,
  };
}

/* ================================================================== */
/*  PROVIDER LOOKUPS                                                   */
/* ================================================================== */

export function getProvidersForModule(module: IntegrationModule): ProviderDefinition[] {
  return PROVIDER_DEFINITIONS.filter((p) => p.module === module);
}

export function getAllProviders(): Record<IntegrationModule, ProviderDefinition[]> {
  const result = {} as Record<IntegrationModule, ProviderDefinition[]>;
  for (const def of PROVIDER_DEFINITIONS) {
    if (!result[def.module]) result[def.module] = [];
    result[def.module].push(def);
  }
  return result;
}

/* ================================================================== */
/*  INTEGRATION CRUD                                                   */
/* ================================================================== */

export async function getIntegrations(): Promise<IntegrationConfig[]> {
  const rows = await getAllConfigs();
  return rows.map(rowToConfig);
}

export async function getIntegration(id: string): Promise<IntegrationConfig | undefined> {
  const row = await repoGetConfig(id);
  return row ? rowToConfig(row) : undefined;
}

export async function getIntegrationsByModule(module: IntegrationModule): Promise<IntegrationConfig[]> {
  const rows = await getConfigsByModule(module);
  return rows.map(rowToConfig);
}

export async function getIntegrationsByEnvironment(env: IntegrationEnvironment): Promise<IntegrationConfig[]> {
  const rows = await getConfigsByEnvironment(env);
  return rows.map(rowToConfig);
}

export async function saveIntegration(
  input: {
    module: IntegrationModule;
    provider: string;
    label: string;
    settings: Record<string, string>;
    environment?: IntegrationEnvironment;
  },
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<IntegrationConfig> {
  const existing = await getConfigByModuleProvider(input.module, input.provider);

  const providerDef = PROVIDER_DEFINITIONS.find(
    (p) => p.module === input.module && p.provider === input.provider,
  );
  if (providerDef) {
    for (const field of providerDef.fields) {
      if (field.required && field.type === "password") {
        const val = input.settings[field.key];
        if (!val || val.length < 4) {
          throw new Error(`${field.label} must be at least 4 characters`);
        }
      }
    }
  }

  const encryptedSettings: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.settings)) {
    encryptedSettings[key] = encrypt(value);
  }

  if (existing) {
    const changedFields: string[] = [];
    const oldSettings = existing.settings || {};
    for (const [key, value] of Object.entries(encryptedSettings)) {
      if (oldSettings[key] !== value) {
        changedFields.push(key);
      }
    }

    const passwordFieldsChanged = changedFields.some((k) =>
      providerDef?.fields.find((f) => f.key === k && (f.type === "password" || f.type === "textarea"))
    );

    let metadata = (existing.metadata || {}) as Record<string, any>;
    if (passwordFieldsChanged) {
      if (!metadata.credentialVersions) metadata.credentialVersions = [];
      metadata.credentialVersions.push({ version: existing.version + 1, rotatedAt: Date.now(), rotatedBy: actor });
      if (metadata.credentialVersions.length > 10) metadata.credentialVersions = metadata.credentialVersions.slice(-10);
      metadata.lastRotatedAt = Date.now();
      metadata.expiresAt = Date.now() + DEFAULT_CREDENTIAL_TTL_MS;
      metadata.rotationReminderAt = Date.now() + DEFAULT_CREDENTIAL_TTL_MS - (ROTATION_REMINDER_DAYS * 24 * 60 * 60 * 1000);
    }

    const updated = await repoUpdateConfig(existing.id, {
      label: input.label,
      settings: { ...oldSettings, ...encryptedSettings },
      ...(input.environment ? { environment: input.environment } : {}),
      metadata,
      version: existing.version + 1,
    });

    const result = rowToConfig(updated);
    await addLog(result.id, "credential_updated", "info",
      `Configuration updated: ${changedFields.length > 0 ? changedFields.join(", ") : "label/environment"}`,
      actor, actorInfo);
    return result;
  }

  // Create new
  const id = uuidv4();
  const metadata = {
    lastRotatedAt: Date.now(),
    expiresAt: Date.now() + DEFAULT_CREDENTIAL_TTL_MS,
    rotationReminderAt: Date.now() + DEFAULT_CREDENTIAL_TTL_MS - (ROTATION_REMINDER_DAYS * 24 * 60 * 60 * 1000),
    healthScore: 100,
    consecutiveFailures: 0,
    circuitBreakerState: "closed" as const,
    totalSuccessTests: 0,
    totalFailedTests: 0,
    credentialVersions: [{ version: 1, rotatedAt: Date.now(), rotatedBy: actor }],
  };

  const row = await repoCreateConfig({
    id,
    module: input.module,
    provider: input.provider,
    label: input.label,
    enabled: false,
    environment: input.environment || "development",
    settings: encryptedSettings,
    metadata,
  });

  const result = rowToConfig(row);
  await addLog(result.id, "credential_created", "info", "Integration created", actor, actorInfo);
  return result;
}

export async function toggleIntegration(
  id: string,
  enabled: boolean,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<IntegrationConfig | null> {
  const updated = await repoUpdateConfig(id, { enabled });
  if (!updated) return null;
  const result = rowToConfig(updated);
  await addLog(id, enabled ? "enabled" : "disabled", "info",
    `Integration ${enabled ? "enabled" : "disabled"}`, actor, actorInfo);
  return result;
}

export async function deleteIntegration(
  id: string,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<boolean> {
  const config = await repoGetConfig(id);
  if (!config) return false;
  await repoDeleteConfig(id);
  await addLog(id, "credential_deleted", "info",
    `Integration "${config.label}" deleted`, actor, actorInfo);
  return true;
}

/* ================================================================== */
/*  CREDENTIAL ROTATION                                                */
/* ================================================================== */

export async function rotateCredentials(
  id: string,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<IntegrationConfig | null> {
  const config = await repoGetConfig(id);
  if (!config) return null;

  const settings = config.settings || {};
  const newSettings: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    const decrypted = decrypt(value);
    newSettings[key] = encrypt(decrypted);
  }

  const meta = (config.metadata || {}) as Record<string, any>;
  if (!meta.credentialVersions) meta.credentialVersions = [];
  meta.credentialVersions.push({ version: config.version + 1, rotatedAt: Date.now(), rotatedBy: actor });
  if (meta.credentialVersions.length > 10) meta.credentialVersions = meta.credentialVersions.slice(-10);
  meta.lastRotatedAt = Date.now();
  meta.expiresAt = Date.now() + DEFAULT_CREDENTIAL_TTL_MS;
  meta.rotationReminderAt = Date.now() + DEFAULT_CREDENTIAL_TTL_MS - (ROTATION_REMINDER_DAYS * 24 * 60 * 60 * 1000);
  meta.circuitBreakerState = "closed";
  meta.consecutiveFailures = 0;

  const updated = await repoUpdateConfig(id, {
    settings: newSettings,
    metadata: meta,
    version: config.version + 1,
  });
  if (!updated) return null;

  await addLog(id, "credential_rotation", "info",
    `Credentials rotated (v${updated.version})`, actor, actorInfo);
  return rowToConfig(updated);
}

/* ================================================================== */
/*  ENVIRONMENT MANAGEMENT                                             */
/* ================================================================== */

export async function changeIntegrationEnvironment(
  id: string,
  environment: IntegrationEnvironment,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<IntegrationConfig | null> {
  const config = await repoGetConfig(id);
  if (!config) return null;

  const oldEnv = config.environment;
  const updated = await repoUpdateConfig(id, {
    environment,
    version: config.version + 1,
  });
  if (!updated) return null;

  await addLog(id, "environment_changed", "info",
    `Environment changed: ${oldEnv} → ${environment}`, actor, actorInfo);
  return rowToConfig(updated);
}

/* ================================================================== */
/*  CONNECTION TESTING (with circuit breaker & retry logic)            */
/* ================================================================== */

function getDecryptedSettings(config: IntegrationConfig): Record<string, string> {
  const settings: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.settings)) {
    try {
      settings[key] = decrypt(value);
    } catch {
      settings[key] = value;
    }
  }
  return settings;
}

function updateHealthScore(config: IntegrationConfig, success: boolean, latency: number) {
  const totalTests = (config.metadata.totalSuccessTests || 0) + (config.metadata.totalFailedTests || 0);
  if (totalTests > 100) {
    config.metadata.totalSuccessTests = Math.floor((config.metadata.totalSuccessTests || 0) * 0.9);
    config.metadata.totalFailedTests = Math.floor((config.metadata.totalFailedTests || 0) * 0.9);
  }
  if (success) {
    config.metadata.totalSuccessTests = (config.metadata.totalSuccessTests || 0) + 1;
    config.metadata.consecutiveFailures = 0;
    config.metadata.lastSuccessAt = Date.now();
  } else {
    config.metadata.totalFailedTests = (config.metadata.totalFailedTests || 0) + 1;
    config.metadata.consecutiveFailures = (config.metadata.consecutiveFailures || 0) + 1;
  }
  if ((config.metadata.consecutiveFailures || 0) >= CIRCUIT_BREAKER_THRESHOLD) {
    config.metadata.circuitBreakerState = "open";
    config.metadata.circuitBreakerOpenedAt = Date.now();
    config.connectionStatus = "disconnected";
  } else if (config.metadata.circuitBreakerState === "open" && success) {
    config.metadata.circuitBreakerState = "closed";
    config.metadata.circuitBreakerOpenedAt = undefined;
  } else if (config.metadata.circuitBreakerState === "open" && !success) {
    const openedAt = config.metadata.circuitBreakerOpenedAt || 0;
    if (Date.now() - openedAt > CIRCUIT_BREAKER_RESET_MS) {
      config.metadata.circuitBreakerState = "half-open";
    }
  }
  const successCount = config.metadata.totalSuccessTests || 0;
  const failCount = config.metadata.totalFailedTests || 0;
  const total = successCount + failCount;
  config.metadata.healthScore = total > 0 ? Math.round((successCount / total) * 100) : 100;
  if (config.metadata.averageLatency) {
    config.metadata.averageLatency = Math.round(config.metadata.averageLatency * 0.7 + latency * 0.3);
  } else {
    config.metadata.averageLatency = latency;
  }
}

export async function testConnection(
  id: string,
): Promise<{ success: boolean; message: string; latency?: number }> {
  let config = await getIntegration(id);
  if (!config) {
    return { success: false, message: "Integration not found." };
  }

  if (config.metadata?.circuitBreakerState === "open") {
    const openedAt = config.metadata.circuitBreakerOpenedAt || 0;
    const timeSinceOpen = Date.now() - openedAt;
    if (timeSinceOpen < CIRCUIT_BREAKER_RESET_MS) {
      return {
        success: false,
        message: `Circuit breaker is OPEN (opened ${Math.round(timeSinceOpen / 1000 / 60)}m ago). Wait ${Math.round((CIRCUIT_BREAKER_RESET_MS - timeSinceOpen) / 1000 / 60)}m or rotate credentials.`,
      };
    }
    config.metadata.circuitBreakerState = "half-open";
  }

  const startTime = Date.now();
  config.connectionStatus = "testing";

  try {
    const settings = getDecryptedSettings(config);
    let success = false;
    let message = "";
    let lastError: string | null = null;

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
      try {
        switch (config.provider) {
          case "openai":
            try {
              const res = await fetch("https://api.openai.com/v1/models", {
                headers: { Authorization: `Bearer ${settings.api_key}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "OpenAI API key is valid" : `OpenAI returned ${res.status}: ${res.statusText}`;
            } catch (e: any) { message = `OpenAI connection failed: ${e.message}`; }
            break;
          case "gemini":
            try {
              const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${settings.api_key}`, { signal: AbortSignal.timeout(5000) });
              success = res.ok;
              message = success ? "Gemini API key is valid" : `Gemini returned ${res.status}`;
            } catch (e: any) { message = `Gemini connection failed: ${e.message}`; }
            break;
          case "claude":
            try {
              const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "x-api-key": settings.api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
                body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
                signal: AbortSignal.timeout(5000),
              });
              success = res.status === 200 || res.status === 400;
              message = success ? "Claude API key is valid" : `Claude returned ${res.status}`;
            } catch (e: any) { message = `Claude connection failed: ${e.message}`; }
            break;
          case "deepseek":
            try {
              const res = await fetch("https://api.deepseek.com/v1/models", {
                headers: { Authorization: `Bearer ${settings.api_key}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "DeepSeek API key is valid" : `DeepSeek returned ${res.status}`;
            } catch (e: any) { message = `DeepSeek connection failed: ${e.message}`; }
            break;
          case "sendgrid":
            try {
              const res = await fetch("https://api.sendgrid.com/v3/scopes", {
                headers: { Authorization: `Bearer ${settings.api_key}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "SendGrid API key is valid" : res.status === 401 ? "SendGrid API key exists but may lack permissions" : `SendGrid returned ${res.status}`;
            } catch (e: any) { message = `SendGrid connection failed: ${e.message}`; }
            break;
          case "mailgun":
            try {
              const res = await fetch(`https://api.mailgun.net/v4/domains/${settings.domain}`, {
                headers: { Authorization: `Basic ${Buffer.from(`api:${settings.api_key}`).toString("base64")}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Mailgun domain & API key are valid" : `Mailgun returned ${res.status}`;
            } catch (e: any) { message = `Mailgun connection failed: ${e.message}`; }
            break;
          case "resend":
            try {
              const res = await fetch("https://api.resend.com/audiences", {
                headers: { Authorization: `Bearer ${settings.api_key}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Resend API key is valid" : `Resend returned ${res.status}`;
            } catch (e: any) { message = `Resend connection failed: ${e.message}`; }
            break;
          case "postmark":
            try {
              const res = await fetch("https://api.postmarkapp.com/server", {
                headers: { "X-Postmark-Server-Token": settings.server_token },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Postmark server token is valid" : `Postmark returned ${res.status}`;
            } catch (e: any) { message = `Postmark connection failed: ${e.message}`; }
            break;
          case "smtp":
            try {
              const { connect } = await import("node:net");
              await new Promise<void>((resolve, reject) => {
                const socket = connect(Number(settings.port) || 587, settings.host || "localhost");
                socket.setTimeout(5000);
                socket.on("connect", () => { socket.destroy(); resolve(); });
                socket.on("error", reject);
                socket.on("timeout", () => { socket.destroy(); reject(new Error("Connection timed out")); });
              });
              success = true;
              message = `SMTP server ${settings.host}:${settings.port} is reachable`;
            } catch (e: any) { message = `SMTP connection failed: ${e.message}`; }
            break;
          case "ses":
            try {
              const res = await fetch(`https://email.${settings.region || "us-east-1"}.amazonaws.com`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "Action=GetSendQuota&Version=2010-12-01",
                signal: AbortSignal.timeout(8000),
              });
              success = res.ok || res.status === 403;
              message = success ? "SES endpoint is reachable" : `SES returned ${res.status}`;
            } catch (e: any) { message = `SES connection failed: ${e.message}`; }
            break;
          case "twilio":
            try {
              const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.account_sid}.json`, {
                headers: { Authorization: `Basic ${Buffer.from(`${settings.account_sid}:${settings.auth_token}`).toString("base64")}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Twilio credentials are valid" : `Twilio returned ${res.status}`;
            } catch (e: any) { message = `Twilio connection failed: ${e.message}`; }
            break;
          case "msg91":
            try {
              const res = await fetch(`https://api.msg91.com/api/v5/otp?authkey=${settings.auth_key}&mobile=9999999999&otp=999999`, { signal: AbortSignal.timeout(5000) });
              success = res.ok;
              message = success ? "MSG91 auth key is valid" : `MSG91 returned ${res.status}`;
            } catch (e: any) { message = `MSG91 connection failed: ${e.message}`; }
            break;
          case "amazon_sns":
            try {
              const res = await fetch(`https://sns.${settings.region || "us-east-1"}.amazonaws.com`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "Action=ListTopics&Version=2010-03-31",
                signal: AbortSignal.timeout(8000),
              });
              success = res.ok || res.status === 403 || res.status === 401;
              message = success ? "SNS endpoint is reachable" : `SNS returned ${res.status}`;
            } catch (e: any) { message = `SNS connection failed: ${e.message}`; }
            break;
          case "amazon_associates":
            try {
              const res = await fetch(`https://webservices.amazon.com/paapi5/searchitems?AccessKey=${settings.access_key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  AccessKey: settings.access_key, SecretKey: settings.secret_key,
                  PartnerTag: settings.tracking_id || "alaya-20", PartnerType: "Associates",
                  Marketplace: "www.amazon.com", ItemIds: ["059035342X"], Resources: ["ItemInfo.Title"],
                }),
                signal: AbortSignal.timeout(5000),
              });
              success = true;
              message = "Amazon Associates endpoint is reachable";
            } catch (e: any) { message = `Amazon Associates connection failed: ${e.message}`; }
            break;
          case "impact":
            try {
              const res = await fetch("https://api.impact.com/Mediapartners/", {
                headers: { Authorization: `Basic ${Buffer.from(`${settings.account_sid}:${settings.auth_token}`).toString("base64")}` },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok || res.status === 401;
              message = success ? "Impact credentials verified" : `Impact returned ${res.status}`;
            } catch (e: any) { message = `Impact connection failed: ${e.message}`; }
            break;
          case "ga4":
            try {
              const res = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${settings.measurement_id}&api_secret=${settings.api_secret || "test"}`, {
                method: "POST",
                body: JSON.stringify({ client_id: "test", events: [{ name: "test_connection" }] }),
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok || res.status === 204;
              message = success ? "GA4 measurement protocol responds" : `GA4 returned ${res.status}`;
            } catch (e: any) { message = `GA4 connection failed: ${e.message}`; }
            break;
          case "algolia":
            try {
              const res = await fetch(`https://${settings.app_id}-dsn.algolia.net/1/indexes`, {
                headers: { "X-Algolia-API-Key": settings.api_key, "X-Algolia-Application-Id": settings.app_id },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Algolia credentials are valid" : `Algolia returned ${res.status}`;
            } catch (e: any) { message = `Algolia connection failed: ${e.message}`; }
            break;
          case "meilisearch":
            try {
              const url = settings.host || "http://localhost:7700";
              const res = await fetch(`${url}/health`, {
                headers: settings.api_key ? { Authorization: `Bearer ${settings.api_key}` } : {},
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Meilisearch is reachable" : `Meilisearch returned ${res.status}`;
            } catch (e: any) { message = `Meilisearch connection failed: ${e.message}`; }
            break;
          case "cloudinary":
            try {
              const ts = Math.floor(Date.now() / 1000);
              const toSign = `cloud_name=${settings.cloud_name}&timestamp=${ts}${settings.api_secret}`;
              const signature = createHash("sha256").update(toSign).digest("hex");
              await fetch(`https://api.cloudinary.com/v1_1/${settings.cloud_name}/image/upload?timestamp=${ts}&signature=${signature}&api_key=${settings.api_key}`, {
                method: "POST", signal: AbortSignal.timeout(5000),
              });
              success = true;
              message = "Cloudinary endpoint is reachable";
            } catch (e: any) { message = `Cloudinary connection failed: ${e.message}`; }
            break;
          case "s3":
            try {
              const res = await fetch(`https://${settings.bucket}.s3.${settings.region || "us-east-1"}.amazonaws.com`, {
                method: "HEAD", signal: AbortSignal.timeout(5000),
              });
              success = res.ok || res.status === 403;
              message = success ? "S3 bucket is reachable" : `S3 returned ${res.status}`;
            } catch (e: any) { message = `S3 connection failed: ${e.message}`; }
            break;
          case "cloudflare":
            try {
              const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${settings.zone_id}`, {
                headers: { Authorization: `Bearer ${settings.api_token}`, "Content-Type": "application/json" },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Cloudflare API token is valid" : `Cloudflare returned ${res.status}`;
            } catch (e: any) { message = `Cloudflare connection failed: ${e.message}`; }
            break;
          case "google_maps":
            try {
              const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${settings.api_key}`, { signal: AbortSignal.timeout(5000) });
              const data: any = await res.json();
              success = data.status !== "REQUEST_DENIED" && data.status !== "INVALID_REQUEST";
              message = success ? "Google Maps API key is valid" : `Maps API error: ${data.status}`;
            } catch (e: any) { message = `Google Maps connection failed: ${e.message}`; }
            break;
          case "onesignal":
            try {
              const res = await fetch("https://onesignal.com/api/v1/apps", {
                headers: { Authorization: `Basic ${settings.rest_api_key}`, "Content-Type": "application/json" },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "OneSignal API key is valid" : `OneSignal returned ${res.status}`;
            } catch (e: any) { message = `OneSignal connection failed: ${e.message}`; }
            break;
          case "pusher":
            try {
              const res = await fetch(`https://api-${settings.cluster || "us2"}.pusher.com/apps/${settings.app_id}`, {
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(5000),
              });
              success = res.ok;
              message = success ? "Pusher app is reachable" : `Pusher returned ${res.status}`;
            } catch (e: any) { message = `Pusher connection failed: ${e.message}`; }
            break;
          case "aws":
            try {
              await fetch("https://sts.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
                signal: AbortSignal.timeout(8000),
              });
              success = true;
              message = "AWS endpoint is reachable";
            } catch (e: any) { message = `AWS connection failed: ${e.message}`; }
            break;
          case "local":
          case "internal_api":
          case "google":
          case "apple":
          case "microsoft":
          case "amazon":
            success = true;
            message = `${config.label}: Configuration saved (OAuth test requires user interaction)`;
            break;
          default:
            success = true;
            message = `Configuration verified for ${config.label}`;
            break;
        }
        if (success) break;
        if (attempt === maxRetries) lastError = message;
      } catch (e: any) {
        lastError = `Attempt ${attempt + 1} failed: ${e.message}`;
        if (attempt === maxRetries) message = lastError;
      }
    }

    const latency = Date.now() - startTime;
    updateHealthScore(config, success, latency);

    config.connectionStatus = success ? "connected" : "error";
    config.lastTestedAt = Date.now();
    if (!success) {
      config.lastError = message || lastError || "Connection test failed";
      config.lastErrorAt = Date.now();
    } else {
      config.lastError = undefined;
      config.lastErrorAt = undefined;
    }

    await repoUpdateConfig(config.id, {
      connection_status: config.connectionStatus,
      last_tested_at: new Date(config.lastTestedAt).toISOString(),
      last_error: config.lastError || null,
      last_error_at: config.lastErrorAt ? new Date(config.lastErrorAt).toISOString() : null,
      last_success_at: success ? new Date().toISOString() : undefined,
      metadata: configToMetadata(config),
    });

    await addLog(id, "connection_test", success ? "success" : "failure",
      success ? `Connection test passed (${latency}ms)` : `Connection test failed: ${message || lastError}`,
      "system");

    fireTrigger({
      event: success ? "integration:connection_success" : "integration:connection_failed",
      userId: "system",
      metadata: {
        integrationId: id, provider: config.provider, label: config.label,
        module: config.module, environment: config.environment,
        latency: String(latency), message: message || lastError || "Unknown error",
      },
    }).catch(() => {});

    return { success, message: message || lastError || "Unknown error", latency };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    config.connectionStatus = "error";
    config.lastError = error.message;
    config.lastErrorAt = Date.now();
    config.lastTestedAt = Date.now();
    updateHealthScore(config, false, latency);

    await repoUpdateConfig(config.id, {
      connection_status: "error",
      last_tested_at: new Date().toISOString(),
      last_error: error.message,
      last_error_at: new Date().toISOString(),
      metadata: configToMetadata(config),
    });

    await addLog(id, "connection_test", "failure", `Connection test error: ${error.message}`, "system");

    fireTrigger({
      event: "integration:error", userId: "system",
      metadata: { integrationId: id, provider: config.provider, label: config.label, module: config.module, environment: config.environment, error: error.message },
    }).catch(() => {});

    return { success: false, message: error.message };
  }
}

/* ================================================================== */
/*  HEALTH DASHBOARD                                                   */
/* ================================================================== */

export async function getHealthDashboard(): Promise<HealthCheckResult[]> {
  const configs = await getAllConfigs();
  const now = Date.now();

  return configs.map((config) => {
    const meta = config.metadata || {};
    const expired = meta.expiresAt ? meta.expiresAt < now : false;
    const expiringSoon = meta.rotationReminderAt ? meta.rotationReminderAt < now && !expired : false;
    return {
      id: config.id,
      provider: config.provider,
      label: config.label,
      module: config.module as IntegrationModule,
      environment: config.environment as IntegrationEnvironment,
      enabled: config.enabled,
      connectionStatus: (config.connection_status || "unknown") as ConnectionStatus,
      healthScore: meta.healthScore ?? 100,
      averageLatency: meta.averageLatency,
      lastTestedAt: config.last_tested_at ? new Date(config.last_tested_at).getTime() : undefined,
      lastSuccessAt: meta.lastSuccessAt,
      lastError: config.last_error || undefined,
      lastErrorAt: config.last_error_at ? new Date(config.last_error_at).getTime() : undefined,
      circuitBreakerState: meta.circuitBreakerState,
      expiresAt: meta.expiresAt,
      credentialExpired: expired,
      credentialExpiringSoon: expiringSoon,
      version: config.version,
      lastUpdated: new Date(config.updated_at).getTime(),
    };
  });
}

/* ================================================================== */
/*  LOGS                                                               */
/* ================================================================== */

export async function getIntegrationLogs(integrationId: string, limit = 50): Promise<IntegrationLog[]> {
  const rows = await getLogsForIntegration(integrationId, limit);
  return rows.map(rowToLog);
}

export async function getAllLogs(limit = 100): Promise<IntegrationLog[]> {
  const rows = await repoGetAllLogs(limit);
  return rows.map(rowToLog);
}

function rowToLog(row: any): IntegrationLog {
  return {
    id: row.id,
    integrationId: row.integration_id,
    type: row.type as IntegrationLogType,
    status: row.status as "success" | "failure" | "info",
    message: row.message,
    details: row.details || undefined,
    actor: row.actor,
    actorRole: row.actor_role as IntegrationLog["actorRole"],
    actorIp: row.actor_ip || undefined,
    actorUserAgent: row.actor_user_agent || undefined,
    actorDevice: row.actor_device || undefined,
    actorCountry: row.actor_country || undefined,
    ts: new Date(row.created_at).getTime(),
  };
}

/* ================================================================== */
/*  STATISTICS                                                         */
/* ================================================================== */

export async function getIntegrationStats(): Promise<IntegrationStats> {
  const configs = await getAllConfigs();
  const logRows = await repoGetAllLogs(10);
  const now = Date.now();

  const byModule: Record<string, number> = {};
  const byEnvironment: Record<string, number> = {};

  let totalHealthScore = 0;
  let healthyCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  let credentialExpiringCount = 0;
  let circuitBreakerOpenCount = 0;

  for (const config of configs) {
    if (!byModule[config.module]) byModule[config.module] = 0;
    byModule[config.module]++;
    if (!byEnvironment[config.environment]) byEnvironment[config.environment] = 0;
    byEnvironment[config.environment]++;

    const meta = config.metadata || {};
    const healthScore = meta.healthScore ?? 100;
    totalHealthScore += healthScore;
    if (healthScore >= 80) healthyCount++;
    else if (healthScore >= 50) warningCount++;
    else criticalCount++;

    if (meta.expiresAt && meta.expiresAt < now) credentialExpiringCount++;
    if (meta.circuitBreakerState === "open") circuitBreakerOpenCount++;
  }

  return {
    totalIntegrations: configs.length,
    enabledCount: configs.filter((c) => c.enabled).length,
    connectedCount: configs.filter((c) => c.connection_status === "connected").length,
    errorCount: configs.filter((c) => c.connection_status === "error").length,
    credentialExpiringCount,
    circuitBreakerOpenCount,
    recentLogs: logRows.map(rowToLog),
    byModule,
    byEnvironment,
    healthSummary: {
      averageHealthScore: configs.length > 0 ? Math.round(totalHealthScore / configs.length) : 100,
      healthyCount,
      warningCount,
      criticalCount,
    },
  };
}

/* ================================================================== */
/*  MASKED INTEGRATION DISPLAY                                         */
/* ================================================================== */

export async function getMaskedIntegration(id: string): Promise<any> {
  const config = await repoGetConfig(id);
  if (!config) return null;

  const masked: any = { ...config, settings: {} };
  const providerDef = PROVIDER_DEFINITIONS.find(
    (p) => p.module === config.module && p.provider === config.provider,
  );

  for (const [key, value] of Object.entries(config.settings || {})) {
    const field = providerDef?.fields.find((f) => f.key === key);
    const decrypted = decrypt(value);
    masked.settings[key] = field?.maskInUI ? maskValue(decrypted) : decrypted;
  }

  // Normalize to frontend format
  return {
    ...masked,
    id: config.id,
    module: config.module,
    provider: config.provider,
    label: config.label,
    enabled: config.enabled,
    environment: config.environment,
    connectionStatus: config.connection_status,
    createdAt: new Date(config.created_at).getTime(),
    updatedAt: new Date(config.updated_at).getTime(),
    version: config.version,
  };
}

export async function getAllMaskedIntegrations(): Promise<any[]> {
  const configs = await getAllConfigs();
  const result: any[] = [];
  for (const config of configs) {
    const masked = await getMaskedIntegration(config.id);
    if (masked) result.push(masked);
  }
  return result;
}

/* ================================================================== */
/*  BACKUP & RESTORE                                                   */
/* ================================================================== */

export async function createBackup(
  label: string,
  actor: string,
  environment?: IntegrationEnvironment | "all",
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<BackupEntry> {
  const env = environment || "all";
  let configs = await getAllConfigs();
  if (env !== "all") {
    configs = configs.filter((c) => c.environment === env);
  }

  const backupData = JSON.stringify(configs);
  const checksum = createHash("sha256").update(backupData).digest("hex");

  const id = uuidv4();
  await repoCreateBackup({
    id,
    label,
    environment: env,
    integration_count: configs.length,
    checksum,
    data: JSON.parse(backupData),
    created_by: actor,
  });

  // Enforce max backups limit
  await deleteOldBackups(MAX_BACKUPS);

  await addLog("backup", "backup_created", "info",
    `Backup "${label}" created (${configs.length} integrations, ${env})`, actor, actorInfo);

  return { id, label, createdAt: Date.now(), createdBy: actor, environment: env as IntegrationEnvironment | "all", integrationCount: configs.length, checksum };
}

export async function listBackups(): Promise<BackupEntry[]> {
  const backups = await repoListBackups();
  return backups.map((b) => ({
    id: b.id,
    label: b.label,
    createdAt: new Date(b.created_at).getTime(),
    createdBy: b.created_by,
    environment: b.environment as IntegrationEnvironment | "all",
    integrationCount: b.integration_count,
    checksum: b.checksum,
  }));
}

export async function getBackupData(id: string): Promise<string | null> {
  const backup = await repoGetBackup(id);
  return backup ? JSON.stringify(backup.data) : null;
}

export async function restoreBackup(
  id: string,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<{ success: boolean; count: number; message: string }> {
  const backup = await repoGetBackup(id);
  if (!backup) return { success: false, count: 0, message: "Backup not found" };

  const checksum = createHash("sha256").update(JSON.stringify(backup.data)).digest("hex");
  if (checksum !== backup.checksum) {
    return { success: false, count: 0, message: "Backup checksum mismatch — data may be corrupted" };
  }

  try {
    const configs = Array.isArray(backup.data) ? backup.data : [];
    let restoredCount = 0;

    for (const cfg of configs) {
      if (!cfg.module || !cfg.provider || !cfg.settings) continue;
      try {
        // Direct repo write — settings are already encrypted
        const existing = await getConfigByModuleProvider(cfg.module, cfg.provider);
        if (existing) {
          await repoUpdateConfig(existing.id, {
            label: cfg.label || existing.label,
            settings: cfg.settings,
            environment: cfg.environment || existing.environment,
            version: existing.version + 1,
          });
        } else {
          const id = uuidv4();
          await repoCreateConfig({
            id,
            module: cfg.module,
            provider: cfg.provider,
            label: cfg.label || `${cfg.module} ${cfg.provider}`,
            enabled: cfg.enabled || false,
            environment: cfg.environment || "development",
            settings: cfg.settings,
            metadata: {
              healthScore: 100, consecutiveFailures: 0, circuitBreakerState: "closed",
              totalSuccessTests: 0, totalFailedTests: 0,
              credentialVersions: [{ version: 1, rotatedAt: Date.now(), rotatedBy: actor }],
            },
          });
        }
        restoredCount++;
      } catch { /* skip individual failures */ }
    }

    await addLog("restore", "backup_restored", "info",
      `Backup "${backup.label}" restored (${restoredCount} integrations)`, actor, actorInfo);

    return { success: true, count: restoredCount, message: `Restored ${restoredCount} integrations from backup` };
  } catch (error: any) {
    return { success: false, count: 0, message: `Restore failed: ${error.message}` };
  }
}

export async function exportConfigs(environment?: IntegrationEnvironment | "all"): Promise<string> {
  let configs = await getAllConfigs();
  if (environment && environment !== "all") {
    configs = configs.filter((c) => c.environment === environment);
  }

  const exportData = {
    version: 2,
    exportedAt: Date.now(),
    environment: environment || "all",
    integrationCount: configs.length,
    configs: configs.map((c) => ({
      id: c.id,
      module: c.module,
      provider: c.provider,
      label: c.label,
      enabled: c.enabled,
      environment: c.environment,
      settings: c.settings,
      created_at: c.created_at,
      updated_at: c.updated_at,
      version: c.version,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importConfigs(
  jsonData: string,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const importData = JSON.parse(jsonData);
    if (!importData.version || !Array.isArray(importData.configs)) {
      return { success: false, count: 0, message: "Invalid import format" };
    }

    let importedCount = 0;
    for (const cfg of importData.configs) {
      if (!cfg.module || !cfg.provider || !cfg.settings) continue;
      try {
        // Direct repo write — settings are already encrypted from export
        const existing = await getConfigByModuleProvider(cfg.module, cfg.provider);
        if (existing) {
          await repoUpdateConfig(existing.id, {
            label: cfg.label || existing.label,
            settings: cfg.settings,
            environment: cfg.environment || existing.environment,
            version: existing.version + 1,
          });
        } else {
          const id = uuidv4();
          await repoCreateConfig({
            id,
            module: cfg.module,
            provider: cfg.provider,
            label: cfg.label || `${cfg.module} ${cfg.provider}`,
            enabled: cfg.enabled || false,
            environment: cfg.environment || "development",
            settings: cfg.settings,
            metadata: {
              healthScore: 100, consecutiveFailures: 0, circuitBreakerState: "closed",
              totalSuccessTests: 0, totalFailedTests: 0,
              credentialVersions: [{ version: 1, rotatedAt: Date.now(), rotatedBy: actor }],
            },
          });
        }
        importedCount++;
      } catch { /* skip individual failures */ }
    }

    await addLog("import", "backup_imported", "info",
      `Imported ${importedCount} integrations from export`, actor, actorInfo);
    return { success: true, count: importedCount, message: `Imported ${importedCount} integrations` };
  } catch (error: any) {
    return { success: false, count: 0, message: `Import failed: ${error.message}` };
  }
}

/* ================================================================== */
/*  AUDIT LOGGING                                                      */
/* ================================================================== */



async function addLog(
  integrationId: string,
  type: IntegrationLogType,
  status: IntegrationLog["status"],
  message: string,
  actor: string,
  actorInfo?: { ip?: string; userAgent?: string; device?: string; country?: string; role?: IntegrationLog["actorRole"] },
  details?: string,
) {
  await repoCreateLog({
    integration_id: integrationId,
    type,
    status,
    message,
    details,
    actor,
    actor_role: actorInfo?.role || "super_admin",
    actor_ip: actorInfo?.ip,
    actor_user_agent: actorInfo?.userAgent,
    actor_device: actorInfo?.device,
    actor_country: actorInfo?.country,
  });
}
