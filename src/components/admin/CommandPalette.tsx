import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Package, Tags, Gem, Receipt, Ticket, Newspaper, Handshake, ScrollText, Settings, Home, Users, CreditCard, RotateCcw } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { cn } from "@/utils/cn";

interface CommandItem {
  label: string;
  hint: string;
  to: string;
  icon: typeof Search;
  group: string;
}

const NAV: CommandItem[] = [
  { label: "Dashboard", hint: "Overview", to: "/admin", icon: Home, group: "Admin" },
  { label: "Analytics", hint: "Business intelligence", to: "/admin/analytics", icon: Search, group: "Admin" },
  { label: "Homepage builder", hint: "Compose the storefront", to: "/admin/homepage", icon: Package, group: "Admin" },
  { label: "Media Library", hint: "Digital asset management", to: "/admin/media", icon: Package, group: "Admin" },
  { label: "Products", hint: "Manage catalogue", to: "/admin/products", icon: Package, group: "Admin" },
  { label: "Categories", hint: "Organise collections", to: "/admin/categories", icon: Tags, group: "Admin" },
  { label: "Brands", hint: "Manage brands", to: "/admin/brands", icon: Gem, group: "Admin" },
  { label: "Orders", hint: "Fulfil orders", to: "/admin/orders", icon: Receipt, group: "Admin" },
  { label: "Returns", hint: "Refunds & exchanges", to: "/admin/returns", icon: RotateCcw, group: "Admin" },
  { label: "Coupons", hint: "Discount codes", to: "/admin/coupons", icon: Ticket, group: "Admin" },
  { label: "Journal", hint: "Articles & guides", to: "/admin/journal", icon: Newspaper, group: "Admin" },
  { label: "Customers", hint: "Customer accounts", to: "/admin/customers", icon: Users, group: "Admin" },
  { label: "CRM", hint: "Customer 360", to: "/admin/crm", icon: Users, group: "Admin" },
  { label: "CX Platform", hint: "Customer experience & intelligence", to: "/admin/customer-experience", icon: Users, group: "Admin" },
  { label: "Affiliates", hint: "Partner networks", to: "/admin/affiliates", icon: Handshake, group: "Admin" },
  { label: "Suppliers", hint: "Fulfilment partners", to: "/admin/suppliers", icon: Package, group: "Admin" },
  { label: "Payment gateways", hint: "Checkout methods", to: "/admin/gateways", icon: CreditCard, group: "Admin" },
  { label: "Marketing", hint: "Campaigns & popups", to: "/admin/marketing", icon: Search, group: "Admin" },
  { label: "SEO Studio", hint: "Optimization hub", to: "/admin/seo", icon: Search, group: "Admin" },
  { label: "System & Backend", hint: "Health, jobs, backups", to: "/admin/system", icon: Search, group: "Admin" },
  { label: "Security Center", hint: "Sessions, audit, policies", to: "/admin/security", icon: Search, group: "Admin" },
  { label: "AI Workspace", hint: "Assistant & automation", to: "/admin/ai", icon: Search, group: "Admin" },
  { label: "Workflows", hint: "Automation engine", to: "/admin/workflows", icon: Search, group: "Admin" },
  { label: "BPM Platform", hint: "Workflow automation & orchestration", to: "/admin/workflows-bpm", icon: Search, group: "Admin" },
  { label: "Commerce Platform", hint: "Catalog, inventory, pricing, commissions", to: "/admin/commerce-platform", icon: Search, group: "Admin" },
  { label: "Marketing Platform", hint: "Campaigns, automation, analytics, AI", to: "/admin/marketing-platform", icon: Search, group: "Admin" },
  { label: "Globalization Platform", hint: "Countries, languages, currencies, compliance", to: "/admin/globalization-platform", icon: Search, group: "Admin" },
  { label: "Governance Platform", hint: "Security, compliance, risk, audit, administration", to: "/admin/governance-platform", icon: Search, group: "Admin" },
  { label: "Developer Platform", hint: "Extensions, SDKs, CLI, generators, docs, community", to: "/admin/developer-platform", icon: Search, group: "Admin" },
  { label: "Testing Platform", hint: "QA, testing, release certification, quality", to: "/admin/testing-platform", icon: Search, group: "Admin" },
  { label: "Operations Center", hint: "Release mgmt, maintenance, DR, capacity, automation", to: "/admin/operations-platform", icon: Search, group: "Admin" },
  { label: "Content Platform", hint: "CMS, editorial, AI content, localization", to: "/admin/content-platform", icon: Search, group: "Admin" },
  { label: "Activity log", hint: "Audit trail", to: "/admin/activity", icon: ScrollText, group: "Admin" },
  { label: "Design Studio", hint: "Theme & branding", to: "/admin/design", icon: Search, group: "Admin" },
  { label: "Reviews", hint: "Product reviews & moderation", to: "/admin/reviews", icon: Search, group: "Admin" },
  { label: "Identity", hint: "Authentication & access control", to: "/admin/identity", icon: Search, group: "Admin" },
  { label: "Gateway", hint: "API gateway & webhooks", to: "/admin/gateway", icon: Search, group: "Admin" },
  { label: "Communications", hint: "Email, SMS, notifications", to: "/admin/communications", icon: Search, group: "Admin" },
  { label: "Observability", hint: "Logs, traces, monitoring, incidents", to: "/admin/observability", icon: Search, group: "Admin" },
  { label: "Data Platform", hint: "Databases, storage, backups, migrations", to: "/admin/data", icon: Search, group: "Admin" },
  { label: "AI Platform", hint: "LLMs, agents, knowledge graph", to: "/admin/intelligence", icon: Search, group: "Admin" },
  { label: "DevOps", hint: "CI/CD, environments, deployments", to: "/admin/devops", icon: Search, group: "Admin" },
  { label: "BI Platform", hint: "Business intelligence, forecasting, reports", to: "/admin/business-intelligence", icon: Search, group: "Admin" },
  { label: "Developer", hint: "API keys, integrations, SDKs", to: "/admin/developer", icon: Search, group: "Admin" },
  { label: "Navigation", hint: "Mega menu & IA", to: "/admin/navigation", icon: Search, group: "Admin" },
  { label: "Editorial", hint: "Content & publishing", to: "/admin/editorial", icon: Search, group: "Admin" },
  { label: "Authors", hint: "Author profiles", to: "/admin/authors", icon: Search, group: "Admin" },
  { label: "Taxonomy", hint: "Category architecture", to: "/admin/taxonomy", icon: Search, group: "Admin" },
  { label: "Recommendations", hint: "AI recommendation engine", to: "/admin/recommendations", icon: Search, group: "Admin" },
  { label: "Discovery", hint: "Exploration & browsing data", to: "/admin/discovery", icon: Search, group: "Admin" },
  { label: "Collection Builder", hint: "Smart & dynamic collections", to: "/admin/collection-builder", icon: Search, group: "Admin" },
  { label: "Affiliate Analytics", hint: "Affiliate performance metrics", to: "/admin/affiliate-analytics", icon: Search, group: "Admin" },
  { label: "Marketplace Registry", hint: "Affiliate network management", to: "/admin/marketplace-registry", icon: Search, group: "Admin" },
  { label: "Commission Engine", hint: "Commission rules & reports", to: "/admin/commission-engine", icon: Search, group: "Admin" },
  { label: "Price Intelligence", hint: "Price monitoring & alerts", to: "/admin/price-intelligence", icon: Search, group: "Admin" },
  { label: "Revenue Intelligence", hint: "Revenue forecasting & analytics", to: "/admin/revenue-intelligence", icon: Search, group: "Admin" },
  { label: "Conversion Optimization", hint: "A/B testing & tracking", to: "/admin/conversion-optimization", icon: Search, group: "Admin" },
  { label: "Executive Center", hint: "CEO/COO/CMO/CTO/Finance dashboards", to: "/admin/executive-center", icon: Search, group: "Admin" },
  { label: "Operations Center", hint: "Platform health & business monitoring", to: "/admin/operations-center", icon: Search, group: "Admin" },
  { label: "Notifications Center", hint: "Alerts, incidents, tasks, approvals", to: "/admin/notifications", icon: Search, group: "Admin" },
  { label: "Reporting Platform", hint: "Reports, scheduled exports, analytics", to: "/admin/reporting", icon: Search, group: "Admin" },
  { label: "AI Administration", hint: "Model, agent, prompt & governance", to: "/admin/ai-admin", icon: Search, group: "Admin" },
  { label: "Developer Tools", hint: "API keys, webhooks, system logs", to: "/admin/developer-tools", icon: Search, group: "Admin" },
  { label: "Operations Queues", hint: "Content, commerce, customer queues", to: "/admin/operations-queues", icon: Search, group: "Admin" },
  { label: "Administration", hint: "Users, roles, permissions, flags", to: "/admin/administration", icon: Settings, group: "Admin" },
  { label: "AI Workspace", hint: "Command center for AI operations", to: "/admin/ai-workspace", icon: Search, group: "Admin" },
  { label: "AI Agent Registry", hint: "Agent marketplace & AI employees", to: "/admin/ai-agent-registry", icon: Search, group: "Admin" },
  { label: "AI Task Manager", hint: "Task assignment & scheduling", to: "/admin/ai-task-manager", icon: Search, group: "Admin" },
  { label: "AI Knowledge Platform", hint: "Knowledge graph, memory, decisions", to: "/admin/ai-knowledge", icon: Search, group: "Admin" },
  { label: "AI Observability", hint: "Monitoring, cost, compliance", to: "/admin/ai-observability", icon: Search, group: "Admin" },
  { label: "AI Business Operations", hint: "Revenue, affiliate, SEO insights", to: "/admin/ai-business-ops", icon: Search, group: "Admin" },
  { label: "Executive Intelligence", hint: "CEO/COO/CMO/CTO/CFO command center", to: "/admin/executive-intelligence", icon: Search, group: "Admin" },
  { label: "Business Health", hint: "Health scoring, risk analysis, opportunities", to: "/admin/business-health", icon: Search, group: "Admin" },
  { label: "Forecasting Center", hint: "Revenue, traffic, affiliate, SEO forecasts", to: "/admin/forecasting", icon: Search, group: "Admin" },
  { label: "Decision Intelligence", hint: "Decisions, scenarios, what-if analysis", to: "/admin/decision-intelligence", icon: Search, group: "Admin" },
  { label: "Digital Twin", hint: "Enterprise simulation across all domains", to: "/admin/digital-twin", icon: Search, group: "Admin" },
  { label: "Executive Reports", hint: "Daily, weekly, monthly, quarterly, annual", to: "/admin/executive-reports", icon: Search, group: "Admin" },
  { label: "AI Executive Assistant", hint: "AI insights, advisories, recommendations", to: "/admin/executive-ai", icon: Search, group: "Admin" },
  { label: "Mobile Experience", hint: "Device detection, offline queue, capabilities", to: "/admin/mobile-experience", icon: Search, group: "Admin" },
  { label: "PWA Dashboard", hint: "Service worker, Core Web Vitals, install analytics", to: "/admin/pwa-dashboard", icon: Search, group: "Admin" },
  { label: "Synchronization", hint: "Cross-device sync, offline queue, conflict resolution", to: "/admin/synchronization", icon: Search, group: "Admin" },
  { label: "Performance Dashboard", hint: "LCP, CLS, INP, device optimization", to: "/admin/performance-dashboard", icon: Search, group: "Admin" },
  { label: "Settings", hint: "Store configuration", to: "/admin/settings", icon: Settings, group: "Admin" },
];

