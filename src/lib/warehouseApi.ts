import axiosInstance from "@/lib/axiosInstance";
import { dedupe } from "@/lib/api/_core";
import { extractList } from "@/utils/warehouseEmployee";
import type {
  ApiProduct,
  ApiStockInfo,
  ApiStockTransaction,
  ApiWarehouse,
  CreateWarehousePayload,
  UpdateStockLimitsPayload,
} from "@/types/warehouse";

const BASE = "/warehouse/api/v1";

export const WAREHOUSE_ENDPOINTS = {
  warehouses: `${BASE}/warehouse/`,
  warehouseCreate: `${BASE}/warehouse/create/`,
  warehousePatch: (id: number) => `${BASE}/warehouse/${id}/patch/`,
  taskArchive: `${BASE}/warehouse_task_archive/`,
  attachmentCreate: `${BASE}/order_task/attachment/create/`,
  attachmentDelete: (id: number) =>
    `${BASE}/order_task/attachment/${id}/delete/`,
  products: `${BASE}/products/`,
  categories: `${BASE}/products/categories/`,
  stock: `${BASE}/process/stock/`,
  stockLimits: (stockId: number) => `${BASE}/process/stock/${stockId}/limits/`,
  transactions: `${BASE}/process/transactions/`,
  tasks: `${BASE}/task/`,
  orderTasks: `${BASE}/order_task/`,
  deadlines: `${BASE}/order_task/deadlines/`,
  archive: `${BASE}/order_task_archive/`,
  staff: `${BASE}/staff/`,
} as const;

export const WAREHOUSE_QUERY_KEY = "warehouse_id";

export const PAGE_SIZE = 8;
/** تعداد محصول در هر صفحه (ادمین و یوزر) */
export const PRODUCTS_PAGE_SIZE = 40;

/** سقف page_size در بک‌اند (بیشتر از این را بک‌اند خودش ۱۰۰ می‌کند). */
export const MAX_PAGE_SIZE = 100;

/** سقف ایمنی برای دریافت «همهٔ صفحات» (۲۰۰ × ۱۰۰ = ۲۰٬۰۰۰ ردیف). */
const MAX_PAGES = 200;

/** تعداد درخواست هم‌زمان هنگام دریافت صفحات باقی‌مانده. */
const CONCURRENCY = 6;

export interface PageResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
}

type Params = Record<string, string | number | boolean | null | undefined>;

export const warehouseParams = (
  warehouseId: number | null | undefined,
): Params =>
  warehouseId == null ? {} : { [WAREHOUSE_QUERY_KEY]: warehouseId };

const cleanParams = (params: Params = {}): Record<string, string | number | boolean> =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  ) as Record<string, string | number | boolean>;

const normalizeSearch = (q?: string | null) =>
  (q ?? "").trim().replace(/\s+/g, " ");

function dedupeById<T>(items: T[]): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const id = (item as { id?: unknown } | null)?.id;
    if (id === undefined || id === null) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sortNewestFirst<T>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const x = a as Record<string, unknown>;
    const y = b as Record<string, unknown>;
    const ta = new Date(String(x.created_at ?? "")).getTime();
    const tb = new Date(String(y.created_at ?? "")).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    return Number(y.id ?? 0) - Number(x.id ?? 0);
  });
}

interface RawPage<T> {
  items: T[];
  count: number;
  hasNext: boolean;
  /** پاسخ به شکل {count,next,previous,results} بود (نه آرایهٔ خام). */
  paginated: boolean;
}

function readRaw<T>(data: unknown): RawPage<T> {
  if (Array.isArray(data)) {
    return { items: data as T[], count: data.length, hasNext: false, paginated: false };
  }

  const d = (data ?? {}) as { results?: unknown; count?: unknown; next?: unknown };

  if (Array.isArray(d.results)) {
    const items = d.results as T[];
    return {
      items,
      count: typeof d.count === "number" ? d.count : items.length,
      hasNext: Boolean(d.next),
      paginated: true,
    };
  }

  const items = extractList<T>(data);
  return { items, count: items.length, hasNext: false, paginated: false };
}

