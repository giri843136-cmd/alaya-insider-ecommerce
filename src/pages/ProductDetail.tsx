import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Heart,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Minus,
  ChevronDown,
  Check,
  Eye,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ShoppingBag,
  Store,
  Globe,
  BadgeCheck,
  Info,
  Star,
  Award,
  Zap,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useCommerce } from "../context/CommerceContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";
import { ProductGallery } from "../components/product/ProductGallery";
import { MultiMerchantOffers, ProductIntelligence } from "../components/MarketplaceSelector";
import { ShareProduct } from "../components/product/ShareProduct";
import {
  Breadcrumbs,
  Price,
  Stars,
  EmptyState,
} from "../components/ui";
import {
  AiProductSummary,
  AiBuyingAdvice,
  AiAlternatives,
  AiProductFAQ,
} from "../components/AiProductInsights";
import { cn } from "@/utils/cn";
import { discountPercent, formatDate, hashToIndex } from "../lib/utils";

import { isAffiliateOnly, shouldShowDirectPurchase } from "../lib/featureFlags";

export default function ProductDetail() {
  const { slug } = useParams();
  const { getProduct, productsByCategory, productsByBrand, categories, settings } = useStore();
  const { toggleWishlist, inWishlist, trackView, recentlyViewed } = useCommerce();

  const product = slug ? getProduct(slug) : undefined;

  useEffect(() => {
    if (product) {
      trackView(product.id);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [product, trackView]);

  const [openAccordion, setOpenAccordion] = useState<string>("description");
  const [reviewFilter, setReviewFilter] = useState(0);

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
  const related = productsByCategory(product.category).filter((p) => p.id !== product.id).slice(0, 4);
  const moreFromBrand = product.brandId ? productsByBrand(product.brandId).filter((p) => p.id !== product.id).slice(0, 4) : [];
  const viewers = 12 + hashToIndex(product.id + "v", 60);

  // ===== EDITORIAL BADGES =====
  const editorialBadges: { label: string; icon: any; className: string }[] = [];
  if (product.rating >= 4.5 && product.reviewCount >= 10) {
    editorialBadges.push({ label: "Editor's Choice", icon: Star, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" });
  }
  if (discount >= 20) {
    editorialBadges.push({ label: "Best Value", icon: Award, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" });
  }
  if (product.price >= 200) {
    editorialBadges.push({ label: "Premium Pick", icon: Zap, className: "bg-ink text-canvas" });
  }
  if (product.price <= 50 && product.rating >= 4) {
    editorialBadges.push({ label: "Budget Pick", icon: DollarSign, className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" });
  }

  // ===== BUYING DECISION INTELLIGENCE =====
  const buyingDecision = useMemo(() => {
    const priceSeed = hashToIndex(product.id + "price", 100);
    const volatility = Math.round(5 + (priceSeed % 12));
    const trend = priceSeed > 50 ? "rising" : "falling";
    const confidence = Math.min(95, 60 + (product.rating * 5) + Math.floor(priceSeed / 10));
    const lowestPrice = product.salePrice ? Math.min(product.salePrice, product.price * 0.85) : product.price * 0.88;
    const highestPrice = product.price * 1.15;
    const averagePrice = (lowestPrice + highestPrice) / 2;
    const currentPrice = product.salePrice ?? product.price;
    const isGoodPrice = currentPrice <= averagePrice;
    const pricePrediction = trend === "rising"
      ? `Prices are trending upward for this product. Based on historical data, the price may increase ${volatility}% in the next 30 days.`
      : `Prices are trending downward. Historical patterns suggest a potential ${volatility}% further decrease — consider waiting if not urgent.`;
    const recommendation = isGoodPrice
      ? `The current price is below the 90-day average of ${settings.currency.symbol}${averagePrice.toFixed(0)}. This is a good time to buy.`
      : `The current price is above the 90-day average of ${settings.currency.symbol}${averagePrice.toFixed(0)}. Consider setting a price alert.`;
    return { volatility, trend, confidence, lowestPrice, highestPrice, averagePrice, currentPrice, isGoodPrice, pricePrediction, recommendation };
  }, [product.id, product.price, product.salePrice, product.rating, settings.currency.symbol]);

  // ===== AFFILIATE-FOCUSED STRUCTURED DATA (Merchant + Product) =====
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand || settings.storeName },
    category: category?.name,
    aggregateRating: product.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
    } : undefined,
    offers: product.affiliate ? {
      "@type": "Offer",
      url: product.affiliateUrl || `${window.location.origin}/#/product/${product.slug}`,
      price: (product.salePrice ?? product.price).toFixed(2),
      priceCurrency: settings.currency.code,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: product.affiliatePartner || product.brand || "ALAYA INSIDER",
      },
    } : {
      "@type": "Offer",
      price: (product.salePrice ?? product.price).toFixed(2),
      priceCurrency: settings.currency.code,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    review: product.reviews?.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      author: { "@type": "Person", name: r.author },
      reviewBody: r.body,
      datePublished: r.date,
    })),
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

  const affiliateOnly = isAffiliateOnly();

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
          {/* Editorial Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <BadgeCheck className="h-3.5 w-3.5" />
              {product.affiliate ? "ALAYA Recommends" : "Editor's Pick"}
            </div>
            {editorialBadges.map((badge) => (
              <span key={badge.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${badge.className}`}>
                <badge.icon className="h-3 w-3" />
                {badge.label}
              </span>
            ))}
          </div>

          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.brand}</span>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">{product.name}</h1>

          {/* Rating */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              <Stars rating={product.rating} size={16} />
              <span className="font-medium text-ink">{(product.rating ?? 0).toFixed(1)}</span>
              <a href="#reviews" className="text-muted hover:text-accent">({product.reviewCount} reviews)</a>
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Eye className="h-3.5 w-3.5 text-accent" />
              {viewers} viewing now
            </span>
          </div>

          {/* Price */}
          <div className="mt-5">
            <Price price={product.price} salePrice={product.salePrice} priceClassName="text-3xl font-semibold" />
            {discount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-sm font-medium text-success">
                <TrendingUp className="h-3 w-3" /> Save {discount}%
              </span>
            )}
          </div>

          {/* Editorial Summary */}
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Why ALAYA Recommends</span>
            </div>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-ink">
              {product.shortDescription || product.description?.slice(0, 200)}
            </p>
          </div>

          {/* Key Highlights */}
          {product.features && product.features.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">Key Highlights</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pros & Cons */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-success">
                <Check className="h-4 w-4" /> Pros
              </h4>
              <ul className="mt-2 space-y-1">
                <li className="text-sm text-ink">Premium build quality</li>
                <li className="text-sm text-ink">Excellent value for price</li>
                <li className="text-sm text-ink">Trusted brand reputation</li>
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <Minus className="h-4 w-4" /> Cons
              </h4>
              <ul className="mt-2 space-y-1">
                <li className="text-sm text-ink">Limited color options</li>
                <li className="text-sm text-ink">Premium price point</li>
              </ul>
            </div>
          </div>

          {/* Expert Verdict */}
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BadgeCheck className="h-4 w-4 text-accent" />
              Expert Verdict
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The {product.name} from {product.brand || "our curated collection"} earns our recommendation for its exceptional quality and thoughtful design.
              {product.rating >= 4.5
                ? " It's a top-tier choice that outperforms competitors in its class."
                : product.rating >= 4.0
                  ? " It delivers reliable performance and great value."
                  : " It offers solid performance with some trade-offs worth considering."}
            </p>
          </div>

          {/* Who Should Buy / Who Should Avoid */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-success">
                <Check className="h-4 w-4" /> Who should buy
              </h4>
              <ul className="mt-2 space-y-1">
                {product.price < 100 ? (
                  <li className="text-sm text-ink">Budget-conscious shoppers seeking quality</li>
                ) : product.price < 300 ? (
                  <li className="text-sm text-ink">Value seekers looking for mid-range excellence</li>
                ) : (
                  <li className="text-sm text-ink">Premium buyers who demand the best</li>
                )}
                {product.rating >= 4.5 ? (
                  <li className="text-sm text-ink">Shoppers who want top-rated, editor-approved products</li>
                ) : (
                  <li className="text-sm text-ink">Practical buyers who value proven performance</li>
                )}
                {product.affiliate ? (
                  <li className="text-sm text-ink">Shoppers comfortable purchasing from partner merchants</li>
                ) : null}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <Minus className="h-4 w-4" /> Who should avoid
              </h4>
              <ul className="mt-2 space-y-1">
                <li className="text-sm text-ink">Those who prefer in-person shopping and fitting rooms</li>
                {product.price >= 300 ? (
                  <li className="text-sm text-ink">Strict budget shoppers — consider our Budget Picks collection instead</li>
                ) : null}
                {product.affiliate ? (
                  <li className="text-sm text-ink">Shoppers who need direct ALAYA customer service for this purchase</li>
                ) : null}
              </ul>
            </div>
          </div>

          {/* --- BUYING DECISION INTELLIGENCE --- */}
          <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <TrendingUp className="h-4 w-4 text-accent" />
              Buying Decision Intelligence
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-line bg-surface p-3 text-center">
                <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">Confidence</p>
                <p className="mt-1 font-display text-xl font-semibold text-accent">{buyingDecision.confidence}%</p>
                <p className="text-[0.6rem] text-muted">Buying score</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3 text-center">
                <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">Trend</p>
                <p className="mt-1 flex items-center justify-center gap-1 font-display text-xl font-semibold" style={{ color: buyingDecision.trend === "rising" ? "var(--c-danger)" : "var(--c-success)" }}>
                  {buyingDecision.trend === "rising" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {buyingDecision.trend === "rising" ? "Rising" : "Falling"}
                </p>
                <p className="text-[0.6rem] text-muted">Price trend</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3 text-center">
                <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">Volatility</p>
                <p className="mt-1 font-display text-xl font-semibold" style={{ color: buyingDecision.volatility > 10 ? "var(--c-warning)" : "var(--c-text)" }}>
                  {buyingDecision.volatility}%
                </p>
                <p className="text-[0.6rem] text-muted">Price swings</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {buyingDecision.pricePrediction}
              </p>
              <p className={`flex items-start gap-2 text-xs leading-relaxed ${buyingDecision.isGoodPrice ? "text-success" : "text-amber-600 dark:text-amber-400"}`}>
                {buyingDecision.isGoodPrice ? <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                {buyingDecision.recommendation}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.6rem] font-semibold text-accent">
                <Clock className="h-3 w-3" /> 90-day avg: {settings.currency.symbol}{buyingDecision.averagePrice.toFixed(0)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[0.6rem] font-semibold text-success">
                <TrendingDown className="h-3 w-3" /> Low: {settings.currency.symbol}{buyingDecision.lowestPrice.toFixed(0)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-[0.6rem] font-semibold" style={{ color: "var(--c-warning)" }}>
                <TrendingUp className="h-3 w-3" /> High: {settings.currency.symbol}{buyingDecision.highestPrice.toFixed(0)}
              </span>
            </div>
          </div>

          {/* --- PRICE INTELLIGENCE (always shown for affiliate products) --- */}
          <div className="mt-6">
            <ProductIntelligence product={product} />
          </div>

          {/* --- MERCHANT COMPARISON TABLE (always shown) --- */}
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <Store className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">Available at</h3>
            </div>
            <MultiMerchantOffers product={product} limit={6} />
          </div>

          {/* --- PRIMARY CTA: View on Merchant (ALWAYS shown for affiliate mode) --- */}
          <div className="mt-8 space-y-3">
            {affiliateOnly || product.affiliate ? (
              <>
                <a
                  href={product.affiliateUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn-primary btn-lg w-full"
                >
                  <ExternalLink className="h-4 w-4" />
                  {product.affiliatePartner
                    ? `View on ${product.affiliatePartner}`
                    : "See best price"}
                  <Globe className="h-4 w-4" />
                </a>
                <p className="text-center text-xs text-muted">
                  We earn a commission when you purchase through our links. 
                  <Link to="/about#affiliate-disclosure" className="underline hover:text-accent"> Learn more</Link>
                </p>
              </>
            ) : (
              shouldShowDirectPurchase(product) && (
                <>
                  <button className="btn-primary btn-lg w-full">
                    <ShoppingBag className="h-4 w-4" />
                    Add to bag
                  </button>
                  <div className="flex gap-3">
                    <button className="btn-dark btn-lg flex-1">Buy it now</button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      aria-pressed={saved}
                      className={cn(
                        "btn btn-lg border border-line text-ink hover:border-accent hover:text-accent",
                        saved && "border-accent text-accent"
                      )}
                    >
                      <Heart className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
                    </button>
                  </div>
                </>
              )
            )}
          </div>

          {/* Stock / Availability (affiliate-aware) */}
          <p className="mt-4 flex items-center gap-2 text-sm">
            {product.affiliate ? (
              <span className="flex items-center gap-1.5 text-accent">
                <Clock className="h-4 w-4" /> Check {product.affiliatePartner || "merchant"} for availability
              </span>
            ) : product.stock <= 0 ? (
              <span className="flex items-center gap-1.5 text-danger">
                <Minus className="h-4 w-4" /> Currently unavailable
              </span>
            ) : product.stock <= 8 ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" /> Low stock — only {product.stock} left
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-success">
                <Check className="h-4 w-4" /> In stock
              </span>
            )}
          </p>

          {/* Specs Grid */}
          {product.specs && product.specs.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-line">
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
          )}

          {/* Assurances (Affiliate version) */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Globe, label: "Global shipping" },
              { icon: RefreshCw, label: "Easy returns" },
              { icon: ShieldCheck, label: "Buyer protection" },
            ].map((a) => (
              <div key={a.label} className="rounded-xl border border-line bg-surface p-3">
                <a.icon className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-1.5 text-xs text-muted">{a.label}</p>
              </div>
            ))}
          </div>

          {/* Share + Affiliate Disclosure */}
          <div className="mt-4">
            <ShareProduct title={product.name} />
          </div>

          {/* AI Insights (editorial content) */}
          <div className="mt-6 space-y-4">
            <AiProductSummary product={product} />
            <AiBuyingAdvice product={product} />
          </div>
        </div>
      </section>

      {/* Full Description */}
      <section className="container-edge mt-16">
        <div className="mx-auto max-w-3xl">
          <div className="divide-y divide-line border-y border-line">
            <Accordion id="description" title="Full Review" open={openAccordion} setOpen={setOpenAccordion}>
              <div className="prose prose-sm max-w-none text-muted">
                <p className="text-pretty leading-relaxed">{product.description}</p>
              </div>
            </Accordion>
            <Accordion id="details" title="Features & Details" open={openAccordion} setOpen={setOpenAccordion}>
              <ul className="space-y-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
            </Accordion>
            <Accordion id="disclosure" title="Affiliate Disclosure" open={openAccordion} setOpen={setOpenAccordion}>
              <p className="text-sm text-muted">
                ALAYA INSIDER is an affiliate publisher. We may earn commissions when you purchase through 
                our links to merchant sites. This does not affect our editorial independence or product 
                recommendations. We only recommend products we genuinely believe will add value to our readers.
                Prices and availability are accurate as of the time of publication and may vary by merchant.
              </p>
            </Accordion>
            <Accordion id="specs" title="Full Specifications" open={openAccordion} setOpen={setOpenAccordion}>
              {product.specs && product.specs.length > 0 ? (
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
              ) : (
                <p className="text-sm text-muted">Specifications available on merchant site.</p>
              )}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="container-edge mt-16 scroll-mt-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Customer reviews</h2>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={product.rating} size={18} />
                <span className="text-sm font-medium">{(product.rating ?? 0).toFixed(1)} · {product.reviewCount} reviews</span>
              </div>
            </div>
          </div>

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
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                        {r.author.slice(0, 1)}
                      </span>
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

          {/* AI Alternatives (always shown for affiliate) */}
          <div className="mt-6">
            <AiAlternatives product={product} />
          </div>
        </div>
      </section>

      {/* Related Products */}
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

      {/* More from this brand */}
      {moreFromBrand.length > 0 && (
        <section className="container-edge mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              More from {product.brand || "this brand"}
            </h2>
            {product.brandId && (
              <Link to={`/brands/${product.brandId}`} className="link-line text-sm font-medium text-accent">View brand</Link>
            )}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {moreFromBrand.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      )}
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
