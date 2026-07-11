/**
 * ALAYA INSIDER — Enterprise Testing Platform (PART 2.18)
 *
 * 12 modules:
 *   1. QA Dashboard & Metrics
 *   2. Test Suites (unit / integration / e2e)
 *   3. Performance & Load Testing
 *   4. Security Testing
 *   5. Accessibility Testing (WCAG)
 *   6. Visual Regression Testing
 *   7. AI Testing
 *   8. Test Data Platform
 *   9. Release Certification
 *  10. Code Quality & Coverage
 *  11. Continuous Testing & Scheduling
 *  12. Testing Analytics & Reports
 */
import { uid } from "./utils";

// ------------------------------------------------------------------ //
//  TYPES                                                              //
// ------------------------------------------------------------------ //

export interface QaDashboard {
  totalTestSuites: number;
  totalTestCases: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number;
  coveragePercent: number;
  openBugs: number;
  activeIncidents: number;
  lastRunAt: number;
  avgDurationMs: number;
  overallHealth: "healthy" | "degraded" | "critical";
}

export interface QaMetric {
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

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: "unit" | "integration" | "e2e" | "service" | "component" | "api" | "workflow" | "acceptance";
  testCases: TestCase[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  status: "pass" | "fail" | "skipped" | "pending";
  durationMs: number;
  lastRunAt?: number;
  errorMessage?: string;
  trace?: string;
}

export interface PerformanceTest {
  id: string;
  name: string;
  type: "load" | "stress" | "spike" | "scalability" | "concurrency" | "memory" | "cpu" | "database" | "search" | "api";
  target: string;
  status: "idle" | "running" | "completed" | "failed";
  scenario: string;
  durationMs: number;
  concurrency: number;
  requestsTotal: number;
  requestsPerSecond: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  throughputMbps: number;
  memoryMb: number;
  cpuPercent: number;
  passed: boolean;
  thresholdViolations: string[];
  lastRunAt?: number;
  createdAt: number;
}

export interface SecurityTest {
  id: string;
  name: string;
  category: "penetration" | "owasp" | "auth" | "rbac" | "abac" | "jwt" | "session" | "rate_limit" | "input_validation" | "sqli" | "xss" | "csrf" | "ssrf" | "file_upload" | "dependency" | "secret" | "vulnerability";
  target: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "fixed" | "accepted";
  findings: SecurityFinding[];
  lastRunAt?: number;
  createdAt: number;
}

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  cvssScore: number;
  cveId?: string;
  affectedComponent: string;
  remediation: string;
  status: "open" | "in_progress" | "fixed" | "accepted";
  discoveredAt: number;
  fixedAt?: number;
}

export interface AccessibilityTest {
  id: string;
  name: string;
  target: string;
  standard: "wcag21a" | "wcag22aa" | "wcag22aaa";
  violations: AccessibilityViolation[];
  status: "pass" | "fail" | "in_progress";
  score: number;
  lastRunAt?: number;
  createdAt: number;
}

export interface AccessibilityViolation {
  id: string;
  rule: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  element: string;
  wcagCriteria: string;
  helpUrl: string;
}

export interface VisualRegressionTest {
  id: string;
  name: string;
  target: string;
  viewport: string;
  baselineUrl: string;
  currentUrl: string;
  diffPercent: number;
  status: "pass" | "fail" | "baseline_missing";
  lastRunAt?: number;
  createdAt: number;
}

export interface AiTest {
  id: string;
  name: string;
  target: "prompt" | "response" | "hallucination" | "knowledge" | "benchmark" | "agent" | "workflow" | "content" | "seo" | "recommendation" | "analytics";
  status: "pending" | "running" | "passed" | "failed";
  testCases: AiTestCase[];
  score: number;
  lastRunAt?: number;
  createdAt: number;
}

export interface AiTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  score: number;
  latencyMs: number;
  errorMessage?: string;
}

export interface TestDataTemplate {
  id: string;
  name: string;
  description: string;
  type: "synthetic" | "fixture" | "seed" | "mock";
  category: "products" | "customers" | "orders" | "content" | "all";
  recordCount: number;
  schema: Record<string, string>;
  createdAt: number;
}

export interface ReleaseCertification {
  id: string;
  version: string;
  name: string;
  status: "draft" | "in_progress" | "passed" | "failed" | "certified";
  checks: ReleaseCheck[];
  overallScore: number;
  startedAt: number;
  completedAt?: number;
  certifiedBy?: string;
  notes?: string;
  createdAt: number;
}

export interface ReleaseCheck {
  id: string;
  name: string;
  category: "unit" | "integration" | "e2e" | "performance" | "security" | "accessibility" | "visual" | "ai" | "code_quality" | "coverage" | "migration" | "configuration";
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  score: number;
  threshold: number;
  details?: string;
  durationMs: number;
  startedAt?: number;
  completedAt?: number;
}

export interface CodeQualityReport {
  id: string;
  name: string;
  linesOfCode: number;
  complexityScore: number;
  technicalDebtDays: number;
  duplicatePercent: number;
  deadCodeFiles: number;
  unusedDependencies: number;
  lintErrors: number;
  codeSmells: number;
  coveragePercent: number;
  coverageStatement: number;
  coverageBranch: number;
  coverageFunction: number;
  coverageLine: number;
  grade: string;
  generatedAt: number;
}

export interface ContinuousTestSchedule {
  id: string;
  name: string;
  cronExpression: string;
  suites: string[];
  enabled: boolean;
  notifyOnFailure: boolean;
  notifyChannels: string[];
  lastRunAt?: number;
  lastRunStatus?: "passed" | "failed";
  nextRunAt?: number;
  createdAt: number;
}

export interface TestingReport {
  id: string;
  name: string;
  type: "qa" | "executive" | "developer" | "release" | "coverage" | "performance" | "security" | "accessibility";
  period: string;
  summary: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "stable" }[];
  generatedAt: number;
}

// ------------------------------------------------------------------ //
//  SEED DATA                                                          //
// ------------------------------------------------------------------ //

const now = Date.now();

function makeTestCases(prefix: string, count: number, passRatio = 0.75): TestCase[] {
  return Array.from({ length: count }, (_, i) => {
    const passed = Math.random() < passRatio;
    return {
      id: uid(`tc_${prefix}`),
      name: `${prefix} test case ${i + 1}`,
      description: `Validates ${prefix} behavior scenario ${i + 1}`,
      status: passed ? "pass" : Math.random() < 0.3 ? "skipped" : "fail",
      durationMs: Math.round(10 + Math.random() * 200),
      lastRunAt: now - Math.round(Math.random() * 86400000),
      ...(passed ? {} : { errorMessage: `Expected X but got Y at assertion ${i + 1}` }),
    };
  });
}

