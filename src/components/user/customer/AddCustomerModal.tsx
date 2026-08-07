"use client";

import {
    useState,
    useEffect,
    forwardRef,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader } from "lucide-react";
import { Customer, CustomerFormData } from "@/types/customer";
import axiosInstance from "@/lib/axiosInstance";

const EMPTY_FORM: CustomerFormData = {
    full_name: "",
    job_title: "",
    phone_number: "",
    company_name: "",
    address: "",
    source: "",
    description: "",
    status: 1,
};

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
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
                className={`
          peer w-full rounded-2xl border border-gray-200
          bg-white px-4 py-3 text-sm text-black outline-none
          transition-all duration-200
          focus:border-blue-500
          [&:not(:placeholder-shown)]:border-blue-500
          dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
          dark:focus:border-violet-500
          dark:[&:not(:placeholder-shown)]:border-violet-500
          ${className}
        `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
          absolute right-4 top-1/2 -translate-y-1/2
          text-sm text-gray-400 pointer-events-none
          transition-all duration-200
          bg-white dark:bg-[#0f1117] px-1 rounded
          peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-blue-500
          peer-[:not(:placeholder-shown)]:top-0
          peer-[:not(:placeholder-shown)]:text-[11px]
          peer-[:not(:placeholder-shown)]:text-blue-500
          dark:peer-focus:text-violet-400
          dark:peer-[:not(:placeholder-shown)]:text-violet-400
        "
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <textarea
                ref={ref}
                id={id}
                placeholder=" "
                rows={3}
                className={`
          peer w-full rounded-2xl border border-gray-200
          bg-white px-4 py-3 text-sm text-black outline-none
          transition-all duration-200 resize-none
          focus:border-blue-500
          [&:not(:placeholder-shown)]:border-blue-500
          dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
          dark:focus:border-violet-500
          dark:[&:not(:placeholder-shown)]:border-violet-500
          ${className}
        `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
          absolute right-4 top-4
          text-sm text-gray-400 pointer-events-none
          transition-all duration-200
          bg-white dark:bg-[#0f1117] px-1 rounded
          peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-blue-500
          peer-[:not(:placeholder-shown)]:top-0
          peer-[:not(:placeholder-shown)]:text-[11px]
          peer-[:not(:placeholder-shown)]:text-blue-500
          dark:peer-focus:text-violet-400
          dark:peer-[:not(:placeholder-shown)]:text-violet-400
        "
            >
                {label}
            </label>
        </div>
    )
);
FloatingTextarea.displayName = "FloatingTextarea";

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdded: (c: Customer) => void;
}

export default function AddCustomerModal({
    isOpen,
    onClose,
    onAdded,
}: AddCustomerModalProps) {
    const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setForm(EMPTY_FORM);
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name.trim() || !form.phone_number.trim()) {
            setError("نام و شماره تماس اجباری‌ست");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.post<Customer>(
                "/customers/api/v1/customers/create/",
                form
            );
            onAdded(res.data);
            onClose();
        } catch {
            setError("خطا در ثبت مشتری. دوباره امتحان کن.");
        } finally {
            setLoading(false);
        }
    };

    const set =
        (key: keyof CustomerFormData) =>
            (
                e: React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                >
            ) =>
                setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <div
                        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10"
                        onClick={onClose}
                    >
                        <motion.div
                            className="
                w-full max-w-lg my-8
                bg-white dark:bg-[#0f1117]
                rounded-3xl shadow-xl
                border border-gray-100 dark:border-white/[0.07]
                p-6
              "
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                    افزودن مشتری جدید
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X size={16} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <FloatingInput
                                        label="نام کامل *"
                                        id="full_name"
                                        type="text"
                                        value={form.full_name}
                                        onChange={set("full_name")}
                                    />
                                    <FloatingInput
                                        label="شماره تماس *"
                                        id="phone_number"
                                        type="tel"
                                        dir="ltr"
                                        inputMode="tel"
                                        value={form.phone_number}
                                        onChange={set("phone_number")}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <FloatingInput
                                        label="عنوان شغلی"
                                        id="job_title"
                                        type="text"
                                        value={form.job_title}
                                        onChange={set("job_title")}
                                    />
                                    <FloatingInput
                                        label="نام شرکت"
                                        id="company_name"
                                        type="text"
                                        value={form.company_name}
                                        onChange={set("company_name")}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <FloatingInput
                                        label="آدرس"
                                        id="address"
                                        type="text"
                                        value={form.address}
                                        onChange={set("address")}
                                    />
                                    <FloatingInput
                                        label="منبع"
                                        id="source"
                                        type="text"
                                        value={form.source}
                                        onChange={set("source")}
                                    />
                                </div>

                                <FloatingTextarea
                                    label="توضیحات"
                                    id="description"
                                    value={form.description}
                                    onChange={set("description")}
                                />

                                <div className="relative">
                                    <select
                                        id="status"
                                        value={form.status}
                                        onChange={set("status")}
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
                                        htmlFor="status"
                                        className="
                      absolute right-4 -top-2 text-[11px]
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
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
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
                                        className="flex-1 py-2.5 rounded-full text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        انصراف
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading && <Loader size={14} className="animate-spin" />}
                                        ثبت مشتری
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
