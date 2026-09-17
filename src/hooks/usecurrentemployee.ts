"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

export type EmployeeInfo = {
  id: number;
  full_name: string;
  username: string;
  created_at?: string;
  updated_at?: string;
};

export type DepartmentEmployeeInfo = {
  id: number;
  employee: number;
  employee_name: string;
  department: number;
  department_name: string;
  created_at?: string;
  updated_at?: string;
};

export type CurrentDepartment = {
  id: number;
  name: string;
};

let employeeListCache: EmployeeInfo[] | null = null;
let departmentEmployeeCache: DepartmentEmployeeInfo[] | null = null;

let employeeRequest: Promise<EmployeeInfo[]> | null = null;
let departmentEmployeeRequest: Promise<DepartmentEmployeeInfo[]> | null = null;

async function fetchEmployeeList(): Promise<EmployeeInfo[]> {
  if (employeeListCache) return employeeListCache;
  if (employeeRequest) return employeeRequest;

  employeeRequest = axiosInstance
    .get<EmployeeInfo[]>("/accounts/api/v1/employee/list/")
    .then((response) => {
      const data = response.data;

      const list = Array.isArray(data) ? data : ((data as any)?.results ?? []);

      employeeListCache = list;
      employeeRequest = null;

      return list;
    })
    .catch((error) => {
      employeeRequest = null;
      throw error;
    });

  return employeeRequest;
}

async function fetchDepartmentEmployees(): Promise<DepartmentEmployeeInfo[]> {
  if (departmentEmployeeCache) return departmentEmployeeCache;
  if (departmentEmployeeRequest) return departmentEmployeeRequest;

  departmentEmployeeRequest = axiosInstance
    .get<DepartmentEmployeeInfo[]>(
      "/department/api/v1/department_employee/list/",
    )
    .then((response) => {
      const data = response.data;

      const list = Array.isArray(data) ? data : ((data as any)?.results ?? []);

      departmentEmployeeCache = list;
      departmentEmployeeRequest = null;

      return list;
    })
    .catch((error) => {
      departmentEmployeeRequest = null;
      throw error;
    });

  return departmentEmployeeRequest;
}

export function clearEmployeeListCache() {
  employeeListCache = null;
  employeeRequest = null;
  departmentEmployeeCache = null;
  departmentEmployeeRequest = null;
}

export function useCurrentEmployee() {
  const username = useAuthStore((state) => state.username);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [departments, setDepartments] = useState<CurrentDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!hasHydrated) {
      return;
    }

    if (!username) {
      setEmployee(null);
      setDepartments([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([fetchEmployeeList(), fetchDepartmentEmployees()])
      .then(([employees, departmentEmployees]) => {
        if (!mounted) return;

        const currentEmployee =
          employees.find((item) => item.username === username) ?? null;

        if (!currentEmployee) {
          setEmployee(null);
          setDepartments([]);
          setError("پروفایل کارمندی برای این کاربر پیدا نشد");
          return;
        }

        const currentDepartments = departmentEmployees
          .filter(
            (item) => Number(item.employee) === Number(currentEmployee.id),
          )
          .map((item) => ({
            id: Number(item.department),
            name: item.department_name,
          }));

        setEmployee(currentEmployee);
        setDepartments(currentDepartments);
      })
      .catch(() => {
        if (!mounted) return;

        setEmployee(null);
        setDepartments([]);
        setError("دریافت اطلاعات کارمند انجام نشد");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [hasHydrated, username]);

  const departmentIds = useMemo(
    () => departments.map((department) => department.id),
    [departments],
  );

  return {
    employee,
    departments,
    departmentIds,
    employeeId: employee?.id ?? null,
    loading,
    error,
  };
}
