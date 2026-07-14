import { useEffect, useState } from "react";
import { X, Cookie, ShieldCheck, Settings2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const STORAGE_KEY = "alaya_cookie_consent_v2";
const DEFAULT_PREFS: CookiePrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
};

function loadPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePrefs;
  } catch {
    return null;
  }
}

function savePrefs(prefs: CookiePrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function CookieConsent() {
  const [prefs, setPrefs] = useState<CookiePrefs | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = loadPrefs();
    if (saved) {
      setPrefs(saved);
    } else {
      // Delay showing the banner slightly so it doesn't flash on load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (prefs || dismissed) return null;

  const acceptAll = () => {
    const all: CookiePrefs = { necessary: true, analytics: true, marketing: true, functional: true };
    setPrefs(all);
    savePrefs(all);
  };

  const acceptNecessary = () => {
    setPrefs(DEFAULT_PREFS);
    savePrefs(DEFAULT_PREFS);
  };

  const saveCustom = () => {
    if (prefs) {
      savePrefs(prefs as CookiePrefs);
      setPrefs({ ...(prefs as CookiePrefs) });
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
    >
      <div className="container-edge pb-4">
        <div className="card overflow-hidden border-2 border-accent/20 shadow-[var(--shadow-float)] animate-scale-in">
          <div className="flex items-start justify-between gap-4 bg-luxe px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Cookie className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Your privacy matters</h3>
                <p className="mt-1 max-w-prose text-sm text-muted">
                  We use cookies to enhance your browsing experience, serve personalised content and analyse our traffic.
                  Choose what you share — or accept all for the full experience.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface2 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preference details */}
          <div className={cn("overflow-hidden transition-all duration-300", showDetails ? "max-h-96" : "max-h-0")}>
            <div className="divide-y divide-line border-t border-line px-5 py-3 sm:px-6">
              {[
                { id: "necessary" as const, label: "Necessary", desc: "Essential for the site to function. Always active.", locked: true },
                { id: "functional" as const, label: "Functional", desc: "Remember your preferences and settings." },
                { id: "analytics" as const, label: "Analytics", desc: "Help us improve with anonymous usage data." },
                { id: "marketing" as const, label: "Marketing", desc: "Personalised ads and promotional content." },
              ].map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{c.label}</p>
                    <p className="text-xs text-muted">{c.desc}</p>
                  </div>
                  <span
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      (prefs?.[c.id] ?? c.locked) ? "bg-accent" : "bg-line"
                    )}
                    onClick={() => {
                      if (c.locked) return;
                      setPrefs((p) => (p ? { ...p, [c.id]: !p[c.id] } : DEFAULT_PREFS));
                    }}
                    role="switch"
                    aria-checked={prefs?.[c.id] ?? c.locked}
                    aria-label={`${c.label} cookies`}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                        (prefs?.[c.id] ?? c.locked) ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface2/30 px-5 py-3 sm:px-6">
            <button
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {showDetails ? "Hide preferences" : "Customise"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", showDetails && "rotate-180")} />
            </button>
            <div className="flex flex-wrap gap-2">
              <button onClick={acceptNecessary} className="btn-ghost btn-sm text-xs">
                Only necessary
              </button>
              {showDetails && (
                <button onClick={saveCustom} className="btn-outline btn-sm text-xs">
                  <Check className="h-3.5 w-3.5" /> Save preferences
                </button>
              )}
              <button onClick={acceptAll} className="btn-primary btn-sm text-xs">
                Accept all
              </button>
            </div>
          </div>

          <p className="border-t border-line px-5 py-2 text-[0.6rem] text-muted sm:px-6">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            Your data is never sold. Read our{" "}
            <a href="https://alayainsider.com/#/legal/privacy" className="underline hover:text-accent">
              Privacy policy
            </a>{" "}
            and{" "}
            <a href="https://alayainsider.com/#/legal/terms" className="underline hover:text-accent">
              Terms
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
