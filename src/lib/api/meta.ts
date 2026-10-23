import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import {
  cached,
  fetchAllPages,
  invalidate,
  toPaginated,
  type RawList,
} from "./_core";

const KEY = "meta:";
const TTL = 5 * 60_000;

function listAllFrom<T>(url: string) {
  return fetchAllPages<T>(async (params) => {
    const res = await axiosInstance.get<RawList<T>>(url, { params });
    return toPaginated(res.data);
  });
}

export const metaApi = {
  departments: () =>
    cached(
      `${KEY}departments:`,
      () => listAllFrom<Department>(apiRoutes.departments),
      TTL,
    ),

  employees: () =>
    cached(
      `${KEY}employees:`,
      () => listAllFrom<Employee>("/accounts/api/v1/employee/list/"),
      TTL,
    ),

  invalidate: () => invalidate(KEY),
};
