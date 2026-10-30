"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Loader2, Plus, Minus, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { scoreApi } from "@/lib/api";

type AdjustAction = "add" | "deduct";

interface AdjustScoreModalProps {
    isOpen: boolean;
    employeeId: number;
    employeeName: string;
    currentScore?: number | null;
    initialAction?: AdjustAction;
    onClose: () => void;
    onSuccess: (action: AdjustAction, amount: number) => void;
}

const MAX_AMOUNT = 2147483647;

export default function AdjustScoreModal({
    isOpen,
    employeeId,
    employeeName,
    currentScore = null,
    initialAction = "add",
    onClose,
    onSuccess,
}: AdjustScoreModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [action, setAction] = useState<AdjustAction>(initialAction);
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const isAdd = action === "add";
    const accent = isAdd ? "#10b981" : "#ef4444";

    const handleClose = () => {
        if (loading) return;
        setAmount("");
        setReason("");
        setError("");
        setAction("add");
        onClose();
    };

    const handleSubmit = async () => {
        setError("");

        const numeric = Number(amount);
        if (!amount || !Number.isInteger(numeric) || numeric <= 0) {
            setError("مقدار امتیاز باید یک عدد صحیح مثبت باشد");
            return;
        }
        if (numeric > MAX_AMOUNT) {
            setError("مقدار وارد شده بیش از حد مجاز است");
            return;
        }
        if (!reason.trim()) {
            setError("لطفاً دلیل را وارد کنید");
            return;
        }

        setLoading(true);
        try {
            await scoreApi.adjust(employeeId, {
                employee: employeeId,
                action,
                amount: numeric,
                reason: reason.trim(),
            });
            onSuccess(action, numeric);
            setAmount("");
            setReason("");
            setAction("add");
            onClose();
        } catch (err) {
            const e = err as {
                response?: { data?: Record<string, unknown> & { detail?: string; message?: string } };
            };
            const data = e.response?.data;
            let msg = data?.detail || data?.message;
            if (!msg && data && typeof data === "object") {
                const first = Object.values(data)[0];
                msg = Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : undefined;
            }
            setError(msg || "تغییر امتیاز با خطا مواجه شد");
        } finally {
            setLoading(false);
        }
    };

    const fieldBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)";
    const fieldBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)";

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        >
            <m.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[400px] rounded-[2rem] p-5 shadow-2xl"
                style={{
                    background: isDark ? "#111827" : "#ffffff",
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(15,23,42,0.08)",
                }}
                dir="rtl"
            >
                <div className="mb-4 flex items-center gap-2.5">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(99,102,241,0.12)" }}
                    >
                        <SlidersHorizontal size={16} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            تغییر امتیاز
                        </h3>
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                            {employeeName}
                            {currentScore !== null ? ` • امتیاز فعلی: ${currentScore}` : ""}
                        </p>
                    </div>
                </div>

                
                <div
                    className="mb-3 grid grid-cols-2 gap-1.5 rounded-2xl p-1"
                    style={{ background: fieldBg }}
                >
                    {(
                        [
                            { key: "add", label: "افزایش امتیاز", icon: <Plus size={14} />, color: "#10b981" },
                            { key: "deduct", label: "کسر امتیاز", icon: <Minus size={14} />, color: "#ef4444" },
                        ] as const
                    ).map((opt) => {
                        const selected = action === opt.key;
                        return (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setAction(opt.key)}
                                disabled={loading}
                                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-all"
                                style={{
                                    background: selected ? opt.color : "transparent",
                                    color: selected ? "#fff" : isDark ? "#9ca3af" : "#6b7280",
                                    boxShadow: selected ? `0 6px 16px ${opt.color}40` : "none",
                                }}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                
                <label className="mb-1 block text-[11.5px] font-bold text-gray-600 dark:text-gray-400">
                    مقدار امتیاز
                </label>
                <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_AMOUNT}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    placeholder="مثلاً 5"
                    dir="ltr"
                    className="mb-3 w-full rounded-2xl px-3.5 py-2.5 text-[13px] text-gray-900 outline-none dark:text-white"
                    style={{ background: fieldBg, border: `1px solid ${fieldBorder}` }}
                />

                
                <label className="mb-1 block text-[11.5px] font-bold text-gray-600 dark:text-gray-400">
                    دلیل
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                    rows={3}
                    placeholder="دلیل تغییر امتیاز را بنویسید..."
                    className="w-full resize-none rounded-2xl px-3.5 py-2.5 text-[13px] text-gray-900 outline-none dark:text-white"
                    style={{ background: fieldBg, border: `1px solid ${fieldBorder}` }}
                />

                {error && (
                    <p className="mt-3 text-[11.5px] font-semibold text-red-500">{error}</p>
                )}

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold disabled:opacity-50"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                            color: isDark ? "#d1d5db" : "#4b5563",
                        }}
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                        style={{
                            background: accent,
                            boxShadow: `0 10px 24px ${accent}38`,
                        }}
                    >
                        {loading && <Loader2 size={15} className="animate-spin" />}
                        {loading ? "در حال ثبت..." : isAdd ? "افزایش امتیاز" : "کسر امتیاز"}
                    </button>
                </div>
            </m.div>
        </m.div>
    );
}