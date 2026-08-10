"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

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

export function useCancelledTasksByDept() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axiosInstance.get<Task[]>("/tasks/api/v1/tasks/");
        setTasks(res.data);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          setError("401: دسترسی غیرمجاز");
        } else {
          setError("خطا در دریافت اطلاعات تسک‌ها");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getIssuesByRange = (range: TimeRange): DeptIssues[] => {
    const now = new Date();

    const filtered = tasks.filter((task) => {
      if (task.status !== "cancelled") return false;

      const createdAt = new Date(task.created_at);
      const diffDays = Math.ceil(
        Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (range === "weekly") return diffDays <= 7;
      if (range === "monthly") return diffDays <= 30;
      if (range === "yearly") return diffDays <= 365;
      return true;
    });

    const deptCounts: Record<string, number> = {};

    filtered.forEach((task) => {
      const dept = task.department_name || "نامشخص";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .map(([stage, issues]) => ({ stage, issues }))
      .sort((a, b) => b.issues - a.issues);
  };

  const chartData = useMemo(
    () => ({
      weekly: getIssuesByRange("weekly"),
      monthly: getIssuesByRange("monthly"),
      yearly: getIssuesByRange("yearly"),
    }),
    [tasks],
  );

  return { chartData, loading, error };
}
