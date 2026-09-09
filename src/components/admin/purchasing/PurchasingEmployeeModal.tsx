"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Loader2,
    UserPlus,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingEmployee } from "@/types/purchasing";
import { FloatingSelect, OPTION_CLASS } from "./FormControls";

interface Employee {
    id: number;
    full_name?: string;
    username?: string;
}

interface Props {
    open: boolean;
    existingEmployees: ApiPurchasingEmployee[];
    onClose: () => void;
    onSaved: () => void;
}

export default function PurchasingEmployeeModal({
    open,
    existingEmployees,
    onClose,
    onSaved,
}: Props) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeId, setEmployeeId] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setEmployeeId("");
        setError("");
        setFetching(true);

        axiosInstance
            .get("/accounts/api/v1/employee/list/")
            .then((res) => {
                const data = Array.isArray(res.data)
                    ? res.data
                    : res.data?.results ?? [];

                const existing = new Set(
                    existingEmployees.map(
                        (item) => item.employee
                    )
                );

                setEmployees(
                    data.filter(
                        (item: Employee) =>
                            !existing.has(item.id)
                    )
                );
            })
            .catch(() => {
                setError(
                    "دریافت لیست کارکنان انجام نشد."
                );
            })
            .finally(() => setFetching(false));
    }, [open, existingEmployees]);

    const submit = async () => {
        if (!employeeId) {
            setError("یک کارمند انتخاب کنید.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await axiosInstance.post(
                "/purchasing/api/v1/employees/create/",
                {
                    employee: Number(employeeId),
                    is_active: true,
                }
            );

            onSaved();
            onClose();
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "افزودن کارمند انجام نشد."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B18]/55 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        className="w-full max-w-[420px] rounded-[2rem] border border-[#DCEAFB] bg-white p-5 shadow-2xl dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]"
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB]/15 to-[#06B6D4]/15 text-[#2563EB] dark:text-[#38BDF8]">
                                    <UserPlus size={16} />
                                </div>

                                <div>
                                    <h3 className="text-[13px] font-extrabold text-[#0F2647] dark:text-white">
                                        افزودن کارمند
                                    </h3>

                                    <p className="mt-0.5 text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">
                                        افزودن عضو جدید به خرید
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3F8FF] text-[#5D7595] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="mt-5">
                            <FloatingSelect
                                label="کارمند"
                                value={employeeId}
                                onChange={(e) =>
                                    setEmployeeId(
                                        e.target.value
                                    )
                                }
                                disabled={fetching}
                            >
                                <option value="" className={OPTION_CLASS}>
                                    {fetching
                                        ? "در حال دریافت..."
                                        : "انتخاب کارمند"}
                                </option>

                                {employees.map((employee) => (
                                    <option
                                        key={employee.id}
                                        value={employee.id}
                                        className={OPTION_CLASS}
                                    >
                                        {employee.full_name ||
                                            employee.username ||
                                            `کارمند ${employee.id}`}
                                    </option>
                                ))}
                            </FloatingSelect>
                        </div>

                        {error && (
                            <div className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2.5 text-[10px] font-semibold text-rose-500">
                                {error}
                            </div>
                        )}

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 rounded-2xl bg-[#F3F8FF] py-3 text-[10.5px] font-bold text-[#3D5B82] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                onClick={submit}
                                disabled={
                                    loading ||
                                    fetching ||
                                    !employeeId
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] py-3 text-[10.5px] font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Check size={13} />
                                )}
                                افزودن
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}