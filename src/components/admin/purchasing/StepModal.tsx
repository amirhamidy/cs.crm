"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Layers3,
    Loader2,
    Users,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiPurchasingEmployee,
    ApiPurchasingStep,
} from "@/types/purchasing";
import {
    FloatingInput,
    FloatingTextarea,
} from "./FormControls";

interface Props {
    open: boolean;
    step?: ApiPurchasingStep | null;
    employees: ApiPurchasingEmployee[];
    onClose: () => void;
    onSaved: () => void;
}

export default function StepModal({
    open,
    step,
    employees,
    onClose,
    onSaved,
}: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [order, setOrder] = useState("");
    const [selected, setSelected] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const edit = !!step;

    useEffect(() => {
        if (!open) return;

        setTitle(step?.title ?? "");
        setDescription(step?.description ?? "");
        setOrder(step?.order ? String(step.order) : "");
        setSelected(step?.employees ?? []);
        setError("");
    }, [open, step]);

    const toggleEmployee = (id: number) => {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const submit = async () => {
        if (!title.trim()) {
            setError("عنوان مرحله الزامی است.");
            return;
        }

        if (!order || Number(order) < 1) {
            setError("ترتیب مرحله را وارد کنید.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = {
                title: title.trim(),
                description: description.trim(),
                order: Number(order),
                employees: selected,
            };

            if (edit) {
                await axiosInstance.patch(
                    `/purchasing/api/v1/steps/${step.id}/patch/`,
                    payload
                );
            } else {
                await axiosInstance.post(
                    "/purchasing/api/v1/steps/create/",
                    payload
                );
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "ذخیره مرحله انجام نشد."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
                    dir="rtl"
                >
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
                        transition={{ duration: 0.2 }}
                        className="max-h-[88vh] w-full max-w-[470px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#0f172a]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                    <Layers3 size={16} />
                                </div>

                                <div>
                                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                        {edit
                                            ? "ویرایش مرحله"
                                            : "افزودن مرحله"}
                                    </h3>

                                    <p className="mt-0.5 text-[9.5px] text-gray-400">
                                        تنظیم روند فرآیند خرید
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="max-h-[calc(88vh-74px)] overflow-y-auto p-5">
                            <div className="flex flex-col gap-4">
                                <FloatingInput
                                    label="عنوان مرحله"
                                    value={title}
                                    onChange={(e) =>
                                        setTitle(e.target.value)
                                    }
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FloatingInput
                                        label="ترتیب"
                                        type="number"
                                        min={1}
                                        value={order}
                                        onChange={(e) =>
                                            setOrder(e.target.value)
                                        }
                                    />

                                    <div className="flex items-center gap-2 rounded-[1.35rem] bg-indigo-500/10 px-3 text-[10px] font-bold text-indigo-500">
                                        <Layers3 size={14} />
                                        مرحله{" "}
                                        {order || "-"}
                                    </div>
                                </div>

                                <FloatingTextarea
                                    label="توضیحات"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                />

                                <div>
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <Users
                                            size={14}
                                            className="text-gray-400"
                                        />

                                        <span className="text-[10.5px] font-extrabold text-gray-700 dark:text-white/75">
                                            مسئولان مرحله
                                        </span>

                                        <span className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[8.5px] font-bold text-indigo-500">
                                            {selected.length}
                                        </span>
                                    </div>

                                    <div className="grid max-h-[220px] grid-cols-1 gap-2 overflow-y-auto">
                                        {employees.map((employee) => {
                                            const checked =
                                                selected.includes(
                                                    employee.id
                                                );

                                            return (
                                                <button
                                                    key={employee.id}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleEmployee(
                                                            employee.id
                                                        )
                                                    }
                                                    className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-right transition-all ${checked
                                                            ? "border-indigo-500/20 bg-indigo-500/10"
                                                            : "border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.025]"
                                                        }`}
                                                >
                                                    <span className="text-[10px] font-bold text-gray-700 dark:text-white/75">
                                                        {
                                                            employee.employee_name
                                                        }
                                                    </span>

                                                    <span
                                                        className={`flex h-5 w-5 items-center justify-center rounded-lg ${checked
                                                                ? "bg-indigo-500 text-white"
                                                                : "bg-gray-200 text-transparent dark:bg-white/10"
                                                            }`}
                                                    >
                                                        <Check size={11} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-2xl bg-red-500/10 px-3 py-2.5 text-[10px] font-semibold text-red-500">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 rounded-2xl bg-gray-100 py-3 text-[10.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-white/70"
                                    >
                                        انصراف
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={loading}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-[10.5px] font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Check size={13} />
                                        )}

                                        {edit
                                            ? "ذخیره تغییرات"
                                            : "ایجاد مرحله"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}