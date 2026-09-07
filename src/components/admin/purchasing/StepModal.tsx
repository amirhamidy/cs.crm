"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, ListOrdered, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiPurchasingEmployee, ApiPurchasingStep } from "@/types/purchasing";
import { FloatingInput, FloatingTextarea } from "./FormControls";

interface StepModalProps {
    isOpen: boolean;
    onClose: () => void;
    step?: ApiPurchasingStep | null;
    employees: ApiPurchasingEmployee[];
    onSaved: (step: ApiPurchasingStep) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "title", "order", "employees", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function StepModal({ isOpen, onClose, step, employees, onSaved }: StepModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [order, setOrder] = useState("1");
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEdit = Boolean(step);

    useEffect(() => {
        if (!isOpen) return;
        setTitle(step?.title ?? "");
        setDescription(step?.description ?? "");
        setOrder(String(step?.order ?? 1));
        setSelectedEmployees(step?.employees ?? []);
        setError("");
    }, [isOpen, step]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    function toggleEmployee(id: number) {
        setSelectedEmployees((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !order) {
            setError("عنوان و ترتیب مرحله الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        const payload = {
            title: title.trim(),
            description: description.trim(),
            order: Number(order),
            employees: selectedEmployees,
        };

        try {
            if (isEdit && step) {
                const { data } = await axiosInstance.patch<ApiPurchasingStep>(
                    `/purchasing/api/v1/steps/${step.id}/patch/`,
                    payload
                );
                onSaved(data);
            } else {
                const { data } = await axiosInstance.post<ApiPurchasingStep>(
                    "/purchasing/api/v1/steps/create/",
                    payload
                );
                onSaved(data);
            }
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت مرحله"));
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                                    <ListOrdered size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {isEdit ? "ویرایش مرحله" : "مرحله جدید"}
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        مراحل فرآیند خرید
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

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5">
                            <FloatingInput
                                label="عنوان مرحله"
                                id="step_title"
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            />
                            <FloatingInput
                                label="ترتیب"
                                id="step_order"
                                type="number"
                                value={order}
                                onChange={(e) => {
                                    setOrder(e.target.value);
                                    setError("");
                                }}
                                dir="ltr"
                            />
                            <FloatingTextarea
                                label="توضیحات"
                                id="step_description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                dir="rtl"
                            />

                            <div className="flex flex-col gap-2">
                                <span className="text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                    کارمندان مسئول این مرحله
                                </span>
                                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-2xl border border-gray-200 p-2 dark:border-white/[0.08]">
                                    {employees.length === 0 ? (
                                        <p className="py-2 text-center text-[11px] text-gray-400">
                                            کارمندی ثبت نشده است
                                        </p>
                                    ) : (
                                        employees.map((emp) => (
                                            <label
                                                key={emp.id}
                                                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.includes(emp.id)}
                                                    onChange={() => toggleEmployee(emp.id)}
                                                    className="h-3.5 w-3.5 accent-indigo-600"
                                                />
                                                {emp.employee_name}
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            {error && (
                                <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full bg-indigo-600 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : isEdit ? (
                                    "ذخیره تغییرات"
                                ) : (
                                    "ثبت مرحله"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}