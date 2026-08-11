"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import DepartmentSelect from "@/components/customcomponents/shared/DepartmentSelect"
import EmployeeSelect from "@/components/customcomponents/shared/EmployeeSelect"
import FileUploader from "@/components/customcomponents/shared/FileUploader"
import type { Department } from "@/types/department"
import type { DepartmentEmployee } from "@/types/employee"
import type { EditTaskModalProps } from "@/types/task"

export default function EditTaskModal({
    isOpen,
    onClose,
    task,
    onSuccess,
}: EditTaskModalProps) {
    const [departments, setDepartments] = useState<Department[]>([])
    const [employees, setEmployees] = useState<DepartmentEmployee[]>([])
    const [loadingDepartments, setLoadingDepartments] = useState(false)
    const [loadingEmployees, setLoadingEmployees] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])

    useEffect(() => {
        if (isOpen && task) {
            setTitle(task.title || "")
            setDescription(task.description || "")
            setSelectedDepartment(task.department ?? null)
            setSelectedEmployee(task.assigned_employee ?? null)
            setFiles([])
            setError(null)
            setSubmitting(false)
        }
    }, [isOpen, task])

    useEffect(() => {
        if (!isOpen) return

        const fetchDepartments = async () => {
            setLoadingDepartments(true)
            try {
                const response = await axiosInstance.get("/department/api/v1/department/list/")
                setDepartments(response.data || [])
            } finally {
                setLoadingDepartments(false)
            }
        }

        fetchDepartments()
    }, [isOpen])

    useEffect(() => {
        if (!selectedDepartment) {
            setEmployees([])
            return
        }

        const fetchEmployees = async () => {
            setLoadingEmployees(true)
            try {
                const response = await axiosInstance.get(
                    "/department/api/v1/department_employee/list/"
                )

                const filtered = (response.data || []).filter(
                    (item: DepartmentEmployee) => item.department === selectedDepartment
                )

                setEmployees(filtered)
            } finally {
                setLoadingEmployees(false)
            }
        }

        fetchEmployees()
    }, [selectedDepartment])

    const canSubmit = useMemo(() => {
        return Boolean(
            task?.id &&
            title.trim() &&
            description.trim() &&
            selectedDepartment !== null &&
            selectedEmployee !== null
        )
    }, [task, title, description, selectedDepartment, selectedEmployee])

    const handleSubmit = async () => {
        if (!task?.id || !canSubmit) return

        setSubmitting(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("title", title.trim())
            formData.append("description", description.trim())
            formData.append("department", String(selectedDepartment))
            formData.append("assigned_employee", String(selectedEmployee))

            files.forEach((file) => {
                formData.append("files", file)
            })

            await axiosInstance.patch(`/tasks/api/v1/tasks/${task.id}/update/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            onSuccess()
            onClose()
        } catch {
            setError("خطا در ویرایش تسک. دوباره امتحان کن.")
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen || !task) return null

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">ویرایش تسک</h2>
                        <p className="mt-1 text-sm text-white/55">اطلاعات تسک را به‌روزرسانی کن</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">عنوان تسک</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">توضیحات</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-blue-500/50"
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
                            employees={employees}
                            value={selectedEmployee}
                            onChange={setSelectedEmployee}
                            loading={loadingEmployees}
                            disabled={!selectedDepartment}
                        />

                        <FileUploader files={files} onChange={setFiles} />
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 rounded-full border border-white/10 px-5 text-sm text-white/80 transition hover:bg-white/5"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        <span>ذخیره تغییرات</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
