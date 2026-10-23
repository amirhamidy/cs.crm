import {
  byOrder,
  cached,
  createSearch,
  getOne,
  invalidate,
  listAll,
} from "./_core";
import type {
  Department,
  DepartmentEmployee,
  DepartmentStep,
} from "@/types/department";

const KEY = "departments:";
const TTL = 5 * 60_000;
const BASE = "/department/api/v1";

const URLS = {
  list: `${BASE}/department/list/`,
  detail: (id: number) => `${BASE}/department/${id}/`,
  steps: `${BASE}/department_step/`,
  step: (id: number) => `${BASE}/department_step/${id}/`,
  employees: `${BASE}/department_employee/list/`,
  employee: (id: number) => `${BASE}/department_employee/${id}/`,
} as const;

const list = () =>
  cached(
    `${KEY}list`,
    async () => (await listAll<Department>(URLS.list)).sort(byOrder),
    TTL,
  );

const steps = () =>
  cached(
    `${KEY}steps`,
    async () => (await listAll<DepartmentStep>(URLS.steps)).sort(byOrder),
    TTL,
  );

const employees = () =>
  cached(
    `${KEY}employees`,
    () => listAll<DepartmentEmployee>(URLS.employees),
    TTL,
  );

export const departmentsApi = {
  list,

  search: createSearch<Department>({
    key: KEY,
    url: URLS.list,
    all: list,
    sort: byOrder,
  }),

  get: (id: number) =>
    cached(
      `${KEY}detail:${id}`,
      async () =>
        (await list()).find((d) => d.id === id) ??
        getOne<Department>(URLS.detail(id)),
      TTL,
    ),

  steps,

  stepsOf: async (departmentId: number) =>
    (await steps()).filter((s) => s.department === departmentId),

  step: (id: number) =>
    cached(
      `${KEY}step:${id}`,
      () => getOne<DepartmentStep>(URLS.step(id)),
      TTL,
    ),

  employees,

  employeesOf: async (departmentId: number) =>
    (await employees()).filter((e) => e.department === departmentId),

  managersOf: async (departmentId: number) =>
    (await employees()).filter(
      (e) => e.department === departmentId && e.is_manager,
    ),

  employee: (id: number) =>
    cached(
      `${KEY}employee:${id}`,
      async () =>
        (await employees()).find((e) => e.id === id) ??
        getOne<DepartmentEmployee>(URLS.employee(id)),
      TTL,
    ),

  invalidate: () => invalidate(KEY),
};
