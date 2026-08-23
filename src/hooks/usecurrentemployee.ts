import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

export type EmployeeInfo = {
  id: number;
  full_name: string;
  username: string;
  created_at?: string;
  updated_at?: string;
};

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
    .get<EmployeeInfo[]>("/accounts/api/v1/employee/list/")
    .then((response) => {
      const list = Array.isArray(response.data)
        ? response.data
        : ((response.data as any).results ?? []);
      employeeListCache = list;
      inFlightRequest = null;
      return list;
    })
    .catch((err) => {
      inFlightRequest = null;
      throw err;
    });

  return inFlightRequest;
}

export function clearEmployeeListCache() {
  employeeListCache = null;
  inFlightRequest = null;
}

export function useCurrentEmployee() {
  const username = useAuthStore((state) => state.username);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!hasHydrated) {
      return;
    }

    if (!username) {
      setEmployee(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchEmployeeList()
      .then((list) => {
        if (!mounted) return;

        const match = list.find((emp) => emp.username === username) ?? null;

        if (!match) {
          setEmployee(null);
          setError("پروفایل کارمندی برای این کاربر پیدا نشد");
        } else {
          setEmployee(match);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setEmployee(null);
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

  return { employee, loading, error };
}
