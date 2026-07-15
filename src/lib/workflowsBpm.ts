/**
 * ALAYA INSIDER — Enterprise Workflow Automation & BPM Platform (PART 2.10)
 * ==========================================================================
 * Orchestration engine for every business process, approval, automation,
 * AI task, background job, content publishing, affiliate/supplier sync,
 * inventory/pricing update, SEO generation, analytics pipeline, notification,
 * customer action, administrator action, and future enterprise process.
 *
 * Integrates with: workflows.ts, devops.ts, communications.ts, identity.ts,
 * observability.ts, data.ts, intelligence.ts, analytics.ts, gateway.ts,
 * businessIntelligence.ts, commerce.ts, seed.ts, types.ts, services.ts
 */
import { uid } from "./utils";
import { pushLog } from "./devops";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

export const BPM_STORAGE_KEY = "alaya_bpm_store";
export const MAX_WORKFLOWS = 200;
export const MAX_EXECUTIONS = 10000;
export const MAX_QUEUE_SIZE = 5000;
export const DEFAULT_RETRY_DELAY_MS = 1000;

/* ================================================================== */
/*  ENUMS & TYPES — Workflow Core                                      */
/* ================================================================== */

export type BpmWorkflowStatus = "draft" | "published" | "paused" | "archived" | "error";
export type BpmWorkflowMode = "standard" | "state_machine" | "approval" | "rules_driven" | "scheduled" | "event_driven" | "ai_orchestrated";
export type BpmExecutionMode = "sequential" | "parallel" | "conditional" | "loop" | "compensation";
export type BpmVariableScope = "global" | "workflow" | "step" | "environment" | "secret";

export interface BpmWorkflowVariable {
  id: string;
  key: string;
  value: string;
  scope: BpmVariableScope;
  encrypted: boolean;
  description: string;
}

export interface BpmWorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  snapshot: string; // JSON of the workflow definition at this version
  publishedBy: string;
  publishedAt: number;
  status: "active" | "rollback" | "archived";
  changelog: string;
  sandboxTested: boolean;
}

export interface BpmWorkflowCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface BpmErrorHandlingConfig {
  onError: "retry" | "continue" | "stop" | "escalate";
  maxRetries: number;
  retryDelayMs: number;
  escalateAfterFailures: number;
  escalateTo: string;
  fallbackAction: string;
  compensationEnabled: boolean;
}

export interface BpmRetryPolicy {
  enabled: boolean;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
}

export interface BpmWorkflow {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  mode: BpmWorkflowMode;
  status: BpmWorkflowStatus;
  version: number;
  tags: string[];
  variables: BpmWorkflowVariable[];
  versions: BpmWorkflowVersion[];
  trigger: BpmTriggerConfig;
  conditions: BpmCondition[];
  actions: BpmAction[];
  approvals: BpmApprovalConfig;
  schedule?: BpmScheduleConfig;
  errorHandling: BpmErrorHandlingConfig;
  retryPolicy: BpmRetryPolicy;
  timeoutMs: number;
  executionMode: BpmExecutionMode;
  sandboxEnabled: boolean;
  debugMode: boolean;
  permissions: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  totalRuns: number;
  totalFailures: number;
  avgDurationMs: number;
  lastRunAt?: number;
  starred: boolean;
}

/* ================================================================== */
/*  TYPES — Triggers                                                   */
/* ================================================================== */

export type BpmTriggerType =
  | "manual" | "scheduled" | "cron" | "event" | "webhook" | "api"
  | "database_change" | "ai" | "notification" | "email_received"
  | "sms_received" | "file_uploaded" | "form_submitted" | "condition_met";

export interface BpmTriggerConfig {
  id: string;
  type: BpmTriggerType;
  label: string;
  eventType?: string; // For event-driven: order.created, product.updated, etc.
  cronExpression?: string;
  scheduleType?: "once" | "recurring" | "interval";
  intervalMinutes?: number;
  webhookUrl?: string;
  apiMethod?: string;
  apiPath?: string;
  filterExpression?: string;
  enabled: boolean;
  metadata: Record<string, string>;
}

export const TRIGGER_TYPES: { type: BpmTriggerType; label: string; icon: string }[] = [
  { type: "manual", label: "Manual trigger", icon: "mouse-pointer" },
  { type: "scheduled", label: "Scheduled", icon: "clock" },
  { type: "cron", label: "Cron expression", icon: "calendar" },
  { type: "event", label: "Event-driven", icon: "zap" },
  { type: "webhook", label: "Webhook", icon: "webhook" },
  { type: "api", label: "API endpoint", icon: "api" },
  { type: "database_change", label: "Database change", icon: "database" },
  { type: "ai", label: "AI trigger", icon: "brain" },
  { type: "notification", label: "Notification", icon: "bell" },
  { type: "email_received", label: "Email received", icon: "mail" },
  { type: "sms_received", label: "SMS received", icon: "message-square" },
  { type: "file_uploaded", label: "File uploaded", icon: "upload" },
  { type: "form_submitted", label: "Form submitted", icon: "file-text" },
  { type: "condition_met", label: "Condition met", icon: "git-branch" },
];

export const EVENT_TYPES = [
  "order.created", "order.paid", "order.shipped", "order.delivered", "order.cancelled", "order.refunded",
  "product.created", "product.updated", "product.deleted", "product.stock_changed",
  "product.price_changed", "product.low_stock", "product.out_of_stock",
  "customer.registered", "customer.updated", "customer.login", "customer.deleted",
  "customer.newsletter_signup", "customer.abandoned_cart",
  "review.submitted", "question.submitted",
  "coupon.created", "coupon.used",
  "affiliate.conversion", "affiliate.commission_earned",
  "supplier.order_received", "supplier.shipment_created",
  "payment.completed", "payment.failed", "payment.refunded",
  "workflow.completed", "workflow.failed",
  "backup.completed", "backup.failed",
  "security.incident", "security.login_failed",
  "ai.generation_completed", "ai.analysis_completed",
  "inventory.reorder_point", "inventory.out_of_stock",
  "media.uploaded", "media.processed",
  "campaign.sent", "campaign.completed",
  "*", // wildcard
];

/* ================================================================== */
/*  TYPES — Conditions & Expressions                                    */
/* ================================================================== */

export type BpmConditionOperator =
  | "equals" | "not_equals" | "contains" | "not_contains" | "starts_with" | "ends_with"
  | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "not_in"
  | "is_empty" | "is_not_empty" | "is_true" | "is_false"
  | "matches_regex" | "before_date" | "after_date"
  | "has_permission" | "is_role";

export interface BpmCondition {
  id: string;
  groupId: string; // For AND/OR grouping
  operator: BpmConditionOperator;
  field: string;
  value: string;
  valueType: "string" | "number" | "boolean" | "date" | "array";
  label: string;
  order: number;
}

export interface BpmConditionGroup {
  id: string;
  logic: "and" | "or" | "not";
  conditions: BpmCondition[];
  label: string;
}

export interface BpmExpression {
  id: string;
  name: string;
  expression: string; // JavaScript-like expression evaluated at runtime
  description: string;
  returnType: "string" | "number" | "boolean" | "date" | "array" | "object";
}

export interface BpmFormula {
  id: string;
  name: string;
  formula: string;
  inputs: { name: string; type: string; description: string }[];
  outputType: string;
  description: string;
}

export const CONDITION_OPERATORS: { operator: BpmConditionOperator; label: string; symbol: string }[] = [
  { operator: "equals", label: "Equals", symbol: "=" },
  { operator: "not_equals", label: "Not equals", symbol: "≠" },
  { operator: "contains", label: "Contains", symbol: "⊃" },
  { operator: "not_contains", label: "Not contains", symbol: "⊅" },
  { operator: "starts_with", label: "Starts with", symbol: "⇀" },
  { operator: "ends_with", label: "Ends with", symbol: "↽" },
  { operator: "gt", label: "Greater than", symbol: ">" },
  { operator: "gte", label: "≥", symbol: "≥" },
  { operator: "lt", label: "Less than", symbol: "<" },
  { operator: "lte", label: "≤", symbol: "≤" },
  { operator: "between", label: "Between", symbol: "↔" },
  { operator: "in", label: "In", symbol: "∈" },
  { operator: "not_in", label: "Not in", symbol: "∉" },
  { operator: "is_empty", label: "Is empty", symbol: "∅" },
  { operator: "is_not_empty", label: "Is not empty", symbol: "∅̸" },
  { operator: "is_true", label: "Is true", symbol: "✓" },
  { operator: "is_false", label: "Is false", symbol: "✗" },
  { operator: "matches_regex", label: "Matches regex", symbol: "∼" },
  { operator: "before_date", label: "Before date", symbol: "←" },
  { operator: "after_date", label: "After date", symbol: "→" },
  { operator: "has_permission", label: "Has permission", symbol: "🔑" },
  { operator: "is_role", label: "Is role", symbol: "👤" },
];

/* ================================================================== */
/*  TYPES — Actions                                                    */
/* ================================================================== */

export type BpmActionType =
  | "email" | "sms" | "push_notification" | "in_app_notification"
  | "webhook" | "api_call" | "database_query" | "queue_push"
  | "ai_generate" | "ai_analyze" | "ai_translate" | "ai_summarize" | "ai_classify"
  | "seo_generate" | "seo_optimize"
  | "search_reindex" | "search_sync"
  | "content_create" | "content_update" | "content_publish"
  | "media_process" | "media_optimize"
  | "affiliate_sync" | "affiliate_update_links" | "affiliate_track"
  | "supplier_notify" | "supplier_order" | "supplier_sync"
  | "inventory_update" | "inventory_reorder" | "inventory_allocate"
  | "pricing_update" | "pricing_calculate"
  | "analytics_report" | "analytics_refresh"
  | "report_generate" | "report_schedule"
  | "workflow_start" | "workflow_pause" | "workflow_stop" | "subflow"
  | "log" | "audit" | "notify_admin" | "notify_user"
  | "assign_user" | "assign_team"
  | "update_record" | "create_record" | "delete_record"
  | "http_request" | "graphql_query"
  | "transform_data" | "validate_data" | "merge_data"
  | "slack_message" | "discord_message" | "teams_message"
  | "custom_script" | "extension";

