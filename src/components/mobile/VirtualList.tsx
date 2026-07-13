import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  className,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{ overflow: "auto", height: "100%", willChange: "scroll-position" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)`, willChange: "transform" }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Virtual Grid                                                        */
/* ------------------------------------------------------------------ */

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  columns: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  itemHeight,
  columns,
  gap = 8,
  overscan = 3,
  className,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap);
  const rowHeight = itemHeight + gap;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(rows, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{ overflow: "auto", height: "100%", willChange: "scroll-position" }}
    >
      <div
        style={{
          height: totalHeight,
          position: "relative",
          display: "flex",
          flexWrap: "wrap",
          gap,
          alignContent: "flex-start",
        }}
      >
        {Array.from({ length: endRow - startRow }, (_, rowIndex) => {
          const actualRow = startRow + rowIndex;
          const startIdx = actualRow * columns;
          const rowItems = items.slice(startIdx, startIdx + columns);
          return (
            <div
              key={actualRow}
              style={{
                display: "contents",
                transform: `translateY(${actualRow * rowHeight}px)`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div
                  key={startIdx + colIndex}
                  style={{
                    width: `calc((100% - ${gap * (columns - 1)}px) / ${columns})`,
                    height: itemHeight,
                  }}
                >
                  {renderItem(item, startIdx + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
