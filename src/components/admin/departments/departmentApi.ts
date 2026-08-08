import axiosInstance from "@/lib/axiosInstance";
import {
  DepartmentAPIItem,
  EmployeeAPIItem,
  DepartmentEmployeeAPIItem,
  StageAPIItem,
} from "./types";

const BASE = "https://api.radcosys.ir";

export const departmentApi = {
  getDepartments: () =>
    axiosInstance
      .get<DepartmentAPIItem[]>(`${BASE}/department/api/v1/department/list/`)
      .then((r) => r.data),

  createDepartment: (payload: { name: string; order: number }) =>
    axiosInstance
      .post<DepartmentAPIItem>(
        `${BASE}/department/api/v1/department/create/`,
        payload,
      )
      .then((r) => r.data),

  updateDepartment: (id: number, payload: { name: string; order: number }) =>
    axiosInstance
      .put<DepartmentAPIItem>(
        `${BASE}/department/api/v1/department/${id}/update/`,
        payload,
      )
      .then((r) => r.data),

  deleteDepartment: (id: number) =>
    axiosInstance
      .delete(`${BASE}/department/api/v1/department/${id}/delete/`)
      .then((r) => r.data),

  getSteps: () =>
    axiosInstance
      .get<StageAPIItem[]>(`${BASE}/department/api/v1/department_step/`)
      .then((r) => r.data),

  createStep: (payload: {
    department: number;
    name: string;
    description?: string;
    order: number;
  }) =>
    axiosInstance
      .post<StageAPIItem>(
        `${BASE}/department/api/v1/department_step/create/`,
        payload,
      )
      .then((r) => r.data),

  updateStep: (
    id: number,
    payload: { name: string; description?: string; order: number },
  ) =>
    axiosInstance
      .put<StageAPIItem>(
        `${BASE}/department/api/v1/department_step/${id}/update/`,
        payload,
      )
      .then((r) => r.data),

  deleteStep: (id: number) =>
    axiosInstance
      .delete(`${BASE}/department/api/v1/department_step/${id}/delete/`)
      .then((r) => r.data),

  getEmployees: () =>
    axiosInstance
      .get<EmployeeAPIItem[]>(`${BASE}/accounts/api/v1/employee/list/`)
      .then((r) => r.data),

  getAssignments: () =>
    axiosInstance
      .get<
        DepartmentEmployeeAPIItem[]
      >(`${BASE}/department/api/v1/department_employee/list/`)
      .then((r) => r.data),

  assignEmployee: (payload: { employee: number; department: number }) =>
    axiosInstance
      .post<DepartmentEmployeeAPIItem>(
        `${BASE}/department/api/v1/department_employee/create/`,
        payload,
      )
      .then((r) => r.data),

  removeEmployee: (assignmentId: number) =>
    axiosInstance
      .delete(
        `${BASE}/department/api/v1/department_employee/${assignmentId}/delete/`,
      )
      .then((r) => r.data),
};
