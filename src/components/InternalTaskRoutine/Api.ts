import axiosInstance from "@/lib/axiosInstance";
import { internalTasksApi as pagedApi } from "@/lib/api/internalTasks";

const wrapAll = async <T>(p: Promise<unknown[]>) => ({ data: (await p) as T[] });
import type {
  EmployeeListItem,
  InternalTask,
  InternalTaskAttachment,
  InternalTaskRoutine,
  InternalTaskStatus,
} from "./Types";

export type InternalTaskDeadlinePayload = {
  started_at: string;
  deadline: string;
};

export type InternalTaskDeadlineResponse = {
  id: number;
  started_at: string;
  deadline: string;
};

export type UpdateInternalTaskPayload = {
  status: InternalTaskStatus;
};

export const fetchInternalTasks = () =>
  wrapAll<InternalTask>(pagedApi.allFull());

export const fetchEmployeeList = () =>
  wrapAll<EmployeeListItem>(pagedApi.employeesAll());

export function createInternalTask(data: {
  title: string;
  description: string;
  assigned_to: number[];
  created_by: number;
}) {
  return axiosInstance.post<InternalTask>(
    "/tasks/api/v1/internal_task/create/",
    {
      title: data.title,
      description: data.description,
      status: "in_progress",
      assigned_to: data.assigned_to,
      created_by: data.created_by,
    },
  );
}

export function updateInternalTaskStatus(
  id: number,
  payload: UpdateInternalTaskPayload,
) {
  return axiosInstance.patch<InternalTask>(
    `/tasks/api/v1/internal_task/${id}/update/`,
    {
      status: payload.status,
    },
  );
}

export function patchInternalTaskDeadline(
  id: number,
  payload: InternalTaskDeadlinePayload,
) {
  return axiosInstance.patch<InternalTaskDeadlineResponse>(
    `/tasks/api/v1/internal_task/${id}/deadline/patch/`,
    {
      started_at: payload.started_at,
      deadline: payload.deadline,
    },
  );
}

export function uploadInternalTaskAttachments(
  id: number,
  files: File[],
  note: string,
) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  if (note.trim()) {
    formData.append("note", note.trim());
  }
  return axiosInstance.post<InternalTaskAttachment[]>(
    `/tasks/api/v1/internal_task/${id}/attachments/`,
    formData,
  );
}

export function completeInternalTask(id: number, files: File[], note: string) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  if (note.trim()) {
    formData.append("note", note.trim());
  }

  console.log("COMPLETE TASK ID:", id);
  console.log("COMPLETE TASK FILES:", files);
  console.log("COMPLETE TASK NOTE:", note);

  for (const [key, value] of formData.entries()) {
    console.log("FORM DATA:", key, value);
  }

  return axiosInstance.post<InternalTask>(
    `/tasks/api/v1/internal_task/${id}/complete/`,
    formData,
  );
}

export function cancelInternalTask(id: number, files: File[], note: string) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  if (note.trim()) {
    formData.append("note", note.trim());
  }

  console.log("CANCEL TASK ID:", id);
  console.log("CANCEL TASK FILES:", files);
  console.log("CANCEL TASK NOTE:", note);

  for (const [key, value] of formData.entries()) {
    console.log("FORM DATA:", key, value);
  }

  return axiosInstance.post<InternalTask>(
    `/tasks/api/v1/internal_task/${id}/cancel/`,
    formData,
  );
}
export function getInternalTaskAttachmentUrl(
  taskId: number,
  attachmentId: number,
) {
  return `/tasks/api/v1/internal_task/${taskId}/attachments/${attachmentId}/`;
}

export function deleteInternalTask(id: number) {
  return axiosInstance.delete<void>(
    `/tasks/api/v1/internal_task/${id}/delete/`,
  );
}

export type CreateInternalTaskRoutinePayload = {
  task: number;
  start_at: string;
  interval_days: number;
};

export const fetchInternalTaskRoutines = () =>
  wrapAll<InternalTaskRoutine>(pagedApi.routinesAll());

export async function reopenInternalTask(taskId: number) {
    return axiosInstance.post(
        `/tasks/api/v1/internal_task/${taskId}/reopen/`,
    );
}

export function createInternalTaskRoutine(
  data: CreateInternalTaskRoutinePayload,
) {
  return axiosInstance.post<InternalTaskRoutine>(
    "/tasks/api/v1/internal_task_routine/create/",
    data,
  );
}

export function deleteInternalTaskRoutine(id: number) {
  return axiosInstance.delete<void>(
    `/tasks/api/v1/internal_task_routine/${id}/delete/`,
  );
}
