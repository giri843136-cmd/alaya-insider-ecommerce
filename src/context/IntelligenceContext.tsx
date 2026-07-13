/**
 * ALAYA INSIDER — Intelligence Platform React Context
 * Bridges the multi-agent, knowledge graph, LLM gateway, RAG, governance, and ML engines to React UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAgents, updateAgent, getAgentStats,
  getKnowledgeNodes, getKnowledgeEdges, getKnowledgeStats, searchKnowledge,
  getModels, updateModel, getModelStats,
  getRagDocuments, getRagStats,
  getPrompts, getPromptStats,
  getAiAuditLogs, getAiAuditStats,
  getMlModels, getForecasts, getMlStats,
  getAssistants,
  getAiPlatformMetrics,
  type AiAgent,
  type KnowledgeNode, type KnowledgeEdge,
  type AiModel,
  type RagDocument,
  type PromptEntry,
  type AiAuditEntry,
  type MlModel, type Forecast,
  type AiAssistant,
  type AiPlatformMetric,
} from "../lib/intelligence";

/* ================================================================== */
/*  CONTEXT                                                            */
/* ================================================================== */

interface IntelligenceContextValue {
  agents: AiAgent[];
  agentStats: ReturnType<typeof getAgentStats>;
  updateAgentById: (id: string, patch: Partial<AiAgent>) => AiAgent | null;

  knowledgeNodes: KnowledgeNode[];
  knowledgeEdges: KnowledgeEdge[];
  knowledgeStats: ReturnType<typeof getKnowledgeStats>;
  searchKnowledgeBase: (query: string) => KnowledgeNode[];

  models: AiModel[];
  modelStats: ReturnType<typeof getModelStats>;
  updateModelById: (id: string, patch: Partial<AiModel>) => AiModel | null;

  ragDocuments: RagDocument[];
  ragStats: ReturnType<typeof getRagStats>;

  prompts: PromptEntry[];
  promptStats: ReturnType<typeof getPromptStats>;

  auditLogs: AiAuditEntry[];
  auditStats: ReturnType<typeof getAiAuditStats>;

  mlModels: MlModel[];
  forecasts: Forecast[];
  mlStats: ReturnType<typeof getMlStats>;

  assistants: AiAssistant[];

  metrics: AiPlatformMetric[];

  refresh: () => void;
}

const IntelligenceContext = createContext<IntelligenceContextValue | null>(null);

export function useIntelligence() {
  const ctx = useContext(IntelligenceContext);
  if (!ctx) throw new Error("useIntelligence must be used within <IntelligenceProvider>");
  return ctx;
}

/* ================================================================== */
/*  PROVIDER                                                           */
/* ================================================================== */

export function IntelligenceProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [agents, setAgents] = useState(() => getAgents());
  const [agentStats, setAgentStats] = useState(() => getAgentStats());
  const [knowledgeNodes, setKnowledgeNodes] = useState(() => getKnowledgeNodes());
  const [knowledgeEdges, setKnowledgeEdges] = useState(() => getKnowledgeEdges());
  const [knowledgeStats, setKnowledgeStats] = useState(() => getKnowledgeStats());
  const [models, setModels] = useState(() => getModels());
  const [modelStats, setModelStats] = useState(() => getModelStats());
  const [ragDocuments, setRagDocuments] = useState(() => getRagDocuments());
  const [ragStats, setRagStats] = useState(() => getRagStats());
  const [prompts, setPrompts] = useState(() => getPrompts());
  const [promptStats, setPromptStats] = useState(() => getPromptStats());
  const [auditLogs, setAuditLogs] = useState(() => getAiAuditLogs());
  const [auditStats, setAuditStats] = useState(() => getAiAuditStats());
  const [mlModels, setMlModels] = useState(() => getMlModels());
  const [forecasts, setForecasts] = useState(() => getForecasts());
  const [mlStats, setMlStats] = useState(() => getMlStats());
  const [assistants, setAssistants] = useState(() => getAssistants());
  const [metrics, setMetrics] = useState(() => getAiPlatformMetrics());

  const doRefresh = useCallback(() => {
    setAgents(getAgents());
    setAgentStats(getAgentStats());
    setKnowledgeNodes(getKnowledgeNodes());
    setKnowledgeEdges(getKnowledgeEdges());
    setKnowledgeStats(getKnowledgeStats());
    setModels(getModels());
    setModelStats(getModelStats());
    setRagDocuments(getRagDocuments());
    setRagStats(getRagStats());
    setPrompts(getPrompts());
    setPromptStats(getPromptStats());
    setAuditLogs(getAiAuditLogs());
    setAuditStats(getAiAuditStats());
    setMlModels(getMlModels());
    setForecasts(getForecasts());
    setMlStats(getMlStats());
    setAssistants(getAssistants());
    setMetrics(getAiPlatformMetrics());
    refresh();
  }, [refresh]);

  const updateAgentById = useCallback((id: string, patch: Partial<AiAgent>) => {
    const result = updateAgent(id, patch);
    doRefresh();
    return result;
  }, [doRefresh]);

  const updateModelById = useCallback((id: string, patch: Partial<AiModel>) => {
    const result = updateModel(id, patch);
    doRefresh();
    return result;
  }, [doRefresh]);

  const searchKnowledgeBase = useCallback((query: string) => searchKnowledge(query), []);

  const value = useMemo<IntelligenceContextValue>(() => ({
    agents, agentStats, updateAgentById,
    knowledgeNodes, knowledgeEdges, knowledgeStats, searchKnowledgeBase,
    models, modelStats, updateModelById,
    ragDocuments, ragStats,
    prompts, promptStats,
    auditLogs, auditStats,
    mlModels, forecasts, mlStats,
    assistants,
    metrics,
    refresh: doRefresh,
  }), [
    agents, agentStats, updateAgentById,
    knowledgeNodes, knowledgeEdges, knowledgeStats, searchKnowledgeBase,
    models, modelStats, updateModelById,
    ragDocuments, ragStats,
    prompts, promptStats,
    auditLogs, auditStats,
    mlModels, forecasts, mlStats,
    assistants,
    metrics,
    doRefresh,
  ]);

  return <IntelligenceContext.Provider value={value}>{children}</IntelligenceContext.Provider>;
}
