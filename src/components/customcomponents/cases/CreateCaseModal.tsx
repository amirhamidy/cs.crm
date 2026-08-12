"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import FloatingInput from "@/components/customcomponents/shared/FloatingInput";
import type { Customer } from "@/types/customer";

type CaseFormState = {
    title: string;
    description: string;
    customer: string;
};

export type CreateCaseModalProps = {
    open: boolean;
    customers: Customer[];
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
};

const EMPTY_FORM: CaseFormState = {
    title: "",
    description: "",
    customer: "",
};

export default function CreateCaseModal({
    open,
    customers,
    onClose,
    onSuccess,
}: CreateCaseModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [form, setForm] = useState<CaseFormState>(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            setForm(EMPTY_FORM);
            setLoading(false);
            setError("");
        }
    }, [open]);

    const canSubmit = useMemo(() => {
        return Boolean(
            form.customer &&
            form.title.trim() &&
            form.description.trim() &&
            !loading
        );
    }, [form, loading]);

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setError("");

        try {
            await axiosInstance.post(apiRoutes.createCase, {
                title: form.title.trim(),
                description: form.description.trim(),
                customer: Number(form.customer),
            });

            await onSuccess();
            onClose();
            setForm(EMPTY_FORM);
        } catch (err) {
            console.error(err);
            setError("خطا در ساخت پرونده. دوباره امتحان کن.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassModal
            open={open}
            onClose={handleClose}
            title="ساخت پرونده جدید"
            description="پرونده را مستقل، شفاف و سریع بساز"
            icon={<Building2 size={18} />}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm text-slate-500 dark:text-slate-300">
                            مشتری
                        </label>
                        <select
                            value={form.customer}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    customer: e.target.value,
                                }))
                            }
                            className="h-14 w-full rounded-4xl border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                        >
                            <option value="">انتخاب مشتری</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name ?? customer.full_name ?? `مشتری ${customer.id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <FloatingInput
                            label="عنوان پرونده"
                            id="case_title"
                            value={form.title}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            className="border-slate-200 bg-white text-slate-900 focus:border-blue-500 dark:border-white/[0.08] dark:focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm text-slate-500 dark:text-slate-300">
                            توضیحات
                        </label>
                        <textarea
                            rows={5}
                            value={form.description}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            className="w-full rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                            placeholder="توضیح کوتاه درباره پرونده"
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="h-12 rounded-full border border-slate-200 px-5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]"
                    >
                        انصراف
                    </button>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Plus size={16} />
                        )}
                        <span>ساخت پرونده</span>
                    </button>
                </div>
            </form>
        </GlassModal>
    );
}
