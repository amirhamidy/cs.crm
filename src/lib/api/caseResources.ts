import axiosInstance from "@/lib/axiosInstance";
import { cached, fetchPage, getOne, invalidate, type Paginated } from "./_core";

const BASE = "/tasks/api/v1/cases/resources/";
const KEY = "caseResources:";

export interface CaseResourceRecord {
  id: number;
  title: string;
  [key: string]: unknown;
}

export const caseResourcesApi = {
  page: (params: Record<string, string | number | boolean | undefined> = {}, signal?: AbortSignal): Promise<Paginated<CaseResourceRecord>> =>
    fetchPage<CaseResourceRecord>(BASE, params, signal),
  all: () => cached(`${KEY}all`, async () => {
    const { data } = await axiosInstance.get<CaseResourceRecord[] | { results: CaseResourceRecord[] }>(BASE);
    return Array.isArray(data) ? data : data.results;
  }, 30_000),
  get: (id: number) => getOne<CaseResourceRecord>(`${BASE}${id}/`),
  create: async <T extends Record<string, unknown>>(payload: T) => {
    const { data } = await axiosInstance.post<CaseResourceRecord>(`${BASE}create/`, payload);
    invalidate(KEY);
    return data;
  },
  replace: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await axiosInstance.put<CaseResourceRecord>(`${BASE}${id}/update/`, payload);
    invalidate(KEY);
    return data;
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await axiosInstance.patch<CaseResourceRecord>(`${BASE}${id}/update/`, payload);
    invalidate(KEY);
    return data;
  },
  remove: async (id: number) => {
    await axiosInstance.delete(`${BASE}${id}/delete/`);
    invalidate(KEY);
  },
};
