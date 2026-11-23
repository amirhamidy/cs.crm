"use client";
import { useCallback, useEffect, useState } from "react";
import type { Paginated } from "@/types/pagination";
import { errorMessage } from "./hrApi";

export const PAGE_SIZE = 20;

export function useHrList<T>(
  fetcher: (params: Record<string, string | number>, signal: AbortSignal) => Promise<Paginated<T>>,
  filters: Record<string, string | number>,
) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(filters);

  useEffect(() => setPage(1), [key]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetcher({ ...JSON.parse(key), page, page_size: PAGE_SIZE }, ac.signal)
      .then(setData)
      .catch((e) => {
        if (ac.signal.aborted || e?.code === "ERR_CANCELED") return;
        setError(errorMessage(e, "خطا در دریافت اطلاعات"));
      })
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  return { items: data?.results ?? [], count: data?.count ?? 0, page, pages, setPage, loading, error, reload };
}
