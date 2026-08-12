export interface CaseItem {
  id: number;
  title: string;
  description?: string;
  customer?: number | { id: number; full_name?: string } | null;
  created_at?: string;
  updated_at?: string;
  status?: string;
}
