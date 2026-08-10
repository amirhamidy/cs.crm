import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export function useProjectsStats() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/tasks/api/v1/tasks/")
      .then((res) =>
        setData(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])),
      )
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const inProgress = data.filter((t) => t.status === "in_progress");
    const departments = Array.from(
      new Set(inProgress.map((t) => t.department_name).filter(Boolean)),
    );

    return {
      total: inProgress.length,
      deptCount: departments.length,
      hasProjects: inProgress.length > 0,
      loading,
    };
  }, [data, loading]);

  return stats;
}
