import { useState } from "react";
import { Plus, Pencil, Trash2, X, Ticket, Percent, DollarSign, Check } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState } from "../../components/ui";
import type { Coupon } from "../../lib/types";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";

const EMPTY: Partial<Coupon> = { code: "", type: "percent", value: 10, minSpend: 0, active: true, description: "", usedCount: 0 };

export default function AdminCoupons() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [toDelete, setToDelete] = useState<Coupon | null>(null);
  useEscapeKey(() => setEditing(null), editing !== null);
  useLockBody(editing !== null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.code?.trim()) return toast.error("Coupon code is required");
    if (editing.value == null || editing.value <= 0) return toast.error("Enter a valid value");
    if (editing.id) {
      updateCoupon(editing.id, editing);
      toast.success("Coupon updated");
    } else {
      addCoupon({ ...editing, code: editing.code! });
      toast.success("Coupon created");
    }
    setEditing(null);
  };

  return (
    <>
      <Seo title="Coupons" path="/admin/coupons" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Coupons</h1>
            <p className="mt-1 text-sm text-muted">{coupons.filter((c) => c.active).length} active · {coupons.length} total</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add coupon</button>
        </div>

        {coupons.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={<Ticket className="h-6 w-6" />} title="No coupons yet" description="Create discount codes for your customers." action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-md">Add coupon</button>} />
          </div>
        ) : (
          <div className="card mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Min spend</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.map((c) => {
                    const exhausted = c.usageLimit ? c.usedCount >= c.usageLimit : false;
                    const expired = c.expiresAt ? c.expiresAt < Date.now() : false;
                    return (
                      <tr key={c.id} className="hover:bg-surface2/40">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-accent">{c.code}</span>
                          <p className="text-xs text-muted">{c.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-medium text-ink">
                            {c.type === "percent" ? <Percent className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                            {c.value}{c.type === "percent" ? "%" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">${c.minSpend}</td>
                        <td className="px-4 py-3">
                          <span className="text-ink">{c.usedCount}</span>
                          {c.usageLimit && <span className="text-muted"> / {c.usageLimit}</span>}
                          {c.expiresAt && <p className="text-xs text-muted">exp {formatDate(c.expiresAt)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("badge", c.active && !exhausted && !expired ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                            {exhausted ? "Exhausted" : expired ? "Expired" : c.active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditing({ ...c })} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setToDelete(c)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Coupon editor">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={save} className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit coupon" : "New coupon"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label-field" htmlFor="cpn-code">Code</label>
                <input id="cpn-code" className="input-field font-mono uppercase" value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
              </div>
              <div>
                <label className="label-field">Type</label>
                <div className="flex gap-2">
                  {(["percent", "fixed"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setEditing({ ...editing, type: t })} className={cn("chip capitalize", editing.type === t && "chip-active")}>{t === "percent" ? "Percentage" : "Fixed amount"}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field" htmlFor="cpn-value">Value {editing.type === "percent" ? "(%)" : "($)"}</label><input id="cpn-value" type="number" min={0} step="0.01" className="input-field" value={editing.value ?? 0} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} /></div>
                <div><label className="label-field" htmlFor="cpn-minspend">Min spend ($)</label><input id="cpn-minspend" type="number" min={0} className="input-field" value={editing.minSpend ?? 0} onChange={(e) => setEditing({ ...editing, minSpend: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field" htmlFor="cpn-limit">Usage limit</label><input id="cpn-limit" type="number" min={0} className="input-field" value={editing.usageLimit ?? ""} onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value ? Number(e.target.value) : undefined })} placeholder="Unlimited" /></div>
                <div><label className="label-field" htmlFor="cpn-expires">Expires (days)</label><input id="cpn-expires" type="number" min={1} className="input-field" value="" onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value ? Date.now() + Number(e.target.value) * 86400000 : undefined })} placeholder="Optional" /></div>
              </div>
              <div><label className="label-field" htmlFor="cpn-desc">Description</label><input id="cpn-desc" className="input-field" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                <Check className="h-4 w-4" /> Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save changes" : "Create coupon"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete coupon"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { if (toDelete) { deleteCoupon(toDelete.id); toast.success("Coupon deleted"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button>
          </>
        }
      >
        Delete coupon <strong className="font-mono">{toDelete?.code}</strong>? It can no longer be redeemed.
      </Dialog>
    </>
  );
}
