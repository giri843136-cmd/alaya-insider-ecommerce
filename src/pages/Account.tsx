import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  User, LogOut, Package, MapPin, Mail, Lock, UserPlus, LogIn, Heart,
  ArrowRight, Check, Receipt, ShieldCheck, BookOpen, Activity, Settings, Moon, Sun,
  Bell, Eye, Star, ShoppingBag, Download, Trash2, AlertTriangle,
} from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { Seo } from "../components/Seo";
import { Breadcrumbs, EmptyState, Money } from "../components/ui";
import { ArticleCard } from "../components/ArticleCard";
import { isEmail, formatDate, formatDateTime, formatCompact } from "../lib/utils";
import { cn } from "@/utils/cn";

import { STATUS_STYLES } from "../lib/orderStatus";

export default function Account() {
  const { customer, login, register, logout } = useAccount();
  const { orders } = useStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isEmail(form.email)) return setError("Enter a valid email.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "register") {
      if (form.name.trim().length < 2) return setError("Enter your name.");
      if (register(form.name.trim(), form.email.trim(), form.password)) {
        toast.success("Welcome to ALAYA", "Your account is ready.");
      } else {
        setError("An account with that email already exists.");
      }
    } else {
      if (login(form.email.trim(), form.password)) {
        toast.success("Signed in", "Welcome back.");
      } else {
        setError("Invalid email or password.");
      }
    }
  };

  if (!customer) {
    return (
      <>
        <Seo title="Account" path="/account" />
        <div className="container-edge py-8">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Account" }]} />
        </div>
        <div className="container-edge flex justify-center pb-24">
          <div className="w-full max-w-md">
            <div className="card p-8">
              <div className="flex justify-center rounded-full bg-surface2 p-1">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className={cn("flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors", mode === m ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}
                  >
                    {m === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                {mode === "register" && (
                  <div>
                    <label className="label-field" htmlFor="acc-name">Full name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input id="acc-name" className="input-field pl-10" value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </div>
                  </div>
                )}
                <div>
                  <label className="label-field" htmlFor="acc-email">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="acc-email" type="email" className="input-field pl-10" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-field" htmlFor="acc-pwd">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="acc-pwd" type="password" className="input-field pl-10" value={form.password} onChange={(e) => set("password", e.target.value)} />
                  </div>
                </div>
                {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p>}
                <button type="submit" className="btn-primary btn-md w-full">
                  {mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2.5 text-xs text-muted">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                Demo accounts: <code className="font-semibold text-ink">isabella@example.com</code> / <code className="font-semibold text-ink">demo1234</code>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <Dashboard customer={customer} orders={orders} onLogout={() => { logout(); toast.info("Signed out"); }} />;
}

function Dashboard({ customer, orders, onLogout }: {
  customer: ReturnType<typeof useAccount>["customer"];
  orders: ReturnType<typeof useStore>["orders"];
  onLogout: () => void;
}) {
  const { articles } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"orders" | "activity" | "preferences" | "profile" | "addresses">("orders");
  if (!customer) return <Navigate to="/account" replace />;

  const myOrders = useMemo(
    () => orders.filter((o) => o.customer.email.toLowerCase() === customer.email.toLowerCase()),
    [orders, customer.email]
  );

  const recentArticles = useMemo(() => [...articles].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 3), [articles]);

  const timeline = customer.timeline || [];

  return (
    <>
      <Seo title="My account" path="/account" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Account" }]} />
      </div>
      <section className="container-edge pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-lg font-semibold text-accent-ink">{customer.name.slice(0, 1)}</span>
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">{customer.name}</h1>
              <p className="text-sm text-muted">{customer.email} · Member since {formatDate(customer.createdAt)}</p>
              {customer.status === "vip" && (
                <span className="badge mt-1 bg-accent-soft text-accent">
                  <Star className="h-3 w-3" /> VIP Member
                </span>
              )}
              {customer.loyaltyPoints != null && customer.loyaltyPoints > 0 && (
                <p className="mt-1 text-xs text-muted">{formatCompact(customer.loyaltyPoints)} loyalty points</p>
              )}
            </div>
          </div>
          <button onClick={onLogout} className="btn-outline btn-md"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Receipt, label: "Orders", value: String(myOrders.length) },
            { icon: Heart, label: "Saved items", value: "Wishlist", to: "/wishlist" },
            { icon: MapPin, label: "Addresses", value: String(customer.addresses.length) },
            { icon: Package, label: "Newsletter", value: customer.newsletter ? "On" : "Off" },
            { icon: Star, label: "Store credit", value: customer.storeCredit ? `$${customer.storeCredit}` : "$0" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <s.icon className="h-5 w-5 text-accent" />
              <p className="mt-3 text-xs text-muted">{s.label}</p>
              {s.to ? <Link to={s.to} className="font-semibold text-accent hover:underline">{s.value}</Link> : <p className="font-semibold text-ink">{s.value}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-line overflow-x-auto hide-scrollbar">
          {([["orders", "Orders"], ["activity", "Activity"], ["preferences", "Preferences"], ["profile", "Profile"], ["addresses", "Addresses"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors", tab === id ? "text-accent" : "text-muted hover:text-ink")}>
              {label}
              {tab === id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "orders" && (
            myOrders.length === 0 ? (
              <EmptyState icon={<Package className="h-6 w-6" />} title="No orders yet" description="When you place an order it'll appear here." action={<Link to="/shop" className="btn-primary btn-md">Start shopping</Link>} />
            ) : (
              <div className="space-y-4">
                {myOrders.map((o) => (
                  <div key={o.id} className="card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                      <div>
                        <p className="font-semibold text-ink">{o.number}</p>
                        <p className="text-xs text-muted">{formatDateTime(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("badge capitalize", STATUS_STYLES[o.status])}>{o.status}</span>
                        <span className="font-semibold text-ink"><Money amount={o.total} /></span>
                      </div>
                    </div>
                    <ul className="mt-4 flex flex-wrap gap-4">
                      {o.items.map((it) => (
                        <li key={it.productId} className="flex items-center gap-2">
                          <img src={it.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
                          <span className="text-sm text-muted">{it.name} ×{it.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "activity" && (
            <ActivityTimeline timeline={timeline} articles={recentArticles} />
          )}

          {tab === "preferences" && (
            <PreferenceCenter
              customer={customer}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )}

          {tab === "profile" && (
            <ProfileEditor customer={customer} />
          )}

          {tab === "addresses" && <AddressManager customer={customer} />}
        </div>
      </section>
    </>
  );
}

function ProfileEditor({ customer }: { customer: NonNullable<ReturnType<typeof useAccount>["customer"]> }) {
  const { updateCustomer } = useStore();
  const { refresh } = useAccount();
  const { toast } = useToast();
  const [name, setName] = useState(customer.name);
  const [newsletter, setNewsletter] = useState(customer.newsletter);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer(customer.id, { name: name.trim(), newsletter });
    refresh();
    toast.success("Profile updated");
  };

  return (
    <form onSubmit={save} className="card max-w-lg p-6">
      <h3 className="text-lg font-semibold text-ink">Profile details</h3>
      <div className="mt-4 space-y-4">
        <div>
          <label className="label-field">Name</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label-field">Email</label>
          <input className="input-field" value={customer.email} disabled />
        </div>
        <label className="flex items-center justify-between rounded-xl border border-line p-4">
          <span><span className="block text-sm font-medium text-ink">Newsletter</span><span className="text-xs text-muted">Receive editorial drops and offers</span></span>
          <button type="button" onClick={() => setNewsletter((n) => !n)} aria-pressed={newsletter} className={cn("relative h-6 w-11 rounded-full transition-colors", newsletter ? "bg-accent" : "bg-line")}>
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", newsletter ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </label>
      </div>
      <button type="submit" className="btn-primary btn-md mt-6">Save changes</button>
    </form>
  );
}

/* ----------------------- Activity Timeline ------------------------- */
function ActivityTimeline({ timeline, articles }: {
  timeline: { id: string; type: string; label: string; ts: number; meta?: string }[];
  articles: ReturnType<typeof useStore>["articles"];
}) {
  const ITEM_ICONS: Record<string, typeof Activity> = {
    account_created: User,
    login: LogIn,
    viewed_product: Eye,
    wishlist_add: Heart,
    cart_add: ShoppingBag,
    purchase: Package,
    review: Star,
    newsletter_signup: Mail,
    coupon_used: Receipt,
  };

  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-ink">Recent activity</h3>
        </div>

        {timeline.length === 0 ? (
          <p className="text-sm text-muted py-4">No activity yet. Start exploring the edit!</p>
        ) : (
          <div className="space-y-0">
            {timeline.slice(0, 10).map((event) => {
              const Icon = ITEM_ICONS[event.type] || Activity;
              return (
                <div key={event.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{event.label}</p>
                    {event.meta && <p className="text-xs text-muted">{event.meta}</p>}
                    <p className="text-[0.6rem] text-muted mt-0.5">{formatDateTime(event.ts)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved articles */}
      {articles.length > 0 && (
        <div className="card mt-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-ink">From the Journal</h3>
          </div>
          <div className="space-y-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} compact />
            ))}
          </div>
          <Link to="/journal" className="btn-outline btn-sm mt-4">
            Browse all stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ----------------------- Preference Center ------------------------- */
function PreferenceCenter({ customer, theme, toggleTheme }: {
  customer: NonNullable<ReturnType<typeof useAccount>["customer"]>;
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const { updateCustomer, deleteCustomer } = useStore();
  const { refresh, logout } = useAccount();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState({
    theme: theme,
    marketingOptIn: customer.preferences?.marketingOptIn ?? true,
    newsletter: customer.newsletter,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: customer.preferences?.marketingOptIn ?? true,
  });

  const savePreferences = () => {
    updateCustomer(customer.id, {
      newsletter: prefs.newsletter,
      preferences: {
        favoriteBrands: customer.preferences?.favoriteBrands ?? [],
        favoriteCategories: customer.preferences?.favoriteCategories ?? [],
        preferredTheme: prefs.theme === "dark" ? "dark" : "light" as const,
        marketingOptIn: prefs.marketingOptIn,
      },
    });
    refresh();
    toast.success("Preferences saved");
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Theme */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-ink">Appearance</h3>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-line p-4">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />}
            <div>
              <p className="text-sm font-medium text-ink">Theme</p>
              <p className="text-xs text-muted">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={cn("relative h-6 w-11 rounded-full transition-colors", theme === "dark" ? "bg-accent" : "bg-line")}
          >
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", theme === "dark" ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-ink">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { id: "orderUpdates" as const, label: "Order updates", desc: "Shipping confirmations and delivery status" },
            { id: "promotionalEmails" as const, label: "Promotional emails", desc: "Sales, new arrivals and editorial drops" },
            { id: "newsletter" as const, label: "Newsletter", desc: "Weekly editorial roundup" },
          ].map((n) => (
            <label key={n.id} className="flex items-center justify-between rounded-xl border border-line p-4 cursor-pointer hover:bg-surface2/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-ink">{n.label}</p>
                <p className="text-xs text-muted">{n.desc}</p>
              </div>
              <span
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", prefs[n.id] ? "bg-accent" : "bg-line")}
                onClick={() => setPrefs((p) => ({ ...p, [n.id]: !p[n.id] }))}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", prefs[n.id] ? "translate-x-5" : "translate-x-0.5")} />
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Privacy & data */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-ink">Privacy & data</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line p-4">
            <div>
              <p className="text-sm font-medium text-ink">Data sharing</p>
              <p className="text-xs text-muted">Allow anonymous usage analytics</p>
            </div>
            <span className={cn("relative h-6 w-11 rounded-full transition-colors", prefs.marketingOptIn ? "bg-accent" : "bg-line")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", prefs.marketingOptIn ? "translate-x-5" : "translate-x-0.5")} />
            </span>
          </div>
          <p className="text-xs text-muted px-1">
            Your data is never sold. Read our{" "}
            <Link to="/legal/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Download personal data */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-ink">Download personal data</h3>
        </div>
        <p className="text-xs text-muted mb-4">
          Export all your personal data stored with ALAYA INSIDER, including profile information, order history, addresses, and preferences.
        </p>
        <button
          onClick={() => {
            const data = {
              exportedAt: new Date().toISOString(),
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              newsletter: customer.newsletter,
              preferences: customer.preferences,
              addresses: customer.addresses,
              loyaltyPoints: customer.loyaltyPoints,
              storeCredit: customer.storeCredit,
              referralCode: customer.referralCode,
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `alaya-personal-data-${customer.id.slice(0, 8)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Personal data exported");
          }}
          className="btn-ghost btn-sm"
        >
          <Download className="h-4 w-4" /> Export my data
        </button>
      </div>

      {/* Delete account */}
      <div className="card border-danger/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="h-5 w-5 text-danger" />
          <h3 className="text-lg font-semibold text-danger">Delete account</h3>
        </div>
        <p className="text-xs text-muted mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
          Your order history will be anonymised and your personal information will be removed.
        </p>
        <button
          onClick={() => {
            if (window.confirm("Are you absolutely sure? This will permanently delete your account and all associated data.")) {
              if (window.confirm("Final confirmation: This cannot be undone. All your personal data will be permanently removed.")) {
                // In production, this would call an API
                // For now, we simulate the deletion
                deleteCustomer(customer.id);
                logout();
                toast.info("Account deleted. We're sorry to see you go.");
              }
            }
          }}
          className="btn btn-md border border-danger/40 text-danger hover:bg-danger/10"
        >
          <AlertTriangle className="h-4 w-4" />
          Delete my account permanently
        </button>
      </div>

      <button onClick={savePreferences} className="btn-primary btn-md mt-4">
        <Check className="h-4 w-4" /> Save preferences
      </button>
    </div>
  );
}

function AddressManager({ customer }: { customer: NonNullable<ReturnType<typeof useAccount>["customer"]> }) {
  const { addCustomerAddress } = useStore();
  const { refresh } = useAccount();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState({ label: "Home", name: customer.name, line1: "", city: "", country: "United States", zip: "", phone: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr.line1.trim() || !addr.city.trim()) return toast.error("Address and city are required");
    addCustomerAddress(customer.id, addr);
    refresh();
    toast.success("Address added");
    setOpen(false);
    setAddr({ label: "Home", name: customer.name, line1: "", city: "", country: "United States", zip: "", phone: "" });
  };

  return (
    <div className="max-w-2xl">
      {customer.addresses.length === 0 && !open ? (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title="No saved addresses" description="Add an address to speed up checkout." action={<button onClick={() => setOpen(true)} className="btn-primary btn-md">Add address</button>} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {customer.addresses.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="badge bg-accent-soft text-accent">{a.label}</span>
                  <Check className="h-4 w-4 text-success" />
                </div>
                <p className="mt-3 text-sm font-medium text-ink">{a.name}</p>
                <p className="text-sm text-muted">{a.line1}</p>
                <p className="text-sm text-muted">{a.city}, {a.zip}</p>
                <p className="text-sm text-muted">{a.country}</p>
                {a.phone && <p className="mt-1 text-sm text-muted">{a.phone}</p>}
              </div>
            ))}
          </div>
          {!open && (
            <button onClick={() => setOpen(true)} className="btn-outline btn-md mt-4"><UserPlus className="h-4 w-4" /> Add address</button>
          )}
        </>
      )}

      {open && (
        <form onSubmit={add} className="card mt-4 p-6">
          <h3 className="text-lg font-semibold text-ink">New address</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label-field">Label</label><input className="input-field" value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} /></div>
            <div><label className="label-field">Full name</label><input className="input-field" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label-field">Address</label><input className="input-field" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} /></div>
            <div><label className="label-field">City</label><input className="input-field" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></div>
            <div><label className="label-field">Postal code</label><input className="input-field" value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} /></div>
            <div><label className="label-field">Country</label><input className="input-field" value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} /></div>
            <div><label className="label-field">Phone</label><input className="input-field" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} /></div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-md">Cancel</button>
            <button type="submit" className="btn-primary btn-md">Save address</button>
          </div>
        </form>
      )}
    </div>
  );
}


