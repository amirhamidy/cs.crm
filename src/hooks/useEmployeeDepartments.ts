import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";

interface DepartmentMap {
  [employeeId: number]: string;
}

let departmentCache: DepartmentMap | null = null;
let inFlight: Promise<DepartmentMap> | null = null;

async function fetchDepartments(): Promise<DepartmentMap> {
  const res = await axiosInstance.get(
    "/department/api/v1/department_employee/list/",
  );
  const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
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
    if (departmentCache) {
      setDepartments(departmentCache);
      setLoading(false);
      return;
    }
    if (!inFlight)
      inFlight = fetchDepartments().catch((e) => {
        inFlight = null;
        throw e;
      });
    inFlight
      .then((map) => {
        departmentCache = map;
        if (active) setDepartments(map);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { departments, loading };
}
