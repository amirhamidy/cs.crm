import type { CustomerStatus } from "./customer";



export interface RankedCustomer {
  rank: number;
  id: number;
  full_name: string;
  company_name: string;
  phone_number: string;
  status: CustomerStatus;
  status_display: string;
  
  avg_score: number | null;
  scores_count: number;
  comments_count: number;
  
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



export interface CustomerScore {
  id: number;
  created_by: number;
  score: number;
  reason: string;
  created_at: string;
}

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



export interface FeedProduct {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export type TradeType = "sale" | "purchase" | "brokerage";
export type SaleStatus = "registered" | "returned";
export type FreightStatus = "extra_freight" | "no_freight" | "";

export interface TradeOption {
  id: number;
  kind: "deal_type" | "load_type";
  name: string;
  is_active: boolean;
  order: number;
  uses_declared_weight: boolean;
  created_at: string;
}

export interface Trader {
  id: number;
  username?: string;
  full_name?: string;
  name?: string;
}

export interface Sale {
  id: number;
  
  trade_type: TradeType;
  trade_type_display: string;
  
  seller: number | null;
  buyer: number | null;
  
  seller_name: string;
  buyer_name: string;
  seller_company: string;
  buyer_company: string;
  
  summary_label: string;
  shortage_kg: number;
  spillage_kg: number;
  returned_kg: number;
  open_issues_count: number;
  attachments_count: number;
  case: number | null;
  case_title: string | null;
  product: number;
  product_name: string;
  quantity_kg: string;
  billed_quantity_kg: string | null;
  effective_quantity_kg: string;
  weight_difference_kg: string | null;
  buy_price: string | null;
  sell_price: string | null;
  total_buy_amount: string | null;
  total_sell_amount: string | null;
  loading_cost: string;
  weighbridge_cost: string;
  freight_cost: string;
  total_costs: string;
  profit: string | null;
  deal_type: number | null;
  deal_type_name: string | null;
  load_type: number | null;
  load_type_name: string | null;
  load_type_uses_declared_weight: boolean;
  freight_status: FreightStatus;
  freight_status_display: string;
  status: SaleStatus;
  status_display: string;
  returned_at: string | null;
  returned_by_name: string | null;
  return_note: string;
  trader: number | null;
  trader_name: string | null;
  created_by_name?: string | null;

  sale_date: string;
  sale_time: string;
  description: string;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface SalePayload {
  
  seller: number | null;
  buyer: number | null;
  product: number;
  quantity_kg: string;
  billed_quantity_kg?: string | null;
  buy_price?: string | null;
  sell_price?: string | null;
  loading_cost?: string;
  weighbridge_cost?: string;
  freight_cost?: string;
  deal_type?: number | null;
  load_type?: number | null;
  freight_status?: FreightStatus;
  trader?: number | null;
  sale_date: string;
  sale_time: string;
  case?: number | null;
  description?: string;
}

export interface SaleListParams {
  trade_type?: TradeType;
  status?: SaleStatus;
  trader?: number;
  deal_type?: number;
  load_type?: number;
  has_open_issues?: 1;
  
  customer?: number;
  seller?: number;
  buyer?: number;
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



export interface SaleAttachment {
  id: number;
  sale: number;
  title: string;
  original_name: string;
  size: number;
  uploaded_by: number;
  uploaded_by_username: string;
  created_at: string;
}



export type IssueType = "shortage" | "spillage" | "returned";
export type IssueStatus = "open" | "in_progress" | "resolved";

export interface LoadIssue {
  id: number;
  sale: number;
  sale_label: string;
  seller: number | null;
  buyer: number | null;
  product_name: string;
  sale_date: string;
  issue_type: IssueType;
  issue_type_display: string;
  quantity_kg: string;
  loss_amount: string;
  status: IssueStatus;
  status_display: string;
  issue_date: string;
  description: string;
  resolution_note: string;
  resolved_at: string | null;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface LoadIssuePayload {
  issue_type: IssueType;
  quantity_kg: string;
  issue_date?: string;
  description?: string;
  status?: IssueStatus;
  resolution_note?: string;
}



export interface SeasonalSupply {
  id: number;
  customer: number;
  customer_name: string;
  company_name: string;
  phone_number: string;
  product: number;
  product_name: string;
  
  start_month: number;
  end_month: number;
  expected_quantity_kg: string | null;
  notes: string;
  created_at: string;
}

export interface SeasonalSupplyPayload {
  customer: number;
  product: number;
  start_month: number;
  end_month: number;
  expected_quantity_kg?: string | null;
  notes?: string;
}

export interface SuggestedCustomer {
  id: number;
  full_name: string;
  company_name: string;
  phone_number: string;
  
  start_month?: number;
  end_month?: number;
  expected_quantity_kg?: number | null;
  notes?: string;
  
  last_purchase_date?: string;
  total_quantity_kg?: string;
  purchases_count?: number;
}

export interface SuggestionGroup {
  product: { id: number; name: string };
  customers: SuggestedCustomer[];
}

export interface SeasonalSuggestions {
  month: number;
  month_name: string;
  next_month: number;
  next_month_name: string;
  current: SuggestionGroup[];
  upcoming: SuggestionGroup[];
  from_history: SuggestionGroup[];
}



export interface MarketplaceAccount {
  id: number;
  customer: number;
  marketplace_name: string;
  username: string;
  has_password: boolean;
  url: string;
  notes: string;
  created_by_username: string;
  created_at: string;
  updated_at: string;
  last_revealed_at: string | null;
  last_revealed_by_username: string | null;
}

export interface MarketplaceAccountCreatePayload {
  marketplace_name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export interface MarketplaceAccountUpdatePayload {
  marketplace_name?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

export type MarketplaceAccountPayload = MarketplaceAccountUpdatePayload;
