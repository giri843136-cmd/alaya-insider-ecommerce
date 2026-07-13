import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import type { Product } from "../../lib/types";
import { Badge } from "../ui";
import { useEscapeKey, useLockBody } from "../../lib/hooks";

/** Premium product gallery: thumbnails, hover zoom, swipe, fullscreen & keyboard nav. */
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);

  const images = product.images;
  const go = (dir: number) => setActive((i) => (i + dir + images.length) % images.length);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  // Keyboard navigation for fullscreen — ArrowLeft/ArrowRight
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullscreen, images.length]);

  useEscapeKey(() => setFullscreen(false), fullscreen);
  useLockBody(fullscreen);

  return (
    <>
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={active === i}
                className={cn(
                  "h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-24 sm:w-20",
                  active === i ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div
          className="relative flex-1 overflow-hidden rounded-[var(--radius-xl3)] bg-surface2"
          onMouseEnter={() => setZoom({ x: 50, y: 50 })}
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX == null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            setTouchX(null);
          }}
        >
          <div className="relative aspect-[4/5] w-full">
            <img
              src={images[active]}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-200"
              style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: "scale(1.8)" } : undefined}
            />
          </div>
          <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
            {product.isNew && <Badge variant="new">New</Badge>}
            {product.bestSeller && <Badge variant="bestseller">Bestseller</Badge>}
            {product.affiliate && <Badge variant="affiliate">Affiliate</Badge>}
          </div>
          <button
            onClick={() => setFullscreen(true)}
            aria-label="Open fullscreen image"
            className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full glass text-ink transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          </button>
          {images.length > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full glass text-ink hover:scale-110 sm:hidden">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full glass text-ink hover:scale-110 sm:hidden">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() => setFullscreen(false)}
        >
          <img src={images[active]} alt={product.name} className="max-h-[88vh] max-w-full rounded-xl object-contain" />
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`} className={cn("h-2 rounded-full transition-all", i === active ? "w-6 bg-accent" : "w-2 bg-white/40")} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
