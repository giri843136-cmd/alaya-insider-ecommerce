import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, PackageSearch, Layers } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";
import { Breadcrumbs, EmptyState } from "../components/ui";
import { COLLECTIONS } from "../lib/collections";
import { wide } from "../lib/utils";

const PAGE_SIZE = 8;

export default function CollectionPage() {
  const { id } = useParams();
  const { products } = useStore();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const def = id ? COLLECTIONS[id] : undefined;

  const items = useMemo(
    () => (def ? def.filter(products) : []),
    [def, products]
  );

  // reset pagination when collection changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [id]);

  if (!def) {
    return (
      <div className="container-edge py-24">
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Collection not found"
          description="This edit may have ended or moved."
          action={<Link to="/shop" className="btn-primary btn-md">Browse all</Link>}
        />
      </div>
    );
  }

  const showing = items.slice(0, visible);
  const hasMore = items.length > visible;
  const heroImg = wide(def.hero, 1800, 900);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: def.title,
    description: def.description,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
        { "@type": "ListItem", position: 2, name: "Collections", item: `${window.location.origin}/#/collections` },
        { "@type": "ListItem", position: 3, name: def.title },
      ],
    },
  };

  return (
    <>
      <Seo title={def.title} description={def.description} image={heroImg} path={`/collections/${def.id}`} schema={schema} />

      {/* Hero */}
      <section className="relative -mt-px overflow-hidden">
        <div className="relative">
          <img src={heroImg} alt={def.title} className="h-[44vh] min-h-[280px] w-full object-cover object-top" />
          <div className={`absolute inset-0 ${def.accent ? "bg-gradient-to-t from-ink via-ink/60 to-ink/20" : "bg-gradient-to-t from-canvas via-canvas/50 to-transparent"}`} />
          <div className="container-edge absolute inset-x-0 bottom-0 pb-10">
            <Reveal>
              <span className={`eyebrow mb-3 ${def.accent ? "text-canvas/70" : ""}`}>{def.eyebrow}</span>
              <h1 className={`text-display-l ${def.accent ? "text-canvas" : "text-ink"}`}>{def.title}</h1>
              <p className={`mt-3 max-w-xl text-pretty ${def.accent ? "text-canvas/70" : "text-muted"}`}>{def.description}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="container-edge py-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Collections", to: "/collections" }, { label: def.title }]} />
      </div>

      <section className="container-edge pb-24">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{items.length} {items.length === 1 ? "piece" : "pieces"}</p>
          <Link to="/shop" className="link-line text-sm font-medium text-accent">Shop all products</Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<PackageSearch className="h-6 w-6" />}
              title="Nothing here yet"
              description="Check back soon — we refresh this edit regularly."
              action={<Link to="/shop" className="btn-primary btn-md">Browse the full edit</Link>}
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {showing.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>

            {/* Load more pagination */}
            <div className="mt-14 flex flex-col items-center gap-4">
              {hasMore ? (
                <>
                  <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-outline btn-md">
                    Load more <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-muted">Showing {showing.length} of {items.length}</p>
                </>
              ) : (
                <p className="text-xs text-muted">You've seen all {items.length} pieces in this edit.</p>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
