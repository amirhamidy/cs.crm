"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cached, invalidate } from "@/lib/api/_core";
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
import { sameId } from "@/utils/warehouseEmployee";
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
  search: string;
  shelfCode: string;
  hasFullAccess: boolean;
  employeeId: number | string | null;
}

const LOOKUP_KEY = "warehouse:";
const LOOKUP_TTL = 30_000;

/**
 * لیست‌های کمکی (فقط برای نمایش نام / موجودی کنار آیتم‌های هر صفحه).
 * کش کوتاه‌مدت دارند تا با هر بار جستجو یا عوض شدن صفحه دوباره کامل دانلود نشوند؛
 * بعد از هر بروزرسانی (reload(true)) پاک می‌شوند.
 */
const lookupStocks = (warehouseId: number) =>
  cached(
    `${LOOKUP_KEY}stocks:${warehouseId}`,
    async () =>
      scopeStocks(
        await fetchAll<ApiStockInfo>(EP.stock, warehouseParams(warehouseId)),
        warehouseId,
      ),
    LOOKUP_TTL,
  );

const lookupCategories = () =>
  cached(
    `${LOOKUP_KEY}categories`,
    () => fetchAll<ApiCategory>(EP.categories),
    LOOKUP_TTL,
  );

const lookupProducts = (warehouseId: number) =>
  cached(
    `${LOOKUP_KEY}products:${warehouseId}`,
    async () => {
      const [stocks, products] = await Promise.all([
        lookupStocks(warehouseId),
        fetchAll<ApiProduct>(EP.products, warehouseParams(warehouseId)),
      ]);
      const productIds = productIdsOf(stocks);
      return products.filter((product) =>
        productBelongs(product, warehouseId, productIds),
      );
    },
    LOOKUP_TTL,
  );

const lookupOrders = (warehouseId: number) =>
  cached(
    `${LOOKUP_KEY}orders:${warehouseId}`,
    async () => {
      const [stocks, orders] = await Promise.all([
        lookupStocks(warehouseId),
        fetchAll<ApiOrderTask>(EP.orderTasks, warehouseParams(warehouseId)),
      ]);
      const productIds = productIdsOf(stocks);
      return orders.filter((order) =>
        belongsToWarehouse(order, warehouseId, productIds),
      );
    },
    LOOKUP_TTL,
  );

/** مکمل فیلتر warehouse_id بک‌اند: فقط رکوردی که فیلد انبارش صراحتاً انبار دیگری است حذف می‌شود */
const inScope = <T,>(items: T[], warehouseId: number): T[] =>
  items.filter((item) => {
    const own = readWarehouseId(item);
    return own === undefined || own === warehouseId;
  });

/**
 * همه‌ی تب‌هایی که لیست دارند صفحه‌بندی و جستجو را از سرور می‌گیرند
 * (page / page_size / search). فقط «نمای کلی» و «گردش محصول» به داده‌ی کامل نیاز دارند.
 */
