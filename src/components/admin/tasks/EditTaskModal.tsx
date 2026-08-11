"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader, Check, ChevronLeft, ChevronRight } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

type NullableString = string | null | undefined;
type NullableNumber = number | null | undefined;

interface Task {
    id: number;
    title?: NullableString;
    description?: NullableString;
    case?: NullableNumber;
    department?: NullableNumber;
    assigned_employee?: NullableNumber;
}

interface Customer {
    id: number;
    name?: NullableString;
}

interface CaseItem {
    id: number;
    title?: NullableString;
    customer?: NullableNumber;
}

interface Department {
    id: number;
    name?: NullableString;
}

interface DepartmentEmployee {
    id: number;
    employee: number;
    employee_name?: NullableString;
    department: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onSuccess: () => void;
}

function safeText(value: NullableString) {
    return String(value ?? "");
}

function safeNumber(value: NullableNumber): number | null {
    return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

export default function EditTaskModal({ isOpen, onClose, task, onSuccess }: Props) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentEmployees, setDepartmentEmployees] = useState<DepartmentEmployee[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [selectedCase, setSelectedCase] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCases, setLoadingCases] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // ref برای جلوگیری از stale closure در employee effect
    const selectedEmployeeRef = useRef<number | null>(null);
    selectedEmployeeRef.current = selectedEmployee;

    // step 0 قابل رد شدنه اگه case از قبل داریم (ویرایش تسک موجود)
    const canGoNext = selectedCase !== null;

    const canSubmit =
        safeText(title).trim().length > 0 &&
        safeText(description).trim().length > 0 &&
        selectedCase !== null &&
        selectedDepartment !== null &&
        selectedEmployee !== null &&
        !submitting;

    // reset و لود اولیه — همه چیز اینجا مدیریت می‌شه
    useEffect(() => {
        if (!isOpen || !task) return;

        setError("");
        setStep(0);
        setTitle(safeText(task.title));
        setDescription(safeText(task.description));
        setSelectedDepartment(safeNumber(task.department));
        setSelectedEmployee(safeNumber(task.assigned_employee));
        setSelectedCustomer(null);
        setSelectedCase(null);
        setCases([]);

        const loadInitial = async () => {
            setLoading(true);
            setLoadingCustomers(true);
            setLoadingDepartments(true);

            try {
                const [customerRes, departmentRes] = await Promise.all([
                    axiosInstance.get<Customer[]>("/customers/api/v1/customers/"),
                    axiosInstance.get<Department[]>("/department/api/v1/department/list/"),
                ]);

                setCustomers(Array.isArray(customerRes.data) ? customerRes.data : []);
                setDepartments(Array.isArray(departmentRes.data) ? departmentRes.data : []);

                // اگه task.case داریم، case رو fetch کن تا customer معلوم بشه
                if (task.case != null) {
                    try {
                        const caseRes = await axiosInstance.get<CaseItem>(
                            `/tasks/api/v1/cases/${task.case}/`
                        );
                        const caseData = caseRes.data;
                        const customerId = safeNumber(caseData?.customer);
                        const caseId = safeNumber(caseData?.id) ?? safeNumber(task.case);

                        // اول customer رو set کن تا cases effect بتونه لود کنه
                        setSelectedCustomer(customerId);
                        setSelectedCase(caseId);
                    } catch {
                        // اگه endpoint نداشتیم فقط case رو نگه می‌داریم
                        setSelectedCase(safeNumber(task.case));
                    }
                }
            } catch (err) {
                console.error("loadInitial error:", err);
                setError("خطا در دریافت اطلاعات اولیه.");
            } finally {
                setLoading(false);
                setLoadingCustomers(false);
                setLoadingDepartments(false);
            }
        };

        loadInitial();
    }, [isOpen, task]);

    // لود cases وقتی customer عوض می‌شه
    useEffect(() => {
        if (!isOpen) return;

        if (selectedCustomer === null) {
            setCases([]);
            return;
        }

        let cancelled = false;

        const loadCases = async () => {
            setLoadingCases(true);
            try {
                const res = await axiosInstance.get<CaseItem[]>(
                    `/tasks/api/v1/cases/?customer=${selectedCustomer}`
                );
                if (!cancelled) {
                    setCases(Array.isArray(res.data) ? res.data : []);
                }
            } catch (err) {
                console.error("loadCases error:", err);
                if (!cancelled) setCases([]);
            } finally {
                if (!cancelled) setLoadingCases(false);
            }
        };

        loadCases();
        return () => { cancelled = true; };
    }, [isOpen, selectedCustomer]);

    // لود employees وقتی department عوض می‌شه
    useEffect(() => {
        if (!isOpen) return;

        if (selectedDepartment === null) {
            setDepartmentEmployees([]);
            return;
        }

        let cancelled = false;

        const loadEmployees = async () => {
            setLoadingEmployees(true);
            try {
                const res = await axiosInstance.get<DepartmentEmployee[]>(
                    "/department/api/v1/department_employee/list/"
                );

                if (cancelled) return;

                const list = Array.isArray(res.data) ? res.data : [];
                const filtered = list.filter((item) => item.department === selectedDepartment);
                setDepartmentEmployees(filtered);

                // با ref چک می‌کنیم تا stale closure نداشته باشیم
                const currentEmployee = selectedEmployeeRef.current;
                const stillValid = filtered.some((e) => e.employee === currentEmployee);
                if (!stillValid) {
                    setSelectedEmployee(null);
                }
            } catch (err) {
                console.error("loadEmployees error:", err);
                if (!cancelled) setDepartmentEmployees([]);
            } finally {
                if (!cancelled) setLoadingEmployees(false);
            }
        };

        loadEmployees();
        return () => { cancelled = true; };
    }, [isOpen, selectedDepartment]);

    const selectedCustomerData = useMemo(
        () => customers.find((c) => c.id === selectedCustomer) ?? null,
        [customers, selectedCustomer]
    );

    const selectedCaseData = useMemo(
        () => cases.find((c) => c.id === selectedCase) ?? null,
        [cases, selectedCase]
    );

    const selectedDepartmentData = useMemo(
        () => departments.find((d) => d.id === selectedDepartment) ?? null,
        [departments, selectedDepartment]
    );

    const selectedEmployeeData = useMemo(
        () => departmentEmployees.find((e) => e.employee === selectedEmployee) ?? null,
        [departmentEmployees, selectedEmployee]
    );

    const handleSubmit = async () => {
        if (!task) return;

        const safeTitle = safeText(title).trim();
        const safeDescription = safeText(description).trim();

        if (!safeTitle || !safeDescription) {
            setError("عنوان و توضیحات تسک اجباری هستند.");
            return;
        }

        if (selectedCase === null || selectedDepartment === null || selectedEmployee === null) {
            setError("پرونده، دپارتمان و کارمند باید انتخاب شوند.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await axiosInstance.put(`/tasks/api/v1/tasks/${task.id}/update/`, {
                title: safeTitle,
                description: safeDescription,
                case: selectedCase,
                department: selectedDepartment,
                assigned_employee: selectedEmployee,
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("handleSubmit error:", err);
            const apiMessage =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "خطا در بروزرسانی تسک";
            setError(apiMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                dir="rtl"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#0f1117]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-white/10">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                ویرایش تسک #{task.id}
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                اطلاعات را اصلاح کنید و ذخیره بزنید.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Step 1 — انتخاب مشتری و پرونده */}
                                {step === 0 && (
                                    <div className="space-y-5">
                                        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                                            مرحله 1: انتخاب مشتری و پرونده
                                        </h3>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* مشتری */}
                                            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
                                                <div className="mb-3 text-xs font-bold text-zinc-500">مشتری</div>

                                                {loadingCustomers ? (
                                                    <div className="flex justify-center py-10">
                                                        <Loader className="h-5 w-5 animate-spin text-blue-600" />
                                                    </div>
                                                ) : customers.length === 0 ? (
                                                    <div className="py-6 text-center text-xs text-zinc-400">
                                                        مشتری‌ای پیدا نشد
                                                    </div>
                                                ) : (
                                                    <div className="max-h-72 space-y-2 overflow-y-auto">
                                                        {customers.map((customer) => (
                                                            <button
                                                                key={customer.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCustomer(customer.id);
                                                                    setSelectedCase(null);
                                                                }}
                                                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm transition ${selectedCustomer === customer.id
                                                                        ? "bg-blue-600 text-white"
                                                                        : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                                                                    }`}
                                                            >
                                                                <span>
                                                                    {safeText(customer.name) || `مشتری #${customer.id}`}
                                                                </span>
                                                                {selectedCustomer === customer.id && <Check size={16} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* پرونده */}
                                            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
                                                <div className="mb-3 text-xs font-bold text-zinc-500">پرونده</div>

                                                {loadingCases ? (
                                                    <div className="flex justify-center py-10">
                                                        <Loader className="h-5 w-5 animate-spin text-blue-600" />
                                                    </div>
                                                ) : selectedCustomer === null ? (
                                                    <div className="py-6 text-center text-xs text-zinc-400">
                                                        {selectedCase !== null
                                                            ? "پرونده از تسک بارگذاری شده — در صورت نیاز مشتری را انتخاب کنید"
                                                            : "ابتدا مشتری را انتخاب کنید"}
                                                    </div>
                                                ) : cases.length === 0 ? (
                                                    <div className="py-6 text-center text-xs text-zinc-400">
                                                        پرونده‌ای برای این مشتری وجود ندارد
                                                    </div>
                                                ) : (
                                                    <div className="max-h-72 space-y-2 overflow-y-auto">
                                                        {cases.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => setSelectedCase(item.id)}
                                                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm transition ${selectedCase === item.id
                                                                        ? "bg-blue-600 text-white"
                                                                        : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                                                                    }`}
                                                            >
                                                                <span>
                                                                    {safeText(item.title) || `پرونده #${item.id}`}
                                                                </span>
                                                                {selectedCase === item.id && <Check size={16} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* نمایش پرونده انتخاب شده از task وقتی customer هنوز انتخاب نشده */}
                                        {selectedCase !== null && selectedCustomer === null && (
                                            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                                                پرونده #{selectedCase} از تسک انتخاب شده است. می‌توانید مشتری را انتخاب کنید تا پرونده‌ها را تغییر دهید.
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                                            >
                                                انصراف
                                            </button>

                                            <button
                                                type="button"
                                                disabled={!canGoNext}
                                                onClick={() => setStep(1)}
                                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                            >
                                                مرحله بعد
                                                <ChevronLeft size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 — اطلاعات تسک */}
                                {step === 1 && (
                                    <div className="space-y-5">
                                        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                                            مرحله 2: اطلاعات تسک
                                        </h3>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-xs font-bold text-zinc-500">
                                                    عنوان
                                                </label>
                                                <input
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                    placeholder="عنوان تسک"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-bold text-zinc-500">
                                                    دپارتمان
                                                </label>

                                                {loadingDepartments ? (
                                                    <div className="flex justify-center py-3">
                                                        <Loader className="h-5 w-5 animate-spin text-blue-600" />
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={selectedDepartment ?? ""}
                                                        onChange={(e) =>
                                                            setSelectedDepartment(
                                                                e.target.value ? Number(e.target.value) : null
                                                            )
                                                        }
                                                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                    >
                                                        <option value="">انتخاب دپارتمان</option>
                                                        {departments.map((department) => (
                                                            <option key={department.id} value={department.id}>
                                                                {safeText(department.name) || `دپارتمان #${department.id}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-2 block text-xs font-bold text-zinc-500">
                                                    مسئول انجام
                                                </label>

                                                {loadingEmployees ? (
                                                    <div className="flex justify-center py-3">
                                                        <Loader className="h-5 w-5 animate-spin text-blue-600" />
                                                    </div>
                                                ) : selectedDepartment === null ? (
                                                    <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-400 dark:border-white/10">
                                                        ابتدا دپارتمان را انتخاب کنید
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={selectedEmployee ?? ""}
                                                        onChange={(e) =>
                                                            setSelectedEmployee(
                                                                e.target.value ? Number(e.target.value) : null
                                                            )
                                                        }
                                                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                    >
                                                        <option value="">انتخاب کارمند</option>
                                                        {departmentEmployees.map((employee) => (
                                                            <option key={employee.employee} value={employee.employee}>
                                                                {safeText(employee.employee_name) ||
                                                                    `کارمند #${employee.employee}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-2 block text-xs font-bold text-zinc-500">
                                                    توضیحات
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={5}
                                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                    placeholder="توضیحات تسک"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setStep(0)}
                                                className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                                            >
                                                <ChevronRight size={16} />
                                                مرحله قبل
                                            </button>

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                                                >
                                                    انصراف
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={!canSubmit}
                                                    onClick={handleSubmit}
                                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader size={16} className="animate-spin" />
                                                            در حال ذخیره...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check size={16} />
                                                            ذخیره تغییرات
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
