"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export type TimeRange = "weekly" | "monthly" | "yearly";

type Task = {
  id: number;
  status: "in_progress" | "completed" | "cancelled" | "sold";
  created_at: string;
};

type ChartPoint = {
  name: string;
  sales: number;
  revenue: number;
};

const WEEKLY_LABELS = ["شنبه", "یک", "دو", "سه", "چهار", "پنج", "جمعه"];
const MONTHLY_LABELS = [
  "بازه ۱",
  "بازه ۲",
  "بازه ۳",
  "بازه ۴",
  "بازه ۵",
  "بازه ۶",
];
const YEARLY_LABELS = [
  "ماه ۱",
  "ماه ۲",
  "ماه ۳",
  "ماه ۴",
  "ماه ۵",
  "ماه ۶",
  "ماه ۷",
  "ماه ۸",
  "ماه ۹",
  "ماه ۱۰",
  "ماه ۱۱",
  "ماه ۱۲",
];

export function useSoldTasksByTimeRange() {
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
        setError(
          status === 401 ? "401: دسترسی غیرمجاز" : "خطا در دریافت اطلاعات فروش",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const soldTasks = useMemo(
    () => tasks.filter((task) => task.status === "sold"),
    [tasks],
  );

  const buildRangeData = (
    labels: string[],
    totalDays: number,
  ): ChartPoint[] => {
    const now = new Date();
    const bucketSize = totalDays / labels.length;

    return labels.map((label, index) => {
      const rangeStart = totalDays - bucketSize * (index + 1);
      const rangeEnd = totalDays - bucketSize * index;

      const count = soldTasks.filter((task) => {
        const createdAt = new Date(task.created_at);
        const diffDays =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        return diffDays >= rangeStart && diffDays < rangeEnd;
      }).length;

      return {
        name: label,
        sales: count,
        revenue: count,
      };
    });
  };

  const chartData = useMemo<Record<TimeRange, ChartPoint[]>>(
    () => ({
      weekly: buildRangeData(WEEKLY_LABELS, 7),
      monthly: buildRangeData(MONTHLY_LABELS, 30),
      yearly: buildRangeData(YEARLY_LABELS, 365),
    }),
    [soldTasks],
  );

  return { chartData, loading, error };
}
