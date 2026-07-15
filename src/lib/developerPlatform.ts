/**
 * ALAYA INSIDER — Enterprise Developer Platform, Extensibility Framework,
 * SDK Ecosystem, Low-Code Platform & Engineering Toolkit (PART 2.17)
 * =====================================================================
 * Engineering foundation: developer portal, extensions, modules, SDKs, CLI,
 * code generators, playground, AI dev tools, productivity, documentation,
 * community, and developer APIs.
 *
 * Integrates with: developer.ts, gateway.ts, integrations.ts, devops.ts,
 * security.ts, identity.ts, observability.ts, intelligence.ts
 */
import { uid } from "./utils";
import { pushLog } from "./devops";
import { writeAuditEntry } from "./observability";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const DEVELOPER_PLATFORM_KEY = "alaya_developer_platform_store";
export const PLATFORM_VERSION = "2.0.0";

/* ================================================================== */
/*  TYPES — Developer Portal                                           */
/* ================================================================== */

export interface DeveloperProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "developer" | "admin" | "partner" | "community";
  apiKeys: { id: string; name: string; key: string; scopes: string[]; createdAt: number; lastUsed?: number; expiresAt?: number }[];
  preferences: { theme: "light" | "dark"; editor: string; language: string; notifications: boolean };
  teams: string[];
  projects: string[];
  createdAt: number;
  lastActiveAt: number;
}

export interface DeveloperMetric {
  id: string;
  name: string;
  category: "extensions" | "sdk" | "api" | "plugins" | "docs" | "community" | "cli" | "generators";
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
}

export interface DeveloperDashboardData {
  totalPlugins: number;
  activePlugins: number;
  totalExtensions: number;
  activeExtensions: number;
  totalModules: number;
  activatedModules: number;
  totalSdks: number;
  stableSdks: number;
  totalCliCommands: number;
  totalGenerators: number;
  totalDocPages: number;
  totalPlaygroundSessions: number;
}

/* ================================================================== */
/*  TYPES — Extension Framework                                        */
/* ================================================================== */

export interface ExtensionManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  icon?: string;
  category: "payment" | "shipping" | "affiliate" | "ai" | "analytics" | "marketing" | "email" | "sms" | "search" | "theme" | "language" | "integration" | "widget" | "tool" | "connector";
  permissions: string[];
  hooks: string[];
  dependencies: { name: string; version: string }[];
  settings: Record<string, { label: string; type: "string" | "boolean" | "number" | "select"; default: any; options?: string[] }>;
  signature?: string;
  checksum?: string;
  verified: boolean;
  sandboxed: boolean;
  status: "installed" | "active" | "disabled" | "error";
  healthScore: number;
  lastHealthCheck?: number;
  errorCount: number;
  installedAt: number;
  updatedAt: number;
}

export interface PluginMarketplaceEntry {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  version: string;
  author: string;
  authorUrl?: string;
  icon?: string;
  category: ExtensionManifest["category"];
  pricing: "free" | "paid" | "freemium";
  price?: number;
  rating: number;
  downloadCount: number;
  verified: boolean;
  screenshots: string[];
  readme: string;
  tags: string[];
  publishedAt: number;
  updatedAt: number;
}

export interface ExtensionDependencyGraph {
  id: string;
  name: string;
  version: string;
  dependencies: { name: string; version: string; resolved: boolean }[];
  dependents: string[];
}

/* ================================================================== */
/*  TYPES — Module Framework                                           */
/* ================================================================== */

export interface PlatformModule {
  id: string;
  name: string;
  description: string;
  version: string;
  category: "core" | "commerce" | "content" | "marketing" | "analytics" | "ai" | "seo" | "security" | "integration" | "developer" | "tool";
  dependencies: string[];
  config: Record<string, any>;
  status: "available" | "activated" | "deactivated" | "error";
  healthStatus: "healthy" | "degraded" | "down";
  priority: number;
  hasUI: boolean;
  hasAPI: boolean;
  hasWorker: boolean;
  activatedAt?: number;
  deactivatedAt?: number;
  createdAt: number;
}

export interface ModuleDiscoveryResult {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  compatibility: "full" | "partial" | "incompatible";
  conflicts: string[];
  suggestions: string[];
}

/* ================================================================== */
/*  TYPES — SDK Platform                                               */
/* ================================================================== */

export interface SdkPackage {
  id: string;
  name: string;
  description: string;
  language: "JavaScript" | "TypeScript" | "Python" | "PHP" | "Ruby" | "Go" | "Java" | ".NET" | "Rust" | "Swift" | "Kotlin" | "C++";
  version: string;
  installCommand: string;
  packageName: string;
  status: "alpha" | "beta" | "stable" | "deprecated";
  documentation: string;
  repository: string;
  license: string;
  packageSize?: string;
  downloads?: number;
  dependencies: string[];
  features: string[];
  generatedAt: number;
  updatedAt: number;
}

export interface SdkGeneratorConfig {
  language: string;
  packageName: string;
  version: string;
  endpoints: string[];
  authType: string[];
  outputDir: string;
  includeTests: boolean;
  includeExamples: boolean;
}

/* ================================================================== */
/*  TYPES — CLI Tools                                                  */
/* ================================================================== */

export interface CliCommand {
  id: string;
  name: string;
  description: string;
  usage: string;
  category: "auth" | "deploy" | "scaffold" | "generate" | "manage" | "diagnose" | "config" | "plugin" | "test";
  subcommands: string[];
  flags: { name: string; alias?: string; description: string; required: boolean }[];
  examples: string[];
  outputHelp: string;
}

export interface CliExtension {
  id: string;
  name: string;
  description: string;
  commands: CliCommand[];
  version: string;
  author: string;
  installed: boolean;
  installedAt?: number;
}

export interface CliSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  scope: string[];
  lastUsedAt: number;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Code Generators                                            */
/* ================================================================== */

export interface CodeGenerator {
  id: string;
  name: string;
  description: string;
  type: "scaffold" | "component" | "module" | "crud" | "api" | "migration" | "schema" | "documentation" | "test" | "hook" | "service" | "config";
  language: string;
  template: string;
  variables: { name: string; label: string; type: "string" | "boolean" | "select"; required: boolean; options?: string[]; defaultValue?: string }[];
  output: string;
  version: string;
  author: string;
  tags: string[];
  createdAt: number;
}

