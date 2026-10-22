import axiosInstance from "@/lib/axiosInstance";
import type { Customer } from "@/types/customer";
import type { Paginated, PageParams } from "@/types/pagination";

const BASE = "/customers/api/v1/customers/";

export interface CustomerListParams extends PageParams {
  status?: 1 | 2;
  search?: string;
}

const cache = new Map<number, Customer>();

export const customersApi = {
  list: async (params: CustomerListParams = {}) => {
    const { data } = await axiosInstance.get<Paginated<Customer>>(BASE, {
      params,
    });
    data.results.forEach((c) => cache.set(c.id, c));
    return data;
  },

  get: async (id: number) => {
    const { data } = await axiosInstance.get<Customer>(`${BASE}${id}/`);
    cache.set(id, data);
    return data;
  },

  create: async (payload: Partial<Customer>) => {
    const { data } = await axiosInstance.post<Customer>(BASE, payload);
    cache.set(data.id, data);
    return data;
  },

  update: async (id: number, payload: Partial<Customer>) => {
    const { data } = await axiosInstance.patch<Customer>(
      `${BASE}${id}/`,
      payload,
    );
    cache.set(id, data);
    return data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${BASE}${id}/`);
    cache.delete(id);
  },

  getMany: async (ids: number[]): Promise<Customer[]> => {
    const missing = ids.filter((id) => !cache.has(id));
    await Promise.all(
      missing.map((id) => customersApi.get(id).catch(() => null)),
    );
    return ids
      .map((id) => cache.get(id))
      .filter((c): c is Customer => Boolean(c));
  },
};
