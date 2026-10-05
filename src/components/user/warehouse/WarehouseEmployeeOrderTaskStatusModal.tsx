"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Briefcase,
    Check,
    CheckCircle2,
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

const TONES = {
    completed: {
        title: "تایید و تکمیل درخواست",
        accent: "#10b981",
        soft: "rgba(16,185,129,0.12)",
        border: "rgba(16,185,129,0.22)",
        bar: "linear-gradient(90deg,#10b981,#34d399,#06b6d4)",
        gradient: "linear-gradient(135deg,#10b981,#059669)",
        shadow: "0 12px 26px rgba(16,185,129,0.28)",
    },
    cancelled: {
        title: "لغو درخواست",
        accent: "#f43f5e",
        soft: "rgba(244,63,94,0.12)",
        border: "rgba(244,63,94,0.22)",
        bar: "linear-gradient(90deg,#f43f5e,#fb7185,#f97316)",
        gradient: "linear-gradient(135deg,#f43f5e,#e11d48)",
        shadow: "0 12px 26px rgba(244,63,94,0.28)",
    },
} as const;

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

    const orderData = (orderTask ?? {}) as unknown as Record<string, unknown>;
    const expectedQuantity = Number(orderTask?.quantity ?? 0);

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

    if (!open || !orderTask) return null;

    const task = orderTask;
    const tone = TONES[status];
    const isCompleted = status === "completed";

    const caseTitle =
        (orderData.case && typeof orderData.case === "object" && (orderData.case as any).title) ||
        String(orderData.case_title ?? "بدون کیس");

    const customerName =
        (orderData.customer && typeof orderData.customer === "object" && (orderData.customer as any).full_name) ||
        String(orderData.customer_name ?? "بدون مشتری");

    const enteredQuantity = Number(completedQuantity);
    const progress =
        Number.isFinite(expectedQuantity) && expectedQuantity > 0 && Number.isFinite(enteredQuantity)
            ? Math.min(100, Math.max(0, (enteredQuantity / expectedQuantity) * 100))
            : 0;

    const submit = async () => {
        if (performedBy === null || performedBy === undefined || performedBy === "") {
            setError("شناسه انباردار پیدا نشد.");
            return;
        }
        if (!task.id) {
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

            await axiosInstance.patch(`/warehouse/api/v1/order_task/${task.id}/update/`, formData);
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
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4"
            style={{ background: "rgba(2,6,23,0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => !loading && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-black/20 dark:border-white/[0.07] dark:bg-[#0f172a]"
            >
                <div className="h-1.5 w-full shrink-0 transition-all duration-300" style={{ background: tone.bar }} />

                <div className="flex shrink-0 items-start justify-between gap-3 px-7 pb-5 pt-6">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300"
                            style={{ background: tone.soft, border: `1px solid ${tone.border}` }}
                        >
                            {isCompleted ? (
                                <CheckCircle2 size={21} style={{ color: tone.accent }} />
                            ) : (
                                <XCircle size={21} style={{ color: tone.accent }} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                {tone.title}
                            </h3>
                            <p className="mt-1 text-[11px] font-medium text-gray-400">
                                درخواست شماره {formatNumber(task.id)}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-700 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] dark:hover:text-white"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-7 pb-2">
                    <div className="flex flex-col gap-4">
                        <div className="rounded-[1.4rem] border border-gray-100 bg-gray-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                                    <Package size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9.5px] font-bold text-gray-400">درخواست</p>
                                    <p className="mt-0.5 truncate text-[12.5px] font-black text-gray-800 dark:text-gray-100">
                                        {task.title || "بدون عنوان درخواست"}
                                    </p>
                                </div>
                                <div className="shrink-0 rounded-xl bg-white px-2.5 py-1.5 text-center shadow-sm dark:bg-white/[0.06]">
                                    <p className="text-[8.5px] font-bold text-gray-400">تعداد</p>
                                    <p className="mt-0.5 text-[12px] font-black text-indigo-500">
                                        {formatNumber(expectedQuantity)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-white px-2.5 py-2 dark:bg-white/[0.04]">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                        <Package size={10} />
                                        محصول
                                    </div>
                                    <p className="mt-0.5 truncate text-[11px] font-black text-gray-700 dark:text-gray-200">
                                        {productName}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white px-2.5 py-2 dark:bg-white/[0.04]">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                        <User size={10} />
                                        مشتری
                                    </div>
                                    <p className="mt-0.5 truncate text-[11px] font-black text-gray-700 dark:text-gray-200">
                                        {customerName}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white px-2.5 py-2 dark:bg-white/[0.04]">
                                <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                    <Briefcase size={10} />
                                    پرونده
                                </span>
                                <span className="max-w-[70%] truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                    {caseTitle}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 px-1 text-[11.5px] font-black text-gray-700 dark:text-gray-200">
                                نتیجه درخواست
                            </p>
                            <div className="relative grid grid-cols-2 gap-1 rounded-[1.2rem] bg-gray-100 p-1 dark:bg-white/[0.05]">
                                {(["completed", "cancelled"] as const).map((value) => {
                                    const active = status === value;
                                    const itemTone = TONES[value];
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setStatus(value)}
                                            className="relative flex h-11 items-center justify-center gap-2 rounded-2xl text-[12px] font-extrabold transition-colors disabled:opacity-60"
                                            style={{ color: active ? "#ffffff" : undefined }}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="order-status-pill"
                                                    transition={{ type: "spring", damping: 26, stiffness: 340 }}
                                                    className="absolute inset-0 rounded-2xl"
                                                    style={{
                                                        background: itemTone.gradient,
                                                        boxShadow: itemTone.shadow,
                                                    }}
                                                />
                                            )}
                                            <span
                                                className={`relative flex items-center gap-2 ${active ? "" : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {value === "completed" ? (
                                                    <CheckCircle2 size={15} />
                                                ) : (
                                                    <XCircle size={15} />
                                                )}
                                                {value === "completed" ? "تایید و تکمیل" : "لغو درخواست"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {isCompleted && (
                                <motion.div
                                    key="quantity"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="rounded-[1.4rem] border border-gray-100 bg-gray-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.025]">
                                        <div className="mb-2.5 flex items-center justify-between">
                                            <div>
                                                <label
                                                    htmlFor="completed_quantity"
                                                    className="text-[11.5px] font-black text-gray-700 dark:text-gray-200"
                                                >
                                                    مقدار تکمیل شده
                                                </label>
                                                <p className="mt-0.5 text-[9.5px] font-medium text-gray-400">
                                                    حداکثر {formatNumber(expectedQuantity)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() => setCompletedQuantity(String(task.quantity ?? ""))}
                                                className="rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-opacity hover:opacity-80 disabled:opacity-40"
                                                style={{ background: tone.soft, color: tone.accent }}
                                            >
                                                مقدار کامل
                                            </button>
                                        </div>

                                        <input
                                            id="completed_quantity"
                                            type="number"
                                            min="0"
                                            max={Number.isFinite(expectedQuantity) ? expectedQuantity : undefined}
                                            step="any"
                                            value={completedQuantity}
                                            onChange={(e) => setCompletedQuantity(e.target.value)}
                                            disabled={loading}
                                            placeholder="مثلاً 10"
                                            className="h-[54px] w-full rounded-[1.1rem] border border-gray-200 bg-white px-4 text-[16px] font-black text-gray-900 outline-none transition-all placeholder:text-[11px] placeholder:font-medium placeholder:text-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07] disabled:opacity-60 dark:border-white/[0.07] dark:bg-[#111827] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/[0.08]"
                                        />

                                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.08]">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: tone.bar }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.25 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <div className="mb-2 flex items-center justify-between px-1">
                                <label
                                    htmlFor="order_status_note"
                                    className="text-[11.5px] font-black text-gray-700 dark:text-gray-200"
                                >
                                    {isCompleted ? "توضیحات" : "دلیل لغو"}
                                </label>
                                <span className="rounded-full bg-slate-400/15 px-2 py-0.5 text-[9.5px] font-extrabold text-slate-400">
                                    اختیاری
                                </span>
                            </div>
                            <textarea
                                id="order_status_note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={loading}
                                rows={3}
                                placeholder={
                                    isCompleted
                                        ? "توضیحات مربوط به انجام تسک..."
                                        : "دلیل لغو یا توضیحات مربوط به تسک..."
                                }
                                className="w-full resize-none rounded-[1.1rem] border border-gray-100 bg-gray-50 px-4 py-3 text-[12.5px] font-bold leading-6 text-gray-900 outline-none transition-all placeholder:text-[11.5px] placeholder:font-medium placeholder:text-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07] disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/50"
                            />
                        </div>

                        <div>
                            <label className="flex h-[54px] cursor-pointer items-center gap-3 rounded-[1.1rem] border border-dashed border-gray-200 bg-gray-50/60 px-3.5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                    <Upload size={15} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[12px] font-bold text-gray-600 dark:text-gray-300">
                                        {file ? "تغییر فایل" : "افزودن فایل"}
                                    </span>
                                    <span className="block text-[9.5px] font-medium text-gray-400">
                                        ضمیمه‌ی اختیاری
                                    </span>
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    disabled={loading}
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                />
                            </label>

                            {file && (
                                <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
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
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                >
                                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2.5 px-7 pb-7 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="h-12 flex-1 rounded-full bg-gray-100 text-[12.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                    >
                        انصراف
                    </button>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={submit}
                        disabled={loading}
                        className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full text-[13px] font-extrabold text-white transition-opacity disabled:opacity-50"
                        style={{ background: tone.gradient, boxShadow: tone.shadow }}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                {isCompleted ? <Check size={15} strokeWidth={3} /> : <XCircle size={16} />}
                                {isCompleted ? "تایید و ثبت نتیجه" : "ثبت لغو"}
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}