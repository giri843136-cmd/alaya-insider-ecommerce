import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowRight, Search, AlertTriangle, Lock, ServerCrash } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { ProductCard } from "../components/ProductCard";
import { Reveal } from "../components/Reveal";

interface ErrorDef {
  code: string;
  title: string;
  message: string;
  icon: typeof AlertTriangle;
}

const ERROR_DEFS: Record<string, ErrorDef> = {
  "401": { code: "401", title: "Sign in required", message: "You'll need to sign in to view this page.", icon: Lock },
  "403": { code: "403", title: "Access denied", message: "You don't have permission to access this page.", icon: Lock },
  "404": { code: "404", title: "This page wandered off", message: "We couldn't find what you were looking for — but there's plenty more to discover.", icon: AlertTriangle },
  "410": { code: "410", title: "No longer available", message: "This content has been permanently removed.", icon: AlertTriangle },
  "429": { code: "429", title: "Slow down a moment", message: "You've made a few too many requests. Please try again shortly.", icon: AlertTriangle },
  "500": { code: "500", title: "Something broke on our end", message: "We've been notified. Please try again in a moment.", icon: ServerCrash },
  "503": { code: "503", title: "We'll be right back", message: "We're performing maintenance to improve your experience.", icon: ServerCrash },
};

export default function ErrorPage({ code = "404" }: { code?: string }) {
  const def = ERROR_DEFS[code] ?? ERROR_DEFS["404"];
  const { products } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const recommendations = useMemo(
    () => [...products].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 4),
    [products]
  );

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    else navigate("/shop");
  };

  const Icon = def.icon;

  return (
    <>
      <Seo title={`Error ${def.code}`} path={`/error-${def.code}`} />
      <div className="container-edge py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="grid mx-auto h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
              <Icon className="h-8 w-8" />
            </span>
            <p className="mt-6 font-display text-[6rem] font-semibold leading-none text-accent sm:text-[8rem]">{def.code}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">{def.title}</h1>
            <p className="mt-3 text-pretty text-muted">{def.message}</p>
          </Reveal>

          {/* Search */}
          <form onSubmit={search} className="mx-auto mt-8 flex max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="input-field pl-9" aria-label="Search" />
            </div>
            <button type="submit" className="btn-primary btn-md shrink-0">Search</button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-outline btn-md"><Home className="h-4 w-4" /> Back home</Link>
            <Link to="/shop" className="btn-primary btn-md">Browse the edit <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-20">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">You might love these</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {recommendations.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
