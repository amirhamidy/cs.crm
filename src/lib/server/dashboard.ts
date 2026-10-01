import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { JALALI_MONTHS, toJalali, toPersianDigits } from "@/lib/jalali";

const API_URL = "https://api.radcosys.ir";
const TIME_ZONE = "Asia/Tehran";
const DAY_MS = 86_400_000;
const DETAIL_CONCURRENCY = 8;

/* ------------------------------------------------------------------ */
/*  Auth + fetch layer (per-request, refresh is de-duplicated)         */
/* ------------------------------------------------------------------ */

export class DashboardAuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "DashboardAuthError";
  }
}

interface ApiListResponse<T> {
  results?: T[];
  next?: string | null;
}

// یک آبجکت مشترک برای کل یک request؛ همه‌ی fetch های موازی از همین توکن
// استفاده می‌کنند و فقط «یک» بار refresh زده می‌شود.
const authState = cache(() => ({
  access: null as string | null,
  refreshPromise: null as Promise<string | null> | null,
}));

async function readCookie(name: string) {
  return (await cookies()).get(name)?.value ?? null;
}

async function requestRefresh(): Promise<string | null> {
  const refresh = await readCookie("crm-refresh");
  if (!refresh) return null;

  try {
    const response = await fetch(`${API_URL}/accounts/api/v1/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();

    return typeof data.access === "string" && data.access ? data.access : null;
  } catch {
    return null;
  }
}

async function refreshAccess(stale: string | null): Promise<string> {
  const state = authState();

  // اگر یک درخواست موازی قبلاً توکن را عوض کرده، همان را برگردان
  if (state.access && state.access !== stale) return state.access;

  state.refreshPromise ??= requestRefresh();

  const token = await state.refreshPromise;

  if (!token) throw new DashboardAuthError();

  state.access = token;

  return token;
}

async function getAccess(): Promise<string> {
  const state = authState();

  if (state.access) return state.access;

  const fromCookie = await readCookie("crm-access");

  if (fromCookie) {
    state.access = fromCookie;
    return fromCookie;
  }

  return refreshAccess(null);
}

async function fetchJson<T>(path: string): Promise<T> {
  const send = (token: string) =>
    fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

  let token = await getAccess();
  let response = await send(token);

  if (response.status === 401) {
    token = await refreshAccess(token);
    response = await send(token);
  }

  if (response.status === 401) throw new DashboardAuthError();

  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status} ${path}`);
  }

  return (await response.json()) as T;
}

function toRelativePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

// آرایه‌ی ساده یا {results,next} را می‌خواند و صفحه‌های بعدی را هم دنبال می‌کند
async function fetchList<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  const visited = new Set<string>();
  let url: string | null = path;

  while (url && !visited.has(url) && visited.size < 50) {
    visited.add(url);

    const data: T[] | ApiListResponse<T> = await fetchJson(url);

    if (Array.isArray(data)) {
      items.push(...data);
      break;
    }

    items.push(...(data.results ?? []));
    url = data.next ? toRelativePath(data.next) : null;
  }

  return items;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));

  return results;
}

/* ------------------------------------------------------------------ */
/*  Raw data (cached per request)                                      */
/* ------------------------------------------------------------------ */

const getTasks = cache(() =>
  fetchList<{
    id: number;
    status: "in_progress" | "completed" | "cancelled" | "sold";
    created_at: string;
    department_name?: string;
  }>("/tasks/api/v1/tasks/"),
);

const getCustomers = cache(() =>
  fetchList<{
    id: number;
    status: number;
    created_by_username: string;
    created_at: string;
  }>("/customers/api/v1/customers/"),
);

const getEmployees = cache(() =>
  fetchList<{
    id: number;
    username: string;
    full_name: string;
    created_at: string;
  }>("/accounts/api/v1/employee/list/"),
);

const getDepartments = cache(() =>
  fetchList<{
    id: number;
    name?: string;
    title?: string;
    department_name?: string;
  }>("/department/api/v1/department/list/"),
);

const getDepartmentEmployees = cache(() =>
  fetchList<{
    id: number;
    employee: number;
    department_name: string;
  }>("/department/api/v1/department_employee/list/"),
);

const getResources = cache(() =>
  fetchList<{ id: number; title: string }>("/tasks/api/v1/cases/resources/"),
);

/* ------------------------------------------------------------------ */
/*  Date helpers — همه‌ی روزها بر اساس تقویم تهران، نه ساعت سرور       */
/* ------------------------------------------------------------------ */

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// شماره‌ی روز (از 1970) برای «روز تقویمی تهران»ِ یک لحظه
function tehranDayNumber(date: Date): number {
  const [year, month, day] = dayFormatter.format(date).split("-").map(Number);

  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function parseDayNumber(value: string): number | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : tehranDayNumber(date);
}

