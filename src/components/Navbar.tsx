import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  User,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationCenter } from "./NotificationCenter";
import { useCommerce } from "../context/CommerceContext";
import { useTheme } from "../context/ThemeContext";
import { useStore } from "../context/StoreContext";
import { buildPrimaryNav, buildGuideNav, buildTrendingTopics } from "../lib/navigationPlatform";
import { cn } from "@/utils/cn";
import { flags } from "../lib/featureFlags";

const ICON_BTN =
  "relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";
const DOT =
  "absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-accent-ink animate-badge-pop";

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { cartCount, wishlist, openCart } = useCommerce();
  const { theme, toggleTheme } = useTheme();
  const { settings, categories, brands, articles, products } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaTab, setMegaTab] = useState<string>("categories");

  const navGroups = useMemo(() => buildPrimaryNav(categories, brands, articles), [categories, brands, articles]);
  const guideItems = useMemo(() => buildGuideNav(), []);
  const trendingTopics = useMemo(() => buildTrendingTopics(products), [products]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setMobileOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [mobileOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "link-line text-sm font-medium tracking-wide transition-colors",
      isActive ? "text-ink" : "text-muted hover:text-ink"
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] transition-all duration-300",
        scrolled ? "glass border-b border-line" : "bg-transparent"
      )}
    >
      <nav
        className="container-edge flex h-16 items-center justify-between gap-4 lg:h-20"
        aria-label="Primary navigation"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="ml-1 flex flex-col leading-none" aria-label={`${settings.storeName} home`}>
            <span className="font-display text-lg font-semibold tracking-[0.28em] text-ink lg:text-xl">
              {settings.storeShort}
            </span>
            <span className="hidden text-[0.55rem] uppercase tracking-[0.45em] text-muted sm:block">
              Insider
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-9 lg:flex">
          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>
          <NavLink to="/collections/new" className={linkClass}>
            New
          </NavLink>
          <NavLink to="/collections/deals" className={linkClass}>
            Sale
          </NavLink>
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium tracking-wide text-muted transition-colors hover:text-ink"
            >
              Discover
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-10 w-[56rem] -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="card overflow-hidden p-0 animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
                {/* Mega menu tabs */}
                <div className="flex border-b border-line">
                  {navGroups.map((g) => (
                    <button
                      key={g.id}
                      onMouseEnter={() => setMegaTab(g.id)}
                      className={cn(
                        "flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                        megaTab === g.id ? "text-accent border-b-2 border-accent" : "text-muted hover:text-ink hover:bg-surface2"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  {navGroups.map((g) => (
                    <div
                      key={g.id}
                      className={cn(
                        "grid gap-3 transition-opacity duration-200",
                        megaTab === g.id ? "block opacity-100" : "hidden opacity-0"
                      )}
                      style={{
                        gridTemplateColumns: g.columns ? `repeat(${g.columns}, 1fr)` : "repeat(3, 1fr)",
                      }}
                    >
                      {g.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.href}
                          className={cn(
                            "group/item flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-surface2 hover:translate-x-0.5",
                            item.image && "flex-row"
                          )}
                        >
                          {item.image && (
                            <img src={item.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          )}
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                              {item.label}
                              {item.badge && (
                                <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-accent">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                            {item.description && (
                              <span className="block truncate text-xs text-muted">{item.description}</span>
                            )}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
                {/* Trending topics row */}
                {trendingTopics.length > 0 && (
                  <div className="border-t border-line bg-surface2/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted shrink-0">Trending</span>
                      <div className="flex flex-wrap gap-1.5">
                        {trendingTopics.slice(0, 6).map((topic) => (
                          <Link
                            key={topic.id}
                            to={topic.href}
                            className="rounded-full bg-surface2 px-2.5 py-1 text-xs text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                          >
                            {topic.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {settings.features.brands && (
            <NavLink to="/brands" className={linkClass}>
              Brands
            </NavLink>
          )}
          {guideItems.length > 0 && (
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium tracking-wide text-muted transition-colors hover:text-ink"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Guides
                <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-10 -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="card w-64 space-y-1 p-2 animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
                  {guideItems.map((g) => (
                    <Link
                      key={g.id}
                      to={g.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-surface2"
                    >
                      <BookOpen className="h-4 w-4 text-muted" />
                      <span className="min-w-0">
                        <span className="block font-medium">{g.label}</span>
                        {g.description && <span className="block text-xs text-muted">{g.description}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          {settings.features.journal && (
            <NavLink to="/journal" className={linkClass}>
              Journal
            </NavLink>
          )}
          <NavLink to="/about" className={linkClass}>
            The Edit
          </NavLink>
          <NavLink to="/faq" className={linkClass}>
            Help
          </NavLink>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button type="button" className={ICON_BTN} onClick={onOpenSearch} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          {settings.features.multiLanguage && <LanguageSwitcher compact />}
          <NotificationCenter />
          {settings.features.accounts && (
            <Link to="/account" className={ICON_BTN} aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
          )}
          {settings.features.darkMode && (
            <button
              type="button"
              className={ICON_BTN}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
          <Link to="/wishlist" className={ICON_BTN} aria-label={`Wishlist, ${wishlist.length} items`}>
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <span className={DOT}>{wishlist.length}</span>}
          </Link>
          {flags.ENABLE_ECOMMERCE && (
            <button type="button" className={ICON_BTN} onClick={openCart} aria-label={`Bag, ${cartCount} items`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <span className={DOT}>{cartCount}</span>}
            </button>
          )}
        </div>
      </nav>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} categories={categories} storeName={settings.storeName} theme={theme} toggleTheme={toggleTheme} darkEnabled={settings.features.darkMode} />}
    </header>
  );
}

function MobileMenu({
  onClose,
  categories,
  storeName,
  theme,
  toggleTheme,
  darkEnabled,
}: {
  onClose: () => void;
  categories: { id: string; name: string; tagline: string }[];
  storeName: string;
  theme: "light" | "dark";
  toggleTheme: () => void;
  darkEnabled: boolean;
}) {
  const items = [
    { to: "/shop", label: "Shop All" },
    { to: "/collections/new", label: "New Arrivals" },
    { to: "/collections/deals", label: "Sale" },
    { to: "/collections", label: "Collections" },
    { to: "/brands", label: "Brands" },
    { to: "/journal", label: "Journal" },
    { to: "/compare", label: "Compare" },
    { to: "/recently-viewed", label: "Recently Viewed" },
    { to: "/track-order", label: "Track Order" },
    { to: "/about", label: "The Edit" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/account", label: "Account" },
    { to: "/faq", label: "Help & FAQ" },
    { to: "/contact", label: "Contact" },
    { to: "/admin", label: "Admin" },
  ];
  return (
    <div className="fixed inset-0 z-[120] lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-canvas p-6 animate-drawer-left">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-[0.28em]">{storeName.split(" ")[0]}</span>
          <button type="button" className={ICON_BTN} onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col" aria-label="Mobile">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              onClick={onClose}
              className="border-b border-line py-3.5 text-lg font-medium text-ink transition-colors hover:text-accent"
            >
              {it.label}
            </Link>
          ))}
        </nav>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Collections</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              onClick={onClose}
              className="rounded-xl border border-line bg-surface p-3 text-sm font-medium text-ink transition-all hover:border-accent hover:text-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <Link to="/admin" onClick={onClose} className="btn btn-outline btn-sm">
            <LayoutDashboard className="h-4 w-4" /> Admin
          </Link>
          {darkEnabled && (
            <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


