"use client";

import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";
import type { AxiosResponse } from "axios";
import { useEffect, useState } from "react";

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

type CustomersApiResponse =
  | CustomerListItem[]
  | { results: CustomerListItem[]; next: string | null };

type EmployeesApiResponse =
  | EmployeeInfo[]
  | { results: EmployeeInfo[] };

type DepartmentEmployeesApiResponse =
  | DepartmentEmployeeItem[]
  | { results: DepartmentEmployeeItem[] };

export type TimeRange = "weekly" | "monthly" | "yearly";
type RangeData = Record<TimeRange, User[]>;

let employeeListCache: EmployeeInfo[] | null = null;
let inFlightRequest: Promise<EmployeeInfo[]> | null = null;

async function fetchEmployeeList(): Promise<EmployeeInfo[]> {
  if (employeeListCache) return employeeListCache;
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = axiosInstance
    .get<EmployeesApiResponse>("/accounts/api/v1/employee/list/")
    .then((response: AxiosResponse<EmployeesApiResponse>) => {
      const data: EmployeesApiResponse = response.data;
      const employees: EmployeeInfo[] = Array.isArray(data)
        ? data
        : data.results ?? [];

      employeeListCache = employees;
      inFlightRequest = null;
      return employees;
    })
    .catch((error: unknown) => {
      inFlightRequest = null;
      throw error;
    });

  return inFlightRequest;
}

export function clearEmployeeListCache() {
  employeeListCache = null;
}

async function fetchDepartmentEmployees(): Promise<DepartmentEmployeeItem[]> {
  const response: AxiosResponse<DepartmentEmployeesApiResponse> =
    await axiosInstance.get<DepartmentEmployeesApiResponse>(
      "/department/api/v1/department_employee/list/",
    );

  const data: DepartmentEmployeesApiResponse = response.data;

  return Array.isArray(data) ? data : data.results ?? [];
}

async function fetchAllCustomers(): Promise<CustomerListItem[]> {
  const customers: CustomerListItem[] = [];
  let url: string | null = "/customers/api/v1/customers/";
  const visited = new Set<string>();

  while (url !== null && !visited.has(url)) {
    visited.add(url);

    const currentUrl: string = url;

    const response: AxiosResponse<CustomersApiResponse> =
      await axiosInstance.get<CustomersApiResponse>(currentUrl);

    const data: CustomersApiResponse = response.data;

    if (Array.isArray(data)) {
      customers.push(...data);
      break;
    }

    customers.push(...(data.results ?? []));

    if (!data.next) {
      break;
    }

    try {
      const nextUrl: URL = new URL(data.next);
      url = `${nextUrl.pathname}${nextUrl.search}`;
    } catch {
      url = null;
    }
  }

  return customers;
}

function buildNameMap(
  employees: EmployeeInfo[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const employee of employees) {
    map.set(employee.username, employee.full_name);
  }

  return map;
}

function buildRoleMap(
  employees: EmployeeInfo[],
  departmentEmployees: DepartmentEmployeeItem[],
): Map<string, string> {
  const employeeMap = new Map<number, string>();

  for (const employee of employees) {
    employeeMap.set(employee.id, employee.username);
  }

  const map = new Map<string, string>();

  for (const item of departmentEmployees) {
    const username = employeeMap.get(item.employee);

    if (username && !map.has(username)) {
      map.set(username, item.department_name);
    }
  }

  return map;
}

function processRangeData(
  customers: CustomerListItem[],
  days: number,
  nameMap: Map<string, string>,
  roleMap: Map<string, string>,
): User[] {
  const now = Date.now();
  const rangeStart = now - days * 86400000;
  const midpoint = rangeStart + (now - rangeStart) / 2;
  const currentCounts = new Map<string, number>();
  const previousCounts = new Map<string, number>();

  for (const customer of customers) {
    if (customer.status !== 2) continue;

    const createdAt = new Date(customer.created_at).getTime();

    if (
      Number.isNaN(createdAt) ||
      createdAt < rangeStart ||
      createdAt > now
    ) {
      continue;
    }

    const username = customer.created_by_username || "نامشخص";
    const target =
      createdAt >= midpoint ? currentCounts : previousCounts;

    target.set(username, (target.get(username) ?? 0) + 1);
  }

  const usernames = new Set<string>([
    ...currentCounts.keys(),
    ...previousCounts.keys(),
  ]);

  return Array.from(usernames)
    .map((username: string, index: number): User => {
      const current = currentCounts.get(username) ?? 0;
      const previous = previousCounts.get(username) ?? 0;
      const count = current + previous;

      let trend: Trend = "same";
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
    .sort(
      (firstUser: User, secondUser: User) =>
        secondUser.count - firstUser.count,
    )
    .slice(0, 5);
}

export function useCurrentEmployee() {
  const username = useAuthStore((state) => state.username);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    let mounted = true;

    async function loadCurrentEmployee(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const employees: EmployeeInfo[] = await fetchEmployeeList();

        if (!mounted) return;

        setEmployee(
          employees.find(
            (item: EmployeeInfo) => item.username === username,
          ) ?? null,
        );
      } catch {
        if (!mounted) return;

        setEmployee(null);
        setError("خطا در دریافت اطلاعات کارمند");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentEmployee();

    return () => {
      mounted = false;
    };
  }, [hasHydrated, username]);

  return {
    employee,
    loading,
    error,
  };
}

export function useTopUsers() {
  const [data, setData] = useState<RangeData>({
    weekly: [],
    monthly: [],
    yearly: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTopUsers(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const result: [
          CustomerListItem[],
          EmployeeInfo[],
          DepartmentEmployeeItem[],
        ] = await Promise.all([
          fetchAllCustomers(),
          fetchEmployeeList(),
          fetchDepartmentEmployees(),
        ]);

        if (!mounted) return;

        const customers: CustomerListItem[] = result[0];
        const employees: EmployeeInfo[] = result[1];
        const departmentEmployees: DepartmentEmployeeItem[] = result[2];

        const nameMap: Map<string, string> =
          buildNameMap(employees);

        const roleMap: Map<string, string> =
          buildRoleMap(employees, departmentEmployees);

        setData({
          weekly: processRangeData(
            customers,
            7,
            nameMap,
            roleMap,
          ),
          monthly: processRangeData(
            customers,
            30,
            nameMap,
            roleMap,
          ),
          yearly: processRangeData(
            customers,
            365,
            nameMap,
            roleMap,
          ),
        });
      } catch {
        if (!mounted) return;
        setError("خطا در دریافت داده‌ها");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadTopUsers();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
}
