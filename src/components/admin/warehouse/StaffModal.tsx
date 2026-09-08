"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, UserPlus, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiEmployee } from "@/types/users";
import type { ApiWarehouseStaff } from "@/types/warehouse";
import { FloatingSelect } from "./FormControls";

interface StaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingStaff: ApiWarehouseStaff[];
    onCreated: (staff: ApiWarehouseStaff) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "employee", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

function extractEmployeeList(data: unknown): ApiEmployee[] {
    if (Array.isArray(data)) return data as ApiEmployee[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as ApiEmployee[];
        if (Array.isArray(record.data)) return record.data as ApiEmployee[];
        if (Array.isArray(record.employees)) return record.employees as ApiEmployee[];
    }
    return [];
}

export default function StaffModal({ isOpen, onClose, existingStaff, onCreated }: StaffModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [employeeId, setEmployeeId] = useState("");
    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setError("");
        setEmployeeId("");
        setFetching(true);

        axiosInstance
            .get("/accounts/api/v1/employee/list/")
            .then(({ data }) => setEmployees(extractEmployeeList(data)))
            .catch(() => setEmployees([]))
            .finally(() => setFetching(false));
    }, [isOpen]);

    const usedEmployeeIds = new Set(existingStaff.map((s) => s.employee));
    const availableEmployees = employees.filter((e) => !usedEmployeeIds.has(e.id));

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!employeeId) {
            setError("انتخاب کارمند الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } = await axiosInstance.post<ApiWarehouseStaff>(
                "/warehouse/api/v1/staff/create/",
                { employee: Number(employeeId), is_active: true }
            );
            onCreated(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در افزودن کارمند انبار"));
        } finally {
            setLoading(false);
        }
    }

    const cardBg = isDark ? "#0f172a" : "#ffffff";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";
    const mutedText = isDark ? "#94a3b8" : "#64748b";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(15,23,42,0.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] p-0"
                        style={{
                            background: cardBg,
                            border: `1px solid ${borderColor}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                                    }}
                                >
                                    <UserPlus size={15} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: textColor }}
                                    >
                                        افزودن کارمند انبار
                                    </h3>
                                    <p className="mt-0.5 text-[12px]" style={{ color: mutedText }}>
                                        از بین کارمندان شرکت انتخاب کنید
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                    color: mutedText,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5 px-8 pb-8">
                            <FloatingSelect
                                label="کارمند"
                                id="staff_employee"
                                value={employeeId}
                                onChange={(e) => {
                                    setEmployeeId(e.target.value);
                                    setError("");
                                }}
                                disabled={fetching}
                                dir="rtl"
                            >
                                <option value="" disabled>
                                    {fetching ? "در حال دریافت..." : "انتخاب کنید"}
                                </option>
                                {availableEmployees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name}
                                    </option>
                                ))}
                            </FloatingSelect>

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading || fetching}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                style={{
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                }}
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    "افزودن به انبار"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}