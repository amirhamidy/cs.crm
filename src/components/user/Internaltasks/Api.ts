import axiosInstance from "@/lib/axiosInstance";
import type { AxiosResponse } from "axios";
import type {
  EmployeeListItem,
  InternalTask,
  InternalTaskArchive,
  InternalTaskAttachment,
  InternalTaskRoutine,
  InternalTaskStatus,
  InternalTaskDeadline,
} from "./types";

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

let internalTasksRequest: Promise<AxiosResponse<InternalTask[]>> | null = null;

export function fetchInternalTasks() {
  if (internalTasksRequest) return internalTasksRequest;
  const request = axiosInstance.get<InternalTask[]>(
    "/tasks/api/v1/internal_task/",
  );
  internalTasksRequest = request;
  request.then(
    () => {
      if (internalTasksRequest === request) internalTasksRequest = null;
    },
    () => {
      if (internalTasksRequest === request) internalTasksRequest = null;
    },
  );
  return request;
}

export function fetchInternalTaskArchive() {
  return axiosInstance.get<InternalTaskArchive[]>(
    "/tasks/api/v1/internal_task_archive/",
  );
}

export function fetchInternalTaskRoutines() {
  return axiosInstance.get<InternalTaskRoutine[]>(
    "/tasks/api/v1/internal_task_routine/",
  );
}

export function fetchEmployeeList() {
  return axiosInstance.get<EmployeeListItem[]>(
    "/accounts/api/v1/employee/list/",
  );
}

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
    { status: payload.status },
  );
}

export function reopenInternalTask(id: number) {
  return axiosInstance.post<InternalTask>(
    `/tasks/api/v1/internal_task/${id}/reopen/`,
  );
}

export function fetchInternalTaskDeadline(id: number) {
  return axiosInstance.get<InternalTaskDeadline>(
    `/tasks/api/v1/internal_task/${id}/deadline/`,
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
  files.forEach((file) => formData.append("files", file));
  if (note.trim()) formData.append("note", note.trim());
  return axiosInstance.post<InternalTaskAttachment[]>(
    `/tasks/api/v1/internal_task/${id}/attachments/`,
    formData,
  );
}

export function completeInternalTask(id: number, files: File[], note: string) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (note.trim()) formData.append("note", note.trim());
  return axiosInstance.post<InternalTask>(
    `/tasks/api/v1/internal_task/${id}/complete/`,
    formData,
  );
}

export function cancelInternalTask(id: number, files: File[], note: string) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (note.trim()) formData.append("note", note.trim());
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
