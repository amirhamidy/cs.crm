export interface DepartmentEmployee {
  id: number;
  employee?: number;
  department: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  user_detail?: {
    id?: number;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface EmployeeSelectProps {
  employees: DepartmentEmployee[];
  value: number | null;
  onChange: (value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}
