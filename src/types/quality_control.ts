export type QualityControlStatus = "pending" | "approved" | "rejected";

export interface ApiMe {
  id: number;
  username: string;
  phone_number?: string;
  type: number;
}

export interface ApiQualityControlItem {
  id: number;
  purchase_task_id: number;
  product_name: string;
  status: QualityControlStatus;
  status_display: string;
  note: string;
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

export interface ApiUser {
  id: number;
  username: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  type?: number;
  is_active?: boolean;
}

export interface QualityControlActionResponse {
  id?: number;
  quality_control_id?: number;
  purchase_task_id?: number;
  product_name?: string;
  status: QualityControlStatus;
  status_display?: string;
  note?: string;
  file?: string | null;
  checked_by?: number | null;
  checked_by_name?: string | null;
  checked_at?: string | null;
  created_at?: string;
}

export const QC_STATUS_META: Record<
  QualityControlStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "در انتظار بررسی",
    className: "bg-amber-500/10 text-amber-500",
  },
  approved: {
    label: "تایید شده",
    className: "bg-emerald-500/10 text-emerald-500",
  },
  rejected: { label: "رد شده", className: "bg-red-500/10 text-red-500" },
};
