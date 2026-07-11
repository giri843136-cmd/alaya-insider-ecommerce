import { Link } from "react-router-dom";
import { ArrowRight, Gem, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/ui";
import { wide } from "../lib/utils";

const VALUES = [
  { icon: Gem, title: "Considered curation", text: "Every product earns its place — researched, tested and styled by our editors." },
  { icon: ShieldCheck, title: "Radical transparency", text: "Fair pricing, honest reviews and clear affiliate partnerships. Always." },
  { icon: Leaf, title: "Made to last", text: "We favour materials and makers designed to age beautifully, not end up in landfill." },
  { icon: Sparkles, title: "Editorial joy", text: "Shopping should feel like reading a beautiful magazine — not a chore." },
];

const STATS = [
  { value: "9", label: "Countries served" },
  { value: "12k+", label: "Happy Insiders" },
  { value: "4.9★", label: "Average rating" },
  { value: "30-day", label: "Easy returns" },
];

export default function About() {
  const { settings } = useStore();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `The ${settings.storeName} story`,
    description: settings.description,
    image: wide(36701535, 1200, 630),
    author: { "@type": "Organization", name: settings.storeName },
    publisher: { "@type": "Organization", name: settings.storeName },
  };

  return (
    <>
      <Seo title="Our story" description="The philosophy behind ALAYA INSIDER — considered luxury, curated for you." path="/about" schema={schema} />

      {/* Hero */}
      <section className="relative -mt-px overflow-hidden">
        <div className="relative">
          <img src={wide(33464930, 1800, 1000)} alt="ALAYA INSIDER story" className="h-[60vh] w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
          <div className="container-edge absolute inset-x-0 bottom-0 pb-12">
            <Reveal>
              <span className="eyebrow mb-3">Our story</span>
              <h1 className="max-w-2xl font-display text-4xl font-semibold text-ink sm:text-6xl text-balance">
                We don't sell everything — only what's worth your shelf.
              </h1>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container-edge py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="eyebrow mb-3">The philosophy</span>
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">Luxury, edited down to its essence.</h2>
            <div className="mt-5 space-y-4 text-pretty text-muted">
              <p>{settings.storeName} began with a simple frustration: online shopping had become endless, noisy and impersonal. We wanted the opposite — a small, considered edit chosen by people who genuinely care.</p>
              <p>From full-grain leather that softens over decades to skincare we'd use ourselves, every piece here has passed an editorial filter. No filler. No noise. Just objects worth keeping.</p>
            </div>
            <Link to="/shop" className="btn-primary btn-md mt-8">Explore the edit <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <Reveal delay={120}>
            <img src={wide(3765538, 1000, 1200)} alt="Editorial detail" loading="lazy" className="aspect-[4/5] w-full rounded-[var(--radius-xl3)] object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-line bg-surface2/40 py-20">
        <div className="container-edge">
          <Reveal>
            <SectionHeading align="center" eyebrow="What we stand for" title="Four principles, no compromise" />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="card h-full p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent"><v.icon className="h-6 w-6" /></span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-edge py-20">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div className="text-center">
                <p className="font-display text-4xl font-semibold text-accent sm:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm text-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-edge pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-xl3)] bg-ink p-10 text-center text-canvas sm:p-16">
            <div className="absolute inset-0 bg-luxe opacity-70" />
            <div className="relative mx-auto max-w-xl">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl text-balance">Become an Insider.</h2>
              <p className="mx-auto mt-4 max-w-md text-canvas/70">Join a community that values considered living. First access, private sales and 10% off your first order.</p>
              <Link to="/shop" className="btn-primary btn-lg mt-7">Start your edit</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
