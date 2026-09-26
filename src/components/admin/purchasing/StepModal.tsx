"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Layers3, Loader2, Users, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingEmployee, ApiPurchasingStep } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";
import { FloatingInput, FloatingTextarea } from "./FormControls";

interface Props {
    open: boolean;
    step?: ApiPurchasingStep | null;
    steps: ApiPurchasingStep[];
    employees: ApiPurchasingEmployee[];
    onClose: () => void;
    onSaved: () => void;
}

export default function StepModal({ open, step, steps, employees, onClose, onSaved }: Props) {
    const { currentEmployeeId, isAdmin } = usePurchasingAccess();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isEditing = !!step;

    useEffect(() => {
        if (!open) return;
        setTitle(step?.title ?? "");
        setDescription(step?.description ?? "");
        setSelectedIds(step?.employees ?? []);
        setErrorMessage("");
    }, [open, step]);

    const toggleEmployee = (id: number) => {
        setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setErrorMessage("عنوان مرحله الزامی است.");
            return;
        }

        setSaving(true);
        setErrorMessage("");

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                employees: selectedIds,
                order: step?.order ?? (steps.length ? Math.max(...steps.map((item) => item.order)) + 1 : 1),
            };

            if (isEditing) {
                await axiosInstance.patch(`/purchasing/api/v1/steps/${step.id}/patch/`, payload);
            } else {
                await axiosInstance.post("/purchasing/api/v1/steps/create/", payload);
            }

            onSaved();
            onClose();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string; message?: string; error?: string } } };
            setErrorMessage(e?.response?.data?.detail || e?.response?.data?.message || e?.response?.data?.error || "ذخیره مرحله انجام نشد.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14 }}
                        transition={{ duration: 0.2 }}
                        className="max-h-[88vh] w-full max-w-[470px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                                    <Layers3 size={16} />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{isEditing ? "ویرایش مرحله" : "افزودن مرحله"}</h3>
                                    <p className="mt-0.5 text-[10px] font-medium text-gray-400">تنظیم روند فرآیند خرید</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="max-h-[calc(88vh-74px)] overflow-y-auto p-5">
                            <div className="flex flex-col gap-4">
                                <FloatingInput label="عنوان مرحله" value={title} onChange={(event) => setTitle(event.target.value)} />
                                <FloatingTextarea label="توضیحات" value={description} onChange={(event) => setDescription(event.target.value)} />

                                <div>
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <Users size={14} className="text-gray-400" />
                                        <span className="text-[10.5px] font-extrabold text-gray-900 dark:text-white">مسئولان مرحله</span>
                                        <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-300">
                                            {selectedIds.length}
                                        </span>
                                    </div>

                                    <div className="grid max-h-[220px] grid-cols-1 gap-2 overflow-y-auto">
                                        {employees.map((employee) => {
                                            const checked = selectedIds.includes(employee.id);
                                            const isSelf = !isAdmin && employee.employee === currentEmployeeId;

                                            return (
                                                <button
                                                    key={employee.id}
                                                    type="button"
                                                    onClick={() => toggleEmployee(employee.id)}
                                                    className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-right transition-all ${checked
                                                        ? "border-indigo-500/30 bg-indigo-500/10"
                                                        : "border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{employee.employee_name}</span>
                                                        {isSelf && (
                                                            <span className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-1.5 py-0.5 text-[8px] font-bold text-indigo-600 dark:text-indigo-300">
                                                                <Crown size={8} />
                                                                شما
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`flex h-5 w-5 items-center justify-center rounded-lg ${checked ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white" : "bg-gray-200 text-transparent dark:bg-white/[0.1]"
                                                            }`}
                                                    >
                                                        <Check size={11} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="rounded-2xl bg-red-50 px-3 py-2.5 text-[10px] font-semibold text-red-500 dark:bg-red-500/10">{errorMessage}</div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={saving}
                                        className="flex-1 rounded-2xl bg-gray-100 py-3 text-[10.5px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-300"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-[10.5px] font-extrabold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={13} />}
                                        {isEditing ? "ذخیره تغییرات" : "ایجاد مرحله"}
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