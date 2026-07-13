import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { HeroSlide } from "../lib/types";
import { cn } from "@/utils/cn";
import { usePrefersReducedMotion } from "../lib/hooks";
import { SafeImg } from "./SafeImg";

const AUTOPLAY_MS = 6500;

/**
 * Premium hero slider: autoplay, manual arrows, dot navigation,
 * keyboard support and touch swipe. Respects reduced-motion (no autoplay).
 * Memo-wrapped to prevent unnecessary re-renders.
 */
export const HeroSlider = memo(function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const touchX = useRef<number | null>(null);

  const count = slides.length;
  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  useEffect(() => {
    if (paused || reduced || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduced, count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) return null;
  const slide = slides[index];
  const centered = slide.align === "center";

  return (
    <section
      className="relative -mt-px overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured highlights"
    >
      <div className="relative min-h-[88vh] w-full">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 2 : 1 }}
            aria-hidden={i !== index}
          >
            <SafeImg
              src={s.image}
              alt={s.title}
              fetchPriority={i === 0 ? "high" : "low"}
              className="h-full w-full object-cover object-top"
            />
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-canvas/80 via-canvas/40 to-transparent",
                centered ? "bg-gradient-to-b from-canvas/40 via-transparent to-canvas/80" : "bg-gradient-to-r from-canvas via-canvas/85 to-transparent sm:via-canvas/60"
              )}
            />
          </div>
        ))}

        <div className="container-edge relative z-10 flex min-h-[88vh] items-center">
          <div className={cn("max-w-xl py-24", centered && "mx-auto text-center")}>
            <span className="eyebrow mb-5 animate-slide-up">{slide.eyebrow}</span>
            <h1 className="text-display-xl animate-slide-up text-ink text-balance" style={{ animationDelay: "60ms" }}>
              {slide.title}{" "}
              {slide.highlight && <span className="text-accent">{slide.highlight}</span>}
              {slide.title.endsWith(",") ? "" : "."}
            </h1>
            <p className="mt-6 max-w-md animate-slide-up text-pretty text-muted sm:text-lg" style={{ animationDelay: "120ms" }}>
              {slide.description}
            </p>
            <div className={cn("mt-8 flex animate-slide-up flex-wrap gap-3", centered && "justify-center")} style={{ animationDelay: "180ms" }}>
              <Link to={slide.ctaLink} className="btn-primary btn-lg">
                {slide.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              {slide.cta2Label && (
                <Link to={slide.cta2Link || "/shop"} className="btn-outline btn-lg">
                  {slide.cta2Label}
                </Link>
              )}
            </div>
            <div className={cn("mt-10 flex animate-slide-up items-center gap-6", centered && "justify-center")} style={{ animationDelay: "240ms" }}>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" strokeWidth={0} />
                  ))}
                </div>
                <span className="text-sm font-medium text-ink">4.9</span>
                <span className="text-sm text-muted">· 12k+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full glass text-ink transition-transform hover:scale-110 md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full glass text-ink transition-transform hover:scale-110 md:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-8 bg-accent" : "w-2 bg-ink/30 hover:bg-ink/50"
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Swipe layer (mobile) */}
      <div
        className="absolute inset-0 z-10 md:hidden"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      />
    </section>
  );
});
