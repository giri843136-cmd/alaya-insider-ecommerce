import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Quote,
  Star,
  Check,
  Bot,
  BookOpen,
  Gem,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";
import { BrandCard } from "../components/BrandCard";
import { ArticleCard } from "../components/ArticleCard";
import { HorizontalScroller } from "../components/HorizontalScroller";
import { HeroSlider } from "../components/HeroSlider";
import { SafeImg } from "../components/SafeImg";
import { SectionHeading, Badge } from "../components/ui";
import { FlashDeals } from "../components/home/FlashDeals";
import { TrustSection } from "../components/home/TrustSection";
import { SocialProof } from "../components/home/SocialProof";
import { BUYING_GUIDES } from "../components/BuyingGuide";
import { wide, img, hashToIndex } from "../lib/utils";

const VALUE_PROPS = [
  { icon: Truck, title: "Worldwide shipping", text: "To 9 countries from top merchants" },
  { icon: ShieldCheck, title: "Editors' trust", text: "Every pick is research-driven" },
  { icon: RefreshCw, title: "30-day returns", text: "Merchant-backed, easy process" },
  { icon: Sparkles, title: "Price intelligence", text: "History, alerts & comparisons" },
];

const TESTIMONIALS = [
  { quote: "The most considered shopping experience I've used online. Every detail feels intentional.", name: "Eleanor V.", role: "London, UK", rating: 5 },
  { quote: "Beautiful curation and genuinely lovely products. My Atelier tote arrived immaculately packed.", name: "Priya M.", role: "Mumbai, IN", rating: 5 },
  { quote: "It feels like reading a magazine and shopping in one. I've replaced three other bookmarks.", name: "Sofia R.", role: "Milan, IT", rating: 4 },
];

