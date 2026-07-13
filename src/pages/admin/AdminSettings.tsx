import { useState, isValidElement, cloneElement, useCallback, useRef, useEffect, type ReactElement, type ReactNode } from "react";
import { Save, RotateCcw, Store, Palette, DollarSign, Megaphone, Share2, Search, ToggleLeft, ShieldCheck, Smartphone, Check, RefreshCw, Copy, CheckCheck } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { DamField } from "../../components/DamField";
import { Dialog } from "../../components/ui";
import { CURRENCIES } from "../../lib/utils";
import { generate2FASecret, buildOTPAuthURI, verifyTOTP, backupCodes } from "../../lib/security";
import type { Settings, Theme } from "../../lib/types";
import { cn } from "@/utils/cn";

const ACCENT_PRESETS = [
  { light: "#9c7a4b", dark: "#c9a876", name: "Bronze" },
  { light: "#7a6a52", dark: "#b8a888", name: "Taupe" },
  { light: "#6f7f5c", dark: "#a8b893", name: "Sage" },
  { light: "#9a5a4a", dark: "#c98a78", name: "Clay" },
  { light: "#4a5a7a", dark: "#8aa0c9", name: "Indigo" },
  { light: "#1f1b16", dark: "#f2ece1", name: "Mono" },
];

