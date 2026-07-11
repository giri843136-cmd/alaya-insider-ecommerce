/**
 * ALAYA INSIDER — Enterprise AI Workspace (PART 3.7)
 * ------------------------------------------------------------------
 * AI Operating System: agent registry, AI employees, task management,
 * planning, memory platform, decision engine, automation, observability,
 * cost management, and AI business operations.
 *
 * Modules:
 *  1. AI Agent Registry — agent definitions, marketplace, builder
 *  2. Enterprise AI Employees — CEO, COO, CMO, CTO, CFO and more
 *  3. AI Task Manager — tasks, scheduling, dependencies
 *  4. AI Planner — goals, strategies, campaigns
 *  5. AI Memory Platform — short/long-term/semantic memory
 *  6. AI Decision Engine — decision trees, policies, recommendations
 *  7. AI Automation — autonomous workflows, triggers, orchestration
 *  8. AI Observability — logs, metrics, tracing, alerts, compliance
 *  9. AI Cost Management — usage, budgets, quotas, providers
 *  10. AI Business Operations — revenue, affiliate, SEO, product ops
 */
import { uid } from "./utils";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const AI_WORKSPACE_KEY = "alaya_ai_workspace_v1";
export const MAX_TASKS = 200;
export const MAX_MEMORY_ENTRIES = 500;
export const MAX_DECISION_POLICIES = 50;

/* ================================================================== */
/*  MODULE 1: AI AGENT REGISTRY                                        */
/* ================================================================== */

export type AiAgentRole =
  | "ceo" | "coo" | "cto" | "cmo" | "cfo"
  | "operations_manager" | "affiliate_manager" | "commerce_manager"
  | "editorial_manager" | "seo_manager" | "marketing_manager"
  | "crm_manager" | "customer_support" | "analytics_ai"
  | "developer_ai" | "qa_ai" | "security_ai" | "infrastructure_ai"
  | "legal_ai" | "compliance_ai" | "knowledge_manager";

export type AiAgentTier = "supervisor" | "worker" | "planner" | "reviewer" | "executor" | "observer" | "learner";

export interface AiAgentRegistryEntry {
  id: string;
  name: string;
  role: AiAgentRole;
  tier: AiAgentTier;
  description: string;
  capabilities: string[];
  model: string;
  provider: string;
  status: "active" | "paused" | "error" | "training";
  version: string;
  memoryAccess: boolean;
  maxConcurrentTasks: number;
  activeTasks: number;
  totalTasksCompleted: number;
  successRate: number;
  avgResponseTime: number;
  lastActive: number;
  createdAt: number;
  tags: string[];
  systemPrompt?: string;
}

export interface AiAgentTemplate {
  id: string;
  name: string;
  role: AiAgentRole;
  tier: AiAgentTier;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  popularity: number;
}

export function getAgentRegistry(): AiAgentRegistryEntry[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_agents`) || "[]"); } catch { return []; }
}

export function getAgentTemplates(): AiAgentTemplate[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_templates`) || "[]"); } catch { return []; }
}

export function addAgentFromTemplate(templateId: string): AiAgentRegistryEntry | null {
  const templates = getAgentTemplates();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) return null;
  const agent: AiAgentRegistryEntry = {
    id: uid("ai_agent"),
    name: tmpl.name,
    role: tmpl.role,
    tier: tmpl.tier,
    description: tmpl.description,
    capabilities: [...tmpl.capabilities],
    model: "gpt-4",
    provider: "openai",
    status: "active",
    version: "1.0.0",
    memoryAccess: true,
    maxConcurrentTasks: 3,
    activeTasks: 0,
    totalTasksCompleted: 0,
    successRate: 100,
    avgResponseTime: 0,
    lastActive: Date.now(),
    createdAt: Date.now(),
    tags: [tmpl.role, tmpl.tier],
    systemPrompt: tmpl.systemPrompt,
  };
  const agents = getAgentRegistry();
  agents.push(agent);
  try { localStorage.setItem(`${AI_WORKSPACE_KEY}_agents`, JSON.stringify(agents)); } catch { /* ignore */ }
  return agent;
}

