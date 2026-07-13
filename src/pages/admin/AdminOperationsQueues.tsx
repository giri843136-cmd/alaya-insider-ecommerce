/**
 * ALAYA INSIDER — Operations Queues (PART 3.6)
 * ------------------------------------------------------------------
 * Content, commerce, customer, marketing operations queues with
 * publishing, review, approval workflows and queue monitoring.
 */
import { useState } from "react";
import {
  BookOpen, ShoppingBag, Users, Megaphone, Check,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";
import { useStore } from "../../context/StoreContext";

type QueueView = "content" | "commerce" | "customer" | "marketing";

export default function AdminOperationsQueues() {
  const [view, setView] = useState<QueueView>("content");
  const { orders, articles, products, customers, affiliates } = useStore();

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "paid");
  const pendingArticles = articles.filter((a) => !a.featured);
  const pendingProducts = products.filter((p) => p.status === "draft");
  const pendingAffiliates = affiliates.filter((a) => !a.active);

  return (
    <>
      <Seo title="Operations Queues" path="/admin/operations-queues" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Operations Queues</h1>
            <p className="mt-1 text-sm text-muted">Publishing, review, approval workflows across all departments.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["content", "commerce", "customer", "marketing"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("btn-sm capitalize", view === v ? "btn-primary" : "btn-ghost")}>
              {v === "content" && <BookOpen className="h-4 w-4" />}
              {v === "commerce" && <ShoppingBag className="h-4 w-4" />}
              {v === "customer" && <Users className="h-4 w-4" />}
              {v === "marketing" && <Megaphone className="h-4 w-4" />}
              {v}
            </button>
          ))}
        </div>

        {view === "content" && (
          <div className="mt-6 space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink mb-3"><BookOpen className="h-5 w-5 text-accent" /> Editorial Queue</h2>
            {pendingArticles.length === 0 ? (
              <EmptyState icon={<BookOpen className="h-6 w-6" />} title="All articles published" description="No pending content in queue." />
            ) : (
              pendingArticles.slice(0, 10).map((a) => (
                <div key={a.id} className="card flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={a.cover} alt="" className="h-12 w-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{a.title}</p>
                      <p className="text-xs text-muted">{a.author} · {formatDateTime(a.publishedAt)}</p>
                    </div>
                  </div>
                  <Badge variant="warning">Pending review</Badge>
                </div>
              ))
            )}
          </div>
        )}

        {view === "commerce" && (
          <div className="mt-6 space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink mb-3"><ShoppingBag className="h-5 w-5 text-accent" /> Commerce Queue</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-4">
                <p className="text-xs text-muted">Pending Orders</p>
                <p className="text-2xl font-semibold text-ink mt-1">{pendingOrders.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-muted">Draft Products</p>
                <p className="text-2xl font-semibold text-ink mt-1">{pendingProducts.length}</p>
              </div>
            </div>
            {pendingOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="card flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-ink">{o.number}</p>
                  <p className="text-xs text-muted">{o.customer.name} · ${o.total}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{o.status}</Badge>
                  <button className="btn-ghost btn-xs"><Check className="h-3.5 w-3.5" /> Process</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "customer" && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink mb-3"><Users className="h-5 w-5 text-accent" /> Customer Operations</h2>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="card p-4 text-center"><p className="text-xs text-muted">Total Customers</p><p className="text-2xl font-semibold text-ink mt-1">{customers.length}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Active Today</p><p className="text-2xl font-semibold text-ink mt-1">3</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Newsletter Subs</p><p className="text-2xl font-semibold text-ink mt-1">{customers.filter((c) => c.newsletter).length}</p></div>
            </div>
          </div>
        )}

        {view === "marketing" && (
          <div className="mt-6 space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink mb-3"><Megaphone className="h-5 w-5 text-accent" /> Marketing Queue</h2>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="card p-4 text-center"><p className="text-xs text-muted">Affiliate Partners</p><p className="text-2xl font-semibold text-ink mt-1">{affiliates.length}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Pending Activation</p><p className="text-2xl font-semibold text-ink mt-1">{pendingAffiliates.length}</p></div>
              <div className="card p-4 text-center"><p className="text-xs text-muted">Active Campaigns</p><p className="text-2xl font-semibold text-ink mt-1">3</p></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
