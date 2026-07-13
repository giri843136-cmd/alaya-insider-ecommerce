import { type ReactNode } from "react";
import { useInView, usePrefersReducedMotion } from "../lib/hooks";
import { cn } from "@/utils/cn";

/**
 * Reveals children on scroll into view.
 * Respects prefers-reduced-motion (renders visible immediately).
 *
 * When `stagger` is true, applies staggered entrance to direct children.
 */
export function Reveal({
  children,
  delay = 0,
  stagger = false,
  className,
}: {
  children: ReactNode;
  delay?: number;
  /** Animate each direct child with a staggered delay. */
  stagger?: boolean;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={cn(
        stagger ? "reveal-stagger" : "reveal",
        inView && "is-visible",
        className
      )}
      style={stagger ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
