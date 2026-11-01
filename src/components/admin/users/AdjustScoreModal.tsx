"use client";

import { useState } from "react";
import { Plus, Minus, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { scoreApi } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
        <Modal
            open={isOpen}
            onClose={handleClose}
            busy={loading}
            title="تغییر امتیاز"
            subtitle={
                currentScore !== null
                    ? `${employeeName} • امتیاز فعلی: ${currentScore}`
                    : employeeName
            }
            icon={<SlidersHorizontal size={18} />}
            maxWidth="max-w-[400px]"
            footer={
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                        fullWidth
                    >
                        انصراف
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        loading={loading}
                        fullWidth
                        className="text-white"
                        style={{
                            background: accent,
                            boxShadow: `0 10px 24px ${accent}38`,
                        }}
                    >
                        {isAdd ? "افزایش امتیاز" : "کسر امتیاز"}
                    </Button>
                </div>
            }
        >
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
                            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-all"
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
                className="mb-3 min-h-11 w-full rounded-2xl px-3.5 py-2.5 text-[13px] text-gray-900 outline-none dark:text-white"
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
                <p role="alert" className="mt-3 text-[11.5px] font-bold text-red-500">
                    {error}
                </p>
            )}
        </Modal>
    );
}
