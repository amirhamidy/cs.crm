"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";

export type TimeRange = "weekly" | "monthly" | "yearly";

export interface EmployeePerformance {
  total: number;
  completed: number;
  inProgress: number;
  cancelled: number;
  completionRate: number;
  activeRate: number;
  cancelledRate: number;
}

interface RawTask {
  id: string | number;
  status?: string;
  assigned_employee?: unknown;
  assigned_employee_username?: unknown;
  assigned_employee_name?: unknown;
  created_at?: string;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  results?: T[];
  next?: string | null;
}

const norm = (value: unknown) =>
  value === null || value === undefined
    ? ""
    : String(value).trim().toLowerCase();

const relationKey = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    const item = value as {
      id?: unknown;
      apiId?: unknown;
    };

    const id = item.id ?? item.apiId;

    if (id === null || id === undefined) return null;

    return String(id);
  }

  return String(value);
};

const statusOf = (task: RawTask) => norm(task.status);

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await axiosInstance.get(nextUrl);

    const data = response.data as T[] | PaginatedResponse<T>;

    const items = Array.isArray(data)
      ? data
      : data.results ?? [];

    results.push(...items);

    if (!Array.isArray(data) && data.next) {
      const parsed = new URL(data.next);
      nextUrl = parsed.pathname + parsed.search;
    } else {
      nextUrl = null;
    }
  }

  return results;
}

function getTimeCutoff(range: TimeRange) {
  const now = Date.now();

  if (range === "weekly") {
    return now - 7 * 24 * 60 * 60 * 1000;
  }

  if (range === "monthly") {
    return now - 30 * 24 * 60 * 60 * 1000;
  }

  return now - 365 * 24 * 60 * 60 * 1000;
}

function filterByRange(
  items: RawTask[],
  range: TimeRange,
) {
  const cutoff = getTimeCutoff(range);

  return items.filter((item) => {
    if (!item.created_at) return false;

    const time = new Date(item.created_at).getTime();

    return !Number.isNaN(time) && time >= cutoff;
  });
}

function extractEmployeeIds(task: RawTask) {
  const raw = task.assigned_employee;

  const values = Array.isArray(raw)
    ? raw
    : raw !== null && raw !== undefined
      ? [raw]
      : [];

  return values
    .map(relationKey)
    .filter((value): value is string => Boolean(value));
}

export function useEmployeePerformance(
  range: TimeRange = "monthly",
) {
  const { employee, loading: employeeLoading, error: employeeError } =
    useCurrentEmployee();

  const [tasks, setTasks] = useState<RawTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingTasks(true);
        setError(null);

        const data = await fetchAllPages<RawTask>(apiRoutes.tasks);

        if (!cancelled) {
          setTasks(data);
        }
      } catch (error: any) {
        if (!cancelled) {
          setError(
            error?.response?.data?.detail ||
              error?.message ||
              "خطا در دریافت اطلاعات عملکرد",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTasks(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const employeeTasks = useMemo(() => {
    if (!employee?.id) return [];

    const employeeId = String(employee.id);

    return tasks.filter((task) => {
      const assignedIds = extractEmployeeIds(task);

      return assignedIds.some(
        (id) => id === employeeId,
      );
    });
  }, [tasks, employee?.id]);

  const filteredTasks = useMemo(
    () => filterByRange(employeeTasks, range),
    [employeeTasks, range],
  );

  const performance = useMemo<EmployeePerformance>(() => {
    const total = filteredTasks.length;

    const completed = filteredTasks.filter(
      (task) => statusOf(task) === "completed",
    ).length;

    const inProgress = filteredTasks.filter(
      (task) => statusOf(task) === "in_progress",
    ).length;

    const cancelled = filteredTasks.filter(
      (task) => statusOf(task) === "cancelled",
    ).length;

    return {
      total,
      completed,
      inProgress,
      cancelled,
      completionRate: total
        ? Math.round((completed / total) * 100)
        : 0,
      activeRate: total
        ? Math.round((inProgress / total) * 100)
        : 0,
      cancelledRate: total
        ? Math.round((cancelled / total) * 100)
        : 0,
    };
  }, [filteredTasks]);

  const chartData = useMemo(
    () => [
      {
        key: "completed",
        label: "انجام‌شده",
        value: performance.completed,
      },
      {
        key: "inProgress",
        label: "در حال انجام",
        value: performance.inProgress,
      },
      {
        key: "cancelled",
        label: "لغوشده",
        value: performance.cancelled,
      },
    ],
    [performance],
  );

  return {
    employee,
    employeeId: employee?.id ?? null,
    tasks: filteredTasks,
    performance,
    chartData,
    loading: employeeLoading || loadingTasks,
    error: employeeError || error,
  };
}