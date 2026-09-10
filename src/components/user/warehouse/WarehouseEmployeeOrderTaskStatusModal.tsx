"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Check,
    CheckCircle2,
    FileText,
    Loader2,
    Package,
    Paperclip,
    Upload,
    User,
    X,
    XCircle,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiOrderTask, ApiProduct } from "@/types/warehouse";

interface Props {
    open: boolean;
    orderTask: ApiOrderTask | null;
    products?: ApiProduct[];
    performedBy: number | string | null;
    initialStatus: "completed" | "cancelled";
    onClose: () => void;
    onSuccess?: () => Promise<void> | void;
}

function formatNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === "") return "—";
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return new Intl.NumberFormat("fa-IR").format(number);
}

function FloatingInput({
    label,
    id,
    value,
    onChange,
    type = "text",
    disabled,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

export default function WarehouseEmployeeOrderTaskStatusModal({
    open,
    orderTask,
    products = [],
    performedBy,
    initialStatus,
    onClose,
    onSuccess,
}: Props) {
    const [status, setStatus] = useState<"completed" | "cancelled">(initialStatus);
    const [completedQuantity, setCompletedQuantity] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !orderTask) return;
        setStatus(initialStatus);
        setCompletedQuantity(
            orderTask.completed_quantity !== null && orderTask.completed_quantity !== undefined
                ? String(orderTask.completed_quantity)
                : String(orderTask.quantity ?? "")
        );
        setNote("");
        setFile(null);
        setError("");
    }, [open, orderTask, initialStatus]);

    if (!open || !orderTask) return null;

    const orderData = orderTask as unknown as Record<string, unknown>;
    const expectedQuantity = Number(orderTask.quantity ?? 0);

    const productName = useMemo(() => {
        const rawProduct = orderData.product;

        if (typeof rawProduct === "number" && products.length > 0) {
            const found = products.find((p) => p.id === rawProduct);
            if (found) return found.name;
        }

        if (rawProduct && typeof rawProduct === "object") {
            const obj = rawProduct as Record<string, unknown>;
            if (obj.title) return String(obj.title);
            if (obj.name) return String(obj.name);
        }

        if (orderData.product_name) return String(orderData.product_name);
        if (orderData.product_title) return String(orderData.product_title);

        return "محصول نامشخص";
    }, [orderData.product, orderData.product_name, orderData.product_title, products]);

    const caseTitle =
        (orderData.case && typeof orderData.case === "object" && (orderData.case as any).title) ||
        String(orderData.case_title ?? "بدون کیس");

    const customerName =
        (orderData.customer && typeof orderData.customer === "object" && (orderData.customer as any).full_name) ||
        String(orderData.customer_name ?? "بدون مشتری");

    const submit = async () => {
        if (performedBy === null || performedBy === undefined || performedBy === "") {
            setError("شناسه انباردار پیدا نشد.");
            return;
        }
        if (!orderTask.id) {
            setError("شناسه تسک پیدا نشد.");
            return;
        }
        if (status === "completed" && completedQuantity.trim() === "") {
            setError("مقدار تکمیل شده را وارد کنید.");
            return;
        }
        const quantity = Number(completedQuantity);
        if (status === "completed" && (!Number.isFinite(quantity) || quantity < 0)) {
            setError("مقدار تکمیل شده معتبر نیست.");
            return;
        }
        if (status === "completed" && Number.isFinite(expectedQuantity) && quantity > expectedQuantity) {
            setError(`مقدار تکمیل شده نمی‌تواند بیشتر از ${formatNumber(expectedQuantity)} باشد.`);
            return;
        }

        try {
            setLoading(true);
            setError("");
            const formData = new FormData();
            formData.append("performed_by", String(performedBy));
            formData.append("status", status);
            if (status === "completed") {
                formData.append("completed_quantity", String(quantity));
            }
            if (note.trim()) formData.append("note", note.trim());
            if (file) formData.append("file", file);

            await axiosInstance.patch(`/warehouse/api/v1/order_task/${orderTask.id}/update/`, formData);
            onClose();
            await onSuccess?.();
        } catch (err: any) {
            const responseData = err?.response?.data;
            const message =
                responseData?.detail ||
                responseData?.message ||
                responseData?.error ||
                responseData?.status ||
                "ثبت وضعیت تسک با خطا مواجه شد.";
            setError(typeof message === "string" ? message : "ثبت وضعیت تسک با خطا مواجه شد.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => !loading && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
            >
                <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{
                                background:
                                    status === "completed"
                                        ? "rgba(16,185,129,0.1)"
                                        : "rgba(244,63,94,0.1)",
                            }}
                        >
                            {status === "completed" ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                                <XCircle size={16} className="text-rose-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                ثبت نتیجه تسک
                            </h3>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                                تسک #{orderTask.id}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-2">
                    <div className="flex flex-col gap-4">
                        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                            <div className="flex items-start gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/10">
                                    <Package size={15} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                                        درخواست
                                    </p>
                                    <p className="mt-0.5 truncate text-[12px] font-black text-gray-800 dark:text-gray-100">
                                        {orderTask.title || "بدون عنوان درخواست"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-white px-2.5 py-2 dark:bg-white/[0.04]">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-white/40">
                                        <Package size={10} />
                                        محصول
                                    </div>
                                    <p className="mt-0.5 truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                        {productName}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white px-2.5 py-2 dark:bg-white/[0.04]">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-white/40">
                                        <User size={10} />
                                        مشتری
                                    </div>
                                    <p className="mt-0.5 truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                        {customerName}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 rounded-xl bg-white px-2.5 py-2 dark:bg-white/[0.04]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-gray-400 dark:text-white/40">کیس</span>
                                    <span className="max-w-[70%] truncate text-[10px] font-black text-gray-700 dark:text-gray-200">
                                        {caseTitle}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-[11.5px] font-bold text-gray-400">وضعیت جدید</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setStatus("completed")}
                                    className={`flex h-11 items-center justify-center gap-2 rounded-2xl border text-[11px] font-bold transition ${status === "completed"
                                            ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-emerald-500/30"
                                        }`}
                                >
                                    <CheckCircle2 size={15} />
                                    تکمیل شده
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setStatus("cancelled")}
                                    className={`flex h-11 items-center justify-center gap-2 rounded-2xl border text-[11px] font-bold transition ${status === "cancelled"
                                            ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-rose-500/30"
                                        }`}
                                >
                                    <XCircle size={15} />
                                    لغو شده
                                </button>
                            </div>
                        </div>

                        {status === "completed" && (
                            <FloatingInput
                                id="completed_quantity"
                                label="مقدار تکمیل شده"
                                type="number"
                                value={completedQuantity}
                                onChange={setCompletedQuantity}
                                disabled={loading}
                            />
                        )}

                        <div className="relative">
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={loading}
                                rows={3}
                                placeholder={
                                    status === "completed"
                                        ? "توضیحات مربوط به انجام تسک..."
                                        : "دلیل لغو یا توضیحات مربوط به تسک..."
                                }
                                className="peer w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-6 pb-3 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                            />
                            <label className="pointer-events-none absolute right-4 top-4 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]">
                                یادداشت
                            </label>
                        </div>

                        <label className="flex h-[52px] cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                <Upload size={14} />
                            </span>
                            <span className="truncate text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                {file ? file.name : "افزودن فایل"}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                disabled={loading}
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </label>

                        {file && (
                            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                                <Paperclip size={12} className="shrink-0 text-gray-400" />
                                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                    {file.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                <FileText size={14} className="mt-0.5 shrink-0 text-red-500" />
                                <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                    {error}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setError("")}
                                    className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-full bg-gray-100 py-3 text-[12.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                    >
                        انصراف
                    </button>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={submit}
                        disabled={loading}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold text-white transition-colors disabled:opacity-50"
                        style={{
                            background:
                                status === "completed"
                                    ? "linear-gradient(135deg,#10b981,#059669)"
                                    : "linear-gradient(135deg,#f43f5e,#e11d48)",
                            boxShadow:
                                status === "completed"
                                    ? "0 10px 24px rgba(16,185,129,0.22)"
                                    : "0 10px 24px rgba(244,63,94,0.22)",
                        }}
                    >
                        {loading ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>
                                {status === "completed" ? <Check size={14} strokeWidth={3} /> : <XCircle size={15} />}
                                ثبت نتیجه
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}