import { useState } from "react";
import { Search, Truck, MapPin, Clock, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { cn } from "@/utils/cn";

interface TrackingEvent {
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

interface TrackingResult {
  trackingNumber: string;
  carrierCode: string;
  status: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
  delivered?: boolean;
  deliveredAt?: string;
}

const API = "/api/v1/shipping";
const EVENT_ICONS: Record<string, string> = {
  picked_up: "📦",
  in_transit: "🚚",
  out_for_delivery: "🚛",
  delivered: "✅",
  exception: "⚠️",
};

export default function AdminTrackingCenter() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("alaya_recent_tracking") || "[]"); } catch { return []; }
  });

  const track = async (tn?: string) => {
    const num = tn || trackingNumber;
    if (!num?.trim()) return;
    setLoading(true);
    try {
      const data = await fetch(`${API}/tracking/${num.trim()}`).then(r => r.json());
      setResult(data);
      const updated = [num.trim(), ...recentSearches.filter(s => s !== num.trim())].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("alaya_recent_tracking", JSON.stringify(updated));
    } catch { toast.error("Tracking lookup failed"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Seo title="Tracking Center" path="/admin/shipping/tracking" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Tracking Center</h1>
            <p className="mt-1 text-sm text-muted">Track shipments across all carriers in real-time.</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input-field w-full pl-9 pr-4"
              placeholder="Enter tracking number..."
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              onKeyDown={e => e.key === "Enter" && track()}
            />
          </div>
          <button onClick={() => track()} disabled={loading} className="btn-primary btn-md"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Track</button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !result && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Recent Searches</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recentSearches.map(tn => (
                <button key={tn} onClick={() => { setTrackingNumber(tn); track(tn); }} className="rounded-lg border border-line px-3 py-1.5 text-xs font-mono text-ink hover:bg-surface2">
                  {tn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tracking Result */}
        {loading && (
          <div className="mt-6 card p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-3 text-sm text-muted">Looking up tracking...</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-6">
            {/* Header */}
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Tracking Number</p>
                  <p className="font-mono text-lg font-semibold text-ink">{result.trackingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Carrier</p>
                  <p className="text-lg font-semibold text-ink uppercase">{result.carrierCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Status</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                    result.delivered ? "bg-green-100 text-green-800" :
                    result.status === "exception" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  )}>
                    {result.delivered ? <CheckCircle className="h-4 w-4" /> : result.status === "exception" ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    {result.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
              </div>
              {result.estimatedDelivery && (
                <p className="mt-3 text-sm text-muted">
                  Estimated Delivery: <span className="font-medium text-ink">{new Date(result.estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-4 card p-5">
              <h2 className="font-semibold text-ink flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Tracking Timeline</h2>
              <div className="mt-6 relative">
                {result.events.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">No tracking events available yet</p>
                ) : (
                  <div className="space-y-0">
                    {result.events.map((event, i) => (
                      <div key={i} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Timeline line */}
                        {i < result.events.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-line" />
                        )}
                        {/* Dot */}
                        <div className={cn(
                          "relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm",
                          event.status === "delivered" ? "bg-green-100" :
                          event.status === "exception" ? "bg-red-100" :
                          "bg-accent-soft"
                        )}>
                          {EVENT_ICONS[event.status] || "📦"}
                        </div>
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink capitalize">{event.status.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted">{event.description}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {result.delivered && result.deliveredAt && (
              <div className="mt-4 card border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Delivered</p>
                    <p className="text-sm text-green-700">{new Date(result.deliveredAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="mt-12 text-center">
            <Truck className="mx-auto h-12 w-12 text-muted/40" />
            <p className="mt-3 text-sm text-muted">Enter a tracking number to track a shipment</p>
          </div>
        )}
      </div>
    </>
  );
}
