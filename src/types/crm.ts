import type { CustomerStatus } from "./customer";

/* ───────────── رتبه‌بندی مشتریان ───────────── */

export interface RankedCustomer {
  rank: number;
  id: number;
  full_name: string;
  company_name: string;
  phone_number: string;
  status: CustomerStatus;
  status_display: string;
  /** null = هنوز امتیازی ثبت نشده */
  avg_score: number | null;
  scores_count: number;
  comments_count: number;
  /** رشته‌ی عددی، مثل "2000.00" */
  total_sales: string;
  last_sale_date: string | null;
}

export type RankingOrdering =
  | "-avg_score"
  | "avg_score"
  | "-scores_count"
  | "-comments_count"
  | "-total_sales"
  | "-last_sale_date"
  | "full_name";

/* ───────────── نظرات ───────────── */

export interface CustomerComment {
  id: number;
  customer: number;
  text: string;
  created_by: number;
  created_by_name: string;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

/* ───────────── فروش ───────────── */

export interface FeedProduct {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: number;
  customer: number;
  customer_name: string;
  company_name: string;
  case: number | null;
  case_title: string | null;
  product: number;
  product_name: string;
  quantity_kg: string;
  unit_price: string;
  total_amount: string;
  /** YYYY-MM-DD میلادی */
  sale_date: string;
  description: string;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface SalePayload {
  customer: number;
  product: number;
  quantity_kg: string;
  unit_price: string;
  sale_date?: string;
  case?: number | null;
  description?: string;
}

export interface SaleListParams {
  customer?: number;
  product?: number;
  case?: number;
  date_from?: string;
  date_to?: string;
}

export interface TopProduct {
  id: number;
  name: string;
  quantity_kg: string;
  amount: string;
}

export interface TopCustomerRow {
  rank: number;
  customer_id: number;
  full_name: string;
  company_name: string;
  sales_count: number;
  total_quantity_kg: string;
  total_amount: string;
  last_sale_date: string | null;
  top_product: TopProduct | null;
}

export interface TopCustomersResponse {
  by: "amount" | "quantity";
  results: TopCustomerRow[];
}

export interface TopCustomersParams {
  by?: "amount" | "quantity";
  limit?: number;
  product?: number;
  date_from?: string;
  date_to?: string;
}

export interface CustomerSalesByProduct {
  product_id: number;
  product_name: string;
  sales_count: number;
  quantity_kg: string;
  amount: string;
}

export interface CustomerSalesSummary {
  customer_id: number;
  full_name: string;
  company_name: string;
  sales_count: number;
  total_quantity_kg: string;
  total_amount: string;
  first_sale_date: string | null;
  last_sale_date: string | null;
  top_product: CustomerSalesByProduct | null;
  by_product: CustomerSalesByProduct[];
}

/* ───────────── مسیر پرونده‌های مشتری ───────────── */

export interface PathPerson {
  id: number;
  full_name: string;
}

export interface PathStepLog {
  log_id: number;
  step_id: number | null;
  step_name: string | null;
  action: string;
  action_display: string;
  at: string;
  note: string;
  employees: PathPerson[];
}

export interface PathTask {
  id: number;
  title: string;
  status: string;
  status_display: string;
  department: { id: number; name: string } | null;
  current_step: { id: number; name: string } | null;
  assigned_employees: PathPerson[];
  created_at: string | null;
  completed_at: string | null;
  visited_steps: string[];
  path: PathStepLog[];
}

export interface PathCase {
  id: number;
  title: string;
  active: boolean;
  /** in_progress | sold | completed | cancelled | no_tasks */
  status: string;
  created_at: string | null;
  tasks: PathTask[];
  sales_count: number;
  sales_total: string;
}

export interface PathTimelineEvent {
  at: string;
  type: string;
  case_id: number;
  task_id: number | null;
  title: string;
  detail: string | null;
}

export interface CustomerPath {
  customer: {
    id: number;
    full_name: string;
    company_name: string;
    status: CustomerStatus;
    status_display: string;
  };
  summary: {
    cases_count: number;
    active_cases: number;
    tasks_count: number;
    in_progress_tasks: number;
    sold_tasks: number;
    cancelled_tasks: number;
  };
  cases: PathCase[];
  timeline: PathTimelineEvent[];
}
