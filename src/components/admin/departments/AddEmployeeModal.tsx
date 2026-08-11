"use client";

import { useEffect, useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, CheckCircle2, Search, Loader } from "lucide-react";
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

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <input
                ref={ref}
                id={id}
                placeholder=" "
                className={`peer w-full rounded-4xl border border-gray-200 px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />

            <label
                htmlFor={id}
                className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#0f172a]"
            >
                {label}
            </label>
        </div>
    )
);

FloatingInput.displayName = "FloatingInput";

export default function AddEmployeeModal({
    open,
    department,
    employees,
    loading = false,
    error = null,
    onClose,
    onSubmit,
}: Props) {
    const [selectedId, setSelectedId] = useState("");
    const [search, setSearch] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const busy = loading || submitting;

    useEffect(() => {
        if (!open) {
            setSelectedId("");
            setSearch("");
            setSuccess(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, busy, success]);

    const handleClose = () => {
        if (busy || success) return;

        setSelectedId("");
        setSearch("");
        onClose();
    };

    const handleSubmit = async (event?: React.FormEvent) => {
        event?.preventDefault();

        if (!selectedId || submitting) return;

        setSubmitting(true);

        try {
            await onSubmit(selectedId);
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                setSelectedId("");
                setSearch("");
                onClose();
            }, 1400);
        } finally {
            setSubmitting(false);
        }
    };

    const assignedIds = new Set(
        department?.employees.map((employee) => String(employee.id)) ?? []
    );

    const normalizedSearch = search.trim().toLowerCase();

    const filteredEmployees = (employees ?? []).filter((employee) => {
        if (assignedIds.has(String(employee.id))) return false;

        return (
            employee.name.toLowerCase().includes(normalizedSearch) ||
            employee.role.toLowerCase().includes(normalizedSearch)
        );
    });

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(3px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(event) => event.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <User size={15} className="text-blue-600 dark:text-blue-500" />
                                </div>

                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        افزودن عضو
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        افزودن عضو به دپارتمان {department?.name ?? ""}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={busy || success}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Body */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 px-8 pb-8"
                        >
                            <div className="relative">
                                <FloatingInput
                                    label="جستجوی نام کارمند یا نقش"
                                    id="search_employee"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    disabled={loading || success}
                                    dir="rtl"
                                    className="pl-12"
                                />

                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>

                            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader
                                            size={18}
                                            className="animate-spin text-blue-600"
                                        />
                                    </div>
                                ) : filteredEmployees.length === 0 ? (
                                    <p className="py-6 text-center text-[12px] text-gray-400 dark:text-gray-500">
                                        {employees.length === 0
                                            ? "کارمندی در سیستم ثبت نشده"
                                            : "کارمندی یافت نشد"}
                                    </p>
                                ) : (
                                    filteredEmployees.map((employee) => {
                                        const employeeId = String(employee.id);
                                        const isSelected = selectedId === employeeId;

                                        return (
                                            <button
                                                key={employee.id}
                                                type="button"
                                                onClick={() => setSelectedId(employeeId)}
                                                disabled={submitting || success}
                                                className={`flex w-full items-center justify-between rounded-2xl border p-3 text-right transition-all duration-200 disabled:opacity-60 ${
                                                    isSelected
                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                                        : "border-gray-100 bg-gray-50 hover:border-blue-200 dark:border-white/[0.06] dark:bg-white/[0.025] dark:hover:border-blue-500/30"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold ${
                                                            isSelected
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-200 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300"
                                                        }`}
                                                    >
                                                        {employee.name.charAt(0)}
                                                    </div>

                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-[13px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                            {employee.name}
                                                        </p>

                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                                            {employee.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {error && (
                                <p className="text-center text-[11.5px] font-semibold text-red-500 dark:text-red-400">
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
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                    >
                                        <CheckCircle2 size={16} />
                                        عضو با موفقیت اضافه شد
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="submit"
                                        type="submit"
                                        disabled={!selectedId || submitting}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <Loader size={18} className="animate-spin" />
                                        ) : (
                                            "افزودن عضو"
                                        )}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
