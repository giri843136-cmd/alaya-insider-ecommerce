import { Link, useParams } from "react-router-dom";
import { Clock, ArrowRight, ArrowLeft, Tag } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs, EmptyState } from "../components/ui";
import { formatDate } from "../lib/utils";

export default function ArticleDetail() {
  const { slug } = useParams();
  const { getArticle, articles } = useStore();
  const article = slug ? getArticle(slug) : undefined;

  if (!article) {
    return (
      <div className="container-edge py-24">
        <EmptyState title="Story not found" description="This article may have moved." action={<Link to="/journal" className="btn-primary btn-md">Back to Journal</Link>} />
      </div>
    );
  }

  const related = articles.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 3);
  const fallback = articles.filter((a) => a.id !== article.id).slice(0, 3);
  const more = related.length ? related : fallback;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.cover,
    datePublished: new Date(article.publishedAt).toISOString(),
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "ALAYA INSIDER" },
    articleBody: article.body.join("\n"),
    keywords: article.tags.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${window.location.origin}/#/journal` },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  return (
    <>
      <Seo title={article.title} description={article.excerpt} image={article.cover} path={`/journal/${article.slug}`} type="article" schema={[articleSchema, breadcrumbSchema]} />

      <article className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Journal", to: "/journal" }, { label: article.title }]} />

        <Reveal>
          <header className="mx-auto mt-6 max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-accent">{article.category}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-muted"><Clock className="h-3 w-3" /> {article.readMinutes} min read</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl text-balance">{article.title}</h1>
            <p className="mt-4 text-pretty text-muted">{article.excerpt}</p>
            <p className="mt-5 text-sm text-muted">
              By <span className="font-medium text-ink">{article.author}</span> · {article.authorRole} · {formatDate(article.publishedAt)}
            </p>
          </header>
        </Reveal>

        <Reveal>
          <img src={article.cover} alt={article.title} className="mx-auto mt-8 aspect-[16/9] w-full max-w-4xl rounded-[var(--radius-xl3)] object-cover" />
        </Reveal>

        <div className="mx-auto mt-10 max-w-2xl">
          <div className="space-y-6">
            {article.body.map((para, i) => (
              <p key={i} className="text-lg leading-relaxed text-ink text-pretty">{para}</p>
            ))}
          </div>

          {/* Tags */}
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
            <Tag className="h-4 w-4 text-muted" />
            {article.tags.map((t) => (
              <Link key={t} to={`/shop?q=${encodeURIComponent(t)}`} className="chip">{t}</Link>
            ))}
          </div>

          {/* Author CTA */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[var(--radius-xl2)] bg-surface2/60 p-6 sm:flex-row">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{article.author.slice(0, 1)}</span>
              <div>
                <p className="font-semibold text-ink">{article.author}</p>
                <p className="text-sm text-muted">{article.authorRole} · ALAYA INSIDER</p>
              </div>
            </div>
            <Link to="/shop" className="btn-primary btn-md">Shop the edit <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="container-edge mt-16 border-t border-line py-16">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">More from the Journal</h2>
            <Link to="/journal" className="link-line text-sm font-medium text-accent">View all</Link>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((a, i) => (
              <Reveal key={a.id} delay={i * 60}><ArticleCard article={a} /></Reveal>
            ))}
          </div>
        </section>
      )}

      <div className="container-edge pb-12">
        <Link to="/journal" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent"><ArrowLeft className="h-4 w-4" /> Back to Journal</Link>
      </div>
    </>
  );
}
