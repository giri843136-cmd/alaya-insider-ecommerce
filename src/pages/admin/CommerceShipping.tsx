import { useState } from "react";
import { Plus, Pencil, Trash2, X, Ship, Globe, Truck, Clock, DollarSign } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Dialog, EmptyState, Money } from "../../components/ui";
import { cn } from "@/utils/cn";
import { uid } from "../../lib/utils";

const STORAGE_KEY = "alaya_shipping_v1";

interface ShippingProfile { id: string; name: string; description: string; carrier: string; method: string; baseRate: number; ratePerKg: number; freeShippingThreshold: number; estimatedDaysMin: number; estimatedDaysMax: number; trackingRequired: boolean; active: boolean; }

function loadProfiles(): ShippingProfile[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return [
    { id: uid("sp"), name: "Standard Ground", description: "5-8 business days", carrier: "Global Express", method: "standard", baseRate: 12, ratePerKg: 2.5, freeShippingThreshold: 150, estimatedDaysMin: 5, estimatedDaysMax: 8, trackingRequired: true, active: true },
    { id: uid("sp"), name: "Express Air", description: "2-3 business days", carrier: "Global Express", method: "express", baseRate: 24, ratePerKg: 4, freeShippingThreshold: 300, estimatedDaysMin: 2, estimatedDaysMax: 3, trackingRequired: true, active: true },
    { id: uid("sp"), name: "Overnight Priority", description: "Next business day", carrier: "Priority Logistics", method: "overnight", baseRate: 48, ratePerKg: 6, freeShippingThreshold: 500, estimatedDaysMin: 1, estimatedDaysMax: 1, trackingRequired: true, active: true },
    { id: uid("sp"), name: "Free Shipping Promo", description: "Free standard shipping", carrier: "Global Express", method: "standard", baseRate: 0, ratePerKg: 0, freeShippingThreshold: 0, estimatedDaysMin: 5, estimatedDaysMax: 10, trackingRequired: false, active: true },
  ];
}

