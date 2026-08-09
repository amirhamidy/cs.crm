"use client";

import {
    useState,
    useEffect,
    useCallback,
    forwardRef,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader, SquarePen, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { Customer, CustomerFormData } from "@/types/customer";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", value, ...props }, ref) => {
        const hasValue = value !== undefined && value !== null && value !== "";

        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=" "
                    className={`
                        peer w-full rounded-2xl border border-gray-200
                        bg-white px-4 py-3 text-sm text-black outline-none
                        transition-all duration-200
                        focus:border-blue-500
                        ${hasValue ? "border-blue-500 dark:border-violet-500" : ""}
                        dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
                        dark:focus:border-violet-500
                        ${className}
                    `}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`
                        absolute right-4 pointer-events-none
                        transition-all duration-200
                        bg-white dark:bg-[#0f1117] px-1 rounded
                        text-sm text-gray-400
                        peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-blue-500
                        dark:peer-focus:text-violet-400
                        ${hasValue
                            ? "top-0 text-[11px] text-blue-500 dark:text-violet-400"
                            : "top-1/2 -translate-y-1/2"
                        }
                    `}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const FloatingTextarea = forwardRef<
    HTMLTextAreaElement,
    FloatingTextareaProps
>(({ label, id, className = "", value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && value !== "";

    return (
        <div className="relative">
            <textarea
                ref={ref}
                id={id}
                value={value}
                placeholder=" "
                rows={3}
                className={`
                    peer w-full rounded-2xl border border-gray-200
                    bg-white px-4 py-3 text-sm text-black outline-none
                    transition-all duration-200 resize-none
                    focus:border-blue-500
                    ${hasValue ? "border-blue-500 dark:border-violet-500" : ""}
                    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
                    dark:focus:border-violet-500
                    ${className}
                `}
                {...props}
            />
            <label
                htmlFor={id}
                className={`
                    absolute right-4 pointer-events-none
                    transition-all duration-200
                    bg-white dark:bg-[#0f1117] px-1 rounded
                    text-sm text-gray-400
                    peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-blue-500
                    dark:peer-focus:text-violet-400
                    ${hasValue
                        ? "-top-2.5 text-[11px] text-blue-500 dark:text-violet-400"
                        : "top-4"
                    }
                `}
            >
                {label}
            </label>
        </div>
    );
});
FloatingTextarea.displayName = "FloatingTextarea";

interface Props {
    customer: Customer;
    isOpen: boolean;
    onClose: () => void;
    onEdited: (updated: Customer) => void;
}

const EMPTY_FORM: CustomerFormData = {
    full_name: "",
    phone_number: "",
    job_title: "",
    company_name: "",
    address: "",
    source: "",
    description: "",
    status: 1,
};

export default function CustomerEditModal({
    customer,
    isOpen,
    onClose,
    onEdited,
}: Props) {
    const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !customer?.id) return;

        const fetchCustomerDetails = async () => {
            setIsLoadingDetails(true);
            setError(null);
            try {
                const { data } = await axiosInstance.get<Customer>(
                    `/customers/api/v1/customers/${customer.id}/`
                );
                setForm({
                    full_name: data.full_name || "",
                    phone_number: data.phone_number || "",
                    job_title: data.job_title || "",
                    company_name: data.company_name || "",
                    address: data.address || "",
                    source: data.source || "",
                    description: data.description || "",
                    status: data.status || 1,
                });
            } catch {
                setError("خطا در دریافت اطلاعات مشتری از سرور.");
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchCustomerDetails();
    }, [isOpen, customer?.id]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting && !isLoadingDetails) onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, isSubmitting, isLoadingDetails, onClose]);

    const setField = useCallback(
        (key: keyof CustomerFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setForm((f) => ({ ...f, [key]: e.target.value })),
        []
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.full_name.trim() || !form.phone_number.trim()) {
            setError("نام و شماره تماس اجباری‌ست");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { data } = await axiosInstance.patch<Customer>(
                `/customers/api/v1/customers/${customer.id}/update/`,
                form
            );
            onEdited(data);
            onClose();
        } catch {
            setError("خطا در ذخیره تغییرات. دوباره امتحان کن.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = () => {
        if (!isSubmitting && !isLoadingDetails) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="edit-backdrop"
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleBackdropClick}
                    />
                    <div
                        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10"
                        onClick={handleBackdropClick}
                    >
                        <motion.div
                            key="edit-modal"
                            className="
                                w-full max-w-lg my-8
                                bg-white dark:bg-[#0f1117]
                                rounded-3xl shadow-xl
                                border border-gray-100 dark:border-white/[0.07]
                                p-6
                            "
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center">
                                        <SquarePen className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-base font-extrabold text-gray-900 dark:text-white">
                                            ویرایش مشتری
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-white/40 truncate max-w-[180px]">
                                            {customer.full_name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting || isLoadingDetails}
                                    aria-label="بستن"
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                                >
                                    <X size={16} className="text-gray-400" />
                                </button>
                            </div>

                            {isLoadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 dark:text-violet-400" />
                                    <span className="text-xs text-gray-450 dark:text-white/40">در حال دریافت اطلاعات کامل مشتری...</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FloatingInput
                                            label="نام کامل *"
                                            id="edit_full_name"
                                            type="text"
                                            autoComplete="name"
                                            value={form.full_name}
                                            onChange={setField("full_name")}
                                        />
                                        <FloatingInput
                                            label="شماره تماس *"
                                            id="edit_phone_number"
                                            type="tel"
                                            dir="ltr"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            value={form.phone_number}
                                            onChange={setField("phone_number")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FloatingInput
                                            label="عنوان شغلی"
                                            id="edit_job_title"
                                            type="text"
                                            value={form.job_title}
                                            onChange={setField("job_title")}
                                        />
                                        <FloatingInput
                                            label="نام شرکت"
                                            id="edit_company_name"
                                            type="text"
                                            value={form.company_name}
                                            onChange={setField("company_name")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FloatingInput
                                            label="آدرس"
                                            id="edit_address"
                                            type="text"
                                            value={form.address}
                                            onChange={setField("address")}
                                        />
                                        <FloatingInput
                                            label="منبع"
                                            id="edit_source"
                                            type="text"
                                            value={form.source}
                                            onChange={setField("source")}
                                        />
                                    </div>

                                    <FloatingTextarea
                                        label="توضیحات"
                                        id="edit_description"
                                        value={form.description}
                                        onChange={setField("description")}
                                    />

                                    <div className="relative">
                                        <select
                                            id="edit_status"
                                            value={form.status}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    status: Number(e.target.value),
                                                }))
                                            }
                                            className="
                                                w-full rounded-2xl border border-gray-200
                                                bg-white px-4 py-3 text-sm text-black outline-none
                                                transition-all duration-200 appearance-none cursor-pointer
                                                focus:border-blue-500
                                                dark:bg-white/[0.04] dark:border-white/[0.08]
                                                dark:text-white dark:focus:border-violet-500
                                            "
                                        >
                                            <option value={1}>مشتری بالقوه</option>
                                            <option value={2}>مشتری فعال</option>
                                            <option value={3}>غیرفعال</option>
                                        </select>
                                        <label
                                            htmlFor="edit_status"
                                            className="
                                                absolute right-4 -top-2.5 text-[11px]
                                                text-blue-500 dark:text-violet-400
                                                pointer-events-none
                                                bg-white dark:bg-[#0f1117] px-1 rounded
                                            "
                                        >
                                            وضعیت
                                        </label>
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.p
                                                key="edit-error"
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="text-xs text-red-500 font-semibold"
                                            >
                                                {error}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="flex-1 py-2.5 rounded-full text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                        >
                                            انصراف
                                        </button>
                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting && (
                                                <Loader size={14} className="animate-spin" />
                                            )}
                                            ذخیره تغییرات
                                        </motion.button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
