"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Paginated } from "@/types/pagination";

export interface InfiniteParams {
  page: number;
  page_size: number;
  search?: string;
}

export type InfiniteFetcher<T> = (
  params: InfiniteParams,
  signal: AbortSignal,
) => Promise<Paginated<T>>;

interface Options {
  
  enabled?: boolean;
  pageSize?: number;
  
  delay?: number;
  
  depsKey?: string | number | null;
}

const normalize = (q: string) => q.trim().replace(/\s+/g, " ");


export function useInfiniteOptions<T extends { id: number | string }>(
  fetcher: InfiniteFetcher<T>,
  { enabled = true, pageSize = 20, delay = 300, depsKey = null }: Options = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const pageRef = useRef(1);
  const reqId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const key = useMemo(() => `${depsKey ?? ""}|${appliedSearch}`, [depsKey, appliedSearch]);

  
  useEffect(() => {
    const q = normalize(search);
    if (q === appliedSearch) return;
    const t = setTimeout(() => setAppliedSearch(q), delay);
    return () => clearTimeout(t);
  }, [search, appliedSearch, delay]);

  const run = useCallback(
    async (page: number, append: boolean) => {
      const id = ++reqId.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      busyRef.current = true;
      setError(false);
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetcherRef.current(
          { page, page_size: pageSize, search: appliedSearch || undefined },
          controller.signal,
        );
        if (id !== reqId.current) return;

        pageRef.current = page;
        setHasMore(Boolean(res.next));
        setItems((prev) => {
          if (!append) return res.results;
          const seen = new Set(prev.map((i) => String(i.id)));
          return [...prev, ...res.results.filter((i) => !seen.has(String(i.id)))];
        });
      } catch (err: unknown) {
        const e = err as { code?: string; name?: string };
        if (id !== reqId.current) return;
        if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError") return;
        if (!append) {
          setItems([]);
          setHasMore(false);
          loadedKeyRef.current = null; 
        }
        setError(true);
      } finally {
        if (id === reqId.current) {
          busyRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [pageSize, appliedSearch],
  );

  
  useEffect(() => {
    if (!enabled) return;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setItems([]);
    setHasMore(false);
    void run(1, false);
  }, [enabled, key, run]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const loadMore = useCallback(() => {
    if (!hasMore || busyRef.current) return;
    void run(pageRef.current + 1, true);
  }, [hasMore, run]);

  const retry = useCallback(() => {
    loadedKeyRef.current = null;
    setItems([]);
    void run(1, false);
    loadedKeyRef.current = key;
  }, [run, key]);

  return { items, search, setSearch, loading, loadingMore, hasMore, error, loadMore, retry };
}
