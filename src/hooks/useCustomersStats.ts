import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export function useCustomersStats() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/customers/api/v1/customers/")
      .then((res) =>
        setData(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])),
      )
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter((c) => c.status === 2).length;
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
    const potentialPct = 100 - activePct;

    return { total, activePct, potentialPct, loading };
  }, [data, loading]);

  return stats;
}