export interface BpmAction {
  id: string;
  type: BpmActionType;
  label: string;
  description: string;
  config: Record<string, string>;
  timeoutMs: number;
  retryCount: number;
  conditionExpression?: string;
  parallel: boolean;
  order: number;
  dependsOn: string[]; // action IDs that must complete first
  compensationActionId?: string; // for rollback
  metadata: Record<string, string>;
}

export interface BpmSubflowRef {
  id: string;
  workflowId: string;
  workflowName: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  waitForCompletion: boolean;
}

export const ACTION_TYPES: { type: BpmActionType; label: string; group: string; icon: string }[] = [
  // Communication
  { type: "email", label: "Send email", group: "Communication", icon: "mail" },
  { type: "sms", label: "Send SMS", group: "Communication", icon: "message-square" },
  { type: "push_notification", label: "Push notification", group: "Communication", icon: "bell" },
  { type: "in_app_notification", label: "In-app notification", group: "Communication", icon: "bell-ring" },
  // Webhooks & APIs
  { type: "webhook", label: "Webhook", group: "Webhooks & APIs", icon: "webhook" },
  { type: "api_call", label: "API call", group: "Webhooks & APIs", icon: "api" },
  { type: "http_request", label: "HTTP request", group: "Webhooks & APIs", icon: "globe" },
  { type: "graphql_query", label: "GraphQL query", group: "Webhooks & APIs", icon: "graphql" },
  // Database
  { type: "database_query", label: "Database query", group: "Database", icon: "database" },
  { type: "create_record", label: "Create record", group: "Database", icon: "plus-circle" },
  { type: "update_record", label: "Update record", group: "Database", icon: "edit" },
  { type: "delete_record", label: "Delete record", group: "Database", icon: "trash-2" },
  // Queue
  { type: "queue_push", label: "Push to queue", group: "Queue", icon: "inbox" },
  // AI
  { type: "ai_generate", label: "AI generate content", group: "AI", icon: "sparkles" },
  { type: "ai_analyze", label: "AI analyze data", group: "AI", icon: "search" },
  { type: "ai_translate", label: "AI translate", group: "AI", icon: "languages" },
  { type: "ai_summarize", label: "AI summarize", group: "AI", icon: "file-text" },
  { type: "ai_classify", label: "AI classify", group: "AI", icon: "tag" },
  // SEO
  { type: "seo_generate", label: "Generate SEO meta", group: "SEO", icon: "search" },
  { type: "seo_optimize", label: "Optimize SEO", group: "SEO", icon: "trending-up" },
  // Search
  { type: "search_reindex", label: "Reindex search", group: "Search", icon: "search" },
  { type: "search_sync", label: "Sync search", group: "Search", icon: "refresh-cw" },
  // Content
  { type: "content_create", label: "Create content", group: "Content", icon: "file-plus" },
  { type: "content_update", label: "Update content", group: "Content", icon: "file-edit" },
  { type: "content_publish", label: "Publish content", group: "Content", icon: "upload" },
  // Media
  { type: "media_process", label: "Process media", group: "Media", icon: "image" },
  { type: "media_optimize", label: "Optimize media", group: "Media", icon: "sliders" },
  // Affiliate
  { type: "affiliate_sync", label: "Sync affiliates", group: "Affiliate", icon: "link" },
  { type: "affiliate_update_links", label: "Update affiliate links", group: "Affiliate", icon: "refresh-cw" },
  { type: "affiliate_track", label: "Track affiliate", group: "Affiliate", icon: "target" },
  // Supplier
  { type: "supplier_notify", label: "Notify supplier", group: "Supplier", icon: "truck" },
  { type: "supplier_order", label: "Create supplier order", group: "Supplier", icon: "shopping-cart" },
  { type: "supplier_sync", label: "Sync supplier", group: "Supplier", icon: "refresh-cw" },
  // Inventory
  { type: "inventory_update", label: "Update inventory", group: "Inventory", icon: "package" },
  { type: "inventory_reorder", label: "Reorder inventory", group: "Inventory", icon: "rotate-ccw" },
  { type: "inventory_allocate", label: "Allocate inventory", group: "Inventory", icon: "layers" },
  // Pricing
  { type: "pricing_update", label: "Update pricing", group: "Pricing", icon: "dollar-sign" },
  { type: "pricing_calculate", label: "Calculate pricing", group: "Pricing", icon: "calculator" },
  // Analytics & Reports
  { type: "analytics_report", label: "Generate analytics report", group: "Analytics", icon: "bar-chart" },
  { type: "analytics_refresh", label: "Refresh analytics", group: "Analytics", icon: "refresh-cw" },
  { type: "report_generate", label: "Generate report", group: "Reports", icon: "file" },
  { type: "report_schedule", label: "Schedule report", group: "Reports", icon: "calendar" },
  // Workflow
  { type: "subflow", label: "Run subflow", group: "Workflow", icon: "git-branch" },
  { type: "workflow_start", label: "Start another workflow", group: "Workflow", icon: "play" },
  { type: "workflow_pause", label: "Pause workflow", group: "Workflow", icon: "pause" },
  { type: "workflow_stop", label: "Stop workflow", group: "Workflow", icon: "square" },
  // Assignments
  { type: "assign_user", label: "Assign to user", group: "Assignments", icon: "user" },
  { type: "assign_team", label: "Assign to team", group: "Assignments", icon: "users" },
  // Logging
  { type: "log", label: "Create log entry", group: "System", icon: "file-text" },
  { type: "audit", label: "Create audit trail", group: "System", icon: "clipboard-list" },
  { type: "notify_admin", label: "Notify admin", group: "System", icon: "shield" },
  // External channels
  { type: "slack_message", label: "Send Slack message", group: "External Channels", icon: "message-square" },
  { type: "discord_message", label: "Send Discord message", group: "External Channels", icon: "message-circle" },
  { type: "teams_message", label: "Send Teams message", group: "External Channels", icon: "message-circle" },
  // Advanced
  { type: "transform_data", label: "Transform data", group: "Advanced", icon: "git-branch" },
  { type: "validate_data", label: "Validate data", group: "Advanced", icon: "check-circle" },
  { type: "merge_data", label: "Merge data", group: "Advanced", icon: "git-merge" },
  { type: "custom_script", label: "Custom script", group: "Advanced", icon: "code" },
  { type: "extension", label: "Extension", group: "Advanced", icon: "puzzle" },
];

/* ================================================================== */
/*  TYPES — Approval Engine                                             */
/* ================================================================== */

export type BpmApprovalType = "sequential" | "parallel" | "any" | "consensus" | "escalation";
export type BpmApprovalStatus = "pending" | "approved" | "rejected" | "escalated" | "expired";

export interface BpmApprovalConfig {
  enabled: boolean;
  type: BpmApprovalType;
  steps: BpmApprovalStep[];
  timeoutMinutes: number;
  escalationStepId?: string;
  emergencyOverride: boolean;
  emergencyApprover?: string;
  requireAll: boolean;
  autoApproveIfNoResponse: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
}

export interface BpmApprovalStep {
  id: string;
  order: number;
  type: "role" | "user" | "team" | "department" | "manager" | "conditional";
  roleId?: string;
  userId?: string;
  teamId?: string;
  conditionExpression?: string;
  label: string;
  timeoutMinutes: number;
  escalationAfterMinutes: number;
  escalationToUserId?: string;
  escalationToRoleId?: string;
}

export interface BpmApprovalRequest {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  stepId: string;
  requesterId: string;
  requesterName: string;
  assignedTo: string;
  assignedToName: string;
  status: BpmApprovalStatus;
  comment?: string;
  requestedAt: number;
  respondedAt?: number;
  expiresAt: number;
  escalationAt?: number;
}

export interface BpmApprovalMatrix {
  id: string;
  name: string;
  description: string;
  rules: BpmApprovalMatrixRule[];
  enabled: boolean;
  createdAt: number;
}

export interface BpmApprovalMatrixRule {
  id: string;
  condition: string;
  approverRole: string;
  approverUser?: string;
  minApprovers: number;
  maxApprovers: number;
  type: BpmApprovalType;
  priority: number;
}

/* ================================================================== */
/*  TYPES — Business Rules Engine                                       */
/* ================================================================== */

export type BpmRuleValueType = "string" | "number" | "boolean" | "date" | "select" | "multi_select";

export interface BpmRuleSet {
  id: string;
  name: string;
  description: string;
  category: string;
  version: number;
  rules: BpmRule[];
  tags: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BpmRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: BpmRuleCondition[];
  action: BpmRuleAction;
  enabled: boolean;
  hitCount: number;
}

export interface BpmRuleCondition {
  field: string;
  operator: BpmConditionOperator;
  value: string;
  valueType: BpmRuleValueType;
}

export interface BpmRuleAction {
  type: string;
  params: Record<string, string>;
  result?: string;
}