async function getRaw<T>(
  url: string,
  params: Params,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<RawPage<T>> {
  const { data } = await axiosInstance.get(url, {
    params: cleanParams({ ...params, page, page_size: pageSize }),
    signal,
  });
  return readRaw<T>(data);
}

const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

/** پردازش لیست با سقف هم‌زمانی (ترتیب خروجی همان ترتیب ورودی است). */
async function mapLimit<I, O>(
  list: I[],
  limit: number,
  fn: (item: I) => Promise<O>,
): Promise<O[]> {
  const out: O[] = new Array(list.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < list.length) {
      const index = cursor++;
      out[index] = await fn(list[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, worker),
  );
  return out;
}

/**
 * یک صفحهٔ واقعی از سرور (صفحه‌بندی و جستجو سمت بک‌اند).
 * اگر endpoint آرایهٔ خام برگرداند (صفحه‌بندی نشده)، صفحه‌بندی محلی انجام می‌شود.
 * اگر صفحهٔ درخواستی از آخرین صفحه بیشتر باشد (۴۰۴ دی‌آر‌اف)، خالی + تعداد درست برمی‌گردد
 * تا UI بتواند به آخرین صفحه برگردد.
 */
export async function fetchPage<T>(
  url: string,
  opts: {
    page: number;
    pageSize?: number;
    params?: Params;
    search?: string;
    signal?: AbortSignal;
  },
): Promise<PageResult<T>> {
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.pageSize ?? PAGE_SIZE));
  const page = Math.max(1, Math.floor(opts.page) || 1);
  const search = normalizeSearch(opts.search);
  const params: Params = { ...(opts.params ?? {}), search: search || undefined };

  let raw: RawPage<T>;

  try {
    raw = await getRaw<T>(url, params, page, pageSize, opts.signal);
  } catch (error) {
    if (page > 1 && statusOf(error) === 404) {
      const first = await getRaw<T>(url, params, 1, pageSize, opts.signal);
      const total = first.paginated ? first.count : first.items.length;
      return {
        items: [],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        page,
      };
    }
    throw error;
  }

  if (raw.paginated) {
    return {
      items: raw.items,
      total: raw.count,
      totalPages: Math.max(1, Math.ceil(raw.count / pageSize)),
      page,
    };
  }

  return sliceLocal(raw.items, page, pageSize);
}

function sliceLocal<T>(all: T[], page: number, pageSize: number): PageResult<T> {
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const safePage = Math.max(1, page);

  // صفحهٔ بیش از حد: خالی + تعداد درست، تا UI به آخرین صفحه هدایت شود
  if (safePage > totalPages) {
    return { items: [], total: all.length, totalPages, page: safePage };
  }

  return {
    items: all.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: all.length,
    totalPages,
    page: safePage,
  };
}

/**
 * همهٔ ردیف‌ها (همهٔ صفحات، ۱۰۰ تایی). صفحات باقی‌مانده با هم‌زمانی محدود گرفته می‌شود.
 * فقط برای لیست‌های «مرجع» و محاسبات تجمیعی استفاده شود؛ لیست‌های نمایشی باید fetchPage باشند.
 */
export async function fetchAll<T>(
  url: string,
  params: Params = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const first = await getRaw<T>(url, params, 1, MAX_PAGE_SIZE, signal);
  if (!first.paginated || !first.hasNext) return first.items;

  const perPage = first.items.length || MAX_PAGE_SIZE;
  const needed = Math.ceil(first.count / perPage);
  const pages = Math.min(needed, MAX_PAGES);

  if (needed > MAX_PAGES) {
    console.warn(
      `[warehouse] ${url}: ${first.count} ردیف وجود دارد ولی فقط ${MAX_PAGES} صفحهٔ اول خوانده شد.`,
    );
  }

  const rest = await mapLimit(
    Array.from({ length: pages - 1 }, (_, i) => i + 2),
    CONCURRENCY,
    (page) => getRaw<T>(url, params, page, MAX_PAGE_SIZE, signal),
  );

  return dedupeById([...first.items, ...rest.flatMap((r) => r.items)]);
}

