"use client";

import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";
import type { AxiosResponse } from "axios";
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

type CustomersApiResponse =
  | CustomerListItem[]
  | {
      results: CustomerListItem[];
      next: string | null;
    };

type EmployeesApiResponse =
  | EmployeeInfo[]
  | {
      results: EmployeeInfo[];
    };

type DepartmentEmployeesApiResponse =
  | DepartmentEmployeeItem[]
  | {
      results: DepartmentEmployeeItem[];
    };

export type TimeRange = "weekly" | "monthly" | "yearly";

type RangeData = Record<TimeRange, User[]>;

let employeeListCache: EmployeeInfo[] | null = null;
let inFlightRequest: Promise<EmployeeInfo[]> | null = null;

async function fetchEmployeeList(): Promise<EmployeeInfo[]> {
  if (employeeListCache) {
    return employeeListCache;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = axiosInstance
    .get<EmployeesApiResponse>("/accounts/api/v1/employee/list/")
    .then((response: AxiosResponse<EmployeesApiResponse>) => {
      const employees = Array.isArray(response.data)
        ? response.data
        : (response.data.results ?? []);

      employeeListCache = employees;
      inFlightRequest = null;

      return employees;
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
  const response: AxiosResponse<DepartmentEmployeesApiResponse> =
    await axiosInstance.get<DepartmentEmployeesApiResponse>(
      "/department/api/v1/department_employee/list/",
    );

  const data: DepartmentEmployeesApiResponse = response.data;

  return Array.isArray(data) ? data : (data.results ?? []);
}

async function fetchAllCustomers(): Promise<CustomerListItem[]> {
  const allCustomers: CustomerListItem[] = [];
  let url: string | null = "/customers/api/v1/customers/";

  while (url) {
    const response: AxiosResponse<CustomersApiResponse> =
      await axiosInstance.get<CustomersApiResponse>(url);

    const data: CustomersApiResponse = response.data;

    if (Array.isArray(data)) {
      allCustomers.push(...data);
      break;
    }

    allCustomers.push(...(data.results ?? []));

    if (data.next) {
      const parsedUrl = new URL(data.next);
      url = `${parsedUrl.pathname}${parsedUrl.search}`;
    } else {
      url = null;
    }
  }

  return allCustomers;
}

function buildNameMap(employees: EmployeeInfo[]): Map<string, string> {
  const nameMap = new Map<string, string>();

  for (const employee of employees) {
    nameMap.set(employee.username, employee.full_name);
  }

  return nameMap;
}

function buildRoleMap(
  employees: EmployeeInfo[],
  departmentEmployees: DepartmentEmployeeItem[],
): Map<string, string> {
  const employeeIdToUsername = new Map<number, string>();

  for (const employee of employees) {
    employeeIdToUsername.set(employee.id, employee.username);
  }

  const roleMap = new Map<string, string>();

  for (const departmentEmployee of departmentEmployees) {
    const username = employeeIdToUsername.get(departmentEmployee.employee);

    if (username && !roleMap.has(username)) {
      roleMap.set(username, departmentEmployee.department_name);
    }
  }

  return roleMap;
}

function processRangeData(
  customers: CustomerListItem[],
  days: number,
  nameMap: Map<string, string>,
  roleMap: Map<string, string>,
): User[] {
  const now = Date.now();
  const rangeStart = now - days * 24 * 60 * 60 * 1000;
  const midpoint = rangeStart + (now - rangeStart) / 2;

  const currentCounts = new Map<string, number>();
  const previousCounts = new Map<string, number>();

  for (const customer of customers) {
    if (customer.status !== 2) {
      continue;
    }

    const createdAt = new Date(customer.created_at).getTime();

    if (Number.isNaN(createdAt) || createdAt < rangeStart || createdAt > now) {
      continue;
    }

    const username = customer.created_by_username || "نامشخص";

    if (createdAt >= midpoint) {
      currentCounts.set(username, (currentCounts.get(username) ?? 0) + 1);
    } else {
      previousCounts.set(username, (previousCounts.get(username) ?? 0) + 1);
    }
  }

  const usernames = new Set<string>([
    ...currentCounts.keys(),
    ...previousCounts.keys(),
  ]);

  const users: User[] = Array.from(usernames).map((username, index) => {
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
      trendPct = Math.round(((previous - current) / previous) * 100);
    }

    const name =
      username === "admin" ? "مدیر سیستم" : (nameMap.get(username) ?? username);

    return {
      id: index + 1,
      name,
      username,
      role: roleMap.get(username) ?? "کارشناس فروش",
      avatar: username.charAt(0).toUpperCase(),
      count,
      trend,
      trendPct,
    };
  });

  return users
    .sort((firstUser, secondUser) => secondUser.count - firstUser.count)
    .slice(0, 5);
}

export function useCurrentEmployee() {
  const username = useAuthStore((state) => state.username);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let isMounted = true;

    async function loadCurrentEmployee() {
      setLoading(true);
      setError(null);

      try {
        const employees = await fetchEmployeeList();

        if (!isMounted) {
          return;
        }

        const currentEmployee =
          employees.find(
            (employeeItem) => employeeItem.username === username,
          ) ?? null;

        setEmployee(currentEmployee);
      } catch {
        if (!isMounted) {
          return;
        }

        setEmployee(null);
        setError("خطا در دریافت اطلاعات کارمند");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentEmployee();

    return () => {
      isMounted = false;
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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    let isMounted = true;

    async function loadTopUsers() {
      try {
        setLoading(true);
        setError(null);

        const [customers, employees, departmentEmployees] = await Promise.all([
          fetchAllCustomers(),
          fetchEmployeeList(),
          fetchDepartmentEmployees(),
        ]);

        if (!isMounted) {
          return;
        }

        const nameMap = buildNameMap(employees);
        const roleMap = buildRoleMap(employees, departmentEmployees);

        setData({
          weekly: processRangeData(customers, 7, nameMap, roleMap),
          monthly: processRangeData(customers, 30, nameMap, roleMap),
          yearly: processRangeData(customers, 365, nameMap, roleMap),
        });
      } catch {
        if (isMounted) {
          setError("خطا در دریافت داده‌ها");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTopUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
}
