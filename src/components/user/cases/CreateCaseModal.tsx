"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    forwardRef,
} from "react";
import { AnimatePresence, m } from "framer-motion";
import {
    ArrowRight,
    Check,
    ClipboardList,
    Loader,
    Search,
    User,
    X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { casesApi, customersApi } from "@/lib/api";
import type { Customer } from "@/types/customer";

type CreateCaseModalProps = {
    open: boolean;
    onClose: () => void;
    onCreated: () => Promise<void> | void;
};

const CUSTOMER_PAGE_SIZE = 20;

function customerDisplayName(c: Customer) {
    return (
        c.full_name?.trim() ||
        [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
        c.company_name?.trim() ||
        `مشتری #${c.id}`
    );
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
                    className={`pointer-events-none absolute right-5 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 dark:bg-[#0f172a] ${hasValue
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
                    className={`peer w-full resize-none rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`pointer-events-none absolute right-5 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 dark:bg-[#0f172a] ${hasValue
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
}: CreateCaseModalProps) {
    const [step, setStep] = useState(0);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerPage, setCustomerPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [loadingFirst, setLoadingFirst] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selected, setSelected] = useState<Customer | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const reqId = useRef(0);
    const fetchingRef = useRef(false);

    
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(customerQuery.trim()), 300);
        return () => clearTimeout(t);
    }, [customerQuery]);

    
    const loadPage = useCallback(async (p: number, q: string) => {
        const id = ++reqId.current;
        fetchingRef.current = true;
        if (p === 1) setLoadingFirst(true);
        else setLoadingMore(true);

        try {
            const data = await customersApi.list({
                page: p,
                page_size: CUSTOMER_PAGE_SIZE,
                search: q || undefined,
            });
            if (id !== reqId.current) return;

            setCustomers((prev) => {
                if (p === 1) return data.results;
                
                const seen = new Set(prev.map((c) => c.id));
                return [...prev, ...data.results.filter((c) => !seen.has(c.id))];
            });
            setCustomerPage(p);
            setTotalCustomers(data.count);
            setHasMore(Boolean(data.next));
        } catch {
            if (id !== reqId.current) return;
            if (p === 1) {
                setCustomers([]);
                setTotalCustomers(0);
                setHasMore(false);
            }
        } finally {
            if (id === reqId.current) {
                fetchingRef.current = false;
                setLoadingFirst(false);
                setLoadingMore(false);
            }
        }
    }, []);

    
    useEffect(() => {
        if (!open) return;
        loadPage(1, debouncedQuery);
    }, [open, debouncedQuery, loadPage]);

    
    const handleListScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            if (!hasMore || fetchingRef.current) return;
            const el = e.currentTarget;
            const nearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (nearBottom) loadPage(customerPage + 1, debouncedQuery);
        },
        [hasMore, customerPage, debouncedQuery, loadPage]
    );

    
    useEffect(() => {
        if (open) return;
        const timer = setTimeout(() => {
            reqId.current++;
            fetchingRef.current = false;
            setStep(0);
            setCustomers([]);
            setCustomerPage(1);
            setCustomerQuery("");
            setDebouncedQuery("");
            setSelected(null);
            setTitle("");
            setDescription("");
            setSubmitError("");
            setSubmitting(false);
            setHasMore(false);
            setTotalCustomers(0);
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

    const canSubmit = selected !== null && title.trim().length > 1 && !submitting;
    const currentUserId = useAuthStore((state) => state.userId);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || !selected) return;
        try {
            setSubmitting(true);
            setSubmitError("");
            await casesApi.create({
                customer: selected.id,
                created_by: currentUserId,
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
    }, [canSubmit, selected, title, description, currentUserId, onCreated, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-900/40 p-0 backdrop-blur-md sm:items-center sm:p-4 dark:bg-black/60"
                    onClick={() => !submitting && onClose()}
                    dir="rtl"
                >
                    <m.div
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
                                    <ClipboardList
                                        size={16}
                                        className="text-blue-500 dark:text-blue-400"
                                    />
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
                                    <m.div
                                        key="step-0"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="group relative">
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500">
                                                {loadingFirst ? (
                                                    <Loader size={14} className="animate-spin" />
                                                ) : (
                                                    <Search size={14} />
                                                )}
                                            </div>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="جستجوی نام، شرکت یا شماره تماس…"
                                                value={customerQuery}
                                                onChange={(e) => setCustomerQuery(e.target.value)}
                                                className="h-11 w-full rounded-2xl border-none bg-gray-50 px-10 text-[12.5px] font-medium text-gray-900 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#18181b]"
                                            />
                                        </div>

                                        {!loadingFirst && totalCustomers > 0 && (
                                            <p className="px-1 text-[10.5px] text-gray-400">
                                                {totalCustomers} مشتری
                                                {debouncedQuery ? " یافت شد" : ""}
                                            </p>
                                        )}

                                        <div
                                            onScroll={handleListScroll}
                                            className="custom-scrollbar max-h-[320px] space-y-1.5 overflow-y-auto pr-0.5"
                                        >
                                            {loadingFirst && customers.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center gap-3 py-8">
                                                    <Loader
                                                        size={18}
                                                        className="animate-spin text-blue-500"
                                                    />
                                                    <p className="text-[11.5px] text-gray-400">
                                                        در حال جستجو…
                                                    </p>
                                                </div>
                                            ) : customers.length > 0 ? (
                                                <>
                                                    {customers.map((c) => {
                                                        const isSel = selected?.id === c.id;
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelected(c);
                                                                    setStep(1);
                                                                }}
                                                                className={`group flex w-full items-center justify-between rounded-2xl p-3.5 transition-all duration-200 ${isSel
                                                                        ? "bg-blue-50 dark:bg-blue-500/10"
                                                                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                                                                    } ${loadingFirst ? "opacity-50" : ""}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isSel
                                                                                ? "bg-blue-500 text-white"
                                                                                : "border border-gray-100 bg-white text-gray-400 dark:border-white/5 dark:bg-white/5"
                                                                            }`}
                                                                    >
                                                                        <User size={14} />
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p
                                                                            className={`text-[12.5px] font-bold transition-colors ${isSel
                                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                                    : "text-gray-700 dark:text-gray-300"
                                                                                }`}
                                                                        >
                                                                            {customerDisplayName(c)}
                                                                        </p>
                                                                        <p className="mt-0.5 text-[10.5px] text-gray-400">
                                                                            {c.phone_number ?? ""}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {isSel && (
                                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                                                        <Check size={11} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}

                                                    {loadingMore && (
                                                        <div className="flex justify-center py-3">
                                                            <Loader
                                                                size={16}
                                                                className="animate-spin text-blue-500"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="py-8 text-center">
                                                    <p className="text-[11.5px] text-gray-400">
                                                        مشتری با این مشخصات یافت نشد
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </m.div>
                                ) : (
                                    <m.div
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
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10.5px] font-bold text-blue-500/80">
                                                    مشتری انتخاب شده:
                                                </p>
                                                <p className="truncate text-[12px] font-extrabold text-blue-700 dark:text-blue-300">
                                                    {selected
                                                        ? customerDisplayName(selected)
                                                        : "نامعلوم"}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
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
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>

                        
                        <div className="dark:bg-white/2 flex items-center gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-white/10">
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
                                onClick={
                                    step === 0
                                        ? () => selected && setStep(1)
                                        : handleSubmit
                                }
                                disabled={step === 0 ? !selected : !canSubmit}
                                className="relative flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 text-[13px] font-extrabold text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
                            >
                                {submitting ? (
                                    <Loader size={16} className="animate-spin" />
                                ) : (
                                    <>{step === 0 ? "مرحله بعد" : "ثبت نهایی پرونده"}</>
                                )}
                            </button>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}