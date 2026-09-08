"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, X } from "lucide-react";
import { useTheme } from "next-themes";

interface TimeRangeModalProps {
    open: boolean;
    initialStartedAt: string | null;
    initialDeadline: string | null;
    onClose: () => void;
    onSubmit: (start: string, end: string) => void | Promise<void>;
}

function toLocalDateTimeValue(value: string | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function localDateTimeToISOString(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString();
}

export default function TimeRangeModal({
    open,
    initialStartedAt,
    initialDeadline,
    onClose,
    onSubmit,
}: TimeRangeModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setStart(toLocalDateTimeValue(initialStartedAt));
        setEnd(toLocalDateTimeValue(initialDeadline));
        setError("");
    }, [open, initialStartedAt, initialDeadline]);

    const bg = isDark ? "#0f172a" : "#ffffff";
    const border = isDark
        ? "rgba(255,255,255,.06)"
        : "rgba(15,23,42,.06)";
    const text = isDark ? "#f1f5f9" : "#1e293b";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark
        ? "rgba(255,255,255,.035)"
        : "rgba(15,23,42,.025)";

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!start || !end) {
            setError("تاریخ شروع و پایان الزامی هستند.");
            return;
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
        ) {
            setError("بازه زمانی وارد شده معتبر نیست.");
            return;
        }

        if (endDate <= startDate) {
            setError("مهلت باید بعد از زمان شروع باشد.");
            return;
        }

        const startISO = localDateTimeToISOString(start);
        const endISO = localDateTimeToISOString(end);

        if (!startISO || !endISO) {
            setError("تبدیل بازه زمانی با خطا مواجه شد.");
            return;
        }

        onSubmit(startISO, endISO);
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                    style={{
                        background: "rgba(15,23,42,.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="w-full max-w-md overflow-hidden rounded-[2rem] border"
                        style={{
                            background: bg,
                            borderColor: border,
                        }}
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "rgba(99,102,241,.12)"
                                            : "rgba(99,102,241,.08)",
                                    }}
                                >
                                    <Calendar size={15} className="text-indigo-500" />
                                </div>

                                <div>
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: text }}
                                    >
                                        تعیین بازه زمانی
                                    </h3>

                                    <p
                                        className="mt-0.5 text-[11px]"
                                        style={{ color: muted }}
                                    >
                                        زمان شروع و مهلت انجام وظیفه
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-xl"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,.05)"
                                        : "rgba(15,23,42,.05)",
                                    color: muted,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 px-8 pb-8"
                        >
                            <div>
                                <label
                                    className="mb-1.5 block text-[11.5px] font-bold"
                                    style={{ color: muted }}
                                >
                                    زمان شروع *
                                </label>

                                <input
                                    type="datetime-local"
                                    value={start}
                                    onChange={(e) => setStart(e.target.value)}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    className="mb-1.5 block text-[11.5px] font-bold"
                                    style={{ color: muted }}
                                >
                                    مهلت انجام *
                                </label>

                                <input
                                    type="datetime-local"
                                    value={end}
                                    min={start || undefined}
                                    onChange={(e) => setEnd(e.target.value)}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                />
                            </div>

                            {error && (
                                <p className="text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-bold text-white"
                                style={{
                                    background:
                                        "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                }}
                            >
                                <Check size={16} />
                                ثبت بازه زمانی
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}