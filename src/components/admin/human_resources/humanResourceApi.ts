import axiosInstance from "@/lib/axiosInstance";

export interface HumanResourceFile {
  id: number;
  title?: string | null;
  file: string;
  step: number | null;
  created_at: string;
}

export interface HumanResourceStep {
  id: number;
  order: number;
  title: string;
  files?: HumanResourceFile[];
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
const BASE = "/document/api/v1";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type ListResponse<T> = Paginated<T> | T[];

/** Fetch every page of a paginated endpoint (page_size=100) and return a flat array. */
async function getAll<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data } = await api.get<ListResponse<T>>(url, { params: { ...params, page, page_size: 100 } });
    if (Array.isArray(data)) return data;
    items.push(...data.results);
    if (!data.next) break;
  }
  return items;
}

const fileForm = (file?: File | null, title?: string) => {
  const fd = new FormData();
  if (file) fd.append("file", file);
  if (title !== undefined) fd.append("title", title);
  return fd;
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "webp", "word", "txt", "svg"];

/** Client-side check; returns a Persian error message or null. */
export const validateFile = (file: File): string | null => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) return `پسوند .${ext} مجاز نیست`;
  if (file.size > MAX_FILE_SIZE) return "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد";
  return null;
};

/** Extract a readable message from an API error. */
export const apiErrorMessage = (e: unknown, fallback = "خطایی رخ داد"): string => {
  const d = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof d === "string") return fallback;
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    const first = Object.values(o)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return fallback;
};

export const getDocuments = () => getAll<HumanResource>(`${BASE}/`);

export const getDocument = (id: number) => api.get<HumanResource>(`${BASE}/${id}/`);

export const createDocument = (data: { title: string }) => api.post<HumanResource>(`${BASE}/`, data);

export const updateDocument = (id: number, data: { title: string }) =>
  api.patch<HumanResource>(`${BASE}/${id}/`, data);

export const deleteDocument = (id: number) => api.delete(`${BASE}/${id}/`);

export const getDocumentFiles = (documentId: number) =>
  getAll<HumanResourceFile>(`${BASE}/${documentId}/files/`);

export const uploadDocumentFile = (documentId: number, file: File, title?: string) =>
  api.post<HumanResourceFile>(`${BASE}/${documentId}/files/`, fileForm(file, title));

export const getDocumentFile = (id: number) => api.get<HumanResourceFile>(`${BASE}/files/${id}/`);

export const updateDocumentFile = (id: number, data: { file?: File | null; title?: string }) =>
  api.patch<HumanResourceFile>(`${BASE}/files/${id}/`, fileForm(data.file, data.title));

export const deleteDocumentFile = (id: number) => api.delete(`${BASE}/files/${id}/`);

export const getDocumentSteps = (documentId: number) =>
  getAll<HumanResourceStep>(`${BASE}/${documentId}/steps/`);

export const createStep = (documentId: number, data: { order: number; title: string }) =>
  api.post<HumanResourceStep>(`${BASE}/${documentId}/steps/`, data);

export const getDocumentStep = (id: number) => api.get<HumanResourceStep>(`${BASE}/steps/${id}/`);

export const updateStep = (id: number, data: { order: number; title: string }) =>
  api.patch<HumanResourceStep>(`${BASE}/steps/${id}/`, data);

export const deleteStep = (id: number) => api.delete(`${BASE}/steps/${id}/`);

export const getStepFiles = (documentId: number, stepId: number) =>
  getAll<HumanResourceFile>(`${BASE}/${documentId}/steps/${stepId}/files/`);

export const uploadStepFile = (documentId: number, stepId: number, file: File, title?: string) =>
  api.post<HumanResourceFile>(`${BASE}/${documentId}/steps/${stepId}/files/`, fileForm(file, title));

export const updateStepFile = (
  documentId: number,
  stepId: number,
  fileId: number,
  data: { file?: File | null; title?: string },
) =>
  api.patch<HumanResourceFile>(
    `${BASE}/${documentId}/steps/${stepId}/files/${fileId}/patch/`,
    fileForm(data.file, data.title),
  );

export const deleteStepFile = (documentId: number, stepId: number, fileId: number) =>
  api.delete(`${BASE}/${documentId}/steps/${stepId}/files/${fileId}/delete/`);

export const getDepartments = () =>
  api.get<Department[]>("/department/api/v1/department/list/");

export const getDepartmentEmployees = () =>
  api.get<DepartmentEmployee[]>("/department/api/v1/department_employee/list/");

export const getEmployees = () =>
  api.get<Employee[]>("/accounts/api/v1/employee/list/");

export const getMe = () => api.get<CurrentUser>("/accounts/api/v1/auth/me/");
