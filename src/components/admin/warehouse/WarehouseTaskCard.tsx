"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    CheckCircle2,
    Loader2,
    PackageCheck,
    UserCog,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type {
    ApiWarehouseStaff,
    ApiWarehouseTask,
} from "@/types/warehouse";
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
    const keys = [
        "detail",
        "received_quantity",
        "assigned_to",
        "note",
        "file",
        "message",
        "error",
    ];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
        if (val && typeof val === "object") {
            const nested = val as Record<string, unknown>;
            for (const nestedValue of Object.values(nested)) {
                if (typeof nestedValue === "string") return nestedValue;
                if (Array.isArray(nestedValue) && typeof nestedValue[0] === "string") {
                    return nestedValue[0];
                }
            }
        }
    }
    return fallback;
}

function statusMeta(status: ApiWarehouseTask["status"]) {
    switch (status) {
        case "completed":
            return {
                label: "تکمیل شده",
                color: "#10b981",
                bg: "rgba(16,185,129,0.1)",
            };
        case "in_progress":
            return {
                label: "در حال انجام",
                color: "#6366f1",
                bg: "rgba(99,102,241,0.1)",
            };
        default:
            return {
                label: "در انتظار",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.1)",
            };
    }
}

export default function WarehouseTaskCard({
    task,
    index,
    staff,
    onUpdated,
}: WarehouseTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [assignedTo, setAssignedTo] = useState(
        task.assigned_to ? String(task.assigned_to) : ""
    );
    const [showReceive, setShowReceive] = useState(false);
    const [receivedQuantity, setReceivedQuantity] = useState(
        task.received_quantity !== null && task.received_quantity !== undefined
            ? String(task.received_quantity)
            : String(task.expected_quantity)
    );
    const [performedById, setPerformedById] = useState(
        task.assigned_to ? String(task.assigned_to) : ""
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const meta = statusMeta(task.status);

    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";
    const mutedText = isDark ? "#94a3b8" : "#64748b";

    function handleAssignChange(value: string) {
        setAssignedTo(value);
        setPerformedById(value);
        setError("");
    }

    function openReceiveModal() {
        if (!assignedTo) {
            setError("ابتدا انباردار مسئول را انتخاب کنید");
            return;
        }
        setPerformedById(assignedTo);
        setReceivedQuantity(
            task.received_quantity !== null && task.received_quantity !== undefined
                ? String(task.received_quantity)
                : String(task.expected_quantity)
        );
        setError("");
        setShowReceive(true);
    }

    async function handleReceive(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const quantity = Number(receivedQuantity);
        const performedBy = Number(performedById);

        if (!performedById) {
            setError("انباردار ثبت‌کننده دریافت الزامی است");
            return;
        }
        if (!receivedQuantity) {
            setError("تعداد دریافتی الزامی است");
            return;
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            setError("تعداد دریافتی باید بیشتر از صفر باشد");
            return;
        }
        if (!Number.isFinite(performedBy) || performedBy <= 0) {
            setError("انباردار انتخاب‌شده نامعتبر است");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("assigned_to", String(performedBy));
            formData.append("received_quantity", String(quantity));
            formData.append(
                "note",
                `دریافت کالا برای وظیفه خرید #${task.purchase_task_id}`
            );

            const { data } = await axiosInstance.post<ApiWarehouseTask>(
                `/warehouse/api/v1/task/${task.id}/complete/`,
                formData
            );

            onUpdated(data);
            setShowReceive(false);
            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت دریافت کالا و تکمیل وظیفه"));
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
                className="relative flex flex-col gap-3 rounded-3xl p-4 transition-all hover:border-indigo-200/50"
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                }}
            >
                {/* Animated border - ایندیگو/بنفش */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <linearGradient
                            id={`task-border-${task.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="23"
                        ry="23"
                        fill="none"
                        stroke="url(#task-border-${task.id})"
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileHover={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex items-center justify-between">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-extrabold"
                        style={{
                            background: meta.bg,
                            color: meta.color,
                        }}
                    >
                        {meta.label}
                    </span>
                    <span className="text-[12px] font-semibold" style={{ color: mutedText }}>
                        فرآیند خرید #{task.purchase_task_id}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <PackageCheck size={18} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h3
                            className="truncate text-[13px] font-extrabold"
                            style={{ color: textColor }}
                        >
                            {task.product_name}
                        </h3>
                        <p className="mt-0.5 text-[12px] font-medium" style={{ color: mutedText }}>
                            تعداد مورد انتظار: {task.expected_quantity}
                            {task.received_quantity !== null && task.received_quantity !== undefined
                                ? ` · دریافت شده: ${task.received_quantity}`
                                : ""}
                        </p>
                    </div>
                </div>

                {task.status !== "completed" && (
                    <div className="flex flex-col gap-2.5">
                        <FloatingSelect
                            label="انباردار مسئول"
                            id={`task_assign_${task.id}`}
                            value={assignedTo}
                            onChange={(e) => handleAssignChange(e.target.value)}
                            disabled={submitting}
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
                            onClick={openReceiveModal}
                            disabled={submitting}
                            className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            دریافت کالا و اتمام وظیفه
                        </motion.button>

                        {error && !showReceive && (
                            <p className="text-center text-[12px] font-semibold text-red-500">
                                {error}
                            </p>
                        )}
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
                        style={{
                            background: "rgba(15,23,42,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm overflow-hidden rounded-[2rem] p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                            }}
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between px-0 pb-6 pt-0">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                                        style={{
                                            background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                                        }}
                                    >
                                        <UserCog size={15} className="text-emerald-500" />
                                    </div>
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: textColor }}
                                    >
                                        دریافت کالا در انبار
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowReceive(false)}
                                    disabled={submitting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                        color: mutedText,
                                    }}
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div
                                className="mb-5 rounded-2xl p-3"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                                }}
                            >
                                <div className="text-[12px] font-semibold" style={{ color: mutedText }}>
                                    کالا
                                </div>
                                <div
                                    className="mt-1 truncate text-[12.5px] font-extrabold"
                                    style={{ color: textColor }}
                                >
                                    {task.product_name}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[12px]">
                                    <span style={{ color: mutedText }}>تعداد مورد انتظار</span>
                                    <span className="font-bold" style={{ color: textColor }}>
                                        {task.expected_quantity}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleReceive} className="flex flex-col gap-4">
                                <FloatingSelect
                                    label="ثبت‌کننده"
                                    id={`receive_performed_by_${task.id}`}
                                    value={performedById}
                                    onChange={(e) => {
                                        setPerformedById(e.target.value);
                                        setError("");
                                    }}
                                    disabled={submitting}
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
                                    id={`receive_quantity_${task.id}`}
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={receivedQuantity}
                                    onChange={(e) => {
                                        setReceivedQuantity(e.target.value);
                                        setError("");
                                    }}
                                    disabled={submitting}
                                    dir="ltr"
                                />

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="-mt-1 text-center text-[12px] font-semibold text-red-500"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={submitting}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-[13px] font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            در حال ثبت...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={17} />
                                            ثبت دریافت و اتمام
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}