import axiosInstance from "@/lib/axiosInstance";
import type { CaseItem } from "@/types/case";
import type { Paginated, PageParams } from "@/types/pagination";

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

export const casesApi = {
  list: async (params: CaseListParams = {}) => {
    const { data } = await axiosInstance.get<Paginated<CaseItem>>(BASE, {
      params,
    });
    return data;
  },

  listAll: async (): Promise<CaseItem[]> => {
    const first = await casesApi.list({ page: 1, page_size: 100 });
    if (!first.next || first.results.length === 0) return first.results;

    const size = first.results.length;
    const pages = Math.ceil(first.count / size);

    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        casesApi.list({ page: i + 2, page_size: 100 }),
      ),
    );

    return [first, ...rest].flatMap((p) => p.results);
  },

  get: async (id: number) => {
    const { data } = await axiosInstance.get<CaseItem>(`${BASE}${id}/`);
    return data;
  },

  create: async (payload: CreateCasePayload) => {
    const { data } = await axiosInstance.post<CaseItem>(
      `${BASE}create/`,
      payload,
    );
    return data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${BASE}${id}/delete/`);
  },
};
