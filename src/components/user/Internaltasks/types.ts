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

export type InternalTaskStatus = "in_progress" | "completed" | "cancelled";

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

export interface InternalTaskRoutine {
  id: number;
  task: number;
  start_at: string;
  interval_days: number;
  last_run_at: string | null;
  next_run_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListItem {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface InternalTaskState extends InternalTask {
  created_by_id: number;
}

export interface InternalTaskArchive {
  id: number;
  task_id: number;
  title: string;
  status: "completed" | "cancelled";
  created_by_id: number;
  created_by_username: string;
  created_by_full_name: string;
  final_action_by_id: number;
  final_action_by_username: string;
  final_action_by_full_name: string;
  task_created_at: string;
  task_updated_at: string;
  completed_at: string | null;
  archived_at: string;
}
