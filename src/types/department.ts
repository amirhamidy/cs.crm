import type { Employee } from "./employee";

export interface DepartmentStep {
  id: number;
  name: string;
  description?: string;
  order?: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  accent?: string;
  steps?: DepartmentStep[];
  employees?: Employee[];
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentSelectProps {
  departments: Department[];
  value: number | null;
  onChange: (value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}
