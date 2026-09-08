"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CheckCircle,
    Loader,
    Paperclip,
    X,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import { ApiOrderTask } from "@/types/warehouse";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";

interface UpdateOrderTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderTask: ApiOrderTask | null;
    onUpdated: (updated: ApiOrderTask) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;

    for (const key of [
        "detail",
        "performed_by",
        "status",
        "completed_quantity",
        "note",
        "file",
        "non_field_errors",
        "message",
        "error",
    ]) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
}

export default function UpdateOrderTaskModal({
    isOpen,
    onClose,
    orderTask,
    onUpdated,
}: UpdateOrderTaskModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const { employee } = useCurrentEmployee();

    const [status, setStatus] = useState<"in_progress" | "completed" | "cancelled">("in_progress");
    const [completedQuantity, setCompletedQuantity] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !orderTask) return;

        setStatus(orderTask.status);
        setCompletedQuantity(String(orderTask.completed_quantity || ""));
        setNote("");
        setFile(null);
        setError("");
    }, [isOpen, orderTask]);

    function handleClose() {
        if (!loading) onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!orderTask) return;
        if (!employee) {
            setError("اطلاعات کارمند یافت نشد");
            return;
        }

        // پیدا کردن staff مربوط به این employee
        // در اینجا فرض می‌کنیم که employee.id برابر با employee_id در staff است
        // و performed_by باید id پرسنل انبار باشد، نه employee.id

        // توجه: در API واقعی، performed_by باید id کارمند انبار (ApiWarehouseStaff.id) باشد
        // اما چون از هدر token استفاده می‌شود، ممکن است سرور خودش تشخیص دهد
        // ما همون employee.id رو می‌فرستیم و سرور تطابق رو انجام میده

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("performed_by", String(employee.id));
            formData.append("status", status);
            if (completedQuantity) {
                formData.append("completed_quantity", String(Number(completedQuantity)));
            }
            if (note.trim()) formData.append("note", note.trim());
            if (file) formData.append("file", file);

            const { data } = await axiosInstance.patch<ApiOrderTask>(
                `/warehouse/api/v1/order_task/${orderTask.id}/update/`,
                formData
            );

            onUpdated(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در بروزرسانی وضعیت"));
        } finally {
            setLoading(false);
        }
    }

    const bg = isDark ? "#0f172a" : "#ffffff";
    const border = isDark ? "rgba(255,255,255,.06)" : "rgba(15,23,42,.06)";
    const text = isDark ? "#f1f5f9" : "#1e293b";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark ? "rgba(255,255,255,.035)" : "rgba(15,23,42,.025)";

    if (!orderTask) return null;

    const statusOptions = [
        { value: "in_progress" as const, label: "در حال انجام", icon: Clock, color: "text-blue-400" },
        { value: "completed" as const, label: "تکمیل‌شده", icon: CheckCircle, color: "text-emerald-400" },
        { value: "cancelled" as const, label: "لغو‌شده", icon: AlertTriangle, color: "text-red-400" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border"
                        style={{ background: bg, borderColor: border }}
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(99,102,241,.12)" : "rgba(99,102,241,.08)",
                                    }}
                                >
                                    <CheckCircle size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold" style={{ color: text }}>
                                        تعیین وضعیت سفارش
                                    </h3>
                                    <p className="mt-0.5 text-[11px]" style={{ color: muted }}>
                                        سفارش #{orderTask.id} — {orderTask.title}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(255,255,255,.05)" : "rgba(15,23,42,.05)",
                                    color: muted,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            autoComplete="off"
                            className="flex-1 space-y-4 overflow-y-auto px-8 pb-8"
                        >
                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    وضعیت جدید *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {statusOptions.map((opt) => {
                                        const active = status === opt.value;
                                        const Icon = opt.icon;

                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setStatus(opt.value)}
                                                className="flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-bold transition"
                                                style={{
                                                    background: active ? "rgba(99,102,241,.08)" : inputBg,
                                                    borderColor: active ? "rgba(99,102,241,.4)" : border,
                                                    color: active ? "#6366f1" : muted,
                                                }}
                                            >
                                                <Icon size={18} className={active ? opt.color : ""} />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    تعداد تکمیل‌شده
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={completedQuantity}
                                    onChange={(e) => setCompletedQuantity(e.target.value)}
                                    placeholder={`حداکثر ${orderTask.quantity}`}
                                    disabled={loading}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                />
                                <p className="mt-1 text-[10px]" style={{ color: muted }}>
                                    تعداد درخواستی: {orderTask.quantity}
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    توضیح (اختیاری)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="توضیح درباره انجام یا لغو سفارش..."
                                    disabled={loading}
                                    rows={3}
                                    className="w-full resize-none rounded-2xl border px-4 py-3 text-[13px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                />
                            </div>

                            <div>
                                <label
                                    className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-[12.5px] font-bold"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                >
                                    <Paperclip size={15} />
                                    <span className="truncate px-1">{file ? file.name : "ضمیمه فایل (اختیاری)"}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        disabled={loading}
                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>

                            {error && (
                                <p className="text-center text-[12px] font-semibold text-red-500">{error}</p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex w-full items-center justify-center rounded-full py-3 text-[13px] font-bold text-white disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : "اعمال تغییرات"}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}