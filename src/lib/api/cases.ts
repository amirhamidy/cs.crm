import axiosInstance from "@/lib/axiosInstance";
import type { CaseItem } from "@/types/case";
import type { CaseReport } from "@/types/caseReport";
import type { PageParams } from "@/types/pagination";
import { dedupe, fetchAllPages, fetchPage, getOne, invalidate, toPaginated, type Paginated, type RawList } from "./_core";

const KEY = "cases:";
const BASE = "/tasks/api/v1/cases/";

export interface CaseListParams extends PageParams {
  customer?: number;
  active?: boolean;
}

export interface CreateCasePayload {
  customer: number;
  created_by: number | string | null;
  title: string;
  description: string;
}

const list = (params: CaseListParams = {}): Promise<Paginated<CaseItem>> =>
  dedupe(`${KEY}list:${JSON.stringify(params)}`, async () => {
    const res = await axiosInstance.get<RawList<CaseItem>>(BASE, { params });
    return toPaginated<CaseItem>(res.data);
  });


const page = (params: CaseListParams = {}, signal?: AbortSignal) =>
  fetchPage<CaseItem>(BASE, params, signal);

export const casesApi = {
  list,
  page,

  listAll: () => fetchAllPages<CaseItem>((p) => list({ ...p, page_size: 100 })),

  get: (id: number) => dedupe(`${KEY}get:${id}`, () => getOne<CaseItem>(`${BASE}${id}/`)),

  report: async (id: number, signal?: AbortSignal) => {
    const { data } = await axiosInstance.get<CaseReport>(`${BASE}${id}/report/`, { signal });
    return data;
  },

  create: async (payload: CreateCasePayload) => {
    const { data } = await axiosInstance.post<CaseItem>(`${BASE}create/`, payload);
    invalidate(KEY);
    return data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${BASE}${id}/delete/`);
    invalidate(KEY);
  },

  invalidate: () => invalidate(KEY),
};
