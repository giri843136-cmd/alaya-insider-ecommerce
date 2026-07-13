/**
 * ALAYA INSIDER — AI Agent Registry (PART 3.7)
 * Agent marketplace, templates, builder, and enterprise AI employees.
 */
import { useMemo, useState } from "react";
import { Bot, Cpu, Plus, Play, Pause, ShoppingBag, Users, Star, TrendingUp, Shield, Search, Award, Activity, DollarSign, Handshake, FileText, Megaphone, Smile, BarChart3, Code2, ShieldCheck, Server, Brain } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getAgentRegistry, getAgentTemplates, getAgentRegistryStats, addAgentFromTemplate, updateAgentInRegistry, type AiAgentRole } from "../../lib/aiWorkspace";
import { AiAgentCard } from "../../components/ai/AiAgentCard";

type AgentTab = "registry" | "marketplace" | "employees";

const EMPLOYEE_ROLES: { role: AiAgentRole; icon: typeof Bot; description: string }[] = [
  { role: "ceo", icon: Award, description: "Strategic oversight and growth" },
  { role: "coo", icon: Activity, description: "Operations and efficiency" },
  { role: "cto", icon: Cpu, description: "Technology and AI infrastructure" },
  { role: "cmo", icon: TrendingUp, description: "Marketing and brand growth" },
  { role: "cfo", icon: DollarSign, description: "Financial planning and forecasting" },
  { role: "operations_manager", icon: Activity, description: "Daily operations management" },
  { role: "affiliate_manager", icon: Handshake, description: "Affiliate partner optimization" },
  { role: "commerce_manager", icon: ShoppingBag, description: "Commerce and product strategy" },
  { role: "editorial_manager", icon: FileText, description: "Content and editorial planning" },
  { role: "seo_manager", icon: Search, description: "SEO and content optimization" },
  { role: "marketing_manager", icon: Megaphone, description: "Campaign and audience management" },
  { role: "crm_manager", icon: Users, description: "Customer relationship management" },
  { role: "customer_support", icon: Smile, description: "Customer inquiry resolution" },
  { role: "analytics_ai", icon: BarChart3, description: "Data analysis and insights" },
  { role: "developer_ai", icon: Code2, description: "Development and automation" },
  { role: "qa_ai", icon: Shield, description: "Quality assurance and testing" },
  { role: "security_ai", icon: ShieldCheck, description: "Security monitoring and compliance" },
  { role: "infrastructure_ai", icon: Server, description: "Infrastructure and platform health" },
  { role: "legal_ai", icon: Shield, description: "Legal review and compliance" },
  { role: "compliance_ai", icon: ShieldCheck, description: "Regulatory compliance" },
  { role: "knowledge_manager", icon: Brain, description: "Knowledge management and curation" },
];

export default function AdminAiAgentRegistry() {
  const [tab, setTab] = useState<AgentTab>("registry");
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const agents = useMemo(() => getAgentRegistry(), []);
  const templates = useMemo(() => getAgentTemplates(), []);
  const stats = useMemo(() => getAgentRegistryStats(), []);

  const handleToggleAgent = (id: string) => {
    const a = agents.find((x) => x.id === id);
    if (!a) return;
    updateAgentInRegistry(id, { status: a.status === "active" ? "paused" : "active" });
    refresh();
  };

  const handleAddFromTemplate = (templateId: string) => {
    addAgentFromTemplate(templateId);
    refresh();
  };

  return (
    <>
      <Seo title="AI Agent Registry" path="/admin/ai-agent-registry" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">AI Agent Registry</h1>
            <p className="mt-1 text-sm text-muted">Agent marketplace, templates, and enterprise AI employee management.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {([["registry", "Registry", Bot], ["marketplace", "Marketplace", ShoppingBag], ["employees", "AI Employees", Award]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("btn-sm capitalize", tab === id ? "btn-primary" : "btn-ghost")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "registry" && (
          <div className="mt-6">
            <div className="flex items-center gap-4 text-sm text-muted mb-4">
              <span>{stats.total} agents</span>
              <span className="text-success">{stats.active} active</span>
              <span>{stats.paused} paused</span>
              {stats.error > 0 && <span className="text-danger">{stats.error} error</span>}
              <span>{stats.totalTasksCompleted.toLocaleString()} tasks completed</span>
              <span>{stats.avgSuccessRate}% avg success</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {agents.map((a) => (
                <AiAgentCard key={a.id} agent={a} onToggle={() => handleToggleAgent(a.id)} />
              ))}
              {agents.length === 0 && <EmptyState icon={<Bot className="h-6 w-6" />} title="No agents" description="Add agents from the marketplace tab." />}
            </div>
          </div>
        )}

        {tab === "marketplace" && (
          <div className="mt-6">
            <p className="text-sm text-muted mb-4">{templates.length} agent templates available. Click to add to your registry.</p>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => {
                const alreadyAdded = agents.some((a) => a.role === t.role);
                return (
                  <div key={t.id} className={cn("card p-4", alreadyAdded && "opacity-50")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
                          <Bot className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{t.name}</p>
                          <p className="text-xs text-muted capitalize">{t.role.replace(/_/g, " ")} · {t.tier}</p>
                        </div>
                      </div>
                      {!alreadyAdded ? (
                        <button onClick={() => handleAddFromTemplate(t.id)} className="btn-primary btn-xs"><Plus className="h-3 w-3" /> Add</button>
                      ) : (
                        <Badge variant="success">Added</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted">{t.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.capabilities.slice(0, 4).map((c) => (
                        <span key={c} className="badge bg-surface2 text-[0.55rem] text-muted">{c.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[0.55rem] text-muted">
                      <Star className="h-2.5 w-2.5 text-warning" />
                      <span>{t.popularity}% popularity</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "employees" && (
          <div className="mt-6">
            <p className="text-sm text-muted mb-4">Enterprise AI Employees available for your organization.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {EMPLOYEE_ROLES.map((emp) => {
                const Icon = emp.icon;
                const existing = agents.find((a) => a.role === emp.role);
                return (
                  <div key={emp.role} className={cn("card p-4", existing?.status === "active" && "border-success/30")}>
                    <div className="flex items-center gap-3">
                      <span className={cn("grid h-9 w-9 place-items-center rounded-full", existing ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink capitalize">{emp.role.replace(/_/g, " ")} AI</p>
                        <p className="text-[0.55rem] text-muted">{emp.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {existing ? (
                        <button onClick={() => handleToggleAgent(existing.id)} className={cn("btn-xs flex items-center gap-1", existing.status === "active" ? "btn-outline" : "btn-primary")}>
                          {existing.status === "active" ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Activate</>}
                        </button>
                      ) : (
                        <span className="text-[0.55rem] text-muted">Not deployed</span>
                      )}
                      {existing && <Badge variant={existing.status === "active" ? "success" : "neutral"}>{existing.status}</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

