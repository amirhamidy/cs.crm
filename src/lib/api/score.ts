import axiosInstance from "@/lib/axiosInstance";
import { cached, getOne, invalidate } from "./_core";

const KEY = "score:";
const BASE = "/score/api/v1";
const TTL = 30_000;

export interface EmployeeScore {
  score?: number;
  total_score?: number;
}

export interface AdjustScorePayload {
  employee: number;
  action: "add" | "deduct";
  amount: number;
  reason: string;
}

export const scoreApi = {
  employee: (id: number) =>
    cached(
      `${KEY}employee:${id}`,
      () => getOne<EmployeeScore>(`${BASE}/employees/${id}/`),
      TTL,
    ),

  adjust: async (employeeId: number, payload: AdjustScorePayload) => {
    const { data } = await axiosInstance.post(
      `${BASE}/admin/employees/${employeeId}/adjust/`,
      payload,
    );
    invalidate(KEY);
    return data;
  },

  invalidate: () => invalidate(KEY),
};