// ---- Test Suites ---- //
const QA_SUITES: TestSuite[] = [
  { id: uid("suite"), name: "Core Product API", description: "API unit tests for product endpoints", category: "api", testCases: makeTestCases("product-api", 24, 0.88), tags: ["api", "products", "critical"], createdAt: now - 90 * 86400000, updatedAt: now - 2 * 86400000 },
  { id: uid("suite"), name: "Checkout Pipeline", description: "Integration tests for full checkout flow", category: "integration", testCases: makeTestCases("checkout", 18, 0.83), tags: ["commerce", "checkout", "critical"], createdAt: now - 85 * 86400000, updatedAt: now - 1 * 86400000 },
  { id: uid("suite"), name: "Authentication Flows", description: "Auth, session, JWT, OAuth tests", category: "integration", testCases: makeTestCases("auth", 30, 0.93), tags: ["auth", "security"], createdAt: now - 80 * 86400000, updatedAt: now - 3 * 86400000 },
  { id: uid("suite"), name: "Customer Journey E2E", description: "End-to-end customer purchase journey", category: "e2e", testCases: makeTestCases("e2e-customer", 12, 0.75), tags: ["e2e", "customer"], createdAt: now - 75 * 86400000, updatedAt: now - 2 * 86400000 },
  { id: uid("suite"), name: "Admin Panel E2E", description: "Admin CRUD operations and navigation", category: "e2e", testCases: makeTestCases("e2e-admin", 15, 0.80), tags: ["e2e", "admin"], createdAt: now - 70 * 86400000, updatedAt: now - 4 * 86400000 },
  { id: uid("suite"), name: "Service Layer Tests", description: "Business logic unit tests for services", category: "service", testCases: makeTestCases("service", 40, 0.90), tags: ["services", "core"], createdAt: now - 65 * 86400000, updatedAt: now - 1 * 86400000 },
  { id: uid("suite"), name: "UI Component Tests", description: "React component rendering and interaction", category: "component", testCases: makeTestCases("component", 35, 0.86), tags: ["ui", "frontend"], createdAt: now - 60 * 86400000, updatedAt: now - 2 * 86400000 },
  { id: uid("suite"), name: "Workflow Engine Tests", description: "BPM workflow execution and state transitions", category: "workflow", testCases: makeTestCases("workflow", 20, 0.85), tags: ["workflows", "automation"], createdAt: now - 55 * 86400000, updatedAt: now - 3 * 86400000 },
  { id: uid("suite"), name: "Database Integration", description: "Repository and query integration tests", category: "integration", testCases: makeTestCases("db", 22, 0.82), tags: ["database", "integration"], createdAt: now - 50 * 86400000, updatedAt: now - 5 * 86400000 },
  { id: uid("suite"), name: "Notification Service", description: "Email, SMS, push notification delivery", category: "service", testCases: makeTestCases("notification", 14, 0.79), tags: ["notifications", "communication"], createdAt: now - 45 * 86400000, updatedAt: now - 2 * 86400000 },
  { id: uid("suite"), name: "AI Integration Tests", description: "AI agent responses and content generation", category: "integration", testCases: makeTestCases("ai", 16, 0.72), tags: ["ai", "ml"], createdAt: now - 40 * 86400000, updatedAt: now - 1 * 86400000 },
  { id: uid("suite"), name: "Authorization Tests", description: "RBAC, ABAC, permission enforcement", category: "integration", testCases: makeTestCases("authz", 25, 0.94), tags: ["authz", "security"], createdAt: now - 35 * 86400000, updatedAt: now - 3 * 86400000 },
  { id: uid("suite"), name: "Search Engine Tests", description: "Search indexing, querying, relevance", category: "api", testCases: makeTestCases("search", 10, 0.80), tags: ["search", "catalog"], createdAt: now - 30 * 86400000, updatedAt: now - 2 * 86400000 },
  { id: uid("suite"), name: "SEO Validation Tests", description: "Meta tags, structured data, sitemap", category: "api", testCases: makeTestCases("seo", 8, 0.88), tags: ["seo", "content"], createdAt: now - 25 * 86400000, updatedAt: now - 1 * 86400000 },
  { id: uid("suite"), name: "Commerce Engine Tests", description: "Pricing, inventory, shipping, tax", category: "service", testCases: makeTestCases("commerce", 28, 0.85), tags: ["commerce", "core"], createdAt: now - 20 * 86400000, updatedAt: now - 2 * 86400000 },
  { id: uid("suite"), name: "Affiliate Link Validation", description: "Affiliate deep link resolution and tracking", category: "service", testCases: makeTestCases("affiliate", 10, 0.90), tags: ["affiliate", "marketing"], createdAt: now - 15 * 86400000, updatedAt: now - 1 * 86400000 },
  { id: uid("suite"), name: "Supplier Sync Tests", description: "Supplier API integration and inventory sync", category: "integration", testCases: makeTestCases("supplier", 12, 0.78), tags: ["supplier", "integration"], createdAt: now - 10 * 86400000, updatedAt: now - 3 * 86400000 },
  { id: uid("suite"), name: "Infrastructure Tests", description: "Cache, queue, worker, logging validation", category: "service", testCases: makeTestCases("infra", 18, 0.92), tags: ["infrastructure", "devops"], createdAt: now - 8 * 86400000, updatedAt: now - 1 * 86400000 },
];

// ---- Performance Tests ---- //
const PERF_TESTS: PerformanceTest[] = [
  { id: uid("perf"), name: "Product API Load Test", type: "load", target: "/api/v1/products", status: "completed", scenario: "Simulates 500 concurrent users browsing catalog", durationMs: 120000, concurrency: 500, requestsTotal: 15000, requestsPerSecond: 125, p50Ms: 45, p95Ms: 120, p99Ms: 280, errorRate: 0.1, throughputMbps: 45, memoryMb: 256, cpuPercent: 34, passed: true, thresholdViolations: [], lastRunAt: now - 86400000, createdAt: now - 30 * 86400000 },
  { id: uid("perf"), name: "Checkout Stress Test", type: "stress", target: "/api/v1/orders", status: "completed", scenario: "Ramp-up from 10 to 2000 concurrent checkout requests", durationMs: 180000, concurrency: 2000, requestsTotal: 45000, requestsPerSecond: 250, p50Ms: 320, p95Ms: 890, p99Ms: 2100, errorRate: 2.3, throughputMbps: 28, memoryMb: 768, cpuPercent: 82, passed: false, thresholdViolations: ["p99 exceeded 2000ms threshold", "Error rate exceeded 2%"], lastRunAt: now - 2 * 86400000, createdAt: now - 28 * 86400000 },
  { id: uid("perf"), name: "Search Spike Test", type: "spike", target: "/api/v1/products/search", status: "completed", scenario: "Sudden spike from 10 to 1000 concurrent search requests", durationMs: 60000, concurrency: 1000, requestsTotal: 8000, requestsPerSecond: 133, p50Ms: 85, p95Ms: 210, p99Ms: 450, errorRate: 0.5, throughputMbps: 18, memoryMb: 320, cpuPercent: 55, passed: true, thresholdViolations: [], lastRunAt: now - 3 * 86400000, createdAt: now - 25 * 86400000 },
  { id: uid("perf"), name: "Database Query Performance", type: "database", target: "postgresql://alaya/main", status: "completed", scenario: "Complex JOIN queries with 100K product records", durationMs: 30000, concurrency: 100, requestsTotal: 5000, requestsPerSecond: 166, p50Ms: 12, p95Ms: 35, p99Ms: 88, errorRate: 0.0, throughputMbps: 0, memoryMb: 128, cpuPercent: 18, passed: true, thresholdViolations: [], lastRunAt: now - 86400000, createdAt: now - 20 * 86400000 },
  { id: uid("perf"), name: "API Gateway Concurrency", type: "concurrency", target: "/api/v1/gateway", status: "completed", scenario: "100 concurrent requests across 10 different endpoints", durationMs: 45000, concurrency: 100, requestsTotal: 3000, requestsPerSecond: 66, p50Ms: 28, p95Ms: 74, p99Ms: 152, errorRate: 0.0, throughputMbps: 12, memoryMb: 192, cpuPercent: 22, passed: true, thresholdViolations: [], lastRunAt: now - 5 * 86400000, createdAt: now - 18 * 86400000 },
  { id: uid("perf"), name: "Memory Leak Detection", type: "memory", target: "alaya-worker", status: "idle", scenario: "Monitors heap usage over 8-hour period under sustained load", durationMs: 0, concurrency: 0, requestsTotal: 0, requestsPerSecond: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, errorRate: 0, throughputMbps: 0, memoryMb: 0, cpuPercent: 0, passed: false, thresholdViolations: [], lastRunAt: undefined, createdAt: now - 15 * 86400000 },
  { id: uid("perf"), name: "Search Indexing Performance", type: "search", target: "elasticsearch://alaya", status: "completed", scenario: "Index 50K products with full-text search fields", durationMs: 90000, concurrency: 10, requestsTotal: 50000, requestsPerSecond: 555, p50Ms: 4, p95Ms: 12, p99Ms: 28, errorRate: 0.01, throughputMbps: 85, memoryMb: 512, cpuPercent: 45, passed: true, thresholdViolations: [], lastRunAt: now - 86400000, createdAt: now - 12 * 86400000 },
];

