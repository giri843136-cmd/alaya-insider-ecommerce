import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, ArrowUpRight, CornerDownLeft, Clock, TrendingUp, Trash2, Sparkles, Bot } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useEscapeKey, useLockBody, useDebounced, useLocalStorage } from "../lib/hooks";
import { Price } from "./ui";
import { VoiceSearch } from "./VoiceSearch";

const TRENDING = ["amber noir", "gold hoops", "leather tote", "vitamin c", "capsule wardrobe"];
const RECENT_KEY = "alaya_recent_searches";

export const SearchModal = memo(function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query.trim(), 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);
  useEscapeKey(onClose, open);
  useLockBody(open);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!debounced) return [];
    const q = debounced.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [products, debounced]);

  // AI quick suggestions for some queries
  const aiSuggestions = useMemo(() => {
    if (!debounced || debounced.length < 2) return null;
    const q = debounced.toLowerCase();
    const suggestions: string[] = [];
    if (q.includes("gift") || q.includes("present")) suggestions.push("Curated gifts under $100");
    if (q.includes("summer") || q.includes("warm")) suggestions.push("Summer essentials edit");
    if (q.includes("winter") || q.includes("cold")) suggestions.push("Winter warmers collection");
    if (q.includes("sale") || q.includes("deal") || q.includes("discount")) suggestions.push("Best deals under $50");
    if (q.includes("black") || q.includes("classic")) suggestions.push("Classic essentials edit");
    if (q.includes("minimal") || q.includes("simple")) suggestions.push("Minimalist curation");
    if (q.includes("bday") || q.includes("birthday")) suggestions.push("Birthday gift guide");
    if (q.includes("office") || q.includes("work")) suggestions.push("The work wardrobe edit");
    return suggestions.length > 0 ? suggestions : null;
  }, [debounced]);

  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript);
    // Auto-trigger search after voice input
    setRecent((prev) => [transcript, ...prev.filter((p) => p.toLowerCase() !== transcript.toLowerCase())].slice(0, 6));
  }, [setRecent]);

  if (!open) return null;

  const runSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => [t, ...prev.filter((p) => p.toLowerCase() !== t.toLowerCase())].slice(0, 6));
    navigate(`/shop?q=${encodeURIComponent(t)}`);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="container-edge relative z-10 pt-[8vh]">
        <div className="card overflow-hidden p-0 animate-scale-in">
          <form onSubmit={submit} className="flex items-center gap-3 border-b border-line px-5 py-4">
            <Search className="h-5 w-5 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, collections…"
              aria-label="Search products"
              className="flex-1 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
            />
            <VoiceSearch onResult={handleVoiceResult} />
            <button type="button" onClick={onClose} aria-label="Close search" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2">
              <X className="h-5 w-5" />
            </button>
          </form>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!debounced ? (
              <div className="p-4">
                {recent.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted"><Clock className="h-3.5 w-3.5" /> Recent</p>
                      <button onClick={() => setRecent([])} className="text-xs text-muted hover:text-danger" aria-label="Clear recent searches"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((t) => (
                        <button key={t} onClick={() => runSearch(t)} className="chip">{t}</button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted"><TrendingUp className="h-3.5 w-3.5" /> Trending</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button key={t} onClick={() => runSearch(t)} className="chip">
                      {t}
                    </button>
                  ))}
                </div>

                {/* Quick categories */}
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted"><Sparkles className="h-3.5 w-3.5" /> Shop by category</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[{ label: "New Arrivals", slug: "/collections/new" }, { label: "Best Sellers", slug: "/collections/bestsellers" }, { label: "On Sale", slug: "/collections/deals" }, { label: "Luxury Edit", slug: "/collections/luxury" }].map((c) => (
                      <Link
                        key={c.label}
                        to={c.slug}
                        onClick={onClose}
                        className="rounded-lg bg-surface2 px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-accent-soft hover:text-accent"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-ink">No results for “{debounced}”</p>
                <p className="mt-1 text-xs text-muted">Try a different keyword or browse the full edit.</p>
                <button onClick={submit as unknown as () => void} className="btn-outline btn-sm mt-4">
                  View all products
                </button>
                {/* AI fallback suggestions */}
                {aiSuggestions && (
                  <div className="mt-6 border-t border-line pt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      <Bot className="h-3.5 w-3.5 text-accent" /> Try these curated edits
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {aiSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => runSearch(s)}
                          className="chip text-xs"
                        >
                          <Sparkles className="h-3 w-3 text-accent" /> {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ul>
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        navigate(`/product/${p.slug}`);
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface2"
                    >
                      <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                        <span className="block truncate text-xs capitalize text-muted">{p.category}</span>
                      </span>
                      <Price price={p.price} salePrice={p.salePrice} />
                    </button>
                  </li>
                ))}
                {/* AI suggestion for results */}
                {aiSuggestions && (
                  <li className="border-t border-line mt-2 pt-2">
                    <div className="flex flex-wrap gap-1.5 px-2.5 py-1.5">
                      {aiSuggestions.slice(0, 2).map((s) => (
                        <button
                          key={s}
                          onClick={() => runSearch(s)}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-medium text-accent hover:brightness-105"
                        >
                          <Sparkles className="h-3 w-3" /> {s}
                        </button>
                      ))}
                    </div>
                  </li>
                )}
                <li>
                  <button onClick={submit as unknown as () => void} className="flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-accent transition-colors hover:bg-surface2">
                    See all results for “{debounced}”
                    <CornerDownLeft className="h-4 w-4" />
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
        <p className="mt-3 hidden items-center justify-center gap-1.5 text-xs text-muted sm:flex">
          <ArrowUpRight className="h-3 w-3" /> Press <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem]">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
});
