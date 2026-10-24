import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { TaskItem } from "@/types/task";
import type { PageParams } from "@/types/pagination";
import {
  cached,
  dedupe,
  fetchAllPages,
  invalidate,
  listAll as listAllPages,
  toPaginated,
  withSignal,
  type Paginated,
  type RawList,
} from "./_core";

const KEY = "tasks:";
const TTL = 30_000;

type CaseRef =
  | number
  | string
  | { id?: number | string; pk?: number | string }
  | null
  | undefined;

export interface TaskListParams extends PageParams {
  case?: number | string;
}

export interface FetchAllTasksOptions {
  caseId?: string | number | null;
  signal?: AbortSignal;
  fresh?: boolean;
}

export function extractCaseId(task: TaskItem): string | null {
  const t = task as TaskItem & { case?: CaseRef; case_id?: CaseRef; caseId?: CaseRef };
  const raw = t.case ?? t.case_id ?? t.caseId;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object") {
    const id = raw.id ?? raw.pk;
    return id === null || id === undefined ? null : String(id);
  }
  return String(raw);
}

function uniqueById(list: TaskItem[]): TaskItem[] {
  const map = new Map<string, TaskItem>();
  list.forEach((t) => map.set(String(t.id), t));
  return [...map.values()];
}

const allKey = (caseId?: string | number) => `${KEY}all:${caseId ?? "*"}:`;

const list = (params: TaskListParams = {}): Promise<Paginated<TaskItem>> =>
  dedupe(`${KEY}list:${JSON.stringify(params)}`, async () => {
    const res = await axiosInstance.get<RawList<TaskItem>>(apiRoutes.tasks, { params });
    return toPaginated<TaskItem>(res.data);
  });

const listAll = (caseId?: string | number) =>
  cached(
    allKey(caseId),
    async () => {
      const all = await fetchAllPages<TaskItem>((p) =>
        list(caseId === undefined ? { ...p, page_size: 100 } : { ...p, page_size: 100, case: caseId }),
      );
      const unique = uniqueById(all);
      if (caseId === undefined) return unique;
      const wanted = String(caseId);
      return unique.filter((t) => extractCaseId(t) === wanted);
    },
    TTL,
  );

const ARCHIVE_URL = "/tasks/api/v1/task_archive/";

/** All pages of /tasks/api/v1/task_archive/ as a plain array. */
const archiveAll = <T = unknown>() =>
  cached(`${KEY}archive:`, () => listAllPages<T>(ARCHIVE_URL), TTL);

export const tasksApi = {
  list,
  listAll,
  archiveAll,

  get: <T = TaskItem>(id: number | string) =>
    dedupe(`${KEY}get:${id}`, async () => {
      const res = await axiosInstance.get<T>(`/tasks/api/v1/tasks/${id}/`);
      return res.data;
    }),

  logs: async <T = unknown>(id: number | string) => {
    const res = await axiosInstance.get<T>(`/tasks/api/v1/tasks/${id}/logs/`);
    return res.data;
  },

  stepDeadline: async <T = unknown>(id: number | string, step: number | string) => {
    const res = await axiosInstance.get<T>(
      `/tasks/api/v1/tasks/${id}/steps/${step}/deadline/`,
    );
    return res.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`/tasks/api/v1/tasks/${id}/delete/`);
    invalidate(KEY);
  },

  invalidate: () => invalidate(KEY),
};

export function fetchAllTasks({ caseId, signal, fresh }: FetchAllTasksOptions = {}) {
  const id = caseId === "" || caseId === null ? undefined : caseId;
  if (fresh) invalidate(allKey(id));
  return withSignal(listAll(id), signal);
}
