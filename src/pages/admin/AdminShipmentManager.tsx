import { useState, useEffect } from "react";
import { Search, Package, Truck, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { cn } from "@/utils/cn";

interface Shipment {
  id: string;
  number: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  carrier_name: string;
  service_code: string;
  tracking_number: string;
  tracking_url: string;
  status: string;
  weight_kg: number;
  shipping_cost: number;
  declared_value: number;
  estimated_delivery: string;
  delivered_at: string;
  label_url: string;
  address_city: string;
  address_country: string;
  created_at: string;
}

const API = "/api/v1/shipping";
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  exception: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function AdminShipmentManager() {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const url = status ? `${API}/shipments?status=${status}` : `${API}/shipments?active=true`;
      const data = await fetch(url).then(r => r.json());
      setShipments(Array.isArray(data) ? data : data?.data || []);
    } catch { toast.error("Failed to load shipments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const generateLabel = async (id: string) => {
    try {
      const result = await fetch(`${API}/shipments/${id}/label`, { method: "POST" }).then(r => r.json());
      if (result.success) {
        toast.success("Label generated: " + result.trackingNumber);
        load(statusFilter || undefined);
      } else {
        toast.error(result.error || "Label generation failed");
      }
    } catch { toast.error("Label generation failed"); }
  };

  const refreshTracking = async (id: string) => {
    try {
      await fetch(`${API}/shipments/${id}/refresh-tracking`, { method: "POST" }).then(r => r.json());
      toast.success("Tracking refreshed");
      load(statusFilter || undefined);
    } catch { toast.error("Refresh failed"); }
  };

  const filtered = shipments.filter(s =>
    (statusFilter ? s.status === statusFilter : true) &&
    (search ? s.number?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.tracking_number?.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const statuses = ["pending", "processing", "in_transit", "out_for_delivery", "delivered", "exception"];

  return (
    <>
      <Seo title="Shipment Manager" path="/admin/shipping/shipments" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Shipment Manager</h1>
            <p className="mt-1 text-sm text-muted">Manage all shipments, generate labels, and track deliveries.</p>
          </div>
          <button onClick={() => load(statusFilter || undefined)} className="btn-ghost btn-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input-field w-full pl-9" placeholder="Search shipments..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-auto" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value || undefined); }}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <span className="text-xs text-muted">{filtered.length} shipment{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Shipments */}
        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-surface2" />)
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center"><p className="text-muted">No shipments found</p></div>
          ) : filtered.map(s => (
            <div key={s.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 p-4">
                <button onClick={() => setExpanded(p => ({ ...p, [s.id]: !p[s.id] }))} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface2">
                  {expanded[s.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{s.number}</span>
                    {s.order_number && <span className="text-xs text-muted">Order: {s.order_number}</span>}
                  </div>
                  <p className="text-xs text-muted">{s.customer_name} · {s.address_city}, {s.address_country}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  {s.carrier_name && <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {s.carrier_name}</span>}
                  {s.weight_kg && <span>{s.weight_kg} kg</span>}
                  {s.shipping_cost != null && <span>${s.shipping_cost.toFixed(2)}</span>}
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_COLORS[s.status] || "bg-gray-100 text-gray-800")}>
                  {s.status.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => generateLabel(s.id)} className="btn-ghost btn-sm"><Package className="h-3.5 w-3.5" /> Label</button>
                  <button onClick={() => refreshTracking(s.id)} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {expanded[s.id] && (
                <div className="border-t border-line bg-surface2/40 p-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted">Tracking</p>
                      {s.tracking_number ? (
                        <div className="mt-1">
                          <p className="text-sm font-mono text-ink">{s.tracking_number}</p>
                          {s.tracking_url && (
                            <a href={s.tracking_url} target="_blank" rel="noopener" className="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                              Track <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-muted">Not shipped yet</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted">Delivery</p>
                      <p className="mt-1 text-sm text-ink">
                        {s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : "N/A"}
                        {s.delivered_at && <span className="ml-2 text-green-600">Delivered: {new Date(s.delivered_at).toLocaleDateString()}</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted">Value</p>
                      <p className="mt-1 text-sm text-ink">
                        ${s.declared_value?.toFixed(2) || "0.00"} {s.label_url && <a href={s.label_url} target="_blank" rel="noopener" className="ml-2 text-xs text-accent">View Label</a>}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
