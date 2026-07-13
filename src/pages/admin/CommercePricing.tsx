import { useState } from "react";
import { Plus, Pencil, Trash2, X, Calculator, TrendingUp, Percent } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Dialog, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { uid } from "../../lib/utils";

const STORAGE_KEY = "alaya_pricing_rules_v1";

interface PricingRule { id: string; name: string; description: string; type: string; value: number; minMargin: number; maxMargin: number; appliesTo: string; appliesToIds: string[]; active: boolean; createdAt: number; }

function loadRules(): PricingRule[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return [
    { id: uid("pr"), name: "Standard Margin 40%", description: "Default 40% margin on all products", type: "percentage_margin", value: 40, minMargin: 20, maxMargin: 60, appliesTo: "all", appliesToIds: [], active: true, createdAt: Date.now() - 86400000 * 30 },
    { id: uid("pr"), name: "Beauty Premium 50%", description: "Higher margin for beauty category", type: "percentage_margin", value: 50, minMargin: 30, maxMargin: 70, appliesTo: "category", appliesToIds: ["beauty"], active: true, createdAt: Date.now() - 86400000 * 20 },
    { id: uid("pr"), name: "Electronics Margin 25%", description: "Lower margin for competitive electronics", type: "fixed_margin", value: 25, minMargin: 15, maxMargin: 35, appliesTo: "category", appliesToIds: ["electronics"], active: true, createdAt: Date.now() - 86400000 * 15 },
    { id: uid("pr"), name: "Holiday Flash Sale", description: "15% off all products for holiday season", type: "percentage_margin", value: 15, minMargin: 5, maxMargin: 50, appliesTo: "all", appliesToIds: [], active: false, createdAt: Date.now() - 86400000 * 5 },
  ];
}

export default function CommercePricing() {
  const { toast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>(loadRules);
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<PricingRule | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name required");
    const updated = editing.id ? rules.map(r => r.id === editing.id ? editing : r) : [...rules, { ...editing, id: uid("pr"), createdAt: Date.now() }];
    setRules(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(editing.id ? "Rule updated" : "Rule created");
    setEditing(null);
  };

  return (
    <>
      <Seo title="Pricing Engine" path="/admin/commerce/pricing" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Pricing Engine</h1>
            <p className="mt-1 text-sm text-muted">Formula-based pricing, margin rules, and competitor tracking.</p>
          </div>
          <button onClick={() => setEditing({ name: "", description: "", type: "percentage_margin", value: 40, minMargin: 20, maxMargin: 60, appliesTo: "all", appliesToIds: [], active: true })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add Rule</button>
        </div>

        {/* Formula Display */}
        <div className="mt-6 card bg-accent-soft/20 border-accent/20 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Calculator className="h-4 w-4 text-accent" /> Pricing Formula</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-surface2 px-3 py-1.5 font-mono text-accent">Supplier Cost</span>
            <span className="text-muted">+</span>
            <span className="rounded-lg bg-surface2 px-3 py-1.5 font-mono text-accent">Shipping</span>
            <span className="text-muted">+</span>
            <span className="rounded-lg bg-surface2 px-3 py-1.5 font-mono text-accent">Taxes</span>
            <span className="text-muted">+</span>
            <span className="rounded-lg bg-surface2 px-3 py-1.5 font-mono text-accent">Fees</span>
            <span className="text-muted">+</span>
            <span className="rounded-lg bg-accent/15 px-3 py-1.5 font-mono font-semibold text-accent">Target Margin</span>
            <span className="text-muted">=</span>
            <span className="rounded-lg bg-success/15 px-3 py-1.5 font-mono font-semibold text-success">Selling Price</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[{ label: "Active Rules", value: rules.filter(r => r.active).length, icon: Calculator },
            { label: "Avg Target Margin", value: `${Math.round(rules.reduce((s, r) => s + r.value, 0) / Math.max(1, rules.length))}%`, icon: Percent },
            { label: "Min Margin Floor", value: `${Math.min(...rules.map(r => r.minMargin))}%`, icon: TrendingUp },
            { label: "Max Margin Ceiling", value: `${Math.max(...rules.map(r => r.maxMargin))}%`, icon: TrendingUp },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="font-display text-2xl font-semibold text-accent">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {rules.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Calculator className="h-6 w-6" />} title="No pricing rules" /></div>
        ) : (
          <div className="mt-6 space-y-3">
            {rules.map(r => (
              <div key={r.id} className={cn("card p-5 flex flex-wrap items-center gap-4", !r.active && "opacity-60")}>
                <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full", r.active ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                  <Calculator className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{r.name}</p>
                    <span className="badge bg-accent-soft text-accent text-[0.6rem] capitalize">{r.type.replace("_", " ")}</span>
                    <span className={cn("badge", r.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{r.active ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{r.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div><p className="text-muted">Target</p><p className="font-semibold text-ink">{r.value}%</p></div>
                  <div><p className="text-muted">Min/Max</p><p className="font-semibold text-ink">{r.minMargin}% / {r.maxMargin}%</p></div>
                  <div><p className="text-muted">Applies To</p><p className="font-semibold text-ink capitalize">{r.appliesTo}</p></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing({ ...r })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToDelete(r)} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Rule" : "New Rule"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Rule Name</label><input className="input-field" value={editing.name || ""} onChange={e => setEditing({...editing, name: e.target.value})} /></div>
              <div><label className="label-field">Description</label><textarea rows={2} className="input-field resize-none" value={editing.description || ""} onChange={e => setEditing({...editing, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Type</label><select className="input-field" value={editing.type} onChange={e => setEditing({...editing, type: e.target.value})}><option value="fixed_margin">Fixed Margin</option><option value="percentage_margin">Percentage Margin</option><option value="cost_plus">Cost Plus</option><option value="competitor_match">Competitor Match</option></select></div>
                <div><label className="label-field">Applies To</label><select className="input-field" value={editing.appliesTo} onChange={e => setEditing({...editing, appliesTo: e.target.value})}><option value="all">All Products</option><option value="category">Category</option><option value="brand">Brand</option><option value="supplier">Supplier</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Target Value</label><input type="number" className="input-field" value={editing.value || 0} onChange={e => setEditing({...editing, value: Number(e.target.value)})} /></div>
                <div><label className="label-field">Min Margin %</label><input type="number" className="input-field" value={editing.minMargin || 0} onChange={e => setEditing({...editing, minMargin: Number(e.target.value)})} /></div>
                <div><label className="label-field">Max Margin %</label><input type="number" className="input-field" value={editing.maxMargin || 100} onChange={e => setEditing({...editing, maxMargin: Number(e.target.value)})} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({...editing, active: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Create Rule"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Rule" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { setRules(rules.filter(r => r.id !== toDelete.id)); localStorage.setItem(STORAGE_KEY, JSON.stringify(rules.filter(r => r.id !== toDelete.id))); toast.success("Deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>? Products will fall back to default pricing.
      </Dialog>
    </>
  );
}
