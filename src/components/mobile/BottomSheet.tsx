import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLockBody } from "@/lib/hooks";
import { attachSwipe } from "@/lib/mobilePlatform";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useLockBody(open);

  useEffect(() => {
    if (!open || !sheetRef.current) return;
    return attachSwipe(sheetRef.current, (event) => {
      if (event.direction === "down" && event.distance > 80) {
        onClose();
      }
    });
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
        className={cn(
          "absolute bottom-0 left-0 right-0 mx-auto max-h-[85vh] w-full max-w-lg animate-slide-up rounded-t-2xl border-t border-line bg-surface pb-safe-bottom",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted hover:text-ink hover:bg-surface2 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
