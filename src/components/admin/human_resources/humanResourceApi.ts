import axiosInstance from "@/lib/axiosInstance";
import { accountsApi, departmentsApi, listAll, toPaginated } from "@/lib/api";
import type { Paginated } from "@/types/pagination";
import { resolveFileUrl } from "./hrUtils";





export interface HumanResourceFile {
  id: number;
  title: string;
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
  
  filesEmbedded?: boolean;
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

export interface DocumentPayload {
  title: string;
}

export interface DocumentStepPayload {
  order: number;
  title: string;
}

export interface DocumentFilePayload {
  
  title?: string;
  file: File;
}


export type DocumentList<T> = Paginated<T>;






const DOC = "/document/api/v1";

const api = axiosInstance;


const wrap = <T>(data: T) => ({ data });

const unwrapList = <T,>(data: unknown): T[] => toPaginated<T>(data).results;






const normalizeFile = (f: HumanResourceFile): HumanResourceFile => ({
  ...f,
  title: f.title ?? "",
  file: resolveFileUrl(f.file),
  step: f.step ?? null,
});

const normalizeStep = (s: HumanResourceStep): HumanResourceStep => ({
  ...s,
  files: Array.isArray(s.files) ? s.files.map(normalizeFile) : undefined,
});

export const normalizeDocument = (d: HumanResource): HumanResource => ({
  ...d,
  files: Array.isArray(d.files) ? d.files.map(normalizeFile) : [],
  steps: Array.isArray(d.steps) ? d.steps.map(normalizeStep) : [],
  filesEmbedded: Array.isArray(d.files),
});






export const getDocuments = async () =>
  wrap((await listAll<HumanResource>(`${DOC}/`)).map(normalizeDocument));


export const getDocumentsPage = async (
  params: {
    page?: number;
    page_size?: number;
    search?: string;
  } = {},
  signal?: AbortSignal,
) => {
  const { data } = await api.get<unknown>(`${DOC}/`, {
    
    
    params: { ordering: "-id", ...params },
    signal,
  });
  const page = toPaginated<HumanResource>(data);
  return { ...page, results: page.results.map(normalizeDocument) };
};


export const getDocument = async (id: number) => {
  const r = await api.get<HumanResource>(`${DOC}/${id}/`);
  return { ...r, data: normalizeDocument(r.data) };
};

export const createDocument = async (data: DocumentPayload) => {
  const r = await api.post<HumanResource>(`${DOC}/`, data);
  return { ...r, data: normalizeDocument(r.data) };
};

export const updateDocument = async (id: number, data: DocumentPayload) => {
  const r = await api.patch<HumanResource>(`${DOC}/${id}/`, data);
  return { ...r, data: normalizeDocument(r.data) };
};


export const replaceDocument = async (id: number, data: DocumentPayload) => {
  const r = await api.put<HumanResource>(`${DOC}/${id}/`, data);
  return { ...r, data: normalizeDocument(r.data) };
};

export const deleteDocument = (id: number) => api.delete(`${DOC}/${id}/`);






export const getDocumentFiles = async (documentId: number) =>
  wrap(
    (await listAll<HumanResourceFile>(`${DOC}/${documentId}/files/`)).map(
      normalizeFile,
    ),
  );


export const getDocumentFilesPage = async (
  documentId: number,
  params: { page?: number; page_size?: number; search?: string } = {},
) => {
  const { data } = await api.get<unknown>(`${DOC}/${documentId}/files/`, {
    params,
  });
  const page = toPaginated<HumanResourceFile>(data);
  return { ...page, results: page.results.map(normalizeFile) };
};


export const uploadDocumentFile = async (
  documentId: number,
  file: File,
  title?: string,
) => {
  const formData = new FormData();
  formData.append("title", (title ?? file.name ?? "file").trim() || "file");
  formData.append("file", file, file.name);
  const r = await api.post<HumanResourceFile>(
    `${DOC}/${documentId}/files/`,
    formData,
  );
  return { ...r, data: normalizeFile(r.data) };
};

export const getDocumentFile = async (id: number) => {
  const r = await api.get<HumanResourceFile>(`${DOC}/files/${id}/`);
  return { ...r, data: normalizeFile(r.data) };
};


export const updateDocumentFile = (id: number, payload: DocumentFilePayload) => {
  const formData = new FormData();
  formData.append(
    "title",
    (payload.title ?? payload.file?.name ?? "file").trim() || "file",
  );
  if (payload.file) formData.append("file", payload.file, payload.file.name);
  return api.patch<HumanResourceFile>(`${DOC}/files/${id}/`, formData);
};


export const replaceDocumentFile = (id: number, payload: DocumentFilePayload) => {
  const formData = new FormData();
  formData.append("title", (payload.title ?? payload.file.name).trim() || "file");
  formData.append("file", payload.file, payload.file.name);
  return api.put<HumanResourceFile>(`${DOC}/files/${id}/`, formData);
};

export const deleteDocumentFile = (id: number) =>
  api.delete(`${DOC}/files/${id}/`);






export const getDocumentSteps = async (documentId: number) =>
  wrap(
    (await listAll<HumanResourceStep>(`${DOC}/${documentId}/steps/`))
      .map(normalizeStep)
      .sort((a, b) => a.order - b.order),
  );


export const getDocumentStepsPage = async (
  documentId: number,
  params: { page?: number; page_size?: number; search?: string } = {},
) => {
  const { data } = await api.get<unknown>(`${DOC}/${documentId}/steps/`, {
    params,
  });
  const page = toPaginated<HumanResourceStep>(data);
  return { ...page, results: page.results.map(normalizeStep) };
};

export const createStep = (documentId: number, data: DocumentStepPayload) =>
  api.post<HumanResourceStep>(`${DOC}/${documentId}/steps/`, data);

export const getDocumentStep = (id: number) =>
  api.get<HumanResourceStep>(`${DOC}/steps/${id}/`);

export const updateStep = (id: number, data: DocumentStepPayload) =>
  api.patch<HumanResourceStep>(`${DOC}/steps/${id}/`, data);


export const replaceStep = (id: number, data: DocumentStepPayload) =>
  api.put<HumanResourceStep>(`${DOC}/steps/${id}/`, data);

export const deleteStep = (id: number) => api.delete(`${DOC}/steps/${id}/`);





const stepFilesUrl = (documentId: number, stepId: number) =>
  `${DOC}/${documentId}/steps/${stepId}/files/`;


export const getStepFiles = async (documentId: number, stepId: number) =>
  wrap(
    (await listAll<HumanResourceFile>(stepFilesUrl(documentId, stepId))).map(
      normalizeFile,
    ),
  );


export const getStepFilesPage = async (
  documentId: number,
  stepId: number,
  params: { page?: number; page_size?: number; search?: string } = {},
  signal?: AbortSignal,
) => {
  const { data } = await api.get<unknown>(stepFilesUrl(documentId, stepId), {
    params,
    signal,
  });
  const page = toPaginated<HumanResourceFile>(data);
  return { ...page, results: page.results.map(normalizeFile) };
};


export const uploadStepFile = (
  documentId: number,
  stepId: number,
  file: File,
  title?: string,
) => {
  const formData = new FormData();
  formData.append("title", (title ?? file.name ?? "file").trim() || "file");
  formData.append("file", file, file.name);
  return api.post<HumanResourceFile>(stepFilesUrl(documentId, stepId), formData);
};

export const updateStepFile = (
  documentId: number,
  stepId: number,
  fileId: number,
  payload: DocumentFilePayload,
) => {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.file) formData.append("file", payload.file, payload.file.name);
  return api.patch<HumanResourceFile>(
    `${stepFilesUrl(documentId, stepId)}${fileId}/patch/`,
    formData,
  );
};

export const replaceStepFile = (
  documentId: number,
  stepId: number,
  fileId: number,
  payload: DocumentFilePayload,
) => {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.file) formData.append("file", payload.file, payload.file.name);
  return api.put<HumanResourceFile>(
    `${stepFilesUrl(documentId, stepId)}${fileId}/put/`,
    formData,
  );
};

export const deleteStepFile = (
  documentId: number,
  stepId: number,
  fileId: number,
) =>
  api.delete(`${stepFilesUrl(documentId, stepId)}${fileId}/delete/`);





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






export const fetchDocumentsList = async (): Promise<HumanResource[]> =>
  (await listAll<HumanResource>(`${DOC}/`)).map(normalizeDocument);


export const fetchDocumentStepsList = async (
  documentId: number,
): Promise<HumanResourceStep[]> =>
  (await listAll<HumanResourceStep>(`${DOC}/${documentId}/steps/`))
    .map(normalizeStep)
    .sort((a, b) => a.order - b.order);

export { unwrapList };