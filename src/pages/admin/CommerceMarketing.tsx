import { useState } from "react";
import { Plus, Trash2, X, Gift, ShoppingCart, Users, TrendingUp, Bell, Send, Percent } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatPrice } from "../../lib/utils";
import type { Coupon } from "../../lib/types";
import { cn } from "@/utils/cn";



export default function CommerceMarketing() {
  const { products, orders, coupons, abandonedCarts, referrals, addCoupon, updateCoupon, deleteCoupon, sendEmail, deleteAbandonedCart, recoverAbandonedCart, settings } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"campaigns" | "coupons" | "bundles" | "carts">("campaigns");
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [editingOpen, setEditingOpen] = useState(false);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const recoveryRate = abandonedCarts.length ? Math.round((abandonedCarts.filter(c => c.recovered).length / abandonedCarts.length) * 100) : 0;

  const saveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.code?.trim()) return toast.error("Code required");
    if (editing.id) { updateCoupon(editing.id, editing); toast.success("Coupon updated"); }
    else { addCoupon(editing as any); toast.success("Coupon created"); }
    setEditing(null); setEditingOpen(false);
  };

  return (
    <>
      <Seo title="Commerce Marketing" path="/admin/commerce/marketing" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Marketing</h1>
            <p className="mt-1 text-sm text-muted">Campaigns, bundles, coupons, and recovery tools.</p>
          </div>
          <div className="flex gap-2">
            {(["campaigns","coupons","bundles","carts"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>{t.replace("-", " ")}</button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Revenue", value: formatPrice(revenue, settings.currency), icon: TrendingUp },
            { label: "AOV", value: formatPrice(aov, settings.currency), icon: ShoppingCart },
            { label: "Cart Recovery", value: `${recoveryRate}%`, icon: Send },
            { label: "Active Coupons", value: String(coupons.filter(c => c.active).length), icon: Percent },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="font-display text-2xl font-semibold text-accent">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {tab === "campaigns" && (
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              { title: "Email Campaigns", desc: "Send targeted email campaigns to customer segments. Abandoned cart recovery, welcome series, re-engagement.", icon: Send, color: "text-accent" },
              { title: "SMS Marketing", desc: "Text message campaigns for flash sales, order updates, and VIP offers. Opt-in required.", icon: Bell, color: "text-accent" },
              { title: "Referral Program", desc: `${referrals.length} active referrals · reward customers who bring new business.`, icon: Users, color: "text-accent" },
            ].map(c => (
              <div key={c.title} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><c.icon className="h-5 w-5" /></span>
                  <h3 className="font-semibold text-ink">{c.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted">{c.desc}</p>
                <button onClick={() => toast.success(`${c.title} campaign triggered`)} className="btn-accent-soft btn-sm mt-4">Launch Campaign</button>
              </div>
            ))}
          </div>
        )}

        {tab === "coupons" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">{coupons.length} coupons</p>
              <button onClick={() => { setEditing({ code: "", type: "percent", value: 10, minSpend: 0, active: true, description: "", usageLimit: 100, usedCount: 0 }); setEditingOpen(true); }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add Coupon</button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Min Spend</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-surface2/40">
                      <td className="px-4 py-3 font-mono font-semibold text-accent">{c.code}</td>
                      <td className="px-4 py-3 capitalize text-muted">{c.type}</td>
                      <td className="px-4 py-3 font-medium text-ink">{c.type === "percent" ? `${c.value}%` : <Money amount={c.value} />}</td>
                      <td className="px-4 py-3 text-muted"><Money amount={c.minSpend} /></td>
                      <td className="px-4 py-3 text-muted">{c.usedCount}/{c.usageLimit || "∞"}</td>
                      <td className="px-4 py-3"><span className={cn("badge", c.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{c.active ? "Active" : "Inactive"}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => updateCoupon(c.id, { active: !c.active })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Bell className="h-4 w-4" /></button>
                          <button onClick={() => { deleteCoupon(c.id); toast.success("Deleted"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "bundles" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((p, i) => {
              const bundleProducts = products.slice(i * 2, i * 2 + 2);
              return (
                <div key={p.id} className="card p-5">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold text-ink">Bundle {i + 1}</h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    {bundleProducts.map(bp => (
                      <div key={bp.id} className="flex items-center gap-2 text-sm">
                        <img src={bp.images[0]} alt="" className="h-8 w-6 rounded object-cover" />
                        <span className="truncate flex-1 text-muted">{bp.name}</span>
                        <span className="font-medium text-ink"><Money amount={bp.salePrice ?? bp.price} /></span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-muted">
                    <span className="font-semibold text-success">-{10 + i * 5}% bundle discount</span>
                  </div>
                  <button onClick={() => toast.success(`Bundle ${i + 1} activated`)} className="btn-accent-soft btn-sm mt-3">Activate Bundle</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === "carts" && (
          <div className="mt-6 space-y-3">
            {abandonedCarts.length === 0 ? (
              <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="No abandoned carts" />
            ) : (
              abandonedCarts.map(c => (
                <div key={c.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/15 text-warning"><ShoppingCart className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{c.email || "Guest"}</p>
                    <p className="text-xs text-muted">{c.items} items · <Money amount={c.value} /> · {c.stage}</p>
                  </div>
                  {c.recovered ? (
                    <span className="badge bg-success/15 text-success">Recovered</span>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { sendEmail("cart_recovery", c.email || "", `${c.items} items`); recoverAbandonedCart(c.id); toast.success("Recovery sent"); }} className="btn-primary btn-sm"><Send className="h-3.5 w-3.5" /> Recover</button>
                      <button onClick={() => { deleteAbandonedCart(c.id); toast.success("Removed"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {editingOpen && editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setEditingOpen(false); setEditing(null); }} />
          <form onSubmit={saveCoupon} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Coupon" : "New Coupon"}</h2>
              <button type="button" onClick={() => { setEditingOpen(false); setEditing(null); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Code</label><input className="input-field uppercase" value={editing.code || ""} onChange={e => setEditing({...editing, code: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Type</label><select className="input-field" value={editing.type || "percent"} onChange={e => setEditing({...editing, type: e.target.value as "percent" | "fixed"})}><option value="percent">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                <div><label className="label-field">Value</label><input type="number" className="input-field" value={editing.value || 0} onChange={e => setEditing({...editing, value: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Min Spend ($)</label><input type="number" className="input-field" value={editing.minSpend || 0} onChange={e => setEditing({...editing, minSpend: Number(e.target.value)})} /></div>
                <div><label className="label-field">Usage Limit</label><input type="number" className="input-field" value={editing.usageLimit || 100} onChange={e => setEditing({...editing, usageLimit: Number(e.target.value)})} /></div>
              </div>
              <div><label className="label-field">Description</label><input className="input-field" value={editing.description || ""} onChange={e => setEditing({...editing, description: e.target.value})} /></div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({...editing, active: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Create Coupon"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
