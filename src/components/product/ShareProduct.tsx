import { useState } from "react";
import { Share2, Copy, Check, Link as LinkIcon } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { cn } from "@/utils/cn";

/** Share + copy-link actions for a product. */
export function ShareProduct({ title }: { title: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied", "Share it anywhere.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy", "Copy the link from your browser bar.");
    }
  };

  const share = async () => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title, url: window.location.href });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={share} className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent">
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>
      <button onClick={copy} aria-label="Copy link" className={cn("grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent", copied && "border-success text-success")}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
        <LinkIcon className="h-3 w-3" /> Copy affiliate link
      </span>
    </div>
  );
}
