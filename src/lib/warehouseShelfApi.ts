import axiosInstance from "@/lib/axiosInstance";
import { PAGE_SIZE } from "@/lib/warehouseApi";
import type { ApiOrderTask, ApiProduct } from "@/types/warehouse";
import type {
  AddItemInput,
  PicklistPage,
  PicklistParams,
  PicklistProduct,
  ShelfSummary,
} from "@/types/warehouseShelf";

const BASE = "/warehouse/api/v1";

export async function fetchShelves(signal?: AbortSignal): Promise<ShelfSummary[]> {
  const { data } = await axiosInstance.get(`${BASE}/products/shelves/`, { signal });
  const list = Array.isArray(data) ? data : (data as { results?: unknown })?.results;
  return Array.isArray(list) ? (list as ShelfSummary[]) : [];
}

export async function fetchPicklist(
  params: PicklistParams,
  signal?: AbortSignal,
): Promise<PicklistPage> {
  const query: Record<string, string | number> = {};

  if (params.warehouseId != null) query.warehouse_id = params.warehouseId;
  if (params.orderTaskId != null) query.order_task_id = params.orderTaskId;
  if (params.shelfCode) query.shelf_code = params.shelfCode;
  if (params.category != null) query.category = params.category;
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.inStock) query.in_stock = "true";
  if (params.page && params.page > 1) query.page = params.page;

  const { data } = await axiosInstance.get(`${BASE}/products/picklist/`, {
    params: query,
    signal,
  });

  if (Array.isArray(data)) {
    return { items: data as PicklistProduct[], count: data.length };
  }

  const results = Array.isArray(data?.results) ? (data.results as PicklistProduct[]) : [];
  const count = typeof data?.count === "number" ? data.count : results.length;

  return { items: results, count };
}

export async function addItemsToOrder(
  orderTaskId: number,
  items: AddItemInput[],
): Promise<ApiOrderTask> {
  const { data } = await axiosInstance.post<ApiOrderTask>(
    `${BASE}/order_task/${orderTaskId}/add-items/`,
    { items },
    { headers: { "Content-Type": "application/json" } },
  );
  return data;
}

export async function fetchProductsByShelf(
  shelfCode: string,
  page: number,
  signal?: AbortSignal,
  search?: string,
): Promise<{ items: ApiProduct[]; count: number }> {
  const query: Record<string, string | number> = { shelf_code: shelfCode, page_size: PAGE_SIZE };
  if (page > 1) query.page = page;
  if (search?.trim()) query.search = search.trim();

  const { data } = await axiosInstance.get(`${BASE}/products/`, { params: query, signal });

  if (Array.isArray(data)) {
    return { items: data as ApiProduct[], count: data.length };
  }

  const results = Array.isArray(data?.results) ? (data.results as ApiProduct[]) : [];
  const count = typeof data?.count === "number" ? data.count : results.length;

  return { items: results, count };
}
