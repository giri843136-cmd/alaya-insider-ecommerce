import { useCallback, useEffect, useState } from "react";
import { X, Gift, Bell, Sparkles } from "lucide-react";
import { useEscapeKey, useLockBody } from "../lib/hooks";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { isEmail } from "../lib/utils";
import { cn } from "@/utils/cn";
import type { Popup } from "../lib/types";

const ICONS = { coupon: Gift, newsletter: Bell, promo: Sparkles, announcement: Bell };
const SESSION_KEY = "alaya_popup_seen";

/**
 * Marketing popup engine. Evaluates active popups and fires the first matching
 * trigger (exit-intent, scroll, time-delay, welcome). Dismissal is remembered
 * per-session so it never annoys a visitor.
 */
export function PopupEngine() {
  const { popups, trackPopup } = useStore();
  const { toast } = useToast();
  const [active, setActive] = useState<Popup | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const seenRaw = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;

  const eligible = popups.find((p) => p.active && !seenRaw?.includes(p.id));

  // Welcome popup fires quickly
  useEffect(() => {
    if (!eligible || eligible.trigger !== "welcome" || active) return;
    const t = setTimeout(() => setActive(eligible), 4000);
    return () => clearTimeout(t);
  }, [eligible, active]);

  // Time-delay popup
  useEffect(() => {
    if (!eligible || eligible.trigger !== "time" || active) return;
    const t = setTimeout(() => setActive(eligible), (eligible.triggerValue ?? 15) * 1000);
    return () => clearTimeout(t);
  }, [eligible, active]);

  // Scroll-trigger popup
  useEffect(() => {
    if (!eligible || eligible.trigger !== "scroll" || active) return;
    const pct = eligible.triggerValue ?? 60;
    const onScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= pct) setActive(eligible);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [eligible, active]);

  // Exit-intent popup
  useEffect(() => {
    if (!eligible || eligible.trigger !== "exit_intent" || active) return;
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) setActive(eligible);
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [eligible, active]);

  // Track view once shown
  useEffect(() => {
    if (active) trackPopup(active.id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const dismiss = useCallback(() => {
    const seen = seenRaw ? JSON.parse(seenRaw) : [];
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen, active?.id]));
    setActive(null);
  }, [active?.id, seenRaw]);

  useEscapeKey(dismiss, !!active);
  useLockBody(!!active);

  if (!active) return null;
  const Icon = ICONS[active.type];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active.type === "newsletter" || active.type === "coupon") {
      if (!isEmail(email)) {
        setError("Please enter a valid email.");
        return;
      }
    }
    trackPopup(active.id, true);
    if (active.couponCode) {
      toast.success("Here's your code!", `Use ${active.couponCode} at checkout.`);
    } else {
      toast.success("You're on the list!", "Check your inbox.");
    }
    dismiss();
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={active.headline}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={dismiss} aria-hidden="true" />
      <div className="card relative z-10 w-full max-w-md overflow-hidden animate-scale-in">
        <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full glass text-ink hover:text-danger"><X className="h-5 w-5" /></button>
        <div className={cn("flex flex-col items-center gap-4 bg-luxe px-6 pb-6 pt-10 text-center")}>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink animate-floaty"><Icon className="h-7 w-7" /></span>
          <h2 className="text-display-m text-balance text-ink">{active.headline}</h2>
          <p className="max-w-xs text-pretty text-muted">{active.body}</p>
          <form onSubmit={submit} className="mt-2 w-full max-w-xs">
            {(active.type === "newsletter" || active.type === "coupon") && (
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Your email address"
                  className="input-field text-center"
                />
                {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
              </div>
            )}
            <button type="submit" className="btn-primary btn-md mt-3 w-full">{active.ctaLabel}</button>
          </form>
          <button onClick={dismiss} className="text-xs text-muted hover:text-ink">No thanks</button>
        </div>
      </div>
    </div>
  );
}