// ---- Security Tests ---- //
const SEC_TESTS: SecurityTest[] = [
  { id: uid("sectest"), name: "OWASP Top 10 Scan", category: "owasp", target: "alaya-insider.com", severity: "critical", status: "in_progress", findings: [
    { id: uid("sf"), title: "XSS in Product Search", description: "Reflected XSS via product search parameter", severity: "high", cvssScore: 6.1, cveId: "CVE-2024-0001", affectedComponent: "SearchController", remediation: "Sanitize search input with DOMPurify", status: "open", discoveredAt: now - 14 * 86400000 },
    { id: uid("sf"), title: "SQL Injection Risk in Product Filter", description: "Blind SQL injection in category filter parameter", severity: "critical", cvssScore: 9.3, cveId: "CVE-2024-0002", affectedComponent: "ProductRepository", remediation: "Use parameterized queries", status: "in_progress", discoveredAt: now - 10 * 86400000 },
    { id: uid("sf"), title: "CSRF on Password Change", description: "No CSRF token on password change endpoint", severity: "medium", cvssScore: 4.3, affectedComponent: "AuthController", remediation: "Add CSRF token validation", status: "fixed", discoveredAt: now - 20 * 86400000, fixedAt: now - 5 * 86400000 },
  ], lastRunAt: now - 86400000, createdAt: now - 21 * 86400000 },
  { id: uid("sectest"), name: "Authentication Penetration Test", category: "penetration", target: "auth.alaya-insider.com", severity: "high", status: "open", findings: [
    { id: uid("sf"), title: "JWT Token Hardcoded Secret", description: "JWT signing secret found in source code", severity: "critical", cvssScore: 8.5, affectedComponent: "JWT Service", remediation: "Move secret to environment variable and rotate immediately", status: "open", discoveredAt: now - 7 * 86400000 },
    { id: uid("sf"), title: "Session Timeout Not Enforced", description: "Admin sessions do not expire after inactivity", severity: "high", cvssScore: 7.2, affectedComponent: "SessionManager", remediation: "Implement sliding session expiration (30 min max)", status: "in_progress", discoveredAt: now - 7 * 86400000 },
  ], lastRunAt: now - 86400000, createdAt: now - 14 * 86400000 },
  { id: uid("sectest"), name: "Dependency Vulnerability Scan", category: "dependency", target: "package.json", severity: "high", status: "in_progress", findings: [
    { id: uid("sf"), title: "lodash Prototype Pollution", description: "lodash < 4.17.21 vulnerable to prototype pollution", severity: "high", cvssScore: 7.4, cveId: "CVE-2023-26116", affectedComponent: "lodash", remediation: "Upgrade to lodash >= 4.17.21", status: "in_progress", discoveredAt: now - 3 * 86400000 },
    { id: uid("sf"), title: "axios SSRF Vulnerability", description: "axios < 1.6.0 allows server-side request forgery", severity: "medium", cvssScore: 5.8, cveId: "CVE-2024-0003", affectedComponent: "axios", remediation: "Upgrade to axios >= 1.6.0", status: "open", discoveredAt: now - 2 * 86400000 },
    { id: uid("sf"), title: "express.js Path Traversal", description: "express < 4.18.2 vulnerable to path traversal", severity: "high", cvssScore: 7.1, cveId: "CVE-2023-26115", affectedComponent: "express", remediation: "Upgrade to express >= 4.18.2", status: "fixed", discoveredAt: now - 30 * 86400000, fixedAt: now - 15 * 86400000 },
  ], lastRunAt: now - 86400000, createdAt: now - 10 * 86400000 },
  { id: uid("sectest"), name: "Secret Detection Scan", category: "secret", target: "repository", severity: "medium", status: "fixed", findings: [
    { id: uid("sf"), title: "AWS Access Key in Config", description: "AWS access key ID found in config file", severity: "critical", cvssScore: 9.0, affectedComponent: "config/aws.json", remediation: "Rotate key immediately and remove from config", status: "fixed", discoveredAt: now - 60 * 86400000, fixedAt: now - 50 * 86400000 },
  ], lastRunAt: now - 86400000, createdAt: now - 60 * 86400000 },
  { id: uid("sectest"), name: "API Rate Limit Test", category: "rate_limit", target: "/api/v1/", severity: "medium", status: "open", findings: [
    { id: uid("sf"), title: "Missing Rate Limit on Login", description: "No rate limiting on POST /api/v1/auth/login", severity: "high", cvssScore: 6.8, affectedComponent: "AuthController", remediation: "Add rate limiting: 5 attempts per minute per IP", status: "in_progress", discoveredAt: now - 5 * 86400000 },
  ], lastRunAt: now - 86400000, createdAt: now - 7 * 86400000 },
];

// ---- Accessibility Tests ---- //
const A11Y_TESTS: AccessibilityTest[] = [
  { id: uid("a11y"), name: "Homepage WCAG Audit", target: "/", standard: "wcag22aa", violations: [
    { id: uid("a11yv"), rule: "color-contrast", impact: "serious", description: "Insufficient color contrast on announcement bar", element: ".announcement-bar a", wcagCriteria: "1.4.3", helpUrl: "https://dequeuniversity.com/rules/axe/4.8/color-contrast" },
    { id: uid("a11yv"), rule: "heading-order", impact: "moderate", description: "Heading levels skip from h1 to h3", element: "main h3", wcagCriteria: "1.3.1", helpUrl: "https://dequeuniversity.com/rules/axe/4.8/heading-order" },
  ], status: "fail", score: 72, lastRunAt: now - 86400000, createdAt: now - 30 * 86400000 },
  { id: uid("a11y"), name: "Product Detail Page Audit", target: "/product/*", standard: "wcag22aa", violations: [
    { id: uid("a11yv"), rule: "image-alt", impact: "critical", description: "Product gallery images missing alt text", element: ".product-gallery img", wcagCriteria: "1.1.1", helpUrl: "https://dequeuniversity.com/rules/axe/4.8/image-alt" },
    { id: uid("a11yv"), rule: "button-name", impact: "serious", description: "Add to cart button has no accessible name", element: ".add-to-cart", wcagCriteria: "4.1.2", helpUrl: "https://dequeuniversity.com/rules/axe/4.8/button-name" },
  ], status: "fail", score: 58, lastRunAt: now - 2 * 86400000, createdAt: now - 28 * 86400000 },
  { id: uid("a11y"), name: "Checkout Flow Audit", target: "/checkout", standard: "wcag22aa", violations: [], status: "pass", score: 95, lastRunAt: now - 3 * 86400000, createdAt: now - 25 * 86400000 },
  { id: uid("a11y"), name: "Admin Panel Audit", target: "/admin/*", standard: "wcag21a", violations: [
    { id: uid("a11yv"), rule: "keyboard", impact: "serious", description: "Dashboard widgets not keyboard accessible", element: ".dashboard-card button", wcagCriteria: "2.1.1", helpUrl: "https://dequeuniversity.com/rules/axe/4.8/keyboard" },
  ], status: "fail", score: 68, lastRunAt: now - 86400000, createdAt: now - 20 * 86400000 },
];

