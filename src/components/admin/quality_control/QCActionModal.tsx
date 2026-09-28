"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Upload, X, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiQualityControlEmployee, ApiQualityControlItem, QualityControlActionResponse } from "@/types/quality_control";

interface Props {
    isOpen: boolean;
    mode: "approve" | "reject";
    item: ApiQualityControlItem;
    reviewer: ApiQualityControlEmployee | null;
    reviewerName: string;
    onClose: () => void;
    onCompleted: (response: QualityControlActionResponse) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const data = (err as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return fallback;
    for (const key of ["detail", "checked_by", "note", "file", "message", "error", "non_field_errors"]) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return fallback;
}

export default function QCActionModal({ isOpen, mode, item, reviewer, reviewerName, onClose, onCompleted }: Props) {
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement | null>(null);
    const isApprove = mode === "approve";

    useEffect(() => {
        if (!isOpen) return;
        setNote("");
        setFile(null);
        setError("");
        if (fileRef.current) fileRef.current.value = "";
    }, [isOpen, item.id, mode]);

    const closeModal = () => !loading && onClose();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!reviewer) return setError("کاربر فعلی عضو فعال تیم کنترل کیفی نیست");
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("checked_by", String(reviewer.id));
            formData.append("note", note.trim());
            if (file) formData.append("file", file);
            const { data } = await axiosInstance.post<QualityControlActionResponse>(
                `/quality_control/api/v1/${item.id}/${isApprove ? "approve" : "reject"}/`,
                formData
            );
            onCompleted(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, isApprove ? "تایید کالا انجام نشد" : "رد کالا انجام نشد"));
        } finally {
            setLoading(false);
        }
    }

    const tone = isApprove
        ? { box: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500" }
        : { box: "bg-red-50 dark:bg-red-500/10", icon: "text-red-500", btn: "bg-red-600 hover:bg-red-500" };
    const Icon = isApprove ? CheckCircle2 : XCircle;
    const shownName = reviewerName || reviewer?.username || "";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onMouseDown={closeModal}
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
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">{isApprove ? "تایید کنترل کیفی" : "رد کنترل کیفی"}</h3>
                                    <p className="mt-0.5 truncate text-[11px] text-gray-400">{item.product_name}</p>
                                </div>
                            </div>
                            <button type="button" onClick={closeModal} disabled={loading} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300">
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
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
                                    <label className="mb-2 block text-[11.5px] font-bold text-gray-400">بررسی‌کننده</label>
                                    <div className="flex h-[52px] items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50 px-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-[12px] font-extrabold text-white">
                                            {(shownName || "؟").charAt(0)}
                                        </span>
                                        <span className="truncate text-[12.5px] font-bold text-gray-900 dark:text-white">
                                            {reviewer ? shownName : "کارمند کنترل کیفی فعال یافت نشد"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[11.5px] font-bold text-gray-400">توضیحات</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={4}
                                        placeholder="توضیحات بررسی را وارد کنید..."
                                        className="w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-[12.5px] font-bold text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-[11.5px] font-bold text-gray-400">فایل (اختیاری)</label>
                                    <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                            <Upload size={14} />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-gray-600 dark:text-gray-300">{file ? file.name : "افزودن فایل"}</span>
                                        <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                                    </label>
                                </div>
                            </div>

                            <div className="flex shrink-0 gap-2 px-8 pb-8 pt-5">
                                <button type="button" onClick={closeModal} disabled={loading} className="h-11 flex-1 rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                                    انصراف
                                </button>
                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.97 }}
                                    disabled={loading || !reviewer}
                                    className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${tone.btn}`}
                                >
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={14} />}
                                    {isApprove ? "تایید نهایی" : "رد نهایی"}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}