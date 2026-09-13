import { TaskEmployeeRef } from "@/types/task";

export interface UserTask {
  id: number;
  title: string;
  description?: string;
  case: number;
  department: number;
  department_name?: string;
  current_step: number;
  current_step_name?: string;
  assigned_employee?:
    | number
    | number[]
    | TaskEmployeeRef
    | TaskEmployeeRef[]
    | null;
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

export interface EmployeeAPIItem {
  id: number;
  full_name: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentAPIItem {
  id: number;
  name: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentEmployeeAPIItem {
  id: number;
  employee: number;
  employee_name: string;
  department: number;
  department_name: string;
  created_at?: string;
  updated_at?: string;
}
