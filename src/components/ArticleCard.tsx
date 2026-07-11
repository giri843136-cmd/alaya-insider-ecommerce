import { Link } from "react-router-dom";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "../lib/types";
import { formatDate } from "../lib/utils";

export function ArticleCard({ article, compact = false }: { article: Article; compact?: boolean }) {
  return (
    <article className={`group flex ${compact ? "flex-row gap-4" : "flex-col"}`}>
      <Link
        to={`/journal/${article.slug}`}
        className={`relative block overflow-hidden rounded-[var(--radius-xl2)] bg-surface2 ${compact ? "h-20 w-24 shrink-0" : "aspect-[16/10] w-full"}`}
        aria-label={article.title}
      >
        <img
          src={article.cover}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
      </Link>
      <div className={`${compact ? "" : "mt-4"}`}>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold uppercase tracking-wider text-accent">{article.category}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readMinutes} min
          </span>
        </div>
        <h3 className={`mt-2 font-semibold leading-snug text-ink ${compact ? "text-sm" : "text-lg"}`}>
          <Link to={`/journal/${article.slug}`} className="transition-colors hover:text-accent">
            {article.title}
          </Link>
        </h3>
        {!compact && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{article.excerpt}</p>}
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{article.author} · {formatDate(article.publishedAt)}</span>
          <Link to={`/journal/${article.slug}`} className="inline-flex items-center gap-1 font-medium text-accent">
            Read <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
