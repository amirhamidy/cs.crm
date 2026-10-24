import type { Paginated, SearchParams } from "@/types/pagination";
import type { ApiQualityControlEmployee, ApiQualityControlItem } from "@/types/quality_control";
import { listAll } from "./_core";
import { fetchStatusCount, fetchStatusPage } from "./statusPage";

const ITEMS = "/quality_control/api/v1/";
const EMPLOYEES = "/quality_control/api/v1/employee/";

export type QCReviewedStatus = "approved" | "rejected";
export type QCListStatus = "pending" | QCReviewedStatus;

export interface QCCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export const qualityControlApi = {
  employees: () => listAll<ApiQualityControlEmployee>(EMPLOYEES),

  /** هر بخش صفحه (در انتظار / تایید‌شده / ردشده) سمت سرور صفحه‌بندی و جستجو می‌شود. */
  page: (
    status: QCListStatus,
    params: SearchParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ApiQualityControlItem>> =>
    fetchStatusPage<ApiQualityControlItem>(ITEMS, status, params, signal),

  counts: async (): Promise<QCCounts> => {
    const [pending, approved, rejected] = await Promise.all([
      fetchStatusCount(ITEMS, "pending"),
      fetchStatusCount(ITEMS, "approved"),
      fetchStatusCount(ITEMS, "rejected"),
    ]);
    return { pending, approved, rejected };
  },
};
