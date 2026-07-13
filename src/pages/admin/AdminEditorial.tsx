import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  TrendingUp,
  Eye,
  Clock,
  Star,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import {
  getContentDiscoveryStats,
} from "../../lib/editorialPlatform";
import { formatCompact } from "../../lib/utils";

export default function AdminEditorial() {
  const { articles, products } = useStore();

  const stats = useMemo(() => getContentDiscoveryStats(articles, products), [articles, products]);

  const authorNames = useMemo(
    () => [...new Set(articles.map((a) => a.author))],
    [articles]
  );

  const categories = useMemo(
    () => [...new Set(articles.map((a) => a.category))],
    [articles]
  );

  const recentArticles = useMemo(
    () => [...articles].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 6),
    [articles]
  );

  return (
    <>
      <Seo title="Editorial Platform" path="/admin/editorial" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Editorial Platform</h1>
            <p className="mt-1 text-sm text-muted">Manage your editorial content, authors, and reviews.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/journal" className="btn-primary btn-sm">
              <BookOpen className="h-4 w-4" /> Journal
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total articles", value: stats.totalArticles, icon: BookOpen },
            { label: "Featured", value: stats.featuredArticles, icon: Star },
            { label: "Categories", value: stats.categories, icon: BarChart3 },
            { label: "Authors", value: authorNames.length, icon: ShieldCheck },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="card p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Eye className="h-3 w-3" /> Avg article length
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCompact(stats.avgArticleLength)} chars</p>
          </div>
          <div className="card p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Clock className="h-3 w-3" /> Total read time
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{stats.totalReadTime} min</p>
          </div>
          <div className="card p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <TrendingUp className="h-3 w-3" /> Total products
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{stats.totalProducts}</p>
          </div>
        </div>

        {/* Categories grid */}
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold text-ink">Content categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count = articles.filter((a) => a.category === cat).length;
              return (
                <Link
                  key={cat}
                  to={`/admin/journal?category=${cat}`}
                  className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm transition-colors hover:border-accent"
                >
                  <BookOpen className="h-4 w-4 text-accent" />
                  <span className="font-medium text-ink">{cat}</span>
                  <span className="text-xs text-muted">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Authors */}
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold text-ink">Authors</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authorNames.map((name) => {
              const authorArticles = articles.filter((a) => a.author === name);
              return (
                <div key={name} className="card p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                      {name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{name}</p>
                      <p className="text-xs text-muted">{authorArticles.length} articles · {authorArticles[0]?.authorRole}</p>
                    </div>
                  </div>
                  <Link
                    to={`/admin/journal?author=${encodeURIComponent(name)}`}
                    className="btn-ghost btn-sm mt-3 w-full"
                  >
                    View articles
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent articles */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Recently published</h2>
            <Link to="/admin/journal" className="text-xs font-medium text-accent hover:text-accent/80">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((a) => (
              <Link
                key={a.id}
                to={`/journal/${a.slug}`}
                className="card group overflow-hidden"
              >
                <div className="aspect-[16/9] overflow-hidden bg-surface2">
                  <img src={a.cover} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">{a.category}</span>
                  <p className="mt-1.5 font-medium text-ink line-clamp-1">{a.title}</p>
                  <p className="mt-1 text-xs text-muted line-clamp-1">{a.author} · {a.readMinutes} min read</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
