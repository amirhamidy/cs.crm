// hooks/useAnalytics.ts
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { getEmployeeInfo } from "@/hooks/useEmployeeInfo";

export type TimeRange = "weekly" | "monthly" | "yearly";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawCustomer {
  id: number;
  full_name: string;
  status: number;
  created_by_username: string;
}

interface RawTask {
  id: number;
  title: string;
  department: number;
  department_name: string;
  status: "in_progress" | "completed" | "cancelled" | "sold";
  created_at: string;
}

export interface EmployeeRankItem {
  username: string;
  full_name: string;
  actual: number;
  potential: number;
  total: number;
}

export interface DepartmentStatItem {
  department_name: string;
  sold: number;
  cancelled: number;
  completed: number;
  in_progress: number;
  total: number;
}

export interface TaskStatusOverview {
  in_progress: number;
  completed: number;
  cancelled: number;
  sold: number;
}

export interface SoldTrendPoint {
  label: string;
  sold: number;
}

export interface DepartmentConversionItem {
  department_name: string;
  conversion: number;
  sold: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchAllPages<T>(baseUrl: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = baseUrl;

  while (url) {
    const res = await axiosInstance.get(url);
    const data = res.data;
    const items: T[] = Array.isArray(data) ? data : (data.results ?? []);
    results.push(...items);

    if (!Array.isArray(data) && data.next) {
      const parsed = new URL(data.next);
      url = parsed.pathname + parsed.search;
    } else {
      url = null;
    }
  }

  return results;
}

function getTimeCutoff(range: TimeRange): number {
  const now = Date.now();
  if (range === "weekly") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "monthly") return now - 30 * 24 * 60 * 60 * 1000;
  return now - 365 * 24 * 60 * 60 * 1000;
}