export interface GeneratedArtifact {
  id: string;
  generatorId: string;
  generatorName: string;
  type: string;
  files: { path: string; content: string; language: string }[];
  variables: Record<string, string>;
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Developer Playground                                       */
/* ================================================================== */

export interface PlaygroundSession {
  id: string;
  userId: string;
  type: "api" | "graphql" | "webhook" | "ai" | "workflow" | "sandbox";
  name: string;
  code: string;
  result?: string;
  error?: string;
  durationMs?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ApiExplorerRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
  response?: { status: number; body: string; headers: Record<string, string>; durationMs: number };
  saved: boolean;
  createdAt: number;
}

export interface SandboxEnvironment {
  id: string;
  name: string;
  description: string;
  services: string[];
  dataSnapshot?: string;
  expiresAt: number;
  status: "creating" | "ready" | "expired";
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Documentation Platform                                     */
/* ================================================================== */

export interface DocPage {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: "getting_started" | "guides" | "api_reference" | "sdk" | "plugins" | "cli" | "tutorials" | "architecture" | "migration" | "changelog" | "faq";
  content: string;
  order: number;
  tags: string[];
  published: boolean;
  version: string;
  author: string;
  updatedAt: number;
  createdAt: number;
}

export interface DocSearchResult {
  pageId: string;
  title: string;
  snippet: string;
  category: string;
  relevance: number;
}

export interface ReleaseNote {
  id: string;
  version: string;
  title: string;
  date: number;
  type: "major" | "minor" | "patch" | "beta";
  highlights: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
  breakingChanges: string[];
  deprecations: string[];
  contributors: string[];
}

/* ================================================================== */
/*  TYPES — Community Platform                                         */
/* ================================================================== */

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: "question" | "discussion" | "showcase" | "guide" | "feedback" | "announcement";
  tags: string[];
  votes: number;
  answers: number;
  views: number;
  pinned: boolean;
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityAnswer {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  accepted: boolean;
  votes: number;
  createdAt: number;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  votes: number;
  status: "under_review" | "planned" | "in_progress" | "shipped" | "declined";
  priority: "low" | "medium" | "high" | "critical";
  comments: { authorName: string; content: string; ts: number }[];
  createdAt: number;
  updatedAt: number;
}

/* ================================================================== */
/*  TYPES — Developer APIs                                             */
/* ================================================================== */

export interface DeveloperApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  rateLimit: number;
  allowedIps: string[];
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  active: boolean;
  createdBy: string;
  createdAt: number;
}

export interface DeveloperWebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  retryCount: number;
  lastDeliveredAt?: number;
  lastStatus?: "success" | "failed";
  createdAt: number;
}

/* ================================================================== */
/*  STORE MANAGEMENT                                                   */
/* ================================================================== */

interface DevPlatformStore {
  developerProfiles: DeveloperProfile[];
  extensionManifests: ExtensionManifest[];
  marketplaceEntries: PluginMarketplaceEntry[];
  dependencyGraphs: ExtensionDependencyGraph[];
  platformModules: PlatformModule[];
  sdkPackages: SdkPackage[];
  cliCommands: CliCommand[];
  cliExtensions: CliExtension[];
  cliSessions: CliSession[];
  codeGenerators: CodeGenerator[];
  generatedArtifacts: GeneratedArtifact[];
  playgroundSessions: PlaygroundSession[];
  apiExplorerRequests: ApiExplorerRequest[];
  sandboxEnvironments: SandboxEnvironment[];
  docPages: DocPage[];
  releaseNotes: ReleaseNote[];
  communityPosts: CommunityPost[];
  communityAnswers: CommunityAnswer[];
  featureRequests: FeatureRequest[];
  developerApiKeys: DeveloperApiKey[];
  developerWebhooks: DeveloperWebhookSubscription[];
  metrics: DeveloperMetric[];
}

function getStore(): DevPlatformStore {
  try {
    const raw = localStorage.getItem(DEVELOPER_PLATFORM_KEY);
    if (raw) return JSON.parse(raw) as DevPlatformStore;
  } catch { /* ignore */ }
  return {
    developerProfiles: [], extensionManifests: [], marketplaceEntries: [],
    dependencyGraphs: [], platformModules: [], sdkPackages: [],
    cliCommands: [], cliExtensions: [], cliSessions: [],
    codeGenerators: [], generatedArtifacts: [],
    playgroundSessions: [], apiExplorerRequests: [], sandboxEnvironments: [],
    docPages: [], releaseNotes: [],
    communityPosts: [], communityAnswers: [], featureRequests: [],
    developerApiKeys: [], developerWebhooks: [], metrics: [],
  };
}

