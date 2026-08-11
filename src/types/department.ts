export interface Department {
  id: number
  name: string
}

export interface DepartmentSelectProps {
  departments: Department[]
  value: number | null
  onChange: (value: number | null) => void
  loading?: boolean
  disabled?: boolean
}
