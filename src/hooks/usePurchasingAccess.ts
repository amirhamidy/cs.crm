"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export interface AuthMe {
  id: number;
  username: string;
  phone_number: string;
  type: 1 | 2;
}

export interface EmployeeAccount {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface PurchasingEmployeeItem {
  id: number;
  employee: number;
  employee_name: string;
  is_active: boolean;
  joined_at: string;
}

interface AccessState {
  auth: AuthMe | null;
  employeeAccount: EmployeeAccount | null;
  purchasingEmployee: PurchasingEmployeeItem | null;
  isAdmin: boolean;
  isEmployee: boolean;
  hasAccess: boolean;
  currentEmployeeId: number | null;
  currentPurchasingId: number | null;
  currentEmployeeName: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AccessState = {
  auth: null,
  employeeAccount: null,
  purchasingEmployee: null,
  isAdmin: false,
  isEmployee: false,
  hasAccess: false,
  currentEmployeeId: null,
  currentPurchasingId: null,
  currentEmployeeName: null,
  loading: true,
  error: null,
};

const normalizeList = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    "results" in value &&
    Array.isArray((value as { results?: unknown }).results)
  ) {
    return (value as { results: T[] }).results;
  }
  return [];
};

export function usePurchasingAccess() {
  const [state, setState] = useState<AccessState>(initialState);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const meResponse = await axiosInstance.get<AuthMe>(
        "/accounts/api/v1/auth/me/",
      );
      const me = meResponse.data;

      if (me.type === 1) {
        const purchasingResponse = await axiosInstance.get(
          "/purchasing/api/v1/employees/",
        );
        const purchasingList = normalizeList<PurchasingEmployeeItem>(
          purchasingResponse.data,
        );

        const adminAsPurchasing =
          purchasingList.find((item) => item.employee_name === me.username) ??
          purchasingList[0] ??
          null;

        setState({
          auth: me,
          employeeAccount: null,
          purchasingEmployee: adminAsPurchasing,
          isAdmin: true,
          isEmployee: false,
          hasAccess: true,
          currentEmployeeId: adminAsPurchasing?.employee ?? me.id,
          currentPurchasingId: adminAsPurchasing?.id ?? null,
          currentEmployeeName: me.username,
          loading: false,
          error: null,
        });
        return;
      }

      const [employeeListResponse, purchasingListResponse] = await Promise.all([
        axiosInstance.get("/accounts/api/v1/employee/list/"),
        axiosInstance.get("/purchasing/api/v1/employees/"),
      ]);

      const employeeList = normalizeList<EmployeeAccount>(
        employeeListResponse.data,
      );
      const purchasingList = normalizeList<PurchasingEmployeeItem>(
        purchasingListResponse.data,
      );

      const matchedEmployee =
        employeeList.find((item) => item.username === me.username) ?? null;

      if (!matchedEmployee) {
        setState({
          auth: me,
          employeeAccount: null,
          purchasingEmployee: null,
          isAdmin: false,
          isEmployee: true,
          hasAccess: false,
          currentEmployeeId: null,
          currentPurchasingId: null,
          currentEmployeeName: null,
          loading: false,
          error: "حساب کارمندی شما در سیستم منابع انسانی یافت نشد.",
        });
        return;
      }

      const matchedPurchasing =
        purchasingList.find((item) => item.employee === matchedEmployee.id) ??
        null;

      setState({
        auth: me,
        employeeAccount: matchedEmployee,
        purchasingEmployee: matchedPurchasing,
        isAdmin: false,
        isEmployee: true,
        hasAccess: !!matchedPurchasing && matchedPurchasing.is_active,
        currentEmployeeId: matchedEmployee.id,
        currentPurchasingId: matchedPurchasing?.id ?? null,
        currentEmployeeName: matchedEmployee.full_name,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      setState({
        ...initialState,
        loading: false,
        error:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "خطا در بررسی دسترسی کاربر",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
