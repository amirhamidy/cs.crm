export interface UserTask {
  id: number;
  title: string;
  description?: string;
  case: number;
  department: number;
  department_name?: string;
  current_step: number;
  current_step_name?: string;
  assigned_employee: number[];
  status: "in_progress" | "completed" | "sold" | "cancelled" | string;
  created_at?: string;
  completed_at?: string;
  updated_at?: string;
  attachments: unknown[];
}

export interface UserStage {
  id: number;
  name: string;
  order: number;
  color?: string;
}

export interface UserDepartment {
  id: number;
  name: string;
  accent?: string;
  stages: UserStage[];
}