export function updateAgentInRegistry(id: string, patch: Partial<AiAgentRegistryEntry>): AiAgentRegistryEntry | null {
  const all = getAgentRegistry();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  try { localStorage.setItem(`${AI_WORKSPACE_KEY}_agents`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getAgentRegistryStats() {
  const agents = getAgentRegistry();
  return {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    paused: agents.filter((a) => a.status === "paused").length,
    error: agents.filter((a) => a.status === "error").length,
    totalTasksCompleted: agents.reduce((s, a) => s + a.totalTasksCompleted, 0),
    avgSuccessRate: agents.length ? Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length) : 0,
  };
}



/* ================================================================== */
/*  MODULE 2: AI TASK MANAGER                                          */
/* ================================================================== */

export type AiTaskPriority = "low" | "medium" | "high" | "urgent" | "critical";
export type AiTaskStatus = "pending" | "assigned" | "in_progress" | "completed" | "failed" | "cancelled";
export type AiTaskCategory = "analysis" | "generation" | "optimization" | "monitoring" | "research" | "planning" | "review" | "execution" | "communication";

export interface AiTask {
  id: string;
  title: string;
  description: string;
  category: AiTaskCategory;
  priority: AiTaskPriority;
  status: AiTaskStatus;
  assignedTo?: string;
  assignedAgentId?: string;
  dependsOn: string[];
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  result?: string;
  error?: string;
  retries: number;
  maxRetries: number;
  metadata: Record<string, string>;
  createdAt: number;
}

export function getAiTasks(): AiTask[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_tasks`) || "[]"); } catch { return []; }
}

export function addAiTask(input: Omit<AiTask, "id" | "createdAt" | "retries" | "status">): AiTask {
  const tasks = getAiTasks();
  const task: AiTask = { ...input, id: uid("ai_task"), retries: 0, status: "pending", createdAt: Date.now() };
  tasks.unshift(task);
  if (tasks.length > MAX_TASKS) tasks.splice(MAX_TASKS);
  try { localStorage.setItem(`${AI_WORKSPACE_KEY}_tasks`, JSON.stringify(tasks)); } catch { /* ignore */ }
  return task;
}

export function updateAiTask(id: string, patch: Partial<AiTask>): AiTask | null {
  const all = getAiTasks();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  try { localStorage.setItem(`${AI_WORKSPACE_KEY}_tasks`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getTaskStats() {
  const tasks = getAiTasks();
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    highPriority: tasks.filter((t) => t.priority === "high" || t.priority === "urgent" || t.priority === "critical").length,
    avgCompletionTime: (() => {
      const completed = tasks.filter((t) => t.completedAt && t.startedAt);
      if (!completed.length) return 0;
      return Math.round(completed.reduce((s, t) => s + (t.completedAt! - t.startedAt!), 0) / completed.length);
    })(),
  };
}



/* ================================================================== */
/*  MODULE 3: AI MEMORY PLATFORM                                       */
/* ================================================================== */

export type MemoryType = "short_term" | "long_term" | "semantic" | "business" | "conversation" | "project";
export type MemoryImportance = 1 | 2 | 3 | 4 | 5;

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  importance: MemoryImportance;
  key: string;
  content: string;
  source: string;
  tags: string[];
  embeddings?: number[];
  accessCount: number;
  lastAccessed: number;
  expiresAt?: number;
  createdAt: number;
}

export function getMemoryEntries(type?: MemoryType): MemoryEntry[] {
  try {
    const all: MemoryEntry[] = JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_memory`) || "[]");
    return type ? all.filter((m) => m.type === type) : all;
  } catch { return []; }
}

