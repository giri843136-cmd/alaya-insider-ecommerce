import { useState, useMemo } from "react";
import { Settings2, Play, Pause, AlertTriangle, RefreshCw, Zap, Truck, RotateCcw, AlertOctagon } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { getEngineStatus, setEngineStatus, getSettings, saveSettings, getPurchaseOrders, updatePurchaseOrder, getProductMappings, getAutomationLogs, runSimulation, clearAutomationEvents, seedAutomationData, seedProfiles, type EngineStatus, type AutomationSettings, type SimulationResult } from "../../lib/supplier-automation";

export default function SupplierAutomationControlCenter() {
  const { orders, products, suppliers } = useStore();
  const [activeTab, setActiveTab] = useState<"control" | "simulation">("control");
  const [engineStatus, setEngineState] = useState<EngineStatus>(getEngineStatus);
  const [settings, setSettingsState] = useState<AutomationSettings>(getSettings);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [logs, setLogs] = useState(getAutomationLogs);

  const toggleEngine = () => {
    const next = engineStatus === "running" ? "paused" : "running";
    setEngineStatus(next);
    setEngineState(next);
  };

  const emergencyStop = () => {
    setEngineStatus("stopped");
    setEngineState("stopped");
  };

  const save = (patch: Partial<AutomationSettings>) => {
    const updated = { ...settings, ...patch };
    saveSettings(updated);
    setSettingsState(updated);
  };

  const retryFailed = () => {
    const pos = getPurchaseOrders();
    for (const po of pos) {
      if (po.status === "cancelled") {
        updatePurchaseOrder(po.id, { status: "draft" });
      }
    }
    setLogs(getAutomationLogs());
  };

  const seedData = () => {
    seedAutomationData(suppliers, products);
    seedProfiles(suppliers, products);
    setLogs(getAutomationLogs());
  };

  const runSim = () => {
    setSimRunning(true);
    setSimResult(null);
    setTimeout(() => {
      const mappings = getProductMappings();
      const result = runSimulation(orders, products, suppliers, mappings, settings, 100);
      setSimResult(result);
      setSimRunning(false);
      setLogs(getAutomationLogs());
    }, 500);
  };

  const toggleSettings = [
    { key: "engineEnabled" as const, label: "Engine Enabled" },
    { key: "autoCreatePO" as const, label: "Auto-Create Purchase Orders" },
    { key: "autoSendToSupplier" as const, label: "Auto-Send to Supplier" },
    { key: "autoUpdateTracking" as const, label: "Auto-Update Tracking" },
    { key: "autoNotifyCustomer" as const, label: "Auto-Notify Customers" },
    { key: "autoSyncInventory" as const, label: "Auto-Sync Inventory" },
    { key: "autoFailover" as const, label: "Auto-Failover" },
    { key: "fraudCheckEnabled" as const, label: "Fraud Check" },
    { key: "retryFailedOrders" as const, label: "Retry Failed Orders" },
    { key: "aiSupplierRecommendation" as const, label: "AI Supplier Recommendations" },
  ];

  const failedOrders = useMemo(() => getPurchaseOrders().filter(p => p.status === "cancelled").length, [logs]);

  return (
    <>
      <Seo title="Control Center" path="/admin/commerce/supplier-automation/control-center" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Control Center</h1>
            <p className="mt-1 text-sm text-muted">Admin override, engine control, and 100-order validation.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("control")} className={cn("btn btn-sm", activeTab === "control" ? "btn-primary" : "btn-ghost")}><Settings2 className="h-4 w-4" /> Control</button>
            <button onClick={() => setActiveTab("simulation")} className={cn("btn btn-sm", activeTab === "simulation" ? "btn-primary" : "btn-ghost")}><RefreshCw className="h-4 w-4" /> Simulation</button>
          </div>
        </div>

        {activeTab === "control" ? (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5">
                <h2 className="font-semibold text-ink mb-4">Engine Status</h2>
                <div className={cn("flex items-center gap-3 rounded-xl p-4", engineStatus === "running" ? "bg-success/10" : engineStatus === "paused" ? "bg-warning/10" : "bg-danger/10")}>
                  <span className={cn("h-4 w-4 rounded-full", engineStatus === "running" ? "bg-success animate-pulse" : engineStatus === "paused" ? "bg-warning" : "bg-danger")} />
                  <div>
                    <p className={cn("font-semibold", engineStatus === "running" ? "text-success" : engineStatus === "paused" ? "text-warning" : "text-danger")}>{engineStatus.toUpperCase()}</p>
                    <p className="text-xs text-muted">Engine is {engineStatus === "running" ? "processing orders automatically" : engineStatus === "paused" ? "paused — orders queued" : "stopped — manual intervention required"}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={toggleEngine} className={cn("btn flex-1 btn-md", engineStatus === "running" ? "btn-ghost text-warning" : "btn-primary")}>
                    {engineStatus === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {engineStatus === "running" ? "Pause" : "Resume"}
                  </button>
                  <button onClick={emergencyStop} className="btn btn-md border border-danger text-danger hover:bg-danger/10"><AlertOctagon className="h-4 w-4" /> Emergency Stop</button>
                </div>
              </div>

              <div className="card lg:col-span-2 p-5">
                <h2 className="font-semibold text-ink mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={retryFailed} className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:bg-surface2/50 transition-colors">
                    <RotateCcw className="h-5 w-5 text-warning" />
                    <div><p className="text-sm font-medium text-ink">Retry Failed Orders</p><p className="text-xs text-muted">{failedOrders} failed order{failedOrders !== 1 ? "s" : ""}</p></div>
                  </button>
                  <button onClick={seedData} className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:bg-surface2/50 transition-colors">
                    <Zap className="h-5 w-5 text-accent" />
                    <div><p className="text-sm font-medium text-ink">Seed Automation Data</p><p className="text-xs text-muted">Initialize sync schedules & failover</p></div>
                  </button>
                  <button className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:bg-surface2/50 transition-colors">
                    <Truck className="h-5 w-5 text-info" />
                    <div><p className="text-sm font-medium text-ink">Force Supplier Override</p><p className="text-xs text-muted">Manually assign supplier</p></div>
                  </button>
                  <button onClick={clearAutomationEvents} className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:bg-surface2/50 transition-colors">
                    <RefreshCw className="h-5 w-5 text-muted" />
                    <div><p className="text-sm font-medium text-ink">Clear Event Log</p><p className="text-xs text-muted">Reset automation events</p></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Automation Settings */}
            <div className="mt-6 card p-5">
              <h2 className="font-semibold text-ink mb-4">Automation Settings</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {toggleSettings.map(t => (
                  <label key={t.key} className="flex items-center justify-between rounded-xl bg-surface2/50 px-4 py-3 text-sm">
                    <span className="text-ink">{t.label}</span>
                    <button onClick={() => save({ [t.key]: !settings[t.key] } as any)} className={cn("relative h-6 w-11 rounded-full transition-colors", settings[t.key] ? "bg-accent" : "bg-line")}>
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", settings[t.key] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </label>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><label className="label-field">Max Retries</label><input type="number" className="input-field" value={settings.maxRetries} onChange={e => save({ maxRetries: Number(e.target.value) })} /></div>
                <div><label className="label-field">Low Stock Threshold</label><input type="number" className="input-field" value={settings.lowStockThreshold} onChange={e => save({ lowStockThreshold: Number(e.target.value) })} /></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="card p-4 text-center"><p className="font-display text-lg font-semibold text-accent">{orders.length}</p><p className="text-xs text-muted">Available Orders</p></div>
              <div className="card p-4 text-center"><p className="font-display text-lg font-semibold text-info">{suppliers.filter(s => s.active).length}</p><p className="text-xs text-muted">Active Suppliers</p></div>
              <div className="card p-4 text-center"><p className="font-display text-lg font-semibold text-success">{getProductMappings().length}</p><p className="text-xs text-muted">Product Mappings</p></div>
            </div>
            <div className="mt-6 card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-ink">100-Order Validation</h2>
                <button onClick={runSim} disabled={simRunning} className={cn("btn-primary btn-md", simRunning && "opacity-50 pointer-events-none")}>
                  {simRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {simRunning ? "Running..." : "Run Simulation"}
                </button>
              </div>
              <p className="text-sm text-muted">Process 100 orders through the full automation pipeline to validate the engine.</p>
              {simResult && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-xl bg-surface2/50 p-4 text-center">
                      <p className="font-display text-2xl font-semibold text-ink">{simResult.totalOrders}</p>
                      <p className="text-xs text-muted">Orders Processed</p>
                    </div>
                    <div className="rounded-xl bg-success/10 p-4 text-center">
                      <p className="font-display text-2xl font-semibold text-success">{simResult.successful}</p>
                      <p className="text-xs text-muted">Successful</p>
                    </div>
                    <div className="rounded-xl bg-danger/10 p-4 text-center">
                      <p className="font-display text-2xl font-semibold text-danger">{simResult.failed}</p>
                      <p className="text-xs text-muted">Failed</p>
                    </div>
                    <div className="rounded-xl bg-surface2/50 p-4 text-center">
                      <p className="font-display text-2xl font-semibold text-ink">{simResult.totalDuration}ms</p>
                      <p className="text-xs text-muted">Duration</p>
                    </div>
                  </div>
                  {simResult.errors.length > 0 && (
                    <div className="rounded-xl bg-danger/10 p-4">
                      <p className="text-sm font-medium text-danger mb-2">Errors ({simResult.errors.length})</p>
                      <ul className="space-y-1 text-xs text-muted">
                        {simResult.errors.slice(0, 5).map((e, i) => <li key={i} className="flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-danger mt-0.5 shrink-0" />{e}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="text-center">
                    <p className={cn("font-semibold", simResult.failed === 0 ? "text-success" : "text-warning")}>
                      {simResult.failed === 0 ? "✅ All 100 orders processed successfully — no manual intervention needed" : `⚠️ ${simResult.failed} orders require attention`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
