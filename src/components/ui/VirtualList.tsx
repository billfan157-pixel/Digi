import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type VirtualItem = {
  index: number;
  start: number;
  size: number;
};

type VirtualListProps<T> = {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  className?: string;
  containerClassName?: string;
  emptyMessage?: string;
  loadingComponent?: ReactNode;
};

const canUseDOM = typeof window !== 'undefined';

export function VirtualList<T>({
  items,
  estimateSize = 100,
  overscan = 3,
  renderItem,
  getItemKey,
  className,
  containerClassName,
  emptyMessage,
  loadingComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observersRef = useRef<Map<number, ResizeObserver>>(new Map());
  const [itemSizes, setItemSizes] = useState<Map<number, number>>(() => new Map());
  const [viewport, setViewport] = useState({
    height: canUseDOM ? window.innerHeight : 0,
    listTop: 0,
    scrollTop: canUseDOM ? window.scrollY : 0,
  });

  const updateViewport = useCallback(() => {
    if (!canUseDOM) return;

    const rect = containerRef.current?.getBoundingClientRect();
    const nextViewport = {
      height: window.innerHeight,
      listTop: rect ? rect.top + window.scrollY : 0,
      scrollTop: window.scrollY,
    };

    setViewport((current) => {
      if (
        current.height === nextViewport.height &&
        current.listTop === nextViewport.listTop &&
        current.scrollTop === nextViewport.scrollTop
      ) {
        return current;
      }
      return nextViewport;
    });
  }, []);

  const setContainerRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    if (element) updateViewport();
  }, [updateViewport]);

  useEffect(() => {
    if (!canUseDOM) return;

    window.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [updateViewport]);

  // Cleanup ResizeObservers on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      observersRef.current.forEach((observer) => observer.disconnect());
      // eslint-disable-next-line react-hooks/exhaustive-deps
      observersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset sizes when items count changes significantly
  useEffect(() => {
    setItemSizes((current) => {
      let changed = false;
      const next = new Map(current);
      next.forEach((_, index) => {
        if (index >= items.length) {
          next.delete(index);
          observersRef.current.get(index)?.disconnect();
          observersRef.current.delete(index);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [items.length]);

  const layout = useMemo(() => {
    const starts: number[] = [];
    const sizes: number[] = [];
    let totalSize = 0;

    for (let index = 0; index < items.length; index += 1) {
      starts[index] = totalSize;
      const size = itemSizes.get(index) ?? estimateSize;
      sizes[index] = size;
      totalSize += size;
    }

    return { starts, sizes, totalSize };
  }, [estimateSize, items.length, itemSizes]);

  const virtualItems = useMemo<VirtualItem[]>(() => {
    if (items.length === 0) return [];

    const startBoundary = Math.max(0, viewport.scrollTop - viewport.listTop - estimateSize * overscan);
    const endBoundary = viewport.scrollTop - viewport.listTop + viewport.height + estimateSize * overscan;

    let startIndex = 0;
    while (
      startIndex < items.length &&
      layout.starts[startIndex] + layout.sizes[startIndex] < startBoundary
    ) {
      startIndex += 1;
    }

    let endIndex = startIndex;
    while (endIndex < items.length && layout.starts[endIndex] < endBoundary) {
      endIndex += 1;
    }

    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(items.length, Math.max(endIndex + overscan, startIndex + 1));

    return Array.from({ length: endIndex - startIndex }, (_, offset) => {
      const index = startIndex + offset;
      return {
        index,
        start: layout.starts[index],
        size: layout.sizes[index],
      };
    });
  }, [estimateSize, items.length, layout, overscan, viewport]);

  const measureElement = useCallback((index: number, element: HTMLDivElement | null) => {
    observersRef.current.get(index)?.disconnect();
    observersRef.current.delete(index);

    if (!element) return;

    const updateSize = () => {
      const nextSize = Math.ceil(element.getBoundingClientRect().height);
      if (nextSize <= 0) return;

      setItemSizes((current) => {
        if (current.get(index) === nextSize) return current;

        const next = new Map(current);
        next.set(index, nextSize);
        return next;
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    observersRef.current.set(index, observer);
  }, []);

  if (items.length === 0) {
    return (
      <div className={containerClassName}>
        {loadingComponent || (
          <div className="text-center py-8 text-slate-400 text-sm">
            {emptyMessage || 'Không có dữ liệu'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={setContainerRef} className={containerClassName} style={{ height: layout.totalSize }}>
      {virtualItems.map(({ index, start }) => {
        const item = items[index];
        if (!item) return null;

        return (
          <div
            key={getItemKey(item, index)}
            ref={(element) => measureElement(index, element)}
            className={className}
            style={{ transform: `translateY(${start}px)` }}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
    </div>
  );
}

export const VirtualListMemo = memo(VirtualList) as typeof VirtualList;