export function addMemory(input: Omit<MemoryEntry, "id" | "accessCount" | "lastAccessed" | "createdAt">): MemoryEntry {
  const all = getMemoryEntries();
  const entry: MemoryEntry = { ...input, id: uid("mem"), accessCount: 0, lastAccessed: Date.now(), createdAt: Date.now() };
  all.push(entry);
  if (all.length > MAX_MEMORY_ENTRIES) all.splice(0, all.length - MAX_MEMORY_ENTRIES);
  try { localStorage.setItem(`${AI_WORKSPACE_KEY}_memory`, JSON.stringify(all)); } catch { /* ignore */ }
  return entry;
}

export function searchMemory(query: string, limit = 10): MemoryEntry[] {
  const all = getMemoryEntries();
  const q = query.toLowerCase();
  return all
    .filter((m) => m.key.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)))
    .sort((a, b) => b.importance - a.importance || b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function getMemoryStats() {
  const all = getMemoryEntries();
  return {
    total: all.length,
    byType: {
      short_term: all.filter((m) => m.type === "short_term").length,
      long_term: all.filter((m) => m.type === "long_term").length,
      semantic: all.filter((m) => m.type === "semantic").length,
      business: all.filter((m) => m.type === "business").length,
      conversation: all.filter((m) => m.type === "conversation").length,
      project: all.filter((m) => m.type === "project").length,
    },
    highImportance: all.filter((m) => m.importance >= 4).length,
    avgAccessCount: all.length ? Math.round(all.reduce((s, m) => s + m.accessCount, 0) / all.length) : 0,
  };
}



/* ================================================================== */
/*  MODULE 4: AI DECISION ENGINE                                       */
/* ================================================================== */

export interface DecisionPolicy {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: DecisionRule[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface DecisionRule {
  id: string;
  condition: string;
  action: string;
  weight: number;
  priority: number;
}

export interface DecisionLog {
  id: string;
  policyId: string;
  policyName: string;
  input: Record<string, unknown>;
  decision: string;
  confidence: number;
  appliedRules: string[];
  durationMs: number;
  requiresApproval: boolean;
  approved: boolean;
  createdAt: number;
}

export function getDecisionPolicies(): DecisionPolicy[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_decisions`) || "[]"); } catch { return []; }
}

export function getDecisionLogs(limit = 50): DecisionLog[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_decision_logs`) || "[]").slice(0, limit); } catch { return []; }
}

export function evaluateDecision(policyId: string, input: Record<string, unknown>): DecisionLog | null {
  const policies = getDecisionPolicies();
  const policy = policies.find((p) => p.id === policyId);
  if (!policy || !policy.enabled) return null;
  const t0 = performance.now();
  const applied: string[] = [];
  let decision = "no_action";
  let confidence = 1;

  const sorted = [...policy.rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    // Simple condition evaluation
    const match = Object.entries(input).some(([k, v]) => rule.condition.toLowerCase().includes(k.toLowerCase()) && String(v).toLowerCase().includes(rule.condition.toLowerCase().split(":")[1]?.trim() || ""));
    if (match || rule.condition === "*") {
      applied.push(rule.id);
      decision = rule.action;
      confidence = rule.weight;
      break;
    }
  }

  const log: DecisionLog = {
    id: uid("dec_log"),
    policyId, policyName: policy.name,
    input, decision, confidence,
    appliedRules: applied,
    durationMs: Math.round(performance.now() - t0),
    requiresApproval: confidence < 0.8,
    approved: false,
    createdAt: Date.now(),
  };
  const logs = getDecisionLogs();
  logs.unshift(log);
  try { localStorage.setItem(`${AI_WORKSPACE_KEY}_decision_logs`, JSON.stringify(logs.slice(0, 200))); } catch { /* ignore */ }
  return log;
}



/* ================================================================== */
/*  MODULE 5: AI OBSERVABILITY                                        */
/* ================================================================== */

export interface AiObservabilityEvent {
  id: string;
  type: "info" | "warning" | "error" | "critical";
  source: string;
  agentName: string;
  message: string;
  details: string;
  durationMs?: number;
  tokensUsed?: number;
  cost?: number;
  metadata: Record<string, string>;
  createdAt: number;
}

