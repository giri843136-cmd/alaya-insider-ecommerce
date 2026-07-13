import { useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { removeJsonLd, setJsonLd, upsertLink, upsertMeta } from "../lib/seo";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: string;
  schema?: object | object[];
}

/** Per-page dynamic metadata + Open Graph + Twitter + JSON-LD. */
export function Seo({ title, description, image, path = "/", type = "website", schema }: SeoProps) {
  const { settings } = useStore();

  useEffect(() => {
    const fullTitle = title ? `${title} — ${settings.storeName}` : settings.seo.title;
    const desc = description || settings.seo.description;
    const img = image || settings.seo.ogImage;
    const url = `${window.location.origin}${path}`;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("name", "keywords", settings.seo.keywords);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:site_name", settings.storeName);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);
    upsertLink("canonical", url);

    const schemaArr = schema ? (Array.isArray(schema) ? schema : [schema]) : [];
    schemaArr.forEach((s, i) => s && setJsonLd(`alaya-jsonld-${i}`, s));

    return () => {
      for (let i = 0; i < schemaArr.length; i++) removeJsonLd(`alaya-jsonld-${i}`);
    };
  }, [title, description, image, path, type, schema, settings]);

  return null;
}

/** Global Organization + WebSite + Breadcrumb + Store structured data (mounted once at root). */
export function SiteSchema() {
  const { settings } = useStore();
  useEffect(() => {
    const origin = window.location.origin;
    setJsonLd("alaya-organization", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.storeName,
      url: origin,
      description: settings.description,
      email: settings.contactEmail,
      telephone: settings.contactPhone,
      logo: settings.seo.ogImage,
      image: settings.seo.ogImage,
      sameAs: Object.values(settings.social).filter(Boolean),
      address: { "@type": "PostalAddress", addressLocality: settings.address },
    });
    setJsonLd("alaya-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.storeName,
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/#/shop?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
    setJsonLd("alaya-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${origin}/#/shop` },
      ],
    });
    return () => {
      removeJsonLd("alaya-organization");
      removeJsonLd("alaya-website");
      removeJsonLd("alaya-breadcrumb");
    };
  }, [settings]);
  return null;
}

/** Product schema — use on product detail pages */
export function ProductSchema(product: {
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  price: number;
  currency?: string;
  brand?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  reviewCount?: number;
  ratingValue?: number;
  url?: string;
}) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.image,
      sku: product.sku,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency || "USD",
        availability: `https://schema.org/${product.availability || "InStock"}`,
        url: product.url,
      },
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      ...(product.reviewCount && product.ratingValue ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.ratingValue,
          reviewCount: product.reviewCount,
        },
      } : {}),
    };
    setJsonLd("alaya-product", schema);
    return () => removeJsonLd("alaya-product");
  }, [product.name, product.description, product.image, product.sku, product.price, product.currency, product.brand, product.availability, product.reviewCount, product.ratingValue, product.url]);
  return null;
}

/** FAQ schema — use on FAQ pages */
export function FaqSchema(questions: { question: string; answer: string }[]) {
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer,
        },
      })),
    };
    setJsonLd("alaya-faq", schema);
    return () => removeJsonLd("alaya-faq");
  }, [questions]);
  return null;
}

/** Article schema — use on journal/article pages */
export function ArticleSchema(article: {
  title: string;
  description?: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  url?: string;
}) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      image: article.image,
      author: article.author ? {
        "@type": "Person",
        name: article.author,
      } : undefined,
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      url: article.url,
      publisher: {
        "@type": "Organization",
        name: "ALAYA INSIDER",
      },
    };
    setJsonLd("alaya-article", schema);
    return () => removeJsonLd("alaya-article");
  }, [article.title, article.description, article.image, article.author, article.datePublished, article.dateModified, article.url]);
  return null;
}
