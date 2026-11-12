export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  department?: Department;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  company_name?: string; 
  created_at: string;
  created_by_username: string;
}

export type CaseStatus = "sold" | "in_progress" | "completed" | "cancelled";

export interface CaseItem {
  id: number;
  title: string;
  description?: string;
  customer?: number | Pick<Customer, "id" | "name"> | null;
  status?: CaseStatus;
  created_at?: string;
  updated_at?: string;
  customerName?: string;
  customer_name?: string;

  department?: number | string | null;
  departmentName?: string;
  department_name?: string;

  assigned_to?: number | string | null;
  assignee?: number | string | null;
  responsible?: number | string | null;
  assignedToName?: string;
  assigned_to_name?: string;

  [key: string]: unknown;
}

export interface Case {
  id: number;
  title: string;
  description?: string;
  customer: Customer;
  department?: Department;
  assigned_to?: Employee;
  status: CaseStatus | string;
  created_at: string;
  updated_at?: string;
}

export interface CaseListProps {
  cases: CaseItem[];
  selectedCaseId?: number | null;
  onSelect: (item: CaseItem) => void;
  onCreate: () => void;
  onEdit: (item: CaseItem) => void;
  onDelete: (item: CaseItem) => void;
  loading?: boolean;
  deletingCaseId?: number | null;
}

export interface CaseFormData {
  title: string;
  description: string;
}

export interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CaseItem | null;
  onSuccess: (updatedCase: CaseItem) => void;
}
