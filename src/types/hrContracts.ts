export type ContractStatus = "draft" | "pending" | "completed" | "cancelled";

export interface HrPerson {
  id: number;
  name: string;
  phone_number: string;
}

export interface HrResponsible {
  responsible: HrPerson | null;
  is_me: boolean;
  updated_at: string | null;
}

export interface HrSummary {
  is_admin: boolean;
  is_responsible: boolean;
  can_manage: boolean;
  responsible: HrPerson | null;
  departments: { id: number; name: string; is_manager?: boolean }[];
  pending_signatures: number;
  visible_contracts: number;
}

export interface HrContractListItem {
  id: number;
  title: string;
  department: number;
  department_name: string;
  status: ContractStatus;
  created_by: number;
  created_by_username: string;
  signatures_count: number;
  signed_count: number;
  my_signature: number | null;
  i_signed: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface HrSignature {
  id: number;
  contract?: number;
  contract_title?: string;
  user?: number;
  user_name?: string;
  is_signed: boolean;
  signed_at?: string | null;
  method?: string | null;
  signature_image?: string | null;
}

export interface HrContractDetail extends HrContractListItem {
  body?: string;
  description?: string;
  signatures?: HrSignature[];
  [key: string]: unknown;
}

export interface HrContractPayload {
  title: string;
  department: number;
  body?: string;
}
