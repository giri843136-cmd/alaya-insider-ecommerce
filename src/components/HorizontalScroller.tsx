import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

/** Horizontal snap carousel with working prev/next controls and keyboard support. */
export function HorizontalScroller({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.8, 600);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        className="hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full glass text-ink shadow-[var(--shadow-soft)] transition-transform hover:scale-110 md:grid"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full glass text-ink shadow-[var(--shadow-soft)] transition-transform hover:scale-110 md:grid"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
