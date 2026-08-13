import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export type EmployeeInfo = {
  id: number;
  full_name: string;
  username: string;
  created_at?: string;
  updated_at?: string;
};

const employeeCache: Record<number, EmployeeInfo> = {};

export function useEmployeeInfo(id: number | null | undefined) {
  const [data, setData] = useState<EmployeeInfo | null>(() => {
    if (typeof id === "number" && employeeCache[id]) {
      return employeeCache[id];
    }

    return null;
  });

  const [loading, setLoading] = useState(() => {
    return typeof id === "number" && !employeeCache[id];
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

    const cachedEmployee = employeeCache[id];

    if (cachedEmployee) {
      setData(cachedEmployee);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    axiosInstance
      .get<EmployeeInfo>(`/accounts/api/v1/employee/${id}/`)
      .then((response) => {
        if (!mounted) return;

        const employee = response.data;

        employeeCache[id] = employee;
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

export async function getEmployeeInfo(id: number) {
  if (employeeCache[id]) {
    return employeeCache[id];
  }

  const response = await axiosInstance.get<EmployeeInfo>(
    `/accounts/api/v1/employee/${id}/`,
  );

  employeeCache[id] = response.data;

  return response.data;
}

export function clearEmployeeInfoCache() {
  Object.keys(employeeCache).forEach((key) => {
    delete employeeCache[Number(key)];
  });
}
