import axiosInstance from "@/lib/axiosInstance";
import type { Paginated, PageParams, SearchParams } from "@/types/pagination";
import type {
  CustomerComment,
  CustomerPath,
  CustomerSalesSummary,
  FeedProduct,
  RankedCustomer,
  RankingOrdering,
  Sale,
  SaleListParams,
  SalePayload,
  TopCustomersParams,
  TopCustomersResponse,
} from "@/types/crm";
import type { CustomerStatus } from "@/types/customer";
import { fetchPage, getOne, invalidate } from "./_core";

const CUSTOMERS = "/customers/api/v1/customers/";
const SALES = "/sales/api/v1/";

/* ───────────── رتبه‌بندی ───────────── */

export interface RankingParams extends SearchParams {
  ordering?: RankingOrdering;
  status?: CustomerStatus;
  min_score?: number;
  max_score?: number;
  rated?: boolean;
}

export const rankingApi = {
  page: (params: RankingParams = {}, signal?: AbortSignal) =>
    fetchPage<RankedCustomer>(
      `${CUSTOMERS}ranking/`,
      { ...params } as Record<string, string | number | boolean | undefined>,
      signal,
    ),
};

/* ───────────── نظرات ───────────── */

const commentsUrl = (customerId: number) => `${CUSTOMERS}${customerId}/comments/`;

export const commentsApi = {
  page: (
    customerId: number,
    params: SearchParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<CustomerComment>> =>
    fetchPage<CustomerComment>(commentsUrl(customerId), { ...params }, signal),

  create: async (customerId: number, text: string) => {
    const r = await axiosInstance.post<CustomerComment>(commentsUrl(customerId), { text });
    invalidate("customers:");
    return r.data;
  },

  update: async (customerId: number, id: number, text: string) => {
    const r = await axiosInstance.patch<CustomerComment>(
      `${commentsUrl(customerId)}${id}/`,
      { text },
    );
    return r.data;
  },

  remove: async (customerId: number, id: number) => {
    await axiosInstance.delete(`${commentsUrl(customerId)}${id}/`);
    invalidate("customers:");
  },
};

/* ───────────── مسیر پرونده ───────────── */

export const casePathApi = {
  get: (customerId: number) =>
    getOne<CustomerPath>(`${CUSTOMERS}${customerId}/path/`),
};

/* ───────────── کالاها ───────────── */

export const productsApi = {
  page: (
    params: SearchParams & { active?: boolean } = {},
    signal?: AbortSignal,
  ) => fetchPage<FeedProduct>(`${SALES}products/`, { ...params }, signal),

  /** برای لیست‌های انتخاب (فقط فعال‌ها) */
  active: async (): Promise<FeedProduct[]> => {
    const r = await fetchPage<FeedProduct>(`${SALES}products/`, {
      active: true,
      page_size: 100,
    });
    return r.results;
  },

  create: async (name: string) => {
    const r = await axiosInstance.post<FeedProduct>(`${SALES}products/`, { name });
    return r.data;
  },

  update: async (id: number, payload: Partial<Pick<FeedProduct, "name" | "is_active">>) => {
    const r = await axiosInstance.patch<FeedProduct>(`${SALES}products/${id}/`, payload);
    return r.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}products/${id}/`);
  },
};

/* ───────────── فروش‌ها ───────────── */

export const salesApi = {
  page: (
    params: SearchParams & SaleListParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Sale>> =>
    fetchPage<Sale>(`${SALES}sales/`, { ...params }, signal),

  create: async (payload: SalePayload) => {
    const r = await axiosInstance.post<Sale>(`${SALES}sales/`, payload);
    invalidate("customers:");
    return r.data;
  },

  update: async (id: number, payload: Partial<SalePayload>) => {
    const r = await axiosInstance.patch<Sale>(`${SALES}sales/${id}/`, payload);
    return r.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}sales/${id}/`);
  },

  topCustomers: (params: TopCustomersParams = {}) =>
    getOne<TopCustomersResponse>(
      `${SALES}reports/top-customers/`,
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
      ),
    ),

  customerSummary: (
    customerId: number,
    params: { date_from?: string; date_to?: string } = {},
  ) =>
    getOne<CustomerSalesSummary>(
      `${SALES}customers/${customerId}/summary/`,
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
      ),
    ),
};

export type { PageParams };
