import axiosInstance from "@/lib/axiosInstance";
import type { Paginated, SearchParams } from "@/types/pagination";
import type {
  CreateInternalTaskPayload,
  CreateInternalTaskRoutinePayload,
  InternalEmployeeItem,
  InternalTaskArchiveItem,
  InternalTaskAttachment,
  InternalTaskDeadline,
  InternalTaskDeadlinePayload,
  InternalTaskItem,
  InternalTaskRoutineItem,
  InternalTaskStatus,
  UpdateInternalTaskRoutinePayload,
} from "@/types/internalTask";
import {
  cached,
  dedupe,
  fetchPage,
  invalidate,
  listAll,
} from "./_core";

const KEY = "internalTasks:";
const ROOT = "/tasks/api/v1";
const BASE = `${ROOT}/internal_task/`;
const ARCHIVE = `${ROOT}/internal_task_archive/`;
const ROUTINE = `${ROOT}/internal_task_routine/`;
const EMPLOYEES = "/accounts/api/v1/employee/list/";
const TTL = 30_000;

type AssigneeRef = number | string | { id: number | string };


export interface InternalTaskSummary {
  id: number;
  title?: string | null;
  status?: string | null;
  assigned_to?: AssigneeRef | AssigneeRef[] | null;
  created_by?: string | null;
}

export type InternalTaskListParams = SearchParams;

const cleanNote = (note: string) => note.trim();

function buildForm(files: File[], note: string) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  if (cleanNote(note)) fd.append("note", cleanNote(note));
  return fd;
}


async function mutate<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } finally {
    invalidate(KEY);
  }
}

const page = <T>(
  scope: string,
  url: string,
  params: SearchParams,
  signal?: AbortSignal,
): Promise<Paginated<T>> =>
  signal
    ? fetchPage<T>(url, params, signal)
    : dedupe(`${KEY}${scope}:${JSON.stringify(params)}`, () =>
        fetchPage<T>(url, params),
      );

const every = <T>(scope: string, url: string) =>
  dedupe(`${KEY}${scope}:every`, () => listAll<T>(url));

export const internalTasksApi = {
  
  list: (params: InternalTaskListParams = {}, signal?: AbortSignal) =>
    page<InternalTaskSummary>("list", BASE, params, signal),

  
  page: (params: InternalTaskListParams = {}, signal?: AbortSignal) =>
    page<InternalTaskItem>("page", BASE, params, signal),

  
  all: () =>
    cached(`${KEY}all`, () => listAll<InternalTaskSummary>(BASE), TTL),

  allFull: () => every<InternalTaskItem>("tasks", BASE),

  create: (data: CreateInternalTaskPayload) =>
    mutate(
      axiosInstance.post<InternalTaskItem>(`${BASE}create/`, {
        title: data.title,
        description: data.description,
        status: "in_progress",
        assigned_to: data.assigned_to,
        created_by: data.created_by,
      }),
    ),

  updateStatus: (id: number, status: InternalTaskStatus) =>
    mutate(
      axiosInstance.patch<InternalTaskItem>(`${BASE}${id}/update/`, { status }),
    ),

  reopen: (id: number) =>
    mutate(axiosInstance.post<InternalTaskItem>(`${BASE}${id}/reopen/`)),

  complete: (id: number, files: File[], note: string) =>
    mutate(
      axiosInstance.post<InternalTaskItem>(
        `${BASE}${id}/complete/`,
        buildForm(files, note),
      ),
    ),

  cancel: (id: number, files: File[], note: string) =>
    mutate(
      axiosInstance.post<InternalTaskItem>(
        `${BASE}${id}/cancel/`,
        buildForm(files, note),
      ),
    ),

  remove: (id: number) =>
    mutate(axiosInstance.delete<void>(`${BASE}${id}/delete/`)),

  
  getDeadline: (id: number) =>
    axiosInstance.get<InternalTaskDeadline>(`${BASE}${id}/deadline/`),

  patchDeadline: (id: number, payload: InternalTaskDeadlinePayload) =>
    mutate(
      axiosInstance.patch<InternalTaskDeadline>(`${BASE}${id}/deadline/patch/`, {
        started_at: payload.started_at,
        deadline: payload.deadline,
      }),
    ),

  uploadAttachments: (id: number, files: File[], note: string) =>
    mutate(
      axiosInstance.post<InternalTaskAttachment[]>(
        `${BASE}${id}/attachments/`,
        buildForm(files, note),
      ),
    ),

  attachmentUrl: (taskId: number, attachmentId: number) =>
    `${BASE}${taskId}/attachments/${attachmentId}/`,

  
  archive: (params: SearchParams = {}, signal?: AbortSignal) =>
    page<InternalTaskArchiveItem>("archive", ARCHIVE, params, signal),

  archiveAll: () => every<InternalTaskArchiveItem>("archive", ARCHIVE),

  
  routines: (params: SearchParams = {}, signal?: AbortSignal) =>
    page<InternalTaskRoutineItem>("routines", ROUTINE, params, signal),

  routinesAll: () => every<InternalTaskRoutineItem>("routines", ROUTINE),

  createRoutine: (data: CreateInternalTaskRoutinePayload) =>
    mutate(
      axiosInstance.post<InternalTaskRoutineItem>(`${ROUTINE}create/`, data),
    ),

  updateRoutine: (id: number, payload: UpdateInternalTaskRoutinePayload) =>
    mutate(
      axiosInstance.patch<InternalTaskRoutineItem>(
        `${ROUTINE}${id}/update/`,
        payload,
      ),
    ),

  removeRoutine: (id: number) =>
    mutate(axiosInstance.delete<void>(`${ROUTINE}${id}/delete/`)),

  
  employees: (params: SearchParams = {}, signal?: AbortSignal) =>
    page<InternalEmployeeItem>("employees", EMPLOYEES, params, signal),

  employeesAll: () => every<InternalEmployeeItem>("employees", EMPLOYEES),

  invalidate: () => invalidate(KEY),
};
