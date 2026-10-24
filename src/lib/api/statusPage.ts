import type { Paginated, SearchParams } from "@/types/pagination";
import { dedupe, fetchPage, listAll } from "./_core";

/**
 * لیست‌هایی که بر اساس «status» به چند بخش تقسیم می‌شوند (فعال / بایگانی، در انتظار / تایید‌شده، ...).
 *
 * حالت عادی: پارامتر `status` به بکاند فرستاده می‌شود و صفحه‌بندی کاملاً سمت سرور است.
 * اگر بکاند روی یک endpoint فیلتر `status` را پشتیبانی نکند (در پاسخ ردیفی با status دیگر
 * برمی‌گردد)، همان endpoint به‌صورت خودکار روی «حالت امن» می‌رود: همهٔ صفحات یک‌بار
 * خوانده می‌شود، سمت کلاینت فیلتر می‌شود و بعد صفحه‌بندی می‌شود. بدین‌ترتیب نتیجه در هر دو حالت درست است.
 */

type Mode = "server" | "client";
const modes = new Map<string, Mode>();

export const isStatusFilterServerSide = (url: string) => modes.get(url) !== "client";

interface Row {
  status?: string | null;
}

const clientAll = <T extends Row>(url: string, search?: string) =>
  dedupe(`status-all:${url}:${search ?? ""}`, () =>
    listAll<T>(url, search ? { search } : {}),
  );

async function clientPage<T extends Row>(
  url: string,
  status: string,
  { page = 1, page_size = 20, search }: SearchParams,
): Promise<Paginated<T>> {
  const all = (await clientAll<T>(url, search)).filter((r) => r.status === status);
  const start = (page - 1) * page_size;
  return {
    count: all.length,
    next: start + page_size < all.length ? "client" : null,
    previous: page > 1 ? "client" : null,
    results: all.slice(start, start + page_size),
  };
}

/** یک صفحه از لیست، فقط ردیف‌هایی که status آن‌ها برابر `status` است. */
export async function fetchStatusPage<T extends Row>(
  url: string,
  status: string,
  params: SearchParams = {},
  signal?: AbortSignal,
): Promise<Paginated<T>> {
  if (modes.get(url) === "client") return clientPage<T>(url, status, params);

  const res = await fetchPage<T>(url, { ...params, status }, signal);
  if (res.results.some((r) => r.status && r.status !== status)) {
    modes.set(url, "client");
    return clientPage<T>(url, status, params);
  }
  return res;
}

/** فقط تعداد کل ردیف‌های یک status (بدون خواندن داده‌ها). */
export async function fetchStatusCount(
  url: string,
  status: string,
  signal?: AbortSignal,
): Promise<number> {
  const res = await fetchStatusPage<Row>(url, status, { page: 1, page_size: 1 }, signal);
  return res.count;
}

/** همهٔ ردیف‌های یک status (برای بوردهایی که باید گروه‌بندی کنند، مثل مراحل خرید). */
export async function listAllByStatus<T extends Row>(
  url: string,
  status: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const rows = await listAll<T>(url, { ...params, status });
  return rows.filter((r) => !r.status || r.status === status);
}
