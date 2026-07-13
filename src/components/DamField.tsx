/**
 * ALAYA INSIDER — DAM Field Component
 * -----------------------------------------------------------------------
 * A reusable form field that opens the Global Media Picker (DAM) to
 * select images. Use this in ANY admin form instead of raw URL inputs.
 *
 * Features:
 * - Click the image/button to open the DAM picker
 * - Shows thumbnail preview of selected image(s)
 * - Supports single and multi-select
 * - Clear button to remove selected image
 * - Uses useMediaPicker() hook from DamPicker
 *
 * @example
 * ```tsx
 * <DamField
 *   label="Product images"
 *   value={form.images}
 *   onChange={(urls) => set("images", urls.join("\n"))}
 *   purpose="Product gallery"
 *   source="product"
 *   folder="Products"
 *   multiple
 * />
 * ```
 */
import { Image as ImageIcon, X } from "lucide-react";
import { useMediaPicker } from "./DamPicker";
import { cn } from "@/utils/cn";

interface DamFieldProps {
  /** Label for the field */
  label: string;
  /** Current value — single URL, array of URLs, or newline-separated URLs */
  value: string | string[];
  /** Called with the selected URL(s) — single string or array */
  onChange: (value: any) => void;
  /** Purpose label shown in the picker */
  purpose: string;
  /** Source context (e.g. "product", "brand", "article") */
  source?: string;
  /** Target folder in the DAM */
  folder?: string;
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  /** Accepted file type hint */
  accept?: string;
  /** Aspect ratio hint */
  aspectRatio?: string;
  /** Optional helper text */
  helpText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Optional class name */
  className?: string;
  /** Show as a compact inline field (for hero slides, etc.) */
  compact?: boolean;
}

export function DamField({
  label,
  value,
  onChange,
  purpose,
  source,
  folder,
  multiple = false,
  accept,
  aspectRatio,
  helpText,
  required,
  className,
  compact,
}: DamFieldProps) {
  const { openPicker, Picker } = useMediaPicker();

  // Normalize value to array of URLs
  const urls: string[] = Array.isArray(value)
    ? value
    : value
      ? value.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

  const handleSelect = (selectedUrls: string[]) => {
    if (multiple) {
      onChange(selectedUrls.join("\n"));
    } else {
      onChange(selectedUrls[0] || "");
    }
  };

  const openPickerHandler = () => {
    openPicker({
      purpose,
      source: source as any,
      folder: folder as any,
      multiple,
      accept,
      aspectRatio,
      onSelect: handleSelect,
      currentUrls: urls,
    });
  };

  const removeUrl = (url: string) => {
    const updated = urls.filter((u) => u !== url);
    onChange(multiple ? updated.join("\n") : updated[0] || "");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="label-field">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>

      <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
        {/* Thumbnail preview */}
        {urls.length > 0 ? (
          <div className={cn("flex flex-wrap gap-2", !compact && "mb-2")}>
            {urls.slice(0, multiple ? 6 : 1).map((url, i) => (
              <div key={i} className="group relative">
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "rounded-lg border border-line object-cover",
                    compact ? "h-10 w-10" : "h-16 w-14",
                  )}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeUrl(url)}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {multiple && urls.length > 6 && (
              <div className="flex h-16 w-14 items-center justify-center rounded-lg border border-line bg-surface2 text-xs text-muted">
                +{urls.length - 6}
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-line bg-surface2/30 text-muted transition-colors hover:border-accent hover:bg-accent-soft/20",
              compact ? "h-10 w-10" : "h-16 w-14",
            )}
            onClick={openPickerHandler}
          >
            <ImageIcon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
          </div>
        )}

        {/* Buttons */}
        <div className={cn("flex gap-2", compact && "flex-1")}>
          <button
            type="button"
            onClick={openPickerHandler}
            className="btn-outline btn-sm"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {urls.length > 0 ? "Change" : multiple ? "Choose images" : "Choose image"}
          </button>
          {!compact && urls.length > 0 && (
            <button
              type="button"
              onClick={() => onChange(multiple ? "" : "")}
              className="btn-ghost btn-sm text-danger hover:bg-danger/10"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {helpText && <p className="text-xs text-muted">{helpText}</p>}

      {Picker}
    </div>
  );
}
