/**
 * ALAYA INSIDER — Merchant Administration (Critical Fix 4)
 * --------------------------------------------------------------------------
 * Full CRUD for all 30 merchants. Edits are persisted in localStorage
 * and merged with the hardcoded base MERCHANTS array at runtime.
 * Admins can: create, edit, delete, enable/disable, configure countries,
 * currencies, commission, trust scores, affiliate networks, and more.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Power, PowerOff, Globe,
  Percent, Shield, Truck, ArrowUpDown,
  Search, Filter, Save,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import {
  MERCHANTS, type MerchantConfig,
} from "../../lib/affiliateCommerce";
import {
  fetchMerchants, createMerchant, updateMerchant, deleteMerchant,
} from "../../lib/affiliateApi";

/* ================================================================== */
/*  PERSISTENCE — localStorage overlay                                 */
/* ================================================================== */

const MERCHANT_OVERRIDES_KEY = "alaya_merchant_overrides";

interface MerchantOverrides {
  [merchantId: string]: Partial<MerchantConfig> & {
    _deleted?: boolean;
    _custom?: boolean;
  };
}

function getOverrides(): MerchantOverrides {
  try {
    const raw = localStorage.getItem(MERCHANT_OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveOverrides(overrides: MerchantOverrides) {
  try { localStorage.setItem(MERCHANT_OVERRIDES_KEY, JSON.stringify(overrides)); } catch { /* ignore */ }
}

function getMergedMerchants(): MerchantConfig[] {
  const overrides = getOverrides();
  const merged = MERCHANTS
    .filter((m) => !overrides[m.id]?._deleted)
    .map((m) => ({ ...m, ...(overrides[m.id] || {}) } as MerchantConfig));

  // Add custom merchants
  for (const [, override] of Object.entries(overrides)) {
    if (override._custom) {
      merged.push(override as unknown as MerchantConfig);
    }
  }

  return merged.sort((a, b) => a.priority - b.priority);
}

function persistMerchantUpdate(id: string, patch: Partial<MerchantConfig>) {
  const overrides = getOverrides();
  overrides[id] = { ...(overrides[id] || {}), ...patch };
  saveOverrides(overrides);
}

function persistMerchantDelete(id: string) {
  const overrides = getOverrides();
  overrides[id] = { ...(overrides[id] || {}), _deleted: true };
  saveOverrides(overrides);
}

function persistMerchantCreate(merchant: MerchantConfig) {
  const overrides = getOverrides();
  const entry = { ...merchant } as any;
  entry._custom = true;
  overrides[merchant.id] = entry;
  saveOverrides(overrides);
}

/* Removed unused constants — countries/currencies/networks are entered as free text. */

/* ================================================================== */
/*  EMPTY FORM STATE                                                   */
/* ================================================================== */

function emptyMerchant(): MerchantConfig {
  return {
    id: `merchant_${Date.now()}`,
    name: "", slug: "", logoSvg: "",
    domains: [], countries: [], currencies: [],
    networks: [], commissionRate: 3, cookieDays: 30,
    active: true, priority: 99, isAffiliate: true,
    minPrice: undefined, maxPrice: undefined,
    supportsDigital: false, shipsGlobal: false,
    returnDays: 30, trustScore: 50, verified: false,
    theme: { bg: "#333333", text: "#FFFFFF", border: "#555555" },
    cta: "Shop Now",
  };
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<MerchantConfig[]>(() => {
    // Show local data immediately while API fetch runs in background
    try { return getMergedMerchants(); } catch { return []; }
  });
  const [editing, setEditing] = useState<MerchantConfig | null>(null);
  const [toDelete, setToDelete] = useState<MerchantConfig | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [tab, setTab] = useState<"merchants" | "settings">("merchants");

  // Load merchants from backend API on mount, with localStorage fallback
  const refresh = useCallback(async () => {
    const apiMerchants = await fetchMerchants();
    const local = getMergedMerchants();
    // Merge: API data takes priority, local overrides fill gaps
    const merged = local.map((localM) => {
      const apiM = apiMerchants.find((a) => a.id === localM.id);
      return apiM ? { ...localM, ...apiM, logoSvg: localM.logoSvg } : localM;
    });
    // Add any merchants from API that aren't in local
    for (const apiM of apiMerchants) {
      if (!merged.find((m) => m.id === apiM.id)) {
        merged.push(apiM);
      }
    }
    setMerchants(merged.sort((a, b) => a.priority - b.priority));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    let list = merchants;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.countries.some((c) => c.toLowerCase().includes(q)) ||
        m.networks.some((n) => n.toLowerCase().includes(q)),
      );
    }
    if (filterActive === "active") list = list.filter((m) => m.active);
    if (filterActive === "disabled") list = list.filter((m) => !m.active);
    return list;
  }, [merchants, search, filterActive]);

  const handleToggleActive = useCallback(async (id: string, current: boolean) => {
    const newActive = !current;
    persistMerchantUpdate(id, { active: newActive });
    await updateMerchant(id, { active: newActive });
    refresh();
  }, [refresh]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    // Check if this is a new merchant (not in the base MERCHANTS list)
    const isNewMerchant = !MERCHANTS.some((m) => m.id === editing.id);
    if (isNewMerchant) {
      persistMerchantCreate(editing);
      await createMerchant(editing);
    } else {
      persistMerchantUpdate(editing.id, editing);
      await updateMerchant(editing.id, editing);
    }
    setEditing(null);
    refresh();
  }, [editing, refresh]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!toDelete) return;
    persistMerchantDelete(toDelete.id);
    await deleteMerchant(toDelete.id);
    setToDelete(null);
    refresh();
  }, [toDelete, refresh]);

  // Generate stats
  const stats = useMemo(() => ({
    total: merchants.length,
    active: merchants.filter((m) => m.active).length,
    affiliate: merchants.filter((m) => m.isAffiliate).length,
    avgCommission: merchants.length
      ? Math.round(merchants.reduce((s, m) => s + m.commissionRate, 0) / merchants.length * 10) / 10
      : 0,
  }), [merchants]);

  return (
    <>
      <Seo title="Merchant Administration" path="/admin/merchants" />
      <div className="p-5 pb-28 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Merchants</h1>
            <p className="mt-1 text-sm text-muted">Manage all 30+ global merchants, affiliate networks, and commission settings.</p>
          </div>
          <button onClick={() => setEditing(emptyMerchant())} className="btn-primary btn-md">
            <Plus className="h-4 w-4" /> Add merchant
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          <div className="card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total</p>
            <p className="mt-1 text-xl font-bold text-ink">{stats.total}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Active</p>
            <p className="mt-1 text-xl font-bold text-success">{stats.active}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Affiliate</p>
            <p className="mt-1 text-xl font-bold text-accent">{stats.affiliate}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Avg Commission</p>
            <p className="mt-1 text-xl font-bold text-ink">{stats.avgCommission}%</p>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["merchants", "settings"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
                {t === "merchants" ? <Globe className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                {t === "merchants" ? "All merchants" : "Settings"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {(["all", "active", "disabled"] as const).map((f) => (
              <button key={f} onClick={() => setFilterActive(f)} className={cn("btn-xs capitalize", filterActive === f ? "btn-primary" : "btn-ghost")}>
                {f}
              </button>
            ))}
            <div className="relative ml-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search merchants..."
                className="input-field w-56 pl-9 text-sm"
                aria-label="Search merchants"
              />
            </div>
          </div>
        </div>

        {tab === "merchants" && (
          <>
            {/* Table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface2/60">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">Merchant</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Countries</th>
                    <th className="px-4 py-3 hidden md:table-cell">Networks</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">Trust</th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">Priority</th>
                    <th className="px-4 py-3 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                        {search ? "No merchants match your search." : "No merchants found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => (
                      <tr key={m.id} className={cn("transition-colors hover:bg-surface/60", !m.active && "opacity-60")}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(m.id, m.active)}
                            className={cn("grid h-7 w-7 place-items-center rounded-full transition-colors", m.active ? "text-success hover:bg-success/10" : "text-muted hover:bg-surface2")}
                            aria-label={m.active ? "Disable" : "Enable"}
                            title={m.active ? "Disable" : "Enable"}
                          >
                            {m.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 shrink-0 rounded-lg border border-line overflow-hidden flex items-center justify-center"
                              dangerouslySetInnerHTML={{ __html: m.logoSvg }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">{m.name}</p>
                              <p className="text-[0.6rem] text-muted font-mono">{m.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {m.countries.slice(0, 4).map((c) => (
                              <Badge key={c} variant="info">{c}</Badge>
                            ))}
                            {m.countries.length > 4 && <Badge variant="neutral">+{m.countries.length - 4}</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {m.networks.slice(0, 2).map((n) => (
                              <span key={n} className="rounded bg-surface2 px-1.5 py-0.5 text-[0.5rem] font-mono text-muted">{n}</span>
                            ))}
                            {m.networks.length > 2 && <span className="text-[0.5rem] text-muted">+{m.networks.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-ink">{m.commissionRate}%</span>
                          {m.isAffiliate && <span className="ml-1 text-[0.5rem] text-accent">aff</span>}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-surface2 overflow-hidden">
                              <div className={cn("h-full rounded-full", m.trustScore >= 85 ? "bg-success" : m.trustScore >= 70 ? "bg-amber-500" : "bg-danger")} style={{ width: `${m.trustScore}%` }} />
                            </div>
                            <span className="text-xs text-muted">{m.trustScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="text-xs text-muted">{m.priority}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditing({ ...m })} className="btn-ghost btn-xs" aria-label={`Edit ${m.name}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setToDelete(m)} className="btn-ghost btn-xs text-danger" aria-label={`Delete ${m.name}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <p className="mt-3 text-xs text-muted">
              Showing {filtered.length} of {merchants.length} merchants.
              {!search && filterActive === "all" && ` ${stats.active} active, ${stats.total - stats.active} disabled.`}
            </p>
          </>
        )}

        {tab === "settings" && (
          <div className="mt-6 max-w-2xl">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">Merchant Configuration Settings</h2>
              <div className="space-y-4 text-sm text-muted">
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-ink">Geo Routing</p>
                    <p className="text-xs mt-0.5">Merchants are automatically matched to users based on their detected country, currency, and language. The first merchant in each country with the highest priority score is shown first.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Percent className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-ink">Commission Model</p>
                    <p className="text-xs mt-0.5">Each merchant has a base commission rate. Actual earnings depend on the affiliate network, product category, and negotiated terms. Commission is tracked per-click in the analytics pipeline.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-ink">Trust Scoring</p>
                    <p className="text-xs mt-0.5">Trust scores (0–100) are used in the merchant ranking engine together with price, delivery speed, and commission rate. Merchants with scores ≥90 are eligible for the "Editor's Choice" badge.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-ink">Shipping & Returns</p>
                    <p className="text-xs mt-0.5">Merchant shipping speed, return policy (in days), and global shipping flags are used in the offer cards. Faster delivery and longer return windows improve the merchant's rank score.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowUpDown className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-ink">Ranking Algorithm</p>
                    <p className="text-xs mt-0.5">Merchant offers are ranked using a composite score: price competitiveness (0–25), delivery speed (0–15), trust score (0–20), and commission (0–10). Best-in-class offers are marked with "Best Price," "Fastest," "Trusted," and "Editor's Choice" badges.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  EDIT / CREATE DIALOG                                              */}
      {/* ================================================================ */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={handleSave} className="card relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">
                {MERCHANTS.some((m) => m.id === editing.id) && editing.id ? "Edit merchant" : "Add new merchant"}
              </h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Merchant name *</label>
                  <input className="input-field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Amazon" required />
                </div>
                <div>
                  <label className="label-field">Slug</label>
                  <input className="input-field" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="amazon" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-field">Priority (lower = first)</label>
                  <input type="number" className="input-field" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} min={1} />
                </div>
                <div>
                  <label className="label-field">Commission rate %</label>
                  <input type="number" className="input-field" value={editing.commissionRate} onChange={(e) => setEditing({ ...editing, commissionRate: Number(e.target.value) })} min={0} max={100} step={0.5} />
                </div>
                <div>
                  <label className="label-field">Cookie days</label>
                  <input type="number" className="input-field" value={editing.cookieDays} onChange={(e) => setEditing({ ...editing, cookieDays: Number(e.target.value) })} min={1} />
                </div>
              </div>

              {/* Trust + Verification */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-field">Trust score (0–100)</label>
                  <input type="number" className="input-field" value={editing.trustScore} onChange={(e) => setEditing({ ...editing, trustScore: Number(e.target.value) })} min={0} max={100} />
                </div>
                <div>
                  <label className="label-field">Return days</label>
                  <input type="number" className="input-field" value={editing.returnDays} onChange={(e) => setEditing({ ...editing, returnDays: Number(e.target.value) })} min={0} />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 text-sm text-ink py-2">
                    <input type="checkbox" checked={editing.verified} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    Verified merchant
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 text-sm text-ink">
                  <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                  Active
                </label>
                <label className="flex items-center gap-3 text-sm text-ink">
                  <input type="checkbox" checked={editing.isAffiliate} onChange={(e) => setEditing({ ...editing, isAffiliate: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                  Affiliate (tracked link)
                </label>
                <label className="flex items-center gap-3 text-sm text-ink">
                  <input type="checkbox" checked={editing.supportsDigital} onChange={(e) => setEditing({ ...editing, supportsDigital: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                  Supports digital goods
                </label>
                <label className="flex items-center gap-3 text-sm text-ink">
                  <input type="checkbox" checked={editing.shipsGlobal} onChange={(e) => setEditing({ ...editing, shipsGlobal: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                  Ships globally
                </label>
              </div>

              {/* Price range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Min price (optional)</label>
                  <input type="number" className="input-field" value={editing.minPrice ?? ""} onChange={(e) => setEditing({ ...editing, minPrice: e.target.value ? Number(e.target.value) : undefined })} min={0} />
                </div>
                <div>
                  <label className="label-field">Max price (optional)</label>
                  <input type="number" className="input-field" value={editing.maxPrice ?? ""} onChange={(e) => setEditing({ ...editing, maxPrice: e.target.value ? Number(e.target.value) : undefined })} min={0} />
                </div>
              </div>

              {/* Countries */}
              <div>
                <label className="label-field">Countries (comma-separated ISO codes)</label>
                <input className="input-field" value={editing.countries.join(", ")} onChange={(e) => setEditing({ ...editing, countries: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) })} placeholder="US, GB, DE, FR" />
              </div>

              {/* Currencies */}
              <div>
                <label className="label-field">Currencies (comma-separated ISO codes)</label>
                <input className="input-field" value={editing.currencies.join(", ")} onChange={(e) => setEditing({ ...editing, currencies: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) })} placeholder="USD, GBP, EUR" />
              </div>

              {/* Networks */}
              <div>
                <label className="label-field">Affiliate networks (comma-separated)</label>
                <input className="input-field" value={editing.networks.join(", ")} onChange={(e) => setEditing({ ...editing, networks: e.target.value.split(",").map((n) => n.trim().toLowerCase()).filter(Boolean) })} placeholder="impact, cj, awin" />
              </div>

              {/* Domains */}
              <div>
                <label className="label-field">Domains (comma-separated)</label>
                <input className="input-field" value={editing.domains.join(", ")} onChange={(e) => setEditing({ ...editing, domains: e.target.value.split(",").map((d) => d.trim()).filter(Boolean) })} placeholder="amazon.com, amazon.co.uk" />
              </div>

              {/* CTA */}
              <div>
                <label className="label-field">Call to action</label>
                <input className="input-field" value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} placeholder="Buy on Amazon" />
              </div>

              {/* Theme */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-field">Theme background (hex)</label>
                  <input className="input-field" value={editing.theme.bg} onChange={(e) => setEditing({ ...editing, theme: { ...editing.theme, bg: e.target.value } })} placeholder="#FFD814" />
                </div>
                <div>
                  <label className="label-field">Theme text (hex)</label>
                  <input className="input-field" value={editing.theme.text} onChange={(e) => setEditing({ ...editing, theme: { ...editing.theme, text: e.target.value } })} placeholder="#000000" />
                </div>
                <div>
                  <label className="label-field">Theme border (hex)</label>
                  <input className="input-field" value={editing.theme.border} onChange={(e) => setEditing({ ...editing, theme: { ...editing.theme, border: e.target.value } })} placeholder="#F3CD00" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">
                <Save className="h-4 w-4" />
                {editing.id && MERCHANTS.find((m) => m.id === editing.id) ? "Save changes" : "Add merchant"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remove merchant"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={handleDeleteConfirm} className="btn btn-md bg-danger text-white hover:brightness-110">Remove</button>
          </>
        }
      >
        Remove <strong>{toDelete?.name}</strong> from the merchant database? It can be restored by re-adding it.
      </Dialog>
    </>
  );
}
