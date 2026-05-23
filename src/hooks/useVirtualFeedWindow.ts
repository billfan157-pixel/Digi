import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseVirtualFeedWindowArgs = {
  itemCount: number;
  estimateSize?: number;
  overscan?: number;
};

export type VirtualFeedWindowItem = {
  index: number;
  start: number;
  size: number;
};

const canUseDOM = typeof window !== 'undefined';

export function useVirtualFeedWindow({
  itemCount,
  estimateSize = 420,
  overscan = 4,
}: UseVirtualFeedWindowArgs) {
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

  useEffect(() => () => {
    observersRef.current.forEach((observer) => observer.disconnect());
    observersRef.current.clear();
  }, []);

  useEffect(() => {
    setItemSizes((current) => {
      let changed = false;
      const next = new Map(current);
      next.forEach((_, index) => {
        if (index >= itemCount) {
          next.delete(index);
          observersRef.current.get(index)?.disconnect();
          observersRef.current.delete(index);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [itemCount]);

  const layout = useMemo(() => {
    const starts: number[] = [];
    const sizes: number[] = [];
    let totalSize = 0;

    for (let index = 0; index < itemCount; index += 1) {
      starts[index] = totalSize;
      const size = itemSizes.get(index) ?? estimateSize;
      sizes[index] = size;
      totalSize += size;
    }

    return { starts, sizes, totalSize };
  }, [estimateSize, itemCount, itemSizes]);

  const virtualItems = useMemo<VirtualFeedWindowItem[]>(() => {
    if (itemCount === 0) return [];

    const startBoundary = Math.max(0, viewport.scrollTop - viewport.listTop - estimateSize * overscan);
    const endBoundary = viewport.scrollTop - viewport.listTop + viewport.height + estimateSize * overscan;

    let startIndex = 0;
    while (
      startIndex < itemCount &&
      layout.starts[startIndex] + layout.sizes[startIndex] < startBoundary
    ) {
      startIndex += 1;
    }

    let endIndex = startIndex;
    while (endIndex < itemCount && layout.starts[endIndex] < endBoundary) {
      endIndex += 1;
    }

    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(itemCount, Math.max(endIndex + overscan, startIndex + 1));

    return Array.from({ length: endIndex - startIndex }, (_, offset) => {
      const index = startIndex + offset;
      return {
        index,
        start: layout.starts[index],
        size: layout.sizes[index],
      };
    });
  }, [estimateSize, itemCount, layout, overscan, viewport]);

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

  return {
    containerRef: setContainerRef,
    measureElement,
    totalSize: layout.totalSize,
    virtualItems,
  };
}
