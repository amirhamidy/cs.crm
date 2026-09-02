export type GlobalSearchResultType =
  | "customer"
  | "employee"
  | "department"
  | "case"
  | "task"
  | "internal_task"
  | "note"
  | "calendar"
  | string;

export interface GlobalSearchApiResult {
  type: GlobalSearchResultType;
  id: number | string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  score?: number | null;
  url?: string | null;
}

export interface GlobalSearchApiResponse {
  query: string;
  total: number;
  results: GlobalSearchApiResult[];
}

export interface GlobalSearchResult extends GlobalSearchApiResult {
  typeLabel: string;
  href: string;
}