function saveStore(store: DevPlatformStore) {
  try { localStorage.setItem(DEVELOPER_PLATFORM_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedDeveloperPlatformData() {
  const store = getStore();
  if (store.platformModules.length > 0) return;

  const now = Date.now();

  /* ---- Platform Modules ---- */
  store.platformModules = [
    { id: uid("mod"), name: "Core Engine", description: "Platform core with routing, middleware, and hooks", version: "2.0.0", category: "core", dependencies: [], config: {}, status: "activated", healthStatus: "healthy", priority: 1, hasUI: false, hasAPI: true, hasWorker: false, activatedAt: now - 180 * 86400000, createdAt: now - 180 * 86400000 },
    { id: uid("mod"), name: "Auth Module", description: "Authentication and authorization", version: "1.5.0", category: "security", dependencies: ["core"], config: {}, status: "activated", healthStatus: "healthy", priority: 2, hasUI: true, hasAPI: true, hasWorker: false, activatedAt: now - 180 * 86400000, createdAt: now - 180 * 86400000 },
    { id: uid("mod"), name: "Commerce Module", description: "Product catalog, cart, checkout, orders", version: "2.1.0", category: "commerce", dependencies: ["core", "auth"], config: {}, status: "activated", healthStatus: "healthy", priority: 3, hasUI: true, hasAPI: true, hasWorker: true, activatedAt: now - 170 * 86400000, createdAt: now - 180 * 86400000 },
    { id: uid("mod"), name: "Analytics Module", description: "Analytics and reporting", version: "1.3.0", category: "analytics", dependencies: ["core"], config: {}, status: "activated", healthStatus: "healthy", priority: 4, hasUI: true, hasAPI: true, hasWorker: true, activatedAt: now - 150 * 86400000, createdAt: now - 170 * 86400000 },
    { id: uid("mod"), name: "AI Module", description: "AI content generation and intelligence", version: "1.2.0", category: "ai", dependencies: ["core"], config: {}, status: "activated", healthStatus: "healthy", priority: 5, hasUI: true, hasAPI: true, hasWorker: true, activatedAt: now - 120 * 86400000, createdAt: now - 140 * 86400000 },
    { id: uid("mod"), name: "SEO Module", description: "SEO optimization, sitemaps, structured data", version: "1.1.0", category: "seo", dependencies: ["core", "commerce"], config: {}, status: "activated", healthStatus: "healthy", priority: 6, hasUI: true, hasAPI: false, hasWorker: true, activatedAt: now - 100 * 86400000, createdAt: now - 120 * 86400000 },
    { id: uid("mod"), name: "Integration Module", description: "Third-party integrations and connectors", version: "1.0.0", category: "integration", dependencies: ["core", "webhooks"], config: {}, status: "activated", healthStatus: "healthy", priority: 7, hasUI: true, hasAPI: true, hasWorker: true, activatedAt: now - 60 * 86400000, createdAt: now - 80 * 86400000 },
    { id: uid("mod"), name: "Content Module", description: "CMS and editorial content", version: "1.0.0", category: "content", dependencies: ["core"], config: {}, status: "activated", healthStatus: "healthy", priority: 8, hasUI: true, hasAPI: true, hasWorker: false, activatedAt: now - 90 * 86400000, createdAt: now - 100 * 86400000 },
    { id: uid("mod"), name: "Marketing Module", description: "Campaigns, automation, email marketing", version: "1.0.0", category: "marketing", dependencies: ["core", "commerce"], config: {}, status: "activated", healthStatus: "healthy", priority: 9, hasUI: true, hasAPI: true, hasWorker: true, activatedAt: now - 45 * 86400000, createdAt: now - 60 * 86400000 },
    { id: uid("mod"), name: "Developer Module", description: "Developer tools and SDKs", version: "1.0.0", category: "developer", dependencies: ["core"], config: {}, status: "activated", healthStatus: "healthy", priority: 10, hasUI: true, hasAPI: true, hasWorker: false, activatedAt: now - 30 * 86400000, createdAt: now - 40 * 86400000 },
    { id: uid("mod"), name: "Legacy Sync Module", description: "Legacy system synchronization", version: "0.5.0", category: "integration", dependencies: ["core"], config: {}, status: "deactivated", healthStatus: "degraded", priority: 99, hasUI: false, hasAPI: true, hasWorker: true, deactivatedAt: now - 10 * 86400000, createdAt: now - 180 * 86400000 },
    { id: uid("mod"), name: "Beta AI Search Module", description: "AI-powered semantic search (experimental)", version: "0.9.0", category: "ai", dependencies: ["core", "search"], config: {}, status: "available", healthStatus: "degraded", priority: 50, hasUI: true, hasAPI: true, hasWorker: true, createdAt: now - 14 * 86400000 },
  ];

  /* ---- SDK Packages ---- */
  store.sdkPackages = [
    { id: uid("sdk"), name: "ALAYA JavaScript SDK", description: "Full platform API access for browser and Node.js", language: "JavaScript", version: "2.0.0", installCommand: "npm install @alaya/sdk-js", packageName: "@alaya/sdk-js", status: "stable", documentation: "https://docs.alayainsider.com/sdk/js", repository: "github.com/alaya/sdk-js", license: "MIT", packageSize: "42KB", downloads: 15200, dependencies: [], features: ["REST API", "WebSocket", "Auth", "Rate limiting"], generatedAt: now - 120 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("sdk"), name: "ALAYA TypeScript SDK", description: "Type-safe SDK with full type definitions", language: "TypeScript", version: "2.0.0", installCommand: "npm install @alaya/sdk-ts", packageName: "@alaya/sdk-ts", status: "stable", documentation: "https://docs.alayainsider.com/sdk/ts", repository: "github.com/alaya/sdk-ts", license: "MIT", packageSize: "48KB", downloads: 8900, dependencies: [], features: ["Full types", "REST API", "GraphQL", "WebSocket"], generatedAt: now - 120 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("sdk"), name: "ALAYA Python SDK", description: "Python SDK for data operations and automation", language: "Python", version: "1.0.0", installCommand: "pip install alaya-sdk", packageName: "alaya-sdk", status: "stable", documentation: "https://docs.alayainsider.com/sdk/python", repository: "github.com/alaya/sdk-python", license: "MIT", packageSize: "35KB", downloads: 4200, dependencies: [], features: ["REST API", "Data import/export", "Bulk operations"], generatedAt: now - 90 * 86400000, updatedAt: now - 14 * 86400000 },
    { id: uid("sdk"), name: "ALAYA PHP SDK", description: "PHP SDK for backend integrations", language: "PHP", version: "0.9.0", installCommand: "composer require alaya/sdk-php", packageName: "alaya/sdk-php", status: "beta", documentation: "https://docs.alayainsider.com/sdk/php", repository: "github.com/alaya/sdk-php", license: "MIT", packageSize: "28KB", downloads: 1200, dependencies: [], features: ["REST API", "Webhook verification"], generatedAt: now - 60 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("sdk"), name: "ALAYA Ruby SDK", description: "Ruby SDK for automation and scripting", language: "Ruby", version: "0.5.0", installCommand: "gem install alaya-sdk", packageName: "alaya-sdk", status: "alpha", documentation: "https://docs.alayainsider.com/sdk/ruby", repository: "github.com/alaya/sdk-ruby", license: "MIT", packageSize: "22KB", downloads: 340, dependencies: [], features: ["REST API"], generatedAt: now - 30 * 86400000, updatedAt: now - 3 * 86400000 },
    { id: uid("sdk"), name: "ALAYA Go SDK", description: "Go SDK for high-performance integrations", language: "Go", version: "0.4.0", installCommand: "go get github.com/alaya/sdk-go", packageName: "github.com/alaya/sdk-go", status: "alpha", documentation: "https://docs.alayainsider.com/sdk/go", repository: "github.com/alaya/sdk-go", license: "Apache-2.0", packageSize: "18KB", downloads: 180, dependencies: [], features: ["REST API", "High throughput"], generatedAt: now - 14 * 86400000, updatedAt: now - 2 * 86400000 },
  ];

  /* ---- CLI Commands ---- */
  store.cliCommands = [
    { id: uid("cli"), name: "login", description: "Authenticate with the platform", usage: "alaya login [--api-key <key>]", category: "auth", subcommands: [], flags: [{ name: "api-key", alias: "k", description: "API key for headless auth", required: false }], examples: ["alaya login", "alaya login --api-key sk_xxx"], outputHelp: "Authenticates and stores session token." },
    { id: uid("cli"), name: "deploy", description: "Deploy code or configuration", usage: "alaya deploy [path] [--env <env>]", category: "deploy", subcommands: [], flags: [{ name: "env", alias: "e", description: "Target environment", required: false }, { name: "dry-run", alias: "d", description: "Preview without deploying", required: false }], examples: ["alaya deploy ./dist --env production", "alaya deploy --dry-run"], outputHelp: "Deploys assets to the specified environment." },
    { id: uid("cli"), name: "generate", description: "Generate code from templates", usage: "alaya generate <type> [name]", category: "generate", subcommands: ["module", "component", "api", "crud", "migration"], flags: [{ name: "type", alias: "t", description: "Generation type", required: true }], examples: ["alaya generate module analytics", "alaya generate crud product --fields name:string,price:number"], outputHelp: "Scaffolds code using built-in templates." },
    { id: uid("cli"), name: "plugin", description: "Manage CLI plugins", usage: "alaya plugin <command> [name]", category: "plugin", subcommands: ["install", "remove", "list", "update"], flags: [], examples: ["alaya plugin list", "alaya plugin install @alaya/plugin-deploy"], outputHelp: "Manages CLI plugin extensions." },
    { id: uid("cli"), name: "diagnose", description: "Run system diagnostics", usage: "alaya diagnose [component]", category: "diagnose", subcommands: [], flags: [{ name: "verbose", alias: "v", description: "Verbose output", required: false }], examples: ["alaya diagnose", "alaya diagnose api --verbose"], outputHelp: "Checks system health and configuration." },
    { id: uid("cli"), name: "config", description: "Manage configuration", usage: "alaya config <command> [key] [value]", category: "config", subcommands: ["get", "set", "list", "unset"], flags: [{ name: "global", alias: "g", description: "Global config", required: false }], examples: ["alaya config list", "alaya config set api.url https://api.alayainsider.com"], outputHelp: "Gets or sets configuration values." },
  ];

  /* ---- Code Generators ---- */
  store.codeGenerators = [
    { id: uid("cg"), name: "CRUD Generator", description: "Generates full CRUD with routes, controller, validation", type: "crud", language: "TypeScript", template: "crud", variables: [{ name: "modelName", label: "Model Name", type: "string", required: true }, { name: "fields", label: "Fields (name:type)", type: "string", required: true }, { name: "generateTests", label: "Generate Tests", type: "boolean", required: false, defaultValue: "true" }], output: "src/modules/{modelName}/", version: "1.0.0", author: "ALAYA", tags: ["crud", "api", "fullstack"], createdAt: now - 60 * 86400000 },
    { id: uid("cg"), name: "Module Scaffold", description: "Generates a complete module with all layers", type: "module", language: "TypeScript", template: "module", variables: [{ name: "moduleName", label: "Module Name", type: "string", required: true }, { name: "description", label: "Description", type: "string", required: false }, { name: "includeAPI", label: "Include API endpoints", type: "boolean", required: false, defaultValue: "true" }], output: "src/modules/{moduleName}/", version: "1.0.0", author: "ALAYA", tags: ["module", "scaffold", "architecture"], createdAt: now - 60 * 86400000 },
    { id: uid("cg"), name: "API Generator", description: "Generates REST API endpoints with validation", type: "api", language: "TypeScript", template: "api", variables: [{ name: "endpoint", label: "Endpoint path", type: "string", required: true }, { name: "methods", label: "HTTP Methods", type: "select", required: true, options: ["GET", "POST", "PUT", "DELETE", "CRUD"] }, { name: "authRequired", label: "Auth Required", type: "boolean", required: false, defaultValue: "true" }], output: "src/api/{endpoint}/", version: "1.0.0", author: "ALAYA", tags: ["api", "rest", "endpoint"], createdAt: now - 45 * 86400000 },
    { id: uid("cg"), name: "Migration Generator", description: "Generates database migration files", type: "migration", language: "SQL", template: "migration", variables: [{ name: "description", label: "Migration Description", type: "string", required: true }, { name: "tableName", label: "Table Name", type: "string", required: true }, { name: "action", label: "Action", type: "select", required: true, options: ["create", "alter", "drop", "add_column", "remove_column"] }], output: "src/db/migrations/", version: "1.0.0", author: "ALAYA", tags: ["database", "migration", "schema"], createdAt: now - 45 * 86400000 },
    { id: uid("cg"), name: "Component Generator", description: "Generates React components with stories", type: "component", language: "TypeScript/React", template: "component", variables: [{ name: "componentName", label: "Component Name", type: "string", required: true }, { name: "type", label: "Component Type", type: "select", required: true, options: ["functional", "display", "form", "page", "layout"] }, { name: "includeStyles", label: "Include CSS module", type: "boolean", required: false, defaultValue: "true" }], output: "src/components/{componentName}/", version: "1.0.0", author: "ALAYA", tags: ["react", "component", "frontend"], createdAt: now - 30 * 86400000 },
    { id: uid("cg"), name: "Schema Generator", description: "Generates TypeScript types and validation schemas", type: "schema", language: "TypeScript", template: "schema", variables: [{ name: "schemaName", label: "Schema Name", type: "string", required: true }, { name: "fields", label: "Fields (name:type)", type: "string", required: true }, { name: "generateZod", label: "Generate Zod validation", type: "boolean", required: false, defaultValue: "true" }], output: "src/types/", version: "1.0.0", author: "ALAYA", tags: ["types", "validation", "schema"], createdAt: now - 30 * 86400000 },
  ];

  /* ---- Documentation ---- */
  store.docPages = [
    { id: uid("doc"), title: "Getting Started", description: "Quick start guide for the platform", slug: "getting-started", category: "getting_started", content: "# Getting Started\n\nWelcome to ALAYA INSIDER! This guide will help you get started with the platform.", order: 1, tags: ["quickstart", "guide"], published: true, version: "1.0", author: "system", updatedAt: now - 60 * 86400000, createdAt: now - 60 * 86400000 },
    { id: uid("doc"), title: "API Authentication", description: "How to authenticate with the API", slug: "api-authentication", category: "api_reference", content: "# API Authentication\n\nUse API keys or JWT tokens to authenticate.", order: 2, tags: ["api", "auth"], published: true, version: "1.0", author: "system", updatedAt: now - 50 * 86400000, createdAt: now - 50 * 86400000 },
    { id: uid("doc"), title: "Extension Development Guide", description: "Build and publish extensions", slug: "extension-dev", category: "guides", content: "# Extension Development\n\nLearn how to build, test, and publish extensions.", order: 3, tags: ["extensions", "plugin"], published: true, version: "1.0", author: "system", updatedAt: now - 40 * 86400000, createdAt: now - 40 * 86400000 },
    { id: uid("doc"), title: "CLI Reference", description: "Complete CLI command reference", slug: "cli-reference", category: "cli", content: "# CLI Reference\n\nComplete reference for all CLI commands.", order: 4, tags: ["cli", "reference"], published: true, version: "1.0", author: "system", updatedAt: now - 30 * 86400000, createdAt: now - 30 * 86400000 },
  ];

  /* ---- Release Notes ---- */
  store.releaseNotes = [
    { id: uid("rn"), version: "2.0.0", title: "Enterprise Platform Launch", date: now - 180 * 86400000, type: "major", highlights: ["Enterprise governance", "AI platform", "Multi-language support"], features: ["Governance platform", "AI content generation", "Multi-language CMS", "Advanced analytics"], improvements: ["Performance improvements", "Security hardening"], fixes: ["Fixed XSS in search", "Fixed race condition in checkout"], breakingChanges: ["API v1 deprecation started"], deprecations: ["Old plugin API"], contributors: ["Engineering Team"] },
    { id: uid("rn"), version: "1.5.0", title: "Developer Tools Update", date: now - 90 * 86400000, type: "minor", highlights: ["New CLI", "SDK generation"], features: ["CLI tooling", "SDK generator", "Plugin system"], improvements: ["Better error messages", "Improved logging"], fixes: ["Fixed memory leak in webhook processor"], breakingChanges: [], deprecations: [], contributors: ["Platform Team"] },
    { id: uid("rn"), version: "1.0.0", title: "Initial Release", date: now - 365 * 86400000, type: "major", highlights: ["First public release"], features: ["Core commerce", "Basic CMS", "Payment processing"], improvements: [], fixes: [], breakingChanges: [], deprecations: [], contributors: ["ALAYA Team"] },
  ];

  /* ---- Community Posts ---- */
  store.communityPosts = [
    { id: uid("cp"), title: "How to build a custom extension", content: "Here's a step-by-step guide to building your first extension...", authorId: "dev_1", authorName: "Dev One", category: "guide", tags: ["extensions", "tutorial"], votes: 24, answers: 3, views: 450, pinned: true, resolved: false, createdAt: now - 30 * 86400000, updatedAt: now - 14 * 86400000 },
    { id: uid("cp"), title: "API rate limiting questions", content: "What's the best approach for handling rate limits in production?", authorId: "dev_2", authorName: "Dev Two", category: "question", tags: ["api", "rate-limiting"], votes: 12, answers: 2, views: 280, pinned: false, resolved: true, createdAt: now - 14 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("cp"), title: "Showcase: Custom dashboard widget", content: "I built a custom dashboard widget using the plugin API...", authorId: "community_1", authorName: "Community Member", category: "showcase", tags: ["plugin", "dashboard"], votes: 8, answers: 0, views: 120, pinned: false, resolved: false, createdAt: now - 7 * 86400000, updatedAt: now - 5 * 86400000 },
  ];

  /* ---- Feature Requests ---- */
  store.featureRequests = [
    { id: uid("fr"), title: "WebSocket Support", description: "Add real-time WebSocket API for live updates", category: "api", authorId: "dev_1", authorName: "Dev One", votes: 45, status: "planned", priority: "high", comments: [{ authorName: "PM", content: "On the roadmap for Q3", ts: now - 10 * 86400000 }], createdAt: now - 45 * 86400000, updatedAt: now - 10 * 86400000 },
    { id: uid("fr"), title: "GraphQL Federation", description: "Support for Apollo Federation for microservices", category: "api", authorId: "dev_2", authorName: "Dev Two", votes: 32, status: "under_review", priority: "medium", comments: [], createdAt: now - 30 * 86400000, updatedAt: now - 30 * 86400000 },
    { id: uid("fr"), title: "CI/CD Integration", description: "Native CI/CD pipeline integration with GitHub Actions", category: "devops", authorId: "community_1", authorName: "Community Member", votes: 28, status: "under_review", priority: "medium", comments: [], createdAt: now - 20 * 86400000, updatedAt: now - 20 * 86400000 },
  ];

  /* ---- Developer API Keys ---- */
  store.developerApiKeys = [
    { id: uid("dak"), name: "Production API Key", key: "alaya_prod_xxxxxxxx", scopes: ["products:read", "products:write", "orders:read"], rateLimit: 1000, allowedIps: ["203.0.113.0/24"], lastUsedAt: now - 3600000, usageCount: 45200, active: true, createdBy: "admin", createdAt: now - 120 * 86400000 },
    { id: uid("dak"), name: "Staging API Key", key: "alaya_staging_xxxxxxxx", scopes: ["*"], rateLimit: 5000, allowedIps: [], lastUsedAt: now - 7200000, usageCount: 8900, active: true, createdBy: "admin", createdAt: now - 90 * 86400000 },
    { id: uid("dak"), name: "Analytics Read-Only", key: "alaya_analytics_xxxxxxxx", scopes: ["analytics:read"], rateLimit: 500, allowedIps: [], usageCount: 1200, active: true, createdBy: "admin", createdAt: now - 60 * 86400000 },
  ];

  /* ---- Extension Manifests ---- */
  store.extensionManifests = [
    { id: uid("ext"), name: "Stripe Payments", description: "Card payments via Stripe with 3DS", version: "2.4.1", author: "ALAYA Official", category: "payment", permissions: ["payment:process", "payment:refund"], hooks: ["order.paid", "order.refunded"], dependencies: [], settings: { mode: { label: "Mode", type: "select", default: "live", options: ["live", "test"] } }, verified: true, sandboxed: true, status: "active", healthScore: 98, lastHealthCheck: now - 3600000, errorCount: 0, installedAt: now - 180 * 86400000, updatedAt: now - 7 * 86400000 },
    { id: uid("ext"), name: "Algolia Search", description: "AI-powered instant search", version: "1.3.1", author: "Algolia", category: "search", permissions: ["search:index", "search:query"], hooks: ["product.created", "product.updated", "product.deleted"], dependencies: [], settings: { appId: { label: "Application ID", type: "string", default: "" } }, verified: true, sandboxed: true, status: "disabled", healthScore: 85, errorCount: 2, installedAt: now - 120 * 86400000, updatedAt: now - 14 * 86400000 },
    { id: uid("ext"), name: "OpenAI Provider", description: "GPT-4 for content generation", version: "1.0.0", author: "ALAYA Official", category: "ai", permissions: ["ai:generate", "ai:analyze"], hooks: [], dependencies: [], settings: { model: { label: "Model", type: "select", default: "gpt-4", options: ["gpt-4", "gpt-3.5-turbo"] } }, verified: true, sandboxed: true, status: "active", healthScore: 92, lastHealthCheck: now - 1800000, errorCount: 1, installedAt: now - 90 * 86400000, updatedAt: now - 3 * 86400000 },
  ];

  saveStore(store);
  pushLog("info", "system", "Developer Platform seeded successfully");
}

seedDeveloperPlatformData();

/* ================================================================== */
/*  MODULE 1: DEVELOPER PORTAL & DASHBOARD                             */
/* ================================================================== */

export function getDeveloperDashboard(): DeveloperDashboardData {
  const store = getStore();
  return {
    totalPlugins: store.extensionManifests.length,
    activePlugins: store.extensionManifests.filter((e) => e.status === "active").length,
    totalExtensions: store.extensionManifests.length,
    activeExtensions: store.extensionManifests.filter((e) => e.status === "active").length,
    totalModules: store.platformModules.length,
    activatedModules: store.platformModules.filter((m) => m.status === "activated").length,
    totalSdks: store.sdkPackages.length,
    stableSdks: store.sdkPackages.filter((s) => s.status === "stable").length,
    totalCliCommands: store.cliCommands.length,
    totalGenerators: store.codeGenerators.length,
    totalDocPages: store.docPages.filter((p) => p.published).length,
    totalPlaygroundSessions: store.playgroundSessions.length,
  };
}

export function getDeveloperMetrics(): DeveloperMetric[] {
  const dash = getDeveloperDashboard();
  return [
    { id: uid("dm"), name: "Active Extensions", category: "extensions", currentValue: dash.activeExtensions, previousValue: 2, unit: "", trend: "up", status: "good" },
    { id: uid("dm"), name: "Active Modules", category: "extensions", currentValue: dash.activatedModules, previousValue: 8, unit: "", trend: "stable", status: "good" },
    { id: uid("dm"), name: "Stable SDKs", category: "sdk", currentValue: dash.stableSdks, previousValue: 3, unit: "", trend: "up", status: "good" },
    { id: uid("dm"), name: "CLI Commands", category: "cli", currentValue: dash.totalCliCommands, previousValue: 4, unit: "", trend: "up", status: "good" },
    { id: uid("dm"), name: "Generators", category: "generators", currentValue: dash.totalGenerators, previousValue: 3, unit: "", trend: "up", status: "good" },
    { id: uid("dm"), name: "Doc Pages", category: "docs", currentValue: dash.totalDocPages, previousValue: 2, unit: "", trend: "up", status: "good" },
  ];
}

/* ================================================================== */
/*  MODULE 2: EXTENSION FRAMEWORK                                      */
/* ================================================================== */

export function getExtensionManifests(): ExtensionManifest[] {
  return getStore().extensionManifests;
}

export function getExtension(id: string): ExtensionManifest | undefined {
  return getStore().extensionManifests.find((e) => e.id === id);
}

export function updateExtensionStatus(id: string, status: ExtensionManifest["status"]): ExtensionManifest | null {
  const store = getStore();
  const idx = store.extensionManifests.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  store.extensionManifests[idx] = { ...store.extensionManifests[idx], status, updatedAt: Date.now() };
  saveStore(store);
  writeAuditEntry({ actor: "admin", actorType: "admin", action: "update", entityType: "extension", entityId: id, entityName: store.extensionManifests[idx].name, detail: `Extension status changed to ${status}`, severity: "info", metadata: {} });
  return store.extensionManifests[idx];
}

export function getMarketplaceEntries(): PluginMarketplaceEntry[] {
  return getStore().marketplaceEntries;
}

export function getExtensionDependencyGraph(id: string): ExtensionDependencyGraph | undefined {
  return getStore().dependencyGraphs.find((g) => g.id === id);
}

/* ================================================================== */
/*  MODULE 3: MODULE FRAMEWORK                                         */
/* ================================================================== */

export function getPlatformModules(): PlatformModule[] {
  return getStore().platformModules;
}

export function getModule(id: string): PlatformModule | undefined {
  return getStore().platformModules.find((m) => m.id === id);
}

export function activateModule(id: string): PlatformModule | null {
  const store = getStore();
  const idx = store.platformModules.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.platformModules[idx] = { ...store.platformModules[idx], status: "activated", activatedAt: Date.now(), deactivatedAt: undefined };
  saveStore(store);
  pushLog("info", "system", `Module activated: ${store.platformModules[idx].name}`);
  return store.platformModules[idx];
}

export function deactivateModule(id: string): PlatformModule | null {
  const store = getStore();
  const idx = store.platformModules.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.platformModules[idx] = { ...store.platformModules[idx], status: "deactivated", deactivatedAt: Date.now() };
  saveStore(store);
  pushLog("info", "system", `Module deactivated: ${store.platformModules[idx].name}`);
  return store.platformModules[idx];
}

export function updateModuleConfig(id: string, config: Record<string, any>): PlatformModule | null {
  const store = getStore();
  const idx = store.platformModules.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.platformModules[idx] = { ...store.platformModules[idx], config: { ...store.platformModules[idx].config, ...config } };
  saveStore(store);
  return store.platformModules[idx];
}

/* ================================================================== */
/*  MODULE 4: SDK PLATFORM                                             */
/* ================================================================== */

export function getSdkPackages(): SdkPackage[] {
  return getStore().sdkPackages;
}

export function getSdkPackage(id: string): SdkPackage | undefined {
  return getStore().sdkPackages.find((s) => s.id === id);
}

export function generateSdk(config: SdkGeneratorConfig): SdkPackage {
  const store = getStore();
  const now = Date.now();
  const sdk: SdkPackage = {
    id: uid("sdk"), name: `ALAYA ${config.language} SDK`, description: `Generated ${config.language} SDK`, language: config.language as any,
    version: config.version, installCommand: `npm install ${config.packageName}`, packageName: config.packageName,
    status: "alpha", documentation: "https://docs.alayainsider.com/sdk", repository: "", license: "MIT",
    dependencies: [], features: config.endpoints, generatedAt: now, updatedAt: now,
  };
  store.sdkPackages.push(sdk);
  saveStore(store);
  return sdk;
}

/* ================================================================== */
/*  MODULE 5: CLI TOOLS                                                */
/* ================================================================== */

export function getCliCommands(category?: string): CliCommand[] {
  const all = getStore().cliCommands;
  return category ? all.filter((c) => c.category === category) : all;
}

export function getCliExtensions(): CliExtension[] {
  return getStore().cliExtensions;
}

export function createCliSession(userId: string, scope: string[]): CliSession {
  const store = getStore();
  const session: CliSession = {
    id: uid("clis"), userId, token: `alaya_cli_${Math.random().toString(36).slice(2, 15)}`,
    expiresAt: Date.now() + 86400000, scope, lastUsedAt: Date.now(), createdAt: Date.now(),
  };
  store.cliSessions.push(session);
  saveStore(store);
  return session;
}

/* ================================================================== */
/*  MODULE 6: CODE GENERATORS                                          */
/* ================================================================== */

export function getCodeGenerators(type?: string): CodeGenerator[] {
  const all = getStore().codeGenerators;
  return type ? all.filter((g) => g.type === type) : all;
}

export function getCodeGenerator(id: string): CodeGenerator | undefined {
  return getStore().codeGenerators.find((g) => g.id === id);
}

export function generateCode(generatorId: string, variables: Record<string, string>): GeneratedArtifact | null {
  const generator = getCodeGenerator(generatorId);
  if (!generator) return null;

  const store = getStore();
  const now = Date.now();
  const files: { path: string; content: string; language: string }[] = [
    { path: `generated/${generator.type}/${variables.modelName || variables.moduleName || "output"}.ts`, content: `// Generated by ${generator.name}\n// ${JSON.stringify(variables)}\n\nexport class ${variables.modelName || "Generated"} {\n  // Placeholder - implement business logic here\n}\n`, language: generator.language },
  ];

  const artifact: GeneratedArtifact = {
    id: uid("ga"), generatorId, generatorName: generator.name, type: generator.type,
    files, variables, createdAt: now,
  };
  store.generatedArtifacts.push(artifact);
  saveStore(store);
  writeAuditEntry({ actor: "admin", actorType: "admin", action: "create", entityType: "extension" as any, entityId: artifact.id, entityName: `Generated: ${generator.name}`, detail: `Generated ${generator.type} with ${JSON.stringify(variables)}`, severity: "info", metadata: {} });
  return artifact;
}

/* ================================================================== */
/*  MODULE 7: DEVELOPER PLAYGROUND                                     */
/* ================================================================== */

export function getPlaygroundSessions(type?: string): PlaygroundSession[] {
  const all = getStore().playgroundSessions;
  return type ? all.filter((s) => s.type === type).reverse() : all.reverse();
}

export function createPlaygroundSession(input: Omit<PlaygroundSession, "id" | "createdAt" | "updatedAt">): PlaygroundSession {
  const store = getStore();
  const session: PlaygroundSession = { ...input, id: uid("ps"), createdAt: Date.now(), updatedAt: Date.now() };
  store.playgroundSessions.push(session);
  saveStore(store);
  return session;
}

export function executeApiExplorerRequest(req: Omit<ApiExplorerRequest, "id" | "createdAt" | "response">): ApiExplorerRequest {
  const store = getStore();
  const t0 = performance.now();
  const success = Math.random() > 0.1;
  const request: ApiExplorerRequest = {
    ...req, id: uid("aer"), createdAt: Date.now(),
    response: {
      status: success ? 200 : 500,
      body: success ? JSON.stringify({ success: true, data: { message: "Request executed successfully" } }) : JSON.stringify({ error: "Internal server error" }),
      headers: { "content-type": "application/json" },
      durationMs: Math.round(performance.now() - t0) || Math.floor(50 + Math.random() * 200),
    },
  };
  store.apiExplorerRequests.unshift(request);
  if (store.apiExplorerRequests.length > 100) store.apiExplorerRequests = store.apiExplorerRequests.slice(0, 100);
  saveStore(store);
  return request;
}

export function getApiExplorerRequests(): ApiExplorerRequest[] {
  return getStore().apiExplorerRequests;
}

/* ================================================================== */
/*  MODULE 8: AI DEVELOPER TOOLS                                       */
/* ================================================================== */

export interface AiCodeReviewResult {
  id: string;
  code: string;
  language: string;
  issues: { line: number; severity: "error" | "warning" | "info"; message: string; suggestion: string }[];
  score: number;
  suggestions: string[];
  reviewedAt: number;
}

export function aiReviewCode(code: string, language: string): AiCodeReviewResult {
  const now = Date.now();
  const issues = [
    { line: 1, severity: "info" as const, message: "Consider adding type annotations", suggestion: "Add TypeScript types for better maintainability" },
    { line: 3, severity: "warning" as const, message: "Function is too complex", suggestion: "Break down into smaller functions" },
  ];
  return { id: uid("acr"), code, language, issues, score: 85, suggestions: ["Add error handling", "Use early returns", "Extract constants"], reviewedAt: now };
}

export function aiGenerateDocumentation(_code: string, _language: string, context: string): string {
  return `/**\n * Generated documentation\n * @description ${context}\n * @param {string} input - The input value\n * @returns {Promise<Result>} The processed result\n */`;
}

export function aiSuggestTests(_code: string, _language: string): string[] {
  return [
    "Test successful path with valid input",
    "Test error handling with invalid input",
    "Test edge cases (empty, null, boundary values)",
  ];
}

/* ================================================================== */
/*  MODULE 9: DEVELOPER PRODUCTIVITY                                   */
/* ================================================================== */

export interface DependencyInfo {
  name: string;
  version: string;
  latestVersion?: string;
  outdated: boolean;
  license: string;
  vulnerabilities: number;
  size?: string;
  dependencies: number;
}

export function analyzeDependencies(): DependencyInfo[] {
  return [
    { name: "react", version: "19.0.0", latestVersion: "19.0.0", outdated: false, license: "MIT", vulnerabilities: 0, size: "14KB", dependencies: 3 },
    { name: "lucide-react", version: "0.344.0", latestVersion: "0.400.0", outdated: true, license: "MIT", vulnerabilities: 0, size: "120KB", dependencies: 1 },
    { name: "react-router", version: "7.0.0", latestVersion: "7.0.0", outdated: false, license: "MIT", vulnerabilities: 0, size: "28KB", dependencies: 2 },
    { name: "tailwind-merge", version: "2.2.0", latestVersion: "2.4.0", outdated: true, license: "MIT", vulnerabilities: 0, size: "8KB", dependencies: 0 },
  ];
}

export function calculateComplexityScore(code: string): { score: number; cyclomaticComplexity: number; cognitiveComplexity: number; linesOfCode: number; suggestions: string[] } {
  const lines = code.split("\n").length;
  return {
    score: Math.max(0, 100 - lines * 2),
    cyclomaticComplexity: Math.floor(lines / 5),
    cognitiveComplexity: Math.floor(lines / 8),
    linesOfCode: lines,
    suggestions: lines > 50 ? ["Consider refactoring into smaller modules", "Add unit tests for complex logic"] : ["Code looks clean"],
  };
}

/* ================================================================== */
/*  MODULE 10: DOCUMENTATION PLATFORM                                  */
/* ================================================================== */

export function getDocPages(category?: string): DocPage[] {
  const all = getStore().docPages;
  return category ? all.filter((p) => p.category === category && p.published) : all.filter((p) => p.published);
}

export function searchDocs(query: string): DocSearchResult[] {
  const pages = getStore().docPages.filter((p) => p.published);
  const q = query.toLowerCase();
  return pages
    .filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)))
    .map((p) => ({ pageId: p.id, title: p.title, snippet: p.content.slice(0, 150), category: p.category, relevance: p.title.toLowerCase().includes(q) ? 0.9 : 0.5 }))
    .sort((a, b) => b.relevance - a.relevance);
}

