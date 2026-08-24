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
    AlertCircle,
    UserPlus,
    Users,
    FolderOpen,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { Task } from "@/types/task";
import type { Department } from "@/types/department";
import type { Customer } from "@/types/customer";

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

interface EditInternalTaskModalProps {
    task: Task | null;
    customers: Customer[];
    departments: Department[];
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

function extractEmployeeName(data: any, id: number): string {
    const fullName =
        data?.full_name ||
        data?.username ||
        `کارمند ${id}`;
    return fullName;
}

function FloatingInput({
    label,
    id,
    value,
    onChange,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
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

export default function EditInternalTaskModal({
    task,
    customers,
    departments,
    onClose,
    onSuccess,
}: EditInternalTaskModalProps) {
    const [title, setTitle] = useState("");
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [allDeptEmployees, setAllDeptEmployees] = useState<DepartmentEmployee[]>([]);
    const [deptEmployeesLoaded, setDeptEmployeesLoaded] = useState(false);
    const [resolvedNames, setResolvedNames] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);

    const initialEmployeeIds = useRef<number[]>([]);

    useEffect(() => {
        if (!task) return;

        setTitle(task.title ?? "");
        setSubmitError("");
        setSuccess(false);
        setDeptEmployeesLoaded(false);
        setResolvedNames({});
        setAllDeptEmployees([]);

        const employeeIds = parseRawEmployeeIds((task as any).assigned_to);
        initialEmployeeIds.current = employeeIds;
        setSelectedEmployees(employeeIds);

        axiosInstance
            .get("/department/api/v1/department_employee/list/")
            .then((res) => {
                const data = res.data;
                const list = Array.isArray(data) ? data : data?.results ?? [];
                setAllDeptEmployees(list);
                setDeptEmployeesLoaded(true);

                const pending = initialEmployeeIds.current;
                const listEmployeeIds = new Set(list.map((e : any) => e.employee));
                const missingIds = pending.filter((id) => !listEmployeeIds.has(id));

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
                                next[missingIds[idx]] = name;
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

        const inDeptIds = new Set(allDeptEmployees.map((e) => e.employee));

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

        const deptOptions: Option[] = allDeptEmployees.map((e) => ({
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

        return merged;
    }, [allDeptEmployees, deptEmployeesLoaded, selectedEmployees, resolvedNames]);

    const canSubmit = title.trim().length > 0 && selectedEmployees.length > 0 && !submitting;

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
            await axiosInstance.patch(`/tasks/api/v1/internal-tasks/${task!.id}/`, {
                title: title.trim(),
                assigned_to: selectedEmployees,
            });

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

    if (!task) return null;

    const assignedTo = (task as any).assigned_to;
    const employeeCount = Array.isArray(assignedTo) ? assignedTo.length : 0;

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
                                    ویرایش وظیفه درون سازمانی
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
                            {employeeCount > 0 && (
                                <>
                                    <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                        <UserPlus size={11} />
                                        {employeeCount} کارمند
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
                                id="edit_internal_task_title"
                                label="عنوان وظیفه"
                                value={title}
                                onChange={(v) => {
                                    setTitle(v);
                                    setSubmitError("");
                                }}
                            />

                            <NiceSelect
                                label="کارمندان مسئول"
                                placeholder={
                                    deptEmployeesLoaded
                                        ? "انتخاب کارمند"
                                        : "در حال بارگذاری..."
                                }
                                emptyText="کارمندی یافت نشد"
                                disabled={!deptEmployeesLoaded}
                                multiple={true}
                                options={filteredEmpOptions}
                                value={selectedEmployees}
                                onChange={(ids) => {
                                    setSelectedEmployees(ids as number[]);
                                    setSubmitError("");
                                }}
                            />
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