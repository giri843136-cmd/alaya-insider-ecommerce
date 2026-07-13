/** Executive Metric Card — reusable KPI card with sparkline, trend, and status */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ExecutiveKpi } from "../../lib/executiveIntelligence";

export function ExecutiveMetricCard({ kpi, onClick }: { kpi: ExecutiveKpi; onClick?: () => void }) {
  const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
  const trendColor = kpi.trend === "up" && kpi.status !== "behind" ? "text-success" : kpi.trend === "down" && kpi.status === "on_track" ? "text-success" : kpi.status === "at_risk" || kpi.status === "behind" ? "text-danger" : "text-muted";

  return (
    <div className={cn("card p-4 transition-all", onClick && "cursor-pointer hover:shadow-md", kpi.status === "behind" && "border-danger/20", kpi.status === "at_risk" && "border-warning/20")} onClick={onClick}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{kpi.name}</p>
        <TrendIcon className={cn("h-4 w-4", trendColor)} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold text-ink">
          {typeof kpi.currentValue === "number" && kpi.currentValue > 1000 ? kpi.currentValue.toLocaleString() : kpi.currentValue}
        </span>
        <span className="text-xs text-muted">{kpi.unit === "$" && typeof kpi.currentValue === "number" ? "" : kpi.unit === "%" && ""}{kpi.unit === "$" && "$"}{kpi.unit === "%" && "%"}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs">
        <span className="text-muted">Target: {typeof kpi.targetValue === "number" && kpi.targetValue > 1000 ? kpi.targetValue.toLocaleString() : kpi.targetValue}{kpi.unit}</span>
        <span className={cn("font-medium capitalize", kpi.status === "on_track" ? "text-success" : kpi.status === "achieved" ? "text-accent" : kpi.status === "at_risk" ? "text-warning" : "text-danger")}>
          {kpi.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface2">
        <div className={cn("h-full rounded-full transition-all", kpi.status === "achieved" ? "bg-accent" : kpi.status === "on_track" ? "bg-success" : kpi.status === "at_risk" ? "bg-warning" : "bg-danger")}
          style={{ width: `${Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)}%` }} />
      </div>
      {kpi.sparkline.length > 0 && (
        <div className="mt-2 flex items-end gap-0.5 h-6">
          {kpi.sparkline.slice(-12).map((v, i) => (
            <div key={i} className="w-1.5 rounded-t bg-accent/40 transition-all" style={{ height: `${(v / Math.max(...kpi.sparkline)) * 100}%`, minHeight: 2 }} />
          ))}
        </div>
      )}
      {kpi.previousValue > 0 && (
        <div className="mt-1 text-[0.55rem] text-muted">
          Prev: {typeof kpi.previousValue === "number" && kpi.previousValue > 1000 ? kpi.previousValue.toLocaleString() : kpi.previousValue}{kpi.unit}
        </div>
      )}
    </div>
  );
}
