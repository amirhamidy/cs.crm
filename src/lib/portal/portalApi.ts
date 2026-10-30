"use client";
import portalAxios from "./portalAxios";
import { toPaginated } from "@/lib/api/_core";
import type { Paginated } from "@/types/pagination";
import type { PortalAccount, PortalLoginResponse, PortalProduct, PortalOrder, PortalOrderPayload } from "@/types/portal";

const BASE = "/customer_portal/api/v1/portal";
export const portalApi = {
  login: async (payload: { username: string; password: string }) => (await portalAxios.post<PortalLoginResponse>(`${BASE}/login/`, payload)).data,
  me: async () => (await portalAxios.get<PortalAccount>(`${BASE}/me/`)).data,
  products: async (params: { page?: number; page_size?: number; search?: string; category?: number }, signal?: AbortSignal): Promise<Paginated<PortalProduct>> => toPaginated<PortalProduct>((await portalAxios.get(`${BASE}/products/`, { params, signal })).data),
  createOrder: async (payload: PortalOrderPayload) => (await portalAxios.post<PortalOrder>(`${BASE}/orders/`, payload)).data,
  orders: async (params: { page?: number; page_size?: number; search?: string }, signal?: AbortSignal): Promise<Paginated<PortalOrder>> => toPaginated<PortalOrder>((await portalAxios.get(`${BASE}/orders/`, { params, signal })).data),
  order: async (id: number) => (await portalAxios.get<PortalOrder>(`${BASE}/orders/${id}/`)).data,
  cancelOrder: async (id: number) => (await portalAxios.post<PortalOrder>(`${BASE}/orders/${id}/cancel/`)).data,
};
