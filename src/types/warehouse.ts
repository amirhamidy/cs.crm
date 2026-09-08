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

export type WarehouseTaskStatus = "pending" | "in_progress" | "completed";

export type OrderTaskStatus = "in_progress" | "completed" | "cancelled";

export interface ApiCategory {
  id: number;
  name: string;
}

export interface ApiUnitData {
  quantity_per_unit: number;
}

export interface ApiWarehouseStaff {
  id: number;
  employee?: number;
  employee_id: number;
  full_name: string;
  is_active?: boolean;
  joined_at?: string;
  code?: string | number;
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
    purchase_task_id: number | null;
    quality_control_id: number | null;
    product: number | null;
    product_name: string | null;
    expected_quantity: number;
    received_quantity: number | null;
    assigned_to: number | null;
    assigned_to_name: string | null;
    status: "pending" | "in_progress" | "completed" | "cancelled";
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

export interface ApiTask {
  id: number;
  title: string;
  case: number;
  department: number;
  department_name: string;
  current_step: number;
  current_step_name: string;
  assigned_employee: number[];
  status: string;
  created_at: string;
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

export interface ApiOrderTaskAttachment {
  id: number;
  performed_by: ApiOrderTaskPerformer;
  note: string;
  file: string;
  created_at: string;
}

export interface ApiOrderTask {
  id: number;
  task: number;
  product: number;
  quantity: number;
  completed_quantity: number;
  product_sale_price: string;
  title: string;
  description: string;
  case: ApiOrderTaskCase | null;
  customer: {
    id: number;
    full_name: string;
  } | null;
  department: ApiOrderTaskDepartment | null;
  current_step: ApiOrderTaskStep | null;
  assigned_employee: ApiOrderTaskEmployeeRef[];
  created_by: ApiOrderTaskCreatedBy | null;
  note: string | null;
  file: string | null;
  performed_by: ApiOrderTaskPerformer | null;
  status: OrderTaskStatus;
  status_display: string;
  deadline: string | null;
  attachments: ApiOrderTaskAttachment[];
  created_at: string;
}

export interface ApiOrderTaskDeadline {
  id: number;
  order_task: number;
  started_at: string;
  deadline: string;
}

export interface CreateOrderTaskPayload {
  task_id: number;
  product_id: number;
  quantity: number;
  note?: string;
  file?: File;
  started_at?: string;
  deadline?: string;
}

export interface UpdateOrderTaskPayload {
  performed_by: number;
  status: OrderTaskStatus;
  completed_quantity?: number;
  note?: string;
  file?: File;
}

export function unitDataKey(unitType: UnitType): keyof ApiProductInitDraft {
  return `${unitType}_unit_data` as keyof ApiProductInitDraft;
}

export function unitDetailKey(unitType: UnitType): keyof ApiProduct {
  return `${unitType}_unit_detail` as keyof ApiProduct;
}
export interface ApiUnitDetail {
    id: number;
    quantity_per_unit: number;
}

export interface ApiCategory {
    id: number;
    name: string;
}

export interface ApiProduct {
    id: number;
    name: string;
    sale_price: string | number;
    category: number;
    category_detail?: ApiCategory | null;
    unit_type: "dimension" | "weight" | "volume" | "area" | "count";
    count_unit?: number | null;
    count_unit_detail?: ApiUnitDetail | null;
    weight_unit_detail?: ApiUnitDetail | null;
    volume_unit_detail?: ApiUnitDetail | null;
    area_unit_detail?: ApiUnitDetail | null;
    dimension_unit_detail?: ApiUnitDetail | null;
    created_at: string;
    updated_at: string;
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
    performed_by: {
        id: number;
        full_name: string;
    } | null;
    created_at: string;
    updated_at: string;
}

