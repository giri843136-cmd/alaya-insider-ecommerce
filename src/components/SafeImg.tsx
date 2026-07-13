import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface SafeImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Optional custom fallback element shown when the image fails to load */
  fallback?: React.ReactNode;
}

/**
 * SafeImg — wraps <img> with graceful error handling.
 * Shows a placeholder SVG when the image fails to load (404/503/etc).
 * Prevents layout shift by maintaining the same aspect ratio.
 */
export function SafeImg({
  src,
  alt,
  className,
  fallback,
  ...props
}: SafeImgProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface2 text-muted",
          className,
        )}
        aria-label={alt || "Image failed to load"}
        role="img"
      >
        {fallback ?? (
          <svg
            className="h-8 w-8 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <>
      {!loaded && !error && (
        <div
          className={cn(
            "animate-pulse bg-surface2",
            className,
          )}
          aria-hidden="true"
        />
      )}
      {!error && (
        <img
          src={src}
          alt={alt || ""}
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          className={cn(
            "transition-opacity duration-300",
            !loaded && "absolute opacity-0",
            loaded && "opacity-100",
            className,
          )}
          {...props}
        />
      )}
    </>
  );
}
