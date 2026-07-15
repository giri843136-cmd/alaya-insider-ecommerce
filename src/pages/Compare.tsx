import { Link } from "react-router-dom";
import { Scale, X, ArrowRight, Check, Minus, ShoppingBag, Printer, Share2 } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { useCommerce } from "../context/CommerceContext";
import { Seo } from "../components/Seo";
import { Breadcrumbs, EmptyState, Price, Stars, Badge } from "../components/ui";
import { flags } from "../lib/featureFlags";

export default function Compare() {
  const { compare, addToCart, clearCompare, toggleCompare } = useCommerce();
  const { getProduct, categories } = useStore();
  const { toast } = useToast();
  const items = compare.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Product Comparison — ALAYA INSIDER",
    description: `Comparing ${items.length} products side by side`,
    about: items.map(p => ({ "@type": "Product", name: p.name, sku: p.sku })),
  };

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const exportCompare = async () => {
    const lines = items.map((p) => `${p.name} — ${p.brand || "ALAYA"} — $${(p.salePrice ?? p.price).toFixed(2)} — ${p.rating}★ (${p.reviewCount})`);
    const text = `ALAYA INSIDER — Comparison\n\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Comparison copied", "Paste it anywhere to share.");
    } catch {
      toast.error("Couldn't copy", "Try again in a moment.");
    }
  };
  const Bool = ({ ok }: { ok: boolean }) =>
    ok ? <Check className="mx-auto h-4 w-4 text-success" /> : <Minus className="mx-auto h-4 w-4 text-line" />;

  return (
    <>
      <Seo title="Compare" path="/compare" schema={schema} />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Compare" }]} />
      </div>

      <section className="container-edge pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-2">Side by side</span>
            <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Compare products</h1>
          </div>
          {items.length > 0 && (
            <div className="flex gap-2">
              <button onClick={exportCompare} className="btn-outline btn-sm"><Share2 className="h-4 w-4" /> Export</button>
              <button onClick={() => window.print()} className="btn-outline btn-sm"><Printer className="h-4 w-4" /> Print</button>
              <button onClick={clearCompare} className="btn-ghost btn-sm">Clear all</button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={<Scale className="h-6 w-6" />}
              title="Nothing to compare yet"
              description="Tap the compare icon on up to four products to see them side by side."
              action={<Link to="/shop" className="btn-primary btn-md">Browse the edit <ArrowRight className="h-4 w-4" /></Link>}
            />
          </div>
        ) : (
          <div className="card mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <tbody>
                {/* Product row */}
                <tr className="border-b border-line">
                  <th className="w-40 p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Product</th>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 align-top">
                      <div className="relative">
                        <button
                          onClick={() => toggleCompare(p.id)}
                          aria-label={`Remove ${p.name}`}
                          className="absolute -right-1 -top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-surface2 text-muted hover:text-danger"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Link to={`/product/${p.slug}`}>
                          <img src={p.images[0]} alt={p.name} className="aspect-[4/5] w-full rounded-xl object-cover" />
                        </Link>
                      </div>
                      <Link to={`/product/${p.slug}`} className="mt-3 block font-medium text-ink hover:text-accent">{p.name}</Link>
                      {p.brand && <span className="text-xs text-muted">{p.brand}</span>}
                    </td>
                  ))}
                </tr>

                <CompareRow label="Price">
                  {items.map((p) => <td key={p.id} className="p-4 text-center"><Price price={p.price} salePrice={p.salePrice} /></td>)}
                </CompareRow>

                <CompareRow label="Rating">
                  {items.map((p) => <td key={p.id} className="p-4 text-center"><div className="flex flex-col items-center gap-1"><Stars rating={p.rating} /><span className="text-xs text-muted">{p.rating.toFixed(1)} ({p.reviewCount})</span></div></td>)}
                </CompareRow>

                <CompareRow label="Type">
                  {items.map((p) => <td key={p.id} className="p-4 text-center capitalize text-muted">{p.type}</td>)}
                </CompareRow>

                <CompareRow label="Collection">
                  {items.map((p) => <td key={p.id} className="p-4 text-center text-muted">{catName(p.category)}</td>)}
                </CompareRow>

                <CompareRow label="In stock">
                  {items.map((p) => <td key={p.id} className="p-4 text-center">{p.affiliate ? <Badge variant="affiliate">Affiliate</Badge> : p.stock > 0 ? <span className="text-success">In stock</span> : <span className="text-danger">Sold out</span>}</td>)}
                </CompareRow>

                <CompareRow label="Featured">
                  {items.map((p) => <td key={p.id} className="p-4 text-center"><Bool ok={!!p.featured} /></td>)}
                </CompareRow>

                <CompareRow label="Key feature">
                  {items.map((p) => <td key={p.id} className="p-4 text-center text-muted">{p.features[0] ?? "—"}</td>)}
                </CompareRow>

                {/* Action row */}
                <tr>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted"></th>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 text-center">
                      {p.affiliate || !flags.ENABLE_ECOMMERCE ? (
                        <a href={p.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className={`btn-dark btn-sm w-full`}>See best price</a>
                      ) : (
                        <button disabled={p.stock <= 0} onClick={() => addToCart(p.id, "", "", 1, true)} className="btn-primary btn-sm w-full">
                          <ShoppingBag className="h-4 w-4" /> {p.stock <= 0 ? "Sold out" : "Add"}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-line">
      <th className="p-4 text-left align-top text-xs font-semibold uppercase tracking-wider text-muted">{label}</th>
      {children}
    </tr>
  );
}
