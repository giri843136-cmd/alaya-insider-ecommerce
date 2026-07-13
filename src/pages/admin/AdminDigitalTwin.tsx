/**
 * ALAYA INSIDER — Digital Twin (PART 3.8)
 * Enterprise digital twin for business, customer, commerce, marketing,
 * infrastructure, workflow, and AI domains.
 */
import { useState, useMemo } from "react";
import { Activity, Server, Globe, Users, ShoppingBag, Workflow, Cpu } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getCurrentDigitalTwin, type DigitalTwinDomain } from "../../lib/executiveIntelligence";

const DOMAIN_CONFIG: { id: DigitalTwinDomain; label: string; icon: typeof Activity; color: string }[] = [
  { id: "business", label: "Business", icon: Activity, color: "text-accent" },
  { id: "customer", label: "Customer", icon: Users, color: "text-success" },
  { id: "commerce", label: "Commerce", icon: ShoppingBag, color: "text-warning" },
  { id: "marketing", label: "Marketing", icon: Globe, color: "text-info" },
  { id: "infrastructure", label: "Infrastructure", icon: Server, color: "text-danger" },
  { id: "workflow", label: "Workflow", icon: Workflow, color: "text-accent" },
  { id: "ai", label: "AI", icon: Cpu, color: "text-info" },
];

export default function AdminDigitalTwin() {
  const [domain, setDomain] = useState<DigitalTwinDomain | "all">("all");
  const snapshots = useMemo(() => getCurrentDigitalTwin(), []);

  const filtered = domain === "all" ? snapshots : snapshots.filter((t) => t.domain === domain);

  return (
    <>
      <Seo title="Digital Twin" path="/admin/digital-twin" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Digital Twin</h1>
            <p className="mt-1 text-sm text-muted">Enterprise digital twin — real-time business simulation across all domains.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setDomain("all")} className={cn("btn-sm", domain === "all" ? "btn-primary" : "btn-ghost")}>All Twins</button>
          {DOMAIN_CONFIG.map((d) => (
            <button key={d.id} onClick={() => setDomain(d.id)} className={cn("btn-sm capitalize", domain === d.id ? "btn-primary" : "btn-ghost")}>
              <d.icon className={cn("h-4 w-4", d.color)} /> {d.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((twin) => {
            const config = DOMAIN_CONFIG.find((d) => d.id === twin.domain);
            return (
              <div key={twin.id} className="card p-5">
                <div className="flex items-center gap-3">
                  {config && <config.icon className={cn("h-6 w-6", config.color)} />}
                  <div>
                    <p className="font-semibold text-ink">{twin.name}</p>
                    <p className="text-xs text-muted">v{twin.version} · {new Date(twin.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(twin.state).map(([key, value]) => (
                    <div key={key} className="rounded bg-surface2/40 p-2 text-center">
                      <p className="font-medium text-ink">{typeof value === "number" && value > 1000 ? value.toLocaleString() : value}</p>
                      <p className="text-muted capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-1">
                  {twin.metrics.map((m) => (
                    <div key={m.name} className="flex items-center justify-between rounded bg-surface2/20 px-2 py-1">
                      <span className="text-[0.55rem] text-muted">{m.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-ink">{typeof m.value === "number" && m.value > 1000 ? m.value.toLocaleString() : m.value}{m.unit === "$" ? "" : m.unit === "%" ? "%" : ""}{m.unit === "$" && m.value > 0 ? `$${m.value.toLocaleString()}` : ""}</span>
                        <span className={m.trend === "up" ? "text-success" : m.trend === "down" ? "text-danger" : "text-muted"}>
                          {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <EmptyState icon={<Activity className="h-6 w-6" />} title="No snapshots" description="No digital twin data available for this domain." />}
      </div>
    </>
  );
}
