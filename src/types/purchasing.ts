export interface ApiPurchasingEmployee {
  id: number;
  employee: number;
  employee_name: string;
  is_active: boolean;
  joined_at: string;
}

export interface ApiPurchasingStepEmployeeDetail {
  id: number;
  employee_id: number;
  full_name: string;
  is_active: boolean;
}

export interface ApiPurchasingStep {
  id: number;
  title: string;
  description: string;
  order: number;
  employees: number[];
  employees_detail: ApiPurchasingStepEmployeeDetail[];
}

export type PurchasingTaskStatus = "pending" | "in_progress" | "completed";

export interface ApiPurchasingTask {
  id: number;
  product: number;
  product_name: string;
  process_step: number;
  process_step_title: string;
  process_step_order: number;
  minimum_stock: number;
  maximum_stock: number;
  quantity_after: number;
  purchase_quantity: number;
  status: PurchasingTaskStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface ApiTaskAttachment {
  id: number;
  task: number;
  type: string;
  type_display: string;
  process_step: number | null;
  process_step_order: number | null;
  note: string | null;
  file: string | null;
  file_url: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export const PURCHASING_TASK_STATUS_META: Record<
  PurchasingTaskStatus,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  pending: {
    label: "در انتظار",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
  },
  in_progress: {
    label: "در حال انجام",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.10)",
  },
  completed: {
    label: "تکمیل شده",
    color: "#10b981",
    bg: "rgba(16,185,129,0.10)",
  },
};
