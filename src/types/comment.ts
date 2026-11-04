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
