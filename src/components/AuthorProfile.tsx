/**
 * ALAYA INSIDER — Author Profile Components
 * -------------------------------------------------
 * Author profile cards, expert credentials, portfolio grid,
 * author timeline, and verification badges.
 */
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import type { Article } from "../lib/types";
import { cn } from "@/utils/cn";
import { buildAuthorProfile } from "../lib/editorialPlatform";
import { formatCompact } from "../lib/utils";
import { ArticleCard } from "./ArticleCard";
import { Reveal } from "./Reveal";

/* ------------------------------------------------------------------ */
/*  Author Profile Card                                               */
/* ------------------------------------------------------------------ */

interface AuthorProfileCardProps {
  authorName: string;
  articles: Article[];
  role?: string;
  className?: string;
}

export function AuthorProfileCard({ authorName, articles, role, className }: AuthorProfileCardProps) {
  const profile = buildAuthorProfile(authorName, articles, role);

  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-6 text-center">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full ring-2 ring-accent/30">
          <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink">{profile.name}</h3>
        <p className="text-sm text-muted">{profile.role}</p>
        {profile.credentials.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-xs text-accent font-medium">{profile.credentials[0]}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm text-muted line-clamp-3">{profile.bio}</p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat value={formatCompact(profile.articleCount)} label="Articles" />
          <Stat value={formatCompact(profile.totalViews)} label="Views" />
          <Stat value={profile.avgRating.toFixed(1)} label="Rating" />
        </div>

        {profile.expertise.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.expertise.map((e) => (
                <span key={e} className="rounded-full bg-surface2 px-2.5 py-1 text-xs text-ink">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        <Link
          to={`/journal?author=${profile.slug}`}
          className="btn-outline btn-sm mt-5 w-full"
        >
          <BookOpen className="h-3.5 w-3.5" /> View articles
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Author Detail Page Component                                      */
/* ------------------------------------------------------------------ */

interface AuthorDetailProps {
  authorName: string;
  articles: Article[];
  role?: string;
  credentials?: string[];
  awards?: string[];
  bio?: string;
}

export function AuthorDetail({
  authorName,
  articles,
  role,
  credentials = [],
  awards = [],
  bio,
}: AuthorDetailProps) {
  const profile = buildAuthorProfile(authorName, articles, role);
  const authorArticles = articles.filter((a) => a.author === authorName);
  const featured = authorArticles.filter((a) => a.featured);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[var(--radius-xl3)] bg-gradient-to-br from-accent/10 via-accent/5 to-surface mb-10">
        <div className="flex flex-col items-center gap-8 p-8 sm:flex-row sm:p-12">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 ring-accent/20">
            <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{profile.name}</h1>
            <p className="mt-1 text-accent font-medium">{profile.role}</p>
            <p className="mt-3 max-w-lg text-muted">{bio || profile.bio}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {credentials.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft/50 px-3 py-1 text-xs font-medium text-accent">
                  <ShieldCheck className="h-3.5 w-3.5" /> {c}
                </span>
              ))}
              {awards.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <Award className="h-3.5 w-3.5" /> {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-line/50">
          {[
            { value: profile.articleCount, label: "Articles" },
            { value: formatCompact(profile.totalViews), label: "Total views" },
            { value: profile.avgRating.toFixed(1), label: "Avg rating" },
          ].map((s) => (
            <div key={s.label} className="border-r border-line/50 p-4 text-center last:border-r-0">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expertise tags */}
      {profile.expertise.length > 0 && (
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Areas of expertise</p>
          <div className="flex flex-wrap gap-2">
            {profile.expertise.map((e) => (
              <Link key={e} to={`/shop?tags=${e}`} className="chip">{e}</Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured articles */}
      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Featured stories</h2>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a, i) => (
              <Reveal key={a.id} delay={i * 60}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* All articles by this author */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">
          All articles ({authorArticles.length})
        </h2>
        {authorArticles.length > 0 ? (
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {authorArticles.filter((a) => !a.featured).map((a, i) => (
              <Reveal key={a.id} delay={i * 40}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted">No articles yet.</p>
        )}
      </section>
    </div>
  );
}
