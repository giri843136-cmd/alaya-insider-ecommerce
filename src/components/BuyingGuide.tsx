import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./ui";
import { ProductCard } from "./ProductCard";
import { useMemo } from "react";
import type { Product } from "../lib/types";

interface GuideSection {
  title: string;
  body: string;
  image?: string;
}

interface BuyingGuideProps {
  title: string;
  subtitle: string;
  hero: string;
  sections: GuideSection[];
  products: Product[];
  slug?: string;
}

export function BuyingGuide({ title, subtitle, hero, sections, products, slug }: BuyingGuideProps) {
  return (
    <section className="container-edge py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[var(--radius-xl3)] bg-ink mb-12">
          <img
            src={hero}
            alt={title}
            className="aspect-[21/9] w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
            <span className="eyebrow mb-3 text-canvas/70">Buying Guide</span>
            <h2 className="text-display-m text-canvas">{title}</h2>
            <p className="mt-2 max-w-xl text-canvas/70">{subtitle}</p>
            {slug && (
              <Link to={slug} className="btn-outline btn-md mt-5 inline-flex border-white/20 text-canvas hover:bg-white/10 hover:text-canvas">
                Read the full guide <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      {/* Editorial sections */}
      <div className="mx-auto max-w-3xl space-y-12">
        {sections.map((section, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className={i % 2 === 1 ? "sm:pl-8 border-l-2 border-accent/20" : ""}>
              <h3 className="font-display text-xl font-semibold text-ink sm:text-2xl">{section.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{section.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Curated product picks */}
      {products.length > 0 && (
        <div className="mt-16">
          <Reveal>
            <SectionHeading
              eyebrow="Editor's picks"
              title="Curated for you"
              action={
                <Link to="/shop" className="link-line text-sm font-medium text-accent">
                  Shop all <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {products.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* Key checklist */}
      <Reveal>
        <div className="mt-16 rounded-[var(--radius-xl2)] border border-line bg-surface2/40 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <BookOpen className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold text-ink">What to look for</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Quality of materials and craftsmanship",
              "Versatility — how it fits your existing wardrobe",
              "Longevity — timeless design over trends",
              "Ethical production and sustainability",
              "Value per wear, not just price point",
              "Care requirements and durability",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <div className="mt-12 text-center">
          <Link to="/shop" className="btn-primary btn-lg">
            Browse the full edit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/** Pre-built buying guides data */
export const BUYING_GUIDES = [
  {
    id: "capsule-wardrobe",
    title: "The Capsule Wardrobe Guide",
    subtitle: "How to build a timeless collection of essential pieces that work together, season after season.",
    hero: "https://images.pexels.com/photos/994234/pexels-photo-994234.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1800&h=800",
    sections: [
      {
        title: "Start with the foundation",
        body: "A capsule wardrobe begins with exceptional basics — pieces so well-crafted they become the backbone of every outfit. Think a perfectly draped cashmere sweater, tailored trousers that move with you, and a white shirt that feels as good as it looks.",
      },
      {
        title: "Choose a considered palette",
        body: "The most functional capsules are built around a cohesive colour story. Neutrals — ivory, oat, charcoal, navy — layer effortlessly, while one or two accent pieces add personality without clutter.",
      },
      {
        title: "Invest in the layers",
        body: "Transitional layers extend the life of your wardrobe. A lightweight wool coat, a silk shell, and a linen blazer can carry you from morning meetings to evening dinners across three seasons.",
      },
      {
        title: "Edit, don't accumulate",
        body: "The goal is fewer pieces, each earning its place. Before adding something new, ask: does it work with at least three existing items? If not, it doesn't belong in your capsule.",
      },
    ],
  },
  {
    id: "jewellery-care",
    title: "The Fine Jewellery Guide",
    subtitle: "Everything you need to know about choosing, wearing and caring for fine jewellery that lasts.",
    hero: "https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1800&h=800",
    sections: [
      {
        title: "Understanding materials",
        body: "Fine jewellery is defined by its materials. Solid gold (14k, 18k or 22k) retains value and can be re-polished indefinitely. Vermeil and gold-fill offer a more accessible price point while maintaining quality. Sterling silver develops a warm patina over time.",
      },
      {
        title: "Everyday vs occasional",
        body: "A well-chosen everyday piece — stud earrings, a signet ring, or a fine chain necklace — should be comfortable enough to sleep in and durable enough to withstand daily wear. Reserve delicate pieces for evenings and special occasions.",
      },
      {
        title: "Storage and care",
        body: "Store each piece separately in a soft pouch or lined box to prevent scratching. Remove jewellery before swimming, showering, or applying lotion. A gentle clean with a soft cloth after each wear maintains the lustre.",
      },
    ],
  },
  {
    id: "skincare-routine",
    title: "The Considered Skincare Guide",
    subtitle: "Build a simple, effective routine with products that respect your skin and the planet.",
    hero: "https://images.pexels.com/photos/3738342/pexels-photo-3738342.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1800&h=800",
    sections: [
      {
        title: "Less is more",
        body: "The most effective routines are simple: cleanse, treat, moisturise, protect. Adding products slowly allows you to understand what your skin actually responds to, rather than overwhelming it with actives.",
      },
      {
        title: "Key ingredients that work",
        body: "Vitamin C for brightness and protection. Hyaluronic acid for hydration. Retinoids for renewal. Niacinamide for balance. Each has a proven track record — look for them in well-formulated concentrations.",
      },
      {
        title: "Sustainability matters",
        body: "The beauty industry produces billions of packages each year. Choose brands that offer refills, use glass over plastic, and formulate without parabens, sulphates, or synthetic fragrances. Your skin — and the planet — will thank you.",
      },
    ],
  },
];

/** Get buying guide by product category */
export function useBuyingGuideForProduct(product: Product) {
  const { products } = useStore();
  const { tags, category } = product;

  const guide = useMemo(() => {
    if (tags.some((t) => t.toLowerCase().includes("wardrobe") || t.toLowerCase().includes("fashion") || t.toLowerCase().includes("clothing"))) {
      return BUYING_GUIDES[0];
    }
    if (tags.some((t) => t.toLowerCase().includes("jewellery") || t.toLowerCase().includes("jewelry") || t.toLowerCase().includes("ring"))) {
      return BUYING_GUIDES[1];
    }
    if (tags.some((t) => t.toLowerCase().includes("skincare") || t.toLowerCase().includes("beauty") || t.toLowerCase().includes("cream"))) {
      return BUYING_GUIDES[2];
    }
    // Category-based fallback
    if (category.toLowerCase().includes("fashion") || category.toLowerCase().includes("jewelry") || category.toLowerCase().includes("beauty")) {
      return BUYING_GUIDES.find((g) => g.id.includes(category.toLowerCase())) ?? BUYING_GUIDES[0];
    }
    return null;
  }, [tags, category]);

  const relatedProducts = useMemo(() => {
    if (!guide) return [];
    return products
      .filter((p) => p.id !== product.id && p.tags.some((t) => guide.id.includes(t.toLowerCase()) || guide.title.toLowerCase().includes(t.toLowerCase())))
      .slice(0, 4);
  }, [guide, products, product.id]);

  return { guide, relatedProducts };
}
