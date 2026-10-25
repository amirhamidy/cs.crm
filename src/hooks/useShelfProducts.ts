"use client";

import { useEffect, useState } from "react";
import { PAGE_SIZE } from "@/lib/warehouseApi";
import { fetchProductsByShelf } from "@/lib/warehouseShelfApi";
import type { ApiProduct } from "@/types/warehouse";

type Options = {
  shelfCode: string;
  page: number;
  enabled: boolean;
  reloadKey?: number;
};

export function useShelfProducts({
  shelfCode,
  page,
  enabled,
  reloadKey = 0,
}: Options) {
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !shelfCode) {
      setItems([]);
      setTotalPages(1);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchProductsByShelf(shelfCode, page, controller.signal)
      .then((result: { items: ApiProduct[]; count: number }) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setTotalPages(Math.max(1, Math.ceil(result.count / PAGE_SIZE)));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setItems([]);
        setTotalPages(1);
        setError("دریافت محصولات این قفسه انجام نشد");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, shelfCode, page, reloadKey]);

  return { items, totalPages, loading, error };
}
