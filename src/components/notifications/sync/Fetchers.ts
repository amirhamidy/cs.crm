import axiosInstance from "@/lib/axiosInstance";
import { unwrapList } from "./Normalize";

async function getList(url: string, signal: AbortSignal): Promise<unknown[]> {
  const response = await axiosInstance.get<unknown>(url, {
    signal,
  });

  return unwrapList(response.data);
}

export const fetchInternalTasks = (signal: AbortSignal) =>
  getList("/tasks/api/v1/internal_task/", signal);

export const fetchRoutines = (signal: AbortSignal) =>
  getList("/tasks/api/v1/internal_task_routine/", signal);

export const fetchProjectTasks = (signal: AbortSignal) =>
  getList("/tasks/api/v1/tasks/", signal);

export const fetchEmployees = (signal: AbortSignal) =>
  getList("/accounts/api/v1/employee/list/", signal);

export const fetchUsers = (signal: AbortSignal) =>
  getList("/accounts/api/v1/user/list/", signal);
