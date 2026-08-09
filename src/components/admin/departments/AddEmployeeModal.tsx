"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, CheckCircle2, Search, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import type { Department, Employee } from "./types";

interface Props {
    open: boolean;
    department: Department | null;
    employees: Employee[];
    loading?: boolean;
    error?: string | null;
    onClose: () => void;
    onSubmit: (employeeId: string) => Promise<void>;
}

export default function AddEmployeeModal({
    open,
    department,
    employees,
    loading = false,
    error = null,
    onClose,
    onSubmit,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [selectedId, setSelectedId] = useState<string>("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) {
            setSelectedId("");
            setSearch("");
            setSuccess(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, submitting]);

    const handleSubmit = async () => {
        if (!selectedId || submitting) return;

        setSubmitting(true);
        try {
            await onSubmit(selectedId);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1400);
        } finally {
            setSubmitting(false);
        }
    };

    const assignedIds = new Set(department?.employees.map((e) => String(e.id)) ?? []);

    const filteredEmployees = (employees ?? []).filter((emp) => {
        if (assignedIds.has(String(emp.id))) return false;
        const q = search.toLowerCase();
        return emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q);
    });

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(2px)",
                    }}
                    onClick={() => !submitting && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.93, y: 16 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.93, y: 16 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[400px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border"
                        style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.07)"
                                : "rgba(0,0,0,0.06)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                        }}
                        dir="rtl"
                    >
                        <div
                            className="px-5 py-4 border-b flex items-center justify-between"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                    <User size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        افزودن عضو
                                    </h3>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        به دپارتمان {department?.name ?? ""}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                disabled={success || submitting}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.04)",
                                }}
                                type="button"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto space-y-4">
                            <div className="relative">
                                <input
                                    id="search_employee"
                                    placeholder=" "
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="peer w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-500"
                                />
                                <label
                                    htmlFor="search_employee"
                                    className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${search.trim()
                                            ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                            : "top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                        }`}
                                >
                                    جستجوی نام کارمند یا نقش...
                                </label>
                                <Search
                                    size={14}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                                    </div>
                                ) : filteredEmployees.length === 0 ? (
                                    <p className="text-center text-[12.5px] text-gray-400 dark:text-gray-500 py-6">
                                        {employees.length === 0
                                            ? "کارمندی در سیستم ثبت نشده"
                                            : "کارمندی یافت نشد"}
                                    </p>
                                ) : (
                                    filteredEmployees.map((emp) => {
                                        const isSelected = selectedId === emp.id;

                                        return (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => setSelectedId(emp.id)}
                                                className="relative w-full rounded-2xl p-3 flex items-center justify-between border transition-all duration-150 text-right"
                                                style={{
                                                    borderColor: isSelected
                                                        ? "#6366f1"
                                                        : isDark
                                                            ? "rgba(255,255,255,0.06)"
                                                            : "rgba(0,0,0,0.06)",
                                                    background: isSelected
                                                        ? isDark
                                                            ? "rgba(99,102,241,0.12)"
                                                            : "rgba(99,102,241,0.07)"
                                                        : isDark
                                                            ? "rgba(255,255,255,0.02)"
                                                            : "#fafafa",
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-extrabold flex-shrink-0"
                                                        style={{
                                                            background: isSelected
                                                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                                                : isDark
                                                                    ? "rgba(255,255,255,0.08)"
                                                                    : "rgba(0,0,0,0.08)",
                                                            color: isSelected ? "#fff" : isDark ? "#fff" : "#111827",
                                                        }}
                                                    >
                                                        {emp.name.charAt(0)}
                                                    </div>

                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight">
                                                            {emp.name}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                                            {emp.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {error && (
                                <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center">
                                    {error}
                                </p>
                            )}

                            <AnimatePresence mode="wait">
                                {success ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                    >
                                        <CheckCircle2 size={16} />
                                        عضو با موفقیت اضافه شد
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="actions"
                                        onClick={handleSubmit}
                                        disabled={!selectedId || submitting}
                                        className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                        style={{
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                        }}
                                        type="button"
                                    >
                                        {submitting && <Loader2 size={14} className="animate-spin" />}
                                        افزودن عضو
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
