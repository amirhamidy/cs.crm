export interface CaseItem {
  id: number
  title: string
  description?: string
  customer?: number
  created_at?: string
  updated_at?: string
}

export interface CaseFormData {
  title: string
  description: string
}

export interface CreateCaseModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCustomer: number | null
  onSuccess: (createdCase: CaseItem) => void
}

export interface EditCaseModalProps {
  isOpen: boolean
  onClose: () => void
  caseItem: CaseItem | null
  onSuccess: (updatedCase: CaseItem) => void
}

export interface CaseCardProps {
  caseItem: CaseItem
  isSelected?: boolean
  onSelect?: (caseId: number) => void
  onEdit?: (caseItem: CaseItem) => void
  onDelete?: (caseId: number) => void
  deleting?: boolean
}

export interface CaseListProps {
  cases: CaseItem[]
  selectedCaseId?: number | null
  onSelect?: (caseId: number) => void
  onCreate?: () => void
  onEdit?: (caseItem: CaseItem) => void
  onDelete?: (caseId: number) => void
  loading?: boolean
  deletingCaseId?: number | null
}
