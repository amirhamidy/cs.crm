"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PAGE_SIZE,
  PRODUCTS_PAGE_SIZE,
  WAREHOUSE_ENDPOINTS as EP,
  fetchAll,
  fetchNewest,
  fetchPage,
  fetchWarehousePage,
  fetchWarehouseProductsPage,
  fetchStocksForProducts,
  fetchWarehouseStocks,
  warehouseParams,
} from "@/lib/warehouseApi";
import { cached } from "@/lib/api/_core";
import { listAllByStatus } from "@/lib/api";
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
  ApiWarehouseTaskArchive,
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
  | "invoices"
  | "task-archive";

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
  "task-archive",
];

/**
 * هر تب فقط فیلدهای مربوط به خودش را پر می‌کند.
 * فیلدی که لیستِ «همان تب» است فقط همان صفحه را دارد (صفحه‌بندی سمت سرور)؛
 * بقیه‌ی فیلدها (در صورت نیاز تب) لیست‌های مرجع/تجمیعی هستند.
 * تب «گردش محصول» (ledger) داده‌اش را خودش می‌گیرد.
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
  taskArchive: ApiWarehouseTaskArchive[];
  /** تعداد وظایف کنترل کیفیت در انتظار (تب وظایف و نمای کلی) */
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
  /** فقط برای تب محصولات: فیلتر قفسه (سمت سرور) */
  shelfCode?: string;
}

const byNewestId = <T extends { id: number }>(items: T[]): T[] =>
  [...items].sort((x, y) => y.id - x.id);

async function loadTab(args: LoadArgs): Promise<TabData> {
  const { tab, warehouseId, page, hasFullAccess, employeeId, shelfCode } = args;
  const data: TabData = { ...EMPTY_TAB_DATA };
  const wp = warehouseParams(warehouseId);

  const setPaged = (r: { total: number; totalPages: number }) => {
    data.total = r.total;
    data.totalPages = r.totalPages;
  };

  /** کاربر معمولی فقط وظایف بدون مسئول یا وظایف خودش را می‌بیند. */
  const taskFilter = hasFullAccess
    ? undefined
    : (task: ApiWarehouseTask) =>
        task.assigned_to == null ||
        (employeeId != null && sameId(task.assigned_to, employeeId));

  /** وظایف کنترل کیفیت در انتظار: فقط وظایف pending خوانده می‌شود (مجموعهٔ کوچک). */
  const pendingQuality = async () =>
    (await listAllByStatus<ApiWarehouseTask>(EP.tasks, "pending", wp)).filter(
      (task) =>
        task.quality_control_id != null &&
        (taskFilter ? taskFilter(task) : true),
    ).length;

  if (tab === "categories") {
    const res = await fetchPage<ApiCategory>(EP.categories, { page });
    data.categories = res.items;
    setPaged(res);
    return data;
  }

  if (tab === "staff") {
    const res = await fetchPage<ApiWarehouseStaff>(EP.staff, { page });
    data.staffList = res.items;
    setPaged(res);
    return data;
  }

  switch (tab) {
    case "overview": {
      // موجودی و محصولات برای آمار کلی لازم‌اند؛ کش کوتاه‌مدت از خواندن مجدد در هر ورود جلوگیری می‌کند
      const [stocks, products] = await Promise.all([
        cached(`wh:${warehouseId}:stocks`, () => fetchWarehouseStocks(warehouseId), 30_000),
        cached(`wh:${warehouseId}:products`, () => fetchAll<ApiProduct>(EP.products, wp), 30_000),
      ]);

      const [tasks, orderTasks, transactions, pending] = await Promise.all([
        fetchAll<ApiWarehouseTask>(EP.tasks, wp),
        // فقط سفارش‌های اخیر لازم است (۲۰ مورد فعال نمایش داده می‌شود)
        fetchNewest<ApiOrderTask>(EP.orderTasks, wp, 60),
        fetchNewest<ApiStockTransaction>(EP.transactions, wp, 20),
        pendingQuality(),
      ]);

      Object.assign(data, {
        products,
        stockInfos: stocks,
        transactions,
        tasks: tasks.filter((t) => (taskFilter ? taskFilter(t) : true)),
        orderTasks,
        pendingQualityCount: pending,
      });
      break;
    }

    case "products": {
      const [categories, res] = await Promise.all([
        fetchAll<ApiCategory>(EP.categories),
        fetchWarehouseProductsPage(warehouseId, {
          page,
          shelfCode,
          pageSize: PRODUCTS_PAGE_SIZE,
        }),
      ]);

      data.products = res.items;
      data.stockInfos = await fetchStocksForProducts(
        warehouseId,
        res.items.map((p) => p.id),
      );
      data.categories = categories;
      setPaged(res);
      break;
    }

    case "tasks": {
      const [res, pending] = await Promise.all([
        fetchWarehousePage<ApiWarehouseTask>(EP.tasks, warehouseId, {
          page,
          clientFilter: taskFilter,
        }),
        pendingQuality(),
      ]);

      data.tasks = res.items;
      data.pendingQualityCount = pending;
      setPaged(res);
      break;
    }

    case "stock": {
      const res = await fetchWarehousePage<ApiStockInfo>(EP.stock, warehouseId, {
        page,
      });
      data.stockInfos = res.items;
      setPaged(res);
      break;
    }

    case "transactions": {
      const res = await fetchWarehousePage<ApiStockTransaction>(
        EP.transactions,
        warehouseId,
        { page },
      );
      data.transactions = res.items;
      setPaged(res);
      break;
    }

    case "orders": {
      // کارت‌ها نام کالا را از items خود سفارش می‌خوانند؛ لیست محصولات لازم نیست
      const res = await fetchWarehousePage<ApiOrderTask>(
        EP.orderTasks,
        warehouseId,
        { page },
      );
      data.orderTasks = res.items;
      setPaged(res);
      break;
    }

    case "deadlines": {
      // فقط یک صفحهٔ مهلت‌ها (فیلتر انبار سمت سرور) + سفارش‌های همان انبار برای عنوان کارت‌ها
      const [orderTasks, res] = await Promise.all([
        fetchNewest<ApiOrderTask>(EP.orderTasks, wp, 100),
        fetchPage<ApiOrderTaskDeadline>(EP.deadlines, {
          page,
          params: { order_task__warehouse: warehouseId },
        }),
      ]);
      data.deadlines = res.items;
      data.orderTasks = orderTasks;
      setPaged(res);
      break;
    }

    case "task-archive": {
      const res = await fetchWarehousePage<ApiWarehouseTaskArchive>(
        EP.taskArchive,
        warehouseId,
        { page },
      );
      data.taskArchive = res.items;
      setPaged(res);
      break;
    }

    case "invoices": {
      const res = await fetchWarehousePage<ApiArchivedOrderTask>(
        EP.archive,
        warehouseId,
        { page },
      );
      data.archived = res.items;
      setPaged(res);
      break;
    }

    case "ledger":
      // کامپوننت گردش محصول خودش جستجو و صفحه‌بندی محصولات و تراکنش‌ها را سمت سرور انجام می‌دهد
      break;
  }

  return data;
}

export default function useWarehouseTab(args: LoadArgs & { enabled: boolean }) {
  const { enabled, tab, warehouseId, page, hasFullAccess, employeeId, shelfCode } =
    args;

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
        const next = await loadTab({
          tab,
          warehouseId,
          page,
          hasFullAccess,
          employeeId,
          shelfCode,
        });
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
    [enabled, tab, warehouseId, page, hasFullAccess, employeeId, shelfCode],
  );

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return { data, setData, loading, refreshing, error, reload };
}
