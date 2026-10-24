import axiosInstance from "@/lib/axiosInstance";
import { accountsApi, departmentsApi } from "@/lib/api";

export interface HumanResourceFile {
  id: number;
  file: string;
  created_at: string;
}

export interface HumanResourceStep {
  id: number;
  order: number;
  title: string;
}

export interface HumanResource {
  id: number;
  title: string;
  created_by: number;
  files: HumanResourceFile[];
  steps: HumanResourceStep[];
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentEmployee {
  id: number;
  employee: number;
  employee_name: string;
  department: number;
  department_name: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  phone_number: string;
  type: number;
}

const api = axiosInstance;

export const getDocuments = () => api.get<HumanResource[]>("/document/");

export const createDocument = (data: { title: string }) =>
  api.post<HumanResource>("/document/", data);

export const updateDocument = (id: number, data: { title: string }) =>
  api.patch<HumanResource>(`/document/${id}/`, data);

export const deleteDocument = (id: number) => api.delete(`/document/${id}/`);

export const getDocumentFiles = (documentId: number) =>
  api.get<HumanResourceFile[]>(`/document/${documentId}/files/`);

export const uploadDocumentFile = (documentId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<HumanResourceFile>(
    `/document/${documentId}/files/`,
    formData,
  );
};

export const getDocumentFile = (id: number) =>
  api.get<HumanResourceFile>(`/document/files/${id}/`);

export const updateDocumentFile = (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.patch<HumanResourceFile>(`/document/files/${id}/`, formData);
};

export const deleteDocumentFile = (id: number) =>
  api.delete(`/document/files/${id}/`);

export const getDocumentSteps = (documentId: number) =>
  api.get<HumanResourceStep[]>(`/document/${documentId}/steps/`);

export const createStep = (
  documentId: number,
  data: { order: number; title: string },
) => api.post<HumanResourceStep>(`/document/${documentId}/steps/`, data);

export const getDocumentStep = (id: number) =>
  api.get<HumanResourceStep>(`/document/steps/${id}/`);

export const updateStep = (
  id: number,
  data: { order: number; title: string },
) => api.patch<HumanResourceStep>(`/document/steps/${id}/`, data);

export const deleteStep = (id: number) => api.delete(`/document/steps/${id}/`);

const wrap = <T>(data: T) => ({ data });

export const getDepartments = async () =>
  wrap<Department[]>(
    (await departmentsApi.list()).map((d) => ({
      id: d.id,
      name: d.name,
      order: d.order ?? 0,
      created_at: d.created_at ?? "",
      updated_at: d.updated_at ?? "",
    })),
  );

export const getDepartmentEmployees = async () =>
  wrap<DepartmentEmployee[]>(await departmentsApi.employees());

export const getEmployees = async () =>
  wrap<Employee[]>(await accountsApi.employees.all());

export const getMe = async () => wrap<CurrentUser>(await accountsApi.me());
