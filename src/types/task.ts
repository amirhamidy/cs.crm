import type { CaseItem } from "./case";
import type { Customer } from "./customer";
import type { Department } from "./department";
import type { Employee } from "./employee";

export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";

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
  assigned_employee?: TaskEmployeeRef | number | null;
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

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

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
  onEdit?: (task: TaskItem) => void;
  onDelete?: (taskId: number) => void;
  deleting?: boolean;
}

export interface TaskListProps {
  tasks: TaskItem[];
  onEdit?: (task: TaskItem) => void;
  onDelete?: (taskId: number) => void;
  loading?: boolean;
  deletingTaskId?: number | null;
}

export interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}
