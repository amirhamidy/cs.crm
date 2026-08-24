"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    ChevronDown,
    ClipboardList,
    Loader,
    Search,
    X,
    AlertCircle,
    UserPlus,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

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

interface CreateInternalTaskModalProps {
    isOpen: boolean;
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

function FloatingInput({
    label,
    id,
    value,
    onChange,
    textarea = false,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (value: string) => void;
    textarea?: boolean;
}) {
    if (textarea) {
        return (
            <div className="relative">
                <textarea
                    id={id}
                    placeholder=" "
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={3}
                    className="peer w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                />

                <label
                    htmlFor={id}
                    className="pointer-events-none absolute right-4 top-3 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]"
                >
                    {label}
                </label>
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                placeholder=" "
                value={value}
                onChange={(event) => onChange(event.target.value)}
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

    const uniqueOptions = useMemo(() => {
        const optionsMap = new Map<number, Option>();

        options.forEach((option) => {
            const optionId = Number(option.id);

            if (!optionId || optionsMap.has(optionId)) {
                return;
            }

            optionsMap.set(optionId, {
                ...option,
                id: optionId,
            });
        });

        return Array.from(optionsMap.values());
    }, [options]);

    const selectedSet = useMemo(() => {
        const selectedValues = Array.isArray(value)
            ? value
            : value !== null && value !== undefined
                ? [value]
                : [];

        return new Set(selectedValues.map(Number));
    }, [value]);

    const selectedOptions = useMemo(() => {
        return uniqueOptions.filter((option) =>
            selectedSet.has(Number(option.id))
        );
    }, [uniqueOptions, selectedSet]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery("");
        }
    }, [open]);

    useEffect(() => {
        if (disabled) {
            setOpen(false);
        }
    }, [disabled]);

    const visibleOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return uniqueOptions;
        }

