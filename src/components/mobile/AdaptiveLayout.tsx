import { type ReactNode } from "react";
import { getDeviceInfo } from "@/lib/mobilePlatform";
import { cn } from "@/utils/cn";

interface AdaptiveLayoutProps {
  children: ReactNode;
  className?: string;
  mobile?: "stack" | "grid" | "scroll";
  tablet?: "stack" | "grid" | "scroll";
  desktop?: "stack" | "grid" | "scroll";
}

export function AdaptiveLayout({
  children,
  className,
  mobile = "stack",
  tablet = "grid",
  desktop = "grid",
}: AdaptiveLayoutProps) {
  const info = getDeviceInfo();
  const _isMobile = info.category === "mobile";
  const _isTablet = info.category === "tablet";

  let layout = desktop;
  if (_isMobile) layout = mobile;
  else if (_isTablet) layout = tablet;

  return (
    <div
      className={cn(
        layout === "stack" && "flex flex-col",
        layout === "grid" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        layout === "scroll" && "flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scrollbar",
        className
      )}
    >
      {children}
    </div>
  );
}
