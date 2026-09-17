"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { useAuthStore } from "@/store/authStore";
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
} from "@/utils/warehouseEmployee";

export default function useWarehouseEmployee() {
  const { employee, loading: employeeLoading } = useCurrentEmployee();
  const userType = useAuthStore((state) => state.userType);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

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

  const isAdmin = Number(userType) === 1;
  const employeeId = useMemo(() => getEmployeeId(employee), [employee]);

  const myStaff = useMemo(
    () => findEmployeeStaff(staff, employeeId),
    [staff, employeeId],
  );

  const isWarehouseStaff = myStaff?.is_active === true;
  const warehouseAccess = isAdmin || isWarehouseStaff;
  const limitedWarehouseAccess = isAdmin || Boolean(employeeId);

  const myStaffId = useMemo(() => {
    if (!myStaff) return null;
    const data = myStaff as unknown as Record<string, unknown>;
    return typeof data.id === "number" || typeof data.id === "string"
      ? data.id
      : null;
  }, [myStaff]);

  const loadFullWarehouseData = useCallback(async () => {
    const [
      categoriesRes,
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

    setCategories(
      categoriesRes ? extractList<ApiCategory>(categoriesRes.data) : [],
    );
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
      deadlinesRes ? extractList<ApiOrderTaskDeadline>(deadlinesRes.data) : [],
    );
  }, []);

  const loadLimitedWarehouseData = useCallback(async () => {
    const [productsRes, stockRes, tasksRes, orderTasksRes] = await Promise.all([
      axiosInstance.get("/warehouse/api/v1/products/").catch(() => null),
      axiosInstance.get("/warehouse/api/v1/process/stock/").catch(() => null),
      axiosInstance.get("/warehouse/api/v1/task/").catch(() => null),
      axiosInstance.get("/warehouse/api/v1/order_task/").catch(() => null),
    ]);

    setCategories([]);
    setTransactions([]);
    setOrderTaskDeadlines([]);
    setProducts(productsRes ? extractList<ApiProduct>(productsRes.data) : []);
    setStockInfos(stockRes ? extractList<ApiStockInfo>(stockRes.data) : []);
    setTasks(tasksRes ? extractList<ApiWarehouseTask>(tasksRes.data) : []);
    setOrderTasks(
      orderTasksRes ? extractList<ApiOrderTask>(orderTasksRes.data) : [],
    );
  }, []);

  const clearWarehouseData = useCallback(() => {
    setCategories([]);
    setProducts([]);
    setStockInfos([]);
    setTransactions([]);
    setTasks([]);
    setOrderTasks([]);
    setOrderTaskDeadlines([]);
  }, []);

  const loadAll = useCallback(async () => {
    if (!hasHydrated || employeeLoading) return;

    setError(null);
    setLoading(true);

    try {
      if (isAdmin) {
        await loadFullWarehouseData();
        return;
      }

      const staffResponse = await axiosInstance.get("/warehouse/api/v1/staff/");

      const staffList = extractList<ApiWarehouseStaff>(staffResponse.data);
      setStaff(staffList);

      const currentEmployeeId = getEmployeeId(employee);

      if (!currentEmployeeId) {
        clearWarehouseData();
        return;
      }

      const currentStaff = findEmployeeStaff(staffList, currentEmployeeId);

      if (currentStaff?.is_active === true) {
        await loadFullWarehouseData();
      } else {
        await loadLimitedWarehouseData();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت اطلاعات انبار با خطا مواجه شد.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    employee,
    employeeLoading,
    hasHydrated,
    isAdmin,
    loadFullWarehouseData,
    loadLimitedWarehouseData,
    clearWarehouseData,
  ]);

  const refresh = useCallback(async () => {
    if (!limitedWarehouseAccess) return;

    setRefreshing(true);
    setError(null);

    try {
      if (isAdmin) {
        await loadFullWarehouseData();
        return;
      }

      const staffResponse = await axiosInstance.get("/warehouse/api/v1/staff/");

      const staffList = extractList<ApiWarehouseStaff>(staffResponse.data);
      setStaff(staffList);

      const currentEmployeeId = getEmployeeId(employee);
      const currentStaff = findEmployeeStaff(staffList, currentEmployeeId);

      if (currentStaff?.is_active === true) {
        await loadFullWarehouseData();
      } else {
        await loadLimitedWarehouseData();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "به‌روزرسانی اطلاعات انبار انجام نشد.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [
    employee,
    isAdmin,
    limitedWarehouseAccess,
    loadFullWarehouseData,
    loadLimitedWarehouseData,
  ]);

  const refreshOrderTasks = useCallback(async () => {
    if (!limitedWarehouseAccess) return;

    try {
      const response = await axiosInstance.get("/warehouse/api/v1/order_task/");
      setOrderTasks(extractList<ApiOrderTask>(response.data));
    } catch {}
  }, [limitedWarehouseAccess]);

  useEffect(() => {
    if (!hasHydrated || employeeLoading) return;
    loadAll();
  }, [hasHydrated, employeeLoading, loadAll]);

  const myTasks = useMemo(() => {
    if (warehouseAccess) return tasks;

    const currentEmployeeId = Number(employeeId ?? 0);

    return tasks.filter((task) => {
      const assignedTo = task.assigned_to;

      if (assignedTo === null || assignedTo === undefined) return true;
      if (!currentEmployeeId) return false;

      return Number(assignedTo) === currentEmployeeId;
    });
  }, [employeeId, warehouseAccess, tasks]);

  const pendingTasks = useMemo(
    () =>
      myTasks.filter((task) =>
        ["pending", "waiting", "created", "assigned"].includes(
          String(task.status ?? "").toLowerCase(),
        ),
      ),
    [myTasks],
  );

  const activeTasks = useMemo(
    () =>
      myTasks.filter((task) =>
        ["in_progress", "processing"].includes(
          String(task.status ?? "").toLowerCase(),
        ),
      ),
    [myTasks],
  );

  const completedTasks = useMemo(
    () =>
      myTasks.filter((task) =>
        ["completed", "done", "received"].includes(
          String(task.status ?? "").toLowerCase(),
        ),
      ),
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
    myStaffId,
    isAdmin,
    isWarehouseStaff,
    warehouseAccess,
    limitedWarehouseAccess,
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
    refreshOrderTasks,
  };
}
