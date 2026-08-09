"use client";

import {
    useEffect,
    useMemo,
    useState,
    forwardRef,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Check,
    Plus,
    Trash2,
    Briefcase,
    FolderKanban,
    Building2,
    User2,
    FileText,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { Customer } from "@/types/customer";

interface CaseItem {
    id: number;
    title: string;
    customer: number;
    description?: string;
}

interface Department {
    id: number;
    name: string;
    order?: number;
    created_at?: string;
    updated_at?: string;
}

interface DepartmentEmployee {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
    created_at?: string;
    updated_at?: string;
}

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <input
                ref={ref}
                id={id}
                placeholder=" "
                className={`
          peer w-full rounded-2xl border border-gray-200
          bg-white px-4 py-3 text-sm text-black outline-none
          transition-all duration-200
          focus:border-blue-500
          [&:not(:placeholder-shown)]:border-blue-500
          dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
          dark:focus:border-violet-500
          dark:[&:not(:placeholder-shown)]:border-violet-500
          ${className}
        `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
          absolute right-4 top-1/2 -translate-y-1/2
          text-sm text-gray-400 pointer-events-none
          transition-all duration-200
          bg-white dark:bg-[#0f1117] px-1 rounded
          peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-blue-500
          peer-[:not(:placeholder-shown)]:top-0
          peer-[:not(:placeholder-shown)]:text-[11px]
          peer-[:not(:placeholder-shown)]:text-blue-500
          dark:peer-focus:text-violet-400
          dark:peer-[:not(:placeholder-shown)]:text-violet-400
        "
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <textarea
                ref={ref}
                id={id}
                placeholder=" "
                rows={4}
                className={`
          peer w-full rounded-2xl border border-gray-200
          bg-white px-4 py-3 text-sm text-black outline-none
          transition-all duration-200 resize-none
          focus:border-blue-500
          [&:not(:placeholder-shown)]:border-blue-500
          dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
          dark:focus:border-violet-500
          dark:[&:not(:placeholder-shown)]:border-violet-500
          ${className}
        `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
          absolute right-4 top-4
          text-sm text-gray-400 pointer-events-none
          transition-all duration-200
          bg-white dark:bg-[#0f1117] px-1 rounded
          peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-blue-500
          peer-[:not(:placeholder-shown)]:top-0
          peer-[:not(:placeholder-shown)]:text-[11px]
          peer-[:not(:placeholder-shown)]:text-blue-500
          dark:peer-focus:text-violet-400
          dark:peer-[:not(:placeholder-shown)]:text-violet-400
        "
            >
                {label}
            </label>
        </div>
    )
);
FloatingTextarea.displayName = "FloatingTextarea";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const steps = [
    { id: 0, title: "مشتری", icon: User2 },
    { id: 1, title: "پرونده", icon: FolderKanban },
    { id: 2, title: "تنظیمات تسک", icon: Briefcase },
] as const;

const EMPTY_CASE_FORM = {
    title: "",
    description: "",
};

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: Props) {
    const [step, setStep] = useState(0);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentEmployees, setDepartmentEmployees] = useState<DepartmentEmployee[]>([]);

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCases, setLoadingCases] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [creatingCase, setCreatingCase] = useState(false);
    const [deletingCaseId, setDeletingCaseId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [selectedCase, setSelectedCase] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [files, setFiles] = useState<File[]>([]);


    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [showCreateCase, setShowCreateCase] = useState(false);
    const [caseForm, setCaseForm] = useState(EMPTY_CASE_FORM);

    const [error, setError] = useState<string | null>(null);
    const [caseError, setCaseError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep(0);
            setCustomers([]);
            setCases([]);
            setDepartments([]);
            setDepartmentEmployees([]);
            setSelectedCustomer(null);
            setSelectedCase(null);
            setSelectedDepartment(null);
            setSelectedEmployee(null);
            setTitle("");
            setDescription("");
            setShowCreateCase(false);
            setCaseForm(EMPTY_CASE_FORM);
            setError(null);
            setCaseError(null);
            return;
        }

        const fetchCustomers = async () => {
            setLoadingCustomers(true);
            try {
                const res = await axiosInstance.get<Customer[]>("/customers/api/v1/customers/");
                setCustomers(res.data);
            } catch {
                setCustomers([]);
            } finally {
                setLoadingCustomers(false);
            }
        };

        fetchCustomers();
    }, [isOpen]);

    useEffect(() => {
        if (selectedCustomer === null) {
            setCases([]);
            setSelectedCase(null);
            return;
        }

        const fetchCases = async () => {
            setLoadingCases(true);
            setSelectedCase(null);
            setCases([]);
            try {
                const res = await axiosInstance.get<CaseItem[]>(
                    `/tasks/api/v1/cases/?customer=${selectedCustomer}`
                );
                setCases(res.data);
            } catch {
                setCases([]);
            } finally {
                setLoadingCases(false);
            }
        };

        fetchCases();
    }, [selectedCustomer]);

    useEffect(() => {
        if (step !== 2) return;

        const fetchDepartments = async () => {
            setLoadingDepartments(true);
            try {
                const res = await axiosInstance.get<Department[]>(
                    "/department/api/v1/department/list/"
                );
                setDepartments(res.data);
            } catch {
                setDepartments([]);
            } finally {
                setLoadingDepartments(false);
            }
        };

        if (departments.length === 0) {
            fetchDepartments();
        }
    }, [step, departments.length]);

    useEffect(() => {
        if (selectedDepartment === null) {
            setDepartmentEmployees([]);
            setSelectedEmployee(null);
            return;
        }

        const fetchDepartmentEmployees = async () => {
            setLoadingEmployees(true);
            setSelectedEmployee(null);
            try {
                const res = await axiosInstance.get<DepartmentEmployee[]>(
                    "/department/api/v1/department_employee/list/"
                );
                setDepartmentEmployees(
                    res.data.filter((item) => item.department === selectedDepartment)
                );
            } catch {
                setDepartmentEmployees([]);
            } finally {
                setLoadingEmployees(false);
            }
        };

        fetchDepartmentEmployees();
    }, [selectedDepartment]);

    const selectedCustomerData = useMemo(
        () => customers.find((item) => item.id === selectedCustomer) ?? null,
        [customers, selectedCustomer]
    );

    const selectedCaseData = useMemo(
        () => cases.find((item) => item.id === selectedCase) ?? null,
        [cases, selectedCase]
    );

    const selectedDepartmentData = useMemo(
        () => departments.find((item) => item.id === selectedDepartment) ?? null,
        [departments, selectedDepartment]
    );

    const selectedEmployeeData = useMemo(
        () =>
            departmentEmployees.find((item) => item.employee === selectedEmployee) ?? null,
        [departmentEmployees, selectedEmployee]
    );

    const canGoNext =
        (step === 0 && selectedCustomer !== null) ||
        (step === 1 && selectedCase !== null);

    const canSubmit =
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        selectedCase !== null &&
        selectedDepartment !== null &&
        selectedEmployee !== null &&
        !submitting;

    const handleClose = () => {
        onClose();
    };

    const refreshCases = async (customerId: number) => {
        const res = await axiosInstance.get<CaseItem[]>(
            `/tasks/api/v1/cases/?customer=${customerId}`
        );
        setCases(res.data);
    };

    const handleCreateCase = async () => {
        if (!selectedCustomer) {
            setCaseError("اول مشتری را انتخاب کن.");
            return;
        }

        if (!caseForm.title.trim()) {
            setCaseError("عنوان پرونده اجباری است.");
            return;
        }

        setCreatingCase(true);
        setCaseError(null);

        try {
            await axiosInstance.post("/tasks/api/v1/cases/create/", {
                title: caseForm.title.trim(),
                description: caseForm.description.trim(),
                customer: selectedCustomer,
            });

            await refreshCases(selectedCustomer);

            setCaseForm(EMPTY_CASE_FORM);
            setShowCreateCase(false);
        } catch {
            setCaseError("خطا در ساخت پرونده. دوباره امتحان کن.");
        } finally {
            setCreatingCase(false);
        }
    };

    const handleDeleteCase = async (caseId: number) => {
        if (!selectedCustomer) return;

        setDeletingCaseId(caseId);
        setCaseError(null);

        try {
            await axiosInstance.delete(`/tasks/api/v1/cases/${caseId}/delete/`);
            await refreshCases(selectedCustomer);

            if (selectedCase === caseId) {
                setSelectedCase(null);
            }
        } catch {
            setCaseError("خطا در حذف پرونده. دوباره امتحان کن.");
        } finally {
            setDeletingCaseId(null);
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("description", description.trim());
            formData.append("case", String(selectedCase));
            formData.append("department", String(selectedDepartment));
            formData.append("assigned_employee", String(selectedEmployee));

            files.forEach((file) => {
                formData.append("files", file);
            });

            await axiosInstance.post("/tasks/api/v1/tasks/create/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            onSuccess();
            onClose();
        } catch {
            setError("خطا در ثبت تسک. دوباره امتحان کن.");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 14, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="
                                w-full max-w-5xl
                                rounded-[28px]
                                border border-gray-200/80 dark:border-white/[0.08]
                                bg-white dark:bg-[#0f1117]
                                shadow-2xl
                                overflow-hidden
                                max-h-[85vh]
                                flex flex-col
                            "
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 dark:border-white/[0.08] dark:bg-[#0f1117]/95">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white sm:text-lg">
                                            ایجاد تسک جدید
                                        </h2>
                                        <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                                            انتخاب مشتری، پرونده و تنظیمات نهایی تسک
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {steps.map((item, index) => {
                                        const Icon = item.icon;
                                        const isActive = step === index;
                                        const isDone = step > index;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`
                                                    rounded-2xl border px-3 py-3 transition-all
                                                    ${isActive
                                                        ? "border-blue-500 bg-blue-50 dark:border-violet-500 dark:bg-violet-500/10"
                                                        : isDone
                                                            ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
                                                            : "border-gray-200 dark:border-white/[0.08]"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`
                                                            flex h-8 w-8 items-center justify-center rounded-full
                                                            ${isDone
                                                                ? "bg-emerald-500 text-white"
                                                                : isActive
                                                                    ? "bg-blue-600 text-white dark:bg-violet-500"
                                                                    : "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50"
                                                            }
                                                        `}
                                                    >
                                                        {isDone ? <Check size={15} /> : <Icon size={15} />}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p
                                                            className={`
                                                                truncate text-xs font-bold sm:text-sm
                                                                ${isActive
                                                                    ? "text-blue-700 dark:text-violet-300"
                                                                    : isDone
                                                                        ? "text-emerald-700 dark:text-emerald-300"
                                                                        : "text-gray-500 dark:text-white/55"
                                                                }
                                                            `}
                                                        >
                                                            {item.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                                <AnimatePresence mode="wait">
                                    {step === 0 && (
                                        <motion.div
                                            key="customers-step"
                                            initial={{ opacity: 0, x: 18 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -18 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User2 size={18} className="text-blue-600 dark:text-violet-400" />
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                                                        انتخاب مشتری
                                                    </h3>
                                                    <p className="text-xs text-gray-400 sm:text-sm">
                                                        مشتری مربوط به این تسک را انتخاب کن.
                                                    </p>
                                                </div>
                                            </div>

                                            {loadingCustomers ? (
                                                <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.08]">
                                                    <Loader2
                                                        size={24}
                                                        className="animate-spin text-blue-600 dark:text-violet-400"
                                                    />
                                                </div>
                                            ) : customers.length === 0 ? (
                                                <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                                                    مشتری‌ای برای نمایش وجود ندارد.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                    {customers.map((customer) => {
                                                        const isSelected = selectedCustomer === customer.id;

                                                        return (
                                                            <button
                                                                key={customer.id}
                                                                type="button"
                                                                onClick={() => setSelectedCustomer(customer.id)}
                                                                className={`
                                                                    group rounded-3xl border p-4 text-right transition-all
                                                                    ${isSelected
                                                                        ? "border-blue-500 bg-blue-50 shadow-sm dark:border-violet-500 dark:bg-violet-500/10"
                                                                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-violet-400/60"
                                                                    }
                                                                `}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className={`
                                                                                    flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold
                                                                                    ${isSelected
                                                                                        ? "bg-blue-600 text-white dark:bg-violet-500"
                                                                                        : "bg-blue-100 text-blue-700 dark:bg-violet-500/15 dark:text-violet-300"
                                                                                    }
                                                                                `}
                                                                            >
                                                                                {customer.full_name?.charAt(0) ?? "؟"}
                                                                            </div>

                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                                                                                    {customer.full_name}
                                                                                </p>
                                                                                <p className="mt-1 text-xs text-gray-400">
                                                                                    کد مشتری: #{customer.id}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-4 space-y-1.5">
                                                                            <p
                                                                                className="text-xs text-gray-500 dark:text-white/60"
                                                                                dir="ltr"
                                                                            >
                                                                                {customer.phone_number || "بدون شماره تماس"}
                                                                            </p>
                                                                            {customer.company_name && (
                                                                                <p className="truncate text-xs text-gray-400">
                                                                                    {customer.company_name}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-violet-500">
                                                                            <Check size={14} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {step === 1 && (
                                        <motion.div
                                            key="cases-step"
                                            initial={{ opacity: 0, x: 18 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -18 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FolderKanban
                                                        size={18}
                                                        className="text-blue-600 dark:text-violet-400"
                                                    />
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                                                            انتخاب یا ساخت پرونده
                                                        </h3>
                                                        <p className="text-xs text-gray-400 sm:text-sm">
                                                            برای مشتری انتخاب‌شده، پرونده را انتخاب کن یا جدید بساز.
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreateCase((prev) => !prev)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 dark:bg-violet-500 dark:hover:bg-violet-400"
                                                >
                                                    <Plus size={14} />
                                                    {showCreateCase ? "بستن فرم پرونده" : "پرونده جدید"}
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {showCreateCase && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]"
                                                    >
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <FileText
                                                                size={16}
                                                                className="text-blue-600 dark:text-violet-400"
                                                            />
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                ساخت پرونده جدید
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3">
                                                            <FloatingInput
                                                                id="case_title"
                                                                label="عنوان پرونده *"
                                                                value={caseForm.title}
                                                                onChange={(e) =>
                                                                    setCaseForm((prev) => ({
                                                                        ...prev,
                                                                        title: e.target.value,
                                                                    }))
                                                                }
                                                            />

                                                            <FloatingTextarea
                                                                id="case_description"
                                                                label="توضیحات پرونده"
                                                                value={caseForm.description}
                                                                onChange={(e) =>
                                                                    setCaseForm((prev) => ({
                                                                        ...prev,
                                                                        description: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </div>

                                                        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowCreateCase(false);
                                                                    setCaseForm(EMPTY_CASE_FORM);
                                                                    setCaseError(null);
                                                                }}
                                                                className="rounded-full px-4 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                                                            >
                                                                انصراف
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleCreateCase}
                                                                disabled={creatingCase}
                                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                                            >
                                                                {creatingCase && (
                                                                    <Loader2 size={15} className="animate-spin" />
                                                                )}
                                                                ثبت پرونده
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <AnimatePresence>
                                                {caseError && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="text-xs font-semibold text-red-500"
                                                    >
                                                        {caseError}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>

                                            {loadingCases ? (
                                                <div className="flex h-52 items-center justify-center rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.08]">
                                                    <Loader2
                                                        size={24}
                                                        className="animate-spin text-blue-600 dark:text-violet-400"
                                                    />
                                                </div>
                                            ) : cases.length === 0 ? (
                                                <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                                                    برای این مشتری هنوز پرونده‌ای ثبت نشده.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                    {cases.map((item) => {
                                                        const isSelected = selectedCase === item.id;
                                                        const isDeleting = deletingCaseId === item.id;

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`
                                                                    rounded-3xl border p-4 transition-all
                                                                    ${isSelected
                                                                        ? "border-blue-500 bg-blue-50 dark:border-violet-500 dark:bg-violet-500/10"
                                                                        : "border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.02]"
                                                                    }
                                                                `}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedCase(item.id)}
                                                                        className="min-w-0 flex-1 text-right"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className={`
                                                                                    flex h-9 w-9 items-center justify-center rounded-2xl
                                                                                    ${isSelected
                                                                                        ? "bg-blue-600 text-white dark:bg-violet-500"
                                                                                        : "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50"
                                                                                    }
                                                                                `}
                                                                            >
                                                                                <FolderKanban size={16} />
                                                                            </div>

                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                                                                                    {item.title}
                                                                                </p>
                                                                                <p className="mt-1 text-xs text-gray-400">
                                                                                    پرونده #{item.id}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {item.description && (
                                                                            <p className="mt-3 line-clamp-2 text-xs text-gray-500 dark:text-white/55">
                                                                                {item.description}
                                                                            </p>
                                                                        )}
                                                                    </button>

                                                                    <div className="flex items-center gap-2">
                                                                        {isSelected && (
                                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-violet-500">
                                                                                <Check size={14} />
                                                                            </div>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteCase(item.id)}
                                                                            disabled={isDeleting}
                                                                            className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
                                                                        >
                                                                            {isDeleting ? (
                                                                                <Loader2
                                                                                    size={15}
                                                                                    className="animate-spin"
                                                                                />
                                                                            ) : (
                                                                                <Trash2 size={15} />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="settings-step"
                                            initial={{ opacity: 0, x: 18 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -18 }}
                                            className="space-y-5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase
                                                    size={18}
                                                    className="text-blue-600 dark:text-violet-400"
                                                />
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                                                        تنظیمات نهایی تسک
                                                    </h3>
                                                    <p className="text-xs text-gray-400 sm:text-sm">
                                                        اطلاعات نهایی تسک و مسئول انجام را مشخص کن.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                                                <div className="space-y-3">
                                                    <FloatingInput
                                                        id="task_title"
                                                        label="عنوان تسک *"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                    />

                                                    <FloatingTextarea
                                                        id="task_description"
                                                        label="توضیحات تسک *"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                    />
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => {
                                                            const selected = e.target.files ? Array.from(e.target.files) : [];
                                                            setFiles(selected);
                                                        }}
                                                        className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500"
                                                    />

                                                    <div className="rounded-3xl border border-gray-200 p-4 dark:border-white/[0.08]">
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <Building2
                                                                size={16}
                                                                className="text-blue-600 dark:text-violet-400"
                                                            />
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                انتخاب دپارتمان
                                                            </p>
                                                        </div>

                                                        {loadingDepartments ? (
                                                            <div className="flex h-20 items-center justify-center">
                                                                <Loader2
                                                                    size={22}
                                                                    className="animate-spin text-blue-600 dark:text-violet-400"
                                                                />
                                                            </div>
                                                        ) : departments.length === 0 ? (
                                                            <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-400 dark:border-white/[0.08]">
                                                                دپارتمانی یافت نشد.
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                {departments.map((department) => {
                                                                    const isSelected =
                                                                        selectedDepartment === department.id;

                                                                    return (
                                                                        <button
                                                                            key={department.id}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setSelectedDepartment(department.id)
                                                                            }
                                                                            className={`
                                                                                rounded-2xl border px-4 py-3 text-right transition-all
                                                                                ${isSelected
                                                                                    ? "border-blue-500 bg-blue-50 dark:border-violet-500 dark:bg-violet-500/10"
                                                                                    : "border-gray-200 hover:border-blue-300 dark:border-white/[0.08] dark:hover:border-violet-400/60"
                                                                                }
                                                                            `}
                                                                        >
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                                                    {department.name}
                                                                                </span>
                                                                                {isSelected && (
                                                                                    <Check
                                                                                        size={15}
                                                                                        className="text-blue-600 dark:text-violet-400"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="rounded-3xl border border-gray-200 p-4 dark:border-white/[0.08]">
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <User2
                                                                size={16}
                                                                className="text-blue-600 dark:text-violet-400"
                                                            />
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                انتخاب کارمند مسئول
                                                            </p>
                                                        </div>

                                                        {loadingEmployees ? (
                                                            <div className="flex h-20 items-center justify-center">
                                                                <Loader2
                                                                    size={22}
                                                                    className="animate-spin text-blue-600 dark:text-violet-400"
                                                                />
                                                            </div>
                                                        ) : selectedDepartment === null ? (
                                                            <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-400 dark:border-white/[0.08]">
                                                                اول دپارتمان را انتخاب کن.
                                                            </div>
                                                        ) : departmentEmployees.length === 0 ? (
                                                            <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-400 dark:border-white/[0.08]">
                                                                کارمندی برای این دپارتمان پیدا نشد.
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                {departmentEmployees.map((item) => {
                                                                    const isSelected =
                                                                        selectedEmployee === item.employee;

                                                                    return (
                                                                        <button
                                                                            key={item.id}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setSelectedEmployee(item.employee)
                                                                            }
                                                                            className={`
                                                                                rounded-2xl border px-4 py-3 text-right transition-all
                                                                                ${isSelected
                                                                                    ? "border-blue-500 bg-blue-50 dark:border-violet-500 dark:bg-violet-500/10"
                                                                                    : "border-gray-200 hover:border-blue-300 dark:border-white/[0.08] dark:hover:border-violet-400/60"
                                                                                }
                                                                            `}
                                                                        >
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                                                    {item.employee_name}
                                                                                </span>
                                                                                {isSelected && (
                                                                                    <Check
                                                                                        size={15}
                                                                                        className="text-blue-600 dark:text-violet-400"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                                                        <p className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">
                                                            خلاصه انتخاب‌ها
                                                        </p>

                                                        <div className="space-y-3">
                                                            <SummaryRow
                                                                label="مشتری"
                                                                value={selectedCustomerData?.full_name || "-"}
                                                            />
                                                            <SummaryRow
                                                                label="پرونده"
                                                                value={selectedCaseData?.title || "-"}
                                                            />
                                                            <SummaryRow
                                                                label="دپارتمان"
                                                                value={selectedDepartmentData?.name || "-"}
                                                            />
                                                            <SummaryRow
                                                                label="کارمند مسئول"
                                                                value={
                                                                    selectedEmployeeData?.employee_name || "-"
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="rounded-3xl border border-dashed border-gray-200 p-4 text-xs leading-6 text-gray-500 dark:border-white/[0.08] dark:text-white/55">
                                                        قبل از ثبت، مطمئن شو عنوان، توضیحات، دپارتمان و
                                                        کارمند مسئول کامل انتخاب شده باشند.
                                                    </div>

                                                    <AnimatePresence>
                                                        {error && (
                                                            <motion.p
                                                                initial={{ opacity: 0, y: -4 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0 }}
                                                                className="text-xs font-semibold text-red-500"
                                                            >
                                                                {error}
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 z-20 border-t border-gray-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 dark:border-white/[0.08] dark:bg-[#0f1117]/95">
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <button
                                        type="button"
                                        onClick={() => step > 0 && setStep((prev) => prev - 1)}
                                        disabled={step === 0 || submitting}
                                        className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5"
                                    >
                                        <ChevronRight size={16} />
                                        مرحله قبل
                                    </button>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="rounded-full px-4 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                                        >
                                            انصراف
                                        </button>

                                        {step < 2 ? (
                                            <button
                                                type="button"
                                                onClick={() => canGoNext && setStep((prev) => prev + 1)}
                                                disabled={!canGoNext}
                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40 dark:bg-violet-500 dark:hover:bg-violet-400"
                                            >
                                                مرحله بعد
                                                <ChevronLeft size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                disabled={!canSubmit}
                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        در حال ثبت...
                                                    </>
                                                ) : (
                                                    <>
                                                        ثبت تسک
                                                        <Check size={16} />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-gray-200/70 pb-3 last:border-b-0 last:pb-0 dark:border-white/[0.08]">
            <span className="shrink-0 text-xs text-gray-400">{label}</span>
            <span className="text-left text-sm font-medium text-gray-900 dark:text-white">
                {value}
            </span>
        </div>
    );
}
