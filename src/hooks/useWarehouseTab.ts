"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PAGE_SIZE,
  WAREHOUSE_ENDPOINTS as EP,
  fetchAll,
  fetchPage,
  warehouseParams,
} from "@/lib/warehouseApi";
import { paginate, sameId } from "@/utils/warehouseEmployee";
import type {
  ApiArchivedOrderTask,
  ApiCategory,
  ApiOrderTask,
  ApiOrderTaskDeadline,
  ApiProduct,
  ApiStockInfo,
  ApiStockTransaction,
  ApiWarehouseStaff,
  ApiWarehouseTask,
} from "@/types/warehouse";

export type WarehouseTab =
  | "overview"
  | "products"
  | "tasks"
  | "stock"
  | "transactions"
  | "orders"
  | "deadlines"
  | "ledger"
  | "categories"
  | "staff"
  | "invoices";

export const WAREHOUSE_TABS: WarehouseTab[] = [
  "overview",
  "products",
  "tasks",
  "stock",
  "transactions",
  "orders",
  "deadlines",
  "ledger",
  "categories",
  "staff",
  "invoices",
];

/**
 * هر تب فقط فیلدهای مربوط به خودش را پر می‌کند.
 * فیلدی که لیستِ «همان تب» است فقط همان صفحه را دارد؛
 * بقیه‌ی فیلدها (در صورت نیاز تب) لیست کامل هستند.
 */
export interface TabData {
  products: ApiProduct[];
  stockInfos: ApiStockInfo[];
  transactions: ApiStockTransaction[];
  tasks: ApiWarehouseTask[];
  orderTasks: ApiOrderTask[];
  deadlines: ApiOrderTaskDeadline[];
  categories: ApiCategory[];
  staffList: ApiWarehouseStaff[];
  archived: ApiArchivedOrderTask[];
  total: number;
  totalPages: number;
}

export const EMPTY_TAB_DATA: TabData = {
  products: [],
  stockInfos: [],
  transactions: [],
  tasks: [],
  orderTasks: [],
  deadlines: [],
  categories: [],
  staffList: [],
  archived: [],
  total: 0,
  totalPages: 1,
};

interface LoadArgs {
  tab: WarehouseTab;
  warehouseId: number;
  page: number;
  hasFullAccess: boolean;
  employeeId: number | string | null;
}

async function loadTab(args: LoadArgs): Promise<TabData> {
  const { tab, warehouseId, page, hasFullAccess, employeeId } = args;
  const wp = warehouseParams(warehouseId);
  const data: TabData = { ...EMPTY_TAB_DATA };

  const setPaged = (r: { total: number; totalPages: number }) => {
    data.total = r.total;
    data.totalPages = r.totalPages;
  };

  switch (tab) {
    case "overview": {
      const [products, stockInfos, transactions, tasks, orderTasks] =
        await Promise.all([
          fetchAll<ApiProduct>(EP.products, wp),
          fetchAll<ApiStockInfo>(EP.stock, wp),
          fetchAll<ApiStockTransaction>(EP.transactions, wp),
          fetchAll<ApiWarehouseTask>(EP.tasks, wp),
          fetchAll<ApiOrderTask>(EP.orderTasks, wp),
        ]);
      Object.assign(data, { products, stockInfos, transactions, tasks, orderTasks });
      break;
    }

    case "products": {
      const [res, stockInfos, categories] = await Promise.all([
        fetchPage<ApiProduct>(EP.products, { page, params: wp, newestFirst: true }),
        fetchAll<ApiStockInfo>(EP.stock, wp),
        fetchAll<ApiCategory>(EP.categories),
      ]);
      data.products = res.items;
      data.stockInfos = stockInfos;
      data.categories = categories;
      setPaged(res);
      break;
    }

    case "tasks": {
      if (hasFullAccess) {
        const res = await fetchPage<ApiWarehouseTask>(EP.tasks, { page, params: wp });
        data.tasks = res.items;
        setPaged(res);
      } else {
        // کاربر محدود فقط وظایف خودش (یا بدون مسئول) را می‌بیند
        const all = (await fetchAll<ApiWarehouseTask>(EP.tasks, wp)).filter(
          (task) =>
            task.assigned_to == null ||
            (employeeId != null && sameId(task.assigned_to, employeeId)),
        );
        const res = paginate(all, page, PAGE_SIZE);
        data.tasks = res.items;
        setPaged(res);
      }
      break;
    }

    case "stock": {
      const res = await fetchPage<ApiStockInfo>(EP.stock, { page, params: wp });
      data.stockInfos = res.items;
      setPaged(res);
      break;
    }

    case "transactions": {
      const res = await fetchPage<ApiStockTransaction>(EP.transactions, {
        page,
        params: wp,
      });
      data.transactions = res.items;
      setPaged(res);
      break;
    }

    case "orders": {
      const [res, products] = await Promise.all([
        fetchPage<ApiOrderTask>(EP.orderTasks, { page, params: wp }),
        fetchAll<ApiProduct>(EP.products, wp),
      ]);
      data.orderTasks = res.items;
      data.products = products;
      setPaged(res);
      break;
    }

    case "deadlines": {
      const [res, orderTasks] = await Promise.all([
        fetchPage<ApiOrderTaskDeadline>(EP.deadlines, { page }),
        fetchAll<ApiOrderTask>(EP.orderTasks, wp),
      ]);
      data.deadlines = res.items;
      data.orderTasks = orderTasks;
      setPaged(res);
      break;
    }

    case "ledger": {
      const [products, stockInfos, transactions] = await Promise.all([
        fetchAll<ApiProduct>(EP.products, wp),
        fetchAll<ApiStockInfo>(EP.stock, wp),
        fetchAll<ApiStockTransaction>(EP.transactions, wp),
      ]);
      Object.assign(data, { products, stockInfos, transactions });
      break;
    }

    case "categories": {
      const res = await fetchPage<ApiCategory>(EP.categories, { page });
      data.categories = res.items;
      setPaged(res);
      break;
    }

    case "staff": {
      const res = await fetchPage<ApiWarehouseStaff>(EP.staff, { page });
      data.staffList = res.items;
      setPaged(res);
      break;
    }

    case "invoices": {
      // فاکتور از گروه‌بندی چند ردیف آرشیو ساخته می‌شود؛ پس لیست کامل لازم است
      data.archived = await fetchAll<ApiArchivedOrderTask>(EP.archive);
      break;
    }
  }

  return data;
}

export default function useWarehouseTab(args: LoadArgs & { enabled: boolean }) {
  const { enabled, tab, warehouseId, page, hasFullAccess, employeeId } = args;

  const [data, setData] = useState<TabData>(EMPTY_TAB_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(
    async (silent = false) => {
      if (!enabled) return;

      const id = ++requestId.current;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const next = await loadTab({ tab, warehouseId, page, hasFullAccess, employeeId });
        if (id === requestId.current) setData(next);
      } catch {
        if (id === requestId.current) {
          setData(EMPTY_TAB_DATA);
          setError("دریافت اطلاعات انبار با خطا مواجه شد.");
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, tab, warehouseId, page, hasFullAccess, employeeId],
  );

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return { data, setData, loading, refreshing, error, reload };
}
