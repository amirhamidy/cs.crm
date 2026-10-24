export interface InternalTaskEmployeeRef {
  id: number;
  username?: string;
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

export type InternalTaskStatus =
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface InternalTaskDeadline {
  id: number;
  started_at: string | null;
  deadline: string | null;
}

export interface InternalTaskItem {
  id: number;
  title: string;
  description: string;
  status: InternalTaskStatus;
  active?: boolean;
  assigned_to: InternalTaskEmployeeRef[];
  deadline: InternalTaskDeadline | string | null;
  started_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  attachments: InternalTaskAttachment[];
}

export interface InternalTaskArchiveItem {
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

export interface InternalTaskRoutineItem {
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

export interface InternalEmployeeItem {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface InternalTaskDeadlinePayload {
  started_at: string;
  deadline: string;
}

export interface CreateInternalTaskPayload {
  title: string;
  description: string;
  assigned_to: number[];
  created_by: number;
}

export interface CreateInternalTaskRoutinePayload {
  task: number;
  start_at: string;
  interval_days: number;
}

export type UpdateInternalTaskRoutinePayload = Partial<{
  start_at: string;
  interval_days: number;
  is_active: boolean;
}>;
