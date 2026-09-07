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

export interface ApiUser {
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export interface QualityControlActionResponse {
  detail: string;
  quality_control_id: number;
  warehouse_task_id?: number;
  purchase_task_id?: number;
  status: QualityControlStatus;
  current_step?: string;
}

export const QC_STATUS_META: Record<
  QualityControlStatus,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  pending: {
    label: "در انتظار بررسی",
    description: "این مورد هنوز توسط کنترل کیفی بررسی نشده است",
    icon: "pending",
  },
  approved: {
    label: "تایید شده",
    description: "کنترل کیفی این مورد را تایید کرده است",
    icon: "approved",
  },
  rejected: {
    label: "رد شده",
    description: "این مورد توسط کنترل کیفی رد شده است",
    icon: "rejected",
  },
};
