import { useMemo, useState } from "react";
import { ShieldCheck, Award, BookOpen, Star, TrendingUp } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { getAuthorsFromArticles } from "../../lib/editorialPlatform";
import { cn } from "@/utils/cn";
import { formatCompact } from "../../lib/utils";

export default function AdminAuthorProfiles() {
  const { articles } = useStore();
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const authors = useMemo(() => getAuthorsFromArticles(articles), [articles]);

  const selected = selectedAuthor
    ? authors.find((a) => a.slug === selectedAuthor)
    : null;

  return (
    <>
      <Seo title="Authors" path="/admin/authors" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Authors</h1>
            <p className="mt-1 text-sm text-muted">{authors.length} authors · Editorial profiles</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Authors", value: authors.length, icon: ShieldCheck },
            { label: "Total articles", value: authors.reduce((s, a) => s + a.articleCount, 0), icon: BookOpen },
            { label: "Total views", value: formatCompact(authors.reduce((s, a) => s + a.totalViews, 0)), icon: TrendingUp },
            { label: "Avg rating", value: (authors.reduce((s, a) => s + (Number(a.avgRating) || 0), 0) / Math.max(1, authors.length)).toFixed(1), icon: Star },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Author list */}
          <div className="space-y-3">
            {authors.map((author) => (
              <button
                key={author.id}
                onClick={() => setSelectedAuthor(author.slug)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-colors",
                  selectedAuthor === author.slug
                    ? "border-accent bg-accent-soft/30"
                    : "border-line bg-surface hover:border-accent/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{author.name}</p>
                    <p className="text-xs text-muted">{author.role}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                      <span>{author.articleCount} articles</span>
                      <span>{formatCompact(author.totalViews)} views</span>
                      <span>{(Number(author.avgRating) || 0).toFixed(1)} avg</span>
                    </div>
                  </div>
                  {author.featured && (
                    <span className="badge bg-accent-soft text-accent shrink-0">Featured</span>
                  )}
                </div>
                {author.expertise.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {author.expertise.map((e) => (
                      <span key={e} className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-muted">{e}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Author detail */}
          <div>
            {selected ? (
              <div className="card p-5">
                <div className="text-center">
                  <img src={selected.avatar} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
                  <h3 className="mt-3 font-semibold text-ink">{selected.name}</h3>
                  <p className="text-sm text-muted">{selected.role}</p>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Articles</span>
                    <span className="font-semibold text-ink">{selected.articleCount}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Total views</span>
                    <span className="font-semibold text-ink">{formatCompact(selected.totalViews)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Avg rating</span>
                    <span className="font-semibold text-ink">{(selected.avgRating ?? 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-medium text-muted">Featured</span>
                    <span className={cn("font-semibold", selected.featured ? "text-accent" : "text-muted")}>
                      {selected.featured ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {selected.credentials.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Credentials</p>
                    <div className="space-y-1">
                      {selected.credentials.map((c) => (
                        <p key={c} className="flex items-center gap-1.5 text-xs text-ink">
                          <ShieldCheck className="h-3 w-3 text-accent" /> {c}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {selected.awards.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Awards</p>
                    <div className="space-y-1">
                      {selected.awards.map((a) => (
                        <p key={a} className="flex items-center gap-1.5 text-xs text-ink">
                          <Award className="h-3 w-3 text-amber-500" /> {a}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {selected.expertise.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Expertise</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.expertise.map((e) => (
                        <span key={e} className="rounded-full bg-surface2 px-2.5 py-1 text-xs text-ink">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center p-8 text-center">
                <ShieldCheck className="h-8 w-8 text-muted" />
                <p className="mt-3 text-sm text-muted">Select an author to view their profile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
