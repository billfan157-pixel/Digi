import { useState, useEffect, useRef } from 'react';

interface SWROptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
}

const swrCache = new Map<string, { data: unknown; timestamp: number }>();

export function useStaleWhileRevalidate<T>({ key, fetcher, staleTime = 60000, cacheTime = 300000 }: SWROptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const revalidateRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = swrCache.get(key);
      const now = Date.now();

      if (cached && now - cached.timestamp < staleTime) {
        if (!cancelled) {
          setData(cached.data as T);
          setIsLoading(false);
        }
        return;
      }

      if (cached && now - cached.timestamp < cacheTime) {
        setData(cached.data as T);
        setIsLoading(false);
        revalidateRef.current = true;
      }

      try {
        const result = await fetcher();
        swrCache.set(key, { data: result, timestamp: Date.now() });
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [key, fetcher, staleTime, cacheTime]);

  return { data, isLoading, error };
}
