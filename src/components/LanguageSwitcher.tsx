import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useEscapeKey } from "../lib/hooks";
import { cn } from "@/utils/cn";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = languages.find((l) => l.code === language) ?? languages[0];

  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.account") && "Language"}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
      >
        <Globe className="h-4 w-4" />
        {!compact && <span className="font-medium uppercase">{current.code}</span>}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="card absolute right-0 top-full z-50 mt-2 w-44 animate-scale-in overflow-hidden p-1.5"
        >
          {languages.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === language}
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  l.code === language ? "bg-accent-soft font-medium text-accent" : "text-ink hover:bg-surface2"
                )}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{l.flag}</span>
                  {l.label}
                </span>
                {l.code === language && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