// ---- Visual Regression Tests ---- //
const VISUAL_TESTS: VisualRegressionTest[] = [
  { id: uid("visual"), name: "Homepage Comparison", target: "/", viewport: "1920x1080", baselineUrl: "/screenshots/baseline/homepage.png", currentUrl: "/screenshots/current/homepage.png", diffPercent: 0.3, status: "pass", lastRunAt: now - 86400000, createdAt: now - 30 * 86400000 },
  { id: uid("visual"), name: "Product Detail Layout", target: "/product/*", viewport: "1920x1080", baselineUrl: "/screenshots/baseline/product.png", currentUrl: "/screenshots/current/product.png", diffPercent: 2.1, status: "fail", lastRunAt: now - 86400000, createdAt: now - 28 * 86400000 },
  { id: uid("visual"), name: "Mobile Checkout", target: "/checkout", viewport: "375x667", baselineUrl: "/screenshots/baseline/checkout-mobile.png", currentUrl: "/screenshots/current/checkout-mobile.png", diffPercent: 0.0, status: "pass", lastRunAt: now - 2 * 86400000, createdAt: now - 25 * 86400000 },
  { id: uid("visual"), name: "Dark Mode Homepage", target: "/", viewport: "1920x1080", baselineUrl: "/screenshots/baseline/homepage-dark.png", currentUrl: "/screenshots/current/homepage-dark.png", diffPercent: 5.8, status: "fail", lastRunAt: now - 3 * 86400000, createdAt: now - 20 * 86400000 },
];

// ---- AI Tests ---- //
const AI_TESTS: AiTest[] = [
  { id: uid("aitest"), name: "Content Generation Quality", target: "content", status: "passed", testCases: [
    { id: uid("aitc"), input: "Generate product description for silk dress", expectedOutput: "Luxurious silk dress suitable for evening wear", actualOutput: "Elegant silk dress crafted for special occasions", passed: true, score: 0.88, latencyMs: 1200 },
    { id: uid("aitc"), input: "Generate SEO meta for leather bag", expectedOutput: "Premium leather bag for everyday luxury", actualOutput: "High-end leather bag for daily sophistication", passed: true, score: 0.92, latencyMs: 980 },
  ], score: 90, lastRunAt: now - 86400000, createdAt: now - 30 * 86400000 },
  { id: uid("aitest"), name: "Hallucination Detection", target: "hallucination", status: "passed", testCases: [
    { id: uid("aitc"), input: "What is the return policy?", expectedOutput: "30 day return policy for unused items", actualOutput: "30 day return policy for items in original condition", passed: true, score: 0.95, latencyMs: 800 },
    { id: uid("aitc"), input: "Tell me about our founder", expectedOutput: "Founded by a fashion entrepreneur in 2022", actualOutput: "Our founder started the company in 2022 after a career in luxury fashion", passed: true, score: 0.90, latencyMs: 1100 },
  ], score: 93, lastRunAt: now - 2 * 86400000, createdAt: now - 28 * 86400000 },
  { id: uid("aitest"), name: "Recommendation Accuracy", target: "recommendation", status: "failed", testCases: [
    { id: uid("aitc"), input: "User viewed leather handbags", expectedOutput: "Related accessories and matching items", actualOutput: "Unrelated electronics and home goods", passed: false, score: 0.25, latencyMs: 1500, errorMessage: "Recommendations are off-topic" },
  ], score: 25, lastRunAt: now - 3 * 86400000, createdAt: now - 25 * 86400000 },
  { id: uid("aitest"), name: "Agent Workflow Test", target: "agent", status: "pending", testCases: [
    { id: uid("aitc"), input: "Process order cancellation workflow", expectedOutput: "Cancellation initiated, refund processed, notification sent", actualOutput: "", passed: false, score: 0, latencyMs: 0 },
  ], score: 0, lastRunAt: undefined, createdAt: now - 20 * 86400000 },
];

// ---- Test Data Templates ---- //
const TEST_DATA_TEMPLATES: TestDataTemplate[] = [
  { id: uid("tdt"), name: "Synthetic Product Catalog", description: "1000 realistic products for testing", type: "synthetic", category: "products", recordCount: 1000, schema: { name: "string", sku: "string", price: "number", category: "string", brand: "string", inStock: "boolean" }, createdAt: now - 60 * 86400000 },
  { id: uid("tdt"), name: "Customer Fixtures", description: "50 customer accounts with order histories", type: "fixture", category: "customers", recordCount: 50, schema: { email: "string", name: "string", address: "object", orders: "array" }, createdAt: now - 55 * 86400000 },
  { id: uid("tdt"), name: "Order Seed Data", description: "200 orders with various status and payment states", type: "seed", category: "orders", recordCount: 200, schema: { orderId: "string", customerId: "string", items: "array", total: "number", status: "string" }, createdAt: now - 50 * 86400000 },
  { id: uid("tdt"), name: "Mock API Responses", description: "Mock data for all external API integrations", type: "mock", category: "all", recordCount: 500, schema: { endpoint: "string", method: "string", response: "object", statusCode: "number" }, createdAt: now - 45 * 86400000 },
  { id: uid("tdt"), name: "Content Fixtures", description: "100 articles, pages, and media entries", type: "fixture", category: "content", recordCount: 100, schema: { title: "string", slug: "string", body: "string", author: "string", published: "boolean" }, createdAt: now - 40 * 86400000 },
];

