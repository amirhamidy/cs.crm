import { useState, useEffect } from "react";
import { departmentsApi } from "@/lib/api";

interface DepartmentMap {
  [employeeId: number]: string;
}

async function fetchDepartments(): Promise<DepartmentMap> {
  const data = await departmentsApi.employees();
  const map: DepartmentMap = {};
  for (const item of data) {
    if (map[item.employee] === undefined) {
      map[item.employee] = item.department_name;
    }
  }
  return map;
}

export function useEmployeeDepartments() {
  const [departments, setDepartments] = useState<DepartmentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchDepartments()
      .then((map) => {
        if (active) setDepartments(map);
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { departments, loading };
}
