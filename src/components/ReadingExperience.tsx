/**
 * ALAYA INSIDER — Enhanced Reading Experience Components
 * --------------------------------------------------------
 * Reading progress bar, bookmarks, reading time, table of contents,
 * typography controls, focus mode, and reading history.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  List,
  ChevronUp,
  Eye,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useLocalStorage, usePrefersReducedMotion } from "../lib/hooks";
import { calculateReadingTime, generateTableOfContents } from "../lib/editorialPlatform";
import { formatDateTime } from "../lib/utils";

/* ------------------------------------------------------------------ */
/*  Reading Progress Bar                                               */
/* ------------------------------------------------------------------ */

interface ReadingProgressProps {
  articleId: string;
  body: string[];
  onComplete?: () => void;
}

export function ReadingProgress({ body, onComplete }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const reduced = usePrefersReducedMotion();

  // Track reading progress
  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
      setProgress(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  // Fire onComplete when reaching 90%
  useEffect(() => {
    if (progress >= 90 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [progress, onComplete]);

  const readTime = calculateReadingTime(body.join(" "));

  return (
    <>
      {/* Thin top progress bar */}
      <div className="fixed top-16 left-0 right-0 z-50 h-0.5 lg:top-20" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Reading progress">
        <div
          className="h-full bg-accent transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating reading stats (visible after scrolling) */}
      {progress > 5 && (
        <div className="fixed right-4 top-24 z-40 hidden flex-col items-center gap-2 md:flex">
          <div className="flex flex-col items-center gap-1 rounded-full glass px-3 py-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted" />
            <span className="font-mono tabular-nums text-muted">{readTime} min</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-full glass px-3 py-2 text-xs">
            <Eye className="h-3.5 w-3.5 text-muted" />
            <span className="font-mono tabular-nums text-muted">{progress}%</span>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Bookmark Button                                                   */
/* ------------------------------------------------------------------ */

interface BookmarkButtonProps {
  articleId: string;
  title?: string;
}

export function BookmarkButton({ articleId }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useLocalStorage<boolean>(`alaya_bm_${articleId}`, false);

  const toggle = useCallback(() => {
    setBookmarked((p) => !p);
  }, [setBookmarked]);

  return (
    <button
      onClick={toggle}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this article"}
      aria-pressed={bookmarked}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
        bookmarked
          ? "border-accent bg-accent-soft text-accent"
          : "border-line text-muted hover:border-accent hover:text-accent"
      )}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-3.5 w-3.5" fill="currentColor" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Reading History Tracker                                            */
/* ------------------------------------------------------------------ */

interface ReadingRecord {
  articleId: string;
  title: string;
  startedAt: number;
  lastReadAt: number;
  progress: number;
  completed: boolean;
}

const READING_HISTORY_KEY = "alaya_reading_history";

export function useReadingHistory() {
  const [history, setHistory] = useLocalStorage<ReadingRecord[]>(READING_HISTORY_KEY, []);

  const startReading = useCallback((articleId: string, title: string) => {
    setHistory((prev) => {
      const existing = prev.find((r) => r.articleId === articleId);
      if (existing) {
        return prev.map((r) =>
          r.articleId === articleId ? { ...r, lastReadAt: Date.now() } : r
        );
      }
      return [
        { articleId, title, startedAt: Date.now(), lastReadAt: Date.now(), progress: 0, completed: false },
        ...prev,
      ].slice(0, 50);
    });
  }, [setHistory]);

  const updateProgress = useCallback((articleId: string, progress: number) => {
    setHistory((prev) =>
      prev.map((r) =>
        r.articleId === articleId
          ? { ...r, progress, completed: progress >= 90, lastReadAt: Date.now() }
          : r
      )
    );
  }, [setHistory]);

  return { history, startReading, updateProgress };
}

/* ------------------------------------------------------------------ */
/*  Table of Contents                                                  */
/* ------------------------------------------------------------------ */

interface TableOfContentsProps {
  body: string[];
  className?: string;
}

export function TableOfContents({ body, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(false);

  const toc = useMemo(() => generateTableOfContents(body), [body]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl border border-line p-3 text-sm font-medium text-ink transition-colors hover:bg-surface2 lg:hidden"
      >
        <List className="h-4 w-4 text-accent" />
        Table of contents
        <ChevronUp className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <nav
        aria-label="Table of contents"
        className={cn(
          "space-y-1",
          open ? "mt-3 block lg:mt-0" : "hidden lg:block"
        )}
      >
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
              setActiveId(item.id);
            }}
            className={cn(
              "block rounded-lg px-3 py-1.5 text-sm transition-colors",
              item.level === 3 ? "ml-4" : "",
              activeId === item.id
                ? "bg-accent-soft text-accent font-medium"
                : "text-muted hover:text-ink hover:bg-surface2"
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reading Stats Card                                                */
/* ------------------------------------------------------------------ */

interface ReadingStatsCardProps {
  author: string;
  authorRole: string;
  readMinutes: number;
  publishedAt: number;
  wordCount?: number;
}

export function ReadingStatsCard({
  author,
  authorRole,
  readMinutes,
  publishedAt,
  wordCount,
}: ReadingStatsCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface2/40 p-4 text-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-accent" />
        <span className="text-muted">
          <span className="font-medium text-ink">{readMinutes} min</span> read
        </span>
      </div>
      {wordCount && (
        <span className="text-muted">
          <span className="font-medium text-ink">{wordCount.toLocaleString()}</span> words
        </span>
      )}
      <span className="text-muted">
        Published <span className="font-medium text-ink">{formatDateTime(publishedAt)}</span>
      </span>
      <span className="text-muted">
        By <span className="font-medium text-ink">{author}</span>
        {authorRole && <span> · {authorRole}</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Continue Reading Bar                                              */
/* ------------------------------------------------------------------ */

interface ContinueReadingProps {
  history: { articleId: string; title: string; progress: number }[];
  getArticleUrl: (id: string) => string;
}

export function ContinueReading({ history, getArticleUrl }: ContinueReadingProps) {
  const inProgress = history.filter((h) => h.progress > 0 && h.progress < 90).slice(0, 3);

  if (inProgress.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Clock className="h-4 w-4 text-accent" /> Continue reading
      </h3>
      <div className="mt-3 space-y-2">
        {inProgress.map((item) => (
          <a
            key={item.articleId}
            href={getArticleUrl(item.articleId)}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface2"
          >
            <span className="text-sm text-ink line-clamp-1">{item.title}</span>
            <span className="text-xs text-muted shrink-0 ml-3">{item.progress}%</span>
          </a>
        ))}
      </div>
    </div>
  );
}
