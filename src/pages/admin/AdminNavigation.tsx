import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import {
  getDefaultNavConfigs,
  getNavigationStats,
  getAISuggestion,
} from "../../lib/navigationPlatform";
import { cn } from "@/utils/cn";

export default function AdminNavigation() {
  const { categories, brands, articles, products } = useStore();
  const [activeConfig, setActiveConfig] = useState("primary");

  const configs = useMemo(
    () => getDefaultNavConfigs(categories, brands, articles),
    [categories, brands, articles]
  );

  const stats = useMemo(
    () => getNavigationStats(configs, categories, brands, articles),
    [configs, categories, brands, articles]
  );

  const aiSuggestion = useMemo(
    () => getAISuggestion(configs, products),
    [configs, products]
  );

  const currentConfig = configs.find((c) => c.id === activeConfig) || configs[0];

  return (
    <>
      <Seo title="Navigation" path="/admin/navigation" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Navigation</h1>
            <p className="mt-1 text-sm text-muted">Manage your store's navigation, mega menus, and information architecture.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Navigation configs", value: stats.totalConfigs, icon: Layers },
            { label: "Menu groups", value: stats.totalGroups, icon: Layers },
            { label: "Navigation items", value: stats.totalNavItems, icon: ExternalLink },
            { label: "AI health score", value: `${aiSuggestion.score}%`, icon: BarChart3 },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        {/* AI Suggestions */}
        {aiSuggestion.suggestions.length > 0 && (
          <div className="card mt-6 border-accent/30 bg-accent-soft/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <BarChart3 className="h-4 w-4" /> AI Suggestions
            </div>
            <ul className="mt-2 space-y-1">
              {aiSuggestion.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Config tabs */}
        <div className="mt-8 flex gap-2 border-b border-line pb-3">
          {configs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConfig(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeConfig === c.id ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2"
              )}
            >
              {c.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {c.name}
            </button>
          ))}
        </div>

        {/* Current config detail */}
        <div className="mt-6 space-y-6">
          {currentConfig.groups.map((group) => (
            <div key={group.id} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Layers className="h-4 w-4 text-accent" /> {group.label}
                  <span className="text-xs text-muted">({group.items.length} items)</span>
                </h3>
                {group.columns && (
                  <span className="text-xs text-muted">{group.columns} columns</span>
                )}
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: group.columns ? `repeat(${group.columns}, 1fr)` : "repeat(3, 1fr)" }}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex items-center gap-3 rounded-lg border border-line p-3 transition-colors hover:border-accent"
                  >
                    {item.image && (
                      <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        {item.label}
                        {item.badge && (
                          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-accent">
                            {item.badge}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-muted">{item.href}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
