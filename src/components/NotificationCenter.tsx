import { useEffect, useRef, useState } from "react";
import { Bell, X, Package, Heart, Gift, Tag, Megaphone, Sparkles, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useEscapeKey, useLocalStorage } from "../lib/hooks";
import { formatDateTime } from "../lib/utils";

export interface Notification {
  id: string;
  type: "order" | "wishlist" | "promo" | "sale" | "content" | "system" | "reward";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  ts: number;
}

const ICON_MAP = {
  order: Package,
  wishlist: Heart,
  promo: Gift,
  sale: Tag,
  content: Megaphone,
  system: Sparkles,
  reward: Sparkles,
};

const KEY = "alaya_notifications_v1";

function seedNotifications(): Notification[] {
  const now = Date.now();
  return [
    { id: "n1", type: "order", title: "Order confirmed", message: "Your order AL-481488 has been placed and is being processed.", link: "/track-order", read: false, ts: now - 120000 },
    { id: "n2", type: "sale", title: "Flash sale — 40% off", message: "Selected jewellery pieces are now up to 40% off. Ends in 6 hours.", link: "/collections/flash", read: false, ts: now - 3600000 * 3 },
    { id: "n3", type: "reward", title: "You earned 120 points", message: "Loyalty points from your last purchase have been added to your account.", link: "/account", read: false, ts: now - 86400000 },
    { id: "n4", type: "content", title: "New Journal story", message: "The Capsule Wardrobe Guide — our editors' most requested piece. Now live.", link: "/journal/capsule-wardrobe-guide", read: false, ts: now - 86400000 * 2 },
    { id: "n5", type: "wishlist", title: "Back in stock", message: "The Amber Noir Candle you saved is back in stock. Grab it before it sells out again.", link: "/product/amber-noir-candle", read: true, ts: now - 86400000 * 4 },
    { id: "n6", type: "promo", title: "Your WELCOME10 code", message: "Use WELCOME10 for 10% off your first order. Valid for 30 days.", link: "/shop", read: true, ts: now - 86400000 * 7 },
  ];
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(KEY, seedNotifications());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const sorted = [...notifications].sort((a, b) => b.ts - a.ts);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface2"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-danger px-1 text-[0.55rem] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 top-full z-50 mt-2 w-[90vw] max-w-md animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Bell className="h-4 w-4 text-accent" />
              Notifications
            </h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted" />
                <p className="mt-2 text-sm font-medium text-ink">All caught up</p>
                <p className="text-xs text-muted">No new notifications.</p>
              </div>
            ) : (
              sorted.map((n) => {
                const Icon = ICON_MAP[n.type];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative flex gap-3 border-b border-line px-4 py-3.5 transition-colors",
                      !n.read ? "bg-accent-soft/30" : "hover:bg-surface2/50"
                    )}
                    onClick={() => markRead(n.id)}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                        n.read ? "bg-surface2 text-muted" : "bg-accent-soft text-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm", n.read ? "text-ink" : "font-semibold text-ink")}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(n.id);
                          }}
                          aria-label="Dismiss"
                          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5 text-muted hover:text-ink" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[0.6rem] text-muted">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(n.ts)}
                        </span>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 text-[0.6rem] font-medium text-accent hover:underline"
                          >
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
