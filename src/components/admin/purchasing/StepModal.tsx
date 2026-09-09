"use client";

import {
    useEffect,
    useState,
    type InputHTMLAttributes,
    type TextareaHTMLAttributes,
} from "react";
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

/**
 * Static-label field variants used only in this modal: the label sits
 * fixed above the field instead of floating/animating on focus.
 */
const FIELD_CLASS =
    "w-full rounded-2xl border border-[#DCEAFB] bg-white px-4 py-3 text-[11.5px] font-semibold text-[#0F2647] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 dark:border-[rgba(96,165,250,0.18)] dark:bg-[#0E1F38] dark:text-[#EAF2FF] dark:focus:border-[#38BDF8] dark:focus:ring-[#38BDF8]/10";

const LABEL_CLASS =
    "px-1 text-[10.5px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]";

function LabeledInput({
    label,
    className = "",
    ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>{label}</label>
            <input {...props} className={`${FIELD_CLASS} ${className}`} />
        </div>
    );
}

function LabeledTextarea({
    label,
    className = "",
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>{label}</label>
            <textarea
                {...props}
                className={`min-h-[110px] resize-none leading-6 ${FIELD_CLASS} ${className}`}
            />
        </div>
    );
}

interface Props {
    open: boolean;
    step?: ApiPurchasingStep | null;
    steps: ApiPurchasingStep[];
    employees: ApiPurchasingEmployee[];
    onClose: () => void;
    onSaved: () => void;
}

export default function StepModal({
    open,
    step,
    steps,
    employees,
    onClose,
    onSaved,
}: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selected, setSelected] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const edit = !!step;

    useEffect(() => {
        if (!open) return;

        setTitle(step?.title ?? "");
        setDescription(step?.description ?? "");
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

        try {
            setLoading(true);
            setError("");

            const payload = {
                title: title.trim(),
                description: description.trim(),
                employees: selected,
                order:
                    step?.order ??
                    (steps.length
                        ? Math.max(
                            ...steps.map((item) => item.order)
                        ) + 1
                        : 1),
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B18]/55 p-4 backdrop-blur-sm"
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
                        className="max-h-[88vh] w-full max-w-[470px] overflow-hidden rounded-[2rem] border border-[#DCEAFB] bg-white shadow-2xl dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]"
                    >
                        <div className="flex items-center justify-between border-b border-[#DCEAFB] px-5 py-4 dark:border-[rgba(96,165,250,0.12)]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB]/15 to-[#06B6D4]/15 text-[#2563EB] dark:text-[#38BDF8]">
                                    <Layers3 size={16} />
                                </div>

                                <div>
                                    <h3 className="text-[13px] font-extrabold text-[#0F2647] dark:text-white">
                                        {edit
                                            ? "ویرایش مرحله"
                                            : "افزودن مرحله"}
                                    </h3>

                                    <p className="mt-0.5 text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">
                                        تنظیم روند فرآیند خرید
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

                        <div className="max-h-[calc(88vh-74px)] overflow-y-auto p-5">
                            <div className="flex flex-col gap-4">
                                <LabeledInput
                                    label="عنوان مرحله"
                                    value={title}
                                    onChange={(e) =>
                                        setTitle(e.target.value)
                                    }
                                />

                                <LabeledTextarea
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
                                            className="text-[#5D7595] dark:text-[#8FAAD1]"
                                        />

                                        <span className="text-[10.5px] font-extrabold text-[#0F2647] dark:text-white">
                                            مسئولان مرحله
                                        </span>

                                        <span className="rounded-lg bg-[#2563EB]/10 px-2 py-1 text-[8.5px] font-bold text-[#2563EB] dark:text-[#38BDF8]">
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
                                                        ? "border-[#2563EB]/30 bg-[#2563EB]/10"
                                                        : "border-[#DCEAFB] bg-[#F3F8FF] dark:border-[rgba(96,165,250,0.12)] dark:bg-[rgba(96,165,250,0.04)]"
                                                        }`}
                                                >
                                                    <span className="text-[10px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">
                                                        {
                                                            employee.employee_name
                                                        }
                                                    </span>

                                                    <span
                                                        className={`flex h-5 w-5 items-center justify-center rounded-lg ${checked
                                                            ? "bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white"
                                                            : "bg-[#DCEAFB] text-transparent dark:bg-[rgba(96,165,250,0.12)]"
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
                                    <div className="rounded-2xl bg-rose-500/10 px-3 py-2.5 text-[10px] font-semibold text-rose-500">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
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
                                        disabled={loading}
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