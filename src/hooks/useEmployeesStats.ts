import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export function useEmployeesStats() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/accounts/api/v1/employee/list/")
      .then((res) =>
        setData(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])),
      )
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = data.filter(
      (e) => new Date(e.created_at) >= thisMonthStart,
    ).length;
    const lastMonth = data.filter((e) => {
      const d = new Date(e.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    }).length;

    const growth =
      lastMonth === 0
        ? thisMonth > 0
          ? 100
          : 0
        : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    return { total: data.length, growth, loading };
  }, [data, loading]);

  return stats;
}
