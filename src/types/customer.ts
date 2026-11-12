export type CustomerStatus = 1 | 2;

export const CUSTOMER_STATUS = {
  POTENTIAL: 1,
  ACTIVE: 2,
} as const;

export interface CustomerSummary {
  id: number;
  full_name: string;
  phone_number: string;
  company_name: string;
  status: CustomerStatus;
  status_display: string;
  created_by_username: string;
  created_at: string;
}

export interface CustomerDetail extends CustomerSummary {
  job_title: string;
  address: string;
  source: string;
  description: string;
  created_by: number | null;
  updated_at: string;
}

export interface Customer
  extends CustomerSummary,
    Partial<Omit<CustomerDetail, keyof CustomerSummary>> {
  name?: string;
  first_name?: string;
  last_name?: string;
}

export interface CustomerFormData {
  full_name: string;
  job_title: string;
  phone_number: string;
  company_name: string;
  address: string;
  source: string;
  description: string;
  status: number;
}

export type CustomerPayload = Partial<CustomerFormData>;

export interface CustomerSelectProps {
  customers: Customer[];
  value: number | null;
  onChange: (value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}
