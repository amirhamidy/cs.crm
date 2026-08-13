"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Upload,
    Users,
    FolderOpen,
    Check,
    Loader,
    ClipboardList,
    Search,
    Paperclip,
    AlertCircle,
    UserPlus,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

interface Customer {
    id: number;
    full_name: string;
    phone: string;
}

interface Case {
    id: number;
    title: string;
    customer: number;
}

interface Department {
    id: number;
    name: string;
}

interface DepartmentEmployee {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Option {
    id: number;
    label: string;
    sub?: string;
}

const STEP_TITLES = ["انتخاب مشتری", "انتخاب پرونده", "جزئیات وظیفه"];
const STEP_SUBS = [
    "مرحله ۱ از ۳ — مشتری مورد نظر",
    "مرحله ۲ از ۳ — پرونده مرتبط",
    "مرحله ۳ از ۳ — اطلاعات و ارجاع",
];

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

function PickCard({
    title,
    subtitle,
    seed,
    active,
    onClick,
    index,
}: {
    title: string;
    subtitle: string;
    seed: number;
    active: boolean;
    onClick: () => void;
    index: number;
}) {
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            whileTap={{ scale: 0.985 }}
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-[1.25rem] border px-3.5 py-3 text-right transition-all duration-200 ${active
                ? "border-blue-500 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/[0.08]"
                : "border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.04]"
                }`}
        >
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                    seed
                )}`}
            >
                {initialOf(title)}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                    {title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-gray-400">{subtitle}</span>
            </span>
            <AnimatePresence>
                {active && (
                    <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600"
                    >
                        <Check size={11} className="text-white" strokeWidth={3} />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: Props) {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [selectedCase, setSelectedCase] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    const [title, setTitle] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCases, setLoadingCases] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setLoadingCustomers(true);
        axiosInstance
            .get("/customers/api/v1/customers/")
            .then((r) => setCustomers(r.data.results ?? r.data))
            .catch(() => setCustomers([]))
            .finally(() => setLoadingCustomers(false));

        axiosInstance
            .get("/department/api/v1/department/list/")
            .then((r) => setDepartments(r.data.results ?? r.data))
            .catch(() => setDepartments([]));

        axiosInstance
            .get("/department/api/v1/department_employee/list/")
            .then((r) => setEmployees(r.data.results ?? r.data))
            .catch(() => setEmployees([]));
    }, [isOpen]);

    useEffect(() => {
        if (selectedCustomer === null) return;
        setLoadingCases(true);
        setCases([]);
        setSelectedCase(null);
        axiosInstance
            .get(`/tasks/api/v1/cases/?customer=${selectedCustomer}`)
            .then((r) => {
                const data = r.data.results ?? r.data;
                setCases(data);
            })
            .catch(() => setCases([]))
            .finally(() => setLoadingCases(false));
    }, [selectedCustomer]);

    useEffect(() => {
        setSelectedEmployees([]);
    }, [selectedDepartment]);

    const filteredCustomers = useMemo(() => {
        const q = customerQuery.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter(
            (c) =>
                c.full_name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
        );
    }, [customers, customerQuery]);

    const filteredEmployees = useMemo(
        () =>
            selectedDepartment
                ? employees.filter((e) => e.department === selectedDepartment)
                : employees,
        [employees, selectedDepartment]
    );

    const selectedCustomerObj = customers.find((c) => c.id === selectedCustomer) ?? null;
    const selectedCaseObj = cases.find((c) => c.id === selectedCase) ?? null;

    const canGoNext =
        (step === 0 && selectedCustomer !== null) || (step === 1 && selectedCase !== null);

    const canSubmit =
        title.trim().length > 0 &&
        selectedCase !== null &&
        selectedDepartment !== null &&
        selectedEmployees.length > 0 &&
        !submitting;

    function resetAll() {
        setStep(0);
        setSelectedCustomer(null);
        setSelectedCase(null);
        setSelectedDepartment(null);
        setSelectedEmployees([]);
        setTitle("");
        setFiles([]);
        setSubmitError("");
        setCustomerQuery("");
    }

