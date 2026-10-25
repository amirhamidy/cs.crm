import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";

/* ------------------------------------------------------------------ */
/*  Dashboard API  (/dashboard/api/v1/...)                             */
/* ------------------------------------------------------------------ */

const BASE = "/dashboard/api/v1";
const CACHE_TTL_MS = 30_000;

export type Period = "weekly" | "monthly" | "yearly";
export const PERIODS: Period[] = ["weekly", "monthly", "yearly"];

export const dashboardRoutes = {
  summary: `${BASE}/summary/`,
  salesChart: `${BASE}/sales-chart/`,
  customerSources: `${BASE}/customer-sources/`,
  cancelledByDepartment: `${BASE}/cancelled-by-department/`,
  topExperts: `${BASE}/top-experts/`,
  overview: `${BASE}/overview/`,
};

export class DashboardAuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "DashboardAuthError";
  }
}

/** کاربر به این بخش دسترسی ندارد (مثلاً کارمند برای endpoint مخصوص ادمین) */
export class DashboardForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
    this.name = "DashboardForbiddenError";
  }
}

async function fetchJson<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  try {
    const response = await axiosInstance.get<T>(path, { params });
    return response.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;

    if (status === 401) throw new DashboardAuthError();
    if (status === 403) throw new DashboardForbiddenError();

    throw error;
  }
}

/** کش کوتاه‌مدت برای جلوگیری از درخواست تکراری (مثلاً StrictMode) */
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);

  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.promise as Promise<T>;
  }

  const promise = loader();
  cache.set(key, { at: Date.now(), promise });

  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });

  return promise;
}

/** هر سه بازه را موازی می‌گیرد و در قالب {weekly, monthly, yearly} برمی‌گرداند */
async function fetchAllPeriods<T>(
  loader: (period: Period) => Promise<T>,
): Promise<Record<Period, T>> {
  const [weekly, monthly, yearly] = await Promise.all(PERIODS.map(loader));

  return { weekly, monthly, yearly };
}

/* ------------------------------------------------------------------ */
/*  Raw API types                                                      */
/* ------------------------------------------------------------------ */

type ChangeDirection = "up" | "down" | "flat";

interface ApiChange {
  percent: number;
  direction: ChangeDirection;
}

export interface ApiSummary {
  employees: { count: number; change: ApiChange };
  active_customers: {
    count: number;
    total: number;
    percent: number;
    change: ApiChange;
  };
  projects_in_progress: { count: number; change: ApiChange };
}

interface ApiSalesChart {
  period: Period;
  total: number;
  empty?: boolean;
  points: { key: string; label: string; value: number }[];
}

interface ApiCustomerSources {
  period: Period;
  total: number;
  items: { name: string; count: number; percent: number }[];
}

interface ApiCancelledByDepartment {
  period: Period;
  total: number;
  items: { department_id: number; name: string; count: number }[];
}

type ApiTopExperts = {
  period: Period;
  total: number;
  items: Record<string, unknown>[];
};

/* ------------------------------------------------------------------ */
/*  Summary cards                                                      */
/* ------------------------------------------------------------------ */

function signedChange(change?: ApiChange): number {
  if (!change) return 0;

  const percent = Math.abs(Number(change.percent) || 0);

  if (change.direction === "down") return -percent;
  if (change.direction === "up") return percent;

  return 0;
}

