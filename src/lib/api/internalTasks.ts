import type { Paginated, SearchParams } from "@/types/pagination";
import {
  cached,
  dedupe,
  fetchPage,
  invalidate,
  listAll,
} from "./_core";

const KEY = "internalTasks:";
const BASE = "/tasks/api/v1/internal_task/";
const TTL = 30_000;

type AssigneeRef = number | string | { id: number | string };

export interface InternalTaskSummary {
  id: number;
  title?: string | null;
  status?: string | null;
  assigned_to?: AssigneeRef | AssigneeRef[] | null;
  created_by?: string | null;
}

export type InternalTaskListParams = SearchParams;

const list = (
  params: InternalTaskListParams = {},
  signal?: AbortSignal,
): Promise<Paginated<InternalTaskSummary>> =>
  signal
    ? fetchPage<InternalTaskSummary>(BASE, params, signal)
    : dedupe(`${KEY}list:${JSON.stringify(params)}`, () =>
        fetchPage<InternalTaskSummary>(BASE, params),
      );

export const internalTasksApi = {
  list,

  all: () =>
    cached(`${KEY}all`, () => listAll<InternalTaskSummary>(BASE), TTL),

  invalidate: () => invalidate(KEY),
};
