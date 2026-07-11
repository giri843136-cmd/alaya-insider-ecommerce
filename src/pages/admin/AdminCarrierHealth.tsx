import { useState, useEffect } from "react";
import { Activity, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Seo } from "../../components/Seo";
import { useToast } from "../../context/ToastContext";
import { cn } from "@/utils/cn";

interface Carrier {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface HealthRecord {
  id: string;
  carrier_id: string;
  carrier_code: string;
  healthy: boolean;
  status: string;
  latency_ms: number;
  error_rate: number;
  last_success_at: string;
  last_failure_at: string;
  consecutive_failures: number;
  checked_at: string;
}

const API = "/api/v1/shipping";

export default function AdminCarrierHealth() {
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [healthMap, setHealthMap] = useState<Record<string, HealthRecord>>({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API}/carriers/active`).then(r => r.json());
      const list = Array.isArray(data) ? data : data?.data || [];
      setCarriers(list);

      // Load health for each carrier
      const health: Record<string, HealthRecord> = {};
      await Promise.all(list.map(async (c: Carrier) => {
        try {
          const h = await fetch(`${API}/carriers/${c.id}/health`).then(r => r.json());
          if (h && h.id) health[c.id] = h;
        } catch {}
      }));
      setHealthMap(health);
    } catch { toast.error("Failed to load carriers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const runHealthCheck = async (id: string) => {
    setChecking(p => ({ ...p, [id]: true }));
    try {
      const result = await fetch(`${API}/carriers/${id}/health-check`, { method: "POST" }).then(r => r.json());
      setHealthMap(p => ({ ...p, [id]: result }));
      toast.success(`${carriers.find(c => c.id === id)?.name}: ${result.healthy ? "Healthy" : "Degraded"}`);
    } catch { toast.error("Health check failed"); }
    finally { setChecking(p => ({ ...p, [id]: false })); }
  };

  const runAllHealthChecks = async () => {
    toast.info("Running health checks for all carriers...");
    for (const c of carriers) {
      await runHealthCheck(c.id);
    }
    toast.success("All health checks completed");
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 100) return "text-green-600";
    if (ms < 300) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <>
      <Seo title="Carrier Health" path="/admin/shipping/health" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Carrier Health</h1>
            <p className="mt-1 text-sm text-muted">Monitor shipping carrier API health, latency, and uptime.</p>
          </div>
          <button onClick={runAllHealthChecks} className="btn-primary btn-sm"><RefreshCw className="h-4 w-4" /> Check All</button>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-surface2" />)
          ) : carriers.length === 0 ? (
            <div className="card p-12 text-center"><p className="text-muted">No active carriers found</p></div>
          ) : carriers.map(c => {
            const health = healthMap[c.id];
            return (
              <div key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", health?.healthy ? "bg-green-100" : health && !health.healthy ? "bg-red-100" : "bg-surface2")}>
                      {health?.healthy ? <CheckCircle className="h-6 w-6 text-green-600" /> :
                       health && !health.healthy ? <XCircle className="h-6 w-6 text-red-600" /> :
                       <Activity className="h-6 w-6 text-muted" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">{c.name}</h3>
                      <p className="text-xs text-muted font-mono uppercase">{c.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => runHealthCheck(c.id)} disabled={checking[c.id]} className="btn-ghost btn-sm">
                      <RefreshCw className={cn("h-3.5 w-3.5", checking[c.id] && "animate-spin")} />
                      {checking[c.id] ? "Checking..." : "Check"}
                    </button>
                  </div>
                </div>

                {health ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-surface2 p-3 text-center">
                      <p className="text-xs text-muted">Status</p>
                      <p className={cn("mt-1 text-sm font-medium capitalize", health.healthy ? "text-green-600" : "text-red-600")}>
                        {health.status || (health.healthy ? "Up" : "Down")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface2 p-3 text-center">
                      <p className="text-xs text-muted">Latency</p>
                      <p className={cn("mt-1 text-sm font-medium", getLatencyColor(health.latency_ms))}>
                        {health.latency_ms}ms
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface2 p-3 text-center">
                      <p className="text-xs text-muted">Consecutive Failures</p>
                      <p className={cn("mt-1 text-sm font-medium", health.consecutive_failures > 0 ? "text-red-600" : "text-green-600")}>
                        {health.consecutive_failures || 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface2 p-3 text-center">
                      <p className="text-xs text-muted">Last Checked</p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {health.checked_at ? new Date(health.checked_at).toLocaleTimeString() : "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-surface2 p-3 text-center text-sm text-muted">
                    No health data — run a health check
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
