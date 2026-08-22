
export interface EmployeeUserDetail {
  id?: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface EmployeeDepartment {
  id: number;
  name?: string;
}

export interface Employee {
  id: number;
  employee?: number;
  name: string;
  department?: number | EmployeeDepartment | null;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  position?: string;
  role?: string;
  user_detail?: EmployeeUserDetail;
}

export interface DepartmentEmployee extends Employee {
  department: number;
}

export interface EmployeeSelectProps {
  employees: DepartmentEmployee[];
  value: number | null;
  onChange: (value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}
