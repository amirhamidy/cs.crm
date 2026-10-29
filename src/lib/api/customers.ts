import { isAxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import type {
  Customer,
  CustomerDetail,
  CustomerPayload,
  CustomerStatus,
} from "@/types/customer";
import type { PageParams } from "@/types/pagination";
import {
  cached,
  createSearch,
  dedupe,
  fetchPage,
  getOne,
  invalidate,
  listAll as listAllPages,
  normalizeQuery,
  toPaginated,
  uniqueIds,
  type Paginated,
  type RawList,
} from "./_core";

const KEY = "customers:";
const BASE = "/customers/api/v1/customers/";
const DETAIL_TTL = 60_000;
const COUNTS_TTL = 30_000;

export interface CustomerListParams extends PageParams {
  status?: CustomerStatus;
  search?: string;
}

export interface CustomerCounts {
  all: number;
  potential: number;
  active: number;
}

const summaries = new Map<number, Customer>();
const notFound = new Set<number>();

const detailUrl = (id: number) => `${BASE}${id}/`;

function remember(list: Customer[]) {
  list.forEach((c) => summaries.set(c.id, { ...summaries.get(c.id), ...c }));
}

function cleanParams(params: CustomerListParams) {
  const search = params.search ? normalizeQuery(params.search) : undefined;
  return Object.fromEntries(
    Object.entries({ ...params, search }).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}

const list = async (params: CustomerListParams = {}): Promise<Paginated<Customer>> => {
  const p = cleanParams(params);
  const data = await dedupe(`${KEY}list:${JSON.stringify(p)}`, async () => {
    const res = await axiosInstance.get<RawList<Customer>>(BASE, { params: p });
    return toPaginated<Customer>(res.data);
  });
  remember(data.results);
  return data;
};

/** صفحه‌بندی سمت سرور با پشتیبانی از AbortSignal (برای usePaginatedList) */
const page = async (
  params: CustomerListParams = {},
  signal?: AbortSignal,
): Promise<Paginated<Customer>> => {
  const data = await fetchPage<Customer>(BASE, cleanParams(params), signal);
  remember(data.results);
  return data;
};

const get = async (id: number): Promise<CustomerDetail> => {
  const data = await cached(
    `${KEY}detail:${id}`,
    () => getOne<CustomerDetail>(detailUrl(id)),
    DETAIL_TTL,
  );
  remember([data]);
  notFound.delete(id);
  return data;
};

const counts = () =>
  cached<CustomerCounts>(
    `${KEY}counts`,
    async () => {
      const [all, potential, active] = await Promise.all([
        list({ page: 1, page_size: 1 }),
        list({ page: 1, page_size: 1, status: 1 }),
        list({ page: 1, page_size: 1, status: 2 }),
      ]);
      return { all: all.count, potential: potential.count, active: active.count };
    },
    COUNTS_TTL,
  );

const searchRaw = createSearch<Customer>({ key: KEY, url: BASE, pageSize: 20 });

const search = async (query: string) => {
  const results = await searchRaw(query);
  remember(results);
  return results;
};

const getMany = async (
  ids: readonly (number | string | null | undefined)[],
): Promise<Customer[]> => {
  const unique = [...new Set(uniqueIds(ids).map(Number))].filter(
    (n) => Number.isInteger(n) && n > 0,
  );
  const toFetch = unique.filter((id) => !summaries.has(id) && !notFound.has(id));

  await Promise.all(
    toFetch.map((id) =>
      get(id).catch((e) => {
        if (isAxiosError(e) && e.response?.status === 404) notFound.add(id);
      }),
    ),
  );

  return unique
    .map((id) => summaries.get(id))
    .filter((c): c is Customer => Boolean(c));
};

const allCustomers = () =>
  cached(
    `${KEY}all:`,
    async () => {
      const data = await listAllPages<Customer>(BASE);
      remember(data);
      return data;
    },
    COUNTS_TTL,
  );

export const customersApi = {
  list,
  page,
  listAll: allCustomers,
  get,
  counts,
  search,
  getMany,

  peek: (id: number) => summaries.get(id),

  create: async (payload: CustomerPayload) => {
    const { data } = await axiosInstance.post<CustomerDetail>(BASE, payload);
    invalidate(KEY);
    remember([data]);
    return data;
  },

  update: async (id: number, payload: CustomerPayload) => {
    const { data } = await axiosInstance.patch<CustomerDetail>(detailUrl(id), payload);
    invalidate(KEY);
    remember([data]);
    return data;
  },

  remove: async (id: number) => {
    await axiosInstance.delete(detailUrl(id));
    invalidate(KEY);
    summaries.delete(id);
  },

  invalidate: () => invalidate(KEY),

  clearCache: () => {
    invalidate(KEY);
    summaries.clear();
    notFound.clear();
  },
};
