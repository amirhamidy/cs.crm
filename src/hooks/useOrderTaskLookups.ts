"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { ApiTask } from "@/types/warehouse";
import { extractList } from "@/utils/warehouseEmployee";

export interface ApiOrderTaskStockProduct {
  id: number;
  product: number;
  product_name: string;
  initial_quantity: number;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_label: string;
  performed_by: {
    id: number;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export function useOrderTaskLookups(enabled: boolean) {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [products, setProducts] = useState<ApiOrderTaskStockProduct[]>([]);
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
          axiosInstance.get("/warehouse/api/v1/process/stock/"),
        ]);

        if (!mounted) return;

        setTasks(extractList<ApiTask>(tasksRes.data));
        setProducts(extractList<ApiOrderTaskStockProduct>(productsRes.data));
      } catch {
        if (!mounted) return;

        setTasks([]);
        setProducts([]);
        setError("دریافت اطلاعات تسک‌ها و موجودی انبار با خطا مواجه شد.");
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
