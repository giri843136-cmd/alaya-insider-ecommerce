/**
 * ALAYA INSIDER — Content Discovery Components
 * -------------------------------------------------
 * Featured articles, trending content, popular reviews, related reading,
 * content hubs, and discovery widgets for the editorial experience.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Star,
  Clock,
  ArrowRight,
  BookOpen,
  Eye,
} from "lucide-react";
import type { Article, Product } from "../lib/types";
import { cn } from "@/utils/cn";
import {
  getRelatedArticles,
  getTrendingContent,
  getFeaturedContent,
  getPopularInCategory,
} from "../lib/editorialPlatform";
import { ArticleCard } from "./ArticleCard";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./ui";
import { formatCompact } from "../lib/utils";

/* ------------------------------------------------------------------ */
/*  Featured Articles Rail                                           */
/* ------------------------------------------------------------------ */

interface FeaturedArticlesProps {
  articles: Article[];
  className?: string;
  title?: string;
}

export function FeaturedArticles({ articles, className, title = "Editor's picks" }: FeaturedArticlesProps) {
  const featured = useMemo(() => getFeaturedContent(articles), [articles]);

  if (featured.length === 0) return null;

  return (
    <section className={cn("py-12", className)}>
      <Reveal>
        <SectionHeading
          eyebrow="Featured stories"
          title={title}
          action={
            <Link to="/journal" className="link-line text-sm font-medium text-accent">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </Reveal>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.slice(0, 3).map((a, i) => (
          <Reveal key={a.id} delay={i * 60}>
            <ArticleCard article={a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trending Content                                                  */
/* ------------------------------------------------------------------ */

interface TrendingContentProps {
  articles: Article[];
  className?: string;
}

export function TrendingContent({ articles, className }: TrendingContentProps) {
  const trending = useMemo(() => getTrendingContent(articles), [articles]);

  if (trending.length === 0) return null;

  return (
    <section className={cn("py-12", className)}>
      <Reveal>
        <SectionHeading
          eyebrow="Trending now"
          title={
            <span className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-danger" />
              Popular this week
            </span>
          }
        />
      </Reveal>

      <div className="mt-6 space-y-3">
        {trending.slice(0, 5).map((a, i) => (
          <Reveal key={a.id} delay={i * 40}>
            <Link
              to={`/journal/${a.slug}`}
              className="flex items-center gap-4 rounded-xl border border-line p-4 transition-colors hover:bg-surface2 group"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink group-hover:text-accent line-clamp-1">{a.title}</p>
                <p className="flex items-center gap-3 text-xs text-muted mt-1">
                  <span className="font-medium text-accent">{a.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.readMinutes} min</span>
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted shrink-0 group-hover:text-accent transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Content Sidebar                                           */
/* ------------------------------------------------------------------ */

interface RelatedContentProps {
  currentArticle: Article;
  allArticles: Article[];
  className?: string;
  limit?: number;
  compact?: boolean;
}

export function RelatedContent({
  currentArticle,
  allArticles,
  className,
  limit = 3,
  compact = false,
}: RelatedContentProps) {
  const related = useMemo(
    () => getRelatedArticles(currentArticle, allArticles, limit),
    [currentArticle, allArticles, limit]
  );

  if (related.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
        <BookOpen className="h-4 w-4 text-accent" /> Related articles
      </h3>
      <div className={cn("space-y-4", compact ? "space-y-3" : "")}>
        {related.map((a, i) => (
          <Reveal key={a.id} delay={i * 40}>
            <ArticleCard article={a} compact={compact} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Popular In Category                                              */
/* ------------------------------------------------------------------ */

interface PopularInCategoryProps {
  articles: Article[];
  category: string;
  className?: string;
}

export function PopularInCategory({ articles, category, className }: PopularInCategoryProps) {
  const popular = useMemo(() => getPopularInCategory(articles, category), [articles, category]);

  if (popular.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-ink">
        <Star className="inline h-4 w-4 text-accent mr-1.5" />
        Popular in {category}
      </h3>
      {popular.map((a) => (
        <Link
          key={a.id}
          to={`/journal/${a.slug}`}
          className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface2"
        >
          <img src={a.cover} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink line-clamp-1">{a.title}</p>
            <p className="text-xs text-muted">{a.readMinutes} min read</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Content Discovery Stats Bar                                      */
/* ------------------------------------------------------------------ */

interface ContentDiscoveryStatsProps {
  articles: Article[];
  className?: string;
}

export function ContentDiscoveryStats({ articles, className }: ContentDiscoveryStatsProps) {
  const stats = useMemo(() => {
    const totalViews = articles.reduce((s) => s + 100 + Math.floor(Math.random() * 900), 0);
    const categoryCount = new Set(articles.map((a) => a.category)).size;
    const avgReadTime = articles.length > 0
      ? Math.round(articles.reduce((s, a) => s + a.readMinutes, 0) / articles.length)
      : 0;
    return { totalViews, categoryCount, avgReadTime };
  }, [articles]);

  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      <div className="rounded-xl border border-line bg-surface p-3 text-center">
        <Eye className="mx-auto h-5 w-5 text-accent" />
        <p className="mt-1 text-lg font-bold text-ink">{formatCompact(stats.totalViews)}</p>
        <p className="text-xs text-muted">Total views</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3 text-center">
        <BookOpen className="mx-auto h-5 w-5 text-accent" />
        <p className="mt-1 text-lg font-bold text-ink">{articles.length}</p>
        <p className="text-xs text-muted">Articles</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3 text-center">
        <Clock className="mx-auto h-5 w-5 text-accent" />
        <p className="mt-1 text-lg font-bold text-ink">{stats.avgReadTime}</p>
        <p className="text-xs text-muted">Avg min read</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editorial Picks — curate products and articles together           */
/* ------------------------------------------------------------------ */

interface EditorialPicksProps {
  articles: Article[];
  products: Product[];
  className?: string;
}

export function EditorialPicks({ articles, products, className }: EditorialPicksProps) {
  const featuredArticles = useMemo(() => getFeaturedContent(articles).slice(0, 2), [articles]);
  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured || p.bestSeller).slice(0, 4),
    [products]
  );

  if (featuredArticles.length === 0 && featuredProducts.length === 0) return null;

  return (
    <section className={cn("py-12", className)}>
      <Reveal>
        <SectionHeading
          eyebrow="Editorial"
          title="Editor's picks"
          subtitle="Stories and products hand-selected by our team."
        />
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Articles */}
        <div className="space-y-3">
          {featuredArticles.map((a) => (
            <ArticleCard key={a.id} article={a} compact />
          ))}
          <Link to="/journal" className="flex items-center gap-1.5 text-sm font-medium text-accent pt-2">
            Browse journal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 gap-3">
          {featuredProducts.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.slug}`}
              className="group rounded-xl border border-line p-2 transition-colors hover:border-accent"
            >
              <img src={p.images[0]} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
              <p className="mt-2 px-1 text-xs font-medium text-ink line-clamp-1">{p.name}</p>
              <p className="px-1 text-xs text-muted">${p.salePrice ?? p.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
