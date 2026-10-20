"use client";

import { useEffect, useState } from "react";
import { fetchShelves } from "@/lib/warehouseShelfApi";
import type { ShelfSummary } from "@/types/warehouseShelf";

export function useWarehouseShelves(enabled: boolean, reloadKey = 0) {
  const [shelves, setShelves] = useState<ShelfSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setLoading(true);

    fetchShelves(controller.signal)
      .then((list) => {
        if (!controller.signal.aborted) setShelves(list);
      })
      .catch(() => {
        if (!controller.signal.aborted) setShelves([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, reloadKey]);

  return { shelves, loading };
}
