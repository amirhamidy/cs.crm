"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, CheckCircle2, Search, Loader2 } from "lucide-react";
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
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

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

    const assignedIds = new Set(department?.employees.map((e) => e.id) ?? []);

    const safeEmployees = employees ?? [];

    const filteredEmployees = safeEmployees.filter((emp) => {
        if (assignedIds.has(emp.id)) return false;
        const q = search.toLowerCase();
        return (
            emp.name.toLowerCase().includes(q) ||
            emp.role.toLowerCase().includes(q)
        );
    });

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 16 }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl bg-white dark:bg-[#0f0f13] border border-gray-200 dark:border-white/10"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        افزودن عضو
                                    </h2>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        {department?.name ?? ""}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={success || submitting}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                                    />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="جستجوی نام یا سمت..."
                                        className="w-full rounded-xl pr-9 pl-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all duration-200"
                                    />
                                </div>

                                {/* Employee list */}
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 size={20} className="animate-spin text-gray-400" />
                                        </div>
                                    ) : filteredEmployees.length === 0 ? (
                                        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
                                            {employees.length === 0
                                                ? "کارمندی در سیستم ثبت نشده"
                                                : "کارمندی یافت نشد"}
                                        </p>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <button
                                                key={emp.id}
                                                onClick={() => setSelectedId(emp.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 text-right active:scale-95 ${selectedId === emp.id
                                                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                                    : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedId === emp.id
                                                        ? "bg-blue-500/10"
                                                        : "bg-gray-100 dark:bg-white/5"
                                                        }`}
                                                >
                                                    <User
                                                        size={16}
                                                        className={
                                                            selectedId === emp.id
                                                                ? "text-blue-500"
                                                                : "text-gray-400 dark:text-gray-500"
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {emp.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {emp.role}
                                                    </p>
                                                </div>
                                                {selectedId === emp.id && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>

                                {error && (
                                    <p className="text-xs text-red-500 dark:text-red-400 text-center">
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
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
                                        <motion.div
                                            key="actions"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!selectedId || submitting}
                                                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                            >
                                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                                افزودن عضو
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
