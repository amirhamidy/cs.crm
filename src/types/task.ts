import type { CaseItem } from "./case";

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  case?: CaseItem | number;
  department?: number;
  assigned_employee?: number;
  files?: string[];
  created_at?: string;
  updated_at?: string;
  status?: string;
}

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
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
