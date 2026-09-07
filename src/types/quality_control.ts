export type QualityControlStatus = "pending" | "approved" | "rejected";

export interface ApiQualityControlItem {
  id: number;
  purchase_task_id: number;
  product_name: string;
  status: QualityControlStatus;
  status_display: string;
  note: string | null;
  file: string | null;
  checked_by: number | null;
  checked_by_name: string | null;
  created_at: string;
  checked_at: string | null;
}

export interface ApiQualityControlEmployee {
  id: number;
  user: number;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const QC_STATUS_META: Record<
  QualityControlStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "در انتظار بررسی",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  approved: {
    label: "تایید شده",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
  rejected: { label: "رد شده", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};
