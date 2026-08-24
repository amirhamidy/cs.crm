"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    ChevronDown,
    ChevronLeft,
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
import type { CaseItem, Employee } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { TaskItem } from "@/types/task";

interface DepartmentEmployee {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
}

interface Option {
    id: number;
    label: string;
    sub?: string;
}

interface EditTaskModalProps {
    task: TaskItem;
    customers: Customer[];
    departments: Department[];
    employees: Employee[];   
    onClose: () => void;
    onSuccess: () => void;
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

function extractEmployeeName(data: any, id: number): string {
    const detail = data?.user_detail;
    const fullName =
        data?.full_name ||
        detail?.full_name ||
        [data?.first_name, data?.last_name, detail?.first_name, detail?.last_name]
            .filter(Boolean)
            .join(" ");
    return fullName || data?.username || detail?.username || `کارمند ${id}`;
}

function parseRawEmployeeIds(raw: unknown): number[] {
    const ids: number[] = [];
    if (Array.isArray(raw)) {
        raw.forEach((emp) => {
            const id =
                typeof emp === "object" && emp !== null
                    ? Number((emp as any).id)
                    : Number(emp);
            if (!isNaN(id) && id > 0) ids.push(id);
        });
    } else if (typeof raw === "number" && raw > 0) {
        ids.push(raw);
    } else if (typeof raw === "string") {
        const n = Number(raw);
        if (!isNaN(n) && n > 0) ids.push(n);
    }
    return ids;
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
                className={`peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50 ${className}`}
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

    const selectedSet = useMemo(() => {
        const arr = Array.isArray(value)
            ? value
            : value !== null && value !== undefined
                ? [value]
                : [];
        return new Set(arr.map(Number));
    }, [value]);

    const selectedValues = useMemo(() => Array.from(selectedSet), [selectedSet]);

    const selectedOptions = useMemo(
        () => options.filter((o) => selectedSet.has(o.id)),
        [options, selectedSet]
    );

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
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
        const current = Array.isArray(value) ? [...value] : [];
        if (selectedSet.has(id)) {
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
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                {label}
            </label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen((v) => !v);
                }}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled
                        ? "pointer-events-none cursor-not-allowed opacity-40"
                        : "cursor-pointer"
                    }`}
            >
                {selectedOptions.length > 0 && selectedOptions[0] ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            selectedOptions[0].id
                        )}`}
                    >
                        {initialOf(selectedOptions[0].label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        {multiple ? (
                            <UserPlus size={13} className="text-gray-400" />
                        ) : (
                            <ChevronDown size={13} className="text-gray-400" />
                        )}
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selectedOptions.length > 0
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-400"
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

                {!disabled && (
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={14} className="shrink-0 text-gray-400" />
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && !disabled && (
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
                                <p className="py-6 text-center text-[12px] text-gray-400">
                                    {emptyText}
                                </p>
                            ) : (
                                visible.map((o, i) => {
                                    const active = selectedSet.has(o.id);
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
                                                    <Check
                                                        size={11}
                                                        className="text-white"
                                                        strokeWidth={3}
                                                    />
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
    const [files, setFiles] = useState<File[]>([]);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [allDeptEmployees, setAllDeptEmployees] = useState<DepartmentEmployee[]>([]);
    const [deptEmployeesLoaded, setDeptEmployeesLoaded] = useState(false);
    const [resolvedNames, setResolvedNames] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);
    const [existingFiles, setExistingFiles] = useState<
        Array<{ id?: number; file: string; name?: string }>
    >([]);

    const initialEmployeeIds = useRef<number[]>([]);

    useEffect(() => {
        if (!task) return;

        setTitle(task.title ?? "");
        setFiles([]);
        setSubmitError("");
        setSuccess(false);
        setDeptEmployeesLoaded(false);
        setResolvedNames({});
        setAllDeptEmployees([]);

        const caseId =
            task.case && typeof task.case === "object"
                ? (task.case as any).id
                : task.case
                    ? Number(task.case)
                    : null;
        setSelectedCase(caseId);

        const deptId =
            task.department && typeof task.department === "object"
                ? (task.department as any).id
                : task.department
                    ? Number(task.department)
                    : null;
        setSelectedDepartment(deptId);

        const employeeIds = parseRawEmployeeIds(task.assigned_employee);
        initialEmployeeIds.current = employeeIds;
        setSelectedEmployees(employeeIds);
        console.log(
            "[EditTaskModal] task.assigned_employee raw:",
            task.assigned_employee,
            "| parsed employeeIds:",
            employeeIds
        );

        const taskFiles = task.files || [];
        if (Array.isArray(taskFiles)) {
            const mappedFiles = (taskFiles as any[])
                .map((f) => {
                    if (typeof f === "string") return { file: f };
                    return {
                        id: f?.id,
                        file: f?.file || f?.url || f?.attachment,
                        name: f?.name,
                    };
                })
                .filter((f) => f.file);
            setExistingFiles(mappedFiles);
        } else {
            setExistingFiles([]);
        }

        axiosInstance
            .get(apiRoutes.cases)
            .then((res) => setCases(getListData<CaseItem>(res.data)))
            .catch(() => { });

        axiosInstance
            .get("/department/api/v1/department_employee/list/")
            .then((res) => {
                const list = getListData<DepartmentEmployee>(res.data);
                console.log(
                    "[EditTaskModal] dept employee list loaded, count:",
                    list.length
                );

                const pending = initialEmployeeIds.current;
                console.log(
                    "[EditTaskModal] checking pending selectedEmployees:",
                    pending
                );

                const listEmployeeIds = list.map((e) => e.employee);
                console.log(
                    "[EditTaskModal] employee ids in dept list:",
                    listEmployeeIds
                );

                const missingIds = pending.filter(
                    (id) => !list.some((e) => e.employee === id)
                );
                console.log(
                    "[EditTaskModal] missingIds (not in dept list):",
                    missingIds
                );

                setAllDeptEmployees(list);
                setDeptEmployeesLoaded(true);

                if (missingIds.length === 0) return;

                Promise.allSettled(
                    missingIds.map((id) =>
                        axiosInstance.get(`/accounts/api/v1/employee/${id}/`)
                    )
                ).then((results) => {
                    setResolvedNames((prev) => {
                        const next = { ...prev };
                        results.forEach((r, idx) => {
                            if (r.status === "fulfilled") {
                                const name = extractEmployeeName(
                                    r.value.data,
                                    missingIds[idx]
                                );
                                console.log(
                                    `[EditTaskModal] resolved missing employee id=${missingIds[idx]} name="${name}"`
                                );
                                next[missingIds[idx]] = name;
                            } else {
                                console.warn(
                                    `[EditTaskModal] failed to resolve employee id=${missingIds[idx]}`
                                );
                            }
                        });
                        return next;
                    });
                });
            })
            .catch(() => {
                setAllDeptEmployees([]);
                setDeptEmployeesLoaded(true);
            });
    }, [task]);

    const filteredEmpOptions = useMemo((): Option[] => {
        if (!deptEmployeesLoaded) return [];

        const deptFiltered = selectedDepartment
            ? allDeptEmployees.filter((e) => e.department === selectedDepartment)
            : allDeptEmployees;

        const inDeptIds = new Set(deptFiltered.map((e) => e.employee));

        const extraSelected = selectedEmployees
            .filter((id) => !inDeptIds.has(id))
            .map((id) => {
                const foundInAll = allDeptEmployees.find((e) => e.employee === id);
                if (foundInAll) {
                    return {
                        id: foundInAll.employee,
                        label: foundInAll.employee_name,
                        sub: foundInAll.department_name || undefined,
                    } as Option;
                }
                return {
                    id,
                    label: resolvedNames[id] || `کارمند ${id}`,
                    sub: undefined,
                } as Option;
            });

        const deptOptions: Option[] = deptFiltered.map((e) => ({
            id: e.employee,
            label: e.employee_name,
            sub: e.department_name || undefined,
        }));

        const seen = new Set<number>();
        const merged: Option[] = [];

        for (const o of [...deptOptions, ...extraSelected]) {
            if (!seen.has(o.id)) {
                seen.add(o.id);
                merged.push(o);
            }
        }

        console.log(
            "[EditTaskModal] filteredEmpOptions count:",
            merged.length,
            "| selectedEmployees:",
            selectedEmployees,
            "| ids in options:",
            merged.map((o) => o.id)
        );

        return merged;
    }, [
        allDeptEmployees,
        deptEmployeesLoaded,
        selectedDepartment,
        selectedEmployees,
        resolvedNames,
    ]);

    const caseOptions = useMemo(
        () =>
            cases.map((item) => {
                const customerId =
                    item.customer && typeof item.customer === "object"
                        ? (item.customer as any).id
                        : item.customer;
                const customer = customers.find(
                    (c) => Number(c.id) === Number(customerId)
                );
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
            departments.map((d) => ({
                id: Number(d.id),
                label: d.name,
            })),
        [departments]
    );

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
            const payload = {
                title: title.trim(),
                case: selectedCase,
                department: selectedDepartment,
                assigned_employee: selectedEmployees,
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
    const selectedDeptObj =
        departments.find((d) => Number(d.id) === selectedDepartment) ?? null;

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
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <ClipboardList size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    ویرایش وظیفه
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    {task.title}
                                </p>
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
                                    <ChevronLeft
                                        size={11}
                                        className="text-gray-300 dark:text-white/20"
                                    />
                                    <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                        <Users size={11} />
                                        {selectedDeptObj.name}
                                    </span>
                                </>
                            )}
                            {selectedEmployees.length > 0 && (
                                <>
                                    <ChevronLeft
                                        size={11}
                                        className="text-gray-300 dark:text-white/20"
                                    />
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
                                        <AlertCircle
                                            size={14}
                                            className="mt-0.5 shrink-0 text-red-500"
                                        />
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
                                onChange={() => { }}
                                disabled={true}
                            />

                            <NiceSelect
                                label="دپارتمان"
                                placeholder="انتخاب دپارتمان"
                                emptyText="دپارتمانی یافت نشد"
                                options={deptOptions}
                                value={selectedDepartment}
                                onChange={() => { }}
                                disabled={true}
                            />

                            <NiceSelect
                                label="کارمندان مسئول"
                                placeholder={
                                    selectedDepartment
                                        ? "انتخاب کارمند"
                                        : "ابتدا دپارتمان را انتخاب کنید"
                                }
                                emptyText="کارمندی در این دپارتمان نیست"
                                disabled={!selectedDepartment || !deptEmployeesLoaded}
                                multiple={true}
                                options={filteredEmpOptions}
                                value={selectedEmployees}
                                onChange={(ids) => {
                                    setSelectedEmployees(ids as number[]);
                                    setSubmitError("");
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
                                                <Paperclip
                                                    size={12}
                                                    className="shrink-0 text-gray-400"
                                                />
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
                                                    <Paperclip
                                                        size={12}
                                                        className="shrink-0 text-gray-400"
                                                    />
                                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">
                                                        {f.name}
                                                    </span>
                                                    <span className="shrink-0 text-[10.5px] font-bold text-gray-400">
                                                        {getFileSize(f.size)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFiles((prev) =>
                                                                prev.filter((_, idx) => idx !== i)
                                                            )
                                                        }
                                                        className="shrink-0 rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
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

                    <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-8 py-6 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting || success}
                            className="h-[48px] rounded-2xl px-6 text-[12.5px] font-bold text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-500 disabled:opacity-40 dark:hover:bg-white/[0.03]"
                        >
                            انصراف
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex h-[48px] min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-[12.5px] font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-40"
                        >
                            {submitting ? (
                                <Loader className="animate-spin" size={15} />
                            ) : (
                                "ذخیره تغییرات"
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