/** Cmd/Ctrl+K command palette for fast admin navigation. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV;
    const navMatches = NAV.filter((n) => n.label.toLowerCase().includes(q) || n.hint.toLowerCase().includes(q));
    const productMatches = products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5)
      .map<CommandItem>((p) => ({
        label: p.name, hint: `Product · ${p.brand || p.sku}`, to: `/product/${p.slug}`, icon: Package, group: "Products",
      }));
    return [...navMatches, ...productMatches];
  }, [query, products]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (item?: CommandItem) => {
    const target = item ?? results[active];
    if (!target) return;
    navigate(target.to);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); go(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="card relative z-10 w-full max-w-xl overflow-hidden p-0 animate-scale-in">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-5 w-5 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages, products… (↑↓ to navigate, ↵ to open)"
            className="flex-1 bg-transparent text-ink placeholder:text-muted focus:outline-none"
          />
          <kbd className="rounded border border-line bg-surface2 px-1.5 py-0.5 text-[0.65rem] text-muted">ESC</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">No results for “{query}”</li>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.to + i}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors", i === active ? "bg-accent-soft" : "hover:bg-surface2")}
                  >
                    <Icon className={cn("h-4 w-4", i === active ? "text-accent" : "text-muted")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                      <span className="block truncate text-xs text-muted">{item.hint}</span>
                    </span>
                    {i === active && <ArrowRight className="h-4 w-4 text-accent" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t border-line px-4 py-2 text-xs text-muted">
          <span className="font-medium text-ink">{results.length}</span> results · Press <kbd className="rounded bg-surface2 px-1 py-0.5">↵</kbd> to open
        </div>
      </div>
    </div>
  );
}
