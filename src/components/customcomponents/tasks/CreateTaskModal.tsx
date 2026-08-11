"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import CustomerSelect from "@/components/customcomponents/shared/CustomerSelect"
import DepartmentSelect from "@/components/customcomponents/shared/DepartmentSelect"
import EmployeeSelect from "@/components/customcomponents/shared/EmployeeSelect"
import FileUploader from "@/components/customcomponents/shared/FileUploader"
import CreateCaseModal from "@/components/customcomponents/cases/CreateCaseModal"
import CaseList from "@/components/customcomponents/cases/CaseList"
import EditCaseModal from "@/components/customcomponents/cases/EditCaseModal"
import type { Customer } from "@/types/customer"
import type { Department } from "@/types/department"
import type { DepartmentEmployee } from "@/types/employee"
import type { CaseItem } from "@/types/case"
import type { CreateTaskModalProps } from "@/types/task"

const steps = ["مشتری", "پرونده", "تنظیمات تسک"]

export default function CreateTaskModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateTaskModalProps) {
    const [step, setStep] = useState(0)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [cases, setCases] = useState<CaseItem[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [departmentEmployees, setDepartmentEmployees] = useState<DepartmentEmployee[]>([])

    const [loadingCustomers, setLoadingCustomers] = useState(false)
    const [loadingCases, setLoadingCases] = useState(false)
    const [loadingDepartments, setLoadingDepartments] = useState(false)
    const [loadingEmployees, setLoadingEmployees] = useState(false)
    const [deletingCaseId, setDeletingCaseId] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)
    const [selectedCase, setSelectedCase] = useState<number | null>(null)
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    const [showCreateCase, setShowCreateCase] = useState(false)
    const [editingCase, setEditingCase] = useState<CaseItem | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setStep(0)
            setCustomers([])
            setCases([])
            setDepartments([])
            setDepartmentEmployees([])
            setLoadingCustomers(false)
            setLoadingCases(false)
            setLoadingDepartments(false)
            setLoadingEmployees(false)
            setDeletingCaseId(null)
            setSubmitting(false)
            setSelectedCustomer(null)
            setSelectedCase(null)
            setSelectedDepartment(null)
            setSelectedEmployee(null)
            setFiles([])
            setTitle("")
            setDescription("")
            setShowCreateCase(false)
            setEditingCase(null)
            setError(null)
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return

        const fetchCustomers = async () => {
            setLoadingCustomers(true)
            try {
                const response = await axiosInstance.get("/customers/api/v1/customers/")
                setCustomers(response.data || [])
            } finally {
                setLoadingCustomers(false)
            }
        }

        const fetchDepartments = async () => {
            setLoadingDepartments(true)
            try {
                const response = await axiosInstance.get("/department/api/v1/department/list/")
                setDepartments(response.data || [])
            } finally {
                setLoadingDepartments(false)
            }
        }

        fetchCustomers()
        fetchDepartments()
    }, [isOpen])

    useEffect(() => {
        if (!selectedCustomer) {
            setCases([])
            setSelectedCase(null)
            return
        }

        const fetchCases = async () => {
            setLoadingCases(true)
            try {
                const response = await axiosInstance.get(
                    `/tasks/api/v1/cases/?customer=${selectedCustomer}`
                )
                setCases(response.data || [])
            } finally {
                setLoadingCases(false)
            }
        }

        fetchCases()
    }, [selectedCustomer])

    useEffect(() => {
        if (!selectedDepartment) {
            setDepartmentEmployees([])
            setSelectedEmployee(null)
            return
        }

        const fetchEmployees = async () => {
            setLoadingEmployees(true)
            try {
                const response = await axiosInstance.get(
                    "/department/api/v1/department_employee/list/"
                )

                const employees = (response.data || []).filter(
                    (item: DepartmentEmployee) => item.department === selectedDepartment
                )

                setDepartmentEmployees(employees)
            } finally {
                setLoadingEmployees(false)
            }
        }

        fetchEmployees()
    }, [selectedDepartment])

    const canSubmit = useMemo(() => {
        return Boolean(
            title.trim() &&
            description.trim() &&
            selectedCase !== null &&
            selectedDepartment !== null &&
            selectedEmployee !== null
        )
    }, [title, description, selectedCase, selectedDepartment, selectedEmployee])

    const refreshCases = async (customerId: number) => {
        const response = await axiosInstance.get(`/tasks/api/v1/cases/?customer=${customerId}`)
        const nextCases = response.data || []
        setCases(nextCases)
        return nextCases
    }

    const handleCaseCreated = async (createdCase: CaseItem) => {
        if (!selectedCustomer) return
        const nextCases = await refreshCases(selectedCustomer)
        const matchedCase = nextCases.find((item: CaseItem) => item.id === createdCase.id)
        if (matchedCase) {
            setSelectedCase(matchedCase.id)
            return
        }
        setSelectedCase(createdCase.id)
    }

    const handleCaseUpdated = (updatedCase: CaseItem) => {
        setCases((prev) => prev.map((item) => (item.id === updatedCase.id ? updatedCase : item)))
    }

    const handleDeleteCase = async (caseId: number) => {
        if (!selectedCustomer) return

        setDeletingCaseId(caseId)

        try {
            await axiosInstance.delete(`/tasks/api/v1/cases/${caseId}/delete/`)
            const nextCases = await refreshCases(selectedCustomer)

            if (selectedCase === caseId) {
                setSelectedCase(nextCases.length > 0 ? nextCases[0].id : null)
            }
        } finally {
            setDeletingCaseId(null)
        }
    }

    const handleSubmit = async () => {
        if (!canSubmit) return

        setSubmitting(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("title", title.trim())
            formData.append("description", description.trim())
            formData.append("case", String(selectedCase))
            formData.append("department", String(selectedDepartment))
            formData.append("assigned_employee", String(selectedEmployee))

            files.forEach((file) => {
                formData.append("files", file)
            })

            await axiosInstance.post("/tasks/api/v1/tasks/create/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            onSuccess()
            onClose()
        } catch {
            setError("خطا در ثبت تسک. دوباره امتحان کن.")
        } finally {
            setSubmitting(false)
        }
    }

    const nextStep = () => {
        if (step === 0 && !selectedCustomer) return
        if (step === 1 && !selectedCase) return
        setStep((prev) => Math.min(prev + 1, steps.length - 1))
    }

    const previousStep = () => {
        setStep((prev) => Math.max(prev - 1, 0))
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                <div className="w-full max-w-4xl rounded-[36px] border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">ایجاد تسک</h2>
                            <p className="mt-1 text-sm text-white/55">
                                تسک را مستقل بساز و پرونده را فقط انتخاب کن
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="mb-8 grid grid-cols-3 gap-3">
                        {steps.map((item, index) => {
                            const isActive = index === step
                            const isDone = index < step

                            return (
                                <div
                                    key={item}
                                    className={`rounded-[24px] border px-4 py-3 transition ${isActive
                                        ? "border-blue-500/40 bg-blue-500/10"
                                        : isDone
                                            ? "border-emerald-500/20 bg-emerald-500/10"
                                            : "border-white/10 bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${isActive
                                                ? "bg-blue-500 text-white"
                                                : isDone
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-white/10 text-white/60"
                                                }`}
                                        >
                                            {isDone ? <Check size={14} /> : index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-white">{item}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="min-h-[360px]">
                        {step === 0 && (
                            <div className="space-y-5">
                                <CustomerSelect
                                    customers={customers}
                                    value={selectedCustomer}
                                    onChange={setSelectedCustomer}
                                    loading={loadingCustomers}
                                />
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-5">
                                <CaseList
                                    cases={cases}
                                    selectedCaseId={selectedCase}
                                    onSelect={setSelectedCase}
                                    onCreate={() => setShowCreateCase(true)}
                                    onEdit={setEditingCase}
                                    onDelete={handleDeleteCase}
                                    loading={loadingCases}
                                    deletingCaseId={deletingCaseId}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm text-white/70">عنوان تسک</label>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                                            placeholder="مثلاً پیگیری قرارداد"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm text-white/70">توضیحات</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={6}
                                            className="w-full rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                                            placeholder="جزئیات تسک را وارد کن"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <DepartmentSelect
                                        departments={departments}
                                        value={selectedDepartment}
                                        onChange={setSelectedDepartment}
                                        loading={loadingDepartments}
                                    />

                                    <EmployeeSelect
                                        employees={departmentEmployees}
                                        value={selectedEmployee}
                                        onChange={setSelectedEmployee}
                                        loading={loadingEmployees}
                                        disabled={!selectedDepartment}
                                    />

                                    <FileUploader files={files} onChange={setFiles} />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={previousStep}
                            disabled={step === 0}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 px-5 text-sm text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                            <span>مرحله قبل</span>
                        </button>

                        <div className="flex items-center gap-3">
                            {step < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500"
                                >
                                    <span>ادامه</span>
                                    <ChevronLeft size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || submitting}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Plus size={16} />
                                    )}
                                    <span>ثبت تسک</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CreateCaseModal
                isOpen={showCreateCase}
                onClose={() => setShowCreateCase(false)}
                selectedCustomer={selectedCustomer}
                onSuccess={handleCaseCreated}
            />

            <EditCaseModal
                isOpen={Boolean(editingCase)}
                onClose={() => setEditingCase(null)}
                caseItem={editingCase}
                onSuccess={handleCaseUpdated}
            />
        </>
    )
}
