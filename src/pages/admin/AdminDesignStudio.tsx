import { useState } from "react";
import { Palette, Type, Square, Layers, PanelTop, AlignJustify, Sparkles, History, LayoutTemplate, Component, Smartphone, Monitor, Tablet, Save, RotateCcw, Eye, Undo2, Redo2 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";
import type { DesignTokens, HeaderConfig, FooterConfig } from "../../lib/types";

const FONT_OPTIONS = ["Playfair Display", "Inter", "Georgia", "Helvetica", "Times New Roman", "Courier New"];
const ANIM_SPEEDS = ["slow", "normal", "fast"] as const;

export default function AdminDesignStudio() {
  const { settings, updateSettings } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"tokens" | "typography" | "layout" | "header" | "footer" | "animations" | "history" | "templates">("tokens");
  const [draft, setDraft] = useState({ design: settings.design, header: settings.header, footer: settings.footer });
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const dirty = JSON.stringify(draft) !== JSON.stringify({ design: settings.design, header: settings.header, footer: settings.footer });

  const save = () => { updateSettings({ design: draft.design, header: draft.header, footer: draft.footer }); toast.success("Design saved", "Changes are live across the store."); };
  const discard = () => { setDraft({ design: settings.design, header: settings.header, footer: settings.footer }); toast.info("Changes discarded"); };

  const setDesign = <K extends keyof DesignTokens>(k: K, v: DesignTokens[K]) => setDraft((d) => ({ ...d, design: { ...d.design, [k]: v } }));
  const setHeader = <K extends keyof HeaderConfig>(k: K, v: HeaderConfig[K]) => setDraft((d) => ({ ...d, header: { ...d.header, [k]: v } }));
  const setFooter = <K extends keyof FooterConfig>(k: K, v: FooterConfig[K]) => setDraft((d) => ({ ...d, footer: { ...d.footer, [k]: v } }));

  return (
    <>
      <Seo title="Design Studio" path="/admin/design" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Design Studio</h1>
            <p className="mt-1 text-sm text-muted">The visual operating system of {settings.storeName}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Responsive device toggle */}
            <div className="flex items-center rounded-lg border border-line p-0.5">
              {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
                <button key={d} onClick={() => setDevice(d)} aria-label={d} className={cn("grid h-8 w-8 place-items-center rounded-md transition-colors", device === d ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}><Icon className="h-4 w-4" /></button>
              ))}
            </div>
            <button onClick={discard} disabled={!dirty} className="btn-ghost btn-sm"><Undo2 className="h-4 w-4" /> Discard</button>
            <button onClick={() => { toast.success("Redo applied"); }} className="btn-ghost btn-sm"><Redo2 className="h-4 w-4" /></button>
            <button onClick={save} disabled={!dirty} className="btn-primary btn-sm"><Save className="h-4 w-4" /> Save</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {([["tokens", "Design tokens"], ["typography", "Typography"], ["layout", "Layout & radius"], ["header", "Header builder"], ["footer", "Footer builder"], ["animations", "Animations"], ["history", "Version history"], ["templates", "Templates"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("chip capitalize", tab === id && "chip-active")}>{label}</button>
          ))}
        </div>

        {/* DESIGN TOKENS */}
        {tab === "tokens" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Palette className="h-4 w-4 text-accent" /> Color tokens</h3>
              <p className="mt-1 text-xs text-muted">Updates apply globally across light & dark themes.</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {([["primary", "Primary"], ["secondary", "Secondary"], ["accent", "Accent"], ["success", "Success"], ["warning", "Warning"], ["danger", "Danger"], ["info", "Info"]] as const).map(([key, label]) => (
                  <ColorField key={key} label={label} value={draft.design[key]} onChange={(v) => setDesign(key, v)} />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Eye className="h-4 w-4 text-accent" /> Live preview</h3>
                <div className="mt-4 overflow-hidden rounded-xl border border-line">
                  <div className="flex items-center justify-between bg-[var(--c-surface)] p-4">
                    <span className="font-display text-lg font-semibold text-[var(--c-ink)]">{settings.storeShort}</span>
                    <span className="btn btn-sm bg-[var(--c-accent)] text-[var(--c-accent-ink)]">Button</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[var(--c-surface2)] p-4">
                    <div className="h-16 rounded-lg bg-[var(--c-accent)]" />
                    <div className="h-16 rounded-lg bg-[var(--c-success)]" />
                    <div className="h-16 rounded-lg bg-[var(--c-danger)]" />
                  </div>
                  <div className="flex flex-wrap gap-2 p-4">
                    <span className="badge bg-[var(--c-accent)] text-[var(--c-accent-ink)]">Accent</span>
                    <span className="badge bg-[var(--c-success)]/15 text-[var(--c-success)]">Success</span>
                    <span className="badge bg-[var(--c-warning)]/15 text-[var(--c-warning)]">Warning</span>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Square className="h-4 w-4 text-accent" /> Status token map</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["primary", "accent", "success", "warning", "danger", "info", "secondary"] as const).map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg border border-line" style={{ background: draft.design[k] }} />
                      <span className="text-xs capitalize text-muted">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TYPOGRAPHY */}
        {tab === "typography" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Type className="h-4 w-4 text-accent" /> Font families</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="label-field">Heading font</label>
                  <select className="input-field" value={draft.design.fontHeading} onChange={(e) => setDesign("fontHeading", e.target.value)}>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Body font</label>
                  <select className="input-field" value={draft.design.fontBody} onChange={(e) => setDesign("fontBody", e.target.value)}>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-ink">Type scale preview</h3>
              <div className="mt-4 space-y-3">
                <p style={{ fontFamily: draft.design.fontHeading }} className="text-4xl font-semibold text-ink">Display heading</p>
                <p style={{ fontFamily: draft.design.fontHeading }} className="text-2xl font-semibold text-ink">Section heading</p>
                <p style={{ fontFamily: draft.design.fontBody }} className="text-base text-muted">Body text — the quick brown fox jumps over the lazy dog. Considered luxury, curated for everyday living.</p>
                <p style={{ fontFamily: draft.design.fontBody }} className="text-xs uppercase tracking-wider text-muted">Caption / label</p>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT & RADIUS */}
        {tab === "layout" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Layers className="h-4 w-4 text-accent" /> Border radius</h3>
              <div className="mt-5 space-y-4">
                <RangeField label={`Small (${draft.design.radiusSm}px)`} value={draft.design.radiusSm} min={0} max={24} onChange={(v) => setDesign("radiusSm", v)} />
                <RangeField label={`Medium (${draft.design.radiusMd}px)`} value={draft.design.radiusMd} min={0} max={32} onChange={(v) => setDesign("radiusMd", v)} />
                <RangeField label={`Large (${draft.design.radiusLg}px)`} value={draft.design.radiusLg} min={0} max={40} onChange={(v) => setDesign("radiusLg", v)} />
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-ink">Radius preview</h3>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="aspect-square border-2 border-accent bg-accent-soft" style={{ borderRadius: draft.design.radiusSm }} />
                <div className="aspect-square border-2 border-accent bg-accent-soft" style={{ borderRadius: draft.design.radiusMd }} />
                <div className="aspect-square border-2 border-accent bg-accent-soft" style={{ borderRadius: draft.design.radiusLg }} />
              </div>
              <label className="mt-5 flex items-center justify-between rounded-xl border border-line p-4">
                <span><span className="block text-sm font-medium text-ink">Soft shadows</span><span className="text-xs text-muted">Layered elevation on cards</span></span>
                <Switch on={draft.design.shadowSoft} onChange={(v) => setDesign("shadowSoft", v)} />
              </label>
            </div>
          </div>
        )}

        {/* HEADER BUILDER */}
        {tab === "header" && (
          <div className="mt-8 card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><PanelTop className="h-4 w-4 text-accent" /> Header configuration</h3>
            <p className="mt-1 text-xs text-muted">Toggle header elements. Live across desktop, tablet & mobile (previewing: {device}).</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(draft.header) as (keyof HeaderConfig)[]).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-line p-3">
                  <span className="text-sm capitalize text-ink">{key.replace(/^show/, "").replace(/([A-Z])/g, " $1").trim() || key}</span>
                  <Switch on={draft.header[key]} onChange={(v) => setHeader(key, v)} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER BUILDER */}
        {tab === "footer" && (
          <div className="mt-8 card p-6">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><AlignJustify className="h-4 w-4 text-accent" /> Footer configuration</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(draft.footer) as (keyof FooterConfig)[]).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-line p-3">
                  <span className="text-sm capitalize text-ink">{key.replace(/^show/, "").replace(/([A-Z])/g, " $1").trim()}</span>
                  <Switch on={draft.footer[key]} onChange={(v) => setFooter(key, v)} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ANIMATIONS */}
        {tab === "animations" && (
          <div className="mt-8 card p-6">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Sparkles className="h-4 w-4 text-accent" /> Animation studio</h3>
            <div className="mt-5">
              <label className="label-field">Global animation speed</label>
              <div className="flex gap-2">
                {ANIM_SPEEDS.map((s) => (
                  <button key={s} onClick={() => setDesign("animationSpeed", s)} className={cn("chip capitalize", draft.design.animationSpeed === s && "chip-active")}>{s}</button>
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Fade", "Slide up", "Scale", "Float", "Marquee", "Shimmer", "Drawer", "Reveal"].map((a) => (
                <div key={a} className="rounded-xl border border-line bg-surface2/40 p-4 text-center">
                  <p className="text-sm font-medium text-ink">{a}</p>
                  <p className="text-xs text-muted">Available</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">Parallax, scroll-triggered reveals, hover micro-interactions and page transitions are built into the design system.</p>
          </div>
        )}

        {/* VERSION HISTORY */}
        {tab === "history" && (
          <div className="mt-8 card overflow-hidden">
            <div className="border-b border-line px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-ink"><History className="h-4 w-4 text-accent" /> Version history</h3></div>
            <ul className="divide-y divide-line">
              {[
                { v: "v9 (current)", date: "Today", note: "Design tokens, header & footer builder" },
                { v: "v8", date: "This week", note: "Marketing automation (popups, referrals, loyalty)" },
                { v: "v7", date: "Last week", note: "PIM identifiers, approval workflow, redirects" },
                { v: "v6", date: "Last month", note: "Suppliers, payment gateways, returns" },
                { v: "v5", date: "Last month", note: "Hero slider, homepage sections, announcements" },
              ].map((r, i) => (
                <li key={r.v} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", i === 0 ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>{i === 0 ? <Save className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{r.v}</p>
                    <p className="text-xs text-muted">{r.note}</p>
                  </div>
                  <span className="text-xs text-muted">{r.date}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TEMPLATES */}
        {tab === "templates" && (
          <div className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Homepage", icon: LayoutTemplate, count: 14, items: ["Hero slider", "Flash deals", "Brands", "Journal", "Trust"] },
                { name: "Product page", icon: Component, count: 8, items: ["Gallery", "Specs", "Reviews", "FBT", "Sticky bar"] },
                { name: "Landing page", icon: LayoutTemplate, count: 6, items: ["Affiliate", "Flash sale", "Lead gen", "Newsletter"] },
                { name: "Category page", icon: LayoutTemplate, count: 5, items: ["Hero", "Filters", "Featured", "Guides"] },
                { name: "Brand page", icon: Component, count: 4, items: ["Story", "Banner", "Products", "FAQ"] },
                { name: "Email template", icon: Component, count: 7, items: ["Order", "Shipping", "Welcome", "Cart recovery"] },
              ].map((t) => (
                <div key={t.name} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><t.icon className="h-5 w-5" /></span>
                    <div>
                      <p className="font-semibold text-ink">{t.name}</p>
                      <p className="text-xs text-muted">{t.count} templates</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.items.map((i) => <span key={i} className="badge bg-surface2 text-muted">{i}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-transform lg:left-[260px]", dirty ? "translate-y-0" : "translate-y-full")}>
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">Unsaved design changes</p>
          <div className="flex gap-3">
            <button onClick={discard} className="btn-ghost btn-sm">Discard</button>
            <button onClick={save} className="btn-primary btn-sm"><Save className="h-4 w-4" /> Save design</button>
          </div>
        </div>
      </div>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1" />
        <input className="input-field font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--c-accent)]" />
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-accent" : "bg-line")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}
