"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    ClipboardList,
    FileText,
    Loader2,
    Package,
    Paperclip,
    User,
    X,
    XCircle,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiOrderTask } from "@/types/warehouse";

interface Props {
    open: boolean;
    orderTask: ApiOrderTask | null;
    performedBy: number | string | null;
    initialStatus: "completed" | "cancelled";
    onClose: () => void;
    onSuccess?: () => Promise<void> | void;
}

function formatNumber(value: number | string | null | undefined) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return new Intl.NumberFormat("fa-IR").format(number);
}

function getObjectValue(
    value: unknown,
    key: string
) {
    if (
        value &&
        typeof value === "object"
    ) {
        return String(
            (value as Record<string, unknown>)[key] ?? ""
        );
    }

    return "";
}

export default function WarehouseEmployeeOrderTaskStatusModal({
    open,
    orderTask,
    performedBy,
    initialStatus,
    onClose,
    onSuccess,
}: Props) {
    const [status, setStatus] =
        useState<"completed" | "cancelled">(
            initialStatus
        );

    const [completedQuantity, setCompletedQuantity] =
        useState("");

    const [note, setNote] =
        useState("");

    const [file, setFile] =
        useState<File | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!open || !orderTask) {
            return;
        }

        setStatus(initialStatus);

        setCompletedQuantity(
            orderTask.completed_quantity !== null &&
                orderTask.completed_quantity !== undefined
                ? String(
                    orderTask.completed_quantity
                )
                : String(
                    orderTask.quantity ?? ""
                )
        );

        setNote("");
        setFile(null);
        setError("");
    }, [
        open,
        orderTask,
        initialStatus,
    ]);

    if (!open || !orderTask) {
        return null;
    }

    const orderData =
        orderTask as unknown as Record<string, unknown>;

    const expectedQuantity =
        Number(orderTask.quantity ?? 0);

    const productName =
        getObjectValue(
            orderData.product,
            "title"
        ) ||
        getObjectValue(
            orderData.product,
            "name"
        ) ||
        String(
            orderData.product_name ??
            orderData.product_title ??
            "محصول نامشخص"
        );

    const caseTitle =
        getObjectValue(
            orderData.case,
            "title"
        ) ||
        String(
            orderData.case_title ??
            "بدون کیس"
        );

    const customerName =
        getObjectValue(
            orderData.customer,
            "full_name"
        ) ||
        getObjectValue(
            orderData.customer,
            "name"
        ) ||
        String(
            orderData.customer_name ??
            "بدون مشتری"
        );

    const submit = async () => {
        if (
            performedBy === null ||
            performedBy === undefined ||
            performedBy === ""
        ) {
            setError("شناسه انباردار پیدا نشد.");
            return;
        }

        if (!orderTask.id) {
            setError("شناسه تسک پیدا نشد.");
            return;
        }

        if (
            status === "completed" &&
            completedQuantity.trim() === ""
        ) {
            setError(
                "مقدار تکمیل شده را وارد کنید."
            );
            return;
        }

        const quantity =
            Number(completedQuantity);

        if (
            status === "completed" &&
            (!Number.isFinite(quantity) ||
                quantity < 0)
        ) {
            setError(
                "مقدار تکمیل شده معتبر نیست."
            );
            return;
        }

        if (
            status === "completed" &&
            Number.isFinite(expectedQuantity) &&
            quantity > expectedQuantity
        ) {
            setError(
                `مقدار تکمیل شده نمی‌تواند بیشتر از ${formatNumber(
                    expectedQuantity
                )} باشد.`
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();

            formData.append(
                "performed_by",
                String(performedBy)
            );

            formData.append(
                "status",
                status
            );

            if (status === "completed") {
                formData.append(
                    "completed_quantity",
                    String(quantity)
                );
            }

            if (note.trim()) {
                formData.append(
                    "note",
                    note.trim()
                );
            }

            if (file) {
                formData.append(
                    "file",
                    file
                );
            }

            await axiosInstance.patch(
                `/warehouse/api/v1/order_task/${orderTask.id}/update/`,
                formData
            );

            onClose();

            await onSuccess?.();
        } catch (err: any) {
            const responseData =
                err?.response?.data;

            const message =
                responseData?.detail ||
                responseData?.message ||
                responseData?.error ||
                responseData?.status ||
                "ثبت وضعیت تسک با خطا مواجه شد.";

            setError(
                typeof message === "string"
                    ? message
                    : "ثبت وضعیت تسک با خطا مواجه شد."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            dir="rtl"
            className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5"
        >
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={() => {
                    if (!loading) {
                        onClose();
                    }
                }}
            />

            <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
                <div className="relative overflow-hidden border-b border-slate-100 px-5 py-5">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-600 via-indigo-500 to-purple-600" />

                    <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${status === "completed"
                                        ? "bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-600"
                                        : "bg-rose-50 text-rose-600"
                                    }`}
                            >
                                {status === "completed" ? (
                                    <CheckCircle2 size={21} />
                                ) : (
                                    <XCircle size={21} />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-[15px] font-black text-slate-950">
                                    ثبت نتیجه تسک
                                </h2>

                                <p className="mt-1 text-[10px] font-bold text-slate-400">
                                    تسک #{orderTask.id}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-l from-blue-50 via-indigo-50/70 to-purple-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                                <ClipboardList size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-bold text-indigo-500">
                                    درخواست
                                </p>

                                <p className="mt-1 text-[13px] font-black leading-6 text-slate-950">
                                    {orderTask.title ||
                                        "بدون عنوان درخواست"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-white/80 px-3 py-2.5">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                    <Package size={12} />
                                    محصول
                                </div>

                                <p className="mt-1 truncate text-[10.5px] font-black text-slate-800">
                                    {productName}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/80 px-3 py-2.5">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                    <User size={12} />
                                    مشتری
                                </div>

                                <p className="mt-1 truncate text-[10.5px] font-black text-slate-800">
                                    {customerName}
                                </p>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2.5">
                            <span className="text-[9px] font-bold text-slate-400">
                                کیس
                            </span>

                            <span className="max-w-[70%] truncate text-[10px] font-black text-slate-700">
                                {caseTitle}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5">
                        <p className="mb-2.5 text-[11px] font-black text-slate-800">
                            وضعیت جدید
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                    setStatus(
                                        "completed"
                                    )
                                }
                                className={`flex h-11 items-center justify-center gap-2 rounded-2xl border text-[10.5px] font-black transition ${status === "completed"
                                        ? "border-indigo-500 bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                                    }`}
                            >
                                <CheckCircle2 size={16} />
                                تکمیل شده
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                    setStatus(
                                        "cancelled"
                                    )
                                }
                                className={`flex h-11 items-center justify-center gap-2 rounded-2xl border text-[10.5px] font-black transition ${status === "cancelled"
                                        ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/15"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/50"
                                    }`}
                            >
                                <XCircle size={16} />
                                لغو شده
                            </button>
                        </div>
                    </div>

                    {status === "completed" && (
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-[10.5px] font-black text-slate-800">
                                    مقدار تکمیل شده
                                </label>

                                <span className="text-[9px] font-bold text-slate-400">
                                    درخواست:{" "}
                                    {formatNumber(
                                        expectedQuantity
                                    )}
                                </span>
                            </div>

                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={completedQuantity}
                                onChange={(event) =>
                                    setCompletedQuantity(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                                placeholder="مقدار تحویل داده شده"
                            />
                        </div>
                    )}

                    <div className="mt-5">
                        <label className="mb-2 flex items-center gap-1.5 text-[10.5px] font-black text-slate-800">
                            <FileText size={13} />
                            یادداشت
                        </label>

                        <textarea
                            value={note}
                            onChange={(event) =>
                                setNote(
                                    event.target.value
                                )
                            }
                            disabled={loading}
                            rows={3}
                            placeholder={
                                status === "completed"
                                    ? "توضیحات مربوط به انجام تسک..."
                                    : "دلیل لغو یا توضیحات مربوط به تسک..."
                            }
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-[10.5px] font-black text-slate-800">
                            پیوست
                        </label>

                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3.5 transition hover:border-indigo-300 hover:bg-indigo-50/40">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
                                <Paperclip size={14} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-bold text-slate-700">
                                    {file
                                        ? file.name
                                        : "انتخاب فایل"}
                                </p>

                                {!file && (
                                    <p className="mt-0.5 text-[8px] text-slate-400">
                                        فایل نتیجه را در صورت نیاز اضافه کنید
                                    </p>
                                )}
                            </div>

                            <input
                                type="file"
                                className="hidden"
                                disabled={loading}
                                onChange={(event) =>
                                    setFile(
                                        event.target.files?.[0] ??
                                        null
                                    )
                                }
                            />
                        </label>

                        {file && (
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                    setFile(null)
                                }
                                className="mt-2 text-[9px] font-bold text-rose-500"
                            >
                                حذف فایل
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-bold leading-5 text-rose-700">
                            {error}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 bg-white p-4">
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onClose}
                            className="h-11 rounded-2xl bg-slate-100 text-[10.5px] font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                        >
                            انصراف
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={submit}
                            className={`flex h-11 items-center justify-center gap-2 rounded-2xl text-[10.5px] font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${status === "completed"
                                    ? "bg-gradient-to-l from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/15 hover:from-blue-700 hover:to-indigo-700"
                                    : "bg-rose-600 shadow-lg shadow-rose-500/10 hover:bg-rose-700"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    در حال ثبت...
                                </>
                            ) : (
                                <>
                                    {status ===
                                        "completed" ? (
                                        <CheckCircle2
                                            size={16}
                                        />
                                    ) : (
                                        <XCircle
                                            size={16}
                                        />
                                    )}

                                    ثبت نتیجه
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}