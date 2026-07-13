import { useState } from "react";
import { Save, RotateCcw, Settings2, Bell, Truck, DollarSign } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import { COMMERCE_STORAGE_KEY, DEFAULT_COMMERCE_SETTINGS, type CommerceSettings } from "../../lib/commerce-types";

function loadSettings(): CommerceSettings {
  try { const r = localStorage.getItem(COMMERCE_STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return DEFAULT_COMMERCE_SETTINGS;
}

export default function CommerceSettings() {
  const { toast } = useToast();
  const [cs, setCs] = useState<CommerceSettings>(loadSettings);
  const dirty = JSON.stringify(cs) !== JSON.stringify(loadSettings());

  const save = () => {
    localStorage.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(cs));
    toast.success("Commerce settings saved");
  };

  const reset = () => {
    setCs(DEFAULT_COMMERCE_SETTINGS);
    localStorage.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(DEFAULT_COMMERCE_SETTINGS));
    toast.success("Settings reset to defaults");
  };

  const set = <K extends keyof CommerceSettings>(k: K, v: CommerceSettings[K]) => setCs(p => ({ ...p, [k]: v }));

  return (
    <>
      <Seo title="Commerce Settings" path="/admin/commerce/settings" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Commerce Settings</h1>
            <p className="mt-1 text-sm text-muted">Configure dropshipping defaults, automation, and pricing rules.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* General */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Settings2 className="h-4 w-4 text-accent" /> General</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Default Currency</label><select className="input-field" value={cs.currency} onChange={e => set("currency", e.target.value)}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option></select></div>
                <div><label className="label-field">Tax Calculation</label><select className="input-field" value={cs.taxCalculation} onChange={e => set("taxCalculation", e.target.value as "exclusive" | "inclusive")}><option value="exclusive">Exclusive</option><option value="inclusive">Inclusive</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Default Tax Rate (%)</label><input type="number" className="input-field" value={cs.defaultTaxRate} onChange={e => set("defaultTaxRate", Number(e.target.value))} /></div>
                <div><label className="label-field">Shipping Calculation</label><select className="input-field" value={cs.shippingCalculation} onChange={e => set("shippingCalculation", e.target.value as "flat" | "weight_based" | "zone_based")}><option value="flat">Flat Rate</option><option value="weight_based">Weight Based</option><option value="zone_based">Zone Based</option></select></div>
              </div>
              <div><label className="label-field">Margin Calculation</label><select className="input-field" value={cs.marginCalculation} onChange={e => set("marginCalculation", e.target.value as "cost_plus" | "sell_less_cost")}><option value="cost_plus">Cost Plus (Cost + Margin)</option><option value="sell_less_cost">Sell Less Cost (Selling Price - Cost)</option></select></div>
            </div>
          </div>

          {/* Defaults */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><DollarSign className="h-4 w-4 text-accent" /> Margin & Stock Defaults</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Target Margin %</label><input type="number" className="input-field" value={cs.defaultTargetMargin} onChange={e => set("defaultTargetMargin", Number(e.target.value))} /></div>
                <div><label className="label-field">Min Margin %</label><input type="number" className="input-field" value={cs.defaultMinMargin} onChange={e => set("defaultMinMargin", Number(e.target.value))} /></div>
                <div><label className="label-field">Max Margin %</label><input type="number" className="input-field" value={cs.defaultMaxMargin} onChange={e => set("defaultMaxMargin", Number(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Low Stock Threshold</label><input type="number" className="input-field" value={cs.lowStockThreshold} onChange={e => set("lowStockThreshold", Number(e.target.value))} /></div>
                <div><label className="label-field">Reorder Multiplier</label><input type="number" step="0.1" className="input-field" value={cs.reorderPointMultiplier} onChange={e => set("reorderPointMultiplier", Number(e.target.value))} /></div>
              </div>
            </div>
          </div>

          {/* Automation Toggles */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Truck className="h-4 w-4 text-accent" /> Automation</h2>
            <div className="mt-4 space-y-3">
              {([
                ["automationEnabled", "Enable Automation Engine"],
                ["autoAssignSupplier", "Auto-Assign Supplier to Orders"],
                ["autoCreatePO", "Auto-Create Purchase Orders"],
                ["autoUpdateInventory", "Auto-Update Inventory"],
                ["autoSendTracking", "Auto-Send Tracking to Customer"],
                ["pricingEngineEnabled", "Enable Pricing Engine"],
                ["aiCommerceEnabled", "Enable AI Commerce Features"],
              ] as const).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm text-ink">{label}</span>
                  <button type="button" onClick={() => set(k, !cs[k])} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", cs[k] ? "bg-accent" : "bg-line")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", cs[k] ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Bell className="h-4 w-4 text-accent" /> Notification Preferences</h2>
            <div className="mt-4 space-y-3">
              {([
                ["lowStock", "Low Stock Alerts"],
                ["supplierOrder", "Supplier Order Updates"],
                ["returnRequest", "Return Request Notifications"],
                ["automationError", "Automation Error Alerts"],
              ] as const).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm text-ink">{label}</span>
                  <button type="button" onClick={() => set("notificationEmails", { ...cs.notificationEmails, [k]: !cs.notificationEmails[k] })} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", cs.notificationEmails[k] ? "bg-accent" : "bg-line")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", cs.notificationEmails[k] ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-danger"><RotateCcw className="h-4 w-4" /> Reset Commerce Settings</h3>
          <p className="mt-1 text-sm text-muted">Restore all commerce settings to factory defaults.</p>
          <button onClick={reset} className="btn btn-md mt-3 border border-danger/40 text-danger hover:bg-danger/10">Reset to Defaults</button>
        </div>
      </div>

      {/* Sticky save */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-transform lg:left-[260px]", dirty ? "translate-y-0" : "translate-y-full")}>
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">Unsaved changes</p>
          <button onClick={save} className="btn-primary btn-sm"><Save className="h-4 w-4" /> Save Settings</button>
        </div>
      </div>
    </>
  );
}
