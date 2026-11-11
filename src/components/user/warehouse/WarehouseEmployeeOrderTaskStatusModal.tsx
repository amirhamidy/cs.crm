"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Loader2, Package, Upload, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiOrderTask, ApiProduct } from "@/types/warehouse";

interface Props {
    open: boolean;
    orderTask: ApiOrderTask;
    products?: ApiProduct[];
    performedBy: number | string | null;
    initialStatus: "completed" | "cancelled";
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

interface ItemState {
    id: number;
    product_id: number;
    product_name: string;
    requested_quantity: number;
    available_quantity: number;
    checked: boolean;
    quantity: number;
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
    const [items, setItems] = useState<ItemState[]>([]);
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setStatus(initialStatus);
            setNote("");
            setFile(null);
            setError("");
            if (fileRef.current) fileRef.current.value = "";

            const orderItems = (orderTask as any).items || [];
            const pendingItems = orderItems.filter((item: any) => item.status === "pending");

            setItems(
                pendingItems.map((item: any) => {
                    const productId = typeof item.product === "object" ? item.product.id : item.product;
                    const foundProduct = products.find((p) => p.id === productId);

                    return {
                        id: item.id,
                        product_id: productId,
                        product_name: item.product_name || foundProduct?.name || "محصول نامشخص",
                        requested_quantity: Number(item.quantity),
                        available_quantity: Number(item.available_quantity ?? item.quantity),
                        checked: true,
                        quantity: Number(item.quantity),
                    };
                })
            );
        }
    }, [open, orderTask, initialStatus, products]);

    const toggleItem = (id: number, checked: boolean) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, checked, quantity: checked ? item.requested_quantity : 0 } : item
            )
        );
    };

    const updateQuantity = (id: number, value: string) => {
        const num = Number(value.replace(/[^0-9.]/g, ""));
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const maxQ = Math.min(item.requested_quantity, item.available_quantity);
                    const newQ = Math.max(0, Math.min(num, maxQ));
                    return { ...item, quantity: newQ };
                }
                return item;
            })
        );
    };

    async function handleSubmit() {
        if (performedBy == null) {
            setError("اطلاعات انباردار یافت نشد");
            return;
        }

        if (status === "cancelled" && !note.trim()) {
            setError("ذکر دلیل لغو الزامی است");
            return;
        }

        if (status === "completed" && items.filter((i) => i.checked).length === 0) {
            setError("حداقل یک کالا باید برای تایید انتخاب شود");
            return;
        }

        setSubmitting(true);
        setError("");

        const formData = new FormData();
        formData.append("performed_by", String(performedBy));

        if (status === "completed") {
            const itemsToConfirm = items
                .filter((i) => i.checked)
                .map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
            formData.append("items", JSON.stringify(itemsToConfirm));
        } else {
            formData.append("status", "cancelled");
        }

        if (note.trim()) {
            formData.append("note", note.trim());
        }

        if (file) {
            formData.append("file", file);
        }

        try {
            const endpoint =
                status === "completed"
                    ? `/warehouse/api/v1/order_task/${orderTask.id}/confirm/`
                    : `/warehouse/api/v1/order_task/${orderTask.id}/update/`;

            await axiosInstance.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            await onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.response?.data?.note || "خطا در ثبت تغییرات";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={() => !submitting && onClose()}
                    dir="rtl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <Package size={18} className="text-indigo-500" />
                                <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                    {status === "completed" ? "تایید و خروج کالا" : "لغو درخواست"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {status === "completed" ? (
                                <div className="space-y-4">
                                    <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                                        کالاهای در انتظار تایید:
                                    </p>
                                    <div className="space-y-3">
                                        {items.length === 0 ? (
                                            <p className="py-4 text-center text-[12px] text-gray-400">کالایی در انتظار تایید وجود ندارد.</p>
                                        ) : (
                                            items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex flex-col gap-3 rounded-2xl border p-3 transition-colors ${item.checked
                                                            ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/20 dark:bg-indigo-500/5"
                                                            : "border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-white/5"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <label className="flex flex-1 cursor-pointer items-center gap-2.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.checked}
                                                                onChange={(e) => toggleItem(item.id, e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                                                                {item.product_name}
                                                            </span>
                                                        </label>
                                                        <span className="text-[11px] font-semibold text-gray-400">
                                                            موجودی: {item.available_quantity}
                                                        </span>
                                                    </div>

                                                    {item.checked && (
                                                        <div className="flex items-center gap-2 pr-6">
                                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                                تعداد تایید شده:
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={Math.min(item.requested_quantity, item.available_quantity)}
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                                className="w-24 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-[12px] font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                            />
                                                            <span className="text-[11px] text-gray-400">
                                                                از {item.requested_quantity}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                                        <p className="text-[12px] font-bold text-red-600 dark:text-red-400">
                                            توجه: با لغو درخواست، سفارش به طور کامل کنسل شده و فرآیند متوقف می‌شود.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 space-y-3">
                                <label className="block text-[12px] font-bold text-gray-700 dark:text-gray-300">
                                    یادداشت {status === "cancelled" && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={status === "cancelled" ? "دلیل لغو را وارد کنید..." : "توضیحات تکمیلی (اختیاری)"}
                                    rows={3}
                                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />

                                <div>
                                    <label className="mb-2 block text-[12px] font-bold text-gray-700 dark:text-gray-300">
                                        ضمیمه (اختیاری)
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-2.5 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/10">
                                            <Upload size={14} />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                            {file?.name || "افزودن فایل"}
                                        </span>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                    <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 p-5 dark:border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-[13px] font-bold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                            >
                                انصراف
                            </button>
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`flex h-11 flex-[2] items-center justify-center gap-2 rounded-2xl text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${status === "completed"
                                        ? "bg-emerald-600 hover:bg-emerald-500"
                                        : "bg-red-600 hover:bg-red-500"
                                    }`}
                            >
                                {submitting ? (
                                    <Loader2 size={15} className="animate-spin" />
                                ) : (
                                    <>
                                        <Check size={14} strokeWidth={3} />
                                        {status === "completed" ? "تایید و ثبت خروج" : "ثبت لغو"}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}