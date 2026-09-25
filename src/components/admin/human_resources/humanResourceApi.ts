import axios from "axios";

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

const api = axios.create({
  baseURL: "https://api.radcosys.ir",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("crm-access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const getDepartments = () =>
  api.get<Department[]>("/department/api/v1/department/list/");

export const getDepartmentEmployees = () =>
  api.get<DepartmentEmployee[]>("/department/api/v1/department_employee/list/");

export const getEmployees = () =>
  api.get<Employee[]>("/accounts/api/v1/employee/list/");

export const getMe = () => api.get<CurrentUser>("/accounts/api/v1/auth/me/");