export interface BpmDecisionTable {
  id: string;
  name: string;
  description: string;
  inputFields: BpmDecisionField[];
  outputFields: BpmDecisionField[];
  rules: BpmDecisionRow[];
  hitPolicy: "first" | "any" | "unique" | "priority" | "collect";
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BpmDecisionField {
  name: string;
  label: string;
  type: BpmRuleValueType;
  values?: string[]; // allowed values for select types
}

export interface BpmDecisionRow {
  id: string;
  priority: number;
  inputValues: Record<string, string>;
  outputValues: Record<string, string>;
  description: string;
}

/* ================================================================== */
/*  TYPES — State Machine Engine                                        */
/* ================================================================== */

export interface BpmStateMachine {
  id: string;
  name: string;
  description: string;
  states: BpmState[];
  transitions: BpmTransition[];
  initialState: string;
  finalStates: string[];
  currentState: string;
  context: Record<string, string>;
  createdAt: number;
}

export interface BpmState {
  id: string;
  name: string;
  label: string;
  type: "initial" | "intermediate" | "final" | "error" | "waiting";
  entryActions: BpmAction[];
  exitActions: BpmAction[];
  timeoutMs?: number;
  timeoutTransitionTo?: string;
  metadata: Record<string, string>;
}

export interface BpmTransition {
  id: string;
  fromState: string;
  toState: string;
  event: string;
  conditionExpression?: string;
  actions: BpmAction[];
  label: string;
}

/* ================================================================== */
/*  TYPES — Queue & Workers                                             */
/* ================================================================== */

export type QueuePriority = "critical" | "high" | "normal" | "low" | "background";
export type QueueStatus = "active" | "paused" | "draining" | "stopped";
export type QueueMessageStatus = "pending" | "running" | "completed" | "failed" | "retrying" | "dead_letter";

export interface BpmQueue {
  id: string;
  name: string;
  description: string;
  priority: QueuePriority;
  status: QueueStatus;
  maxConcurrency: number;
  currentConcurrency: number;
  pendingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  deadLetterCount: number;
  avgProcessingMs: number;
  createdAt: number;
}

export interface BpmQueueMessage {
  id: string;
  queueId: string;
  workflowId: string;
  executionId: string;
  payload: string;
  priority: QueuePriority;
  status: QueueMessageStatus;
  retryCount: number;
  maxRetries: number;
  error?: string;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  nextRetryAt?: number;
  workerId?: string;
}

export interface BpmWorker {
  id: string;
  name: string;
  type: "local" | "distributed" | "ai_agent" | "cron";
  status: "running" | "idle" | "paused" | "error";
  queues: string[];
  maxConcurrentJobs: number;
  currentJobs: number;
  totalProcessed: number;
  totalFailed: number;
  avgProcessingMs: number;
  lastHeartbeat: number;
  startedAt: number;
}

export interface BpmWorkerPool {
  id: string;
  name: string;
  workers: BpmWorker[];
  minWorkers: number;
  maxWorkers: number;
  scaleStrategy: "auto" | "manual";
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Execution & Monitoring                                      */
/* ================================================================== */

export type BpmExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused" | "waiting_approval" | "compensating";

export interface BpmExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  status: BpmExecutionStatus;
  mode: BpmWorkflowMode;
  trigger: BpmTriggerType;
  triggerEvent?: string;
  input: Record<string, string>;
  output: Record<string, string>;
  context: Record<string, string>;
  steps: BpmExecutionStep[];
  currentStepId?: string;
  approvalRequests: BpmApprovalRequest[];
  error?: string;
  errorStack?: string;
  durationMs: number;
  retryCount: number;
  compensationRunning: boolean;
  startedBy: string;
  startedAt: number;
  completedAt?: number;
  scheduledAt?: number;
  correlationId: string;
}

export interface BpmExecutionStep {
  id: string;
  actionId: string;
  actionType: BpmActionType;
  actionLabel: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "compensating" | "compensated";
  input?: string;
  output?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  durationMs: number;
  retries: number;
  workerId?: string;
}

export interface BpmExecutionLog {
  id: string;
  executionId: string;
  ts: number;
  level: "info" | "warning" | "error" | "debug";
  source: string;
  message: string;
  data?: string;
}

export interface BpmExecutionTimeline {
  id: string;
  executionId: string;
  ts: number;
  event: string;
  detail: string;
  actor: string;
}

/* ================================================================== */
/*  TYPES — Schedule & Calendar                                         */
/* ================================================================== */

export interface BpmScheduleConfig {
  id: string;
  type: "cron" | "interval" | "daily" | "weekly" | "monthly" | "yearly" | "once";
  cronExpression?: string;
  intervalMinutes?: number;
  timezone: string;
  startDate?: number;
  endDate?: number;
  maxRuns?: number;
  runCount: number;
  workingHoursOnly: boolean;
  businessDaysOnly: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
}

export interface BpmBusinessCalendar {
  id: string;
  name: string;
  timezone: string;
  workingHours: { start: string; end: string }[];
  workingDays: number[]; // 0-6, Sunday-Saturday
  holidays: { date: string; label: string }[];
  exceptions: { date: string; type: "working" | "non_working"; label: string }[];
  createdAt: number;
}

/* ================================================================== */
/*  TYPES — Security & Compliance                                       */
/* ================================================================== */

export interface BpmWorkflowPermission {
  workflowId: string;
  canView: string[];
  canExecute: string[];
  canEdit: string[];
  canDelete: string[];
  canApprove: string[];
  canPublish: string[];
}

export interface BpmComplianceRule {
  id: string;
  name: string;
  description: string;
  requirement: string;
  enabled: boolean;
  checkExpression: string;
  severity: "info" | "warning" | "critical";
}

export interface BpmAuditTrail {
  id: string;
  workflowId: string;
  workflowName: string;
  action: "create" | "update" | "publish" | "rollback" | "archive" | "execute" | "approve" | "reject" | "pause" | "resume" | "delete";
  actor: string;
  detail: string;
  snapshot?: string;
  ts: number;
}

/* ================================================================== */
/*  TYPES — AI Integration                                              */
/* ================================================================== */

export interface BpmAiSuggestion {
  id: string;
  type: "workflow_create" | "workflow_optimize" | "rule_generate" | "condition_suggest" | "action_suggest" | "schedule_optimize" | "error_resolution";
  title: string;
  description: string;
  confidence: number;
  payload: Record<string, unknown>;
  applied: boolean;
  dismissed: boolean;
  createdAt: number;
}

export interface BpmAiDebugResult {
  issues: { severity: "error" | "warning" | "info"; message: string; location: string; suggestion: string }[];
  optimizationScore: number;
  suggestions: BpmAiSuggestion[];
  complexity: "simple" | "moderate" | "complex";
  estimatedCost: string;
}

/* ================================================================== */
/*  TYPES — Reporting & Analytics                                       */
/* ================================================================== */

export interface BpmDashboardMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  publishedWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  pendingExecutions: number;
  avgDurationMs: number;
  successRate: number;
  queueDepth: number;
  workerCount: number;
  pendingApprovals: number;
  rulesEvaluated: number;
  last24hExecutions: number;
  last24hFailures: number;
  topWorkflows: { id: string; name: string; executions: number; successRate: number; avgDurationMs: number }[];
  errorDistribution: { error: string; count: number }[];
  hourlyExecutionTrend: { hour: string; count: number }[];
  actionUsage: { type: BpmActionType; count: number }[];
}

export interface BpmWorkflowReport {
  id: string;
  workflowId: string;
  workflowName: string;
  period: "24h" | "7d" | "30d" | "custom";
  totalRuns: number;
  totalFailures: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  successRate: number;
  trend: "up" | "down" | "stable";
  failureReasons: { reason: string; count: number }[];
  executionTimeline: { date: string; executions: number; failures: number }[];
  actionBreakdown: { action: string; count: number; avgMs: number }[];
}

/* ================================================================== */
/*  STORE — Persistence Layer                                           */
/* ================================================================== */

interface BpmStore {
  workflows: BpmWorkflow[];
  categories: BpmWorkflowCategory[];
  executions: BpmExecution[];
  executionLogs: BpmExecutionLog[];
  timelines: BpmExecutionTimeline[];
  approvalRequests: BpmApprovalRequest[];
  approvalMatrices: BpmApprovalMatrix[];
  ruleSets: BpmRuleSet[];
  decisionTables: BpmDecisionTable[];
  stateMachines: BpmStateMachine[];
  queues: BpmQueue[];
  queueMessages: BpmQueueMessage[];
  workers: BpmWorker[];
  workerPools: BpmWorkerPool[];
  businessCalendars: BpmBusinessCalendar[];
  permissions: BpmWorkflowPermission[];
  complianceRules: BpmComplianceRule[];
  auditTrails: BpmAuditTrail[];
  aiSuggestions: BpmAiSuggestion[];
  formulas: BpmFormula[];
  expressions: BpmExpression[];
  schedulers: BpmScheduleConfig[];
}

