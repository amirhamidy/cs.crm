"use client";

import React, { useCallback, useEffect, useMemo, useState, forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Check,
    ClipboardList,
    Loader,
    Search,
    User,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";

type CustomerLike = {
    id: number;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    phone_number?: string;
    company_name?: string;
};

type CreateCaseModalProps = {
    open: boolean;
    onClose: () => void;
    onCreated: () => Promise<void> | void;
    customers?: CustomerLike[];
};

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const obj = data as { results?: T[]; data?: T[] };
        if (Array.isArray(obj.results)) return obj.results;
        if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
}

function customerName(c: CustomerLike) {
    const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
    return c.full_name?.trim() || full || c.name?.trim() || c.company_name?.trim() || `مشتری #${c.id}`;
}

function customerPhone(c: CustomerLike) {
    return c.phone || c.phone_number || "";
}

const FloatingInput = forwardRef<HTMLInputElement, any>(
    ({ label, id, className = "", value, ...props }, ref) => {
        const hasValue = value !== undefined && value !== null && value !== "";

        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=" "
                    className={`peer w-full rounded-4xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`absolute right-5 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded text-sm text-gray-400 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 ${hasValue
                            ? "-top-2.5 translate-y-0 text-xs text-gray-500"
                            : "top-1/2 -translate-y-1/2"
                        }`}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

const FloatingTextarea = forwardRef<HTMLTextAreaElement, any>(
    ({ label, id, className = "", value, rows = 3, ...props }, ref) => {
        const hasValue = value !== undefined && value !== null && value !== "";

        return (
            <div className="relative">
                <textarea
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=" "
                    rows={rows}
                    className={`peer w-full rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 resize-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`absolute right-5 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded text-sm text-gray-400 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 ${hasValue
                            ? "-top-2.5 translate-y-0 text-xs text-gray-500"
                            : "top-4"
                        }`}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingTextarea.displayName = "FloatingTextarea";

export default function CreateCaseModal({
    open,
    onClose,
    onCreated,
    customers: customersProp,
}: CreateCaseModalProps) {
    const [step, setStep] = useState(0);
    const [customers, setCustomers] = useState<CustomerLike[]>(customersProp ?? []);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        if (customersProp) setCustomers(customersProp);
    }, [customersProp]);

    useEffect(() => {
        if (!open || customersProp) return;
        let alive = true;
        (async () => {
            try {
                setLoadingCustomers(true);
                const res = await axiosInstance.get(apiRoutes.customers);
                if (alive) setCustomers(extractList<CustomerLike>(res.data));
            } catch {
                if (alive) setCustomers([]);
            } finally {
                if (alive) setLoadingCustomers(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [open, customersProp]);

    useEffect(() => {
        if (open) return;
        const timer = setTimeout(() => {
            setStep(0);
            setCustomerQuery("");
            setSelectedCustomer(null);
            setTitle("");
            setDescription("");
            setSubmitError("");
            setSubmitting(false);
        }, 250);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, submitting, onClose]);

    const filteredCustomers = useMemo(() => {
        const q = customerQuery.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => {
            const name = customerName(c).toLowerCase();
            const phone = customerPhone(c).toLowerCase();
            const company = (c.company_name ?? "").toLowerCase();
            return name.includes(q) || phone.includes(q) || company.includes(q);
        });
    }, [customers, customerQuery]);

    const activeCustomer = useMemo(
        () => customers.find((c) => c.id === selectedCustomer) ?? null,
        [customers, selectedCustomer]
    );

    const canSubmit = selectedCustomer !== null && title.trim().length > 1 && !submitting;

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            setSubmitError("");
            await axiosInstance.post("/tasks/api/v1/cases/create/", {
                customer: selectedCustomer,
                title: title.trim(),
                description: description.trim(),
            });
            await onCreated();
            onClose();
        } catch {
            setSubmitError("ثبت پرونده انجام نشد، دوباره تلاش کن");
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, selectedCustomer, title, description, onCreated, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-900/40 p-0 backdrop-blur-md sm:items-center sm:p-4 dark:bg-black/60"
                    onClick={() => !submitting && onClose()}
                    dir="rtl"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl border border-gray-100 bg-white shadow-2xl sm:rounded-4xl dark:border-white/10 dark:bg-[#111113]"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/10">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                                    <ClipboardList size={16} className="text-blue-500 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        پرونده جدید
                                    </h2>
                                    <p className="mt-0.5 truncate text-[11.5px] text-gray-400 dark:text-gray-500">
                                        {step === 0 ? "انتخاب مشتری" : "اطلاعات پرونده"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => !submitting && onClose()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 px-5 pt-4">
                            {[0, 1].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= s
                                            ? "bg-blue-500"
                                            : "bg-gray-100 dark:bg-white/10"
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <AnimatePresence mode="wait" initial={false}>
                                {step === 0 ? (
                                    <motion.div
                                        key="step-0"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="relative group">
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500">
                                                <Search size={14} />
                                            </div>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="جستجوی نام یا شماره تماس…"
                                                value={customerQuery}
                                                onChange={(e) => setCustomerQuery(e.target.value)}
                                                className="h-11 w-full rounded-2xl border-none bg-gray-50 px-10 text-[12.5px] font-medium text-gray-900 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#18181b]"
                                            />
                                        </div>

                                        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5 custom-scrollbar">
                                            {loadingCustomers ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                    <Loader size={18} className="animate-spin text-blue-500" />
                                                    <p className="text-[11.5px] text-gray-400">در حال جستجو…</p>
                                                </div>
                                            ) : filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCustomer(c.id);
                                                            setStep(1);
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-2xl p-3.5 transition-all duration-200 group ${selectedCustomer === c.id
                                                                ? "bg-blue-50 dark:bg-blue-500/10"
                                                                : "hover:bg-gray-50 dark:hover:bg-white/5"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${selectedCustomer === c.id ? "bg-blue-500 text-white" : "bg-white text-gray-400 border border-gray-100 dark:bg-white/5 dark:border-white/5"
                                                                }`}>
                                                                <User size={14} />
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-[12.5px] font-bold transition-colors ${selectedCustomer === c.id ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                                                                    }`}>
                                                                    {customerName(c)}
                                                                </p>
                                                                <p className="text-[10.5px] text-gray-400 mt-0.5">
                                                                    {customerPhone(c)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {selectedCustomer === c.id && (
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                                                <Check size={11} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center">
                                                    <p className="text-[11.5px] text-gray-400">مشتری با این مشخصات یافت نشد</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step-1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        <div className="flex items-center gap-3 rounded-2xl bg-blue-50/50 p-3 dark:bg-blue-500/5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
                                                <User size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10.5px] text-blue-500/80 font-bold">مشتری انتخاب شده:</p>
                                                <p className="truncate text-[12px] font-extrabold text-blue-700 dark:text-blue-300">
                                                    {activeCustomer ? customerName(activeCustomer) : "نامعلوم"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setStep(0)}
                                                className="text-[11px] font-bold text-blue-600 hover:underline"
                                            >
                                                تغییر
                                            </button>
                                        </div>

                                        <FloatingInput
                                            label="عنوان پرونده"
                                            id="case_title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />

                                        <FloatingTextarea
                                            label="توضیحات (اختیاری)"
                                            id="case_description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                        />

                                        {submitError && (
                                            <div className="rounded-xl bg-red-50 p-3 text-center text-[11.5px] font-bold text-red-500 dark:bg-red-500/10">
                                                {submitError}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-white/10 dark:bg-white/2">
                            {step === 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(0)}
                                    disabled={submitting}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 disabled:opacity-40 dark:bg-[#18181b] dark:text-gray-400 dark:ring-white/10 dark:hover:bg-white/5"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={step === 0 ? () => selectedCustomer && setStep(1) : handleSubmit}
                                disabled={step === 0 ? !selectedCustomer : !canSubmit}
                                className="relative flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 text-[13px] font-extrabold text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
                            >
                                {submitting ? (
                                    <Loader size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 0 ? "مرحله بعد" : "ثبت نهایی پرونده"}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}