/** فقط تعداد کل (بدون دریافت داده‌ها). */
export async function fetchCount(
  url: string,
  params: Params = {},
  signal?: AbortSignal,
): Promise<number> {
  const raw = await getRaw<unknown>(url, params, 1, 1, signal);
  return raw.paginated ? raw.count : raw.items.length;
}

/**
 * جدیدترین n ردیف بدون خواندن کل لیست.
 * فرض: ترتیب پیش‌فرض بک‌اند یکنواخت است (صعودی یا نزولی بر اساس id/تاریخ)؛ بنابراین صفحهٔ اول،
 * آخر و یکی مانده به آخر ادغام و مرتب می‌شوند و جدیدترین‌ها در هر دو حالت در همین مجموعه‌اند.
 */
export async function fetchNewest<T extends { id: number; created_at?: string | null }>(
  url: string,
  params: Params = {},
  limit = 20,
  signal?: AbortSignal,
): Promise<T[]> {
  const p: Params = { ...params };
  const first = await getRaw<T>(url, p, 1, MAX_PAGE_SIZE, signal);
  let rows = first.items;

  if (first.paginated && first.hasNext) {
    const perPage = first.items.length || MAX_PAGE_SIZE;
    const lastPage = Math.ceil(first.count / perPage);
    const extra = [lastPage, lastPage - 1].filter((n) => n > 1);
    const more = await Promise.all(
      extra.map((n) => getRaw<T>(url, p, n, MAX_PAGE_SIZE, signal)),
    );
    rows = dedupeById([...rows, ...more.flatMap((r) => r.items)]);
  }

  return sortNewestFirst(rows).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  لیست‌های انبار (فیلتر انبار کاملاً با بک‌اند است)                    */
/* ------------------------------------------------------------------ */

/** یک صفحه از لیست وابسته به انبار؛ `warehouse_id` به بک‌اند می‌رود. */
export async function fetchWarehousePage<T>(
  url: string,
  warehouseId: number,
  opts: {
    page: number;
    pageSize?: number;
    search?: string;
    params?: Params;
    signal?: AbortSignal;
    /** فیلتر دسترسی کاربر (نه فیلتر انبار) */
    clientFilter?: (row: T) => boolean;
  },
): Promise<PageResult<T>> {
  const params: Params = { ...warehouseParams(warehouseId), ...(opts.params ?? {}) };

  if (!opts.clientFilter) {
    return fetchPage<T>(url, {
      page: opts.page,
      pageSize: opts.pageSize,
      search: opts.search,
      params,
      signal: opts.signal,
    });
  }

  const search = normalizeSearch(opts.search);
  const all = (
    await fetchAll<T>(url, { ...params, search: search || undefined }, opts.signal)
  ).filter(opts.clientFilter);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.pageSize ?? PAGE_SIZE));
  return sliceLocal(sortNewestFirst(all), Math.max(1, opts.page) || 1, pageSize);
}

/** همهٔ موجودی‌های یک انبار (لیست مرجع؛ درخواست‌های هم‌زمان یکی می‌شوند). */
export function fetchWarehouseStocks(
  warehouseId: number,
  signal?: AbortSignal,
): Promise<ApiStockInfo[]> {
  return dedupe(`warehouse-stocks:${warehouseId}`, () =>
    fetchAll<ApiStockInfo>(WAREHOUSE_ENDPOINTS.stock, warehouseParams(warehouseId), signal),
  );
}

