import axiosInstance from "@/lib/axiosInstance";
import type { Paginated, PageParams, SearchParams } from "@/types/pagination";
import type {
  CustomerComment,
  CustomerScore,
  CustomerPath,
  CustomerSalesSummary,
  FeedProduct,
  LoadIssue,
  LoadIssuePayload,
  MarketplaceAccount,
  MarketplaceAccountPayload,
  RankedCustomer,
  RankingOrdering,
  Sale,
  SaleAttachment,
  SaleListParams,
  SalePayload,
  SeasonalSuggestions,
  SeasonalSupply,
  SeasonalSupplyPayload,
  TopCustomersParams,
  TopCustomersResponse,
} from "@/types/crm";
import type { CustomerStatus } from "@/types/customer";
import { cached, fetchPage, getOne, invalidate } from "./_core";

const CUSTOMERS = "/customers/api/v1/customers/";
const SALES = "/sales/api/v1/";



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



const scoresUrl = (customerId: number) => `${CUSTOMERS}${customerId}/scores/`;

export const scoresApi = {
  page: (customerId: number, signal?: AbortSignal) =>
    fetchPage<CustomerScore>(scoresUrl(customerId), {}, signal),
};

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



export const casePathApi = {
  get: (customerId: number) =>
    getOne<CustomerPath>(`${CUSTOMERS}${customerId}/path/`),
};



export const productsApi = {
  page: (
    params: SearchParams & { active?: boolean } = {},
    signal?: AbortSignal,
  ) => fetchPage<FeedProduct>(`${SALES}products/`, { ...params }, signal),

  
  active: (): Promise<FeedProduct[]> =>
    cached("crm:products:active", async () => {
      const r = await fetchPage<FeedProduct>(`${SALES}products/`, {
        active: true,
        page_size: 100,
      });
      return r.results;
    }, 60_000),

  create: async (name: string) => {
    const r = await axiosInstance.post<FeedProduct>(`${SALES}products/`, { name });
    invalidate("crm:products:");
    return r.data;
  },

  update: async (id: number, payload: Partial<Pick<FeedProduct, "name" | "is_active">>) => {
    const r = await axiosInstance.patch<FeedProduct>(`${SALES}products/${id}/`, payload);
    invalidate("crm:products:");
    return r.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}products/${id}/`);
    invalidate("crm:products:");
  },
};



export const salesApi = {
  page: (
    params: SearchParams & SaleListParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Sale>> =>
    fetchPage<Sale>(`${SALES}sales/`, { ...params }, signal),

  create: async (payload: SalePayload) => {
    const r = await axiosInstance.post<Sale>(`${SALES}sales/`, payload);
    invalidate("customers:");
    invalidate("crm:sales:");
    return r.data;
  },

  update: async (id: number, payload: Partial<SalePayload>) => {
    const r = await axiosInstance.patch<Sale>(`${SALES}sales/${id}/`, payload);
    invalidate("customers:");
    invalidate("crm:sales:");
    return r.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}sales/${id}/`);
    invalidate("customers:");
    invalidate("crm:sales:");
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



export const attachmentsApi = {
  list: async (saleId: number, signal?: AbortSignal): Promise<SaleAttachment[]> =>
    (await axiosInstance.get<SaleAttachment[]>(`${SALES}sales/${saleId}/attachments/`, { signal })).data,

  upload: async (saleId: number, file: File, title = ""): Promise<SaleAttachment> => {
    const form = new FormData();
    form.append("file", file);
    if (title.trim()) form.append("title", title.trim());
    const r = await axiosInstance.post<SaleAttachment>(
      `${SALES}sales/${saleId}/attachments/`,
      form,
    );
    return r.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}attachments/${id}/`);
  },

  
  download: async (attachment: SaleAttachment) => {
    const r = await axiosInstance.get<Blob>(`${SALES}attachments/${attachment.id}/download/`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.original_name || attachment.title || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};



export const issuesApi = {
  forSale: async (saleId: number, signal?: AbortSignal): Promise<LoadIssue[]> =>
    (await axiosInstance.get<LoadIssue[]>(`${SALES}sales/${saleId}/issues/`, { signal })).data,

  page: (
    params: SearchParams & {
      status?: string;
      type?: string;
      customer?: number;
      sale?: number;
    } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<LoadIssue>> =>
    fetchPage<LoadIssue>(`${SALES}issues/`, { ...params }, signal),

  create: async (saleId: number, payload: LoadIssuePayload) =>
    (await axiosInstance.post<LoadIssue>(`${SALES}sales/${saleId}/issues/`, payload)).data,

  update: async (id: number, payload: Partial<LoadIssuePayload>) =>
    (await axiosInstance.patch<LoadIssue>(`${SALES}issues/${id}/`, payload)).data,

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}issues/${id}/`);
  },
};



export const seasonalApi = {
  suggestions: async (month?: number, signal?: AbortSignal) =>
    (await axiosInstance.get<SeasonalSuggestions>(`${SALES}seasonal/suggestions/`, {
      params: month ? { month } : undefined,
      signal,
    })).data,

  page: (
    params: SearchParams & { product?: number; customer?: number; month?: number } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<SeasonalSupply>> =>
    fetchPage<SeasonalSupply>(`${SALES}seasonal/`, { ...params }, signal),

  create: async (payload: SeasonalSupplyPayload) => {
    const r = await axiosInstance.post<SeasonalSupply>(`${SALES}seasonal/`, payload);
    invalidate("seasonal");
    return r.data;
  },

  update: async (id: number, payload: Partial<SeasonalSupplyPayload>) => {
    const r = await axiosInstance.patch<SeasonalSupply>(`${SALES}seasonal/${id}/`, payload);
    invalidate("seasonal");
    return r.data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}seasonal/${id}/`);
    invalidate("seasonal");
  },
};



export const marketplaceApi = {
  list: async (customerId: number, signal?: AbortSignal): Promise<MarketplaceAccount[]> =>
    (
      await axiosInstance.get<MarketplaceAccount[]>(
        `${CUSTOMERS}${customerId}/marketplace-accounts/`,
        { signal },
      )
    ).data,

  create: async (customerId: number, payload: MarketplaceAccountPayload) =>
    (
      await axiosInstance.post<MarketplaceAccount>(
        `/customers/api/v1/customers/${customerId}/marketplace-accounts/`,
        payload,
      )
    ).data,

  update: async (id: number, payload: Partial<MarketplaceAccountPayload>) =>
    (
      await axiosInstance.patch<MarketplaceAccount>(
        `/customers/api/v1/marketplace-accounts/${id}/`,
        payload,
      )
    ).data,

  remove: async (id: number) => {
    await axiosInstance.delete(`/customers/api/v1/marketplace-accounts/${id}/`);
  },

  
  reveal: async (id: number): Promise<string> =>
    (
      await axiosInstance.post<{ password: string }>(
        `/customers/api/v1/marketplace-accounts/${id}/reveal/`,
      )
    ).data.password,
};

export type { PageParams };
