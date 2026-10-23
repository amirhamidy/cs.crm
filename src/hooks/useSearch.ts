"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";

interface Options {
  delay?: number;
  minLength?: number;
  enabled?: boolean;
  deps?: DependencyList;
}

export function useSearch<T>(
  fetcher: (q: string) => Promise<T[]>,
  opts: Options = {},
) {
  const { delay = 300, minLength = 0, enabled = true, deps = [] } = opts;

  const [query, setQuery] = useState("");
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  const reqId = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    const id = ++reqId.current;
    const q = query.trim();

    if (!enabled || q.length < minLength) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const t = setTimeout(
      () => {
        fetcherRef
          .current(q)
          .then((res) => {
            if (id === reqId.current) setData(res);
          })
          .catch((err) => {
            if (id === reqId.current) {
              setError(err);
              setData([]);
            }
          })
          .finally(() => {
            if (id === reqId.current) setLoading(false);
          });
      },
      q ? delay : 0,
    );

    return () => clearTimeout(t);
  }, [query, delay, minLength, enabled, tick, depsKey]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  return { query, setQuery, data, loading, error, refetch };
}
