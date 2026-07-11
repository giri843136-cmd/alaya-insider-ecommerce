import { Link } from "react-router-dom";
import { History, ArrowRight } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { ProductCard } from "../components/ProductCard";
import { Breadcrumbs, EmptyState } from "../components/ui";

export default function RecentlyViewed() {
  const { recentlyViewed } = useCommerce();
  const { getProduct } = useStore();

  const items = recentlyViewed
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <>
      <Seo title="Recently viewed" path="/recently-viewed" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Recently viewed" }]} />
      </div>
      <section className="container-edge pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-2">Pick up where you left off</span>
            <h1 className="text-display-m text-ink">Recently viewed</h1>
          </div>
          {items.length > 0 && (
            <Link to="/shop" className="btn-outline btn-md">Continue browsing <ArrowRight className="h-4 w-4" /></Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title="Nothing here yet"
              description="As you browse, the pieces you view will appear here so you can easily return to them."
              action={<Link to="/shop" className="btn-primary btn-md">Start exploring</Link>}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