        return uniqueOptions.filter((option) =>
            option.label.toLowerCase().includes(normalizedQuery)
        );
    }, [uniqueOptions, query]);

    function handleSelect(id: number) {
        const normalizedId = Number(id);

        if (!multiple) {
            onChange(normalizedId);
            setOpen(false);
            return;
        }

        const currentValues = Array.isArray(value)
            ? value.map(Number)
            : [];

        if (selectedSet.has(normalizedId)) {
            onChange(
                currentValues.filter(
                    (currentId) => currentId !== normalizedId
                )
            );

            return;
        }

        onChange([...currentValues, normalizedId]);
    }

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

                    setOpen((current) => !current);
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
                            <UserPlus
                                size={13}
                                className="text-gray-400"
                            />
                        ) : (
                            <ChevronDown
                                size={13}
                                className="text-gray-400"
                            />
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
                            {selectedOptions
                                .map((option) => option.label)
                                .join("، ")}
                        </span>
                    )}
                </span>

                {!disabled && (
                    <motion.span
                        animate={{
                            rotate: open ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown
                            size={14}
                            className="shrink-0 text-gray-400"
                        />
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && !disabled && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -6,
                            scale: 0.97,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: -4,
                            scale: 0.97,
                        }}
                        transition={{
                            type: "spring",
                            damping: 24,
                            stiffness: 340,
                        }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        {uniqueOptions.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search
                                        size={13}
                                        className="shrink-0 text-gray-400"
                                    />

                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visibleOptions.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">
                                    {emptyText}
                                </p>
                            ) : (
                                visibleOptions.map((option, index) => {
                                    const active = selectedSet.has(
                                        Number(option.id)
                                    );

                                    return (
                                        <motion.button
                                            key={`employee-option-${option.id}`}
                                            type="button"
                                            initial={{
                                                opacity: 0,
                                                x: 6,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                            }}
                                            transition={{
                                                delay: index * 0.02,
                                            }}
                                            onClick={() =>
                                                handleSelect(option.id)
                                            }
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                ? "bg-blue-50 dark:bg-blue-500/10"
                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    option.id
                                                )}`}
                                            >
                                                {initialOf(option.label)}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>

                                                {option.sub && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {option.sub}
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

export default function CreateInternalTaskModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateInternalTaskModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [selectedEmployees, setSelectedEmployees] = useState<number[]>(
        []
    );

    const [departmentEmployees, setDepartmentEmployees] = useState<
        DepartmentEmployee[]
    >([]);

    const [loadingEmployees, setLoadingEmployees] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        setLoadingEmployees(true);

        axiosInstance
            .get("/department/api/v1/department_employee/list/")
            .then((response) => {
                if (!isMounted) return;

                const data = response.data;

                const list = Array.isArray(data)
                    ? data
                    : data?.results ?? [];

                setDepartmentEmployees(
                    Array.isArray(list) ? list : []
                );
            })
            .catch(() => {
                if (!isMounted) return;

                setDepartmentEmployees([]);
            })
            .finally(() => {
                if (!isMounted) return;

                setLoadingEmployees(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    const employeeOptions = useMemo((): Option[] => {
        const employeesMap = new Map<
            number,
            {
                label: string;
                departments: Set<string>;
            }
        >();

        departmentEmployees.forEach((employee) => {
            const employeeId = Number(employee.employee);

            if (!employeeId) return;

            const existingEmployee = employeesMap.get(employeeId);

            if (existingEmployee) {
                if (employee.department_name) {
                    existingEmployee.departments.add(
                        employee.department_name
                    );
                }

                return;
            }

            employeesMap.set(employeeId, {
                label: employee.employee_name,
                departments: new Set(
                    employee.department_name
                        ? [employee.department_name]
                        : []
                ),
            });
        });

        return Array.from(employeesMap.entries()).map(
            ([id, employee]) => ({
                id,
                label: employee.label,
                sub: Array.from(employee.departments).join("، "),
            })
        );
    }, [departmentEmployees]);

    const canSubmit =
        title.trim().length > 0 &&
        selectedEmployees.length > 0 &&
        !submitting;

    function resetAll() {
        setTitle("");
        setDescription("");
        setSelectedEmployees([]);
        setSubmitError("");
    }

    function handleClose() {
        if (submitting) return;

        resetAll();
        onClose();
    }

    function parseBackendError(data: unknown): string {
        if (!data) {
            return "خطایی رخ داد. دوباره تلاش کنید.";
        }

        if (typeof data === "string") {
            return data;
        }

        if (Array.isArray(data)) {
            return String(data[0]);
        }

        if (typeof data === "object") {
            const values = Object.values(
                data as Record<string, unknown>
            );

            const firstValue = values[0];

            if (Array.isArray(firstValue)) {
                return String(firstValue[0]);
            }

            if (typeof firstValue === "string") {
                return firstValue;
            }
        }

        return "خطایی رخ داد. دوباره تلاش کنید.";
    }

    async function handleSubmit() {
        if (!canSubmit) return;

        setSubmitError("");
        setSubmitting(true);

        try {
            await axiosInstance.post(
                "/tasks/api/v1/internal-tasks/create/",
                {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    status: "in_progress",
                    assigned_to: selectedEmployees,
                }
            );

            onSuccess();
            resetAll();
            onClose();
        } catch (error) {
            const requestError = error as {
                response?: {
                    data?: unknown;
                };
            };

            setSubmitError(
                parseBackendError(requestError.response?.data)
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(3px)",
                }}
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{
                        duration: 0.35,
                        ease: "easeOut",
                    }}
                    onClick={(event) => event.stopPropagation()}
                    dir="rtl"
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                >
                    <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <ClipboardList
                                    size={15}
                                    className="text-blue-500"
                                />
                            </div>

                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    ایجاد وظیفه درون سازمانی
                                </h3>

                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    عنوان، توضیحات و مسئولین
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {submitError && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: 6,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: 4,
                                        }}
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
                                            onClick={() =>
                                                setSubmitError("")
                                            }
                                            className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                        >
                                            <X size={13} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <NiceSelect
                                label="کارمندان مسئول"
                                placeholder={
                                    loadingEmployees
                                        ? "در حال بارگذاری..."
                                        : "انتخاب کارمند"
                                }
                                emptyText="کارمندی یافت نشد"
                                disabled={loadingEmployees}
                                multiple
                                options={employeeOptions}
                                value={selectedEmployees}
                                onChange={(ids) => {
                                    const normalizedIds = Array.isArray(ids)
                                        ? Array.from(
                                            new Set(ids.map(Number))
                                        )
                                        : [];

                                    setSelectedEmployees(normalizedIds);
                                    setSubmitError("");
                                }}
                            />

                            <FloatingInput
                                id="internal_task_title"
                                label="عنوان وظیفه"
                                value={title}
                                onChange={(value) => {
                                    setTitle(value);
                                    setSubmitError("");
                                }}
                            />

                            <FloatingInput
                                id="internal_task_description"
                                label="توضیحات (اختیاری)"
                                value={description}
                                textarea
                                onChange={(value) => {
                                    setDescription(value);
                                    setSubmitError("");
                                }}
                            />


                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                        >
                            {submitting ? (
                                <Loader
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <>
                                    <Check
                                        size={14}
                                        strokeWidth={3}
                                    />
                                    ثبت وظیفه
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
