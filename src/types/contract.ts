export type ContractStatus = "draft" | "pending" | "signed" | "canceled";

export interface Contract {
  id: number;
  title: string;
  content: string;
  status: ContractStatus;
  employee: number;
  employee_name?: string;
  department?: number | null;
  department_name?: string | null;
  employee_signature?: string | null;
  employer_signature?: string | null;
  signed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContractPayload {
  title: string;
  content: string;
  employee: number;
  department?: number | null;
}

export interface ContractListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ContractStatus | "";
}

export interface ContractSignature {
  id: number;
  contract?: number | { id: number };
  status?: string;
  signature?: string | null;
}
