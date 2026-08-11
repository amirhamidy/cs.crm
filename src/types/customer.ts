export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: number;
  phone_number: string;
  national_code: string;
  is_active: boolean;
}

export interface UserDetails {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_code: string;
  is_active: boolean;
  user_type: number;
}

export interface Customer {
    id: number;
    full_name: string;
    phone_number: string;
    company_name: string;
    status: number;
    status_display: string;
    created_by_username: string;
    created_at: string;
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

// export interface Customer {
//   id: number
//   full_name?: string
//   first_name?: string
//   last_name?: string
//   phone_number?: string
//   email?: string
//   company_name?: string
// }

export interface CustomerSelectProps {
  customers: Customer[]
  value: number | null
  onChange: (value: number | null) => void
  loading?: boolean
  disabled?: boolean
}
