"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { toJalali } from "@/lib/jalali";

export type TimeRange = "weekly" | "monthly" | "yearly";

interface Task {
  id: number;
  department_name: string;
  status: "in_progress" | "completed" | "cancelled" | "sold";
  created_at: string;
}

interface DeptIssues {
  stage: string;
  issues: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const createLocalDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseTaskDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return createLocalDate(date);
};

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const getToday = () => createLocalDate(new Date());

const getStartDate = (today: Date, days: number) =>
  new Date(today.getTime() - (days - 1) * DAY_MS);

const getJalaliDate = (date: Date) =>
  toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());

export function useCancelledTasksByDept() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTasks = async () => {
      try {
        const res = await axiosInstance.get<Task[]>("/tasks/api/v1/tasks/");

        if (!mounted) return;

        setTasks(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        if (!mounted) return;

        const status = err?.response?.status;

        setError(
          status === 401
            ? "401: دسترسی غیرمجاز"
            : "خطا در دریافت اطلاعات تسک‌ها",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedTasks = useMemo(
    () =>
      tasks
        .map((task) => {
          const date = parseTaskDate(task.created_at);

          if (!date) return null;

          return {
            ...task,
            date,
            dateKey: getDateKey(date),
            jalali: getJalaliDate(date),
          };
        })
        .filter(
          (
            task,
          ): task is Task & {
            date: Date;
            dateKey: string;
            jalali: [number, number, number];
          } => task !== null,
        ),
    [tasks],
  );

  const allDepartments = useMemo(() => {
    const depts = new Set<string>();

    tasks.forEach((task) => {
      const department = task.department_name?.trim();

      if (department) {
        depts.add(department);
      } else {
        depts.add("نامشخص");
      }
    });

    return Array.from(depts);
  }, [tasks]);

  const chartData = useMemo(() => {
    const today = getToday();

    const getIssuesByRange = (range: TimeRange): DeptIssues[] => {
      const days = range === "weekly" ? 7 : range === "monthly" ? 30 : 365;

      const startDate = getStartDate(today, days);
      const endDate = new Date(today.getTime() + DAY_MS);

      const deptCounts: Record<string, number> = {};

      normalizedTasks.forEach((task) => {
        if (task.status !== "cancelled") return;

        if (task.date < startDate || task.date >= endDate) {
          return;
        }

        const department = task.department_name?.trim() || "نامشخص";

        deptCounts[department] = (deptCounts[department] ?? 0) + 1;
      });

      return allDepartments.map((department) => ({
        stage: department,
        issues: deptCounts[department] ?? 0,
      }));
    };

    return {
      weekly: getIssuesByRange("weekly"),
      monthly: getIssuesByRange("monthly"),
      yearly: getIssuesByRange("yearly"),
    };
  }, [normalizedTasks, allDepartments]);

  return {
    chartData,
    loading,
    error,
    allDepartments,
  };
}
