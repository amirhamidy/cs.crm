import type { CustomerStatus } from "@/types/customer";

/** Customer ranking row — field names exactly as in the API docs (section 2). */
export interface RankedCustomer {
  id: number;
  rank: number;
  full_name: string;
  phone_number: string;
  company_name: string;
  status: CustomerStatus;
  status_display: string;
  avg_score: number | string | null;
  scores_count: number;
  comments_count: number;
  total_sales: string;
  last_sale_date: string | null;
}

export type RankingOrderingField =
  | "avg_score" | "scores_count" | "comments_count"
  | "total_sales" | "last_sale_date" | "full_name" | "created_at";

export type RankingOrdering = RankingOrderingField | `-${RankingOrderingField}`;

export interface RankingParams {
  page?: number;
  page_size?: number;
  ordering?: RankingOrdering;
  min_score?: number;
  max_score?: number;
  rated?: boolean;
  status?: CustomerStatus;
  search?: string;
}