function filterByRange<T extends { created_at: string }>(
  items: T[],
  range: TimeRange,
): T[] {
  const cutoff = getTimeCutoff(range);
  return items.filter((item) => {
    const t = new Date(item.created_at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

const WEEKLY_LABELS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];
const MONTHLY_LABELS = [
  "بازه ۱",
  "بازه ۲",
  "بازه ۳",
  "بازه ۴",
  "بازه ۵",
  "بازه ۶",
];
const YEARLY_LABELS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function bucketSoldTrend(tasks: RawTask[], range: TimeRange): SoldTrendPoint[] {
  const sold = tasks.filter((t) => t.status === "sold");
  const now = Date.now();

  if (range === "weekly") {
    const counts = Array(7).fill(0);
    sold.forEach((t) => {
      const diff = Math.floor(
        (now - new Date(t.created_at).getTime()) / (24 * 60 * 60 * 1000),
      );
      const idx = 6 - diff;
      if (idx >= 0 && idx < 7) counts[idx]++;
    });
    return WEEKLY_LABELS.map((label, i) => ({ label, sold: counts[i] }));
  }

  if (range === "monthly") {
    const counts = Array(6).fill(0);
    const interval = (30 * 24 * 60 * 60 * 1000) / 6;
    sold.forEach((t) => {
      const diff = now - new Date(t.created_at).getTime();
      const idx = Math.floor((30 * 24 * 60 * 60 * 1000 - diff) / interval);
      if (idx >= 0 && idx < 6) counts[idx]++;
    });
    return MONTHLY_LABELS.map((label, i) => ({ label, sold: counts[i] }));
  }

  const counts = Array(12).fill(0);
  sold.forEach((t) => {
    const month = new Date(t.created_at).getMonth();
    counts[month]++;
  });
  return YEARLY_LABELS.map((label, i) => ({ label, sold: counts[i] }));
}

// ─── Hook 1: Employee Ranking ─────────────────────────────────────────────────

export function useEmployeeRanking(range: TimeRange = "monthly") {
  const [data, setData] = useState<EmployeeRankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const customers = await fetchAllPages<RawCustomer>(
          "/customers/api/v1/customers/",
        );
        const filtered = filterByRange(customers, range);

        const map: Record<string, { actual: number; potential: number }> = {};

        filtered.forEach((c) => {
          const key = c.created_by_username;
          if (!key) return;
          if (!map[key]) map[key] = { actual: 0, potential: 0 };
          if (c.status === 2) map[key].actual++;
          else if (c.status === 1) map[key].potential++;
        });

        const usernameList = Object.keys(map);
        const employeeInfos = await Promise.allSettled(
          usernameList.map(async (username) => {
            const allEmployees = await fetchAllPages<{
              id: number;
              full_name: string;
              username: string;
            }>("/accounts/api/v1/employee/list/");
            return allEmployees.find((e) => e.username === username);
          }),
        );

        const allEmployees = await fetchAllPages<{
          id: number;
          full_name: string;
          username: string;
        }>("/accounts/api/v1/employee/list/");

        const employeeMap: Record<string, string> = {};
        allEmployees.forEach((e) => {
          employeeMap[e.username] = e.full_name;
        });

        const ranked: EmployeeRankItem[] = usernameList
          .map((username) => ({
            username,
            full_name: employeeMap[username] ?? username,
            actual: map[username].actual,
            potential: map[username].potential,
            total: map[username].actual + map[username].potential,
          }))
          .sort((a, b) => b.actual - a.actual || b.total - a.total);

        if (!cancelled) setData(ranked);
      } catch {
        if (!cancelled) setError("خطا در بارگذاری رنکینگ کارمندها");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return { data, loading, error };
}

// ─── Hook 2: Department Stats ─────────────────────────────────────────────────

export function useDepartmentStats(range: TimeRange = "monthly") {
  const [data, setData] = useState<DepartmentStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const tasks = await fetchAllPages<RawTask>("/tasks/api/v1/tasks/");
        const filtered = filterByRange(tasks, range);

        const map: Record<string, DepartmentStatItem> = {};

        filtered.forEach((t) => {
          const key = t.department_name;
          if (!key) return;
          if (!map[key]) {
            map[key] = {
              department_name: key,
              sold: 0,
              cancelled: 0,
              completed: 0,
              in_progress: 0,
              total: 0,
            };
          }
          map[key][t.status]++;
          map[key].total++;
        });

        const sorted = Object.values(map).sort((a, b) => b.sold - a.sold);

        if (!cancelled) setData(sorted);
      } catch {
        if (!cancelled) setError("خطا در بارگذاری آمار دپارتمان‌ها");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return { data, loading, error };
}

// ─── Hook 3: Task Status Overview (Donut) ─────────────────────────────────────

export function useTaskStatusOverview(range: TimeRange = "monthly") {
  const [data, setData] = useState<TaskStatusOverview>({
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    sold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const tasks = await fetchAllPages<RawTask>("/tasks/api/v1/tasks/");
        const filtered = filterByRange(tasks, range);

        const overview: TaskStatusOverview = {
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          sold: 0,
        };

        filtered.forEach((t) => {
          if (t.status in overview) overview[t.status]++;
        });

        if (!cancelled) setData(overview);
      } catch {
        if (!cancelled) setError("خطا در بارگذاری وضعیت تسک‌ها");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return { data, loading, error };
}

// ─── Hook 4: Sold Trend Over Time ─────────────────────────────────────────────

export function useSoldTrend(range: TimeRange = "monthly") {
  const [data, setData] = useState<SoldTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const tasks = await fetchAllPages<RawTask>("/tasks/api/v1/tasks/");
        const filtered = filterByRange(tasks, range);
        const trend = bucketSoldTrend(filtered, range);

        if (!cancelled) setData(trend);
      } catch {
        if (!cancelled) setError("خطا در بارگذاری روند فروش");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return { data, loading, error };
}

// ─── Hook 5: Department Conversion Rate ───────────────────────────────────────

export function useDepartmentConversion(range: TimeRange = "monthly") {
  const [data, setData] = useState<DepartmentConversionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const tasks = await fetchAllPages<RawTask>("/tasks/api/v1/tasks/");
        const filtered = filterByRange(tasks, range);

        const map: Record<
          string,
          { sold: number; cancelled: number; completed: number }
        > = {};

        filtered.forEach((t) => {
          const key = t.department_name;
          if (!key) return;
          if (!map[key]) map[key] = { sold: 0, cancelled: 0, completed: 0 };
          if (t.status === "sold") map[key].sold++;
          else if (t.status === "cancelled") map[key].cancelled++;
          else if (t.status === "completed") map[key].completed++;
        });

        const result: DepartmentConversionItem[] = Object.entries(map)
          .map(([dept, counts]) => {
            const total = counts.sold + counts.cancelled + counts.completed;
            const conversion =
              total > 0 ? Math.round((counts.sold / total) * 100) : 0;
            return {
              department_name: dept,
              conversion,
              sold: counts.sold,
              total,
            };
          })
          .sort((a, b) => b.conversion - a.conversion);

        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError("خطا در بارگذاری نرخ تبدیل");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return { data, loading, error };
}