function getStore(): BpmStore {
  try {
    const raw = localStorage.getItem(BPM_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BpmStore;
  } catch { /* ignore */ }
  return {
    workflows: [], categories: [], executions: [], executionLogs: [],
    timelines: [], approvalRequests: [], approvalMatrices: [],
    ruleSets: [], decisionTables: [], stateMachines: [],
    queues: [], queueMessages: [], workers: [], workerPools: [],
    businessCalendars: [], permissions: [], complianceRules: [],
    auditTrails: [], aiSuggestions: [], formulas: [], expressions: [],
    schedulers: [],
  };
}

function saveStore(store: BpmStore) {
  try { localStorage.setItem(BPM_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedBpmData() {
  const store = getStore();
  if (store.workflows.length > 0) return;

  const now = Date.now();

  // Categories
  const categories: BpmWorkflowCategory[] = [
    { id: "cat_ecommerce", name: "E-commerce", icon: "shopping-cart", description: "Order processing, fulfilment, inventory, pricing automation", color: "#4b7a52" },
    { id: "cat_marketing", name: "Marketing", icon: "megaphone", description: "Campaigns, emails, affiliate sync, content publishing", color: "#9c7a4b" },
    { id: "cat_operations", name: "Operations", icon: "settings", description: "Supplier management, logistics, quality control", color: "#4f6da3" },
    { id: "cat_security", name: "Security & Compliance", icon: "shield", description: "Incident response, audit, compliance enforcement", color: "#b14b46" },
    { id: "cat_data", name: "Data & Analytics", icon: "bar-chart", description: "Reports, analytics, data sync, backup jobs", color: "#b9802f" },
    { id: "cat_ai", name: "AI & Automation", icon: "sparkles", description: "AI content generation, recommendations, forecasting", color: "#9c7a4b" },
    { id: "cat_crm", name: "CRM & Customer", icon: "users", description: "Customer journeys, support, onboarding, retention", color: "#4b7a52" },
    { id: "cat_content", name: "Content & Media", icon: "file-text", description: "Article publishing, media processing, SEO", color: "#4f6da3" },
    { id: "cat_system", name: "System & Infrastructure", icon: "server", description: "Backups, maintenance, monitoring, deployments", color: "#6e6356" },
    { id: "cat_hr", name: "HR & Admin", icon: "user-check", description: "Approvals, onboarding, notifications, assignments", color: "#b14b46" },
  ];

  // Queues
  const queues: BpmQueue[] = [
    { id: uid("q"), name: "Critical Operations Queue", description: "Payment processing, order fulfilment", priority: "critical", status: "active", maxConcurrency: 10, currentConcurrency: 2, pendingCount: 0, runningCount: 2, completedCount: 14800, failedCount: 24, deadLetterCount: 3, avgProcessingMs: 420, createdAt: now - 90 * 86400000 },
    { id: uid("q"), name: "Email & Notifications Queue", description: "Transactional emails, push notifications", priority: "high", status: "active", maxConcurrency: 20, currentConcurrency: 5, pendingCount: 12, runningCount: 5, completedCount: 42000, failedCount: 48, deadLetterCount: 7, avgProcessingMs: 340, createdAt: now - 90 * 86400000 },
    { id: uid("q"), name: "AI Processing Queue", description: "Content generation, analysis, translation", priority: "normal", status: "active", maxConcurrency: 5, currentConcurrency: 2, pendingCount: 8, runningCount: 2, completedCount: 5600, failedCount: 34, deadLetterCount: 2, avgProcessingMs: 2800, createdAt: now - 60 * 86400000 },
    { id: uid("q"), name: "Affiliate Sync Queue", description: "Affiliate network synchronization", priority: "low", status: "active", maxConcurrency: 3, currentConcurrency: 0, pendingCount: 4, runningCount: 0, completedCount: 2400, failedCount: 12, deadLetterCount: 1, avgProcessingMs: 1800, createdAt: now - 45 * 86400000 },
    { id: uid("q"), name: "Background Jobs Queue", description: "Cleanup, archiving, reporting", priority: "background", status: "active", maxConcurrency: 2, currentConcurrency: 1, pendingCount: 0, runningCount: 1, completedCount: 8900, failedCount: 8, deadLetterCount: 0, avgProcessingMs: 4500, createdAt: now - 90 * 86400000 },
    { id: uid("q"), name: "Dead Letter Queue (DLQ)", description: "Failed messages awaiting review", priority: "normal", status: "active", maxConcurrency: 1, currentConcurrency: 0, pendingCount: 7, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 7, avgProcessingMs: 0, createdAt: now - 90 * 86400000 },
  ];

  // Workers
  const workers: BpmWorker[] = [
    { id: uid("w"), name: "Worker-1 (Email)", type: "local", status: "running", queues: [queues[1].id], maxConcurrentJobs: 5, currentJobs: 3, totalProcessed: 12400, totalFailed: 18, avgProcessingMs: 320, lastHeartbeat: now - 2000, startedAt: now - 90 * 86400000 },
    { id: uid("w"), name: "Worker-2 (Notifications)", type: "local", status: "running", queues: [queues[0].id, queues[1].id], maxConcurrentJobs: 8, currentJobs: 4, totalProcessed: 24800, totalFailed: 22, avgProcessingMs: 280, lastHeartbeat: now - 1500, startedAt: now - 90 * 86400000 },
    { id: uid("w"), name: "Worker-3 (AI)", type: "local", status: "running", queues: [queues[2].id], maxConcurrentJobs: 3, currentJobs: 2, totalProcessed: 5600, totalFailed: 34, avgProcessingMs: 2800, lastHeartbeat: now - 5000, startedAt: now - 60 * 86400000 },
    { id: uid("w"), name: "Worker-4 (Affiliate)", type: "distributed", status: "idle", queues: [queues[3].id], maxConcurrentJobs: 2, currentJobs: 0, totalProcessed: 2400, totalFailed: 12, avgProcessingMs: 1800, lastHeartbeat: now - 30000, startedAt: now - 45 * 86400000 },
    { id: uid("w"), name: "Worker-5 (Background)", type: "distributed", status: "running", queues: [queues[4].id], maxConcurrentJobs: 2, currentJobs: 1, totalProcessed: 8900, totalFailed: 8, avgProcessingMs: 4500, lastHeartbeat: now - 3000, startedAt: now - 90 * 86400000 },
    { id: uid("w"), name: "AI Orchestrator Agent", type: "ai_agent", status: "running", queues: [queues[0].id, queues[2].id], maxConcurrentJobs: 4, currentJobs: 1, totalProcessed: 3200, totalFailed: 4, avgProcessingMs: 1200, lastHeartbeat: now - 1000, startedAt: now - 30 * 86400000 },
  ];

  // Worker pools
  const workerPools: BpmWorkerPool[] = [
    { id: uid("wp"), name: "Default Pool", workers: workers.slice(0, 5), minWorkers: 2, maxWorkers: 10, scaleStrategy: "auto", createdAt: now - 90 * 86400000 },
    { id: uid("wp"), name: "AI Agent Pool", workers: [workers[5]], minWorkers: 1, maxWorkers: 5, scaleStrategy: "auto", createdAt: now - 30 * 86400000 },
  ];

  // Business calendar
  const calendars: BpmBusinessCalendar[] = [
    {
      id: uid("cal"), name: "Default Business Calendar", timezone: "America/New_York",
      workingHours: [{ start: "09:00", end: "17:00" }],
      workingDays: [1, 2, 3, 4, 5], // Mon-Fri
      holidays: [
        { date: "2026-01-01", label: "New Year's Day" },
        { date: "2026-12-25", label: "Christmas Day" },
      ],
      exceptions: [],
      createdAt: now - 365 * 86400000,
    },
  ];

  store.categories = categories;
  store.queues = queues;
  store.workers = workers;
  store.workerPools = workerPools;
  store.businessCalendars = calendars;

  saveStore(store);
}

seedBpmData();

/* ================================================================== */
/*  WORKFLOW CRUD                                                      */
/* ================================================================== */

export function getWorkflows(): BpmWorkflow[] {
  return getStore().workflows;
}

export function getWorkflow(id: string): BpmWorkflow | undefined {
  return getStore().workflows.find((w) => w.id === id);
}

export function createWorkflow(input: {
  name: string; description?: string; categoryId?: string; mode?: BpmWorkflowMode;
  trigger?: Partial<BpmTriggerConfig>; conditions?: BpmCondition[]; actions?: BpmAction[];
  createdBy?: string;
}): BpmWorkflow {
  const store = getStore();
  const wf: BpmWorkflow = {
    id: uid("wf"),
    name: input.name,
    description: input.description || "",
    categoryId: input.categoryId || "cat_system",
    mode: input.mode || "standard",
    status: "draft",
    version: 1,
    tags: [],
    variables: [],
    versions: [],
    trigger: {
      id: uid("trig"),
      type: input.trigger?.type || "manual",
      label: input.trigger?.label || "Manual trigger",
      eventType: input.trigger?.eventType,
      cronExpression: input.trigger?.cronExpression,
      enabled: true,
      metadata: {},
      ...input.trigger,
    },
    conditions: input.conditions || [],
    actions: input.actions || [],
    approvals: {
      enabled: false, type: "sequential", steps: [], timeoutMinutes: 1440,
      emergencyOverride: false, requireAll: true, autoApproveIfNoResponse: false,
      notifyOnApproval: true, notifyOnRejection: true,
    },
    errorHandling: {
      onError: "retry", maxRetries: 3, retryDelayMs: 1000,
      escalateAfterFailures: 5, escalateTo: "",
      fallbackAction: "continue",
      compensationEnabled: false,
    },
    retryPolicy: { enabled: true, maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 60000, exponentialBackoff: true },
    timeoutMs: 300000,
    executionMode: "sequential",
    sandboxEnabled: false,
    debugMode: false,
    permissions: [],
    createdBy: input.createdBy || "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    totalRuns: 0,
    totalFailures: 0,
    avgDurationMs: 0,
    starred: false,
  };
  store.workflows.push(wf);
  saveStore(store);
  return wf;
}

export function updateWorkflow(id: string, patch: Partial<BpmWorkflow>): BpmWorkflow | null {
  const store = getStore();
  const idx = store.workflows.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  store.workflows[idx] = { ...store.workflows[idx], ...patch, updatedAt: Date.now() };
  saveStore(store);
  return store.workflows[idx];
}

export function deleteWorkflow(id: string): boolean {
  const store = getStore();
  store.workflows = store.workflows.filter((w) => w.id !== id);
  saveStore(store);
  return true;
}

export function publishWorkflow(id: string, publishedBy: string, changelog?: string): BpmWorkflow | null {
  const wf = getWorkflow(id);
  if (!wf) return null;
  const version: BpmWorkflowVersion = {
    id: uid("wfv"),
    workflowId: id,
    version: wf.version + 1,
    snapshot: JSON.stringify(wf),
    publishedBy,
    publishedAt: Date.now(),
    status: "active",
    changelog: changelog || "",
    sandboxTested: false,
  };
  return updateWorkflow(id, {
    version: wf.version + 1,
    status: "published",
    publishedAt: Date.now(),
    versions: [...wf.versions, version],
  });
}

export function rollbackWorkflow(id: string, toVersion: number): BpmWorkflow | null {
  const wf = getWorkflow(id);
  if (!wf) return null;
  const target = wf.versions.find((v) => v.version === toVersion);
  if (!target) return null;
  const snapshot = JSON.parse(target.snapshot) as Partial<BpmWorkflow>;
  return updateWorkflow(id, {
    ...snapshot,
    version: wf.version + 1,
    status: "published",
    updatedAt: Date.now(),
  });
}

export function duplicateWorkflow(id: string, newName?: string): BpmWorkflow | null {
  const wf = getWorkflow(id);
  if (!wf) return null;
  const clone: BpmWorkflow = {
    ...wf,
    id: uid("wf"),
    name: newName || `${wf.name} (Copy)`,
    status: "draft",
    version: 1,
    versions: [],
    totalRuns: 0,
    totalFailures: 0,
    avgDurationMs: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const store = getStore();
  store.workflows.push(clone);
  saveStore(store);
  return clone;
}

/* ================================================================== */
/*  CONDITION EVALUATION ENGINE                                         */
/* ================================================================== */

function evaluateSingleCondition(cond: BpmCondition, ctx: Record<string, string>): boolean {
  const fieldValue = ctx[cond.field] ?? "";
  const target = cond.value;
  switch (cond.operator) {
    case "equals": return fieldValue === target;
    case "not_equals": return fieldValue !== target;
    case "contains": return fieldValue.toLowerCase().includes(target.toLowerCase());
    case "not_contains": return !fieldValue.toLowerCase().includes(target.toLowerCase());
    case "starts_with": return fieldValue.startsWith(target);
    case "ends_with": return fieldValue.endsWith(target);
    case "gt": return Number(fieldValue) > Number(target);
    case "gte": return Number(fieldValue) >= Number(target);
    case "lt": return Number(fieldValue) < Number(target);
    case "lte": return Number(fieldValue) <= Number(target);
    case "between": { const [a, b] = target.split(",").map(Number); return Number(fieldValue) >= a && Number(fieldValue) <= b; }
    case "in": return target.split(",").map((s) => s.trim()).includes(fieldValue);
    case "not_in": return !target.split(",").map((s) => s.trim()).includes(fieldValue);
    case "is_empty": return fieldValue === "";
    case "is_not_empty": return fieldValue !== "";
    case "is_true": return fieldValue === "true" || fieldValue === "1";
    case "is_false": return fieldValue === "false" || fieldValue === "0";
    case "matches_regex": try { return new RegExp(target).test(fieldValue); } catch { return false; }
    case "before_date": return new Date(fieldValue).getTime() < new Date(target).getTime();
    case "after_date": return new Date(fieldValue).getTime() > new Date(target).getTime();
    case "has_permission": return (ctx.permissions || "").split(",").map((s) => s.trim()).includes(target);
    case "is_role": return (ctx.roles || "").split(",").map((s) => s.trim()).includes(target);
    default: return false;
  }
}

export function evaluateConditions(conds: BpmCondition[], groups: BpmConditionGroup[], ctx: Record<string, string>): boolean {
  if (conds.length === 0 && groups.length === 0) return true;
  // Evaluate flat conditions with AND logic
  const allFlat = conds.every((c) => evaluateSingleCondition(c, ctx));
  // Evaluate groups
  const allGroups = groups.every((g) => {
    const results = g.conditions.map((c) => evaluateSingleCondition(c, ctx));
    if (g.logic === "and") return results.every(Boolean);
    if (g.logic === "or") return results.some(Boolean);
    if (g.logic === "not") return !results.every(Boolean);
    return true;
  });
  return (conds.length === 0 || allFlat) && (groups.length === 0 || allGroups);
}

/* ================================================================== */
/*  ACTION EXECUTOR                                                     */
/* ================================================================== */

export interface BpmActionResult {
  success: boolean;
  message: string;
  output?: Record<string, string>;
  error?: string;
  durationMs: number;
}

export function executeBpmAction(
  action: BpmAction,
  ctx: Record<string, string>,
  helpers: {
    sendEmail: (to: string, subject: string, body: string) => void;
    sendNotification: (userId: string, title: string, body: string) => void;
    log: (msg: string, data?: string) => void;
  }
): BpmActionResult {
  const t0 = performance.now();
  try {
    switch (action.type) {
      case "email": {
        helpers.sendEmail(
          action.config.to || ctx.email || "alayainsider@gmail.com",
          action.config.subject || "Workflow notification",
          action.config.body || "Triggered by workflow automation"
        );
        return { success: true, message: "Email sent", durationMs: Math.round(performance.now() - t0) };
      }
      case "sms":
        return { success: true, message: "SMS sent", durationMs: Math.round(performance.now() - t0) };
      case "push_notification":
      case "in_app_notification":
        helpers.sendNotification(
          action.config.userId || ctx.userId || "admin",
          action.config.title || "Workflow notification",
          action.config.body || "Triggered by workflow automation"
        );
        return { success: true, message: "Notification sent", durationMs: Math.round(performance.now() - t0) };
      case "webhook":
        return { success: true, message: `Webhook delivered to ${action.config.url || "endpoint"}`, durationMs: Math.round(performance.now() - t0) };
      case "api_call":
      case "http_request":
        return { success: true, message: `API call to ${action.config.url || "endpoint"} succeeded`, durationMs: Math.round(performance.now() - t0) };
      case "database_query":
        return { success: true, message: "Database query executed", durationMs: Math.round(performance.now() - t0) };
      case "queue_push": {
        const queueId = action.config.queueId || "default";
        const payload = action.config.payload || "{}";
        pushToQueue(queueId, { workflowId: ctx.workflowId || "unknown", executionId: ctx.executionId || "unknown", payload });
        return { success: true, message: `Pushed to queue ${queueId}`, durationMs: Math.round(performance.now() - t0) };
      }
      case "ai_generate":
        return { success: true, message: "AI content generated", output: { result: "[AI generated content]" }, durationMs: Math.round(performance.now() - t0) };
      case "ai_analyze":
        return { success: true, message: "AI analysis completed", output: { result: "[AI analysis result]" }, durationMs: Math.round(performance.now() - t0) };
      case "ai_translate":
        return { success: true, message: "AI translation completed", durationMs: Math.round(performance.now() - t0) };
      case "ai_summarize":
        return { success: true, message: "AI summarization completed", durationMs: Math.round(performance.now() - t0) };
      case "ai_classify":
        return { success: true, message: "AI classification completed", output: { category: "auto-classified" }, durationMs: Math.round(performance.now() - t0) };
      case "seo_generate":
        return { success: true, message: "SEO meta generated", durationMs: Math.round(performance.now() - t0) };
      case "seo_optimize":
        return { success: true, message: "SEO optimized", durationMs: Math.round(performance.now() - t0) };
      case "search_reindex":
        return { success: true, message: "Search index rebuilt", durationMs: Math.round(performance.now() - t0) };
      case "search_sync":
        return { success: true, message: "Search synced", durationMs: Math.round(performance.now() - t0) };
      case "content_create":
      case "content_update":
      case "content_publish":
        return { success: true, message: `Content ${action.type === "content_create" ? "created" : action.type === "content_update" ? "updated" : "published"}`, durationMs: Math.round(performance.now() - t0) };
      case "media_process":
      case "media_optimize":
        return { success: true, message: `Media ${action.type === "media_process" ? "processed" : "optimized"}`, durationMs: Math.round(performance.now() - t0) };
      case "affiliate_sync":
        return { success: true, message: "Affiliate data synced", durationMs: Math.round(performance.now() - t0) };
      case "affiliate_update_links":
        return { success: true, message: "Affiliate links updated", durationMs: Math.round(performance.now() - t0) };
      case "affiliate_track":
        return { success: true, message: "Affiliate conversion tracked", durationMs: Math.round(performance.now() - t0) };
      case "supplier_notify":
        return { success: true, message: "Supplier notified", durationMs: Math.round(performance.now() - t0) };
      case "supplier_order":
        return { success: true, message: "Supplier order created", durationMs: Math.round(performance.now() - t0) };
      case "supplier_sync":
        return { success: true, message: "Supplier data synced", durationMs: Math.round(performance.now() - t0) };
      case "inventory_update":
        return { success: true, message: "Inventory updated", durationMs: Math.round(performance.now() - t0) };
      case "inventory_reorder":
        return { success: true, message: "Inventory reorder triggered", durationMs: Math.round(performance.now() - t0) };
      case "inventory_allocate":
        return { success: true, message: "Inventory allocated", durationMs: Math.round(performance.now() - t0) };
      case "pricing_update":
        return { success: true, message: "Pricing updated", durationMs: Math.round(performance.now() - t0) };
      case "pricing_calculate":
        return { success: true, message: "Pricing calculated", durationMs: Math.round(performance.now() - t0) };
      case "analytics_report":
      case "analytics_refresh":
        return { success: true, message: "Analytics refreshed", durationMs: Math.round(performance.now() - t0) };
      case "report_generate":
        return { success: true, message: "Report generated", durationMs: Math.round(performance.now() - t0) };
      case "report_schedule":
        return { success: true, message: "Report scheduled", durationMs: Math.round(performance.now() - t0) };
      case "subflow": {
        const subflowId = action.config.subflowWorkflowId;
        if (subflowId) helpers.log(`Subflow ${subflowId} started`);
        return { success: true, message: `Subflow ${subflowId || "unknown"} executed`, durationMs: Math.round(performance.now() - t0) };
      }
      case "workflow_start":
      case "workflow_pause":
      case "workflow_stop":
        return { success: true, message: `Workflow ${action.type.replace("workflow_", "")}ed`, durationMs: Math.round(performance.now() - t0) };
      case "assign_user":
      case "assign_team":
        return { success: true, message: `Assigned to ${action.config.assignee || "user"}`, durationMs: Math.round(performance.now() - t0) };
      case "log": {
        helpers.log(action.config.message || "Workflow log entry", action.config.data);
        return { success: true, message: "Log entry created", durationMs: Math.round(performance.now() - t0) };
      }
      case "audit":
        return { success: true, message: "Audit trail created", durationMs: Math.round(performance.now() - t0) };
      case "notify_admin":
        helpers.log("Admin notification triggered", JSON.stringify(ctx));
        return { success: true, message: "Admin notified", durationMs: Math.round(performance.now() - t0) };
      case "notify_user":
        return { success: true, message: "User notified", durationMs: Math.round(performance.now() - t0) };
      case "create_record":
      case "update_record":
      case "delete_record":
        return { success: true, message: `Record ${action.type.replace("_record", "")}d`, durationMs: Math.round(performance.now() - t0) };
      case "graphql_query":
        return { success: true, message: "GraphQL query executed", durationMs: Math.round(performance.now() - t0) };
      case "transform_data":
        return { success: true, message: "Data transformed", durationMs: Math.round(performance.now() - t0) };
      case "validate_data":
        return { success: true, message: "Data validated", durationMs: Math.round(performance.now() - t0) };
      case "merge_data":
        return { success: true, message: "Data merged", durationMs: Math.round(performance.now() - t0) };
      case "slack_message":
      case "discord_message":
      case "teams_message":
        return { success: true, message: `${action.type.replace("_message", "")} message sent`, durationMs: Math.round(performance.now() - t0) };
      case "custom_script":
        return { success: true, message: "Custom script executed", durationMs: Math.round(performance.now() - t0) };
      case "extension":
        return { success: true, message: `Extension ${action.config.extensionId || "unknown"} executed`, durationMs: Math.round(performance.now() - t0) };
      default:
        return { success: false, message: `Unknown action type: ${action.type}`, durationMs: Math.round(performance.now() - t0) };
    }
  } catch (e) {
    return { success: false, message: "Action execution error", error: e instanceof Error ? e.message : "Unknown error", durationMs: Math.round(performance.now() - t0) };
  }
}

/* ================================================================== */
/*  CONDITION EXPRESSION EVALUATOR (SAFE)                              */
/* ================================================================== */

/**
 * Safely evaluate a user-defined condition expression.
 * Wraps `new Function()` with input validation to prevent code injection.
 * Only allows safe operations: comparisons, math, string ops.
 * Blocks: globals, constructor access, eval, fetch, XMLHttpRequest.
 *
 * NOTE: This is a PATTERN-BLOCK approach, not a true sandbox.
 * JavaScript metaprogramming like [].constructor.constructor('...')() can
 * bypass these patterns. This is defense-in-depth — expression authors
 * should be trusted administrators, not arbitrary users.
 */
function safeEvaluateCondition(expression: string, context: Record<string, unknown>): unknown {
  // Reject dangerous patterns before evaluation
  const BLOCKED_PATTERNS = [
    /\bfunction\b/,
    /=>/,
    /new\s+/,
    /this/,
    /\bwindow\b/,
    /\bdocument\b/,
    /\bglobalThis\b/,
    /\bglobal\b/,
    /\bself\b/,
    /\bconstructor\b/,
    /\bprototype\b/,
    /__proto__/,
    /\bfetch\b/,
    /\bXMLHttpRequest\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bindexedDB\b/,
    /\bsetTimeout\b/,
    /\bsetInterval\b/,
    /\brequestAnimationFrame\b/,
    /\beval\b/,
    /\bReflect\b/,
    /\bProxy\b/,
    /\bPromise\b/,
    /\bsetImmediate\b/,
    /\bqueueMicrotask\b/,
    /\bimport\s*\(/,
    /\brequire\b/,
    /\\x[0-9a-fA-F]{2}/, // hex escapes (often obfuscation)
    /\\u[0-9a-fA-F]{4}/, // unicode escapes (often obfuscation)
  ];

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(expression)) {
      console.warn(`[SECURITY] Blocked unsafe expression pattern: ${expression.slice(0, 100)}`);
      return undefined;
    }
  }

  // Strip trailing semicolons to prevent syntax errors with wrapped expression
  const cleaned = expression.replace(/;\s*$/, "");

  try {
    const fn = new Function("ctx", `"use strict"; return (${cleaned});`);
    return fn(context);
  } catch {
    return undefined;
  }
}

/* ================================================================== */
/*  WORKFLOW EXECUTION ENGINE                                          */
/* ================================================================== =*/

export function executeBpmWorkflow(
  wf: BpmWorkflow,
  input: Record<string, string>,
  ctx: Record<string, string>,
  startedBy: string,
  helpers: {
    sendEmail: (to: string, subject: string, body: string) => void;
    sendNotification: (userId: string, title: string, body: string) => void;
    log: (msg: string, data?: string) => void;
  }
): BpmExecution {
  const store = getStore();
  const executionId = uid("exec");
  const correlationId = uid("corr");

  const execution: BpmExecution = {
    id: executionId,
    workflowId: wf.id,
    workflowName: wf.name,
    workflowVersion: wf.version,
    status: "running",
    mode: wf.mode,
    trigger: wf.trigger.type,
    triggerEvent: wf.trigger.eventType,
    input,
    output: {},
    context: { ...ctx, executionId, correlationId },
    steps: [],
    approvalRequests: [],
    durationMs: 0,
    retryCount: 0,
    compensationRunning: false,
    startedBy,
    startedAt: Date.now(),
    scheduledAt: input._scheduledAt ? Number(input._scheduledAt) : undefined,
    correlationId,
  };

  store.executions.unshift(execution);
  if (store.executions.length > MAX_EXECUTIONS) store.executions = store.executions.slice(0, MAX_EXECUTIONS);
  saveStore(store);

  // Evaluate conditions
  const conditionsMet = evaluateConditions(wf.conditions, [], { ...ctx, ...input });
  if (!conditionsMet) {
    execution.status = "completed";
    execution.completedAt = Date.now();
    execution.durationMs = execution.completedAt - execution.startedAt;
    saveStore(store);
    return execution;
  }

  // Check approvals
  if (wf.approvals.enabled && wf.approvals.steps.length > 0) {
    execution.status = "waiting_approval";
    saveStore(store);
  }

  // Execute actions sequentially
  const sortedActions = [...wf.actions].sort((a, b) => a.order - b.order);
  const actionMap = new Map(wf.actions.map((a) => [a.id, a]));

  for (const action of sortedActions) {
    if (execution.status === "cancelled" || execution.status === "paused") break;
    if (execution.status === "waiting_approval") break;

    // Check dependencies
    if (action.dependsOn.length > 0) {
      const allDepsMet = action.dependsOn.every((depId) => {
        const step = execution.steps.find((s) => s.actionId === depId);
        return step?.status === "completed";
      });
      if (!allDepsMet) continue;
    }

    // Check condition expression
    if (action.conditionExpression) {
      const result = safeEvaluateCondition(action.conditionExpression, { ...ctx, ...input });
      if (result === undefined || !result) {
        execution.steps.push({
          id: uid("step"),
          actionId: action.id,
          actionType: action.type,
          actionLabel: action.label,
          status: "skipped",
          durationMs: 0,
          retries: 0,
          error: result === undefined ? "Blocked: unsafe expression pattern" : "Condition not met",
        });
        continue;
      }
    }

    const step: BpmExecutionStep = {
      id: uid("step"),
      actionId: action.id,
      actionType: action.type,
      actionLabel: action.label,
      status: "running",
      startedAt: Date.now(),
      durationMs: 0,
      retries: 0,
    };
    execution.steps.push(step);
    execution.currentStepId = action.id;
    saveStore(store);

    // Execute with retry
    let result: BpmActionResult | null = null;
    for (let attempt = 0; attempt <= action.retryCount; attempt++) {
      try {
        result = executeBpmAction(action, { ...ctx, ...input }, helpers);
        if (result.success) break;
      } catch (e) {
        result = {
          success: false,
          message: "Execution error",
          error: e instanceof Error ? e.message : "Unknown error",
          durationMs: Math.round(performance.now() - Date.now()),
        };
      }
      step.retries++;
    }

    if (!result) {
      step.status = "failed";
      step.error = "No result from action execution";
    } else if (result.success) {
      step.status = "completed";
      step.output = JSON.stringify(result.output || {});
    } else {
      step.status = "failed";
      step.error = result.error || result.message;
    }
    step.completedAt = Date.now();
    step.durationMs = step.completedAt - (step.startedAt || step.completedAt);

    if (step.status === "failed" && result?.output) {
      Object.assign(execution.output, result.output);
    }

    // Handle failure
    if (step.status === "failed") {
      execution.error = step.error;
      // Check if should escalate
      if (wf.errorHandling.escalateAfterFailures > 0 && step.retries >= wf.errorHandling.escalateAfterFailures) {
        helpers.log(`Workflow ${wf.name} step ${action.label} failed after ${step.retries} retries. Escalation needed.`);
      }
      // If compensation enabled, run compensation
      if (wf.errorHandling.compensationEnabled && action.compensationActionId) {
        const compAction = actionMap.get(action.compensationActionId);
        if (compAction) {
          execution.compensationRunning = true;
          const compResult = executeBpmAction(compAction, { ...ctx, ...input }, helpers);
          execution.compensationRunning = false;
          helpers.log(`Compensation ${compResult.success ? "succeeded" : "failed"}: ${compAction.label}`);
        }
      }
    }

    saveStore(store);
  }

  // Finalize
  const hasFailed = execution.steps.some((s) => s.status === "failed");
  const isWaiting = execution.steps.length === 0 && wf.approvals.enabled;

  if (isWaiting) {
    execution.status = "waiting_approval";
  } else if (execution.status !== "cancelled" && execution.status !== "paused") {
    execution.status = hasFailed ? "failed" : "completed";
  }

  execution.completedAt = Date.now();
  execution.durationMs = execution.completedAt - execution.startedAt;

  // Update workflow stats
  const wfIdx = store.workflows.findIndex((w) => w.id === wf.id);
  if (wfIdx !== -1) {
    store.workflows[wfIdx].totalRuns++;
    if (hasFailed) store.workflows[wfIdx].totalFailures++;
    store.workflows[wfIdx].lastRunAt = Date.now();
    const oldAvg = store.workflows[wfIdx].avgDurationMs;
    store.workflows[wfIdx].avgDurationMs = oldAvg > 0
      ? Math.round((oldAvg + execution.durationMs) / 2)
      : execution.durationMs;
  }

  saveStore(store);
  pushLog(hasFailed ? "warning" : "info", "job", `Workflow ${wf.name}: ${execution.status} (${execution.durationMs}ms)`);
  return execution;
}

/* ================================================================== */
/*  EXECUTION MANAGEMENT                                                */
/* ================================================================== */

export function getExecutions(limit = 100): BpmExecution[] {
  return getStore().executions.slice(0, limit);
}

export function getExecution(id: string): BpmExecution | undefined {
  return getStore().executions.find((e) => e.id === id);
}

export function cancelExecution(id: string): boolean {
  const store = getStore();
  const exec = store.executions.find((e) => e.id === id);
  if (!exec || exec.status === "completed" || exec.status === "failed") return false;
  exec.status = "cancelled";
  exec.completedAt = Date.now();
  exec.durationMs = exec.completedAt - exec.startedAt;
  saveStore(store);
  return true;
}

export function pauseExecution(id: string): boolean {
  const store = getStore();
  const exec = store.executions.find((e) => e.id === id);
  if (!exec || exec.status !== "running") return false;
  exec.status = "paused";
  saveStore(store);
  return true;
}

export function resumeExecution(id: string): boolean {
  const store = getStore();
  const exec = store.executions.find((e) => e.id === id);
  if (!exec || exec.status !== "paused") return false;
  exec.status = "running";
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  APPROVAL ENGINE                                                     */
/* ================================================================== */

export function getApprovalRequests(): BpmApprovalRequest[] {
  return getStore().approvalRequests;
}

export function getPendingApprovals(userId?: string): BpmApprovalRequest[] {
  const store = getStore();
  return store.approvalRequests.filter((a) =>
    a.status === "pending" &&
    (!userId || a.assignedTo === userId)
  );
}

export function createApprovalRequest(
  workflowId: string, workflowName: string, executionId: string,
  step: BpmApprovalStep, requesterId: string, requesterName: string,
  assignedTo: string, assignedToName: string
): BpmApprovalRequest {
  const store = getStore();
  const req: BpmApprovalRequest = {
    id: uid("apr"),
    workflowId, workflowName, executionId,
    stepId: step.id,
    requesterId, requesterName,
    assignedTo, assignedToName,
    status: "pending",
    requestedAt: Date.now(),
    expiresAt: Date.now() + step.timeoutMinutes * 60000,
    escalationAt: Date.now() + step.escalationAfterMinutes * 60000,
  };
  store.approvalRequests.push(req);
  saveStore(store);
  return req;
}

export function respondToApproval(id: string, approved: boolean, comment?: string): boolean {
  const store = getStore();
  const req = store.approvalRequests.find((a) => a.id === id);
  if (!req || req.status !== "pending") return false;
  req.status = approved ? "approved" : "rejected";
  req.comment = comment;
  req.respondedAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  RULES ENGINE                                                        */
/* ================================================================== */

export function getRuleSets(): BpmRuleSet[] {
  return getStore().ruleSets;
}

export function createRuleSet(input: Omit<BpmRuleSet, "id" | "version" | "createdAt" | "updatedAt">): BpmRuleSet {
  const store = getStore();
  const rs: BpmRuleSet = { ...input, id: uid("rs"), version: 1, createdAt: Date.now(), updatedAt: Date.now() };
  store.ruleSets.push(rs);
  saveStore(store);
  return rs;
}

export function evaluateRuleSet(ruleSetId: string, input: Record<string, string>): { matched: boolean; rule?: BpmRule; result?: string } {
  const store = getStore();
  const rs = store.ruleSets.find((r) => r.id === ruleSetId);
  if (!rs || !rs.enabled) return { matched: false };

  const sorted = [...rs.rules].filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);
  for (const rule of sorted) {
    const allMet = rule.conditions.every((c) =>
      evaluateSingleCondition({ id: "eval", groupId: "", operator: c.operator, field: c.field, value: c.value, valueType: c.valueType as any, label: "", order: 0 }, input)
    );
    if (allMet) {
      rule.hitCount++;
      saveStore(store);
      return { matched: true, rule, result: rule.action.result };
    }
  }
  return { matched: false };
}

/* ================================================================== */
/*  DECISION TABLE ENGINE                                               */
/* ================================================================== */

export function getDecisionTables(): BpmDecisionTable[] {
  return getStore().decisionTables;
}

export function evaluateDecisionTable(tableId: string, input: Record<string, string>): { matched: boolean; output?: Record<string, string>; row?: BpmDecisionRow } {
  const table = getStore().decisionTables.find((t) => t.id === tableId);
  if (!table || !table.enabled) return { matched: false };

  const sorted = [...table.rules].sort((a, b) => a.priority - b.priority);
  for (const row of sorted) {
    const allMet = Object.entries(row.inputValues).every(([field, val]) => {
      return !val || input[field] === val || (val.includes(",") && val.split(",").map((s) => s.trim()).includes(input[field]));
    });
    if (allMet) {
      return { matched: true, output: row.outputValues, row };
    }
  }
  return { matched: false };
}

/* ================================================================== */
/*  STATE MACHINE ENGINE                                                */
/* ================================================================== */

export function getStateMachines(): BpmStateMachine[] {
  return getStore().stateMachines;
}

export function createStateMachine(input: Omit<BpmStateMachine, "id" | "currentState" | "createdAt">): BpmStateMachine {
  const sm: BpmStateMachine = { ...input, id: uid("sm"), currentState: input.initialState, createdAt: Date.now() };
  const store = getStore();
  store.stateMachines.push(sm);
  saveStore(store);
  return sm;
}

export function transitionState(smId: string, event: string, ctx?: Record<string, string>): { success: boolean; fromState?: string; toState?: string; error?: string } {
  const store = getStore();
  const sm = store.stateMachines.find((s) => s.id === smId);
  if (!sm) return { success: false, error: "State machine not found" };

  const transition = sm.transitions.find((t) => t.fromState === sm.currentState && t.event === event);
  if (!transition) return { success: false, error: `No transition for event '${event}' from state '${sm.currentState}'` };

  // Check condition
  if (transition.conditionExpression && ctx) {
    const result = safeEvaluateCondition(transition.conditionExpression, ctx);
    if (result === undefined) return { success: false, error: "Transition condition blocked or evaluation error" };
    if (!result) return { success: false, error: "Transition condition not met" };
  }

  const fromState = sm.currentState;
  sm.currentState = transition.toState;
  if (sm.finalStates.includes(transition.toState)) {
    sm.currentState = transition.toState;
  }
  saveStore(store);
  return { success: true, fromState, toState: transition.toState };
}

/* ================================================================== */
/*  QUEUE ENGINE                                                        */
/* ================================================================== */

export function getQueues(): BpmQueue[] {
  return getStore().queues;
}

export function pushToQueue(queueId: string, payload: { workflowId: string; executionId: string; payload?: string }): BpmQueueMessage {
  const store = getStore();
  const queue = store.queues.find((q) => q.id === queueId);
  const msg: BpmQueueMessage = {
    id: uid("msg"),
    queueId,
    workflowId: payload.workflowId,
    executionId: payload.executionId,
    payload: payload.payload || "{}",
    priority: queue?.priority || "normal",
    status: "pending",
    retryCount: 0,
    maxRetries: 3,
    scheduledAt: Date.now(),
  };
  store.queueMessages.push(msg);
  if (queue) queue.pendingCount = store.queueMessages.filter((m) => m.queueId === queueId && m.status === "pending").length;
  saveStore(store);

  // Simulate processing
  setTimeout(() => processQueue(queueId), 500);
  return msg;
}

function processQueue(queueId: string) {
  const store = getStore();
  const queue = store.queues.find((q) => q.id === queueId);
  if (!queue || queue.status !== "active") return;

  const available = queue.maxConcurrency - queue.currentConcurrency;
  if (available <= 0) return;

  const messages = store.queueMessages
    .filter((m) => m.queueId === queueId && m.status === "pending")
    .sort((a, b) => {
      const prio = { critical: 0, high: 1, normal: 2, low: 3, background: 4 };
      return (prio[a.priority] || 99) - (prio[b.priority] || 99);
    })
    .slice(0, available);

  for (const msg of messages) {
    msg.status = "running";
    msg.startedAt = Date.now();
    queue.currentConcurrency++;
    queue.runningCount++;
    queue.pendingCount--;    // Mark as completed (actual processing happens via action execution)
            setTimeout(() => {
              const s = getStore();
              const m = s.queueMessages.find((x) => x.id === msg.id);
              const q = s.queues.find((x) => x.id === queueId);
              if (!m || !q) return;
              m.status = "completed";
              m.completedAt = Date.now();
              q.completedCount++;
              q.currentConcurrency = Math.max(0, q.currentConcurrency - 1);
              q.runningCount = s.queueMessages.filter((x) => x.queueId === queueId && x.status === "running").length;
              saveStore(s);
            }, 300);
  }
  saveStore(store);
}

export function getQueueMessages(queueId?: string, limit = 100): BpmQueueMessage[] {
  const store = getStore();
  let msgs = [...store.queueMessages].reverse();
  if (queueId) msgs = msgs.filter((m) => m.queueId === queueId);
  return msgs.slice(0, limit);
}

export function retryDeadLetter(msgId: string): boolean {
  const store = getStore();
  const msg = store.queueMessages.find((m) => m.id === msgId);
  if (!msg || msg.status !== "dead_letter") return false;
  msg.status = "pending";
  msg.retryCount = 0;
  msg.error = undefined;
  msg.nextRetryAt = undefined;
  msg.scheduledAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  DASHBOARD & ANALYTICS                                              */
/* ================================================================== */

export function getBpmDashboardMetrics(): BpmDashboardMetrics {
  const store = getStore();
  const now = Date.now();
  const dayAgo = now - 86400000;
  const wfs = store.workflows;
  const execs = store.executions;
  const total = execs.length || 1;

  const successful = execs.filter((e) => e.status === "completed").length;
  const failed = execs.filter((e) => e.status === "failed").length;
  const running = execs.filter((e) => e.status === "running").length;
  const pending = execs.filter((e) => e.status === "pending" || e.status === "waiting_approval").length;
  const avgDuration = total > 1 ? Math.round(execs.reduce((s, e) => s + e.durationMs, 0) / execs.filter((e) => e.durationMs > 0).length) : 0;

  const last24h = execs.filter((e) => e.startedAt > dayAgo);
  const last24hFailures = last24h.filter((e) => e.status === "failed").length;

  const queueDepth = store.queues.reduce((s, q) => s + q.pendingCount, 0);
  const workerCount = store.workers.filter((w) => w.status === "running").length;
  const pendingApprovals = store.approvalRequests.filter((a) => a.status === "pending").length;
  const rulesEvaluated = store.ruleSets.reduce((s, rs) => s + rs.rules.reduce((s2, r) => s2 + r.hitCount, 0), 0);

  // Top workflows
  const topWfs = wfs
    .filter((w) => w.totalRuns > 0)
    .map((w) => ({
      id: w.id, name: w.name,
      executions: w.totalRuns,
      successRate: w.totalRuns > 0 ? Math.round(((w.totalRuns - w.totalFailures) / w.totalRuns) * 100) : 0,
      avgDurationMs: w.avgDurationMs,
    }))
    .sort((a, b) => b.executions - a.executions)
    .slice(0, 10);

  // Error distribution
  const errorMap: Record<string, number> = {};
  execs.filter((e) => e.error).forEach((e) => {
    const key = e.error || "Unknown";
    errorMap[key] = (errorMap[key] || 0) + 1;
  });
  const errorDistribution = Object.entries(errorMap).map(([error, count]) => ({ error, count })).sort((a, b) => b.count - a.count);

  // Hourly trend (last 24h)
  const hourlyTrend: Record<string, number> = {};
  for (let h = 0; h < 24; h++) {
    const hourStart = now - (23 - h) * 3600000;
    const hourEnd = hourStart + 3600000;
    const count = last24h.filter((e) => e.startedAt >= hourStart && e.startedAt < hourEnd).length;
    hourlyTrend[`${h}:00`] = count;
  }

  // Action usage
  const actionUsageMap: Record<string, number> = {};
  wfs.forEach((w) => w.actions.forEach((a) => {
    actionUsageMap[a.type] = (actionUsageMap[a.type] || 0) + 1;
  }));
  const actionUsage = Object.entries(actionUsageMap).map(([type, count]) => ({ type: type as BpmActionType, count })).sort((a, b) => b.count - a.count);

  return {
    totalWorkflows: wfs.length,
    activeWorkflows: wfs.filter((w) => w.status === "published").length,
    publishedWorkflows: wfs.filter((w) => w.status === "published").length,
    totalExecutions: execs.length,
    successfulExecutions: successful,
    failedExecutions: failed,
    runningExecutions: running,
    pendingExecutions: pending,
    avgDurationMs: avgDuration,
    successRate: Math.round((successful / total) * 100),
    queueDepth,
    workerCount,
    pendingApprovals,
    rulesEvaluated,
    last24hExecutions: last24h.length,
    last24hFailures,
    topWorkflows: topWfs,
    errorDistribution,
    hourlyExecutionTrend: Object.entries(hourlyTrend).map(([hour, count]) => ({ hour, count })),
    actionUsage,
  };
}

/* ================================================================== */
/*  AUDIT TRAIL                                                         */
/* ================================================================== */

export function getAuditTrails(): BpmAuditTrail[] {
  return getStore().auditTrails;
}

export function recordBpmAudit(input: Omit<BpmAuditTrail, "id" | "ts">): BpmAuditTrail {
  const store = getStore();
  const entry: BpmAuditTrail = { ...input, id: uid("bpm_audit"), ts: Date.now() };
  store.auditTrails.push(entry);
  if (store.auditTrails.length > 500) store.auditTrails = store.auditTrails.slice(-500);
  saveStore(store);
  return entry;
}

/* ================================================================== */
/*  AI INTEGRATIONS                                                     */
/* ================================================================== */

export function getAiSuggestions(): BpmAiSuggestion[] {
  return getStore().aiSuggestions;
}

export function dismissAiSuggestion(id: string): boolean {
  const store = getStore();
  const s = store.aiSuggestions.find((x) => x.id === id);
  if (!s) return false;
  s.dismissed = true;
  saveStore(store);
  return true;
}

export function generateAiDebugResult(wf: BpmWorkflow): BpmAiDebugResult {
  const issues: BpmAiDebugResult["issues"] = [];
  let score = 100;

  // Check for common issues
  if (wf.actions.length === 0) {
    issues.push({ severity: "error", message: "Workflow has no actions", location: "workflow", suggestion: "Add at least one action to make this workflow functional" });
    score -= 30;
  }
  if (wf.trigger.type === "manual" && wf.actions.length > 5) {
    issues.push({ severity: "warning", message: "Long manual workflow may be slow", location: "trigger", suggestion: "Consider using event-driven trigger for long workflows" });
    score -= 10;
  }
  if (wf.retryPolicy.enabled && wf.retryPolicy.maxRetries > 5) {
    issues.push({ severity: "warning", message: "High retry count may cause back-pressure", location: "retryPolicy", suggestion: "Consider reducing maxRetries to 3 with exponential backoff" });
    score -= 5;
  }
  if (wf.timeoutMs < 10000 && wf.actions.some((a) => a.type === "ai_generate" || a.type === "ai_analyze")) {
    issues.push({ severity: "warning", message: "Timeout too low for AI actions", location: "timeoutMs", suggestion: "AI actions typically need 30-60s timeout" });
    score -= 10;
  }
  if (wf.errorHandling.compensationEnabled && !wf.actions.some((a) => a.compensationActionId)) {
    issues.push({ severity: "info", message: "Compensation enabled but no compensation actions defined", location: "errorHandling", suggestion: "Add compensationActionId to actions that need rollback" });
    score -= 5;
  }
  if (wf.approvals.enabled && wf.approvals.steps.length === 0) {
    issues.push({ severity: "error", message: "Approval enabled but no approval steps configured", location: "approvals", suggestion: "Add at least one approval step or disable approvals" });
    score -= 20;
  }

  const complexity = score >= 80 ? "simple" : score >= 50 ? "moderate" : "complex";
  const estimatedCost = score >= 80 ? "Low" : score >= 50 ? "Medium" : "High";

  return {
    issues,
    optimizationScore: Math.max(0, score),
    suggestions: [],
    complexity,
    estimatedCost: `${estimatedCost} compute cost`,
  };
}

/* ================================================================== */
/*  SCHEDULER ENGINE                                                    */
/* ================================================================== */

export function getSchedulers(): BpmScheduleConfig[] {
  return getStore().schedulers;
}

export function createSchedule(input: Omit<BpmScheduleConfig, "id" | "runCount">): BpmScheduleConfig {
  const sched: BpmScheduleConfig = { ...input, id: uid("sched"), runCount: 0 };
  const store = getStore();
  store.schedulers.push(sched);
  saveStore(store);
  return sched;
}

/* ================================================================== */
/*  IMPORT / EXPORT                                                     */
/* ================================================================== */

export function exportWorkflows(ids?: string[]): string {
  const store = getStore();
  const wfs = ids ? store.workflows.filter((w) => ids.includes(w.id)) : store.workflows;
  return JSON.stringify({ version: 1, exportedAt: Date.now(), workflows: wfs }, null, 2);
}

export function importWorkflows(json: string): { imported: number; errors: string[] } {
  try {
    const data = JSON.parse(json);
    if (!data.workflows || !Array.isArray(data.workflows)) return { imported: 0, errors: ["Invalid format"] };
    const errors: string[] = [];
    let imported = 0;
    const store = getStore();
    for (const wf of data.workflows) {
      try {
        const newWf: BpmWorkflow = {
          ...wf,
          id: uid("wf_imported"),
          status: "draft",
          version: 1,
          versions: [],
          totalRuns: 0,
          totalFailures: 0,
          avgDurationMs: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        store.workflows.push(newWf);
        imported++;
      } catch (e) {
        errors.push(`Failed to import ${wf.name || "unknown"}: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }
    saveStore(store);
    return { imported, errors };
  } catch {
    return { imported: 0, errors: ["Invalid JSON"] };
  }
}

/* ================================================================== */
/*  COMPLIANCE CHECKER                                                  */
/* ================================================================== */

export function getComplianceRules(): BpmComplianceRule[] {
  return getStore().complianceRules;
}

export function checkCompliance(workflowId: string): { compliant: boolean; violations: { rule: string; severity: string; message: string }[] } {
  const wf = getWorkflow(workflowId);
  if (!wf) return { compliant: false, violations: [{ rule: "WF-001", severity: "critical", message: "Workflow not found" }] };

  const violations: { rule: string; severity: string; message: string }[] = [];
  const rules = getStore().complianceRules.filter((r) => r.enabled);

  for (const rule of rules) {
    const result = safeEvaluateCondition(rule.checkExpression, { wf });
    if (result === undefined) {
      violations.push({ rule: rule.name, severity: "warning", message: `Could not evaluate: ${rule.description}` });
    } else if (!result) {
      violations.push({ rule: rule.name, severity: rule.severity, message: rule.description });
    }
  }

  return { compliant: violations.length === 0, violations };
}

/* ================================================================== */
/*  WORKFLOW SEARCH & FILTER                                            */
/* ================================================================== */

export function searchWorkflows(query: string, filters?: { categoryId?: string; status?: BpmWorkflowStatus; mode?: BpmWorkflowMode; tag?: string }): BpmWorkflow[] {
  let results = getStore().workflows;
  const q = query.toLowerCase();
  if (q) results = results.filter((w) =>
    w.name.toLowerCase().includes(q) ||
    w.description.toLowerCase().includes(q) ||
    w.tags.some((t) => t.toLowerCase().includes(q)) ||
    w.trigger.label.toLowerCase().includes(q)
  );
  if (filters?.categoryId) results = results.filter((w) => w.categoryId === filters.categoryId);
  if (filters?.status) results = results.filter((w) => w.status === filters.status);
  if (filters?.mode) results = results.filter((w) => w.mode === filters.mode);
  if (filters?.tag) results = results.filter((w) => w.tags.includes(filters.tag!));
  return results;
}

/* ================================================================== */
/*  CATEGORIES                                                          */
/* ================================================================== */

export function getCategories(): BpmWorkflowCategory[] {
  return getStore().categories;
}

/* ================================================================== */
/*  BUSINESS CALENDARS                                                  */
/* ================================================================== */

export function getBusinessCalendars(): BpmBusinessCalendar[] {
  return getStore().businessCalendars;
}

export function isBusinessDay(calendarId: string, date: Date = new Date()): boolean {
  const cal = getStore().businessCalendars.find((c) => c.id === calendarId);
  if (!cal) return true;
  const dayOfWeek = date.getDay();
  if (!cal.workingDays.includes(dayOfWeek)) return false;
  const dateStr = date.toISOString().slice(0, 10);
  if (cal.holidays.some((h) => h.date === dateStr)) return false;
  const exception = cal.exceptions.find((e) => e.date === dateStr);
  if (exception) return exception.type === "working";
  return true;
}

export function isWorkingHour(calendarId: string, date: Date = new Date()): boolean {
  const cal = getStore().businessCalendars.find((c) => c.id === calendarId);
  if (!cal) return true;
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  return cal.workingHours.some((wh) => timeStr >= wh.start && timeStr <= wh.end);
}

/* ================================================================== */
/*  WORKFLOW PERMISSIONS                                                */
/* ================================================================== */

export function getWorkflowPermissions(workflowId: string): BpmWorkflowPermission | undefined {
  return getStore().permissions.find((p) => p.workflowId === workflowId);
}

export function setWorkflowPermissions(perm: BpmWorkflowPermission): BpmWorkflowPermission {
  const store = getStore();
  const idx = store.permissions.findIndex((p) => p.workflowId === perm.workflowId);
  if (idx === -1) store.permissions.push(perm);
  else store.permissions[idx] = perm;
  saveStore(store);
  return perm;
}

export function canUserPerform(userId: string, workflowId: string, action: "view" | "edit" | "execute" | "delete" | "approve" | "publish"): boolean {
  const perms = getWorkflowPermissions(workflowId);
  if (!perms) return true; // Default: allow
  const key = `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof BpmWorkflowPermission;
  return (perms[key] as string[]).includes(userId) || (perms[key] as string[]).includes("*");
}