export function getReleaseNotes(): ReleaseNote[] {
  return getStore().releaseNotes;
}

/* ================================================================== */
/*  MODULE 11: COMMUNITY PLATFORM                                      */
/* ================================================================== */

export function getCommunityPosts(category?: string): CommunityPost[] {
  const all = getStore().communityPosts;
  return category ? all.filter((p) => p.category === category) : all;
}

export function getFeatureRequests(): FeatureRequest[] {
  return getStore().featureRequests;
}

export function upvoteFeatureRequest(id: string): FeatureRequest | null {
  const store = getStore();
  const idx = store.featureRequests.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  store.featureRequests[idx].votes++;
  saveStore(store);
  return store.featureRequests[idx];
}

/* ================================================================== */
/*  MODULE 12: DEVELOPER APIS                                          */
/* ================================================================== */

export function getDeveloperApiKeys(): DeveloperApiKey[] {
  return getStore().developerApiKeys;
}

export function createDeveloperApiKey(input: Omit<DeveloperApiKey, "id" | "key" | "usageCount" | "createdAt">): DeveloperApiKey {
  const store = getStore();
  const key: DeveloperApiKey = {
    ...input, id: uid("dak"), key: `alaya_${input.name.toLowerCase().replace(/\s+/g, "_")}_${Math.random().toString(36).slice(2, 10)}`,
    usageCount: 0, createdAt: Date.now(),
  };
  store.developerApiKeys.push(key);
  saveStore(store);
  writeAuditEntry({ actor: "admin", actorType: "admin", action: "create", entityType: "api_key", entityId: key.id, entityName: key.name, detail: `API key created: ${key.name}`, severity: "info", metadata: {} });
  return key;
}

