export interface Customer {
  id: number;
  full_name: string;
  job_title?: string;
  phone_number: string;
  company_name?: string;
  address?: string;
  source?: string;
  created_at: string; 
  status_display: string; 
  first_name: string;
  last_name: string;
  description?: string;
  status: number;
  updated_at?: string;
  created_by_username: string;
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

export interface CustomerSelectProps {
  customers: Customer[];
  value: number | null;
  onChange: (value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}
