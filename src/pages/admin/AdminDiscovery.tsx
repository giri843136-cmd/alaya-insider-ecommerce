import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Bookmark,
  Heart,
  Trash2,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import {
  getExplorationTimeline,
  getSavedSearches,
  getCollections,
  getBookmarks,
  getDiscoveryStats,
  clearExplorationTimeline,
  type ExplorationEvent,
} from "../../lib/discovery";
import { cn } from "@/utils/cn";
import { formatDateTime } from "../../lib/utils";

export default function AdminDiscovery() {
  const { products } = useStore();
  const [activeTab, setActiveTab] = useState<"timeline" | "searches" | "collections" | "bookmarks">("timeline");
  const [events, setEvents] = useState<ExplorationEvent[]>([]);
  const [stats, setStats] = useState(getDiscoveryStats());

  // Refresh on mount
  useEffect(() => {
    setEvents(getExplorationTimeline(100));
    setStats(getDiscoveryStats());
  }, []);

  const clearTimeline = () => {
    clearExplorationTimeline();
    setEvents([]);
    setStats(getDiscoveryStats());
  };

  const getProductImage = (productId: string) => {
    const p = products.find((p) => p.id === productId);
    return p?.images[0] || "";
  };

  const typeIcons: Record<string, typeof Eye> = {
    page_view: Eye,
    product_view: Eye,
    search: Search,
    wishlist_add: Heart,
    cart_add: Heart,
  };

  const tabs = [
    { id: "timeline" as const, label: "Exploration Timeline", count: events.length },
    { id: "searches" as const, label: "Saved Searches", count: stats.savedSearches },
    { id: "collections" as const, label: "Personal Collections", count: stats.personalCollections },
    { id: "bookmarks" as const, label: "Bookmarks", count: stats.bookmarks },
  ];

  return (
    <>
      <Seo title="Discovery" path="/admin/discovery" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Discovery Engine</h1>
            <p className="mt-1 text-sm text-muted">Explore how customers browse, search, and save content.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Page views", value: stats.totalPageViews, icon: Eye },
            { label: "Product views", value: stats.totalProductViews, icon: Eye },
            { label: "Searches", value: stats.totalSearches, icon: Search },
            { label: "Bookmarks", value: stats.bookmarks, icon: Bookmark },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-line pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeTab === t.id ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2"
              )}
            >
              {t.label}
              <span className="rounded-full bg-surface2 px-1.5 py-0.5 text-xs">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        {activeTab === "timeline" && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">Recent exploration events ({stats.explorationTimelineDays} days tracked)</p>
              <button onClick={clearTimeline} className="btn-ghost btn-sm text-danger">
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            </div>
            <div className="space-y-2">
              {events.slice(0, 50).map((event) => {
                const Icon = typeIcons[event.type] || Eye;
                return (
                  <div key={event.id} className="card flex items-center gap-3 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface2 text-muted">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{event.label}</p>
                      <p className="text-xs text-muted">{event.type.replace(/_/g, " ")} · {event.path}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{formatDateTime(event.ts)}</span>
                  </div>
                );
              })}
              {events.length === 0 && (
                <div className="py-12 text-center text-sm text-muted">
                  No exploration events yet. Start browsing the storefront to collect data.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Searches */}
        {activeTab === "searches" && (
          <div className="mt-6 space-y-2">
            {getSavedSearches().map((s) => (
              <div key={s.id} className="card flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-ink">{s.query}</p>
                  <p className="text-xs text-muted">Saved {formatDateTime(s.createdAt)}</p>
                </div>
                <span className="text-xs text-muted">
                  {s.notifyOnNew ? "Notifications on" : "Notifications off"}
                </span>
              </div>
            ))}
            {getSavedSearches().length === 0 && (
              <div className="py-12 text-center text-sm text-muted">No saved searches yet.</div>
            )}
          </div>
        )}

        {/* Collections */}
        {activeTab === "collections" && (
          <div className="mt-6 space-y-3">
            {getCollections().map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    {c.description && <p className="text-sm text-muted">{c.description}</p>}
                  </div>
                  <span className="text-xs text-muted">
                    {c.productIds.length} items · {c.isPublic ? "Public" : "Private"}
                  </span>
                </div>
                <div className="mt-3 flex -space-x-2">
                  {c.productIds.slice(0, 5).map((pid) => (
                    <img
                      key={pid}
                      src={getProductImage(pid)}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 border-canvas object-cover"
                    />
                  ))}
                  {c.productIds.length > 5 && (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-canvas bg-surface2 text-xs font-medium text-muted">
                      +{c.productIds.length - 5}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {getCollections().length === 0 && (
              <div className="py-12 text-center text-sm text-muted">No personal collections created yet.</div>
            )}
          </div>
        )}

        {/* Bookmarks */}
        {activeTab === "bookmarks" && (
          <div className="mt-6 space-y-2">
            {getBookmarks().map((b) => (
              <div key={b.id} className="card flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-ink">{b.label}</p>
                  <p className="text-xs text-muted">{b.type} · Saved {formatDateTime(b.createdAt)}</p>
                </div>
                <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-muted">{b.type}</span>
              </div>
            ))}
            {getBookmarks().length === 0 && (
              <div className="py-12 text-center text-sm text-muted">No bookmarks saved yet.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
