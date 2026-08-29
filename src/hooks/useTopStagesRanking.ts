import { useEffect, useMemo, useState } from "react";
import { apiRoutes } from "@/lib/apiRoutes";
import axiosInstance from "@/lib/axiosInstance";

export type TimeRange = "weekly" | "monthly" | "yearly";

export interface StageRankItem {
  key: string;
  stage_name: string;
  department_name: string;
  total: number;
  sold: number;
  completed: number;
  in_progress: number;
  cancelled: number;
}

interface RawTask {
  id: string | number;
  status?: string;
  department?: string | number | { id: string | number } | null;
  department_name?: string;
  current_step?: string | number | { id: string | number } | null;
  current_step_name?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface RawDepartment {
  id: number | string;
  name?: string;
  title?: string;
  order?: number;
  [key: string]: unknown;
}

interface RawDepartmentStep {
  id: number | string;
  department?: number | string | { id: number | string } | null;
  name?: string;
  order?: number;
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

const toNum = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const firstDefined = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const relationKey = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const item = value as { id?: unknown; apiId?: unknown };
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
    const res = await axiosInstance.get(nextUrl);
    const data = res.data as T[] | PaginatedResponse<T>;
    const items = Array.isArray(data) ? data : (data.results ?? []);
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
  if (range === "weekly") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "monthly") return now - 30 * 24 * 60 * 60 * 1000;
  return now - 365 * 24 * 60 * 60 * 1000;
}

function filterByRange<T extends { created_at?: string }>(
  items: T[],
  range: TimeRange,
) {
  const cutoff = getTimeCutoff(range);
  return items.filter((item) => {
    if (!item.created_at) return false;
    const t = new Date(item.created_at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

export function useTopStagesRanking() {
  const [tasks, setTasks] = useState<RawTask[]>([]);
  const [departments, setDepartments] = useState<RawDepartment[]>([]);
  const [departmentSteps, setDepartmentSteps] = useState<RawDepartmentStep[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [tasksRes, departmentsRes, stepsRes] = await Promise.all([
          fetchAllPages<RawTask>(apiRoutes.tasks),
          fetchAllPages<RawDepartment>(apiRoutes.departments),
          fetchAllPages<RawDepartmentStep>(apiRoutes.departmentSteps),
        ]);

        if (cancelled) return;

        setTasks(tasksRes);
        setDepartments(departmentsRes);
        setDepartmentSteps(stepsRes);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.detail || e?.message || "خطا در دریافت داده‌ها",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const departmentById = useMemo(() => {
    const m = new Map<string, RawDepartment>();
    departments.forEach((d) => m.set(String(d.id), d));
    return m;
  }, [departments]);

  const stepsByDepartment = useMemo(() => {
    const m = new Map<string, RawDepartmentStep[]>();
    departmentSteps.forEach((s) => {
      const depKey = relationKey(s.department);
      if (!depKey) return;
      if (!m.has(depKey)) m.set(depKey, []);
      m.get(depKey)!.push(s);
    });
    m.forEach((list) => list.sort((a, b) => toNum(a.order) - toNum(b.order)));
    return m;
  }, [departmentSteps]);

  const buildForRange = useMemo(() => {
    return (range: TimeRange): StageRankItem[] => {
      const filtered = filterByRange(tasks, range);
      const acc = new Map<
        string,
        {
          stage_name: string;
          department_name: string;
          total: number;
          sold: number;
          completed: number;
          in_progress: number;
          cancelled: number;
        }
      >();

      filtered.forEach((task) => {
        const rawDeptKey = relationKey(task.department);
        const deptKey =
          rawDeptKey && departmentById.has(rawDeptKey)
            ? rawDeptKey
            : (rawDeptKey ?? "unknown");
        const deptName = departmentById.has(deptKey)
          ? firstDefined(departmentById.get(deptKey)?.name, "دپارتمان نامشخص")
          : firstDefined(task.department_name, "دپارتمان نامشخص");

        const rawStepKey = relationKey(task.current_step);
        const stepInfo = rawStepKey
          ? stepsByDepartment
              .get(deptKey)
              ?.find((s) => String(s.id) === rawStepKey)
          : undefined;
        const stageKey = `${deptKey}:${rawStepKey ?? "unknown"}`;
        const stageName = stepInfo
          ? firstDefined(stepInfo.name, "مرحله نامشخص")
          : firstDefined(task.current_step_name, "مرحله نامشخص");

        if (!acc.has(stageKey)) {
          acc.set(stageKey, {
            stage_name: stageName,
            department_name: deptName,
            total: 0,
            sold: 0,
            completed: 0,
            in_progress: 0,
            cancelled: 0,
          });
        }

        const row = acc.get(stageKey)!;
        row.total++;
        const status = statusOf(task);
        if (status === "sold") row.sold++;
        else if (status === "completed") row.completed++;
        else if (status === "in_progress") row.in_progress++;
        else if (status === "cancelled") row.cancelled++;
      });

      return Array.from(acc.entries()).map(([key, value]) => ({
        key,
        ...value,
      }));
    };
  }, [tasks, departmentById, stepsByDepartment]);

  const data = useMemo(
    () => ({
      weekly: buildForRange("weekly"),
      monthly: buildForRange("monthly"),
      yearly: buildForRange("yearly"),
    }),
    [buildForRange],
  );

  return { data, loading, error };
}
