import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type {
  TaskItem,
  TransferTaskPayload,
  TransferTaskResponse,
} from "@/types/task";
import type { PageParams } from "@/types/pagination";
import {
  cached,
  dedupe,
  fetchAllPages,
  fetchPage,
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


export function parseTransferError(error: unknown): string {
  const fallback = "انتقال تسک انجام نشد؛ لطفاً دوباره تلاش کنید";
  const err = error as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };

  if (!err?.response) {
    return "اتصال به سرور برقرار نشد؛ اینترنت خود را بررسی کنید";
  }

  const { status, data } = err.response;

  const first = (value: unknown): string | null => {
    if (typeof value === "string") return value.trim() || null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = first(item);
        if (found) return found;
      }
    }
    return null;
  };

  const fromBody = (() => {
    if (!data) return null;
    if (typeof data === "string") {
      
      return data.trim().startsWith("<") ? null : first(data);
    }
    if (Array.isArray(data)) return first(data);
    if (typeof data === "object") {
      const body = data as Record<string, unknown>;
      return (
        first(body.department) ??
        first(body.detail) ??
        first(body.non_field_errors) ??
        first(body.message) ??
        first(body.error) ??
        first(body.note) ??
        first(body.files) ??
        first(Object.values(body))
      );
    }
    return null;
  })();

  if (fromBody) return fromBody;

  if (status === 403) return "شما اجازه‌ی انتقال این تسک را ندارید";
  if (status === 404) return "تسک پیدا نشد یا به آن دسترسی ندارید";
  if (status === 401) return "نشست شما منقضی شده؛ لطفاً دوباره وارد شوید";
  if (status && status >= 500) return "خطای سرور؛ لطفاً دوباره تلاش کنید";

  return fallback;
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


const archiveAll = <T = unknown>(search?: string) => {
  const q = search?.trim().replace(/\s+/g, " ") ?? "";
  return cached(
    `${KEY}archive:${q}`,
    () => listAllPages<T>(ARCHIVE_URL, q ? { search: q } : {}),
    TTL,
  );
};

const archivePage = <T = unknown>(params: PageParams = {}, signal?: AbortSignal) =>
  fetchPage<T>(ARCHIVE_URL, params as Record<string, unknown>, signal);

const page = (params: TaskListParams = {}, signal?: AbortSignal) =>
  fetchPage<TaskItem>(apiRoutes.tasks, params as Record<string, unknown>, signal);

export const tasksApi = {
  page,
  archivePage,
  list,
  listAll,
  archiveAll,

  get: <T = TaskItem>(id: number | string) =>
    dedupe(`${KEY}get:${id}`, async () => {
      const res = await axiosInstance.get<T>(`/tasks/api/v1/tasks/${id}/`);
      return res.data;
    }),

  
  logs: async <T = unknown>(id: number | string) =>
    (await listAllPages<unknown>(`/tasks/api/v1/tasks/${id}/logs/`)) as unknown as T,

  
  logsPage: <T = unknown>(
    id: number | string,
    params: PageParams & { search?: string } = {},
    signal?: AbortSignal,
  ) => fetchPage<T>(`/tasks/api/v1/tasks/${id}/logs/`, params as Record<string, unknown>, signal),

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

  
  transfer: async (
    id: number | string,
    { department, note, files = [] }: TransferTaskPayload,
  ): Promise<TransferTaskResponse> => {
    const form = new FormData();
    form.append("department", String(department));

    const trimmed = note?.trim();
    if (trimmed) form.append("note", trimmed);

    files.forEach((file) => form.append("files", file));

    const { data } = await axiosInstance.post<TransferTaskResponse>(
      apiRoutes.transferTask(Number(id)),
      form,
    );

    invalidate(KEY);
    return data;
  },

  invalidate: () => invalidate(KEY),
};

export function fetchAllTasks({ caseId, signal, fresh }: FetchAllTasksOptions = {}) {
  const id = caseId === "" || caseId === null ? undefined : caseId;
  if (fresh) invalidate(allKey(id));
  return withSignal(listAll(id), signal);
}


let caseFilterWorks: boolean | null = null;

async function probeCaseFilter(caseId: string, signal?: AbortSignal): Promise<boolean> {
  if (caseFilterWorks !== null) return caseFilterWorks;
  const first = await withSignal(list({ page: 1, page_size: 100, case: caseId }), signal);
  const ignored = first.results.some((t) => {
    const cid = extractCaseId(t);
    return cid !== null && cid !== caseId;
  });
  caseFilterWorks = !ignored;
  if (ignored) {
    console.warn("[tasks] فیلتر case در بک‌اند اعمال نمی‌شود؛ یک دریافت مشترک برای همهٔ پرونده‌ها استفاده می‌شود.");
  }
  return caseFilterWorks;
}


export async function fetchTasksForCases(
  caseIds: Array<string | number>,
  { signal, fresh }: { signal?: AbortSignal; fresh?: boolean } = {},
): Promise<Map<string, TaskItem[]>> {
  const ids = [...new Set(caseIds.map(String))];
  if (ids.length === 0) return new Map();

  if (fresh) ids.forEach((id) => invalidate(allKey(id)));
  const filterWorks = await probeCaseFilter(ids[0], signal);

  if (!filterWorks) {
    
    const all = await fetchAllTasks({ signal, fresh });
    const grouped = new Map<string, TaskItem[]>(ids.map((id) => [id, []]));
    all.forEach((t) => {
      const cid = extractCaseId(t);
      if (cid !== null) grouped.get(cid)?.push(t);
    });
    return grouped;
  }

  const lists = await Promise.all(
    ids.map((id) => withSignal(listAll(id), signal)),
  );
  return new Map(ids.map((id, i) => [id, lists[i]]));
}
