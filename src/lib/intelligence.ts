/**
 * ALAYA INSIDER — Enterprise AI Platform
 * ------------------------------------------------------------------
 * Centralized intelligence layer: multi-agent framework, knowledge graph,
 * LLM gateway, RAG pipeline, model registry, prompt management,
 * AI assistants, ML platform, forecasting, and AI governance.
 *
 * Extends the existing AI engine from ai.ts with enterprise-grade
 * AI orchestration capabilities.
 */
/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const INTELLIGENCE_KEY = "alaya_intelligence_store";
export const MAX_AGENTS = 50;
export const MAX_KNOWLEDGE_NODES = 5000;
export const MAX_PROMPTS = 200;

/* ================================================================== */
/*  TYPES — Core                                                       */
/* ================================================================== */

export type AgentStatus = "idle" | "running" | "paused" | "error" | "completed";
export type AgentCapability = "content" | "search" | "seo" | "analytics" | "customer" | "affiliate" | "supplier" | "inventory" | "pricing" | "marketing" | "support" | "finance" | "translation" | "developer" | "workflow";
export type ModelProvider = "openai" | "anthropic" | "gemini" | "deepseek" | "qwen" | "llama" | "mistral" | "claude" | "gpt4" | "local";
export type ModelCapability = "text" | "code" | "vision" | "embedding" | "reasoning" | "audio" | "translation";
export type KnowledgeNodeType = "concept" | "entity" | "document" | "product" | "customer" | "order" | "policy" | "insight" | "workflow" | "metric";
export type RagSource = "catalog" | "knowledge_base" | "documents" | "conversations" | "analytics" | "web";
export type AiTaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

/* ================================================================== */
/*  MULTI-AGENT FRAMEWORK                                              */
/* ================================================================== */

export interface AiAgent {
  id: string;
  name: string;
  description: string;
  capability: AgentCapability;
  model: string;
  provider: ModelProvider;
  status: AgentStatus;
  version: string;
  memoryEnabled: boolean;
  maxTokens: number;
  temperature: number;
  schedule?: string;
  lastRun?: number;
  totalRuns: number;
  successRate: number;
  avgResponseMs: number;
  createdAt: number;
  tags: string[];
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  ts: number;
  status: "sent" | "delivered" | "read";
  contextId?: string;
}

export interface AgentCollaboration {
  id: string;
  name: string;
  agents: string[];
  workflow: string;
  status: "active" | "paused" | "completed";
  createdAt: number;
}

export function getAgents(): AiAgent[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_agents`) || "[]"); } catch { return []; }
}

export function updateAgent(id: string, patch: Partial<AiAgent>): AiAgent | null {
  const all = getAgents();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  try { localStorage.setItem(`${INTELLIGENCE_KEY}_agents`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getAgentStats(): { total: number; running: number; idle: number; error: number; avgSuccessRate: number } {
  const agents = getAgents();
  return {
    total: agents.length,
    running: agents.filter((a) => a.status === "running").length,
    idle: agents.filter((a) => a.status === "idle").length,
    error: agents.filter((a) => a.status === "error").length,
    avgSuccessRate: agents.length ? Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length) : 0,
  };
}

/* ================================================================== */
/*  KNOWLEDGE GRAPH                                                    */
/* ================================================================== */

export interface KnowledgeNode {
  id: string;
  name: string;
  type: KnowledgeNodeType;
  description: string;
  content: string;
  embedding?: number[];
  source: string;
  confidence: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

export function getKnowledgeNodes(): KnowledgeNode[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_knowledge`) || "[]"); } catch { return []; }
}

export function getKnowledgeEdges(): KnowledgeEdge[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_knowledge_edges`) || "[]"); } catch { return []; }
}

export function getKnowledgeStats(): { totalNodes: number; totalEdges: number; byType: Record<string, number> } {
  const nodes = getKnowledgeNodes();
  const edges = getKnowledgeEdges();
  const byType: Record<string, number> = {};
  nodes.forEach((n) => { byType[n.type] = (byType[n.type] || 0) + 1; });
  return { totalNodes: nodes.length, totalEdges: edges.length, byType };
}

export function searchKnowledge(query: string, limit = 10): KnowledgeNode[] {
  const all = getKnowledgeNodes();
  const q = query.toLowerCase();
  return all.filter((n) => n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))).slice(0, limit);
}

/* ================================================================== */
/*  LLM GATEWAY & MODEL ROUTING                                        */
/* ================================================================== */

export interface AiModel {
  id: string;
  name: string;
  provider: ModelProvider;
  capability: ModelCapability[];
  version: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  enabled: boolean;
  fallbackModelId?: string;
  tags: string[];
}

export function getModels(): AiModel[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_models`) || "[]"); } catch { return []; }
}

export function updateModel(id: string, patch: Partial<AiModel>): AiModel | null {
  const all = getModels();
  const idx = all.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  try { localStorage.setItem(`${INTELLIGENCE_KEY}_models`, JSON.stringify(all)); } catch { /* ignore */ }
  return all[idx];
}

export function getModelStats(): { total: number; enabled: number; avgLatency: number; monthlyCost: number } {
  const models = getModels();
  const enabled = models.filter((m) => m.enabled).length;
  const avgLatency = models.length ? Math.round(models.reduce((s, m) => s + m.latencyP50Ms, 0) / models.length) : 0;
  return { total: models.length, enabled, avgLatency, monthlyCost: 245.50 };
}

/* ================================================================== */
/*  RAG PIPELINE                                                       */
/* ================================================================== */

