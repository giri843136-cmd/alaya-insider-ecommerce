import { useState } from "react";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { X, Plus, Trash2, Mail, ShoppingCart, Gift, Users, TrendingUp, Bell, Eye, MousePointerClick, Send, Crown } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatPrice } from "../../lib/utils";
import type { Popup, PopupTrigger, PopupType } from "../../lib/types";
import { cn } from "@/utils/cn";

const TRIGGERS: { id: PopupTrigger; label: string }[] = [
  { id: "exit_intent", label: "Exit intent" },
  { id: "scroll", label: "Scroll depth" },
  { id: "time", label: "Time delay" },
  { id: "click", label: "Click trigger" },
  { id: "welcome", label: "Welcome" },
];
const TYPES: { id: PopupType; label: string }[] = [
  { id: "newsletter", label: "Newsletter" },
  { id: "coupon", label: "Coupon" },
  { id: "promo", label: "Promotion" },
  { id: "announcement", label: "Announcement" },
];

export default function AdminMarketing() {
  const { popups, abandonedCarts, referrals, loyaltyTiers, orders, customers, products, updatePopup, deletePopup, recoverAbandonedCart, deleteAbandonedCart, addPopup, sendEmail, settings } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "popups" | "carts" | "referrals" | "loyalty" | "live">("dashboard");
  const [editing, setEditing] = useState<Partial<Popup> & { name: string } | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const affiliateRev = products.filter((p) => p.affiliate).reduce((s, p) => s + p.price * 0.07, 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const recovered = abandonedCarts.filter((c) => c.recovered).length;
  const recoveryRate = abandonedCarts.length ? Math.round((recovered / abandonedCarts.length) * 100) : 0;
  const totalPopupViews = popups.reduce((s, p) => s + p.views, 0);
  const totalPopupConv = popups.reduce((s, p) => s + p.conversions, 0);
  const popupCvr = totalPopupViews ? Math.round((totalPopupConv / totalPopupViews) * 100) : 0;
  const returning = customers.length ? Math.round((customers.filter((c) => orders.some((o) => o.customer.email === c.email)).length / customers.length) * 100) : 0;

  const STATS = [
    { label: "Revenue", value: formatPrice(revenue, settings.currency), sub: `${orders.length} orders`, icon: TrendingUp },
    { label: "Affiliate revenue", value: formatPrice(affiliateRev, settings.currency), sub: "Est. commissions", icon: Gift },
    { label: "Avg. order value", value: formatPrice(aov, settings.currency), sub: "Per order", icon: ShoppingCart },
    { label: "Cart recovery", value: `${recoveryRate}%`, sub: `${recovered}/${abandonedCarts.length}`, icon: Mail },
    { label: "Popup CTR", value: `${popupCvr}%`, sub: `${totalPopupConv} signups`, icon: MousePointerClick },
    { label: "Returning", value: `${returning}%`, sub: "Of customers", icon: Users },
  ];

  const savePopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name required");
    if (editing.id) { updatePopup(editing.id, editing); toast.success("Popup updated"); }
    else { addPopup(editing); toast.success("Popup created"); }
    setEditing(null);
  };

  return (
    <>
      <Seo title="Marketing" path="/admin/marketing" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Marketing</h1>
            <p className="mt-1 text-sm text-muted">Campaigns, popups, recovery & loyalty.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["dashboard", "Dashboard"], ["popups", "Popups"], ["carts", "Abandoned carts"], ["referrals", "Referrals"], ["loyalty", "Loyalty"], ["live", "Live sales"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip", tab === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
                  </div>
                  <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="text-xs text-muted">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[var(--radius-xl2)] border border-line bg-surface2/40 p-5 text-sm text-muted">
              <p className="flex items-center gap-2 font-medium text-ink"><Bell className="h-4 w-4 text-accent" /> Email & SMS automation ready</p>
              <p className="mt-1">Architecture supports order confirmations, abandoned cart recovery, wishlist reminders, price-drop alerts, back-in-stock and birthday campaigns. Triggered via the email logger.</p>
            </div>
          </>
        )}

        {/* POPUPS */}
        {tab === "popups" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{popups.length} popups · {popups.filter((p) => p.active).length} active</p>
              <button onClick={() => setEditing({ name: "", type: "newsletter", trigger: "time", headline: "", body: "", ctaLabel: "Subscribe", triggerValue: 15, active: true, views: 0, conversions: 0 })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add popup</button>
            </div>
            <div className="mt-4 space-y-3">
              {popups.map((p) => {
                const cvr = p.views ? Math.round((p.conversions / p.views) * 100) : 0;
                return (
                  <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", p.active ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><Eye className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{p.name}</p>
                        <span className="badge bg-accent-soft text-accent capitalize">{p.type}</span>
                        <span className="badge capitalize bg-surface2 text-muted">{p.trigger.replace("_", " ")}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">{p.headline}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.views}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" /> {p.conversions} ({cvr}%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updatePopup(p.id, { active: !p.active })} className={cn("chip", p.active && "chip-active")} aria-pressed={p.active}>{p.active ? "On" : "Off"}</button>
                      <button onClick={() => setEditing({ ...p })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2" aria-label="Edit"><Mail className="h-4 w-4" /></button>
                      <button onClick={() => { deletePopup(p.id); toast.success("Popup deleted"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}
              {popups.length === 0 && <EmptyState icon={<Eye className="h-6 w-6" />} title="No popups" description="Create your first popup to grow your list." />}
            </div>
          </div>
        )}

        {/* ABANDONED CARTS */}
        {tab === "carts" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{abandonedCarts.length} carts · {abandonedCarts.filter((c) => !c.recovered).length} pending recovery</p>
            <div className="mt-4 space-y-3">
              {abandonedCarts.map((c) => (
                <div key={c.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/15 text-warning"><ShoppingCart className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{c.email || "Guest cart"}</p>
                    <p className="text-xs text-muted">{c.items} items · <Money amount={c.value} /> · {c.stage} · {new Date(c.createdAt).toLocaleTimeString()}</p>
                  </div>
                  {c.recovered ? (
                    <span className="badge bg-success/15 text-success">Recovered</span>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { sendEmail("cart_recovery", c.email || "", `${c.items} items`); recoverAbandonedCart(c.id); toast.success("Recovery email sent", c.email ? `To ${c.email}` : "Logged"); }} className="btn-primary btn-sm"><Send className="h-3.5 w-3.5" /> Recover</button>
                      <button onClick={() => { deleteAbandonedCart(c.id); toast.success("Cart removed"); }} className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              ))}
              {abandonedCarts.length === 0 && <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="No abandoned carts" />}
            </div>
          </div>
        )}

        {/* REFERRALS */}
        {tab === "referrals" && (
          <div className="mt-8">
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">Signups</th><th className="px-4 py-3">Purchases</th><th className="px-4 py-3">Reward</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...referrals].sort((a, b) => b.rewardEarned - a.rewardEarned).map((r, i) => (
                    <tr key={r.id} className="hover:bg-surface2/40">
                      <td className="px-4 py-3"><span className="flex items-center gap-2 font-medium text-ink">{r.customerName} {i === 0 && <Crown className="h-3.5 w-3.5 text-accent" />}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-accent">{r.code}</td>
                      <td className="px-4 py-3 text-muted">{r.clicks}</td>
                      <td className="px-4 py-3 text-muted">{r.signups}</td>
                      <td className="px-4 py-3 text-muted">{r.purchases}</td>
                      <td className="px-4 py-3 font-semibold text-ink"><Money amount={r.rewardEarned} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOYALTY */}
        {tab === "loyalty" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{loyaltyTiers.length} tiers · points awarded per $1 spent</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...loyaltyTiers].sort((a, b) => a.minPoints - b.minPoints).map((t, i) => (
                <div key={t.id} className={cn("card p-5", i === loyaltyTiers.length - 1 && "ring-1 ring-accent/40")}>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-ink"><Crown className="h-5 w-5" /></span>
                    {i === loyaltyTiers.length - 1 && <span className="badge bg-accent text-accent-ink">Top</span>}
                  </div>
                  <p className="mt-4 font-display text-xl font-semibold text-ink">{t.name}</p>
                  <p className="text-sm font-medium text-accent">{t.minPoints}+ pts</p>
                  <p className="mt-2 text-xs text-muted">{t.perk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE SALES */}
        {tab === "live" && (
          <div className="mt-8">
            <p className="text-sm text-muted">{products.length} products · live sales notifications rotate on the storefront.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => toast.success("Live sales active", "Notifications rotate every ~20s on the storefront.")} className="btn-primary btn-sm"><Bell className="h-4 w-4" /> Preview on storefront</button>
            </div>
            <div className="mt-6 card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Ago</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.slice(0, 6).map((p, i) => {
                    const ls = ["Giri · Bengaluru, India", "Amélie · Paris, France", "Hannah · Sydney, Australia", "Sofia · Milan, Italy", "Noor · Dubai, UAE", "Eleanor · London, UK"][i];
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-ink">{ls?.split(" · ")[0]}</td>
                        <td className="px-4 py-3 text-muted">{ls?.split(" · ")[1]}</td>
                        <td className="px-4 py-3 text-ink">{p.name}</td>
                        <td className="px-4 py-3 text-muted">{(i + 1) * 15}m ago</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Popup editor */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Popup editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={savePopup} className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit popup" : "New popup"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Name</label><input className="input-field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Type</label>
                  <select className="input-field" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as PopupType })}>
                    {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Trigger</label>
                  <select className="input-field" value={editing.trigger} onChange={(e) => setEditing({ ...editing, trigger: e.target.value as PopupTrigger })}>
                    {TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label-field">Headline</label><input className="input-field" value={editing.headline} onChange={(e) => setEditing({ ...editing, headline: e.target.value })} /></div>
              <div><label className="label-field">Body</label><textarea rows={2} className="input-field resize-none" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">CTA label</label><input className="input-field" value={editing.ctaLabel} onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })} /></div>
                <div><label className="label-field">{editing.trigger === "scroll" ? "Scroll %" : "Delay (sec)"}</label><input type="number" className="input-field" value={editing.triggerValue ?? 15} onChange={(e) => setEditing({ ...editing, triggerValue: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Coupon code (optional)</label><input className="input-field" value={editing.couponCode || ""} onChange={(e) => setEditing({ ...editing, couponCode: e.target.value })} /></div>
                <div><label className="label-field">CTA link</label><input className="input-field" value={editing.ctaLink || ""} onChange={(e) => setEditing({ ...editing, ctaLink: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Create popup"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
