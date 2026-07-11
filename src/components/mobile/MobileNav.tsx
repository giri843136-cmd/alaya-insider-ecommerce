import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Heart, User, Grid3X3, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { isInstalled } from "@/lib/mobilePlatform";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Shop", path: "/shop", icon: ShoppingBag },
  { label: "Wishlist", path: "/wishlist", icon: Heart },
  { label: "Account", path: "/account", icon: User },
];

export function MobileNav() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const standalone = isInstalled();

  const MORE_LINKS = [
    { label: "Brands", path: "/brands" },
    { label: "Collections", path: "/collections" },
    { label: "Journal", path: "/journal" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Track Order", path: "/track-order" },
    { label: "Recently Viewed", path: "/recently-viewed" },
    { label: "Compare", path: "/compare" },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface/95 backdrop-blur-xl md:hidden safe-area-bottom",
          standalone && "pb-safe-bottom"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[0.6rem] font-medium transition-colors duration-200",
                  isActive
                    ? "text-accent"
                    : "text-muted hover:text-ink"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", isActive && "fill-accent/10")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[0.6rem] font-medium text-muted transition-colors hover:text-ink"
            aria-label={moreOpen ? "Close menu" : "Open menu"}
            aria-expanded={moreOpen}
          >
            {moreOpen ? <X className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className={cn(
            "absolute bottom-[var(--mobile-nav-height,64px)] left-0 right-0 mx-auto max-w-sm rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-float)] animate-slide-up",
          )}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Explore</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-full p-1 text-muted hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {MORE_LINKS.map((link) => {
                const isActive = pathname === link.path || pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-ink hover:bg-surface2"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
