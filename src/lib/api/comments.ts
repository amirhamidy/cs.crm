import axiosInstance from "@/lib/axiosInstance";
import type { CustomerComment } from "@/types/comment";
import { cleanParams, fetchPage, invalidate, type Paginated } from "./_core";

const url = (customerId: number) => `/customers/api/v1/customers/${customerId}/comments/`;

export const commentsApi = {
  list: (
    customerId: number,
    params: { page?: number; page_size?: number; search?: string } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<CustomerComment>> =>
    fetchPage<CustomerComment>(url(customerId), cleanParams(params), signal),

  create: async (customerId: number, text: string): Promise<CustomerComment> => {
    const { data } = await axiosInstance.post<CustomerComment>(url(customerId), { text });
    invalidate("customers:ranking");
    return data;
  },

  update: async (customerId: number, id: number, text: string): Promise<CustomerComment> => {
    const { data } = await axiosInstance.patch<CustomerComment>(`${url(customerId)}${id}/`, { text });
    return data;
  },

  remove: async (customerId: number, id: number): Promise<void> => {
    await axiosInstance.delete(`${url(customerId)}${id}/`);
    invalidate("customers:ranking");
  },
};
