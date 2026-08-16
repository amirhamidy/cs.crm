import { useEffect, useMemo, useState } from "react";
import { apiRoutes } from "@/lib/apiRoutes";
import axiosInstance from "@/lib/axiosInstance";

export type TimeRange = "weekly" | "monthly" | "yearly";

export interface EmployeeStat {
  key: string;
  full_name: string;
  total: number;
  sold: number;
  completed: number;
  in_progress: number;
  cancelled: number;
}

export interface StageStat {
  key: string;
  name: string;
  order: number;
  total: number;
  sold: number;
  completed: number;
  in_progress: number;
  cancelled: number;
}

export interface DepartmentStat {
  key: string;
  department_name: string;
  order: number;
  total: number;
  sold: number;
  completed: number;
  in_progress: number;
  cancelled: number;
  conversion: number;
  churnRate: number;
  stages: StageStat[];
  best: EmployeeStat | null;
  worst: EmployeeStat | null;
}

export interface BringerStat {
  key: string;
  full_name: string;
  count: number;
  actual: number;
  potential: number;
}

export interface Summary {
  totalTasks: number;
  sold: number;
  cancelled: number;
  completed: number;
  in_progress: number;
  totalCustomers: number;
  actualCustomers: number;
  potentialCustomers: number;
  departmentsCount: number;
}

interface RawTask {
  id: string | number;
  status?: string;
  department?: string | number | { id: string | number } | null;
  department_name?: string;
  current_step?: string | number | { id: string | number } | null;
  current_step_name?: string;
  assigned_employee?: unknown;
  assigned_employee_username?: unknown;
  assigned_employee_name?: unknown;
  created_at?: string;
  [key: string]: unknown;
}

interface RawCustomer {
  id: number;
  status?: number;
  customer_status?: number;
  created_by?: string | number;
  created_by_username?: string;
  creator_name?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface RawEmployee {
  id: number | string;
  username?: string;
  full_name?: string;
  name?: string;
  [key: string]: unknown;
}

interface RawUser {
  id: number | string;
  username?: string;
  type?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

interface RawDepartment {
  id: number | string;
  name?: string;
  title?: string;
  order?: number;
  [key: string]: unknown;
}

interface RawDepartmentStep {
  id: number | string;
  department?: number | string | { id: number | string } | null;
  name?: string;
  order?: number;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  results?: T[];
  next?: string | null;
}

const norm = (value: unknown) =>
  value === null || value === undefined
    ? ""
    : String(value).trim().toLowerCase();

const toNum = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const firstDefined = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const relationKey = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const item = value as { id?: unknown; apiId?: unknown };
    const id = item.id ?? item.apiId;
    if (id === null || id === undefined) return null;
    return String(id);
  }
  return String(value);
};

const statusOf = (task: RawTask) => norm(task.status);

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res = await axiosInstance.get(nextUrl);
    const data = res.data as T[] | PaginatedResponse<T>;
    const items = Array.isArray(data) ? data : (data.results ?? []);
    results.push(...items);

    if (!Array.isArray(data) && data.next) {
      const parsed = new URL(data.next);
      nextUrl = parsed.pathname + parsed.search;
    } else {
      nextUrl = null;
    }
  }

  return results;
}

function getTimeCutoff(range: TimeRange) {
  const now = Date.now();
  if (range === "weekly") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "monthly") return now - 30 * 24 * 60 * 60 * 1000;
  return now - 365 * 24 * 60 * 60 * 1000;
}

