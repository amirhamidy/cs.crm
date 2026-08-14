"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Loader, FileUp, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";

export type ActionDirection = "next" | "prev" | "sold" | "unsold" | "cancel" | "uncancel" | "uncomplete";

interface TaskActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { note: string; files: File[] }) => Promise<void>;
    title: string;
    description: string;
    direction: ActionDirection;
    submitting?: boolean;
}

const directionStyle: Record<
    ActionDirection,
    { gradient: string; shadow: string; iconColor: string; iconBg: string }
> = {
    next: {
        gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        shadow: "0 4px 14px rgba(99,102,241,0.3)",
        iconColor: "text-indigo-500",
        iconBg: "rgba(99,102,241,0.10)",
    },
    prev: {
        gradient: "linear-gradient(135deg, #ec4899, #db2777)",
        shadow: "0 4px 14px rgba(236,72,153,0.3)",
        iconColor: "text-pink-500",
        iconBg: "rgba(236,72,153,0.10)",
    },
    sold: {
        gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
        shadow: "0 4px 14px rgba(245,158,11,0.3)",
        iconColor: "text-amber-500",
        iconBg: "rgba(245,158,11,0.10)",
    },
    unsold: {
        gradient: "linear-gradient(135deg, #64748b, #475569)",
        shadow: "0 4px 14px rgba(100,116,139,0.3)",
        iconColor: "text-slate-500",
        iconBg: "rgba(100,116,139,0.10)",
    },
    cancel: {
        gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
        shadow: "0 4px 14px rgba(239,68,68,0.3)",
        iconColor: "text-red-500",
        iconBg: "rgba(239,68,68,0.10)",
    },
    uncancel: {
        gradient: "linear-gradient(135deg, #f87171, #ef4444)",
        shadow: "0 4px 14px rgba(248,113,113,0.3)",
        iconColor: "text-red-400",
        iconBg: "rgba(248,113,113,0.10)",
    },
    uncomplete: {
        gradient: "linear-gradient(135deg, #34d399, #10b981)",
        shadow: "0 4px 14px rgba(52,211,153,0.3)",
        iconColor: "text-emerald-400",
        iconBg: "rgba(52,211,153,0.10)",
    },
};

const SIMPLE_DIRECTIONS: ActionDirection[] = ["sold", "unsold", "cancel", "uncancel", "uncomplete"];

export default function TaskActionModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    direction,
}: TaskActionModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [note, setNote] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const style = directionStyle[direction];
    const isSimple = SIMPLE_DIRECTIONS.includes(direction);

    useEffect(() => {
        if (isOpen) {
            setNote("");
            setFiles([]);
            setError("");
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await onSubmit({ note, files });
        } catch {
            setError("خطا در ثبت تغییرات");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, y: 18 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, y: 18 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full max-w-[430px] overflow-hidden rounded-3xl border"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div
                        className="flex items-center justify-between border-b px-5 py-4"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: style.iconBg }}
                            >
                                <MessageSquare size={15} className={style.iconColor} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                    {description}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 p-5">
                        {isSimple ? (
                            <p
                                className="rounded-2xl px-4 py-3 text-center text-[13px] font-semibold"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}
                            >
                                {description}
                            </p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                        یادداشت
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={4}
                                        placeholder="یادداشت اختیاری..."
                                        className="w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-violet-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                        <FileUp size={14} />
                                        فایل‌ها
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                        className="w-full text-sm text-gray-500 dark:text-gray-400 file:ml-3 file:rounded-xl file:border-0 file:px-4 file:py-2 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                                    />
                                    {files.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {files.map((file, i) => (
                                                <span
                                                    key={`${file.name}-${i}`}
                                                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 dark:bg-white/5 dark:text-gray-300"
                                                >
                                                    {file.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="text-center text-[11.5px] font-semibold text-red-500 dark:text-red-400">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 rounded-xl py-2.5 text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                style={{ background: style.gradient, boxShadow: style.shadow }}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="h-3.5 w-3.5 animate-spin" />
                                        در حال ثبت...
                                    </>
                                ) : (
                                    <>
                                        <Check size={13} />
                                        تایید
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
