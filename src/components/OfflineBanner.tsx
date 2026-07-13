import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/utils/cn";

/** Detects connectivity loss and surfaces a non-blocking banner (graceful failure / offline detection). */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-[300] flex items-center justify-center bg-ink px-4 py-2 text-center text-xs font-medium text-canvas transition-transform duration-300",
        offline ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <WifiOff className="mr-2 h-4 w-4" />
      You're offline. Some features may be unavailable until you reconnect.
    </div>
  );
}
