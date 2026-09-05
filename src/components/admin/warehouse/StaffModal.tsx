"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, UserPlus, X } from "lucide-react";
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                                    <UserPlus size={15} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        افزودن کارمند انبار
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        از بین کارمندان شرکت انتخاب کنید
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

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-6">
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
                                <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading || fetching}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : "افزودن به انبار"}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}