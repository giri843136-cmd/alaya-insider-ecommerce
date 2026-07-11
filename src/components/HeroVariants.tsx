/**
 * ALAYA INSIDER — Hero Variant Components
 * -------------------------------------------------
 * Extends the base HeroSlider with premium editorial heroes,
 * seasonal heroes, campaign heroes, and interactive hero experiences.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import type { HeroSlide } from "../lib/types";
import { cn } from "@/utils/cn";
import { wide } from "../lib/utils";

/* ------------------------------------------------------------------ */
/*  Editorial Hero — magazine-style layout with typography focus      */
/* ------------------------------------------------------------------ */

interface EditorialHeroProps {
  slide: HeroSlide;
  className?: string;
  variant?: "standard" | "split" | "full-bleed" | "minimal";
}

export function EditorialHero({
  slide,
  className,
  variant = "standard",
}: EditorialHeroProps) {

  if (variant === "minimal") {
    return (
      <section className={cn("relative min-h-[70vh] overflow-hidden", className)}>
        <div className="absolute inset-0">
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/70 to-transparent" />
        </div>
        <div className="container-edge relative z-10 flex min-h-[70vh] items-center">
          <div className="max-w-lg py-24">
            <span className="eyebrow mb-4">{slide.eyebrow}</span>
            <h1 className="font-display text-5xl font-light leading-tight tracking-tight text-ink sm:text-7xl">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              {slide.description}
            </p>
            <Link
              to={slide.ctaLink}
              className="btn-primary btn-lg mt-8 inline-flex"
            >
              {slide.ctaLabel} <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className={cn("relative grid min-h-[80vh] lg:grid-cols-2", className)}>
        <div className="relative flex items-center bg-ink p-8 text-canvas sm:p-16">
          <div className="mx-auto max-w-md">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.3em] text-canvas/60">
              {slide.eyebrow}
            </span>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
              {slide.title}{" "}
              {slide.highlight && (
                <span className="text-accent">{slide.highlight}</span>
              )}
            </h1>
            <p className="mt-6 text-canvas/70">{slide.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={slide.ctaLink} className="btn btn-md border border-canvas/30 text-canvas hover:bg-white/10">
                {slide.ctaLabel} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
              {slide.cta2Label && (
                <Link to={slide.cta2Link || "/shop"} className="btn btn-md text-canvas/70 hover:text-canvas">
                  <Play className="h-4 w-4 mr-1" /> {slide.cta2Label}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="relative min-h-[50vh] lg:min-h-full">
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </section>
    );
  }

  // Full-bleed editorial
  return (
    <section className={cn("relative min-h-[85vh] overflow-hidden", className)}>
      <div className="absolute inset-0">
        <img
          src={slide.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-[2s] hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />
      </div>
      <div
        className={cn(
          "container-edge relative z-10 flex min-h-[85vh] items-end pb-20",
          slide.align === "center" && "items-center justify-center pb-0"
        )}
      >
        <div className={cn("max-w-2xl", slide.align === "center" && "text-center")}>
          <span
            className={cn(
              "mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]",
              "bg-canvas/10 text-ink backdrop-blur-sm"
            )}
          >
            {slide.eyebrow}
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl lg:text-7xl text-balance">
            {slide.title}{" "}
            {slide.highlight && (
              <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                {slide.highlight}
              </span>
            )}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted text-balance">
            {slide.description}
          </p>
          <div className={cn("mt-8 flex flex-wrap gap-3", slide.align === "center" && "justify-center")}>
            <Link to={slide.ctaLink} className="btn-primary btn-lg">
              {slide.ctaLabel} <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
            {slide.cta2Label && (
              <Link to={slide.cta2Link || "/shop"} className="btn-outline btn-lg">
                <Play className="h-4 w-4 mr-1" /> {slide.cta2Label}
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce md:block">
        <ChevronDown className="h-6 w-6 text-muted" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Seasonal Hero — themed by season with decorative elements         */
/* ------------------------------------------------------------------ */

interface SeasonalHeroProps {
  season: "summer" | "winter" | "spring" | "fall";
  title: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
}

const SEASON_THEMES = {
  summer: {
    gradient: "from-amber-400/40 via-rose-300/30 to-sky-400/40",
    accent: "text-amber-400",
    overlay: "bg-gradient-to-b from-transparent via-amber-900/20 to-amber-950/60",
    image: wide(17775855, 1800, 1100),
  },
  winter: {
    gradient: "from-slate-800/60 via-blue-900/40 to-indigo-950/60",
    accent: "text-blue-300",
    overlay: "bg-gradient-to-b from-transparent via-slate-900/30 to-slate-950/70",
    image: wide(33464930, 1800, 1100),
  },
  spring: {
    gradient: "from-pink-400/30 via-green-300/30 to-yellow-300/30",
    accent: "text-green-400",
    overlay: "bg-gradient-to-b from-transparent via-green-900/20 to-green-950/50",
    image: wide(3765538, 1800, 1100),
  },
  fall: {
    gradient: "from-orange-500/40 via-red-400/30 to-amber-600/40",
    accent: "text-orange-400",
    overlay: "bg-gradient-to-b from-transparent via-orange-900/20 to-orange-950/60",
    image: wide(30541170, 1800, 1100),
  },
};

export function SeasonalHero({ season, title, description, ctaLabel, ctaLink }: SeasonalHeroProps) {
  const theme = SEASON_THEMES[season];

  return (
    <section className="relative min-h-[75vh] overflow-hidden">
      <img src={theme.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className={`absolute inset-0 ${theme.overlay}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      <div className="container-edge relative z-10 flex min-h-[75vh] items-center">
        <div className="max-w-xl">
          <span className={`mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] ${theme.accent}`}>
            <span className="h-px w-8 bg-current" />
            {season} {new Date().getFullYear()}
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl text-balance">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/70">{description}</p>
          <Link to={ctaLink} className="btn btn-lg mt-8 inline-flex border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
            {ctaLabel} <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>

      {/* Decorative season elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Campaign Hero — promotional, limited-time, event-driven            */
/* ------------------------------------------------------------------ */

interface CampaignHeroProps {
  campaign: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaLink: string;
    image: string;
    badge?: string;
    endsAt?: number;
  };
  className?: string;
}

export function CampaignHero({ campaign, className }: CampaignHeroProps) {
  const isUrgent = useMemo(() => {
    if (!campaign.endsAt) return false;
    return campaign.endsAt - Date.now() < 86400000; // < 24 hours
  }, [campaign.endsAt]);

  return (
    <section className={cn("relative min-h-[80vh] overflow-hidden", className)}>
      <img src={campaign.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      <div className="container-edge relative z-10 flex min-h-[80vh] items-center">
        <div className="max-w-xl">
          {campaign.badge && (
            <span className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider",
              isUrgent ? "bg-danger text-white animate-pulse" : "bg-accent text-accent-ink"
            )}>
              {isUrgent && <span className="h-2 w-2 rounded-full bg-current" />}
              {campaign.badge}
            </span>
          )}
          <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            {campaign.eyebrow}
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl text-balance">
            {campaign.title}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/70">{campaign.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={campaign.ctaLink} className="btn-primary btn-lg bg-white text-ink hover:bg-white/90">
              {campaign.ctaLabel} <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link to="/shop" className="btn btn-lg border border-white/20 text-white hover:bg-white/10">
              Explore all
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
