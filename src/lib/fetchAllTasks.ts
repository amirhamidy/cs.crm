import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { TaskItem } from "@/types/task";

type TaskPage =
  | TaskItem[]
  | {
      results?: TaskItem[];
      data?: TaskItem[];
      next?: string | null;
    };

export function extractCaseId(task: TaskItem): string | null {
  const raw =
    (task as any).case ?? (task as any).case_id ?? (task as any).caseId ?? null;

  if (raw === null || raw === undefined) return null;

  if (typeof raw === "object") {
    const id = raw.id ?? raw.pk ?? null;
    return id !== null && id !== undefined ? String(id) : null;
  }

  return String(raw);
}

function pageItems(data: TaskPage | undefined | null): TaskItem[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
  }
  return [];
}

function pageNext(data: TaskPage | undefined | null): string | null {
  if (data && !Array.isArray(data) && typeof data === "object") {
    const next = data.next;
    if (typeof next === "string" && next.length > 0) {
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:"
      ) {
        return next.replace(/^http:\/\//i, "https://");
      }
      return next;
    }
  }
  return null;
}

interface FetchAllTasksOptions {
  caseId?: string | number;
  signal?: AbortSignal;
}

export async function fetchAllTasks(
  options: FetchAllTasksOptions = {},
): Promise<TaskItem[]> {
  const { caseId, signal } = options;
  const hasCase = caseId !== undefined && caseId !== null && caseId !== "";

  const collected: TaskItem[] = [];
  let url: string | null = apiRoutes.tasks;
  let isFirst = true;
  let guard = 0;

  while (url && guard < 200) {
    guard += 1;

    const res: { data: TaskPage } = await axiosInstance.get<TaskPage>(url, {
      signal,
      params: isFirst
        ? { ...(hasCase ? { case: caseId } : {}), _t: Date.now() }
        : undefined,
    });

    isFirst = false;
    collected.push(...pageItems(res.data));
    url = pageNext(res.data);
  }

  const unique = new Map<string, TaskItem>();
  collected.forEach((t) => unique.set(String((t as any).id), t));
  let list = Array.from(unique.values());

  if (hasCase) {
    const wanted = String(caseId);
    list = list.filter((t) => extractCaseId(t) === wanted);
  }

  return list;
}
