export interface Customer {
  id: number;
  full_name: string;
  job_title?: string;
  phone_number: string;
  company_name?: string;
  address?: string;
  source?: string;
  description?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
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
