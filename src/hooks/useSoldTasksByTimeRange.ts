"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import {
  JALALI_MONTHS,
  toGregorian,
  toJalali,
  toPersianDigits,
} from "@/lib/jalali";

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

const WEEK_DAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const createLocalDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return createLocalDate(result);
};

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const parseTaskDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return createLocalDate(date);
};

const getJalaliParts = (date: Date) =>
  toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());

export function useSoldTasksByTimeRange() {
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
          status === 401 ? "401: دسترسی غیرمجاز" : "خطا در دریافت اطلاعات فروش",
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

  const soldTasks = useMemo(
    () => tasks.filter((task) => task.status === "sold"),
    [tasks],
  );

  const normalizedTasks = useMemo(
    () =>
      soldTasks
        .map((task) => {
          const date = parseTaskDate(task.created_at);

          if (!date) return null;

          return {
            ...task,
            date,
            dateKey: getDateKey(date),
          };
        })
        .filter(
          (
            task,
          ): task is Task & {
            date: Date;
            dateKey: string;
          } => task !== null,
        ),
    [soldTasks],
  );

  const chartData = useMemo<Record<TimeRange, ChartPoint[]>>(() => {
    const today = createLocalDate(new Date());

    const weeklyStart = addDays(today, -6);

    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weeklyStart, index);
      const dateKey = getDateKey(date);

      const count = normalizedTasks.filter(
        (task) => task.dateKey === dateKey,
      ).length;

      return {
        name: WEEK_DAYS[date.getDay()],
        sales: count,
        revenue: count,
      };
    });

    const monthlyStart = addDays(today, -29);

    const monthly = Array.from({ length: 30 }, (_, index) => {
      const date = addDays(monthlyStart, index);
      const dateKey = getDateKey(date);
      const [, , day] = getJalaliParts(date);

      const count = normalizedTasks.filter(
        (task) => task.dateKey === dateKey,
      ).length;

      return {
        name: toPersianDigits(day),
        sales: count,
        revenue: count,
      };
    });

    const yearlyStart = addDays(today, -364);
    const yearlyEnd = addDays(today, 1);

    const monthMap = new Map<number, number>();

    for (let month = 1; month <= 12; month += 1) {
      monthMap.set(month, 0);
    }

    normalizedTasks.forEach((task) => {
      if (task.date < yearlyStart || task.date >= yearlyEnd) {
        return;
      }

      const [, month] = getJalaliParts(task.date);

      monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
    });

    const [, currentMonth] = getJalaliParts(today);

    const yearly = Array.from({ length: 12 }, (_, index) => {
      const month = ((currentMonth + index) % 12) + 1;

      const count = monthMap.get(month) ?? 0;

      return {
        name: JALALI_MONTHS[month - 1],
        sales: count,
        revenue: count,
      };
    });

    return {
      weekly,
      monthly,
      yearly,
    };
  }, [normalizedTasks]);

  return {
    chartData,
    loading,
    error,
  };
}
