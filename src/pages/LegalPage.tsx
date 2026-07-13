import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { Breadcrumbs, EmptyState } from "../components/ui";
import { LEGAL_DOCS, LEGAL_NAV } from "../lib/legal";
import { cn } from "@/utils/cn";

export default function LegalPage() {
  const { slug } = useParams();
  const doc = slug ? LEGAL_DOCS[slug] : undefined;

  if (!doc) {
    return (
      <div className="container-edge py-24">
        <EmptyState title="Document not found" description="This policy may have moved." action={<Link to="/" className="btn-primary btn-md">Back home</Link>} />
      </div>
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: doc.title,
    description: doc.intro,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
        { "@type": "ListItem", position: 2, name: doc.title },
      ],
    },
  };

  return (
    <>
      <Seo title={doc.title} description={doc.intro} path={`/legal/${doc.slug}`} schema={schema} />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: doc.title }]} />
      </div>

      <section className="container-edge pb-24">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                <ShieldCheck className="h-4 w-4 text-accent" /> Legal
              </p>
              <nav className="space-y-1" aria-label="Legal documents">
                {LEGAL_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      item.to === `/legal/${doc.slug}` ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface2 hover:text-ink"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-3xl">
            <Reveal>
              <h1 className="text-display-m text-ink">{doc.title}</h1>
              <p className="mt-3 text-pretty text-muted">{doc.intro}</p>
              <p className="mt-2 text-xs text-muted">Last updated: {doc.updated}</p>
            </Reveal>

            <div className="mt-10 space-y-10">
              {doc.sections.map((s) => (
                <Reveal key={s.heading}>
                  <section>
                    <h2 className="font-display text-xl font-semibold text-ink">{s.heading}</h2>
                    <div className="mt-3 space-y-3">
                      {s.body.map((p, i) => (
                        <p key={i} className="leading-relaxed text-muted">{p}</p>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}
            </div>

            {/* Mobile legal nav */}
            <div className="mt-12 border-t border-line pt-6 lg:hidden">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Other policies</p>
              <div className="flex flex-wrap gap-2">
                {LEGAL_NAV.filter((i) => i.to !== `/legal/${doc.slug}`).map((item) => (
                  <Link key={item.to} to={item.to} className="chip">{item.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/" className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
          </div>
        </div>
      </section>
    </>
  );
}
