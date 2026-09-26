"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftCircle, ArrowRightCircle, FileUp, Loader2, Upload, UserCheck, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingTask } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";
import { FloatingTextarea } from "./FormControls";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mode: "advance" | "revert";
    task: ApiPurchasingTask;
    onCompleted: () => void;
}

function parseApiError(err: unknown): string {
    const e = err as {
        response?: {
            data?:
            | string
            | {
                detail?: string;
                message?: string;
                error?: string;
                created_by?: string[] | string;
                note?: string[] | string;
                file?: string[] | string;
                non_field_errors?: string[] | string;
            };
            status?: number;
        };
    };

    const data = e?.response?.data;

    if (!data) {
        if (e?.response?.status === 401) return "ابتدا وارد حساب خود شوید.";
        if (e?.response?.status === 403) return "شما به این عملیات دسترسی ندارید.";
        if (e?.response?.status === 404) return "تسک یا مرحله یافت نشد.";
        return "خطا در ارتباط با سرور.";
    }

    if (typeof data === "string") return data;

    const pick = (v: string[] | string | undefined) => (Array.isArray(v) ? v[0] : v);

    return (
        pick(data.created_by) ||
        pick(data.note) ||
        pick(data.file) ||
        pick(data.non_field_errors) ||
        data.detail ||
        data.message ||
        data.error ||
        "عملیات انجام نشد."
    );
}

export default function TaskActionModal({ isOpen, onClose, mode, task, onCompleted }: Props) {
    const { isAdmin, isEmployee, hasAccess, currentPurchasingId, currentEmployeeName, loading: accessLoading } = usePurchasingAccess();

    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isAdvance = mode === "advance";

    useEffect(() => {
        if (!isOpen) return;
        setNote("");
        setFile(null);
        setErrorMessage("");
        setSubmitting(false);
    }, [isOpen]);

    const canSubmit = !submitting && !accessLoading && !!currentPurchasingId && (isAdmin || (isEmployee && hasAccess));

    const handleSubmit = async () => {
        if (accessLoading) {
            setErrorMessage("در حال بررسی دسترسی، لطفاً صبر کنید.");
            return;
        }
        if (!currentPurchasingId || !Number.isFinite(currentPurchasingId)) {
            setErrorMessage("شناسه شما در فرآیند خرید یافت نشد. لطفاً صفحه را رفرش کنید.");
            return;
        }
        if (!isAdmin && (!isEmployee || !hasAccess)) {
            setErrorMessage("شما مجاز به انجام این عملیات نیستید.");
            return;
        }

        setSubmitting(true);
        setErrorMessage("");

        try {
            const formData = new FormData();
            formData.append("created_by", String(currentPurchasingId));
            if (note.trim()) formData.append("note", note.trim());
            if (file) formData.append("file", file);

            const endpoint = isAdvance
                ? `/purchasing/api/v1/tasks/${task.id}/advance/`
                : `/purchasing/api/v1/tasks/${task.id}/revert/`;

            await axiosInstance.post(endpoint, formData, { headers: { "Content-Type": undefined } });

            onCompleted();
        } catch (err: unknown) {
            setErrorMessage(parseApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14 }}
                        className="w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${isAdvance ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-300" : "bg-rose-500/10 text-rose-500"
                                        }`}
                                >
                                    {isAdvance ? <ArrowLeftCircle size={16} /> : <ArrowRightCircle size={16} />}
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                        {isAdvance ? "انتقال به مرحله بعد" : "بازگشت به مرحله قبل"}
                                    </h3>
                                    <p className="mt-0.5 max-w-[230px] truncate text-[10px] font-medium text-gray-400">{task.product_name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 p-5">
                            <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5 dark:bg-indigo-500/10">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-300">
                                    <UserCheck size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-bold text-gray-400">انجام‌دهنده (به‌صورت خودکار)</p>
                                    <p className="truncate text-[11px] font-extrabold text-gray-900 dark:text-white">
                                        {currentEmployeeName ? (isAdmin ? `${currentEmployeeName} (ادمین)` : currentEmployeeName) : "در حال شناسایی..."}
                                    </p>
                                </div>
                            </div>

                            <FloatingTextarea
                                label={isAdvance ? "یادداشت انتقال" : "دلیل بازگشت"}
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder=" "
                                rows={4}
                            />

                            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50 px-4 py-6 transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-white/[0.1] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
                                <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                                {file ? (
                                    <>
                                        <FileUp size={19} className="text-indigo-500" />
                                        <span className="mt-2 max-w-full truncate text-[10px] font-bold text-gray-600 dark:text-gray-300">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setFile(null);
                                            }}
                                            className="mt-2 text-[9px] font-bold text-rose-500"
                                        >
                                            حذف فایل
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={19} className="text-gray-400 group-hover:text-indigo-500" />
                                        <span className="mt-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">افزودن فایل</span>
                                        <span className="mt-1 text-[8.5px] font-medium text-gray-400 dark:text-gray-500">اختیاری</span>
                                    </>
                                )}
                            </label>

                            {errorMessage && (
                                <div className="rounded-2xl bg-red-50 px-3 py-2.5 text-[10px] font-semibold leading-5 text-red-500 dark:bg-red-500/10">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="flex-1 rounded-2xl bg-gray-100 py-3 text-[10.5px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-300"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10.5px] font-extrabold text-white shadow-lg disabled:opacity-50 disabled:shadow-none ${isAdvance
                                        ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-indigo-500/25 hover:brightness-110"
                                        : "bg-rose-500 shadow-rose-500/25 hover:bg-rose-600"
                                        }`}
                                >
                                    {submitting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : isAdvance ? (
                                        <>
                                            انتقال <ArrowLeftCircle size={13} />
                                        </>
                                    ) : (
                                        <>
                                            بازگشت <ArrowRightCircle size={13} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}