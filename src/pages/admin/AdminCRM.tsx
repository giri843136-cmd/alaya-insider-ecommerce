import { useState } from "react";
import { Users, Search, Clock, ShoppingBag, Heart, FileText, CheckSquare, MessageSquare, Download, Crown, TrendingUp, Award, Gift, Pin, Trash2, Plus, X, Send } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useEscapeKey, useLockBody } from "../../lib/hooks";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { EmptyState, Money } from "../../components/ui";
import { formatDate, formatDateTime, formatPrice } from "../../lib/utils";
import { downloadCsv } from "../../lib/csv";
import type { Customer, SupportTicket } from "../../lib/types";
import { cn } from "@/utils/cn";

type SegId = "all" | "vip" | "new" | "returning" | "inactive";

export default function AdminCRM() {
  const { customers, orders, supportTickets, settings } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<SegId>("all");
  const [selected, setSelected] = useState<Customer | null>(null);

  const ordersFor = (c: Customer) => orders.filter((o) => o.customer.email.toLowerCase() === c.email.toLowerCase());
  const spendOf = (c: Customer) => ordersFor(c).reduce((s, o) => s + o.total, 0);
  const classify = (c: Customer): SegId[] => {
    const segs: SegId[] = [];
    const n = ordersFor(c).length;
    if (c.status === "vip" || spendOf(c) >= 300) segs.push("vip");
    if (n === 0 || (c.timeline.length <= 2 && Date.now() - c.createdAt < 14 * 86400000)) segs.push("new");
    if (n > 1) segs.push("returning");
    if (Date.now() - (c.lastLogin || c.createdAt) > 30 * 86400000) segs.push("inactive");
    return segs;
  };

  const filtered = customers.filter((c) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
    }
    if (segment === "all") return true;
    return classify(c).includes(segment);
  });

  const totalRevenue = customers.reduce((s, c) => s + spendOf(c), 0);
  const vipCount = customers.filter((c) => classify(c).includes("vip")).length;
  const ticketsOpen = supportTickets.filter((t) => t.status === "open" || t.status === "pending").length;
  const avgClv = customers.length ? totalRevenue / customers.length : 0;

  const STATS = [
    { label: "Customers", value: String(customers.length), sub: "Total accounts", icon: Users },
    { label: "VIP customers", value: String(vipCount), sub: "High value", icon: Crown },
    { label: "Avg. CLV", value: formatPrice(avgClv, settings.currency), sub: "Lifetime value", icon: TrendingUp },
    { label: "Open tickets", value: String(ticketsOpen), sub: "Needs attention", icon: MessageSquare },
  ];

  const exportCustomers = () => {
    const csv = "Name,Email,Status,Orders,Spend,Loyalty,Country\n" + customers.map((c) => `${c.name},${c.email},${c.status},${ordersFor(c).length},${spendOf(c)},${c.loyaltyPoints || 0},${c.country || ""}`).join("\n");
    downloadCsv(`alaya-customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success("Customers exported", `${customers.length} records.`);
  };

  return (
    <>
      <Seo title="CRM" path="/admin/crm" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">CRM</h1>
            <p className="mt-1 text-sm text-muted">Customer 360 — the complete customer journey.</p>
          </div>
          <button onClick={exportCustomers} className="btn-outline btn-sm"><Download className="h-4 w-4" /> Export</button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="text-xs text-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Segments + search */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="input-field pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {([["all", "All"], ["vip", "VIP"], ["new", "New"], ["returning", "Returning"], ["inactive", "Inactive"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setSegment(id)} className={cn("chip", segment === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const segs = classify(c);
            return (
              <button key={c.id} onClick={() => setSelected(c)} className="card p-5 text-left transition-shadow hover:shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{c.name.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.email}</p>
                  </div>
                  {segs.includes("vip") && <Crown className="h-4 w-4 text-accent" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {segs.map((s) => <span key={s} className={cn("badge capitalize", s === "vip" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{s}</span>)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                  <span><Money amount={spendOf(c)} /> · {ordersFor(c).length} orders</span>
                  <span>{c.loyaltyPoints || 0} pts</span>
                </div>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="mt-8"><EmptyState icon={<Users className="h-6 w-6" />} title="No customers found" /></div>}
      </div>

      {/* Customer 360 drawer */}
      {selected && <Customer360 customer={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

/* ----------------------- Customer 360 Drawer ----------------------- */
function Customer360({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { orders, supportTickets, addCustomerNote, deleteCustomerNote, addCustomerTask, toggleCustomerTask, replyTicket, updateTicketStatus, settings } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"profile" | "timeline" | "orders" | "notes" | "tasks" | "tickets">("profile");
  const [noteText, setNoteText] = useState("");
  const [ticketReply, setTicketReply] = useState("");
  useEscapeKey(onClose, true);
  useLockBody(true);

  const myOrders = orders.filter((o) => o.customer.email.toLowerCase() === customer.email.toLowerCase());
  const totalSpend = myOrders.reduce((s, o) => s + o.total, 0);
  const myTickets = supportTickets.filter((t) => t.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true" aria-label={`Customer: ${customer.name}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <aside className="hide-scrollbar relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-canvas animate-drawer p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-xl font-semibold text-accent-ink">{customer.name.slice(0, 1)}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-ink">{customer.name}</h2>
                <span className={cn("badge capitalize", customer.status === "vip" ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{customer.status}</span>
              </div>
              <p className="text-sm text-muted">{customer.email} · {customer.country || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-line bg-surface p-3"><ShoppingBag className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 font-display text-lg font-semibold text-ink">{myOrders.length}</p><p className="text-[0.65rem] text-muted">Orders</p></div>
          <div className="rounded-xl border border-line bg-surface p-3"><TrendingUp className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 font-display text-lg font-semibold text-ink"><Money amount={totalSpend} /></p><p className="text-[0.65rem] text-muted">Spend</p></div>
          <div className="rounded-xl border border-line bg-surface p-3"><Award className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 font-display text-lg font-semibold text-ink">{customer.loyaltyPoints || 0}</p><p className="text-[0.65rem] text-muted">Points</p></div>
          <div className="rounded-xl border border-line bg-surface p-3"><MessageSquare className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 font-display text-lg font-semibold text-ink">{myTickets.length}</p><p className="text-[0.65rem] text-muted">Tickets</p></div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
          {([["profile", "Profile"], ["timeline", "Timeline"], ["orders", "Orders"], ["notes", "Notes"], ["tasks", "Tasks"], ["tickets", "Tickets"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors", tab === id ? "text-accent" : "text-muted hover:text-ink")}>
              {label}
              {tab === id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* PROFILE */}
          {tab === "profile" && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-ink">Customer details</h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Phone</dt><dd className="font-medium text-ink">{customer.phone || "—"}</dd></div>
                  <div><dt className="text-muted">Country</dt><dd className="font-medium text-ink">{customer.country || "—"}</dd></div>
                  <div><dt className="text-muted">Language</dt><dd className="font-medium text-ink uppercase">{customer.language || "en"}</dd></div>
                  <div><dt className="text-muted">Currency</dt><dd className="font-medium text-ink">{settings.currency.code}</dd></div>
                  <div><dt className="text-muted">Registered</dt><dd className="font-medium text-ink">{formatDate(customer.createdAt)}</dd></div>
                  <div><dt className="text-muted">Last login</dt><dd className="font-medium text-ink">{customer.lastLogin ? formatDate(customer.lastLogin) : "—"}</dd></div>
                </dl>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Gift className="h-4 w-4 text-accent" /> Loyalty & referrals</h3>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-surface2/50 p-3"><p className="font-semibold text-ink">{customer.loyaltyPoints || 0}</p><p className="text-xs text-muted">Points</p></div>
                  <div className="rounded-lg bg-surface2/50 p-3"><p className="font-semibold text-ink"><Money amount={customer.storeCredit || 0} /></p><p className="text-xs text-muted">Credit</p></div>
                  <div className="rounded-lg bg-surface2/50 p-3"><p className="truncate font-mono text-xs font-semibold text-accent">{customer.referralCode || "—"}</p><p className="text-xs text-muted">Referral</p></div>
                </div>
              </div>
              {customer.preferences && (
                <div className="card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Heart className="h-4 w-4 text-accent" /> Preferences</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div><span className="text-muted">Favorite brands: </span><span className="text-ink">{customer.preferences.favoriteBrands.join(", ") || "—"}</span></div>
                    <div><span className="text-muted">Favorite categories: </span><span className="text-ink">{customer.preferences.favoriteCategories.join(", ") || "—"}</span></div>
                    <div><span className="text-muted">Marketing opt-in: </span><span className={customer.preferences.marketingOptIn ? "text-success" : "text-muted"}>{customer.preferences.marketingOptIn ? "Yes" : "No"}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {tab === "timeline" && (
            <div className="space-y-3">
              {customer.timeline.length === 0 ? <EmptyState icon={<Clock className="h-6 w-6" />} title="No timeline events" /> : (
                <ol className="relative space-y-4 border-l-2 border-line pl-6">
                  {customer.timeline.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[1.65rem] grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.6rem] text-accent-ink">●</span>
                      <p className="text-sm font-medium text-ink">{e.label}</p>
                      <p className="text-xs text-muted">{formatDateTime(e.ts)} · {e.type.replace(/_/g, " ")}</p>
                      {e.meta && <p className="text-xs text-muted">{e.meta}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* ORDERS */}
          {tab === "orders" && (
            <div className="space-y-3">
              {myOrders.length === 0 ? <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="No orders yet" /> : myOrders.map((o) => (
                <div key={o.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium text-ink">{o.number}</p><p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.items.length} items</p></div>
                    <div className="text-right"><span className={cn("badge capitalize", o.status === "delivered" || o.status === "completed" ? "bg-success/15 text-success" : "bg-accent-soft text-accent")}>{o.status}</span><p className="mt-1 text-sm font-semibold"><Money amount={o.total} /></p></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NOTES */}
          {tab === "notes" && (
            <div>
              <form onSubmit={(e) => { e.preventDefault(); if (!noteText.trim()) return; addCustomerNote(customer.id, "admin", noteText.trim()); setNoteText(""); toast.success("Note added"); }} className="flex gap-2">
                <input className="input-field flex-1" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" />
                <button type="submit" className="btn-primary btn-sm"><Plus className="h-4 w-4" /></button>
              </form>
              <div className="mt-4 space-y-3">
                {customer.notes.length === 0 ? <EmptyState icon={<FileText className="h-6 w-6" />} title="No notes yet" /> : customer.notes.map((n) => (
                  <div key={n.id} className={cn("card p-4", n.pinned && "ring-1 ring-accent/40")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {n.pinned && <Pin className="h-3 w-3 text-accent" />}
                          {n.private && <span className="badge bg-warning/15 text-warning">Private</span>}
                          <span className="text-xs font-medium text-muted">{n.author} · {formatDate(n.ts)}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink">{n.body}</p>
                      </div>
                      <button onClick={() => { deleteCustomerNote(customer.id, n.id); toast.success("Note deleted"); }} className="grid h-7 w-7 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASKS */}
          {tab === "tasks" && (
            <div>
              <button onClick={() => { addCustomerTask(customer.id, { title: "Follow up call", type: "follow_up", assignee: "Support", priority: "medium", done: false }); toast.success("Task created"); }} className="btn-outline btn-sm"><Plus className="h-4 w-4" /> Add task</button>
              <div className="mt-4 space-y-2">
                {customer.tasks.length === 0 ? <EmptyState icon={<CheckSquare className="h-6 w-6" />} title="No tasks" /> : customer.tasks.map((t) => (
                  <div key={t.id} className="card flex items-center gap-3 p-4">
                    <button onClick={() => toggleCustomerTask(customer.id, t.id)} className={cn("grid h-6 w-6 shrink-0 place-items-center rounded border-2", t.done ? "border-accent bg-accent text-accent-ink" : "border-line")}>{t.done && <CheckSquare className="h-3.5 w-3.5" />}</button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium", t.done ? "text-muted line-through" : "text-ink")}>{t.title}</p>
                      <p className="text-xs text-muted capitalize">{t.type} · {t.assignee} · {t.priority} priority{t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TICKETS */}
          {tab === "tickets" && (
            <div className="space-y-3">
              {myTickets.length === 0 ? <EmptyState icon={<MessageSquare className="h-6 w-6" />} title="No support tickets" /> : myTickets.map((t) => (
                <div key={t.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium text-ink">{t.subject}</p><p className="text-xs text-muted">{t.number} · {formatDate(t.createdAt)}</p></div>
                    <select value={t.status} onChange={(e) => updateTicketStatus(t.id, e.target.value as SupportTicket["status"])} className={cn("rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize", t.status === "resolved" || t.status === "closed" ? "bg-success/15 text-success" : t.status === "open" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning")}>
                      <option>open</option><option>pending</option><option>resolved</option><option>closed</option>
                    </select>
                  </div>
                  <div className="mt-3 space-y-2">
                    {t.messages.map((m, i) => (
                      <div key={i} className={cn("rounded-lg p-3 text-sm", m.author === "ALAYA Support" ? "bg-accent-soft" : "bg-surface2/50")}>
                        <p className="text-xs font-medium text-muted">{m.author} · {formatDateTime(m.ts)}</p>
                        <p className="mt-0.5 text-ink">{m.body}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); if (!ticketReply.trim()) return; replyTicket(t.id, "ALAYA Support", ticketReply.trim()); setTicketReply(""); toast.success("Reply sent"); }} className="mt-3 flex gap-2">
                    <input className="input-field flex-1" value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Reply…" />
                    <button type="submit" className="btn-primary btn-sm"><Send className="h-4 w-4" /></button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
