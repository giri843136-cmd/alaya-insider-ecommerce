import { useState } from "react";
import { Shield, Plus, X, Calculator, ArrowRight } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getFailoverRules, saveFailoverRules } from "../../lib/supplier-automation";
import type { FailoverRule, PricingRule } from "../../lib/commerce-types";
import { uid } from "../../lib/utils";

const PRICING_STORAGE_KEY = "alaya_pricing_rules_v1";

function getPricingRules(): PricingRule[] {
  try { return JSON.parse(localStorage.getItem(PRICING_STORAGE_KEY) || "[]"); } catch { return []; }
}
function savePricingRules(rules: PricingRule[]) {
  try { localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(rules)); } catch {}
}

export default function SupplierAutomationFailover() {
  const { products, suppliers, orders } = useStore();
  const [rules, setRules] = useState<FailoverRule[]>(getFailoverRules);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(getPricingRules);
  const [tab, setTab] = useState<"failover" | "pricing">("failover");

  const refresh = () => { setRules(getFailoverRules()); setPricingRules(getPricingRules()); };

  const addFailoverRule = () => {
    const supplier = suppliers.find(s => s.active);
    const fallback = suppliers.find(s => s.active && s.id !== supplier?.id);
    if (!supplier || !fallback) return;
    const rule: FailoverRule = {
      id: uid("fover"),
      name: `Failover: ${supplier.name} → ${fallback.name}`,
      supplierId: supplier.id,
      fallbackSupplierId: fallback.id,
      fallbackSupplierName: fallback.name,
      condition: "out_of_stock",
      active: true,
      failoverCount: 0,
      createdAt: Date.now(),
    };
    saveFailoverRules([...rules, rule]);
    refresh();
  };

  const toggleFailover = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveFailoverRules(updated);
    refresh();
  };

  const deleteFailover = (id: string) => {
    saveFailoverRules(rules.filter(r => r.id !== id));
    refresh();
  };

  const addPricingRule = () => {
    const rule: PricingRule = {
      id: uid("prule"),
      name: "New Pricing Rule",
      description: "",
      type: "percentage_margin",
      value: 40,
      minMargin: 20,
      maxMargin: 70,
      appliesTo: "all",
      appliesToIds: [],
      active: true,
      createdAt: Date.now(),
    };
    savePricingRules([...pricingRules, rule]);
    refresh();
  };

  const togglePricing = (id: string) => {
    const updated = pricingRules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    savePricingRules(updated);
    refresh();
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgCost = products.reduce((s, p) => s + (p.costPrice || 0), 0) / Math.max(1, products.length);
  const avgPrice = products.reduce((s, p) => s + p.price, 0) / Math.max(1, products.length);
  const avgMargin = avgPrice > 0 ? ((avgPrice - avgCost) / avgPrice) * 100 : 0;

  return (
    <>
      <Seo title="Failover & Pricing" path="/admin/commerce/supplier-automation/failover" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Failover & Pricing Engine</h1>
            <p className="mt-1 text-sm text-muted">Automatic supplier failover and smart pricing rules.</p>
          </div>
          <div className="flex gap-2"><button onClick={() => setTab("failover")} className={cn("btn btn-sm", tab === "failover" ? "btn-primary" : "btn-ghost")}><Shield className="h-4 w-4" /> Failover</button><button onClick={() => setTab("pricing")} className={cn("btn btn-sm", tab === "pricing" ? "btn-primary" : "btn-ghost")}><Calculator className="h-4 w-4" /> Pricing</button></div>
        </div>

        {tab === "failover" ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-accent">{rules.length}</p><p className="text-xs text-muted">Failover Rules</p></div>
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-success">{rules.filter(r => r.active).length}</p><p className="text-xs text-muted">Active</p></div>
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-warning">{rules.reduce((s, r) => s + r.failoverCount, 0)}</p><p className="text-xs text-muted">Total Failovers</p></div>
              <div className="card p-4 text-center"><button onClick={addFailoverRule} className="btn-primary btn-sm w-full"><Plus className="h-4 w-4" /> Add Rule</button></div>
            </div>
            {rules.length === 0 ? (
              <div className="mt-8"><EmptyState icon={<Shield className="h-6 w-6" />} title="No failover rules" action={<button onClick={addFailoverRule} className="btn-primary btn-md">Add Rule</button>} /></div>
            ) : (
              <div className="mt-6 space-y-4">
                {rules.map(r => (
                  <div key={r.id} className={cn("card p-5", !r.active && "opacity-60")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <span className={cn("grid h-10 w-10 place-items-center rounded-full", r.active ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Shield className="h-5 w-5" /></span>
                        <div>
                          <h3 className="font-semibold text-ink">{r.name}</h3>
                          <p className="text-sm text-muted">Condition: <span className="badge bg-surface2 text-muted">{r.condition.replace(/_/g, " ")}</span></p>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="text-ink font-medium">Primary</span>
                            <ArrowRight className="h-3 w-3 text-muted" />
                            <span className="text-ink font-medium">{r.fallbackSupplierName}</span>
                          </div>
                          <p className="text-xs text-muted mt-1">{r.failoverCount} failover{r.failoverCount !== 1 ? "s" : ""} executed</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleFailover(r.id)} className={cn("btn btn-sm border border-line", r.active ? "text-warning" : "text-success")}>{r.active ? "Deactivate" : "Activate"}</button>
                        <button onClick={() => deleteFailover(r.id)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-success"><Money amount={totalRevenue} /></p><p className="text-xs text-muted">Total Revenue</p></div>
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-accent">{avgMargin.toFixed(1)}%</p><p className="text-xs text-muted">Avg Margin</p></div>
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-ink">${avgCost.toFixed(2)}</p><p className="text-xs text-muted">Avg Cost</p></div>
              <div className="card p-4 text-center"><p className="font-display text-2xl font-semibold text-info">{pricingRules.length}</p><p className="text-xs text-muted">Pricing Rules</p></div>
            </div>
            <div className="mt-6 card p-5 bg-accent-soft/10 border-accent/10">
              <h3 className="flex items-center gap-2 font-semibold text-ink mb-3"><Calculator className="h-4 w-4 text-accent" /> Pricing Formula</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-lg bg-surface2 px-3 py-2 font-medium">Supplier Cost</span><span className="text-muted">+</span>
                <span className="rounded-lg bg-surface2 px-3 py-2 font-medium">Shipping</span><span className="text-muted">+</span>
                <span className="rounded-lg bg-surface2 px-3 py-2 font-medium">Import Duty</span><span className="text-muted">+</span>
                <span className="rounded-lg bg-surface2 px-3 py-2 font-medium">Marketplace Fee</span><span className="text-muted">+</span>
                <span className="rounded-lg bg-surface2 px-3 py-2 font-medium">Payment Fee</span><span className="text-muted">+</span>
                <span className="rounded-lg bg-surface2 px-3 py-2 font-medium">Tax</span><span className="text-muted">+</span>
                <span className="rounded-lg bg-accent px-3 py-2 font-medium text-accent-ink">Target Margin</span>
                <span className="text-muted">=</span>
                <span className="rounded-lg bg-success/15 px-3 py-2 font-medium text-success">Selling Price</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center"><h2 className="font-semibold text-ink">Pricing Rules</h2><button onClick={addPricingRule} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add Rule</button></div>
            {pricingRules.length === 0 ? (
              <div className="mt-4"><EmptyState icon={<Calculator className="h-6 w-6" />} title="No pricing rules" action={<button onClick={addPricingRule} className="btn-primary btn-md">Add Rule</button>} /></div>
            ) : (
              <div className="mt-4 space-y-3">
                {pricingRules.map(r => (
                  <div key={r.id} className={cn("card p-4", !r.active && "opacity-60")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{r.name}</h3>
                        <p className="text-xs text-muted">{r.type.replace(/_/g, " ")} · Applies to: {r.appliesTo}</p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="badge bg-surface2 text-muted">Value: {r.value}{r.type.includes("percent") || r.type.includes("margin") ? "%" : "$"}</span>
                          <span className="badge bg-surface2 text-muted">Min: {r.minMargin}%</span>
                          <span className="badge bg-surface2 text-muted">Max: {r.maxMargin}%</span>
                        </div>
                      </div>
                      <button onClick={() => togglePricing(r.id)} className={cn("btn btn-sm", r.active ? "btn-ghost text-warning" : "btn-primary")}>{r.active ? "Disable" : "Enable"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
