import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/utils/cn";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../lib/utils";

/* --------------------------------- Money -------------------------------- */
export function Money({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const { settings } = useStore();
  return <span className={className}>{formatPrice(amount, settings.currency)}</span>;
}

export function Price({
  price,
  salePrice,
  className,
  priceClassName,
}: {
  price: number;
  salePrice?: number | null;
  className?: string;
  priceClassName?: string;
}) {
  const { settings } = useStore();
  const onSale = salePrice != null && salePrice < price;
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold", onSale && "text-danger", priceClassName)}>
        {formatPrice(onSale ? salePrice! : price, settings.currency)}
      </span>
      {onSale && (
        <span className="text-sm text-muted line-through">
          {formatPrice(price, settings.currency)}
        </span>
      )}
    </span>
  );
}

/* -------------------------------- Rating -------------------------------- */
export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const floor = Math.floor(rating);
  const hasHalf = rating - floor >= 0.25 && rating - floor < 0.75;
  const full = rating - floor >= 0.75 ? floor + 1 : floor;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-accent", className)}
      aria-label={`Rated ${rating} out of 5`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} width={size} height={size} fill="currentColor" strokeWidth={0} />;
        if (i === full && hasHalf) return <StarHalf key={i} width={size} height={size} fill="currentColor" strokeWidth={0} />;
        return <Star key={i} width={size} height={size} className="text-line" strokeWidth={1.5} />;
      })}
    </span>
  );
}

export function RatingInline({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Stars rating={rating} />
      <span className="font-medium text-ink">{rating.toFixed(1)}</span>
      {count != null && <span>({count})</span>}
    </span>
  );
}

/* -------------------------------- Spinner ------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin-slow h-5 w-5 text-accent", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-7 w-7" />
      <p className="text-sm tracking-wide">{label}…</p>
    </div>
  );
}

/* ------------------------------- Button ------------------------------- */
type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "accent-soft" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  dark: "btn-dark",
  outline: "btn-outline",
  ghost: "btn-ghost",
  "accent-soft": "btn-accent-soft",
  success: "btn-success",
  danger: "btn-danger",
};
const SIZE_CLASS: Record<ButtonSize, string> = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" };

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}) {
  return (
    <button
      className={cn(VARIANT_CLASS[variant], SIZE_CLASS[size], loading && "btn-loading", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

/* ------------------------------- Skeleton ------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

/* ------------------------------ Empty state ----------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl2)] border border-dashed border-line bg-surface2/50 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------- Badges -------------------------------- */
type BadgeVariant = "sale" | "new" | "bestseller" | "digital" | "affiliate" | "lowstock" | "success" | "info" | "warning" | "neutral";
const BADGE_STYLES: Record<BadgeVariant, string> = {
  sale: "bg-danger text-white",
  new: "bg-accent text-accent-ink",
  bestseller: "bg-ink text-canvas",
  digital: "bg-success/15 text-success",
  affiliate: "bg-accent-soft text-accent",
  lowstock: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
  neutral: "bg-surface2 text-muted border border-line",
};
export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("badge", BADGE_STYLES[variant], className)}>{children}</span>;
}

/* ------------------------------ Breadcrumbs ----------------------------- */
export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="text-line">/</span>}
            {item.to ? (
              <a href={`#${item.to}`} className="transition-colors hover:text-accent">
                {item.label}
              </a>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* --------------------------- Quantity selector -------------------------- */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const btn =
    size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-surface",
        disabled && "opacity-50"
      )}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={cn(btn, "grid place-items-center rounded-l-full text-ink transition-colors hover:bg-surface2 disabled:hover:bg-transparent")}
      >
        −
      </button>
      <span
        aria-live="polite"
        className={cn("min-w-[2rem] text-center text-sm font-semibold tabular-nums", size === "sm" ? "py-1" : "py-2")}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={cn(btn, "grid place-items-center rounded-r-full text-ink transition-colors hover:bg-surface2 disabled:hover:bg-transparent")}
      >
        +
      </button>
    </div>
  );
}

/* ----------------------------- Section head ----------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center text-center"
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
        <h2 className="text-3xl font-semibold text-ink sm:text-4xl text-balance">{title}</h2>
        {subtitle && <p className="mt-3 text-pretty text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* -------------------------------- Dialog -------------------------------- */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscapeKeySafe(onClose, open);
  useLockBodySafe(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <div className="mt-3 text-sm text-muted">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------- Toggle -------------------------------- */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("inline-flex items-center gap-2", disabled && "opacity-50 pointer-events-none")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="toggle-switch"
      />
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
    </label>
  );
}

/* ----------------------------- ProgressBar ----------------------------- */
export function ProgressBar({
  value,
  max = 100,
  variant = "accent",
  className,
  label,
}: {
  value: number;
  max?: number;
  variant?: "accent" | "success" | "warning" | "danger";
  className?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isIndeterminate = value < 0;
  return (
    <div className={cn("flex items-center gap-3", className)} role="progressbar" aria-valuenow={isIndeterminate ? undefined : value} aria-valuemin={0} aria-valuemax={max}>
      <div className="progress-bar flex-1">
        <div
          className={cn(
            "progress-bar-fill",
            isIndeterminate && "animate-progress",
            variant !== "accent" && variant
          )}
          style={{ width: isIndeterminate ? "40%" : `${pct}%` }}
        />
      </div>
      {label && <span className="text-xs font-medium tabular-nums text-muted shrink-0">{label}</span>}
    </div>
  );
}

/* ------------------------------- Tooltip ------------------------------- */
export function Tooltip({
  content,
  children,
  position = "top",
}: {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}) {
  const positions: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-canvas opacity-0 transition-all duration-200 group-hover:opacity-100",
          positions[position]
        )}
      >
        {content}
      </span>
    </span>
  );
}

/* ----------------------------- StatusDot ------------------------------ */
export function StatusDot({
  status,
  label,
}: {
  status: "success" | "warning" | "danger" | "info" | "neutral";
  label?: string;
}) {
  const colors: Record<string, string> = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-muted",
  };
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={label}>
      <span className={cn("h-2 w-2 rounded-full", colors[status])} />
      {label && <span className="text-xs text-muted">{label}</span>}
    </span>
  );
}

// local safe wrappers to keep ui.tsx dependency-light
import { useEscapeKey, useLockBody } from "../lib/hooks";
function useEscapeKeySafe(cb: () => void, active: boolean) {
  useEscapeKey(cb, active);
}
function useLockBodySafe(active: boolean) {
  useLockBody(active);
}