export default function AdminSettings() {
  const { settings, updateSettings, setCurrency, resetData } = useStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Settings>(() => ({ ...settings }));
  const [resetOpen, setResetOpen] = useState(false);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = () => {
    updateSettings(draft);
    toast.success("Settings saved", "Your changes are live across the store.");
  };

  const discard = () => {
    setDraft({ ...settings });
    toast.info("Changes discarded");
  };

  return (
    <>
      <Seo title="Settings" path="/admin/settings" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Settings</h1>
            <p className="mt-1 text-sm text-muted">Configure your store — every change applies instantly.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* General */}
          <Section icon={Store} title="General">
            <Field label="Store name"><input className="input-field" value={draft.storeName} onChange={(e) => set("storeName", e.target.value)} /></Field>
            <Field label="Short name (logo)"><input className="input-field" value={draft.storeShort} onChange={(e) => set("storeShort", e.target.value)} /></Field>
            <Field label="Tagline"><input className="input-field" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
            <Field label="Description"><textarea rows={2} className="input-field resize-none" value={draft.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact email"><input className="input-field" value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
              <Field label="Support email"><input className="input-field" value={draft.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></Field>
            </div>
            <Field label="Contact phone"><input className="input-field" value={draft.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></Field>
            <Field label="Studios / address"><input className="input-field" value={draft.address} onChange={(e) => set("address", e.target.value)} /></Field>
          </Section>

          {/* Appearance */}
          <Section icon={Palette} title="Appearance">
            <Field label="Default theme">
              <div className="flex gap-2">
                {(["light", "dark"] as Theme[]).map((t) => (
                  <button key={t} onClick={() => set("defaultTheme", t)} className={cn("chip capitalize", draft.defaultTheme === t && "chip-active")}>{t}</button>
                ))}
              </div>
            </Field>
            <Field label="Default language">
              <select className="input-field" value={draft.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value as Settings["defaultLanguage"])}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="hi">हिन्दी</option>
              </select>
            </Field>
            <Field label="Accent colour">
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((p) => {
                  const active = draft.accentLight.toLowerCase() === p.light.toLowerCase();
                  return (
                    <button key={p.name} onClick={() => setDraft((d) => ({ ...d, accentLight: p.light, accentDark: p.dark }))} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs", active ? "border-accent" : "border-line")} title={p.name}>
                      <span className="h-4 w-4 rounded-full" style={{ background: p.light }} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Accent (light)">
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.accentLight} onChange={(e) => set("accentLight", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1" />
                  <input className="input-field" value={draft.accentLight} onChange={(e) => set("accentLight", e.target.value)} />
                </div>
              </Field>
              <Field label="Accent (dark)">
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.accentDark} onChange={(e) => set("accentDark", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1" />
                  <input className="input-field" value={draft.accentDark} onChange={(e) => set("accentDark", e.target.value)} />
                </div>
              </Field>
            </div>
          </Section>

          {/* Currency & shipping */}
          <Section icon={DollarSign} title="Currency & commerce">
            <Field label="Display currency">
              <select className="input-field" value={draft.currency.code} onChange={(e) => { const c = CURRENCIES[e.target.value] || CURRENCIES.USD; set("currency", c); }}>
                {Object.entries(CURRENCIES).map(([code, c]) => <option key={code} value={code}>{code} ({c.symbol}) · rate {c.rate}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Free shipping over ($)"><input type="number" className="input-field" value={draft.shipping.freeOver} onChange={(e) => set("shipping", { ...draft.shipping, freeOver: Number(e.target.value) })} /></Field>
              <Field label="Flat shipping rate ($)"><input type="number" className="input-field" value={draft.shipping.flatRate} onChange={(e) => set("shipping", { ...draft.shipping, flatRate: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Tax rate"><input type="number" step="0.01" className="input-field" value={draft.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} /></Field>
          </Section>

          {/* Announcement */}
          <Section icon={Megaphone} title="Announcement bar">
            <Toggle label="Enabled" checked={draft.announcement.enabled} onChange={(v) => set("announcement", { ...draft.announcement, enabled: v })} />
            <Field label="Message"><input className="input-field" value={draft.announcement.text} onChange={(e) => set("announcement", { ...draft.announcement, text: e.target.value })} /></Field>
            <Field label="Link (optional)"><input className="input-field" value={draft.announcement.link || ""} onChange={(e) => set("announcement", { ...draft.announcement, link: e.target.value })} placeholder="/shop" /></Field>
          </Section>

          {/* Social */}
          <Section icon={Share2} title="Social links">
            <Field label="Instagram"><input className="input-field" value={draft.social.instagram} onChange={(e) => set("social", { ...draft.social, instagram: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pinterest"><input className="input-field" value={draft.social.pinterest} onChange={(e) => set("social", { ...draft.social, pinterest: e.target.value })} /></Field>
              <Field label="TikTok"><input className="input-field" value={draft.social.tiktok} onChange={(e) => set("social", { ...draft.social, tiktok: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="YouTube"><input className="input-field" value={draft.social.youtube} onChange={(e) => set("social", { ...draft.social, youtube: e.target.value })} /></Field>
              <Field label="X"><input className="input-field" value={draft.social.x} onChange={(e) => set("social", { ...draft.social, x: e.target.value })} /></Field>
            </div>
          </Section>

          {/* SEO */}
          <Section icon={Search} title="SEO defaults">
            <Field label="Default title"><input className="input-field" value={draft.seo.title} onChange={(e) => set("seo", { ...draft.seo, title: e.target.value })} /></Field>
            <Field label="Meta description"><textarea rows={2} className="input-field resize-none" value={draft.seo.description} onChange={(e) => set("seo", { ...draft.seo, description: e.target.value })} /></Field>
            <Field label="Keywords"><input className="input-field" value={draft.seo.keywords} onChange={(e) => set("seo", { ...draft.seo, keywords: e.target.value })} /></Field>
            <Field label="OG image URL">
              <DamField
                label=""
                value={draft.seo.ogImage}
                onChange={(v) => setDraft((d) => ({ ...d, seo: { ...d.seo, ogImage: v } }))}
                purpose="Open Graph image"
                source="seo"
                folder="SEO"
                aspectRatio="1.91:1"
                compact
                helpText="Used when sharing on social media (1200×630 recommended)"
              />
            </Field>
            <Field label="Twitter handle"><input className="input-field" value={draft.seo.twitterHandle} onChange={(e) => set("seo", { ...draft.seo, twitterHandle: e.target.value })} /></Field>
          </Section>

          {/* Features */}
          <Section icon={ToggleLeft} title="Features">
            {([
              ["wishlist", "Wishlist"],
              ["compare", "Compare products"],
              ["recentlyViewed", "Recently viewed"],
              ["darkMode", "Dark mode"],
              ["multiLanguage", "Multi-language"],
              ["affiliate", "Affiliate products"],
              ["reviews", "Product reviews"],
              ["digital", "Digital products"],
              ["coupons", "Coupons & promos"],
              ["brands", "Brands directory"],
              ["journal", "Journal / blog"],
              ["accounts", "Customer accounts"],
            ] as const).map(([k, label]) => (
              <Toggle key={k} label={label} checked={draft.features[k]} onChange={(v) => set("features", { ...draft.features, [k]: v })} />
            ))}
          </Section>

          {/* Security */}
          <Section icon={ShieldCheck} title="Security">
            <Field label="Admin password"><input className="input-field" value={draft.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Admin email (OTP)"><input className="input-field" value={draft.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} placeholder="alayainsider@gmail.com" /></Field>
              <Field label="Admin phone (OTP)"><input className="input-field" value={draft.adminPhone} onChange={(e) => set("adminPhone", e.target.value)} placeholder="+1 (212) 555-0199" /></Field>
            </div>
            <p className="text-xs text-muted">OTP codes sent to these contacts. Falls back to store contact email/phone if left empty.</p>

            {/* TOTP Authenticator App Setup */}
            <div className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-ink">Authenticator app</span>
                </div>
                <select
                  className="input-field w-auto text-xs"
                  value={draft.mfaMethod}
                  onChange={(e) => set("mfaMethod", e.target.value as "email_sms" | "totp")}
                >
                  <option value="email_sms">Email / SMS</option>
                  <option value="totp">Authenticator app</option>
                </select>
              </div>
              {draft.mfaMethod === "totp" && (
                <TotpSetupSection
                  secret={draft.totpSecret}
                  backupCodes={draft.totpBackupCodes}
                  onSecretChange={(s) => setDraft((d) => ({ ...d, totpSecret: s, totpVerified: false }))}
                  onVerified={() => setDraft((d) => ({ ...d, totpVerified: true }))}
                  onBackupCodesChange={(codes) => setDraft((d) => ({ ...d, totpBackupCodes: codes }))}
                  verified={draft.totpVerified}
                />
              )}
            </div>

            <p className="text-xs text-muted">Sessions expire after 8 hours. Brute-force lockout is active on the sign-in page.</p>
            <div className="rounded-lg bg-surface2/60 p-3 text-xs text-muted">
              <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Two-factor authentication (OTP/TOTP)</p>
              <p className="mt-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> CSRF & XSS-safe rendering</p>
              <p className="mt-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Inputs validated & escaped</p>
              <p className="mt-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Role-based admin access</p>
            </div>
          </Section>
        </div>

        {/* Danger zone */}
        <div className="mt-6 rounded-[var(--radius-xl2)] border border-danger/30 bg-danger/5 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-danger"><RotateCcw className="h-4 w-4" /> Reset store data</h3>
          <p className="mt-1 text-sm text-muted">Restore all products, categories, orders and settings to their original seed state. This cannot be undone.</p>
          <button onClick={() => setResetOpen(true)} className="btn btn-md mt-3 border border-danger/40 text-danger hover:bg-danger/10">Reset to defaults</button>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-transform lg:left-[260px]", dirty ? "translate-y-0" : "translate-y-full")}>
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">You have unsaved changes</p>
          <div className="flex gap-3">
            <button onClick={discard} className="btn-ghost btn-sm">Discard</button>
            <button onClick={save} className="btn-primary btn-sm"><Save className="h-4 w-4" /> Save changes</button>
          </div>
        </div>
      </div>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all data?"
        footer={
          <>
            <button onClick={() => setResetOpen(false)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={() => { resetData(); setCurrency("USD"); setDraft({ ...settings }); setResetOpen(false); toast.success("Store reset", "All data restored to defaults."); }} className="btn btn-md bg-danger text-white hover:brightness-110">Reset everything</button>
          </>
        }
      >
        This will replace your current products, categories, orders, affiliates and settings with the original demo data.
      </Dialog>
    </>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Icon className="text-accent" style={{ width: 18, height: 18 }} /> {title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-field';
  return (
    <div>
      <label htmlFor={id} className="label-field">{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id })
        : children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-line")} aria-pressed={checked}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

function TotpSetupSection({
  secret,
  backupCodes: savedBackupCodes,
  onSecretChange,
  onVerified,
  onBackupCodesChange,
  verified,
}: {
  secret: string;
  backupCodes: string[];
  onSecretChange: (s: string) => void;
  onVerified: () => void;
  onBackupCodesChange: (codes: string[]) => void;
  verified: boolean;
}) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [testCode, setTestCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<"" | "ok" | "fail">("");

  const generateSecret = useCallback(() => {
    const newSecret = generate2FASecret();
    onSecretChange(newSecret);
    setTestResult("");
    setTestCode("");
    toast.success("New secret generated", "Scan the QR code with your authenticator app.");
  }, [onSecretChange, toast]);

  const uri = secret ? buildOTPAuthURI(secret) : "";

  // Generate QR code via canvas
  useEffect(() => {
    if (!secret || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        if (!cancelled && canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, uri, {
            width: 180,
            margin: 2,
            color: { dark: "#211c15", light: "#ffffff" },
          });
        }
      } catch {
        // QR generation failed silently
      }
    })();
    return () => { cancelled = true; };
  }, [secret, uri]);

  const handleTestVerify = useCallback(async () => {
    if (!secret || testCode.length !== 6) return;
    setTestResult("");
    const ok = await verifyTOTP(secret, testCode);
    if (ok) {
      setTestResult("ok");
      onVerified();
      // Generate backup codes on first successful verification
      if (savedBackupCodes.length === 0) {
        const codes = backupCodes(8);
        onBackupCodesChange(codes);
      }
      toast.success("Authenticator configured", "TOTP verification works — save settings to activate.");
    } else {
      setTestResult("fail");
    }
  }, [secret, testCode, onVerified, toast]);

  const handleCopySecret = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [secret]);

  if (!secret) {
    return (
      <div className="mt-4 flex flex-col items-center gap-4 py-4">
        <p className="text-center text-xs text-muted">No authenticator app configured. Generate a secret to get started.</p>
        <button onClick={generateSecret} className="btn-primary btn-sm">
          <Smartphone className="h-4 w-4" /> Generate secret
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-4">
        <canvas ref={canvasRef} width={180} height={180} className="rounded-lg" />
        <p className="text-xs text-muted">Scan with Google Authenticator, Authy, or any TOTP app</p>
      </div>

      {/* Secret key (manual entry) */}
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-surface2 px-3 py-2 text-xs tracking-wider text-ink select-all">{secret}</code>
        <button onClick={handleCopySecret} className="btn-ghost btn-sm shrink-0" title="Copy secret">
          {copied ? <CheckCheck className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
        <button onClick={generateSecret} className="btn-ghost btn-sm shrink-0" title="Generate new secret">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Verify setup */}
      <div>
        <p className="mb-2 text-xs text-muted">Verify setup by entering a code from your authenticator app:</p>
        <div className="flex items-center gap-2">
          <input
            className="input-field flex-1 text-center text-lg tracking-[0.3em]"
            placeholder="000000"
            maxLength={6}
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button
            onClick={handleTestVerify}
            disabled={testCode.length !== 6}
            className="btn-primary btn-sm"
          >
            {verified ? <Check className="h-4 w-4" /> : "Verify"}
          </button>
        </div>
        {testResult === "ok" && (
          <p className="mt-1 flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" /> Verified — authenticator app configured correctly.
          </p>
        )}
        {testResult === "fail" && (
          <p className="mt-1 text-xs text-danger">Code didn't match. Make sure your device time is synced and try a new code.</p>
        )}
        {verified && (
          <p className="mt-1 flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" /> Authenticator app is configured and ready.
          </p>
        )}
      </div>

      {/* Backup codes (shown after verification) */}
      {verified && savedBackupCodes.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-ink">Recovery codes</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Save these one-time recovery codes in a secure place. Each code can be used once if you lose access to your authenticator app.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {savedBackupCodes.map((code, i) => (
              <code key={i} className="rounded bg-surface2 px-2 py-1.5 text-xs font-mono tracking-wider text-ink select-all">
                {code}
              </code>
            ))}
          </div>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(savedBackupCodes.join("\n"));
                toast.success("Recovery codes copied", "Paste them somewhere safe.");
              } catch { /* ignore */ }
            }}
            className="btn-ghost btn-sm mt-3 text-xs"
          >
            <Copy className="h-3.5 w-3.5" /> Copy all codes
          </button>
        </div>
      )}
    </div>
  );
}
