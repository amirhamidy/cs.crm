import axiosInstance from "@/lib/axiosInstance";
import { cleanParams, toPaginated } from "@/lib/api/_core";
import type { Paginated } from "@/types/pagination";
import { toJalali, toPersianDigits } from "@/lib/jalali";

const ROOT = "/hr/api/v1";

export type PeriodType = "daily" | "monthly";
export type LeaveType = "paid" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface HRPerson {
  id: number;
  name?: string;
  title?: string;
}

export interface HRSalary {
  id?: number;
  period_type: PeriodType;
  amount: string;
  effective_from: string;
  effective_to?: string | null;
  note?: string;
}

export interface HRContract {
  id: number;
  document: number | { id: number; title?: string } | null;
  kind: string;
  start_date: string;
  end_date: string | null;
  is_current?: boolean;
}

export interface HRProfile {
  id: number;
  person: HRPerson | number;
  employee: number | null;
  hire_date: string | null;
  daily_work_hours: string;
  overtime_rate_per_hour: string;
  legal_monthly_hours: string | null;
  current_salary: HRSalary | null;
  current_contract: HRContract | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HRProfilePayload {
  person?: number;
  employee?: number | null;
  hire_date?: string | null;
  daily_work_hours?: string;
  overtime_rate_per_hour?: string;
  legal_monthly_hours?: string | null;
  is_active?: boolean;
}

export interface HRLeave {
  id: number;
  profile: number | { id: number; person?: HRPerson | number };
  profile_name?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  hours: string | null;
  reason: string;
  status: LeaveStatus;
  approved_by?: number | null;
}

export interface HRLeavePayload {
  profile: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  hours?: string | null;
  reason?: string;
}

export interface HROvertime {
  id: number;
  profile: number | { id: number };
  date: string;
  hours: string;
  rate: string;
  amount: string;
}

export type WasteStatus = "pending" | "approved" | "waived";
export type WasteGroup = "day" | "week" | "month" | "year";
export interface WasteDeduction {
  id: number; production_log: number; employee: number; employee_name: string; document_id: number | null;
  date: string; machine_name: string; product_name: string; waste_cause_name: string; log_note: string;
  waste_qty: number; expected_waste: string; excess_qty: string; unit_price: string;
  calculated_amount: string; deduction_amount: string; is_manual: boolean;
  status: WasteStatus; status_display: string; needs_review: boolean; note: string; explanation: string;
}
export interface WasteBucket {
  count: number; waste_qty: number; excess_qty: string; calculated_amount: string;
  approved_amount: string; pending_amount: string; waived_amount: string; needs_review: number;
}
export interface WasteSummaryPeriod extends WasteBucket {
  key: string; label: string; date_from: string; date_to: string;
  base_salary?: string | null; net_after_waste?: string | null;
  expected_work_hours?: string | null; production_work_hours?: string | null;
  approved_work_hours?: string | null; work_hours_shortage?: string | null;
  work_hours_review_status?: WorkHoursStatus | null; work_hours_deduction?: string | null;
  net_after_work_hours?: string | null; net_after_work_hours_and_waste?: string | null;
}
export type WorkHoursStatus = "pending" | "approved" | "rejected";
export interface WorkHoursReview {
  id: number; document: number; employee_id: number; employee_name: string; month: string;
  expected_hours: string; production_hours: string; approved_hours: string | null; shortage_hours: string;
  status: WorkHoursStatus; status_display: string; note: string;
  decided_by: number | null; decided_at: string | null; created_at: string; updated_at: string;
}
export interface WasteSummary {
  group_by: WasteGroup; date_from: string; date_to: string; employee: number | null;
  employee_name: string | null; totals: WasteBucket; periods: WasteSummaryPeriod[];
}
export type WasteSummaryParams = { group_by: WasteGroup } & (
  | { date_from: string; date_to: string } | { year: number; month?: number });
type Q = Record<string, string | number | boolean | undefined | null>;

async function page<T>(url: string, params: Q = {}, signal?: AbortSignal): Promise<Paginated<T>> {
  const r = await axiosInstance.get<unknown>(url, { params: cleanParams(params), signal });
  return toPaginated<T>(r.data);
}

export const hrApi = {
  profiles: {
    list: (p: Q = {}, s?: AbortSignal) => page<HRProfile>(`${ROOT}/profile/`, p, s),
    get: async (id: number) => (await axiosInstance.get<HRProfile>(`${ROOT}/profile/${id}/`)).data,
    create: async (d: HRProfilePayload) => (await axiosInstance.post<HRProfile>(`${ROOT}/profile/`, d)).data,
    update: async (id: number, d: HRProfilePayload) =>
      (await axiosInstance.patch<HRProfile>(`${ROOT}/profile/${id}/`, d)).data,
    remove: (id: number) => axiosInstance.delete(`${ROOT}/profile/${id}/`),
  },
  salary: {
    list: (id: number) => page<HRSalary>(`${ROOT}/profile/${id}/salary/`, { page_size: 100 }),
    create: async (id: number, d: Pick<HRSalary, "period_type" | "amount" | "effective_from" | "note">) =>
      (await axiosInstance.post<HRSalary>(`${ROOT}/profile/${id}/salary/`, d)).data,
  },
  contracts: {
    list: (id: number) => page<HRContract>(`${ROOT}/profile/${id}/contract/`, { page_size: 100 }),
    create: async (
      id: number,
      d: { document: number; kind: string; start_date: string; end_date?: string | null; is_current?: boolean },
    ) => (await axiosInstance.post<HRContract>(`${ROOT}/profile/${id}/contract/`, d)).data,
  },
  workHours: {
    list: (documentId: number, p: Q = {}, s?: AbortSignal) => page<WorkHoursReview>(`/document/api/v1/${documentId}/work-hours/`, p, s),
    create: async (documentId: number, month: string) =>
      (await axiosInstance.post<WorkHoursReview>(`/document/api/v1/${documentId}/work-hours/`, { month })).data,
    decide: async (id: number, d: { status: "approved" | "rejected"; note?: string }) =>
      (await axiosInstance.patch<WorkHoursReview>(`/document/api/v1/work-hours/${id}/`, d)).data,
  },
  wasteDeductions: {
    list: (p: Q = {}, s?: AbortSignal) => page<WasteDeduction>(`/document/api/v1/waste-deductions/`, p, s),
    update: async (id: number, d: { status?: WasteStatus; deduction_amount?: string; note?: string }) =>
      (await axiosInstance.patch<WasteDeduction>(`/document/api/v1/waste-deductions/${id}/`, d)).data,
    summary: async (documentId: number, p: WasteSummaryParams) =>
      (await axiosInstance.get<WasteSummary>(`/document/api/v1/${documentId}/waste-deductions/summary/`, { params: p })).data,
  },
  leaves: {
    list: (p: Q = {}, s?: AbortSignal) => page<HRLeave>(`${ROOT}/leave/`, p, s),
    create: async (d: HRLeavePayload) => (await axiosInstance.post<HRLeave>(`${ROOT}/leave/`, d)).data,
    update: async (id: number, d: Partial<HRLeavePayload>) =>
      (await axiosInstance.patch<HRLeave>(`${ROOT}/leave/${id}/`, d)).data,
    remove: (id: number) => axiosInstance.delete(`${ROOT}/leave/${id}/`),
    approve: (id: number) => axiosInstance.post(`${ROOT}/leave/${id}/approve/`),
    reject: (id: number) => axiosInstance.post(`${ROOT}/leave/${id}/reject/`),
  },
  overtime: {
    list: (p: Q = {}, s?: AbortSignal) => page<HROvertime>(`${ROOT}/overtime/`, p, s),
    create: async (d: { profile: number; date: string; hours: string }) =>
      (await axiosInstance.post<HROvertime>(`${ROOT}/overtime/`, d)).data,
  },
};

/* ------------------------------- helpers -------------------------------- */

export function personOf(p: HRProfile["person"] | undefined | null): { id: number | null; name: string } {
  if (p == null) return { id: null, name: "—" };
  if (typeof p === "number") return { id: p, name: `شخص ${p}` };
  return { id: p.id, name: p.name || p.title || `شخص ${p.id}` };
}

export function profileName(l: HRLeave): string {
  if (l.profile_name) return l.profile_name;
  if (typeof l.profile === "object" && l.profile) return personOf(l.profile.person).name;
  return `پرونده ${l.profile}`;
}

export function profileIdOf(l: HRLeave): number {
  return typeof l.profile === "object" ? l.profile.id : l.profile;
}

export function errorMessage(err: unknown, fallback = "خطا در انجام عملیات"): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data.length < 200 ? data : fallback;
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(data);
  return out.length ? out.join(" • ") : fallback;
}

const fa = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  const [jy, jm, jd] = toJalali(+m[1], +m[2], +m[3]);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`);
}

export function fmtNum(v?: string | number | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return fa(String(v));
  return fa(n.toLocaleString("en-US", { maximumFractionDigits: 2 })).replace(/\./g, "٫");
}

export const PERIOD_LABEL: Record<PeriodType, string> = { daily: "روزانه", monthly: "ماهانه" };
export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = { paid: "با حقوق", unpaid: "بدون حقوق" };
export const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "در انتظار تأیید",
  approved: "تأیید شده",
  rejected: "رد شده",
};
export const STATUS_CLASS: Record<LeaveStatus, string> = {
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};
export const CONTRACT_KINDS: Record<string, string> = {
  permanent: "دائم",
  temporary: "موقت",
  project: "پروژه‌ای",
};
