"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { ApiProduct, ApiTask } from "@/types/warehouse";
import { extractList } from "@/utils/warehouseEmployee";

export function useOrderTaskLookups(enabled: boolean) {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [tasksRes, productsRes] = await Promise.all([
          axiosInstance.get("/tasks/api/v1/tasks/"),
          axiosInstance.get("/warehouse/api/v1/products/"),
        ]);

        if (!mounted) return;

        setTasks(extractList<ApiTask>(tasksRes.data));
        setProducts(extractList<ApiProduct>(productsRes.data));
      } catch {
        if (!mounted) return;

        setTasks([]);
        setProducts([]);
        setError("دریافت اطلاعات تسک‌ها و محصولات با خطا مواجه شد.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return {
    tasks,
    products,
    loading,
    error,
  };
}

export default useOrderTaskLookups;