    function handleClose() {
        if (submitting) return;
        resetAll();
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
            const formData = new FormData();
            formData.append("title", title);
            formData.append("case", String(selectedCase));
            formData.append("department", String(selectedDepartment));
            selectedEmployees.forEach((id) => {
                formData.append("assigned_employee", String(id));
            });
            files.forEach((f) => formData.append("files", f));
            await axiosInstance.post("/tasks/api/v1/tasks/create/", formData);
            onSuccess();
            resetAll();
            onClose();
        } catch (err) {
            const e = err as { response?: { data?: unknown } };
            setSubmitError(parseBackendError(e.response?.data));
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
                                    {STEP_TITLES[step]}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">{STEP_SUBS[step]}</p>
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

                    <div className="flex shrink-0 gap-1.5 px-8 pb-5">
                        {[0, 1, 2].map((s) => (
                            <div
                                key={s}
                                className="h-1 flex-1 rounded-full bg-gray-100 transition-all duration-300 dark:bg-white/[0.07]"
                                style={
                                    step >= s
                                        ? { background: "linear-gradient(90deg,#3b82f6,#60a5fa)" }
                                        : undefined
                                }
                            />
                        ))}
                    </div>

                    <AnimatePresence initial={false}>
                        {(selectedCustomerObj || selectedCaseObj) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="shrink-0 overflow-hidden"
                            >
                                <div className="flex flex-wrap items-center gap-1.5 px-8 pb-4">
                                    {selectedCustomerObj && (
                                        <span className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                            <Users size={11} />
                                            {selectedCustomerObj.full_name}
                                        </span>
                                    )}
                                    {selectedCaseObj && (
                                        <>
                                            <ChevronLeft size={11} className="text-gray-300 dark:text-white/20" />
                                            <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                                <FolderOpen size={11} />
                                                {selectedCaseObj.title} 
                                            </span>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div
                                    key="step0"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3.5 py-2.5 dark:bg-white/[0.03]">
                                        <Search size={14} className="shrink-0 text-gray-400" />
                                        <input
                                            value={customerQuery}
                                            onChange={(e) => setCustomerQuery(e.target.value)}
                                            placeholder="جستجوی نام یا شماره مشتری"
                                            className="w-full bg-transparent text-[12.5px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                        />
                                    </div>

                                    {loadingCustomers ? (
                                        <div className="flex flex-col items-center justify-center gap-4 py-14">
                                            <Loader size={17} className="animate-spin text-blue-500" />
                                            <span className="text-[12px] text-gray-400">در حال دریافت مشتریان</span>
                                        </div>
                                    ) : filteredCustomers.length === 0 ? (
                                        <p className="py-14 text-center text-[12.5px] text-gray-400">
                                            مشتری‌ای یافت نشد
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filteredCustomers.map((c, i) => (
                                                <PickCard
                                                    key={c.id}
                                                    index={i}
                                                    seed={c.id}
                                                    title={c.full_name}
                                                    subtitle={c.phone}
                                                    active={selectedCustomer === c.id}
                                                    onClick={() => setSelectedCustomer(c.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-2"
                                >
                                    {loadingCases ? (
                                        <div className="flex flex-col items-center justify-center gap-4 py-14">
                                            <Loader size={17} className="animate-spin text-blue-500" />
                                            <span className="text-[12px] text-gray-400">در حال دریافت پرونده‌ها</span>
                                        </div>
                                    ) : cases.length === 0 ? (
                                        <p className="py-14 text-center text-[12.5px] text-gray-400">
                                            پرونده‌ای برای این مشتری ثبت نشده
                                        </p>
                                    ) : (
                                        cases.map((c, i) => (
                                            <PickCard
                                                key={c.id}
                                                index={i}
                                                seed={c.id + 3}
                                                title={c.title}
                                                active={selectedCase === c.id}
                                                onClick={() => setSelectedCase(c.id)}
                                            />
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-4"
                                >
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

                                    <FloatingInput
                                        id="task_title"
                                        label="عنوان وظیفه"
                                        value={title}
                                        onChange={(v) => {
                                            setTitle(v);
                                            setSubmitError("");
                                        }}
                                    />

                                    <NiceSelect
                                        label="دپارتمان"
                                        placeholder="انتخاب دپارتمان"
                                        emptyText="دپارتمانی یافت نشد"
                                        options={departments.map((d) => ({ id: d.id, label: d.name }))}
                                        value={selectedDepartment}
                                        onChange={(id) => {
                                            setSelectedDepartment(id as number);
                                            setSelectedEmployees([]);
                                            setSubmitError("");
                                        }}
                                    />

                                    <NiceSelect
                                        label="کارمندان مسئول"
                                        placeholder={selectedDepartment ? "انتخاب کارمند" : "ابتدا دپارتمان را انتخاب کنید"}
                                        emptyText="کارمندی در این دپارتمان نیست"
                                        disabled={!selectedDepartment}
                                        multiple={true}
                                        options={filteredEmployees.map((e) => ({
                                            id: e.employee,
                                            label: e.employee_name,
                                            sub: e.department_name,
                                        }))}
                                        value={selectedEmployees}
                                        onChange={(ids) => {
                                            setSelectedEmployees(ids as number[]);
                                            setSubmitError("");
                                        }}
                                    />

                                    <div>
                                        <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                            فایل‌ها (اختیاری)
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                                <Upload size={14} />
                                            </span>
                                            <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                                {files.length > 0 ? `${files.length} فایل انتخاب شد` : "افزودن فایل"}
                                            </span>
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={(e) =>
                                                    setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
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
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setFiles((prev) => prev.filter((_, j) => j !== i))
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            disabled={step === 0 || submitting}
                            className="flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-0 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <ChevronRight size={14} />
                            قبلی
                        </button>

                        {step < 2 ? (
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setStep((s) => s + 1)}
                                disabled={!canGoNext}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                            >
                                ادامه
                                <ChevronLeft size={14} />
                            </motion.button>
                        ) : (
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                            >
                                {submitting ? (
                                    <Loader size={15} className="animate-spin" />
                                ) : (
                                    <>
                                        <Check size={14} strokeWidth={3} />
                                        ثبت وظیفه
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}