export async function getSummary() {
  const data = await cached("summary", () =>
    fetchJson<ApiSummary>(dashboardRoutes.summary),
  );

  return {
    employees: {
      total: data.employees.count,
      change: signedChange(data.employees.change),
    },
    customers: {
      active: data.active_customers.count,
      total: data.active_customers.total,
      activePct: data.active_customers.percent,
      change: signedChange(data.active_customers.change),
    },
    projects: {
      total: data.projects_in_progress.count,
      change: signedChange(data.projects_in_progress.change),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Sales chart                                                        */
/* ------------------------------------------------------------------ */

function formatLabel(label: string | number) {
  const text = String(label);

  return /^\d+$/.test(text) ? toPersianDigits(text) : text;
}

export async function getSalesChartData() {
  return fetchAllPeriods(async (period) => {
    const data = await cached(`sales:${period}`, () =>
      fetchJson<ApiSalesChart>(dashboardRoutes.salesChart, { period }),
    );

    return (data.points ?? []).map((point) => ({
      name: formatLabel(point.label),
      sales: Number(point.value) || 0,
    }));
  });
}

/* ------------------------------------------------------------------ */
/*  Cancelled tasks by department                                      */
/* ------------------------------------------------------------------ */

export async function getCancelledTasksByDepartment() {
  return fetchAllPeriods(async (period) => {
    const data = await cached(`cancelled:${period}`, () =>
      fetchJson<ApiCancelledByDepartment>(
        dashboardRoutes.cancelledByDepartment,
        { period },
      ),
    );

    return (data.items ?? []).map((item) => ({
      stage: item.name,
      issues: Number(item.count) || 0,
    }));
  });
}

/* ------------------------------------------------------------------ */
/*  Customer sources                                                   */
/* ------------------------------------------------------------------ */

const SOURCE_COLORS = [
  "#a78bfa",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

export async function getCustomerSourcesData() {
  return fetchAllPeriods(async (period) => {
    const data = await cached(`sources:${period}`, () =>
      fetchJson<ApiCustomerSources>(dashboardRoutes.customerSources, {
        period,
      }),
    );

    return (data.items ?? []).map((item, index) => {
      const color = SOURCE_COLORS[index % SOURCE_COLORS.length];

      return {
        resourceId: index + 1,
        name: item.name,
        value: Number(item.count) || 0,
        color,
        glow: `${color}20`,
      };
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Top experts                                                        */
/* ------------------------------------------------------------------ */

const TOP_EXPERTS_LIMIT = 5;

function pick<T>(source: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== "") {
      return value as T;
    }
  }

  return undefined;
}

/**
 * ساختار آیتم‌های top-experts در نمونه‌ی ارسال‌شده خالی بود،
 * بنابراین چند نام فیلد رایج پشتیبانی می‌شود.
 */
function mapExpert(item: Record<string, unknown>, index: number) {
  const username =
    pick<string>(item, ["username", "user_name"]) ?? "";

  const name =
    pick<string>(item, ["name", "full_name", "employee_name"]) ??
    (username === "admin" ? "مدیر سیستم" : username) ??
    "نامشخص";

  const count = Number(
    pick<number>(item, [
      "count",
      "customers_count",
      "customer_count",
      "total",
      "value",
    ]) ?? 0,
  );

  const change = item.change as Partial<ApiChange> | undefined;

  let trend: "up" | "down" | "same" = "same";
  let trendPct = 0;

  if (change && typeof change === "object") {
    trendPct = Math.abs(Number(change.percent) || 0);
    trend =
      change.direction === "up"
        ? "up"
        : change.direction === "down"
          ? "down"
          : "same";
  } else {
    const direction = pick<string>(item, ["trend", "direction"]);
    trendPct = Math.abs(
      Number(pick<number>(item, ["trend_percent", "trendPct", "percent"]) ?? 0),
    );
    trend =
      direction === "up" ? "up" : direction === "down" ? "down" : "same";
  }

  if (trendPct === 0) trend = "same";

  const label = String(name || "نامشخص");

  return {
    id: Number(pick<number>(item, ["id", "employee_id", "user_id"]) ?? index + 1),
    name: label,
    username,
    role:
      pick<string>(item, [
        "role",
        "department",
        "department_name",
        "position",
      ]) ?? "کارشناس فروش",
    avatar: pick<string>(item, ["avatar"]) ?? label.charAt(0).toUpperCase(),
    count,
    trend,
    trendPct,
  };
}

export async function getTopUsers() {
  return fetchAllPeriods(async (period) => {
    const data = await cached(`experts:${period}`, () =>
      fetchJson<ApiTopExperts>(dashboardRoutes.topExperts, {
        period,
        limit: TOP_EXPERTS_LIMIT,
      }),
    );

    return (data.items ?? []).map(mapExpert);
  });
}