function dayNumberToParts(dayNumber: number) {
  const date = new Date(dayNumber * DAY_MS);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    weekday: date.getUTCDay(), // 0 = یکشنبه
  };
}

function jalaliOf(dayNumber: number) {
  const { year, month, day } = dayNumberToParts(dayNumber);

  return toJalali(year, month, day);
}

const WEEK_DAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

/* ------------------------------------------------------------------ */
/*  Stats cards                                                        */
/* ------------------------------------------------------------------ */

export async function getProjectsStats() {
  const data = await getTasks();
  const inProgress = data.filter((task) => task.status === "in_progress");

  const departments = new Set(
    inProgress.map((task) => task.department_name).filter(Boolean),
  );

  return {
    total: inProgress.length,
    deptCount: departments.size,
    hasProjects: inProgress.length > 0,
  };
}

export async function getCustomersStats() {
  const data = await getCustomers();

  const total = data.length;
  const active = data.filter((customer) => customer.status === 2).length;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  return { total, activePct, potentialPct: 100 - activePct };
}

export async function getEmployeesStats() {
  const data = await getEmployees();

  // ماه جاری/قبل بر اساس تقویم میلادیِ تهران
  const today = dayNumberToParts(tehranDayNumber(new Date()));
  const thisMonthStart = Date.UTC(today.year, today.month - 1, 1);
  const lastMonthStart = Date.UTC(today.year, today.month - 2, 1);

  let thisMonth = 0;
  let lastMonth = 0;

  for (const employee of data) {
    const day = parseDayNumber(employee.created_at);

    if (day === null) continue;

    const time = day * DAY_MS;

    if (time >= thisMonthStart) thisMonth += 1;
    else if (time >= lastMonthStart) lastMonth += 1;
  }

  const growth =
    lastMonth === 0
      ? thisMonth > 0
        ? 100
        : 0
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return { total: data.length, growth };
}

/* ------------------------------------------------------------------ */
/*  Sales chart                                                        */
/* ------------------------------------------------------------------ */

export async function getSalesChartData() {
  const tasks = await getTasks();

  const soldPerDay = new Map<number, number>();

  for (const task of tasks) {
    if (task.status !== "sold") continue;

    const day = parseDayNumber(task.created_at);

    if (day === null) continue;

    soldPerDay.set(day, (soldPerDay.get(day) ?? 0) + 1);
  }

  const today = tehranDayNumber(new Date());

  const weekly = Array.from({ length: 7 }, (_, index) => {
    const day = today - 6 + index;
    const count = soldPerDay.get(day) ?? 0;

    return {
      name: WEEK_DAYS[dayNumberToParts(day).weekday],
      sales: count,
      revenue: count,
    };
  });

  const monthly = Array.from({ length: 30 }, (_, index) => {
    const day = today - 29 + index;
    const count = soldPerDay.get(day) ?? 0;
    const [, , jalaliDay] = jalaliOf(day);

    return {
      name: toPersianDigits(jalaliDay),
      sales: count,
      revenue: count,
    };
  });

  const monthTotals = new Map<number, number>();

  for (let month = 1; month <= 12; month += 1) monthTotals.set(month, 0);

  soldPerDay.forEach((count, day) => {
    if (day < today - 364 || day > today) return;

    const [, month] = jalaliOf(day);

    monthTotals.set(month, (monthTotals.get(month) ?? 0) + count);
  });

  const [, currentMonth] = jalaliOf(today);

  const yearly = Array.from({ length: 12 }, (_, index) => {
    const month = ((currentMonth + index) % 12) + 1;
    const count = monthTotals.get(month) ?? 0;

    return {
      name: JALALI_MONTHS[month - 1],
      sales: count,
      revenue: count,
    };
  });

  return { weekly, monthly, yearly };
}

/* ------------------------------------------------------------------ */
/*  Cancelled tasks by department                                      */
/* ------------------------------------------------------------------ */

export async function getCancelledTasksByDepartment() {
  const [tasks, departments] = await Promise.all([
    getTasks(),
    getDepartments(),
  ]);

  const allDepartments = Array.from(
    new Set(
      departments
        .map(
          (department) =>
            department.name?.trim() ||
            department.title?.trim() ||
            department.department_name?.trim(),
        )
        .filter(Boolean),
    ),
  ) as string[];

  const today = tehranDayNumber(new Date());

  const buildRange = (days: number) => {
    const counts: Record<string, number> = {};

    for (const task of tasks) {
      if (task.status !== "cancelled") continue;

      const day = parseDayNumber(task.created_at);

      if (day === null || day < today - (days - 1) || day > today) continue;

      const department = task.department_name?.trim() || "نامشخص";

      counts[department] = (counts[department] ?? 0) + 1;
    }

    return allDepartments.map((department) => ({
      stage: department,
      issues: counts[department] ?? 0,
    }));
  };

  return {
    weekly: buildRange(7),
    monthly: buildRange(30),
    yearly: buildRange(365),
  };
}

