import axiosInstance from "@/lib/axiosInstance";
import type {
  CustomerSalesSummary,
  CustomerSummaryParams,
  Product,
  ProductPayload,
  Sale,
  SaleListParams,
  SalePayload,
  TopCustomersParams,
  TopCustomersResponse,
} from "@/types/sales";
import type { PageParams } from "@/types/pagination";
import {
  cached,
  cleanParams,
  fetchPage,
  getOne,
  invalidate,
  type Paginated,
} from "./_core";

const KEY = "sales:";
const BASE = "/sales/api/v1";
const PRODUCTS = `${BASE}/products/`;
const SALES = `${BASE}/sales/`;
const TTL = 30_000;

export interface ProductListParams extends PageParams {
  active?: boolean;
  search?: string;
}

export const salesApi = {
  products: {
    list: (params: ProductListParams = {}): Promise<Paginated<Product>> =>
      fetchPage<Product>(PRODUCTS, cleanParams(params)),

    /** Active products only, for dropdowns (sale registration). */
    active: (): Promise<Paginated<Product>> =>
      cached(
        `${KEY}products:active`,
        () => fetchPage<Product>(PRODUCTS, { active: true, page_size: 100 }),
        TTL,
      ),

    create: async (payload: ProductPayload): Promise<Product> => {
      const { data } = await axiosInstance.post<Product>(PRODUCTS, payload);
      invalidate(`${KEY}products`);
      return data;
    },

    update: async (
      id: number,
      payload: Partial<ProductPayload>,
    ): Promise<Product> => {
      const { data } = await axiosInstance.patch<Product>(
        `${PRODUCTS}${id}/`,
        payload,
      );
      invalidate(`${KEY}products`);
      return data;
    },

    /** Fails with 400 if the product was used in a sale; deactivate instead. */
    remove: async (id: number): Promise<void> => {
      await axiosInstance.delete(`${PRODUCTS}${id}/`);
      invalidate(`${KEY}products`);
    },
  },

  list: (
    params: SaleListParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Sale>> =>
    fetchPage<Sale>(SALES, cleanParams(params), signal),

  get: (id: number) => getOne<Sale>(`${SALES}${id}/`),

  create: async (payload: SalePayload): Promise<Sale> => {
    const { data } = await axiosInstance.post<Sale>(SALES, payload);
    invalidate(KEY);
    invalidate("customers:");
    return data;
  },

  update: async (id: number, payload: Partial<SalePayload>): Promise<Sale> => {
    const { data } = await axiosInstance.patch<Sale>(`${SALES}${id}/`, payload);
    invalidate(KEY);
    invalidate("customers:");
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${SALES}${id}/`);
    invalidate(KEY);
    invalidate("customers:");
  },

  /** Top customers report. Not paginated; supports `limit` only. */
  topCustomers: (params: TopCustomersParams = {}): Promise<TopCustomersResponse> =>
    cached(
      `${KEY}top:${JSON.stringify(cleanParams(params))}`,
      () =>
        getOne<TopCustomersResponse>(
          `${BASE}/reports/top-customers/`,
          cleanParams(params),
        ),
      TTL,
    ),

  customerSummary: (
    customerId: number,
    params: CustomerSummaryParams = {},
  ): Promise<CustomerSalesSummary> =>
    cached(
      `${KEY}summary:${customerId}:${JSON.stringify(cleanParams(params))}`,
      () =>
        getOne<CustomerSalesSummary>(
          `${BASE}/customers/${customerId}/summary/`,
          cleanParams(params),
        ),
      TTL,
    ),

  invalidate: () => invalidate(KEY),
};
