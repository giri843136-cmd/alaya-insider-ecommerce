# ALAYA INSIDER — AI Workspace Guide

> **Target audience**: AI operators, ML engineers.
> **Last updated**: July 2026

---

## 1. AI Architecture Overview

The AI Workspace is a **simulated AI platform** — it provides the full management UI and data models for AI operations without requiring actual API calls to LLM providers. All AI agents, knowledge graphs, and task management are in-memory data structures with realistic simulation.

```
┌──────────────────────────────────────────────┐
│                AI Workspace                   │
├──────────┬──────────┬──────────┬─────────────┤
│  Agent   │  Task    │ Knowledge│  Model      │
│  Registry│  Manager │  Platform│  Management │
├──────────┴──────────┴──────────┴─────────────┤
│            Intelligence Context                │
│  (src/context/IntelligenceContext.tsx)         │
├──────────────────────────────────────────────┤
│           AI Library Layer                     │
│  (src/lib/intelligence.ts, aiWorkspace.ts)     │
└──────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/intelligence.ts` | Core AI types, agent management, knowledge graph, RAG, model routing |
| `src/lib/aiWorkspace.ts` | AI workspace engine (agent registry, task management, memory, decisions, observability, cost) |
| `src/context/IntelligenceContext.tsx` | React context providing AI state to components |
| `src/lib/ai.ts` | AI content generation helpers (product descriptions, FAQs, features) |

---

## 2. Agent Registry

Agents are AI workers with specific capabilities and roles.

### Agent Capabilities

```
content, search, seo, analytics, customer, affiliate,
supplier, inventory, pricing, marketing, support,
finance, translation, developer, workflow
```

### Agent Status

| Status | Description |
|--------|-------------|
| `idle` | Available for work |
| `running` | Currently executing a task |
| `paused` | Temporarily suspended |
| `error` | Failed with an error |
| `completed` | Finished its assigned task |

### Managing Agents

Access at **Admin → AI Workspace → Agent Registry** (`/#/admin/ai-agent-registry`):

- **View agents**: See all registered agents, their status, capabilities, and performance metrics
- **Add agent**: Create from templates or configure custom agents
- **Update agent**: Modify agent configuration, assign new capabilities
- **Monitor**: View agent execution history, success rates, and costs

---

## 3. Task Management

Access at **Admin → AI Workspace → Task Manager** (`/#/admin/ai-task-manager`):

### Task States

```
pending → running → completed
                ↓
              failed
```

### Creating Tasks

Tasks can be created manually or through workflows:
1. Select target agent
2. Define task parameters (model, prompt, input data)
3. Set priority and scheduling
4. Monitor execution in the task queue

### Task Types

- Content generation (descriptions, articles, social posts)
- Data analysis and reporting
- Search and retrieval
- Decision support
- Workflow automation

---

## 4. Knowledge Platform

Access at **Admin → AI Workspace → Knowledge Platform** (`/#/admin/ai-knowledge`):

### Knowledge Graph

A directed graph with:

- **Nodes**: Concepts, entities, documents, products, customers, orders, policies, insights, workflows, metrics
- **Edges**: Relationships between nodes (typed and weighted)

**Visualization**: The knowledge graph is displayed as an interactive force-directed graph showing connected nodes and their relationships.

### Memory

Agent memory entries with:
- **Episodic memory**: Task execution history and results
- **Semantic memory**: Facts, knowledge, and learned information
- **Procedural memory**: Workflow patterns and successful strategies

### RAG (Retrieval-Augmented Generation)

Document management:
- Upload and chunk documents
- Index documents for retrieval
- Query documents using semantic search (simulated)

### Decision Engine

Rule-based decision framework:
- Decision policies with conditions and outcomes
- Decision logs for audit trail
- Policy simulation and testing

---

## 5. Model Management

### Model Registry

| Provider | Models | Capabilities |
|----------|--------|-------------|
| OpenAI | GPT-4o, GPT-4o-mini | text, code, vision, reasoning |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku | text, reasoning |
| Google | Gemini 1.5 Pro | text, vision, reasoning |
| DeepSeek | DeepSeek V3 | text, code, reasoning |

Configured in `src/lib/intelligence.ts`. Models have configurable:
- **Latency**: Simulated response time
- **Cost**: Per-token or per-request cost
- **Rate limits**: Max requests per minute
- **Status**: Enabled/disabled/error

### Model Routing

Automatic routing selects the optimal model based on:
- Task type and complexity
- Required capabilities
- Cost constraints
- Current model availability

---

## 6. Observability

Access at **Admin → AI Workspace → AI Observability** (`/#/admin/ai-observability`):

### Metrics Tracked

| Metric | Description |
|--------|-------------|
| Total requests | Aggregate AI operation count |
| Success rate | Percentage of successful operations |
| Avg latency | Average response time (simulated) |
| Monthly cost | Estimated AI provider costs |
| Token usage | Total tokens consumed |
| Error rate | Percentage of failed operations |

### Cost Breakdown

Per-agent and per-model cost tracking with:
- Daily/weekly/monthly views
- Cost by capability type
- Anomaly detection for unusual spending patterns

---

## 7. AI Business Operations

Access at **Admin → AI Workspace → AI Business Ops** (`/#/admin/ai-business-ops`):

AI-powered business insights:
- **Revenue intelligence**: AI analysis of revenue trends and anomalies
- **Affiliate insights**: Partner performance analysis
- **SEO recommendations**: Content optimization suggestions
- **Customer insights**: Behavior patterns and predictions

---

## 8. Decision Intelligence

Access at **Admin → Executive → Decision Intelligence** (`/#/admin/decision-intelligence`):

### Scenario Planning

- Create what-if scenarios with adjustable parameters
- Simulate outcomes based on historical data
- Compare multiple scenarios side-by-side

### Decision Log

A complete audit trail of:
- Strategic decisions made
- Supporting data and analysis
- Expected and actual outcomes
- Responsible stakeholders
