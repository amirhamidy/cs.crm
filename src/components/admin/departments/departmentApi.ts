import { accountsApi, departmentsApi } from "@/lib/api";
import {
  DepartmentAPIItem,
  EmployeeAPIItem,
  DepartmentEmployeeAPIItem,
  StageAPIItem,
} from "./types";

export const departmentApi = {
  getDepartments: async (): Promise<DepartmentAPIItem[]> =>
    (await departmentsApi.list()).map((d) => ({
      id: d.id,
      name: d.name,
      order: d.order ?? 0,
    })),

  createDepartment: (payload: { name: string; order: number }) =>
    departmentsApi.create<DepartmentAPIItem>(payload),

  updateDepartment: (id: number, payload: { name: string; order: number }) =>
    departmentsApi.update<DepartmentAPIItem>(id, payload),

  deleteDepartment: (id: number) => departmentsApi.remove(id),

  getSteps: async (): Promise<StageAPIItem[]> =>
    (await departmentsApi.steps()).map((s) => ({
      id: s.id,
      department: s.department ?? 0,
      name: s.name,
      description: s.description ?? undefined,
      order: s.order ?? 0,
    })),

  createStep: (payload: {
    department: number;
    name: string;
    description?: string;
    order: number;
  }) => departmentsApi.createStep<StageAPIItem>(payload),

  updateStep: (
    id: number,
    payload: { name: string; description?: string; order: number },
  ) => departmentsApi.updateStep<StageAPIItem>(id, payload),

  deleteStep: (id: number) => departmentsApi.removeStep(id),

  getEmployees: async (): Promise<EmployeeAPIItem[]> =>
    (await accountsApi.employees.all()).map((e) => ({
      id: e.id,
      full_name: e.full_name,
      username: e.username,
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),

  getAssignments: async (): Promise<DepartmentEmployeeAPIItem[]> =>
    departmentsApi.employees(),

  assignEmployee: (payload: { employee: number; department: number }) =>
    departmentsApi.assign<DepartmentEmployeeAPIItem>(payload),

  removeEmployee: (assignmentId: number) =>
    departmentsApi.unassign(assignmentId),
};
