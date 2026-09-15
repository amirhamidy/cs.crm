"use client";
import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader, UserPlus, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface Employee {
    id: number;
    full_name: string;
    username: string;
}

interface AddWarehouseStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddWarehouseStaffModal({
    isOpen,
    onClose,
    onSuccess,
}: AddWarehouseStaffModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    const fetchEmployees = async () => {
        try {
            const { data } = await axiosInstance.get("/accounts/api/v1/employee/list/");
            setEmployees(Array.isArray(data) ? data : []);
        } catch {
            setEmployees([]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) {
            setError("لطفاً یک کارمند انتخاب کنید");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/warehouse/api/v1/staff/create/", {
                employee: selectedEmployee,
                is_active: true,
            });
            onSuccess();
            handleClose();
        } catch {
            setError("خطا در ثبت انباردار");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setSelectedEmployee(null);
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
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
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div className="flex items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <UserPlus size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    افزودن انباردار
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    انتخاب کارمند برای انبار
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-8 pb-8">
                        <div>
                            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                انتخاب کارمند
                            </label>
                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                                {employees.map((emp) => (
                                    <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => setSelectedEmployee(emp.id)}
                                        className="w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-[12px] transition-all"
                                        style={{
                                            borderColor:
                                                selectedEmployee === emp.id
                                                    ? "#6366f1"
                                                    : isDark
                                                        ? "rgba(255,255,255,0.08)"
                                                        : "rgba(15,23,42,0.08)",
                                            background:
                                                selectedEmployee === emp.id
                                                    ? isDark
                                                        ? "rgba(99,102,241,0.1)"
                                                        : "rgba(99,102,241,0.05)"
                                                    : "transparent",
                                            color:
                                                selectedEmployee === emp.id
                                                    ? isDark
                                                        ? "#a5b4fc"
                                                        : "#6366f1"
                                                    : isDark
                                                        ? "#94a3b8"
                                                        : "#475569",
                                        }}
                                    >
                                        <span className="font-bold">{emp.full_name}</span>
                                        <span className="text-[10px]">@{emp.username}</span>
                                    </button>
                                ))}
                            </div>
                            {error && <p className="mt-2 text-[11px] font-semibold text-red-500">{error}</p>}
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading || !selectedEmployee}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <Check size={14} />
                                    ثبت انباردار
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}