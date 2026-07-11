/**
 * ALAYA INSIDER — Enterprise Globalization Platform Admin UI (PART 2.15)
 * 12 tabs: Dashboard | Countries | Tenants | Domains | Languages |
 * Currencies | Marketplaces | Affiliate Routes | Tax Rules |
 * Compliance | Business Calendar | Reports
 */
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Globe, Building2, Globe2, Languages, DollarSign,
  Store, Network, Receipt, ShieldCheck, CalendarDays, BarChart3,
  Plus, Search, RefreshCw, CheckCircle2, XCircle,
  ArrowUpDown, Target, Zap,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import {
  getGlobalizationDashboard, getGlobalizationMetrics,
  getCountries, updateCountry,
  getHolidays,
  getTenants, createTenant, updateTenant, getTenantDomains,
  getLanguageConfigs, updateLanguageConfig,
  generateHreflangTags,
  getCurrencyRates, convertCurrencyGlobal, formatCurrencyGlobal,
  getMarketplaces, syncMarketplace,
  getAffiliateRoutes, createAffiliateRoute, updateAffiliateRoute,
  getGlobalTaxRules, getCountryTaxRate,
  getPrivacyRegulations, updatePrivacyRegulation,
  getCookieCategories, getComplianceScore,
  isBusinessDay, getNextBusinessDay,
  generateGlobalReport,
  type Country, type SupportedCurrencyCode,
} from "../../lib/globalizationPlatform";

