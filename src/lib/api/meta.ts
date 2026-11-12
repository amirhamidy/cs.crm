import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import { accountsApi } from "./accounts";
import { departmentsApi } from "./departments";

export const metaApi = {
  departments: (): Promise<Department[]> => departmentsApi.list(),

  employees: async (): Promise<Employee[]> => {
    const list = await accountsApi.employees.all();
    return list.map((e) => ({ ...e, name: e.full_name }));
  },

  invalidate: () => {
    departmentsApi.invalidate();
    accountsApi.invalidate();
  },
};
