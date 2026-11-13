import type { ContractStatus } from "@/types/contract";

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; className: string }> = {
  draft: { label: "پیش‌نویس", className: "bg-gray-500/10 text-gray-600 dark:text-gray-300" },
  pending: { label: "در انتظار امضا", className: "bg-amber-500/10 text-amber-600" },
  signed: { label: "امضا شده", className: "bg-emerald-500/10 text-emerald-600" },
  canceled: { label: "لغو شده", className: "bg-rose-500/10 text-rose-600" },
};

export const CONTRACT_FILTERS: Array<{ value: ContractStatus | ""; label: string }> = [
  { value: "", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "pending", label: "در انتظار امضا" },
  { value: "signed", label: "امضا شده" },
  { value: "canceled", label: "لغو شده" },
];

export const PAGE_SIZE = 12;

export function formatFaDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fa-IR");
}
