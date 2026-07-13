import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { Breadcrumbs } from "../components/ui";
import { COLLECTION_GROUPS, COLLECTIONS } from "../lib/collections";
import { wide } from "../lib/utils";

export default function Collections() {
  const { products } = useStore();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Collections — ALAYA INSIDER",
    itemListElement: Object.values(COLLECTIONS).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      url: `${window.location.origin}/#/collections/${c.id}`,
    })),
  };

  return (
    <>
      <Seo title="Collections" description="Curated collections, deals and editorial edits from ALAYA INSIDER." path="/collections" schema={schema} />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Collections" }]} />
      </div>

      <section className="container-edge pb-20">
        <Reveal>
          <span className="eyebrow mb-3">Curated edits</span>
          <h1 className="text-display-l text-ink">Collections</h1>
          <p className="mt-4 max-w-xl text-muted">
            Every way to browse our edit — from fresh arrivals and flash deals to luxury heirlooms and gift-worthy favourites.
          </p>
        </Reveal>

        {/* Quick link chips by group */}
        <div className="mt-10 space-y-6">
          {COLLECTION_GROUPS.map((group) => (
            <Reveal key={group.label}>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((it) => (
                    <Link key={it.to} to={it.to} className="chip">{it.label}</Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Visual grid of all collections */}
        <div className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-3">
          {Object.values(COLLECTIONS).map((c, i) => {
            const count = c.filter(products).length;
            return (
              <Reveal key={c.id} delay={(i % 3) * 60}>
                <Link
                  to={`/collections/${c.id}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-xl2)] bg-surface2"
                >
                  <img src={wide(c.hero, 800, 1000)} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/70">{c.eyebrow}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white">
                      {count} pieces <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
