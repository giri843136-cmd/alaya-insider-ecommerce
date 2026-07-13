import { useEffect, useMemo, useState } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Wifi,
  Activity,
  BarChart3,
  BatteryCharging,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { getDeviceInfo, getOfflineQueue, getMobileAnalytics, type DeviceInfo, type DeviceCategory } from "@/lib/mobilePlatform";

const CATEGORY_ICONS: Record<DeviceCategory, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  foldable: RotateCcw,
  large: Monitor,
  tv: Monitor,
  unknown: Smartphone,
};

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Smartphone;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center gap-3">
        <div className={cn("rounded-lg p-2", color || "bg-accent-soft")}>
          <Icon className={cn("h-4 w-4", color ? "text-white" : "text-accent")} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function AdminMobileExperience() {
  const [device, setDevice] = useState<DeviceInfo>(getDeviceInfo());
  const [_refresh, setRefresh] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDevice(getDeviceInfo());
      setRefresh((n) => n + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const queue = useMemo(() => getOfflineQueue(), [_refresh]);
  const analytics = useMemo(() => getMobileAnalytics(), [_refresh]);
  const pendingCount = queue.filter((e) => e.status === "pending").length;
  const failedCount = queue.filter((e) => e.status === "failed").length;

  const DeviceIcon = CATEGORY_ICONS[device.category];

  const CAPABILITIES = [
    { label: "Touch", active: device.touch },
    { label: "Voice", active: device.voiceSupported },
    { label: "WebGL", active: device.webgl },
    { label: "WebP", active: device.webp },
    { label: "Service Worker", active: device.serviceWorker },
    { label: "IndexedDB", active: device.indexedDb },
  ];

  const DETAILS = [
    { label: "Pixel Ratio", value: `${device.pixelRatio}x` },
    { label: "Orientation", value: device.orientation },
    { label: "Dark Mode", value: device.darkMode ? "Yes" : "No" },
    { label: "Reduced Motion", value: device.reducedMotion ? "Yes" : "No" },
    { label: "High Contrast", value: device.highContrast ? "Yes" : "No" },
    { label: "Battery", value: device.battery ? `${device.battery}%` : "N/A" },
    { label: "Memory", value: device.memory ? `${device.memory} GB` : "N/A" },
    { label: "Cores", value: String(device.cores || "N/A") },
  ];

  const CAPABILITIES_LIST = [
    { label: "Touch", active: device.touch },
    { label: "Voice Recognition", active: device.voiceSupported },
    { label: "Dark Mode", active: device.darkMode },
    { label: "Reduced Motion", active: device.reducedMotion },
    { label: "WebGL", active: device.webgl },
    { label: "WebP Images", active: device.webp },
    { label: "Service Worker", active: device.serviceWorker },
    { label: "IndexedDB", active: device.indexedDb },
  ];

  const statusBadge = (status: string): "success" | "warning" | "info" => {
    if (status === "completed") return "success";
    if (status === "pending") return "warning";
    return "info";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-m text-ink">Mobile Experience</h1>
        <p className="mt-1 text-sm text-muted">
          Device detection, offline queue management, and mobile platform insights
        </p>
      </div>

      {/* Device info */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-accent-soft p-3">
            <DeviceIcon className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink capitalize">{device.category}</p>
            <p className="text-xs text-muted">
              {device.screenW}×{device.screenH} · {device.pixelRatio}x · {device.orientation}
            </p>
          </div>
          <Badge variant={device.online ? "success" : "warning"} className="ml-auto">
            {device.online ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.label}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium",
                cap.active ? "bg-success/10 text-success" : "bg-surface2 text-muted"
              )}
            >
              {cap.label}: {cap.active ? "✓" : "✗"}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Wifi}
          label="Connection"
          value={device.connection === "none" ? "Offline" : device.connection}
          sub={device.online ? "Connected" : "Disconnected"}
          color={device.online ? "bg-success" : "bg-danger"}
        />
        <MetricCard
          icon={BatteryCharging}
          label="Memory"
          value={device.memory ? `${device.memory} GB` : "N/A"}
          sub={`${device.cores || "?"} cores`}
        />
        <MetricCard
          icon={Activity}
          label="Queue"
          value={String(pendingCount + failedCount)}
          sub={`${pendingCount} pending · ${failedCount} failed`}
          color={failedCount > 0 ? "bg-danger" : pendingCount > 0 ? "bg-warning" : "bg-success"}
        />
        <MetricCard
          icon={BarChart3}
          label="Events"
          value={formatNumber(analytics.length)}
          sub="tracked this session"
        />
      </div>

      {/* Device details */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Device Details</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DETAILS.map((item) => (
            <div key={item.label} className="rounded-lg bg-surface2 px-3 py-2">
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Offline Queue */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Offline Queue</h2>
        {queue.length === 0 ? (
          <p className="text-sm text-muted">No items in the offline queue.</p>
        ) : (
          <div className="space-y-1">
            {queue.slice(-10).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2">
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  entry.status === "completed" && "bg-success",
                  entry.status === "pending" && "bg-warning",
                  entry.status === "failed" && "bg-danger",
                  entry.status === "syncing" && "bg-info",
                )} />
                <span className="flex-1 text-sm text-ink truncate">{entry.action}</span>
                <span className="text-xs text-muted shrink-0">{entry.retries}/{entry.maxRetries}</span>
                <Badge variant={statusBadge(entry.status)}>
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Platform Capabilities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAPABILITIES_LIST.map((cap) => (
            <div
              key={cap.label}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                cap.active ? "bg-success/10 text-success" : "bg-surface2 text-muted"
              )}
            >
              {cap.active ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
              <span>{cap.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