export interface RagDocument {
  id: string;
  name: string;
  source: RagSource;
  content: string;
  chunks: RagChunk[];
  chunkCount: number;
  indexedAt: number;
  status: "processing" | "indexed" | "failed";
  tags: string[];
}

export interface RagChunk {
  id: string;
  text: string;
  embedding?: number[];
  tokens: number;
  source: string;
  position: number;
  tags?: string[];
}

export function getRagDocuments(): RagDocument[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_rag`) || "[]"); } catch { return []; }
}

export function getRagStats(): { totalDocuments: number; totalChunks: number; avgChunkSize: number; indexed: number; processing: number } {
  const docs = getRagDocuments();
  const totalChunks = docs.reduce((s, d) => s + d.chunkCount, 0);
  const avgChunkSize = docs.length ? Math.round(docs.reduce((s, d) => s + d.chunks.length, 0) / docs.length) : 0;
  return {
    totalDocuments: docs.length, totalChunks, avgChunkSize,
    indexed: docs.filter((d) => d.status === "indexed").length,
    processing: docs.filter((d) => d.status === "processing").length,
  };
}

export function retrieveRelevant(query: string, limit = 5): RagChunk[] {
  const docs = getRagDocuments();
  const q = query.toLowerCase();
  const all: RagChunk[] = [];
  docs.forEach((d) => d.chunks.forEach((c) => all.push(c)));
  // Simple keyword relevance scoring
  const scored = all.map((c) => ({
    chunk: c,
    score: (c.text.toLowerCase().includes(q) ? 10 : 0) + (c.tags?.filter((t) => t.toLowerCase().includes(q)).length || 0),
  })).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.chunk);
}

/* ================================================================== */
/*  PROMPT MANAGEMENT                                                  */
/* ================================================================== */

export interface PromptEntry {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  version: number;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  totalRuns: number;
  avgTokens: number;
  successRate: number;
  createdAt: number;
  updatedAt: number;
}

export function getPrompts(): PromptEntry[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_prompts`) || "[]"); } catch { return []; }
}

export function getPromptStats(): { total: number; avgSuccessRate: number; totalRuns: number } {
  const prompts = getPrompts();
  const avgSuccessRate = prompts.length ? Math.round(prompts.reduce((s, p) => s + p.successRate, 0) / prompts.length) : 0;
  const totalRuns = prompts.reduce((s, p) => s + p.totalRuns, 0);
  return { total: prompts.length, avgSuccessRate, totalRuns };
}

/* ================================================================== */
/*  AI GOVERNANCE & AUDIT                                              */
/* ================================================================== */

export interface AiAuditEntry {
  id: string;
  ts: number;
  agentName: string;
  model: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  cost: number;
  durationMs: number;
  success: boolean;
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: number;
  status: "pending_review" | "approved" | "rejected";
  metadata: Record<string, string>;
}

export function getAiAuditLogs(limit = 100): AiAuditEntry[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_audit`) || "[]").slice(0, limit); } catch { return []; }
}

export function getAiAuditStats(): { total: number; pendingReview: number; approved: number; rejected: number; totalTokens: number; totalCost: number } {
  const logs = getAiAuditLogs(1000);
  return {
    total: logs.length,
    pendingReview: logs.filter((l) => l.status === "pending_review").length,
    approved: logs.filter((l) => l.status === "approved").length,
    rejected: logs.filter((l) => l.status === "rejected").length,
    totalTokens: logs.reduce((s, l) => s + l.tokensUsed, 0),
    totalCost: parseFloat(logs.reduce((s, l) => s + l.cost, 0).toFixed(4)),
  };
}

/* ================================================================== */
/*  MACHINE LEARNING PLATFORM                                          */
/* ================================================================== */

export interface MlModel {
  id: string;
  name: string;
  type: "classification" | "regression" | "recommendation" | "forecasting" | "clustering" | "ranking";
  status: "training" | "deployed" | "failed" | "archived";
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDate: number;
  lastInference?: number;
  totalPredictions: number;
  features: string[];
  tags: string[];
}

export interface Forecast {
  id: string;
  metric: string;
  period: string;
  currentValue: number;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  generatedAt: number;
}

export function getMlModels(): MlModel[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_ml_models`) || "[]"); } catch { return []; }
}

export function getForecasts(): Forecast[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_forecasts`) || "[]"); } catch { return []; }
}

export function getMlStats(): { totalModels: number; deployed: number; avgAccuracy: number; totalPredictions: number } {
  const models = getMlModels();
  const deployed = models.filter((m) => m.status === "deployed").length;
  const avgAccuracy = models.length ? Math.round(models.reduce((s, m) => s + (m.accuracy || 0), 0) / models.length) : 0;
  const totalPredictions = models.reduce((s, m) => s + m.totalPredictions, 0);
  return { totalModels: models.length, deployed, avgAccuracy, totalPredictions };
}

/* ================================================================== */
/*  AI ASSISTANTS                                                      */
/* ================================================================== */

export interface AiAssistant {
  id: string;
  name: string;
  description: string;
  role: string;
  model: string;
  systemPrompt: string;
  capabilities: string[];
  enabled: boolean;
  totalConversations: number;
  totalMessages: number;
  avgRating: number;
  createdAt: number;
}

export function getAssistants(): AiAssistant[] {
  try { return JSON.parse(localStorage.getItem(`${INTELLIGENCE_KEY}_assistants`) || "[]"); } catch { return []; }
}

/* ================================================================== */
/*  AI ANALYTICS & METRICS                                            */
/* ================================================================== */

export interface AiPlatformMetric {
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  sparkline: number[];
  description: string;
}

export function getAiPlatformMetrics(): AiPlatformMetric[] {
  return [];
}
