/**
 * Compatibility shim. Real logic lives in `@/lib/api/internalTasks`.
 * List functions fetch ALL pages and return `{ data: T[] }`.
 */
import type {
  EmployeeListItem,
  InternalTask,
  InternalTaskAttachment,
  InternalTaskRoutine,
  InternalTaskStatus,
} from "./Types";
import { internalTasksApi as api } from "@/lib/api/internalTasks";
import type {
  CreateInternalTaskRoutinePayload,
  UpdateInternalTaskRoutinePayload,
} from "@/types/internalTask";

export type { CreateInternalTaskRoutinePayload, UpdateInternalTaskRoutinePayload };

export type InternalTaskDeadlinePayload = {
  started_at: string;
  deadline: string;
};

export type InternalTaskDeadlineResponse = {
  id: number;
  started_at: string;
  deadline: string;
};

export type UpdateInternalTaskPayload = { status: InternalTaskStatus };

type Res<T> = Promise<{ data: T }>;
const local = (p: Promise<unknown>) => p as unknown as Res<InternalTask>;

const wrap = async <T>(p: Promise<unknown[]>) => ({ data: (await p) as T[] });

export const fetchInternalTasks = () => wrap<InternalTask>(api.allFull());
export const fetchInternalTaskRoutines = () =>
  wrap<InternalTaskRoutine>(api.routinesAll());
export const fetchEmployeeList = () =>
  wrap<EmployeeListItem>(api.employeesAll());

export const createInternalTask = (data: {
  title: string;
  description: string;
  assigned_to: number[];
  created_by: number;
}) => local(api.create(data));

export const updateInternalTaskStatus = (
  id: number,
  payload: UpdateInternalTaskPayload,
) => local(api.updateStatus(id, payload.status));

export const reopenInternalTask = (id: number) => local(api.reopen(id));

export const patchInternalTaskDeadline = (
  id: number,
  payload: InternalTaskDeadlinePayload,
) => api.patchDeadline(id, payload) as Promise<{ data: InternalTaskDeadlineResponse }>;

export const uploadInternalTaskAttachments = (
  id: number,
  files: File[],
  note: string,
) =>
  api.uploadAttachments(id, files, note) as Promise<{
    data: InternalTaskAttachment[];
  }>;

export const completeInternalTask = (id: number, files: File[], note: string) =>
  local(api.complete(id, files, note));

export const cancelInternalTask = (id: number, files: File[], note: string) =>
  local(api.cancel(id, files, note));

export const getInternalTaskAttachmentUrl = api.attachmentUrl;

export const deleteInternalTask = (id: number) => api.remove(id);

export const createInternalTaskRoutine = (
  data: CreateInternalTaskRoutinePayload,
) => api.createRoutine(data);

export const updateInternalTaskRoutine = (
  id: number,
  payload: UpdateInternalTaskRoutinePayload,
) => api.updateRoutine(id, payload);

export const deleteInternalTaskRoutine = (id: number) => api.removeRoutine(id);
