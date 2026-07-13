import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Truck, PackageCheck, Home, CheckCircle2, Clock, XCircle, MapPin } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { Breadcrumbs, EmptyState, Money } from "../components/ui";
import { formatDateTime } from "../lib/utils";
import type { Order } from "../lib/types";
import { cn } from "@/utils/cn";
import { STATUS_INDEX } from "../lib/orderStatus";

const STEPS: { key: "pending" | "paid" | "shipped" | "delivered"; label: string; icon: typeof Truck }[] = [
  { key: "pending", label: "Order placed", icon: Clock },
  { key: "paid", label: "Payment confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const ORDER_INDEX = STATUS_INDEX;

export default function TrackOrder() {
  const { orders } = useStore();
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ order?: Order; searched: boolean }>({ searched: false });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = number.trim().toLowerCase();
    const e2 = email.trim().toLowerCase();
    const order = orders.find(
      (o) =>
        o.number.toLowerCase() === q &&
        (!e2 || o.customer.email.toLowerCase() === e2)
    );
    setResult({ order, searched: true });
  };

  return (
    <>
      <Seo title="Track your order" description="Track the status of your ALAYA INSIDER order in real time." path="/track-order" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Track order" }]} />
      </div>

      <section className="container-edge pb-24">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <span className="eyebrow mb-3">Order tracking</span>
            <h1 className="text-display-m text-ink">Track your order</h1>
            <p className="mt-3 text-muted">Enter your order number to see its current status and estimated delivery.</p>
          </Reveal>

          <form onSubmit={submit} className="card mt-6 p-6" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field" htmlFor="track-num">Order number</label>
                <input id="track-num" className="input-field" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="AL-481203" />
              </div>
              <div>
                <label className="label-field" htmlFor="track-email">Email (optional)</label>
                <input id="track-email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-md mt-4 w-full"><Search className="h-4 w-4" /> Track order</button>
            <p className="mt-3 text-xs text-muted">Try <button type="button" onClick={() => { setNumber("AL-481488"); setEmail("meera@example.com"); }} className="font-medium text-accent">AL-481488</button> / meera@example.com</p>
          </form>

          {/* Result */}
          {result.searched && (
            <div className="mt-8 animate-fade-in">
              {!result.order ? (
                <EmptyState
                  icon={<Search className="h-6 w-6" />}
                  title="Order not found"
                  description="Double-check your order number. If the issue persists, our team can help."
                  action={<Link to="/contact" className="btn-outline btn-md">Contact support</Link>}
                />
              ) : (
                <OrderTimeline order={result.order} />
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function OrderTimeline({ order }: { order: Order }) {
  const cancelled = order.status === "cancelled";
  const current = ORDER_INDEX[order.status];

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div>
          <p className="font-semibold text-ink">{order.number}</p>
          <p className="text-xs text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Total</p>
          <p className="text-lg font-semibold text-ink"><Money amount={order.total} /></p>
        </div>
      </div>

      {cancelled ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-danger/10 p-4">
          <XCircle className="h-6 w-6 text-danger" />
          <div>
            <p className="font-semibold text-danger">This order was cancelled</p>
            <p className="text-sm text-muted">If you didn't request this, please contact support.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Progress steps */}
          <ol className="mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {STEPS.map((step, i) => {
              const done = i <= current;
              const active = i === current;
              const Icon = step.icon;
              return (
                <li key={step.key} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <span className={cn("absolute left-1/2 top-5 hidden h-0.5 w-full sm:block", i < current ? "bg-accent" : "bg-line")} aria-hidden="true" />
                  )}
                  <span className={cn(
                    "relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition-colors",
                    done ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted",
                    active && "ring-4 ring-accent-soft"
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={cn("mt-2 text-xs font-medium", done ? "text-ink" : "text-muted")}>{step.label}</span>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex items-start gap-3 rounded-xl bg-surface2/60 p-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="text-sm">
              <p className="font-medium text-ink">Shipping to</p>
              <p className="text-muted">{order.customer.name}</p>
              {order.customer.address && <p className="text-muted">{order.customer.address}, {order.customer.city}, {order.customer.country}</p>}
            </div>
          </div>
        </>
      )}

      {/* Items */}
      <div className="mt-6 border-t border-line pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Items ({order.items.length})</p>
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.productId} className="flex items-center gap-3">
              <img src={it.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{it.name}</span>
              <span className="text-sm text-muted">×{it.qty}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/shop" className="btn-outline btn-sm"><Home className="h-4 w-4" /> Continue shopping</Link>
        <Link to="/contact" className="btn-ghost btn-sm">Need help?</Link>
      </div>
    </div>
  );
}
