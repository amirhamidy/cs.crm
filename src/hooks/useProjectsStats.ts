import { useEffect, useMemo, useState } from "react";
import { tasksApi } from "@/lib/api";

export function useProjectsStats() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi
      .listAll()
      .then((list) => setData(list as any[]))
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
