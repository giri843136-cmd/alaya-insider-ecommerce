import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical, LayoutTemplate, Megaphone, Image as ImageIcon, Save } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { DamField } from "../../components/DamField";
import { cn } from "@/utils/cn";
import { uid, wide } from "../../lib/utils";
import type { HeroSlide, HomeSection, Announcement } from "../../lib/types";

export default function AdminHomepage() {
  const { settings, updateSettings } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"sections" | "hero" | "announcements">("sections");
  const [sections, setSections] = useState<HomeSection[]>(settings.homeSections);
  const [hero, setHero] = useState<HeroSlide[]>(settings.heroSlides);
  const [announcements, setAnnouncements] = useState<Announcement[]>(settings.announcements);

  const dirty =
    JSON.stringify(sections) !== JSON.stringify(settings.homeSections) ||
    JSON.stringify(hero) !== JSON.stringify(settings.heroSlides) ||
    JSON.stringify(announcements) !== JSON.stringify(settings.announcements);

  // --- Sections ---
  const move = (i: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };
  const toggleSection = (id: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  // --- Hero ---
  const updateHero = (id: string, patch: Partial<HeroSlide>) =>
    setHero((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const addHero = () =>
    setHero((prev) => [...prev, {
      id: uid("hero"), eyebrow: "New slide", title: "Your headline", description: "Slide description.",
      image: wide(33401555, 1800, 1100), ctaLabel: "Shop now", ctaLink: "/shop", align: "left",
    }]);
  const removeHero = (id: string) => setHero((prev) => prev.filter((s) => s.id !== id));

  // --- Announcements ---
  const updateAnn = (id: string, patch: Partial<Announcement>) =>
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const addAnn = () =>
    setAnnouncements((prev) => [...prev, { id: uid("ann"), text: "New announcement", link: "/shop" }]);
  const removeAnn = (id: string) => setAnnouncements((prev) => prev.filter((a) => a.id !== id));

  const save = () => {
    updateSettings({ homeSections: sections, heroSlides: hero, announcements });
    toast.success("Homepage saved", "Your changes are live on the storefront.");
  };
  const discard = () => {
    setSections(settings.homeSections);
    setHero(settings.heroSlides);
    setAnnouncements(settings.announcements);
    toast.info("Changes discarded");
  };

  return (
    <>
      <Seo title="Homepage Builder" path="/admin/homepage" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Homepage Builder</h1>
            <p className="mt-1 text-sm text-muted">Compose your storefront homepage — no code required.</p>
          </div>
          <div className="flex gap-2">
            {([["sections", "Sections"], ["hero", "Hero slider"], ["announcements", "Announcements"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("chip", tab === id && "chip-active")}>{label}</button>
            ))}
          </div>
        </div>

        {/* SECTIONS */}
        {tab === "sections" && (
          <div className="card mt-8 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><LayoutTemplate className="h-4 w-4 text-accent" /> Homepage sections ({sections.filter((s) => s.enabled).length} active)</p>
              <span className="text-xs text-muted">Reorder with the arrows</span>
            </div>
            <ul className="space-y-2">
              {sections.map((s, i) => (
                <li key={s.id} className={cn("flex items-center gap-3 rounded-xl border p-3 transition-colors", s.enabled ? "border-line bg-surface" : "border-dashed border-line bg-surface2/40 opacity-70")}>
                  <GripVertical className="h-4 w-4 shrink-0 text-line" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{s.label}</p>
                    <p className="text-xs text-muted">#{i + 1} · {s.id}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Move down" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface2 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                    <button onClick={() => toggleSection(s.id)} aria-pressed={s.enabled} className={cn("grid h-8 w-8 place-items-center rounded-full hover:bg-surface2", s.enabled ? "text-accent" : "text-muted")}>
                      {s.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 px-2 text-xs text-muted">Disabled sections are hidden from the homepage but their data is preserved.</p>
          </div>
        )}

        {/* HERO */}
        {tab === "hero" && (
          <div className="mt-8 space-y-4">
            {hero.map((s) => (
              <div key={s.id} className="card overflow-hidden">
                <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
                  <div className="relative aspect-video bg-surface2 sm:aspect-auto">
                    <img src={s.image} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeHero(s.id)} aria-label="Remove slide" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <L label="Eyebrow"><input className="input-field" value={s.eyebrow} onChange={(e) => updateHero(s.id, { eyebrow: e.target.value })} /></L>
                      <L label="Align"><select className="input-field" value={s.align} onChange={(e) => updateHero(s.id, { align: e.target.value as HeroSlide["align"] })}><option value="left">Left</option><option value="center">Center</option></select></L>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <L label="Title"><input className="input-field" value={s.title} onChange={(e) => updateHero(s.id, { title: e.target.value })} /></L>
                      <L label="Highlight word"><input className="input-field" value={s.highlight || ""} onChange={(e) => updateHero(s.id, { highlight: e.target.value })} /></L>
                    </div>
                    <L label="Description"><input className="input-field" value={s.description} onChange={(e) => updateHero(s.id, { description: e.target.value })} /></L>                            <L label="Image">
                              <DamField
                                label=""
                                value={s.image}
                                onChange={(v) => updateHero(s.id, { image: v })}
                                purpose="Hero slide"
                                source="hero"
                                folder="Homepage"
                                compact
                              />
                            </L>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <L label="Primary button label"><input className="input-field" value={s.ctaLabel} onChange={(e) => updateHero(s.id, { ctaLabel: e.target.value })} /></L>
                      <L label="Primary button link"><input className="input-field" value={s.ctaLink} onChange={(e) => updateHero(s.id, { ctaLink: e.target.value })} /></L>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <L label="Secondary button label (optional)"><input className="input-field" value={s.cta2Label || ""} onChange={(e) => updateHero(s.id, { cta2Label: e.target.value })} /></L>
                      <L label="Secondary button link"><input className="input-field" value={s.cta2Link || ""} onChange={(e) => updateHero(s.id, { cta2Link: e.target.value })} /></L>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addHero} className="btn-outline btn-md w-full"><Plus className="h-4 w-4" /> Add slide</button>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "announcements" && (
          <div className="card mt-8 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Megaphone className="h-4 w-4 text-accent" /> Rotating announcements</p>
              <span className="text-xs text-muted">Shown in the top bar</span>
            </div>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex flex-col gap-3 rounded-xl border border-line p-3 sm:flex-row sm:items-center">
                  <input className="input-field flex-1" value={a.text} onChange={(e) => updateAnn(a.id, { text: e.target.value })} placeholder="Announcement text" />
                  <input className="input-field sm:w-40" value={a.link || ""} onChange={(e) => updateAnn(a.id, { link: e.target.value })} placeholder="Link" />
                  <input className="input-field sm:w-36" type="datetime-local" onChange={(e) => updateAnn(a.id, { endsAt: e.target.value ? new Date(e.target.value).getTime() : undefined })} title="Optional countdown end" />
                  <button onClick={() => removeAnn(a.id)} aria-label="Remove" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={addAnn} className="btn-outline btn-md mt-3"><Plus className="h-4 w-4" /> Add announcement</button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><ImageIcon className="h-3.5 w-3.5" /> Tip: set a countdown end to show a live timer.</p>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-transform lg:left-[260px]", dirty ? "translate-y-0" : "translate-y-full")}>
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">You have unsaved changes</p>
          <div className="flex gap-3">
            <button onClick={discard} className="btn-ghost btn-sm">Discard</button>
            <button onClick={save} className="btn-primary btn-sm"><Save className="h-4 w-4" /> Save homepage</button>
          </div>
        </div>
      </div>
    </>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-field">{label}</span>
      {children}
    </label>
  );
}
