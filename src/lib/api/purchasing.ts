import type { Paginated, SearchParams } from "@/types/pagination";
import type {
  ApiPurchasingEmployee,
  ApiPurchasingStep,
  ApiPurchasingTask,
  ApiTaskAttachment,
} from "@/types/purchasing";
import { fetchPage, listAll } from "./_core";
import { fetchStatusCount, fetchStatusPage, listAllByStatus } from "./statusPage";

const ROOT = "/purchasing/api/v1";
export const PURCHASING_TASKS_URL = `${ROOT}/tasks/`;
const STEPS = `${ROOT}/steps/`;
const EMPLOYEES = `${ROOT}/employees/`;
const ATTACHMENTS = `${ROOT}/task-attachments/`;

export type PurchasingArchiveStatus = "completed" | "cancelled";
export const PURCHASING_ACTIVE_STATUSES = ["pending", "in_progress"] as const;

export interface PurchasingCounts {
  active: number;
  completed: number;
  cancelled: number;
}

export const purchasingApi = {
  
  employees: () => listAll<ApiPurchasingEmployee>(EMPLOYEES),
  steps: async () =>
    (await listAll<ApiPurchasingStep>(STEPS)).sort((a, b) => a.order - b.order),
  attachments: () => listAll<ApiTaskAttachment>(ATTACHMENTS),

  
  activeTasks: async (): Promise<ApiPurchasingTask[]> => {
    const lists = await Promise.all(
      PURCHASING_ACTIVE_STATUSES.map((s) =>
        listAllByStatus<ApiPurchasingTask>(PURCHASING_TASKS_URL, s),
      ),
    );
    const map = new Map<number, ApiPurchasingTask>();
    lists.flat().forEach((t) => map.set(t.id, t));
    return [...map.values()].sort((a, b) => b.id - a.id);
  },

  
  archivePage: (
    status: PurchasingArchiveStatus,
    params: SearchParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ApiPurchasingTask>> =>
    fetchStatusPage<ApiPurchasingTask>(PURCHASING_TASKS_URL, status, params, signal),

  
  archiveCounts: async (): Promise<Pick<PurchasingCounts, "completed" | "cancelled">> => {
    const [completed, cancelled] = await Promise.all([
      fetchStatusCount(PURCHASING_TASKS_URL, "completed"),
      fetchStatusCount(PURCHASING_TASKS_URL, "cancelled"),
    ]);
    return { completed, cancelled };
  },

  
  tasksPage: (params: SearchParams = {}, signal?: AbortSignal) =>
    fetchPage<ApiPurchasingTask>(PURCHASING_TASKS_URL, params, signal),
};
