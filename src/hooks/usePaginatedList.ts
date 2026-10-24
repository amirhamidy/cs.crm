"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Paginated, SearchParams } from "@/types/pagination";

export type ListFilters = Record<
  string,
  string | number | boolean | null | undefined
>;

export type PaginatedFetcher<T, F extends ListFilters> = (
  params: SearchParams & F,
  signal: AbortSignal,
) => Promise<Paginated<T>>;

interface Options<F extends ListFilters> {
  pageSize?: number;
  filters?: F;
  search?: string;
  delay?: number;
  enabled?: boolean;
  initialPage?: number;
}

const normalize = (q: string) => q.trim().replace(/\s+/g, " ");

export function usePaginatedList<T, F extends ListFilters = ListFilters>(
  fetcher: PaginatedFetcher<T, F>,
  opts: Options<F> = {},
) {
  const {
    pageSize = 20,
    filters: initialFilters,
    search: initialSearch = "",
    delay = 300,
    enabled = true,
    initialPage = 1,
  } = opts;

  const [page, setPageState] = useState(initialPage);
  const [search, setSearchState] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(normalize(initialSearch));
  const [filters, setFiltersState] = useState<F>(
    (initialFilters ?? {}) as F,
  );
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  const reqId = useRef(0);
  const fetcherRef = useRef(fetcher);
  const filtersRef = useRef(filters);
  const controllerRef = useRef<AbortController | null>(null);
  const firstSearch = useRef(true);

  useEffect(() => {
    fetcherRef.current = fetcher;
    filtersRef.current = filters;
  });

  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const q = normalize(search);
    if (q === appliedSearch) return;
    const t = setTimeout(() => {
      setAppliedSearch(q);
      setPageState(1);
    }, delay);
    return () => clearTimeout(t);
  }, [search, delay, appliedSearch]);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const id = ++reqId.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    const params = {
      ...filtersRef.current,
      page,
      page_size: pageSize,
      search: appliedSearch || undefined,
    } as SearchParams & F;

    fetcherRef
      .current(params, controller.signal)
      .then((res) => {
        if (id !== reqId.current) return;
        if (res.results.length === 0 && page > 1) {
          const last = Math.max(1, Math.ceil(res.count / pageSize));
          setPageState(Math.min(page - 1, last));
          return;
        }
        setData(res.results);
        setCount(res.count);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== reqId.current) return;
        setError(err);
        setData([]);
        setCount(0);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [page, pageSize, appliedSearch, filtersKey, enabled, tick]);

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, p));
  }, []);

  const setSearch = useCallback((q: string) => {
    setSearchState(q);
  }, []);

  const setFilters = useCallback(
    (next: Partial<F> | ((prev: F) => F)) => {
      setFiltersState((prev) =>
        typeof next === "function" ? next(prev) : { ...prev, ...next },
      );
      setPageState(1);
    },
    [],
  );

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize],
  );

  return {
    data,
    count,
    page,
    pageSize,
    totalPages,
    search,
    filters,
    loading,
    error,
    setPage,
    setSearch,
    setFilters,
    refetch,
  };
}
