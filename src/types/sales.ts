/**
 * Sales domain types.
 * Money and quantity values arrive from the API as strings (e.g. "2000.00").
 * Convert with Number() before doing arithmetic; never compute totals on the client.
 */

export interface Product {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductPayload {
  name: string;
  is_active?: boolean;
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
  sale_date: string; // YYYY-MM-DD (Gregorian)
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
  sale_date?: string; // YYYY-MM-DD, defaults to today on the server
  case?: number | null;
  description?: string;
}

export interface SaleListParams {
  page?: number;
  page_size?: number;
  customer?: number;
  product?: number;
  case?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export type TopCustomersBy = "amount" | "quantity";

export interface TopCustomersParams {
  by?: TopCustomersBy;
  limit?: number;
  product?: number;
  date_from?: string;
  date_to?: string;
}

export interface TopCustomerProduct {
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
  top_product: TopCustomerProduct | null;
}

export interface TopCustomersResponse {
  by: TopCustomersBy;
  results: TopCustomerRow[];
}

export interface CustomerSummaryProduct {
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
  top_product: CustomerSummaryProduct | null;
  by_product: CustomerSummaryProduct[];
}

export interface CustomerSummaryParams {
  date_from?: string;
  date_to?: string;
}