type Tab =
  | "dashboard" | "countries" | "tenants" | "domains" | "languages"
  | "currencies" | "marketplaces" | "affiliate" | "tax" | "compliance"
  | "calendar" | "reports";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "countries", label: "Countries", icon: Globe },
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "domains", label: "Domains", icon: Globe2 },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "currencies", label: "Currencies", icon: DollarSign },
  { id: "marketplaces", label: "Marketplaces", icon: Store },
  { id: "affiliate", label: "Affiliate Routes", icon: Network },
  { id: "tax", label: "Tax Rules", icon: Receipt },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function AdminGlobalizationPlatform() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <>
      <Seo title="Globalization Platform" path="/admin/globalization-platform" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Globalization Platform</h1>
            <p className="mt-1 text-sm text-muted">Country, multi-language, multi-currency, international commerce & compliance.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("chip flex items-center gap-1.5 capitalize", tab === t.id && "chip-active")}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "countries" && <CountriesTab />}
        {tab === "tenants" && <TenantsTab />}
        {tab === "domains" && <DomainsTab />}
        {tab === "languages" && <LanguagesTab />}
        {tab === "currencies" && <CurrenciesTab />}
        {tab === "marketplaces" && <MarketplacesTab />}
        {tab === "affiliate" && <AffiliateTab />}
        {tab === "tax" && <TaxTab />}
        {tab === "compliance" && <ComplianceTab />}
        {tab === "calendar" && <CalendarTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

function DashboardTab() {
  const dash = useMemo(() => getGlobalizationDashboard(), []);
  const metrics = useMemo(() => getGlobalizationMetrics(), []);
  const score = useMemo(() => getComplianceScore(), []);

  const STATS = [
    { label: "Countries", value: `${dash.activeCountries}/${dash.totalCountries}`, sub: "Active", icon: Globe },
    { label: "Languages", value: `${dash.activeLanguages}/${dash.totalLanguages}`, sub: "Active", icon: Languages },
    { label: "Currencies", value: String(dash.activeCurrencies), sub: "In use", icon: DollarSign },
    { label: "Marketplaces", value: `${dash.syncedMarketplaces}/${dash.totalMarketplaces}`, sub: "Connected", icon: Store },
    { label: "Compliance", value: `${dash.complianceScore}%`, sub: score.passed === score.total ? "All passed" : `${score.passed}/${score.total} passed`, icon: ShieldCheck },
    { label: "Tenants", value: `${dash.activeTenants}/${dash.totalTenants}`, sub: "Active", icon: Building2 },
  ];

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STATS.map((s) => (
          <div key={s.label} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><s.icon className="h-5 w-5" /></span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Key Metrics</h3>
          <div className="mt-4 space-y-3">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-danger")} />
                  <span className="text-sm text-ink">{m.name}</span>
                </div>
                <span className="text-sm font-semibold text-ink">{m.currentValue}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Compliance Overview</h3>
          <div className="mt-4 space-y-3">
            {score.items.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-danger" />}
                  <span className="text-sm text-ink">{item.name}</span>
                </div>
                <span className={cn("text-xs", item.status === "pass" ? "text-success" : "text-danger")}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COUNTRIES TAB                                                      */
/* ================================================================== */

function CountriesTab() {
  const [countries, setCountries] = useState(() => getCountries());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);

  const refresh = () => setCountries(getCountries());
  const filtered = query.trim() ? countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())) : countries;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search countries…" className="input-field pl-9" />
        </div>
        <button onClick={refresh} className="btn-ghost btn-sm"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <button key={c.code} onClick={() => setSelected(selected?.code === c.code ? null : c)} className={cn("card p-4 text-left transition-all", selected?.code === c.code && "ring-2 ring-accent")}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.flagEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink text-sm">{c.name}</p>
                  <span className="badge bg-surface2 text-muted">{c.code}</span>
                </div>
                <p className="text-xs text-muted">{c.nativeName} · {c.continent}</p>
              </div>
              <div className={cn("h-2.5 w-2.5 rounded-full", c.active ? "bg-success" : "bg-line")} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted">
              <span className="badge bg-accent-soft text-accent">{c.defaultCurrency}</span>
              <span className="badge bg-accent-soft text-accent">{c.defaultLanguage}</span>
              <span className="badge bg-surface2">{(c.taxRate * 100).toFixed(1)}%</span>
              <span className={cn("badge", c.shippingAvailable ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{c.shippingAvailable ? "Ships" : "No ship"}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> {selected.flagEmoji} {selected.name} ({selected.code})</h3>
            <button onClick={() => { updateCountry(selected.code, { active: !selected.active }); refresh(); }} className={cn("btn-ghost btn-sm", selected.active ? "text-danger" : "text-success")}>{selected.active ? "Deactivate" : "Activate"}</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><span className="text-xs text-muted">Native Name</span><p className="text-sm font-medium text-ink">{selected.nativeName}</p></div>
            <div><span className="text-xs text-muted">Dial Code</span><p className="text-sm font-medium text-ink">{selected.dialCode}</p></div>
            <div><span className="text-xs text-muted">Timezone</span><p className="text-sm font-medium text-ink">{selected.timezone}</p></div>
            <div><span className="text-xs text-muted">Currency</span><p className="text-sm font-medium text-ink">{selected.defaultCurrency}</p></div>
            <div><span className="text-xs text-muted">Language</span><p className="text-sm font-medium text-ink">{selected.defaultLanguage}</p></div>
            <div><span className="text-xs text-muted">Tax</span><p className="text-sm font-medium text-ink">{selected.taxName} ({(selected.taxRate * 100).toFixed(1)}%)</p></div>
            <div><span className="text-xs text-muted">Postal Format</span><p className="text-sm font-medium text-ink">{selected.postalCodeFormat}</p></div>
            <div><span className="text-xs text-muted">Shipping</span><p className="text-sm font-medium text-ink">{selected.shippingAvailable ? "Available" : "Not available"}</p></div>
            <div><span className="text-xs text-muted">Region</span><p className="text-sm font-medium text-ink">{selected.region} / {selected.subregion}</p></div>
          </div>
          {selected.states.length > 0 && (
            <div className="mt-4">
              <span className="text-xs text-muted">States / Regions ({selected.states.length})</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {selected.states.map((s) => (
                  <span key={s.code} className="badge bg-surface2 text-muted">{s.name} ({s.code})</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TENANTS TAB                                                        */
/* ================================================================== */

function TenantsTab() {
  const [tenants, setTenants] = useState(() => getTenants());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", billingPlan: "starter" as const, billingEmail: "", defaultLanguage: "en", defaultCurrency: "USD" as SupportedCurrencyCode, countryCode: "US", primaryColor: "#9c7a4b", secondaryColor: "#211c15", features: {}, settings: {}, metadata: {} });

  const refresh = () => setTenants(getTenants());
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{tenants.length} tenants · {tenants.filter((t) => t.isActive).length} active</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Tenant</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Tenant</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input-field" placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Slug*" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <input className="input-field" placeholder="Billing email*" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} />
            <input className="input-field sm:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={() => { if (form.name && form.slug) { createTenant(form as any); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {tenants.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", t.isActive ? "bg-success/15 text-success" : "bg-surface2 text-muted")}><Building2 className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{t.name}</p>
                  <span className="badge bg-accent-soft text-accent">{t.slug}</span>
                  <span className={cn("badge", t.isActive ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{t.isActive ? "Active" : "Inactive"}</span>
                  <span className="badge bg-accent-soft text-accent capitalize">{t.billingPlan}</span>
                </div>
                <p className="text-xs text-muted">{t.description} · {t.domains.length} domains · {t.defaultCurrency}/{t.defaultLanguage}</p>
              </div>
              <button onClick={() => { updateTenant(t.id, { isActive: !t.isActive }); refresh(); }} className={cn("btn-ghost btn-sm", t.isActive ? "text-warning" : "text-success")}>{t.isActive ? "Pause" : "Activate"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DOMAINS TAB                                                        */
/* ================================================================== */

function DomainsTab() {
  const [tenants] = useState(() => getTenants());
  const selectedTenant = tenants[0];
  const [domains] = useState(() => selectedTenant ? getTenantDomains(selectedTenant.id) : []);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{domains.length} domains · {domains.filter((d) => d.verified).length} verified</p>            <button onClick={() => setShowForm((p) => !p)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add Domain</button>
      </div>

      {showForm && selectedTenant && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">Add Domain</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-field" placeholder="e.g., store.com" value={""} onChange={() => {}} />
            <select className="input-field">
              <option value="primary">Primary</option>
              <option value="country">Country</option>
              <option value="language">Language</option>
              <option value="regional">Regional</option>
              <option value="subdomain">Subdomain</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("grid h-8 w-8 place-items-center rounded-full", d.verified ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}><Globe2 className="h-4 w-4" /></span>
                <div>
                  <p className="font-medium text-ink text-sm">{d.domain}</p>
                  <span className="badge bg-accent-soft text-accent capitalize text-xs">{d.type}</span>
                </div>
              </div>
              <span className={cn("h-2 w-2 rounded-full", d.verified ? "bg-success" : d.sslEnabled ? "bg-warning" : "bg-line")} title={d.verified ? "Verified" : "Not verified"} />
            </div>
            <p className="mt-2 text-xs text-muted">DNS: {d.dnsRecord}</p>
            <div className="mt-1 flex gap-2 text-xs text-muted">
              <span>SSL: {d.sslEnabled ? "✅" : "❌"}</span>
              {d.countryCode && <span>Country: {d.countryCode}</span>}
              {d.languageCode && <span>Lang: {d.languageCode}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  LANGUAGES TAB                                                      */
/* ================================================================== */

function LanguagesTab() {
  const [langs, setLangs] = useState(() => getLanguageConfigs());
  const refresh = () => setLangs(getLanguageConfigs());
  const activeCount = langs.filter((l) => l.active).length;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{activeCount} active · {langs.length - activeCount} inactive</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {langs.map((l) => (
          <div key={l.code} className={cn("card p-4", l.isDefault && "ring-1 ring-accent/40")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{l.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink text-sm">{l.name}</p>
                    <span className="badge bg-surface2 text-muted uppercase">{l.code}</span>
                    {l.isDefault && <span className="badge bg-accent-soft text-accent text-xs">Default</span>}
                  </div>
                  <p className="text-xs text-muted">{l.nativeName} · {l.locale} · {l.direction === "rtl" ? "RTL" : "LTR"}</p>
                </div>
              </div>
              <button onClick={() => { updateLanguageConfig(l.code, { active: !l.active }); refresh(); }} className={cn("btn-ghost btn-sm", l.active ? "text-warning" : "text-success")}>{l.active ? "Disable" : "Enable"}</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted">
              <span className="badge bg-surface2">{l.dateFormat}</span>
              <span className="badge bg-surface2">{l.timeFormat}</span>
              <span className="badge bg-surface2">DOW: {l.firstDayOfWeek}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hreflang Preview */}
      <div className="card mt-6 p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Languages className="h-4 w-4 text-accent" /> Hreflang Tags Preview</h3>
        <div className="space-y-1">
          {generateHreflangTags("/shop").map((h) => (
            <div key={h.hreflang} className="flex items-center gap-3 rounded-lg bg-surface2/50 px-3 py-2 text-xs">
              <span className="font-mono text-accent">{h.hreflang}</span>
              <span className="text-muted">{h.locale}</span>
              <code className="flex-1 truncate text-muted">{h.url}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CURRENCIES TAB                                                     */
/* ================================================================== */

function CurrenciesTab() {
  const rates = useMemo(() => getCurrencyRates(), []);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">Live exchange rates · {rates.length} currencies</p>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Rate (vs USD)</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Convert $100</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rates.map((r) => (
              <tr key={r.code} className="hover:bg-surface2/40">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-ink">
                    <span className="w-6 text-center">{r.symbol}</span>
                    {r.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-ink">{r.code}</td>
                <td className="px-4 py-3 font-mono text-ink">{r.rate.toFixed(4)}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium", r.changePercent > 0 ? "text-success" : r.changePercent < 0 ? "text-danger" : "text-muted")}>
                    {r.changePercent > 0 ? "↑" : r.changePercent < 0 ? "↓" : "→"} {Math.abs(r.changePercent).toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">{formatCurrencyGlobal(convertCurrencyGlobal(100, "USD", r.code), r.code)}</td>
                <td className="px-4 py-3 text-muted text-xs">{formatDate(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Converter */}
      <div className="card mt-4 p-5">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><ArrowUpDown className="h-4 w-4 text-accent" /> Quick Currency Converter</h3>
        <CurrencyConverterWidget />
      </div>
    </div>
  );
}

function CurrencyConverterWidget() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<SupportedCurrencyCode>("USD");
  const [to, setTo] = useState<SupportedCurrencyCode>("EUR");
  const num = parseFloat(amount) || 0;
  const result = convertCurrencyGlobal(num, from, to);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label-field">Amount</label>
        <input className="input-field w-28" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <label className="label-field">From</label>
        <select className="input-field" value={from} onChange={(e) => setFrom(e.target.value as SupportedCurrencyCode)}>
          {getCurrencyRates().map((r) => <option key={r.code} value={r.code}>{r.code} ({r.symbol})</option>)}
        </select>
      </div>
      <div>
        <label className="label-field">To</label>
        <select className="input-field" value={to} onChange={(e) => setTo(e.target.value as SupportedCurrencyCode)}>
          {getCurrencyRates().map((r) => <option key={r.code} value={r.code}>{r.code} ({r.symbol})</option>)}
        </select>
      </div>
      <div>
        <label className="label-field">Result</label>
        <p className="font-display text-xl font-semibold text-ink">{formatCurrencyGlobal(result, to)}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MARKETPLACES TAB                                                   */
/* ================================================================== */

function MarketplacesTab() {
  const [mps, setMps] = useState(() => getMarketplaces());
  const refresh = () => setMps(getMarketplaces());

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{mps.filter((m) => m.active).length} active · {mps.length} total</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mps.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-ink text-sm">{m.name}</p>
                  <p className="text-xs text-muted capitalize">{m.platform} · {m.countryCode}</p>
                </div>
              </div>
              <span className={cn("badge", m.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{m.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              <span className="badge bg-accent-soft text-accent">{m.currency}</span>
              <span className="badge bg-surface2">{m.language}</span>
              <span className="badge bg-surface2">{m.commissionPercent}% comm</span>
              <span className={cn("badge", m.credentialsConfigured ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{m.credentialsConfigured ? "Configured" : "No creds"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={cn("text-xs", m.syncStatus === "idle" ? "text-muted" : "text-accent")}>
                {m.lastSyncedAt ? `Synced ${formatDate(m.lastSyncedAt)}` : "Never synced"}
              </span>
              <button onClick={() => { syncMarketplace(m.id); refresh(); }} className="btn-ghost btn-sm text-xs"><RefreshCw className="h-3 w-3" /> Sync</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AFFILIATE ROUTES TAB                                               */
/* ================================================================== */

function AffiliateTab() {
  const [routes, setRoutes] = useState(() => getAffiliateRoutes());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ countryCode: "US", networkId: "impact", networkName: "", trackingId: "", baseUrl: "", commissionRate: 8, priority: 1, active: true });

  const refresh = () => setRoutes(getAffiliateRoutes());

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{routes.filter((r) => r.active).length} active routes</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New Route</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-ink mb-3">New Affiliate Route</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input-field" placeholder="Network name*" value={form.networkName} onChange={(e) => setForm({ ...form, networkName: e.target.value })} />
            <input className="input-field" placeholder="Tracking ID" value={form.trackingId} onChange={(e) => setForm({ ...form, trackingId: e.target.value })} />
            <input className="input-field" placeholder="Base URL" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          </div>
          <button onClick={() => { if (form.networkName) { createAffiliateRoute({ ...form, countryCode: form.countryCode, networkId: form.networkId }); setShowForm(false); refresh(); } }} className="btn-primary btn-sm mt-3">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {routes.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", r.active ? "bg-success/15 text-success" : "bg-surface2 text-muted")}><Network className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{r.networkName}</p>
                  <span className="badge bg-accent-soft text-accent">{r.countryCode}</span>
                  <span className={cn("badge", r.active ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{r.active ? "Active" : "Inactive"}</span>
                </div>
                <p className="text-xs text-muted">{r.trackingId} · {r.baseUrl} · {r.commissionRate}% · Priority {r.priority}</p>
              </div>
              <button onClick={() => { updateAffiliateRoute(r.id, { active: !r.active }); refresh(); }} className={cn("btn-ghost btn-sm", r.active ? "text-warning" : "text-success")}>{r.active ? "Deactivate" : "Activate"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAX RULES TAB                                                      */
/* ================================================================== */

function TaxTab() {
  const taxRules = useMemo(() => getGlobalTaxRules(), []);
  const [country, setCountry] = useState("US");
  const [amount, setAmount] = useState("100");
  const taxInfo = getCountryTaxRate(country, parseFloat(amount) || 0);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">{taxRules.length} active tax rules across all countries</p>

      {/* Tax Calculator */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Receipt className="h-4 w-4 text-accent" /> Tax Calculator</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label-field">Country</label>
            <select className="input-field" value={country} onChange={(e) => setCountry(e.target.value)}>
              {getCountries().filter((c) => c.active).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Amount ($)</label>
            <input className="input-field w-28" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label-field">Tax</label>
            <p className="font-display text-xl font-semibold text-ink">{taxInfo.tax.toFixed(2)} ({taxInfo.name})</p>
          </div>
        </div>
      </div>

      {/* Tax Rules List */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3">Country</th><th className="px-4 py-3">Tax Name</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Applies To</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {taxRules.map((r) => (
              <tr key={r.id} className="hover:bg-surface2/40">
                <td className="px-4 py-3 text-ink">{r.countryCode}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 font-mono text-ink">{(r.rate * 100).toFixed(1)}%</td>
                <td className="px-4 py-3"><span className="badge bg-accent-soft text-accent uppercase">{r.type}</span></td>
                <td className="px-4 py-3 text-muted">{r.appliesTo.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPLIANCE TAB                                                     */
/* ================================================================== */

function ComplianceTab() {
  const [regs, setRegs] = useState(() => getPrivacyRegulations());
  const [cookies] = useState(() => getCookieCategories());
  const score = useMemo(() => getComplianceScore(), [regs]);
  const refresh = () => setRegs(getPrivacyRegulations());

  return (
    <div className="mt-8">
      {/* Score */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("grid h-16 w-16 place-items-center rounded-full text-lg font-bold", score.score >= 80 ? "bg-success/15 text-success" : score.score >= 50 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>{score.score}%</div>
          <div>
            <h3 className="font-semibold text-ink">Compliance Score</h3>
            <p className="text-sm text-muted">{score.passed}/{score.total} regulations passed</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Regulations */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Privacy Regulations</h3>
          <div className="space-y-2">
            {regs.map((r) => (
              <div key={r.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.enabled ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-danger" />}
                    <div>
                      <p className="font-medium text-ink text-sm">{r.name}</p>
                      <p className="text-xs text-muted">{r.countries.join(", ")} · {r.requirements.length} requirements</p>
                    </div>
                  </div>
                  <button onClick={() => { updatePrivacyRegulation(r.id, { enabled: !r.enabled }); refresh(); }} className={cn("btn-ghost btn-sm text-xs", r.enabled ? "text-warning" : "text-success")}>{r.enabled ? "Disable" : "Enable"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cookie Categories */}
        <div>
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Cookie Categories</h3>
          <div className="space-y-2">
            {cookies.map((c) => (
              <div key={c.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">{c.name}</p>
                    <p className="text-xs text-muted">{c.description}</p>
                  </div>
                  <span className={cn("badge", c.required ? "bg-accent-soft text-accent" : "bg-surface2 text-muted")}>{c.required ? "Required" : "Optional"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.cookies.map((ck) => (
                    <span key={ck.name} className="badge bg-surface2 text-muted text-xs">{ck.name} ({ck.duration})</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CALENDAR TAB                                                       */
/* ================================================================== */

function CalendarTab() {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const holidays = useMemo(() => getHolidays(selectedCountry), [selectedCountry]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="input-field w-48" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          {getCountries().filter((c) => c.active).map((c) => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
        </select>
        <p className="text-sm text-muted">{holidays.length} public holidays</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent" /> Holidays</h3>
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink">{h.name}</p>
                  <p className="text-xs text-muted">{h.date} · {h.type}</p>
                </div>
                <span className={cn("badge", h.businessClosure ? "bg-danger/15 text-danger" : "bg-accent-soft text-accent")}>{h.businessClosure ? "Closed" : "Open"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Business Day Check</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-accent-soft/30 p-3 text-sm">
              <p className="text-muted">Today: <span className="font-medium text-ink">{isBusinessDay(new Date(), selectedCountry) ? "✅ Business day" : "❌ Not a business day"}</span></p>
              <p className="mt-1 text-muted">Next business day: <span className="font-medium text-ink">{getNextBusinessDay(new Date(), selectedCountry).toLocaleDateString()}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  REPORTS TAB                                                        */
/* ================================================================== */

function ReportsTab() {
  const [report, setReport] = useState<any>(null);

  return (
    <div className="mt-8">
      <p className="text-sm text-muted mb-4">Globalization reports · country, language, currency, compliance & marketplace data</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(["countries", "languages", "currencies", "compliance", "marketplace", "traffic"] as const).map((type) => (
          <button key={type} onClick={() => setReport(generateGlobalReport(type))} className="chip capitalize">{type} Report</button>
        ))}
      </div>

      {report && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> {report.title}</h3>
            <span className="text-xs text-muted">{formatDate(report.generatedAt)}</span>
          </div>
          <pre className="text-xs text-muted whitespace-pre-wrap max-h-80 overflow-y-auto bg-surface2/50 rounded-lg p-4">{JSON.stringify(report.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
