"use client";
import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckSquare, Loader, Square, UserPlus, Warehouse as WarehouseIcon, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { WAREHOUSE_ENDPOINTS, fetchAll } from "@/lib/warehouseApi";

interface Employee {
    id: number;
    full_name: string;
    username: string;
}

interface Warehouse {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
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
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [selectedWarehouses, setSelectedWarehouses] = useState<number[]>([]);

    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setFetching(true);
        try {
            const [employeeList, warehouseList] = await Promise.all([
                fetchAll<Employee>("/accounts/api/v1/employee/list/"),
                fetchAll<Warehouse>(WAREHOUSE_ENDPOINTS.warehouses),
            ]);

            setEmployees(employeeList);
            setWarehouses(warehouseList);
        } catch {
            setEmployees([]);
            setWarehouses([]);
        } finally {
            setFetching(false);
        }
    };

    const toggleWarehouse = (id: number) => {
        setSelectedWarehouses((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) {
            setError("لطفاً یک کارمند انتخاب کنید");
            return;
        }
        if (selectedWarehouses.length === 0) {
            setError("لطفاً حداقل یک انبار انتخاب کنید");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/warehouse/api/v1/staff/create/", {
                employee: selectedEmployee,
                warehouses: selectedWarehouses,
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
        setSelectedWarehouses([]);
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
                    className="w-full max-w-md overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl dark:border-white/[0.06] dark:bg-[#0f172a]"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 pb-5 pt-7">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <UserPlus size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    افزودن انباردار
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    انتخاب کارمند و تخصیص انبارها
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
                        {fetching ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Loader size={22} className="animate-spin mb-2 text-blue-500" />
                                <span className="text-[12px]">در حال دریافت اطلاعات...</span>
                            </div>
                        ) : (
                            <>
                                {/* بخش ۱: انتخاب کارمند (تک‌انتخابی) */}
                                <div>
                                    <label className="mb-2 block text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                        انتخاب کارمند <span className="text-red-500">*</span>
                                    </label>
                                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
                                        {employees.length === 0 ? (
                                            <p className="text-[11px] text-gray-400 py-2">کارمندی یافت نشد</p>
                                        ) : (
                                            employees.map((emp) => {
                                                const isSelected = selectedEmployee === emp.id;
                                                return (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={() => setSelectedEmployee(emp.id)}
                                                        className="w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[12px] transition-all"
                                                        style={{
                                                            borderColor: isSelected
                                                                ? "#6366f1"
                                                                : isDark
                                                                    ? "rgba(255,255,255,0.08)"
                                                                    : "rgba(15,23,42,0.08)",
                                                            background: isSelected
                                                                ? isDark
                                                                    ? "rgba(99,102,241,0.12)"
                                                                    : "rgba(99,102,241,0.06)"
                                                                : "transparent",
                                                            color: isSelected
                                                                ? isDark
                                                                    ? "#a5b4fc"
                                                                    : "#6366f1"
                                                                : isDark
                                                                    ? "#94a3b8"
                                                                    : "#475569",
                                                        }}
                                                    >
                                                        <span className="font-semibold">{emp.full_name}</span>
                                                        <span className="text-[10px] opacity-70">@{emp.username}</span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* بخش ۲: انتخاب انبارها (چندانتخابی) */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                            انتخاب انبارها (یک یا چند مورد) <span className="text-red-500">*</span>
                                        </label>
                                        {selectedWarehouses.length > 0 && (
                                            <span className="text-[10.5px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                {selectedWarehouses.length} انبار انتخاب شده
                                            </span>
                                        )}
                                    </div>

                                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
                                        {warehouses.length === 0 ? (
                                            <p className="text-[11px] text-gray-400 py-2">انباری یافت نشد</p>
                                        ) : (
                                            warehouses.map((wh) => {
                                                const isSelected = selectedWarehouses.includes(wh.id);
                                                return (
                                                    <button
                                                        key={wh.id}
                                                        type="button"
                                                        onClick={() => toggleWarehouse(wh.id)}
                                                        className="w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[12px] transition-all"
                                                        style={{
                                                            borderColor: isSelected
                                                                ? "#3b82f6"
                                                                : isDark
                                                                    ? "rgba(255,255,255,0.08)"
                                                                    : "rgba(15,23,42,0.08)",
                                                            background: isSelected
                                                                ? isDark
                                                                    ? "rgba(59,130,246,0.12)"
                                                                    : "rgba(59,130,246,0.06)"
                                                                : "transparent",
                                                            color: isSelected
                                                                ? isDark
                                                                    ? "#93c5fd"
                                                                    : "#2563eb"
                                                                : isDark
                                                                    ? "#94a3b8"
                                                                    : "#475569",
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isSelected ? (
                                                                <CheckSquare size={16} className="text-blue-500 shrink-0" />
                                                            ) : (
                                                                <Square size={16} className="text-gray-400 shrink-0" />
                                                            )}
                                                            <span className="font-semibold">{wh.name}</span>
                                                        </div>
                                                        <span className="text-[10.5px] opacity-70">کد: {wh.code}</span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {error && <p className="text-[11.5px] font-semibold text-red-500">{error}</p>}

                        <motion.button
                            type="submit"
                            disabled={loading || fetching || !selectedEmployee || selectedWarehouses.length === 0}
                            whileTap={{ scale: 0.98 }}
                            className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-[13px] font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Check size={15} />
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
