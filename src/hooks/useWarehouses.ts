"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWarehouses } from "@/lib/warehouseApi";
import type { ApiWarehouse } from "@/types/warehouse";

export default function useWarehouses() {
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setWarehouses(await fetchWarehouses());
    } catch {
      setWarehouses([]);
      setError("دریافت لیست انبارها با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { warehouses, loading, error, reload };
}
