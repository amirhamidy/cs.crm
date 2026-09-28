"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeftCircle, ArrowRightCircle, Loader2, Upload, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingTask } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mode: "advance" | "revert";
    task: ApiPurchasingTask;
    onCompleted: () => void;
}

function parseApiError(err: unknown): string {
    const e = err as { response?: { data?: string | Record<string, unknown>; status?: number } };
    const data = e?.response?.data;

    if (!data) {
        const s = e?.response?.status;
        if (s === 401) return "ابتدا وارد حساب خود شوید.";
        if (s === 403) return "شما به این عملیات دسترسی ندارید.";
        if (s === 404) return "تسک یا مرحله یافت نشد.";
        return "خطا در ارتباط با سرور.";
    }
    if (typeof data === "string") return data;

    for (const key of ["created_by", "note", "file", "non_field_errors", "detail", "message", "error"]) {
        const v = data[key];
        if (typeof v === "string") return v;
        if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
    return "عملیات انجام نشد.";
}

export default function TaskTransitionModal({ isOpen, onClose, mode, task, onCompleted }: Props) {
    const { isAdmin, isEmployee, hasAccess, currentPurchasingId, currentEmployeeName, loading: accessLoading } = usePurchasingAccess();

    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const isAdvance = mode === "advance";

    useEffect(() => {
        if (!isOpen) return;
        setNote("");
        setFile(null);
        setError("");
        setSubmitting(false);
    }, [isOpen]);

    const canSubmit = !submitting && !accessLoading && !!currentPurchasingId && (isAdmin || (isEmployee && hasAccess));
    const close = () => !submitting && onClose();

    const handleSubmit = async () => {
        if (accessLoading) return setError("در حال بررسی دسترسی، لطفاً صبر کنید.");
        if (!currentPurchasingId || !Number.isFinite(currentPurchasingId)) return setError("شناسه شما در فرآیند خرید یافت نشد. لطفاً صفحه را رفرش کنید.");
        if (!isAdmin && (!isEmployee || !hasAccess)) return setError("شما مجاز به انجام این عملیات نیستید.");

        setSubmitting(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("created_by", String(currentPurchasingId));
            if (note.trim()) formData.append("note", note.trim());
            if (file) formData.append("file", file);

            await axiosInstance.post(`/purchasing/api/v1/tasks/${task.id}/${isAdvance ? "advance" : "revert"}/`, formData, { headers: { "Content-Type": undefined } });
            onCompleted();
        } catch (err: unknown) {
            setError(parseApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (typeof document === "undefined") return null;

    const tone = isAdvance
        ? { box: "bg-indigo-50 dark:bg-indigo-500/10", icon: "text-indigo-500", btn: "bg-indigo-600 hover:bg-indigo-500" }
        : { box: "bg-red-50 dark:bg-red-500/10", icon: "text-red-500", btn: "bg-red-600 hover:bg-red-500" };
    const Icon = isAdvance ? ArrowLeftCircle : ArrowRightCircle;
    const doer = currentEmployeeName ? (isAdmin ? `${currentEmployeeName} (ادمین)` : currentEmployeeName) : "در حال شناسایی...";

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onMouseDown={close}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:border-white/[0.06] dark:bg-[#0f172a]"
                        dir="rtl"
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.box}`}>
                                    <Icon size={15} className={tone.icon} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">{isAdvance ? "انتقال به مرحله بعد" : "بازگشت به مرحله قبل"}</h3>
                                    <p className="mt-0.5 truncate text-[11px] text-gray-400">{task.product_name}</p>
                                </div>
                            </div>
                            <button type="button" onClick={close} disabled={submitting} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-8 pb-2">
                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                        <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">انجام‌دهنده</label>
                                <div className="flex h-[52px] items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50 px-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-[12px] font-extrabold text-white">
                                        {(currentEmployeeName || "؟").trim().charAt(0)}
                                    </span>
                                    <span className="truncate text-[12.5px] font-bold text-gray-900 dark:text-white">{doer}</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{isAdvance ? "یادداشت انتقال" : "دلیل بازگشت"}</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={4}
                                    placeholder="توضیحات را وارد کنید..."
                                    className="w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-[12.5px] font-bold text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-indigo-500/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">فایل (اختیاری)</label>
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/[0.05]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                        <Upload size={14} />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-gray-600 dark:text-gray-300">{file ? file.name : "افزودن فایل"}</span>
                                    {file && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFile(null);
                                            }}
                                            className="shrink-0 text-gray-400 transition hover:text-red-500"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                                </label>
                            </div>
                        </div>

                        <div className="flex shrink-0 gap-2 px-8 pb-8 pt-5">
                            <button type="button" onClick={close} disabled={submitting} className="h-11 flex-1 rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                                انصراف
                            </button>
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${tone.btn}`}
                            >
                                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Icon size={14} />}
                                {isAdvance ? "انتقال" : "بازگشت"}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}