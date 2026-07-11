import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { isInstalled, listenInstall, showInstallPrompt, type InstallPromptResult } from "@/lib/mobilePlatform";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    const dismissedAt = localStorage.getItem("alaya_install_dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }
    // Delay showing the prompt
    const timer = setTimeout(() => {
      setShow(true);
    }, 30000); // 30 seconds after page load

    const unsub = listenInstall((result: InstallPromptResult) => {
      if (result.outcome === "accepted") {
        setShow(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const handleInstall = async () => {
    const result = await showInstallPrompt();
    if (result.outcome === "accepted") {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    try {
      localStorage.setItem("alaya_install_dismissed", String(Date.now()));
    } catch { /* ignore */ }
  };

  if (!show || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-float)] animate-slide-up md:bottom-6 md:left-auto md:right-6 md:w-80"
      )}
      role="dialog"
      aria-label="Install app"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
            <Download className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Install ALAYA</p>
            <p className="text-xs text-muted">Add to your home screen for the best experience</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-muted hover:text-ink"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={handleDismiss} className="btn-outline btn-sm flex-1">
          Not now
        </button>
        <button onClick={handleInstall} className="btn-primary btn-sm flex-1">
          Install
        </button>
      </div>
    </div>
  );
}
