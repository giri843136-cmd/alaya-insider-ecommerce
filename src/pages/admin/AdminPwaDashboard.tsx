import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Smartphone,
  RefreshCw,
  BarChart3,
  Clock,
  Activity,
  Globe,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui";
import {
  getSwStatus,
  isInstalled,
  getPerformanceReport,
  getPerformanceHistory,
  listenSw,
  type SwStatus,
  type PerformanceReport,
} from "@/lib/mobilePlatform";

const SW_STATUS_MAP: Record<SwStatus, { label: string; variant: "success" | "warning" | "info" }> = {
  unregistered: { label: "Unregistered", variant: "warning" },
  registering: { label: "Registering…", variant: "info" },
  active: { label: "Active", variant: "success" },
  error: { label: "Error", variant: "warning" },
};

function VitalCard({
  label,
  report,
  icon: Icon,
}: {
  label: string;
  report: PerformanceReport["lcp"];
  icon: typeof Activity;
}) {
  if (!report) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        </div>
        <p className="text-sm text-muted">Waiting for data…</p>
      </div>
    );
  }

  const ratingColors: Record<string, string> = {
    good: "text-success border-success/30 bg-success/5",
    "needs-improvement": "text-warning border-warning/30 bg-warning/5",
    poor: "text-danger border-danger/30 bg-danger/5",
  };

  return (
    <div className={cn("rounded-xl border p-4", ratingColors[report.rating])}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <Badge variant={report.rating === "good" ? "success" : report.rating === "needs-improvement" ? "warning" : "warning"} className="ml-auto">
          {report.rating}
        </Badge>
      </div>
      <p className="text-2xl font-bold">{Math.round(report.value)}ms</p>
    </div>
  );
}

function InstallChart({ installs }: { installs: { date: string; count: number }[] }) {
  const max = Math.max(...installs.map((i) => i.count), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {installs.slice(-14).map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-accent transition-all duration-300 hover:bg-accent/80"
            style={{ height: `${(day.count / max) * 100}%`, minHeight: day.count > 0 ? 4 : 0 }}
            title={`${day.date}: ${day.count} installs`}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminPwaDashboard() {
  const [swStatus, setSwStatus] = useState<SwStatus>(getSwStatus());
  const [installed, setInstalled] = useState(false);
  const [perfReport, setPerfReport] = useState<PerformanceReport | null>(null);
  const [perfHistory, setPerfHistory] = useState<PerformanceReport[]>([]);

  useEffect(() => {
    setInstalled(isInstalled());
    setPerfReport(getPerformanceReport());
    setPerfHistory(getPerformanceHistory());

    const unsub = listenSw(setSwStatus);
    const interval = setInterval(() => {
      setPerfReport(getPerformanceReport());
      setPerfHistory(getPerformanceHistory());
    }, 5000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Simulated install stats
  const installStats = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      days.push({ date, count: Math.floor(Math.random() * 8) + (i === 0 ? 1 : 0) });
    }
    return days;
  }, []);

  const totalInstalls = installStats.reduce((a, b) => a + b.count, 0);

  const swInfo = SW_STATUS_MAP[swStatus];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-m text-ink">PWA Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Progressive Web App status, performance metrics, and installation analytics
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Service Worker</span>
          </div>
          <Badge variant={swInfo.variant}>{swInfo.label}</Badge>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Installed</span>
          </div>
          <Badge variant={installed ? "success" : "warning"}>
            {installed ? "Yes (Standalone)" : "Browser"}
          </Badge>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Download className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Installs</span>
          </div>
          <p className="text-2xl font-bold text-ink">{formatNumber(totalInstalls)}</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Cache</span>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Core Web Vitals</h2>
          <Badge variant="info">Live</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <VitalCard label="LCP" report={perfReport?.lcp ?? null} icon={Activity} />
          <VitalCard label="CLS" report={perfReport?.cls ?? null} icon={BarChart3} />
          <VitalCard label="INP" report={perfReport?.inp ?? null} icon={Activity} />
          <VitalCard label="FCP" report={perfReport?.fcp ?? null} icon={Clock} />
          <VitalCard label="TTFB" report={perfReport?.ttfb ?? null} icon={Globe} />
        </div>
      </div>

      {/* Install chart */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Installations (30 days)</h2>
        <InstallChart installs={installStats} />
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{installStats[0]?.date}</span>
          <span>{installStats[installStats.length - 1]?.date}</span>
        </div>
      </div>

      {/* Performance History */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Performance Snapshots</h2>
        {perfHistory.length === 0 ? (
          <p className="text-sm text-muted">No performance snapshots recorded yet. Data will appear as the page is used.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">LCP</th>
                  <th className="pb-2 pr-4">CLS</th>
                  <th className="pb-2 pr-4">INP</th>
                  <th className="pb-2 pr-4">FCP</th>
                  <th className="pb-2">TTFB</th>
                </tr>
              </thead>
              <tbody>
                {perfHistory.slice(-10).reverse().map((snap, i) => (
                  <tr key={i} className="border-b border-line/50 text-ink">
                    <td className="py-2 pr-4 text-xs text-muted">
                      {new Date(snap.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 pr-4">{snap.lcp ? `${Math.round(snap.lcp.value)}ms` : "—"}</td>
                    <td className="py-2 pr-4">{snap.cls ? snap.cls.value.toFixed(3) : "—"}</td>
                    <td className="py-2 pr-4">{snap.inp ? `${Math.round(snap.inp.value)}ms` : "—"}</td>
                    <td className="py-2 pr-4">{snap.fcp ? `${Math.round(snap.fcp.value)}ms` : "—"}</td>
                    <td className="py-2">{snap.ttfb ? `${Math.round(snap.ttfb.value)}ms` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manifest details */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Manifest Configuration</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Name", value: "ALAYA INSIDER" },
            { label: "Short Name", value: "ALAYA" },
            { label: "Display", value: "Standalone" },
            { label: "Orientation", value: "Any" },
            { label: "Theme Color", value: "#f7f4ef" },
            { label: "Background", value: "#f7f4ef" },
            { label: "Icons", value: "4 variants" },
            { label: "Shortcuts", value: "4 shortcuts" },
            { label: "Categories", value: "4 categories" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-surface2 px-3 py-2">
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
