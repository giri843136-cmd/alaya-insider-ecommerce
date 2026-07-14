import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Truck,
  RefreshCw,
  ShieldCheck,
  Minus,
  ChevronDown,
  Star,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Eye,
  Flame,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useCommerce } from "../context/CommerceContext";
import { useToast } from "../context/ToastContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";
import { ProductGallery } from "../components/product/ProductGallery";
import { ShippingCalculator } from "../components/product/ShippingCalculator";
import { QuestionsAndAnswers } from "../components/product/QuestionsAndAnswers";
import { FrequentlyBoughtTogether } from "../components/product/FrequentlyBoughtTogether";
import { StickyPurchaseBar } from "../components/product/StickyPurchaseBar";
import { ShareProduct } from "../components/product/ShareProduct";
import {
  Breadcrumbs,
  Price,
  QuantitySelector,
  Stars,
  EmptyState,
} from "../components/ui";
import {
  CompleteTheLook,
  LuxuryAlternatives,
  BudgetAlternatives,
  FrequentlyViewedTogetherWidget,
} from "../components/RecommendationWidgets";
import {
  AiProductSummary,
  AiBuyingAdvice,
  AiAlternatives,
  AiProductFAQ,
  AiBundleSuggestions,
} from "../components/AiProductInsights";
import { MultiMerchantOffers, ProductIntelligence } from "../components/MarketplaceSelector";
import { cn } from "@/utils/cn";
import { discountPercent, formatDate, hashToIndex, isEmail, uid } from "../lib/utils";
import type { Review } from "../lib/types";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getProduct, productsByCategory, productsByBrand, categories, updateProduct, settings } = useStore();
  const { addToCart, toggleWishlist, inWishlist, trackView, recentlyViewed } = useCommerce();
  const { toast } = useToast();

  const product = slug ? getProduct(slug) : undefined;

  useEffect(() => {
    if (product) {
      trackView(product.id);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [product, trackView]);

  const [qty, setQty] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string>("description");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [reviewFilter, setReviewFilter] = useState(0);

  const variantLabel = useMemo(() => {
    if (!product?.variants?.length) return "";
    return product.variants.map((v) => `${v.name}: ${selected[v.name] ?? v.options[0]}`).join(" · ");
  }, [product, selected]);

  const variantKey = useMemo(() => {
    if (!product?.variants?.length) return "";
    return product.variants.map((v) => selected[v.name] ?? v.options[0]).join(" | ");
  }, [product, selected]);

  if (!product) {
    return (
      <div className="container-edge py-24">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Product not found"
          description="This piece may have sold out or been moved."
          action={<Link to="/shop" className="btn-primary btn-md">Back to shop</Link>}
        />
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.category);
  const saved = inWishlist(product.id);
  const discount = discountPercent(product.price, product.salePrice);
  const soldOut = product.stock <= 0 && !product.affiliate;
  const related = productsByCategory(product.category).filter((p) => p.id !== product.id).slice(0, 4);
  const moreFromBrand = product.brandId ? productsByBrand(product.brandId).filter((p) => p.id !== product.id).slice(0, 4) : [];
  const frequentlyBought = [...related].sort(() => 0.5).slice(0, 3);
  const weightKg = product.type === "digital" ? 0 : 0.4 + hashToIndex(product.sku, 12) / 10;
  const viewers = 12 + hashToIndex(product.id + "v", 60);
  const soldToday = 3 + hashToIndex(product.id + "s", 14);

  const handleAdd = (buyNow = false) => {
    if (product.affiliate) return;
    addToCart(product.id, variantKey, variantLabel, qty, !buyNow);
    if (buyNow) navigate("/checkout");
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand || settings.storeName },
    category: category?.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      price: (product.salePrice ?? product.price).toFixed(2),
      priceCurrency: settings.currency.code,
      availability: product.affiliate || product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${window.location.origin}/#/product/${product.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${window.location.origin}/#/shop` },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${window.location.origin}/#/shop?category=${category.id}` }] : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: product.name },
    ],
  };

  return (
    <>
      <Seo
        title={product.name}
        description={product.shortDescription}
        image={product.images[0]}
        path={`/product/${product.slug}`}
        type="product"
        schema={[productSchema, breadcrumbSchema]}
      />

      <div className="container-edge py-8">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Shop", to: "/shop" },
            ...(category ? [{ label: category.name, to: `/shop?category=${category.id}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <section className="container-edge grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <ProductGallery product={product} />

        {/* Info */}
        <div className="lg:py-2">
          {product.brand && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.brand}</span>}
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              <Stars rating={product.rating} size={16} />
              <span className="font-medium text-ink">{product.rating.toFixed(1)}</span>
              <a href="#reviews" className="text-muted hover:text-accent">({product.reviewCount} reviews)</a>
            </span>
          </div>

          <div className="mt-5">
            <Price price={product.price} salePrice={product.salePrice} priceClassName="text-2xl" />
            {discount > 0 && <span className="ml-2 text-sm font-medium text-success">Save {discount}%</span>}
          </div>

          <p className="mt-5 text-pretty text-muted">{product.shortDescription}</p>

          {/* Variants */}
          {product.variants?.map((v) => (
            <div key={v.name} className="mt-6">
              <p className="mb-2 text-sm font-medium text-ink">
                {v.name}: <span className="text-muted">{selected[v.name] ?? v.options[0]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelected((s) => ({ ...s, [v.name]: opt }))}
                    className={cn(
                      "min-w-[2.75rem] rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                      (selected[v.name] ?? v.options[0]) === opt
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line text-ink hover:border-accent"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Stock */}
          <p className="mt-5 flex items-center gap-2 text-sm">
            {product.affiliate ? (
              <span className="text-accent">Curated via {product.affiliatePartner}</span>
            ) : soldOut ? (
              <span className="flex items-center gap-1.5 text-danger"><Minus className="h-4 w-4" /> Sold out</span>
            ) : product.type === "digital" ? (
              <span className="flex items-center gap-1.5 text-success"><Check className="h-4 w-4" /> Available instantly</span>
            ) : product.stock <= 8 ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><Sparkles className="h-4 w-4" /> Only {product.stock} left</span>
            ) : (
              <span className="flex items-center gap-1.5 text-success"><Check className="h-4 w-4" /> In stock</span>
            )}
          </p>

          {/* Social proof strip */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-accent" /> {viewers} viewing now</span>
            {!product.affiliate && product.type !== "digital" && (
              <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-danger" /> {soldToday} sold today</span>
            )}
            {product.bestSeller && <span className="badge bg-accent-soft text-accent">Best Seller</span>}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {!product.affiliate && !soldOut && (
              <QuantitySelector value={qty} onChange={setQty} max={product.type === "digital" ? 1 : Math.max(1, product.stock)} />
            )}
            {product.affiliate ? (
              <a href={product.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary btn-lg flex-1">
                Shop at {product.affiliatePartner} <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <button disabled={soldOut} onClick={() => handleAdd(false)} className="btn-primary btn-lg flex-1">
                <ShoppingBag className="h-4 w-4" />
                {soldOut ? "Sold out" : product.type === "digital" ? "Get it now" : "Add to bag"}
              </button>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={saved}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              className={cn("btn btn-lg border border-line text-ink hover:border-accent hover:text-accent", saved && "border-accent text-accent")}
            >
              <Heart className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>

          {!product.affiliate && !soldOut && (
            <button onClick={() => handleAdd(true)} className="btn-dark btn-lg mt-3 w-full">
              Buy it now <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {/* Meta */}
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 text-sm">
            <div><dt className="text-muted">SKU</dt><dd className="font-medium text-ink">{product.sku}</dd></div>
            <div><dt className="text-muted">Type</dt><dd className="font-medium text-ink capitalize">{product.type}</dd></div>
            {category && <div><dt className="text-muted">Collection</dt><dd className="font-medium text-ink">{category.name}</dd></div>}
            <div><dt className="text-muted">Tags</dt><dd className="font-medium text-ink">{product.tags.slice(0, 2).join(", ")}</dd></div>
          </dl>

          {/* Assurances */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Truck, label: "Free over $150" },
              { icon: RefreshCw, label: "30-day returns" },
              { icon: ShieldCheck, label: "Secure pay" },
            ].map((a) => (
              <div key={a.label} className="rounded-xl border border-line bg-surface p-3">
                <a.icon className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-1.5 text-xs text-muted">{a.label}</p>
              </div>
            ))}
          </div>

          {/* Shipping calculator */}
          <div className="mt-4">
            <ShippingCalculator price={product.salePrice ?? product.price} weightKg={weightKg} />
          </div>

          {/* Share */}
          <div className="mt-4">
            <ShareProduct title={product.name} />
          </div>

          {/* Multi-Merchant — Available at Amazon, Walmart, Target... */}
          <div className="mt-5">
            <MultiMerchantOffers product={product} limit={4} />
          </div>

          {/* Price Intelligence — history + alerts for ALL products (P1 restored) */}
          <div className="mt-5">
            <ProductIntelligence product={product} />
          </div>

          {/* AI Insights */}
          <div className="mt-6 space-y-4">
            <AiProductSummary product={product} />
            <AiBuyingAdvice product={product} />
          </div>
        </div>
      </section>

      {/* Accordion */}
      <section className="container-edge mt-16">
        <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
          <Accordion id="description" title="Description" open={openAccordion} setOpen={setOpenAccordion}>
            <p className="text-pretty text-muted">{product.description}</p>
          </Accordion>
          <Accordion id="details" title="Details & features" open={openAccordion} setOpen={setOpenAccordion}>
            <ul className="space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </Accordion>
          <Accordion id="shipping" title="Shipping & returns" open={openAccordion} setOpen={setOpenAccordion}>
            <p className="text-muted">
              Complimentary worldwide shipping on orders over {settings.currency.symbol}{settings.shipping.freeOver}. Standard delivery 3–6 business days. Digital guides are delivered instantly to your email. Return any physical item within 30 days for a full refund.
            </p>
          </Accordion>
          {product.specs && product.specs.length > 0 && (
            <Accordion id="specs" title="Specifications" open={openAccordion} setOpen={setOpenAccordion}>
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <tbody>
                    {product.specs.map((s, i) => (
                      <tr key={s.label} className={cn(i % 2 === 0 ? "bg-surface2/40" : "")}>
                        <th className="w-1/3 px-4 py-2.5 text-left font-medium text-muted">{s.label}</th>
                        <td className="px-4 py-2.5 text-ink">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion>
          )}
        </div>
      </section>

      {/* Frequently bought together */}
      {frequentlyBought.length > 0 && (
        <section className="container-edge mt-16">
          <FrequentlyBoughtTogether main={product} related={frequentlyBought} />
        </section>
      )}

      {/* Complete The Look */}
      {!product.affiliate && <CompleteTheLook product={product} />}

      {/* Luxury + Budget Alternatives */}
      {!product.affiliate && (
        <>
          <LuxuryAlternatives product={product} />
          <BudgetAlternatives product={product} />
        </>
      )}

      {/* Reviews */}
      <section id="reviews" className="container-edge mt-16 scroll-mt-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Customer reviews</h2>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={product.rating} size={18} />
                <span className="text-sm font-medium">{product.rating.toFixed(1)} · {product.reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {/* Rating breakdown + filter */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Filter:</span>
            {[0, 5, 4, 3].map((r) => (
              <button key={r} onClick={() => setReviewFilter(r)} className={cn("chip", reviewFilter === r && "chip-active")}>
                {r === 0 ? "All" : `${r}★ & up`}
              </button>
            ))}
          </div>

          <ul className="mt-6 space-y-4">
            {product.reviews
              .filter((r) => reviewFilter === 0 || r.rating >= reviewFilter)
              .map((r) => (
              <li key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{r.author.slice(0, 1)}</span>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {r.author}
                        {r.verified && <span className="badge bg-success/15 text-success">Verified</span>}
                      </p>
                      <Stars rating={r.rating} size={12} />
                    </div>
                  </div>
                  <time className="text-xs text-muted">{formatDate(r.date)}</time>
                </div>
                <p className="mt-3 font-medium text-ink">{r.title}</p>
                <p className="mt-1 text-sm text-muted">{r.body}</p>
              </li>
            ))}
          </ul>

          {/* AI FAQ */}
          <div className="mt-6">
            <AiProductFAQ product={product} />
          </div>

          {/* AI Bundle Suggestions */}
          {!product.affiliate && (
            <div className="mt-6">
              <AiBundleSuggestions product={product} />
            </div>
          )}

          <ReviewForm
            onSubmit={(review) => {
              const newCount = product.reviewCount + 1;
              const newRating = Math.round(((product.rating * product.reviewCount + review.rating) / newCount) * 10) / 10;
              updateProduct(product.id, {
                reviews: [review, ...product.reviews],
                reviewCount: newCount,
                rating: newRating,
              });
              toast.success("Review published", "Thank you for sharing your thoughts.");
            }}
          />
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-edge mt-20">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">You may also like</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {settings.features.recentlyViewed && (() => {
        const recent = recentlyViewed
          .filter((id) => id !== product.id)
          .map((id) => getProduct(id))
          .filter((p): p is NonNullable<typeof p> => !!p)
          .slice(0, 6);
        if (recent.length === 0) return null;
        return (
          <section className="container-edge mt-20">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Recently viewed</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {recent.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Frequently Viewed Together */}
      <FrequentlyViewedTogetherWidget product={product} />

      {/* AI Alternatives */}
      {!product.affiliate && (
        <section className="container-edge mt-16">
          <AiAlternatives product={product} />
        </section>
      )}

      {/* Questions & answers */}
      <section className="container-edge mt-20">
        <div className="mx-auto max-w-3xl">
          <QuestionsAndAnswers product={product} />
        </div>
      </section>

      {/* More from this brand */}
      {moreFromBrand.length > 0 && (
        <section className="container-edge mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">More from {product.brand || "this brand"}</h2>
            {product.brandId && <Link to={`/brands/${product.brandId}`} className="link-line text-sm font-medium text-accent">View brand</Link>}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {moreFromBrand.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile purchase bar */}
      <StickyPurchaseBar product={product} />
    </>
  );
}

function Accordion({
  id,
  title,
  open,
  setOpen,
  children,
}: {
  id: string;
  title: string;
  open: string;
  setOpen: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div>
      <button onClick={() => setOpen(isOpen ? "" : id)} aria-expanded={isOpen} className="flex w-full items-center justify-between py-5 text-left">
        <span className="text-lg font-semibold text-ink">{title}</span>
        <ChevronDown className={cn("h-5 w-5 text-muted transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div className="pb-6 animate-fade-in">{children}</div>}
    </div>
  );
}

function ReviewForm({ onSubmit }: { onSubmit: (r: Review) => void }) {
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hover, setHover] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (author.trim().length < 2) errs.author = "Please enter your name.";
    if (!isEmail(email)) errs.email = "Enter a valid email.";
    if (title.trim().length < 3) errs.title = "Add a short title.";
    if (body.trim().length < 10) errs.body = "Tell us a little more (10+ characters).";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSubmit({
      id: uid("rev"),
      author: author.trim(),
      rating,
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString(),
      verified: false,
    });
    setAuthor("");
    setEmail("");
    setTitle("");
    setBody("");
    setRating(5);
  };

  return (
    <form onSubmit={submit} noValidate className="card mt-8 p-6">
      <h3 className="text-lg font-semibold text-ink">Write a review</h3>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-muted">Your rating</span>
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} onMouseEnter={() => setHover(i + 1)} aria-label={`Rate ${i + 1} star${i ? "s" : ""}`} className="p-0.5">
              <Star className="h-5 w-5 text-accent" fill={i < (hover || rating) ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="rev-name">Name</label>
          <input id="rev-name" value={author} onChange={(e) => setAuthor(e.target.value)} className="input-field" />
          {errors.author && <p className="mt-1 text-xs text-danger">{errors.author}</p>}
        </div>
        <div>
          <label className="label-field" htmlFor="rev-email">Email</label>
          <input id="rev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
        </div>
      </div>
      <div className="mt-4">
        <label className="label-field" htmlFor="rev-title">Title</label>
        <input id="rev-title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
      </div>
      <div className="mt-4">
        <label className="label-field" htmlFor="rev-body">Review</label>
        <textarea id="rev-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="input-field resize-none" />
        {errors.body && <p className="mt-1 text-xs text-danger">{errors.body}</p>}
      </div>
      <button type="submit" className="btn-primary btn-md mt-5">Submit review</button>
    </form>
  );
}
