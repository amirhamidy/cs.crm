"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useTheme } from "next-themes";
import {
    CheckCircle2,
    FileSpreadsheet,
    Loader2,
    UploadCloud,
    X,
} from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    performedById?: number | null;
    warehouseId?: number | null;
    onCompleted?: () => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const data = (err as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return fallback;
    for (const key of ["detail", "message", "error", "non_field_errors", "file", "performed_by_id", "warehouse_id"]) {
        const v = data[key];
        if (typeof v === "string") return v;
        if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
    return fallback;
}

export default function WarehouseEmployeeBulkImportModal({
    isOpen,
    onClose,
    performedById,
    warehouseId,
    onCompleted,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    function reset() {
        setFile(null);
        setError("");
        setSuccess(false);
        setLoading(false);
    }

    function handleClose() {
        if (loading) return;
        reset();
        onClose();
    }

    function pickFile(f: File) {
        setError("");
        setSuccess(false);
        setFile(f);
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) pickFile(f);
    }

    async function handleSubmit() {
        if (!file) {
            setError("لطفاً یک فایل انتخاب کنید.");
            return;
        }
        if (!performedById) {
            setError("اطلاعات کاربر یافت نشد.");
            return;
        }

        setLoading(true);
        setError("");

        const form = new FormData();
        form.append("file", file);
        form.append("performed_by_id", String(performedById));

        const url =
            warehouseId != null
                ? `/warehouse/api/v1/products/bulk-import/${warehouseId}/`
                : "/warehouse/api/v1/products/bulk-import/";

        try {
            await axiosInstance.post(url, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccess(true);
            setTimeout(() => {
                reset();
                onClose();
                onCompleted?.();
            }, 1400);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در آپلود فایل"));
        } finally {
            setLoading(false);
        }
    }

    const surface = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)";

    return (
        <AnimatePresence>
            {isOpen && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,.5)",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <m.div
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="w-full max-w-[400px] rounded-[2rem] p-5"
                        style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            border: `1px solid ${border}`,
                            boxShadow: isDark
                                ? "0 20px 60px rgba(0,0,0,.45)"
                                : "0 20px 48px rgba(15,23,42,.1)",
                        }}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                    style={{
                                        background: isDark
                                            ? "rgba(99,102,241,.14)"
                                            : "rgba(99,102,241,.08)",
                                    }}
                                >
                                    <UploadCloud
                                        size={16}
                                        className="text-indigo-500"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        ثبت گروهی محصولات
                                    </h3>
                                    <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                        {warehouseId != null
                                            ? "ثبت کالا همراه با موجودی اول دوره در این انبار"
                                            : "آپلود فایل اکسل / CSV"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.05] dark:hover:bg-white/[0.09]"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div
                            onClick={() => !loading && inputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 transition-colors"
                            style={{
                                borderColor: dragging
                                    ? "#6366f1"
                                    : isDark
                                        ? "rgba(255,255,255,.1)"
                                        : "rgba(99,102,241,.25)",
                                background: dragging
                                    ? isDark
                                        ? "rgba(99,102,241,.08)"
                                        : "rgba(99,102,241,.04)"
                                    : surface,
                            }}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) pickFile(f);
                                    e.target.value = "";
                                }}
                            />

                            {file ? (
                                <>
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(16,185,129,.14)"
                                                : "rgba(16,185,129,.08)",
                                        }}
                                    >
                                        <FileSpreadsheet
                                            size={20}
                                            className="text-emerald-500"
                                        />
                                    </div>
                                    <p className="max-w-full truncate text-[12.5px] font-bold text-gray-700 dark:text-white/85">
                                        {file.name}
                                    </p>
                                    <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                        {(file.size / 1024).toFixed(1)} KB — برای تغییر کلیک کن
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(99,102,241,.12)"
                                                : "rgba(99,102,241,.07)",
                                        }}
                                    >
                                        <UploadCloud
                                            size={20}
                                            className="text-indigo-400"
                                        />
                                    </div>
                                    <p className="text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">
                                        فایل را اینجا بکش یا کلیک کن
                                    </p>
                                    <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                        پشتیبانی از .xlsx، .xls، .csv
                                    </p>
                                    <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                        ستون اختیاری «کد قفسه» (یا قفسه / shelf / code_shelf) پشتیبانی می‌شود
                                    </p>
                                </>
                            )}
                        </div>

                        {error && (
                            <p className="mt-3 text-center text-[11.5px] font-semibold leading-5 text-red-500">
                                {error}
                            </p>
                        )}

                        {success && (
                            <m.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-bold text-emerald-500"
                            >
                                <CheckCircle2 size={14} />
                                محصولات با موفقیت ثبت شدند
                            </m.div>
                        )}

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-[12.5px] font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.09]"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !file || success}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-2.5 text-[12.5px] font-bold text-white transition-opacity hover:bg-indigo-500 disabled:opacity-55"
                            >
                                {loading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    "آپلود و ثبت"
                                )}
                            </button>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}