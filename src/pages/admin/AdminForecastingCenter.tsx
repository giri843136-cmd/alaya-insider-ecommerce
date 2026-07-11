/**
 * ALAYA INSIDER — Forecasting Center (PART 3.8)
 * Revenue, traffic, affiliate, SEO, customer, AI, inventory, infrastructure, and growth forecasts.
 */
import { useState, useMemo } from "react";
import { TrendingUp, DollarSign, Globe, Search, Users, Cpu, Package, Server, Target, BarChart3, Activity } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getExecForecasts, getForecastStats } from "../../lib/executiveIntelligence";
import { formatDateTime } from "../../lib/utils";

const FORECAST_DOMAINS = [
  { id: "revenue", label: "Revenue", icon: DollarSign, color: "text-success" },
  { id: "traffic", label: "Traffic", icon: Globe, color: "text-info" },
  { id: "affiliate", label: "Affiliate", icon: TrendingUp, color: "text-accent" },
  { id: "seo", label: "SEO", icon: Search, color: "text-warning" },
  { id: "customers", label: "Customers", icon: Users, color: "text-success" },
  { id: "ai", label: "AI & Cost", icon: Cpu, color: "text-info" },
  { id: "inventory", label: "Inventory", icon: Package, color: "text-warning" },
  { id: "infrastructure", label: "Infrastructure", icon: Server, color: "text-danger" },
  { id: "growth", label: "Growth", icon: Target, color: "text-accent" },
];

export default function AdminForecastingCenter() {
  const [domain, setDomain] = useState<string>("all");
  const forecasts = useMemo(() => getExecForecasts(), []);
  const stats = useMemo(() => getForecastStats(), []);

  const filtered = domain === "all" ? forecasts : forecasts.filter((f) => f.domain === domain);

  return (
    <>
      <Seo title="Forecasting Center" path="/admin/forecasting" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Forecasting Center</h1>
            <p className="mt-1 text-sm text-muted">Enterprise forecasting across all business domains — AI-driven predictions and scenarios.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Forecasts", value: stats.total, color: "text-ink", icon: BarChart3 },
            { label: "Avg Confidence", value: `${stats.avgConfidence}%`, color: "text-accent", icon: Target },
            { label: "High Confidence", value: stats.highConfidenceCount, color: "text-success", icon: Activity },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <s.icon className={cn("h-5 w-5 mx-auto", s.color)} />
              <p className={cn("mt-2 text-xl font-semibold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-2">
          <button onClick={() => setDomain("all")} className={cn("btn-sm capitalize", domain === "all" ? "btn-primary" : "btn-ghost")}>All Domains</button>
          {FORECAST_DOMAINS.map((d) => (
            <button key={d.id} onClick={() => setDomain(d.id)} className={cn("btn-sm capitalize", domain === d.id ? "btn-primary" : "btn-ghost")}>
              <d.icon className={cn("h-4 w-4", d.color)} /> {d.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => {
            const pctChange = ((f.predictedValue - f.currentValue) / f.currentValue) * 100;
            const domainConfig = FORECAST_DOMAINS.find((d) => d.id === f.domain);
            return (
              <div key={f.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {domainConfig && <domainConfig.icon className={cn("h-5 w-5", domainConfig.color)} />}
                    <div>
                      <p className="font-semibold text-ink">{f.name}</p>
                      <p className="text-xs text-muted">{f.horizon.replace("d", " days").replace("y", " year")} · {f.methodology}</p>
                    </div>
                  </div>
                  <span className={cn("badge", f.confidence >= 0.8 ? "bg-success/15 text-success" : f.confidence >= 0.6 ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted">Current</p>
                    <p className="text-lg font-semibold text-ink">{typeof f.currentValue === "number" && f.currentValue > 1000 ? f.currentValue.toLocaleString() : f.currentValue}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <span className={cn("text-lg font-bold", pctChange >= 0 ? "text-success" : "text-danger")}>{pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange).toFixed(0)}%</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted">Predicted</p>
                    <p className="text-lg font-semibold text-ink">{typeof f.predictedValue === "number" && f.predictedValue > 1000 ? f.predictedValue.toLocaleString() : f.predictedValue}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted">Range: {typeof f.lowerBound === "number" && f.lowerBound > 1000 ? f.lowerBound.toLocaleString() : f.lowerBound} – {typeof f.upperBound === "number" && f.upperBound > 1000 ? f.upperBound.toLocaleString() : f.upperBound}</p>
                  <div className="mt-1 h-2 rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${((f.predictedValue - f.lowerBound) / (f.upperBound - f.lowerBound)) * 100}%` }} />
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-[0.55rem] font-medium text-muted">Drivers & Risks</summary>
                  <div className="mt-2 space-y-1">
                    {f.drivers.length > 0 && <p className="text-[0.55rem] text-success">Drivers: {f.drivers.join(", ")}</p>}
                    {f.risks.length > 0 && <p className="text-[0.55rem] text-danger">Risks: {f.risks.join(", ")}</p>}
                  </div>
                </details>

                {/* Data Point Bar Chart */}
                <div className="mt-3 flex items-end gap-0.5 h-8">
                  {f.dataPoints.slice(-14).map((dp, i) => (
                    <div key={i} className="group relative flex flex-1 items-end" title={`${dp.date}: ${dp.actual}`}>
                      <div className="w-full rounded-t bg-accent/40 transition-all" style={{ height: `${(dp.actual / Math.max(...f.dataPoints.map((d) => d.actual))) * 100}%`, minHeight: 2 }} />
                      <div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[0.45rem] text-white group-hover:block">{dp.actual}</div>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[0.55rem] text-muted">Generated: {formatDateTime(f.generatedAt)}</p>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="No forecasts" description="No forecasts available for this domain." />}
      </div>
    </>
  );
}