// ---- Release Certifications ---- //
const RELEASES: ReleaseCertification[] = [
  { id: uid("release"), version: "2.4.0", name: "Spring Release 2026", status: "certified", checks: [
    { id: uid("rc"), name: "Unit Tests", category: "unit", status: "passed", score: 98, threshold: 90, details: "245/250 tests passed", durationMs: 45000, startedAt: now - 7 * 86400000, completedAt: now - 7 * 86400000 + 45000 },
    { id: uid("rc"), name: "Integration Tests", category: "integration", status: "passed", score: 92, threshold: 85, details: "110/120 tests passed", durationMs: 120000, startedAt: now - 7 * 86400000, completedAt: now - 7 * 86400000 + 120000 },
    { id: uid("rc"), name: "E2E Tests", category: "e2e", status: "passed", score: 88, threshold: 80, details: "22/25 tests passed", durationMs: 180000, startedAt: now - 7 * 86400000, completedAt: now - 7 * 86400000 + 180000 },
    { id: uid("rc"), name: "Load Test", category: "performance", status: "passed", score: 95, threshold: 85, details: "All thresholds met", durationMs: 120000, startedAt: now - 6 * 86400000, completedAt: now - 6 * 86400000 + 120000 },
    { id: uid("rc"), name: "Security Scan", category: "security", status: "passed", score: 90, threshold: 80, details: "3 high findings (accepted exceptions)", durationMs: 60000, startedAt: now - 6 * 86400000, completedAt: now - 6 * 86400000 + 60000 },
    { id: uid("rc"), name: "WCAG Audit", category: "accessibility", status: "passed", score: 88, threshold: 75, details: "Score 88%", durationMs: 30000, startedAt: now - 6 * 86400000, completedAt: now - 6 * 86400000 + 30000 },
    { id: uid("rc"), name: "Visual Regression", category: "visual", status: "passed", score: 92, threshold: 85, details: "Diff < 1% on all pages", durationMs: 45000, startedAt: now - 5 * 86400000, completedAt: now - 5 * 86400000 + 45000 },
    { id: uid("rc"), name: "Code Quality Gate", category: "code_quality", status: "passed", score: 94, threshold: 85, details: "Complexity, duplication, lint all within thresholds", durationMs: 20000, startedAt: now - 5 * 86400000, completedAt: now - 5 * 86400000 + 20000 },
    { id: uid("rc"), name: "Code Coverage Gate", category: "coverage", status: "passed", score: 87, threshold: 80, details: "87% line coverage", durationMs: 15000, startedAt: now - 5 * 86400000, completedAt: now - 5 * 86400000 + 15000 },
  ], overallScore: 92, startedAt: now - 7 * 86400000, completedAt: now - 5 * 86400000, certifiedBy: "qa_lead", notes: "All gates passed. Ready for production.", createdAt: now - 14 * 86400000 },
  { id: uid("release"), version: "2.3.1", name: "Hotfix Security Patch", status: "failed", checks: [
    { id: uid("rc"), name: "Unit Tests", category: "unit", status: "passed", score: 100, threshold: 90, details: "All tests passed", durationMs: 30000, startedAt: now - 14 * 86400000, completedAt: now - 14 * 86400000 + 30000 },
    { id: uid("rc"), name: "Security Scan", category: "security", status: "failed", score: 55, threshold: 80, details: "2 critical vulnerabilities found in dependency scan", durationMs: 45000, startedAt: now - 14 * 86400000, completedAt: now - 14 * 86400000 + 45000 },
    { id: uid("rc"), name: "E2E Sanity", category: "e2e", status: "skipped", score: 0, threshold: 80, details: "Blocked by security gate failure", durationMs: 0 },
  ], overallScore: 52, startedAt: now - 14 * 86400000, completedAt: now - 14 * 86400000 + 45000, notes: "Security gate failed — critical dependencies need patching.", createdAt: now - 15 * 86400000 },
  { id: uid("release"), version: "2.3.0", name: "Winter Release 2025", status: "certified", checks: [
    { id: uid("rc"), name: "Unit Tests", category: "unit", status: "passed", score: 97, threshold: 90, details: "238/245 tests passed", durationMs: 42000, startedAt: now - 30 * 86400000, completedAt: now - 30 * 86400000 + 42000 },
    { id: uid("rc"), name: "Integration Tests", category: "integration", status: "passed", score: 90, threshold: 85, details: "108/120 passed", durationMs: 115000, startedAt: now - 30 * 86400000, completedAt: now - 30 * 86400000 + 115000 },
    { id: uid("rc"), name: "Load Test", category: "performance", status: "passed", score: 93, threshold: 85, details: "All thresholds met", durationMs: 110000, startedAt: now - 29 * 86400000, completedAt: now - 29 * 86400000 + 110000 },
    { id: uid("rc"), name: "Security Scan", category: "security", status: "passed", score: 88, threshold: 80, details: "1 medium finding (accepted)", durationMs: 55000, startedAt: now - 29 * 86400000, completedAt: now - 29 * 86400000 + 55000 },
    { id: uid("rc"), name: "Code Quality Gate", category: "code_quality", status: "passed", score: 91, threshold: 85, details: "Within thresholds", durationMs: 18000 },
    { id: uid("rc"), name: "Coverage Gate", category: "coverage", status: "passed", score: 85, threshold: 80, details: "85% line coverage", durationMs: 12000 },
  ], overallScore: 91, startedAt: now - 30 * 86400000, completedAt: now - 29 * 86400000, certifiedBy: "qa_lead", notes: "All gates passed.", createdAt: now - 35 * 86400000 },
  { id: uid("release"), version: "2.5.0", name: "Summer Release 2026", status: "in_progress", checks: [
    { id: uid("rc"), name: "Unit Tests", category: "unit", status: "running", score: 0, threshold: 90, details: "Running...", durationMs: 25000, startedAt: now - 3600000 },
    { id: uid("rc"), name: "Integration Tests", category: "integration", status: "pending", score: 0, threshold: 85, details: "", durationMs: 0 },
    { id: uid("rc"), name: "E2E Tests", category: "e2e", status: "pending", score: 0, threshold: 80, details: "", durationMs: 0 },
  ], overallScore: 0, startedAt: now - 3600000, createdAt: now - 2 * 86400000 },
];

// ---- Code Quality Reports ---- //
const QUALITY_REPORTS: CodeQualityReport[] = [
  { id: uid("cq"), name: "Full Project Analysis", linesOfCode: 45230, complexityScore: 124, technicalDebtDays: 18, duplicatePercent: 3.2, deadCodeFiles: 2, unusedDependencies: 5, lintErrors: 23, codeSmells: 47, coveragePercent: 87, coverageStatement: 89, coverageBranch: 78, coverageFunction: 92, coverageLine: 87, grade: "A", generatedAt: now - 86400000 },
  { id: uid("cq"), name: "Core Library Analysis", linesOfCode: 18200, complexityScore: 48, technicalDebtDays: 5, duplicatePercent: 1.1, deadCodeFiles: 0, unusedDependencies: 1, lintErrors: 4, codeSmells: 12, coveragePercent: 94, coverageStatement: 95, coverageBranch: 88, coverageFunction: 96, coverageLine: 94, grade: "A+", generatedAt: now - 2 * 86400000 },
  { id: uid("cq"), name: "Admin UI Analysis", linesOfCode: 15800, complexityScore: 52, technicalDebtDays: 8, duplicatePercent: 4.5, deadCodeFiles: 1, unusedDependencies: 3, lintErrors: 15, codeSmells: 28, coveragePercent: 72, coverageStatement: 74, coverageBranch: 62, coverageFunction: 78, coverageLine: 72, grade: "B", generatedAt: now - 3 * 86400000 },
];

// ---- Continuous Test Schedules ---- //
const TEST_SCHEDULES: ContinuousTestSchedule[] = [
  { id: uid("cts"), name: "Nightly Full Suite", cronExpression: "0 2 * * *", suites: [QA_SUITES[0].id, QA_SUITES[1].id, QA_SUITES[2].id, QA_SUITES[3].id, QA_SUITES[5].id], enabled: true, notifyOnFailure: true, notifyChannels: ["slack", "email"], lastRunAt: now - 86400000, lastRunStatus: "passed", nextRunAt: now + 14 * 3600000, createdAt: now - 60 * 86400000 },
  { id: uid("cts"), name: "Hourly Smoke Tests", cronExpression: "0 * * * *", suites: [QA_SUITES[0].id, QA_SUITES[1].id, QA_SUITES[2].id], enabled: true, notifyOnFailure: true, notifyChannels: ["slack"], lastRunAt: now - 3600000, lastRunStatus: "passed", nextRunAt: now + 3000000, createdAt: now - 45 * 86400000 },
  { id: uid("cts"), name: "Weekly Security Scan", cronExpression: "0 3 * * 0", suites: [], enabled: true, notifyOnFailure: true, notifyChannels: ["slack", "email", "pagerduty"], lastRunAt: now - 3 * 86400000, lastRunStatus: "passed", nextRunAt: now + 4 * 86400000, createdAt: now - 90 * 86400000 },
  { id: uid("cts"), name: "Weekly Performance Benchmark", cronExpression: "0 4 * * 1", suites: [], enabled: true, notifyOnFailure: false, notifyChannels: ["email"], lastRunAt: now - 6 * 86400000, lastRunStatus: "failed", nextRunAt: now + 1 * 86400000, createdAt: now - 60 * 86400000 },
  { id: uid("cts"), name: "Pre-Release Certification", cronExpression: "0 0 * * *", suites: QA_SUITES.map((s) => s.id), enabled: false, notifyOnFailure: true, notifyChannels: ["slack", "email"], lastRunAt: now - 14 * 86400000, lastRunStatus: "passed", nextRunAt: undefined, createdAt: now - 30 * 86400000 },
];

