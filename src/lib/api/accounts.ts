import axiosInstance from "@/lib/axiosInstance";
import type { ApiEmployee, ApiUser } from "@/types/users";
import type { Paginated, SearchParams } from "@/types/pagination";
import {
  cached,
  createSearch,
  dedupe,
  fetchPage,
  getOne,
  invalidate,
  listAll,
  uniqueIds,
} from "./_core";

const KEY = "accounts:";
const BASE = "/accounts/api/v1";
const TTL = 5 * 60_000;
const SEARCH_SIZE = 30;

const URLS = {
  me: `${BASE}/auth/me/`,
  employees: `${BASE}/employee/list/`,
  employeeCreate: `${BASE}/employee/create/`,
  employee: (id: number | string) => `${BASE}/employee/${id}/`,
  employeeUpdate: (id: number | string) => `${BASE}/employee/${id}/update/`,
  employeeDelete: (id: number | string) => `${BASE}/employee/${id}/delete/`,
  users: `${BASE}/user/list/`,
  userCreate: `${BASE}/user/create/`,
  userUpdate: (id: number | string) => `${BASE}/user/${id}/update/`,
  userDelete: (id: number | string) => `${BASE}/user/${id}/delete/`,
} as const;

export interface AuthMe {
  id: number;
  username: string;
  phone_number: string;
  type: 1 | 2;
}

export type EmployeeListParams = SearchParams;
export type UserListParams = SearchParams;
export type EmployeePayload = Record<string, unknown>;
export type UserPayload = Record<string, unknown>;

const employeeById = new Map<number, ApiEmployee>();

function remember(list: ApiEmployee[]) {
  list.forEach((e) => employeeById.set(e.id, { ...employeeById.get(e.id), ...e }));
}

const listEmployees = async (
  params: EmployeeListParams = {},
  signal?: AbortSignal,
): Promise<Paginated<ApiEmployee>> => {
  const data = signal
    ? await fetchPage<ApiEmployee>(URLS.employees, params, signal)
    : await dedupe(`${KEY}employees:list:${JSON.stringify(params)}`, () =>
        fetchPage<ApiEmployee>(URLS.employees, params),
      );
  remember(data.results);
  return data;
};

const allEmployees = () =>
  cached(
    `${KEY}employees:all`,
    async () => {
      const list = await listAll<ApiEmployee>(URLS.employees);
      remember(list);
      return list;
    },
    TTL,
  );

const getEmployee = async (id: number): Promise<ApiEmployee> => {
  const hit = employeeById.get(id);
  if (hit) return hit;
  const data = await cached(
    `${KEY}employees:detail:${id}`,
    () => getOne<ApiEmployee>(URLS.employee(id)),
    TTL,
  );
  remember([data]);
  return data;
};

const employeeSearchRaw = createSearch<ApiEmployee>({
  key: `${KEY}employees:`,
  url: URLS.employees,
  pageSize: SEARCH_SIZE,
  all: async () =>
    (await listEmployees({ page: 1, page_size: SEARCH_SIZE })).results,
});

const searchEmployees = async (query: string) => {
  const results = await employeeSearchRaw(query);
  remember(results);
  return results;
};

const getManyEmployees = async (
  ids: readonly (number | string | null | undefined)[],
): Promise<ApiEmployee[]> => {
  const unique = uniqueIds(ids)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  await Promise.all(
    unique.filter((id) => !employeeById.has(id)).map((id) => getEmployee(id).catch(() => null)),
  );
  return unique
    .map((id) => employeeById.get(id))
    .filter((e): e is ApiEmployee => Boolean(e));
};

const employeeByUsername = (username: string) =>
  cached(
    `${KEY}employees:username:${username}`,
    async () => {
      const page = await listEmployees({
        page: 1,
        page_size: 50,
        search: username,
      });
      return page.results.find((e) => e.username === username) ?? null;
    },
    TTL,
  );

const listUsers = (
  params: UserListParams = {},
  signal?: AbortSignal,
): Promise<Paginated<ApiUser>> =>
  signal
    ? fetchPage<ApiUser>(URLS.users, params, signal)
    : dedupe(`${KEY}users:list:${JSON.stringify(params)}`, () =>
        fetchPage<ApiUser>(URLS.users, params),
      );

const allUsers = () =>
  cached(`${KEY}users:all`, () => listAll<ApiUser>(URLS.users), TTL);

const userSearch = createSearch<ApiUser>({
  key: `${KEY}users:`,
  url: URLS.users,
  pageSize: SEARCH_SIZE,
  all: async () =>
    (await listUsers({ page: 1, page_size: SEARCH_SIZE })).results,
});

export const accountsApi = {
  me: () => dedupe(`${KEY}me`, () => getOne<AuthMe>(URLS.me)),

  employees: {
    list: listEmployees,
    all: allEmployees,
    get: getEmployee,
    getMany: getManyEmployees,
    search: searchEmployees,
    byUsername: employeeByUsername,
    peek: (id: number) => employeeById.get(id),

    create: async (payload: EmployeePayload) => {
      const { data } = await axiosInstance.post<ApiEmployee>(
        URLS.employeeCreate,
        payload,
      );
      invalidate(KEY);
      remember([data]);
      return data;
    },

    update: async (id: number, payload: EmployeePayload) => {
      const { data } = await axiosInstance.put<ApiEmployee>(
        URLS.employeeUpdate(id),
        payload,
      );
      invalidate(KEY);
      remember([data]);
      return data;
    },

    remove: async (id: number) => {
      await axiosInstance.delete(URLS.employeeDelete(id));
      invalidate(KEY);
      employeeById.delete(id);
    },
  },

  users: {
    list: listUsers,
    all: allUsers,
    search: userSearch,

    create: async <R = ApiUser>(payload: UserPayload) => {
      const { data } = await axiosInstance.post<R>(URLS.userCreate, payload);
      invalidate(KEY);
      return data;
    },

    update: async (id: number, payload: UserPayload) => {
      const { data } = await axiosInstance.put<ApiUser>(
        URLS.userUpdate(id),
        payload,
      );
      invalidate(KEY);
      return data;
    },

    remove: async (id: number) => {
      await axiosInstance.delete(URLS.userDelete(id));
      invalidate(KEY);
    },
  },

  invalidate: () => invalidate(KEY),

  clearCache: () => {
    invalidate(KEY);
    employeeById.clear();
  },
};
