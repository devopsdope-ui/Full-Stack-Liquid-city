import { useState, useEffect, useRef, useCallback } from 'react';
import type { ApiError } from '../types';

interface UsePollingOptions {
  interval?: number; // ms, default 30000
  enabled?: boolean;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Store fetchFn in a ref so changing it never triggers useEffect re-runs
  // (prevents the inline-arrow-fn → new ref every render → interval reset → glitch loop)
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether this is the very first fetch so we only show loading spinner once
  const isFirstFetchRef = useRef(true);

  const execute = useCallback(async () => {
    try {
      const result = await fetchFnRef.current();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
        isFirstFetchRef.current = false;
      }
    } catch (err) {
      if (mountedRef.current) {
        // Only set error if we have no data yet (first load failure)
        // On subsequent poll failures keep showing stale data, not error banner
        if (isFirstFetchRef.current) {
          setError(err as ApiError);
        }
        setLoading(false);
        isFirstFetchRef.current = false;
      }
    }
  }, []); // stable — no deps needed because we use refs

  useEffect(() => {
    mountedRef.current = true;
    isFirstFetchRef.current = true;
    setLoading(true);

    if (!enabled) {
      setLoading(false);
      return;
    }

    execute();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(execute, interval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, enabled]); // intentionally omit `execute` — it's already stable

  return { data, loading, error, refetch: execute };
}

export function useAsync<T>(fetchFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

