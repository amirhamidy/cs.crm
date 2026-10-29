import type { CaseItem } from "./case";
import type { Customer } from "./customer";
import type { Department } from "./department";
import type { Employee } from "./employee";

export type TaskStatus = "cancelled" | "in_progress" | "completed" | "sold";

export interface TaskEmployeeRef {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TaskDepartmentRef {
  id: number;
  name?: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  case?: CaseItem | number | null;
  department?: TaskDepartmentRef | number | null;
  assigned_employee?:
    | TaskEmployeeRef
    | TaskEmployeeRef[]
    | number
    | number[]
    | null;

  files?: string[];
  created_at?: string;
  updated_at?: string;
  status?: TaskStatus | string;
}

export type Task = TaskItem;

export interface TaskLog {
  id: number;
  task: number;
  action: string;
  from_status?: string;
  to_status?: string;
  created_at?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  case?: number | null;
  department?: number | null;
  assigned_employee?: number | null;
  status?: TaskStatus;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;


export interface TransferTaskPayload {
  
  department: number;
  
  note?: string;
  
  files?: File[];
}


export interface TransferTaskResponse {
  id: number;
  title: string;
  description?: string;
  case: number | null;
  department: number;
  department_name?: string;
  
  name_department?: string;
  current_step: number;
  
  name_step_current?: string;
  current_step_name?: string;
  assigned_employee: number[];
  status: TaskStatus | string;
  active?: boolean;
  created_at?: string;
  completed_at?: string | null;
  updated_at?: string;
  attachments?: unknown[];
}


export type TransferTaskErrorBody =
  | { department: string[] }
  | { detail: string }
  | string[];

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditTaskModalProps {
  task: TaskItem | null;
  customers: Customer[];
  departments: Department[];
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

export interface TaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: number) => Promise<boolean> | Promise<void> | void;
  deleting?: boolean;
  index?: number;
  onUpdated?: (task: TaskItem) => void;
  employees?: Employee[];
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
}

export interface TaskListProps {
  tasks: TaskItem[];
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: number) => Promise<boolean> | Promise<void> | void;
  loading?: boolean;
  deletingTaskId?: number | null;
}

export interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}
