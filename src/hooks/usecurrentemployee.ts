"use client";

import { useEffect, useMemo, useState } from "react";
import { accountsApi, departmentsApi } from "@/lib/api";
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
  is_manager: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CurrentDepartment = {
  id: number;
  name: string;
  isManager: boolean;
};

export function clearEmployeeListCache() {
  accountsApi.invalidate();
  departmentsApi.invalidate();
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

    Promise.all([
      accountsApi.employees.byUsername(username),
      departmentsApi.employees(),
    ])
      .then(([currentEmployee, departmentEmployees]) => {
        if (!mounted) return;

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
            isManager: item.is_manager === true,
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

export function useEmployeeNames() {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    accountsApi.employees
      .all()
      .then(
        (list) =>
          mounted &&
          setNames(
            Object.fromEntries(list.map((e) => [e.username, e.full_name])),
          ),
      )
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return names;
}
