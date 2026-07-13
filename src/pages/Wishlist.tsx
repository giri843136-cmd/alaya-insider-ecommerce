import { Link } from "react-router-dom";
import { Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { Seo } from "../components/Seo";
import { ProductCard } from "../components/ProductCard";
import { SectionHeading, Breadcrumbs, EmptyState } from "../components/ui";

export default function Wishlist() {
  const { wishlist, recentlyViewed, addToCart } = useCommerce();
  const { getProduct, settings } = useStore();
  const { toast } = useToast();

  const recent = recentlyViewed
    .filter((id) => !wishlist.includes(id))
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 4);

  const items = wishlist.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const addAll = () => {
    if (items.length === 0) return;
    items.forEach((p) => {
      if (!p.affiliate) addToCart(p.id, "", "", 1, false);
    });
    toast.success("Added to bag", `${items.length} saved item${items.length > 1 ? "s" : ""} added.`);
  };

  return (
    <>
      <Seo title="Wishlist" path="/wishlist" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]} />
      </div>
      <section className="container-edge pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-2">Saved for later</span>
            <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Your wishlist</h1>
          </div>
          {items.length > 0 && (
            <Link to="/shop" className="btn-outline btn-md">Continue browsing <ArrowRight className="h-4 w-4" /></Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No saved pieces yet"
              description="Tap the heart on any product to save it here for later."
              action={<Link to="/shop" className="btn-primary btn-md">Discover pieces <ArrowRight className="h-4 w-4" /></Link>}
            />
            {recent.length > 0 && (
              <div className="mt-12">
                <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
                <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
                  {recent.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted">{items.length} saved item{items.length > 1 ? "s" : ""}</p>
              <button onClick={addAll} className="btn-accent-soft btn-sm"><ShoppingBag className="h-4 w-4" /> Add all to bag</button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Recently viewed */}
      {settings.features.recentlyViewed && recent.length > 0 && (
        <section className="container-edge pb-24">
          <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