export function getObservabilityEvents(limit = 100): AiObservabilityEvent[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_observability`) || "[]").slice(0, limit); } catch { return []; }
}

export function getObservabilityStats() {
  const events = getObservabilityEvents(500);
  return {
    total: events.length,
    info: events.filter((e) => e.type === "info").length,
    warning: events.filter((e) => e.type === "warning").length,
    error: events.filter((e) => e.type === "error").length,
    critical: events.filter((e) => e.type === "critical").length,
    totalTokens: events.reduce((s, e) => s + (e.tokensUsed || 0), 0),
    totalCost: parseFloat(events.reduce((s, e) => s + (e.cost || 0), 0).toFixed(4)),
  };
}



/* ================================================================== */
/*  MODULE 6: AI COST MANAGEMENT                                       */
/* ================================================================== */

export interface AiCostEntry {
  id: string;
  date: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  requests: number;
  agentName: string;
}

export function getAiCostHistory(_days = 30): AiCostEntry[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_costs`) || "[]"); } catch { return []; }
}

export function getCostStats() {
  const costs = getAiCostHistory();
  return {
    totalCost: parseFloat(costs.reduce((s, c) => s + c.cost, 0).toFixed(2)),
    totalTokensInput: costs.reduce((s, c) => s + c.tokensInput, 0),
    totalTokensOutput: costs.reduce((s, c) => s + c.tokensOutput, 0),
    totalRequests: costs.reduce((s, c) => s + c.requests, 0),
    byProvider: (() => {
      const map: Record<string, { cost: number; requests: number }> = {};
      costs.forEach((c) => {
        if (!map[c.provider]) map[c.provider] = { cost: 0, requests: 0 };
        map[c.provider].cost += c.cost;
        map[c.provider].requests += c.requests;
      });
      return map;
    })(),
  };
}


/* ================================================================== */
/*  MODULE 7: AI BUSINESS OPERATIONS                                   */
/* ================================================================== */

export interface AiBusinessInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  confidence: number;
  recommendation: string;
  metrics: Record<string, number>;
  createdAt: number;
}

export function getBusinessInsights(): AiBusinessInsight[] {
  try { return JSON.parse(localStorage.getItem(`${AI_WORKSPACE_KEY}_insights`) || "[]"); } catch { return []; }
}

export function getBusinessInsightStats() {
  const insights = getBusinessInsights();
  return {
    total: insights.length,
    critical: insights.filter((i) => i.impact === "critical").length,
    high: insights.filter((i) => i.impact === "high").length,
    medium: insights.filter((i) => i.impact === "medium").length,
    low: insights.filter((i) => i.impact === "low").length,
    avgConfidence: insights.length ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length) : 0,
  };
}

/* ================================================================== */
/*  MODULE 8: AI WORKSPACE STATS                                       */
/* ================================================================== */

export interface AiWorkspaceStats {
  agentCount: number;
  activeAgentCount: number;
  taskCount: number;
  pendingTaskCount: number;
  memoryCount: number;
  decisionPolicyCount: number;
  insightCount: number;
  observabilityEventCount: number;
  totalCost: number;
  totalTokens: number;
  totalTasksCompleted: number;
  avgSuccessRate: number;
}

export function getAiWorkspaceStats(): AiWorkspaceStats {
  const agentStats = getAgentRegistryStats();
  const taskStats = getTaskStats();
  const memory = getMemoryStats();
  const policies = getDecisionPolicies();
  const insights = getBusinessInsights();
  const obs = getObservabilityStats();
  const cost = getCostStats();

  return {
    agentCount: agentStats.total,
    activeAgentCount: agentStats.active,
    taskCount: taskStats.total,
    pendingTaskCount: taskStats.pending + taskStats.inProgress,
    memoryCount: memory.total,
    decisionPolicyCount: policies.length,
    insightCount: insights.length,
    observabilityEventCount: obs.total,
    totalCost: cost.totalCost,
    totalTokens: cost.totalTokensInput + cost.totalTokensOutput,
    totalTasksCompleted: agentStats.totalTasksCompleted,
    avgSuccessRate: agentStats.avgSuccessRate,
  };
}
