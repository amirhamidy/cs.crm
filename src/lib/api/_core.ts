import axiosInstance from "@/lib/axiosInstance";
import type { Paginated } from "@/types/pagination";

export type { Paginated };

export type RawList<T> = T[] | Partial<Paginated<T>> | null | undefined;

type Params = object;
type Id = number | string;
type MaybeId = Id | null | undefined;

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
const versions = new Map<string, number>();

const versionOf = (key: string) => versions.get(key) ?? 0;

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => {
    if (inflight.get(key) === p) inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

export function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 60_000,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T);
  const version = versionOf(key);
  return dedupe(key, async () => {
    const value = await fn();
    if (versionOf(key) === version) {
      store.set(key, { value, expires: Date.now() + ttl });
    }
    return value;
  });
}

export function invalidate(prefix?: string) {
  const match = (k: string) => !prefix || k.startsWith(prefix);
  const keys = new Set([...store.keys(), ...inflight.keys()]);
  keys.forEach((k) => {
    if (!match(k)) return;
    store.delete(k);
    inflight.delete(k);
    versions.set(k, versionOf(k) + 1);
  });
}

export function toPaginated<T>(data: RawList<T> | unknown): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data as T[],
    };
  }
  const d = (data ?? {}) as Partial<Paginated<T>>;
  return {
    count: d.count ?? d.results?.length ?? 0,
    next: d.next ?? null,
    previous: d.previous ?? null,
    results: d.results ?? [],
  };
}

export function uniqueIds<I extends Id = number>(ids: readonly MaybeId[]): I[];
export function uniqueIds<T, I extends Id = number>(
  items: readonly T[],
  pick: (item: T) => MaybeId | readonly MaybeId[],
): I[];
export function uniqueIds<T>(
  input: readonly unknown[],
  pick?: (item: T) => MaybeId | readonly MaybeId[],
): Id[] {
  const out = new Set<Id>();
  input.forEach((item) => {
    const raw = pick ? pick(item as T) : (item as MaybeId);
    const list = Array.isArray(raw) ? raw : [raw];
    list.forEach((v) => {
      if (v === null || v === undefined || v === "") return;
      out.add(v as Id);
    });
  });
  return [...out];
}

export async function fetchAllPages<T>(
  fetchPage: (params: { page: number }) => Promise<Paginated<T>>,
  maxPages = 50,
): Promise<T[]> {
  const first = await fetchPage({ page: 1 });
  if (!first.next || first.results.length === 0) return first.results;

  const perPage = first.results.length;
  const total = Math.min(Math.ceil(first.count / perPage), maxPages);
  const rest = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) => fetchPage({ page: i + 2 })),
  );

  return [first, ...rest].flatMap((p) => p.results);
}

export function listAll<T>(url: string, params: Params = {}, pageSize = 100) {
  return fetchAllPages<T>((p) =>
    fetchPage<T>(url, { ...params, ...p, page_size: pageSize }),
  );
}

export function cleanParams(params: Params = {}): Params {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}

export async function fetchPage<T>(
  url: string,
  params: Params = {},
  signal?: AbortSignal,
): Promise<Paginated<T>> {
  const r = await axiosInstance.get<RawList<T>>(url, {
    params: cleanParams(params),
    signal,
  });
  return toPaginated<T>(r.data);
}

export async function getOne<T>(url: string, params: Params = {}) {
  const r = await axiosInstance.get<T>(url, { params });
  return r.data;
}

export const normalizeQuery = (q: string) => q.trim().replace(/\s+/g, " ");

export const byOrder = <T extends { order?: number }>(a: T, b: T) =>
  (a.order ?? 0) - (b.order ?? 0);

interface SearchOptions<T> {
  key: string;
  url: string;
  all?: () => Promise<T[]>;
  sort?: (a: T, b: T) => number;
  params?: Params;
  pageSize?: number;
  ttl?: number;
}

export function createSearch<T>({
  key,
  url,
  all,
  sort,
  params = {},
  pageSize = 50,
  ttl = 30_000,
}: SearchOptions<T>) {
  const paramsKey = JSON.stringify(params);
  return (query: string): Promise<T[]> => {
    const q = normalizeQuery(query);
    if (!q) return all ? all() : Promise.resolve([]);
    return cached(
      `${key}search:${paramsKey}:${q}`,
      async () => {
        const r = await axiosInstance.get<RawList<T>>(url, {
          params: { ...params, search: q, page_size: pageSize },
        });
        const results = toPaginated<T>(r.data).results;
        return sort ? [...results].sort(sort) : results;
      },
      ttl,
    );
  };
}

export function withSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}
