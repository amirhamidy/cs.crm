"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRODUCTS_PAGE_SIZE, WAREHOUSE_ENDPOINTS as EP, fetchAll, fetchNewest, fetchPage, fetchWarehousePage, fetchWarehouseProductsPage, fetchPendingQualityCount, fetchStocksForProducts, warehouseParams } from "@/lib/warehouseApi";
import { sameId } from "@/utils/warehouseEmployee";
import type { ApiArchivedOrderTask, ApiCategory, ApiOrderTask, ApiOrderTaskDeadline, ApiProduct, ApiStockInfo, ApiStockTransaction, ApiWarehouseStaff, ApiWarehouseTask, ApiWarehouseTaskArchive } from "@/types/warehouse";

export type WarehouseTab =
  | "products"
  | "tasks"
  | "stock"
  | "transactions"
  | "orders"
  | "deadlines"
  | "ledger"
  | "categories"
  | "staff"
  | "invoices"
  | "task-archive";

export const WAREHOUSE_TABS: WarehouseTab[] = [
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
  "task-archive",
];


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
  taskArchive: ApiWarehouseTaskArchive[];
  
  pendingQualityCount: number;
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
  taskArchive: [],
  pendingQualityCount: 0,
  total: 0,
  totalPages: 1,
};

interface LoadArgs {
  tab: WarehouseTab;
  warehouseId: number;
  page: number;
  hasFullAccess: boolean;
  employeeId: number | string | null;
  
  shelfCode?: string;
  search?: string;
  signal?: AbortSignal;
}

const byNewestId = <T extends { id: number }>(items: T[]): T[] =>
  [...items].sort((x, y) => y.id - x.id);

async function loadTab(args: LoadArgs): Promise<TabData> {
  const { tab, warehouseId, page, hasFullAccess, employeeId, shelfCode, search, signal } = args;
  const data: TabData = { ...EMPTY_TAB_DATA };
  const wp = warehouseParams(warehouseId);

  const setPaged = (r: { total: number; totalPages: number }) => {
    data.total = r.total;
    data.totalPages = r.totalPages;
  };

  
  const taskFilter = hasFullAccess
    ? undefined
    : (task: ApiWarehouseTask) =>
        task.assigned_to == null ||
        (employeeId != null && sameId(task.assigned_to, employeeId));

  if (tab === "products") {
    
    const [res, categories] = await Promise.all([
      fetchWarehouseProductsPage(warehouseId, {
        page,
        shelfCode,
        search,
        pageSize: PRODUCTS_PAGE_SIZE,
        signal,
      }),
      fetchAll<ApiCategory>(EP.categories, {}, signal),
    ]);

    data.products = res.items;
    data.categories = categories;
    data.stockInfos = await fetchStocksForProducts(
      warehouseId,
      res.items.map((p) => p.id),
      signal,
    );
    setPaged(res);
    return data;
  }

  if (tab === "categories") {
    const res = await fetchPage<ApiCategory>(EP.categories, { page, signal });
    data.categories = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "staff") {
    const res = await fetchPage<ApiWarehouseStaff>(EP.staff, { page, signal });
    data.staffList = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "tasks") {
    
    const [res, pending] = await Promise.all([
      fetchWarehousePage<ApiWarehouseTask>(EP.tasks, warehouseId, {
        page,
        search,
        signal,
        clientFilter: taskFilter,
      }),
      hasFullAccess
        ? fetchPendingQualityCount(warehouseId, signal, taskFilter)
        : Promise.resolve(0),
    ]);

    data.tasks = res.items;
    data.pendingQualityCount = pending;
    setPaged(res);
    return data;
  }

  if (tab === "stock") {
    const res = await fetchWarehousePage<ApiStockInfo>(EP.stock, warehouseId, {
      page,
      search,
      signal,
    });
    data.stockInfos = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "transactions") {
    const res = await fetchWarehousePage<ApiStockTransaction>(
      EP.transactions,
      warehouseId,
      { page, search, signal },
    );
    data.transactions = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "orders") {
    
    const res = await fetchWarehousePage<ApiOrderTask>(EP.orderTasks, warehouseId, {
      page,
      search,
      signal,
    });
    data.orderTasks = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "deadlines") {
    
    const [orderTasks, res] = await Promise.all([
      fetchNewest<ApiOrderTask>(EP.orderTasks, wp, 100, signal),
      fetchPage<ApiOrderTaskDeadline>(EP.deadlines, {
        page,
        params: { order_task__warehouse: warehouseId },
        signal,
      }),
    ]);
    data.deadlines = res.items;
    data.orderTasks = orderTasks;
    setPaged(res);
    return data;
  }

  if (tab === "task-archive") {
    const res = await fetchWarehousePage<ApiWarehouseTaskArchive>(
      EP.taskArchive,
      warehouseId,
      { page, search, signal },
    );
    data.taskArchive = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "invoices") {
    const res = await fetchWarehousePage<ApiArchivedOrderTask>(
      EP.archive,
      warehouseId,
      { page, search, signal },
    );
    data.archived = res.items;
    setPaged(res);
    return data;
  }

  
  return data;
}

export default function useWarehouseTab(args: LoadArgs & { enabled: boolean }) {
  const { enabled, tab, warehouseId, page, hasFullAccess, employeeId, shelfCode, search } =
    args;

  const [data, setData] = useState<TabData>(EMPTY_TAB_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const reload = useCallback(
    async (silent = false) => {
      if (!enabled) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const id = ++requestId.current;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const next = await loadTab({
          tab,
          warehouseId,
          page,
          hasFullAccess,
          employeeId,
          shelfCode,
          search,
          signal: controller.signal,
        });
        if (id === requestId.current) setData(next);
      } catch {
        if (id === requestId.current && !controller.signal.aborted) {
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
    [enabled, tab, warehouseId, page, hasFullAccess, employeeId, shelfCode, search],
  );

  useEffect(() => {
    void reload(false);
    return () => {
      requestId.current += 1;
      controllerRef.current?.abort();
    };
  }, [reload]);

  return { data, setData, loading, refreshing, error, reload };
}
