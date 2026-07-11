import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { SearchModal } from "./SearchModal";
import { CompareBar } from "./CompareBar";
import { OfflineBanner } from "./OfflineBanner";
import { AnnouncementBar } from "./AnnouncementBar";
import { PopupEngine } from "./PopupEngine";
import { LiveSalesToast } from "./LiveSalesToast";
import { CookieConsent } from "./CookieConsent";
import { AIAssistant } from "./AIAssistant";
import { MobileNav } from "./mobile/MobileNav";
import { InstallPrompt } from "./mobile/InstallPrompt";
import { OfflineQueueStatus } from "./mobile/OfflineQueueStatus";
import { cn } from "@/utils/cn";

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full glass text-ink shadow-[var(--shadow-soft)] transition-all duration-300 hover:text-accent",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setSearchOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CompareBar />
      <OfflineBanner />
      <PopupEngine />
      <LiveSalesToast />
      <CookieConsent />
      <AIAssistant />
      <MobileNav />
      <InstallPrompt />
      <OfflineQueueStatus />
      <BackToTop />
    </div>
  );
}
