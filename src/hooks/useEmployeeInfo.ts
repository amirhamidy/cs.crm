import { useEffect, useState } from "react";
import { accountsApi } from "@/lib/api";

export type EmployeeInfo = {
  id: number;
  full_name: string;
  username: string;
  created_at?: string;
  updated_at?: string;
};

export function useEmployeeInfo(id: number | null | undefined) {
  const [data, setData] = useState<EmployeeInfo | null>(() => {
    if (typeof id === "number") return accountsApi.employees.peek(id) ?? null;
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return typeof id === "number" && !accountsApi.employees.peek(id);
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (typeof id !== "number" || id <= 0) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cachedEmployee = accountsApi.employees.peek(id);

    if (cachedEmployee) {
      setData(cachedEmployee);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    accountsApi.employees
      .get(id)
      .then((employee) => {
        if (!mounted) return;
        setData(employee);
      })
      .catch(() => {
        if (!mounted) return;
        setData(null);
        setError("دریافت اطلاعات کارمند انجام نشد");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  return {
    data,
    loading,
    error,
  };
}

export async function getEmployeeInfo(id: number): Promise<EmployeeInfo> {
  return accountsApi.employees.get(id);
}

export function clearEmployeeInfoCache() {
  accountsApi.clearCache();
}
