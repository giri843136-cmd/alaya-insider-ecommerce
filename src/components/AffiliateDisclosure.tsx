/**
 * ALAYA INSIDER — FTC Affiliate Disclosure (PR-12 Compliance)
 * --------------------------------------------------------------------------
 * Displays FTC-compliant affiliate link disclosure on product pages
 * and anywhere affiliate links appear. Meets Amazon Associates and
 * FTC endorsement guidelines.
 */

import { Handshake, Info } from "lucide-react";

interface AffiliateDisclosureProps {
  /** Provider name (e.g., "Amazon", "ShareASale", "Rakuten") */
  provider?: string;
  /** Whether to show the compact inline variant */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function AffiliateDisclosure({
  provider,
  compact = false,
  className = "",
}: AffiliateDisclosureProps) {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[0.6rem] text-muted ${className}`}
        title="Affiliate disclosure"
      >
        <Info className="h-2.5 w-2.5" />
        {provider ? `${provider} affiliate` : "Affiliate link"}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200 ${className}`}
      role="note"
      aria-label="Affiliate disclosure"
    >
      <div className="flex items-start gap-2">
        <Handshake className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">
            {provider ? `${provider} Affiliate Disclosure` : "Affiliate Disclosure"}
          </p>
          <p className="mt-0.5 opacity-80">
            {provider
              ? `ALAYA INSIDER is a participant in the ${provider} Services LLC Associates Program, an affiliate advertising program designed to provide a means for us to earn fees by linking to ${provider}.com and affiliated sites.`
              : "ALAYA INSIDER participates in various affiliate marketing programs, which means we may earn commissions on purchases made through our links to retailer sites. This does not affect the price you pay."}
          </p>
          <p className="mt-0.5 opacity-80">
            We only recommend products we genuinely believe in. All opinions are our own.
          </p>
        </div>
      </div>
    </div>
  );
}
