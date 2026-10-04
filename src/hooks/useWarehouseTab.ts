"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PAGE_SIZE,
  WAREHOUSE_ENDPOINTS as EP,
  fetchAll,
  fetchPage,
  warehouseParams,
} from "@/lib/warehouseApi";
import {
  belongsToWarehouse,
  productBelongs,
  productIdsOf,
  readWarehouseId,
  scopeStocks,
} from "@/lib/warehouseScope";
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
  taskArchive: ApiWarehouseTaskArchive[];
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

const byNewest = <T extends { id: number; created_at?: string | null }>(
  items: T[],
): T[] =>
  [...items].sort((a, b) => {
    const ta = new Date(a.created_at ?? "").getTime();
    const tb = new Date(b.created_at ?? "").getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    return b.id - a.id;
  });

/**
 * همه‌ی داده‌های وابسته به انبار از اینجا رد می‌شوند:
 *  - موجودی‌ها: فقط موجودی‌های همین انبار
 *  - هر چیز دیگر (محصول، تراکنش، وظیفه، سفارش، بایگانی): بر اساس فیلد انبار خودش
 *    یا (اگر نداشت) بر اساس این‌که محصولش در موجودی همین انبار باشد.
 */
async function loadScope(warehouseId: number) {
  const wp = warehouseParams(warehouseId);
  const rawStocks = await fetchAll<ApiStockInfo>(EP.stock, wp);

  if (
    process.env.NODE_ENV !== "production" &&
    rawStocks.length > 0 &&
    readWarehouseId(rawStocks[0]) === undefined
  ) {
    console.warn(
      "[warehouse] رکورد موجودی فیلد warehouse ندارد؛ جداسازی انبارها فقط به فیلتر query بک‌اند وابسته است.",
    );
  }

  const stocks = scopeStocks(rawStocks, warehouseId);
  const productIds = productIdsOf(stocks);

  const inWarehouse = <T>(items: T[], keepUnattributed = false) =>
    items.filter((item) =>
      belongsToWarehouse(item, warehouseId, productIds, keepUnattributed),
    );

  const products = async () =>
    (await fetchAll<ApiProduct>(EP.products, wp)).filter((product) =>
      productBelongs(product, warehouseId, productIds),
    );

  return { wp, stocks, productIds, inWarehouse, products };
}

async function loadTab(args: LoadArgs): Promise<TabData> {
  const { tab, warehouseId, page, hasFullAccess, employeeId } = args;
  const data: TabData = { ...EMPTY_TAB_DATA };

  const setPaged = (r: { total: number; totalPages: number }) => {
    data.total = r.total;
    data.totalPages = r.totalPages;
  };

  // دسته‌بندی و انباردار سراسری هستند و به انبار خاصی وابسته نیستند
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

  const scope = await loadScope(warehouseId);
  const { wp, stocks, inWarehouse } = scope;

  switch (tab) {
    case "overview": {
      const [products, transactions, tasks, orderTasks] = await Promise.all([
        scope.products(),
        fetchAll<ApiStockTransaction>(EP.transactions, wp),
        fetchAll<ApiWarehouseTask>(EP.tasks, wp),
        fetchAll<ApiOrderTask>(EP.orderTasks, wp),
      ]);

      Object.assign(data, {
        products,
        stockInfos: stocks,
        transactions: inWarehouse(transactions),
        tasks: inWarehouse(tasks, true),
        orderTasks: inWarehouse(orderTasks),
      });
      break;
    }

    case "products": {
      const [products, categories] = await Promise.all([
        scope.products(),
        fetchAll<ApiCategory>(EP.categories),
      ]);

      const res = paginate(byNewest(products), page, PAGE_SIZE);
      data.products = res.items;
      data.stockInfos = stocks;
      data.categories = categories;
      setPaged(res);
      break;
    }

    case "tasks": {
      let tasks = inWarehouse(await fetchAll<ApiWarehouseTask>(EP.tasks, wp), true);

      if (!hasFullAccess) {
        // کاربر محدود فقط وظایف خودش (یا بدون مسئول) را می‌بیند
        tasks = tasks.filter(
          (task) =>
            task.assigned_to == null ||
            (employeeId != null && sameId(task.assigned_to, employeeId)),
        );
      }

      const res = paginate(byNewest(tasks), page, PAGE_SIZE);
      data.tasks = res.items;
      setPaged(res);
      break;
    }

    case "stock": {
      const res = paginate(stocks, page, PAGE_SIZE);
      data.stockInfos = res.items;
      setPaged(res);
      break;
    }

    case "transactions": {
      const transactions = inWarehouse(
        await fetchAll<ApiStockTransaction>(EP.transactions, wp),
      );
      const res = paginate(byNewest(transactions), page, PAGE_SIZE);
      data.transactions = res.items;
      setPaged(res);
      break;
    }

    case "orders": {
      const [orderTasks, products] = await Promise.all([
        fetchAll<ApiOrderTask>(EP.orderTasks, wp),
        scope.products(),
      ]);

      const res = paginate(byNewest(inWarehouse(orderTasks)), page, PAGE_SIZE);
      data.orderTasks = res.items;
      data.products = products;
      data.stockInfos = stocks;
      setPaged(res);
      break;
    }

    case "deadlines": {
      const [deadlines, orderTasks] = await Promise.all([
        fetchAll<ApiOrderTaskDeadline>(EP.deadlines),
        fetchAll<ApiOrderTask>(EP.orderTasks, wp),
      ]);

      const scopedOrders = inWarehouse(orderTasks);
      const orderIds = new Set(scopedOrders.map((order) => order.id));

      // مهلت فقط وقتی مال این انبار است که سفارشش مال این انبار باشد
      const scopedDeadlines = deadlines.filter((deadline) =>
        orderIds.has(Number(deadline.order_task)),
      );

      const res = paginate(byNewest(scopedDeadlines as never[]), page, PAGE_SIZE);
      data.deadlines = res.items as unknown as ApiOrderTaskDeadline[];
      data.orderTasks = scopedOrders;
      setPaged(res);
      break;
    }

    case "ledger": {
      const [products, transactions] = await Promise.all([
        scope.products(),
        fetchAll<ApiStockTransaction>(EP.transactions, wp),
      ]);

      Object.assign(data, {
        products,
        stockInfos: stocks,
        transactions: inWarehouse(transactions),
      });
      break;
    }

    case "task-archive": {
      const archive = inWarehouse(
        await fetchAll<ApiWarehouseTaskArchive>(EP.taskArchive, wp),
        true,
      );
      const res = paginate(byNewest(archive as never[]), page, PAGE_SIZE);
      data.taskArchive = res.items as unknown as ApiWarehouseTaskArchive[];
      setPaged(res);
      break;
    }

    case "invoices": {
      // فاکتور از گروه‌بندی چند ردیف آرشیو ساخته می‌شود؛ پس لیست کامل (فقط ردیف‌های این انبار) لازم است
      data.archived = inWarehouse(await fetchAll<ApiArchivedOrderTask>(EP.archive, wp));
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
