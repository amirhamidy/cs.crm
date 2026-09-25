"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Upload, X, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiQualityControlEmployee, ApiQualityControlItem, QualityControlActionResponse } from "@/types/quality_control";

type Mode = "approve" | "reject";

interface Props {
    isOpen: boolean;
    mode: Mode;
    item: ApiQualityControlItem;
    employees: ApiQualityControlEmployee[];
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

export default function QCActionModal({ isOpen, mode, item, employees, onClose, onCompleted }: Props) {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isApprove = mode === "approve";
    const currentEmployee = currentUserId === null ? null : employees.find((employee) => employee.user === currentUserId && employee.is_active);

    useEffect(() => {
        if (!isOpen) return;
        setNote("");
        setFile(null);
        setError("");
        setCurrentUserId(null);
        setLoadingUser(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        axiosInstance.get("/accounts/api/v1/auth/me/")
            .then(({ data }) => setCurrentUserId(Number(data.id)))
            .catch((err) => setError(getErrorMessage(err, "دریافت اطلاعات کاربر انجام نشد")))
            .finally(() => setLoadingUser(false));
    }, [isOpen, item.id, mode]);

    function closeModal() {
        if (!loading) onClose();
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loadingUser) return setError("در حال تشخیص کارمند کنترل کیفی...");
        if (!currentEmployee) return setError("کاربر فعلی عضو فعال تیم کنترل کیفی نیست");
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("checked_by", String(currentEmployee.id));
            formData.append("note", note.trim());
            if (file) formData.append("file", file);
            const endpoint = isApprove ? `/quality_control/api/v1/${item.id}/approve/` : `/quality_control/api/v1/${item.id}/reject/`;
            const { data } = await axiosInstance.post<QualityControlActionResponse>(endpoint, formData);
            onCompleted(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, isApprove ? "تایید کالا انجام نشد" : "رد کالا انجام نشد"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
                    <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} className="w-full max-w-md overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#17181A]">
                        <div className="flex items-center justify-between border-b border-black/[0.05] p-5 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isApprove ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                    {isApprove ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black text-gray-900 dark:text-white">{isApprove ? "تایید کنترل کیفی" : "رد کنترل کیفی"}</h3>
                                    <p className="mt-1 text-[9.5px] font-bold text-gray-400">{item.product_name}</p>
                                </div>
                            </div>
                            <button type="button" onClick={closeModal} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-300"><X size={16} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5">
                            <div className="rounded-2xl bg-blue-500/[0.06] p-3.5">
                                <p className="text-[9px] font-bold text-gray-400">بررسی‌کننده</p>
                                <p className="mt-1 text-[11px] font-black text-gray-800 dark:text-white">
                                    {loadingUser ? "در حال تشخیص..." : currentEmployee?.username || "کارمند کنترل کیفی فعال یافت نشد"}
                                </p>
                            </div>

                            <label className="mt-4 block">
                                <span className="mb-2 block text-[10px] font-black text-gray-700 dark:text-gray-300">توضیحات</span>
                                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="توضیحات بررسی را وارد کنید..." className="w-full resize-none rounded-2xl border border-black/[0.06] bg-gray-50 p-3 text-[10.5px] font-bold outline-none transition focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-white" />
                            </label>

                            <div className="mt-4">
                                <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/[0.08] bg-gray-50 px-4 py-4 text-[10px] font-black text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-gray-300">
                                    <Upload size={15} />{file ? file.name : "افزودن فایل"}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-red-500/[0.07] p-3 text-red-500">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold leading-5">{error}</p>
                                </div>
                            )}

                            <div className="mt-5 grid grid-cols-2 gap-2">
                                <button type="button" onClick={closeModal} disabled={loading} className="h-11 rounded-2xl bg-gray-100 text-[10.5px] font-black text-gray-600 dark:bg-white/[0.05] dark:text-gray-300">انصراف</button>
                                <button type="submit" disabled={loading || loadingUser || !currentEmployee} className={`flex h-11 items-center justify-center gap-2 rounded-2xl text-[10.5px] font-black text-white disabled:opacity-40 ${isApprove ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : isApprove ? "تایید نهایی" : "رد نهایی"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}