// ------------------------------------------------------------------ //
//  STORE                                                               //
// ------------------------------------------------------------------ //

interface TestingStore {
  dashboard: QaDashboard;
  suites: TestSuite[];
  perfTests: PerformanceTest[];
  secTests: SecurityTest[];
  a11yTests: AccessibilityTest[];
  visualTests: VisualRegressionTest[];
  aiTests: AiTest[];
  testDataTemplates: TestDataTemplate[];
  releases: ReleaseCertification[];
  qualityReports: CodeQualityReport[];
  schedules: ContinuousTestSchedule[];
  reports: TestingReport[];
}

let store: TestingStore;

function initStore(): TestingStore {
  return {
    dashboard: {
      totalTestSuites: QA_SUITES.length,
      totalTestCases: QA_SUITES.reduce((s, suite) => s + suite.testCases.length, 0),
      passedTests: QA_SUITES.reduce((s, suite) => s + suite.testCases.filter((tc) => tc.status === "pass").length, 0),
      failedTests: QA_SUITES.reduce((s, suite) => s + suite.testCases.filter((tc) => tc.status === "fail").length, 0),
      skippedTests: QA_SUITES.reduce((s, suite) => s + suite.testCases.filter((tc) => tc.status === "skipped").length, 0),
      passRate: 85.2,
      coveragePercent: 87,
      openBugs: 12,
      activeIncidents: 3,
      lastRunAt: now - 3600000,
      avgDurationMs: 34000,
      overallHealth: "degraded",
    },
    suites: [...QA_SUITES],
    perfTests: [...PERF_TESTS],
    secTests: [...SEC_TESTS],
    a11yTests: [...A11Y_TESTS],
    visualTests: [...VISUAL_TESTS],
    aiTests: [...AI_TESTS],
    testDataTemplates: [...TEST_DATA_TEMPLATES],
    releases: [...RELEASES],
    qualityReports: [...QUALITY_REPORTS],
    schedules: [...TEST_SCHEDULES],
    reports: [
      { id: uid("tr"), name: "Weekly QA Summary", type: "qa", period: "Last 7 days", summary: "Pass rate stable at 85.2%. 3 new security findings open.", metrics: [{ label: "Pass Rate", value: "85.2%", trend: "stable" }, { label: "Tests Run", value: "12,450", trend: "up" }, { label: "Bugs Found", value: "5", trend: "down" }], generatedAt: now - 86400000 },
      { id: uid("tr"), name: "Executive Quality Report", type: "executive", period: "Q2 2026", summary: "Overall quality score 91/100. Release certification pass rate 100%.", metrics: [{ label: "Quality Score", value: "91/100", trend: "up" }, { label: "Certified Releases", value: "3/3", trend: "stable" }, { label: "Open Findings", value: "18", trend: "down" }], generatedAt: now - 2 * 86400000 },
      { id: uid("tr"), name: "Performance Benchmark Report", type: "performance", period: "Last 30 days", summary: "P95 latency improved by 12% across core APIs.", metrics: [{ label: "Avg P95", value: "210ms", trend: "down" }, { label: "Error Rate", value: "0.8%", trend: "down" }, { label: "Throughput", value: "185 rps", trend: "up" }], generatedAt: now - 3 * 86400000 },
      { id: uid("tr"), name: "Security Scan Report", type: "security", period: "Last 30 days", summary: "14 findings: 2 critical, 5 high, 4 medium, 3 low. 8 resolved.", metrics: [{ label: "Critical", value: "2", trend: "down" }, { label: "High", value: "5", trend: "stable" }, { label: "Resolved", value: "8", trend: "up" }], generatedAt: now - 4 * 86400000 },
      { id: uid("tr"), name: "Code Coverage Report", type: "coverage", period: "Last 30 days", summary: "Overall coverage: 87% line, 78% branch. Admin UI coverage below target.", metrics: [{ label: "Line Coverage", value: "87%", trend: "up" }, { label: "Branch Coverage", value: "78%", trend: "stable" }, { label: "Files < 80%", value: "14", trend: "down" }], generatedAt: now - 5 * 86400000 },
    ],
  };
}

function getStore(): TestingStore {
  if (!store) store = initStore();
  return store;
}

// ------------------------------------------------------------------ //
//  MODULE 1 — QA Dashboard                                            //
// ------------------------------------------------------------------ //

export function getQaDashboard(): QaDashboard {
  return { ...getStore().dashboard };
}

export function getQaMetrics(): QaMetric[] {
  const d = getStore().dashboard;
  return [
    { id: uid("qm"), name: "Pass Rate", currentValue: d.passRate, unit: "%", previousValue: 83.5, changePercent: 1.7, trend: "up", status: "good", description: "Overall test pass rate" },
    { id: uid("qm"), name: "Test Coverage", currentValue: d.coveragePercent, unit: "%", previousValue: 84, changePercent: 3, trend: "up", status: "good", description: "Code coverage percentage" },
    { id: uid("qm"), name: "Average Duration", currentValue: d.avgDurationMs, unit: "ms", previousValue: 38000, changePercent: -10.5, trend: "down", status: "good", description: "Average test suite duration" },
    { id: uid("qm"), name: "Open Bugs", currentValue: d.openBugs, unit: "", previousValue: 15, changePercent: -20, trend: "down", status: "warning", description: "Open bug count" },
    { id: uid("qm"), name: "Total Test Cases", currentValue: d.totalTestCases, unit: "", previousValue: 310, changePercent: 4.8, trend: "up", status: "good", description: "Total test cases across all suites" },
    { id: uid("qm"), name: "Health Score", currentValue: d.overallHealth === "healthy" ? 95 : d.overallHealth === "degraded" ? 70 : 40, unit: "%", previousValue: 72, changePercent: -2.8, trend: "stable", status: d.overallHealth === "healthy" ? "good" : d.overallHealth === "degraded" ? "warning" : "critical", description: "Overall QA health score" },
  ];
}

// ------------------------------------------------------------------ //
//  MODULE 2 — Test Suites                                             //
// ------------------------------------------------------------------ //

export function getTestSuites(): TestSuite[] {
  return [...getStore().suites];
}

export function runTestSuite(suiteId: string): TestSuite | null {
  const store = getStore();
  const idx = store.suites.findIndex((s) => s.id === suiteId);
  if (idx === -1) return null;
  const suite = store.suites[idx];
  suite.testCases = suite.testCases.map((tc) => {
    const passed = Math.random() < 0.85;
    return {
      ...tc,
      status: passed ? "pass" as const : "fail" as const,
      durationMs: Math.round(10 + Math.random() * 200),
      lastRunAt: Date.now(),
      ...(passed ? {} : { errorMessage: `Assertion failed for ${tc.name}` }),
    };
  });
  suite.updatedAt = Date.now();
  store.suites[idx] = { ...suite };
  // Update dashboard
  store.dashboard.lastRunAt = Date.now();
  store.dashboard.passedTests = store.suites.reduce((s, su) => s + su.testCases.filter((tc) => tc.status === "pass").length, 0);
  store.dashboard.failedTests = store.suites.reduce((s, su) => s + su.testCases.filter((tc) => tc.status === "fail").length, 0);
  return store.suites[idx];
}

export function getTestSuiteById(suiteId: string): TestSuite | undefined {
  return getStore().suites.find((s) => s.id === suiteId);
}

