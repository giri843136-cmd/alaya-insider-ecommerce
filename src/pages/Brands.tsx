import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { BrandCard } from "../components/BrandCard";
import { Breadcrumbs, EmptyState, SectionHeading } from "../components/ui";

export default function Brands() {
  const { brands, productsByBrand } = useStore();

  const featured = useMemo(() => brands.filter((b) => b.featured), [brands]);
  const rest = useMemo(() => brands.filter((b) => !b.featured), [brands]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Brands — ALAYA INSIDER",
    itemListElement: brands.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      url: `${window.location.origin}/#/brands/${b.slug}`,
    })),
  };

  return (
    <>
      <Seo title="Brands" description="Discover the curated brands carried by ALAYA INSIDER." path="/brands" schema={schema} />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Brands" }]} />
      </div>

      <section className="container-edge pb-20">
        <Reveal>
          <span className="eyebrow mb-3">The houses we love</span>
          <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Brands</h1>
          <p className="mt-4 max-w-xl text-muted">
            Each label is chosen for craft, integrity and enduring design — the makers behind our edit.
          </p>
        </Reveal>

        {featured.length > 0 && (
          <div className="mt-10">
            <Reveal><SectionHeading eyebrow="Featured" title="House favourites" /></Reveal>
            <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
              {featured.map((b, i) => (
                <Reveal key={b.id} delay={i * 60}><BrandCard brand={b} /></Reveal>
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="mt-14">
            <Reveal><SectionHeading eyebrow="All brands" title="Explore the full roster" /></Reveal>
            <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {rest.map((b, i) => (
                <Reveal key={b.id} delay={i * 50}><BrandCard brand={b} /></Reveal>
              ))}
            </div>
          </div>
        )}

        {brands.length === 0 && (
          <div className="mt-10">
            <EmptyState title="No brands yet" description="Check back soon — we're adding new houses all the time." />
          </div>
        )}

        {/* A-Z quick links */}
        <div className="mt-16 border-t border-line pt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Browse by brand</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link key={b.id} to={`/brands/${b.slug}`} className="chip">
                {b.name} · {productsByBrand(b.id).length}
              </Link>
            ))}
          </div>
          <Link to="/shop" className="btn-outline btn-md mt-8">Shop all products <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
