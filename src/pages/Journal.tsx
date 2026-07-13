import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs, EmptyState } from "../components/ui";
import { formatDate } from "../lib/utils";
import { cn } from "@/utils/cn";

export default function Journal() {
  const { articles } = useStore();
  const [cat, setCat] = useState("All");

  const cats = useMemo(() => ["All", ...Array.from(new Set(articles.map((a) => a.category)))], [articles]);
  const featured = articles.find((a) => a.featured);
  const filtered = useMemo(
    () => (cat === "All" ? articles : articles.filter((a) => a.category === cat)),
    [articles, cat]
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "ALAYA Journal",
    blogPost: articles.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      datePublished: new Date(a.publishedAt).toISOString(),
      author: { "@type": "Person", name: a.author },
    })),
  };

  return (
    <>
      <Seo title="Journal" description="Style guides, beauty know-how and craft stories from the ALAYA INSIDER editors." path="/journal" schema={schema} />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Journal" }]} />
      </div>

      <section className="container-edge pb-20">
        <Reveal>
          <span className="eyebrow mb-3">The ALAYA Journal</span>
          <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Stories & guides</h1>
          <p className="mt-4 max-w-xl text-muted">Editorial from our desks — style, beauty, jewelry and craft, written to be genuinely useful.</p>
        </Reveal>

        {articles.length === 0 ? (
          <div className="mt-10"><EmptyState title="No stories yet" description="Our editors are writing — check back soon." /></div>
        ) : (
          <>
            {/* Featured */}
            {featured && cat === "All" && (
              <Reveal>
                <Link to={`/journal/${featured.slug}`} className="group mt-10 grid overflow-hidden rounded-[var(--radius-xl3)] border border-line bg-surface lg:grid-cols-2">
                  <div className="aspect-[16/10] overflow-hidden lg:aspect-auto">
                    <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="badge bg-accent-soft text-accent">Featured</span>
                      <span className="font-semibold uppercase tracking-wider text-muted">{featured.category}</span>
                      <span className="flex items-center gap-1 text-muted"><Clock className="h-3 w-3" /> {featured.readMinutes} min</span>
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl text-balance">{featured.title}</h2>
                    <p className="mt-3 text-pretty text-muted">{featured.excerpt}</p>
                    <p className="mt-5 text-sm text-muted">{featured.author} · {formatDate(featured.publishedAt)}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-medium text-accent">Read the story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </Reveal>
            )}

            {/* Filter */}
            <div className="mt-12 flex flex-wrap gap-2">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={cn("chip", cat === c && "chip-active")}>{c}</button>
              ))}
            </div>

            {/* Grid */}
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.filter((a) => a.id !== featured?.id || cat !== "All").map((a, i) => (
                <Reveal key={a.id} delay={i * 60}><ArticleCard article={a} /></Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
