export interface EmployeeRef {
  id: number;
  full_name: string;
}

export interface InternalTaskAttachment {
  id: number;
  file: string;
  original_file_name: string;
  note: string;
  uploaded_by: number;
  created_at: string;
}

export type InternalTaskStatus = "in_progress" | "completed" | "cancelled" ;

export interface InternalTask {
  id: number;
  title: string;
  description: string;
  status: InternalTaskStatus;
  assigned_to: EmployeeRef[];
  deadline: string | null;
  started_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  attachments: InternalTaskAttachment[];
}

export interface EmployeeListItem {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}
