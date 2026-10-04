import axiosInstance from "@/lib/axiosInstance";
import { extractList } from "@/utils/warehouseEmployee";
import type {
  ApiWarehouse,
  CreateWarehousePayload,
  UpdateStockLimitsPayload,
} from "@/types/warehouse";

/* ============================================================
 *  همه‌ی آدرس‌ها و نام پارامترهای انبار فقط همین‌جا تعریف می‌شن
 * ============================================================ */

const BASE = "/warehouse/api/v1";

export const WAREHOUSE_ENDPOINTS = {
  warehouses: `${BASE}/warehouse/`,
  warehouseCreate: `${BASE}/warehouse/create/`,
  warehousePatch: (id: number) => `${BASE}/warehouse/${id}/patch/`,
  warehouseDelete: (id: number) => `${BASE}/warehouse/${id}/delete/`,
  taskArchive: `${BASE}/warehouse_task_archive/`,
  attachmentCreate: `${BASE}/order_task/attachment/create/`,
  attachmentDelete: (id: number) => `${BASE}/order_task/attachment/${id}/delete/`,
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

/** نام پارامتر فیلتر انبار در query لیست‌ها */
export const WAREHOUSE_QUERY_KEY = "warehouse_id";

export const PAGE_SIZE = 8;

export interface PageResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
}

type Params = Record<string, string | number | boolean | undefined>;

export const warehouseParams = (warehouseId: number | null | undefined): Params =>
  warehouseId == null ? {} : { [WAREHOUSE_QUERY_KEY]: warehouseId };

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

/**
 * یک صفحه از لیست را می‌گیرد.
 * - اگر بک‌اند صفحه‌بندی کند ({count, results}) فقط همان صفحه دانلود می‌شود.
 * - اگر بک‌اند آرایه‌ی ساده بدهد، همین‌جا برش داده می‌شود (رفتار قبلی).
 */
export async function fetchPage<T>(
  url: string,
  opts: {
    page: number;
    pageSize?: number;
    params?: Params;
    newestFirst?: boolean;
  },
): Promise<PageResult<T>> {
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, Math.floor(opts.page) || 1);

  const { data } = await axiosInstance.get(url, {
    params: {
      ...(opts.params ?? {}),
      ...(opts.newestFirst ? { ordering: "-created_at" } : {}),
      page,
      page_size: pageSize,
    },
  });

  const list = extractList<T>(data);
  const serverCount =
    data && !Array.isArray(data) && typeof data.count === "number"
      ? (data.count as number)
      : null;

  // بک‌اند خودش صفحه‌بندی کرده
  if (serverCount !== null && list.length <= pageSize) {
    return {
      items: list,
      total: serverCount,
      totalPages: Math.max(1, Math.ceil(serverCount / pageSize)),
      page,
    };
  }

  // بک‌اند همه‌چیز را یکجا داده → برش سمت کلاینت
  const all = opts.newestFirst ? sortNewestFirst(list) : list;
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const safe = Math.min(page, totalPages);

  return {
    items: all.slice((safe - 1) * pageSize, safe * pageSize),
    total: all.length,
    totalPages,
    page: safe,
  };
}

/** همه‌ی رکوردهای یک لیست (برای جاهایی که واقعاً لیست کامل لازم است) */
export async function fetchAll<T>(url: string, params: Params = {}): Promise<T[]> {
  const out: T[] = [];

  for (let page = 1; page <= 50; page += 1) {
    const { data } = await axiosInstance.get(url, {
      params: { ...params, page, page_size: 1000 },
    });

    const list = extractList<T>(data);
    out.push(...list);

    const hasNext = data && !Array.isArray(data) && Boolean(data.next);
    if (!hasNext || list.length === 0) break;
  }

  return out;
}

/* ------------------------------ انبارها ------------------------------ */

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

export async function deleteWarehouse(id: number) {
  await axiosInstance.delete(WAREHOUSE_ENDPOINTS.warehouseDelete(id));
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
