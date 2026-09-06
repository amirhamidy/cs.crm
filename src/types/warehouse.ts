export type UnitType = "dimension" | "weight" | "volume" | "area" | "count";

export const UNIT_TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "count", label: "تعداد" },
  { value: "weight", label: "وزن" },
  { value: "volume", label: "حجم" },
  { value: "area", label: "مساحت" },
  { value: "dimension", label: "ابعاد" },
];

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  count: "تعداد",
  weight: "وزن",
  volume: "حجم",
  area: "مساحت",
  dimension: "ابعاد",
};

export type StockOutReason = "sale" | "damage" | "transfer" | "other";

export const STOCK_OUT_REASON_OPTIONS: {
  value: StockOutReason;
  label: string;
}[] = [
  { value: "sale", label: "فروش" },
  { value: "damage", label: "خرابی / ضایعات" },
  { value: "transfer", label: "انتقال" },
  { value: "other", label: "سایر" },
];

export interface ApiCategory {
  id: number;
  name: string;
}

export interface ApiUnitData {
  quantity_per_unit: number;
}

export interface ApiWarehouseStaff {
  id: number;
  employee: number;
  employee_id: number;
  full_name: string;
  is_active: boolean;
  joined_at: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  sale_price: string | number;
  category: number;
  category_detail?: ApiCategory | null;
  unit_type: UnitType;
  count_unit?: number | null;
  count_unit_detail?: (ApiUnitData & { id: number }) | null;
  weight_unit_detail?: (ApiUnitData & { id: number }) | null;
  volume_unit_detail?: (ApiUnitData & { id: number }) | null;
  area_unit_detail?: (ApiUnitData & { id: number }) | null;
  dimension_unit_detail?: (ApiUnitData & { id: number }) | null;
  created_at: string;
  updated_at: string;
}

export interface ApiProductInitDraft {
  name: string;
  sale_price: number | string;
  category: number;
  unit_type: UnitType;
  count_unit_data?: ApiUnitData;
  weight_unit_data?: ApiUnitData;
  volume_unit_data?: ApiUnitData;
  area_unit_data?: ApiUnitData;
  dimension_unit_data?: ApiUnitData;
}

export interface ApiStockInfo {
  id: number;
  product: number;
  product_name: string;
  initial_quantity: number;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_label: string;
  performed_by: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface ApiStockTransaction {
  id: number;
  product: number;
  product_name: string;
  performed_by: number;
  performed_by_name: string;
  transaction_type: "stock_in" | "stock_out" | "initial";
  transaction_type_display: string;
  quantity_changed: number;
  quantity_before: number;
  quantity_after: number;
  minimum_stock: number;
  maximum_stock: number;
  stock_out_reason: StockOutReason | null;
  stock_out_reason_display: string | null;
  note: string | null;
  transaction_date: string;
  created_at: string;
}

export interface ApiWarehouseTask {
  id: number;
  purchase_task_id: number;
  quality_control_id: number;
  product: number;
  product_name: string;
  expected_quantity: number;
  received_quantity: number | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  status: "pending" | "in_progress" | "completed";
  status_display: string;
  note: string | null;
  file: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface ApiWarehouseTaskCompleteResponse {
  detail: string;
  warehouse_task: ApiWarehouseTask;
  stock_transaction_id: number;
}

export interface ApiOrderTaskCase {
  id: number;
  title: string;
}

export interface ApiOrderTaskDepartment {
  id: number;
  name: string;
}

export interface ApiOrderTaskStep {
  id: number;
  name: string;
}

export interface ApiOrderTaskEmployeeRef {
  id: number;
  full_name: string;
}

export interface ApiOrderTaskCreatedBy {
  id: number;
  username: string;
}

export interface ApiOrderTaskPerformer {
  id: number;
  employee_id: number;
  full_name: string;
}

export interface ApiOrderTask {
  id: number;
  task: number;
  title: string;
  description: string;
  case: ApiOrderTaskCase | null;
  department: ApiOrderTaskDepartment | null;
  current_step: ApiOrderTaskStep | null;
  assigned_employee: ApiOrderTaskEmployeeRef[];
  created_by: ApiOrderTaskCreatedBy | null;
  note: string | null;
  file: string | null;
  performed_by: ApiOrderTaskPerformer | null;
  status: string;
  status_display: string;
  deadline: string | null;
  attachments: unknown[];
  created_at: string;
}

export interface ApiOrderTaskDeadline {
  id: number;
  order_task: number;
  started_at: string;
  deadline: string;
}

export function unitDataKey(unitType: UnitType): keyof ApiProductInitDraft {
  return `${unitType}_unit_data` as keyof ApiProductInitDraft;
}

export function unitDetailKey(unitType: UnitType): keyof ApiProduct {
  return `${unitType}_unit_detail` as keyof ApiProduct;
}