function filterByRange<T extends { created_at?: string }>(
  items: T[],
  range: TimeRange,
) {
  const cutoff = getTimeCutoff(range);
  return items.filter((item) => {
    if (!item.created_at) return false;
    const t = new Date(item.created_at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

const bump = (
  s: {
    sold: number;
    completed: number;
    in_progress: number;
    cancelled: number;
  },
  status: string,
) => {
  if (status === "sold") s.sold++;
  else if (status === "completed") s.completed++;
  else if (status === "in_progress") s.in_progress++;
  else if (status === "cancelled") s.cancelled++;
};

export function useAnalytics(range: TimeRange = "monthly") {
  const [tasks, setTasks] = useState<RawTask[]>([]);
  const [customers, setCustomers] = useState<RawCustomer[]>([]);
  const [employees, setEmployees] = useState<RawEmployee[]>([]);
  const [users, setUsers] = useState<RawUser[]>([]);
  const [departments, setDepartments] = useState<RawDepartment[]>([]);
  const [departmentSteps, setDepartmentSteps] = useState<RawDepartmentStep[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [
          tasksRes,
          customersRes,
          employeesRes,
          usersRes,
          departmentsRes,
          stepsRes,
        ] = await Promise.all([
          fetchAllPages<RawTask>(apiRoutes.tasks),
          fetchAllPages<RawCustomer>(apiRoutes.customers),
          fetchAllPages<RawEmployee>(apiRoutes.employees),
          fetchAllPages<RawUser>(apiRoutes.users),
          fetchAllPages<RawDepartment>(apiRoutes.departments),
          fetchAllPages<RawDepartmentStep>(apiRoutes.departmentSteps),
        ]);

        if (cancelled) return;

        setTasks(tasksRes);
        setCustomers(customersRes);
        setEmployees(employeesRes);
        setUsers(usersRes);
        setDepartments(departmentsRes);
        setDepartmentSteps(stepsRes);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.detail || e?.message || "خطا در دریافت داده‌ها",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTasks = useMemo(
    () => filterByRange(tasks, range),
    [tasks, range],
  );
  const filteredCustomers = useMemo(
    () => filterByRange(customers, range),
    [customers, range],
  );

  const employeeById = useMemo(() => {
    const m = new Map<string, RawEmployee>();
    employees.forEach((emp) => m.set(String(emp.id), emp));
    return m;
  }, [employees]);

  const employeeByUsername = useMemo(() => {
    const m = new Map<string, RawEmployee>();
    employees.forEach((emp) => {
      if (emp.username) m.set(norm(emp.username), emp);
    });
    return m;
  }, [employees]);

  const userById = useMemo(() => {
    const m = new Map<string, RawUser>();
    users.forEach((u) => m.set(String(u.id), u));
    return m;
  }, [users]);

  const departmentById = useMemo(() => {
    const m = new Map<string, RawDepartment>();
    departments.forEach((d) => m.set(String(d.id), d));
    return m;
  }, [departments]);

  const stepsByDepartment = useMemo(() => {
    const m = new Map<string, RawDepartmentStep[]>();
    departmentSteps.forEach((s) => {
      const depKey = relationKey(s.department);
      if (!depKey) return;
      if (!m.has(depKey)) m.set(depKey, []);
      m.get(depKey)!.push(s);
    });
    m.forEach((list) => list.sort((a, b) => toNum(a.order) - toNum(b.order)));
    return m;
  }, [departmentSteps]);

  const resolveEmployee = useMemo(() => {
    return (
      rawId: unknown,
      rawUsername?: unknown,
      rawName?: unknown,
    ): RawEmployee | null => {
      const idKey = relationKey(rawId);

      if (idKey) {
        const direct = employeeById.get(idKey);
        if (direct) return direct;

        const viaUser = userById.get(idKey);
        if (viaUser?.username) {
          const emp = employeeByUsername.get(norm(viaUser.username));
          if (emp) return emp;
        }

        const viaUsernameKey = employeeByUsername.get(norm(idKey));
        if (viaUsernameKey) return viaUsernameKey;
      }

      const usernameStr = typeof rawUsername === "string" ? rawUsername : "";
      if (usernameStr) {
        const emp = employeeByUsername.get(norm(usernameStr));
        if (emp) return emp;
      }

      const nameStr = typeof rawName === "string" ? rawName : "";
      if (nameStr) {
        const emp = employeeByUsername.get(norm(nameStr));
        if (emp) return emp;
      }

      return null;
    };
  }, [employeeById, employeeByUsername, userById]);

  const result = useMemo(() => {
    const departmentAcc = new Map<string, DepartmentStat>();
    const employeeAcc = new Map<string, EmployeeStat>();
    const deptEmployeeAcc = new Map<string, Map<string, EmployeeStat>>();

    const ensureDept = (key: string, name: string, order: number) => {
      if (!departmentAcc.has(key)) {
        departmentAcc.set(key, {
          key,
          department_name: name,
          order,
          total: 0,
          sold: 0,
          completed: 0,
          in_progress: 0,
          cancelled: 0,
          conversion: 0,
          churnRate: 0,
          stages: [],
          best: null,
          worst: null,
        });
      }
      return departmentAcc.get(key)!;
    };

    const ensureStage = (
      dep: DepartmentStat,
      key: string,
      name: string,
      order: number,
    ) => {
      let stage = dep.stages.find((s) => s.key === key);
      if (!stage) {
        stage = {
          key,
          name,
          order,
          total: 0,
          sold: 0,
          completed: 0,
          in_progress: 0,
          cancelled: 0,
        };
        dep.stages.push(stage);
      }
      return stage;
    };

    const ensureEmp = (key: string, fullName: string) => {
      if (!employeeAcc.has(key)) {
        employeeAcc.set(key, {
          key,
          full_name: fullName,
          total: 0,
          sold: 0,
          completed: 0,
          in_progress: 0,
          cancelled: 0,
        });
      }
      return employeeAcc.get(key)!;
    };

    const ensureDeptEmp = (
      deptKey: string,
      empKey: string,
      fullName: string,
    ) => {
      if (!deptEmployeeAcc.has(deptKey))
        deptEmployeeAcc.set(deptKey, new Map());
      const m = deptEmployeeAcc.get(deptKey)!;
      if (!m.has(empKey)) {
        m.set(empKey, {
          key: empKey,
          full_name: fullName,
          total: 0,
          sold: 0,
          completed: 0,
          in_progress: 0,
          cancelled: 0,
        });
      }
      return m.get(empKey)!;
    };

    departments.forEach((dep) => {
      const key = String(dep.id);
      const stat = ensureDept(
        key,
        firstDefined(dep.name, dep.title, "دپارتمان نامشخص"),
        toNum(dep.order),
      );
      const steps = stepsByDepartment.get(key) ?? [];
      steps.forEach((st) => {
        ensureStage(
          stat,
          String(st.id),
          firstDefined(st.name, "مرحله نامشخص"),
          toNum(st.order),
        );
      });
    });

    const getAssignees = (task: RawTask): RawEmployee[] => {
      const rawRaw = task.assigned_employee;
      const rawArr = Array.isArray(rawRaw)
        ? rawRaw
        : rawRaw !== null && rawRaw !== undefined
          ? [rawRaw]
          : [];

      const unameRaw = task.assigned_employee_username;
      const unameArr = Array.isArray(unameRaw)
        ? unameRaw
        : unameRaw !== null && unameRaw !== undefined
          ? [unameRaw]
          : [];

      const nameRaw = task.assigned_employee_name;
      const nameArr = Array.isArray(nameRaw)
        ? nameRaw
        : nameRaw !== null && nameRaw !== undefined
          ? [nameRaw]
          : [];

      const length = Math.max(rawArr.length, unameArr.length, nameArr.length);
      const out = new Map<string, RawEmployee>();

      for (let i = 0; i < length; i++) {
        const emp = resolveEmployee(rawArr[i], unameArr[i], nameArr[i]);
        if (emp) {
          out.set(`e:${norm(String(emp.id))}`, emp);
          continue;
        }
        const fallbackUsername = norm(unameArr[i]);
        const fallbackId = relationKey(rawArr[i]) ?? "";
        const fallbackName = firstDefined(
          typeof nameArr[i] === "string" ? (nameArr[i] as string) : "",
          fallbackUsername,
          fallbackId,
        );
        const fallbackKey = fallbackUsername || fallbackId;
        if (fallbackKey) {
          out.set(`u:${norm(fallbackKey)}`, {
            id: fallbackKey,
            username: fallbackUsername || fallbackKey,
            full_name: fallbackName || fallbackKey,
          });
        }
      }

      return Array.from(out.values());
    };

    filteredTasks.forEach((task) => {
      const status = statusOf(task);

      const rawDeptKey = relationKey(task.department);
      const deptKey =
        rawDeptKey && departmentById.has(rawDeptKey)
          ? rawDeptKey
          : (rawDeptKey ?? "unknown");
      const deptName = departmentById.has(deptKey)
        ? firstDefined(departmentById.get(deptKey)?.name, "دپارتمان نامشخص")
        : firstDefined(task.department_name, "دپارتمان نامشخص");
      const dep = ensureDept(
        deptKey,
        deptName,
        departmentById.has(deptKey)
          ? toNum(departmentById.get(deptKey)?.order)
          : 9999,
      );

      dep.total++;
      bump(dep, status);

      const rawStepKey = relationKey(task.current_step);
      const stepInfo = rawStepKey
        ? stepsByDepartment
            .get(deptKey)
            ?.find((s) => String(s.id) === rawStepKey)
        : undefined;
      const stageKey = rawStepKey ?? "unknown";
      const stageName = stepInfo
        ? firstDefined(stepInfo.name, "مرحله نامشخص")
        : firstDefined(task.current_step_name, "مرحله نامشخص");
      const stageOrder = stepInfo ? toNum(stepInfo.order) : 9999;
      const stage = ensureStage(dep, stageKey, stageName, stageOrder);

      stage.total++;
      bump(stage, status);

      getAssignees(task).forEach((emp) => {
        const empKey = norm(String(emp.id));
        const fullName = firstDefined(emp.full_name, emp.username, empKey);

        const empStat = ensureEmp(empKey, fullName);
        empStat.total++;
        bump(empStat, status);

        const deptEmp = ensureDeptEmp(deptKey, empKey, fullName);
        deptEmp.total++;
        bump(deptEmp, status);
      });
    });

    const departmentsList = Array.from(departmentAcc.values())
      .map((dep) => {
        dep.stages.sort(
          (a, b) => a.order - b.order || a.key.localeCompare(b.key),
        );

        const emps = Array.from(deptEmployeeAcc.get(dep.key)?.values() ?? []);

        

        const worstSorted = [...emps].sort(
          (a, b) => b.cancelled - a.cancelled || b.total - a.total,
        );
        dep.worst =
          worstSorted[0] && worstSorted[0].cancelled > 0
            ? worstSorted[0]
            : null;

        dep.conversion = dep.total
          ? Math.round((dep.sold / dep.total) * 100)
          : 0;
        dep.churnRate = dep.total
          ? Math.round((dep.cancelled / dep.total) * 100)
          : 0;
        return dep;
      })
      .sort(
        (a, b) =>
          a.order - b.order ||
          a.department_name.localeCompare(b.department_name),
      );

    const bestEmployees = departmentsList
      .map((dep) => {
        if (!dep.best) return null;
        return {
          key: dep.best.key,
          full_name: dep.best.full_name,
          sold: dep.best.sold,
          completed: dep.best.completed,
          cancelled: dep.best.cancelled,
          total: dep.best.total,
          department_key: dep.key,
          department_name: dep.department_name,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.sold - a.sold || b.total - a.total);

    const weakestEmployees = Array.from(employeeAcc.values())
      .filter((e) => e.total > 0)
      .sort((a, b) => b.cancelled - a.cancelled || b.total - a.total)
      .slice(0, 10);

    const bringerAcc = new Map<string, BringerStat>();

    filteredCustomers.forEach((cust) => {
      const emp = resolveEmployee(
        cust.created_by,
        cust.created_by_username,
        cust.creator_name,
      );
      const key = emp
        ? norm(String(emp.id))
        : norm(cust.created_by_username) || norm(cust.created_by) || "unknown";

      if (!bringerAcc.has(key)) {
        bringerAcc.set(key, {
          key,
          full_name: emp
            ? firstDefined(emp.full_name, emp.username, key)
            : firstDefined(
                cust.creator_name,
                cust.created_by_username,
                typeof cust.created_by === "string" ? cust.created_by : "",
                "نامشخص",
              ),
          count: 0,
          actual: 0,
          potential: 0,
        });
      }
      const row = bringerAcc.get(key)!;
      row.count++;
      if (toNum(cust.status ?? cust.customer_status) === 2) row.actual++;
      else row.potential++;
    });

    const topBringers = Array.from(bringerAcc.values()).sort(
      (a, b) => b.actual - a.actual || b.count - a.count,
    );

    const summary: Summary = {
      totalTasks: filteredTasks.length,
      sold: filteredTasks.filter((t) => statusOf(t) === "sold").length,
      cancelled: filteredTasks.filter((t) => statusOf(t) === "cancelled")
        .length,
      completed: filteredTasks.filter((t) => statusOf(t) === "completed")
        .length,
      in_progress: filteredTasks.filter((t) => statusOf(t) === "in_progress")
        .length,
      totalCustomers: filteredCustomers.length,
      actualCustomers: filteredCustomers.filter(
        (c) => toNum(c.status ?? c.customer_status) === 2,
      ).length,
      potentialCustomers: filteredCustomers.filter(
        (c) => toNum(c.status ?? c.customer_status) !== 2,
      ).length,
      departmentsCount: departmentsList.length,
    };

    return {
      departmentsList,
      bestEmployees,
      weakestEmployees,
      topBringers,
      summary,
    };
  }, [
    departmentById,
    stepsByDepartment,
    departments,
    resolveEmployee,
    filteredCustomers,
    filteredTasks,
  ]);

  return {
    loading,
    error,
    tasks: filteredTasks,
    customers: filteredCustomers,
    employees,
    departments: result.departmentsList,
    bestEmployees: result.bestEmployees,
    weakestEmployees: result.weakestEmployees,
    topBringers: result.topBringers,
    summary: result.summary,
  };
}
