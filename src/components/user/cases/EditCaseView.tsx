"use client";

import { useEffect, useState, forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { CaseItem } from "@/types/case";

import { BusyContent } from "@/components/ui/Button";
interface EditCaseViewProps {
    caseItem: CaseItem;
    onSuccess: (updatedCase: CaseItem) => void;
    onClose: () => void;
}

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <input
                ref={ref}
                id={id}
                placeholder=" "
                className={`peer w-full rounded-4xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#111827]"
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <textarea
                ref={ref}
                id={id}
                placeholder=" "
                rows={4}
                className={`peer w-full resize-none rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-5 top-4 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#111827]"
            >
                {label}
            </label>
        </div>
    )
);
FloatingTextarea.displayName = "FloatingTextarea";

export default function EditCaseView({ caseItem, onSuccess, onClose }: EditCaseViewProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(caseItem.title || "");
        setDescription(caseItem.description || "");
        setSubmitting(false);
        setSuccess(false);
        setError(null);
    }, [caseItem]);

    const canSubmit = Boolean(title.trim() && !submitting);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
            };

            const response = await axiosInstance.patch(
                `/tasks/api/v1/cases/${caseItem.id}/update/`,
                payload
            );

            const updatedCase: CaseItem = {
                ...caseItem,
                ...response.data,
                title: title.trim(),
                description: description.trim(),
            };

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSuccess(updatedCase);
                onClose();
            }, 1200);
        } catch {
            setError("خطا در ویرایش پرونده. دوباره امتحان کن.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div dir="rtl">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
                            <FloatingInput
                                label="عنوان پرونده"
                                id="edit_case_title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setError(null);
                                }}
                                disabled={submitting || success}
                                dir="rtl"
                            />

                            <FloatingTextarea
                                label="توضیحات"
                                id="edit_case_description"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    setError(null);
                                }}
                                disabled={submitting || success}
                                dir="rtl"
                            />

                            <AnimatePresence>
                                {error && (
                                    <m.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="flex items-center gap-2 rounded-2xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                    >
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span className="flex-1 font-medium">{error}</span>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                                {success ? (
                                    <m.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                    >
                                        <CheckCircle2 size={16} />
                                        تغییرات با موفقیت ذخیره شد
                                    </m.div>
                                ) : (
                                    <m.button
                                        key="submit"
                                        type="submit"
                                        disabled={!canSubmit}
                                        whileTap={{ scale: 0.97 }}
                                        className="relative flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        <BusyContent busy={submitting}>
                                            ذخیره تغییرات
                                        </BusyContent>
                                    </m.button>
                                )}
                            </AnimatePresence>
                        </form>
        </div>
    );
}