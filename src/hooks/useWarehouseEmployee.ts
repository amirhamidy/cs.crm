"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import {
  ApiCategory,
  ApiOrderTask,
  ApiOrderTaskDeadline,
  ApiProduct,
  ApiStockInfo,
  ApiStockTransaction,
  ApiWarehouseStaff,
  ApiWarehouseTask,
} from "@/types/warehouse";
import {
  extractList,
  findEmployeeStaff,
  getEmployeeId,
  isTaskMine,
} from "@/utils/warehouseEmployee";

export default function useWarehouseEmployee() {
  const { employee, loading: employeeLoading } = useCurrentEmployee();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [staff, setStaff] = useState<ApiWarehouseStaff[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [stockInfos, setStockInfos] = useState<ApiStockInfo[]>([]);
  const [transactions, setTransactions] = useState<ApiStockTransaction[]>([]);
  const [tasks, setTasks] = useState<ApiWarehouseTask[]>([]);
  const [orderTasks, setOrderTasks] = useState<ApiOrderTask[]>([]);
  const [orderTaskDeadlines, setOrderTaskDeadlines] = useState<
    ApiOrderTaskDeadline[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [
        categoriesRes,
        staffRes,
        productsRes,
        stockRes,
        transactionsRes,
        tasksRes,
        orderTasksRes,
        deadlinesRes,
      ] = await Promise.all([
        axiosInstance
          .get("/warehouse/api/v1/products/categories/")
          .catch(() => null),
        axiosInstance.get("/warehouse/api/v1/staff/").catch(() => null),
        axiosInstance.get("/warehouse/api/v1/products/").catch(() => null),
        axiosInstance.get("/warehouse/api/v1/process/stock/").catch(() => null),
        axiosInstance
          .get("/warehouse/api/v1/process/transactions/")
          .catch(() => null),
        axiosInstance.get("/warehouse/api/v1/task/").catch(() => null),
        axiosInstance.get("/warehouse/api/v1/order_task/").catch(() => null),
        axiosInstance
          .get("/warehouse/api/v1/order_task/deadlines/")
          .catch(() => null),
      ]);

      if (
        !categoriesRes &&
        !staffRes &&
        !productsRes &&
        !stockRes &&
        !transactionsRes &&
        !tasksRes &&
        !orderTasksRes &&
        !deadlinesRes
      ) {
        throw new Error("دریافت اطلاعات انبار با خطا مواجه شد.");
      }

      setCategories(
        categoriesRes ? extractList<ApiCategory>(categoriesRes.data) : [],
      );

      setStaff(staffRes ? extractList<ApiWarehouseStaff>(staffRes.data) : []);

      setProducts(productsRes ? extractList<ApiProduct>(productsRes.data) : []);

      setStockInfos(stockRes ? extractList<ApiStockInfo>(stockRes.data) : []);

      setTransactions(
        transactionsRes
          ? extractList<ApiStockTransaction>(transactionsRes.data)
          : [],
      );

      setTasks(tasksRes ? extractList<ApiWarehouseTask>(tasksRes.data) : []);

      setOrderTasks(
        orderTasksRes ? extractList<ApiOrderTask>(orderTasksRes.data) : [],
      );

      setOrderTaskDeadlines(
        deadlinesRes
          ? extractList<ApiOrderTaskDeadline>(deadlinesRes.data)
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت اطلاعات انبار با خطا مواجه شد.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [
        categoriesRes,
        staffRes,
        productsRes,
        stockRes,
        transactionsRes,
        tasksRes,
        orderTasksRes,
        deadlinesRes,
      ] = await Promise.all([
        axiosInstance
          .get("/warehouse/api/v1/products/categories/")
          .catch(() => null),
        axiosInstance.get("/warehouse/api/v1/staff/").catch(() => null),
        axiosInstance.get("/warehouse/api/v1/products/").catch(() => null),
        axiosInstance.get("/warehouse/api/v1/process/stock/").catch(() => null),
        axiosInstance
          .get("/warehouse/api/v1/process/transactions/")
          .catch(() => null),
        axiosInstance.get("/warehouse/api/v1/task/").catch(() => null),
        axiosInstance.get("/warehouse/api/v1/order_task/").catch(() => null),
        axiosInstance
          .get("/warehouse/api/v1/order_task/deadlines/")
          .catch(() => null),
      ]);

      if (categoriesRes) {
        setCategories(extractList<ApiCategory>(categoriesRes.data));
      }

      if (staffRes) {
        setStaff(extractList<ApiWarehouseStaff>(staffRes.data));
      }

      if (productsRes) {
        setProducts(extractList<ApiProduct>(productsRes.data));
      }

      if (stockRes) {
        setStockInfos(extractList<ApiStockInfo>(stockRes.data));
      }

      if (transactionsRes) {
        setTransactions(extractList<ApiStockTransaction>(transactionsRes.data));
      }

      if (tasksRes) {
        setTasks(extractList<ApiWarehouseTask>(tasksRes.data));
      }

      if (orderTasksRes) {
        setOrderTasks(extractList<ApiOrderTask>(orderTasksRes.data));
      }

      if (deadlinesRes) {
        setOrderTaskDeadlines(
          extractList<ApiOrderTaskDeadline>(deadlinesRes.data),
        );
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!employeeLoading) {
      loadAll();
    }
  }, [employeeLoading, loadAll]);

  const employeeId = useMemo(() => getEmployeeId(employee), [employee]);

  const myStaff = useMemo(
    () => findEmployeeStaff(staff, employeeId),
    [staff, employeeId],
  );

  const warehouseAccess = useMemo(() => Boolean(myStaff), [myStaff]);

  const myStaffId = useMemo(() => {
    if (!myStaff) return null;

    const data = myStaff as unknown as Record<string, unknown>;

    return typeof data.id === "number" || typeof data.id === "string"
      ? data.id
      : null;
  }, [myStaff]);

  const myTasks = useMemo(
    () => tasks.filter((task) => isTaskMine(task, employeeId, myStaffId)),
    [tasks, employeeId, myStaffId],
  );

  const pendingTasks = useMemo(
    () =>
      myTasks.filter((task) => {
        const data = task as unknown as Record<string, unknown>;
        const status = String(data.status ?? "").toLowerCase();

        return ["pending", "waiting", "created", "assigned"].includes(status);
      }),
    [myTasks],
  );

  const activeTasks = useMemo(
    () =>
      myTasks.filter((task) => {
        const data = task as unknown as Record<string, unknown>;
        const status = String(data.status ?? "").toLowerCase();

        return ["in_progress", "processing"].includes(status);
      }),
    [myTasks],
  );

  const completedTasks = useMemo(
    () =>
      myTasks.filter((task) => {
        const data = task as unknown as Record<string, unknown>;
        const status = String(data.status ?? "").toLowerCase();

        return ["completed", "done", "received"].includes(status);
      }),
    [myTasks],
  );

  const criticalStock = useMemo(
    () =>
      stockInfos.filter((item) => {
        const data = item as unknown as Record<string, unknown>;

        const current = Number(
          data.current_quantity ??
            data.quantity ??
            data.stock ??
            data.available_quantity ??
            0,
        );

        const minimum = Number(
          data.minimum_quantity ?? data.min_quantity ?? data.min_stock ?? 0,
        );

        return minimum > 0 && current <= minimum;
      }),
    [stockInfos],
  );

  return {
    employee,
    employeeLoading,
    employeeId,
    staff,
    myStaff,
    warehouseAccess,
    categories,
    products,
    stockInfos,
    transactions,
    tasks,
    myTasks,
    pendingTasks,
    activeTasks,
    completedTasks,
    criticalStock,
    orderTasks,
    orderTaskDeadlines,
    loading,
    refreshing,
    error,
    loadAll,
    refresh,
  };
}
