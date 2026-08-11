"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Loader, FileUp, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";

type Direction = "next" | "prev";

interface TaskActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { note: string; files: File[] }) => Promise<void>;
    title: string;
    description: string;
    direction: Direction;
    loading?: boolean;
}

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
            onClose();
        } catch (err) {
            setError("خطا در ثبت تغییرات تسک");
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
                style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(3px)",
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, y: 18 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, y: 18 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full max-w-[430px] rounded-3xl overflow-hidden border"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div
                        className="px-5 py-4 border-b flex items-center justify-between"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{
                                    background:
                                        direction === "next"
                                            ? isDark
                                                ? "rgba(99,102,241,0.12)"
                                                : "rgba(99,102,241,0.08)"
                                            : isDark
                                                ? "rgba(236,72,153,0.12)"
                                                : "rgba(236,72,153,0.08)",
                                }}
                            >
                                <MessageSquare
                                    size={15}
                                    className={
                                        direction === "next" ? "text-indigo-500" : "text-pink-500"
                                    }
                                />
                            </div>

                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                            }}
                            type="button"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                یادداشت
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                placeholder="مثلاً: طراحی انجام شد و فایل‌ها آپلود شدند..."
                                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-violet-500 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FileUp size={14} />
                                فایل‌ها
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    const selected = Array.from(e.target.files || []);
                                    setFiles(selected);
                                }}
                                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:rounded-xl file:border-0 file:px-4 file:py-2 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                            />
                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {files.map((file, index) => (
                                        <span
                                            key={`${file.name}-${index}`}
                                            className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                                        >
                                            {file.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.04)",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}
                            >
                                انصراف
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                style={{
                                    background:
                                        direction === "next"
                                            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                            : "linear-gradient(135deg, #ec4899, #db2777)",
                                    boxShadow:
                                        direction === "next"
                                            ? "0 4px 14px rgba(99,102,241,0.3)"
                                            : "0 4px 14px rgba(236,72,153,0.3)",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-3.5 h-3.5 animate-spin" />
                                        در حال ثبت...
                                    </>
                                ) : (
                                    <>
                                        <Check size={13} />
                                        ثبت تغییر
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
