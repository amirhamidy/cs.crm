"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader, Send, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import type { EmployeeListItem, InternalTask } from "./types";
import { createInternalTask } from "./Api";

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: EmployeeListItem[];
    onCreated: (task: InternalTask) => void;
}

export default function CreateTicketModal({
    isOpen,
    onClose,
    employees,
    onCreated,
}: CreateTicketModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selected, setSelected] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setDescription("");
            setSelected([]);
            setError("");
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    function toggleEmployee(id: number) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || selected.length === 0) {
            setError("عنوان و حداقل یک کارمند را انتخاب کن");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const { data } = await createInternalTask({
                title: title.trim(),
                description: description.trim(),
                assigned_to: selected,
            });
            onCreated(data);
        } catch {
            setError("خطا در ایجاد تیکت");
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
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.06)",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: "rgba(99,102,241,0.10)" }}
                            >
                                <Send size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    ایجاد تیکت جدید
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                    تیکت را برای همکار خود ارسال کن
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.04)",
                            }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="max-h-[70vh] space-y-4 overflow-y-auto p-5"
                    >
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                عنوان
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="عنوان تیکت را بنویس..."
                                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-violet-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                توضیحات
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="توضیحات تیکت را بنویس..."
                                className="w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-violet-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                ارسال به همکار
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {employees.map((item) => {
                                    const isActive = selected.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleEmployee(item.id)}
                                            className="flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1 text-[11px] font-bold transition-colors"
                                            style={{
                                                background: isActive
                                                    ? "rgba(99,102,241,0.14)"
                                                    : isDark
                                                        ? "rgba(255,255,255,0.04)"
                                                        : "rgba(0,0,0,0.03)",
                                                border: isActive
                                                    ? "1px solid rgba(99,102,241,0.4)"
                                                    : isDark
                                                        ? "1px solid rgba(255,255,255,0.06)"
                                                        : "1px solid rgba(0,0,0,0.06)",
                                                color: isActive
                                                    ? "#6366f1"
                                                    : isDark
                                                        ? "#94a3b8"
                                                        : "#64748b",
                                            }}
                                        >
                                            <span
                                                className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                }}
                                            >
                                                <UserRound size={11} />
                                            </span>
                                            {item.full_name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

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
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="h-3.5 w-3.5 animate-spin" />
                                        در حال ارسال...
                                    </>
                                ) : (
                                    <>
                                        <Check size={13} />
                                        ارسال تیکت
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