export default function CommerceShipping() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ShippingProfile[]>(loadProfiles);
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<ShippingProfile | null>(null);
  const [tab, setTab] = useState<"profiles" | "zones">("profiles");
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return toast.error("Name required");
    const updated = editing.id ? profiles.map(p => p.id === editing.id ? editing : p) : [...profiles, { ...editing, id: uid("sp") }];
    setProfiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(editing.id ? "Profile updated" : "Profile added");
    setEditing(null);
  };

  return (
    <>
      <Seo title="Shipping" path="/admin/commerce/shipping" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Shipping Management</h1>
            <p className="mt-1 text-sm text-muted">Shipping profiles, carrier settings, and delivery zones.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["profiles","zones"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>{t}</button>
            ))}
            {tab === "profiles" && <button onClick={() => setEditing({ name: "", description: "", carrier: "Global Express", method: "standard", baseRate: 0, ratePerKg: 0, freeShippingThreshold: 150, estimatedDaysMin: 3, estimatedDaysMax: 8, trackingRequired: true, active: true })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add Profile</button>}
          </div>
        </div>

        {tab === "profiles" ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[{ label: "Active Profiles", value: profiles.filter(p => p.active).length, icon: Ship },
                { label: "Avg Rate", value: `$${(profiles.reduce((s, p) => s + p.baseRate, 0) / Math.max(1, profiles.length)).toFixed(2)}`, icon: DollarSign },
                { label: "Free Ship Threshold", value: `$${Math.min(...profiles.map(p => p.freeShippingThreshold))}`, icon: Truck },
                { label: "Tracking Required", value: profiles.filter(p => p.trackingRequired).length, icon: Globe },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <p className="font-display text-2xl font-semibold text-accent">{s.value}</p>
                  <p className="text-xs text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {profiles.length === 0 ? (
              <div className="mt-8"><EmptyState icon={<Ship className="h-6 w-6" />} title="No shipping profiles" /></div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map(p => (
                  <div key={p.id} className={cn("card p-5", !p.active && "opacity-60")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{p.name}</h3>
                        <p className="text-xs text-muted">{p.description} · {p.carrier}</p>
                      </div>
                      <button onClick={() => setEditing({ ...p })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                      <div><p className="text-muted">Base Rate</p><p className="font-medium text-ink"><Money amount={p.baseRate} /></p></div>
                      <div><p className="text-muted">Per Kg</p><p className="font-medium text-ink"><Money amount={p.ratePerKg} /></p></div>
                      <div><p className="text-muted">Free Over</p><p className="font-medium text-ink"><Money amount={p.freeShippingThreshold} /></p></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.estimatedDaysMin}-{p.estimatedDaysMax} days</span>
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {p.trackingRequired ? "Tracking" : "No tracking"}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => { const updated = profiles.map(pp => pp.id === p.id ? { ...pp, active: !pp.active } : pp); setProfiles(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); toast.success(p.active ? "Deactivated" : "Activated"); }} className={cn("btn btn-sm flex-1", p.active ? "btn-ghost" : "btn-primary")}>{p.active ? "Deactivate" : "Activate"}</button>
                      <button onClick={() => setToDelete(p)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Zones Tab */
          <div className="mt-6 card p-5">
            <h2 className="font-semibold text-ink mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Delivery Zones</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted border-b border-line">
                  <tr><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Countries</th><th className="px-4 py-3">Rate Multiplier</th><th className="px-4 py-3">Est. Days</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    { name: "Domestic (US)", countries: ["United States"], multiplier: "1.0x", days: "3-5" },
                    { name: "North America", countries: ["Canada", "Mexico"], multiplier: "1.3x", days: "5-8" },
                    { name: "Europe", countries: ["United Kingdom", "Germany", "France", "Italy", "Spain"], multiplier: "1.6x", days: "7-12" },
                    { name: "Asia Pacific", countries: ["Australia", "Japan", "Singapore", "India"], multiplier: "2.0x", days: "10-15" },
                    { name: "Rest of World", countries: ["All others"], multiplier: "2.5x", days: "14-21" },
                  ].map(z => (
                    <tr key={z.name} className="hover:bg-surface2/40">
                      <td className="px-4 py-3 font-medium text-ink">{z.name}</td>
                      <td className="px-4 py-3 text-xs text-muted">{z.countries.join(", ")}</td>
                      <td className="px-4 py-3">{z.multiplier}</td>
                      <td className="px-4 py-3 text-muted">{z.days} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Profile" : "New Profile"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Profile Name</label><input className="input-field" value={editing.name || ""} onChange={e => setEditing({...editing, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Carrier</label><input className="input-field" value={editing.carrier || ""} onChange={e => setEditing({...editing, carrier: e.target.value})} /></div>
                <div><label className="label-field">Method</label><select className="input-field" value={editing.method || "standard"} onChange={e => setEditing({...editing, method: e.target.value})}><option value="standard">Standard</option><option value="express">Express</option><option value="overnight">Overnight</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Base Rate ($)</label><input type="number" step="0.01" className="input-field" value={editing.baseRate || 0} onChange={e => setEditing({...editing, baseRate: Number(e.target.value)})} /></div>
                <div><label className="label-field">Rate/Kg ($)</label><input type="number" step="0.01" className="input-field" value={editing.ratePerKg || 0} onChange={e => setEditing({...editing, ratePerKg: Number(e.target.value)})} /></div>
                <div><label className="label-field">Free Over ($)</label><input type="number" step="0.01" className="input-field" value={editing.freeShippingThreshold || 0} onChange={e => setEditing({...editing, freeShippingThreshold: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Min Days</label><input type="number" className="input-field" value={editing.estimatedDaysMin || 3} onChange={e => setEditing({...editing, estimatedDaysMin: Number(e.target.value)})} /></div>
                <div><label className="label-field">Max Days</label><input type="number" className="input-field" value={editing.estimatedDaysMax || 8} onChange={e => setEditing({...editing, estimatedDaysMax: Number(e.target.value)})} /></div>
              </div>
              <div><label className="label-field">Description</label><input className="input-field" value={editing.description || ""} onChange={e => setEditing({...editing, description: e.target.value})} /></div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.trackingRequired ?? true} onChange={e => setEditing({...editing, trackingRequired: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Tracking Required</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({...editing, active: e.target.checked})} className="h-4 w-4 accent-[var(--c-accent)]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Create Profile"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Profile" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { setProfiles(profiles.filter(p => p.id !== toDelete.id)); localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.filter(p => p.id !== toDelete.id))); toast.success("Deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>?
      </Dialog>
    </>
  );
}
