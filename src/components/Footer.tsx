import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sun, Moon } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AffiliateDisclosure } from "./AffiliateDisclosure";
import { CURRENCIES, isEmail } from "../lib/utils";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "In",
  pinterest: "Pn",
  tiktok: "Tk",
  youtube: "Yt",
  x: "X",
};

export function Footer() {
  const { settings, categories, setCurrency } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setDone(true);
    toast.success("Welcome to the Insider list", "Check your inbox for 10% off.");
    setEmail("");
  };

  return (
    <footer className="mt-24 border-t border-line bg-surface2/40">
      {/* Newsletter */}
      <div className="container-edge grid gap-10 border-b border-line py-14 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="eyebrow mb-3">The Insider List</span>
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
            First access. Private sales. Editorial drops.
          </h2>
          <p className="mt-3 max-w-md text-muted">
            Join {settings.storeName} for early access to collections and 10% off your first order.
          </p>
        </div>
        <div className="lg:justify-self-end lg:w-full lg:max-w-md">
          {done ? (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">You're on the list.</p>
                <p className="text-sm text-muted">Your welcome offer is on its way.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubscribe} noValidate className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="news-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="news-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-invalid={!!error}
                  className="input-field"
                />
                {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
              </div>
              <button type="submit" className="btn-primary btn-md shrink-0">
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-muted">By subscribing you agree to our privacy policy. Unsubscribe anytime.</p>
        </div>
      </div>

      {/* Links */}
      <div className="container-edge grid grid-cols-2 gap-8 py-14 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Link to="/" className="font-display text-xl font-semibold tracking-[0.28em] text-ink">
            {settings.storeShort}
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">{settings.description}</p>
          <div className="mt-5 flex gap-2">
            {Object.entries(settings.social)
              .filter(([, url]) => url)
              .map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-xs font-semibold uppercase text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {SOCIAL_LABELS[key] ?? key[0]}
                </a>
              ))}
          </div>
        </div>

        <FooterCol title="Shop">
          {categories.slice(0, 5).map((c) => (
            <FooterLink key={c.id} to={`/shop?category=${c.id}`}>{c.name}</FooterLink>
          ))}
          <FooterLink to="/collections/new">New arrivals</FooterLink>
        </FooterCol>

        <FooterCol title="Collections">
          <FooterLink to="/collections/bestsellers">Best sellers</FooterLink>
          <FooterLink to="/collections/deals">The sale edit</FooterLink>
          <FooterLink to="/collections/flash">Flash deals</FooterLink>
          <FooterLink to="/collections/gift">Gift guide</FooterLink>
          <FooterLink to="/collections/luxury">Luxury collection</FooterLink>
          <FooterLink to="/brands">All brands</FooterLink>
        </FooterCol>

        <FooterCol title="Account & support">
          <FooterLink to="/account">My account</FooterLink>
          <FooterLink to="/track-order">Track order</FooterLink>
          <FooterLink to="/wishlist">Wishlist</FooterLink>
          <FooterLink to="/compare">Compare</FooterLink>
          <FooterLink to="/contact">Contact us</FooterLink>
          <FooterLink to="/faq">Help & FAQ</FooterLink>
        </FooterCol>

        <FooterCol title="Editorial">
          <FooterLink to="/legal/editorial-policy">Editorial Policy</FooterLink>
          <FooterLink to="/legal/review-methodology">Review Methodology</FooterLink>
          <FooterLink to="/legal/how-we-test">How We Test</FooterLink>
          <FooterLink to="/legal/how-we-make-money">How We Make Money</FooterLink>
          <FooterLink to="/legal/corrections">Corrections Policy</FooterLink>
          <FooterLink to="/about">About Us</FooterLink>
        </FooterCol>

        <FooterCol title="Policies">
          <FooterLink to="/legal/affiliate">Affiliate Disclosure</FooterLink>
          <FooterLink to="/legal/privacy">Privacy Policy</FooterLink>
          <FooterLink to="/legal/terms">Terms of Service</FooterLink>
          <FooterLink to="/legal/refund">Returns Policy</FooterLink>
          <FooterLink to="/legal/accessibility">Accessibility</FooterLink>
          <FooterLink to="/legal/cookie">Cookie Policy</FooterLink>
        </FooterCol>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="container-edge flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {settings.storeName}. Crafted with care.
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted">
              <span>Currency</span>
              <select
                value={settings.currency.code}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Display currency"
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink transition-all duration-200 focus:border-accent focus:outline-none"
              >
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>
                    {c} {CURRENCIES[c].symbol}
                  </option>
                ))}
              </select>
            </label>
            {settings.features.multiLanguage && <LanguageSwitcher />}
            {settings.features.darkMode && (
              <button onClick={toggleTheme} className="btn-ghost btn-sm" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            )}
            <Link to="/account" className="btn-ghost btn-sm">Account</Link>
            <Link to="/admin" className="btn-ghost btn-sm">Admin</Link>
          </div>
          {/* Payment & trust */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            {["VISA", "MC", "AMEX", "PAYPAL", "APAY", "GPAY"].map((p) => (
              <span key={p} className="rounded-md border border-line bg-surface px-2.5 py-1 text-[0.6rem] font-bold tracking-wider text-muted">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Affiliate disclosure bar */}
      <div className="border-t border-line bg-surface2/60">
        <div className="container-edge py-4">
          <AffiliateDisclosure compact />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-muted transition-colors hover:text-accent">
        {children}
      </Link>
    </li>
  );
}
