import axiosInstance from "@/lib/axiosInstance";
import { cached, fetchPage, invalidate, type Paginated } from "./_core";

const BASE = "/note/api/v1/";
const KEY = "notes:";

export interface CalendarNoteRecord {
  id: number;
  user?: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export const notesApi = {
  page: (params: Record<string, string | number | boolean | undefined> = {}, signal?: AbortSignal): Promise<Paginated<CalendarNoteRecord>> =>
    fetchPage<CalendarNoteRecord>(BASE, params, signal),

  list: () => cached(`${KEY}all`, async () => {
    const { data } = await axiosInstance.get<CalendarNoteRecord[] | { results: CalendarNoteRecord[] }>(BASE);
    return Array.isArray(data) ? data : data.results;
  }, 30_000),

  get: async (id: number) => (await axiosInstance.get<CalendarNoteRecord>(`${BASE}${id}/`)).data,

  create: async (payload: Pick<CalendarNoteRecord, "user" | "description">) => {
    const { data } = await axiosInstance.post<CalendarNoteRecord>(`${BASE}create/`, payload);
    invalidate(KEY);
    return data;
  },

  replace: async (id: number, payload: Pick<CalendarNoteRecord, "description">) => {
    const { data } = await axiosInstance.put<CalendarNoteRecord>(`${BASE}${id}/update/`, payload);
    invalidate(KEY);
    return data;
  },

  update: async (id: number, payload: Partial<Pick<CalendarNoteRecord, "description">>) => {
    const { data } = await axiosInstance.patch<CalendarNoteRecord>(`${BASE}${id}/partial-update/`, payload);
    invalidate(KEY);
    return data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${BASE}${id}/delete/`);
    invalidate(KEY);
  },
};
