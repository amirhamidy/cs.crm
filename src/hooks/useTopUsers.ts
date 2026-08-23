"use client";

import axiosInstance from "@/lib/axiosInstance";
import { useEffect, useRef, useState } from "react";

type Trend = "up" | "down" | "same";

interface User {
  id: number;
  name: string;
  role: string;
  username: string;
  avatar: string;
  count: number;
  trend: Trend;
  trendPct: number;
}

interface CustomerListItem {
  id: number;
  status: number;
  created_by_username: string;
  created_at: string;
}

interface EmployeeInfo {
  id: number;
  full_name: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentEmployeeItem {
  id: number;
  employee: number;
  department_name: string;
}

export type TimeRange = "weekly" | "monthly" | "yearly";

type RangeData = Record<TimeRange, User[]>;

let employeeListCache: EmployeeInfo[] | null = null;
let inFlightRequest: Promise<EmployeeInfo[]> | null = null;

async function fetchEmployeeList(): Promise<EmployeeInfo[]> {
  if (employeeListCache) return employeeListCache;
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = axiosInstance
    .get<EmployeeInfo[] | { results: EmployeeInfo[] }>(
      "/accounts/api/v1/employee/list/",
    )
    .then((res) => {
      const list = Array.isArray(res.data)
        ? res.data
        : ((res.data as { results: EmployeeInfo[] }).results ?? []);
      employeeListCache = list;
      inFlightRequest = null;
      return list;
    })
    .catch(() => {
      inFlightRequest = null;
      return [];
    });

  return inFlightRequest;
}

export function clearEmployeeListCache() {
  employeeListCache = null;
}

async function fetchDepartmentEmployees(): Promise<DepartmentEmployeeItem[]> {
  const res = await axiosInstance.get<
    DepartmentEmployeeItem[] | { results: DepartmentEmployeeItem[] }
  >("/department/api/v1/department_employee/list/");
  return Array.isArray(res.data)
    ? res.data
    : ((res.data as { results: DepartmentEmployeeItem[] }).results ?? []);
}

async function fetchAllCustomers(): Promise<CustomerListItem[]> {
  const all: CustomerListItem[] = [];
  let url: string | null = "/customers/api/v1/customers/";

  while (url) {
    const response = await axiosInstance.get(url);
    const data = response.data as
      | CustomerListItem[]
      | { results: CustomerListItem[]; next: string | null };

    if (Array.isArray(data)) {
      all.push(...data);
      break;
    } else {
      all.push(...(data.results ?? []));
      if (data.next) {
        const parsed: URL = new URL(data.next);
        url = parsed.pathname + parsed.search;
      } else {
        url = null;
      }
    }
  }

  return all;
}

function buildNameMap(employees: EmployeeInfo[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const emp of employees) {
    map.set(emp.username, emp.full_name);
  }
  return map;
}

function buildRoleMap(
  employees: EmployeeInfo[],
  departmentEmployees: DepartmentEmployeeItem[],
): Map<string, string> {
  const empIdToUsername = new Map<number, string>();
  for (const emp of employees) {
    empIdToUsername.set(emp.id, emp.username);
  }

  const map = new Map<string, string>();
  for (const de of departmentEmployees) {
    const username = empIdToUsername.get(de.employee);
    if (username && !map.has(username)) {
      map.set(username, de.department_name);
    }
  }
  return map;
}

function processRangeData(
  customers: CustomerListItem[],
  days: number,
  nameMap?: Map<string, string>,
  roleMap?: Map<string, string>,
): User[] {
  const now = Date.now();
  const rangeStart = now - days * 24 * 60 * 60 * 1000;
  const midPoint = rangeStart + (now - rangeStart) / 2;

  const inRange = customers.filter((c) => {
    if (c.status !== 2) return false;
    const t = new Date(c.created_at).getTime();
    return t >= rangeStart && t <= now;
  });

  const currentCounts = new Map<string, number>();
  const previousCounts = new Map<string, number>();

  for (const c of inRange) {
    const u = c.created_by_username || "نامشخص";
    const t = new Date(c.created_at).getTime();
    if (t >= midPoint) {
      currentCounts.set(u, (currentCounts.get(u) ?? 0) + 1);
    } else {
      previousCounts.set(u, (previousCounts.get(u) ?? 0) + 1);
    }
  }

  const allUsernames = new Set([
    ...currentCounts.keys(),
    ...previousCounts.keys(),
  ]);

  const users: User[] = Array.from(allUsernames).map((username, index) => {
    const current = currentCounts.get(username) ?? 0;
    const previous = previousCounts.get(username) ?? 0;
    const total = current + previous;

    let trend: Trend = "same";
    let trendPct = 0;

    if (current > previous) {
      trend = "up";
      trendPct =
        previous === 0 && current > 0
          ? 100
          : Math.round((Math.abs(current - previous) / previous) * 100);
    } else if (current < previous) {
      trend = "down";
      trendPct = Math.round((Math.abs(current - previous) / previous) * 100);
    }

    const displayName =
      username === "admin"
        ? "مدیر سیستم"
        : (nameMap?.get(username) ?? username);

    const role = roleMap?.get(username) ?? "کارشناس فروش";

    return {
      id: index + 1,
      name: displayName,
      username,
      role,
      avatar: username.charAt(0).toUpperCase(),
      count: total,
      trend,
      trendPct,
    };
  });

  return users.sort((a, b) => b.count - a.count).slice(0, 5);
}

export function useCurrentEmployee() {
  const { useAuthStore } = require("@/store/authStore");
  const username: string = useAuthStore(
    (s: { username: string }) => s.username,
  );
  const hasHydrated: boolean = useAuthStore(
    (s: { hasHydrated: boolean }) => s.hasHydrated,
  );

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    setLoading(true);
    fetchEmployeeList()
      .then((list) => {
        const match = list.find((emp) => emp.username === username) ?? null;
        setEmployee(match);
        setLoading(false);
      })
      .catch(() => {
        setError("خطا در دریافت اطلاعات کارمند");
        setLoading(false);
      });
  }, [username, hasHydrated]);

  return { employee, loading, error };
}

export function useTopUsers() {
  const [data, setData] = useState<RangeData>({
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        const [customers, employees, departmentEmployees] = await Promise.all([
          fetchAllCustomers(),
          fetchEmployeeList().catch(() => [] as EmployeeInfo[]),
          fetchDepartmentEmployees().catch(
            () => [] as DepartmentEmployeeItem[],
          ),
        ]);

        const nameMap = buildNameMap(employees);
        const roleMap = buildRoleMap(employees, departmentEmployees);

        setData({
          weekly: processRangeData(customers, 7, nameMap, roleMap),
          monthly: processRangeData(customers, 30, nameMap, roleMap),
          yearly: processRangeData(customers, 365, nameMap, roleMap),
        });
      } catch (err) {
        setError("خطا در دریافت داده‌ها");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}
