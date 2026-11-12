import { apiRoutes } from "@/lib/apiRoutes";
import { cached, listAll } from "@/lib/api/_core";

const TTL = 30_000;

export function getTasks<T = unknown>(): Promise<T[]> {
  return cached<T[]>("tasks:analytics:list", () => listAll<T>(apiRoutes.tasks), TTL);
}

export function getCustomers<T = unknown>(): Promise<T[]> {
  return cached<T[]>("customers:analytics:list", () => listAll<T>(apiRoutes.customers), TTL);
}

export function getEmployees<T = unknown>(): Promise<T[]> {
  return cached<T[]>("accounts:analytics:employees", () => listAll<T>(apiRoutes.employees), TTL);
}

export function getUsers<T = unknown>(): Promise<T[]> {
  return cached<T[]>("accounts:analytics:users", () => listAll<T>(apiRoutes.users), TTL);
}

export function getDepartments<T = unknown>(): Promise<T[]> {
  return cached<T[]>("departments:analytics:list", () => listAll<T>(apiRoutes.departments), TTL);
}

export function getDepartmentSteps<T = unknown>(): Promise<T[]> {
  return cached<T[]>("departments:analytics:steps", () => listAll<T>(apiRoutes.departmentSteps), TTL);
}
