/**
 * ALAYA INSIDER — Commission Engine Admin (PART 3.5)
 * ------------------------------------------------------------------
 * Commission rules management, forecasting, reports, and analytics.
 */
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, DollarSign, Percent, BarChart3, TrendingUp, Handshake } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState, Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatCompact } from "../../lib/utils";
import {
  getCommissionRules, addCommissionRule, updateCommissionRule, deleteCommissionRule,
  getCommissionRecords, getCommissionAnalytics, getCommissionForecast,
  type CommissionRule, type CommissionType,
} from "../../lib/affiliateCommerce";

const EMPTY_RULE: Partial<CommissionRule> = {
  name: "", description: "", type: "percentage", value: 5, minOrderValue: 0,
  cookieDays: 30, active: true, priority: 10,
};

export default function AdminCommissionEngine() {
  const [rules, setRules] = useState(getCommissionRules());
  const [editing, setEditing] = useState<Partial<CommissionRule> | null>(null);
  const [toDelete, setToDelete] = useState<CommissionRule | null>(null);
  const [tab, setTab] = useState<"rules" | "records" | "analytics">("rules");

  const refresh = () => setRules(getCommissionRules());
  const records = useMemo(() => getCommissionRecords(), []);
  const analytics = useMemo(() => getCommissionAnalytics(), []);
  const forecast = useMemo(() => getCommissionForecast(), []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return;
    if (editing.id) {
      updateCommissionRule(editing.id, editing);
    } else {
      addCommissionRule(editing as any);
    }
    setEditing(null);
    refresh();
  };

  return (
    <>
      <Seo title="Commission Engine" path="/admin/commission-engine" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Commission Engine</h1>
            <p className="mt-1 text-sm text-muted">Configure commission rules, track payments, and forecast earnings.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_RULE })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add rule</button>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Total earned</p>
            <p className="mt-1 text-2xl font-semibold text-ink">${formatCompact(analytics.totalCommissionEarned)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-ink">${formatCompact(analytics.totalCommissionPending)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Active rules</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{rules.filter((r) => r.active).length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Avg rate</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{analytics.avgCommissionRate}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["rules", "records", "analytics"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
              {t === "rules" ? <Percent className="h-4 w-4" /> : t === "records" ? <DollarSign className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
              {t}
            </button>
          ))}
        </div>

        {tab === "rules" && (
          <div className="mt-6 space-y-3">
            {rules.length === 0 ? (
              <EmptyState icon={<Percent className="h-6 w-6" />} title="No commission rules defined" description="Create your first commission rule." />
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{rule.name}</h3>
                        <span className={cn("badge", rule.type === "percentage" ? "bg-accent-soft text-accent" : rule.type === "fixed" ? "bg-info/15 text-info" : "bg-surface2 text-ink")}>
                          {rule.type}
                        </span>
                        {!rule.active && <Badge variant="neutral">Inactive</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{rule.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-accent">
                        {rule.type === "percentage" ? `${rule.value}%` : rule.type === "fixed" ? `$${rule.value}` : rule.tiers ? `${rule.tiers[0]?.rate}%–${rule.tiers[rule.tiers.length - 1]?.rate}%` : `${rule.value}%`}
                      </p>
                      <p className="text-xs text-muted">Min ${rule.minOrderValue}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <button onClick={() => setEditing({ ...rule })} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => setToDelete(rule)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "records" && (
          <div className="mt-6">
            {records.length === 0 ? (
              <EmptyState icon={<DollarSign className="h-6 w-6" />} title="No commission records yet" />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-surface2/60">
                    <tr><th className="px-4 py-2.5 text-left font-medium text-muted">Order</th><th className="px-4 py-2.5 text-left font-medium text-muted">Partner</th><th className="px-4 py-2.5 text-right font-medium text-muted">Sale</th><th className="px-4 py-2.5 text-right font-medium text-muted">Commission</th><th className="px-4 py-2.5 text-center font-medium text-muted">Status</th></tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={cn("border-t border-line", i % 2 === 0 ? "bg-surface" : "bg-surface2/20")}>
                        <td className="px-4 py-3 font-medium text-ink">{r.orderNumber}</td>
                        <td className="px-4 py-3"><span className="text-muted">{r.partnerName}</span></td>
                        <td className="px-4 py-3 text-right font-medium text-ink">${r.saleAmount}</td>
                        <td className="px-4 py-3 text-right font-semibold text-accent">${r.commissionAmount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("badge", r.status === "paid" ? "bg-success/15 text-success" : r.status === "pending" ? "bg-warning/15 text-warning" : r.status === "approved" ? "bg-info/15 text-info" : "bg-danger/15 text-danger")}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink mb-4"><TrendingUp className="h-5 w-5 text-accent" /> Forecast</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted">Next 30 days</p><p className="text-xl font-semibold text-ink">${formatCompact(forecast.projectedCommission)}</p><p className="text-xs text-muted">on ${formatCompact(forecast.projectedRevenue)} revenue</p></div>
                <div><p className="text-xs text-muted">Confidence</p><p className="text-xl font-semibold text-ink">{(forecast.confidence * 100).toFixed(0)}%</p><p className="text-xs text-muted">Based on {records.length} records</p></div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink mb-4"><Handshake className="h-5 w-5 text-accent" /> Partner breakdown</h3>
              <div className="space-y-3">
                {analytics.commissionByPartner.map((p) => (
                  <div key={p.partnerId} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{p.partnerName}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-ink">$${formatCompact(p.earned)}</span>
                      <span className="ml-2 text-xs text-muted">${formatCompact(p.pending)} pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={handleSave} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit rule" : "Add rule"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Rule name</label><input className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Standard Commission" /></div>
              <div><label className="label-field">Description</label><input className="input-field" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field">Type</label>
                  <select className="input-field" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as CommissionType })}>
                    {["percentage", "fixed", "tiered"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label-field">Value</label><input type="number" className="input-field" value={editing.value ?? 5} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field">Min order value</label><input type="number" className="input-field" value={editing.minOrderValue ?? 0} onChange={(e) => setEditing({ ...editing, minOrderValue: Number(e.target.value) })} /></div>
                <div><label className="label-field">Cookie days</label><input type="number" className="input-field" value={editing.cookieDays ?? 30} onChange={(e) => setEditing({ ...editing, cookieDays: Number(e.target.value) })} /></div>
              </div>
              <label className="flex items-center gap-3 text-sm text-ink">
                <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Add rule"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete rule"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteCommissionRule(toDelete.id); setToDelete(null); refresh(); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button></>}>
        Remove <strong>{toDelete?.name}</strong>? This cannot be undone.
      </Dialog>
    </>
  );
}
