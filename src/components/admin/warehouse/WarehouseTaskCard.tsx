"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { CheckCircle2, Loader2, PackageCheck, UserCog, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiWarehouseStaff, ApiWarehouseTask } from "@/types/warehouse";
import { FloatingInput, FloatingSelect } from "./FormControls";

interface WarehouseTaskCardProps {
    task: ApiWarehouseTask;
    index: number;
    staff: ApiWarehouseStaff[];
    onUpdated: (task: ApiWarehouseTask) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "received_quantity", "message", "error"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

function statusMeta(status: ApiWarehouseTask["status"]) {
    switch (status) {
        case "completed":
            return { label: "تکمیل شده", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
        case "in_progress":
            return { label: "در حال انجام", color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
        default:
            return { label: "در انتظار", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    }
}

export default function WarehouseTaskCard({ task, index, staff, onUpdated }: WarehouseTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [assignedTo, setAssignedTo] = useState(task.assigned_to ? String(task.assigned_to) : "");
    const [assigning, setAssigning] = useState(false);

    const [showReceive, setShowReceive] = useState(false);
    const [receivedQuantity, setReceivedQuantity] = useState(String(task.expected_quantity));
    const [performedById, setPerformedById] = useState(task.assigned_to ? String(task.assigned_to) : "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const meta = statusMeta(task.status);

    async function handleAssign(value: string) {
        setAssignedTo(value);
        setAssigning(true);
        try {
            const { data } = await axiosInstance.patch<ApiWarehouseTask>(
                `/warehouse/api/v1/task/${task.id}/update/`,
                { assigned_to: Number(value), status: "in_progress" }
            );
            onUpdated(data);
        } catch {
            setAssignedTo(task.assigned_to ? String(task.assigned_to) : "");
        } finally {
            setAssigning(false);
        }
    }

    async function handleReceive(e: React.FormEvent) {
        e.preventDefault();
        if (!receivedQuantity || !performedById) {
            setError("تعداد دریافتی و ثبت‌کننده الزامی است");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await axiosInstance.post("/warehouse/api/v1/process/stock/in/", {
                product_id: task.product,
                performed_by_id: Number(performedById),
                quantity: Number(receivedQuantity),
                note: `دریافت کالا برای وظیفه خرید #${task.purchase_task_id}`,
            });

            const { data } = await axiosInstance.patch<ApiWarehouseTask>(
                `/warehouse/api/v1/task/${task.id}/update/`,
                {
                    status: "completed",
                    received_quantity: Number(receivedQuantity),
                    assigned_to: Number(performedById),
                }
            );

            onUpdated(data);
            setShowReceive(false);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت دریافت کالا"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex flex-col gap-3 rounded-3xl p-4"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                }}
            >
                <div className="flex items-center justify-between">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                        style={{ background: meta.bg, color: meta.color }}
                    >
                        {meta.label}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                        فرآیند خرید #{task.purchase_task_id}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                        <PackageCheck size={18} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {task.product_name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            تعداد مورد انتظار: {task.expected_quantity}
                            {task.received_quantity !== null ? ` · دریافت شده: ${task.received_quantity}` : ""}
                        </p>
                    </div>
                </div>

                {task.status !== "completed" && (
                    <div className="flex flex-col gap-2.5">
                        <FloatingSelect
                            label="انبار‌دار مسئول"
                            id={`task_assign_${task.id}`}
                            value={assignedTo}
                            onChange={(e) => handleAssign(e.target.value)}
                            disabled={assigning}
                            dir="rtl"
                        >
                            <option value="" disabled>
                                انتخاب کنید
                            </option>
                            {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.full_name}
                                </option>
                            ))}
                        </FloatingSelect>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                setPerformedById(assignedTo);
                                setShowReceive(true);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-emerald-500"
                        >
                            <CheckCircle2 size={14} />
                            دریافت کالا و اتمام وظیفه
                        </motion.button>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {showReceive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !submitting && setShowReceive(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                            dir="rtl"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                                        <UserCog size={15} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        دریافت کالا در انبار
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowReceive(false)}
                                    disabled={submitting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <form onSubmit={handleReceive} className="flex flex-col gap-5">
                                <FloatingSelect
                                    label="ثبت‌کننده"
                                    id="receive_performed_by"
                                    value={performedById}
                                    onChange={(e) => {
                                        setPerformedById(e.target.value);
                                        setError("");
                                    }}
                                    dir="rtl"
                                >
                                    <option value="" disabled>
                                        انتخاب کنید
                                    </option>
                                    {staff.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name}
                                        </option>
                                    ))}
                                </FloatingSelect>

                                <FloatingInput
                                    label="تعداد دریافتی"
                                    id="receive_quantity"
                                    type="number"
                                    value={receivedQuantity}
                                    onChange={(e) => {
                                        setReceivedQuantity(e.target.value);
                                        setError("");
                                    }}
                                    dir="ltr"
                                />

                                {error && (
                                    <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                        {error}
                                    </p>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={submitting}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-center rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : "ثبت دریافت و اتمام"}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}