/** یک صفحه از محصولات انبار، با جستجو و فیلتر قفسه سمت سرور. */
export function fetchWarehouseProductsPage(
  warehouseId: number,
  opts: {
    page: number;
    pageSize?: number;
    search?: string;
    shelfCode?: string;
    signal?: AbortSignal;
  },
): Promise<PageResult<ApiProduct>> {
  const shelfCode = (opts.shelfCode ?? "").trim();
  return fetchPage<ApiProduct>(WAREHOUSE_ENDPOINTS.products, {
    page: opts.page,
    pageSize: opts.pageSize,
    search: opts.search,
    params: {
      ...warehouseParams(warehouseId),
      shelf_code: shelfCode || undefined,
    },
    signal: opts.signal,
  });
}

/** موجودیِ چند محصول (صفحهٔ جاری) در یک انبار؛ فیلتر `product` به بک‌اند. */
export async function fetchStocksForProducts(
  warehouseId: number,
  productIds: number[],
  signal?: AbortSignal,
): Promise<ApiStockInfo[]> {
  if (!productIds.length) return [];
  const rows = await Promise.all(
    productIds.map((id) =>
      fetchPage<ApiStockInfo>(WAREHOUSE_ENDPOINTS.stock, {
        page: 1,
        pageSize: 5,
        params: { ...warehouseParams(warehouseId), product: id },
        signal,
      }),
    ),
  );
  return rows.flatMap((r) => r.items);
}

/** تراکنش‌های یک محصول در یک انبار (برای گردش کالا). */
export async function fetchProductTransactions(
  warehouseId: number,
  productId: number,
  signal?: AbortSignal,
): Promise<ApiStockTransaction[]> {
  return fetchAll<ApiStockTransaction>(
    WAREHOUSE_ENDPOINTS.transactions,
    { ...warehouseParams(warehouseId), product: productId },
    signal,
  );
}

export async function fetchWarehouses(): Promise<ApiWarehouse[]> {
  return fetchAll<ApiWarehouse>(WAREHOUSE_ENDPOINTS.warehouses);
}

export async function createWarehouse(
  payload: CreateWarehousePayload,
): Promise<ApiWarehouse> {
  const { data } = await axiosInstance.post<ApiWarehouse>(
    WAREHOUSE_ENDPOINTS.warehouseCreate,
    payload,
  );
  return data;
}

export async function patchWarehouse(
  id: number,
  payload: Partial<CreateWarehousePayload>,
): Promise<ApiWarehouse> {
  const { data } = await axiosInstance.patch<ApiWarehouse>(
    WAREHOUSE_ENDPOINTS.warehousePatch(id),
    payload,
  );
  return data;
}

export async function setWarehouseActive(
  id: number,
  isActive: boolean,
): Promise<ApiWarehouse> {
  return patchWarehouse(id, { is_active: isActive });
}

export async function createOrderTaskAttachment(input: {
  orderTaskId: number;
  performedBy: number | string;
  note?: string;
  file: File;
}) {
  const form = new FormData();
  form.append("order_task", String(input.orderTaskId));
  form.append("performed_by", String(input.performedBy));
  if (input.note?.trim()) form.append("note", input.note.trim());
  form.append("file", input.file);

  const { data } = await axiosInstance.post(
    WAREHOUSE_ENDPOINTS.attachmentCreate,
    form,
  );
  return data;
}

export async function deleteOrderTaskAttachment(id: number) {
  await axiosInstance.delete(WAREHOUSE_ENDPOINTS.attachmentDelete(id));
}

export async function updateStockLimits(
  stockId: number,
  payload: UpdateStockLimitsPayload,
) {
  const { data } = await axiosInstance.patch(
    WAREHOUSE_ENDPOINTS.stockLimits(stockId),
    payload,
  );
  return data;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;

  if (typeof data === "object") {
    for (const value of Object.values(data as Record<string, unknown>)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length) return String(value[0]);
    }
  }

  return fallback;
}
