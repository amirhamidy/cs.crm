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
  MarketplaceAccountCreatePayload,
  MarketplaceAccountUpdatePayload,
  RankedCustomer,
  RankingOrdering,
  Sale,
  SaleAttachment,
  SaleListParams,
  SalePayload,
  TradeOption,
  Trader,
  SeasonalSuggestions,
  SeasonalSupply,
  SeasonalSupplyPayload,
  TopCustomersParams,
  TopCustomersResponse,
} from "@/types/crm";
import type { CustomerStatus } from "@/types/customer";
import { cached, fetchPage, getOne, invalidate, listAll } from "./_core";

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
  all: (customerId: number) => listAll<CustomerScore>(scoresUrl(customerId)),
  create: async (customerId: number, payload: Pick<CustomerScore, "score" | "reason">) => {
    const { data } = await axiosInstance.post<CustomerScore>(scoresUrl(customerId), payload);
    invalidate("customers:");
    return data;
  },
  get: async (customerId: number, scoreId: number) =>
    getOne<CustomerScore>(`${scoresUrl(customerId)}${scoreId}/`),
  replace: async (customerId: number, scoreId: number, payload: Pick<CustomerScore, "score" | "reason">) => {
    const { data } = await axiosInstance.put<CustomerScore>(`${scoresUrl(customerId)}${scoreId}/`, payload);
    invalidate("customers:");
    return data;
  },
  update: async (customerId: number, scoreId: number, payload: Partial<Pick<CustomerScore, "score" | "reason">>) => {
    const { data } = await axiosInstance.patch<CustomerScore>(`${scoresUrl(customerId)}${scoreId}/`, payload);
    invalidate("customers:");
    return data;
  },
  remove: async (customerId: number, scoreId: number) => {
    await axiosInstance.delete(`${scoresUrl(customerId)}${scoreId}/`);
    invalidate("customers:");
  },
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

  get: (customerId: number, id: number) =>
    getOne<CustomerComment>(`${commentsUrl(customerId)}${id}/`),

  replace: async (customerId: number, id: number, text: string) => {
    const r = await axiosInstance.put<CustomerComment>(`${commentsUrl(customerId)}${id}/`, { text });
    invalidate("customers:");
    return r.data;
  },

  update: async (customerId: number, id: number, text: string) => {
    const r = await axiosInstance.patch<CustomerComment>(
      `${commentsUrl(customerId)}${id}/`,
      { text },
    );
    invalidate("customers:");
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
  get: (id: number) => getOne<FeedProduct>(`${SALES}products/${id}/`),

  all: () => cached("crm:products:all", () => listAll<FeedProduct>(`${SALES}products/`), 60_000),

  page: (
    params: SearchParams & { active?: boolean } = {},
    signal?: AbortSignal,
  ) => fetchPage<FeedProduct>(`${SALES}products/`, { ...params }, signal),

  
  active: (): Promise<FeedProduct[]> =>
    cached("crm:products:active", () => listAll<FeedProduct>(`${SALES}products/`, { active: true }, 100), 60_000),

  create: async (name: string) => {
    const r = await axiosInstance.post<FeedProduct>(`${SALES}products/`, { name });
    invalidate("crm:products:");
    return r.data;
  },

  replace: async (id: number, payload: Pick<FeedProduct, "name" | "is_active">) => {
    const r = await axiosInstance.put<FeedProduct>(`${SALES}products/${id}/`, payload);
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
  get: async (id: number, signal?: AbortSignal) =>
    (await axiosInstance.get<Sale>(`${SALES}sales/${id}/`, { signal })).data,

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

  replace: async (id: number, payload: SalePayload) => {
    const r = await axiosInstance.put<Sale>(`${SALES}sales/${id}/`, payload);
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

  markReturned: async (id: number, note = "") => {
    const r = await axiosInstance.post<Sale>(`${SALES}sales/${id}/mark-returned/`, { note });
    invalidate("customers:");
    invalidate("crm:sales:");
    return r.data;
  },

  undoReturn: async (id: number) => {
    const r = await axiosInstance.post<Sale>(`${SALES}sales/${id}/undo-return/`);
    invalidate("customers:");
    invalidate("crm:sales:");
    return r.data;
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



export const tradeOptionsApi = {
  get: (id: number) => getOne<TradeOption>(`${SALES}trade-options/${id}/`),

  list: (kind: TradeOption["kind"], opts: { all?: boolean } = {}): Promise<TradeOption[]> =>
    listAll<TradeOption>(`${SALES}trade-options/`, {
      kind,
      ...(opts.all ? { all: 1 } : {}),
    }, 100),
  create: async (p: Partial<TradeOption> & { kind: TradeOption["kind"]; name: string }) => {
    const r = await axiosInstance.post<TradeOption>(`${SALES}trade-options/`, p);
    invalidate("crm:sales:");
    return r.data;
  },
  update: async (id: number, p: Partial<TradeOption>) => {
    const r = await axiosInstance.patch<TradeOption>(`${SALES}trade-options/${id}/`, p);
    invalidate("crm:sales:");
    return r.data;
  },
  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}trade-options/${id}/`);
    invalidate("crm:sales:");
  },
};

export const tradersApi = {
  list: async (): Promise<Trader[]> => {
    try {
      return await listAll<Trader>(`${SALES}traders/`);
    } catch {
      return [];
    }
  },
};

export const attachmentsApi = {
  list: async (saleId: number, signal?: AbortSignal): Promise<SaleAttachment[]> =>
    (await axiosInstance.get<SaleAttachment[]>(`${SALES}sales/${saleId}/attachments/`, { signal })).data,

  upload: async (saleId: number, file: File, title = ""): Promise<SaleAttachment> => {
    const allowedExtensions = new Set([
      "pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "webp", "txt",
    ]);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension)) {
      throw new Error("فرمت فایل مجاز نیست (pdf، word، excel، تصویر یا txt).");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.");
    }

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
  get: (id: number) => getOne<LoadIssue>(`${SALES}issues/${id}/`),

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

  create: async (saleId: number, payload: LoadIssuePayload) => {
    const { data } = await axiosInstance.post<LoadIssue>(`${SALES}sales/${saleId}/issues/`, payload);
    invalidate("crm:sales:");
    return data;
  },

  update: async (id: number, payload: Partial<LoadIssuePayload>) => {
    const { data } = await axiosInstance.patch<LoadIssue>(`${SALES}issues/${id}/`, payload);
    invalidate("crm:sales:");
    return data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(`${SALES}issues/${id}/`);
    invalidate("crm:sales:");
  },
};



export const seasonalApi = {
  get: (id: number) => getOne<SeasonalSupply>(`${SALES}seasonal/${id}/`),

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
  get: async (id: number) =>
    (await axiosInstance.get<MarketplaceAccount>(`${CUSTOMERS}marketplace-accounts/${id}/`)).data,

  list: async (customerId: number, signal?: AbortSignal): Promise<MarketplaceAccount[]> =>
    (
      await axiosInstance.get<MarketplaceAccount[]>(
        `${CUSTOMERS}${customerId}/marketplace-accounts/`,
        { signal },
      )
    ).data,

  create: async (customerId: number, payload: MarketplaceAccountCreatePayload) =>
    (
      await axiosInstance.post<MarketplaceAccount>(
        `${CUSTOMERS}${customerId}/marketplace-accounts/`,
        payload,
      )
    ).data,

  update: async (id: number, payload: MarketplaceAccountUpdatePayload) =>
    (
      await axiosInstance.patch<MarketplaceAccount>(
        `${CUSTOMERS}marketplace-accounts/${id}/`,
        payload,
      )
    ).data,

  remove: async (id: number) => {
    await axiosInstance.delete(`${CUSTOMERS}marketplace-accounts/${id}/`);
  },

  
  reveal: async (id: number): Promise<string> =>
    (
      await axiosInstance.post<{ password: string }>(
        `${CUSTOMERS}marketplace-accounts/${id}/reveal/`,
      )
    ).data.password,
};

export type { PageParams };
