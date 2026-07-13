import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Brand } from "../lib/types";
import { useStore } from "../context/StoreContext";

export function BrandCard({ brand }: { brand: Brand }) {
  const { productsByBrand } = useStore();
  const count = productsByBrand(brand.id).length;

  return (
    <Link
      to={`/brands/${brand.slug}`}
      className="group relative block overflow-hidden rounded-[var(--radius-xl2)] bg-surface2"
    >
      <div className="aspect-[4/5] w-full overflow-hidden">
        <img
          src={brand.image}
          alt={brand.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/70">{brand.country}</p>
        <h3 className="mt-0.5 font-display text-xl font-semibold text-white">{brand.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-white/80">{brand.tagline}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white">
          {count} {count === 1 ? "piece" : "pieces"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}
