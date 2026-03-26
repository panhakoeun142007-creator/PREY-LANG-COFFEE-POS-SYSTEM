import { useCallback, useEffect, useRef, useState } from 'react';

// Re-export all hooks
export { useLiveOrders, useOrderHistory, useCreateOrder } from './useOrders';
export { useProducts } from './useProducts';

/**
 * Generic debounce hook for performance optimization.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for local storage persistence.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for polling data at regular intervals.
 */
export function usePolling<T>(fetchFn: () => Promise<T>, intervalMs: number, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [fetchData, intervalMs, enabled]);

  return { data, loading, error, refresh: fetchData };
}

type AutoRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
  immediate?: boolean;
  refreshOnFocus?: boolean;
  refreshOnVisible?: boolean;
};

/**
 * Hook for keeping page data fresh without a manual browser refresh.
 */
export function useAutoRefresh(
  refreshFn: () => Promise<unknown> | void,
  {
    enabled = true,
    intervalMs = 10000,
    immediate = true,
    refreshOnFocus = true,
    refreshOnVisible = true,
  }: AutoRefreshOptions = {},
) {
  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  const runRefresh = useCallback(() => {
    return refreshRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      void runRefresh();
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, immediate, intervalMs, runRefresh]);

  useEffect(() => {
    if (!enabled || !refreshOnFocus) return;

    const handleFocus = () => {
      void runRefresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, refreshOnFocus, runRefresh]);

  useEffect(() => {
    if (!enabled || !refreshOnVisible) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refreshOnVisible, runRefresh]);
}
