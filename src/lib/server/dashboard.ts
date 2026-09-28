import { cookies } from "next/headers";
import { cache } from "react";
import { JALALI_MONTHS, toJalali, toPersianDigits } from "@/lib/jalali";

const API_URL = "https://api.radcosys.ir";

interface ApiListResponse<T> {
  results?: T[];
  next?: string | null;
}

async function refreshAccessToken(refresh: string) {
  const response = await fetch(`${API_URL}/accounts/api/v1/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = await response.json();

  return typeof data.access === "string" && data.access ? data.access : null;
}

async function serverFetch<T>(path: string): Promise<T[]> {
  const cookieStore = await cookies();

  let access = cookieStore.get("crm-access")?.value;
  const refresh = cookieStore.get("crm-refresh")?.value;

  if (!access && !refresh) {
    throw new Error("UNAUTHORIZED");
  }

  let response = access
    ? await fetch(`${API_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
        cache: "no-store",
      })
    : null;

  if (!response || response.status === 401) {
    if (!refresh) {
      throw new Error("UNAUTHORIZED");
    }

    access = await refreshAccessToken(refresh);

    if (!access) {
      throw new Error("UNAUTHORIZED");
    }

    response = await fetch(`${API_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status}`);
  }

  const data: T[] | ApiListResponse<T> = await response.json();

  return Array.isArray(data)
    ? data
    : Array.isArray(data.results)
    ? data.results
    : [];
}

const getTasks = cache(() =>
  serverFetch<{
    id: number;
    status: "in_progress" | "completed" | "cancelled" | "sold";
    created_at: string;
    department_name?: string;
  }>("/tasks/api/v1/tasks/"),
);

const getCustomers = cache(() =>
  serverFetch<{
    id: number;
    status: number;
    created_by_username: string;
    created_at: string;
    source?: string | null;
  }>("/customers/api/v1/customers/"),
);

const getEmployees = cache(() =>
  serverFetch<{
    id: number;
    username: string;
    full_name: string;
    created_at: string;
  }>("/accounts/api/v1/employee/list/"),
);

const getDepartments = cache(() =>
  serverFetch<{
    id: number;
    name?: string;
    title?: string;
    department_name?: string;
  }>("/department/api/v1/department/list/"),
);

const getDepartmentEmployees = cache(() =>
  serverFetch<{
    id: number;
    employee: number;
    department_name: string;
  }>("/department/api/v1/department_employee/list/"),
);

const getResources = cache(() =>
  serverFetch<{
    id: number;
    title: string;
  }>("/tasks/api/v1/cases/resources/"),
);

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

  return {
    total,
    activePct,
    potentialPct: 100 - activePct,
  };
}

export async function getEmployeesStats() {
  const data = await getEmployees();

  const now = new Date();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = data.filter(
    (employee) => new Date(employee.created_at) >= thisMonthStart,
  ).length;

  const lastMonth = data.filter((employee) => {
    const date = new Date(employee.created_at);

    return date >= lastMonthStart && date < thisMonthStart;
  }).length;

  const growth =
    lastMonth === 0
      ? thisMonth > 0
        ? 100
        : 0
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return {
    total: data.length,
    growth,
  };
}

function createLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return createLocalDate(result);
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : createLocalDate(date);
}

function getJalaliParts(date: Date) {
  return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
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

export async function getSalesChartData() {
  const tasks = await getTasks();

  const soldTasks = tasks
    .filter((task) => task.status === "sold")
    .map((task) => {
      const date = parseDate(task.created_at);

      return date
        ? {
            date,
            dateKey: getDateKey(date),
          }
        : null;
    })
    .filter(
      (
        task,
      ): task is {
        date: Date;
        dateKey: string;
      } => task !== null,
    );

  const today = createLocalDate(new Date());

  const weeklyStart = addDays(today, -6);

  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weeklyStart, index);
    const dateKey = getDateKey(date);

    const count = soldTasks.filter((task) => task.dateKey === dateKey).length;

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

    const count = soldTasks.filter((task) => task.dateKey === dateKey).length;

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

  soldTasks.forEach((task) => {
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
}

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

  const today = createLocalDate(new Date());
  const DAY_MS = 24 * 60 * 60 * 1000;

  const getRange = (days: number) => {
    const startDate = new Date(today.getTime() - (days - 1) * DAY_MS);

    const endDate = new Date(today.getTime() + DAY_MS);

    const counts: Record<string, number> = {};

    tasks.forEach((task) => {
      if (task.status !== "cancelled") return;

      const date = parseDate(task.created_at);

      if (!date) return;

      if (date < startDate || date >= endDate) {
        return;
      }

      const department = task.department_name?.trim() || "نامشخص";

      counts[department] = (counts[department] ?? 0) + 1;
    });

    return allDepartments.map((department) => ({
      stage: department,
      issues: counts[department] ?? 0,
    }));
  };

  return {
    weekly: getRange(7),
    monthly: getRange(30),
    yearly: getRange(365),
  };
}

export async function getTopUsers() {
  const [customers, employees, departmentEmployees] = await Promise.all([
    getCustomers(),
    getEmployees(),
    getDepartmentEmployees(),
  ]);

  const nameMap = new Map(
    employees.map((employee) => [employee.username, employee.full_name]),
  );

  const employeeMap = new Map(
    employees.map((employee) => [employee.id, employee.username]),
  );

  const roleMap = new Map<string, string>();

  departmentEmployees.forEach((item) => {
    const username = employeeMap.get(item.employee);

    if (username && !roleMap.has(username)) {
      roleMap.set(username, item.department_name);
    }
  });

  const buildRange = (days: number) => {
    const now = Date.now();
    const rangeStart = now - days * 86400000;
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

        const count = current + previous;

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
          count,
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

export async function getCustomerSourcesData() {
  const [customers, resources] = await Promise.all([
    getCustomers(),
    getResources(),
  ]);

  const details = await Promise.all(
    customers.map(async (customer) => {
      try {
        const data = await serverFetch<{
          id: number;
          full_name: string;
          source: string | null;
          created_at: string;
        }>(`/customers/api/v1/customers/${customer.id}/`);

        return data[0] ?? null;
      } catch {
        return null;
      }
    }),
  );

  const validDetails = details.filter(
    (
      item,
    ): item is {
      id: number;
      full_name: string;
      source: string | null;
      created_at: string;
    } => item !== null,
  );

  const resourceMap = new Map(
    resources.map((resource) => [resource.id, resource.title]),
  );

  const COLORS = [
    "#a78bfa",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
  ];

  const buildRange = (days: number) => {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const counts = new Map<number, number>();

    validDetails.forEach((customer) => {
      if (!customer.source) return;

      const createdAt = new Date(customer.created_at);

      if (
        Number.isNaN(createdAt.getTime()) ||
        createdAt < start ||
        createdAt > now
      ) {
        return;
      }

      const sourceId = Number.parseInt(customer.source, 10);

      if (Number.isNaN(sourceId)) return;

      counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([resourceId, value]) => {
        const name = resourceMap.get(resourceId) ?? "نامشخص";

        const colorIndex =
          (((resourceId - 1) % COLORS.length) + COLORS.length) % COLORS.length;

        const color = COLORS[colorIndex];

        return {
          resourceId,
          name,
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
