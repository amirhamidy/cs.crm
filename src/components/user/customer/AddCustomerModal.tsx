"use client";

import {
    useState,
    useEffect,
    forwardRef,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, CheckCircle2, Loader } from "lucide-react";
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
                className={`peer w-full border border-gray-200 rounded-4xl px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
                className={`peer w-full border border-gray-200 rounded-3xl px-5 py-3 text-sm text-black outline-none transition-all duration-200 resize-none focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className="absolute right-5 top-4 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
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
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setForm(EMPTY_FORM);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (loading || success) return;
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name.trim() || !form.phone_number.trim() || loading) {
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
            setSuccess(true);
            onAdded(res.data);
            setTimeout(onClose, 1400);
        } catch {
            setError("خطا در ثبت مشتری. دوباره امتحان کن.");
        } finally {
            setLoading(false);
        }
    };

    const set = (key: keyof CustomerFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/[0.06] w-full max-w-lg overflow-hidden my-8"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <UserPlus size={15} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        مشتری جدید
                                    </h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        ثبت اطلاعات مشتری در Clientra
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading || success}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 bg-gray-100 dark:bg-white/[0.05]"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="px-8 pb-8 flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingInput
                                    label="نام کامل *"
                                    id="full_name"
                                    value={form.full_name}
                                    onChange={set("full_name")}
                                />
                                <FloatingInput
                                    label="شماره تماس *"
                                    id="phone_number"
                                    dir="ltr"
                                    value={form.phone_number}
                                    onChange={set("phone_number")}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingInput
                                    label="عنوان شغلی"
                                    id="job_title"
                                    value={form.job_title}
                                    onChange={set("job_title")}
                                />
                                <FloatingInput
                                    label="نام شرکت"
                                    id="company_name"
                                    value={form.company_name}
                                    onChange={set("company_name")}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingInput
                                    label="آدرس"
                                    id="address"
                                    value={form.address}
                                    onChange={set("address")}
                                />
                                <FloatingInput
                                    label="منبع آشنایی"
                                    id="source"
                                    value={form.source}
                                    onChange={set("source")}
                                />
                            </div>

                            <FloatingTextarea
                                label="توضیحات تکمیلی"
                                id="description"
                                value={form.description}
                                onChange={set("description")}
                            />

                            <div className="relative">
                                <select
                                    id="status"
                                    value={form.status}
                                    onChange={set("status")}
                                    className="w-full rounded-4xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none appearance-none cursor-pointer focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500"
                                >
                                    <option value={1}>مشتری بالقوه</option>
                                    <option value={2}>مشتری فعال</option>
                                    <option value={3}>غیرفعال</option>
                                </select>
                                <label className="absolute right-5 -top-2 text-[10px] text-gray-500 bg-white dark:bg-[#0f172a] px-1.5 rounded">
                                    وضعیت مشتری
                                </label>
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[11.5px] text-red-500 font-bold text-center"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                {success ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                    >
                                        <CheckCircle2 size={16} />
                                        مشتری با موفقیت ثبت شد
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="submit"
                                        type="submit"
                                        disabled={loading}
                                        whileTap={{ scale: 0.97 }}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-3 text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader size={18} className="animate-spin" /> : "ثبت مشتری"}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