// ------------------------------------------------------------------ //
//  MODULE 3 — Performance & Load Testing                              //
// ------------------------------------------------------------------ //

export function getPerformanceTests(): PerformanceTest[] {
  return [...getStore().perfTests];
}

export function runPerformanceTest(testId: string): PerformanceTest | null {
  const store = getStore();
  const idx = store.perfTests.findIndex((t) => t.id === testId);
  if (idx === -1) return null;
  const test = { ...store.perfTests[idx], status: "running" as const };
  store.perfTests[idx] = test;
  // Simulate completion
  setTimeout(() => {
    const idx2 = getStore().perfTests.findIndex((t) => t.id === testId);
    if (idx2 === -1) return;
    const passed = Math.random() < 0.7;
    getStore().perfTests[idx2] = {
      ...getStore().perfTests[idx2],
      status: passed ? "completed" as const : "failed" as const,
      passed,
      lastRunAt: Date.now(),
      p50Ms: Math.round(20 + Math.random() * 100),
      p95Ms: Math.round(80 + Math.random() * 300),
      p99Ms: Math.round(150 + Math.random() * 500),
      errorRate: parseFloat((Math.random() * 3).toFixed(2)),
      thresholdViolations: passed ? [] : ["P95 threshold exceeded"],
    };
  }, 2000);
  return test;
}

// ------------------------------------------------------------------ //
//  MODULE 4 — Security Testing                                        //
// ------------------------------------------------------------------ //

export function getSecurityTests(): SecurityTest[] {
  return [...getStore().secTests];
}

export function updateSecurityFinding(
  testId: string,
  findingId: string,
  updates: Partial<SecurityFinding>
): boolean {
  const store = getStore();
  const test = store.secTests.find((t) => t.id === testId);
  if (!test) return false;
  const finding = test.findings.find((f) => f.id === findingId);
  if (!finding) return false;
  Object.assign(finding, updates);
  return true;
}

export function runSecurityScan(target: string): SecurityTest {
  const test: SecurityTest = {
    id: uid("sectest"),
    name: `On-Demand Scan: ${target}`,
    category: "vulnerability",
    target,
    severity: "medium",
    status: "open",
    findings: [
      { id: uid("sf"), title: "SSL/TLS Configuration Check", description: "TLS 1.0 still enabled", severity: "medium", cvssScore: 5.0, affectedComponent: "nginx", remediation: "Disable TLS 1.0 and 1.1", status: "open", discoveredAt: Date.now() },
    ],
    lastRunAt: Date.now(),
    createdAt: Date.now(),
  };
  getStore().secTests.push(test);
  return test;
}

// ------------------------------------------------------------------ //
//  MODULE 5 — Accessibility Testing                                   //
// ------------------------------------------------------------------ //

export function getAccessibilityTests(): AccessibilityTest[] {
  return [...getStore().a11yTests];
}

export function runAccessibilityAudit(
  target: string,
  standard: AccessibilityTest["standard"] = "wcag22aa"
): AccessibilityTest {
  const violations: AccessibilityViolation[] = [
    {
      id: uid("a11yv"),
      rule: "color-contrast",
      impact: "serious",
      description: "Insufficient color contrast on body text",
      element: "body p",
      wcagCriteria: "1.4.3",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
    },
  ];
  const score = Math.round(60 + Math.random() * 35);
  const test: AccessibilityTest = {
    id: uid("a11y"),
    name: `On-Demand Audit: ${target}`,
    target,
    standard,
    violations,
    status: score >= 80 ? "pass" : "fail",
    score,
    lastRunAt: Date.now(),
    createdAt: Date.now(),
  };
  getStore().a11yTests.push(test);
  return test;
}

// ------------------------------------------------------------------ //
//  MODULE 6 — Visual Regression Testing                               //
// ------------------------------------------------------------------ //

export function getVisualRegressionTests(): VisualRegressionTest[] {
  return [...getStore().visualTests];
}

export function runVisualRegression(
  name: string,
  target: string,
  viewport: string
): VisualRegressionTest {
  const diff = parseFloat((Math.random() * 5).toFixed(1));
  const test: VisualRegressionTest = {
    id: uid("visual"),
    name,
    target,
    viewport,
    baselineUrl: `/screenshots/baseline/${target.replace(/\//g, "_")}.png`,
    currentUrl: `/screenshots/current/${target.replace(/\//g, "_")}.png`,
    diffPercent: diff,
    status: diff < 1 ? "pass" : "fail",
    lastRunAt: Date.now(),
    createdAt: Date.now(),
  };
  getStore().visualTests.push(test);
  return test;
}

// ------------------------------------------------------------------ //
//  MODULE 7 — AI Testing                                              //
// ------------------------------------------------------------------ //

export function getAiTests(): AiTest[] {
  return [...getStore().aiTests];
}

export function runAiTestSuite(testId: string): AiTest | null {
  const store = getStore();
  const idx = store.aiTests.findIndex((t) => t.id === testId);
  if (idx === -1) return null;
  const test = store.aiTests[idx];
  test.testCases = test.testCases.map((tc) => {
    const passed = Math.random() < 0.85;
    return {
      ...tc,
      passed,
      actualOutput: passed ? tc.expectedOutput : `${tc.expectedOutput} (modified)`,
      score: passed ? 0.85 + Math.random() * 0.15 : Math.random() * 0.4,
      latencyMs: Math.round(200 + Math.random() * 1000),
      ...(passed ? {} : { errorMessage: "Output mismatch detected" }),
    };
  });
  test.score = Math.round((test.testCases.filter((tc) => tc.passed).length / test.testCases.length) * 100);
  test.status = test.score >= 70 ? "passed" : "failed";
  test.lastRunAt = Date.now();
  store.aiTests[idx] = { ...test };
  return store.aiTests[idx];
}

// ------------------------------------------------------------------ //
//  MODULE 8 — Test Data Platform                                      //
// ------------------------------------------------------------------ //

export function getTestDataTemplates(): TestDataTemplate[] {
  return [...getStore().testDataTemplates];
}

export function generateTestData(
  templateId: string,
  count: number
): { template: TestDataTemplate; records: Record<string, unknown>[] } | null {
  const template = getStore().testDataTemplates.find((t) => t.id === templateId);
  if (!template) return null;
  const records = Array.from({ length: count }, (_, i) => {
    const record: Record<string, unknown> = {};
    for (const [key, type] of Object.entries(template.schema)) {
      if (type === "string") record[key] = `${key}_${i + 1}`;
      else if (type === "number") record[key] = Math.round(Math.random() * 1000);
      else if (type === "boolean") record[key] = Math.random() > 0.5;
      else if (type === "object") record[key] = {};
      else if (type === "array") record[key] = [];
    }
    return record;
  });
  return { template, records };
}

// ------------------------------------------------------------------ //
//  MODULE 9 — Release Certification                                   //
// ------------------------------------------------------------------ //

export function getReleaseCertifications(): ReleaseCertification[] {
  return [...getStore().releases];
}