async function loadTab(args: LoadArgs): Promise<TabData> {
  const { tab, warehouseId, page, search, shelfCode, hasFullAccess, employeeId } =
    args;
  const data: TabData = { ...EMPTY_TAB_DATA };
  const wp = warehouseParams(warehouseId);

  const setPaged = (r: { total: number; totalPages: number }) => {
    data.total = r.total;
    data.totalPages = r.totalPages;
  };

  switch (tab) {
    case "categories": {
      const res = await fetchPage<ApiCategory>(EP.categories, { page, search });
      data.categories = res.items;
      setPaged(res);
      return data;
    }

    case "staff": {
      const res = await fetchPage<ApiWarehouseStaff>(EP.staff, { page, search });
      data.staffList = res.items;
      setPaged(res);
      return data;
    }

    case "overview": {
      const [stocks, products, transactions, tasks, orderTasks] =
        await Promise.all([
          lookupStocks(warehouseId),
          lookupProducts(warehouseId),
          fetchAll<ApiStockTransaction>(EP.transactions, wp),
          fetchAll<ApiWarehouseTask>(EP.tasks, wp),
          fetchAll<ApiOrderTask>(EP.orderTasks, wp),
        ]);

      const productIds = productIdsOf(stocks);
      const inWarehouse = <T,>(items: T[], keepUnattributed = false) =>
        items.filter((item) =>
          belongsToWarehouse(item, warehouseId, productIds, keepUnattributed),
        );

      Object.assign(data, {
        products,
        stockInfos: stocks,
        transactions: inWarehouse(transactions),
        tasks: inWarehouse(tasks, true),
        orderTasks: inWarehouse(orderTasks),
      });
      return data;
    }

    case "ledger": {
      const [stocks, products, transactions] = await Promise.all([
        lookupStocks(warehouseId),
        lookupProducts(warehouseId),
        fetchAll<ApiStockTransaction>(EP.transactions, wp),
      ]);

      const productIds = productIdsOf(stocks);

      Object.assign(data, {
        products,
        stockInfos: stocks,
        transactions: transactions.filter((item) =>
          belongsToWarehouse(item, warehouseId, productIds),
        ),
      });
      return data;
    }

    case "products": {
      const [stocks, categories, res] = await Promise.all([
        lookupStocks(warehouseId),
        lookupCategories(),
        fetchPage<ApiProduct>(EP.products, {
          page: shelfCode ? 1 : page,
          pageSize: shelfCode ? 1 : undefined,
          params: wp,
          search,
          newestFirst: true,
        }),
      ]);

      const productIds = productIdsOf(stocks);

      data.products = shelfCode
        ? []
        : res.items.filter((product) =>
            productBelongs(product, warehouseId, productIds),
          );
      data.stockInfos = stocks;
      data.categories = categories;
      setPaged(res);
      return data;
    }

    case "tasks": {
      const res = await fetchPage<ApiWarehouseTask>(EP.tasks, {
        page,
        params: wp,
        search,
        newestFirst: true,
      });

      let tasks = inScope(res.items, warehouseId);

      if (!hasFullAccess) {
        tasks = tasks.filter(
          (task) =>
            task.assigned_to == null ||
            (employeeId != null && sameId(task.assigned_to, employeeId)),
        );
      }

      data.tasks = tasks;
      setPaged(res);
      return data;
    }

    case "stock": {
      const res = await fetchPage<ApiStockInfo>(EP.stock, {
        page,
        params: wp,
        search,
      });

      data.stockInfos = scopeStocks(res.items, warehouseId);
      setPaged(res);
      return data;
    }

    case "transactions": {
      const res = await fetchPage<ApiStockTransaction>(EP.transactions, {
        page,
        params: wp,
        search,
        newestFirst: true,
      });

      data.transactions = inScope(res.items, warehouseId);
      setPaged(res);
      return data;
    }

    case "orders": {
      const [products, stocks, res] = await Promise.all([
        lookupProducts(warehouseId),
        lookupStocks(warehouseId),
        fetchPage<ApiOrderTask>(EP.orderTasks, {
          page,
          params: wp,
          search,
          newestFirst: true,
        }),
      ]);

      data.orderTasks = inScope(res.items, warehouseId);
      data.products = products;
      data.stockInfos = stocks;
      setPaged(res);
      return data;
    }

    case "deadlines": {
      const [orderTasks, res] = await Promise.all([
        lookupOrders(warehouseId),
        fetchPage<ApiOrderTaskDeadline>(EP.deadlines, {
          page,
          params: wp,
          search,
          ordering: "-id",
        }),
      ]);

      const orderIds = new Set(orderTasks.map((order) => order.id));

      data.deadlines = res.items.filter((deadline) =>
        orderIds.has(Number(deadline.order_task)),
      );
      data.orderTasks = orderTasks;
      setPaged(res);
      return data;
    }

    case "task-archive": {
      const res = await fetchPage<ApiWarehouseTaskArchive>(EP.taskArchive, {
        page,
        params: wp,
        search,
        ordering: "-archived_at",
      });

      data.taskArchive = inScope(res.items, warehouseId);
      setPaged(res);
      return data;
    }

    case "invoices": {
      const res = await fetchPage<ApiArchivedOrderTask>(EP.archive, {
        page,
        params: wp,
        search,
        ordering: "-archived_at",
      });

      data.archived = inScope(res.items, warehouseId);
      setPaged(res);
      return data;
    }
  }

  return data;
}

export default function useWarehouseTab(args: LoadArgs & { enabled: boolean }) {
  const {
    enabled,
    tab,
    warehouseId,
    page,
    search,
    shelfCode,
    hasFullAccess,
    employeeId,
  } = args;

  const [data, setData] = useState<TabData>(EMPTY_TAB_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(
    async (silent = false) => {
      if (!enabled) return;

      if (silent) invalidate(LOOKUP_KEY);

      const id = ++requestId.current;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const next = await loadTab({
          tab,
          warehouseId,
          page,
          search,
          shelfCode,
          hasFullAccess,
          employeeId,
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
    [enabled, tab, warehouseId, page, search, shelfCode, hasFullAccess, employeeId],
  );

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return { data, setData, loading, refreshing, error, reload };
}
