"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Loader2,
    Trash2
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface ImportResponse {
    detail: string;
    created_count: number;
    duplicate_count: number;
    error_count: number;
    created?: Array<{ full_name: string; phone_number: string }>;
    duplicates?: any[];
    errors?: any[];
}

interface ImportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportExcelModal({
    isOpen,
    onClose,
    onSuccess,
}: ImportExcelModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setResult(null);
        setErrorMessage(null);
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const validateAndSetFile = (selectedFile: File) => {
        setErrorMessage(null);
        const validExtensions = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];
        const isExcel =
            validExtensions.includes(selectedFile.type) ||
            selectedFile.name.endsWith(".xlsx") ||
            selectedFile.name.endsWith(".xls");

        if (!isExcel) {
            setErrorMessage("لطفاً فقط فایل اکسل با پسوند xlsx. یا xls. انتخاب کنید.");
            return;
        }

        setFile(selectedFile);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axiosInstance.post<ImportResponse>(
                "/customers/api/v1/customers/bulk-import/",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setResult(res.data);
            onSuccess(); // ریفرش لیست مشتری‌ها در پس‌زمینه
        } catch (err: any) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "خطایی در آپلود و پردازش فایل رخ داد.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    dir="rtl"
                    className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#12141a]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <FileSpreadsheet size={18} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                                    ثبت گروهی مشتریان با اکسل
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    فایل حاوی اطلاعات مخاطبین را بارگذاری کنید
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="mt-5 space-y-4">
                        {errorMessage && (
                            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-[12px] font-medium text-red-500">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {!result ? (
                            <>
                                {/* Drag & Drop Area */}
                                {!file ? (
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => inputRef.current?.click()}
                                        className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-7 text-center transition-all ${isDragging
                                                ? "border-emerald-500 bg-emerald-500/5"
                                                : "border-gray-200 hover:border-emerald-500/50 hover:bg-gray-50/50 dark:border-white/10 dark:hover:bg-white/[0.02]"
                                            }`}
                                    >
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            accept=".xlsx, .xls"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                                            <UploadCloud size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[12.5px] font-bold text-gray-700 dark:text-gray-200">
                                                فایل اکسل را اینجا بکشید یا کلیک کنید
                                            </p>
                                            <p className="mt-1 text-[11px] text-gray-400">
                                                فرمت‌های مجاز: xlsx, xls
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* File Preview */
                                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <FileSpreadsheet size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-200">
                                                    {file.name}
                                                </p>
                                                <p className="text-[10.5px] text-gray-400">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={resetState}
                                            disabled={loading}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Success / Result View */
                            <div className="space-y-4">
                                <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                                    <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                                        {result.detail || "پردازش فایل با موفقیت انجام شد"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                        <div className="flex items-center justify-center gap-1 text-emerald-500">
                                            <CheckCircle2 size={14} />
                                            <span className="text-[11px]">ثبت شده</span>
                                        </div>
                                        <p className="mt-1 text-[16px] font-black text-gray-900 dark:text-white">
                                            {result.created_count}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                        <div className="flex items-center justify-center gap-1 text-amber-500">
                                            <AlertTriangle size={14} />
                                            <span className="text-[11px]">تکراری</span>
                                        </div>
                                        <p className="mt-1 text-[16px] font-black text-gray-900 dark:text-white">
                                            {result.duplicate_count}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                        <div className="flex items-center justify-center gap-1 text-red-500">
                                            <XCircle size={14} />
                                            <span className="text-[11px]">خطا</span>
                                        </div>
                                        <p className="mt-1 text-[16px] font-black text-gray-900 dark:text-white">
                                            {result.error_count}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-xl px-4 py-2 text-[12px] font-bold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                        >
                            {result ? "بستن" : "انصراف"}
                        </button>

                        {!result && (
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-40"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>در حال پردازش...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={14} />
                                        <span>آپلود و ثبت</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
