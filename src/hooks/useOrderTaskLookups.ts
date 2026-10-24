"use client";

import { useEffect, useState } from "react";
import { listAll } from "@/lib/api";
import { ApiTask } from "@/types/warehouse";
import { scopeStocks } from "@/lib/warehouseScope";

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

export function useOrderTaskLookups(
  enabled: boolean,
  warehouseId?: number | null,
) {
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
        const [taskList, stockList] = await Promise.all([
          listAll<ApiTask>("/tasks/api/v1/tasks/"),
          listAll<ApiOrderTaskStockProduct>("/warehouse/api/v1/process/stock/",
            warehouseId != null ? { warehouse_id: warehouseId } : {},
          ),
        ]);

        if (!mounted) return;

        setTasks(taskList);
        setProducts(
          warehouseId != null ? scopeStocks(stockList, warehouseId) : stockList,
        );
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
  }, [enabled, warehouseId]);

  return {
    tasks,
    products,
    loading,
    error,
  };
}

export default useOrderTaskLookups;
