import axiosInstance from "@/lib/axiosInstance";
import type { Department, DepartmentEmployee, DepartmentStep } from "@/types/department";
import type { Paginated, SearchParams } from "@/types/pagination";
import { byOrder, cached, createSearch, dedupe, fetchPage, getOne, invalidate, listAll } from "./_core";

const KEY = "departments:";
const TTL = 5 * 60_000;
const BASE = "/department/api/v1";

const URLS = {
  list: `${BASE}/department/list/`,
  create: `${BASE}/department/create/`,
  detail: (id: number) => `${BASE}/department/${id}/`,
  update: (id: number) => `${BASE}/department/${id}/update/`,
  remove: (id: number) => `${BASE}/department/${id}/delete/`,
  steps: `${BASE}/department_step/`,
  stepCreate: `${BASE}/department_step/create/`,
  step: (id: number) => `${BASE}/department_step/${id}/`,
  stepUpdate: (id: number) => `${BASE}/department_step/${id}/update/`,
  stepRemove: (id: number) => `${BASE}/department_step/${id}/delete/`,
  employees: `${BASE}/department_employee/list/`,
  employeeCreate: `${BASE}/department_employee/create/`,
  employee: (id: number) => `${BASE}/department_employee/${id}/`,
  employeeUpdate: (id: number) => `${BASE}/department_employee/${id}/update/`,
  employeeRemove: (id: number) => `${BASE}/department_employee/${id}/delete/`,
} as const;

export type DepartmentListParams = SearchParams;
export type DepartmentStepListParams = SearchParams;
export type DepartmentEmployeeListParams = SearchParams;

export interface DepartmentPayload {
  name: string;
  order: number;
}

export interface DepartmentStepCreatePayload {
  department: number;
  name: string;
  description?: string;
  order: number;
}

export interface DepartmentStepUpdatePayload {
  name: string;
  description?: string;
  order: number;
}

export interface DepartmentEmployeeCreatePayload {
  employee: number;
  department: number;
}

export interface DepartmentEmployeeUpdatePayload {
  department: number;
  is_manager: boolean;
}

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

const page = <T>(url: string, name: string) =>
  (params: SearchParams = {}, signal?: AbortSignal): Promise<Paginated<T>> =>
    signal
      ? fetchPage<T>(url, params, signal)
      : dedupe(`${KEY}${name}:page:${JSON.stringify(params)}`, () =>
          fetchPage<T>(url, params),
        );

export const departmentsApi = {
  list,
  listPage: page<Department>(URLS.list, "list"),

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

  create: async <R = Department>(payload: DepartmentPayload) => {
    const { data } = await axiosInstance.post<R>(URLS.create, payload);
    invalidate(KEY);
    return data;
  },

  update: async <R = Department>(id: number, payload: DepartmentPayload) => {
    const { data } = await axiosInstance.put<R>(URLS.update(id), payload);
    invalidate(KEY);
    return data;
  },

  remove: async (id: number) => {
    const { data } = await axiosInstance.delete(URLS.remove(id));
    invalidate(KEY);
    return data;
  },

  steps,
  stepsPage: page<DepartmentStep>(URLS.steps, "steps"),

  stepsOf: async (departmentId: number) =>
    (await steps()).filter((s) => s.department === departmentId),

  step: (id: number) =>
    cached(
      `${KEY}step:${id}`,
      () => getOne<DepartmentStep>(URLS.step(id)),
      TTL,
    ),

  createStep: async <R = DepartmentStep>(
    payload: DepartmentStepCreatePayload,
  ) => {
    const { data } = await axiosInstance.post<R>(URLS.stepCreate, payload);
    invalidate(KEY);
    return data;
  },

  updateStep: async <R = DepartmentStep>(
    id: number,
    payload: DepartmentStepUpdatePayload,
  ) => {
    const { data } = await axiosInstance.put<R>(URLS.stepUpdate(id), payload);
    invalidate(KEY);
    return data;
  },

  removeStep: async (id: number) => {
    const { data } = await axiosInstance.delete(URLS.stepRemove(id));
    invalidate(KEY);
    return data;
  },

  employees,
  employeesPage: page<DepartmentEmployee>(URLS.employees, "employees"),

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

  assign: async <R = DepartmentEmployee>(
    payload: DepartmentEmployeeCreatePayload,
  ) => {
    const { data } = await axiosInstance.post<R>(URLS.employeeCreate, payload);
    invalidate(KEY);
    return data;
  },

  updateAssignment: async (
    id: number,
    payload: DepartmentEmployeeUpdatePayload,
  ) => {
    const { data } = await axiosInstance.patch<DepartmentEmployee>(
      URLS.employeeUpdate(id),
      payload,
    );
    invalidate(KEY);
    return data;
  },

  unassign: async (id: number) => {
    const { data } = await axiosInstance.delete(URLS.employeeRemove(id));
    invalidate(KEY);
    return data;
  },

  invalidate: () => invalidate(KEY),
};
