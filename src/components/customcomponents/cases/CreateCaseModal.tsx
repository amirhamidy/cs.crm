"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { Customer } from "@/types/customer";
import type { CaseItem } from "@/types/case";

type CreateCaseModalProps = {
    isOpen: boolean;
    customers: Customer[];
    onClose: () => void;
    onSuccess: (createdCase: CaseItem) => void | Promise<void>;
};

type CaseFormState = {
    title: string;
    description: string;
    customer: string;
};

const EMPTY_FORM: CaseFormState = {
    title: "",
    description: "",
    customer: "",
};

const getCustomerLabel = (customer: Customer) => {
    const item = customer as Customer & {
        name?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        company_name?: string;
    };

    return (
        item.name ||
        item.full_name ||
        item.company_name ||
        [item.first_name, item.last_name].filter(Boolean).join(" ") ||
        `مشتری شماره ${customer.id}`
    );
};

export default function CreateCaseModal({
    isOpen,
    customers,
    onClose,
    onSuccess,
}: CreateCaseModalProps) {
    const [form, setForm] = useState<CaseFormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setForm(EMPTY_FORM);
            setSubmitting(false);
            setError(null);
        }
    }, [isOpen]);

    const canSubmit = useMemo(() => {
        return Boolean(
            form.customer &&
            form.title.trim() &&
            form.description.trim()
        );
    }, [form]);

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            const response = await axiosInstance.post(
                apiRoutes.createCase,
                {
                    title: form.title.trim(),
                    description: form.description.trim(),
                    customer: Number(form.customer),
                }
            );

            await onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error("خطا در ساخت پرونده:", error);
            setError("خطا در ساخت پرونده. دوباره امتحان کن.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={handleClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-case-title"
                className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2
                            id="create-case-title"
                            className="text-xl font-semibold"
                        >
                            ساخت پرونده
                        </h2>

                        <p className="mt-1 text-sm text-white/55">
                            پرونده را مستقل از تسک بساز
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="case-customer"
                            className="block text-sm text-white/70"
                        >
                            مشتری
                        </label>

                        <select
                            id="case-customer"
                            value={form.customer}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    customer: event.target.value,
                                }))
                            }
                            className="h-14 w-full rounded-4xl border border-white/10 bg-[#101d2e] px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                        >
                            <option value="">انتخاب مشتری</option>

                            {customers.map((customer) => (
                                <option
                                    key={customer.id}
                                    value={customer.id}
                                >
                                    {getCustomerLabel(customer)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="case-title"
                            className="block text-sm text-white/70"
                        >
                            عنوان پرونده
                        </label>

                        <input
                            id="case-title"
                            value={form.title}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    title: event.target.value,
                                }))
                            }
                            className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                            placeholder="مثلاً قرارداد طراحی سایت"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="case-description"
                            className="block text-sm text-white/70"
                        >
                            توضیحات
                        </label>

                        <textarea
                            id="case-description"
                            rows={5}
                            value={form.description}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    description: event.target.value,
                                }))
                            }
                            className="w-full rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                            placeholder="توضیح کوتاه درباره پرونده"
                        />
                    </div>

                    {error && (
                        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="h-12 rounded-full border border-white/10 px-5 text-sm text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <Plus size={16} />
                        )}

                        <span>ساخت پرونده</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
