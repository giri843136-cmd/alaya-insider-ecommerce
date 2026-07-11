import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, Truck, Receipt, Activity, Settings2, Play, Pause, AlertTriangle, CheckCircle, Clock, ShoppingBag, Package } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { getEngineStatus, setEngineStatus, getAutomationEvents, getSettings, type EngineStatus } from "../../lib/supplier-automation";
import type { AutomationEvent } from "../../lib/commerce-types";

export default function SupplierAutomationDashboard() {
  const { orders, products, suppliers } = useStore();
  const [engineStatus, setEngineState] = useState<EngineStatus>(getEngineStatus);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const settings = getSettings();

  useEffect(() => {
    setEvents(getAutomationEvents());
    const interval = setInterval(() => {
      setEvents(getAutomationEvents());
      setEngineState(getEngineStatus());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleEngine = () => {
    const next = engineStatus === "running" ? "paused" : "running";
    setEngineStatus(next);
    setEngineState(next);
  };

  const stats = useMemo(() => [
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-accent" },
    { label: "Active Suppliers", value: suppliers.filter(s => s.active).length, icon: Truck, color: "text-success" },
    { label: "Products Mapped", value: products.filter(p => p.supplierId).length, icon: Package, color: "text-info" },
    { label: "Recent Events", value: events.length, icon: Activity, color: "text-warning" },
  ], [orders, suppliers, products, events]);

  const recentEvents = events.slice(0, 10);
  const successRate = events.length > 0 ? Math.round((events.filter(e => e.status === "success").length / events.length) * 100) : 100;

  return (
    <>
      <Seo title="Supplier Automation" path="/admin/commerce/supplier-automation" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Supplier Automation</h1>
            <p className="mt-1 text-sm text-muted">Fully automated dropshipping fulfillment engine.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium", engineStatus === "running" ? "bg-success/15 text-success" : engineStatus === "paused" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
              <span className={cn("h-2 w-2 rounded-full", engineStatus === "running" ? "bg-success animate-pulse" : engineStatus === "paused" ? "bg-warning" : "bg-danger")} />
              {engineStatus === "running" ? "Engine Running" : engineStatus === "paused" ? "Paused" : "Stopped"}
            </span>
            <button onClick={toggleEngine} className={cn("btn btn-md", engineStatus === "running" ? "btn-ghost text-warning" : "btn-primary")}>
              {engineStatus === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {engineStatus === "running" ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="card p-5">
              <div className={cn("grid h-10 w-10 place-items-center rounded-full bg-surface2", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink tabular-nums">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Visualization */}
        <div className="mt-6 card p-5">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Fulfillment Pipeline</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {["Order Placed", "Fraud Check", "Inventory Check", "Supplier Select", "Reserve Stock", "Generate PO", "Send to Supplier", "Confirmation", "Tracking", "Customer Notified", "Analytics", "Complete"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className={cn("rounded-lg px-3 py-2 font-medium whitespace-nowrap",
                  i === 0 ? "bg-accent text-accent-ink" :
                  i === 11 ? "bg-success/15 text-success" :
                  "bg-surface2 text-muted")}>{step}</span>
                {i < 11 && <span className="text-muted">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats + Events */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-ink"><Activity className="h-4 w-4 text-accent" /> Recent Automation Events</h2>
            </div>
            {recentEvents.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No automation events yet. Orders processed through the engine will appear here.</p>
            ) : (
              <div className="divide-y divide-line">
                {recentEvents.map(e => (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                    <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
                      e.status === "success" ? "bg-success/15" :
                      e.status === "failed" ? "bg-danger/15" :
                      e.status === "warning" ? "bg-warning/15" : "bg-surface2")}>
                      {e.status === "success" ? <CheckCircle className="h-3.5 w-3.5 text-success" /> :
                       e.status === "failed" ? <AlertTriangle className="h-3.5 w-3.5 text-danger" /> :
                       e.status === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-warning" /> :
                       <Clock className="h-3.5 w-3.5 text-muted" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{e.event}</p>
                      <p className="text-xs text-muted">{e.details}</p>
                    </div>
                    <span className="shrink-0 text-[0.6rem] text-muted">{new Date(e.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="font-semibold text-ink mb-3">Engine Health</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted">Status</span><span className={cn("font-medium", engineStatus === "running" ? "text-success" : "text-warning")}>{engineStatus}</span></div>
                <div className="flex justify-between"><span className="text-muted">Success Rate</span><span className="font-medium text-ink">{successRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted">Events Today</span><span className="font-medium text-ink">{events.length}</span></div>
                <div className="flex justify-between"><span className="text-muted">Auto-PO</span><span className={cn("font-medium", settings.autoCreatePO ? "text-success" : "text-muted")}>{settings.autoCreatePO ? "Enabled" : "Disabled"}</span></div>
                <div className="flex justify-between"><span className="text-muted">Auto-Failover</span><span className={cn("font-medium", settings.autoFailover ? "text-success" : "text-muted")}>{settings.autoFailover ? "Enabled" : "Disabled"}</span></div>
                <div className="flex justify-between"><span className="text-muted">AI Recommendations</span><span className={cn("font-medium", settings.aiSupplierRecommendation ? "text-success" : "text-muted")}>{settings.aiSupplierRecommendation ? "Enabled" : "Disabled"}</span></div>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-ink mb-3">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { to: "/admin/commerce/supplier-automation/directory", label: "Supplier Directory", icon: Truck },
                  { to: "/admin/commerce/supplier-automation/purchase-orders", label: "Purchase Orders", icon: Receipt },
                  { to: "/admin/commerce/supplier-automation/control-center", label: "Control Center", icon: Settings2 },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-2 rounded-lg bg-surface2/50 px-3 py-2 text-sm text-muted hover:bg-surface2 hover:text-ink transition-colors">
                    <l.icon className="h-4 w-4 text-accent" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
