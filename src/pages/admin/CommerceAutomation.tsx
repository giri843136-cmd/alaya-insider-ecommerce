import { useState } from "react";
import { Trash2, Workflow, Zap, Bell, ShoppingCart, Truck, RefreshCw, BarChart3, MessageSquare, Clock, Play, Pause } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import { uid } from "../../lib/utils";

const STORAGE_KEY = "alaya_automation_v1";

interface Automation { id: string; name: string; description: string; trigger: string; enabled: boolean; actions: string[]; createdAt: number; }

function loadAutomations(): Automation[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return [
    { id: uid("auto"), name: "Order Received → Notify Supplier", description: "When a new order is placed, automatically notify the supplier via email", trigger: "order_received", enabled: true, actions: ["send_email", "create_purchase_order"], createdAt: Date.now() - 86400000 * 30 },
    { id: uid("auto"), name: "Payment Confirmed → Update Inventory", description: "Deduct inventory when payment is confirmed", trigger: "order_paid", enabled: true, actions: ["update_inventory", "update_order_status"], createdAt: Date.now() - 86400000 * 20 },
    { id: uid("auto"), name: "Supplier Ships → Notify Customer", description: "Send tracking number to customer when supplier ships", trigger: "order_shipped", enabled: true, actions: ["send_email", "update_tracking"], createdAt: Date.now() - 86400000 * 15 },
    { id: uid("auto"), name: "Low Stock Alert", description: "Notify admin when stock falls below threshold", trigger: "stock_low", enabled: true, actions: ["notify_admin"], createdAt: Date.now() - 86400000 * 10 },
    { id: uid("auto"), name: "Return Requested → Create Task", description: "Create a support task when a return is requested", trigger: "return_requested", enabled: false, actions: ["create_task", "notify_admin"], createdAt: Date.now() - 86400000 * 5 },
  ];
}

const TRIGGER_ICONS: Record<string, any> = {
  order_received: ShoppingCart, order_confirmed: ShoppingCart, order_paid: Zap,
  order_shipped: Truck, order_delivered: Truck, stock_low: Bell, stock_out: Bell,
  supplier_confirmed: RefreshCw, return_requested: RefreshCw, customer_created: MessageSquare,
  schedule: Clock, manual: Play,
};

const ACTION_LABELS: Record<string, string> = {
  send_email: "Send Email", notify_admin: "Notify Admin", create_purchase_order: "Create PO",
  update_inventory: "Update Inventory", update_order_status: "Update Status",
  send_sms: "Send SMS", create_task: "Create Task", update_tracking: "Update Tracking",
  charge_payment: "Charge Payment", refund_payment: "Refund", webhook: "Webhook Call",
};

export default function CommerceAutomation() {
  const toast = { success: (msg: string) => alert(msg) };
  const [automations, setAutomations] = useState<Automation[]>(loadAutomations);
  const [toDelete, setToDelete] = useState<Automation | null>(null);

  const toggle = (id: string) => {
    const updated = automations.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAutomations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(updated.find(a => a.id === id)?.enabled ? "Enabled" : "Disabled");
  };

  const remove = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(automations.filter(a => a.id !== id)));
    toast.success("Workflow deleted");
    setToDelete(null);
  };

  return (
    <>
      <Seo title="Automation Center" path="/admin/commerce/automation" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Automation Center</h1>
            <p className="mt-1 text-sm text-muted">Visual workflow builder for dropshipping automation.</p>
          </div>
          <span className="text-xs text-muted">Use the cards below to manage automation workflows.</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Active Workflows", value: automations.filter(a => a.enabled).length, icon: Zap },
            { label: "Total Workflows", value: automations.length, icon: Workflow },
            { label: "Triggers Active", value: new Set(automations.filter(a => a.enabled).map(a => a.trigger)).size, icon: Bell },
            { label: "Actions Auto", value: automations.reduce((s, a) => s + a.actions.length, 0), icon: BarChart3 },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="font-display text-2xl font-semibold text-accent">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {automations.length === 0 ? (            <div className="mt-8 py-16 text-center"><Workflow className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 text-sm text-muted">No workflows yet.</p></div>
        ) : (
          <div className="mt-6 space-y-4">
            {automations.map(a => {
              const TriggerIcon = TRIGGER_ICONS[a.trigger] || Zap;
              return (
                <div key={a.id} className={cn("card p-5", !a.enabled && "opacity-60")}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full", a.enabled ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>
                        <TriggerIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink">{a.name}</h3>
                          <span className="badge bg-surface2 text-muted text-[0.55rem]">{a.trigger.replace(/_/g, " ")}</span>
                        </div>
                        <p className="text-sm text-muted mt-1">{a.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {a.actions.map(action => (
                            <span key={action} className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-xs text-muted">
                              <Zap className="h-3 w-3 text-accent" />
                              {ACTION_LABELS[action] || action}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => toggle(a.id)} className={cn("btn btn-sm", a.enabled ? "btn-ghost" : "btn-primary")}>
                        {a.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setToDelete(a)} className="btn btn-sm border border-line text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  {/* Visual Flow */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <span className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent capitalize">{a.trigger.replace(/_/g, " ")}</span>
                    <span className="text-muted text-xs">↓</span>
                    {a.actions.map((action, i) => (
                      <div key={action} className="flex items-center gap-2">
                        <span className="rounded-lg bg-surface2 px-3 py-1.5 text-xs text-muted">{ACTION_LABELS[action] || action}</span>
                        {i < a.actions.length - 1 && <span className="text-muted text-xs">→</span>}
                      </div>
                    ))}
                    <span className="text-muted text-xs">→</span>
                    <span className="rounded-lg bg-success/15 px-3 py-1.5 text-xs font-medium text-success">Analytics</span>
                    <span className="text-muted text-xs">→</span>
                    <span className="rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">AI Summary</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fulfillment Flow */}
        <div className="mt-6 card p-5 bg-accent-soft/10 border-accent/10">
          <h3 className="flex items-center gap-2 font-semibold text-ink mb-4"><Truck className="h-4 w-4 text-accent" /> Fulfillment Automation Flow</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["Customer Order", "Inventory Check", "Supplier Selection", "Purchase Order", "Supplier Confirmation", "Tracking Number", "Customer Notification", "Analytics", "Completed"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className={cn("rounded-lg px-3 py-2 font-medium", i === 0 ? "bg-accent text-accent-ink" : i === 8 ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{step}</span>
                {i < 8 && <span className="text-muted">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Workflow" footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { remove(toDelete.id); } }} className="btn btn-md bg-danger text-white">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>?
      </Dialog>
    </>
  );
}