export default function Home() {
  const { products, categories, brands, articles, settings, affiliates } = useStore();

  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 4), [products]);
  const bestSellers = useMemo(() => products.filter((p) => p.bestSeller).slice(0, 8), [products]);
  const newArrivals = useMemo(() => [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4), [products]);
  const affiliatePicks = useMemo(() => products.filter((p) => p.affiliate).slice(0, 3), [products]);
  const digital = useMemo(() => products.filter((p) => p.type === "digital").slice(0, 3), [products]);
  const featuredBrands = useMemo(() => brands.filter((b) => b.featured).slice(0, 6), [brands]);
  const latestArticles = useMemo(() => [...articles].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 3), [articles]);

  // AI-driven personalized recommendations
  const aiRecommended = useMemo(() => {
    // Mix of bestsellers and highest-rated products that are featured
    return [...products]
      .sort((a, b) => {
        // Score: rating * reviewCount gives popularity weight
        const scoreA = a.rating * Math.min(a.reviewCount, 100);
        const scoreB = b.rating * Math.min(b.reviewCount, 100);
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [products]);

  // Seasonal picks (based on tag matching for deterministic demo)
  const seasonalPicks = useMemo(() => {
    return products
      .filter((p) => p.tags.some((t) => ["summer", "warm", "light", "fresh", "natural"].includes(t.toLowerCase())))
      .slice(0, 4);
  }, [products]);

  // Active guide to feature on homepage (rotates deterministically)
  const featuredGuide = useMemo(() => {
    const idx = hashToIndex("home", BUYING_GUIDES.length);
    return BUYING_GUIDES[idx];
  }, []);

  // Builder-driven section visibility
  const sectionOn = (id: string) => settings.homeSections.find((s) => s.id === id)?.enabled ?? true;

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: settings.storeName,
    description: settings.description,
  };

  return (
    <>
      <Seo path="/" schema={homeSchema} />

      {/* SECTION 3 — Hero slider */}
      <HeroSlider slides={settings.heroSlides} />

      {/* Value props */}
      <div className="border-y border-line bg-surface/60 backdrop-blur-sm">
        <div className="container-edge grid grid-cols-2 gap-px lg:grid-cols-4">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="flex items-center gap-3 px-2 py-5 sm:px-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <v.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{v.title}</span>
                <span className="block truncate text-xs text-muted">{v.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — Categories */}
      {sectionOn("categories") && (
        <section className="container-edge py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Shop by category"
              title="Explore the collections"
              subtitle="Five considered worlds, each curated by our editors for everyday luxury."
              action={<Link to="/shop" className="btn-outline btn-md">View all <ArrowRight className="h-4 w-4" /></Link>}
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
                <Link to={`/shop?category=${c.id}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--radius-xl2)] bg-surface2">
                  <SafeImg src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/70">{c.tagline}</p>
                    <p className="mt-0.5 font-display text-lg font-semibold text-white">{c.name}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 6 — Flash Deals */}
      {sectionOn("flash") && <FlashDeals products={products} />}

      {/* SECTION 5 — Promotional banner */}
      {sectionOn("promobanner") && (
        <section className="container-edge py-20">
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <Link to="/collections/luxury" className="group relative block overflow-hidden rounded-[var(--radius-xl3)] bg-surface2">
                <img src={wide(30541170, 1000, 700)} alt="Luxury Collection" loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <span className="eyebrow text-white/70">The Luxury Collection</span>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Future heirlooms, today</h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white">Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative flex h-full min-h-[16rem] flex-col justify-between overflow-hidden rounded-[var(--radius-xl3)] bg-ink p-8 text-canvas">
                <div className="absolute inset-0 bg-luxe opacity-70" />
                <div className="relative">
                  <span className="eyebrow text-canvas/70">First order</span>
                  <h3 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">10% off with WELCOME10</h3>
                  <p className="mt-2 max-w-xs text-canvas/70">Join the Insider list for early access, private sales and an instant welcome offer.</p>
                </div>
                <div className="relative mt-6">
                  <Link to="/shop" className="btn-primary btn-md">Shop now <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* SECTION 7 — Featured / Editor's Choice */}
      {sectionOn("featured") && (
        <section className="border-y border-line bg-surface2/40 py-20">
          <div className="container-edge">
            <Reveal>
              <SectionHeading
                eyebrow="The featured edit"
                title="Pieces our editors love"
                action={<Link to="/collections/editors" className="link-line text-sm font-medium text-accent">View all</Link>}
              />
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendations — Personalized picks */}
      {sectionOn("ai") !== false && (
        <section className="container-edge py-20">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent animate-floaty">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <SectionHeading
                  eyebrow="AI curated"
                  title="Recommended for you"
                />
              </div>
            </div>
            <p className="-mt-4 mb-8 max-w-xl text-sm text-muted">
              Personalised picks based on popularity, ratings and editorial team selection.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <HorizontalScroller>
              {aiRecommended.map((p) => (
                <div key={p.id} className="w-64 shrink-0 snap-start"><ProductCard product={p} /></div>
              ))}
            </HorizontalScroller>
          </Reveal>
        </section>
      )}

      {/* Buying Guide Feature */}
      {sectionOn("guide") !== false && (
        <section className="border-y border-line bg-surface2/40 py-20">
          <div className="container-edge">
            <Reveal>
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="relative overflow-hidden rounded-[var(--radius-xl3)]">
                  <img
                    src={featuredGuide.hero}
                    alt={featuredGuide.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="badge bg-accent text-accent-ink">
                      <BookOpen className="h-3.5 w-3.5" /> Buying Guide
                    </span>
                  </div>
                </div>
                <div>
                  <span className="eyebrow mb-3">Editorial guide</span>
                  <h2 className="text-display-m text-ink">{featuredGuide.title}</h2>
                  <p className="mt-4 text-muted">{featuredGuide.subtitle}</p>
                  <div className="mt-6 space-y-3">
                    {featuredGuide.sections.slice(0, 2).map((s) => (
                      <div key={s.title} className="flex items-start gap-3">
                        <Gem className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <div>
                          <p className="text-sm font-medium text-ink">{s.title}</p>
                          <p className="text-xs text-muted line-clamp-2">{s.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/journal/${featuredGuide.id}`}
                    className="btn-outline btn-md mt-6"
                  >
                    Read full guide <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* SECTION 8/9 — Editorial story */}
      {sectionOn("story") && (
        <section className="container-edge py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative">
                <img src={wide(33464930, 1000, 1100)} alt="The ALAYA INSIDER edit" loading="lazy" className="aspect-[4/5] w-full rounded-[var(--radius-xl3)] object-cover" />
                <div className="absolute -bottom-6 -right-4 hidden rounded-[var(--radius-xl2)] border border-line bg-surface p-5 shadow-[var(--shadow-float)] sm:block">
                  <p className="font-display text-3xl font-semibold text-accent">12k+</p>
                  <p className="text-xs text-muted">Insiders worldwide</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <span className="eyebrow mb-4">Why ALAYA recommends</span>
                <h2 className="text-display-l text-ink text-balance">We don't sell everything — only what's worth your shelf.</h2>
                <p className="mt-5 text-pretty text-muted">Every product is researched, tested and styled by our editors before it earns a place here. Curation is the point.</p>
                <ul className="mt-6 space-y-3">
                  {["Hand-picked by a global editorial team", "Transparent pricing & affiliate partnerships", "Sustainable packaging on every order"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-sm text-ink">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-soft text-accent"><Check className="h-3 w-3" /></span>{t}
                    </li>
                  ))}
                </ul>
                <Link to="/about" className="btn-primary btn-md mt-8">Read our philosophy <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* SECTION 10 — Best sellers */}
      {sectionOn("bestsellers") && (
        <section className="container-edge pb-20">
          <Reveal>
            <SectionHeading
              eyebrow="Loved by thousands"
              title="This season's bestsellers"
              action={<Link to="/collections/bestsellers" className="link-line text-sm font-medium text-accent">See more</Link>}
            />
          </Reveal>
          <Reveal delay={80}>
            <HorizontalScroller className="mt-10">
              {bestSellers.map((p) => (
                <div key={p.id} className="w-64 shrink-0 snap-start"><ProductCard product={p} /></div>
              ))}
            </HorizontalScroller>
          </Reveal>
        </section>
      )}

      {/* SECTION 11 — Brands + 13 Affiliate + Digital */}
      {sectionOn("brands") || sectionOn("affiliate") ? (
        <section className="border-y border-line bg-surface2/40 py-20">
          <div className="container-edge grid gap-12 lg:grid-cols-2 lg:gap-16">
            {sectionOn("brands") && featuredBrands.length > 0 && (
              <Reveal>
                <span className="eyebrow mb-4">The houses we love</span>
                <h2 className="text-display-m text-ink">Shop by brand</h2>
                <p className="mt-4 text-muted">Makers chosen for craft, integrity and enduring design.</p>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {featuredBrands.slice(0, 6).map((b) => (
                    <div key={b.id} className="aspect-[3/4]"><BrandCard brand={b} /></div>
                  ))}
                </div>
                <Link to="/brands" className="btn-outline btn-md mt-6">All brands <ArrowRight className="h-4 w-4" /></Link>
              </Reveal>
            )}

            {sectionOn("affiliate") && settings.features.affiliate && (
              <Reveal delay={120}>
                <span className="eyebrow mb-4">Curated from partners</span>
                <h2 className="text-display-m text-ink">Editor's affiliate picks</h2>
                <p className="mt-4 text-muted">Treasures we love from the world's finest retailers. As an affiliate, we may earn a commission — at no cost to you.</p>
                <div className="mt-6 space-y-4">
                  {affiliatePicks.map((p) => (
                    <a key={p.id} href={p.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer sponsored" className="group flex items-center gap-4 rounded-[var(--radius-xl2)] border border-line bg-surface p-3 transition-all hover:shadow-[var(--shadow-card)]">
                      <SafeImg src={p.images[0]} alt={p.name} loading="lazy" className="h-20 w-16 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><Badge variant="affiliate">Affiliate</Badge><span className="text-xs text-muted">{p.affiliatePartner}</span></div>
                        <p className="mt-1 truncate font-medium text-ink">{p.name}</p>
                        <p className="text-sm text-muted">From <span className="font-semibold text-ink">{settings.currency.symbol}{Math.round(p.price)}</span></p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </a>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </section>
      ) : null}

      {/* SECTION 12 — Digital */}
      <section className="container-edge py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-xl3)] bg-ink p-8 text-canvas sm:p-12">
            <div className="absolute inset-0 bg-luxe opacity-60" />
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="eyebrow mb-4 text-canvas/70">Digital Guides</span>
                <h3 className="text-display-m text-balance">Style intelligence, instantly downloadable.</h3>
                <p className="mt-4 max-w-sm text-canvas/70">Capsule wardrobes, colour masterclasses and packing guides — curated workbooks you'll actually use.</p>
                <Link to="/collections/digital" className="btn-primary btn-md mt-6">Browse digital guides <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid gap-3">
                {digital.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                    <SafeImg src={p.images[0]} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="text-xs text-canvas/60">From {settings.currency.symbol}{Math.round(p.price)}</span></span>
                    <ArrowRight className="h-4 w-4 text-canvas/60 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* New arrivals */}
      {sectionOn("new") && (
        <section className="container-edge pb-20">
          <Reveal>
            <SectionHeading eyebrow="Just landed" title="New arrivals" action={<Link to="/collections/new" className="link-line text-sm font-medium text-accent">View all</Link>} />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {newArrivals.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Partners */}
      {affiliates.filter((a) => a.active).length > 0 && (
        <section className="container-edge pb-20">
          <Reveal>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted">Trusted partners & affiliate retailers</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {affiliates.filter((a) => a.active).map((a) => (
                <span key={a.id} className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold tracking-wide text-ink">{a.name}</span>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* SECTION 15 — Reviews */}
      {sectionOn("reviews") && (
        <section className="border-t border-line bg-surface2/40 py-20">
          <div className="container-edge">
            <Reveal><SectionHeading align="center" eyebrow="What Insiders say" title="Loved in 9 countries" /></Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 90}>
                  <figure className="card flex h-full flex-col p-7">
                    <div className="flex items-center justify-between">
                      <Quote className="h-7 w-7 text-accent" />
                      <div className="flex">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`h-4 w-4 ${s < t.rating ? "fill-accent text-accent" : "text-line"}`} strokeWidth={0} />)}</div>
                    </div>
                    <blockquote className="mt-4 flex-1 text-pretty text-ink">{t.quote}</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{t.name.slice(0, 1)}</span>
                      <span><span className="block font-semibold text-ink">{t.name}</span><span className="text-sm text-muted">{t.role}</span></span>
                      <span className="ml-auto badge bg-success/15 text-success">Verified</span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 17 — Journal */}
      {sectionOn("journal") && settings.features.journal && latestArticles.length > 0 && (
        <section className="container-edge py-20">
          <Reveal>
            <SectionHeading eyebrow="From the Journal" title="Stories & guides" action={<Link to="/journal" className="link-line text-sm font-medium text-accent">View all</Link>} />
          </Reveal>
          <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-3">
            {latestArticles.map((a, i) => (
              <Reveal key={a.id} delay={i * 70}><ArticleCard article={a} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 18 — Seasonal Picks */}
      {sectionOn("seasonal") !== false && seasonalPicks.length > 0 && (
        <section className="container-edge py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Seasonal edit"
              title="Warm weather essentials"
              subtitle="Light, breathable, effortlessly styled — pieces that carry you through sunlit days."
              action={<Link to="/collections/new" className="link-line text-sm font-medium text-accent">View seasonal edit</Link>}
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {seasonalPicks.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 18 — Social proof */}
      {sectionOn("social") && <SocialProof />}

      {/* SECTION 19 — Trust */}
      {sectionOn("trust") && <TrustSection />}

      {/* SECTION 20 — CTA */}
      {sectionOn("cta") && (
        <section className="container-edge py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-[var(--radius-xl3)] bg-ink p-10 text-center text-canvas sm:p-16">
              <img src={img(17775855, 1600, 700)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-display-l text-balance">Begin your edit.</h2>
                <p className="mx-auto mt-4 max-w-md text-canvas/70">Join the Insider list for private sales, early access and 10% off your first order.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Link to="/shop" className="btn-primary btn-lg">Start shopping</Link>
                  <Link to="/about" className="btn btn-lg border border-white/20 text-canvas hover:bg-white/10">Learn more</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
