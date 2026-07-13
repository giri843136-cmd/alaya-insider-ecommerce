import { useState } from "react";
import { Plus, Trash2, CreditCard, Check, Globe, ShieldCheck } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { Dialog, EmptyState } from "../../components/ui";
import type { PaymentGateway } from "../../lib/types";
import { cn } from "@/utils/cn";

const CODES = ["stripe", "paypal", "razorpay", "cod", "bank", "upi", "applepay", "googlepay", "amazonpay", "authorize"];

export default function AdminGateways() {
  const { paymentGateways, addGateway, updateGateway, deleteGateway } = useStore();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<PaymentGateway | null>(null);
  const [code, setCode] = useState("stripe");
  const [name, setName] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const label = name.trim() || code.charAt(0).toUpperCase() + code.slice(1);
    addGateway({ code, name: label, active: true, mode: "sandbox", countries: [] });
    toast.success("Gateway added");
    setName("");
  };

  return (
    <>
      <Seo title="Payment Gateways" path="/admin/gateways" />
      <div className="p-5 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Payment Gateways</h1>
          <p className="mt-1 text-sm text-muted">{paymentGateways.filter((g) => g.active).length} active · {paymentGateways.length} configured.</p>
        </div>

        {/* Add */}
        <form onSubmit={add} className="card mt-6 flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="label-field">Gateway</label>
            <select value={code} onChange={(e) => setCode(e.target.value)} className="input-field">
              {CODES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="label-field">Display name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stripe (Cards)" />
          </div>
          <button type="submit" className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add</button>
        </form>

        {paymentGateways.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<CreditCard className="h-6 w-6" />} title="No gateways yet" /></div>
        ) : (
          <div className="mt-6 space-y-3">
            {paymentGateways.map((g) => (
              <div key={g.id} className="card flex flex-wrap items-center gap-4 p-4">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", g.active ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}><CreditCard className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{g.name}</p>
                    <span className="font-mono text-xs text-muted">{g.code}</span>
                    <span className={cn("badge", g.mode === "live" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{g.mode}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Globe className="h-3 w-3" />
                    {g.countries.length === 0 ? "All countries" : g.countries.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateGateway(g.id, { mode: g.mode === "live" ? "sandbox" : "live" })} className="btn-ghost btn-sm" aria-label="Toggle mode">{g.mode === "live" ? "Go test" : "Go live"}</button>
                  <button onClick={() => updateGateway(g.id, { active: !g.active })} className={cn("chip", g.active && "chip-active")} aria-pressed={g.active}>{g.active ? <><Check className="h-3 w-3" /> Active</> : "Disabled"}</button>
                  <button onClick={() => setToDelete(g)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-accent" /> Gateways are country-restricted automatically at checkout. Keys are stored securely server-side in production.</p>
      </div>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Remove gateway" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteGateway(toDelete.id); toast.success("Gateway removed"); setToDelete(null); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Remove</button></>}>
        Remove <strong>{toDelete?.name}</strong> from checkout?
      </Dialog>
    </>
  );
}
