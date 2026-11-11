import { fetchAllPages, fetchPage } from "@/lib/api/_core";

// لیست‌ها صفحه‌بندی شده‌اند؛ برای تشخیص تغییرات (نوتیفیکیشن) همهٔ صفحات لازم است
// وگرنه تغییر در آیتم‌های بعد از صفحهٔ اول هیچ‌وقت دیده نمی‌شود.
async function getList(url: string, signal: AbortSignal): Promise<unknown[]> {
  return fetchAllPages<unknown>((p) =>
    fetchPage<unknown>(url, { ...p, page_size: 100 }, signal),
  );
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
