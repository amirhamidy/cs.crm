"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Check,
    CheckCircle2,
    ChevronDown,
    ExternalLink,
    FileUp,
    Loader2,
    Paperclip,
    Pencil,
    Search,
    X,
} from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { apiRoutes } from "@/lib/apiRoutes"
import type { CaseItem } from "@/types/case"
import type { Customer } from "@/types/customer"
import type { Department } from "@/types/department"
import type { Employee } from "@/types/employee"
import type { TaskItem, TaskStatus } from "@/types/task"
import { taskStatusLabels } from "@/components/customcomponents/shared/constants"

interface EditTaskModalProps {
    task: TaskItem | null
    customers: Customer[]
    departments: Department[]
    employees: Employee[]
    onClose: () => void
    onSuccess: () => void
}

interface TaskFormState {
    title: string
    description: string
    case: string
    department: string
    assigned_employee: string
    status: TaskStatus
}

interface SelectOption {
    value: string
    label: string
    hint?: string
}

interface FloatingInputProps {
    label: string
    id: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface FloatingTextareaProps {
    label: string
    id: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

interface NiceSelectProps {
    label: string
    value: string
    options: SelectOption[]
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    loading?: boolean
    searchable?: boolean
    withAvatar?: boolean
    emptyText?: string
}

interface FileUploaderProps {
    files: File[]
    onChange: (files: File[]) => void
}

const statusTone: Record<string, string> = {
    pending: "bg-amber-500",
    in_progress: "bg-blue-500",
    done: "bg-emerald-500",
    completed: "bg-emerald-500",
    canceled: "bg-rose-500",
    cancelled: "bg-rose-500",
    rejected: "bg-rose-500",
}

const getListData = <T,>(data: T[] | { results?: T[] }): T[] =>
    Array.isArray(data) ? data : data?.results ?? []

const getEmployeeName = (employee: Employee) => {
    const detail = employee.user_detail
    const fullName =
        employee.full_name ||
        detail?.full_name ||
        [employee.first_name, employee.last_name, detail?.first_name, detail?.last_name]
            .filter(Boolean)
            .join(" ")
    return fullName || `کارمند ${employee.id}`
}

const getEmployeeId = (employee: Employee) => employee.employee ?? employee.id

const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getInitial = (text: string) => text.trim().charAt(0) || "؟"

const FloatingInput = ({ label, id, value, onChange }: FloatingInputProps) => (
    <div className="relative">
        <input
            id={id}
            placeholder=" "
            value={value}
            onChange={onChange}
            className="peer w-full rounded-4xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 dark:border-slate-700/70 dark:bg-slate-900 dark:text-white"
        />
        <label
            htmlFor={id}
            className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 text-sm text-slate-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-blue-500 dark:bg-[#0f172a] dark:text-slate-500 dark:peer-focus:text-blue-400 dark:peer-[:not(:placeholder-shown)]:text-blue-400"
        >
            {label}
        </label>
    </div>
)

const FloatingTextarea = ({ label, id, value, onChange }: FloatingTextareaProps) => (
    <div className="relative">
        <textarea
            id={id}
            placeholder=" "
            rows={3}
            value={value}
            onChange={onChange}
            className="peer w-full resize-none rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 dark:border-slate-700/70 dark:bg-slate-900 dark:text-white"
        />
        <label
            htmlFor={id}
            className="pointer-events-none absolute right-5 top-4 rounded bg-white px-1.5 text-sm text-slate-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-blue-500 dark:bg-[#0f172a] dark:text-slate-500 dark:peer-focus:text-blue-400 dark:peer-[:not(:placeholder-shown)]:text-blue-400"
        >
            {label}
        </label>
    </div>
)

const NiceSelect = ({
    label,
    value,
    options,
    onChange,
    placeholder = "انتخاب کنید",
    disabled,
    loading,
    searchable,
    withAvatar,
    emptyText = "موردی پیدا نشد",
}: NiceSelectProps) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const boxRef = useRef<HTMLDivElement>(null)

    const selected = options.find((option) => option.value === value) || null

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase()
        if (!term) return options
        return options.filter((option) =>
            `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(term)
        )
    }, [options, query])

    useEffect(() => {
        if (!open) return

        const handleClick = (event: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false)
        }

        document.addEventListener("mousedown", handleClick)
        document.addEventListener("keydown", handleKey)

        return () => {
            document.removeEventListener("mousedown", handleClick)
            document.removeEventListener("keydown", handleKey)
        }
    }, [open])

    return (
        <div className="relative" ref={boxRef}>
            <div
                onClick={() => !disabled && setOpen(!open)}
                className={`group flex min-h-[46px] w-full cursor-pointer items-center justify-between rounded-4xl border bg-white px-5 py-2.5 transition-all duration-200 dark:bg-slate-900 ${open
                    ? "border-blue-500 ring-4 ring-blue-500/5"
                    : "border-slate-200 dark:border-slate-700/70"
                    } ${disabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    {withAvatar && selected && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm shadow-blue-500/20">
                            {getInitial(selected.label)}
                        </div>
                    )}
                    <span
                        className={`truncate text-[13px] ${selected ? "font-medium text-slate-900 dark:text-white" : "text-slate-400"
                            }`}
                    >
                        {selected ? selected.label : placeholder}
                    </span>
                </div>
                {loading ? (
                    <Loader2 size={15} className="shrink-0 animate-spin text-slate-400" />
                ) : (
                    <ChevronDown
                        size={16}
                        className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""
                            }`}
                    />
                )}
            </div>

            <label className="pointer-events-none absolute -top-2 right-5 rounded bg-white px-1.5 text-[10px] font-bold text-slate-400 dark:bg-[#0f172a] dark:text-slate-500">
                {label}
            </label>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute z-[60] mt-2 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-none"
                    >
                        {searchable && (
                            <div className="border-b border-slate-100 p-2.5 dark:border-slate-800">
                                <div className="relative">
                                    <Search
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="جستجو..."
                                        className="h-9 w-full rounded-2xl bg-slate-50 pl-4 pr-9 text-xs text-slate-900 outline-none focus:bg-slate-100 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800/80"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-52 overflow-y-auto p-1.5">
                            {filtered.length > 0 ? (
                                filtered.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value)
                                            setOpen(false)
                                            setQuery("")
                                        }}
                                        className={`group flex cursor-pointer items-center justify-between rounded-2xl px-3.5 py-2.5 transition-colors ${value === option.value
                                            ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            {withAvatar && (
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[11px] font-bold text-slate-600 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white dark:from-slate-800 dark:to-slate-700 dark:text-slate-400">
                                                    {getInitial(option.label)}
                                                </div>
                                            )}
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-[12.5px] font-medium">
                                                    {option.label}
                                                </span>
                                                {option.hint && (
                                                    <span className="truncate text-[10px] text-slate-400">
                                                        {option.hint}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {value === option.value && (
                                            <Check size={14} className="shrink-0" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    {emptyText}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const FileUploader = ({ files, onChange }: FileUploaderProps) => {
    const [dragging, setDragging] = useState(false)

    const handleFiles = (list: FileList | null) => {
        if (!list) return
        onChange([...files, ...Array.from(list)])
    }

    return (
        <div>
            <input
                id="edit-task-files"
                type="file"
                multiple
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
            />
            <label
                htmlFor="edit-task-files"
                onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    handleFiles(event.dataTransfer.files)
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed px-5 py-6 transition-all duration-200 ${dragging
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-700/70 dark:bg-slate-900/50 dark:hover:border-slate-600"
                    }`}
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
                    <FileUp size={18} />
                </div>
                <span className="text-[11.5px] font-medium text-slate-500">
                    فایل جدید را بکشید یا کلیک کنید
                </span>
            </label>

            {files.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700/60 dark:bg-slate-800/60"
                        >
                            <Paperclip size={13} className="shrink-0 text-slate-400" />
                            <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                                {file.name}
                            </span>
                            <span className="shrink-0 text-[10.5px] text-slate-400">
                                {getFileSize(file.size)}
                            </span>
                            <button
                                type="button"
                                onClick={() => onChange(files.filter((_, i) => i !== index))}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function EditTaskModal({
    task,
    customers,
    departments,
    employees,
    onClose,
    onSuccess,
}: EditTaskModalProps) {
    const [form, setForm] = useState<TaskFormState>({
        title: "",
        description: "",
        case: "",
        department: "",
        assigned_employee: "",
        status: "pending",
    })
    const [files, setFiles] = useState<File[]>([])
    const [cases, setCases] = useState<CaseItem[]>([])
    const [casesLoading, setCasesLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const empOptions = useMemo(
        () =>
            employees.map((employee) => ({
                value: String(getEmployeeId(employee)),
                label: getEmployeeName(employee),
                hint: employee.position || employee.user_detail?.username || undefined,
            })),
        [employees]
    )

    useEffect(() => {
        if (!task) return

        const rawEmployee = task.assigned_employee
        const rawEmployeeId =
            rawEmployee && typeof rawEmployee === "object" ? rawEmployee.id : rawEmployee

        const matchedEmployee = employees.find(
            (employee) =>
                Number(employee.id) === Number(rawEmployeeId) ||
                Number(getEmployeeId(employee)) === Number(rawEmployeeId)
        )

        setForm({
            title: task.title ?? "",
            description: task.description ?? "",
            case:
                task.case && typeof task.case === "object"
                    ? String(task.case.id)
                    : task.case
                        ? String(task.case)
                        : "",
            department:
                task.department && typeof task.department === "object"
                    ? String(task.department.id)
                    : task.department
                        ? String(task.department)
                        : "",
            assigned_employee: matchedEmployee
                ? String(getEmployeeId(matchedEmployee))
                : rawEmployeeId
                    ? String(rawEmployeeId)
                    : "",
            status: (task.status as TaskStatus) ?? "pending",
        })

        setFiles([])
        setError(null)
        setSuccess(false)
        setCasesLoading(true)

        axiosInstance
            .get(apiRoutes.cases)
            .then((res) => setCases(getListData<CaseItem>(res.data)))
            .catch(() => { })
            .finally(() => setCasesLoading(false))
    }, [task, employees])

    const handleClose = () => {
        if (!loading && !success) onClose()
    }

    const updateField = (key: keyof TaskFormState, val: string) => {
        setForm((prev) => ({ ...prev, [key]: val }))
    }

    const caseOptions = useMemo(
        () =>
            cases.map((item) => {
                const customerId =
                    item.customer && typeof item.customer === "object"
                        ? item.customer.id
                        : item.customer
                const customer = customers.find((c) => Number(c.id) === Number(customerId))
                return {
                    value: String(item.id),
                    label: item.title,
                    hint: customer ? `مشتری: ${customer.full_name}` : undefined,
                }
            }),
        [cases, customers]
    )

    const deptOptions = useMemo(
        () =>
            departments.map((department) => ({
                value: String(department.id),
                label: department.name,
            })),
        [departments]
    )

    const statusOptions = useMemo(
        () =>
            (Object.keys(taskStatusLabels) as TaskStatus[]).map((status) => ({
                value: status,
                label: taskStatusLabels[status],
            })),
        []
    )

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!task || loading) return

        if (!form.title.trim()) {
            setError("عنوان تسک اجباری است")
            return
        }

        setLoading(true)
        setError(null)

        try {
            await axiosInstance.patch(apiRoutes.updateTask(task.id), {
                title: form.title.trim(),
                description: form.description.trim() || null,
                case: form.case ? Number(form.case) : null,
                department: form.department ? Number(form.department) : null,
                assigned_employee: form.assigned_employee
                    ? Number(form.assigned_employee)
                    : null,
                status: form.status,
            })

            if (files.length > 0) {
                await Promise.allSettled(
                    files.map((file) => {
                        const formData = new FormData()
                        formData.append("file", file)
                        return axiosInstance.post(apiRoutes.taskAttachments(task.id), formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                        })
                    })
                )
            }

            setSuccess(true)
            setTimeout(() => {
                onClose()
                onSuccess()
            }, 1400)
        } catch {
            setError("خطا در ویرایش تسک. دوباره امتحان کنید.")
        } finally {
            setLoading(false)
        }
    }

    const existingFiles = task?.files ?? []

    return (
        <AnimatePresence mode="wait">
            {task && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/45"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="my-8 w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-[#0f172a] dark:shadow-none"
                        onClick={(event) => event.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    <Pencil size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        ویرایش تسک
                                    </h3>
                                    <p className="mt-0.5 max-w-[250px] truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                        {task.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading || success}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 pb-9">
                            <FloatingInput
                                label="عنوان تسک *"
                                id="edit-task-title"
                                value={form.title}
                                onChange={(event) => updateField("title", event.target.value)}
                            />

                            <FloatingTextarea
                                label="توضیحات"
                                id="edit-task-description"
                                value={form.description}
                                onChange={(event) => updateField("description", event.target.value)}
                            />

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <NiceSelect
                                    label="پرونده"
                                    value={form.case}
                                    options={caseOptions}
                                    onChange={(value) => updateField("case", value)}
                                    loading={casesLoading}
                                    searchable
                                    placeholder="انتخاب پرونده"
                                />
                                <NiceSelect
                                    label="دپارتمان"
                                    value={form.department}
                                    options={deptOptions}
                                    onChange={(value) => updateField("department", value)}
                                    placeholder="انتخاب دپارتمان"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <NiceSelect
                                    label="مسئول"
                                    value={form.assigned_employee}
                                    options={empOptions}
                                    onChange={(value) => updateField("assigned_employee", value)}
                                    placeholder="انتخاب کارمند"
                                    searchable
                                    withAvatar
                                    emptyText="کارمندی پیدا نشد"
                                />
                                <div className="relative">
                                    <NiceSelect
                                        label="وضعیت"
                                        value={form.status}
                                        options={statusOptions}
                                        onChange={(value) =>
                                            updateField("status", value as TaskStatus)
                                        }
                                        placeholder="انتخاب وضعیت"
                                    />
                                    <div
                                        className={`pointer-events-none absolute left-12 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${statusTone[form.status] ?? "bg-slate-400"
                                            }`}
                                    />
                                </div>
                            </div>

                            {existingFiles.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
                                        ضمیمه‌های فعلی
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {existingFiles.map((file, index) => (
                                            <a
                                                key={index}
                                                href={typeof file === "string" ? file : file.file}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-3 py-2 transition-all hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/5"
                                            >
                                                <Paperclip
                                                    size={12}
                                                    className="text-slate-400 group-hover:text-blue-500"
                                                />
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                    مشاهده فایل {index + 1}
                                                </span>
                                                <ExternalLink
                                                    size={10}
                                                    className="text-slate-400 group-hover:text-blue-500"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <FileUploader files={files} onChange={setFiles} />

                            <div className="mt-2 min-h-[50px]">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="mb-4 text-center text-[11.5px] font-bold text-rose-500"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    {success ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex h-[48px] items-center justify-center gap-2 rounded-full bg-emerald-50 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 size={18} />
                                            تغییرات با موفقیت ذخیره شد
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            key="submit"
                                            type="submit"
                                            disabled={loading}
                                            whileTap={{ scale: 0.98 }}
                                            className="relative flex h-[48px] w-full items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                "ذخیره تغییرات"
                                            )}
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}