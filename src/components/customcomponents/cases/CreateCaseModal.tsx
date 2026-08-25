"use client";

import React, { useCallback, useEffect, useMemo, useState, forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Check,
    ClipboardList,
    Loader,
    Plus,
    Search,
    Trash2,
    User,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";
import { apiRoutes } from "@/lib/apiRoutes";
import type { Customer } from "@/types/customer";

type CreateCaseModalProps = {
    open: boolean;
    onClose: () => void;
    onCreated: () => Promise<void> | void;
    customers?: Customer[];
};

type CaseResource = {
    id: number;
    title: string;
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

function customerDisplayName(c: Customer) {
    return c.full_name?.trim() || [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.company_name?.trim() || `مشتری #${c.id}`;
}

type FloatingInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    id: string;
};

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
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
                    className={`absolute right-5 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded text-sm text-gray-400 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 ${hasValue ? "-top-2.5 translate-y-0 text-xs text-gray-500" : "top-1/2 -translate-y-1/2"
                        }`}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

type FloatingTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    id: string;
};

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
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
                    className={`absolute right-5 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded text-sm text-gray-400 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 ${hasValue ? "-top-2.5 translate-y-0 text-xs text-gray-500" : "top-4"
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
    const [customers, setCustomers] = useState<Customer[]>(customersProp ?? []);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [resources, setResources] = useState<CaseResource[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [selectedResources, setSelectedResources] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [isAddingResource, setIsAddingResource] = useState(false);
    const [newResourceTitle, setNewResourceTitle] = useState("");
    const [creatingResource, setCreatingResource] = useState(false);
    const [deletingResourceId, setDeletingResourceId] = useState<number | null>(null);

    const fetchResourcesList = useCallback(async () => {
        try {
            setLoadingResources(true);
            const res = await axiosInstance.get("/tasks/api/v1/cases/resources/");
            setResources(extractList<CaseResource>(res.data));
        } catch {
            setResources([]);
        } finally {
            setLoadingResources(false);
        }
    }, []);

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
                if (alive) setCustomers(extractList<Customer>(res.data));
            } catch {
                if (alive) setCustomers([]);
            } finally {
                if (alive) setLoadingCustomers(false);
            }
        })();
        return () => { alive = false; };
    }, [open, customersProp]);

    useEffect(() => {
        if (!open) return;
        fetchResourcesList();
    }, [open, fetchResourcesList]);

    useEffect(() => {
        if (open) return;
        const timer = setTimeout(() => {
            setStep(0);
            setCustomerQuery("");
            setSelectedCustomer(null);
            setTitle("");
            setDescription("");
            setSelectedResources([]);
            setSubmitError("");
            setSubmitting(false);
            setIsAddingResource(false);
            setNewResourceTitle("");
            setCreatingResource(false);
            setDeletingResourceId(null);
        }, 250);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting && !creatingResource && !deletingResourceId) {
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, submitting, creatingResource, deletingResourceId, onClose]);

    const filteredCustomers = useMemo(() => {
        const q = customerQuery.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => {
            const name = customerDisplayName(c).toLowerCase();
            const phone = (c.phone_number ?? "").toLowerCase();
            const company = (c.company_name ?? "").toLowerCase();
            return name.includes(q) || phone.includes(q) || company.includes(q);
        });
    }, [customers, customerQuery]);

    const activeCustomer = useMemo(
        () => customers.find((c) => c.id === selectedCustomer) ?? null,
        [customers, selectedCustomer]
    );

    const toggleResource = useCallback((id: number) => {
        setSelectedResources((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    }, []);

    const handleCreateResource = useCallback(async () => {
        const trimmed = newResourceTitle.trim();
        if (!trimmed || creatingResource) return;
        try {
            setCreatingResource(true);
            const res = await axiosInstance.post("/tasks/api/v1/cases/resources/create/", {
                title: trimmed,
            });
            const created = res.data as CaseResource;
            if (created && created.id) {
                setResources((prev) => [...prev, created]);
                setSelectedResources((prev) => [...prev, created.id]);
            } else {
                await fetchResourcesList();
            }
            setNewResourceTitle("");
            setIsAddingResource(false);
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingResource(false);
        }
    }, [newResourceTitle, creatingResource, fetchResourcesList]);

    const handleDeleteResource = useCallback(async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (deletingResourceId !== null) return;
        try {
            setDeletingResourceId(id);
            await axiosInstance.delete(`/tasks/api/v1/cases/resources/${id}/delete/`);
            setResources((prev) => prev.filter((r) => r.id !== id));
            setSelectedResources((prev) => prev.filter((r) => r !== id));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingResourceId(null);
        }
    }, [deletingResourceId]);

    const canSubmit = selectedCustomer !== null && title.trim().length > 1 && !submitting;

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            setSubmitError("");
            const userId = localStorage.getItem("crm-user-id");
            await axiosInstance.post("/tasks/api/v1/cases/create/", {
                customer: selectedCustomer,
                created_by: userId ? Number(userId) : null,
                title: title.trim(),
                description: description.trim(),
                resources: selectedResources,
            });
            await onCreated();
            onClose();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.log(err.response?.data);
            }
            setSubmitError("ثبت پرونده انجام نشد، دوباره تلاش کن");
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, selectedCustomer, title, description, selectedResources, onCreated, onClose]);

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
                                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= s ? "bg-blue-500" : "bg-gray-100 dark:bg-white/10"
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
                                                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${selectedCustomer === c.id
                                                                ? "bg-blue-500 text-white"
                                                                : "bg-white text-gray-400 border border-gray-100 dark:bg-white/5 dark:border-white/5"
                                                                }`}>
                                                                <User size={14} />
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-[12.5px] font-bold transition-colors ${selectedCustomer === c.id
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : "text-gray-700 dark:text-gray-300"
                                                                    }`}>
                                                                    {customerDisplayName(c)}
                                                                </p>
                                                                <p className="text-[10.5px] text-gray-400 mt-0.5">
                                                                    {c.phone_number ?? ""}
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
                                                    {activeCustomer ? customerDisplayName(activeCustomer) : "نامعلوم"}
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

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                                    منابع (اختیاری)
                                                </p>
                                                {!isAddingResource && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingResource(true)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                                                    >
                                                        <Plus size={13} />
                                                        افزودن منبع
                                                    </button>
                                                )}
                                            </div>

                                            {isAddingResource && (
                                                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-1.5 dark:border-white/10 dark:bg-white/5">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="عنوان منبع جدید…"
                                                        value={newResourceTitle}
                                                        onChange={(e) => setNewResourceTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleCreateResource();
                                                            }
                                                        }}
                                                        className="h-8 flex-1 bg-transparent px-3 text-[12px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateResource}
                                                        disabled={creatingResource || !newResourceTitle.trim()}
                                                        className="flex h-7 items-center justify-center rounded-xl bg-blue-600 px-3 text-[11px] font-bold text-white transition-opacity disabled:opacity-50 dark:bg-blue-500"
                                                    >
                                                        {creatingResource ? <Loader size={12} className="animate-spin" /> : "ثبت"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAddingResource(false);
                                                            setNewResourceTitle("");
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            )}

                                            {loadingResources ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader size={16} className="animate-spin text-blue-500" />
                                                </div>
                                            ) : resources.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {resources.map((r) => {
                                                        const active = selectedResources.includes(r.id);
                                                        const isDeleting = deletingResourceId === r.id;
                                                        return (
                                                            <div
                                                                key={r.id}
                                                                onClick={() => toggleResource(r.id)}
                                                                role="button"
                                                                tabIndex={0}
                                                                className={`group relative flex cursor-pointer items-center gap-1.5 rounded-full border py-1.5 pl-2 pr-3.5 text-[11.5px] font-bold transition-all duration-200 ${active
                                                                    ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                                                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-white/20"
                                                                    }`}
                                                            >
                                                                {active && <Check size={11} strokeWidth={3} />}
                                                                <span>{r.title}</span>
                                                                <button
                                                                    type="button"
                                                                    title="حذف منبع"
                                                                    onClick={(e) => handleDeleteResource(e, r.id)}
                                                                    disabled={isDeleting}
                                                                    className={`mr-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-all ${
                                                                        active
                                                                            ? "text-blue-100 hover:bg-white/20 hover:text-white"
                                                                            : "text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-red-400"
                                                                    }`}
                                                                >
                                                                    {isDeleting ? (
                                                                        <Loader size={9} className="animate-spin" />
                                                                    ) : (
                                                                        <X size={10} strokeWidth={2.5} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-gray-400">منبعی یافت نشد</p>
                                            )}
                                        </div>

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
                                    <>{step === 0 ? "مرحله بعد" : "ثبت نهایی پرونده"}</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