export function revokeDeveloperApiKey(id: string): boolean {
  const store = getStore();
  const idx = store.developerApiKeys.findIndex((k) => k.id === id);
  if (idx === -1) return false;
  store.developerApiKeys[idx].active = false;
  saveStore(store);
  return true;
}

export function getDeveloperWebhooks(): DeveloperWebhookSubscription[] {
  return getStore().developerWebhooks;
}

export function createDeveloperWebhook(input: Omit<DeveloperWebhookSubscription, "id" | "retryCount" | "createdAt">): DeveloperWebhookSubscription {
  const store = getStore();
  const wh: DeveloperWebhookSubscription = {
    ...input, id: uid("dwh"), retryCount: 0, createdAt: Date.now(),
  };
  store.developerWebhooks.push(wh);
  saveStore(store);
  return wh;
}

export function generateReport(type: "extensions" | "sdk" | "cli" | "generators" | "docs" | "community"): { title: string; type: string; generatedAt: number; data: any } {
  const now = Date.now();
  const store = getStore();
  switch (type) {
    case "extensions":
      return { title: "Extensions Report", type, generatedAt: now, data: { total: store.extensionManifests.length, active: store.extensionManifests.filter((e) => e.status === "active").length, byCategory: store.extensionManifests.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {} as Record<string, number>) } };
    case "sdk":
      return { title: "SDK Report", type, generatedAt: now, data: { total: store.sdkPackages.length, stable: store.sdkPackages.filter((s) => s.status === "stable").length, byLanguage: store.sdkPackages.reduce((acc, s) => { acc[s.language] = (acc[s.language] || 0) + 1; return acc; }, {} as Record<string, number>) } };
    case "cli":
      return { title: "CLI Report", type, generatedAt: now, data: { commands: store.cliCommands.length, byCategory: store.cliCommands.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<string, number>) } };
    case "generators":
      return { title: "Generators Report", type, generatedAt: now, data: { generators: store.codeGenerators.length, byType: store.codeGenerators.reduce((acc, g) => { acc[g.type] = (acc[g.type] || 0) + 1; return acc; }, {} as Record<string, number>), artifacts: store.generatedArtifacts.length } };
    case "docs":
      return { title: "Documentation Report", type, generatedAt: now, data: { pages: store.docPages.filter((p) => p.published).length, byCategory: store.docPages.filter((p) => p.published).reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {} as Record<string, number>) } };
    case "community":
      return { title: "Community Report", type, generatedAt: now, data: { posts: store.communityPosts.length, featureRequests: store.featureRequests.length, totalVotes: store.featureRequests.reduce((s, f) => s + f.votes, 0) } };
  }
}