/* ------------------------------------------------------------------ */
/*  Top users                                                          */
/* ------------------------------------------------------------------ */

export async function getTopUsers() {
  const [customers, employees, departmentEmployees] = await Promise.all([
    getCustomers(),
    getEmployees(),
    getDepartmentEmployees(),
  ]);

  const nameMap = new Map(
    employees.map((employee) => [employee.username, employee.full_name]),
  );

  const usernameById = new Map(
    employees.map((employee) => [employee.id, employee.username]),
  );

  const roleMap = new Map<string, string>();

  departmentEmployees.forEach((item) => {
    const username = usernameById.get(item.employee);

    if (username && !roleMap.has(username)) {
      roleMap.set(username, item.department_name);
    }
  });

  const buildRange = (days: number) => {
    const now = Date.now();
    const rangeStart = now - days * DAY_MS;
    const midpoint = rangeStart + (now - rangeStart) / 2;

    const currentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();

    customers.forEach((customer) => {
      if (customer.status !== 2) return;

      const createdAt = new Date(customer.created_at).getTime();

      if (
        Number.isNaN(createdAt) ||
        createdAt < rangeStart ||
        createdAt > now
      ) {
        return;
      }

      const username = customer.created_by_username || "نامشخص";
      const target = createdAt >= midpoint ? currentCounts : previousCounts;

      target.set(username, (target.get(username) ?? 0) + 1);
    });

    const usernames = new Set([
      ...currentCounts.keys(),
      ...previousCounts.keys(),
    ]);

    return Array.from(usernames)
      .map((username, index) => {
        const current = currentCounts.get(username) ?? 0;
        const previous = previousCounts.get(username) ?? 0;

        let trend: "up" | "down" | "same" = "same";
        let trendPct = 0;

        if (current > previous) {
          trend = "up";
          trendPct =
            previous === 0
              ? 100
              : Math.round(((current - previous) / previous) * 100);
        } else if (current < previous) {
          trend = "down";
          trendPct =
            previous === 0
              ? 0
              : Math.round(((previous - current) / previous) * 100);
        }

        return {
          id: index + 1,
          name:
            username === "admin"
              ? "مدیر سیستم"
              : nameMap.get(username) ?? username,
          username,
          role: roleMap.get(username) ?? "کارشناس فروش",
          avatar: username.charAt(0).toUpperCase(),
          count: current + previous,
          trend,
          trendPct,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  return {
    weekly: buildRange(7),
    monthly: buildRange(30),
    yearly: buildRange(365),
  };
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

interface CustomerDetail {
  id: number;
  source: string | null;
  created_at: string;
}

export async function getCustomerSourcesData() {
  const [customers, resources] = await Promise.all([
    getCustomers(),
    getResources(),
  ]);

  // فقط مشتری‌های یک سال اخیر نیاز به جزئیات (source) دارند
  const cutoff = Date.now() - 366 * DAY_MS;

  const recent = customers.filter((customer) => {
    const time = new Date(customer.created_at).getTime();

    return !Number.isNaN(time) && time >= cutoff;
  });

  const details = await mapWithConcurrency(
    recent,
    DETAIL_CONCURRENCY,
    async (customer) => {
      try {
        // endpoint جزئیات یک «آبجکت» برمی‌گرداند، نه آرایه
        return await fetchJson<CustomerDetail>(
          `/customers/api/v1/customers/${customer.id}/`,
        );
      } catch (error) {
        if (error instanceof DashboardAuthError) throw error;

        return null;
      }
    },
  );

  const validDetails = details.filter(
    (item): item is CustomerDetail => item !== null,
  );

  if (recent.length > 0 && validDetails.length === 0) {
    throw new Error("Could not load any customer details");
  }

  const resourceMap = new Map(
    resources.map((resource) => [resource.id, resource.title]),
  );

  const buildRange = (days: number) => {
    const now = Date.now();
    const start = now - days * DAY_MS;
    const counts = new Map<number, number>();

    validDetails.forEach((customer) => {
      if (!customer.source) return;

      const createdAt = new Date(customer.created_at).getTime();

      if (Number.isNaN(createdAt) || createdAt < start || createdAt > now) {
        return;
      }

      const sourceId = Number.parseInt(customer.source, 10);

      if (Number.isNaN(sourceId)) return;

      counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([resourceId, value]) => {
        const color =
          SOURCE_COLORS[
            (((resourceId - 1) % SOURCE_COLORS.length) + SOURCE_COLORS.length) %
              SOURCE_COLORS.length
          ];

        return {
          resourceId,
          name: resourceMap.get(resourceId) ?? "نامشخص",
          value,
          color,
          glow: `${color}20`,
        };
      })
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "fa"));
  };

  return {
    weekly: buildRange(7),
    monthly: buildRange(30),
    yearly: buildRange(365),
  };
}
