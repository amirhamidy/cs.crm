"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Loader,
    Search,
    X,
    Upload,
    Paperclip,
    AlertCircle,
    UserPlus,
    FolderOpen,
    Users,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem, TaskStatus } from "@/types/task";
import { taskStatusLabels } from "@/components/customcomponents/shared/constants";

interface EditTaskModalProps {
    task: TaskItem | null;
    customers: Customer[];
    departments: Department[];
    employees: Employee[];
    onClose: () => void;
    onSuccess: () => void;
}

interface Option {
    id: number;
    label: string;
    sub?: string;
}

const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

function gradientOf(seed: number) {
    return GRADIENTS[Math.abs(seed) % GRADIENTS.length];
}

function initialOf(text: string) {
    const clean = (text || "").trim();
    return clean ? clean.charAt(0) : "؟";
}

function FloatingInput({
    label,
    id,
    value,
    onChange,
    type = "text",
    dir,
    className = "",
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    dir?: "rtl" | "ltr";
    className?: string;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                dir={dir}
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`peer w-full h-[52px] rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] px-4 pt-4 text-[12.5px] font-bold text-gray-900 dark:text-white outline-none transition-colors focus:border-blue-500 dark:focus:border-blue-500/50 ${className}`}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

function FloatingTextarea({
    label,
    id,
    value,
    onChange,
    rows = 3,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
}) {
    return (
        <div className="relative">
            <textarea
                id={id}
                rows={rows}
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="peer w-full resize-none rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] px-4 pt-6 pb-3 text-[12.5px] font-bold leading-6 text-gray-900 dark:text-white outline-none transition-colors focus:border-blue-500 dark:focus:border-blue-500/50"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-4 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

function NiceSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
    emptyText,
    multiple = false,
}: {
    label: string;
    options: Option[];
    value: number | number[] | null;
    onChange: (id: number | number[]) => void;
    placeholder: string;
    disabled?: boolean;
    emptyText: string;
    multiple?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selectedValues = Array.isArray(value) ? value : value !== null ? [value] : [];
    const selectedOptions = options.filter((o) => selectedValues.includes(o.id));

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query]);

    const handleSelect = (id: number) => {
        if (!multiple) {
            onChange(id);
            setOpen(false);
            return;
        }

        const current = Array.isArray(value) ? value : [];
        if (current.includes(id)) {
            onChange(current.filter((v) => v !== id));
        } else {
            onChange([...current, id]);
        }
    };

    const displayText = multiple
        ? selectedOptions.length > 0
            ? `${selectedOptions.length} کارمند انتخاب شد`
            : placeholder
        : selectedOptions[0]?.label || placeholder;

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                    ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {selectedOptions.length > 0 && !multiple ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            selectedOptions[0].id
                        )}`}
                    >
                        {initialOf(selectedOptions[0].label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        {multiple ? <UserPlus size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selectedOptions.length > 0 ? "text-gray-900 dark:text-white" : "text-gray-400"
                            }`}
                    >
                        {displayText}
                    </span>
                    {multiple && selectedOptions.length > 0 && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                            {selectedOptions.map((o) => o.label).join("، ")}
                        </span>
                    )}
                </span>

                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        {options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">{emptyText}</p>
                            ) : (
                                visible.map((o, i) => {
                                    const active = selectedValues.includes(o.id);
                                    return (
                                        <motion.button
                                            key={o.id}
                                            type="button"
                                            initial={{ opacity: 0, x: 6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            onClick={() => handleSelect(o.id)}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                ? "bg-blue-50 dark:bg-blue-500/10"
                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    o.id
                                                )}`}
                                            >
                                                {initialOf(o.label)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {o.label}
                                                </span>
                                                {o.sub && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {o.sub}
                                                    </span>
                                                )}
                                            </span>
                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <Check size={11} className="text-white" strokeWidth={3} />
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const statusTone: Record<string, string> = {
    pending: "bg-amber-500",
    in_progress: "bg-blue-500",
    done: "bg-emerald-500",
    completed: "bg-emerald-500",
    canceled: "bg-rose-500",
    cancelled: "bg-rose-500",
    rejected: "bg-rose-500",
};

function getEmployeeName(employee: Employee) {
    const detail = employee.user_detail;
    const fullName =
        employee.full_name ||
        detail?.full_name ||
        [employee.first_name, employee.last_name, detail?.first_name, detail?.last_name]
            .filter(Boolean)
            .join(" ");
    return fullName || `کارمند ${employee.id}`;
}

function getEmployeeId(employee: Employee) {
    return employee.id;
}

function getFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const getListData = <T,>(data: T[] | { results?: T[] }): T[] =>
    Array.isArray(data) ? data : data?.results ?? [];

export default function EditTaskModal({
    task,
    customers,
    departments,
    employees,
    onClose,
    onSuccess,
}: EditTaskModalProps) {
    const [title, setTitle] = useState("");
    const [selectedCase, setSelectedCase] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [status, setStatus] = useState<TaskStatus>("in_progress");
    const [files, setFiles] = useState<File[]>([]);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [casesLoading, setCasesLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);
    const [existingFiles, setExistingFiles] = useState<Array<{ id?: number; file: string; name?: string }>>([]);
    const [isInitializing, setIsInitializing] = useState(false);
    const [selectedEmployeesData, setSelectedEmployeesData] = useState<Employee[]>([]);

    const filteredEmployees = useMemo(
        () =>
            selectedDepartment
                ? employees.filter((e) => {
                    const dept = e.department;
                    if (dept && typeof dept === "object") {
                        return Number(dept.id) === selectedDepartment;
                    }
                    return Number(dept) === selectedDepartment;
                })
                : employees,
        [employees, selectedDepartment]
    );

    const allEmployees = useMemo(() => {
        const merged = [...filteredEmployees];
        selectedEmployeesData.forEach((emp) => {
            if (!merged.some((e) => getEmployeeId(e) === getEmployeeId(emp))) {
                merged.push(emp);
            }
        });
        return merged;
    }, [filteredEmployees, selectedEmployeesData]);

    const filteredEmpOptions = useMemo(
        () =>
            allEmployees
                .filter((employee) => {
                    return !!(
                        employee.first_name ||
                        employee.last_name ||
                        employee.user_detail?.first_name ||
                        employee.user_detail?.last_name ||
                        employee.full_name
                    );
                })
                .map((employee) => ({
                    id: Number(getEmployeeId(employee)),
                    label: getEmployeeName(employee),
                    sub: employee.position || employee.user_detail?.username || undefined,
                })),
        [allEmployees]
    );

    const caseOptions = useMemo(
        () =>
            cases.map((item) => {
                const customerId =
                    item.customer && typeof item.customer === "object"
                        ? item.customer.id
                        : item.customer;
                const customer = customers.find((c) => Number(c.id) === Number(customerId));
                return {
                    id: Number(item.id),
                    label: item.title,
                    sub: customer ? `مشتری: ${customer.full_name}` : undefined,
                };
            }),
        [cases, customers]
    );

    const deptOptions = useMemo(
        () =>
            departments.map((department) => ({
                id: Number(department.id),
                label: department.name,
            })),
        [departments]
    );

    const statusOptions = useMemo(
        () =>
            (Object.keys(taskStatusLabels) as TaskStatus[]).map((statusKey) => ({
                id: statusKey.charCodeAt(0),
                label: taskStatusLabels[statusKey],
                sub: statusKey,
            })),
        []
    );

    useEffect(() => {
        if (!task) return;

        setIsInitializing(true);

        setTitle(task.title ?? "");

        const caseId =
            task.case && typeof task.case === "object"
                ? task.case.id
                : task.case
                    ? Number(task.case)
                    : null;
        setSelectedCase(caseId);

        const deptId =
            task.department && typeof task.department === "object"
                ? task.department.id
                : task.department
                    ? Number(task.department)
                    : null;
        setSelectedDepartment(deptId);

        setStatus((task.status as TaskStatus) ?? "pending");

        const rawEmployee = task.assigned_employee;
        const employeeIds: number[] = [];

        if (Array.isArray(rawEmployee)) {
            rawEmployee.forEach((emp) => {
                const id =
                    typeof emp === "object" && emp !== null ? Number(emp.id) : Number(emp);
                if (!isNaN(id) && id > 0) employeeIds.push(id);
            });
        } else if (typeof rawEmployee === "number") {
            employeeIds.push(rawEmployee);
        }

        async function fetchSelectedEmployees() {
            const fetched: Employee[] = [];
            for (const id of employeeIds) {
                try {
                    const res = await axiosInstance.get(`/accounts/api/v1/employee/${id}/`);
                    if (res.data) fetched.push(res.data);
                } catch {
                }
            }
            setSelectedEmployeesData(fetched);
            setSelectedEmployees(fetched.map((emp) => Number(getEmployeeId(emp))));
        }

        fetchSelectedEmployees();

        setFiles([]);
        setSubmitError("");
        setSuccess(false);

        const taskFiles = task.files || [];
        if (Array.isArray(taskFiles)) {
            const mappedFiles = taskFiles
                .map((f: any) => {
                    if (typeof f === "string") return { file: f };
                    return { id: f?.id, file: f?.file || f?.url || f?.attachment, name: f?.name };
                })
                .filter((f) => f.file);
            setExistingFiles(mappedFiles);
        } else {
            setExistingFiles([]);
        }

        setCasesLoading(true);
        axiosInstance
            .get(apiRoutes.cases)
            .then((res) => setCases(getListData<CaseItem>(res.data)))
            .catch(() => { })
            .finally(() => {
                setCasesLoading(false);
                setIsInitializing(false);
            });
    }, [task]);

    useEffect(() => {
        if (isInitializing) return;
        if (selectedDepartment !== null) {
            setSelectedEmployees((prev) =>
                prev.filter((id) =>
                    allEmployees.some((e) => Number(getEmployeeId(e)) === id)
                )
            );
        } else {
            setSelectedEmployees([]);
        }
    }, [selectedDepartment, allEmployees, isInitializing]);

    const canSubmit =
        title.trim().length > 0 &&
        selectedCase !== null &&
        selectedDepartment !== null &&
        selectedEmployees.length > 0 &&
        !submitting;

    function handleClose() {
        if (submitting || success) return;
        onClose();
    }

    function parseBackendError(data: unknown): string {
        if (!data) return "خطایی رخ داد. دوباره تلاش کنید.";
        if (typeof data === "string") return data;
        if (Array.isArray(data)) return String(data[0]);
        if (typeof data === "object") {
            const values = Object.values(data as Record<string, unknown>);
            const first = values[0];
            if (Array.isArray(first)) return String(first[0]);
            if (typeof first === "string") return first;
        }
        return "خطایی رخ داد. دوباره تلاش کنید.";
    }

    async function handleSubmit() {
        if (!canSubmit) return;
        setSubmitError("");
        setSubmitting(true);

        try {
            const payload: any = {
                title: title.trim(),
                case: selectedCase,
                department: selectedDepartment,
                assigned_employee: selectedEmployees,
                status: status,
            };

            await axiosInstance.patch(apiRoutes.updateTask(task!.id), payload);

            if (files.length > 0) {
                await Promise.allSettled(
                    files.map((file) => {
                        const formData = new FormData();
                        formData.append("file", file);
                        return axiosInstance.post(
                            apiRoutes.taskAttachments(task!.id),
                            formData,
                            { headers: { "Content-Type": "multipart/form-data" } }
                        );
                    })
                );
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                onSuccess();
            }, 1400);
        } catch (err) {
            const e = err as { response?: { data?: unknown } };
            setSubmitError(parseBackendError(e.response?.data));
        } finally {
            setSubmitting(false);
        }
    }

    const selectedCaseObj = cases.find((c) => Number(c.id) === selectedCase) ?? null;
    const selectedDeptObj = departments.find((d) => Number(d.id) === selectedDepartment) ?? null;

    if (!task) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                >
                    <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <ClipboardList size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    ویرایش وظیفه
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">{task.title}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting || success}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="shrink-0 px-8 pb-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {selectedCaseObj && (
                                <span className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    <FolderOpen size={11} />
                                    {selectedCaseObj.title}
                                </span>
                            )}
                            {selectedDeptObj && (
                                <>
                                    <ChevronLeft size={11} className="text-gray-300 dark:text-white/20" />
                                    <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                        <Users size={11} />
                                        {selectedDeptObj.name}
                                    </span>
                                </>
                            )}
                            {selectedEmployees.length > 0 && (
                                <>
                                    <ChevronLeft size={11} className="text-gray-300 dark:text-white/20" />
                                    <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                        <UserPlus size={11} />
                                        {selectedEmployees.length} کارمند
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {submitError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                    >
                                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                        <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                            {submitError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSubmitError("")}
                                            className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                        >
                                            <X size={13} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex h-[48px] items-center justify-center gap-2 rounded-full bg-emerald-50 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                >
                                    <Check size={15} />
                                    تغییرات با موفقیت ذخیره شد
                                </motion.div>
                            )}

                            <FloatingInput
                                id="edit_task_title"
                                label="عنوان وظیفه"
                                value={title}
                                onChange={(v) => {
                                    setTitle(v);
                                    setSubmitError("");
                                }}
                            />

                            <NiceSelect
                                label="پرونده"
                                placeholder="انتخاب پرونده"
                                emptyText="پرونده‌ای یافت نشد"
                                options={caseOptions}
                                value={selectedCase}
                                onChange={(id) => {
                                    setSelectedCase(id as number);
                                    setSubmitError("");
                                }}
                                disabled={casesLoading}
                            />

                            <NiceSelect
                                label="دپارتمان"
                                placeholder="انتخاب دپارتمان"
                                emptyText="دپارتمانی یافت نشد"
                                options={deptOptions}
                                value={selectedDepartment}
                                onChange={(id) => {
                                    setSelectedDepartment(id as number);
                                    setSubmitError("");
                                }}
                            />

                            <NiceSelect
                                label="کارمندان مسئول"
                                placeholder={
                                    selectedDepartment
                                        ? "انتخاب کارمند"
                                        : "ابتدا دپارتمان را انتخاب کنید"
                                }
                                emptyText="کارمندی در این دپارتمان نیست"
                                disabled={!selectedDepartment}
                                multiple={true}
                                options={filteredEmpOptions}
                                value={selectedEmployees}
                                onChange={(ids) => {
                                    setSelectedEmployees(ids as number[]);
                                    setSubmitError("");
                                }}
                            />

                            <NiceSelect
                                label="وضعیت"
                                placeholder="انتخاب وضعیت"
                                emptyText="وضعیتی یافت نشد"
                                options={statusOptions.map((s) => ({
                                    id: s.id,
                                    label: s.label,
                                    sub: s.sub,
                                }))}
                                value={statusOptions.find((s) => s.sub === status)?.id || null}
                                onChange={(id) => {
                                    const found = statusOptions.find((s) => s.id === id);
                                    if (found) {
                                        setStatus(found.sub as TaskStatus);
                                        setSubmitError("");
                                    }
                                }}
                            />

                            {existingFiles.length > 0 && (
                                <div>
                                    <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                        فایل‌های موجود
                                    </label>
                                    <div className="flex flex-col gap-1.5">
                                        {existingFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                                            >
                                                <Paperclip size={12} className="shrink-0 text-gray-400" />
                                                <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">
                                                    {file.name || `فایل ${index + 1}`}
                                                </span>
                                                <a
                                                    href={file.file}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-[10.5px] font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                                                >
                                                    مشاهده
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                    فایل‌های جدید (اختیاری)
                                </label>
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                        <Upload size={14} />
                                    </span>
                                    <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                        {files.length > 0
                                            ? `${files.length} فایل انتخاب شد`
                                            : "افزودن فایل"}
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) =>
                                            setFiles((prev) => [
                                                ...prev,
                                                ...Array.from(e.target.files ?? []),
                                            ])
                                        }
                                    />
                                </label>

                                <AnimatePresence>
                                    {files.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 flex flex-col gap-1.5 overflow-hidden"
                                        >
                                            {files.map((f, i) => (
                                                <motion.div
                                                    key={`${f.name}-${i}`}
                                                    initial={{ opacity: 0, x: 8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 8 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                                                >
                                                    <Paperclip size={12} className="shrink-0 text-gray-400" />
                                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">
                                                        {f.name}
                                                    </span>
                                                    <span className="shrink-0 text-[10.5px] text-gray-400">
                                                        {getFileSize(f.size)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFiles((prev) =>
                                                                prev.filter((_, j) => j !== i)
                                                            )
                                                        }
                                                        className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting || success}
                            className="flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <ChevronRight size={14} />
                            انصراف
                        </button>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={!canSubmit || success}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                        >
                            {submitting ? (
                                <Loader size={15} className="animate-spin" />
                            ) : success ? (
                                <>
                                    <Check size={14} strokeWidth={3} />
                                    ذخیره شد
                                </>
                            ) : (
                                <>
                                    <Check size={14} strokeWidth={3} />
                                    ذخیره تغییرات
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
