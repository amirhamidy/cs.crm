import { TaskEmployeeRef } from "@/types/task";

export interface Stage {
  id: string;
  apiId: number;
  name: string;
  color: string;
  order: number;
  description?: string;
}



export interface StageAPIItem {
  id: number;
  department: number;
  name: string;
  description?: string;
  order: number;
}

export interface Employee {
  id: string;
  apiId: number;
  assignmentId?: number;
  name: string;
  role: string;
  avatar?: string;
}

export interface Department {
  id: string;
  apiId: number;
  name: string;
  description: string;
  accent: string;
  stages: Stage[];
  employees: Employee[];
  createdAt: string;
  order?: number;
}

export interface DepartmentAPIItem {
  id: number;
  name: string;
  order: number;
}

export interface EmployeeAPIItem {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentEmployeeAPIItem {
  id: number;
  employee: number;
  employee_name: string;
  department: number;
  department_name: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
    id: string | number;
    title?: string;
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    department?: string | number | { id: string | number };
    current_step?: string | number | { id: string | number };
    due_date?: string;
    created_at?: string;
    [key: string]: unknown;
    assigned_employee?: number | TaskEmployeeRef | null;
}

