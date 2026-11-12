import type { Employee } from "./employee";

export interface DepartmentStep {
  id: number;
  name: string;
  description?: string | null;
  order?: number;
  department?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  accent?: string;
  order?: number;
  steps?: DepartmentStep[];
  employees?: Employee[];
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentEmployee {
  id: number;
  employee: number;
  employee_name: string;
  department: number;
  department_name: string;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentSelectProps {
  departments: Department[];
  value: number | null;
  onChange: (value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}
