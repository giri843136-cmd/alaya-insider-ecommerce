import { Link, useParams } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";
import { Breadcrumbs, EmptyState } from "../components/ui";
import { wide } from "../lib/utils";

export default function BrandDetail() {
  const { slug } = useParams();
  const { getBrand, productsByBrand } = useStore();
  const brand = slug ? getBrand(slug) : undefined;

  if (!brand) {
    return (
      <div className="container-edge py-24">
        <EmptyState title="Brand not found" description="This brand may no longer be available." action={<Link to="/brands" className="btn-primary btn-md">All brands</Link>} />
      </div>
    );
  }

  const products = productsByBrand(brand.id);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: brand.description,
    logo: brand.image,
    image: brand.image,
  };

  return (
    <>
      <Seo title={brand.name} description={brand.description} image={brand.image} path={`/brands/${brand.slug}`} schema={schema} />

      {/* Hero */}
      <section className="relative -mt-px overflow-hidden">
        <div className="relative">
          <img src={wide(Number(brand.image.match(/photos\/(\d+)/)?.[1] ?? "8502484"), 1600, 900)} alt={brand.name} className="h-[46vh] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-transparent" />
          <div className="container-edge absolute inset-x-0 bottom-0 pb-10">
            <Reveal>
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted"><MapPin className="h-3.5 w-3.5" /> {brand.country}</p>
              <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-6xl text-balance">{brand.name}</h1>
              <p className="mt-3 max-w-xl text-pretty text-muted">{brand.description}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="container-edge py-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Brands", to: "/brands" }, { label: brand.name }]} />
      </div>

      <section className="container-edge pb-20">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{products.length} {products.length === 1 ? "product" : "products"}</p>
          <Link to="/shop" className="link-line text-sm font-medium text-accent">Shop all</Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="No products yet" description={`We're curating ${brand.name} pieces — check back soon.`} action={<Link to="/shop" className="btn-primary btn-md">Browse the edit <ArrowRight className="h-4 w-4" /></Link>} />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