export function createRelease(version: string, name: string): ReleaseCertification {
  const release: ReleaseCertification = {
    id: uid("release"),
    version,
    name,
    status: "draft",
    checks: [
      { id: uid("rc"), name: "Unit Tests", category: "unit", status: "pending", score: 0, threshold: 90, details: "", durationMs: 0 },
      { id: uid("rc"), name: "Integration Tests", category: "integration", status: "pending", score: 0, threshold: 85, details: "", durationMs: 0 },
      { id: uid("rc"), name: "E2E Tests", category: "e2e", status: "pending", score: 0, threshold: 80, details: "", durationMs: 0 },
      { id: uid("rc"), name: "Performance Tests", category: "performance", status: "pending", score: 0, threshold: 85, details: "", durationMs: 0 },
      { id: uid("rc"), name: "Security Scan", category: "security", status: "pending", score: 0, threshold: 80, details: "", durationMs: 0 },
      { id: uid("rc"), name: "Accessibility", category: "accessibility", status: "pending", score: 0, threshold: 75, details: "", durationMs: 0 },
      { id: uid("rc"), name: "Code Quality", category: "code_quality", status: "pending", score: 0, threshold: 85, details: "", durationMs: 0 },
      { id: uid("rc"), name: "Coverage", category: "coverage", status: "pending", score: 0, threshold: 80, details: "", durationMs: 0 },
    ],
    overallScore: 0,
    startedAt: Date.now(),
    createdAt: Date.now(),
  };
  getStore().releases.unshift(release);
  return release;
}

export function startReleaseCertification(releaseId: string): ReleaseCertification | null {
  const store = getStore();
  const idx = store.releases.findIndex((r) => r.id === releaseId);
  if (idx === -1) return null;
  const release = store.releases[idx];
  release.status = "in_progress";
  release.startedAt = Date.now();
  release.checks = release.checks.map((c) => ({
    ...c,
    status: "running" as const,
    startedAt: Date.now(),
  }));
  store.releases[idx] = { ...release };
  return store.releases[idx];
}

export function completeReleaseCheck(
  releaseId: string,
  checkId: string,
  passed: boolean,
  score: number,
  details: string
): boolean {
  const store = getStore();
  const release = store.releases.find((r) => r.id === releaseId);
  if (!release) return false;
  const check = release.checks.find((c) => c.id === checkId);
  if (!check) return false;
  check.status = passed ? "passed" : "failed";
  check.score = score;
  check.details = details;
  check.completedAt = Date.now();
  check.durationMs = Date.now() - (check.startedAt || Date.now());
  // Update overall score
  const completed = release.checks.filter((c) => c.status === "passed" || c.status === "failed");
  const passedChecks = completed.filter((c) => c.status === "passed");
  release.overallScore = completed.length > 0 ? Math.round((passedChecks.length / completed.length) * 100) : 0;
  const allDone = release.checks.every((c) => c.status === "passed" || c.status === "failed" || c.status === "skipped");
  if (allDone) {
    release.status = release.checks.every((c) => c.status !== "failed") ? "passed" : "failed";
    release.completedAt = Date.now();
  }
  return true;
}

export function certifyRelease(releaseId: string, certifiedBy: string, notes: string): ReleaseCertification | null {
  const store = getStore();
  const idx = store.releases.findIndex((r) => r.id === releaseId);
  if (idx === -1) return null;
  const release = store.releases[idx];
  release.status = "certified";
  release.certifiedBy = certifiedBy;
  release.notes = notes;
  store.releases[idx] = { ...release };
  return store.releases[idx];
}

// ------------------------------------------------------------------ //
//  MODULE 10 — Code Quality & Coverage                                //
// ------------------------------------------------------------------ //

export function getCodeQualityReports(): CodeQualityReport[] {
  return [...getStore().qualityReports];
}

export function runCodeQualityAnalysis(name: string, linesOfCode: number): CodeQualityReport {
  const report: CodeQualityReport = {
    id: uid("cq"),
    name,
    linesOfCode,
    complexityScore: Math.round(linesOfCode / 300 + Math.random() * 20),
    technicalDebtDays: Math.round(linesOfCode / 1000 + Math.random() * 5),
    duplicatePercent: parseFloat((Math.random() * 8).toFixed(1)),
    deadCodeFiles: Math.random() < 0.3 ? Math.round(Math.random() * 3) : 0,
    unusedDependencies: Math.round(Math.random() * 5),
    lintErrors: Math.round(Math.random() * 20),
    codeSmells: Math.round(Math.random() * 30),
    coveragePercent: Math.round(65 + Math.random() * 30),
    coverageStatement: Math.round(68 + Math.random() * 28),
    coverageBranch: Math.round(55 + Math.random() * 35),
    coverageFunction: Math.round(70 + Math.random() * 25),
    coverageLine: Math.round(65 + Math.random() * 30),
    grade: "A",
    generatedAt: Date.now(),
  };
  getStore().qualityReports.unshift(report);
  return report;
}

// ------------------------------------------------------------------ //
//  MODULE 11 — Continuous Testing & Scheduling                        //
// ------------------------------------------------------------------ //

export function getTestSchedules(): ContinuousTestSchedule[] {
  return [...getStore().schedules];
}

export function updateTestSchedule(
  scheduleId: string,
  updates: Partial<ContinuousTestSchedule>
): boolean {
  const store = getStore();
  const idx = store.schedules.findIndex((s) => s.id === scheduleId);
  if (idx === -1) return false;
  store.schedules[idx] = { ...store.schedules[idx], ...updates };
  return true;
}

export function createTestSchedule(
  name: string,
  cronExpression: string,
  suites: string[]
): ContinuousTestSchedule {
  const schedule: ContinuousTestSchedule = {
    id: uid("cts"),
    name,
    cronExpression,
    suites,
    enabled: true,
    notifyOnFailure: true,
    notifyChannels: ["slack"],
    createdAt: Date.now(),
  };
  getStore().schedules.push(schedule);
  return schedule;
}

// ------------------------------------------------------------------ //
//  MODULE 12 — Testing Analytics & Reports                            //
// ------------------------------------------------------------------ //

export function getTestingReports(): TestingReport[] {
  return [...getStore().reports];
}

export function generateTestingReport(type: TestingReport["type"], period: string): TestingReport {
  const report: TestingReport = {
    id: uid("tr"),
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    type,
    period,
    summary: "Auto-generated testing report",
    metrics: [
      { label: "Pass Rate", value: `${Math.round(80 + Math.random() * 15)}%`, trend: "stable" },
      { label: "Test Count", value: String(Math.round(100 + Math.random() * 500)), trend: "up" },
      { label: "Findings", value: String(Math.round(Math.random() * 20)), trend: Math.random() > 0.5 ? "down" : "stable" },
    ],
    generatedAt: Date.now(),
  };
  getStore().reports.unshift(report);
  return report;
}

export function getTestingStats() {
  const d = getStore().dashboard;
  return {
    totalSuites: d.totalTestSuites,
    totalCases: d.totalTestCases,
    passed: d.passedTests,
    failed: d.failedTests,
    skipped: d.skippedTests,
    passRate: d.passRate,
    coverage: d.coveragePercent,
    openBugs: d.openBugs,
    perfTests: getStore().perfTests.filter((t) => t.status === "completed").length,
    secFindings: getStore().secTests.reduce((s, t) => s + t.findings.length, 0),
    openFindings: getStore().secTests.reduce((s, t) => s + t.findings.filter((f) => f.status === "open").length, 0),
    certifiedReleases: getStore().releases.filter((r) => r.status === "certified").length,
    failedReleases: getStore().releases.filter((r) => r.status === "failed").length,
    a11yScore: Math.round(getStore().a11yTests.reduce((s, t) => s + t.score, 0) / Math.max(getStore().a11yTests.length, 1)),
    visualFailures: getStore().visualTests.filter((t) => t.status === "fail").length,
    aiScore: Math.round(getStore().aiTests.filter((t) => t.status === "passed" || t.status === "failed").reduce((s, t) => s + t.score, 0) / Math.max(getStore().aiTests.filter((t) => t.status === "passed" || t.status === "failed").length, 1)),
    schedules: getStore().schedules.length,
    activeSchedules: getStore().schedules.filter((s) => s.enabled).length,
  };
}
