import { useEffect, useRef, type ReactNode } from "react";
import { attachSwipe, type SwipeEvent } from "@/lib/mobilePlatform";

interface SwipeContainerProps {
  children: ReactNode;
  onSwipe?: (event: SwipeEvent) => void;
  threshold?: number;
  className?: string;
}

export function SwipeContainer({ children, onSwipe, threshold = 50, className }: SwipeContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onSwipe) return;
    return attachSwipe(el, onSwipe, threshold);
  }, [onSwipe, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
